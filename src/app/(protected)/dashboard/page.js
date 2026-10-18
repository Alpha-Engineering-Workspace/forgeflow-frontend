import { Suspense } from "react";
import { redirect } from "next/navigation";
import { auth, signOut } from "../../../auth.js";

async function DashboardContent() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <main className="min-h-screen bg-[var(--ff-bg)] px-4 py-12 text-[var(--ff-text)]">
      <div className="mx-auto max-w-3xl rounded-xl border border-[var(--ff-border)] bg-[var(--ff-surface)] p-8">
        <h1 className="text-2xl font-semibold">Welcome to ForgeFlow</h1>
        <p className="mt-3 text-[var(--ff-muted)]">Signed in as {session.user.name} ({session.user.email}).</p>
        <p className="mt-6 text-sm text-[var(--ff-muted)]">Workspace setup is coming in the next milestone.</p>
        <form
          className="mt-8"
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/login" });
          }}
        >
          <button type="submit" className="rounded-lg border border-[var(--ff-border)] px-4 py-2 text-sm font-semibold hover:bg-[var(--ff-bg)]">
            Sign out
          </button>
        </form>
      </div>
    </main>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<p className="p-8">Checking your session…</p>}>
      <DashboardContent />
    </Suspense>
  );
}
