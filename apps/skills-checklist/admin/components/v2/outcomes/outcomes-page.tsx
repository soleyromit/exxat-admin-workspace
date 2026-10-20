"use client"

import * as React from "react"
import Link from "next/link"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import { Card, CardContent } from "@exxatdesignux/ui/components/ui/card"
import { StatusBadge } from "@exxatdesignux/ui/components/ui/status-badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@exxatdesignux/ui/components/ui/tabs"
import { PageFrame, PageSection } from "@/components/skills/page-header"
import { OUTCOME_TONE, fmtDay } from "@/components/v2/outcomes/version-timeline"
import { V2Grid, v2col } from "@/components/v2/v2-grid"
import { concernsFor, outcomeRows, OUTCOME_WORD, PLAN_STATUS_LABEL, type OutcomeFilter } from "@/lib/v2/outcomes"
import { useV2State } from "@/lib/v2/react"
import type { Evaluation, RoleId } from "@/lib/v2/types"

const FILTERS: Array<{ id: OutcomeFilter; label: string }> = [
  { id: "latest", label: "Latest" },
  { id: "did-not-meet", label: "Did not meet" },
  { id: "not-yet", label: "Not yet" },
  { id: "reopened", label: "Reopened" },
]
const STATUS_WORD: Record<Evaluation["status"], string> = { counted: "Counts", "awaiting-approval": "Awaiting approval", returned: "Returned", reopened: "Reopened" }

/** Scenario step 9 for staff: what each outcome did, the remediation plans, the confidential concerns, and the way into version history. */
export function OutcomesPage({ role }: { role: RoleId }) {
  const s = useV2State()
  const [filter, setFilter] = React.useState<OutcomeFilter>("latest")
  const name = (id: string) => s.people.find((p) => p.id === id)?.name ?? "Unknown person"
  const skill = (id: string) => s.skills.find((k) => k.id === id)?.name ?? "A skill"
  const rows = outcomeRows(s, filter)
  const concerns = concernsFor(s, role)
  const plans = s.remediations.slice().sort((a, b) => Number(a.status === "closed") - Number(b.status === "closed"))
  const base = `/v2/${role}`
  const summary: Array<[string, number, string]> = [
    ["Evaluations that count", s.evaluations.filter((e) => e.status === "counted").length, "counted"],
    ["Open remediation plans", s.remediations.filter((r) => r.status !== "closed").length, "plans"],
    ["Reopened evaluations", s.evaluations.filter((e) => e.status === "reopened").length, "reopened"],
    ["Confidential concerns", concerns.length, "concerns"],
  ]
  return (
    <PageFrame title="Outcomes and remediation" subtitle={`${s.course.code}, ${s.course.term}. What each evaluation did to a student's record, and what happens after a fail.`}>
      <div className="flex flex-col gap-6" data-outcomes-page>
        <Card>
          <CardContent>
            <dl className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-4" aria-label="Outcome summary">
              {summary.map(([label, n, key]) => (
                <div key={key} className="flex flex-col gap-0.5">
                  <dt className="text-muted-foreground">{label}</dt>
                  <dd className="text-2xl font-semibold tabular-nums text-foreground" data-summary={key}>{n}</dd>
                </div>
              ))}
            </dl>
          </CardContent>
        </Card>

        <PageSection title="Evaluations" id="evals" description="The newest first. Open one to see every version and, if needed, reopen it.">
          <Tabs value={filter} onValueChange={(v) => setFilter(v as OutcomeFilter)}>
            <TabsList variant="line" aria-label="Filter evaluations" className="rounded-md focus-visible:ring-3 focus-visible:ring-ring/50">
              {FILTERS.map((f) => (
                <TabsTrigger key={f.id} value={f.id}>{f.label}</TabsTrigger>
              ))}
            </TabsList>
            <TabsContent value={filter} className="rounded-md pt-3 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
          <V2Grid<Evaluation>
            caption={`Evaluations, ${FILTERS.find((f) => f.id === filter)?.label.toLowerCase()}`}
            rows={rows}
            id={(e) => e.id}
            columns={[
              v2col<Evaluation>("student", "Student", 160, (e) => name(e.studentId)),
              v2col<Evaluation>("skill", "Skill", 220, (e) => skill(e.skillId)),
              v2col<Evaluation>("outcome", "Outcome", 190, (e) => <StatusBadge label={e.outcome === "not-met" ? "Did not meet the criteria" : OUTCOME_WORD[e.outcome]} tone={OUTCOME_TONE[e.outcome].tone} icon={OUTCOME_TONE[e.outcome].icon} size="sm" />),
              v2col<Evaluation>("status", "Status", 140, (e) => STATUS_WORD[e.status]),
              v2col<Evaluation>("version", "Version", 90, (e) => `v${e.currentVersion}`),
              v2col<Evaluation>("date", "Date", 90, (e) => fmtDay(e.versions[e.versions.length - 1]?.at ?? e.date)),
              v2col<Evaluation>("open", "History", 150, (e) => (
                <Button asChild variant="outline" size="sm">
                  <Link href={`${base}/evaluation/${e.id}`} aria-label={`Version history of ${skill(e.skillId)} for ${name(e.studentId)}`}>Version history</Link>
                </Button>
              )),
            ]}
          />
            </TabsContent>
          </Tabs>
        </PageSection>

        <PageSection title={`Remediation plans (${plans.length})`} id="plans" description="Opened when a student does not meet a skill whose failure path says so, or by staff.">
          {plans.length === 0 ? (
            <p className="text-sm text-muted-foreground">No remediation plans. A plan opens when a student does not meet a skill whose failure path says so, or when staff open one.</p>
          ) : (
            <ul className="flex flex-col gap-2" aria-label="Remediation plans">
              {plans.map((r) => (
                <li key={r.id}>
                  <Card size="sm" role="article" aria-labelledby={`plan-${r.id}`} data-plan={r.id}>
                    <CardContent className="flex flex-wrap items-center justify-between gap-3 text-sm">
                      <div className="flex flex-col gap-0.5">
                        <span id={`plan-${r.id}`} className="font-medium text-foreground">{`${skill(r.skillId)}, ${name(r.studentId)}`}</span>
                        <span className="text-muted-foreground">{`${PLAN_STATUS_LABEL[r.status]}. ${r.steps.filter((x) => x.done).length} of ${r.steps.length} steps done.`}</span>
                      </div>
                      <Button asChild variant="outline" size="sm">
                        <Link href={`${base}/remediation/${r.id}`} aria-label={`Open the remediation plan for ${skill(r.skillId)}, ${name(r.studentId)}`}>Open plan</Link>
                      </Button>
                    </CardContent>
                  </Card>
                </li>
              ))}
            </ul>
          )}
        </PageSection>

        <PageSection title={`Confidential concerns (${concerns.length})`} id="concerns" description="Program staff only. A student never sees these, in the app or in an export.">
          {concerns.length === 0 ? (
            <p className="text-sm text-muted-foreground">No confidential concerns.</p>
          ) : (
            <ul className="flex flex-col gap-2" aria-label="Confidential concerns">
              {concerns.map((c) => (
                <li key={c.id}>
                  <Card size="sm" data-concern={c.id}>
                    <CardContent className="flex flex-col gap-1 text-sm">
                      <span className="font-medium text-foreground">{`About ${name(c.studentId)}, raised by ${name(c.raisedById)} on ${fmtDay(c.at)}`}</span>
                      <span className="text-foreground">{c.note}</span>
                      <Button asChild variant="link" size="sm" className="h-auto justify-start p-0">
                        <Link href={`${base}/evaluation/${c.evaluationId}`}>See the evaluation</Link>
                      </Button>
                    </CardContent>
                  </Card>
                </li>
              ))}
            </ul>
          )}
        </PageSection>
      </div>
    </PageFrame>
  )
}
