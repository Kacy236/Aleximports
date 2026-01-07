import { isSuperAdmin } from "@/lib/access";
import type { CollectionConfig } from "payload";
import type { Tenant } from "@/payload-types";
import React from "react";

/**
 * Variant row label
 */
const VariantRowLabel = ({ data, index }: { data: any; index?: number }) => {
  const label = [data?.color, data?.size].filter(Boolean).join(" - ");
  const rowNum =
    typeof index === "number" ? String(index + 1).padStart(2, "0") : "";

  return React.createElement(
    React.Fragment,
    null,
    label || `Variant ${rowNum}`
  );
};

export const Products: CollectionConfig = {
  slug: "products",

  access: {
    create: async ({ req }) => {
      if (isSuperAdmin(req.user)) return true;

      const tenantRel = req.user?.tenants?.[0]?.tenant;
      const tenantId =
        typeof tenantRel === "object"
          ? (tenantRel as any).id || (tenantRel as any)._id
          : tenantRel;

      if (!tenantId) return false;

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

      return Boolean(tenant?.paystackSubaccountCode);
    },
    delete: ({ req }) => isSuperAdmin(req.user),
    read: () => true,
  },

  admin: {
    useAsTitle: "name",
    defaultColumns: ["name", "price", "category", "updatedAt"],
    description:
      "You must complete your Paystack verification (subaccount) before creating products.",
  },

  fields: [
    {
      name: "name",
      type: "text",
      required: true,
      label: "Product Name",
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
      label: "Base Price (₦)",
      admin: {
        description: "The default price if no variant price is set.",
      },
    },
        // =========================
    // CATEGORY
    // =========================
    {
      name: "category",
      type: "relationship",
      relationTo: "categories",
      required: true,
      hasMany: false,
      filterOptions: {
        parent: { exists: true },
      },
    },

    // =========================
    // VARIANTS (MOVED UP)
    // =========================
    {
      name: "hasVariants",
      type: "checkbox",
      label: "This product has multiple options (sizes, colors, etc.)",
      defaultValue: false,
      admin: {
        position: "sidebar",
      },
    },
    {
      name: "variants",
      type: "array",
      label: "Product Options",
      admin: {
        condition: (data) => data?.hasVariants,
        description:
          "TIP: Fill out one option, then click the 'Duplicate' icon (three dots) on the top right of the row to quickly create more.",
        components: {
          RowLabel: VariantRowLabel as any,
        },
      },
      fields: [
        {
          type: "row",
          fields: [
            {
              name: "color",
              type: "text",
              label: "Color",
              admin: { width: "20%" },
            },
            {
              name: "size",
              type: "text",
              label: "Size",
              admin: { width: "15%" },
            },
            {
              name: "variantPrice",
              type: "number",
              label: "Price (₦)",
              admin: {
                width: "20%",
                description: "Empty = Base Price",
              },
            },
            {
              name: "stock",
              type: "number",
              label: "Stock",
              required: true,
              defaultValue: 0,
              admin: { width: "15%" },
            },
            {
              name: "variantImage",
              type: "upload",
              relationTo: "media",
              label: "Image",
              admin: { width: "30%" },
            },
          ],
        },
      ],
    },



    // =========================
    // PRODUCT IMAGES
    // =========================
    {
      name: "images",
      label: "Product Image",
      required: true,
      type: "array",
      minRows: 1,
      maxRows: 8,
      admin: {
        description:
          "Upload your product image or images. The first image will be the primary image.",
      },
      fields: [
        {
          name: "image",
          type: "upload",
          relationTo: "media",
          required: true,
        },
      ],
    },

    // =========================
    // TAGS (MOVED BELOW IMAGES)
    // =========================
    {
      name: "tags",
      type: "relationship",
      relationTo: "tags",
      hasMany: true,
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
    },
    {
      name: "content",
      type: "richText",
    },
    {
      name: "isPrivate",
      label: "Private",
      defaultValue: false,
      type: "checkbox",
    },
    {
      name: "isArchived",
      label: "Archive",
      defaultValue: false,
      type: "checkbox",
    },
  ],
};
