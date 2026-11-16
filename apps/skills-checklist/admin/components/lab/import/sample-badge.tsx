"use client"

import { PAGE_TITLE_TYPE_CLASS } from "@exxatdesignux/ui/components/ui/page-header"
import { LocalBanner } from "@exxatdesignux/ui/components/ui/banner"

/**
 * Retired (Romit 2026-10-27: "remove sample data tags from everywhere"; LEDGER D-L11, supersedes the label part of D-X23). The
 * chip renders nothing in any mode; call sites stay so the change is one line to reverse. The data is still fictional (D-X23).
 */
export function SampleDataBadge(): null {
  return null
}

/**
 * Marks a phase 2 route (import a file, starting points) wherever it is offered or shown. Calm, never a warning colour. It is not a lab
 * label: it says these do not add skills yet, so it stays when presenting too (a success message must be true).
 */
// Retired 2026-11-15: the phase tag is internal and never shows to users. Call sites stay; it renders nothing.
export function LaterBadge(_props: { className?: string }): null {
  return null
}

/**
 * A page title with the Later badge beside it. PageHeader renders a string title as its h1 but a node as-is, so this keeps
 * the h1 and the DS title type (PAGE_TITLE_TYPE_CLASS) and adds the badge after it, outside the heading text.
 */
export function LaterTitle({ children }: { children: string }) {
  return (
<h1 className={PAGE_TITLE_TYPE_CLASS}>{children}</h1>
  )
}

/** Says the plain truth on a Later page: it previews, and adds nothing. */
export function LaterNotice({ children }: { children: string }) {
  return <LocalBanner variant="info">{children}</LocalBanner>
}
