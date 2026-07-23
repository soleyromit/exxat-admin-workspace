'use client'

import { useMemo, useEffect, useRef, useState } from 'react'
import {
  Select, SelectTrigger, SelectContent, SelectItem, SelectValue,
  Badge, Skeleton, Button, InputGroup, Tip, LocalBanner,
  Popover, PopoverTrigger, PopoverContent, PopoverAnchor,
  Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem, CommandSeparator,
} from '@exxatdesignux/ui'
import { NumericCell, PeopleAvatarRailCell, type PersonStub } from '@/components/data-views/table-cells'
import { facultyAvatarUrl } from '@/components/pce/person-avatar'
import { initialsOf } from '@/lib/pce-analytics'
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
import { SurveyStatusBadge } from '@/components/pce/pce-badges'
import { TERM_SEASONS, academicYearOptions } from '@/lib/pce-course-scope'
import {
  type Criterion, type CellReadiness,
  CRITERION_TOGGLE_LABEL, CRITERION_GROUP,
  FACULTY_CRITERIA, deriveReadiness, prismAddFacultyHref, templateCriteria,
} from '@/lib/pce-course-readiness'
import { courseDates } from '@/lib/pce-push-validation'

/** Above this count a picker gains a search field. */
const COHORT_SEARCH_THRESHOLD = 8

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
}

/** One width for every control in the scope band — Term, Academic Year,
 *  Cohort, What-to-evaluate — so the row reads as a set, not a ragged line. */
const SCOPE_FIELD_WIDTH = 224

/** Type-column pill tints — chart-hue wash + matching --chip ink (the DS
 *  icon-disc pairing). srgb mix (the oklch form is banned in product code);
 *  chart-4 amber is excluded — it belongs to the warning vocabulary. */
const TYPE_PILL_TINT: Record<DeliveryMode, { bg: string; fg: string }> = {
  classroom: { bg: 'color-mix(in srgb, var(--chart-1) 12%, transparent)', fg: 'var(--chip-1)' },
  lab:       { bg: 'var(--icon-disc-chart-2-bg)',                          fg: 'var(--chip-2)' },
  practice:  { bg: 'color-mix(in srgb, var(--chart-5) 12%, transparent)', fg: 'var(--chip-5)' },
}

/** Px estimate of one chip: badge chrome (padding, border, gap, ×-button ≈32)
 *  + ~6.5px per character at text-xs, capped at the chip's 150px maxWidth. */
const estChipWidth = (label: string) => Math.min(32 + label.length * 6.5, 150)
/** Shell padding + the chevron trigger's minimum are spoken for. */
const CHIP_BUDGET = SCOPE_FIELD_WIDTH - 46
const OVERFLOW_BADGE_WIDTH = 38

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
  groupOrder, searchThreshold = 8, minOne = false, contentLabel,
}: TokenSelectProps) {
  const [open, setOpen] = useState(false)
  const byValue = useMemo(() => new Map(options.map(o => [o.value, o])), [options])
  const groups = useMemo(() => {
    if (!groupOrder?.length) return [{ heading: undefined as string | undefined, items: options }]
    return groupOrder
      .map(g => ({ heading: g as string | undefined, items: options.filter(o => o.group === g) }))
      .filter(g => g.items.length > 0)
  }, [options, groupOrder])

  // Fill the fixed shell with as many chips as fit, then tuck the rest into
  // "+N" — a lone chip beside "+N" with dead space after it reads broken.
  // Estimated, not measured: chips shrink+truncate, so a near-miss degrades
  // into slight truncation rather than overflow.
  const shown = useMemo(() => {
    const labels = selected.map(v => byValue.get(v)?.label ?? v)
    const widthOf = (n: number) =>
      labels.slice(0, n).reduce((sum, l) => sum + estChipWidth(l), 0) + Math.max(0, n - 1) * 4
    if (widthOf(selected.length) <= CHIP_BUDGET) return selected
    let n = 1
    while (n < selected.length && widthOf(n + 1) + 4 + OVERFLOW_BADGE_WIDTH <= CHIP_BUDGET) n++
    return selected.slice(0, n)
  }, [selected, byValue])
  const overflow = selected.length - shown.length
  // The last chip of a required field must stay put; the field's helper line
  // explains why rather than a title tooltip that never fires on keyboard.
  const atMin = minOne && selected.length === 1

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverAnchor>
        <InputGroup
          className="flex flex-nowrap items-center gap-1 py-1 ps-1.5 pe-1 overflow-hidden"
          style={{ width: SCOPE_FIELD_WIDTH }}
        >
          {shown.map(v => {
            const o = byValue.get(v)
            if (!o) return null
            return (
              /* outline, not secondary: every filled neutral in this theme is
                 brand-tinted (--secondary oklch .012 @345, --muted .008 @345),
                 so a filled chip is always pink. outline = white + --border
                 (chroma .002) = actually neutral, and it's a real DS variant
                 rather than a className override of one. */
              <Badge key={v} variant="outline" className="gap-1 ps-2 pe-0.5 py-0.5 font-normal min-w-0 shrink" style={{ maxWidth: 150 }}>
                {/* Long values truncate rather than force the field wider — a
                    cohort can be "Class of 2027 – Group B". */}
                <span className="truncate" title={o.label}>{o.label}</span>
                <Button
                  variant="ghost"
                  size="xs"
                  className="size-4 p-0 shrink-0"
                  style={{ backgroundColor: 'transparent' }}
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
          {/* The chevron lives INSIDE the trigger. It was previously a sibling in
              an InputGroupAddon — a plain div — so the one affordance that reads
              as "open me" was not clickable, and the only hit area was a ~20px
              invisible strip beside it.
              justify-end when chips are shown: the visible label is sr-only
              (out of flex flow), so justify-between would leave the chevron —
              the only in-flow child — stranded at the start of the field. */}
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              aria-haspopup="listbox"
              aria-expanded={open}
              aria-labelledby={labelId}
              className={`flex-1 gap-1 px-1 font-normal ${selected.length === 0 ? 'justify-between' : 'justify-end'}`}
              style={{ minWidth: selected.length === 0 ? 64 : 32, backgroundColor: 'transparent' }}
            >
              {selected.length === 0
                ? <span style={{ color: 'var(--muted-foreground)' }}>{placeholder}</span>
                : <span className="sr-only">Change selection</span>}
              <i
                className="fa-light fa-chevron-down text-xs shrink-0"
                aria-hidden="true"
                style={{ color: 'var(--muted-foreground)' }}
              />
            </Button>
          </PopoverTrigger>
        </InputGroup>
      </PopoverAnchor>

      {/* Hugs its content instead of a fixed width: "Course / Instructor" needs
          far less room than a cohort name, and a half-empty menu reads broken.
          Bounded so a long role still wraps sanely. */}
      <PopoverContent
        align="start"
        className="p-0 w-auto min-w-44 max-w-80"
        aria-label={contentLabel}
      >
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

/**
 * Fix action for the Actions column — opens Prism in a new tab.
 *
 * The label stays generic ("Add faculty") because a course can be missing
 * several roles at once and naming one of them lies. `roles` names them on
 * hover/focus instead, so the CTA still tells you WHAT to add. DS Tip rather
 * than a native title: title never fires on keyboard focus.
 */
function AddInPrismButton({ href, label, roles }: { href: string; label: string; roles?: string[] }) {
  const missing = roles?.length ? `Missing: ${roles.join(', ')}` : null
  const trigger = (
    /* Neutral DS chrome: the amber FACT line above the button carries the
       attention; the button is the remedy, not the alarm. */
    <Button asChild variant="outline" size="xs" className="justify-start">
      <a href={href} target="_blank" rel="noopener noreferrer">
        <i className="fa-regular fa-circle-plus text-xs" aria-hidden="true" />
        {label}
        {missing && <span className="sr-only"> — {missing}</span>}
        <span className="sr-only"> (opens in new tab)</span>
        <i className="fa-light fa-arrow-up-right-from-square text-xs" aria-hidden="true" />
      </a>
    </Button>
  )
  return (
    <Tip
      label={
        <>
          {missing ?? `${label} in Exxat Prism`}
          <span className="block opacity-70">Opens Exxat Prism in a new tab</span>
        </>
      }
      side="left"
    >
      {trigger}
    </Tip>
  )
}

interface StepCoursesEvaluateesProps {
  season: TermSeason | ''
  academicYear: string
  cohorts: string[]
  cohortOptions: string[]
  scoped: CourseOffering[]
  isLoading?: boolean
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
  cohortOptions: cohortOpts, scoped, isLoading = false,
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
  // out of view. Current sum: 40+224+78+124+208+96+82+150 = 1002.
  const columns = useMemo<ColumnDef<ReadinessRow>[]>(() => {
    const cols: ColumnDef<ReadinessRow>[] = [
      { key: 'select', label: '', width: 40, defaultPin: 'left', lockPin: true },
      {
        // Identity is ONE pinned column. Code LEADS the line: programs talk in
        // codes ("DPT-502"), and the fixed-width mono token keeps rows aligned
        // while the name truncates behind it. Sort follows the code (key).
        key: 'code', label: 'Course', sortable: true, width: 224, defaultPin: 'left',
        cell: r => (
          /* Three quiet lines — code, name, dates — instead of a Dates column:
             the no-scroll width budget has no room for one, and the two-line
             Faculty/Template cells already set the row height, so the third
             line costs nothing. */
          <div className="flex flex-col py-0.5 min-w-0">
            <span className="font-mono text-xs tabular-nums">{r.code}</span>
            <TruncatedText className="text-sm font-medium">{r.name}</TruncatedText>
            {r.dates && (
              <span className="text-xs tabular-nums whitespace-nowrap" style={{ color: 'var(--muted-foreground)' }}>
                {r.datesLabel}
              </span>
            )}
          </div>
        ),
      },
      {
        // 78, not 60: the header itself needs the room — at 60 it rendered
        // as a clipped "Student:".
        key: 'enrolled', label: 'Students', sortable: true, width: 78,
        // Catalog count cell — always muted: the count is context, and a
        // roster gap is announced by the Action column, not by this number.
        cell: r => <NumericCell value={r.enrolled} className="text-muted-foreground" />,
      },
      {
        // What's ALREADY out for this course — one block per pushed flow, so a
        // course being evaluated in separate flows (different evaluatees) shows
        // every prior run before the admin sets up the next one. The canonical
        // SurveyStatusBadge carries the lifecycle; the muted line under it
        // names WHO that flow evaluates (the course itself, or the instructor
        // by name). Badge and evaluatee STACK — inline, the badge left the
        // name ~60px and even "Course" clipped; stacking is the same pattern
        // the Faculty (name/role) and Evaluates cells already use.
        key: 'flows', label: 'Status', width: 124,
        cell: r => {
          if (r.flows.length === 0) {
            return (
              <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                Not pushed
              </span>
            )
          }
          // ONE badge per status run + an avatar RAIL for who's covered — the
          // DS cell vocabulary (status = ListHubStatusBadge, multiple people =
          // PeopleAvatarRailCell): stacked text lines under repeated badges
          // read as clutter and grew the row per flow. Book disc = the course
          // itself (same glyph as the Evaluates column); faces = instructors,
          // each with a name Tip; >3 tucks into the rail's own "+N" chip
          // (Romit, Jul 22: >2 stacked entries = overflow component).
          const groups: { status: PceSurvey['status']; flows: PceSurvey[] }[] = []
          for (const f of r.flows) {
            const g = groups[groups.length - 1]
            if (g && g.status === f.status) g.flows.push(f)
            else groups.push({ status: f.status, flows: [f] })
          }
          return (
            <div className="flex flex-col items-start gap-1.5 py-1" onClick={e => e.stopPropagation()}>
              {groups.map(g => {
                const hasCourse = g.flows.some(f => f.evalScope !== 'instructor')
                const seen = new Set<string>()
                const people: PersonStub[] = []
                for (const f of g.flows) {
                  if (f.evalScope === 'course') continue
                  for (const i of f.instructors) {
                    if (seen.has(i.name)) continue
                    seen.add(i.name)
                    people.push({ name: i.name, initials: i.initials, avatarUrl: i.avatarUrl })
                  }
                }
                return (
                  <span key={g.flows[0].id} className="flex flex-col items-start gap-1 min-w-0">
                    <SurveyStatusBadge status={g.status} />
                    <span className="flex items-center gap-1">
                      {hasCourse && (
                        <Tip side="top" label="Course evaluation">
                          <span
                            className="size-6 rounded-full flex items-center justify-center shrink-0"
                            style={{ background: 'var(--muted)' }}
                          >
                            <i
                              className="fa-light fa-book-open"
                              style={{ fontSize: 10, color: 'var(--muted-foreground)' }}
                              aria-hidden="true"
                            />
                          </span>
                        </Tip>
                      )}
                      {people.length > 0 && <PeopleAvatarRailCell people={people} visibleMax={3} overlap />}
                    </span>
                  </span>
                )
              })}
            </div>
          )
        },
      },
    ]
    // The row's survey template — placed right after the course identity (the
    // step's order IS the work order: pick courses → assign templates → fix
    // what validation flags), and ahead of the wide Faculty column so the
    // assignment control never hides behind the pinned Action column.
    // What the template evaluates rides UNDER the select as a muted subtitle,
    // not a sibling column (Romit, Jul 22 — supersedes the Jul 21 sibling
    // layout): the value is derived from the template, so a whole column
    // repeated one string 14× and made the table read packed.
    cols.push({
      key: 'template', label: 'Template', width: 208,
      cell: r => {
        const edited = !!r.templateId && r.templateId !== defaultAssignments[r.id]
        const unassigned = !r.templateId
        const evaluates = r.templateId ? (criteriaByTemplate.get(r.templateId) ?? []) : []
        const courseEval = evaluates.filter(c => CRITERION_GROUP[c] === 'Course')
        const facultyEval = evaluates.filter(c => CRITERION_GROUP[c] === 'Faculty')
        // "Course · 2 faculty roles" — the role names live in a Tip on the
        // faculty fragment (single role names itself; a count of one hides
        // information at no space saving).
        const facultyLabel = facultyEval.length === 1
          ? CRITERION_TOGGLE_LABEL[facultyEval[0]]
          : `${facultyEval.length} faculty roles`
        // Zero published templates = the select is a dead end (empty list).
        // No control at all — the CREATE action lives in the Action column
        // (it's an action; Romit, Jul 21), this cell just names the reason.
        if (publishedTemplates.length === 0) {
          return (
            <span className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
              No templates yet
            </span>
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
            {evaluates.length > 0 && (
              <span className="flex items-center gap-1 text-xs whitespace-nowrap" style={{ color: 'var(--muted-foreground)' }}>
                {courseEval.length > 0 && <span>Course</span>}
                {courseEval.length > 0 && facultyEval.length > 0 && <span aria-hidden="true">·</span>}
                {facultyEval.length > 1 ? (
                  <Tip
                    side="bottom"
                    label={
                      <span className="flex flex-col gap-0.5">
                        {facultyEval.map(c => <span key={c}>{CRITERION_TOGGLE_LABEL[c]}</span>)}
                      </span>
                    }
                  >
                    <span
                      tabIndex={0}
                      /* In the tab order (the Tip fires on focus) → needs a
                         visible focus indicator like any interactive surface. */
                      className="underline decoration-dotted underline-offset-2 cursor-default rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      {facultyLabel}
                    </span>
                  </Tip>
                ) : facultyEval.length === 1 ? (
                  <span>{facultyLabel}</span>
                ) : null}
              </span>
            )}
          </div>
        )
      },
    })
    // Faculty = an adjoined avatar cluster, identity only (Romit, Jul 22 —
    // supersedes the stacked name/role lines): who fills the evaluated roles
    // is glanceable as faces; name + role live in each face's Tip. One face
    // per PERSON (someone holding two roles appears once, Tip lists both).
    cols.push({
        key: 'faculty', label: 'Faculty', width: 96,
        cell: r => {
          const byPerson = new Map<string, string[]>()
          for (const c of FACULTY_CRITERIA) {
            const cell = r.cells[c]
            if (!cell) continue // role not evaluated by this row's template, or not applicable
            if (cell.ok && cell.value) {
              byPerson.set(cell.value, [...(byPerson.get(cell.value) ?? []), cell.label])
            }
          }
          if (byPerson.size === 0) {
            // Gaps are NOT restated here — the Action column already carries
            // "Add faculty" with the missing roles; twice per row was noise.
            return <span className="text-sm" style={{ color: 'var(--muted-foreground)' }}>—</span>
          }
          const stubs: PersonStub[] = [...byPerson].map(([name, roles]) => ({
            // The Tip renders this string — name + role(s), since neither is
            // on the surface anymore.
            name: `${name} · ${roles.join(' · ')}`,
            initials: initialsOf(name),
            avatarUrl: facultyAvatarUrl(name),
          }))
          return (
            <div className="py-1" onClick={e => e.stopPropagation()}>
              <PeopleAvatarRailCell people={stubs} visibleMax={3} overlap />
            </div>
          )
        },
    })
    cols.push(
      {
        key: 'typeLabel', label: 'Type', sortable: true, width: 82,
        filter: {
          type: 'select', icon: 'fa-shapes',
          options: [
            { value: 'Classroom based', label: 'Classroom based' },
            { value: 'Lab based', label: 'Lab based' },
            { value: 'Practice based', label: 'Practice based' },
          ],
        },
        // D5 (Romit, Jul 21): tinted categorical pill — soft chart-hue wash +
        // the matching --chip ink (the DS icon-disc pairing, AA-safe). Amber
        // (chart-4) is deliberately NOT in the map: it stays the warning hue.
        // Short display label ("Classroom", not "Classroom based");
        // sorting/filtering still ride the full typeLabel value.
        cell: r => {
          const tint = TYPE_PILL_TINT[r.deliveryMode]
          return (
            <span
              className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap"
              style={{ background: tint.bg, color: tint.fg }}
            >
              {r.typeLabel.replace(/ based$/, '')}
            </span>
          )
        },
      },
      {
        // What's needed to complete setup — one consolidated column, pinned right.
        key: 'actions', label: 'Action needed', width: 150, defaultPin: 'right', lockPin: true,
        cell: r => {
          // No template yet = nothing to validate against.
          // Catalog empty → the fix IS an action, so it renders here as a
          // real DS button (same anatomy as Add faculty/Add students) that
          // opens the in-step create flow: "Back to Courses" backtracks,
          // publish returns here and a lone template auto-assigns via the
          // type-default. Catalog non-empty → muted note; the Template
          // select carries the assign affordance (one signal per gap).
          if (!r.templateId) {
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
            return <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Assign a template</span>
          }
          const studentCell = r.cells.students
          const studentGap = !!studentCell && !studentCell.ok
          // Every missing person-role collapses into a single trip to Prism.
          // The exact roles behind the gap, so the generic CTA can still say WHICH.
          const facultyMissing = FACULTY_CRITERIA
            .filter(c => r.cells[c] && !r.cells[c]!.ok)
            .map(c => r.cells[c]!.label)
          if (!studentGap && facultyMissing.length === 0) {
            return <span className="text-sm" style={{ color: 'var(--muted-foreground)' }}>—</span>
          }
          // Buttons only (Romit, Jul 21) — no "Missing:" fact lines: the
          // button label names the missing data kind, the exact roles live in
          // the tooltip, and the amber group band already marks the row as
          // needing setup. The button chrome stays neutral DS.
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
