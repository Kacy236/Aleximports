import z from "zod";
import axios from "axios";
import { TRPCError } from "@trpc/server";
import { baseProcedure, createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { Media, Tenants } from "@/payload-types";
import { CheckoutMetadata, ProductMetadata } from "../types";
import { generateTenantURL } from "@/lib/utils";

export const checkoutRouter = createTRPCRouter({

  /**
   * ✅ VERIFY TENANT BANK ACCOUNT (Creates Paystack subaccount)
   */
  verify: protectedProcedure.mutation(async ({ ctx }) => {
    const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY!;
    const isTestMode = PAYSTACK_SECRET_KEY.startsWith("sk_test_");

    // Step 1️⃣: Find current user
    const user = await ctx.db.findByID({
      collection: "users",
      id: ctx.session.user.id,
      depth: 0,
    });

    if (!user) throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });

    const tenantId = user.tenants?.[0]?.tenant as string;
    if (!tenantId)
      throw new TRPCError({ code: "BAD_REQUEST", message: "User is not linked to any tenant." });

    const tenant = await ctx.db.findByID({ collection: "tenants", id: tenantId });
    if (!tenant)
      throw new TRPCError({ code: "NOT_FOUND", message: "Tenant not found" });

    if (!tenant.bankCode || !tenant.accountNumber)
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Tenant bank details are missing (bankCode or accountNumber).",
      });

    // Step 2️⃣: Determine platform fee (10% default)
    const platformFeePercentage = Number(tenant.platformFeePercentage ?? 10);

    // 🧪 Step 3️⃣: Test mode shortcut
    if (isTestMode) {
      const mockSubaccountCode = "SUB_TEST_" + Math.floor(Math.random() * 1000000);
      console.log("💡 Paystack mocked in test mode with code:", mockSubaccountCode);

      await ctx.db.update({
        collection: "tenants",
        id: tenant.id,
        data: {
          accountName: `${tenant.name} (Test)`,
          paystackSubaccountCode: mockSubaccountCode,
          platformFeePercentage: platformFeePercentage,
          paystackDetailsSubmitted: true,
        },
      });

      return {
        success: true,
        message: `✅ (Test Mode) Subaccount created for ${tenant.name}`,
      };
    }

    // 🏦 Step 4️⃣: Real Paystack verification (live mode)
    try {
      // Verify bank account details
      const verifyResponse = await axios.get(
        `https://api.paystack.co/bank/resolve?account_number=${tenant.accountNumber}&bank_code=${tenant.bankCode}`,
        { headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY}` } }
      );

      const accountName = verifyResponse.data?.data?.account_name;
      if (!accountName)
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Unable to verify bank details with Paystack.",
        });

      // Create Paystack subaccount
      const subaccountResponse = await axios.post(
        "https://api.paystack.co/subaccount",
        {
          business_name: tenant.name,
          settlement_bank: tenant.bankCode,
          account_number: tenant.accountNumber,
          percentage_charge: platformFeePercentage, // ✅ platform keeps 10%
          primary_contact_email: user.email,
          metadata: { tenantId: tenant.id },
        },
        {
          headers: {
            Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
            "Content-Type": "application/json",
          },
        }
      );

      const subaccountCode = subaccountResponse.data?.data?.subaccount_code;
      if (!subaccountCode)
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create Paystack subaccount.",
        });

      // Update tenant record in DB
      await ctx.db.update({
        collection: "tenants",
        id: tenant.id,
        data: {
          accountName,
          paystackSubaccountCode: subaccountCode,
          platformFeePercentage: platformFeePercentage,
          paystackDetailsSubmitted: true,
        },
      });

      return {
        success: true,
        message: `✅ Subaccount created successfully for ${accountName}`,
      };
    } catch (error: any) {
      console.error("PAYSTACK VERIFY ERROR >>>", error?.response?.data || error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: error?.response?.data?.message || "Paystack verification failed.",
      });
    }
  }),

  /**
   * 🛒 PURCHASE (Paystack checkout using subaccount with automatic platform fee)
   */
  purchase: protectedProcedure
    .input(
      z.object({
        productIds: z.array(z.string()).min(1),
        tenantSlug: z.string().min(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Get products for this tenant
      const products = await ctx.db.find({
        collection: "products",
        depth: 2,
        where: {
          and: [
            { id: { in: input.productIds } },
            { "tenant.slug": { equals: input.tenantSlug } },
            { isArchived: { not_equals: true } },
          ],
        },
      });

      if (products.totalDocs !== input.productIds.length)
        throw new TRPCError({ code: "NOT_FOUND", message: "Products not found" });

      // Get tenant info
      const tenantsData = await ctx.db.find({
        collection: "tenants",
        limit: 1,
        pagination: false,
        where: { slug: { equals: input.tenantSlug } },
      });

      const tenant = tenantsData.docs[0];
      if (!tenant)
        throw new TRPCError({ code: "NOT_FOUND", message: "Tenant not found" });

      const totalAmount =
        products.docs.reduce(
          (acc, p) => acc + (isNaN(Number(p.price)) ? 0 : Number(p.price)),
          0
        ) * 100;

      if (totalAmount <= 0)
        throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid amount" });

      try {
        // ✅ Default platform fee = 10% unless tenant override exists
        const PLATFORM_FEE_PERCENTAGE = Number(tenant.platformFeePercentage ?? 10);

        const domain = generateTenantURL(input.tenantSlug);

        const response = await axios.post(
          "https://api.paystack.co/transaction/initialize",
          {
            email: ctx.session.user.email,
            amount: totalAmount,
            subaccount: tenant.paystackSubaccountCode, // funds go to tenant
            transaction_charge: 0, // Paystack automatically deducts your percentage charge
            callback_url: `${domain}/checkout?success=true`,
            metadata: {
              userId: ctx.session.user.id,
              products: products.docs.map((p) => ({
                id: p.id,
                name: p.name,
                price: p.price,
              })) as ProductMetadata[],
              tenantId: tenant.id,
            } as CheckoutMetadata,
            currency: "NGN",
          },
          {
            headers: {
              Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY!}`,
              "Content-Type": "application/json",
            },
          }
        );

        const { data } = response.data;
        if (!data?.authorization_url)
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to create Paystack checkout session",
          });

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
   * 🛍️ GET PRODUCTS
   */
  getProducts: baseProcedure
    .input(z.object({ ids: z.array(z.string()) }))
    .query(async ({ ctx, input }) => {
      const data = await ctx.db.find({
        collection: "products",
        depth: 2,
        where: {
          and: [
            { id: { in: input.ids } },
            { isArchived: { not_equals: true } },
          ],
        },
      });

      if (data.totalDocs !== input.ids.length)
        throw new TRPCError({ code: "NOT_FOUND", message: "Products not found" });

      const totalPrice = data.docs.reduce(
        (acc, product) => acc + (isNaN(Number(product.price)) ? 0 : Number(product.price)),
        0
      );

      return {
        ...data,
        totalPrice,
        docs: data.docs.map((doc) => ({
          ...doc,
          image: doc.image as Media | null,
          tenant: doc.tenant as Tenants & { image: Media | null },
        })),
      };
    }),
});
