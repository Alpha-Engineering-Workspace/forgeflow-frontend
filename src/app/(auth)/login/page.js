import { LoginForm } from "../../../features/auth/components/login-form.jsx";

export const metadata = { title: "Sign in | ForgeFlow" };

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-[var(--ff-bg)] px-4 py-12 text-[var(--ff-text)]">
      <div className="mx-auto w-full max-w-md rounded-xl border border-[var(--ff-border)] bg-[var(--ff-surface)] p-6 shadow-sm sm:p-8">
        <div className="mb-6 h-1 w-14 rounded-full bg-[var(--ff-primary)]" />
        <h1 className="text-2xl font-semibold">Sign in to ForgeFlow</h1>
        <p className="mb-8 mt-2 text-sm text-[var(--ff-muted)]">Use your verified account to continue.</p>
        <LoginForm />
      </div>
    </main>
  );
}
