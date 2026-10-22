'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Archive, FolderKanban, Plus, Save } from 'lucide-react';
import QueryProvider from '@/providers/query-provider';
import { WorkspaceShell } from '@/components/layout/workspace-shell';
import { SemanticBadge } from '@/components/ui/semantic-badge';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Field } from '@/components/ui/field';
import { InlineAlert } from '@/components/ui/inline-alert';
import { Skeleton } from '@/components/ui/skeleton';

const schema = z.strictObject({ name:z.string().trim().min(2).max(120), description:z.string().trim().max(2000) });
async function request(path, opts) {
  const response=await fetch(`/api/backend/workspaces${path}`,{cache:'no-store',...opts});
  const data=response.status===204?{}:await response.json().catch(()=>({}));
  if(!response.ok) throw new Error(data.error?.message||'The request did not succeed.');
  return data;
}
const write=(method,body)=>({method,headers:{'content-type':'application/json'},body:JSON.stringify(body)});

function ProjectForm({workspaceId,project,onSaved,onCancel}) {
  const client=useQueryClient();
  const form=useForm({resolver:zodResolver(schema),defaultValues:{name:project?.name||'',description:project?.description||''}});
  const mutation=useMutation({
    mutationFn:(values)=>request(`/${workspaceId}/projects${project?`/${project.id}`:''}`,
      write(project?'PATCH':'POST',project?{...values,expectedVersion:project.version}:values)),
    onSuccess:async({project:saved})=>{
      await client.invalidateQueries({queryKey:['m6-projects',workspaceId]});
      onSaved(saved);
    },
  });
  return <form noValidate onSubmit={form.handleSubmit(v=>mutation.mutate(v))} className="space-y-4" aria-busy={mutation.isPending}>
    <Field id="project-name" label="Project name" error={form.formState.errors.name}>
      <Input id="project-name" placeholder="e.g. Client launch" {...form.register('name')}/>
    </Field>
    <Field id="project-description" label="Description" optional error={form.formState.errors.description}>
      <textarea id="project-description" rows={3} {...form.register('description')}
        className="w-full rounded-[10px] border border-[var(--ff-border)] bg-[var(--ff-surface)] p-3 text-[14px] text-[var(--ff-text)] focus-visible:outline-2 focus-visible:outline-[var(--ff-primary)]" />
    </Field>
    {mutation.error&&<InlineAlert tone="error">{mutation.error.message}</InlineAlert>}
    <div className="flex flex-wrap gap-2">
      <Button type="submit" disabled={mutation.isPending}><Save size={15} aria-hidden="true"/>{mutation.isPending?'Saving…':project?'Save changes':'Create project'}</Button>
      <Button variant="secondary" onClick={onCancel}>Cancel</Button>
    </div>
  </form>;
}
function ProjectsContent({user,signOutAction,workspaceId}) {
  const [status,setStatus]=useState('ACTIVE');
  const [page,setPage]=useState(1);
  const [creating,setCreating]=useState(false);
  const [editing,setEditing]=useState(null);
  const [archiveTarget,setArchiveTarget]=useState(null);
  const [notice,setNotice]=useState('');
  const client=useQueryClient();
  const spaces=useQuery({queryKey:['workspaces',user.id,'m6-shell'],queryFn:()=>request('?page=1&limit=100')});
  const workspace=useQuery({queryKey:['workspaces',user.id,workspaceId],queryFn:()=>request(`/${workspaceId}`),retry:false});
  const selected=workspace.data?.workspace;
  const projects=useQuery({queryKey:['m6-projects',workspaceId,status,page],
    queryFn:()=>request(`/${workspaceId}/projects?status=${status}&page=${page}&limit=20`),
    enabled:workspace.isSuccess,retry:false});
  const canManage=['OWNER','ADMIN'].includes(selected?.role);
  const archive=useMutation({
    mutationFn:(p)=>request(`/${workspaceId}/projects/${p.id}/archive`,write('POST',{expectedVersion:p.version})),
    onSuccess:async()=>{setArchiveTarget(null);setNotice('Project archived.');await client.invalidateQueries({queryKey:['m6-projects',workspaceId]});},
  });
  return <WorkspaceShell user={user} signOutAction={signOutAction} selectedWorkspace={selected} workspaces={spaces.data?.workspaces||[]}>
    <div className="mx-auto w-full max-w-[var(--ff-container)] space-y-7 px-4 py-8 sm:px-7 lg:px-10 lg:py-12">
      <Link href={`/w/${workspaceId}`} className="ff-text-link inline-flex min-h-10 items-center gap-2 text-[13px] font-semibold"><ArrowLeft size={15}/> Workspace overview</Link>
      <PageHeader eyebrow="Delivery" title="Projects" description="Manage projects in this workspace. Every record is scoped to your membership."
        action={canManage?<Button onClick={()=>{setEditing(null);setCreating(v=>!v);}}><Plus size={16}/>New project</Button>:null}/>
      {workspace.isPending?<Skeleton className="h-24 w-full"/>:workspace.isError?<InlineAlert tone="error">Workspace not available. You may not have access.</InlineAlert>:null}
      {notice&&<InlineAlert tone="success">{notice}</InlineAlert>}
      {creating&&canManage&&<section className="ff-panel rounded-[var(--ff-radius-xl)] border border-[var(--ff-border)] bg-[var(--ff-surface)] p-6">
        <h2 className="mb-4 text-[17px] font-semibold">New project</h2>
        <ProjectForm workspaceId={workspaceId} onSaved={()=>{setCreating(false);setNotice('Project created.');}} onCancel={()=>setCreating(false)}/>
      </section>}
      {editing&&canManage&&<section className="ff-panel rounded-[var(--ff-radius-xl)] border border-[var(--ff-border)] bg-[var(--ff-surface)] p-6">
        <h2 className="mb-4 text-[17px] font-semibold">Edit project</h2>
        <ProjectForm key={`${editing.id}:${editing.version}`} workspaceId={workspaceId} project={editing}
          onSaved={()=>{setEditing(null);setNotice('Project updated.');}} onCancel={()=>setEditing(null)}/>
      </section>}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <label className="flex items-center gap-2 text-[13px] font-semibold">Show
          <select value={status} onChange={e=>{setStatus(e.target.value);setPage(1);}} className="h-11 rounded-[10px] border border-[var(--ff-border)] bg-[var(--ff-surface)] px-3">
            <option value="ACTIVE">Active</option><option value="ARCHIVED">Archived</option>
          </select>
        </label>
        <Link className="ff-text-link text-[13px] font-semibold" href={`/w/${workspaceId}/settings/members`}>Workspace members →</Link>
      </div>
      {workspace.isError?null:projects.isPending?<div role="status" aria-label="Loading projects" className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{[0,1,2].map(n=><Skeleton key={n} className="h-44 w-full rounded-xl" />)}</div>:
        projects.isError?<div role="alert" className="rounded-xl border border-[var(--ff-border)] bg-[var(--ff-surface)] p-6"><p>{projects.error.message}</p><Button variant="secondary" className="mt-3" onClick={()=>projects.refetch()}>Retry</Button></div>:
        !projects.data.projects.length?<div className="rounded-[var(--ff-radius-xl)] border border-dashed border-[var(--ff-border)] bg-[var(--ff-surface)] px-6 py-12 text-center">
          <FolderKanban className="mx-auto text-[var(--ff-primary)]" size={30} aria-hidden="true"/>
          <h2 className="mt-4 text-[19px] font-semibold">No {status.toLowerCase()} projects</h2>
          <p className="mt-2 text-[13px] text-[var(--ff-muted)]">{canManage?'Create a project to start organizing work.':'Projects will appear here when your workspace managers create them.'}</p>
        </div>:<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {projects.data.projects.map(p=><article key={p.id} className="ff-card rounded-[var(--ff-radius-panel)] border border-[var(--ff-border-faint)] bg-[var(--ff-surface)] p-5 shadow-[var(--ff-shadow-xs)]">
            <div className="flex items-start justify-between gap-3"><span className="rounded-lg bg-[var(--ff-primary-soft)] p-2.5 text-[var(--ff-primary)]"><FolderKanban size={19}/></span>
              <SemanticBadge kind="project" value={p.status}/></div>
            <h2 className="mt-4 break-words text-[17px] font-semibold tracking-tight">{p.name}</h2>
            <p className="mt-2 line-clamp-3 min-h-10 text-[13px] leading-5 text-[var(--ff-muted)]">{p.description||'No description yet.'}</p>
            <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-[var(--ff-border-faint)] pt-4">
              <Link href={`/w/${workspaceId}/projects/${p.id}`} className="ff-text-link inline-flex min-h-10 items-center text-[13px] font-semibold">View detail →</Link>
              {canManage&&p.status==='ACTIVE'&&<>
                <Button size="sm" variant="secondary" onClick={()=>{setEditing(p);setCreating(false);}}>Edit</Button>
                <Button size="sm" variant="ghost" onClick={()=>setArchiveTarget(p)}><Archive size={13}/>Archive</Button>
              </>}
            </div>
          </article>)}
        </div>}
      {archiveTarget&&<div role="group" aria-label="Confirm archive" className="rounded-xl border border-[var(--ff-border)] bg-[var(--ff-surface)] p-5">
        <p className="text-[14px] font-semibold">Archive “{archiveTarget.name}”?</p>
        <p className="mt-1 text-[13px] text-[var(--ff-muted)]">Archived projects become read-only.</p>
        {archive.error&&<InlineAlert tone="error">{archive.error.message}</InlineAlert>}
        <div className="mt-4 flex gap-2"><Button variant="danger" disabled={archive.isPending} onClick={()=>archive.mutate(archiveTarget)}>Confirm archive</Button><Button variant="secondary" onClick={()=>setArchiveTarget(null)}>Cancel</Button></div>
      </div>}
      {projects.data?.pagination?.total>20&&<div className="flex items-center justify-between gap-3 text-[13px]">
        <Button variant="secondary" disabled={page===1||projects.isFetching} onClick={()=>setPage(p=>p-1)}>Previous</Button><span>Page {page}</span>
        <Button variant="secondary" disabled={page*20>=projects.data.pagination.total||projects.isFetching} onClick={()=>setPage(p=>p+1)}>Next</Button>
      </div>}
    </div>
  </WorkspaceShell>;
}
export function WorkspaceProjects(props){return <QueryProvider><ProjectsContent {...props}/></QueryProvider>;}
