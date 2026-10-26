"use client"

/**
 * Column types rule demo — validates `exxat-table-column-cells` end-to-end.
 * Table-only hub (views toolbar hidden). Route: `/column-types-demo`.
 */

import * as React from "react"

import { PrimaryPageTemplate } from "@/components/templates/primary-page-template"
import { PageHeader } from "@/components/page-header"
import { HubTable, ListPageTemplate, type ViewTab } from "@/components/data-views"
import type { ColumnDef } from "@/components/data-table/types"
import {
  CurrencyCell,
  NumericCell,
  PeopleAvatarRailCell,
  PersonIdentityCell,
  ProgressCell,
  RatingCell,
  type PersonStub,
} from "@/components/data-views"
import { ListHubStatusBadge } from "@/components/list-hub-status-badge"
import { initialsFromDisplayName } from "@/lib/initials-from-name"
import {
  LIST_HUB_STATUS_TINT_INFO,
  LIST_HUB_STATUS_TINT_SUCCESS,
  LIST_HUB_STATUS_TINT_WARNING,
} from "@/lib/list-status-badges"
import { ratingFilterOptions } from "@/lib/column-filter-rich-options"
import { useProductDashboardHref } from "@/contexts/product-route-sync"
import { productPersistKey } from "@/stores/app-store"
import { useProduct } from "@/contexts/product-context"

type DemoStatus = "active" | "pending" | "complete"

export type ColumnTypesDemoRow = {
  id: string
  title: string
  owner: string
  ownerEmail: string
  reviewers: PersonStub[]
  status: DemoStatus
  rating: number
  progress: number
  budget: number
  tasks: number
} & Record<string, unknown>

const STATUS_LABEL: Record<DemoStatus, string> = {
  active: "Active",
  pending: "Pending",
  complete: "Complete",
}

const STATUS_TINT: Record<DemoStatus, string> = {
  active: LIST_HUB_STATUS_TINT_INFO,
  pending: LIST_HUB_STATUS_TINT_WARNING,
  complete: LIST_HUB_STATUS_TINT_SUCCESS,
}

const STATUS_ICON: Record<DemoStatus, string> = {
  active: "fa-circle-play",
  pending: "fa-clock",
  complete: "fa-circle-check",
}

const DEMO_ROWS: ColumnTypesDemoRow[] = [
  {
    id: "PRJ-2401",
    title: "Fall rotation readiness",
    owner: "Jordan Lee",
    ownerEmail: "jordan.lee@school.edu",
    reviewers: [
      { name: "Sam Ortiz", initials: "SO" },
      { name: "Riley Chen", initials: "RC" },
    ],
    status: "active",
    rating: 4,
    progress: 62,
    budget: 12400,
    tasks: 18,
  },
  {
    id: "PRJ-2402",
    title: "Site compliance packet",
    owner: "Alex Morgan",
    ownerEmail: "alex.morgan@school.edu",
    reviewers: [{ name: "Jordan Lee", initials: "JL" }],
    status: "pending",
    rating: 3,
    progress: 28,
    budget: 8200,
    tasks: 9,
  },
  {
    id: "PRJ-2403",
    title: "Preceptor onboarding",
    owner: "Riley Chen",
    ownerEmail: "riley@school.edu",
    reviewers: [
      { name: "Alex Morgan", initials: "AM" },
      { name: "Sam Ortiz", initials: "SO" },
      { name: "Jordan Lee", initials: "JL" },
    ],
    status: "complete",
    rating: 5,
    progress: 100,
    budget: 5600,
    tasks: 24,
  },
]

function buildDemoColumns(): ColumnDef<ColumnTypesDemoRow>[] {
  return [
    {
      key: "title",
      label: "Project",
      width: 240,
      minWidth: 180,
      sortable: true,
      sortKey: "title",
      cellKind: "text",
      cell: (row) => (
        <div className="flex min-w-0 flex-col gap-0.5">
          <span className="truncate text-sm font-medium text-foreground">{row.title}</span>
          <span className="truncate font-mono text-xs tabular-nums text-muted-foreground">{row.id}</span>
        </div>
      ),
    },
    {
      key: "owner",
      label: "Owner",
      width: 240,
      minWidth: 200,
      sortable: true,
      sortKey: "owner",
      cellKind: "person",
      cell: (row) => (
        <PersonIdentityCell
          name={row.owner}
          email={row.ownerEmail}
          initials={initialsFromDisplayName(row.owner)}
        />
      ),
    },
    {
      key: "reviewers",
      label: "Reviewers",
      width: 140,
      minWidth: 120,
      cellKind: "people-rail",
      cell: (row) => <PeopleAvatarRailCell people={row.reviewers} />,
    },
    {
      key: "status",
      label: "Status",
      width: 140,
      minWidth: 120,
      cellKind: "status",
      filter: {
        options: (Object.keys(STATUS_LABEL) as DemoStatus[]).map((k) => ({
          value: k,
          label: STATUS_LABEL[k],
          node: (
            <ListHubStatusBadge
              label={STATUS_LABEL[k]}
              tintClassName={STATUS_TINT[k]}
              icon={STATUS_ICON[k]}
            />
          ),
        })),
      },
      cell: (row) => (
        <ListHubStatusBadge
          label={STATUS_LABEL[row.status]}
          tintClassName={STATUS_TINT[row.status]}
          icon={STATUS_ICON[row.status]}
        />
      ),
    },
    {
      key: "rating",
      label: "Rating",
      width: 130,
      minWidth: 110,
      sortable: true,
      sortKey: "rating",
      cellKind: "rating",
      filter: { options: ratingFilterOptions() },
      cell: (row) => <RatingCell value={row.rating} />,
    },
    {
      key: "progress",
      label: "Progress",
      width: 160,
      minWidth: 140,
      sortable: true,
      sortKey: "progress",
      cellKind: "progress",
      cell: (row) => <ProgressCell value={row.progress} />,
    },
    {
      key: "budget",
      label: "Budget",
      width: 110,
      minWidth: 90,
      sortable: true,
      sortKey: "budget",
      cellKind: "currency",
      cell: (row) => <CurrencyCell value={row.budget} />,
    },
    {
      key: "tasks",
      label: "Tasks",
      width: 90,
      minWidth: 72,
      sortable: true,
      sortKey: "tasks",
      cellKind: "numeric",
      cell: (row) => <NumericCell value={row.tasks} />,
    },
  ]
}

const DEMO_TABS: ViewTab[] = [
  {
    id: "demo-all",
    label: "All projects",
    viewType: "table",
    icon: "fa-table",
    filterId: "all",
  },
]

/** HubTable body — shared by the route and catalog inline preview. */
export function ColumnTypesRuleDemoTable({
  persistKey,
  className,
  embeddedPreview,
}: {
  persistKey: string
  className?: string
  /** Catalog / dashboard embeds — cap at five rows with View more. */
  embeddedPreview?: boolean
}) {
  const columns = React.useMemo(() => buildDemoColumns(), [])

  return (
    <div className={className}>
      <HubTable<ColumnTypesDemoRow>
        rows={DEMO_ROWS}
        columns={columns}
        view="table"
        onViewChange={() => {}}
        hubLabel="Column types demo"
        lifecycleTabLabel="All projects"
        searchAriaLabel="Search demo projects"
        getRowId={(row) => row.id}
        getRowSelectionLabel={(row) => row.title}
        defaultSort={{ key: "title", dir: "asc" }}
        emptyState="No demo rows."
        renderers={{}}
        persistKey={persistKey}
        embeddedPreview={embeddedPreview}
      />
    </div>
  )
}

export function ColumnTypesRuleDemoClient() {
  const dashboardHref = useProductDashboardHref()
  const { product, customProducts, activeCustomIndex } = useProduct()
  const persistKey = productPersistKey(product, "column-types-demo", customProducts, activeCustomIndex)

  return (
    <PrimaryPageTemplate
      siteHeader={{
        breadcrumbs: [
          { label: "Dashboard", href: dashboardHref },
          { label: "Column types demo" },
        ],
        title: "Column types demo",
      }}
    >
      <ListPageTemplate
        defaultTabs={DEMO_TABS}
        persistKey={persistKey}
        header={
          <PageHeader
            title="Column types (rule demo)"
            subtitle="cellKind drives filter icons; rating filter shows star previews. Table-only — no Add view until product asks."
          />
        }
        renderContent={() => (
          <ColumnTypesRuleDemoTable persistKey={persistKey} />
        )}
      />
    </PrimaryPageTemplate>
  )
}
