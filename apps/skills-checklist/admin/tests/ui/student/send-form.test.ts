import { describe, expect, it } from "vitest"
import { buildSeed } from "@/lib/seed"
import { SCENARIO } from "@/lib/seed"
import { initialForm, optionsFor, reduce, validate, formFromSubmission, settingKey } from "@/components/student/send-form"

const db = buildSeed()
const OFF = "off-350-f26"

describe("send form reducer (S-13)", () => {
  it("DEFECT-01: switching Clinical to Lab clears the evaluator, so a preceptor can never be sent as another role", () => {
    let s = initialForm(["sk-foley"])
    s = reduce(s, { type: "role", roleId: "preceptor" })
    s = reduce(s, { type: "person", personId: "ev-whitfield" })
    expect(s.personId).toBe("ev-whitfield")
    s = reduce(s, { type: "performedIn", value: "lab" })
    expect(s.performedIn).toBe("lab")
    expect(s.personId).toBe("")
    expect(s.roleId).toBe("")
    expect(s.settingKey).toBe("")
  })

  it("changing the role or the setting also clears the person; entered details are kept", () => {
    let s = initialForm(["sk-foley"])
    s = reduce(s, { type: "value", skillId: "sk-foley", fieldId: "sk-foley-f-date", value: "2026-09-01" })
    s = reduce(s, { type: "note", skillId: "sk-foley", value: "note" })
    s = reduce(s, { type: "role", roleId: "preceptor" })
    s = reduce(s, { type: "person", personId: "ev-whitfield" })
    s = reduce(s, { type: "role", roleId: "clinical_faculty" })
    expect(s.personId).toBe("")
    s = reduce(s, { type: "person", personId: "ev-x" })
    s = reduce(s, { type: "setting", key: settingKey("set-outpatient", "loc-harbor") })
    expect(s.personId).toBe("")
    expect(s.drafts["sk-foley"].values["sk-foley-f-date"]).toBe("2026-09-01")
    expect(s.drafts["sk-foley"].note).toBe("note")
  })

  it("naming a lab instructor not on the roster replaces the chosen person (ST-09)", () => {
    let s = initialForm(["sk-o2"])
    s = reduce(s, { type: "performedIn", value: "lab" })
    s = reduce(s, { type: "role", roleId: "lab_instructor" })
    s = reduce(s, { type: "person", personId: "lab-ferreira" })
    s = reduce(s, { type: "namedOpen", open: true })
    expect(s.personId).toBe("")
    expect(s.namedOpen).toBe(true)
  })
})

describe("send form validation (ST-08, ST-10, ST-11): Send is disabled only with a stated reason", () => {
  it("ST-08: a lab-instructor-only skill cannot be sent as clinical evidence and the block is explained, never a dead end", () => {
    const s = initialForm(["sk-o2"])
    const opts = optionsFor(db, SCENARIO.olivia, OFF, s)
    expect(opts.blocked?.code).toBe("noValidRole")
    expect(opts.blocked?.switchTo).toBe("lab")
    expect(validate(db, opts, s)).toMatchObject({ reason: "blocked", canSend: false })
  })

  it("ST-08 batch: in a lab, two skills with no common role offer to send separately (each is fine alone)", () => {
    const s = reduce(initialForm(["sk-o2", "sk-wound"]), { type: "performedIn", value: "lab" })
    const opts = optionsFor(db, SCENARIO.olivia, OFF, s)
    expect(opts.blocked).toMatchObject({ code: "noValidRole", separately: true })
    // as clinical evidence the lab-only skill cannot be sent at all, so splitting would not help
    const clinical = optionsFor(db, SCENARIO.olivia, OFF, initialForm(["sk-o2", "sk-wound"]))
    expect(clinical.blocked?.separately).toBe(false)
  })

  it("ST-06: two placements means a choice is required; the reason says so until it is made", () => {
    let s = initialForm(["sk-foley"])
    const opts = optionsFor(db, SCENARIO.olivia, OFF, s)
    expect(opts.settingMode).toBe("choose")
    expect(validate(db, opts, s).reason).toBe("setting")
    s = reduce(s, { type: "setting", key: settingKey("set-outpatient", "loc-harbor") })
    expect(validate(db, opts, s).reason).toBe("person")
  })

  it("ST-07: a student with no placement chooses from the program's full setting list", () => {
    const s = initialForm(["sk-foley"])
    const opts = optionsFor(db, SCENARIO.elena, OFF, s)
    expect(opts.settingMode).toBe("full")
    expect(opts.settings.length).toBe(db.clinicalSettings.filter((x) => x.active).length)
  })

  it("ST-10, SC-13: a missing required field blocks Send and is counted in the reason", () => {
    let s = initialForm(["sk-foley"])
    s = reduce(s, { type: "setting", key: settingKey("set-outpatient", "loc-harbor") })
    s = reduce(s, { type: "role", roleId: "preceptor" })
    s = reduce(s, { type: "person", personId: "ev-whitfield" })
    const opts = optionsFor(db, SCENARIO.olivia, OFF, s)
    const v = validate(db, opts, s)
    expect(v.reason).toBe("fields")
    expect(v.requiredMissing).toBe(1)
    expect(v.skills["sk-foley"].complete).toBe(false)
    s = reduce(s, { type: "value", skillId: "sk-foley", fieldId: "sk-foley-f-date", value: "2026-09-01" })
    expect(validate(db, opts, s).canSend).toBe(true)
  })

  it("ST-11, SC-15: a skill configured for self-evaluation keeps Send disabled until it is complete, BEFORE sending (DEC-001)", () => {
    let s = initialForm(["sk-iv"])
    s = reduce(s, { type: "setting", key: settingKey("set-outpatient", "loc-harbor") })
    s = reduce(s, { type: "role", roleId: "preceptor" })
    s = reduce(s, { type: "person", personId: "ev-whitfield" })
    s = reduce(s, { type: "value", skillId: "sk-iv", fieldId: "sk-iv-f-date", value: "2026-09-01" })
    s = reduce(s, { type: "value", skillId: "sk-iv", fieldId: "sk-iv-f-unit", value: "3 West" })
    const opts = optionsFor(db, SCENARIO.olivia, OFF, s)
    expect(validate(db, opts, s)).toMatchObject({ reason: "selfEval", canSend: false })
    s = reduce(s, { type: "selfEval", skillId: "sk-iv", value: { kind: "demonstration", levelId: "iv-l3" } })
    expect(validate(db, opts, s).canSend).toBe(true)
  })

  it("ST-09: a named lab instructor needs a name and a valid email", () => {
    let s = initialForm(["sk-o2"])
    s = reduce(s, { type: "performedIn", value: "lab" })
    s = reduce(s, { type: "role", roleId: "lab_instructor" })
    s = reduce(s, { type: "namedOpen", open: true })
    s = reduce(s, { type: "value", skillId: "sk-o2", fieldId: "sk-o2-f-date", value: "2026-09-01" })
    const opts = optionsFor(db, SCENARIO.olivia, OFF, s)
    expect(validate(db, opts, s).namedInvalid).toEqual({ name: true, email: true })
    s = reduce(s, { type: "named", field: "name", value: "R. Whitmore" })
    s = reduce(s, { type: "named", field: "email", value: "not-an-email" })
    expect(validate(db, opts, s).namedInvalid.email).toBe(true)
    s = reduce(s, { type: "named", field: "email", value: "r.whitmore@example.edu" })
    expect(validate(db, opts, s).canSend).toBe(true)
  })

  it("RV-01, RV-03: revise prefills the answers; a further attempt copies the context but not the answers", () => {
    const returned = db.submissions.find((x) => x.studentId === SCENARIO.olivia && x.skillId === "sk-iv" && x.attempt === 5)!
    const revise = formFromSubmission(returned, db, "revise")
    expect(revise.drafts["sk-iv"].values).toEqual(returned.values)
    expect(revise.roleId).toBe(returned.evaluator.roleId)
    expect(revise.personId).toBe(returned.evaluator.personId)
    const further = formFromSubmission(returned, db, "further")
    expect(further.drafts["sk-iv"].values).toEqual({})
    expect(further.roleId).toBe(returned.evaluator.roleId)
  })
})
