'use client'

// COMPARE ROUTE (throwaway — same lifecycle as sibling /compare/push-step2-*
// routes, delete once a direction is picked, not wired into production).
//
// Redesign target: the shipped template-reassignment flow in the real Step 2
// (components/pce/courses-evaluatees/step-survey-instances.tsx) makes an
// admin clear TWO separate "are you sure" moments to do ONE thing —
// re-point a course's template:
//
//   1. Pick a different template in the radio list → an inline
//      "consequenceCard" appears below it ("Switch to X? Stops evaluating Y
//      and adds Z." — Switch/Keep buttons). See templateSwitchConsequence()
//      and the consequenceCard JSX, step-survey-instances.tsx:275 / :1085.
//   2. Click "Switch template" → if the offering's committed template
//      already collides with a real Draft/Scheduled/Live survey (gate.dups),
//      a SEPARATE AlertDialog pops up (pendingReassign, :2228) asking
//      Override-vs-Create-new, restating added/removed roles with its own
//      avatar rail — copy/logic pattern mirrored faithfully in
//      /compare/push-step2-accordion-layout's ReassignDialog (line ~166).
//
// Product complaint (Romit, 2026-08-05): that's two sequential "here's what
// changes, confirm" moments for one decision. This variant collapses them
// into ONE surface that appears the instant a different template is picked:
//
//   · No real conflict (row.gate.dups.length === 0 — the common case, e.g.
//     DPT-501/503/502/505/610): a single lightweight strip appears under the
//     radio list — one sentence of consequence (added/removed criteria,
//     same voice as templateSwitchConsequence) + Apply/Keep current. No
//     override/create-new machinery is even mounted — nothing to dismiss
//     twice.
//   · Real conflict (DPT-510 — gate.dups.length > 0, it already carries a
//     Live survey): the SAME strip grows in place to also show the
//     Replace-vs-Keep-both radio choice (copy voice lifted verbatim from
//     ReassignDialog: "Also schedules X… nothing sends twice" / "Y takes its
//     place… stops evaluating…"), with avatars for who's added/removed, and
//     ONE primary button whose label follows the selected radio ("Replace
//     template" / "Keep both templates"). There is no second dialog to open
//     — the choice and its consequence live in the same box, in the same
//     click.
//
// Known scope simplification, called out honestly rather than hidden: the
// _shared.tsx harness models exactly ONE committed template per offering
// (same as the real DemoRow/useStep2RowDetailDemo contract — see that
// file's setTemplateFor). "Keep both templates" therefore can't be written
// back into the harness's real state; it's tracked in a small LOCAL
// secondaryTemplate map here, purely so the resulting "Also evaluating" row
// renders — the exact same trick /compare/push-step2-accordion-layout uses
// for its secondaryTemplateId. Replace, by contrast, calls the harness's
// real setTemplateFor and is genuinely live — DPT-510's template really
// changes, the row's status badge and evaluatee list really recompute.
//
// Evaluatees stay intentionally minimal (existing avatar-rail vocabulary,
// no new pattern) — this compare round is about the Template area only.

import { useState } from 'react'
import Link from 'next/link'
import {
  AvatarGroup, Badge, Button, Card, CardContent, Checkbox,
  Collapsible, CollapsibleContent, CollapsibleTrigger,
  Label, RadioGroup, RadioGroupItem,
} from '@exxatdesignux/ui'
import { cn } from '@/lib/utils'
import { PersonAvatar } from '@/components/pce/person-avatar'
import { StoryStatusBadgeOS } from '@/components/pce/pce-badges'
import { ListHubStatusBadge } from '@/components/list-hub-status-badge'
import {
  LIST_HUB_STATUS_TINT_SUCCESS, LIST_HUB_STATUS_TINT_WARNING, LIST_HUB_STATUS_TINT_DANGER,
} from '@/lib/list-status-badges'
import {
  useStep2RowDetailDemo, splitLabel, storyStatusOf, templateCriteria, CRITERION_BY_TYPE,
  type DemoRow, type PceTemplate, type SurveyInstance,
} from '../push-step2-row-detail/_shared'

const listFmt = (items: string[]) => new Intl.ListFormat('en', { style: 'long', type: 'conjunction' }).format(items)

/** Person avatar, or the course-material glyph disc — same vocabulary the
 *  shipped step and every sibling compare route already use, not reinvented
 *  here. */
function UnitAvatar({ i, className }: { i: SurveyInstance; className?: string }) {
  return i.scope === 'course' ? (
    <span className={cn('size-6 rounded-full flex items-center justify-center border border-border bg-background shrink-0', className)}>
      <i className="fa-light fa-book-open text-[10px] text-muted-foreground" aria-hidden="true" />
    </span>
  ) : (
    <PersonAvatar name={i.personName ?? ''} className={className} />
  )
}

/** Dashed "role needs a person" disc — same chip-4 dashed vocabulary used
 *  throughout the real step and its compare siblings. */
function GapDisc() {
  return (
    <span
      className="size-6 rounded-full flex items-center justify-center border border-dashed shrink-0"
      style={{ borderColor: 'var(--chip-4)', color: 'var(--chip-4)' }}
    >
      <i className="fa-light fa-user-plus text-[10px]" aria-hidden="true" />
    </span>
  )
}

// Note: `gate.dups` deliberately does NOT drive this badge — it's read
// directly by the unified template surface below instead. A row can read
// "Ready" here and still carry a real conflicting survey once a different
// template is staged (that's exactly DPT-510's case at rest).
function RowStatus({ row }: { row: DemoRow }) {
  const { reasons, gaps } = row.gate
  if (reasons.length > 0) {
    return <ListHubStatusBadge label="Blocked" tint={LIST_HUB_STATUS_TINT_DANGER} icon="fa-lock" />
  }
  if (gaps.length > 0) {
    return <ListHubStatusBadge label="Gap" tint={LIST_HUB_STATUS_TINT_WARNING} icon="fa-user-slash" />
  }
  return <ListHubStatusBadge label="Ready" tint={LIST_HUB_STATUS_TINT_SUCCESS} icon="fa-circle-check" />
}

/** Criteria a template covers, filtered to ones this offering's delivery
 *  mode actually resolves — same "not applicable to this mode = drop it"
 *  rule as templateSwitchConsequence (step-survey-instances.tsx:275) and
 *  ReassignDialog's `applicable()` (accordion-layout/page.tsx:2254). */
function applicableCriteria(row: DemoRow, t: PceTemplate | null): string[] {
  if (!t) return []
  return templateCriteria(t)
    .filter(c => c === 'students' || !!CRITERION_BY_TYPE[row.mode][c])
    .map(c => (c === 'students' ? 'Course material' : CRITERION_BY_TYPE[row.mode][c]?.label))
    .filter((l): l is string => !!l)
}

function diffOf(row: DemoRow, from: PceTemplate | null, to: PceTemplate) {
  const fromCriteria = applicableCriteria(row, from)
  const toCriteria = applicableCriteria(row, to)
  const fromSet = new Set(fromCriteria)
  const toSet = new Set(toCriteria)
  return {
    added: toCriteria.filter(c => !fromSet.has(c)),
    removed: fromCriteria.filter(c => !toSet.has(c)),
  }
}

// ═════════════════════════════════════════════════════════════════════════
// The unified decision surface — the actual redesign. One component, one
// mount, both the lightweight no-conflict case and the full conflict case
// live inside it; nothing else pops a second dialog on top of it.
// ═════════════════════════════════════════════════════════════════════════
function UnifiedTemplateDecision({
  row, staged, onApply, onCancel, secondaryTemplate,
}: {
  row: DemoRow
  staged: PceTemplate
  onApply: (choice: 'replace' | 'keep-both') => void
  onCancel: () => void
  secondaryTemplate: PceTemplate | null
}) {
  const hasConflict = row.gate.dups.length > 0
  const [choice, setChoice] = useState<'replace' | 'keep-both'>('replace')
  const { added, removed } = diffOf(row, row.template, staged)

  const consequenceSentence = (() => {
    if (removed.length > 0 && added.length > 0) {
      return <>Stops evaluating <span className="font-medium text-foreground">{listFmt(removed)}</span> and adds <span className="font-medium text-foreground">{listFmt(added)}</span>.</>
    }
    if (removed.length > 0) {
      return <>Stops evaluating <span className="font-medium text-foreground">{listFmt(removed)}</span> and adds nothing new.</>
    }
    if (added.length > 0) {
      return <>Adds <span className="font-medium text-foreground">{listFmt(added)}</span>. Nothing else changes.</>
    }
    return <>Same aspects, different questions.</>
  })()

  // ── Lightweight path — no real conflict. One sentence, two buttons, no
  //    override/create-new machinery even mounted. ──────────────────────
  if (!hasConflict) {
    return (
      <div className="flex flex-col gap-2 rounded-md border border-border p-2.5" style={{ background: 'var(--muted)' }}>
        <p className="text-xs text-muted-foreground">
          <i className="fa-light fa-arrow-right-arrow-left me-1.5" aria-hidden="true" />
          Switch to <span className="font-medium text-foreground">{staged.name}</span>? {consequenceSentence}
        </p>
        <div className="flex gap-1.5">
          <Button variant="default" size="xs" onClick={() => onApply('replace')}>Switch template</Button>
          <Button variant="ghost" size="xs" onClick={onCancel}>Keep current</Button>
        </div>
      </div>
    )
  }

  // ── Full path — real conflict (DPT-510). Same box, same moment, now also
  //    carrying the Replace-vs-Keep-both choice that the shipped flow only
  //    asks in a second, separate AlertDialog. ────────────────────────────
  const addedAvatars = added.length > 0
  const removedAvatars = removed.length > 0
  const blockingSurvey = row.gate.dups[0]?.existing ?? null

  return (
    <div className="flex flex-col gap-3 rounded-md border p-3" style={{ borderColor: 'var(--chip-4)', background: 'var(--card)' }}>
      <div className="flex flex-col gap-1">
        <p className="text-sm">
          <i className="fa-light fa-arrow-right-arrow-left me-1.5 text-xs" aria-hidden="true" style={{ color: 'var(--chip-4)' }} />
          Switch <span className="font-medium">{row.code}</span> to <span className="font-medium">{staged.name}</span>?
        </p>
        {blockingSurvey && (
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <i className="fa-solid fa-lock text-[10px]" aria-hidden="true" />
            A survey already runs for this course
            <StoryStatusBadgeOS status={storyStatusOf(blockingSurvey)} size="sm" />
          </p>
        )}
      </div>

      <RadioGroup
        value={choice}
        onValueChange={v => setChoice(v as 'replace' | 'keep-both')}
        className="flex flex-col divide-y divide-border"
        aria-label={`How to apply the template change for ${row.code}`}
      >
        <Label className="flex items-start gap-2 cursor-pointer py-2">
          <RadioGroupItem value="replace" id={`${row.offering.id}-replace`} className="mt-0.5" />
          <span className="flex flex-col gap-1 min-w-0">
            <span className="text-sm font-medium">Replace</span>
            <span className="text-xs text-muted-foreground">
              {staged.name} takes its place. {consequenceSentence}
            </span>
            {(addedAvatars || removedAvatars) && (
              <span className="flex flex-wrap items-center gap-x-3 gap-y-1 pt-0.5">
                {removedAvatars && (
                  <span className="flex items-center gap-1">
                    <span className="text-[10px] uppercase tracking-normal text-muted-foreground">Removed</span>
                    <AvatarGroup aria-hidden="true">
                      {row.gate.dups.slice(0, 3).map(i => <UnitAvatar key={i.key} i={i} className="size-5 grayscale" />)}
                    </AvatarGroup>
                  </span>
                )}
                {addedAvatars && (
                  <span className="flex items-center gap-1">
                    <span className="text-[10px] uppercase tracking-normal text-muted-foreground">Adds</span>
                    <GapDisc />
                  </span>
                )}
              </span>
            )}
          </span>
        </Label>
        <div className="flex flex-col gap-1 py-2">
          <Label className="flex items-start gap-2 cursor-pointer">
            <RadioGroupItem value="keep-both" id={`${row.offering.id}-keep-both`} className="mt-0.5" />
            <span className="flex flex-col gap-1 min-w-0">
              <span className="text-sm font-medium">Keep both</span>
              <span className="text-xs text-muted-foreground">
                Also schedules {staged.name}.{' '}
                {added.length > 0
                  ? <>Adds <span className="font-medium text-foreground">{listFmt(added)}</span>. Nothing sends twice.</>
                  : <>It covers nothing the current survey does not already. Nothing sends twice.</>}
              </span>
            </span>
          </Label>
          {/* S3 escape hatch — same shipped moment as
              step-survey-instances.tsx:2347. A sibling of the Label, not
              nested inside it, so the link text doesn't fold into the
              radio's accessible name. row.template is the already-scheduled
              template this offering currently carries — editing it directly
              is often the cleaner fix than staging a second template. */}
          {row.template && (
            <p className="text-xs text-muted-foreground ps-6">
              Only need one more aspect?{' '}
              <Link
                href={`/templates/${row.template.id}`}
                target="_blank"
                rel="noreferrer"
                className="underline underline-offset-2"
              >
                Edit it instead
                <span className="sr-only"> (opens &ldquo;{row.template.name}&rdquo; in a new tab; the template must be unpublished to edit)</span>
              </Link>
            </p>
          )}
        </div>
      </RadioGroup>

      <div className="flex items-center gap-1.5 border-t border-border pt-2.5">
        <Button variant="default" size="xs" onClick={() => onApply(choice)}>
          {choice === 'replace' ? 'Replace template' : 'Keep both templates'}
        </Button>
        <Button variant="ghost" size="xs" onClick={onCancel}>Cancel</Button>
      </div>

      {secondaryTemplate && (
        <p className="text-xs text-muted-foreground">
          Currently also evaluating under <span className="font-medium text-foreground">{secondaryTemplate.name}</span> from a prior "Keep both" choice — picking Replace or Keep both again here updates this decision, not that one.
        </p>
      )}
    </div>
  )
}

// ── Evaluatees — S1 human vs. non-human split (spec
// docs/specs/2026-08-04-step2-scenario-redesign.md §2): "Course material" is
// a non-human aspect that can never take a person, so it renders as its own
// small static-weighted section ABOVE a separate "People" section, rather
// than interleaved into the same flat, hover-highlighted list as person
// rows. It stays togglable (Auto Update can still exclude it) — the change
// here is visual grouping, not removing the control.
function EvaluateeRail({ row, included, toggleUnit, excludedDemo }: {
  row: DemoRow
  included: ReadonlySet<string>
  toggleUnit: (key: string) => void
  /** S4 demo-only addition — see call site in RowDetail. Not part of the
   *  harness's real gate data. */
  excludedDemo?: { included: boolean; onToggle: () => void }
}) {
  const { fresh, gaps, dups } = row.gate
  const courseFresh = fresh.filter(i => i.scope === 'course')
  const courseDups = dups.filter(i => i.scope === 'course')
  const personFresh = fresh.filter(i => i.scope !== 'course')
  const personGaps = gaps.filter(i => i.scope !== 'course')
  const personDups = dups.filter(i => i.scope !== 'course')
  const hasCourse = courseFresh.length > 0 || courseDups.length > 0
  const hasPeople = personFresh.length > 0 || personGaps.length > 0 || personDups.length > 0 || !!excludedDemo

  if (!hasCourse && !hasPeople) {
    return <span className="text-xs text-muted-foreground">Assign a template to see who this push would evaluate.</span>
  }

  return (
    <div className="flex flex-col gap-3">
      {hasCourse && (
        <div className="flex flex-col gap-1.5">
          <span className="text-[11px] font-medium uppercase tracking-normal text-muted-foreground">Course content</span>
          {courseFresh.map(i => (
            <div key={i.key} className="flex items-center gap-2.5 rounded-md border border-border px-2 py-1.5" style={{ background: 'var(--muted)' }}>
              <UnitAvatar i={i} className={!included.has(i.key) ? 'grayscale' : undefined} />
              <span className="flex-1 text-sm text-muted-foreground">Course material</span>
              <Checkbox checked={included.has(i.key)} onCheckedChange={() => toggleUnit(i.key)} aria-label="Include course material in this push" />
            </div>
          ))}
          {courseDups.map(i => (
            <div key={i.key} className="flex items-center gap-2.5 rounded-md border border-border px-2 py-1.5">
              <i className="fa-solid fa-lock text-xs shrink-0" style={{ color: 'var(--qb-status-blocked-fg)' }} aria-hidden="true" />
              <UnitAvatar i={i} className="grayscale" />
              <span className="flex-1 text-sm text-muted-foreground">Course material</span>
            </div>
          ))}
        </div>
      )}

      {hasPeople && (
        <div className="flex flex-col gap-1.5">
          <span className="text-[11px] font-medium uppercase tracking-normal text-muted-foreground">People</span>
          <div className="flex flex-col gap-1.5">
            {personFresh.map(i => (
              <label key={i.key} className="flex cursor-pointer items-center gap-2.5 rounded-md px-1.5 py-1 hover:bg-accent/50">
                <Checkbox checked={included.has(i.key)} onCheckedChange={() => toggleUnit(i.key)} aria-label={`Include ${i.personName}`} />
                <UnitAvatar i={i} />
                <span className="flex min-w-0 items-baseline gap-1.5 text-sm">
                  <span className="truncate">{i.personName}</span>
                  {i.roleLabel && <span className="shrink-0 text-xs text-muted-foreground">· {i.roleLabel}</span>}
                </span>
              </label>
            ))}
            {personGaps.map(i => (
              <div key={i.key} className="flex items-center gap-2.5 px-1.5 py-1">
                <GapDisc />
                <span className="min-w-0 truncate text-sm text-muted-foreground">No {i.roleLabel} assigned</span>
              </div>
            ))}
            {personDups.map(i => (
              <div key={i.key} className="flex items-center gap-2.5 px-1.5 py-1">
                <i className="fa-solid fa-lock text-xs shrink-0" style={{ color: 'var(--qb-status-blocked-fg)' }} aria-hidden="true" />
                <UnitAvatar i={i} className="grayscale" />
                <span className="flex min-w-0 items-baseline gap-1.5 text-sm text-muted-foreground">
                  <span className="truncate">{i.personName}</span>
                  {i.roleLabel && <span className="shrink-0 text-xs">· {i.roleLabel}</span>}
                </span>
              </div>
            ))}
            {/* S4 (spec §5) demo addition — SYNTHETIC, not sourced from the
                harness's gate data (_shared.tsx models unitSelections as a
                plain included/excluded set, not the real
                Record<key,'selected'|'deselected'> Auto Update tracks). This
                one hardcoded row stands in for "exists in Prism, not part of
                this survey because Auto Update is off" — a third avatar
                state, distinct from both the solid included avatar above and
                GapDisc's dashed "nobody assigned" state. Pattern lifted
                verbatim from /compare/push-step2-accordion-layout's
                ExcludedRow. */}
            {excludedDemo && (
              <Label className="flex cursor-pointer items-center gap-2.5 rounded-md border border-border px-2 py-1.5" style={{ background: 'var(--card)' }}>
                <PersonAvatar name="Dr. James Kim" className={excludedDemo.included ? 'size-6' : 'size-6 grayscale'} />
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-sm font-medium">Dr. James Kim</span>
                  <span className="truncate text-xs text-muted-foreground">
                    {excludedDemo.included ? 'Instructor' : 'In Prism, not included — Auto Update is off'}
                  </span>
                </span>
                <Checkbox checked={excludedDemo.included} onCheckedChange={excludedDemo.onToggle} aria-label="Include Dr. James Kim" />
              </Label>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ═════════════════════════════════════════════════════════════════════════
// One expanded row: real template radio list + the unified decision surface
// ═════════════════════════════════════════════════════════════════════════
function RowDetail({
  row, publishedTemplates, included, toggleUnit, setTemplateFor, secondaryTemplateId, setSecondaryTemplateId,
}: {
  row: DemoRow
  publishedTemplates: PceTemplate[]
  included: ReadonlySet<string>
  toggleUnit: (key: string) => void
  setTemplateFor: (offeringId: string, templateId: string) => void
  secondaryTemplateId: string | null
  setSecondaryTemplateId: (id: string | null) => void
}) {
  const [stagedId, setStagedId] = useState<string | null>(null)
  const staged = stagedId ? publishedTemplates.find(t => t.id === stagedId) ?? null : null
  const secondaryTemplate = secondaryTemplateId ? publishedTemplates.find(t => t.id === secondaryTemplateId) ?? null : null
  // S4 demo state (see EvaluateeRail's excludedDemo comment) — synthetic,
  // local to this one row, not written back into the harness. DPT-510
  // picked because it already carries the most going on (real conflict +
  // secondary-template state), so this reuses the row rather than adding a
  // new one just to host a demo.
  const [kimIncluded, setKimIncluded] = useState(false)

  const handlePick = (id: string) => {
    // Honest-pending pattern: picking a different template only STAGES it —
    // the radio's committed value (and therefore every downstream badge,
    // list, and count) doesn't move until the unified surface below is
    // actually applied. This is the fix for the shipped flow's original
    // bug (the radio visually commits the instant you click it while a
    // separate card still gates the real change) — carried over from
    // /compare/push-step2-accordion-layout's useFullScenario, not
    // reinvented.
    if (id === row.template?.id) { setStagedId(null); return }
    setStagedId(id)
  }

  const handleApply = (choice: 'replace' | 'keep-both') => {
    if (!staged) return
    if (choice === 'replace') {
      setTemplateFor(row.offering.id, staged.id)
      setSecondaryTemplateId(null)
    } else {
      // See file header — the harness models one committed template per
      // offering, so "Keep both" is tracked locally for display only; the
      // committed template genuinely does not change.
      setSecondaryTemplateId(staged.id)
    }
    setStagedId(null)
  }

  return (
    <div className="grid gap-x-8 gap-y-4 p-4 md:grid-cols-[280px_minmax(0,1fr)]">
      <div className="flex min-w-0 flex-col gap-2">
        <span className="text-xs font-medium text-muted-foreground">Template</span>
        <RadioGroup
          value={row.template?.id ?? ''}
          onValueChange={handlePick}
          className="flex flex-col divide-y divide-border rounded-md border border-border"
          aria-label={`Template for ${row.code}`}
        >
          {publishedTemplates.map(t => (
            <Label key={t.id} className="flex cursor-pointer items-center gap-2 px-2.5 py-2">
              <RadioGroupItem value={t.id} id={`${row.offering.id}-tmpl-${t.id}`} />
              <span className="min-w-0 flex-1 truncate text-sm">{t.name}</span>
              {row.template?.id === t.id && <Badge variant="secondary" className="shrink-0">Current</Badge>}
            </Label>
          ))}
        </RadioGroup>

        {staged && (
          <UnifiedTemplateDecision
            row={row}
            staged={staged}
            onApply={handleApply}
            onCancel={() => setStagedId(null)}
            secondaryTemplate={secondaryTemplate}
          />
        )}

        {secondaryTemplate && !staged && (
          <div className="flex items-center gap-2 rounded-md border border-dashed border-border p-2.5">
            <i className="fa-light fa-arrow-right-arrow-left text-xs" style={{ color: 'var(--chip-4)' }} aria-hidden="true" />
            <span className="min-w-0 flex-1 text-xs">
              <span className="font-medium">Also evaluating</span>{' '}
              <span className="text-muted-foreground">· {secondaryTemplate.name}</span>
            </span>
            <Button variant="ghost" size="xs" onClick={() => setSecondaryTemplateId(null)} aria-label={`Remove ${secondaryTemplate.name} from ${row.code}`}>
              Remove
            </Button>
          </div>
        )}

        {row.template && !staged && (
          <p className="text-xs text-muted-foreground tabular-nums">
            {row.template.questionCount} question{row.template.questionCount !== 1 ? 's' : ''} · evaluates{' '}
            {applicableCriteria(row, row.template).join(', ')}
          </p>
        )}
      </div>

      <div className="flex min-w-0 flex-col gap-2">
        <span className="text-xs font-medium text-muted-foreground">Evaluatees</span>
        <EvaluateeRail
          row={row}
          included={included}
          toggleUnit={toggleUnit}
          excludedDemo={row.code === 'DPT-510' ? { included: kimIncluded, onToggle: () => setKimIncluded(v => !v) } : undefined}
        />
      </div>
    </div>
  )
}

// checkbox · chevron · course · template · status
const GRID = `24px 24px minmax(0,1fr) minmax(0,220px) 110px`

export default function PushStep2TemplateFlowUnifiedComparePage() {
  const { rows, publishedTemplates, included, toggleUnit, setTemplateFor } = useStep2RowDetailDemo()
  const [openRow, setOpenRow] = useState<string | null>(null)
  // Local-only, per-offering — see file header re: the harness's one-
  // template-per-offering contract.
  const [secondaryByOffering, setSecondaryByOffering] = useState<Record<string, string | null>>({})

  return (
    <div className="flex flex-col gap-5 p-6 max-w-[1100px] mx-auto">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold font-heading">Step 2 template switch — unified decision surface</h1>
        <p className="text-sm text-muted-foreground">
          Same real data (6 offerings, Fall 2026–2027) and one-row-expands-at-a-time table as the row-detail compare
          round. Picking a different template surfaces ONE decision — not the shipped flow's inline card followed by
          a separate override/create-new dialog. DPT-510 already carries a real conflicting Live survey; try switching
          its template.
        </p>
      </div>

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
            <span>Status</span>
          </div>

          {rows.map(row => {
            const { offering } = row
            const { code, name } = splitLabel(offering)
            const isOpen = openRow === offering.id
            const secondaryId = secondaryByOffering[offering.id] ?? null
            return (
              <Collapsible
                key={offering.id}
                open={isOpen}
                onOpenChange={() => setOpenRow(isOpen ? null : offering.id)}
                className="border-b border-border last:border-b-0"
              >
                <div className="grid items-center gap-3 ps-3 pe-3 py-2" style={{ gridTemplateColumns: GRID, minHeight: 44 }}>
                  <span className="flex items-center">
                    <Checkbox checked disabled aria-label={`${code} included in this push`} />
                  </span>
                  <CollapsibleTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="group"
                      aria-label={`${isOpen ? 'Hide' : 'Show'} template controls for ${code}`}
                    >
                      <i className="fa-light fa-chevron-down text-xs transition-transform group-data-[state=open]:rotate-180" aria-hidden="true" />
                    </Button>
                  </CollapsibleTrigger>
                  <span className="flex min-w-0 items-baseline gap-2">
                    <span className="shrink-0 font-mono text-xs tabular-nums text-muted-foreground">{code}</span>
                    {name && <span className="truncate text-sm">{name}</span>}
                  </span>
                  <span className="min-w-0 truncate text-sm text-muted-foreground">
                    {row.template ? row.template.name : 'No template'}
                    {secondaryId && <span> +1</span>}
                  </span>
                  <span className="min-w-0"><RowStatus row={row} /></span>
                </div>
                <CollapsibleContent>
                  <div className="mx-4 mb-3 rounded-md border border-border bg-background">
                    <RowDetail
                      row={row}
                      publishedTemplates={publishedTemplates}
                      included={included}
                      toggleUnit={toggleUnit}
                      setTemplateFor={setTemplateFor}
                      secondaryTemplateId={secondaryId}
                      setSecondaryTemplateId={id => setSecondaryByOffering(p => ({ ...p, [offering.id]: id }))}
                    />
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
