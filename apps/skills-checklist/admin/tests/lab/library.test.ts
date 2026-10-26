import { describe, expect, it } from "vitest"
import { trackedAgainst } from "@/lib/v2/admin-actions"
import { deleteImpact } from "@/lib/lab/retire"
import { createSeed } from "@/lib/v2/seed"
import {
  EMPTY_DRAFT,
  EMPTY_OVERLAY,
  buildLibrary,
  buildTree,
  byStatus,
  countLibrary,
  demoInactiveIds,
  draftToSkill,
  isDirty,
  LIBRARY_TABS,
  NO_CATEGORY,
  findDuplicate,
  parseSeveral,
  pickerOptions,
  rollupLabel,
  rowsForTab,
  tabCount,
  validateDraft,
} from "@/lib/lab/library"
import { facts } from "@/lib/v2/facts"
import { setSkillsActive } from "@/lib/v2/admin-actions"

const state = createSeed()
const rows = buildLibrary(state)

describe("lab skills library model", () => {
  it("covers the scaled library, not a demo subset", () => {
    expect(rows.length).toBe(state.skills.length)
    expect(rows.length).toBeGreaterThanOrEqual(150)
  })

  it("puts every skill in exactly one status and the counts add up", () => {
    const c = countLibrary(rows)
    expect(c.notConfigured + c.configured + c.published + c.inactive).toBe(c.total)
    expect(c.notConfigured).toBeGreaterThan(0)
    expect(c.inactive).toBe(demoInactiveIds(state).length)
    const b = byStatus(rows)
    expect(Object.values(b).flat().length).toBe(c.total)
  })

  it("builds a section > group tree whose roll-ups match the flat counts", () => {
    const tree = buildTree(rows)
    expect(tree.length).toBeGreaterThanOrEqual(10)
    const sum = tree.reduce((n, s) => n + s.counts.total, 0)
    expect(sum).toBe(rows.length)
    const groups = tree.flatMap((s) => s.groups)
    expect(groups.length).toBeGreaterThanOrEqual(15)
    for (const s of tree) {
      const inner = s.rows.length + s.groups.reduce((n, g) => n + g.rows.length, 0)
      expect(inner).toBe(s.counts.total)
    }
    expect(rollupLabel({ total: 10, notConfigured: 2, configured: 1, published: 6, inactive: 1, ready: 7 })).toBe("7 of 9 configured")
  })

  it("allows delete only while nothing is tracked against a skill; a mapping never blocks it (D-X15)", () => {
    for (const r of rows) expect(r.canDelete, r.id).toBe(trackedAgainst(state, r.id).total === 0)
    for (const r of rows) if (r.evidence > 0) expect(r.canDelete).toBe(false)
    expect(rows.some((r) => r.evidence > 0)).toBe(true)
    const mappedFree = rows.find((r) => r.canDelete && r.courses > 0)!
    expect(mappedFree).toBeDefined()
    expect(mappedFree.unmapFrom).toHaveLength(mappedFree.courses)
    expect(mappedFree.unmapFrom).toEqual(deleteImpact(state, mappedFree.id)!.unmapFrom)
  })

  it("adds, deactivates, reactivates and deletes through the overlay only", () => {
    const added = draftToSkill({ ...EMPTY_DRAFT, name: "  Wound   vac  ", section: "Safety" }, "lab-new-1")
    const next = buildLibrary(state, { ...EMPTY_OVERLAY, added: [added] })
    expect(next[0]).toMatchObject({ id: "lab-new-1", name: "Wound vac", status: "not-configured", isNew: true, canDelete: true })
    const target = rows.find((r) => r.status === "published")!
    const off = buildLibrary(state, { ...EMPTY_OVERLAY, inactive: [target.id] })
    expect(off.find((r) => r.id === target.id)?.status).toBe("inactive")
    const demo = demoInactiveIds(state)[0]!
    const back = buildLibrary(state, { ...EMPTY_OVERLAY, reactivated: [demo] })
    expect(back.find((r) => r.id === demo)?.status).not.toBe("inactive")
    const gone = buildLibrary(state, { ...EMPTY_OVERLAY, added: [added], deleted: ["lab-new-1"] })
    expect(gone.some((r) => r.id === "lab-new-1")).toBe(false)
    expect(state.skills.length).toBe(rows.length)
  })

  it("validates a new skill with inline, actionable errors; category is optional (REQ SL-03)", () => {
    const names = rows.map((r) => r.name)
    expect(validateDraft(EMPTY_DRAFT, names)).toEqual({ name: "Enter a name." })
    const typed = ` ${names[3]!.toUpperCase()} `
    const dup = validateDraft({ ...EMPTY_DRAFT, name: typed, section: "Safety" }, names)
    expect(dup.name).toBe(`${names[3]!} is already in the library.`)
    expect(findDuplicate(typed, rows)?.id).toBe(rows[3]!.id)
    expect(findDuplicate("Brand new skill", rows)).toBeNull()
    expect(validateDraft({ ...EMPTY_DRAFT, name: "Brand new skill" }, names)).toEqual({})
    expect(isDirty(EMPTY_DRAFT)).toBe(false)
    expect(isDirty({ ...EMPTY_DRAFT, name: "x" })).toBe(true)
  })

  it("files a skill added without a category under No category, and keeps required to graduate", () => {
    const a = draftToSkill({ ...EMPTY_DRAFT, name: "Chest tube care", requiredToGraduate: true }, "lab-new-2")
    const r = buildLibrary(state, { ...EMPTY_OVERLAY, added: [a] })[0]!
    expect(r).toMatchObject({ section: NO_CATEGORY, requiredToGraduate: true, status: "not-configured", model: null })
    expect(pickerOptions([r, ...rows]).sections).not.toContain(NO_CATEGORY)
    expect(rows.filter((x) => x.requiredToGraduate).length).toBe(state.skills.filter((k) => k.hgtc?.required).length)
  })

  it("status tab counts are the library counts and agree with the shared facts (consistency invariant)", () => {
    const c = countLibrary(rows)
    const f = facts(state)
    expect(LIBRARY_TABS.map((t) => t.label)).toEqual(["All", "Not configured", "Configured", "Published", "Inactive"])
    for (const t of LIBRARY_TABS) expect(tabCount(c, t.value), t.value).toBe(rowsForTab(rows, t.value).length)
    expect(tabCount(c, "all")).toBe(state.skills.length)
    expect(tabCount(c, "inactive")).toBe(f.skillsInactive)
    // facts counts inactive skills by configuration too; the tabs put every inactive skill under Inactive.
    const inactiveUnconfigured = state.skills.filter((k) => k.active === false && !k.configured).length
    expect(tabCount(c, "not-configured") + inactiveUnconfigured).toBe(f.skillsNotConfigured)
    expect(tabCount(c, "configured") + tabCount(c, "published") + (c.inactive - inactiveUnconfigured)).toBe(f.skillsConfigured)
  })

  it("moves a deactivated skill to the Inactive tab through the shared store, so facts and tabs change together (D-X14)", () => {
    const target = rows.find((r) => r.status === "published")!
    const r = setSkillsActive(state, [target.id], false, "u-admin", "2026-10-26T09:00:00Z")
    expect(r.ok).toBe(true)
    if (!r.ok) return
    const after = countLibrary(buildLibrary(r.state))
    expect(after.inactive).toBe(countLibrary(rows).inactive + 1)
    expect(after.inactive).toBe(facts(r.state).skillsInactive)
    expect(after.published).toBe(countLibrary(rows).published - 1)
  })

  it("adds several by name: strips bullets, skips repeats and names already in the library", () => {
    const existing = rows[0]!.name
    const text = `1. Chest tube care\n- chest  tube care\n\n• Tracheostomy suctioning\n${existing.toUpperCase()}\n${"x".repeat(130)}`
    const p = parseSeveral(text, rows.map((r) => r.name))
    expect(p.ready).toEqual(["Chest tube care", "Tracheostomy suctioning"])
    expect(p.lines.map((l) => l.kind)).toEqual(["ready", "in-paste", "ready", "in-library", "too-long"])
    expect(p.lines[2]!.line).toBe(4)
    expect(parseSeveral("  \n\n", []).lines).toEqual([])
  })

  it("never assumes a default evaluation model", () => {
    expect(EMPTY_DRAFT.model).toBeNull()
    expect(draftToSkill({ ...EMPTY_DRAFT, name: "A", section: "B" }, "x").model).toBeNull()
  })

  it("offers pickers from the program's own library", () => {
    const p = pickerOptions(rows)
    expect(p.sections.length).toBeGreaterThanOrEqual(10)
    expect(Object.keys(p.groupsBySection).length).toBeGreaterThan(0)
  })

  it("matches the scaled seed shape the design assumes", () => {
    const c = countLibrary(rows)
    expect(c.total).toBe(178)
    expect(c.notConfigured).toBe(16)
    expect(rows.filter((r) => r.courses > 0).length).toBeGreaterThan(100)
  })
})
