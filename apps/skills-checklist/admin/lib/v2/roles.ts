import { IDS } from "./seed"
import type { RoleId } from "./types"

export interface RoleDef {
  id: RoleId
  label: string
  /** Who the demo is acting as. */
  personId: string
  /** Where the role lands. Explicit, because the director lands on Records, which is its second nav row. */
  landing: string
  /** Same as `landing`; kept for the role switcher and demo menu. */
  home: string
}

export const ROLES: RoleDef[] = [
  { id: "admin", label: "Administrator", personId: IDS.ross, landing: "/v2/admin", home: "/v2/admin" },
  { id: "student", label: "Student (mobile)", personId: IDS.maya, landing: "/v2/student", home: "/v2/student" },
  { id: "preceptor", label: "Preceptor", personId: IDS.delgado, landing: "/v2/preceptor/preceptor-evaluation", home: "/v2/preceptor/preceptor-evaluation" },
  { id: "reviewer", label: "Reviewer", personId: IDS.reviewer, landing: "/v2/reviewer/review-queue", home: "/v2/reviewer/review-queue" },
  { id: "director", label: "Program director", personId: IDS.director, landing: "/v2/director/director-verification", home: "/v2/director/director-verification" },
]

export const ROLE_BY_ID: Record<RoleId, RoleDef> = Object.fromEntries(ROLES.map((r) => [r.id, r])) as Record<RoleId, RoleDef>

export function isRoleId(x: string): x is RoleId {
  return x in ROLE_BY_ID
}

/** The role a /v2 path belongs to, or null when the path has none. */
export function roleForPath(pathname: string): RoleId | null {
  const m = /^\/v2\/([^/]+)/.exec(pathname)
  return m && isRoleId(m[1]) ? m[1] : null
}

/** Which badge a nav row carries. Both are work waiting for that person; the badge is hidden at 0. */
export type NavBadgeKind = "approvals" | "evaluator-requests" | "unsent-requests"

export interface NavRowDef {
  key: string
  title: string
  url: string
  /** Font Awesome icon name, without the fa- prefix. */
  icon: string
  badge?: NavBadgeKind
}

/** The nav rows each role sees, in order (docs/build/contracts/V2-IA-shell-and-nav.md section 3). */
export const NAV_ROWS: Record<RoleId, NavRowDef[]> = {
  admin: [
    { key: "home", title: "Dashboard", url: "/v2/admin", icon: "house" },
    { key: "skills-library", title: "Skills library", url: "/v2/admin/starter-library", icon: "list-check" },
    { key: "courses", title: "Courses", url: "/v2/admin/map-courses", icon: "link" },
    { key: "review", title: "Review and approve", url: "/v2/admin/review-queue", icon: "clipboard-check", badge: "approvals" },
    { key: "outcomes", title: "Outcomes", url: "/v2/admin/outcomes", icon: "clipboard-list-check" },
    { key: "records", title: "Records", url: "/v2/admin/verification", icon: "badge-check" },
    { key: "reports", title: "Reports", url: "/v2/admin/reports", icon: "chart-mixed" },
  ],
  reviewer: [
    { key: "review", title: "Review and approve", url: "/v2/reviewer/review-queue", icon: "clipboard-check", badge: "approvals" },
    { key: "outcomes", title: "Outcomes", url: "/v2/reviewer/outcome-remediation", icon: "clipboard-list-check" },
    { key: "records", title: "Records", url: "/v2/reviewer/verification", icon: "badge-check" },
  ],
  director: [
    { key: "outcomes", title: "Outcomes", url: "/v2/director/outcomes", icon: "clipboard-list-check" },
    { key: "records", title: "Records", url: "/v2/director/director-verification", icon: "badge-check" },
    { key: "reports", title: "Reports", url: "/v2/director/reports", icon: "chart-mixed" },
  ],
  preceptor: [
    { key: "requests", title: "Requests", url: "/v2/preceptor/preceptor-evaluation", icon: "stethoscope", badge: "evaluator-requests" },
    { key: "lab-sessions", title: "Lab sessions", url: "/v2/preceptor/lab-batch-grid", icon: "flask" },
  ],
  student: [
    { key: "home", title: "Home", url: "/v2/student", icon: "house" },
    { key: "log", title: "Log skills", url: "/v2/student/pick-and-rate", icon: "pen-to-square" },
    { key: "requests", title: "Requests", url: "/v2/student/request-signoff", icon: "paper-plane", badge: "unsent-requests" },
    { key: "record", title: "Record", url: "/v2/student/history", icon: "clock-rotate-left" },
  ],
}

/** Route prefixes below a nav row that are not rows themselves. They keep the parent row from lighting by prefix. */
export const SUB_ROUTES: Record<RoleId, string[]> = {
  admin: ["/v2/admin/configure-skill", "/v2/admin/validate-publish", "/v2/admin/review-queue", "/v2/admin/evaluation", "/v2/admin/remediation", "/v2/admin/verification"],
  reviewer: ["/v2/reviewer/review-queue", "/v2/reviewer/outcomes", "/v2/reviewer/evaluation", "/v2/reviewer/remediation", "/v2/reviewer/verification"],
  director: ["/v2/director/verification", "/v2/director/evaluation", "/v2/director/remediation"],
  preceptor: [],
  student: ["/v2/student/offline-sync", "/v2/student/verified-record", "/v2/student/remediation", "/v2/student/evaluation"],
}

/** Every URL the shell should know, so the longest-prefix match picks the right row (or none on a sub-page). */
export function allKnownUrls(): string[] {
  return Array.from(new Set([...Object.values(NAV_ROWS).flatMap((rows) => rows.map((r) => r.url)), ...Object.values(SUB_ROUTES).flat()]))
}

/** The person the page acts as: the evaluator link's `as`, else J. Delgado (R. Whitmore on Lab sessions). */
export function actorIdFor(role: RoleId, pathname: string, asParam: string | null): string {
  if (role === "preceptor") return asParam ?? (pathname.startsWith("/v2/preceptor/lab-batch-grid") ? IDS.whitmore : IDS.delgado)
  return ROLE_BY_ID[role].personId
}
