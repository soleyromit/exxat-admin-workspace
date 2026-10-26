import { aNoun, skillNoun, skillNounPlural, capitalize } from "./terms"
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
 * Proposed nav (strategy/01). Student row 1 is "My progress" (ledger D-L4; the slug stays `home`). Staff row 1 is
 * "Dashboard", never "Home"; the reviewer lands on "Approvals".
 */
export const PERSONAS: PersonaDef[] = [
  {
    id: "admin", short: "Admin", label: "Administrator", chrome: "shell", landing: "dashboard",
    nav: () => [
      { key: "dashboard", title: "Dashboard", slug: "dashboard", icon: "gauge" },
      { key: "skills", title: capitalize(skillNounPlural()), slug: "skills-library", icon: "list-check" },
      { key: "approvals", title: "Approvals", slug: "approvals", icon: "clipboard-check", badge: "approvals" },
      { key: "attainment", title: "Attainment", slug: "attainment", icon: "chart-mixed" },
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
      { key: "attainment", title: "Attainment", slug: "attainment", icon: "chart-mixed" },
    ],
  },
  {
    id: "student", short: "Student", label: "Student", chrome: "shell", landing: "home",
    nav: () => [
      { key: "home", title: "My progress", slug: "home", icon: "house" },
      { key: "log", title: `Log ${aNoun()}`, slug: "log-skill", icon: "pen-to-square" },
      { key: "requests", title: "My requests", slug: "my-requests", icon: "paper-plane" },
      { key: "record", title: "Record", slug: "record", icon: "badge-check" },
    ],
  },
  { id: "evaluator", short: "Evaluator", label: "Evaluator", chrome: "light", landing: "evaluation-form", nav: null },
  { id: "lab-instructor", short: "Lab", label: "Lab instructor", chrome: "light", landing: "lab-batch-grid", nav: null },
]

export const PERSONA_BY_ID = Object.fromEntries(PERSONAS.map((p) => [p.id, p])) as Record<PersonaId, PersonaDef>
export const isPersonaId = (x: string): x is PersonaId => x in PERSONA_BY_ID
