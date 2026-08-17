'use client'

// COMPARE VARIANT 4 — "Two-line row, minimal expand" (throwaway; same
// lifecycle as the other push-step2-row-detail variants — delete once a
// direction is picked).
//
// Thesis: separate READING from EDITING. Romit's 2026-08-04 critique of the
// shipped accordion: "You didn't show the selected faculties and template
// selection at the row level" — you had to expand a row just to learn WHO is
// selected and WHAT template it sends, which defeats triage-at-a-glance.
// Here the collapsed row is TWO lines:
//   line 1 — the existing triage line (checkbox · chevron · course · type ·
//            status · action), same TABLE_GRID as the shipped step;
//   line 2 — a read-only preview, indented to the Course column: the
//            assigned template as a small outline chip + a gapped (never
//            overlapping — DS AvatarGroup MUST-NOT) avatar row of up to 3
//            included evaluatees with a +N overflow counter.
// Expanding is now ONLY for CHANGING things: the panel carries just the
// Template Select and the checkable evaluatee list, with real padding and
// section hierarchy — no third restatement of the summary line 2 already
// shows. Line 2 stays visible while the row is open, so checking a person
// in the panel updates the preview immediately (live feedback loop).
//
// Mobbin grounding (images reviewed 2026-08-04):
// - ClickUp task list rows (mobbin.com/screens/dd9efe3e-9958-4614-bbe3-
//   c968dd3c2a2e and the dashboard task-list screen 27113b60): a muted
//   secondary line (breadcrumb/tags) travels WITH the bold title line, and
//   assignee avatars are visible per row without opening the task.
// - Instagram / Threads DM list rows (screens 11143cac / 437eeb95): the
//   canonical two-line inbox row — line 2 smaller, muted, indented to the
//   text column of line 1, never to the container edge.
// - Deel peer-selection table (mobbin.com/screens/69aff800-d27f-4b29-b4dc-
//   ee3d1e98579e): status chip + nominee counts + one per-row action, all
//   readable without expanding.

import { useState } from 'react'
import {
  AvatarGroup, AvatarGroupCount,
  Badge, Button, Card, CardContent, Checkbox, CheckboxLabel,
  Collapsible, CollapsibleContent, CollapsibleTrigger,
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
  Tip,
} from '@exxatdesignux/ui'
import { cn } from '@/lib/utils'
import { PersonAvatar } from '@/components/pce/person-avatar'
import { ListHubStatusBadge } from '@/components/list-hub-status-badge'
import {
  LIST_HUB_STATUS_TINT_SUCCESS, LIST_HUB_STATUS_TINT_WARNING, LIST_HUB_STATUS_TINT_DANGER,
} from '@/lib/list-status-badges'
import { TypePill } from '@/components/pce/courses-evaluatees/scope-controls'
import { COURSE_TYPE_FULL_LABEL } from '@/lib/pce-mock-data'
import {
  useStep2RowDetailDemo, evaluateeLabel,
  type DemoRow, type CourseGate, type SurveyInstance, type PceTemplate,
} from './_shared'

// Same collapsed-line grid as the shipped step (step-survey-instances.tsx
// TABLE_GRID) — checkbox · chevron · course · type · status · action. Line 2
// reuses the identical template and parks its content in the Course column,
// so the preview indents exactly under the course name (Instagram/Threads
// inbox alignment), never under the checkbox.
const TABLE_GRID = `24px 24px minmax(0,1fr) 92px 96px 192px`

/** Person → DS avatar; course-scope → book glyph in the same 24px disc
 *  footprint (avatar-initials floor), so the preview rail reads as one row
 *  of like-sized identity chips. */
function EvaluateeGlyph({ i, className }: { i: SurveyInstance; className?: string }) {
  return i.scope === 'course' ? (
    <span className={cn('size-6 rounded-full flex items-center justify-center border border-border bg-background shrink-0', className)}>
      <i className="fa-light fa-book-open text-[10px] text-muted-foreground" aria-hidden="true" />
    </span>
  ) : (
    <PersonAvatar name={i.personName!} className={cn('size-6', className)} decorative />
  )
}

function blockedSummary(gate: CourseGate): string {
  const parts: string[] = []
  if (gate.reasons.includes('no-template')) parts.push('No template assigned')
  if (gate.reasons.includes('overlap')) {
    const roles = [...new Set(gate.dups.map(i => i.roleLabel || 'Course material'))]
    parts.push(`${roles.join(', ')} already covered`)
  }
  return parts.join(' · ') || 'Blocked'
}

/** Same badge family + tints as the shipped RowStatus — reason detail rides
 *  a Tip on a focusable span (ListHubStatusBadge is a plain <span>; without
 *  tabIndex the detail is hover-only, WCAG 1.4.13/2.1.1). */
function RowStatus({ gate }: { gate: CourseGate }) {
  if (gate.reasons.length > 0) {
    return (
      <Tip label={blockedSummary(gate)} side="top">
        <span className="inline-flex rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1" tabIndex={0}>
          <ListHubStatusBadge label="Blocked" tint={LIST_HUB_STATUS_TINT_DANGER} icon="fa-lock" />
        </span>
      </Tip>
    )
  }
  if (gate.gaps.length > 0) {
    const roles = [...new Set(gate.gaps.map(i => i.roleLabel))]
    return (
      <Tip label={`${roles.join(', ')} unassigned`} side="top">
        <span className="inline-flex rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1" tabIndex={0}>
          <ListHubStatusBadge label="Gap" tint={LIST_HUB_STATUS_TINT_WARNING} icon="fa-user-slash" />
        </span>
      </Tip>
    )
  }
  return <ListHubStatusBadge label="Ready" tint={LIST_HUB_STATUS_TINT_SUCCESS} icon="fa-circle-check" />
}

const PREVIEW_AVATAR_CAP = 3

/** Line 2 — the read. Template chip + gapped avatar rail, both read-only.
 *  Avatars are side-by-side with a gap (DS AvatarGroup — never overlapping:
 *  dark-mode ring contrast, stacked click targets, and ambiguous
 *  screen-reader grouping are the documented reasons this is a MUST-NOT).
 *  The full name list rides an sr-only span + a keyboard-reachable Tip, so
 *  the preview is complete for every reader, not just mouse users. */
function ReadPreview({ row, included }: { row: DemoRow; included: ReadonlySet<string> }) {
  const includedUnits = row.gate.fresh.filter(i => included.has(i.key))
  const shown = includedUnits.slice(0, PREVIEW_AVATAR_CAP)
  const overflow = includedUnits.length - shown.length
  const names = includedUnits.map(evaluateeLabel).join(', ')
  return (
    <div className="flex items-center gap-2.5 min-w-0 text-xs text-muted-foreground">
      {row.template ? (
        <Badge variant="outline" className="gap-1.5 font-normal max-w-[240px] shrink min-w-0">
          <i className="fa-light fa-file-lines shrink-0" aria-hidden="true" />
          <span className="truncate">{row.template.name}</span>
        </Badge>
      ) : (
        <span className="inline-flex items-center gap-1.5">
          <i className="fa-light fa-file-slash" aria-hidden="true" />
          No template assigned
        </span>
      )}

      <span aria-hidden="true">&middot;</span>

      {includedUnits.length === 0 ? (
        <span>Nobody selected</span>
      ) : (
        <>
          <span className="sr-only">{`Evaluating for ${row.code}: ${names}`}</span>
          <Tip label={names} side="top">
            <span
              className="inline-flex items-center gap-1.5 rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
              tabIndex={0}
            >
              {/* aria-hidden: the sr-only sentence above is the accessible
                  statement; the avatar rail is its visual double. */}
              <AvatarGroup aria-hidden="true">
                {shown.map(i => <EvaluateeGlyph key={i.key} i={i} />)}
                {overflow > 0 && <AvatarGroupCount>+{overflow}</AvatarGroupCount>}
              </AvatarGroup>
            </span>
          </Tip>
        </>
      )}
    </div>
  )
}

/** The one collapsed-row action, mirroring the shipped RowAction contract:
 *  only a gap earns a button (its fix has no other collapsed-row trigger);
 *  Ready has nothing to do and Blocked's fixes live in the expanded panel. */
function RowAction({ gate, onAssign }: { gate: CourseGate; onAssign: () => void }) {
  if (gate.reasons.length > 0 || gate.gaps.length === 0) {
    return <span className="text-sm text-muted-foreground">&mdash;</span>
  }
  const roles = [...new Set(gate.gaps.map(i => i.roleLabel))]
  const label = roles.length === 1 ? `Assign ${roles[0]}` : `Assign ${roles.length} roles`
  return (
    <Button variant="outline" size="xs" className="justify-start min-w-0 max-w-full" onClick={onAssign} aria-label={label}>
      <i className="fa-regular fa-circle-plus text-xs shrink-0" aria-hidden="true" />
      <span className="truncate">{label}</span>
    </Button>
  )
}

/** Expanded panel — EDIT ONLY. The read already lives on line 2, so this
 *  panel spends its space on the two controls: the Template Select and the
 *  checkable evaluatee list, side by side with real labels and breathing
 *  room instead of a cramped restatement of the summary. Plain DS Checkbox
 *  rows (not cmdk) — this is a form, and Checkbox is safe outside
 *  CommandItem's role="option". */
function EditPanel({ row, publishedTemplates, included, onToggleUnit, onTemplateChange }: {
  row: DemoRow
  publishedTemplates: PceTemplate[]
  included: ReadonlySet<string>
  onToggleUnit: (key: string) => void
  onTemplateChange: (offeringId: string, templateId: string) => void
}) {
  const { fresh, gaps, dups } = row.gate
  return (
    <div className="mx-4 mb-3 grid gap-6 rounded-md border border-border bg-background p-4 md:grid-cols-[260px_minmax(0,1fr)]">
      <div className="flex flex-col gap-2">
        <span className="text-xs font-medium text-muted-foreground">Template</span>
        <Select value={row.template?.id ?? ''} onValueChange={v => onTemplateChange(row.offering.id, v)}>
          <SelectTrigger
            size="sm"
            className="w-full [&>span]:truncate [&>span]:min-w-0"
            aria-label={`Template for ${row.code}${!row.template ? ' · required' : ''}`}
          >
            <SelectValue placeholder="Assign template" />
          </SelectTrigger>
          <SelectContent>
            {publishedTemplates.map(t => (
              <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          One survey per selected evaluatee is created from this template.
        </p>
      </div>

      <div className="flex flex-col gap-3 min-w-0">
        {fresh.length > 0 && (
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-muted-foreground">Include in this push</span>
            <div className="flex flex-col">
              {fresh.map(i => {
                const id = `v4-${row.offering.id}-${i.key}`
                return (
                  <div key={i.key} className="flex items-center gap-2.5 rounded-md px-2 py-1.5 hover:bg-muted/50">
                    <Checkbox id={id} checked={included.has(i.key)} onCheckedChange={() => onToggleUnit(i.key)} />
                    <EvaluateeGlyph i={i} />
                    <CheckboxLabel htmlFor={id} className="min-w-0 flex items-baseline gap-1.5 font-normal">
                      <span className="truncate text-sm">
                        {i.scope === 'course' ? 'Course material' : i.personName}
                      </span>
                      {i.roleLabel && i.scope !== 'course' && (
                        <span className="text-xs text-muted-foreground shrink-0">· {i.roleLabel}</span>
                      )}
                    </CheckboxLabel>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {gaps.length > 0 && (
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-muted-foreground">Needs a person</span>
            <div className="flex flex-col">
              {gaps.map(i => (
                <div key={i.key} className="flex items-center gap-2.5 px-2 py-1.5">
                  <span
                    className="size-6 rounded-full flex items-center justify-center border border-dashed shrink-0"
                    style={{ borderColor: 'var(--chip-4)', color: 'var(--chip-4)' }}
                  >
                    <i className="fa-light fa-user-plus text-[10px]" aria-hidden="true" />
                  </span>
                  <span className="text-sm truncate">No {i.roleLabel} assigned</span>
                  {i.prismHref && (
                    <a
                      href={i.prismHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ms-auto text-xs shrink-0 underline-offset-2 hover:underline rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      style={{ color: 'var(--insight-severity-info-fg)' }}
                    >
                      Add in Prism
                      <span className="sr-only"> (opens in new tab)</span>
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {dups.length > 0 && (
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-muted-foreground">Already covered</span>
            <div className="flex flex-col">
              {dups.map(i => (
                <div key={i.key} className="flex items-center gap-2.5 px-2 py-1.5 text-muted-foreground">
                  <i className="fa-solid fa-lock text-xs shrink-0" style={{ color: 'var(--qb-status-blocked-fg)' }} aria-hidden="true" />
                  <EvaluateeGlyph i={i} className="grayscale" />
                  <span className="text-sm truncate">
                    {i.scope === 'course' ? 'Course material' : i.personName}
                  </span>
                  {i.roleLabel && i.scope !== 'course' && (
                    <span className="text-xs shrink-0">· {i.roleLabel}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function VariantTwoLineRow() {
  const { rows, publishedTemplates, included, toggleUnit, setTemplateFor } = useStep2RowDetailDemo()
  const [openRows, setOpenRows] = useState<ReadonlySet<string>>(new Set())
  const toggleRow = (id: string) =>
    setOpenRows(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  const openRow = (id: string) => setOpenRows(prev => new Set(prev).add(id))

  return (
    <Card size="sm" className="py-0 gap-0 overflow-hidden">
      <CardContent className="p-0">
        <div
          className="grid items-center gap-3 ps-3 pe-3 py-2 border-b border-border text-xs font-medium text-muted-foreground"
          style={{ gridTemplateColumns: TABLE_GRID }}
        >
          <span />
          <span />
          <span>Course</span>
          <span>Type</span>
          <span>Status</span>
          <span>Action</span>
        </div>

        {rows.map(row => {
          const { offering, code, name, mode, gate } = row
          const freshKeys = gate.fresh.map(i => i.key)
          const inCount = freshKeys.filter(k => included.has(k)).length
          const open = openRows.has(offering.id)
          return (
            <Collapsible
              key={offering.id}
              open={open}
              onOpenChange={() => toggleRow(offering.id)}
              className="border-b border-border last:border-b-0"
            >
              {/* Line 1 — triage, unchanged shape from the shipped step. */}
              <div
                className="grid items-center gap-3 ps-3 pe-3 pt-2 pb-1"
                style={{ gridTemplateColumns: TABLE_GRID }}
              >
                <span className="flex items-center">
                  <Checkbox
                    checked={
                      freshKeys.length > 0
                        ? (inCount === freshKeys.length ? true : inCount > 0 ? 'indeterminate' : false)
                        : true
                    }
                    onCheckedChange={v => {
                      // Demo-scope semantics: check = select every remaining
                      // unit, uncheck = deselect all (the harness has no
                      // course-level deselect channel).
                      const flipKeys = v
                        ? freshKeys.filter(k => !included.has(k))
                        : freshKeys.filter(k => included.has(k))
                      flipKeys.forEach(toggleUnit)
                    }}
                    aria-label={`Include ${code} in this push`}
                  />
                </span>

                <CollapsibleTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="group"
                    aria-label={`${open ? 'Hide' : 'Show'} template and evaluatee editing for ${code}`}
                  >
                    <i
                      className="fa-light fa-chevron-down text-xs transition-transform group-data-[state=open]:rotate-180"
                      aria-hidden="true"
                    />
                  </Button>
                </CollapsibleTrigger>

                <span className="flex items-baseline gap-2 min-w-0">
                  <span className="font-mono text-xs tabular-nums text-muted-foreground shrink-0">{code}</span>
                  {name && <span className="truncate text-sm">{name}</span>}
                </span>

                <span><TypePill deliveryMode={mode} label={COURSE_TYPE_FULL_LABEL[mode]} /></span>

                <span className="min-w-0"><RowStatus gate={gate} /></span>

                <span className="min-w-0">
                  <RowAction gate={gate} onAssign={() => openRow(offering.id)} />
                </span>
              </div>

              {/* Line 2 — the read, always visible. Same grid, content in
                  the Course column so it indents under the name, not the
                  checkbox. Stays rendered while the row is open: edits in
                  the panel update this preview live. */}
              <div
                className="grid gap-3 ps-3 pe-3 pb-2"
                style={{ gridTemplateColumns: TABLE_GRID }}
              >
                <div className="col-start-3 col-span-4 min-w-0">
                  <ReadPreview row={row} included={included} />
                </div>
              </div>

              <CollapsibleContent>
                <EditPanel
                  row={row}
                  publishedTemplates={publishedTemplates}
                  included={included}
                  onToggleUnit={toggleUnit}
                  onTemplateChange={setTemplateFor}
                />
              </CollapsibleContent>
            </Collapsible>
          )
        })}
      </CardContent>
    </Card>
  )
}
