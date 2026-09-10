'use client'

/**
 * Term editor sheet — the single "add/edit term" surface for Course Eval,
 * shared by the dashboard's "Set up term" flow and Common Settings' Academic
 * Calendar tab (Romit, 2026-09-02: "I see two different designs for add
 * term... I want the designs to remain consistent" / "use the settings,
 * academic year sheet design and fields, replace the setup term sheet with
 * academic year sheet"). Previously the dashboard had its own 4-field
 * FloatingSheetPanel (free-text Term name) while Settings had this Season +
 * Academic year + date-range Sheet (the Aug 27 requirement-freeze spec) —
 * this file is that Settings version, extracted so both surfaces render the
 * exact same component instead of two hand-maintained lookalikes.
 */

import { useState } from 'react'
import {
  Button, Label,
  Select, SelectTrigger, SelectContent, SelectItem, SelectValue,
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter,
  DateRangePickerField,
} from '@exxatdesignux/ui'
import { AcademicYearField } from '@/components/pce/academic-year-field'
import type { ProgramTerm, TermSeason } from '@/lib/pce-mock-data'

// `react-day-picker` is a transitive dep of @exxatdesignux/ui, not hoisted into
// this app's node_modules under pnpm — a structural stand-in avoids the missing-
// module error while staying assignable to DateRangePickerField's real prop type.
type DateRange = { from: Date | undefined; to?: Date | undefined }

export const SEASONS: TermSeason[] = ['Spring', 'Summer', 'Fall']

/** Academic years already in use across the given terms, most recent first. */
export function existingAcademicYears(terms: ProgramTerm[]): string[] {
  return Array.from(new Set(terms.map((t) => t.academicYear).filter(Boolean))).sort((a, b) => b.localeCompare(a))
}


/** A not-yet-saved placeholder term — pass to `TermEditorSheet` to open it in
 *  create mode. The `new-` id prefix is how the sheet (and the caller's
 *  `onSave`) tells "create" apart from "editing an existing term". */
export function draftTerm(): ProgramTerm {
  return {
    id: `new-${Date.now()}`,
    name: '',
    season: 'Fall',
    academicYear: '',
    startDate: '',
    endDate: '',
    status: 'active',
    enabledForEval: true,
  }
}

export function TermEditorSheet({ term, existingYears, onClose, onSave }: {
  term: ProgramTerm | null; existingYears: string[]; onClose: () => void; onSave: (t: ProgramTerm) => void
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
      {/* No entrance transition (inline style beats the DS's `duration-300`
          slide-in class on specificity, no Tailwind-merge ambiguity) — the
          DS Sheet slides in via a CSS transform for ~300ms, and Radix Select
          computes this sheet's Academic year dropdown position once, at
          open, from the trigger's THEN-current rect. Opening it while the
          sheet is still sliding froze the popup at the trigger's mid-
          animation spot — intermittent depending on click timing (Romit,
          2026-09-02: "sometimes I can pick, sometimes I can't"). Killing the
          animation removes the race outright instead of patching around it. */}
      <SheetContent side="right" showOverlay={false} showCloseButton={false}
        style={{ transitionDuration: '0ms', animationDuration: '0ms' }}
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
            <AcademicYearField
              id="term-year"
              value={academicYear}
              onChange={setAcademicYear}
              existingYears={existingYears}
            />
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
