"use client"

import * as React from "react"
import { Link } from "react-router-dom"

import { Badge } from "@/components/ui/badge"
import { CatalogCategoryFilter } from "@/components/design-system/catalog-category-filter"
import { CatalogLandingHero } from "@/components/design-system/catalog-landing-hero"
import { designSystemHasLivePreview } from "@/components/design-system/design-system-previews"
import {
  DESIGN_SYSTEM_TIER_LABEL,
  listDesignSystemEntries,
  type DesignSystemRegistryEntry,
  type DesignSystemTier,
} from "@/lib/design-system/registry"
import { DS_DOC_BODY, DS_DOC_BODY_EMPHASIS, DS_DOC_SECTION_TITLE } from "@/lib/design-system/doc-typography"
import { cn } from "@/lib/utils"

const TIER_ORDER: DesignSystemTier[] = [
  "token",
  "component",
  "pattern",
  "template",
  "example",
  "rule",
  "skill",
  "agent",
]

const TIER_FILTER_ICONS: Record<DesignSystemTier, string> = {
  token: "fa-light fa-droplet",
  component: "fa-light fa-cube",
  pattern: "fa-light fa-layer-group",
  template: "fa-light fa-browser",
  example: "fa-light fa-compass",
  rule: "fa-light fa-scale-balanced",
  skill: "fa-light fa-book",
  agent: "fa-light fa-robot",
}

function CatalogEntryCard({ item }: { item: DesignSystemRegistryEntry }) {
  const showLive = designSystemHasLivePreview(item.slug) || item.status === "live"

  return (
    <Link
      to={item.slug}
      className="group flex flex-col gap-1.5 rounded-xl border border-border bg-card px-4 py-3 transition-colors hover:border-brand/40 hover:bg-interactive-hover-soft"
    >
      <div className="flex min-w-0 items-start justify-between gap-2">
        <span className={cn("min-w-0 truncate", DS_DOC_BODY_EMPHASIS)}>{item.name}</span>
        {showLive ? (
          <Badge variant="default" className="h-5 shrink-0 px-1.5 text-xs font-normal">
            Live
          </Badge>
        ) : item.status === "catalog" ? (
          <Badge variant="secondary" className="h-5 shrink-0 px-1.5 text-xs font-normal">
            Hub
          </Badge>
        ) : null}
      </div>
      <span className={cn("line-clamp-2", DS_DOC_BODY)}>{item.description}</span>
      <span className={cn("mt-0.5", DS_DOC_BODY)}>
        <span className="rounded-sm bg-muted/60 px-1.5 py-0.5 text-xs">{item.group}</span>
      </span>
    </Link>
  )
}

export function DesignSystemIndexPage() {
  const allItems = React.useMemo(() => listDesignSystemEntries(), [])
  const [tierFilter, setTierFilter] = React.useState<DesignSystemTier | "all">("all")

  const filteredItems = React.useMemo(() => {
    return allItems.filter((item) => tierFilter === "all" || item.tier === tierFilter)
  }, [allItems, tierFilter])

  const catalogSections = React.useMemo(() => {
    return TIER_ORDER.map((tier) => ({
      tier,
      label: DESIGN_SYSTEM_TIER_LABEL[tier],
      items: filteredItems.filter((item) => item.tier === tier),
    })).filter((section) => section.items.length > 0)
  }, [filteredItems])

  const tierCounts = React.useMemo(() => {
    const counts = new Map<DesignSystemTier, number>()
    for (const item of allItems) {
      counts.set(item.tier, (counts.get(item.tier) ?? 0) + 1)
    }
    return counts
  }, [allItems])

  const categoryFilterOptions = React.useMemo(() => {
    const tierOptions = TIER_ORDER.flatMap((tier) => {
      const count = tierCounts.get(tier) ?? 0
      if (count === 0) return []
      return [
        {
          value: tier as DesignSystemTier | "all",
          label: DESIGN_SYSTEM_TIER_LABEL[tier],
          count,
          icon: TIER_FILTER_ICONS[tier],
        },
      ]
    })
    return [
      { value: "all" as const, label: "All", count: allItems.length },
      ...tierOptions,
    ]
  }, [allItems.length, tierCounts])

  return (
    <div className="flex w-full flex-col gap-10">
      <CatalogLandingHero />

      <section id="catalog-browse" className="flex w-full scroll-mt-24 flex-col gap-8 text-start">
        <div className="flex w-full flex-col gap-4">
          <div className="flex w-full flex-col gap-2 text-start">
            <h2 className={cn(DS_DOC_SECTION_TITLE, "text-start")}>Browse the Design OS Catalog</h2>
            <p className={cn(DS_DOC_BODY, "text-start")}>
              Filter by category below, or search entries in the Design OS Catalog drill-in sidebar.
            </p>
          </div>
          <CatalogCategoryFilter
            value={tierFilter}
            onValueChange={setTierFilter}
            options={categoryFilterOptions}
          />
        </div>

        {catalogSections.length === 0 ? (
          <p className={DS_DOC_BODY}>No entries in this category.</p>
        ) : (
          catalogSections.map((section) => (
            <section key={section.tier} aria-labelledby={`catalog-tier-${section.tier}`}>
              <h3 id={`catalog-tier-${section.tier}`} className={cn("mb-3", DS_DOC_SECTION_TITLE)}>
                {section.label}
                <span className="ms-2 font-normal text-muted-foreground">({section.items.length})</span>
              </h3>
              <ul className="grid w-full list-none gap-3 p-0 sm:grid-cols-2 lg:grid-cols-3">
                {section.items.map((item) => (
                  <li key={item.slug}>
                    <CatalogEntryCard item={item} />
                  </li>
                ))}
              </ul>
            </section>
          ))
        )}
      </section>
    </div>
  )
}
