'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Mail, Send, ShieldCheck, Trash2, Users } from 'lucide-react';
import QueryProvider from '@/providers/query-provider';
import { WorkspaceShell } from '@/components/layout/workspace-shell';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Field } from '@/components/ui/field';
import { InlineAlert } from '@/components/ui/inline-alert';
import { Skeleton } from '@/components/ui/skeleton';
const inviteSchema=z.strictObject({email:z.email().trim().toLowerCase().max(254),role:z.enum(['MEMBER','ADMIN'])});
async function api(path, options){const r=await fetch(`/api/backend/workspaces${path}`,{cache:'no-store',...options});
  const data=r.status===204?{}:await r.json().catch(()=>({}));
  if(!r.ok)throw new Error(data.error?.message||'Request failed');return data;}
function write(method,body){return {method,headers:{'content-type':'application/json'},body:JSON.stringify(body)};}
function MembersContent({workspaceId,user,signOutAction}){
  const [notice,setNotice]=useState('');
  const [error,setError]=useState('');
  const [removeTarget,setRemoveTarget]=useState(null);
  const query=useQueryClient();
  const spaces=useQuery({queryKey:['workspaces',user.id,'m6-shell'],queryFn:()=>api('?page=1&limit=100')});
  const workspace=useQuery({queryKey:['workspaces',user.id,workspaceId],queryFn:()=>api(`/${workspaceId}`),retry:false});
  const selected=workspace.data?.workspace;
  const canManage=['OWNER','ADMIN'].includes(selected?.role);
  const members=useQuery({queryKey:['m6-members',workspaceId],queryFn:()=>api(`/${workspaceId}/members`),enabled:workspace.isSuccess,retry:false});
  const invitations=useQuery({queryKey:['m6-invites',workspaceId],queryFn:()=>api(`/${workspaceId}/invitations`),enabled:workspace.isSuccess&&canManage,retry:false});
  const form=useForm({resolver:zodResolver(inviteSchema),defaultValues:{email:'',role:'MEMBER'}});
  const invalidate=()=>Promise.all([query.invalidateQueries({queryKey:['m6-members',workspaceId]}),query.invalidateQueries({queryKey:['m6-invites',workspaceId]})]);
  const invite=useMutation({mutationFn:(values)=>api(`/${workspaceId}/invitations`,write('POST',values)),
    onSuccess:async ({invitation})=>{form.reset();setNotice(invitation.deliveryStatus==='SENT'?'Invitation submitted to email provider.':'Invitation saved; email delivery failed. Use Resend.');await invalidate();}});
  const action=useMutation({mutationFn:({path,options})=>api(path,options),onSuccess:async(data)=>{setError('');setNotice(data?.invitation?.deliveryStatus==='FAILED'?'Invitation updated, but email delivery failed. Use Resend.':'Changes saved.');setRemoveTarget(null);await invalidate();}});
  const execute=async(path,options)=>{setError('');try{await action.mutateAsync({path,options});}catch(e){setError(e.message);}};
  return <WorkspaceShell user={user} signOutAction={signOutAction} selectedWorkspace={selected} workspaces={spaces.data?.workspaces||[]}>
    <div className="mx-auto w-full max-w-[var(--ff-container)] space-y-7 px-4 py-8 sm:px-7 lg:px-10 lg:py-12">
      <Link href={`/w/${workspaceId}`} className="ff-text-link inline-flex min-h-10 items-center text-[13px] font-semibold">← Workspace overview</Link>
      <PageHeader eyebrow="Workspace settings" title="Members & invitations" description="Invite verified email accounts, manage roles and protect workspace ownership."/>
      {notice&&<InlineAlert tone="success">{notice}</InlineAlert>}{error&&<InlineAlert tone="error">{error}</InlineAlert>}
      {workspace.isPending?<Skeleton className="h-24 w-full"/>:workspace.isError?<InlineAlert tone="error">Workspace not available.</InlineAlert>:null}
      {canManage&&<section className="ff-panel rounded-[var(--ff-radius-xl)] border border-[var(--ff-border)] bg-[var(--ff-surface)] p-6 sm:p-7">
        <div className="mb-5 flex items-center gap-3"><Mail className="text-[var(--ff-primary)]" size={21}/><div><h2 className="text-[17px] font-semibold">Invite teammate</h2><p className="text-[13px] text-[var(--ff-muted)]">An invitation grants no access until the recipient accepts using their verified email.</p></div></div>
        <form noValidate onSubmit={form.handleSubmit(v=>{setNotice('');invite.mutate(v);})} className="grid gap-4 md:grid-cols-[minmax(0,1fr)_180px_auto] md:items-end" aria-busy={invite.isPending}>
          <Field id="invite-email" label="Email address" error={form.formState.errors.email}>
            <Input id="invite-email" type="email" autoComplete="off" placeholder="teammate@company.com" {...form.register('email')}/>
          </Field>
          <Field id="invite-role" label="Role" error={form.formState.errors.role}>
            <select id="invite-role" {...form.register('role')} className="h-11 w-full rounded-[10px] border border-[var(--ff-border)] bg-[var(--ff-surface)] px-3 text-[14px]"><option value="MEMBER">Member</option><option value="ADMIN">Admin</option></select>
          </Field>
          <Button type="submit" disabled={invite.isPending}><Send size={15}/>{invite.isPending?'Sending…':'Send invite'}</Button>
        </form>
        {invite.error&&<div className="mt-4"><InlineAlert tone="error">{invite.error.message}</InlineAlert></div>}
      </section>}
      <section className="ff-panel rounded-[var(--ff-radius-xl)] border border-[var(--ff-border-faint)] bg-[var(--ff-surface)] p-6 sm:p-7">
        <div className="mb-5 flex items-center gap-3"><Users className="text-[var(--ff-primary)]" size={21}/><h2 className="text-[17px] font-semibold">Workspace members</h2></div>
        {workspace.isError?null:members.isPending?<Skeleton className="h-28 w-full"/>:members.isError?<InlineAlert tone="error">Could not load members.</InlineAlert>:<div className="divide-y divide-[var(--ff-border-faint)]">
          {members.data.members.map(m=><div key={m.userId} className="flex flex-wrap items-center justify-between gap-3 py-4">
            <div className="min-w-0"><p className="break-all font-mono text-[12px] text-[var(--ff-text)]">{m.userId===user.id?'You · ':''}{m.userId}</p><p className="mt-1 text-[11px] text-[var(--ff-muted)]">Member identity (Auth profile display pending)</p></div>
            <div className="flex flex-wrap items-center gap-2"><span className="rounded-full bg-[var(--ff-primary-soft)] px-3 py-1 text-[11px] font-bold">{m.role}</span>
              {canManage&&m.role!=='OWNER'&&m.userId!==user.id&&<>
                <label className="sr-only" htmlFor={`role-${m.userId}`}>Change member role</label>
                <select id={`role-${m.userId}`} key={`${m.userId}:${m.role}`} defaultValue={m.role} disabled={action.isPending}
                  onChange={async e=>{const chosen=e.target.value;await execute(`/${workspaceId}/members/${m.userId}`,write('PATCH',{role:chosen}));
                    await query.invalidateQueries({queryKey:['m6-members',workspaceId]});}}
                  className="h-10 rounded-[9px] border border-[var(--ff-border)] bg-[var(--ff-surface)] px-2 text-[12px]">
                  <option value="MEMBER">Member</option><option value="ADMIN">Admin</option></select>
                <Button variant="ghost" size="sm" onClick={()=>setRemoveTarget(m)}><Trash2 size={14}/>Remove</Button>
              </>}
            </div>
          </div>)}
          {!members.data.members.length&&<p className="text-[13px] text-[var(--ff-muted)]">No members to display.</p>}
        </div>}
      </section>
      {removeTarget&&<section role="group" aria-label="Confirm removal" className="rounded-xl border border-[var(--ff-border)] bg-[var(--ff-surface)] p-5">
        <h3 className="text-[14px] font-semibold">Remove member {removeTarget.userId}?</h3>
        <p className="mt-1 text-[13px] text-[var(--ff-muted)]">This user will immediately lose workspace API access.</p>
        <div className="mt-4 flex gap-2"><Button variant="danger" disabled={action.isPending} onClick={()=>execute(`/${workspaceId}/members/${removeTarget.userId}`,{method:'DELETE'})}>Confirm removal</Button><Button variant="secondary" onClick={()=>setRemoveTarget(null)}>Cancel</Button></div>
      </section>}
      {canManage&&<section className="ff-panel rounded-[var(--ff-radius-xl)] border border-[var(--ff-border-faint)] bg-[var(--ff-surface)] p-6 sm:p-7">
        <div className="mb-4 flex items-center gap-3"><ShieldCheck className="text-[var(--ff-primary)]" size={21}/><h2 className="text-[17px] font-semibold">Invitation history</h2></div>
        {invitations.isPending?<Skeleton className="h-28 w-full"/>:invitations.isError?<InlineAlert tone="error">Could not load invitations.</InlineAlert>:<div className="divide-y divide-[var(--ff-border-faint)]">
          {invitations.data.invitations.map(i=><div key={i.id} className="flex flex-wrap items-center justify-between gap-3 py-4">
            <div><p className="break-all text-[13px] font-semibold">{i.email}</p><p className="mt-1 text-[12px] text-[var(--ff-muted)]">{i.role} · {i.status} · Delivery {i.deliveryStatus}</p></div>
            {i.status==='PENDING'&&<div className="flex gap-2"><Button variant="secondary" size="sm" disabled={action.isPending} onClick={()=>execute(`/${workspaceId}/invitations/${i.id}/resend`,{method:'POST'})}>Resend</Button>
              <Button variant="ghost" size="sm" disabled={action.isPending} onClick={()=>execute(`/${workspaceId}/invitations/${i.id}/cancel`,{method:'POST'})}>Cancel</Button></div>}
          </div>)}
          {!invitations.data.invitations.length&&<p className="text-[13px] text-[var(--ff-muted)]">No invitations yet.</p>}
        </div>}
      </section>}
    </div>
  </WorkspaceShell>;
}
export function WorkspaceMembers(props){return <QueryProvider><MembersContent {...props}/></QueryProvider>;}
