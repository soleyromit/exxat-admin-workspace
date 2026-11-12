/**
 * The "Apply to n skills?" dialog's words and arithmetic (D-L146, concept A). Each skill sits in exactly one group, so
 * change + blocked + the stays lines always equal the program's skill total, whatever the edit.
 */
import { describe, expect, it } from "vitest"
import { actionTitle, applySummary, FIGURE_MAX, type ApplySummary, type SummaryInput, type SummaryLine } from "@/lib/lab/apply-summary"
import { planProgramApply, programImpact, programSaveEffects, programSettingsOf, saveProgramSettings } from "@/lib/lab/program-settings"
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

  it("a number edit: own-number skills stay, the button's number is the change line's, students go down; the title is the action, the description the hero sentence (H1)", () => {
    const rule = { ...program, need: program.need + 1 }
    const x = summary(seed, rule)
    const plan = planProgramApply(seed, rule)
    expect(plan.changeOwnNumber).toBe(0)
    // H1 (D-L149): one title rule in every state, the action; the description is what the card shows, then "No evaluation is deleted."
    expect(x.title).toBe("Change times needed?")
    expect(x.description).toMatch(/^\d+ students go from Achieved to In progress on some skills\. No evaluation is deleted\.$/)
    expect(x.figure).toBeUndefined()
    expect(x.button).toBe(`Apply to ${plan.change.length} skills`)
    const needLine = x.changes.find((l) => l.key === "need")!
    expect(needLine.text).toBe(`${plan.change.length} skills on Default need ${rule.need} evaluations instead of ${program.need}`)
    expect(x.stays.find((l) => l.key === "ownNumber")?.text).toMatch(/^\d+ skills keep their own number$/)
    expect(x.students.kind).toBe("moves")
    if (x.students.kind === "moves") {
      expect(x.students.heads[0]).toMatch(/^\d+ students go from Achieved to In progress on some skills$/)
      // The number itself is the Times needed row, said once; the reason is the footnote's one sentence.
      expect(x.students.reason).toBe("No evaluation is deleted.")
      expect(x.students.show).toBe("See who")
    }
  })

  it("a rename: own-number skills take it, never said as staying, and the number is not mentioned (Times needed did not change); nobody's progress changes", () => {
    const rule = { ...program, levels: program.levels.map((l, i) => (i === 1 ? "Assisted" : l)) }
    const x = summary(seed, rule)
    const plan = planProgramApply(seed, rule)
    expect(plan.changeOwnNumber).toBe(plan.ownNumber)
    expect(x.stays.find((l) => l.key === "ownNumber")).toBeUndefined()
    expect(x.changes[0]!.text).toBe(`${plan.change.length} skills on Default show the level name Assisted instead of ${program.levels[1]}`)
    expect(JSON.stringify(x)).not.toMatch(/own number/)
    expect(x.students).toEqual({ kind: "zero", text: "No student's progress changes" })
    // Nobody moves: the title is the action. "With assistance -> Assisted" is too long for the hero figure, so it is a table row.
    expect(x.title).toBe("Rename a level?")
    expect(x.description).toBe("No student's progress changes.")
    expect(x.figure).toBeUndefined()
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

  it("V1 rows: every change line has a name, a scope and an after value; never banned words", () => {
    for (const [, rule] of cases) {
      const x = summary(seed, rule)
      for (const l of x.changes) {
        expect(l.row, l.key).toBeDefined()
        const r = l.row!
        expect(r.name.length).toBeGreaterThan(0)
        expect(r.scope).toMatch(/^\d[\d,]* skills?|^[A-Z]/)
        for (const w of [r.name, r.scope, r.before?.text ?? "", r.after.text]) expect(w).not.toMatch(/\bitems?\b|\bcounts?\b|Accepted|—/)
      }
      for (const l of x.stays) expect(l.text).toMatch(/^\d[\d,]* skills? /)
    }
  })

  it("V1 rows: a number edit reads Times needed, 1 -> 2, with the repeat icon; check-off never uses the students icon", () => {
    const x = summary(seed, { ...program, need: program.need + 1 })
    const r = x.changes.find((l) => l.key === "need")!
    expect(r.icon).toBe("fa-repeat")
    expect(r.row).toMatchObject({ name: "Times needed", before: { text: String(program.need) }, after: { text: String(program.need + 1) } })
    expect(x.stays.find((l) => l.key === "custom")?.text).toMatch(/^\d+ skills on Custom keep their own settings$/)
    const m = summary(seed, cases[2]![1])
    const co = m.changes.find((l) => l.key === "checkOff")!
    expect(co.icon).toBe("fa-check-double")
    expect(co.icon).not.toBe("fa-users")
    // C2 (D-L148): turning check-off off takes no progress from anyone, so it is not amber.
    expect(co.attention).toBe(false)
    expect(co.row).toMatchObject({ name: "Group check-off", before: { text: "On" }, after: { text: "Off" } })
  })

  it("V1 rows (r1): a levels row says only its skills; the own-number fact sits once, on Times needed, when the number changed", () => {
    const rule = { ...program, need: program.need + 1, carried: { ...program.carried, minLevelIndex: 1 } }
    const x = summary(seed, rule)
    const plan = planProgramApply(seed, rule)
    expect(plan.changeOwnNumber).toBeGreaterThan(0)
    const levels = x.changes.find((l) => l.key === "criteria")!
    expect(levels.row!.name).toBe("Levels that move a student forward")
    expect(levels.row!.scope).toBe(`${plan.changeKeys.criteria} skills`)
    const need = x.changes.find((l) => l.key === "need")!
    expect(need.row!.scope).toBe(`${plan.changeKeys.need} skills, not the ${plan.changeOwnNumber} with their own number`)
    expect(need.text).toMatch(new RegExp(`; ${plan.changeOwnNumber} skills keep their own number$`))
    expect(need.row!.note).toBe(`${plan.changeOwnNumber} skills keep their own number`)
    expect(levels.row!.note).toBeUndefined()
    const said = [...x.changes.map((l) => l.row?.note ?? ""), ...x.stays.map((l) => l.text)].filter((w) => /own number/.test(w))
    expect(said).toHaveLength(1)
  })

  it("r1 engine: a stricter level rule applied, then loosened, says the direction (same state, more evaluations moving them forward)", () => {
    const strict = { ...program, carried: { ...program.carried, minLevelIndex: 1 } }
    const saved = saveProgramSettings(seed, strict, { at: "2026-11-11T10:00:00Z", byId: "u" })
    if (!saved.ok) throw new Error("save failed")
    const s2 = saved.result.state
    const plan = planProgramApply(s2, program)
    const impact = programImpact(s2, program, plan)
    // The seed's numbers: 15 students on 4 skills; nobody crosses Achieved, each gains evaluations that move them forward.
    expect(impact.students.length).toBe(15)
    expect(impact.students.every((x) => x.other === x.skills && x.forward === x.other && x.back === 0)).toBe(true)
    expect(impact.otherStays).toBe("achieved")
    const x = summary(s2, program)
    expect(x.students.kind).toBe("moves")
    if (x.students.kind === "moves") {
      expect(x.students.loss).toBe(false)
      expect(x.students.heads).toEqual(["15 students stay Achieved on some skills, with more evaluations moving them forward"])
      // On screen: the state on one line, the direction on its own brief line (C2).
      // H1 (D-L149): one tight line, no second sentence.
      expect(x.students.parts[0]!.segs).toEqual([{ text: "stay" }, { state: "achieved" }, { text: "on more evaluations" }])
      expect(x.students.parts[0]!.note).toBeUndefined()
      expect(x.description).toBe("15 students stay Achieved on some skills, with more evaluations moving them forward. No evaluation is deleted.")
    }
    // And the stricter rule itself: the same 15, back, but neutral: nobody leaves Achieved, so nothing is lost (H1, D-L149, Proposed).
    const y = summary(seed, strict)
    expect(y.students.kind).toBe("moves")
    if (y.students.kind === "moves") {
      expect(y.students.loss).toBe(false)
      expect(y.students.heads).toEqual(["15 students stay Achieved on some skills, with fewer evaluations moving them forward"])
      expect(y.students.parts[0]!.segs).toEqual([{ text: "stay" }, { state: "achieved" }, { text: "on fewer evaluations" }])
      expect(y.title).toBe("Change the levels that move a student forward?")
    }
  })

  it("r1 engine: switching the seed to Questions moves nobody (old evaluations keep their recorded outcome)", () => {
    const x = summary(seed, cases[2]![1])
    expect(x.students).toEqual({ kind: "zero", text: "No student's progress changes" })
  })

  it("V1 hero: losses are amber parts with record state badges, a single direction has one part", () => {
    const x = summary(seed, { ...program, need: program.need + 1 })
    expect(x.students.kind).toBe("moves")
    if (x.students.kind === "moves") {
      expect(x.students.loss).toBe(true)
      expect(x.students.parts).toHaveLength(1)
      expect(x.students.parts[0]!.segs.slice(0, 3)).toEqual([{ state: "achieved" }, { arrow: true }, { state: "in-progress" }])
      expect(x.students.back).toBe("Hide names")
    }
    const blocked = summary(seed, { ...program, evaluatorRoles: ["lab-instructor"] })
    const b = blocked.changes.find((l) => l.key.startsWith("blocked-"))!
    expect(b.row).toMatchObject({ before: { config: "default" }, after: { config: "not-configured" } })
  })

  it("C2 titles: nobody moves, so the title is the action, one rule per change type (D-L148)", () => {
    const one = (key: string, name = "", before?: string, after = "x"): SummaryLine[] => [
      { key, segs: [], text: "", attention: false, icon: "fa-pen", row: { name, scope: "1 skill", ...(before ? { before: { text: before } } : {}), after: { text: after } } },
    ]
    const fx: SummaryInput["effects"] = { namesOnly: false, checkOff: null, cleared: [] }
    const on = { ...program, approvalRequired: true, selfEvaluation: true, feedbackRequired: true }
    const off = { ...program, approvalRequired: false, selfEvaluation: false, feedbackRequired: false }
    const table: Array<[SummaryLine[], LabRule, typeof fx, string]> = [
      [one("checkOff", "Group check-off", "On", "Off"), program, { ...fx, checkOff: "off" }, "Turn off group check-off?"],
      [one("checkOff", "Group check-off", "Off", "On"), program, { ...fx, checkOff: "on" }, "Turn on group check-off?"],
      [one("checkOff", "Group check-off", "Works alone", "With assistance"), program, fx, "Change what a group check-off records?"],
      [one("approvalRequired", "Admin approval"), on, fx, "Turn on admin approval?"],
      [one("approvalRequired", "Admin approval"), off, fx, "Turn off admin approval?"],
      [one("selfEvaluation", "Student rates themselves first"), on, fx, "Turn on student self rating?"],
      [one("feedbackRequired", "Feedback required"), off, fx, "Turn off required feedback?"],
      [one("model", "How skills are judged"), program, fx, "Change how skills are judged?"],
      [one("criteria", "Levels that move a student forward"), program, fx, "Change the levels that move a student forward?"],
      [one("criteria", "Outcome that moves a student forward"), program, fx, "Change the outcome that moves a student forward?"],
      [one("levels", "Level name"), program, fx, "Rename a level?"],
      [one("levels", "Level names"), program, fx, "Rename the levels?"],
      [one("levels", "Levels"), program, fx, "Change the levels?"],
      [one("levels", "Level order"), program, fx, "Reorder the levels?"],
      [one("outcomeLabels", "Outcome name"), program, fx, "Rename an outcome?"],
      [one("outcomeLabels", "Outcome names"), program, fx, "Rename the outcomes?"],
      [one("questions", "Questions"), program, fx, "Change the questions?"],
      [one("need", "Times needed"), program, fx, "Change times needed?"],
      [one("evaluatorRoles", "Who signs off"), program, fx, "Change who signs off?"],
      [one("studentFields", "What the student fills in"), program, fx, "Change what the student fills in?"],
      [one("minimums", "Level minimums"), program, fx, "Clear the level minimums?"],
      [one("cleared", "Levels"), program, fx, "Clear levels?"],
      [one("other", "Other settings"), program, fx, "Apply these settings?"],
      [[...one("need", "Times needed"), ...one("checkOff", "Group check-off")], program, fx, "Apply 2 changes?"],
      [[...one("need"), ...one("questions"), ...one("model")], program, fx, "Apply 3 changes?"],
    ]
    for (const [lines, rule, effects, want] of table) {
      const got = actionTitle(lines, program, rule, effects)
      expect(got, `${lines.map((l) => l.key).join("+")}`).toBe(want)
      expect(got).not.toMatch(/\bitems?\b|\bcounts?\b|Accepted|\u2014/)
      expect(got.charAt(0)).toBe(got.charAt(0).toUpperCase())
    }
  })

  it("C2 titles from the engine: self rating turned on, a model switch, a rule nobody moves on", () => {
    const self = summary(seed, { ...program, selfEvaluation: !program.selfEvaluation })
    if (self.students.kind !== "moves") expect(self.title).toBe(`Turn ${program.selfEvaluation ? "off" : "on"} student self rating?`)
    const sw = summary(seed, cases[2]![1])
    expect(sw.students.kind).toBe("zero")
    expect(sw.title).toBe(`Apply ${sw.changes.length} changes?`)
    expect(sw.figure).toBeUndefined()
  })

  it("C2 figure: only when nobody moves, one change, plain values, both short", () => {
    // Group check-off turned off: one change, nobody moves, "On -> Off".
    const off = summary(seed, { ...program, checkOff: { levelIndex: null, score: null, ...program.checkOff, enabled: false } })
    expect(off.students.kind).toBe("zero")
    expect(off.title).toBe("Turn off group check-off?")
    expect(off.figure).toEqual({ icon: "fa-check-double", before: "On", after: "Off" })
    const rename = summary(seed, { ...program, levels: program.levels.map((l, i) => (i === 1 ? "Assisted" : l)) })
    expect(rename.figure).toBeUndefined()
    // Students move: never a figure, whatever the change.
    expect(summary(seed, { ...program, need: program.need + 1 }).figure).toBeUndefined()
    expect(FIGURE_MAX).toBeLessThanOrEqual(16)
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
