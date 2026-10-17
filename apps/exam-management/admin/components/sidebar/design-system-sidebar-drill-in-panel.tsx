"use client"

/**
 * DesignSystemSidebarDrillInPanel — collapsible tiers (Question bank cadence).
 *
 * Tiers expand inline in one drill-in pane — categories as sub-labels, components
 * as sub-links. No secondary drill stack when opening a tier or doc.
 */

import * as React from "react"
import { Link, useLocation } from "react-router-dom"

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { SidebarNavLabel } from "@/components/ui/sidebar-nav-label"
import { useSecondaryPanel } from "@/components/sidebar/secondary-panel"
import { SidebarDrillInSearchField } from "@/components/sidebar/sidebar-drill-in-search-field"
import { DESIGN_SYSTEM_DRILL_IN_HOME_LABEL } from "@/lib/design-system/hub-label"
import { catalogEntryMatchesQuery } from "@/lib/design-system/catalog-entry-search"
import {
  buildDesignSystemNavSections,
  DESIGN_SYSTEM_REGISTRY_ENTRIES,
  DESIGN_SYSTEM_TIER_ICONS,
  getDesignSystemEntry,
  type DesignSystemNavSection,
  type DesignSystemTier,
} from "@/lib/design-system/registry"
import { cn } from "@/lib/utils"

function designSystemBasePath(pathname: string): string {
  const match = pathname.match(/^(\/[^/]+)\/design-system(?:\/|$)/)
  return match ? `${match[1]}/design-system` : "/design-os/design-system"
}

function activeSlugFromPath(pathname: string, basePath: string): string | undefined {
  const prefix = `${basePath}/`
  if (!pathname.startsWith(prefix)) return undefined
  const rest = pathname.slice(prefix.length)
  return rest.split("/")[0] || undefined
}

const DESIGN_SYSTEM_SLUG_ICONS: Record<string, string> = {
  accordion: "fa-light fa-bars-staggered",
  avatar: "fa-light fa-circle-user",
  badge: "fa-light fa-badge-check",
  banner: "fa-light fa-flag",
  breadcrumb: "fa-light fa-route",
  button: "fa-light fa-hand-pointer",
  card: "fa-light fa-rectangle",
  chart: "fa-light fa-chart-line",
  checkbox: "fa-light fa-square-check",
  command: "fa-light fa-terminal",
  "data-table": "fa-light fa-table",
  "table-cells": "fa-light fa-table-cells",
  "date-picker": "fa-light fa-calendar-days",
  dialog: "fa-light fa-message",
  "dropdown-menu": "fa-light fa-list-dropdown",
  field: "fa-light fa-input-text",
  form: "fa-light fa-rectangle-list",
  input: "fa-light fa-keyboard",
  kbd: "fa-light fa-keyboard",
  popover: "fa-light fa-window-restore",
  "radio-group": "fa-light fa-circle-dot",
  select: "fa-light fa-list-ul",
  separator: "fa-light fa-grip-lines",
  skeleton: "fa-light fa-loader",
  table: "fa-light fa-table-cells",
  tabs: "fa-light fa-window",
  "filter-chip-group": "fa-light fa-filter",
  "filter-button": "fa-light fa-filter",
  "filter-bar": "fa-light fa-filter-list",
  tip: "fa-light fa-circle-info",
  "toggle-switch": "fa-light fa-toggle-on",
}

const DESIGN_SYSTEM_GROUP_ICONS: Record<string, string> = {
  Actions: "fa-light fa-bolt",
  Feedback: "fa-light fa-message-exclamation",
  Forms: "fa-light fa-pen-field",
  Layout: "fa-light fa-grid-2",
  Navigation: "fa-light fa-route",
  Overlays: "fa-light fa-window-restore",
  "Data display": "fa-light fa-chart-simple",
  "Table cells": "fa-light fa-table-cells",
  Leo: "fa-light fa-sparkles",
  "Data views": "fa-light fa-table-list",
  "Page chrome": "fa-light fa-browser",
  Search: "fa-light fa-magnifying-glass",
  Values: "fa-light fa-hashtag",
  Status: "fa-light fa-tags",
  People: "fa-light fa-users",
  Links: "fa-light fa-link",
  Overview: "fa-light fa-list",
  "Hub shells": "fa-light fa-columns-3",
  Focus: "fa-light fa-bullseye",
  "Reference hubs": "fa-light fa-layer-group",
  Categories: "fa-light fa-palette",
  "Component tokens": "fa-light fa-swatchbook",
  Foundation: "fa-light fa-scale-balanced",
  Product: "fa-light fa-building",
  UX: "fa-light fa-compass",
  Tokens: "fa-light fa-droplet",
  "Ship gate": "fa-light fa-shield-check",
  Core: "fa-light fa-cube",
  Agents: "fa-light fa-robot",
  Workspace: "fa-light fa-book",
  Routing: "fa-light fa-route",
}

function designSystemNavIcon(item: { slug: string; group: string }): string {
  return DESIGN_SYSTEM_SLUG_ICONS[item.slug] ?? DESIGN_SYSTEM_GROUP_ICONS[item.group] ?? "fa-light fa-cube"
}

function designSystemNavIconClass(iconClass: string, isActive: boolean): string {
  if (!isActive) return iconClass
  return iconClass.replace(/^fa-light\b/, "fa-solid")
}

function DesignSystemDrillInNavIcon({
  iconClass,
  isActive,
}: {
  iconClass: string
  isActive: boolean
}) {
  return (
    <span
      key={isActive ? "active" : "idle"}
      className={cn(
        "flex size-4 shrink-0 items-center justify-center",
        isActive && "[animation:sidebar-icon-pop_380ms_cubic-bezier(0.34,1.56,0.64,1)_both]",
      )}
      aria-hidden="true"
    >
      <i className={cn(designSystemNavIconClass(iconClass, isActive), "text-xs")} aria-hidden="true" />
    </span>
  )
}

function DesignSystemCollapsibleTierNav({
  section,
  basePath,
  activeSlug,
  activeTier,
  open,
  onOpenChange,
  onNavigate,
}: {
  section: DesignSystemNavSection
  basePath: string
  activeSlug: string | undefined
  activeTier: DesignSystemTier | undefined
  open: boolean
  onOpenChange: (open: boolean) => void
  onNavigate: () => void
}) {
  const tierActive = activeTier === section.tier

  return (
    <Collapsible open={open} onOpenChange={onOpenChange} asChild>
      <SidebarMenuItem className="group/collapsible">
        <SidebarMenuButton asChild isActive={tierActive && !activeSlug} tooltip={section.tierLabel}>
          <CollapsibleTrigger className="min-h-8 h-auto overflow-visible">
            <DesignSystemDrillInNavIcon
              iconClass={DESIGN_SYSTEM_TIER_ICONS[section.tier]}
              isActive={tierActive}
            />
            <SidebarNavLabel className="min-w-0 flex-1">{section.tierLabel}</SidebarNavLabel>
            <span className="ms-auto flex size-4 shrink-0 items-center justify-center" aria-hidden="true">
              <i
                className="fa-light fa-chevron-right text-xs text-current transition-transform duration-200 ease-out group-data-[state=open]/collapsible:rotate-90 motion-reduce:transition-none"
                aria-hidden="true"
              />
            </span>
          </CollapsibleTrigger>
        </SidebarMenuButton>
        <CollapsibleContent className="overflow-hidden group-data-[collapsible=icon]:hidden data-[state=open]:[animation:collapsible-down_200ms_ease-out] data-[state=closed]:[animation:collapsible-up_200ms_ease-out] motion-reduce:animate-none">
          <SidebarMenuSub>
            {section.groups.map((group) =>
              group.items.length === 0 ? null : (
                <React.Fragment key={group.group}>
                  <SidebarMenuSubItem className="pointer-events-none mt-2 first:mt-0">
                    <span className="px-2 pb-0.5 text-xs font-medium text-sidebar-section-label">
                      {group.group}
                    </span>
                  </SidebarMenuSubItem>
                  {group.items.map((item) => {
                    const isActive = item.slug === activeSlug
                    return (
                      <SidebarMenuSubItem key={item.slug}>
                        <SidebarMenuSubButton
                          asChild
                          isActive={isActive}
                          className="min-h-8 h-auto overflow-visible"
                        >
                          <Link
                            to={`${basePath}/${item.slug}`}
                            aria-current={isActive ? "page" : undefined}
                            onClick={onNavigate}
                          >
                            <DesignSystemDrillInNavIcon
                              iconClass={designSystemNavIcon(item)}
                              isActive={isActive}
                            />
                            <SidebarNavLabel className="min-w-0">{item.name}</SidebarNavLabel>
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    )
                  })}
                </React.Fragment>
              ),
            )}
          </SidebarMenuSub>
        </CollapsibleContent>
      </SidebarMenuItem>
    </Collapsible>
  )
}

export function DesignSystemSidebarDrillInPanel() {
  const { pathname } = useLocation()
  const { dismissNavFlyout } = useSidebar()
  const { activePanel, closePanel } = useSecondaryPanel()
  const basePath = designSystemBasePath(pathname)
  const activeSlug = activeSlugFromPath(pathname, basePath)
  const isHomeActive = !activeSlug
  const sections = buildDesignSystemNavSections()
  const activeEntry = activeSlug ? getDesignSystemEntry(activeSlug) : undefined
  const activeTier = activeEntry?.tier

  const [filter, setFilter] = React.useState("")
  const [openTiers, setOpenTiers] = React.useState<Partial<Record<DesignSystemTier, boolean>>>({})
  const filterRef = React.useRef<HTMLInputElement>(null)

  React.useEffect(() => {
    if (filter.trim() || !activeTier) return
    setOpenTiers((prev) => (prev[activeTier] ? prev : { ...prev, [activeTier]: true }))
  }, [activeTier, filter])

  const searchResults = React.useMemo(() => {
    const q = filter.trim()
    if (!q) return []
    return DESIGN_SYSTEM_REGISTRY_ENTRIES.filter((entry) => catalogEntryMatchesQuery(entry, q)).sort(
      (a, b) => a.name.localeCompare(b.name),
    )
  }, [filter])

  const handleNavigate = React.useCallback(() => {
    dismissNavFlyout()
    if (activePanel) {
      closePanel({ mainSidebar: "leave" })
    }
  }, [activePanel, closePanel, dismissNavFlyout])

  const isSearchMode = filter.trim().length > 0

  const catalogSearchMenuItem = (
    <SidebarDrillInSearchField
      id="catalog-drill-in-search"
      variant="menu-item"
      inputRef={filterRef}
      value={filter}
      onChange={setFilter}
      label="Search catalog entries"
      placeholder="Search catalog"
    />
  )

  return (
    <>
      <SidebarGroup className="py-0" role="group" aria-label={DESIGN_SYSTEM_DRILL_IN_HOME_LABEL}>
        <SidebarGroupContent>
          <SidebarMenu className="gap-0.5">
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={isHomeActive}
                tooltip={DESIGN_SYSTEM_DRILL_IN_HOME_LABEL}
                className="min-h-8 h-auto overflow-visible"
              >
                <Link
                  to={basePath}
                  aria-current={isHomeActive ? "page" : undefined}
                  onClick={handleNavigate}
                >
                  <DesignSystemDrillInNavIcon
                    iconClass="fa-light fa-grid-2"
                    isActive={isHomeActive}
                  />
                  <SidebarNavLabel>{DESIGN_SYSTEM_DRILL_IN_HOME_LABEL}</SidebarNavLabel>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>

      {isSearchMode ? (
        <SidebarGroup className="py-0 pt-1" role="group" aria-label="Search results">
          <SidebarGroupLabel className="px-2 text-xs font-medium text-sidebar-section-label">
            Search results
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-0.5">
              {catalogSearchMenuItem}
              {searchResults.length === 0 ? (
                <SidebarMenuItem className="pointer-events-none">
                  <span className="block px-3 py-2 text-xs text-sidebar-foreground/80">
                    No catalog entries match.
                  </span>
                </SidebarMenuItem>
              ) : (
                searchResults.map((item) => (
                  <SidebarMenuItem key={item.slug}>
                    <SidebarMenuButton
                      asChild
                      isActive={item.slug === activeSlug}
                      tooltip={item.name}
                      className="min-h-8 h-auto overflow-visible"
                    >
                      <Link
                        to={`${basePath}/${item.slug}`}
                        aria-current={item.slug === activeSlug ? "page" : undefined}
                        onClick={handleNavigate}
                      >
                        <DesignSystemDrillInNavIcon
                          iconClass={designSystemNavIcon(item)}
                          isActive={item.slug === activeSlug}
                        />
                        <SidebarNavLabel className="min-w-0">{item.name}</SidebarNavLabel>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      ) : (
        <SidebarGroup className="py-0 pt-1" role="group" aria-label="Design OS Catalog tiers">
          <SidebarGroupLabel className="px-2 text-xs font-medium text-sidebar-section-label">
            Browse by type
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-0.5">
              {catalogSearchMenuItem}
              {sections.map((section) => (
                <DesignSystemCollapsibleTierNav
                  key={section.tier}
                  section={section}
                  basePath={basePath}
                  activeSlug={activeSlug}
                  activeTier={activeTier}
                  open={openTiers[section.tier] ?? false}
                  onOpenChange={(next) =>
                    setOpenTiers((prev) => ({ ...prev, [section.tier]: next }))
                  }
                  onNavigate={handleNavigate}
                />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      )}
    </>
  )
}
