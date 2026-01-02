// storage-adapter-import-placeholder
import { mongooseAdapter } from '@payloadcms/db-mongodb'
import { payloadCloudPlugin } from '@payloadcms/payload-cloud'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { vercelBlobStorage } from '@payloadcms/storage-vercel-blob'
import { multiTenantPlugin } from '@payloadcms/plugin-multi-tenant'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

import { Users } from './collections/Users'
import { Media } from './collections/Media'
import { Categories } from './collections/Categories'
import { Products } from './collections/Products'
import { Tags } from './collections/Tags'
import { Tenants } from './collections/Tenants'
import { Orders } from './collections/Orders'
import { Reviews } from './collections/Reviews'
import { Config } from './payload-types'
import { isSuperAdmin } from './lib/access'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

/* -------------------------------------------------
   ✅ CORS / CSRF SAFE ORIGINS
-------------------------------------------------- */
const ALLOWED_ORIGINS = [
  process.env.PAYLOAD_PUBLIC_APP_URL, // https://www.aleximportsshop.store
  'https://www.aleximportsshop.store',
  'https://aleximportsshop.store',
  'http://localhost:3000',
].filter(Boolean)

export default buildConfig({
  /* -------------------------------------------------
     ✅ SERVER URL (Payload backend domain)
     Example:
     https://aleximports.vercel.app
     OR https://api.aleximportsshop.store
  -------------------------------------------------- */
  serverURL: process.env.PAYLOAD_PUBLIC_SERVER_URL,

  /* -------------------------------------------------
     ✅ CORS + CSRF (FIXED)
  -------------------------------------------------- */
  cors: ALLOWED_ORIGINS,
  csrf: ALLOWED_ORIGINS,

  /* -------------------------------------------------
     ADMIN CONFIG
  -------------------------------------------------- */
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
    components: {
      beforeNavLinks: ['@/components/paystack-verify#PaystackVerify'],
    },
  },

  /* -------------------------------------------------
     COLLECTIONS
  -------------------------------------------------- */
  collections: [
    Users,
    Media,
    Categories,
    Products,
    Tags,
    Tenants,
    Orders,
    Reviews,
  ],

  /* -------------------------------------------------
     EDITOR
  -------------------------------------------------- */
  editor: lexicalEditor(),

  /* -------------------------------------------------
     SECURITY
  -------------------------------------------------- */
  secret: process.env.PAYLOAD_SECRET || '',

  /* -------------------------------------------------
     TYPESCRIPT
  -------------------------------------------------- */
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },

  /* -------------------------------------------------
     DATABASE
  -------------------------------------------------- */
  db: mongooseAdapter({
    url: process.env.DATABASE_URI || '',
  }),

  sharp,

  /* -------------------------------------------------
     PLUGINS
  -------------------------------------------------- */
  plugins: [
    payloadCloudPlugin(),

    multiTenantPlugin<Config>({
      collections: {
        products: {},
        media: {},
      },
      tenantsArrayField: {
        includeDefaultField: false,
      },
      userHasAccessToAllTenants: (user) => isSuperAdmin(user),
    }),

    vercelBlobStorage({
      enabled: true,
      collections: {
        media: true,
      },
      token: process.env.BLOB_READ_WRITE_TOKEN,
    }),
  ],
})
