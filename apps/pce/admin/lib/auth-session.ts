/**
 * Demo session for the pre-auth shell.
 *
 * This shell has no auth server, so "signed in" is a per-device flag in the same
 * family as `builder:onboarding-complete:v1`. It exists so the front door is
 * walkable end to end: `/login` can hand off to the workspace, `Log out` can
 * hand back, and `/` can tell the two states apart.
 *
 * Swapping in real auth means replacing the three functions below with calls to
 * the session API. Nothing else reads the storage key directly, so no caller has
 * to change.
 */

import {
  getStorageItem,
  removeStorageItem,
  setStorageItem,
} from "@exxatdesignux/ui/lib/persisted-state"

/** Identifier of the signed-in person. Absent means signed out. */
const AUTH_SESSION_KEY = "auth:session-identifier:v1"

/** Identifier accepted at step one when nothing was typed. Demo affordance. */
export const DEMO_SESSION_IDENTIFIER = "super.admin"

/** The signed-in identifier, or `null` when there is no session. */
export function getAuthSession(): string | null {
  const identifier = getStorageItem(AUTH_SESSION_KEY)
  return identifier && identifier.length > 0 ? identifier : null
}

export function isSignedIn(): boolean {
  return getAuthSession() !== null
}

/** Open a session. Callers navigate afterwards; this only records the identity. */
export function signIn(identifier: string): void {
  const trimmed = identifier.trim()
  setStorageItem(AUTH_SESSION_KEY, trimmed || DEMO_SESSION_IDENTIFIER)
}

export function signOut(): void {
  removeStorageItem(AUTH_SESSION_KEY)
}
