import { describe, expect, it } from "vitest"
import { SCENARIO, buildSeed } from "@/lib/seed"
import * as S from "@/lib/store"
import { seed } from "./helpers"

describe("seed: deterministic and SAMPLE-only (SL-01)", () => {
  it("builds the identical database every time (no clock, no Math.random)", () => {
    expect(seed()).toEqual(seed())
  })

  it("has the requested shape: ~12 skills over all 4 models, 3 categories, 3 active tags, 5 settings, 2 lab instructors, 14 offerings, 40 students", () => {
    const db = seed()
    expect(db.skills).toHaveLength(12)
    expect(new Set(db.skills.map((s) => s.model?.kind).filter(Boolean))).toEqual(new Set(["binary", "question", "scored", "demonstration"]))
    expect(db.categories).toHaveLength(3)
    expect(db.tags.filter((t) => t.active)).toHaveLength(3)
    expect(db.clinicalSettings).toHaveLength(5)
    expect(db.labInstructors).toHaveLength(2)
    expect(db.offerings).toHaveLength(14)
    expect(db.students).toHaveLength(40)
  })

  it("has exactly 2 unconfigured skills that arrived by import, and they are not in reporting scope (IM-09, IM-10)", () => {
    const db = seed()
    expect(S.unconfiguredCount(db)).toBe(2)
    const unconf = db.skills.filter((s) => s.model === null)
    expect(unconf.every((s) => s.importBatchId === "imp-1")).toBe(true)
    expect(S.reportBySkill(db, {}).rows.some((r) => unconf.some((u) => u.id === r.skill.id))).toBe(false)
  })

  it("has skills with per-level minimums, per-setting minimums, approval + self-evaluation, and a mandatory comment", () => {
    const db = seed()
    expect(db.skills.some((s) => Object.keys(s.criteria.levelMinimums).length > 0)).toBe(true)
    expect(db.skills.some((s) => Object.keys(s.criteria.settingMinimums).length > 0)).toBe(true)
    expect(db.skills.filter((s) => s.requiresApproval && s.selfEvaluation)).toHaveLength(1)
    expect(db.skills.filter((s) => s.evaluatorComment === "mandatory").length).toBeGreaterThanOrEqual(1)
  })

  it("keeps an inactive tag on a skill, flagged inactive (SL-06)", () => {
    const db = seed()
    const row = S.listSkills(db).find((r) => r.skill.id === "sk-vitals")!
    expect(row.tags.find((t) => t.id === "tag-d")?.inactive).toBe(true)
  })

  it("has offerings with no cohort enrolled and the same course across several terms (CM-01, CM-02)", () => {
    const db = seed()
    expect(db.offerings.some((o) => o.cohortIds.length === 0)).toBe(true)
    expect(db.offerings.filter((o) => o.code === "NURS 350").length).toBeGreaterThanOrEqual(3)
  })

  it("makes two different students share a display name (DEFECT-09)", () => {
    const db = seed()
    const names = db.students.map((s) => s.name)
    expect(names.filter((n) => n === "Owen Ashford")).toHaveLength(2)
  })
})

describe("seed: every state is present and DERIVED by the engine, never stored (AE-02)", () => {
  const db = seed()
  const states = new Set(S.reportByStudent(db, {}).rows.flatMap((r) => Object.entries(r.counts).filter(([, n]) => n > 0).map(([k]) => k)))

  it("covers all four skill states (AE-04)", () => {
    expect(states).toEqual(new Set(["noEvidence", "evidenceDoesNotQualify", "partial", "achieved"]))
  })

  it("covers every submission state the contracts show", () => {
    const seen = new Set(db.submissions.map((s) => S.submissionState(db, s)))
    for (const st of ["counted", "didNotMeet", "returned", "revised", "awaitingEvaluator", "awaitingApproval"] as const) expect(seen.has(st), st).toBe(true)
  })

  it("link tokens are unique and opaque", () => {
    const tokens = seed().links.map((l) => l.token)
    expect(new Set(tokens).size).toBe(tokens.length)
    expect(tokens.every((t) => /^[a-z0-9]{24}$/.test(t))).toBe(true)
  })

  it("does not store any status field on records", () => {
    expect(JSON.stringify(db)).not.toMatch(/"state":|"status":"achieved"|didNotMeet/)
  })

  it("Olivia: returned IV (revision 1), revised Medication Administration, waiting Medication Reconciliation, DEFECT-07 Wound Care", () => {
    const olivia = SCENARIO.olivia
    const iv = db.submissions.filter((s) => s.studentId === olivia && s.skillId === "sk-iv")
    const returned = iv.find((s) => S.submissionState(db, s) === "returned")!
    expect(returned.attempt).toBe(5)
    expect(returned.revision).toBe(1)
    expect(S.returnReason(db, returned.id)).toContain("unit")
    const med = db.submissions.filter((s) => s.studentId === olivia && s.skillId === "sk-med")
    expect(med.some((s) => S.submissionState(db, s) === "revised")).toBe(true)
    const recon = db.submissions.filter((s) => s.studentId === olivia && s.skillId === "sk-recon")
    expect(recon.some((s) => S.submissionState(db, s) === "awaitingEvaluator")).toBe(true)
    // DEFECT-07: 4 of 4 demonstrations but missing both clinical-setting minimums.
    const p = S.skillProgress(db, olivia, "sk-wound")!
    expect(p.total).toMatchObject({ have: 4, needed: 4 })
    expect(p.evaluation.state).toBe("partial")
    expect(p.settings.map((s) => [s.name, s.have, s.needed])).toEqual([["Inpatient", 0, 1], ["Emergency", 0, 1]])
  })

  it("Olivia has two placements for one course and one for another (ST-06)", () => {
    const own = db.placements.filter((p) => p.studentId === SCENARIO.olivia)
    expect(own.filter((p) => p.offeringId === "off-350-f26")).toHaveLength(2)
  })

  it("Noah: achieved with evidence spread over three courses (CM-07)", () => {
    const p = S.skillProgress(db, SCENARIO.noah, "sk-iv")!
    expect(p.evaluation.state).toBe("achieved")
    const courses = new Set(S.evidenceLedger(db, SCENARIO.noah, "sk-iv").map((r) => r.offeringId))
    expect(courses.size).toBe(3)
  })

  it("Priya: evidence exists but none qualifies (state 2) and the evaluations did not meet criteria", () => {
    expect(S.skillProgress(db, SCENARIO.priya, "sk-foley")!.evaluation.state).toBe("evidenceDoesNotQualify")
    expect(S.evidenceLedger(db, SCENARIO.priya, "sk-foley").every((r) => r.state === "didNotMeet")).toBe(true)
  })

  it("Jonah and Rina: IV waiting for approval, excluded from achievement (AE-01, AR-06); self-evaluation disagrees for Jonah and agrees for Rina (AR-02)", () => {
    expect(S.skillProgress(db, SCENARIO.rina, "sk-iv")!.evaluation.state).toBe("noEvidence")
    const q = S.reviewQueue(db)
    expect(q.find((i) => i.studentId === SCENARIO.jonah)!.agree).toBe(false)
    expect(q.find((i) => i.studentId === SCENARIO.rina)!.agree).toBe(true)
  })

  it("Marcus: evidence for a skill not mapped to his courses counts (CM-05)", () => {
    const mapped = db.offeringSkillMaps.some((m) => m.skillId === "sk-trach" && ["off-350-f26", "off-350-f25", "off-410-f26"].includes(m.offeringId))
    expect(mapped).toBe(false)
    expect(S.skillProgress(db, SCENARIO.marcus, "sk-trach")!.evaluation.state).toBe("achieved")
  })

  it("Elena: no placement, lab evidence only, a student-named lab instructor not on the roster (ST-07, SL-09)", () => {
    expect(db.placements.filter((p) => p.studentId === SCENARIO.elena)).toHaveLength(0)
    const p = S.skillProgress(db, SCENARIO.elena, "sk-o2")!
    expect(p.evaluation.state).toBe("achieved")
    expect(S.labInstructorRows(db).named.map((n) => n.item.name)).toEqual(["R. Whitmore"])
  })
})

describe("seed: the approval queue covers every evaluation model (S-11)", () => {
  it("has waiting evaluations for demonstration, question, scored and binary skills, all derived as awaiting approval", () => {
    const db = buildSeed()
    const queue = S.reviewQueue(db)
    const kinds = new Set(queue.map((i) => db.skills.find((s) => s.id === i.skillId)!.model!.kind))
    expect([...kinds].sort()).toEqual(["binary", "demonstration", "question", "scored"])
    expect(queue.length).toBe(16)
    for (const i of queue) {
      const sub = db.submissions.find((x) => x.id === i.submissionId)!
      expect(S.submissionState(db, sub)).toBe("awaitingApproval")
    }
  })

  it("is deterministic: two builds are identical", () => {
    expect(JSON.stringify(buildSeed())).toBe(JSON.stringify(buildSeed()))
  })
})
