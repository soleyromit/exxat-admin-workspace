"use client"

import * as React from "react"
import { Link, useNavigate } from "react-router-dom"
import { HubTable } from "@/components/data-views"
import type { ColumnDef } from "@/components/data-table/types"
import {
  PillCell,
  RowActionsCell,
  type RowActionDef,
} from "@/components/data-views"
import { laCourseDetailHref } from "@/lib/learning-activities-course-detail-nav"
import {
  type CourseOffering,
  type LearningActivityType,
  learningActivityTypeLabel,
} from "@/lib/mock/learning-activities-offerings"

const ACTIVITY_TYPE_FILTER_OPTS = (
  ["forms-evaluations", "patient-log", "timesheet", "time-off"] as LearningActivityType[]
).map(type => ({
  value: type,
  label: learningActivityTypeLabel(type),
}))

const ACTIVITY_ACTION_ICONS: Record<LearningActivityType, string> = {
  "forms-evaluations": "fa-clipboard-list",
  "patient-log": "fa-notes-medical",
  timesheet: "fa-clock",
  "time-off": "fa-calendar-xmark",
}

function buildRowActions(
  row: CourseOffering,
  hubBasePath: string,
  navigate: (href: string) => void,
): RowActionDef<CourseOffering>[] {
  const activityItems: RowActionDef<CourseOffering>[] = row.activityActions.map(action => ({
    label: learningActivityTypeLabel(action.type),
    icon: ACTIVITY_ACTION_ICONS[action.type],
    onSelect: () => navigate(laCourseDetailHref(row.id, { module: action.type }, hubBasePath)),
    disabled: !action.enabled,
  }))

  const hasEnabledAction = row.activityActions.some(action => action.enabled)
  const hasEvaluationReports = row.activityActions.some(
    action => action.enabled && action.type === "forms-evaluations",
  )

  return [
    ...activityItems,
    {
      label: "Set up",
      icon: "fa-gear",
      onSelect: () => navigate(laCourseDetailHref(row.id, { module: "setup" }, hubBasePath)),
      disabled: !hasEnabledAction,
    },
    {
      label: "Reports",
      icon: "fa-chart-line",
      onSelect: () => navigate(laCourseDetailHref(row.id, { module: "reports" }, hubBasePath)),
      disabled: !hasEvaluationReports,
    },
  ]
}

function uniqueSelectOptions(values: string[]) {
  return [...new Set(values.filter(Boolean))].toSorted().map(value => ({ value, label: value }))
}

function buildColumns(
  rows: CourseOffering[],
  hubBasePath: string,
  navigate: (href: string) => void,
): ColumnDef<CourseOffering>[] {
  const termOpts = uniqueSelectOptions(rows.map(r => r.term))
  const cohortOpts = uniqueSelectOptions(rows.map(r => r.cohort))
  const yearOpts = uniqueSelectOptions(rows.map(r => r.academicYear))
  const professionalYearOpts = uniqueSelectOptions(rows.map(r => r.professionalYear))

  return [
    {
      key: "courseName",
      label: "Course Name",
      width: 260,
      minWidth: 180,
      sortable: true,
      sortKey: "courseName",
      defaultPin: "left",
      cellKind: "text",
      filter: { type: "text", icon: "fa-font", operators: ["contains", "not_contains"] },
      cell: row => {
        const href = laCourseDetailHref(row.id, {}, hubBasePath)
        return (
          <Link
            to={href}
            className="flex min-w-0 flex-col gap-0.5 rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            onClick={e => e.stopPropagation()}
          >
            <span className="line-clamp-2 text-sm font-medium text-interactive underline-offset-4 hover:text-interactive-hover-foreground hover:underline">
              {row.courseName}
            </span>
            <span className="font-mono text-xs tabular-nums text-muted-foreground">{row.courseNumber}</span>
          </Link>
        )
      },
    },
    {
      key: "activityTypes",
      label: "Learning Activities",
      filterOnly: true,
      cellKind: "tags",
      filter: {
        type: "select",
        icon: "fa-clipboard-list",
        operators: ["is", "is_not"],
        options: ACTIVITY_TYPE_FILTER_OPTS,
      },
    },
    {
      key: "academicYear",
      label: "Academic Year",
      width: 140,
      minWidth: 120,
      sortable: true,
      sortKey: "academicYear",
      cellKind: "pill",
      filter: { options: yearOpts },
      cell: row => <PillCell label={row.academicYear} icon="fa-calendar-range" />,
    },
    {
      key: "term",
      label: "Term",
      width: 130,
      minWidth: 110,
      sortable: true,
      sortKey: "term",
      cellKind: "pill",
      filter: { options: termOpts },
      cell: row => <PillCell label={row.term} icon="fa-calendar" />,
    },
    {
      key: "cohort",
      label: "Cohort",
      width: 180,
      minWidth: 140,
      sortable: true,
      sortKey: "cohort",
      cellKind: "pill",
      filter: { options: cohortOpts },
      cell: row => <PillCell label={row.cohort} icon="fa-users" />,
    },
    {
      key: "professionalYear",
      label: "Professional Year",
      width: 150,
      minWidth: 130,
      sortable: true,
      sortKey: "professionalYear",
      cellKind: "pill",
      filter: { options: professionalYearOpts },
      cell: row => <PillCell label={row.professionalYear} icon="fa-graduation-cap" />,
    },
    {
      key: "actions",
      label: "Action",
      width: 72,
      minWidth: 72,
      defaultPin: "right",
      lockPin: true,
      cell: row => (
        <RowActionsCell
          row={row}
          actions={buildRowActions(row, hubBasePath, navigate)}
          triggerLabel={`Actions for ${row.courseName}`}
        />
      ),
    },
  ]
}

export interface LearningActivitiesTableProps {
  rows: CourseOffering[]
  persistKey: string
  hubBasePath: string
}

export function LearningActivitiesTable({ rows, persistKey, hubBasePath }: LearningActivitiesTableProps) {
  const navigate = useNavigate()
  const goToDetail = React.useCallback(
    (row: CourseOffering) => navigate(laCourseDetailHref(row.id, {}, hubBasePath)),
    [hubBasePath, navigate],
  )
  const columns = React.useMemo(
    () => buildColumns(rows, hubBasePath, href => navigate(href)),
    [rows, hubBasePath, navigate],
  )

  return (
    <HubTable<CourseOffering>
      rows={rows}
      columns={columns}
      view="table"
      hubLabel="Learning activities"
      lifecycleTabLabel="All courses"
      searchAriaLabel="Search course offerings"
      getRowId={row => row.id}
      getRowSelectionLabel={row => row.courseName}
      defaultSort={{ key: "courseNumber", dir: "asc" }}
      emptyState="No course offerings in this group."
      renderers={{}}
      supportedViewTypes={["table"]}
      persistKey={persistKey}
      selectable={false}
      onRowClick={goToDetail}
      pagination
      paginationInitialPageSize={50}
    />
  )
}
