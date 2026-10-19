'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  ArrowRight,
  ArrowUpRight,
  Building2,
  CircleX,
  Layers3,
  LoaderCircle,
  Plus,
  Search,
  ShieldCheck,
  Sparkles,
  Users,
} from 'lucide-react';
import QueryProvider from '@/providers/query-provider';
import { WorkspaceShell } from '@/components/layout/workspace-shell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Field } from '@/components/ui/field';
import { InlineAlert } from '@/components/ui/inline-alert';
import { PageHeader } from '@/components/ui/page-header';
import { Skeleton } from '@/components/ui/skeleton';
import { workspaceSchema } from '../workspace-schema.js';

async function api(path, options) {
  const response = await fetch(`/api/backend/workspaces${path}`, { cache: 'no-store', ...options });
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    const error = new Error(data?.error?.message || 'Could not load workspace data.');
    error.status = response.status;
    throw error;
  }
  return data;
}

function WorkspaceLoading() {
  return (
    <div
      role="status"
      aria-label="Loading workspaces"
      className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
    >
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="ff-card rounded-[var(--ff-radius-panel)] border border-[var(--ff-border-faint)] bg-[var(--ff-surface)] p-6 shadow-[var(--ff-shadow-xs)]"
        >
          <div className="flex items-start gap-3">
            <Skeleton className="h-11 w-11 rounded-[10px]" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
          <div className="mt-5 space-y-2">
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-2/3" />
          </div>
        </div>
      ))}
      <span className="sr-only">Loading workspace information…</span>
    </div>
  );
}

function RoleChip({ role }) {
  const tones = {
    OWNER: "bg-[var(--ff-primary-soft)] text-[var(--ff-primary)]",
    ADMIN: "bg-[#FEF3C7] text-[#92400E]",
    MEMBER: "bg-[var(--ff-surface-2)] text-[var(--ff-muted)]",
  };
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10.5px] font-bold tracking-wider uppercase ${tones[role] ?? tones.MEMBER}`}
    >
      {role}
    </span>
  );
}

function WorkspaceCard({ space }) {
  return (
    <Link
      href={`/w/${space.id}`}
      className="ff-card ff-card-hover group relative block overflow-hidden rounded-[var(--ff-radius-panel)] border border-[var(--ff-border-faint)] bg-[var(--ff-surface)] p-6 shadow-[var(--ff-shadow-xs)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ff-focus)]"
    >
      {/* Decorative corner gradient */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -top-12 -right-12 h-32 w-32 rounded-full bg-[var(--ff-gradient-soft)] opacity-0 transition-opacity duration-300 group-hover:opacity-100"
      />
      <div className="relative flex items-start gap-3.5">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[10px] bg-gradient-to-br from-[#2563EB] to-[#06B6D4] text-[14px] font-bold text-white shadow-[0_8px_20px_-8px_rgba(37,99,235,0.6)]">
          {space.name.trim().slice(0, 1).toUpperCase()}
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-[15.5px] font-semibold tracking-[-0.015em] text-[var(--ff-text-strong)]">
            {space.name}
          </h3>
          <p className="mt-1 flex items-center gap-1.5 text-[12px] text-[var(--ff-muted)]">
            <Users size={11} aria-hidden="true" /> Team workspace
          </p>
        </div>
        <RoleChip role={space.role} />
      </div>
      <div className="relative mt-5 flex items-center justify-between border-t border-[var(--ff-border-faint)] pt-4">
        <span className="text-[11.5px] text-[var(--ff-muted-soft)]">Open workspace</span>
        <ArrowRight
          size={15}
          aria-hidden="true"
          className="text-[var(--ff-muted-soft)] transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-[var(--ff-primary)] motion-reduce:transition-none"
        />
      </div>
    </Link>
  );
}

function WorkspaceForm({ selectedWorkspace = null, onSaved, onCancel }) {
  const queryClient = useQueryClient();
  const form = useForm({
    resolver: zodResolver(workspaceSchema),
    defaultValues: { name: selectedWorkspace?.name ?? '' },
  });
  const mutation = useMutation({
    mutationFn: ({ name }) =>
      api(selectedWorkspace ? `/${selectedWorkspace.id}` : '', {
        method: selectedWorkspace ? 'PATCH' : 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name }),
      }),
    onSuccess: async (data) => {
      await queryClient.invalidateQueries({ queryKey: ['workspaces'] });
      form.reset({ name: selectedWorkspace ? data.workspace.name : '' });
      onSaved?.(data.workspace);
    },
  });
  return (
    <form
      className="space-y-4"
      onSubmit={form.handleSubmit((data) => mutation.mutate(data))}
      noValidate
      aria-busy={mutation.isPending}
    >
      <Field
        id={selectedWorkspace ? 'rename-workspace' : 'new-workspace'}
        label={selectedWorkspace ? 'Workspace name' : 'Name your workspace'}
        error={form.formState.errors.name}
        hint={!selectedWorkspace ? 'You can change this later from workspace settings.' : undefined}
      >
        <Input
          id={selectedWorkspace ? 'rename-workspace' : 'new-workspace'}
          placeholder="e.g. Studio North"
          autoComplete="off"
          aria-invalid={Boolean(form.formState.errors.name)}
          {...form.register('name')}
        />
      </Field>
      {mutation.error && <InlineAlert tone="error">{mutation.error.message}</InlineAlert>}
      {mutation.isSuccess && selectedWorkspace && <InlineAlert tone="success">Workspace name saved.</InlineAlert>}
      <div className="flex items-center gap-2">
        <Button type="submit" disabled={mutation.isPending} size="md">
          {mutation.isPending ? (
            <LoaderCircle size={15} className="animate-spin motion-reduce:animate-none" aria-hidden="true" />
          ) : selectedWorkspace ? (
            <ShieldCheck size={15} aria-hidden="true" />
          ) : (
            <Plus size={15} aria-hidden="true" />
          )}
          {selectedWorkspace ? 'Save changes' : 'Create workspace'}
        </Button>
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}

function WorkspaceHomeContent({ user, signOutAction, workspaceId }) {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [showCreate, setShowCreate] = useState(false);
  const [query, setQuery] = useState('');
  const workspaces = useQuery({
    queryKey: ['workspaces', user.id, page],
    queryFn: () => api(`?page=${page}&limit=20`),
  });
  const selected = useQuery({
    queryKey: ['workspaces', user.id, workspaceId],
    queryFn: () => api(`/${workspaceId}`),
    enabled: Boolean(workspaceId),
    retry: false,
  });
  const members = useQuery({
    queryKey: ['workspace-members', user.id, workspaceId],
    queryFn: () => api(`/${workspaceId}/members`),
    enabled: Boolean(workspaceId) && selected.isSuccess,
    retry: false,
  });
  const selectedWorkspace = selected.data?.workspace;
  const items = (workspaces.data?.workspaces ?? []).filter((s) =>
    !query ? true : s.name.toLowerCase().includes(query.toLowerCase()),
  );
  const givenName = user.name?.split(/\s+/)[0] || 'there';

  return (
    <WorkspaceShell
      user={user}
      signOutAction={signOutAction}
      workspaces={workspaces.data?.workspaces ?? []}
      selectedWorkspace={selectedWorkspace}
    >
      <div className="mx-auto w-full max-w-[var(--ff-container)] px-4 py-8 sm:px-7 sm:py-10 lg:px-10 lg:py-12">
        {!workspaceId ? (
          <div className="space-y-8">
            {/* Hero strip */}
            <div
              className="ff-panel relative overflow-hidden rounded-[var(--ff-radius-xl)] border border-[#1A2647] p-7 text-white shadow-[var(--ff-shadow-md)] sm:p-9"
              style={{
                background:
                  "linear-gradient(135deg, #0F1830 0%, #0E1730 50%, #0B1328 100%)",
                color: "#FFFFFF",
              }}
            >
              <span
                aria-hidden="true"
                className="pointer-events-none absolute -top-20 -right-20 h-64 w-64 rounded-full"
                style={{ background: "radial-gradient(circle, rgba(34,211,238,0.30) 0%, transparent 60%)" }}
              />
              <span
                aria-hidden="true"
                className="pointer-events-none absolute -bottom-32 -left-16 h-72 w-72 rounded-full"
                style={{ background: "radial-gradient(circle, rgba(37,99,235,0.25) 0%, transparent 65%)" }}
              />
              <div className="relative grid gap-6 lg:grid-cols-[1.4fr_1fr] lg:items-center">
                <div style={{ color: "#FFFFFF" }}>
                  <div
                    className="mb-3 inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-[10.5px] font-semibold tracking-[0.14em] uppercase"
                    style={{ borderColor: "rgba(255,255,255,0.10)", background: "rgba(255,255,255,0.04)", color: "#A5F3FC" }}
                  >
                    <Sparkles size={11} aria-hidden="true" /> Today
                  </div>
                  <h2
                    className="text-[clamp(1.75rem,3vw,2.4rem)] font-semibold leading-[1.05] tracking-[-0.035em]"
                    style={{ color: "#FFFFFF" }}
                  >
                    Welcome back,{" "}
                    <span
                      style={{
                        backgroundImage: "linear-gradient(90deg, #60A5FA 0%, #22D3EE 100%)",
                        WebkitBackgroundClip: "text",
                        backgroundClip: "text",
                        color: "transparent",
                      }}
                    >
                      {givenName}.
                    </span>
                  </h2>
                  <p
                    className="mt-3 max-w-md text-[14px] leading-[1.6]"
                    style={{ color: "rgba(255,255,255,0.78)" }}
                  >
                    Your workspaces are private. Open one to continue where you left off,
                    or spin up a new space for a different team.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                  <Button
                    variant={showCreate ? 'secondary' : 'primary'}
                    onClick={() => setShowCreate((value) => !value)}
                    size="md"
                  >
                    <Plus size={15} aria-hidden="true" />
                    {showCreate ? 'Close' : 'New workspace'}
                  </Button>
                  <a
                    href="#"
                    className="hidden h-11 items-center gap-2 rounded-[10px] border px-4 text-[13px] font-semibold transition-colors sm:inline-flex"
                    style={{
                      borderColor: "rgba(255,255,255,0.16)",
                      background: "rgba(255,255,255,0.06)",
                      color: "#E7EEFB",
                    }}
                    onClick={(e) => e.preventDefault()}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "rgba(255,255,255,0.12)";
                      e.currentTarget.style.color = "#FFFFFF";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "rgba(255,255,255,0.06)";
                      e.currentTarget.style.color = "#E7EEFB";
                    }}
                  >
                    Read the docs
                    <ArrowUpRight size={14} aria-hidden="true" />
                  </a>
                </div>
              </div>
            </div>

            {/* Create form panel */}
            {showCreate && (
              <div className="ff-panel rounded-[var(--ff-radius-xl)] border border-[var(--ff-border-faint)] bg-[var(--ff-surface)] p-6 shadow-[var(--ff-shadow-sm)] sm:p-8">
                <div className="mb-5 flex items-start justify-between gap-3">
                  <div>
                    <p className="ff-eyebrow mb-2">Create</p>
                    <h3 className="text-[18px] font-semibold tracking-[-0.02em] text-[var(--ff-text-strong)]">
                      Spin up a new workspace
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowCreate(false)}
                    aria-label="Close"
                    className="inline-flex h-8 w-8 items-center justify-center rounded-[8px] text-[var(--ff-muted)] transition-colors hover:bg-[var(--ff-surface-2)] hover:text-[var(--ff-text)]"
                  >
                    <CircleX size={16} aria-hidden="true" />
                  </button>
                </div>
                <WorkspaceForm
                  onSaved={(space) => router.push(`/w/${space.id}`)}
                  onCancel={() => setShowCreate(false)}
                />
              </div>
            )}

            {/* Workspace list */}
            {workspaces.isPending ? (
              <WorkspaceLoading />
            ) : workspaces.isError ? (
              <div
                role="alert"
                className="ff-panel rounded-[var(--ff-radius-xl)] border border-[var(--ff-danger-border)] bg-[var(--ff-danger-bg)] p-6"
              >
                <p className="text-[14.5px] font-semibold text-[var(--ff-danger-text)]">Workspaces are unavailable.</p>
                <p className="mt-1.5 text-[13.5px] leading-[1.6] text-[var(--ff-danger-text)]/80">{workspaces.error.message}</p>
                <Button variant="secondary" size="sm" className="mt-4" onClick={() => workspaces.refetch()}>
                  Try again
                </Button>
              </div>
            ) : items.length === 0 && !showCreate ? (
              <div className="ff-panel relative overflow-hidden rounded-[var(--ff-radius-xl)] border border-dashed border-[var(--ff-border)] bg-[var(--ff-surface)] px-6 py-16 text-center">
                <div className="relative mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-[16px] bg-[var(--ff-primary-soft)] text-[var(--ff-primary)]">
                  <Layers3 size={28} aria-hidden="true" />
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 rounded-[16px]"
                    style={{ boxShadow: "0 0 0 1px rgba(37,99,235,0.10), 0 0 24px -6px rgba(6,182,212,0.40)" }}
                  />
                </div>
                <h3 className="text-[20px] font-semibold tracking-[-0.025em] text-[var(--ff-text-strong)]">
                  {workspaces.data?.workspaces?.length === 0
                    ? 'Create your first workspace'
                    : 'No matches'}
                </h3>
                <p className="mx-auto mt-3 max-w-md text-[14px] leading-[1.6] text-[var(--ff-muted)]">
                  {workspaces.data?.workspaces?.length === 0
                    ? 'A workspace is a private home for your team’s projects. Only members can access it.'
                    : `Nothing matches “${query}”. Try a different search.`}
                </p>
                {workspaces.data?.workspaces?.length === 0 ? (
                  <Button className="mt-6" onClick={() => setShowCreate(true)}>
                    <Plus size={15} aria-hidden="true" /> Create workspace
                  </Button>
                ) : (
                  <Button className="mt-6" variant="secondary" onClick={() => setQuery('')}>
                    Clear search
                  </Button>
                )}
              </div>
            ) : (
              <>
                {/* Search bar */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h3 className="text-[13px] font-semibold tracking-[0.04em] text-[var(--ff-muted)] uppercase">
                    Your workspaces · {items.length}
                  </h3>
                  <label className="relative flex h-10 min-w-[220px] items-center gap-2 rounded-[10px] border border-[var(--ff-border-faint)] bg-[var(--ff-surface)] px-3 text-[13px] text-[var(--ff-muted)] shadow-[var(--ff-shadow-xs)] focus-within:border-[var(--ff-border-strong)] focus-within:shadow-[var(--ff-glow-focus)]">
                    <Search size={14} aria-hidden="true" className="text-[var(--ff-muted-soft)]" />
                    <input
                      type="search"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Filter workspaces…"
                      className="w-full bg-transparent text-[13.5px] text-[var(--ff-text)] placeholder:text-[var(--ff-muted-soft)] outline-none"
                    />
                  </label>
                </div>
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {items.map((space) => (
                    <WorkspaceCard key={space.id} space={space} />
                  ))}
                </div>
                {workspaces.data?.pagination?.total > 20 && (
                  <div className="flex items-center justify-between border-t border-[var(--ff-border-faint)] pt-5 text-[13px] text-[var(--ff-muted)]">
                    <Button
                      variant="secondary"
                      size="sm"
                      disabled={page === 1 || workspaces.isFetching}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                    >
                      Previous
                    </Button>
                    <span>Page {page} of {Math.ceil(workspaces.data.pagination.total / 20)}</span>
                    <Button
                      variant="secondary"
                      size="sm"
                      disabled={page * 20 >= workspaces.data.pagination.total || workspaces.isFetching}
                      onClick={() => setPage((p) => p + 1)}
                    >
                      Next
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        ) : (
          // ===== Workspace detail view =====
          <div className="space-y-7">
            <PageHeader
              eyebrow="Workspace"
              meta={
                selectedWorkspace && <RoleChip role={selectedWorkspace.role} />
              }
              title={selectedWorkspace?.name || 'Workspace'}
              description="Manage this workspace’s identity. Projects, issues, and member invites are coming next."
            />

            {selected.isPending ? (
              <WorkspaceLoading />
            ) : selected.isError ? (
              <div
                role="alert"
                className="ff-panel rounded-[var(--ff-radius-xl)] border border-[var(--ff-danger-border)] bg-[var(--ff-danger-bg)] p-6"
              >
                <h3 className="text-[16px] font-semibold text-[var(--ff-danger-text)]">Workspace not available</h3>
                <p className="mt-1.5 text-[13.5px] text-[var(--ff-danger-text)]/80">{selected.error.message}</p>
                <Link href="/dashboard" className="ff-text-link mt-4 inline-block py-2 text-[13px] font-semibold">
                  Back to workspaces
                </Link>
              </div>
            ) : selectedWorkspace ? (
              <div className="grid gap-5 lg:grid-cols-[minmax(0,1.3fr)_minmax(320px,1fr)]">
                {/* Identity card */}
                <section className="ff-panel rounded-[var(--ff-radius-xl)] border border-[var(--ff-border-faint)] bg-[var(--ff-surface)] p-7 shadow-[var(--ff-shadow-xs)] sm:p-8">
                  <p className="ff-eyebrow mb-3">Identity</p>
                  <h2 className="text-[24px] font-semibold leading-[1.15] tracking-[-0.025em] text-[var(--ff-text-strong)]">
                    {selectedWorkspace.name}
                  </h2>
                  <p className="mt-3 text-[14px] leading-[1.6] text-[var(--ff-muted)]">
                    Your access level is <strong className="font-semibold text-[var(--ff-text-strong)]">{selectedWorkspace.role}</strong>.
                    Projects, issues, and member management will be added in upcoming milestones.
                  </p>
                  <div className="mt-6 grid grid-cols-2 gap-3">
                    <div className="rounded-[12px] border border-[var(--ff-border-faint)] bg-[var(--ff-surface-2)] p-4">
                      <p className="text-[10.5px] font-bold tracking-[0.14em] text-[var(--ff-muted-soft)] uppercase">Members</p>
                      <p className="mt-2 text-[20px] font-semibold tracking-[-0.02em] text-[var(--ff-text-strong)]">
                        {members.isPending
                          ? '…'
                          : members.isError
                            ? '0'
                            : members.data.members.length}
                      </p>
                    </div>
                    <div className="rounded-[12px] border border-[var(--ff-border-faint)] bg-[var(--ff-surface-2)] p-4">
                      <p className="text-[10.5px] font-bold tracking-[0.14em] text-[var(--ff-muted-soft)] uppercase">Your access</p>
                      <p className="mt-2 text-[14px] font-semibold tracking-[-0.01em] text-[var(--ff-text-strong)]">
                        {selectedWorkspace.role}
                      </p>
                    </div>
                  </div>
                  <div className="mt-7 flex flex-wrap gap-2">
                    <Link href="/dashboard">
                      <Button variant="secondary" size="md">
                        <ArrowRight size={14} className="rotate-180" aria-hidden="true" />
                        Switch workspace
                      </Button>
                    </Link>
                  </div>
                </section>

                {/* Settings card */}
                <section className="ff-panel rounded-[var(--ff-radius-xl)] border border-[var(--ff-border-faint)] bg-[var(--ff-surface)] p-7 shadow-[var(--ff-shadow-xs)] sm:p-8">
                  <p className="ff-eyebrow mb-3">Settings</p>
                  {['OWNER', 'ADMIN'].includes(selectedWorkspace.role) ? (
                    <WorkspaceForm key={selectedWorkspace.id} selectedWorkspace={selectedWorkspace} />
                  ) : (
                    <div className="rounded-[10px] border border-dashed border-[var(--ff-border)] bg-[var(--ff-surface-2)] p-5 text-center">
                      <p className="text-[13px] leading-[1.6] text-[var(--ff-muted)]">
                        Only <strong className="text-[var(--ff-text)]">Owner</strong> and <strong className="text-[var(--ff-text)]">Admin</strong> can change this workspace’s settings.
                      </p>
                    </div>
                  )}
                </section>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </WorkspaceShell>
  );
}

export function WorkspaceHome(props) {
  return (
    <QueryProvider>
      <WorkspaceHomeContent {...props} />
    </QueryProvider>
  );
}
