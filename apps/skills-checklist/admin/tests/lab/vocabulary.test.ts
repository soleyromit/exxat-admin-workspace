import { describe, expect, it } from "vitest"
import { createSeed } from "@/lib/v2/seed"
import { facts } from "@/lib/v2/facts"
import { diffState, applyPatch } from "@/lib/v2/store"
import { activeNames, addVocab, deleteVocab, getVocabulary, isInactiveName, renameVocab, setVocabActive, usesOfName } from "@/lib/v2/vocabulary"

const seed = createSeed()
const AT = "2026-10-27T09:00:00Z"
const ok = <T extends { ok: boolean }>(r: T) => {
  if (!r.ok) throw new Error((r as unknown as { error: string }).error)
  return r as Extract<T, { ok: true }>
}

describe("shared vocabulary (REQ SL-03 to SL-06)", () => {
  it("derives the seed's categories and tags from the skills, all active, with the agreed shape", () => {
    const v = getVocabulary(seed)
    expect(seed.vocabulary).toBeUndefined()
    expect(v.categories.length).toBe(new Set(seed.skills.map((k) => k.category).filter(Boolean)).size)
    expect(v.tags.length).toBe(new Set(seed.skills.flatMap((k) => k.tags ?? [])).size)
    for (const e of [...v.categories, ...v.tags]) expect(Object.keys(e).sort()).toEqual(["active", "id", "name"])
    expect(v.categories.every((e) => e.active)).toBe(true)
  })

  it("SL-05: an entry created with no skill yet is in the list and offered for assignment", () => {
    const r = ok(addVocab(seed, "tags", "Pediatrics", "u", AT))
    expect(getVocabulary(r.state).tags.some((e) => e.name === "Pediatrics" && e.active)).toBe(true)
    expect(activeNames(r.state, "tags")).toContain("Pediatrics")
    expect(addVocab(r.state, "tags", " pediatrics ", "u", AT).ok).toBe(false)
  })

  it("SL-06: a deactivated category stays on its skills, is marked inactive, and is no longer offered", () => {
    const cat = getVocabulary(seed).categories[0]
    const r = ok(setVocabActive(seed, "categories", cat.id, false, "u", AT))
    expect(r.state.skills.filter((k) => k.category === cat.name).length).toBe(usesOfName(seed, "categories", cat.name))
    expect(isInactiveName(r.state, "categories", cat.name)).toBe(true)
    expect(activeNames(r.state, "categories")).not.toContain(cat.name)
  })

  it("rename changes the name on every skill that carries it, and nothing else", () => {
    const tag = getVocabulary(seed).tags.find((e) => usesOfName(seed, "tags", e.name) > 0)!
    const n = usesOfName(seed, "tags", tag.name)
    const r = ok(renameVocab(seed, "tags", tag.id, "Renamed tag", "u", AT))
    expect(usesOfName(r.state, "tags", "Renamed tag")).toBe(n)
    expect(usesOfName(r.state, "tags", tag.name)).toBe(0)
    expect(getVocabulary(r.state).tags.find((e) => e.id === tag.id)!.name).toBe("Renamed tag")
  })

  it("delete is refused while a skill uses the entry, allowed once nothing does", () => {
    const used = getVocabulary(seed).categories.find((e) => usesOfName(seed, "categories", e.name) > 0)!
    const refused = deleteVocab(seed, "categories", used.id, "u", AT)
    expect(refused.ok).toBe(false)
    if (!refused.ok) expect(refused.error).toMatch(/Deactivate it instead/)
    const added = ok(addVocab(seed, "categories", "Unused", "u", AT))
    const id = getVocabulary(added.state).categories.find((e) => e.name === "Unused")!.id
    expect(getVocabulary(ok(deleteVocab(added.state, "categories", id, "u", AT)).state).categories.some((e) => e.id === id)).toBe(false)
  })

  it("persists through the store delta, and seeding it changes no shared figure", () => {
    const r = ok(addVocab(seed, "tags", "Persisted", "u", AT))
    const back = applyPatch(seed, JSON.parse(JSON.stringify(diffState(seed, r.state))))!
    expect(getVocabulary(back).tags.some((e) => e.name === "Persisted")).toBe(true)
    const f0 = facts(seed)
    const f1 = facts(r.state)
    for (const k of Object.keys(f0) as (keyof typeof f0)[]) expect(f1[k]).toEqual(f0[k])
  })
})
