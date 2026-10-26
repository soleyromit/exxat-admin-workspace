import { describe, expect, it } from "vitest"
import { createSeed } from "@/lib/v2/seed"
import { createV2Store } from "@/lib/v2/store"
import { facts, type Facts } from "@/lib/v2/facts"
import { approvalEntries, approvalsBadgeCount, approvalsInScope, approvalTotals, heldState } from "@/lib/v2/approvals"
import { DEFAULT_SCOPE, populationRows, requiredToComplete } from "@/lib/v2/population"
import { deleteSkill, mappedCourses, setSkillsActive, trackedAgainst } from "@/lib/v2/admin-actions"
import { skillProgress } from "@/lib/v2/student"
import { buildDashboard, buildDrill } from "@/lib/lab/dashboard"
import { buildAttainment } from "@/lib/lab/attainment"
import { buildReadiness } from "@/lib/lab/director"
import { buildLibrary } from "@/lib/lab/library"
import { deleteImpact, retireImpact } from "@/lib/lab/retire"
import { applyDecisions, commitDecision, commitDecisions, labState, reviewRows, scopeRows, type Decision } from "@/lib/lab/reviewer"
import { buildStudent } from "@/lib/lab/student"
import type { LabScope } from "@/lib/lab/scope"
import type { V2State } from "@/lib/v2/types"

/**
 * Writes through the shared store change every figure together (Romit: "no inconsistencies in data or visual"; decisions D-X14,
 * D-X15; reviewer decisions persisted). Each consumer is checked against lib/v2/facts.ts after the write, not against a constant.
 */

const AT = "2026-10-26T10:00:00.000Z"
const ADMIN = "adm-ross"
const scope = DEFAULT_SCOPE as LabScope

function mem(): Storage {
  const m = new Map<string, string>()
  return {
    get length() {
      return m.size
    },
    key: (i) => Array.from(m.keys())[i] ?? null,
    getItem: (k) => (m.has(k) ? m.get(k)! : null),
    setItem: (k, v) => void m.set(k, String(v)),
    removeItem: (k) => void m.delete(k),
    clear: () => m.clear(),
  }
}

/** Every consumer that renders a headline figure, compared with the facts of the same state. */
function expectConsumersAgree(s: V2State, label: string) {
  const f = facts(s, scope)
  const d = buildDashboard(s, scope)
  const k = Object.fromEntries(d.kpis.map((x) => [x.id, x]))
  expect(k.achieved.description, label).toBe(`${f.mandatoryAchieved.toLocaleString("en-US")} of ${f.mandatoryRecords.toLocaleString("en-US")}`)
  expect(k.approval.value, label).toBe(f.awaitingApproval)
  expect(d.heroValue, label).toBe(f.behind)
  const skills = buildDrill(s, scope, { list: "skills" }).skills!
  expect(skills.reduce((t, x) => t + x.students, 0), label).toBe(f.mandatoryRecords)
  expect(skills.reduce((t, x) => t + x.achieved, 0), label).toBe(f.mandatoryAchieved)
  expect(buildDrill(s, scope, { list: "requests", cond: "approval" }).count, label).toBe(f.awaitingApproval)
  const att = buildAttainment(s, scope)
  expect(att.total, label).toBe(f.mandatoryRecords)
  expect(att.totals.achieved, label).toBe(f.mandatoryAchieved)
  expect(att.behind, label).toBe(f.behind)
  const r = buildReadiness(s, scope)
  expect(r.rows.length, label).toBe(f.studentsInScope)
  expect(r.required.length, label).toBe(f.requiredToGraduate)
  expect(approvalsBadgeCount(s, scope), label).toBe(f.awaitingApproval)
  const held = labState(s)
  expect(scopeRows(held, reviewRows(held), scope).rows.length, label).toBe(f.awaitingApproval)
  return f
}

describe("deactivate and reactivate write the shared store; every figure moves together (D-X14)", () => {
  const s0 = createSeed()
  const f0 = facts(s0)
  const pop0 = populationRows(s0)
  // A skill with evidence that is required this term for many students and required to graduate.
  const grad = new Set(requiredToComplete(s0).map((k) => k.id))
  const reqFor = new Map<string, number>()
  for (const r of pop0.rows) for (const id of r.requiredIds) reqFor.set(id, (reqFor.get(id) ?? 0) + 1)
  const target = [...reqFor].filter(([id]) => grad.has(id)).sort((a, b) => b[1] - a[1])[0]![0]
  const achievedOn = pop0.rows.filter((r) => r.requiredIds.includes(target) && !r.open.some((o) => o.skillId === target)).length

  it("the target has evidence, is required this term and to graduate", () => {
    expect(trackedAgainst(s0, target).evaluations).toBeGreaterThan(0)
    expect(reqFor.get(target)).toBeGreaterThan(10)
  })

  const off = setSkillsActive(s0, [target], false, ADMIN, AT)
  if (!off.ok) throw new Error(off.error)
  const s1 = off.state

  it("drops the skill's records from the facts by exactly its students", () => {
    const f1 = facts(s1)
    expect(f1.skillsInactive).toBe(f0.skillsInactive + 1)
    expect(f1.mandatoryRecords).toBe(f0.mandatoryRecords - reqFor.get(target)!)
    expect(f1.mandatoryAchieved).toBe(f0.mandatoryAchieved - achievedOn)
    expect(f1.requiredToGraduate).toBe(f0.requiredToGraduate - 1)
    expect(f1.skillsTotal).toBe(f0.skillsTotal)
  })

  it("dashboard, drills, attainment, director, badge and queue agree after the write", () => {
    expectConsumersAgree(s0, "before")
    expectConsumersAgree(s1, "deactivated")
    for (const r of populationRows(s1).rows) expect(r.requiredIds).not.toContain(target)
    expect(buildReadiness(s1, scope).required.map((k) => k.id)).not.toContain(target)
    expect(buildDrill(s1, scope, { list: "skills" }).skills!.map((x) => x.skillId)).not.toContain(target)
  })

  it("the library reads the flag (no overlay) and the evidence is kept", () => {
    expect(buildLibrary(s1).find((r) => r.id === target)?.status).toBe("inactive")
    expect(trackedAgainst(s1, target).evaluations).toBe(trackedAgainst(s0, target).evaluations)
    expect(retireImpact(s1, target)!.requiredFor).toBe(0)
  })

  it("reactivating restores every figure exactly", () => {
    const on = setSkillsActive(s1, [target], true, ADMIN, AT)
    if (!on.ok) throw new Error(on.error)
    expect(facts(on.state)).toEqual(f0)
    expectConsumersAgree(on.state, "reactivated")
    expect(buildLibrary(on.state).find((r) => r.id === target)?.status).not.toBe("inactive")
  })

  it("a seed-inactive skill can be reactivated through the store, and back", () => {
    const seedOff = s0.skills.find((k) => k.active === false)!
    const on = setSkillsActive(s0, [seedOff.id], true, ADMIN, AT)
    if (!on.ok) throw new Error(on.error)
    expect(facts(on.state).skillsInactive).toBe(f0.skillsInactive - 1)
    const back = setSkillsActive(on.state, [seedOff.id], false, ADMIN, AT)
    if (!back.ok) throw new Error(back.error)
    expect(facts(back.state)).toEqual(f0)
  })

  it("persists as a delta and survives a reload", () => {
    const storage = mem()
    const a = createV2Store({ storage })
    a.hydrate()
    a.update((s) => {
      const r = setSkillsActive(s, [target], false, ADMIN, AT)
      return r.ok ? r.state : s
    })
    const b = createV2Store({ storage })
    b.hydrate()
    expect(facts(b.getSnapshot())).toEqual(facts(s1))
  })
})

describe("delete: only while nothing is tracked; mapped courses are listed and unmapped (D-X15)", () => {
  const s0 = createSeed()
  const free = s0.skills.find((k) => trackedAgainst(s0, k.id).total === 0 && mappedCourses(s0, k.id).length > 0)!

  it("a mapped skill with nothing tracked can be deleted; the dialog list equals what is unmapped", () => {
    expect(free).toBeDefined()
    const impact = deleteImpact(s0, free.id)!
    expect(impact.allowed).toBe(true)
    const row = buildLibrary(s0).find((r) => r.id === free.id)!
    expect(row.canDelete).toBe(true)
    expect(row.unmapFrom).toEqual(impact.unmapFrom)
    const r = deleteSkill(s0, free.id, ADMIN, AT)
    if (!r.ok) throw new Error(r.error)
    expect(r.unmapped).toEqual(impact.unmapFrom)
    expect(r.state.skills.some((k) => k.id === free.id)).toBe(false)
    expect(r.state.mappings.some((m) => m.skillId === free.id)).toBe(false)
    expect(facts(r.state).skillsTotal).toBe(facts(s0).skillsTotal - 1)
    expectConsumersAgree(r.state, "deleted")
  })

  it("a skill with evidence cannot be deleted, in the store and on the library row", () => {
    const used = s0.skills.find((k) => trackedAgainst(s0, k.id).evaluations > 0)!
    expect(deleteSkill(s0, used.id, ADMIN, AT).ok).toBe(false)
    expect(buildLibrary(s0).find((r) => r.id === used.id)!.canDelete).toBe(false)
    expect(retireImpact(s0, used.id)!.canDelete).toBe(false)
  })
})

describe("reviewer decisions are written to the shared store; every consumer reads them", () => {
  const s0 = createSeed()
  const f0 = facts(s0)
  const entries = approvalsInScope(s0).entries
  const sub = entries.find((e) => e.kind === "submission" && !e.needsOutcome && e.evaluations.every((x) => x.outcome === "met"))!
  const unv = entries.find((e) => e.kind === "unverified")!

  it("approve: the entry leaves the badge, queue, dashboard and drill; the student's evidence counts", () => {
    const s1 = commitDecision(s0, { kind: "approve", key: sub.key })
    const f1 = expectConsumersAgree(s1, "approved")
    expect(f1.awaitingApproval).toBe(f0.awaitingApproval - 1)
    expect(f1.awaitingApprovalEvaluations).toBe(f0.awaitingApprovalEvaluations - sub.evaluations.length)
    expect(f1.awaitingApprovalStatusRows).toBe(f0.awaitingApprovalStatusRows - sub.evaluations.length)
    expect(f1.awaitingApprovalUnverifiedRows).toBe(f0.awaitingApprovalUnverifiedRows)
    const skill = sub.skillIds[0]
    expect(skillProgress(heldState(s1), sub.studentId, skill)!.counted).toBe(skillProgress(heldState(s0), sub.studentId, skill)!.counted + sub.evaluations.filter((e) => e.skillId === skill).length)
    expect(buildStudent(s1, sub.studentId)!.counts.waiting).toBe(buildStudent(s0, sub.studentId)!.counts.waiting - 1)
  })

  it("return: the entry leaves the queue and the student sees one more returned submission", () => {
    const s1 = commitDecision(s0, { kind: "return", key: sub.key, note: "Add the date of the evaluation.", path: "correct-same" })
    const f1 = expectConsumersAgree(s1, "returned")
    expect(f1.awaitingApproval).toBe(f0.awaitingApproval - 1)
    expect(buildStudent(s1, sub.studentId)!.counts.returned).toBe(buildStudent(s0, sub.studentId)!.counts.returned + 1)
  })

  it("adopt: the evaluator's held evidence counts, the name is adopted, the status split stays honest", () => {
    const s1 = commitDecision(s0, { kind: "adopt", evaluatorId: unv.evaluatorId!, mode: "adopt" })
    const f1 = expectConsumersAgree(s1, "adopted")
    const theirs = approvalEntries(s0).filter((e) => e.kind === "unverified" && e.evaluatorId === unv.evaluatorId)
    const inScope = entries.filter((e) => e.kind === "unverified" && e.evaluatorId === unv.evaluatorId)
    expect(theirs.length).toBeGreaterThan(0)
    expect(f1.awaitingApproval).toBe(f0.awaitingApproval - inScope.length)
    expect(f1.unverifiedEvaluators).toBe(f0.unverifiedEvaluators - 1)
    // Stored "awaiting approval" rows are untouched: only the adopted name's rows left the unverified split.
    expect(f1.awaitingApprovalStatusRows).toBe(f0.awaitingApprovalStatusRows)
    expect(f1.awaitingApprovalUnverifiedRows).toBe(f0.awaitingApprovalUnverifiedRows - inScope.reduce((t, e) => t + e.evaluations.length, 0))
    expect(f1.mandatoryAchieved).toBeGreaterThanOrEqual(f0.mandatoryAchieved)
  })

  it("merge: the evidence moves to the existing evaluator and counts", () => {
    const into = s0.people.find((p) => p.kind === "preceptor" && p.verified !== false)!
    const s1 = commitDecision(s0, { kind: "adopt", evaluatorId: unv.evaluatorId!, mode: "merge", intoId: into.id })
    expectConsumersAgree(s1, "merged")
    const moved = unv.evaluations.map((e) => s1.evaluations.find((x) => x.id === e.id)!)
    expect(moved.every((e) => e.evaluatorId === into.id && e.status === "counted")).toBe(true)
  })

  it("the store form and the lab form agree on every figure the queue drives", () => {
    const ds: Decision[] = [{ kind: "approve", key: sub.key }, { kind: "adopt", evaluatorId: unv.evaluatorId!, mode: "adopt" }]
    const viaStore = facts(commitDecisions(s0, ds))
    const viaLab = facts(applyDecisions(s0, ds))
    const pick = (f: Facts) => [f.awaitingApproval, f.awaitingApprovalEvaluations, f.mandatoryAchieved, f.mandatoryRecords, f.behind, f.unverifiedEvaluators]
    expect(pick(viaStore)).toEqual(pick(viaLab))
  })

  it("leaves undecided evidence from unadopted names as the store had it (no held copy written back)", () => {
    const s1 = commitDecision(s0, { kind: "approve", key: sub.key })
    const changed = s1.evaluations.filter((e, i) => e !== s0.evaluations[i])
    expect(changed.map((e) => e.id).sort()).toEqual(sub.evaluations.map((e) => e.id).sort())
    expect(approvalTotals(s1, approvalsInScope(s1).entries).unverifiedRows).toBe(f0.awaitingApprovalUnverifiedRows)
  })

  it("a correction request changes nothing in the store", () => {
    expect(commitDecision(s0, { kind: "correction", evaluationId: s0.evaluations[0].id, note: "x" })).toBe(s0)
  })

  it("persists as a delta and survives a reload", () => {
    const storage = mem()
    const a = createV2Store({ storage })
    a.hydrate()
    a.update((s) => commitDecision(s, { kind: "approve", key: sub.key }))
    const b = createV2Store({ storage })
    b.hydrate()
    expect(facts(b.getSnapshot()).awaitingApproval).toBe(f0.awaitingApproval - 1)
    expect(approvalsBadgeCount(b.getSnapshot())).toBe(f0.awaitingApproval - 1)
  })
})
