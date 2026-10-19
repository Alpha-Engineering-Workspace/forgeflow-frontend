"use client";

import { useState } from "react";
import { LoaderCircle, ArrowRight } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { InlineAlert } from "@/components/ui/inline-alert";
import { resendVerificationSchema } from "../resend-schema.js";

export function ResendVerificationForm() {
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(resendVerificationSchema),
    defaultValues: { email: "" },
  });

  async function submit(values) {
    setStatus("idle");
    setMessage("");
    try {
      const response = await fetch("/api/backend/auth/email/resend", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(values),
      });
      if (response.status === 202) {
        setStatus("success");
        setMessage("If your account needs verification, a new link will be sent. Check your inbox and spam folder.");
        return;
      }
      const body = await response.json().catch(() => null);
      setStatus("error");
      setMessage(response.status === 429
        ? "Too many requests. Please wait before requesting another link."
        : body?.error?.message || "Could not request a new link. Try again.");
    } catch {
      setStatus("error");
      setMessage("Unable to connect. Please try again.");
    }
  }

  if (status === "success") {
    // Generic confirmation: never reveal whether an account exists or is verified.
    return <InlineAlert tone="success">{message}</InlineAlert>;
  }

  return (
    <form onSubmit={handleSubmit(submit)} noValidate className="space-y-5" aria-busy={isSubmitting}>
      <Field id="resend-email" label="Email address" error={errors.email}>
        <Input id="resend-email" type="email" autoComplete="email" placeholder="you@company.com"
          aria-invalid={Boolean(errors.email)} aria-describedby={errors.email ? "resend-email-error" : undefined}
          {...register("email")} />
      </Field>
      {status === "error" && <InlineAlert tone="error">{message}</InlineAlert>}
      <Button type="submit" disabled={isSubmitting} className="w-full py-3">
        {isSubmitting ? <><LoaderCircle size={18} className="animate-spin motion-reduce:animate-none" aria-hidden="true" /> Requesting…</> : <>Send new verification link <ArrowRight size={17} aria-hidden="true" /></>}
      </Button>
    </form>
  );
}
