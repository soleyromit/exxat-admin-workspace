"use client"

import * as React from "react"

import { cn } from "../../lib/utils"
import { formatDateUS } from "../../lib/date-filter"
import { Button } from "./button"
import { Calendar } from "./calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "./popover"

export interface DatePickerFieldProps {
  value: Date | undefined
  onChange: (d: Date | undefined) => void
  id?: string
  disabled?: boolean
  /** Passed to the trigger `Button` (e.g. `h-8 text-sm` in compact drawers). */
  triggerClassName?: string
  fromYear?: number
  toYear?: number
}

/**
 * Calendar + popover trigger — same pattern as New Placement schedule dates (WCAG: button exposes label, not raw text input).
 */
export function DatePickerField({
  value,
  onChange,
  id,
  disabled,
  triggerClassName,
  fromYear = 2020,
  toYear = 2032,
}: DatePickerFieldProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          disabled={disabled}
          className={cn(
            "w-full justify-start text-left font-normal",
            triggerClassName,
          )}
          aria-label={value ? formatDateUS(value.toISOString()) : "Pick a date"}
        >
          <i className="fa-light fa-calendar mr-2 text-muted-foreground shrink-0" aria-hidden="true" />
          <span className={cn(!value && "text-muted-foreground")}>
            {value ? formatDateUS(value.toISOString()) : "MM/DD/YYYY"}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={value}
          onSelect={onChange}
          initialFocus
          fromYear={fromYear}
          toYear={toYear}
          captionLayout="dropdown"
        />
      </PopoverContent>
    </Popover>
  )
}
