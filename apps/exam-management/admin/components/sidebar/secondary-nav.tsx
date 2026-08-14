"use client"

/**
 * SecondaryNav — two-panel contextual navigation
 *
 * Layout:
 *   ┌──────┬──────────────────────────┐
 *   │ Rail │  Content panel            │
 *   │ (52) │  (200–240px)              │
 *   │      │  Section heading          │
 *   │  ◉   │  · Nav item               │
 *   │  ○   │  · Nav item (active)      │
 *   │  ○   │  ─────────────────        │
 *   │      │  Section heading          │
 *   │      │  · Nav item               │
 *   └──────┴──────────────────────────┘
 *
 * Usage:
 *   <SecondaryNav sections={SECTIONS} />
 *
 * Or use composed pieces:
 *   <SecondaryNavRail sections={…} activeSection={…} onSectionChange={…} />
 *   <SecondaryNavPanel section={…} />
 */

import * as React from "react"
import { useLocation } from "react-router-dom"
import { cn } from "@/lib/utils"
import { SidebarNavLabel } from "@/components/ui/sidebar-nav-label"
import { SidebarCollapsedSearchButton } from "@/components/sidebar/sidebar-collapsed-search-button"
import { resolveActiveNavHref } from "@exxatdesignux/ui/lib/nav-active"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface SecondaryNavLink {
  /** Unique key */
  key: string
  label: string
  href: string
  icon?: string
  /** Badge count shown on link */
  count?: number
  /** If true, item is rendered as a section divider label (not a link) */
  isSectionHeader?: boolean
}

export interface SecondaryNavSectionAction {
  /** Tooltip / aria-label */
  label: string
  /** FontAwesome icon class, e.g. "fa-plus" */
  icon: string
  onClick: () => void
}

export interface SecondaryNavSection {
  /** Unique key — used to identify the active section */
  key: string
  /** Tooltip shown on rail icon */
  label: string
  /** FontAwesome icon class, e.g. "fa-users" */
  icon: string
  /** Solid icon used when section is active */
  iconActive?: string
  /** Flat list of links (use isSectionHeader=true for dividers) */
  links: SecondaryNavLink[]
  /** When true, a search input is shown above the list and filters link labels */
  searchable?: boolean
  /** Placeholder for the search input */
  searchPlaceholder?: string
  /** Optional primary action rendered next to the section title (e.g. Add) */
  action?: SecondaryNavSectionAction
}

// ─────────────────────────────────────────────────────────────────────────────
// RailButton — single icon in the narrow left rail
// ─────────────────────────────────────────────────────────────────────────────

function RailButton({
  section,
  isActive,
  onClick,
}: {
  section: SecondaryNavSection
  isActive: boolean
  onClick: () => void
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-label={section.label}
          aria-current={isActive ? "true" : undefined}
          onClick={onClick}
          className={cn(
            "relative flex items-center justify-center size-9 rounded-lg transition-all",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
            isActive
              ? [
                  "text-[var(--brand-color)]",
                  "bg-[color-mix(in_oklch,var(--background)_88%,var(--brand-color)_12%)]",
                ].join(" ")
              : "icon-button-chrome hover:bg-interactive-hover-strong"
          )}
        >
          {/* Active left pip */}
          {isActive && (
            <span
              aria-hidden="true"
              className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r-full bg-[var(--brand-color)]"
            />
          )}
          <i
            className={cn(
              isActive && section.iconActive
                ? `fa-solid ${section.iconActive}`
                : `fa-light ${section.icon}`,
              "text-md"
            )}
            aria-hidden="true"
          />
        </button>
      </TooltipTrigger>
      <TooltipContent side="right" sideOffset={6}>
        {section.label}
      </TooltipContent>
    </Tooltip>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// NavLink — single item in the content panel
// ─────────────────────────────────────────────────────────────────────────────

function NavLink({
  link,
  allLinkHrefs,
}: {
  link: SecondaryNavLink
  allLinkHrefs: readonly string[]
}) {
  const pathname = useLocation().pathname
  const activeHref = resolveActiveNavHref(pathname, allLinkHrefs)
  const isActive = activeHref !== null && activeHref === link.href

  if (link.isSectionHeader) {
    return (
      <li>
        <span className="block px-3 pt-3 pb-0.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground select-none">
          {link.label}
        </span>
      </li>
    )
  }

  return (
    <li>
      <a
        href={link.href}
        aria-current={isActive ? "page" : undefined}
        className={cn(
          "group flex items-center gap-2.5 px-3 py-1.5 rounded-md text-sm transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset",
          isActive
            ? [
                "font-medium text-[var(--brand-color)]",
                "bg-[color-mix(in_oklch,var(--background)_88%,var(--brand-color)_12%)]",
              ].join(" ")
            : "text-foreground/80 hover:text-interactive-hover-foreground hover:bg-interactive-hover-medium"
        )}
      >
        {link.icon && (
          <span className="size-4 shrink-0 flex items-center justify-center">
            <i
              className={cn(
                isActive ? `fa-solid ${link.icon}` : `fa-light ${link.icon}`,
                "text-xs"
              )}
              aria-hidden="true"
            />
          </span>
        )}
        <SidebarNavLabel>{link.label}</SidebarNavLabel>
        {link.count !== undefined && (
          <span
            className={cn(
              "shrink-0 min-w-[18px] h-[18px] flex items-center justify-center rounded-full text-xs font-medium px-1",
              isActive
                ? "bg-[var(--brand-color)] text-white"
                : "bg-muted text-muted-foreground"
            )}
          >
            {link.count}
          </span>
        )}
      </a>
    </li>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// SecondaryNavRail — exported if consumers want to compose manually
// ─────────────────────────────────────────────────────────────────────────────

export function SecondaryNavRail({
  sections,
  activeSection,
  onSectionChange,
  className,
}: {
  sections: SecondaryNavSection[]
  activeSection: string
  onSectionChange: (key: string) => void
  className?: string
}) {
  return (
    <nav
      aria-label="Section navigation"
      className={cn(
        "flex flex-col items-center gap-1 pt-3 pb-2 px-1.5 w-[52px] shrink-0 border-r border-border",
        className
      )}
    >
      <TooltipProvider delayDuration={200}>
        {sections.map(section => (
          <RailButton
            key={section.key}
            section={section}
            isActive={activeSection === section.key}
            onClick={() => onSectionChange(section.key)}
          />
        ))}
      </TooltipProvider>
    </nav>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// SecondaryNavPanel — exported for manual composition
// ─────────────────────────────────────────────────────────────────────────────

export function SecondaryNavPanel({
  section,
  allLinkHrefs,
  className,
  compact = false,
  onExpandFromCompact,
}: {
  section: SecondaryNavSection
  /** All navigable hrefs (every section) so only one row is active at a time. */
  allLinkHrefs: readonly string[]
  className?: string
  /** Icon-only rail — search becomes a magnifying-glass button like other rows. */
  compact?: boolean
  /** When set, compact search taps expand the panel before focusing the field. */
  onExpandFromCompact?: () => void
}) {
  const [query, setQuery] = React.useState("")
  const searchInputRef = React.useRef<HTMLInputElement>(null)
  const q = query.trim().toLowerCase()

  const visibleLinks = React.useMemo(() => {
    if (!section.searchable || !q) return section.links
    // Filter out non-header items that don't match; drop headers whose group becomes empty
    const kept: SecondaryNavLink[] = []
    let pendingHeader: SecondaryNavLink | null = null
    let groupHasMatch = false
    for (const link of section.links) {
      if (link.isSectionHeader) {
        if (pendingHeader && groupHasMatch) kept.push(pendingHeader)
        pendingHeader = link
        groupHasMatch = false
        continue
      }
      if (link.label.toLowerCase().includes(q)) {
        if (pendingHeader && !groupHasMatch) {
          kept.push(pendingHeader)
          groupHasMatch = true
        } else if (!pendingHeader) {
          groupHasMatch = true
        }
        kept.push(link)
      }
    }
    if (pendingHeader && groupHasMatch) {
      // already pushed above when first match in group — nothing to do
    }
    return kept
  }, [section.links, section.searchable, q])

  return (
    <nav
      aria-label={`${section.label} navigation`}
      className={cn("flex flex-col min-w-[200px] max-w-[240px] pt-3 pb-2", className)}
    >
      {/* Section title + action */}
      <div className="flex items-center justify-between gap-2 px-3 pb-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground select-none">
          {section.label}
        </p>
        {section.action && (
          <button
            type="button"
            aria-label={section.action.label}
            title={section.action.label}
            onClick={section.action.onClick}
            className={cn(
              "inline-flex size-6 items-center justify-center rounded-md -me-1",
              "icon-button-chrome hover:bg-interactive-hover-strong",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            )}
          >
            <i className={cn("fa-light", section.action.icon, "text-xs")} aria-hidden="true" />
          </button>
        )}
      </div>

      {/* Search */}
      {section.searchable && compact ? (
        <SidebarCollapsedSearchButton
          className="pb-2"
          label={section.searchPlaceholder ?? `Search ${section.label}`}
          onActivate={() => {
            onExpandFromCompact?.()
            queueMicrotask(() => searchInputRef.current?.focus())
          }}
        />
      ) : null}
      {section.searchable && !compact ? (
        <div className="px-2 pb-2">
          <div className="relative">
            <i
              className="fa-light fa-magnifying-glass absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none"
              aria-hidden="true"
            />
            <input
              ref={searchInputRef}
              type="search"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder={section.searchPlaceholder ?? "Search"}
              aria-label={`Search ${section.label}`}
              className={cn(
                "w-full h-7 ps-7 pe-2 rounded-md text-xs bg-background border border-border",
                "placeholder:text-placeholder-foreground",
                "focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
              )}
            />
          </div>
        </div>
      ) : null}

      <ul className="flex flex-col gap-0.5 px-1.5">
        {visibleLinks.map(link => (
          <NavLink key={link.key} link={link} allLinkHrefs={allLinkHrefs} />
        ))}
        {section.searchable && q && visibleLinks.length === 0 && (
          <li className="px-3 py-2 text-xs text-muted-foreground">No results</li>
        )}
      </ul>
    </nav>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// SecondaryNav — composed two-panel component (default export)
// ─────────────────────────────────────────────────────────────────────────────

export interface SecondaryNavProps {
  sections: SecondaryNavSection[]
  /** Which section key is active by default — defaults to first section */
  defaultSection?: string
  className?: string
  /** Called when active section changes */
  onSectionChange?: (key: string) => void
  /** Icon-only content panel — search fields collapse to icon buttons. */
  compact?: boolean
  onExpandFromCompact?: () => void
}

export function SecondaryNav({
  sections,
  defaultSection,
  className,
  onSectionChange,
  compact = false,
  onExpandFromCompact,
}: SecondaryNavProps) {
  const [activeSection, setActiveSection] = React.useState(
    defaultSection ?? sections[0]?.key ?? ""
  )

  const currentSection = sections.find(s => s.key === activeSection) ?? sections[0]
  const allLinkHrefs = React.useMemo(
    () =>
      sections.flatMap(s =>
        s.links.filter(l => !l.isSectionHeader).map(l => l.href),
      ),
    [sections],
  )

  function handleSectionChange(key: string) {
    setActiveSection(key)
    onSectionChange?.(key)
  }

  if (!currentSection) return null

  return (
    <div
      className={cn(
        "flex h-full border-r border-border bg-sidebar",
        className
      )}
    >
      {/* Left icon rail — only shown when multiple sections */}
      {sections.length > 1 && (
        <SecondaryNavRail
          sections={sections}
          activeSection={activeSection}
          onSectionChange={handleSectionChange}
        />
      )}

      {/* Right content panel */}
      <SecondaryNavPanel
        section={currentSection}
        allLinkHrefs={allLinkHrefs}
        compact={compact}
        onExpandFromCompact={onExpandFromCompact}
      />
    </div>
  )
}
