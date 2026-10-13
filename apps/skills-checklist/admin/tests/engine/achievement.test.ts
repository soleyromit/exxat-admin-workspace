import { describe, expect, it } from "vitest"
import { buildRecords, evaluateSkill, isEligible, stateRank } from "@/lib/engine"
import {
  bin,
  binary,
  configured,
  demo,
  demoModel,
  ev,
  ivEvidence,
  ivSkill,
  questionModel,
  skill,
  woundCare,
  yesNo,
} from "./fixtures"

describe("ENG-1 count only complete, approved-when-required, qualifying evidence (AE-01, AE-02, AR-06)", () => {
  const s = configured(binary(), { criteria: { requiredCount: 2, levelMinimums: {}, settingMinimums: {} } })

  it("incomplete evidence never counts", () => {
    const r = evaluateSkill(s, [ev(bin("a"), { complete: false }), ev(bin("a"))])
    expect(r.qualifyingCount).toBe(1)
  })

  it("evidence that does not qualify under the current rule is not counted", () => {
    const r = evaluateSkill(s, [ev(bin("b")), ev(bin("a"))])
    expect(r.qualifyingCount).toBe(1)
  })

  it("when approval is required, only approved evidence counts; pending and returned are excluded", () => {
    const sa = configured(binary(), { requiresApproval: true, criteria: { requiredCount: 1, levelMinimums: {}, settingMinimums: {} } })
    expect(evaluateSkill(sa, [ev(bin("a"), { approval: "pending" })]).qualifyingCount).toBe(0)
    expect(evaluateSkill(sa, [ev(bin("a"), { approval: "returned" })]).qualifyingCount).toBe(0)
    expect(evaluateSkill(sa, [ev(bin("a"), { approval: "approved" })]).qualifyingCount).toBe(1)
  })

  it("when approval is NOT required, the approval field is ignored", () => {
    expect(evaluateSkill(s, [ev(bin("a"), { approval: "pending" })]).qualifyingCount).toBe(1)
  })

  it("isEligible mirrors the rule: complete and approval satisfied", () => {
    const sa = configured(binary(), { requiresApproval: true })
    expect(isEligible(ev(bin("a"), { approval: "approved" }), sa)).toBe(true)
    expect(isEligible(ev(bin("a"), { approval: "pending" }), sa)).toBe(false)
    expect(isEligible(ev(bin("a"), { complete: false, approval: "approved" }), sa)).toBe(false)
  })
})

describe("ENG-2 achieved <=> count >= N and every per-level and per-setting minimum (AE-03, SC-10)", () => {
  it("IV Insertion worked example: 7 demos (Obs 2/1, Assist 1/1, Ind 4/3) is achieved", () => {
    const r = evaluateSkill(ivSkill(), ivEvidence())
    expect(r.qualifyingCount).toBe(7)
    expect(r.perLevel).toEqual({ obs: 2, assist: 1, ind: 4 })
    expect(r.state).toBe("achieved")
    expect(r.unmet).toEqual([])
  })

  it("removing one Independent still achieves (3/3)", () => {
    const e = ivEvidence()
    const idx = e.findIndex((x) => x.responses.kind === "demonstration" && x.responses.levelId === "ind")
    e.splice(idx, 1)
    expect(evaluateSkill(ivSkill(), e).state).toBe("achieved")
  })

  it("removing the With assistance one is NOT achieved although total 6 >= 5", () => {
    const e = ivEvidence().filter((x) => !(x.responses.kind === "demonstration" && x.responses.levelId === "assist"))
    const r = evaluateSkill(ivSkill(), e)
    expect(r.qualifyingCount).toBe(6)
    expect(r.state).toBe("partial")
    expect(r.unmet).toEqual([{ rule: "levelMinimum", levelId: "assist", needed: 1, have: 0 }])
  })

  it("total below N is partial even when all level minimums are met", () => {
    const e = [ev(demo("obs")), ev(demo("assist")), ev(demo("ind")), ev(demo("ind")), ev(demo("ind"))].slice(0, 4)
    const r = evaluateSkill(ivSkill(), e)
    expect(r.state).toBe("partial")
    expect(r.unmet.some((u) => u.rule === "requiredCount" && u.needed === 5 && u.have === 4)).toBe(true)
  })

  it("DEFECT-07 Wound Care: 4 of 4 demonstrations but no Inpatient or Emergency evidence is NOT achieved, with structured reasons", () => {
    const e = [
      ev(demo("assist"), { clinicalSettingId: "outpatient" }),
      ev(demo("ind"), { clinicalSettingId: "outpatient" }),
      ev(demo("ind"), { clinicalSettingId: "perioperative" }),
      ev(demo("obs"), { clinicalSettingId: "perioperative" }),
    ]
    const r = evaluateSkill(woundCare(), e)
    expect(r.qualifyingCount).toBe(4) // 4 / 4 demonstrations
    expect(r.state).toBe("partial")
    expect(r.unmet).toEqual([
      { rule: "settingMinimum", settingId: "inpatient", needed: 1, have: 0, labEvidence: 0 },
      { rule: "settingMinimum", settingId: "emergency", needed: 1, have: 0, labEvidence: 0 },
    ])
  })

  it("Wound Care becomes achieved once Inpatient and Emergency clinical evidence exist", () => {
    const e = [
      ev(demo("assist"), { clinicalSettingId: "inpatient" }),
      ev(demo("ind"), { clinicalSettingId: "emergency" }),
      ev(demo("ind"), { clinicalSettingId: "outpatient" }),
      ev(demo("obs"), { clinicalSettingId: "outpatient" }),
    ]
    expect(evaluateSkill(woundCare(), e).state).toBe("achieved")
  })
})

describe("ENG-5 lab evidence never satisfies a clinical setting; settings counted per setting (SC-11, SC-12)", () => {
  const s = configured(binary(), {
    criteria: { requiredCount: 2, levelMinimums: {}, settingMinimums: { inpatient: 1, emergency: 1 } },
  })

  it("lab evidence counts toward the total but not toward any setting", () => {
    const e = [
      ev(bin("a"), { performedIn: "lab", clinicalSettingId: undefined }),
      ev(bin("a"), { performedIn: "lab", clinicalSettingId: undefined }),
    ]
    const r = evaluateSkill(s, e)
    expect(r.qualifyingCount).toBe(2)
    expect(r.perSetting).toEqual({ inpatient: 0, emergency: 0 })
    expect(r.state).toBe("partial")
  })

  it("lab evidence carrying a stray clinicalSettingId still does not count for that setting", () => {
    const e = [
      ev(bin("a"), { performedIn: "lab", clinicalSettingId: "inpatient" }),
      ev(bin("a"), { performedIn: "clinical", clinicalSettingId: "emergency" }),
    ]
    const r = evaluateSkill(s, e)
    expect(r.perSetting).toEqual({ inpatient: 0, emergency: 1 })
    expect(r.unmet).toEqual([{ rule: "settingMinimum", settingId: "inpatient", needed: 1, have: 0, labEvidence: 1 }])
  })

  it("each setting is counted separately, never as one clinical total", () => {
    const e = [ev(bin("a"), { clinicalSettingId: "inpatient" }), ev(bin("a"), { clinicalSettingId: "inpatient" })]
    const r = evaluateSkill(s, e)
    expect(r.perSetting).toEqual({ inpatient: 2, emergency: 0 })
    expect(r.state).toBe("partial")
  })

  it("achieved once each named setting has its own clinical evidence", () => {
    const e = [ev(bin("a"), { clinicalSettingId: "inpatient" }), ev(bin("a"), { clinicalSettingId: "emergency" })]
    expect(evaluateSkill(s, e).state).toBe("achieved")
  })
})

describe("ENG-6 one record per skill across courses (CM-07, AE-05), SH-06 narrowing", () => {
  const s = configured(binary(), { criteria: { requiredCount: 2, levelMinimums: {}, settingMinimums: {} } })

  it("evidence from two courses counts toward the same record", () => {
    const e = [ev(bin("a"), { courseId: "c1" }), ev(bin("a"), { courseId: "c2" })]
    const recs = buildRecords({ skills: [s], evidence: e })
    expect(recs).toHaveLength(1)
    expect(recs[0].evaluation.qualifyingCount).toBe(2)
    expect(recs[0].evaluation.state).toBe("achieved")
  })

  it("narrowing to one course recomputes from that course only", () => {
    const e = [ev(bin("a"), { courseId: "c1" }), ev(bin("a"), { courseId: "c2" })]
    const recs = buildRecords({ skills: [s], evidence: e, filter: { courseId: "c1" } })
    expect(recs[0].evaluation.qualifyingCount).toBe(1)
    expect(recs[0].evaluation.state).toBe("partial")
  })

  it("two students never share a record", () => {
    const e = [ev(bin("a"), { studentId: "s1" }), ev(bin("a"), { studentId: "s2" })]
    expect(buildRecords({ skills: [s], evidence: e })).toHaveLength(2)
  })
})

describe("ENG-7 four states, exactly one (AE-04)", () => {
  const s = configured(questionModel(2, { kind: "all" }), { criteria: { requiredCount: 2, levelMinimums: {}, settingMinimums: {} } })

  it("no evidence yet", () => {
    expect(evaluateSkill(s, []).state).toBe("noEvidence")
  })
  it("only incomplete or unapproved evidence is still 'no evidence yet' [INFER: eligible evidence defines 'evidence']", () => {
    const sa = configured(binary(), { requiresApproval: true })
    expect(evaluateSkill(sa, [ev(bin("a"), { approval: "pending" })]).state).toBe("noEvidence")
    expect(evaluateSkill(s, [ev(yesNo(true, true), { complete: false })]).state).toBe("noEvidence")
  })
  it("evidence exists but none qualifies", () => {
    expect(evaluateSkill(s, [ev(yesNo(true, false))]).state).toBe("evidenceDoesNotQualify")
  })
  it("some qualifying evidence, criteria not met", () => {
    expect(evaluateSkill(s, [ev(yesNo(true, true)), ev(yesNo(false, false))]).state).toBe("partial")
  })
  it("achieved", () => {
    expect(evaluateSkill(s, [ev(yesNo(true, true)), ev(yesNo(true, true))]).state).toBe("achieved")
  })
  it("stateRank orders the four states", () => {
    expect(stateRank("noEvidence")).toBeLessThan(stateRank("evidenceDoesNotQualify"))
    expect(stateRank("evidenceDoesNotQualify")).toBeLessThan(stateRank("partial"))
    expect(stateRank("partial")).toBeLessThan(stateRank("achieved"))
  })
})

describe("RP-08 filtering by location or setting recomputes counting only matching evidence", () => {
  const s = configured(binary(), {
    criteria: { requiredCount: 2, levelMinimums: {}, settingMinimums: { inpatient: 1 } },
  })
  const e = [
    ev(bin("a"), { locationId: "L1", clinicalSettingId: "inpatient" }),
    ev(bin("a"), { locationId: "L1", clinicalSettingId: "emergency" }),
    ev(bin("a"), { locationId: "L2", clinicalSettingId: "inpatient" }),
  ]
  it("no filter: achieved", () => {
    expect(evaluateSkill(s, e).state).toBe("achieved")
  })
  it("location filter L1 keeps 2 pieces of evidence", () => {
    const r = evaluateSkill(s, e, { locationId: "L1" })
    expect(r.qualifyingCount).toBe(2)
    expect(r.perSetting.inpatient).toBe(1)
  })
  it("setting filter emergency leaves the inpatient minimum unmet", () => {
    const r = evaluateSkill(s, e, { clinicalSettingId: "emergency" })
    expect(r.qualifyingCount).toBe(1)
    expect(r.state).toBe("partial")
  })
  it("performedIn lab filter excludes clinical evidence", () => {
    expect(evaluateSkill(s, e, { performedIn: "lab" }).state).toBe("noEvidence")
  })
})

describe("SL-11 / IM-09 scope: inactive and unconfigured skills leave the records, evidence is retained", () => {
  it("inactive skills are excluded from records but the evidence array is untouched", () => {
    const s = configured(binary(), { active: false })
    const e = [ev(bin("a"))]
    expect(buildRecords({ skills: [s], evidence: e })).toEqual([])
    expect(e).toHaveLength(1)
  })
  it("unconfigured skills (no model) never produce a record", () => {
    expect(buildRecords({ skills: [skill(null)], evidence: [ev(bin("a"))] })).toEqual([])
  })
  it("reactivating restores the record from retained evidence", () => {
    const e = [ev(bin("a"))]
    const off = buildRecords({ skills: [configured(binary(), { active: false })], evidence: e })
    const on = buildRecords({ skills: [configured(binary(), { active: true })], evidence: e })
    expect(off).toHaveLength(0)
    expect(on[0].evaluation.state).toBe("achieved")
  })
  it("studentIds lets a student with no evidence still get a 'no evidence yet' record", () => {
    const recs = buildRecords({ skills: [configured(binary())], evidence: [], studentIds: ["s9"] })
    expect(recs).toHaveLength(1)
    expect(recs[0].evaluation.state).toBe("noEvidence")
  })
})

describe("demonstration level handling", () => {
  it("[INFER] evidence at a removed level counts toward the total but toward no level minimum", () => {
    const s = configured(demoModel(), { criteria: { requiredCount: 2, levelMinimums: { ind: 1 }, settingMinimums: {} } })
    const r = evaluateSkill(s, [ev(demo("gone")), ev(demo("gone"))])
    expect(r.qualifyingCount).toBe(2)
    expect(r.perLevel).toEqual({ obs: 0, assist: 0, ind: 0 })
    expect(r.state).toBe("partial")
  })
})
