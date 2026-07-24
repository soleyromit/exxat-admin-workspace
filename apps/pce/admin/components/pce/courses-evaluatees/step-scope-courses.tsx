'use client'

// Wizard step shell — hand-roll justified (no DS step-frame organism), see
// docs/governance/ds-adoption.md §PCE. Composes the vendored DataTable + DS
// Select/Button/LocalBanner + the shared TokenSelect composition.
//
// Step 1 of the push wizard — "Courses & students" (Jul 2026 two-step split).
// One job: decide WHICH offerings are in scope, with real students. The unit
// of work is the course offering. Template assignment, faculty coverage and
// duplicate detection live in step 2 (step-survey-instances.tsx), where the
// unit is the survey instance.
//
// The roster gap is THE step-1 fix: a survey pushed to zero recipients is dead
// on arrival, so courses without students group first (amber band) and carry
// an in-app "Add students" sheet (PCE operates independently of Prism —
// Aarti, Jun 13).

import { useMemo, useEffect, useRef, useState } from 'react'
import {
  Select, SelectTrigger, SelectContent, SelectItem, SelectValue,
  Skeleton, Button, Tip, LocalBanner,
} from '@exxatdesignux/ui'
import { NumericCell } from '@/components/data-views/table-cells'
import { TablePropertiesDrawer } from '@/components/table-properties/drawer'
import type { FilterFieldDef } from '@/components/table-properties/types'
import { DataTable } from '@/components/data-table'
import { TruncatedText } from '@/components/truncated-text'
import { PaginationBar } from '@/components/data-table/pagination'
import { useTableState } from '@/components/data-table/use-table-state'
import type { ColumnDef } from '@/components/data-table/types'
import {
  type CourseOffering, type TermSeason, type DeliveryMode,
  COURSE_TYPE_FULL_LABEL,
} from '@/lib/pce-mock-data'
import { TERM_SEASONS, academicYearOptions } from '@/lib/pce-course-scope'
import { deriveReadiness } from '@/lib/pce-course-readiness'
import { courseDates } from '@/lib/pce-push-validation'
import {
  TokenSelect, type TokenOption, TypePill, EmptyHint,
  SCOPE_FIELD_WIDTH, COHORT_SEARCH_THRESHOLD, fmtD,
} from './scope-controls'
import { AddStudentsSheet } from './add-students-sheet'

interface ScopeRow extends Record<string, unknown> {
  id: string
  code: string
  name: string
  courseLabel: string
  deliveryMode: DeliveryMode
  typeLabel: string
  /** Prism roster + students added in this wizard run. */
  enrolled: number
  addedHere: number
  datesLabel: string
  offering: CourseOffering
  /** Group key: roster gaps first, then ready. */
  roster: 'gap' | 'ready'
}

interface StepScopeCoursesProps {
  season: TermSeason | ''
  academicYear: string
  cohorts: string[]
  cohortOptions: string[]
  scoped: CourseOffering[]
  isLoading?: boolean
  error?: string | null
  onRetry?: () => void
  /** Students added per offering in THIS wizard run (id lists) — owned by the
   *  page so step 2 and Review count the same reach. */
  addedStudents: Record<string, string[]>
  onAddStudents: (offeringId: string, studentIds: string[]) => void
  onSeasonChange: (v: TermSeason) => void
  onAcademicYearChange: (v: string) => void
  onToggleCohort: (cohort: string) => void
  onSelectionChange: (ids: Set<string>) => void
  onContinue: () => void
}

export function StepScopeCourses({
  season, academicYear, cohorts,
  cohortOptions: cohortOpts, scoped, isLoading = false, error = null, onRetry,
  addedStudents, onAddStudents,
  onSeasonChange, onAcademicYearChange, onToggleCohort,
  onSelectionChange, onContinue,
}: StepScopeCoursesProps) {
  const years = academicYearOptions()
  const termChosen = !!season && !!academicYear
  const scopeReady = termChosen

  const cohortTokenOptions = useMemo<TokenOption[]>(
    () => cohortOpts.map(c => ({ value: c, label: c })),
    [cohortOpts],
  )
  const clearCohorts = () => { for (const c of [...cohorts]) onToggleCohort(c) }

  // Add-students sheet target (null = closed).
  const [sheetFor, setSheetFor] = useState<CourseOffering | null>(null)

  const rows = useMemo<ScopeRow[]>(
    () =>
      scoped
        .map(o => {
          const r = deriveReadiness([o], [])[0]
          const [code, ...rest] = r.courseLabel.split(' – ')
          const dates = courseDates(o)
          const addedHere = addedStudents[o.id]?.length ?? 0
          const enrolled = o.enrolledCount + addedHere
          return {
            id: o.id, code, name: rest.join(' – '),
            courseLabel: r.courseLabel,
            deliveryMode: r.deliveryMode,
            typeLabel: COURSE_TYPE_FULL_LABEL[r.deliveryMode],
            enrolled,
            addedHere,
            datesLabel: dates ? `${fmtD(dates.start)} – ${fmtD(dates.end)}` : '—',
            offering: o,
            roster: (enrolled === 0 ? 'gap' : 'ready') as 'gap' | 'ready',
          }
        })
        .sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true })),
    [scoped, addedStudents],
  )

  // Width budget (≤ ~1110px at a 1400px viewport, DataTable is fixed-layout):
  // 40+300+110+140+160 = 750 — no horizontal scroll.
  const columns = useMemo<ColumnDef<ScopeRow>[]>(() => [
    { key: 'select', label: '', width: 40, defaultPin: 'left', lockPin: true },
    {
      key: 'code', label: 'Course', sortable: true, width: 300, defaultPin: 'left',
      cell: r => (
        <div className="flex flex-col py-0.5 min-w-0">
          <span className="font-mono text-xs tabular-nums">{r.code}</span>
          <TruncatedText className="text-sm font-medium">{r.name}</TruncatedText>
          <span className="text-xs tabular-nums whitespace-nowrap" style={{ color: 'var(--muted-foreground)' }}>
            {r.datesLabel}
          </span>
        </div>
      ),
    },
    {
      key: 'typeLabel', label: 'Type', sortable: true, width: 110,
      filter: {
        type: 'select', icon: 'fa-shapes',
        options: [
          { value: 'Classroom based', label: 'Classroom based' },
          { value: 'Lab based', label: 'Lab based' },
          { value: 'Practice based', label: 'Practice based' },
        ],
      },
      cell: r => <TypePill deliveryMode={r.deliveryMode} label={r.typeLabel} />,
    },
    {
      key: 'enrolled', label: 'Students', sortable: true, width: 140,
      cell: r => r.enrolled === 0
        ? (
          // Amber rides the ICON + ink, never a background wash; the words
          // carry the state so color never speaks alone (1.4.1).
          <span className="flex items-center gap-1.5 text-sm font-medium" style={{ color: 'var(--chip-4)' }}>
            <i className="fa-light fa-users-slash text-xs" aria-hidden="true" />
            None added
          </span>
        )
        : (
          <span className="flex items-baseline gap-1">
            <NumericCell value={r.enrolled} />
            {r.addedHere > 0 && (
              <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                +{r.addedHere} here
              </span>
            )}
          </span>
        ),
    },
    {
      key: 'actions', label: 'Action needed', width: 160, defaultPin: 'right', lockPin: true,
      cell: r => r.enrolled === 0
        ? (
          <Button
            variant="outline"
            size="xs"
            className="justify-start"
            onClick={e => { e.stopPropagation(); setSheetFor(r.offering) }}
          >
            <i className="fa-regular fa-circle-plus text-xs" aria-hidden="true" />
            Add students
          </Button>
        )
        : <span className="text-sm" style={{ color: 'var(--muted-foreground)' }}>—</span>,
    },
  ], [])

  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  // Grouped by roster status — gaps first so the fixes lead.
  const tableState = useTableState<ScopeRow>(
    rows, columns, undefined, { page, pageSize },
    'roster',
    { gap: 'Needs students', ready: 'Ready' },
    ['gap', 'ready'],
  )
  const filteredTotal = tableState.rows.length
  const totalPages = Math.max(1, Math.ceil(filteredTotal / pageSize))
  const safePage = Math.min(page, totalPages)
  const lastTotal = useRef(filteredTotal)
  useEffect(() => {
    if (lastTotal.current !== filteredTotal) { lastTotal.current = filteredTotal; setPage(1) }
  }, [filteredTotal])

  // Default selection on scope change: courses that HAVE students. A roster-gap
  // course joins the batch when the user checks it (or fixes the roster —
  // fixing does not auto-check, same rule as the readiness table's gap rows).
  const rowSig = rows.map(r => r.id).join('\0')
  const lastRowSig = useRef<string>('')
  useEffect(() => {
    if (lastRowSig.current === rowSig) return
    lastRowSig.current = rowSig
    tableState.setSelected(new Set(rows.filter(r => r.roster === 'ready').map(r => r.id)))
  }, [rowSig, rows, tableState])

  // Report selection up (de-duped).
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

  // A selected course with zero students blocks Continue — the survey would
  // have no recipients. Deselect it or add students to proceed.
  const selectedNoStudents = useMemo(
    () => rows.filter(r => tableState.selected.has(r.id) && r.enrolled === 0).length,
    [rows, tableState.selected],
  )

  return (
    <div className="flex flex-col gap-5 flex-1">
      {/* ── Scope band ────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-start gap-x-8 gap-y-4">
        <div className="flex flex-col gap-1.5" style={{ width: SCOPE_FIELD_WIDTH }}>
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

        <div className="flex flex-col gap-1.5" style={{ width: SCOPE_FIELD_WIDTH }}>
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
            <span className="text-sm font-semibold" id="cohort-label">
              Cohort <span className="font-normal" style={{ color: 'var(--muted-foreground)' }}>(optional)</span>
            </span>
            <TokenSelect
              labelId="cohort-label"
              placeholder="All cohorts"
              contentLabel="Cohorts"
              options={cohortTokenOptions}
              selected={cohorts}
              onToggle={onToggleCohort}
              onClear={clearCohorts}
              searchThreshold={COHORT_SEARCH_THRESHOLD}
            />
          </div>
        )}
      </div>

      {/* ── Courses ───────────────────────────────────────────────────────── */}
      {!scopeReady ? (
        <EmptyHint
          heading="Choose a term to load courses"
          sub="Pick a term and academic year above."
        />
      ) : isLoading ? (
        <div className="flex flex-col gap-2" aria-busy="true" aria-label="Loading courses">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-11 w-full rounded-md" />)}
        </div>
      ) : error ? (
        <LocalBanner
          variant="error"
          title="Could not load courses"
          {...(onRetry ? { action: { label: 'Retry', onClick: onRetry } } : {})}
        >
          {error}
        </LocalBanner>
      ) : rows.length === 0 ? (
        <EmptyHint heading="No courses for this scope" sub="Adjust the term or cohort filter." />
      ) : (
        <div className="flex flex-col gap-0">
          <DataTable<ScopeRow>
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
            toolbarSlot={(state) => {
              const filterFields: FilterFieldDef[] = columns
                .filter(c => c.filter)
                .map(c => ({
                  key: c.key,
                  label: c.label,
                  icon: c.filter!.icon ?? 'fa-filter',
                  type: c.filter!.type,
                  operators: c.filter!.operators ?? ['is', 'is_not'],
                  options: c.filter!.options,
                }))
              return (
                <>
                  <Tip label="Table properties" side="bottom">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      aria-label="Table properties"
                      aria-expanded={state.sheetOpen}
                      onClick={() => state.setSheetOpen(o => !o)}
                    >
                      <i className="fa-light fa-sliders text-[13px]" aria-hidden="true" />
                    </Button>
                  </Tip>
                  <TablePropertiesDrawer
                    open={state.sheetOpen}
                    onOpenChange={state.setSheetOpen}
                    activeFilters={state.activeFilters}
                    onAddFilter={state.addFilter}
                    onUpdateFilter={state.updateFilter}
                    onRemoveFilter={state.removeFilter}
                    getFilterConnector={state.getConnector}
                    onToggleFilterConnector={state.toggleConnector}
                    filterFields={filterFields}
                    totalRows={rows.length}
                    filteredRows={state.rows.length}
                    sortRules={state.sortRules}
                    onSortRulesChange={state.setSortRules}
                    onAddSortRule={state.addSortRule}
                    onRemoveSortRule={state.removeSortRule}
                    onToggleSortDir={state.toggleSortDir}
                    colOrder={state.colOrder}
                    onColOrderChange={state.setColOrder}
                    hiddenCols={state.hiddenCols}
                    onToggleColVisibility={state.toggleColVisibility}
                    onMoveCol={state.moveCol}
                    resolveColumnLabel={(key) => columns.find(c => c.key === key)?.label ?? key}
                    orderableKeys={columns.filter(c => c.key !== 'select' && c.key !== 'actions').map(c => c.key)}
                  />
                </>
              )
            }}
            groupIcons={{
              gap: <i className="fa-solid fa-triangle-exclamation text-xs" aria-hidden="true" />,
              ready: <i className="fa-solid fa-circle-check text-xs" aria-hidden="true" />,
            }}
            groupHeaderStyles={{
              gap: { background: 'var(--group-band-attention-bg)', color: 'var(--chip-4)' },
              ready: { background: 'var(--group-band-done-bg)', color: 'var(--chip-2)' },
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

      <AddStudentsSheet
        offering={sheetFor}
        open={sheetFor !== null}
        onOpenChange={o => { if (!o) setSheetFor(null) }}
        addedIds={sheetFor ? (addedStudents[sheetFor.id] ?? []) : []}
        onApply={onAddStudents}
      />

      {/* ── Footer ────────────────────────────────────────────────────────── */}
      <div className="sticky bottom-0 mt-auto bg-background border-t border-border py-4 flex items-center justify-between gap-4">
        <span className="text-xs tabular-nums" style={{ color: 'var(--muted-foreground)' }}>
          {scopeReady && rows.length > 0
            ? (
              <>
                {tableState.selected.size} of {rows.length} course{rows.length !== 1 ? 's' : ''} selected · {selectedStudents} students
                {selectedNoStudents > 0 && (
                  <>
                    {' · '}
                    <span className="font-medium" style={{ color: 'var(--chip-4)' }}>
                      {selectedNoStudents} selected without students
                    </span>
                  </>
                )}
              </>
            )
            : null}
        </span>
        <Button
          variant="default"
          size="sm"
          disabled={!scopeReady || tableState.selected.size === 0 || selectedNoStudents > 0}
          onClick={onContinue}
        >
          Continue
          <i className="fa-light fa-arrow-right text-xs" aria-hidden="true" />
        </Button>
      </div>
    </div>
  )
}
