'use client';
import Link from 'next/link';
import { ListTodo, ArrowLeft, FolderKanban, ChevronRight } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import QueryProvider from '@/providers/query-provider';
import { WorkspaceShell } from '@/components/layout/workspace-shell';
import { PageHeader } from '@/components/ui/page-header';
import { InlineAlert } from '@/components/ui/inline-alert';
import { Skeleton } from '@/components/ui/skeleton';
import { domainRequest } from './issue-data';
function Picker({ user, signOutAction, workspaceId }) {
  const spaces = useQuery({ queryKey: ['workspaces', user.id, 'm6-shell'], queryFn: () => domainRequest('?page=1&limit=100') });
  const workspace = useQuery({ queryKey: ['workspaces', user.id, workspaceId], queryFn: () => domainRequest(`/${workspaceId}`), retry: false });
  const projects = useQuery({ queryKey: ['m7-project-picker', workspaceId], queryFn: () => domainRequest(`/${workspaceId}/projects?status=ACTIVE&page=1&limit=100`), enabled: workspace.isSuccess, retry: false });
  return <WorkspaceShell user={user} signOutAction={signOutAction} selectedWorkspace={workspace.data?.workspace} workspaces={spaces.data?.workspaces || []}>
    <main className="mx-auto w-full max-w-[var(--ff-container)] space-y-7 px-4 py-8 sm:px-7 lg:px-10 lg:py-12">
      <Link href={`/w/${workspaceId}`} className="ff-text-link inline-flex min-h-10 items-center gap-2 text-[13px] font-semibold"><ArrowLeft size={15}/> Workspace overview</Link>
      <PageHeader eyebrow="Delivery" title="Issues" description="Choose an active project to view and manage its issues. Each project keeps its own issue list."/>
      {workspace.isError || projects.isError ? <InlineAlert tone="error">Could not load workspace projects.</InlineAlert> : null}
      {!workspace.isError && projects.isPending ? <Skeleton className="h-28 w-full"/> : projects.data?.projects?.length ? <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {projects.data.projects.map(p => <Link key={p.id} href={`/w/${workspaceId}/projects/${p.id}/issues`} className="ff-card group rounded-[var(--ff-radius-panel)] border border-[var(--ff-border-faint)] bg-[var(--ff-surface)] p-6 shadow-[var(--ff-shadow-xs)] hover:border-[var(--ff-primary)]">
          <div className="flex items-center justify-between"><span className="rounded-lg bg-[var(--ff-primary-soft)] p-2 text-[var(--ff-primary)]"><FolderKanban size={18}/></span><ChevronRight size={17} className="text-[var(--ff-muted)] group-hover:text-[var(--ff-primary)]"/></div>
          <h2 className="mt-4 break-words font-semibold">{p.name}</h2><p className="mt-2 line-clamp-2 text-[13px] text-[var(--ff-muted)]">{p.description || 'Open issue tracking for this project.'}</p>
        </Link>)}
        {projects.data.pagination?.total > projects.data.projects.length && <p className="text-[12px] text-[var(--ff-muted)] md:col-span-2">Showing the first 100 active projects. Use Projects to open other project issues.</p>}
      </div> : projects.isSuccess ? <div className="rounded-xl border border-dashed border-[var(--ff-border)] bg-[var(--ff-surface)] p-10 text-center"><ListTodo size={26} className="mx-auto text-[var(--ff-primary)]"/><p className="mt-3 text-[14px] font-semibold">No active projects yet</p><Link className="ff-text-link mt-3 inline-block text-[13px]" href={`/w/${workspaceId}/projects`}>Browse projects</Link></div> : null}
    </main>
  </WorkspaceShell>;
}
export function WorkspaceIssues(props) { return <QueryProvider><Picker {...props}/></QueryProvider>; }
