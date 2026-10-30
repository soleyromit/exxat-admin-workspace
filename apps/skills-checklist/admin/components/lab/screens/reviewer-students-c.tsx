"use client"

/**
 * Reviewer Students C, needs attention first. A worklist, not a directory: groups in the order a reviewer acts (waiting 8+ days,
 * waiting for approval, behind), each heading with its count, each row saying what is needed in one line with its one action.
 * On track students are one collapsed group at the end. Groups longer than 20 show 20 and "Show all n". Question: does reading
 * top to bottom, oldest work first, replace sorting and filtering for a reviewer?
 */
import { TYPE } from "@/components/lab/type-scale"
import * as React from "react"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@exxatdesignux/ui/components/ui/collapsible"
import { PersonIdentityCell } from "@exxatdesignux/ui/components/data-views/person-identity-cell"
import { initialsOf } from "@/components/lab/reviewer/parts"
import { AttentionMark, RowAction, StudentLink, StudentsFrame, type StudentsContext } from "@/components/lab/rbac/students-frame"
import { DiamondGlyph } from "@/components/lab/viz"
import { ATTENTION_LABEL, ATTENTION_ORDER, type Attention, type ReviewerStudentRow } from "@/lib/lab/reviewer"

const CHUNK = 20
const ICON: Record<Attention, React.ReactNode> = {
  aging: <i className="fa-solid fa-clock text-xs" style={{ color: "var(--lab-viz-behind-ink)" }} aria-hidden="true" />,
  approval: <i className="fa-light fa-hourglass-half text-xs text-muted-foreground" aria-hidden="true" />,
  behind: <DiamondGlyph size={10} />,
  none: null,
}
/** Group headings name what the reviewer does; a behind student with a submission waiting sits in the waiting group, marked Behind. */
const GROUP: Record<Attention, string> = { aging: ATTENTION_LABEL.aging, approval: ATTENTION_LABEL.approval, behind: "Behind, nothing waiting for you", none: "Nothing needs you" }

export function ReviewerStudentsC() {
  return <StudentsFrame variant="C">{(ctx) => <Worklist ctx={ctx} />}</StudentsFrame>
}

function Worklist({ ctx }: { ctx: StudentsContext }) {
  return (
    <div className="flex flex-col gap-6" data-region="worklist">
      {ATTENTION_ORDER.map((a) => {
        const rows = ctx.students.filter((r) => r.attention === a)
        if (rows.length === 0) return null
        return a === "none" ? (
          <Collapsible key={a} defaultOpen={!!ctx.query}>
            <CollapsibleTrigger asChild>
              <Button type="button" variant="ghost" size="sm" className="-ms-2 gap-2">
                <i className="fa-light fa-chevron-right text-xs transition-transform [[data-state=open]_&]:rotate-90" aria-hidden="true" />
                {`${GROUP.none} · ${rows.length}`}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-2">
              <Group ctx={ctx} a={a} rows={rows} showHeading={false} />
            </CollapsibleContent>
          </Collapsible>
        ) : (
          <Group key={a} ctx={ctx} a={a} rows={rows} />
        )
      })}
    </div>
  )
}

function Group({ ctx, a, rows, showHeading = true }: { ctx: StudentsContext; a: Attention; rows: ReviewerStudentRow[]; showHeading?: boolean }) {
  const [all, setAll] = React.useState(false)
  const shown = all ? rows : rows.slice(0, CHUNK)
  const id = `group-${a}`
  return (
    <section aria-labelledby={showHeading ? id : undefined} aria-label={showHeading ? undefined : GROUP[a]} className="flex flex-col gap-2">
      {showHeading ? (
        <h2 id={id} className={`flex items-center gap-2 ${TYPE.section}`}>
          {ICON[a]}
          {GROUP[a]}
          <span className="font-normal tabular-nums text-muted-foreground">{rows.length}</span>
        </h2>
      ) : null}
      <ul className="flex flex-col divide-y divide-border rounded-lg border border-border">
        {shown.map((r) => (
          <li key={r.id} className="grid grid-cols-1 items-center gap-x-4 gap-y-1 px-3 py-2 sm:grid-cols-[minmax(12rem,16rem)_8rem_1fr_auto]">
            <PersonIdentityCell name={r.name} initials={initialsOf(r.name)} renderName={() => <StudentLink ctx={ctx} row={r} />} />
            <span className="text-sm text-muted-foreground">{r.cohort}</span>
            <span className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-foreground">
              {r.next}
              {r.behind && a !== "behind" ? <AttentionMark a="behind" /> : null}
            </span>
            <span className="justify-self-start sm:justify-self-end">
              <RowAction ctx={ctx} row={r} />
            </span>
          </li>
        ))}
      </ul>
      {rows.length > CHUNK ? (
        <div>
          <Button type="button" variant="outline" size="sm" onClick={() => setAll((v) => !v)}>{all ? "Show fewer" : `Show all ${rows.length}`}</Button>
        </div>
      ) : null}
    </section>
  )
}
