"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, LoaderCircle } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { PasswordField } from "@/components/ui/password-field";
import { InlineAlert } from "@/components/ui/inline-alert";
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
      <div className="space-y-6">
        <InlineAlert tone="success" title="Your account is ready to verify.">
          Check your inbox for a verification link. It expires after 12 hours. An account being created does not guarantee email delivery.
        </InlineAlert>
        <div className="space-y-2 text-sm">
          <Link href="/resend-verification" className="ff-text-link block min-h-11 py-2 font-semibold">Didn’t get an email? Request a new link</Link>
          <Link href="/login" className="ff-text-link block min-h-11 py-2 font-semibold">Already verified? Sign in</Link>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(submit)} noValidate className="space-y-5" aria-busy={isSubmitting}>
      <Field id="register-name" label="Full name" error={errors.name}>
        <Input id="register-name" type="text" autoComplete="name" placeholder="Your full name"
          aria-invalid={Boolean(errors.name)} aria-describedby={errors.name ? "register-name-error" : undefined}
          {...register("name")} />
      </Field>
      <Field id="register-email" label="Email address" error={errors.email}>
        <Input id="register-email" type="email" autoComplete="email" placeholder="you@company.com"
          aria-invalid={Boolean(errors.email)} aria-describedby={errors.email ? "register-email-error" : undefined}
          {...register("email")} />
      </Field>
      <Field id="register-password" label="Password" error={errors.password} hint="At least 12 characters, at most 72 UTF-8 bytes.">
        <PasswordField id="register-password" autoComplete="new-password" placeholder="Create a secure password"
          aria-invalid={Boolean(errors.password)} aria-describedby={["register-password-hint", errors.password ? "register-password-error" : ""].filter(Boolean).join(" ")}
          {...register("password")} />
      </Field>
      {serverError && <InlineAlert tone="error">{serverError}</InlineAlert>}
      <Button type="submit" disabled={isSubmitting} className="mt-2 w-full py-3">
        {isSubmitting ? <><LoaderCircle size={18} className="animate-spin motion-reduce:animate-none" aria-hidden="true" /> Creating account…</> : <>Create account <ArrowRight size={17} aria-hidden="true" /></>}
      </Button>
      <p className="border-t border-[var(--ff-border)] pt-6 text-center text-sm text-[var(--ff-muted)]">
        Already have an account? <Link href="/login" className="ff-text-link font-semibold">Sign in</Link>
      </p>
    </form>
  );
}
