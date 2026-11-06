import { describe, expect, it } from "vitest"
import { readFileSync, existsSync } from "node:fs"
import { join } from "node:path"
import { createSeed } from "@/lib/v2/seed"
import { labState } from "@/lib/lab/reviewer"
import {
  addToList,
  applyListsOverlay,
  assign,
  assignedSkillIdsByStudent,
  assignedToShort,
  assignedToText,
  cohortGroupId,
  diffLists,
  leftWithNoList,
  listCanEdit,
  listForOldLink,
  listsReaching,
  makeDefault,
  plainLists,
  removeStudent,
  seedLists,
  studentGroups,
  studentsMatching,
  studentsOnList,
  unassign,
  type SkillList,
} from "@/lib/lab/lists"

/** Who a whole list goes to: a group, filters or individuals (Sankalp 11-04, Granola 365abc25 ch 9), all in one Add students dialog (designer 2026-11-05, D-L106). */
const s = labState(createSeed())
const lists = seedLists(s)
const groups = studentGroups(s)
const byId = (ls: readonly SkillList[], id: string) => ls.find((l) => l.id === id)!
const students = s.people.filter((p) => p.kind === "student")
const in2027 = students.find((p) => p.cohort === "BSN 2027")!
const in2026 = students.find((p) => p.cohort === "BSN 2026")!

describe("a list on groups and named students", () => {
  it("studentsOnList and the assigned skills include a named student, and a saved overlay keeps them", () => {
    const next = addToList(lists, "list-core", { studentIds: [in2027.id] }, groups)
    expect(studentsOnList(byId(next, "list-core"), groups).has(in2027.id)).toBe(true)
    const overlay = diffLists(lists, next, [])
    expect(overlay.edits["list-core"]).toEqual({ studentIds: [in2027.id] })
    const applied = applyListsOverlay(lists, overlay)
    expect(byId(applied, "list-core").studentIds).toEqual([in2027.id])
    const ids = assignedSkillIdsByStudent(s, applied).get(in2027.id)!
    expect(byId(lists, "list-core").skillIds.every((k) => ids.has(k))).toBe(true)
  })
  it("Reports' list select reaches a list held only by a named student", () => {
    const next = addToList(unassign(lists, "list-core", cohortGroupId("BSN 2026")), "list-core", { studentIds: [in2027.id] }, groups)
    expect(listsReaching(next, groups, new Set([in2027.id])).map((l) => l.id)).toContain("list-core")
  })
  it("the table reads groups and the named students together: \"BSN 2026, BSN 2028 + 3 students\"", () => {
    const three = students.filter((p) => p.cohort === "BSN 2027").slice(0, 3).map((p) => p.id)
    const next = byId(addToList(assign(lists, "list-core", cohortGroupId("BSN 2028")), "list-core", { studentIds: three }, groups), "list-core")
    expect(assignedToShort(next, groups)).toBe("BSN 2026, BSN 2028 + 3 students")
    // The third group on: the cell names two and counts the rest; the whole of it is the Tip's.
    expect(assignedToShort({ groupIds: [...next.groupIds, cohortGroupId("ABSN 2027")], studentIds: [] }, groups)).toBe("BSN 2026, BSN 2028 + 1 more group")
    expect(assignedToText(next, groups)).toBe("BSN 2026, BSN 2028, 3 students")
  })
})

describe("adding keeps other lists", () => {
  it("a group or a student added here stays on every other list", () => {
    const g = cohortGroupId("BSN 2028")
    const next = addToList(lists, "list-core", { groupIds: [g], studentIds: [in2027.id] }, groups)
    expect(byId(next, "list-clinical").groupIds).toContain(g)
    expect(studentsOnList(byId(next, "list-clinical"), groups).has(in2027.id)).toBe(true)
  })
  it("a student a group on the list already brings is not named as well", () => {
    const next = addToList(lists, "list-core", { studentIds: [in2026.id] }, groups)
    expect(byId(next, "list-core").studentIds ?? []).toEqual([])
    const withGroup = addToList(lists, "list-core", { groupIds: [cohortGroupId("BSN 2027")], studentIds: [in2027.id] }, groups)
    expect(byId(withGroup, "list-core").studentIds ?? []).toEqual([])
  })
  it("a list on someone can no longer be edited, and can again when they are off it", () => {
    const fresh = byId(lists, "list-clinical-2027")
    expect(listCanEdit(fresh)).toBe(true)
    const next = addToList(lists, fresh.id, { studentIds: [in2027.id] }, groups)
    expect(listCanEdit(byId(next, fresh.id))).toBe(false)
    expect(listCanEdit(byId(removeStudent(next, fresh.id, in2027.id), fresh.id))).toBe(true)
  })
})

describe("removing: asks only when someone is left with no list", () => {
  it("BSN 2026 is on one list: its 38 students would have none", () => {
    const off = unassign(lists, "list-core", cohortGroupId("BSN 2026"))
    expect(leftWithNoList(lists, off, groups)).toHaveLength(38)
  })
  it("a group that keeps another list leaves nobody out", () => {
    expect(leftWithNoList(lists, unassign(lists, "list-competencies", cohortGroupId("BSN 2027")), groups)).toEqual([])
  })
  it("a named student whose only list this is, is called out; one with another list is not", () => {
    const off = unassign(lists, "list-core", cohortGroupId("BSN 2026"))
    const named = addToList(off, "list-core", { studentIds: [in2026.id] }, groups)
    expect(leftWithNoList(named, removeStudent(named, "list-core", in2026.id), groups)).toEqual([in2026.id])
    const also = addToList(lists, "list-core", { studentIds: [in2027.id] }, groups)
    expect(leftWithNoList(also, removeStudent(also, "list-core", in2027.id), groups)).toEqual([])
  })
  it("a list with no skills is no list to be left on", () => {
    const hollow = lists.map((l) => (l.id === "list-core" ? { ...l, skillIds: [] } : l))
    expect(leftWithNoList(hollow, unassign(hollow, "list-core", cohortGroupId("BSN 2026")), groups)).toEqual([])
  })
})

describe("the default: one at a time", () => {
  it("turning it on takes it from the other list", () => {
    const next = makeDefault(lists, "list-core")
    expect(next.filter((l) => l.isDefault).map((l) => l.id)).toEqual(["list-core"])
  })
})

describe("exceptions are gone; data that holds one is made plain (D-L106, [INFER])", () => {
  const stored = (extra: Partial<SkillList> & { exceptStudentIds?: string[] }) => lists.map((l) => (l.id === "list-core" ? { ...l, ...extra } : l)) as SkillList[]
  it("the same people stay on the list, by name; the group that held the exception is no longer on it", () => {
    const before = new Set(groups.find((g) => g.id === cohortGroupId("BSN 2026"))!.studentIds)
    before.delete(in2026.id)
    const [plain] = plainLists(s, stored({ exceptStudentIds: [in2026.id] })).filter((l) => l.id === "list-core")
    expect(plain).not.toHaveProperty("exceptStudentIds")
    expect(plain!.groupIds).toEqual([])
    expect(studentsOnList(plain!, groups)).toEqual(before)
  })
  it("a group with no excepted student stays a group, and an excepted name comes off", () => {
    const extra = students.find((p) => p.cohort === "BSN 2028")!
    const other = students.filter((p) => p.cohort === "BSN 2028")[1]!
    const [plain] = plainLists(s, stored({ studentIds: [extra.id, other.id], exceptStudentIds: [extra.id] })).filter((l) => l.id === "list-core")
    expect(plain!.groupIds).toEqual([cohortGroupId("BSN 2026")])
    expect(plain!.studentIds).toEqual([other.id])
  })
  it("no exceptions: the very same lists back", () => {
    expect(plainLists(s, lists)).toBe(lists)
  })
  it("an empty field is simply dropped", () => {
    const [plain] = plainLists(s, stored({ exceptStudentIds: [] })).filter((l) => l.id === "list-core")
    expect(plain).not.toHaveProperty("exceptStudentIds")
    expect(plain!.groupIds).toEqual([cohortGroupId("BSN 2026")])
  })
})

describe("old links", () => {
  it("?list= names the list; ?focus= finds one the group uses; else the default", () => {
    expect(listForOldLink(lists, "list-core", null)!.id).toBe("list-core")
    expect(listForOldLink(lists, null, cohortGroupId("BSN 2026"))!.id).toBe("list-core")
    expect(listForOldLink(lists, null, "coh:nobody")!.id).toBe("list-clinical")
  })
})

describe("the filter", () => {
  it("no filter finds nobody; the filters narrow", () => {
    expect(studentsMatching(s, {})).toEqual([])
    const cohort = studentsMatching(s, { cohort: "BSN 2028" })
    expect(cohort.length).toBe(42)
    expect(cohort.every((p) => p.cohort === "BSN 2028")).toBe(true)
    const year = cohort[0]!.enrollmentYear
    const both = studentsMatching(s, { cohort: "BSN 2028", enrollmentYear: year })
    expect(both.every((p) => p.cohort === "BSN 2028" && p.enrollmentYear === year)).toBe(true)
  })
})

describe("the design's source (map D6)", () => {
  const admin = join(__dirname, "../../components/lab/admin-a")
  const here = (f: string) => readFileSync(join(admin, f), "utf8")
  const code = (src: string) => src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "")
  it("the Assign page's files are gone", () => {
    for (const f of ["assign-who.tsx", "assign-draft.tsx", "lists-skills-sheet.tsx"]) expect(existsSync(join(admin, f)), f).toBe(false)
  })
  it("no Keep both, Move off, Leave out, except or a segmented control on any of it", () => {
    for (const f of ["lists-frame.tsx", "lists-parts.tsx", "lists-panel.tsx", "lists-add-students.tsx", "lists-groups-table.tsx"]) {
      const src = code(here(f))
      expect(src, f).not.toMatch(/Keep both|Move off|Leave out|except \$|Which students|ViewSegmentedControl|exceptStudentIds/)
    }
  })
  it("the panel is a FloatingSheetPanel with no tabs, and the page has no Save", () => {
    const panel = code(here("lists-panel.tsx"))
    expect(panel).toMatch(/<FloatingSheetPanel /)
    expect(panel).not.toMatch(/TabsList/)
    expect(code(here("lists-frame.tsx"))).not.toMatch(/>Save</)
  })
})
