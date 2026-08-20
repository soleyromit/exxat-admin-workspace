"use client"

import { GettingStarted } from "@/components/onboarding/getting-started"
import { KeyMetrics, type MetricInsight, type MetricItem } from "@/components/key-metrics"
import { ChartsOverview, type ChartCardVariant } from "@/components/charts-overview"

export interface DashboardReportDeferredContentProps {
  metrics: MetricItem[]
  insight: MetricInsight
  chartVariant: ChartCardVariant
}

/**
 * Heavy dashboard report body. Kept behind React.lazy so the first dashboard
 * paint can show the header and KPI strip before loading Recharts.
 */
export function DashboardReportDeferredContent({
  metrics,
  insight,
  chartVariant,
}: DashboardReportDeferredContentProps) {
  return (
    <>
      <ChartsOverview variant={chartVariant} />
      <GettingStarted />
      <div className="px-4 lg:px-6">
        <KeyMetrics
          variant="card"
          title="Period Comparison"
          description="Same metrics across comparison periods"
          metrics={metrics}
          defaultPeriod="month"
        />
      </div>
    </>
  )
}
