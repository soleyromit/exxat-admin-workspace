import { describe, expect, it } from "vitest"
import { createSeed } from "@/lib/v2/seed"
import { skillById } from "@/lib/v2/evidence-index"
import { buildStudent } from "@/lib/lab/student"
import {
  DEFAULT_METHOD,
  METHODS,
  PROGRAM_DETAILS,
  clrDocument,
  countsWhen,
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

  it("says once what happens next, naming offline; when it counts is per skill, not a generic sentence [REQ ST-13, EV-07]", () => {
    expect(nextSentence({ method: "link", who: "J. Delgado, RN", approval: false, offline: false, newName: false })).toMatch(/one email with a link to this request only/)
    expect(nextSentence({ method: "qr", who: "J. Delgado, RN", approval: true, offline: false, newName: false })).not.toMatch(/answer Met/)
    expect(nextSentence({ method: "link", who: "J. Delgado, RN", approval: false, offline: true, newName: false })).toMatch(/^Kept on this device/)
    expect(nextSentence({ method: "photo", who: "x", approval: false, offline: false, newName: false })).toMatch(/review/)
    expect(typeof needsApproval(seed, skills)).toBe("boolean")
  })

  it("states the skill's real rule: 3 Met evaluations needed is never 'it counts when they answer Met' [REQ AE-02, SH-03]", () => {
    const parts = (have: number, need: number) => [{ label: "Evaluations", have, need, met: have >= need }]
    expect(countsWhen({ counted: 1, need: 3, achieved: false, parts: parts(1, 3) }, false)).toBe("Met adds 1 of the 3 Met evaluations needed (1 so far).")
    expect(countsWhen({ counted: 0, need: 1, achieved: false, parts: parts(0, 1) }, true)).toBe("Met achieves it, after a reviewer approves it.")
    const distinct = [...parts(1, 2), { label: "Different evaluators", have: 1, need: 2, met: false }]
    expect(countsWhen({ counted: 1, need: 2, achieved: false, parts: distinct }, false)).toMatch(/also needs from 2 different evaluators/)
    expect(countsWhen({ counted: 3, need: 3, achieved: true, parts: parts(3, 3) }, false)).toMatch(/^Already achieved/)
    // Maya's Sterile dressing change needs 3 Met evaluations: the confirmation says so from her own record.
    const r = maya.all.find((x) => x.id === "sk-sterile-dressing")!
    expect(r.need).toBe(3)
    expect(countsWhen({ counted: r.counted, need: r.need, achieved: r.state === "achieved", parts: r.parts }, false)).toMatch(/of the 3 Met evaluations needed/)
  })

  it("starts on Email a link, one link per request [LEDGER D-L2]; QR, hand over and photo stay choices [D-X5]", () => {
    expect(DEFAULT_METHOD).toBe("link")
    expect(METHODS[0].id).toBe("link")
    expect(METHODS.map((m) => m.id).sort()).toEqual(["handover", "link", "photo", "qr"])
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
    expect(c.counted + c["not-counted"] + c.requested + c.waiting + c.returned + c.sent).toBe(rows.length)
    expect(filterRecord(rows, { ...EMPTY_RECORD_FILTER, result: "counted" })).toHaveLength(c.counted)
    const groups = groupBySkill(rows)
    expect(groups[0].notCounted).toBeGreaterThan(0)
  })

  it("each skill reads 'n attempts, m count' over its whole record, from the engine, agreeing with the rows (Oct 26 call)", () => {
    for (const g of groupBySkill(rows)) {
      const line = recordAttemptLine(seed, maya.student.id, g.skillId)
      const total = g.counted + g.notCounted
      if (total === 0) expect(line).toBe("")
      else expect(line).toMatch(new RegExp(`^${total} attempts?, .*${g.counted} counts?$`))
    }
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
