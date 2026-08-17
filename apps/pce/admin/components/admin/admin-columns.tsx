"use client"

/**
 * Column definitions for the three Admin console hubs.
 *
 * Two things are deliberate here.
 *
 * The People columns are built per view rather than once for all four tabs.
 * Students carry a cohort and faculty carry a department, and showing both
 * columns on both tabs would mean every row has a blank cell. The identity
 * columns stay identical across tabs, which is the whole reason these three
 * record types share one hub.
 *
 * Every row leads to its record through a link inside the name cell, not only
 * through `onRowClick`. A click handler on a table row is invisible to the
 * keyboard, and P6 does not bend for admin surfaces.
 */

import * as React from "react"
import { Link } from "react-router"

import type { ColumnDef } from "@/components/data-table/types"
import {
  NumericCell,
  PersonIdentityCell,
  PillCell,
  RowActionsCell,
  StatusCell,
} from "@/components/data-views"
import { initialsFromDisplayName } from "@/lib/initials-from-name"
import { STATUS_BADGE_TONE_CLASS } from "@/lib/list-status-badges"
import {
  ADMIN_PERSON_TYPE_LABEL,
  ADMIN_SOURCE_ICON,
  ADMIN_SOURCE_LABEL,
  ADMIN_STATUS_LABEL,
  type AdminCourse,
  type AdminPerson,
  type AdminPersonType,
  type AdminPersonnel,
  type AdminRecordStatus,
  type AdminSource,
} from "@/lib/mock/admin-directory"

/* ── Shared bits ──────────────────────────────────────────────────────────── */

const STATUS_TINT: Record<AdminRecordStatus, string> = {
  active: STATUS_BADGE_TONE_CLASS.success,
  invited: STATUS_BADGE_TONE_CLASS.warning,
  inactive: STATUS_BADGE_TONE_CLASS.neutral,
}

const STATUS_ICON: Record<AdminRecordStatus, string> = {
  active: "fa-circle-check",
  invited: "fa-paper-plane",
  inactive: "fa-circle-minus",
}

const TYPE_ICON: Record<AdminPersonType, string> = {
  student: "fa-graduation-cap",
  faculty: "fa-chalkboard-user",
  staff: "fa-user-tie",
}

/** Mutations are not wired: these hubs read mock data and must not pretend. */
const NOT_WIRED = () => {}

function selectOptions(values: string[]) {
  return [...new Set(values.filter(Boolean))].toSorted().map(value => ({ value, label: value }))
}

function statusFilterOptions() {
  return (Object.keys(ADMIN_STATUS_LABEL) as AdminRecordStatus[]).map(status => ({
    value: status,
    label: ADMIN_STATUS_LABEL[status],
  }))
}

function sourceFilterOptions() {
  return (Object.keys(ADMIN_SOURCE_LABEL) as AdminSource[]).map(source => ({
    value: source,
    label: ADMIN_SOURCE_LABEL[source],
  }))
}

function RecordCode({ children }: { children: React.ReactNode }) {
  return <span className="font-mono text-xs tabular-nums text-muted-foreground">{children}</span>
}

/** Names are links, so the anchor swallows the click the row would have taken. */
function RecordLink({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <Link
      to={to}
      onClick={event => event.stopPropagation()}
      className="truncate rounded-sm outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
    >
      {children}
    </Link>
  )
}


/** US short date. A sync timestamp is data, not an id, so no mono. */
function formatDay(iso: string) {
  return new Date(`${iso}T00:00:00`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

function DateCell({ iso }: { iso: string }) {
  return (
    <span className="text-sm tabular-nums whitespace-nowrap text-foreground/90">
      {formatDay(iso)}
    </span>
  )
}

function statusColumn<TRow extends { status: AdminRecordStatus }>(): ColumnDef<TRow> {
  return {
    key: "status",
    label: "Status",
    width: 135,
    minWidth: 118,
    sortable: true,
    sortKey: "status",
    cellKind: "status",
    filter: { options: statusFilterOptions() },
    cell: row => (
      <StatusCell
        label={ADMIN_STATUS_LABEL[row.status]}
        tintClassName={STATUS_TINT[row.status]}
        icon={STATUS_ICON[row.status]}
      />
    ),
  }
}

function sourceColumn<TRow extends { source: AdminSource }>(): ColumnDef<TRow> {
  return {
    key: "source",
    label: "Source",
    width: 150,
    minWidth: 130,
    sortable: true,
    sortKey: "source",
    cellKind: "pill",
    filter: { options: sourceFilterOptions() },
    cell: row => (
      <PillCell label={ADMIN_SOURCE_LABEL[row.source]} icon={ADMIN_SOURCE_ICON[row.source]} />
    ),
  }
}

function lastUpdatedColumn<TRow extends { lastSyncedOn: string }>(): ColumnDef<TRow> {
  return {
    key: "lastSyncedOn",
    label: "Last updated",
    width: 140,
    minWidth: 122,
    sortable: true,
    sortKey: "lastSyncedOn",
    cellKind: "date",
    cell: row => <DateCell iso={row.lastSyncedOn} />,
  }
}

/* ── People ───────────────────────────────────────────────────────────────── */

/** Which tab is asking. `all` is the only one that needs the Type column. */
export type AdminPeopleView = "all" | AdminPersonType

export function buildAdminPeopleColumns(
  rows: AdminPerson[],
  view: AdminPeopleView,
): ColumnDef<AdminPerson>[] {
  const columns: ColumnDef<AdminPerson>[] = [
    {
      key: "name",
      label: "Person",
      width: 265,
      minWidth: 210,
      sortable: true,
      sortKey: "name",
      defaultPin: "left",
      cellKind: "person",
      filter: { type: "text", icon: "fa-font", operators: ["contains", "not_contains"] },
      cell: row => (
        <PersonIdentityCell
          name={row.name}
          email={row.email}
          initials={initialsFromDisplayName(row.name)}
          renderName={name => <RecordLink to={`/people/${row.id}`}>{name}</RecordLink>}
        />
      ),
    },
    {
      key: "personCode",
      label: "ID",
      width: 122,
      minWidth: 108,
      sortable: true,
      sortKey: "personCode",
      cellKind: "text",
      cell: row => <RecordCode>{row.personCode}</RecordCode>,
    },
  ]

  if (view === "all") {
    columns.push({
      key: "type",
      label: "Type",
      width: 130,
      minWidth: 115,
      sortable: true,
      sortKey: "type",
      cellKind: "pill",
      filter: {
        options: (Object.keys(ADMIN_PERSON_TYPE_LABEL) as AdminPersonType[]).map(type => ({
          value: type,
          label: ADMIN_PERSON_TYPE_LABEL[type],
        })),
      },
      cell: row => (
        <PillCell label={ADMIN_PERSON_TYPE_LABEL[row.type]} icon={TYPE_ICON[row.type]} />
      ),
    })
  }

  columns.push({
    key: "program",
    label: "Program",
    width: 160,
    minWidth: 135,
    sortable: true,
    sortKey: "program",
    cellKind: "pill",
    filter: { options: selectOptions(rows.map(r => r.program)) },
    cell: row => <PillCell label={row.program} icon="fa-graduation-cap" />,
  })

  // Students have a cohort and everyone else has a department. On the combined
  // tab the two collapse into one column so neither group shows a blank cell.
  if (view === "all") {
    columns.push({
      key: "group",
      label: "Cohort or department",
      width: 205,
      minWidth: 165,
      sortable: true,
      sortKey: "group",
      cellKind: "text",
      filter: {
        options: selectOptions(rows.map(r => (r.type === "student" ? r.cohort : r.department))),
      },
      cell: row => (
        <span className="text-sm text-foreground/90">
          {row.type === "student" ? row.cohort : row.department}
        </span>
      ),
    })
  } else if (view === "student") {
    columns.push({
      key: "cohort",
      label: "Cohort",
      width: 170,
      minWidth: 145,
      sortable: true,
      sortKey: "cohort",
      cellKind: "pill",
      filter: { options: selectOptions(rows.map(r => r.cohort)) },
      cell: row => <PillCell label={row.cohort} icon="fa-users-rectangle" />,
    })
  } else {
    columns.push({
      key: "department",
      label: "Department",
      width: 205,
      minWidth: 165,
      sortable: true,
      sortKey: "department",
      cellKind: "text",
      filter: { options: selectOptions(rows.map(r => r.department)) },
      cell: row => <span className="text-sm text-foreground/90">{row.department}</span>,
    })
  }

  columns.push(
    statusColumn<AdminPerson>(),
    sourceColumn<AdminPerson>(),
    lastUpdatedColumn<AdminPerson>(),
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
          actions={[
            { label: "Resend invite", icon: "fa-paper-plane", onSelect: NOT_WIRED },
            { label: "Change program", icon: "fa-arrow-right-arrow-left", onSelect: NOT_WIRED },
            { label: "Deactivate", icon: "fa-circle-minus", onSelect: NOT_WIRED },
          ]}
          triggerLabel={`Actions for ${row.name}`}
        />
      ),
    },
  )

  return columns
}

/* ── Courses ──────────────────────────────────────────────────────────────── */

export function buildAdminCourseColumns(rows: AdminCourse[]): ColumnDef<AdminCourse>[] {
  return [
    {
      key: "title",
      label: "Course",
      width: 285,
      minWidth: 220,
      sortable: true,
      sortKey: "title",
      defaultPin: "left",
      cellKind: "text",
      filter: { type: "text", icon: "fa-font", operators: ["contains", "not_contains"] },
      cell: row => (
        <div className="flex min-w-0 flex-col gap-0.5">
          <RecordLink to={`/courses/${row.id}`}>
            <span className="line-clamp-1 text-sm font-medium text-foreground">{row.title}</span>
          </RecordLink>
          <RecordCode>{row.courseCode}</RecordCode>
        </div>
      ),
    },
    {
      key: "program",
      label: "Program",
      width: 160,
      minWidth: 135,
      sortable: true,
      sortKey: "program",
      cellKind: "pill",
      filter: { options: selectOptions(rows.map(r => r.program)) },
      cell: row => <PillCell label={row.program} icon="fa-graduation-cap" />,
    },
    {
      key: "owner",
      label: "Faculty of record",
      width: 240,
      minWidth: 195,
      sortable: true,
      sortKey: "owner",
      cellKind: "person",
      filter: { options: selectOptions(rows.map(r => r.owner)) },
      cell: row => (
        <PersonIdentityCell
          name={row.owner}
          email={row.ownerEmail}
          initials={initialsFromDisplayName(row.owner)}
        />
      ),
    },
    {
      key: "credits",
      label: "Credits",
      width: 96,
      minWidth: 82,
      sortable: true,
      sortKey: "credits",
      cellKind: "numeric",
      cell: row => <NumericCell value={row.credits} />,
    },
    {
      key: "enrolled",
      label: "Enrolled",
      width: 104,
      minWidth: 88,
      sortable: true,
      sortKey: "enrolled",
      cellKind: "numeric",
      cell: row => <NumericCell value={row.enrolled} />,
    },
    {
      key: "delivery",
      label: "Delivery",
      width: 140,
      minWidth: 120,
      sortable: true,
      sortKey: "delivery",
      cellKind: "pill",
      filter: { options: selectOptions(rows.map(r => r.delivery)) },
      cell: row => <PillCell label={row.delivery} icon="fa-chalkboard" />,
    },
    statusColumn<AdminCourse>(),
    sourceColumn<AdminCourse>(),
    lastUpdatedColumn<AdminCourse>(),
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
          actions={[
            { label: "Assign faculty of record", icon: "fa-user-pen", onSelect: NOT_WIRED },
            { label: "Move to another program", icon: "fa-arrow-right-arrow-left", onSelect: NOT_WIRED },
            { label: "Retire course", icon: "fa-circle-minus", onSelect: NOT_WIRED },
          ]}
          triggerLabel={`Actions for ${row.courseCode}`}
        />
      ),
    },
  ]
}

/* ── Personnel ────────────────────────────────────────────────────────────── */

export function buildAdminPersonnelColumns(
  rows: AdminPersonnel[],
): ColumnDef<AdminPersonnel>[] {
  return [
    {
      key: "name",
      label: "Person",
      width: 265,
      minWidth: 210,
      sortable: true,
      sortKey: "name",
      defaultPin: "left",
      cellKind: "person",
      filter: { type: "text", icon: "fa-font", operators: ["contains", "not_contains"] },
      cell: row => (
        <PersonIdentityCell
          name={row.name}
          email={row.email}
          initials={initialsFromDisplayName(row.name)}
          renderName={name => <RecordLink to={`/personnel/${row.id}`}>{name}</RecordLink>}
        />
      ),
    },
    {
      key: "personCode",
      label: "ID",
      width: 118,
      minWidth: 104,
      sortable: true,
      sortKey: "personCode",
      cellKind: "text",
      cell: row => <RecordCode>{row.personCode}</RecordCode>,
    },
    {
      key: "brand",
      label: "Brand",
      width: 205,
      minWidth: 165,
      sortable: true,
      sortKey: "brand",
      cellKind: "pill",
      filter: { options: selectOptions(rows.map(r => r.brand)) },
      cell: row => <PillCell label={row.brand} icon="fa-hospital" />,
    },
    {
      key: "site",
      label: "Site",
      width: 185,
      minWidth: 150,
      sortable: true,
      sortKey: "site",
      cellKind: "text",
      filter: { options: selectOptions(rows.map(r => r.site)) },
      cell: row => <span className="text-sm text-foreground/90">{row.site}</span>,
    },
    {
      key: "role",
      label: "Role",
      width: 165,
      minWidth: 140,
      sortable: true,
      sortKey: "role",
      cellKind: "pill",
      filter: { options: selectOptions(rows.map(r => r.role)) },
      cell: row => <PillCell label={row.role} icon="fa-user-nurse" />,
    },
    {
      key: "credential",
      label: "Credential",
      width: 135,
      minWidth: 115,
      sortable: true,
      sortKey: "credential",
      cellKind: "text",
      filter: { options: selectOptions(rows.map(r => r.credential)) },
      cell: row => (
        <span className="font-mono text-xs tracking-wide text-foreground/90">
          {row.credential}
        </span>
      ),
    },
    statusColumn<AdminPersonnel>(),
    sourceColumn<AdminPersonnel>(),
    lastUpdatedColumn<AdminPersonnel>(),
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
          actions={[
            { label: "Resend invite", icon: "fa-paper-plane", onSelect: NOT_WIRED },
            { label: "Change role", icon: "fa-user-pen", onSelect: NOT_WIRED },
            { label: "Deactivate", icon: "fa-circle-minus", onSelect: NOT_WIRED },
          ]}
          triggerLabel={`Actions for ${row.name}`}
        />
      ),
    },
  ]
}
