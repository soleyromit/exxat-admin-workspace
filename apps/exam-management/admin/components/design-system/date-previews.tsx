"use client"

import * as React from "react"
import type { DateRange } from "react-day-picker"

import { Calendar } from "@/components/ui/calendar"
import {
  DatePickerField,
  DateRangePickerField,
  DateTextInputField,
} from "@/components/ui/date-picker-field"
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field"

export function CalendarPreview() {
  const [date, setDate] = React.useState<Date | undefined>(new Date())
  return (
    <Calendar mode="single" selected={date} onSelect={setDate} className="rounded-md border" />
  )
}

export function DatePickerPreview() {
  const [date, setDate] = React.useState<Date | undefined>(new Date())
  return (
    <Field orientation="vertical">
      <FieldLabel htmlFor="ds-date">Due date</FieldLabel>
      <DatePickerField id="ds-date" value={date} onChange={setDate} />
      <FieldDescription>MM/DD/YYYY — same field chrome as Select; calendar icon trailing.</FieldDescription>
    </Field>
  )
}

export function DateRangePickerPreview() {
  const [range, setRange] = React.useState<DateRange | undefined>({
    from: new Date(),
    to: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  })
  return (
    <Field orientation="vertical">
      <FieldLabel htmlFor="ds-range">Rotation window</FieldLabel>
      <DateRangePickerField id="ds-range" value={range} onChange={setRange} numberOfMonths={1} />
      <FieldDescription>Range popover with shared field trigger.</FieldDescription>
    </Field>
  )
}

export function DateTextInputPreview() {
  const [value, setValue] = React.useState("06/24/2026")
  return (
    <Field orientation="vertical">
      <FieldLabel htmlFor="ds-date-text">Screening date</FieldLabel>
      <DateTextInputField
        id="ds-date-text"
        aria-label="Screening date"
        value={value}
        onValueChange={setValue}
      />
      <FieldDescription>Masked input + calendar icon (hub filters).</FieldDescription>
    </Field>
  )
}
