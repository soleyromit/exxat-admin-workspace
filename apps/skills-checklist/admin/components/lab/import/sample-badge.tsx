"use client"

import { Badge } from "@exxatdesignux/ui/components/ui/badge"
import { PAGE_TITLE_TYPE_CLASS } from "@exxatdesignux/ui/components/ui/page-header"
import { LATER_LABEL } from "@/lib/lab/import"
import { usePresent } from "@/components/lab/lab-bar/present"

/**
 * Retired (Romit 2026-10-27: "remove sample data tags from everywhere"; LEDGER D-L11, supersedes the label part of D-X23). The
 * chip renders nothing in any mode; call sites stay so the change is one line to reverse. The data is still fictional (D-X23).
 */
export function SampleDataBadge(): null {
  return null
}

/**
 * Marks a phase 2 route (import a file, starting points) wherever it is offered or shown. Calm, never a warning colour. A lab
 * label: present mode hides it, like every internal label (Romit 2026-10-27, walkthrough text cut).
 */
export function LaterBadge({ className }: { className?: string }) {
  const { present } = usePresent()
  if (present) return null
  return <Badge variant="secondary" className={className}>{LATER_LABEL}</Badge>
}

/**
 * A page title with the Later badge beside it. PageHeader renders a string title as its h1 but a node as-is, so this keeps
 * the h1 and the DS title type (PAGE_TITLE_TYPE_CLASS) and adds the badge after it, outside the heading text.
 */
export function LaterTitle({ children }: { children: string }) {
  return (
    <div className="flex min-w-0 flex-wrap items-center gap-2">
      <h1 className={PAGE_TITLE_TYPE_CLASS}>{children}</h1>
      <LaterBadge />
    </div>
  )
}
