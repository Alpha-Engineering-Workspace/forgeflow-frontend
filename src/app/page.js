import Link from 'next/link';
import { ArrowRight, ArrowUpRight, CheckCircle2, FolderKanban, Layers3, ShieldCheck, Users, Workflow } from 'lucide-react';
import { BrandMark } from '@/components/brand/brand-mark';

const features = [
  { icon: Layers3, eyebrow: '01 · Organize', title: 'Projects with a clear owner',
    description: 'Create workspaces, organize delivery into projects and keep each team’s data in its own space.' },
  { icon: Workflow, eyebrow: '02 · Deliver', title: 'Work that actually moves',
    description: 'Track issues across a four-stage Kanban board. Move, reorder and refresh without losing position.' },
  { icon: Users, eyebrow: '03 · Collaborate', title: 'Invite the right people',
    description: 'Send email invitations, manage workspace roles and protect the work behind authenticated access.' },
];

export default function Home() {
  return <main className="min-h-dvh bg-[#080d1c] text-[#f4f7ff]">
    <div className="relative isolate overflow-hidden ff-m9-hero">
      <div className="pointer-events-none absolute -right-40 top-0 -z-10 h-[34rem] w-[34rem] rounded-full bg-indigo-600/20 blur-[100px]" aria-hidden="true"/>
      <div className="pointer-events-none absolute -left-40 top-60 -z-10 h-96 w-96 rounded-full bg-blue-600/15 blur-[100px]" aria-hidden="true"/>
      <header className="mx-auto flex max-w-[1280px] items-center justify-between gap-5 px-5 py-5 sm:px-8">
        <Link href="/" className="flex min-h-11 items-center gap-3 rounded-lg text-lg font-semibold focus-visible:outline-2 focus-visible:outline-cyan-400">
          <BrandMark size={35}/> ForgeFlow
        </Link>
        <nav aria-label="Public navigation" className="hidden items-center gap-7 text-sm text-slate-300 md:flex">
          <a className="hover:text-white" href="#features">Features</a>
          <a className="hover:text-white" href="#workflow">Workflow</a>
          <a className="hover:text-white" href="#security">Security</a>
        </nav>
        <div className="flex items-center gap-3 text-sm font-semibold">
          <Link href="/login" className="rounded-lg px-3 py-3 text-slate-200 hover:bg-white/10">Log in</Link>
          <Link href="/register" className="inline-flex min-h-11 items-center rounded-lg bg-gradient-to-r from-blue-600 to-cyan-500 px-4 text-white shadow-lg shadow-blue-950/40 hover:brightness-110">Get started <ArrowUpRight size={15} className="ml-1"/></Link>
        </div>
      </header>
      <section className="mx-auto max-w-[1280px] px-5 pb-20 pt-14 sm:px-8 sm:pt-24 lg:pb-28">
        <div className="mx-auto max-w-4xl text-center">
          <p className="mx-auto inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/[.07] px-4 py-2 text-[11px] font-bold uppercase tracking-[.2em] text-cyan-200">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-400"/> Project operations, without the noise
          </p>
          <h1 className="mt-7 text-[clamp(2.6rem,5.7vw,5.5rem)] font-semibold leading-[1.08] tracking-[-.055em]">
            Organize work.<span className="block bg-gradient-to-r from-[#a9b9ff] via-[#74e2f8] to-[#8e98ff] bg-clip-text text-transparent">Move projects forward.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-8 text-[#b4bed6] sm:text-lg">
            One connected workspace for projects, issues and teams. Build momentum with an ordered Kanban board, clear permissions and fewer handoffs.
          </p>
          <div className="mt-9 flex flex-wrap justify-center gap-3">
            <Link href="/register" className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 px-7 text-sm font-bold text-white shadow-xl shadow-blue-950/50 hover:brightness-110">Create your workspace <ArrowRight size={17}/></Link>
            <a href="#workflow" className="inline-flex min-h-12 items-center gap-2 rounded-xl border border-white/20 bg-white/[.055] px-7 text-sm font-semibold text-white hover:bg-white/10">Explore how it works</a>
          </div>
        </div>
        <div id="workflow" className="relative mx-auto mt-20 max-w-[1100px] rounded-[24px] border border-indigo-300/25 bg-[#101933] p-2 shadow-[0_40px_130px_-45px_rgba(83,66,248,.8)] sm:p-3">
          <div className="rounded-[17px] border border-white/10 bg-[#0c1328] p-5 sm:p-7">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-5">
              <div className="flex items-center gap-3"><span className="rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 p-2.5"><FolderKanban size={19}/></span>
                <div><p className="text-sm font-semibold">Project workspace</p><p className="text-xs text-slate-400">Board layout preview · illustrative</p></div></div>
              <span className="rounded-full border border-white/15 px-3 py-1.5 text-xs text-slate-300">To Do → In Progress → In Review → Done</span>
            </div>
            <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4" aria-label="Illustration of four Kanban statuses">
              {[
                {title:'To Do',accent:'from-slate-500 to-slate-400',text:'Plan the work',kind:'TASK'},
                {title:'In Progress',accent:'from-blue-600 to-cyan-400',text:'Make progress',kind:'FEATURE'},
                {title:'In Review',accent:'from-violet-700 to-fuchsia-400',text:'Review the result',kind:'BUG'},
                {title:'Done',accent:'from-emerald-700 to-teal-400',text:'Ship confidently',kind:'TASK'},
              ].map((lane) => <div key={lane.title} className="min-h-44 rounded-xl border border-white/10 bg-[#151f39] p-3">
                <div className={`h-1 rounded-full bg-gradient-to-r ${lane.accent}`}/>
                <p className="mt-4 text-xs font-semibold text-slate-200">{lane.title}</p>
                <div className="mt-4 rounded-lg border border-white/10 bg-[#1e2b48] p-3 shadow-lg shadow-black/15">
                  <p className="text-sm font-semibold text-white">{lane.text}</p>
                  <span className="mt-3 inline-block rounded-md bg-white/10 px-2 py-1 text-[10px] text-slate-300">{lane.kind}</span>
                </div>
              </div>)}
            </div>
          </div>
        </div>
      </section>
    </div>
    <section id="features" className="mx-auto max-w-[1280px] px-5 py-20 sm:px-8 sm:py-28">
      <p className="text-xs font-bold uppercase tracking-[.2em] text-cyan-300">One steady workflow</p>
      <h2 className="mt-3 max-w-2xl text-3xl font-semibold tracking-tight sm:text-4xl">Everything your team needs to move a project forward.</h2>
      <div className="mt-10 grid gap-4 md:grid-cols-3">{features.map(({icon:Icon,...feature}) => <article key={feature.eyebrow} className="rounded-2xl border border-[#273552] bg-gradient-to-b from-[#17213b] to-[#10192e] p-7">
        <span className="inline-flex rounded-xl bg-blue-500/10 p-3 text-cyan-300"><Icon size={23}/></span>
        <p className="mt-7 text-[11px] font-bold uppercase tracking-widest text-[#90b8e9]">{feature.eyebrow}</p>
        <h3 className="mt-2 text-xl font-semibold">{feature.title}</h3>
        <p className="mt-3 text-sm leading-7 text-[#acb9d2]">{feature.description}</p>
      </article>)}</div>
    </section>
    <section id="security" className="border-y border-white/10 bg-[#0c1428] px-5 py-16 sm:px-8">
      <div className="mx-auto flex max-w-[1160px] flex-col items-start justify-between gap-7 md:flex-row md:items-center">
        <div><p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[.15em] text-cyan-300"><ShieldCheck size={16}/> Built with tenant boundaries</p>
          <h2 className="mt-3 text-2xl font-semibold sm:text-3xl">Your workspace. Your team’s work.</h2>
          <p className="mt-3 max-w-xl text-sm leading-7 text-slate-300">Authentication, workspace membership and role checks protect project and issue access. Your data stays scoped to the right workspace.</p></div>
        <div className="flex flex-wrap gap-4 text-sm text-slate-200"><span className="inline-flex items-center gap-2"><CheckCircle2 size={17} className="text-teal-400"/> Real project data</span><span className="inline-flex items-center gap-2"><CheckCircle2 size={17} className="text-teal-400"/> Persisted board order</span></div>
      </div>
    </section>
    <footer className="mx-auto flex max-w-[1280px] flex-wrap items-center justify-between gap-4 px-5 py-9 text-sm text-slate-400 sm:px-8">
      <span>© ForgeFlow · Build, move, deliver.</span><div className="flex items-center gap-5"><Link href="/login" className="hover:text-white">Log in</Link><Link href="/register" className="hover:text-white">Get started</Link></div>
    </footer>
  </main>;
}
