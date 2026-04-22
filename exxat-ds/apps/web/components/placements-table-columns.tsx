"use client"

/**
 * Placements lifecycle columns, empty states, and Properties drawer labels.
 * Owned by the placements data-list feature (`DataListClient` / `/data-list`), not `DataListTable`.
 */

import { Badge } from "@/components/ui/badge"
import type { FilterFieldDef, FilterOperator } from "@/components/table-properties/types"
import type { ColumnDef } from "@/components/data-table/types"
import {
  AvatarCircle,
  HireBadge,
  PLACEMENT_ROW_ACTIONS,
  ReadinessBadge,
  RowActions,
  StatusBadge,
  WeeksProgressCell,
} from "@/components/data-list-table-cells"
import { uniquePlacementFieldOptions, type Placement } from "@/lib/mock/placements"
import type { PlacementLifecycleTabId } from "@/lib/placement-lifecycle"

const COLUMN_SELECT: ColumnDef<Placement> = {
  key: "select",
  label: "",
  width: 40,
  minWidth: 40,
  defaultPin: "left",
  lockPin: true,
}

const COLUMN_ACTIONS: ColumnDef<Placement> = {
  key: "actions",
  label: "",
  width: 48,
  minWidth: 48,
  defaultPin: "right",
  lockPin: true,
  cell: (row) => (
    <div className="flex items-center justify-center">
      <RowActions row={row} actions={PLACEMENT_ROW_ACTIONS} />
    </div>
  ),
}

const CELL_STUDENT: ColumnDef<Placement>["cell"] = (row) => (
  <div className="flex items-center gap-2.5 min-w-0">
    <AvatarCircle initials={row.initials} />
    <div className="flex flex-col min-w-0">
      <span className="font-medium text-foreground text-sm leading-tight truncate">
        {row.student}
      </span>
      <span className="text-xs text-muted-foreground leading-tight mt-0.5 truncate">
        {row.email}
      </span>
    </div>
  </div>
)

const CELL_SITE_LOCATION: ColumnDef<Placement>["cell"] = (row) => (
  <div className="min-w-0" title={`${row.site} · ${row.siteAddress}`}>
    <span className="block truncate text-sm font-medium text-foreground leading-tight">{row.site}</span>
    <span className="block truncate text-xs text-muted-foreground mt-0.5 leading-tight">{row.siteAddress}</span>
  </div>
)

function placementColumnToFilterFieldDef(c: ColumnDef<Placement>): FilterFieldDef | null {
  if (!c.filter) return null
  const f = c.filter
  const defaultOps =
    f.type === "select" || f.type === "date"
      ? (["is", "is_not"] as FilterOperator[])
      : (["contains", "not_contains"] as FilterOperator[])
  return {
    key: c.key,
    label: c.label,
    icon: f.icon ?? "fa-filter",
    type: f.type,
    operators: (f.operators ?? defaultOps) as FilterOperator[],
    options:
      f.type === "date"
        ? uniquePlacementFieldOptions(c.key as keyof Placement)
        : f.options,
  }
}

export function columnsToFilterFields(cols: ColumnDef<Placement>[]): FilterFieldDef[] {
  return cols.map(placementColumnToFilterFieldDef).filter((x): x is FilterFieldDef => x !== null)
}

/** All columns — original placements overview */
const PLACEMENT_COLUMNS_ALL: ColumnDef<Placement>[] = [
  COLUMN_SELECT,
  {
    key: "student",
    label: "Student",
    width: 210,
    minWidth: 180,
    sortable: true,
    sortKey: "student",
    defaultPin: "left",
    filter: {
      type: "select",
      icon: "fa-user",
      operators: ["is", "is_not"],
      options: uniquePlacementFieldOptions("student"),
    },
    cell: CELL_STUDENT,
  },
  {
    key: "specialization",
    label: "Specialization",
    width: 160,
    minWidth: 100,
    sortable: true,
    sortKey: "specialization",
    filter: {
      type: "select",
      icon: "fa-stethoscope",
      operators: ["is", "is_not"],
      options: uniquePlacementFieldOptions("specialization"),
    },
    cell: (row) => (
      <span className="block truncate text-sm text-foreground/80">{row.specialization}</span>
    ),
  },
  {
    key: "site",
    label: "Site",
    width: 180,
    minWidth: 100,
    sortable: true,
    sortKey: "site",
    filter: {
      type: "select",
      icon: "fa-hospital",
      operators: ["is", "is_not"],
      options: uniquePlacementFieldOptions("site"),
    },
    cell: (row) => (
      <div className="min-w-0" title={`${row.site} · ${row.siteAddress}`}>
        <span className="block truncate text-sm font-medium text-foreground leading-tight">{row.site}</span>
        <span className="block truncate text-xs text-muted-foreground mt-0.5 leading-tight">{row.siteAddress}</span>
      </div>
    ),
  },
  {
    key: "status",
    label: "Status",
    width: 130,
    minWidth: 110,
    sortable: true,
    sortKey: "status",
    filter: {
      type: "select",
      icon: "fa-circle-dot",
      operators: ["is", "is_not"],
      options: [
        { value: "confirmed",    label: "Confirmed"    },
        { value: "pending",      label: "Pending"      },
        { value: "under-review", label: "Under Review" },
        { value: "rejected",     label: "Rejected"     },
        { value: "completed",    label: "Completed"    },
      ],
    },
    cell: (row) => <StatusBadge status={row.status} />,
  },
  {
    key: "start",
    label: "Start Date",
    width: 130,
    minWidth: 110,
    sortable: true,
    sortKey: "start",
    filter: {
      type: "date",
      icon: "fa-calendar",
      operators: ["is", "is_not"],
    },
    cell: (row) => (
      <span className="text-sm text-foreground/80 tabular-nums whitespace-nowrap">{row.start}</span>
    ),
  },
  {
    key: "duration",
    label: "Duration",
    width: 96,
    minWidth: 80,
    cell: (row) => (
      <span className="text-sm text-foreground/80 whitespace-nowrap">{row.duration}</span>
    ),
  },
  {
    key: "supervisor",
    label: "Supervisor",
    width: 152,
    minWidth: 100,
    filter: {
      type: "select",
      icon: "fa-user-tie",
      operators: ["is", "is_not"],
      options: uniquePlacementFieldOptions("supervisor"),
    },
    cell: (row) => (
      <span className="block truncate text-sm text-foreground/80">{row.supervisor}</span>
    ),
  },
  COLUMN_ACTIONS,
]

/** Upcoming lifecycle */
const PLACEMENT_COLUMNS_UPCOMING: ColumnDef<Placement>[] = [
  COLUMN_SELECT,
  {
    key: "student",
    label: "Student",
    width: 200,
    minWidth: 170,
    sortable: true,
    sortKey: "student",
    defaultPin: "left",
    filter: {
      type: "select",
      icon: "fa-user",
      operators: ["is", "is_not"],
      options: uniquePlacementFieldOptions("student"),
    },
    cell: CELL_STUDENT,
  },
  {
    key: "site",
    label: "Site & Location",
    width: 200,
    minWidth: 140,
    sortable: true,
    sortKey: "site",
    filter: {
      type: "select",
      icon: "fa-hospital",
      operators: ["is", "is_not"],
      options: uniquePlacementFieldOptions("site"),
    },
    cell: CELL_SITE_LOCATION,
  },
  {
    key: "internship",
    label: "Internship",
    width: 180,
    minWidth: 120,
    sortable: true,
    sortKey: "internship",
    filter: {
      type: "select",
      icon: "fa-briefcase",
      operators: ["is", "is_not"],
      options: uniquePlacementFieldOptions("internship"),
    },
    cell: (row) => <span className="block truncate text-sm text-foreground/80">{row.internship}</span>,
  },
  {
    key: "supervisor",
    label: "Preceptor",
    width: 140,
    minWidth: 100,
    sortable: true,
    sortKey: "supervisor",
    filter: {
      type: "select",
      icon: "fa-user-tie",
      operators: ["is", "is_not"],
      options: uniquePlacementFieldOptions("supervisor"),
    },
    cell: (row) => <span className="block truncate text-sm text-foreground/80">{row.supervisor}</span>,
  },
  {
    key: "specialization",
    label: "Specialization",
    width: 140,
    minWidth: 100,
    sortable: true,
    sortKey: "specialization",
    filter: {
      type: "select",
      icon: "fa-stethoscope",
      operators: ["is", "is_not"],
      options: uniquePlacementFieldOptions("specialization"),
    },
    cell: (row) => <span className="block truncate text-sm text-foreground/80">{row.specialization}</span>,
  },
  {
    key: "start",
    label: "Start Date",
    width: 110,
    minWidth: 100,
    sortable: true,
    sortKey: "start",
    filter: { type: "date", icon: "fa-calendar", operators: ["is", "is_not"] },
    cell: (row) => (
      <span className="text-sm text-foreground/80 tabular-nums whitespace-nowrap">{row.start}</span>
    ),
  },
  {
    key: "compliance",
    label: "Compliance",
    width: 120,
    minWidth: 100,
    sortable: true,
    sortKey: "compliance",
    filter: {
      type: "select",
      icon: "fa-shield-check",
      operators: ["is", "is_not"],
      options: uniquePlacementFieldOptions("compliance"),
    },
    cell: (row) => <span className="text-sm text-foreground/80">{row.compliance}</span>,
  },
  {
    key: "daysUntilStart",
    label: "Days Until Start",
    width: 120,
    minWidth: 100,
    sortable: true,
    sortKey: "daysUntilStart",
    cell: (row) => (
      <span className="text-sm tabular-nums text-foreground/80">
        {row.daysUntilStart > 0 ? `${row.daysUntilStart} days` : "—"}
      </span>
    ),
  },
  {
    key: "readiness",
    label: "Readiness",
    width: 120,
    minWidth: 100,
    sortable: true,
    sortKey: "readiness",
    filter: {
      type: "select",
      icon: "fa-flag",
      operators: ["is", "is_not"],
      options: uniquePlacementFieldOptions("readiness"),
    },
    cell: (row) => <ReadinessBadge value={row.readiness} />,
  },
  COLUMN_ACTIONS,
]

/** Ongoing lifecycle */
const PLACEMENT_COLUMNS_ONGOING: ColumnDef<Placement>[] = [
  COLUMN_SELECT,
  {
    key: "student",
    label: "Student",
    width: 200,
    minWidth: 170,
    sortable: true,
    sortKey: "student",
    defaultPin: "left",
    filter: {
      type: "select",
      icon: "fa-user",
      operators: ["is", "is_not"],
      options: uniquePlacementFieldOptions("student"),
    },
    cell: CELL_STUDENT,
  },
  {
    key: "site",
    label: "Site & Location",
    width: 200,
    minWidth: 140,
    sortable: true,
    sortKey: "site",
    filter: {
      type: "select",
      icon: "fa-hospital",
      operators: ["is", "is_not"],
      options: uniquePlacementFieldOptions("site"),
    },
    cell: CELL_SITE_LOCATION,
  },
  {
    key: "internship",
    label: "Internship",
    width: 180,
    minWidth: 120,
    sortable: true,
    sortKey: "internship",
    filter: {
      type: "select",
      icon: "fa-briefcase",
      operators: ["is", "is_not"],
      options: uniquePlacementFieldOptions("internship"),
    },
    cell: (row) => <span className="block truncate text-sm text-foreground/80">{row.internship}</span>,
  },
  {
    key: "supervisor",
    label: "Preceptor",
    width: 140,
    minWidth: 100,
    sortable: true,
    sortKey: "supervisor",
    filter: {
      type: "select",
      icon: "fa-user-tie",
      operators: ["is", "is_not"],
      options: uniquePlacementFieldOptions("supervisor"),
    },
    cell: (row) => <span className="block truncate text-sm text-foreground/80">{row.supervisor}</span>,
  },
  {
    key: "specialization",
    label: "Specialization",
    width: 140,
    minWidth: 100,
    sortable: true,
    sortKey: "specialization",
    filter: {
      type: "select",
      icon: "fa-stethoscope",
      operators: ["is", "is_not"],
      options: uniquePlacementFieldOptions("specialization"),
    },
    cell: (row) => <span className="block truncate text-sm text-foreground/80">{row.specialization}</span>,
  },
  {
    key: "progressWeeksDone",
    label: "Progress",
    width: 160,
    minWidth: 140,
    sortable: true,
    sortKey: "progressWeeksDone",
    cell: (row) => <WeeksProgressCell row={row} />,
  },
  {
    key: "endDate",
    label: "End Date",
    width: 110,
    minWidth: 100,
    sortable: true,
    sortKey: "endDate",
    filter: { type: "date", icon: "fa-calendar", operators: ["is", "is_not"] },
    cell: (row) => (
      <span className="text-sm text-foreground/80 tabular-nums whitespace-nowrap">{row.endDate}</span>
    ),
  },
  {
    key: "lastCheckin",
    label: "Last Check-In",
    width: 120,
    minWidth: 100,
    sortable: true,
    sortKey: "lastCheckin",
    cell: (row) => (
      <span className="text-sm text-foreground/80 whitespace-nowrap">{row.lastCheckin}</span>
    ),
  },
  COLUMN_ACTIONS,
]

/** Completed lifecycle */
const PLACEMENT_COLUMNS_COMPLETED: ColumnDef<Placement>[] = [
  COLUMN_SELECT,
  {
    key: "student",
    label: "Student",
    width: 200,
    minWidth: 170,
    sortable: true,
    sortKey: "student",
    defaultPin: "left",
    filter: {
      type: "select",
      icon: "fa-user",
      operators: ["is", "is_not"],
      options: uniquePlacementFieldOptions("student"),
    },
    cell: CELL_STUDENT,
  },
  {
    key: "site",
    label: "Site & Location",
    width: 200,
    minWidth: 140,
    sortable: true,
    sortKey: "site",
    filter: {
      type: "select",
      icon: "fa-hospital",
      operators: ["is", "is_not"],
      options: uniquePlacementFieldOptions("site"),
    },
    cell: CELL_SITE_LOCATION,
  },
  {
    key: "internship",
    label: "Internship",
    width: 180,
    minWidth: 120,
    sortable: true,
    sortKey: "internship",
    filter: {
      type: "select",
      icon: "fa-briefcase",
      operators: ["is", "is_not"],
      options: uniquePlacementFieldOptions("internship"),
    },
    cell: (row) => <span className="block truncate text-sm text-foreground/80">{row.internship}</span>,
  },
  {
    key: "supervisor",
    label: "Preceptor",
    width: 140,
    minWidth: 100,
    sortable: true,
    sortKey: "supervisor",
    filter: {
      type: "select",
      icon: "fa-user-tie",
      operators: ["is", "is_not"],
      options: uniquePlacementFieldOptions("supervisor"),
    },
    cell: (row) => <span className="block truncate text-sm text-foreground/80">{row.supervisor}</span>,
  },
  {
    key: "specialization",
    label: "Specialization",
    width: 140,
    minWidth: 100,
    sortable: true,
    sortKey: "specialization",
    filter: {
      type: "select",
      icon: "fa-stethoscope",
      operators: ["is", "is_not"],
      options: uniquePlacementFieldOptions("specialization"),
    },
    cell: (row) => <span className="block truncate text-sm text-foreground/80">{row.specialization}</span>,
  },
  {
    key: "completionDate",
    label: "Completion Date",
    width: 120,
    minWidth: 100,
    sortable: true,
    sortKey: "completionDate",
    filter: { type: "date", icon: "fa-calendar", operators: ["is", "is_not"] },
    cell: (row) => (
      <span className="text-sm text-foreground/80 tabular-nums whitespace-nowrap">{row.completionDate}</span>
    ),
  },
  {
    key: "finalStatus",
    label: "Final Status",
    width: 120,
    minWidth: 100,
    sortable: true,
    sortKey: "finalStatus",
    filter: {
      type: "select",
      icon: "fa-circle-check",
      operators: ["is", "is_not"],
      options: uniquePlacementFieldOptions("finalStatus"),
    },
    cell: (row) => (
      <Badge variant="outline" className="h-6 px-2 py-1 text-xs font-medium leading-none">
        {row.finalStatus}
      </Badge>
    ),
  },
  {
    key: "rating",
    label: "Rating",
    width: 100,
    minWidth: 88,
    sortable: true,
    sortKey: "rating",
    cell: (row) =>
      row.rating > 0 ? (
        <span className="inline-flex items-center gap-1 text-sm font-medium tabular-nums">
          {row.rating.toFixed(1)}
          <i className="fa-solid fa-star text-xs text-chart-4" aria-hidden="true" />
        </span>
      ) : (
        <span className="text-sm text-muted-foreground">—</span>
      ),
  },
  {
    key: "suggestedToHire",
    label: "Suggested To Hire",
    width: 130,
    minWidth: 110,
    sortable: true,
    sortKey: "suggestedToHire",
    filter: {
      type: "select",
      icon: "fa-user-plus",
      operators: ["is", "is_not"],
      options: uniquePlacementFieldOptions("suggestedToHire"),
    },
    cell: (row) => <HireBadge value={row.suggestedToHire} />,
  },
  COLUMN_ACTIONS,
]

export function getPlacementColumnsForLifecycle(tab: PlacementLifecycleTabId): ColumnDef<Placement>[] {
  switch (tab) {
    case "upcoming":
      return PLACEMENT_COLUMNS_UPCOMING
    case "ongoing":
      return PLACEMENT_COLUMNS_ONGOING
    case "completed":
      return PLACEMENT_COLUMNS_COMPLETED
    default:
      return PLACEMENT_COLUMNS_ALL
  }
}

export function emptyCopyForPlacementLifecycleTab(tab: PlacementLifecycleTabId): string {
  switch (tab) {
    case "upcoming":
      return "No upcoming placements match your filters."
    case "ongoing":
      return "No ongoing placements match your filters."
    case "completed":
      return "No completed placements match your filters."
    default:
      return "No placements match your filters."
  }
}

export const placementLifecycleDrawerLabels: Record<PlacementLifecycleTabId, string> = {
  all: "Lifecycle: All placements",
  upcoming: "Lifecycle: Upcoming",
  ongoing: "Lifecycle: Ongoing",
  completed: "Lifecycle: Completed",
}
