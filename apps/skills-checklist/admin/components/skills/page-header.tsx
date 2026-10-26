import * as React from "react"
import { PageHeader, type PageHeaderActionItem } from "@exxatdesignux/ui/components/ui/page-header"
import { cn } from "@exxatdesignux/ui/lib/utils"

export type PageFrameWidth = "full" | "reading" | "wide" | "form" | "wizard"

const WIDTH_CLASS: Record<PageFrameWidth, string> = {
  full: "",
  reading: "max-w-3xl",
  wide: "max-w-5xl",
  // Lab templates T3 and T2 (docs/knowledge/design/skill-setup-journey/01 section 2): 720 px form, 960 px wizard.
  form: "max-w-[45rem]",
  wizard: "max-w-[60rem]",
}

/**
 * THE page frame for every shell page (admin, student view, preceptor demo): the DS PageHeader (serif h1, one purpose
 * line, optional actions) above a content column with the prototype rhythm (16px between blocks, 20px vertical padding).
 * Title font, inset, width and spacing are identical on every page because this is the only place they are set.
 *
 * - `actionItems`: the only way v2 pages put commands in the header (DS responsive action row). At most one filled primary
 *   per page, at most two `row` items, everything else `overflow`. `actions` stays for v1 callers only.
 * - `width`: `full` (lists, dashboards), `reading` (max-w-3xl, forms and detail), `wide` (max-w-5xl, side by side). Always
 *   left aligned, never centred, so the title and the body share one left edge.
 * - `lead`: content above the header inside the same column (the student sync strip and device banners).
 * - `gutter`: `responsive` (px-4 below 768px, px-6 from 768px) is the default; `fixed` keeps the old px-6 for v1 pages.
 */
export function PageFrame({
  title,
  subtitle,
  actions,
  actionItems,
  width = "full",
  lead,
  gutter = "responsive",
  children,
}: {
  title: React.ReactNode
  subtitle?: React.ReactNode
  /** v1 only. v2 pages use `actionItems`. */
  actions?: React.ReactNode
  actionItems?: PageHeaderActionItem[]
  width?: PageFrameWidth
  lead?: React.ReactNode
  gutter?: "responsive" | "fixed"
  children?: React.ReactNode
}) {
  return (
    <div className={cn("flex w-full flex-col gap-4 py-5", gutter === "fixed" ? "px-6" : "px-4 md:px-6", WIDTH_CLASS[width])}>
      {lead}
      <PageHeader title={title} subtitle={subtitle} actions={actions} actionItems={actionItems} className="px-0 pt-0 pb-0 lg:px-0 lg:pt-0 lg:pb-0" />
      {children}
    </div>
  )
}

/** A titled region inside a page. The heading is an h2 so the outline stays valid under the page h1. */
export function PageSection({ title, description, children, id }: { title: string; description?: string; children?: React.ReactNode; id?: string }) {
  return (
    <section aria-labelledby={id ? `${id}-heading` : undefined} className="flex flex-col gap-3">
      <div className="flex flex-col gap-0.5">
        <h2 id={id ? `${id}-heading` : undefined} className="text-base font-semibold text-foreground">
          {title}
        </h2>
        {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
      </div>
      {children}
    </section>
  )
}
