"use client"

/**
 * Reviewer Students B, by cohort. One DS Card per cohort (the cohort is the unit a reviewer is often assigned to): the cohort's
 * student count, how many wait for the reviewer and how many are behind (each a link to the table filtered to that cohort), then
 * the top five students who need attention with their one action, and "All n" to the full cohort list. Question: does grouping
 * by cohort make the work feel smaller and show which cohort is slipping?
 */
import * as React from "react"
import { LabLink as Link } from "@/components/lab/lab-bar/lab-link"
import { Card, CardContent, CardHeader, CardTitle } from "@exxatdesignux/ui/components/ui/card"
import { PersonIdentityCell } from "@exxatdesignux/ui/components/data-views/person-identity-cell"
import { initialsOf, LINK } from "@/components/lab/reviewer/parts"
import { StatusCell, RowAction, StudentLink, StudentsFrame, needsYou, type StudentsContext } from "@/components/lab/rbac/students-frame"
import { plural, reviewerStudentsHref } from "@/lib/lab/reviewer"

const TOP = 5

export function ReviewerStudentsB() {
  return <StudentsFrame variant="B">{(ctx) => <CohortCards ctx={ctx} />}</StudentsFrame>
}

function CohortCards({ ctx }: { ctx: StudentsContext }) {
  const shown = new Set(ctx.students.map((r) => r.id))
  return (
    <div className="grid gap-4 lg:grid-cols-2" data-region="cohorts">
      {ctx.model.cohorts.map((g) => {
        const rows = g.rows.filter((r) => shown.has(r.id))
        if (rows.length === 0) return null
        const attention = rows.filter((r) => r.attention !== "none")
        const you = g.waitingStudents
        const href = (show?: string) => reviewerStudentsHref({ ...ctx.scope, cohort: g.cohort }, { show })
        return (
          <Card key={g.cohort} size="sm" className="self-start" data-cohort={g.cohort}>
            <CardHeader className="flex flex-row items-baseline justify-between gap-3 pb-0">
              <CardTitle className="text-base">{g.cohort}</CardTitle>
              <span className="text-sm tabular-nums text-muted-foreground">{plural(g.rows.length, "student", "students")}</span>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <p className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted-foreground">
                <span>
                  {you ? <Link className={`${LINK} tabular-nums`} href={href("you")}>{you}</Link> : <span className="tabular-nums">0</span>} waiting for you
                </span>
                <span>
                  {g.behind ? <Link className={`${LINK} tabular-nums`} href={href("behind")}>{g.behind}</Link> : <span className="tabular-nums">0</span>} behind
                </span>
                <span>
                  <span className="tabular-nums">{g.onTrack}</span> on track
                </span>
              </p>
              {attention.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nothing in this cohort needs you.</p>
              ) : (
                <ul className="flex flex-col divide-y divide-border border-t border-border">
                  {attention.slice(0, TOP).map((r) => (
                    <li key={r.id} className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5 py-2">
                      <span className="min-w-0 flex-1">
                        <PersonIdentityCell name={r.name} initials={initialsOf(r.name)} renderName={() => <StudentLink ctx={ctx} row={r} />} />
                      </span>
                      <span className="flex shrink-0 items-center gap-3">
                        <StatusCell row={r} />
                        {needsYou(r.attention) ? <RowAction ctx={ctx} row={r} /> : null}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
              {/* Navigates to the cohort's full table, so a link (density sweep: navigation is a link, not a button). */}
              <Link className={`${LINK} self-start text-sm`} href={href()}>{`All ${g.rows.length} in ${g.cohort}`}</Link>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
