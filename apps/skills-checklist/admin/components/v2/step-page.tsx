"use client"

import * as React from "react"
import Link from "next/link"
import { Badge } from "@exxatdesignux/ui/components/ui/badge"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@exxatdesignux/ui/components/ui/card"
import { LocalBanner } from "@exxatdesignux/ui/components/ui/banner"
import { PageFrame, PageSection } from "@/components/skills/page-header"
import { CountersTable } from "@/components/v2/counters-table"
import { ROLE_BY_ID } from "@/lib/v2/roles"
import { STEP_BY_ID, STEPS } from "@/lib/v2/scenario"
import { personName } from "@/lib/v2/selectors"
import { useV2State, useV2Store } from "@/lib/v2/react"
import { toggleStepReviewed } from "@/lib/v2/store"

/**
 * Foundation page for one scenario step: title, who acts, requirement IDs, a live precondition check and live store
 * counters, plus one working control (mark the step reviewed) that writes to the store and the audit log so state
 * carry is visible across pages. The real screen replaces the body in the stage named on the page.
 */
export function StepPage({ stepId }: { stepId: string }) {
  const step = STEP_BY_ID[stepId]
  const state = useV2State()
  const store = useV2Store()
  if (!step) return null
  const role = ROLE_BY_ID[step.role]
  const met = step.precondition.check(state)
  const reviewed = step.id in state.stepsReviewed
  const prev = STEPS[step.n - 2]
  const next = STEPS[step.n]
  const recent = state.audit.slice(0, 5)
  return (
    <PageFrame
      title={step.title}
      subtitle={`Step ${step.n} of ${STEPS.length}. ${role.label}: ${personName(state, role.personId)}.`}
      actions={
        <Button
          type="button"
          variant={reviewed ? "outline" : "default"}
          size="default"
          aria-pressed={reviewed}
          onClick={() => store.update((s) => toggleStepReviewed(s, step.id, step.title, role.personId, new Date().toISOString()))}
        >
          {reviewed ? "Unmark step as reviewed" : "Mark step as reviewed"}
        </Button>
      }
    >
      <LocalBanner variant="info" title="Foundation page">
        {`The full screen for this step is built in stage ${step.stage}. The numbers below already come from the shared demo data.`}
      </LocalBanner>

      <PageSection title="What happens here" id="what">
        <Card>
          <CardContent className="flex flex-col gap-3 text-sm">
            <p>{step.summary}</p>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-muted-foreground">Requirements</span>
              {step.reqIds.length ? (
                step.reqIds.map((id) => (
                  <Badge key={id} variant="outline">
                    {id}
                  </Badge>
                ))
              ) : (
                <span className="text-muted-foreground">None yet. This step is not covered by the requirements document.</span>
              )}
            </div>
          </CardContent>
        </Card>
      </PageSection>

      <PageSection title="Starting condition" id="precondition" description="The demo data this step needs before it makes sense.">
        <Card>
          <CardHeader className="flex-row items-center justify-between gap-3">
            <CardTitle asChild className="text-sm font-normal">
              <p>{step.precondition.text}</p>
            </CardTitle>
            <Badge variant={met ? "secondary" : "outline"}>{met ? "Met" : "Not met"}</Badge>
          </CardHeader>
          {met ? null : (
            <CardContent>
              <CardDescription>Use Reset demo in the Scenario menu to restore the starting data.</CardDescription>
            </CardContent>
          )}
        </Card>
      </PageSection>

      <PageSection title="Live demo data" id="counters" description="Read from the shared store. Marking this step reviewed adds a line to the audit log below.">
        <CountersTable ids={[...step.counters, "reviewed", "audit"]} caption={`Live demo data for step ${step.n}`} />
      </PageSection>

      <PageSection title="Latest audit entries" id="audit">
        <ul className="flex flex-col gap-1 text-sm">
          {recent.map((a) => (
            <li key={a.id} className="flex flex-wrap gap-x-2 text-muted-foreground">
              <span className="text-foreground">{a.action}</span>
              <span>{a.target}</span>
              <span>by {personName(state, a.actorId)}</span>
            </li>
          ))}
        </ul>
      </PageSection>

      <nav aria-label="Step navigation" className="flex flex-wrap gap-2">
        {prev ? (
          <Button asChild variant="outline" size="default">
            <Link href={prev.route}>{`Previous: ${prev.title}`}</Link>
          </Button>
        ) : null}
        {next ? (
          <Button asChild variant="outline" size="default">
            <Link href={next.route}>{`Next: ${next.title}`}</Link>
          </Button>
        ) : null}
      </nav>
    </PageFrame>
  )
}
