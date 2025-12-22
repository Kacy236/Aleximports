import crypto from "crypto";
import { NextResponse } from "next/server";
import { getPayload } from "payload";
import payloadConfig from "@payload-config"; // ✅ renamed to avoid conflict
import type { PaystackWebhookEvent } from "@/modules/checkout/types";

export const config = {
  api: {
    bodyParser: false, // 🚫 Disable automatic body parsing
  },
};

export async function POST(req: Request) {
  try {
    const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY!;
    if (!PAYSTACK_SECRET_KEY) {
      console.error("❌ Missing PAYSTACK_SECRET_KEY in environment.");
      return NextResponse.json({ message: "Server misconfigured" }, { status: 500 });
    }

    // ✅ Step 1: Read the raw request body text
    const rawBody = await req.text();
    const signature = req.headers.get("x-paystack-signature");

    // ✅ Step 2: Verify the Paystack signature using raw body
    const computedHash = crypto
      .createHmac("sha512", PAYSTACK_SECRET_KEY)
      .update(rawBody)
      .digest("hex");

    if (!signature || computedHash !== signature) {
      console.error("❌ Invalid Paystack signature");
      return NextResponse.json({ message: "Invalid signature" }, { status: 400 });
    }

    // ✅ Step 3: Parse JSON safely after verifying signature
    const event = JSON.parse(rawBody) as PaystackWebhookEvent;
    console.log("✅ Paystack event received:", event.event);

    const payload = await getPayload({ config: payloadConfig }); // ✅ use renamed variable

    if (event.event === "charge.success") {
      const data = event.data;

      if (
        !data.metadata?.userId ||
        !data.metadata?.tenantId ||
        !Array.isArray(data.metadata?.products)
      ) {
        throw new Error("Invalid metadata from Paystack");
      }

      const user = await payload.findByID({
        collection: "users",
        id: data.metadata.userId,
      });
      const tenant = await payload.findByID({
        collection: "tenants",
        id: data.metadata.tenantId,
      });

      if (!user || !tenant) throw new Error("User or tenant not found");

      const productIds = data.metadata.products.map((p) => p.id);
      const productNames = data.metadata.products.map((p) => ({ name: p.name }));

      await payload.create({
        collection: "orders",
        data: {
          tenant: tenant.id,
          user: user.id,
          products: productIds,
          productNames,
          paystackReference: data.reference,
          paystackTransactionId: String(data.id),
          totalAmount: data.amount / 100, // Convert kobo → naira
          status: "success",
        },
      });

      console.log(`✅ Order created for user ${user.id} in tenant ${tenant.id}`);
    } else {
      console.log(`ℹ️ Unhandled Paystack event: ${event.event}`);
    }

    return NextResponse.json({ message: "Received" }, { status: 200 });
  } catch (err) {
    console.error("❌ Webhook error:", err);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}