import { Suspense } from "react";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  CircleCheck,
  FolderKanban,
  Layers3,
  ListTodo,
  Sparkles,
} from "lucide-react";
import { auth, signOut } from "../../../auth.js";
import { WorkspaceShell } from "@/components/layout/workspace-shell";
import { PageHeader } from "@/components/ui/page-header";
import { DashboardSkeleton } from "@/components/ui/skeleton";

export const metadata = { title: "Overview | ForgeFlow" };

const nextSteps = [
  {
    number: "01",
    title: "Create a workspace",
    detail: "A dedicated space for your team and its work.",
    icon: Layers3,
  },
  {
    number: "02",
    title: "Add your first project",
    detail: "Bring related deliverables together.",
    icon: FolderKanban,
  },
  {
    number: "03",
    title: "Track tasks on a board",
    detail: "Manage issues and watch their progress.",
    icon: ListTodo,
  },
];

async function DashboardContent() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  async function signOutAction() {
    "use server";
    await signOut({ redirectTo: "/login" });
  }

  const givenName = session.user.name?.trim().split(/\s+/)[0] || "there";
  return (
    <WorkspaceShell
      user={{ name: session.user.name, email: session.user.email }}
      signOutAction={signOutAction}
    >
      <div className="mx-auto max-w-[1220px] space-y-9 px-4 py-8 sm:px-7 sm:py-10 lg:px-10">
        <PageHeader
          eyebrow="YOUR OVERVIEW"
          title={`Welcome, ${givenName}.`}
          description="You're signed in. This is where your projects and team workspace will come together."
        />
        <div className="grid items-stretch gap-5 xl:grid-cols-[minmax(0,1.42fr)_minmax(310px,0.9fr)]">
          <section className="relative flex min-h-80 flex-col overflow-hidden rounded-2xl border border-[#1F3554] bg-[var(--ff-sidebar)] p-6 text-white sm:p-9">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -right-20 -bottom-32 h-80 w-80 rounded-full border-[42px] border-cyan-400/10"
            />
            <div className="relative z-10 mb-auto flex items-center gap-2 text-xs font-semibold tracking-[.12em] text-cyan-300 uppercase">
              <Sparkles size={16} aria-hidden="true" /> The beginning of your
              workspace
            </div>
            <div className="relative z-10 mt-14 max-w-lg">
              <h2 className="text-3xl font-semibold tracking-[-.045em] sm:text-4xl">
                A clear place to start.
              </h2>
              <p className="mt-4 max-w-md text-sm leading-7 text-slate-300">
                You have not created a workspace yet. Workspace creation and
                secure team permissions are the next features we are building.
              </p>{" "}
            </div>
            <div className="relative z-10 mt-8 flex w-fit items-center gap-2 rounded-lg border border-white/20 px-4 py-3 text-xs font-semibold text-slate-200">
              <CircleCheck size={17} aria-hidden="true" /> Account session
              active
            </div>
          </section>
          <section className="rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-surface)] p-6 sm:p-8">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="ff-eyebrow mb-2">WORKSPACE STATUS</p>
                <h2 className="text-xl font-semibold tracking-tight">
                  Nothing to manage yet
                </h2>
              </div>
              <span className="rounded-full border border-[var(--ff-border)] bg-[var(--ff-bg)] px-3 py-1 text-[11px] font-semibold text-[var(--ff-muted)]">
                Not set up
              </span>
            </div>
            <div className="mt-8 rounded-xl border border-dashed border-[var(--ff-control-border)] bg-[var(--ff-bg)] p-6 text-center">
              <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--ff-surface)] text-[var(--ff-primary)]">
                <Layers3 size={23} aria-hidden="true" />
              </span>
              <p className="mt-4 text-sm font-semibold">
                Your workspace will appear here.
              </p>
              <p className="mx-auto mt-2 max-w-[29ch] text-xs leading-6 text-[var(--ff-muted)]">
                No demo projects, invented statistics, or placeholder team
                members.
              </p>
            </div>
            <p className="mt-5 text-xs leading-6 text-[var(--ff-muted)]">
              Creating and switching real workspaces arrives in Milestone 5.
            </p>
          </section>
        </div>
        <section aria-labelledby="whats-next" className="space-y-5">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div>
              <p className="ff-eyebrow mb-2">COMING TO FORGEFLOW</p>
              <h2
                id="whats-next"
                className="text-xl font-semibold tracking-tight sm:text-2xl"
              >
                The path ahead
              </h2>
            </div>
            <span className="text-xs text-[var(--ff-muted)]">
              Planned features, not live data
            </span>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {nextSteps.map(({ number, title, detail, icon: Icon }) => (
              <article
                key={number}
                className="rounded-xl border border-[var(--ff-border)] bg-[var(--ff-surface)] p-5 sm:p-6"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[var(--ff-muted)]">
                    {number} / 03
                  </span>
                  <Icon
                    size={20}
                    className="text-[var(--ff-primary)]"
                    aria-hidden="true"
                  />
                </div>
                <h3 className="mt-8 text-base font-semibold">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-[var(--ff-muted)]">
                  {detail}
                </p>
              </article>
            ))}
          </div>
          <p className="flex items-center gap-2 text-xs text-[var(--ff-muted)]">
            <ArrowRight size={14} aria-hidden="true" /> Next milestone:
            Workspace MVP and tenant authorization
          </p>
        </section>
      </div>
    </WorkspaceShell>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardContent />
    </Suspense>
  );
}
