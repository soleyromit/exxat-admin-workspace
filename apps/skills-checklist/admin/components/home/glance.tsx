import * as React from "react"
import { KeyMetrics, type MetricItem } from "@exxatdesignux/ui/components/ui/key-metrics"
import { home } from "@/lib/copy/home"
import type { HomeSummary } from "@/lib/home/derive"

/**
 * At a glance: four counts, no deltas, no attainment (RP-02), no skill-status counts (OD-03). A figure that could not be
 * loaded reads "Not available", never zero. While counts refresh it reads "Updating" (contract 9.3 P).
 */
export function Glance({ summary: s, unavailable = false, updating = false }: { summary: HomeSummary; unavailable?: boolean; updating?: boolean }) {
  const v = (n: number): string | number => (unavailable ? home.unavailable : updating ? home.updating : n)
  const metrics: MetricItem[] = [
    { id: "active", label: home.glance.active, value: v(s.configuredActive), delta: "", trend: "neutral", description: home.glance.activeHelp },
    { id: "mapped", label: home.glance.mapped, value: v(s.mapped), delta: "", trend: "neutral", description: home.glance.mappedHelp },
    { id: "offerings", label: home.glance.offerings, value: v(s.offerings), delta: "", trend: "neutral", description: home.glance.offeringsHelp(s.offeringsWithSkills) },
    { id: "students", label: home.glance.students, value: v(s.students), delta: "", trend: "neutral", description: home.glance.studentsHelp },
  ]
  return (
    <section aria-label={home.aria.summary} data-testid="glance">
      <KeyMetrics variant="compact" size="sm" showHeader={false} metrics={metrics} metricsSingleRow className="px-0 lg:px-0" />
    </section>
  )
}
