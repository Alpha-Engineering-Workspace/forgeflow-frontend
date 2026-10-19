'use client';
import { useState, useSyncExternalStore } from "react";
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { BrandMark } from '@/components/brand/brand-mark';
import { Button } from '@/components/ui/button';
import { InlineAlert } from '@/components/ui/inline-alert';
function subscribeToHashChange(notify) {
  window.addEventListener("hashchange", notify);
  window.addEventListener("popstate", notify);

  return () => {
    window.removeEventListener("hashchange", notify);
    window.removeEventListener("popstate", notify);
  };
}

function getTokenFromHash() {
  const value = new URLSearchParams(
    window.location.hash.slice(1)
  ).get("token");

  return value && /^[A-Za-z0-9_-]{43}$/.test(value)
    ? value
    : "";
}

function getServerToken() {
  return null;
}

export function InviteAcceptance() {
  const token = useSyncExternalStore(
    subscribeToHashChange,
    getTokenFromHash,
    getServerToken
  );

  const [error, setError] = useState("");
  const [success, setSuccess] = useState(null);
  const [busy, setBusy] = useState(false);

  const router = useRouter();


  async function accept(){
    if(!token||busy)return;setBusy(true);setError('');
    try {
      const r=await fetch('/api/backend/workspaces/invitations/accept',{method:'POST',cache:'no-store',headers:{'content-type':'application/json'},body:JSON.stringify({token})});
      const data=await r.json().catch(()=>({}));
      if(!r.ok)throw new Error(r.status===401?'Please sign in with the invited, verified email. Open Sign in in another tab, then return here.':data.error?.message||'Invitation could not be accepted.');
      window.history.replaceState(null,'',window.location.pathname); // Consume secret in browser address bar.
      setSuccess(data.membership);
    } catch(e){setError(e.message);}finally{setBusy(false);}
  }
  return <main className="flex min-h-dvh items-center justify-center bg-[var(--ff-bg)] px-4 py-12">
    <section className="ff-panel w-full max-w-lg rounded-[var(--ff-radius-xl)] border border-[var(--ff-border)] bg-[var(--ff-surface)] p-6 shadow-[var(--ff-shadow-md)] sm:p-9">
      <div className="mb-5 flex items-center gap-3"><BrandMark size={32}/><span className="text-[16px] font-bold">ForgeFlow</span></div>
      <h1 className="text-[26px] font-semibold tracking-tight">Workspace invitation</h1>
      <p className="mt-3 text-[14px] leading-7 text-[var(--ff-muted)]">Sign in with the email address that received this invitation. If you need an account, register and verify that email first.</p>
      <div className="mt-5 flex flex-wrap gap-3 text-[13px]"><Link className="ff-text-link inline-flex min-h-11 items-center" href="/login" target="_blank" rel="noopener noreferrer">Sign in in a new tab ↗</Link><Link className="ff-text-link inline-flex min-h-11 items-center" href="/register" target="_blank" rel="noopener noreferrer">Register in a new tab ↗</Link></div>
      {token===null?<p role="status" className="mt-5 text-[13px]">Loading invitation…</p>:!token?<div className="mt-5"><InlineAlert tone="error">Missing or invalid invitation token. Open the original email link.</InlineAlert></div>:null}
      {error&&<div className="mt-5"><InlineAlert tone="error">{error}</InlineAlert></div>}
      {success?<div className="mt-5 space-y-4"><InlineAlert tone="success">Invitation accepted. Workspace access is now active.</InlineAlert><Button onClick={()=>router.replace(`/w/${success.workspaceId}`)}>Open workspace</Button></div>:
        <Button className="mt-6 w-full" onClick={accept} disabled={!token||busy}>{busy?'Accepting…':'Accept invitation'}</Button>}
    </section>
  </main>;
}
