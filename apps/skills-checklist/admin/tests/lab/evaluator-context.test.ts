import fs from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"
import { createSeed } from "@/lib/v2/seed"
import { buildRequest, labCellKey, labFeedbackMessage, labFeedbackMissing, labSavedResults, labSessionSkills, performedSpan, roster, SEED_REQUEST_ID, type LabMark } from "@/lib/lab/evaluator"

const read = (rel: string) => fs.readFileSync(path.join(__dirname, "../..", rel), "utf8")

describe("EV-04: the evaluator sees every detail the student supplied, and the note in full", () => {
  const s = createSeed()
  it("the request carries the date performed from its entries, not the date sent", () => {
    const req = buildRequest(s, "request", "default")!
    const x = s.submissions.find((r) => r.id === SEED_REQUEST_ID)!
    const ats = s.logEntries.filter((e) => (x.entryIds ?? []).includes(e.id)).map((e) => e.at)
    expect(ats.length).toBeGreaterThan(0)
    expect(req.performed).toBe(performedSpan(ats))
    expect(req.performed).not.toBeNull()
  })
  it("one day reads as one date, several as a span, none as null", () => {
    expect(performedSpan([])).toBeNull()
    expect(performedSpan(["2026-10-12T09:00:00.000Z", "2026-10-12T15:00:00.000Z"])).toBe("Oct 12")
    expect(performedSpan(["2026-10-20T09:00:00.000Z", "2026-10-18T09:00:00.000Z"])).toBe("Oct 18 to Oct 20")
  })
  it("reads the request's studentNote (the field the student Send flow writes) and never invents one", () => {
    expect(buildRequest(s, "request", "default")!.studentNote).toBe("")
    const s2 = createSeed()
    const x = s2.submissions.find((r) => r.id === SEED_REQUEST_ID)!
    x.studentNote = "  Second attempt after the skills lab practice.  "
    expect(buildRequest(s2, "request", "default")!.studentNote).toBe("Second attempt after the skills lab practice.")
  })
  it("the per-skill note reaches the form whole", () => {
    const req = buildRequest(s, "request", "default")!
    const withNote = req.skills.find((k) => k.self?.note)
    expect(withNote?.self?.note.length).toBeGreaterThan(40)
  })
  it("all three form variants show the full note (no clamp), the request note and the date in the context line", () => {
    const fields = read("components/lab/evaluator/fields.tsx")
    expect(fields).not.toMatch(/line-clamp/)
    expect(fields).toMatch(/data-request-note/)
    expect(fields).toMatch(/Performed \$\{req\.performed\}/)
    for (const v of ["a", "b", "c"]) {
      const src = read(`components/lab/screens/evaluator-form-${v}.tsx`)
      expect(src).toMatch(/<RequestSummary req=\{req\} line=\{.*contextLine\(req\)/)
      expect(src).toMatch(/<SelfNote [^>]*requestNote=\{req\.studentNote\}/)
    }
  })
})

describe("EV-06: a lab result on a skill that requires feedback cannot be saved without it", () => {
  const s = createSeed()
  const rows = roster(s, { query: "", group: "" }).slice(0, 4)
  const skills = labSessionSkills(s, true).filter((k) => !k.blocked).slice(0, 2)
  it("the lab option makes every session skill require feedback; without it the skill's own setting decides", () => {
    expect(skills.every((k) => k.feedbackRequired)).toBe(true)
    for (const k of labSessionSkills(s)) expect(k.feedbackRequired).toBe(!!s.skills.find((x) => x.id === k.id)?.config?.feedbackRequired)
  })
  it("names each recorded result with no feedback; absent and unmarked cells need nothing", () => {
    const cells: Record<string, LabMark> = {
      [labCellKey(rows[0].id, skills[0].id)]: "met",
      [labCellKey(rows[1].id, skills[0].id)]: "not-met",
      [`${rows[2].id}|*`]: "absent",
      [labCellKey(rows[2].id, skills[0].id)]: "met",
    }
    const fb = { [labCellKey(rows[1].id, skills[0].id)]: "Clear steps." }
    const miss = labFeedbackMissing(rows, skills, cells, fb)
    expect(miss.map((m) => m.studentId)).toEqual([rows[0].id])
    expect(labFeedbackMessage(miss)).toBe(`1 feedback missing. Write feedback for ${rows[0].name}, ${skills[0].name}. The program requires it.`)
    expect(labFeedbackMissing(rows, skills, cells, { ...fb, [labCellKey(rows[0].id, skills[0].id)]: "   " })).toHaveLength(1)
    expect(labFeedbackMissing(rows, skills, cells, { ...fb, [labCellKey(rows[0].id, skills[0].id)]: "Good." })).toHaveLength(0)
  })
  it("a skill that does not require feedback never blocks", () => {
    const optional = skills.map((k) => ({ ...k, feedbackRequired: false }))
    expect(labFeedbackMissing(rows, optional, { [labCellKey(rows[0].id, skills[0].id)]: "met" }, {})).toHaveLength(0)
  })
  it("feedback is stored with its saved result", () => {
    const cells: Record<string, LabMark> = { [labCellKey(rows[0].id, skills[0].id)]: "met" }
    const saved = labSavedResults(rows, skills, cells, { [labCellKey(rows[0].id, skills[0].id)]: " Safe technique. " })
    expect(saved).toEqual([{ studentId: rows[0].id, skillId: skills[0].id, outcome: "met", feedback: "Safe technique." }])
  })
  it("both grid variants render the per-result feedback control and the required cue; save goes through the blocking check", () => {
    for (const v of ["a", "b"]) {
      const src = read(`components/lab/screens/lab-instructor-lab-batch-grid-${v}.tsx`)
      expect(src).toMatch(/<LabFeedback /)
      expect(src).toMatch(/<FeedbackRequiredCue /)
    }
    expect(read("components/lab/evaluator/use-lab-grid.tsx")).toMatch(/tally\.results === 0 \|\| missing\.length\) return false/)
  })
})
