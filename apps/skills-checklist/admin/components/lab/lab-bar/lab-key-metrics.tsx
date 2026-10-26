"use client"

import * as React from "react"
import { KeyMetrics, type MetricItem } from "@exxatdesignux/ui/components/ui/key-metrics"
import { useLabHref } from "./page-context"

export type { MetricItem }

/**
 * DS KeyMetrics whose figure links (and insight link) stay in the active option set, like LabLink: the DS renders
 * `href` itself, so a plain lab URL there would leave the set. Lab files import it as `KeyMetrics`.
 */
export function LabKeyMetrics(props: React.ComponentProps<typeof KeyMetrics>) {
  const to = useLabHref()
  const metrics = React.useMemo(() => props.metrics.map((m) => (m.href ? { ...m, href: to(m.href) } : m)), [props.metrics, to])
  const insight = props.insight?.href ? { ...props.insight, href: to(props.insight.href) } : props.insight
  return <KeyMetrics {...props} metrics={metrics} insight={insight} />
}
