import { describe, expect, it } from "vitest"
import { createSeed } from "@/lib/v2/seed"
import { skillProgress } from "@/lib/v2/student"
import { skillById } from "@/lib/v2/evidence-index"
import { heldState } from "@/lib/v2/approvals"
import type { Evaluation } from "@/lib/v2/types"
import {
  affectedStudentLine,
  bulkImpact,
  computeImpact,
  configDiff,
  CONFIGURE_STEPS,
  emptyRule,
  extraGaps,
  gapsOf,
  groupImpact,
  groupReason,
  outcomesLabel,
  criteriaKind,
  applyPreset,
  attemptLine,
  hasNeed,
  LAB_MODELS,
  MODEL_LABEL,
  PROPOSED_MODELS,
  partSentence,
  SECTIONS,
  evaluateRule as evaluateRuleRaw,
  isInvalidResult,
  fromV2,
  ruleSentence,
  sampleChange,
  settingNote,
  studentsOf,
  validateRule,
  withModel,
  type LabRule,
} from "@/lib/lab/configure"

const s = createSeed()
const MED = "sk-med-admin"

/** The engine on a rule that is valid (every rule in these tests sets a frequency); an invalid one fails the test loudly. */
const evaluateRule = (r: LabRule, evals: readonly Evaluation[]) => {
  const x = evaluateRuleRaw(r, evals)
  if (isInvalidResult(x)) throw new Error(x.message)
  return x
}

const ev = (over: Partial<Evaluation>): Evaluation => ({
  id: Math.random().toString(36).slice(2),
  studentId: "x",
  skillId: "k",
  evaluatorId: "e1",
  setting: "clinical",
  date: "2026-10-01",
  status: "counted",
  outcome: "met",
  currentVersion: 1,
  versions: [],
  ...over,
})

const binary = (over: Partial<LabRule> = {}): LabRule => ({ ...withModel(emptyRule(), "binary"), qualifyingLabel: 0, evaluatorRoles: ["preceptor"], need: 3, ...over })

describe("configure: no default model", () => {
  it("an empty rule has no model and cannot be published", () => {
    const r = emptyRule()
    expect(r.model).toBeNull()
    expect(validateRule(r).map((i) => i.id)).toEqual(["cfg-model:missing"])
    expect(ruleSentence(r)).toMatch(/No rule yet/)
  })
  it("binary needs an explicitly chosen qualifying label and different labels", () => {
    const r = { ...withModel(emptyRule(), "binary"), evaluatorRoles: ["preceptor" as const] }
    expect(validateRule(r).some((i) => i.id === "cfg-qualifying:missing")).toBe(true)
    expect(validateRule({ ...r, qualifyingLabel: 0, outcomeLabels: ["Met", " met "] }).some((i) => i.id === "cfg-label-1:same")).toBe(true)
    expect(r.outcomeLabels).toEqual(["Met", "Unmet"])
  })
})

describe("configure: validation blocks unsatisfiable rules", () => {
  it("flags minimums above the total and lab-only roles with setting minimums", () => {
    const ids = validateRule(binary({ need: 2, distinctEvaluators: 3, settingMinimums: [{ setting: "Inpatient", min: 3 }], evaluatorRoles: ["lab-instructor"] })).map((i) => i.id)
    expect(ids).toContain("cfg-distinct:gt")
    expect(ids).toContain("cfg-setting-min-0:sum")
    expect(ids).toContain("cfg-role-preceptor:labonly")
  })
  it("question model needs a qualification rule and a non-empty subset", () => {
    const q: LabRule = { ...withModel(emptyRule(), "question"), questions: ["A", "B"], evaluatorRoles: ["preceptor"], need: 1 }
    expect(validateRule(q).map((i) => i.id)).toContain("cfg-qrule:missing")
    expect(validateRule({ ...q, questionRule: { kind: "subset", indices: [] } }).map((i) => i.id)).toContain("cfg-qrule-subset:empty")
    expect(validateRule({ ...q, questionRule: { kind: "atLeast", n: 3 } }).map((i) => i.id)).toContain("cfg-qrule-n:range")
    expect(validateRule({ ...q, questionRule: { kind: "all" } })).toEqual([])
  })
  it("a valid binary rule passes", () => {
    expect(validateRule(binary())).toEqual([])
  })
})

describe("configure: rule sentence", () => {
  it("reads as one plain sentence for admins and students", () => {
    const r: LabRule = { ...withModel(emptyRule(), "demonstration"), levels: ["Observed", "Assisted", "Independent"], need: 3, levelMinimums: [{ levelIndex: 2, min: 2 }], distinctEvaluators: 2, settingMinimums: [{ setting: "Inpatient", min: 1 }], evaluatorRoles: ["preceptor"] }
    expect(ruleSentence(r)).toBe("Get 3 evaluations, at least 2 at Independent or above, from 2 different evaluators, with 1 in Inpatient.")
    expect(ruleSentence(r, "student")).toBe("You need 3 evaluations, at least 2 at Independent or above, from 2 different evaluators, with 1 in Inpatient.")
    expect(settingNote(r)).toBe("Lab and simulation evidence does not count toward Inpatient.")
    expect(ruleSentence(binary())).toBe("Get 3 evaluations rated Met.")
  })
  it("never contains the banned generic noun or a long dash", () => {
    const text = ruleSentence(sampleChange(fromV2(skillById(s, MED)!), s.program.clinicalSettings), "student")
    expect(text).not.toMatch(new RegExp("\\bite" + "ms?\\b", "i"))
    expect(text).not.toMatch(new RegExp("\\u2014"))
  })
})

describe("configure: engine", () => {
  it("pending and held evidence never counts; lab never satisfies a setting", () => {
    const r = binary({ need: 2, settingMinimums: [{ setting: "Inpatient", min: 1 }] })
    const out = evaluateRule(r, [ev({ setting: "lab" }), ev({ setting: "simulation", evaluatorId: "e2" }), ev({ status: "awaiting-approval", clinicalSetting: "Inpatient" })])
    expect(out.have).toBe(2)
    expect(out.settings[0].have).toBe(0)
    expect(out.state).toBe("in-progress")
  })
  it("distinguishes the four states", () => {
    const r = binary({ need: 1 })
    expect(evaluateRule(r, []).state).toBe("no-evidence")
    expect(evaluateRule(r, [ev({ outcome: "not-met" })]).state).toBe("not-qualifying")
    expect(evaluateRule(binary({ need: 2 }), [ev({})]).state).toBe("in-progress")
    expect(evaluateRule(r, [ev({})]).state).toBe("achieved")
  })
  it("counts distinct evaluators and level minimums; an unrecorded level never counts toward a level minimum", () => {
    const r: LabRule = { ...withModel(emptyRule(), "demonstration"), levels: ["A", "B", "C"], need: 2, levelMinimums: [{ levelIndex: 2, min: 1 }], distinctEvaluators: 2, evaluatorRoles: ["preceptor"] }
    expect(evaluateRule(r, [ev({ levelIndex: 2 }), ev({ levelIndex: 1 })]).state).toBe("in-progress")
    expect(evaluateRule(r, [ev({ levelIndex: 2 }), ev({ levelIndex: 1, evaluatorId: "e2" })]).state).toBe("achieved")
    expect(evaluateRule(r, [ev({}), ev({ evaluatorId: "e2" })]).levels[0].have).toBe(0)
  })
  it("matches the v2 engine for every student on the published rules (same counts on every screen)", () => {
    const students = studentsOf(s)
    for (const id of [MED, "sk-sterile-dressing", "hgtc-basic-skills-11", "sk-urinary-cath", "hgtc-safety-01"]) {
      const k = skillById(s, id)!
      const rule = fromV2(k)
      for (const p of students) {
        const v2 = skillProgress(s, p.id, id)!
        const lab = evaluateRule(rule, s.evaluations.filter((e) => e.studentId === p.id && e.skillId === id))
        expect([id, p.id, lab.state === "achieved", lab.have]).toEqual([id, p.id, v2.achieved, v2.counted])
      }
    }
  })
})

describe("configure: impact over the real dataset (123 students)", () => {
  const k = skillById(s, MED)!
  const before = fromV2(k)
  const after = sampleChange(before, s.program.clinicalSettings)

  it("no edit, no change", () => {
    const im = computeImpact(s, MED, before, copy(before))
    expect(im.students).toBe(123)
    expect(im.changed).toHaveLength(0)
    expect(im.ruleChanged).toBe(false)
  })
  it("a stricter rule moves students out of achieved, and the totals still add to 123", () => {
    const im = computeImpact(s, MED, before, after)
    expect(im.ruleChanged).toBe(true)
    expect(im.lostAchieved).toBeGreaterThan(0)
    expect(im.gainedAchieved).toBe(0)
    expect(Object.values(im.before).reduce((a, b) => a + b, 0)).toBe(123)
    expect(Object.values(im.after).reduce((a, b) => a + b, 0)).toBe(123)
    expect(im.after.achieved).toBe(im.before.achieved - im.lostAchieved)
    expect(im.transitions.reduce((n, t) => n + t.count, 0)).toBe(im.changed.length)
    expect(im.changed[0].before).toBe("achieved")
    expect(im.changed[0].left.length).toBeGreaterThan(0)
  })
  it("new evidence only changes nobody now", () => {
    expect(computeImpact(s, MED, before, after, "new-only").changed).toHaveLength(0)
  })
  it("renaming labels changes nobody [AE-06]", () => {
    expect(computeImpact(s, MED, before, { ...before, outcomeLabels: ["Pass", "Fail"] }).changed).toHaveLength(0)
  })
  it("bulk apply reports one row per skill", () => {
    const rows = bulkImpact(s, [MED, "hgtc-safety-01"], after)
    expect(rows.map((r) => r.skillId)).toEqual([MED, "hgtc-safety-01"])
    expect(rows[0].changed).toBeGreaterThan(0)
  })
  it("the student line names the new rule and what is left", () => {
    const im = computeImpact(s, MED, before, after)
    const line = affectedStudentLine(k.name, after, im.changed[0], "Oct 26")
    expect(line).toMatch(/^Rule changed Oct 26: Oral medication administration now needs 3 evaluations rated Met/)
    expect(line).toMatch(/Still needed:/)
  })
})

describe("configure: five steps and where each check lives", () => {
  it("has five short steps named the way the client says them, Check last", () => {
    expect(CONFIGURE_STEPS.map((x) => x.label)).toEqual(["How it's judged", "Evaluation criteria", "How many times", "Who signs", "Check"])
    expect(CONFIGURE_STEPS.map((x) => x.id)).toEqual(["model", "outcomes", "rule", "signoff", "check"])
    expect(CONFIGURE_STEPS.every((x) => x.label.split(" ").length <= 3)).toBe(true)
    // The step keeps one name for every model; what it holds is named inside it.
    expect(outcomesLabel("question")).toBe("Evaluation criteria")
    expect(outcomesLabel("demonstration")).toBe("Evaluation criteria")
    expect(criteriaKind("question")).toBe("Questions")
    expect(criteriaKind("demonstration")).toBe("Levels")
  })
  it("setting minimums are checked in Rule; student fields in Who signs", () => {
    const issues = validateRule(binary({ need: 1, settingMinimums: [{ setting: "Inpatient", min: 2 }], studentFields: [{ label: "", type: "short", mandatory: false }] }))
    expect(issues.find((i) => i.id === "cfg-setting-min-0:sum")?.section).toBe("rule")
    expect(issues.find((i) => i.id === "cfg-field-0:blank")?.section).toBe("signoff")
    expect(issues.every((i) => SECTIONS.some((x) => x.id === i.section))).toBe(true)
  })
})

describe("configure: ties are said once (J7)", () => {
  const k = skillById(s, MED)!
  const before = fromV2(k)
  const after = sampleChange(before, s.program.clinicalSettings)
  const im = computeImpact(s, MED, before, after)
  const groups = groupImpact(im)

  it("groups every changed student exactly once, losses first", () => {
    expect(groups.reduce((n, g) => n + g.rows.length, 0)).toBe(im.changed.length)
    expect(groups[0].from).toBe("achieved")
  })
  it("states each combination of needs once, in staff words, and every student sits in exactly one part", () => {
    const g = groups[0]
    const reason = groupReason(g)
    expect(reason).not.toMatch(/you have/)
    expect(g.parts.reduce((n, p) => n + p.rows.length, 0)).toBe(g.rows.length)
    const keys = g.parts.map((p) => p.gaps.map((x) => x.key).join("|"))
    expect(new Set(keys).size).toBe(keys.length)
    // The sample change: most students need one more Inpatient evaluation; each combination is one sentence.
    expect(reason).toMatch(/^\d+ need 1 more in Inpatient\./)
    for (const p of g.parts.slice(0, 3)) expect(reason).toContain(partSentence(p))
    for (const r of g.rows) expect(extraGaps(r, g).some((x) => g.shared.some((sh) => sh.key === x.key))).toBe(false)
  })
  it("a tie across identical rows becomes one sentence", () => {
    const row = (id: string) => ({ studentId: id, name: id, cohort: "", before: "achieved" as const, after: "in-progress" as const, left: [], gaps: [{ key: "setting:Inpatient:1", label: "1 more in Inpatient" }], verified: false })
    const [g] = groupImpact({ changed: [row("a"), row("b"), row("c")] })
    expect(groupReason(g)).toBe("All 3 need 1 more in Inpatient.")
  })
  it("gaps never count lab toward a setting (SC-12)", () => {
    const r = evaluateRule(binary({ need: 1, settingMinimums: [{ setting: "Inpatient", min: 1 }] }), [ev({ setting: "lab", clinicalSetting: "Inpatient" })])
    expect(gapsOf(r).map((g) => g.label)).toEqual(["1 more in Inpatient"])
  })
  it("configDiff lists only what changed, and the rule as what it adds (no repeated sentence)", () => {
    const d = configDiff(before, after)
    expect(d.map((x) => x.label)).toEqual(["How many times"])
    expect(d[0].after).toBe("Adds from 2 different evaluators and 1 in Inpatient.")
    expect(d[0].before).toBe("Get 3 evaluations rated Met.")
    expect(configDiff(before, { ...before, outcomeLabels: ["Pass", "Fail"] }).map((x) => x.label)).toEqual(["Evaluation criteria"])
    expect(configDiff(null, after).some((x) => x.label === "How it's judged" && x.before === "Not set")).toBe(true)
  })
})

describe("configure: Oct 26 call updates", () => {
  it("offers the three criteria types in the client's words first, Scored fourth and Proposed, nothing preselected", () => {
    expect(LAB_MODELS.map((m) => MODEL_LABEL[m])).toEqual(["Approved or not approved", "Questions, then a final result", "Independence level", "Scored"])
    expect([...PROPOSED_MODELS]).toEqual(["scored"])
    expect(emptyRule().model).toBeNull()
  })
  it("presets fill labels only, stay editable, and never choose what qualifies", () => {
    const b = applyPreset({ ...withModel(emptyRule(), "binary") }, "approval")
    expect(b.outcomeLabels).toEqual(["Approved", "Not approved"])
    expect(b.qualifyingLabel).toBeNull()
    expect({ ...b, outcomeLabels: ["Approved", "Needs another try"] }.outcomeLabels[1]).toBe("Needs another try")
    const d = applyPreset(withModel(emptyRule(), "demonstration"), "independence")
    expect(d.levels).toEqual(["Observed", "With assistance", "Independent"])
    // A preset for another model leaves the rule alone.
    expect(applyPreset(withModel(emptyRule(), "question"), "approval").outcomeLabels).toEqual(["Met", "Unmet"])
    // Renaming never changes who qualifies [AE-06].
    expect(engineSame(binary(), applyPreset(binary(), "approval"))).toBe(true)
  })
  it("how many times is school-defined: empty by default, asked for, and the sentence says it is not set", () => {
    const r = withModel(emptyRule(), "binary")
    expect(hasNeed(r)).toBe(false)
    expect(validateRule({ ...r, qualifyingLabel: 0, evaluatorRoles: ["preceptor"] }).map((i) => i.id)).toEqual(["cfg-need:need"])
    expect(ruleSentence({ ...r, qualifyingLabel: 0 })).toBe("Not set yet. Your program decides.")
    expect(ruleSentence({ ...r, qualifyingLabel: 0, need: 3, levelMinimums: [] })).toBe("Get 3 evaluations rated Met.")
  })
  it("a valid attempt can need at least 2 of 3 questions answered Yes: validated, in the sentence and in the engine", () => {
    const q: LabRule = { ...withModel(emptyRule(), "question"), questions: ["Identifies patient", "Checks order", "Documents"], questionRule: { kind: "atLeast", n: 2 }, need: 3, evaluatorRoles: ["preceptor"] }
    expect(validateRule(q)).toEqual([])
    expect(validateRule({ ...q, questionRule: { kind: "atLeast", n: 4 } }).map((i) => i.id)).toContain("cfg-qrule-n:range")
    expect(ruleSentence(q)).toBe("Get 3 evaluations with at least 2 of 3 questions answered Yes.")
    const withAnswers = (answers: Array<"yes" | "no">, over: Partial<Evaluation> = {}) => ev({ versions: [{ detail: { answers } } as never], ...over })
    const r = evaluateRule(q, [withAnswers(["yes", "yes", "no"]), withAnswers(["yes", "no", "no"]), withAnswers(["yes", "yes", "yes"]), withAnswers(["no", "yes", "yes"]), withAnswers(["no", "no", "yes"])])
    expect(r.have).toBe(3)
    expect(r.state).toBe("achieved")
    expect(attemptLine(q, r.attempts)).toBe("5 attempts, 2 not valid: 3 count")
  })
  it("counts attempts in one plain line, using the program's own label", () => {
    const r = binary({ outcomeLabels: ["Approved", "Not approved"] })
    const out = evaluateRule(r, [ev({}), ev({ outcome: "not-met" }), ev({}), ev({ outcome: "not-met" }), ev({}), ev({ status: "awaiting-approval" })])
    expect(out.attempts).toEqual({ total: 5, notQualifying: 2, notUsed: 0, count: 3 })
    expect(attemptLine(r, out.attempts)).toBe("5 attempts, 2 not approved: 3 count")
    expect(attemptLine(r, evaluateRule(r, [ev({}), ev({})]).attempts)).toBe("2 attempts, 2 count")
    expect(attemptLine(r, evaluateRule(r, []).attempts)).toBe("")
  })
  it("the impact carries a real counting example from the dataset, consistent with the engine", () => {
    const k = skillById(s, MED)!
    const rule = fromV2(k)
    const im = computeImpact(s, MED, rule, rule)
    expect(im.example).not.toBeNull()
    const ex = im.example!
    expect(ex.total).toBeGreaterThanOrEqual(2)
    expect(ex.notQualifying).toBeGreaterThan(0)
    expect(ex.total).toBe(ex.notQualifying + ex.notUsed + ex.count)
    // It is the first student in dataset order whose record shows both sides (some did not count, 2 or more count).
    const held = heldState(s)
    const all = studentsOf(held).map((p) => evaluateRule(rule, held.evaluations.filter((e) => e.studentId === p.id && e.skillId === MED)))
    const first = all.find((x) => x.attempts.total >= 2 && x.attempts.notQualifying > 0 && x.attempts.count >= 2) ?? all.find((x) => x.attempts.total >= 2 && x.attempts.notQualifying > 0)
    expect(first?.attempts).toEqual(ex)
  })
})

function engineSame(a: LabRule, b: LabRule): boolean {
  return computeImpact(s, MED, a, b).ruleChanged === false
}

function copy<T>(x: T): T {
  return JSON.parse(JSON.stringify(x)) as T
}
