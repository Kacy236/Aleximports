import { authRouter } from '@/modules/auth/server/procedures';
import { categoriesRouter } from '@/modules/categories/server/procedures';
import { checkoutRouter } from '@/modules/checkout/server/procedures';
import { libraryRouter } from '@/modules/library/server/procedures';
import { productsRouter } from '@/modules/products/server/procedures';
import { reviewsRouter } from '@/modules/reviews/server/procedures';
import { tagsRouter } from '@/modules/tags/server/procedures';
import { tenantsRouter } from '@/modules/tenants/server/procedures';

import { createTRPCRouter } from '../init';

export const appRouter = createTRPCRouter({
  auth: authRouter,
  tags: tagsRouter,
  tenants: tenantsRouter,
  library: libraryRouter,
  reviews: reviewsRouter,
  checkout: checkoutRouter,
  products: productsRouter,
  categories: categoriesRouter
});
// export type definition of API
export type AppRouter = typeof appRouter;