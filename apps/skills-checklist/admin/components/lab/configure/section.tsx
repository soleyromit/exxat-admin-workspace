"use client"

/**
 * One configure section: a numbered title (the question the admin answers), at most one short line, then the fields. The same
 * style for every section on every configure page (Romit 2026-10-27: "need a good and proper content hierarchy"):
 *   page title (h1, serif)  >  section title (h2, 16 px semibold, numbered)  >  field label (14 px medium)  >  body (14 px)
 * Sections after the first are separated by a rule and the same spacing; nothing folds.
 */
import * as React from "react"
import { cn } from "@exxatdesignux/ui/lib/utils"
import { TYPE } from "@/components/lab/type-scale"

export function ConfigSection({
  n,
  title,
  lead,
  id,
  headingId,
  first,
  className,
  children,
  ...rest
}: {
  n: number
  title: string
  lead?: string
  id?: string
  headingId?: string
  first?: boolean
  className?: string
  children: React.ReactNode
} & Omit<React.HTMLAttributes<HTMLElement>, "title">) {
  const hid = headingId ?? (id ? `${id}-title` : undefined)
  return (
    <section id={id} aria-labelledby={hid} className={cn("flex scroll-mt-16 flex-col gap-4", !first && "border-t border-border pt-8", className)} data-config-section {...rest}>
      <div className="flex flex-col gap-1" data-step-head>
        <h2 id={hid} tabIndex={-1} className={cn("flex items-baseline gap-2 leading-5 outline-none", TYPE.section)}>
          <span className="tabular-nums text-muted-foreground" aria-hidden="true">
            {n}
          </span>
          <span>{title}</span>
        </h2>
        {lead ? <p className={cn("ps-5", TYPE.helper)}>{lead}</p> : null}
      </div>
      <div className="@container ps-5">{children}</div>
    </section>
  )
}

/**
 * A numbered group inside one configure step, in the same title style as ConfigSection but one heading level down (h3), so a
 * step can group its fields by subject (Romit relaying Sankalp 2026-10-28, Who signs: 1 Student, 2 Evaluator, 3 Approval).
 */
export function ConfigSubsection({ n, title, id, first, children }: { n: number; title: string; id: string; first?: boolean; children: React.ReactNode }) {
  const hid = `${id}-title`
  return (
    <section id={id} aria-labelledby={hid} className={cn("flex flex-col gap-3", !first && "border-t border-border pt-6")} data-config-group>
      {/* Plain group heading (Romit 2026-10-28): no inner number, so it never competes with the step's own number. */}
      <h3 id={hid} className={cn("leading-5", TYPE.group)} data-group-n={n}>
        {title}
      </h3>
      <div className="flex max-w-2xl flex-col gap-4">{children}</div>
    </section>
  )
}
