import crypto from "crypto";
import { NextResponse } from "next/server";
import { getPayload } from "payload";
import payloadConfig from "@payload-config";
import type { PaystackWebhookEvent } from "@/modules/checkout/types";

export const config = {
  api: {
    bodyParser: false,
  },
};

export async function POST(req: Request) {
  try {
    const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY!;
    if (!PAYSTACK_SECRET_KEY) {
      console.error("❌ Missing PAYSTACK_SECRET_KEY in environment.");
      return NextResponse.json({ message: "Server misconfigured" }, { status: 500 });
    }

    const rawBody = await req.text();
    const signature = req.headers.get("x-paystack-signature");

    const computedHash = crypto
      .createHmac("sha512", PAYSTACK_SECRET_KEY)
      .update(rawBody)
      .digest("hex");

    if (!signature || computedHash !== signature) {
      console.error("❌ Invalid Paystack signature");
      return NextResponse.json({ message: "Invalid signature" }, { status: 400 });
    }

    const event = JSON.parse(rawBody) as PaystackWebhookEvent;
    const payload = await getPayload({ config: payloadConfig });

    if (event.event === "charge.success") {
      const data = event.data;
      const metadata = data.metadata;

      if (!metadata?.userId || !metadata?.tenantId || !Array.isArray(metadata?.products)) {
        throw new Error("Invalid metadata from Paystack");
      }

      // 1. ✅ Create the Order matching your Collection schema
      await payload.create({
        collection: "orders",
        data: {
          tenant: metadata.tenantId,
          user: metadata.userId,
          // Extract product IDs for the relationship field
          products: metadata.products.map((p) => p.id),
          // Detailed line items
          items: metadata.products.map((p) => ({
            productName: p.name,
            variantId: p.variantId || undefined,
            variantName: p.variantName || undefined, 
            priceAtPurchase: p.price,
            quantity: p.quantity || 1, // ✅ Ensure quantity is stored in the order
          })),
          paystackReference: data.reference,
          paystackTransactionId: String(data.id),
          totalAmount: data.amount / 100,
          status: "success",
        },
      });

      // 2. ✅ UPDATED STOCK REDUCTION LOGIC
      for (const item of metadata.products) {
        // We only reduce stock if it's a variant or if the product tracks stock
        // For this logic, we'll focus on the variant stock as per your schema
        if (item.variantId) {
          try {
            const product = await payload.findByID({
              collection: "products",
              id: item.id,
              depth: 0,
            });

            if (product && product.hasVariants && Array.isArray(product.variants)) {
              const updatedVariants = product.variants.map((v: any) => {
                if (v.id === item.variantId) {
                  const currentStock = v.stock || 0;
                  const quantityPurchased = item.quantity || 1; // ✅ Fallback to 1 if missing
                  
                  return {
                    ...v,
                    stock: Math.max(0, currentStock - quantityPurchased), // ✅ Subtract actual quantity
                  };
                }
                return v;
              });

              await payload.update({
                collection: "products",
                id: item.id,
                data: {
                  variants: updatedVariants,
                },
              });
              console.log(`📉 Stock reduced by ${item.quantity || 1} for product ${item.id}, variant ${item.variantId}`);
            }
          } catch (stockErr) {
            console.error(`❌ Failed to update stock for product ${item.id}:`, stockErr);
          }
        }
      }

      console.log(`✅ Order and stock update completed for user ${metadata.userId}`);
    } else {
      console.log(`ℹ️ Unhandled Paystack event: ${event.event}`);
    }

    return NextResponse.json({ message: "Received" }, { status: 200 });
  } catch (err) {
    console.error("❌ Webhook error:", err);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}