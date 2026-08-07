'use client'

// COMPARE ROUTE (throwaway — same lifecycle as the sibling /compare/push-step2-*
// routes, delete once a direction is picked, not wired into production).
//
// The shipped Step 2 template-switch flow (components/pce/courses-evaluatees/
// step-survey-instances.tsx) is a TWO-STEP interruption once a course already
// has a Draft/Scheduled/Live survey: (1) pick a different template in the
// radio list → an inline "consequence card" appears below it, (2) click
// "Switch template" → if the offering also has a role-overlap conflict with
// an existing survey, a SEPARATE AlertDialog pops up asking Override vs
// Create-new. That AlertDialog is a real modal overlay — it takes the admin
// out of the row visually (scrim, centered card, everything else dimmed)
// even though the decision it's asking about is entirely about that one row.
//
// This variant asks: can the ENTIRE decision — pick, consequence, and
// Replace-vs-Keep-both if conflicted — happen without ever leaving the row?
// No AlertDialog import anywhere in this file. The expanded row's own
// Template column morphs in place instead:
//
//   · No conflict (gate.dups.length === 0) → a LocalBanner appears directly
//     under the radio list. Confirm = LocalBanner's `action` (inline text
//     button); Cancel = LocalBanner's own dismiss (X). This is deliberately
//     the SAME two affordances the real inline "consequence card" already
//     has (Switch / Keep current) — LocalBanner is just the DS-correct
//     vessel for it, per this workspace's "LocalBanner, not toast" rule.
//   · Real conflict (gate.dups.length > 0 — DPT-510's case, which already
//     carries a conflicting Live survey in the fixture) → a bordered inline
//     panel renders in the exact same flow position, reproducing the real
//     AlertDialog's content (anchor line + StoryStatusBadgeOS, Keep-both /
//     Replace radios, added/removed copy in the same proven voice: "Stops
//     evaluating X and adds Y") as plain flow content instead of overlay
//     content. Nothing outside the row dims — see the tradeoff note below.
//
// Also fixes, not just relocates, the exact bug the accordion-layout compare
// round (round 8, this same day) flagged in the shipped page: there, the
// template radio's checked dot visually jumps to the new pick the instant
// you click it, even though the real commit is still gated behind the
// inline card/dialog — a real pending-vs-committed lie, verified live. Here
// the RadioGroup's `value` is always bound to the COMMITTED template id;
// picking a different option only stages it (a "Pending" tag rides that one
// option, radio dot doesn't move) until the inline block below is resolved.
//
// Tradeoff this file does NOT get for free, unlike an AlertDialog: no native
// focus trap. A modal's overlay guarantees focus can't leak to the rest of
// the page while a decision is pending; an inline block has no such
// boundary. This file hand-manages the two things a trap would've given for
// free — focus moves INTO the resolution block the instant it appears
// (tabIndex={-1} + aria-live="polite" region, focused via a ref) and back
// OUT to the template radio that triggered it on cancel or confirm (looked
// up by a stable per-radio DOM id) — plus a manual Escape handler, since
// there's no dialog primitive supplying one. Collapsing the row or opening a
// different one also cancels any pending resolution outright (only one row
// is open at a time, so a stray pending state on a hidden row was never a
// real possibility, but the cancel is explicit rather than assumed).
//
// Ground truth: same real 6-offering harness as /compare/push-step2-row-detail
// (_shared.tsx) — 2 Ready, 2 Gap, 1 Blocked/conflict (DPT-510), 1 with a
// coexisting survey — same real expandInstances-derived gate per row. No
// fake single-row demo data.

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import {
  Badge, Button, Card, CardContent, Checkbox,
  Collapsible, CollapsibleContent, CollapsibleTrigger,
  Label, LocalBanner, RadioGroup, RadioGroupItem, Tip,
} from '@exxatdesignux/ui'
import { cn } from '@/lib/utils'
import { PersonAvatar } from '@/components/pce/person-avatar'
import { ListHubStatusBadge } from '@/components/list-hub-status-badge'
import { StoryStatusBadgeOS } from '@/components/pce/pce-badges'
import {
  LIST_HUB_STATUS_TINT_SUCCESS, LIST_HUB_STATUS_TINT_WARNING, LIST_HUB_STATUS_TINT_DANGER,
} from '@/lib/list-status-badges'
import {
  useStep2RowDetailDemo, splitLabel, storyStatusOf, templateCriteria, CRITERION_BY_TYPE,
  type DemoRow, type PceTemplate,
} from '../push-step2-row-detail/_shared'

// checkbox · chevron · course · template · evaluatees · status
const GRID = `24px 24px minmax(0,1fr) minmax(0,220px) minmax(0,150px) 96px`

const listFmt = (items: string[]) => new Intl.ListFormat('en', { style: 'long', type: 'conjunction' }).format(items)

function criterionLabel(mode: DemoRow['mode'], c: ReturnType<typeof templateCriteria>[number]): string | undefined {
  return c === 'students' ? 'Course material' : CRITERION_BY_TYPE[mode][c]?.label
}

/** Mirrors the real file's private `templateSwitchConsequence(mode, current,
 *  staged)` (step-survey-instances.tsx) — reproduced here because it isn't
 *  exported. Same "not applicable to this delivery mode = drop it" filter,
 *  same added/removed shape. */
function consequenceOf(mode: DemoRow['mode'], current: PceTemplate | null, staged: PceTemplate) {
  const applicable = (t: PceTemplate | null) =>
    (t ? templateCriteria(t) : []).filter(c => c === 'students' || !!CRITERION_BY_TYPE[mode][c])
  const currentCriteria = applicable(current)
  const stagedCriteria = applicable(staged)
  const currentSet = new Set(currentCriteria)
  const stagedSet = new Set(stagedCriteria)
  const added = stagedCriteria.filter(c => !currentSet.has(c)).map(c => criterionLabel(mode, c)).filter((l): l is string => !!l)
  const removed = currentCriteria.filter(c => !stagedSet.has(c)).map(c => criterionLabel(mode, c)).filter((l): l is string => !!l)
  return { added, removed }
}

// ── Collapsed-row cells ──────────────────────────────────────────────────

function TemplateBadge({ template, secondaryTemplate }: { template: PceTemplate | null; secondaryTemplate: PceTemplate | null }) {
  if (!template) {
    return (
      <Badge variant="outline" className="max-w-full min-w-0 text-muted-foreground">
        <i className="fa-light fa-file-slash text-xs shrink-0" aria-hidden="true" />
        <span className="truncate">No template</span>
      </Badge>
    )
  }
  return (
    <span className="flex min-w-0 items-center gap-1">
      <Tip label={template.name} side="top">
        <span tabIndex={0} className="inline-flex max-w-full min-w-0 rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1">
          <Badge variant="secondary" className="max-w-full min-w-0">
            <i className="fa-light fa-file-lines text-xs shrink-0" aria-hidden="true" />
            <span className="truncate">{template.name}</span>
          </Badge>
        </span>
      </Tip>
      {secondaryTemplate && (
        <Tip label={`Also evaluating: ${secondaryTemplate.name}`} side="top">
          <span tabIndex={0} className="inline-flex shrink-0 rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1">
            <Badge variant="outline" className="shrink-0 px-1.5">
              <i className="fa-light fa-plus text-[10px]" aria-hidden="true" />
            </Badge>
          </span>
        </Tip>
      )}
    </span>
  )
}

function EvaluateeSummary({ row, included }: { row: DemoRow; included: ReadonlySet<string> }) {
  const inCount = row.gate.fresh.filter(i => included.has(i.key)).length
  const gapCount = row.gate.gaps.length
  if (inCount === 0 && gapCount === 0) {
    return <span aria-hidden="true" className="text-xs text-muted-foreground">&ndash;</span>
  }
  return (
    <span className="text-xs text-muted-foreground tabular-nums">
      {inCount} included{gapCount > 0 ? ` · ${gapCount} gap${gapCount !== 1 ? 's' : ''}` : ''}
    </span>
  )
}

function RowStatus({ gate }: { gate: DemoRow['gate'] }) {
  if (gate.reasons.length > 0) return <ListHubStatusBadge label="Blocked" tint={LIST_HUB_STATUS_TINT_DANGER} icon="fa-lock" />
  if (gate.gaps.length > 0) return <ListHubStatusBadge label="Gap" tint={LIST_HUB_STATUS_TINT_WARNING} icon="fa-user-slash" />
  return <ListHubStatusBadge label="Ready" tint={LIST_HUB_STATUS_TINT_SUCCESS} icon="fa-circle-check" />
}

// ── Expanded panel — Evaluatees (kept minimal, per direction) ──────────────

/** S4 — synthetic demo row only. This harness (`_shared.tsx`) tracks one
 *  committed template assignment per offering, not per-unit
 *  `unitSelections`/Auto-Update state, so a real "in Prism but excluded"
 *  person can't be derived from `expandInstances` here (same "narrow
 *  harness contract" tradeoff `ConflictResolutionPanel`'s `removedPeople`
 *  comment already documents). One hardcoded person, appended to DPT-610's
 *  roster only — a THIRD visual state distinct from included (solid avatar)
 *  and gap (dashed circle, nobody assigned): muted/grayscale avatar +
 *  explanatory caption, real checkbox to include. Per spec
 *  (2026-08-04-step2-scenario-redesign.md §5). */
function ExcludedPersonRow({ included, onToggle }: { included: boolean; onToggle: () => void }) {
  const id = 'unit-demo-excluded-kim'
  return (
    <div className="flex items-center gap-2 rounded-md px-1.5 py-1 hover:bg-accent/50">
      <Checkbox id={id} checked={included} onCheckedChange={onToggle} aria-label="Include Dr. James Kim" />
      <PersonAvatar name="Dr. James Kim" className={cn('size-5', !included && 'grayscale')} />
      <label htmlFor={id} className="flex min-w-0 cursor-pointer flex-col text-sm">
        <span className="truncate">Dr. James Kim</span>
        <span className="truncate text-xs text-muted-foreground">
          {included ? 'Instructor' : 'In Prism, not included — Auto Update is off'}
        </span>
      </label>
    </div>
  )
}

function EvaluateeMiniList({ row, included, toggleUnit, excludedDemo }: {
  row: DemoRow
  included: ReadonlySet<string>
  toggleUnit: (key: string) => void
  /** S4 demo hook — only passed for the one row that carries the synthetic
   *  "excluded but in Prism" person (see ExcludedPersonRow above). */
  excludedDemo?: { included: boolean; onToggle: () => void }
}) {
  const { fresh, gaps, dups } = row.gate
  if (fresh.length === 0 && gaps.length === 0 && dups.length === 0 && !excludedDemo) {
    return <span className="text-xs text-muted-foreground">Assign a template to see who this push would evaluate.</span>
  }
  // S1 — human vs. non-human aspect split (spec §2): course material is a
  // structural, non-human aspect — no person is ever assigned to it — so it
  // never interleaves with person rows, regardless of status. Gaps are
  // always role/person-based (course material never needs staffing), so
  // only fresh/dups need the scope split.
  const courseFresh = fresh.filter(i => i.scope === 'course')
  const personFresh = fresh.filter(i => i.scope !== 'course')
  const courseDups = dups.filter(i => i.scope === 'course')
  const personDups = dups.filter(i => i.scope !== 'course')
  const hasPeopleSection = personFresh.length > 0 || gaps.length > 0 || personDups.length > 0 || !!excludedDemo

  return (
    <div className="flex flex-col gap-3">
      {(courseFresh.length > 0 || courseDups.length > 0) && (
        <div className="flex flex-col gap-1">
          <span className="text-[11px] font-medium text-muted-foreground">Course content</span>
          {courseFresh.map(i => {
            const id = `unit-${i.key.replace(/[^a-zA-Z0-9_-]/g, '_')}`
            return (
              <div key={i.key} className="flex items-center gap-2 rounded-md border border-border px-1.5 py-1" style={{ background: 'var(--muted)' }}>
                <Checkbox id={id} checked={included.has(i.key)} onCheckedChange={() => toggleUnit(i.key)} aria-label="Include course material in this push" />
                <span className="flex size-5 shrink-0 items-center justify-center rounded-full border border-border bg-background">
                  <i className="fa-light fa-book-open text-[9px] text-muted-foreground" aria-hidden="true" />
                </span>
                <label htmlFor={id} className="cursor-pointer text-sm">Course material</label>
              </div>
            )
          })}
          {courseDups.map(i => (
            <div key={i.key} className="flex items-center gap-2 rounded-md border border-border px-1.5 py-1 text-xs text-muted-foreground" style={{ background: 'var(--muted)' }}>
              <i className="fa-solid fa-lock shrink-0 text-[10px]" style={{ color: 'var(--qb-status-blocked-fg)' }} aria-hidden="true" />
              <span className="truncate">Course material already covered</span>
            </div>
          ))}
        </div>
      )}

      {hasPeopleSection && (
        <div className="flex flex-col gap-1">
          <span className="text-[11px] font-medium text-muted-foreground">People</span>
          <div className="flex flex-col gap-1">
            {personFresh.map(i => {
              const id = `unit-${i.key.replace(/[^a-zA-Z0-9_-]/g, '_')}`
              return (
                <div key={i.key} className="flex items-center gap-2 rounded-md px-1.5 py-1 hover:bg-accent/50">
                  <Checkbox id={id} checked={included.has(i.key)} onCheckedChange={() => toggleUnit(i.key)} />
                  <PersonAvatar name={i.personName ?? ''} className="size-5" />
                  <label htmlFor={id} className="flex min-w-0 cursor-pointer items-baseline gap-1.5 text-sm">
                    <span className="truncate">{i.personName}</span>
                    {i.roleLabel && <span className="shrink-0 text-xs text-muted-foreground">· {i.roleLabel}</span>}
                  </label>
                </div>
              )
            })}
            {gaps.map(i => (
              <div key={i.key} className="flex items-center gap-2 px-1.5 py-1 text-xs text-muted-foreground">
                <span className="size-5 shrink-0 rounded-full border border-dashed" style={{ borderColor: 'var(--chip-4)' }} aria-hidden="true" />
                <span>No {i.roleLabel} assigned</span>
              </div>
            ))}
            {personDups.map(i => (
              <div key={i.key} className="flex items-center gap-2 px-1.5 py-1 text-xs text-muted-foreground">
                <i className="fa-solid fa-lock shrink-0 text-[10px]" style={{ color: 'var(--qb-status-blocked-fg)' }} aria-hidden="true" />
                <span className="truncate">{i.personName}{i.roleLabel ? ` · ${i.roleLabel}` : ''} already covered</span>
              </div>
            ))}
            {excludedDemo && <ExcludedPersonRow included={excludedDemo.included} onToggle={excludedDemo.onToggle} />}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Expanded panel — Template resolution (the redesigned piece) ────────────

/** Lightweight path: no existing conflict. LocalBanner carries both
 *  affordances — `action` is Confirm ("Switch template"), the banner's own
 *  dismiss (X) is Cancel ("Keep current"). */
function LightweightConsequence({ row, staged, onCancel, onConfirm }: {
  row: DemoRow
  staged: PceTemplate
  onCancel: () => void
  onConfirm: () => void
}) {
  const { added, removed } = consequenceOf(row.mode, row.template, staged)
  const message =
    added.length > 0 && removed.length > 0 ? (
      <>Stops evaluating <span className="font-medium text-foreground">{listFmt(removed)}</span> and adds <span className="font-medium text-foreground">{listFmt(added)}</span>.</>
    ) : added.length > 0 ? (
      <>Adds <span className="font-medium text-foreground">{listFmt(added)}</span>. Nothing is removed.</>
    ) : removed.length > 0 ? (
      <>Stops evaluating <span className="font-medium text-foreground">{listFmt(removed)}</span> and adds nothing new.</>
    ) : (
      <>Same aspects, different questions.</>
    )
  return (
    <LocalBanner
      variant={removed.length > 0 ? 'warning' : 'info'}
      title={`Switch to ${staged.name}?`}
      icon="fa-arrow-right-arrow-left"
      dismissible
      onDismiss={onCancel}
      action={{ label: 'Switch template', onClick: onConfirm }}
    >
      {message}
    </LocalBanner>
  )
}

/** Conflict path (gate.dups.length > 0 — DPT-510's case): the real
 *  AlertDialog's content (anchor line, Keep-both/Replace radios, avatar
 *  reinforcement for who Replace would stop evaluating) reproduced as plain
 *  inline content instead of overlay content. Same default (`create-new` /
 *  "Keep both") as the real dialog. */
function ConflictResolutionPanel({ row, staged, choice, onChoiceChange, onCancel, onConfirm }: {
  row: DemoRow
  staged: PceTemplate
  choice: 'override' | 'create-new'
  onChoiceChange: (c: 'override' | 'create-new') => void
  onCancel: () => void
  onConfirm: () => void
}) {
  // Computed from the offering directly (not a pre-split field on the row) —
  // mirrors the real dialog, which also calls splitLabel(offering) itself
  // rather than trusting an upstream string.
  const { code } = splitLabel(row.offering)
  const current = row.template
  const { added, removed } = consequenceOf(row.mode, current, staged)
  const conflictSurvey = row.gate.dups[0]?.existing ?? null

  // "Removed" avatars: real people currently included under the CURRENT
  // template whose role is one Replace would drop. There's no equivalent
  // "added" avatar list here — that would require re-running expandInstances
  // for the not-yet-committed template, which this compare page intentionally
  // doesn't reach into (only templateCriteria/CRITERION_BY_TYPE, per the
  // narrow harness contract) — so "added" stays role-label text only, same
  // words, one fewer visual, and it's an honest gap rather than a fabricated one.
  const removedLabels = new Set(removed)
  const removedPeople = row.gate.fresh.filter(i => {
    const label = i.scope === 'course' ? 'Course material' : i.roleLabel
    return !!label && removedLabels.has(label)
  })

  return (
    <div className="flex flex-col gap-3 rounded-md border p-3" style={{ borderColor: 'var(--chip-4)', background: 'var(--muted)' }}>
      <div className="flex items-start gap-2">
        <i className="fa-light fa-triangle-exclamation mt-0.5 shrink-0 text-xs" style={{ color: 'var(--chip-4)' }} aria-hidden="true" />
        <div className="flex min-w-0 flex-col gap-1">
          <span className="text-sm font-medium">Change template for {code}?</span>
          <span className="flex min-w-0 items-center gap-2 text-xs text-muted-foreground">
            <i className="fa-light fa-file-lines shrink-0" aria-hidden="true" />
            <span className="truncate">{current?.name ?? 'Its assigned template'}</span>
            {conflictSurvey && <StoryStatusBadgeOS status={storyStatusOf(conflictSurvey)} size="sm" />}
          </span>
        </div>
      </div>

      <RadioGroup
        value={choice}
        onValueChange={v => onChoiceChange(v as 'override' | 'create-new')}
        className="flex flex-col divide-y divide-border"
        aria-label={`How to apply the template change for ${code}`}
      >
        <div className="flex flex-col gap-1.5 py-2.5">
          <Label htmlFor={`choice-new-${row.offering.id}`} className="flex cursor-pointer items-start gap-2">
            <RadioGroupItem value="create-new" id={`choice-new-${row.offering.id}`} className="mt-0.5" />
            <span className="flex min-w-0 flex-col gap-1">
              <span className="text-sm font-medium">Keep both</span>
              <span className="text-xs text-muted-foreground">
                Also schedules {staged.name}.{' '}
                {added.length > 0
                  ? <>Adds <span className="font-medium text-foreground">{listFmt(added)}</span>. Nothing sends twice.</>
                  : <>It covers nothing the current survey does not already. Nothing sends twice.</>}
              </span>
            </span>
          </Label>
          {/* S3 escape hatch — a SIBLING of the Label (not nested inside
              it, which would fold the link's text into the radio's
              accessible name). Same real requirement as the shipped
              AlertDialog (step-survey-instances.tsx ~L2336-2360): this is
              the exact moment an admin is about to run two templates for
              what might really be one missing aspect on the first. */}
          {current && (
            <p className="text-xs text-muted-foreground ps-6">
              Only need one more aspect?{' '}
              <Link
                href={`/templates/${current.id}`}
                target="_blank"
                rel="noreferrer"
                className="underline underline-offset-2"
              >
                Edit it instead
                <span className="sr-only"> (opens &ldquo;{current.name}&rdquo; in a new tab; the template must be unpublished to edit)</span>
              </Link>
            </p>
          )}
        </div>
        <Label htmlFor={`choice-replace-${row.offering.id}`} className="flex cursor-pointer items-start gap-2 py-2.5">
          <RadioGroupItem value="override" id={`choice-replace-${row.offering.id}`} className="mt-0.5" />
          <span className="flex min-w-0 flex-col gap-1">
            <span className="text-sm font-medium">Replace</span>
            <span className="text-xs text-muted-foreground">
              {staged.name} takes its place.{' '}
              {removed.length > 0 && added.length > 0 && <>Stops evaluating <span className="font-medium text-foreground">{listFmt(removed)}</span> and adds <span className="font-medium text-foreground">{listFmt(added)}</span>.</>}
              {removed.length > 0 && added.length === 0 && <>Stops evaluating <span className="font-medium text-foreground">{listFmt(removed)}</span> and adds nothing new.</>}
              {removed.length === 0 && added.length > 0 && <>Adds <span className="font-medium text-foreground">{listFmt(added)}</span>. Nothing is removed.</>}
              {removed.length === 0 && added.length === 0 && <>Same aspects, different questions.</>}
            </span>
            {removedPeople.length > 0 && (
              <span className="flex items-center gap-1.5" aria-hidden="true">
                {removedPeople.slice(0, 4).map(i => (
                  <PersonAvatar key={i.key} name={i.personName ?? ''} className="size-6 grayscale" />
                ))}
              </span>
            )}
          </span>
        </Label>
      </RadioGroup>

      <div className="flex items-center justify-end gap-2 border-t border-border pt-2">
        <Button variant="ghost" size="xs" onClick={onCancel}>Cancel</Button>
        <Button variant="default" size="xs" onClick={onConfirm}>Continue</Button>
      </div>
    </div>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────

export default function PushStep2TemplateFlowInline() {
  const { rows, publishedTemplates, included, toggleUnit, setTemplateFor } = useStep2RowDetailDemo()
  const [openOfferingId, setOpenOfferingId] = useState<string | null>(null)
  // Staged pick per offering — set the instant a non-committed radio is
  // clicked, cleared on cancel or confirm. Never fed back into the radio's
  // `value`; that stays bound to the committed template id.
  const [pending, setPending] = useState<Record<string, string | null>>({})
  const [choice, setChoice] = useState<Record<string, 'override' | 'create-new'>>({})
  // Demo-only "Keep both" outcome — the harness models one committed
  // template per offering, so a coexisting second template is tracked here,
  // separate from setTemplateFor, purely to render the resulting "Also
  // evaluating" state. Persists across collapse (it's a real commit);
  // `pending` does not (it's a draft).
  const [secondary, setSecondary] = useState<Record<string, string | null>>({})
  // S4 demo state (see ExcludedPersonRow above) — one synthetic person,
  // scoped to DPT-610 only.
  const [kimIncluded, setKimIncluded] = useState(false)

  const resolutionRef = useRef<HTMLDivElement>(null)
  const prevHadPendingRef = useRef(false)

  function cancelPending(id: string) {
    setPending(p => (p[id] == null ? p : { ...p, [id]: null }))
    setChoice(c => (c[id] === 'create-new' || c[id] === undefined ? c : { ...c, [id]: 'create-new' }))
  }

  function toggleRow(id: string) {
    // Only one row is ever open, so only that row can have a pending
    // resolution — collapsing it, or opening a different row, cancels it
    // outright rather than leaving it orphaned off-screen.
    if (openOfferingId && openOfferingId !== id) cancelPending(openOfferingId)
    if (openOfferingId === id) {
      cancelPending(id)
      setOpenOfferingId(null)
    } else {
      setOpenOfferingId(id)
    }
  }

  function pickTemplate(offeringId: string, committedId: string | null, templateId: string) {
    if (templateId === committedId) return
    if (!committedId) {
      // Nothing assigned yet — nothing to lose, nothing to preview. Commit
      // straight through, same as the real step's first-assignment case.
      setTemplateFor(offeringId, templateId)
      return
    }
    setPending(p => ({ ...p, [offeringId]: templateId }))
    setChoice(c => ({ ...c, [offeringId]: 'create-new' }))
  }

  function confirmLightweight(offeringId: string, templateId: string) {
    setTemplateFor(offeringId, templateId)
    cancelPending(offeringId)
  }

  function resolveConflict(offeringId: string, templateId: string) {
    if ((choice[offeringId] ?? 'create-new') === 'override') {
      setTemplateFor(offeringId, templateId)
      setSecondary(s => ({ ...s, [offeringId]: null }))
    } else {
      setSecondary(s => ({ ...s, [offeringId]: templateId }))
    }
    cancelPending(offeringId)
  }

  // Focus management substituting for a modal's native focus trap (see
  // header comment) — move focus INTO the resolution block the instant it
  // appears, and back onto the triggering radio (by its stable per-row,
  // per-template DOM id) the instant it's resolved either way.
  useEffect(() => {
    const activePendingId = openOfferingId ? pending[openOfferingId] ?? null : null
    const hasPending = !!activePendingId
    if (hasPending && !prevHadPendingRef.current) {
      resolutionRef.current?.focus()
    } else if (!hasPending && prevHadPendingRef.current && openOfferingId) {
      const committedId = rows.find(r => r.offering.id === openOfferingId)?.template?.id ?? null
      if (committedId) document.getElementById(`tpl-${openOfferingId}-${committedId}`)?.focus()
    }
    prevHadPendingRef.current = hasPending
  }, [pending, openOfferingId, rows])

  const totalIncluded = useMemo(
    () => rows.reduce((n, r) => n + r.gate.fresh.filter(i => included.has(i.key)).length, 0),
    [rows, included],
  )

  return (
    <div className="mx-auto flex max-w-[1100px] flex-col gap-4 p-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold font-heading">Step 2 template switch — fully inline, no modal</h1>
        <p className="text-sm text-muted-foreground">
          Same 6 real offerings as the row-detail compare set. Pick a different template on any row — including DPT-510, which already carries a conflicting Live survey — and the whole decision resolves inside the row. No AlertDialog opens anywhere on this page.
        </p>
      </div>
      <p className="text-xs text-muted-foreground tabular-nums">
        {totalIncluded} evaluatee{totalIncluded !== 1 ? 's' : ''} selected across {rows.length} courses
      </p>

      <Card size="sm" className="gap-0 overflow-hidden py-0">
        <CardContent className="p-0">
          <div className="grid items-center gap-3 border-b border-border ps-3 pe-3 py-2 text-xs font-medium text-muted-foreground" style={{ gridTemplateColumns: GRID }}>
            <span /><span /><span>Course</span><span>Template</span><span>Evaluatees</span><span>Status</span>
          </div>

          {rows.map(row => {
            const { offering, code, name, gate } = row
            const isOpen = openOfferingId === offering.id
            const pendingId = pending[offering.id] ?? null
            const stagedTemplate = pendingId ? publishedTemplates.find(t => t.id === pendingId) ?? null : null
            const hasConflict = gate.dups.length > 0
            const secondaryId = secondary[offering.id] ?? null
            const secondaryTemplate = secondaryId ? publishedTemplates.find(t => t.id === secondaryId) ?? null : null
            const freshKeys = gate.fresh.map(i => i.key)
            const inCount = freshKeys.filter(k => included.has(k)).length

            return (
              <Collapsible
                key={offering.id}
                open={isOpen}
                onOpenChange={() => toggleRow(offering.id)}
                className="border-b border-border last:border-b-0"
              >
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
                    <Button variant="ghost" size="icon-sm" className="group" aria-label={`${isOpen ? 'Hide' : 'Show'} template controls for ${code}`}>
                      <i className="fa-light fa-chevron-down text-xs transition-transform group-data-[state=open]:rotate-180" aria-hidden="true" />
                    </Button>
                  </CollapsibleTrigger>

                  <span className="flex min-w-0 items-baseline gap-2">
                    <span className="shrink-0 font-mono text-xs tabular-nums text-muted-foreground">{code}</span>
                    {name && <span className="truncate text-sm">{name}</span>}
                  </span>

                  <span className="min-w-0"><TemplateBadge template={row.template} secondaryTemplate={secondaryTemplate} /></span>
                  <EvaluateeSummary row={row} included={included} />
                  <span className="min-w-0"><RowStatus gate={gate} /></span>
                </div>

                <CollapsibleContent>
                  <div className="mx-4 mb-3 rounded-md border border-border bg-background">
                    <div className="grid gap-x-8 gap-y-4 p-4 md:grid-cols-[320px_minmax(0,1fr)]">
                      {/* ── Template column — the redesigned piece ── */}
                      <div className="flex min-w-0 flex-col gap-3">
                        <span className="text-xs font-medium text-muted-foreground">Template</span>

                        <RadioGroup
                          value={row.template?.id ?? ''}
                          onValueChange={v => pickTemplate(offering.id, row.template?.id ?? null, v)}
                          aria-label={`Template for ${code}`}
                          className="flex flex-col gap-0.5"
                        >
                          {publishedTemplates.map(t => {
                            const radioId = `tpl-${offering.id}-${t.id}`
                            const isPending = pendingId === t.id
                            const criteria = templateCriteria(t).filter(c => c === 'students' || !!CRITERION_BY_TYPE[row.mode][c])
                            return (
                              <Label
                                key={t.id}
                                htmlFor={radioId}
                                className={cn('flex cursor-pointer items-start gap-2 rounded-md px-2 py-1.5', isPending && 'bg-accent/60')}
                              >
                                <RadioGroupItem value={t.id} id={radioId} className="mt-0.5" />
                                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                                  <span className="flex items-center gap-1.5 text-sm">
                                    <span className="truncate">{t.name}</span>
                                    {isPending && <Badge variant="outline" className="shrink-0 text-[10px]">Pending</Badge>}
                                  </span>
                                  <span className="truncate text-xs text-muted-foreground">
                                    evaluates {criteria.map(c => criterionLabel(row.mode, c)).filter(Boolean).join(', ') || '—'}
                                  </span>
                                </span>
                              </Label>
                            )
                          })}
                        </RadioGroup>

                        {secondaryTemplate && !pendingId && (
                          <div className="flex items-center justify-between gap-2 rounded-md border border-dashed border-border p-2 text-xs">
                            <span className="flex min-w-0 items-center gap-1.5">
                              <i className="fa-light fa-arrow-right-arrow-left shrink-0" style={{ color: 'var(--chip-4)' }} aria-hidden="true" />
                              <span className="truncate">Also evaluating with <span className="font-medium text-foreground">{secondaryTemplate.name}</span></span>
                            </span>
                            <Button
                              variant="ghost"
                              size="icon-xs"
                              aria-label={`Stop also evaluating with ${secondaryTemplate.name} for ${code}`}
                              onClick={() => setSecondary(s => ({ ...s, [offering.id]: null }))}
                            >
                              <i className="fa-light fa-xmark text-xs" aria-hidden="true" />
                            </Button>
                          </div>
                        )}

                        {isOpen && stagedTemplate && (
                          <div
                            ref={resolutionRef}
                            tabIndex={-1}
                            aria-live="polite"
                            className="outline-none"
                            onKeyDown={e => { if (e.key === 'Escape') { e.stopPropagation(); cancelPending(offering.id) } }}
                          >
                            {hasConflict ? (
                              <ConflictResolutionPanel
                                row={row}
                                staged={stagedTemplate}
                                choice={choice[offering.id] ?? 'create-new'}
                                onChoiceChange={c => setChoice(ch => ({ ...ch, [offering.id]: c }))}
                                onCancel={() => cancelPending(offering.id)}
                                onConfirm={() => resolveConflict(offering.id, stagedTemplate.id)}
                              />
                            ) : (
                              <LightweightConsequence
                                row={row}
                                staged={stagedTemplate}
                                onCancel={() => cancelPending(offering.id)}
                                onConfirm={() => confirmLightweight(offering.id, stagedTemplate.id)}
                              />
                            )}
                          </div>
                        )}

                        {row.template && !stagedTemplate && (
                          <p className="text-xs text-muted-foreground tabular-nums">
                            {row.template.questionCount} question{row.template.questionCount !== 1 ? 's' : ''}
                          </p>
                        )}
                      </div>

                      {/* ── Evaluatees column — kept minimal ── */}
                      <div className="flex min-w-0 flex-col gap-2">
                        <span className="text-xs font-medium text-muted-foreground">Evaluatees</span>
                        <EvaluateeMiniList
                          row={row}
                          included={included}
                          toggleUnit={toggleUnit}
                          excludedDemo={code === 'DPT-610' ? { included: kimIncluded, onToggle: () => setKimIncluded(v => !v) } : undefined}
                        />
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
