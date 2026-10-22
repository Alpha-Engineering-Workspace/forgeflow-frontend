'use client';
import { useState } from 'react';
import Link from 'next/link';
import { ListTodo, Plus, Search, ArrowLeft, ChevronRight, LayoutGrid } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import QueryProvider from '@/providers/query-provider';
import { WorkspaceShell } from '@/components/layout/workspace-shell';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { InlineAlert } from '@/components/ui/inline-alert';
import { Skeleton } from '@/components/ui/skeleton';
import { SemanticBadge } from '@/components/ui/semantic-badge';
import { IssueForm } from './issue-form';
import { STATUSES, PRIORITIES, TYPES, display, domainRequest, issuePath, mutationOptions } from './issue-data';

const defaultFilters = { q: '', status: '', priority: '', type: '', assigneeId: '' };
const fieldClass = 'h-11 rounded-[10px] border border-[var(--ff-control-border)] bg-[var(--ff-surface)] px-3 text-[13px]';

function IssuesContent({ user, signOutAction, workspaceId, projectId }) {
  const [draft, setDraft] = useState(defaultFilters);
  const [filters, setFilters] = useState(defaultFilters);
  const [page, setPage] = useState(1);
  const [creating, setCreating] = useState(false);
  const [notice, setNotice] = useState('');
  const queryClient = useQueryClient();
  const base = issuePath(workspaceId, projectId);
  const spaces = useQuery({ queryKey: ['workspaces', user.id, 'm6-shell'], queryFn: () => domainRequest('?page=1&limit=100') });
  const workspace = useQuery({ queryKey: ['workspaces', user.id, workspaceId], queryFn: () => domainRequest(`/${workspaceId}`), retry: false });
  const project = useQuery({ queryKey: ['m6-project', workspaceId, projectId], queryFn: () => domainRequest(`/${workspaceId}/projects/${projectId}`), enabled: workspace.isSuccess, retry: false });
  const members = useQuery({ queryKey: ['m6-members', workspaceId], queryFn: () => domainRequest(`/${workspaceId}/members`), enabled: workspace.isSuccess, retry: false });
  const params = new URLSearchParams({ page: String(page), limit: '20' });
  for (const [key, value] of Object.entries(filters)) if (value) params.set(key, value);
  const issues = useQuery({ queryKey: ['m7-issues', workspaceId, projectId, filters, page], queryFn: () => domainRequest(`${base}?${params}`), enabled: project.isSuccess, retry: false });
  const active = project.data?.project?.status === 'ACTIVE';
  const create = useMutation({
    mutationFn: (values) => domainRequest(base, mutationOptions('POST', values)),
    onSuccess: async () => { setCreating(false); setNotice('Issue created.'); await queryClient.invalidateQueries({ queryKey: ['m7-issues', workspaceId, projectId] }); },
  });
  function changeFilter(key, value) { setDraft((current) => ({ ...current, [key]: value })); }
  function applyFilters(event) {
    event.preventDefault();
    const next = { ...draft, q: draft.q.trim() };
    if (next.q.length > 100) return;
    setFilters(next); setPage(1);
  }
  return <WorkspaceShell user={user} signOutAction={signOutAction} selectedWorkspace={workspace.data?.workspace} workspaces={spaces.data?.workspaces || []}>
    <main className="mx-auto w-full max-w-[var(--ff-container)] space-y-7 px-4 py-8 sm:px-7 lg:px-10 lg:py-12">
      <Link href={`/w/${workspaceId}/projects/${projectId}`} className="ff-text-link inline-flex min-h-10 items-center gap-2 text-[13px] font-semibold"><ArrowLeft size={15}/> Project detail</Link>
      <PageHeader eyebrow="Delivery · Issues" title={project.data?.project?.name ? `Issues · ${project.data.project.name}` : 'Project issues'}
        description="Track work, assign teammates, and keep updates safe with version checks."
        action={active ? <Button onClick={() => { create.reset(); setNotice(''); setCreating((value) => !value); }}><Plus size={16}/> New issue</Button> : null}/>
      <Link href={`/w/${workspaceId}/projects/${projectId}/board`} className="ff-text-link inline-flex min-h-11 items-center gap-2 text-[13px] font-semibold"><LayoutGrid size={16}/> Open Kanban board →</Link>
      {workspace.isError || project.isError ? <InlineAlert tone="error">Project unavailable or you do not have access.</InlineAlert> : null}
      {project.isPending ? <Skeleton className="h-24 w-full"/> : null}
      {project.data && !active ? <InlineAlert tone="info">This project is archived. Issues are read-only.</InlineAlert> : null}
      {notice && <InlineAlert tone="success">{notice}</InlineAlert>}
      {creating && active && <section className="ff-panel rounded-[var(--ff-radius-xl)] border border-[var(--ff-border)] bg-[var(--ff-surface)] p-5 sm:p-7">
        <h2 className="mb-5 text-[18px] font-semibold">Create issue</h2>
        {members.isError && <InlineAlert tone="warn">Members could not be loaded; choose Unassigned and try again later.</InlineAlert>}
        <IssueForm members={members.data?.members || []} busy={create.isPending} error={create.error}
          onSave={(value) => create.mutate(value)} onCancel={() => setCreating(false)}/>
      </section>}
      <form onSubmit={applyFilters} className="ff-panel grid gap-3 rounded-[var(--ff-radius-panel)] border border-[var(--ff-border-faint)] bg-[var(--ff-surface)] p-4 md:grid-cols-[minmax(190px,1fr)_repeat(3,minmax(100px,auto))_auto] md:items-end">
        <label className="space-y-1 text-[12px] font-semibold">Search title or description
          <Input value={draft.q} onChange={e => changeFilter('q', e.target.value)} maxLength={100} placeholder="Search issues…" aria-label="Search issues"/>
        </label>
        {[
          ['status', STATUSES], ['priority', PRIORITIES], ['type', TYPES],
        ].map(([key, options]) => <label key={key} className="space-y-1 text-[12px] font-semibold capitalize">{key}
          <select aria-label={`Filter by ${key}`} value={draft[key]} className={`${fieldClass} w-full`} onChange={e => changeFilter(key, e.target.value)}>
            <option value="">All</option>{options.map(value => <option key={value} value={value}>{display(value)}</option>)}
          </select>
        </label>)}
        <Button type="submit"><Search size={15}/>Apply</Button>
        <label className="md:col-span-full flex flex-col gap-1 text-[12px] font-semibold">Assigned to
          <select aria-label="Filter by assignee" value={draft.assigneeId} className={`${fieldClass} w-full max-w-sm`} onChange={e => changeFilter('assigneeId', e.target.value)}>
            <option value="">Any member</option>{(members.data?.members || []).map(m => <option key={m.userId} value={m.userId}>{m.userId}</option>)}
          </select>
        </label>
      </form>
      {project.isError || workspace.isError ? null : issues.isPending ? <div className="space-y-3" role="status" aria-label="Loading issues"><Skeleton className="h-24 w-full"/><Skeleton className="h-24 w-full"/></div> :
        issues.isError ? <InlineAlert tone="error">{issues.error.message} <Button variant="secondary" size="sm" onClick={() => issues.refetch()}>Retry</Button></InlineAlert> :
        !issues.data.issues.length ? <div className="rounded-[var(--ff-radius-xl)] border border-dashed border-[var(--ff-border)] bg-[var(--ff-surface)] px-6 py-12 text-center">
          <ListTodo size={28} className="mx-auto text-[var(--ff-primary)]"/><h2 className="mt-4 text-[18px] font-semibold">No issues found</h2>
          <p className="mt-2 text-[13px] text-[var(--ff-muted)]">Adjust your filters or create the first issue for this project.</p>
        </div> : <div className="space-y-3">
          <p className="text-[12px] text-[var(--ff-muted)]">{issues.data.pagination.total} matching issue(s)</p>
          {issues.data.issues.map(issue => <Link key={issue.id} href={`/w/${workspaceId}/projects/${projectId}/issues/${issue.id}`}
            className="ff-card group flex flex-col gap-3 rounded-[var(--ff-radius-panel)] border border-[var(--ff-border-faint)] bg-[var(--ff-surface)] p-5 shadow-[var(--ff-shadow-xs)] transition-colors hover:border-[var(--ff-primary)] sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0"><div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold text-[var(--ff-muted)]">
              <SemanticBadge kind="status" value={issue.status}/><SemanticBadge kind="type" value={issue.type}/><SemanticBadge kind="priority" value={issue.priority}/></div>
              <h2 className="mt-2 break-words text-[16px] font-semibold text-[var(--ff-text-strong)]">{issue.title}</h2>
              <p className="mt-1 line-clamp-2 text-[12px] text-[var(--ff-muted)]">{issue.description || 'No description'} · {issue.assigneeId ? `Assigned to ${issue.assigneeId.slice(0, 8)}…` : 'Unassigned'}</p>
            </div><ChevronRight size={18} className="shrink-0 text-[var(--ff-muted)] group-hover:text-[var(--ff-primary)]"/>
          </Link>)}
        </div>}
      {issues.data?.pagination?.total > 20 && <nav aria-label="Issue pages" className="flex items-center justify-between gap-4 text-[13px]">
        <Button variant="secondary" disabled={page === 1 || issues.isFetching} onClick={() => setPage(p => p - 1)}>Previous</Button>
        <span>Page {page} of {Math.ceil(issues.data.pagination.total / 20)}</span>
        <Button variant="secondary" disabled={page * 20 >= issues.data.pagination.total || issues.isFetching} onClick={() => setPage(p => p + 1)}>Next</Button>
      </nav>}
    </main>
  </WorkspaceShell>;
}
export function ProjectIssues(props) { return <QueryProvider><IssuesContent {...props}/></QueryProvider>; }
