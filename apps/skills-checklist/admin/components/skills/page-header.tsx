import * as React from "react"
import { PageHeader } from "@exxatdesignux/ui/components/ui/page-header"

/**
 * THE page frame for every shell page (admin, student view, preceptor demo): the DS PageHeader (serif h1, one purpose
 * line, optional actions) above a full-width content column with the prototype rhythm (16px between blocks, 24px side
 * and 20px vertical padding). Title font, inset, width and spacing are identical on every page because this is the only
 * place they are set. Exactly one filled primary lives in `actions` or in the content, never two (ux/08 P-12).
 */
export function PageFrame({ title, subtitle, actions, children }: { title: React.ReactNode; subtitle?: string; actions?: React.ReactNode; wide?: boolean; children?: React.ReactNode }) {
  return (
    <div className="flex w-full flex-col gap-4 px-6 py-5">
      <PageHeader title={title} subtitle={subtitle} actions={actions} className="px-0 pt-0 pb-0 lg:px-0 lg:pt-0 lg:pb-0" />
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
