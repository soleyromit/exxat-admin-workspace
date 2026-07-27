'use client'

// Wizard step shell — hand-roll justified (no DS step-frame organism), see
// docs/governance/ds-adoption.md §PCE. Composes DS Accordion/ToggleSwitch/
// Checkbox+CheckboxLabel/Select/Button/Card/LocalBanner + SurveyStatusBadgeOS.
//
// Step 2 of the push wizard — "Survey design", the promoted BRIEFING (Romit
// Jul 27 — /compare/push-survey-design?v=e after the A–H rounds): the plan in
// plain language. One serif lead sentence says what Continue will do; three
// DS-Accordion sections carry the rest in reading order:
//   · "N roles have no one assigned" — amber; each row = include-checkbox
//     ("queue until someone is assigned", page filters gaps from the push
//     until backend semantics land) + AddInPrismButton. Opens by default.
//   · "N evaluations already exist" — info; per-row "Evaluate again?"
//     ToggleSwitch (UC4 soft warning: default No). Opens by default.
//   · "N new evaluations are ready" — every course, who's evaluated, and its
//     template select (A2 anatomy). Collapsed; the lead already said the sum.
// Collapsed triggers keep resolution chips (Zillow review model). Sections
// with no items don't render. Settled vocabulary holds: quiet default, amber
// strictly = missing data, duplicates are info, dates carry meaning, one
// control kind per lane.
//
// Duplicate rules (offering+role+person vs open flows) live in
// lib/pce-push-validation.ts; this step renders the plan and reports included
// keys up — the page pushes exactly that set (minus gaps, guarded there).

import { useMemo, useEffect, useRef, useState, type ReactNode } from 'react'
import {
  Select, SelectTrigger, SelectContent, SelectItem, SelectValue,
  Button, Checkbox, LocalBanner, ToggleSwitch,
  Card,
  Accordion, AccordionItem, AccordionTrigger, AccordionContent,
} from '@exxatdesignux/ui'
import { PersonAvatar } from '@/components/pce/person-avatar'
import { SurveyStatusBadgeOS } from '@/components/pce/pce-badges'
import { usePce } from '@/components/pce/pce-state'
import { CreateBlankTemplate } from '@/components/pce/create-blank-template'
import { TemplateEditor } from '@/components/pce/template-editor'
import { type CourseOffering, type PceTemplate, type PceSurvey } from '@/lib/pce-mock-data'
import { courseLabelOf } from '@/lib/pce-course-readiness'
import { type SurveyInstance } from '@/lib/pce-push-validation'
import { AddInPrismButton, EmptyHint } from './scope-controls'

interface StepSurveyInstancesProps {
  /** Step-1 selection, already scoped + student-checked. */
  selectedOfferings: CourseOffering[]
  /** The expanded instance plan (page-owned — the push handler uses the same list). */
  instances: SurveyInstance[]
  publishedTemplates: PceTemplate[]
  templateAssignments: Record<string, string>
  defaultAssignments: Record<string, string>
  onTemplateChange: (offeringId: string, templateId: string) => void
  onResetDefaults: () => void
  /** Instance keys the admin is INCLUDING in the push (reported on change) —
   *  new instances default checked, duplicates AND gaps default unchecked
   *  (gaps = "queue until someone is assigned"; the page filters them from
   *  the actual push until the pending-assignment state exists). */
  onIncludedChange: (keys: Set<string>) => void
  onBack: () => void
  onContinue: () => void
}

/** "YYYY-MM-DD" → "Dec 4" without the UTC-midnight day shift. */
function fmtOpen(iso?: string): string | null {
  if (!iso) return null
  const [y, m, d] = iso.split('-').map(Number)
  if (!y || !m || !d) return null
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

/** The date fact that matters for an existing flow: when it opens (scheduled)
 *  or that it's already reaching students (live states carry no date here). */
function openPhrase(f: PceSurvey): string | null {
  if (f.status === 'scheduled') {
    const d = fmtOpen(f.openDate)
    return d ? `Opens ${d}` : null
  }
  return null
}

const instanceLabel = (i: SurveyInstance) =>
  i.scope === 'course' ? 'Course material' : (i.personName ?? 'No one assigned')

// ── Row/section pieces — MODULE scope on purpose ─────────────────────────────
// Defining these inside the component gives them a fresh identity every
// render: React then unmounts/remounts the whole accordion subtree on each
// click, replaying the open animation from height 0 and yanking the scroll
// ("checkbox clicks scroll the page up", Jul 27). Keep them here.

function EvaluateeDisc({ item, size = 5 }: { item: SurveyInstance; size?: 4 | 5 }) {
  return item.scope === 'course' ? (
    <span className={`size-${size} rounded-full flex items-center justify-center shrink-0 border border-border bg-background`}>
      <i className={`fa-light fa-book-open ${size === 5 ? 'text-[9px]' : 'text-[8px]'} text-muted-foreground`} aria-hidden="true" />
    </span>
  ) : (
    <PersonAvatar name={item.personName!} className={`size-${size}`} />
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

/** DS Accordion carries the trigger color, hover, focus ring, and rotating
 *  chevron (composition mirrors evaluation-card-sheet). Collapsed triggers
 *  keep a resolution chip readable (Zillow review model). */
function Section({ k, icon, title, sub, chip, children }: {
  k: string; icon: ReactNode; title: string; sub: string; chip?: ReactNode; children: ReactNode
}) {
  return (
    <AccordionItem value={k} className="border-b-0">
      <Card size="sm" className="py-0 gap-0 overflow-hidden">
        <AccordionTrigger className="px-4 py-3.5 items-center hover:no-underline">
          <span className="flex items-center gap-3 flex-1 min-w-0 text-start">
            <span className="shrink-0 flex items-center justify-center">{icon}</span>
            <span className="flex flex-col gap-0.5 min-w-0">
              <span className="text-sm font-medium">{title}</span>
              <span className="text-xs text-muted-foreground truncate font-normal">{sub}</span>
            </span>
            {chip && <span className="ms-auto shrink-0">{chip}</span>}
          </span>
        </AccordionTrigger>
        <AccordionContent className="p-0 text-foreground">
          <div className="border-t border-border">{children}</div>
        </AccordionContent>
      </Card>
    </AccordionItem>
  )
}

function TemplateControl({ offering, templateId, edited, publishedTemplates, onTemplateChange, onCreate }: {
  offering: CourseOffering
  templateId: string
  edited: boolean
  publishedTemplates: PceTemplate[]
  onTemplateChange: (offeringId: string, templateId: string) => void
  onCreate: () => void
}) {
  const { code } = splitLabel(offering)
  if (publishedTemplates.length === 0) {
    return (
      <Button
        variant="outline"
        size="xs"
        aria-label={`Create a template — none exist yet to assign to ${code}`}
        onClick={onCreate}
      >
        <i className="fa-regular fa-circle-plus text-xs" aria-hidden="true" />
        Create template
      </Button>
    )
  }
  return (
    <Select value={templateId} onValueChange={v => onTemplateChange(offering.id, v)}>
      <SelectTrigger
        aria-label={`Template for ${code}${!templateId ? ' — required' : ''}${edited ? ' — changed from default' : ''}`}
        className={!templateId
          ? 'w-fit min-w-0 border-0 shadow-none'
          : `min-w-0 [&>span]:truncate [&>span]:min-w-0 ${edited ? 'bg-secondary' : 'bg-background'}`}
        style={{
          height: 28, fontSize: 12,
          ...(templateId ? { width: 180 } : {
            paddingInline: 10,
            background: 'var(--insight-severity-info-bg)',
          }),
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
        {publishedTemplates.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
      </SelectContent>
    </Select>
  )
}

/** code + name split; master courses missing from the catalog fall back to the
 *  raw id — show it as the code so the row never goes blank. */
function splitLabel(o: CourseOffering): { code: string; name: string } {
  const label = courseLabelOf(o)
  if (!label.includes(' – ')) return { code: label, name: '' }
  const [code, ...rest] = label.split(' – ')
  return { code, name: rest.join(' – ') }
}

export function StepSurveyInstances({
  selectedOfferings, instances, publishedTemplates,
  templateAssignments, defaultAssignments, onTemplateChange, onResetDefaults,
  onIncludedChange, onBack, onContinue,
}: StepSurveyInstancesProps) {
  // In-step template creation — the SAME create flow + builder as Settings >
  // Templates (the wizard page never unmounts, so state persists).
  const { templates: allTemplates } = usePce()
  const [subView, setSubView] = useState<'assign' | 'create' | { buildId: string }>('assign')
  const [notice, setNotice] = useState<{ kind: 'published' | 'draft'; name: string } | null>(null)
  const backToAssign = () => {
    if (typeof subView === 'object') {
      const t = allTemplates.find(x => x.id === subView.buildId)
      if (t && t.status !== 'active') setNotice({ kind: 'draft', name: t.name || 'Untitled template' })
    }
    setSubView('assign')
  }

  // ── Inclusion (UC4): news default in, duplicates and gaps default out ──────
  const [included, setIncluded] = useState<Set<string>>(new Set())
  const planSig = instances.map(i => `${i.key}:${i.status}`).join('\0')
  const lastPlanSig = useRef('')
  useEffect(() => {
    if (lastPlanSig.current === planSig) return
    lastPlanSig.current = planSig
    setIncluded(new Set(instances.filter(i => i.status === 'new').map(i => i.key)))
  }, [planSig, instances])

  const lastReported = useRef('')
  useEffect(() => {
    const sig = [...included].sort().join('\0')
    if (lastReported.current === sig) return
    lastReported.current = sig
    onIncludedChange(new Set(included))
  }, [included, onIncludedChange])

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

  // ── Derived (the lead + footer speak for the full plan) ───────────────────
  const courses = useMemo(
    () =>
      [...selectedOfferings]
        .sort((a, b) => courseLabelOf(a).localeCompare(courseLabelOf(b), undefined, { numeric: true })),
    [selectedOfferings],
  )
  const gapItems = useMemo(() => instances.filter(i => i.status === 'gap'), [instances])
  const dupItems = useMemo(() => instances.filter(i => i.status === 'duplicate'), [instances])
  const freshByOffering = useMemo(() => {
    const m = new Map<string, SurveyInstance[]>()
    for (const i of instances) if (i.status === 'new') m.set(i.offeringId, [...(m.get(i.offeringId) ?? []), i])
    return m
  }, [instances])

  const templateIdFor = (o: CourseOffering) => {
    const raw = templateAssignments[o.id] ?? defaultAssignments[o.id] ?? ''
    return publishedTemplates.some(t => t.id === raw) ? raw : ''
  }
  const toCreate = instances.filter(i => i.status !== 'gap' && included.has(i.key)).length
  const freshIn = instances.filter(i => i.status === 'new' && included.has(i.key)).length
  const reEvals = dupItems.filter(i => included.has(i.key)).length
  const skipped = dupItems.length - reEvals
  const pendingGaps = gapItems.filter(i => included.has(i.key)).length
  const missingTemplate = courses.filter(o => !templateIdFor(o)).length
  const templatesInUse = new Set(courses.map(o => templateIdFor(o)).filter(Boolean))
  const courseOf = (i: SurveyInstance) => courses.find(o => o.id === i.offeringId)

  // ── Create sub-view: same chooser + builder as Settings > Templates ────────
  if (subView !== 'assign') {
    return (
      <div className="flex flex-col gap-3">
        <div>
          <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground" onClick={backToAssign}>
            <i className="fa-light fa-arrow-left text-xs" aria-hidden="true" />
            Back to Survey design
          </Button>
        </div>
        {subView === 'create' ? (
          <CreateBlankTemplate onCreated={id => setSubView({ buildId: id })} />
        ) : (
          <TemplateEditor
            templateId={subView.buildId}
            embedded
            onPublished={id => {
              const t = allTemplates.find(x => x.id === id)
              setNotice({ kind: 'published', name: t?.name || 'Template' })
              setSubView('assign')
            }}
          />
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5 flex-1">
      {notice && (
        <LocalBanner
          variant={notice.kind === 'published' ? 'success' : 'info'}
          dismissible
          onDismiss={() => setNotice(null)}
        >
          {notice.kind === 'published'
            ? <>&ldquo;{notice.name}&rdquo; published — assign it in the course list below.</>
            : <>&ldquo;{notice.name}&rdquo; saved as a draft — publish it to make it assignable. It&apos;s in Settings &rsaquo; Templates.</>}
        </LocalBanner>
      )}

      {courses.length === 0 ? (
        <EmptyHint heading="No courses selected" sub="Go back and select at least one course." />
      ) : (
        <div className="flex flex-col gap-5 mx-auto w-full" style={{ maxWidth: 760 }}>
          {/* The lead — what pressing Continue will do, in one sentence. */}
          <div className="flex flex-col gap-1 pt-2">
            <p className="text-2xl leading-snug font-heading">
              You&apos;re setting up <span className="font-semibold tabular-nums">{toCreate} evaluation{toCreate !== 1 ? 's' : ''}</span> across{' '}
              <span className="font-semibold tabular-nums">{courses.length} course{courses.length !== 1 ? 's' : ''}</span>.
            </p>
            <p className="text-sm text-muted-foreground tabular-nums">
              {templatesInUse.size === 1 ? 'Every course uses the same template' : `${templatesInUse.size} templates in play`}
              {reEvals > 0 && <> · {reEvals} evaluated again</>}
              {skipped > 0 && <> · {skipped} already covered stay untouched</>}
              {pendingGaps > 0 && <> · {pendingGaps} queued until faculty is added</>}
            </p>
          </div>

          <div className="flex items-center justify-end gap-2">
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground" onClick={onResetDefaults}>
              <i className="fa-light fa-arrow-rotate-left text-xs" aria-hidden="true" />
              Reset to defaults
            </Button>
            <Button variant="outline" size="sm" onClick={() => { setNotice(null); setSubView('create') }}>
              <i className="fa-light fa-plus" aria-hidden="true" />
              New template
            </Button>
          </div>

          {/* Sections with open decisions start OPEN (Zillow: incomplete
              sections expand by default) — the work is visible sans click. */}
          <Accordion
            type="multiple"
            className="flex flex-col gap-5"
            defaultValue={[...(gapItems.length > 0 ? ['gaps'] : []), ...(dupItems.length > 0 ? ['dups'] : [])]}
          >
            {gapItems.length > 0 && (
              <Section
                k="gaps"
                icon={
                  <span className="size-8 rounded-full flex items-center justify-center" style={{ background: 'var(--icon-disc-chart-4-bg)' }}>
                    <i className="fa-solid fa-user-slash text-xs" style={{ color: 'var(--chip-4)' }} aria-hidden="true" />
                  </span>
                }
                title={`${gapItems.length} role${gapItems.length !== 1 ? 's have' : ' has'} no one assigned`}
                sub="Add faculty in Prism, or include an evaluation now — it queues until someone is assigned."
                chip={pendingGaps > 0 && (
                  <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap" style={{ background: 'var(--icon-disc-chart-4-bg)', color: 'var(--chip-4)' }}>
                    {pendingGaps} queued
                  </span>
                )}
              >
                {gapItems.map(item => {
                  const offering = courseOf(item)
                  const { code, name } = offering ? splitLabel(offering) : { code: item.offeringId, name: '' }
                  return (
                    <div key={item.key} className="flex items-center gap-3 px-4 py-2 border-b border-border/60 last:border-b-0" style={{ minHeight: 48 }}>
                      <Checkbox
                        id={`gap-${item.key}`}
                        checked={included.has(item.key)}
                        onCheckedChange={() => flip(item.key)}
                        aria-label={`Create the ${item.roleLabel} evaluation of ${code} once someone is assigned`}
                      />
                      <div className="flex flex-col gap-0.5 min-w-0">
                        <span className="text-sm font-medium">No {item.roleLabel} assigned</span>
                        <span className="text-xs text-muted-foreground">
                          <span className="font-mono tabular-nums">{code}</span>{name && <> {name}</>}
                          {included.has(item.key) && (
                            <span style={{ color: 'var(--chip-4)' }}> · queued until faculty is added</span>
                          )}
                        </span>
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
                icon={
                  <span className="size-8 rounded-full flex items-center justify-center" style={{ background: 'var(--insight-severity-info-bg)' }}>
                    <i className="fa-solid fa-clock-rotate-left text-xs" style={{ color: 'var(--insight-severity-info-fg)' }} aria-hidden="true" />
                  </span>
                }
                title={`${dupItems.length} evaluation${dupItems.length !== 1 ? 's' : ''} already exist${dupItems.length === 1 ? 's' : ''}`}
                sub="Skipped by default — flip any you want to run again."
                chip={reEvals > 0 && (
                  <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap" style={{ background: 'var(--insight-severity-info-bg)', color: 'var(--insight-severity-info-fg)' }}>
                    {reEvals} run again
                  </span>
                )}
              >
                {dupItems.map(item => {
                  const offering = courseOf(item)
                  const { code, name } = offering ? splitLabel(offering) : { code: item.offeringId, name: '' }
                  const on = included.has(item.key)
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
                      <label htmlFor={`reeval-${item.key}`} className="ms-auto flex items-center gap-2 text-sm cursor-pointer shrink-0">
                        <span className="text-muted-foreground">{on ? 'Yes' : 'No'}</span>
                        <ToggleSwitch id={`reeval-${item.key}`} checked={on} onChange={() => flip(item.key)} />
                        <span className="sr-only">Evaluate {instanceLabel(item)} in {code} again</span>
                      </label>
                    </div>
                  )
                })}
              </Section>
            )}

            <Section
              k="ready"
              icon={
                <span className="size-8 rounded-full flex items-center justify-center" style={{ background: 'var(--icon-disc-chart-2-bg)' }}>
                  <i className="fa-solid fa-paper-plane text-xs" style={{ color: 'var(--chip-2)' }} aria-hidden="true" />
                </span>
              }
              title={`${freshIn} new evaluation${freshIn !== 1 ? 's are' : ' is'} ready`}
              sub="Every course, who's evaluated, and its template."
              chip={missingTemplate > 0 && (
                <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap" style={{ background: 'var(--icon-disc-chart-4-bg)', color: 'var(--chip-4)' }}>
                  {missingTemplate} without a template
                </span>
              )}
            >
              {/* ALL courses — dup-only and template-less courses keep their
                  template select reachable. */}
              {courses.map(o => {
                const { code, name } = splitLabel(o)
                const fresh = freshByOffering.get(o.id) ?? []
                const keys = fresh.map(i => i.key)
                const inCount = keys.filter(k => included.has(k)).length
                const templateId = templateIdFor(o)
                return (
                  <div key={o.id} className="flex items-center gap-2.5 px-4 py-2 border-b border-border/60 last:border-b-0" style={{ minHeight: 52 }}>
                    {fresh.length > 0 ? (
                      <Checkbox
                        checked={inCount === keys.length ? true : inCount > 0 ? 'indeterminate' : false}
                        onCheckedChange={v => setMany(keys, !!v)}
                        aria-label={`Include ${code} in this push`}
                      />
                    ) : (
                      <span aria-hidden="true" style={{ width: 16 }} />
                    )}
                    <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                      <span className="text-sm font-medium flex items-baseline gap-2 min-w-0">
                        <span className="font-mono text-xs tabular-nums text-muted-foreground shrink-0">{code}</span>
                        {name && <span className="truncate">{name}</span>}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {!templateId
                          ? 'Assign a template to plan this course’s evaluations.'
                          : fresh.length > 0
                            ? <NamesInline items={fresh} />
                            : 'All covered — nothing new to create.'}
                      </span>
                    </div>
                    <TemplateControl
                      offering={o}
                      templateId={templateId}
                      edited={!!templateId && templateId !== defaultAssignments[o.id]}
                      publishedTemplates={publishedTemplates}
                      onTemplateChange={onTemplateChange}
                      onCreate={() => { setNotice(null); setSubView('create') }}
                    />
                  </div>
                )
              })}
            </Section>
          </Accordion>
        </div>
      )}

      {/* ── Footer ────────────────────────────────────────────────────────── */}
      <div className="sticky bottom-0 mt-auto bg-background border-t border-border py-4 flex items-center justify-between gap-4">
        <span className="text-xs tabular-nums text-muted-foreground">
          {toCreate} evaluation{toCreate !== 1 ? 's' : ''} across {courses.length} course{courses.length !== 1 ? 's' : ''}
          {reEvals > 0 && <> · {reEvals} evaluated again</>}
          {skipped > 0 && <> · {skipped} already covered</>}
          {pendingGaps > 0 && <> · {pendingGaps} queued until faculty is added</>}
          {missingTemplate > 0 && (
            <>
              {' · '}
              <span className="font-medium" style={{ color: 'var(--insight-severity-info-fg)' }}>
                {missingTemplate} course{missingTemplate !== 1 ? 's' : ''} without a template
              </span>
            </>
          )}
        </span>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onBack}>
            <i className="fa-light fa-arrow-left text-xs" aria-hidden="true" />
            Back
          </Button>
          <Button
            variant="default"
            size="sm"
            disabled={missingTemplate > 0 || toCreate === 0}
            onClick={onContinue}
          >
            Continue
            <i className="fa-light fa-arrow-right text-xs" aria-hidden="true" />
          </Button>
        </div>
      </div>
    </div>
  )
}
