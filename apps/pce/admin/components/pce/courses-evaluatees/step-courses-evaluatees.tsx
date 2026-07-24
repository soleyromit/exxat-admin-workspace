'use client'

import { useMemo, useEffect, useRef, useState, type ReactNode } from 'react'
import {
  Select, SelectTrigger, SelectContent, SelectItem, SelectValue,
  Skeleton, Button, Tip, LocalBanner,
} from '@exxatdesignux/ui'
import { NumericCell } from '@/components/data-views/table-cells'
import { TablePropertiesDrawer } from '@/components/table-properties/drawer'
import type { FilterFieldDef } from '@/components/table-properties/types'
import { PersonAvatar } from '@/components/pce/person-avatar'
import { usePce } from '@/components/pce/pce-state'
import { CreateBlankTemplate } from '@/components/pce/create-blank-template'
import { TemplateEditor } from '@/components/pce/template-editor'
import { DataTable } from '@/components/data-table'
import { TruncatedText } from '@/components/truncated-text'
import { PaginationBar } from '@/components/data-table/pagination'
import { useTableState } from '@/components/data-table/use-table-state'
import type { ColumnDef } from '@/components/data-table/types'
import {
  type CourseOffering, type TermSeason, type DeliveryMode, type PceTemplate,
  type PceSurvey,
  COURSE_TYPE_FULL_LABEL,
} from '@/lib/pce-mock-data'
import { TERM_SEASONS, academicYearOptions } from '@/lib/pce-course-scope'
import {
  type Criterion, type CellReadiness,
  FACULTY_CRITERIA, deriveReadiness, prismAddFacultyHref, templateCriteria,
} from '@/lib/pce-course-readiness'
import { courseDates } from '@/lib/pce-push-validation'
// Shared scope-band + table furniture — extracted to scope-controls.tsx for
// the two-step split (Jul 2026); this merged step (term-setup wizard) and the
// split steps render the same controls from one source.
import {
  TokenSelect, type TokenOption, TypePill, AddInPrismButton, EmptyHint,
  SCOPE_FIELD_WIDTH, COHORT_SEARCH_THRESHOLD, fmtD,
} from './scope-controls'

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
  /** Effective template (explicit assignment ?? type default; '' = none). */
  templateId: string
  /** One Prism link covering every missing faculty role on this offering. */
  facultyHref: string
  /** Group key: gaps first, then ready. */
  readiness: 'gap' | 'ready'
  /** Evaluation flows ALREADY pushed for this offering (other wizard runs) —
   *  the same course can be covered by several, each with its own evaluatee. */
  flows: PceSurvey[]
}

interface StepCoursesEvaluateesProps {
  season: TermSeason | ''
  academicYear: string
  cohorts: string[]
  cohortOptions: string[]
  scoped: CourseOffering[]
  isLoading?: boolean
  /** Fetch failure from the parent's async boundary — renders the error
   *  banner with a Retry affordance when provided. */
  error?: string | null
  onRetry?: () => void
  /** True when a prior step already defined the term (term-setup wizard):
   *  Term + Academic year render as a static line instead of selects. */
  scopeLocked?: boolean
  /** Templates assignable per course row — what each row validates against. */
  publishedTemplates: PceTemplate[]
  /** Explicit per-offering assignments (overrides defaultAssignments). */
  templateAssignments: Record<string, string>
  /** Type-matched default template per offering. */
  defaultAssignments: Record<string, string>
  onTemplateChange: (offeringId: string, templateId: string) => void
  onResetDefaults: () => void
  onSeasonChange: (v: TermSeason) => void
  onAcademicYearChange: (v: string) => void
  onToggleCohort: (cohort: string) => void
  onSelectionChange: (ids: Set<string>) => void
  onContinue: () => void
}

export function StepCoursesEvaluatees({
  season, academicYear, cohorts,
  cohortOptions: cohortOpts, scoped, isLoading = false, error = null, onRetry,
  scopeLocked = false,
  publishedTemplates, templateAssignments, defaultAssignments,
  onTemplateChange, onResetDefaults,
  onSeasonChange, onAcademicYearChange, onToggleCohort,
  onSelectionChange, onContinue,
}: StepCoursesEvaluateesProps) {
  const years = academicYearOptions()
  const termChosen = !!season && !!academicYear
  const scopeReady = termChosen

  const cohortTokenOptions = useMemo<TokenOption[]>(
    () => cohortOpts.map(c => ({ value: c, label: c })),
    [cohortOpts],
  )
  // Both callers own cohorts via functional setState, so toggling each selected
  // one off clears without widening the prop contract. Empty = no filter.
  const clearCohorts = () => { for (const c of [...cohorts]) onToggleCohort(c) }

  // In-step template creation (ported from the retired Survey Design step): the
  // step swaps to the SAME create flow + builder used by Settings > Templates,
  // then returns on publish. The wizard page never unmounts, so state persists.
  const { templates: allTemplates, surveys } = usePce()
  const [subView, setSubView] = useState<'assign' | 'create' | { buildId: string }>('assign')
  const [notice, setNotice] = useState<{ kind: 'published' | 'draft'; name: string } | null>(null)
  const backToAssign = () => {
    if (typeof subView === 'object') {
      const t = allTemplates.find(x => x.id === subView.buildId)
      if (t && t.status !== 'active') setNotice({ kind: 'draft', name: t.name || 'Untitled template' })
    }
    setSubView('assign')
  }

  // WHAT each course must have comes from ITS template, not a wizard-level
  // "what to evaluate" picker: criteria per row = the assigned template's
  // sections/role sets, so validation follows the assignment cell by cell.
  const criteriaByTemplate = useMemo(() => {
    const m = new Map<string, Criterion[]>()
    for (const t of publishedTemplates) m.set(t.id, templateCriteria(t))
    return m
  }, [publishedTemplates])

  // Flows already pushed per offering — earlier wizard runs, keyed by the
  // survey's offeringId FK. Course-scope flows lead, then by open date, so the
  // Status cell reads in the order the students will see them.
  const flowsByOffering = useMemo(() => {
    const m = new Map<string, PceSurvey[]>()
    for (const s of surveys) {
      if (!s.offeringId) continue
      m.set(s.offeringId, [...(m.get(s.offeringId) ?? []), s])
    }
    const rank: Record<string, number> = { course: 0, instructor: 1 }
    for (const list of m.values()) {
      list.sort((a, b) =>
        (rank[a.evalScope ?? ''] ?? 2) - (rank[b.evalScope ?? ''] ?? 2) ||
        (a.openDate ?? '').localeCompare(b.openDate ?? ''),
      )
    }
    return m
  }, [surveys])

  // One row per course (one type per course), ordered by code.
  const rows = useMemo<ReadinessRow[]>(
    () =>
      scoped
        .map(o => {
          // An id that resolves to no PUBLISHED template is treated as
          // unassigned, not silently "ready": assignments can dangle — the
          // demo-account provider seeds the default account on first render
          // and applies the stored account post-mount (pce-state.tsx), and a
          // template can be deleted/unpublished after assignment. A dangling
          // id used to render a blank select with zero criteria → zero gaps
          // → the row lied "Ready to send".
          const rawTemplateId = templateAssignments[o.id] ?? defaultAssignments[o.id] ?? ''
          const templateId = rawTemplateId && criteriaByTemplate.has(rawTemplateId) ? rawTemplateId : ''
          // Students are the RESPONDENTS of every evaluation, so the roster is
          // validated on every assigned row — NOT only when the template has a
          // course-content section. A faculty-only template on a 0-student
          // course used to read "Ready to send" and push to nobody.
          const evalCriteria = templateId ? (criteriaByTemplate.get(templateId) ?? []) : []
          const rowCriteria = templateId
            ? (evalCriteria.includes('students') ? evalCriteria : (['students', ...evalCriteria] as Criterion[]))
            : []
          const r = deriveReadiness([o], rowCriteria)[0]
          const [code, ...rest] = r.courseLabel.split(' – ')
          const dates = courseDates(r.offering)
          // A row without a template can't be validated — it needs setup too.
          const hasGap = !templateId || r.hasGap
          return {
            id: r.offering.id, code, name: rest.join(' – '),
            courseLabel: r.courseLabel,
            deliveryMode: r.deliveryMode,
            typeLabel: COURSE_TYPE_FULL_LABEL[r.deliveryMode],
            enrolled: r.offering.enrolledCount,
            dates,
            datesLabel: dates ? `${fmtD(dates.start)} – ${fmtD(dates.end)}` : '—',
            cells: r.cells, hasGap,
            templateId,
            facultyHref: prismAddFacultyHref(r.offering),
            readiness: (hasGap ? 'gap' : 'ready') as 'gap' | 'ready',
            flows: flowsByOffering.get(r.offering.id) ?? [],
          }
        })
        .sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true })),
    [scoped, templateAssignments, defaultAssignments, criteriaByTemplate, flowsByOffering],
  )

  // Width budget: the sum of every column width must stay ≤ ~1110px — the
  // content area at a 1400px viewport. DataTable is fixed-layout with
  // minWidth = the sum, so blowing the budget forces a horizontal scroll in
  // which Faculty slides under the pinned Action column (hard mid-letter
  // clip) and Status — the column this step exists to consult — scrolls
  // out of view. Current sum: 40+190+78+330+200+86+150 = 1074.
  const columns = useMemo<ColumnDef<ReadinessRow>[]>(() => {
    const cols: ColumnDef<ReadinessRow>[] = [
      { key: 'select', label: '', width: 40, defaultPin: 'left', lockPin: true },
      {
        // Identity is ONE pinned column. Code LEADS the line: programs talk in
        // codes ("DPT-502"), and the fixed-width mono token keeps rows aligned
        // while the name truncates behind it. Sort follows the code (key).
        key: 'code', label: 'Course', sortable: true, width: 190, defaultPin: 'left',
        cell: r => (
          /* Three quiet lines — code, name, dates — instead of a Dates column:
             the no-scroll width budget has no room for one, and the two-line
             Faculty/Template cells already set the row height, so the third
             line costs nothing. */
          <div className="flex flex-col py-0.5 min-w-0">
            <span className="font-mono text-xs tabular-nums">{r.code}</span>
            <TruncatedText className="text-sm font-medium">{r.name}</TruncatedText>
            {/* Enrollment tucks into the identity line (Romit, Jul 22) — the
                dedicated Students column is hidden by default, re-addable via
                Table properties. Amber count = the roster gap at a glance. */}
            <span className="flex items-center gap-1 text-xs tabular-nums whitespace-nowrap" style={{ color: 'var(--muted-foreground)' }}>
              {r.dates && <span>{r.datesLabel}</span>}
              {r.dates && <span aria-hidden="true">·</span>}
              <span
                className="inline-flex items-center gap-1"
                style={r.enrolled === 0 ? { color: 'var(--chip-4)', fontWeight: 500 } : undefined}
              >
                <i className="fa-light fa-user-group" style={{ fontSize: 9 }} aria-hidden="true" />
                {r.enrolled}
                <span className="sr-only"> students enrolled</span>
              </span>
            </span>
          </div>
        ),
      },
      {
        // 78, not 60: the header itself needs the room — at 60 it rendered
        // as a clipped "Student:".
        key: 'enrolled', label: 'Students', width: 78,
        // Catalog count cell — always muted: the count is context, and a
        // roster gap is announced by the Action column, not by this number.
        cell: r => <NumericCell value={r.enrolled} className="text-muted-foreground" />,
      },
      {
        // THE FLOW LEDGER (Romit, Jul 22 — the promoted Variant C): one line
        // per evaluation flow this course's template implies, fixed grammar
        // glyph · evaluatee · status/fix, state-adaptive weight:
        //   amber + button        → blocked (the only loud thing; fix ON the line)
        //   unlabeled             → will be created on push (mark only exceptions)
        //   "Scheduled · Oct 12"  → covered by an earlier run; here's when it opens
        // Monil's separate-flows model reads natively — lines diverge per
        // evaluatee — and the anatomy matches the term workspace's per-flow rows.
        key: 'flows', label: 'Evaluation flows', width: 330,
        cell: r => {
          const criteria = r.templateId ? (criteriaByTemplate.get(r.templateId) ?? []) : []
          if (criteria.length === 0) {
            return <span className="text-sm" style={{ color: 'var(--muted-foreground)' }}>—</span>
          }
          const studentsCell = r.cells.students
          const noStudents = !!studentsCell && !studentsCell.ok
          const lines: ReactNode[] = []
          // Course-level roster gap leads — it blocks EVERY flow below it once,
          // instead of stamping each line.
          // Ledger lines are INFORMATION ONLY (Romit, Jul 22 — variant 4 of the
          // fix-affordance compare): the fixes live in the dedicated Action
          // column, one predictable scan lane, with the amber lines here as
          // their referents.
          if (noStudents) {
            lines.push(
              <span key="students" className="flex items-center gap-1.5 min-w-0">
                <span className="size-5 rounded-full flex items-center justify-center shrink-0" style={{ background: 'var(--group-band-attention-bg)' }}>
                  <i className="fa-light fa-users-slash" style={{ fontSize: 9, color: 'var(--chip-4)' }} aria-hidden="true" />
                </span>
                <span className="text-sm font-medium truncate" style={{ color: 'var(--chip-4)' }}>No students enrolled</span>
              </span>,
            )
          }
          if (criteria.includes('students')) {
            const covered = r.flows.find(f => f.evalScope !== 'instructor')
            lines.push(
              <span key="course" className="flex items-center gap-1.5 min-w-0">
                <span className="size-5 rounded-full flex items-center justify-center shrink-0 border border-border" style={{ background: 'var(--background)' }}>
                  <i className="fa-light fa-book-open" style={{ fontSize: 9, color: 'var(--muted-foreground)' }} aria-hidden="true" />
                </span>
                {/* In a gap course every non-blocked flow WAITS on the fix —
                    muted ink says "planned, not proceeding" so the amber gap
                    lines are the only thing that reads active. */}
                <span className="text-sm truncate" style={r.hasGap && !covered ? { color: 'var(--muted-foreground)' } : undefined}>Course</span>
              </span>,
            )
          }
          for (const c of FACULTY_CRITERIA) {
            const cell = r.cells[c]
            if (!cell) continue
            if (!cell.ok) {
              lines.push(
                <span key={c} className="flex items-center gap-1.5 min-w-0">
                  <span className="size-5 rounded-full flex items-center justify-center shrink-0" style={{ background: 'var(--group-band-attention-bg)' }}>
                    <i className="fa-light fa-user-slash" style={{ fontSize: 9, color: 'var(--chip-4)' }} aria-hidden="true" />
                  </span>
                  <span className="text-sm font-medium truncate" style={{ color: 'var(--chip-4)' }}>
                    {cell.label}<span className="font-normal"> — not assigned</span>
                  </span>
                </span>,
              )
              continue
            }
            const covered = r.flows.find(f => f.evalScope === 'instructor' && f.instructors[0]?.name === cell.value)
            lines.push(
              <span key={c} className="flex items-center gap-1.5 min-w-0">
                <PersonAvatar name={cell.value!} className="size-5" />
                <span className="text-sm truncate" style={r.hasGap && !covered ? { color: 'var(--muted-foreground)' } : undefined}>
                  {cell.value}
                  <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}> · {cell.label}</span>
                </span>
              </span>,
            )
          }
          return (
            <div className="flex flex-col gap-1.5 py-1 min-w-0" onClick={e => e.stopPropagation()}>
              {lines}
            </div>
          )
        },
      },
    ]
    // The row's survey template — placed right after the course identity (the
    // step's order IS the work order: pick courses → assign templates → fix
    // what validation flags), and ahead of the wide Faculty column so the
    // assignment control never hides behind the pinned Action column.
    // No evaluates subtitle anymore — the flow ledger IS the live rendering of
    // what the template evaluates, so restating it under the select would be
    // the same repetition the ledger replaced.
    cols.push({
      key: 'template', label: 'Template', width: 200,
      cell: r => {
        const edited = !!r.templateId && r.templateId !== defaultAssignments[r.id]
        const unassigned = !r.templateId
        // Zero published templates = the select is a dead end. The CREATE
        // action moved HERE from the retired Action column (Jul 22): it opens
        // the same in-step create flow.
        if (publishedTemplates.length === 0) {
          return (
            <Button
              variant="outline"
              size="xs"
              className="justify-start"
              aria-label={`Create a template — none exist yet to assign to ${r.code}`}
              onClick={e => { e.stopPropagation(); setNotice(null); setSubView('create') }}
            >
              <i className="fa-regular fa-circle-plus text-xs" aria-hidden="true" />
              Create template
            </Button>
          )
        }
        return (
          <div className="flex flex-col items-start gap-1 py-0.5" onClick={e => e.stopPropagation()}>
            {/* A2 (Romit, Jul 21): the empty state is an ADD-AFFORDANCE, not a
                blank form field — a soft info-tinted pill ("＋ Assign
                template", no border, no chevron) that becomes the normal calm
                select once filled. Info-blue = a choice made in-app; amber is
                reserved for missing data. A hand-changed row keeps the
                secondary tint ("not factory state"). Color never carries
                state alone — the label and accessible name say it (1.4.1). */}
            <Select value={r.templateId} onValueChange={v => onTemplateChange(r.id, v)}>
              <SelectTrigger
                aria-label={`Template for ${r.code}${unassigned ? ' — required' : ''}${edited ? ' — changed from default' : ''}`}
                /* [&>span]:truncate: a long template name ellipsizes instead of
                   hard-clipping mid-letter ("Faculty Midterm Check-Ir"). */
                /* border/shadow removal rides className, NOT the style prop:
                   inline style (specificity 1000) would also beat the DS
                   :focus-visible ring, leaving keyboard users with no focus
                   indicator on the pill. Utility classes lose to :focus-visible,
                   so the ring re-asserts on focus. */
                className={unassigned
                  ? 'w-fit min-w-0 border-0 shadow-none'
                  : `w-full min-w-0 [&>span]:truncate [&>span]:min-w-0 ${edited ? 'bg-secondary' : ''}`}
                style={{
                  height: 32, fontSize: 13,
                  ...(unassigned ? {
                    paddingInline: 12,
                    background: 'var(--insight-severity-info-bg)',
                  } : {}),
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
          </div>
        )
      },
    })
    cols.push(
      {
        key: 'typeLabel', label: 'Type', sortable: true, width: 86,
        filter: {
          type: 'select', icon: 'fa-shapes',
          options: [
            { value: 'Classroom based', label: 'Classroom based' },
            { value: 'Lab based', label: 'Lab based' },
            { value: 'Practice based', label: 'Practice based' },
          ],
        },
        // D5 (Romit, Jul 21): tinted categorical pill — shared TypePill
        // (scope-controls). Short display label; sorting/filtering still ride
        // the full typeLabel value.
        cell: r => <TypePill deliveryMode={r.deliveryMode} label={r.typeLabel} />,
      },
      {
        // Fixes in ONE scannable lane (Romit, Jul 22 — fix-affordance variant
        // 4): the amber ledger lines name each gap; this column carries the
        // consolidated Prism trips. Create-template stays in the Template cell.
        key: 'actions', label: 'Action needed', width: 150, defaultPin: 'right', lockPin: true,
        cell: r => {
          if (!r.templateId) {
            return publishedTemplates.length === 0
              ? <span className="text-sm" style={{ color: 'var(--muted-foreground)' }}>—</span>
              : <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Assign a template</span>
          }
          const studentCell = r.cells.students
          const studentGap = !!studentCell && !studentCell.ok
          // Every missing person-role collapses into a single trip to Prism;
          // the tooltip names WHICH roles.
          const facultyMissing = FACULTY_CRITERIA
            .filter(c => r.cells[c] && !r.cells[c]!.ok)
            .map(c => r.cells[c]!.label)
          if (!studentGap && facultyMissing.length === 0) {
            return <span className="text-sm" style={{ color: 'var(--muted-foreground)' }}>—</span>
          }
          return (
            <div className="flex flex-col items-start gap-1 py-0.5">
              {studentGap && (
                <AddInPrismButton href={studentCell!.prismHref ?? '#'} label="Add students" />
              )}
              {facultyMissing.length > 0 && (
                <AddInPrismButton href={r.facultyHref} label="Add faculty" roles={facultyMissing} />
              )}
            </div>
          )
        },
      },
    )
    return cols
  }, [publishedTemplates, defaultAssignments, onTemplateChange, criteriaByTemplate])

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
  // Students is an OPTIONAL column (Romit, Jul 22): hidden by default — the
  // count rides the Course identity line — and re-addable from the Table
  // properties drawer. Run-once so a user's unhide sticks.
  const hidStudentsOnce = useRef(false)
  useEffect(() => {
    if (hidStudentsOnce.current) return
    hidStudentsOnce.current = true
    tableState.setHiddenCols(prev => new Set([...prev, 'enrolled']))
  }, [tableState])
  const filteredTotal = tableState.rows.length
  const totalPages = Math.max(1, Math.ceil(filteredTotal / pageSize))
  const safePage = Math.min(page, totalPages)
  // Search/filter changes shrink the set — snap back to page 1.
  const lastTotal = useRef(filteredTotal)
  useEffect(() => {
    if (lastTotal.current !== filteredTotal) { lastTotal.current = filteredTotal; setPage(1) }
  }, [filteredTotal])

  // Selection — default to READY rows only on scope change (Romit, Jul 21):
  // pre-checking needs-setup rows put unpushable courses in the batch and
  // tripped the "N without a template" blocker. A row fixed later is checked
  // by the user (or via the group checkbox); any course can be (un)checked.
  // The signature includes the published-template catalog: the provider
  // renders the DEFAULT demo account first and settles the stored account
  // post-mount, so readiness computed at first paint can be wrong while the
  // row ids are identical — a catalog change must re-derive the default.
  // Per-row assignment edits don't change the catalog, so manual selection
  // survives them.
  const rowSig = rows.map(r => r.id).join('\0') + '|' + publishedTemplates.map(t => t.id).join('\0')
  const lastRowSig = useRef<string>('')
  useEffect(() => {
    if (lastRowSig.current === rowSig) return
    lastRowSig.current = rowSig
    tableState.setSelected(new Set(rows.filter(r => r.readiness === 'ready').map(r => r.id)))
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

  // Continue needs a template on every course that will be pushed — the rows
  // NOT selected are excluded from the push and may stay unassigned.
  const selectedMissingTemplate = useMemo(
    () => rows.filter(r => tableState.selected.has(r.id) && !r.templateId).length,
    [rows, tableState.selected],
  )

  // ── Create sub-view: same chooser + builder as Settings > Templates ────────
  if (subView !== 'assign') {
    return (
      <div className="flex flex-col gap-3">
        <div>
          <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground" onClick={backToAssign}>
            <i className="fa-light fa-arrow-left text-xs" aria-hidden="true" />
            Back to Courses
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
            </>
          )}

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

          {/* Template actions ride the scope row's right edge — a separate
              toolbar line under the fields (plus an assigned-count label) was
              a band of chrome too many. */}
          {scopeReady && !isLoading && rows.length > 0 && (
            <div className="ms-auto self-end flex items-center gap-2">
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground" onClick={onResetDefaults}>
                <i className="fa-light fa-arrow-rotate-left text-xs" aria-hidden="true" />
                Reset to defaults
              </Button>
              {/* Opens the SAME create flow + builder as Settings → Templates,
                  in place — the wizard stays mounted so its state is preserved. */}
              <Button variant="outline" size="sm" onClick={() => { setNotice(null); setSubView('create') }}>
                <i className="fa-light fa-plus" aria-hidden="true" />
                New template
              </Button>
            </div>
          )}
        </div>
      </div>

      {notice && (
        <LocalBanner
          variant={notice.kind === 'published' ? 'success' : 'info'}
          dismissible
          onDismiss={() => setNotice(null)}
        >
          {notice.kind === 'published'
            ? <>&ldquo;{notice.name}&rdquo; published — assign it in the Template column below.</>
            : <>&ldquo;{notice.name}&rdquo; saved as a draft — publish it to make it assignable. It&apos;s in Settings &rsaquo; Templates.</>}
        </LocalBanner>
      )}

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
        /* Async error surface (state-catalog invariant #6): the parent owns
           the fetch; this branch gives its failure a retry affordance. */
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
          /* Table properties (columns / filters / sort) — the standard drawer,
             where the hidden-by-default Students column can be re-added. */
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
            /* Icons inherit the band ink set by groupHeaderStyles below. */
            gap: <i className="fa-solid fa-triangle-exclamation text-xs" aria-hidden="true" />,
            ready: <i className="fa-solid fa-circle-check text-xs" aria-hidden="true" />,
          }}
          /* E1 (Romit, Jul 21): tinted group-header bands — the amber band
             says "this section needs you", the green band says "done", and
             the data rows stay clean. AA-safe DS pairing: chart wash bg +
             the matching --chip ink (warning-fg on warning-bg fails at
             4.23:1; chip inks are darker and clear 4.5 comfortably).
             OPAQUE tokens (app globals.css), not the translucent
             --icon-disc-* washes: the band covers the sticky select cell,
             and a see-through sticky cell lets the label scroll visibly
             under the group checkbox. */
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

      {/* ── Footer ────────────────────────────────────────────────────────── */}
      <div className="sticky bottom-0 mt-auto bg-background border-t border-border py-4 flex items-center justify-between gap-4">
        <span className="text-xs tabular-nums" style={{ color: 'var(--muted-foreground)' }}>
          {scopeReady && rows.length > 0
            ? (
              <>
                {tableState.selected.size} of {rows.length} course{rows.length !== 1 ? 's' : ''} selected · {selectedStudents} students
                {selectedMissingTemplate > 0 && (
                  /* The count that BLOCKS Continue shares the info-blue of the
                     "Assign template" placeholders that clear it — same
                     signal, both ends of the loop. */
                  <>
                    {' · '}
                    <span className="font-medium" style={{ color: 'var(--insight-severity-info-fg)' }}>
                      {selectedMissingTemplate} without a template
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
          disabled={!scopeReady || tableState.selected.size === 0 || selectedMissingTemplate > 0}
          onClick={onContinue}
        >
          Continue
          <i className="fa-light fa-arrow-right text-xs" aria-hidden="true" />
        </Button>
      </div>
    </div>
  )
}
