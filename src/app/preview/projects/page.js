import { Card } from "@/components/ui/card";

const demoProjects = [
  { name: "Customer portal refresh", status: "In progress", detail: "Sample project · 6 issues" },
  { name: "Brand launch campaign", status: "Planning", detail: "Sample project · 4 issues" },
  { name: "Internal tooling", status: "Review", detail: "Sample project · 2 issues" },
];

export default function PreviewProjectsPage() {
  return (
    <div className="space-y-6">
      <header>
        <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-[var(--ff-primary)]">Preview · not live</p>
        <h1 className="text-3xl font-semibold">Projects</h1>
        <p className="mt-2 text-sm text-[var(--ff-muted)]">Illustrative records. Real project management will arrive in Phase 5.</p>
      </header>
      <div className="grid gap-4 lg:grid-cols-2">
        {demoProjects.map((project) => (
          <Card key={project.name}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <h2 className="font-semibold">{project.name}</h2>
              <span className="rounded-full bg-[var(--ff-selected-bg,#EFF6FF)] px-3 py-1 text-xs font-semibold text-[var(--ff-selected-text,#1D4ED8)]">{project.status}</span>
            </div>
            <p className="mt-4 text-sm text-[var(--ff-muted)]">{project.detail}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
