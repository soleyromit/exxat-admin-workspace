"use client"

/**
 * Column definitions for the four Exxat One hubs.
 *
 * Cells come from `@/components/data-views` rather than being inlined
 * (`exxat-table-column-cells`), every data column carries a `cellKind` so the
 * filter bar can infer its control, and record codes are the only thing set in
 * `font-mono` (`exxat-mono-ids`).
 */

import * as React from "react"

import type { ColumnDef } from "@/components/data-table/types"
import {
  NumericCell,
  PersonIdentityCell,
  PillCell,
  ProgressCell,
  RowActionsCell,
  StatusCell,
} from "@/components/data-views"
import { initialsFromDisplayName } from "@/lib/initials-from-name"
import { STATUS_BADGE_TONE_CLASS } from "@/lib/list-status-badges"
import {
  ONE_CLEARANCE_LABEL,
  ONE_REQUEST_LABEL,
  type OneClearanceState,
  type OneLocation,
  type OneRequestState,
  type OneSlotRequest,
} from "@/lib/mock/one-hubs"

/* ── Shared bits ──────────────────────────────────────────────────────────── */

const CLEARANCE_TINT: Record<OneClearanceState, string> = {
  cleared: STATUS_BADGE_TONE_CLASS.success,
  "action-needed": STATUS_BADGE_TONE_CLASS.danger,
  "in-review": STATUS_BADGE_TONE_CLASS.warning,
}

const CLEARANCE_ICON: Record<OneClearanceState, string> = {
  cleared: "fa-circle-check",
  "action-needed": "fa-triangle-exclamation",
  "in-review": "fa-clock",
}

const REQUEST_TINT: Record<OneRequestState, string> = {
  accepted: STATUS_BADGE_TONE_CLASS.success,
  pending: STATUS_BADGE_TONE_CLASS.warning,
  declined: STATUS_BADGE_TONE_CLASS.danger,
  draft: STATUS_BADGE_TONE_CLASS.neutral,
}

const REQUEST_ICON: Record<OneRequestState, string> = {
  accepted: "fa-circle-check",
  pending: "fa-clock",
  declined: "fa-circle-xmark",
  draft: "fa-pen-line",
}

function MonoCode({ children }: { children: React.ReactNode }) {
  return (
    <span className="font-mono text-xs tabular-nums text-muted-foreground">{children}</span>
  )
}

function TitleCell({ title, code }: { title: string; code: string }) {
  return (
    <div className="flex min-w-0 flex-col gap-0.5">
      <span className="line-clamp-2 text-sm font-medium text-foreground">{title}</span>
      <MonoCode>{code}</MonoCode>
    </div>
  )
}

/**
 * Row actions here are illustrative: the hubs read from mock data and none of
 * these mutations exist yet, so the menu shows the shape of the work without
 * pretending to perform it.
 */
const NOT_WIRED = () => {}

function selectOptions(values: string[]) {
  return [...new Set(values.filter(Boolean))].toSorted().map(value => ({ value, label: value }))
}

/** US short date. Dates are data, not IDs — no mono. */
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

/* ── One — Sites · Locations ──────────────────────────────────────────────── */

export function buildOneLocationColumns(rows: OneLocation[]): ColumnDef<OneLocation>[] {
  return [
    {
      key: "name",
      label: "Location",
      width: 220,
      minWidth: 175,
      sortable: true,
      sortKey: "name",
      defaultPin: "left",
      cellKind: "text",
      filter: { type: "text", icon: "fa-font", operators: ["contains", "not_contains"] },
      cell: row => <TitleCell title={row.name} code={row.locationCode} />,
    },
    {
      key: "brand",
      label: "Brand",
      width: 200,
      minWidth: 160,
      sortable: true,
      sortKey: "brand",
      cellKind: "pill",
      filter: { options: selectOptions(rows.map(r => r.brand)) },
      cell: row => <PillCell label={row.brand} icon="fa-hospital" />,
    },
    {
      key: "specialty",
      label: "Specialty",
      width: 145,
      minWidth: 125,
      sortable: true,
      sortKey: "specialty",
      cellKind: "pill",
      filter: { options: selectOptions(rows.map(r => r.specialty)) },
      cell: row => <PillCell label={row.specialty} icon="fa-stethoscope" />,
    },
    {
      key: "city",
      label: "City",
      width: 135,
      minWidth: 118,
      sortable: true,
      sortKey: "city",
      cellKind: "text",
      filter: { options: selectOptions(rows.map(r => r.city)) },
      cell: row => <span className="text-sm text-foreground/90">{row.city}</span>,
    },
    {
      key: "placed",
      label: "Seats filled",
      width: 150,
      minWidth: 130,
      sortable: true,
      sortKey: "placed",
      cellKind: "progress",
      cell: row => (
        <ProgressCell
          value={Math.round((row.placed / row.capacity) * 100)}
          label={`${row.placed} of ${row.capacity} seats filled`}
        />
      ),
    },
    {
      key: "clearance",
      label: "Clearance",
      width: 160,
      minWidth: 145,
      sortable: true,
      sortKey: "clearance",
      cellKind: "status",
      filter: {
        options: (Object.keys(ONE_CLEARANCE_LABEL) as OneClearanceState[]).map(state => ({
          value: state,
          label: ONE_CLEARANCE_LABEL[state],
        })),
      },
      cell: row => (
        <StatusCell
          label={ONE_CLEARANCE_LABEL[row.clearance]}
          tintClassName={CLEARANCE_TINT[row.clearance]}
          icon={CLEARANCE_ICON[row.clearance]}
        />
      ),
    },
    {
      key: "coordinator",
      label: "Site coordinator",
      width: 225,
      minWidth: 190,
      sortable: true,
      sortKey: "coordinator",
      cellKind: "person",
      cell: row => (
        <PersonIdentityCell
          name={row.coordinator}
          email={row.coordinatorEmail}
          initials={initialsFromDisplayName(row.coordinator)}
        />
      ),
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
          actions={[
            { label: "View roster", icon: "fa-users", onSelect: NOT_WIRED },
            { label: "Edit capacity", icon: "fa-pen-line", onSelect: NOT_WIRED },
            { label: "Message coordinator", icon: "fa-envelope", onSelect: NOT_WIRED },
          ]}
          triggerLabel={`Actions for ${row.name}`}
        />
      ),
    },
  ]
}

/* ── One — Sites · Slot requests ──────────────────────────────────────────── */

export function buildOneSlotRequestColumns(
  rows: OneSlotRequest[],
): ColumnDef<OneSlotRequest>[] {
  return [
    {
      key: "school",
      label: "School",
      width: 230,
      minWidth: 180,
      sortable: true,
      sortKey: "school",
      defaultPin: "left",
      cellKind: "text",
      filter: { options: selectOptions(rows.map(r => r.school)) },
      cell: row => <TitleCell title={row.school} code={row.requestCode} />,
    },
    {
      key: "program",
      label: "Program",
      width: 225,
      minWidth: 170,
      sortable: true,
      sortKey: "program",
      cellKind: "pill",
      filter: { options: selectOptions(rows.map(r => r.program)) },
      cell: row => <PillCell label={row.program} icon="fa-graduation-cap" />,
    },
    {
      key: "location",
      label: "Location",
      width: 235,
      minWidth: 180,
      sortable: true,
      sortKey: "location",
      cellKind: "text",
      filter: { options: selectOptions(rows.map(r => r.location)) },
      cell: row => <span className="text-sm text-foreground/90">{row.location}</span>,
    },
    {
      key: "rotation",
      label: "Rotation",
      width: 170,
      minWidth: 140,
      sortable: true,
      sortKey: "rotation",
      cellKind: "pill",
      filter: { options: selectOptions(rows.map(r => r.rotation)) },
      cell: row => <PillCell label={row.rotation} icon="fa-clipboard-list" />,
    },
    {
      key: "seats",
      label: "Seats",
      width: 85,
      minWidth: 70,
      sortable: true,
      sortKey: "seats",
      cellKind: "numeric",
      cell: row => <NumericCell value={row.seats} />,
    },
    {
      key: "startsOn",
      label: "Starts",
      width: 130,
      minWidth: 115,
      sortable: true,
      sortKey: "startsOn",
      cellKind: "date",
      cell: row => <DateCell iso={row.startsOn} />,
    },
    {
      key: "state",
      label: "Status",
      width: 145,
      minWidth: 125,
      sortable: true,
      sortKey: "state",
      cellKind: "status",
      filter: {
        options: (Object.keys(ONE_REQUEST_LABEL) as OneRequestState[]).map(state => ({
          value: state,
          label: ONE_REQUEST_LABEL[state],
        })),
      },
      cell: row => (
        <StatusCell
          label={ONE_REQUEST_LABEL[row.state]}
          tintClassName={REQUEST_TINT[row.state]}
          icon={REQUEST_ICON[row.state]}
        />
      ),
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
          actions={[
            { label: "Accept request", icon: "fa-circle-check", onSelect: NOT_WIRED },
            { label: "Propose another date", icon: "fa-calendar-pen", onSelect: NOT_WIRED },
            { label: "Decline", icon: "fa-circle-xmark", onSelect: NOT_WIRED },
          ]}
          triggerLabel={`Actions for ${row.requestCode}`}
        />
      ),
    },
  ]
}

/* ── One — Schools · Explore & apply ──────────────────────────────────────── */

