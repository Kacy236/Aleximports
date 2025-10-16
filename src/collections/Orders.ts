import { isSuperAdmin } from "@/lib/access";
import type { CollectionConfig } from "payload";

export const Orders: CollectionConfig = {
  slug: "orders",

  access: {
    // ✅ READ
    read: ({ req }) => {
      const user = req.user;
      if (!user) return false;

      // Super admins or admins can see all orders
      if (isSuperAdmin(user) || user.role === "admin") {
        return true;
      }

      // Regular users can only see their own orders
      return {
        user: {
          equals: user.id,
        },
      };
    },

    // ✅ CREATE (Admins or SuperAdmins only)
    create: ({ req }) => isSuperAdmin(req.user) || req.user?.role === "admin",

    // ✅ UPDATE (Admins or SuperAdmins only)
    update: ({ req }) => isSuperAdmin(req.user) || req.user?.role === "admin",

    // ✅ DELETE (Admins or SuperAdmins only)
    delete: ({ req }) => isSuperAdmin(req.user) || req.user?.role === "admin",
  },

  admin: {
    useAsTitle: "paystackReference",
  },

  fields: [
    {
      name: "tenant",
      type: "relationship",
      relationTo: "tenants",
      required: true,
    },
    {
      name: "user",
      type: "relationship",
      relationTo: "users",
      required: true,
    },
    {
      name: "products",
      type: "relationship",
      relationTo: "products",
      hasMany: true,
      required: true,
    },
    {
      name: "productNames",
      type: "array",
      fields: [
        {
          name: "name",
          type: "text",
          required: true,
        },
      ],
      admin: {
        description: "List of product names for display or analytics",
      },
    },
    {
      name: "paystackReference",
      type: "text",
      required: true,
      unique: true,
      admin: {
        description: "Paystack transaction reference",
      },
    },
    {
      name: "paystackTransactionId",
      type: "text",
      admin: {
        description: "Optional: Paystack Transaction ID (for reconciliation)",
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
    },
    {
      name: "totalAmount",
      type: "number",
      required: true,
      admin: {
        description: "Total amount paid (in Naira)",
      },
    },
  ],
};
