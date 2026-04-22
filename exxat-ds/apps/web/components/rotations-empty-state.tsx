"use client"

/**
 * Rotations hub — main canvas when no rotation detail is selected.
 * Pairs with SecondaryPanel (nested sidebar); CTA reopens the panel if closed.
 */

import { Button } from "@/components/ui/button"
import { useSecondaryPanel } from "@/components/secondary-panel"

export function RotationsEmptyState() {
  const { openPanel } = useSecondaryPanel()

  return (
    <section
      aria-labelledby="rotations-empty-title"
      className="flex flex-1 flex-col items-center justify-center rounded-xl border border-dashed border-border/80 bg-muted/25 px-6 py-12 text-center min-h-[min(420px,calc(100svh-var(--header-height)-6rem))]"
    >
      <div className="mb-6 w-full max-w-[min(100%,280px)] shrink-0">
        <img
          src="/Illustration/Rotation.svg"
          alt=""
          width={622}
          height={559}
          decoding="async"
          className="h-auto w-full select-none"
        />
      </div>
      <h2
        id="rotations-empty-title"
        className="font-heading text-xl font-semibold tracking-tight text-foreground sm:text-2xl"
      >
        Select a rotation
      </h2>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
        Use the rotations panel next to the sidebar to browse cycles, open a rotation for
        details, or review schedules and assigned students.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Button type="button" size="lg" onClick={() => openPanel("rotations")}>
          <i className="fa-light fa-sidebar text-[15px]" aria-hidden="true" />
          Open rotations panel
        </Button>
      </div>
    </section>
  )
}
