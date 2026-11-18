import { describe, expect, it } from "vitest"
import { createSeed } from "@/lib/v2/seed"
import { newProgramSeed } from "@/lib/lab/new-program"
import { choosableMethods, methodOfSkill, methodsOf, setSkillMethod, skillMethodImpact } from "@/lib/lab/methods"
import { configurationOf } from "@/lib/lab/program-settings"
import { copyName, programLists, studentCount, studentGroups, updateListForEveryone, newVersion } from "@/lib/lab/lists"

const seed = createSeed()
const opts = { at: "2026-11-16T10:00:00.000Z", byId: "admin" }

describe("Skill lists toward the 11-16 prototype (D-LS1116-a..d)", () => {
  it("a: the Students column counts everyone the list reaches, once", () => {
    const lists = programLists(seed)
    const clinical = lists.find((l) => l.id === "list-clinical")!
    const n = studentCount(clinical, studentGroups(seed))
    expect(n).toBe(seed.people.filter((p) => p.kind === "student").length)
    expect(studentCount({ groupIds: [] }, studentGroups(seed))).toBe(0)
  })

  it("a: Duplicate's name is '{name} (copy)', then '(copy 2)'", () => {
    const lists = programLists(seed)
    expect(copyName(lists, "Clinical skills checklist")).toBe("Clinical skills checklist (copy)")
    const withCopy = [...lists, { ...lists[0]!, id: "x", name: "Clinical skills checklist (copy)" }]
    expect(copyName(withCopy, "Clinical skills checklist")).toBe("Clinical skills checklist (copy 2)")
  })

  it("b: a new program offers no method and a skill has none [REQ SC-01, SC-02]", () => {
    const s = newProgramSeed()
    expect(choosableMethods(s)).toEqual([])
    const k = s.skills[0]
    if (k) expect(methodOfSkill(s, k.id)).toBeNull()
  })

  it("b: moving a skill to another method changes it for every list, and back to the program's method makes it Default", () => {
    const program = methodsOf(seed).find((m) => m.program)!
    const other = choosableMethods(seed).find((m) => !m.program)!
    const id = program.skillIds[0]!
    const r = setSkillMethod(seed, id, other.id, opts)
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(methodOfSkill(r.state, id)?.id).toBe(other.id)
    expect(configurationOf(r.state, r.state.skills.find((k) => k.id === id)!)).toBe("edited")
    const back = setSkillMethod(r.state, id, program.id, opts)
    expect(back.ok).toBe(true)
    if (!back.ok) return
    expect(methodOfSkill(back.state, id)?.id).toBe(program.id)
    expect(configurationOf(back.state, back.state.skills.find((k) => k.id === id)!)).toBe("default")
  })

  it("b: the impact of the method a skill already has is nobody; an unknown method is refused", () => {
    const program = methodsOf(seed).find((m) => m.program)!
    expect(skillMethodImpact(seed, program.skillIds[0]!, program.id)).toEqual([])
    const r = setSkillMethod(seed, program.skillIds[0]!, "nope", opts)
    expect(r.ok).toBe(false)
  })

  it("c: Update it for everyone changes the list in place; Save as new leaves it and makes a list on no one", () => {
    const lists = programLists(seed)
    const clinical = lists.find((l) => l.id === "list-clinical")!
    const fewer = clinical.skillIds.slice(1)
    const updated = updateListForEveryone(lists, clinical.id, fewer).find((l) => l.id === clinical.id)!
    expect(updated.skillIds).toEqual(fewer)
    expect(updated.groupIds).toEqual(clinical.groupIds)
    const v = newVersion(lists, clinical.id, "list-v2")!
    expect(v.groupIds).toEqual([])
    expect(lists.find((l) => l.id === clinical.id)!.skillIds).toEqual(clinical.skillIds)
  })
})
