import { describe, expect, it } from "vitest"
import { createSeed } from "@/lib/v2/seed"
import { skillLines } from "@/lib/lab/director"
import { answerWord, buildStudent } from "@/lib/lab/student"
import { evaluationPreview } from "@/lib/lab/student2"
import { engineRuleOf, outcomeQualifiesOn, runRule } from "@/lib/v2/rules"
import { recordedOutcome, submitEvaluation } from "@/lib/v2/preceptor"
import { choicesFor, receipt, receiptSummary, type EvRequest } from "@/lib/lab/evaluator"
import type { V2State } from "@/lib/v2/types"

// A program can rename its two labels and choose the second as the one that qualifies [REQ SC-03, AE-02, AE-06]. "met" is the first label, not "it counted".
const seed = createSeed()
const GRACE = "stu-g-038"
const own = seed.evaluations.find((e) => e.studentId === GRACE && e.status === "counted" && seed.skills.find((k) => k.id === e.skillId)?.model === "binary")!
const skillId = own.skillId
const flipped: V2State = {
  ...seed,
  skills: seed.skills.map((k) => (k.id === skillId ? { ...k, config: { ...k.config!, outcomeLabels: ["Not ready", "Ready"], qualifyingLabel: 1 as const } } : k)),
  evaluations: seed.evaluations.map((e) => (e.studentId === GRACE && e.skillId === skillId ? { ...e, outcome: "not-met" as const } : e)),
}
const skill = flipped.skills.find((k) => k.id === skillId)!

describe("the second label qualifying", () => {
  it("the shared test agrees", () => {
    expect(outcomeQualifiesOn(skill, "not-met")).toBe(true)
    expect(outcomeQualifiesOn(skill, "met")).toBe(false)
  })
  it("the student reads the program's own label, never 'unmet'", () => {
    expect(answerWord(skill, "not-met")).toBe("Ready")
    expect(answerWord(skill, "met")).toBe("Not ready")
    expect(answerWord(seed.skills.find((k) => k.id === skillId), "not-met")).toBe("Unmet")
    const m = buildStudent(flipped, GRACE)!
    const r = m.all.find((x) => x.id === skillId)
    if (r?.failed) expect(r.failed.rule).not.toMatch(/answered unmet/i)
  })
  it("the director does not count an answer that qualified as unmet", () => {
    const [line] = skillLines(flipped, [skill], GRACE, [])
    expect(line!.unmet).toBe(0)
  })
  it("a scored skill never says Met or Unmet", () => {
    const scored = seed.skills.find((k) => k.model === "scored" && k.config)
    if (scored) {
      const p = evaluationPreview(scored)
      expect(p.answer).toBe("A score on each question")
      expect(p.items).toEqual([])
    }
  })
})

// The evaluator is told what the engine does, whichever label qualifies (map D3, S16, 2026-11-05: the form said the opposite of the preview).
describe("what the evaluator is told", () => {
  const evaluation = (outcome: "met" | "not-met") => ({ outcome, versions: [], levelIndex: undefined })
  it("the v2 form's receipt follows the qualifying label and uses the program's words", () => {
    expect(recordedOutcome(skill, evaluation("not-met"))).toEqual({ word: "Ready", counts: true, tone: "met" })
    expect(recordedOutcome(skill, evaluation("met"))).toEqual({ word: "Not ready", counts: false, tone: "not-met" })
    const first = seed.skills.find((k) => k.id === skillId)!
    expect(recordedOutcome(first, evaluation("met")).counts).toBe(true)
    expect(recordedOutcome(first, evaluation("not-met")).counts).toBe(false)
  })
  it("the lab form's receipt and hint follow it too, and its title does not say a label that fails counts", () => {
    const req = { skills: [{ id: skillId, name: "A skill", model: "binary", choices: [{ value: "met", label: "Not ready" }, { value: "not-met", label: "Ready" }], levels: [], levelsLabel: "", questions: [], answerKind: null, questionRule: null, scoredRule: null, scaleMax: 5, qualifyingLabel: 1, minLevelIndex: null, feedbackRequired: false, holds: false, self: null, ruleHint: "", attempt: null, prior: null }] } as unknown as EvRequest
    const line = (outcome: "met" | "not-met") => receipt(req, { [skillId]: { outcome, level: null, answers: [], feedback: "" } })[0]!
    expect(line("not-met").status).toBe("counts")
    expect(line("met").status).toBe("not-counted")
    expect(receiptSummary([line("met")])).toMatchObject({ counts: 0, notCounted: 1 })
    expect(choicesFor(skill, false).map((c) => c.label)).toEqual(["Not ready", "Ready"])
  })
})

describe("the engine on an evaluation submitted through the form", () => {
  it("counts the second label and not the first", () => {
    const sub = flipped.submissions.find((x) => x.id === "sub-maya-1")!
    const k = flipped.skills.find((y) => y.id === sub.skillIds[0])!
    const state: V2State = { ...flipped, skills: flipped.skills.map((y) => (sub.skillIds.includes(y.id) ? { ...y, model: "binary" as const, config: { ...y.config!, outcomeLabels: ["Alpha", "Beta"] as [string, string], qualifyingLabel: 1 as const, questions: [], overallRating: false, approvalRequired: false } } : y)) }
    const submit = (first: "met" | "not-met") => submitEvaluation(state, { requestId: sub.id, evaluatorId: sub.assignedToId!, responses: sub.skillIds.map((id, i) => ({ skillId: id, outcome: i === 0 ? first : "met", answers: [], scores: [], levelIndex: null, feedback: "ok" })), concern: { raised: false, note: "" }, attested: true }, "2026-11-05T10:00:00Z")
    const have = (first: "met" | "not-met") => {
      const r = submit(first)
      if (!r.ok) throw new Error(r.error)
      const run = runRule(engineRuleOf(r.state.skills.find((y) => y.id === k.id)!)!, r.state.evaluations.filter((e) => e.studentId === sub.studentId && e.skillId === k.id))
      if (!run.valid) throw new Error("rule invalid")
      return run.have
    }
    expect(have("not-met") - have("met")).toBe(1)
  })
})
