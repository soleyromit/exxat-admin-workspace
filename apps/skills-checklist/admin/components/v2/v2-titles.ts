import { ROLE_BY_ID, roleForPath } from "@/lib/v2/roles"
import { STEPS } from "@/lib/v2/scenario"

/** Utility-bar breadcrumb title for a /v2 path. */
export function v2TitleFor(pathname: string): string {
  const step = STEPS.find((s) => s.route === pathname)
  if (step) return `${step.n}. ${step.title}`
  if (pathname === "/v2/student/history") return "Your record"
  if (pathname === "/v2/admin/review-queue") return "Review queue"
  if (/^\/v2\/[^/]+\/review-queue\//.test(pathname)) return "Review an item"
  if (/^\/v2\/[^/]+\/verification\//.test(pathname)) return "Program record"
  if (pathname === "/v2/admin/verification") return "Record verification"
  if (pathname === "/v2/admin/outcomes") return "Outcomes and remediation"
  if (/^\/v2\/[^/]+\/evaluation\//.test(pathname)) return "Evaluation and versions"
  if (/^\/v2\/[^/]+\/remediation\//.test(pathname)) return "Remediation plan"
  const role = roleForPath(pathname)
  if (role) return `${ROLE_BY_ID[role].label} home`
  return "Scenario overview"
}
