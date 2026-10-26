/**
 * Course mapping (build prompt admcourse). Pure functions over V2State; the store is never written.
 *
 * REQ: an offering is a course in a term, academic year, professional year, with its cohorts [REQ CM-01]; offerings are found by search,
 * cohort, term, academic year and professional year [CM-02]; a mapped skill is mandatory or non-mandatory for that offering [CM-03] and
 * the level may differ between offerings of the same skill [CM-06]; each offering shows mapped and mandatory counts [CM-04]. Mapping is
 * expectation, not eligibility [CM-05]: a student may submit any skill and the evidence counts on the one record per skill [CM-07].
 * Unconfigured skills cannot be mapped [IM-09]. Carry-forward between terms is open (OD-01): an edit applies to one offering only.
 *
 * The v2 store maps skills per course (MappingRow.courseId); the lab reads that as every offering's starting point and keeps edits per
 * offering in an overlay (`MappingOverlay`, offering id -> skill id -> level).
 *
 * Coverage [BUILD-PROMPT admcourse, N-13]: the required skills of the default list against the term's offerings; a required skill that
 * no offering carries is "in no course".
 */
import type { CourseOffering, MappingLevel, Skill, V2State } from "@/lib/v2/types"
import { mapBlockReason } from "@/lib/v2/coverage"
import { MAPPING_LEVEL_LABEL } from "@/lib/v2/labels"
import { sectionOf, LAB_ADMIN } from "./library"
import { defaultList, seedLists, type SkillList } from "./lists"

/**
 * Three per-course levels plus not mapped [CALL 10-26]: Mandatory (the only one "Required this term" and pace read, D-X12),
 * Recommended (feeds "Likely here" and the placement-ending nudge), Optional (submittable, counts on the record, never required).
 */
export type MapLevel = "mandatory" | "recommended" | "optional" | "none"
export const LEVELS: MapLevel[] = ["mandatory", "recommended", "optional", "none"]
export const LEVEL_LABEL: Record<MapLevel, string> = {
  mandatory: MAPPING_LEVEL_LABEL.mandatory,
  recommended: MAPPING_LEVEL_LABEL.recommended,
  optional: MAPPING_LEVEL_LABEL.optional,
  none: MAPPING_LEVEL_LABEL["not-expected"],
}

export type MappingOverlay = Record<string, Record<string, MapLevel>>
export const EMPTY_MAPPING_OVERLAY: MappingOverlay = {}

export const PROFESSIONAL_YEARS = 4

export interface OfferingRow extends Record<string, unknown> {
  id: string
  courseId: string
  code: string
  name: string
  termId: string
  term: string
  academicYear: string
  /** 1 to 4. */
  professionalYear: number
  cohortId: string
  cohort: string
  kind: "clinical" | "didactic"
  /** Mapped at any level; mapped = mandatory + recommended + optional. */
  mapped: number
  mandatory: number
  recommended: number
  optional: number
  current: boolean
  /** Lower-case text the search matches: code, name, term, academic year, cohort, "year n". */
  haystack: string
}

/** "2026-27" for a term starting in August 2026 or January 2027. */
export function academicYear(start: string): string {
  const y = Number(start.slice(0, 4))
  const m = Number(start.slice(5, 7))
  const first = m >= 8 ? y : y - 1
  return `${first}-${String((first + 1) % 100).padStart(2, "0")}`
}

/**
 * Professional year from the cohort's graduation year and the academic year [INFER]: the seed still runs offerings for the 2026
 * cohort in 2026-27, so a cohort is read as in its final (fourth) year the academic year after its graduation label. Clamped to 1..4.
 */
export function professionalYear(graduates: string, ay: string): number {
  const end = Number(ay.slice(0, 4)) + 1
  const y = PROFESSIONAL_YEARS - (Number(graduates) - end) - 1
  return Math.min(PROFESSIONAL_YEARS, Math.max(1, y))
}

function fromV2(level: MappingLevel): MapLevel {
  return level === "not-expected" ? "none" : level
}

const baseCache = new WeakMap<V2State, Map<string, Map<string, MapLevel>>>()

/** Course id -> skill id -> level, from the v2 mapping rows. */
function baseLevels(s: V2State): Map<string, Map<string, MapLevel>> {
  const hit = baseCache.get(s)
  if (hit) return hit
  const out = new Map<string, Map<string, MapLevel>>()
  for (const m of s.mappings) {
    const per = out.get(m.courseId) ?? new Map<string, MapLevel>()
    per.set(m.skillId, fromV2(m.level))
    out.set(m.courseId, per)
  }
  baseCache.set(s, out)
  return out
}

export function offeringById(s: V2State, id: string | null | undefined): CourseOffering | undefined {
  return id ? (s.offerings ?? []).find((o) => o.id === id) : undefined
}

/** The level of one skill in one offering: the offering's own edit, else the course mapping. */
export function levelOf(s: V2State, o: MappingOverlay, offering: CourseOffering, skillId: string): MapLevel {
  return o[offering.id]?.[skillId] ?? baseLevels(s).get(offering.courseId)?.get(skillId) ?? "none"
}

/** Skill id -> level for every skill mapped (mandatory or non-mandatory) in an offering. */
export function offeringLevels(s: V2State, o: MappingOverlay, offering: CourseOffering): Map<string, MapLevel> {
  const out = new Map<string, MapLevel>(baseLevels(s).get(offering.courseId) ?? [])
  for (const [k, v] of Object.entries(o[offering.id] ?? {})) out.set(k, v)
  for (const [k, v] of out) if (v === "none") out.delete(k)
  return out
}

export function offeringRows(s: V2State, o: MappingOverlay = EMPTY_MAPPING_OVERLAY): OfferingRow[] {
  const courses = new Map((s.courses ?? []).map((c) => [c.id, c]))
  const terms = new Map((s.terms ?? []).map((t) => [t.id, t]))
  const cohorts = new Map((s.cohorts ?? []).map((c) => [c.id, c]))
  const rows: OfferingRow[] = []
  for (const off of s.offerings ?? []) {
    const c = courses.get(off.courseId)
    const t = terms.get(off.termId)
    const coh = cohorts.get(off.cohortId)
    if (!c || !t || !coh) continue
    const ay = academicYear(t.start)
    const py = professionalYear(coh.graduates, ay)
    const lv = offeringLevels(s, o, off)
    let mandatory = 0
    let recommended = 0
    for (const v of lv.values()) {
      if (v === "mandatory") mandatory++
      else if (v === "recommended") recommended++
    }
    rows.push({
      id: off.id,
      courseId: c.id,
      code: c.code,
      name: c.name,
      termId: t.id,
      term: t.name,
      academicYear: ay,
      professionalYear: py,
      cohortId: coh.id,
      cohort: coh.name,
      kind: c.kind ?? "clinical",
      mapped: lv.size,
      mandatory,
      recommended,
      optional: lv.size - mandatory - recommended,
      current: !!t.current,
      haystack: `${c.code} ${c.name} ${t.name} ${ay} ${coh.name} year ${py}`.toLowerCase(),
    })
  }
  return rows.sort((a, b) => a.code.localeCompare(b.code) || a.termId.localeCompare(b.termId))
}

export interface OfferingFilter {
  q: string
  term: string
  cohort: string
  year: string
  /** Include didactic offerings. Absent or false: clinical only, the default (CALL 10-26, pending the client). */
  didactic?: boolean
}

export const ANY = ""

/** Search and filters run on the whole set, never on the visible rows. Clinical offerings only unless didactic is included. */
export function filterOfferings(rows: readonly OfferingRow[], f: OfferingFilter): OfferingRow[] {
  const q = f.q.trim().toLowerCase()
  return rows.filter((r) => (f.didactic || r.kind === "clinical") && (!f.term || r.termId === f.term) && (!f.cohort || r.cohortId === f.cohort) && (!f.year || String(r.professionalYear) === f.year) && (!q || r.haystack.includes(q)))
}

/** Offerings of a term, clinical only unless didactic is included: the set every course picker on the mapping screens starts from. */
function termOfferings(s: V2State, termId: string, didactic: boolean): CourseOffering[] {
  const skip = didactic ? null : new Set((s.courses ?? []).filter((c) => c.kind === "didactic").map((c) => c.id))
  return (s.offerings ?? []).filter((x) => x.termId === termId && !skip?.has(x.courseId))
}

/** The current term, else the latest. */
export function currentTermId(s: V2State): string {
  const terms = s.terms ?? []
  return (terms.find((t) => t.current) ?? terms[terms.length - 1])?.id ?? ""
}

export interface TermOption {
  id: string
  name: string
  academicYear: string
}

/** Terms grouped by academic year in the select, so the year is searchable without a fifth control. */
export function termOptions(s: V2State): TermOption[] {
  return (s.terms ?? []).map((t) => ({ id: t.id, name: t.name, academicYear: academicYear(t.start) }))
}

// ---------------------------------------------------------------------------------------------------------------------
// One offering's skills

export interface SkillMapRow extends Record<string, unknown> {
  id: string
  name: string
  section: string
  configured: boolean
  /** Required on the default list. */
  required: boolean
  level: MapLevel
  /** Lower-case name and section for the search. */
  haystack: string
}

const isConfigured = (k: Skill) => mapBlockReason(k) === null

export function skillRowsFor(s: V2State, o: MappingOverlay, offering: CourseOffering, lists: readonly SkillList[] = seedLists(s)): SkillMapRow[] {
  const req = new Set(defaultList(lists)?.requiredIds ?? [])
  const lv = offeringLevels(s, o, offering)
  return s.skills
    .map((k) => {
      const section = sectionOf(k)
      return { id: k.id, name: k.name, section, configured: isConfigured(k), required: req.has(k.id), level: lv.get(k.id) ?? "none", haystack: `${k.name} ${section}`.toLowerCase() }
    })
    // Stable order (a level change must not move the row under the cursor): configured first, then section and name.
    .sort((a, b) => Number(b.configured) - Number(a.configured) || a.section.localeCompare(b.section) || a.name.localeCompare(b.name))
}

export type SetLevelResult = { ok: true; overlay: MappingOverlay } | { ok: false; reason: string }

/** Unconfigured skills cannot be mapped [REQ IM-09]; setting one to "Not mapped" is always allowed. */
export function setLevel(s: V2State, o: MappingOverlay, offeringId: string, skillId: string, level: MapLevel): SetLevelResult {
  const skill = s.skills.find((k) => k.id === skillId)
  if (!skill) return { ok: false, reason: "This skill is no longer in the library." }
  if (!offeringById(s, offeringId)) return { ok: false, reason: "This offering no longer exists." }
  if (level !== "none" && !isConfigured(skill)) return { ok: false, reason: "Configure this skill before mapping it." }
  return { ok: true, overlay: { ...o, [offeringId]: { ...(o[offeringId] ?? {}), [skillId]: level } } }
}

export function setLevels(s: V2State, o: MappingOverlay, offeringId: string, skillIds: readonly string[], level: MapLevel): { overlay: MappingOverlay; changed: number; skipped: number } {
  let overlay = o
  let changed = 0
  let skipped = 0
  for (const id of skillIds) {
    const r = setLevel(s, overlay, offeringId, id, level)
    if (r.ok) {
      overlay = r.overlay
      changed++
    } else skipped++
  }
  return { overlay, changed, skipped }
}

export function unconfiguredCount(s: V2State): number {
  return s.skills.filter((k) => !isConfigured(k)).length
}

// ---------------------------------------------------------------------------------------------------------------------
// Coverage: required skills by the term's offerings

export interface CoverageColumn {
  offeringId: string
  courseId: string
  code: string
  cohort: string
}

export interface CoverageRow extends Record<string, unknown> {
  id: string
  name: string
  section: string
  configured: boolean
  /** Offering id -> level, for the term's offerings. */
  cells: Record<string, MapLevel>
  carriers: number
  mandatoryCarriers: number
}

export interface Coverage {
  termId: string
  columns: CoverageColumn[]
  rows: CoverageRow[]
  /** Required skills that no offering in the term carries (N-13), by name. */
  gaps: CoverageRow[]
  required: number
}

/**
 * `only` narrows the columns to the offerings the toolbar shows (cohort, year, search); the counts then follow those columns.
 * Clinical offerings only unless `didactic` (the default course set, CALL 10-26).
 */
export function coverage(s: V2State, o: MappingOverlay, termId: string, lists: readonly SkillList[] = seedLists(s), only?: ReadonlySet<string>, didactic = false): Coverage {
  const list = defaultList(lists)
  const req = list?.requiredIds ?? []
  const offs = termOfferings(s, termId, didactic).filter((x) => !only || only.has(x.id))
  const courses = new Map((s.courses ?? []).map((c) => [c.id, c]))
  const cohorts = new Map((s.cohorts ?? []).map((c) => [c.id, c]))
  const columns: CoverageColumn[] = offs
    .map((x) => ({ offeringId: x.id, courseId: x.courseId, code: courses.get(x.courseId)?.code ?? x.courseId, cohort: cohorts.get(x.cohortId)?.name ?? "" }))
    .sort((a, b) => a.cohort.localeCompare(b.cohort) || a.code.localeCompare(b.code))
  const levels = new Map(offs.map((x) => [x.id, offeringLevels(s, o, x)]))
  const rows: CoverageRow[] = []
  for (const id of req) {
    const k = s.skills.find((x) => x.id === id)
    if (!k) continue
    const cells: Record<string, MapLevel> = {}
    let carriers = 0
    let mandatoryCarriers = 0
    for (const c of columns) {
      const lv = levels.get(c.offeringId)?.get(id) ?? "none"
      cells[c.offeringId] = lv
      if (lv !== "none") carriers++
      if (lv === "mandatory") mandatoryCarriers++
    }
    rows.push({ id, name: k.name, section: sectionOf(k), configured: isConfigured(k), cells, carriers, mandatoryCarriers })
  }
  rows.sort((a, b) => a.carriers - b.carriers || a.name.localeCompare(b.name))
  return { termId, columns, rows, gaps: rows.filter((r) => r.carriers === 0), required: req.length }
}

// ---------------------------------------------------------------------------------------------------------------------
// Skill-centric view

export interface SkillReachRow extends Record<string, unknown> {
  id: string
  name: string
  section: string
  configured: boolean
  required: boolean
  carriers: number
  mandatoryCarriers: number
  haystack: string
}

/** Every skill with how many of the term's offerings carry it, by name. Clinical offerings only unless `didactic`. */
export function skillReach(s: V2State, o: MappingOverlay, termId: string, lists: readonly SkillList[] = seedLists(s), didactic = false): SkillReachRow[] {
  const req = new Set(defaultList(lists)?.requiredIds ?? [])
  const offs = termOfferings(s, termId, didactic)
  const levels = offs.map((x) => offeringLevels(s, o, x))
  return s.skills
    .map((k) => {
      let carriers = 0
      let mandatoryCarriers = 0
      for (const lv of levels) {
        const v = lv.get(k.id)
        if (v) carriers++
        if (v === "mandatory") mandatoryCarriers++
      }
      const section = sectionOf(k)
      return { id: k.id, name: k.name, section, configured: isConfigured(k), required: req.has(k.id), carriers, mandatoryCarriers, haystack: `${k.name} ${section}`.toLowerCase() }
    })
    // By name: the amber "In no course" marks stay a small share of the list; the N-13 line filters to them.
    .sort((a, b) => a.name.localeCompare(b.name))
}

export interface SkillOfferingRow extends Record<string, unknown> {
  id: string
  code: string
  name: string
  cohort: string
  professionalYear: number
  kind: "clinical" | "didactic"
  level: MapLevel
}

/** The term's offerings with this skill's level in each (edit per offering; levels may differ, CM-06). Clinical only unless `didactic`. */
export function offeringsForSkill(s: V2State, o: MappingOverlay, skillId: string, termId: string, didactic = false): SkillOfferingRow[] {
  return offeringRows(s, o)
    .filter((r) => r.termId === termId && (didactic || r.kind === "clinical"))
    .map((r) => {
      const off = offeringById(s, r.id)!
      return { id: r.id, code: r.code, name: r.name, cohort: r.cohort, professionalYear: r.professionalYear, kind: r.kind, level: levelOf(s, o, off, skillId) }
    })
    .sort((a, b) => LEVELS.indexOf(a.level) - LEVELS.indexOf(b.level) || a.code.localeCompare(b.code))
}

// ---------------------------------------------------------------------------------------------------------------------
// Links

export const MAPPING_PATH = `${LAB_ADMIN}/course-mapping`

export type MappingParam = "variant" | "term" | "offering" | "skill" | "view" | "cohort" | "year" | "q" | "oq" | "show" | "incl"

export function mappingLink(p: Partial<Record<MappingParam, string | undefined>>): string {
  const q = new URLSearchParams()
  for (const [k, v] of Object.entries(p)) if (v) q.set(k, v)
  const s = q.toString()
  return s ? `${MAPPING_PATH}?${s}` : MAPPING_PATH
}
