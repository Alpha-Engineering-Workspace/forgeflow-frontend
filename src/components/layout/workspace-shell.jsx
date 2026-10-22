"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowUpRight,
  ChevronDown,
  ChevronsUpDown,
  FolderKanban,
  LayoutGrid,
  ListTodo,
  LogOut,
  Menu,
  Settings2,
  X,
} from "lucide-react";
import { BrandMark } from "@/components/brand/brand-mark";


function Sidebar({ onNavigate, workspaces = [], selectedWorkspace, user }) {
  const pathname = usePathname();
  const isActiveWorkspace = (id) => selectedWorkspace?.id === id;
  const isOnOverview = pathname === "/dashboard";

  return (
    <div className="ff-rail flex h-full flex-col text-[var(--ff-on-dark)]">
      {/* Brand */}
      <div className="flex h-16 items-center justify-between border-b border-[var(--ff-dark-border)] px-5">
        <Link href="/dashboard" className="group inline-flex items-center gap-3" aria-label="ForgeFlow dashboard">
          <BrandMark size={28} />
          <span className="text-[15.5px] font-semibold tracking-[-0.025em] text-white">ForgeFlow</span>
        </Link>

      </div>

      {/* Workspace switcher pill */}
      <div className="px-3 pt-4">
        <Link href="/dashboard" onClick={onNavigate}
          className="flex min-h-11 items-center gap-2.5 rounded-[10px] border border-[var(--ff-dark-border)] bg-white/[0.04] p-2.5 transition-colors hover:border-[var(--ff-dark-border-strong)] hover:bg-white/[0.06]"
          aria-label="Choose a workspace"
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[8px] bg-gradient-to-br from-[#3B82F6] to-[#06B6D4] text-[12px] font-bold text-white shadow-[0_4px_12px_-4px_rgba(59,130,246,0.6)]">
            {(selectedWorkspace?.name || user?.name || "F").trim().slice(0, 1).toUpperCase()}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-semibold text-white">
              {selectedWorkspace?.name || (workspaces.length ? "Select workspace" : "No workspace")}
            </p>
            <p className="truncate text-[11px] text-white/45">
              {selectedWorkspace ? selectedWorkspace.role.toLowerCase() : "your private space"}
            </p>
          </div>
          <ChevronsUpDown size={14} className="shrink-0 text-white/40" aria-hidden="true" />
        </Link>
      </div>

      {/* Primary nav */}
      <nav className="mt-6 px-3" aria-label="Primary">
        <p className="mb-2 px-2 text-[10px] font-bold tracking-[0.18em] text-white/35 uppercase">
          Workspace
        </p>
        <div className="space-y-0.5">
          <Link href="/dashboard" onClick={onNavigate} data-active={isOnOverview}
            aria-current={isOnOverview ? "page" : undefined} className="ff-nav-item">
            <LayoutGrid size={16} aria-hidden="true"/><span className="flex-1">Workspaces</span>
          </Link>
          {selectedWorkspace ? (
            <>
              <Link href={`/w/${selectedWorkspace.id}`} onClick={onNavigate} data-active={pathname === `/w/${selectedWorkspace.id}`}
                aria-current={pathname === `/w/${selectedWorkspace.id}` ? "page" : undefined} className="ff-nav-item">
                <LayoutGrid size={16} aria-hidden="true"/><span className="flex-1">Dashboard</span>
              </Link>
              <Link href={`/w/${selectedWorkspace.id}/projects`} onClick={onNavigate}
                data-active={pathname.startsWith(`/w/${selectedWorkspace.id}/projects`)} className="ff-nav-item">
                <FolderKanban size={16} aria-hidden="true"/><span className="flex-1">Projects</span>
              </Link>
              <Link href={`/w/${selectedWorkspace.id}/issues`} onClick={onNavigate}
                data-active={pathname.startsWith(`/w/${selectedWorkspace.id}/issues`)} className="ff-nav-item">
                <ListTodo size={16} aria-hidden="true"/><span className="flex-1">Issues</span>
              </Link>
              <Link href={`/w/${selectedWorkspace.id}/settings/members`} onClick={onNavigate}
                data-active={pathname.startsWith(`/w/${selectedWorkspace.id}/settings`)} className="ff-nav-item">
                <Settings2 size={16} aria-hidden="true"/><span className="flex-1">Members</span>
              </Link>
            </>
          ) : <div className="ff-nav-item cursor-not-allowed opacity-50" aria-disabled="true">
            <FolderKanban size={16} aria-hidden="true"/><span className="flex-1">Projects</span>
            <span className="ff-pill-soft">Select space</span>
          </div>}
        </div>
      </nav>

      {/* Workspaces list (compact pills) */}
      {workspaces.length > 0 && (
        <div className="mt-6 px-3">
          <div className="mb-2 flex items-center justify-between px-2">
            <p className="text-[10px] font-bold tracking-[0.18em] text-white/35 uppercase">Your spaces</p>
            <span className="text-[10.5px] font-semibold text-white/35">{workspaces.length}</span>
          </div>
          <ul className="space-y-0.5">
            {workspaces.slice(0, 6).map((space) => {
              const active = isActiveWorkspace(space.id);
              return (
                <li key={space.id}>
                  <Link
                    href={`/w/${space.id}`}
                    onClick={onNavigate}
                    data-active={active}
                    aria-current={active ? "page" : undefined}
                    className="ff-nav-item"
                  >
                    <span
                      className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md text-[10px] font-bold"
                      style={{
                        background: active
                          ? "linear-gradient(135deg, #3B82F6, #06B6D4)"
                          : "rgba(255,255,255,0.08)",
                        color: active ? "#fff" : "rgba(255,255,255,0.65)",
                      }}
                      aria-hidden="true"
                    >
                      {space.name.trim().slice(0, 1).toUpperCase()}
                    </span>
                    <span className="flex-1 truncate">{space.name}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <div className="mt-auto px-3 pb-4">
        <div className="mb-3 h-px bg-white/5" />
        <Link
          href="/"
          onClick={onNavigate}
          className="ff-nav-item text-white/45 hover:text-white"
        >
          <ArrowUpRight size={15} aria-hidden="true" />
          <span className="flex-1">Public site</span>
        </Link>
        <div className="mt-3 flex items-center gap-2 px-2 pt-2 text-[10.5px] tracking-wide text-white/30">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(74,222,128,0.5)]" aria-hidden="true" />
          <span>ForgeFlow · project operations</span>
        </div>
      </div>
    </div>
  );
}

function Topbar({ user, signOutAction, selectedWorkspace, onOpenDrawer }) {
  return (
    <header
      className="sticky top-0 z-20 flex h-16 items-center justify-between gap-3 border-b border-[var(--ff-border-faint)] bg-[var(--ff-surface)]/80 px-4 backdrop-blur-md supports-[backdrop-filter]:bg-[var(--ff-surface)]/70 sm:px-7"
    >
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={onOpenDrawer}
          aria-label="Open navigation"
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] border border-[var(--ff-border)] bg-[var(--ff-surface)] text-[var(--ff-text)] transition-colors hover:bg-[var(--ff-surface-2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ff-focus)] lg:hidden"
        >
          <Menu size={19} aria-hidden="true" />
        </button>

        <div className="hidden min-w-0 sm:block">
          <p className="text-[11px] uppercase tracking-[.14em] text-[var(--ff-muted)]">Workspace operations</p>
          <p className="truncate text-[14px] font-semibold text-[var(--ff-text-strong)]">{selectedWorkspace?.name || "Your workspaces"}</p>
        </div>
        {/* Mobile breadcrumb */}
        <div className="min-w-0 sm:hidden">
          <p className="truncate text-[14px] font-semibold tracking-[-0.01em] text-[var(--ff-text-strong)]">
            {selectedWorkspace?.name || "Overview"}
          </p>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
        <AccountMenu user={user} signOutAction={signOutAction} />
      </div>
    </header>
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
      <summary
        ref={summaryRef}
        className="flex h-10 cursor-pointer list-none items-center gap-2 rounded-[10px] border border-[var(--ff-border-faint)] bg-[var(--ff-surface)] pl-1.5 pr-2.5 text-left transition-colors hover:border-[var(--ff-border)] hover:bg-[var(--ff-surface-2)] [&::-webkit-details-marker]:hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ff-focus)]"
        aria-label="Account menu"
      >
        <span
          aria-hidden="true"
          className="flex h-7 w-7 items-center justify-center rounded-[8px] bg-gradient-to-br from-[#2563EB] to-[#06B6D4] text-[12px] font-bold text-white shadow-[0_4px_12px_-4px_rgba(37,99,235,0.5)]"
        >
          {initial}
        </span>
        <ChevronDown size={13} className="text-[var(--ff-muted)]" aria-hidden="true" />
      </summary>
      <div className="absolute right-0 z-50 mt-2 w-[min(86vw,280px)] overflow-hidden rounded-[12px] border border-[var(--ff-border-faint)] bg-[var(--ff-surface)] shadow-[var(--ff-shadow-xl)]">
        <div className="border-b border-[var(--ff-border-faint)] px-4 py-3.5">
          <p className="truncate text-[13.5px] font-semibold tracking-[-0.005em] text-[var(--ff-text-strong)]">
            {user?.name || "Signed in"}
          </p>
          <p className="mt-1 break-all text-[11.5px] text-[var(--ff-muted)]">{user?.email}</p>
        </div>
        <form action={signOutAction} className="p-1.5">
          <button
            type="submit"
            className="flex h-10 w-full items-center gap-3 rounded-[8px] px-3 text-[13px] font-semibold text-[var(--ff-text)] transition-colors hover:bg-[var(--ff-surface-2)]"
          >
            <LogOut size={15} aria-hidden="true" /> Sign out
          </button>
        </form>
      </div>
    </details>
  );
}

export function WorkspaceShell({ user, signOutAction, children, workspaces = [], selectedWorkspace = null }) {
  const drawerRef = useRef(null);
  const openButtonRef = useRef(null);
  function closeDrawer() {
    if (drawerRef.current?.open) drawerRef.current.close();
  }
  function openDrawer() {
    drawerRef.current?.showModal();
  }

  return (
    <div data-theme="dark" className="min-h-dvh bg-[var(--ff-bg)] text-[var(--ff-text)]">
      <aside className="ff-rail fixed inset-y-0 left-0 hidden w-[var(--ff-sidebar-w)] lg:block">
        <Sidebar
          user={user}
          workspaces={workspaces}
          selectedWorkspace={selectedWorkspace}
        />
      </aside>
      <dialog
        ref={drawerRef}
        aria-label="Mobile navigation"
        onClose={() => openButtonRef.current?.focus()}
        onClick={(event) => {
          if (event.target === drawerRef.current) closeDrawer();
        }}
        className="fixed inset-0 m-0 h-dvh max-h-dvh w-[min(86vw,320px)] max-w-[320px] bg-[var(--ff-sidebar)] p-0 text-white shadow-[var(--ff-shadow-2xl)] backdrop:bg-slate-950/60 backdrop:backdrop-blur-sm open:flex lg:hidden"
      >
        <div className="relative h-full w-full overflow-y-auto">
          <button
            type="button"
            aria-label="Close navigation"
            onClick={closeDrawer}
            className="absolute top-4 right-3 z-10 inline-flex h-10 w-10 items-center justify-center rounded-[10px] text-slate-300 transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
          >
            <X size={18} aria-hidden="true" />
          </button>
          <Sidebar
            user={user}
            workspaces={workspaces}
            selectedWorkspace={selectedWorkspace}
            onNavigate={closeDrawer}
          />
        </div>
      </dialog>
      <div className="lg:pl-[var(--ff-sidebar-w)]">
        <Topbar
          user={user}
          signOutAction={signOutAction}
          selectedWorkspace={selectedWorkspace}
          onOpenDrawer={openDrawer}
          openButtonRef={openButtonRef}
        />
        <main id="main-content" className="min-h-[calc(100dvh-4rem)]">
          {children}
        </main>
      </div>
    </div>
  );
}
