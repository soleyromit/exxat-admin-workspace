"use client"

/**
 * Student My requests, variant A: by evaluator.
 * Tests: does grouping requests under the person who holds them (waiting, returned, done inside each) make it obvious who to
 * remind and what to fix, better than one list by status?
 * Regions (list budget 4): header · no-login note · open work by evaluator · done, collapsed behind one control (by evaluator,
 * 5 at a time).
 */
import * as React from "react"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import { Card, CardContent } from "@exxatdesignux/ui/components/ui/card"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@exxatdesignux/ui/components/ui/collapsible"
import { StudentFrame } from "@/components/lab/student/frame"
import { SectionTitle } from "@/components/lab/student/parts"
import { EvaluatorHeading, NoLoginNote, RequestLine } from "@/components/lab/student/requests"
import { requestGroups, shortDate, studentHref, type EvaluatorGroup } from "@/lib/lab/student"

const DONE_LIMIT = 5

export function StudentRequestsA() {
  return (
    <StudentFrame title="My requests" primary={(c) => ({ label: "Send for evaluation", href: studentHref("request-signoff", {}, c.studentId) })}>
      {({ state, studentId, param }) => <Body groups={requestGroups(state, studentId)} studentId={studentId} returnedOnly={param("show") === "returned"} />}
    </StudentFrame>
  )
}

function Body({ groups, studentId, returnedOnly }: { groups: EvaluatorGroup[]; studentId: string; returnedOnly: boolean }) {
  const [allDone, setAllDone] = React.useState(false)
  const [showDone, setShowDone] = React.useState(false)
  const open = groups.filter((g) => (returnedOnly ? g.returned.length > 0 : g.waiting.length + g.returned.length > 0))
  const done = groups.filter((g) => g.done.length > 0).sort((a, b) => b.done[0].date.localeCompare(a.done[0].date))
  const shownDone = allDone ? done : done.slice(0, DONE_LIMIT)
  const doneTotal = done.reduce((n, g) => n + g.done.length, 0)
  return (
    <div className="flex flex-col gap-6" data-student-lab="requests-A">
      <NoLoginNote />
      <section className="flex flex-col gap-3" data-region="open" aria-labelledby="open-h">
        <SectionTitle id="open-h" count={open.reduce((n, g) => n + g.waiting.length + g.returned.length, 0)}>{returnedOnly ? "Returned" : "Waiting and returned"}</SectionTitle>
        {open.length === 0 ? (
          <p className="text-sm text-muted-foreground">{returnedOnly ? "Nothing is returned." : "Nothing is waiting. Every request has an answer."}</p>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {open.map((g) => (
              <Card key={g.id} className="gap-0 py-0">
                <CardContent className="flex flex-col gap-2 py-4">
                  <EvaluatorHeading g={g} />
                  <ul className="flex flex-col divide-y divide-border">
                    {[...g.returned, ...(returnedOnly ? [] : g.waiting)].map((r) => <RequestLine key={r.id} row={r} studentId={studentId} />)}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
      {returnedOnly || done.length === 0 ? null : (
        <Card data-region="done" className="gap-0 py-0">
          <CardContent className="flex flex-col gap-1 py-4">
            <Collapsible open={showDone} onOpenChange={setShowDone}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <SectionTitle count={doneTotal}>Done</SectionTitle>
                <CollapsibleTrigger asChild>
                  <Button type="button" variant="ghost" size="sm" aria-expanded={showDone}>
                    {showDone ? "Hide done" : `Show done, last ${shortDate(done[0].done[0].date)}`}
                    <i className={`fa-light ${showDone ? "fa-chevron-up" : "fa-chevron-down"} text-xs`} aria-hidden="true" />
                  </Button>
                </CollapsibleTrigger>
              </div>
              <CollapsibleContent>
                <ul className="flex flex-col divide-y divide-border">
                  {shownDone.map((g) => (
                    <li key={g.id} className="flex flex-col gap-1 py-3">
                      <EvaluatorHeading g={g} />
                      <ul className="flex flex-col divide-y divide-border ps-11">
                        {g.done.map((r) => <RequestLine key={r.id} row={r} studentId={studentId} />)}
                      </ul>
                    </li>
                  ))}
                </ul>
                {done.length > DONE_LIMIT ? (
                  <Button type="button" variant="outline" size="sm" className="mt-2 self-start" onClick={() => setAllDone((v) => !v)}>
                    {allDone ? "Show fewer" : `Show all ${done.length} evaluators`}
                  </Button>
                ) : null}
              </CollapsibleContent>
            </Collapsible>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
