import { defaultConfig, SAMPLE_QUESTIONS } from "./config"
import library from "./hgtc-library.json"
import { COURSE_SEEDS as POOL_COURSES, HERO_SITES, HOSPITALS, HOSPITAL_UNITS, LABS, LONG_TERM_CARE, OUTPATIENT, type CourseSeed, type Facility } from "./pools"
import { prng } from "./seed-core"
import type { Cohort, Course, CourseOffering, MappingRow, Person, Site, Skill, SkillConfig, Term, Track } from "./types"

/**
 * Reference data for the generated cohort: the starter library (HGTC ADN checklist, names verbatim from the JSON), terms, cohorts, courses,
 * offerings and sites. Everything is derived from fixed lists and the fixed seed, so two calls return deeply equal results.
 * Sample data: names of courses, sites and towns come from lib/v2/pools.ts (fictional, decision D-X23); NUR course titles are [INFER].
 */

export const HGTC_SEED = 2026

export function hashStr(s: string): number {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619)
  return h >>> 0
}
/** One PRNG stream per entity family, so adding a student never reshuffles evaluators. */
export const stream = (name: string) => prng(HGTC_SEED ^ hashStr(name))

export type Rand = () => number
export const pick = <T,>(r: Rand, a: readonly T[]): T => a[Math.floor(r() * a.length)]
export function shuffle<T>(r: Rand, a: readonly T[]): T[] {
  const out = [...a]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}
export function cumulative(weights: number[]): number[] {
  let t = 0
  return weights.map((w) => (t += w))
}
/** Index drawn from a cumulative weight array. */
export function draw(cum: number[], r: Rand): number {
  const x = r() * cum[cum.length - 1]
  let lo = 0
  let hi = cum.length - 1
  while (lo < hi) {
    const mid = (lo + hi) >> 1
    if (cum[mid] > x) hi = mid
    else lo = mid + 1
  }
  return lo
}

// ---------------------------------------------------------------------------------------------------------------------
// The library

export interface HgtcRow {
  id: string
  name: string
  section: string
  group?: string
  groupRule?: "any"
  required: boolean
  modelHint: "demonstration" | "question" | "scored"
  setting: "lab" | "either" | "clinical"
  courseHints: string[]
}
export const HGTC: HgtcRow[] = library as HgtcRow[]

/** HGTC rows the hand-written hero skills already cover. The hero skill keeps its id and name; it only gains the link. */
export const TWIN: Record<string, string> = {
  "hgtc-medications-01": "sk-med-admin",
  "hgtc-safety-22": "sk-sterile-dressing",
  "hgtc-nutrition-03": "sk-blood-glucose",
  "hgtc-nutrition-07": "sk-ng-tube",
  "hgtc-nutrition-15": "sk-iv-cath",
  "hgtc-nutrition-22": "sk-central-line",
  "hgtc-elimination-08": "sk-urinary-cath",
}
export const TWIN_HGTC: Record<string, string> = Object.fromEntries(Object.entries(TWIN).map(([h, s]) => [s, h]))

/** The twelve rare optional rows the program has not configured yet. */
export const UNCONFIGURED = new Set([
  "hgtc-oxygenation-18",
  "hgtc-oxygenation-17",
  "hgtc-oxygenation-12",
  "hgtc-nutrition-10",
  "hgtc-oxygenation-05",
  "hgtc-safety-14",
  "hgtc-mobility-12",
  "hgtc-nutrition-23",
  "hgtc-nutrition-24",
  "hgtc-nutrition-25",
  "hgtc-oxygenation-13",
  "hgtc-emotional-cognitive-10",
])

const BINARY = /^(height|weight|hand washing)$/i
const DISTINCT2 = new Set(["hgtc-basic-skills-10", "hgtc-basic-skills-11"])
const APPROVAL = /sterile gloving|^insertion$|irrigation|^straight cath|^catheter care$/i

export const skillIdOf = (h: HgtcRow) => TWIN[h.id] ?? h.id
export const isIvLevel = (h: HgtcRow) => h.group === "IV Therapy" && h.required
export const isPulse2 = (h: HgtcRow) => h.group === "Pulse" && /apical|peripheral/i.test(h.name)

function configFor(h: HgtcRow, model: Skill["model"]): SkillConfig {
  const c = defaultConfig(model)
  if (model === "question" || model === "scored") c.questions = [...SAMPLE_QUESTIONS]
  // Dataset rule mix: most rows need one Met; vitals-style rows need two different evaluators; IV therapy rows have a minimum level.
  c.achievement = { kind: "count", need: 1, minLevelIndex: null, distinctEvaluators: 1, settingMinimums: [] }
  if (DISTINCT2.has(h.id) || isPulse2(h)) c.achievement = { ...c.achievement, need: 2, distinctEvaluators: 2 }
  if (isIvLevel(h) && model === "demonstration") c.achievement = { ...c.achievement, minLevelIndex: 1 }
  if (h.setting === "clinical") c.achievement = { ...c.achievement, settingMinimums: [{ setting: "Inpatient", min: 1 }] }
  if (APPROVAL.test(h.name)) c.approvalRequired = true
  return c
}

/** Skills for the HGTC list that the hero library does not already hold (147). Hero twins are linked by the caller. */
export function buildHgtcSkills(): Skill[] {
  const out: Skill[] = []
  for (const h of HGTC) {
    if (TWIN[h.id]) continue
    const configured = !UNCONFIGURED.has(h.id)
    const model: Skill["model"] = !configured ? null : BINARY.test(h.name) ? "binary" : h.modelHint
    out.push({
      id: h.id,
      specialty: "adn-hgtc",
      name: h.name,
      category: h.group ?? h.section,
      model,
      configured,
      published: configured,
      config: configured ? configFor(h, model) : null,
      hgtc: { id: h.id, required: h.required, ...(h.group ? { group: h.group } : {}), ...(h.groupRule ? { groupRule: h.groupRule } : {}) },
    })
  }
  return out
}

// ---------------------------------------------------------------------------------------------------------------------
// Terms, cohorts, tracks

export const TERMS: Term[] = [
  { id: "trm-fa25", name: "Fall 2025", start: "2025-08-25", end: "2025-12-12" },
  { id: "trm-sp26", name: "Spring 2026", start: "2026-01-12", end: "2026-05-01" },
  { id: "trm-su26", name: "Summer 2026", start: "2026-05-18", end: "2026-08-07" },
  { id: "trm-fa26", name: "Fall 2026", start: "2026-08-24", end: "2026-12-11", current: true },
  { id: "trm-sp27", name: "Spring 2027", start: "2027-01-11", end: "2027-04-30" },
]
export const CURRENT_TERM = "trm-fa26"

/** Professional years in the program (year 1 to 4). */
export const PROFESSIONAL_YEARS = 4

/** Academic year of a term: a term starting August or later opens the year ("2026-27"). */
export function academicYearOf(term: Pick<Term, "start">): string {
  const y = Number(term.start.slice(0, 4))
  const first = Number(term.start.slice(5, 7)) >= 8 ? y : y - 1
  return `${first}-${String((first + 1) % 100).padStart(2, "0")}`
}

/**
 * Professional year of a cohort in an academic year (decision D-X19: a field in the data, not computed in screens). A cohort is
 * in its final year the academic year after its graduation label, as the seed runs offerings for the 2026 cohort in 2026-27
 * [INFER]. Clamped to 1..PROFESSIONAL_YEARS. Same arithmetic as lib/lab/mapping.ts professionalYear.
 */
export function professionalYearOf(graduates: string, academicYear: string): number {
  const end = Number(academicYear.slice(0, 4)) + 1
  return Math.min(PROFESSIONAL_YEARS, Math.max(1, PROFESSIONAL_YEARS - (Number(graduates) - end) - 1))
}

const CURRENT_AY = academicYearOf(TERMS.find((t) => t.current)!)

export const COHORTS: Cohort[] = [
  { id: "coh-2026", name: "BSN 2026", graduates: "2026", studentCount: 38 },
  { id: "coh-2027", name: "BSN 2027", graduates: "2027", studentCount: 43 },
  { id: "coh-2028", name: "BSN 2028", graduates: "2028", studentCount: 42 },
].map((c) => ({ ...c, professionalYear: professionalYearOf(c.graduates, CURRENT_AY) }))
export const TRACKS: Track[] = [{ id: "trk-accelerated", name: "Accelerated track" }]

/** Terms each cohort has been enrolled in, oldest first. */
export const ENROLLED: Record<string, string[]> = {
  "coh-2026": ["trm-fa25", "trm-sp26", "trm-su26", "trm-fa26"],
  "coh-2027": ["trm-sp26", "trm-su26", "trm-fa26"],
  "coh-2028": ["trm-su26", "trm-fa26"],
}

// ---------------------------------------------------------------------------------------------------------------------
// Courses and offerings

/** 22 courses: 9 clinical or lab bearing and 13 didactic or co-requisite. Codes and titles live in the pools (lib/v2/pools.ts). */
const COURSE_SEEDS: CourseSeed[] = POOL_COURSES
const COHORT_OF_LEVEL: Record<number, string> = { 1: "coh-2028", 2: "coh-2027", 3: "coh-2026" }
const LEGACY_ID = new Map(COURSE_SEEDS.filter((c) => c[4]).map((c) => [c[0], c[4]!]))
/** Course id from its code. A renamed course keeps its first id (legacyId in the pool), so URLs and mappings stay valid. */
const courseId = (code: string) => LEGACY_ID.get(code) ?? (code === "NURS 350" ? "crs-nurs350" : code === "NURS 352" ? "crs-nurs352" : `crs-${code.toLowerCase().replace(/\s+/g, "")}`)

export const COURSE_LEVEL: Record<string, number> = Object.fromEntries(COURSE_SEEDS.map((c) => [courseId(c[0]), c[3]]))

/** All 22 courses. The two hand-written ones are passed in so their fields stay byte-identical. */
export function buildCourses(focus: Course, second: Course | undefined): Course[] {
  return COURSE_SEEDS.map(([code, name, kind, level]) => {
    const id = courseId(code)
    if (id === focus.id) return { ...focus, kind }
    if (second && id === second.id) return { ...second, kind }
    return { id, code, name, term: "Fall 2026", cohort: COHORTS.find((c) => c.id === COHORT_OF_LEVEL[level])!.name, clinicalSettings: kind === "clinical" ? ["Inpatient", "Outpatient"] : [], kind }
  })
}

/** Courses x terms = 110 offerings. The cohort is the one at that level; sample assumption [INFER]. */
export function buildOfferings(courses: Course[]): CourseOffering[] {
  const out: CourseOffering[] = []
  for (const c of courses)
    for (const t of TERMS) {
      const cohortId = COHORT_OF_LEVEL[COURSE_LEVEL[c.id]]
      const academicYear = academicYearOf(t)
      const graduates = COHORTS.find((x) => x.id === cohortId)?.graduates
      out.push({ id: `off-${c.id.slice(4)}-${t.id.slice(4)}`, courseId: c.id, termId: t.id, cohortId, academicYear, ...(graduates ? { professionalYear: professionalYearOf(graduates, academicYear) } : {}) })
    }
  return out
}

/** The clinical course a cohort is in during a term (first clinical course at its level). */
export function clinicalCourseFor(cohortId: string, courses: Course[]): string {
  const level = Number(Object.keys(COHORT_OF_LEVEL).find((l) => COHORT_OF_LEVEL[Number(l)] === cohortId))
  const hit = courses.filter((c) => c.kind === "clinical" && COURSE_LEVEL[c.id] === level)
  return (cohortId === "coh-2027" ? hit.find((c) => c.id === "crs-nurs350") : hit[0])?.id ?? courses[0].id
}

/** Required rows deliberately left unmapped everywhere: the "required with no likely course" nudge has rows to show. */
export const UNMAPPED_REQUIRED = new Set([
  "hgtc-basic-skills-17",
  "hgtc-basic-skills-18",
  "hgtc-basic-skills-19",
  "hgtc-teaching-learning-principles-03",
  "hgtc-teaching-learning-principles-04",
  "hgtc-mobility-08",
])

/** Mapping rows for the 21 courses other than the focus course, 18 to 60 skills each. A required row is mandatory in the first course that expects it. */
export function buildMappings(courses: Course[], focusId: string): MappingRow[] {
  const out: MappingRow[] = []
  const rows = HGTC.filter((h) => !UNMAPPED_REQUIRED.has(h.id) && !UNCONFIGURED.has(h.id))
  const firstCourse = new Map<string, string>()
  const byLevel = [...courses].sort((a, b) => COURSE_LEVEL[a.id] - COURSE_LEVEL[b.id] || a.code.localeCompare(b.code))
  for (const c of byLevel) {
    if (c.kind !== "clinical") continue
    for (const h of rows) if (c.code !== "NURS 350" && c.code !== "NURS 352" && (h.courseHints.includes(c.code) || (h.courseHints.includes("All NUR") && c.code === "NUR 101")) && !firstCourse.has(h.id)) firstCourse.set(h.id, c.id)
  }
  const level = (h: HgtcRow, id: string): MappingRow["level"] => (h.required && firstCourse.get(h.id) === id ? "mandatory" : "optional")
  let didactic = 0
  for (const c of courses) {
    if (c.id === focusId) continue
    let pickRows: HgtcRow[]
    if (c.kind === "clinical") {
      const hinted = rows.filter((h) => h.courseHints.includes(c.code) || (h.courseHints.includes("All NUR") && c.code === "NUR 101"))
      pickRows = hinted
      if (pickRows.length < 18) {
        const have = new Set(pickRows.map((h) => h.id))
        const fill = rows.filter((h) => !have.has(h.id) && (c.code === "NURS 352" ? h.setting !== "clinical" : true) && h.courseHints.some((x) => COURSE_LEVEL[courseId(x)] === COURSE_LEVEL[c.id]))
        pickRows = [...pickRows, ...fill].slice(0, Math.max(18, pickRows.length))
        if (pickRows.length < 18) pickRows = [...pickRows, ...rows.filter((h) => !pickRows.includes(h)).slice(0, 18 - pickRows.length)]
      }
      pickRows = pickRows.slice(0, 60)
    } else {
      const q = rows.filter((h) => h.modelHint !== "demonstration")
      pickRows = Array.from({ length: 18 + (didactic % 5) * 2 }, (_, i) => q[(didactic * 7 + i) % q.length])
      didactic++
    }
    for (const h of [...new Map(pickRows.map((x) => [x.id, x])).values()]) {
      if (UNCONFIGURED.has(h.id)) continue
      out.push({ courseId: c.id, skillId: skillIdOf(h), level: c.kind === "clinical" ? level(h, c.id) : "optional" })
    }
  }
  return out
}

/**
 * Three per-course levels [CALL 10-26]: the old non-mandatory rows split into recommended and optional by position, never by the
 * PRNG (no stream shift): within each course, the 1st, 3rd, 5th... non-mandatory row in mapping order is recommended, the rest
 * optional. Mandatory and not-expected rows are untouched, so every "Required this term" figure stays the same.
 */
export function splitNonMandatory(rows: readonly MappingRow[]): MappingRow[] {
  const seen = new Map<string, number>()
  return rows.map((m) => {
    if (m.level !== "optional") return m
    const k = seen.get(m.courseId) ?? 0
    seen.set(m.courseId, k + 1)
    return k % 2 === 0 ? { ...m, level: "recommended" as const } : m
  })
}

/** Enrollment categories a program can file students under (sample data). Custom group rules filter on these. */
export const ENROLLMENT_CATEGORIES = ["Day", "Hybrid"] as const

/**
 * Student fields custom groups filter on (sample data, position-based, no PRNG): each cohort enrolled the year its first term
 * starts (ENROLLED); every 7th student in a cohort, by position, re-entered from the year before (a non-lockstep student); every 4th
 * student is in the Hybrid category, the rest Day. Graduation year is the cohort's own.
 */
export function withEnrollment(people: readonly Person[]): Person[] {
  const nth = new Map<string, number>()
  const firstYear = (cohortId: string) => {
    const t = TERMS.find((x) => x.id === ENROLLED[cohortId]?.[0])
    return t ? Number(t.start.slice(0, 4)) : undefined
  }
  return people.map((p) => {
    if (p.kind !== "student" || !p.cohortId) return p
    const i = nth.get(p.cohortId) ?? 0
    nth.set(p.cohortId, i + 1)
    const y = firstYear(p.cohortId)
    return { ...p, ...(y ? { enrollmentYear: i % 7 === 6 ? y - 1 : y } : {}), enrollmentCategory: ENROLLMENT_CATEGORIES[i % 4 === 3 ? 1 : 0] }
  })
}

// ---------------------------------------------------------------------------------------------------------------------
// Sites

const SETTING_COUNTS: Array<[string, number]> = [
  ["Inpatient med-surg", 40],
  ["Emergency", 12],
  ["Outpatient", 30],
  ["Long-term care", 16],
  ["Maternal-child", 12],
  ["Skills and Simulation Lab", 10],
]
export const STALLED_SITE = "site-087"
export const STALE_SITES = ["site-023", "site-056"]

const CLINICAL_OF: Record<string, string | null> = {
  "Inpatient med-surg": "Inpatient",
  Emergency: "Emergency",
  Outpatient: "Outpatient",
  "Long-term care": "Inpatient",
  "Maternal-child": "Inpatient",
  "Skills and Simulation Lab": null,
}

export interface SiteBuild {
  sites: Site[]
  /** Active clinical sites that have preceptors, heaviest placement weight first. */
  active: Site[]
  labSites: Site[]
}

/** Site ids of the hand-written layer's places, by location string (filled by buildSites). */
export function heroSiteIds(sites: Site[]): Record<string, string> {
  const want = new Set([...HERO_SITES.inpatient.map((x) => x.location), HERO_SITES.emergency.location, HERO_SITES.outpatient.location])
  return Object.fromEntries(sites.filter((x) => want.has(x.location)).map((x) => [x.location, x.id]))
}

/** 120 sites in 6 settings; 40 have active preceptors (34 clinical, 6 lab). site-087 is a clinical site with preceptors. */
export function buildSites(): SiteBuild {
  const r = stream("sites")
  const settings = shuffle(r, SETTING_COUNTS.flatMap(([name, n]) => Array.from({ length: n }, () => name)))
  settings[86] = "Inpatient med-surg"
  settings[22] = "Inpatient med-surg"
  settings[55] = "Outpatient"
  const ids = settings.map((_, i) => `site-${String(i + 1).padStart(3, "0")}`)
  const clinicalIdx = settings.map((s, i) => (s === "Skills and Simulation Lab" ? -1 : i)).filter((i) => i >= 0)
  const forced = [86, 22, 55]
  const rest = shuffle(r, clinicalIdx.filter((i) => !forced.includes(i))).slice(0, 31)
  const activeIdx = new Set([...forced, ...rest])
  const labIdx = shuffle(r, settings.map((s, i) => (s === "Skills and Simulation Lab" ? i : -1)).filter((i) => i >= 0)).slice(0, 6)
  const withPrec = new Set([...activeIdx, ...labIdx])
  // Placement weight order: site-087 and the two stale sites sit in the middle of the pack so the stalled-site story is not just "the biggest site".
  const order = shuffle(r, [...activeIdx])
  // Names (lib/v2/pools.ts): positional, after every draw above, so naming moves no stream. Hospitals host the inpatient,
  // emergency and maternal-child units (hospital x unit pairs taken diagonally, never repeated); clinics, long-term care and
  // labs are their own facilities. A facility unit is one site; its location is "Facility, Unit".
  const seen: Record<string, number> = {}
  const flat = (list: Array<[Facility, string[]]>) => {
    const out: Array<[Facility, string]> = []
    const most = Math.max(...list.map(([, u]) => u.length))
    for (let k = 0; k < most; k++) for (const [f, units] of list) if (units[k]) out.push([f, units[k]])
    return out
  }
  const OUT = flat(OUTPATIENT)
  const LTC = flat(LONG_TERM_CARE)
  const nameFor = (setting: string): { facility: Facility; unit: string; location?: string } => {
    const j = seen[setting] ?? 0
    seen[setting] = j + 1
    if (HOSPITAL_UNITS[setting]) {
      const units = HOSPITAL_UNITS[setting]
      const shift = setting === "Maternal-child" ? 6 : setting === "Emergency" ? 3 : 0
      const h = (j + shift) % HOSPITALS.length
      return { facility: HOSPITALS[h], unit: units[(h + Math.floor(j / HOSPITALS.length)) % units.length] }
    }
    if (setting === "Outpatient") return { facility: OUT[j % OUT.length][0], unit: OUT[j % OUT.length][1] }
    if (setting === "Long-term care") return { facility: LTC[j % LTC.length][0], unit: LTC[j % LTC.length][1] }
    const lab = LABS[j % LABS.length]
    return { facility: lab.facility, unit: lab.unit, location: lab.location }
  }
  const sites: Site[] = settings.map((setting, i) => {
    const n = nameFor(setting)
    return {
      id: ids[i],
      facility: n.facility.name,
      unit: n.unit,
      setting,
      clinicalSetting: CLINICAL_OF[setting],
      location: n.location ?? `${n.facility.name}, ${n.unit}`,
      active: true,
      hasPreceptors: withPrec.has(i),
      city: n.facility.town,
      state: n.facility.state,
      facilityType: n.facility.type,
    }
  })
  // The hand-written layer's places become real site records (the busiest matching active sites, never a story site), so its
  // evaluations, placements and preceptors link by id while keeping their exact location strings.
  const story = new Set([STALLED_SITE, ...STALE_SITES])
  const pickActive = (setting: string, n: number) => order.map((i) => sites[i]).filter((x) => x.setting === setting && !story.has(x.id)).slice(0, n)
  const rename = (x: Site | undefined, f: Facility, unit: string, location: string) => {
    if (x) Object.assign(x, { facility: f.name, unit, location, city: f.town, state: f.state, facilityType: f.type })
  }
  pickActive("Inpatient med-surg", 2).forEach((x, k) => rename(x, HERO_SITES.facility, HERO_SITES.inpatient[k].unit, HERO_SITES.inpatient[k].location))
  rename(pickActive("Emergency", 1)[0], HERO_SITES.facility, HERO_SITES.emergency.unit, HERO_SITES.emergency.location)
  rename(pickActive("Outpatient", 1)[0], HERO_SITES.outpatient.facility, HERO_SITES.outpatient.unit, HERO_SITES.outpatient.location)
  return { sites, active: order.map((i) => sites[i]), labSites: labIdx.map((i) => sites[i]) }
}
