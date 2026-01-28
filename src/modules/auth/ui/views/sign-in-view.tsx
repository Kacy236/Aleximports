"use client";

import { useState } from "react";
import { Poppins } from "next/font/google";
import Link from "next/link";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Eye, EyeOff, Mail, Lock } from "lucide-react";

import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

import { loginSchema } from "../../schemas";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useTRPC } from "@/trpc/client";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["700"],
});

export const SignInView = () => {
  const router = useRouter();
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const [showPassword, setShowPassword] = useState(false);
  
  // Controls the toggle between Login form and OTP form
  const [isVerifying, setIsVerifying] = useState(false);
  const [authData, setAuthData] = useState({ email: "", password: "" });

  const login = useMutation(
    trpc.auth.login.mutationOptions({
      onError: (error) => {
        toast.error(error.message);
      },
      onSuccess: (data) => {
        // If the backend says we need OTP (which it now does for everyone)
        if (data.requiresOTP) {
          setIsVerifying(true);
          toast.info("Verification code sent to your email.");
        } else {
          // Fallback for immediate login if logic changes
          queryClient.invalidateQueries(trpc.auth.session.queryFilter());
          router.push("/");
        }
      },
    })
  );

  const verify = useMutation(
    trpc.auth.verifyOTP.mutationOptions({
      onError: (error) => toast.error(error.message),
      onSuccess: async () => {
        await queryClient.invalidateQueries(trpc.auth.session.queryFilter());
        toast.success("Signed in successfully!");
        router.push("/");
      },
    })
  );

  const form = useForm<z.infer<typeof loginSchema>>({
    mode: "all",
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const otpForm = useForm({
    defaultValues: { code: "" },
  });

  const onSubmit = (values: z.infer<typeof loginSchema>) => {
    // Store credentials in state so they can be sent with the OTP code
    setAuthData({ email: values.email, password: values.password });
    login.mutate(values);
  };

  const onVerifySubmit = (values: { code: string }) => {
    verify.mutate({
      email: authData.email,
      password: authData.password,
      code: values.code,
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 h-screen overflow-hidden">
      <div className="bg-[#F4F4F0] h-full w-full lg:col-span-3 overflow-y-auto">
        <div className="flex flex-col gap-8 p-4 lg:p-16">
          {/* HEADER */}
          <div className="flex items-center justify-between mb-8">
            <Link href="/">
              <span className={cn("text-2xl font-semibold", poppins.className)}>
                Aleximports
              </span>
            </Link>

            {!isVerifying && (
              <Button asChild variant="ghost" size="sm" className="text-base underline">
                <Link href="/sign-up">Sign up</Link>
              </Button>
            )}
          </div>

          {!isVerifying ? (
            /* --- STEP 1: LOGIN FORM --- */
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-8">
                <h1 className="text-4xl font-medium">Welcome back to AlexImports.</h1>

                <FormField
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base">Email</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="you@example.com" className="h-12" />
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
                            className="pr-10 h-12"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword((prev) => !prev)}
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

                <Button
                  disabled={login.isPending}
                  type="submit"
                  size="lg"
                  className="bg-black text-white hover:bg-green-500 hover:text-primary transition-colors h-14 text-lg"
                >
                  {login.isPending ? "Checking credentials..." : "Log in"}
                </Button>
              </form>
            </Form>
          ) : (
            /* --- STEP 2: OTP VERIFICATION VIEW --- */
            <div className="flex flex-col gap-6 max-w-md mx-auto w-full text-center py-10">
              <div className="bg-white p-5 rounded-full w-fit mx-auto shadow-sm border border-gray-100">
                <Lock className="h-10 w-10 text-blue-600" />
              </div>
              <h1 className="text-3xl font-bold">Two-Factor Auth</h1>
              <p className="text-muted-foreground">
                Enter the code sent to <br />
                <span className="font-semibold text-black">{authData.email}</span>
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
                    className="w-full bg-black h-14 text-lg font-semibold hover:bg-green-500 transition-all"
                  >
                    {verify.isPending ? "Verifying..." : "Verify & Sign In"}
                  </Button>
                </form>
              </Form>

              <button
                type="button"
                onClick={() => setIsVerifying(false)}
                className="text-sm text-muted-foreground hover:text-black hover:underline mt-4"
              >
                Back to Login
              </button>
            </div>
          )}
        </div>
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