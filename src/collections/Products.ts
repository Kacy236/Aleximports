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

            // FIX 1: Initialize 'tenant' here to ensure it's defined outside the try block.
            let tenant: Tenant | null = null; 
            
            try {
                tenant = await req.payload.findByID({
                    collection: "tenants",
                    id: tenantId,
                });
            } catch (err: any) {
                console.error("❌ Failed to fetch tenant:", err.message);
                // FIX 2: Explicitly return false on error to prevent accessing undefined 'tenant' later.
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
        // --- CATEGORY (Required) ---
        {
            name: "category",
            type: "relationship",
            relationTo: "categories",
            hasMany: false,
            required: true,
        },
        // --- SUBCATEGORY (Conditionally Required) ---
        {
            name: "subcategory",
            type: "relationship",
            relationTo: "categories", // Assuming subcategories are also defined in the 'categories' collection
            hasMany: false,
            admin: {
                description: "Select the specific subcategory for this product.",
                // Only show this field if a parent category has been selected
                condition: (_, siblingData) => Boolean(siblingData.category),
            },
            // Validate: If a category is present, a subcategory must also be present
            validate: (val, { siblingData }) => {
                const categorySelected = siblingData.category;
                
                if (categorySelected && !val) {
                    return "Subcategory is required when a Category is selected.";
                }
                return true;
            },
        },
        // ---------------------------------------------
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
            required: true,
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
            type: "richText",
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