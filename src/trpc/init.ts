import { initTRPC } from '@trpc/server';
import { cache } from 'react';
export const createTRPCContext = cache(async () => {
    /*
    * @see: https://trpc.io/docs/server/context
    */
   return { userId: 'user_123'};
});
//Avoid exporting the entire t-project
// since it's not very descriptive.
// For instance, the use of a t variable
// is common in il8nlibraries.
const t = initTRPC.create({
        /*
    * @see: https://trpc.io/docs/server/data-transformers
    */
   //transformer: superjson,
});
// Base router and procedure helpers
export const createTRPCRouter = t.router;
export const createCallerFactory = t.createCallerFactory;
export const baseProcedure = t.procedure; 