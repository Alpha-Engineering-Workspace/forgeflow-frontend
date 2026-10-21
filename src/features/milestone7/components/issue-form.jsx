'use client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { InlineAlert } from '@/components/ui/inline-alert';
import { STATUSES, PRIORITIES, TYPES, display } from './issue-data';

const issueSchema = z.strictObject({
  title: z.string().trim().min(2).max(200),
  description: z.string().trim().max(4000),
  type: z.enum(TYPES), status: z.enum(STATUSES), priority: z.enum(PRIORITIES),
  assigneeId: z.string(),
});
const control = 'h-11 w-full rounded-[10px] border border-[var(--ff-control-border)] bg-[var(--ff-surface)] px-3 text-[13px] text-[var(--ff-text)]';

export function IssueForm({ issue, members = [], busy, error, onSave, onCancel }) {
  const form = useForm({ resolver: zodResolver(issueSchema), defaultValues: {
    title: issue?.title || '', description: issue?.description || '', type: issue?.type || 'TASK',
    status: issue?.status || 'TODO', priority: issue?.priority || 'MEDIUM', assigneeId: issue?.assigneeId || '',
  } });
  const submit = form.handleSubmit((input) => onSave({ ...input, assigneeId: input.assigneeId || null }));
  return <form noValidate onSubmit={submit} className="space-y-5" aria-busy={busy}>
    <Field id="issue-title" label="Issue title" error={form.formState.errors.title}>
      <Input id="issue-title" placeholder="e.g. Fix checkout validation" maxLength={200} {...form.register('title')}/>
    </Field>
    <Field id="issue-description" label="Description" optional error={form.formState.errors.description}>
      <textarea id="issue-description" rows={4} maxLength={4000} {...form.register('description')}
        className={`${control} h-auto min-h-28 p-3`} placeholder="What needs to be done?"/>
    </Field>
    <div className="grid gap-4 sm:grid-cols-2">
      <Field id="issue-type" label="Type" error={form.formState.errors.type}>
        <select id="issue-type" className={control} {...form.register('type')}>{TYPES.map(v => <option value={v} key={v}>{display(v)}</option>)}</select>
      </Field>
      <Field id="issue-status" label="Status" error={form.formState.errors.status}>
        <select id="issue-status" className={control} {...form.register('status')}>{STATUSES.map(v => <option value={v} key={v}>{display(v)}</option>)}</select>
      </Field>
      <Field id="issue-priority" label="Priority" error={form.formState.errors.priority}>
        <select id="issue-priority" className={control} {...form.register('priority')}>{PRIORITIES.map(v => <option value={v} key={v}>{display(v)}</option>)}</select>
      </Field>
      <Field id="issue-assignee" label="Assignee" optional error={form.formState.errors.assigneeId}>
        <select id="issue-assignee" className={control} {...form.register('assigneeId')}>
          <option value="">Unassigned</option>
          {members.map(m => <option key={m.userId} value={m.userId}>{m.userId} ({display(m.role)})</option>)}
        </select>
      </Field>
    </div>
    {error && <InlineAlert tone={error.status === 409 ? 'warn' : 'error'}>
      {error.status === 409 ? 'This issue changed in another session. Reload the latest version before editing.' : error.message}
    </InlineAlert>}
    <div className="flex flex-wrap gap-2">
      <Button type="submit" disabled={busy}>{busy ? 'Saving…' : issue ? 'Save changes' : 'Create issue'}</Button>
      <Button type="button" variant="secondary" onClick={onCancel} disabled={busy}>Cancel</Button>
    </div>
  </form>;
}
