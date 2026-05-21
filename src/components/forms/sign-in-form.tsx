"use client";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import Link from "next/link";
import { ArrowRight, Eye, EyeOff, Lock, Mail, Network } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { SignInFormData, signInSchema } from "@/lib/schemas";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form";
import { Checkbox } from "../ui/checkbox";
import { Separator } from "../ui/separator";
import { getServerSession } from "@/action/get-session";
import { FloatingCards } from "../global/floating-cards";
import Image from "next/image";

const SignInForm = () => {
  const router = useRouter();
  const [showPassword, setShowPassword] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [focusedField, setFocusedField] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const form = useForm<SignInFormData>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false,
    },
  });

  const onSubmit = async (data: SignInFormData) => {
    setIsLoading(true);
    setError(null);

    const { data: session, error } = await authClient.signIn.email({
      email: data.email,
      password: data.password,
      rememberMe: data.rememberMe,
    });

    const user = session?.user;

    setIsLoading(false);
    if (error) {
      setError(error.message || "Something went wrong. Please try again.");
      toast.error(error.message || "Something went wrong. Please try again.");
    } else if (session?.user) {
      toast.success("Successfully signed in!");
      // Persist remember preference for client-side recovery
      try {
        if (data.rememberMe) {
          localStorage.setItem("suika_remember", "true");
        } else {
          localStorage.removeItem("suika_remember");
        }
      } catch (e) {
        // ignore (SSR safety not needed here in client component)
      }
      router.push(`/dashboard`);
    }
  };

  const onSocialSubmit = async (provider: "google" | "github") => {
    setIsLoading(true);
    setError(null);

    const session = await getServerSession();

    const { error } = await authClient.signIn.social({
      provider,
      callbackURL: `/dashboard`,
    });

    setIsLoading(false);

    if (error) {
      setError(error.message || "Something went wrong. Please try again.");
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 bg-linear-to-b from-brand-surface via-white to-brand-red-100/30 text-brand-ink">
      <FloatingCards />

      <Card className="w-full max-w-md border border-(--brand-green)/20 bg-white/85 backdrop-blur-sm shadow-xl relative z-10">
        <CardHeader className="space-y-4">
          <div className="flex items-center gap-2 mx-auto">
            <Image src={"/assets/logo.svg"} alt="Logo" width={30} height={30} />

            <span className="text-2xl font-semibold text-brand-ink">Suika</span>
          </div>
          <div className="text-center">
            <CardTitle className="text-2xl text-brand-ink">
              Welcome back
            </CardTitle>
            <CardDescription className="text-[#5b766c]">
              Sign in to continue your exploration
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem
                    className={`transition-all duration-300 ${
                      focusedField === "email" ? "scale-[1.02]" : ""
                    }`}
                  >
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <div className="relative group">
                        <Mail
                          className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors duration-300 ${
                            focusedField === "email"
                              ? "text-brand-green"
                              : "text-muted-foreground"
                          }`}
                        />
                        <Input
                          {...field}
                          type="email"
                          placeholder="you@university.edu"
                          className="pl-10 h-12 border-(--brand-green)/20 bg-white transition-all duration-300 focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green/40"
                          onFocus={() => setFocusedField("email")}
                          onBlur={() => {
                            setFocusedField(null);
                            field.onBlur();
                          }}
                        />
                        <div
                          className={`absolute inset-0 rounded-md bg-brand-green/5 -z-10 transition-opacity duration-300 ${
                            focusedField === "email"
                              ? "opacity-100"
                              : "opacity-0"
                          }`}
                        />
                      </div>
                    </FormControl>
                    <FormMessage className="text-xs animate-fade-in-up" />
                  </FormItem>
                )}
              />

              {/* Password field */}
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem
                    className={`transition-all duration-300 ${
                      focusedField === "password" ? "scale-[1.02]" : ""
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <FormLabel>Password</FormLabel>
                      <Link
                        href="/forgot-password"
                        className="text-xs text-brand-green hover:text-brand-green-700 transition-colors"
                      >
                        Forgot password?
                      </Link>
                    </div>
                    <FormControl>
                      <div className="relative group">
                        <Lock
                          className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors duration-300 ${
                            focusedField === "password"
                              ? "text-brand-green"
                              : "text-muted-foreground"
                          }`}
                        />
                        <Input
                          {...field}
                          type={showPassword ? "text" : "password"}
                          placeholder="Enter your password"
                          className="pl-10 pr-10 h-12 border-(--brand-green)/20 bg-white transition-all duration-300 focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green/40"
                          onFocus={() => setFocusedField("password")}
                          onBlur={() => {
                            setFocusedField(null);
                            field.onBlur();
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-brand-ink transition-colors"
                        >
                          {showPassword ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                        <div
                          className={`absolute inset-0 rounded-md bg-brand-green/5 -z-10 transition-opacity duration-300 ${
                            focusedField === "password"
                              ? "opacity-100"
                              : "opacity-0"
                          }`}
                        />
                      </div>
                    </FormControl>
                    <FormMessage className="text-xs animate-fade-in-up" />
                  </FormItem>
                )}
              />

              {/* Remember me */}
              <FormField
                control={form.control}
                name="rememberMe"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormLabel className="text-sm text-muted-foreground cursor-pointer font-normal">
                      Remember me for 30 days
                    </FormLabel>
                  </FormItem>
                )}
              />

              {/* Submit button */}
              <Button
                type="submit"
                className="w-full h-12 text-base font-semibold group relative overflow-hidden bg-brand-green hover:bg-brand-green-700 text-white"
                disabled={isLoading}
              >
                <span
                  className={`inline-flex items-center gap-2 transition-all duration-300 ${
                    isLoading ? "opacity-0" : "opacity-100"
                  }`}
                >
                  Sign in
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </span>
                {isLoading && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  </div>
                )}
              </Button>
            </form>
          </Form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-(--brand-green)/20" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-[#638076]">Or</span>
            </div>
          </div>

          {/* Social login buttons */}
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              className="w-full gap-2 bg-brand-red-100/55 border-(--brand-red)/30 text-brand-red-700 hover:bg-brand-red-100"
              type="button"
              onClick={() => onSocialSubmit("google")}
            >
              <svg className="size-4" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Google
            </Button>
            <Button
              variant="outline"
              className="w-full gap-2 bg-brand-green-100/55 border-(--brand-green)/30 text-brand-green-700 hover:bg-brand-green-100"
              type="button"
              onClick={() => onSocialSubmit("github")}
            >
              <svg className="size-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
              GitHub
            </Button>
          </div>

          <Separator />

          <p className="text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link
              href="/sign-up"
              className="text-brand-green hover:text-brand-green-700 hover:underline"
            >
              Sign up
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default SignInForm;
