import type { CollectionConfig } from "payload";

export const Orders: CollectionConfig = {
  slug: "orders",
  admin: {
    useAsTitle: "paystackReference",
  },
  access: {
    read: ({ req }) => {
      const user = req.user;

      if (!user) return false;

      // ✅ Admins can see all orders
      if (user.role === "admin") {
        return true;
      }

      // ✅ Regular users can only see their own orders
      return {
        user: {
          equals: user.id,
        },
      };
    },
    create: () => true, // created by webhook
    update: ({ req }) => req.user?.role === "admin",
    delete: ({ req }) => req.user?.role === "admin",
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
    },
    {
      name: "paystackReference",
      type: "text",
      required: true,
      unique: true,
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
    },
  ],
};
