// ─────────────────────────────────────────────────────────────────────────────
// Team page — KPI strip (mirrors placements-kpi pattern for primary list template)
// ─────────────────────────────────────────────────────────────────────────────

import type { MetricInsight, MetricItem } from "@/components/key-metrics"
import type { TeamMember } from "@/lib/mock/team"

export function teamKpiMetrics(members: TeamMember[]): MetricItem[] {
  const active = members.filter(m => m.status === "active").length
  const away = members.filter(m => m.status === "away").length
  const invited = members.filter(m => m.status === "invited").length
  return [
    {
      id: "total-members",
      label: "Total members",
      value: members.length,
      delta: "+2",
      trend: "up",
      href: "#",
      metricVariant: "hero",
    },
    {
      id: "active",
      label: "Active",
      value: active,
      delta: "—",
      trend: "neutral",
      href: "#",
    },
    {
      id: "away",
      label: "Away",
      value: away,
      delta: "—",
      trend: "neutral",
      href: "#",
    },
    {
      id: "invited",
      label: "Invited",
      value: invited,
      delta: invited > 0 ? "+1" : "—",
      trend: invited > 0 ? "up" : "neutral",
      href: "#",
    },
  ]
}

export function teamKpiInsight(members: TeamMember[]): MetricInsight {
  const invited = members.filter(m => m.status === "invited").length
  return {
    title: "Pending invites",
    description:
      invited > 0
        ? `${invited} invitation(s) outstanding. Resend or revoke from the roster.`
        : "No pending invitations.",
    severity: invited > 0 ? "warning" : "info",
    actionLabel: "Ask Leo",
  }
}
