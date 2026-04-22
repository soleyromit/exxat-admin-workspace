/**
 * PageHeader — Full-width content area header
 *
 * Sits at the top of a page's main content, BELOW the breadcrumb/topbar.
 * Uses Ivy Presto (Adobe Fonts) for the title via font-heading CSS variable.
 *
 * WCAG 2.1 AA:
 *  ✓ <h1> landmark — one per page (WCAG 1.3.1)
 *  ✓ Sufficient colour contrast ≥ 4.5:1 on title + subtitle (SC 1.4.3)
 */

import * as React from "react"
import { cn } from "@/lib/utils"

export interface PageHeaderProps {
  /** Primary page title — rendered as <h1> in Ivy Presto serif */
  title: string
  /** Short descriptor or date shown below the title */
  subtitle?: string
  /** Optional slot for right-aligned actions (buttons, selectors, etc.) */
  actions?: React.ReactNode
  /** Extra className for the outer wrapper */
  className?: string
  /** When false, the title + subtitle are visually hidden (actions remain). */
  showTitleBlock?: boolean
}

export function PageHeader({ title, subtitle, actions, className, showTitleBlock = true }: PageHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-1 px-4 pt-2 pb-4 lg:px-6",
        "sm:flex-row sm:items-end sm:gap-4",
        showTitleBlock ? "sm:justify-between" : "sm:justify-end",
        className
      )}
    >
      {/* Title block — hidden visually when showTitleBlock is false; keep h1 for a11y */}
      <div className={cn("flex flex-col gap-0.5", !showTitleBlock && "sr-only")}>
        <h1
          className="text-2xl font-semibold tracking-tight leading-tight text-foreground"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          {title}
        </h1>
        {subtitle && (
          <p className="text-sm text-muted-foreground leading-none">{subtitle}</p>
        )}
      </div>

      {/* Right-side actions — e.g. date picker, CTA buttons */}
      {actions && (
        <div className="flex items-center gap-2 shrink-0">{actions}</div>
      )}
    </div>
  )
}
