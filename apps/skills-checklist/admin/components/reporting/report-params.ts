// URL state for S-01..S-03 (docs/ux/08 P-07: rail state in the URL, `?student=…&skill=…&evaluation=…`, browser Back
// mirrors levels). Pure functions so the same parsing is used by the page, the deep-link routes and the tests.
import type { ReportFilters, StudentSort } from "@/lib/store"

export type ReportTab = "student" | "skill" | "tag"

export interface OverviewParams {
  tab: ReportTab
  filters: ReportFilters
  sort: StudentSort
  q: string
  /** Rail level 1 (S-02): a student id. */
  student: string | null
  /** Rail level 2 (S-03 ledger): a skill id. */
  skill: string | null
  /** Rail level 3 (S-03 detail): a submission id whose evaluation is shown. */
  evaluation: string | null
  /** RP-08 "Show all evidence": the rail ignores the location and setting filters. */
  showAllEvidence: boolean
  /** RP-05: a By skill row opened in the rail to list the students behind the figure. */
  bySkill: string | null
  /** RP-05: a By tag row opened in the rail to list the student-skill records behind the figure. */
  byTag: string | null
}

/** Prototype default (parity spec P-01, Romit 2026-10-08): By student opens sorted Highest attainment. Supersedes the S-01 contract proposal of Lowest first. */
export const DEFAULT_SORT: StudentSort = "highest"

export const EMPTY_PARAMS: OverviewParams = { tab: "student", filters: {}, sort: DEFAULT_SORT, q: "", student: null, skill: null, evaluation: null, showAllEvidence: false, bySkill: null, byTag: null }

const FILTER_KEYS = {
  cohortId: "cohort",
  groupId: "group",
  offeringId: "course",
  categoryId: "category",
  tagId: "tag",
  locationId: "location",
  settingId: "setting",
} as const satisfies Record<keyof ReportFilters, string>

export type FilterKey = keyof typeof FILTER_KEYS

export const FILTER_ORDER: FilterKey[] = ["cohortId", "groupId", "offeringId", "categoryId", "tagId", "locationId", "settingId"]

type Getter = { get(key: string): string | null }

export function parseParams(sp: Getter): OverviewParams {
  const tab = sp.get("tab")
  const sort = sp.get("sort")
  const filters: ReportFilters = {}
  for (const k of FILTER_ORDER) {
    const v = sp.get(FILTER_KEYS[k])
    if (v) (filters as Record<string, string>)[k] = v
  }
  return {
    tab: tab === "skill" || tab === "tag" ? tab : "student",
    filters,
    sort: sort === "highest" || sort === "name" || sort === "lowest" ? sort : DEFAULT_SORT,
    q: sp.get("q") ?? "",
    student: sp.get("student"),
    skill: sp.get("skill"),
    evaluation: sp.get("evaluation"),
    showAllEvidence: sp.get("all") === "1",
    bySkill: sp.get("bySkill"),
    byTag: sp.get("byTag"),
  }
}

/** Defaults are omitted so a clean overview has a clean URL. */
export function toSearch(p: OverviewParams): string {
  const u = new URLSearchParams()
  if (p.tab !== "student") u.set("tab", p.tab)
  for (const k of FILTER_ORDER) {
    const v = p.filters[k]
    if (v) u.set(FILTER_KEYS[k], v)
  }
  if (p.sort !== DEFAULT_SORT) u.set("sort", p.sort)
  if (p.q) u.set("q", p.q)
  if (p.student) u.set("student", p.student)
  if (p.skill && p.student) u.set("skill", p.skill)
  if (p.evaluation && p.student && p.skill) u.set("evaluation", p.evaluation)
  if (p.showAllEvidence) u.set("all", "1")
  if (p.bySkill && !p.student) u.set("bySkill", p.bySkill)
  if (p.byTag && !p.student) u.set("byTag", p.byTag)
  const s = u.toString()
  return s ? `?${s}` : ""
}

/** Removing a cohort also removes its group: the group picker is disabled without a cohort (S-01 V state). */
export function withFilter(p: OverviewParams, key: FilterKey, value: string | undefined): OverviewParams {
  const filters = { ...p.filters }
  if (value) (filters as Record<string, string>)[key] = value
  else delete filters[key]
  if (key === "cohortId" && !value) delete filters.groupId
  return { ...p, filters }
}

export const clearFilters = (p: OverviewParams): OverviewParams => ({ ...p, filters: {}, showAllEvidence: false })

export const hasEvidenceFilter = (f: ReportFilters): boolean => Boolean(f.locationId || f.settingId)
