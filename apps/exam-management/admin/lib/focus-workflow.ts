/**
 * Focus workflow routes — full-page tasks with no primary sidebar or secondary panel.
 * Register product-agnostic path suffixes here; product prefixes (`/prism`, `/design-os`, …)
 * are stripped before matching.
 */

import { normalizeLibraryPathname } from "@/lib/library-nav"
import { isExamLockPath } from "@/lib/exam-lock-shell"

/** Canonical suffixes (no product prefix). */
export const FOCUS_WORKFLOW_PATH_SUFFIXES = [
  "/library/new",
  "/focus-workflow",
] as const

function trimTrailingSlash(pathname: string): string {
  return pathname.length > 1 && pathname.endsWith("/") ? pathname.slice(0, -1) : pathname
}

/** Strip `/<product>` prefix so `/design-os/focus-workflow` → `/focus-workflow`. */
export function normalizeFocusWorkflowPath(pathname: string): string {
  const trimmed = trimTrailingSlash(pathname)
  const libraryNorm = normalizeLibraryPathname(trimmed)
  if (libraryNorm !== trimmed) return libraryNorm
  const withoutProduct = trimmed.replace(/^\/[^/]+(?=\/)/, "")
  return withoutProduct || trimmed
}

/** Whether the current route should hide primary + secondary sidebars. */
export function isSidebarHiddenPath(pathname: string): boolean {
  return isFocusWorkflowPath(pathname) || isExamLockPath(pathname)
}

/** Whether the current route should hide all shell sidebars (primary + secondary). */
export function isFocusWorkflowPath(pathname: string): boolean {
  const normalized = normalizeFocusWorkflowPath(pathname)
  return FOCUS_WORKFLOW_PATH_SUFFIXES.some(
    suffix => normalized === suffix || normalized.startsWith(`${suffix}/`),
  )
}
