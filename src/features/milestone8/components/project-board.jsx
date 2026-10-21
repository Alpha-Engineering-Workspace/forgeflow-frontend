'use client';
import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowDown, ArrowUp, GripVertical, LayoutGrid, RefreshCw, MoveRight } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import QueryProvider from '@/providers/query-provider';
import { WorkspaceShell } from '@/components/layout/workspace-shell';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { InlineAlert } from '@/components/ui/inline-alert';
import { Skeleton } from '@/components/ui/skeleton';
import { STATUSES, display, domainRequest, issuePath, mutationOptions } from '@/features/milestone7/components/issue-data';
import { boardLanes, destinationIndex, isUnchangedMove, previewBoard } from './board-order';

const tones = {
  TODO: { line: 'from-slate-400 to-slate-600', chip: 'bg-slate-500/10 text-slate-600 dark:text-slate-300' },
  IN_PROGRESS: { line: 'from-blue-600 to-cyan-400', chip: 'bg-cyan-500/10 text-cyan-700 dark:text-cyan-300' },
  IN_REVIEW: { line: 'from-violet-600 to-fuchsia-400', chip: 'bg-violet-500/10 text-violet-700 dark:text-violet-300' },
  DONE: { line: 'from-emerald-600 to-teal-400', chip: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300' },
};
const priorityStyle = { LOW: 'text-teal-700 dark:text-teal-300', MEDIUM: 'text-blue-700 dark:text-blue-300',
  HIGH: 'text-amber-700 dark:text-amber-300', URGENT: 'text-rose-700 dark:text-rose-300' };
const control = 'min-h-10 rounded-lg border border-[var(--ff-control-border)] bg-[var(--ff-surface)] px-2 text-[12px] text-[var(--ff-text)] focus-visible:outline-2 focus-visible:outline-[var(--ff-focus)]';

function KanbanCard({ issue, lane, index, length, projectId, workspaceId, active, busy, onMove, onDropBefore, onDragStart, onDragEnd, onDragOver }) {
  const [destination, setDestination] = useState(issue.status);
  const detailUrl = `/w/${workspaceId}/projects/${projectId}/issues/${issue.id}`;
  return <article
    data-testid={`kanban-card-${issue.id}`}
    draggable={active && !busy}
    onDragStart={(event) => { event.dataTransfer.effectAllowed = 'move'; event.dataTransfer.setData('text/plain', issue.id); onDragStart(issue.id); }}
    onDragEnd={onDragEnd}
    onDragOver={(event) => { if (active && !busy) { event.preventDefault(); event.dataTransfer.dropEffect = 'move'; onDragOver(issue.id); } }}
    onDrop={(event) => { event.preventDefault(); event.stopPropagation(); onDropBefore(issue.id); }}
    className="group relative rounded-xl border border-[var(--ff-border)] bg-[var(--ff-surface)] p-3.5 shadow-[var(--ff-shadow-xs)] transition-colors hover:border-[var(--ff-border-strong)] focus-within:ring-2 focus-within:ring-[var(--ff-focus)]"
  >
    <div className="flex items-start justify-between gap-2">
      <Link href={detailUrl} className="min-w-0 break-words text-[13px] font-semibold leading-5 text-[var(--ff-text-strong)] hover:text-[var(--ff-primary)] hover:underline focus-visible:rounded focus-visible:outline-2 focus-visible:outline-[var(--ff-focus)]">{issue.title}</Link>
      {active && <GripVertical size={16} className="mt-0.5 shrink-0 text-[var(--ff-muted)]" aria-hidden="true"/>}
    </div>
    <div className="mt-3 flex flex-wrap gap-2 text-[10.5px] font-semibold">
      <span className={`rounded-full px-2.5 py-1 ${tones[lane].chip}`}>{display(lane)}</span>
      <span className="rounded-full bg-[var(--ff-surface-2)] px-2.5 py-1 text-[var(--ff-muted)]">{display(issue.type)}</span>
      <span className={`rounded-full bg-[var(--ff-surface-2)] px-2.5 py-1 ${priorityStyle[issue.priority]}`}>{display(issue.priority)}</span>
    </div>
    <p className="mt-3 truncate text-[11px] text-[var(--ff-muted)]" title={issue.assigneeId ?? 'Unassigned'}>
      {issue.assigneeId ? `Assignee · ${issue.assigneeId.slice(0, 8)}…` : 'Unassigned'}
    </p>
    {active && <div className="mt-3 space-y-2 border-t border-[var(--ff-border-faint)] pt-3">
      <div className="flex gap-2">
        <Button size="icon" variant="outline" className="!h-10 !w-10 !min-h-10" disabled={busy || index === 0}
          aria-label={`Move ${issue.title} up in ${display(lane)}`} onClick={() => onMove(issue, lane, index - 1)}><ArrowUp size={14}/></Button>
        <Button size="icon" variant="outline" className="!h-10 !w-10 !min-h-10" disabled={busy || index === length - 1}
          aria-label={`Move ${issue.title} down in ${display(lane)}`} onClick={() => onMove(issue, lane, index + 1)}><ArrowDown size={14}/></Button>
      </div>
      <div className="flex flex-wrap gap-2">
        <select key={`${issue.id}-${issue.status}`} aria-label={`Destination status for ${issue.title}`} value={destination} disabled={busy}
          onChange={(event) => setDestination(event.target.value)} className={`${control} min-w-0 flex-1`}>
          {STATUSES.map((status) => <option key={status} value={status}>{display(status)}</option>)}
        </select>
        <Button size="sm" variant="secondary" disabled={busy || destination === lane}
          aria-label={`Move ${issue.title} to end of selected status`} onClick={() => onMove(issue, destination, null)}>
          <MoveRight size={14}/> Move
        </Button>
      </div>
    </div>}
  </article>;
}

function BoardContent({ user, signOutAction, workspaceId, projectId }) {
  const client = useQueryClient();
  const [draggingId, setDraggingId] = useState(null);
  const [overId, setOverId] = useState(null);
  const [notice, setNotice] = useState('');
  const path = `${issuePath(workspaceId, projectId).replace(/\/issues$/, '')}/board`;
  const key = ['m8-board', workspaceId, projectId];
  const spaces = useQuery({ queryKey: ['workspaces', user.id, 'm6-shell'], queryFn: () => domainRequest('?page=1&limit=100') });
  const workspace = useQuery({ queryKey: ['workspaces', user.id, workspaceId], queryFn: () => domainRequest(`/${workspaceId}`), retry: false });
  const project = useQuery({ queryKey: ['m6-project', workspaceId, projectId], queryFn: () => domainRequest(`/${workspaceId}/projects/${projectId}`), enabled: workspace.isSuccess, retry: false });
  const board = useQuery({ queryKey: key, queryFn: () => domainRequest(path), enabled: project.isSuccess, retry: false });
  const mutation = useMutation({
    mutationFn: (move) => domainRequest(`${path}/moves`, mutationOptions('POST', move)),
    onMutate: async (move) => {
      await client.cancelQueries({ queryKey: key });
      const old = client.getQueryData(key);
      client.setQueryData(key, (current) => previewBoard(current, move.issueId, move.toStatus, move.targetIndex));
      setNotice('Saving board order…');
      return { old };
    },
    onError: (error, _move, context) => {
      if (context?.old) client.setQueryData(key, context.old);
      setNotice(error.status === 409 ? 'The board changed in another edit. Latest order is being loaded; please try again.' : 'Move not saved. Previous order restored.');
    },
    onSuccess: () => { setNotice('Move saved. Board order refreshed.'); },
    onSettled: async () => {
      await Promise.all([
        client.invalidateQueries({ queryKey: key }),
        client.invalidateQueries({ queryKey: ['m7-issues', workspaceId, projectId] }),
        client.invalidateQueries({ queryKey: ['m7-issue', workspaceId, projectId] }),
      ]);
    },
  });
  const issues = board.data?.issues || [];
  const lanes = boardLanes(issues);
  const active = board.data?.projectStatus === 'ACTIVE';
  const busy = mutation.isPending || board.isFetching;

  function move(issue, toStatus, targetIndex) {
    if (!active || busy || !board.data) return;
    const index = targetIndex === null ? destinationIndex(issues, issue.id, toStatus) : targetIndex;
    if (index === null || isUnchangedMove(issues, issue.id, toStatus, index)) return;
    mutation.mutate({ issueId: issue.id, toStatus, targetIndex: index,
      expectedBoardVersion: board.data.boardVersion, expectedIssueVersion: issue.version });
  }
  function clearDrag() { setDraggingId(null); setOverId(null); }
  function drop(targetStatus, beforeId = null) {
    const issue = issues.find((item) => item.id === draggingId);
    clearDrag();
    if (!issue) return;
    const index = destinationIndex(issues, issue.id, targetStatus, beforeId);
    if (index !== null) move(issue, targetStatus, index);
  }
  return <WorkspaceShell user={user} signOutAction={signOutAction} selectedWorkspace={workspace.data?.workspace} workspaces={spaces.data?.workspaces || []}>
    <main className="mx-auto w-full max-w-[1700px] space-y-6 px-4 py-7 sm:px-7 lg:px-9 lg:py-10">
      <Link href={`/w/${workspaceId}/projects/${projectId}`} className="ff-text-link inline-flex min-h-10 items-center gap-2 text-[13px] font-semibold"><ArrowLeft size={15}/> Project detail</Link>
      <PageHeader eyebrow="Delivery · Persisted board" title={project.data?.project?.name ? `Board · ${project.data.project.name}` : 'Kanban board'}
        description="Drag cards on desktop, or use Move and Up/Down controls on keyboard and touch. Changes are saved to the project board."
        action={<Button variant="secondary" onClick={() => { setNotice(''); board.refetch(); project.refetch(); }} disabled={busy}><RefreshCw size={15}/> Refresh</Button>}/>
      {(workspace.isError || project.isError) && <InlineAlert tone="error">Project unavailable or you do not have access.</InlineAlert>}
      {board.data && !active && <InlineAlert tone="info">This project is archived. You can view the board, but moves are disabled.</InlineAlert>}
      {notice && <div role="status" aria-live="polite" className="text-[13px] text-[var(--ff-muted)]">{notice}</div>}
      {mutation.error && mutation.error.status !== 409 && <InlineAlert tone="error">{mutation.error.message}</InlineAlert>}
      {mutation.error?.status === 409 && <InlineAlert tone="warn">A version conflict prevented your move. Latest data was requested; check the board before trying again.</InlineAlert>}
      {project.isPending || (project.isSuccess && board.isPending) ? <div aria-label="Loading board" role="status" className="grid gap-4 lg:grid-cols-4">{STATUSES.map((s) => <Skeleton key={s} className="h-64 w-full"/>)}</div> : null}
      {project.isSuccess && board.isError && <InlineAlert tone="error">{board.error.message} <Button size="sm" variant="secondary" onClick={() => board.refetch()}>Retry</Button></InlineAlert>}
      {board.data && <>
        <div className="flex flex-wrap items-center justify-between gap-3 text-[12px] text-[var(--ff-muted)]">
          <span className="inline-flex items-center gap-2"><LayoutGrid size={15}/> {issues.length} issues across 4 lanes</span>
          <span>Board version {board.data.boardVersion}{busy ? ' · Syncing…' : ''}</span>
        </div>
        <div aria-label="Project Kanban board" className="grid grid-cols-1 items-start gap-4 md:grid-cols-2 xl:grid-cols-4">
          {STATUSES.map((status) => <section key={status} aria-label={`${display(status)} lane`}
            onDragOver={(event) => { if (active && !busy) { event.preventDefault(); event.dataTransfer.dropEffect = 'move'; } }}
            onDrop={(event) => { event.preventDefault(); drop(status); }}
            className="min-w-0 overflow-hidden rounded-[var(--ff-radius-panel)] border border-[var(--ff-border)] bg-[var(--ff-surface-2)]/60">
            <div className={`h-1 bg-gradient-to-r ${tones[status].line}`}/>
            <div className="flex items-center justify-between gap-3 border-b border-[var(--ff-border-faint)] px-4 py-4">
              <h2 className="text-[13px] font-bold text-[var(--ff-text-strong)]">{display(status)}</h2>
              <span className="rounded-full bg-[var(--ff-surface)] px-2.5 py-1 text-[11px] font-semibold text-[var(--ff-muted)]">{lanes[status].length}</span>
            </div>
            <div className="min-h-28 space-y-3 p-3">
              {lanes[status].length === 0 && <p className="rounded-xl border border-dashed border-[var(--ff-border)] px-3 py-7 text-center text-[12px] text-[var(--ff-muted)]">No issues in this lane</p>}
              {lanes[status].map((issue, index) => <div key={issue.id}
                className={overId === issue.id ? 'rounded-xl ring-2 ring-[var(--ff-primary)]' : ''}>
                <KanbanCard issue={issue} lane={status} index={index} length={lanes[status].length}
                  projectId={projectId} workspaceId={workspaceId} active={active} busy={busy} onMove={move}
                  onDragStart={(id) => { setDraggingId(id); setOverId(null); }} onDragEnd={clearDrag}
                  onDragOver={setOverId} onDropBefore={(beforeId) => drop(status, beforeId)}/>
              </div>)}
              {active && <div className="pt-2 text-center text-[11px] text-[var(--ff-muted)]">Drop here to move to lane end</div>}
            </div>
          </section>)}
        </div>
      </>}
    </main>
  </WorkspaceShell>;
}
export function ProjectBoard(props) { return <QueryProvider><BoardContent {...props}/></QueryProvider>; }
