"use client"

/**
 * Approvals C, by-reason board. Four columns, one per cause: Evaluator not assigned, Approval required, Student and evaluator disagree,
 * and Aging 8+ days (anything that old, whatever its cause, so the oldest work is one column). Each column header carries the count;
 * cards show the student, the skill, course, setting and location, the evaluator with role, and the wait, oldest first, scrolling inside the column after five. Each column carries the
 * one decision that fits it: Approve all like rows (rule), Adopt, merge or assign (evaluator not assigned; one menu for the oldest
 * card), Review one by one (disagree, aging).
 */
import { TYPE } from "@/components/lab/type-scale"
import * as React from "react"
import { LabLink as Link } from "@/components/lab/lab-bar/lab-link"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@exxatdesignux/ui/components/ui/card"
import { fmt, plural } from "@/lib/v2/format"
import { isCheckoff, BOARD_COLUMNS, boardColumns, evaluatorLine, reviewItemHref, skillsLine, whereLine, type BoardColumnId, type ReviewRow } from "@/lib/lab/reviewer"
import type { LabScope } from "@/lib/lab/scope"
import { ApprovalsFrame } from "@/components/lab/reviewer/approvals-frame"
import { EvaluatorMenu, useDecisionUi } from "@/components/lab/reviewer/decisions"
import { AgeText, CheckoffTag, ReasonChip } from "@/components/lab/reviewer/parts"
import { LINK_IN_TABLE as LINK } from "@/components/lab/link-styles"

const SHOW = 5

export function ReviewerApprovalsC() {
  return (
    <ApprovalsFrame variant="C">
      {/* No summary line: the four column counts are the counts (a board's headers do what tab counts do), and the Aging column
          leads with the oldest submission, so a summary would repeat them (strategy/07 K2). */}
      {(ctx) => <Board rows={ctx.rowsInScope} scope={ctx.scope} />}
    </ApprovalsFrame>
  )
}

function Board({ rows, scope }: { rows: ReviewRow[]; scope: LabScope }) {
  const cols = React.useMemo(() => boardColumns(rows), [rows])
  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4" data-region="board">
      {BOARD_COLUMNS.map((c) => (
        <Column key={c.id} id={c.id} label={c.label} icon={c.icon} rows={cols[c.id]} scope={scope} />
      ))}
    </div>
  )
}

function Column({ id, label, icon, rows, scope }: { id: BoardColumnId; label: string; icon: string; rows: ReviewRow[]; scope: LabScope }) {
  const ui = useDecisionUi()
  const like = rows.filter((r) => r.likeKey === "rule-met")
  const aging = id === "aging"
  return (
    <Card size="sm" className="self-start" aria-labelledby={`col-${id}`} data-board-column={id}>
      <CardHeader className="gap-1">
        {/* The column count is the section count (heading plus muted count, consistency audit item 2), like a tab count:
            not a headline figure. */}
        <CardTitle id={`col-${id}`} className={`flex items-center gap-2 ${TYPE.card}`}>
          <i className={`${aging ? "fa-solid" : "fa-light"} ${icon}`} style={aging && rows.length ? { color: "var(--lab-viz-behind-ink)" } : undefined} aria-hidden="true" />
          {label}
          <span className="font-normal tabular-nums text-muted-foreground">
            {fmt(rows.length)}
            <span className="sr-only">{rows.length === 1 ? " submission" : " submissions"}</span>
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {rows.length === 0 ? <p className="text-sm text-muted-foreground">None</p> : null}
        {/* Every row, oldest first, scrolling inside the column after about five (design brief section 9: lists scroll inside
            their panel), so there is no "All n" button to press. */}
        <ul className={`flex flex-col divide-y divide-border ${rows.length > SHOW ? "max-h-[22rem] overflow-y-auto pe-1" : ""}`} aria-label={`${label}, ${plural(rows.length, "submission", "submissions")}`}>
          {rows.map((r) => (
            <li key={r.key} className="flex flex-col gap-1 py-2 first:pt-0">
              <span className="flex items-baseline justify-between gap-2">
                <Link className={`${LINK} min-w-0 text-sm`} href={reviewItemHref(scope, r.key)}>{r.student}</Link>
                <AgeText days={r.days} />
              </span>
              <span className="whitespace-normal text-xs text-muted-foreground" data-viz-label title={r.skills.length > 1 ? skillsLine(r) : undefined}>{r.skills.length > 1 ? `${r.skills[0]} and ${r.skills.length - 1} more` : r.skills[0]}</span>
              {/* REQ AR-01 on every card: course, setting and location, then the evaluator with their role. */}
              <span className="whitespace-normal text-xs text-muted-foreground" data-viz-label data-row-where title={whereLine(r)}>{whereLine(r)}</span>
              {isCheckoff(r) ? <CheckoffTag /> : null}
              {/* The evaluator once, on one line, in every column. The "Evaluator not assigned" column header already says the
                  name is not in the directory, so its cards carry no second badge restating it. */}
              <span className="whitespace-normal text-xs text-muted-foreground" data-viz-label data-row-evaluator title={evaluatorLine(r)}>{evaluatorLine(r)}</span>
              {/* The column header is the reason for its cards (the skill line names what requires approval), so a card repeats
                  it only where the column mixes causes: Aging, and a paper form inside the approval column. */}
              {aging || r.reason === "paper" ? <span><ReasonChip reason={r.reason} /></span> : null}
            </li>
          ))}
        </ul>
        {id === "rule" && like.length > 1 ? (
          <Button type="button" variant="outline" size="sm" className="self-start" onClick={() => ui.openBulk(new Set(like.map((r) => r.key)))}>
            {`Approve ${like.length} like these`}
          </Button>
        ) : null}
        {id === "new-evaluator" && rows[0] ? (
          <span className="self-start">
            <EvaluatorMenu row={rows[0]} adoptLabel={`Adopt or merge ${rows[0].evaluator}`} />
          </span>
        ) : null}
      </CardContent>
    </Card>
  )
}
