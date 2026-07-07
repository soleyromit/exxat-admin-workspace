'use client'

/**
 * Communication section of Central Settings (mirrors live pce-three IA).
 *  - Email Templates manager: Invitation + Reminder groups, per-template
 *    preview/edit/duplicate/delete, "New Template" (edit in a DS Sheet).
 *  - Reminder Cadence engine: frequency + anchor + start → computed schedule preview.
 */

import { useState } from 'react'
import {
  Button, Input, Textarea, Badge, Label,
  Select, SelectTrigger, SelectContent, SelectItem, SelectValue,
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter,
  Tooltip, TooltipTrigger, TooltipContent,
} from '@exxatdesignux/ui'
import { SettingsFormRow } from '@/components/settings-form-row'
import {
  EVAL_EMAIL_TEMPLATES, EVAL_REMINDER_CADENCE,
  REMINDER_FREQUENCY_LABELS, REMINDER_ANCHOR_LABELS,
  type EvalEmailTemplate, type EvalEmailType,
  type ReminderFrequency, type ReminderAnchor,
} from '@/lib/pce-mock-data'

const VARIABLE_CHIPS = [
  '{{student_first_name}}', '{{course_name}}', '{{term_name}}',
  '{{close_date}}', '{{days_until_close}}', '{{survey_link}}', '{{program_name}}',
]

const STATUS_BADGE: Record<EvalEmailTemplate['status'], { label: string; variant: 'secondary' | 'outline' }> = {
  action_required: { label: 'Action required', variant: 'secondary' },
  ready:           { label: 'Ready',           variant: 'outline' },
}

const TYPE_BADGE: Record<EvalEmailType, { label: string; variant: 'default' | 'secondary' }> = {
  invitation: { label: 'Invite',   variant: 'default' },
  reminder:   { label: 'Reminder', variant: 'secondary' },
}

// ── Panel shell — flat settings group ────────────────────────────────────────
/** Flat settings group — same idiom as the Evaluation Rules / Schedule tabs
 *  (heading + rows, hairline separation; no Card chrome). */
function Panel({ title, description, action, children }: {
  title: string; description?: string; action?: React.ReactNode; children: React.ReactNode
}) {
  return (
    <section className="flex flex-col gap-4 border-t border-border pt-6 first:border-0 first:pt-0">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <h3 className="text-sm font-semibold">{title}</h3>
          {description && <p className="text-xs text-muted-foreground leading-snug max-w-xl">{description}</p>}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
      <div className="flex flex-col">{children}</div>
    </section>
  )
}

// ── Email template row ────────────────────────────────────────────────────────
function TemplateRow({ t, onEdit, onDuplicate, onDelete }: {
  t: EvalEmailTemplate; onEdit: () => void; onDuplicate: () => void; onDelete: () => void
}) {
  const status = STATUS_BADGE[t.status]
  const iconBtn = (icon: string, label: string, onClick: () => void) => (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label={label} onClick={onClick}>
          <i className={`fa-light ${icon} text-sm`} aria-hidden="true" />
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  )
  return (
    <div className="flex items-center gap-3 py-3 border-b border-border last:border-0">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium truncate">{t.name}</span>
          <Badge variant={status.variant} className="font-normal shrink-0">{status.label}</Badge>
        </div>
        <p className="text-xs text-muted-foreground truncate mt-0.5">{t.subject}</p>
      </div>
      <div className="flex items-center shrink-0">
        {iconBtn('fa-eye', 'Preview', onEdit)}
        {iconBtn('fa-pen', 'Edit', onEdit)}
        {iconBtn('fa-copy', 'Duplicate', onDuplicate)}
        {iconBtn('fa-trash', 'Delete', onDelete)}
      </div>
    </div>
  )
}

function Group({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col">
      <p className="text-xs font-medium text-muted-foreground mb-1 mt-4 first:mt-0">{label}</p>
      <div className="flex flex-col">{children}</div>
    </div>
  )
}

// ── Email editor sheet (DS sheet convention) ──────────────────────────────────
function TemplateEditorSheet({ template, onClose, onSave }: {
  template: EvalEmailTemplate | null; onClose: () => void; onSave: (t: EvalEmailTemplate) => void
}) {
  const [subject, setSubject] = useState(template?.subject ?? '')
  const [body, setBody]       = useState(template?.body ?? '')
  const [name, setName]       = useState(template?.name ?? '')
  const open = template !== null

  return (
    <Sheet open={open} onOpenChange={(v) => { if (!v) onClose() }}>
      <SheetContent side="right" showOverlay={false} showCloseButton={false}
        className="w-full sm:max-w-[600px] flex flex-col gap-0 p-0">
        <SheetHeader className="px-6 pt-6 pb-4 border-b border-border">
          <SheetTitle className="text-base">{template?.id.startsWith('new-') ? 'New template' : 'Edit template'}</SheetTitle>
          <SheetDescription className="text-xs">
            {template ? TYPE_BADGE[template.type].label : ''} email · used for survey {template?.type === 'reminder' ? 'reminders' : 'invitations'}.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-auto px-6 py-5 flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="tpl-name" className="text-sm">Template name</Label>
            <Input id="tpl-name" value={name} onChange={e => setName(e.target.value)} className="text-sm" placeholder="e.g. Formal Invite" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="tpl-subject" className="text-sm">Subject line</Label>
            <Input id="tpl-subject" value={subject} onChange={e => setSubject(e.target.value)} className="text-sm" placeholder="Subject…" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="tpl-body" className="text-sm">Body</Label>
            <Textarea id="tpl-body" value={body} onChange={e => setBody(e.target.value)} rows={11}
              className="text-sm font-mono resize-none" placeholder="Email body…" />
          </div>
          <div className="flex flex-col gap-2">
            <p className="text-xs font-medium text-muted-foreground">Insert variable</p>
            <div className="flex flex-wrap gap-1.5">
              {VARIABLE_CHIPS.map(v => (
                <Button key={v} type="button" variant="outline" size="sm"
                  onClick={() => setBody(b => b + v)}
                  className="h-auto px-2 py-0.5 text-xs font-mono font-normal text-muted-foreground">
                  {v}
                </Button>
              ))}
            </div>
          </div>
        </div>

        <SheetFooter className="px-6 py-4 border-t border-border flex-row justify-end gap-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button disabled={!name.trim() || !subject.trim()}
            onClick={() => template && onSave({ ...template, name, subject, body })}>Save template</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

// ── Reminder cadence ──────────────────────────────────────────────────────────
const FREQ_STEP: Record<ReminderFrequency, number> = { daily: 1, every_3_days: 3, every_7_days: 7, custom: 3 }

function computeSchedule(start: number, freq: ReminderFrequency): number[] {
  const step = FREQ_STEP[freq]
  const out: number[] = []
  for (let d = start; d >= 1; d -= step) out.push(d)
  return out
}

function ReminderCadence() {
  const [frequency, setFrequency] = useState<ReminderFrequency>(EVAL_REMINDER_CADENCE.frequency)
  const [anchor, setAnchor]       = useState<ReminderAnchor>(EVAL_REMINDER_CADENCE.anchor)
  const [start, setStart]         = useState(EVAL_REMINDER_CADENCE.startDaysBefore)
  const schedule = computeSchedule(start, frequency)
  const anchorLabel = REMINDER_ANCHOR_LABELS[anchor]

  return (
    <Panel title="Reminder Cadence" description="How often reminder emails repeat, and when they start.">
      <SettingsFormRow label="Reminder frequency" description="How often reminder emails repeat.">
        <div className="flex items-center gap-1.5 flex-wrap">
          {(Object.keys(REMINDER_FREQUENCY_LABELS) as ReminderFrequency[]).map(f => (
            <Button key={f} variant={frequency === f ? 'default' : 'outline'} size="sm" className="h-8"
              aria-pressed={frequency === f} onClick={() => setFrequency(f)}>
              {REMINDER_FREQUENCY_LABELS[f]}
            </Button>
          ))}
        </div>
      </SettingsFormRow>

      <SettingsFormRow label="Anchor date" description="The reference point the cadence is calculated from.">
        <Select value={anchor} onValueChange={v => setAnchor(v as ReminderAnchor)}>
          <SelectTrigger className="w-48 h-8 text-sm" aria-label="Reminder anchor date"><SelectValue /></SelectTrigger>
          <SelectContent>
            {(Object.keys(REMINDER_ANCHOR_LABELS) as ReminderAnchor[]).map(a => (
              <SelectItem key={a} value={a}>{REMINDER_ANCHOR_LABELS[a]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </SettingsFormRow>

      <SettingsFormRow label="Start sending" description={`Begin reminders this many days before ${anchorLabel}, repeating until the anchor.`}>
        <div className="flex items-center gap-2">
          <Input type="number" min={1} max={60} value={start}
            onChange={e => setStart(Math.max(1, Math.min(60, Number(e.target.value))))}
            className="w-16 h-8 text-sm tabular-nums text-right" aria-label="Start sending days before anchor" />
          <span className="text-sm text-muted-foreground">days before</span>
        </div>
      </SettingsFormRow>

      <SettingsFormRow label="Schedule preview" description="When each reminder fires for the active term.">
        {schedule.length > 0 ? (
          <div className="rounded-2 bg-muted/50 px-3.5 py-3 flex flex-col gap-1">
            {schedule.map(d => (
              <div key={d} className="flex items-center gap-2 text-sm">
                <i className="fa-light fa-bell text-xs text-muted-foreground" aria-hidden="true" />
                <span className="tabular-nums">{d} day{d !== 1 ? 's' : ''} before {anchorLabel}</span>
                <span className="text-xs text-muted-foreground">— reminder sent</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No reminders scheduled.</p>
        )}
      </SettingsFormRow>
    </Panel>
  )
}

// ── Section export ────────────────────────────────────────────────────────────
export function CommunicationSection() {
  const [templates, setTemplates] = useState<EvalEmailTemplate[]>(EVAL_EMAIL_TEMPLATES)
  const [editing, setEditing] = useState<EvalEmailTemplate | null>(null)

  const invitations = templates.filter(t => t.type === 'invitation')
  const reminders   = templates.filter(t => t.type === 'reminder')

  const duplicate = (t: EvalEmailTemplate) =>
    setTemplates(prev => [...prev, { ...t, id: `new-${prev.length + 1}`, name: `${t.name} (copy)`, status: 'ready' }])
  const remove = (id: string) => setTemplates(prev => prev.filter(t => t.id !== id))
  const startNew = (type: EvalEmailType) =>
    setEditing({ id: `new-${templates.length + 1}`, name: '', type, status: 'ready', subject: '', body: '' })
  const saveEdit = (t: EvalEmailTemplate) => {
    setTemplates(prev => prev.some(x => x.id === t.id) ? prev.map(x => x.id === t.id ? t : x) : [...prev, t])
    setEditing(null)
  }

  return (
    <div className="flex flex-col gap-4">
      <Panel
        title="Email Templates"
        description="Templates used for survey invitations and reminders. Create new templates, preview how they render, or edit existing ones."
        action={<Button size="sm" onClick={() => startNew('invitation')}>
          <i className="fa-light fa-plus" aria-hidden="true" />New template
        </Button>}
      >
        <Group label="Invitation emails">
          {invitations.length > 0 ? invitations.map(t => (
            <TemplateRow key={t.id} t={t} onEdit={() => setEditing(t)} onDuplicate={() => duplicate(t)} onDelete={() => remove(t.id)} />
          )) : <p className="text-xs text-muted-foreground py-3">No invitation templates yet.</p>}
        </Group>
        <Group label="Reminder emails">
          {reminders.length > 0 ? reminders.map(t => (
            <TemplateRow key={t.id} t={t} onEdit={() => setEditing(t)} onDuplicate={() => duplicate(t)} onDelete={() => remove(t.id)} />
          )) : <p className="text-xs text-muted-foreground py-3">No reminder templates yet.</p>}
        </Group>
      </Panel>

      <ReminderCadence />

      <TemplateEditorSheet template={editing} onClose={() => setEditing(null)} onSave={saveEdit} />
    </div>
  )
}
