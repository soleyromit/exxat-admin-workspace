/**
 * What a sign-in hands to the session it opens.
 *
 * Sign-in decides more than whether you are let in. It decides which apps you
 * may open, and therefore what the products home lists as yours versus what it
 * tries to sell you. A flow authored in `/builder/sign-in-flows` writes one of
 * these records on its way out, and the surfaces downstream read it: entitlement
 * in `product-catalog.ts`, who administers the workspace in `workspace-role.ts`,
 * and the two home sections in `product-home-page.tsx`.
 *
 * It replaces an earlier key that stored a single granted product id, which
 * could not say "Clinical Education and Exxat One" and could not say anything at
 * all about what the home page should show. That key is still read once, so a
 * session opened before this shape existed does not lose its grant.
 *
 * Prototype wiring. When real auth lands, a server answers all of this from
 * session claims and this module goes away.
 */

import {
  getStorageItem,
  removeStorageItem,
  setStorageItem,
} from "@exxatdesignux/ui/lib/persisted-state"
import type { Product } from "@exxatdesignux/product-framework"

/**
 * Products a flow may grant. Both are entitled by default, which is what makes
 * them useful for a demo: granting one narrows, granting both restates.
 */
export const GRANTABLE_PRODUCTS: readonly { value: Product; label: string }[] = [
  { value: "exxat-prism", label: "Clinical Education" },
  { value: "exxat-one-schools", label: "Exxat One" },
  // Three more school-side apps, because the first two cannot show what happens
  // when a product is licensed for some programs and not others: both are
  // licensed for every program, so no pair of them can disagree. These three are
  // licensed narrowly in `scope-entitlement.ts`, one licence shape each, and
  // granting one alongside Clinical Education is what makes the program question
  // reachable from the UI rather than only by URL: one program, two programs, or
  // two schools' worth.
  { value: "exxat-exam-management", label: "Exam Management" },
  { value: "exxat-accreditation", label: "Accreditation" },
  { value: "exxat-compliance", label: "Compliance" },
]

/**
 * Who this sign-in is to the workspace: one answer, never a pair of flags.
 *
 * It was a boolean, `adminAccess`, next to a landing path that happened to be
 * the student home. Two fields meant "student" and "administers the workspace"
 * could both be set, and the rule that students never administer lived in
 * whoever remembered to untick the box. One field makes the combination
 * unwritable, in storage and in the builder alike.
 *
 * `student` and `member` both deny the console, and they are still separate
 * values because they are different claims about the person: a member is staff
 * without a console, a student is not staff at all. Merging them would leave the
 * record unable to say "student", which is the only way the rule can be a fact
 * about the data rather than a habit.
 */
export type WorkspaceRole = "student" | "member" | "administrator"

/** The role a flow may hand a session, in the order the builder offers them. */
export const WORKSPACE_ROLES: readonly { value: WorkspaceRole; label: string }[] = [
  { value: "administrator", label: "Administrator" },
  { value: "member", label: "Member" },
  { value: "student", label: "Student" },
]

/**
 * How a role reads on a door rather than in a settings field.
 *
 * `member` is "school" here and "Member" in `WORKSPACE_ROLES`, because the two
 * say different things: the builder is naming a role in a record, while a button
 * on a product card is naming the side of the program you are walking in as. The
 * word matches the seeded "Pick a role" flow, which has asked Student or School
 * since before any of this was configurable.
 */
export const OPEN_AS_LABEL: Record<WorkspaceRole, string> = {
  student: "student",
  member: "school",
  administrator: "administrator",
}

/**
 * The order the doors read in, which is not the order roles are listed in a
 * settings field. Student first, then school, matching the seeded "Pick a role"
 * flow: the person reaching for this card is a student who also happens to be
 * staff, not the reverse.
 */
const OPEN_AS_ORDER: readonly WorkspaceRole[] = ["student", "member", "administrator"]

/**
 * The identities this session may open a product as, once it holds more than one.
 *
 * Two roles, not a boolean, because the pair is the answer: one person can be a
 * student in a program and staff in that same program, and only they know which
 * one they are opening today. `role` still says which one they are *currently*
 * in, so the pair is what the product card offers and `role` is which door they
 * last took.
 *
 * Normalised to empty below one real choice. A list of one is not a fork, and a
 * card that offered a single "Open as student" would be a worse Open button.
 */
function normalizeOpensAs(value: unknown): WorkspaceRole[] {
  if (!Array.isArray(value)) return []
  const roles = value.filter(isWorkspaceRole)
  const unique = OPEN_AS_ORDER.filter(role => roles.includes(role))
  // A student who could also open as an administrator is the combination this
  // whole module exists to make unwritable. Dropped here as well as in `role`,
  // or the card would hand out a console the session is not allowed to hold.
  const allowed = unique.includes("student")
    ? unique.filter(role => role !== "administrator")
    : unique
  return allowed.length > 1 ? allowed : []
}

export interface LoginSession {
  /**
   * The apps this session may open, or `null` for whatever the workspace is
   * entitled to. An empty list reads as `null` rather than "no apps": a home
   * page with nothing on it is a broken demo, not a role.
   */
  products: Product[] | null
  showYourApp: boolean
  showMoreFromExxat: boolean
  /**
   * Who this session is to the workspace, which decides the Administrator
   * console: its tile on home, its row in the product switcher, **and** whether
   * `/admin` answers at all, because a door that is only hidden is still a door
   * and typing the URL is the first thing anyone demonstrating a student tries.
   * `isWorkspaceAdmin` reads it, so all three decide from one line.
   */
  role: WorkspaceRole
  /**
   * Every identity this person may open a product as, or empty when they hold
   * one. See `normalizeOpensAs`. The products home turns a pair into two doors on
   * the product card; `role` is whichever door was taken last.
   */
  opensAs: WorkspaceRole[]
}

export const DEFAULT_LOGIN_SESSION: LoginSession = {
  products: null,
  showYourApp: true,
  showMoreFromExxat: true,
  role: "administrator",
  opensAs: [],
}

/**
 * Exported so a caller can tell "the record names a role" from "we inferred one
 * from an older field", which is a difference that matters when the older field
 * could not express the answer. See `flowRole` in `login-flow.ts`.
 */
export function isWorkspaceRole(value: unknown): value is WorkspaceRole {
  return WORKSPACE_ROLES.some(entry => entry.value === value)
}

/**
 * The role a record claims, however it spells it.
 *
 * Records written before the role existed carry `adminAccess` or, before that,
 * `showAdmin`. Either one set to `false` becomes `member`, since a boolean can
 * only say whether the console was denied and denying it is what both meant. An
 * absent answer reads as `administrator`: the dogfood workspace signs in as one,
 * and a half-written record should not lock someone out of the console they were
 * just using.
 */
export function readWorkspaceRole(record: {
  role?: unknown
  adminAccess?: boolean
  showAdmin?: boolean
}): WorkspaceRole {
  if (isWorkspaceRole(record.role)) return record.role
  const deniedByBoolean = record.adminAccess === false || record.showAdmin === false
  return deniedByBoolean ? "member" : "administrator"
}

const SESSION_KEY = "demo:login-session:v1"
/** Pre-session shape: one product id, no visibility flags. Read once, then dropped. */
const LEGACY_GRANT_KEY = "demo:login-granted-product:v1"

function isGrantable(value: unknown): value is Product {
  return GRANTABLE_PRODUCTS.some(entry => entry.value === value)
}

function normalize(session: LoginSession): LoginSession {
  const products = (session.products ?? []).filter(isGrantable)
  const role = readWorkspaceRole(session)
  const opensAs = normalizeOpensAs(session.opensAs)
  return {
    products: products.length > 0 ? products : null,
    showYourApp: session.showYourApp !== false,
    showMoreFromExxat: session.showMoreFromExxat !== false,
    role,
    // The pair has to contain the role it is a pair with, or the card would offer
    // two doors and stand beside a session that took a third.
    opensAs: opensAs.includes(role) ? opensAs : [],
  }
}

/**
 * Parsed defensively, and every flag defaults to visible. This is hand-editable
 * storage read during the first render after sign-in, so a half-written record
 * has to degrade to "show everything" rather than throw or hide the page.
 */
export function getLoginSession(): LoginSession {
  const raw = getStorageItem(SESSION_KEY)
  if (raw) {
    try {
      const parsed: unknown = JSON.parse(raw)
      if (typeof parsed === "object" && parsed !== null) {
        const record = parsed as Partial<LoginSession> & {
          adminAccess?: boolean
          showAdmin?: boolean
        }
        return normalize({
          products: Array.isArray(record.products) ? record.products : null,
          showYourApp: record.showYourApp !== false,
          showMoreFromExxat: record.showMoreFromExxat !== false,
          role: readWorkspaceRole(record),
          opensAs: normalizeOpensAs(record.opensAs),
        })
      }
    } catch {
      // Unparseable payload. Fall through to the legacy key, then the default.
    }
  }

  const legacy = getStorageItem(LEGACY_GRANT_KEY)
  if (isGrantable(legacy)) return { ...DEFAULT_LOGIN_SESSION, products: [legacy] }
  return DEFAULT_LOGIN_SESSION
}

export function setLoginSession(session: LoginSession): void {
  setStorageItem(SESSION_KEY, JSON.stringify(normalize(session)))
}

/** The apps this session may open, or `null` for the workspace default. */
export function grantedProducts(): Product[] | null {
  return getLoginSession().products
}

/** The identities a product card should offer as doors. Empty for one identity. */
export function openableIdentities(): WorkspaceRole[] {
  return getLoginSession().opensAs
}

/**
 * Walk in as one of the identities this session holds.
 *
 * Refuses a role the session never claimed, so the only way to acquire one is a
 * sign-in that granted it: a card offering "as school" cannot be turned into a
 * console by editing the click. The pair itself survives the change, which is
 * what lets someone come back to the products home and take the other door
 * instead of signing out.
 */
export function openAs(role: WorkspaceRole): void {
  const session = getLoginSession()
  if (!session.opensAs.includes(role)) return
  setLoginSession({ ...session, role })
}

/**
 * Ends the session's claims. Clears the legacy key too, or logging out would
 * leave an old grant behind for the next read to find.
 */
export function clearLoginSession(): void {
  removeStorageItem(SESSION_KEY)
  removeStorageItem(LEGACY_GRANT_KEY)
}
