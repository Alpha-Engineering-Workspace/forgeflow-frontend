'use client';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import QueryProvider from '@/providers/query-provider';
import { WorkspaceShell } from '@/components/layout/workspace-shell';
import { PageHeader } from '@/components/ui/page-header';
import { Skeleton } from '@/components/ui/skeleton';
import { InlineAlert } from '@/components/ui/inline-alert';
import { ListTodo } from 'lucide-react';
async function get(path) {
  const r=await fetch(`/api/backend/workspaces${path}`,{cache:'no-store'});
  const data=await r.json().catch(()=>({}));
  if(!r.ok)throw new Error(data.error?.message||'Project not available');
  return data;
}
function Detail({user,signOutAction,workspaceId,projectId}) {
  const spaces=useQuery({queryKey:['workspaces',user.id,'m6-shell'],queryFn:()=>get('?page=1&limit=100')});
  const workspace=useQuery({queryKey:['workspaces',user.id,workspaceId],queryFn:()=>get(`/${workspaceId}`),retry:false});
  const project=useQuery({queryKey:['m6-project',workspaceId,projectId],queryFn:()=>get(`/${workspaceId}/projects/${projectId}`),
    enabled:workspace.isSuccess,retry:false});
  return <WorkspaceShell user={user} signOutAction={signOutAction} selectedWorkspace={workspace.data?.workspace} workspaces={spaces.data?.workspaces||[]}>
    <div className="mx-auto w-full max-w-4xl space-y-6 px-4 py-8 sm:px-7 lg:py-12">
      <Link href={`/w/${workspaceId}/projects`} className="ff-text-link inline-flex min-h-10 items-center text-[13px] font-semibold">← Back to projects</Link>
      {workspace.isError||project.isError?<InlineAlert tone="error">Project not available for this workspace.</InlineAlert>:
        project.isPending?<Skeleton className="h-56 w-full"/>:
        <><PageHeader eyebrow="Project detail" title={project.data.project.name} description={`Status: ${project.data.project.status} · Version ${project.data.project.version}`} />
          <section className="ff-panel rounded-[var(--ff-radius-xl)] border border-[var(--ff-border-faint)] bg-[var(--ff-surface)] p-6 sm:p-8">
            <h2 className="text-[14px] font-semibold">Description</h2>
            <p className="mt-3 whitespace-pre-wrap break-words text-[14px] leading-7 text-[var(--ff-muted)]">{project.data.project.description||'No description provided.'}</p>
            <div className="mt-7 border-t border-[var(--ff-border)] pt-5">
              <Link href={`/w/${workspaceId}/projects/${projectId}/issues`} className="ff-text-link inline-flex min-h-11 items-center gap-2 text-[13px] font-semibold"><ListTodo size={17}/> View project issues →</Link>
              <p className="mt-2 text-[12px] text-[var(--ff-muted)]">{project.data.project.status==='ACTIVE'?'Create and manage issues for this project.':'Archived projects allow read-only issue access.'}</p>
            </div>
            <p className="mt-5 text-[12px] text-[var(--ff-muted)]">Changes and archive actions are available from the projects list to workspace Owner/Admin.</p>
          </section>
        </>}
    </div>
  </WorkspaceShell>;
}
export function ProjectDetail(props) {return <QueryProvider><Detail {...props}/></QueryProvider>;}
