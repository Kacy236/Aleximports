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
      access: {
        update: ({ req }) => isSuperAdmin(req.user),
      },
      admin: {
        description: "You cannot create products until you complete your Paystack onboarding",
      },
    },
  ],
};
