import { NAV_ROWS, roleForPath } from "@/lib/v2/roles"
import type { RoleId } from "@/lib/v2/types"

export interface Crumb {
  label: string
  href?: string
}

/** Parent crumb for a sub-page: the nav row it belongs to, linked. */
function under(role: RoleId, key: string, child: string): Crumb[] {
  const row = NAV_ROWS[role].find((r) => r.key === key)
  return row ? [{ label: row.title, href: row.url }, { label: child }] : [{ label: child }]
}

/** Utility-bar breadcrumb for a /v2 path: the nav row, or the parent nav row then the page (one level only). */
export function v2CrumbsFor(pathname: string, search?: URLSearchParams | null): Crumb[] {
  const role = roleForPath(pathname)
  if (!role) return [{ label: "Skills tracking" }]
  const staff = role === "admin" || role === "reviewer" || role === "director"
  if (pathname === "/v2/admin/configure-skill") return under("admin", "skills-library", "Configure skill")
  if (pathname === "/v2/admin/validate-publish") return under("admin", "skills-library", "Review and publish")
  if (/^\/v2\/[^/]+\/review-queue\/[^/]+/.test(pathname)) return under(role, "review", "Review item")
  if (staff && /^\/v2\/[^/]+\/evaluation\/[^/]+/.test(pathname)) return under(role, "outcomes", "Evaluation")
  if (staff && /^\/v2\/[^/]+\/remediation\/[^/]+/.test(pathname)) return under(role, "outcomes", "Remediation plan")
  if (staff && /^\/v2\/[^/]+\/(?:director-)?verification\/[^/]+/.test(pathname)) return under(role, "records", "Program record")
  if (pathname === "/v2/preceptor/preceptor-evaluation" && search?.get("request")) return under("preceptor", "requests", "Evaluation")
  if (role === "student") {
    if (pathname === "/v2/student/offline-sync") return under("student", "home", "Sync and offline")
    if (pathname.startsWith("/v2/student/remediation/")) return under("student", "home", "Remediation plan")
    if (pathname === "/v2/student/verified-record") return under("student", "record", "Share verified record")
    if (pathname.startsWith("/v2/student/evaluation/")) return under("student", "record", "Evaluation")
  }
  const exact = NAV_ROWS[role].find((r) => r.url === pathname)
  if (exact) return [{ label: exact.title }]
  // Generic list routes that share a nav row (for example /v2/reviewer/outcomes, /v2/director/verification).
  if (staff && pathname === `/v2/${role}/outcomes`) return [{ label: "Outcomes" }]
  if (staff && pathname === `/v2/${role}/verification`) return [{ label: "Records" }]
  return [{ label: NAV_ROWS[role][0].title }]
}
