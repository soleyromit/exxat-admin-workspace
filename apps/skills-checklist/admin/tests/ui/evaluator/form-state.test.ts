import { describe, expect, it } from "vitest"
import type { ModelConfig } from "@/lib/engine"
import { clearDrafts, draftKey, emptyDraft, loadDrafts, missingKeys, saveDrafts, summarise, toResponses, type DraftStorage } from "@/components/evaluator/form-state"

const binary: ModelConfig = { kind: "binary", labels: { a: { id: "a", label: "Met" }, b: { id: "b", label: "Unmet" } }, qualifyingLabelId: "a" }
const question: ModelConfig = { kind: "question", questions: [{ id: "q1", text: "One" }, { id: "q2", text: "Two" }], rule: { kind: "all" } }
const scored: ModelConfig = { kind: "scored", questions: [{ id: "s1", text: "S1" }], scale: { min: 1, max: 5, step: 1 }, rule: { kind: "average", min: 3 } }
const demo: ModelConfig = { kind: "demonstration", levels: [{ id: "l1", label: "Observed" }, { id: "l2", label: "Independent" }] }

class Mem implements DraftStorage {
  m = new Map<string, string>()
  getItem = (k: string) => this.m.get(k) ?? null
  setItem = (k: string, v: string) => void this.m.set(k, v)
  removeItem = (k: string) => void this.m.delete(k)
}

describe("completeness uses the same rule as the store (one rule for every respondent)", () => {
  it("binary, question, scored and demonstration report their missing keys", () => {
    expect(missingKeys(binary, emptyDraft())).toEqual(["labelId"])
    expect(missingKeys(binary, { ...emptyDraft(), labelId: "b" })).toEqual([])
    expect(missingKeys(question, { ...emptyDraft(), answers: { q1: true } })).toEqual(["answers.q2"])
    expect(missingKeys(question, { ...emptyDraft(), answers: { q1: true, q2: false } })).toEqual([])
    expect(missingKeys(scored, emptyDraft())).toEqual(["scores.s1"])
    expect(missingKeys(scored, { ...emptyDraft(), scores: { s1: 9 } })).toEqual(["scores.s1"]) // out of scale
    expect(missingKeys(demo, emptyDraft())).toEqual(["levelId"])
    expect(missingKeys(demo, { ...emptyDraft(), levelId: "nope" })).toEqual(["levelId"])
  })

  it("toResponses builds the model's kind", () => {
    expect(toResponses(demo, { ...emptyDraft(), levelId: "l2" })).toEqual({ kind: "demonstration", levelId: "l2" })
    expect(toResponses(question, { ...emptyDraft(), answers: { q1: true } })).toEqual({ kind: "question", answers: { q1: true } })
  })
})

describe("summarise", () => {
  const items = [
    { submissionId: "a", skillName: "Alpha", model: binary, commentRule: "mandatory" as const },
    { submissionId: "b", skillName: "Beta", model: question, commentRule: "optional" as const },
  ]
  it("counts answered skills, lists what is still needed and names the first issue", () => {
    const s = summarise(items, { a: { ...emptyDraft(), labelId: "a" } })
    expect(s.answered).toBe(1)
    expect(s.complete).toBe(false)
    expect(s.remaining).toEqual([
      { submissionId: "a", kind: "comment", skillName: "Alpha" },
      { submissionId: "b", kind: "answers", skillName: "Beta" },
    ])
    expect(s.issues[0]).toEqual({ submissionId: "a", target: "comment" })
  })
  it("is complete when every skill is answered and mandatory comments are present", () => {
    const s = summarise(items, { a: { ...emptyDraft(), labelId: "a", comment: "ok" }, b: { ...emptyDraft(), answers: { q1: true, q2: true } } })
    expect(s.complete).toBe(true)
    expect(s.answered).toBe(2)
  })
})

describe("draft persistence [INFER]", () => {
  it("round trips and keeps only entries for this request with the right shape", () => {
    const st = new Mem()
    expect(saveDrafts(st, "tok", { a: { ...emptyDraft(), labelId: "a", comment: "hi" } })).toBe(true)
    expect(loadDrafts(st, "tok", ["a"]).a.comment).toBe("hi")
    expect(loadDrafts(st, "tok", ["z"])).toEqual({})
    st.setItem(draftKey("bad"), JSON.stringify({ a: { labelId: "zzz", answers: { q1: "yes", q2: true }, scores: { s: "x", t: 3 }, comment: 5 } }))
    const d = loadDrafts(st, "bad", ["a"]).a
    expect(d.labelId).toBeUndefined()
    expect(d.answers).toEqual({ q2: true })
    expect(d.scores).toEqual({ t: 3 })
    expect(d.comment).toBe("")
  })
  it("survives broken or missing storage", () => {
    expect(loadDrafts(null, "t", ["a"])).toEqual({})
    const st = new Mem()
    st.setItem(draftKey("t"), "{not json")
    expect(loadDrafts(st, "t", ["a"])).toEqual({})
    expect(saveDrafts(null, "t", {})).toBe(false)
    const throwing: DraftStorage = { getItem: () => null, setItem: () => { throw new Error("full") }, removeItem: () => { throw new Error("x") } }
    expect(saveDrafts(throwing, "t", {})).toBe(false)
    expect(() => clearDrafts(throwing, "t")).not.toThrow()
  })
})
