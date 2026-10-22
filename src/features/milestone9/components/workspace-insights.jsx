'use client';
import { useQuery } from '@tanstack/react-query';
import { Activity, CheckCircle2, FolderKanban, ListTodo, RefreshCw, TrendingUp } from 'lucide-react';
import { SemanticBadge } from '@/components/ui/semantic-badge';

const statuses = ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE'];
const priorities = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];
const colors = ['#64748b', '#06b6d4', '#a855f7', '#10b981'];

async function loadSummary(workspaceId) {
  const response = await fetch(`/api/backend/workspaces/${workspaceId}/summary`, { cache: 'no-store' });
  const body = await response.json().catch(() => null);
  if (!response.ok) throw new Error(body?.error?.message || 'Workspace statistics unavailable');
  return body;
}
function history(days, createdDaily) {
  const current = new Date();
  const start = Date.UTC(current.getUTCFullYear(), current.getUTCMonth(), current.getUTCDate());
  const map = new Map(createdDaily.map((entry) => [entry.day, entry.count]));
  return Array.from({ length: days }, (_, index) => {
    const date = new Date(start - (days - index - 1) * 86400000);
    const day = date.toISOString().slice(0, 10);
    return { day, count: map.get(day) ?? 0 };
  });
}

export function WorkspaceInsights({ workspaceId }) {
  const summary = useQuery({ queryKey: ['m9-workspace-summary', workspaceId],
    queryFn: () => loadSummary(workspaceId), retry: false, refetchOnWindowFocus: true });
  if (summary.isPending) return <section aria-label="Loading workspace statistics" role="status" className="ff-m9-panel p-6">
    <p className="animate-pulse text-sm text-slate-300 motion-reduce:animate-none">Loading real workspace statistics…</p>
  </section>;
  if (summary.isError) return <section role="alert" className="ff-m9-panel p-6">
    <p className="text-sm font-semibold">Statistics temporarily unavailable.</p>
    <p className="mt-2 text-sm text-slate-300">{summary.error.message}</p>
    <button type="button" onClick={() => summary.refetch()} className="mt-3 inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-500 px-4 text-sm"><RefreshCw size={14}/> Retry</button>
  </section>;
  const { projects, issues, createdDaily } = summary.data;
  const completion = issues.total ? Math.round((issues.done / issues.total) * 100) : null;
  const recent = history(14, createdDaily);
  const peak = Math.max(...recent.map((item) => item.count), 1);
  const statusParts = statuses.map((name, index) => ({ name, count: issues.byStatus[name], color: colors[index] }));
  let angle = 0;
  const slices = statusParts.map((item) => {
    const start = angle;
    angle += issues.total ? (item.count / issues.total) * 360 : 0;
    return `${item.color} ${start}deg ${angle}deg`;
  });
  return <section aria-labelledby="m9-insights-title" className="space-y-5">
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div><p className="text-[11px] font-bold uppercase tracking-[.18em] text-[var(--ff-primary)]">Workspace intelligence</p>
        <h2 id="m9-insights-title" className="mt-1 text-2xl font-semibold tracking-tight text-[var(--ff-text-strong)]">Operations overview</h2>
        <p className="mt-1 text-sm text-[var(--ff-muted)]">Actual saved projects and issues · workspace scope</p></div>
      <span className="text-xs text-[var(--ff-muted)]">UTC · Refetch on return</span>
    </div>
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {[[FolderKanban,'Projects',projects.total,'All statuses'],[Activity,'Active projects',projects.active,'Currently active'],
        [ListTodo,'Open issues',issues.open,'Not yet done'],[CheckCircle2,'Done issues',issues.done,'Completed status']].map(([Icon,label,value,hint]) =>
        <article key={label} className="ff-m9-panel flex items-start gap-3 p-5">
          <span className="rounded-xl bg-cyan-400/10 p-2.5 text-cyan-300"><Icon size={19}/></span>
          <div><p className="text-xs text-slate-300">{label}</p><p className="mt-1 text-3xl font-bold tabular-nums">{value}</p><p className="text-[11px] text-slate-400">{hint}</p></div>
        </article>)}
    </div>
    <div className="grid gap-4 xl:grid-cols-[1.3fr_1fr]">
      <div className="ff-m9-panel min-w-0 p-5 sm:p-6">
        <div className="flex items-center gap-2"><TrendingUp size={17} className="text-cyan-300"/><h3 className="font-semibold">Issue creation · last 14 UTC days</h3></div>
        <p className="mt-1 text-xs text-slate-400">Created on each day, not completion throughput</p>
        <div className="mt-7 flex h-48 items-end gap-1.5 border-b border-white/15 pb-2" role="img"
          aria-label={`Daily issue creation: ${recent.map((entry) => `${entry.day}: ${entry.count}`).join(', ')}`}>
          {recent.map((entry) => <div key={entry.day} className="group relative flex min-w-0 flex-1 items-end justify-center" style={{ height: '100%' }} title={`${entry.day}: ${entry.count}`}>
            <div className="w-full max-w-8 rounded-t-md bg-gradient-to-t from-blue-700 to-cyan-400" style={{height:`${entry.count ? Math.max(6, entry.count / peak * 100) : 2}%`,opacity:entry.count ? 1 : .23}} />
          </div>)}
        </div>
        <div className="mt-2 flex justify-between text-[11px] text-slate-400"><span>{recent[0].day}</span><span>{recent[recent.length-1].day}</span></div>
        <details className="mt-4 text-xs text-slate-300"><summary className="cursor-pointer underline underline-offset-4">Accessible daily counts</summary>
          <ul className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">{recent.map((item) => <li key={item.day}>{item.day}: {item.count}</li>)}</ul>
        </details>
      </div>
      <div className="ff-m9-panel p-5 sm:p-6">
        <h3 className="font-semibold">Issue status breakdown</h3>
        <p className="mt-1 text-xs text-slate-400">{issues.total} non-deleted issues</p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-7">
          <div className="relative flex h-40 w-40 shrink-0 items-center justify-center rounded-full" role="img"
            aria-label={completion === null ? 'No issues yet' : `${completion}% of issues are done`}
            style={{ background: issues.total ? `conic-gradient(${slices.join(',')})` : '#334155' }}>
            <div className="flex h-28 w-28 flex-col items-center justify-center rounded-full bg-[#111b32]">
              <p className="text-3xl font-bold">{completion === null ? '—' : `${completion}%`}</p><p className="text-[11px] text-slate-400">done</p>
            </div>
          </div>
          <ul className="min-w-32 space-y-2">{statusParts.map((part) => <li key={part.name} className="flex items-center justify-between gap-3 text-xs">
            <SemanticBadge kind="status" value={part.name}/><span className="tabular-nums">{part.count}</span></li>)}</ul>
        </div>
      </div>
    </div>
    <div className="ff-m9-panel p-5 sm:p-6"><h3 className="font-semibold">Priority distribution</h3>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{priorities.map((priority) => <div key={priority} className="ff-m9-kpi flex items-center justify-between p-3">
        <SemanticBadge kind="priority" value={priority}/><span className="text-xl font-semibold tabular-nums">{issues.byPriority[priority]}</span></div>)}</div>
    </div>
    {!issues.total && <p className="rounded-xl border border-dashed border-[var(--ff-border)] px-5 py-4 text-sm text-[var(--ff-muted)]">No issues yet. Add an issue to a project to see your charts populate.</p>}
  </section>;
}
