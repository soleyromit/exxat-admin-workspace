/**
 * Learning activities hub — secondary panel URL scope (modes + folder groups).
 * Mirrors Question bank (`lib/library-nav.ts`) under `/<product>/learning-activities`.
 */

import type { LibraryFolder } from "@/lib/mock/library-folders"
import { collectFolderDescendantIds } from "@/lib/mock/library-folders"
import type { CourseOffering } from "@/lib/mock/learning-activities-offerings"

export type LearningActivitiesMode = "courses" | "reports" | "notifications"

export type LearningActivitiesNavScope = "all" | "folder"

export interface LearningActivitiesNavState {
  mode: LearningActivitiesMode
  scope: LearningActivitiesNavScope
  folderId: string | null
}

export const LA_ENTRY_PATH = "/learning-activities"
const PRODUCT_LA_PATH_RE = /^\/[^/]+\/learning-activities(?=\/|$)/

/** Hub root breadcrumb — ancestor segment on every learning-activities hub view. */
export const LA_HUB_BREADCRUMB = {
  label: "Learning activities",
  href: LA_ENTRY_PATH,
} as const

export function normalizeLearningActivitiesPathname(pathname: string): string {
  return pathname.replace(PRODUCT_LA_PATH_RE, LA_ENTRY_PATH)
}

export function currentLearningActivitiesBasePath(pathname?: string): string {
  const current =
    pathname ??
    (typeof window !== "undefined" ? window.location.pathname : LA_ENTRY_PATH)
  const match = current.match(PRODUCT_LA_PATH_RE)
  return match?.[0] ?? LA_ENTRY_PATH
}

export function laRouteHref(pathname: string, basePath = currentLearningActivitiesBasePath()): string {
  return pathname.replace(LA_ENTRY_PATH, basePath)
}

export const LA_DEFAULT_NAV: LearningActivitiesNavState = {
  mode: "courses",
  scope: "all",
  folderId: null,
}

export function isLearningActivitiesDefaultNav(nav: LearningActivitiesNavState): boolean {
  return nav.mode === "courses" && nav.scope === "all" && nav.folderId === null
}

export function parseLearningActivitiesNav(searchParams: URLSearchParams): LearningActivitiesNavState {
  const rawMode = (searchParams.get("mode") ?? "courses").toLowerCase()
  const mode: LearningActivitiesMode =
    rawMode === "reports"
      ? "reports"
      : rawMode === "notifications"
        ? "notifications"
        : "courses"

  const rawScope = (searchParams.get("scope") ?? "all").toLowerCase()
  if (rawScope === "folder") {
    const folderId = searchParams.get("folderId")?.trim() || null
    return { mode, scope: "folder", folderId }
  }
  return { mode, scope: "all", folderId: null }
}

export function coerceLearningActivitiesNav(
  nav: LearningActivitiesNavState,
  folders: readonly LibraryFolder[],
): LearningActivitiesNavState {
  if (nav.scope === "all") return { ...nav, scope: "all", folderId: null }
  if (nav.scope === "folder") {
    if (!nav.folderId) return { ...nav, scope: "all", folderId: null }
    if (!folders.some(f => f.id === nav.folderId)) {
      return { ...nav, scope: "all", folderId: null }
    }
    return nav
  }
  return { ...nav, scope: "all", folderId: null }
}

export function laNavStatesEqual(a: LearningActivitiesNavState, b: LearningActivitiesNavState): boolean {
  return a.mode === b.mode && a.scope === b.scope && a.folderId === b.folderId
}

export function laNavHref(
  nav: Partial<LearningActivitiesNavState>,
  basePath = currentLearningActivitiesBasePath(),
): string {
  const mode = nav.mode ?? LA_DEFAULT_NAV.mode
  const scope = nav.scope ?? LA_DEFAULT_NAV.scope
  const params = new URLSearchParams()
  if (mode !== "courses") params.set("mode", mode)
  if (scope === "folder" && nav.folderId) {
    params.set("scope", "folder")
    params.set("folderId", nav.folderId)
  }
  const qs = params.toString()
  return `${basePath}${qs ? `?${qs}` : ""}`
}

export function laHubScopeHref(
  pathname: string,
  searchParams: URLSearchParams,
  patch: Partial<LearningActivitiesNavState>,
): string {
  const basePath = currentLearningActivitiesBasePath(pathname)
  const current = parseLearningActivitiesNav(searchParams)
  return laNavHref({ ...current, ...patch }, basePath)
}

export function laCanonicalNavHref(
  searchParams: URLSearchParams,
  folders?: readonly LibraryFolder[],
  basePath?: string,
): string | null {
  const parsed = parseLearningActivitiesNav(searchParams)
  if (folders) {
    const coerced = coerceLearningActivitiesNav(parsed, folders)
    if (!laNavStatesEqual(parsed, coerced)) {
      return laNavHref(coerced, basePath)
    }
  }
  const rawScope = searchParams.get("scope")
  if (rawScope?.toLowerCase() === "folder") {
    const folderId = searchParams.get("folderId")
    if (!folderId) return laNavHref({ mode: parsed.mode, scope: "all" }, basePath)
  }
  return null
}

export function isLearningActivitiesProductPath(pathname: string): boolean {
  return PRODUCT_LA_PATH_RE.test(pathname)
}

export function isLearningActivitiesCourseDetailPath(pathname: string): boolean {
  const normalized =
    pathname.length > 1 && pathname.endsWith("/") ? pathname.slice(0, -1) : pathname
  return /\/learning-activities\/courses\/[^/]+/.test(normalized)
}

export function isLearningActivitiesHubPath(pathname: string): boolean {
  const normalized =
    pathname.length > 1 && pathname.endsWith("/") ? pathname.slice(0, -1) : pathname
  if (isLearningActivitiesCourseDetailPath(normalized)) return false
  return normalizeLearningActivitiesPathname(normalized) === LA_ENTRY_PATH
}

/** Scope rail stays open on the list hub only — record detail is full-width (record-detail job). */
export function shouldLearningActivitiesSecondaryPanelBeOpen(pathname: string): boolean {
  return isLearningActivitiesHubPath(pathname)
}

export function isLearningActivitiesSecondaryPanelRoute(pathname: string): boolean {
  return isLearningActivitiesHubPath(pathname)
}

export function isLearningActivitiesSecondaryPanelVisible(
  pathname: string,
  _activePanel: string | null,
): boolean {
  return shouldLearningActivitiesSecondaryPanelBeOpen(pathname)
}

export function isLearningActivitiesNavActive(
  pathname: string,
  nav: LearningActivitiesNavState,
  mode: LearningActivitiesMode,
  folders?: readonly LibraryFolder[],
): boolean {
  if (!isLearningActivitiesHubPath(pathname)) return false
  const resolved = folders ? coerceLearningActivitiesNav(nav, folders) : nav
  return resolved.mode === mode && resolved.scope === "all"
}

export function isLearningActivitiesFolderNavActive(
  pathname: string,
  nav: LearningActivitiesNavState,
  folderId: string,
  folders?: readonly LibraryFolder[],
): boolean {
  if (!isLearningActivitiesHubPath(pathname)) return false
  const resolved = folders ? coerceLearningActivitiesNav(nav, folders) : nav
  return (
    resolved.mode === "courses" &&
    resolved.scope === "folder" &&
    resolved.folderId === folderId
  )
}

export function filterOfferingsByNav(
  offerings: CourseOffering[],
  folders: LibraryFolder[],
  nav: LearningActivitiesNavState,
): CourseOffering[] {
  if (nav.mode !== "courses") return offerings
  if (nav.scope === "all") return offerings
  if (nav.scope === "folder" && nav.folderId) {
    const allowed = collectFolderDescendantIds(folders, nav.folderId)
    return offerings.filter(row => allowed.has(row.folderId))
  }
  return offerings
}

export interface LearningActivitiesHubHeaderModel {
  title: string
  breadcrumbs?: { label: string; href?: string }[]
}

export function laHubHeaderModel(
  folders: LibraryFolder[],
  nav: LearningActivitiesNavState,
): LearningActivitiesHubHeaderModel {
  const hubCrumb = { label: LA_HUB_BREADCRUMB.label, href: LA_HUB_BREADCRUMB.href }
  if (nav.mode === "reports") {
    return { title: "Reports", breadcrumbs: [hubCrumb] }
  }
  if (nav.mode === "notifications") {
    return { title: "Auto Notification", breadcrumbs: [hubCrumb] }
  }
  if (nav.scope === "folder" && nav.folderId) {
    const folder = folders.find(f => f.id === nav.folderId)
    if (folder) {
      return {
        title: folder.name,
        breadcrumbs: [hubCrumb, { label: "All courses", href: LA_HUB_BREADCRUMB.href }],
      }
    }
  }
  return { title: "All courses", breadcrumbs: [hubCrumb] }
}
