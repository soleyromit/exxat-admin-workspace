"use client"

import { LoadingBlocks } from "@/components/v2/shared-loading"
import * as React from "react"
import Link from "next/link"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import { Card, CardContent } from "@exxatdesignux/ui/components/ui/card"
import { KeyMetrics, type MetricItem } from "@exxatdesignux/ui/components/ui/key-metrics"
import { StatusBadge } from "@exxatdesignux/ui/components/ui/status-badge"
import { Tip } from "@exxatdesignux/ui/components/ui/tip"
import { PageFrame, PageSection } from "@/components/skills/page-header"
import { fmtDay } from "@/components/v2/outcomes/version-timeline"
import { StatusPill } from "@/components/v2/status-pill"
import { V2FilterBar, filterValue, v2SelectField } from "@/components/v2/v2-filter-bar"
import { V2Grid, v2col } from "@/components/v2/v2-grid"
import { contextLine } from "@/lib/v2/page-context"
import type { ActiveFilter } from "@exxatdesignux/ui/lib/table-properties-types"
import { SegmentedDots } from "@/components/v2/viz"
import { skillOutcomeRows } from "@/lib/v2/queue-viz"
import { concernsFor, outcomeRows, OUTCOME_WORD, PLAN_STATUS_LABEL, type OutcomeFilter } from "@/lib/v2/outcomes"
import { useV2Hydrated, useV2State } from "@/lib/v2/react"
import type { Evaluation, RoleId } from "@/lib/v2/types"

const FILTERS: Array<{ id: OutcomeFilter; label: string }> = [
  { id: "latest", label: "Latest" },
  { id: "did-not-meet", label: "Did not meet" },
  { id: "not-yet", label: "Not yet" },
  { id: "reopened", label: "Reopened" },
]
const STATUS_WORD: Record<Evaluation["status"], string> = { counted: "Counts", "awaiting-approval": "Awaiting approval", returned: "Returned", reopened: "Reopened" }

/** Walkthrough step 9 for staff: what each outcome did, the remediation plans, the confidential concerns, and the way into version history. */
export function OutcomesPage({ role }: { role: RoleId }) {
  const s = useV2State()
  const hydrated = useV2Hydrated()
  const [filters, setFilters] = React.useState<ActiveFilter[]>([])
  const filter = (filterValue(filters, "outcome") ?? "latest") as OutcomeFilter
  const name = (id: string) => s.people.find((p) => p.id === id)?.name ?? "Unknown person"
  const skill = (id: string) => s.skills.find((k) => k.id === id)?.name ?? "A skill"
  const rows = outcomeRows(s, filter)
  const concerns = concernsFor(s, role)
  const plans = s.remediations.slice().sort((a, b) => Number(a.status === "closed") - Number(b.status === "closed"))
  const base = `/v2/${role}`
  const bySkill = skillOutcomeRows(s)
  const metrics: MetricItem[] = [
    { id: "counted", label: "Evaluations that count", value: s.evaluations.filter((e) => e.status === "counted").length, delta: "", trend: "neutral" },
    { id: "plans", label: "Open remediation plans", value: s.remediations.filter((r) => r.status !== "closed").length, delta: "", trend: "neutral" },
    { id: "reopened", label: "Reopened evaluations", value: s.evaluations.filter((e) => e.status === "reopened").length, delta: "", trend: "neutral" },
    { id: "concerns", label: "Confidential concerns", value: concerns.length, delta: "", trend: "neutral" },
  ]
  if (!hydrated) return <PageFrame title="Outcomes"><LoadingBlocks label="Opening outcomes" rows={5} /></PageFrame>
  return (
    <PageFrame title="Outcomes" subtitle={contextLine(s)}>
      <div className="flex flex-col gap-6" data-outcomes-page>
        <section aria-label="Outcomes summary">
          <KeyMetrics variant="cards" size="sm" showHeader={false} metrics={metrics} metricsSingleRow className="px-0 lg:px-0" />
        </section>

        <PageSection title="Outcomes by skill" id="by-skill">
          {bySkill.length === 0 ? (
            <p className="text-sm text-muted-foreground">No evaluations yet.</p>
          ) : (
            <ul className="flex flex-col divide-y divide-border rounded-lg border border-border bg-card" aria-label="Outcomes by skill" data-outcome-dots>
              {bySkill.map((r) => (
                <li key={r.skillId} className="flex flex-col gap-2 p-3 sm:flex-row sm:items-start sm:gap-4">
                  <div className="flex shrink-0 flex-col gap-0.5 sm:w-56">
                    <span className="text-sm font-medium text-foreground">{r.skill}</span>
                    <span className="text-xs tabular-nums text-muted-foreground">{[`${r.met} met`, r.notYet ? `${r.notYet} not yet` : null, r.notMet ? `${r.notMet} did not meet` : null, r.pending ? `${r.pending} waiting` : null].filter(Boolean).join(", ")}</span>
                  </div>
                  <SegmentedDots label={`${r.skill} outcomes`} size={16} items={r.dots} />
                </li>
              ))}
            </ul>
          )}
          <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground" aria-label="Key" data-outcome-key>
            <li><i className="fa-solid fa-circle-check me-1" style={{ color: "var(--status-badge-success-fg)" }} aria-hidden="true" />Met</li>
            <li><i className="fa-light fa-circle-half-stroke me-1" style={{ color: "var(--status-badge-info-fg)" }} aria-hidden="true" />Not yet</li>
            <li><i className="fa-solid fa-triangle-exclamation me-1" style={{ color: "var(--status-badge-warning-fg)" }} aria-hidden="true" />Did not meet</li>
            <li><i className="fa-light fa-clock me-1" aria-hidden="true" />Waiting for approval</li>
            <li>Oldest on the left</li>
          </ul>
        </PageSection>

        <PageSection title="Evaluations" id="evals">
          <V2FilterBar fields={[v2SelectField("outcome", "Outcome", FILTERS.map((f) => ({ value: f.id, label: f.label })), "fa-flag")]} filters={filters} onChange={setFilters} resultCount={rows.length} resultNoun="evaluations" emptyMessage="No evaluations match this filter." />
          <V2Grid<Evaluation>
            selectable={false}
            caption={`Evaluations, ${FILTERS.find((f) => f.id === filter)?.label.toLowerCase()}`}
            rows={rows}
            emptyText="No evaluations match this filter."
            id={(e) => e.id}
            columns={[
              v2col<Evaluation>("student", "Student", 160, (e) => name(e.studentId)),
              v2col<Evaluation>("skill", "Skill", 220, (e) => skill(e.skillId)),
              v2col<Evaluation>("outcome", "Outcome", 190, (e) => <StatusPill kind="outcome" value={e.outcome} label={e.outcome === "not-met" ? "Did not meet the criteria" : OUTCOME_WORD[e.outcome]} />),
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
        </PageSection>

        <PageSection title={`Remediation plans (${plans.length})`} id="plans">
          {plans.length === 0 ? (
            <p className="text-sm text-muted-foreground">No remediation plans yet.</p>
          ) : (
            <ul className="flex flex-col gap-2" aria-label="Remediation plans">
              {plans.map((r) => (
                <li key={r.id}>
                  <Card size="sm" role="article" aria-labelledby={`plan-${r.id}`} data-plan={r.id}>
                    <CardContent className="flex flex-wrap items-center justify-between gap-3 text-sm">
                      <div className="flex flex-col gap-1">
                        <span id={`plan-${r.id}`} className="font-medium text-foreground">{`${skill(r.skillId)}, ${name(r.studentId)}`}</span>
                        <span className="text-muted-foreground">{`${PLAN_STATUS_LABEL[r.status]}, ${r.steps.filter((x) => x.done).length} of ${r.steps.length} steps`}</span>
                        <SegmentedDots label={`${skill(r.skillId)} plan steps`} size={16} items={r.steps.map((st, n) => ({ id: `${r.id}-${n}`, label: st.label, state: st.done ? "met" : "none" }))} />
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

        <section aria-labelledby="concerns-heading" className="flex flex-col gap-3" id="concerns">
          <div className="flex flex-wrap items-center gap-2">
            <h2 id="concerns-heading" className="text-base font-semibold text-foreground">{`Confidential concerns (${concerns.length})`}</h2>
            <Tip label="Program staff only. A student never sees these, in the app or in an export.">
              <span tabIndex={0} className="rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                <StatusBadge label="Staff only" tone="neutral" icon="fa-lock" size="sm" />
              </span>
            </Tip>
          </div>
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
                        <Link href={`${base}/evaluation/${c.evaluationId}`}>Open evaluation</Link>
                      </Button>
                    </CardContent>
                  </Card>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </PageFrame>
  )
}
