'use client'

// COMPARE ROUTE (throwaway — delete once a variant is picked, same lifecycle
// as /compare/push-instances and /compare/push-flow-rows).
//
// Jul 25 round — four layouts for the push wizard's "Survey design" step,
// answering the standing tensions in the current master-list + detail build:
// the detail panel idles mostly empty, decisions hide one course at a time
// (13 clicks to review 13 courses), and course names truncate at 400px.
//
//   ?v=a  ANCHOR LEDGER   — every course card visible in one column; a sticky
//                           rail (mono code + status dot) gives the overview
//                           and jumps. Analogy: Product Hunt launch checklist.
//   ?v=b  DECISION QUEUE  — exceptions first: the 8 missing roles and 3
//                           already-covered questions form a flat queue; the
//                           happy-path plan collapses below. Analogy: 7shifts
//                           publish warnings, Remote "only rows with errors".
//   ?v=c  WORKSHEET       — the whole plan as one sheet: sticky course bands
//                           (template select right) over instance rows with a
//                           fixed state lane. Analogy: Remote import review.
//   ?v=d  SPLIT, GROWN UP — the current split refined: two-line list rows
//                           carry the decisions' scent, the detail panel earns
//                           its width (always-open ledger + prev/next), the
//                           footer walks the needs-setup queue. Analogy:
//                           Klaviyo campaign review, Linear list + detail.
//
// Round 2 (same day — "don't limit yourself"): three models that break the
// card/list frame entirely:
//   ?v=e  BRIEFING       — the plan in plain language: one lead sentence, three
//                          drill-in sections (missing roles / already exist /
//                          ready). Analogy: Lemon Squeezy "You're almost
//                          ready", Zillow lease review, TurboTax.
//   ?v=f  COVERAGE GRID  — courses × evaluation-target matrix; glyph cells,
//                          click a cell to act in a popover. The only form
//                          that exposes systemic patterns ("Coordinator
//                          missing in 5 courses"). Analogy: permissions
//                          matrices, Airtable grid.
//   ?v=g  FOCUS FLOW     — one decision at a time with an Up-next stack and
//                          a done state. Fastest hands-on path through the 11
//                          decisions. Analogy: Superhuman triage. (Note: the
//                          Jul rounds rejected nested sub-steps; this is NOT a
//                          stepper — free navigation, decisions optional.)
//
// All four run the REAL pt5 machinery — offeringsForScope → template defaults
// → expandInstances vs open flows — so duplicate/gap verdicts and counts match
// the live wizard, and template changes re-derive the plan live.
// Settled vocabulary holds everywhere: being created is the quiet default,
// amber strictly = missing data, duplicates are info (blue), dates carry
// meaning ("Opens Dec 4"), actions live in a control lane, never in prose.

import { Suspense, useMemo, useEffect, useRef, useState, type ReactNode } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import {
  Button, Checkbox, CheckboxLabel, ToggleSwitch,
  Card, CardHeader, CardTitle, CardContent,
  Collapsible, CollapsibleTrigger, CollapsibleContent,
  Select, SelectTrigger, SelectContent, SelectItem, SelectValue,
  Popover, PopoverTrigger, PopoverContent,
} from '@exxatdesignux/ui'
import { PersonAvatar } from '@/components/pce/person-avatar'
import { SurveyStatusBadgeOS } from '@/components/pce/pce-badges'
import { usePce } from '@/components/pce/pce-state'
import { AddInPrismButton, TypePill } from '@/components/pce/courses-evaluatees/scope-controls'
import {
  MOCK_PROGRAM_TERMS, deliveryModeOf, COURSE_TYPE_FULL_LABEL,
  type CourseOffering, type PceSurvey, type PceTemplate,
} from '@/lib/pce-mock-data'
import { offeringsForScope } from '@/lib/pce-course-scope'
import { courseLabelOf } from '@/lib/pce-course-readiness'
import { expandInstances, type SurveyInstance } from '@/lib/pce-push-validation'

// ── Shared model — the real pt5 plan, one source for all four variants ───────

function fmtOpen(iso?: string): string | null {
  if (!iso) return null
  const [y, m, d] = iso.split('-').map(Number)
  if (!y || !m || !d) return null
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}
function openPhrase(f: PceSurvey): string | null {
  if (f.status === 'scheduled') {
    const d = fmtOpen(f.openDate)
    return d ? `Opens ${d}` : null
  }
  return null
}
const instanceLabel = (i: SurveyInstance) =>
  i.scope === 'course' ? 'Course material' : (i.personName ?? 'No one assigned')

/** code + name split; fixture master-courses without a catalog entry fall back
 *  to the raw id (mc3/mc11) — show it as the code so the row never goes blank. */
function splitLabel(o: CourseOffering): { code: string; name: string } {
  const label = courseLabelOf(o)
  if (!label.includes(' – ')) return { code: label, name: '' }
  const [code, ...rest] = label.split(' – ')
  return { code, name: rest.join(' – ') }
}

interface PlanModel {
  courses: CourseOffering[]
  byOffering: Map<string, SurveyInstance[]>
  instances: SurveyInstance[]
  publishedTemplates: PceTemplate[]
  templateIdFor: (o: CourseOffering) => string
  setTemplate: (offeringId: string, templateId: string) => void
  included: Set<string>
  flip: (key: string) => void
  setMany: (keys: string[], on: boolean) => void
  needsSetup: (o: CourseOffering) => boolean
  counts: { toCreate: number; reEvals: number; skipped: number; gaps: number; needsCount: number }
}

function usePlanModel(): PlanModel {
  const { templates, surveys } = usePce()
  const publishedTemplates = useMemo(
    () => templates.filter(t => t.status === 'active' && (!t.surveyType || t.surveyType === 'course_evaluation')),
    [templates],
  )
  const term = MOCK_PROGRAM_TERMS.find(t => t.id === 'pt5')!
  const courses = useMemo(
    () =>
      offeringsForScope(term.season, term.academicYear, [])
        .filter(o => o.enrolledCount > 0)
        .sort((a, b) => courseLabelOf(a).localeCompare(courseLabelOf(b), undefined, { numeric: true })),
    [term.season, term.academicYear],
  )

  // Same default-assignment rule as the wizard: match on courseType, else first.
  const defaults = useMemo(() => {
    const result: Record<string, string> = {}
    if (publishedTemplates.length === 0) return result
    for (const o of courses) {
      const matched = o.courseType ? publishedTemplates.find(t => t.courseType === o.courseType) : undefined
      result[o.id] = (matched ?? publishedTemplates[0]).id
    }
    return result
  }, [courses, publishedTemplates])
  const [assignments, setAssignments] = useState<Record<string, string>>({})
  const templateIdFor = (o: CourseOffering) => {
    const raw = assignments[o.id] ?? defaults[o.id] ?? ''
    return publishedTemplates.some(t => t.id === raw) ? raw : ''
  }
  const setTemplate = (offeringId: string, templateId: string) =>
    setAssignments(prev => ({ ...prev, [offeringId]: templateId }))

  const byTemplateId = useMemo(() => new Map(publishedTemplates.map(t => [t.id, t])), [publishedTemplates])
  const instances = useMemo(
    () =>
      courses.flatMap(o => {
        const raw = assignments[o.id] ?? defaults[o.id] ?? ''
        return expandInstances(o, byTemplateId.get(raw) ?? null, surveys)
      }),
    [courses, assignments, defaults, byTemplateId, surveys],
  )
  const byOffering = useMemo(() => {
    const m = new Map<string, SurveyInstance[]>()
    for (const i of instances) m.set(i.offeringId, [...(m.get(i.offeringId) ?? []), i])
    return m
  }, [instances])

  // Inclusion — news default in, duplicates default out (UC4 soft warning).
  const [included, setIncluded] = useState<Set<string>>(new Set())
  const planSig = instances.map(i => `${i.key}:${i.status}`).join('\0')
  const lastPlanSig = useRef('')
  useEffect(() => {
    if (lastPlanSig.current === planSig) return
    lastPlanSig.current = planSig
    setIncluded(new Set(instances.filter(i => i.status === 'new').map(i => i.key)))
  }, [planSig, instances])
  const flip = (key: string) =>
    setIncluded(prev => {
      const next = new Set(prev)
      next.has(key) ? next.delete(key) : next.add(key)
      return next
    })
  const setMany = (keys: string[], on: boolean) =>
    setIncluded(prev => {
      const next = new Set(prev)
      keys.forEach(k => (on ? next.add(k) : next.delete(k)))
      return next
    })

  const needsSetup = (o: CourseOffering) => {
    if (!templateIdFor(o)) return true
    return (byOffering.get(o.id) ?? []).some(i => i.status === 'gap')
  }
  const toCreate = instances.filter(i => i.status !== 'gap' && included.has(i.key)).length
  const reEvals = instances.filter(i => i.status === 'duplicate' && included.has(i.key)).length
  const dupTotal = instances.filter(i => i.status === 'duplicate').length
  const gaps = instances.filter(i => i.status === 'gap').length
  const needsCount = courses.filter(needsSetup).length

  return {
    courses, byOffering, instances, publishedTemplates, templateIdFor, setTemplate,
    included, flip, setMany, needsSetup,
    counts: { toCreate, reEvals, skipped: dupTotal - reEvals, gaps, needsCount },
  }
}

// ── Shared pieces (settled vocabulary) ───────────────────────────────────────

function ReadinessChip({ state }: { state: 'needs' | 'ready' | 'excluded' }) {
  if (state === 'excluded') {
    return (
      <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap bg-muted text-muted-foreground shrink-0">
        Excluded
      </span>
    )
  }
  const needs = state === 'needs'
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap shrink-0"
      style={{
        background: needs ? 'var(--group-band-attention-bg)' : 'var(--group-band-done-bg)',
        color: needs ? 'var(--chip-4)' : 'var(--chip-2)',
      }}
    >
      <span aria-hidden="true" className="size-1.5 rounded-full" style={{ background: needs ? 'var(--chip-4)' : 'var(--chip-2)' }} />
      {needs ? 'Needs setup' : 'Ready'}
    </span>
  )
}

function EvaluateeDisc({ item, size = 5 }: { item: SurveyInstance; size?: 4 | 5 }) {
  if (item.scope === 'course') {
    return (
      <span className={`size-${size} rounded-full flex items-center justify-center shrink-0 border border-border bg-background`}>
        <i className={`fa-light fa-book-open ${size === 5 ? 'text-[9px]' : 'text-[8px]'} text-muted-foreground`} aria-hidden="true" />
      </span>
    )
  }
  return <PersonAvatar name={item.personName!} className={`size-${size}`} />
}

function LedgerLine({ item }: { item: SurveyInstance }) {
  return (
    <span className="flex items-center gap-1.5 min-w-0">
      <EvaluateeDisc item={item} />
      <span className="text-sm truncate">
        {instanceLabel(item)}
        {item.scope !== 'course' && item.roleLabel && (
          <span className="text-xs text-muted-foreground"> · {item.roleLabel}</span>
        )}
      </span>
    </span>
  )
}

function NamesInline({ items }: { items: SurveyInstance[] }) {
  return (
    <span className="flex items-center gap-x-2.5 gap-y-0.5 flex-wrap min-w-0">
      {items.map(i => (
        <span key={i.key} className="inline-flex items-center gap-1 min-w-0">
          <EvaluateeDisc item={i} size={4} />
          <span className="truncate">{instanceLabel(i)}</span>
        </span>
      ))}
    </span>
  )
}

function ExistingFacts({ item }: { item: SurveyInstance }) {
  if (!item.existing) return null
  const phrase = openPhrase(item.existing)
  return (
    <span className="flex items-center gap-1.5 shrink-0">
      <SurveyStatusBadgeOS status={item.existing.status} />
      {phrase && (
        <span className="text-xs tabular-nums text-muted-foreground inline-flex items-center gap-1 whitespace-nowrap">
          <i className="fa-light fa-clock text-[10px]" aria-hidden="true" />
          {phrase}
        </span>
      )}
    </span>
  )
}

function TemplateSelect({ model, offering }: { model: PlanModel; offering: CourseOffering }) {
  const { code } = splitLabel(offering)
  const templateId = model.templateIdFor(offering)
  return (
    <Select value={templateId} onValueChange={v => model.setTemplate(offering.id, v)}>
      <SelectTrigger
        aria-label={`Template for ${code}${!templateId ? ' — required' : ''}`}
        className={!templateId ? 'w-fit min-w-0 border-0 shadow-none' : 'min-w-0 [&>span]:truncate [&>span]:min-w-0 bg-background'}
        style={{
          height: 28, fontSize: 12,
          ...(templateId ? { width: 180 } : { paddingInline: 10, background: 'var(--insight-severity-info-bg)' }),
        }}
      >
        <SelectValue
          placeholder={
            <span className="flex items-center gap-1.5 font-medium" style={{ color: 'var(--insight-severity-info-fg)' }}>
              <i className="fa-light fa-plus text-xs" aria-hidden="true" />
              Assign template
            </span>
          }
        />
      </SelectTrigger>
      <SelectContent>
        {model.publishedTemplates.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
      </SelectContent>
    </Select>
  )
}

function SummaryLine({ counts }: { counts: PlanModel['counts'] }) {
  return (
    <p className="text-sm tabular-nums">
      <span className="font-semibold">{counts.toCreate} evaluation{counts.toCreate !== 1 ? 's' : ''}</span> will be set up
      {counts.reEvals > 0 && <span style={{ color: 'var(--insight-severity-info-fg)' }}> · {counts.reEvals} evaluated again</span>}
      {counts.skipped > 0 && <span className="text-muted-foreground"> · {counts.skipped} already covered</span>}
      {counts.gaps > 0 && <span style={{ color: 'var(--chip-4)' }}> · {counts.gaps} role{counts.gaps !== 1 ? 's' : ''} unassigned</span>}
    </p>
  )
}

function StepFooter({ model }: { model: PlanModel }) {
  const { counts, courses } = model
  return (
    <div className="sticky bottom-0 mt-auto bg-background border-t border-border py-4 flex items-center justify-between gap-4">
      <span className="text-xs tabular-nums text-muted-foreground">
        {counts.toCreate} evaluation{counts.toCreate !== 1 ? 's' : ''} across {courses.length} course{courses.length !== 1 ? 's' : ''}
        {counts.reEvals > 0 && <> · {counts.reEvals} evaluated again</>}
        {counts.skipped > 0 && <> · {counts.skipped} already covered</>}
      </span>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" disabled>
          <i className="fa-light fa-arrow-left text-xs" aria-hidden="true" />
          Back
        </Button>
        <Button variant="default" size="sm" disabled={counts.toCreate === 0}>
          Continue
          <i className="fa-light fa-arrow-right text-xs" aria-hidden="true" />
        </Button>
      </div>
    </div>
  )
}

// ── Course card — the settled per-course anatomy (variants A and D reuse) ────

function CourseCard({
  model, offering, ledgerAlwaysOpen = false, anchorId,
}: {
  model: PlanModel
  offering: CourseOffering
  /** D: the panel earns its width — no disclosure, the ledger just shows. */
  ledgerAlwaysOpen?: boolean
  anchorId?: string
}) {
  const [stackOpen, setStackOpen] = useState(false)
  const { code, name } = splitLabel(offering)
  const all = model.byOffering.get(offering.id) ?? []
  const fresh = all.filter(i => i.status === 'new')
  const dups = all.filter(i => i.status === 'duplicate')
  const gaps = all.filter(i => i.status === 'gap')
  const freshIn = fresh.filter(i => model.included.has(i.key)).length
  const saidYes = dups.some(d => model.included.has(d.key))
  const courseKeys = (fresh.length > 0 ? fresh : dups).map(i => i.key)
  const courseIncluded = courseKeys.filter(k => model.included.has(k)).length
  const state: 'needs' | 'ready' | 'excluded' =
    courseIncluded === 0 && courseKeys.length > 0 ? 'excluded' : model.needsSetup(offering) ? 'needs' : 'ready'
  const templateId = model.templateIdFor(offering)
  const dupStatuses = [...new Set(dups.map(d => d.existing?.status ?? 'scheduled'))]
  const dupOpens = [...new Set(dups.map(d => (d.existing ? openPhrase(d.existing) : null)))]
  const sharedStatus = dupStatuses.length === 1 ? dupStatuses[0] : null
  const sharedOpen = dupOpens.length === 1 ? dupOpens[0] : null
  const showLedger = ledgerAlwaysOpen || stackOpen

  return (
    <Card id={anchorId} size="sm" className="overflow-hidden py-0 gap-0" style={anchorId ? { scrollMarginTop: 16 } : undefined}>
      <CardHeader className="flex flex-row items-center gap-2.5 space-y-0 border-b border-border" style={{ padding: '10px 12px' }}>
        <Checkbox
          checked={courseKeys.length === 0 ? false : courseIncluded === courseKeys.length ? true : courseIncluded > 0 ? 'indeterminate' : false}
          onCheckedChange={v => {
            if (v) model.setMany(courseKeys, true)
            else model.setMany(all.filter(i => i.status !== 'gap').map(i => i.key), false)
          }}
          aria-label={`Include ${code} in this push`}
        />
        <CardTitle className="text-sm font-semibold flex items-baseline gap-2 min-w-0" title={courseLabelOf(offering)}>
          <span className="font-mono text-xs tabular-nums text-muted-foreground shrink-0">{code}</span>
          {name && <span className="truncate">{name}</span>}
        </CardTitle>
        <ReadinessChip state={state} />
        <span className="ms-auto">
          <TemplateSelect model={model} offering={offering} />
        </span>
      </CardHeader>

      <CardContent className={`p-0 ${state === 'excluded' ? 'opacity-50' : ''}`}>
        {!templateId && model.publishedTemplates.length > 0 && (
          <p className="px-4 py-3 text-sm text-muted-foreground">Assign a template to plan this course&apos;s evaluations.</p>
        )}

        {fresh.length > 0 && (ledgerAlwaysOpen ? (
          <div>
            <p className="ps-4 pe-4 pt-2.5 pb-1 text-sm font-medium">{freshIn} new evaluation{freshIn !== 1 ? 's' : ''}</p>
            {fresh.map(item => (
              <div key={item.key} className="flex items-center gap-2.5 ps-4 pe-4" style={{ minHeight: 40 }}>
                <Checkbox id={`cc-${item.key}`} checked={model.included.has(item.key)} onCheckedChange={() => model.flip(item.key)} />
                <CheckboxLabel htmlFor={`cc-${item.key}`} className="flex items-center font-normal min-w-0">
                  <LedgerLine item={item} />
                </CheckboxLabel>
              </div>
            ))}
            <div className="pb-1.5" />
          </div>
        ) : (
          <Collapsible open={stackOpen} onOpenChange={setStackOpen}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="w-full h-auto p-0 block text-start font-normal rounded-none hover:bg-muted/50" aria-expanded={stackOpen}>
                <div className="flex items-center gap-3 pe-4 ps-4 py-2.5" style={{ minHeight: 46 }}>
                  <div className="flex flex-col gap-0.5 min-w-0">
                    <span className="text-sm font-medium">{freshIn} new evaluation{freshIn !== 1 ? 's' : ''}</span>
                    <span className="text-xs text-muted-foreground truncate"><NamesInline items={fresh} /></span>
                  </div>
                  <i className={`fa-light fa-chevron-${showLedger ? 'up' : 'down'} text-xs text-muted-foreground ms-auto`} aria-hidden="true" />
                </div>
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              {fresh.map(item => (
                <div key={item.key} className="flex items-center gap-2.5 ps-9 pe-4 border-t border-border" style={{ minHeight: 42 }}>
                  <Checkbox id={`cc-${item.key}`} checked={model.included.has(item.key)} onCheckedChange={() => model.flip(item.key)} />
                  <CheckboxLabel htmlFor={`cc-${item.key}`} className="flex items-center font-normal min-w-0">
                    <LedgerLine item={item} />
                  </CheckboxLabel>
                </div>
              ))}
            </CollapsibleContent>
          </Collapsible>
        ))}

        {dups.length > 0 && (
          <Collapsible open={saidYes} className={fresh.length > 0 ? 'border-t border-border' : ''}>
            <div className="p-2.5">
              <div className="rounded-lg flex flex-wrap items-center gap-x-3 gap-y-1.5 px-3 py-2.5" style={{ background: 'var(--insight-severity-info-bg)' }}>
                <i className="fa-solid fa-circle-info text-xs shrink-0" style={{ color: 'var(--insight-severity-info-fg)' }} aria-hidden="true" />
                <div className="flex flex-col gap-0.5 min-w-0">
                  <span className="text-sm font-medium">Evaluation already exists</span>
                  <span className="text-xs text-muted-foreground flex items-center gap-2 min-w-0">
                    <NamesInline items={dups} />
                    {sharedStatus && <SurveyStatusBadgeOS status={sharedStatus} />}
                    {sharedOpen && (
                      <span className="inline-flex items-center gap-1 tabular-nums whitespace-nowrap">
                        <i className="fa-light fa-clock text-[10px]" aria-hidden="true" />
                        {sharedOpen}
                      </span>
                    )}
                  </span>
                </div>
                <label htmlFor={`cc-reeval-${offering.id}`} className="ms-auto flex items-center gap-2 text-sm cursor-pointer shrink-0">
                  <span className="font-medium whitespace-nowrap">Evaluate again?</span>
                  <span className="text-muted-foreground">{saidYes ? 'Yes' : 'No'}</span>
                  <ToggleSwitch id={`cc-reeval-${offering.id}`} checked={saidYes} onChange={v => model.setMany(dups.map(d => d.key), v)} />
                  <span className="sr-only">Evaluate the already-covered evaluatees of {code} again</span>
                </label>
              </div>
            </div>
            <CollapsibleContent>
              {dups.map(item => (
                <div key={item.key} className="flex items-center gap-2.5 ps-9 pe-4 border-t border-border" style={{ minHeight: 42 }}>
                  <Checkbox id={`cc-${item.key}`} checked={model.included.has(item.key)} onCheckedChange={() => model.flip(item.key)} />
                  <CheckboxLabel htmlFor={`cc-${item.key}`} className="flex items-center font-normal min-w-0">
                    <LedgerLine item={item} />
                  </CheckboxLabel>
                  <span className="ms-auto"><ExistingFacts item={item} /></span>
                </div>
              ))}
            </CollapsibleContent>
          </Collapsible>
        )}

        {gaps.length > 0 && (
          <div className={`p-2.5 flex flex-col gap-2 ${fresh.length > 0 || dups.length > 0 ? 'border-t border-border' : ''}`}>
            {gaps.map(item => (
              <div key={item.key} className="rounded-lg flex flex-wrap items-center gap-x-3 gap-y-1.5 px-3 py-2" style={{ background: 'var(--group-band-attention-bg)' }}>
                <i className="fa-solid fa-triangle-exclamation text-xs shrink-0" style={{ color: 'var(--chip-4)' }} aria-hidden="true" />
                <div className="flex flex-col gap-0 min-w-0">
                  <span className="text-sm font-medium">No {item.roleLabel} assigned</span>
                  <span className="text-xs text-muted-foreground">Add one in Prism to evaluate this role.</span>
                </div>
                <span className="ms-auto shrink-0">
                  {item.prismHref && <AddInPrismButton href={item.prismHref} label="Add faculty" roles={[item.roleLabel]} />}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ═════════════════════════════════════════════════════════════════════════════
// VARIANT A — ANCHOR LEDGER: all cards in one column, a sticky rail to steer.
// ═════════════════════════════════════════════════════════════════════════════

function VariantA({ model }: { model: PlanModel }) {
  const [activeId, setActiveId] = useState<string | null>(null)
  const needs = model.courses.filter(o => model.needsSetup(o))
  const ready = model.courses.filter(o => !model.needsSetup(o))
  const jump = (id: string) => {
    setActiveId(id)
    document.getElementById(`va-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
  const RailGroup = ({ label, dot, items }: { label: string; dot: string; items: CourseOffering[] }) =>
    items.length === 0 ? null : (
      <div className="flex flex-col gap-0.5">
        <p className="text-xs font-medium text-muted-foreground px-2 pt-2 pb-1">{label} ({items.length})</p>
        {items.map(o => {
          const { code } = splitLabel(o)
          return (
            <Button
              key={o.id}
              variant="ghost"
              size="sm"
              className={`justify-start gap-2 px-2 h-7 font-normal ${activeId === o.id ? 'bg-secondary font-medium' : 'text-muted-foreground'}`}
              onClick={() => jump(o.id)}
            >
              <span aria-hidden="true" className="size-1.5 rounded-full shrink-0" style={{ background: dot }} />
              <span className="font-mono text-xs tabular-nums">{code}</span>
            </Button>
          )
        })}
      </div>
    )

  return (
    <div className="flex gap-5 items-start">
      <nav className="sticky shrink-0 rounded-lg border border-border p-1.5" style={{ top: 16, width: 172 }} aria-label="Jump to course">
        <RailGroup label="Needs setup" dot="var(--chip-4)" items={needs} />
        <RailGroup label="Ready" dot="var(--chip-2)" items={ready} />
      </nav>
      <div className="flex-1 min-w-0 flex flex-col gap-3">
        {[...needs, ...ready].map(o => (
          <CourseCard key={o.id} model={model} offering={o} anchorId={`va-${o.id}`} />
        ))}
      </div>
    </div>
  )
}

// ═════════════════════════════════════════════════════════════════════════════
// VARIANT B — DECISION QUEUE: exceptions first, the happy path folds away.
// ═════════════════════════════════════════════════════════════════════════════

/** The decision queue — shared by Variant B and the Synthesis (H). */
function DecisionQueueSection({ model }: { model: PlanModel }) {
  const gapItems = model.instances.filter(i => i.status === 'gap')
  const dupItems = model.instances.filter(i => i.status === 'duplicate')
  const openDecisions = gapItems.length + dupItems.filter(d => !model.included.has(d.key)).length
  const courseOf = (i: SurveyInstance) => model.courses.find(o => o.id === i.offeringId)!

  const QueueRow = ({ tone, icon, primary, secondary, control }: {
    tone: 'gap' | 'dup'; icon: ReactNode; primary: ReactNode; secondary: ReactNode; control: ReactNode
  }) => (
    <div className="flex items-center gap-3 ps-3 pe-3 py-2 border-b border-border last:border-b-0" style={{ minHeight: 56 }}>
      {/* Color is an object you look at — the disc, not a wash behind the row. */}
      <span
        className="size-8 rounded-full flex items-center justify-center shrink-0"
        style={{ background: tone === 'gap' ? 'var(--group-band-attention-bg)' : 'var(--insight-severity-info-bg)' }}
      >
        {icon}
      </span>
      <div className="flex flex-col gap-0.5 min-w-0">
        <span className="text-sm font-medium">{primary}</span>
        <span className="text-xs text-muted-foreground flex items-center gap-1.5 min-w-0">{secondary}</span>
      </div>
      <span className="ms-auto shrink-0 flex items-center gap-2">{control}</span>
    </div>
  )

  return (
    <section aria-label="Decisions">
        <div className="flex items-baseline gap-2 pb-2">
          <h3 className="text-base font-semibold font-heading">Decisions</h3>
          <span className="text-xs tabular-nums text-muted-foreground">
            {openDecisions === 0 ? 'none left — the plan is ready' : `${openDecisions} to review`}
          </span>
        </div>
        {gapItems.length === 0 && dupItems.length === 0 ? (
          <p className="text-sm text-muted-foreground rounded-lg border border-border px-4 py-6 text-center">
            Nothing needs your attention — every evaluation below is ready to go.
          </p>
        ) : (
          <div className="rounded-lg border border-border overflow-hidden">
            {gapItems.map(item => {
              const { code, name } = splitLabel(courseOf(item))
              return (
                <QueueRow
                  key={item.key}
                  tone="gap"
                  icon={<i className="fa-solid fa-triangle-exclamation text-xs" style={{ color: 'var(--chip-4)' }} aria-hidden="true" />}
                  primary={<>No {item.roleLabel} assigned</>}
                  secondary={<><span className="font-mono tabular-nums">{code}</span>{name && <span className="truncate">{name}</span>}</>}
                  control={item.prismHref && <AddInPrismButton href={item.prismHref} label="Add faculty" roles={[item.roleLabel]} />}
                />
              )
            })}
            {dupItems.map(item => {
              const { code, name } = splitLabel(courseOf(item))
              const on = model.included.has(item.key)
              return (
                <QueueRow
                  key={item.key}
                  tone="dup"
                  icon={<i className="fa-solid fa-circle-info text-xs" style={{ color: 'var(--insight-severity-info-fg)' }} aria-hidden="true" />}
                  primary={
                    <span className="flex items-center gap-1.5 min-w-0">
                      <EvaluateeDisc item={item} size={4} />
                      {instanceLabel(item)}
                      {item.roleLabel && <span className="text-xs text-muted-foreground font-normal">· {item.roleLabel}</span>}
                      <span className="font-normal text-muted-foreground">— already covered</span>
                    </span>
                  }
                  secondary={
                    <>
                      <span className="font-mono tabular-nums">{code}</span>
                      {name && <span className="truncate">{name}</span>}
                      <ExistingFacts item={item} />
                    </>
                  }
                  control={
                    <label htmlFor={`vb-${item.key}`} className="flex items-center gap-2 text-sm cursor-pointer">
                      <span className="font-medium whitespace-nowrap">Evaluate again?</span>
                      <span className="text-muted-foreground">{on ? 'Yes' : 'No'}</span>
                      <ToggleSwitch id={`vb-${item.key}`} checked={on} onChange={() => model.flip(item.key)} />
                    </label>
                  }
                />
              )
            })}
          </div>
        )}
    </section>
  )
}

function VariantB({ model }: { model: PlanModel }) {
  const [planOpen, setPlanOpen] = useState(false)
  return (
    <div className="flex flex-col gap-4">
      <DecisionQueueSection model={model} />

      {/* The plan — collapsed by default; open it to audit or exclude. */}
      <section aria-label="The plan">
        <Collapsible open={planOpen} onOpenChange={setPlanOpen}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="w-full h-auto p-0 block text-start font-normal rounded-lg border border-border hover:bg-muted/50" aria-expanded={planOpen}>
              <div className="flex items-center gap-3 px-3 py-3">
                <span aria-hidden="true" className="size-1.5 rounded-full shrink-0" style={{ background: 'var(--chip-2)' }} />
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-medium">
                    {model.counts.toCreate} evaluation{model.counts.toCreate !== 1 ? 's' : ''} ready across {model.courses.length} courses
                  </span>
                  <span className="text-xs text-muted-foreground">Open to audit the full plan or exclude someone.</span>
                </div>
                <i className={`fa-light fa-chevron-${planOpen ? 'up' : 'down'} text-xs text-muted-foreground ms-auto`} aria-hidden="true" />
              </div>
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="flex flex-col gap-3 pt-3">
              {model.courses.map(o => (
                <CourseCard key={o.id} model={model} offering={o} />
              ))}
            </div>
          </CollapsibleContent>
        </Collapsible>
      </section>
    </div>
  )
}

// ═════════════════════════════════════════════════════════════════════════════
// VARIANT C — WORKSHEET: the whole plan as one sheet, sticky course bands.
// ═════════════════════════════════════════════════════════════════════════════

function VariantC({ model }: { model: PlanModel }) {
  const [onlyAttention, setOnlyAttention] = useState(false)
  const attention = (o: CourseOffering) =>
    (model.byOffering.get(o.id) ?? []).some(i => i.status !== 'new')
  const shown = onlyAttention ? model.courses.filter(attention) : model.courses

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-end">
        <label htmlFor="vc-attention" className="flex items-center gap-2 text-sm cursor-pointer">
          <span className="text-muted-foreground">Only needs attention</span>
          <ToggleSwitch id="vc-attention" checked={onlyAttention} onChange={setOnlyAttention} />
        </label>
      </div>
      <div className="rounded-lg border border-border overflow-hidden">
        {shown.map(o => {
          const { code, name } = splitLabel(o)
          const all = model.byOffering.get(o.id) ?? []
          const selectable = all.filter(i => i.status !== 'gap')
          const inCount = selectable.filter(i => model.included.has(i.key)).length
          const state: 'needs' | 'ready' | 'excluded' =
            inCount === 0 && selectable.length > 0 ? 'excluded' : model.needsSetup(o) ? 'needs' : 'ready'
          return (
            <div key={o.id} className="border-b border-border last:border-b-0">
              {/* Course band — identity + the one setting; sticky under the header. */}
              <div className="sticky top-0 z-10 flex items-center gap-2.5 ps-3 pe-3 py-1.5 bg-muted/60 backdrop-blur-sm border-b border-border" style={{ minHeight: 42 }}>
                <Checkbox
                  checked={selectable.length === 0 ? false : inCount === selectable.length ? true : inCount > 0 ? 'indeterminate' : false}
                  onCheckedChange={v => model.setMany(selectable.map(i => i.key), !!v)}
                  aria-label={`Include ${code} in this push`}
                />
                <span className="text-sm font-semibold flex items-baseline gap-2 min-w-0" title={courseLabelOf(o)}>
                  <span className="font-mono text-xs tabular-nums text-muted-foreground shrink-0">{code}</span>
                  {name && <span className="truncate">{name}</span>}
                </span>
                <ReadinessChip state={state} />
                <span className="ms-auto"><TemplateSelect model={model} offering={o} /></span>
              </div>
              {/* Instance rows — checkbox · who · role | state lane. */}
              {all.map(item => (
                <div
                  key={item.key}
                  className="grid items-center gap-3 ps-3 pe-3 border-b border-border/60 last:border-b-0"
                  style={{ gridTemplateColumns: '16px minmax(0,1fr) 300px', minHeight: 40 }}
                >
                  <span className="flex items-center">
                    {item.status !== 'gap' && (
                      <Checkbox
                        id={`vc-${item.key}`}
                        checked={model.included.has(item.key)}
                        onCheckedChange={() => model.flip(item.key)}
                      />
                    )}
                  </span>
                  {item.status === 'gap' ? (
                    <>
                      <span className="flex items-center gap-1.5 min-w-0">
                        <span className="size-5 rounded-full flex items-center justify-center shrink-0" style={{ background: 'var(--group-band-attention-bg)' }}>
                          <i className="fa-light fa-user-slash text-[9px]" style={{ color: 'var(--chip-4)' }} aria-hidden="true" />
                        </span>
                        <span className="text-sm font-medium" style={{ color: 'var(--chip-4)' }}>No {item.roleLabel} assigned</span>
                      </span>
                      <span className="flex items-center justify-end">
                        {item.prismHref && <AddInPrismButton href={item.prismHref} label="Add faculty" roles={[item.roleLabel]} />}
                      </span>
                    </>
                  ) : (
                    <>
                      <CheckboxLabel htmlFor={`vc-${item.key}`} className="flex items-center font-normal min-w-0">
                        <LedgerLine item={item} />
                      </CheckboxLabel>
                      <span className="flex items-center justify-end gap-2 text-xs text-muted-foreground">
                        {item.status === 'duplicate' ? (
                          <>
                            <span className="inline-flex items-center gap-1.5" style={{ color: 'var(--insight-severity-info-fg)' }}>
                              <i className="fa-solid fa-circle-info text-xs" aria-hidden="true" />
                              {model.included.has(item.key) ? 'Evaluated again' : 'Already covered'}
                            </span>
                            <ExistingFacts item={item} />
                          </>
                        ) : null /* creatable is the quiet default — only exceptions speak */}
                      </span>
                    </>
                  )}
                </div>
              ))}
            </div>
          )
        })}
        {shown.length === 0 && (
          <p className="px-4 py-6 text-sm text-muted-foreground text-center">Every course is ready — nothing needs attention.</p>
        )}
      </div>
    </div>
  )
}

// ═════════════════════════════════════════════════════════════════════════════
// VARIANT D — THE SPLIT, GROWN UP: richer list rows, a detail panel that
// earns its width, and a footer that walks the needs-setup queue.
// ═════════════════════════════════════════════════════════════════════════════

function VariantD({ model }: { model: PlanModel }) {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const detail = model.courses.find(o => o.id === selectedId) ?? model.courses[0] ?? null
  const needs = model.courses.filter(o => model.needsSetup(o))
  const idx = detail ? model.courses.findIndex(o => o.id === detail.id) : -1
  const nextNeeds = needs.find(o => o.id !== detail?.id && model.courses.indexOf(o) > idx) ?? needs.find(o => o.id !== detail?.id)

  return (
    <div className="flex gap-4 items-start">
      {/* Master list — two-line rows carry the decisions' scent. */}
      <div className="rounded-lg border border-border overflow-hidden shrink-0" style={{ width: 440 }}>
        {model.courses.map(o => {
          const { code, name } = splitLabel(o)
          const all = model.byOffering.get(o.id) ?? []
          const fresh = all.filter(i => i.status === 'new')
          const dups = all.filter(i => i.status === 'duplicate')
          const gaps = all.filter(i => i.status === 'gap')
          const selectable = all.filter(i => i.status !== 'gap')
          const inCount = selectable.filter(i => model.included.has(i.key)).length
          const state: 'needs' | 'ready' | 'excluded' =
            inCount === 0 && selectable.length > 0 ? 'excluded' : model.needsSetup(o) ? 'needs' : 'ready'
          const tmpl = model.publishedTemplates.find(t => t.id === model.templateIdFor(o))
          const isActive = detail?.id === o.id
          return (
            <div key={o.id} className={`flex items-start gap-2.5 ps-3 pe-2.5 py-2 border-b border-border last:border-b-0 ${isActive ? 'bg-secondary' : ''}`}>
              <span className="pt-1">
                <Checkbox
                  checked={selectable.length === 0 ? false : inCount === selectable.length ? true : inCount > 0 ? 'indeterminate' : false}
                  onCheckedChange={v => model.setMany(selectable.map(i => i.key), !!v)}
                  aria-label={`Include ${code} in this push`}
                />
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="flex-1 h-auto min-w-0 flex-col items-stretch gap-0.5 px-1.5 py-1 font-normal"
                aria-current={isActive ? 'true' : undefined}
                onClick={() => setSelectedId(o.id)}
              >
                <span className="flex items-center gap-2 min-w-0">
                  <span className={`font-mono text-xs tabular-nums shrink-0 ${isActive ? '' : 'text-muted-foreground'}`}>{code}</span>
                  <span className={`truncate text-sm ${isActive ? 'font-medium' : ''}`}>{name}</span>
                  <span className="ms-auto shrink-0"><ReadinessChip state={state} /></span>
                </span>
                <span className="flex items-center gap-2 text-xs text-muted-foreground min-w-0">
                  <span className="truncate">{tmpl?.name ?? 'No template'}</span>
                  <span className="tabular-nums shrink-0">· {fresh.length + dups.length} evaluation{fresh.length + dups.length !== 1 ? 's' : ''}</span>
                  {gaps.length > 0 && (
                    <span className="inline-flex items-center gap-1 shrink-0" style={{ color: 'var(--chip-4)' }}>
                      <span aria-hidden="true" className="size-1.5 rounded-full" style={{ background: 'var(--chip-4)' }} />
                      {gaps.length} role{gaps.length !== 1 ? 's' : ''} missing
                    </span>
                  )}
                  {dups.length > 0 && (
                    <span className="inline-flex items-center gap-1 shrink-0" style={{ color: 'var(--insight-severity-info-fg)' }}>
                      <span aria-hidden="true" className="size-1.5 rounded-full" style={{ background: 'var(--insight-severity-info-fg)' }} />
                      {dups.length} covered
                    </span>
                  )}
                </span>
              </Button>
            </div>
          )
        })}
      </div>

      {/* Detail — the ledger always shows; prev/next keeps hands on the keyboard. */}
      <div className="flex-1 min-w-0 sticky flex flex-col gap-2.5" style={{ top: 16 }}>
        {detail && <CourseCard model={model} offering={detail} ledgerAlwaysOpen />}
        <div className="flex items-center gap-2">
          <Button
            variant="outline" size="xs" disabled={idx <= 0}
            onClick={() => setSelectedId(model.courses[idx - 1]?.id ?? null)}
            aria-label="Previous course"
          >
            <i className="fa-light fa-arrow-left text-xs" aria-hidden="true" />
            Prev
          </Button>
          <Button
            variant="outline" size="xs" disabled={idx >= model.courses.length - 1}
            onClick={() => setSelectedId(model.courses[idx + 1]?.id ?? null)}
            aria-label="Next course"
          >
            Next
            <i className="fa-light fa-arrow-right text-xs" aria-hidden="true" />
          </Button>
          {nextNeeds && (
            <Button variant="outline" size="xs" className="ms-auto" onClick={() => setSelectedId(nextNeeds.id)}>
              Next needs setup
              <span className="font-mono text-xs tabular-nums text-muted-foreground">{splitLabel(nextNeeds).code}</span>
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

// ═════════════════════════════════════════════════════════════════════════════
// VARIANT E — BRIEFING: the plan in plain language; numbers you can open.
// ═════════════════════════════════════════════════════════════════════════════

function VariantE({ model }: { model: PlanModel }) {
  const [open, setOpen] = useState<Record<string, boolean>>({})
  const gapItems = model.instances.filter(i => i.status === 'gap')
  const dupItems = model.instances.filter(i => i.status === 'duplicate')
  const courseOf = (i: SurveyInstance) => model.courses.find(o => o.id === i.offeringId)!
  const templatesInUse = new Set(model.courses.map(o => model.templateIdFor(o)).filter(Boolean))
  const freshOf = (o: CourseOffering) => (model.byOffering.get(o.id) ?? []).filter(i => i.status === 'new')
  const readyCourses = model.courses.filter(o => freshOf(o).length > 0)

  const Section = ({ k, icon, title, sub, children }: {
    k: string; icon: ReactNode; title: string; sub: string; children: ReactNode
  }) => (
    <Card size="sm" className="py-0 gap-0 overflow-hidden">
      <Collapsible open={!!open[k]} onOpenChange={v => setOpen(p => ({ ...p, [k]: v }))}>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="sm" className="w-full h-auto p-0 block text-start font-normal rounded-none hover:bg-muted/50" aria-expanded={!!open[k]}>
            <div className="flex items-center gap-3 px-4 py-3.5">
              <span className="shrink-0 flex items-center justify-center" style={{ width: 16 }}>{icon}</span>
              <div className="flex flex-col gap-0.5 min-w-0">
                <span className="text-sm font-medium">{title}</span>
                <span className="text-xs text-muted-foreground truncate">{sub}</span>
              </div>
              <i className={`fa-light fa-chevron-${open[k] ? 'up' : 'down'} text-xs text-muted-foreground ms-auto`} aria-hidden="true" />
            </div>
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="border-t border-border">{children}</div>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  )

  return (
    <div className="flex flex-col gap-5 mx-auto w-full" style={{ maxWidth: 760 }}>
      {/* The lead — what pressing Continue will do, in one sentence. */}
      <div className="flex flex-col gap-1 pt-2">
        <p className="text-2xl leading-snug font-heading">
          You&apos;re setting up <span className="font-semibold tabular-nums">{model.counts.toCreate} evaluations</span> across{' '}
          <span className="font-semibold tabular-nums">{model.courses.length} courses</span> for Fall 2026–2027.
        </p>
        <p className="text-sm text-muted-foreground tabular-nums">
          {templatesInUse.size === 1 ? 'Every course uses the same template' : `${templatesInUse.size} templates in play`}
          {model.counts.reEvals > 0 && <> · {model.counts.reEvals} evaluated again</>}
          {model.counts.skipped > 0 && <> · {model.counts.skipped} already covered stay untouched</>}
        </p>
      </div>

      {gapItems.length > 0 && (
        <Section
          k="gaps"
          icon={<i className="fa-solid fa-triangle-exclamation text-xs" style={{ color: 'var(--chip-4)' }} aria-hidden="true" />}
          title={`${gapItems.length} role${gapItems.length !== 1 ? 's have' : ' has'} no one assigned`}
          sub="These evaluations can't be created until someone is added in Prism."
        >
          {gapItems.map(item => {
            const { code, name } = splitLabel(courseOf(item))
            return (
              <div key={item.key} className="flex items-center gap-3 px-4 py-2 border-b border-border/60 last:border-b-0" style={{ minHeight: 48 }}>
                <div className="flex flex-col gap-0.5 min-w-0">
                  <span className="text-sm font-medium">No {item.roleLabel} assigned</span>
                  <span className="text-xs text-muted-foreground"><span className="font-mono tabular-nums">{code}</span>{name && <> {name}</>}</span>
                </div>
                <span className="ms-auto shrink-0">
                  {item.prismHref && <AddInPrismButton href={item.prismHref} label="Add faculty" roles={[item.roleLabel]} />}
                </span>
              </div>
            )
          })}
        </Section>
      )}

      {dupItems.length > 0 && (
        <Section
          k="dups"
          icon={<i className="fa-solid fa-circle-info text-xs" style={{ color: 'var(--insight-severity-info-fg)' }} aria-hidden="true" />}
          title={`${dupItems.length} evaluation${dupItems.length !== 1 ? 's' : ''} already exist${dupItems.length === 1 ? 's' : ''}`}
          sub="Skipped by default — flip any you want to run again."
        >
          {dupItems.map(item => {
            const { code, name } = splitLabel(courseOf(item))
            const on = model.included.has(item.key)
            return (
              <div key={item.key} className="flex items-center gap-3 px-4 py-2 border-b border-border/60 last:border-b-0" style={{ minHeight: 48 }}>
                <EvaluateeDisc item={item} />
                <div className="flex flex-col gap-0.5 min-w-0">
                  <span className="text-sm font-medium truncate">
                    {instanceLabel(item)}
                    {item.roleLabel && <span className="text-xs text-muted-foreground font-normal"> · {item.roleLabel}</span>}
                  </span>
                  <span className="text-xs text-muted-foreground flex items-center gap-1.5 min-w-0">
                    <span className="font-mono tabular-nums">{code}</span>
                    {name && <span className="truncate">{name}</span>}
                    <ExistingFacts item={item} />
                  </span>
                </div>
                <label htmlFor={`ve-${item.key}`} className="ms-auto flex items-center gap-2 text-sm cursor-pointer shrink-0">
                  <span className="text-muted-foreground">{on ? 'Yes' : 'No'}</span>
                  <ToggleSwitch id={`ve-${item.key}`} checked={on} onChange={() => model.flip(item.key)} />
                  <span className="sr-only">Evaluate {instanceLabel(item)} in {code} again</span>
                </label>
              </div>
            )
          })}
        </Section>
      )}

      <Section
        k="ready"
        icon={<span aria-hidden="true" className="size-1.5 rounded-full" style={{ background: 'var(--chip-2)' }} />}
        title={`${model.instances.filter(i => i.status === 'new' && model.included.has(i.key)).length} new evaluations are ready`}
        sub="Open to check who's evaluated in each course, or change a template."
      >
        {readyCourses.map(o => {
          const { code, name } = splitLabel(o)
          const fresh = freshOf(o)
          const keys = fresh.map(i => i.key)
          const inCount = keys.filter(k => model.included.has(k)).length
          return (
            <div key={o.id} className="flex items-center gap-2.5 px-4 py-2 border-b border-border/60 last:border-b-0" style={{ minHeight: 52 }}>
              <Checkbox
                checked={inCount === keys.length ? true : inCount > 0 ? 'indeterminate' : false}
                onCheckedChange={v => model.setMany(keys, !!v)}
                aria-label={`Include ${code} in this push`}
              />
              <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                <span className="text-sm font-medium flex items-baseline gap-2 min-w-0">
                  <span className="font-mono text-xs tabular-nums text-muted-foreground shrink-0">{code}</span>
                  {name && <span className="truncate">{name}</span>}
                </span>
                <span className="text-xs text-muted-foreground"><NamesInline items={fresh} /></span>
              </div>
              <TemplateSelect model={model} offering={o} />
            </div>
          )
        })}
      </Section>
    </div>
  )
}

// ═════════════════════════════════════════════════════════════════════════════
// VARIANT F — COVERAGE GRID: courses × evaluation targets; click a cell to act.
// ═════════════════════════════════════════════════════════════════════════════

/** The coverage matrix — shared by Variant F and the Synthesis (H).
 *  Columns key on the ROLE LABEL, not the criterion: 'instructor' resolves to
 *  "Instructor" on didactic courses but "Placement Faculty" on practice ones —
 *  merging them under one header would mislabel half the column. */
function CoverageGridSection({ model }: { model: PlanModel }) {
  const cols = useMemo(() => {
    const seen = new Map<string, string>()
    for (const i of model.instances) {
      const key = i.scope === 'course' ? 'course' : i.roleLabel
      if (!seen.has(key)) seen.set(key, i.scope === 'course' ? 'Course' : i.roleLabel)
    }
    return [...seen.entries()].sort((a, b) => (a[0] === 'course' ? -1 : b[0] === 'course' ? 1 : 0))
  }, [model.instances])
  const cellOf = (o: CourseOffering, colKey: string) =>
    (model.byOffering.get(o.id) ?? []).filter(i =>
      colKey === 'course' ? i.scope === 'course' : i.scope !== 'course' && i.roleLabel === colKey)
  const colGapCount = (colKey: string) =>
    model.instances.filter(i =>
      (colKey === 'course' ? i.scope === 'course' : i.scope !== 'course' && i.roleLabel === colKey) && i.status === 'gap').length
  const gridTemplate = `280px repeat(${cols.length}, minmax(86px, 1fr)) 196px`

  const Glyph = ({ item }: { item: SurveyInstance }) =>
    item.status === 'gap'
      ? <i className="fa-solid fa-triangle-exclamation text-xs" style={{ color: 'var(--chip-4)' }} aria-hidden="true" />
      : item.status === 'duplicate'
        ? <i className="fa-solid fa-circle-info text-xs" style={{ color: 'var(--insight-severity-info-fg)', opacity: model.included.has(item.key) ? 1 : 0.55 }} aria-hidden="true" />
        : <i className={`fa-${model.included.has(item.key) ? 'solid' : 'light'} fa-circle-check text-xs`} style={{ color: 'var(--chip-2)' }} aria-hidden="true" />

  const cellSummary = (items: SurveyInstance[], code: string, label: string) => {
    const parts = items.map(i =>
      i.status === 'gap' ? `${i.roleLabel} unassigned`
        : i.status === 'duplicate' ? `${instanceLabel(i)} already covered`
          : `${instanceLabel(i)} will be evaluated`)
    return `${code} · ${label}: ${parts.join('; ')}`
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="rounded-lg border border-border overflow-x-auto">
        <div style={{ minWidth: 280 + cols.length * 86 + 196 }}>
          {/* Header — role columns carry the systemic insight. */}
          <div className="grid items-end gap-2 px-3 py-2 border-b border-border bg-muted/60" style={{ gridTemplateColumns: gridTemplate }}>
            <span className="text-xs font-medium text-muted-foreground">Course</span>
            {cols.map(([key, label]) => {
              const missing = colGapCount(key)
              return (
                <span key={key} className="flex flex-col items-center gap-0.5 text-center">
                  <span className="text-xs font-medium text-muted-foreground">{label}</span>
                  {missing > 0 && (
                    <span className="text-xs tabular-nums" style={{ color: 'var(--chip-4)' }}>{missing} missing</span>
                  )}
                </span>
              )
            })}
            <span className="text-xs font-medium text-muted-foreground text-end">Template</span>
          </div>

          {model.courses.map(o => {
            const { code, name } = splitLabel(o)
            const mode = deliveryModeOf(o)
            return (
              <div key={o.id} className="grid items-center gap-2 px-3 border-b border-border/60 last:border-b-0" style={{ gridTemplateColumns: gridTemplate, minHeight: 44 }}>
                <span className="text-sm font-medium flex items-center gap-2 min-w-0" title={courseLabelOf(o)}>
                  <span className="font-mono text-xs tabular-nums text-muted-foreground shrink-0">{code}</span>
                  {name && <span className="truncate font-normal">{name}</span>}
                  <TypePill deliveryMode={mode} label={COURSE_TYPE_FULL_LABEL[mode]} />
                </span>
                {cols.map(([key, label]) => {
                  const items = cellOf(o, key)
                  if (items.length === 0) {
                    return <span key={key} className="text-center text-xs text-muted-foreground/60" aria-hidden="true">—</span>
                  }
                  return (
                    <span key={key} className="flex justify-center">
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 px-2 gap-1.5" aria-label={cellSummary(items, code, label)}>
                            {items.map(i => <Glyph key={i.key} item={i} />)}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent align="center" className="w-96 p-2 flex flex-col gap-1" aria-label={`${code} — ${label} evaluations`}>
                          {items.map(item => (
                            <div key={item.key} className="flex items-center gap-2.5 px-2 py-1.5 rounded-md" style={{ minHeight: 40 }}>
                              {item.status === 'gap' ? (
                                <>
                                  <span className="size-5 rounded-full flex items-center justify-center shrink-0" style={{ background: 'var(--group-band-attention-bg)' }}>
                                    <i className="fa-light fa-user-slash text-[9px]" style={{ color: 'var(--chip-4)' }} aria-hidden="true" />
                                  </span>
                                  <span className="text-sm font-medium" style={{ color: 'var(--chip-4)' }}>No {item.roleLabel} assigned</span>
                                  <span className="ms-auto shrink-0">
                                    {item.prismHref && <AddInPrismButton href={item.prismHref} label="Add faculty" roles={[item.roleLabel]} />}
                                  </span>
                                </>
                              ) : item.status === 'duplicate' ? (
                                <>
                                  <EvaluateeDisc item={item} />
                                  <span className="flex flex-col gap-0.5 min-w-0">
                                    <span className="text-sm font-medium truncate">{instanceLabel(item)}</span>
                                    <span className="text-xs text-muted-foreground flex items-center gap-1.5">Already covered <ExistingFacts item={item} /></span>
                                  </span>
                                  <label htmlFor={`vf-${item.key}`} className="ms-auto flex items-center gap-1.5 text-xs cursor-pointer shrink-0">
                                    <span className="text-muted-foreground">Again?</span>
                                    <ToggleSwitch id={`vf-${item.key}`} checked={model.included.has(item.key)} onChange={() => model.flip(item.key)} />
                                  </label>
                                </>
                              ) : (
                                <>
                                  <Checkbox id={`vf-${item.key}`} checked={model.included.has(item.key)} onCheckedChange={() => model.flip(item.key)} />
                                  <CheckboxLabel htmlFor={`vf-${item.key}`} className="flex items-center font-normal min-w-0">
                                    <LedgerLine item={item} />
                                  </CheckboxLabel>
                                </>
                              )}
                            </div>
                          ))}
                        </PopoverContent>
                      </Popover>
                    </span>
                  )
                })}
                <span className="flex justify-end"><TemplateSelect model={model} offering={o} /></span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Legend — the grid's vocabulary, said once. */}
      <p className="text-xs text-muted-foreground flex items-center gap-x-4 gap-y-1 flex-wrap">
        <span className="inline-flex items-center gap-1.5"><i className="fa-solid fa-circle-check" style={{ color: 'var(--chip-2)' }} aria-hidden="true" /> will be created</span>
        <span className="inline-flex items-center gap-1.5"><i className="fa-solid fa-circle-info" style={{ color: 'var(--insight-severity-info-fg)' }} aria-hidden="true" /> already exists</span>
        <span className="inline-flex items-center gap-1.5"><i className="fa-solid fa-triangle-exclamation" style={{ color: 'var(--chip-4)' }} aria-hidden="true" /> no one assigned</span>
        <span className="inline-flex items-center gap-1.5">— not in this course&apos;s template</span>
      </p>
    </div>
  )
}

function VariantF({ model }: { model: PlanModel }) {
  return <CoverageGridSection model={model} />
}

// ═════════════════════════════════════════════════════════════════════════════
// VARIANT G — FOCUS FLOW: one decision at a time; the rest waits its turn.
// ═════════════════════════════════════════════════════════════════════════════

function VariantG({ model }: { model: PlanModel }) {
  const decisions = useMemo(
    () => [
      ...model.instances.filter(i => i.status === 'gap'),
      ...model.instances.filter(i => i.status === 'duplicate'),
    ],
    [model.instances],
  )
  const [cursor, setCursor] = useState(0)
  const done = cursor >= decisions.length
  const current = decisions[cursor]
  const courseOf = (i: SurveyInstance) => model.courses.find(o => o.id === i.offeringId)!

  if (decisions.length === 0 || done) {
    return (
      <div className="mx-auto w-full flex flex-col items-center gap-3 py-10 text-center" style={{ maxWidth: 560 }}>
        <span className="size-10 rounded-full flex items-center justify-center" style={{ background: 'var(--group-band-done-bg)' }}>
          <i className="fa-solid fa-check text-sm" style={{ color: 'var(--chip-2)' }} aria-hidden="true" />
        </span>
        <p className="text-base font-semibold">
          {decisions.length === 0 ? 'Nothing needs your attention' : `All ${decisions.length} decisions reviewed`}
        </p>
        <SummaryLine counts={model.counts} />
        {decisions.length > 0 && (
          <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground" onClick={() => setCursor(0)}>
            <i className="fa-light fa-arrow-rotate-left text-xs" aria-hidden="true" />
            Review again
          </Button>
        )}
      </div>
    )
  }

  const { code, name } = splitLabel(courseOf(current))
  const upNext = decisions.slice(cursor + 1, cursor + 3)

  return (
    <div className="mx-auto w-full flex flex-col gap-4 pt-2" style={{ maxWidth: 620 }}>
      <p className="text-xs tabular-nums text-muted-foreground">Decision {cursor + 1} of {decisions.length}</p>

      <Card size="sm" className="py-0 gap-0">
        <CardContent className="flex flex-col gap-4 px-5 py-5">
          <div className="flex items-start gap-3">
            <span className="size-9 rounded-full flex items-center justify-center shrink-0" style={{ background: current.status === 'gap' ? 'var(--group-band-attention-bg)' : 'var(--insight-severity-info-bg)' }}>
              {current.status === 'gap'
                ? <i className="fa-solid fa-triangle-exclamation text-sm" style={{ color: 'var(--chip-4)' }} aria-hidden="true" />
                : <i className="fa-solid fa-circle-info text-sm" style={{ color: 'var(--insight-severity-info-fg)' }} aria-hidden="true" />}
            </span>
            <div className="flex flex-col gap-1 min-w-0">
              <p className="text-base font-semibold">
                {current.status === 'gap'
                  ? <>No {current.roleLabel} assigned</>
                  : <>{instanceLabel(current)} is already being evaluated</>}
              </p>
              <p className="text-sm text-muted-foreground flex items-center gap-1.5 flex-wrap">
                <span className="font-mono text-xs tabular-nums">{code}</span>
                {name && <span>{name}</span>}
                {current.status === 'duplicate' && <ExistingFacts item={current} />}
              </p>
              <p className="text-xs text-muted-foreground">
                {current.status === 'gap'
                  ? 'This evaluation can’t be created until someone holds the role. Add them in Prism and this plan updates live — or skip and push without it.'
                  : 'Skipping keeps the existing evaluation untouched. Evaluating again creates a second, separate evaluation.'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 ps-12">
            {current.status === 'gap' ? (
              <>
                {current.prismHref && <AddInPrismButton href={current.prismHref} label="Add faculty" roles={[current.roleLabel]} />}
                <Button variant="outline" size="xs" onClick={() => setCursor(c => c + 1)}>
                  Skip for now
                  <i className="fa-light fa-arrow-right text-xs" aria-hidden="true" />
                </Button>
              </>
            ) : (
              <>
                <Button variant="secondary" size="xs" onClick={() => { model.setMany([current.key], false); setCursor(c => c + 1) }}>
                  Keep existing
                </Button>
                <Button variant="outline" size="xs" onClick={() => { model.setMany([current.key], true); setCursor(c => c + 1) }}>
                  Evaluate again
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center gap-2">
        <Button variant="ghost" size="xs" className="text-muted-foreground hover:text-foreground" disabled={cursor === 0} onClick={() => setCursor(c => c - 1)}>
          <i className="fa-light fa-arrow-left text-xs" aria-hidden="true" />
          Previous
        </Button>
        {upNext.length > 0 && (
          <span className="ms-auto text-xs text-muted-foreground truncate">
            Up next: {upNext.map(i => (i.status === 'gap' ? `${splitLabel(courseOf(i)).code} — no ${i.roleLabel}` : `${splitLabel(courseOf(i)).code} — already covered`)).join(' · ')}
          </span>
        )}
      </div>
    </div>
  )
}

// ═════════════════════════════════════════════════════════════════════════════
// VARIANT H — SYNTHESIS (the recommendation): narrative → work → audit.
// E's lead states what will happen; B's queue holds the open decisions with
// their controls inline; F's coverage grid is the always-visible audit of the
// whole plan. One page answers all three questions in reading order:
// "what am I doing?" → "what do I need to decide?" → "is the plan right?"
// ═════════════════════════════════════════════════════════════════════════════

function VariantH({ model }: { model: PlanModel }) {
  const templatesInUse = new Set(model.courses.map(o => model.templateIdFor(o)).filter(Boolean))
  return (
    <div className="flex flex-col gap-6">
      {/* Narrative — what pressing Continue will do. */}
      <div className="flex flex-col gap-1 pt-2">
        <p className="text-2xl leading-snug font-heading">
          You&apos;re setting up <span className="font-semibold tabular-nums">{model.counts.toCreate} evaluations</span> across{' '}
          <span className="font-semibold tabular-nums">{model.courses.length} courses</span> for Fall 2026–2027.
        </p>
        <p className="text-sm text-muted-foreground tabular-nums">
          {templatesInUse.size === 1 ? 'Every course uses the same template' : `${templatesInUse.size} templates in play`}
          {model.counts.reEvals > 0 && <> · {model.counts.reEvals} evaluated again</>}
          {model.counts.skipped > 0 && <> · {model.counts.skipped} already covered stay untouched</>}
        </p>
      </div>

      {/* Work — the open decisions, each with its control. */}
      <DecisionQueueSection model={model} />

      {/* Audit — the whole plan, one glance; click a cell to adjust. */}
      <section aria-label="The plan">
        <div className="flex items-baseline gap-2 pb-2">
          <h3 className="text-base font-semibold font-heading">The plan</h3>
          <span className="text-xs text-muted-foreground">Every course × who gets evaluated — click any cell to adjust.</span>
        </div>
        <CoverageGridSection model={model} />
      </section>
    </div>
  )
}

// ── Page shell ───────────────────────────────────────────────────────────────

const VARIANTS = [
  { id: 'a', name: 'Anchor ledger', hint: 'all cards + jump rail' },
  { id: 'b', name: 'Decision queue', hint: 'exceptions first' },
  { id: 'c', name: 'Worksheet', hint: 'one sheet, sticky bands' },
  { id: 'd', name: 'Split, grown up', hint: 'refined list + detail' },
  { id: 'e', name: 'Briefing', hint: 'the plan in plain language' },
  { id: 'f', name: 'Coverage grid', hint: 'courses × roles matrix' },
  { id: 'g', name: 'Focus flow', hint: 'one decision at a time' },
  { id: 'h', name: 'Synthesis', hint: 'recommended: brief → decide → audit' },
] as const

function CompareInner() {
  const v = (useSearchParams()?.get('v') ?? 'a') as 'a' | 'b' | 'c' | 'd' | 'e' | 'f' | 'g' | 'h'
  const model = usePlanModel()

  return (
    <div className="flex flex-col gap-4 p-6 min-h-svh">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <div>
          <h1 className="text-xl font-semibold font-heading">Survey design — Jul 25 variants</h1>
          <p className="text-sm text-muted-foreground">
            Real pt5 plan (Fall 2026–2027). Compare, then promote one into the wizard.
          </p>
        </div>
        <nav className="ms-auto flex items-center gap-1.5" aria-label="Variants">
          {VARIANTS.map(x => (
            <Button key={x.id} asChild variant={v === x.id ? 'secondary' : 'ghost'} size="sm" aria-current={v === x.id ? 'page' : undefined}>
              <Link href={`/compare/push-survey-design?v=${x.id}`}>
                <span className="font-mono text-xs uppercase">{x.id}</span>
                {x.name}
              </Link>
            </Button>
          ))}
        </nav>
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <SummaryLine counts={model.counts} />
        <span className="ms-auto text-xs text-muted-foreground">{VARIANTS.find(x => x.id === v)?.hint}</span>
      </div>

      {/* Heading rhythm: h1 (page) → h2 (variant) → h3 (card titles). */}
      <h2 className="sr-only">{VARIANTS.find(x => x.id === v)?.name}</h2>

      {v === 'a' && <VariantA model={model} />}
      {v === 'b' && <VariantB model={model} />}
      {v === 'c' && <VariantC model={model} />}
      {v === 'd' && <VariantD model={model} />}
      {v === 'e' && <VariantE model={model} />}
      {v === 'f' && <VariantF model={model} />}
      {v === 'g' && <VariantG model={model} />}
      {v === 'h' && <VariantH model={model} />}

      <StepFooter model={model} />
    </div>
  )
}

export default function PushSurveyDesignComparePage() {
  return (
    <Suspense>
      <CompareInner />
    </Suspense>
  )
}
