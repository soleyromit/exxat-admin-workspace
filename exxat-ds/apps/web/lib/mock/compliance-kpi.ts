import type { MetricInsight, MetricItem } from "@/components/key-metrics"
import type { ComplianceItem } from "@/lib/mock/compliance"

export function complianceKpiMetrics(rows: ComplianceItem[]): MetricItem[] {
  const compliant = rows.filter(r => r.status === "compliant").length
  const dueSoon = rows.filter(r => r.status === "due_soon").length
  const overdue = rows.filter(r => r.status === "overdue").length
  const pending = rows.filter(r => r.status === "pending").length

  return [
    {
      id: "total",
      label: "Total items",
      value: rows.length,
      delta: "—",
      trend: "neutral",
      href: "#",
      metricVariant: "hero",
    },
    {
      id: "compliant",
      label: "Compliant",
      value: compliant,
      delta: "—",
      trend: "neutral",
      href: "#",
    },
    {
      id: "attention",
      label: "Due soon",
      value: dueSoon,
      delta: dueSoon > 0 ? "!" : "—",
      trend: dueSoon > 0 ? "up" : "neutral",
      href: "#",
    },
    {
      id: "risk",
      label: "Overdue / pending",
      value: overdue + pending,
      delta: "—",
      trend: overdue + pending > 0 ? "up" : "neutral",
      href: "#",
    },
  ]
}

export function complianceKpiInsight(rows: ComplianceItem[]): MetricInsight {
  const overdue = rows.filter(r => r.status === "overdue").length
  const dueSoon = rows.filter(r => r.status === "due_soon").length
  return {
    title: "Compliance queue",
    description:
      overdue > 0
        ? `${overdue} item(s) overdue. ${dueSoon} due within 30 days.`
        : dueSoon > 0
          ? `${dueSoon} item(s) due soon — review owners and dates.`
          : "No overdue items in this view.",
    severity: overdue > 0 ? "warning" : dueSoon > 0 ? "warning" : "info",
    actionLabel: "Ask Leo",
  }
}
