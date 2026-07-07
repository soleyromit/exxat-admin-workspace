'use client'

import { useMemo, useEffect, useRef, useState } from 'react'
import {
  Select, SelectTrigger, SelectContent, SelectItem, SelectValue,
  Badge, Skeleton, Checkbox, CheckboxLabel, Button,
  KeyMetrics, Avatar, AvatarFallback,
} from '@exxatdesignux/ui'
import {
  type CourseOffering, type TermSeason, type DeliveryMode,
  COURSE_TYPE_FULL_LABEL,
} from '@/lib/pce-mock-data'
import { TERM_SEASONS, academicYearOptions } from '@/lib/pce-course-scope'
import {
  type Criterion, type CellReadiness,
  CRITERION_TOGGLE_LABEL, deriveReadiness,
} from '@/lib/pce-course-readiness'
const CRITERIA_ORDER: Criterion[] = ['students', 'instructor', 'coordinator']

const ROLE_LABEL: Record<Criterion, string> = {
  students: 'Students', instructor: 'Instructor', coordinator: 'Coordinator',
}

interface ReadinessRow {
  id: string
  code: string
  name: string
  courseLabel: string
  deliveryMode: DeliveryMode
  cells: Partial<Record<Criterion, CellReadiness>>
  hasGap: boolean
}

function initials(name: string) {
  return name.replace(/^Dr\.?\s*/i, '').split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase()
}

/** Explicit status chip — DS Badge with a coloured dot + plain-language label. */
function StatusChip({ ready }: { ready: boolean }) {
  return (
    <Badge variant="outline" className="gap-1.5 font-normal whitespace-nowrap shrink-0">
      <span
        aria-hidden="true"
        style={{
          width: 6, height: 6, borderRadius: '50%', flexShrink: 0,
          background: ready ? 'var(--chart-2)' : 'var(--insight-severity-warning-fg)',
        }}
      />
      {ready ? 'Ready' : 'Needs setup'}
    </Badge>
  )
}

/** DS Button rendered as a new-tab Prism link (no hand-rolled amber anchors). */
function AddInPrismButton({ cell }: { cell: CellReadiness }) {
  return (
    <Button asChild variant="outline" size="xs">
      <a
        href={cell.prismHref ?? '#'}
        target="_blank"
        rel="noopener noreferrer"
        title={`Add ${cell.label} in Exxat Prism — opens in a new tab`}
      >
        Add {cell.label}
        <i className="fa-light fa-arrow-up-right-from-square text-xs" aria-hidden="true" />
        <span className="sr-only"> (opens in new tab)</span>
      </a>
    </Button>
  )
}

interface StepCoursesEvaluateesProps {
  season: TermSeason | ''
  academicYear: string
  cohorts: string[]
  criteria: Criterion[]
  cohortOptions: string[]
  scoped: CourseOffering[]
  isLoading?: boolean
  onSeasonChange: (v: TermSeason) => void
  onAcademicYearChange: (v: string) => void
  onToggleCohort: (cohort: string) => void
  onCriteriaChange: (next: Criterion[]) => void
  onSelectionChange: (ids: Set<string>) => void
  onContinue: () => void
}

export function StepCoursesEvaluatees({
  season, academicYear, cohorts, criteria,
  cohortOptions: cohortOpts, scoped, isLoading = false,
  onSeasonChange, onAcademicYearChange, onToggleCohort,
  onCriteriaChange, onSelectionChange, onContinue,
}: StepCoursesEvaluateesProps) {
  const years = academicYearOptions()
  const termChosen = !!season && !!academicYear
  const scopeReady = termChosen && criteria.length > 0

  const readiness = useMemo(() => deriveReadiness(scoped, criteria), [scoped, criteria])
  // Rows ordered by course code.
  const rows = useMemo<ReadinessRow[]>(
    () =>
      readiness
        .map(r => {
          const [code, ...rest] = r.courseLabel.split(' – ')
          return {
            id: r.offering.id, code, name: rest.join(' – '),
            courseLabel: r.courseLabel, deliveryMode: r.deliveryMode,
            cells: r.cells, hasGap: r.hasGap,
          }
        })
        .sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true }) || a.id.localeCompare(b.id)),
    [readiness],
  )
  // One entry per course — offerings of the same code (classroom + lab) merge
  // into a single list row; the detail panel shows each section.
  const courses = useMemo(() => {
    const map = new Map<string, { code: string; name: string; offerings: ReadinessRow[]; hasGap: boolean }>()
    for (const r of rows) {
      const g = map.get(r.code)
      if (g) { g.offerings.push(r); g.hasGap = g.hasGap || r.hasGap }
      else map.set(r.code, { code: r.code, name: r.name, offerings: [r], hasGap: r.hasGap })
    }
    return [...map.values()]
  }, [rows])
  const gapCourses = useMemo(() => courses.filter(c => c.hasGap), [courses])
  const readyCourses = useMemo(() => courses.filter(c => !c.hasGap), [courses])

  // Focused course — drives the detail panel. Defaults to the first gap.
  const [focusCode, setFocusCode] = useState<string | null>(null)
  useEffect(() => {
    if (courses.length === 0) { setFocusCode(null); return }
    if (!focusCode || !courses.some(c => c.code === focusCode)) {
      setFocusCode((courses.find(c => c.hasGap) ?? courses[0]).code)
    }
  }, [courses, focusCode])
  const focus = courses.find(c => c.code === focusCode)

  // Selection — default all; every course (ready or not) can be unchecked.
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const rowSig = rows.map(r => r.id).join('\0')
  const lastRowSig = useRef<string>('')
  useEffect(() => {
    if (lastRowSig.current === rowSig) return
    lastRowSig.current = rowSig
    setSelected(new Set(rows.map(r => r.id)))
  }, [rowSig, rows])

  // Report selection up (de-duped)
  const selSig = [...selected].sort().join('\0')
  const lastReported = useRef('')
  useEffect(() => {
    if (lastReported.current === selSig) return
    lastReported.current = selSig
    onSelectionChange(new Set(selected))
  }, [selSig, selected, onSelectionChange])

  const toggle = (id: string) =>
    setSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })
  /** Course-level toggle: all offerings on/off together. */
  const toggleCourse = (offerings: ReadinessRow[]) =>
    setSelected(prev => {
      const n = new Set(prev)
      const allOn = offerings.every(o => n.has(o.id))
      offerings.forEach(o => (allOn ? n.delete(o.id) : n.add(o.id)))
      return n
    })

  const selectedStudents = useMemo(() => {
    let n = 0
    for (const r of readiness) if (selected.has(r.offering.id)) n += r.offering.enrolledCount
    return n
  }, [readiness, selected])

  return (
    <div className="flex flex-col gap-5" style={{ maxWidth: 1080 }}>
      {/* ── Scope band ────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-start gap-x-8 gap-y-4">
          <div className="flex flex-col gap-1.5" style={{ width: 190 }}>
            <label className="text-sm font-semibold">
              Term <span style={{ color: 'var(--destructive)' }}>*</span>
            </label>
            <Select value={season} onValueChange={v => onSeasonChange(v as TermSeason)}>
              <SelectTrigger className="w-full" aria-label="Term" aria-required="true">
                <SelectValue placeholder="Select term" />
              </SelectTrigger>
              <SelectContent>
                {TERM_SEASONS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5" style={{ width: 190 }}>
            <label className="text-sm font-semibold">
              Academic Year <span style={{ color: 'var(--destructive)' }}>*</span>
            </label>
            <Select value={academicYear} onValueChange={onAcademicYearChange}>
              <SelectTrigger className="w-full" aria-label="Academic year" aria-required="true">
                <SelectValue placeholder="Select academic year" />
              </SelectTrigger>
              <SelectContent>
                {years.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {termChosen && cohortOpts.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <span className="text-sm font-semibold">
                Cohort <span className="font-normal" style={{ color: 'var(--muted-foreground)' }}>(optional)</span>
              </span>
              <div
                className="flex flex-wrap items-center gap-x-5 gap-y-2"
                style={{ minHeight: 'var(--control-height, 36px)' }}
                role="group"
                aria-label="Filter by cohort"
              >
                {cohortOpts.map(c => (
                  <div key={c} className="flex items-center gap-2">
                    <Checkbox id={`cohort-${c}`} checked={cohorts.includes(c)} onCheckedChange={() => onToggleCohort(c)} />
                    <CheckboxLabel htmlFor={`cohort-${c}`} className="text-sm font-normal cursor-pointer">{c}</CheckboxLabel>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {termChosen && (
          <div className="flex flex-col gap-2 border-t border-border pt-4">
            <div className="flex items-baseline gap-2">
              <span className="text-sm font-semibold">
                What to evaluate <span style={{ color: 'var(--destructive)' }}>*</span>
              </span>
              <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                Readiness updates as you select
              </span>
            </div>
            <div
              className="flex flex-wrap items-center gap-x-5 gap-y-2"
              role="group"
              aria-label="Choose what to evaluate"
            >
              {CRITERIA_ORDER.map(c => {
                const checked = criteria.includes(c)
                return (
                  <div key={c} className="flex items-center gap-2">
                    <Checkbox
                      id={`criterion-${c}`}
                      checked={checked}
                      onCheckedChange={() => {
                        const next = checked ? criteria.filter(x => x !== c) : [...criteria, c]
                        if (next.length > 0) onCriteriaChange(next)
                      }}
                    />
                    <CheckboxLabel htmlFor={`criterion-${c}`} className="text-sm font-normal cursor-pointer">
                      {CRITERION_TOGGLE_LABEL[c]}
                    </CheckboxLabel>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* ── Courses ───────────────────────────────────────────────────────── */}
      {!scopeReady ? (
        <EmptyHint
          heading={!termChosen ? 'Choose a term to load courses' : 'Select what to evaluate'}
          sub={!termChosen
            ? 'Pick a term and academic year above.'
            : 'Choose Course, Instructor, or Coordinator to see the courses and their readiness.'}
        />
      ) : isLoading ? (
        <div className="flex flex-col gap-2" aria-busy="true" aria-label="Loading courses">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-11 w-full rounded-md" />)}
        </div>
      ) : rows.length === 0 ? (
        <EmptyHint heading="No courses for this scope" sub="Adjust the term or cohort filter." />
      ) : (
        <div className="flex flex-col gap-4">
          {/* KPI band — the scope's shape at a glance */}
          <KeyMetrics
            variant="compact"
            metricsSingleRow
            metrics={[
              { id: 'courses', label: 'Courses', value: courses.length, delta: '', trend: 'neutral', description: `${courses.filter(c => c.offerings.some(o => selected.has(o.id))).length} selected` },
              { id: 'students', label: 'Students', value: selectedStudents, delta: '', trend: 'neutral', description: 'across selected courses' },
              { id: 'ready', label: 'Ready to send', value: readyCourses.length, delta: '', trend: 'neutral', description: 'all evaluatees assigned' },
              { id: 'gaps', label: 'Needs setup', value: gapCourses.length, delta: '', trend: 'neutral', description: gapCourses.length > 0 ? 'add missing data in Prism' : 'nothing to fix' },
            ]}
          />

          {/* Split view: status-sectioned course list + detail panel */}
          <div className="flex gap-6 items-start">
            <div className="flex-1 min-w-0 flex flex-col gap-4">
              {([
                { label: 'Needs setup', icon: 'fa-triangle-exclamation', color: 'var(--insight-severity-warning-fg)', items: gapCourses },
                { label: 'Ready to send', icon: 'fa-circle-check', color: 'var(--chart-2)', items: readyCourses },
              ] as const).filter(s => s.items.length > 0).map(section => (
                <div key={section.label} className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <i className={`fa-solid ${section.icon} text-xs`} aria-hidden="true" style={{ color: section.color }} />
                    <span className="text-sm font-semibold">{section.label}</span>
                    <span className="text-sm" style={{ color: 'var(--muted-foreground)' }}>· {section.items.length}</span>
                  </div>
                  <div className="rounded-md border border-border overflow-hidden" role="list" aria-label={`${section.label} courses`}>
                    {section.items.map((c, i) => {
                      const allSel = c.offerings.every(o => selected.has(o.id))
                      const someSel = c.offerings.some(o => selected.has(o.id))
                      return (
                        <div
                          key={c.code}
                          role="listitem"
                          onClick={() => setFocusCode(c.code)}
                          className={`flex items-center gap-3 px-3 cursor-pointer${i > 0 ? ' border-t border-border' : ''}`}
                          style={{ height: 44, background: c.code === focusCode ? 'var(--muted)' : undefined }}
                        >
                          <span onClick={e => e.stopPropagation()} className="flex">
                            <Checkbox
                              checked={allSel ? true : someSel ? 'indeterminate' : false}
                              onCheckedChange={() => toggleCourse(c.offerings)}
                              aria-label={`${c.code} – ${c.name}`}
                            />
                          </span>
                          <span className="text-sm font-medium shrink-0" style={{ width: 72 }}>{c.code}</span>
                          <span className="text-sm truncate flex-1" style={{ color: 'var(--muted-foreground)' }}>{c.name}</span>
                          {c.offerings.length > 1 && (
                            <span className="text-xs shrink-0" style={{ color: 'var(--muted-foreground)' }}>
                              {c.offerings.length} sections
                            </span>
                          )}
                          <i className="fa-light fa-chevron-right text-xs" aria-hidden="true" style={{ color: 'var(--muted-foreground)' }} />
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>

            {focus && (
              <aside
                className="shrink-0 rounded-lg border border-border p-4 flex flex-col gap-4"
                style={{ width: 320, position: 'sticky', top: 8 }}
                aria-label={`Details for ${focus.code} – ${focus.name}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold">{focus.code}</p>
                    <p className="text-sm truncate" style={{ color: 'var(--muted-foreground)' }}>{focus.name}</p>
                  </div>
                  <StatusChip ready={!focus.hasGap} />
                </div>
                {focus.offerings.map((o, oi) => (
                  <div key={o.id} className={`flex flex-col gap-3${oi > 0 ? ' border-t border-border pt-4' : ''}`}>
                    <div className="flex items-center justify-between gap-2">
                      <Badge variant="outline" className="font-normal">{COURSE_TYPE_FULL_LABEL[o.deliveryMode]}</Badge>
                      {focus.offerings.length > 1 && (
                        <div className="flex items-center gap-2">
                          <Checkbox
                            id={`include-${o.id}`}
                            checked={selected.has(o.id)}
                            onCheckedChange={() => toggle(o.id)}
                          />
                          <CheckboxLabel htmlFor={`include-${o.id}`} className="text-xs font-normal cursor-pointer">
                            Include
                          </CheckboxLabel>
                        </div>
                      )}
                    </div>
                    {CRITERIA_ORDER.filter(c => criteria.includes(c)).map(c => {
                      const cell = o.cells[c]
                      if (!cell) return null
                      return (
                        <div key={c} className="flex items-center justify-between gap-3">
                          <span className="text-xs shrink-0" style={{ color: 'var(--muted-foreground)', width: 84 }}>{ROLE_LABEL[c]}</span>
                          {cell.ok ? (
                            <span className="inline-flex items-center gap-2 text-sm min-w-0">
                              {/students?$/.test(cell.value ?? '') ? (
                                <i className="fa-light fa-users text-xs" aria-hidden="true" style={{ color: 'var(--muted-foreground)' }} />
                              ) : (
                                <Avatar style={{ width: 22, height: 22 }}>
                                  <AvatarFallback>{initials(cell.value ?? '')}</AvatarFallback>
                                </Avatar>
                              )}
                              <span className="truncate">{cell.value}</span>
                            </span>
                          ) : (
                            <AddInPrismButton cell={cell} />
                          )}
                        </div>
                      )
                    })}
                  </div>
                ))}
              </aside>
            )}
          </div>
        </div>
      )}

      {/* ── Footer ────────────────────────────────────────────────────────── */}
      <div className="border-t border-border pt-4 flex items-center justify-between gap-4">
        <span className="text-xs tabular-nums" style={{ color: 'var(--muted-foreground)' }}>
          {scopeReady && courses.length > 0
            ? <>{courses.filter(c => c.offerings.some(o => selected.has(o.id))).length} of {courses.length} course{courses.length !== 1 ? 's' : ''} selected · {selectedStudents} students</>
            : null}
        </span>
        <Button
          variant="default"
          size="sm"
          disabled={!scopeReady || selected.size === 0}
          onClick={onContinue}
        >
          Continue
          <i className="fa-light fa-arrow-right text-xs" aria-hidden="true" />
        </Button>
      </div>
    </div>
  )
}

function EmptyHint({ heading, sub }: { heading: string; sub: string }) {
  return (
    <div
      className="flex flex-col items-center justify-center gap-4 text-center rounded-lg border border-dashed border-border"
      style={{ minHeight: 300, padding: 40 }}
    >
      <CourseTablePlaceholder />
      <div className="flex flex-col gap-1" style={{ maxWidth: 340 }}>
        <p className="text-sm font-medium">{heading}</p>
        <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>{sub}</p>
      </div>
    </div>
  )
}

/** Tokenised mini course-table mockup — gives the empty course area a visual identity. */
function CourseTablePlaceholder() {
  const line = (w: string, muted = false) => (
    <div style={{ height: 6, width: w, borderRadius: 2, background: muted ? 'var(--border)' : 'var(--border-control-35)' }} />
  )
  return (
    <div
      aria-hidden="true"
      className="rounded-md border border-border overflow-hidden"
      style={{ width: 220, background: 'var(--card)' }}
    >
      <div className="flex items-center gap-3" style={{ height: 26, padding: '0 12px', background: 'var(--muted)', borderBottom: '1px solid var(--border)' }}>
        {line('34%')}{line('22%')}{line('22%')}
      </div>
      {[0, 1, 2].map(i => (
        <div key={i} className="flex items-center gap-3" style={{ padding: '11px 12px', borderBottom: i < 2 ? '1px solid var(--border)' : undefined }}>
          {line('40%', true)}{line('26%', true)}
          <span style={{ marginLeft: 'auto', width: 8, height: 8, borderRadius: '50%', background: i === 2 ? 'var(--border)' : 'var(--chart-2)', opacity: i === 2 ? 1 : 0.7 }} />
        </div>
      ))}
    </div>
  )
}
