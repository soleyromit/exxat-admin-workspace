"use client"

/**
 * Admin Approvals B: rules and queue on one page. The shared ApprovalsFrame (header, scope bar, decisions, every empty and loading
 * state) with a rule-first body: the queue summary line, then one row per skill that holds evidence for approval or holds a
 * submission now, with how many it holds, the oldest wait and "Change rule" (admin only, SC-15). Submissions held for other
 * reasons (evaluator not assigned, disagreement, paper form) are one line with a link to the triage list. Question: does seeing the
 * rule behind the queue help an admin decide whether to change the rule rather than clear the backlog?
 */
import * as React from "react"
import { ApprovalsFrame } from "@/components/lab/reviewer/approvals-frame"
import { SummaryLine } from "@/components/lab/reviewer/parts"
import { RulesTable } from "@/components/lab/rbac/approval-rules"
import { approvalRules } from "@/lib/lab/rbac"
import { REASON_META, REASON_ORDER, plural, reviewItemHref } from "@/lib/lab/reviewer"

export function AdminApprovalsB() {
  return (
    <ApprovalsFrame variant="B">
      {(ctx) => {
        const model = ctx.state ? approvalRules(ctx.state, ctx.rowsInScope) : null
        if (!model || !ctx.summary) return null
        const notRule = ctx.rowsInScope.filter((r) => !r.reasons.includes("rule"))
        const byReason = (k: (typeof REASON_ORDER)[number]) => notRule.filter((r) => r.reason === k).length
        const others = REASON_ORDER.filter((r) => r !== "rule" && byReason(r) > 0)
        return (
          <div className="flex flex-col gap-4" data-admin-approvals="B">
            <SummaryLine summary={ctx.summary} oldestHref={ctx.rowsInScope[0] ? reviewItemHref(ctx.scope, ctx.rowsInScope[0].key) : undefined} />
            <section aria-labelledby="rules-heading" className="flex flex-col gap-2">
              <h2 id="rules-heading" className="text-sm font-semibold text-foreground">
                {`Held by a rule · ${plural(model.ruleHeld, "submission", "submissions")}`}
              </h2>
              <RulesTable rows={model.rules} scope={ctx.scope} role="admin" />
            </section>
            {model.otherReasons > 0 ? (
              <p className="text-sm text-muted-foreground" data-other-reasons>
                {`${plural(model.otherReasons, "more waits", "more wait")} for other reasons: `}
                {others.map((r, i) => (
                  <React.Fragment key={r}>
                    {i ? ", " : ""}
                    {`${REASON_META[r].label.toLowerCase()} ${byReason(r)}`}
                  </React.Fragment>
                ))}
                {"."}
              </p>
            ) : null}
          </div>
        )
      }}
    </ApprovalsFrame>
  )
}
