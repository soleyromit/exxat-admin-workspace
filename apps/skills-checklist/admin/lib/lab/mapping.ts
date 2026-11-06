/**
 * Course mapping (build prompt admcourse). Pure functions over V2State; the store is never written.
 *
 * REQ: an offering is a course in a term, academic year, professional year, with its cohorts [REQ CM-01]; offerings are found by search,
 * cohort, term, academic year and professional year [CM-02]; a mapped skill is mandatory or non-mandatory for that offering [CM-03] and
 * the level may differ between offerings of the same skill [CM-06]; each offering shows mapped and mandatory counts [CM-04]. Mapping is
 * expectation, not eligibility [CM-05]: a student may submit any skill and the evidence counts on the one record per skill [CM-07].
 * Unconfigured skills cannot be mapped [IM-09]. An edit applies to one offering only [CM-08]. Whether a mapping carries forward between
 * terms is open (OD-01), so nothing on these screens says one did.
 *
 * Two layers decide a skill's level in one offering (D-L76, 2026-11-04, which replaces the list inheritance of D-X27):
 * 1. Explicit: the v2 store's per-course mapping rows (MappingRow.courseId), the seeded data. A stored Optional reads as Not mapped.
 * 2. Overlay: the per-offering edits (`MappingOverlay`, offering id -> skill id -> level), saved on the state as `offeringLevels`. They win.
 * A skill on a list is Not mapped on an offering until someone sets it. Mapped is Mandatory plus Recommended, on this screen and on the
 * student's course page (lib/v2/mapping-in-force.ts reads the same two layers).
 *
 * Coverage (the third view, D-L77): per student group, which assigned skills have a course (lib/lab/setup-result.ts).
 */
import type { CourseOffering, MappingLevel, Skill, V2State } from "@/lib/v2/types"
import { mapBlockReason } from "@/lib/v2/coverage"
import { isConfigured as isConfiguredSkill } from "@/lib/v2/population"
import { MAPPING_LEVEL_LABEL } from "@/lib/v2/labels"
import { sectionOf, LAB_ADMIN } from "./library"
import { listsForCohort, programLists, type SkillList } from "./lists"
import { capitalize, skillNoun, skillNounPlural } from "./terms"

const capitalizeNoun = () => capitalize(skillNoun())
const skillNounPluralOf = () => skillNounPlural()

/**
 * Mandatory (the only one "Required this term" and pace read, D-X12), Recommended (CM-03's non-mandatory value; feeds "Likely here" and the
 * placement-ending nudge), Not mapped (the default; still submittable, and it counts on the record [REQ CM-05]). D-L76.
 */
export type MapLevel = "mandatory" | "recommended" | "none"
export const LEVELS: MapLevel[] = ["mandatory", "recommended", "none"]
export const LEVEL_LABEL: Record<MapLevel, string> = {
  mandatory: MAPPING_LEVEL_LABEL.mandatory,
  recommended: MAPPING_LEVEL_LABEL.recommended,
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
  /** Mapped = mandatory + recommended [REQ CM-04]: the same set the student's course page lists. */
  mapped: number
  mandatory: number
  recommended: number
  current: boolean
  /** Its term ended before the current one started: left out unless a term or an academic year asks for it. */
  past: boolean
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

/** Stored Optional reads as Not mapped (D-L76). */
function fromStored(level: MappingLevel | MapLevel): MapLevel {
  return level === "mandatory" || level === "recommended" ? level : "none"
}

const baseCache = new WeakMap<V2State, Map<string, Map<string, MapLevel>>>()

/** Course id -> skill id -> level, from the v2 mapping rows (the explicit layer). */
function baseLevels(s: V2State): Map<string, Map<string, MapLevel>> {
  const hit = baseCache.get(s)
  if (hit) return hit
  const out = new Map<string, Map<string, MapLevel>>()
  for (const m of s.mappings) {
    const per = out.get(m.courseId) ?? new Map<string, MapLevel>()
    per.set(m.skillId, fromStored(m.level))
    out.set(m.courseId, per)
  }
  baseCache.set(s, out)
  return out
}

/** The program's lists with their saved edits: the default when a caller passes no lists. */
const listsOf = programLists

/** The saved per-offering edits: the default when a caller passes no overlay. */
export const savedOverlay = (s: V2State): MappingOverlay => s.offeringLevels ?? EMPTY_MAPPING_OVERLAY

export function offeringById(s: V2State, id: string | null | undefined): CourseOffering | undefined {
  return id ? (s.offerings ?? []).find((o) => o.id === id) : undefined
}

/** Where a level came from: the course mapping, or an edit saved for this offering. */
export type LevelSource = "explicit" | "overlay"

export interface ResolvedLevel {
  level: MapLevel
  source: LevelSource
}

const inactiveCache = new WeakMap<V2State, Set<string>>()
/**
 * Ids of deactivated skills [REQ SL-11]: "Deactivating a skill withdraws it from course mapping, from student selection and from
 * reporting scope, while retaining evidence already recorded against it." Mapping reads every layer through this set, so a
 * deactivated skill keeps its stored mapping rows (and its evidence) but is carried by no offering and offered on no mapping screen.
 */
export function inactiveSkillIds(s: V2State): Set<string> {
  let hit = inactiveCache.get(s)
  if (!hit) {
    hit = new Set(s.skills.filter((k) => k.active === false).map((k) => k.id))
    inactiveCache.set(s, hit)
  }
  return hit
}

const withdrawnCache = new WeakMap<V2State, Set<string>>()
function withdrawnSkillIds(s: V2State): Set<string> {
  let hit = withdrawnCache.get(s)
  if (!hit) {
    hit = new Set(s.skills.filter((k) => k.active === false || !isConfigured(k)).map((k) => k.id))
    withdrawnCache.set(s, hit)
  }
  return hit
}

/** True when a skill can appear in course mapping: it exists and is not deactivated [REQ SL-11]. */
export const isMappable = (k: Pick<Skill, "active">): boolean => k.active !== false

/**
 * Every skill with a level in an offering (including explicit "Not mapped"), with where the level came from. Deactivated skills
 * are skipped in both layers [REQ SL-11]; their stored rows stay untouched and return if the skill is reactivated.
 */
export function resolvedLevels(s: V2State, o: MappingOverlay, offering: CourseOffering): Map<string, ResolvedLevel> {
  const out = new Map<string, ResolvedLevel>()
  // Withdrawn from every layer: deactivated [REQ SL-11] or not configured [REQ IM-09]. Their rows stay and return when the skill does.
  const off = withdrawnSkillIds(s)
  for (const [id, level] of baseLevels(s).get(offering.courseId) ?? []) if (!off.has(id)) out.set(id, { level, source: "explicit" })
  // An edit back to the value underneath is no edit.
  for (const [id, raw] of Object.entries(o[offering.id] ?? {})) {
    const level = fromStored(raw)
    if (!off.has(id) && (out.get(id)?.level ?? "none") !== level) out.set(id, { level, source: "overlay" })
  }
  return out
}

/** The level of one skill in one offering: the offering's own edit, else the course mapping, else Not mapped. */
export function levelOf(s: V2State, o: MappingOverlay, offering: CourseOffering, skillId: string): MapLevel {
  return resolvedLevels(s, o, offering).get(skillId)?.level ?? "none"
}

/** Where the level of one skill in one offering came from, or null when it has none. */
export function levelSourceOf(s: V2State, o: MappingOverlay, offering: CourseOffering, skillId: string): LevelSource | null {
  return resolvedLevels(s, o, offering).get(skillId)?.source ?? null
}

/** Skill id -> level for every skill mapped (mandatory or recommended) in an offering. */
export function offeringLevels(s: V2State, o: MappingOverlay, offering: CourseOffering): Map<string, MapLevel> {
  const out = new Map<string, MapLevel>()
  for (const [k, v] of resolvedLevels(s, o, offering)) if (v.level !== "none") out.set(k, v.level)
  return out
}

/** The skills of the lists assigned to a cohort. None: a cohort with no list has none, with no fallback to the default list (D-L103). */
export function assignedIdsForCohort(lists: readonly SkillList[], cohort: string | undefined): Set<string> {
  return new Set((cohort ? listsForCohort(lists, cohort) : []).flatMap((l) => l.skillIds))
}

export function offeringRows(s: V2State, o: MappingOverlay = savedOverlay(s)): OfferingRow[] {
  const courses = new Map((s.courses ?? []).map((c) => [c.id, c]))
  const terms = new Map((s.terms ?? []).map((t) => [t.id, t]))
  const cohorts = new Map((s.cohorts ?? []).map((c) => [c.id, c]))
  const currentStart = (s.terms ?? []).find((t) => t.current)?.start ?? ""
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
      current: !!t.current,
      past: t.start < currentStart,
      haystack: `${c.code} ${c.name} ${t.name} ${ay} ${coh.name} year ${py}`.toLowerCase(),
    })
  }
  const startOf = (id: string) => terms.get(id)?.start ?? ""
  return rows.sort((a, b) => a.code.localeCompare(b.code) || startOf(a.termId).localeCompare(startOf(b.termId)))
}

export interface OfferingFilter {
  q: string
  term: string
  cohort: string
  year: string
  /** Academic year, "2026-27" [REQ CM-02]. */
  academicYear?: string
  /** Include didactic offerings. Absent or false: clinical only, the default (CALL 10-26, pending the client). */
  didactic?: boolean
  /** Current and upcoming terms only: what the page opens on (D-L75). Only a term or an academic year reaches past offerings (map D8); a search does not. */
  upcoming?: boolean
}

/** The Term filter's value that also shows past offerings. */
export const ALL_TERMS = "all"
/** Past offerings stay out only while nothing asks for them. */
const skipsPast = (f: Pick<OfferingFilter, "term" | "academicYear" | "upcoming">) => !!f.upcoming && !f.term && !f.academicYear

export const ANY = ""

/** Search and filters run on the whole set, never on the visible rows. Clinical offerings only unless didactic is included. */
export function filterOfferings(rows: readonly OfferingRow[], f: OfferingFilter): OfferingRow[] {
  const q = f.q.trim().toLowerCase()
  const noPast = skipsPast(f)
  return rows.filter((r) => (f.didactic || r.kind === "clinical") && !(noPast && r.past) && (!f.term || r.termId === f.term) && (!f.cohort || r.cohortId === f.cohort) && (!f.year || String(r.professionalYear) === f.year) && (!f.academicYear || r.academicYear === f.academicYear) && (!q || r.haystack.includes(q)))
}

/**
 * What an explicit link to an offering must change for that offering to be on the list beside it: only the filters that would hide it. Empty when none would.
 * A filter the admin sets clears the offering instead, so this only ever answers a link.
 */
export function paramsToReveal(r: OfferingRow, f: OfferingFilter): Partial<Record<"term" | "terms" | "cohort" | "year" | "ay" | "incl", string | null>> {
  const out: Partial<Record<"term" | "terms" | "cohort" | "year" | "ay" | "incl", string | null>> = {}
  if (f.term && r.termId !== f.term) out.term = null
  if (f.cohort && r.cohortId !== f.cohort) out.cohort = null
  if (f.year && String(r.professionalYear) !== f.year) out.year = null
  if (f.academicYear && r.academicYear !== f.academicYear) out.ay = null
  if (!f.didactic && r.kind !== "clinical") out.incl = "didactic"
  // Past offerings show only when something asks for them, and with the term and year above gone nothing would.
  if (r.past && f.upcoming && (!f.term || out.term === null) && (!f.academicYear || out.ay === null)) out.terms = ALL_TERMS
  return out
}

/** Offerings of a term, clinical only unless didactic is included: the set every course picker on the mapping screens starts from. */
function termOfferings(s: V2State, termId: string, didactic: boolean): CourseOffering[] {
  const skip = didactic ? null : new Set((s.courses ?? []).filter((c) => c.kind === "didactic").map((c) => c.id))
  return (s.offerings ?? []).filter((x) => (!termId || x.termId === termId) && !skip?.has(x.courseId))
}

export interface CoverageGridColumn { offeringId: string; code: string; cohort: string }
export interface CoverageGridRow extends Record<string, unknown> {
  id: string
  name: string
  section: string
  cells: Record<string, MapLevel>
  /** Courses of this term that mark it Mandatory or Recommended. */
  carriers: number
  mandatoryCarriers: number
}

/**
 * Every skill against every course of one term, with its level: where is this skill taught, and which skills have no course (D-L121, restoring the Coverage grid).
 * `skillIds` are the skills on the lists of the groups in view; `cohorts` narrows the columns to one group's cohorts. Skills with the most courses sort first, so the report opens on what is mapped; the Courses column sorts the other way. Neutral: mapping is an expectation only [REQ CM-05].
 */
export function coverageGrid(s: V2State, o: MappingOverlay, termId: string, skillIds: readonly string[], cohorts: ReadonlySet<string> | null, didactic = false): { columns: CoverageGridColumn[]; rows: CoverageGridRow[]; inNoCourse: number } {
  const courses = new Map((s.courses ?? []).map((c) => [c.id, c]))
  const cohortNames = new Map((s.cohorts ?? []).map((c) => [c.id, c.name]))
  const offs = termOfferings(s, termId, didactic).filter((x) => !cohorts || cohorts.has(cohortNames.get(x.cohortId) ?? ""))
  const columns = offs
    .map((x) => ({ offeringId: x.id, code: courses.get(x.courseId)?.code ?? x.courseId, cohort: cohortNames.get(x.cohortId) ?? "" }))
    .sort((a, b) => a.cohort.localeCompare(b.cohort) || a.code.localeCompare(b.code))
  const levels = new Map(offs.map((x) => [x.id, resolvedLevels(s, o, x)]))
  const rows: CoverageGridRow[] = []
  for (const id of new Set(skillIds)) {
    const k = s.skills.find((x) => x.id === id)
    if (!k || !isMappable(k)) continue
    const cells: Record<string, MapLevel> = {}
    let carriers = 0
    let mandatoryCarriers = 0
    for (const c of columns) {
      const lv = levels.get(c.offeringId)?.get(id)?.level ?? "none"
      cells[c.offeringId] = lv
      if (lv !== "none") carriers++
      if (lv === "mandatory") mandatoryCarriers++
    }
    rows.push({ id, name: k.name, section: sectionOf(k), cells, carriers, mandatoryCarriers })
  }
  rows.sort((a, b) => b.carriers - a.carriers || a.name.localeCompare(b.name))
  return { columns, rows, inNoCourse: rows.filter((r) => r.carriers === 0).length }
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
  /** On a list assigned to the offering's cohort (a cohort with no list has none, no fallback to the default list, D-L103). */
  required: boolean
  level: MapLevel
  /** Lower-case name and section for the search. */
  haystack: string
}

// One definition of Configured (lib/v2/population.ts, decision D-X31): a rule held but never saved for use stays a draft and
// cannot be mapped, even though the legacy v2 mapBlockReason (configured flag only) would let it through.
const isConfigured = (k: Skill) => isConfiguredSkill(k) && mapBlockReason(k) === null

export function skillRowsFor(s: V2State, o: MappingOverlay, offering: CourseOffering, lists: readonly SkillList[] = listsOf(s)): SkillMapRow[] {
  const req = assignedIdsForCohort(lists, (s.cohorts ?? []).find((c) => c.id === offering.cohortId)?.name)
  const res = resolvedLevels(s, o, offering)
  // Deactivated skills are withdrawn from mapping [REQ SL-11]: not listed, so they cannot be set or appear mapped.
  return s.skills
    .filter(isMappable)
    .map((k) => {
      const section = sectionOf(k)
      return { id: k.id, name: k.name, section, configured: isConfigured(k), required: req.has(k.id), level: res.get(k.id)?.level ?? "none", haystack: `${k.name} ${section}`.toLowerCase() }
    })
    // Stable order (a level change must not move the row under the cursor): configured first, then section and name.
    .sort((a, b) => Number(b.configured) - Number(a.configured) || a.section.localeCompare(b.section) || a.name.localeCompare(b.name))
}

export type SetLevelResult = { ok: true; overlay: MappingOverlay } | { ok: false; reason: string }

/** Unconfigured skills cannot be mapped [REQ IM-09]; setting one to "Not mapped" is always allowed. */
export function setLevel(s: V2State, o: MappingOverlay, offeringId: string, skillId: string, level: MapLevel): SetLevelResult {
  const skill = s.skills.find((k) => k.id === skillId)
  if (!skill) return { ok: false, reason: `This ${skillNoun()} is no longer in the library.` }
  if (!isMappable(skill)) return { ok: false, reason: `This ${skillNoun()} is inactive. Reactivate it in the library to map it.` }
  if (!offeringById(s, offeringId)) return { ok: false, reason: "This offering no longer exists." }
  if (level !== "none" && !isConfigured(skill)) return { ok: false, reason: `Configure this ${skillNoun()} before mapping it.` }
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

/** Required ids of the lists assigned to the cohorts of these offerings (a cohort with no list adds none, no fallback to the default list, D-L103). */
function cohortRequiredIds(s: V2State, lists: readonly SkillList[], offs: readonly CourseOffering[]): Set<string> {
  const names = new Map((s.cohorts ?? []).map((c) => [c.id, c.name]))
  const out = new Set<string>()
  const cohorts = new Set<string | undefined>(offs.map((x) => names.get(x.cohortId)))
  if (cohorts.size === 0) cohorts.add(undefined)
  for (const c of cohorts) for (const id of assignedIdsForCohort(lists, c)) out.add(id)
  return out
}

// ---------------------------------------------------------------------------------------------------------------------
// Skill-centric view

export interface SkillReachRow extends Record<string, unknown> {
  /** Distinct courses (one per cohort) the skill is in (`isPlaced`). `carriers` counts offerings. */
  courses: number
  mandatoryCourses: number
  id: string
  name: string
  section: string
  configured: boolean
  required: boolean
  /** Offerings that map it. */
  carriers: number
  mandatoryCarriers: number
  haystack: string
}

/**
 * Every skill with how many of the term's offerings carry it, by name. Clinical offerings only unless `didactic`.
 * `termId` "" counts every term's offerings: the skill-first view reads one skill across the program [CALL 11-02].
 */
/**
 * The one definition of "in a course": an offering marks the skill mandatory or recommended. The mapped count, "In no course", the
 * library's course count and Delete's list all read this.
 */
export const isPlaced = (level: MapLevel | undefined | null): boolean => level === "mandatory" || level === "recommended"

/** The courses a skill is in, one per course and cohort: the ones Delete says it leaves, the same set `skillReach` counts. */
export function skillCourseLabels(s: V2State, o: MappingOverlay, skillId: string, didactic = false): string[] {
  const out = new Set<string>()
  for (const off of termOfferings(s, "", didactic)) {
    const r = resolvedLevels(s, o, off).get(skillId)
    if (!isPlaced(r?.level)) continue
    const course = (s.courses ?? []).find((c) => c.id === off.courseId)
    const cohort = (s.cohorts ?? []).find((c) => c.id === off.cohortId)
    out.add([course ? `${course.code} ${course.name}` : off.courseId, cohort?.name].filter(Boolean).join(", "))
  }
  return [...out].sort()
}

/**
 * Configured and in no course: what "In no course" lists with no student group chosen, and exactly the skills whose row reads No courses [REQ CM-05: information, never a defect].
 * On a list or not: a skill on no list is still in no course. A student group's own figure is a separate count, of its assigned skills and its cohorts' courses (setup-result.ts, D-L103).
 */
export function noCourseIds(s: V2State, o: MappingOverlay, lists: readonly SkillList[] = listsOf(s), didactic = false): Set<string> {
  return new Set(skillReach(s, o, "", lists, didactic).filter((r) => r.configured && r.courses === 0).map((r) => r.id))
}

export function skillReach(s: V2State, o: MappingOverlay, termId: string, lists: readonly SkillList[] = listsOf(s), didactic = false): SkillReachRow[] {
  const offs = termOfferings(s, termId, didactic)
  const req = cohortRequiredIds(s, lists, offs)
  const levels = offs.map((x) => resolvedLevels(s, o, x))
  return s.skills
    .filter(isMappable)
    .map((k) => {
      let carriers = 0
      let mandatoryCarriers = 0
      const courses = new Set<string>()
      const mandatoryCourses = new Set<string>()
      levels.forEach((lv, i) => {
        const r = lv.get(k.id)
        const v = r && r.level !== "none" ? r.level : undefined
        if (v) carriers++
        if (isPlaced(v)) courses.add(`${offs[i]!.courseId}|${offs[i]!.cohortId}`)
        if (v === "mandatory") {
          mandatoryCarriers++
          mandatoryCourses.add(`${offs[i]!.courseId}|${offs[i]!.cohortId}`)
        }
      })
      const section = sectionOf(k)
      return { id: k.id, name: k.name, section, configured: isConfigured(k), required: req.has(k.id), carriers, courses: courses.size, mandatoryCourses: mandatoryCourses.size, mandatoryCarriers, haystack: `${k.name} ${section}`.toLowerCase() }
    })
    // By name; the "In no course" filter narrows to the rest.
    .sort((a, b) => a.name.localeCompare(b.name))
}

export interface SkillOfferingRow extends Record<string, unknown> {
  id: string
  code: string
  name: string
  cohortId: string
  cohort: string
  academicYear: string
  professionalYear: number
  kind: "clinical" | "didactic"
  termId: string
  term: string
  level: MapLevel
  /** The offering's own totals, all skills, so the skill-first view also shows mapped and mandatory per offering [REQ CM-04]. */
  mapped: number
  mandatory: number
  current: boolean
  past: boolean
  /** Same text the offering search matches in variant A (code, name, term, academic year, cohort, "year n") [REQ CM-02]. */
  haystack: string
}

/**
 * The term's offerings with this skill's level in each (edit per offering; levels may differ, CM-06). Clinical only unless `didactic`.
 * `termId` "" returns the offerings of every term.
 */
export function offeringsForSkill(s: V2State, o: MappingOverlay, skillId: string, termId: string, didactic = false): SkillOfferingRow[] {
  return offeringRows(s, o)
    .filter((r) => (!termId || r.termId === termId) && (didactic || r.kind === "clinical"))
    .map((r) => {
      const off = offeringById(s, r.id)!
      const level = resolvedLevels(s, o, off).get(skillId)?.level ?? "none"
      return { id: r.id, code: r.code, name: r.name, cohortId: r.cohortId, cohort: r.cohort, academicYear: r.academicYear, professionalYear: r.professionalYear, kind: r.kind, termId: r.termId, term: r.term, level, mapped: r.mapped, mandatory: r.mandatory, current: r.current, past: r.past, haystack: r.haystack }
    })
}

/** Mapped rows first, so what a program decided is found first. */
export const levelRank = (level: MapLevel | null): number => (level === "mandatory" ? 0 : level === "recommended" ? 1 : 2)

/** Search, cohort, term, academic year and professional year over one skill's offerings, the same rules as filterOfferings [REQ CM-02]. */
export function filterSkillOfferings(rows: readonly SkillOfferingRow[], f: { q: string; cohort: string; year: string; term?: string; academicYear?: string; upcoming?: boolean; /** Offerings of these cohorts only: a student group arriving from Coverage. */ cohorts?: ReadonlySet<string> | null }): SkillOfferingRow[] {
  const q = f.q.trim().toLowerCase()
  const noPast = skipsPast({ term: f.term ?? "", academicYear: f.academicYear, upcoming: f.upcoming })
  return rows.filter((r) => !(noPast && r.past) && (!f.cohorts || f.cohorts.has(r.cohort)) && (!f.term || r.termId === f.term) && (!f.cohort || r.cohortId === f.cohort) && (!f.year || String(r.professionalYear) === f.year) && (!f.academicYear || r.academicYear === f.academicYear) && (!q || r.haystack.includes(q)))
}

/** One skill set to one level in the offerings the admin selected; each gets its own entry, nothing else changes [CM-06, CM-08]. */
export function setLevelAcross(s: V2State, o: MappingOverlay, offeringIds: readonly string[], skillId: string, level: MapLevel): { overlay: MappingOverlay; changed: number; skipped: number; reason?: string } {
  let overlay = o
  let changed = 0
  let skipped = 0
  let reason: string | undefined
  for (const id of offeringIds) {
    const r = setLevel(s, overlay, id, skillId, level)
    if (r.ok) {
      overlay = r.overlay
      changed++
    } else {
      skipped++
      reason ??= r.reason
    }
  }
  return { overlay, changed, skipped, reason }
}

// ---------------------------------------------------------------------------------------------------------------------
// Saving a draft

export interface LevelChange {
  offeringId: string
  skillId: string
  level: MapLevel
}

/** One unsaved level, for the row's changed mark. */
export const changeKey = (offeringId: string, skillId: string): string => `${offeringId}|${skillId}`

/** What saving `draft` would change, compared with `saved`: only values that really differ, so changing a level and changing it back is nothing. */
export function overlayChanges(s: V2State, saved: MappingOverlay, draft: MappingOverlay): LevelChange[] {
  const out: LevelChange[] = []
  for (const [offeringId, per] of Object.entries(draft)) {
    if (per === saved[offeringId]) continue
    const off = offeringById(s, offeringId)
    if (!off) continue
    for (const [skillId, level] of Object.entries(per)) if (levelOf(s, saved, off, skillId) !== level) out.push({ offeringId, skillId, level })
  }
  return out
}

/** The overlay with every no-op entry gone (an edit back to the value underneath), so the store holds real edits only. */
export function tidyOverlay(s: V2State, o: MappingOverlay): MappingOverlay {
  const out: MappingOverlay = {}
  for (const [offeringId, per] of Object.entries(o)) {
    const off = offeringById(s, offeringId)
    if (!off) continue
    const under = resolvedLevels(s, EMPTY_MAPPING_OVERLAY, off)
    const kept = Object.entries(per).filter(([skillId, level]) => (under.get(skillId)?.level ?? "none") !== level)
    if (kept.length) out[offeringId] = Object.fromEntries(kept)
  }
  return out
}

/** "Blood pressure saved on 1 offering." */
export function savedLevelsLine(s: V2State, changes: readonly LevelChange[]): string {
  const skills = new Set(changes.map((c) => c.skillId))
  const offerings = new Set(changes.map((c) => c.offeringId)).size
  const where = `${offerings} ${offerings === 1 ? "offering" : "offerings"}`
  if (skills.size === 1) return `${s.skills.find((k) => k.id === changes[0]!.skillId)?.name ?? capitalizeNoun()} saved on ${where}.`
  return `${skills.size} ${skillNounPluralOf()} saved on ${where}.`
}

/** "Blood pressure: Mandatory in NUR 220, Fall 2026. Not saved yet." One change is named; several are counted. */
export function pendingLevelsLine(s: V2State, changes: readonly LevelChange[], rows: readonly OfferingRow[]): string {
  if (changes.length !== 1) return `${changes.length} changes not saved yet.`
  const c = changes[0]!
  const r = rows.find((x) => x.id === c.offeringId)
  return `${s.skills.find((k) => k.id === c.skillId)?.name ?? capitalizeNoun()}: ${LEVEL_LABEL[c.level]} in ${r ? `${r.code}, ${r.term}` : "this offering"}. Not saved yet.`
}

// ---------------------------------------------------------------------------------------------------------------------
// Links

export const MAPPING_PATH = `${LAB_ADMIN}/course-mapping`

export type MappingParam = "variant" | "by" | "term" | "offering" | "skill" | "view" | "cohort" | "year" | "ay" | "terms" | "q" | "fq" | "oq" | "sq" | "lv" | "show" | "incl" | "sg" | "cat"

/**
 * Course mapping opens skill first (`by=skill`, the default with no `by`); `by=course` opens it course first. A link that names an
 * offering is about that course, so it says `by=course` on its own; a caller can still pass `by` explicitly.
 */
export function mappingLink(p: Partial<Record<MappingParam, string | undefined>>): string {
  const q = new URLSearchParams()
  const by = p.by ?? (p.offering ? "course" : undefined)
  if (by) q.set("by", by)
  for (const [k, v] of Object.entries(p)) if (v && k !== "by") q.set(k, v)
  const s = q.toString()
  return s ? `${MAPPING_PATH}?${s}` : MAPPING_PATH
}
