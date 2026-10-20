import { IDS } from "./seed"
import type { RoleId } from "./types"

export interface RoleDef {
  id: RoleId
  label: string
  /** Who the demo is acting as. */
  personId: string
  blurb: string
  home: string
}

export const ROLES: RoleDef[] = [
  { id: "admin", label: "Administrator", personId: IDS.ross, blurb: "Builds the library, configures skills, maps courses and reads reports.", home: "/v2/admin" },
  { id: "student", label: "Student (mobile)", personId: IDS.maya, blurb: "Sees what is left, picks skills and asks for sign-off, mostly on a phone.", home: "/v2/student" },
  { id: "preceptor", label: "Preceptor", personId: IDS.delgado, blurb: "Evaluates from a link with no account. Lab instructors use the same role.", home: "/v2/preceptor" },
  { id: "reviewer", label: "Reviewer", personId: IDS.reviewer, blurb: "Clears the review queue and follows outcomes and remediation.", home: "/v2/reviewer" },
  { id: "director", label: "Program director", personId: IDS.director, blurb: "Verifies the program record before it is shared.", home: "/v2/director" },
]

export const ROLE_BY_ID: Record<RoleId, RoleDef> = Object.fromEntries(ROLES.map((r) => [r.id, r])) as Record<RoleId, RoleDef>

export function isRoleId(x: string): x is RoleId {
  return x in ROLE_BY_ID
}

/** The role a /v2 path belongs to, or null for the scenario overview. */
export function roleForPath(pathname: string): RoleId | null {
  const m = /^\/v2\/([^/]+)/.exec(pathname)
  return m && isRoleId(m[1]) ? m[1] : null
}
