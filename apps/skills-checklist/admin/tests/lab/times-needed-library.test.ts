import { describe, expect, it } from "vitest"
import { createGeneratedSeed as createSeed } from "@/lib/v2/seed"
import { isConfigured } from "@/lib/v2/population"
import { emptyRule, fromV2, type LabRule } from "@/lib/lab/configure"
import { buildLibrary } from "@/lib/lab/library"
import { saveProgramSettings, setTimesNeededMany, timesCellOf, timesRows, TIMES_MAX } from "@/lib/lab/program-settings"
import { parseTimes } from "@/components/lab/library/times-needed"
import type { V2State } from "@/lib/v2/types"

/** D-L72: the seed now holds saved program settings. These tests are about a program before its first save, so they start from one. */
const seed = (() => {
  const s = createSeed()
  return { ...s, programSettings: null, skills: s.skills.map(({ edited: _own, ...k }) => k) }
})()
const opts = { at: "2026-11-02T10:00:00Z", byId: "adm-ross" }
const libraryIds = () => buildLibrary(seed).filter((r) => r.status !== "inactive").map((r) => r.id)

function levelsProgram(need = 3): LabRule {
  return {
    ...emptyRule(),
    model: "demonstration",
    levels: ["Observed", "Assisted", "Independent"],
    need,
    evaluatorRoles: ["preceptor", "faculty"],
    carried: { ...emptyRule().carried, minLevelIndex: 2 },
  }
}

/** The seed with the program's number saved and every skill taking it (own numbers overwritten to start clean). */
function withProgram(need = 3): V2State {
  const ids = libraryIds()
  const r = saveProgramSettings(seed, levelsProgram(need), { ...opts, only: ids })
  if (!r.ok) throw new Error("program save")
  return setTimesNeededMany(r.result.state, ids, need, opts).state
}

/** Same count the Evaluation settings page shows as "Different from n" (exceptionCount with no edits). */
const differentOnSettings = (s: V2State, programNeed: number) => timesRows(s, buildLibrary(s)).filter((r) => r.need !== null && r.need !== programNeed).length
const differentInLibrary = (s: V2State) => libraryIds().filter((id) => timesCellOf(s, id).differs).length

describe("times needed in the library (CALL 11-02)", () => {
  it("shows Not set, not a number, before the program saves its settings (SC-02)", () => {
    const nc = seed.skills.find((k) => !isConfigured(k) && !k.model)!
    const cell = timesCellOf(seed, nc.id)
    expect(cell).toMatchObject({ value: null, programNeed: null, differs: false })
    // A configured skill shows its own number, never marked different (there is no program number to differ from).
    const c = seed.skills.find((k) => isConfigured(k))!
    expect(timesCellOf(seed, c.id)).toMatchObject({ value: fromV2(c).need, programNeed: null, differs: false })
  })

  it("prefills every skill with the program number", () => {
    const s = withProgram(3)
    for (const id of libraryIds().slice(0, 20)) expect(timesCellOf(s, id)).toMatchObject({ value: 3, programNeed: 3, differs: false })
  })

  it("sets an override on one row, marks it different, and clears it when set back to the program number", () => {
    const s = withProgram(3)
    const id = libraryIds()[0]!
    const set = setTimesNeededMany(s, [id], 5, opts)
    expect(set.written).toEqual([id])
    expect(timesCellOf(set.state, id)).toMatchObject({ value: 5, differs: true })
    expect(differentInLibrary(set.state)).toBe(1)
    expect(differentOnSettings(set.state, 3)).toBe(1)
    const back = setTimesNeededMany(set.state, [id], 3, opts)
    expect(back.written).toEqual([id])
    expect(timesCellOf(back.state, id)).toMatchObject({ value: 3, differs: false })
    expect(differentInLibrary(back.state)).toBe(0)
    expect(differentOnSettings(back.state, 3)).toBe(0)
  })

  it("bulk sets the selected rows, leaves rows already on that number alone, and stays in sync with Evaluation settings", () => {
    const s = withProgram(3)
    const ids = libraryIds().slice(0, 6)
    const first = setTimesNeededMany(s, ids.slice(0, 2), 4, opts).state
    const r = setTimesNeededMany(first, ids, 4, opts)
    expect(r.written.sort()).toEqual(ids.slice(2).sort())
    expect(r.unchanged.sort()).toEqual(ids.slice(0, 2).sort())
    expect(r.failed).toEqual([])
    for (const id of ids) expect(timesCellOf(r.state, id)).toMatchObject({ value: 4, differs: true })
    expect(differentInLibrary(r.state)).toBe(6)
    expect(differentOnSettings(r.state, 3)).toBe(6)
    // Untouched rows keep the program number.
    expect(timesCellOf(r.state, libraryIds()[10]!)).toMatchObject({ value: 3, differs: false })
  })

  it("refuses numbers out of range; a row Not configured takes a number too (D-L92)", () => {
    const s = withProgram(3)
    const id = libraryIds()[0]!
    expect(setTimesNeededMany(s, [id], 0, opts).failed).toHaveLength(1)
    expect(setTimesNeededMany(s, [id], TIMES_MAX + 1, opts).failed).toHaveLength(1)
    const nc = seed.skills.find((k) => !isConfigured(k))!
    expect(setTimesNeededMany(seed, [nc.id], 3, opts).written).toEqual([nc.id])
    expect(parseTimes("4")).toBe(4)
    expect(parseTimes("0")).toBeNull()
    expect(parseTimes("2.5")).toBeNull()
    expect(parseTimes("")).toBeNull()
    expect(parseTimes(String(TIMES_MAX + 1))).toBeNull()
  })
})
