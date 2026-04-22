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
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
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
              : "text-muted-foreground hover:text-interactive-hover-foreground hover:bg-interactive-hover-strong"
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
              "text-[15px]"
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

function NavLink({ link }: { link: SecondaryNavLink }) {
  const pathname = usePathname()
  const isActive = pathname === link.href || pathname.startsWith(link.href + "/")

  if (link.isSectionHeader) {
    return (
      <li role="presentation">
        <span className="block px-3 pt-3 pb-0.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground/60 select-none">
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
                "text-[13px]"
              )}
              aria-hidden="true"
            />
          </span>
        )}
        <span className="flex-1 min-w-0 truncate">{link.label}</span>
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
  className,
}: {
  section: SecondaryNavSection
  className?: string
}) {
  return (
    <nav
      aria-label={`${section.label} navigation`}
      className={cn("flex flex-col min-w-[200px] max-w-[240px] pt-3 pb-2", className)}
    >
      {/* Section title */}
      <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground/60 select-none">
        {section.label}
      </p>

      <ul role="list" className="flex flex-col gap-0.5 px-1.5">
        {section.links.map(link => (
          <NavLink key={link.key} link={link} />
        ))}
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
}

export function SecondaryNav({
  sections,
  defaultSection,
  className,
  onSectionChange,
}: SecondaryNavProps) {
  const [activeSection, setActiveSection] = React.useState(
    defaultSection ?? sections[0]?.key ?? ""
  )

  const currentSection = sections.find(s => s.key === activeSection) ?? sections[0]

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
      <SecondaryNavPanel section={currentSection} />
    </div>
  )
}
