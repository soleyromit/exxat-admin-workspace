import { readFileSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, it } from "vitest"
import { createSeed, IDS } from "@/lib/v2/seed"
import { compareEvaluation } from "@/lib/v2/queue"
import { evaluationView, evaluationViewsFor } from "@/lib/lab/evaluation-view"
import type { Evaluation, V2State } from "@/lib/v2/types"

const AT = "2026-10-20T10:00:00Z"
const src = (p: string) => readFileSync(join(__dirname, "../..", p), "utf8")

describe("RP-07: any recorded evaluation is viewable in full", () => {
  it("carries the facts, every response, the feedback and the student's note", () => {
    const s = createSeed()
    const v = evaluationView(s, "ev-rq-1")!
    expect(v).toBeTruthy()
    const labels = v.facts.map((f) => f.label)
    expect(labels).toEqual(expect.arrayContaining(["Evaluator", "Setting", "Location"]))
    expect(labels.some((l) => l === "Date performed" || l === "Evaluated")).toBe(true)
    expect(v.facts.find((f) => f.label === "Evaluator")!.value).toMatch(/, (Preceptor|Faculty|Lab instructor)$/)
    expect(v.feedback).toMatch(/five rights/)
    expect(v.studentNote).toBe("I was nervous and checked the order twice.")
    expect(v.comparison.rows.length).toBeGreaterThan(0)
    expect(v.recorded).toBe(true)
  })

  it("reads studentNote from the request when present, and shows nothing when absent (never invented)", () => {
    const s = createSeed()
    const e = s.evaluations.find((x) => x.id === "ev-maya-1")!
    expect(evaluationView(s, e.id)!.studentNote).toBe("")
    const sub = s.submissions.find((x) => x.studentId === e.studentId)!
    const s2: V2State = { ...s, evaluations: s.evaluations.map((x) => (x.id === e.id ? { ...x, submissionId: sub.id } : x)), submissions: s.submissions.map((x) => (x.id === sub.id ? { ...x, studentNote: "Done on the night shift." } : x)) }
    expect(evaluationView(s2, e.id)!.studentNote).toBe("Done on the night shift.")
  })

  it("says only the outcome was recorded on older history, rather than showing empty answers", () => {
    const s = createSeed()
    const v = evaluationView(s, "ev-maya-1")!
    expect(v.recorded).toBe(false)
    expect(v.outcome).toMatch(/^(Met|Unmet|Not yet)$/)
  })

  it("opens as many evaluations as the director's counted figure", () => {
    const s = createSeed()
    const e = s.evaluations.find((x) => x.status === "counted")!
    const counted = s.evaluations.filter((x) => x.studentId === e.studentId && x.skillId === e.skillId && x.status === "counted").length
    expect(evaluationViewsFor(s, e.studentId, e.skillId, true)).toHaveLength(counted)
  })

  it("is reachable from every staff surface named in the audit", () => {
    expect(src("components/lab/reviewer/record-frame.tsx")).toMatch(/EvaluationSheet views=\{views\}/)
    expect(src("components/lab/reviewer/record-frame.tsx")).toMatch(/openEvaluation\(r\.id\)/)
    expect(src("components/lab/screens/reviewer-student-record-b.tsx")).toMatch(/<EvaluationBody v=\{view\} \/>/)
    for (const v of ["a", "b"]) expect(src(`components/lab/screens/director-verification-detail-${v}.tsx`)).toMatch(/<EvidenceLink [^>]*state=\{state\}/)
    expect(src("components/lab/admin-b/evidence-peek.tsx")).toMatch(/evaluation: e\.id/)
    expect(src("components/lab/admin-b/evidence-peek.tsx")).not.toMatch(/The full evaluation \(RP-07\) opens on the student record\./)
  })
})

describe("AR-03: the reviewer examines the full set of responses", () => {
  it("shows the evaluator's outcome beside a level, not only the level", () => {
    const s = createSeed()
    const base = s.evaluations.find((e) => e.id === "ev-maya-1")!
    const e: Evaluation = { ...base, id: "ev-t-l", skillId: IDS.urinaryCath, submissionId: "sub-maya-1", levelIndex: 1, outcome: "not-met", versions: [{ version: 1, outcome: "not-met", at: AT, by: IDS.delgado, reason: null, detail: { feedback: "ok", levelIndex: 1 } }] }
    const c = compareEvaluation(s, e)
    expect(c.rows[0].label).toBe("Level of supervision")
    expect(c.rows.find((r) => r.label === "Outcome")).toMatchObject({ evaluator: "Unmet", agreement: "not-comparable" })
  })

  it("shows the score given on each question for a scored skill", () => {
    const s = createSeed()
    const skill = s.skills.find((k) => k.config && k.config.questions.length >= 2)!
    const s2: V2State = { ...s, skills: s.skills.map((k) => (k.id === skill.id ? { ...k, model: "scored" } : k)) }
    const base = s.evaluations.find((e) => e.id === "ev-maya-1")!
    const scores = skill.config!.questions.map((_, i) => (i === 0 ? 4 : null))
    const e: Evaluation = { ...base, id: "ev-t-s", skillId: skill.id, submissionId: undefined, versions: [{ version: 1, outcome: "met", at: AT, by: IDS.delgado, reason: null, detail: { feedback: "", scores } }] }
    const c = compareEvaluation(s2, e)
    const q = skill.config!.questions
    expect(c.rows.find((r) => r.label === q[0])).toMatchObject({ evaluator: "4" })
    expect(c.rows.find((r) => r.label === q[1])).toMatchObject({ evaluator: "Not scored" })
    expect(c.rows[c.rows.length - 1]).toMatchObject({ label: "Outcome", evaluator: "Met" })
  })

  it("renders the self-evaluation note on the review item (every variant uses CompareTable)", () => {
    expect(src("components/lab/reviewer/review-parts.tsx")).toMatch(/showNote && c\.selfNote/)
    for (const v of ["a", "b", "c"]) expect(src(`components/lab/screens/reviewer-review-item-${v}.tsx`)).toMatch(/<CompareTable key=\{c\.evaluationId\} c=\{c\}( checkoff=\{isCheckoff\(d\.row\)\})? \/>/)
  })
})
