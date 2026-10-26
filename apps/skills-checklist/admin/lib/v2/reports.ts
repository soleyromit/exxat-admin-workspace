import { evalsOfStudentSkill } from "./evidence-index"
import { ALL, NO_FILTERS, SETTING_LABEL, TERM, cohortOf, groupOf, matchesEvidence, scoped, students, studentsIn, type ReportFilters } from "./filters"
import { DEFAULT_SCOPE, populationRows, populationTotals, type PopulationScope, type StudentRow } from "./population"
import { DEMO_TODAY } from "./seed-core"
import { skillProgress } from "./student"
import type { Evaluation, MappingRow, Person, Skill, V2State } from "./types"
import { verificationRows, type VerificationRow } from "./verification"

// Primitives live in ./filters (shared with the population and approvals modules); re-exported for existing imports.
export { ALL, NO_FILTERS, PACE_MARGIN, SETTING_LABEL, SMALL_NUMBERS, TERM, cohortOf, groupOf, scoped, students, studentsIn } from "./filters"
export type { ReportFilters } from "./filters"
import { SMALL_NUMBERS } from "./filters"

/**
 * Stage 5: cohort report data, computed from the shared store. Pure. Only counted evaluations are read (AE-01, AR-06); a confidential
 * concern is never read. Filters re-scope the evidence first and progress is then recalculated from what is left (RP-08).
 */


export interface AppliedFilter {
  key: keyof ReportFilters
  label: string
}

/** What is applied now, one entry per filter, so each can be removed on its own (RP-01). */
export function appliedFilters(f: ReportFilters): AppliedFilter[] {
  const out: AppliedFilter[] = []
  if (f.cohort !== ALL) out.push({ key: "cohort", label: `Cohort: ${f.cohort}` })
  if (f.group !== ALL) out.push({ key: "group", label: `Group: ${f.group}` })
  if (f.course !== ALL) out.push({ key: "course", label: `Clinical course: ${f.course}` })
  if (f.category !== ALL) out.push({ key: "category", label: `Category: ${f.category}` })
  if (f.tag !== ALL) out.push({ key: "tag", label: `Tag: ${f.tag}` })
  if (f.location !== ALL) out.push({ key: "location", label: `Location: ${f.location}` })
  if (f.setting !== ALL) out.push({ key: "setting", label: `Setting: ${SETTING_LABEL[f.setting]}` })
  if (f.clinicalSetting !== ALL) out.push({ key: "clinicalSetting", label: `Clinical setting: ${f.clinicalSetting}` })
  if (f.mandatoryOnly) out.push({ key: "mandatoryOnly", label: "Mandatory skills only" })
  return out
}

/** Remove one filter. Removing the cohort removes its group too: a group only exists inside a cohort. */
export function removeFilter(f: ReportFilters, key: keyof ReportFilters): ReportFilters {
  return { ...f, [key]: NO_FILTERS[key], ...(key === "cohort" ? { group: ALL } : {}) }
}

/** Choose a cohort. A group that does not belong to the new cohort is dropped. */
export function withCohort(s: V2State, f: ReportFilters, cohort: string): ReportFilters {
  return { ...f, cohort, group: cohort !== ALL && groupsOf(s, cohort).includes(f.group) ? f.group : ALL }
}

/** Make a filter set coherent: a group without a cohort, or from another cohort, is dropped. */
export const normalizeFilters = (s: V2State, f: ReportFilters): ReportFilters => withCohort(s, f, f.cohort)

// ---------------------------------------------------------------------------------------------------------------------
// The dimensions and the values they offer


/** Cohorts that have at least one student, in program order. */
export function cohortsOf(s: V2State): string[] {
  const have = new Set(students(s).map((p) => cohortOf(s, p)))
  const order = s.program.cohorts.filter((c) => have.has(c))
  return [...order, ...[...have].filter((c) => !order.includes(c)).sort()]
}

/** Groups of one cohort that have at least one student. Empty for "all", which is why Group waits for a cohort. */
export function groupsOf(s: V2State, cohort: string): string[] {
  if (cohort === ALL) return []
  return [...new Set(students(s).filter((p) => cohortOf(s, p) === cohort).map(groupOf).filter((g): g is string => !!g))].sort()
}

/** Every clinical course the program runs, the report's own course first. */
export const coursesOf = (s: V2State): Array<{ id: string; label: string }> => [s.course, ...(s.otherCourses ?? [])].map((c) => ({ id: c.id, label: `${c.code} ${c.name}` }))

const courseLabel = (s: V2State, id: string) => coursesOf(s).find((c) => c.id === id)?.label ?? id

/** Locations the program defines. */
export const locationsOf = (s: V2State): string[] => (s.program.locations ?? []).map((l) => l.name)

/** Tags on the skills this report can show. Program-defined (SL-07). */
export const tagsOf = (s: V2State): string[] => [...new Set(reportSkills(s, NO_FILTERS).flatMap((r) => r.skill.tags ?? []))].sort()

/** RP-09: a combination that cannot produce evidence is explained. Null when the combination can. */
export function explainFilters(f: ReportFilters, s?: V2State): string | null {
  if (f.clinicalSetting !== ALL && (f.setting === "lab" || f.setting === "simulation")) {
    return `${SETTING_LABEL[f.setting]} evidence never carries a named clinical setting, so no ${f.setting} evidence can match "${f.clinicalSetting}". Clear one of the two filters.`
  }
  if (!s) return null
  const loc = f.location === ALL ? undefined : s.program.locations?.find((l) => l.name === f.location)
  if (loc) {
    if (f.setting !== ALL && loc.setting !== f.setting) return `${loc.name} does not offer ${SETTING_LABEL[f.setting].toLowerCase()} evidence, so none could have been gathered there in that setting. Clear one of the two filters.`
    if (f.clinicalSetting !== ALL && loc.clinicalSetting !== f.clinicalSetting) return `${loc.name} does not offer the ${f.clinicalSetting} clinical setting, so no evidence could have been gathered there in it. Clear one of the two filters.`
  }
  if (f.course !== ALL) {
    const c = [s.course, ...(s.otherCourses ?? [])].find((x) => x.id === f.course)
    if (c && f.clinicalSetting !== ALL && !c.clinicalSettings.includes(f.clinicalSetting)) return `${courseLabel(s, c.id)} does not place students in the ${f.clinicalSetting} clinical setting, so it holds no evidence from there. Clear one of the two filters.`
    if (c && c.clinicalSettings.length === 0 && f.setting === "clinical") return `${courseLabel(s, c.id)} does not place students in clinical settings, so it holds no clinical evidence. Clear one of the two filters.`
  }
  return null
}

/** The one filter to clear for an explained combination: its key and the button words. Null when nothing is explained. */
export function conflictFix(f: ReportFilters, s?: V2State): { keys: Array<keyof ReportFilters>; label: string } | null {
  if (!explainFilters(f, s)) return null
  if (f.location !== ALL && s?.program.locations?.some((l) => l.name === f.location && ((f.setting !== ALL && l.setting !== f.setting) || (f.clinicalSetting !== ALL && l.clinicalSetting !== f.clinicalSetting)))) return { keys: ["location"], label: "Clear the location filter" }
  if (f.course !== ALL && f.clinicalSetting !== ALL && !(f.setting === "lab" || f.setting === "simulation")) return { keys: ["clinicalSetting"], label: "Clear the clinical setting filter" }
  if (f.course !== ALL && f.setting === "clinical") return { keys: ["course"], label: "Clear the course filter" }
  return { keys: ["clinicalSetting"], label: "Clear the clinical setting filter" }
}

export interface ReportSkill {
  skill: Skill
  level: MappingRow["level"]
}

/** Skills the course maps and the program has published, narrowed by the category and mandatory filters. Mandatory first. */
export function reportSkills(s: V2State, f: ReportFilters): ReportSkill[] {
  const out: ReportSkill[] = []
  for (const m of s.mappings.filter((x) => x.courseId === s.course.id && x.level !== "not-expected")) {
    const skill = s.skills.find((k) => k.id === m.skillId)
    if (!skill || !skill.configured || !skill.published) continue
    if (f.category !== ALL && skill.category !== f.category) continue
    if (f.tag !== ALL && !(skill.tags ?? []).includes(f.tag)) continue
    if (f.mandatoryOnly && m.level !== "mandatory") continue
    out.push({ skill, level: m.level })
  }
  // Mandatory first; recommended and optional share the non-mandatory block, by name.
  const mand = (r: ReportSkill) => (r.level === "mandatory" ? 0 : 1)
  return out.sort((a, b) => mand(a) - mand(b) || a.skill.name.localeCompare(b.skill.name))
}

export const categoriesOf = (s: V2State): string[] => [...new Set(reportSkills(s, NO_FILTERS).map((r) => r.skill.category))].sort()


/** The state with only the students in view, for figures (such as pace) that follow the population but not the evidence filters. */
export function population(s: V2State, f: ReportFilters): V2State {
  const ids = new Set(studentsIn(s, f).map((p) => p.id))
  return { ...s, people: s.people.filter((p) => p.kind !== "student" || ids.has(p.id)) }
}

// ---------------------------------------------------------------------------------------------------------------------
// Heatmap

export type CellState = "achieved" | "half" | "some" | "attempted" | "none"

/** Sequential scale position, 0 (lightest) to 3 (darkest). Never a red. */
export const SCALE: Record<CellState, 0 | 1 | 2 | 3> = { none: 0, attempted: 0, some: 1, half: 2, achieved: 3 }

export interface HeatCell {
  studentId: string
  skillId: string
  state: CellState
  counted: number
  need: number
  /** The words shown in the cell. */
  text: string
}

const CELL_TEXT: Record<CellState, string> = { achieved: "Achieved", half: "", some: "", attempted: "Not met yet", none: "Not started" }

export function heatCell(s: V2State, studentId: string, skill: Skill): HeatCell {
  const p = skillProgress(s, studentId, skill.id)
  const need = p?.need ?? 0
  const counted = p?.counted ?? 0
  const any = evalsOfStudentSkill(s, studentId, skill.id).some((e) => e.status === "counted")
  let state: CellState = "none"
  if (p?.achieved) state = "achieved"
  else if (counted > 0) state = counted * 2 >= need ? "half" : "some"
  else if (any) state = "attempted"
  const text = state === "half" || state === "some" ? `${counted} of ${need}` : CELL_TEXT[state]
  return { studentId, skillId: skill.id, state, counted, need, text }
}

export interface HeatRow {
  student: Person
  cells: HeatCell[]
  achieved: number
  inProgress: number
  attempted: number
  notStarted: number
}

export function heatmap(s: V2State, f: ReportFilters): { skills: ReportSkill[]; rows: HeatRow[] } {
  const skills = reportSkills(s, f)
  const sc = scoped(s, f)
  // The grid lists the same students the summary counts: the population of the filters (students who take a filtered course in
  // the current term), never every student of the cohort.
  const inScope = populationRows(s, populationScopeOf(f)).ids
  const rows = studentsIn(s, f).filter((p) => inScope.has(p.id)).map((student): HeatRow => {
    const cells = skills.map((r) => heatCell(sc, student.id, r.skill))
    return {
      student,
      cells,
      achieved: cells.filter((c) => c.state === "achieved").length,
      inProgress: cells.filter((c) => c.state === "half" || c.state === "some").length,
      attempted: cells.filter((c) => c.state === "attempted").length,
      notStarted: cells.filter((c) => c.state === "none").length,
    }
  })
  return { skills, rows }
}

// ---------------------------------------------------------------------------------------------------------------------
// Pace


const DAY = 86_400_000

/** Share of the term that has passed on the demo day, 0 to 1. */
export function termShare(today: string = DEMO_TODAY): number {
  const a = Date.parse(`${TERM.start}T00:00:00Z`)
  const b = Date.parse(`${TERM.end}T00:00:00Z`)
  const t = Date.parse(`${today}T00:00:00Z`)
  return Math.min(1, Math.max(0, (t - a) / (b - a)))
}

export const termDaysGone = (today: string = DEMO_TODAY) => Math.round((Date.parse(`${today}T00:00:00Z`) - Date.parse(`${TERM.start}T00:00:00Z`)) / DAY)

/** Evaluations a student should have collected toward the mandatory rules by now: the share of the term gone times what the rules ask for. */
export const expectedByNow = (needTotal: number, share: number = termShare()) => Math.floor(needTotal * share)


export interface PaceRow {
  studentId: string
  name: string
  /** Mandatory skills achieved, of the total. */
  achieved: number
  total: number
  /** Successful evaluations collected toward the mandatory rules (a skill never counts above what its rule needs), of what they ask for. */
  collected: number
  needed: number
  expected: number
  /** Evaluations short of the pace, or 0. */
  behindBy: number
  /** Mandatory skills not achieved, with where each stands. */
  open: Array<{ skillId: string; name: string; counted: number; need: number }>
}

const paceOf = (r: StudentRow): Omit<PaceRow, "studentId" | "name"> => ({ achieved: r.achieved, total: r.required, collected: r.collected, needed: r.needed, expected: r.expected, behindBy: r.behindBy, open: r.open.map((o) => ({ skillId: o.skillId, name: o.name, counted: o.counted, need: o.need })) })

/**
 * Every student against the term clock, read from the single population calculation (lib/v2/population.ts, default scope:
 * each student's own cohort offerings in the current term, mandatory skills, Expected now basis). A student whose cohort takes
 * nothing this term gets an empty row. Behind means collected evidence is more than PACE_MARGIN short of the expected amount.
 */
export function paceRows(s: V2State, today: string = DEMO_TODAY): PaceRow[] {
  const rows = new Map(populationRows(s, DEFAULT_SCOPE, today).rows.map((r) => [r.id, r]))
  return students(s).map((p): PaceRow => {
    const r = rows.get(p.id)
    return { studentId: p.id, name: p.name, ...(r ? paceOf(r) : { achieved: 0, total: 0, collected: 0, needed: 0, expected: 0, behindBy: 0, open: [] }) }
  })
}

/** Students behind the term clock: exactly the population's behind flag (the dashboard hero figure). */
export const behindPace = (s: V2State, today?: string): PaceRow[] => paceRows(s, today).filter((r) => r.behindBy > 0).sort((a, b) => b.behindBy - a.behindBy || a.name.localeCompare(b.name))

// ---------------------------------------------------------------------------------------------------------------------
// Skills and raters

const nameOf = (s: V2State, id: string) => s.people.find((p) => p.id === id)?.name ?? "Unknown person"
const pct = (n: number, d: number) => (d === 0 ? 0 : Math.round((n / d) * 100))

/** Counted evaluations the filters leave in, any outcome. */
export function observations(s: V2State, f: ReportFilters, skillId?: string): Evaluation[] {
  const ids = new Set(reportSkills(s, f).map((r) => r.skill.id))
  const who = new Set(studentsIn(s, f).map((p) => p.id))
  return s.evaluations.filter((e) => e.status === "counted" && who.has(e.studentId) && ids.has(e.skillId) && (!skillId || e.skillId === skillId) && matchesEvidence(s, e, f))
}

export interface SkillStat {
  skill: Skill
  level: ReportSkill["level"]
  observations: number
  raters: Array<{ id: string; name: string; count: number }>
  /** Two or more observations and one evaluator behind all of them. */
  singleRater: boolean
  simulation: number
  simulationShare: number
  achieved: number
  students: number
}

export function skillStats(s: V2State, f: ReportFilters): SkillStat[] {
  const sc = scoped(s, f)
  return reportSkills(s, f).map(({ skill, level }) => {
    const obs = observations(s, f, skill.id)
    const byRater = new Map<string, number>()
    for (const e of obs) byRater.set(e.evaluatorId, (byRater.get(e.evaluatorId) ?? 0) + 1)
    const raters = [...byRater].map(([id, count]) => ({ id, name: nameOf(s, id), count })).sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
    const sim = obs.filter((e) => e.setting === "simulation").length
    return {
      skill,
      level,
      observations: obs.length,
      raters,
      singleRater: obs.length >= 2 && raters.length === 1,
      simulation: sim,
      simulationShare: pct(sim, obs.length),
      achieved: studentsIn(s, f).filter((p) => skillProgress(sc, p.id, skill.id)?.achieved).length,
      students: studentsIn(s, f).length,
    }
  })
}


export interface RaterRow {
  id: string
  name: string
  role: string
  evaluations: number
  met: number
  notMet: number
  notYet: number
  metRate: number
  /** Percentage points above (+) or below (-) the rate of all raters. */
  vsAll: number
  students: number
  skills: number
  small: boolean
}

export function raterRows(s: V2State, f: ReportFilters): RaterRow[] {
  const obs = observations(s, f)
  const all = pct(obs.filter((e) => e.outcome === "met").length, obs.length)
  const ids = [...new Set(obs.map((e) => e.evaluatorId))]
  return ids
    .map((id): RaterRow => {
      const mine = obs.filter((e) => e.evaluatorId === id)
      const met = mine.filter((e) => e.outcome === "met").length
      const person = s.people.find((p) => p.id === id)
      return {
        id,
        name: nameOf(s, id),
        role: person?.title ?? "",
        evaluations: mine.length,
        met,
        notMet: mine.filter((e) => e.outcome === "not-met").length,
        notYet: mine.filter((e) => e.outcome === "not-yet").length,
        metRate: pct(met, mine.length),
        vsAll: pct(met, mine.length) - all,
        students: new Set(mine.map((e) => e.studentId)).size,
        skills: new Set(mine.map((e) => e.skillId)).size,
        small: mine.length < SMALL_NUMBERS,
      }
    })
    .sort((a, b) => b.evaluations - a.evaluations || a.name.localeCompare(b.name))
}

// ---------------------------------------------------------------------------------------------------------------------
// Student table (the words-only alternative to the heatmap) and the summary

export interface StudentSkillRow {
  id: string
  studentId: string
  student: string
  skillId: string
  skill: string
  level: ReportSkill["level"]
  state: CellState
  status: string
  counted: number
  need: number
  observations: number
  raters: number
  simulation: number
}

export function studentSkillRows(s: V2State, f: ReportFilters): StudentSkillRow[] {
  const sc = scoped(s, f)
  const out: StudentSkillRow[] = []
  for (const p of studentsIn(s, f)) {
    for (const { skill, level } of reportSkills(s, f)) {
      const c = heatCell(sc, p.id, skill)
      const obs = observations(s, f, skill.id).filter((e) => e.studentId === p.id)
      out.push({
        id: `${p.id}|${skill.id}`,
        studentId: p.id,
        student: p.name,
        skillId: skill.id,
        skill: skill.name,
        level,
        state: c.state,
        status: c.state === "half" || c.state === "some" ? `In progress, ${c.text}` : c.text,
        counted: c.counted,
        need: c.need,
        observations: obs.length,
        raters: new Set(obs.map((e) => e.evaluatorId)).size,
        simulation: obs.filter((e) => e.setting === "simulation").length,
      })
    }
  }
  return out
}

export interface ReportSummary {
  students: number
  mandatoryAchievedPct: number
  behind: number
  singleRaterSkills: number
  simulationShare: number
  observations: number
}

/**
 * The report's headline. Students, mandatory achieved % and behind come from the population calculation for the report's
 * cohort, group, location and setting (each student's own cohort offerings, current term), so they equal the dashboard figures
 * for that scope. The single-rater and simulation figures read the focus course's observations (the report's grid).
 */
/** The population scope a set of report filters names (current term). The summary and the heat grid both read it. */
export function populationScopeOf(f: ReportFilters): PopulationScope {
  return { ...DEFAULT_SCOPE, cohort: f.cohort === ALL ? "" : f.cohort, group: f.cohort !== ALL && f.group !== ALL ? f.group : "", course: f.course === ALL ? "" : f.course, ...(f.category === ALL ? {} : { cat: f.category }), ...(f.tag === ALL ? {} : { tag: f.tag }), ...(f.location === ALL ? {} : { loc: f.location }), ...(f.setting === ALL ? {} : { setting: f.setting }) }
}

export function reportSummary(s: V2State, f: ReportFilters): ReportSummary {
  const tot = populationTotals(populationRows(s, populationScopeOf(f)))
  const obs = observations(s, f)
  return {
    students: tot.students,
    mandatoryAchievedPct: tot.achievedPct,
    behind: tot.behind,
    singleRaterSkills: skillStats(s, f).filter((x) => x.singleRater).length,
    simulationShare: pct(obs.filter((e) => e.setting === "simulation").length, obs.length),
    observations: obs.length,
  }
}

/** Verification rows are the report data Stage 4 prepared (RP-07). Re-exported so the reports read one place. */
export const verificationOf = (s: V2State): VerificationRow[] => verificationRows(s)

// ---------------------------------------------------------------------------------------------------------------------
// Reports page view models (pure): the grid state vocabulary, weakest-first order, skill attainment and pace dots.

/** The shared viz vocabulary a heatmap cell maps to. Did not meet is amber in the viz, never red. */
export type GridState = "met" | "notYet" | "notMet" | "none"

export const gridState = (c: CellState): GridState => (c === "achieved" ? "met" : c === "half" || c === "some" ? "notYet" : c === "attempted" ? "notMet" : "none")

export interface SkillAttainment {
  skill: Skill
  level: ReportSkill["level"]
  achieved: number
  inProgress: number
  attempted: number
  notStarted: number
  students: number
  stat: SkillStat
}

/** One entry per skill in view: mandatory before optional, then weakest first (fewest students achieved), then by name. */
export function skillAttainment(s: V2State, f: ReportFilters): SkillAttainment[] {
  const hm = heatmap(s, f)
  const stats = new Map(skillStats(s, f).map((x) => [x.skill.id, x]))
  return hm.skills
    .map((r, i): SkillAttainment => {
      const col = hm.rows.map((row) => row.cells[i].state)
      return {
        skill: r.skill,
        level: r.level,
        achieved: col.filter((x) => x === "achieved").length,
        inProgress: col.filter((x) => x === "half" || x === "some").length,
        attempted: col.filter((x) => x === "attempted").length,
        notStarted: col.filter((x) => x === "none").length,
        students: col.length,
        stat: stats.get(r.skill.id)!,
      }
    })
    .sort((a, b) => Number(a.level !== "mandatory") - Number(b.level !== "mandatory") || a.achieved - b.achieved || a.skill.name.localeCompare(b.skill.name))
}

export interface PaceDot {
  id: string
  label: string
  /** Share of the mandatory evaluations collected, 0 to 100. */
  value: number
  flagged: boolean
  note?: string
}

/** Every student as a dot: collected against what the mandatory rules ask for. Behind students are flagged with how many they are short. */
export function paceDots(rows: PaceRow[]): PaceDot[] {
  return rows.map((r) => ({
    id: r.studentId,
    label: r.name,
    value: r.needed === 0 ? 0 : Math.round((r.collected / r.needed) * 100),
    flagged: r.behindBy > 0,
    ...(r.behindBy > 0 ? { note: `short by ${r.behindBy}` } : {}),
  }))
}

/** The "expected by now" marker on the same 0 to 100 axis. */
export const paceMarker = (share: number = termShare()): number => Math.round(share * 100)

// ---------------------------------------------------------------------------------------------------------------------
// Attainment by tag (RP-04)

export interface TagAttainment {
  tag: string
  /** The skills in view that carry the tag, weakest first (the Skills tab order). */
  skills: SkillAttainment[]
  /** Student-to-skill records over those skills, by state. A record is one student against one skill in view. */
  achieved: number
  inProgress: number
  attempted: number
  notStarted: number
  records: number
  /** Share of records achieved, 0 to 100, or null when no student is in view (no records, so no share). */
  pct: number | null
  /** Skills of this tag that also carry at least one other tag, so they are counted under more than one row. */
  shared: number
  /** The other tags those skills carry, sorted. */
  alsoTags: string[]
}

export interface TagReport {
  rows: TagAttainment[]
  /** Distinct skills in view (not a sum over tags). */
  distinctSkills: number
  /** Tag-skill pairs: how many times a skill is counted across the rows. Equals distinctSkills only if no skill has two tags. */
  pairs: number
  /** Skills in view that carry no tag and so appear in no row. */
  untagged: number
  /** The tag chosen in the filter when no skill in scope carries it, else null. Explained, never an empty table (RP-09). */
  missingTag: string | null
}

/**
 * RP-04: attainment by tag. Built from the same per-skill figures as the Skills tab (skillAttainment), so a skill shows the same
 * four numbers on both tabs and under every tag it carries. Tags cut across categories: a skill with two tags is counted under
 * both, so rows overlap and must never be summed. Every filter applies (RP-01, RP-08). With a Tag filter only that tag is listed:
 * the other tags of its skills would count just the skills they share with it and read as smaller tags.
 */
export function tagAttainment(s: V2State, f: ReportFilters): TagReport {
  const att = skillAttainment(s, f)
  const tagsOfSkill = (a: SkillAttainment) => a.skill.tags ?? []
  const names = f.tag !== ALL ? [f.tag] : [...new Set(att.flatMap(tagsOfSkill))].sort()
  const rows = names
    .map((tag): TagAttainment => {
      const skills = att.filter((a) => tagsOfSkill(a).includes(tag))
      const sum = (k: "achieved" | "inProgress" | "attempted" | "notStarted") => skills.reduce((n, a) => n + a[k], 0)
      const achieved = sum("achieved")
      const records = skills.reduce((n, a) => n + a.students, 0)
      const others = skills.filter((a) => tagsOfSkill(a).some((t) => t !== tag))
      return {
        tag,
        skills,
        achieved,
        inProgress: sum("inProgress"),
        attempted: sum("attempted"),
        notStarted: sum("notStarted"),
        records,
        pct: records === 0 ? null : pct(achieved, records),
        shared: others.length,
        alsoTags: [...new Set(others.flatMap(tagsOfSkill).filter((t) => t !== tag))].sort(),
      }
    })
    .filter((r) => r.skills.length > 0)
  return {
    rows,
    distinctSkills: att.length,
    pairs: att.reduce((n, a) => n + tagsOfSkill(a).length, 0),
    untagged: att.filter((a) => tagsOfSkill(a).length === 0).length,
    missingTag: f.tag !== ALL && rows.length === 0 ? f.tag : null,
  }
}

// ---------------------------------------------------------------------------------------------------------------------
// Evidence ledger (RP-05, RP-06): the evaluations behind a figure. Same counted set, same filters, same rule as the grid, so the
// figure and the rows cannot disagree. Reads counted evaluations only (AE-01, AR-06). It never reads a concern flag, a reviewer
// note or a return reason.

/** What a counted evaluation did for the figure. SH-02 vocabulary. */
export type LedgerResult = "counts" | "not-used" | "did-not-meet" | "feedback-only"

export const LEDGER_RESULT_LABEL: Record<LedgerResult, string> = {
  counts: "Counts toward the figure",
  "not-used": "Met, not used by the rule",
  "did-not-meet": "Did not meet criteria",
  "feedback-only": "Not yet, feedback only",
}

export interface LedgerRow {
  /** The evaluation id: also the row id. */
  evaluationId: string
  studentId: string
  skillId: string
  skillName: string
  date: string
  /** Clinical with its named setting, Lab, or Simulation. */
  settingLabel: string
  location: string | null
  evaluator: string
  evaluatorRole: string
  /** Who recorded the current version and when. */
  recordedBy: string
  recordedAt: string
  /** Set when a reviewer typed a paper form on the evaluator's behalf. */
  recordedNote: string | null
  result: LedgerResult
  /** Why a Met evaluation was left out of the rule, in staff words. Null otherwise. */
  reason: string | null
  /** True when this row is one of the evaluations the header figure counts. */
  counts: boolean
}

/** The four AE-04 states as the counters name them. */
export type CounterId = "achieved" | "in-progress" | "did-not-meet" | "not-started"

export const COUNTER_IDS: CounterId[] = ["achieved", "in-progress", "did-not-meet", "not-started"]
export const COUNTER_LABEL: Record<CounterId, string> = { achieved: "Achieved", "in-progress": "In progress", "did-not-meet": "Did not meet", "not-started": "Not started" }

export const counterOf = (c: CellState): CounterId => (c === "achieved" ? "achieved" : c === "half" || c === "some" ? "in-progress" : c === "attempted" ? "did-not-meet" : "not-started")

export interface SkillLedger {
  studentId: string
  skillId: string
  skillName: string
  level: ReportSkill["level"]
  state: CellState
  counter: CounterId
  /** The grid's own figure: qualifying evaluations the rule counts, of what it needs. */
  counted: number
  need: number
  /** What is still needed, in staff words. Empty when achieved. */
  left: string[]
  /** Counted evaluations, newest first. */
  rows: LedgerRow[]
}

export const fmtLedgerDate = (iso: string) => new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" })

/** The student-addressed wording of the engine, put in staff words for a report. */
const forStaff = (text: string) => text.replace(/\s*\(you have ([^)]+)\)/g, " (the student has $1)").replace(/\byour last\b/g, "the last")

function ledgerRow(sc: V2State, e: Evaluation, skill: Skill, used: Set<string>, leftOut: Record<string, string>): LedgerRow {
  const person = (id: string) => sc.people.find((p) => p.id === id)
  const v = e.versions.find((x) => x.version === e.currentVersion)
  const counts = used.has(e.id)
  const result: LedgerResult = counts ? "counts" : e.outcome === "met" ? "not-used" : e.outcome === "not-met" ? "did-not-meet" : "feedback-only"
  return {
    evaluationId: e.id,
    studentId: e.studentId,
    skillId: e.skillId,
    skillName: skill.name,
    date: e.date,
    settingLabel: e.setting === "clinical" ? `Clinical${e.clinicalSetting ? `, ${e.clinicalSetting}` : ""}` : SETTING_LABEL[e.setting],
    location: e.location ?? null,
    evaluator: nameOf(sc, e.evaluatorId),
    evaluatorRole: person(e.evaluatorId)?.title ?? "",
    recordedBy: nameOf(sc, v?.by ?? e.evaluatorId),
    recordedAt: v?.at ?? e.date,
    recordedNote: e.source === "paper-form" && e.enteredById ? `Entered from a paper form by ${nameOf(sc, e.enteredById)}` : null,
    result,
    reason: result === "not-used" ? forStaff(leftOut[e.id] ?? "Met, but the rule did not use it.") : null,
    counts,
  }
}

/** One student on one skill: the grid figure and the evaluations behind it. Null when the skill is not in view. */
export function skillLedger(s: V2State, f: ReportFilters, studentId: string, skillId: string): SkillLedger | null {
  const inView = reportSkills(s, f).find((r) => r.skill.id === skillId)
  if (!inView || !s.people.some((p) => p.id === studentId && p.kind === "student")) return null
  const sc = scoped(s, f)
  const cell = heatCell(sc, studentId, inView.skill)
  const p = skillProgress(sc, studentId, skillId)
  const used = new Set(p?.used ?? [])
  const rows = sc.evaluations
    .filter((e) => e.studentId === studentId && e.skillId === skillId && e.status === "counted")
    .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : a.id.localeCompare(b.id)))
    .map((e) => ledgerRow(sc, e, inView.skill, used, p?.leftOut ?? {}))
  return {
    studentId,
    skillId,
    skillName: inView.skill.name,
    level: inView.level,
    state: cell.state,
    counter: counterOf(cell.state),
    counted: cell.counted,
    need: cell.need,
    left: (p?.left ?? []).map(forStaff),
    rows,
  }
}

export interface StudentLedger {
  studentId: string
  name: string
  /** Every skill in view, in report order. */
  skills: SkillLedger[]
  /** Skills in each state (AE-04). Sums to skills.length. */
  counters: Record<CounterId, number>
}

export function studentLedger(s: V2State, f: ReportFilters, studentId: string): StudentLedger | null {
  const person = s.people.find((p) => p.id === studentId && p.kind === "student")
  if (!person) return null
  const skills = reportSkills(s, f).map((r) => skillLedger(s, f, studentId, r.skill.id)).filter((x): x is SkillLedger => !!x)
  const counters = { achieved: 0, "in-progress": 0, "did-not-meet": 0, "not-started": 0 } as Record<CounterId, number>
  for (const k of skills) counters[k.counter]++
  return { studentId, name: person.name, skills, counters }
}

/** What the sheet shows: the skills that pass the skill chip and the Show these only counter, and the ledger rows of those skills. */
export function ledgerView(l: StudentLedger, opts: { skillId: string | null; only: CounterId | null }): { skills: SkillLedger[]; rows: LedgerRow[] } {
  const skills = l.skills.filter((k) => (!opts.skillId || k.skillId === opts.skillId) && (!opts.only || k.counter === opts.only))
  return { skills, rows: skills.flatMap((k) => k.rows) }
}
