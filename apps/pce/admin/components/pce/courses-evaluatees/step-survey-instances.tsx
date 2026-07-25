'use client'

// Wizard step shell — hand-roll justified (no DS step-frame organism), see
// docs/governance/ds-adoption.md §PCE. Composes DS Collapsible/ToggleSwitch/
// Checkbox+CheckboxLabel/Select/Button/LocalBanner + SurveyStatusBadgeOS.
//
// Step 2 of the push wizard — "Survey design", the promoted Variant E
// ("Stacked question", Romit Jul 24 — /compare/push-instances?v=e):
// instances sharing a status STACK into one line per course, with a fixed
// control lane on the right. Three line kinds per course:
//   · "N new evaluations" — quiet green line; the whole row is a disclosure
//     trigger revealing per-evaluatee checkboxes (exclusion is the edge case)
//   · "Evaluation already exists" — info line (NOT a warning: the system did
//     its job) asking the one question — "Evaluate again?" with a yes/no
//     toggle (UC4 soft warning). Yes reveals the people, each with their own
//     checkbox; unchecking the last one flips the course back to No.
//   · "No <Role> assigned" — amber (missing data) + the Prism fix action.
//
// The toggle is DERIVED state: a course says Yes when any of its duplicates
// is included. Duplicate rules (offering+role+person vs open flows) live in
// lib/pce-push-validation.ts; this step only renders the plan and reports the
// included keys up — the page pushes exactly that set.

import { useMemo, useEffect, useRef, useState, type ReactNode } from 'react'
import {
  Select, SelectTrigger, SelectContent, SelectItem, SelectValue,
  Button, Checkbox, CheckboxLabel, LocalBanner, ToggleSwitch,
  Card, CardHeader, CardTitle, CardContent,
  Collapsible, CollapsibleTrigger, CollapsibleContent,
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
   *  new instances default checked, duplicates default unchecked (UC4). */
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

  // ── Inclusion (UC4): news default in, duplicates default out ───────────────
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

  // New-stack disclosure (per offering).
  const [openStacks, setOpenStacks] = useState<Record<string, boolean>>({})
  // Card filter — scan only the courses that need work.
  const [cardFilter, setCardFilter] = useState<'all' | 'needs' | 'ready'>('all')
  // Master list selection — the detail panel shows ONE course at a time.
  const [selectedId, setSelectedId] = useState<string | null>(null)

  // ── Derived counts (the footer/summary speak for the full plan) ────────────
  const toCreate = useMemo(
    () => instances.filter(i => i.status !== 'gap' && included.has(i.key)).length,
    [instances, included],
  )
  const reEvals = useMemo(
    () => instances.filter(i => i.status === 'duplicate' && included.has(i.key)).length,
    [instances, included],
  )
  const dupTotal = useMemo(() => instances.filter(i => i.status === 'duplicate').length, [instances])
  const gapTotal = useMemo(() => instances.filter(i => i.status === 'gap').length, [instances])
  const skipped = dupTotal - reEvals

  // Selected courses with no effective template expand to nothing — the plan
  // silently under-counts, so they gate Continue (same rule as before).
  const missingTemplate = useMemo(
    () => selectedOfferings.filter(o => {
      const tid = templateAssignments[o.id] ?? defaultAssignments[o.id] ?? ''
      return !tid || !publishedTemplates.some(t => t.id === tid)
    }).length,
    [selectedOfferings, templateAssignments, defaultAssignments, publishedTemplates],
  )

  const courses = useMemo(
    () =>
      [...selectedOfferings]
        .sort((a, b) => courseLabelOf(a).localeCompare(courseLabelOf(b), undefined, { numeric: true })),
    [selectedOfferings],
  )
  const byOffering = useMemo(() => {
    const m = new Map<string, SurveyInstance[]>()
    for (const i of instances) m.set(i.offeringId, [...(m.get(i.offeringId) ?? []), i])
    return m
  }, [instances])

  // A course "needs setup" when its plan is incomplete: no template yet, or a
  // role the template evaluates is unstaffed. Existing-evaluation questions
  // are decisions, not blockers — they don't flip readiness.
  const needsSetup = (o: CourseOffering) => {
    const tid = templateAssignments[o.id] ?? defaultAssignments[o.id] ?? ''
    const hasTemplate = !!tid && publishedTemplates.some(t => t.id === tid)
    if (!hasTemplate) return true
    return (byOffering.get(o.id) ?? []).some(i => i.status === 'gap')
  }
  const needsCount = courses.filter(needsSetup).length
  const shownCourses = courses.filter(o =>
    cardFilter === 'all' ? true : cardFilter === 'needs' ? needsSetup(o) : !needsSetup(o))
  const detailOffering = shownCourses.find(o => o.id === selectedId) ?? shownCourses[0] ?? null

  // ── Shared line pieces (promoted from /compare/push-instances Variant E) ───

  /** Secondary-line roster: identity travels with the label — face + name pairs. */
  const NamesInline = ({ items }: { items: SurveyInstance[] }) => (
    <span className="flex items-center gap-x-2.5 gap-y-0.5 flex-wrap min-w-0">
      {items.map(i => (
        <span key={i.key} className="inline-flex items-center gap-1 min-w-0">
          {i.scope === 'course'
            ? (
              <span className="size-4 rounded-full flex items-center justify-center shrink-0 border border-border bg-background">
                <i className="fa-light fa-book-open text-[8px] text-muted-foreground" aria-hidden="true" />
              </span>
            )
            : <PersonAvatar name={i.personName!} className="size-4" />}
          <span className="truncate">{instanceLabel(i)}</span>
        </span>
      ))}
    </span>
  )

  /** Ledger line — settled flow-ledger anatomy: 20px disc/avatar · name · role. */
  const LedgerLine = ({ item }: { item: SurveyInstance }) => (
    <span className="flex items-center gap-1.5 min-w-0">
      {item.scope === 'course'
        ? (
          <span className="size-5 rounded-full flex items-center justify-center shrink-0 border border-border bg-background">
            <i className="fa-light fa-book-open text-[9px] text-muted-foreground" aria-hidden="true" />
          </span>
        )
        : <PersonAvatar name={item.personName!} className="size-5" />}
      <span className="text-sm truncate">
        {instanceLabel(item)}
        {item.scope !== 'course' && item.roleLabel && (
          <span className="text-xs text-muted-foreground"> · {item.roleLabel}</span>
        )}
      </span>
    </span>
  )

  /** Every line shares ONE two-zone grid: content (primary + secondary) left,
   *  a single fixed control lane right — actions never sit in the content flow. */
  const Line = ({ icon, primary, secondary, control, indent = false }: {
    icon: ReactNode
    primary: ReactNode
    secondary?: ReactNode
    control?: ReactNode
    indent?: boolean
  }) => (
    <div
      className={`grid items-center gap-3 pe-3 py-2 ${indent ? 'ps-8' : 'ps-3'}`}
      style={{ gridTemplateColumns: 'minmax(0,1fr) 230px', minHeight: 44 }}
    >
      <div className="flex items-start gap-2.5 min-w-0">
        <span className="shrink-0 flex items-center justify-center" style={{ width: 16, marginTop: 3 }}>{icon}</span>
        <div className="flex flex-col gap-0.5 min-w-0">
          <span className="text-sm font-medium">{primary}</span>
          {secondary && <span className="text-xs text-muted-foreground truncate">{secondary}</span>}
        </div>
      </div>
      <div className="flex items-center justify-end gap-2">{control}</div>
    </div>
  )

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
    <div className="flex flex-col gap-4 flex-1">
      {/* ── Plan summary + template actions ───────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <p className="text-sm tabular-nums">
          <span className="font-semibold">{toCreate} evaluation{toCreate !== 1 ? 's' : ''}</span> will be set up
          {reEvals > 0 && (
            <span style={{ color: 'var(--insight-severity-info-fg)' }}> · {reEvals} evaluated again</span>
          )}
          {skipped > 0 && <span className="text-muted-foreground"> · {skipped} already covered</span>}
          {gapTotal > 0 && (
            <span style={{ color: 'var(--chip-4)' }}> · {gapTotal} role{gapTotal !== 1 ? 's' : ''} unassigned</span>
          )}
        </p>
        <div className="ms-auto flex items-center gap-2">
          <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground" onClick={onResetDefaults}>
            <i className="fa-light fa-arrow-rotate-left text-xs" aria-hidden="true" />
            Reset to defaults
          </Button>
          <Button variant="outline" size="sm" onClick={() => { setNotice(null); setSubView('create') }}>
            <i className="fa-light fa-plus" aria-hidden="true" />
            New template
          </Button>
        </div>
      </div>

      {/* Card filter — one selected at a time; counts answer "which ones". */}
      <div className="flex items-center gap-1.5" role="group" aria-label="Filter courses by readiness">
        {([['all', `All courses (${courses.length})`], ['needs', `Needs setup (${needsCount})`], ['ready', `Ready (${courses.length - needsCount})`]] as const).map(([key, label]) => (
          <Button
            key={key}
            variant={cardFilter === key ? 'secondary' : 'ghost'}
            size="sm"
            aria-pressed={cardFilter === key}
            onClick={() => setCardFilter(key)}
          >
            {key === 'needs' && needsCount > 0 && (
              <i className="fa-solid fa-triangle-exclamation text-xs" style={{ color: 'var(--chip-4)' }} aria-hidden="true" />
            )}
            {label}
          </Button>
        ))}
      </div>

      {notice && (
        <LocalBanner
          variant={notice.kind === 'published' ? 'success' : 'info'}
          dismissible
          onDismiss={() => setNotice(null)}
        >
          {notice.kind === 'published'
            ? <>&ldquo;{notice.name}&rdquo; published — assign it in a course band below.</>
            : <>&ldquo;{notice.name}&rdquo; saved as a draft — publish it to make it assignable. It&apos;s in Settings &rsaquo; Templates.</>}
        </LocalBanner>
      )}

      {/* ── Courses — one card per course, whitespace between (figure/ground);
             exceptions are inset callouts, not full-width washes ───────────── */}
      {courses.length === 0 ? (
        <EmptyHint heading="No courses selected" sub="Go back and select at least one course." />
      ) : (
        <div className="flex gap-4 items-start">
          {/* ── Master list: the scannable index — checkbox · course · chip.
                 Answers "which ones are ready" with zero scroll. ─────────── */}
          <div className="rounded-lg border border-border overflow-hidden shrink-0" style={{ width: 400 }}>
            {shownCourses.map(o => {
              const oLabel = courseLabelOf(o)
              const [oCode] = oLabel.split(' – ')
              const oAll = byOffering.get(o.id) ?? []
              const oKeys = (oAll.some(i => i.status === 'new')
                ? oAll.filter(i => i.status === 'new')
                : oAll.filter(i => i.status === 'duplicate')).map(i => i.key)
              const oIncluded = oKeys.filter(k => included.has(k)).length
              const oNeeds = needsSetup(o)
              const oHasQuestion = oAll.some(i => i.status === 'duplicate')
              const isActive = detailOffering?.id === o.id
              return (
                <div
                  key={o.id}
                  className={`flex items-center gap-2.5 ps-3 pe-2.5 border-b border-border last:border-b-0 ${isActive ? 'bg-secondary' : ''}`}
                  style={{ minHeight: 46 }}
                >
                  <Checkbox
                    checked={oKeys.length === 0 ? false : oIncluded === oKeys.length ? true : oIncluded > 0 ? 'indeterminate' : false}
                    onCheckedChange={(v) => {
                      if (v) setMany(oKeys, true)
                      else setMany(oAll.filter(i => i.status !== 'gap').map(i => i.key), false)
                    }}
                    aria-label={`Include ${oCode} in this push`}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`flex-1 h-auto min-w-0 justify-start gap-2 px-1.5 py-1.5 font-normal ${isActive ? 'font-medium' : ''}`}
                    aria-current={isActive ? 'true' : undefined}
                    onClick={() => setSelectedId(o.id)}
                  >
                    <span className="font-mono text-xs tabular-nums text-muted-foreground shrink-0">{oCode}</span>
                    <span className="truncate text-sm">{oLabel.includes(' – ') ? oLabel.split(' – ').slice(1).join(' – ') : ''}</span>
                    <span className="ms-auto inline-flex items-center gap-1.5 shrink-0">
                      {oHasQuestion && (
                        <i
                          className="fa-solid fa-circle-info text-xs"
                          style={{ color: 'var(--insight-severity-info-fg)' }}
                          aria-hidden="true"
                          title="An evaluation already exists — decision inside"
                        />
                      )}
                      {oIncluded === 0 && oKeys.length > 0 ? (
                        <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap bg-muted text-muted-foreground">Excluded</span>
                      ) : oNeeds ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap" style={{ background: 'var(--group-band-attention-bg)', color: 'var(--chip-4)' }}>
                          <span aria-hidden="true" className="size-1.5 rounded-full" style={{ background: 'var(--chip-4)' }} />
                          Needs setup
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap" style={{ background: 'var(--group-band-done-bg)', color: 'var(--chip-2)' }}>
                          <span aria-hidden="true" className="size-1.5 rounded-full" style={{ background: 'var(--chip-2)' }} />
                          Ready
                        </span>
                      )}
                    </span>
                  </Button>
                </div>
              )
            })}
            {shownCourses.length === 0 && (
              <p className="px-4 py-6 text-sm text-muted-foreground text-center">No courses match this filter.</p>
            )}
          </div>

          {/* ── Detail panel: ONE course's full story, sticky beside the list. */}
          <div className="flex-1 min-w-0 sticky" style={{ top: 16 }}>
          {(detailOffering ? [detailOffering] : []).map(offering => {
            const courseLabel = courseLabelOf(offering)
            const [code] = courseLabel.split(' – ')
            const rawId = templateAssignments[offering.id] ?? defaultAssignments[offering.id] ?? ''
            const templateId = publishedTemplates.some(t => t.id === rawId) ? rawId : ''
            const edited = !!templateId && templateId !== defaultAssignments[offering.id]
            const all = byOffering.get(offering.id) ?? []
            const fresh = all.filter(i => i.status === 'new')
            const dups = all.filter(i => i.status === 'duplicate')
            const gaps = all.filter(i => i.status === 'gap')
            const freshIn = fresh.filter(i => included.has(i.key)).length
            const stackOpen = openStacks[offering.id] ?? false
            // DERIVED: the course says Yes while any duplicate is included.
            const saidYes = dups.some(d => included.has(d.key))
            // Course checkbox reflects the default plan (its new evaluations;
            // dup-only courses fall back to their duplicates).
            const courseKeys = (fresh.length > 0 ? fresh : dups).map(i => i.key)
            const courseIncluded = courseKeys.filter(k => included.has(k)).length
            const isNeedsSetup = needsSetup(offering)
            const dupStatuses = [...new Set(dups.map(d => d.existing?.status ?? 'scheduled'))]
            const dupOpens = [...new Set(dups.map(d => (d.existing ? openPhrase(d.existing) : null)))]
            const sharedStatus = dupStatuses.length === 1 ? dupStatuses[0] : null
            const sharedOpen = dupOpens.length === 1 ? dupOpens[0] : null

            return (
              <Card key={offering.id} size="sm" className="overflow-hidden py-0 gap-0">
                {/* Header: identity carries the hierarchy — no band tint. */}
                <CardHeader className="flex flex-row items-center gap-2.5 space-y-0 border-b border-border" style={{ padding: '10px 12px 10px 12px' }}>
                  <CardTitle className="text-sm font-semibold flex items-baseline gap-2 min-w-0" title={courseLabel}>
                    <span className="font-mono text-xs tabular-nums text-muted-foreground shrink-0">{code}</span>
                    {courseLabel.includes(' – ') && (
                      <span className="truncate">{courseLabel.split(' – ').slice(1).join(' – ')}</span>
                    )}
                  </CardTitle>
                  {/* Readiness at a glance — settled chip vocabulary.
                      An excluded course says so and visually recedes: the
                      click must be answerable at a glance, not via footer math. */}
                  {courseIncluded === 0 && courseKeys.length > 0 ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap shrink-0 bg-muted text-muted-foreground">
                      Excluded
                    </span>
                  ) : isNeedsSetup ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap shrink-0" style={{ background: 'var(--group-band-attention-bg)', color: 'var(--chip-4)' }}>
                      <span aria-hidden="true" className="size-1.5 rounded-full" style={{ background: 'var(--chip-4)' }} />
                      Needs setup
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap shrink-0" style={{ background: 'var(--group-band-done-bg)', color: 'var(--chip-2)' }}>
                      <span aria-hidden="true" className="size-1.5 rounded-full" style={{ background: 'var(--chip-2)' }} />
                      Ready
                    </span>
                  )}
                  <span className="ms-auto" onClick={e => e.stopPropagation()}>
                    {publishedTemplates.length === 0 ? (
                      <Button
                        variant="outline"
                        size="xs"
                        aria-label={`Create a template — none exist yet to assign to ${code}`}
                        onClick={() => { setNotice(null); setSubView('create') }}
                      >
                        <i className="fa-regular fa-circle-plus text-xs" aria-hidden="true" />
                        Create template
                      </Button>
                    ) : (
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
                    )}
                  </span>
                </CardHeader>

                <CardContent className={`p-0 ${courseIncluded === 0 && courseKeys.length > 0 ? 'opacity-50' : ''}`}>
                  {!templateId && publishedTemplates.length > 0 && (
                    <p className="px-4 py-3 text-sm text-muted-foreground">
                      Assign a template to plan this course&apos;s evaluations.
                    </p>
                  )}

                  {/* New evaluations — plain paper row; whole row = disclosure. */}
                  {fresh.length > 0 && (
                    <Collapsible
                      open={stackOpen}
                      onOpenChange={(v) => setOpenStacks(p => ({ ...p, [offering.id]: v }))}
                    >
                      <CollapsibleTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full h-auto p-0 block text-start font-normal rounded-none hover:bg-muted/50"
                          aria-expanded={stackOpen}
                        >
                          <div className="flex items-center gap-3 pe-4 ps-4 py-2.5" style={{ minHeight: 46 }}>
                            <div className="flex flex-col gap-0.5 min-w-0">
                              <span className="text-sm font-medium">{freshIn} new evaluation{freshIn !== 1 ? 's' : ''}</span>
                              <span className="text-xs text-muted-foreground truncate"><NamesInline items={fresh} /></span>
                            </div>
                            <i
                              className={`fa-light fa-chevron-${stackOpen ? 'up' : 'down'} text-xs text-muted-foreground ms-auto`}
                              aria-hidden="true"
                            />
                          </div>
                        </Button>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        {fresh.map(item => (
                          <div key={item.key} className="flex items-center gap-2.5 ps-9 pe-4 border-t border-border" style={{ minHeight: 42 }}>
                            <Checkbox
                              id={`inst-${item.key}`}
                              checked={included.has(item.key)}
                              onCheckedChange={() => flip(item.key)}
                            />
                            <CheckboxLabel htmlFor={`inst-${item.key}`} className="flex items-center font-normal min-w-0">
                              <LedgerLine item={item} />
                            </CheckboxLabel>
                          </div>
                        ))}
                      </CollapsibleContent>
                    </Collapsible>
                  )}

                  {/* Existing evaluations — an inset info CALLOUT: a tinted
                      object holding the question + its toggle, not a stripe. */}
                  {dups.length > 0 && (
                    <Collapsible open={saidYes} className={fresh.length > 0 ? 'border-t border-border' : ''}>
                      <div className="p-2.5">
                        <div
                          className="rounded-lg flex flex-wrap items-center gap-x-3 gap-y-1.5 px-3 py-2.5"
                          style={{ background: 'var(--insight-severity-info-bg)' }}
                        >
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
                          <label htmlFor={`reeval-${offering.id}`} className="ms-auto flex items-center gap-2 text-sm cursor-pointer shrink-0">
                            <span className="font-medium whitespace-nowrap">Evaluate again?</span>
                            <span className="text-muted-foreground">{saidYes ? 'Yes' : 'No'}</span>
                            <ToggleSwitch
                              id={`reeval-${offering.id}`}
                              checked={saidYes}
                              onChange={(v) => setMany(dups.map(d => d.key), v)}
                            />
                            <span className="sr-only">Evaluate the already-covered evaluatees of {code} again</span>
                          </label>
                        </div>
                      </div>
                      <CollapsibleContent>
                        {dups.map(item => (
                          <div key={item.key} className="flex items-center gap-2.5 ps-9 pe-4 border-t border-border" style={{ minHeight: 42 }}>
                            <Checkbox
                              id={`inst-${item.key}`}
                              checked={included.has(item.key)}
                              onCheckedChange={() => flip(item.key)}
                            />
                            <CheckboxLabel htmlFor={`inst-${item.key}`} className="flex items-center font-normal min-w-0">
                              <LedgerLine item={item} />
                            </CheckboxLabel>
                            <span className="ms-auto flex items-center gap-1.5">
                              {item.existing && <SurveyStatusBadgeOS status={item.existing.status} />}
                              {item.existing && openPhrase(item.existing) && (
                                <span className="text-xs tabular-nums text-muted-foreground inline-flex items-center gap-1">
                                  <i className="fa-light fa-clock text-[10px]" aria-hidden="true" />
                                  {openPhrase(item.existing)}
                                </span>
                              )}
                            </span>
                          </div>
                        ))}
                      </CollapsibleContent>
                    </Collapsible>
                  )}

                  {/* Missing roles — an inset amber CALLOUT with the fix beside it. */}
                  {gaps.length > 0 && (
                    <div className={`p-2.5 flex flex-col gap-2 ${fresh.length > 0 || dups.length > 0 ? 'border-t border-border' : ''}`}>
                      {gaps.map(item => (
                        <div
                          key={item.key}
                          className="rounded-lg flex flex-wrap items-center gap-x-3 gap-y-1.5 px-3 py-2"
                          style={{ background: 'var(--group-band-attention-bg)' }}
                        >
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
          })}
          </div>
        </div>
      )}

      {/* ── Footer ────────────────────────────────────────────────────────── */}
      <div className="sticky bottom-0 mt-auto bg-background border-t border-border py-4 flex items-center justify-between gap-4">
        <span className="text-xs tabular-nums text-muted-foreground">
          {toCreate} evaluation{toCreate !== 1 ? 's' : ''} across {courses.length} course{courses.length !== 1 ? 's' : ''}
          {reEvals > 0 && <> · {reEvals} evaluated again</>}
          {skipped > 0 && <> · {skipped} already covered</>}
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
