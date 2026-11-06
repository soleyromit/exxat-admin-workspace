import * as React from "react"
import { describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"
import {
  applyPreset,
  configureStepHead,
  countingLevelsPhrase,
  countsFromIndex,
  countsFromOption,
  levelTicked,
  withLevelTicked,
  criteriaMeaning,
  emptyRule,
  removeLevel,
  ruleMeaning,
  ruleSentence,
  swapItems,
  levelMoveChange,
  presetReplaces,
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

  it("each level keeps its box when moved, unless the move crosses the line (2026-11-05, map D3)", () => {
    const boxes = (x: ReturnType<typeof levels>) => x.levels.map((l, i) => `${l}:${levelTicked(x, i)}`)
    // All boxes ticked, or two ticked and moved among themselves: nothing changes.
    const all = withCountsFrom(levels(), 0)
    expect(countsFromIndex(swapItems(all, "levels", 1, 0))).toBe(0)
    const top = withCountsFrom(levels(), 1)
    const within = swapItems(top, "levels", 1, 2)
    expect(countsFromIndex(within)).toBe(1)
    expect(levelMoveChange(top, within, 1, 2)).toBeNull()
    // A ticked level moved below an unticked one keeps its box: the one it passed gains one, and the row says so.
    const down = swapItems(top, "levels", 1, 0)
    expect(boxes(down)).toEqual([`${top.levels[1]}:true`, `${top.levels[0]}:true`, `${top.levels[2]}:true`])
    expect(levelMoveChange(top, down, 1, 0)).toEqual({ index: 1, counts: true })
    // An unticked level moved above a ticked one stays unticked: the one it passed loses its box.
    const up = swapItems(top, "levels", 0, 1)
    expect(boxes(up)).toEqual([`${top.levels[1]}:false`, `${top.levels[0]}:false`, `${top.levels[2]}:true`])
    expect(levelMoveChange(top, up, 0, 1)).toEqual({ index: 0, counts: false })
    // That would clear every box when nothing sits above: the moved level counts too (D-L95).
    const last = withCountsFrom(levels(), 2)
    const toTop = swapItems(last, "levels", 1, 2)
    expect(countsFromIndex(toTop)).toBe(1)
    expect(levelMoveChange(last, toTop, 1, 2)).toEqual({ index: 2, counts: true })
    // Nothing chosen stays nothing chosen.
    expect(countsFromIndex(swapItems(withCountsFrom(levels(), null), "levels", 0, 1))).toBeNull()
  })

  it("passes to the next level up when that level is removed, and survives a rename", () => {
    const r = withCountsFrom(levels(), 1)
    expect(countsFromIndex(removeLevel(r, 1))).toBe(1)
    expect(countsFromIndex(removeLevel(r, 0))).toBe(0)
    // Removing level 1 never clears every box (D-L95): every level still counts.
    const any = withCountsFrom(levels(), 0)
    expect(countsFromIndex(removeLevel(any, 0))).toBe(0)
    expect(removeLevel(any, 0).levels.map((_, i) => levelTicked(removeLevel(any, 0), i))).toEqual([true, true])
    // Only removing the one level that counted leaves nothing chosen.
    expect(countsFromIndex(removeLevel(withCountsFrom(levels(), 2), 2))).toBeNull()
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
    expect(screen.queryByRole("radiogroup")).toBeNull()
    expect(screen.getAllByRole("checkbox")).toHaveLength(3)
    expect(screen.getByRole("checkbox", { name: r.levels[2] }).getAttribute("aria-checked")).toBe("true")
    expect(screen.getByRole("checkbox", { name: r.levels[1] }).getAttribute("aria-checked")).toBe("false")
    expect(screen.getByRole("checkbox", { name: r.levels[0] }).getAttribute("aria-checked")).toBe("false")
    expect(screen.queryByText("Any level")).toBeNull()
    unmount()
    render(<RuleSection rule={r} setRule={noop} issues={[]} showErrors={false} settings={[]} />)
    expect(screen.getByText("evaluations rated independent")).toBeTruthy()
  })

  it("ticking and unticking comes back to the same meaning: every box is at any level (D-L95)", () => {
    const any = withCountsFrom(levels(), 0)
    expect([0, 1, 2].map((i) => levelTicked(any, i))).toEqual([true, true, true])
    const noLowest = withLevelTicked(any, 0, false)
    expect(countsFromIndex(noLowest)).toBe(1)
    expect(ruleSentence(noLowest)).not.toContain("any level")
    const back = withLevelTicked(noLowest, 0, true)
    expect(back).toEqual(any)
    expect(ruleSentence(back)).toBe("Get 3 evaluations at any level.")
    expect(countsFromOption(back.levels, 0)).toBe("Any level")
    // Unticking a middle level drops those below it too, and ticking the lowest brings every one back.
    expect(withLevelTicked(withLevelTicked(any, 1, false), 0, true)).toEqual(any)
  })

  it("the checkboxes always express a threshold (D-L51, D-L74)", () => {
    const r = levels()
    const three = withLevelTicked(r, 1, true)
    expect(countsFromIndex(three)).toBe(1)
    expect([0, 1, 2].map((i) => levelTicked(three, i))).toEqual([false, true, true])
    expect(countsFromIndex(withLevelTicked(r, 2, true))).toBe(2)
    expect(countsFromIndex(withLevelTicked(three, 1, false))).toBe(2)
    expect(countsFromIndex(withLevelTicked(three, 2, false))).toBeNull()
    expect(validateRule(withLevelTicked(three, 2, false)).some((i) => i.field === "cfg-counts-from")).toBe(true)
  })

  it("two levels give two checkboxes, and nothing is ticked until chosen", () => {
    const two: LabRule = { ...levels(), levels: ["Not yet", "Competent"] }
    render(<OutcomesSection rule={two} setRule={noop} issues={[]} showErrors={false} settings={[]} />)
    const boxes = screen.getAllByRole("checkbox")
    expect(boxes).toHaveLength(2)
    expect(boxes.every((b) => b.getAttribute("aria-checked") === "false")).toBe(true)
  })

  it("a saved 0 shows every box ticked, and the sentence and the summary both read any level (D-L95)", () => {
    const zero = withCountsFrom(levels(), 0)
    render(<OutcomesSection rule={zero} setRule={noop} issues={[]} showErrors={false} settings={[]} />)
    expect(screen.getAllByRole("checkbox").every((b) => b.getAttribute("aria-checked") === "true")).toBe(true)
    expect(countsFromIndex(zero)).toBe(0)
    expect(countsFromOption(zero.levels, 0)).toBe("Any level")
    expect(countsFromOption(zero.levels, 1)).toBe(`${zero.levels[1]} or ${zero.levels[2]}`)
    expect(ruleSentence(zero)).toBe("Get 3 evaluations at any level.")
  })

  it("the Who does what step has no blanket 'no account' lead", () => {
    expect(configureStepHead("signoff", "demonstration").lead).toBeUndefined()
  })
})

describe("a starting set asks first when it would overwrite (map D3, 2026-11-05)", () => {
  it("names the levels it replaces, and whether the Counts boxes clear", () => {
    const r = withCountsFrom({ ...withModel(emptyRule(), "demonstration"), levels: ["Needs coaching", "With assistance", "Works alone"] }, 0)
    expect(presetReplaces(r, "aacn")).toEqual({ noun: "level", was: ["Needs coaching", "With assistance", "Works alone"], next: ["Underdeveloped", "Developing", "Developed"], clearsCounts: true })
    expect(presetReplaces({ ...r, levels: ["", "", ""] }, "aacn")).toBeNull()
    expect(presetReplaces(applyPreset(r, "aacn"), "aacn")).toBeNull()
  })
  it("Met and Unmet are the requirement's default, so replacing them does not ask; labels the admin wrote do", () => {
    const b = withModel(emptyRule(), "binary")
    expect(presetReplaces(b, "approval")).toBeNull()
    expect(presetReplaces({ ...b, outcomeLabels: ["Alpha", "Beta"] }, "approval")?.was).toEqual(["Alpha", "Beta"])
  })
})
