"use client";

import { useTRPC } from "@/trpc/client";
import { useMutation } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { LoaderIcon } from "lucide-react";
import { useSearchParams, useRouter } from "next/navigation";
import { toast } from "sonner";

const Page = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const trpc = useTRPC();
  
  // Use a ref to prevent double-calling in React Strict Mode
  const hasCalledVerify = useRef(false);

  // 1. Get the reference from the URL
  const reference = searchParams.get("reference");

  const { mutate: verify, isPending } = useMutation(
    trpc.checkout.verify.mutationOptions({
      onSuccess: (data) => {
        toast.success(data.message || "Payment verified successfully!");
        // Small delay to let the toast be seen before redirect
        setTimeout(() => {
          router.push("/dashboard"); 
        }, 1500);
      },
      onError: (error) => {
        console.error("Verification error:", error);
        toast.error(error.message || "Verification failed. Please contact support.");
        router.push("/");
      },
    })
  );

  useEffect(() => {
    // 2. Only run if we have a reference and haven't called it yet
    if (reference && !hasCalledVerify.current) {
      hasCalledVerify.current = true;
      verify({ reference }); // Pass the reference to your tRPC procedure
    } else if (!reference) {
      toast.error("No transaction reference found.");
      router.push("/");
    }
  }, [reference, verify, router]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4">
      <LoaderIcon className="h-8 w-8 animate-spin text-primary" />
      <div className="text-center">
        <h2 className="text-xl font-semibold">Verifying Payment</h2>
        <p className="text-sm text-muted-foreground">
          Please do not close this window while we confirm your transaction.
        </p>
      </div>
    </div>
  );
};

export default Page;