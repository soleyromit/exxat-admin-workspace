import { describe, expect, it } from "vitest"
import { createSeed, IDS } from "@/lib/v2/seed"
import { facts, type Facts } from "@/lib/v2/facts"
import { approvalsBadgeCount, approvalsInScope, heldState } from "@/lib/v2/approvals"
import { DEFAULT_SCOPE, populationRows, REQUIRED_SET_LABEL, requiredSkillsFor, requiredToComplete, type PopulationScope } from "@/lib/v2/population"
import { placementsEnding } from "@/lib/v2/placements"
import { approvalsBadge, COUNTER_BY_ID } from "@/lib/v2/selectors"
import { homeKpis } from "@/lib/v2/home"
import { behindPace, NO_FILTERS, paceRows, reportSummary } from "@/lib/v2/reports"
import { mandatoryProgress, verificationRows } from "@/lib/v2/verification"
import { buildDashboard, buildDrill, buildExceptions, opsModel, pipelineModel } from "@/lib/lab/dashboard"
import { reviewRows, scopeRows, summarize } from "@/lib/lab/reviewer"
import { buildStudent, requestGroups } from "@/lib/lab/student"
import { buildReadiness, directorFixture } from "@/lib/lab/director"
import { directory } from "@/lib/lab/evaluators"
import type { LabScope } from "@/lib/lab/scope"

/**
 * The consistency gate (Romit: "I don't want any inconsistencies in data or visual"). Every selector or screen model that renders a
 * headline fact must return exactly the value in lib/v2/facts.ts, for the default scope and two others (a cohort, a course).
 */

const s = createSeed()
const SCOPES: Array<{ name: string; scope: LabScope }> = [
  { name: "default (current term, everyone)", scope: { ...DEFAULT_SCOPE } },
  { name: "cohort BSN 2027", scope: { ...DEFAULT_SCOPE, cohort: "BSN 2027" } },
  { name: "course NURS 350", scope: { ...DEFAULT_SCOPE, course: "crs-nurs350" } },
  { name: "explicit term slug fall-2026", scope: { ...DEFAULT_SCOPE, term: "fall-2026" } },
]

const pctText = (f: Facts) => `${f.achievedPct}%`

describe.each(SCOPES)("one value per fact, scope: $name", ({ scope }) => {
  const f = facts(s, scope as PopulationScope)
  const d = buildDashboard(s, scope)

  it("the facts are sane at scale", () => {
    expect(f.studentsTotal).toBe(123)
    expect(f.studentsInScope).toBeGreaterThan(0)
    expect(f.mandatoryRecords).toBeGreaterThan(f.studentsInScope)
    expect(f.awaitingApprovalStatusRows + f.awaitingApprovalUnverifiedRows).toBeLessThanOrEqual(f.awaitingApprovalEvaluations)
  })

  it("dashboard A (status board): hero, KPIs and totals", () => {
    expect(d.total).toBe(f.studentsTotal)
    expect(d.inScope).toBe(f.studentsInScope)
    expect(d.heroValue).toBe(f.behind)
    const k = Object.fromEntries(d.kpis.map((x) => [x.id, x]))
    expect(k.achieved.value).toBe(pctText(f))
    expect(k.achieved.description).toBe(`${f.mandatoryAchieved.toLocaleString("en-US")} of ${f.mandatoryRecords.toLocaleString("en-US")}`)
    expect(k.waiting.value).toBe(f.waitingRequests)
    expect(k.approval.value).toBe(f.awaitingApproval)
    expect(k.setup.value).toBe(f.skillsConfigured)
    expect(d.waitingCount).toBe(f.waitingRequests)
    expect(d.approvals.submissions).toBe(f.awaitingApproval)
    expect(d.approvals.evaluations).toBe(f.awaitingApprovalEvaluations)
    expect(d.unconfigured).toBe(f.skillsNotConfigured)
  })

  it("drill lists: each count equals the figure that links to it", () => {
    expect(buildDrill(s, scope, { list: "students", cond: "behind" }).count).toBe(f.behind)
    expect(buildDrill(s, scope, { list: "students" }).count).toBe(f.studentsInScope)
    expect(buildDrill(s, scope, { list: "requests", cond: "waiting" }).count).toBe(f.waitingRequests)
    expect(buildDrill(s, scope, { list: "requests", cond: "approval" }).count).toBe(f.awaitingApproval)
    const skills = buildDrill(s, scope, { list: "skills" }).skills!
    expect(skills.reduce((t, x) => t + x.students, 0)).toBe(f.mandatoryRecords)
    expect(skills.reduce((t, x) => t + x.achieved, 0)).toBe(f.mandatoryAchieved)
  })

  it("dashboard B (exceptions): tab counts", () => {
    const x = buildExceptions(s, d)
    expect(x.behind).toHaveLength(f.behind)
    expect(x.approval).toHaveLength(f.awaitingApproval)
  })

  it("dashboard C (pipeline) and E (operations)", () => {
    const p = pipelineModel(s, scope)
    expect(p.students).toBe(f.studentsInScope)
    expect(p.total).toBe(f.mandatoryRecords)
    expect(p.stages.find((x) => x.state === "achieved")!.count).toBe(f.mandatoryAchieved)
    const o = opsModel(s, scope)
    expect(o.students).toBe(f.studentsInScope)
    expect(o.waiting).toBe(f.waitingRequests)
  })

  it("reviewer queue and the Approvals nav badge", () => {
    const held = heldState(s)
    const rows = reviewRows(held)
    const q = scopeRows(held, rows, scope)
    expect(q.rows).toHaveLength(f.awaitingApproval)
    expect(summarize(q.rows).evaluations).toBe(f.awaitingApprovalEvaluations)
    expect(approvalsBadgeCount(s, scope)).toBe(f.awaitingApproval)
    expect(approvalsInScope(s, scope).entries).toHaveLength(f.awaitingApproval)
  })

  it("director readiness lists the same students in scope", () => {
    const r = buildReadiness(s, scope)
    expect(r.population.rows).toHaveLength(f.studentsInScope)
    expect(r.rows).toHaveLength(f.studentsInScope)
  })
})

describe("default scope: v2 selectors and the student's own view", () => {
  const f = facts(s)

  it("v2 reports, home and counters read the same facts", () => {
    const sum = reportSummary(s, NO_FILTERS)
    expect(sum.students).toBe(f.studentsInScope)
    expect(sum.behind).toBe(f.behind)
    expect(sum.mandatoryAchievedPct).toBe(f.achievedPct)
    expect(behindPace(s)).toHaveLength(f.behind)
    expect(paceRows(s).reduce((t, r) => t + r.total, 0)).toBe(f.mandatoryRecords)
    const k = homeKpis(s)
    expect(k.behind).toBe(f.behind)
    expect(k.waiting).toBe(f.awaitingApproval)
    expect(k.students).toBe(f.studentsTotal)
    expect(approvalsBadge(s)).toBe(f.awaitingApproval)
    expect(COUNTER_BY_ID.mandatory.value(s)).toBe(f.mandatoryRecords)
    expect(COUNTER_BY_ID.behind.value(s)).toBe(f.behind)
    expect(COUNTER_BY_ID.unconfigured.value(s)).toBe(f.skillsNotConfigured)
  })

  it("v2 verification rows sum to the mandatory facts", () => {
    const v = verificationRows(s)
    expect(v.reduce((t, r) => t + r.mandatoryTotal, 0)).toBe(f.mandatoryRecords)
    expect(v.reduce((t, r) => t + r.mandatoryAchieved, 0)).toBe(f.mandatoryAchieved)
  })

  it("v2 report with a cohort filter equals the cohort facts", () => {
    const fc = facts(s, { ...DEFAULT_SCOPE, cohort: "BSN 2027" })
    const sum = reportSummary(s, { ...NO_FILTERS, cohort: "BSN 2027" })
    expect([sum.students, sum.behind, sum.mandatoryAchievedPct]).toEqual([fc.studentsInScope, fc.behind, fc.achievedPct])
  })

  it("Maya's student home equals her row on the dashboard drill, under every scope that includes her", () => {
    const m = buildStudent(s, IDS.maya)!
    for (const { scope } of SCOPES.filter((x) => !x.scope.cohort || x.scope.cohort === "BSN 2027")) {
      const row = buildDrill(s, scope, { list: "students" }).students!.find((r) => r.id === IDS.maya)
      if (scope.course && !row) continue
      if (scope.course) continue // a course scope narrows the required set to one course, by definition
      expect(row, JSON.stringify(scope)).toBeDefined()
      expect(m.counts.required).toBe(row!.required)
      expect(m.counts.achieved).toBe(row!.achieved)
      expect(m.behind).toBe(row!.behind)
    }
    expect(mandatoryProgress(s, IDS.maya)).toHaveLength(m.counts.required)
    expect(mandatoryProgress(s, IDS.maya).filter((x) => x.achieved)).toHaveLength(m.counts.achieved)
  })

  it("Maya's waiting count equals the open rows on My requests", () => {
    const m = buildStudent(s, IDS.maya)!
    const groups = requestGroups(s, IDS.maya)
    expect(groups.reduce((t, g) => t + g.waiting.length, 0)).toBe(m.counts.waiting)
    expect(groups.reduce((t, g) => t + g.returned.length, 0)).toBe(m.counts.returned)
  })

  it("Maya's story: one returned submission and one did-not-qualify skill, both in her next actions", () => {
    const m = buildStudent(s, IDS.maya)!
    expect(m.counts.returned).toBe(1)
    expect(m.next.some((x) => x.kind === "returned")).toBe(true)
    expect(m.next.some((x) => x.kind === "dnq")).toBe(true)
  })

  it("unverified evaluators: one number on the directory and the facts", () => {
    expect(directory(s).summary.awaiting).toBe(f.unverifiedEvaluators)
    expect(directory(s).summary.evaluators).toBe(f.evaluators)
    expect(f.unverifiedEvaluators).toBe(14)
  })

  it("two required sets, named apart, never mixed in one figure (decision D-X12)", () => {
    const pop = populationRows(s)
    for (const r of pop.rows) expect(r.required, r.id).toBe(requiredSkillsFor(s, r.id).length)
    const grad = requiredToComplete(s)
    expect(f.requiredToGraduate).toBe(grad.length)
    const readiness = buildReadiness(s, { ...DEFAULT_SCOPE, cohort: "BSN 2026" })
    expect(readiness.required.map((k) => k.id)).toEqual(grad.map((k) => k.id))
    for (const r of readiness.rows) expect(r.required, r.id).toBe(grad.length)
    // The sets really differ, so a mix would show: the graduating cohort's term set is far smaller than the graduation list.
    const g26 = pop.rows.find((r) => r.cohort === "BSN 2026")!
    expect(g26.required).toBeLessThan(grad.length)
    expect(REQUIRED_SET_LABEL).toEqual({ thisTerm: "Required this term", toGraduate: "Required to graduate" })
  })

  it("deactivated skills count in no figure (SL-11, decision D-X14)", () => {
    const inactive = new Set(s.skills.filter((k) => k.active === false).map((k) => k.id))
    expect(inactive.size).toBe(f.skillsInactive)
    expect(f.skillsInactive).toBeGreaterThan(0)
    for (const r of populationRows(s).rows) for (const id of r.requiredIds) expect(inactive.has(id), id).toBe(false)
    for (const k of requiredToComplete(s)) expect(inactive.has(k.id)).toBe(false)
    for (const x of buildDrill(s, DEFAULT_SCOPE, { list: "skills" }).skills!) expect(inactive.has(x.skillId)).toBe(false)
  })

  it("placements ending: one window constant, one count", () => {
    expect(f.placementsEnding).toBe(placementsEnding(s, populationRows(s).ids).length)
    expect(f.placementsEnding).toBeGreaterThan(0)
  })

  it("the director story is in the data: verifications, the rule change and the answered request", () => {
    expect((s.verifications ?? []).length).toBe(2)
    expect((s.ruleChanges ?? []).length).toBe(1)
    expect(s.evaluations.some((e) => e.id.startsWith("ev-g-answer-") && e.outcome === "not-met")).toBe(true)
    const { state, ruleChanges } = directorFixture(s)
    expect(state).toBe(s)
    expect(ruleChanges.map((r) => r.skillId)).toEqual((s.ruleChanges ?? []).map((r) => r.skillId))
  })

  it("export fields are populated: self-evaluations and review notes (REQ RP-10)", () => {
    expect(s.evaluations.filter((e) => e.self).length).toBeGreaterThan(1000)
    expect(s.evaluations.filter((e) => e.review?.note).length).toBeGreaterThan(100)
  })

  it("the student population row is the one every per-student view reads", () => {
    const pop = populationRows(s)
    const pace = new Map(paceRows(s).map((r) => [r.studentId, r]))
    for (const r of pop.rows) {
      expect(pace.get(r.id)!.achieved).toBe(r.achieved)
      expect(pace.get(r.id)!.behindBy).toBe(r.behindBy)
    }
  })
})
