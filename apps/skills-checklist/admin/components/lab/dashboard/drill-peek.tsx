"use client"

/**
 * Inline peek for the grouped drill list (variant B). One pane beside the list answers "what is left, and why" for the
 * selected row without leaving the page. Every fact is read from the dashboard's own selectors (populationRows,
 * pipelineRecords, buildDrill), so a peek never disagrees with the list, the dashboard or Attainment.
 */
import * as React from "react"
import { LabLink as Link } from "@/components/lab/lab-bar/lab-link"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@exxatdesignux/ui/components/ui/card"
import { LINK, LINK_IN_TABLE } from "@/components/lab/link-styles"
import { StateBadge } from "@/components/lab/status-pill"
import { ageLabel, fmt } from "@/lib/v2/format"
import { RECORD_STATE_LABEL, studentHref, type DrillRequest, type DrillSkill, type DrillStudent, type PipelineRecord, type SiteRow } from "@/lib/lab/dashboard"
import { attainmentHref, peekParam } from "@/lib/lab/attainment"
import type { LabScope } from "@/lib/lab/scope"
import { skillNoun } from "@/lib/lab/terms"

const SHOW = 10
const ORDER = { none: 0, unqualified: 1, progress: 2, achieved: 3 } as const

export type PeekTarget =
  | { kind: "student"; row: DrillStudent }
  | { kind: "skill"; row: DrillSkill }
  | { kind: "site"; row: SiteRow; requests: DrillRequest[] }
  | { kind: "request"; row: DrillRequest }

/** Section-title count: heading plus a muted count (consistency audit item 2). */
const Count = ({ n }: { n: number }) => <span className="text-sm font-normal tabular-nums text-muted-foreground">{fmt(n)}</span>

/** Records grouped by state: the state is said once per group (glyph + word + count), never repeated on every line. */
function Lines({ recs, nameOf, moreHref }: { recs: PipelineRecord[]; nameOf: (r: PipelineRecord) => string; moreHref: string }) {
  const [all, setAll] = React.useState(false)
  const shown = all ? recs : recs.slice(0, SHOW)
  const states = [...new Set(recs.map((r) => r.state))]
  return (
    <div className="flex flex-col gap-3">
      {states.map((st) => {
        const inState = shown.filter((r) => r.state === st)
        if (inState.length === 0) return null
        return (
          <section key={st} className="flex flex-col gap-1" aria-label={`${RECORD_STATE_LABEL[st]}, ${recs.filter((r) => r.state === st).length}`}>
            <span className="self-start"><StateBadge state={st} detail={fmt(recs.filter((r) => r.state === st).length)} /></span>
            <ul className="flex flex-col">
              {inState.map((r) => (
                <li key={r.key} className="flex items-center justify-between gap-3 py-1">
                  <span className="min-w-0 truncate text-sm text-foreground">{nameOf(r)}</span>
                  {st === "progress" ? <span className="shrink-0 text-xs tabular-nums text-muted-foreground">{`${r.counted} of ${r.need}`}</span> : null}
                </li>
              ))}
            </ul>
          </section>
        )
      })}
      <div className="flex flex-wrap items-center gap-2">
        {recs.length > SHOW ? <Button type="button" variant="outline" size="sm" onClick={() => setAll((x) => !x)}>{all ? `Show the first ${SHOW}` : `Show all ${fmt(recs.length)}`}</Button> : null}
        <Button asChild variant="ghost" size="sm"><Link href={moreHref}>Open in Reports</Link></Button>
      </div>
    </div>
  )
}

export function DrillPeek({ target, records, scope, onClose }: { target: PeekTarget | null; records: PipelineRecord[]; scope: LabScope; onClose: () => void }) {
  if (!target) {
    return (
      <Card size="sm" data-drill-peek="none">
        <CardContent>
          <p className="text-sm text-muted-foreground">Choose a row to see what is left.</p>
        </CardContent>
      </Card>
    )
  }
  const close = <Button type="button" variant="ghost" size="icon-sm" aria-label="Close the peek" onClick={onClose}><i className="fa-light fa-xmark" aria-hidden="true" /></Button>
  if (target.kind === "student") {
    const s = target.row
    const left = records.filter((r) => r.studentId === s.id && r.state !== "achieved").sort((a, b) => ORDER[a.state] - ORDER[b.state] || a.skill.localeCompare(b.skill))
    return (
      <Card size="sm" data-drill-peek="student" data-peek-count={left.length}>
        <CardHeader className="flex flex-row items-start justify-between gap-2">
          <div className="flex min-w-0 flex-col gap-0.5">
            <CardTitle className="text-sm"><Link className={LINK} href={studentHref(scope, s.id)}>{s.name}</Link></CardTitle>
            <p className="text-xs text-muted-foreground">{`${s.group ? `${s.cohort}, ${s.group}` : s.cohort}. Required achieved ${s.achieved} of ${s.required}.`}</p>
          </div>
          {close}
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          <h3 className="flex items-baseline gap-2 text-sm font-semibold text-foreground">{left.length ? <>Not achieved yet<Count n={left.length} /></> : `Every required ${skillNoun()} achieved`}</h3>
          {left.length ? <Lines recs={left} nameOf={(r) => r.skill} moreHref={attainmentHref(scope, { peek: peekParam({ kind: "student", id: s.id }) })} /> : null}
        </CardContent>
      </Card>
    )
  }
  if (target.kind === "skill") {
    const k = target.row
    const left = records.filter((r) => r.skillId === k.skillId && r.state !== "achieved").sort((a, b) => ORDER[a.state] - ORDER[b.state] || a.student.localeCompare(b.student))
    return (
      <Card size="sm" data-drill-peek="skill" data-peek-count={left.length}>
        <CardHeader className="flex flex-row items-start justify-between gap-2">
          <div className="flex min-w-0 flex-col gap-0.5">
            <CardTitle className="text-sm">{k.name}</CardTitle>
            <p className="text-xs text-muted-foreground">{`${k.category}. Achieved by ${k.achieved} of ${k.students}.`}</p>
          </div>
          {close}
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          <h3 className="flex items-baseline gap-2 text-sm font-semibold text-foreground">Students not there yet<Count n={left.length} /></h3>
          {left.length ? <Lines recs={left} nameOf={(r) => r.student} moreHref={attainmentHref(scope, { peek: peekParam({ kind: "skill", id: k.skillId }) })} /> : null}
        </CardContent>
      </Card>
    )
  }
  if (target.kind === "site") {
    const reqs = [...target.requests].sort((a, b) => b.days - a.days)
    return (
      <Card size="sm" data-drill-peek="site" data-peek-count={reqs.length}>
        <CardHeader className="flex flex-row items-start justify-between gap-2">
          <div className="flex min-w-0 flex-col gap-0.5">
            <CardTitle className="text-sm">{target.row.name}</CardTitle>
            <p className="text-xs text-muted-foreground">{`Oldest waiting ${target.row.oldest} days.`}</p>
          </div>
          {close}
        </CardHeader>
        <CardContent>
          <h3 className="mb-1 flex items-baseline gap-2 text-sm font-semibold text-foreground">Requests waiting<Count n={reqs.length} /></h3>
          <ul className="flex flex-col divide-y divide-border">
            {reqs.slice(0, SHOW).map((r) => (
              <li key={r.id} className="flex flex-col py-1.5">
                <span className="flex items-center justify-between gap-2 text-sm"><Link className={LINK_IN_TABLE} href={studentHref(scope, r.studentId)}>{r.student}</Link><span className="tabular-nums text-muted-foreground">{ageLabel(r.days)}</span></span>
                <span className="truncate text-xs text-muted-foreground">{`${r.skills}. With ${r.evaluator}.`}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    )
  }
  const r = target.row
  return (
    <Card size="sm" data-drill-peek="request">
      <CardHeader className="flex flex-row items-start justify-between gap-2">
        <CardTitle className="text-sm"><Link className={LINK} href={studentHref(scope, r.studentId)}>{r.student}</Link></CardTitle>
        {close}
      </CardHeader>
      <CardContent>
        <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 text-sm">
          <dt className="text-muted-foreground">Asked for</dt><dd className="text-foreground">{r.skills}</dd>
          <dt className="text-muted-foreground">With</dt><dd className="text-foreground">{r.evaluator}</dd>
          <dt className="text-muted-foreground">Site</dt><dd className="text-foreground">{r.site}</dd>
          <dt className="text-muted-foreground">Waiting</dt><dd className="tabular-nums text-foreground">{ageLabel(r.days)}</dd>
          <dt className="text-muted-foreground">Status</dt><dd className="text-foreground">{r.status}</dd>
        </dl>
      </CardContent>
    </Card>
  )
}

/**
 * The condition behind the figure as one sentence with its own remove link (strategy/07 heuristic 3: removable in one click).
 * On behind lists the basis caption joins it, so the list says once what it shows and against what.
 */
export function ConditionLine({ label, caption, removeHref }: { label: string; caption?: string; removeHref: string }) {
  return (
    <p className="text-sm text-muted-foreground" data-condition-chip>
      {`Showing ${`${label.charAt(0).toLowerCase()}${label.slice(1)}`.replace(", Short in", ", short in")}.${caption ? ` ${caption}` : ""} `}
      <Link className={LINK} href={removeHref} scroll={false} aria-label={`Remove condition: ${label}`}>Show everyone in scope</Link>
    </p>
  )
}
