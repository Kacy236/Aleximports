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
import { Media } from "@/payload-types";

interface CheckoutViewProps {
    tenantSlug: string;
}

export const CheckoutView = ({ tenantSlug }: CheckoutViewProps) => {
    const router = useRouter();
    const [states, setStates] = useCheckoutStates();
    
    // ✅ Use 'items' and 'updateQuantity' from your updated hook
    const { items, productIds, removeProduct, updateQuantity, clearCart } = useCart(tenantSlug);

    const trpc = useTRPC();
    const queryClient = useQueryClient();
    
    const { data, error, isLoading } = useQuery(trpc.checkout.getProducts.queryOptions({
        ids: productIds,
    }));

    const purchase = useMutation(trpc.checkout.purchase.mutationOptions({
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
    }));

    // ✅ Updated to calculate total based on Quantity
    const totalAmount = useMemo(() => {
        return data?.docs.reduce((acc, product) => {
            const cartItem = items.find((item) => item.id === product.id);
            const quantity = cartItem?.quantity || 1;
            return acc + (Number(product.price) * quantity || 0);
        }, 0) || 0;
    }, [data?.docs, items]);

    useEffect(() => {
        if (states.success) {
            setStates({ success: false, cancel: false });
            clearCart();
            queryClient.invalidateQueries(trpc.library.getMany.infiniteQueryFilter());
            router.push("/library");
        }
    }, [states.success, clearCart, router, setStates, queryClient, trpc.library.getMany]);

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

    if (!data || !data.docs || data.docs.length === 0) {
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
                        {data.docs.map((product, index) => {
                            const firstImageRow = product.images?.[0];
                            const imageObject = firstImageRow?.image as Media | undefined;
                            const imageUrl = imageObject?.url;

                            // ✅ Find specific quantity for this product
                            const quantity = items.find(i => i.id === product.id)?.quantity || 1;

                            return (
                                <CheckoutItem
                                  key={product.id}
                                  isLast={index === data.docs.length - 1}
                                  imageUrl={imageUrl}
                                  name={product.name}
                                  productUrl={`${generateTenantURL(product.tenant.slug)}/products/${product.id}`}
                                  tenantUrl={generateTenantURL(product.tenant.slug)}
                                  tenantName={product.tenant.name}
                                  price={product.price}
                                  quantity={quantity} // ✅ Pass current quantity
                                  onRemove={() => removeProduct(product.id)}
                                  onIncrease={() => updateQuantity(product.id, quantity + 1)} // ✅ Handler for +
                                  onDecrease={() => updateQuantity(product.id, quantity - 1)} // ✅ Handler for -
                                />
                            );
                        })}
                    </div>
                </div>

                <div className="lg:col-span-3">
                    <CheckoutSidebar
                      total={totalAmount} 
                      // ✅ Passing items (ids + quantities) to purchase mutation
                      onPurchase={() => purchase.mutate({ 
                        tenantSlug, 
                        items: items.map(i => ({ id: i.id, quantity: i.quantity })) 
                      })}
                      isCanceled={states.cancel}
                      disabled={purchase.isPending}
                    />
                </div>
            </div>
        </div>
    );
};