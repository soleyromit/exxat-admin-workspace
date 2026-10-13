"use client"

/**
 * VENDORED from apps/pce/admin/components/empty-state.tsx (the DS exports no EmptyState: ds-adoption-reviewer
 * verdict VENDOR). Changes: imports rewritten to the DS deep paths this product uses, step chip uses a token size
 * class instead of inline px and a 9px font (no sub-12px text). Empty is never blank: headline, one explanation line,
 * one primary action where one exists (cross-cutting §8).
 */
import * as React from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@exxatdesignux/ui/components/ui/card"

export interface EmptyStateProps {
  /** Font Awesome icon class fragment, for example "fa-filter" (no `fa-light` prefix). */
  icon: string
  title: string
  description?: React.ReactNode
  /** Optional numbered steps. */
  steps?: React.ReactNode[]
  /** CTA slot, rendered inside the card footer. */
  footer?: React.ReactNode
  align?: "start" | "center"
  className?: string
  /** Heading level for the title so the page keeps a valid outline. */
  headingLevel?: 2 | 3
}

export function EmptyState({ icon, title, description, steps, footer, align = "start", className, headingLevel = 2 }: EmptyStateProps) {
  const centered = align === "center"
  const Heading = headingLevel === 2 ? "h2" : "h3"
  return (
    <Card size="sm" className={className}>
      <CardHeader className={centered ? "items-center text-center" : undefined}>
        <div className={"flex size-9 items-center justify-center rounded-md border border-border bg-background " + (centered ? "mx-auto" : "")}>
          <i className={`fa-light ${icon} text-sm text-muted-foreground`} aria-hidden="true" />
        </div>
        <CardTitle asChild className="text-sm font-semibold text-foreground">
          <Heading>{title}</Heading>
        </CardTitle>
        {description ? <CardDescription className="text-xs leading-relaxed">{description}</CardDescription> : null}
      </CardHeader>
      {steps && steps.length > 0 ? (
        <CardContent>
          <ol className="flex flex-col gap-1.5">
            {steps.map((step, i) => (
              <li key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="inline-flex size-5 shrink-0 items-center justify-center rounded-full border border-border text-xs font-semibold" aria-hidden="true">
                  {i + 1}
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </CardContent>
      ) : null}
      {footer ? <CardFooter>{footer}</CardFooter> : null}
    </Card>
  )
}
