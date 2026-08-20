'use client'

import { useState } from 'react'
import {
  Input,
  Field, FieldLabel, FieldGroup, FieldDescription, FieldError,
  LocalBanner,
  DateRangePickerField,
} from '@exxatdesignux/ui'
import {
  FloatingSheetPanel, FloatingSheetPanelBody, FloatingSheetPanelContent,
  FloatingSheetPanelHeader, FloatingSheetPanelWorkflowFooter,
} from '@/lib/floating-sheet-panel'
import { usePce } from '@/components/pce/pce-state'
import type { ProgramTerm, TermSeason } from '@/lib/pce-mock-data'

/** Derive the season half of a term from its name (e.g. "Spring 2026" → Spring). */
function seasonFromName(name: string): TermSeason {
  if (/spring/i.test(name)) return 'Spring'
  if (/summer/i.test(name)) return 'Summer'
  return 'Fall'
}

function ymdToDate(ymd: string): Date | undefined {
  if (!ymd) return undefined
  const [y, m, d] = ymd.split('-').map(Number)
  if (!y || !m || !d) return undefined
  return new Date(y, m - 1, d)
}
function dateToYmd(d: Date | undefined): string {
  if (!d) return ''
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/**
 * Aug 18 ask (Granola 421b0a20, Vishal), corrected to a FloatingSheetPanel
 * per Romit's follow-up (2026-08-18) — adding a term from the dashboard
 * used to navigate away to the full term-setup wizard just to collect four
 * fields, breaking the admin's flow. Same fields/validation as Directory >
 * Terms' own "Add term" dialog (app/(app)/directory/term/page.tsx), shown
 * as a drawer instead so the dashboard stays visible behind it. Never the
 * raw Sheet primitive (exxat-overlays: FloatingSheetPanel only).
 * Writes straight into the shared `usePce()` term list so the new term's
 * card appears on the dashboard immediately, no navigation required.
 */
export function AddTermDrawer({ open, onOpenChange }: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { addProgramTerm } = usePce()
  const [draft, setDraft] = useState({ name: '', academicYear: '', startDate: '', endDate: '' })
  const [errors, setErrors] = useState<Record<string, string>>({})

  function validate(): Record<string, string> {
    const next: Record<string, string> = {}
    if (!draft.name.trim()) next.name = 'Term name is required.'
    if (!draft.academicYear.trim()) next.academicYear = 'Academic year is required.'
    else if (!/^\d{4}\s*[–-]\s*\d{4}$/.test(draft.academicYear.trim())) {
      next.academicYear = 'Use the format YYYY–YYYY (e.g., 2026–2027).'
    }
    if (!draft.startDate) next.startDate = 'Start date is required.'
    if (!draft.endDate) next.endDate = 'End date is required.'
    if (draft.startDate && draft.endDate && draft.startDate >= draft.endDate) {
      next.endDate = 'End date must come after start date.'
    }
    return next
  }

  function commit() {
    const next = validate()
    setErrors(next)
    if (Object.keys(next).length > 0) return
    addProgramTerm({
      id: `pt${Date.now()}`,
      name: draft.name.trim(),
      season: seasonFromName(draft.name),
      academicYear: draft.academicYear.trim(),
      startDate: draft.startDate,
      endDate: draft.endDate,
      status: 'active',
      // Created from the dashboard to start collecting evaluations, unlike
      // Directory's standalone calendar entry — on immediately, no separate
      // "enable" toggle needed.
      enabledForEval: true,
    })
    setDraft({ name: '', academicYear: '', startDate: '', endDate: '' })
    setErrors({})
    onOpenChange(false)
  }

  function handleOpenChange(next: boolean) {
    onOpenChange(next)
    if (!next) setErrors({})
  }

  return (
    <FloatingSheetPanel open={open} onOpenChange={handleOpenChange}>
      <FloatingSheetPanelContent contentSlot="add-term-drawer">
        <FloatingSheetPanelHeader
          title="Add term"
          description="Set start and end dates. The end date anchors all reminder schedules for this term."
          onClose={() => handleOpenChange(false)}
        />

        <form
          id="add-term-form"
          className="flex min-h-0 flex-1 flex-col"
          onSubmit={event => { event.preventDefault(); commit() }}
        >
          <FloatingSheetPanelBody className="gap-4 px-4 pb-4">
            {Object.keys(errors).length > 1 && (
              <LocalBanner variant="error" title="Fix the following before saving">
                {Object.keys(errors).length} fields need attention.
              </LocalBanner>
            )}

            <FieldGroup>
              <Field orientation="vertical">
                <FieldLabel htmlFor="dash-term-name">Term *</FieldLabel>
                <Input
                  id="dash-term-name"
                  placeholder="e.g., Spring 2027"
                  value={draft.name}
                  onChange={e => setDraft({ ...draft, name: e.target.value })}
                  aria-required="true"
                  aria-invalid={!!errors.name}
                  aria-describedby={errors.name ? 'dash-term-name-error' : undefined}
                />
                {errors.name && <FieldError id="dash-term-name-error">{errors.name}</FieldError>}
              </Field>
              <Field orientation="vertical">
                <FieldLabel htmlFor="dash-term-year">Academic year *</FieldLabel>
                <Input
                  id="dash-term-year"
                  placeholder="e.g., 2026–2027"
                  value={draft.academicYear}
                  onChange={e => setDraft({ ...draft, academicYear: e.target.value })}
                  aria-required="true"
                  aria-invalid={!!errors.academicYear}
                  aria-describedby={errors.academicYear ? 'dash-term-year-error' : 'dash-term-year-desc'}
                />
                {errors.academicYear ? (
                  <FieldError id="dash-term-year-error">{errors.academicYear}</FieldError>
                ) : (
                  <FieldDescription id="dash-term-year-desc">Format: YYYY–YYYY (e.g., 2026–2027).</FieldDescription>
                )}
              </Field>
              <Field orientation="vertical">
                <FieldLabel htmlFor="dash-term-dates">Term dates *</FieldLabel>
                <DateRangePickerField
                  id="dash-term-dates"
                  value={{ from: ymdToDate(draft.startDate), to: ymdToDate(draft.endDate) }}
                  onChange={range => setDraft({ ...draft, startDate: dateToYmd(range?.from), endDate: dateToYmd(range?.to) })}
                  numberOfMonths={1}
                />
                {(errors.startDate || errors.endDate) && (
                  <FieldError id="dash-term-dates-error">{errors.startDate || errors.endDate}</FieldError>
                )}
              </Field>
            </FieldGroup>
          </FloatingSheetPanelBody>

          <FloatingSheetPanelWorkflowFooter
            onCancel={() => handleOpenChange(false)}
            primaryLabel="Add term"
            primaryForm="add-term-form"
            onPrimary={commit}
            primaryIconClassName="fa-light fa-calendar-plus text-xs"
          />
        </form>
      </FloatingSheetPanelContent>
    </FloatingSheetPanel>
  )
}

/**
 * Aug 18 ask (Granola 421b0a20, Vishal) — same fix as AddTermDrawer, for the
 * "term already exists, just needs dates" case (UpcomingTermCard's !dated
 * branch). Same four fields as Directory's "Add term" dialog (Romit,
 * 2026-08-18: don't drop Term/Academic year just because the row already
 * exists) — pre-filled from the existing term and still editable, since a
 * Prism-synced term's name can be wrong or need adjusting same as any other
 * field here. PATCHES the existing term via updateProgramTerm rather than
 * creating a new one.
 */
export function AddTermDatesDrawer({ term, open, onOpenChange }: {
  term: ProgramTerm
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { updateProgramTerm } = usePce()
  const [draft, setDraft] = useState({
    name: term.name, academicYear: term.academicYear, startDate: '', endDate: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  function validate(): Record<string, string> {
    const next: Record<string, string> = {}
    if (!draft.name.trim()) next.name = 'Term name is required.'
    if (!draft.academicYear.trim()) next.academicYear = 'Academic year is required.'
    else if (!/^\d{4}\s*[–-]\s*\d{4}$/.test(draft.academicYear.trim())) {
      next.academicYear = 'Use the format YYYY–YYYY (e.g., 2026–2027).'
    }
    if (!draft.startDate) next.startDate = 'Start date is required.'
    if (!draft.endDate) next.endDate = 'End date is required.'
    if (draft.startDate && draft.endDate && draft.startDate >= draft.endDate) {
      next.endDate = 'End date must come after start date.'
    }
    return next
  }

  function commit() {
    const next = validate()
    setErrors(next)
    if (Object.keys(next).length > 0) return
    updateProgramTerm(term.id, {
      name: draft.name.trim(),
      season: seasonFromName(draft.name),
      academicYear: draft.academicYear.trim(),
      startDate: draft.startDate,
      endDate: draft.endDate,
    })
    setErrors({})
    onOpenChange(false)
  }

  function handleOpenChange(next: boolean) {
    onOpenChange(next)
    if (next) setDraft({ name: term.name, academicYear: term.academicYear, startDate: '', endDate: '' })
    else setErrors({})
  }

  return (
    <FloatingSheetPanel open={open} onOpenChange={handleOpenChange}>
      <FloatingSheetPanelContent contentSlot="add-term-dates-drawer">
        <FloatingSheetPanelHeader
          title="Add term dates"
          description="Set start and end dates. The end date anchors all reminder schedules for this term."
          onClose={() => handleOpenChange(false)}
        />

        <form
          id="add-term-dates-form"
          className="flex min-h-0 flex-1 flex-col"
          onSubmit={event => { event.preventDefault(); commit() }}
        >
          <FloatingSheetPanelBody className="gap-4 px-4 pb-4">
            {Object.keys(errors).length > 1 && (
              <LocalBanner variant="error" title="Fix the following before saving">
                {Object.keys(errors).length} fields need attention.
              </LocalBanner>
            )}

            <FieldGroup>
              <Field orientation="vertical">
                <FieldLabel htmlFor="dash-dates-name">Term *</FieldLabel>
                <Input
                  id="dash-dates-name"
                  placeholder="e.g., Spring 2027"
                  value={draft.name}
                  onChange={e => setDraft({ ...draft, name: e.target.value })}
                  aria-required="true"
                  aria-invalid={!!errors.name}
                  aria-describedby={errors.name ? 'dash-dates-name-error' : undefined}
                />
                {errors.name && <FieldError id="dash-dates-name-error">{errors.name}</FieldError>}
              </Field>
              <Field orientation="vertical">
                <FieldLabel htmlFor="dash-dates-year">Academic year *</FieldLabel>
                <Input
                  id="dash-dates-year"
                  placeholder="e.g., 2026–2027"
                  value={draft.academicYear}
                  onChange={e => setDraft({ ...draft, academicYear: e.target.value })}
                  aria-required="true"
                  aria-invalid={!!errors.academicYear}
                  aria-describedby={errors.academicYear ? 'dash-dates-year-error' : 'dash-dates-year-desc'}
                />
                {errors.academicYear ? (
                  <FieldError id="dash-dates-year-error">{errors.academicYear}</FieldError>
                ) : (
                  <FieldDescription id="dash-dates-year-desc">Format: YYYY–YYYY (e.g., 2026–2027).</FieldDescription>
                )}
              </Field>
              <Field orientation="vertical">
                <FieldLabel htmlFor="dash-dates-dates">Term dates *</FieldLabel>
                <DateRangePickerField
                  id="dash-dates-dates"
                  value={{ from: ymdToDate(draft.startDate), to: ymdToDate(draft.endDate) }}
                  onChange={range => setDraft({ ...draft, startDate: dateToYmd(range?.from), endDate: dateToYmd(range?.to) })}
                  numberOfMonths={1}
                />
                {(errors.startDate || errors.endDate) && (
                  <FieldError id="dash-dates-dates-error">{errors.startDate || errors.endDate}</FieldError>
                )}
              </Field>
            </FieldGroup>
          </FloatingSheetPanelBody>

          <FloatingSheetPanelWorkflowFooter
            onCancel={() => handleOpenChange(false)}
            primaryLabel="Add term dates"
            primaryForm="add-term-dates-form"
            onPrimary={commit}
            primaryIconClassName="fa-light fa-calendar-plus text-xs"
          />
        </form>
      </FloatingSheetPanelContent>
    </FloatingSheetPanel>
  )
}
