"use client"

/**
 * Record pieces: the result word (glyph + word + colour; amber only for "Did not count" and "Returned"), three figures that are
 * also filters, and one filter row (search, result, setting, course) [REQ SH-01..SH-07]. Compact 32 px controls, one row.
 */
import * as React from "react"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import { Input } from "@exxatdesignux/ui/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@exxatdesignux/ui/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@exxatdesignux/ui/components/ui/popover"
import { cn } from "@exxatdesignux/ui/lib/utils"
import { VIZ } from "@/components/lab/viz"
import { fmt } from "@/lib/v2/format"
import { skillNounPlural } from "@/lib/lab/terms"
import { RESULT_WORD, type RecordFilter, type RecordResult } from "@/lib/lab/student2"
import { statusTone } from "@/lib/v2/labels"
import { TYPE } from "@/components/lab/type-scale"

const GLYPH: Record<RecordResult, { icon: string; color: string }> = {
  counted: { icon: "fa-solid fa-circle-check", color: "var(--foreground)" },
  "not-counted": { icon: "fa-solid fa-triangle-exclamation", color: VIZ.behindInk },
  requested: { icon: "fa-light fa-hourglass-half", color: "var(--muted-foreground)" },
  waiting: { icon: "fa-light fa-clock", color: "var(--muted-foreground)" },
  returned: { icon: "fa-solid fa-rotate-left", color: VIZ.behindInk },
  sent: { icon: "fa-light fa-paper-plane", color: "var(--muted-foreground)" },
}

export function ResultLabel({ result, className }: { result: RecordResult; className?: string }) {
  const g = GLYPH[result]
  const amber = statusTone(RESULT_WORD[result]) === "warning"
  return (
    <span className={cn("inline-flex items-center gap-1.5 whitespace-nowrap text-sm", amber ? "font-medium" : "", className)} style={amber ? { color: VIZ.behindInk } : undefined}>
      <i className={cn(g.icon, "text-xs")} style={{ color: g.color }} aria-hidden="true" />
      {RESULT_WORD[result]}
    </span>
  )
}

/**
 * The three SH-04 figures (strategy 07: list without tabs 3): submissions counted, outstanding (waiting with the evaluator,
 * awaiting approval, or sent to someone else) and returned. Each is a toggle for the result filter, so a number is where it is
 * acted on; outstanding and returned count each request once (lib/lab/student2.ts recordFigures), the same numbers My progress
 * shows. "Did not count" stays one choice away in the Result filter.
 */
export function RecordFigures({ counts, value, onChange }: { counts: { counted: number; outstanding: number; returned: number }; value: RecordFilter["result"]; onChange: (r: RecordFilter["result"]) => void }) {
  const items: Array<{ id: "counted" | "outstanding" | "returned"; label: string }> = [
    { id: "counted", label: "Counted" },
    // "Waiting": the same word and number My progress shows (one unit per concept); it is REQ SH-04's "outstanding".
    { id: "outstanding", label: "Waiting" },
    { id: "returned", label: "Returned" },
  ]
  return (
    <div className="flex flex-wrap gap-x-6 gap-y-2" role="group" aria-label="Filter by result">
      {items.map((x) => {
        const on = value === x.id
        const amber = x.id === "returned" && counts[x.id] > 0
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
            <span className={cn(TYPE.figure, "text-foreground group-hover:underline group-hover:underline-offset-4")} style={amber ? { color: VIZ.behindInk } : undefined}>
              {fmt(counts[x.id])}
            </span>
            <span className="text-xs text-muted-foreground">{x.label}</span>
          </Button>
        )
      })}
    </div>
  )
}

/**
 * Search plus the three filters. From 640 px the Result, Setting and Course selects sit in the row; on a phone they move into one
 * "Filters" popover beside the search, so no select is cut at 375 (review 2026-10-30). Nothing is dropped: every filter is one
 * tap away, and the button counts the ones applied.
 */
export function RecordFilters({ f, onChange, courses }: { f: RecordFilter; onChange: (p: Partial<RecordFilter>) => void; courses: Array<{ id: string; code: string; n: number }> }) {
  const applied = [f.result !== "all", f.setting !== "all", f.course !== "all"].filter(Boolean).length
  return (
    <div className="flex flex-row flex-wrap items-center gap-2" data-region="filters">
      <Input type="search" value={f.q} onChange={(e) => onChange({ q: e.target.value })} placeholder={`Search ${skillNounPlural()} or evaluators`} aria-label={`Search ${skillNounPlural()} or evaluators`} className="h-8 min-w-0 flex-1 sm:w-64 sm:flex-none" />
      <Popover>
        <PopoverTrigger asChild>
          <Button type="button" variant="outline" size="sm" className="sm:hidden" data-record-filters-phone>{applied ? `Filters (${applied})` : "Filters"}</Button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-64">
          <FilterSelects f={f} onChange={onChange} courses={courses} stacked />
        </PopoverContent>
      </Popover>
      <div className="max-sm:hidden">
        <FilterSelects f={f} onChange={onChange} courses={courses} />
      </div>
    </div>
  )
}

function FilterSelects({ f, onChange, courses, stacked = false }: { f: RecordFilter; onChange: (p: Partial<RecordFilter>) => void; courses: Array<{ id: string; code: string; n: number }>; stacked?: boolean }) {
  return (
      <div className={stacked ? "flex flex-col gap-2" : "flex gap-2"}>
        <Select value={f.result} onValueChange={(v) => onChange({ result: v as RecordFilter["result"] })}>
          <SelectTrigger size="sm" className="w-full sm:w-40" aria-label="Result">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All results</SelectItem>
            <SelectItem value="outstanding">All waiting</SelectItem>
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
  )
}

/**
 * Phone layout for one evaluation: no table, two lines (strategy: rows become 2-line cards at 375). The reason line shows only
 * when it explains something the result word does not (did not count, returned); "Counted" and "Awaiting approval" say it.
 */
/** A row's reason: a reviewer's return note is their words, so it is quoted as record content (as on the fix page), not page prose. */
export function WhyText({ why }: { why: string }) {
  const m = /^Returned: ([\s\S]+)$/.exec(why)
  return m ? <>Returned: <q data-user-content>{m[1]}</q></> : <>{why}</>
}

export function RecordMobileRow({ date, title, result, why, action }: { date: string; title?: React.ReactNode; result: RecordResult; why: string; /** Opens the completed evaluation [REQ SH-07]. */ action?: React.ReactNode }) {
  return (
    <li className="flex flex-col gap-1 py-2.5">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <span className="text-sm tabular-nums text-muted-foreground">{date}</span>
        {title ? <span className="min-w-0 flex-1 text-sm text-foreground">{title}</span> : null}
        <ResultLabel result={result} className={title ? "" : "ms-auto"} />
      </div>
      {why && (result === "not-counted" || result === "returned" || result === "sent") ? <p className="text-xs text-muted-foreground"><WhyText why={why} /></p> : null}
      {action ?? null}
    </li>
  )
}
