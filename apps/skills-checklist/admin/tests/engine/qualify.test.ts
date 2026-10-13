import { describe, expect, it } from "vitest"
import { qualifies } from "@/lib/engine"
import { bin, binary, demo, demoModel, questionModel, scoredModel, scores, yesNo } from "./fixtures"

// ENG-1 / ENG-3 prerequisites. REQ SC-03..SC-08, AE-02.
describe("qualifies() by evaluation model", () => {
  describe("SC-03 binary: outcome must equal the qualifying label", () => {
    it.each([
      ["a", "a", true],
      ["b", "a", false],
      ["b", "b", true], // qualifying label is stored explicitly, not assumed to be the first
      ["a", "b", false],
    ] as const)("recorded %s, qualifying %s => %s", (rec, qual, expected) => {
      expect(qualifies(bin(rec), binary(qual))).toBe(expected)
    })
  })

  describe("SC-05 question model", () => {
    it.each([
      ["all Yes", { kind: "all" as const }, [true, true, true], true],
      ["all, one No", { kind: "all" as const }, [true, false, true], false],
      ["atLeast 2 of 3, two Yes", { kind: "atLeast" as const, n: 2 }, [true, false, true], true],
      ["atLeast 2 of 3, one Yes", { kind: "atLeast" as const, n: 2 }, [false, false, true], false],
      ["atLeast 3 of 3, all Yes", { kind: "atLeast" as const, n: 3 }, [true, true, true], true],
      ["subset q2+q3, both Yes (q1 No ignored)", { kind: "subset" as const, questionIds: ["q2", "q3"] }, [false, true, true], true],
      ["subset q2+q3, q3 No", { kind: "subset" as const, questionIds: ["q2", "q3"] }, [true, true, false], false],
    ])("%s", (_n, rule, answers, expected) => {
      expect(qualifies(yesNo(...answers), questionModel(3, rule))).toBe(expected)
    })

    it("a question added after the evaluation was recorded counts as not answered Yes (AE-02)", () => {
      // evidence recorded with 2 answers, current rule now has 3 questions and needs all Yes
      expect(qualifies(yesNo(true, true), questionModel(3, { kind: "all" }))).toBe(false)
      // ...but 2 of 3 still qualifies under atLeast 2
      expect(qualifies(yesNo(true, true), questionModel(3, { kind: "atLeast", n: 2 }))).toBe(true)
    })

    it("an empty named subset never qualifies (and is rejected by the validator, SC-06)", () => {
      expect(qualifies(yesNo(true, true, true), questionModel(3, { kind: "subset", questionIds: [] }))).toBe(false)
    })
  })

  describe("SC-07 scored model", () => {
    it.each([
      ["average >= 3, avg 3.5", { kind: "average" as const, min: 3 }, [4, 3], true],
      ["average >= 3, avg 2.5", { kind: "average" as const, min: 3 }, [2, 3], false],
      ["every question >= 3, all pass", { kind: "minPerQuestion" as const, min: 3 }, [3, 5], true],
      ["every question >= 3, one fails although average is 3.5", { kind: "minPerQuestion" as const, min: 3 }, [2, 5], false],
      ["total >= 8, total 8", { kind: "total" as const, min: 8 }, [3, 5], true],
      ["total >= 8, total 7", { kind: "total" as const, min: 8 }, [3, 4], false],
    ])("%s", (_n, rule, s, expected) => {
      expect(qualifies(scores(...s), scoredModel(2, rule))).toBe(expected)
    })

    it("a missing score never qualifies", () => {
      expect(qualifies(scores(5), scoredModel(2, { kind: "average", min: 3 }))).toBe(false)
    })
  })

  describe("SC-08 demonstration: every completed demonstration at a current level is evidence", () => {
    it("qualifies for a level that exists", () => {
      expect(qualifies(demo("ind"), demoModel())).toBe(true)
    })
    it("[INFER] a demonstration at a level that no longer exists still qualifies as a demonstration (AE-07 note)", () => {
      expect(qualifies(demo("removed"), demoModel())).toBe(true)
    })
  })

  it("AE-02: evidence recorded under another model kind does not qualify (model change leaves it held)", () => {
    expect(qualifies(bin("a"), questionModel(2, { kind: "all" }))).toBe(false)
    expect(qualifies(demo("ind"), binary())).toBe(false)
  })
})
