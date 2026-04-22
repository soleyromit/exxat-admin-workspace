"use client"

import * as React from "react"
import { Calendar } from "@/components/ui/calendar"
import { localDateToYmd, ymdToLocalDate } from "@/lib/date-filter"

/** Single-date calendar for table filters (YYYY-MM-DD). */
export function FilterDateCalendar({
  valueYmd,
  onChangeYmd,
  label,
}: {
  valueYmd: string | undefined
  onChangeYmd: (ymd: string | undefined) => void
  label: string
}) {
  const [timeZone, setTimeZone] = React.useState<string | undefined>()
  React.useEffect(() => {
    setTimeZone(Intl.DateTimeFormat().resolvedOptions().timeZone)
  }, [])

  return (
    <div
      className="rounded-lg border border-border overflow-hidden"
      role="group"
      aria-label={label}
    >
      <Calendar
        mode="single"
        selected={ymdToLocalDate(valueYmd)}
        onSelect={(d) => onChangeYmd(d ? localDateToYmd(d) : undefined)}
        captionLayout="dropdown"
        timeZone={timeZone}
        className="rounded-lg border-0"
      />
    </div>
  )
}
