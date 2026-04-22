"use client"

/**
 * SiteHeader — breadcrumb / top bar — WCAG 2.1 AA
 *
 *  ✓ SidebarTrigger wrapped in Tooltip — icon-only button (WCAG 4.1.2, 1.1.1)
 *  ✓ <header role="banner"> landmark for AT navigation (WCAG 1.3.6)
 *  ✓ No bottom border (per design spec)
 *  ✓ Uses Inter (font-sans) — Ivy Presto is reserved for PageHeader <h1> only
 */

import Link from "next/link"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Kbd, KbdGroup } from "@/components/ui/kbd"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { AskLeoToggle } from "@/components/ask-leo-sidebar"
import { useModKeyLabel } from "@/hooks/use-mod-key-label"

export interface BreadcrumbItem {
  label: string
  href?: string
}

export interface SiteHeaderProps {
  /** Current page title (last breadcrumb segment) */
  title?: string
  /** Full breadcrumb trail — each item can be a link or plain text. Title is appended automatically as the last segment. */
  breadcrumbs?: BreadcrumbItem[]
}

export function SiteHeader({ title = "Dashboard", breadcrumbs }: SiteHeaderProps) {
  const mod = useModKeyLabel()

  return (
    <header
      role="banner"
      className="flex h-(--header-height) shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)"
    >
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <Tooltip>
          <TooltipTrigger asChild>
            <SidebarTrigger className="-ms-1" />
          </TooltipTrigger>
          <TooltipContent side="bottom" className="flex flex-wrap items-center gap-1.5">
            <span>Toggle sidebar</span>
            <KbdGroup>
              <Kbd>{mod}</Kbd>
              <Kbd>B</Kbd>
            </KbdGroup>
          </TooltipContent>
        </Tooltip>

        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4 data-[orientation=vertical]:self-auto"
        />

        {/* Breadcrumb trail */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 min-w-0 overflow-hidden">
          {breadcrumbs?.map((crumb, i) => (
            <span key={i} className="flex items-center gap-1.5 shrink-0">
              {crumb.href ? (
                <Link
                  href={crumb.href}
                  className="font-sans text-sm text-muted-foreground hover:text-interactive-hover-foreground transition-colors tracking-normal"
                >
                  {crumb.label}
                </Link>
              ) : (
                <span className="font-sans text-sm text-muted-foreground tracking-normal">
                  {crumb.label}
                </span>
              )}
              <i className="fa-light fa-chevron-right text-xs text-muted-foreground/50" aria-hidden="true" />
            </span>
          ))}
          <span className="font-sans text-sm font-medium text-foreground tracking-normal truncate">
            {title}
          </span>
        </nav>

        <div className="ml-auto shrink-0">
          <AskLeoToggle />
        </div>
      </div>
    </header>
  )
}
