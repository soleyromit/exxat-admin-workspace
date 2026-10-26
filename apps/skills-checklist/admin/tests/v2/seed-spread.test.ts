import { describe, expect, it } from "vitest"
import { queueItems } from "../../lib/v2/queue"
import { behindPace, paceRows } from "../../lib/v2/reports"
import { createSeed, DEMO_TODAY, IDS } from "../../lib/v2/seed"
import { skillProgress } from "../../lib/v2/student"
import { verificationsOf } from "../../lib/v2/verification"

const DAY = 86_400_000
const ageDays = (iso: string) => Math.round((Date.parse(`${DEMO_TODAY}T09:00:00Z`) - Date.parse(iso)) / DAY)

describe("seed spread (charts need an honest cohort)", () => {
  const s = createSeed()

  // The hand-written hero layer: Maya and stu-02 to stu-12. Generated students are covered by dataset-invariants.test.ts.
  const heroIds = new Set(s.people.filter((p) => p.kind === "student" && !p.id.startsWith("stu-g-")).map((p) => p.id))

  it("no evaluator wrote more than 5 percent, and at least 100 evaluators appear", () => {
    const by = new Map<string, number>()
    for (const e of s.evaluations) by.set(e.evaluatorId, (by.get(e.evaluatorId) ?? 0) + 1)
    expect(by.size).toBeGreaterThanOrEqual(100)
    expect(Math.max(...by.values()) / s.evaluations.length).toBeLessThanOrEqual(0.05)
  })

  it("the hand-written students' mandatory attainment runs from about 15 to 85 percent and 4 to 5 are behind pace", () => {
    const rows = paceRows(s).filter((r) => heroIds.has(r.studentId))
    expect(rows).toHaveLength(12)
    const pct = rows.map((r) => r.collected / r.needed)
    expect(Math.min(...pct)).toBeGreaterThanOrEqual(0.1)
    expect(Math.min(...pct)).toBeLessThanOrEqual(0.2)
    expect(Math.max(...pct)).toBeGreaterThanOrEqual(0.8)
    expect(Math.max(...pct)).toBeLessThanOrEqual(0.9)
    const behind = behindPace(s).filter((r) => heroIds.has(r.studentId))
    expect(behind.length).toBeGreaterThanOrEqual(4)
    expect(behind.length).toBeLessThanOrEqual(5)
    // Maya sits exactly on pace (7 of 13 collected, 7 expected; population method since 2026-10-26) and Ethan is ahead.
    const maya = rows.find((r) => r.studentId === IDS.maya)!
    expect([maya.collected, maya.expected, maya.behindBy]).toEqual([7, 7, 0])
    expect(rows.find((r) => r.studentId === "stu-12")!.behindBy).toBe(0)
  })

  it("some students have achieved mandatory skills and some none", () => {
    const achieved = paceRows(s).filter((r) => heroIds.has(r.studentId)).map((r) => r.achieved)
    expect(Math.max(...achieved)).toBeGreaterThanOrEqual(3)
    expect(achieved.filter((n) => n === 0).length).toBeGreaterThanOrEqual(2)
  })

  it("the history mixes outcomes and spans several weeks of dates", () => {
    const outcomes = new Set(s.evaluations.map((e) => e.outcome))
    expect(outcomes).toEqual(new Set(["met", "not-yet", "not-met"]))
    const days = s.evaluations.map((e) => ageDays(e.date))
    expect(Math.max(...days) - Math.min(...days)).toBeGreaterThanOrEqual(42)
    const weeks = new Set(days.map((d) => Math.floor(d / 7)))
    expect(weeks.size).toBeGreaterThanOrEqual(7)
  })

  it("the review queue holds the 9 hand-written items aged 1 to 12 days, and more from the generated cohort", () => {
    const items = queueItems(s)
    const hero = items.filter((q) => !q.key.startsWith("sub-g-")).map((q) => ageDays(q.since))
    expect(hero).toHaveLength(9)
    expect(Math.min(...hero)).toBeLessThanOrEqual(2)
    expect(Math.max(...hero)).toBeGreaterThanOrEqual(10)
    expect(Math.max(...hero)).toBeLessThanOrEqual(12)
    expect(new Set(hero).size).toBeGreaterThanOrEqual(6)
    const all = items.map((q) => ageDays(q.since))
    expect(items.length).toBeGreaterThan(9)
    expect(Math.max(...all)).toBeLessThanOrEqual(14)
  })

  it("keeps the starting conditions the 14-step story depends on", () => {
    // Two story verifications since 2026-10-26 (dataset spec section 12), none for the hand-written students.
    expect(verificationsOf(s)).toHaveLength(2)
    expect(verificationsOf(s).every((v) => v.studentId.startsWith("stu-g-"))).toBe(true)
    expect(s.labBatches ?? []).toHaveLength(0)
    expect(s.evaluations.filter((e) => e.versions.length > 1)).toHaveLength(1)
    // Exactly one hand-written stalled request (sub-03). The generated stalled-site story is asserted in dataset-invariants.test.ts.
    expect(s.submissions.filter((x) => x.status === "stalled" && !x.id.startsWith("sub-g-")).map((x) => x.id)).toEqual(["sub-03"])
    expect(s.submissions.filter((x) => x.studentId === IDS.maya && x.skillIds.length === 2)).toHaveLength(1)
    // The concern points at a real evaluation of the student it names.
    const c = s.concerns[0]
    expect(s.evaluations.find((e) => e.id === c.evaluationId)?.studentId).toBe(c.studentId)
  })

  it("lab and simulation evidence never carries a clinical setting, and every queued evaluation has its request", () => {
    for (const e of s.evaluations) if (e.setting !== "clinical") expect(e.clinicalSetting).toBeUndefined()
    for (const e of s.evaluations.filter((x) => x.status === "awaiting-approval" && x.submissionId)) expect(s.submissions.some((x) => x.id === e.submissionId)).toBe(true)
  })

  it("Maya's evidence is unchanged: vital signs achieved, medication and urinary catheter in progress", () => {
    expect(skillProgress(s, IDS.maya, "sk-vitals")?.achieved).toBe(true)
    expect(skillProgress(s, IDS.maya, IDS.urinaryCath)?.counted).toBe(2)
    expect(skillProgress(s, IDS.maya, "sk-med-admin")?.counted).toBe(1)
  })
})
