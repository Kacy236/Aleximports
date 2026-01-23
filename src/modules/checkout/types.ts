// A single product inside metadata
export type PaystackProductMetadata = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  variantId?: string;
  variantName?: string;
};

// The full metadata object Paystack will receive
export type PaystackMetadata = {
  userId: string;
  tenantId: string;
  products: PaystackProductMetadata[];
};

// The event data Paystack sends
export type PaystackEventData = {
  id: string | number; // ✅ Added this field
  reference: string;
  amount: number;
  currency: string;
  status: "success" | "failed";
  customer: {
    email: string;
    id: string;
  };
  metadata?: PaystackMetadata;
};

// The full webhook event wrapper
export type PaystackWebhookEvent = {
  event: string; // e.g. "charge.success"
  data: PaystackEventData;
};

// ✅ Compatibility aliases for existing imports
export type CheckoutMetadata = PaystackMetadata;
export type ProductMetadata = PaystackProductMetadata;
