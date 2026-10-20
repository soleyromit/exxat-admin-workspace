import { DEMO_TODAY } from "./seed"
import { skillProgress } from "./student"
import type { Evaluation, Person, Setting, Skill, V2State } from "./types"
import { mandatoryProgress, verificationRows, type VerificationRow } from "./verification"

/**
 * Stage 5: cohort report data, computed from the shared store. Pure. Only counted evaluations are read (AE-01, AR-06); a confidential
 * concern is never read. Filters re-scope the evidence first and progress is then recalculated from what is left (RP-08).
 */

export interface ReportFilters {
  category: string
  setting: "all" | Setting
  clinicalSetting: string
  mandatoryOnly: boolean
}

export const ALL = "all"
export const NO_FILTERS: ReportFilters = { category: ALL, setting: ALL, clinicalSetting: ALL, mandatoryOnly: false }

export const SETTING_LABEL: Record<Setting, string> = { clinical: "Clinical", lab: "Lab", simulation: "Simulation" }

export interface AppliedFilter {
  key: keyof ReportFilters
  label: string
}

/** What is applied now, one entry per filter, so each can be removed on its own (RP-01). */
export function appliedFilters(f: ReportFilters): AppliedFilter[] {
  const out: AppliedFilter[] = []
  if (f.category !== ALL) out.push({ key: "category", label: `Category: ${f.category}` })
  if (f.setting !== ALL) out.push({ key: "setting", label: `Setting: ${SETTING_LABEL[f.setting]}` })
  if (f.clinicalSetting !== ALL) out.push({ key: "clinicalSetting", label: `Clinical setting: ${f.clinicalSetting}` })
  if (f.mandatoryOnly) out.push({ key: "mandatoryOnly", label: "Mandatory skills only" })
  return out
}

export function removeFilter(f: ReportFilters, key: keyof ReportFilters): ReportFilters {
  return { ...f, [key]: NO_FILTERS[key] }
}

/** RP-09: a combination that cannot produce evidence is explained. Null when the combination can. */
export function explainFilters(f: ReportFilters): string | null {
  if (f.clinicalSetting !== ALL && (f.setting === "lab" || f.setting === "simulation")) {
    return `${SETTING_LABEL[f.setting]} evidence never carries a named clinical setting, so no ${f.setting} evidence can match "${f.clinicalSetting}". Clear one of the two filters.`
  }
  return null
}

export interface ReportSkill {
  skill: Skill
  level: "mandatory" | "optional" | "not-expected"
}

/** Skills the course maps and the program has published, narrowed by the category and mandatory filters. Mandatory first. */
export function reportSkills(s: V2State, f: ReportFilters): ReportSkill[] {
  const out: ReportSkill[] = []
  for (const m of s.mappings.filter((x) => x.courseId === s.course.id && x.level !== "not-expected")) {
    const skill = s.skills.find((k) => k.id === m.skillId)
    if (!skill || !skill.configured || !skill.published) continue
    if (f.category !== ALL && skill.category !== f.category) continue
    if (f.mandatoryOnly && m.level !== "mandatory") continue
    out.push({ skill, level: m.level })
  }
  return out.sort((a, b) => (a.level === b.level ? a.skill.name.localeCompare(b.skill.name) : a.level === "mandatory" ? -1 : 1))
}

export const categoriesOf = (s: V2State): string[] => [...new Set(reportSkills(s, NO_FILTERS).map((r) => r.skill.category))].sort()

/** The evaluations the setting filters leave in. */
const matchesSetting = (e: Evaluation, f: ReportFilters) => (f.setting === ALL || e.setting === f.setting) && (f.clinicalSetting === ALL || (e.setting === "clinical" && e.clinicalSetting === f.clinicalSetting))

export function scoped(s: V2State, f: ReportFilters): V2State {
  return f.setting === ALL && f.clinicalSetting === ALL ? s : { ...s, evaluations: s.evaluations.filter((e) => matchesSetting(e, f)) }
}

export const students = (s: V2State): Person[] => s.people.filter((p) => p.kind === "student")

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
  const any = s.evaluations.some((e) => e.studentId === studentId && e.skillId === skill.id && e.status === "counted")
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
  const rows = students(s).map((student): HeatRow => {
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

/** The term clock for the pace view. The requirements do not define pace; these dates are the prototype's assumption. */
export const TERM = { start: "2026-08-24", end: "2026-12-11" }

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

/** A student is behind when they are more than this many evaluations short of the pace. One short is within the noise of scheduling. */
export const PACE_MARGIN = 1

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

/** Every student against the term clock. Behind means collected evidence is more than PACE_MARGIN short of the expected amount. */
export function paceRows(s: V2State, today: string = DEMO_TODAY): PaceRow[] {
  const share = termShare(today)
  return students(s).map((p): PaceRow => {
    const mp = mandatoryProgress(s, p.id)
    const needed = mp.reduce((n, m) => n + m.need, 0)
    const collected = mp.reduce((n, m) => n + Math.min(m.counted, m.need), 0)
    const expected = expectedByNow(needed, share)
    const short = expected - collected
    return {
      studentId: p.id,
      name: p.name,
      achieved: mp.filter((m) => m.achieved).length,
      total: mp.length,
      collected,
      needed,
      expected,
      behindBy: short > PACE_MARGIN ? short : 0,
      open: mp.filter((m) => !m.achieved).map((m) => ({ skillId: m.skill.id, name: m.skill.name, counted: m.counted, need: m.need })),
    }
  })
}

export const behindPace = (s: V2State, today?: string): PaceRow[] => paceRows(s, today).filter((r) => r.behindBy > 0).sort((a, b) => b.behindBy - a.behindBy || a.name.localeCompare(b.name))

// ---------------------------------------------------------------------------------------------------------------------
// Skills and raters

const nameOf = (s: V2State, id: string) => s.people.find((p) => p.id === id)?.name ?? "Unknown person"
const pct = (n: number, d: number) => (d === 0 ? 0 : Math.round((n / d) * 100))

/** Counted evaluations the filters leave in, any outcome. */
export function observations(s: V2State, f: ReportFilters, skillId?: string): Evaluation[] {
  const ids = new Set(reportSkills(s, f).map((r) => r.skill.id))
  return s.evaluations.filter((e) => e.status === "counted" && ids.has(e.skillId) && (!skillId || e.skillId === skillId) && matchesSetting(e, f))
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
      achieved: students(s).filter((p) => skillProgress(sc, p.id, skill.id)?.achieved).length,
      students: students(s).length,
    }
  })
}

export const SMALL_NUMBERS = 5

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
  for (const p of students(s)) {
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

export function reportSummary(s: V2State, f: ReportFilters): ReportSummary {
  const hm = heatmap(s, f)
  const mandatoryCols = hm.skills.map((r, i) => (r.level === "mandatory" ? i : -1)).filter((i) => i >= 0)
  const cells = hm.rows.flatMap((r) => mandatoryCols.map((i) => r.cells[i]))
  const obs = observations(s, f)
  return {
    students: hm.rows.length,
    mandatoryAchievedPct: pct(cells.filter((c) => c.state === "achieved").length, cells.length),
    behind: behindPace(s).length,
    singleRaterSkills: skillStats(s, f).filter((x) => x.singleRater).length,
    simulationShare: pct(obs.filter((e) => e.setting === "simulation").length, obs.length),
    observations: obs.length,
  }
}

/** Verification rows are the report data Stage 4 prepared (RP-07). Re-exported so the reports read one place. */
export const verificationOf = (s: V2State): VerificationRow[] => verificationRows(s)
