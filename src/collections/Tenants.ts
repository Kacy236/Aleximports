import { isSuperAdmin } from '@/lib/access';
import type { CollectionConfig } from 'payload';

export const Tenants: CollectionConfig = {
  slug: 'tenants',
  access: {
    create: ({ req }) => isSuperAdmin(req.user),
    delete: ({ req }) => isSuperAdmin(req.user),
    read: () => true,
    update: () => true,
  },
  admin: {
    useAsTitle: 'slug',
  },
  fields: [
    {
      name: "name",
      required: true,
      type: "text",
      label: "Store Name",
    },
    {
      name: "slug",
      type: "text",
      required: true,
      unique: true,
      index: true,
      access: {
        update: ({ req }) => isSuperAdmin(req.user),
      },
    },
    {
      name: "image",
      type: "upload",
      relationTo: "media",
      required: true, // ✅ Set to true so users are forced to upload it
      admin: {
        description: "This is your store's logo or banner. Required to create products.",
      }
    },

    // Bank Details
    {
      name: "bankCode",
      type: "text",
      required: true,
    },
    {
      name: "accountNumber",
      type: "text",
      required: true,
    },
    {
      name: "accountName",
      type: "text",
      required: false,
    },
    {
      name: "paystackRecipientCode",
      type: "text",
      required: false,
    },

    // Subaccount (Split Payments)
    {
      name: "paystackSubaccountCode",
      type: "text",
      required: false,
      admin: {
        description: "This will be automatically populated after Paystack verification."
      }
    },
    {
      name: "platformFeePercentage",
      type: "number",
      required: false,
      access: {
        read: ({ req }) => isSuperAdmin(req.user),
        update: ({ req }) => isSuperAdmin(req.user),
      },
    },

    {
      name: "paystackDetailsSubmitted",
      type: "checkbox",
      defaultValue: false,
      access: {
        update: ({ req }) => isSuperAdmin(req.user),
      },
    },
  ],
};