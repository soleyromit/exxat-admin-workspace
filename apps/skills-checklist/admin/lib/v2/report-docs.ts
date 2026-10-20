import type { Block, SignedContent } from "./pdf"
import { appliedFilters, behindPace, heatmap, paceRows, raterRows, reportSummary, skillStats, SMALL_NUMBERS, type ReportFilters } from "./reports"
import type { V2State } from "./types"
import { STATUS_LABEL, verificationRows, verificationStatus } from "./verification"

/** Stage 5: the words of a signed report PDF. Built from the same selectors as the screen, so the two cannot disagree (RP-10). */

const P = (s: string): Block => ({ t: "p", s })
const M = (s: string): Block => ({ t: "mono", s })
const H2 = (s: string): Block => ({ t: "h2", s })
const GAP: Block = { t: "gap" }

const plural = (n: number, one: string, many: string) => (n === 1 ? one : many)
const fit = (t: string, n: number) => (t.length > n ? `${t.slice(0, n - 1)}.` : t.padEnd(n))
const day = (iso: string) => iso.slice(0, 10)

const PRIVACY = "Confidential concerns, student self-ratings and notes, and evaluator feedback text are never part of a report."

export function studentReportContent(s: V2State, studentId: string, f: ReportFilters, at: string): SignedContent | null {
  const student = s.people.find((p) => p.id === studentId && p.kind === "student")
  if (!student) return null
  const hm = heatmap(s, f)
  const row = hm.rows.find((r) => r.student.id === studentId)
  const stats = skillStats(s, f)
  const pace = paceRows(s).find((r) => r.studentId === studentId)
  const vs = verificationStatus(s, studentId)
  const blocks: Block[] = [
    H2("Summary"),
    P(`${student.name}, ${s.program.name} ${s.course.cohort}, ${s.course.code} ${s.course.name}, ${s.course.term}.`),
    P(`${row?.achieved ?? 0} achieved, ${row?.inProgress ?? 0} in progress, ${row?.attempted ?? 0} not met yet, ${row?.notStarted ?? 0} not started, across ${hm.skills.length} ${plural(hm.skills.length, "skill", "skills")} in view.`),
    pace ? P(`Mandatory pace: ${pace.achieved} of ${pace.total} skills achieved; ${pace.collected} of ${pace.needed} needed evaluations collected, ${pace.expected} expected by now (${pace.behindBy > 0 ? `${pace.behindBy} short` : "on pace"}). Pace is a prototype assumption, not a requirement.`) : P(""),
    P(`Program verification: ${STATUS_LABEL[vs.status]}${vs.latest ? `, version ${vs.latest.version}, ${day(vs.latest.at)}` : ""}.`),
    GAP,
    H2("Skills"),
  ]
  hm.skills.forEach((r, i) => {
    const c = row?.cells[i]
    const ev = s.evaluations.filter((e) => e.studentId === studentId && e.skillId === r.skill.id && e.status === "counted").sort((a, b) => (a.date < b.date ? -1 : 1))
    blocks.push(M(`${fit(r.skill.name, 44)} ${fit(r.level === "mandatory" ? "Mandatory" : "Optional", 10)} ${c ? c.text : ""}`))
    for (const e of ev) {
      const who = s.people.find((p) => p.id === e.evaluatorId)?.name ?? "Unknown person"
      blocks.push(M(`  ${day(e.date)}  ${fit(e.outcome === "met" ? "Met" : e.outcome === "not-met" ? "Not met" : "Not yet", 8)} ${fit(e.setting === "clinical" ? `Clinical${e.clinicalSetting ? `, ${e.clinicalSetting}` : ""}` : e.setting === "lab" ? "Lab" : "Simulation", 22)} ${who}, version ${e.currentVersion}`))
    }
    if (ev.length === 0) blocks.push(M("  No evaluation counts yet."))
  })
  const single = stats.filter((x) => x.singleRater)
  if (single.length) blocks.push(GAP, P(`Cohort note: ${single.map((x) => x.skill.name).join(", ")} ${plural(single.length, "rests", "rest")} on one evaluator across the cohort.`))
  blocks.push(GAP, P(PRIVACY))
  return { v: 1, kind: "student-report", generatedAt: at, title: "Student skills report", subject: `${student.name}. ${s.program.school}, ${s.program.name}.`, filters: appliedFilters(f).map((x) => x.label), blocks }
}

export function cohortReportContent(s: V2State, f: ReportFilters, at: string): SignedContent {
  const hm = heatmap(s, f)
  const sum = reportSummary(s, f)
  const skills = skillStats(s, f)
  const raters = raterRows(s, f)
  const behind = behindPace(s)
  const rows = verificationRows(s)
  const blocks: Block[] = [
    H2("Summary"),
    P(`${s.program.school}, ${s.program.name} ${s.course.cohort}, ${s.course.code} ${s.course.name}, ${s.course.term}.`),
    P(`${sum.students} students. ${sum.mandatoryAchievedPct}% of mandatory skill cells achieved. ${sum.behind} ${plural(sum.behind, "student is", "students are")} behind the expected pace. ${sum.singleRaterSkills} ${plural(sum.singleRaterSkills, "skill rests", "skills rest")} on one evaluator. Simulation supplies ${sum.simulationShare}% of ${sum.observations} observations.`),
    GAP,
    H2("Heatmap (A achieved, n/N counted of needed, NM not met yet, - not started)"),
  ]
  const key = hm.skills.map((r, i) => `S${i + 1} ${r.skill.name}${r.level === "mandatory" ? " (mandatory)" : ""}`)
  blocks.push(M(key.join("\n")), GAP)
  blocks.push(M(`${fit("Student", 18)}${hm.skills.map((_, i) => fit(`S${i + 1}`, 7)).join("")}`))
  for (const r of hm.rows) {
    blocks.push(M(`${fit(r.student.name, 18)}${r.cells.map((c) => fit(c.state === "achieved" ? "A" : c.state === "none" ? "-" : c.state === "attempted" ? "NM" : `${c.counted}/${c.need}`, 7)).join("")}`))
  }
  blocks.push(GAP, H2("Students behind the expected pace"))
  if (behind.length === 0) blocks.push(P("No student is behind the expected pace."))
  for (const r of behind) blocks.push(M(`${fit(r.name, 18)} ${r.collected} of ${r.needed} evaluations, ${r.expected} expected, ${r.behindBy} short`))
  blocks.push(GAP, H2("Observations and raters by skill"))
  blocks.push(M(`${fit("Skill", 40)}${fit("Obs", 5)}${fit("Raters", 7)}${fit("Sim %", 7)}Flag`))
  for (const k of skills) blocks.push(M(`${fit(k.skill.name, 40)}${fit(String(k.observations), 5)}${fit(String(k.raters.length), 7)}${fit(`${k.simulationShare}%`, 7)}${k.singleRater ? "One evaluator" : ""}`))
  blocks.push(GAP, H2("Rater comparison"))
  blocks.push(P(`Rates are shares of counted evaluations. Raters with fewer than ${SMALL_NUMBERS} evaluations are marked: read those with care.`))
  blocks.push(M(`${fit("Rater", 22)}${fit("Evals", 6)}${fit("Met %", 6)}${fit("vs all", 8)}Note`))
  for (const r of raters) blocks.push(M(`${fit(r.name, 22)}${fit(String(r.evaluations), 6)}${fit(`${r.metRate}%`, 6)}${fit(`${r.vsAll > 0 ? "+" : ""}${r.vsAll}`, 8)}${r.small ? "Small numbers" : ""}`))
  blocks.push(GAP, H2("Program verification"))
  for (const r of rows) blocks.push(M(`${fit(r.name, 18)} ${fit(STATUS_LABEL[r.status], 24)} ${r.version ? `version ${r.version}, ${r.verifiedBy}, ${day(r.verifiedAt ?? "")}` : ""}`))
  blocks.push(GAP, P(PRIVACY))
  return { v: 1, kind: "cohort-report", generatedAt: at, title: "Cohort skills report", subject: `${s.program.school}, ${s.program.name} ${s.course.cohort}, ${s.course.code}, ${s.course.term}.`, filters: appliedFilters(f).map((x) => x.label), blocks }
}
