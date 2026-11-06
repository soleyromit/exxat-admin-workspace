import { describe, expect, it } from "vitest"
import { createSeed } from "@/lib/v2/seed"
import { labState } from "@/lib/lab/reviewer"
import {
  applyListsOverlay,
  assign,
  createList,
  defaultList,
  diffLists,
  groupStanding,
  makeDefault,
  ruleImpact,
  seedLists,
  studentGroups,
  unassign,
  validateMinTotal,
  validateNewList,
  EMPTY_LISTS_OVERLAY, listCanEdit } from "@/lib/lab/lists"

const s = labState(createSeed())
const lists = seedLists(s)
const groups = studentGroups(s)

describe("lists as objects", () => {
  it("has one default list, a second list on one cohort, and an unassigned list for a new standard", () => {
    expect(lists.filter((l) => l.isDefault).length).toBe(1)
    const d = defaultList(lists)!
    expect(d.skillIds.length).toBe(154)
    expect(d.requiredIds.length).toBe(0)
    const bsn2027 = groups.find((g) => g.label === "BSN 2027")!
    expect(lists.filter((l) => l.groupIds.includes(bsn2027.id)).length).toBe(2)
    expect(lists.some((l) => listCanEdit(l))).toBe(true)
    for (const l of lists) expect(`${l.noun} ${l.nounPlural}`).not.toMatch(/\bitems?\b/)
  })
  it("student groups cover every student in a cohort, plus the track", () => {
    const cohortStudents = groups.filter((g) => g.kind === "cohort").reduce((n, g) => n + g.studentIds.length, 0)
    expect(cohortStudents).toBe(123)
    expect(groups.some((g) => g.kind === "track" && g.studentIds.length > 0)).toBe(true)
  })
})

describe("completion rule and group medians", () => {
  const d = defaultList(lists)!
  const standings = groups.filter((g) => d.groupIds.includes(g.id)).map((g) => groupStanding(s, d, g))
  it("computes meeting counts and medians per group", () => {
    for (const g of standings) {
      expect(g.meeting).toBeLessThanOrEqual(g.students)
      if (g.students >= 5) expect(g.medianTotal).not.toBeNull()
    }
  })
  it("shows what a lower minimum would change before saving, never fewer students meeting it", () => {
    const impact = ruleImpact(standings, d, d.requiredIds.length)
    for (const r of impact) expect(r.after).toBeGreaterThanOrEqual(r.before)
  })
  it("rejects an impossible minimum", () => {
        expect(validateMinTotal(d, 500)).toMatch(/at most 154/)
    expect(validateMinTotal(d, 100)).toBeNull()
  })
})

describe("assignment", () => {
  const draft = lists.find((l) => listCanEdit(l))!
  const bsn2028 = groups.find((g) => g.label === "BSN 2028")!
  it("adding keeps the old list; a list on someone is no longer edited in place; taking the group off undoes it", () => {
    const added = assign(lists, draft.id, bsn2028.id)
    expect(added.find((l) => l.id === "list-clinical")!.groupIds).toContain(bsn2028.id)
    expect(listCanEdit(added.find((l) => l.id === draft.id)!)).toBe(false)
    expect(unassign(added, draft.id, bsn2028.id).find((l) => l.id === draft.id)!.groupIds).not.toContain(bsn2028.id)
  })
  it("one default at a time, and the overlay round-trips", () => {
    const next = makeDefault(lists, draft.id)
    expect(next.filter((l) => l.isDefault).map((l) => l.id)).toEqual([draft.id])
    const o = diffLists(lists, next, [])
    expect(applyListsOverlay(lists, o)).toEqual(next)
    expect(applyListsOverlay(lists, EMPTY_LISTS_OVERLAY)).toEqual(lists)
  })
  it("a new list starts on no group and can be edited; an assigned list stays as it is", () => {
    expect(validateNewList(lists, { name: "Clinical skills checklist", noun: "skill", nounPlural: "skills", standard: "", fromListId: null })).toMatch(/exists/)
    expect(validateNewList(lists, { name: "X", noun: "item", nounPlural: "items", standard: "", fromListId: null })).toMatch(/word your program uses/)
    const l = createList(lists, { name: "2028 standard", noun: "skill", nounPlural: "skills", standard: "2028", fromListId: "list-clinical" }, "list-new")
    expect(listCanEdit(l)).toBe(true)
    expect(l.groupIds).toEqual([])
    expect(l.skillIds.length).toBe(154)
    expect(lists.find((x) => x.id === "list-clinical")!.skillIds.length).toBe(154)
  })
})

describe("seeded completion rule (UX critique 2026-10-26: groups must differ)", () => {
  it("derives the default list's minimum from the data so groups differ", () => {
    const l = lists.find((x) => x.id === "list-clinical")!
    expect(validateMinTotal(l, l.minTotal)).toBeNull()
    expect(l.minTotal).toBeLessThan(120)
    const standings = groups.filter((g) => l.groupIds.includes(g.id)).map((g) => groupStanding(s, l, g))
    expect(standings.filter((g) => g.meeting > 0).length).toBeGreaterThan(0)
    expect(new Set(standings.map((g) => g.meeting / Math.max(1, g.students))).size).toBeGreaterThan(1)
    expect(seedLists(labState(createSeed())).find((x) => x.id === "list-clinical")!.minTotal).toBe(l.minTotal)
  })
})
