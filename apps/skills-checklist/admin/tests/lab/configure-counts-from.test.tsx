import * as React from "react"
import { describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"
import {
  applyPreset,
  configureStepHead,
  countingLevelsPhrase,
  countsFromIndex,
  criteriaMeaning,
  emptyRule,
  removeLevel,
  ruleMeaning,
  ruleSentence,
  swapItems,
  validateRule,
  withCountsFrom,
  withModel,
  type LabRule,
} from "@/lib/lab/configure"
import { OutcomesSection, RuleSection } from "@/components/lab/configure/fields"

// Romit 2026-11-02: the Levels step asks which levels count toward achievement; the next step's sentence uses that choice.
const levels = (): LabRule => ({ ...applyPreset(withModel(emptyRule(), "demonstration"), "independence"), need: 3 })
const noop = () => {}

describe("which levels count (levels model)", () => {
  it("is never preselected, by the model or the preset, and blocks the step until chosen", () => {
    const r = levels()
    expect(countsFromIndex(r)).toBeNull()
    expect(validateRule(r).some((i) => i.field === "cfg-counts-from" && i.section === "outcomes")).toBe(true)
    expect(validateRule(withCountsFrom(r, 1)).some((i) => i.field === "cfg-counts-from")).toBe(false)
  })

  it("words the rule sentence and both What this means panels from the one choice", () => {
    const top = withCountsFrom(levels(), 2)
    expect(countingLevelsPhrase(top)).toBe("rated independent")
    expect(ruleSentence(top)).toBe("Get 3 evaluations rated independent.")
    expect(ruleMeaning(top).lines[0]).toBe("The student needs 3 evaluations rated independent.")
    expect(criteriaMeaning(top).lines).toContain("Only an evaluation at independent counts toward achievement.")
    const mid = withCountsFrom(levels(), 1)
    expect(ruleSentence(mid)).toBe("Get 3 evaluations rated with assistance or independent.")
    const ex = criteriaMeaning(mid)
    expect(ex.example).toBe("Example: the evaluator records observed: does not count.")
    expect(ex.counts).toBe(false)
    const any = withCountsFrom(levels(), 0)
    expect(ruleSentence(any)).toBe("Get 3 evaluations at any level.")
    expect(criteriaMeaning(any).counts).toBe(true)
  })

  it("follows its level when moved, clears when that level is removed, and survives a rename", () => {
    const r = withCountsFrom(levels(), 1)
    expect(countsFromIndex(swapItems(r, "levels", 1, 2))).toBe(2)
    expect(countsFromIndex(removeLevel(r, 1))).toBeNull()
    expect(countsFromIndex(removeLevel(r, 0))).toBe(0)
    const renamed = { ...r, levels: ["Observed", "Assisted", "Independent"] }
    expect(ruleSentence(renamed)).toBe("Get 3 evaluations rated assisted or independent.")
  })

  it("a preset keeps the choice by name and clears it when the name is not in the preset", () => {
    const custom = withCountsFrom({ ...levels(), levels: ["Novice", "Independent"] }, 1)
    expect(countsFromIndex(applyPreset(custom, "independence"))).toBe(2)
    const gone = withCountsFrom({ ...levels(), levels: ["Novice", "Expert"] }, 1)
    expect(countsFromIndex(applyPreset(gone, "independence"))).toBeNull()
  })

  it("renders the choice on the Levels step and the chosen levels in the When does it count sentence", () => {
    const r = withCountsFrom(levels(), 2)
    const { unmount } = render(<OutcomesSection rule={r} setRule={noop} issues={[]} showErrors={false} settings={[]} />)
    expect(screen.getByRole("radiogroup")).toBeTruthy()
    expect(screen.getByLabelText("Independent only")).toBeTruthy()
    expect(screen.getByLabelText("Any level")).toBeTruthy()
    unmount()
    render(<RuleSection rule={r} setRule={noop} issues={[]} showErrors={false} settings={[]} />)
    expect(screen.getByText("evaluations rated independent")).toBeTruthy()
  })

  it("the Who signs step has no blanket 'no account' lead", () => {
    expect(configureStepHead("signoff", "demonstration").lead).toBeUndefined()
  })
})
