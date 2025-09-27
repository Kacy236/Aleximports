import crypto from "crypto";
import { getPayload } from "payload";
import config from "@payload-config";
import { NextResponse } from "next/server";
import type { PaystackWebhookEvent } from "@/modules/checkout/types";

export async function POST(req: Request) {
  const rawBody = await req.text();
  const signature = req.headers.get("x-paystack-signature");

  // ✅ Verify Paystack signature
  const hash = crypto
    .createHmac("sha512", process.env.PAYSTACK_SECRET_KEY!)
    .update(rawBody)
    .digest("hex");

  if (hash !== signature) {
    console.error("❌ Invalid Paystack signature");
    return NextResponse.json(
      { message: "Invalid signature" },
      { status: 400 }
    );
  }

  const event = JSON.parse(rawBody) as PaystackWebhookEvent;
  console.log("✅ Paystack event received:", event.event);

  const payload = await getPayload({ config });

  try {
    switch (event.event) {
      case "charge.success": {
        const data = event.data;

        if (!data.metadata?.userId || !data.metadata?.products || !data.metadata?.tenantId) {
          throw new Error("User ID, tenant ID, or products missing in metadata");
        }

        // Fetch user
        const user = await payload.findByID({
          collection: "users",
          id: data.metadata.userId,
        });

        if (!user) {
          throw new Error("User not found");
        }

        // ✅ Collect product IDs and names
        const productIds = data.metadata.products.map((p: any) => p.id);
        const productNames = data.metadata.products.map((p: any) => ({
          name: p.name,
        }));

        // ✅ Create order scoped to tenant
        await payload.create({
          collection: "orders",
          data: {
            tenant: data.metadata.tenantId,   // 👈 link order to tenant
            user: user.id,
            products: productIds,
            productNames,                     // 👈 store readable product names
            paystackReference: data.reference,
            totalAmount: data.amount / 100,   // convert from kobo → naira
            status: "success",
          },
        });

        break;
      }

      default:
        console.log(`Unhandled Paystack event: ${event.event}`);
    }
  } catch (error) {
    console.error("Webhook handler failed:", error);
    return NextResponse.json(
      { message: "Webhook handler failed" },
      { status: 500 }
    );
  }

  return NextResponse.json({ message: "Received" }, { status: 200 });
}
