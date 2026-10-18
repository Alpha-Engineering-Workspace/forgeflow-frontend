"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "../../../components/ui/button.jsx";
import { Input } from "../../../components/ui/input.jsx";
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
    <form onSubmit={handleSubmit(submit)} noValidate className="space-y-5">
      <div className="space-y-1.5">
        <label htmlFor="login-email" className="block text-sm font-medium">Email address</label>
        <Input id="login-email" type="email" autoComplete="email" aria-invalid={Boolean(errors.email)} {...register("email")} />
        {errors.email && <p role="alert" className="text-sm text-red-700">{errors.email.message}</p>}
      </div>
      <div className="space-y-1.5">
        <label htmlFor="login-password" className="block text-sm font-medium">Password</label>
        <Input id="login-password" type="password" autoComplete="current-password" aria-invalid={Boolean(errors.password)} {...register("password")} />
        {errors.password && <p role="alert" className="text-sm text-red-700">{errors.password.message}</p>}
      </div>
      {serverError && <p role="alert" className="text-sm text-red-700">{serverError}</p>}
      {needsVerification && <Link href="/resend-verification" className="text-sm underline">Request a new verification link</Link>}
      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? "Signing in…" : "Sign in"}
      </Button>
      <p className="text-center text-sm text-[var(--ff-muted)]">
        New to ForgeFlow? <Link href="/register" className="underline">Create an account</Link>
      </p>
    </form>
  );
}
