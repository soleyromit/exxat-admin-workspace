import { ROLE_BY_ID, roleForPath } from "@/lib/v2/roles"
import { STEPS } from "@/lib/v2/scenario"

/** Utility-bar breadcrumb title for a /v2 path. */
export function v2TitleFor(pathname: string): string {
  const step = STEPS.find((s) => s.route === pathname)
  if (step) return `${step.n}. ${step.title}`
  if (pathname === "/v2/student/history") return "Your record"
  const role = roleForPath(pathname)
  if (role) return `${ROLE_BY_ID[role].label} home`
  return "Scenario overview"
}
