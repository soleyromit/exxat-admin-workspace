import { describe, expect, it } from "vitest"
import { createSeed } from "@/lib/v2/seed"
import { populationRows, requiredSets } from "@/lib/v2/population"
import { buildStudent } from "@/lib/lab/student"
import { buildAttainment } from "@/lib/lab/attainment"
import { buildReadiness } from "@/lib/lab/director"
import { EMPTY_SCOPE } from "@/lib/lab/scope"
import { assignedSkillIdsByStudent, customGroupValue, programLists, seedLists, studentsWithNoList, type ListsOverlay } from "@/lib/lab/lists"
import { levelOf, levelSourceOf, noCourseIds, offeringById, offeringRows, overlayChanges, skillReach, tidyOverlay, type MappingOverlay } from "@/lib/lab/mapping"
import { setupResult, courseGapIds } from "@/lib/lab/setup-result"
import type { V2State } from "@/lib/v2/types"

const seed = createSeed()
const GRACE = "stu-g-038"
const FA26 = "off-nur220-fa26"
const SP27 = "off-nur220-sp27"
const COHORT = "coh-2026"
const edit = (s: V2State, o: MappingOverlay): V2State => ({ ...s, offeringLevels: o })
const unmapped = seed.skills.find((k) => k.active !== false && k.published && k.configured && !seed.mappings.some((m) => m.courseId === "crs-nur220" && m.skillId === k.id))!

describe("a level set on one offering reaches students and reports [REQ CM-03, CM-08]", () => {
  const s = edit(seed, { [FA26]: { [unmapped.id]: "mandatory" } })

  it("the required set of that term moves, and no other term's", () => {
    const fa = requiredSets(s, { course: "" }, "trm-fa26").get(COHORT)!.map((r) => r.skill.id)
    const sp = requiredSets(s, { course: "" }, "trm-sp27").get(COHORT)!.map((r) => r.skill.id)
    expect(fa).toContain(unmapped.id)
    expect(sp).not.toContain(unmapped.id)
  })
  it("the student's course page shows it, and Not mapped takes a seeded one off", () => {
    const before = buildStudent(seed, GRACE)!.courses.find((c) => c.id === "crs-nur220")!
    const after = buildStudent(s, GRACE)!.courses.find((c) => c.id === "crs-nur220")!
    expect(after.mandatory).toBe(before.mandatory + 1)
    expect(after.skills.some((k) => k.id === unmapped.id && k.level === "mandatory")).toBe(true)
    const seeded = before.skills.find((k) => k.level === "mandatory")!
    const off = buildStudent(edit(seed, { [FA26]: { [seeded.id]: "none" } }), GRACE)!.courses.find((c) => c.id === "crs-nur220")!
    expect(off.mandatory).toBe(before.mandatory - 1)
    expect(off.skills.some((k) => k.id === seeded.id)).toBe(false)
  })
  it("attainment reads the same set", () => {
    const scope = { ...EMPTY_SCOPE, cohort: "BSN 2026" }
    const before = buildAttainment(seed, scope, undefined, { basis: "thisTerm" })
    const after = buildAttainment(s, scope, undefined, { basis: "thisTerm" })
    expect(after.total).toBe(before.total + before.pop.rows.length)
    expect(after.skills.some((k) => k.skillId === unmapped.id)).toBe(true)
  })
  it("with no edits nothing moves", () => {
    expect(requiredSets(edit(seed, {}), { course: "" }, "trm-fa26").get(COHORT)!.length).toBe(requiredSets(seed, { course: "" }, "trm-fa26").get(COHORT)!.length)
  })
})

describe("a level never writes across offerings [REQ CM-06, CM-08]", () => {
  const off = (id: string) => offeringById(seed, id)!
  it("the other offering keeps its level", () => {
    const o = { [FA26]: { [unmapped.id]: "mandatory" as const } }
    expect(levelOf(seed, o, off(FA26), unmapped.id)).toBe("mandatory")
    expect(levelOf(seed, o, off(SP27), unmapped.id)).not.toBe("mandatory")
  })
})

describe("admin and student count the same mapped skills (D-L76, REQ CM-04, ST-01)", () => {
  const student = buildStudent(seed, GRACE)!.courses.find((c) => c.id === "crs-nur220")!
  const admin = offeringRows(seed, {}).find((r) => r.id === FA26)!
  it("NUR 220, Fall 2026: the admin's mapped count is what the student's course page lists", () => {
    expect(admin.mapped).toBe(12)
    expect(admin.mandatory).toBe(3)
    expect(admin.recommended).toBe(9)
    expect(student.skills.length).toBe(admin.mapped)
    expect(student.mandatory).toBe(admin.mandatory)
    expect(student.recommended).toBe(admin.recommended)
  })
  it("a level set moves both by one, and Undo puts them back", () => {
    const o: MappingOverlay = { [FA26]: { [unmapped.id]: "recommended" } }
    expect(offeringRows(edit(seed, o), o).find((r) => r.id === FA26)!.mapped).toBe(admin.mapped + 1)
    expect(buildStudent(edit(seed, o), GRACE)!.courses.find((c) => c.id === "crs-nur220")!.skills.length).toBe(student.skills.length + 1)
    expect(buildStudent(edit(seed, {}), GRACE)!.courses.find((c) => c.id === "crs-nur220")!.skills.length).toBe(student.skills.length)
  })
  it("a stored Optional, seeded or edited, reads as Not mapped on both sides", () => {
    const off = offeringById(seed, FA26)!
    const seeded = seed.mappings.find((m) => m.courseId === "crs-nur220" && m.level === "optional")
    if (seeded) expect(levelOf(seed, {}, off, seeded.skillId)).toBe("none")
    const stale = { [FA26]: { [unmapped.id]: "optional" } } as unknown as MappingOverlay
    expect(levelOf(seed, stale, off, unmapped.id)).toBe("none")
    expect(buildStudent(edit(seed, stale), GRACE)!.courses.find((c) => c.id === "crs-nur220")!.skills.some((k) => k.id === unmapped.id)).toBe(false)
  })
  it("an unmapped skill still counts on the student's record [REQ CM-05]", () => {
    const k = buildStudent(seed, GRACE)!.all.find((r) => r.level === "evidence")
    expect(k).toBeDefined()
  })
})

describe("a change means changed", () => {
  const off = offeringById(seed, FA26)!
  const seeded = seed.mappings.find((m) => m.courseId === "crs-nur220" && m.level === "mandatory")!.skillId
  it("an edit equal to the value underneath is no edit", () => {
    const o: MappingOverlay = { [FA26]: { [seeded]: "mandatory" } }
    expect(levelSourceOf(seed, o, off, seeded)).toBe("explicit")
    expect(overlayChanges(seed, {}, o)).toEqual([])
    expect(tidyOverlay(seed, o)).toEqual({})
  })
  it("a real one is", () => {
    const o: MappingOverlay = { [FA26]: { [seeded]: "recommended" } }
    expect(levelSourceOf(seed, o, off, seeded)).toBe("overlay")
    expect(overlayChanges(seed, {}, o)).toEqual([{ offeringId: FA26, skillId: seeded, level: "recommended" }])
  })
})

describe("one definition of in a course", () => {
  it("the mapped count and In no course cannot disagree, and Coverage reads the same set", () => {
    const lists = seedLists(seed)
    const reach = skillReach(seed, {}, "", lists)
    const none = noCourseIds(seed, {}, lists)
    for (const r of reach) if (none.has(r.id)) expect(r.courses).toBe(0)
    const result = setupResult(seed, lists, {}, [], reach.map((r) => r.id))
    expect([...courseGapIds(result)].sort()).toEqual([...none].sort())
  })
  it("setting a level takes a skill out of In no course", () => {
    const lists = seedLists(seed)
    const id = [...noCourseIds(seed, {}, lists)][0]!
    const clinical = "off-nur220-fa26"
    expect(noCourseIds(seed, { [clinical]: { [id]: "recommended" } }, lists).has(id)).toBe(false)
  })
})

describe("assignment reads the admin's list edits, in shared code [REQ CM, D-L53]", () => {
  const withEdits = (o: ListsOverlay): V2State => ({ ...seed, listEdits: o })
  it("programLists applies the saved edits", () => {
    expect(programLists(withEdits({ created: [], edits: { "list-core": { groupIds: [] } } })).find((l) => l.id === "list-core")!.groupIds).toEqual([])
  })
  it("removing BSN 2026's list reaches readiness: the group reads as unassigned, with nothing from the default list (D-L103)", () => {
    const s = withEdits({ created: [], edits: { "list-core": { groupIds: [] } } })
    const before = assignedSkillIdsByStudent(seed).get(GRACE)!
    const after = assignedSkillIdsByStudent(s).get(GRACE)!
    expect(before.size).toBeGreaterThan(0)
    expect(after.size).toBe(0)
    const scope = { ...EMPTY_SCOPE, cohort: "BSN 2026" }
    expect(buildReadiness(seed, scope).rows.some((r) => r.id === GRACE)).toBe(true)
    expect(buildReadiness(s, scope).rows.some((r) => r.id === GRACE)).toBe(false)
    expect(populationRows(s, scope).unassigned.some((p) => p.id === GRACE)).toBe(true)
    expect(studentsWithNoList(s).some((p) => p.id === GRACE)).toBe(true)
  })
  it("a list on a custom group reaches its students with no store behind it", () => {
    const id = customGroupValue({ graduationYear: 2026 })
    const s = withEdits({ created: [], edits: { "list-competencies": { groupIds: [id] }, "list-core": { groupIds: [] } } })
    const comp = programLists(s).find((l) => l.id === "list-competencies")!
    const mine = assignedSkillIdsByStudent(s).get(GRACE)!
    expect(comp.skillIds.every((k) => mine.has(k))).toBe(true)
  })
  it("a new program has only the lists it made", () => {
    expect(programLists({ ...seed, ownListsOnly: true })).toEqual([])
  })
})
