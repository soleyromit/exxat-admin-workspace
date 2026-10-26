import { describe, expect, it } from "vitest"
import { createSeed } from "@/lib/v2/seed"
import { skillById } from "@/lib/v2/evidence-index"
import { buildStudent } from "@/lib/lab/student"
import {
  PROGRAM_DETAILS,
  clrDocument,
  conflictChoices,
  detailErrors,
  evaluatorsFor,
  filterRecord,
  groupBySkill,
  needsApproval,
  newEvaluatorErrors,
  nextSentence,
  pickRows,
  pickerGroups,
  recordAttemptLine,
  recordCounts,
  recordRows,
  selfEvalEnabled,
  shareModel,
  student2Href,
  syncRows,
  whereChoices,
  EMPTY_RECORD_FILTER,
} from "@/lib/lab/student2"

const seed = createSeed()
const maya = buildStudent(seed)!

describe("Log a skill (Maya, 123 students, 150+ skills)", () => {
  const rows = pickRows(seed, maya)

  it("offers every configured skill in the library, not one specialty [REQ ST-02; AUDIT T2 picker defect]", () => {
    expect(rows.length).toBeGreaterThanOrEqual(140)
    expect(new Set(rows.map((r) => r.section)).size).toBeGreaterThan(20)
    for (const r of rows) expect(skillById(seed, r.id)?.configured).toBe(true)
  })

  it("puts likely-here skills first and never hides the rest [CALL soft mapping; REQ CM-05]", () => {
    const groups = pickerGroups(rows)
    expect(groups[0].key).toBe("likely")
    expect(groups[0].rows.length).toBeGreaterThan(0)
    expect(groups.reduce((n, g) => n + g.rows.length, 0)).toBe(rows.length)
    const hit = pickerGroups(rows, "catheter").flatMap((g) => g.rows)
    expect(hit.length).toBeGreaterThan(0)
    for (const r of hit) expect(`${r.name} ${r.section}`.toLowerCase()).toContain("cath")
  })

  it("enforces the program's mandatory details before saving [REQ SC-13, ST-10]", () => {
    expect(PROGRAM_DETAILS.filter((f) => f.required).map((f) => f.id)).toEqual(["date", "unit"])
    expect(Object.keys(detailErrors({ date: "", unit: "", case: "" }))).toEqual(["date", "unit"])
    expect(detailErrors({ date: "2026-10-26", unit: "4 West", case: "" })).toEqual({})
    expect(detailErrors({ date: "2027-01-01", unit: "4 West" }).date).toMatch(/future/)
  })

  it("asks a self-evaluation only where the skill has it switched on [REQ SC-15, ST-11]", () => {
    const on = rows.filter((r) => r.selfEval)
    const off = rows.filter((r) => !r.selfEval)
    expect(on.length).toBeGreaterThan(0)
    expect(off.length).toBeGreaterThan(0)
    expect(selfEvalEnabled(undefined)).toBe(false)
  })

  it("derives where from the placement, one choice per place, lab and simulation as practice [REQ ST-05, ST-06]", () => {
    const w = whereChoices(seed, maya.student.id)
    const keys = w.map((x) => `${x.setting}|${x.location ?? x.label}`)
    expect(new Set(keys).size).toBe(keys.length)
    expect(w.filter((x) => x.setting === "clinical").map((x) => x.label)).toContain("Harbor General, 4 West")
    expect(w.some((x) => x.setting === "lab")).toBe(true)
  })
})

describe("Send for evaluation", () => {
  const skills = pickRows(seed, maya).filter((r) => r.likely).slice(0, 2).map((r) => r.id)

  it("lists evaluators at the placement first and never a lab instructor for clinical work [REQ ST-08]", () => {
    const opts = evaluatorsFor(seed, skills, "Harbor General, 4 West")
    expect(opts.length).toBeGreaterThan(0)
    expect(opts[0].here).toBe(true)
    expect(opts.some((o) => o.role.toLowerCase().includes("lab instructor"))).toBe(false)
    for (const o of opts.filter((x) => !x.eligible)) expect(o.reason).toBeTruthy()
  })

  it("lets a student name someone not on record with name and email [REQ ST-09]", () => {
    expect(newEvaluatorErrors({ name: "", email: "x" })).toEqual({ name: expect.any(String), email: expect.any(String) })
    expect(newEvaluatorErrors({ name: "Rosa Diaz", email: "rosa@hospital.org" })).toEqual({})
  })

  it("says once what happens next, naming approval and offline [REQ ST-13, EV-07]", () => {
    expect(nextSentence({ method: "link", who: "J. Delgado, RN", approval: false, offline: false, newName: false })).toMatch(/one email with a link to this request only/)
    expect(nextSentence({ method: "qr", who: "J. Delgado, RN", approval: true, offline: false, newName: false })).toMatch(/after a reviewer approves/)
    expect(nextSentence({ method: "link", who: "J. Delgado, RN", approval: false, offline: true, newName: false })).toMatch(/^Kept on this device/)
    expect(nextSentence({ method: "photo", who: "x", approval: false, offline: false, newName: false })).toMatch(/review/)
    expect(typeof needsApproval(seed, skills)).toBe("boolean")
  })
})

describe("Record", () => {
  const rows = recordRows(seed, maya)

  it("lists every evaluation with an explicit result and a reason [REQ SH-01..SH-03]", () => {
    expect(rows.length).toBeGreaterThanOrEqual(50)
    for (const r of rows) expect(r.why.length).toBeGreaterThan(5)
    const notCounted = rows.filter((r) => r.result === "not-counted")
    expect(notCounted.length).toBeGreaterThan(0)
    for (const r of notCounted.filter((x) => x.skillState !== "achieved")) expect(r.why).toMatch(/Needs \d+/)
  })

  it("counts and filters consistently, did-not-count groups first [REQ SH-04, SH-06]", () => {
    const c = recordCounts(rows)
    expect(c.counted + c["not-counted"] + c.waiting + c.returned).toBe(rows.length)
    expect(filterRecord(rows, { ...EMPTY_RECORD_FILTER, result: "counted" })).toHaveLength(c.counted)
    const groups = groupBySkill(rows)
    expect(groups[0].notCounted).toBeGreaterThan(0)
  })

  it("each skill reads 'n attempts, m count' over its whole record (Oct 26 call)", () => {
    expect(recordAttemptLine([{ result: "counted" }, { result: "not-counted" }, { result: "counted" }, { result: "not-counted" }, { result: "counted" }])).toBe("5 attempts, 3 count")
    expect(recordAttemptLine([{ result: "waiting" }])).toBe("")
    const g = groupBySkill(rows).find((x) => x.notCounted > 0)!
    expect(recordAttemptLine(g.rows)).toBe(`${g.counted + g.notCounted} attempts, ${g.counted} ${g.counted === 1 ? "counts" : "count"}`)
  })
})

describe("Share record", () => {
  it("shows Maya's preview but keeps sharing closed until verified, with the reason", () => {
    const m = shareModel(seed, maya)
    expect(m.status).toBe("not-verified")
    expect(m.blocked).toMatch(/director verifies/)
    expect(m.skills.length).toBeGreaterThan(10)
    for (const k of m.skills) expect(k.attestations.length).toBeGreaterThan(0)
    expect(m.gaps.length).toBe(maya.counts.required - maya.counts.achieved)
  })

  it("opens in the verified demo and builds a CLR 2.0 shaped file", () => {
    const m = shareModel(seed, maya, true)
    expect(m.blocked).toBeNull()
    const clr = clrDocument(maya.student, m) as { type: string[]; credentialSubject: { verifiableCredential: unknown[] } }
    expect(clr.type).toContain("ClrCredential")
    expect(clr.credentialSubject.verifiableCredential).toHaveLength(m.skills.length)
  })
})

describe("Offline and sync", () => {
  it("shows every change as queued, synced or conflict, conflict first, and reshapes for demo states", () => {
    const rows = syncRows(seed, maya.student.id, null)
    expect(rows[0].state).toBe("conflict")
    expect(syncRows(seed, maya.student.id, "synced").every((r) => r.state === "synced")).toBe(true)
    expect(syncRows(seed, maya.student.id, "queued").some((r) => r.state === "synced")).toBe(false)
  })

  it("offers Keep both only for a note, never for a rating", () => {
    const note = conflictChoices({ field: "note", mine: "a", theirs: "b", theirsAt: "", theirsBy: "Your other device" })
    const rating = conflictChoices({ field: "rating", mine: "a", theirs: "b", theirsAt: "", theirsBy: "Your other device" })
    expect(note.map((c) => c.id)).toEqual(["mine", "theirs", "both"])
    expect(rating.map((c) => c.id)).toEqual(["mine", "theirs"])
  })

  it("builds links with one helper", () => {
    expect(student2Href("request-signoff", { skills: "a,b" })).toBe("/lab/student/request-signoff?skills=a%2Cb")
    expect(student2Href("record", {}, "stu-02")).toBe("/lab/student/record?student=stu-02")
  })
})
