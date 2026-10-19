"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { ArrowRight, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { InlineAlert } from "@/components/ui/inline-alert";

const TOKEN_FORMAT = /^[A-Za-z0-9_-]{30,200}$/;

export function VerifyEmailForm() {
  const params = useSearchParams();
  const token = params.get("token") ?? "";
  const validLink = TOKEN_FORMAT.test(token);
  const [state, setState] = useState("idle");
  const [message, setMessage] = useState("");

  async function verify() {
    if (!validLink || state === "pending" || state === "success") return;
    setState("pending");
    setMessage("");
    try {
      // GET only displays the page; consuming the secret requires explicit POST.
      const response = await fetch("/api/backend/auth/email/verify", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ token }), cache: "no-store",
      });
      if (response.status === 204) {
        setState("success");
        setMessage("Your email has been verified. You can now sign in.");
        window.history.replaceState(window.history.state, "", "/verify-email");
        return;
      }
      const body = await response.json().catch(() => null);
      setState("failed");
      setMessage(response.status === 400
        ? "This link is invalid, expired, or already used. Request a new verification email."
        : response.status === 429
          ? "Too many attempts. Please wait and try again."
          : body?.error?.message || "Email verification is temporarily unavailable. Try again.");
    } catch {
      setState("failed");
      setMessage("Could not connect. Please try again.");
    }
  }

  if (!validLink) {
    return (
      <div className="space-y-5">
        <InlineAlert tone="error">Verification link is missing or invalid.</InlineAlert>
        <Link href="/resend-verification" className="ff-text-link inline-flex min-h-11 items-center font-semibold text-sm">Request a new verification email <ArrowRight size={16} className="ml-2" aria-hidden="true" /></Link>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {state === "idle" && <InlineAlert>Verification only happens after you confirm below. Opening a link alone will not use it.</InlineAlert>}
      {message && <InlineAlert tone={state === "success" ? "success" : "error"}>{message}</InlineAlert>}
      {state === "success" && <Link href="/login" className="ff-text-link inline-flex min-h-11 items-center font-semibold text-sm">Go to sign in <ArrowRight size={16} className="ml-2" aria-hidden="true" /></Link>}
      {state === "failed" && <Link href="/resend-verification" className="ff-text-link inline-flex min-h-11 items-center font-semibold text-sm">Request a new verification email <ArrowRight size={16} className="ml-2" aria-hidden="true" /></Link>}
      {state !== "success" && (
        <Button type="button" onClick={verify} disabled={state === "pending"} className="w-full py-3">
          {state === "pending" ? <><LoaderCircle size={18} className="animate-spin motion-reduce:animate-none" aria-hidden="true" /> Verifying…</> : <>Verify my email <ArrowRight size={17} aria-hidden="true" /></>}
        </Button>
      )}
    </div>
  );
}
