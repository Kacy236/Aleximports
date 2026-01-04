import z from "zod";
import axios from "axios";
import { TRPCError } from "@trpc/server";
import { baseProcedure, createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { Media, Tenant } from "@/payload-types";
import { CheckoutMetadata, ProductMetadata } from "../types";
import { generateTenantURL } from "@/lib/utils";

/**
 * Checkout router
 * * Option A: Backend automatically creates a real Paystack subaccount
 * in both test and live modes.
 */

export const checkoutRouter = createTRPCRouter({
  /**
   * VERIFY TENANT BANK ACCOUNT & CREATE SUBACCOUNT (test+live)
   */
  verify: protectedProcedure.mutation(async ({ ctx }) => {
    const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY!;
    if (!PAYSTACK_SECRET_KEY) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "PAYSTACK_SECRET_KEY is not configured on the server.",
      });
    }

    const isTestMode = PAYSTACK_SECRET_KEY.startsWith("sk_test_");

    // Find current user
    const user = await ctx.db.findByID({
      collection: "users",
      id: ctx.session.user.id,
      depth: 0,
    });
    if (!user) throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });

    // Resolve tenant id from user's tenants relation
    const tenantId = user.tenants?.[0]?.tenant as string;
    if (!tenantId)
      throw new TRPCError({ code: "BAD_REQUEST", message: "User is not linked to any tenant." });

    const tenant = await ctx.db.findByID({ collection: "tenants", id: tenantId });
    if (!tenant) throw new TRPCError({ code: "NOT_FOUND", message: "Tenant not found" });

    if (!tenant.bankCode || !tenant.accountNumber)
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Tenant bank details are missing (bankCode or accountNumber).",
      });

    // Determine platform fee (10% default)
    const platformFeePercentage = Number(tenant.platformFeePercentage ?? 10);

    // If tenant already has a subaccount code, return success (idempotent)
    if (tenant.paystackSubaccountCode) {
      console.log("Tenant already has subaccount:", tenant.paystackSubaccountCode);
      await ctx.db.update({
        collection: "tenants",
        id: tenant.id,
        data: { platformFeePercentage: platformFeePercentage, paystackDetailsSubmitted: true },
      });

      return {
        success: true,
        message: `✅ Subaccount already exists for ${tenant.name}`,
      };
    }

    try {
      let accountName = tenant.accountName ?? `${tenant.name}`;

      // If live mode: verify bank details first
      if (!isTestMode) {
        try {
          const verifyResponse = await axios.get(
            `https://api.paystack.co/bank/resolve?account_number=${tenant.accountNumber}&bank_code=${tenant.bankCode}`,
            { headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY}` } }
          );

          accountName = verifyResponse.data?.data?.account_name;
          if (!accountName) {
            throw new Error("Bank resolution returned no account name");
          }
        } catch (err: any) {
          console.error("Bank resolve failed:", err?.response?.data || err.message || err);
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Unable to verify bank details with Paystack. Please confirm bank code and account number.",
          });
        }
      } else {
        console.log("Test mode: skipping bank/resolve and proceeding to create test subaccount on Paystack.");
      }

      // Create Paystack subaccount
      const subaccountPayload: Record<string, any> = {
        business_name: tenant.name,
        settlement_bank: tenant.bankCode,
        account_number: tenant.accountNumber,
        percentage_charge: platformFeePercentage,
        primary_contact_email: user.email ?? undefined,
        metadata: { tenantId: tenant.id },
      };

      const subaccountResponse = await axios.post(
        "https://api.paystack.co/subaccount",
        subaccountPayload,
        {
          headers: {
            Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
            "Content-Type": "application/json",
          },
        }
      );

      const subaccountCode = subaccountResponse.data?.data?.subaccount_code;
      if (!subaccountCode) {
        console.error("Paystack subaccount create response:", subaccountResponse.data);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create Paystack subaccount (no code returned).",
        });
      }

      // Update tenant record
      await ctx.db.update({
        collection: "tenants",
        id: tenant.id,
        data: {
          accountName,
          paystackSubaccountCode: subaccountCode,
          platformFeePercentage,
          paystackDetailsSubmitted: true,
        },
      });

      console.log("✅ Paystack subaccount created:", subaccountCode);
      return { success: true, message: `✅ Subaccount created successfully for ${accountName}` };
    } catch (error: any) {
      console.error("PAYSTACK VERIFY ERROR >>>", error?.response?.data || error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: error?.response?.data?.message || "Paystack verification/subaccount creation failed.",
      });
    }
  }),

  /**
   * PURCHASE: initialize Paystack transaction
   */
  purchase: protectedProcedure
    .input(
      z.object({
        // ✅ FIX: Accepts items array with quantity
        items: z.array(z.object({
          id: z.string(),
          quantity: z.number().min(1)
        })).min(1),
        tenantSlug: z.string().min(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const productIds = input.items.map(i => i.id);

      // Fetch products scoped to tenant slug
      const products = await ctx.db.find({
        collection: "products",
        depth: 1, 
        where: {
          and: [
            { id: { in: productIds } },
            { "tenant.slug": { equals: input.tenantSlug } },
            { isArchived: { not_equals: true } },
          ],
        },
      });

      if (products.totalDocs !== productIds.length)
        throw new TRPCError({ code: "NOT_FOUND", message: "Products not found" });

      // Fetch tenant
      const tenantsData = await ctx.db.find({
        collection: "tenants",
        limit: 1,
        pagination: false,
        where: { slug: { equals: input.tenantSlug } },
      });
      const tenant = tenantsData.docs[0] as Tenant | undefined;
      if (!tenant) throw new TRPCError({ code: "NOT_FOUND", message: "Tenant not found" });

      // Ensure tenant has a Paystack subaccount code — if not, try to create it
      if (!tenant.paystackSubaccountCode) {
        console.log("Tenant missing subaccount code, attempting to create it before purchase.");
        try {
          await ctx.db.update({
            collection: "tenants",
            id: tenant.id,
            data: { platformFeePercentage: Number(tenant.platformFeePercentage ?? 10) },
          });

          const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY!;
          const platformFeePercentage = Number(tenant.platformFeePercentage ?? 10);

          const subResp = await axios.post(
            "https://api.paystack.co/subaccount",
            {
              business_name: tenant.name,
              settlement_bank: tenant.bankCode,
              account_number: tenant.accountNumber,
              percentage_charge: platformFeePercentage,
              primary_contact_email: ctx.session.user.email ?? undefined,
              metadata: { tenantId: tenant.id },
            },
            {
              headers: {
                Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
                "Content-Type": "application/json",
              },
            }
          );

          const subaccountCode = subResp.data?.data?.subaccount_code;
          if (!subaccountCode) {
            console.error("Subaccount create during purchase failed:", subResp.data);
            throw new Error("Failed to create Paystack subaccount for tenant.");
          }

          await ctx.db.update({
            collection: "tenants",
            id: tenant.id,
            data: { paystackSubaccountCode: subaccountCode, paystackDetailsSubmitted: true },
          });

          tenant.paystackSubaccountCode = subaccountCode;
        } catch (err: any) {
          console.error("Failed to auto-create subaccount during purchase:", err?.response?.data || err);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: err?.response?.data?.message || "Tenant subaccount missing and automatic creation failed.",
          });
        }
      }

      // ✅ FIX: Calculate total using products multiplied by user quantity
      const totalAmount = products.docs.reduce((acc, p) => {
        const cartItem = input.items.find(i => i.id === p.id);
        const qty = cartItem?.quantity || 1;
        const price = isNaN(Number(p.price)) ? 0 : Number(p.price);
        return acc + (price * qty);
      }, 0) * 100;

      if (totalAmount <= 0) throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid amount" });

      try {
        const domain = generateTenantURL(input.tenantSlug);
        const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY!;

        const initResponse = await axios.post(
          "https://api.paystack.co/transaction/initialize",
          {
            email: ctx.session.user.email,
            amount: Math.round(totalAmount),
            subaccount: tenant.paystackSubaccountCode,
            callback_url: `${domain}/checkout?success=true`,
            metadata: {
              userId: ctx.session.user.id,
              tenantId: tenant.id,
              // ✅ Pass detailed product metadata with quantities
              products: products.docs.map((p) => {
                 const qty = input.items.find(i => i.id === p.id)?.quantity || 1;
                 return { id: p.id, name: p.name, price: p.price, quantity: qty };
              }),
            } as CheckoutMetadata,
            currency: "NGN",
          },
          {
            headers: {
              Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
              "Content-Type": "application/json",
            },
          }
        );

        const { data } = initResponse.data;
        if (!data?.authorization_url)
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to create Paystack checkout session" });

        return { url: data.authorization_url };
      } catch (error: any) {
        console.error("PAYSTACK PURCHASE ERROR >>>", error?.response?.data || error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error?.response?.data?.message || "Paystack error",
        });
      }
    }),

  /**
   * GET PRODUCTS
   */
  getProducts: baseProcedure
    .input(z.object({ ids: z.array(z.string()) }))
    .query(async ({ ctx, input }) => {
      const data = await ctx.db.find({
        collection: "products",
        depth: 2, 
        where: {
          and: [{ id: { in: input.ids } }, { isArchived: { not_equals: true } }],
        },
      });

      if (data.totalDocs !== input.ids.length)
        throw new TRPCError({ code: "NOT_FOUND", message: "Products not found" });

      const totalPrice = data.docs.reduce((acc, product) => acc + (isNaN(Number(product.price)) ? 0 : Number(product.price)), 0);

      return {
        ...data,
        totalPrice,
        docs: data.docs.map((doc) => ({
          ...doc,
          images: doc.images, 
          tenant: doc.tenant as Tenant & { image: Media | null },
        })),
      };
    }),
});