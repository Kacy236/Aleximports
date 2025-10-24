import { isSuperAdmin } from '@/lib/access';
import type { CollectionConfig } from 'payload';

export const Tenants: CollectionConfig = {
  slug: 'tenants',
  access: {
    create: ({ req }) => isSuperAdmin(req.user),
    delete: ({ req }) => isSuperAdmin(req.user),
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
      admin: {
        description: "This is the name of the store (e.g. Kaycee's Store)",
      },
    },
    {
      name: "slug",
      type: "text",
      index: true,
      required: true,
      unique: true,
      access: {
        update: ({ req }) => isSuperAdmin(req.user),
      },
      admin: {
        description: "This is the store subdomain (e.g. [slug].aleximports.com)",
      },
    },
    {
      name: "image",
      type: "upload",
      relationTo: "media",
    },
    {
      name: "bankCode",
      type: "text",
      required: true,
      label: "Bank Code",
      admin: {
        description: "The 3-digit or 6-digit code identifying the tenant’s bank (e.g. 044 for Access Bank)",
      },
    },
    {
      name: "accountNumber",
      type: "text",
      required: true,
      label: "Account Number",
      admin: {
        description: "The tenant’s 10-digit bank account number",
      },
    },
    {
      name: "accountName",
      type: "text",
      required: false,
      label: "Account Name",
      admin: {
        description: "Automatically filled after Paystack verification (read-only)",
      },
    },
    {
      name: "paystackSubaccountCode",
      type: "text",
      required: false,
      label: "Paystack Subaccount Code",
      admin: {
        description: "Generated automatically after successful verification with subaccount flow",
      },
    },
    {
      name: "platformFeePercentage",
      type: "number",
      required: false,
      label: "Platform Fee (%)",
      access: {
        read: ({ req }) => isSuperAdmin(req.user),
        update: ({ req }) => isSuperAdmin(req.user),
      },
      admin: {
        description: "Percentage fee your platform takes from each transaction for this tenant (super admins only)",
      },
    },
    {
      name: "paystackMerchantId",
      type: "text",
      required: false,
      access: {
        update: ({ req }) => isSuperAdmin(req.user),
      },
      admin: {
        description: "Paystack Merchant ID associated with this store",
      },
    },
    {
      name: "paystackDetailsSubmitted",
      type: "checkbox",
      defaultValue: false,
      access: {
        update: ({ req }) => isSuperAdmin(req.user),
      },
      admin: {
        description: "Indicates if Paystack verification has been completed",
      },
    },
  ],
};
