import { describe, expect, it } from "vitest"
import { explainEvaluation } from "@/lib/engine"
import { bin, binary, demo, demoModel, questionModel, scoredModel, scores, yesNo } from "./fixtures"

// SH-03 structured data only. Plain-language copy lives in docs/ux/09 §7, not in the engine.
describe("SH-03 explainEvaluation returns structured reasons (rule, needed, have)", () => {
  it("a qualifying evaluation has no reasons", () => {
    expect(explainEvaluation(yesNo(true, true), questionModel(2, { kind: "all" }))).toEqual({ qualifies: true, reasons: [] })
  })

  it.each([
    [
      "binary",
      explainEvaluation(bin("b"), binary("a")),
      [{ rule: "binaryLabel", needed: "a", have: "b" }],
    ],
    [
      "all Yes",
      explainEvaluation(yesNo(true, false, false), questionModel(3, { kind: "all" })),
      [{ rule: "allYes", needed: 3, have: 1, failedQuestionIds: ["q2", "q3"] }],
    ],
    [
      "at least N of M",
      explainEvaluation(yesNo(true, false, false), questionModel(3, { kind: "atLeast", n: 2 })),
      [{ rule: "atLeast", needed: 2, have: 1, of: 3 }],
    ],
    [
      "named subset",
      explainEvaluation(yesNo(true, true, false), questionModel(3, { kind: "subset", questionIds: ["q2", "q3"] })),
      [{ rule: "subset", needed: 2, have: 1, failedQuestionIds: ["q3"] }],
    ],
    [
      "average",
      explainEvaluation(scores(2, 3), scoredModel(2, { kind: "average", min: 3 })),
      [{ rule: "average", needed: 3, have: 2.5 }],
    ],
    [
      "minimum on every question",
      explainEvaluation(scores(2, 5), scoredModel(2, { kind: "minPerQuestion", min: 3 })),
      [{ rule: "minPerQuestion", needed: 3, failedQuestionIds: ["q1"] }],
    ],
    [
      "total",
      explainEvaluation(scores(3, 4), scoredModel(2, { kind: "total", min: 8 })),
      [{ rule: "total", needed: 8, have: 7 }],
    ],
  ])("%s", (_n, result, reasons) => {
    expect(result.qualifies).toBe(false)
    expect(result.reasons).toEqual(reasons)
  })

  it("missing answers are reported as failed questions, missing scores as missingScores", () => {
    expect(explainEvaluation(yesNo(true), questionModel(2, { kind: "all" })).reasons).toEqual([
      { rule: "allYes", needed: 2, have: 1, failedQuestionIds: ["q2"] },
    ])
    expect(explainEvaluation(scores(5), scoredModel(2, { kind: "average", min: 3 })).reasons).toEqual([
      { rule: "missingScores", questionIds: ["q2"] },
    ])
  })

  it("a response recorded under another model kind is reported as a kind mismatch", () => {
    expect(explainEvaluation(demo("ind"), binary()).reasons).toEqual([{ rule: "kindMismatch", expected: "binary", have: "demonstration" }])
    expect(explainEvaluation(bin("a"), demoModel()).qualifies).toBe(false)
  })
})
