/**
 * The end state of setup (Proposed 2026-11-02, Romit: "I don't know what the end state looks like considering I have selected
 * student groups"): per student group, which skills they must complete (from the groups of skills assigned to them), in which
 * courses each is mandatory or recommended (course mapping, each level read per offering and term), and what is still unplaced.
 *
 * One source for the Setup summary screen, the chain line on Groups of skills and Course mapping, and the checklist. Read only.
 * - Levels are per course offering and term [REQ CM-03, CM-06, CM-08]; nothing here copies one term's level to another (OD-01).
 * - A level says where a skill is expected, not where it may be done: a student can send any skill from any course [REQ CM-05].
 * - "No course yet": no offering of the group's cohorts marks the skill mandatory or recommended. Optional (inherited from the list,
 *   decision D-X27) is available, not placed.
 */
import type { V2State } from "@/lib/v2/types"
import type { SkillList, StudentGroup } from "./lists"
import { offeringLevels, offeringRows, type MappingOverlay, type OfferingRow } from "./mapping"

export type PlacedLevel = "mandatory" | "recommended"

export interface CoursePlacement {
  offeringId: string
  code: string
  name: string
  term: string
  current: boolean
  level: PlacedLevel
}

export interface SkillPlacement {
  skillId: string
  name: string
  /** Names of the groups of skills that bring it to this student group (or "Assigned one at a time"). */
  from: string[]
  /** On a list's required-to-graduate set. */
  required: boolean
  courses: CoursePlacement[]
}

export interface ListCount {
  id: string
  name: string
  /** Skills on the group of skills, inactive included (the number its own page shows). */
  total: number
  /** Of those, inactive: left out of "to complete" (D-X14), so 154 on the group of skills reads 152 here. */
  inactive: number
}

export interface GroupResult {
  group: StudentGroup
  /** Groups of skills assigned to it, by name (individual picks read "Assigned one at a time"). */
  lists: string[]
  /** The same groups of skills with their size, so "to complete" reconciles with the group of skills page. */
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
  /** Active skills on no live group of skills assigned to anyone. */
  unassigned: Array<{ id: string; name: string }>
}

export const INDIVIDUAL_LABEL = "Individual skills"

export function setupResult(s: V2State, lists: readonly SkillList[], overlay: MappingOverlay, groups: readonly StudentGroup[], activeIds: readonly string[]): SetupResult {
  const names = new Map(s.skills.map((k) => [k.id, k.name]))
  const active = new Set(activeIds)
  const live = lists.filter((l) => l.status === "live")
  const cohortOf = new Map(s.people.filter((p) => p.kind === "student").map((p) => [p.id, p.cohort]))
  const offerings = offeringRows(s, overlay, lists as SkillList[])
  const offeringsById = new Map((s.offerings ?? []).map((o) => [o.id, o]))
  const levelCache = new Map<string, Map<string, string>>()
  const levelsOf = (row: OfferingRow) => {
    let m = levelCache.get(row.id)
    if (!m) {
      const off = offeringsById.get(row.id)
      m = off ? (offeringLevels(s, overlay, off, lists as SkillList[]) as Map<string, string>) : new Map()
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
    const required = new Set<string>()
    for (const l of mine) {
      for (const id of l.skillIds) {
        if (!active.has(id)) continue
        skillFrom.set(id, [...(skillFrom.get(id) ?? []), l.individual ? INDIVIDUAL_LABEL : l.name])
        assigned.add(id)
      }
      for (const id of l.requiredIds) required.add(id)
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
          if (lv === "mandatory" || lv === "recommended") courses.push({ offeringId: o.id, code: o.code, name: o.name, term: o.term, current: o.current, level: lv })
        }
        courses.sort((a, b) => Number(b.level === "mandatory") - Number(a.level === "mandatory") || a.code.localeCompare(b.code))
        return { skillId, name: names.get(skillId) ?? skillId, from: [...new Set(from)], required: required.has(skillId), courses }
      })
      .sort((a, b) => Number(a.courses.length > 0) - Number(b.courses.length > 0) || a.name.localeCompare(b.name))
    const placed = skills.filter((k) => k.courses.length > 0).length
    const listCounts: ListCount[] = mine.map((l) => ({ id: l.id, name: l.individual ? INDIVIDUAL_LABEL : l.name, total: l.skillIds.length, inactive: l.skillIds.filter((id) => !active.has(id)).length }))
    out.push({ group: g, lists: [...new Set(mine.map((l) => (l.individual ? INDIVIDUAL_LABEL : l.name)))], listCounts, skills, placed, unplaced: skills.length - placed, offerings: mineOfferings.length })
  }
  const unassigned = activeIds.filter((id) => !assigned.has(id)).map((id) => ({ id, name: names.get(id) ?? id }))
  return { groups: out, emptyGroups, unassigned }
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
 * Skills some student group must complete that none of its courses expects yet, counted only for groups that have courses: a
 * group with no course offerings cannot be fixed in course mapping, so its skills are not a course mapping gap. Each once.
 * The Setup summary's course mapping figure and course mapping's "No course yet" filter read this one function.
 */
export function courseGapIds(r: SetupResult): Set<string> {
  return new Set(r.groups.filter((g) => g.offerings > 0).flatMap((g) => g.skills.filter((k) => k.courses.length === 0).map((k) => k.skillId)))
}

// ---------------------------------------------------------------------------------------------------------------------
// The walkthrough recap (Romit 2026-11-03: "setup summary doesn't seem connected"). One row per setup step, in walkthrough order,
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
  /** Opens the assign step (its href depends on the flow). */
  assign?: boolean
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
  lists: ReadonlyArray<Pick<SkillList, "status" | "individual">>
  result: SetupResult
}

export const RECAP_STEP_LABEL: Record<RecapStep, string> = {
  library: "Library",
  categories: "Categories and tags",
  settings: "Evaluation settings",
  lists: "Groups of skills",
  assign: "Assign skills to student groups",
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
    fixes: i.library.notConfigured ? [{ text: `${n(i.library.notConfigured)} not configured`, count: i.library.notConfigured, screen: "admin/skills-library", params: { status: "not-configured" }, fix: true }] : [],
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
  const live = named.filter((l) => l.status === "live").length
  const drafts = named.filter((l) => l.status === "draft").length
  const lists: RecapRow = {
    step: "lists",
    stepId: "lists",
    screen: "admin/lists-cohorts",
    state: live ? "done" : "skipped",
    fixes: [],
    inPlace: [
      ...(live ? [{ text: `${n(live)} in use`, screen: "admin/lists-cohorts", fix: false }] : []),
      ...(drafts ? [{ text: `${n(drafts)} ${drafts === 1 ? "draft" : "drafts"}`, screen: "admin/lists-cohorts", fix: false }] : []),
    ],
  }
  const un = i.result.unassigned.length
  const empty = i.result.emptyGroups.length
  const assignedCount = active - un
  const assign: RecapRow = {
    step: "assign",
    stepId: "assign",
    screen: "admin/lists-cohorts",
    params: { view: "assign" },
    state: un || empty ? "attention" : "done",
    fixes: [
      ...(un ? [{ text: `${n(un)} not assigned`, screen: "admin/lists-cohorts", params: { by: "skills" }, assign: true, fix: true }] : []),
      ...(empty ? [{ text: `${n(empty)} student ${empty === 1 ? "group" : "groups"} with none`, screen: "admin/lists-cohorts", params: { focus: i.result.emptyGroups[0]!.id }, assign: true, fix: true }] : []),
    ],
    inPlace: [{ text: `${n(assignedCount)} assigned`, screen: "admin/lists-cohorts", params: { view: "assign" }, assign: true, fix: false }],
  }
  const gaps = courseGapIds(i.result).size
  const withCourses = i.result.groups.filter((g) => g.offerings > 0).length
  const map: RecapRow = {
    step: "map",
    stepId: "map-skill",
    screen: "admin/course-mapping",
    params: { by: "skill" },
    state: gaps ? "attention" : "done",
    fixes: gaps ? [{ text: `${n(gaps)} no course yet`, screen: "admin/course-mapping", params: { by: "skill", show: "nocourse" }, fix: true }] : [],
    inPlace: [{ text: `${n(withCourses)} of ${n(i.result.groups.length)} student groups have courses`, screen: "admin/course-mapping", params: { by: "course" }, fix: false }],
  }
  return [lib, cats, settings, lists, assign, map]
}

/** The next most important fix: the first row, in walkthrough order, with something to fix. */
export function nextFix(rows: readonly RecapRow[]): { row: RecapRow; fix: RecapFigure } | null {
  for (const row of rows) if (row.fixes[0]) return { row, fix: row.fixes[0] }
  return null
}

/** `?from=` on the summary: the step the admin came from, so its row is marked and its name leads back. */
export function recapFrom(v: string | null | undefined): RecapStep | null {
  if (!v) return null
  const map: Record<string, RecapStep> = { library: "library", categories: "categories", settings: "settings", lists: "lists", assign: "assign", map: "map", "map-skill": "map" }
  return map[v] ?? null
}
