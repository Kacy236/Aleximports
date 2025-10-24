"use client";

import { useTRPC } from "@/trpc/client";
import { useMutation } from "@tanstack/react-query";
import { useEffect } from "react";
import { LoaderIcon } from "lucide-react";

const Page = () => {
  const trpc = useTRPC();

  const { mutate: verify } = useMutation(
    trpc.checkout.verify.mutationOptions({
      onSuccess: (data) => {
        alert(data.message || "Verification successful!");
        window.location.href = "/dashboard"; // ✅ Redirect after success
      },
      onError: (error) => {
        console.error("Verification error:", error);
        alert("Verification failed. Please try again.");
        window.location.href = "/";
      },
    })
  );

  useEffect(() => {
    verify();
  }, [verify]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <LoaderIcon className="animate-spin text-muted-foreground" />
    </div>
  );
};

export default Page;
