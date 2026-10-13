import { describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"
import { responseRows, ResponsesList } from "@/components/review/responses-list"
import { outcomeOf } from "@/components/review/agreement-compare-card"
import type { RecordedDetail } from "@/lib/store"

const q = (answers: boolean[]): RecordedDetail => ({ kind: "question", yes: answers.filter(Boolean).length, total: answers.length, items: answers.map((yes, i) => ({ id: `q${i + 1}`, text: `Question ${i + 1}`, yes })) })
const s = (scores: number[]): RecordedDetail => ({ kind: "scored", total: scores.reduce((a, b) => a + b, 0), average: scores.reduce((a, b) => a + b, 0) / scores.length, items: scores.map((score, i) => ({ id: `q${i + 1}`, text: `Question ${i + 1}`, score })) })

describe("RP-07 full responses for every model", () => {
  it("question model: one row per question with student, evaluator and same or differs", () => {
    const rows = responseRows(q([true, false, true]), q([true, true, true]))
    expect(rows.map((r) => [r.label, r.student, r.evaluator, r.same])).toEqual([
      ["Question 1", "Yes", "Yes", true],
      ["Question 2", "No", "Yes", false],
      ["Question 3", "Yes", "Yes", true],
    ])
    render(<ResponsesList self={q([true, false, true])} evaluator={q([true, true, true])} evaluatorRole="Preceptor" />)
    expect(screen.getAllByText("Differs")).toHaveLength(1)
    expect(screen.getAllByText("Same")).toHaveLength(2)
  })
  it("scored model: every score is listed, never only the average", () => {
    render(<ResponsesList self={s([3, 4])} evaluator={s([4, 4])} evaluatorRole="Faculty" />)
    expect(screen.getByText("Question 1")).toBeInTheDocument()
    expect(screen.getAllByText(/Score 4/).length).toBe(3)
    expect(screen.getByText(/Score 3/)).toBeInTheDocument()
  })
  it("binary and demonstration models: one outcome row", () => {
    expect(responseRows({ kind: "binary", label: "Unmet" }, { kind: "binary", label: "Met" })).toEqual([{ key: "outcome", label: "Outcome", student: "Unmet", evaluator: "Met", same: false }])
    expect(responseRows(null, { kind: "demonstration", level: "Independent" })).toEqual([{ key: "level", label: "Demonstration outcome", student: null, evaluator: "Independent", same: null }])
  })
  it("no self-evaluation: only the evaluator column is shown", () => {
    render(<ResponsesList self={null} evaluator={q([true])} evaluatorRole="Lab instructor" />)
    expect(screen.queryByText(/Student:/)).toBeNull()
    expect(screen.getByText(/Evaluator \(Lab instructor\):/)).toBeInTheDocument()
  })
  it("a question the student never answered reads Not answered", () => {
    const rows = responseRows({ kind: "question", yes: 0, total: 0, items: [] }, q([true]))
    expect(rows[0]).toMatchObject({ student: "Not answered", same: false })
  })
  it("outcomes are summarised in words for each model", () => {
    expect(outcomeOf(q([true, false]))).toBe("1 of 2 answered Yes")
    expect(outcomeOf(s([3, 4]))).toBe("Average score 3.5")
    expect(outcomeOf({ kind: "binary", label: "Met" })).toBe("Met")
    expect(outcomeOf({ kind: "demonstration", level: "Observed" })).toBe("Observed")
  })
})
