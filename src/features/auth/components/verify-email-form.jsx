"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { Button } from "../../../components/ui/button.jsx";

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
      const response = await fetch("/api/backend/auth/email/verify", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ token }),
        cache: "no-store",
      });
      if (response.status === 204) {
        setState("success");
        setMessage("Your email has been verified. You can sign in when the login page is ready.");
        // Remove the single-use credential from the address bar after success.
        window.history.replaceState(window.history.state, "", "/verify-email");
        return;
      }
      const body = await response.json().catch(() => null);
      setState("failed");
      if (response.status === 400) {
        setMessage("This link is invalid, expired, or already used. Request a new verification email.");
      } else if (response.status === 429) {
        setMessage("Too many attempts. Please wait and try again.");
      } else {
        setMessage(body?.error?.message || "Email verification is temporarily unavailable. Try again.");
      }
    } catch {
      setState("failed");
      setMessage("Could not connect. Please try again.");
    }
  }

  if (!validLink) {
    return <p role="alert" className="text-sm text-red-700">Verification link is missing or invalid. Request a new email.</p>;
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-[var(--ff-muted)]">
        To protect your account, verification only happens when you confirm below.
      </p>
      {message && (
        <p role={state === "success" ? "status" : "alert"} className={state === "success" ? "text-sm text-green-700" : "text-sm text-red-700"}>
          {message}
        </p>
      )}
      {state !== "success" && (
        <Button type="button" onClick={verify} disabled={state === "pending"} className="w-full">
          {state === "pending" ? "Verifying…" : "Verify my email"}
        </Button>
      )}
    </div>
  );
}
