"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { PasswordField } from "@/components/ui/password-field";
import { InlineAlert } from "@/components/ui/inline-alert";
import { loginSchema } from "../login-schema.js";

function loginError(result) {
  if (result?.code === "email_not_verified") return "Verify your email before signing in.";
  if (result?.code === "too_many_attempts") return "Too many login attempts. Please try again later.";
  if (result?.code === "login_unavailable") return "Login is temporarily unavailable. Try again later.";
  return "Invalid email or password.";
}

export function LoginForm() {
  const [serverError, setServerError] = useState("");
  const [needsVerification, setNeedsVerification] = useState(false);
  const router = useRouter();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  async function submit(values) {
    setServerError("");
    setNeedsVerification(false);
    try {
      // Keep M3's Auth.js sign-in path. Backend tokens never enter component state.
      const result = await signIn("credentials", {
        ...values,
        redirect: false,
        redirectTo: "/dashboard",
      });
      if (result?.error) {
        setNeedsVerification(result.code === "email_not_verified");
        setServerError(loginError(result));
        return;
      }
      router.replace("/dashboard");
      router.refresh();
    } catch {
      setServerError("Login is temporarily unavailable. Try again later.");
    }
  }

  return (
    <form onSubmit={handleSubmit(submit)} noValidate className="space-y-5" aria-busy={isSubmitting}>
      <Field id="login-email" label="Email address" error={errors.email}>
        <Input id="login-email" type="email" placeholder="you@company.com" autoComplete="email"
          aria-invalid={Boolean(errors.email)} aria-describedby={errors.email ? "login-email-error" : undefined}
          {...register("email")} />
      </Field>
      <Field id="login-password" label="Password" error={errors.password}>
        <PasswordField id="login-password" autoComplete="current-password" placeholder="Enter your password"
          aria-invalid={Boolean(errors.password)} aria-describedby={errors.password ? "login-password-error" : undefined}
          {...register("password")} />
      </Field>
      {serverError && <InlineAlert tone="error">{serverError}</InlineAlert>}
      {needsVerification && <Link href="/resend-verification" className="ff-text-link inline-flex min-h-11 items-center text-sm font-semibold">Request a new verification link</Link>}
      <Button type="submit" disabled={isSubmitting} className="mt-2 w-full py-3">
        {isSubmitting ? <><LoaderCircle size={18} className="animate-spin motion-reduce:animate-none" aria-hidden="true" /> Signing in…</> : <>Sign in <ArrowRight size={17} aria-hidden="true" /></>}
      </Button>
      <p className="border-t border-[var(--ff-border)] pt-6 text-center text-sm text-[var(--ff-muted)]">
        New to ForgeFlow? <Link href="/register" className="ff-text-link font-semibold">Create an account</Link>
      </p>
    </form>
  );
}
