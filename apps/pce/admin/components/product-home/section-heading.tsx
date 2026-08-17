"use client"

import type * as React from "react"

/**
 * Section heading for the products home — the two product shelves use it.
 *
 * Extracted from `product-home-page` so the sections that live in their own
 * files set their heading the same way the launcher and the shelf do, rather
 * than each re-typing the same elements.
 *
 * No description line. Each section used to carry one, and every one of them
 * restated its own title in a longer sentence, which is a caption for a reader
 * who has not read the thing directly underneath it. The cards say what they
 * are.
 *
 * Optional `actions` sits on the trailing edge (e.g. What's new scroll
 * chevrons). Omit it for title-only rows.
 */

export function SectionHeading({
  title,
  id,
  actions,
}: {
  title: string
  id?: string
  actions?: React.ReactNode
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
      <h2 id={id} className="min-w-0 text-base font-semibold tracking-tight">
        {title}
      </h2>
      {actions ? <div className="ms-auto shrink-0">{actions}</div> : null}
    </div>
  )
}
