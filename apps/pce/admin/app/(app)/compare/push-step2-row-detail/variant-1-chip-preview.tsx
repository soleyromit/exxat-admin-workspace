'use client'

// COMPARE VARIANT 1 — "Chip preview row".
//
// Core idea: the COLLAPSED row already answers "which template?" and "who's
// selected?" — a compact template chip plus a gapped avatar cluster (up to 3
// + "+N") sit right in the row, so expanding is only ever needed to CHANGE
// something, never to see current state. This is the direct answer to the
// 2026-08-04 critique of the shipped accordion (step-survey-instances.tsx):
// there, the collapsed line shows nothing about template/faculty, and the
// expanded panel wastes its width on a single stacked column with no
// secondary actions.
//
// Mobbin grounding (images inspected, not metadata):
//   · ClickUp task list (mobbin.com/screens/dd9efe3e-9958-4614-bbe3-c968dd3c2a2e
//     and siblings) — each collapsed row carries small tinted label chips
//     right after the title with a "+1" overflow chip, and a separate
//     assignee-avatar cluster column; the row stays one calm line while
//     being fully readable without opening the task.
//   · Asana To-Dos (mobbin.com/screens/c3bc34ee-e982-4a21-9e79-0fdec7fd44d6)
//     — assignee avatar visible per row in a flat list, in its own column,
//     so identity never requires opening the detail.
//
// Expanded panel: proper two-column use of the width — Template (Select +
// preview + consequence meta) on the left, the full interactive Evaluatees
// list on the right, and a real secondary-action toolbar along the bottom
// (Reset to default template / Remove from push — demo no-ops).
//
// DS notes: AvatarGroup is the DS non-overlapping row (overlapping face
// piles are a hard "never" — see avatar.d.ts); Checkbox rows use htmlFor
// label association (Radix forwards label clicks); all icon-only buttons
// carry aria-label; FA icons are aria-hidden; colors are tokens only.

import { useMemo, useState } from 'react'
import {
  AvatarGroup, AvatarGroupCount,
  Badge, Button, Card, CardContent, Checkbox,
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
import {
  useStep2RowDetailDemo, evaluateeLabel, templateCriteria, CRITERION_BY_TYPE,
  type DemoRow, type SurveyInstance,
} from './_shared'

// checkbox · chevron · course · template chip · evaluatee cluster · status · action
const GRID = `24px 24px minmax(0,1fr) minmax(0,190px) 128px 96px 176px`

/** Stable, HTML-id-safe handle for a SurveyInstance key ("off-1|instructor|Dr. X"). */
const domId = (key: string) => `v1-unit-${key.replace(/[^a-zA-Z0-9_-]/g, '_')}`

/** Person avatar, or the course-material glyph disc — same vocabulary as the
 *  shipped step's EvaluateeAvatar (book-open in a bordered circle). */
function UnitAvatar({ i, className }: { i: SurveyInstance; className?: string }) {
  return i.scope === 'course' ? (
    <span className={cn('size-6 rounded-full flex items-center justify-center border border-border bg-background shrink-0', className)}>
      <i className="fa-light fa-book-open text-[10px] text-muted-foreground" aria-hidden="true" />
    </span>
  ) : (
    <PersonAvatar name={i.personName ?? ''} className={className} />
  )
}

/** Dashed "role needs a person" disc — same chip-4 dashed vocabulary as the
 *  shipped step's GapAvatar, so a gap reads identically across variants. */
function GapDisc({ className }: { className?: string }) {
  return (
    <span
      className={cn('size-6 rounded-full flex items-center justify-center border border-dashed shrink-0', className)}
      style={{ borderColor: 'var(--chip-4)', color: 'var(--chip-4)' }}
    >
      <i className="fa-light fa-user-plus text-[10px]" aria-hidden="true" />
    </span>
  )
}

// ── Collapsed-row preview cells ──────────────────────────────────────────────

/** Template readout chip — truncated name in a small Badge, NOT a control.
 *  The full name rides a Tip (chip is width-capped) and the chip is
 *  keyboard-reachable so the Tip isn't hover-only (WCAG 1.4.13). */
function TemplateChip({ row }: { row: DemoRow }) {
  if (!row.template) {
    return (
      <Badge variant="outline" className="max-w-full min-w-0 text-muted-foreground">
        <i className="fa-light fa-file-slash text-xs shrink-0" aria-hidden="true" />
        <span className="truncate">No template</span>
      </Badge>
    )
  }
  return (
    <Tip label={row.template.name} side="top">
      <span
        tabIndex={0}
        className="inline-flex max-w-full min-w-0 rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
      >
        <Badge variant="secondary" className="max-w-full min-w-0">
          <i className="fa-light fa-file-lines text-xs shrink-0" aria-hidden="true" />
          <span className="truncate">{row.template.name}</span>
        </Badge>
      </span>
    </Tip>
  )
}

/** The ClickUp/Asana move: who's actually in this push, visible in the
 *  collapsed row. Up to 3 gapped avatars + "+N" overflow (DS AvatarGroup —
 *  never overlapping), plus one dashed disc when a role still needs a
 *  person. A sibling sr-only sentence carries the full list; the cluster
 *  itself is decorative. */
function EvaluateeCluster({ row, included }: { row: DemoRow; included: ReadonlySet<string> }) {
  const inUnits = row.gate.fresh.filter(i => included.has(i.key))
  const shown = inUnits.slice(0, 3)
  const extra = inUnits.length - shown.length
  const gapCount = row.gate.gaps.length
  const summaryParts: string[] = []
  summaryParts.push(
    inUnits.length > 0
      ? `Included in this push: ${inUnits.map(evaluateeLabel).join(', ')}.`
      : 'No evaluatees included.',
  )
  if (gapCount > 0) summaryParts.push(`${gapCount} role${gapCount !== 1 ? 's' : ''} without a person.`)
  return (
    <span className="flex min-w-0 items-center">
      <span className="sr-only">{summaryParts.join(' ')}</span>
      {inUnits.length === 0 && gapCount === 0 ? (
        <span aria-hidden="true" className="text-xs text-muted-foreground">&ndash;</span>
      ) : (
        <AvatarGroup aria-hidden="true">
          {shown.map(i => <UnitAvatar key={i.key} i={i} />)}
          {extra > 0 && <AvatarGroupCount>+{extra}</AvatarGroupCount>}
          {gapCount > 0 && <GapDisc />}
        </AvatarGroup>
      )}
    </span>
  )
}

function RowStatus({ row }: { row: DemoRow }) {
  const { reasons, gaps, dups } = row.gate
  if (reasons.length > 0) {
    const detail = reasons
      .map(r => {
        if (r === 'overlap') {
          const roles = [...new Set(dups.map(i => i.roleLabel || 'Course material'))]
          return `${roles.join(', ')} already covered`
        }
        return 'No template assigned'
      })
      .join(' · ')
    return (
      <Tip label={detail} side="top">
        <span className="inline-flex rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1" tabIndex={0}>
          <ListHubStatusBadge label="Blocked" tint={LIST_HUB_STATUS_TINT_DANGER} icon="fa-lock" />
        </span>
      </Tip>
    )
  }
  if (gaps.length > 0) {
    const gapRoles = [...new Set(gaps.map(i => i.roleLabel))]
    return (
      <Tip label={`${gapRoles.join(', ')} unassigned`} side="top">
        <span className="inline-flex rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1" tabIndex={0}>
          <ListHubStatusBadge label="Gap" tint={LIST_HUB_STATUS_TINT_WARNING} icon="fa-user-slash" />
        </span>
      </Tip>
    )
  }
  return <ListHubStatusBadge label="Ready" tint={LIST_HUB_STATUS_TINT_SUCCESS} icon="fa-circle-check" />
}

/** Same contract as the shipped RowAction: only a Gap earns a button (its fix
 *  has no other collapsed-row trigger); Ready and Blocked show a dash. */
function RowAction({ row, onAssign }: { row: DemoRow; onAssign: () => void }) {
  const { reasons, gaps } = row.gate
  if (reasons.length > 0 || gaps.length === 0) {
    return <span className="text-sm" style={{ color: 'var(--muted-foreground)' }}>&mdash;</span>
  }
  const gapRoles = [...new Set(gaps.map(i => i.roleLabel))]
  const label = gapRoles.length === 1 ? `Assign ${gapRoles[0]}` : `Assign ${gapRoles.length} roles`
  return (
    <Button variant="outline" size="xs" className="justify-start min-w-0 max-w-full" onClick={onAssign} aria-label={label}>
      <i className="fa-regular fa-circle-plus text-xs shrink-0" aria-hidden="true" />
      <span className="truncate">{label}</span>
    </Button>
  )
}

// ── Expanded panel ───────────────────────────────────────────────────────────

function EvaluateeList({ row, included, toggleUnit }: {
  row: DemoRow
  included: ReadonlySet<string>
  toggleUnit: (key: string) => void
}) {
  const { fresh, gaps, dups } = row.gate
  if (fresh.length === 0 && gaps.length === 0 && dups.length === 0) {
    return <span className="text-xs text-muted-foreground">Assign a template to see who this push would evaluate.</span>
  }
  return (
    <div className="flex flex-col gap-3">
      {fresh.length > 0 && (
        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium text-muted-foreground">Include in this push</span>
          {fresh.map(i => {
            const id = domId(i.key)
            return (
              <div key={i.key} className="flex items-center gap-2.5 rounded-md px-2 py-1.5 hover:bg-accent/50">
                <Checkbox
                  id={id}
                  checked={included.has(i.key)}
                  onCheckedChange={() => toggleUnit(i.key)}
                />
                <UnitAvatar i={i} />
                <label htmlFor={id} className="flex min-w-0 cursor-pointer items-baseline gap-1.5 text-sm">
                  <span className="truncate">{i.scope === 'course' ? 'Course material' : i.personName}</span>
                  {i.roleLabel && i.scope !== 'course' && (
                    <span className="shrink-0 text-xs text-muted-foreground">· {i.roleLabel}</span>
                  )}
                </label>
              </div>
            )
          })}
        </div>
      )}

      {gaps.length > 0 && (
        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium text-muted-foreground">Needs a person</span>
          {gaps.map(i => (
            <div key={i.key} className="flex items-center gap-2.5 px-2 py-1.5">
              <GapDisc />
              <span className="min-w-0 truncate text-sm">No {i.roleLabel} assigned</span>
              {i.prismHref && (
                <a
                  href={i.prismHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ms-auto shrink-0 rounded-sm text-xs outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  style={{ color: 'var(--insight-severity-info-fg)' }}
                >
                  Add in Prism
                  <span className="sr-only"> (opens in new tab)</span>
                </a>
              )}
            </div>
          ))}
        </div>
      )}

      {dups.length > 0 && (
        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium text-muted-foreground">Already covered</span>
          {dups.map(i => (
            <div key={i.key} className="flex items-center gap-2.5 px-2 py-1.5">
              <i className="fa-solid fa-lock text-xs shrink-0" style={{ color: 'var(--qb-status-blocked-fg)' }} aria-hidden="true" />
              <UnitAvatar i={i} />
              <span className="flex min-w-0 items-baseline gap-1.5 text-sm text-muted-foreground">
                <span className="truncate">{i.scope === 'course' ? 'Course material' : i.personName}</span>
                {i.roleLabel && i.scope !== 'course' && <span className="shrink-0 text-xs">· {i.roleLabel}</span>}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── The variant ──────────────────────────────────────────────────────────────

export default function VariantChipPreview() {
  const { rows, publishedTemplates, included, toggleUnit, setTemplateFor } = useStep2RowDetailDemo()
  const [openRows, setOpenRows] = useState<ReadonlySet<string>>(new Set())
  const toggleRow = (id: string) =>
    setOpenRows(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  const openRow = (id: string) => setOpenRows(prev => new Set(prev).add(id))

  const totalIncluded = useMemo(
    () => rows.reduce((n, r) => n + r.gate.fresh.filter(i => included.has(i.key)).length, 0),
    [rows, included],
  )

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs text-muted-foreground tabular-nums">
        {totalIncluded} evaluatee{totalIncluded !== 1 ? 's' : ''} selected across {rows.length} courses
      </p>

      <Card size="sm" className="gap-0 overflow-hidden py-0">
        <CardContent className="p-0">
          <div
            className="grid items-center gap-3 border-b border-border ps-3 pe-3 py-2 text-xs font-medium text-muted-foreground"
            style={{ gridTemplateColumns: GRID }}
          >
            <span />
            <span />
            <span>Course</span>
            <span>Template</span>
            <span>Evaluatees</span>
            <span>Status</span>
            <span>Action</span>
          </div>

          {rows.map(row => {
            const { offering, code, name, gate } = row
            const freshKeys = gate.fresh.map(i => i.key)
            const inCount = freshKeys.filter(k => included.has(k)).length
            const isOpen = openRows.has(offering.id)
            const criteria = row.template ? templateCriteria(row.template) : []
            return (
              <Collapsible
                key={offering.id}
                open={isOpen}
                onOpenChange={() => toggleRow(offering.id)}
                className="border-b border-border last:border-b-0"
              >
                {/* ── Collapsed row: state is READABLE here (chips), only
                       changeable inside — the ClickUp/Asana move. */}
                <div
                  className="grid items-center gap-3 ps-3 pe-3 py-2"
                  style={{ gridTemplateColumns: GRID, minHeight: 44 }}
                >
                  <span className="flex items-center">
                    <Checkbox
                      checked={
                        freshKeys.length > 0
                          ? (inCount === freshKeys.length ? true : inCount > 0 ? 'indeterminate' : false)
                          : false
                      }
                      disabled={freshKeys.length === 0}
                      onCheckedChange={v => {
                        // Course-level tri-state: checking selects every
                        // remaining unit, unchecking clears them all.
                        for (const k of freshKeys) {
                          const isIn = included.has(k)
                          if (v ? !isIn : isIn) toggleUnit(k)
                        }
                      }}
                      aria-label={`Include all evaluatees of ${code} in this push`}
                    />
                  </span>

                  <CollapsibleTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="group"
                      aria-label={`${isOpen ? 'Hide' : 'Show'} template and evaluatee controls for ${code}`}
                    >
                      <i
                        className="fa-light fa-chevron-down text-xs transition-transform group-data-[state=open]:rotate-180"
                        aria-hidden="true"
                      />
                    </Button>
                  </CollapsibleTrigger>

                  <span className="flex min-w-0 items-baseline gap-2">
                    <span className="shrink-0 font-mono text-xs tabular-nums text-muted-foreground">{code}</span>
                    {name && <span className="truncate text-sm">{name}</span>}
                  </span>

                  <span className="min-w-0"><TemplateChip row={row} /></span>

                  <EvaluateeCluster row={row} included={included} />

                  <span className="min-w-0"><RowStatus row={row} /></span>

                  <span className="min-w-0">
                    <RowAction row={row} onAssign={() => openRow(offering.id)} />
                  </span>
                </div>

                {/* ── Expanded panel: two real columns + a bottom toolbar —
                       the width is used, not left blank. */}
                <CollapsibleContent>
                  <div className="mx-4 mb-3 rounded-md border border-border bg-background">
                    <div className="grid gap-x-8 gap-y-4 p-4 md:grid-cols-[260px_minmax(0,1fr)]">
                      <div className="flex flex-col gap-2">
                        <span className="text-xs font-medium text-muted-foreground">Template</span>
                        <div className="flex items-center gap-1">
                          <span className="min-w-0 flex-1">
                            <Select
                              value={row.template?.id ?? ''}
                              onValueChange={v => setTemplateFor(offering.id, v)}
                            >
                              <SelectTrigger
                                size="sm"
                                aria-label={`Template for ${code}${!row.template ? ' · required' : ''}`}
                                className="w-full [&>span]:truncate [&>span]:min-w-0"
                              >
                                <SelectValue placeholder="Assign template" />
                              </SelectTrigger>
                              <SelectContent>
                                {publishedTemplates.map(t => (
                                  <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </span>
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            disabled={!row.template}
                            // Demo placeholder — the real step opens SurveyPreviewDialog here.
                            onClick={() => console.log('[demo] preview template', row.template?.name)}
                            aria-label={row.template ? `Preview the survey for ${code}` : 'Preview unavailable. Assign a template to preview.'}
                          >
                            <i className="fa-light fa-eye text-xs" aria-hidden="true" />
                          </Button>
                        </div>
                        {/* Switch-consequence meta — what this template makes
                            the push create, so changing it is informed. */}
                        {row.template ? (
                          <p className="text-xs text-muted-foreground tabular-nums">
                            {row.template.questionCount} question{row.template.questionCount !== 1 ? 's' : ''} · evaluates{' '}
                            {criteria
                              .map(c => (c === 'students' ? 'Course material' : CRITERION_BY_TYPE[row.mode][c]?.label ?? c))
                              .join(', ')}
                          </p>
                        ) : (
                          <p className="text-xs text-muted-foreground">
                            No surveys are created for this course until a template is assigned.
                          </p>
                        )}
                      </div>

                      <div className="flex flex-col gap-2">
                        <span className="text-xs font-medium text-muted-foreground">Evaluatees</span>
                        <EvaluateeList row={row} included={included} toggleUnit={toggleUnit} />
                      </div>
                    </div>

                    {/* Secondary actions get a real home — the toolbar the
                        shipped panel never had. Demo no-ops. */}
                    <div className="flex items-center justify-end gap-2 border-t border-border px-4 py-2.5">
                      <Button
                        variant="outline"
                        size="xs"
                        onClick={() => console.log('[demo] reset to default template', code)}
                      >
                        Reset to default template
                      </Button>
                      <Button
                        variant="outline"
                        size="xs"
                        onClick={() => console.log('[demo] remove from push', code)}
                      >
                        Remove from push
                      </Button>
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            )
          })}
        </CardContent>
      </Card>
    </div>
  )
}
