import { describe, expect, it } from "vitest"
import { confirmVersion, reopenEvaluation } from "@/lib/v2/outcomes"
import { COUNTER_BY_ID } from "@/lib/v2/selectors"
import { createSeed, IDS } from "@/lib/v2/seed"
import { createV2Store } from "@/lib/v2/store"
import { gaps, isDirector, latestVerification, mandatoryProgress, pendingReasons, verificationRows, verificationStatus, verifiedAt, verifyBlockers, verifyRecord } from "@/lib/v2/verification"
import type { V2State } from "@/lib/v2/types"

const AT = "2026-10-20T10:00:00Z"
const LATER = "2026-10-22T10:00:00Z"
const DIR = IDS.director

function must<T extends { ok: boolean }>(r: T): Extract<T, { ok: true }> {
  if (!r.ok) throw new Error(`expected ok, got ${JSON.stringify(r)}`)
  return r as Extract<T, { ok: true }>
}

/** The first student with counted evidence and nothing pending, so a verification can go through. */
function cleanStudent(s: V2State): string {
  const id = s.people.filter((p) => p.kind === "student").map((p) => p.id).find((x) => verifyBlockers(s, x).length === 0)
  if (!id) throw new Error("no clean student in the seed")
  return id
}

describe("who can verify", () => {
  it("only the program director", () => {
    const s = createSeed()
    const id = cleanStudent(s)
    expect(isDirector(s.people.find((p) => p.id === DIR))).toBe(true)
    for (const who of [IDS.ross, IDS.reviewer, IDS.maya, IDS.delgado]) {
      const r = verifyRecord(s, id, { note: "", confirmed: true }, who, AT)
      expect(r).toMatchObject({ ok: false, error: "Only the program director can verify a record." })
    }
    expect(s.verifications).toEqual([])
  })

  it("refuses an id that is not a student", () => {
    const s = createSeed()
    expect(verifyRecord(s, IDS.delgado, { note: "", confirmed: true }, DIR, AT)).toMatchObject({ ok: false, error: "That student is not in this course." })
  })
})

describe("what blocks a verification", () => {
  it("lists evaluations waiting for approval and open requests, in plain words", () => {
    const s = createSeed()
    const reasons = pendingReasons(s, IDS.maya)
    expect(reasons[0]).toBe("1 evaluation is waiting for approval in the review queue.")
    expect(reasons.some((r) => /sign-off request is still open/.test(r))).toBe(true)
    const r = verifyRecord(s, IDS.maya, { note: "", confirmed: true }, DIR, AT)
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.error).toMatch(/^This record cannot be verified yet\. 1 evaluation is waiting for approval/)
  })

  it("a reopened evaluation blocks until its newest version is confirmed", () => {
    const s = createSeed()
    const id = cleanStudent(s)
    const ev = s.evaluations.find((e) => e.studentId === id && e.status === "counted")!
    const re = must(reopenEvaluation(s, { evaluationId: ev.id, outcome: ev.outcome === "met" ? "not-yet" : "met", feedback: null, reason: "Corrected." }, IDS.ross, AT))
    expect(pendingReasons(re.state, id).some((r) => /reopened/.test(r))).toBe(true)
  })

  it("is refused when nothing counts yet", () => {
    const s = createSeed()
    const id = cleanStudent(s)
    const bare: V2State = { ...s, evaluations: s.evaluations.filter((e) => e.studentId !== id) }
    expect(verifyBlockers(bare, id)).toEqual(["No evaluation counts yet, so there is nothing to verify."])
  })

  it("needs the director's confirmation, and a note within the limit", () => {
    const s = createSeed()
    const id = cleanStudent(s)
    expect(verifyRecord(s, id, { note: "", confirmed: false }, DIR, AT)).toMatchObject({ ok: false, error: "Confirm that you reviewed the evidence and the gaps listed before you verify." })
    const long = verifyRecord(s, id, { note: "x".repeat(1001), confirmed: true }, DIR, AT)
    expect(long.ok).toBe(false)
  })
})

describe("a verification is an immutable numbered version", () => {
  it("records who, when, the note, and the version of each evaluation it rests on", () => {
    const s = createSeed()
    const id = cleanStudent(s)
    const counted = s.evaluations.filter((e) => e.studentId === id && e.status === "counted")
    const r = must(verifyRecord(s, id, { note: "Checked against the clinical log.", confirmed: true }, DIR, AT))
    expect(r.verification).toMatchObject({ studentId: id, version: 1, byId: DIR, at: AT, note: "Checked against the clinical log." })
    expect(r.verification.evidence.map((e) => e.evaluationId).sort()).toEqual(counted.map((e) => e.id).sort())
    expect(r.verification.evidence.every((e) => e.version === 1)).toBe(true)
    expect(r.state.audit[0]).toMatchObject({ actorId: DIR, action: "Verified a student's record, version 1" })
    expect(verificationStatus(r.state, id)).toMatchObject({ status: "verified", changes: [], newer: 0 })
    expect(COUNTER_BY_ID.verified.value(r.state)).toBe(1)
    expect(s.verifications).toEqual([])
  })

  it("refuses to verify an unchanged, already verified record", () => {
    const s = createSeed()
    const id = cleanStudent(s)
    const v1 = must(verifyRecord(s, id, { note: "", confirmed: true }, DIR, AT)).state
    const again = verifyRecord(v1, id, { note: "", confirmed: true }, DIR, LATER)
    expect(again.ok).toBe(false)
    if (!again.ok) expect(again.error).toMatch(/Already verified as version 1\. Nothing has changed since/)
  })

  it("reopening a verified evaluation leaves version 1 as it was; the record reads changed; the next verification is version 2", () => {
    const s = createSeed()
    const id = cleanStudent(s)
    const v1 = must(verifyRecord(s, id, { note: "First pass.", confirmed: true }, DIR, AT)).state
    const frozen = structuredClone(v1.verifications)
    const ev = v1.evaluations.find((e) => e.studentId === id && e.status === "counted")!
    expect(verifiedAt(v1, ev)?.version).toBe(1)

    const reopened = must(reopenEvaluation(v1, { evaluationId: ev.id, outcome: ev.outcome === "met" ? "not-yet" : "met", feedback: null, reason: "Evaluator corrected the outcome." }, IDS.ross, LATER))
    expect(reopened.state.verifications).toEqual(frozen)
    const st = verificationStatus(reopened.state, id)
    expect(st.status).toBe("changed")
    expect(st.changes[0]).toMatch(/version 2 was added to an evaluation verified at version 1\. It is reopened and does not count until it is confirmed\./)
    // While it is reopened the record cannot be verified again.
    expect(verifyBlockers(reopened.state, id).join(" ")).toMatch(/reopened/)

    const confirmed = must(confirmVersion(reopened.state, ev.id, IDS.reviewer, LATER))
    const changed = verificationStatus(confirmed.state, id)
    expect(changed.status).toBe("changed")
    expect(changed.changes[0]).toMatch(/version 2 was added to an evaluation verified at version 1\.$/)
    expect(confirmed.state.verifications).toEqual(frozen)

    const v2 = must(verifyRecord(confirmed.state, id, { note: "After the correction.", confirmed: true }, DIR, "2026-10-23T09:00:00Z"))
    expect(v2.verification.version).toBe(2)
    expect(v2.state.verifications![0]).toEqual(frozen![0])
    expect(v2.state.verifications).toHaveLength(2)
    expect(latestVerification(v2.state, id)?.version).toBe(2)
    expect(verificationStatus(v2.state, id).status).toBe("verified")
    expect(v2.verification.evidence.find((e) => e.evaluationId === ev.id)?.version).toBe(2)
  })

  it("new evidence after a verification is counted but does not change the status", () => {
    const s = createSeed()
    const id = cleanStudent(s)
    const v1 = must(verifyRecord(s, id, { note: "", confirmed: true }, DIR, AT)).state
    const base = v1.evaluations.find((e) => e.studentId === id && e.status === "counted")!
    const added = { ...v1, evaluations: [...v1.evaluations, { ...base, id: "ev-t-new" }] }
    expect(verificationStatus(added, id)).toMatchObject({ status: "verified", newer: 1 })
    // A newer evaluation is a reason to verify again, not a block.
    expect(verifyBlockers(added, id)).toEqual([])
    expect(must(verifyRecord(added, id, { note: "", confirmed: true }, DIR, LATER)).verification.version).toBe(2)
  })

  it("keeps working on state saved before Stage 4 (no verifications array)", () => {
    const s = createSeed()
    delete (s as { verifications?: unknown }).verifications
    const id = cleanStudent(s)
    expect(verificationStatus(s, id).status).toBe("not-verified")
    expect(verificationRows(s).length).toBeGreaterThan(5)
    expect(must(verifyRecord(s, id, { note: "", confirmed: true }, DIR, AT)).state.verifications).toHaveLength(1)
  })
})

describe("gaps and report rows", () => {
  it("names the mandatory skills that are not achieved; they do not block", () => {
    const s = createSeed()
    const id = cleanStudent(s)
    const list = gaps(s, id)
    expect(list.length).toBe(mandatoryProgress(s, id).filter((m) => !m.achieved).length)
    expect(verifyBlockers(s, id)).toEqual([])
  })

  it("gives one report row per student with status, version, who and when", () => {
    const s = createSeed()
    const id = cleanStudent(s)
    const rows = verificationRows(s)
    expect(rows).toHaveLength(s.people.filter((p) => p.kind === "student").length)
    expect(rows.find((r) => r.studentId === id)).toMatchObject({ status: "not-verified", version: null, verifiedAt: null, verifiedBy: null })
    const v = must(verifyRecord(s, id, { note: "", confirmed: true }, DIR, AT)).state
    expect(verificationRows(v).find((r) => r.studentId === id)).toMatchObject({ status: "verified", version: 1, verifiedAt: AT, verifiedBy: "Dr. K. Brennan" })
    expect(verificationRows(v).find((r) => r.studentId === IDS.maya)).toMatchObject({ status: "not-verified" })
  })
})

describe("the saved store", () => {
  it("round trips a verification through the store envelope", () => {
    const m = new Map<string, string>()
    const storage = { length: 0, key: () => null, getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v), removeItem: (k: string) => void m.delete(k), clear: () => m.clear() } as Storage
    const store = createV2Store({ storage })
    const id = cleanStudent(store.getSnapshot())
    store.update((s) => must(verifyRecord(s, id, { note: "n", confirmed: true }, DIR, AT)).state)
    const again = createV2Store({ storage })
    again.hydrate()
    expect(again.getSnapshot().verifications).toHaveLength(1)
    expect(again.getSnapshot().verifications![0]).toMatchObject({ version: 1, note: "n" })
  })
})
