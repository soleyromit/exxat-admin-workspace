import * as React from "react"
import { existsSync, readFileSync } from "node:fs"
import { join } from "node:path"
import { afterEach, describe, expect, it } from "vitest"
import { cleanup, render, screen, within } from "@testing-library/react"
import { createSeed, IDS } from "@/lib/v2/seed"
import { STUDENT_ID } from "@/lib/v2/student"
import { evaluationView } from "@/lib/lab/evaluation-view"
import { cellFlags, offeringSkills, recordCheckoffs } from "@/lib/lab/course-checkoff"
import { EvaluationBody, NO_FEEDBACK, outcomeLine } from "@/components/lab/evaluation/evaluation-view"
import { ReviewResponses } from "@/components/lab/reviewer/review-responses"
import type { ItemDetail } from "@/lib/lab/reviewer"
import type { Evaluation, V2State } from "@/lib/v2/types"

/** The one read-only renderer for a recorded evaluation [REQ SH-07, RP-07, AR-03]. */

const AT = "2026-10-20T10:00:00Z"
const src = (p: string) => readFileSync(join(__dirname, "../..", p), "utf8")
afterEach(cleanup)

/** A copy of one seeded evaluation with a new id, skill and stored detail. */
function withEval(s: V2State, patch: Partial<Evaluation> & { id: string }, detail: NonNullable<Evaluation["versions"][number]["detail"]>): V2State {
  const base = s.evaluations.find((e) => e.id === "ev-maya-1")!
  const e: Evaluation = { ...base, submissionId: undefined, status: "counted", ...patch, versions: [{ version: 1, outcome: patch.outcome ?? "met", at: AT, by: IDS.delgado, reason: null, detail }] }
  return { ...s, evaluations: [...s.evaluations, e] }
}

describe("EvaluationBody: every response type, the feedback and what the student supplied", () => {
  it("binary outcome with self-rating, feedback and the student's note (staff words)", () => {
    const s = createSeed()
    render(<EvaluationBody v={evaluationView(s, "ev-rq-1")!} />)
    const table = screen.getByRole("table")
    expect(within(table).getByText("Overall")).toBeTruthy()
    expect(within(table).getByText("Student answer")).toBeTruthy()
    expect(within(table).getByText("Unmet")).toBeTruthy()
    expect(within(table).getByText("Met")).toBeTruthy()
    expect(screen.getByText(/five rights/)).toBeTruthy()
    expect(screen.getByText("Supplied by the student")).toBeTruthy()
    expect(screen.getByText("I was nervous and checked the order twice.")).toBeTruthy()
    expect(screen.queryByText("Self-rating")).toBeNull() // already the Student column: said once
  })

  it("speaks to the student as the sender", () => {
    render(<EvaluationBody v={evaluationView(createSeed(), "ev-rq-1")!} audience="student" />)
    expect(screen.getByText("What you sent")).toBeTruthy()
    expect(screen.queryByText("Supplied by the student")).toBeNull()
  })

  it("question model: each question answered Yes or No", () => {
    const s0 = createSeed()
    const skill = s0.skills.find((k) => k.config && k.config.questions.length >= 2)!
    const s1: V2State = { ...s0, skills: s0.skills.map((k) => (k.id === skill.id ? { ...k, model: "question" } : k)) }
    const answers = skill.config!.questions.map((_, i) => (i === 0 ? "yes" : "no") as "yes" | "no")
    const s = withEval(s1, { id: "ev-r-q", skillId: skill.id }, { feedback: "Steady hands.", answers })
    render(<EvaluationBody v={evaluationView(s, "ev-r-q")!} />)
    const q = skill.config!.questions
    expect(screen.getByText(q[0]).closest("tr")!.textContent).toContain("Yes")
    expect(screen.getByText(q[1]).closest("tr")!.textContent).toContain("No")
    expect(screen.getByText("Outcome", { selector: "td" }).closest("tr")!.textContent).toContain("Met")
    expect(screen.getByText("Steady hands.")).toBeTruthy()
  })

  it("scored model: the score on each question, never only a total", () => {
    const s0 = createSeed()
    const skill = s0.skills.find((k) => k.config && k.config.questions.length >= 2)!
    const s1: V2State = { ...s0, skills: s0.skills.map((k) => (k.id === skill.id ? { ...k, model: "scored" } : k)) }
    const scores = skill.config!.questions.map((_, i) => (i === 0 ? 4 : null))
    const s = withEval(s1, { id: "ev-r-s", skillId: skill.id }, { feedback: "", scores })
    render(<EvaluationBody v={evaluationView(s, "ev-r-s")!} />)
    const q = skill.config!.questions
    expect(screen.getByText(q[0]).closest("tr")!.textContent).toContain("4")
    expect(screen.getByText(q[1]).closest("tr")!.textContent).toContain("Not scored")
    expect(screen.getByText(NO_FEEDBACK)).toBeTruthy()
  })

  it("level model: the level and the evaluator's Met or Unmet", () => {
    const s = withEval(createSeed(), { id: "ev-r-l", skillId: IDS.urinaryCath, levelIndex: 1, outcome: "not-met" }, { feedback: "Needs prompting on the sterile field.", levelIndex: 1 })
    render(<EvaluationBody v={evaluationView(s, "ev-r-l")!} />)
    expect(screen.getByText("Level of supervision")).toBeTruthy()
    expect(screen.getByText("Outcome", { selector: "td" }).closest("tr")!.textContent).toContain("Unmet")
    expect(screen.getByText("Needs prompting on the sterile field.")).toBeTruthy()
  })

  it("renders the request note and a different self-evaluation note, both", () => {
    const s0 = createSeed()
    const e = s0.evaluations.find((x) => x.id === "ev-rq-1")!
    const s: V2State = { ...s0, submissions: s0.submissions.map((x) => (x.id === e.submissionId ? { ...x, studentNote: "Done on the night shift." } : x)) }
    const v = evaluationView(s, e.id)!
    expect(v.studentNote).toBe("Done on the night shift.")
    expect(v.selfNote).toBe("I was nervous and checked the order twice.")
    render(<EvaluationBody v={v} />)
    expect(screen.getByText("Done on the night shift.")).toBeTruthy()
    expect(screen.getByText("Self-evaluation note")).toBeTruthy()
    expect(screen.getByText("I was nervous and checked the order twice.")).toBeTruthy()
  })

  it("a self-evaluation stored on the evaluation sits beside the evaluator's answer, once, with its note", () => {
    const s = withEval(createSeed(), { id: "ev-r-self", skillId: "sk-sterile-dressing", self: { rating: "Met", note: "Felt ready." } }, { feedback: "Good.", answers: [] })
    const v = evaluationView(s, "ev-r-self")!
    expect(v.comparison.selfRated).toBe(true)
    render(<EvaluationBody v={v} />)
    expect(screen.getByText("Student answer", { selector: "th" })).toBeTruthy()
    expect(screen.queryByText("Self-rating")).toBeNull()
    expect(screen.getByText("Felt ready.")).toBeTruthy()
  })

  it("never says Unmet, counted: the outcome alone once final, the overlay while it is not", () => {
    expect(outcomeLine({ outcome: "Unmet", status: "Counted" })).toBe("Unmet")
    expect(outcomeLine({ outcome: "Met", status: "Awaiting approval" })).toBe("Met, awaiting approval")
  })

  it("check-off: the check-off note, no empty supplied or self sections", () => {
    const s0 = createSeed()
    const recorderId = s0.people.find((p) => p.kind === "faculty")!.id
    // A skill the student does not yet qualify for: a qualifying student is never checked off again (D-L8d).
    const off = s0.offerings!.find((o) => o.id === "off-nurs350-fa26")!
    const sk = offeringSkills(s0, off).map((m) => m.skill.id).find((id) => !cellFlags(s0, STUDENT_ID, id).hasEvidence)!
    const s = recordCheckoffs(s0, { offeringId: "off-nurs350-fa26", date: "2026-10-26", setting: "lab", recorderId, sessionId: "t1" }, [`${STUDENT_ID}|${sk}`], "2026-10-26T10:00:00.000Z").state
    const e = s.evaluations.find((x) => x.source === "checkoff")!
    const { container } = render(<EvaluationBody v={evaluationView(s, e.id)!} />)
    expect(container.querySelector("[data-checkoff-note]")!.textContent).toMatch(/^Recorded in a group check-off/)
    expect(container.querySelector("[data-evaluation-supplied]")).toBeNull()
    expect(screen.queryByText("No self-rating to compare.")).toBeNull()
    expect(screen.queryByText("Student answer", { selector: "th" })).toBeNull()
  })
})

describe("ReviewResponses: AR-03 on every Review item variant", () => {
  it("gives each evaluation its own feedback, not the first one found", () => {
    const s0 = createSeed()
    const s1 = withEval(s0, { id: "ev-r-1", skillId: IDS.urinaryCath, levelIndex: 1 }, { feedback: "First feedback.", levelIndex: 1 })
    const s = withEval(s1, { id: "ev-r-2", skillId: IDS.urinaryCath, levelIndex: 2 }, { feedback: "Second feedback.", levelIndex: 2 })
    const d = { evaluations: s.evaluations.filter((e) => e.id === "ev-r-1" || e.id === "ev-r-2") } as unknown as ItemDetail
    render(<ReviewResponses state={s} d={d} />)
    expect(screen.getByText("First feedback.")).toBeTruthy()
    expect(screen.getByText("Second feedback.")).toBeTruthy()
  })

  it("every variant renders its responses through the shared renderer", () => {
    for (const v of ["a", "b", "c"]) {
      const f = src(`components/lab/screens/reviewer-review-item-${v}.tsx`)
      expect(f).toMatch(/<ReviewResponses state=\{ctx\.state\} d=\{d\} \/>/)
      expect(f).not.toMatch(/d\.feedback/)
    }
    const split = src("components/lab/screens/reviewer-approvals-b.tsx")
    expect(split).toMatch(/<ReviewResponses state=\{ctx\.state\} d=\{detail\} \/>/)
    expect(split).not.toMatch(/detail\.feedback|<CompareTable/)
  })
})

describe("one renderer, every entry point", () => {
  it("has no second evaluation renderer", () => {
    expect(existsSync(join(__dirname, "../..", "components/lab/reviewer/evaluation-sheet.tsx"))).toBe(false)
    expect(src("components/lab/student/evaluation-sheet.tsx")).toMatch(/<EvaluationSheet views=\{views\}[^>]*audience="student"/)
  })

  it("is opened from student, reviewer and director surfaces", () => {
    const shared = /from "@\/components\/lab\/evaluation\/evaluation-view"/
    for (const p of ["components/lab/reviewer/record-frame.tsx", "components/lab/director/verify.tsx", "components/lab/screens/reviewer-student-record-b.tsx", "components/lab/student/evaluation-sheet.tsx", "components/lab/reviewer/review-responses.tsx"]) expect(src(p)).toMatch(shared)
    for (const v of ["a", "b"]) {
      expect(src(`components/lab/screens/student-skill-detail-${v}.tsx`)).toMatch(/<StudentEvaluationSheet /)
      expect(src(`components/lab/screens/student-record-${v}.tsx`)).toMatch(/r\.openEval\(x\.evaluationId!\)/)
    }
  })
})
