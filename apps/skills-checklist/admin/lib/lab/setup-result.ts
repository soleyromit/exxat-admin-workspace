/**
 * What setup adds up to, per student group: which skills they must complete (from the skill lists assigned to them), in which courses each is
 * mandatory or recommended (course mapping, each level read per offering and term), and what has no course. Read only.
 *
 * Course mapping's Coverage view (D-L77) and the Set up skills Review step read this. Setup summary, the page it was written for, is gone
 * (Sankalp, Granola 365abc25 chunk 17).
 * - Levels are per course offering and term [REQ CM-03, CM-06, CM-08]; nothing here copies one term's level to another (OD-01).
 * - A level says where a skill is expected, not where it may be done: a student can send any skill from any course [REQ CM-05].
 * - "In no course": no offering of the group's cohorts marks the skill mandatory or recommended. Information, never a defect.
 * - Clinical offerings unless `didactic`, the same offerings as `noCourseIds`, so a group's figure and the list it opens count alike.
 */
import type { V2State } from "@/lib/v2/types"
import { listHasAssignment, type SkillList, type StudentGroup } from "./lists"
import { noCourseIds, offeringLevels, offeringRows, type MappingOverlay, type OfferingRow } from "./mapping"

export type PlacedLevel = "mandatory" | "recommended"

export interface CoursePlacement {
  offeringId: string
  code: string
  name: string
  term: string
  cohort: string
  current: boolean
  level: PlacedLevel
}

export interface SkillPlacement {
  skillId: string
  name: string
  /** Names of the skill lists that bring it to this student group. */
  from: string[]
  courses: CoursePlacement[]
}

export interface ListCount {
  id: string
  name: string
  /** Skills on the list, inactive included (the number its own page shows). */
  total: number
  /** Of those, inactive: left out of "to complete" (D-X14), so 154 on the skill list reads 152 here. */
  inactive: number
}

export interface GroupResult {
  group: StudentGroup
  /** Skill lists assigned to it, by name. */
  lists: string[]
  /** The same lists with their size, so "to complete" reconciles with the Skill lists page. */
  listCounts: ListCount[]
  skills: SkillPlacement[]
  /** Skills with at least one course marking them mandatory or recommended. */
  placed: number
  /** Skills no course of this group marks mandatory or recommended. */
  unplaced: number
  /** Course offerings of this group's cohorts (any term). */
  offerings: number
}

export interface SetupResult {
  groups: GroupResult[]
  /** Student groups with no skills assigned. */
  emptyGroups: StudentGroup[]
  /** Active skills on no skill list assigned to anyone. */
  unassigned: Array<{ id: string; name: string }>
  /** In no course, on a list or not: the same set Course mapping's "In no course" filter lists with no group chosen. */
  noCourse: Set<string>
}

export function setupResult(s: V2State, lists: readonly SkillList[], overlay: MappingOverlay, groups: readonly StudentGroup[], activeIds: readonly string[], didactic = false): SetupResult {
  const names = new Map(s.skills.map((k) => [k.id, k.name]))
  const active = new Set(activeIds)
  const live = lists.filter((l) => listHasAssignment(l))
  const cohortOf = new Map(s.people.filter((p) => p.kind === "student").map((p) => [p.id, p.cohort]))
  const offerings = offeringRows(s, overlay).filter((o) => didactic || o.kind === "clinical")
  const offeringsById = new Map((s.offerings ?? []).map((o) => [o.id, o]))
  const levelCache = new Map<string, Map<string, string>>()
  const levelsOf = (row: OfferingRow) => {
    let m = levelCache.get(row.id)
    if (!m) {
      const off = offeringsById.get(row.id)
      m = off ? (offeringLevels(s, overlay, off) as Map<string, string>) : new Map()
      levelCache.set(row.id, m)
    }
    return m
  }
  const out: GroupResult[] = []
  const emptyGroups: StudentGroup[] = []
  const assigned = new Set<string>()
  for (const g of groups) {
    const mine = live.filter((l) => l.groupIds.includes(g.id))
    const skillFrom = new Map<string, string[]>()
    for (const l of mine) {
      for (const id of l.skillIds) {
        if (!active.has(id)) continue
        skillFrom.set(id, [...(skillFrom.get(id) ?? []), l.name])
        assigned.add(id)
      }
    }
    if (!skillFrom.size) {
      emptyGroups.push(g)
      continue
    }
    const cohorts = new Set(g.studentIds.map((id) => cohortOf.get(id)).filter((c): c is string => !!c))
    const mineOfferings = offerings.filter((o) => cohorts.has(o.cohort))
    const skills: SkillPlacement[] = [...skillFrom.entries()]
      .map(([skillId, from]) => {
        const courses: CoursePlacement[] = []
        for (const o of mineOfferings) {
          const lv = levelsOf(o).get(skillId)
          if (lv === "mandatory" || lv === "recommended") courses.push({ offeringId: o.id, code: o.code, name: o.name, term: o.term, cohort: o.cohort, current: o.current, level: lv })
        }
        courses.sort((a, b) => Number(b.level === "mandatory") - Number(a.level === "mandatory") || a.code.localeCompare(b.code))
        return { skillId, name: names.get(skillId) ?? skillId, from: [...new Set(from)], courses }
      })
      .sort((a, b) => Number(a.courses.length > 0) - Number(b.courses.length > 0) || a.name.localeCompare(b.name))
    const placed = skills.filter((k) => k.courses.length > 0).length
    const listCounts: ListCount[] = mine.map((l) => ({ id: l.id, name: l.name, total: l.skillIds.length, inactive: l.skillIds.filter((id) => !active.has(id)).length }))
    out.push({ group: g, lists: [...new Set(mine.map((l) => l.name))], listCounts, skills, placed, unplaced: skills.length - placed, offerings: mineOfferings.length })
  }
  const unassigned = activeIds.filter((id) => !assigned.has(id)).map((id) => ({ id, name: names.get(id) ?? id }))
  return { groups: out, emptyGroups, unassigned, noCourse: noCourseIds(s, overlay, lists, didactic) }
}

const fmt = (n: number) => n.toLocaleString("en-US")

/** The whole setup in short sentences, numbers first [aggregate first, drill down second]. */
export function resultSummary(r: SetupResult, noun: { one: string; many: string }, opts: { unassigned?: boolean } = {}): string {
  const parts: string[] = []
  const g = r.groups.length
  parts.push(`${fmt(g)} student ${g === 1 ? "group" : "groups"} with ${noun.many}.`)
  const unplaced = unplacedSkillIds(r).size
  parts.push(unplaced ? `${fmt(unplaced)} assigned ${unplaced === 1 ? noun.one : noun.many} without a course.` : `Every assigned ${noun.one} has a course.`)
  if (opts.unassigned !== false && r.unassigned.length) parts.push(`${fmt(r.unassigned.length)} not assigned.`)
  return parts.join(" ")
}

/** Skills that some student group must complete and no course of that group expects, each once. */
export function unplacedSkillIds(r: SetupResult): Set<string> {
  return new Set(r.groups.flatMap((g) => g.skills.filter((k) => k.courses.length === 0).map((k) => k.skillId)))
}

/**
 * In no clinical offering of any cohort, on a list or not: Course mapping's "In no course" filter and the Review step's figure, from `noCourseIds`. Coverage's per-group figures read
 * each group's own courses, so a skill mapped only for another cohort counts there and not here.
 */
export const courseGapIds = (r: SetupResult): Set<string> => r.noCourse

// ---------------------------------------------------------------------------------------------------------------------
// The recap on the Set up skills Review step. One row per setup step, in walkthrough order,
// each with its state and the figure that sends the admin to where it is fixed. Pure: the screen builds the hrefs.

export type RecapStep = "library" | "categories" | "settings" | "lists" | "assign" | "map"
export type RecapState = "done" | "attention" | "skipped"

/** A figure on the recap: its words and where it goes (screen + params). Amber when it is something to fix. */
export interface RecapFigure {
  text: string
  /** The number in the text, when there is one (the primary action names it). */
  count?: number
  screen: string
  params?: Record<string, string>
  fix: boolean
}

export interface RecapRow {
  step: RecapStep
  /** Walkthrough step id it reopens (flows.json setup-walkthrough). */
  stepId: string
  screen: string
  params?: Record<string, string>
  state: RecapState
  /** What is left to do, in order (the first is the step's key figure). */
  fixes: RecapFigure[]
  /** What is in place: neutral, reconciles the counts (178 = 176 active + 2 inactive; 176 = 156 assigned + 20 not). */
  inPlace: RecapFigure[]
}

export interface RecapInput {
  library: { total: number; notConfigured: number; inactive: number }
  categories: number
  tags: number
  /** Program evaluation settings saved (ISO date), or null when not set. */
  settingsAt: string | null
  lists: ReadonlyArray<Pick<SkillList, "groupIds" | "studentIds" | "individual">>
  result: SetupResult
}

export const RECAP_STEP_LABEL: Record<RecapStep, string> = {
  library: "Library",
  categories: "Categories and tags",
  settings: "Evaluation settings",
  lists: "Skill lists",
  assign: "Assigned to",
  map: "Course mapping",
}

const n = (x: number) => x.toLocaleString("en-US")

export function setupRecap(i: RecapInput): RecapRow[] {
  const active = i.library.total - i.library.inactive
  const lib: RecapRow = {
    step: "library",
    stepId: "library",
    screen: "admin/skills-library",
    state: i.library.notConfigured ? "attention" : "done",
    fixes: i.library.notConfigured ? [{ text: `${n(i.library.notConfigured)} not configured`, count: i.library.notConfigured, screen: "admin/skills-library", params: { config: "not-configured" }, fix: true }] : [],
    inPlace: [
      { text: `${n(active)} active`, screen: "admin/skills-library", fix: false },
      ...(i.library.inactive ? [{ text: `${n(i.library.inactive)} inactive`, screen: "admin/skills-library", params: { status: "inactive" }, fix: false }] : []),
    ],
  }
  const cats: RecapRow = {
    step: "categories",
    stepId: "categories",
    screen: "admin/categories-tags",
    state: "done",
    fixes: [],
    inPlace: [
      { text: `${n(i.categories)} ${i.categories === 1 ? "category" : "categories"}`, screen: "admin/categories-tags", fix: false },
      { text: `${n(i.tags)} ${i.tags === 1 ? "tag" : "tags"}`, screen: "admin/categories-tags", params: { tab: "tags" }, fix: false },
    ],
  }
  const settings: RecapRow = {
    step: "settings",
    stepId: "settings",
    screen: "admin/evaluation-settings",
    state: i.settingsAt ? "done" : "attention",
    fixes: i.settingsAt ? [] : [{ text: "Not set", screen: "admin/evaluation-settings", fix: true }],
    inPlace: i.settingsAt ? [{ text: "Saved", screen: "admin/evaluation-settings", fix: false }] : [],
  }
  const named = i.lists.filter((l) => !l.individual)
  const live = named.filter((l) => listHasAssignment(l)).length
  const unassigned = named.length - live
  const lists: RecapRow = {
    step: "lists",
    stepId: "lists",
    screen: "admin/lists-cohorts",
    state: live ? "done" : "skipped",
    fixes: [],
    inPlace: [
      ...(live ? [{ text: `${n(live)} in use`, screen: "admin/lists-cohorts", fix: false }] : []),
      ...(unassigned ? [{ text: `${n(unassigned)} not assigned`, screen: "admin/lists-cohorts", fix: false }] : []),
    ],
  }
  const un = i.result.unassigned.length
  const empty = i.result.emptyGroups.length
  const assignedCount = active - un
  const assign: RecapRow = {
    step: "assign",
    stepId: "lists",
    screen: "admin/lists-cohorts",
    state: un || empty ? "attention" : "done",
    fixes: [
      ...(un ? [{ text: `${n(un)} not assigned`, screen: "admin/lists-cohorts", fix: true }] : []),
      ...(empty ? [{ text: `${n(empty)} student ${empty === 1 ? "group" : "groups"} with none`, screen: "admin/lists-cohorts", params: { focus: i.result.emptyGroups[0]!.id }, fix: true }] : []),
    ],
    inPlace: [{ text: `${n(assignedCount)} assigned`, screen: "admin/lists-cohorts", fix: false }],
  }
  const gaps = courseGapIds(i.result).size
  const withCourses = i.result.groups.filter((g) => g.offerings > 0).length
  const map: RecapRow = {
    step: "map",
    stepId: "map-skill",
    screen: "admin/course-mapping",
    params: { by: "skill" },
    // Information, not a problem to clear: mapping is an expectation only [REQ CM-05, Aarti 205da2dd].
    state: "done",
    fixes: [],
    inPlace: [
      { text: `${n(withCourses)} of ${n(i.result.groups.length)} student groups have courses`, screen: "admin/course-mapping", params: { by: "course" }, fix: false },
      ...(gaps ? [{ text: `${n(gaps)} in no course`, screen: "admin/course-mapping", params: { by: "skill", show: "nocourse" }, fix: false }] : []),
    ],
  }
  return [lib, cats, settings, lists, assign, map]
}

/** The next most important fix: the first row, in walkthrough order, with something to fix. */
export function nextFix(rows: readonly RecapRow[]): { row: RecapRow; fix: RecapFigure } | null {
  for (const row of rows) if (row.fixes[0]) return { row, fix: row.fixes[0] }
  return null
}
