import z from "zod";
import { protectedProcedure, createTRPCRouter } from "@/trpc/init";
import { Media, Tenant } from "@/payload-types";
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
              status: { equals: "success" },
            },
          ],
        },
      });

      const order = ordersData.docs[0];

      if (!order) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Order not found or you do not own this product",
        });
      }

      const product = await ctx.db.findByID({
        collection: "products",
        id: input.productId,
        depth: 2, 
      });

      if (!product) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Product not found",
        });
      }

      return product;
    }),

  getMany: protectedProcedure
    .input(
      z.object({
        cursor: z.number().nullish().default(1),
        limit: z.number().default(DEFAULT_LIMIT),
      }),
    )
    .query(async ({ ctx, input }) => {
      // ✅ THE FIX: Ensure cursor is a number (fallback to 1) for Payload CMS
      const pageNumber = input.cursor ?? 1;

      const ordersData = await ctx.db.find({
        collection: "orders",
        depth: 0,
        page: pageNumber, // 👈 Use the safe variable here
        limit: input.limit,
        where: {
          and: [
            {
              user: { equals: ctx.session.user.id },
            },
            {
              status: { equals: "success" },
            },
          ],
        },
      });

      const productIds = ordersData.docs.flatMap((order: any) => order.products || []);
      const uniqueProductIds = [...new Set(productIds)];

      const productsData = await ctx.db.find({
        collection: "products",
        pagination: false,
        depth: 2, 
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
        // ✅ Ensure nextPage is null (not undefined) for Tanstack Infinite Query
        nextPage: ordersData.nextPage ?? null,
        hasNextPage: ordersData.hasNextPage,
        docs: dataWithSummarizedReviews.map((doc) => ({
          ...doc,
          images: doc.images, 
          tenant: doc.tenant as Tenant & { image: Media | null },
        })),
      };
    }),
});