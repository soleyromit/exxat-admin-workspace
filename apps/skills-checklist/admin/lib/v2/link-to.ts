import type { RoleId } from "./types"

/**
 * The one place a v2 record link is built (design brief section 5.3). A link names the record it points at and the role that
 * follows it; the helper returns the real route. Routes differ by role: the director's records live under
 * director-verification, every other staff role's under verification. Never hand-build a /v2 href in a component.
 *
 * Kinds:
 *   student  the student's full record (staff roles)
 *   skill    the skill's configuration (administrator)
 *   record   one completed evaluation, every version of it
 *   review   one item in the review queue (administrator, reviewer)
 *   reports  the cohort reports (administrator, director)
 */
export type LinkKind = "student" | "skill" | "record" | "review" | "reports"

export type LinkTarget =
  | { role: RoleId; kind: "student"; id: string }
  | { role: RoleId; kind: "skill"; id: string }
  | { role: RoleId; kind: "record"; id: string }
  | { role: RoleId; kind: "review"; id: string }
  | { role: RoleId; kind: "reports" }

const RECORD_SLUG: Partial<Record<RoleId, string>> = { admin: "verification", reviewer: "verification", director: "director-verification" }
const REVIEW_ROLES: RoleId[] = ["admin", "reviewer"]
const REPORT_ROLES: RoleId[] = ["admin", "director"]

const enc = (id: string) => encodeURIComponent(id)

/** The route for a record, as seen by a role. Throws when the role has no such page, so a wrong link fails in a test, not in a click. */
export function linkTo(t: LinkTarget): string {
  switch (t.kind) {
    case "student": {
      const slug = RECORD_SLUG[t.role]
      if (!slug) throw new Error(`The ${t.role} role has no student record page`)
      return `/v2/${t.role}/${slug}/${enc(t.id)}`
    }
    case "skill":
      if (t.role !== "admin") throw new Error(`The ${t.role} role cannot open a skill's configuration`)
      return `/v2/admin/configure-skill?skill=${enc(t.id)}`
    case "record":
      return `/v2/${t.role}/evaluation/${enc(t.id)}`
    case "review":
      if (!REVIEW_ROLES.includes(t.role)) throw new Error(`The ${t.role} role has no review queue`)
      return `/v2/${t.role}/review-queue/${enc(t.id)}`
    case "reports":
      if (!REPORT_ROLES.includes(t.role)) throw new Error(`The ${t.role} role has no reports`)
      return `/v2/${t.role}/reports`
  }
}
