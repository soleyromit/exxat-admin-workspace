import * as React from "react"
import { KeyMetrics, type MetricItem } from "@exxatdesignux/ui/components/ui/key-metrics"
import type { Kpis } from "@/lib/store"
import { r4 } from "@/lib/copy"

/**
 * Four bordered KPI cards (prototype P-01; the set is a [PROTO] choice, not REQ). Labels, values and captions are the
 * prototype's strings: "3.2 / 9", "Below 50% achievement in view". No `alert` tint on the attention KPI: the DS warning tint
 * fails WCAG contrast in a real browser (axe, 2026-10-08), and the number plus its sentence already carry the meaning.
 * The impossible-combination state hides this strip entirely (prototype 16).
 */
export function KpiStrip({ kpis }: { kpis: Kpis }) {
  const metrics: MetricItem[] = [
    { id: "students", label: r4.kpis[0], value: kpis.studentsInView, delta: "", trend: "neutral", description: r4.kpiHelp.students },
    { id: "average", label: r4.kpis[1], value: `${kpis.averageAchieved.toFixed(1)} / ${kpis.skillsInScope}`, delta: "", trend: "neutral", description: r4.kpiHelp.average },
    { id: "all", label: r4.kpis[2], value: kpis.studentsAchievingAll, delta: "", trend: "neutral", description: r4.kpiHelp.all(kpis.studentsAchievingAllPct) },
    { id: "attention", label: r4.kpis[3], value: kpis.skillsNeedingAttention, delta: "", trend: "neutral", description: r4.kpiHelp.attention },
  ]
  return <KeyMetrics variant="cards" size="sm" showHeader={false} metrics={metrics} metricsSingleRow className="px-0 lg:px-0" />
}
