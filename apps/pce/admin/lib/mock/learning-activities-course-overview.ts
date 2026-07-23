/**
 * Course offering overview — aggregated KPIs and module snapshots for the
 * Overview tab. Numbers represent full backend rollups (hundreds of log /
 * timesheet / time-off rows), not the small mock samples used by detail tables.
 */

import type { MetricInsight, MetricItem } from "@/components/key-metrics"
import type { StatusBadgeTone } from "@/components/ui/status-badge"
import type { CourseDetailModule, CourseFormsPanel } from "@/lib/learning-activities-course-detail-nav"
import {
  courseFormReviewRows,
  courseFormRows,
  courseGradebookRows,
  coursePracticumRows,
  courseReportRows,
} from "@/lib/mock/learning-activities-course-detail"
import {
  learningActivityTypeLabel,
  type CourseOffering,
  type LearningActivityType,
} from "@/lib/mock/learning-activities-offerings"

/** Backend-style rollups keyed by offering id (falls back to `default`). */
type OfferingRollups = {
  studentsEnrolled: number
  formSubmitted: number
  formExpected: number
  formsPendingReview: number
  formsUndistributed: number
  patientLogEntries: number
  patientLogPending: number
  timesheetHoursApproved: number
  timesheetHoursPending: number
  timeOffRequests: number
  timeOffPending: number
  gradebookPublished: boolean
}

const OFFERING_ROLLUPS: Record<string, OfferingRollups> = {
  "co-1": {
    studentsEnrolled: 28,
    formSubmitted: 8,
    formExpected: 42,
    formsPendingReview: 14,
    formsUndistributed: 2,
    patientLogEntries: 312,
    patientLogPending: 18,
    timesheetHoursApproved: 186.5,
    timesheetHoursPending: 12.25,
    timeOffRequests: 23,
    timeOffPending: 4,
    gradebookPublished: false,
  },
  "co-2": {
    studentsEnrolled: 16,
    formSubmitted: 18,
    formExpected: 32,
    formsPendingReview: 6,
    formsUndistributed: 2,
    patientLogEntries: 184,
    patientLogPending: 9,
    timesheetHoursApproved: 96,
    timesheetHoursPending: 4.5,
    timeOffRequests: 11,
    timeOffPending: 2,
    gradebookPublished: false,
  },
  default: {
    studentsEnrolled: 24,
    formSubmitted: 12,
    formExpected: 36,
    formsPendingReview: 8,
    formsUndistributed: 1,
    patientLogEntries: 240,
    patientLogPending: 12,
    timesheetHoursApproved: 120,
    timesheetHoursPending: 8,
    timeOffRequests: 15,
    timeOffPending: 3,
    gradebookPublished: false,
  },
}

function rollupsForOffering(offeringId: string): OfferingRollups {
  return OFFERING_ROLLUPS[offeringId] ?? OFFERING_ROLLUPS.default
}

function isActivityEnabled(offering: CourseOffering, type: LearningActivityType): boolean {
  return offering.activityActions.some(action => action.type === type && action.enabled)
}

function activityDisabledReason(
  offering: CourseOffering,
  type: LearningActivityType,
): string | undefined {
  return offering.activityActions.find(action => action.type === type)?.disabledReason
}

export interface CourseOverviewAction {
  id: string
  label: string
  description?: string
  icon: string
  module: CourseDetailModule
  formsPanel?: CourseFormsPanel
  count?: number
  emphasis?: "primary" | "default"
}

export interface CourseOverviewWarning {
  title: string
  message: string
  action?: CourseOverviewAction
}

export interface CourseWhatsNewItem {
  id: string
  title: string
  subtitle: string
  occurredAt: string
  module: CourseDetailModule
  formsPanel?: CourseFormsPanel
}

export interface CourseModuleSnapshot {
  id: CourseDetailModule
  title: string
  enabled: boolean
  disabledReason?: string
  statusLabel: string
  statusTone: StatusBadgeTone
  summary: string
  detail?: string
}

export function courseOfferingOverviewMetrics(
  offeringId: string,
  offering: CourseOffering,
): MetricItem[] {
  const rollups = rollupsForOffering(offeringId)
  const formRows = courseFormRows(offeringId)
  const submitted = formRows.reduce((sum, row) => sum + (row.submittedCount ?? 0), 0)
  const expected = formRows.reduce((sum, row) => sum + (row.submittedTotal ?? 0), 0)
  const formSubmitted = expected > 0 ? submitted : rollups.formSubmitted
  const formExpected = expected > 0 ? expected : rollups.formExpected
  const pendingReview =
    courseFormReviewRows(offeringId).filter(row =>
      Object.values(row.formStatuses).some(status => status === "in-progress" || status === "not-started"),
    ).length || rollups.formsPendingReview

  const metrics: MetricItem[] = [
    {
      id: "submissions",
      label: "Form submissions",
      value: `${formSubmitted}/${formExpected}`,
      delta: "",
      trend: "neutral",
      description:
        pendingReview > 0 ? `${pendingReview} pending review` : "received this term",
    },
    {
      id: "logs",
      label: "Patient log entries",
      value: String(rollups.patientLogEntries),
      delta: "",
      trend: "neutral",
      trendPolarity: "informational",
      description:
        rollups.patientLogPending > 0
          ? `${rollups.patientLogPending} awaiting approval`
          : "logged this term",
    },
    {
      id: "hours",
      label: "Clinical hours",
      value: `${rollups.timesheetHoursApproved}h`,
      delta: "",
      trend: "neutral",
      description:
        rollups.timesheetHoursPending > 0
          ? `${rollups.timesheetHoursPending}h pending approval`
          : "approved",
    },
    {
      id: "students",
      label: "Students",
      value: String(
        Math.max(rollups.studentsEnrolled, courseGradebookRows(offeringId).length || rollups.studentsEnrolled),
      ),
      delta: "",
      trend: "neutral",
      trendPolarity: "informational",
      description: "enrolled in offering",
    },
  ]

  return metrics.slice(0, 4)
}

/** Module targets for overview KPI tiles (arrow affordance → tab). */
export const COURSE_OVERVIEW_METRIC_TARGETS: Record<
  string,
  { module: CourseDetailModule; formsPanel?: CourseFormsPanel }
> = {
  submissions: { module: "forms-evaluations", formsPanel: "review" },
  logs: { module: "patient-log" },
  hours: { module: "timesheet" },
  students: { module: "gradebook" },
}

/** Leo insight rail beside overview KPIs (same shape as library hubs). */
export function courseOfferingOverviewInsight(
  offeringId: string,
  offering: CourseOffering,
): MetricInsight {
  const rollups = rollupsForOffering(offeringId)
  const formRows = courseFormRows(offeringId)
  const undistributed =
    formRows.filter(row => !row.distributedTotal).length || rollups.formsUndistributed
  const pendingReview = rollups.formsPendingReview
  const alerts: string[] = []

  if (isActivityEnabled(offering, "forms-evaluations") && pendingReview > 0) {
    alerts.push(
      `${pendingReview} submission${pendingReview === 1 ? "" : "s"} pending review`,
    )
  }
  if (isActivityEnabled(offering, "forms-evaluations") && undistributed > 0) {
    alerts.push(`${undistributed} form${undistributed === 1 ? "" : "s"} not yet distributed`)
  }
  if (isActivityEnabled(offering, "patient-log") && rollups.patientLogPending > 0) {
    alerts.push(
      `${rollups.patientLogPending} patient log${rollups.patientLogPending === 1 ? "" : "s"} awaiting approval`,
    )
  }

  if (alerts.length > 0) {
    return {
      title: "Action needed",
      description: `${alerts.slice(0, 2).join(" · ")}.`,
      severity: "warning",
      actionLabel: "Ask Leo",
    }
  }

  return {
    title: "Offering on track",
    description: `${rollups.studentsEnrolled} students enrolled · form submissions and clinical hours look current for this term.`,
    severity: "info",
    actionLabel: "Ask Leo",
  }
}

export function courseOfferingStaticQuickActions(
  offering: CourseOffering,
): CourseOverviewAction[] {
  const catalog: Array<
    Omit<CourseOverviewAction, "count" | "description" | "emphasis"> & {
      activity?: LearningActivityType
      always?: boolean
    }
  > = [
    {
      id: "distribute-forms",
      label: "Distribute forms",
      icon: "fa-paper-plane",
      module: "forms-evaluations",
      activity: "forms-evaluations",
    },
    {
      id: "review-forms",
      label: "Review submissions",
      icon: "fa-clipboard-check",
      module: "forms-evaluations",
      formsPanel: "review",
      activity: "forms-evaluations",
    },
    {
      id: "review-logs",
      label: "Review patient logs",
      icon: "fa-notes-medical",
      module: "patient-log",
      activity: "patient-log",
    },
    {
      id: "review-timesheets",
      label: "Review timesheets",
      icon: "fa-clock",
      module: "timesheet",
      activity: "timesheet",
    },
    {
      id: "review-time-off",
      label: "Review time off",
      icon: "fa-calendar-clock",
      module: "time-off",
      activity: "time-off",
    },
    {
      id: "upload-grades",
      label: "Upload final grades",
      icon: "fa-arrow-up-from-bracket",
      module: "gradebook",
      always: true,
    },
    {
      id: "create-report",
      label: "Create report",
      icon: "fa-chart-column",
      module: "reports",
      always: true,
    },
    {
      id: "configure",
      label: "Configure offering",
      icon: "fa-gear",
      module: "setup",
      always: true,
    },
  ]

  return catalog
    .filter(entry => entry.always || (entry.activity && isActivityEnabled(offering, entry.activity)))
    .map(({ activity: _activity, always: _always, ...action }) => action)
}

/** @deprecated Use {@link courseOfferingStaticQuickActions} — dynamic counts removed. */
export function courseOfferingOverviewActions(
  offeringId: string,
  offering: CourseOffering,
): CourseOverviewAction[] {
  return courseOfferingStaticQuickActions(offering)
}

export function courseOfferingOverviewWarning(
  offeringId: string,
  offering: CourseOffering,
): CourseOverviewWarning | null {
  const rollups = rollupsForOffering(offeringId)
  const actions = courseOfferingOverviewActions(offeringId, offering)
  const primaryAction = actions.find(action => action.emphasis === "primary") ?? actions[0]

  const alerts: string[] = []
  if (isActivityEnabled(offering, "forms-evaluations") && rollups.formsPendingReview > 0) {
    alerts.push(
      `${rollups.formsPendingReview} submission${rollups.formsPendingReview === 1 ? "" : "s"} pending review`,
    )
  }
  const formRows = courseFormRows(offeringId)
  const undistributed =
    formRows.filter(row => !row.distributedTotal).length || rollups.formsUndistributed
  if (isActivityEnabled(offering, "forms-evaluations") && undistributed > 0) {
    alerts.push(`${undistributed} form${undistributed === 1 ? "" : "s"} not yet distributed`)
  }
  if (isActivityEnabled(offering, "patient-log") && rollups.patientLogPending > 0) {
    alerts.push(
      `${rollups.patientLogPending} patient log${rollups.patientLogPending === 1 ? "" : "s"} awaiting approval`,
    )
  }
  if (!rollups.gradebookPublished) {
    alerts.push("gradebook not published for this term")
  }

  if (alerts.length === 0) return null

  return {
    title: "Action needed before midterm checkpoint",
    message: `${alerts.slice(0, 3).join(" · ")}.`,
    action: primaryAction,
  }
}

export function courseOfferingWhatsNewItems(offeringId: string): CourseWhatsNewItem[] {
  const items: CourseWhatsNewItem[] = []

  for (const row of courseFormRows(offeringId)) {
    if (!row.isNew) continue
    items.push({
      id: `form-${row.id}`,
      title: row.name,
      subtitle: "New form added to this offering",
      occurredAt: "Added this week",
      module: "forms-evaluations",
    })
  }
  for (const row of courseFormReviewRows(offeringId)) {
    if (!row.isNew) continue
    items.push({
      id: `review-${row.id}`,
      title: row.studentName,
      subtitle: "New submission ready for review",
      occurredAt: "Today",
      module: "forms-evaluations",
      formsPanel: "review",
    })
  }
  for (const row of coursePracticumRows(offeringId)) {
    if (!row.isNew) continue
    items.push({
      id: `log-${row.id}`,
      title: row.studentName,
      subtitle: "New patient log activity",
      occurredAt: "Yesterday",
      module: "patient-log",
    })
  }
  for (const row of courseReportRows(offeringId)) {
    if (!row.isNew) continue
    items.push({
      id: `report-${row.id}`,
      title: row.name,
      subtitle: row.description,
      occurredAt: "This week",
      module: "reports",
    })
  }

  return items.slice(0, 5)
}

export function courseOfferingModuleSnapshots(
  offeringId: string,
  offering: CourseOffering,
): CourseModuleSnapshot[] {
  const rollups = rollupsForOffering(offeringId)
  const formRows = courseFormRows(offeringId)
  const formCount = formRows.length
  const undistributed = formRows.filter(row => !row.distributedTotal).length || rollups.formsUndistributed
  const submitted = formRows.reduce((sum, row) => sum + (row.submittedCount ?? 0), 0)
  const expected = formRows.reduce((sum, row) => sum + (row.submittedTotal ?? 0), 0)
  const formSubmitted = expected > 0 ? submitted : rollups.formSubmitted
  const formExpected = expected > 0 ? expected : rollups.formExpected
  const reportCount = courseReportRows(offeringId).length
  const studentCount = Math.max(rollups.studentsEnrolled, courseGradebookRows(offeringId).length)

  const activityModules: LearningActivityType[] = [
    "forms-evaluations",
    "patient-log",
    "timesheet",
    "time-off",
  ]

  const snapshots: CourseModuleSnapshot[] = activityModules.map(type => {
    const enabled = isActivityEnabled(offering, type)
    const label = learningActivityTypeLabel(type)

    if (!enabled) {
      return {
        id: type,
        title: label,
        enabled: false,
        disabledReason: activityDisabledReason(offering, type),
        statusLabel: "Disabled",
        statusTone: "neutral",
        summary: "Not enabled for this offering",
      }
    }

    if (type === "forms-evaluations") {
      const pending = rollups.formsPendingReview
      return {
        id: type,
        title: label,
        enabled: true,
        statusLabel: pending > 0 ? `${pending} pending review` : "On track",
        statusTone: pending > 0 ? "warning" : "success",
        summary: `${formSubmitted} of ${formExpected} submissions across ${formCount} forms`,
        detail: undistributed > 0 ? `${undistributed} form${undistributed === 1 ? "" : "s"} not yet distributed` : undefined,
      }
    }

    if (type === "patient-log") {
      const pending = rollups.patientLogPending
      return {
        id: type,
        title: label,
        enabled: true,
        statusLabel: pending > 0 ? `${pending} pending approval` : "Current",
        statusTone: pending > 0 ? "warning" : "success",
        summary: `${rollups.patientLogEntries} encounters logged this term`,
        detail: "Rollup across all student placements",
      }
    }

    if (type === "timesheet") {
      const pending = rollups.timesheetHoursPending
      return {
        id: type,
        title: label,
        enabled: true,
        statusLabel: pending > 0 ? `${pending}h pending` : "Current",
        statusTone: pending > 0 ? "warning" : "success",
        summary: `${rollups.timesheetHoursApproved} approved clinical hours`,
        detail: `${rollups.timesheetHoursPending}h awaiting approval`,
      }
    }

    return {
      id: type,
      title: label,
      enabled: true,
      statusLabel: rollups.timeOffPending > 0 ? `${rollups.timeOffPending} pending` : "Current",
      statusTone: rollups.timeOffPending > 0 ? "warning" : "success",
      summary: `${rollups.timeOffRequests} requests this term`,
      detail: rollups.timeOffPending > 0 ? `${rollups.timeOffPending} awaiting decision` : undefined,
    }
  })

  snapshots.push({
    id: "gradebook",
    title: "Gradebook",
    enabled: true,
    statusLabel: rollups.gradebookPublished ? "Published" : "Not published",
    statusTone: rollups.gradebookPublished ? "success" : "warning",
    summary: `${studentCount} students in gradebook`,
    detail: rollups.gradebookPublished ? "Final grades posted" : "Upload final grades when ready",
  })

  snapshots.push({
    id: "reports",
    title: "Reports",
    enabled: true,
    statusLabel: reportCount > 0 ? `${reportCount} saved` : "None yet",
    statusTone: "neutral",
    summary: reportCount > 0 ? `${reportCount} reports for this offering` : "Create a report from templates",
    detail: reportCount > 0 ? "Includes form, log, and timesheet rollups" : undefined,
  })

  return snapshots
}
