import { describe, expect, it } from "vitest"
import * as S from "@/lib/store"
import { SCENARIO } from "@/lib/seed"
import { ctx, deepFreeze, must, seed } from "./helpers"

describe("library actions are pure", () => {
  it("never mutate their input", () => {
    const db = deepFreeze(seed())
    expect(() => S.createSkill(db, { name: "Frozen test" }, ctx)).not.toThrow()
  })
})

describe("skills (SL-02, SL-03, SL-04, SL-05, SL-11, SC-01, IM-12)", () => {
  it("creates a skill UNCONFIGURED with no default model (SC-01, SC-02)", () => {
    const { db, value } = must(S.createSkill(seed(), { name: "  Sample new skill ", description: "d" }, ctx))
    const s = db.skills.find((x) => x.id === value.skillId)!
    expect(s.name).toBe("Sample new skill")
    expect(s.model).toBeNull()
    expect(s.active).toBe(true)
    expect(S.unconfiguredCount(db)).toBe(3)
  })

  it("refuses an empty or duplicate name (normalised)", () => {
    const db = seed()
    expect(S.createSkill(db, { name: "  " }, ctx)).toMatchObject({ ok: false, error: { code: "invalid" } })
    expect(S.createSkill(db, { name: "iv  INSERTION" }, ctx)).toMatchObject({ ok: false, error: { code: "duplicate" } })
  })

  it("allows at most one category and any tags, and creates a category or tag inline (SL-03..SL-05)", () => {
    let db = seed()
    const c = must(S.createTaxon(db, "category", { name: "Category Z" }))
    db = c.db
    const t = must(S.createTaxon(db, "tag", { name: "Tag Z" }))
    db = t.db
    const r = must(S.createSkill(db, { name: "Inline skill", categoryId: c.value.id, tagIds: [t.value.id, "tag-a"] }, ctx))
    const sk = r.db.skills.find((x) => x.id === r.value.skillId)!
    expect(sk.categoryId).toBe(c.value.id)
    expect(sk.tagIds).toEqual([t.value.id, "tag-a"])
  })

  it("only active categories and tags are assignable, but one already assigned and deactivated stays (SL-06)", () => {
    let db = seed()
    expect(S.createSkill(db, { name: "X", tagIds: ["tag-d"] }, ctx)).toMatchObject({ ok: false, error: { code: "invalid" } })
    // sk-vitals already carries inactive tag-d: editing something else keeps it
    db = must(S.updateSkillDefinition(db, "sk-vitals", { description: "changed" })).db
    expect(db.skills.find((s) => s.id === "sk-vitals")!.tagIds).toContain("tag-d")
    // deactivating a category never removes it from skills that carry it
    db = must(S.setTaxonActive(db, "category", "cat-a", false)).db
    expect(db.skills.filter((s) => s.categoryId === "cat-a").length).toBeGreaterThan(0)
    expect(S.updateSkillDefinition(db, "sk-recon", { categoryId: "cat-a" })).toMatchObject({ ok: false })
    expect(S.updateSkillDefinition(db, "sk-iv", { description: "ok" }).ok).toBe(true)
  })

  it("search and filter by name, category, tag and status (SL-10)", () => {
    const db = seed()
    expect(S.listSkills(db, { q: "foley" }).map((r) => r.skill.id)).toEqual(["sk-foley"])
    expect(S.listSkills(db, { categoryId: "cat-a" }).every((r) => r.skill.categoryId === "cat-a")).toBe(true)
    expect(S.listSkills(db, { categoryId: "none" }).length).toBeGreaterThan(0)
    expect(S.listSkills(db, { tagId: "tag-c" }).every((r) => r.skill.tagIds.includes("tag-c"))).toBe(true)
    expect(S.listSkills(db, { status: "unconfigured" })).toHaveLength(2)
    expect(S.listSkills(db, { batchId: "imp-1" })).toHaveLength(2)
  })

  it("deactivating withdraws mapping, selection and reporting scope but retains evidence (SL-11)", () => {
    let db = seed()
    const before = S.evidenceLedger(db, SCENARIO.noah, "sk-iv").length
    db = must(S.setSkillActive(db, "sk-iv", false)).db
    expect(S.reportBySkill(db, {}).rows.some((r) => r.skill.id === "sk-iv")).toBe(false)
    expect(S.offeringMapping(db, "off-350-f26").rows.some((r) => r.skill.id === "sk-iv")).toBe(false)
    expect(S.courseSkills(db, SCENARIO.noah, "off-350-f26")!.mapped.some((r) => r.skill.id === "sk-iv")).toBe(false)
    expect(S.evidenceLedger(db, SCENARIO.noah, "sk-iv")).toHaveLength(before)
    // reactivation needs a configured skill (IM-09)
    expect(S.setSkillActive(db, "sk-ng", true)).toMatchObject({ ok: false, error: { code: "skillNotUsable" } })
    expect(S.setSkillActive(db, "sk-iv", true).ok).toBe(true)
  })
})

describe("clinical settings (SL-07, OD-26)", () => {
  it("creates, renames and refuses duplicates", () => {
    let db = seed()
    db = must(S.createClinicalSetting(db, { name: "Telehealth" })).db
    expect(S.createClinicalSetting(db, { name: "telehealth" })).toMatchObject({ ok: false, error: { code: "duplicate" } })
    expect(S.renameClinicalSetting(db, "set-inpatient", "Emergency")).toMatchObject({ ok: false })
  })

  it("OD-26: cannot deactivate a setting that a skill minimum still names, and names the skills; others can", () => {
    const db = seed()
    const r = S.setClinicalSettingActive(db, "set-inpatient", false)
    expect(r).toMatchObject({ ok: false, error: { code: "settingReferenced", data: { skillNames: ["Wound Care"] } } })
    expect(S.setClinicalSettingActive(db, "set-periop", false).ok).toBe(true)
  })

  it("counts evidence recorded per setting", () => {
    const rows = S.settingRows(seed())
    expect(rows.find((r) => r.item.id === "set-outpatient")!.evidenceCount).toBeGreaterThan(0)
    expect(rows.find((r) => r.item.id === "set-inpatient")!.referencedBy.map((x) => x.id)).toEqual(["sk-wound"])
  })
})

describe("lab instructors (SL-08, SL-09)", () => {
  it("need only a name and a valid email; no account exists", () => {
    const db = seed()
    expect(S.createLabInstructor(db, { name: "A. Test", email: "not-an-email" })).toMatchObject({ ok: false, error: { fields: { email: "format" } } })
    expect(S.createLabInstructor(db, { name: "A. Test", email: "t.ferreira@example.edu" })).toMatchObject({ ok: false, error: { fields: { email: "duplicate" } } })
    const r = must(S.createLabInstructor(db, { name: "A. Test", email: "a.test@example.edu" }))
    expect(r.db.labInstructors).toHaveLength(3)
    expect(Object.keys(r.db.labInstructors[2]).sort()).toEqual(["active", "email", "id", "name"])
  })

  it("adopting a student-named instructor joins the roster, repoints submissions and links, and never rewrites an Evaluation (SL-09, RV-03)", () => {
    const db = seed()
    const evalsBefore = JSON.stringify(db.evaluations)
    const r = must(S.adoptNamedLabInstructor(db, "named-whitmore"))
    expect(r.db.labInstructors.find((l) => l.id === r.value.labInstructorId)!.name).toBe("R. Whitmore")
    expect(S.labInstructorRows(r.db).named).toHaveLength(0)
    const sub = r.db.submissions.find((s) => s.evaluator.name === "R. Whitmore")!
    expect(sub.evaluator.source).toBe("roster")
    expect(JSON.stringify(r.db.evaluations)).toBe(evalsBefore)
  })

  it("adopting merges into an existing roster entry with the same email so there is no duplicate spelling", () => {
    let db = seed()
    db = { ...db, namedLabInstructors: [...db.namedLabInstructors, { id: "named-x", name: "T Ferreira", email: "T.Ferreira@example.edu", namedByStudentId: "stu-07", adoptedAs: null }] }
    const r = must(S.adoptNamedLabInstructor(db, "named-x"))
    expect(r.value.labInstructorId).toBe("lab-ferreira")
    expect(r.db.labInstructors).toHaveLength(2)
  })
})

describe("SL-09 merge a student-typed spelling into a DIFFERENT roster entry (S-07 T3)", () => {
  it("repoints open submissions and links, keeps every Evaluation untouched, and counts follow the adoption link (RV-03)", () => {
    const db = seed()
    const evalsBefore = JSON.stringify(db.evaluations)
    const r = must(S.mergeNamedLabInstructor(db, "named-whitmore", "lab-ferreira"))
    expect(r.value.labInstructorId).toBe("lab-ferreira")
    expect(r.db.labInstructors).toHaveLength(db.labInstructors.length) // no new roster entry
    expect(S.labInstructorRows(r.db).named).toHaveLength(0)
    expect(r.db.submissions.filter((x) => x.evaluator.personId === "named-whitmore")).toHaveLength(0)
    expect(JSON.stringify(r.db.evaluations)).toBe(evalsBefore)
    expect(S.rosterEvaluationCount(r.db, "lab-ferreira")).toBeGreaterThanOrEqual(S.rosterEvaluationCount(db, "lab-ferreira"))
  })

  it("is pure and refuses an unknown name or target", () => {
    const db = deepFreeze(seed())
    expect(S.mergeNamedLabInstructor(db, "nope", "lab-ferreira")).toMatchObject({ ok: false, error: { code: "notFound" } })
    expect(S.mergeNamedLabInstructor(db, "named-whitmore", "nope")).toMatchObject({ ok: false, error: { code: "notFound" } })
    must(S.mergeNamedLabInstructor(db, "named-whitmore", "lab-ferreira")) // frozen input would throw on mutation
  })

  it("similarRosterEntry hints at a roster entry with the same last name", () => {
    const db = seed()
    expect(S.similarRosterEntry(db, "Tom Ferreira")).toMatchObject({ id: "lab-ferreira" })
    expect(S.similarRosterEntry(db, "A")).toBeNull()
  })
})

describe("S-06 'Required by' and the S-04 setting filter (OD-26)", () => {
  it("skillsRequiringSetting lists exactly the skills whose minimum names the setting, and listSkills can filter by it", () => {
    const db = seed()
    const named = S.skillsRequiringSetting(db, "set-inpatient")
    expect(named.length).toBeGreaterThan(0)
    const rows = S.listSkills(db, { settingId: "set-inpatient" })
    expect(rows.map((r) => r.skill.id).sort()).toEqual(named.map((n) => n.id).sort())
    expect(S.skillsRequiringSetting(db, "set-community").length).toBe(S.settingRows(db).find((x) => x.item.id === "set-community")!.referencedBy.length)
    expect(S.listSkills(db, { settingId: "set-does-not-exist" })).toHaveLength(0)
  })
})
