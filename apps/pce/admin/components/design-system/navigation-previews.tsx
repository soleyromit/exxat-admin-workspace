"use client"

import * as React from "react"

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Tabs, TabsContent, TabsCountBadge, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Tip } from "@/components/ui/tip"
import { FilterChipGroup } from "@/components/ui/filter-chip-group"
import { ViewSegmentedControl } from "@/components/ui/view-segmented-control"
import {
  viewSegmentedButtonClass,
  viewSegmentedToolbarClass,
} from "@/components/ui/view-segmented-control"
import { DS_DOC_TABLE_META } from "@/lib/design-system/doc-typography"
import { cn } from "@/lib/utils"

/* ── Doc layout helpers ─────────────────────────────────────────────────── */

function DocVariantStack({ children }: { children: React.ReactNode }) {
  return <div className="flex w-full max-w-2xl flex-col gap-8">{children}</div>
}

function DocVariantRow({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-2">
      <p className={DS_DOC_TABLE_META}>{label}</p>
      {children}
    </div>
  )
}

/** Mount hidden panels so Radix tab triggers satisfy `aria-controls` in doc-only previews. */
function TabsDemoPanels({ values }: { values: string[] }) {
  return (
    <>
      {values.map((value) => (
        <TabsContent key={value} value={value} forceMount hidden className="sr-only">
          {value}
        </TabsContent>
      ))}
    </>
  )
}

function viewToolbarCountBadgeClass(filterId: string, isActive: boolean): string {
  const palettes: Record<string, { active: string; inactive: string }> = {
    all: {
      active: "bg-slate-600 text-white dark:bg-slate-500",
      inactive: "bg-slate-100 text-slate-800 dark:bg-slate-800/70 dark:text-slate-100",
    },
    ongoing: {
      active: "bg-blue-600 text-white",
      inactive: "bg-blue-100 text-blue-950 dark:bg-blue-950/45 dark:text-blue-100",
    },
  }
  const p = palettes[filterId] ?? palettes.all
  return isActive ? p.active : p.inactive
}

/* ── Breadcrumb ─────────────────────────────────────────────────────────── */

export function BreadcrumbPreview() {
  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink href="#">Dashboard</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage>Students</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  )
}

/* ── Default variant (pill) ─────────────────────────────────────────────── */

export function TabsPrimaryVariantsPreview() {
  return (
    <DocVariantStack>
      <DocVariantRow label="Label only">
        <Tabs defaultValue="one" className="w-full">
          <TabsList className="w-fit">
            <TabsTrigger value="one">Tab one</TabsTrigger>
            <TabsTrigger value="two">Tab two</TabsTrigger>
            <TabsTrigger value="three">Tab three</TabsTrigger>
          </TabsList>
          <TabsDemoPanels values={["one", "two", "three"]} />
        </Tabs>
      </DocVariantRow>
      <DocVariantRow label="With icon">
        <Tabs defaultValue="one" className="w-full">
          <TabsList className="w-fit">
            <TabsTrigger value="one" className="gap-1.5">
              <i className="fa-light fa-layer-group text-xs" aria-hidden="true" />
              Tab one
            </TabsTrigger>
            <TabsTrigger value="two" className="gap-1.5">
              <i className="fa-light fa-file-lines text-xs" aria-hidden="true" />
              Tab two
            </TabsTrigger>
            <TabsTrigger value="three" className="gap-1.5">
              <i className="fa-light fa-grid-2 text-xs" aria-hidden="true" />
              Tab three
            </TabsTrigger>
          </TabsList>
          <TabsDemoPanels values={["one", "two", "three"]} />
        </Tabs>
      </DocVariantRow>
      <DocVariantRow label="With count">
        <Tabs defaultValue="one" className="w-full">
          <TabsList className="w-fit">
            <TabsTrigger value="one">
              Tab one
              <TabsCountBadge count={4} />
            </TabsTrigger>
            <TabsTrigger value="two">
              Tab two
              <TabsCountBadge count={12} />
            </TabsTrigger>
            <TabsTrigger value="three">
              Tab three
              <TabsCountBadge count={3} />
            </TabsTrigger>
          </TabsList>
          <TabsDemoPanels values={["one", "two", "three"]} />
        </Tabs>
      </DocVariantRow>
    </DocVariantStack>
  )
}

/** @deprecated Use TabsPrimaryVariantsPreview — kept for catalog aliases */
export function TabsDefaultPreview() {
  return (
    <Tabs defaultValue="one" className="w-full max-w-md">
      <TabsList className="w-fit">
        <TabsTrigger value="one">Overview</TabsTrigger>
        <TabsTrigger value="two">Details</TabsTrigger>
      </TabsList>
      <TabsContent value="one" className="pt-3 text-sm text-muted-foreground">
        Default pill tablist
      </TabsContent>
      <TabsContent value="two" className="pt-3 text-sm text-muted-foreground">
        Second panel
      </TabsContent>
    </Tabs>
  )
}

/* ── Line variant (underline) ───────────────────────────────────────────── */

export function TabsSecondaryVariantsPreview() {
  return (
    <DocVariantStack>
      <DocVariantRow label="Label only">
        <Tabs defaultValue="alpha" className="w-full">
          <TabsList variant="line" className="w-fit justify-start">
            <TabsTrigger value="alpha" className="min-h-9 flex-none px-3">
              Alpha
            </TabsTrigger>
            <TabsTrigger value="beta" className="min-h-9 flex-none px-3">
              Beta
            </TabsTrigger>
          </TabsList>
          <TabsDemoPanels values={["alpha", "beta"]} />
        </Tabs>
      </DocVariantRow>
      <DocVariantRow label="With icon">
        <Tabs defaultValue="alpha" className="w-full">
          <TabsList variant="line" className="w-fit justify-start">
            <TabsTrigger value="alpha" className="min-h-9 flex-none gap-2 px-3">
              <i className="fa-light fa-chart-mixed text-sm" aria-hidden="true" />
              Alpha
            </TabsTrigger>
            <TabsTrigger value="beta" className="min-h-9 flex-none gap-2 px-3">
              <i className="fa-light fa-chart-line text-sm" aria-hidden="true" />
              Beta
            </TabsTrigger>
          </TabsList>
          <TabsDemoPanels values={["alpha", "beta"]} />
        </Tabs>
      </DocVariantRow>
      <DocVariantRow label="With count">
        <Tabs defaultValue="alpha" className="w-full">
          <TabsList variant="line" className="w-fit justify-start">
            <TabsTrigger value="alpha" className="min-h-9 flex-none gap-2 px-3">
              Alpha
              <TabsCountBadge count={6} />
            </TabsTrigger>
            <TabsTrigger value="beta" className="min-h-9 flex-none gap-2 px-3">
              Beta
              <TabsCountBadge count={2} />
            </TabsTrigger>
          </TabsList>
          <TabsDemoPanels values={["alpha", "beta"]} />
        </Tabs>
      </DocVariantRow>
    </DocVariantStack>
  )
}

/** @deprecated Use TabsSecondaryVariantsPreview */
export function TabsLinePreview() {
  return (
    <Tabs defaultValue="chart" className="w-full max-w-md">
      <TabsList variant="line" className="w-full justify-start">
        <TabsTrigger value="chart" className="min-h-9 flex-none gap-2 px-3">
          <i className="fa-light fa-chart-mixed text-sm" aria-hidden="true" />
          Chart
        </TabsTrigger>
        <TabsTrigger value="trend" className="min-h-9 flex-none gap-2 px-3">
          <i className="fa-light fa-chart-line text-sm" aria-hidden="true" />
          Trend
        </TabsTrigger>
      </TabsList>
      <TabsContent value="chart" className="pt-3 text-sm text-muted-foreground">
        Chart panel body
      </TabsContent>
      <TabsContent value="trend" className="pt-3 text-sm text-muted-foreground">
        Trend panel body
      </TabsContent>
    </Tabs>
  )
}

export function TabsPreview() {
  return <TabsPrimaryVariantsPreview />
}

/* ── View segmented control — hub views toolbar (ListPageTemplate) ─────── */

type HubViewTab = {
  id: string
  label: string
  icon: string
  filterId: string
  count: number
}

const HUB_VIEW_TABS: HubViewTab[] = [
  { id: "questions", label: "Questions", icon: "fa-table", filterId: "all", count: 12 },
  { id: "board", label: "Board", icon: "fa-columns-3", filterId: "ongoing", count: 12 },
]

/**
 * Full hub views toolbar — icon, label, count, chevron settings menu, and Add view.
 * Matches `ListPageTemplate` views chrome; not Radix Tabs.
 */
export function ViewSegmentedHubToolbarPreview() {
  const [activeId, setActiveId] = React.useState("board")

  return (
    <div className="flex w-max max-w-full flex-wrap items-center gap-1">
      <div
        role="toolbar"
        aria-label="Views"
        data-slot="view-segmented-toolbar"
        className={viewSegmentedToolbarClass()}
      >
        {HUB_VIEW_TABS.map((tab) => {
          const isActive = tab.id === activeId
          const tabInner = (
            <>
              <i className={cn("fa-light shrink-0 text-xs", tab.icon)} aria-hidden="true" />
              {tab.label}
              <span
                data-slot="view-toolbar-count"
                className={cn(
                  "text-2xs min-w-[1.125rem] rounded-full px-1 py-px text-center font-semibold tabular-nums",
                  viewToolbarCountBadgeClass(tab.filterId, isActive),
                )}
              >
                {tab.count}
              </span>
            </>
          )

          const viewSettingsMenu = (
            <DropdownMenu>
              <Tip label="View settings" side="bottom">
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className={cn(
                      "icon-button-chrome inline-flex min-h-8 min-w-6 shrink-0 items-center justify-center rounded-e-md rounded-s-none px-0.5",
                      "transition-colors hover:bg-foreground/[0.04]",
                      "focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
                    )}
                    aria-label="View settings"
                  >
                    <i className="fa-light fa-chevron-down text-xs" aria-hidden="true" />
                  </button>
                </DropdownMenuTrigger>
              </Tip>
              <DropdownMenuContent align="start">
                <DropdownMenuLabel className="text-xs text-muted-foreground">
                  View: {tab.label}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <i className="fa-light fa-pen text-xs" aria-hidden="true" />
                  Rename
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <i className="fa-light fa-sliders text-xs" aria-hidden="true" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <i className="fa-light fa-copy text-xs" aria-hidden="true" />
                  Duplicate
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )

          if (isActive) {
            return (
              <div
                key={tab.id}
                data-slot="view-segmented-item-shell"
                className={cn(
                  viewSegmentedButtonClass(true),
                  "inline-flex items-stretch gap-0 p-0",
                )}
              >
                <button
                  type="button"
                  aria-pressed
                  data-slot="view-segmented-item"
                  onClick={() => setActiveId(tab.id)}
                  className={cn(
                    "inline-flex min-h-8 items-center gap-1.5 rounded-s-md rounded-e-none bg-transparent py-1 ps-2.5 pe-0.5 text-xs font-medium text-foreground",
                    "hover:bg-foreground/[0.04]",
                    "focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
                  )}
                >
                  {tabInner}
                </button>
                {viewSettingsMenu}
              </div>
            )
          }

          return (
            <button
              key={tab.id}
              type="button"
              aria-pressed={false}
              data-slot="view-segmented-item"
              onClick={() => setActiveId(tab.id)}
              className={viewSegmentedButtonClass(false)}
            >
              {tabInner}
            </button>
          )
        })}
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button type="button" variant="ghost" className="secondary-action-chrome shrink-0">
            <i className="fa-light fa-plus text-sm" aria-hidden="true" />
            Add view
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuLabel className="text-xs">Add a view</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem>
            <i className="fa-light fa-table text-xs" aria-hidden="true" />
            Table
          </DropdownMenuItem>
          <DropdownMenuItem>
            <i className="fa-light fa-columns-3 text-xs" aria-hidden="true" />
            Board
          </DropdownMenuItem>
          <DropdownMenuItem>
            <i className="fa-light fa-chart-pie text-xs" aria-hidden="true" />
            Dashboard
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

/** Simple labeled segments — compact hubs without saved views */
export function ViewSegmentedControlPreview() {
  const [view, setView] = React.useState<"table" | "board" | "dashboard">("table")
  return (
    <ViewSegmentedControl
      value={view}
      onValueChange={setView}
      options={[
        { value: "table", label: "Table", icon: "fa-light fa-table" },
        { value: "board", label: "Board", icon: "fa-light fa-columns" },
        { value: "dashboard", label: "Dashboard", icon: "fa-light fa-chart-pie" },
      ]}
      aria-label="View mode"
    />
  )
}

export function ViewSegmentedControlIconPreview() {
  const [view, setView] = React.useState<"table" | "board">("table")
  return (
    <ViewSegmentedControl
      value={view}
      onValueChange={setView}
      iconOnly
      options={[
        { value: "table", label: "Table", icon: "fa-light fa-table" },
        { value: "board", label: "Board", icon: "fa-light fa-columns" },
      ]}
      aria-label="View mode"
    />
  )
}

const CATALOG_CHIP_OPTIONS = [
  { value: "all" as const, label: "All", count: 103 },
  { value: "token" as const, label: "Design tokens", count: 9, icon: "fa-light fa-droplet" },
  { value: "component" as const, label: "UI primitives", count: 40, icon: "fa-light fa-cube" },
]

const CHART_CHIP_OPTIONS = [
  { value: "trends" as const, label: "Trends" },
  { value: "bars" as const, label: "Bars" },
  { value: "distribution" as const, label: "Distribution" },
  { value: "relationship" as const, label: "Relationship" },
]

/** Brand variant — Design OS Catalog tier filter with icons and counts. */
export function FilterChipGroupBrandPreview() {
  const [value, setValue] = React.useState<(typeof CATALOG_CHIP_OPTIONS)[number]["value"]>("all")
  return (
    <FilterChipGroup
      value={value}
      onValueChange={setValue}
      options={CATALOG_CHIP_OPTIONS}
      variant="brand"
      size="default"
      aria-label="Catalog categories"
    />
  )
}

/** Muted variant — in-content family pickers (chart types, doc filters). */
export function FilterChipGroupMutedPreview() {
  const [value, setValue] = React.useState<(typeof CHART_CHIP_OPTIONS)[number]["value"]>("trends")
  return (
    <FilterChipGroup
      value={value}
      onValueChange={setValue}
      options={CHART_CHIP_OPTIONS}
      variant="muted"
      size="sm"
      aria-label="Chart families"
    />
  )
}

/** Size comparison — default vs sm on muted variant. */
const FILTER_CHIP_GROUP_SIZES_OPTIONS = [
  { value: "trends", label: "Trends" },
  { value: "bars", label: "Bars" },
  { value: "flow", label: "Flow" },
] as const

export function FilterChipGroupSizesPreview() {
  const [value, setValue] = React.useState("bars")
  return (
    <DocVariantStack>
      <DocVariantRow label='size="default"'>
        <FilterChipGroup
          value={value}
          onValueChange={setValue}
          options={FILTER_CHIP_GROUP_SIZES_OPTIONS}
          variant="muted"
          size="default"
          aria-label="Default size chips"
        />
      </DocVariantRow>
      <DocVariantRow label='size="sm"'>
        <FilterChipGroup
          value={value}
          onValueChange={setValue}
          options={FILTER_CHIP_GROUP_SIZES_OPTIONS}
          variant="muted"
          size="sm"
          aria-label="Small size chips"
        />
      </DocVariantRow>
    </DocVariantStack>
  )
}
