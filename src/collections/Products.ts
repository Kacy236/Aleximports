import { isSuperAdmin } from "@/lib/access";
import type { CollectionConfig } from "payload";
import type { Tenant } from "@/payload-types";

export const Products: CollectionConfig = {
  slug: "products",

  access: {
    create: async ({ req }) => {
      // ✅ Super admin can always create
      if (isSuperAdmin(req.user)) return true;

      // ✅ Handle tenant being an object or a string
      const tenantRel = req.user?.tenants?.[0]?.tenant;
      const tenantId =
        typeof tenantRel === "object"
          ? tenantRel.id || tenantRel._id
          : tenantRel;

      if (!tenantId) {
        console.error("❌ No valid tenantId found for user:", req.user?.id);
        return false;
      }

      let tenant: Tenant | null = null;
      try {
        tenant = await req.payload.findByID({
          collection: "tenants",
          id: tenantId,
        });
      } catch (err: any) {
        console.error("❌ Failed to fetch tenant:", err.message);
        return false;
      }

      // ✅ Tenant must have a Paystack subaccount code to create products
      return Boolean(tenant?.paystackSubaccountCode);
    },
    delete: ({ req }) => isSuperAdmin(req.user),
  },

  admin: {
    useAsTitle: "name",
    description:
      "You must complete your Paystack verification (subaccount) before creating products.",
  },

  fields: [
    {
      name: "name",
      type: "text",
      required: true,
    },
    {
      name: "description",
      type: "textarea",
      admin: {
        description: "A short product description for display in listings.",
      },
    },
    {
      name: "price",
      type: "number",
      required: true,
      admin: {
        description: "Price in Nigerian Naira (₦).",
      },
    },
    {
      name: "category",
      type: "relationship",
      relationTo: "categories",
      hasMany: false,
    },
    {
      name: "tags",
      type: "relationship",
      relationTo: "tags",
      hasMany: true,
    },
    {
      name: "image",
      type: "upload",
      relationTo: "media",
      admin: {
        description: "Upload a clear product image.",
      },
    },
    {
      name: "refundPolicy",
      type: "select",
      options: [
        { label: "30 days", value: "30-day" },
        { label: "14 days", value: "14-day" },
        { label: "7 days", value: "7-day" },
        { label: "3 days", value: "3-day" },
        { label: "1 day", value: "1-day" },
        { label: "No refunds", value: "no-refunds" },
      ],
      defaultValue: "30-day",
      admin: {
        description: "Choose the refund policy for this product.",
      },
    },
    {
      name: "content",
      type: "textarea",
      admin: {
        description:
          "Protected content visible only after purchase. Supports markdown formatting (add guides, downloads, or bonuses).",
      },
    },
    {
        name: "isPrivate",
        label: "Private",
        defaultValue: false,
        type: "checkbox",
        admin: {
            description: "If checked, this product will not be shown on the public storefront"
        },
    },
    {
        name: "isArchived",
        label: "Archive",
        defaultValue: false,
        type: "checkbox",
        admin: {
            description: "If checked, this product will be archived"
        },
    },
  ],
};
