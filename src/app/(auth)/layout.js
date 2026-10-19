import Link from "next/link";
import { ArrowUpRight, Check, Command, Search } from "lucide-react";
import { BrandMark } from "@/components/brand/brand-mark";

// Product preview mock. Purely decorative. No real data is fabricated.
function AuthPreviewMock() {
  return (
    <div className="ff-auth-preview" aria-hidden="true">
      <div className="ff-auth-preview-header">
        <span className="ff-auth-preview-dot" />
        <span className="ff-auth-preview-dot" />
        <span className="ff-auth-preview-dot" />
        <span style={{ marginLeft: 8, fontSize: 11, color: "rgba(231,238,251,0.55)", letterSpacing: "0.08em", textTransform: "uppercase", fontWeight: 600 }}>
          Workspace
        </span>
      </div>
      <div className="ff-auth-preview-body">
        <div className="ff-auth-preview-rail">
          <span /><span /><span /><span />
        </div>
        <div className="ff-auth-preview-canvas">
          <div className="ff-auth-preview-card">
            <div className="ff-auth-preview-row">
              <span className="ff-auth-preview-bar b1" style={{ width: 100 }} />
              <span className="ff-auth-preview-pill">Active</span>
            </div>
            <div style={{ marginTop: 10 }}>
              <span className="ff-auth-preview-bar b2" style={{ width: "60%" }} />
            </div>
            <div style={{ marginTop: 6 }}>
              <span className="ff-auth-preview-bar b3" style={{ width: "85%" }} />
            </div>
          </div>
          <div className="ff-auth-preview-card" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
            <div>
              <span className="ff-auth-preview-bar b1" style={{ width: "70%" }} />
              <div style={{ marginTop: 8 }}><span className="ff-auth-preview-bar b2" style={{ width: "100%" }} /></div>
              <div style={{ marginTop: 6 }}><span className="ff-auth-preview-bar b2" style={{ width: "50%" }} /></div>
            </div>
            <div>
              <span className="ff-auth-preview-bar b1" style={{ width: "55%" }} />
              <div style={{ marginTop: 8 }}><span className="ff-auth-preview-bar b2" style={{ width: "100%" }} /></div>
              <div style={{ marginTop: 6 }}><span className="ff-auth-preview-bar b2" style={{ width: "75%" }} /></div>
            </div>
            <div>
              <span className="ff-auth-preview-bar b1" style={{ width: "85%" }} />
              <div style={{ marginTop: 8 }}><span className="ff-auth-preview-bar b2" style={{ width: "100%" }} /></div>
              <div style={{ marginTop: 6 }}><span className="ff-auth-preview-bar b2" style={{ width: "40%" }} /></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AuthLayout({ children }) {
  return (
    <div className="ff-auth-page h-dvh overflow-hidden lg:grid lg:grid-cols-[1.15fr_1fr] xl:grid-cols-[1.25fr_1fr]">
      {/* ===== Dark editorial stage (left) ===== */}
      <aside className="ff-auth-stage relative hidden h-dvh flex-col justify-between overflow-hidden p-8 lg:flex lg:p-10 xl:p-12">
        <div aria-hidden="true" className="ff-auth-glow-top" />
        <div aria-hidden="true" className="ff-auth-rings" />

        {/* Brand */}
        <header className="relative z-10 flex items-center justify-between">
          <Link href="/" className="group inline-flex items-center gap-3" aria-label="ForgeFlow home">
            <BrandMark size={32} glow />
            <span className="text-[17px] font-semibold tracking-[-0.025em] text-white">ForgeFlow</span>
          </Link>
          <span className="hidden text-[10.5px] font-semibold tracking-[0.18em] text-white/40 uppercase md:inline">
            Work in motion
          </span>
        </header>

        {/* Hero */}
        <div className="relative z-10 max-w-[560px]">
          <h1 className="text-[clamp(2.25rem,4.2vw,4rem)] leading-[1.02] font-semibold tracking-[-0.05em]">
            The operating layer<br />
            for <span className="ff-gradient-text-shine">modern teams.</span>
          </h1>
          <p className="mt-5 max-w-md text-[14.5px] leading-[1.6] text-white/65">
            One calm surface for projects, conversations, and customer work,
            designed to keep the next step visible and the noise out.
          </p>

          <ul className="mt-8 grid gap-3 text-[13.5px] text-white/80">
            <li className="flex items-start gap-3">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border border-cyan-400/30 bg-cyan-500/15 text-cyan-200">
                <Check size={12} strokeWidth={3} aria-hidden="true" />
              </span>
              <span>Workspaces that keep every team separate, automatically.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border border-cyan-400/30 bg-cyan-500/15 text-cyan-200">
                <Check size={12} strokeWidth={3} aria-hidden="true" />
              </span>
              <span>Built on Auth.js. Your credentials never leave the server.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border border-cyan-400/30 bg-cyan-500/15 text-cyan-200">
                <Check size={12} strokeWidth={3} aria-hidden="true" />
              </span>
              <span>Keyboard-first. Every action is a keystroke away.</span>
            </li>
          </ul>
        </div>

        {/* Product preview mock + footer */}
        <div className="relative z-10 space-y-4">
          <AuthPreviewMock />
          <div className="flex items-center justify-end text-[11px] tracking-wide text-white/40">
            <span className="hidden items-center gap-1.5 md:flex">
              <Command size={11} aria-hidden="true" /> + K to command
            </span>
          </div>
        </div>
      </aside>

      {/* ===== Form side (right) ===== */}
      <div className="relative flex h-dvh min-w-0 flex-col overflow-hidden bg-[var(--ff-bg)] lg:h-auto">
        {/* Mobile-only top bar */}
        <header className="flex shrink-0 items-center justify-between px-5 pt-5 sm:px-9 sm:pt-7 lg:hidden">
          <Link href="/" className="inline-flex items-center gap-2.5" aria-label="ForgeFlow home">
            <BrandMark size={26} />
            <span className="text-[15px] font-semibold tracking-[-0.025em] text-[var(--ff-text-strong)]">ForgeFlow</span>
          </Link>
          <Link href="/" className="ff-text-link inline-flex min-h-11 items-center gap-1 text-[13px] font-semibold">
            Back to home <ArrowUpRight size={14} aria-hidden="true" />
          </Link>
        </header>

        {/* Desktop top utility row */}
        <div className="hidden shrink-0 items-center justify-between px-10 pt-9 lg:flex xl:px-16">
          <div className="inline-flex h-9 items-center gap-2 rounded-full border border-[var(--ff-border)] bg-[var(--ff-surface)] px-3.5 text-[12px] text-[var(--ff-muted)] shadow-[var(--ff-shadow-xs)]">
            <Search size={13} aria-hidden="true" />
            <span>Quick find</span>
            <span className="ml-2 inline-flex items-center gap-0.5 rounded border border-[var(--ff-border-faint)] bg-[var(--ff-surface-2)] px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-[var(--ff-muted)]">
              <Command size={9} aria-hidden="true" /> K
            </span>
          </div>
          <Link href="/" className="ff-text-link inline-flex min-h-11 items-center gap-1 text-[13px] font-semibold">
            Back to home <ArrowUpRight size={14} aria-hidden="true" />
          </Link>
        </div>

        <main
          id="main-content"
          className="flex min-h-0 flex-1 items-center justify-center overflow-hidden px-5 py-5 sm:px-9 sm:py-6 lg:px-10 lg:py-8 xl:px-16"
        >
          <div className="w-full max-w-[440px]">
            <div className="rounded-[var(--ff-radius-2xl)] border border-[var(--ff-border-faint)] bg-[var(--ff-surface)] p-6 shadow-[var(--ff-shadow-lg)] sm:p-8">
              {children}
            </div>
            <p className="mt-4 text-center text-[12px] leading-[1.6] text-[var(--ff-muted)]">
              Your account lives in your workspace, not in a vendor silo.
            </p>
          </div>
        </main>

        <footer className="hidden shrink-0 border-t border-[var(--ff-border-faint)] px-10 py-4 text-[11.5px] text-[var(--ff-muted)] lg:flex lg:items-center lg:justify-between xl:px-16">
          <span>© ForgeFlow</span>
          <span className="flex items-center gap-2 text-[var(--ff-muted-soft)]">
            <span className="inline-block h-1 w-1 rounded-full bg-emerald-500" aria-hidden="true" /> Encrypted session
          </span>
        </footer>
      </div>
    </div>
  );
}
