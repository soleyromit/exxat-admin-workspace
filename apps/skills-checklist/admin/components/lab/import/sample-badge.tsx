import { Badge } from "@exxatdesignux/ui/components/ui/badge"
import { PAGE_TITLE_TYPE_CLASS } from "@exxatdesignux/ui/components/ui/page-header"
import { SAMPLE_DATA_LABEL } from "@/lib/v2/labels"
import { LATER_LABEL } from "@/lib/lab/import"

/**
 * Every lab screen that shows invented or sample content says so (consistency audit item 10). Canonical placement: the
 * PageFrame actions slot (top right of the page header), never the scope bar or the page body.
 */
export function SampleDataBadge() {
  return <Badge variant="outline">{SAMPLE_DATA_LABEL}</Badge>
}

/** Marks a phase 2 route (import a file, starting points) wherever it is offered or shown. Calm, never a warning colour. */
export function LaterBadge({ className }: { className?: string }) {
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
