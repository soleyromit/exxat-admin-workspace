import type { MetricInsight, MetricItem } from "@/components/key-metrics"
import type { QuestionBankItem } from "@/lib/mock/question-bank"

export function questionBankKpiMetrics(rows: QuestionBankItem[]): MetricItem[] {
  const published = rows.filter(r => r.status === "published").length
  const draft = rows.filter(r => r.status === "draft").length
  const review = rows.filter(r => r.status === "in_review").length

  return [
    {
      id: "total",
      label: "Total questions",
      value: rows.length,
      delta: "—",
      trend: "neutral",
      href: "#",
      metricVariant: "hero",
    },
    {
      id: "published",
      label: "Published",
      value: published,
      delta: "—",
      trend: "neutral",
      href: "#",
    },
    {
      id: "review",
      label: "In review",
      value: review,
      delta: review > 0 ? "!" : "—",
      trend: review > 0 ? "up" : "neutral",
      href: "#",
    },
    {
      id: "draft",
      label: "Drafts",
      value: draft,
      delta: "—",
      trend: "neutral",
      href: "#",
    },
  ]
}

export function questionBankKpiInsight(rows: QuestionBankItem[]): MetricInsight {
  const review = rows.filter(r => r.status === "in_review").length
  const draft = rows.filter(r => r.status === "draft").length
  return {
    title: "Question bank",
    description:
      review > 0
        ? `${review} item(s) in review. ${draft} draft(s) not yet published.`
        : draft > 0
          ? `${draft} draft(s) ready to finalize or send for review.`
          : "All items are published or in review with no backlog.",
    severity: review > 2 ? "warning" : "info",
    actionLabel: "Ask Leo",
  }
}
