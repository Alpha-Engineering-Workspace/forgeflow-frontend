"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FolderKanban, LayoutDashboard, ListTodo, Menu, X, Info, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";

const navigation = [
  { href: "/preview", label: "Overview", icon: LayoutDashboard },
  { href: "/preview/projects", label: "Projects", icon: FolderKanban },
  { href: "/preview/issues", label: "Issues", icon: ListTodo },
];

function Sidebar({ onNavigate }) {
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col bg-[var(--ff-sidebar)] px-4 py-6 text-[var(--ff-sidebar-text,#E6EDF8)]">
      <Link href="/" onClick={onNavigate} className="mb-10 flex items-center gap-3 rounded-lg px-3" aria-label="ForgeFlow home">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-cyan-400 text-xl font-bold text-white">F</span>
        <span className="text-xl font-semibold tracking-tight">ForgeFlow</span>
      </Link>
      <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-widest text-slate-400">Workspace preview</p>
      <nav aria-label="Preview navigation" className="space-y-1">
        {navigation.map(({ href, label, icon: Icon }) => {
          const active = href === "/preview" ? pathname === href : pathname.startsWith(href);
          return (
            <Link key={href} href={href} onClick={onNavigate} aria-current={active ? "page" : undefined}
              className={`flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium ${active ? "bg-blue-600 text-white" : "text-slate-300 hover:bg-slate-800 hover:text-white"}`}>
              <Icon size={19} aria-hidden="true" />{label}
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto space-y-3 border-t border-slate-700 pt-5">
        <p className="px-3 text-xs leading-5 text-slate-400">Static UI preview. No login or live data yet.</p>
        <Link href="/" className="flex items-center gap-2 px-3 text-sm text-slate-300 hover:text-white" onClick={onNavigate}>
          <ArrowLeft size={17} aria-hidden="true" /> Public site
        </Link>
      </div>
    </div>
  );
}

export default function AppShell({ children }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[var(--ff-bg)] text-[var(--ff-text)] md:pl-60">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 md:block"><Sidebar /></aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button className="absolute inset-0 bg-black/60" aria-label="Close navigation" onClick={() => setMobileOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-[min(85vw,280px)] shadow-xl">
            <div className="absolute right-2 top-2 z-10">
              <button onClick={() => setMobileOpen(false)} aria-label="Close menu" className="rounded-lg p-2 text-white"><X size={20}/></button>
            </div>
            <Sidebar onNavigate={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}

      <header className="sticky top-0 z-20 flex min-h-16 items-center justify-between border-b border-[var(--ff-border)] bg-[var(--ff-surface)] px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <button className="rounded-lg p-2 hover:bg-[var(--ff-surface-soft)] md:hidden" onClick={() => setMobileOpen(true)} aria-label="Open menu"><Menu size={22}/></button>
          <div>
            <p className="text-sm font-semibold">ForgeFlow workspace</p>
            <p className="text-xs text-[var(--ff-muted)]">UI demonstration</p>
          </div>
        </div>
        <Button variant="secondary" onClick={() => setInfoOpen(true)}><Info size={16} aria-hidden="true"/><span className="hidden sm:inline">About preview</span></Button>
      </header>
      <main id="main-content" className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">{children}</main>
      <Dialog open={infoOpen} onClose={() => setInfoOpen(false)} title="About this preview">
        <p className="text-sm leading-7 text-[var(--ff-muted)]">This is the Phase 1B design shell. Authentication, persistent projects, APIs, and permissions will be added in subsequent milestones.</p>
      </Dialog>
    </div>
  );
}
