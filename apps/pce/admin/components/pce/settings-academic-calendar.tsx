'use client'

/**
 * Academic Calendar section of Central Settings.
 *  - Terms grouped by academic year (Accordion, most recent 2 years open).
 *  - Add/Edit a term in a DS Sheet — Season + Academic Year + a single
 *    date-range picker for the survey calendar window.
 *  - Status (Current / Upcoming / Past) is derived from today vs. the term's
 *    dates, not stored — avoids a second source of truth alongside the dates.
 */

import { useState } from 'react'
import {
  Button, Input, Label, Badge,
  Select, SelectTrigger, SelectContent, SelectItem, SelectValue,
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter,
  Accordion, AccordionItem, AccordionTrigger, AccordionContent,
  DateRangePickerField, FilterChipGroup,
  Tooltip, TooltipTrigger, TooltipContent,
} from '@exxatdesignux/ui'
import { MOCK_PROGRAM_TERMS, type ProgramTerm, type TermSeason } from '@/lib/pce-mock-data'

// `react-day-picker` is a transitive dep of @exxatdesignux/ui, not hoisted into
// this app's node_modules under pnpm — a structural stand-in avoids the missing-
// module error while staying assignable to DateRangePickerField's real prop type.
type DateRange = { from: Date | undefined; to?: Date | undefined }

const SEASONS: TermSeason[] = ['Spring', 'Summer', 'Fall']

type DisplayStatus = 'current' | 'upcoming' | 'past'
const STATUS_BADGE: Record<DisplayStatus, { label: string; variant: 'default' | 'secondary' | 'outline' }> = {
  current:  { label: 'Current',  variant: 'default' },
  upcoming: { label: 'Upcoming', variant: 'secondary' },
  past:     { label: 'Past',     variant: 'outline' },
}
function displayStatus(t: ProgramTerm, today: string): DisplayStatus {
  if (today < t.startDate) return 'upcoming'
  if (today > t.endDate) return 'past'
  return 'current'
}

function fmt(ymd: string) {
  const d = new Date(ymd + 'T00:00:00')
  return Number.isFinite(d.getTime())
    ? d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : ymd
}

function groupByYear(terms: ProgramTerm[]) {
  const map = new Map<string, ProgramTerm[]>()
  for (const t of terms) {
    if (!map.has(t.academicYear)) map.set(t.academicYear, [])
    map.get(t.academicYear)!.push(t)
  }
  return Array.from(map.entries())
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([year, ts]) => ({ year, terms: ts.slice().sort((a, b) => a.startDate.localeCompare(b.startDate)) }))
}

// ── Panel shell — same idiom as the sibling Communication section ──────────────
function Panel({ title, description, action, children }: {
  title: string; description?: string; action?: React.ReactNode; children: React.ReactNode
}) {
  return (
    <section className="flex flex-col gap-4 border-t border-border pt-6 first:border-0 first:pt-0">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <h2 className="text-sm font-semibold">{title}</h2>
          {description && <p className="text-xs text-muted-foreground leading-snug max-w-xl">{description}</p>}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
      <div className="flex flex-col">{children}</div>
    </section>
  )
}

// ── Term row ─────────────────────────────────────────────────────────────────
function TermRow({ t, today, onEdit }: { t: ProgramTerm; today: string; onEdit: () => void }) {
  const status = STATUS_BADGE[displayStatus(t, today)]
  return (
    <div className="flex items-center gap-3 px-2 py-3.5 border-b border-border last:border-0">
      <div className="flex size-8 items-center justify-center rounded-full bg-muted shrink-0">
        <i className="fa-light fa-calendar text-sm text-muted-foreground" aria-hidden="true" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium truncate">{t.name}</span>
          <Badge variant={status.variant} className="font-normal shrink-0">{status.label}</Badge>
        </div>
        <p className="text-xs text-muted-foreground truncate mt-1">{fmt(t.startDate)} – {fmt(t.endDate)}</p>
      </div>
      <div className="flex items-center shrink-0">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon-sm" aria-label="Edit" onClick={onEdit}>
              <i className="fa-light fa-pen text-sm" aria-hidden="true" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Edit</TooltipContent>
        </Tooltip>
      </div>
    </div>
  )
}

// ── Term editor sheet (DS sheet convention — mirrors TemplateEditorSheet) ──────
function TermEditorSheet({ term, onClose, onSave }: {
  term: ProgramTerm | null; onClose: () => void; onSave: (t: ProgramTerm) => void
}) {
  const [season, setSeason]             = useState<TermSeason>(term?.season ?? 'Fall')
  const [academicYear, setAcademicYear] = useState(term?.academicYear ?? '')
  const [range, setRange]               = useState<DateRange | undefined>(
    term?.startDate && term?.endDate
      ? { from: new Date(term.startDate + 'T00:00:00'), to: new Date(term.endDate + 'T00:00:00') }
      : undefined
  )
  const open  = term !== null
  const isNew = term?.id.startsWith('new-') ?? false
  const canSave = Boolean(academicYear.trim() && range?.from && range?.to)
  const thisYear = new Date().getFullYear()

  const handleSave = () => {
    if (!term || !range?.from || !range?.to) return
    const iso = (d: Date) => d.toISOString().slice(0, 10)
    onSave({
      ...term,
      season,
      academicYear: academicYear.trim(),
      name: `${season} ${range.from.getFullYear()}`,
      startDate: iso(range.from),
      endDate: iso(range.to),
      status: 'active',
      enabledForEval: true,
    })
  }

  return (
    <Sheet open={open} onOpenChange={(v) => { if (!v) onClose() }}>
      <SheetContent side="right" showOverlay={false} showCloseButton={false}
        className="w-full sm:max-w-[480px] flex flex-col gap-0 p-0">
        <SheetHeader className="px-6 pt-6 pb-4 border-b border-border">
          <SheetTitle className="text-base">{isNew ? 'Set up term' : 'Edit term'}</SheetTitle>
          <SheetDescription className="text-xs">
            {isNew ? 'Define a new academic term and its survey calendar window.' : 'Update this term’s academic year and survey calendar window.'}
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-auto px-6 py-5 flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="term-season" className="text-sm">Term</Label>
            <Select value={season} onValueChange={v => setSeason(v as TermSeason)}>
              <SelectTrigger id="term-season" className="text-sm" aria-label="Season"><SelectValue /></SelectTrigger>
              <SelectContent>{SEASONS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="term-year" className="text-sm">Academic year</Label>
            <Input id="term-year" value={academicYear} onChange={e => setAcademicYear(e.target.value)}
              className="text-sm" placeholder="e.g. 2026–2027" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="term-dates" className="text-sm">Term dates</Label>
            <DateRangePickerField
              value={range}
              onChange={setRange}
              id="term-dates"
              numberOfMonths={1}
              fromYear={thisYear - 2}
              toYear={thisYear + 5}
            />
          </div>
        </div>

        <SheetFooter className="px-6 py-4 border-t border-border flex-row justify-end gap-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button disabled={!canSave} onClick={handleSave}>Save term</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

// ── Section export ────────────────────────────────────────────────────────────
type StatusFilter = 'all' | DisplayStatus

export function AcademicCalendarSection() {
  const [terms, setTerms]   = useState<ProgramTerm[]>(MOCK_PROGRAM_TERMS)
  const [editing, setEditing] = useState<ProgramTerm | null>(null)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const today = new Date().toISOString().slice(0, 10)

  const allGroups = groupByYear(terms)
  const [openYears, setOpenYears] = useState<string[]>(() => allGroups.slice(0, 2).map(g => g.year))

  const filteredTerms = statusFilter === 'all' ? terms : terms.filter(t => displayStatus(t, today) === statusFilter)
  const groups = groupByYear(filteredTerms)
  // Filtering should reveal matches, not hide them behind a collapsed group —
  // union the user's manual open state with every group a filter surfaces.
  const accordionValue = statusFilter === 'all' ? openYears : Array.from(new Set([...openYears, ...groups.map(g => g.year)]))

  const counts = { current: 0, upcoming: 0, past: 0 }
  for (const t of terms) counts[displayStatus(t, today)]++
  const FILTER_OPTIONS = [
    { value: 'all' as const, label: 'All', count: terms.length },
    { value: 'current' as const, label: 'Current', count: counts.current },
    { value: 'upcoming' as const, label: 'Upcoming', count: counts.upcoming },
    { value: 'past' as const, label: 'Past', count: counts.past },
  ]

  const startNew = () => setEditing({
    id: `new-${terms.length + 1}`, name: '', season: 'Fall', academicYear: '',
    startDate: '', endDate: '', status: 'active', enabledForEval: true,
  })
  const saveEdit = (t: ProgramTerm) => {
    setTerms(prev => prev.some(x => x.id === t.id) ? prev.map(x => x.id === t.id ? t : x) : [...prev, t])
    setEditing(null)
    setOpenYears(prev => prev.includes(t.academicYear) ? prev : [...prev, t.academicYear])
  }

  return (
    <div className="flex flex-col gap-4">
      <Panel
        title="Academic Calendar"
        description="Terms available for scheduling course evaluations."
        action={<Button variant="default" size="sm" onClick={startNew}>
          <i className="fa-light fa-plus" aria-hidden="true" />Add term
        </Button>}
      >
        <FilterChipGroup
          value={statusFilter}
          onValueChange={setStatusFilter}
          options={FILTER_OPTIONS}
          variant="muted"
          size="sm"
          aria-label="Filter terms by status"
          className="mb-1"
        />
        {groups.length > 0 ? (
          <Accordion type="multiple" value={accordionValue} onValueChange={setOpenYears} className="flex flex-col">
            {groups.map(g => {
              const hasCurrent = g.terms.some(t => displayStatus(t, today) === 'current')
              return (
                <AccordionItem key={g.year} value={g.year} className="border-b border-border last:border-0">
                  <AccordionTrigger className="hover:no-underline py-3">
                    <span className="flex items-center gap-2">
                      <span className="text-sm font-medium">{g.year} Academic Year</span>
                      <Badge variant="secondary" className="font-normal">
                        {g.terms.length} term{g.terms.length !== 1 ? 's' : ''}
                      </Badge>
                      {hasCurrent && <Badge variant="default" className="font-normal">Current</Badge>}
                    </span>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="flex flex-col pl-2">
                      {g.terms.map(t => (
                        <TermRow key={t.id} t={t} today={today} onEdit={() => setEditing(t)} />
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              )
            })}
          </Accordion>
        ) : (
          <p className="text-sm text-muted-foreground py-6 text-center">
            {terms.length === 0
              ? 'No terms set up yet.'
              : `No ${STATUS_BADGE[statusFilter as DisplayStatus]?.label.toLowerCase() ?? statusFilter} terms.`}
          </p>
        )}
      </Panel>

      <TermEditorSheet key={editing?.id ?? 'new'} term={editing} onClose={() => setEditing(null)} onSave={saveEdit} />
    </div>
  )
}
