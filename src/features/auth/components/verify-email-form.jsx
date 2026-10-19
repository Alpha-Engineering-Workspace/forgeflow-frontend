"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { ArrowRight, LoaderCircle, ShieldCheck } from "lucide-react";
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
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ token }),
        cache: "no-store",
      });
      if (response.status === 204) {
        setState("success");
        setMessage("Your email has been verified. You can now sign in.");
        window.history.replaceState(window.history.state, "", "/verify-email");
        return;
      }
      const body = await response.json().catch(() => null);
      setState("failed");
      setMessage(
        response.status === 400
          ? "This link is invalid, expired, or already used. Request a new verification email."
          : response.status === 429
            ? "Too many attempts. Please wait and try again."
            : body?.error?.message || "Email verification is temporarily unavailable. Try again.",
      );
    } catch {
      setState("failed");
      setMessage("Could not connect. Please try again.");
    }
  }

  if (!validLink) {
    return (
      <div className="space-y-5">
        <InlineAlert tone="error" title="Verification link missing or invalid">
          The link is missing or no longer valid. Request a fresh one and use it within 12 hours.
        </InlineAlert>
        <Link
          href="/resend-verification"
          className="ff-text-link inline-flex min-h-11 items-center text-[13.5px] font-semibold"
        >
          Request a new verification email
        </Link>
      </div>
    );
  }

  if (state === "success") {
    return (
      <div className="space-y-5">
        <InlineAlert tone="success" title="Your email is verified">
          You can now sign in to your workspace.
        </InlineAlert>
        <Link href="/login">
          <Button className="w-full" size="lg">
            Go to sign in
            <ArrowRight size={16} aria-hidden="true" />
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--ff-primary-soft)] text-[var(--ff-primary)]">
        <ShieldCheck size={20} aria-hidden="true" />
      </div>
      <div>
        <h2 className="text-[20px] font-semibold tracking-[-0.025em] text-[var(--ff-text-strong)]">
          Confirm your email
        </h2>
        <p className="mt-2 text-[14px] leading-[1.6] text-[var(--ff-muted)]">
          For security, the link is only used when you press the button below.
          Opening the page alone won’t consume it.
        </p>
      </div>
      {state === "failed" && <InlineAlert tone="error">{message}</InlineAlert>}
      {state === "idle" && (
        <InlineAlert tone="info" title="One tap to confirm">
          The button below sends a secure POST to our verification endpoint.
        </InlineAlert>
      )}
      <Button
        type="button"
        onClick={verify}
        disabled={state === "pending"}
        className="w-full"
        size="lg"
      >
        {state === "pending" ? (
          <>
            <LoaderCircle size={17} className="animate-spin motion-reduce:animate-none" aria-hidden="true" />
            Verifying…
          </>
        ) : (
          <>
            Verify my email
            <ArrowRight size={16} aria-hidden="true" />
          </>
        )}
      </Button>
      {state === "failed" && (
        <Link
          href="/resend-verification"
          className="ff-text-link inline-flex min-h-11 items-center text-[13px] font-semibold"
        >
          Request a new verification email →
        </Link>
      )}
    </div>
  );
}
