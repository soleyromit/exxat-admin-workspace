import { describe, expect, it } from "vitest"
import { pathNodes } from "@/components/lab/configure/steps-panel"
import { emptyRule, validateRule, withCheckOffDecided, withModel, type LabRule } from "@/lib/lab/configure"
import { assignedSkillIdsByStudent, seedLists } from "@/lib/lab/lists"
import { createSeed } from "@/lib/v2/seed"
import { isConfigured } from "@/lib/v2/population"
import { fromV2, progressLost } from "@/lib/lab/configure"
import { rebuildForModel, saveSkillSettings, settingsImpact } from "@/lib/lab/program-settings"
import { skillProgress } from "@/lib/v2/student"

const binary = (over: Partial<LabRule> = {}): LabRule => ({ ...withModel(emptyRule(), "binary"), qualifyingLabel: 0, need: 3, evaluatorRoles: ["preceptor"], ...over })

/** D-L52: the Steps panel reads the rule; a step that does not apply is not drawn. */
describe("the path a rule makes", () => {
  it("draws the optional steps only when they are on", () => {
    expect(pathNodes(binary()).map((n) => n.id)).toEqual(["student", "evaluator", "achieved"])
    expect(pathNodes(binary({ selfEvaluation: true, approvalRequired: true })).map((n) => n.id)).toEqual(["student", "self", "evaluator", "approval", "achieved"])
  })
  it("reads the evidence, who signs and the sentence from the rule", () => {
    const [student, evaluator, achieved] = pathNodes(binary({ feedbackRequired: true }))
    expect(student!.values).toEqual(["Adds date performed"])
    expect(evaluator!.values).toContain("Picks met or unmet")
    expect(evaluator!.values).toContain("Preceptor by emailed link")
    expect(evaluator!.values).toContain("Feedback required")
    expect(achieved!.values[0]).toMatch(/3 evaluations/)
  })
  it("several skills: a Mixed optional step stays, and a Mixed step shows no value", () => {
    const nodes = pathNodes(binary(), { mixed: new Set(["approval", "evaluator", "achieved"]) })
    expect(nodes.map((n) => n.id)).toEqual(["student", "evaluator", "approval", "achieved"])
    for (const n of nodes.filter((x) => x.id !== "student")) {
      expect(n.mixed).toBe(true)
      expect(n.values).toEqual([])
    }
  })
  it("a save attempt marks missing signers; nothing marks them before that", () => {
    expect(pathNodes(binary({ evaluatorRoles: [] }))[1]!.missing).toBe(false)
    expect(pathNodes(binary({ evaluatorRoles: [] }), { showErrors: true })[1]!.missing).toBe(true)
  })
})

describe("no saved rule: group check-off starts off (SC-02)", () => {
  it("writes an explicit off once there is a model, and leaves an explicit choice alone", () => {
    expect(withCheckOffDecided(emptyRule()).checkOff?.enabled).toBeNull()
    expect(withCheckOffDecided(binary()).checkOff?.enabled).toBe(false)
    const on = binary({ checkOff: { enabled: true, levelIndex: null, score: null } })
    expect(withCheckOffDecided(on)).toBe(on)
  })
})

describe("Counts when belongs to What counts as achieved (D-L52)", () => {
  it("names section 2 for a missing question or score rule", () => {
    const q = { ...withModel(emptyRule(), "question"), questions: ["One"], need: 1, evaluatorRoles: ["preceptor" as const] }
    expect(validateRule(q).find((i) => i.field === "cfg-qrule")?.section).toBe("outcomes")
    const s = { ...withModel(emptyRule(), "scored"), questions: ["One"], need: 1, evaluatorRoles: ["preceptor" as const] }
    expect(validateRule(s).find((i) => i.field === "cfg-srule")?.section).toBe("outcomes")
  })
})

describe("the seed: every configured rule is valid, so bulk configure tolerates nothing", () => {
  it("has no configured skill failing validation", () => {
    const s = createSeed()
    const bad = s.skills.filter((k) => k.active !== false && isConfigured(k)).filter((k) => validateRule(fromV2(k)).length > 0)
    expect(bad.map((k) => k.id)).toEqual([])
  })
})

describe("what is assigned to a student (D-L54, Proposed)", () => {
  it("is every live list on a student group they belong to", () => {
    const s = createSeed()
    const lists = seedLists(s)
    const assigned = assignedSkillIdsByStudent(s, lists)
    const clinical = lists.find((l) => l.id === "list-clinical")!
    const student = s.people.find((p) => p.kind === "student")!
    for (const id of clinical.skillIds) expect(assigned.get(student.id)!.has(id)).toBe(true)
  })
})

/** Rework 2026-11-05: the dialog's names and the student's page are one fact (map D0 rule 9) [REQ AE-02, IM-09]. */
describe("a skill that goes Not configured", () => {
  const id = "hgtc-basic-skills-11"
  const setUp = () => {
    const s = createSeed()
    const k = s.skills.find((x) => x.id === id)!
    return { s, k, rule: fromV2(k) }
  }
  it("names exactly the students it stops counting for, and their page reads 0", () => {
    const { s, k, rule } = setUp()
    const next = rebuildForModel(rule, "question", null, null)
    const named = settingsImpact(s, k, next)
    expect(named.map((x) => x.id).sort()).toEqual(progressLost(s, id, rule).map((x) => x.studentId).sort())
    expect(named.length).toBeGreaterThan(0)
    const first = named[0]!.id
    expect(skillProgress(s, first, id)!.counted).toBeGreaterThan(0)
    const saved = saveSkillSettings(s, id, next, { at: "2026-11-05T09:00:00Z", byId: "x", edited: true })
    expect(saved.ok).toBe(true)
    if (!saved.ok) return
    const after = skillProgress(saved.state, first, id)!
    expect(after.counted).toBe(0)
    expect(after.achieved).toBe(false)
    // The evidence is kept, and the same rule applied again brings it back [REQ AE-02].
    expect(saved.state.evaluations.filter((e) => e.studentId === first && e.skillId === id).length).toBe(s.evaluations.filter((e) => e.studentId === first && e.skillId === id).length)
  })
  it("a move to a model with the evidence's outcome names nobody, and the page agrees", () => {
    const { s, k, rule } = setUp()
    const next = { ...rebuildForModel(rule, "binary", null, null), outcomeLabels: ["Approved", "Not approved"] as [string, string], qualifyingLabel: 0 as const }
    expect(settingsImpact(s, k, next)).toEqual([])
    const named = progressLost(s, id, rule)[0]!.studentId
    const saved = saveSkillSettings(s, id, next, { at: "2026-11-05T09:00:00Z", byId: "x", edited: true })
    if (!saved.ok) throw new Error(saved.error)
    expect(skillProgress(saved.state, named, id)!.counted).toBe(skillProgress(s, named, id)!.counted)
  })
})

describe("group check-off through a model change (map D1a: the Who does what group is kept)", () => {
  it("stays as it read, though the models' own defaults differ", () => {
    const seeded = { ...withModel(emptyRule(), "binary"), checkOff: { enabled: null, levelIndex: null, score: null } }
    const q = rebuildForModel(seeded, "question", null, null)
    expect(q.checkOff?.enabled).toBe(true)
    expect(rebuildForModel(q, "scored", null, null).checkOff?.enabled).toBe(true)
    expect(rebuildForModel({ ...seeded, checkOff: { enabled: false, levelIndex: null, score: null } }, "demonstration", null, null).checkOff?.enabled).toBe(false)
  })
  it("a rule with no model decides nothing", () => {
    expect(rebuildForModel(emptyRule(), "binary", null, null).checkOff?.enabled).toBeNull()
  })
})
