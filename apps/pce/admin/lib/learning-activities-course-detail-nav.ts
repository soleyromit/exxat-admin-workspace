/**
 * Course offering detail — module tabs under
 * `/<product>/learning-activities/courses/:offeringId`.
 */

import type { LearningActivityType } from "@/lib/mock/learning-activities-offerings"
import {
  currentLearningActivitiesBasePath,
  isLearningActivitiesCourseDetailPath,
  laRouteHref,
  LA_ENTRY_PATH,
} from "@/lib/learning-activities-nav"

export { isLearningActivitiesCourseDetailPath }

export type CourseDetailModule =
  | "overview"
  | "setup"
  | LearningActivityType
  | "gradebook"
  | "reports"

/**
 * Forms/Evaluations has one sub-panel: the per-student "Review (all forms)"
 * table. It's a route-level content swap (own URL, own history entry, back
 * button leaves it), not a drawer — with hundreds of rows across every
 * student and form, it's a primary task, not a quick auxiliary peek
 * (`exxat-page-vs-drawer.mdc`).
 */
export type CourseFormsPanel = "catalog" | "review"

export interface CourseDetailNavState {
  module: CourseDetailModule
  formsPanel: CourseFormsPanel
}

export const COURSE_DETAIL_DEFAULT_NAV: CourseDetailNavState = {
  module: "overview",
  formsPanel: "catalog",
}

/**
 * "Configure" (offering metadata + which activities are enabled) is
 * low-frequency, config-shaped, and not a peer of the daily-use operational
 * modules — it lives in the page header's overflow menu, not the tab strip.
 * The module id stays `"setup"` so URLs / persisted state don't churn; only
 * the display label changed.
 */
export const COURSE_DETAIL_MODULE_LABELS: Record<CourseDetailModule, string> = {
  overview: "Overview",
  setup: "Configure",
  "forms-evaluations": "Forms/Evaluations",
  "patient-log": "Patient Log",
  timesheet: "Timesheet",
  "time-off": "Time Off",
  gradebook: "Gradebook",
  reports: "Reports",
}

const MODULE_IDS = new Set<string>([
  "overview",
  "setup",
  "forms-evaluations",
  "patient-log",
  "timesheet",
  "time-off",
  "gradebook",
  "reports",
])

export function parseCourseDetailNav(searchParams: URLSearchParams): CourseDetailNavState {
  const rawModule = (searchParams.get("module") ?? COURSE_DETAIL_DEFAULT_NAV.module).toLowerCase()
  const module: CourseDetailModule = MODULE_IDS.has(rawModule)
    ? (rawModule as CourseDetailModule)
    : COURSE_DETAIL_DEFAULT_NAV.module

  const rawPanel = (searchParams.get("panel") ?? COURSE_DETAIL_DEFAULT_NAV.formsPanel).toLowerCase()
  const formsPanel: CourseFormsPanel =
    module === "forms-evaluations" && rawPanel === "review" ? "review" : "catalog"

  return { module, formsPanel }
}

export function laCourseDetailPath(
  offeringId: string,
  basePath = currentLearningActivitiesBasePath(),
): string {
  const root = basePath.replace(/\/$/, "")
  return `${root}/courses/${encodeURIComponent(offeringId)}`
}

export function laCourseDetailHref(
  offeringId: string,
  patch: Partial<CourseDetailNavState> = {},
  basePath = currentLearningActivitiesBasePath(),
): string {
  const state: CourseDetailNavState = {
    ...COURSE_DETAIL_DEFAULT_NAV,
    ...patch,
  }
  const params = new URLSearchParams()
  if (state.module !== COURSE_DETAIL_DEFAULT_NAV.module) {
    params.set("module", state.module)
  }
  if (state.module === "forms-evaluations" && state.formsPanel === "review") {
    params.set("panel", "review")
  }
  const qs = params.toString()
  return `${laCourseDetailPath(offeringId, basePath)}${qs ? `?${qs}` : ""}`
}

export function laCourseDetailModuleHref(
  offeringId: string,
  module: CourseDetailModule,
  basePath = currentLearningActivitiesBasePath(),
): string {
  return laCourseDetailHref(offeringId, { module }, basePath)
}

export function laHubFromCourseDetailHref(basePath = currentLearningActivitiesBasePath()): string {
  return laRouteHref(LA_ENTRY_PATH, basePath)
}

export function offeringDetailTitle(courseNumber: string, courseName: string): string {
  return `${courseNumber} — ${courseName}`
}
