'use client'

import { useMemo, useEffect, useRef, useState } from 'react'
import {
  Select, SelectTrigger, SelectContent, SelectItem, SelectValue,
  Badge, Skeleton, Checkbox, CheckboxLabel, Button,
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
  CRITERION_TOGGLE_LABEL, deriveReadiness,
} from '@/lib/pce-course-readiness'
import { courseDates } from '@/lib/pce-push-validation'

const CRITERIA_ORDER: Criterion[] = ['students', 'instructor', 'coordinator']

const fmtD = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

const ROLE_LABEL: Record<Criterion, string> = {
  students: 'Students', instructor: 'Instructor', coordinator: 'Coordinator',
}

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
  /** Group key: gaps first, then ready. */
  readiness: 'gap' | 'ready'
}

/** Fix action for the Actions column — names the role it adds, opens Prism. */
function AddInPrismButton({ cell }: { cell: CellReadiness }) {
  return (
    <Button asChild variant="outline" size="xs" className="justify-start">
      <a
        href={cell.prismHref ?? '#'}
        target="_blank"
        rel="noopener noreferrer"
        title={`Add ${cell.label} in Exxat Prism — opens in a new tab`}
      >
        <i className="fa-regular fa-circle-plus text-xs" aria-hidden="true" />
        Add {cell.label}
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
            readiness: (r.hasGap ? 'gap' : 'ready') as 'gap' | 'ready',
          }
        })
        .sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true })),
    [readiness],
  )

  const columns = useMemo<ColumnDef<ReadinessRow>[]>(() => {
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
    // Evaluatee columns appear per selection — each cell is the value or the fix action.
    for (const c of (['instructor', 'coordinator'] as Criterion[])) {
      if (!criteria.includes(c)) continue
      cols.push({
        key: c, label: ROLE_LABEL[c], width: 132,
        cell: r => {
          const cell = r.cells[c]
          if (!cell) return null
          if (cell.ok) return <span className="text-sm block truncate" title={cell.value ?? undefined}>{cell.value}</span>
          return <span className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Not assigned</span>
        },
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
          const gaps = CRITERIA_ORDER.filter(c => criteria.includes(c) && r.cells[c] && !r.cells[c]!.ok)
          if (gaps.length === 0) {
            return <span className="text-sm" style={{ color: 'var(--muted-foreground)' }}>—</span>
          }
          return (
            <div className="flex flex-col items-start gap-1 py-0.5">
              {gaps.map(c => <AddInPrismButton key={c} cell={r.cells[c]!} />)}
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
       readiness table spans 100% of the content area (edgeInset=false). */
    <div className="flex flex-col gap-5">
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
        /* Status-grouped DataTable — fix actions live in the cells */
        <div className="flex flex-col gap-0">
        <DataTable<ReadinessRow>
          data={rows}
          columns={columns}
          state={tableState}
          getRowId={r => r.id}
          getRowSelectionLabel={r => r.courseLabel}
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
      <div className="border-t border-border pt-4 flex items-center justify-between gap-4">
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
