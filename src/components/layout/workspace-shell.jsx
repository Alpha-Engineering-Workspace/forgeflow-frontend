"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { ArrowUpRight, ChevronDown, CircleHelp, FolderKanban, LayoutGrid, ListTodo, LogOut, Menu, Settings2, X } from "lucide-react";

const futureNavigation = [
  { label: "Projects", icon: FolderKanban },
  { label: "Issues", icon: ListTodo },
  { label: "Board", icon: LayoutGrid },
];

function Brand() {
  return (
    <Link href="/dashboard" className="inline-flex min-h-11 items-center gap-3 rounded-lg text-white" aria-label="ForgeFlow dashboard">
      <span className="ff-brand-mark" aria-hidden="true"><span /><span /></span>
      <span className="text-xl font-semibold tracking-tight">ForgeFlow</span>
    </Link>
  );
}

function SidebarContent({ onNavigate, workspaces = [], selectedWorkspace }) {
  return (
    <div className="flex h-full flex-col px-5 py-6 text-slate-100">
      <Brand />
      <div className="mt-10 rounded-xl border border-white/10 bg-white/5 px-3.5 py-3.5" aria-label="Workspace status">
        <p className="text-[10px] font-bold tracking-[.15em] text-slate-400 uppercase">Current workspace</p>
        <p className="mt-2 truncate text-sm font-semibold">{selectedWorkspace?.name || (workspaces.length ? 'Choose a workspace' : 'No workspace yet')}</p>
        <p className="mt-1 text-xs leading-5 text-slate-400">{selectedWorkspace ? `${selectedWorkspace.role} access` : 'Your private team spaces'}</p>
        {workspaces.length > 0 && <div className="mt-3 space-y-1 border-t border-white/10 pt-2">
          {workspaces.map((space) => <Link key={space.id} href={`/w/${space.id}`} onClick={onNavigate}
            aria-current={selectedWorkspace?.id === space.id ? 'page' : undefined}
            className={`block min-h-10 truncate rounded-lg px-2 py-2.5 text-xs hover:bg-white/10 ${selectedWorkspace?.id === space.id ? 'bg-white/15 text-white' : 'text-slate-300'}`}>{space.name}</Link>)}
        </div>}
      </div>
      <nav className="mt-9 space-y-1" aria-label="Main navigation">
        <p className="mb-3 px-3 text-[10px] font-bold tracking-[.18em] text-slate-500 uppercase">Workspace</p>
        <Link href="/dashboard" onClick={onNavigate} aria-current={!selectedWorkspace ? 'page' : undefined} className={`flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-semibold text-white ${!selectedWorkspace ? 'bg-blue-600' : 'hover:bg-white/10'}`}>
          <LayoutGrid size={18} aria-hidden="true" /> Overview
        </Link>
        {futureNavigation.map(({ label, icon: Icon }) => (
          <span key={label} aria-disabled="true" className="flex min-h-11 items-center gap-3 px-3 text-sm text-slate-500">
            <Icon size={18} aria-hidden="true" /><span className="flex-1">{label}</span><span className="text-[10px] font-medium">Soon</span>
          </span>
        ))}
      </nav>
      <div className="mt-auto border-t border-white/10 pt-5">
        <span aria-disabled="true" className="flex min-h-11 items-center gap-3 px-3 text-sm text-slate-500"><Settings2 size={18} aria-hidden="true" /> Settings <span className="ml-auto text-[10px]">Soon</span></span>
        <Link href="/" className="mt-3 flex min-h-11 items-center gap-3 rounded-lg px-3 text-xs text-slate-300 hover:bg-white/10" onClick={onNavigate}>
          <ArrowUpRight size={17} aria-hidden="true" /> Visit public website
        </Link>
        <p className="mt-5 px-3 text-[11px] text-slate-500">ForgeFlow · Core MVP in progress</p>
      </div>
    </div>
  );
}

function AccountMenu({ user, signOutAction }) {
  const detailsRef = useRef(null);
  const summaryRef = useRef(null);

  useEffect(() => {
    function handlePointer(event) {
      if (!detailsRef.current?.contains(event.target)) detailsRef.current?.removeAttribute("open");
    }
    function handleKey(event) {
      if (event.key === "Escape" && detailsRef.current?.open) {
        event.preventDefault();
        detailsRef.current.open = false;
        summaryRef.current?.focus();
      }
    }
    document.addEventListener("pointerdown", handlePointer);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("pointerdown", handlePointer);
      document.removeEventListener("keydown", handleKey);
    };
  }, []);

  const initial = (user?.name || user?.email || "U").trim().slice(0, 1).toUpperCase();
  return (
    <details ref={detailsRef} className="relative shrink-0">
      <summary ref={summaryRef} className="flex min-h-11 cursor-pointer list-none items-center gap-2 rounded-xl border border-[var(--ff-border)] bg-white px-2.5 py-1.5 text-left hover:bg-[var(--ff-surface-soft)] [&::-webkit-details-marker]:hidden" aria-label="Account menu">
        <span aria-hidden="true" className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--ff-sidebar)] text-sm font-bold text-white">{initial}</span>
        <span className="hidden max-w-36 truncate text-sm font-semibold sm:inline">{user?.name || "My account"}</span>
        <ChevronDown size={15} className="text-[var(--ff-muted)]" aria-hidden="true" />
      </summary>
      <div className="absolute right-0 z-50 mt-2 w-[min(85vw,270px)] rounded-xl border border-[var(--ff-border)] bg-[var(--ff-surface)] p-2 shadow-xl">
        <div className="border-b border-[var(--ff-border)] px-3 py-3">
          <p className="truncate text-sm font-semibold">{user?.name || "Signed in"}</p>
          <p className="mt-1 break-all text-xs text-[var(--ff-muted)]">{user?.email}</p>
        </div>
        <form action={signOutAction} className="pt-2">
          <button type="submit" className="flex min-h-11 w-full items-center gap-3 rounded-lg px-3 text-sm font-semibold text-[var(--ff-text)] hover:bg-[var(--ff-surface-soft)]">
            <LogOut size={17} aria-hidden="true" /> Sign out
          </button>
        </form>
      </div>
    </details>
  );
}

export function WorkspaceShell({ user, signOutAction, children, workspaces = [], selectedWorkspace = null }) {
  const drawerRef = useRef(null);
  const openButtonRef = useRef(null);
  function closeDrawer() { if (drawerRef.current?.open) drawerRef.current.close(); }

  return (
    <div className="min-h-dvh bg-[var(--ff-bg)] text-[var(--ff-text)] lg:pl-[232px]">
      <aside className="fixed inset-y-0 left-0 hidden w-[232px] bg-[var(--ff-sidebar)] lg:block">
        <SidebarContent workspaces={workspaces} selectedWorkspace={selectedWorkspace} />
      </aside>
      <dialog
        ref={drawerRef}
        aria-label="Mobile navigation"
        onClose={() => openButtonRef.current?.focus()}
        onClick={(event) => { if (event.target === drawerRef.current) closeDrawer(); }}
        className="fixed inset-0 m-0 h-dvh max-h-dvh w-[min(86vw,310px)] max-w-[310px] bg-[var(--ff-sidebar)] p-0 text-white shadow-2xl backdrop:bg-slate-950/60 open:flex lg:hidden"
      >
        <div className="h-full w-full overflow-y-auto">
          <button type="button" aria-label="Close navigation" onClick={closeDrawer} className="absolute top-5 right-3 z-10 flex h-11 w-11 items-center justify-center rounded-lg text-slate-300 hover:bg-white/10"><X size={20} aria-hidden="true" /></button>
          <SidebarContent onNavigate={closeDrawer} workspaces={workspaces} selectedWorkspace={selectedWorkspace} />
        </div>
      </dialog>
      <header className="sticky top-0 z-20 flex min-h-16 items-center justify-between gap-3 border-b border-[var(--ff-border)] bg-[var(--ff-surface)] px-4 sm:px-7">
        <div className="flex min-w-0 items-center gap-3">
          <button type="button" ref={openButtonRef} onClick={() => drawerRef.current?.showModal()} aria-label="Open navigation" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-[var(--ff-border)] lg:hidden"><Menu size={21} aria-hidden="true" /></button>
          <div className="min-w-0">
            <p className="hidden text-[11px] font-medium text-[var(--ff-muted)] sm:block">Workspace / {selectedWorkspace ? selectedWorkspace.name : "Overview"}</p>
            <p className="truncate text-sm font-semibold">{selectedWorkspace?.name || "Overview"}</p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2 sm:gap-4">
          <span className="hidden items-center gap-1.5 text-xs text-[var(--ff-muted)] md:inline-flex"><CircleHelp size={15} aria-hidden="true" /> Workspace access secured</span>
          <AccountMenu user={user} signOutAction={signOutAction} />
        </div>
      </header>
      <main id="main-content" className="min-h-[calc(100dvh-4rem)]">{children}</main>
    </div>
  );
}
