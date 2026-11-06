"use client"

/** The sticky row of section anchors on the one-page Configure (variant B): one skill and several. */
import * as React from "react"
import { Badge } from "@exxatdesignux/ui/components/ui/badge"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import { cn } from "@exxatdesignux/ui/lib/utils"
import type { CONFIGURE_STEPS, ConfigureStepId } from "@/lib/lab/configure"

export const anchor = (id: ConfigureStepId) => `cfg-sec-${id}`

export function scrollToSection(id: ConfigureStepId) {
  const el = document.getElementById(anchor(id))
  if (!el) return
  el.scrollIntoView({ block: "start" })
  const h = document.getElementById(`${anchor(id)}-title`)
  h?.focus({ preventScroll: true })
}

export function SectionNav({ steps, active, labels, counts }: { steps: typeof CONFIGURE_STEPS; active: ConfigureStepId; labels: Record<ConfigureStepId, string>; counts: Partial<Record<ConfigureStepId, number>> }) {
  return (
    <nav aria-label="Sections" className="sticky top-0 z-10 -mx-1 border-b border-border bg-background px-1 py-2" data-region="section-nav">
      <ul className="flex gap-1 overflow-x-auto">
        {steps.map((s) => (
          <li key={s.id} className="shrink-0">
            <Button asChild variant="ghost" size="sm" className={cn("gap-2", active === s.id && "bg-muted text-foreground")}>
              <a
                href={`#${anchor(s.id)}`}
                aria-current={active === s.id ? "location" : undefined}
                onClick={(e) => {
                  e.preventDefault()
                  scrollToSection(s.id)
                }}
              >
                {labels[s.id]}
                {counts[s.id] ? <Badge variant="outline">{`${counts[s.id]} to fix`}</Badge> : null}
              </a>
            </Button>
          </li>
        ))}
      </ul>
    </nav>
  )
}
