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
  titleEnd,
  className,
  children,
  ...rest
}: {
  /** Left out on the bulk page (map D4: no numbered steps). */
  n?: number
  title: string
  /** Beside the title on the same line (a Mixed section on the several-skills page is this line and nothing else). */
  titleEnd?: React.ReactNode
  lead?: string
  id?: string
  headingId?: string
  first?: boolean
  className?: string
  children?: React.ReactNode
} & Omit<React.HTMLAttributes<HTMLElement>, "title">) {
  const hid = headingId ?? (id ? `${id}-title` : undefined)
  return (
    <section id={id} aria-labelledby={hid} className={cn("flex scroll-mt-16 flex-col gap-4", !first && "border-t border-border pt-8", className)} data-config-section {...rest}>
      <div className="flex flex-col gap-1" data-step-head>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <h2 id={hid} tabIndex={-1} className={cn("flex items-baseline gap-2 leading-5 outline-none", TYPE.section)}>
            {n != null ? (
              <span className="tabular-nums text-muted-foreground" aria-hidden="true">
                {n}
              </span>
            ) : null}
            <span>{title}</span>
          </h2>
          {titleEnd}
        </div>
        {lead ? <p className={cn("ps-5", TYPE.helper)}>{lead}</p> : null}
      </div>
      {children != null ? <div className={n != null ? "@container ps-5" : "@container"}>{children}</div> : null}
    </section>
  )
}

/**
 * One row of a configure section: a gutter label (fa-light icon and heading) and the controls beside it, so the single-skill page
 * and the several-skills page cannot drift (D-L52). The gutter stacks over the controls when the section is narrower than 30rem
 * (container query: the section's width decides, not the window's).
 */
export function ConfigRow({ icon, title, id, first, children }: { icon: string; title: string; id: string; first?: boolean; children: React.ReactNode }) {
  const hid = `${id}-title`
  return (
    <section id={id} aria-labelledby={hid} className={cn("grid gap-3 @min-[30rem]:grid-cols-[8rem_minmax(0,1fr)] @min-[30rem]:gap-4", !first && "border-t border-border pt-6")} data-config-group>
      <h3 id={hid} className={cn("flex items-center gap-2 self-start leading-5", TYPE.group)}>
        <i className={`fa-light ${icon} w-4 text-center text-muted-foreground`} aria-hidden="true" />
        {title}
      </h3>
      <div className="flex min-w-0 max-w-2xl flex-col gap-4">{children}</div>
    </section>
  )
}

export type ConfigRole = "student" | "evaluator" | "approval"
export const ROLE_ROW: Record<ConfigRole, { icon: string; title: string; id: string }> = {
  student: { icon: "fa-user-graduate", title: "Student", id: "cfg-signoff-student" },
  evaluator: { icon: "fa-signature", title: "Evaluator", id: "cfg-signoff-evaluator" },
  approval: { icon: "fa-stamp", title: "Approval", id: "cfg-signoff-approval" },
}

/** A row of "Who does what": Student, Evaluator or Approval. */
export function RoleRow({ role, children }: { role: ConfigRole; children: React.ReactNode }) {
  return <ConfigRow {...ROLE_ROW[role]} first={role === "student"}>{children}</ConfigRow>
}
