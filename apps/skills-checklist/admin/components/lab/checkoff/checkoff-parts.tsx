"use client"

/**
 * Shared parts of the course offering Skills screen, Group check-off (PROTO `GS`). Both variants use them, so the session, the
 * availability rules, the cell, the record bar and the confirmation are identical; only the layout of the ticking differs.
 */
import * as React from "react"
import { Badge } from "@exxatdesignux/ui/components/ui/badge"
import { Tip } from "@exxatdesignux/ui/components/ui/tip"
import { LocalBanner } from "@exxatdesignux/ui/components/ui/banner"
import { Checkbox } from "@exxatdesignux/ui/components/ui/checkbox"
import { DatePickerField } from "@exxatdesignux/ui/components/ui/date-picker-field"
import { Field, FieldLabel } from "@exxatdesignux/ui/components/ui/field"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@exxatdesignux/ui/components/ui/select"
import { cn } from "@exxatdesignux/ui/lib/utils"
import { StickyFooter } from "@/components/lab/layout"
import { AmberNote } from "@/components/lab/admin-a/parts"
import { CHECKOFF_SETTINGS, FLAG_ICON, FLAG_WORD, cellKey, recordedSentence, type CheckoffSetting } from "@/lib/lab/course-checkoff"
import { aNoun, skillNoun } from "@/lib/lab/terms"
import type { CheckoffModel, SessionSkill } from "./use-checkoff"

const n = (count: number, one: string, many: string) => `${count} ${count === 1 ? one : many}`
const toDate = (iso: string): Date | undefined => (iso ? new Date(`${iso}T12:00:00`) : undefined)
const fromDate = (d: Date): string => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`

/**
 * The session, edited in place (Romit 2026-10-28, "why is this data here?"): Date and Setting only. Recorded by is the signed-in
 * course faculty member (still written on each evaluation; recording on behalf of someone is open for Aarti, so it is not shown).
 * The course is switched from My courses, not here; the roster count is the table's own header.
 */
export function SessionControls({ m }: { m: CheckoffModel }) {
  return (
    <div className="flex flex-wrap items-end gap-3" data-checkoff-session>
      <Field className="w-44">
        <FieldLabel htmlFor="co-date">Date</FieldLabel>
        <DatePickerField id="co-date" value={toDate(m.date)} onChange={(d) => d && m.setDate(fromDate(d))} toYear={2027} />
      </Field>
      <Field className="w-44">
        <FieldLabel htmlFor="co-setting">Setting</FieldLabel>
        <Select value={m.setting} onValueChange={(v) => m.setSetting(v as CheckoffSetting)}>
          <SelectTrigger id="co-setting"><SelectValue /></SelectTrigger>
          <SelectContent>
            {CHECKOFF_SETTINGS.map((x) => <SelectItem key={x.value} value={x.value}>{x.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </Field>
    </div>
  )
}

/** One short amber line, only when a skill on screen skips the student's self-evaluation [PROTO]. */
export function SelfEvalNote({ shown }: { shown: SessionSkill[] }) {
  const skip = shown.filter((k) => !k.reason && k.selfEvaluation)
  if (!skip.length) return null
  return <AmberNote region="">{`${skip.map((k) => k.skill.name).join(", ")}: a check-off skips the student's self-evaluation.`}</AmberNote>
}


/** Glyph + word for the two flags. A ticked box explains itself (Romit 2026-10-28, "too many text"). */
export function Legend() {
  return (
    <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground" aria-label="Key">
      <span className="flex items-center gap-1"><i className={FLAG_ICON.hasEvidence} aria-hidden="true" />{FLAG_WORD.hasEvidence}</span>
      <span className="flex items-center gap-1"><i className={FLAG_ICON.awaiting} aria-hidden="true" />{FLAG_WORD.awaiting}</span>
    </p>
  )
}

/**
 * One cell: a checkbox (accessible name "Check off {skill} for {student}"), with a flag beside it when the record already has
 * qualifying evidence or an evaluation is already out. Flagged cells stay tickable [PROTO]. After Record: "Recorded" or "In review".
 */
export function CheckCell({ m, studentId, studentName, k }: { m: CheckoffModel; studentId: string; studentName: string; k: SessionSkill }) {
  const key = cellKey(studentId, k.skill.id)
  if (k.reason) return <span className="text-muted-foreground" title={k.reason} aria-label={`${k.skill.name}: not available`}>-</span>
  const done = m.recorded[key]
  if (done) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-foreground" data-cell-state={done}>
        <i className={done === "review" ? "fa-light fa-clock" : "fa-solid fa-circle-check"} aria-hidden="true" />
        {done === "review" ? "In review" : "Recorded"}
      </span>
    )
  }
  const f = m.flags(studentId, k.skill.id)
  const flag = f.hasEvidence ? "hasEvidence" : f.awaiting ? "awaiting" : null
  const id = `co-${key.replace(/\W+/g, "-")}`
  return (
    <span className="inline-flex items-center gap-1.5" data-cell-flag={flag ?? "none"}>
      <Checkbox id={id} checked={!!m.ticked[key]} onCheckedChange={() => m.toggle(studentId, k.skill.id)} aria-label={`Check off ${k.skill.name} for ${studentName}${flag ? `. ${FLAG_WORD[flag]}` : ""}`} className="max-sm:size-6" />
      {flag ? <i className={cn(FLAG_ICON[flag], "text-muted-foreground")} title={FLAG_WORD[flag]} aria-hidden="true" /> : null}
    </span>
  )
}

/** "6 check-offs ready to record" with the skills that go to review, Clear and the one primary [PROTO sticky bar]. */
export function RecordBar({ m }: { m: CheckoffModel }) {
  if (!m.count) return null
  const names = m.reviewSkills.map((k) => k.skill.name)
  return (
    <StickyFooter
      context={
        <span className="flex flex-col" data-checkoff-ready>
          <span className="tabular-nums">{`${n(m.count, "check-off", "check-offs")} ready to record`}</span>
          {names.length ? <span className="text-xs text-muted-foreground">{`${names.join(", ")} ${names.length === 1 ? "needs" : "need"} approval, so ${names.length === 1 ? "it goes" : "they go"} to administrator review first.`}</span> : null}
        </span>
      }
      secondary={{ label: "Clear", onClick: m.clear }}
      primary={{ label: "Record check-offs", onClick: m.record }}
    />
  )
}

export function RecordedBanner({ m }: { m: CheckoffModel }) {
  if (!m.saved) return null
  return (
    <LocalBanner variant="success" title="Check-offs recorded" dismissible onDismiss={m.dismissSaved} data-checkoff-saved>
      {recordedSentence(m.saved.count, m.saved.review, m.saved.who, m.saved.date)}
    </LocalBanner>
  )
}

/**
 * Column head: name and level (Romit 2026-10-28, "too many text"). An unavailable column says "Not available" (its state, in
 * words). What a tick records, and "Needs approval", are in the ⓘ; approval also shows as one small clock glyph.
 */
export function SkillHead({ k }: { k: SessionSkill }) {
  const tip = k.reason ?? `${k.records}.${k.approval ? " Needs approval." : ""}`
  return (
    <div className="flex flex-col gap-1 py-1.5">
      <span className={cn("line-clamp-2 text-xs font-medium", k.reason ? "text-muted-foreground" : "text-foreground")}>{k.skill.name}</span>
      <span className="flex flex-wrap items-center gap-1.5">
        <Badge variant="outline">{k.levelLabel}</Badge>
        {k.reason ? <span className="text-xs font-normal text-muted-foreground">Not available</span> : null}
        {!k.reason && k.approval ? (
          <span className="inline-flex text-muted-foreground" data-needs-approval>
            <i className="fa-light fa-clock" aria-hidden="true" />
            <span className="sr-only">Needs approval</span>
          </span>
        ) : null}
        <Tip label={tip}>
          <span tabIndex={0} className="inline-flex size-5 items-center justify-center rounded-sm text-muted-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <i className="fa-light fa-circle-info" aria-hidden="true" />
            <span className="sr-only">{`${k.skill.name}: ${tip}`}</span>
          </span>
        </Tip>
      </span>
    </div>
  )
}

/** Empty state when the offering has nothing that can be checked off in this session. */
export function NothingToCheck() {
  return (
    <p className="rounded-md border border-border px-4 py-8 text-center text-sm text-muted-foreground" data-checkoff-none>
      {`No mapped ${skillNoun()} can be checked off in this session. An administrator can allow group check-off when configuring ${aNoun()}.`}
    </p>
  )
}
