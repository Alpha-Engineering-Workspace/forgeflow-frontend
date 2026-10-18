import Link from "next/link";
import { ResendVerificationForm } from "../../../features/auth/components/resend-verification-form.jsx";

export const metadata = {
  title: "Resend verification | ForgeFlow",
  robots: { index: false, follow: false },
};

export default function ResendVerificationPage() {
  return (
    <main className="min-h-screen bg-[var(--ff-bg)] px-4 py-12 text-[var(--ff-text)]">
      <div className="mx-auto w-full max-w-md rounded-xl border border-[var(--ff-border)] bg-[var(--ff-surface)] p-6 shadow-sm sm:p-8">
        <div className="mb-6 h-1 w-14 rounded-full bg-[var(--ff-primary)]" />
        <h1 className="text-2xl font-semibold">Request a new verification link</h1>
        <p className="mb-8 mt-2 text-sm text-[var(--ff-muted)]">
          Enter the email address you registered with. A new link is valid for 12 hours.
        </p>
        <ResendVerificationForm />
        <p className="mt-6 text-sm">
          <Link href="/register" className="text-[var(--ff-link,#1D4ED8)] underline">
            Back to registration
          </Link>
        </p>
      </div>
    </main>
  );
}
