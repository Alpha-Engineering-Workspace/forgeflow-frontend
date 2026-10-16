"use client";

import { useEffect, useState } from "react";

export function GatewayConnectionStatus() {
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState({ status: "checking", message: "Checking Gateway..." });

  useEffect(() => {
    const controller = new AbortController();

    async function checkConnection() {
      try {
        const response = await fetch("/api/backend/health", {
          cache: "no-store",
          signal: controller.signal,
        });
        const result = await response.json();
        if (!response.ok || result.connected !== true) {
          throw new Error("Health check failed");
        }

        if (!controller.signal.aborted) {
          setState({
            status: "connected",
            message: "Gateway is reachable (process-only readiness).",
          });
        }
      } catch {
        if (!controller.signal.aborted) {
          setState({ status: "unavailable", message: "Gateway is unavailable. Check Docker and configuration." });
        }
      }
    }

    checkConnection();
    return () => controller.abort();
  }, [attempt]);

  function retry() {
    setState({ status: "checking", message: "Checking Gateway..." });
    setAttempt((current) => current + 1);
  }

  return (
    <section className="rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-surface)] p-6 shadow-sm">
      <h2 className="text-lg font-semibold">Backend connectivity</h2>
      <p className="mt-2 text-sm text-[var(--ff-muted)]">
        Browser → Next.js BFF → Gateway. No login, private tokens, or application data yet.
      </p>
      <p role="status" className="mt-5 text-sm font-medium">
        {state.status === "connected" ? "Connected: " : state.status === "checking" ? "Checking: " : "Unavailable: "}
        {state.message}
      </p>
      <button
        type="button"
        onClick={retry}
        className="mt-5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
      >
        Check again
      </button>
    </section>
  );
}
