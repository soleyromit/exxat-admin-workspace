import * as React from "react"
import { Card } from "@exxatdesignux/ui/components/ui/card"
import { EmptyState } from "@/components/skills"
import { home } from "@/lib/copy/home"
import { isFirstRun, type HomeSummary } from "@/lib/home/derive"
import { HOME_LINKS } from "@/lib/home/links"
import { ROUTES } from "@/lib/skills-routes"
import { LinkButton } from "./link-button"

export type RowKey = "approvals" | "lab" | "unmapped"

interface RowSpec {
  key: RowKey
  label: string
  reason: string
  /** null = the figure could not be loaded: the row says so and never shows a stale or zero value. */
  count: number | null
  href: string
  action: string
  ariaLabel: string
}

/**
 * One attention row: label, count and reason read in that order as one list item (contract 10). The action is a link into the
 * surface that owns the work; Home changes nothing. Informational rows (unmapped) never use the word "must" (CM-05).
 */
export function AttentionRow({ label, reason, count, href, action, ariaLabel }: Omit<RowSpec, "key">) {
  return (
    <li className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-3" data-testid="attention-row">
      <div className="flex min-w-0 flex-1 basis-64 flex-col gap-0.5">
        <h3 className="flex flex-wrap items-baseline gap-x-2 text-sm font-semibold text-foreground">
          <span>{label}</span>
          <span className="sr-only">: </span>
          <span className="tabular-nums" data-testid="attention-count">
            {count === null ? home.unavailable : count}
          </span>
        </h3>
        <p className="text-sm text-muted-foreground">{reason}</p>
      </div>
      {count === null ? null : (
        <LinkButton href={href} aria-label={ariaLabel}>
          {action}
        </LinkButton>
      )}
    </li>
  )
}

export function AttentionList({ summary: s, unavailable = [] }: { summary: HomeSummary; unavailable?: RowKey[] }) {
  const first = isFirstRun(s)
  const down = (k: RowKey) => unavailable.includes(k)
  const rows: RowSpec[] = []
  if (down("approvals") || (s.approvalEnabled && s.awaitingApproval > 0))
    rows.push({ key: "approvals", ...home.attention.approvals, count: down("approvals") ? null : s.awaitingApproval, href: ROUTES.reviews, action: home.buttons.review, ariaLabel: home.aria.reviewApprovals })
  if (down("lab") || s.namedLabInstructors > 0)
    rows.push({ key: "lab", ...home.attention.lab, count: down("lab") ? null : s.namedLabInstructors, href: HOME_LINKS.labInstructors, action: home.buttons.review, ariaLabel: home.aria.reviewLab })
  if (down("unmapped") || s.unmapped > 0)
    rows.push({ key: "unmapped", ...home.attention.unmapped, count: down("unmapped") ? null : s.unmapped, href: ROUTES.courses, action: home.buttons.open, ariaLabel: home.aria.openUnmapped })

  return (
    <section aria-labelledby="home-attention-heading" className="flex flex-col gap-3" data-testid="attention-section">
      <h2 id="home-attention-heading" className="text-base font-semibold text-foreground">
        {home.attention.heading}
      </h2>
      {rows.length === 0 ? (
        <EmptyState
          icon="fa-circle-check"
          title={first ? home.attention.emptyFirstRun : home.attention.emptyTitle}
          description={first ? home.attention.emptyDescription : home.attention.emptyNext}
          headingLevel={3}
          footer={
            first ? undefined : (
              <LinkButton href={ROUTES.attainment}>{home.buttons.openAttainment}</LinkButton>
            )
          }
        />
      ) : (
        <Card className="gap-0 py-0">
          <ul aria-label={home.aria.attention} className="flex flex-col divide-y divide-border">
            {rows.map(({ key, ...r }) => (
              <AttentionRow key={key} {...r} />
            ))}
          </ul>
        </Card>
      )}
    </section>
  )
}
