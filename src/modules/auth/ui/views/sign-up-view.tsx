"use client";

import { useState } from "react";
import { Poppins } from "next/font/google";
import Link from "next/link";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Eye, EyeOff, Mail } from "lucide-react";

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

const NIGERIAN_BANKS = [
  { label: "Access Bank", value: "044" },
  { label: "Access Bank (Diamond)", value: "063" },
  { label: "EcoBank Nigeria", value: "050" },
  { label: "Fidelity Bank", value: "070" },
  { label: "First Bank of Nigeria", value: "011" },
  { label: "First City Monument Bank (FCMB)", value: "214" },
  { label: "Guaranty Trust Bank (GTB)", value: "058" },
  { label: "Kuda Bank", value: "50211" },
  { label: "Moniepoint MFB", value: "50515" },
  { label: "OPay Digital Services", value: "999992" },
  { label: "Stanbic IBTC Bank", value: "039" },
  { label: "Zenith Bank", value: "057" },
];

export const SignUpView = () => {
  const router = useRouter();
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  // --- STATE ---
  const [showPassword, setShowPassword] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  // This state holds the password so we can auto-login after OTP
  const [authData, setAuthData] = useState({ email: "", password: "" });

  // --- MUTATIONS ---
  const register = useMutation(
    trpc.auth.register.mutationOptions({
      onError: (error) => toast.error(error.message),
      onSuccess: (_, variables) => {
        // Save credentials in state for the auto-login step
        setAuthData({ email: variables.email, password: variables.password });
        setIsVerifying(true);
        toast.success("Account created! Check your email for the code.");
      },
    })
  );

  const verify = useMutation(
    trpc.auth.verifyOTP.mutationOptions({
      onError: (error) => toast.error(error.message),
      onSuccess: async () => {
        await queryClient.invalidateQueries(trpc.auth.session.queryFilter());
        toast.success("Verified successfully!");
        router.push("/");
      },
    })
  );

  // --- FORMS ---
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

  const otpForm = useForm({
    defaultValues: { code: "" },
  });

  // --- HANDLERS ---
  const onSubmit = (values: z.infer<typeof registerSchema>) => {
    register.mutate(values);
  };

  const onVerifySubmit = (values: { code: string }) => {
    verify.mutate({
      email: authData.email,
      password: authData.password, // Passed from state
      code: values.code,
    });
  };

  const username = form.watch("username");
  const showPreview = username && !form.formState.errors.username;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 h-screen overflow-hidden">
      <div className="bg-[#F4F4F0] h-full w-full lg:col-span-3 overflow-y-auto">
        <div className="flex flex-col gap-6 p-4 lg:p-16">
          {/* HEADER */}
          <div className="flex items-center justify-between mb-4">
            <Link href="/">
              <span className={cn("text-2xl font-semibold", poppins.className)}>
                Aleximports
              </span>
            </Link>
            {!isVerifying && (
              <Button asChild variant="ghost" size="sm" className="underline">
                <Link href="/sign-in">Sign in</Link>
              </Button>
            )}
          </div>

          {!isVerifying ? (
            /* --- STEP 1: REGISTRATION FORM --- */
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-6">
                <h1 className="text-4xl font-medium leading-tight">
                  Join over 1,000 creators earning money on AlexImports.
                </h1>

                <FormField
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base">User/storename</FormLabel>
                      <FormControl>
                        <Input placeholder="yourstorename" {...field} />
                      </FormControl>
                      <FormDescription className={cn("hidden", showPreview && "block")}>
                        Your store: <strong>{username}.aleximports.com</strong>
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base">Email</FormLabel>
                      <FormControl>
                        <Input placeholder="you@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base">Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            {...field}
                            type={showPassword ? "text" : "password"}
                            placeholder="Min. 3 characters"
                            className="pr-10"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword((p) => !p)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-black"
                          >
                            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <hr className="border-gray-300 my-2" />
                <h2 className="text-lg font-semibold">Payout Details (Nigeria)</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    name="bankCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Settlement Bank</FormLabel>
                        <FormControl>
                          <select {...field} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-black">
                            <option value="" disabled>Select Bank</option>
                            {NIGERIAN_BANKS.map((bank) => (
                              <option key={bank.value} value={bank.value}>{bank.label}</option>
                            ))}
                          </select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    name="accountNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Account Number</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="0123456789" maxLength={10} />
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
                  {register.isPending ? "Setting up shop..." : "Create account"}
                </Button>
              </form>
            </Form>
          ) : (
            /* --- STEP 2: VERIFICATION VIEW --- */
            <div className="flex flex-col gap-6 max-w-md mx-auto w-full text-center py-12">
              <div className="bg-white p-5 rounded-full w-fit mx-auto shadow-sm border border-gray-100">
                <Mail className="h-10 w-10 text-blue-600" />
              </div>
              <h1 className="text-3xl font-bold">Check your email</h1>
              <p className="text-muted-foreground">
                We've sent a 6-digit verification code to <br />
                <strong>{authData.email}</strong>
              </p>

              <Form {...otpForm}>
                <form onSubmit={otpForm.handleSubmit(onVerifySubmit)} className="space-y-6">
                  <FormField
                    name="code"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input
                            {...field}
                            maxLength={6}
                            className="text-center text-4xl tracking-[0.5em] font-bold h-20 border-2 focus:border-black"
                            placeholder="000000"
                            autoFocus
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button
                    disabled={verify.isPending}
                    type="submit"
                    className="w-full bg-black h-14 text-lg font-semibold hover:bg-green-500"
                  >
                    {verify.isPending ? "Verifying..." : "Confirm & Sign In"}
                  </Button>
                </form>
              </Form>

              <button
                type="button"
                onClick={() => setIsVerifying(false)}
                className="text-sm text-muted-foreground hover:text-black hover:underline underline-offset-4 mt-4"
              >
                Entered the wrong email? Go back
              </button>
            </div>
          )}
        </div>
      </div>

      {/* BACKGROUND IMAGE SIDEBAR */}
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