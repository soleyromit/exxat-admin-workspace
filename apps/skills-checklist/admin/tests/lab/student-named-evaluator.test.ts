import { describe, expect, it } from "vitest"
import { createSeed } from "@/lib/v2/seed"
import { buildStudent } from "@/lib/lab/student"
import { withNamedEvaluator, whereChoices, locationFor } from "@/lib/lab/student2"
import { sendNew, type LoggedInput } from "@/lib/lab/logged"
import { newEvaluatorRows } from "@/lib/lab/new-evaluators"
import type { Submission, V2State } from "@/lib/v2/types"

const seed = createSeed()
const maya = buildStudent(seed)!
const studentId = maya.student.id
const where = whereChoices(seed, studentId).find((w) => w.setting === "clinical")!
const skillIds = [maya.required[0].id]

/** The Send path as request-parts.tsx runs it: record the typed name, then store the student's one request assigned to them. */
function sendToNewName(s: V2State, name: string, email: string, n: number): V2State {
  const input: LoggedInput = { skillIds, where: where.value, setting: where.setting, clinicalSetting: where.clinicalSetting, location: locationFor(where, ""), date: "2026-10-26", unit: "", case: "", note: "", ratings: {}, answers: {} }
  const submission: Submission = { id: `req-test-${n}`, studentId, skillIds, method: "link", status: "with-evaluator", assignedToId: "", createdAt: "2026-10-26T10:00:00Z", daysWaiting: 0, candidateIds: [] }
  const r = withNamedEvaluator(s, { studentId, name, email, setting: where.setting, skillIds, location: locationFor(where, "") }, submission, "2026-10-26T10:00:00Z")
  return sendNew(r.state, input, studentId, r.submission, "2026-10-26T10:00:00Z")
}

describe("A name typed on Send reaches New evaluators [REQ SL-09, ST-09]", () => {
  it("adds one Not verified evaluator, with the student's request assigned to them (one request, not two)", () => {
    const before = newEvaluatorRows(seed).length
    const subsBefore = seed.submissions.length
    const next = sendToNewName(seed, "Dana  Whitfield", "dana.whitfield@example.org", 1)
    const rows = newEvaluatorRows(next)
    expect(rows.length).toBe(before + 1)
    const person = next.people.find((p) => p.email === "dana.whitfield@example.org")!
    expect(person.verified).toBe(false)
    expect(person.name).toBe("Dana Whitfield")
    expect(person.kind).toBe("preceptor")
    expect(next.submissions.length).toBe(subsBefore + 1)
    const req = next.submissions.find((x) => x.id === "req-test-1")!
    expect(req.assignedToId).toBe(person.id)
    expect(req.entryIds?.length).toBeGreaterThan(0)
  })

  it("reuses the record when the same email is named again", () => {
    const once = sendToNewName(seed, "Dana Whitfield", "dana.whitfield@example.org", 1)
    const twice = sendToNewName(once, "D. Whitfield", "Dana.Whitfield@example.org ", 2)
    expect(newEvaluatorRows(twice).length).toBe(newEvaluatorRows(once).length)
    expect(twice.people.filter((p) => p.email?.trim().toLowerCase() === "dana.whitfield@example.org").length).toBe(1)
    const id = once.people.find((p) => p.email === "dana.whitfield@example.org")!.id
    expect(twice.submissions.find((x) => x.id === "req-test-2")!.assignedToId).toBe(id)
  })
})
