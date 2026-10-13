import type { NavLinkItem } from "@exxatdesignux/ui/components/shell"
import { PREVIEW_ROUTES, ROUTES, STUDENT_ROUTES } from "@/lib/skills-routes"
import type { ShellView } from "@/components/shell/view"

/**
 * Primary navigation, in the Exxat Design OS hierarchy: ONE flat list of rows per view (apps/pce lib/pce-nav.tsx
 * NAV_ADMIN / NAV_FACULTY, starter lib/mock/navigation.tsx). Rows are the product's pages; sub-pages of a page are
 * horizontal tabs inside it (Skills: Skills, Kits, Categories, Tags, Clinical Settings, Lab Instructors), the same
 * pattern as PCE Directory. Personas are NOT sibling groups: the profile menu switches the view and this function
 * returns the nav for the active one. Navigation changes go through this config, never by forking the sidebar.
 *
 * Hybrid IA: Home, Skills, Courses, Attainment and
 * Reviews. Reviews is shown only when at least one skill has administrator approval turned on (REQ SC-15, `reviewNavVisible`).
 */
const icon = (name: string, solid = false) => (
  <i className={`${solid ? "fa-solid" : "fa-light"} fa-${name}`} aria-hidden="true" />
)

const item = (key: string, title: string, url: string, fa: string): NavLinkItem => ({
  key,
  title,
  url,
  icon: icon(fa),
  iconActive: icon(fa, true),
})

export function buildSkillsNav(options: { showReview: boolean; view: ShellView; reviewCount?: number }): { primary: NavLinkItem[] } {
  if (options.view === "student") {
    return {
      primary: [
        item("student-view", "Student View", STUDENT_ROUTES.courses, "graduation-cap"),
        item("my-skills", "My skills", STUDENT_ROUTES.mySkills, "list-check"),
      ],
    }
  }
  if (options.view === "evaluator") {
    return { primary: [item("preceptor", "Preceptor Evaluation", PREVIEW_ROUTES.preceptor, "stethoscope")] }
  }
  // Hybrid IA (docs/design/hybrid-build-plan.md). Skills is ONE row with no children: its sub-pages are tabs on the page.
  // Reviews carries the waiting count.
  return {
    primary: [
      item("home", "Home", ROUTES.home, "house"),
      item("skills", "Skills", ROUTES.skills, "list-check"),
      item("courses", "Courses", ROUTES.courses, "link"),
      item("attainment", "Attainment", ROUTES.attainment, "chart-column"),
      ...(options.showReview ? [{ ...item("reviews", "Reviews", ROUTES.reviews, "clipboard-check"), ...(options.reviewCount ? { badge: options.reviewCount } : {}) }] : []),
    ],
  }
}

export const NAV_SECONDARY = [] as const
