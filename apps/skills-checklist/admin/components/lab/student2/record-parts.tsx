"use client"

/**
 * Record pieces: the result word (glyph + word + colour; amber only for "Did not count" and "Returned"), three figures that are
 * also filters, and one filter row (search, result, setting, course) [REQ SH-01..SH-07]. Compact 32 px controls, one row.
 */
import * as React from "react"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import { Input } from "@exxatdesignux/ui/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@exxatdesignux/ui/components/ui/select"
import { cn } from "@exxatdesignux/ui/lib/utils"
import { VIZ } from "@/components/lab/viz"
import { fmt } from "@/lib/v2/format"
import { skillNounPlural } from "@/lib/lab/terms"
import { RESULT_WORD, type RecordFilter, type RecordResult } from "@/lib/lab/student2"

const GLYPH: Record<RecordResult, { icon: string; color: string }> = {
  counted: { icon: "fa-solid fa-circle-check", color: "var(--foreground)" },
  "not-counted": { icon: "fa-solid fa-triangle-exclamation", color: VIZ.behindInk },
  waiting: { icon: "fa-light fa-clock", color: "var(--muted-foreground)" },
  returned: { icon: "fa-solid fa-rotate-left", color: VIZ.behindInk },
  sent: { icon: "fa-light fa-paper-plane", color: "var(--muted-foreground)" },
}

export function ResultLabel({ result, className }: { result: RecordResult; className?: string }) {
  const g = GLYPH[result]
  const amber = result === "not-counted" || result === "returned"
  return (
    <span className={cn("inline-flex items-center gap-1.5 whitespace-nowrap text-sm", amber ? "font-medium" : "", className)} style={amber ? { color: VIZ.behindInk } : undefined}>
      <i className={cn(g.icon, "text-xs")} style={{ color: g.color }} aria-hidden="true" />
      {RESULT_WORD[result]}
    </span>
  )
}

/** Three figures (strategy 07: student 3). Each is a toggle for the result filter, so a number is where it is acted on. */
export function RecordFigures({ counts, value, onChange }: { counts: Record<RecordResult, number>; value: RecordFilter["result"]; onChange: (r: RecordFilter["result"]) => void }) {
  const items: Array<{ id: RecordResult; label: string }> = [
    { id: "counted", label: "Counted" },
    { id: "not-counted", label: "Did not count" },
    { id: "waiting", label: "Awaiting approval" },
  ]
  return (
    <div className="flex flex-wrap gap-x-6 gap-y-2" role="group" aria-label="Filter by result">
      {items.map((x) => {
        const on = value === x.id
        const amber = x.id === "not-counted" && counts[x.id] > 0
        return (
          <Button
            key={x.id}
            type="button"
            variant="ghost"
            size="default"
            aria-pressed={on}
            onClick={() => onChange(on ? "all" : x.id)}
            data-figure="kpi"
            className={cn("group -ms-2 h-auto flex-col items-start gap-0.5 px-2 py-1.5 text-start", on ? "bg-muted ring-1 ring-foreground" : "bg-transparent")}
          >
            <span className="font-heading text-2xl font-semibold leading-none tabular-nums text-foreground group-hover:underline group-hover:underline-offset-4" style={amber ? { color: VIZ.behindInk } : undefined}>
              {fmt(counts[x.id])}
            </span>
            <span className="text-xs text-muted-foreground">{x.label}</span>
          </Button>
        )
      })}
    </div>
  )
}

export function RecordFilters({ f, onChange, courses }: { f: RecordFilter; onChange: (p: Partial<RecordFilter>) => void; courses: Array<{ id: string; code: string; n: number }> }) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center" data-region="filters">
      <Input type="search" value={f.q} onChange={(e) => onChange({ q: e.target.value })} placeholder={`Search ${skillNounPlural()} or evaluators`} aria-label={`Search ${skillNounPlural()} or evaluators`} className="h-8 w-full sm:w-64" />
      <div className="grid grid-cols-3 gap-2 sm:flex">
        <Select value={f.result} onValueChange={(v) => onChange({ result: v as RecordFilter["result"] })}>
          <SelectTrigger size="sm" className="w-full sm:w-40" aria-label="Result">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All results</SelectItem>
            {(Object.keys(RESULT_WORD) as RecordResult[]).map((r) => <SelectItem key={r} value={r}>{RESULT_WORD[r]}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={f.setting} onValueChange={(v) => onChange({ setting: v as RecordFilter["setting"] })}>
          <SelectTrigger size="sm" className="w-full sm:w-36" aria-label="Setting">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All settings</SelectItem>
            <SelectItem value="clinical">Clinical</SelectItem>
            <SelectItem value="lab">Lab</SelectItem>
            <SelectItem value="simulation">Simulation</SelectItem>
          </SelectContent>
        </Select>
        <Select value={f.course} onValueChange={(v) => onChange({ course: v })}>
          <SelectTrigger size="sm" className="w-full sm:w-36" aria-label="Course">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All courses</SelectItem>
            {courses.map((c) => <SelectItem key={c.id} value={c.id}>{c.code}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}

/**
 * Phone layout for one evaluation: no table, two lines (strategy: rows become 2-line cards at 375). The reason line shows only
 * when it explains something the result word does not (did not count, returned); "Counted" and "Awaiting approval" say it.
 */
export function RecordMobileRow({ date, title, result, why }: { date: string; title?: React.ReactNode; result: RecordResult; why: string }) {
  return (
    <li className="flex flex-col gap-1 py-2.5">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <span className="text-sm tabular-nums text-muted-foreground">{date}</span>
        {title ? <span className="min-w-0 flex-1 text-sm text-foreground">{title}</span> : null}
        <ResultLabel result={result} className={title ? "" : "ms-auto"} />
      </div>
      {why && (result === "not-counted" || result === "returned" || result === "sent") ? <p className="text-xs text-muted-foreground">{why}</p> : null}
    </li>
  )
}
