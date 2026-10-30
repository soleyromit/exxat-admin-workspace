import * as React from "react"
import { describe, expect, it } from "vitest"
import { fireEvent, render, screen } from "@testing-library/react"
import { createV2Store } from "@/lib/v2/store"
import { createSeed } from "@/lib/v2/seed"
import { skillById } from "@/lib/v2/evidence-index"
import { isConfigured } from "@/lib/v2/population"
import { V2StoreProvider } from "@/lib/v2/react"
import { applyPreset, emptyRule, fromV2, leftToConfigure, removeLevel, removeQuestion, saveLabRuleToMany, swapItems, withModel, type LabRule } from "@/lib/lab/configure"
import { BulkApplySheet, bulkAppliedNote } from "@/components/lab/configure/bulk-apply"

/**
 * Task TB (2026-10-30): IM-14 apply to several and copy from must actually write, through the one-skill save path; IM-10 the
 * remaining count after saving; AE-07 removing a middle level or question keeps every other rule reference on its own item.
 */

const AT = "2026-10-30T09:00:00Z"
const BY = "u-admin"

function memoryStorage(): Storage {
  const m = new Map<string, string>()
  return {
    get length() { return m.size },
    clear: () => m.clear(),
    getItem: (k) => (m.has(k) ? m.get(k)! : null),
    key: (i) => [...m.keys()][i] ?? null,
    removeItem: (k) => void m.delete(k),
    setItem: (k, v) => void m.set(k, String(v)),
  }
}

const seed = createSeed()
const binaryRule = (): LabRule => ({ ...withModel(emptyRule(), "binary"), qualifyingLabel: 0, need: 2, evaluatorRoles: ["preceptor"] })
const notConfigured = (n: number) => seed.skills.filter((k) => k.active !== false && !isConfigured(k)).slice(0, n).map((k) => k.id)

describe("IM-14: saveLabRuleToMany, the one path for apply to several and configure together", () => {
  it("writes each of 3 skills with its own rule version, and the write survives a reload", () => {
    const ids = notConfigured(3)
    const storage = memoryStorage()
    const a = createV2Store({ storage, key: "bulk" })
    a.hydrate()
    let written: string[] = []
    a.update((s) => {
      const r = saveLabRuleToMany(s, ids, binaryRule(), { at: AT, byId: BY, mode: "reapply" })
      written = r.written
      return r.state
    })
    expect(written).toEqual(ids)
    const b = createV2Store({ storage, key: "bulk" })
    b.hydrate()
    const s = b.getSnapshot()
    for (const id of ids) {
      expect(isConfigured(skillById(s, id)!)).toBe(true)
      expect(fromV2(skillById(s, id)!).need).toBe(2)
      expect((s.ruleChanges ?? []).filter((r) => r.skillId === id)).toHaveLength(1)
    }
    expect(leftToConfigure(s)).toBe(leftToConfigure(seed) - 3)
  })

  it("an invalid rule writes nothing to any skill", () => {
    const ids = notConfigured(3)
    const r = saveLabRuleToMany(seed, ids, { ...binaryRule(), qualifyingLabel: null }, { at: AT, byId: BY, mode: "reapply" })
    expect(r.written).toEqual([])
    expect(r.skipped).toHaveLength(3)
    expect(r.state).toBe(seed)
  })

  it("new evidence only (undecided) writes nothing and says so per skill", () => {
    const r = saveLabRuleToMany(seed, notConfigured(2), binaryRule(), { at: AT, byId: BY, mode: "new-only" })
    expect(r.written).toEqual([])
    expect(r.skipped).toHaveLength(2)
  })

  it("an unknown skill is skipped and named; the others still save", () => {
    const ids = [...notConfigured(2), "sk-does-not-exist"]
    const r = saveLabRuleToMany(seed, ids, binaryRule(), { at: AT, byId: BY, mode: "reapply" })
    expect(r.written).toHaveLength(2)
    expect(r.skipped.map((x) => x.skillId)).toEqual(["sk-does-not-exist"])
  })

  it("copy from: the copied rule saved on the target equals the source's rule", () => {
    const source = seed.skills.find((k) => isConfigured(k) && k.config)!
    const target = notConfigured(1)[0]!
    const copied = fromV2(source)
    const r = saveLabRuleToMany(seed, [target], copied, { at: AT, byId: BY, mode: null })
    const back = fromV2(skillById(r.state, target)!)
    expect(back.model).toBe(copied.model)
    expect(back.need).toBe(copied.need)
    expect(back.levelMinimums).toEqual(copied.levelMinimums)
    expect(back.questionRule).toEqual(copied.questionRule)
  })
})

describe("IM-14 + IM-10: the Apply to other skills sheet (A, B and C use the same one) writes, then reports what is left", () => {
  it("ticking 3 skills and Apply saves all 3 to the shared store and the note carries the left count", () => {
    const store = createV2Store({ storage: memoryStorage(), key: "sheet" })
    store.hydrate()
    const state = store.getSnapshot()
    const ids = notConfigured(4)
    const self = ids[0]!
    const picks = ids.slice(1)
    let note = ""
    render(
      <V2StoreProvider store={store}>
        <BulkApplySheet open onOpenChange={() => {}} state={state} skillId={self} rule={binaryRule()} onApplied={(x) => { note = bulkAppliedNote(x) }} />
      </V2StoreProvider>,
    )
    for (const id of picks) fireEvent.click(document.getElementById(`cfg-bulk-${id}`)!)
    fireEvent.click(screen.getByRole("button", { name: /^Apply to 3 / }))
    const after = store.getSnapshot()
    for (const id of picks) expect(isConfigured(skillById(after, id)!)).toBe(true)
    expect(isConfigured(skillById(after, self)!)).toBe(false)
    expect(note).toMatch(/^Configuration saved to 3 /)
    expect(note).toContain(`${leftToConfigure(after)} left to configure.`)
  })

  it("a blocked rule cannot be applied", () => {
    const store = createV2Store({ storage: memoryStorage(), key: "sheet2" })
    store.hydrate()
    const ids = notConfigured(2)
    render(
      <V2StoreProvider store={store}>
        <BulkApplySheet open onOpenChange={() => {}} state={store.getSnapshot()} skillId={ids[0]!} rule={binaryRule()} blocked onApplied={() => {}} />
      </V2StoreProvider>,
    )
    fireEvent.click(document.getElementById(`cfg-bulk-${ids[1]}`)!)
    expect(screen.getByRole("button", { name: /^Apply to 1 / })).toBeDisabled()
  })
})

describe("AE-07: removing a middle level or question never moves a reference onto the wrong item", () => {
  const levels = ["Observed", "Assisted", "Supervised", "Independent"]
  const demo = (): LabRule => ({
    ...withModel(emptyRule(), "demonstration"),
    levels: [...levels],
    need: 3,
    levelMinimums: [{ levelIndex: 0, min: 1 }, { levelIndex: 1, min: 2 }, { levelIndex: 3, min: 3 }],
    carried: { ...emptyRule().carried, minLevelIndex: 2 },
    checkOff: { enabled: true, levelIndex: 3, score: null },
  })
  const named = (r: LabRule) => r.levelMinimums.map((m) => `${r.levels[m.levelIndex]}:${m.min}`)

  it("removing a middle level with a minimum drops that minimum; every other minimum stays on its level", () => {
    const r = removeLevel(demo(), 1)
    expect(r.levels).toEqual(["Observed", "Supervised", "Independent"])
    expect(named(r)).toEqual(["Observed:1", "Independent:3"])
  })

  it("removing a middle level keeps the tick and the carried minimum on their own levels", () => {
    const r = removeLevel(demo(), 1)
    expect(r.levels[r.checkOff!.levelIndex!]).toBe("Independent")
    expect(r.levels[r.carried.minLevelIndex!]).toBe("Supervised")
  })

  it("removing the level the tick records falls back to the default, never to a neighbour", () => {
    const r = removeLevel(demo(), 3)
    expect(r.checkOff!.levelIndex).toBeNull()
    expect(named(r)).toEqual(["Observed:1", "Assisted:2"])
  })

  it("removing the carried minimum's level clears it", () => {
    expect(removeLevel(demo(), 2).carried.minLevelIndex).toBeNull()
  })

  it("moving levels carries the tick with its level", () => {
    const r = swapItems(demo(), "levels", 2, 3)
    expect(r.levels[r.checkOff!.levelIndex!]).toBe("Independent")
    expect(named(r)).toEqual(["Observed:1", "Assisted:2", "Independent:3"])
  })

  it("a preset with fewer levels clears a tick that pointed past the end", () => {
    const r = applyPreset({ ...demo(), levels: [...levels, "Teaches"], checkOff: { enabled: true, levelIndex: 4, score: null } }, "independence")
    const co = r.checkOff!.levelIndex
    expect(co === null || co < r.levels.length).toBe(true)
  })

  it("removing a middle question keeps the named set on the same questions", () => {
    const q: LabRule = { ...withModel(emptyRule(), "question"), questions: ["Hand hygiene", "Identity", "Five rights", "Documents"], questionRule: { kind: "subset", indices: [0, 2, 3] } }
    const r = removeQuestion(q, 1)
    const r2 = r.questionRule
    expect(r2?.kind).toBe("subset")
    if (r2?.kind === "subset") expect(r2.indices.map((i) => r.questions[i])).toEqual(["Hand hygiene", "Five rights", "Documents"])
  })

  it("removing a named question that was the only pick leaves an empty set, which cannot be saved", () => {
    const q: LabRule = { ...withModel(emptyRule(), "question"), questions: ["A", "B", "C"], questionRule: { kind: "subset", indices: [1] }, need: 1, evaluatorRoles: ["preceptor"] }
    const r = removeQuestion(q, 1)
    expect(r.questionRule).toEqual({ kind: "subset", indices: [] })
    expect(saveLabRuleToMany(seed, notConfigured(1), r, { at: AT, byId: BY, mode: null }).written).toEqual([])
  })
})
