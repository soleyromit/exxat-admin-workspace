'use client'

import * as React from 'react'
import { Card, CardContent } from '@exxatdesignux/ui'

/**
 * AiInsightCard — workspace pulled-vs-AI lane affordance per
 * docs/patterns/viz/ai-vs-pulled-lane.md.
 *
 * Use at every analytics aggregation level (term dashboard, cohort dashboard,
 * course detail, faculty self-view) to surface AI-extracted themes BEFORE
 * question-level pulled metrics — per Aarti 2026-05-08 16:09 D14
 * ("AI summaries surface BEFORE question-level detail at every aggregation level").
 *
 * Affordance: fa-light fa-sparkles + var(--brand-color) + "AI insight" label
 * + source citation. Distinct from pulled-data cards which use no AI affordance.
 *
 * Per workspace ADR-005: "AI is good at finding themes and grouping the
 * information by themes. Just let AI do that work" (Aarti).
 *
 * Reserved icon: fa-star-christmas is for Leo only — never use here.
 */

interface Props {
  /** The themes / insight text. Specific, action-oriented; cite the source in props.source not in body. */
  body: React.ReactNode
  /** Where the AI extracted from. e.g. "47 open-text responses · 6 themes". */
  source: string
  /** Optional title above the body. Defaults to "AI insight". */
  title?: string
  /** Optional action buttons rendered below body. */
  actions?: React.ReactNode
  /** Optional pre-body content (e.g., a stat row). */
  preBody?: React.ReactNode
  className?: string
}

export function AiInsightCard({
  body,
  source,
  title = 'AI insight',
  actions,
  preBody,
  className,
}: Props) {
  return (
    <Card
      role="region"
      aria-label="AI insight"
      className={`shadow-none ${className ?? ''}`}
    >
      <CardContent className="p-4">
        <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground mb-2">
          <i
            className="fa-light fa-sparkles"
            style={{ color: 'var(--brand-color)' }}
            aria-hidden="true"
          />
          <span>{title}</span>
        </div>

        {preBody && <div className="mb-2">{preBody}</div>}

        <div className="text-sm text-foreground mb-2">{body}</div>

        <p className="text-xs text-muted-foreground">
          Based on {source}
        </p>

        {actions && (
          <div className="flex flex-wrap gap-2 mt-3">
            {actions}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
