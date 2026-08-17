"use client"

/**
 * Delivery tracker columns — registry fields + UI delivery overlay.
 */

import * as React from "react"

import type { ColumnDef } from "@/components/data-table/types"
import {
  ExternalLinkCell,
  PillCell,
  RelativeTimeCell,
  RowActionsCell,
  StatusCell,
  type RowActionDef,
} from "@/components/data-views"
import { STATUS_BADGE_TONE_CLASS } from "@/lib/list-status-badges"
import {
  DELIVERY_TRACKER_PACKAGE_TIERS,
  PACKAGE_DOC_STATUS_LABEL,
  UI_DELIVERY_LABEL,
  type DeliveryTrackerRow,
  type UiDeliveryStatus,
} from "@/lib/delivery-tracker"
import type { DesignSystemDocStatus } from "@/lib/design-system/registry"
import { DESIGN_SYSTEM_TIER_LABEL } from "@/lib/design-system/registry"

const PACKAGE_STATUS_TONE: Record<DesignSystemDocStatus, keyof typeof STATUS_BADGE_TONE_CLASS> = {
  live: "success",
  catalog: "info",
  skeleton: "warning",
  planned: "neutral",
}

const PACKAGE_STATUS_ICON: Record<DesignSystemDocStatus, string> = {
  live: "fa-circle-check",
  catalog: "fa-books",
  skeleton: "fa-cube",
  planned: "fa-clock",
}

const DELIVERY_TONE: Record<UiDeliveryStatus, keyof typeof STATUS_BADGE_TONE_CLASS> = {
  delivered: "success",
  in_progress: "info",
  not_started: "neutral",
}

const DELIVERY_ICON: Record<UiDeliveryStatus, string> = {
  delivered: "fa-circle-check",
  in_progress: "fa-spinner",
  not_started: "fa-circle",
}

const DELIVERY_OPTIONS = (Object.keys(UI_DELIVERY_LABEL) as UiDeliveryStatus[]).map(
  status => ({
    value: status,
    label: UI_DELIVERY_LABEL[status],
    icon: DELIVERY_ICON[status],
    tintClassName: STATUS_BADGE_TONE_CLASS[DELIVERY_TONE[status]],
  }),
)

function selectOptions(values: string[]) {
  return [...new Set(values.filter(Boolean))].toSorted().map(value => ({
    value,
    label: value,
  }))
}

export function buildDeliveryTrackerColumns({
  rows,
  onDeliveryChange,
  onEdit,
  onMarkDelivered,
}: {
  rows: DeliveryTrackerRow[]
  onDeliveryChange: (row: DeliveryTrackerRow, next: UiDeliveryStatus) => void
  onEdit: (row: DeliveryTrackerRow) => void
  onMarkDelivered: (row: DeliveryTrackerRow) => void
}): ColumnDef<DeliveryTrackerRow>[] {
  const tierOptions = DELIVERY_TRACKER_PACKAGE_TIERS.map(tier => ({
    value: DESIGN_SYSTEM_TIER_LABEL[tier],
    label: DESIGN_SYSTEM_TIER_LABEL[tier],
  }))
  const groupOptions = selectOptions(rows.map(r => r.group))
  const packageStatusOptions = (
    Object.keys(PACKAGE_DOC_STATUS_LABEL) as DesignSystemDocStatus[]
  ).map(status => ({
    value: PACKAGE_DOC_STATUS_LABEL[status],
    label: PACKAGE_DOC_STATUS_LABEL[status],
  }))
  const deliveryOptions = (Object.keys(UI_DELIVERY_LABEL) as UiDeliveryStatus[]).map(
    status => ({
      value: UI_DELIVERY_LABEL[status],
      label: UI_DELIVERY_LABEL[status],
    }),
  )

  return [
    {
      key: "name",
      label: "Name",
      width: 220,
      minWidth: 180,
      sortable: true,
      sortKey: "name",
      defaultPin: "left",
      cellKind: "text",
      filter: { type: "text", icon: "fa-font", operators: ["contains", "not_contains"] },
      cell: row => (
        <div className="flex min-w-0 flex-col gap-0.5">
          <span className="truncate text-sm font-medium text-foreground">{row.name}</span>
          <span className="truncate font-mono text-xs tabular-nums text-muted-foreground">
            {row.id}
          </span>
        </div>
      ),
    },
    {
      key: "tierLabel",
      label: "Tier",
      width: 140,
      minWidth: 120,
      sortable: true,
      sortKey: "tierLabel",
      cellKind: "pill",
      filter: { type: "select", icon: "fa-layer-group", options: tierOptions },
      cell: row => <PillCell label={row.tierLabel} icon="fa-layer-group" />,
    },
    {
      key: "group",
      label: "Group",
      width: 140,
      minWidth: 120,
      sortable: true,
      sortKey: "group",
      cellKind: "text",
      filter: { type: "select", icon: "fa-folder", options: groupOptions },
      cell: row => (
        <span className="truncate text-sm text-foreground/90">{row.group}</span>
      ),
    },
    {
      key: "packageStatusLabel",
      label: "In package",
      width: 130,
      minWidth: 120,
      sortable: true,
      sortKey: "packageStatusLabel",
      cellKind: "status",
      filter: { type: "select", icon: "fa-box", options: packageStatusOptions },
      cell: row => (
        <StatusCell
          label={row.packageStatusLabel}
          tintClassName={STATUS_BADGE_TONE_CLASS[PACKAGE_STATUS_TONE[row.packageStatus]]}
          icon={PACKAGE_STATUS_ICON[row.packageStatus]}
        />
      ),
    },
    {
      key: "deliveryLabel",
      label: "UI delivery",
      width: 160,
      minWidth: 145,
      sortable: true,
      sortKey: "deliveryLabel",
      cellKind: "status",
      filter: { type: "select", icon: "fa-flag", options: deliveryOptions },
      cell: row => (
        <StatusCell
          label={row.deliveryLabel}
          value={row.delivery}
          tintClassName={STATUS_BADGE_TONE_CLASS[DELIVERY_TONE[row.delivery]]}
          icon={DELIVERY_ICON[row.delivery]}
          options={DELIVERY_OPTIONS}
          onChange={next => onDeliveryChange(row, next as UiDeliveryStatus)}
          changeLabel={`Change UI delivery. Currently ${row.deliveryLabel}.`}
        />
      ),
    },
    {
      key: "storybookUrl",
      label: "Storybook",
      width: 160,
      minWidth: 140,
      sortable: true,
      sortKey: "storybookUrl",
      cellKind: "external-link",
      filter: { type: "text", icon: "fa-link", operators: ["contains", "not_contains"] },
      cell: row => <ExternalLinkCell url={row.storybookUrl || null} label="Storybook" />,
    },
    {
      key: "comment",
      label: "Comment",
      width: 220,
      minWidth: 160,
      sortable: true,
      sortKey: "comment",
      cellKind: "text",
      filter: { type: "text", icon: "fa-comment", operators: ["contains", "not_contains"] },
      cell: row =>
        row.comment ? (
          <span className="line-clamp-2 text-sm text-foreground/90">{row.comment}</span>
        ) : (
          <span className="text-sm text-muted-foreground">None</span>
        ),
    },
    {
      key: "updatedAt",
      label: "Updated",
      width: 130,
      minWidth: 120,
      sortable: true,
      sortKey: "updatedAt",
      cellKind: "relative-time",
      cell: row =>
        row.updatedAt ? (
          <RelativeTimeCell iso={row.updatedAt} />
        ) : (
          <span className="text-sm text-muted-foreground">Never</span>
        ),
    },
    {
      key: "actions",
      label: "Action",
      width: 72,
      minWidth: 72,
      defaultPin: "right",
      lockPin: true,
      cell: row => {
        const actions: RowActionDef<DeliveryTrackerRow>[] = [
          {
            label: "Edit delivery",
            icon: "fa-pen-line",
            onSelect: onEdit,
          },
          {
            label: "Mark delivered",
            icon: "fa-circle-check",
            onSelect: onMarkDelivered,
            disabled: row.delivery === "delivered",
          },
        ]
        return <RowActionsCell row={row} actions={actions} />
      },
    },
  ]
}
