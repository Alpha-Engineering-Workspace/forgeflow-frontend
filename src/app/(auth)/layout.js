import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Check, GitBranch, Layers3 } from "lucide-react";

// This layout is shared by all public authentication routes.
// It does not fetch user data, tokens, or protected workspace resources.
export default function AuthLayout({ children }) {
  return (
    <div className="ff-auth-page min-h-dvh lg:grid lg:grid-cols-[minmax(0,1.05fr)_minmax(440px,0.95fr)]">
      <aside className="ff-auth-story relative hidden min-h-dvh flex-col justify-between overflow-hidden bg-[var(--ff-sidebar)] p-10 text-white lg:flex xl:p-14">
        <Link href="/" className="relative z-10 inline-flex w-fit items-center gap-3" aria-label="ForgeFlow home">
          <span className="ff-brand-mark" aria-hidden="true"><span /><span /></span>
          <span className="text-xl font-semibold tracking-tight">ForgeFlow</span>
        </Link>

        <div className="relative z-10 max-w-xl pb-16">         
          <h2 className="text-[clamp(2.8rem,4.1vw,5.5rem)] leading-[1.08] font-semibold tracking-[-0.055em]">
            Clarity for<br />every moving <span className="text-cyan-300">part.</span>
          </h2>
          <p className="mt-7 max-w-md text-base leading-7 text-slate-300">
            A calmer way to turn plans into progress. Keep the work organized, the details connected, and your team in sync.
          </p>
          <div className="mt-12 max-w-md rounded-2xl border border-white/12 bg-white/5 p-5 backdrop-blur-sm">
            <div className="mb-5 flex items-center justify-between text-xs font-semibold tracking-wide text-slate-300">
              <span>MADE FOR THE FLOW OF WORK</span>
              <ArrowUpRight size={17} aria-hidden="true" />
            </div>
            <div className="grid grid-cols-[2.25rem_1fr] gap-x-4 gap-y-4">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/20 text-blue-200"><Layers3 size={18} aria-hidden="true" /></span>
              <div className="border-b border-white/10 pb-4"><p className="text-sm font-medium">Give every project a place</p><p className="mt-1 text-xs text-slate-400">A clear home for the work that matters.</p></div>
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-500/15 text-cyan-200"><GitBranch size={18} aria-hidden="true" /></span>
              <div className="border-b border-white/10 pb-4"><p className="text-sm font-medium">See how work moves</p><p className="mt-1 text-xs text-slate-400">From the first task to the finished result.</p></div>
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 text-slate-100"><Check size={18} aria-hidden="true" /></span>
              <div><p className="text-sm font-medium">Keep the next step visible</p><p className="mt-1 text-xs text-slate-400">Less noise. More momentum.</p></div>
            </div>
          </div>
        </div>
        <div className="relative z-10 flex items-center justify-between border-t border-white/10 pt-6 text-xs text-slate-400">
          <span>ForgeFlow · Work in motion</span><span>Built with intention</span>
        </div>
        <div aria-hidden="true" className="ff-auth-geometry pointer-events-none absolute inset-0" />
      </aside>

      <div className="flex min-w-0 flex-col bg-[var(--ff-bg)]">
        <header className="mx-auto flex w-full max-w-[560px] items-center justify-between px-5 pt-6 sm:px-9 sm:pt-9 lg:max-w-none lg:px-12">
          <Link href="/" aria-label="ForgeFlow home" className="inline-flex items-center gap-2.5 lg:hidden">
            <Image src="/forgeflow-logo.png" alt="ForgeFlow" width={144} height={53} className="h-auto w-36" priority />
          </Link>
          <span className="hidden text-xs font-medium tracking-wide text-[var(--ff-muted)] lg:block">YOUR WORK. IN MOTION.</span>
          <Link href="/" className="ff-text-link ml-auto inline-flex min-h-11 items-center text-sm font-medium">Back to home <ArrowUpRight className="ml-1" size={16} aria-hidden="true" /></Link>
        </header>
        <main id="main-content" className="flex flex-1 items-center justify-center px-5 py-10 sm:px-9 sm:py-14 lg:px-12">
          <div className="w-full max-w-[440px]">{children}</div>
        </main>
        <footer className="px-5 pb-7 text-center text-xs leading-5 text-[var(--ff-muted)] sm:px-9">
          Secure sign-in. Your workspace is yours to build.
        </footer>
      </div>
    </div>
  );
}
