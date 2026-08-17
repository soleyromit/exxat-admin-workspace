/**
 * Who the signed-in person is to this workspace.
 *
 * One seam, one predicate. Administrator is a workspace-level console rather
 * than a licensed product, so it is offered by role instead of by entitlement
 * (`isProductEntitled` answers "did the school buy this", which is a different
 * question). Keeping the predicate here means the launcher, the products home,
 * the product switcher, and the `/admin` route itself all decide from the same
 * line rather than each inventing its own idea of who counts as an admin.
 *
 * Two inputs, and they answer different questions. `CURRENT_WORKSPACE_ROLE` is
 * whether this workspace has a console at all; the session's `role` is who the
 * sign-in that opened it made you, which is how a student flow demonstrates a
 * workspace that has a console without reaching it. Neither can promote: a
 * session that says student stays a student, and no session administers a
 * workspace that has nothing to administer.
 *
 * Mock, like `ENTITLED_PRODUCTS` beside it — the dogfood workspace signs in as
 * an administrator so the surface is visible while building. Swap the constant
 * for the session claim when auth lands; every caller reads the predicate.
 */

import { getLoginSession, type WorkspaceRole } from "@/lib/login-session"

export type { WorkspaceRole }

export const CURRENT_WORKSPACE_ROLE: WorkspaceRole = "administrator"

export function workspaceRole(): WorkspaceRole {
  const role = getLoginSession().role
  return role === "administrator" ? CURRENT_WORKSPACE_ROLE : role
}

export function isWorkspaceAdmin(): boolean {
  return workspaceRole() === "administrator"
}

/**
 * Whether this session may open the shared records: People, Courses, Personnel.
 *
 * A second predicate rather than a second use of `isWorkspaceAdmin`, because the
 * Directory and the console answer different questions. The console configures
 * the workspace, which is an administrator's job. The Directory is the roster
 * every coordinator works from all day: which students are in which cohort, who
 * teaches what, which staff cover a site. Gating it on the console left a faculty
 * member with no way to look up the people they place.
 *
 * The floor is the student, and it is the whole rule: a student who could open
 * these would be reading their entire cohort's records. So `member` and
 * `administrator` may, `student` may not, and a student who also opens as the
 * school (`opensAs`) gets the Directory in that identity and not in the other,
 * because it is the identity that decides, not the person.
 *
 * Every door reads this: the chips on all four home variants, the switcher rows,
 * and the three routes they link to, so a chip can never offer a page the route
 * turns away.
 */
export function canReadDirectory(): boolean {
  return workspaceRole() !== "student"
}

/**
 * Whether the scope this session reads is a fact rather than a choice.
 *
 * A student is enrolled in one program at one school. A school and program menu
 * therefore offers them a choice that does not exist, and implies they could be
 * reading another cohort's requirements. The scope still has to be legible, so
 * the three triggers that share `useScopeSwitcher` name it and none of them opens.
 *
 * Derived from the role rather than from counting the mock's programs: a student
 * with two programs on record still does not choose which one Exxat is about, and
 * a coordinator with one school is between schools rather than fixed to it.
 */
export function isScopeFixed(): boolean {
  return workspaceRole() === "student"
}
