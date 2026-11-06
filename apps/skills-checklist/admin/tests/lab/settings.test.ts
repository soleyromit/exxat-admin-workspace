import { describe, expect, it } from "vitest"
import { createSeed } from "@/lib/v2/seed"
import { addVocab, deleteVocab, setVocabActive } from "@/lib/v2/vocabulary"
import { createV2Store } from "@/lib/v2/store"
import { addClinicalSetting, categoryRows, clinicalSettingRows, deleteClinicalSetting, inactiveLast, instructorRows, renameClinicalSetting, setClinicalSettingActive, tagRows, usesOf, validateClinicalSetting, validateEntry } from "@/lib/lab/settings"
import { CONFIGURATION_META, buildLibrary, filterLibrary } from "@/lib/lab/library"
import { configurationOf } from "@/lib/lab/program-settings"

const seed = createSeed()

describe("settings lists (SL-03 to SL-08)", () => {
  it("lists every category with its skill count, and blocks delete while used", () => {
    const rows = categoryRows(seed)
    expect(rows.reduce((t, r) => t + r.skills, 0)).toBe(seed.skills.length)
    for (const r of rows) {
      expect(r.blocked === null).toBe(r.uses === 0)
      expect(usesOf(seed, "categories", r.name)).toHaveLength(r.skills)
    }
  })

  it("counts tags across categories and opens lists of equal length", () => {
    const rows = tagRows(seed)
    expect(rows.length).toBeGreaterThan(0)
    for (const r of rows) expect(usesOf(seed, "tags", r.name)).toHaveLength(r.skills)
  })

  it("counts active sites, rules and courses per clinical setting with equal-length lists", () => {
    const rows = clinicalSettingRows(seed)
    expect(rows.map((r) => r.name)).toEqual(seed.program.clinicalSettings)
    expect(rows.reduce((t, r) => t + r.sites, 0)).toBeGreaterThan(50)
    for (const r of rows) {
      expect(usesOf(seed, "settings", r.name, r.id, "sites")).toHaveLength(r.sites)
      expect(usesOf(seed, "settings", r.name, r.id, "rules")).toHaveLength(r.rules)
      expect(usesOf(seed, "settings", r.name, r.id, "courses")).toHaveLength(r.courses)
    }
  })

  it("lists lab instructors with the evaluations they signed", () => {
    const rows = instructorRows(seed)
    expect(rows.length).toBe(seed.people.filter((p) => p.kind === "lab-instructor").length)
    for (const r of rows) expect(usesOf(seed, "instructors", r.name, r.id)).toHaveLength(r.evaluations)
  })

  it("categories come from the shared vocabulary: added entries are deletable, deactivated ones stay listed as inactive", () => {
    const used = categoryRows(seed)[0]
    const added = addVocab(seed, "categories", "Pediatrics", "u", "2026-10-27T00:00:00Z")
    if (!added.ok) throw new Error(added.error)
    const off = setVocabActive(added.state, "categories", used.id, false, "u", "2026-10-27T00:00:00Z")
    if (!off.ok) throw new Error(off.error)
    const rows = categoryRows(off.state)
    const ped = rows.find((r) => r.name === "Pediatrics")!
    expect(ped.blocked).toBeNull()
    expect(rows.find((r) => r.id === used.id)!.active).toBe(false)
    const del = deleteVocab(off.state, "categories", ped.id, "u", "2026-10-27T00:00:00Z")
    expect(del.ok && categoryRows(del.state).some((r) => r.name === "Pediatrics")).toBe(false)
  })

  it("validates inline create", () => {
    const names = categoryRows(seed).map((r) => r.name)
    expect(validateEntry("categories", "  ", names)).toMatch(/Enter a name/)
    expect(validateEntry("categories", names[0].toUpperCase(), names)).toMatch(/already/)
    expect(validateEntry("categories", "Pediatrics", names)).toBeNull()
    expect(validateEntry("instructors", "A. Lee", [], "nope")).toMatch(/email like/)
    expect(validateEntry("instructors", "A. Lee", [], "a.lee@example.org")).toBeNull()
  })

  it("clinical settings live in the program: added, renamed, deactivated, deleted, and lab or simulation is refused (SL-07, SC-12)", () => {
    const at = "2026-11-05T00:00:00Z"
    const added = addClinicalSetting(seed, "Telehealth", "u", at)
    if (!added.ok) throw new Error(added.error)
    expect(added.state.program.clinicalSettings).toContain("Telehealth")
    expect(addClinicalSetting(added.state, " telehealth ", "u", at).ok).toBe(false)
    for (const bad of ["Skills lab", "Simulation", "Standardized patient suite"]) expect(validateClinicalSetting(seed, bad)).toMatch(/recorded separately/)
    expect(added.state.program.clinicalSettings.some((x) => /\b(lab|simulation)\b/i.test(x))).toBe(false)

    const off = setClinicalSettingActive(added.state, "Telehealth", false, "u", at)
    if (!off.ok) throw new Error(off.error)
    expect(off.state.program.clinicalSettings).not.toContain("Telehealth")
    expect(clinicalSettingRows(off.state).find((r) => r.name === "Telehealth")!.active).toBe(false)
    const del = deleteClinicalSetting(off.state, "Telehealth", "u", at)
    expect(del.ok && clinicalSettingRows(del.state).some((r) => r.name === "Telehealth")).toBe(false)
    expect(deleteClinicalSetting(seed, "Inpatient", "u", at).ok).toBe(false)
  })

  it("renaming a clinical setting keeps every count and leaves untouched rows the same objects", () => {
    const before = clinicalSettingRows(seed).find((r) => r.name === "Inpatient")!
    const res = renameClinicalSetting(seed, "Inpatient", "Inpatient care", "u", "2026-11-05T00:00:00Z")
    if (!res.ok) throw new Error(res.error)
    const after = clinicalSettingRows(res.state).find((r) => r.name === "Inpatient care")!
    expect({ ...after, id: "", name: "" }).toEqual({ ...before, id: "", name: "" })
    // Completed evaluations are immutable: the rows are the seed's own objects, holding the stored name.
    expect(res.state.evaluations).toBe(seed.evaluations)
    expect(res.state.logEntries).toBe(seed.logEntries)
    expect(res.state.placements).toBe(seed.placements)
    expect(res.state.program.clinicalSettings).toContain("Inpatient care")
    expect(res.state.sites?.some((x) => x.clinicalSetting === "Inpatient")).toBe(false)
    expect(res.state.skills.some((k) => k.config?.achievement.settingMinimums.some((m) => m.setting === "Inpatient"))).toBe(false)
    expect(renameClinicalSetting(seed, "Inpatient", "Sim lab", "u", "2026-11-05T00:00:00Z").ok).toBe(false)
  })

  it("a rename leaves evaluation rows out of the save, and they read under the current name", () => {
    const storage = new Map<string, string>()
    const fake = { getItem: (k: string) => storage.get(k) ?? null, setItem: (k: string, v: string) => void storage.set(k, v), removeItem: (k: string) => void storage.delete(k) } as unknown as Storage
    const store = createV2Store({ storage: fake, key: "t" })
    store.hydrate()
    const held = seed.evaluations.filter((e) => e.clinicalSetting === "Inpatient").length
    store.update((s) => { const r = renameClinicalSetting(s, "Inpatient", "Inpatient care", "u", "2026-11-05T00:00:00Z"); return r.ok ? r.state : s })
    const saved = JSON.parse(storage.get("t")!) as { patch: { lists: Record<string, unknown>; set: Record<string, unknown> } }
    expect(saved.patch.lists.evaluations).toBeUndefined()
    expect(saved.patch.lists.logEntries).toBeUndefined()
    expect(saved.patch.lists.placements).toBeUndefined()
    expect(storage.get("t")!.length).toBeLessThan(200_000)
    const view = store.getSnapshot()
    expect(view.evaluations.filter((e) => e.clinicalSetting === "Inpatient care").length).toBe(held)
    expect(view.evaluations.some((e) => e.clinicalSetting === "Inpatient")).toBe(false)
    expect(clinicalSettingRows(view).find((r) => r.name === "Inpatient care")!.evidence).toBe(held)
    // An unrelated change after the rename still saves no evaluation rows.
    store.update((s) => ({ ...s, stepsReviewed: { ...s.stepsReviewed, x: "y" } }))
    expect((JSON.parse(storage.get("t")!) as typeof saved).patch.lists.evaluations).toBeUndefined()
    // A reload reads the same names.
    const again = createV2Store({ storage: fake, key: "t" })
    again.hydrate()
    expect(again.getSnapshot().evaluations.filter((e) => e.clinicalSetting === "Inpatient care").length).toBe(held)
    // Renaming twice, and back, keeps one name per setting.
    store.update((s) => { const r = renameClinicalSetting(s, "Inpatient care", "Acute", "u", "2026-11-05T00:00:00Z"); return r.ok ? r.state : s })
    expect(store.getSnapshot().evaluations.filter((e) => e.clinicalSetting === "Acute").length).toBe(held)
    store.update((s) => { const r = renameClinicalSetting(s, "Acute", "Inpatient", "u", "2026-11-05T00:00:00Z"); return r.ok ? r.state : s })
    expect(store.getSnapshot().evaluations.filter((e) => e.clinicalSetting === "Inpatient").length).toBe(held)
    expect(store.getSnapshot().program.clinicalSettingAliases?.Inpatient).toBeUndefined()
  })

  it("a former name cannot become a second setting", () => {
    const res = renameClinicalSetting(seed, "Inpatient", "Inpatient care", "u", "2026-11-05T00:00:00Z")
    if (!res.ok) throw new Error(res.error)
    const add = addClinicalSetting(res.state, "Inpatient", "u", "2026-11-05T00:00:00Z")
    expect(add.ok).toBe(false)
    expect(renameClinicalSetting(res.state, "Inpatient care", "Inpatient", "u", "2026-11-05T00:00:00Z").ok).toBe(true)
  })

  it("inactive rows sort last, except a row switched on this visit, which holds its place", () => {
    const base = [{ id: "a", active: true }, { id: "b", active: false }, { id: "c", active: true }] as never[]
    const ids = (r: { id: string }[]) => r.map((x) => x.id)
    expect(ids(inactiveLast(base))).toEqual(["a", "c", "b"])
    expect(ids(inactiveLast(base, new Set(["b"])))).toEqual(["a", "b", "c"])
  })

  it("the count opens a Library list of the same length, for every category and tag, and the count sheet uses the Library's word", () => {
    const rows = buildLibrary(seed)
    const NONE = { cat: null, tag: null, config: null, different: false, added: null }
    for (const r of categoryRows(seed)) expect(filterLibrary(rows, { ...NONE, cat: r.name })).toHaveLength(r.skills)
    for (const r of tagRows(seed)) expect(filterLibrary(rows, { ...NONE, tag: r.name })).toHaveLength(r.skills)
    const cat = categoryRows(seed)[0]
    const k = seed.skills.find((x) => x.category === cat.name)!
    expect(usesOf(seed, "categories", cat.name).find((l) => l.key === k.id)!.secondary).toBe(CONFIGURATION_META[configurationOf(seed, k)].label)
  })
})
