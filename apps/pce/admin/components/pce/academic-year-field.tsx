'use client'

/**
 * Academic year picker — a `Select` of academic years already in use
 * (derived from existing terms) plus an "Add new academic year" option that
 * reveals a free-text input. Replaces a plain free-text Input across all
 * three term-creation surfaces (dashboard AddTermDrawer/AddTermDatesDrawer,
 * Common Settings' Academic Calendar TermEditorSheet) — Romit, 2026-09-01:
 * "The academic year needs to be a dropdown, and if the academic year is
 * not there, then I can add a new academic year." Mirrors the Aug 27
 * Faculty-Roles picker's "existing options + create" shape, sized down to a
 * plain Select since the option count here is small (a handful of years),
 * not the ~40-role list that justified a searchable Popover+Command there.
 */

import { useState } from 'react'
import {
  Input,
  Select, SelectTrigger, SelectContent, SelectItem, SelectValue, SelectSeparator,
} from '@exxatdesignux/ui'

const ADD_NEW_VALUE = '__add_new_academic_year__'

/** Fallback options for a brand-new tenant with no terms yet — otherwise the
 *  dropdown has nothing to offer but "Add new academic year", forcing every
 *  first-time admin to hand-type a year (Romit, 2026-09-02: "show more
 *  options in academic year"). Centered on the current academic year
 *  (Aug–Jul cycle), most recent first — matches the descending order real
 *  terms produce once they exist. */
function suggestedAcademicYears(count = 3): string[] {
  const now = new Date()
  const startYear = now.getMonth() >= 7 ? now.getFullYear() : now.getFullYear() - 1
  return Array.from({ length: count }, (_, i) => {
    const y = startYear + 1 - i
    return `${y}–${y + 1}`
  })
}

export function AcademicYearField({
  id,
  value,
  onChange,
  existingYears,
  error,
  triggerAriaInvalid,
  describedById,
}: {
  id: string
  value: string
  onChange: (value: string) => void
  /** Academic years already in use, most recent first. */
  existingYears: string[]
  error?: string
  triggerAriaInvalid?: boolean
  describedById?: string
}) {
  /** True once "Add new academic year" is picked, until a real year is
   *  chosen again — independent of `value` so the newly-typed year (which
   *  won't match any `existingYears` entry) doesn't fall back out of the
   *  input mid-type. */
  const [addingNew, setAddingNew] = useState(() => value.length > 0 && !existingYears.includes(value))
  const yearOptions = existingYears.length > 0 ? existingYears : suggestedAcademicYears()

  function handleSelect(next: string) {
    if (next === ADD_NEW_VALUE) {
      setAddingNew(true)
      onChange('')
    } else {
      setAddingNew(false)
      onChange(next)
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <Select value={addingNew ? ADD_NEW_VALUE : value || undefined} onValueChange={handleSelect}>
        <SelectTrigger id={id} aria-invalid={triggerAriaInvalid} aria-describedby={describedById}>
          <SelectValue placeholder="Select academic year" />
        </SelectTrigger>
        {/* z-[90] — this field is used inside a Sheet, whose own content
            surface is z-50+ (components/ui/sheet.tsx) and can otherwise
            paint over this popover. DS SelectContent defaults to `z-50`;
            without this override the list opens (correct ARIA state,
            correct DOM) but can render BEHIND the sheet — invisible.
            position="popper" anchors below the trigger instead of the DS
            default `item-aligned` (which re-aligns to the previously
            selected item, an extra layout pass that isn't needed here). */}
        <SelectContent position="popper" className="z-[90]">
          {yearOptions.map(year => (
            <SelectItem key={year} value={year}>{year}</SelectItem>
          ))}
          {yearOptions.length > 0 && <SelectSeparator />}
          <SelectItem value={ADD_NEW_VALUE}>
            <i className="fa-light fa-plus" aria-hidden="true" style={{ fontSize: 11 }} />
            Add new academic year
          </SelectItem>
        </SelectContent>
      </Select>
      {addingNew && (
        <Input
          autoFocus
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder="e.g., 2026–2027"
          aria-label="New academic year"
          aria-invalid={!!error}
          aria-describedby={describedById}
        />
      )}
    </div>
  )
}
