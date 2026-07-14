'use client'

import { useMemo, useEffect, useRef, useState } from 'react'
import {
  Select, SelectTrigger, SelectContent, SelectItem, SelectValue,
  Badge, Skeleton, Button, InputGroup, InputGroupAddon,
  Popover, PopoverTrigger, PopoverContent, PopoverAnchor,
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

interface TokenOption {
  value: string
  label: string
  /** Optional heading this option sits under in the dropdown. */
  group?: string
}

interface TokenSelectProps {
  /** id of the field's visible label — names both the field and the popup. */
  labelId: string
  /** Resting text when nothing is chosen (e.g. "All cohorts"). */
  placeholder: string
  options: TokenOption[]
  selected: string[]
  onToggle: (value: string) => void
  onClear?: () => void
  groupOrder?: readonly string[]
  /** Above this many options the dropdown gains a search field. */
  searchThreshold?: number
  /** Block removing the last chip (required fields). */
  minOne?: boolean
  contentLabel: string
  /**
   * Chips rendered before the rest collapse into "+N". Keep this LOW — the field
   * sits in a horizontal scope band, so chips must never wrap past one row or the
   * field grows into the table. Measured: 9 chips in a 190px field stacked
   * vertically and overlapped the page.
   */
  maxChips?: number
}

/**
 * One control for both scope fields: chosen values are chips INSIDE the field,
 * the full option list lives in a searchable, grouped popup.
 *
 * Cohort and What-to-evaluate are different jobs, but they are the same *job
 * shape* — pick several from many — so they get the same control; the label and
 * the required marker carry the difference. Convergent across Gusto, Juicebox,
 * Contra, Udemy and Upwork.
 *
 * Chips and the popup trigger are SIBLINGS inside the shell, never nested: the
 * chip's remove button inside a trigger button would trip nested-interactive.
 */
function TokenSelect({
  labelId, placeholder, options, selected, onToggle, onClear,
  groupOrder, searchThreshold = 8, minOne = false, contentLabel, maxChips = 2,
}: TokenSelectProps) {
  const [open, setOpen] = useState(false)
  const byValue = useMemo(() => new Map(options.map(o => [o.value, o])), [options])
  const groups = useMemo(() => {
    if (!groupOrder?.length) return [{ heading: undefined as string | undefined, items: options }]
    return groupOrder
      .map(g => ({ heading: g as string | undefined, items: options.filter(o => o.group === g) }))
      .filter(g => g.items.length > 0)
  }, [options, groupOrder])

  const shown = selected.slice(0, maxChips)
  const overflow = selected.length - shown.length
  // The last chip of a required field must stay put; the field's helper line
  // explains why rather than a title tooltip that never fires on keyboard.
  const atMin = minOne && selected.length === 1

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverAnchor>
        <InputGroup className="flex flex-nowrap items-center gap-1 py-1 ps-1.5 pe-1 overflow-hidden">
          {shown.map(v => {
            const o = byValue.get(v)
            if (!o) return null
            return (
              <Badge key={v} variant="secondary" className="gap-1 ps-2 pe-0.5 py-0.5 font-normal min-w-0 shrink" style={{ maxWidth: 150 }}>
                {/* Long values truncate rather than force the field wider — a
                    cohort can be "Class of 2027 – Group B". */}
                <span className="truncate" title={o.label}>{o.label}</span>
                <Button
                  variant="ghost"
                  size="xs"
                  className="size-4 p-0 shrink-0 hover:bg-transparent"
                  disabled={atMin}
                  aria-label={`Remove ${o.label}`}
                  onClick={() => onToggle(v)}
                >
                  <i className="fa-light fa-xmark text-xs" aria-hidden="true" />
                </Button>
              </Badge>
            )
          })}
          {overflow > 0 && (
            <Badge variant="outline" className="font-normal shrink-0">+{overflow}</Badge>
          )}
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              aria-haspopup="listbox"
              aria-expanded={open}
              aria-labelledby={labelId}
              className="flex-1 justify-start px-1 font-normal hover:bg-transparent"
              style={{ minWidth: selected.length === 0 ? 64 : 20 }}
            >
              {selected.length === 0
                ? <span style={{ color: 'var(--muted-foreground)' }}>{placeholder}</span>
                : <span className="sr-only">Change selection</span>}
            </Button>
          </PopoverTrigger>
          <InputGroupAddon align="inline-end">
            <i className="fa-light fa-chevron-down text-xs" aria-hidden="true" />
          </InputGroupAddon>
        </InputGroup>
      </PopoverAnchor>

      <PopoverContent align="start" className="p-0" style={{ width: 260 }} aria-label={contentLabel}>
        <Command>
          {options.length > searchThreshold && <CommandInput placeholder="Search" />}
          <CommandList>
            <CommandEmpty>No matches.</CommandEmpty>
            {groups.map(({ heading, items }) => (
              <CommandGroup key={heading ?? '_'} heading={heading}>
                {items.map(o => {
                  const checked = selected.includes(o.value)
                  return (
                    /* Check glyph, not a DS Checkbox — Checkbox is a button and
                       would nest inside role="option". cmdk owns aria-selected
                       for its highlight, so state rides in the accessible name. */
                    <CommandItem key={o.value} value={o.label} onSelect={() => onToggle(o.value)}>
                      <i
                        className={`fa-solid fa-check text-xs ${checked ? '' : 'opacity-0'}`}
                        aria-hidden="true"
                      />
                      <span className="truncate">{o.label}</span>
                      {checked && <span className="sr-only">, selected</span>}
                    </CommandItem>
                  )
                })}
              </CommandGroup>
            ))}
          </CommandList>
          {onClear && selected.length > 0 && (
            <>
              <CommandSeparator />
              <div className="p-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start font-normal"
                  onClick={onClear}
                >
                  Clear
                </Button>
              </div>
            </>
          )}
        </Command>
      </PopoverContent>
    </Popover>
  )
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

  // Guarded, not disabled in the popup: the item stays reachable there, while the
  // last chip's remove button is disabled and the helper line says why.
  const toggleCriterion = (c: Criterion) => {
    const next = criteria.includes(c) ? criteria.filter(x => x !== c) : [...criteria, c]
    if (next.length > 0) onCriteriaChange(next)
  }
  const cohortTokenOptions = useMemo<TokenOption[]>(
    () => cohortOpts.map(c => ({ value: c, label: c })),
    [cohortOpts],
  )
  // Both callers own cohorts via functional setState, so toggling each selected
  // one off clears without widening the prop contract. Empty = no filter.
  const clearCohorts = () => { for (const c of [...cohorts]) onToggleCohort(c) }
  const criterionTokenOptions = useMemo<TokenOption[]>(
    () => CRITERIA_ORDER.map(c => ({
      value: c, label: CRITERION_TOGGLE_LABEL[c], group: CRITERION_GROUP[c],
    })),
    [],
  )

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
            <div className="flex flex-col gap-1.5" style={{ width: 380 }}>
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

        {termChosen && (
          <div className="flex flex-col gap-2 border-t border-border pt-4">
            <div className="flex items-baseline gap-2">
              <span className="text-sm font-semibold" id="evaluatees-label">
                What to evaluate <span style={{ color: 'var(--destructive)' }}>*</span>
              </span>
              <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                Readiness updates as you select
              </span>
            </div>
            {/* Same control as Cohort: same job shape (pick several from many).
                The label and the required marker carry the difference, not a
                different interaction model. The role universe (~40-50 in Prism,
                narrowed per program in Settings) stays in the searchable popup,
                so the field shows what you PICKED and never the whole list. */}
            <div style={{ maxWidth: 420 }}>
              <TokenSelect
                labelId="evaluatees-label"
                placeholder="Select roles"
                contentLabel="Evaluatee roles"
                options={criterionTokenOptions}
                selected={criteria}
                onToggle={v => toggleCriterion(v as Criterion)}
                groupOrder={CRITERION_GROUP_ORDER}
                minOne
              />
            </div>
            {/* Stated, not left to a title tooltip: the last chip's remove button
                is disabled, and a native title never fires on keyboard. */}
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
