/**
 * Shared status chip labels, tint classes, and FA icon names for product list hubs
 * (Placements, Team, Compliance, Question bank — table, list, board).
 *
 * Labels use **sentence / title case** (e.g. "Due soon", "Under Review"). Do **not** add **`uppercase`**.
 *
 * **Rendering:** Use **`ListHubStatusBadge`** from `@/components/list-hub-status-badge`, or
 * **`StatusBadge`** from **`components/data-list-table-cells.tsx`** for placement rows (wrapper
 * around **`ListHubStatusBadge`** + **`PLACEMENT_STATUS_*`** below).
 *
 * **Semantic tints:** Map domain statuses onto **`LIST_HUB_STATUS_TINT_*`** before inventing new colors.
 */

import type { ComplianceStatus } from "@/lib/mock/compliance"
import type { QuestionBankStatus } from "@/lib/mock/question-bank"
import type { Status as PlacementStatus } from "@/lib/mock/placements"
import type { TeamMember } from "@/lib/mock/team"

// ─── Semantic variants (reuse for new entities) ─────────────────────────────

export const LIST_HUB_STATUS_TINT_SUCCESS =
  "bg-emerald-500/15 text-emerald-800 dark:text-emerald-200 border-emerald-500/20"

export const LIST_HUB_STATUS_TINT_WARNING =
  "bg-amber-500/15 text-amber-900 dark:text-amber-100 border-amber-500/20"

export const LIST_HUB_STATUS_TINT_NEUTRAL =
  "bg-slate-500/10 text-slate-700 dark:text-slate-200 border-border"

export const LIST_HUB_STATUS_TINT_DANGER =
  "bg-destructive/15 text-destructive border-destructive/20"

/** In-progress / review (distinct from warning where both appear — e.g. Placements “Under review”). */
export const LIST_HUB_STATUS_TINT_INFO =
  "bg-sky-500/15 text-sky-900 dark:text-sky-100 border-sky-500/20"

// ─── Placements (lifecycle status) ───────────────────────────────────────

export const PLACEMENT_STATUS_LABEL: Record<PlacementStatus, string> = {
  confirmed: "Confirmed",
  pending: "Pending",
  "under-review": "Under Review",
  rejected: "Rejected",
  completed: "Completed",
}

export const PLACEMENT_STATUS_BADGE_CLASS: Record<PlacementStatus, string> = {
  confirmed: LIST_HUB_STATUS_TINT_SUCCESS,
  pending: LIST_HUB_STATUS_TINT_WARNING,
  "under-review": LIST_HUB_STATUS_TINT_INFO,
  rejected: LIST_HUB_STATUS_TINT_DANGER,
  completed: LIST_HUB_STATUS_TINT_NEUTRAL,
}

export const PLACEMENT_STATUS_ICON: Record<PlacementStatus, string> = {
  confirmed: "fa-circle-check",
  pending: "fa-hourglass-half",
  "under-review": "fa-eye",
  rejected: "fa-circle-xmark",
  completed: "fa-clipboard-check",
}

// ─── Team ─────────────────────────────────────────────────────────────────

export type TeamMemberStatus = TeamMember["status"]

export const TEAM_MEMBER_STATUS_LABEL: Record<TeamMemberStatus, string> = {
  active: "Active",
  away: "Away",
  invited: "Invited",
}

export const TEAM_MEMBER_STATUS_BADGE_CLASS: Record<TeamMemberStatus, string> = {
  active: LIST_HUB_STATUS_TINT_SUCCESS,
  away: LIST_HUB_STATUS_TINT_WARNING,
  invited: LIST_HUB_STATUS_TINT_NEUTRAL,
}

/** Font Awesome icon per status — shape + label, not colour alone (WCAG 1.4.1). */
export const TEAM_MEMBER_STATUS_ICON: Record<TeamMemberStatus, string> = {
  active: "fa-circle-check",
  away: "fa-moon",
  invited: "fa-envelope",
}

// ─── Compliance ───────────────────────────────────────────────────────────

export const COMPLIANCE_STATUS_LABEL: Record<ComplianceStatus, string> = {
  compliant: "Compliant",
  due_soon: "Due soon",
  overdue: "Overdue",
  pending: "Pending",
}

export const COMPLIANCE_STATUS_BADGE_CLASS: Record<ComplianceStatus, string> = {
  compliant: LIST_HUB_STATUS_TINT_SUCCESS,
  due_soon: LIST_HUB_STATUS_TINT_WARNING,
  overdue: LIST_HUB_STATUS_TINT_DANGER,
  pending: LIST_HUB_STATUS_TINT_NEUTRAL,
}

export const COMPLIANCE_STATUS_ICON: Record<ComplianceStatus, string> = {
  compliant: "fa-shield-check",
  due_soon: "fa-clock",
  overdue: "fa-triangle-exclamation",
  pending: "fa-hourglass-half",
}

// ─── Question bank ────────────────────────────────────────────────────────

export const QUESTION_BANK_STATUS_LABEL: Record<QuestionBankStatus, string> = {
  published: "Published",
  draft: "Draft",
  in_review: "In review",
}

export const QUESTION_BANK_STATUS_BADGE_CLASS: Record<QuestionBankStatus, string> = {
  published: LIST_HUB_STATUS_TINT_SUCCESS,
  draft: LIST_HUB_STATUS_TINT_NEUTRAL,
  in_review: LIST_HUB_STATUS_TINT_WARNING,
}

export const QUESTION_BANK_STATUS_ICON: Record<QuestionBankStatus, string> = {
  published: "fa-circle-check",
  draft: "fa-pen-field",
  in_review: "fa-user-magnifying-glass",
}
