import z from "zod";
import { TRPCError } from "@trpc/server";
import { Media, Tenant } from "@/payload-types";

import { baseProcedure, createTRPCRouter } from "@/trpc/init";

export const tenantsRouter = createTRPCRouter({
    // ✅ ADDED getMany to resolve the build error
    getMany: baseProcedure
        .query(async ({ ctx }) => {
            const tenants = await ctx.db.find({
                collection: "tenants",
                depth: 1,
                pagination: false, // We want all tenants for the filter list
                sort: "name",      // Optional: sort alphabetically
            });

            return tenants.docs as (Tenant & { image: Media | null })[];
        }),

    getOne: baseProcedure
    .input(
      z.object({
        slug: z.string(),
    }),
  )
    .query(async ({ ctx, input }) => {
           const tenantsData = await ctx.db.find({
            collection: "tenants",
            depth: 1, 
            where: {
              slug: {
                equals: input.slug,
              },
            },
            limit: 1,
            pagination: false,
          });

          const tenant = tenantsData.docs[0];

          if(!tenant) {
            throw new TRPCError({ code: "NOT_FOUND", message: "Tenant not found"});
          }

        return tenant as Tenant & { image: Media | null }
    }),
});