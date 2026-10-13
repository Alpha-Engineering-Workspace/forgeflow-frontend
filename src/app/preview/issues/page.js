import { EmptyState } from "@/components/ui/empty-state";

export default function PreviewIssuesPage() {
  return (
    <div className="space-y-6">
      <header>
        <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-[var(--ff-primary)]">Preview · not live</p>
        <h1 className="text-3xl font-semibold">Issues</h1>
        <p className="mt-2 text-sm text-[var(--ff-muted)]">Issue tracking and a persisted Kanban board are upcoming milestones.</p>
      </header>
      <EmptyState title="Issue tracking is coming" description="In Phase 6 you'll create, assign, search, and edit issues. Phase 7 adds a persisted Kanban board." />
    </div>
  );
}
