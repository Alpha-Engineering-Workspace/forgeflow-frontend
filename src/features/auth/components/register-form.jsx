"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "../../../components/ui/button.jsx";
import { Input } from "../../../components/ui/input.jsx";
import { registerSchema } from "../register-schema.js";

export function RegisterForm() {
  const [serverError, setServerError] = useState("");
  const [registered, setRegistered] = useState(false);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: "", email: "", password: "" },
  });

  async function submit(values) {
    setServerError("");
    try {
      const response = await fetch("/api/backend/auth/register", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(values),
      });
      if (response.status === 201) {
        setRegistered(true);
        return;
      }
      const body = await response.json().catch(() => null);
      setServerError(body?.error?.message || "Registration failed. Try again.");
    } catch {
      setServerError("Unable to connect. Please try again.");
    }
  }

  if (registered) {
    return (
      <div role="status" className="space-y-4">
        <p className="text-base font-semibold">Account created successfully.</p>
        <p className="text-sm text-[var(--ff-muted)]">Check your email for a verification link. It expires after 12 hours.</p>
        <Link href="/resend-verification" className="inline-block text-sm text-[var(--ff-link,#1D4ED8)] underline">Didn’t get an email? Request a new link</Link>
        <p className="text-sm"><Link href="/login" className="underline">Already verified? Sign in</Link></p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(submit)} noValidate className="space-y-5">
      <div className="space-y-1.5">
        <label htmlFor="register-name" className="block text-sm font-medium">Full name</label>
        <Input id="register-name" type="text" autoComplete="name" aria-invalid={Boolean(errors.name)} aria-describedby={errors.name ? "register-name-error" : undefined} {...register("name")} />
        {errors.name && <p id="register-name-error" role="alert" className="text-sm text-red-700">{errors.name.message}</p>}
      </div>
      <div className="space-y-1.5">
        <label htmlFor="register-email" className="block text-sm font-medium">Email</label>
        <Input id="register-email" type="email" autoComplete="email" aria-invalid={Boolean(errors.email)} aria-describedby={errors.email ? "register-email-error" : undefined} {...register("email")} />
        {errors.email && <p id="register-email-error" role="alert" className="text-sm text-red-700">{errors.email.message}</p>}
      </div>
      <div className="space-y-1.5">
        <label htmlFor="register-password" className="block text-sm font-medium">Password</label>
        <Input id="register-password" type="password" autoComplete="new-password" aria-invalid={Boolean(errors.password)} aria-describedby={errors.password ? "register-password-error" : undefined} {...register("password")} />
        <p className="text-xs text-[var(--ff-muted)]">At least 12 characters, at most 72 UTF-8 bytes.</p>
        {errors.password && <p id="register-password-error" role="alert" className="text-sm text-red-700">{errors.password.message}</p>}
      </div>
      {serverError && <p role="alert" className="text-sm text-red-700">{serverError}</p>}
      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? "Creating account…" : "Create account"}
      </Button>
    </form>
  );
}
