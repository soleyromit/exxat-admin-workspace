/**
 * The one reading of "what level does this skill have in this offering", for students, reports and readiness. The course's mapping rows
 * (the seed) with the admin's saved edit to that one offering applied [REQ CM-03, CM-06, CM-08]. An edit never reaches another offering.
 *
 * Levels are Mandatory, Recommended and Not mapped (D-L76, 2026-11-04). A stored Optional, from the seed or an older edit, reads as Not
 * mapped: optional need not be mapped [CALL 11-04 Granola e72ea925 chunk 8]. A list's skill is Not mapped until someone sets it. The skill
 * can still be submitted and counts on the record [REQ CM-05].
 */
import { mappingsOfCourse } from "./evidence-index"
import type { CourseOffering, MappingLevelEdit, MappingRow, V2State } from "./types"

/** A level as it is read today: stored Optional never comes out of this file. */
export type LevelInForce = Exclude<MappingRow["level"], "optional">
export type RowInForce = Omit<MappingRow, "level"> & { level: LevelInForce }

const offeringIndexes = new WeakMap<object, Map<string, CourseOffering>>()
const key = (courseId: string, cohortId: string, termId: string) => `${courseId}|${cohortId}|${termId}`

export function offeringOf(s: V2State, courseId: string, cohortId: string, termId: string): CourseOffering | undefined {
  const list = s.offerings
  if (!list) return undefined
  let m = offeringIndexes.get(list)
  if (!m) {
    m = new Map(list.map((o) => [key(o.courseId, o.cohortId, o.termId), o]))
    offeringIndexes.set(list, m)
  }
  return m.get(key(courseId, cohortId, termId))
}

/** "none", and an Optional left in storage by an older save, both read as Not mapped. */
const fromEdit = (level: MappingLevelEdit | "optional"): LevelInForce => (level === "mandatory" || level === "recommended" ? level : "not-expected")

const decidedCache = new WeakMap<readonly MappingRow[], readonly RowInForce[]>()
/** The course's rows without stored Optional. */
function decidedRows(rows: readonly MappingRow[]): readonly RowInForce[] {
  let hit = decidedCache.get(rows)
  if (!hit) {
    hit = rows.filter((m): m is RowInForce => m.level !== "optional")
    decidedCache.set(rows, hit)
  }
  return hit
}

/** One course's rows for one offering, the offering's edits applied. */
function applyEdits(rows: readonly RowInForce[], courseId: string, edits: Record<string, MappingLevelEdit> | undefined): readonly RowInForce[] {
  if (!edits || Object.keys(edits).length === 0) return rows
  const out = rows.filter((m) => !(m.skillId in edits))
  for (const [skillId, level] of Object.entries(edits)) out.push({ courseId, skillId, level: fromEdit(level) })
  return out
}

/** The mapping rows in force for one course, for one cohort, in one term. */
export function mappingRowsInForce(s: V2State, courseId: string, cohortId: string, termId: string): readonly RowInForce[] {
  const rows = decidedRows(mappingsOfCourse(s, courseId))
  const edits = s.offeringLevels
  if (!edits) return rows
  const off = offeringOf(s, courseId, cohortId, termId)
  return off ? applyEdits(rows, courseId, edits[off.id]) : rows
}

const RANK = { mandatory: 0, recommended: 1 } as const

/** Skill id -> strongest level on any offering of a course: a report scoped to the course, with no term of its own [REQ RP-03]. */
export function courseLevelsInForce(s: V2State, courseId: string): Map<string, "mandatory" | "recommended"> {
  const out = new Map<string, "mandatory" | "recommended">()
  const base = decidedRows(mappingsOfCourse(s, courseId))
  const offerings = (s.offerings ?? []).filter((o) => o.courseId === courseId)
  const read = (rows: readonly RowInForce[]) => {
    for (const m of rows) {
      if (m.level === "not-expected") continue
      const prev = out.get(m.skillId)
      if (!prev || RANK[m.level] < RANK[prev]) out.set(m.skillId, m.level)
    }
  }
  for (const o of offerings) read(applyEdits(base, courseId, s.offeringLevels?.[o.id]))
  if (offerings.length === 0) read(base)
  return out
}

/** Skills mapped on any offering of a course. */
export function courseSkillIdsInForce(s: V2State, courseId: string): Set<string> {
  return new Set(courseLevelsInForce(s, courseId).keys())
}
