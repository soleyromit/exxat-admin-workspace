'use client'

// COMPARE ROUTE (throwaway — same lifecycle as sibling /compare/push-step2-*
// routes, delete once a direction is picked, not wired into production).
//
// THE REAL PROBLEM (2026-08-05): the shipped Step 2 reassign flow
// (courses-evaluatees/step-survey-instances.tsx) is a two-step interruption
// that never tells the admin it's two steps.
//   1. Pick a different template in TemplateControl's radios → the radio
//      visually commits instantly, then a separate inline card
//      (`consequenceCard`, built from `templateSwitchConsequence`) appears
//      BELOW it saying "Switch to X? Stops evaluating Y and adds Z." with
//      Switch/Keep buttons — the pick already looks applied before it is.
//   2. Click "Switch template" → if the new template ALSO trips a role-
//      overlap conflict, a SEPARATE unannounced AlertDialog (`pendingReassign`,
//      same file ~L2228) pops up asking Override vs Create-new. Nothing on
//      screen before that click warned the admin a second decision existed.
// Two real gates, presented as one click followed by a surprise.
//
// THIS DIRECTION — an explicit 2-step mini-wizard, replacing the ambush.
// When "Change" is clicked on a course whose offering already carries a real
// survey record (draft/scheduled/live — anything that COULD conflict), the
// Template area becomes a compact inline flow with a step indicator ("Step 1
// of 2" / "Step 2 of 2", small dot markers + labels) visible from the first
// frame — so the admin knows up front this MIGHT be a two-part decision,
// before they've picked anything. Step 1 is a real staged pick (no radio
// auto-commit — nothing changes until Continue). Continue synchronously
// checks the SAME engine the real step uses (`expandInstances`, via the raw
// `surveys`/`templates` the harness itself reads): if the pick produces zero
// `status: 'duplicate'` instances, there's nothing to resolve — it commits
// right there ("a lightweight commit, no fake step 2", per brief) and the
// flow closes. Only a genuine conflict advances to Step 2, which folds the
// real AlertDialog's Replace/Keep-both choice and added/removed-criteria
// copy (mirrored from `push-step2-accordion-layout`'s `ReassignDialog`,
// ~L166 there) into the SAME inline surface, with Back to return to Step 1
// before anything is committed.
//
// Courses with NO existing survey at all skip the wizard chrome entirely —
// a plain single Select, since a conflict there is structurally impossible;
// showing a "might be 2 steps" indicator on a row that never could be would
// be dishonest UI, not an equivalent-format nicety.
//
// DS DISCOVERY (Gate 1, `node tools/ds/source.mjs Wizard`): this DS ships a
// real sequential-stepper primitive — `Wizard`/`WizardNav` with a `compact`
// variant (small dot markers + label, no invented chrome) plus
// `resolveStepStatus`/`WizardStepHeading`/`WizardPanel` — built for exactly
// this "not Tabs, sequential state machine" shape. Used as-is below instead
// of hand-rolling a "1 · 2" row.
//
// ONE NAMED SIMPLIFICATION: `useStep2RowDetailDemo()` (the shared harness)
// models exactly one template per offering — there's no coexisting-survey
// slot to write to. "Keep both" is still a real, selectable choice in Step 2
// (real copy, real added/removed diff) but its effect is LOCAL-only: it
// leaves the harness's committed template untouched and renders a dashed
// "Also evaluating" receipt row, the same non-committing demo pattern
// `push-step2-accordion-layout` already uses for its own `secondaryTemplateId`
// (that page's engine doesn't schedule a second survey either — it's a
// receipt, not a backend write). "Replace" is the one path that calls the
// harness's real `setTemplateFor`.
//
// Ground truth: 6 real offerings from `_shared.tsx` (2 Ready, 2 Gap, 1
// Blocked/conflict = DPT-510, 1 with a coexisting survey), same
// `expandInstances` engine, same `included`/`toggleUnit` state. DPT-510 is
// the conflict test case (Step 2 fires there); any Ready row with an
// existing survey but a non-conflicting pick is the clean Step-1-only case.

import { useMemo, useState } from 'react'
import {
  Badge, Button, Card, CardContent, Checkbox,
  Collapsible, CollapsibleContent, CollapsibleTrigger,
  Label, LocalBanner, RadioGroup, RadioGroupItem,
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
  Tip,
  Wizard, WizardContent, WizardFooter, WizardNav, WizardPanel, WizardProgress, WizardStepHeading,
  type WizardStep,
} from '@exxatdesignux/ui'
import Link from 'next/link'
import { usePce } from '@/components/pce/pce-state'
import { PersonAvatar } from '@/components/pce/person-avatar'
import { StoryStatusBadgeOS } from '@/components/pce/pce-badges'
import { ListHubStatusBadge } from '@/components/list-hub-status-badge'
import {
  LIST_HUB_STATUS_TINT_SUCCESS, LIST_HUB_STATUS_TINT_WARNING, LIST_HUB_STATUS_TINT_DANGER,
} from '@/lib/list-status-badges'
import { expandInstances } from '@/lib/pce-push-validation'
import {
  useStep2RowDetailDemo, storyStatusOf, templateCriteria, CRITERION_BY_TYPE,
  evaluateeLabel,
  type DemoRow, type PceTemplate, type SurveyInstance, type PceSurvey,
} from '../push-step2-row-detail/_shared'

// checkbox · chevron · course · template · evaluatees · status
const GRID = `24px 24px minmax(0,1fr) minmax(0,200px) 120px 110px`

const listFmt = (items: string[]) => new Intl.ListFormat('en', { style: 'long', type: 'conjunction' }).format(items)

/** Same computation as the real file's `templateSwitchConsequence` —
 *  templateCriteria(template) filtered through CRITERION_BY_TYPE[mode], so a
 *  criterion that doesn't apply to this delivery mode never shows up as a
 *  fake add/remove. */
function diffOf(mode: DemoRow['mode'], fromT: PceTemplate | null, toT: PceTemplate) {
  const label = (c: string) => (c === 'students' ? 'Course material' : CRITERION_BY_TYPE[mode][c as keyof typeof CRITERION_BY_TYPE[typeof mode]]?.label)
  const applicable = (t: PceTemplate | null) =>
    (t ? templateCriteria(t) : []).filter(c => c === 'students' || !!CRITERION_BY_TYPE[mode][c as keyof typeof CRITERION_BY_TYPE[typeof mode]])
  const fromCriteria = applicable(fromT)
  const toCriteria = applicable(toT)
  const fromSet = new Set(fromCriteria)
  const toSet = new Set(toCriteria)
  const added = toCriteria.filter(c => !fromSet.has(c)).map(label).filter((l): l is string => !!l)
  const removed = fromCriteria.filter(c => !toSet.has(c)).map(label).filter((l): l is string => !!l)
  return { added, removed }
}

const WIZARD_STEPS: WizardStep[] = [
  { id: 'pick', label: 'Pick a template' },
  { id: 'resolve', label: 'Resolve conflict' },
]

// ── Row-level bits ──────────────────────────────────────────────────────────

function TemplateChip({ template }: { template: PceTemplate | null }) {
  if (!template) {
    return (
      <Badge variant="outline" className="max-w-full min-w-0 text-muted-foreground">
        <i className="fa-light fa-file-slash text-xs shrink-0" aria-hidden="true" />
        <span className="truncate">No template</span>
      </Badge>
    )
  }
  return (
    <Tip label={template.name} side="top">
      <span tabIndex={0} className="inline-flex max-w-full min-w-0 rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1">
        <Badge variant="secondary" className="max-w-full min-w-0">
          <i className="fa-light fa-file-lines text-xs shrink-0" aria-hidden="true" />
          <span className="truncate">{template.name}</span>
        </Badge>
      </span>
    </Tip>
  )
}

function RowStatus({ row }: { row: DemoRow }) {
  const { reasons, gaps, dups } = row.gate
  if (reasons.length > 0) {
    const detail = reasons.includes('overlap')
      ? [...new Set(dups.map(i => i.roleLabel || 'Course material'))].join(', ') + ' already covered'
      : 'No template assigned'
    return (
      <Tip label={detail} side="top">
        <span className="inline-flex rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1" tabIndex={0}>
          <ListHubStatusBadge label="Blocked" tint={LIST_HUB_STATUS_TINT_DANGER} icon="fa-lock" />
        </span>
      </Tip>
    )
  }
  if (gaps.length > 0) {
    return <ListHubStatusBadge label="Gap" tint={LIST_HUB_STATUS_TINT_WARNING} icon="fa-user-slash" />
  }
  return <ListHubStatusBadge label="Ready" tint={LIST_HUB_STATUS_TINT_SUCCESS} icon="fa-circle-check" />
}

/** S4 demo addition (see file header — not part of useStep2RowDetailDemo()'s
 *  real fixture, which doesn't model Auto Update). A person who exists in
 *  Prism but isn't part of THIS survey because Auto Update is off — a THIRD
 *  visual state, distinct from "included" (solid avatar, checked) and "gap"
 *  (dashed circle, no person yet). Mirrors push-step2-accordion-layout's
 *  `ExcludedRow` (same grayscale-avatar + distinct-copy pattern, ~L248-261
 *  there) — name is Dr. Priya Raman (unused elsewhere in this row's fixture)
 *  since DPT-610 already has a real "Dr. James Kim" in its roster and
 *  reusing that name rendered two contradictory-state rows for the same
 *  person, confirmed live. Shown only on DPT-610. Takes the same `disabled`
 *  treatment as every other Evaluatees row while this row's wizard is open —
 *  see EvaluateesMini below. */
function SyntheticExcludedRow({ disabled }: { disabled?: boolean }) {
  const [demoIncluded, setDemoIncluded] = useState(false)
  const id = 'eval-synthetic-raman-dpt610'
  return (
    <Label
      htmlFor={id}
      className={`flex items-center gap-2.5 rounded-md border border-border p-2 ${disabled ? '' : 'cursor-pointer'}`}
      style={{ background: 'var(--card)' }}
    >
      <PersonAvatar name="Dr. Priya Raman" className={demoIncluded ? 'size-6' : 'size-6 grayscale'} decorative />
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-sm font-medium">Dr. Priya Raman</span>
        <span className="truncate text-xs text-muted-foreground">
          {demoIncluded ? 'Instructor' : 'In Prism, not included — Auto Update is off'}
        </span>
      </span>
      <Checkbox
        id={id}
        checked={demoIncluded}
        onCheckedChange={() => setDemoIncluded(v => !v)}
        disabled={disabled}
        aria-disabled={disabled || undefined}
        aria-describedby={disabled ? WIZARD_LOCK_NOTE_ID : undefined}
        aria-label="Include Dr. Priya Raman"
      />
    </Label>
  )
}

function EvaluateesMini({ row, included, toggleUnit, disabled }: {
  row: DemoRow
  included: ReadonlySet<string>
  toggleUnit: (key: string) => void
  /** True while this row's template wizard is mid-flow — unit selection is
   *  locked until the admin finishes or cancels it, since the wizard is
   *  about to change what's even relevant here. */
  disabled?: boolean
}) {
  const { fresh, gaps, dups } = row.gate
  // S4 demo addition — see SyntheticExcludedRow above. Only DPT-610 gets the
  // synthetic 4th roster person, so the empty-state short-circuit below has
  // to know about it too or that row would wrongly show "No evaluatees".
  const showSyntheticExcluded = row.code === 'DPT-610'
  if (fresh.length + gaps.length + dups.length === 0 && !showSyntheticExcluded) {
    return <p className="text-xs text-muted-foreground">No evaluatees for this course yet.</p>
  }

  // S1 — human vs. non-human split (spec §2, docs/specs/2026-08-04-step2-
  // scenario-redesign.md): course material structurally can't need a
  // decision (no person, ever) so it never shares the checkbox-row
  // treatment person aspects get below — its own static line, matching the
  // fa-book-open convention already used for it in `EvaluateeAvatar`
  // (step-survey-instances.tsx ~L449-457).
  const courseMaterial = fresh.find(i => i.scope === 'course')
  const peopleFresh = fresh.filter(i => i.scope !== 'course')

  return (
    <div className="flex flex-col gap-1">
      {disabled && (
        <p className="flex items-center gap-1.5 pb-1 text-xs text-muted-foreground">
          <i className="fa-light fa-lock shrink-0" aria-hidden="true" />
          Unit selection is locked until the template wizard above is finished or cancelled.
        </p>
      )}

      {courseMaterial && (
        <div className="flex flex-col gap-1 pb-1">
          <span className="text-xs font-medium text-muted-foreground">Course material</span>
          <div className="flex items-center gap-2 rounded-md px-1 py-1">
            <span className="flex size-6 shrink-0 items-center justify-center rounded-full border border-border bg-background">
              <i className="fa-light fa-book-open text-[10px] text-muted-foreground" aria-hidden="true" />
            </span>
            <span className="truncate text-sm text-muted-foreground">Course material</span>
          </div>
        </div>
      )}

      {courseMaterial && (peopleFresh.length > 0 || showSyntheticExcluded) && (
        <span className="text-xs font-medium text-muted-foreground">People</span>
      )}

      {peopleFresh.map(i => {
        const id = `eval-${i.key.replace(/[^a-zA-Z0-9_-]/g, '_')}`
        return (
          <div key={i.key} className="flex items-center gap-2 rounded-md px-1 py-1 hover:bg-accent/50">
            <Checkbox
              id={id}
              checked={included.has(i.key)}
              onCheckedChange={() => toggleUnit(i.key)}
              disabled={disabled}
              aria-disabled={disabled || undefined}
              aria-describedby={disabled ? WIZARD_LOCK_NOTE_ID : undefined}
            />
            <label htmlFor={id} className={`truncate text-sm ${disabled ? '' : 'cursor-pointer'}`}>{evaluateeLabel(i)}</label>
          </div>
        )
      })}

      {showSyntheticExcluded && <SyntheticExcludedRow disabled={disabled} />}

      {gaps.map(i => (
        <p key={i.key} className="flex items-center gap-2 px-1 text-xs text-muted-foreground">
          <i className="fa-light fa-user-slash shrink-0" aria-hidden="true" />
          <span className="truncate">No {i.roleLabel} assigned</span>
        </p>
      ))}
      {dups.map(i => (
        <p key={i.key} className="flex items-center gap-2 px-1 text-xs text-muted-foreground">
          <i className="fa-solid fa-lock shrink-0" style={{ color: 'var(--qb-status-blocked-fg)' }} aria-hidden="true" />
          <span className="truncate">{evaluateeLabel(i)} — already covered</span>
        </p>
      ))}
    </div>
  )
}

// ── The redesigned mini-wizard ───────────────────────────────────────────────

type FlowResult = { templateId: string; resolution: 'replace' | 'keep-both' }

function TemplateFlowWizard({ row, surveys, templates, publishedTemplates, onApply, onCancel }: {
  row: DemoRow
  surveys: PceSurvey[]
  templates: PceTemplate[]
  publishedTemplates: PceTemplate[]
  onApply: (result: FlowResult) => void
  onCancel: () => void
}) {
  const [current, setCurrent] = useState(0) // 0 = pick, 1 = resolve
  const [stagedId, setStagedId] = useState(row.template?.id ?? '')
  const [resolution, setResolution] = useState<'replace' | 'keep-both'>('replace')

  const stagedTemplate = publishedTemplates.find(t => t.id === stagedId) ?? null

  // Same engine the harness itself uses to derive gate.dups — run here
  // against the STAGED (not-yet-committed) pick, so Continue can decide
  // in one synchronous check whether a Step 2 is real or would be fake.
  const previewDups = useMemo<SurveyInstance[]>(
    () => (stagedTemplate ? expandInstances(row.offering, stagedTemplate, surveys, templates) : []).filter(i => i.status === 'duplicate'),
    [stagedTemplate, row.offering, surveys, templates],
  )
  // Bug fix (live-reported, confirmed by reproduction): `previewDups` reflects
  // whatever's ALREADY blocked for this offering+role (e.g. Dr. Kevin Chen's
  // external Live survey) — that's true regardless of which template is
  // staged, including the template that's already assigned. Gating Step 2 on
  // `previewDups.length > 0` alone meant re-opening "Change" and clicking
  // Continue WITHOUT picking anything different still walked the admin into
  // a Replace-vs-Keep-both choice about swapping the current template for
  // itself — "Keep both. Also schedules End-of-Term Evaluation" when
  // End-of-Term Evaluation was already the only template. A real
  // reassignment conflict requires the staged pick to actually be different.
  const isSameAsCurrent = stagedId === (row.template?.id ?? '')
  const willConflict = !isSameAsCurrent && previewDups.length > 0
  const diff = stagedTemplate ? diffOf(row.mode, row.template, stagedTemplate) : { added: [], removed: [] }

  // S3 escape hatch — the ALREADY-scheduled template blocking this pick,
  // resolved from the conflicting instance's existing survey (gate.dups[].
  // existing → PceSurvey.templateId → the full `templates` list, since a
  // combined/legacy survey's template may since have been unpublished and
  // dropped from `publishedTemplates`). Same conflict, same survey for every
  // dup instance on one offering, so the first is representative.
  const conflictSurvey = previewDups[0]?.existing ?? null
  const existingTemplate = conflictSurvey ? (templates.find(t => t.id === conflictSurvey.templateId) ?? null) : null

  function handleContinue() {
    if (!stagedTemplate) return
    if (willConflict) { setCurrent(1); return }
    // No conflict — the flow ends here. A lightweight commit, not a fake
    // second step for a decision that was never really there.
    onApply({ templateId: stagedTemplate.id, resolution: 'replace' })
  }

  return (
    // Renders in place of the Template column's compact summary while this
    // row's wizard is open (see RowDetail) — not an overlay.
    <div className="flex flex-col gap-3 rounded-md border border-border p-3" style={{ background: 'var(--card)' }}>
      <Wizard
        steps={WIZARD_STEPS}
        current={current}
        variant="compact"
        linear
        onStepClick={idx => { if (idx === 0) setCurrent(0) }}
      >
        <div className="flex flex-col gap-1">
          <WizardNav />
          <WizardProgress className="sr-only" />
        </div>
        <WizardContent>
          <WizardPanel step={0}>
            <WizardStepHeading id="pick" className="mb-2 text-sm">Step 1 of 2 — Pick a template</WizardStepHeading>
            <RadioGroup value={stagedId} onValueChange={setStagedId} className="flex flex-col gap-1.5" aria-label={`Template for ${row.code}`}>
              {publishedTemplates.map(t => {
                const id = `tfw-${row.offering.id}-${t.id}`
                return (
                  <Label key={t.id} htmlFor={id} className="flex cursor-pointer items-start gap-2.5 rounded-md border border-border p-2">
                    <RadioGroupItem value={t.id} id={id} className="mt-0.5" />
                    <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <span className="flex items-center gap-1.5 text-sm font-medium">
                        <span className="truncate">{t.name}</span>
                        {t.id === row.template?.id && (
                          <span className="shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground" style={{ background: 'var(--secondary)' }}>Current</span>
                        )}
                      </span>
                      <span className="text-xs text-muted-foreground">{t.questionCount} questions</span>
                    </span>
                  </Label>
                )
              })}
            </RadioGroup>
            {stagedTemplate && (
              <p className="mt-2 text-xs text-muted-foreground" aria-live="polite">
                {stagedId === row.template?.id
                  ? 'Same as the current template.'
                  : willConflict
                    ? <><i className="fa-light fa-triangle-exclamation me-1" style={{ color: 'var(--chip-4)' }} aria-hidden="true" />Conflicts with an existing survey — resolving it needs one more step.</>
                    : <><i className="fa-light fa-circle-check me-1" aria-hidden="true" />No conflicts — Continue applies it right away.</>}
              </p>
            )}
            <WizardFooter
              className="mt-3 pt-3"
              showBack={false}
              nextLabel={willConflict ? 'Continue' : stagedId === row.template?.id ? 'Keep current' : 'Apply'}
              onNext={handleContinue}
            />
            <Button variant="ghost" size="xs" className="-mt-2 self-start" onClick={onCancel}>Cancel</Button>
          </WizardPanel>

          <WizardPanel step={1}>
            <WizardStepHeading id="resolve" className="mb-2 text-sm">Step 2 of 2 — Resolve the conflict</WizardStepHeading>
            {stagedTemplate && (
              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-1.5">
                  <span className="text-xs font-medium text-muted-foreground">Already covered</span>
                  {previewDups.map(i => (
                    <div key={i.key} className="flex items-center gap-2 rounded-md border border-border p-2">
                      {i.scope === 'course'
                        ? <span className="flex size-6 shrink-0 items-center justify-center rounded-full border border-border bg-background"><i className="fa-light fa-book-open text-[10px] text-muted-foreground" aria-hidden="true" /></span>
                        : <PersonAvatar name={i.personName ?? ''} className="size-6 shrink-0" />}
                      <span className="min-w-0 flex-1 truncate text-sm">{evaluateeLabel(i)}</span>
                      {i.existing && <StoryStatusBadgeOS status={storyStatusOf(i.existing)} size="sm" />}
                      {i.existing && (
                        <Button variant="ghost" size="xs" asChild className="shrink-0">
                          <Link href={`/surveys/${i.existing.id}`}>View</Link>
                        </Button>
                      )}
                    </div>
                  ))}
                </div>

                <RadioGroup value={resolution} onValueChange={v => setResolution(v as typeof resolution)} className="flex flex-col divide-y divide-border" aria-label="How to apply this template change">
                  <Label className="flex cursor-pointer items-start gap-2 py-2">
                    <RadioGroupItem value="replace" className="mt-0.5" />
                    <span className="flex flex-col gap-0.5">
                      <span className="text-sm font-medium">Replace</span>
                      <span className="text-xs text-muted-foreground">
                        {stagedTemplate.name} takes its place.{' '}
                        {diff.removed.length > 0 && diff.added.length > 0 && <>Stops evaluating <span className="font-medium text-foreground">{listFmt(diff.removed)}</span> and adds <span className="font-medium text-foreground">{listFmt(diff.added)}</span>.</>}
                        {diff.removed.length > 0 && diff.added.length === 0 && <>Stops evaluating <span className="font-medium text-foreground">{listFmt(diff.removed)}</span> and adds nothing new.</>}
                        {diff.removed.length === 0 && diff.added.length > 0 && <>Adds <span className="font-medium text-foreground">{listFmt(diff.added)}</span>. Nothing is removed.</>}
                        {diff.removed.length === 0 && diff.added.length === 0 && <>Same aspects, different questions.</>}
                      </span>
                    </span>
                  </Label>
                  <Label className="flex cursor-pointer items-start gap-2 py-2">
                    <RadioGroupItem value="keep-both" className="mt-0.5" />
                    <span className="flex flex-col gap-0.5">
                      <span className="text-sm font-medium">Keep both</span>
                      <span className="text-xs text-muted-foreground">
                        Also schedules {stagedTemplate.name}.{' '}
                        {diff.added.length > 0
                          ? <>Adds <span className="font-medium text-foreground">{listFmt(diff.added)}</span>. Nothing sends twice.</>
                          : <>It covers nothing the current survey does not already. Nothing sends twice.</>}
                        {' '}{row.template?.name ?? 'The current template'} keeps its own assignment.
                      </span>
                    </span>
                  </Label>
                </RadioGroup>

                {/* S3 escape hatch — a SIBLING of the radio options, not
                    nested inside either Label (that would fold the link's
                    text into the radio's accessible name). Surfaced at the
                    exact moment the conflict is visible, since running two
                    templates is often a workaround for one missing aspect on
                    the already-scheduled one. */}
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
            )}
            <WizardFooter
              className="mt-3 pt-3"
              backLabel="Back"
              submitLabel="Apply"
              onBack={() => setCurrent(0)}
              onSubmit={() => stagedTemplate && onApply({ templateId: stagedTemplate.id, resolution })}
            />
            <Button variant="ghost" size="xs" className="-mt-2 self-start" onClick={onCancel}>Cancel</Button>
          </WizardPanel>
        </WizardContent>
      </Wizard>
    </div>
  )
}

// ── Expanded row detail ──────────────────────────────────────────────────────

function RowDetail({
  row, surveys, templates, publishedTemplates, included, toggleUnit, setTemplateFor,
  wizardOpen, onWizardOpenChange,
}: {
  row: DemoRow
  surveys: PceSurvey[]
  templates: PceTemplate[]
  publishedTemplates: PceTemplate[]
  included: ReadonlySet<string>
  toggleUnit: (key: string) => void
  setTemplateFor: (offeringId: string, templateId: string) => void
  /** Controlled by the PAGE (not local state) — the parent needs to know
   *  "is any row's wizard mid-flow" to lock every other row's accordion
   *  trigger, so this row can't own that boolean privately. */
  wizardOpen: boolean
  onWizardOpenChange: (open: boolean) => void
}) {
  const [secondary, setSecondary] = useState<PceTemplate | null>(null)
  const hasExistingSurvey = surveys.some(s => s.offeringId === row.offering.id && !s.cancelledAt)

  function handleApply(result: FlowResult) {
    if (result.resolution === 'replace') {
      setTemplateFor(row.offering.id, result.templateId)
      setSecondary(null)
    } else {
      // Local-only receipt — see file header. The harness has one template
      // slot per offering; this does not schedule a second real survey.
      setSecondary(publishedTemplates.find(t => t.id === result.templateId) ?? null)
    }
    onWizardOpenChange(false)
  }

  return (
    // Reverted per product-owner request — back to per-element locking
    // (disabled checkboxes + an explanatory note), not a covering scrim.
    // Cross-row locking (other rows' expand triggers, this row's own
    // collapse trigger) is untouched — see the page component below.
    <div className="mx-4 mb-3 rounded-md border border-border bg-background">
      <div className="grid gap-x-8 gap-y-4 p-4 md:grid-cols-[minmax(0,380px)_minmax(0,1fr)]">
        <div className="flex flex-col gap-2">
          <span className="text-xs font-medium text-muted-foreground">Template</span>

          {!row.template || !hasExistingSurvey ? (
            // Nothing to conflict with — a plain control, no step chrome.
            // Showing a "might be 2 steps" indicator here would be dishonest;
            // there's no history for a new pick to overlap with. (The wizard
            // only ever opens from the "Change" branch below, so this branch
            // never coincides with wizardOpen.)
            <div className="flex flex-col gap-1.5">
              <Select value={row.template?.id ?? ''} onValueChange={v => setTemplateFor(row.offering.id, v)}>
                <SelectTrigger size="sm" aria-label={`Template for ${row.code}${!row.template ? ' · required' : ''}`} className="w-full">
                  <SelectValue placeholder="Assign template" />
                </SelectTrigger>
                <SelectContent>
                  {publishedTemplates.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                </SelectContent>
              </Select>
              {!hasExistingSurvey && (
                <p className="text-xs text-muted-foreground">No existing survey for this course — nothing to conflict with.</p>
              )}
            </div>
          ) : wizardOpen ? (
            <TemplateFlowWizard
              row={row}
              surveys={surveys}
              templates={templates}
              publishedTemplates={publishedTemplates}
              onApply={handleApply}
              onCancel={() => onWizardOpenChange(false)}
            />
          ) : (
            <div className="flex flex-col gap-1.5 rounded-md border border-border p-3">
              <span className="text-sm font-medium">{row.template.name}</span>
              <span className="text-xs text-muted-foreground">{row.template.questionCount} questions</span>
              <Button variant="ghost" size="xs" className="mt-1 self-start" onClick={() => onWizardOpenChange(true)}>Change</Button>
            </div>
          )}

          {secondary && !wizardOpen && (
            <div className="flex items-center justify-between gap-2 rounded-md border border-dashed border-border p-2.5">
              <span className="flex min-w-0 items-center gap-2 text-sm">
                <i className="fa-light fa-arrow-right-arrow-left shrink-0 text-xs" style={{ color: 'var(--chip-4)' }} aria-hidden="true" />
                <span className="truncate"><span className="font-medium">Also evaluating</span> · {secondary.name}</span>
              </span>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-xs font-medium text-muted-foreground">Evaluatees</span>
          <EvaluateesMini row={row} included={included} toggleUnit={toggleUnit} disabled={wizardOpen} />
        </div>
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────

const WIZARD_LOCK_NOTE_ID = 'template-wizard-lock-note'

export default function PushStep2TemplateFlowWizardComparePage() {
  const { rows, publishedTemplates, included, toggleUnit, setTemplateFor } = useStep2RowDetailDemo()
  const { templates, surveys } = usePce()
  const [openId, setOpenId] = useState<string | null>(null)
  // Which row's template wizard is currently mid-flow (Step 1 or 2,
  // un-applied) — tracked at the PAGE level, not inside each row, because
  // locking the REST of the table (every other row's expand trigger, this
  // row's own collapse trigger) is a table-wide decision the individual row
  // can't make on its own. Null = nothing mid-flow, table fully interactive.
  const [wizardActiveId, setWizardActiveId] = useState<string | null>(null)
  const lockedRow = rows.find(r => r.offering.id === wizardActiveId) ?? null
  const tableLocked = wizardActiveId !== null

  return (
    <div className="flex flex-col gap-5 p-6 max-w-[1100px] mx-auto">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold font-heading">Step 2 template reassign — explicit 2-step mini-wizard</h1>
        <p className="text-sm text-muted-foreground">
          Same 6 real offerings (Fall 2026–2027). Change on a course with an existing survey opens a compact
          Step 1/Step 2 flow instead of an inline card followed by a surprise dialog — DPT-510 is the conflict case.
        </p>
      </div>

      {tableLocked && (
        <LocalBanner id={WIZARD_LOCK_NOTE_ID} variant="info" icon="fa-lock">
          Finish choosing a template for <strong>{lockedRow?.code ?? 'this course'}</strong> before opening another
          course — Cancel or complete the wizard below to unlock the table.
        </LocalBanner>
      )}

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
            const isOpen = openId === offering.id
            // This row owns the active wizard vs. some OTHER row does —
            // both lock the accordion trigger (Radix `disabled` on
            // Collapsible blocks the toggle outright), but the aria-label
            // differs so a screen-reader user knows WHY: "finish this one"
            // vs. "finish that other one first".
            const isWizardRow = wizardActiveId === offering.id
            return (
              <Collapsible
                key={offering.id}
                open={isOpen}
                disabled={tableLocked}
                onOpenChange={() => {
                  if (tableLocked) return // belt-and-suspenders — Radix already blocks toggling a disabled Collapsible
                  setOpenId(prev => (prev === offering.id ? null : offering.id))
                }}
                className="border-b border-border last:border-b-0"
              >
                <div className="grid items-center gap-3 ps-3 pe-3 py-2" style={{ gridTemplateColumns: GRID, minHeight: 44 }}>
                  <span className="flex items-center">
                    <Checkbox
                      checked={freshKeys.length > 0 ? (inCount === freshKeys.length ? true : inCount > 0 ? 'indeterminate' : false) : false}
                      disabled={freshKeys.length === 0 || isWizardRow}
                      aria-disabled={isWizardRow || undefined}
                      aria-describedby={isWizardRow ? WIZARD_LOCK_NOTE_ID : undefined}
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
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="group"
                      aria-disabled={tableLocked || undefined}
                      aria-describedby={tableLocked ? WIZARD_LOCK_NOTE_ID : undefined}
                      aria-label={
                        !tableLocked
                          ? `${isOpen ? 'Hide' : 'Show'} template and evaluatee controls for ${code}`
                          : isWizardRow
                            ? `Finish or cancel the template wizard for ${code} to close this row`
                            : `Finish choosing a template for ${lockedRow?.code ?? 'the open course'} before opening ${code}`
                      }
                    >
                      <i className="fa-light fa-chevron-down text-xs transition-transform group-data-[state=open]:rotate-180" aria-hidden="true" />
                    </Button>
                  </CollapsibleTrigger>
                  <span className="flex min-w-0 items-baseline gap-2">
                    <span className="shrink-0 font-mono text-xs tabular-nums text-muted-foreground">{code}</span>
                    {name && <span className="truncate text-sm">{name}</span>}
                  </span>
                  <span className="min-w-0"><TemplateChip template={row.template} /></span>
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {inCount}/{freshKeys.length || 0} included
                  </span>
                  <span className="min-w-0"><RowStatus row={row} /></span>
                </div>

                <CollapsibleContent>
                  <RowDetail
                    row={row}
                    surveys={surveys}
                    templates={templates}
                    publishedTemplates={publishedTemplates}
                    included={included}
                    toggleUnit={toggleUnit}
                    setTemplateFor={setTemplateFor}
                    wizardOpen={isWizardRow}
                    onWizardOpenChange={open => setWizardActiveId(open ? offering.id : null)}
                  />
                </CollapsibleContent>
              </Collapsible>
            )
          })}
        </CardContent>
      </Card>
    </div>
  )
}
