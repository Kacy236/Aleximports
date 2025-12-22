"use client";

import { useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useTRPC } from "@/trpc/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useCart } from "@/modules/checkout/hooks/use-cart";

export const PurchaseListener = ({ tenantSlug }: { tenantSlug: string }) => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { clearCart } = useCart(tenantSlug);
  
  // Prevent double-running in React Strict Mode
  const hasVerified = useRef(false);

  const reference = searchParams.get("reference");

  const { mutate: verify } = useMutation(
    trpc.checkout.verifyTransaction.mutationOptions({
      onSuccess: () => {
        toast.success("Purchase successful! Items added to library.");
        clearCart();
        // Refresh the library so the user sees their new items
        queryClient.invalidateQueries(trpc.library.getMany.infiniteQueryFilter());
        // Clean the URL so the toast doesn't keep popping up
        router.replace("/");
      },
      onError: () => {
        toast.error("Failed to verify purchase.");
      },
    })
  );

  useEffect(() => {
    if (reference && !hasVerified.current) {
      hasVerified.current = true;
      verify({ reference });
    }
  }, [reference, verify]);

  return null; // This component doesn't render anything
};