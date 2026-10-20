import type { NavLinkItem } from "@exxatdesignux/ui/components/shell"
import { ROLE_BY_ID, ROLES } from "@/lib/v2/roles"
import { STEPS, stepsForRole } from "@/lib/v2/scenario"
import type { RoleId } from "@/lib/v2/types"

export const STUDENT_HISTORY = "/v2/student/history"

const icon = (name: string, solid = false) => <i className={`${solid ? "fa-solid" : "fa-light"} fa-${name}`} aria-hidden="true" />

const item = (key: string, title: string, url: string, fa: string): NavLinkItem => ({ key, title, url, icon: icon(fa), iconActive: icon(fa, true) })

const ROLE_ICON: Record<RoleId, string> = { admin: "user-gear", student: "mobile-screen", preceptor: "stethoscope", reviewer: "clipboard-check", director: "user-tie" }

/** Sidebar rows for a v2 role: its home plus the scenario steps it owns. With no role, the overview and the five role homes. */
export function buildV2Nav(role: RoleId | null): NavLinkItem[] {
  if (!role) {
    return [item("v2-overview", "Scenario overview", "/v2", "route"), ...ROLES.map((r) => item(`v2-home-${r.id}`, r.label, r.home, ROLE_ICON[r.id]))]
  }
  return [
    item("v2-overview", "Scenario overview", "/v2", "route"),
    item(`v2-home-${role}`, `${ROLE_BY_ID[role].label} home`, ROLE_BY_ID[role].home, ROLE_ICON[role]),
    ...stepsForRole(role).map((s) => item(`v2-step-${s.id}`, `${s.n}. ${s.title}`, s.route, "circle-dot")),
    ...(role === "student" ? [item("v2-student-history", "Your record", STUDENT_HISTORY, "clock-rotate-left")] : []),
  ]
}

export function allV2Urls(): string[] {
  return ["/v2", ...ROLES.map((r) => r.home), ...STEPS.map((s) => s.route), STUDENT_HISTORY]
}
