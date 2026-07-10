'use client'

import * as React from 'react'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@exxatdesignux/ui'

export interface EmptyStateProps {
  /** Font Awesome icon class fragment, e.g. "fa-filter" (no `fa-light` prefix) */
  icon: string
  /** Visible title */
  title: string
  /** Short description below the title */
  description?: React.ReactNode
  /** Optional numbered steps rendered as a vertical list with 1/2/3 chips. */
  steps?: React.ReactNode[]
  /** Optional CTA / footer slot — rendered inside CardFooter. */
  footer?: React.ReactNode
  /** Optional alignment override (default left). */
  align?: 'start' | 'center'
  /** Forwarded to the Card wrapper. */
  className?: string
}

export function EmptyState({
  icon,
  title,
  description,
  steps,
  footer,
  align = 'start',
  className,
}: EmptyStateProps) {
  const centered = align === 'center'
  return (
    <Card size="sm" className={className}>
      <CardHeader
        className={centered ? 'items-center text-center' : undefined}
      >
        <div
          className={
            'flex size-9 items-center justify-center rounded-md bg-background border border-border ' +
            (centered ? 'mx-auto' : '')
          }
        >
          <i
            className={`fa-light ${icon} text-muted-foreground text-sm`}
            aria-hidden="true"
          />
        </div>
        <CardTitle className="text-sm font-semibold text-foreground">
          {title}
        </CardTitle>
        {description && (
          <CardDescription className="text-xs leading-relaxed">
            {description}
          </CardDescription>
        )}
      </CardHeader>
      {steps && steps.length > 0 && (
        <CardContent>
          <ol className="flex flex-col gap-1.5">
            {steps.map((step, i) => (
              <li
                key={i}
                className="flex items-center gap-2 text-xs text-muted-foreground"
              >
                <span
                  className="inline-flex items-center justify-center shrink-0 rounded-full border border-border font-semibold text-[9px]"
                  style={{ width: 16, height: 16, lineHeight: 1 }}
                  aria-hidden="true"
                >
                  {i + 1}
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </CardContent>
      )}
      {footer && <CardFooter>{footer}</CardFooter>}
    </Card>
  )
}
