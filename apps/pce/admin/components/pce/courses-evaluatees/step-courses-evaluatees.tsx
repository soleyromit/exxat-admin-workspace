'use client'

import { useMemo, useEffect, useRef, useState } from 'react'
import {
  Select, SelectTrigger, SelectContent, SelectItem, SelectValue,
  Badge, Skeleton, Button,
  Popover, PopoverTrigger, PopoverContent,
  Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem, CommandSeparator,
} from '@exxatdesignux/ui'
import { DataTable } from '@/components/data-table'
import { PaginationBar } from '@/components/data-table/pagination'
import { useTableState } from '@/components/data-table/use-table-state'
import type { ColumnDef } from '@/components/data-table/types'
import {
  type CourseOffering, type TermSeason, type DeliveryMode,
  COURSE_TYPE_FULL_LABEL,
} from '@/lib/pce-mock-data'
import { TERM_SEASONS, academicYearOptions } from '@/lib/pce-course-scope'
import {
  type Criterion, type CellReadiness,
  CRITERION_TOGGLE_LABEL, FACULTY_CRITERIA, deriveReadiness, prismAddFacultyHref,
} from '@/lib/pce-course-readiness'
import { courseDates } from '@/lib/pce-push-validation'

const CRITERIA_ORDER: Criterion[] = ['students', 'instructor', 'coordinator']

/** Above this count the cohort picker gains a search field. */
const COHORT_SEARCH_THRESHOLD = 8

/** The three fixed top-level categories a role can sit under (settled: no custom
 *  groups, no free-text roles — roles come from the Prism universe). */
const CRITERION_GROUP_ORDER = ['Course', 'Faculty', 'General'] as const

const CRITERION_GROUP: Record<Criterion, (typeof CRITERION_GROUP_ORDER)[number]> = {
  students: 'Course',
  instructor: 'Faculty',
  coordinator: 'Faculty',
}

const fmtD = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

interface ReadinessRow extends Record<string, unknown> {
  id: string
  code: string
  name: string
  courseLabel: string
  deliveryMode: DeliveryMode
  typeLabel: string
  enrolled: number
  dates: { start: Date; end: Date } | null
  datesLabel: string
  cells: Partial<Record<Criterion, CellReadiness>>
  hasGap: boolean
  /** One Prism link covering every missing faculty role on this offering. */
  facultyHref: string
  /** Group key: gaps first, then ready. */
  readiness: 'gap' | 'ready'
}

/** Fix action for the Actions column — opens Prism in a new tab. */
function AddInPrismButton({ href, label }: { href: string; label: string }) {
  return (
    <Button asChild variant="outline" size="xs" className="justify-start">
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        title={`${label} in Exxat Prism — opens in a new tab`}
      >
        <i className="fa-regular fa-circle-plus text-xs" aria-hidden="true" />
        {label}
        <span className="sr-only"> (opens in new tab)</span>
        <i className="fa-light fa-arrow-up-right-from-square text-xs" aria-hidden="true" />
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
  /** True when a prior step already defined the term (term-setup wizard):
   *  Term + Academic year render as a static line instead of selects. */
  scopeLocked?: boolean
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
  scopeLocked = false,
  onSeasonChange, onAcademicYearChange, onToggleCohort,
  onCriteriaChange, onSelectionChange, onContinue,
}: StepCoursesEvaluateesProps) {
  const years = academicYearOptions()
  const termChosen = !!season && !!academicYear
  const scopeReady = termChosen && criteria.length > 0

  const [cohortOpen, setCohortOpen] = useState(false)
  const [roleOpen, setRoleOpen] = useState(false)
  // Guarded, not disabled: the picker item stays reachable, and the visible line
  // below states why the last one won't come off.
  const toggleCriterion = (c: Criterion) => {
    const next = criteria.includes(c) ? criteria.filter(x => x !== c) : [...criteria, c]
    if (next.length > 0) onCriteriaChange(next)
  }
  // No cohort selected = no filter, so the resting label states the real scope.
  const cohortTriggerLabel = useMemo(() => {
    if (cohorts.length === 0) return 'All cohorts'
    if (cohorts.length === 1) return cohorts[0]
    return `${cohorts[0]} +${cohorts.length - 1}`
  }, [cohorts])
  // Both callers own cohorts via functional setState, so toggling each selected
  // one off is a safe way to clear without widening the prop contract.
  const clearCohorts = () => { for (const c of [...cohorts]) onToggleCohort(c) }

  const readiness = useMemo(() => deriveReadiness(scoped, criteria), [scoped, criteria])
  // One row per course (one type per course), ordered by code.
  const rows = useMemo<ReadinessRow[]>(
    () =>
      readiness
        .map(r => {
          const [code, ...rest] = r.courseLabel.split(' – ')
          const dates = courseDates(r.offering)
          return {
            id: r.offering.id, code, name: rest.join(' – '),
            courseLabel: r.courseLabel,
            deliveryMode: r.deliveryMode,
            typeLabel: COURSE_TYPE_FULL_LABEL[r.deliveryMode],
            enrolled: r.offering.enrolledCount,
            dates,
            datesLabel: dates ? `${fmtD(dates.start)} – ${fmtD(dates.end)}` : '—',
            cells: r.cells, hasGap: r.hasGap,
            facultyHref: prismAddFacultyHref(r.offering),
            readiness: (r.hasGap ? 'gap' : 'ready') as 'gap' | 'ready',
          }
        })
        .sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true })),
    [readiness],
  )

  const columns = useMemo<ColumnDef<ReadinessRow>[]>(() => {
    const facultySelected = FACULTY_CRITERIA.filter(c => criteria.includes(c))
    const cols: ColumnDef<ReadinessRow>[] = [
      { key: 'select', label: '', width: 40, defaultPin: 'left', lockPin: true },
      {
        key: 'code', label: 'Code', sortable: true, width: 80,
        cell: r => <span className="text-sm font-medium">{r.code}</span>,
      },
      {
        key: 'name', label: 'Course', sortable: true, width: 160,
        cell: r => <span className="text-sm block truncate" title={r.name}>{r.name}</span>,
      },
      {
        key: 'enrolled', label: 'Students', sortable: true, width: 84,
        cell: r => {
          const gap = r.cells.students && !r.cells.students.ok
          return (
            <span className="text-sm tabular-nums" style={gap ? { color: 'var(--muted-foreground)' } : undefined}>
              {r.enrolled}
            </span>
          )
        },
      },
    ]
    // One Faculty column for every selected person-role, not a column each: the
    // header stays generic while each line names its own type-aware role
    // ("Lab Instructor"), so the table width is independent of how many roles a
    // program evaluates.
    if (facultySelected.length > 0) {
      cols.push({
        key: 'faculty', label: 'Faculty', width: 200,
        cell: r => (
          <div className="flex flex-col gap-0.5 py-0.5">
            {facultySelected.map(c => {
              const cell = r.cells[c]
              if (!cell) return null
              return (
                <span key={c} className="text-sm flex items-baseline gap-1.5 min-w-0">
                  {cell.ok ? (
                    <>
                      <span className="truncate" title={cell.value ?? undefined}>{cell.value}</span>
                      <span className="text-xs shrink-0" style={{ color: 'var(--muted-foreground)' }}>
                        {cell.label}
                      </span>
                    </>
                  ) : (
                    <span className="truncate" style={{ color: 'var(--muted-foreground)' }}>
                      {cell.label} — not assigned
                    </span>
                  )}
                </span>
              )
            })}
          </div>
        ),
      })
    }
    cols.push(
      {
        key: 'typeLabel', label: 'Type', sortable: true, width: 120,
        filter: {
          type: 'select', icon: 'fa-shapes',
          options: [
            { value: 'Classroom based', label: 'Classroom based' },
            { value: 'Lab based', label: 'Lab based' },
            { value: 'Practice based', label: 'Practice based' },
          ],
        },
        cell: r => <Badge variant="outline" className="font-normal whitespace-nowrap">{r.typeLabel}</Badge>,
      },
      {
        key: 'datesLabel', label: 'Dates', width: 125,
        cell: r => <span className="text-sm tabular-nums whitespace-nowrap" style={{ color: 'var(--muted-foreground)' }}>{r.datesLabel}</span>,
      },
      {
        // What's needed to complete setup — one consolidated column, pinned right.
        key: 'actions', label: 'Action needed', width: 230, defaultPin: 'right', lockPin: true,
        cell: r => {
          const studentCell = criteria.includes('students') ? r.cells.students : undefined
          const studentGap = !!studentCell && !studentCell.ok
          // Every missing person-role collapses into a single trip to Prism.
          const facultyGap = facultySelected.some(c => r.cells[c] && !r.cells[c]!.ok)
          if (!studentGap && !facultyGap) {
            return <span className="text-sm" style={{ color: 'var(--muted-foreground)' }}>—</span>
          }
          return (
            <div className="flex flex-col items-start gap-1 py-0.5">
              {studentGap && (
                <AddInPrismButton href={studentCell!.prismHref ?? '#'} label="Add students" />
              )}
              {facultyGap && <AddInPrismButton href={r.facultyHref} label="Add faculty" />}
            </div>
          )
        },
      },
    )
    return cols
  }, [criteria])

  // Pagination — keeps long course lists (40+) manageable.
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  // Grouped by status — gaps first so action items lead.
  const tableState = useTableState<ReadinessRow>(
    rows, columns, undefined, { page, pageSize },
    'readiness',
    { gap: 'Needs setup', ready: 'Ready to send' },
    ['gap', 'ready'],
  )
  const filteredTotal = tableState.rows.length
  const totalPages = Math.max(1, Math.ceil(filteredTotal / pageSize))
  const safePage = Math.min(page, totalPages)
  // Search/filter changes shrink the set — snap back to page 1.
  const lastTotal = useRef(filteredTotal)
  useEffect(() => {
    if (lastTotal.current !== filteredTotal) { lastTotal.current = filteredTotal; setPage(1) }
  }, [filteredTotal])

  // Selection — default all on scope change; any course can be unchecked.
  const rowSig = rows.map(r => r.id).join('\0')
  const lastRowSig = useRef<string>('')
  useEffect(() => {
    if (lastRowSig.current === rowSig) return
    lastRowSig.current = rowSig
    tableState.setSelected(new Set(rows.map(r => r.id)))
  }, [rowSig, rows, tableState])

  // Report selection up (de-duped)
  const lastReported = useRef('')
  useEffect(() => {
    const sig = [...tableState.selected].map(String).sort().join('\0')
    if (lastReported.current === sig) return
    lastReported.current = sig
    onSelectionChange(new Set([...tableState.selected].map(String)))
  }, [tableState.selected, onSelectionChange])

  const selectedStudents = useMemo(() => {
    let n = 0
    for (const r of rows) if (tableState.selected.has(r.id)) n += r.enrolled
    return n
  }, [rows, tableState.selected])

  return (
    /* Full-bleed step: the wizard shell owns the horizontal padding, so the
       readiness table spans 100% of the content area (edgeInset=false).
       flex-1 + mt-auto footer = footer anchored at a fixed bottom position. */
    <div className="flex flex-col gap-5 flex-1">
      {/* ── Scope band ────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-start gap-x-8 gap-y-4">
          {scopeLocked ? (
            /* The prior step already defined the term — state it, don't re-ask. */
            <div className="flex flex-col gap-1.5">
              <span className="text-sm font-semibold">Term</span>
              <p
                className="flex items-center text-sm text-muted-foreground"
                style={{ minHeight: 'var(--control-height, 36px)' }}
              >
                {/* Spring sits in the AY's second calendar year, Fall/Summer in the first. */}
                {season} {season === 'Spring' ? academicYear.split('–')[1] : academicYear.split('–')[0]} · AY {academicYear}
              </p>
            </div>
          ) : (
            <>
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
            </>
          )}

          {termChosen && cohortOpts.length > 0 && (
            <div className="flex flex-col gap-1.5" style={{ width: 190 }}>
              <span className="text-sm font-semibold" id="cohort-label">
                Cohort <span className="font-normal" style={{ color: 'var(--muted-foreground)' }}>(optional)</span>
              </span>
              {/* A filter, not a scope decision — so it collapses behind a trigger
                  and sits as a peer of the Term / Academic year selects. Empty
                  selection means every cohort, which is what "Clear" restores. */}
              <Popover open={cohortOpen} onOpenChange={setCohortOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    /* haspopup, not role="combobox": ARIA reserves combobox for a
                       text input that owns the popup — on a button it misreports
                       to NVDA/JAWS even though axe stays quiet. */
                    aria-haspopup="listbox"
                    aria-expanded={cohortOpen}
                    aria-labelledby="cohort-label"
                    className="w-full justify-between font-normal"
                  >
                    <span className="truncate">{cohortTriggerLabel}</span>
                    <i className="fa-light fa-chevron-down text-xs shrink-0" aria-hidden="true" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="start" className="p-0" style={{ width: 220 }} aria-label="Cohorts">
                  <Command>
                    {cohortOpts.length > COHORT_SEARCH_THRESHOLD && (
                      <CommandInput placeholder="Search cohorts" />
                    )}
                    <CommandList>
                      <CommandEmpty>No cohorts found.</CommandEmpty>
                      <CommandGroup>
                        {cohortOpts.map(c => {
                          const checked = cohorts.includes(c)
                          return (
                            /* A check glyph rather than the DS Checkbox: Checkbox
                               renders a real button, and nesting it inside
                               role="option" trips axe's nested-interactive. cmdk
                               also owns aria-selected for its own highlight, so
                               checked state rides in the accessible name instead. */
                            <CommandItem key={c} value={c} onSelect={() => onToggleCohort(c)}>
                              <i
                                className={`fa-solid fa-check text-xs ${checked ? '' : 'opacity-0'}`}
                                aria-hidden="true"
                              />
                              <span className="truncate">{c}</span>
                              {checked && <span className="sr-only">, selected</span>}
                            </CommandItem>
                          )
                        })}
                      </CommandGroup>
                    </CommandList>
                    {cohorts.length > 0 && (
                      <>
                        <CommandSeparator />
                        <div className="p-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="w-full justify-start font-normal"
                            onClick={clearCohorts}
                          >
                            Clear
                          </Button>
                        </div>
                      </>
                    )}
                  </Command>
                </PopoverContent>
              </Popover>
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
            {/* Chosen roles stay inline — this is the step's primary decision and
                the readiness table below is live feedback on it, so the selection
                must remain visible (and must not look like the Cohort filter).
                The role universe (~40–50 in Prism, narrowed per program in
                Settings) lives behind "Add role", so the row shows what you PICKED
                and never the whole list. A flat row of every option overflows —
                30 roles measured 3223px in a 1153px container. */}
            <div
              className="flex flex-wrap items-center gap-2"
              role="group"
              aria-label="Chosen evaluatees"
            >
              {CRITERIA_ORDER.filter(c => criteria.includes(c)).map(c => {
                const isLast = criteria.length === 1
                return (
                  <Badge key={c} variant="secondary" className="gap-1 ps-2.5 pe-1 py-1 font-normal">
                    {CRITERION_TOGGLE_LABEL[c]}
                    <Button
                      variant="ghost"
                      size="xs"
                      className="size-4 p-0 hover:bg-transparent"
                      disabled={isLast}
                      aria-label={`Remove ${CRITERION_TOGGLE_LABEL[c]}`}
                      onClick={() => onCriteriaChange(criteria.filter(x => x !== c))}
                    >
                      <i className="fa-light fa-xmark text-xs" aria-hidden="true" />
                    </Button>
                  </Badge>
                )
              })}

              <Popover open={roleOpen} onOpenChange={setRoleOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    aria-haspopup="listbox"
                    aria-expanded={roleOpen}
                  >
                    Add role
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  align="start"
                  className="p-0"
                  style={{ width: 260 }}
                  aria-label="Add evaluatee role"
                >
                  <Command>
                    <CommandInput placeholder="Search roles" />
                    <CommandList>
                      <CommandEmpty>No roles found.</CommandEmpty>
                      {CRITERION_GROUP_ORDER.map(group => {
                        const inGroup = CRITERIA_ORDER.filter(c => CRITERION_GROUP[c] === group)
                        if (inGroup.length === 0) return null
                        return (
                          <CommandGroup key={group} heading={group}>
                            {inGroup.map(c => {
                              const checked = criteria.includes(c)
                              return (
                                <CommandItem
                                  key={c}
                                  value={CRITERION_TOGGLE_LABEL[c]}
                                  onSelect={() => toggleCriterion(c)}
                                >
                                  <i
                                    className={`fa-solid fa-check text-xs ${checked ? '' : 'opacity-0'}`}
                                    aria-hidden="true"
                                  />
                                  <span className="truncate">{CRITERION_TOGGLE_LABEL[c]}</span>
                                  {checked && <span className="sr-only">, selected</span>}
                                </CommandItem>
                              )
                            })}
                          </CommandGroup>
                        )
                      })}
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
            {/* Stated rather than left to a title tooltip: the guard also fires on
                keyboard, where a native title never surfaces. */}
            {criteria.length === 1 && (
              <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                At least one selection is required.
              </p>
            )}
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
        /* Status-grouped DataTable — fix actions live in the cells */
        <div className="flex flex-col gap-0">
        <DataTable<ReadinessRow>
          data={rows}
          columns={columns}
          state={tableState}
          getRowId={r => r.id}
          getRowSelectionLabel={r => r.courseLabel}
          emptyState="No courses match your search or filter. Clear the search or change the type filter."
          selectable
          searchable
          hideBulkActions
          hasFooter
          edgeInset={false}
          stickyHeader={false}
          groupIcons={{
            gap: (
              <i
                className="fa-solid fa-triangle-exclamation text-xs"
                aria-hidden="true"
                style={{ color: 'var(--insight-severity-warning-fg)' }}
              />
            ),
            ready: (
              <i
                className="fa-solid fa-circle-check text-xs"
                aria-hidden="true"
                style={{ color: 'var(--chart-2)' }}
              />
            ),
          }}
        />
        <div className="border-x border-b border-border rounded-b-lg overflow-hidden">
          <PaginationBar
            page={safePage}
            pageSize={pageSize}
            total={filteredTotal}
            pageSizeOptions={[10, 25, 50, 100]}
            onPageChange={setPage}
            onPageSizeChange={n => { setPageSize(n); setPage(1) }}
          />
        </div>
        </div>
      )}

      {/* ── Footer ────────────────────────────────────────────────────────── */}
      <div className="sticky bottom-0 mt-auto bg-background border-t border-border py-4 flex items-center justify-between gap-4">
        <span className="text-xs tabular-nums" style={{ color: 'var(--muted-foreground)' }}>
          {scopeReady && rows.length > 0
            ? <>{tableState.selected.size} of {rows.length} course{rows.length !== 1 ? 's' : ''} selected · {selectedStudents} students</>
            : null}
        </span>
        <Button
          variant="default"
          size="sm"
          disabled={!scopeReady || tableState.selected.size === 0}
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
