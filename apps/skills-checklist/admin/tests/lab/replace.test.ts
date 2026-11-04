import { describe, expect, it } from "vitest"
import { createSeed } from "@/lib/v2/seed"
import { cohortsOf } from "@/lib/v2/reports"
import { retireImpact, defaultSkillId } from "@/lib/lab/retire"
import { buildLibrary, mappingHref, replaceHref } from "@/lib/lab/library"
import { applyReplace, initialReplaceDraft, bothVersionsIn, versionOf, replaceImpact, replaceSource, studentsByGroup, successorOf, undoReplace, validateReplace } from "@/lib/lab/replace"

const AT = "2026-11-03T10:00:00.000Z"
const ACTOR = "u-admin"
const s0 = createSeed()
const oldId = defaultSkillId(s0)
const names = s0.skills.map((k) => k.name)

describe("Replace with a new version (lab, CALL 10-09 / INFER)", () => {
  it("numbers versions along the chain: an original is 1, each replacement one more", () => {
    expect(versionOf(s0, oldId)).toBe(1)
    const r1 = applyReplace(s0, oldId, initialReplaceDraft(replaceSource(s0, oldId)!), "lab-v2", ACTOR, AT)!
    expect(versionOf(r1.state, "lab-v2")).toBe(2)
    const r2 = applyReplace(r1.state, "lab-v2", initialReplaceDraft(replaceSource(r1.state, "lab-v2")!), "lab-v3", ACTOR, AT)!
    expect(versionOf(r2.state, "lab-v3")).toBe(3)
    const rows = buildLibrary(r2.state)
    expect(rows.find((x) => x.id === "lab-v3")!.version).toBe(3)
    expect(rows.find((x) => x.id === oldId)!.version).toBe(1)
    expect(rows.find((x) => x.id === oldId)!.replacedBy?.version).toBe(2)
    expect(buildLibrary(s0).find((x) => x.id === oldId)!.version ?? null).toBeNull()
  })

  it("prefills the new version from the old one: details, every course, every student group", () => {
    const src = replaceSource(s0, oldId)!
    const d = initialReplaceDraft(src)
    const old = s0.skills.find((k) => k.id === oldId)!
    // Same name by default; the version badge tells them apart, so the old name is not a duplicate here.
    expect(d.name).toBe(old.name)
    expect(d.tags).toEqual(old.tags ?? [])
    expect(d.courseIds.length).toBe(retireImpact(s0, oldId)!.courses)
    expect(d.cohorts).toEqual(cohortsOf(s0))
    expect(validateReplace(d, names, old.name)).toEqual({})
    expect(validateReplace({ ...d, cohorts: [] }, names, old.name).cohorts).toBeTruthy()
    const other = s0.skills.find((k) => k.id !== oldId)!.name
    expect(validateReplace({ ...d, name: other }, names, old.name).name).toContain("already in the library")
  })

  it("splits the students who have it now into those who move and those who stay", () => {
    const all = cohortsOf(s0)
    const one = [all[0]!]
    const i = replaceImpact(s0, oldId, one)!
    const byGroup = studentsByGroup(s0, oldId)
    expect(i.moving).toBe(byGroup.get(all[0]!) ?? 0)
    expect(i.moving + i.staying).toBe(retireImpact(s0, oldId)!.requiredFor)
    expect(i.allMove).toBe(all.length === 1)
    expect(replaceImpact(s0, oldId, all)!.allMove).toBe(true)
  })

  it("every group moves: the new version is configured like the old, takes its courses, and the old one is inactive", () => {
    const src = replaceSource(s0, oldId)!
    const d = initialReplaceDraft(src)
    const r = applyReplace(s0, oldId, d, "lab-new-1", ACTOR, AT)!
    expect(r.allMove).toBe(true)
    const neu = r.state.skills.find((k) => k.id === "lab-new-1")!
    const old = r.state.skills.find((k) => k.id === oldId)!
    expect(neu.configured).toBe(old.configured)
    expect(neu.model).toBe(old.model)
    expect(neu.replaces).toEqual({ id: oldId, cohorts: d.cohorts })
    expect(old.active).toBe(false)
    expect(new Set(r.state.mappings.filter((m) => m.skillId === "lab-new-1").map((m) => m.courseId)).size).toBe(d.courseIds.length)
    expect(successorOf(r.state, oldId)?.id).toBe("lab-new-1")
    // The library rows link both ways, and the old row reads Inactive.
    const rows = buildLibrary(r.state)
    const oldRow = rows.find((x) => x.id === oldId)!
    expect(oldRow.status).toBe("inactive")
    expect(oldRow.replacedBy).toEqual({ id: "lab-new-1", name: d.name, version: 2, cohorts: d.cohorts })
    expect(rows.find((x) => x.id === "lab-new-1")!.replaces).toEqual({ id: oldId, name: s0.skills.find((k) => k.id === oldId)!.name, version: 1 })
    // Evidence stays on the old version.
    expect(retireImpact(r.state, oldId)!.evidence).toBe(retireImpact(s0, oldId)!.evidence)
  })

  it("some groups move: the old version stays active for the others", () => {
    const src = replaceSource(s0, oldId)!
    const d = { ...initialReplaceDraft(src), cohorts: [cohortsOf(s0)[0]!] }
    const r = applyReplace(s0, oldId, d, "lab-new-2", ACTOR, AT)!
    expect(r.allMove).toBe(cohortsOf(s0).length === 1)
    expect(r.state.skills.find((k) => k.id === oldId)!.active).not.toBe(false)
  })

  it("flags staying groups that take a mapped course this term (both versions there), and only those", () => {
    const d = initialReplaceDraft(replaceSource(s0, oldId)!)
    expect(bothVersionsIn(s0, d)).toEqual([])
    const byGroup = studentsByGroup(s0, oldId)
    const withStudents = cohortsOf(s0).find((c) => (byGroup.get(c) ?? 0) > 0)!
    const flagged = bothVersionsIn(s0, { ...d, cohorts: d.cohorts.filter((c) => c !== withStudents) })
    expect(flagged.map((f) => f.cohort)).toEqual([withStudents])
    expect(flagged[0]!.courses.length).toBeGreaterThan(0)
    const empty = cohortsOf(s0).find((c) => (byGroup.get(c) ?? 0) === 0)
    if (empty) expect(bothVersionsIn(s0, { ...d, cohorts: d.cohorts.filter((c) => c !== empty) })).toEqual([])
  })

  it("undo removes the new version and restores the old one", () => {
    const src = replaceSource(s0, oldId)!
    const r = applyReplace(s0, oldId, initialReplaceDraft(src), "lab-new-3", ACTOR, AT)!
    const u = undoReplace(r.state, "lab-new-3", ACTOR, AT)
    expect(u.skills.some((k) => k.id === "lab-new-3")).toBe(false)
    expect(u.mappings.some((m) => m.skillId === "lab-new-3")).toBe(false)
    expect(u.skills.find((k) => k.id === oldId)!.active).not.toBe(false)
  })

  it("the row menu carries the skill: replace and mapping links name it", () => {
    expect(replaceHref("sk-x")).toBe("/lab/admin/skills-library?replace=sk-x")
    expect(mappingHref("sk-x")).toContain("skill=sk-x")
  })
})
