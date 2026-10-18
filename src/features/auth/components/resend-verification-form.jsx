"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "../../../components/ui/button.jsx";
import { Input } from "../../../components/ui/input.jsx";
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
      if (response.status === 429) {
        setMessage("Too many requests. Please wait before requesting another link.");
      } else {
        setMessage(body?.error?.message || "Could not request a new link. Try again.");
      }
    } catch {
      setStatus("error");
      setMessage("Unable to connect. Please try again.");
    }
  }

  if (status === "success") {
    return <p role="status" className="text-sm text-green-700">{message}</p>;
  }

  return (
    <form onSubmit={handleSubmit(submit)} noValidate className="space-y-5">
      <div className="space-y-1.5">
        <label htmlFor="resend-email" className="block text-sm font-medium">Email address</label>
        <Input
          id="resend-email"
          type="email"
          autoComplete="email"
          aria-invalid={Boolean(errors.email)}
          aria-describedby={errors.email ? "resend-email-error" : undefined}
          {...register("email")}
        />
        {errors.email && (
          <p id="resend-email-error" role="alert" className="text-sm text-red-700">
            {errors.email.message}
          </p>
        )}
      </div>
      {status === "error" && <p role="alert" className="text-sm text-red-700">{message}</p>}
      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? "Requesting…" : "Send new verification link"}
      </Button>
    </form>
  );
}
