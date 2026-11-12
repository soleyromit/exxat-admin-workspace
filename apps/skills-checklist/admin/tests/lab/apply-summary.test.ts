/**
 * The "Apply to n skills?" dialog's words and arithmetic (D-L146, concept A). Each skill sits in exactly one group, so
 * change + blocked + the stays lines always equal the program's skill total, whatever the edit.
 */
import { describe, expect, it } from "vitest"
import { applySummary, type ApplySummary } from "@/lib/lab/apply-summary"
import { planProgramApply, programImpact, programSaveEffects, programSettingsOf } from "@/lib/lab/program-settings"
import type { LabRule } from "@/lib/lab/configure"
import { createSeed } from "@/lib/v2/seed"
import type { V2State } from "@/lib/v2/types"

const seed = createSeed()
const program = programSettingsOf(seed)!.rule
const fromLevels = { levels: [], levelMinimums: [], carried: { ...program.carried, minLevelIndex: null } }

function summary(s: V2State, rule: LabRule): ApplySummary {
  const saved = programSettingsOf(s)?.rule ?? null
  const plan = planProgramApply(s, rule)
  return applySummary({ saved, rule, plan, impact: programImpact(s, rule, plan), effects: programSaveEffects(saved, rule) })
}

/** The partition, read from what the dialog shows: the title's number, the not configured lines, the stays lines. */
function shownTotal(x: ApplySummary): number {
  const parts = [...x.changes, ...x.stays].reduce((n, l) => n + (l.part ?? 0), 0)
  return x.partition.change + parts
}

const dump = (name: string, x: ApplySummary) =>
  // Printed for the report: the exact strings per case.
  console.log(`\n[${name}] ${x.title} | ${x.button}\n  students: ${JSON.stringify(x.students)}\n  changes: ${x.changes.map((l) => l.text).join(" / ")}\n  stays: ${x.stays.map((l) => l.text).join(" / ")}`)

const cases: Array<[string, LabRule]> = [
  ["number edit", { ...program, need: program.need + 1 }],
  ["rename", { ...program, levels: program.levels.map((l, i) => (i === 1 ? "Assisted" : l)) }],
  ["model switch", { ...program, ...fromLevels, model: "question", questions: ["Hand hygiene", "Clean field", "Explains each step"], questionRule: { kind: "all" } }],
  ["mixed edit", { ...program, need: program.need + 1, levels: program.levels.map((l, i) => (i === 1 ? "Assisted" : l)) }],
  ["lab instructor only", { ...program, evaluatorRoles: ["lab-instructor"] }],
  ["score", { ...program, ...fromLevels, model: "scored", questions: ["Prepares", "Performs", "Documents"], scaleMax: 5, scoredRule: { kind: "average", value: 4 } }],
  ["self rating on", { ...program, selfEvaluation: !program.selfEvaluation }],
]

describe("Apply dialog (D-L146)", () => {
  for (const [name, rule] of cases) {
    it(`${name}: every skill sits in one group, and the groups add up to the program's skills`, () => {
      const x = summary(seed, rule)
      dump(name, x)
      expect(x.partition.total).toBe(seed.skills.length)
      expect(x.partition.change + x.partition.blocked + x.partition.stays).toBe(seed.skills.length)
      expect(shownTotal(x)).toBe(seed.skills.length)
      expect(new Set([...x.changes, ...x.stays].map((l) => l.key)).size).toBe(x.changes.length + x.stays.length)
      for (const l of [...x.changes, ...x.stays, ...("heads" in x.students ? x.students.heads.map((text) => ({ text })) : [])]) {
        expect(l.text).not.toMatch(/\bitems?\b|\bcounts?\b|Accepted|\u2014/)
      }
    })
  }

  it("a number edit: own-number skills stay, the title's number is the change line's, students go down with the reason", () => {
    const rule = { ...program, need: program.need + 1 }
    const x = summary(seed, rule)
    const plan = planProgramApply(seed, rule)
    expect(plan.changeOwnNumber).toBe(0)
    expect(x.title).toBe(`Apply to ${plan.change.length} skills?`)
    expect(x.button).toBe(`Apply to ${plan.change.length} skills`)
    const needLine = x.changes.find((l) => l.key === "need")!
    expect(needLine.text).toBe(`${plan.change.length} skills on Default need ${rule.need} evaluations instead of ${program.need}`)
    expect(x.stays.find((l) => l.key === "ownNumber")?.text).toMatch(/^\d+ skills keep their own number$/)
    expect(x.students.kind).toBe("moves")
    if (x.students.kind === "moves") {
      expect(x.students.heads[0]).toMatch(/^\d+ students go from Achieved to In progress on some skills$/)
      expect(x.students.reason).toBe("Their evaluations are kept. Each of these skills needs 1 more.")
      expect(x.students.show).toBe(`Show the ${x.students.total} students`)
    }
  })

  it("a rename: own-number skills take it and are said inside the change line, never as staying; nobody's progress changes", () => {
    const rule = { ...program, levels: program.levels.map((l, i) => (i === 1 ? "Assisted" : l)) }
    const x = summary(seed, rule)
    const plan = planProgramApply(seed, rule)
    expect(plan.changeOwnNumber).toBe(plan.ownNumber)
    expect(x.stays.find((l) => l.key === "ownNumber")).toBeUndefined()
    expect(x.changes[0]!.text).toBe(`${plan.change.length} skills on Default show the level name Assisted instead of ${program.levels[1]}, including ${plan.changeOwnNumber} that keep their own number`)
    expect(x.students).toEqual({ kind: "zero", text: "No student's progress changes" })
  })

  it("a mixed edit: one line per setting, each with the skills it reaches", () => {
    const rule = { ...program, need: program.need + 1, levels: program.levels.map((l, i) => (i === 1 ? "Assisted" : l)) }
    const x = summary(seed, rule)
    const keys = x.changes.map((l) => l.key)
    expect(keys).toEqual(["levels", "need"])
    const plan = planProgramApply(seed, rule)
    expect(x.changes[1]!.text).toMatch(new RegExp(`^${plan.change.length - plan.changeOwnNumber} skills on Default need`))
  })

  it("a model switch names the model, the questions and what it clears", () => {
    const x = summary(seed, cases[2]![1])
    const text = x.changes.map((l) => l.text).join(" / ")
    expect(text).toMatch(/are judged by Questions instead of Independence level/)
    expect(text).toMatch(/use the questions on this page/)
    expect(text).toMatch(/Group check-off turns off/)
    expect(text).toMatch(/cleared: Levels/)
  })

  it("skills that cannot take the settings are amber lines with their reason, part of What changes", () => {
    const x = summary(seed, { ...program, evaluatorRoles: ["lab-instructor"] })
    const blocked = x.changes.filter((l) => l.key.startsWith("blocked-"))
    expect(blocked.length).toBeGreaterThan(0)
    for (const l of blocked) expect(l.attention).toBe(true)
    expect(blocked.map((l) => l.text).join(" ")).toMatch(/lab instructor/)
  })

  it("students are A to Z with their skills, never ranked", () => {
    const rule = { ...program, need: program.need + 1 }
    const plan = planProgramApply(seed, rule)
    const impact = programImpact(seed, rule, plan)
    const names = impact.students.map((x) => x.name)
    expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b)))
    for (const x of impact.students) expect(x.skills).toBe(x.down + x.up + x.other + x.lost)
  })

  it("no skills: no numbers and no students line", () => {
    const empty: V2State = { ...seed, skills: [] }
    const x = summary(empty, program)
    expect(x.empty).toBe(true)
    expect(x.students.kind).toBe("none")
    expect(x.title).toBe("Apply these settings?")
    expect(x.button).toBe("Apply settings")
  })
})
