"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, LoaderCircle, Mail, Lock, User as UserIcon } from "lucide-react";
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
      <div className="space-y-5">
        <InlineAlert tone="success" title="Check your inbox">
          We sent a verification link. It expires in 12 hours.
          Account creation does not guarantee email delivery.
        </InlineAlert>
        <Link
          href="/resend-verification"
          className="ff-text-link block min-h-11 py-2.5 text-[13.5px] font-semibold"
        >
          Didn’t get an email? Request a new link
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(submit)} noValidate className="space-y-4" aria-busy={isSubmitting}>
      <Field id="register-name" label="Full name" error={errors.name}>
        <div className="relative">
          <UserIcon
            size={15}
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-[var(--ff-muted-soft)]"
          />
          <Input
            id="register-name"
            type="text"
            autoComplete="name"
            placeholder="Your full name"
            className="pl-10"
            aria-invalid={Boolean(errors.name)}
            aria-describedby={errors.name ? "register-name-error" : undefined}
            {...register("name")}
          />
        </div>
      </Field>
      <Field id="register-email" label="Email address" error={errors.email}>
        <div className="relative">
          <Mail
            size={15}
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-[var(--ff-muted-soft)]"
          />
          <Input
            id="register-email"
            type="email"
            autoComplete="email"
            placeholder="you@company.com"
            className="pl-10"
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? "register-email-error" : undefined}
            {...register("email")}
          />
        </div>
      </Field>
      <Field id="register-password" label="Password" error={errors.password} hint="At least 12 characters, at most 72 UTF-8 bytes.">
        <div className="relative">
          <Lock
            size={15}
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-[var(--ff-muted-soft)]"
          />
          <PasswordField
            id="register-password"
            autoComplete="new-password"
            placeholder="Create a secure password"
            className="pl-10"
            aria-invalid={Boolean(errors.password)}
            aria-describedby={["register-password-hint", errors.password ? "register-password-error" : ""].filter(Boolean).join(" ")}
            {...register("password")}
          />
        </div>
      </Field>
      {serverError && <InlineAlert tone="error">{serverError}</InlineAlert>}
      <Button type="submit" disabled={isSubmitting} className="mt-2 w-full" size="lg">
        {isSubmitting ? (
          <>
            <LoaderCircle size={17} className="animate-spin motion-reduce:animate-none" aria-hidden="true" />
            Creating your account…
          </>
        ) : (
          <>
            Create account
            <ArrowRight size={16} aria-hidden="true" />
          </>
        )}
      </Button>
      <p className="pt-2 text-center text-[12.5px] text-[var(--ff-muted)]">
        Already have an account?{" "}
        <Link href="/login" className="ff-text-link">
          Sign in
        </Link>
      </p>
    </form>
  );
}
