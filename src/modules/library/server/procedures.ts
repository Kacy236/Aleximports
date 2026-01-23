import z from "zod";
import { protectedProcedure, createTRPCRouter } from "@/trpc/init";
import { Media, Tenant, Product } from "@/payload-types";
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
      // 1. Find the successful order for this specific user and product
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

      // 2. Fetch the full product details
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

      /**
       * ✅ UPDATED VARIANT DETECTION
       * We first look for the pre-formatted 'variantName' we stored during checkout.
       */
      let purchasedVariantName: string | null = null;

      // Handle the 'items' array on the order
      const items = (order as any).items || [];
      
      const orderItem = items.find((item: any) => {
        // Handle cases where item.product might be an object or a string ID
        const productIdOnOrder = typeof item.product === 'object' 
          ? item.product.id 
          : item.product;
          
        return productIdOnOrder === input.productId;
      });

      if (orderItem) {
        // 1. Use stored variantName from checkout
        if (orderItem.variantName) {
          purchasedVariantName = orderItem.variantName;
        } 
        // 2. Fallback: manual lookup if only variantId exists
        else if (orderItem.variantId && product.hasVariants && product.variants) {
          const variant = product.variants.find((v: any) => v.id === orderItem.variantId);
          if (variant) {
            const parts = [variant.color, variant.size].filter(Boolean);
            purchasedVariantName = parts.length > 0 ? parts.join(" / ") : "Standard";
          }
        }
      }

      return {
        ...product,
        purchasedVariant: purchasedVariantName, 
      };
    }),

  getMany: protectedProcedure
    .input(
      z.object({
        cursor: z.number().nullish().default(1),
        limit: z.number().default(DEFAULT_LIMIT),
      }),
    )
    .query(async ({ ctx, input }) => {
      const pageNumber = input.cursor ?? 1;

      const ordersData = await ctx.db.find({
        collection: "orders",
        depth: 0,
        page: pageNumber,
        limit: input.limit,
        where: {
          and: [
            { user: { equals: ctx.session.user.id } },
            { status: { equals: "success" } },
          ],
        },
      });

      // ✅ Safe extraction of IDs
      const productIds = ordersData.docs.flatMap((order: any) => {
        const ids = order.products || [];
        return Array.isArray(ids) ? ids : [ids];
      });
      
      const uniqueProductIds = [...new Set(productIds.filter(Boolean))] as string[];

      if (uniqueProductIds.length === 0) {
        return { totalDocs: 0, nextPage: null, hasNextPage: false, docs: [] };
      }

      const productsData = await ctx.db.find({
        collection: "products",
        pagination: false,
        depth: 2,
        where: {
          id: { in: uniqueProductIds },
        },
      });

      const dataWithSummarizedReviews = await Promise.all(
        productsData.docs.map(async (doc) => {
          const reviewsData = await ctx.db.find({
            collection: "reviews",
            pagination: false,
            where: { product: { equals: doc.id } },
          });

          return {
            ...doc,
            reviewCount: reviewsData.totalDocs,
            reviewRating: reviewsData.docs.length === 0
                ? 0
                : reviewsData.docs.reduce((acc, r) => acc + r.rating, 0) / reviewsData.totalDocs,
          };
        })
      );

      return {
        totalDocs: productsData.totalDocs,
        nextPage: ordersData.nextPage ?? null,
        hasNextPage: ordersData.hasNextPage,
        docs: dataWithSummarizedReviews.map((doc) => ({
          ...doc,
          // ✅ Casting to ensure the UI gets the expected shape
          images: doc.images || [],
          tenant: doc.tenant as Tenant & { image: Media | null },
        })),
      };
    }),
});