"use client"

import * as React from "react"
import Link from "next/link"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import { Card } from "@exxatdesignux/ui/components/ui/card"
import { KeyMetrics, type MetricItem } from "@exxatdesignux/ui/components/ui/key-metrics"
import { PageFrame, PageSection } from "@/components/skills/page-header"
import { LoadingBlocks } from "@/components/v2/shared-loading"
import { ChartCard } from "@/components/chart-card"
import { StatusPill } from "@/components/v2/status-pill"
import { BulletMeter, StackedBar } from "@/components/v2/viz"
import { attentionRows, configuredByModel, HOME_LINKS, homeKpis, setupRows, setupSummary, weakestSkills, type HomePill, type HomeRow, type HomeRowSet } from "@/lib/v2/home"
import { contextLine } from "@/lib/v2/page-context"
import { useV2Hydrated, useV2State } from "@/lib/v2/react"
import type { PillValue } from "@/lib/v2/status-pill"

const LINK = "rounded-sm font-medium text-foreground underline underline-offset-2 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"

/** The row's status. The union in lib/v2/home.ts keeps kind and value paired; one cast here satisfies the generic. */
function RowPill({ pill }: { pill: HomePill }) {
  return <StatusPill kind={pill.kind as "skill"} value={pill.value as PillValue<"skill">} label={pill.label} />
}

/** One linked row: status, the skill or student as a link, a detail line, and one action. */
function DashboardRow({ row, primary }: { row: HomeRow; primary: boolean }) {
  return (
    <li className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3" data-dashboard-row={row.key}>
      <div className="flex min-w-0 flex-1 basis-64 flex-col gap-1">
        <div className="flex flex-wrap items-center gap-2">
          <RowPill pill={row.pill} />
          <Link href={row.href} className={`${LINK} text-sm`}>
            {row.name}
          </Link>
        </div>
        <p className="text-sm text-muted-foreground">{row.detail}</p>
      </div>
      <Button asChild variant={primary ? "default" : "outline"} size="sm">
        <Link href={row.action.href} aria-label={row.action.ariaLabel}>
          {row.action.label}
        </Link>
      </Button>
    </li>
  )
}

function RowList({ set, label, firstIsPrimary }: { set: HomeRowSet; label: string; firstIsPrimary?: boolean }) {
  return (
    <Card className="gap-0 py-0">
      <ul className="flex flex-col divide-y divide-border" aria-label={label}>
        {set.rows.map((r, i) => (
          <DashboardRow key={r.key} row={r} primary={!!firstIsPrimary && i === 0} />
        ))}
        {set.overflow.map((o) => (
          <li key={o.key} className="px-4 py-3 text-sm">
            <Link href={o.href} className={LINK}>
              {o.text}
            </Link>
          </li>
        ))}
      </ul>
    </Card>
  )
}

export function AdminHome() {
  const state = useV2State()
  const hydrated = useV2Hydrated()
  const kpi = React.useMemo(() => homeKpis(state), [state])
  const setup = React.useMemo(() => setupSummary(state), [state])
  const setupSet = React.useMemo(() => setupRows(state), [state])
  const attention = React.useMemo(() => attentionRows(state), [state])
  const weak = React.useMemo(() => weakestSkills(state), [state])
  const byModel = React.useMemo(() => configuredByModel(state), [state])
  const { course } = state

  if (!hydrated) {
    return (
      <PageFrame title="Dashboard">
        <LoadingBlocks label="Loading dashboard" rows={4} />
      </PageFrame>
    )
  }

  const metrics: MetricItem[] = [
    { id: "in-use", label: "Skills in use", value: kpi.inUse, delta: "", trend: "neutral", description: `of ${kpi.totalSkills}` },
    { id: "waiting", label: "Waiting for approval", value: kpi.waiting, delta: "", trend: "neutral", trendPolarity: "lower_is_better", description: kpi.stalled > 0 ? `${kpi.stalled} stalled` : undefined },
    { id: "behind", label: "Students behind pace", value: kpi.behind, delta: "", trend: "neutral", trendPolarity: "lower_is_better", description: `of ${kpi.students}` },
    { id: "warnings", label: "Coverage warnings", value: kpi.warnings, delta: "", trend: "neutral", trendPolarity: "lower_is_better", description: kpi.courseCode },
  ]

  const configured = setup.meters.find((m) => m.id === "configured")
  const inUse = setup.meters.find((m) => m.id === "published")
  const mapped = setup.meters.find((m) => m.id === "mapped")
  const inUseCount = inUse?.value ?? 0
  const configuredNotInUse = Math.max(0, (configured?.value ?? 0) - inUseCount)
  const notConfigured = Math.max(0, (configured?.total ?? 0) - (configured?.value ?? 0))
  const attentionClear = attention.rows.length === 0 && attention.overflow.length === 0

  return (
    <PageFrame title="Dashboard" subtitle={contextLine(state)}>
      <div className="flex flex-col gap-6" data-dashboard>
        <section aria-label="Dashboard summary">
          <KeyMetrics variant="cards" size="sm" showHeader={false} metrics={metrics} metricsSingleRow className="px-0 lg:px-0" />
        </section>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <ChartCard title="Library setup" description="Where every skill stands, and how much of the library is in the course." className="h-full">
            <div className="flex h-full flex-col gap-7" data-viz-group="setup-meters">
              <p className="text-sm font-medium text-foreground">Skills by setup state</p>
              <StackedBar
                label="Skills by setup state"
                unit="skill"
                segments={[
                  { id: "in-use", label: "In use", value: inUseCount, tone: "met" },
                  { id: "configured", label: "Configured, not in use", value: configuredNotInUse, tone: "magnitude" },
                  { id: "none", label: "Not configured", value: notConfigured, tone: "muted" },
                ]}
              />
              {byModel.some((m) => m.count > 0) ? (
                <>
                <p className="text-sm font-medium text-foreground">Configured skills by evaluation model</p>
                <StackedBar
                  label="Configured skills by evaluation model"
                  unit="skill"
                  segments={byModel.map((m, i) => ({ id: m.model, label: m.label, value: m.count, tone: (["magnitude", "series2", "series3", "neutral"] as const)[i] }))}
                />
                </>
              ) : null}
              {mapped && mapped.total > 0 ? <BulletMeter label={mapped.label} value={mapped.value} required={mapped.total} valueText={`${mapped.value} of ${mapped.total} skills in use`} /> : null}
            </div>
          </ChartCard>

          <ChartCard title="Weakest mandatory skills" description="Students by state on each skill, weakest first." className="h-full">
            <div className="flex flex-col gap-4">
              {weak.length === 0 ? (
                <p className="text-sm text-muted-foreground" data-weak-empty>
                  No mandatory skills in use yet.
                </p>
              ) : null}
              <ul className="flex flex-col gap-4">
                {weak.map((k) => (
                  <li key={k.skillId} className="flex flex-col gap-1.5">
                    <Link href={HOME_LINKS.reports} className={`${LINK} self-start text-sm`}>
                      {k.name}
                    </Link>
                    <StackedBar
                      label={`${k.name}, students by state`}
                      unit="student"
                      segments={[
                        { id: "achieved", label: "Achieved", value: k.achieved, tone: "met" },
                        { id: "progress", label: "In progress", value: k.inProgress, tone: "magnitude" },
                        { id: "not-yet", label: "Not met yet", value: k.notMetYet, tone: "notMet" },
                        { id: "none", label: "Not started", value: k.notStarted, tone: "muted" },
                      ]}
                    />
                  </li>
                ))}
              </ul>
              {weak.length > 0 ? (
                <Button asChild variant="outline" size="sm" className="self-start">
                  <Link href={HOME_LINKS.reports}>Open Reports</Link>
                </Button>
              ) : null}
            </div>
          </ChartCard>
        </div>

        <PageSection title="Set up" id="setup">
          {setup.complete ? (
            <Card className="py-4">
              <p className="px-4 text-sm text-muted-foreground">{`Every skill is configured, in use and in ${course.code}.`}</p>
            </Card>
          ) : (
            <RowList set={setupSet} label="Set up" firstIsPrimary />
          )}
        </PageSection>

        <PageSection title="Needs attention" id="attention">
          {attentionClear ? (
            <Card className="py-4">
              <p className="px-4 text-sm text-muted-foreground">Nothing is waiting.</p>
            </Card>
          ) : (
            <RowList set={attention} label="Needs attention" />
          )}
        </PageSection>
      </div>
    </PageFrame>
  )
}
