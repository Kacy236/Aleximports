import { TRPCError } from "@trpc/server";
import { headers as getHeaders } from "next/headers";
import { baseProcedure, createTRPCRouter } from "@/trpc/init";
import { loginSchema, registerSchema } from "../schemas";
import { generateAuthCookie } from "../utils";

/**
 * Helper: Create or mock a Paystack recipient/subaccount
 */
const createPaystackRecipient = async (username: string, bankCode: string, accountNumber: string) => {
  const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY!;
  const isTestMode = PAYSTACK_SECRET_KEY.startsWith("sk_test_");

  // 🧪 Mock mode (test key)
  if (isTestMode) {
    const mockCode = "RCP_TEST_" + Math.floor(Math.random() * 1000000);
    console.log("💡 Paystack mocked in test mode with code:", mockCode);
    return {
      recipient_code: mockCode,
      account_name: `${username} (Test)`,
    };
  }

  // ✅ Live mode
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
    console.error("❌ Paystack Error:", data);
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: data.message || "Failed to create Paystack recipient",
    });
  }

  return data.data;
};

export const authRouter = createTRPCRouter({
  session: baseProcedure.query(async ({ ctx }) => {
    const headers = await getHeaders();
    const session = await ctx.db.auth({ headers });
    return session;
  }),

  register: baseProcedure
    .input(registerSchema)
    .mutation(async ({ input, ctx }) => {
      // Step 1: Check username
      const existing = await ctx.db.find({
        collection: "users",
        limit: 1,
        where: { username: { equals: input.username } },
      });

      if (existing.docs.length > 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Username already taken",
        });
      }

      // Step 2: Create Paystack recipient (or mock in test)
      const bankCode = "001"; // Default Access Bank
      const accountNumber = "0001234567"; // Access test account
      const paystackRecipient = await createPaystackRecipient(
        input.username,
        bankCode,
        accountNumber
      );

      // Step 3: Create tenant with required bank fields
      const tenant = await ctx.db.create({
        collection: "tenants",
        data: {
          name: input.username,
          slug: input.username,
          bankCode,
          accountNumber,
          accountName: paystackRecipient.account_name,
          paystackRecipientCode: paystackRecipient.recipient_code,
          paystackDetailsSubmitted: true,
        },
      });

      // Step 4: Create user linked to tenant
      await ctx.db.create({
        collection: "users",
        data: {
          email: input.email,
          username: input.username,
          password: input.password,
          tenants: [{ tenant: tenant.id }],
        },
      });

      // Step 5: Auto-login
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
          message: "Failed to login",
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
          message: "Failed to login",
        });
      }

      await generateAuthCookie({
        prefix: ctx.db.config.cookiePrefix,
        value: data.token,
      });

      return data;
    }),
});
