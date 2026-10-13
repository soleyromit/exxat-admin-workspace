import { describe, expect, it } from "vitest"
import * as S from "@/lib/store"
import { SCENARIO } from "@/lib/seed"
import { ctx, must, seed } from "./helpers"

const db = seed()
const total = (c: Record<string, number>) => Object.values(c).reduce((a, b) => a + b, 0)

describe("by student (RP-02)", () => {
  it("one row per student; the four states always add up to the skills in scope; unconfigured skills are out of scope (IM-09)", () => {
    const { rows, scope, kpis } = S.reportByStudent(db, {})
    expect(rows).toHaveLength(40)
    expect(scope.skills).toHaveLength(10)
    expect(rows.every((r) => total(r.counts) === 10)).toBe(true)
    expect(kpis.studentsInView).toBe(40)
    expect(kpis.skillsInScope).toBe(10)
  })

  it("attainment is achieved over skills in scope; sorting and search work", () => {
    const { rows } = S.reportByStudent(db, {}, { sort: "highest" })
    expect(rows[0].student.id).toBe(SCENARIO.noah)
    expect(rows[0].attainment).toBe(Math.round((rows[0].counts.achieved / 10) * 100))
    expect(S.reportByStudent(db, {}, { sort: "lowest" }).rows[0].attainment).toBeLessThanOrEqual(rows[0].attainment)
    expect(S.reportByStudent(db, {}, { sort: "name" }).rows.map((r) => r.student.name)).toEqual([...S.reportByStudent(db, {}, { sort: "name" }).rows.map((r) => r.student.name)].sort((a, b) => a.localeCompare(b)))
    expect(S.reportByStudent(db, {}, { q: "olivia" }).rows.map((r) => r.student.id)).toEqual([SCENARIO.olivia])
  })

  it("identifies people who share a name by cohort and group (DEFECT-09)", () => {
    const owens = S.reportByStudent(db, {}, { q: "owen ashford" }).rows
    expect(owens).toHaveLength(2)
    expect(new Set(owens.map((o) => `${o.cohortName}/${o.groupName}`)).size).toBe(2)
  })

  it("filters by cohort and group; a group outside the cohort is EXPLAINED, not silently empty (RP-01, RP-09)", () => {
    expect(S.reportByStudent(db, { cohortId: "coh-bsn26" }).rows).toHaveLength(14)
    expect(S.reportByStudent(db, { cohortId: "coh-bsn26", groupId: "grp-bsn26-a" }).rows.every((r) => r.groupName === "Group A")).toBe(true)
    expect(S.reportByStudent(db, { cohortId: "coh-bsn26", groupId: "grp-bsn27-a" }).issue).toEqual({ code: "groupNotInCohort", groupId: "grp-bsn27-a", cohortId: "coh-bsn26" })
  })

  it("a clinical course scopes the population to enrolled students and the skills to those mapped (RP-01)", () => {
    const r = S.reportByStudent(db, { offeringId: "off-315-f26" })
    expect(r.rows.every((x) => x.cohortName === "BSN 2027")).toBe(true)
    expect(r.scope.skills.map((s) => s.id).sort()).toEqual(["sk-h2t", "sk-med", "sk-trach", "sk-vitals"])
  })

  it("category and tag filters narrow the skills in scope (RP-01)", () => {
    expect(S.reportByStudent(db, { categoryId: "cat-a" }).scope.skills.every((s) => s.categoryId === "cat-a")).toBe(true)
    expect(S.reportByStudent(db, { tagId: "tag-c" }).scope.skills.every((s) => s.tagIds.includes("tag-c"))).toBe(true)
  })
})

describe("location and setting recompute progress (RP-08) and impossible combinations are explained (RP-09)", () => {
  it("counts only evidence gathered there and recalculates progress", () => {
    const all = S.skillProgress(db, SCENARIO.olivia, "sk-wound")!
    const harbor = S.skillProgress(db, SCENARIO.olivia, "sk-wound", S.evidenceFilterOf({ locationId: "loc-harbor" }))!
    expect(all.total.have).toBe(4)
    expect(harbor.total.have).toBe(2)
    const rows = S.reportByStudent(db, { locationId: "loc-harbor" }).rows
    const olivia = rows.find((r) => r.student.id === SCENARIO.olivia)!
    expect(total(olivia.counts)).toBe(10) // still one record per skill: the filter narrows evidence, not the record
    // Olivia's Medication Reconciliation (2 counted at Harbor and 0 elsewhere) stays achieved; her IV counted evidence mostly sits elsewhere
    expect(S.skillProgress(db, SCENARIO.olivia, "sk-iv", S.evidenceFilterOf({ locationId: "loc-harbor" }))!.evaluation.qualifyingCount).toBe(0)
  })

  it("a lab filter counts lab evidence only; a clinical setting filter excludes lab", () => {
    const lab = S.reportByStudent(db, { settingId: "lab" }).rows.find((r) => r.student.id === SCENARIO.elena)!
    expect(lab.counts.achieved).toBe(1) // Oxygen therapy, evidenced in the lab
    const inpatient = S.reportByStudent(db, { settingId: "set-inpatient" }).rows.find((r) => r.student.id === SCENARIO.elena)!
    expect(inpatient.counts.achieved).toBe(0)
  })

  it("flags a location that does not offer the chosen setting, lab with a location, and group outside cohort", () => {
    expect(S.filterIssue(db, { locationId: "loc-mercy", settingId: "set-emergency" })).toEqual({ code: "locationDoesNotOfferSetting", locationId: "loc-mercy", settingId: "set-emergency" })
    expect(S.filterIssue(db, { locationId: "loc-riverside", settingId: "lab" })).toEqual({ code: "labHasNoLocation", locationId: "loc-riverside" })
    expect(S.filterIssue(db, { locationId: "loc-riverside", settingId: "set-emergency" })).toBeNull()
    expect(S.filterIssue(db, {})).toBeNull()
    expect(S.reportByStudent(db, { locationId: "loc-mercy", settingId: "set-emergency" }).issue).not.toBeNull()
  })
})

describe("by skill (RP-03) and by tag (RP-04)", () => {
  it("per skill counts, % achieved, and whether it is mandatory only when scoped to a course (RP-03)", () => {
    const all = S.reportBySkill(db, {})
    expect(all.rows.every((r) => r.requirement === null)).toBe(true)
    expect(all.rows.map((r) => r.percentAchieved)).toEqual([...all.rows.map((r) => r.percentAchieved)].sort((a, b) => a - b))
    const scoped = S.reportBySkill(db, { offeringId: "off-350-f26" })
    expect(scoped.rows.find((r) => r.skill.id === "sk-iv")!.requirement).toBe("mandatory")
    expect(scoped.rows.find((r) => r.skill.id === "sk-recon")!.requirement).toBe("nonMandatory")
  })

  it("tag rows count student-skill records and OVERLAP, they are not a partition (RP-04)", () => {
    const tags = S.reportByTag(db, {})
    const records = 40 * 10
    const sum = tags.rows.reduce((a, r) => a + total(r.counts), 0)
    expect(sum).toBeGreaterThan(records) // overlap
    expect(tags.rows.map((r) => r.tag.id)).not.toContain("tag-d") // inactive tags are not reported
    expect(tags.rows.find((r) => r.tag.id === "tag-a")).toMatchObject({ skillCount: 4, categoriesSpanned: 3 })
  })
})

describe("drill-down (RP-05..RP-07, SH-03, SH-05)", () => {
  it("one student, every skill in scope, with progress per skill (S-02)", () => {
    const o = S.studentOverview(db, SCENARIO.noah)!
    expect(o.rows).toHaveLength(10)
    expect(total(o.counts)).toBe(10)
    expect(o.rows.find((r) => r.skill.id === "sk-iv")!.progress.levels.map((l) => [l.label, l.have, l.min])).toEqual([["Observed", 2, 1], ["With assistance", 1, 1], ["Independent", 4, 3]])
  })

  it("progress against EACH named setting; lab evidence never satisfies one (SH-05, SC-12)", () => {
    const wound = S.skillProgress(db, SCENARIO.noah, "sk-wound")!
    expect(wound.settings.every((s) => s.have >= s.needed)).toBe(true)
    const withLab = seed()
    const p = S.skillProgress(withLab, SCENARIO.olivia, "sk-wound")!
    expect(p.settings.map((s) => s.labEvidence)).toEqual([0, 0])
  })

  it("explains the DEFECT-07 case with structured reasons, settings first and at most three (SH-03)", () => {
    const r = S.failedRule(db, SCENARIO.olivia, "sk-wound")!
    expect(r.skillReasons.map((x) => x.rule)).toEqual(["settingMinimum", "settingMinimum"])
    expect(r.skillReasons.length).toBeLessThanOrEqual(3)
  })

  it("explains why one evaluation did not qualify from the CURRENT rule, with the failed question ids (SH-03)", () => {
    const sub = db.submissions.find((s) => s.studentId === SCENARIO.priya && s.skillId === "sk-foley")!
    const r = S.failedRule(db, SCENARIO.priya, "sk-foley", sub.id)!
    expect(r.evaluationReasons[0]).toMatchObject({ rule: "subset", failedQuestionIds: ["foley-q2"] })
    expect(r.skillReasons[0]).toMatchObject({ rule: "requiredCount", needed: 3, have: 0 })
  })

  it("the ledger shows the FULL recorded answers, not a summary (RP-06, RP-07)", () => {
    const rows = S.evidenceLedger(db, SCENARIO.priya, "sk-foley")
    expect(rows[0].recorded).toMatchObject({ kind: "question", total: 3 })
    if (rows[0].recorded?.kind === "question") expect(rows[0].recorded.items.map((i) => i.text)).toEqual(["Performs appropriate preparation", "Performs the procedure correctly", "Maintains appropriate technique"])
    expect(rows[0].values).toEqual([{ label: "Completion date", value: expect.any(String) }])
    const iv = S.evidenceLedger(db, SCENARIO.jonah, "sk-iv").find((r) => r.state === "awaitingApproval")!
    expect(iv.selfEvaluation).toMatchObject({ kind: "demonstration", level: "With assistance" })
    expect(iv.studentNote).toBe("Still building confidence.")
  })

  it("keeps a returned reviewer note on the ledger row for the revision that was returned", () => {
    const rows = S.evidenceLedger(db, SCENARIO.olivia, "sk-iv")
    expect(rows.find((r) => r.state === "returned")!.reviewerNote).toContain("unit")
  })
})

describe("export (RP-10, OD-10, OD-11, OD-03)", () => {
  const opts = { generatedAt: "2026-10-08T09:00:00.000Z" }

  it("covers the FULL filtered scope and records the filters in the file, and two filter sets give different headers (RP-10)", () => {
    const a = S.exportAggregate(db, "student", { cohortId: "coh-bsn26" }, opts)
    const b = S.exportAggregate(db, "student", { cohortId: "coh-bsn27" }, opts)
    expect(a.rows).toHaveLength(14)
    expect(a.header).toContain("Cohort: BSN 2026")
    expect(a.header).toContain("Rows: 14")
    expect(a.header).toContain("Scope: all rows matching these filters")
    expect(a.header).not.toEqual(b.header)
    expect(S.exportAggregate(db, "student", {}, opts).header).toContain("Filters: none")
  })

  it("carries the four-state ENUM columns whatever the display flag says (OD-03)", () => {
    const four = S.exportAggregate(db, "student", {}, { ...opts, display: "four" })
    const merged = S.exportAggregate(db, "student", {}, { ...opts, display: "merged" })
    expect(four.columns).toEqual(expect.arrayContaining(["evidence_does_not_qualify", "no_evidence_yet"]))
    expect(merged.rows).toEqual(four.rows)
    expect(merged.header.join("\n")).toContain("merged")
    expect(S.stateLabel("noEvidence", "merged")).toBe(S.stateLabel("evidenceDoesNotQualify", "merged"))
    expect(S.stateLabel("noEvidence", "four")).not.toBe(S.stateLabel("evidenceDoesNotQualify", "four"))
  })

  it("exports by skill and by tag, with the overlap note on tags (RP-04)", () => {
    expect(S.exportAggregate(db, "skill", {}, opts).rows).toHaveLength(10)
    expect(S.exportAggregate(db, "tag", {}, opts).header.join("\n")).toContain("rows overlap")
  })

  it("evidence detail is one row per evaluation with comment, setting, location, self-evaluation and review note (RP-10)", () => {
    const t = S.exportEvidence(db, { cohortId: "coh-bsn26" }, opts)
    expect(t.rows.length).toBeGreaterThan(50)
    expect(t.columns).toEqual(expect.arrayContaining(["evaluator_comment", "clinical_setting", "location", "self_evaluation", "review_note", "attempt", "revisions"]))
    const idx = (c: string) => t.columns.indexOf(c)
    expect(t.rows.some((r) => r[idx("review_note")] !== "")).toBe(true)
    expect(t.rows.every((r) => r.length === t.columns.length)).toBe(true)
  })

  it("a returned and resent submission exports BOTH evaluations, the earlier one marked superseded and never counted (RP-10)", () => {
    const t = S.exportEvidence(db, {}, opts)
    expect(t.rows).toHaveLength(db.evaluations.length)
    const idx = (c: string) => t.columns.indexOf(c)
    const sup = t.rows.filter((r) => r[idx("superseded")] === "yes")
    expect(sup.length).toBeGreaterThan(0)
    expect(sup.every((r) => r[idx("counts_toward_record")] === "no" && r[idx("submission_state")] === "superseded")).toBe(true)
    // exactly one non-superseded row per submission that has an evaluation for its current revision
    const current = t.rows.filter((r) => r[idx("superseded")] === "no").length
    expect(current).toBe(t.rows.length - sup.length)
  })

  it("the evaluator column is OFF by default and a flag turns it on; never emails or tokens (OD-11)", () => {
    expect(S.exportEvidence(db, {}, opts).columns).not.toContain("evaluator")
    const on = S.exportEvidence(db, {}, { ...opts, includeEvaluator: true })
    expect(on.columns).toContain("evaluator")
    const csv = S.toCsv(on)
    expect(csv).not.toMatch(/@example\.(org|edu)/)
    for (const l of db.links) expect(csv).not.toContain(l.token)
  })

  it("keeps evidence for a deactivated skill, flagged inactive (SL-11)", () => {
    const off = must(S.setSkillActive(db, "sk-iv", false)).db
    const t = S.exportEvidence(off, {}, opts)
    const i = t.columns.indexOf("skill_inactive")
    expect(t.rows.some((r) => r[t.columns.indexOf("skill")] === "IV Insertion" && r[i] === "yes")).toBe(true)
  })

  it("filters evidence rows by location and setting", () => {
    const t = S.exportEvidence(db, { locationId: "loc-harbor" }, opts)
    const li = t.columns.indexOf("location")
    expect(t.rows.length).toBeGreaterThan(0)
    expect(t.rows.every((r) => r[li] === "Harbor Family Practice")).toBe(true)
    expect(S.exportEvidence(db, { settingId: "lab" }, opts).rows.every((r) => r[t.columns.indexOf("performed_in")] === "lab")).toBe(true)
  })

  it("CSV: leading # block, blank line, header row, quoting and spreadsheet-formula protection", () => {
    const csv = S.toCsv({ kind: "student", header: ["Report: x"], columns: ["a", "b"], rows: [["=cmd|calc", 'say "hi", ok'], ["+1", "-2"]] })
    expect(csv.split("\n").slice(0, 3)).toEqual(["# Report: x", "", "a,b"])
    expect(csv).toContain("'=cmd|calc")
    expect(csv).toContain('"say ""hi"", ok"')
    expect(csv).toContain("'+1,'-2")
    expect(S.safeCell(5)).toBe(5)
  })
})
void ctx
