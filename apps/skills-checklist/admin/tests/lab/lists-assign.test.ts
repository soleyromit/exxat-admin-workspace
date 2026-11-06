import { SAMPLE_CUSTOM_GROUPS, groupOptions } from "@/lib/v2/filters"
import { describe, expect, it } from "vitest"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { createSeed } from "@/lib/v2/seed"
import { labState } from "@/lib/lab/reviewer"
import {
  applyListsOverlay,
  assign,
  assignmentSummary,
  clinicalOfferingsFor,
  cohortGroupId,
  createList,
  defaultList,
  diffLists,
  listById,
  defaultForNewGroup,
  detachGroup,
  renameList,
  validateGroupName,
  validateListName,
  GROUP_NAME_MAX,
  LIST_NAME_MAX,
  inheritableSkillIds,
  listsReaching,
  newVersion,
  seedLists,
  setListSkills,
  skillLists,
  studentGroups,
  studentsOnList,
  unassign,
} from "@/lib/lab/lists"
import { EMPTY_MAPPING_OVERLAY, resolvedLevels, skillRowsFor } from "@/lib/lab/mapping"
import { findFlow, stepOf } from "@/lib/lab/flows"

// The "Assign to cohort or group" step after Sankalp's 2026-10-27 review: one job (which students use this list), its consequence
// in one sentence, and assignment still drives cohort inheritance (decision D-X27).

const s = labState(createSeed())
const lists = seedLists(s)
const groups = studentGroups(s)
const BSN28 = (s.cohorts ?? []).find((c) => c.name === "BSN 2028")!
const kindOf = (courseId: string) => (s.courses ?? []).find((c) => c.id === courseId)?.kind ?? "clinical"
const clinical28 = (s.offerings ?? []).filter((o) => o.cohortId === BSN28.id && kindOf(o.courseId) === "clinical")
const here = (p: string) => readFileSync(join(__dirname, "../..", p), "utf8")

describe("assigning a list to a cohort drives its clinical offerings", () => {
  const without = unassign(lists, "list-clinical", cohortGroupId("BSN 2028"))
  const withIt = assign(without, "list-clinical", cohortGroupId("BSN 2028"))
  const list = withIt.find((l) => l.id === "list-clinical")!
  const usable = inheritableSkillIds(s, list)

  it("a list gives no level on an offering, assigned or not; it says what is expected of whom (D-L76)", () => {
    expect(clinical28.length).toBeGreaterThan(0)
    expect(usable.length).toBeGreaterThan(0)
    for (const off of clinical28) {
      expect([...resolvedLevels(s, EMPTY_MAPPING_OVERLAY, off).values()].every((r) => r.source === "explicit")).toBe(true)
      const rows = skillRowsFor(s, EMPTY_MAPPING_OVERLAY, off, withIt)
      const mapped = new Set(s.mappings.filter((m) => m.courseId === off.courseId && (m.level === "mandatory" || m.level === "recommended")).map((m) => m.skillId))
      expect(rows.filter((r) => r.level !== "none").every((r) => mapped.has(r.id))).toBe(true)
    }
  })

  it("the step's numbers count the cohort's clinical offerings and the list's usable skills", () => {
    const g = groups.find((x) => x.id === cohortGroupId("BSN 2028"))!
    expect(clinicalOfferingsFor(s, g)).toBe(clinical28.length)
    const before = assignmentSummary(s, without.find((l) => l.id === "list-clinical")!, groups)
    const after = assignmentSummary(s, list, groups)
    expect(after.clinicalCourses - before.clinicalCourses).toBe(clinical28.length)
    expect(after.students - before.students).toBe(g.studentIds.length)
    expect(after.offered).toBe(usable.length)
    expect(after.offered + after.waiting).toBe(list.skillIds.length)
  })

  it("a track or custom group reaches students, never a course by itself", () => {
    const track = groups.find((g) => g.kind === "track")!
    expect(clinicalOfferingsFor(s, track)).toBeNull()
    const sum = assignmentSummary(s, assign(lists, "list-clinical", track.id).find((l) => l.id === "list-clinical")!, groups)
    expect(sum.otherGroups).toBe(1)
  })
})

describe("individual skills are retired (stakeholder review 2026-11-04, D-L59): a whole list is assigned", () => {
  const stored = { ...lists[1]!, id: "ind:coh:BSN 2028", name: "Individual skills for BSN 2028", status: "live" as const, individual: true, groupIds: [cohortGroupId("BSN 2028")] }
  const loaded = applyListsOverlay(lists, { created: [stored], edits: {} })

  it("a stored individual set is dropped on load: no page, picker or figure reads it", () => {
    expect(loaded.map((l) => l.id)).toEqual(lists.map((l) => l.id))
    expect(skillLists(loaded).some((l) => l.individual)).toBe(false)
  })
  it("no skills mode toggle and no per-skill assignment; Add students picks people, never skills", () => {
    const add = here("components/lab/admin-a/lists-add-students.tsx")
    // The panel's subtitle states the list's size (D-L117); that reads the count and assigns nothing.
    expect(add.replace(/list\.skillIds\.length/g, "")).not.toMatch(/IndividualAssign|data-assign-choice|skillIds/)
  })
})

describe("skill lists: one default, new lists for changes, an assigned list not edited in place (D-L60, D-L104)", () => {
  const live = lists.find((l) => l.id === "list-clinical")!
  it("New version copies the skills on to no student group", () => {
    const v = newVersion(lists, live.id, "v-1")!
    expect(v).toMatchObject({ isDefault: false, groupIds: [], versionOf: live.id, name: `${live.name} v2` })
    expect(v.skillIds).toEqual(live.skillIds)
    const again = newVersion([...lists, v], v.id, "v-2")!
    expect(again).toMatchObject({ versionOf: live.id, name: `${live.name} v3` })
  })
  it("an unassigned list's skills change; an assigned list's do not", () => {
    const v = newVersion(lists, live.id, "v-1")!
    const next = [...lists, v]
    expect(setListSkills(next, v.id, ["a"]).find((l) => l.id === v.id)!.skillIds).toEqual(["a"])
    expect(setListSkills(next, live.id, ["a"]).find((l) => l.id === live.id)!.skillIds).toEqual(live.skillIds)
  })
  it("a seeded unassigned list's skills survive the session overlay round trip", () => {
    const edited = setListSkills(lists, "list-clinical-2027", ["a", "b"])
    expect(applyListsOverlay(lists, diffLists(lists, edited, [])).find((l) => l.id === "list-clinical-2027")!.skillIds).toEqual(["a", "b"])
  })
  it("a program's first list is its default; a later one is not", () => {
    const input = { name: "First", noun: "skill", nounPlural: "skills", standard: "", fromListId: null, fromSkillIds: ["a"] }
    expect(createList([], input, "x")).toMatchObject({ isDefault: true, skillIds: ["a"], groupIds: [] })
    expect(createList(lists, input, "x").isDefault).toBe(false)
  })
  it("a list with no skills is not the default; its first saved skills make it one", () => {
    const empty = createList([], { name: "First", noun: "skill", nounPlural: "skills", standard: "", fromListId: null }, "x")
    expect(empty.isDefault).toBe(false)
    expect(setListSkills([empty], "x", [])[0]!.isDefault).toBe(false)
    expect(setListSkills([empty], "x", ["a"])[0]!.isDefault).toBe(true)
    expect(setListSkills(lists, "list-clinical-2027", ["a"]).find((l) => l.id === "list-clinical-2027")!.isDefault).toBe(false)
  })
  it("a name over the limit is refused with the limit, not cut", () => {
    expect(validateListName(lists, "x".repeat(LIST_NAME_MAX))).toBeNull()
    expect(validateListName(lists, "x".repeat(LIST_NAME_MAX + 1))).toMatch(new RegExp(`${LIST_NAME_MAX} characters`))
    expect(validateGroupName(groups, "x".repeat(GROUP_NAME_MAX + 1), "none")).toMatch(new RegExp(`${GROUP_NAME_MAX} characters`))
  })
  it("Reports reads one list at a time: the lists reaching a scope, and each list's own students", () => {
    const graduating = new Set(groups.find((g) => g.id === cohortGroupId("BSN 2026"))!.studentIds)
    expect(listsReaching(lists, groups, graduating).map((l) => l.id)).toEqual(["list-core"])
    const bsn27 = new Set(groups.find((g) => g.id === cohortGroupId("BSN 2027"))!.studentIds)
    expect(listsReaching(lists, groups, bsn27).map((l) => l.id)).toEqual(["list-clinical", "list-competencies"])
    expect(studentsOnList(live, groups).has([...graduating][0]!)).toBe(false)
  })
})

describe("the seeded lists after the review", () => {
  it("no list is named after a standard (standards are managed in Program details)", () => {
    for (const l of lists) {
      expect(l.name).not.toMatch(/standard/i)
      expect(l.name).not.toMatch(/\b20\d\d\b/)
    }
  })
})

describe("the page shows one job and no reporting figures", () => {
  const frame = here("components/lab/admin-a/lists-frame.tsx")
  const table = here("components/lab/admin-a/lists-groups-table.tsx")
  const panel = here("components/lab/admin-a/lists-panel.tsx")
  const parts = here("components/lab/admin-a/lists-parts.tsx")

  it("no Sample data chip and no completion rule or medians on the page", () => {
    for (const src of [frame, table, panel]) expect(src).not.toMatch(/SampleDataBadge/)
    const code = (src: string) => src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "")
    for (const src of [frame, table, panel, parts]) expect(code(src)).not.toMatch(/Meet the rule|Median achieved|meet it`|RuleDialog|model\.standing/)
  })
})

describe("Sankalp's Guided path A4 -> A5 -> A6 (Thursday flows)", () => {
  const g = groups.find((x) => x.id === cohortGroupId("BSN 2028"))!
  it("a skill list assigned to BSN 2028 reads Not mapped on its clinical offerings until a level is set (D-L76)", () => {
    const listed = assign(unassign(lists, "list-clinical", g.id), "list-clinical", g.id)
    const onList = listed.find((l) => l.id === "list-clinical")!.skillIds
    for (const off of clinical28) {
      const rows = new Map(skillRowsFor(s, EMPTY_MAPPING_OVERLAY, off, listed).map((r) => [r.id, r]))
      expect(onList.some((id) => rows.get(id)?.level === "none" && rows.get(id)?.required), `${off.id} has a listed skill not mapped`).toBe(true)
    }
  })
  it("Assign is no stop of its own: Skill lists comes straight before Course mapping (D-L106)", () => {
    const f = findFlow("set-up-skills")!
    const ids = f.steps.filter((x) => !x.side).map((x) => x.id)
    expect(ids).not.toContain("assign")
    expect(ids.indexOf("lists")).toBe(ids.indexOf("map") - 1)
    const frame = here("components/lab/admin-a/lists-frame.tsx")
    expect(frame).not.toMatch(/StickyFooter|label: "Skip"|Assign to students/)
  })
  it("course mapping is titled by the step", () => {
    expect(stepOf(findFlow("set-up-skills")!, "map")!.label).toBe("Course mapping")
  })
})

describe("skill list basics (audit 2026-11-05)", () => {
  it("a deleted seeded list stays deleted through the overlay", () => {
    const next = lists.filter((l) => l.id !== "list-clinical-2027")
    const o = diffLists(lists, next, [])
    expect(o.deleted).toEqual(["list-clinical-2027"])
    expect(applyListsOverlay(lists, o).map((l) => l.id)).not.toContain("list-clinical-2027")
    expect(diffLists(lists, lists, []).deleted).toBeUndefined()
  })

  it("a rename goes through the overlay; blank and duplicate names are refused, the list's own name is not", () => {
    const o = diffLists(lists, renameList(lists, "list-core", "  Core skills  "), [])
    expect(o.edits["list-core"]).toEqual({ name: "Core skills" })
    expect(listById(applyListsOverlay(lists, o), "list-core")!.name).toBe("Core skills")
    expect(validateListName(lists, "   ", "list-core")).toMatch(/name/)
    expect(validateListName(lists, "clinical skills checklist", "list-core")).toMatch(/exists/)
    expect(validateListName(lists, "CORE CLINICAL SKILLS", "list-core")).toBeNull()
  })

  it("a new group starts on the default when it holds skills, never on an empty one", () => {
    expect(defaultForNewGroup(lists)!.id).toBe("list-clinical")
    expect(defaultForNewGroup(lists.map((l) => (l.isDefault ? { ...l, skillIds: [] } : l)))).toBeUndefined()
  })

  it("a removed group leaves every list; a renamed or removed sample group changes every reader", () => {
    const sample = SAMPLE_CUSTOM_GROUPS[0]!
    const on = assign(lists, "list-core", sample.id)
    expect(detachGroup(on, sample.id).some((l) => l.groupIds.includes(sample.id))).toBe(false)
    const renamed = [{ ...sample, name: "Class of 25" }]
    expect(studentGroups(s, renamed).find((g) => g.id === sample.id)!.label).toBe("Class of 25")
    expect(groupOptions(s, renamed).find((o) => o.value === sample.id)!.label).toBe("Class of 25")
    const gone = [{ ...sample, removed: true }]
    expect(studentGroups(s, gone).some((g) => g.id === sample.id)).toBe(false)
    expect(groupOptions(s, gone).some((o) => o.value === sample.id)).toBe(false)
    expect(validateGroupName(groups, "BSN 2027", sample.id)).toMatch(/exists/)
    expect(validateGroupName(groups, sample.name, sample.id)).toBeNull()
  })
})
