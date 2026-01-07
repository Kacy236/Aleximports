import { isSuperAdmin } from "@/lib/access";
import type { CollectionConfig } from "payload";

/**
 * Orders Collection
 * Stores transaction history and line items (variants) for each purchase.
 */

export const Orders: CollectionConfig = {
  slug: "orders",
  access: {
    // ✅ READ: Admins see all, users see their own
    read: ({ req }) => {
      const user = req.user;
      if (!user) return false;
      if (isSuperAdmin(user)) return true;
      return { user: { equals: user.id } };
    },
    // ✅ WRITE: Restricted to Admin/System processes (like Webhooks)
    create: ({ req }) => isSuperAdmin(req.user),
    update: ({ req }) => isSuperAdmin(req.user),
    delete: ({ req }) => isSuperAdmin(req.user),
  },
  admin: {
    useAsTitle: "paystackReference",
    defaultColumns: ["paystackReference", "totalAmount", "status", "createdAt"],
    group: "Shop",
  },
  fields: [
    {
      name: "tenant",
      type: "relationship",
      relationTo: "tenants",
      required: true,
      index: true,
    },
    {
      name: "user",
      type: "relationship",
      relationTo: "users",
      required: true,
      index: true,
    },
    {
      name: "products",
      type: "relationship",
      relationTo: "products",
      hasMany: true,
      required: true,
      admin: {
        description: "Primary product relationships",
      },
    },
    {
      name: "items", 
      type: "array",
      admin: {
        description: "Snapshots of products, variants, and prices at time of purchase",
      },
      fields: [
        {
          name: "productName",
          type: "text",
          required: true,
        },
        {
          name: "variantId", 
          type: "text",
        },
        {
          name: "priceAtPurchase", 
          type: "number",
        },
      ],
    },
    {
      name: "paystackReference",
      type: "text",
      required: true,
      unique: true,
      admin: {
        position: "sidebar",
      },
    },
    {
      // ✅ THE FIX: Added this field so Webhook 'paystackTransactionId' works
      name: "paystackTransactionId",
      type: "text",
      admin: {
        position: "sidebar",
        description: "The internal Paystack ID for this transaction",
      },
    },
    {
      name: "status",
      type: "select",
      options: [
        { label: "Pending", value: "pending" },
        { label: "Success", value: "success" },
        { label: "Failed", value: "failed" },
      ],
      defaultValue: "pending",
      required: true,
      admin: {
        position: "sidebar",
      },
    },
    {
      name: "totalAmount",
      type: "number",
      required: true,
      admin: {
        description: "Total amount paid in Naira",
      },
    },
  ],
};