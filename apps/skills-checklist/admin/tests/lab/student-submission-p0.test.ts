/**
 * Student submission P0 gaps (req-coverage-lab.md section 2, P0 rows 1, 4, 5, 6 and 8): deactivated skills out of the pickers
 * [REQ SL-11], one student note carried to the evaluator in full [REQ ST-12, EV-04], lab or simulation routed to lab instructors
 * with no clinical setting [REQ ST-05, ST-08, ST-09, SC-12], mandatory details from the skill's configuration enforced before Send
 * [REQ SC-13, ST-10], and self-evaluation read from the configuration [REQ SC-15].
 */
import { describe, expect, it } from "vitest"
import { createSeed } from "@/lib/v2/seed"
import { IDS } from "@/lib/v2/seed-core"
import { openToLog } from "@/lib/v2/student"
import { DEFAULT_STUDENT, buildStudent } from "@/lib/lab/student"
import { DEFAULT_STUDENT_FIELDS, detailErrors, detailFieldId, detailFieldsFor, evaluatorsFor, extraDetails, pickRows, recordRows, selfEvalEnabled, whereChoices } from "@/lib/lab/student2"
import { loggedNotSent, saveLogged, sendNew, type LoggedInput } from "@/lib/lab/logged"
import { reviewDrafts } from "@/lib/lab/drafts-send"
import { DEFAULT_OPTIONS, buildRequest } from "@/lib/lab/evaluator"
import type { Submission, V2State } from "@/lib/v2/types"

const seed = createSeed()
const maya = buildStudent(seed, DEFAULT_STUDENT)!
const picks = pickRows(seed, maya)
const clinical = whereChoices(seed, DEFAULT_STUDENT).find((w) => w.setting === "clinical")!
const lab = whereChoices(seed, DEFAULT_STUDENT).find((w) => w.setting === "lab")!

const input = (skillIds: string[], w = clinical, extra: Partial<LoggedInput> = {}): LoggedInput => ({ skillIds, where: w.value, setting: w.setting, clinicalSetting: w.clinicalSetting, location: w.location ?? "Harbor General, 4 West", date: "2026-10-25", unit: "4 West", case: "", note: "", ratings: {}, ...extra })
const sub = (id: string, skillIds: string[], to: string, note = ""): Submission => ({ id, studentId: DEFAULT_STUDENT, skillIds, method: "link", status: "with-evaluator", assignedToId: to, createdAt: "2026-10-26T09:00:00.000Z", daysWaiting: 0, candidateIds: [to], ...(note ? { studentNote: note } : {}) })

/** A copy of the seed with one skill's configuration changed. */
const withConfig = (s: V2State, skillId: string, patch: Record<string, unknown>): V2State => ({ ...s, skills: s.skills.map((k) => (k.id === skillId && k.config ? { ...k, config: { ...k.config, ...patch } } : k)) })

describe("SL-11: a deactivated skill is not offered to students, its evidence stays on the record", () => {
  const inactive = seed.skills.filter((k) => k.active === false)
  it("the seed has deactivated skills that are otherwise configured and published", () => {
    expect(inactive.length).toBeGreaterThan(0)
    expect(inactive.every((k) => k.configured && k.published)).toBe(true)
  })
  it("openToLog refuses them and the Log and Send picker (pickRows) never lists them", () => {
    for (const k of inactive) expect(openToLog(k)).toBe(false)
    const ids = new Set(picks.map((p) => p.id))
    expect(inactive.filter((k) => ids.has(k.id))).toEqual([])
    // Every active, configured, published skill is still offered: nothing else is filtered by mistake.
    expect(picks.length).toBe(seed.skills.filter((k) => openToLog(k)).length)
  })
  it("evidence already recorded against a deactivated skill stays in the student's record", () => {
    const ids = new Set(inactive.map((k) => k.id))
    const own = seed.evaluations.filter((e) => e.studentId === DEFAULT_STUDENT && ids.has(e.skillId))
    expect(own.length).toBeGreaterThan(0)
    const rows = recordRows(seed, maya).filter((r) => ids.has(r.skillId))
    expect(rows.map((r) => r.evaluationId).sort()).toEqual(own.map((e) => e.id).sort())
  })
})

describe("ST-12 and EV-04: one note per request, shown to the evaluator in full", () => {
  it("a note typed on Send is stored on the request and opens on the evaluator form, uncut", () => {
    const note = `Performed on a patient with limited mobility; I asked for help repositioning. ${"Steps followed in order. ".repeat(14)}`.trim()
    expect(note.length).toBeGreaterThan(300)
    const s = sendNew(seed, input(picks.slice(0, 2).map((p) => p.id), clinical, { note }), DEFAULT_STUDENT, sub("req-lab-note", picks.slice(0, 2).map((p) => p.id), IDS.delgado, note))
    expect(s.submissions.find((x) => x.id === "req-lab-note")?.studentNote).toBe(note)
    const req = buildRequest(s, "request", "default", DEFAULT_OPTIONS, "req-lab-note")!
    expect(req.id).toBe("req-lab-note")
    expect(req.studentNote).toBe(note)
    // Kept apart from the evaluator's comment: the evaluator's feedback starts empty.
    expect(req.skills.every((k) => !k.prior)).toBe(true)
  })
  it("without a request id the seeded request still opens", () => {
    expect(buildRequest(seed, "request", "default")?.id).toBe("sub-maya-1")
  })
})

describe("ST-05, ST-08, ST-09: the setting decides who signs", () => {
  const ids = picks.slice(0, 2).map((p) => p.id)
  it("lab or simulation lists recorded lab instructors first and never a preceptor", () => {
    const options = evaluatorsFor(seed, ids, null, "lab")
    const kinds = options.map((o) => seed.people.find((p) => p.id === o.id)?.kind)
    expect(kinds).toContain("lab-instructor")
    expect(kinds).not.toContain("preceptor")
    expect(seed.people.find((p) => p.id === options[0].id)?.kind).toBe("lab-instructor")
  })
  it("clinical lists preceptors and never a lab instructor", () => {
    const kinds = evaluatorsFor(seed, ids, clinical.location, "clinical").map((o) => seed.people.find((p) => p.id === o.id)?.kind)
    expect(kinds).toContain("preceptor")
    expect(kinds).not.toContain("lab-instructor")
  })
  it("a lab request records the lab setting, no clinical setting, and opens for the lab instructor", () => {
    const s = sendNew(seed, input(ids, lab, { location: null, unit: "" }), DEFAULT_STUDENT, sub("req-lab-lab", ids, IDS.whitmore))
    const entries = s.logEntries.filter((e) => e.requestId === "req-lab-lab")
    expect(entries.length).toBe(2)
    expect(entries.every((e) => e.setting === "lab" && e.clinicalSetting === null)).toBe(true)
    const req = buildRequest(s, "request", "default", DEFAULT_OPTIONS, "req-lab-lab")!
    expect(req.evaluator.name).toBe(seed.people.find((p) => p.id === IDS.whitmore)!.name)
    expect(req.where?.setting).toBe("Lab")
    expect(req.performed).toBe("Oct 25")
  })
})

describe("SC-13, ST-10: the details each skill's configuration asks for, mandatory ones enforced", () => {
  const [a, b] = picks.map((p) => p.id)
  it("a skill with no configured fields asks for Date performed only (what Configure shows)", () => {
    expect(detailFieldsFor(seed, [a]).map((f) => [f.id, f.required])).toEqual([["date", true]])
    expect(detailFieldsFor(seed, []).map((f) => f.label)).toEqual(DEFAULT_STUDENT_FIELDS.map((f) => f.label))
  })
  it("configured fields are merged across the chosen skills; mandatory wins", () => {
    let s = withConfig(seed, a, { studentFields: [{ label: "Date performed", type: "date", mandatory: true }, { label: "Wound type", type: "choice", mandatory: true, choices: ["Surgical", "Pressure"] }, { label: "Unit", type: "short", mandatory: false }] })
    s = withConfig(s, b, { studentFields: [{ label: "Unit", type: "short", mandatory: true }, { label: "Wound type", type: "choice", mandatory: false, choices: ["Pressure", "Venous"] }] })
    const fields = detailFieldsFor(s, [a, b])
    expect(fields.map((f) => f.id)).toEqual(["date", detailFieldId("Wound type"), "unit"])
    expect(fields.every((f) => f.required)).toBe(true)
    expect(fields.find((f) => f.type === "choice")?.options).toEqual(["Surgical", "Pressure", "Venous"])
    expect(Object.keys(detailErrors({}, fields))).toEqual(["date", "f-wound-type", "unit"])
    expect(detailErrors({}, fields)["f-wound-type"]).toBe("Choose the wound type.")
    expect(detailErrors({ date: "2026-10-25", unit: "4 West", "f-wound-type": "Venous" }, fields)).toEqual({})
  })
  it("Send A, B and C read the configured fields and disable Send after a failed attempt", async () => {
    const { readFileSync } = await import("node:fs")
    const src = readFileSync("components/lab/student2/request-parts.tsx", "utf8")
    expect(src).toMatch(/detailFieldsFor\(s, skills\)/)
    expect(src).toMatch(/detailErrors\(details, fields\)/)
    expect(src).toMatch(/const blocked = tried && !valid/)
    for (const v of ["a", "b"]) expect(readFileSync(`components/lab/screens/student-request-${v}.tsx`, "utf8")).toMatch(/disabled=\{d\.blocked\}/)
    expect(readFileSync("components/lab/screens/student-request-c.tsx", "utf8")).toMatch(/d\.blocked \? \{ disabled: true/)
    expect(readFileSync("components/lab/screens/student-request-c.tsx", "utf8")).toMatch(/offered\.has\(r\.id\)/)
    for (const f of ["components/lab/screens/student-log-a.tsx", "components/lab/screens/student-log-b.tsx", "components/lab/student/fix.tsx"]) expect(readFileSync(f, "utf8")).toMatch(/detailFieldsFor\(/)
  })
  it("a draft keeps the extra details, and sending several drafts at once is blocked until they are filled", () => {
    const s = withConfig(seed, a, { studentFields: [{ label: "Date performed", type: "date", mandatory: true }, { label: "Wound type", type: "choice", mandatory: true, choices: ["Surgical"] }] })
    const empty = saveLogged(s, { ...input([a]), who: IDS.delgado }, DEFAULT_STUDENT, "2026-10-26T09:00:00.000Z")
    const blocked = reviewDrafts(empty.state, DEFAULT_STUDENT, [empty.batchId])
    expect(blocked.ready).toBe(false)
    expect(blocked.blocked[0].issues.find((i) => i.field === "details")?.message).toBe("Add the wound type in the draft first.")
    const filled = saveLogged(s, { ...input([a]), who: IDS.delgado, extra: extraDetails({ date: "2026-10-25", "f-wound-type": "Surgical" }) }, DEFAULT_STUDENT, "2026-10-26T09:00:00.000Z")
    expect(loggedNotSent(filled.state, DEFAULT_STUDENT)[0].extra).toEqual({ "f-wound-type": "Surgical" })
    expect(reviewDrafts(filled.state, DEFAULT_STUDENT, [filled.batchId]).blocked.flatMap((r) => r.issues).filter((i) => i.field === "details")).toEqual([])
  })
})

describe("SC-15: self-evaluation follows the stored switch", () => {
  it("the stored flag wins over the levels fallback, both ways", () => {
    const levels = seed.skills.find((k) => k.config && typeof k.config.selfEvaluation !== "boolean" && selfEvalEnabled(k))!
    expect(levels).toBeTruthy()
    expect(selfEvalEnabled(withConfig(seed, levels.id, { selfEvaluation: false }).skills.find((k) => k.id === levels.id))).toBe(false)
    const plain = seed.skills.find((k) => k.config && openToLog(k) && !selfEvalEnabled(k))!
    expect(selfEvalEnabled(withConfig(seed, plain.id, { selfEvaluation: true }).skills.find((k) => k.id === plain.id))).toBe(true)
  })
})
