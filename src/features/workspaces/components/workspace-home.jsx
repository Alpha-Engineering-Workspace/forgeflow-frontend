'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowRight, Building2, Layers3, LoaderCircle, Plus, ShieldCheck } from 'lucide-react';
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
  return <div role="status" aria-label="Loading workspaces" className="space-y-4 rounded-2xl border border-[var(--ff-border)] bg-white p-6">
    <Skeleton className="h-5 w-32" />
    <Skeleton className="h-16 w-full" />
    <Skeleton className="h-16 w-full" />
    <span className="sr-only">Loading workspace information…</span>
  </div>;
}

function WorkspaceForm({ selectedWorkspace = null, onSaved }) {
  const queryClient = useQueryClient();
  const form = useForm({ resolver: zodResolver(workspaceSchema), defaultValues: { name: selectedWorkspace?.name ?? '' } });
  const mutation = useMutation({
    mutationFn: ({ name }) => api(selectedWorkspace ? `/${selectedWorkspace.id}` : '', {
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
    <form className="space-y-4" onSubmit={form.handleSubmit((data) => mutation.mutate(data))} noValidate aria-busy={mutation.isPending}>
      <Field id={selectedWorkspace ? 'rename-workspace' : 'new-workspace'} label="Workspace name" error={form.formState.errors.name}>
        <Input id={selectedWorkspace ? 'rename-workspace' : 'new-workspace'} placeholder="e.g. Studio North" autoComplete="off"
          aria-invalid={Boolean(form.formState.errors.name)} {...form.register('name')} />
      </Field>
      {mutation.error && <InlineAlert tone="error">{mutation.error.message}</InlineAlert>}
      {mutation.isSuccess && selectedWorkspace && <InlineAlert tone="success">Workspace name saved.</InlineAlert>}
      <Button type="submit" disabled={mutation.isPending}>
        {mutation.isPending ? <LoaderCircle className="animate-spin motion-reduce:animate-none" size={16} /> : selectedWorkspace ? <ShieldCheck size={16} /> : <Plus size={16} />}
        {selectedWorkspace ? 'Save name' : 'Create workspace'}
      </Button>
    </form>
  );
}

function WorkspaceList({ workspaces, onNavigate, page, setPage, total, busy }) {
  return (
    <section aria-label="Your workspaces" className="rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-surface)] p-5 sm:p-7">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-semibold">Your workspaces</h2>
        <span className="text-xs text-[var(--ff-muted)]">{total} total</span>
      </div>
      <div className="space-y-2">
        {workspaces.map((space) => (
          <Link key={space.id} href={`/w/${space.id}`} onClick={onNavigate}
            className="group flex min-h-16 items-center gap-3 rounded-xl border border-[var(--ff-border)] px-4 py-3 transition-colors hover:border-blue-300 hover:bg-[var(--ff-bg)]">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700"><Building2 size={20} /></span>
            <span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold">{space.name}</span><span className="mt-0.5 block text-xs text-[var(--ff-muted)]">{space.role.toLowerCase()} access</span></span>
            <ArrowRight size={17} className="text-[var(--ff-muted)]" />
          </Link>
        ))}
      </div>
      {total > 20 && <div className="mt-5 flex items-center justify-between gap-3 text-sm">
        <Button variant="secondary" disabled={page === 1 || busy} onClick={() => setPage((p) => Math.max(1, p - 1))}>Previous</Button>
        <span>Page {page}</span>
        <Button variant="secondary" disabled={page * 20 >= total || busy} onClick={() => setPage((p) => p + 1)}>Next</Button>
      </div>}
    </section>
  );
}

function WorkspaceHomeContent({ user, signOutAction, workspaceId }) {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [showCreate, setShowCreate] = useState(false);
  const workspaces = useQuery({ queryKey: ['workspaces', user.id, page], queryFn: () => api(`?page=${page}&limit=20`) });
  const selected = useQuery({ queryKey: ['workspaces', user.id, workspaceId], queryFn: () => api(`/${workspaceId}`), enabled: Boolean(workspaceId), retry: false });
  const members = useQuery({ queryKey: ['workspace-members', user.id, workspaceId], queryFn: () => api(`/${workspaceId}/members`), enabled: Boolean(workspaceId) && selected.isSuccess, retry: false });
  const selectedWorkspace = selected.data?.workspace;
  const items = workspaces.data?.workspaces ?? [];
  const givenName = user.name?.split(/\s+/)[0] || 'there';
  return (
    <WorkspaceShell user={user} signOutAction={signOutAction} workspaces={items} selectedWorkspace={selectedWorkspace}>
      <div className="mx-auto max-w-[1180px] space-y-7 px-4 py-7 sm:px-7 sm:py-10 lg:px-10">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <PageHeader eyebrow="WORKSPACE" title={workspaceId ? selectedWorkspace?.name || 'Workspace' : `Welcome, ${givenName}.`}
            description="Manage real workspace memberships and keep each team separate." />
          {!workspaceId && <Button onClick={() => setShowCreate((value) => !value)}><Plus size={17} /> New workspace</Button>}
        </div>
        {workspaces.isPending ? <WorkspaceLoading /> : workspaces.isError ? (
          <section role="alert" className="rounded-xl border border-[var(--ff-border)] bg-white p-7">
            <p className="font-semibold">Workspaces are unavailable.</p><p className="mt-2 text-sm">{workspaces.error.message}</p>
            <Button variant="secondary" className="mt-4" onClick={() => workspaces.refetch()}>Try again</Button>
          </section>
        ) : !workspaceId && items.length === 0 && !showCreate ? (
          <section className="rounded-2xl border border-dashed border-[var(--ff-border)] bg-white px-6 py-12 text-center">
            <Layers3 className="mx-auto text-[var(--ff-primary)]" size={38} />
            <h2 className="mt-5 text-xl font-semibold">Create your first workspace</h2>
            <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-[var(--ff-muted)]">A workspace is a private home for your team’s projects. Only members can access it.</p>
            <Button className="mt-6" onClick={() => setShowCreate(true)}><Plus size={17} /> Create workspace</Button>
          </section>
        ) : null}
        {!workspaceId && showCreate && <section className="max-w-xl rounded-2xl border border-[var(--ff-border)] bg-white p-6 sm:p-8">
          <h2 className="mb-5 text-lg font-semibold">New workspace</h2>
          <WorkspaceForm onSaved={(space) => router.push(`/w/${space.id}`)} />
        </section>}
        {!workspaceId && items.length > 0 && <WorkspaceList workspaces={items} page={page} setPage={setPage}
          total={workspaces.data.pagination.total} busy={workspaces.isFetching} />}
        {workspaceId && selected.isPending && <WorkspaceLoading />}
        {workspaceId && selected.isError && <section className="rounded-xl border border-[var(--ff-border)] bg-white p-7" role="alert">
          <h2 className="text-lg font-semibold">Workspace not available</h2>
          <p className="mt-2 text-sm text-[var(--ff-muted)]">{selected.error.message}</p>
          <Link href="/dashboard" className="ff-text-link mt-4 inline-block py-2 font-semibold">Back to workspaces</Link>
        </section>}
        {workspaceId && selectedWorkspace && <div className="grid gap-5 lg:grid-cols-[minmax(0,1.4fr)_minmax(290px,1fr)]">
          <section className="rounded-2xl border border-[var(--ff-border)] bg-white p-6 sm:p-8">
            <p className="ff-eyebrow">CURRENT WORKSPACE</p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight">{selectedWorkspace.name}</h2>
            <p className="mt-3 text-sm leading-6 text-[var(--ff-muted)]">Your access: <strong>{selectedWorkspace.role}</strong>. Projects and issues will be added in the next milestones.</p>
            <p className="mt-5 text-sm">{members.isPending ? 'Checking membership…' : members.isError ? 'Membership list unavailable.' : `${members.data.members.length} workspace member(s)`}</p>
            <Link href="/dashboard" className="ff-text-link mt-7 inline-flex min-h-11 items-center py-3 text-sm font-semibold">Switch workspace <ArrowRight size={16} className="ml-2" /></Link>
          </section>
          <section className="rounded-2xl border border-[var(--ff-border)] bg-white p-6 sm:p-8">
            <p className="ff-eyebrow mb-3">WORKSPACE SETTINGS</p>
            {['OWNER', 'ADMIN'].includes(selectedWorkspace.role) ? <WorkspaceForm key={selectedWorkspace.id} selectedWorkspace={selectedWorkspace} /> :
              <p className="text-sm leading-6 text-[var(--ff-muted)]">Only Owner and Admin can change this workspace’s settings.</p>}
          </section>
        </div>}
      </div>
    </WorkspaceShell>
  );
}

export function WorkspaceHome(props) {
  return <QueryProvider><WorkspaceHomeContent {...props} /></QueryProvider>;
}
