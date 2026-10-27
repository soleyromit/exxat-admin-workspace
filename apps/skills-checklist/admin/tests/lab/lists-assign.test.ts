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
  defaultList,
  diffLists,
  individualListId,
  individualSkillsFor,
  inheritableSkillIds,
  seedLists,
  setIndividualSkills,
  skillGroups,
  studentGroups,
  unassign,
} from "@/lib/lab/lists"
import { EMPTY_MAPPING_OVERLAY, LEVEL_SOURCE_LABEL, resolvedLevels, skillRowsFor } from "@/lib/lab/mapping"
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

  it("unassigned, BSN 2028's clinical offerings carry nothing from the list", () => {
    expect(clinical28.length).toBeGreaterThan(0)
    for (const off of clinical28) expect([...resolvedLevels(s, EMPTY_MAPPING_OVERLAY, off, without).values()].some((r) => r.source === "list" && r.listId === "list-clinical")).toBe(false)
  })

  it("assigning BSN 2028 makes every BSN 2028 clinical offering carry the list's configured skills, from list", () => {
    expect(usable.length).toBeGreaterThan(0)
    for (const off of clinical28) {
      const explicit = new Set(s.mappings.filter((m) => m.courseId === off.courseId).map((m) => m.skillId))
      const fromList = skillRowsFor(s, EMPTY_MAPPING_OVERLAY, off, withIt).filter((r) => r.source === "list")
      expect(fromList.length).toBe(usable.filter((id) => !explicit.has(id)).length)
    }
  })

  it("the step's numbers are the inheritance's numbers", () => {
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

describe("individual skills (Sankalp's Thursday flow A5: one skill at a time, no group of skills needed)", () => {
  const g = groups.find((x) => x.id === cohortGroupId("BSN 2028"))!
  const bare = lists.map((l) => ({ ...l, groupIds: l.groupIds.filter((id) => id !== g.id) }))
  const picked = inheritableSkillIds(s, lists[1]!).slice(0, 3)
  const withPicks = setIndividualSkills(bare, g, picked, { noun: "skill", nounPlural: "skills" })

  it("stores the picks as the group's own live list, outside the groups of skills", () => {
    expect(individualSkillsFor(withPicks, g.id)).toEqual(picked)
    expect(skillGroups(withPicks).map((l) => l.id)).toEqual(lists.map((l) => l.id))
    expect(defaultList(withPicks)!.id).toBe("list-clinical")
    expect(setIndividualSkills(withPicks, g, [], { noun: "skill", nounPlural: "skills" }).some((l) => l.individual)).toBe(false)
  })

  it("every BSN 2028 clinical offering offers the picked skills, from list, Optional until course mapping sets a level", () => {
    for (const off of clinical28) {
      const explicit = new Set(s.mappings.filter((m) => m.courseId === off.courseId).map((m) => m.skillId))
      const res = resolvedLevels(s, EMPTY_MAPPING_OVERLAY, off, withPicks)
      for (const id of picked) {
        if (explicit.has(id)) continue
        expect(res.get(id)).toEqual({ level: "optional", source: "list", listId: individualListId(g.id) })
      }
      expect([...resolvedLevels(s, EMPTY_MAPPING_OVERLAY, off, bare).values()].some((r) => r.source === "list")).toBe(false)
    }
  })

  it("survives the session overlay round trip", () => {
    const o = diffLists(lists, withPicks, withPicks.filter((l) => l.individual))
    expect(individualSkillsFor(applyListsOverlay(lists, o), g.id)).toEqual(picked)
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

describe("the step shows one job and no reporting figures", () => {
  const frame = here("components/lab/admin-a/lists-frame.tsx")
  const a = here("components/lab/screens/admin-lists-cohorts-a.tsx")
  const b = here("components/lab/screens/admin-lists-cohorts-b.tsx")
  const parts = here("components/lab/admin-a/lists-parts.tsx")

  it("the assign page title is the flow step's label", () => {
    const step = stepOf(findFlow("set-up-skills")!, "assign")!
    expect(frame).toContain(`ASSIGN_TITLE = "${step.label}"`)
  })

  it("no Sample data chip and no completion rule or medians on the page", () => {
    for (const src of [frame, a, b]) expect(src).not.toMatch(/SampleDataBadge/)
    const code = (src: string) => src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "")
    for (const src of [a, b, parts]) expect(code(src)).not.toMatch(/Meet the rule|Median achieved|meet it`/)
    expect(code(b)).not.toMatch(/model\.standing|meeting/)
    // The completion rule is reachable only from the standalone screen's More menu.
    expect(a).toMatch(/<RuleDialog/)
    expect(a.indexOf("function AssignOne")).toBeGreaterThan(-1)
    const assignOne = a.slice(a.indexOf("function AssignOne"), a.indexOf("function ListFirst"))
    expect(assignOne).not.toMatch(/Rule|New list|Start a new list/)
  })
})

describe("Sankalp's Guided path A4 -> A5 -> A6 (Thursday flows)", () => {
  const g = groups.find((x) => x.id === cohortGroupId("BSN 2028"))!
  it("a group of skills AND an individual skill assigned to BSN 2028 both reach its clinical offerings as 'Set by list'", () => {
    const listed = assign(unassign(lists, "list-clinical", g.id), "list-clinical", g.id)
    const onList = new Set(listed.find((l) => l.id === "list-clinical")!.skillIds)
    const extra = inheritableSkillIds(s, { skillIds: s.skills.map((k) => k.id) }).find((id) => !onList.has(id) && !s.mappings.some((m) => m.skillId === id))
    expect(extra, "a configured skill outside the group of skills").toBeDefined()
    const both = setIndividualSkills(listed, g, [extra!], { noun: "skill", nounPlural: "skills" })
    expect(LEVEL_SOURCE_LABEL.list).toBe("Set by list")
    for (const off of clinical28) {
      const rows = new Map(skillRowsFor(s, EMPTY_MAPPING_OVERLAY, off, both).map((r) => [r.id, r]))
      expect(rows.get(extra!)).toMatchObject({ source: "list", level: "optional" })
      const fromGroup = [...onList].find((id) => rows.get(id)?.source === "list")
      expect(fromGroup, `${off.id} carries a skill from the group of skills`).toBeDefined()
    }
  })
  it("the groups step is optional and Skip goes to the assign step's individual path", () => {
    const f = findFlow("set-up-skills")!
    const ids = f.steps.filter((x) => !x.side).map((x) => x.id)
    expect(ids.indexOf("lists")).toBe(ids.indexOf("assign") - 1)
    expect(stepOf(f, "lists")!.tag).toBe("Optional")
    const frame = here("components/lab/admin-a/lists-frame.tsx")
    expect(frame).toMatch(/label: "Skip", href: assignHref\(\{ by: "skills" \}\)/)
    expect(frame).toMatch(/flowHref\(ctx\.flowId, "assign"/)
  })
  it("course mapping is titled by the step", () => {
    expect(stepOf(findFlow("set-up-skills")!, "map")!.label).toBe("Course mapping")
  })
})
