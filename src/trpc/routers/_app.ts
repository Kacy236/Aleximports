import { authRouter } from '@/modules/auth/server/procedures';
import { categoriesRouter } from '@/modules/categories/server/procedures';
import { productsRouter } from '@/modules/products/server/procedures';

import { createTRPCRouter } from '../init';

export const appRouter = createTRPCRouter({
  auth: authRouter,
  products: productsRouter,
  categories: categoriesRouter
});
// export type definition of API
export type AppRouter = typeof appRouter;