import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { WorkspaceNameForm } from "@/components/forms/workspace-name-form";

const stats = [
  { label: "Sample projects", value: "03" },
  { label: "Sample issues", value: "12" },
  { label: "Demo teammates", value: "04" },
];

export default function PreviewPage() {
  return (
    <div className="space-y-7">
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-[var(--ff-primary)]">Preview · sample data only</p>
        <h1 className="text-3xl font-semibold tracking-tight">Workspace overview</h1>
        <p className="mt-2 text-sm text-[var(--ff-muted)]">A preview of the ForgeFlow workspace. Live information comes in later phases.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        {stats.map(({ label, value }) => (
          <Card key={label}>
            <p className="text-sm text-[var(--ff-muted)]">{label}</p>
            <p className="mt-4 text-3xl font-semibold tabular-nums">{value}</p>
          </Card>
        ))}
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <div className="mb-5 h-1 w-20 rounded-full bg-gradient-to-r from-blue-600 to-cyan-400" />
          <h2 className="text-xl font-semibold">Delivery at a glance</h2>
          <p className="mt-3 text-sm leading-7 text-[var(--ff-muted)]">In the completed application, this space will surface projects, assigned issues, activity, and notifications.</p>
          <Link href="/preview/projects" className="mt-5 inline-flex min-h-11 items-center gap-2 font-semibold text-[var(--ff-primary)] hover:underline">See sample projects <ArrowRight size={16}/></Link>
        </Card>
        <Card>
          <h2 className="mb-4 text-xl font-semibold">Try a validated form</h2>
          <WorkspaceNameForm />
        </Card>
      </div>
    </div>
  );
}
