"use client"

/**
 * A panel's empty placeholder (Romit 2026-11-17, D-ADD1117-e): a small calm illustration, one line, an optional muted fact.
 * Never a sentence that repeats buttons already on screen. The DS has no EmptyState or illustration export (1.8.1), so the
 * illustration is composed from Font Awesome: a neutral disc with the subject glyph and one small marker.
 */
import * as React from "react"
import { TYPE } from "@/components/lab/type-scale"

export function PanelEmpty({ icon, marker, title, meta, ...rest }: { icon: string; marker?: string; title: string; meta?: string } & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className="flex flex-col items-center gap-3 py-10 text-center" {...rest}>
      <span className="relative flex size-16 items-center justify-center rounded-full bg-[var(--dt-group-bg)]" aria-hidden="true">
        <i className={`fa-light ${icon} text-2xl text-muted-foreground`} />
        {marker ? (
          <span className="absolute -right-0.5 -bottom-0.5 flex size-6 items-center justify-center rounded-full border border-border bg-background">
            <i className={`fa-solid ${marker} text-xs text-foreground`} />
          </span>
        ) : null}
      </span>
      <div className="flex max-w-xs flex-col gap-0.5">
        <p className={`${TYPE.label} [overflow-wrap:anywhere]`}>{title}</p>
        {meta ? <p className={TYPE.meta}>{meta}</p> : null}
      </div>
    </div>
  )
}
