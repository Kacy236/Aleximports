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
        ? (tenantRel as any).id || (tenantRel as any)._id
        : tenantRel;
    

      if (!tenantId) {
        
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
    useAsTitle: "product name",
    description:
      "You must complete your Paystack verification (subaccount) before creating products.",
  },

  fields: [
    {
      name: "product name",
      type: "text",
      required: true,
    },
    {
      name: "description",
      required: true,
      type: "richText",
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
      required: true,
      hasMany: false,
      filterOptions: {
        parent: {
          exists: true,
        },
      },
      admin: {
        description: "Select a subcategory (not a parent category)",
      },
    },
    {
      name: "tags",
      type: "relationship",
      relationTo: "tags",
      hasMany: true,
    },
    {
  name: "images",
  label: "Product Images",
  type: "upload",
  relationTo: "media",
  required: true,
  hasMany: true,
  admin: {
    description:
      "Upload multiple images (main image, angles, variants, etc). First image is used as the main image.",
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
      type: "richText",
      admin: {
        description:
          "Protected content visible only after purchase. Supports markdown formatting (add guides, downloads, or bonuses).",
      },
    },
    {
        name: "isPrivate",
        label: "Sold out",
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