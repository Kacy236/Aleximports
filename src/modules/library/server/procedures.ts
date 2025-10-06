import z from "zod";

import { protectedProcedure, createTRPCRouter } from "@/trpc/init";
import { Media, Tenants } from "@/payload-types";
import { DEFAULT_LIMIT } from "@/constants";
import { TRPCError } from "@trpc/server";

export const libraryRouter = createTRPCRouter({
  getOne: protectedProcedure
    .input(
      z.object({
        productId: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const ordersData = await ctx.db.find({
        collection: "orders",
        limit: 1,
        pagination: false,
        where: {
          and: [
            {
              products: { equals: input.productId },
            },
            {
              user: { equals: ctx.session.user.id },
            },
            {
              status: { equals: "success" }, // ✅ only successful orders
            },
          ],
        },
      });

      // ✅ flatten product arrays from all orders
      const order = ordersData.docs[0];

      if (!order) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Order not found",
        });
      }
      

      const product = await ctx.db.findByID({
        collection: "products",
          id: input.productId,
      });

      if (!product) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Product not found",
        });
      }

      return product
    }),

    getMany: protectedProcedure
    .input(
      z.object({
        cursor: z.number().default(1),
        limit: z.number().default(DEFAULT_LIMIT),
      }),
    )
    .query(async ({ ctx, input }) => {
      const ordersData = await ctx.db.find({
        collection: "orders",
        depth: 0, // just raw IDs, no population
        page: input.cursor,
        limit: input.limit,
        where: {
          and: [
            {
              user: { equals: ctx.session.user.id },
            },
            {
              status: { equals: "success" }, // ✅ only successful orders
            },
          ],
        },
      });

      // ✅ flatten product arrays from all orders
      const productIds = ordersData.docs.flatMap((order: any) => order.products || []);

      // ✅ deduplicate (so same product doesn’t appear multiple times if bought twice)
      const uniqueProductIds = [...new Set(productIds)];

      const productsData = await ctx.db.find({
        collection: "products",
        pagination: false,
        where: {
          id: {
            in: uniqueProductIds,
          },
        },
      });

      const dataWithSummarizedReviews = await Promise.all(
        productsData.docs.map(async (doc) => {
          const reviewsData = await ctx.db.find({
            collection: "reviews",
            pagination: false,
            where: {
              product: {
                equals: doc.id,
              },
            },
          });

          return {
            ...doc,
            reviewCount: reviewsData.totalDocs,
            reviewRating:
              reviewsData.docs.length === 0
                ? 0
                : reviewsData.docs.reduce((acc, review) => acc + review.rating, 0) / reviewsData.totalDocs
          }
        })
      )


      return {
        totalDocs: productsData.totalDocs,
        docs: dataWithSummarizedReviews.map((doc) => ({
          ...doc,
          image: doc.image as Media | null,
          tenant: doc.tenant as Tenants & { image: Media | null },
        })),
      };
    }),

});
