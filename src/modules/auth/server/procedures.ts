import { TRPCError } from "@trpc/server";
import { headers as getHeaders } from "next/headers";
import { baseProcedure, createTRPCRouter } from "@/trpc/init";
import { loginSchema, registerSchema } from "../schemas";
import { generateAuthCookie } from "../utils";

/* -----------------------------------------------------------
   PAYSTACK HELPERS
----------------------------------------------------------- */

/**
 * Creates a Transfer Recipient.
 * Useful for manual payouts or tracking bank details in Paystack.
 */
const createPaystackRecipient = async (
  username: string,
  bankCode: string,
  accountNumber: string
) => {
  const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY!;
  const isTestMode = PAYSTACK_SECRET_KEY.startsWith("sk_test_");

  if (isTestMode) {
    return {
      recipient_code: `RCP_TEST_${Math.floor(Math.random() * 100000)}`,
      account_name: `${username} (Test Account)`,
    };
  }

  const response = await fetch("https://api.paystack.co/transferrecipient", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      type: "nuban",
      name: username,
      account_number: accountNumber,
      bank_code: bankCode,
      currency: "NGN",
    }),
  });

  const data = await response.json();
  if (!response.ok || !data.data?.recipient_code) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: data.message || "Paystack could not verify bank details for recipient.",
    });
  }

  return data.data;
};

/**
 * Creates a Subaccount with a LOCKED 10% Platform Fee.
 * This ensures you get paid automatically on every transaction.
 */
const createPaystackSubaccount = async (
  businessName: string,
  bankCode: string,
  accountNumber: string
) => {
  const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY!;
  const isTestMode = PAYSTACK_SECRET_KEY.startsWith("sk_test_");

  if (isTestMode) {
    return {
      subaccount_code: `SUB_TEST_${Math.floor(Math.random() * 100000)}`,
    };
  }

  const response = await fetch("https://api.paystack.co/subaccount", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      business_name: businessName,
      settlement_bank: bankCode,
      account_number: accountNumber,
      // 💸 THE FIX: Lock in your 10% platform fee here
      percentage_charge: 10, 
    }),
  });

  const data = await response.json();
  if (!response.ok || !data.data?.subaccount_code) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: data.message || "Failed to create Paystack subaccount.",
    });
  }

  return data.data;
};

/* -----------------------------------------------------------
   AUTH ROUTER
----------------------------------------------------------- */

export const authRouter = createTRPCRouter({
  session: baseProcedure.query(async ({ ctx }) => {
    const headers = await getHeaders();
    return await ctx.db.auth({ headers });
  }),

  register: baseProcedure
    .input(registerSchema)
    .mutation(async ({ input, ctx }) => {
      /* STEP 1 — Check if username already exists */
      const existing = await ctx.db.find({
        collection: "users",
        limit: 1,
        where: { username: { equals: input.username } },
      });

      if (existing.docs.length > 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Username is already taken",
        });
      }

      /* STEP 2 — Create Paystack Entities */
      // We do these before creating the user so that if Paystack fails, 
      // we don't end up with a "broken" user in our database.
      const paystackRecipient = await createPaystackRecipient(
        input.username,
        input.bankCode,
        input.accountNumber
      );

      const paystackSub = await createPaystackSubaccount(
        input.username,
        input.bankCode,
        input.accountNumber
      );

      /* STEP 3 — Create Tenant Profile */
      const tenant = await ctx.db.create({
        collection: "tenants",
        data: {
          name: input.username,
          slug: input.username,
          bankCode: input.bankCode,
          accountNumber: input.accountNumber,
          accountName: paystackRecipient.account_name,
          paystackRecipientCode: paystackRecipient.recipient_code,
          paystackSubaccountCode: paystackSub.subaccount_code, // 👈 Used for split payments
          platformFeePercentage: 10,
          paystackDetailsSubmitted: true,
        },
      });

      /* STEP 4 — Create User & Link to Tenant */
      await ctx.db.create({
        collection: "users",
        data: {
          email: input.email,
          username: input.username,
          password: input.password,
          tenants: [{ tenant: tenant.id }],
        },
      });

      /* STEP 5 — Auto-login */
      const loginData = await ctx.db.login({
        collection: "users",
        data: {
          email: input.email,
          password: input.password,
        },
      });

      if (!loginData.token) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Registration successful, but auto-login failed.",
        });
      }

      await generateAuthCookie({
        prefix: ctx.db.config.cookiePrefix,
        value: loginData.token,
      });

      return loginData;
    }),

  login: baseProcedure
    .input(loginSchema)
    .mutation(async ({ input, ctx }) => {
      const data = await ctx.db.login({
        collection: "users",
        data: {
          email: input.email,
          password: input.password,
        },
      });

      if (!data.token) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Invalid email or password",
        });
      }

      await generateAuthCookie({
        prefix: ctx.db.config.cookiePrefix,
        value: data.token,
      });

      return data;
    }),
});