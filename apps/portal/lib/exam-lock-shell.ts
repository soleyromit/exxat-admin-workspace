/**
 * Exam lock shell — full-viewport assessment delivery with no workspace chrome.
 * Register product-agnostic path suffixes here; product prefixes are stripped before matching.
 */

function trimTrailingSlash(pathname: string): string {
  return pathname.length > 1 && pathname.endsWith("/") ? pathname.slice(0, -1) : pathname
}

/** Canonical suffixes (no product prefix). */
export const EXAM_LOCK_PATH_SUFFIXES = ["/exam-lock"] as const

/** Strip `/<product>` prefix so `/design-os/exam-lock` → `/exam-lock`. */
export function normalizeExamLockPath(pathname: string): string {
  const trimmed = trimTrailingSlash(pathname)
  const withoutProduct = trimmed.replace(/^\/[^/]+(?=\/)/, "")
  return withoutProduct || trimmed
}

/** Whether the current route uses the exam lock shell (no nav, Leo, or command palette). */
export function isExamLockPath(pathname: string): boolean {
  const normalized = normalizeExamLockPath(pathname)
  return EXAM_LOCK_PATH_SUFFIXES.some(
    suffix => normalized === suffix || normalized.startsWith(`${suffix}/`),
  )
}
