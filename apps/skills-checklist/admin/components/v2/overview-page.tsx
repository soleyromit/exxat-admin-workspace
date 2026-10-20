"use client"

import * as React from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Badge } from "@exxatdesignux/ui/components/ui/badge"
import { LocalBanner } from "@exxatdesignux/ui/components/ui/banner"
import { PageFrame, PageSection } from "@/components/skills/page-header"
import { CountersTable } from "@/components/v2/counters-table"
import { ROLE_BY_ID } from "@/lib/v2/roles"
import { STEPS, type ScenarioStep } from "@/lib/v2/scenario"
import { V2Grid, v2col } from "@/components/v2/v2-grid"
import { useV2State } from "@/lib/v2/react"

export function OverviewPage() {
  const state = useV2State()
  const justReset = useSearchParams()?.get("reset") === "1"
  const [dismissed, setDismissed] = React.useState(false)
  return (
    <PageFrame
      title="Connected prototype v2"
      subtitle={`${state.program.school} ${state.program.name}, ${state.course.code} ${state.course.name}. One shared set of demo data across all 14 steps.`}
    >
      {justReset && !dismissed ? (
        <LocalBanner variant="success" title="Demo data reset" dismissible onDismiss={() => setDismissed(true)}>
          Everything is back to the starting data for the scenario.
        </LocalBanner>
      ) : null}
      <PageSection title="Story steps" id="steps" description="Open a step directly, or follow them in order. Each step shows the requirement IDs it traces to.">
        <V2Grid<ScenarioStep>
          caption="Scenario steps"
          rows={STEPS}
          id={(s) => s.id}
          columns={[
            v2col<ScenarioStep>("n", "Step", 70, (s) => <span className="tabular-nums">{s.n}</span>),
            v2col<ScenarioStep>("title", "Title", 420, (s) => (
              <Link href={s.route} className="rounded-sm underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                {s.title}
              </Link>
            )),
            v2col<ScenarioStep>("role", "Role", 180, (s) => ROLE_BY_ID[s.role].label),
            v2col<ScenarioStep>("status", "Status", 140, (s) => (s.id in state.stepsReviewed ? <Badge variant="secondary">Reviewed</Badge> : <Badge variant="outline">Not reviewed</Badge>)),
          ]}
        />
      </PageSection>
      <PageSection title="Shared demo data" id="data" description="Every number comes from the same store. Change something in one step and it shows up here.">
        <CountersTable caption="Shared demo data" />
      </PageSection>
    </PageFrame>
  )
}
