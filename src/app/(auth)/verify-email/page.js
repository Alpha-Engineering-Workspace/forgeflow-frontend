import { Suspense } from "react";
import { VerifyEmailForm } from "../../../features/auth/components/verify-email-form.jsx";

export const metadata = {
  title: "Verify email | ForgeFlow",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

export default function VerifyEmailPage() {
  return (
    <main className="min-h-screen bg-[var(--ff-bg)] px-4 py-12 text-[var(--ff-text)]">
      <div className="mx-auto w-full max-w-md rounded-xl border border-[var(--ff-border)] bg-[var(--ff-surface)] p-6 shadow-sm sm:p-8">
        <div className="mb-6 h-1 w-14 rounded-full bg-[var(--ff-primary)]" />
        <h1 className="text-2xl font-semibold">Verify your email</h1>
        <p className="mt-2 mb-6 text-sm text-[var(--ff-muted)]">
          Confirm that you can access this inbox. Your verification link is valid for 12 hours.
        </p>
        <Suspense fallback={<p role="status">Preparing verification…</p>}>
          <VerifyEmailForm />
        </Suspense>
      </div>
    </main>
  );
}
