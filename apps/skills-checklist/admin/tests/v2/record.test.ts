// @vitest-environment node
import { describe, expect, it } from "vitest"
import { reopenEvaluation } from "@/lib/v2/outcomes"
import { checkPdf, signPdf } from "@/lib/v2/pdf"
import { clrOf, pseudoUuid, recordContent, verifiedRecord } from "@/lib/v2/record"
import { createSeed, IDS } from "@/lib/v2/seed"
import { verifyBlockers, verifyRecord } from "@/lib/v2/verification"
import type { V2State } from "@/lib/v2/types"

const AT = "2026-10-20T10:00:00.000Z"
const LATER = "2026-10-22T10:00:00.000Z"

function must<T extends { ok: boolean }>(r: T): Extract<T, { ok: true }> {
  if (!r.ok) throw new Error(`expected ok, got ${JSON.stringify(r)}`)
  return r as Extract<T, { ok: true }>
}

/** Grace Tanaka has the urinary catheter skill achieved and nothing pending. */
const GRACE = "stu-11"

function verified(s: V2State = createSeed(), id = GRACE): V2State {
  expect(verifyBlockers(s, id)).toEqual([])
  return must(verifyRecord(s, id, { note: "", confirmed: true }, IDS.director, AT)).state
}

describe("when a record can be shared", () => {
  it("not before the program director verifies it", () => {
    const s = createSeed()
    const r = verifiedRecord(s, GRACE)
    expect(r).toMatchObject({ canShare: false, status: "not-verified", included: [] })
    expect(r.blocked).toMatch(/has not verified your record yet/)
    expect(recordContent(s, GRACE, AT)).toBeNull()
    expect(clrOf(s, GRACE, AT)).toBeNull()
  })

  it("not for someone who is not a student", () => {
    expect(verifiedRecord(createSeed(), IDS.delgado).blocked).toBe("That student is not in this course.")
  })

  it("after verification, with the achieved skill and its Met evaluations", () => {
    const s = verified()
    const r = verifiedRecord(s, GRACE)
    expect(r.canShare).toBe(true)
    expect(r.blocked).toBeNull()
    expect(r.verifiedBy).toBe("Dr. K. Brennan")
    // Included = achieved mandatory skills of the student's own cohort offerings this term (lib/v2/population.ts), so more than
    // the focus course's urinary catheter skill since 2026-10-26.
    expect(r.included.map((k) => k.skill.id)).toContain(IDS.urinaryCath)
    const cath = r.included.find((k) => k.skill.id === IDS.urinaryCath)!
    expect(cath.evaluations.every((e) => e.outcome === "met" && e.status === "counted")).toBe(true)
    expect(cath.evaluations).toHaveLength(3)
  })

  it("not once a verified evaluation is reopened, until the director verifies again", () => {
    const s0 = verified()
    const ev = s0.evaluations.find((e) => e.studentId === GRACE && e.skillId === IDS.urinaryCath && e.outcome === "met")!
    const re = must(reopenEvaluation(s0, { evaluationId: ev.id, outcome: "not-yet", feedback: null, reason: "Corrected." }, IDS.ross, LATER))
    const blocked = verifiedRecord(re.state, GRACE)
    expect(blocked.status).toBe("changed")
    expect(blocked.canShare).toBe(false)
    expect(blocked.blocked).toMatch(/cannot be shared until the program director verifies it again/)
  })
})

describe("what is left out, and why", () => {
  it("states each exclusion with a count and a reason", () => {
    const base = createSeed()
    const entry = { ...base.logEntries[0], id: "log-grace", studentId: GRACE, rating: "Works alone", note: "My own words" }
    const s = verified({ ...base, logEntries: [...base.logEntries, entry] })
    const r = verifiedRecord(s, GRACE)
    const keys = r.excluded.map((x) => x.key)
    expect(keys).toContain("skills-not-achieved")
    expect(keys).toContain("self")
    for (const x of r.excluded) {
      expect(x.count).toBeGreaterThan(0)
      expect(x.reason.length).toBeGreaterThan(10)
    }
  })

  it("leaves out an attempt that did not meet the criteria and a skill that is not achieved", () => {
    const s = verified(createSeed(), "stu-12")
    const r = verifiedRecord(s, "stu-12")
    const ids = r.included.flatMap((k) => k.evaluations.map((e) => e.id))
    const notMet = s.evaluations.filter((e) => e.studentId === "stu-12" && e.outcome !== "met" && e.status === "counted").map((e) => e.id)
    for (const id of notMet) expect(ids).not.toContain(id)
    const mine = (s.verifications ?? []).filter((v) => v.studentId === "stu-12").at(-1)!
    expect(r.included.every((k) => mine.skills.find((x) => x.skillId === k.skill.id)?.achieved)).toBe(true)
  })

  it("names evaluations counted after the verification without sharing them", () => {
    const s0 = verified()
    const extra = { ...s0.evaluations.find((e) => e.studentId === GRACE && e.outcome === "met" && e.skillId === IDS.urinaryCath)!, id: "ev-later", date: "2026-10-21T09:00:00Z" }
    const s = { ...s0, evaluations: [...s0.evaluations, extra] }
    const r = verifiedRecord(s, GRACE)
    expect(r.canShare).toBe(true)
    expect(r.excluded.find((x) => x.key === "after")).toMatchObject({ count: 1 })
    expect(r.included.flatMap((k) => k.evaluations.map((e) => e.id))).not.toContain("ev-later")
  })

  it("never mentions a confidential concern, even when one exists for the student", () => {
    let s = createSeed()
    s = { ...s, concerns: [...s.concerns, { id: "cn-9", evaluationId: "x", studentId: GRACE, raisedById: IDS.delgado, visibleTo: "faculty-only", note: "Faculty only: ZZ-SECRET-NOTE", at: AT }] }
    s = verified(s)
    const r = verifiedRecord(s, GRACE)
    const text = JSON.stringify(r.excluded) + JSON.stringify(recordContent(s, GRACE, AT)) + JSON.stringify(clrOf(s, GRACE, AT))
    expect(text).not.toMatch(/ZZ-SECRET-NOTE|concern|confidence|faculty-only/i)
  })
})

describe("the PDF", () => {
  it("is signed, checks as unchanged, and lists the verification and what was left out", async () => {
    const s = verified()
    const content = recordContent(s, GRACE, AT)!
    const signed = await signPdf(content)
    const check = await checkPdf(signed.bytes)
    expect(check.ok).toBe(true)
    const text = content.blocks.map((b) => b.s ?? "").join("\n")
    expect(text).toContain("Verified by Dr. K. Brennan on 2026-10-20, version 1")
    expect(text).toContain("Indwelling urinary catheter insertion")
    expect(text).toContain("Not included")
    expect(content.title).toBe("Verified skills record")
  })

  it("carries no self-rating, note or evaluator feedback text", () => {
    const s = verified(createSeed(), GRACE)
    const text = JSON.stringify(recordContent(s, GRACE, AT))
    expect(text).not.toMatch(/Needs coaching|With assistance/i)
    // Since the realistic-data pass (dataset spec section 13) Grace's evaluations carry evaluator comments: the record may say
    // that written feedback is withheld, but none of the comment text itself.
    const comments = s.evaluations.filter((e) => e.studentId === GRACE).map((e) => e.versions[e.versions.length - 1]?.detail?.feedback?.trim()).filter((x): x is string => !!x)
    expect(comments.length).toBeGreaterThan(0)
    for (const c of comments) expect(text).not.toContain(c)
    const notes = s.evaluations.filter((e) => e.studentId === GRACE && e.self?.note).map((e) => e.self!.note)
    for (const n of notes) expect(text).not.toContain(n)
  })
})

describe("the CLR 2.0 file", () => {
  it("has the 1EdTech context, types and one achievement credential per included skill", () => {
    const s = verified()
    type Loose = { [k: string]: Loose }
    const clr = clrOf(s, GRACE, AT)! as unknown as Loose
    expect(clr["@context"]).toEqual(["https://www.w3.org/ns/credentials/v2", "https://purl.imsglobal.org/spec/clr/v2p0/context-2.0.1.json"])
    expect(clr.type).toEqual(["VerifiableCredential", "ClrCredential"])
    expect(clr.issuer).toMatchObject({ type: ["Profile"], name: "Harbor University, BSN" })
    expect(clr.id).toMatch(/^urn:uuid:[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-8[0-9a-f]{3}-[0-9a-f]{12}$/)
    expect(clr.partial).toBe(true)
    const creds = clr.credentialSubject.verifiableCredential as unknown as Loose[]
    expect(creds).toHaveLength(verifiedRecord(s, GRACE).included.length)
    const cath = creds.find((c) => String(c.credentialSubject.achievement.name) === "Indwelling urinary catheter insertion")!
    expect(cath.type).toEqual(["VerifiableCredential", "AchievementCredential"])
    expect(cath.credentialSubject.achievement).toMatchObject({ type: ["Achievement"], achievementType: "Competency", name: "Indwelling urinary catheter insertion" })
    expect(cath.evidence).toHaveLength(3)
    expect(creds[0].evidence[0].description).toMatch(/Outcome: Met/)
  })

  it("is unsigned and says so, and is plain JSON that survives a round trip", () => {
    const clr = clrOf(verified(), GRACE, AT)!
    expect(clr).not.toHaveProperty("proof")
    expect(String(clr.description)).toMatch(/unsigned and carries no proof/)
    expect(JSON.parse(JSON.stringify(clr))).toEqual(clr)
  })

  it("is stable: the same record gives the same ids", () => {
    const s = verified()
    expect(JSON.stringify(clrOf(s, GRACE, AT))).toBe(JSON.stringify(clrOf(s, GRACE, AT)))
    expect(pseudoUuid("a")).not.toBe(pseudoUuid("b"))
  })
})
