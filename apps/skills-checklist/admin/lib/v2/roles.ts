import { toLong } from "../short-urls"
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
  { id: "admin", label: "Administrator", personId: IDS.ross, landing: "/proto/admin", home: "/proto/admin" },
  { id: "student", label: "Student (mobile)", personId: IDS.maya, landing: "/proto/student", home: "/proto/student" },
  { id: "preceptor", label: "Preceptor", personId: IDS.delgado, landing: "/proto/preceptor/preceptor-evaluation", home: "/proto/preceptor/preceptor-evaluation" },
  { id: "reviewer", label: "Reviewer", personId: IDS.reviewer, landing: "/proto/reviewer/review-queue", home: "/proto/reviewer/review-queue" },
  { id: "director", label: "Program director", personId: IDS.director, landing: "/proto/director/director-verification", home: "/proto/director/director-verification" },
]

export const ROLE_BY_ID: Record<RoleId, RoleDef> = Object.fromEntries(ROLES.map((r) => [r.id, r])) as Record<RoleId, RoleDef>

export function isRoleId(x: string): x is RoleId {
  return x in ROLE_BY_ID
}

/** The role a /v2 (or short /proto) path belongs to, or null when the path has none. */
export function roleForPath(pathname: string): RoleId | null {
  const m = /^\/v2\/([^/]+)/.exec(toLong(pathname))
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
    { key: "home", title: "Dashboard", url: "/proto/admin", icon: "house" },
    { key: "skills-library", title: "Skills library", url: "/proto/admin/starter-library", icon: "list-check" },
    { key: "courses", title: "Courses", url: "/proto/admin/map-courses", icon: "link" },
    { key: "review", title: "Review and approve", url: "/proto/admin/review-queue", icon: "clipboard-check", badge: "approvals" },
    { key: "outcomes", title: "Outcomes", url: "/proto/admin/outcomes", icon: "clipboard-list-check" },
    { key: "records", title: "Records", url: "/proto/admin/verification", icon: "badge-check" },
    { key: "reports", title: "Reports", url: "/proto/admin/reports", icon: "chart-mixed" },
  ],
  reviewer: [
    { key: "review", title: "Review and approve", url: "/proto/reviewer/review-queue", icon: "clipboard-check", badge: "approvals" },
    { key: "outcomes", title: "Outcomes", url: "/proto/reviewer/outcome-remediation", icon: "clipboard-list-check" },
    { key: "records", title: "Records", url: "/proto/reviewer/verification", icon: "badge-check" },
  ],
  director: [
    { key: "outcomes", title: "Outcomes", url: "/proto/director/outcomes", icon: "clipboard-list-check" },
    { key: "records", title: "Records", url: "/proto/director/director-verification", icon: "badge-check" },
    { key: "reports", title: "Reports", url: "/proto/director/reports", icon: "chart-mixed" },
  ],
  preceptor: [
    { key: "requests", title: "Requests", url: "/proto/preceptor/preceptor-evaluation", icon: "stethoscope", badge: "evaluator-requests" },
    { key: "lab-sessions", title: "Lab sessions", url: "/proto/preceptor/lab-batch-grid", icon: "flask" },
  ],
  student: [
    { key: "home", title: "Home", url: "/proto/student", icon: "house" },
    { key: "log", title: "Log skills", url: "/proto/student/pick-and-rate", icon: "pen-to-square" },
    { key: "requests", title: "Requests", url: "/proto/student/request-signoff", icon: "paper-plane", badge: "unsent-requests" },
    { key: "record", title: "Record", url: "/proto/student/history", icon: "clock-rotate-left" },
  ],
}

/** Route prefixes below a nav row that are not rows themselves. They keep the parent row from lighting by prefix. */
export const SUB_ROUTES: Record<RoleId, string[]> = {
  admin: ["/proto/admin/configure-skill", "/proto/admin/validate-publish", "/proto/admin/review-queue", "/proto/admin/evaluation", "/proto/admin/remediation", "/proto/admin/verification"],
  reviewer: ["/proto/reviewer/review-queue", "/proto/reviewer/outcomes", "/proto/reviewer/evaluation", "/proto/reviewer/remediation", "/proto/reviewer/verification"],
  director: ["/proto/director/verification", "/proto/director/evaluation", "/proto/director/remediation"],
  preceptor: [],
  student: ["/proto/student/offline-sync", "/proto/student/verified-record", "/proto/student/remediation", "/proto/student/evaluation"],
}

/** Every URL the shell should know, so the longest-prefix match picks the right row (or none on a sub-page). */
export function allKnownUrls(): string[] {
  return Array.from(new Set([...Object.values(NAV_ROWS).flatMap((rows) => rows.map((r) => r.url)), ...Object.values(SUB_ROUTES).flat()]))
}

/** The person the page acts as: the evaluator link's `as`, else J. Delgado (R. Whitmore on Lab sessions). */
export function actorIdFor(role: RoleId, pathname: string, asParam: string | null): string {
  if (role === "preceptor") return asParam ?? (toLong(pathname).startsWith("/v2/preceptor/lab-batch-grid") ? IDS.whitmore : IDS.delgado)
  return ROLE_BY_ID[role].personId
}
