import { describe, expect, it } from "vitest"
import { createSeed } from "@/lib/v2/seed"
import { DEFAULT_SCOPE, isReportable, populationRows } from "@/lib/v2/population"
import { EMPTY_SCOPE } from "@/lib/lab/scope"
import { buildAttainment } from "@/lib/lab/attainment"
import { buildDrill } from "@/lib/lab/dashboard"
import { buildReadiness } from "@/lib/lab/director"
import { assign, assignedSkillIdsByStudent, cohortGroupId, diffLists, listInForce, listsOfStudent, programLists, seedLists, addToList, studentGroups, studentsWithNoList, unassign, type SkillList } from "@/lib/lab/lists"
import { buildStudent } from "@/lib/lab/student"
import { pickRows } from "@/lib/lab/student2"
import { skillProgress } from "@/lib/v2/student"
import type { V2State } from "@/lib/v2/types"

/** My progress reads the skill list; course mapping says where (designer 2026-11-05, D-L102; Aarti 205da2dd ch 9, 11; Sankalp e72ea925 ch 9, 655e2cbd ch 1-2). */
const seed = createSeed()
const students = seed.people.filter((p) => p.kind === "student")
const withLists = (next: SkillList[]): V2State => ({ ...seed, listEdits: diffLists(seedLists(seed), next, []) })

describe("student and admin agree, for all 123", () => {
  const dashboard = new Map(buildDrill(seed, EMPTY_SCOPE, { list: "students" }).students!.map((r) => [r.id, r]))

  it("My progress equals the dashboard, Reports and readiness, list by list", () => {
    expect(students).toHaveLength(123)
    for (const p of students) {
      const m = buildStudent(seed, p.id)!
      expect(m.lists.length, p.id).toBeGreaterThan(0)
      // The list the page opens on is the one the dashboard row reads.
      const row = dashboard.get(p.id)!
      expect([m.counts.achieved, m.counts.required, m.list!.id], p.id).toEqual([row.achieved, row.required, row.listId])
      for (const l of m.lists) {
        const scope = { ...EMPTY_SCOPE, cohort: p.cohort ?? "", list: l.id }
        const mine = buildStudent(seed, p.id, undefined, { listId: l.id })!
        const report = buildAttainment(seed, scope, undefined, { basis: "assigned" }).students.find((x) => x.id === p.id)!
        const ready = buildReadiness(seed, scope).rows.find((x) => x.id === p.id)!
        expect([mine.counts.achieved, mine.counts.required], `${p.id} ${l.id}`).toEqual([report.counts.achieved, report.total])
        expect([mine.counts.achieved, mine.counts.required], `${p.id} ${l.id}`).toEqual([ready.achieved, ready.required])
        expect([l.achieved, l.total], `${p.id} ${l.id}`).toEqual([mine.counts.achieved, mine.counts.required])
      }
    }
  })

  it("the total is the list's active, configured skills, not what a course maps", () => {
    const m = buildStudent(seed, "stu-maya")!
    const list = listInForce(seed, "stu-maya")!
    const reportable = list.skillIds.filter((id) => { const k = seed.skills.find((x) => x.id === id); return !!k && isReportable(k) })
    expect(m.counts.required).toBe(reportable.length)
    expect(m.counts.achieved).toBe(reportable.filter((id) => skillProgress(seed, "stu-maya", id)?.achieved).length)
    expect(m.courses.reduce((n, c) => n + c.mandatory, 0)).toBeLessThan(m.counts.required)
  })
})

describe("two lists read apart, never merged", () => {
  const maya = buildStudent(seed, "stu-maya")!
  it("each has its own figure and the page reads one at a time", () => {
    expect(maya.lists.map((l) => l.id)).toEqual(["list-clinical", "list-competencies"])
    const second = buildStudent(seed, "stu-maya", undefined, { listId: "list-competencies" })!
    expect(second.list!.id).toBe("list-competencies")
    expect(second.counts.required).toBe(maya.lists[1]!.total)
    expect(second.counts.required).not.toBe(maya.counts.required)
    // No figure anywhere is the union.
    const union = assignedSkillIdsByStudent(seed).get("stu-maya")!.size
    expect(union).toBeGreaterThan(maya.counts.required)
    expect(populationRows(seed).rows.find((r) => r.id === "stu-maya")!.required).toBe(maya.counts.required)
  })
  it("a list that does not reach the student reads their first", () => {
    expect(buildStudent(seed, "stu-maya", undefined, { listId: "list-core" })!.list!.id).toBe("list-clinical")
  })
})

describe("a student with no list [REQ CM-05]", () => {
  const next = unassign(unassign(seedLists(seed), "list-clinical", cohortGroupId("BSN 2027")), "list-competencies", cohortGroupId("BSN 2027"))
  const s = withLists(next)
  const m = buildStudent(s, "stu-maya")!

  it("owes nothing, reads as behind on nothing, and keeps every record and course", () => {
    expect(m.lists).toEqual([])
    expect(m.list).toBeNull()
    expect([m.counts.required, m.counts.achieved, m.counts.oneAway]).toEqual([0, 0, 0])
    expect(m.behind).toBe(false)
    expect(m.verdict).toBe("")
    expect(m.courses.some((c) => c.behind)).toBe(false)
    expect(m.pace).toEqual([])
    expect(m.courses.length).toBeGreaterThan(0)
    expect(m.all.length).toBeGreaterThan(0)
  })
  it("can still submit every configured skill, and evidence still counts on its record [REQ CM-05, CM-07]", () => {
    const rows = pickRows(s, m)
    expect(rows.length).toBeGreaterThan(100)
    expect(skillProgress(s, "stu-maya", "sk-vitals")?.achieved).toBe(true)
  })
  it("no silent fallback: nothing reads the default list for them", () => {
    expect(listsOfStudent(s, "stu-maya")).toEqual([])
    expect(assignedSkillIdsByStudent(s).get("stu-maya")!.size).toBe(0)
    expect(studentsWithNoList(s).map((p) => p.id)).toContain("stu-maya")
    expect(studentsWithNoList(seed)).toEqual([])
    const pop = populationRows(s, { ...DEFAULT_SCOPE, cohort: "BSN 2027" })
    expect(pop.rows).toEqual([])
    expect(pop.unassigned).toHaveLength(29)
    // Reports does not jump to the default list's 152 for them.
    expect(buildAttainment(s, { ...EMPTY_SCOPE, cohort: "BSN 2027" }, undefined, { basis: "assigned" }).students).toEqual([])
    expect(buildReadiness(s, { ...EMPTY_SCOPE, cohort: "BSN 2027" }).rows).toEqual([])
  })
})

describe("a skill mapped on the course but not on the list [INFER]", () => {
  // BSN 2026 is on its core list only; NUR 220 recommends checklist skills that are on none of its lists.
  const p = students.find((x) => x.cohort === "BSN 2026")!
  const m = buildStudent(seed, p.id)!
  const off = m.courses.flatMap((c) => c.skills.map((x) => ({ c, x }))).find(({ x }) => m.all.find((r) => r.id === x.id)?.onLists.length === 0)
  it("stays on the course page and can be submitted, and does not count toward the list", () => {
    expect(off, "the seed should hold such a skill").toBeTruthy()
    const rec = m.all.find((r) => r.id === off!.x.id)!
    expect(rec.required).toBe(false)
    expect(m.required.some((r) => r.id === rec.id)).toBe(false)
    expect(pickRows(seed, m).some((r) => r.id === rec.id)).toBe(true)
  })
  it("the course's own clock reads only what is owed, so it cannot make them behind", () => {
    const rec = m.all.find((r) => r.id === off!.x.id)!
    const before = off!.c
    const ownNeed = before.skills.filter((x) => x.level === "mandatory" && m.required.some((r) => r.id === x.id)).reduce((n, x) => n + (m.all.find((r) => r.id === x.id)?.need ?? 0), 0)
    expect(before.needed).toBe(ownNeed)
    expect(rec.onLists).toEqual([])
  })
})

describe("what the admin saves is what the student sees", () => {
  const before = seedLists(seed)
  const groups = studentGroups(seed)
  it("assigning a group adds a list; unassigning takes it off", () => {
    const id = students.find((x) => x.cohort === "BSN 2028")!.id
    expect(buildStudent(seed, id)!.lists.map((l) => l.id)).toEqual(["list-clinical"])
    const on = withLists(assign(before, "list-competencies", cohortGroupId("BSN 2028")))
    expect(buildStudent(on, id)!.lists.map((l) => l.id)).toEqual(["list-clinical", "list-competencies"])
    const off = withLists(unassign(before, "list-clinical", cohortGroupId("BSN 2028")))
    expect(buildStudent(off, id)!.lists).toEqual([])
  })
  it("assigning a named student reaches that student alone; a group off the list takes its students off", () => {
    const [a, b] = students.filter((x) => x.cohort === "BSN 2028")
    const named = withLists(addToList(before, "list-core", { studentIds: [a!.id] }, groups))
    expect(buildStudent(named, a!.id)!.lists.map((l) => l.id)).toContain("list-core")
    expect(buildStudent(named, b!.id)!.lists.map((l) => l.id)).not.toContain("list-core")
    const stayed = withLists(unassign(before, "list-clinical", cohortGroupId("BSN 2028")))
    expect(buildStudent(stayed, a!.id)!.lists).toEqual([])
  })
  it("a list edit changes the total", () => {
    const edited = before.map((l) => (l.id === "list-clinical" ? { ...l, skillIds: l.skillIds.slice(0, 40) } : l))
    const s = withLists(edited)
    expect(buildStudent(s, "stu-maya")!.lists[0]!.total).toBeLessThanOrEqual(40)
    expect(programLists(s).find((l) => l.id === "list-clinical")!.skillIds).toHaveLength(40)
  })
})
