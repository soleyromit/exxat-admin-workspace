import { COURSE_FACULTY, skillNounPlural, capitalize } from "./terms"
import type { PersonaId } from "./screens"

export interface LabNavRow {
  key: string
  title: string
  /** Screen slug inside the persona. */
  slug: string
  /** Font Awesome icon name without the fa- prefix. */
  icon: string
  badge?: "approvals"
}

export interface PersonaDef {
  id: PersonaId
  label: string
  /** Short name for the lab bar ("Admin"), full name in its tooltip. */
  short: string
  /** Staff personas get the DS shell with a sidebar; the others get a light header only. */
  chrome: "shell" | "light"
  landing: string
  nav: (() => LabNavRow[]) | null
}

/**
 * Proposed nav (strategy/01). Student row 1 is "My progress" (ledger D-L4; the slug stays `home`). The student has 3 rows (D-L10):
 * My progress, My requests, My evaluations (the record page, renamed 2026-10-27, D-L19; slug `record`); Log a skill is the header action, and a draft lives in My requests. Staff row 1 is
 * "Dashboard", never "Home"; the reviewer lands on "Approvals".
 */
export const PERSONAS: PersonaDef[] = [
  {
    id: "admin", short: "Admin", label: "Administrator", chrome: "shell", landing: "dashboard",
    nav: () => [
      { key: "dashboard", title: "Dashboard", slug: "dashboard", icon: "gauge" },
      { key: "skills", title: capitalize(skillNounPlural()), slug: "skills-library", icon: "list-check" },
      { key: "approvals", title: "Approvals", slug: "approvals", icon: "clipboard-check", badge: "approvals" },
      // "Reports" (was "Attainment"; Romit 2026-10-27, D-L20): the slug stays so links keep working. The Skills row opens the
      // Skills panel (Library, Groups of skills, Categories and tags, Course mapping) and Settings is a sidebar footer link,
      // both wired in components/lab/lab-frame.tsx from lib/lab/admin-ia.ts.
      { key: "reports", title: "Reports", slug: "attainment", icon: "chart-mixed" },
    ],
  },
  {
    id: "reviewer", short: "Reviewer", label: "Reviewer", chrome: "shell", landing: "approvals",
    nav: () => [
      { key: "approvals", title: "Approvals", slug: "approvals", icon: "clipboard-check", badge: "approvals" },
      { key: "students", title: "Students", slug: "students", icon: "users" },
    ],
  },
  {
    id: "director", short: "Director", label: "Program director", chrome: "shell", landing: "dashboard",
    nav: () => [
      { key: "dashboard", title: "Dashboard", slug: "dashboard", icon: "gauge" },
      { key: "reports", title: "Reports", slug: "attainment", icon: "chart-mixed" },
    ],
  },
  {
    id: "student", short: "Student", label: "Student", chrome: "shell", landing: "home",
    nav: () => [
      { key: "home", title: "My progress", slug: "home", icon: "house" },
      { key: "requests", title: "My requests", slug: "my-requests", icon: "paper-plane" },
      { key: "record", title: "My evaluations", slug: "record", icon: "badge-check" },
    ],
  },
  { id: "evaluator", short: "Evaluator", label: "Evaluator", chrome: "light", landing: "evaluation-form", nav: null },
  // Course faculty (Romit 2026-10-28; CALL 10-28 Sankalp 27:40 "open their course, Learning Activities, check off"): signed in to
  // Prism, so the shell; one row, My courses, which opens their course offering's Skills section on Group check-off.
  {
    id: "course-faculty", short: "Faculty", label: COURSE_FACULTY, chrome: "shell", landing: "offering-checkoff",
    nav: () => [{ key: "courses", title: "My courses", slug: "offering-checkoff", icon: "book-open" }],
  },
]

export const PERSONA_BY_ID = Object.fromEntries(PERSONAS.map((p) => [p.id, p])) as Record<PersonaId, PersonaDef>
export const isPersonaId = (x: string): x is PersonaId => x in PERSONA_BY_ID

/**
 * Shell breadcrumb parents (anatomy A3, 2026-10-30): pages below a nav row read "{row title} > {page}" in the utility bar, in
 * normal and present mode, because the body no longer carries a breadcrumb. One place for every parent.
 * - `parent` is the "persona/slug" of the nav row the page sits under; its label is that row's title, so the crumb and the
 *   sidebar never disagree.
 * - `when` (optional) names a URL param that must be present: the dashboard's in-page drill lists (?list=records|holders|holder)
 *   sit on the dashboard URL itself.
 * - `drop` lists the params the parent link removes (the drill's own), so it returns to the dashboard with the scope kept.
 * - `leaf: "heading"` makes the last crumb the page's h1 (a drill is titled by what it lists, and that title is dynamic).
 */
export interface CrumbParent {
  parent: string
  when?: string
  drop?: string[]
  leaf?: "heading"
}

const DRILL_PARAMS = ["list", "cond", "q"]

export const CRUMB_PARENTS: Record<string, CrumbParent> = {
  "reviewer/review-item": { parent: "reviewer/approvals" },
  "reviewer/student-record": { parent: "reviewer/students" },
  "admin/dashboard-drill": { parent: "admin/dashboard", leaf: "heading" },
  "admin/dashboard": { parent: "admin/dashboard", when: "list", drop: DRILL_PARAMS, leaf: "heading" },
}

/** The crumb parent for a page, with the parent row's title, or undefined when the page sits at the top of its row. */
export function crumbParentFor(
  screen: string | undefined,
  params: { get(name: string): string | null } | null | undefined,
): (CrumbParent & { label: string }) | undefined {
  const rule = screen ? CRUMB_PARENTS[screen] : undefined
  if (!rule || (rule.when && !params?.get(rule.when))) return undefined
  const [persona, slug] = rule.parent.split("/")
  const row = isPersonaId(persona ?? "") ? PERSONA_BY_ID[persona as PersonaId].nav?.().find((r) => r.slug === slug) : undefined
  return row ? { ...rule, label: row.title } : undefined
}
