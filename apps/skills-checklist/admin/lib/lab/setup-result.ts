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

export interface GroupResult {
  group: StudentGroup
  /** Groups of skills assigned to it, by name (individual picks read "Assigned one at a time"). */
  lists: string[]
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

export const INDIVIDUAL_LABEL = "Assigned one at a time"

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
    out.push({ group: g, lists: [...new Set(mine.map((l) => (l.individual ? INDIVIDUAL_LABEL : l.name)))], skills, placed, unplaced: skills.length - placed, offerings: mineOfferings.length })
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
