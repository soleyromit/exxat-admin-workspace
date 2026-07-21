'use client'

import { useMemo, useEffect, useRef, useState } from 'react'
import {
  Select, SelectTrigger, SelectContent, SelectItem, SelectValue,
  Badge, Skeleton, Button, InputGroup, Tip, LocalBanner,
  Popover, PopoverTrigger, PopoverContent, PopoverAnchor,
  Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem, CommandSeparator,
} from '@exxatdesignux/ui'
import { NumericCell } from '@/components/data-views/table-cells'
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
  COURSE_TYPE_FULL_LABEL,
} from '@/lib/pce-mock-data'
import { TERM_SEASONS, academicYearOptions } from '@/lib/pce-course-scope'
import {
  type Criterion, type CellReadiness,
  CRITERION_TOGGLE_LABEL,
  FACULTY_CRITERIA, deriveReadiness, prismAddFacultyHref, templateCriteria,
} from '@/lib/pce-course-readiness'
import { courseDates } from '@/lib/pce-push-validation'

/** Above this count a picker gains a search field. */
const COHORT_SEARCH_THRESHOLD = 8

/** Evaluates chips shown in the cell before the rest collapse into "+N"
 *  (popover with the full set). */
const MAX_EVALUATE_CHIPS = 2

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

  // WHAT each course must have comes from ITS template, not a wizard-level
  // "what to evaluate" picker: criteria per row = the assigned template's
  // sections/role sets, so validation follows the assignment cell by cell.
  const criteriaByTemplate = useMemo(() => {
    const m = new Map<string, Criterion[]>()
    for (const t of publishedTemplates) m.set(t.id, templateCriteria(t))
    return m
  }, [publishedTemplates])

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
          const rowCriteria = templateId ? (criteriaByTemplate.get(templateId) ?? []) : []
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
          }
        })
        .sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true })),
    [scoped, templateAssignments, defaultAssignments, criteriaByTemplate],
  )

  const columns = useMemo<ColumnDef<ReadinessRow>[]>(() => {
    const cols: ColumnDef<ReadinessRow>[] = [
      { key: 'select', label: '', width: 40, defaultPin: 'left', lockPin: true },
      {
        // Identity is ONE pinned column. Code LEADS the line: programs talk in
        // codes ("DPT-502"), and the fixed-width mono token keeps rows aligned
        // while the name truncates behind it. Sort follows the code (key).
        key: 'code', label: 'Course', sortable: true, width: 225, defaultPin: 'left',
        cell: r => (
          /* Three quiet lines — code, name, dates — instead of a Dates column:
             the no-scroll width budget has no room for one, and the two-line
             Faculty/Template cells already set the row height, so the third
             line costs nothing. */
          <div className="flex flex-col py-0.5 min-w-0">
            <span className="font-mono text-xs font-semibold tabular-nums">{r.code}</span>
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
        key: 'enrolled', label: 'Students', sortable: true, width: 60,
        // Catalog count cell — always muted: the count is context, and a
        // roster gap is announced by the Action column, not by this number.
        cell: r => <NumericCell value={r.enrolled} className="text-muted-foreground" />,
      },
    ]
    // The row's survey template — placed right after the course identity (the
    // step's order IS the work order: pick courses → assign templates → fix
    // what validation flags), and ahead of the wide Faculty column so the
    // assignment control never hides behind the pinned Action column.
    // Template select and its consequence are SIBLING columns: the chips under
    // the dropdown crowded it, and the per-row "Evaluates" word repeated 14
    // times — as a column, the header says it once and the select stays a
    // single calm line.
    cols.push({
      key: 'template', label: 'Template', width: 220,
      cell: r => {
        const edited = !!r.templateId && r.templateId !== defaultAssignments[r.id]
        const unassigned = !r.templateId
        return (
          <div onClick={e => e.stopPropagation()}>
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
                className={unassigned ? 'w-fit min-w-0' : `w-full min-w-0 ${edited ? 'bg-secondary' : ''}`}
                style={{
                  height: 32, fontSize: 13,
                  ...(unassigned ? {
                    border: 'none', boxShadow: 'none', paddingInline: 12,
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
    cols.push({
      key: 'evaluates', label: 'Evaluates', width: 140,
      cell: r => {
        const evaluates = r.templateId ? (criteriaByTemplate.get(r.templateId) ?? []) : []
        if (evaluates.length === 0) {
          return <span className="text-sm" style={{ color: 'var(--muted-foreground)' }}>—</span>
        }
        const chip = (c: Criterion) => (
          <Badge key={c} variant="outline" className="rounded-full font-normal px-1.5 py-0 text-xs">
            {CRITERION_TOGGLE_LABEL[c]}
          </Badge>
        )
        const shown = evaluates.slice(0, MAX_EVALUATE_CHIPS)
        const extra = evaluates.length - shown.length
        return (
          /* Same token vocabulary as the old "What to evaluate" field —
             chips scan across rows; differences pop when templates diverge.
             Beyond two, the rest live in a popover: a template evaluating five
             roles would stack the row five chips tall. */
          <span className="flex flex-wrap items-center gap-1 py-0.5" onClick={e => e.stopPropagation()}>
            {shown.map(chip)}
            {extra > 0 && (
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="xs"
                    className="h-auto rounded-full px-1.5 py-0 text-xs font-normal"
                    aria-label={`${extra} more evaluated role${extra === 1 ? '' : 's'}`}
                  >
                    +{extra}
                  </Button>
                </PopoverTrigger>
                <PopoverContent aria-label="Evaluated roles" align="start" className="w-auto p-2.5" style={{ maxWidth: 240 }}>
                  <div className="flex flex-col gap-1.5">
                    <span className="text-xs font-medium">Evaluates</span>
                    <span className="flex flex-wrap gap-1">{evaluates.map(chip)}</span>
                  </div>
                </PopoverContent>
              </Popover>
            )}
          </span>
        )
      },
    })
    // One Faculty column for every person-role the ROW's template evaluates,
    // not a column each: the header stays generic while each line names its own
    // type-aware role ("Lab Instructor"), so the table width is independent of
    // how many roles a template evaluates. r.cells only contains the row's
    // template criteria, so the cell is per-row by construction.
    cols.push({
        key: 'faculty', label: 'Faculty', width: 190,
        cell: r => {
          // One line per PERSON, not per role. A line per role repeated
          // "— not assigned" once for every gap, printed the same human twice
          // when they hold two roles, and grew the row to five lines — the
          // absences shouted louder than the people who actually exist.
          const byPerson = new Map<string, string[]>()
          for (const c of FACULTY_CRITERIA) {
            const cell = r.cells[c]
            if (!cell) continue // role not evaluated by this row's template, or not applicable
            if (cell.ok && cell.value) {
              byPerson.set(cell.value, [...(byPerson.get(cell.value) ?? []), cell.label])
            }
          }
          const people = [...byPerson]
          const shown = people.slice(0, 2)
          const more = people.length - shown.length
          if (people.length === 0) {
            // Gaps are NOT restated here — the Action column already carries
            // "Add faculty" with the missing roles; twice per row was noise.
            return <span className="text-sm" style={{ color: 'var(--muted-foreground)' }}>—</span>
          }
          const personLine = ([name, roles]: [string, string[]]) => (
            /* Shared PersonAvatar (photo → initials fallback). Name and role
               STACK (person-cell pattern) — side by side, a long role squeezed
               the name into "Dr. Kevin …". Clipped text goes through
               TruncatedText, which tooltips on hover AND keyboard focus. */
            <span key={name} className="flex items-center gap-1.5 min-w-0">
              <PersonAvatar name={name} />
              <span className="flex flex-col min-w-0">
                <TruncatedText className="text-sm font-medium">{name}</TruncatedText>
                <TruncatedText className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                  {roles.join(' · ')}
                </TruncatedText>
              </span>
            </span>
          )
          return (
            <div className="flex flex-col gap-1 py-1" onClick={e => e.stopPropagation()}>
              {shown.map(personLine)}
              {/* Same overflow pattern as the Evaluates column: the tail lives
                  in a popover instead of growing the row a line per person. */}
              {more > 0 && (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      size="xs"
                      className="h-auto w-fit rounded-full px-1.5 py-0 text-xs font-normal"
                      aria-label={`${more} more faculty`}
                    >
                      +{more} more
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent aria-label="All faculty on this course" align="start" className="w-auto p-2.5" style={{ maxWidth: 260 }}>
                    <div className="flex flex-col gap-2">{people.map(personLine)}</div>
                  </PopoverContent>
                </Popover>
              )}
            </div>
          )
        },
    })
    cols.push(
      {
        key: 'typeLabel', label: 'Type', sortable: true, width: 100,
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
        key: 'actions', label: 'Action needed', width: 176, defaultPin: 'right', lockPin: true,
        cell: r => {
          // No template yet = nothing to validate against. Stays MUTED on
          // purpose: the Template control itself carries the amber signal for
          // this gap, and one signal per gap keeps the two attention columns
          // from shouting about the same thing twice in one row.
          if (!r.templateId) {
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
             the data rows stay clean. AA-safe DS pairing: icon-disc wash bg
             + the matching --chip ink (warning-fg on warning-bg fails at
             4.23:1; chip inks are darker and clear 4.5 comfortably). */
          groupHeaderStyles={{
            gap: { background: 'var(--icon-disc-chart-4-bg)', color: 'var(--chip-4)' },
            ready: { background: 'var(--icon-disc-chart-2-bg)', color: 'var(--chip-2)' },
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
