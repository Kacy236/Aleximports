import { TRPCError } from "@trpc/server";
import { headers as getHeaders } from "next/headers";
import { baseProcedure, createTRPCRouter } from "@/trpc/init";
import { loginSchema, registerSchema } from "../schemas";
import { generateAuthCookie } from "../utils";
import { z } from "zod";
import { sendVerificationEmail, generateOTP } from "@/lib/email";

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
      /* STEP 1 — Check if username or email already exists */
      const existing = await ctx.db.find({
        collection: "users",
        limit: 1,
        where: { 
          or: [
            { username: { equals: input.username } },
            { email: { equals: input.email } }
          ]
        },
      });

      if (existing.docs.length > 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Username or Email is already taken",
        });
      }

      /* STEP 2 — Create Paystack Entities */
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
          paystackSubaccountCode: paystackSub.subaccount_code,
          platformFeePercentage: 10,
          paystackDetailsSubmitted: true,
        },
      });

      /* STEP 4 — Prepare Verification Data */
      const otp = generateOTP();
      const otpExpires = new Date(Date.now() + 10 * 60000); // 10 minutes

      /* STEP 5 — Create User (Unverified) */
      await ctx.db.create({
        collection: "users",
        data: {
          email: input.email,
          username: input.username,
          password: input.password,
          tenants: [{ tenant: tenant.id }],
          isVerified: false,
          verificationCode: otp,
          verificationExpires: otpExpires.toISOString(), // Store as ISO string
        },
      });

      /* STEP 6 — Send Verification Email */
      try {
        await sendVerificationEmail(input.email, otp);
      } catch (error) {
        console.error("Failed to send verification email:", error);
      }

      return {
        success: true,
        message: "Registration successful. Please check your email.",
      };
    }),

  login: baseProcedure
    .input(loginSchema)
    .mutation(async ({ input, ctx }) => {
      /* STEP 1 — Perform initial login to validate credentials */
      // Note: We are validating email/password here, but not setting the cookie yet
      const loginAttempt = await ctx.db.login({
        collection: "users",
        data: {
          email: input.email,
          password: input.password,
        },
      });

      if (!loginAttempt.user) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Invalid email or password",
        });
      }

      /* STEP 2 — Generate and store OTP for every login */
      const otp = generateOTP();
      const otpExpires = new Date(Date.now() + 10 * 60000);

      await ctx.db.update({
        collection: "users",
        id: loginAttempt.user.id,
        data: {
          verificationCode: otp,
          verificationExpires: otpExpires.toISOString(),
        },
      });

      /* STEP 3 — Send the code */
      try {
        await sendVerificationEmail(input.email, otp);
      } catch (error) {
        console.error("Login OTP email failure:", error);
      }

      /* STEP 4 — Signal the frontend to show OTP screen */
      return {
        requiresOTP: true,
        email: input.email,
      };
    }),

  verifyOTP: baseProcedure
    .input(z.object({ 
      email: z.string().email(), 
      code: z.string().length(6),
      password: z.string(), 
    }))
    .mutation(async ({ input, ctx }) => {
      /* STEP 1 — Find the user */
      const userResult = await ctx.db.find({
        collection: "users",
        where: { email: { equals: input.email } },
      });

      const user = userResult.docs[0];

      if (!user) {
        throw new TRPCError({ code: "NOT_FOUND", message: "User not found." });
      }

      /* STEP 2 — Validate Code & Expiry (Type-Safe Fix) */
      if (user.verificationCode !== input.code) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid code." });
      }

      // Check if verificationExpires exists before creating Date object
      const expiryValue = user.verificationExpires;
      const expiryDate = expiryValue ? new Date(expiryValue) : null;

      if (!expiryDate || new Date() > expiryDate) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Verification code has expired.",
        });
      }

      /* STEP 3 — Mark as Verified and clear codes */
      await ctx.db.update({
        collection: "users",
        id: user.id,
        data: {
          isVerified: true,
          verificationCode: null,
          verificationExpires: null,
        },
      });

      /* STEP 4 — Finalize Session */
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
          message: "Verification successful, but session generation failed.",
        });
      }

      /* STEP 5 — Original Cookie Logic */
      await generateAuthCookie({
        prefix: ctx.db.config.cookiePrefix,
        value: loginData.token,
      });

      return loginData;
    }),
});