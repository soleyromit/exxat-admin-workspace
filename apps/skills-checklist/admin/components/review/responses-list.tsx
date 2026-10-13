"use client"

import * as React from "react"
import type { RecordedDetail } from "@/lib/store"
import { reviewCopy as rv } from "@/lib/copy"

interface Row {
  key: string
  label: string
  student: string | null
  evaluator: string
  same: boolean | null
}

const yn = (v: boolean) => (v ? rv.yes : rv.no)

/** Pairs every question or level the evaluator answered with what the student recorded (ST-11, RP-07: all answers, never a summary). */
export function responseRows(self: RecordedDetail | null, evaluator: RecordedDetail | null): Row[] {
  if (!evaluator) return []
  const rows: Row[] = []
  const hasSelf = !!self && self.kind === evaluator.kind
  switch (evaluator.kind) {
    case "binary": {
      const s = hasSelf ? (self as typeof evaluator).label : null
      rows.push({ key: "outcome", label: rv.outcome, student: s, evaluator: evaluator.label, same: hasSelf ? s === evaluator.label : null })
      break
    }
    case "demonstration": {
      const s = hasSelf ? (self as typeof evaluator).level : null
      rows.push({ key: "level", label: rv.recordedLevel, student: s, evaluator: evaluator.level, same: hasSelf ? s === evaluator.level : null })
      break
    }
    case "question": {
      const sItems = hasSelf ? (self as typeof evaluator).items : []
      for (const it of evaluator.items) {
        const other = sItems.find((x) => x.id === it.id)
        rows.push({ key: it.id, label: it.text, student: hasSelf ? (other ? yn(other.yes) : rv.notAnswered) : null, evaluator: yn(it.yes), same: hasSelf ? !!other && other.yes === it.yes : null })
      }
      break
    }
    case "scored": {
      const sItems = hasSelf ? (self as typeof evaluator).items : []
      for (const it of evaluator.items) {
        const other = sItems.find((x) => x.id === it.id)
        rows.push({ key: it.id, label: it.text, student: hasSelf ? (other && other.score !== undefined ? rv.score(other.score) : rv.notAnswered) : null, evaluator: it.score !== undefined ? rv.score(it.score) : rv.notAnswered, same: hasSelf ? !!other && other.score === it.score : null })
      }
      break
    }
  }
  return rows
}

/** RP-07: every response, one row per question or level. "Same" and "Differs" are text, not colour. */
export function ResponsesList({ self, evaluator, evaluatorRole }: { self: RecordedDetail | null; evaluator: RecordedDetail | null; evaluatorRole: string }) {
  const rows = responseRows(self, evaluator)
  const both = rows.some((r) => r.student !== null)
  return (
    <dl className="flex flex-col divide-y divide-border rounded-md border border-border">
      {rows.map((r) => (
        <div key={r.key} className="flex flex-col gap-1 p-3">
          <dt className="text-sm font-medium text-foreground">{r.label}</dt>
          <dd className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-foreground">
            {both ? (
              <span>
                <span className="text-muted-foreground">Student: </span>
                {r.student}
              </span>
            ) : null}
            <span>
              <span className="text-muted-foreground">Evaluator ({evaluatorRole}): </span>
              {r.evaluator}
            </span>
            {r.same !== null ? <span className="text-muted-foreground">{r.same ? rv.same : rv.differs}</span> : null}
          </dd>
        </div>
      ))}
    </dl>
  )
}
