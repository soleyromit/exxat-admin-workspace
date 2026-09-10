/**
 * Shared status chip tints + dashboard task-priority chips.
 *
 * **Rendering primitive:** `StatusBadge` (`@/components/ui/status-badge`) for any
 * semantic status chip. Map domain statuses onto `STATUS_BADGE_TONE_CLASS` before
 * introducing new colors.
 *
 * **Reference consumers:** `columns-showcase.tsx` (catalog),
 * `library-board-view.tsx` (board card status row), `task-priority-badge.tsx`
 * (dashboard task chips).
 *
 * **Icon-on-tinted-disc** (insights / activity rows): `TintedIconDisc` + `--icon-disc-*`
 * in `app/globals.css`.
 *
 * Labels stay **sentence / title case** (e.g. "Due soon", "Under review"). Do **not**
 * add `uppercase`.
 */

export {
  STATUS_BADGE_TONE_CLASS,
  type StatusBadgeTone,
} from "@exxatdesignux/ui/lib/status-badge-tints"

// ─── Dashboard task priority ────────────────────────────────────────────────

import { STATUS_BADGE_TONE_CLASS } from "@exxatdesignux/ui/lib/status-badge-tints"

export type TaskPriorityLevel = "high" | "medium" | "low"

export const TASK_PRIORITY_LABEL: Record<TaskPriorityLevel, string> = {
  high: "High",
  medium: "Medium",
  low: "Low",
}

export const TASK_PRIORITY_BADGE_CLASS: Record<TaskPriorityLevel, string> = {
  high: STATUS_BADGE_TONE_CLASS.danger,
  medium: STATUS_BADGE_TONE_CLASS.warning,
  low: STATUS_BADGE_TONE_CLASS.neutral,
}

export function normalizeTaskPriority(priority: string): TaskPriorityLevel | null {
  const k = priority.toLowerCase()
  if (k === "high" || k === "medium" || k === "low") return k
  return null
}
