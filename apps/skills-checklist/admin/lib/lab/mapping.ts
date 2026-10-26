/**
 * Course mapping (build prompt admcourse). Pure functions over V2State; the store is never written.
 *
 * REQ: an offering is a course in a term, academic year, professional year, with its cohorts [REQ CM-01]; offerings are found by search,
 * cohort, term, academic year and professional year [CM-02]; a mapped skill is mandatory or non-mandatory for that offering [CM-03] and
 * the level may differ between offerings of the same skill [CM-06]; each offering shows mapped and mandatory counts [CM-04]. Mapping is
 * expectation, not eligibility [CM-05]: a student may submit any skill and the evidence counts on the one record per skill [CM-07].
 * Unconfigured skills cannot be mapped [IM-09]. Carry-forward between terms is open (OD-01): an edit applies to one offering only.
 *
 * Three layers decide a skill's level in one offering (decision D-X27, CALL 10-26 "define the skills once, tag them to a cohort"):
 * 1. From list (base): every skill on a live list assigned to the offering's cohort is available in each CLINICAL offering of that
 *    cohort, at the list's own level for it (SkillList.levels) or Optional. Didactic offerings inherit nothing. Unconfigured and
 *    deactivated skills never inherit (IM-09, D-X14).
 * 2. Explicit: the v2 store's per-course mapping rows (MappingRow.courseId), the seeded data. A row (even "not expected") replaces
 *    the list level for that skill. Mandatory only ever comes from here or from a list that marks a skill mandatory.
 * 3. Overlay: this session's per-offering edits (`MappingOverlay`, offering id -> skill id -> level). They win.
 * Each resolved level carries its source ("explicit" | "list" | "overlay") so the screen can say "from list".
 * The v2 figures (facts.ts, "Required this term") read the explicit layer only and are unchanged by inheritance: a list gives
 * Optional unless it marks a level, and the seeded lists mark none.
 *
 * Coverage [BUILD-PROMPT admcourse, N-13]: the required skills of the default list against the term's offerings; a required skill that
 * no offering carries is "in no course".
 */
import type { CourseOffering, MappingLevel, Skill, V2State } from "@/lib/v2/types"
import { mapBlockReason } from "@/lib/v2/coverage"
import { MAPPING_LEVEL_LABEL } from "@/lib/v2/labels"
import { sectionOf, LAB_ADMIN } from "./library"
import { defaultList, listsForCohort, seedLists, type ListLevel, type SkillList } from "./lists"
import { skillNoun } from "./terms"

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
  /** Of the mapped skills, how many take their level from a list assigned to the cohort (inherited, not set for the course). */
  fromList: number
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

/** Course id -> skill id -> level, from the v2 mapping rows (the explicit layer). */
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

const seedListCache = new WeakMap<V2State, SkillList[]>()
/** The seeded lists, built once per state: the default when a caller passes no lists. Read only here. */
function listsOf(s: V2State): SkillList[] {
  let hit = seedListCache.get(s)
  if (!hit) {
    hit = seedLists(s)
    seedListCache.set(s, hit)
  }
  return hit
}

export function offeringById(s: V2State, id: string | null | undefined): CourseOffering | undefined {
  return id ? (s.offerings ?? []).find((o) => o.id === id) : undefined
}

/** Where a level came from: the cohort's list (inherited), the course mapping, or this session's edit for the offering. */
export type LevelSource = "list" | "explicit" | "overlay"
export const LEVEL_SOURCE_LABEL: Record<LevelSource, string> = { list: "From list", explicit: "Set for this course", overlay: "Changed here" }

export interface ResolvedLevel {
  level: MapLevel
  source: LevelSource
  /** The list the level came from, for source "list". */
  listId?: string
}

const LIST_RANK: Record<ListLevel, number> = { mandatory: 0, recommended: 1, optional: 2 }

const listBaseCache = new WeakMap<readonly SkillList[], WeakMap<V2State, Map<string, Map<string, { level: ListLevel; listId: string }>>>>()

/** True for a clinical offering (didactic offerings inherit nothing from lists, CALL 10-26). */
export function isClinicalOffering(s: V2State, offering: CourseOffering): boolean {
  return ((s.courses ?? []).find((c) => c.id === offering.courseId)?.kind ?? "clinical") === "clinical"
}

/**
 * The base layer for one offering: skill id -> level inherited from the live lists assigned to its cohort. Clinical offerings only;
 * configured and active skills only; the strongest level wins when two lists carry the same skill.
 */
export function listBaseLevels(s: V2State, offering: CourseOffering, lists: readonly SkillList[] = listsOf(s)): Map<string, { level: ListLevel; listId: string }> {
  let byState = listBaseCache.get(lists)
  if (!byState) {
    byState = new WeakMap()
    listBaseCache.set(lists, byState)
  }
  let byOffering = byState.get(s)
  if (!byOffering) {
    byOffering = new Map()
    byState.set(s, byOffering)
  }
  const hit = byOffering.get(offering.id)
  if (hit) return hit
  const out = new Map<string, { level: ListLevel; listId: string }>()
  const cohort = (s.cohorts ?? []).find((c) => c.id === offering.cohortId)?.name
  if (cohort && isClinicalOffering(s, offering)) {
    const usable = new Set(s.skills.filter((k) => k.active !== false && isConfigured(k)).map((k) => k.id))
    for (const l of listsForCohort(lists, cohort)) {
      for (const id of l.skillIds) {
        if (!usable.has(id)) continue
        const level = l.levels?.[id] ?? "optional"
        const prev = out.get(id)
        if (!prev || LIST_RANK[level] < LIST_RANK[prev.level]) out.set(id, { level, listId: l.id })
      }
    }
  }
  byOffering.set(offering.id, out)
  return out
}

/** Every skill with a level in an offering (including explicit "Not mapped"), with where the level came from. */
export function resolvedLevels(s: V2State, o: MappingOverlay, offering: CourseOffering, lists: readonly SkillList[] = listsOf(s)): Map<string, ResolvedLevel> {
  const out = new Map<string, ResolvedLevel>()
  const explicit = baseLevels(s).get(offering.courseId)
  for (const [id, b] of listBaseLevels(s, offering, lists)) if (!explicit?.has(id)) out.set(id, { level: b.level, source: "list", listId: b.listId })
  for (const [id, level] of explicit ?? []) out.set(id, { level, source: "explicit" })
  for (const [id, level] of Object.entries(o[offering.id] ?? {})) out.set(id, { level, source: "overlay" })
  return out
}

/** The level of one skill in one offering: the offering's own edit, else the course mapping, else the cohort's lists. */
export function levelOf(s: V2State, o: MappingOverlay, offering: CourseOffering, skillId: string, lists: readonly SkillList[] = listsOf(s)): MapLevel {
  return resolvedLevels(s, o, offering, lists).get(skillId)?.level ?? "none"
}

/** Where the level of one skill in one offering came from, or null when it has none. */
export function levelSourceOf(s: V2State, o: MappingOverlay, offering: CourseOffering, skillId: string, lists: readonly SkillList[] = listsOf(s)): LevelSource | null {
  return resolvedLevels(s, o, offering, lists).get(skillId)?.source ?? null
}

/** Skill id -> level for every skill mapped (mandatory or non-mandatory) in an offering, all three layers applied. */
export function offeringLevels(s: V2State, o: MappingOverlay, offering: CourseOffering, lists: readonly SkillList[] = listsOf(s)): Map<string, MapLevel> {
  const out = new Map<string, MapLevel>()
  for (const [k, v] of resolvedLevels(s, o, offering, lists)) if (v.level !== "none") out.set(k, v.level)
  return out
}

/** Required-before-graduation skills of the lists assigned to a cohort (live), else of the default list. */
export function requiredIdsForCohort(lists: readonly SkillList[], cohort: string | undefined): Set<string> {
  const applied = cohort ? listsForCohort(lists, cohort) : []
  return new Set((applied.length ? applied : [defaultList(lists)].filter((l): l is SkillList => !!l)).flatMap((l) => l.requiredIds))
}

export function offeringRows(s: V2State, o: MappingOverlay = EMPTY_MAPPING_OVERLAY, lists: readonly SkillList[] = listsOf(s)): OfferingRow[] {
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
    const res = resolvedLevels(s, o, off, lists)
    const lv = offeringLevels(s, o, off, lists)
    let fromList = 0
    for (const v of res.values()) if (v.source === "list" && v.level !== "none") fromList++
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
      fromList,
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
  /** Required before graduation on a list assigned to the offering's cohort (the default list when none is assigned). */
  required: boolean
  level: MapLevel
  /** Where the level came from: "list" (inherited from a list assigned to the cohort), "explicit" (the course mapping) or "overlay". */
  source: LevelSource | null
  /** Lower-case name and section for the search. */
  haystack: string
}

const isConfigured = (k: Skill) => mapBlockReason(k) === null

export function skillRowsFor(s: V2State, o: MappingOverlay, offering: CourseOffering, lists: readonly SkillList[] = listsOf(s)): SkillMapRow[] {
  const req = requiredIdsForCohort(lists, (s.cohorts ?? []).find((c) => c.id === offering.cohortId)?.name)
  const res = resolvedLevels(s, o, offering, lists)
  return s.skills
    .map((k) => {
      const section = sectionOf(k)
      const r = res.get(k.id)
      const level = r?.level ?? "none"
      return { id: k.id, name: k.name, section, configured: isConfigured(k), required: req.has(k.id), level, source: level === "none" ? null : (r?.source ?? null), haystack: `${k.name} ${section}`.toLowerCase() }
    })
    // Stable order (a level change must not move the row under the cursor): configured first, then section and name.
    .sort((a, b) => Number(b.configured) - Number(a.configured) || a.section.localeCompare(b.section) || a.name.localeCompare(b.name))
}

export type SetLevelResult = { ok: true; overlay: MappingOverlay } | { ok: false; reason: string }

/** Unconfigured skills cannot be mapped [REQ IM-09]; setting one to "Not mapped" is always allowed. */
export function setLevel(s: V2State, o: MappingOverlay, offeringId: string, skillId: string, level: MapLevel): SetLevelResult {
  const skill = s.skills.find((k) => k.id === skillId)
  if (!skill) return { ok: false, reason: `This ${skillNoun()} is no longer in the library.` }
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

// ---------------------------------------------------------------------------------------------------------------------
// Coverage: required skills by the term's offerings

/** Required ids of the lists assigned to the cohorts of these offerings (the default list for a cohort with none). */
function cohortRequiredIds(s: V2State, lists: readonly SkillList[], offs: readonly CourseOffering[]): Set<string> {
  const names = new Map((s.cohorts ?? []).map((c) => [c.id, c.name]))
  const out = new Set<string>()
  const cohorts = new Set<string | undefined>(offs.map((x) => names.get(x.cohortId)))
  if (cohorts.size === 0) cohorts.add(undefined)
  for (const c of cohorts) for (const id of requiredIdsForCohort(lists, c)) out.add(id)
  return out
}

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
  /** Offerings that carry it at any level, inherited from a list included. */
  carriers: number
  mandatoryCarriers: number
  /** Offerings where the level was set for the course or changed here (not only inherited from a list). */
  explicitCarriers: number
}

export interface Coverage {
  termId: string
  columns: CoverageColumn[]
  rows: CoverageRow[]
  /** Required skills that no offering in the term carries at any level, inherited included (N-13), by name. */
  gaps: CoverageRow[]
  /** Required skills carried only through a list (no course set a level): available everywhere, chosen nowhere. */
  listOnly: CoverageRow[]
  required: number
}

/**
 * `only` narrows the columns to the offerings the toolbar shows (cohort, year, search); the counts then follow those columns.
 * Clinical offerings only unless `didactic` (the default course set, CALL 10-26).
 */
export function coverage(s: V2State, o: MappingOverlay, termId: string, lists: readonly SkillList[] = listsOf(s), only?: ReadonlySet<string>, didactic = false): Coverage {
  const offs = termOfferings(s, termId, didactic).filter((x) => !only || only.has(x.id))
  // Required skills of the lists assigned to the cohorts these offerings serve (each cohort's own lists, not only the default).
  const req = [...cohortRequiredIds(s, lists, offs)]
  const courses = new Map((s.courses ?? []).map((c) => [c.id, c]))
  const cohorts = new Map((s.cohorts ?? []).map((c) => [c.id, c]))
  const columns: CoverageColumn[] = offs
    .map((x) => ({ offeringId: x.id, courseId: x.courseId, code: courses.get(x.courseId)?.code ?? x.courseId, cohort: cohorts.get(x.cohortId)?.name ?? "" }))
    .sort((a, b) => a.cohort.localeCompare(b.cohort) || a.code.localeCompare(b.code))
  const levels = new Map(offs.map((x) => [x.id, resolvedLevels(s, o, x, lists)]))
  const rows: CoverageRow[] = []
  for (const id of req) {
    const k = s.skills.find((x) => x.id === id)
    if (!k) continue
    const cells: Record<string, MapLevel> = {}
    let carriers = 0
    let mandatoryCarriers = 0
    let explicitCarriers = 0
    for (const c of columns) {
      const r = levels.get(c.offeringId)?.get(id)
      const lv = r?.level ?? "none"
      cells[c.offeringId] = lv
      if (lv !== "none") carriers++
      if (lv !== "none" && r?.source !== "list") explicitCarriers++
      if (lv === "mandatory") mandatoryCarriers++
    }
    rows.push({ id, name: k.name, section: sectionOf(k), configured: isConfigured(k), cells, carriers, mandatoryCarriers, explicitCarriers })
  }
  rows.sort((a, b) => a.carriers - b.carriers || a.name.localeCompare(b.name))
  return { termId, columns, rows, gaps: rows.filter((r) => r.carriers === 0), listOnly: rows.filter((r) => r.carriers > 0 && r.explicitCarriers === 0), required: req.length }
}

// ---------------------------------------------------------------------------------------------------------------------
// Skill-centric view

export interface SkillReachRow extends Record<string, unknown> {
  id: string
  name: string
  section: string
  configured: boolean
  required: boolean
  /** Offerings that carry it at any level, inherited from a list included. */
  carriers: number
  mandatoryCarriers: number
  /** Offerings where the level was set for the course or changed here (not only inherited). */
  explicitCarriers: number
  haystack: string
}

/** Every skill with how many of the term's offerings carry it, by name. Clinical offerings only unless `didactic`. */
export function skillReach(s: V2State, o: MappingOverlay, termId: string, lists: readonly SkillList[] = listsOf(s), didactic = false): SkillReachRow[] {
  const offs = termOfferings(s, termId, didactic)
  const req = cohortRequiredIds(s, lists, offs)
  const levels = offs.map((x) => resolvedLevels(s, o, x, lists))
  return s.skills
    .map((k) => {
      let carriers = 0
      let mandatoryCarriers = 0
      let explicitCarriers = 0
      for (const lv of levels) {
        const r = lv.get(k.id)
        const v = r && r.level !== "none" ? r.level : undefined
        if (v) carriers++
        if (v && r?.source !== "list") explicitCarriers++
        if (v === "mandatory") mandatoryCarriers++
      }
      const section = sectionOf(k)
      return { id: k.id, name: k.name, section, configured: isConfigured(k), required: req.has(k.id), carriers, mandatoryCarriers, explicitCarriers, haystack: `${k.name} ${section}`.toLowerCase() }
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
  source: LevelSource | null
}

/** The term's offerings with this skill's level in each (edit per offering; levels may differ, CM-06). Clinical only unless `didactic`. */
export function offeringsForSkill(s: V2State, o: MappingOverlay, skillId: string, termId: string, didactic = false, lists: readonly SkillList[] = listsOf(s)): SkillOfferingRow[] {
  return offeringRows(s, o, lists)
    .filter((r) => r.termId === termId && (didactic || r.kind === "clinical"))
    .map((r) => {
      const off = offeringById(s, r.id)!
      const res = resolvedLevels(s, o, off, lists).get(skillId)
      const level = res?.level ?? "none"
      return { id: r.id, code: r.code, name: r.name, cohort: r.cohort, professionalYear: r.professionalYear, kind: r.kind, level, source: level === "none" ? null : (res?.source ?? null) }
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
