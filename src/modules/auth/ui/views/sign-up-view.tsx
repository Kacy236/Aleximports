"use client";

import { useState } from "react";
import { Poppins } from "next/font/google";
import Link from "next/link";
import z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";

import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

import { registerSchema } from "../../schemas";
import { useTRPC } from "@/trpc/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["700"],
});

/**
 * Nigerian banks
 */
const NIGERIAN_BANKS = [
  { label: "Access Bank", value: "044" },
  { label: "Access Bank (Diamond)", value: "063" },
  { label: "EcoBank Nigeria", value: "050" },
  { label: "Fidelity Bank", value: "070" },
  { label: "First Bank of Nigeria", value: "011" },
  { label: "First City Monument Bank (FCMB)", value: "214" },
  { label: "Guaranty Trust Bank (GTB)", value: "058" },
  { label: "Heritage Bank", value: "030" },
  { label: "Kuda Bank", value: "50211" },
  { label: "Moniepoint MFB", value: "50515" },
  { label: "OPay Digital Services", value: "999992" },
  { label: "Stanbic IBTC Bank", value: "039" },
  { label: "Sterling Bank", value: "232" },
  { label: "United Bank For Africa (UBA)", value: "033" },
  { label: "Union Bank of Nigeria", value: "032" },
  { label: "Unity Bank", value: "215" },
  { label: "Wema Bank", value: "035" },
  { label: "Zenith Bank", value: "057" },
];

export const SignUpView = () => {
  const router = useRouter();
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const [showPassword, setShowPassword] = useState(false);

  const register = useMutation(
    trpc.auth.register.mutationOptions({
      onError: (error) => toast.error(error.message),
      onSuccess: async () => {
        await queryClient.invalidateQueries(
          trpc.auth.session.queryFilter()
        );
        toast.success("Account created successfully!");
        router.push("/");
      },
    })
  );

  const form = useForm<z.infer<typeof registerSchema>>({
    mode: "all",
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: "",
      password: "",
      username: "",
      bankCode: "",
      accountNumber: "",
    },
  });

  const onSubmit = (values: z.infer<typeof registerSchema>) => {
    register.mutate(values);
  };

  const username = form.watch("username");
  const showPreview =
    username && !form.formState.errors.username;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5">
      <div className="bg-[#F4F4F0] h-screen w-full lg:col-span-3 overflow-y-auto">
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-col gap-6 p-4 lg:p-16"
          >
            {/* HEADER */}
            <div className="flex items-center justify-between mb-4">
              <Link href="/">
                <span
                  className={cn(
                    "text-2xl font-semibold",
                    poppins.className
                  )}
                >
                  Aleximports
                </span>
              </Link>

              <Button
                asChild
                variant="ghost"
                size="sm"
                className="underline"
              >
                <Link href="/sign-in">Sign in</Link>
              </Button>
            </div>

            <h1 className="text-4xl font-medium leading-tight">
              Join over 1,000 creators earning money on
              AlexImports.
            </h1>

            {/* USERNAME */}
            <FormField
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base">
                    Username
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="yourstorename"
                      {...field}
                    />
                  </FormControl>

                  <FormDescription
                    className={cn(
                      "hidden",
                      showPreview && "block"
                    )}
                  >
                    Your store will be available at&nbsp;
                    <strong>
                      {username}.aleximports.com
                    </strong>
                  </FormDescription>

                  <FormMessage />
                </FormItem>
              )}
            />

            {/* EMAIL */}
            <FormField
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base">
                    Email
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="you@example.com"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* PASSWORD WITH TOGGLE */}
            <FormField
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base">
                    Password
                  </FormLabel>

                  <FormControl>
                    <div className="relative">
                      <Input
                        {...field}
                        type={
                          showPassword
                            ? "text"
                            : "password"
                        }
                        placeholder="Min. 3 characters"
                        className="pr-10"
                      />

                      <button
                        type="button"
                        onClick={() =>
                          setShowPassword((p) => !p)
                        }
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-black"
                      >
                        {showPassword ? (
                          <EyeOff className="h-5 w-5" />
                        ) : (
                          <Eye className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                  </FormControl>

                  <FormMessage />
                </FormItem>
              )}
            />

            <hr className="border-gray-300 my-2" />
            <h2 className="text-lg font-semibold">
              Payout Details (Nigeria Only)
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* BANK */}
              <FormField
                name="bankCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base">
                      Settlement Bank
                    </FormLabel>
                    <FormControl>
                      <select
                        {...field}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-black"
                      >
                        <option value="" disabled>
                          Select your bank
                        </option>
                        {NIGERIAN_BANKS.map((bank) => (
                          <option
                            key={bank.value}
                            value={bank.value}
                          >
                            {bank.label}
                          </option>
                        ))}
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* ACCOUNT NUMBER */}
              <FormField
                name="accountNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base">
                      Account Number
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="0123456789"
                        maxLength={10}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Button
              disabled={register.isPending}
              type="submit"
              size="lg"
              className="bg-black text-white mt-4 hover:bg-green-500"
            >
              {register.isPending
                ? "Setting up your shop..."
                : "Create account"}
            </Button>
          </form>
        </Form>
      </div>

      <div
        className="h-screen w-full lg:col-span-2 hidden lg:block"
        style={{
          backgroundImage: "url('/background.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />
    </div>
  );
};
