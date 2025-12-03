import { TRPCError } from "@trpc/server";
import { headers as getHeaders } from "next/headers";
import { baseProcedure, createTRPCRouter } from "@/trpc/init";
import { loginSchema, registerSchema } from "../schemas";
import { generateAuthCookie } from "../utils";

/* -----------------------------------------------------------
   PAYSTACK HELPERS
----------------------------------------------------------- */

const createPaystackRecipient = async (
  username: string,
  bankCode: string,
  accountNumber: string
) => {
  const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY!;
  const isTestMode = PAYSTACK_SECRET_KEY.startsWith("sk_test_");

  // 🧪 Test mode: mock recipient
  if (isTestMode) {
    const mockCode = "RCP_TEST_" + Math.floor(Math.random() * 1_000_000);
    console.log("💡 Mocked Paystack recipient:", mockCode);

    return {
      recipient_code: mockCode,
      account_name: `${username} (Test)`,
    };
  }

  // LIVE MODE
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
    console.error("❌ Paystack recipient error:", data);
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: data.message || "Failed to create Paystack recipient",
    });
  }

  return data.data;
};

const createPaystackSubaccount = async (businessName: string) => {
  const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY!;
  const isTestMode = PAYSTACK_SECRET_KEY.startsWith("sk_test_");

  // 🧪 Mock in test mode
  if (isTestMode) {
    const mockCode = "SUB_TEST_" + Math.floor(Math.random() * 1_000_000);
    console.log("💡 Mocked Paystack subaccount:", mockCode);
    return {
      subaccount_code: mockCode,
    };
  }

  // LIVE MODE
  const response = await fetch("https://api.paystack.co/subaccount", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      business_name: businessName,
      settlement_bank: "044", // DEFAULT — replace if you want dynamic
      account_number: "0001234567",
      percentage_charge: 0, // platform fee handled in checkout
    }),
  });

  const data = await response.json();

  if (!response.ok || !data.data?.subaccount_code) {
    console.error("❌ Paystack subaccount error:", data);
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: data.message || "Failed to create Paystack subaccount",
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
    const session = await ctx.db.auth({ headers });
    return session;
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

      /* STEP 2 — Create Paystack Recipient */
      const bankCode = "001"; // Access Bank (test mode)
      const accountNumber = "0001234567";
      const paystackRecipient = await createPaystackRecipient(
        input.username,
        bankCode,
        accountNumber
      );

      /* STEP 3 — Create Paystack Subaccount */
      const paystackSub = await createPaystackSubaccount(input.username);

      /* STEP 4 — Create Tenant Profile */
      const tenant = await ctx.db.create({
        collection: "tenants",
        data: {
          name: input.username,
          slug: input.username,

          bankCode,
          accountNumber,
          accountName: paystackRecipient.account_name,

          paystackRecipientCode: paystackRecipient.recipient_code,
          paystackSubaccountCode: paystackSub.subaccount_code,

          platformFeePercentage: 10, // default fee
          paystackDetailsSubmitted: true,
        },
      });

      /* STEP 5 — Create User */
      await ctx.db.create({
        collection: "users",
        data: {
          email: input.email,
          username: input.username,
          password: input.password,
          tenants: [{ tenant: tenant.id }],
        },
      });

      /* STEP 6 — Auto-login */
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
          message: "Failed to login after registration",
        });
      }

      await generateAuthCookie({
        prefix: ctx.db.config.cookiePrefix,
        value: data.token,
      });

      return data;
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
