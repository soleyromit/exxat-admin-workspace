import { describe, expect, it } from "vitest"
import * as S from "@/lib/store"
import { SCENARIO } from "@/lib/seed"
import { must, seed } from "./helpers"

const db = seed()
const OFF = "off-350-f26"

describe("course skills (ST-01..ST-03)", () => {
  const c = S.courseSkills(db, SCENARIO.olivia, OFF)!

  it("lists the skills the course expects, mandatory first, with progress and the requirement (ST-01)", () => {
    expect(c.mapped.map((r) => [r.skill.name, r.requirement])).toEqual([
      ["Foley Catheter Insertion", "mandatory"],
      ["IV Insertion", "mandatory"],
      ["Medication Administration", "mandatory"],
      ["Wound Care", "mandatory"],
      ["Medication Reconciliation", "nonMandatory"],
    ])
    expect(c.mapped.find((r) => r.skill.id === "sk-recon")!.achievedCanRequestAgain).toBe(true) // EC-25
  })

  it("offers every other usable skill so an unmapped skill can still be submitted; unconfigured skills never appear (ST-02, IM-09)", () => {
    const names = c.other.map((r) => r.skill.id)
    expect(names).toEqual(expect.arrayContaining(["sk-trach", "sk-dressing", "sk-o2"]))
    expect(names).not.toContain("sk-ng")
    expect(c.mapped.length + c.other.length).toBe(c.totalUsable)
  })

  it("the 'only skills I have sent' filter isolates earlier submissions (ST-03)", () => {
    const only = S.courseSkills(db, SCENARIO.olivia, OFF, { onlySent: true })!
    expect([...only.mapped, ...only.other].every((r) => r.sentCount > 0)).toBe(true)
    expect(only.sentCount).toBe(c.sentCount)
  })

  it("shows what is waiting and with whom (SH-02)", () => {
    expect(c.waiting.map((w) => [w.skillName, w.evaluatorName, w.state]).sort()).toEqual([
      ["Medication Administration", "A. Whitfield, RN", "revised"],
      ["Medication Reconciliation", "S. Nakamura, RN", "awaitingEvaluator"],
    ])
  })

  it("a student sees only their own record: another student's evidence never appears (cross-cutting §7)", () => {
    const other = S.courseSkills(db, SCENARIO.rina, OFF)!
    expect(other.mapped.find((r) => r.skill.id === "sk-iv")!.progress.evaluation.qualifyingCount).toBe(0)
    // Rina's own pending IV is the only thing waiting for her; nothing of Olivia's leaks in
    expect(other.waiting.map((w) => db.submissions.find((x) => x.id === w.submissionId)!.studentId)).toEqual([SCENARIO.rina])
    expect(S.studentCourses(db, SCENARIO.olivia).map((x) => x.offering.id)).toEqual(expect.arrayContaining(["off-350-f25", "off-350-f26", "off-410-f26"]))
  })

  it("lists the courses with the student's placements; two placements for one course (ST-06)", () => {
    const courses = S.studentCourses(db, SCENARIO.olivia)
    expect(courses.find((x) => x.offering.id === OFF)!.placements.map((p) => p.locationName)).toEqual(["Harbor Family Practice", "Northgate Surgical Center"])
    expect(S.studentCourses(db, SCENARIO.elena).find((x) => x.offering.id === OFF)!.placements).toEqual([])
  })
})

describe("history (SH-01..SH-07)", () => {
  it("shows every attempt in order, with an explicit outcome and who it is with (SH-01, SH-02)", () => {
    const h = S.skillHistory(db, SCENARIO.olivia, "sk-iv")!
    expect(h.attempts.map((a) => a.ledger.attempt)).toEqual([1, 2, 3, 4, 5])
    expect(h.attempts.map((a) => a.state)).toEqual(["counted", "counted", "counted", "counted", "returned"])
  })

  it("counts counted, outstanding and returned (SH-04)", () => {
    expect(S.skillHistory(db, SCENARIO.olivia, "sk-med")!.counters).toMatchObject({ counted: 2, outstanding: 1, returned: 0 })
  })

  it("narrows to one course while the record covers every course (SH-06, CM-07)", () => {
    const all = S.skillHistory(db, SCENARIO.olivia, "sk-iv")!
    const one = S.skillHistory(db, SCENARIO.olivia, "sk-iv", { offeringId: "off-350-f25" })!
    expect(all.scope.all).toBe(5)
    expect(one.attempts.length).toBeLessThan(all.attempts.length)
    expect(one.progress.evaluation.qualifyingCount).toBe(all.progress.evaluation.qualifyingCount) // the record is shared
  })

  it("gives the failed rule only for completed evaluations that did not meet the criteria (SH-03)", () => {
    const h = S.skillHistory(db, SCENARIO.priya, "sk-foley")!
    expect(h.attempts.every((a) => a.failedRule !== null)).toBe(true)
    expect(S.skillHistory(db, SCENARIO.noah, "sk-iv")!.attempts.every((a) => a.failedRule === null)).toBe(true)
  })

  it("shows the full completed evaluation to the student (SH-07)", () => {
    const a = S.skillHistory(db, SCENARIO.noah, "sk-iv")!.attempts[0]
    expect(a.ledger.recorded).not.toBeNull()
    expect(a.ledger.comment).toBe("Sound technique throughout.")
  })

  it("returns null for an unconfigured skill", () => {
    expect(S.skillHistory(db, SCENARIO.olivia, "sk-ng")).toBeNull()
  })
})

describe("my skills (S-15, derived from SH-06 and CM-07)", () => {
  it("one row per usable skill with the shared record, plus skills deactivated after evidence, flagged", () => {
    expect(S.mySkills(db, SCENARIO.noah)).toHaveLength(10)
    const off = must(S.setSkillActive(db, "sk-iv", false)).db
    const row = S.mySkills(off, SCENARIO.noah).find((r) => r.skill.id === "sk-iv")!
    expect(row.inactiveWithEvidence).toBe(true)
    expect(row.attempts).toBe(7)
    // a deactivated skill with no evidence simply disappears
    expect(S.mySkills(off, SCENARIO.rina).some((r) => r.skill.id === "sk-recon")).toBe(true)
    const none = must(S.setSkillActive(db, "sk-recon", false)).db
    expect(S.mySkills(none, SCENARIO.rina).some((r) => r.skill.id === "sk-recon")).toBe(false)
  })
})

describe("navigation data", () => {
  it("Review and approve is shown only when a skill has administrator approval turned on (SC-15)", () => {
    expect(S.reviewNavVisible(db)).toBe(true)
    const none = { ...db, skills: db.skills.map((s) => ({ ...s, requiresApproval: false })) }
    expect(S.reviewNavVisible(none)).toBe(false)
  })
})
