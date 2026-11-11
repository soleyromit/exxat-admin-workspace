import * as React from "react"
import { describe, expect, it } from "vitest"
import { fireEvent, render, screen } from "@testing-library/react"
import { applyPreset, emptyRule, levelPlace, removeLevel, validateRule, withCountsFrom, withModel, type LabRule } from "@/lib/lab/configure"
import { CHECKOFF_GRANT_LABEL, CHECKOFF_SWITCH_LABEL, CheckOffGrantNote, checkOffBelowCut, withCheckOffPatch } from "@/components/lab/configure/fields"
import { ACCEPTED_HEAD, LEVELS_NOT_CHOSEN, LevelsField, OutcomesField, problemText } from "@/components/lab/configure/settings-sheet"
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

describe("LevelsField: linked checkboxes under Accepted (D-L74, D-L95, restored 2026-11-11)", () => {
  it("one box per level, named Accept {level}, under one Accepted head; no select, no sentence, no counts", () => {
    const { container } = render(<LevelsField rule={withCountsFrom(levels(), 1)} setRule={noop} err={noErr} />)
    const r = levels()
    expect(screen.getByText(ACCEPTED_HEAD)).toBeInTheDocument()
    expect(screen.getByRole("checkbox", { name: `Accept ${r.levels[2]}` })).toBeChecked()
    expect(screen.getByRole("checkbox", { name: `Accept ${r.levels[1]}` })).toBeChecked()
    expect(screen.getByRole("checkbox", { name: `Accept ${r.levels[0]}` })).not.toBeChecked()
    expect(screen.queryByRole("combobox", { name: /level/i })).toBeNull()
    expect(container.textContent).not.toMatch(/\bcounts?\b/i)
  })
  it("checking a level accepts every level above it, and says so", () => {
    let next: LabRule | null = null
    const r0 = withCountsFrom(levels(), 2)
    render(<LevelsField rule={r0} setRule={(fn) => { next = fn(r0) }} err={noErr} />)
    fireEvent.click(screen.getByRole("checkbox", { name: `Accept ${r0.levels[0]}` }))
    expect(next!.carried.minLevelIndex).toBe(0)
    expect(screen.getByRole("status").textContent).toBe(`${r0.levels[1]} is also accepted.`)
  })
  it("clearing a level clears every level below it", () => {
    let next: LabRule | null = null
    const r0 = withCountsFrom(levels(), 0)
    render(<LevelsField rule={r0} setRule={(fn) => { next = fn(r0) }} err={noErr} />)
    fireEvent.click(screen.getByRole("checkbox", { name: `Accept ${r0.levels[1]}` }))
    expect(next!.carried.minLevelIndex).toBe(2)
    expect(screen.getByRole("status").textContent).toBe(`${r0.levels[0]} is no longer accepted.`)
  })
  it("nothing accepted reads in the page's word", () => {
    const issue = validateRule(withCountsFrom(levels(), null)).find((i) => i.field === "cfg-counts-from")!
    expect(problemText(issue)).toBe(`Levels: ${LEVELS_NOT_CHOSEN.charAt(0).toLowerCase()}${LEVELS_NOT_CHOSEN.slice(1)}`)
  })
  it("removing the accepted cut-off level keeps a level chosen (D-L95)", () => {
    const r = removeLevel(withCountsFrom(levels(), 1), 1)
    expect(r.carried.minLevelIndex).toBe(1)
  })
})

describe("OutcomesField: one radio per row under the same head", () => {
  it("radios named Accept {outcome}, no select", () => {
    const r: LabRule = { ...withModel(emptyRule(), "binary"), outcomeLabels: ["Met", "Unmet"], qualifyingLabel: 0 }
    render(<OutcomesField rule={r} setRule={noop} err={noErr} />)
    expect(screen.getByText(ACCEPTED_HEAD)).toBeInTheDocument()
    expect(screen.getByRole("radio", { name: "Accept Met" })).toBeChecked()
    expect(screen.getByRole("radio", { name: "Accept Unmet" })).not.toBeChecked()
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
    expect(screen.getByText("This level is not accepted, so a group check-off will not add to the times needed.")).toBeInTheDocument()
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
