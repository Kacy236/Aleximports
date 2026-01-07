"use client"; 

import { toast } from "sonner";
import { useTRPC } from "@/trpc/client";
import { InboxIcon, LoaderIcon } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";

import { useCart } from "../../hooks/use-cart";
import { generateTenantURL } from "@/lib/utils";
import { CheckoutItem } from "../components/checkout-item";
import { CheckoutSidebar } from "../components/checkout-sidebar";
import { useCheckoutStates } from "../../hooks/use-checkout-states";
import { Media, Product } from "@/payload-types";

interface CheckoutViewProps {
    tenantSlug: string;
}

export const CheckoutView = ({ tenantSlug }: CheckoutViewProps) => {
    const router = useRouter();
    const [states, setStates] = useCheckoutStates();
    
    // items is now [{ productId, variantId }, ...]
    const { items, removeProduct, clearCart } = useCart(tenantSlug);

    const trpc = useTRPC();
    const queryClient = useQueryClient();
    
    // Extract unique IDs for the query
    const flatIds = useMemo(() => items.map(i => i.productId), [items]);

    const { data, error, isLoading } = useQuery(
        trpc.checkout.getProducts.queryOptions({
            ids: flatIds,
        })
    );

    const purchase = useMutation(
        trpc.checkout.purchase.mutationOptions({
            onMutate: () => {
                setStates({ success: false, cancel: false });
            },
            onSuccess: (data) => {
                window.location.href = data.url;
            },
            onError: (error) => {
                if (error.data?.code === "UNAUTHORIZED") {
                    window.location.href = "https://aleximportsshop.store/sign-in";
                    return;
                }
                toast.error(error.message);
            },
        })
    );

    /**
     * ✅ DYNAMIC TOTAL CALCULATION
     * Matches the specific variant price if a variantId exists in the cart item
     */
    const totalAmount = useMemo(() => {
        if (!data?.docs || items.length === 0) return 0;

        return items.reduce((acc, cartItem) => {
            const product = data.docs.find((p) => p.id === cartItem.productId);
            if (!product) return acc;

            let price = Number(product.price || 0);

            // If user picked a variant, check for a price override
            if (cartItem.variantId && product.hasVariants) {
                const variant = (product as any).variants?.find(
                    (v: any) => v.id === cartItem.variantId
                );
                if (variant?.variantPrice) {
                    price = Number(variant.variantPrice);
                }
            }
            
            return acc + price;
        }, 0);
    }, [data?.docs, items]);

    useEffect(() => {
        if (states.success) {
            setStates({ success: false, cancel: false });
            clearCart();
            queryClient.invalidateQueries(
                trpc.library.getMany.infiniteQueryFilter()
            );
            router.push("/library");
        }
    }, [states.success, clearCart, router, setStates, queryClient, trpc.library]);

    useEffect(() => {
        if (error?.data?.code === "NOT_FOUND") {
            clearCart();
            toast.warning("Invalid products found, cart cleared");
        }
    }, [error, clearCart]);

    if (isLoading) {
        return (
            <div className="lg:pt-16 pt-4 px-4 lg:px-12">
                <div className="border border-black border-dashed flex items-center justify-center p-8 flex-col gap-y-4 bg-white w-full rounded-lg">
                    <LoaderIcon className="text-muted-foreground animate-spin" />     
                </div>
            </div>
        );
    }

    if (!data || !data.docs || items.length === 0) {
        return (
            <div className="lg:pt-16 pt-4 px-4 lg:px-12">
                <div className="border border-black border-dashed flex items-center justify-center p-8 flex-col gap-y-4 bg-white w-full rounded-lg">
                    <InboxIcon />
                    <p className="text-base font-medium">No Products found</p>
                </div>
            </div>
        );
    }
    
    return (
        <div className="lg:pt-16 pt-4 px-4 lg:px-12">
            <div className="grid grid-cols-1 lg:grid-cols-7 gap-4 lg:gap-16">
                <div className="lg:col-span-4">
                    <div className="border rounded-md overflow-hidden bg-white">
                        {items.map((cartItem, index) => {
                            // Find product data for this cart item
                            const product = data.docs.find(p => p.id === cartItem.productId);
                            if (!product) return null;

                            const firstImageRow = product.images?.[0];
                            const imageObject = firstImageRow?.image as Media | undefined;
                            
                            // Determine display price (variant vs base)
                            let displayPrice = product.price;
                            if (cartItem.variantId && product.hasVariants) {
                                const variant = (product as any).variants?.find((v: any) => v.id === cartItem.variantId);
                                if (variant?.variantPrice) displayPrice = variant.variantPrice;
                            }

                            return (
                                <CheckoutItem
                                    key={`${cartItem.productId}-${cartItem.variantId}`}
                                    isLast={index === items.length - 1}
                                    imageUrl={imageObject?.url}
                                    name={product.name}
                                    productUrl={`${generateTenantURL(product.tenant.slug)}/products/${product.id}`}
                                    tenantUrl={generateTenantURL(product.tenant.slug)}
                                    tenantName={product.tenant.name}
                                    price={displayPrice}
                                    // Match new removeProduct signature
                                    onRemove={() => removeProduct(cartItem.productId, cartItem.variantId)}
                                />
                            );
                        })}
                    </div>
                </div>

                <div className="lg:col-span-3">
                    <CheckoutSidebar
                        total={totalAmount} 
                        // ✅ Updated to send cartItems (array of objects) instead of productIds (array of strings)
                        onPurchase={() => purchase.mutate({ 
                            tenantSlug, 
                            cartItems: items.map(i => ({ productId: i.productId, variantId: i.variantId })) 
                        })}
                        isCanceled={states.cancel}
                        disabled={purchase.isPending}
                    />
                </div>
            </div>
        </div>
    );
};