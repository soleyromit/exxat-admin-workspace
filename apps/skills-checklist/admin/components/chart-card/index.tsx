"use client"

/**
 * ChartCard, VENDORED into skills-checklist 2026-10-25 from apps/pce/admin/components/charts-overview.tsx
 * (upstream: exxat-ds/apps/web/components/charts-overview.tsx, read only). @exxatdesignux/ui 1.6.5 does not export it.
 * Variants kept: normal, tabs (with tabOptions) and selector (with filterOptions). Dropped: metrics-tabs, kpi-chart and the
 * default Chart/Trend tabs block.
 * Deviations from the source: (1) the title is an h2 (headingLevel h2 or h3) so the outline stays valid under the page h1;
 * (2) className defaults to "" and the shell is not forced to h-full; callers pass `h-auto` where they stack cards;
 * (3) no minimum body height on the normal variant.
 * A11y: Card role="figure" aria-label={title}. The viz inside must carry its own accessible name, different from the title.
 */

import * as React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@exxatdesignux/ui/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@exxatdesignux/ui/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@exxatdesignux/ui/components/ui/select"
import { cn } from "@exxatdesignux/ui/lib/utils"
import { TYPE } from "@/components/lab/type-scale"

export type ChartCardVariant = "normal" | "tabs" | "selector"

type Option = { value: string; label: string }

const lineTabsListClass = "h-auto w-full gap-0 rounded-none justify-start !items-end"
const tabTriggerClass = "h-auto min-w-0 flex-none flex-row items-center gap-2 px-3 pt-2 pb-3 text-muted-foreground data-active:text-foreground"

function ChartCardHeader({ title, description, headingLevel, filterOptions, filter, onFilter, filterLabel }: { title: string; description: string; headingLevel: "h2" | "h3"; filterOptions?: Option[]; filter?: string; onFilter?: (v: string) => void; filterLabel?: string }) {
  const Heading = headingLevel
  const hasSelector = Array.isArray(filterOptions) && filterOptions.length > 0 && !!onFilter
  return (
    <CardHeader className="shrink-0 pb-2">
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          {/* Section title of the one lab type scale (components/lab/type-scale.ts, 2026-10-27): every card title is the same size. */}
          <CardTitle asChild className={`leading-tight ${TYPE.card}`}>
            <Heading>{title}</Heading>
          </CardTitle>
          <CardDescription className="mt-0.5">{description}</CardDescription>
        </div>
        {hasSelector ? (
          <div className="flex shrink-0 items-center gap-1.5">
            <Select value={filter || filterOptions![0]?.value} onValueChange={(v) => onFilter!(v)}>
              <SelectTrigger className="h-8 w-auto min-w-[9rem] shrink-0 text-sm" aria-label={filterLabel ?? `${title}: choose a view`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent align="end" sideOffset={4}>
                {filterOptions!.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : null}
      </div>
    </CardHeader>
  )
}

function initialFilter(variant: ChartCardVariant, defaultFilter: string | undefined, filterOptions: Option[] | undefined, tabOptions: Option[] | undefined): string {
  const opts = variant === "tabs" ? tabOptions : variant === "selector" ? filterOptions : undefined
  if (opts && opts.length > 0) return defaultFilter && opts.some((o) => o.value === defaultFilter) ? defaultFilter : opts[0]!.value
  return defaultFilter ?? ""
}

export function ChartCard({
  title,
  description,
  children,
  className = "",
  variant = "normal",
  headingLevel = "h2",
  filterOptions,
  defaultFilter,
  onFilterChange,
  tabOptions,
  filterLabel,
}: {
  title: string
  description: string
  children: React.ReactNode | ((filter: string) => React.ReactNode)
  className?: string
  variant?: ChartCardVariant
  headingLevel?: "h2" | "h3"
  /** selector variant: options for the filter dropdown */
  filterOptions?: Option[]
  defaultFilter?: string
  onFilterChange?: (value: string) => void
  /** tabs variant: the tabs; the selected value is passed to the children function */
  tabOptions?: Option[]
  /** selector variant: the select's accessible name (default "{title}: choose a view") */
  filterLabel?: string
}) {
  const [filter, setFilter] = React.useState(() => initialFilter(variant, defaultFilter, filterOptions, tabOptions))

  // Keyed on option VALUES, not array identity: callers pass inline literals that change reference on every render.
  const filterOptionsKey = filterOptions?.map((o) => o.value).join("|")
  const tabOptionsKey = tabOptions?.map((t) => t.value).join("|")
  React.useEffect(() => {
    setFilter(initialFilter(variant, defaultFilter, filterOptions, tabOptions))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [variant, defaultFilter, filterOptionsKey, tabOptionsKey])

  const handleFilter = (v: string) => {
    setFilter(v)
    onFilterChange?.(v)
  }
  const resolve = (f: string) => (typeof children === "function" ? children(f) : children)
  const shell = cn("flex min-h-0 flex-col", className)

  if (variant === "tabs" && tabOptions && tabOptions.length > 0) {
    const selected = filter || tabOptions[0]!.value
    return (
      <Card className={shell} role="figure" aria-label={title}>
        <ChartCardHeader title={title} description={description} headingLevel={headingLevel} />
        <Tabs value={selected} onValueChange={handleFilter} className="flex min-h-0 flex-1 flex-col">
          <div className="shrink-0 px-2">
            {/* ariaLabel scoped to this card: the DS default is identical across cards, which axe flags as a duplicate landmark. */}
            <TabsList variant="line" className={lineTabsListClass} ariaLabel={`${title} view`}>
              {tabOptions.map((tab) => (
                <TabsTrigger key={tab.value} value={tab.value} className={tabTriggerClass}>
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>
          {tabOptions.map((tab) => (
            <TabsContent key={tab.value} value={tab.value} className="m-0 flex flex-1 flex-col">
              <CardContent className="flex flex-1 flex-col pb-4">{resolve(tab.value)}</CardContent>
            </TabsContent>
          ))}
        </Tabs>
      </Card>
    )
  }

  return (
    <Card className={shell} role="figure" aria-label={title}>
      <ChartCardHeader title={title} description={description} headingLevel={headingLevel} filterOptions={variant === "selector" ? filterOptions : undefined} filter={filter} onFilter={handleFilter} filterLabel={filterLabel} />
      <CardContent className="flex min-h-0 flex-1 flex-col pb-4">{resolve(filter)}</CardContent>
    </Card>
  )
}
