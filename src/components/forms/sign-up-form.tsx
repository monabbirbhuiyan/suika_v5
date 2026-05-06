"use client";
import { authClient } from "@/lib/auth-client";
import { SignUpFormData, signUpSchema } from "@/lib/schemas";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowRight,
  Check,
  Eye,
  EyeOff,
  LockIcon,
  MailIcon,
  UserIcon,
  X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "../ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Checkbox } from "../ui/checkbox";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form";
import { Input } from "../ui/input";
import { Progress } from "../ui/progress";
import { auth } from "@/lib/auth";
import { getServerSession } from "@/action/get-session";
import { FloatingCards } from "../global/floating-cards";

const SignUpForm = () => {
  const router = useRouter();
  const [showPassword, setShowPassword] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [focusedField, setFocusedField] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [currentStep, setCurrentStep] = React.useState(0);

  const form = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      terms: false,
    },

    mode: "onChange",
  });

  const password = form.watch("password");

  // Staggered animation for form fields
  React.useEffect(() => {
    const timer = setInterval(() => {
      setCurrentStep((prev) => (prev < 5 ? prev + 1 : prev));
    }, 100);
    return () => clearInterval(timer);
  }, []);

  // Password strength calculation
  const getPasswordStrength = (pass: string) => {
    let strength = 0;
    if (pass.length >= 8) strength += 25;
    if (/[A-Z]/.test(pass)) strength += 25;
    if (/[0-9]/.test(pass)) strength += 25;
    if (/[^A-Za-z0-9]/.test(pass)) strength += 25;
    return strength;
  };

  const passwordStrength = getPasswordStrength(password);
  const strengthLabel =
    passwordStrength <= 25
      ? "Weak"
      : passwordStrength <= 50
        ? "Fair"
        : passwordStrength <= 75
          ? "Good"
          : "Strong";

  const passwordRequirements = [
    { label: "At least 8 characters", met: password.length >= 8 },
    { label: "One uppercase letter", met: /[A-Z]/.test(password) },
    { label: "One number", met: /[0-9]/.test(password) },
    { label: "One special character", met: /[^A-Za-z0-9]/.test(password) },
  ];

  const onSubmit = async (data: SignUpFormData) => {
    setIsLoading(true);
    setError(null);

    const { data: session, error } = await authClient.signUp.email({
      name: data.name,
      email: data.email,
      password: data.password,
    });

    setIsLoading(false);
    if (error) {
      setError(error.message || "An error occurred during sign up.");
      toast.error(error.message || "An error occurred during sign up.");
    } else if (session?.user) {
      toast.success("Account created successfully! Please check your email.");
      router.push(`/dashboard`);
    }
  };

  const onSocialSubmit = async (provider: "google" | "github") => {
    setIsLoading(true);
    setError(null);

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
    <div className="relative min-h-screen flex items-center justify-center p-4">
      <FloatingCards />
      <Card className="w-full max-w-md border-border bg-card/80 backdrop-blur-sm relative z-10">
        <CardHeader className="space-y-4">
          <div className="flex items-center gap-2 mx-auto">
            <Image src={"/assets/logo.svg"} alt="Logo" width={30} height={30} />
            <span className="text-2xl font-semibold">Suika</span>
          </div>
          <div className="text-center">
            <CardTitle className="text-2xl">Create an Account</CardTitle>
            <CardDescription>
              Start managing your problems more effeciently today.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Social signup buttons */}
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              className="w-full gap-2 bg-transparent"
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
              className="w-full gap-2 bg-transparent"
              type="button"
              onClick={() => onSocialSubmit("github")}
            >
              <svg className="size-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
              GitHub
            </Button>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                or continue with email
              </span>
            </div>
          </div>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {/* Name Field */}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem
                    className={`transition-all duration-500 ${
                      currentStep >= 0
                        ? "opacity-100 translate-y-0"
                        : "opacity-0 translate-y-4"
                    } ${focusedField === "name" ? "scale-[1.02]" : ""}`}
                  >
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <div className="relative group">
                        <UserIcon
                          className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors duration-300 ${
                            focusedField === "name"
                              ? "text-primary"
                              : "text-muted-foreground"
                          }`}
                        />
                        <Input
                          {...field}
                          type="text"
                          placeholder="John Doe"
                          className="pl-10 h-12 transition-all duration-300 focus:ring-2 focus:ring-primary/20"
                          onFocus={() => setFocusedField("name")}
                          onBlur={() => {
                            setFocusedField(null);
                            field.onBlur();
                          }}
                        />
                      </div>
                    </FormControl>
                  </FormItem>
                )}
              />

              {/* Email field */}
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem
                    className={`transition-all duration-500 ${
                      currentStep >= 1
                        ? "opacity-100 translate-y-0"
                        : "opacity-0 translate-y-4"
                    } ${focusedField === "email" ? "scale-[1.02]" : ""}`}
                  >
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <div className="relative group">
                        <MailIcon
                          className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors duration-300 ${
                            focusedField === "email"
                              ? "text-primary"
                              : "text-muted-foreground"
                          }`}
                        />
                        <Input
                          {...field}
                          type="email"
                          placeholder="you@mail.ca"
                          className="pl-10 h-12 transition-all duration-300 focus:ring-2 focus:ring-primary/20"
                          onFocus={() => setFocusedField("email")}
                          onBlur={() => {
                            setFocusedField(null);
                            field.onBlur();
                          }}
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
                    className={`transition-all duration-500 ${
                      currentStep >= 3
                        ? "opacity-100 translate-y-0"
                        : "opacity-0 translate-y-4"
                    } ${focusedField === "password" ? "scale-[1.02]" : ""}`}
                  >
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <div className="relative group">
                        <LockIcon
                          className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors duration-300 ${
                            focusedField === "password"
                              ? "text-primary"
                              : "text-muted-foreground"
                          }`}
                        />
                        <Input
                          {...field}
                          type={showPassword ? "text" : "password"}
                          placeholder="Create a strong password"
                          className="pl-10 pr-10 h-12 transition-all duration-300 focus:ring-2 focus:ring-primary/20"
                          onFocus={() => setFocusedField("password")}
                          onBlur={() => {
                            setFocusedField(null);
                            field.onBlur();
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {showPassword ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </FormControl>

                    {/* Password strength indicator */}
                    {password && (
                      <div className="space-y-3 animate-fade-in-up">
                        <div className="flex items-center gap-2">
                          <Progress
                            value={passwordStrength}
                            className="h-1.5 flex-1"
                          />
                          <span
                            className={`text-xs font-medium ${
                              passwordStrength <= 25
                                ? "text-destructive"
                                : passwordStrength <= 50
                                  ? "text-chart-3"
                                  : passwordStrength <= 75
                                    ? "text-chart-2"
                                    : "text-accent-foreground"
                            }`}
                          >
                            {strengthLabel}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          {passwordRequirements.map((req, i) => (
                            <div
                              key={req.label}
                              className={`flex items-center gap-1.5 text-xs transition-all duration-300 ${
                                req.met
                                  ? "text-accent-foreground"
                                  : "text-muted-foreground"
                              }`}
                              style={{ animationDelay: `${i * 0.05}s` }}
                            >
                              {req.met ? (
                                <Check className="w-3 h-3" />
                              ) : (
                                <X className="w-3 h-3" />
                              )}
                              {req.label}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    <FormMessage className="text-xs animate-fade-in-up" />
                  </FormItem>
                )}
              />
              {/* Terms checkbox */}
              <FormField
                control={form.control}
                name="terms"
                render={({ field }) => (
                  <FormItem
                    className={`transition-all duration-500 ${
                      currentStep >= 4
                        ? "opacity-100 translate-y-0"
                        : "opacity-0 translate-y-4"
                    }`}
                  >
                    <div className="flex items-start space-x-2">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          className="mt-1"
                        />
                      </FormControl>
                      <FormLabel className="text-sm text-muted-foreground cursor-pointer leading-relaxed font-normal">
                        I agree to the{" "}
                        <Link
                          href="/terms"
                          className="text-primary hover:underline"
                        >
                          Terms of Service
                        </Link>{" "}
                        and{" "}
                        <Link
                          href="/privacy"
                          className="text-primary hover:underline"
                        >
                          Privacy Policy
                        </Link>
                      </FormLabel>
                    </div>
                    <FormMessage className="text-xs animate-fade-in-up" />
                  </FormItem>
                )}
              />

              {/* Submit button */}
              <Button
                type="submit"
                className="w-full h-12 text-base font-semibold group relative overflow-hidden"
                disabled={isLoading}
              >
                <span
                  className={`inline-flex items-center gap-2 transition-all duration-300 ${
                    isLoading ? "opacity-0" : "opacity-100"
                  }`}
                >
                  Create account
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
          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <button
              type="button"
              className="text-primary font-medium hover:underline"
            >
              <Link href="/sign-in">Sign in</Link>
            </button>
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default SignUpForm;
