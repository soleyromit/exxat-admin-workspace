import type { MetricItem } from "@/components/key-metrics"
import {
  type CourseOffering,
  offeringActivityTypes,
} from "@/lib/mock/learning-activities-offerings"

export function learningActivitiesKpiMetrics(rows: CourseOffering[]): MetricItem[] {
  const withForms = rows.filter(r => offeringActivityTypes(r).includes("forms-evaluations")).length
  const withLogs = rows.filter(r => offeringActivityTypes(r).includes("patient-log")).length
  const cohorts = new Set(rows.map(r => r.cohort)).size

  return [
    {
      id: "offerings",
      label: "Course offerings",
      value: String(rows.length),
      delta: "",
      trend: "neutral",
      description: "In scope",
    },
    {
      id: "forms",
      label: "With evaluations",
      value: String(withForms),
      delta: "",
      trend: "neutral",
      description: "Linked",
    },
    {
      id: "logs",
      label: "With patient logs",
      value: String(withLogs),
      delta: "",
      trend: "neutral",
      description: "Linked",
    },
    {
      id: "cohorts",
      label: "Cohorts",
      value: String(cohorts),
      delta: "",
      trend: "neutral",
      description: "Represented",
    },
  ]
}
