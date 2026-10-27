"use client"

/**
 * Admin Approvals A: the reviewer triage list, reused unchanged (components/lab/screens/reviewer-approvals-a.tsx), with the admin
 * permission set (lib/lab/rbac.ts). Role is a permission, not a path (strategy/01 IA-3): the queue, its scope, counts and decisions
 * are the reviewer's own; the admin adds one thing, "Approval rules" in the header, which opens the rules beside the queue (SC-15).
 * No role chip on the page: strategy/01 7.2 keeps it in the bar's role switch. Question: is the reviewer's list plus one rules
 * button enough for an admin who also approves?
 */
import * as React from "react"
import { ReviewerApprovalsA } from "@/components/lab/screens/reviewer-approvals-a"
import { HeaderActionSlot, RulesSheetTrigger } from "@/components/lab/rbac/approval-rules"
import { ApprovalsTabsContext } from "@/components/lab/reviewer/approvals-frame"

export function AdminApprovalsA() {
  return (
    // Admin Approvals adds the New evaluators tab (Romit 2026-10-27); the reviewer's own page has the Evaluations list only.
    <ApprovalsTabsContext.Provider value>
      <HeaderActionSlot action={<RulesSheetTrigger role="admin" />}>
        <ReviewerApprovalsA />
      </HeaderActionSlot>
    </ApprovalsTabsContext.Provider>
  )
}
