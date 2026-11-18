import { describe, expect, it } from "vitest"
import { createSeed } from "@/lib/v2/seed"
import { newProgramSeed } from "@/lib/lab/new-program"
import type { V2State } from "@/lib/v2/types"
import { createMethod, deleteBlocked, deleteMethod, duplicateMethod, methodById, methodsOf, nameIssue, PROGRAM_METHOD_ID, renameMethod, saveMethod } from "@/lib/lab/methods"
import { skillRuleOf } from "@/lib/lab/program-settings"

const seed = createSeed()
const fresh = (): V2State => newProgramSeed()
const opts = { at: "2026-11-16T10:00:00.000Z", byId: "admin" }

describe("Evaluation methods (D-EM1116)", () => {
  it("a new program has no method and nothing preselected [REQ SC-02]", () => {
    const s = fresh()
    expect(methodsOf(s)).toEqual([])
    const r = createMethod(s, "Independence levels")
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(r.id).toBe(PROGRAM_METHOD_ID)
    const m = methodById(r.state, r.id)!
    expect(m.saved).toBe(false)
    expect(m.rule.model).toBeNull()
  })

  it("the seed reads as the program method plus one per distinct Custom rule; every Custom skill is in exactly one", () => {
    const all = methodsOf(seed)
    expect(all[0]!.program).toBe(true)
    expect(all[0]!.skillIds.length).toBeGreaterThan(100)
    const custom = seed.skills.filter((k) => k.edited && skillRuleOf(k)).map((k) => k.id).sort()
    const covered = all.filter((m) => !m.program).flatMap((m) => m.skillIds).sort()
    expect(covered).toEqual(custom)
    expect(new Set(all.map((m) => m.name.toLowerCase())).size).toBe(all.length)
    expect(new Set(all.map((m) => m.id)).size).toBe(all.length)
  })

  it("names are required and unique", () => {
    const first = methodsOf(seed)[0]!
    expect(nameIssue(seed, "  ")).toBe("Give the method a name.")
    expect(nameIssue(seed, first.name.toUpperCase())).toMatch(/already exists/)
    expect(nameIssue(seed, first.name, first.id)).toBeNull()
  })

  it("create, rename, duplicate and delete keep ids and names stable", () => {
    const c = createMethod(seed, "Procedure steps", "m-test")
    expect(c.ok).toBe(true)
    if (!c.ok) return
    const before = methodsOf(c.state).map((m) => m.id)
    expect(before).toContain("m-test")
    const r = renameMethod(c.state, "m-test", "Bedside steps")
    expect(r.ok && methodById(r.state, "m-test")?.name).toBe("Bedside steps")
    if (!r.ok) return
    const d = duplicateMethod(r.state, "m-test", "m-copy")
    expect(d.ok && methodById(d.state, "m-copy")?.name).toBe("Bedside steps (copy)")
    if (!d.ok) return
    expect(methodsOf(d.state).slice(0, before.length).map((m) => m.id)).toEqual(before)
    const del = deleteMethod(d.state, "m-copy")
    expect(del.ok && methodById(del.state, "m-copy")).toBeNull()
  })

  it("the program's saved method and a method in use cannot be deleted", () => {
    const all = methodsOf(seed)
    expect(deleteBlocked(all[0]!)).toBe("New skills use this method")
    const used = all.find((m) => !m.program && m.skillIds.length)!
    expect(deleteBlocked(used)).toMatch(/^Used by \d+ skills?$/)
    expect(deleteMethod(seed, used.id).ok).toBe(false)
  })

  it("saving a method writes its skills as Custom, each keeping its own Times needed [REQ SC-18]", () => {
    const m = methodsOf(seed).find((x) => !x.program && x.rule.model === "binary")!
    const needs = new Map(m.skillIds.map((id) => [id, skillRuleOf(seed.skills.find((k) => k.id === id)!)!.need]))
    const next = { ...m.rule, outcomeLabels: ["Pass", "Not yet"] as [string, string], qualifyingLabel: 0 as const }
    const r = saveMethod(seed, m.id, next, opts)
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(r.written).toBe(m.skillIds.length)
    for (const id of m.skillIds) {
      const k = r.state.skills.find((x) => x.id === id)!
      expect(k.edited).toBe(true)
      const rule = skillRuleOf(k)!
      expect(rule.outcomeLabels).toEqual(["Pass", "Not yet"])
      expect(rule.need).toBe(needs.get(id))
    }
    expect(methodById(r.state, m.id)?.rule.outcomeLabels).toEqual(["Pass", "Not yet"])
    const bad = saveMethod(seed, m.id, { ...next, outcomeLabels: ["Pass", "Pass"] }, opts)
    expect(bad.ok).toBe(false)
  })
})
