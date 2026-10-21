'use client';
import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Trash2, Pencil } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import QueryProvider from '@/providers/query-provider';
import { WorkspaceShell } from '@/components/layout/workspace-shell';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { InlineAlert } from '@/components/ui/inline-alert';
import { Skeleton } from '@/components/ui/skeleton';
import { IssueForm } from './issue-form';
import { display, domainRequest, issuePath, mutationOptions } from './issue-data';

function Detail({ user, signOutAction, workspaceId, projectId, issueId }) {
  const router = useRouter();
  const client = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [notice, setNotice] = useState('');
  const base = issuePath(workspaceId, projectId);
  const url = `${base}/${issueId}`;
  const spaces = useQuery({ queryKey: ['workspaces', user.id, 'm6-shell'], queryFn: () => domainRequest('?page=1&limit=100') });
  const workspace = useQuery({ queryKey: ['workspaces', user.id, workspaceId], queryFn: () => domainRequest(`/${workspaceId}`), retry: false });
  const project = useQuery({ queryKey: ['m6-project', workspaceId, projectId], queryFn: () => domainRequest(`/${workspaceId}/projects/${projectId}`), enabled: workspace.isSuccess, retry: false });
  const issue = useQuery({ queryKey: ['m7-issue', workspaceId, projectId, issueId], queryFn: () => domainRequest(url), enabled: project.isSuccess, retry: false });
  const members = useQuery({ queryKey: ['m6-members', workspaceId], queryFn: () => domainRequest(`/${workspaceId}/members`), enabled: workspace.isSuccess, retry: false });
  const canEdit = project.data?.project?.status === 'ACTIVE';
  const canDelete = canEdit && ['OWNER', 'ADMIN'].includes(workspace.data?.workspace?.role);
  const update = useMutation({ mutationFn: (values) => domainRequest(url, mutationOptions('PATCH', { ...values, expectedVersion: issue.data.issue.version })),
    onSuccess: async ({ issue: saved }) => { client.setQueryData(['m7-issue', workspaceId, projectId, issueId], { issue: saved });
      await client.invalidateQueries({ queryKey: ['m7-issues', workspaceId, projectId] }); setEditing(false); setNotice('Issue updated.'); },
  });
  const remove = useMutation({ mutationFn: () => domainRequest(url, mutationOptions('DELETE', { expectedVersion: issue.data.issue.version })),
    onSuccess: async () => { await client.invalidateQueries({ queryKey: ['m7-issues', workspaceId, projectId] }); router.push(`/w/${workspaceId}/projects/${projectId}/issues`); },
  });
  async function reload() { update.reset(); remove.reset(); setEditing(false); setDeleting(false); await Promise.all([issue.refetch(), project.refetch(), members.refetch()]); }
  const stale = update.error?.status === 409 || remove.error?.status === 409;
  return <WorkspaceShell user={user} signOutAction={signOutAction} selectedWorkspace={workspace.data?.workspace} workspaces={spaces.data?.workspaces || []}>
    <main className="mx-auto w-full max-w-4xl space-y-6 px-4 py-8 sm:px-7 lg:py-12">
      <Link className="ff-text-link inline-flex min-h-10 items-center gap-2 text-[13px] font-semibold" href={`/w/${workspaceId}/projects/${projectId}/issues`}><ArrowLeft size={15}/> Back to issues</Link>
      {workspace.isError || project.isError || issue.isError ? <InlineAlert tone="error">Issue unavailable or you no longer have access.</InlineAlert> : null}
      {!workspace.isError && !project.isError && (issue.isPending || project.isPending) ? <Skeleton className="h-52 w-full"/> : null}
      {issue.data && project.data && <>
        <PageHeader eyebrow="Issue detail" title={issue.data.issue.title} description={`${display(issue.data.issue.status)} · ${display(issue.data.issue.priority)} priority · Version ${issue.data.issue.version}`}
          action={canEdit && !editing ? <Button variant="secondary" onClick={() => { update.reset(); setEditing(true); setNotice(''); }}><Pencil size={15}/> Edit issue</Button> : null}/>
        {notice && <InlineAlert tone="success">{notice}</InlineAlert>}
        {!canEdit && <InlineAlert tone="info">Archived projects are read-only.</InlineAlert>}
        {stale && <InlineAlert tone="warn">The issue has changed since you opened it. <Button type="button" variant="secondary" size="sm" onClick={reload}>Reload latest issue</Button></InlineAlert>}
        {editing && canEdit ? <section className="ff-panel rounded-[var(--ff-radius-xl)] border border-[var(--ff-border)] bg-[var(--ff-surface)] p-6">
          <h2 className="mb-4 text-[17px] font-semibold">Edit issue</h2>
          <IssueForm key={`${issue.data.issue.id}:${issue.data.issue.version}`} issue={issue.data.issue} members={members.data?.members || []}
            busy={update.isPending} error={update.error} onSave={(values) => update.mutate(values)} onCancel={() => setEditing(false)}/>
        </section> : <section className="ff-panel rounded-[var(--ff-radius-xl)] border border-[var(--ff-border-faint)] bg-[var(--ff-surface)] p-6 sm:p-8">
          <div className="grid gap-4 sm:grid-cols-2">
            {[['Type', display(issue.data.issue.type)], ['Status', display(issue.data.issue.status)], ['Priority', display(issue.data.issue.priority)],
              ['Assigned to', issue.data.issue.assigneeId || 'Unassigned']].map(([label, value]) =>
              <div key={label}><p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--ff-muted)]">{label}</p><p className="mt-1 break-all text-[13px] font-semibold">{value}</p></div>)}
          </div><div className="mt-6 border-t border-[var(--ff-border-faint)] pt-6"><h2 className="text-[14px] font-semibold">Description</h2>
            <p className="mt-3 whitespace-pre-wrap break-words text-[14px] leading-7 text-[var(--ff-muted)]">{issue.data.issue.description || 'No description provided.'}</p></div>
        </section>}
        {canDelete && <section className="border-t border-[var(--ff-border-faint)] pt-6">
          {!deleting ? <Button type="button" variant="ghost" onClick={() => setDeleting(true)}><Trash2 size={15}/> Delete issue</Button> :
            <div role="group" aria-label="Confirm issue deletion" className="rounded-xl border border-[var(--ff-danger-border)] bg-[var(--ff-surface)] p-5">
              <p className="font-semibold">Delete this issue?</p><p className="mt-1 text-[13px] text-[var(--ff-muted)]">This action removes the issue from project lists.</p>
              {remove.error && <InlineAlert tone="error">{remove.error.message}</InlineAlert>}
              <div className="mt-4 flex flex-wrap gap-2"><Button variant="danger" disabled={remove.isPending || stale} onClick={() => remove.mutate()}>Confirm delete</Button>
                <Button variant="secondary" disabled={remove.isPending} onClick={() => setDeleting(false)}>Cancel</Button></div>
            </div>}
        </section>}
      </>}
    </main>
  </WorkspaceShell>;
}
export function IssueDetail(props) { return <QueryProvider><Detail {...props}/></QueryProvider>; }
