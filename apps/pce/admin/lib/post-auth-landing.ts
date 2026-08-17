/**
 * Where someone lands once they have a session.
 *
 * Two callers ask the same question and must not answer it differently: the
 * login page after a successful sign-in, and `/` when it finds an existing
 * session. Keeping the ladder here is why the cold-start onboarding entry
 * survived moving sign-in in front of it.
 */

import { getStorageItem } from "@exxatdesignux/ui/lib/persisted-state"

import { isPreAuthPath } from "@/lib/pre-auth-shell"

/** Per-device flag set when the builder onboarding flow completes. */
export const ONBOARDING_COMPLETE_KEY = "builder:onboarding-complete:v1"

export function isOnboardingComplete(): boolean {
  return getStorageItem(ONBOARDING_COMPLETE_KEY) === "true"
}

/**
 * Reject anything that could leave the app. A `?next=` value arrives from the
 * URL bar, so `//evil.example` and `https://evil.example` have to be refused
 * before they reach `navigate()`; both are valid `to` values that would carry
 * the visitor off-origin straight after they typed a password.
 *
 * Resolved against the current origin rather than pattern-matched, because the
 * patterns are not knowable by hand: `/\evil.example` starts with exactly one
 * slash and passes any `startsWith("//")` guard, yet the URL parser folds the
 * backslash into a second slash and hands back `evil.example` as the host. The
 * parser is the only thing that agrees with what the browser will actually do.
 */
function safeInternalPath(next: string | null | undefined): string | null {
  if (!next || !next.startsWith("/")) return null

  let url: URL
  try {
    url = new URL(next, window.location.origin)
  } catch {
    return null
  }
  if (url.origin !== window.location.origin) return null

  // Bouncing back to sign-in would strand a freshly signed-in person on the
  // form they just completed, since /login does not send a session away.
  if (isPreAuthPath(url.pathname)) return null

  return `${url.pathname}${url.search}${url.hash}`
}

/**
 * `next` first (someone deep-linked and got bounced here), then first-run
 * onboarding, then the products home.
 */
/**
 * The products launcher. Named because it is the one landing path that is a
 * waiting room rather than a destination, which changes how deep links beat it
 * (see `PostChoiceAllowance`).
 */
export const PRODUCTS_HOME_PATH = "/home"

export function postAuthLandingPath(next?: string | null): string {
  const requested = safeInternalPath(next)
  if (requested) return requested
  return isOnboardingComplete() ? PRODUCTS_HOME_PATH : "/builder/onboarding"
}

/**
 * How much of a deep link survives a branching sign-in flow.
 *
 * `none` — the choice overrules the link. A student who deep-linked a
 *   coordinator hub before signing in still must not be dropped into it.
 * `any` — the link stands, because the choice does not restrict where they may go.
 * `{ withinRoot }` — the link stands only if it is inside the product they
 *   picked. Honouring `/prism/library` after someone chose Exxat One would land
 *   them in the product they just gave up.
 */
export type PostChoiceAllowance = "none" | "any" | { withinRoot: string }

export function postChoiceLandingPath(
  next: string | null | undefined,
  fallback: string,
  allow: PostChoiceAllowance,
): string {
  if (allow === "none") return fallback

  const requested = safeInternalPath(next)
  if (!requested) return fallback
  if (allow === "any") return requested

  const root = allow.withinRoot
  return requested === root || requested.startsWith(`${root}/`) ? requested : fallback
}
