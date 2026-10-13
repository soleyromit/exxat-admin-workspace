/**
 * Persona views. In Exxat products a persona is NOT a sibling group in the left nav: the profile menu offers
 * "Switch to <persona> view" and the nav set changes (PCE: NAV_ADMIN <-> NAV_FACULTY). The same applies here.
 * The view is derived from the route, so deep links and the browser back button keep working without extra state.
 * The real evaluator link (/e/[token]) is outside the shell entirely (EV-01).
 */
export type ShellView = "admin" | "student" | "evaluator"

export function viewForPath(pathname: string): ShellView {
  if (pathname === "/student" || pathname.startsWith("/student/")) return "student"
  if (pathname === "/my-skills" || pathname.startsWith("/my-skills/")) return "student"
  // /courses is the ADMIN course mapping now; the old student URLs /courses/<offering>/skills... redirect to /student.
  if (/^\/courses\/[^/]+\/skills(\/|$)/.test(pathname)) return "student"
  if (pathname === "/preceptor" || pathname.startsWith("/preceptor/")) return "evaluator"
  return "admin"
}

export const VIEW_LABEL: Record<ShellView, string> = {
  admin: "Administrator",
  student: "Student",
  evaluator: "Evaluator",
}
