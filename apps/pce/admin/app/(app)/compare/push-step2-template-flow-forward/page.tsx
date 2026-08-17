'use client'

// COMPARE ROUTE (throwaway — same lifecycle as sibling /compare/push-step2-*
// routes, delete once a direction is picked, not wired into production).
//
// THE PROBLEM this answers: the shipped Step 2 template picker
// (courses-evaluatees/step-survey-instances.tsx) makes the admin choose
// BLIND, then tells them what they just did. Click a radio → an inline
// "consequence card" appears below the whole list ("Switch to X? Stops
// evaluating Y and adds Z. Switch/Keep"). Confirm that → if the new pick
// also role-overlaps an existing Draft/Scheduled survey, a SECOND, separate
// AlertDialog opens (Override vs Keep-both). Two interruptions, both AFTER
// the decision was already made once.
//
// THE MOVE: push the consequence INTO the option itself. Every template row
// in the picker carries its own caption, computed live against the row's
// actual committed template and its actual duplicate-detection state, so by
// the time an admin's cursor is over an option they already know what
// clicking it does — a second survey, a straight replace, or nothing
// worth mentioning. Analogy: Stripe's payment-method radio list annotating
// "No fee" / "2.9% + 30¢" directly under each option rather than after
// selection; Linear's cycle-picker showing "Ends in 3 days" inline per
// option instead of a follow-up toast.
//
// CAPTION ENGINE — reuses the real vocabulary, not new copy:
//   · "Replaces your current survey — adds X" / "— removes Y" / "— adds
//     nothing new" mirrors templateSwitchConsequence()'s exact added/removed
//     phrasing (step-survey-instances.tsx:275), just computed per-OPTION
//     instead of once for a single staged pick.
//   · "Would create a second survey — adds X" mirrors the real "Keep both"
//     dialog copy ("Also schedules X. Adds Y. Nothing sends twice.") — the
//     conflict test is the row's own `gate.dups` criterion set (the SAME
//     duplicate-detection the shipped Blocked badge already uses), not a
//     re-derivation: a criterion already blocked by an existing survey stays
//     blocked no matter which template asks for it next, so checking each
//     candidate's applicable criteria against `gate.dups`' criterion set is
//     the right (and only necessary) test — verified by reading
//     expandInstances()/roleOverlapConflicts() in pce-push-validation.ts.
//   · No caption at all = a clean switch (same criteria, or a first
//     assignment on a row with no template yet) — exactly the "say nothing
//     when there's nothing to say" case the brief asked for.
//
// WHAT HAPPENS AFTER THE CLICK — zero confirmations, and that's a verified
// claim, not a shortcut. `expandInstances()` (the same function `gate` is
// built from) never deletes or mutates an existing survey — picking a
// conflicting template only ever recomputes which instances count as 'new'
// vs 'duplicate' for the NEXT push; the duplicate stays exactly where it
// was, untouched. So "Would create a second survey" IS what clicking does,
// completely — there's no hidden Override lurking behind it, unlike the
// shipped flow's second AlertDialog. The one place a real, data-discarding
// Override exists in production is `pendingReassign` (the separate
// offering-level "replace what governs this course's own push" dialog) —
// out of scope here per the brief, and worth noting its own type already
// restricts `existingStatus` to 'draft' | 'scheduled', never 'live'
// (step-survey-instances.tsx:154) — the real app has never allowed
// discarding a Live survey's data through this path either. Given neither
// this harness nor the production code exposes a click that destroys
// in-flight response data, there is no case here that clears the bar the
// brief set for "deserves one final confirm" — so every option in this
// picker commits the instant it's clicked, same as a plain radio, because
// the caption already told the truth before the click happened.
//
// HONEST TRADEOFF: every option now carries a caption, including options
// the admin has no intention of picking — a 4-template list is measurably
// taller and takes longer to scan than the shipped bare radio list, and on
// a row with a wide template catalog this cost is paid on every render,
// not just the one time a switch actually happens. Worth it here because
// Step 2's real cost center is the admin backing out of a pick they didn't
// understand, not the read time of a longer list — but it's a real, non-zero
// cost, not a free upgrade.

import { useMemo, useState } from 'react'
import Link from 'next/link'
import {
  AvatarGroup, AvatarGroupCount,
  Badge, Button, Card, CardContent, Checkbox,
  Collapsible, CollapsibleContent, CollapsibleTrigger,
  Label, RadioGroup, RadioGroupItem,
  Tip,
} from '@exxatdesignux/ui'
import { cn } from '@/lib/utils'
import { PersonAvatar } from '@/components/pce/person-avatar'
import { ListHubStatusBadge } from '@/components/list-hub-status-badge'
import {
  LIST_HUB_STATUS_TINT_SUCCESS, LIST_HUB_STATUS_TINT_WARNING,
  LIST_HUB_STATUS_TINT_DANGER, LIST_HUB_STATUS_TINT_INFO,
} from '@/lib/list-status-badges'
import { StoryStatusBadgeOS } from '@/components/pce/pce-badges'
import { type Criterion } from '@/lib/pce-course-readiness'
import {
  useStep2RowDetailDemo, storyStatusOf, templateCriteria, CRITERION_BY_TYPE,
  evaluateeLabel,
  type DemoRow, type SurveyInstance, type PceTemplate,
} from '../push-step2-row-detail/_shared'

const listFmt = (items: string[]) => new Intl.ListFormat('en', { style: 'long', type: 'conjunction' }).format(items)

// checkbox · chevron · course · template chip · evaluatees · status
const GRID = `24px 24px minmax(0,1fr) minmax(0,210px) 150px 110px`

// ═══════════════════════════════════════════════════════════════════════════
// Consequence engine — one caption per candidate template, computed against
// THIS row's committed template + THIS row's real gate.dups. See header for
// why gate.dups (rather than re-running expandInstances per candidate) is
// the correct test.
// ═══════════════════════════════════════════════════════════════════════════

type CaptionKind = 'conflict' | 'replace' | null

interface PickerCaption {
  kind: CaptionKind
  text: string
  /** 'conflict' only — templateId of the already-scheduled survey blocking
   *  this pick, so the S3 escape hatch ("Edit it instead") can link straight
   *  to it. See step-survey-instances.tsx's `existingTemplate` for the same
   *  resolution against the published-templates list. */
  existingTemplateId?: string | null
}

const NO_CAPTION: PickerCaption = { kind: null, text: '' }

function applicableCriteria(mode: DemoRow['mode'], t: PceTemplate | null): Criterion[] {
  return (t ? templateCriteria(t) : []).filter(c => c === 'students' || !!CRITERION_BY_TYPE[mode][c])
}
function criterionLabel(mode: DemoRow['mode'], c: Criterion): string | undefined {
  return c === 'students' ? 'Course material' : CRITERION_BY_TYPE[mode][c]?.label
}

function pickerCaption(row: DemoRow, candidate: PceTemplate): PickerCaption {
  if (row.template?.id === candidate.id) return NO_CAPTION

  const label = (c: Criterion) => criterionLabel(row.mode, c)
  const curCriteria = applicableCriteria(row.mode, row.template)
  const candCriteria = applicableCriteria(row.mode, candidate)
  const curSet = new Set(curCriteria)
  const candSet = new Set(candCriteria)
  const added = candCriteria.filter(c => !curSet.has(c))
  const removed = curCriteria.filter(c => !candSet.has(c))

  // Real conflict test — the SAME criteria already blocked by an existing
  // survey for this offering (row.gate.dups, built by the shipped
  // expandInstances) stay blocked for ANY template that also asks for them.
  const dupCriteria = new Set(row.gate.dups.map(i => i.criterion))
  const conflictCriteria = candCriteria.filter(c => dupCriteria.has(c))

  if (conflictCriteria.length > 0) {
    const conflictLabels = [...new Set(conflictCriteria.map(label))].filter((l): l is string => !!l)
    const freshAdded = added.filter(c => !dupCriteria.has(c)).map(label).filter((l): l is string => !!l)
    const blockingDup = row.gate.dups.find(i => conflictCriteria.includes(i.criterion))
    const blockStatus = blockingDup?.existing ? storyStatusOf(blockingDup.existing) : null
    const statusWord = blockStatus ? blockStatus.charAt(0).toUpperCase() + blockStatus.slice(1) : 'existing'
    const text = freshAdded.length > 0
      ? `Would create a second survey — adds ${listFmt(freshAdded)}. A ${statusWord} survey already covers ${listFmt(conflictLabels)}.`
      : `Would create a second survey, but covers nothing beyond what a ${statusWord} survey already tracks.`
    return { kind: 'conflict', text, existingTemplateId: blockingDup?.existing?.templateId ?? null }
  }

  // No template committed yet — a first assignment, not a switch. Nothing
  // to "replace," so nothing extra to say (the clean-switch case).
  if (!row.template) return NO_CAPTION
  if (added.length === 0 && removed.length === 0) return NO_CAPTION

  const addedLabels = added.map(label).filter((l): l is string => !!l)
  const removedLabels = removed.map(label).filter((l): l is string => !!l)
  let text: string
  if (addedLabels.length > 0 && removedLabels.length > 0) {
    text = `Replaces your current survey — adds ${listFmt(addedLabels)} and stops evaluating ${listFmt(removedLabels)}.`
  } else if (addedLabels.length > 0) {
    text = `Replaces your current survey — adds ${listFmt(addedLabels)}. Nothing is removed.`
  } else if (removedLabels.length > 0) {
    text = `Replaces your current survey — adds nothing new. Stops evaluating ${listFmt(removedLabels)}.`
  } else {
    text = `Replaces your current survey with the same aspects, different questions.`
  }
  return { kind: 'replace', text }
}

// ── shared small pieces (mirrors the vocabulary the row-detail variants proved) ──

function UnitAvatar({ i, className }: { i: SurveyInstance; className?: string }) {
  return i.scope === 'course' ? (
    <span className={cn('size-6 rounded-full flex items-center justify-center border border-border bg-background shrink-0', className)}>
      <i className="fa-light fa-book-open text-[10px] text-muted-foreground" aria-hidden="true" />
    </span>
  ) : (
    <PersonAvatar name={i.personName ?? ''} className={className} />
  )
}

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
      <span tabIndex={0} className="inline-flex max-w-full min-w-0 rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1">
        <Badge variant="secondary" className="max-w-full min-w-0">
          <i className="fa-light fa-file-lines text-xs shrink-0" aria-hidden="true" />
          <span className="truncate">{row.template.name}</span>
        </Badge>
      </span>
    </Tip>
  )
}

function EvaluateeCluster({ row, included }: { row: DemoRow; included: ReadonlySet<string> }) {
  const inUnits = row.gate.fresh.filter(i => included.has(i.key))
  const shown = inUnits.slice(0, 3)
  const extra = inUnits.length - shown.length
  const gapCount = row.gate.gaps.length
  const summary = inUnits.length > 0
    ? `Included in this push: ${inUnits.map(evaluateeLabel).join(', ')}.`
    : 'No evaluatees included.'
  return (
    <span className="flex min-w-0 items-center">
      <span className="sr-only">{summary}</span>
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
    const detail = reasons.map(r => {
      if (r === 'overlap') {
        const roles = [...new Set(dups.map(i => i.roleLabel || 'Course material'))]
        return `${roles.join(', ')} already covered`
      }
      return 'No template assigned'
    }).join(' · ')
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

// ── the redesigned picker itself ──────────────────────────────────────────

function TemplateOption({ row, template, active, publishedTemplates }: {
  row: DemoRow
  template: PceTemplate
  active: boolean
  publishedTemplates: PceTemplate[]
}) {
  const caption = pickerCaption(row, template)
  const inputId = `pk-${row.offering.id}-${template.id}`
  const tint = caption.kind === 'conflict' ? LIST_HUB_STATUS_TINT_WARNING : LIST_HUB_STATUS_TINT_INFO
  // S3 escape hatch — resolved right here, the exact moment this option's
  // own caption tells the admin picking it would create a second survey.
  // Mirrors step-survey-instances.tsx's `existingTemplate` lookup (line
  // ~2231): resolve the blocking survey's templateId against the published
  // list to get a name + id for the "Edit it instead" link.
  const existingTemplate = caption.kind === 'conflict' && caption.existingTemplateId
    ? publishedTemplates.find(t => t.id === caption.existingTemplateId) ?? null
    : null
  return (
    <div
      className="flex w-full items-start gap-2.5 rounded-md border p-2.5 min-w-0"
      style={{ borderColor: active ? 'var(--primary)' : 'var(--border)', background: 'var(--card)' }}
    >
      <RadioGroupItem value={template.id} id={inputId} className="mt-0.5 shrink-0" />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <Label htmlFor={inputId} className="flex min-w-0 cursor-pointer flex-col gap-1">
          <span className="truncate text-sm font-medium">{template.name}</span>
          <span className="truncate text-xs text-muted-foreground">
            {template.questionCount} question{template.questionCount !== 1 ? 's' : ''}
          </span>
          {caption.kind && (
            <span
              className="flex items-start gap-1.5 rounded-sm px-1.5 py-1 text-xs"
              style={{ color: tint.fg, background: tint.bg }}
            >
              <i
                className={cn('text-xs shrink-0 mt-0.5', caption.kind === 'conflict' ? 'fa-light fa-triangle-exclamation' : 'fa-light fa-arrow-right-arrow-left')}
                aria-hidden="true"
              />
              <span>{caption.text}</span>
            </span>
          )}
        </Label>
        {/* S3 escape hatch — a SIBLING of the Label, not nested inside it,
            so the link's text never folds into the radio's accessible name
            (same compliance-review fix step-survey-instances.tsx already
            made). Opens the already-scheduled template in a new tab. */}
        {existingTemplate && (
          <p className="text-xs text-muted-foreground">
            Only need one more aspect?{' '}
            <Link
              href={`/templates/${existingTemplate.id}`}
              target="_blank"
              rel="noreferrer"
              className="underline underline-offset-2"
            >
              Edit it instead
              <span className="sr-only"> (opens &ldquo;{existingTemplate.name}&rdquo; in a new tab; the template must be unpublished to edit)</span>
            </Link>
          </p>
        )}
      </div>
    </div>
  )
}

function TemplatePicker({ row, publishedTemplates, setTemplateFor }: {
  row: DemoRow
  publishedTemplates: PceTemplate[]
  setTemplateFor: (offeringId: string, templateId: string) => void
}) {
  const typeMatches = row.offering.courseType
    ? publishedTemplates.filter(t => !t.courseType || t.courseType === 'any' || t.courseType === row.offering.courseType)
    : publishedTemplates

  if (typeMatches.length === 0) {
    return <p className="text-xs text-muted-foreground">No templates for this course type.</p>
  }

  return (
    <RadioGroup
      value={row.template?.id ?? ''}
      onValueChange={id => setTemplateFor(row.offering.id, id)}
      className="flex flex-col gap-2"
      aria-label={`Template for ${row.code}${!row.template ? ' · required' : ''}`}
    >
      {typeMatches.map(t => (
        <TemplateOption key={t.id} row={row} template={t} active={t.id === row.template?.id} publishedTemplates={publishedTemplates} />
      ))}
    </RadioGroup>
  )
}

// ── evaluatees — kept minimal per the brief; only the three real states ──

function EvaluateeList({ row, included, toggleUnit }: {
  row: DemoRow
  included: ReadonlySet<string>
  toggleUnit: (key: string) => void
}) {
  const { fresh, gaps, dups } = row.gate
  // S4 demo addition — a synthetic 4th roster person, not part of the real
  // gate.fresh/gaps/dups model (this harness doesn't simulate Auto Update
  // deeply). Local state is fine here: only DPT-510 renders it below, and
  // hooks must still run unconditionally on every render. Mirrors
  // push-step2-accordion-layout's ExcludedRow for Dr. James Kim.
  const [demoIncluded, setDemoIncluded] = useState(false)
  if (fresh.length === 0 && gaps.length === 0 && dups.length === 0) {
    return <span className="text-xs text-muted-foreground">Pick a template to see who this push would evaluate.</span>
  }
  // S1 — human vs. non-human aspect split (spec §2, Aug 4 call): "Course
  // material" is a structural aspect, never a person to assign, so it gets
  // its own static line — never interleaved with the People checkbox rows.
  // "Never clickable — no popover, since there's nothing to assign" (spec).
  const courseFresh = fresh.filter(i => i.scope === 'course')
  const personFresh = fresh.filter(i => i.scope !== 'course')
  const showDemoExcluded = row.code === 'DPT-510'
  return (
    <div className="flex flex-col gap-3">
      {courseFresh.length > 0 && (
        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium text-muted-foreground">Course content</span>
          {courseFresh.map(i => (
            <div key={i.key} className="flex items-center gap-2.5 rounded-md px-2 py-1.5">
              <UnitAvatar i={i} className={cn(!included.has(i.key) && 'grayscale')} />
              <span className={cn('text-sm', !included.has(i.key) && 'text-muted-foreground')}>Course material</span>
            </div>
          ))}
        </div>
      )}
      {(personFresh.length > 0 || showDemoExcluded) && (
        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium text-muted-foreground">People</span>
          {personFresh.map(i => {
            const id = `ev-${i.key.replace(/[^a-zA-Z0-9_-]/g, '_')}`
            return (
              <div key={i.key} className="flex items-center gap-2.5 rounded-md px-2 py-1.5 hover:bg-accent/50">
                <Checkbox id={id} checked={included.has(i.key)} onCheckedChange={() => toggleUnit(i.key)} />
                <UnitAvatar i={i} />
                <label htmlFor={id} className="flex min-w-0 cursor-pointer items-baseline gap-1.5 text-sm">
                  <span className="truncate">{i.personName}</span>
                  {i.roleLabel && <span className="shrink-0 text-xs text-muted-foreground">· {i.roleLabel}</span>}
                </label>
              </div>
            )
          })}
          {/* S4 demo addition — third avatar state (spec §5): exists in Prism,
              not in the current survey, distinct from both "included" (solid)
              and "gap" (dashed). Synthetic person; no real fixture models this
              row's Auto-Update-off state. */}
          {showDemoExcluded && (
            <Label className="mt-1 flex cursor-pointer items-center gap-2.5 rounded-md border border-border p-2.5" style={{ background: 'var(--card)' }}>
              <PersonAvatar name="Dr. Maria Torres" className={demoIncluded ? 'size-6' : 'size-6 grayscale'} />
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-sm font-medium">Dr. Maria Torres</span>
                <span className="truncate text-xs text-muted-foreground">
                  {demoIncluded ? 'Instructor' : 'In Prism, not included — Auto Update is off'}
                </span>
              </span>
              <Checkbox checked={demoIncluded} onCheckedChange={() => setDemoIncluded(v => !v)} aria-label="Include Dr. Maria Torres" />
            </Label>
          )}
        </div>
      )}
      {gaps.length > 0 && (
        <div className="flex flex-col gap-1">
          {gaps.map(i => (
            <div key={i.key} className="flex items-center gap-2.5 px-2 py-1.5">
              <GapDisc />
              <span className="min-w-0 truncate text-sm">No {i.roleLabel} assigned</span>
            </div>
          ))}
        </div>
      )}
      {dups.length > 0 && (
        <div className="flex flex-col gap-1">
          {dups.map(i => (
            <div key={i.key} className="flex items-center gap-2.5 px-2 py-1.5">
              <i className="fa-solid fa-lock text-xs shrink-0" style={{ color: 'var(--qb-status-blocked-fg)' }} aria-hidden="true" />
              <UnitAvatar i={i} />
              <span className="flex min-w-0 items-baseline gap-1.5 text-sm text-muted-foreground">
                <span className="truncate">{i.scope === 'course' ? 'Course material' : i.personName}</span>
                {i.roleLabel && i.scope !== 'course' && <span className="shrink-0 text-xs">· {i.roleLabel}</span>}
              </span>
              {i.existing && <StoryStatusBadgeOS status={storyStatusOf(i.existing)} size="sm" />}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── the page ─────────────────────────────────────────────────────────────

export default function PushStep2TemplateFlowForwardComparePage() {
  const { rows, publishedTemplates, included, toggleUnit, setTemplateFor } = useStep2RowDetailDemo()
  const [openRows, setOpenRows] = useState<ReadonlySet<string>>(new Set())
  const toggleRow = (id: string) =>
    setOpenRows(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })

  const totalIncluded = useMemo(
    () => rows.reduce((n, r) => n + r.gate.fresh.filter(i => included.has(i.key)).length, 0),
    [rows, included],
  )

  return (
    <div className="flex flex-col gap-5 p-6 max-w-[1100px] mx-auto">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold font-heading">Consequence-forward template picker</h1>
        <p className="text-sm text-muted-foreground">
          Same 6 real offerings (Fall 2026–2027) as the row-detail round. Every template option carries its own
          live-computed consequence caption — read it, then click. Nothing asks you to confirm twice.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-4 rounded-md border border-border p-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="inline-block size-2.5 rounded-full" style={{ background: LIST_HUB_STATUS_TINT_INFO.fg }} aria-hidden="true" />
          Replace — swaps what this course's survey covers
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block size-2.5 rounded-full" style={{ background: LIST_HUB_STATUS_TINT_WARNING.fg }} aria-hidden="true" />
          Conflict — a second survey would be created; the already-covered part stays locked
        </span>
        <span>No caption = clean switch, nothing else changes.</span>
      </div>

      <p className="text-xs text-muted-foreground tabular-nums">
        {totalIncluded} evaluatee{totalIncluded !== 1 ? 's' : ''} selected across {rows.length} courses
      </p>

      <Card size="sm" className="gap-0 overflow-hidden py-0">
        <CardContent className="p-0">
          <div className="grid items-center gap-3 border-b border-border ps-3 pe-3 py-2 text-xs font-medium text-muted-foreground" style={{ gridTemplateColumns: GRID }}>
            <span />
            <span />
            <span>Course</span>
            <span>Template</span>
            <span>Evaluatees</span>
            <span>Status</span>
          </div>

          {rows.map(row => {
            const { offering, code, name, gate } = row
            const freshKeys = gate.fresh.map(i => i.key)
            const inCount = freshKeys.filter(k => included.has(k)).length
            const isOpen = openRows.has(offering.id)
            return (
              <Collapsible key={offering.id} open={isOpen} onOpenChange={() => toggleRow(offering.id)} className="border-b border-border last:border-b-0">
                <div className="grid items-center gap-3 ps-3 pe-3 py-2" style={{ gridTemplateColumns: GRID, minHeight: 44 }}>
                  <span className="flex items-center">
                    <Checkbox
                      checked={freshKeys.length > 0 ? (inCount === freshKeys.length ? true : inCount > 0 ? 'indeterminate' : false) : false}
                      disabled={freshKeys.length === 0}
                      onCheckedChange={v => {
                        for (const k of freshKeys) {
                          const isIn = included.has(k)
                          if (v ? !isIn : isIn) toggleUnit(k)
                        }
                      }}
                      aria-label={`Include all evaluatees of ${code} in this push`}
                    />
                  </span>
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" size="icon-sm" className="group" aria-label={`${isOpen ? 'Hide' : 'Show'} template and evaluatee controls for ${code}`}>
                      <i className="fa-light fa-chevron-down text-xs transition-transform group-data-[state=open]:rotate-180" aria-hidden="true" />
                    </Button>
                  </CollapsibleTrigger>
                  <span className="flex min-w-0 items-baseline gap-2">
                    <span className="shrink-0 font-mono text-xs tabular-nums text-muted-foreground">{code}</span>
                    {name && <span className="truncate text-sm">{name}</span>}
                  </span>
                  <span className="min-w-0"><TemplateChip row={row} /></span>
                  <EvaluateeCluster row={row} included={included} />
                  <span className="min-w-0"><RowStatus row={row} /></span>
                </div>

                <CollapsibleContent>
                  <div className="mx-4 mb-3 rounded-md border border-border bg-background">
                    <div className="grid gap-x-8 gap-y-4 p-4 md:grid-cols-[minmax(0,340px)_minmax(0,1fr)]">
                      <div className="flex flex-col gap-2 min-w-0">
                        <span className="text-xs font-medium text-muted-foreground">Template</span>
                        <TemplatePicker row={row} publishedTemplates={publishedTemplates} setTemplateFor={setTemplateFor} />
                      </div>
                      <div className="flex flex-col gap-2 min-w-0">
                        <span className="text-xs font-medium text-muted-foreground">Evaluatees</span>
                        <EvaluateeList row={row} included={included} toggleUnit={toggleUnit} />
                      </div>
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
