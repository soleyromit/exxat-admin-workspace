import { describe, expect, it } from "vitest"
import * as S from "@/lib/store"
import { deepFreeze, must, seed } from "./helpers"

const draftOf = (db: ReturnType<typeof seed>, id: string) => S.draftOf(db.skills.find((s) => s.id === id)!)

describe("S-09 save is gated by the engine validators (SC-06, SC-18)", () => {
  it("saves a valid configuration and does not mutate inputs", () => {
    const db = deepFreeze(seed())
    const draft = deepFreeze(draftOf(db, "sk-foley"))
    const r = must(S.saveSkillConfig(db, "sk-foley", draft))
    expect(r.db.skills.find((s) => s.id === "sk-foley")).toBeTruthy()
  })

  it("saves a first configuration for an unconfigured skill (IM-09 then usable)", () => {
    const db = seed()
    const draft: S.SkillConfigDraft = {
      model: { kind: "binary", labels: { a: { id: "a", label: "Met" }, b: { id: "b", label: "Unmet" } }, qualifyingLabelId: "a" },
      criteria: { requiredCount: 2, levelMinimums: {}, settingMinimums: {} },
      requiresApproval: false,
      allowedRoles: ["preceptor"],
      submissionFields: [],
      evaluatorComment: "optional",
      selfEvaluation: false,
    }
    const r = must(S.saveSkillConfig(db, "sk-ng", draft))
    expect(S.unconfiguredCount(r.db)).toBe(1)
    expect(r.value.impact).toBeNull() // nothing configured before, nothing to preview
    expect(S.setSkillActive(r.db, "sk-ng", true).ok).toBe(true)
  })

  it("blocks an unsatisfiable configuration and reports every issue by path (SC-18)", () => {
    const db = seed()
    const bad: S.SkillConfigDraft = {
      ...draftOf(db, "sk-dressing"),
      model: { kind: "binary", labels: { a: { id: "a", label: "Met" }, b: { id: "b", label: "met " } }, qualifyingLabelId: "a" },
      criteria: { requiredCount: 0, levelMinimums: {}, settingMinimums: {} },
    }
    const r = S.saveSkillConfig(db, "sk-dressing", bad)
    expect(r).toMatchObject({ ok: false, error: { code: "invalid" } })
    if (!r.ok) {
      expect(r.error.fields).toMatchObject({ "model.labels": "binaryLabelsEqual", "criteria.requiredCount": "requiredCountInvalid" })
    }
  })

  it("BL-1: a lab-only role list cannot carry a clinical-setting minimum; the check uses the role map as DATA (OD-25)", () => {
    const db = seed()
    const d = { ...draftOf(db, "sk-wound"), allowedRoles: ["lab_instructor"] }
    const r = S.saveSkillConfig(db, "sk-wound", d)
    expect(r).toMatchObject({ ok: false })
    if (!r.ok) expect(r.error.issues?.find((i) => i.code === "clinicalMinimumNoClinicalRole")?.clinicalRoles).toEqual(["preceptor", "clinical_faculty"])
    // change the DATA: lab instructors may now sign clinical evidence, and the same draft saves
    const open = { ...db, roleEvidenceMap: { ...db.roleEvidenceMap, lab_instructor: { clinical: true, lab: true } } }
    expect(S.saveSkillConfig(open, "sk-wound", d).ok).toBe(true)
  })

  it("validates submission fields: label required and unique, choice needs options (SC-13)", () => {
    const db = seed()
    const d: S.SkillConfigDraft = {
      ...draftOf(db, "sk-foley"),
      submissionFields: [
        { id: "f1", label: "Unit", type: "shortText", required: true },
        { id: "f2", label: " unit ", type: "shortText", required: false },
        { id: "f3", label: "", type: "choice", required: false, options: [] },
      ],
    }
    const v = S.validateDraft(db, "sk-foley", d)
    expect(v.valid).toBe(false)
    expect(v.fieldErrors).toMatchObject({ "submissionFields.1.label": "labelDuplicate", "submissionFields.2.label": "labelEmpty", "submissionFields.2.options": "optionsEmpty" })
  })
})

describe("SC-09 model change rebuilds the criteria", () => {
  it("returns an empty model of the new kind and a report of what was dropped; held evidence is untouched", () => {
    const db = seed()
    const evBefore = JSON.stringify(db.evaluations)
    const { draft, dropped } = S.changeModelKind(db, "sk-iv", draftOf(db, "sk-iv"), "binary")
    expect(draft.model).toMatchObject({ kind: "binary", qualifyingLabelId: null })
    expect(draft.criteria.levelMinimums).toEqual({})
    expect(dropped.map((d) => d.field)).toEqual(expect.arrayContaining(["levels", "levelMinimums", "requiredCount"]))
    expect(S.validateDraft(db, "sk-iv", draft).valid).toBe(false) // cannot be saved until filled in
    expect(JSON.stringify(db.evaluations)).toBe(evBefore)
  })

  it("the preserve seam keeps the required count and setting minimums (docs 08 vs 09 disagreement stays open)", () => {
    const db = seed()
    const { draft } = S.changeModelKind(db, "sk-wound", draftOf(db, "sk-wound"), "binary", { preserve: { requiredCount: true, settingMinimums: true } })
    expect(draft.criteria.requiredCount).toBe(4)
    expect(draft.criteria.settingMinimums).toEqual({ "set-inpatient": 1, "set-emergency": 1 })
  })
})

describe("rule change re-applies to held evidence and previews its impact (AE-02, ENG-10)", () => {
  it("loosening a rule moves students between states and never rewrites responses", () => {
    const db = seed()
    const skill = db.skills.find((s) => s.id === "sk-foley")!
    const loose: S.SkillConfigDraft = { ...S.draftOf(skill), model: { ...(skill.model as { kind: "question"; questions: { id: string; text: string }[] }), rule: { kind: "atLeast", n: 1 } } }
    const impact = S.previewDraftImpact(db, "sk-foley", loose)!
    expect(impact.changed).toBeGreaterThan(0)
    const evBefore = JSON.stringify(db.evaluations)
    const saved = must(S.saveSkillConfig(db, "sk-foley", loose))
    expect(JSON.stringify(saved.db.evaluations)).toBe(evBefore)
    expect(saved.value.impact!.changed).toBe(impact.changed)
    // Priya's three failing Foley evaluations now qualify under "at least 1 yes"
    expect(S.skillProgress(saved.db, "stu-03", "sk-foley")!.evaluation.qualifyingCount).toBeGreaterThan(0)
  })

  it("renaming labels, questions or levels never changes whether evidence counts (AE-06)", () => {
    const db = seed()
    const before = S.reportByStudent(db, {}).rows.map((r) => r.counts)
    const skill = db.skills.find((s) => s.id === "sk-iv")!
    const m = skill.model as { kind: "demonstration"; levels: { id: string; label: string }[] }
    const renamed: S.SkillConfigDraft = { ...S.draftOf(skill), model: { ...m, levels: m.levels.map((l) => ({ ...l, label: l.label + " (renamed)" })) } }
    const after = S.reportByStudent(must(S.saveSkillConfig(db, "sk-iv", renamed)).db, {}).rows.map((r) => r.counts)
    expect(after).toEqual(before)
  })

  it("removing a level cascades into the minimums; evidence is retained but counts toward no level (AE-07)", () => {
    const db = seed()
    const skill = db.skills.find((s) => s.id === "sk-iv")!
    const m = skill.model as { kind: "demonstration"; levels: { id: string; label: string }[] }
    const draft: S.SkillConfigDraft = {
      ...S.draftOf(skill),
      model: { ...m, levels: m.levels.filter((l) => l.id !== "iv-l2") },
      criteria: { ...skill.criteria, levelMinimums: { "iv-l1": 1, "iv-l3": 3 } },
    }
    const r = must(S.saveSkillConfig(db, "sk-iv", draft))
    expect(r.db.skills.find((s) => s.id === "sk-iv")!.criteria.levelMinimums).not.toHaveProperty("iv-l2")
    expect(r.db.evaluations).toHaveLength(db.evaluations.length)
  })
})

describe("SC-01: settings for a skill that has no model yet (S-09 sections 5 to 7)", () => {
  const draft = (db: ReturnType<typeof seed>): S.SkillConfigDraft => ({ ...draftOf(db, "sk-ng"), evaluatorComment: "mandatory", selfEvaluation: true, requiresApproval: true, allowedRoles: ["preceptor"], submissionFields: [{ id: "f1", label: "Unit", type: "shortText", required: true }] })

  it("patches only the non-model fields and never makes the skill configured", () => {
    const db = seed()
    const r = must(S.patchUnconfiguredSkillSettings(db, "sk-ng", draft(db)))
    const sk = r.db.skills.find((x) => x.id === "sk-ng")!
    expect(sk).toMatchObject({ evaluatorComment: "mandatory", selfEvaluation: true, requiresApproval: true, allowedRoles: ["preceptor"], model: null })
    expect(sk.submissionFields).toHaveLength(1)
    expect(sk.criteria).toEqual(db.skills.find((x) => x.id === "sk-ng")!.criteria)
    expect(S.unconfiguredCount(r.db)).toBe(S.unconfiguredCount(db))
  })

  it("is refused for a configured skill and for an unknown skill, and does not mutate its input", () => {
    const db = deepFreeze(seed())
    expect(S.patchUnconfiguredSkillSettings(db, "sk-foley", draftOf(db, "sk-foley"))).toMatchObject({ ok: false, error: { code: "notEditable" } })
    expect(S.patchUnconfiguredSkillSettings(db, "nope", draft(db))).toMatchObject({ ok: false, error: { code: "notFound" } })
    must(S.patchUnconfiguredSkillSettings(db, "sk-ng", draft(db)))
  })
})

describe("IM-14: copy configuration into a draft (S-09 T23)", () => {
  const db0 = () => seed()
  const base = (db: ReturnType<typeof seed>, id: string) => S.draftOf(db.skills.find((s) => s.id === id)!)

  it("copies independent question and level ids and remaps a named-subset rule by index", () => {
    const db = db0()
    const c = S.copyConfigDraft(db, "sk-foley", "sk-ng", base(db, "sk-ng"))
    if (!c.ok) throw new Error(c.reason)
    expect(c.draft.model).toMatchObject({ kind: "question" })
    const m = c.draft.model as Extract<NonNullable<S.SkillConfigDraft["model"]>, { kind: "question" }>
    expect(m.questions.map((q) => q.id)).toEqual(["sk-ng-q1", "sk-ng-q2", "sk-ng-q3"])
    expect(m.questions.map((q) => q.text)).toEqual(["Performs appropriate preparation", "Performs the procedure correctly", "Maintains appropriate technique"])
    expect(m.rule).toEqual({ kind: "subset", questionIds: ["sk-ng-q2", "sk-ng-q3"] })
    expect(c.copied.questions).toBe(3)
    // independence: the source is untouched and shares no object with the copy
    expect(db.skills.find((s) => s.id === "sk-foley")!.model).not.toBe(m)
    const iv = S.copyConfigDraft(db, "sk-iv", "sk-ng", base(db, "sk-ng"))
    if (!iv.ok) throw new Error(iv.reason)
    const levels = (iv.draft.model as { levels: Array<{ id: string }> }).levels.map((l) => l.id)
    expect(levels.every((id) => id.startsWith("sk-ng-l"))).toBe(true)
    expect(Object.keys(iv.draft.criteria.levelMinimums).every((id) => levels.includes(id))).toBe(true)
  })

  it("copies only the chosen parts and drops setting minimums when the target keeps no model", () => {
    const db = db0()
    const onlyRoles = S.copyConfigDraft(db, "sk-iv", "sk-ng", base(db, "sk-ng"), ["allowedRoles", "settingMinimums"])
    if (!onlyRoles.ok) throw new Error(onlyRoles.reason)
    expect(onlyRoles.draft.model).toBeNull()
    expect(onlyRoles.draft.allowedRoles).toEqual(db.skills.find((s) => s.id === "sk-iv")!.allowedRoles)
    expect(onlyRoles.dropped).toEqual(["settingMinimums"])
  })

  it("an unconfigured or unknown source is refused", () => {
    const db = db0()
    expect(S.copyConfigDraft(db, "sk-ng", "sk-glucose", base(db, "sk-glucose"))).toEqual({ ok: false, reason: "sourceNotConfigured" })
    expect(S.copyConfigDraft(db, "nope", "sk-glucose", base(db, "sk-glucose"))).toEqual({ ok: false, reason: "sourceNotFound" })
  })
})

describe("IM-14: apply configuration to selected skills (S-04 T10)", () => {
  it("configures unconfigured targets, reports per target, and never mutates its input", () => {
    const db = deepFreeze(seed())
    const r = must(S.applyConfiguration(db, { sourceSkillId: "sk-dressing", targetSkillIds: ["sk-ng", "sk-glucose"] }))
    expect(r.value).toMatchObject({ sourceId: "sk-dressing", applied: 2, overwritten: 0, skipped: 0 })
    expect(r.value.results.map((x) => x.status)).toEqual(["applied", "applied"])
    expect(S.unconfiguredCount(r.db)).toBe(0)
    // each target carries its own copy and stays editable (T23)
    const ng = r.db.skills.find((s) => s.id === "sk-ng")!
    const gl = r.db.skills.find((s) => s.id === "sk-glucose")!
    expect(ng.model).not.toBe(gl.model)
    expect(S.saveSkillConfig(r.db, "sk-ng", S.draftOf(ng)).ok).toBe(true)
  })

  it("lists invalid targets and lets the others proceed (SC-18)", () => {
    const db = seed()
    // vitals needs a mandatory comment role set that the BL-1 rule can reject: give the source a clinical setting minimum
    // and the allowed roles of the target will be copied, so force an invalid result with an empty role set on the source.
    const src = { ...db.skills.find((s) => s.id === "sk-dressing")!, allowedRoles: [] as string[] }
    const broken = { ...db, skills: db.skills.map((s) => (s.id === "sk-dressing" ? src : s)) }
    const r = must(S.applyConfiguration(broken, { sourceSkillId: "sk-dressing", targetSkillIds: ["sk-ng", "sk-glucose"] }))
    expect(r.value.results.every((x) => x.status === "invalid")).toBe(true)
    expect(r.value.results[0].issues!.length).toBeGreaterThan(0)
    expect(r.value.applied).toBe(0)
    expect(S.unconfiguredCount(r.db)).toBe(S.unconfiguredCount(broken)) // targets left exactly as they were
  })

  it("a different model needs confirmation; with it, the model is rebuilt (SC-09)", () => {
    const db = seed()
    const dry = must(S.applyConfiguration(db, { sourceSkillId: "sk-foley", targetSkillIds: ["sk-recon"] }))
    expect(dry.value.results[0]).toMatchObject({ status: "needsModelConfirmation", overwrites: true })
    expect(dry.db.skills.find((s) => s.id === "sk-recon")!.model).toEqual(db.skills.find((s) => s.id === "sk-recon")!.model)
    const done = must(S.applyConfiguration(db, { sourceSkillId: "sk-foley", targetSkillIds: ["sk-recon"], confirmModelRebuild: true, confirmOverwriteWithEvidence: true }))
    expect(done.value).toMatchObject({ applied: 1, overwritten: 1 })
    expect(done.db.skills.find((s) => s.id === "sk-recon")!.model!.kind).toBe("question")
  })

  it("a target with recorded evidence is not overwritten without confirmation, and its evaluations are never touched (P-03, RV-03)", () => {
    const db = seed()
    const dry = must(S.applyConfiguration(db, { sourceSkillId: "sk-recon", targetSkillIds: ["sk-dressing"] }))
    expect(dry.value.results[0]).toMatchObject({ status: "needsEvidenceConfirmation", hasEvidence: true })
    const done = must(S.applyConfiguration(db, { sourceSkillId: "sk-recon", targetSkillIds: ["sk-dressing"], confirmOverwriteWithEvidence: true }))
    expect(JSON.stringify(done.db.evaluations)).toBe(JSON.stringify(db.evaluations))
    expect(done.value.applied).toBe(1)
  })

  it("is a no-op for the same skill, an unknown id and an identical configuration, and the plan helper never commits", () => {
    const db = seed()
    const r = must(S.applyConfiguration(db, { sourceSkillId: "sk-dressing", targetSkillIds: ["sk-dressing", "nope"] }))
    expect(r.value.results.map((x) => x.status)).toEqual(["sameSkill", "notFound"])
    expect(r.db).toBe(db)
    const plan = S.planApplyConfiguration(db, { sourceSkillId: "sk-dressing", targetSkillIds: ["sk-ng"] })
    expect(plan!.applied).toBe(1)
    expect(S.unconfiguredCount(db)).toBe(2)
  })

  it("an unconfigured source is refused", () => {
    expect(S.applyConfiguration(seed(), { sourceSkillId: "sk-ng", targetSkillIds: ["sk-glucose"] })).toMatchObject({ ok: false, error: { code: "skillNotUsable" } })
  })
})
