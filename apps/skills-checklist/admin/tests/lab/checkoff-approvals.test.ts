import { describe, expect, it } from "vitest"
import { createSeed } from "@/lib/v2/seed"
import { queueItems } from "@/lib/v2/queue"
import { FLAG_WORD, cellFlags, cellKey, checkoffNote, isTickable, recordCheckoffs } from "@/lib/lab/course-checkoff"
import { CHECKOFF_METHOD, isCheckoff, itemDetail, reviewRows, story } from "@/lib/lab/reviewer"

describe("held group check-off in Approvals", () => {
  const seed = createSeed()
  const skill = seed.skills.find((k) => k.id === "sk-med-admin" && k.config?.approvalRequired) ?? seed.skills.find((k) => k.config?.approvalRequired)!
  const student = seed.people.find((p) => p.kind === "student")!
  const faculty = seed.people.find((p) => p.kind === "faculty")!
  const { state, review } = recordCheckoffs(
    seed,
    { offeringId: "off-nurs350-fa26", date: "2026-10-26", setting: "lab", recorderId: faculty.id, sessionId: "t1" },
    [cellKey(student.id, skill.id)],
    "2026-10-26T15:00:00.000Z",
  )
  const evId = "ev-co-t1-0"

  it("is held and queued", () => {
    expect(review).toBe(1)
    expect(queueItems(state).some((q) => q.source === "checkoff" && q.evaluations.some((e) => e.id === evId))).toBe(true)
  })

  it("reads as a group check-off held by the approval rule, never a disagreement", () => {
    const row = reviewRows(state).find((r) => r.evaluationIds.includes(evId))!
    expect(row).toBeTruthy()
    expect(row.method).toBe(CHECKOFF_METHOD)
    expect(isCheckoff(row)).toBe(true)
    expect(row.reason).toBe("rule")
    expect(row.reasons).not.toContain("disagree")
    expect(row.why).toBe(`Approval required for ${skill.name}`)
    expect(row.checkoffSkill?.id).toBe(skill.id)
    expect(checkoffNote(row.checkoffSkill)).toMatch(/^Recorded in a group check-off on the course offering, not from a student submission\./)
    const d = itemDetail(state, reviewRows(state), row.key)!
    const steps = story(state, d)
    expect(steps.some((s) => s.id === "sent")).toBe(false)
    expect(steps.some((s) => s.title.includes("recorded in a group check-off"))).toBe(true)
  })
})

describe("a student who already qualifies is not ticked again (D-L8d)", () => {
  it("shows status only and is never written", () => {
    const seed = createSeed()
    const faculty = seed.people.find((p) => p.kind === "faculty")!
    const pair = seed.evaluations.map((e) => [e.studentId, e.skillId] as const).find(([st, sk]) => cellFlags(seed, st, sk).hasEvidence)!
    expect(pair).toBeTruthy()
    expect(isTickable(cellFlags(seed, pair[0], pair[1]))).toBe(false)
    expect(FLAG_WORD.hasEvidence).toBe("Already qualifies")
    const r = recordCheckoffs(seed, { offeringId: "off-nurs350-fa26", date: "2026-10-26", setting: "lab", recorderId: faculty.id, sessionId: "q1" }, [cellKey(pair[0], pair[1])], "2026-10-26T15:00:00.000Z")
    expect(r.count).toBe(0)
    expect(r.state).toBe(seed)
  })
})
