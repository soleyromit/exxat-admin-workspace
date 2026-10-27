import { describe, expect, it } from "vitest"
import { createSeed } from "@/lib/v2/seed"
import { DEFAULT_STUDENT, buildStudent, requestGroups } from "@/lib/lab/student"
import { loggedNotSent, saveLogged, type LoggedInput } from "@/lib/lab/logged"
import { reviewDrafts, sendDraftGroups, sentSentence } from "@/lib/lab/drafts-send"
import { evaluatorsFor, pickRows, whereChoices } from "@/lib/lab/student2"
import type { V2State } from "@/lib/v2/types"

/**
 * Send several drafts at once (Romit 2026-10-27, LEDGER D-L18): grouped by who signs off, one request per group (ST-04, D-L2);
 * a missing date blocks until filled (ST-10); a lab draft never goes to a preceptor (ST-05, ST-08, hard stop).
 */
const seed = createSeed()
const maya = buildStudent(seed, DEFAULT_STUDENT)!
const where = whereChoices(seed, DEFAULT_STUDENT)
const clinical = where.find((w) => w.setting === "clinical")!
const lab = where.find((w) => w.setting === "lab")!
const picks = pickRows(seed, maya).map((p) => p.id)

const input = (skillIds: string[], w = clinical, date = "2026-10-25", who: string | null = null): LoggedInput => ({ skillIds, where: w.value, setting: w.setting, clinicalSetting: w.clinicalSetting, location: w.location ?? "Harbor General, 4 West", date, unit: "4 West", case: "", note: "", ratings: {}, who })

function save(s: V2State, i: LoggedInput, at: string) {
  return saveLogged(s, i, DEFAULT_STUDENT, at)
}

describe("send several drafts at once", () => {
  // Two evaluators who can sign every chosen skill at this placement.
  const okFor = (ids: string[]) => evaluatorsFor(seed, ids, clinical.location ?? "Harbor General, 4 West", "clinical").filter((o) => o.eligible)
  const skillsA = [picks[0]]
  const skillsB = [picks[1]]
  const skillsC = [picks[2]]
  const both = okFor([...skillsA, ...skillsB, ...skillsC])

  it("3 drafts with 2 evaluators become 2 requests, and the drafts move to Waiting", () => {
    expect(both.length).toBeGreaterThanOrEqual(2)
    const [e1, e2] = both
    const a = save(seed, input(skillsA, clinical, "2026-10-25", e1.id), "2026-10-26T09:00:00.000Z")
    const b = save(a.state, input(skillsB, clinical, "2026-10-25", e1.id), "2026-10-26T09:10:00.000Z")
    const c = save(b.state, input(skillsC, clinical, "2026-10-25", e2.id), "2026-10-26T09:20:00.000Z")
    const review = reviewDrafts(c.state, DEFAULT_STUDENT, [a.batchId, b.batchId, c.batchId])
    expect(review.ready).toBe(true)
    expect(review.groups).toHaveLength(2)
    const out = sendDraftGroups(c.state, DEFAULT_STUDENT, review, "2026-10-26T10:00:00.000Z")
    expect(out.requests).toHaveLength(2)
    expect(sentSentence(out)).toBe("Sent 2 requests to 2 evaluators.")
    expect(loggedNotSent(out.state, DEFAULT_STUDENT)).toEqual([])
    const waiting = requestGroups(out.state, DEFAULT_STUDENT).flatMap((g) => g.waiting).map((r) => r.id)
    for (const r of out.requests) expect(waiting).toContain(r.id)
    // The first request carries both skills of e1's two drafts (several skills in one submission).
    expect(out.requests.find((r) => r.who === e1.id)!.skillIds.sort()).toEqual([...skillsA, ...skillsB].sort())
  })

  it("a draft missing its date blocks the send until the date is filled in the review", () => {
    const e1 = both[0]
    const a = save(seed, input(skillsA, clinical, "", e1.id), "2026-10-26T09:00:00.000Z")
    const blocked = reviewDrafts(a.state, DEFAULT_STUDENT, [a.batchId])
    expect(blocked.ready).toBe(false)
    expect(blocked.blocked[0].issues.map((x) => x.field)).toEqual(["date"])
    expect(sendDraftGroups(a.state, DEFAULT_STUDENT, blocked).requests).toEqual([])
    const fixed = reviewDrafts(a.state, DEFAULT_STUDENT, [a.batchId], { [a.batchId]: { date: "2026-10-24" } })
    expect(fixed.ready).toBe(true)
    const out = sendDraftGroups(a.state, DEFAULT_STUDENT, fixed)
    expect(out.state.logEntries.find((e) => e.requestId === out.requests[0].id)!.sitting!.date).toBe("2026-10-24")
  })

  it("a lab draft cannot pick a preceptor: it is never offered, and a preceptor chosen earlier is refused", () => {
    expect(lab).toBeTruthy()
    const preceptor = seed.people.find((p) => p.kind === "preceptor")!
    const a = save(seed, input(skillsA, lab, "2026-10-25", preceptor.id), "2026-10-26T09:00:00.000Z")
    const review = reviewDrafts(a.state, DEFAULT_STUDENT, [a.batchId])
    expect(review.rows[0].options.some((o) => seed.people.find((p) => p.id === o.id)?.kind === "preceptor")).toBe(false)
    expect(review.ready).toBe(false)
    expect(review.rows[0].issues[0]).toMatchObject({ field: "who" })
    expect(review.rows[0].issues[0].message).toMatch(/lab instructor or faculty/)
  })
})
