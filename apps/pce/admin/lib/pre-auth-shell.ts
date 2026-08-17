/**
 * Pre-auth shell — the front door, with no workspace chrome at all.
 *
 * Stricter than the exam lock shell, which strips chrome because the chrome
 * would distract. Here the chrome cannot render: there is no session, so the
 * sidebar has nowhere to navigate, the command palette has nothing to search,
 * Ask Leo has no records to answer about, and the profile menu has no identity.
 *
 * Register product-agnostic path suffixes here.
 */

function trimTrailingSlash(pathname: string): string {
  return pathname.length > 1 && pathname.endsWith("/") ? pathname.slice(0, -1) : pathname
}

/** Canonical suffixes (no product prefix). */
export const PRE_AUTH_PATH_SUFFIXES = ["/login"] as const

/** Whether the current route is a pre-auth surface. */
export function isPreAuthPath(pathname: string): boolean {
  const normalized = trimTrailingSlash(pathname)
  return PRE_AUTH_PATH_SUFFIXES.some(
    suffix => normalized === suffix || normalized.startsWith(`${suffix}/`),
  )
}
