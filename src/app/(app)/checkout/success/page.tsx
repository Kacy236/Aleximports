"use client";

import { useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTRPC } from "@/trpc/client";
import { toast } from "sonner";

export default function CheckoutSuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const reference = searchParams.get("reference");
  const trpc = useTRPC();
  const verified = useRef(false);

  useEffect(() => {
    if (!reference || verified.current) return;

    verified.current = true;

    trpc.checkout.verifyTransaction
      .mutateAsync({ reference })
      .then(() => {
        toast.success("Payment successful 🎉");
        router.replace("/library"); // or /orders
      })
      .catch(() => {
        toast.error("Payment verification failed");
      });
  }, [reference, router, trpc]);

  return (
    <div className="flex h-[60vh] items-center justify-center">
      <p className="text-lg font-medium">Verifying your payment…</p>
    </div>
  );
}
