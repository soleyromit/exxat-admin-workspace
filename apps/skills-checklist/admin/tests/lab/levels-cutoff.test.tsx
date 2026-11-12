import * as React from "react"
import { describe, expect, it } from "vitest"
import { fireEvent, render, screen } from "@testing-library/react"
import { applyPreset, emptyRule, levelPlace, removeLevel, validateRule, withCountsFrom, withModel, type LabRule } from "@/lib/lab/configure"
import { CHECKOFF_GRANT_LABEL, CHECKOFF_SWITCH_LABEL, CheckOffGrantNote, checkOffBelowCut, withCheckOffPatch } from "@/components/lab/configure/fields"
import { FieldBlock, LevelsField, MOVES_HEAD, SheetSection, OutcomesField, levelsQuestion, movesName, outcomeQuestion, problemText } from "@/components/lab/configure/settings-sheet"
import { LevelList } from "@/components/lab/configure/settings-rows"
import { FROM_PARAM, returnHref, returnTarget } from "@/lib/lab/return-to"

// Independence preset, stored lowest first: Needs coaching, With assistance, Works alone.
const levels = (): LabRule => ({ ...applyPreset(withModel(emptyRule(), "demonstration"), "independence"), need: 1 })
const noop = () => {}
const noErr = () => undefined

describe("Level errors name a place, never a number the list does not show", () => {
  it("levelPlace reads top, lowest and the ones between", () => {
    expect(levelPlace(2, 3)).toBe("The top level")
    expect(levelPlace(0, 3)).toBe("The lowest level")
    expect(levelPlace(1, 3)).toBe("The second level from the top")
  })
  it("a blank level's error says where it is", () => {
    const r = withCountsFrom({ ...levels(), levels: ["Needs coaching", "", "Works alone"] }, 1)
    const msg = validateRule(r).find((i) => i.field === "cfg-level-1")?.message
    expect(msg).toBe("The second level from the top has no name.")
    expect(msg).not.toMatch(/Level \d/)
  })
})

describe("LevelsField: linked checkboxes, the list labelled by its question (2026-11-11)", () => {
  it("the question labels the group; each box names what it means; no Accepted head, no select, no counts", () => {
    const { container } = render(<LevelsField rule={withCountsFrom(levels(), 1)} setRule={noop} err={noErr} />)
    const r = levels()
    expect(screen.getByRole("group", { name: levelsQuestion() })).toBeInTheDocument()
    expect(levelsQuestion()).toBe("Which levels move a student toward achieving the skill?")
    expect(screen.getByRole("checkbox", { name: movesName(r.levels[2]) })).toBeChecked()
    expect(screen.getByRole("checkbox", { name: `${r.levels[1]} moves a student toward achieving the skill` })).toBeChecked()
    expect(screen.getByRole("checkbox", { name: movesName(r.levels[0]) })).not.toBeChecked()
    expect(screen.queryByText("Accepted")).toBeNull()
    expect(screen.queryByRole("combobox", { name: /level/i })).toBeNull()
    expect(container.textContent).not.toMatch(/\bcounts?\b|\baccept/i)
  })
  it("checking a level checks every level above it, and says so", () => {
    let next: LabRule | null = null
    const r0 = withCountsFrom(levels(), 2)
    render(<LevelsField rule={r0} setRule={(fn) => { next = fn(r0) }} err={noErr} />)
    fireEvent.click(screen.getByRole("checkbox", { name: movesName(r0.levels[0]) }))
    expect(next!.carried.minLevelIndex).toBe(0)
    expect(screen.getByRole("status").textContent).toBe(`${r0.levels[1]} now also moves a student toward achieving the skill.`)
  })
  it("clearing a level clears every level below it", () => {
    let next: LabRule | null = null
    const r0 = withCountsFrom(levels(), 0)
    render(<LevelsField rule={r0} setRule={(fn) => { next = fn(r0) }} err={noErr} />)
    fireEvent.click(screen.getByRole("checkbox", { name: movesName(r0.levels[1]) }))
    expect(next!.carried.minLevelIndex).toBe(2)
    expect(screen.getByRole("status").textContent).toBe(`${r0.levels[0]} no longer does.`)
  })
  it("nothing chosen: Choose at least one level, on every variant", () => {
    const issue = validateRule(withCountsFrom(levels(), null)).find((i) => i.field === "cfg-counts-from")!
    expect(issue.message).toBe("Choose at least one level.")
    expect(problemText(issue)).toBe("Levels: choose at least one level.")
  })
  it("removing the chosen cut-off level keeps a level chosen (D-L95)", () => {
    const r = removeLevel(withCountsFrom(levels(), 1), 1)
    expect(r.carried.minLevelIndex).toBe(1)
  })
})

describe("Column heads say what the checkbox offers (Romit 2026-11-11: \"I can't tell what does the checkbox offer\")", () => {
  const heads = (c: HTMLElement) => c.querySelector("[data-list-heads]") as HTMLElement
  it("Evaluation settings B, Levels: Level and the moves head over the columns; the question names the group but is not shown", () => {
    const { container } = render(<LevelsField rule={withCountsFrom(levels(), 1)} setRule={noop} err={noErr} />)
    expect(MOVES_HEAD).toBe("Moves student toward achieving the skill")
    expect(heads(container).textContent).toBe(`Level, highest first${MOVES_HEAD}`)
    expect(heads(container).getAttribute("aria-hidden")).toBe("true")
    expect(screen.getByText(levelsQuestion()).className).toMatch(/sr-only/)
    expect(screen.getByRole("button", { name: "Remove level Independent" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Reorder level Independent" })).toBeInTheDocument()
  })
  it("Evaluation settings B, Outcomes: Outcome and the same moves head", () => {
    const r: LabRule = { ...withModel(emptyRule(), "binary"), outcomeLabels: ["Met", "Unmet"], qualifyingLabel: 0 }
    const { container } = render(<OutcomesField rule={r} setRule={noop} err={noErr} />)
    expect(heads(container).textContent).toBe(`Outcome${MOVES_HEAD}`)
    expect(screen.getByText(outcomeQuestion()).className).toMatch(/sr-only/)
  })
  it("Configure one skill, Levels: the same heads; the Levels dialog (names only) has none", () => {
    const { container, unmount } = render(<LevelList rule={withCountsFrom(levels(), 1)} setRule={noop} err={noErr} />)
    expect(heads(container).textContent).toBe(`Level${MOVES_HEAD}`)
    expect(screen.getByRole("checkbox", { name: "Independent moves a student toward achieving the skill" })).toBeChecked()
    expect(container.textContent).not.toMatch(/\bcounts?\b|\baccept/i)
    unmount()
    const names = render(<LevelList namesOnly rule={levels()} setRule={noop} err={noErr} />)
    expect(names.container.querySelector("[data-list-heads]")).toBeNull()
  })
})

describe("OutcomesField: one radio per row under its question", () => {
  it("radios named for what they mean, no select, no Accepted head", () => {
    const r: LabRule = { ...withModel(emptyRule(), "binary"), outcomeLabels: ["Met", "Unmet"], qualifyingLabel: 0 }
    render(<OutcomesField rule={r} setRule={noop} err={noErr} />)
    expect(screen.getByRole("radiogroup", { name: outcomeQuestion() })).toBeInTheDocument()
    expect(screen.getByRole("radio", { name: "Met moves a student toward achieving the skill" })).toBeChecked()
    expect(screen.getByRole("radio", { name: "Unmet moves a student toward achieving the skill" })).not.toBeChecked()
    expect(screen.queryByText("Accepted")).toBeNull()
    expect(screen.queryByRole("combobox", { name: /outcome/i })).toBeNull()
  })
})

describe("Group check-off wording (2026-11-11)", () => {
  it("one label for the switch and the select", () => {
    expect(CHECKOFF_SWITCH_LABEL).toBe("Let faculty check off a group at once")
    expect(CHECKOFF_GRANT_LABEL).toBe("A group check-off counts as")
  })
  it("the helper says why, and an amber note shows when the level does not count", () => {
    const on = withCheckOffPatch(withCountsFrom(levels(), 1), { enabled: true, levelIndex: 0 })
    expect(checkOffBelowCut(on)).toBe(true)
    render(<CheckOffGrantNote rule={on} id="x" />)
    expect(screen.getByText("Faculty do not evaluate each student in a group check-off, so every student gets this level.")).toBeInTheDocument()
    expect(screen.getByText("An evaluation at this level does not move a student toward achieving the skill, so a group check-off will not add to the times needed.")).toBeInTheDocument()
    expect(checkOffBelowCut(withCheckOffPatch(on, { levelIndex: 2 }))).toBe(false)
  })
})

describe("Return target: Evaluation settings", () => {
  it("the Library reached from the own-number link leads back to Evaluation settings", () => {
    expect(FROM_PARAM).toBe("from")
    expect(returnTarget("settings")?.label()).toBe("Evaluation settings")
    expect(returnHref("settings", "/x")).toMatch(/evaluation-settings/)
  })
})

describe("\"Changed\" always follows a visible label (Romit 2026-11-11: \"looks inconsistent\")", () => {
  it("a list section shows it right after its heading", () => {
    const { container } = render(<SheetSection id="s" title="Levels" count={3} changed><p>rows</p></SheetSection>)
    const heading = screen.getByRole("heading", { name: /Levels/ })
    expect(heading.nextElementSibling?.hasAttribute("data-changed-mark")).toBe(true)
    expect(container.querySelectorAll("[data-changed-mark]")).toHaveLength(1)
  })
  it("a field whose label is for screen readers only never shows it alone", () => {
    const { container } = render(<FieldBlock label="Which levels" srLabel changed end={<span>Start from</span>}><p>rows</p></FieldBlock>)
    expect(container.querySelector("[data-changed-mark]")).toBeNull()
  })
  it("a field with a visible label shows it right after the label", () => {
    render(<FieldBlock label="Times needed" changed><p>x</p></FieldBlock>)
    expect(screen.getByText("Times needed").nextElementSibling?.hasAttribute("data-changed-mark")).toBe(true)
  })
})
