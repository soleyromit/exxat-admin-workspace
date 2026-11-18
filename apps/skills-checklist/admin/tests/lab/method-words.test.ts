import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"
import { createSeed } from "@/lib/v2/seed"
import { emptyRule, ruleAllowsCheckOff, validateRule, withCheckOffDecided, withModel, type LabRule } from "@/lib/lab/configure"
import { checkOffLevelIndex } from "@/lib/lab/checkoff-rules"
import { METHOD_EXAMPLES } from "@/lib/lab/method-examples"
import { describeMethod, methodSentences, parseMethodWords } from "@/lib/lab/method-words"
import { methodKey, methodsOf } from "@/lib/lab/methods"

const seed = createSeed()
/** Group check-off as the form reads it: on or off, and the level a tick records. */
const settled = (r: LabRule): LabRule => {
  const d = withCheckOffDecided(r)
  const on = ruleAllowsCheckOff(d)
  return { ...d, checkOff: { enabled: on, levelIndex: on && d.model === "demonstration" ? checkOffLevelIndex(d.levels, d.checkOff?.levelIndex) : null, score: on && d.model === "scored" ? d.checkOff?.score ?? null : null } }
}

describe("A method in words (Evaluation settings M and N, D-EM1116-g)", () => {
  it("every seed method survives describe then read: the words say all a method holds", () => {
    const methods = methodsOf(seed).filter((m) => m.rule.model)
    expect(methods.length).toBeGreaterThan(3)
    for (const m of methods) {
      // As the editor opens it: a seed rule with group check-off undecided reads as off.
      const rule = withCheckOffDecided(m.rule)
      const words = describeMethod(rule)
      const back = parseMethodWords(words, rule)
      expect(back.unused, `${m.name}: ${words}`).toEqual([])
      expect(back.type, m.name).toBe(m.rule.model)
      expect(methodKey(settled(back.rule)), `${m.name}: ${words}`).toBe(methodKey(settled(rule)))
      expect(describeMethod(back.rule), m.name).toBe(words)
    }
  })

  it("the four types survive describe then read, with each way a student moves forward", () => {
    const base = { evaluatorRoles: ["preceptor", "lab-instructor"], feedbackRequired: true } as Partial<LabRule>
    const rules: LabRule[] = [
      { ...withModel(emptyRule(), "demonstration"), levels: ["Needs coaching", "With assistance", "Works alone"], carried: { ...emptyRule().carried, minLevelIndex: 1 }, checkOff: { enabled: true, levelIndex: 1, score: null }, ...base },
      { ...withModel(emptyRule(), "demonstration"), levels: ["A", "B"], carried: { ...emptyRule().carried, minLevelIndex: 0 }, ...base },
      { ...withModel(emptyRule(), "binary"), outcomeLabels: ["Approved", "Not approved"], qualifyingLabel: 1, approvalRequired: true, ...base },
      { ...withModel(emptyRule(), "question"), questions: ["Q1", "Q2", "Q3"], questionRule: { kind: "atLeast", n: 2 }, ...base },
      { ...withModel(emptyRule(), "question"), questions: ["Q1", "Q2", "Q3"], questionRule: { kind: "subset", indices: [0, 2] }, selfEvaluation: true, ...base },
      { ...withModel(emptyRule(), "scored"), questions: ["Q1", "Q2"], scaleMax: 5, scoredRule: { kind: "average", value: 4 }, ...base },
      { ...withModel(emptyRule(), "scored"), questions: ["Q1", "Q2"], scaleMax: 4, scoredRule: { kind: "minEach", value: 3 }, ...base },
      { ...withModel(emptyRule(), "scored"), questions: ["Q1", "Q2"], scaleMax: 5, scoredRule: { kind: "total", value: 8 }, ...base },
    ]
    for (const r of rules.map(withCheckOffDecided)) {
      const words = describeMethod(r)
      const back = parseMethodWords(words, r)
      expect(back.unused, words).toEqual([])
      expect(methodKey(settled(back.rule)), words).toBe(methodKey(settled(r)))
    }
  })

  it("reads the example description and fills only what it states [REQ SC-02, SC-03, SC-16]", () => {
    const r = parseMethodWords("3 levels, preceptor or faculty, self-evaluation first", emptyRule())
    expect(r.type).toBe("demonstration")
    expect(r.rule.levels).toEqual(["", "", ""])
    expect(r.rule.evaluatorRoles).toEqual(["preceptor", "faculty"])
    expect(r.rule.selfEvaluation).toBe(true)
    expect(r.rule.feedbackRequired).toBe(false)
    expect(r.rule.approvalRequired).toBe(false)
    // Never guessed: which level moves a student forward, and the level names.
    expect(r.rule.carried.minLevelIndex).toBeNull()
    expect(r.unused).toEqual([])
    expect(r.filled).toEqual(["Independence level", "3 levels", "Self-evaluation first", "Preceptor, clinical faculty"])
    // What it leaves open is what Save then refuses [REQ SC-18].
    expect(validateRule({ ...r.rule, need: 1 }).length).toBeGreaterThan(0)
  })

  it("lists what it could not use, and names no type from words that state none", () => {
    const r = parseMethodWords("Levels: Independent, With assistance, Observed. Moves forward from with assistance. Twice a year. Lab instructor", emptyRule())
    expect(r.rule.levels).toEqual(["Observed", "With assistance", "Independent"])
    expect(r.rule.carried.minLevelIndex).toBe(1)
    expect(r.rule.evaluatorRoles).toEqual(["lab-instructor"])
    expect(r.unused).toEqual(["Twice a year"])
    const none = parseMethodWords("preceptor, admin approval", emptyRule())
    expect(none.type).toBeNull()
    expect(none.rule.model).toBeNull()
    expect(none.unused).toEqual(["preceptor", "admin approval"])
  })

  it("does not take self-rated for a scale, or approved for admin approval", () => {
    expect(parseMethodWords("3 levels, self-rated first", emptyRule()).type).toBe("demonstration")
    const b = parseMethodWords("Approved or not approved, moves forward: approved, faculty", emptyRule())
    expect(b.type).toBe("binary")
    expect(b.rule.outcomeLabels).toEqual(["Approved", "Not approved"])
    expect(b.rule.qualifyingLabel).toBe(0)
    expect(b.rule.approvalRequired).toBe(false)
    const s = parseMethodWords("5 questions scored 1 to 5, average of 4, preceptor, feedback required", emptyRule())
    expect(s.type).toBe("scored")
    expect(s.rule.questions).toHaveLength(5)
    expect(s.rule.scaleMax).toBe(5)
    expect(s.rule.scoredRule).toEqual({ kind: "average", value: 4 })
    expect(s.rule.feedbackRequired).toBe(true)
  })

  it("a line removed from the description is a choice removed; what words cannot say stays", () => {
    const start: LabRule = { ...withModel(emptyRule(), "question"), questions: ["Hand hygiene", "Identifies the patient"], questionRule: { kind: "all" }, evaluatorRoles: ["preceptor", "faculty"], approvalRequired: true, need: 3 }
    const words = describeMethod(start).split("\n").filter((l) => l !== "Admin approval").join("\n").replace(" or clinical faculty", "")
    const r = parseMethodWords(words, start)
    expect(r.rule.approvalRequired).toBe(false)
    expect(r.rule.evaluatorRoles).toEqual(["preceptor"])
    expect(r.rule.questions).toEqual(start.questions)
    expect(r.rule.need).toBe(3)
  })

  it("the reader is local: no network and no model call", () => {
    const src = readFileSync("lib/lab/method-words.ts", "utf8")
    expect(src).not.toMatch(/\bfetch\(|XMLHttpRequest|WebSocket|import\(|https?:\/\//)
  })

  it("the review reads a method as sentences, and marks what is not decided", () => {
    const m = methodsOf(seed)[0]!
    const lines = methodSentences(m.rule)
    expect(lines.every((l) => !l.open)).toBe(true)
    expect(lines[0]!.text).toMatch(/^The evaluator /)
    expect(methodSentences(emptyRule())).toEqual([{ id: "type", step: "type", text: "No type chosen yet", open: true }])
    expect(methodSentences(withModel(emptyRule(), "binary")).filter((l) => l.open).map((l) => l.id)).toEqual(["forward", "who"])
  })
})

describe("Starting points for a new method (Evaluation settings L, D-EM1116-g)", () => {
  it("cover the four types, and none can be created without the program's own choices [REQ SC-02, SC-04, SC-16]", () => {
    expect(new Set(METHOD_EXAMPLES.map((x) => x.model))).toEqual(new Set(["demonstration", "binary", "question", "scored"]))
    for (const x of METHOD_EXAMPLES) {
      const r = x.build()
      expect(r.model, x.id).toBe(x.model)
      expect(r.evaluatorRoles, x.id).toEqual([])
      expect(r.questions.every((q) => !q.trim()), x.id).toBe(true)
      expect(validateRule({ ...r, need: 1 }).length, x.id).toBeGreaterThan(0)
      // The tile states what the example fills: what moves a student forward.
      if (x.picks) expect(x.picks.some((p) => p.forward), x.id).toBe(true)
    }
  })
})
