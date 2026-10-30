import * as React from "react"
import { afterEach, describe, expect, it } from "vitest"
import { cleanup, render, screen } from "@testing-library/react"
import { createSeed } from "@/lib/v2/seed"
import { STUDENT_ID } from "@/lib/v2/student"
import { cellFlags, offeringSkills, recordCheckoffs } from "@/lib/lab/course-checkoff"
import { attempts } from "@/lib/lab/student"
import { CheckoffDone, EvaluatorWithTag, checkoffLineFor } from "@/components/lab/student/checkoff"
import { AttemptLedger } from "@/components/lab/student/skill-detail"

/** Group check-off on the student side [PROTO; CALL 2026-10-28, Sankalp]: a "Check-off" tag on the evaluation, and an "already done" line where the skill is picked. */
// A skill on the offering the student does not yet qualify for: a qualifying student is never ticked again (D-L8d).
const SEED = createSeed()
const SK = offeringSkills(SEED, SEED.offerings!.find((o) => o.id === "off-nurs350-fa26")!).map((m) => m.skill.id).find((id) => !cellFlags(SEED, STUDENT_ID, id).hasEvidence)!

function withCheckoff() {
  const s = createSeed()
  const recorderId = s.people.find((p) => p.kind === "faculty")!.id
  return recordCheckoffs(s, { offeringId: "off-nurs350-fa26", date: "2026-10-26", setting: "lab", recorderId, sessionId: "t1" }, [`${STUDENT_ID}|${SK}`], "2026-10-26T10:00:00.000Z").state
}

afterEach(cleanup)

describe("check-off on student screens", () => {
  it("says the skill is already checked off, without blocking", () => {
    const s = withCheckoff()
    const line = checkoffLineFor(s, STUDENT_ID, SK)
    expect(line).toMatch(/^Checked off in the skills lab by .+ on Oct 26(\. No need to send it\.|, waiting for approval\.)$/)
    render(<CheckoffDone s={s} studentId={STUDENT_ID} ids={[SK]} />)
    expect(screen.getByText(line!)).toBeTruthy()
    expect(checkoffLineFor(createSeed(), STUDENT_ID, SK)).toBeNull()
  })

  it("tags the evaluation row and the attempt with Check-off", () => {
    const s = withCheckoff()
    const e = s.evaluations.find((x) => x.source === "checkoff")!
    render(<EvaluatorWithTag s={s} evaluationId={e.id} name="Faculty name" />)
    expect(screen.getAllByText("Check-off").length).toBe(1)
    cleanup()
    const rows = attempts(s, STUDENT_ID, SK)
    expect(rows.some((r) => r.checkoff)).toBe(true)
    render(<AttemptLedger rows={rows} />)
    expect(screen.getAllByText("Check-off").length).toBe(1)
  })
})
