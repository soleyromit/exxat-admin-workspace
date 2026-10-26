"use client"

/**
 * The evaluator and lab instructor surface: no login, no app chrome (REQ EV-01; strategy/04 evaluator shell). A light header
 * names the program and says "no account needed" once; the column is 820 px for the form (strategy/04 C-2) and wider for the
 * lab grid. The lab LightFrame caps its main at max-w-3xl (768 px), so this frame breaks out to the viewport width and sets
 * its own column. Recommendation for the polish worker: let LightFrame's main be full width and leave the column to screens.
 *
 * Density (strategy/07 evaluator budget: 3 regions, light header, request summary, first skill): a form passes its request
 * summary (who and where) as `summary`, and it sits inside the light header as one block, so header and summary are one region
 * that answers "who is asking, for whom, where". The program name is the sender's name (data), not prose.
 */
import * as React from "react"
import { cn } from "@exxatdesignux/ui/lib/utils"

const WIDTH = { form: "max-w-[820px]", wide: "max-w-[1200px]" } as const
/** Never wider than the viewport minus a scrollbar, never narrower than the lab main, so no horizontal page scroll. */
const BREAKOUT = { form: "w-[max(100%,min(calc(100vw-16px),820px))]", wide: "w-[max(100%,min(calc(100vw-16px),1200px))]" } as const

export function EvaluatorFrame({ program, width = "form", children, footer, summary }: { program: string; width?: keyof typeof WIDTH; children: React.ReactNode; footer?: React.ReactNode; summary?: React.ReactNode }) {
  return (
    <div className={cn("relative left-1/2 -translate-x-1/2 bg-background", BREAKOUT[width])} data-evaluator-frame>
      <header className="border-b border-border" data-region="header">
        <div className={cn("mx-auto flex w-full items-center justify-between gap-3 px-4 py-2.5 sm:px-6", WIDTH[width])}>
          <p className="truncate text-sm font-semibold text-foreground" data-viz-label>{program}</p>
          <p className="flex shrink-0 items-center gap-1.5 text-xs text-muted-foreground">
            <i className="fa-light fa-lock" aria-hidden="true" />
            <span>No account needed</span>
          </p>
        </div>
        {summary ? <div className={cn("mx-auto w-full px-4 pb-3 sm:px-6", WIDTH[width])} data-ev-summary>{summary}</div> : null}
      </header>
      <div className={cn("mx-auto flex w-full flex-col gap-4 px-4 pt-4 pb-6 sm:px-6", WIDTH[width])}>{children}</div>
      {footer}
    </div>
  )
}

/**
 * A bottom bar that stays in view while the form scrolls: the one primary action and how much is done. `stickyOn="never"` makes
 * it the form's last row instead (variant A, a paper checklist on one sheet: you sign at the bottom, after the last skill).
 */
export function StickyBar({ width = "form", stickyOn = "all", children }: { width?: keyof typeof WIDTH; stickyOn?: "all" | "never"; children: React.ReactNode }) {
  return (
    <div className={cn("z-20 bg-background", stickyOn === "all" ? "sticky bottom-0 border-t border-border bg-background/95 backdrop-blur-sm" : "")} data-region="submit-bar">
      <div className={cn("mx-auto flex w-full items-center gap-3 px-4 py-3 sm:px-6", WIDTH[width])}>{children}</div>
    </div>
  )
}
