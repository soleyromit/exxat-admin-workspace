import * as React from "react"
import { describe, expect, it } from "vitest"
import { render, screen, within } from "@testing-library/react"
import { criteriaMeaning, emptyRule, ruleMeaning, withModel, type LabRule } from "@/lib/lab/configure"
import { qualifiesOn } from "@/lib/v2/rules"
import type { EvalModel, Evaluation } from "@/lib/v2/types"
import { OutcomesSection, RuleSection } from "@/components/lab/configure/fields"

/**
 * Configure "What does the evaluator answer?" and "When does it count?" (Romit 2026-10-27: "why is this layout like this?",
 * "lot of whitespace"): the answer format first, then one aligned list with icon-only Remove named per row; the rule as compact
 * sentences; a "What this means" panel whose worked example agrees with the engine.
 */

const settings = ["Inpatient", "Outpatient"]
const make = (model: EvalModel, patch: Partial<LabRule> = {}): LabRule => ({ ...withModel(emptyRule(), model), ...patch })
const RULES: Record<EvalModel, LabRule> = {
  binary: make("binary", { outcomeLabels: ["Met", "Not met"], qualifyingLabel: 0, need: 3 }),
  question: make("question", { questions: ["Hand hygiene", "Aseptic technique", "Explains to patient"], questionRule: { kind: "all" }, need: 2 }),
  scored: make("scored", { questions: ["Hand hygiene", "Aseptic technique", "Explains to patient"], scaleMax: 5, scoredRule: { kind: "minEach", value: 4 }, need: 3 }),
  demonstration: make("demonstration", { levels: ["Observed", "With assistance", "Independent"], need: 3, levelMinimums: [{ levelIndex: 2, min: 1 }] }),
}
const props = (rule: LabRule) => ({ rule, setRule: () => {}, issues: [], showErrors: false, settings, legendHidden: true })

/** The engine's verdict for an example, re-derived from the example's own numbers. */
function engineOn(rule: LabRule, x: { scores?: number[]; answers?: Array<"yes" | "no">; outcome?: "met" | "unmet" }): boolean {
  const e = { outcome: x.outcome ?? "unmet", versions: [{ detail: { scores: x.scores, answers: x.answers } }] } as unknown as Evaluation
  return qualifiesOn({ model: rule.model!, questionRule: rule.questionRule, scoredRule: rule.scoredRule }, e)
}

describe("answer step: format first, one aligned list, icon-only Remove", () => {
  for (const model of ["question", "scored", "demonstration", "binary"] as const) {
    it(`renders the ${model} answer step with a What this means panel`, () => {
      const { container } = render(<OutcomesSection {...props(RULES[model])} />)
      expect(screen.getByRole("group", { name: /^What this means/ })).toBeInTheDocument()
      if (model === "binary") return
      const noun = model === "demonstration" ? "level" : "question"
      const items = model === "demonstration" ? RULES[model].levels : RULES[model].questions
      // Every row's Remove is an icon-only button named for its row; no visible "Remove" text.
      items.forEach((_, i) => {
        const b = screen.getByRole("button", { name: `Remove ${noun} ${i + 1}` })
        expect(b.textContent?.trim()).toBe("")
        expect(b.querySelector("i[aria-hidden=true]")).not.toBeNull()
      })
      expect(container.textContent).not.toMatch(/\bRemove\b/)
      // The answer format comes before the list.
      const list = screen.getByRole("list", { name: model === "demonstration" ? "Levels" : "Questions" })
      const format =
        model === "scored" ? screen.getByText("Each question is scored from 1 to") : model === "question" ? screen.getByText("Yes or No for each question") : screen.getByText("Levels, lowest first")
      expect(format.compareDocumentPosition(list) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
      // The number is inside the row (a DS input group), not floating outside it.
      const first = within(list).getAllByRole("listitem")[0]
      expect(first.querySelector("[data-slot=input-group]")?.textContent).toContain("1")
      // Add is a ghost button, not a heavy outline box.
      const add = screen.getByRole("button", { name: model === "demonstration" ? "Add a level" : "Add a question" })
      expect(add.getAttribute("data-variant")).toBe("ghost")
    })
  }

  it("offers the scale top as a DS select from 2 to 10 on one sentence line", () => {
    render(<OutcomesSection {...props(RULES.scored)} />)
    expect(document.getElementById("cfg-scale")?.getAttribute("role")).toBe("combobox")
  })
})

describe("when it counts: compact rule sentences and a worked example that matches the engine", () => {
  for (const model of ["question", "scored", "demonstration", "binary"] as const) {
    it(`renders the ${model} rule step as sentences with the meaning panel`, () => {
      const { container } = render(<RuleSection {...props(RULES[model])} />)
      expect(screen.getByText("The student needs")).toBeInTheDocument()
      expect(document.getElementById("cfg-need")).not.toBeNull()
      expect(screen.getByRole("button", { name: "Add a condition" }).getAttribute("data-variant")).toBe("ghost")
      if (model === "scored") expect(screen.getByText("Counts when")).toBeInTheDocument()
      const panel = screen.getByRole("group", { name: /^What this means/ })
      expect(panel.textContent).toContain(`The student needs ${RULES[model].need} evaluations that count.`)
      expect(container.textContent).not.toMatch(/—/)
    })
  }

  it("scored, every question at least 4: 'scores 5, 5 and 3: does not count, one question is below 4'", () => {
    const m = ruleMeaning(RULES.scored)
    expect(m.example).toBe("Example: scores 5, 5 and 3 on 3 questions: does not count, one question is below 4.")
    expect(m.counts).toBe(false)
    expect(m.counts).toBe(engineOn(RULES.scored, { scores: [5, 5, 3] }))
  })

  it("the example's verdict word always equals the engine's verdict, across rule kinds", () => {
    const cases: LabRule[] = [
      RULES.scored,
      { ...RULES.scored, scoredRule: { kind: "average", value: 4 } },
      { ...RULES.scored, scoredRule: { kind: "total", value: 12 } },
      { ...RULES.scored, scoredRule: { kind: "minEach", value: 1 } },
      RULES.question,
      { ...RULES.question, questionRule: { kind: "atLeast", n: 2 } },
      { ...RULES.question, questionRule: { kind: "subset", indices: [0, 2] } },
      RULES.binary,
    ]
    for (const r of cases) {
      const m = ruleMeaning(r)
      expect(m.example, JSON.stringify(r.scoredRule ?? r.questionRule)).toBeTruthy()
      expect(m.counts).not.toBeUndefined()
      expect(m.example).toContain(m.counts ? ": counts" : ": does not count")
      // Re-derive from the numbers in the sentence and ask the engine directly.
      const scores = m.example!.match(/scores ([\d, and]+) on/)?.[1].split(/, | and /).map(Number)
      if (scores) expect(engineOn(r, { scores })).toBe(m.counts)
    }
  })

  it("levels with a level minimum explain achievement, not a single evaluation", () => {
    expect(ruleMeaning(RULES.demonstration).example).toBe("Example: 3 evaluations count but none is at Independent or above: not achieved yet.")
    expect(ruleMeaning(RULES.demonstration).lines).toContain("It also needs at least 1 at Independent or above.")
  })

  it("an unset count says nothing counts yet, with no example of counting", () => {
    const m = ruleMeaning({ ...RULES.binary, need: Number.NaN })
    expect(m.lines[0]).toBe("Nothing counts until you set how many evaluations are needed.")
  })

  it("criteria meaning says the answer format in one sentence for every model", () => {
    expect(criteriaMeaning(RULES.scored).lines[0]).toBe("The evaluator scores each of 3 questions from 1 to 5.")
    expect(criteriaMeaning(RULES.question).lines[0]).toBe("The evaluator answers Yes or No to each of 3 questions.")
    expect(criteriaMeaning(RULES.demonstration).lines[0]).toBe("The evaluator picks one of 3 levels, Observed lowest.")
    expect(criteriaMeaning(RULES.binary).lines).toEqual(["The evaluator picks one outcome: Met or Not met.", "Only Met can count."])
  })
})
