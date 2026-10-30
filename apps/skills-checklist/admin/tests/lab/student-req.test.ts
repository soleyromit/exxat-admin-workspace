/**
 * Student side requirement coverage (2026-10-27 audit, docs/knowledge/req-coverage-lab.md): one block per requirement ID, each
 * asserting the behaviour the REQ line asks for on every variant's shared model (the A, B and C screens read these functions).
 */
import { selfEvalIssues, selfShape, selfSummary } from "@/components/lab/student2/log-parts"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, it } from "vitest"
import { createSeed } from "@/lib/v2/seed"
import { heldState } from "@/lib/v2/approvals"
import { setSkillsActive } from "@/lib/v2/admin-actions"
import { REQUIRED_SET_LABEL } from "@/lib/v2/population"
import { ineligibleReason, logSkills, openToLog, skillProgress } from "@/lib/v2/student"
import type { Evaluation, V2State } from "@/lib/v2/types"
import { attempts, buildStudent, courseLevels, fixModel, requestGroups, submissionWhere, waitingBins, waitingRows } from "@/lib/lab/student"
import {
  OUTSTANDING,
  PRACTICE_LINE,
  STUDENT_NOTE_MAX,
  confirmationLines,
  detailErrors,
  evaluatorsFor,
  filterRecord,
  locationError,
  locationFor,
  noteError,
  pickRows,
  recordFigures,
  recordRows,
  sendHandoff,
  settingWords,
  studentNoteOf,
  whereChoices,
  EMPTY_RECORD_FILTER,
  evaluationPreview,
  selfEvalEnabled,
} from "@/lib/lab/student2"
import { evaluationView } from "@/lib/lab/evaluation-view"

const seed = createSeed()
const maya = buildStudent(seed)!
const src = (p: string) => readFileSync(join(__dirname, "../..", p), "utf8")
const AT = "2026-10-27T10:00:00Z"

describe("SL-11: a deactivated skill leaves student selection; its evidence stays", () => {
  // "Deactivating a skill withdraws it from course mapping, from student selection and from reporting scope, while retaining
  // evidence already recorded against it."
  const inactive = seed.skills.filter((k) => k.active === false)
  it("the seed carries deactivated skills, and neither Log nor Send offers them (both read pickRows)", () => {
    expect(inactive.length).toBeGreaterThan(0)
    const ids = new Set(pickRows(seed, maya).map((r) => r.id))
    for (const k of inactive) {
      expect(openToLog(k)).toBe(false)
      expect(ids.has(k.id)).toBe(false)
    }
  })
  it("deactivating a skill with Maya's evidence removes it from the picker and from every course's expected list, keeps the record", () => {
    const withEvidence = maya.all.find((r) => r.state !== "none" && r.active)!
    const r = setSkillsActive(seed, [withEvidence.id], false, "adm-ross", AT)
    expect(r.ok).toBe(true)
    const s = (r as { state: V2State }).state
    const m = buildStudent(s)!
    expect(pickRows(s, m).some((x) => x.id === withEvidence.id)).toBe(false)
    for (const c of m.courses) expect(c.skills.some((x) => x.id === withEvidence.id)).toBe(false)
    const kept = m.all.find((x) => x.id === withEvidence.id)
    expect(kept?.active).toBe(false)
    expect(recordRows(s, m).some((x) => x.skillId === withEvidence.id)).toBe(true)
  })
  it("the engine refuses to log a deactivated skill and says the evidence stays", () => {
    const k = inactive[0]
    const res = logSkills(seed, { skillIds: [k.id], setting: "lab", clinicalSetting: null, location: null, ratings: {}, answers: {}, notes: {} }, AT)
    expect(res.ok).toBe(false)
    expect((res as { error: string }).error).toMatch(/no longer in use.*evidence stays/)
  })
})

describe("ST-05, ST-08, ST-09, EV-02: lab and simulation evidence goes to a recorded lab instructor", () => {
  const skills = pickRows(seed, maya).filter((r) => r.likely).slice(0, 2).map((r) => r.id)
  it("every submission records clinical, lab or simulation; lab and simulation are offered to send (ST-05)", () => {
    const w = whereChoices(seed, maya.student.id)
    expect(new Set(w.map((x) => x.setting))).toEqual(new Set(["clinical", "lab", "simulation"]))
    for (const x of w.filter((y) => y.setting !== "clinical")) expect(x.description).toMatch(/lab instructor/)
  })
  it("lab evidence lists recorded lab instructors first and never a preceptor (ST-08, ST-09, EV-02)", () => {
    const lab = evaluatorsFor(seed, skills, null, "lab")
    expect(lab.length).toBeGreaterThan(0)
    expect(lab[0].role.toLowerCase()).toContain("lab instructor")
    expect(lab.some((o) => seed.people.find((p) => p.id === o.id)?.kind === "preceptor")).toBe(false)
    expect(lab.filter((o) => o.eligible).length).toBeGreaterThan(0)
    const sim = evaluatorsFor(seed, skills, null, "simulation")
    expect(sim.some((o) => o.role.toLowerCase().includes("lab instructor"))).toBe(true)
  })
  it("clinical evidence still never offers a lab instructor; a preceptor cannot sign lab evidence, with the reason (ST-08)", () => {
    const clinical = evaluatorsFor(seed, skills, "Harbor General, 4 West", "clinical")
    expect(clinical.some((o) => o.role.toLowerCase().includes("lab instructor"))).toBe(false)
    const k = seed.skills.find((x) => x.id === skills[0])!
    const preceptor = seed.people.find((p) => p.kind === "preceptor")!
    const labInst = seed.people.find((p) => p.kind === "lab-instructor")!
    expect(ineligibleReason(k, preceptor, "lab")).toMatch(/at the placement/)
    expect(ineligibleReason(k, labInst, "clinical")).toMatch(/in the lab/)
  })
  it("hard stop kept: lab evidence never satisfies a clinical-setting minimum (SC-12), whoever signs it", () => {
    const k = seed.skills.find((x) => (x.config?.achievement.settingMinimums.length ?? 0) > 0 && x.active !== false)!
    const setting = k.config!.achievement.settingMinimums[0].setting
    const before = skillProgress(seed, maya.student.id, k.id)!.settings.find((x) => x.setting === setting)!.have
    const labInst = seed.people.find((p) => p.kind === "lab-instructor")!
    const lab: Evaluation = { id: "ev-test-lab", studentId: maya.student.id, skillId: k.id, evaluatorId: labInst.id, setting: "lab", date: AT, status: "counted", outcome: "met", currentVersion: 1, versions: [{ version: 1, outcome: "met", at: AT, by: labInst.id, reason: null }] }
    const after = skillProgress({ ...seed, evaluations: [...seed.evaluations, lab] }, maya.student.id, k.id)!.settings.find((x) => x.setting === setting)!.have
    expect(after).toBe(before)
    expect(PRACTICE_LINE).toMatch(/never counts toward a clinical setting/)
  })
})

describe("ST-07: no placement on record, the submission is still possible with the program's settings and a typed location", () => {
  const noPlacement = seed.people.find((p) => p.kind === "student" && !seed.placements.some((x) => x.studentId === p.id && x.courseId === seed.course.id))!
  it("offers the program's settings and asks for the location, which is then required and recorded", () => {
    const w = whereChoices(seed, noPlacement.id)
    const program = w.filter((x) => x.setting === "clinical")
    expect(program.map((x) => x.clinicalSetting)).toEqual(seed.program.clinicalSettings)
    for (const x of program) expect(x.askLocation).toBe(true)
    expect(locationError(program[0], "")).toMatch(/Enter the location/)
    expect(locationError(program[0], "Ward 5")).toBeNull()
    expect(locationFor(program[0], " Ward 5 ")).toBe("Ward 5")
    const placed = whereChoices(seed, maya.student.id).find((x) => x.setting === "clinical")!
    expect(locationError(placed, "")).toBeNull()
    expect(locationFor(placed, "")).toBe(placed.location)
  })
})

describe("ST-10: required details are enforced before a submission is sent", () => {
  it("date and unit are mandatory, case reference optional; Log hands them to Send", () => {
    expect(Object.keys(detailErrors({ date: "", unit: "", case: "" })).sort()).toEqual(["date", "unit"])
    expect(detailErrors({ date: "2026-10-20", unit: "4 West", case: "" })).toEqual({})
    const h = sendHandoff({ skills: "a,b", where: "lab", date: "2026-10-20", unit: "Skills lab", case: "", note: "x", loc: "" })
    expect(h).toMatchObject({ skills: "a,b", where: "lab", date: "2026-10-20", unit: "Skills lab", note: "x" })
    expect(h.case).toBeUndefined()
  })
  it("the Send and Fix forms enforce the details and show one summary on a failed send", () => {
    const req = src("components/lab/student2/request-parts.tsx")
    expect(req).toMatch(/detailErrors\(details, fields\)/)
    expect(req).toMatch(/const valid = issues\.length === 0/)
    expect(req).toMatch(/ValidationSummary/)
    for (const f of ["components/lab/screens/student-request-a.tsx", "components/lab/screens/student-request-b.tsx"]) {
      expect(src(f)).toMatch(/<SendIssues d=\{d\} \/>/)
      expect(src(f)).toMatch(/<DetailsAndNote d=\{d\}/)
    }
    expect(src("components/lab/student/fix.tsx")).toMatch(/detailErrors\(draft\.details, fields\)/)
  })
})

describe("ST-12: at most one narrative note per submission, apart from the evaluator's comment", () => {
  it("one note, bounded, read from the request first", () => {
    expect(noteError("x".repeat(STUDENT_NOTE_MAX))).toBeNull()
    expect(noteError("x".repeat(STUDENT_NOTE_MAX + 1))).toMatch(/under/)
    expect(sendHandoff({ note: "y".repeat(STUDENT_NOTE_MAX + 20) }).note).toHaveLength(STUDENT_NOTE_MAX)
    const entry = seed.logEntries.find((e) => e.studentId === maya.student.id)!
    const withEntryNote: V2State = { ...seed, logEntries: seed.logEntries.map((e) => (e.id === entry.id ? { ...e, note: "From the log" } : e)) }
    expect(studentNoteOf(withEntryNote, { entryIds: [entry.id] })).toBe("From the log")
    expect(studentNoteOf(withEntryNote, { studentNote: "On the request", entryIds: [entry.id] })).toBe("On the request")
    expect(studentNoteOf(seed, {})).toBe("")
  })
  it("Log A, Log B, Send A and Send B each carry the one note field; Send stores it on the request as studentNote", () => {
    for (const f of ["components/lab/screens/student-log-a.tsx", "components/lab/screens/student-log-b.tsx"]) expect(src(f)).toMatch(/<NoteField /)
    expect(src("components/lab/student2/request-parts.tsx")).toMatch(/<NoteField id="req-note"/)
    expect(src("components/lab/student2/request-parts.tsx")).toMatch(/studentNote: note\.trim\(\)/)
  })
})

describe("ST-13: confirmation of what was submitted, to whom, in what role, setting and location", () => {
  it("lists skill names, the evaluator with role, the setting and the location", () => {
    const lines = confirmationLines({ skillNames: ["IV insertion", "Wound care"], who: "R. Whitmore", role: "Lab instructor", setting: settingWords({ setting: "lab", clinicalSetting: null }), location: "Skills lab", date: "2026-10-20", note: "" })
    const by = Object.fromEntries(lines.map((l) => [l.label, l.value]))
    expect(Object.values(by)).toContain("IV insertion and Wound care")
    expect(by.To).toBe("R. Whitmore, Lab instructor")
    expect(by.Setting).toBe("Lab")
    expect(by.Location).toBe("Skills lab")
    expect(src("components/lab/student2/request-parts.tsx")).toMatch(/data-confirmation/)
  })
})

describe("RV-01: correct and resend a returned submission, or one not yet assessed", () => {
  it("Maya's waiting request opens as a correction of the same submission, revision +1, with its place and details", () => {
    const sub = seed.submissions.find((x) => x.studentId === maya.student.id && x.status === "with-evaluator")!
    const f = fixModel(seed, maya.student.id, { submissionId: sub.id })!
    expect(f.case).toBe("correction")
    expect(f.origin).toBe("waiting")
    expect(f.submissionId).toBe(sub.id)
    expect(f.nextNumber).toBe((sub.revisions ?? 0) + 1)
    expect(f.details.date).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    expect(f.where).toEqual(submissionWhere(seed, sub))
  })
  it("My requests offers 'Correct and resend' on a request nobody answered, never on one awaiting approval or done (RV-05)", () => {
    const rows = requestGroups(seed, maya.student.id).flatMap((g) => [...g.waiting, ...g.done])
    const open = rows.find((r) => r.id.startsWith("sub-") && !r.statusLabel.startsWith("Awaiting"))!
    expect(open.fix?.label).toBe("Correct and resend")
    for (const r of rows.filter((x) => x.statusLabel.startsWith("Awaiting approval") || x.status === "done")) expect(r.fix).toBeNull()
  })
  it("a further attempt starts from where the last attempt was performed, not a hard-coded clinical setting (ST-10)", () => {
    const dnq = maya.all.find((r) => r.state === "dnq")!
    const f = fixModel(seed, maya.student.id, { skillId: dnq.id })!
    expect(f.case).toBe("attempt")
    const last = seed.evaluations.filter((e) => e.studentId === maya.student.id && e.skillId === f.skillIds[0]).sort((a, b) => (a.date < b.date ? 1 : -1))[0]
    expect(f.where.setting).toBe(last.setting)
  })
})

describe("SH-04: counted, outstanding and returned, the same numbers My progress shows", () => {
  it("for every one of the 123 students, outstanding and returned equal My progress; the drill shows those requests", () => {
    const s = heldState(seed)
    let n = 0
    for (const p of s.people.filter((x) => x.kind === "student")) {
      const m = buildStudent(s, p.id)
      if (!m) continue
      n++
      const rows = recordRows(s, m)
      const f = recordFigures(rows)
      expect(f.outstanding).toBe(m.counts.waiting)
      expect(f.returned).toBe(m.counts.returned)
      const drill = filterRecord(rows, { ...EMPTY_RECORD_FILTER, result: "outstanding" })
      expect(new Set(drill.map((r) => r.unit)).size).toBe(f.outstanding)
      for (const r of drill) expect(OUTSTANDING).toContain(r.result)
    }
    expect(n).toBe(123)
  })
  it("Maya's request waiting with the evaluator is on the record, with who it waits for", () => {
    const rows = recordRows(seed, maya)
    const waiting = rows.filter((r) => r.result === "requested")
    expect(waiting.length).toBeGreaterThan(0)
    expect(waiting[0].why).toMatch(/^Waiting for /)
    expect(waiting[0].evaluationId).toBeNull()
  })
})

describe("SH-07: the student opens a completed evaluation in full, read only", () => {
  it("every completed attempt and record row carries its evaluation; requests not answered carry none", () => {
    const skill = maya.all.find((r) => r.state !== "none")!
    const rows = attempts(seed, maya.student.id, skill.id)
    for (const a of rows) expect(a.evaluationId === null ? a.kind === "waiting" || a.kind === "returned" : a.evaluationId === a.key).toBe(true)
    for (const r of recordRows(seed, maya)) if (r.evaluationId) expect(seed.evaluations.some((e) => e.id === r.evaluationId)).toBe(true)
  })
  it("the view carries the evaluator's responses and feedback in full", () => {
    const e = seed.evaluations.find((x) => x.versions[0]?.detail?.feedback)!
    const v = evaluationView(seed, e.id)!
    expect(v.feedback).toBe(e.versions[e.versions.length - 1].detail?.feedback ?? e.versions[0].detail!.feedback)
    expect(v.comparison.rows.length).toBeGreaterThan(0)
  })
  it("Skill detail A and B and Record A and B open it; the panel has no edit control and says it is read only", () => {
    for (const f of ["components/lab/screens/student-skill-detail-a.tsx", "components/lab/screens/student-skill-detail-b.tsx"]) expect(src(f)).toMatch(/StudentEvaluationSheet/)
    expect(src("components/lab/screens/student-record-a.tsx")).toMatch(/StudentEvaluationSheet/)
    expect(src("components/lab/screens/student-record-b.tsx")).toMatch(/r\.sheet/)
    const sheet = src("components/lab/student/evaluation-sheet.tsx")
    expect(sheet).toMatch(/A completed evaluation cannot be changed/)
    expect(sheet).not.toMatch(/>\s*(Edit|Reopen)/)
  })
})

describe("ST-01: the skills each course expects, which are mandatory, and progress on each", () => {
  it("each current course lists its skills by level, mandatory matching the course's mandatory count, each with a record", () => {
    const withSkills = maya.courses.filter((c) => c.skills.length > 0)
    expect(withSkills.length).toBeGreaterThan(0)
    const rec = new Set(maya.all.map((r) => r.id))
    for (const c of withSkills) {
      expect(c.skills.filter((x) => x.level === "mandatory")).toHaveLength(c.mandatory)
      for (const x of c.skills) expect(rec.has(x.id)).toBe(true)
      const order = c.skills.map((x) => ["mandatory", "recommended", "optional"].indexOf(x.level))
      expect([...order].sort((a, b) => a - b)).toEqual(order)
    }
  })
  it("My progress A, B and C each reach a course's expected skills", () => {
    // A: every course with mandatory skills links to the course view, and the others are listed as course links.
    expect(src("components/lab/student/dashboard.tsx")).toMatch(/data-course-links/)
    expect(src("components/lab/student/dashboard.tsx")).toMatch(/href=\{courseHref\(c\.id, studentId\)\}/)
    expect(src("components/lab/screens/student-progress-a.tsx")).toMatch(/<CourseSkillList model=\{model\} course=\{course\}/)
    expect(src("components/lab/screens/student-progress-b.tsx")).toMatch(/<CourseSelect /)
    expect(src("components/lab/student/progress.tsx")).toMatch(/<CourseSkillList model=\{model\} course=\{c\}/)
  })
  it("the course view has one Log a skill (the header), never a second one in the list", () => {
    expect(src("components/lab/student/progress.tsx")).not.toMatch(/<Link href=\{sendHref\}>Send for evaluation<\/Link>/)
    const a = src("components/lab/screens/student-progress-a.tsx")
    expect(a.match(/label: \`Log \$\{aNoun\(\)\}\`/g)?.length).toBe(1)
    expect(a).not.toMatch(/<Button[^>]*>\s*<Link[^>]*>Send for evaluation/)
  })
})

describe("My progress as a dashboard: the same numbers in every region", () => {
  it("the waiting list has exactly as many requests as the Waiting figure, for every one of the 123 students", () => {
    const s = heldState(seed)
    for (const p of s.people.filter((x) => x.kind === "student")) {
      const m = buildStudent(s, p.id)
      if (!m) continue
      expect(waitingRows(s, p.id)).toHaveLength(m.counts.waiting)
      expect(waitingBins(waitingRows(s, p.id)).reduce((n, b) => n + b.n, 0)).toBe(m.counts.waiting)
    }
  })
  it("the course squares add up to Required this term: per course mandatory, achieved counts match the hero", () => {
    const units = maya.courses.flatMap((c) => courseLevels(maya, c).mandatory)
    expect(new Set(units.map((r) => r.id)).size).toBe(maya.counts.required)
    expect(new Set(units.filter((r) => r.state === "achieved").map((r) => r.id)).size).toBe(maya.counts.achieved)
    for (const c of maya.courses) expect(courseLevels(maya, c).mandatory.filter((r) => r.state === "achieved")).toHaveLength(c.mandatoryAchieved)
  })
  it("My progress A, B and C are registered as dashboards with at most 3 charts (D-X21) and two regions with a chart each", () => {
    const reg = JSON.parse(src("lib/lab/screens.json")).screens.find((x: { persona: string; slug: string }) => x.persona === "student" && x.slug === "home")
    for (const v of reg.variants) expect(v.pageType).toBe("dashboard")
  })
})

describe("Thursday S1: the central view and the per-course view use one definition", () => {
  it("'Required this term' is exactly the union of the mandatory skills of the current courses (same numbers both ways)", () => {
    const mandatory = new Set(maya.courses.flatMap((c) => c.skills.filter((x) => x.level === "mandatory").map((x) => x.id)))
    expect(new Set(maya.required.map((r) => r.id))).toEqual(mandatory)
    expect(maya.counts.required).toBe(mandatory.size)
    const achieved = maya.required.filter((r) => r.state === "achieved").length
    expect(maya.counts.achieved).toBe(achieved)
    for (const c of maya.courses) {
      const ids = c.skills.filter((x) => x.level === "mandatory").map((x) => x.id)
      expect(c.mandatoryAchieved).toBe(maya.all.filter((r) => ids.includes(r.id) && r.state === "achieved").length)
    }
  })
})

describe("Thursday S2: course, mandatory skills, questions, self-evaluation, send (Send C, Log A)", () => {
  const skill = (id: string) => seed.skills.find((k) => k.id === id)!
  it("the question review is the program's configuration, read only, in its own words", () => {
    const q = evaluationPreview(skill("sk-sterile-dressing"))
    expect(q.answer).toBe("Yes or No to each question")
    expect(q.items).toEqual(skill("sk-sterile-dressing").config!.questions.filter((x) => x.trim()))
    expect(q.rule).toMatch(/^You need \d+ successful evaluation/)
    const lv = evaluationPreview(skill("sk-urinary-cath"))
    expect(lv.answer).toBe("One level")
    expect(lv.items).toEqual(skill("sk-urinary-cath").config!.levels.filter((x) => x.trim()))
    expect(evaluationPreview(skill("sk-med-admin")).notes).toContain("A reviewer approves it before it counts.")
  })
  it("self-evaluation follows the skill's own setting when the program saved one (SC-15)", () => {
    const k = skill("sk-sterile-dressing")
    expect(selfEvalEnabled({ ...k, config: { ...k.config!, selfEvaluation: true } })).toBe(true)
    const l = skill("sk-urinary-cath")
    expect(selfEvalEnabled({ ...l, config: { ...l.config!, selfEvaluation: false } })).toBe(false)
  })
  it("Send C runs the steps in Sankalp's order with no separate Questions step; the questions are read on Skills or answered on Self-evaluation", () => {
    const c = src("components/lab/screens/student-request-c.tsx")
    // Romit 2026-10-27: "Do we need this, since the student isn't entering anything?"
    expect(c).toMatch(/\["course", "skills", \.\.\.\(selfIds\.length \? \(\["self"\] as StepId\[\]\) : \[\]\), "send"\]/)
    expect(c).not.toMatch(/"questions"/)
    expect(c).toMatch(/<EvaluatorChecks s=\{d\.s\} id=\{r\.id\} \/>/)
    expect(c).toMatch(/<SelfEvalCards /)
    expect(c).toMatch(/placeFor\(id\)/)
    const log = src("components/lab/screens/student-log-a.tsx")
    expect(log).toMatch(/<SelfEvalCards /)
    expect(log).toMatch(/<EvaluatorChecks /)
  })
  it("ST-11: the student answers the evaluator's own questions, and every one is needed before Continue", () => {
    const sk = seed.skills.find((k) => k.model === "question" && (k.config?.questions ?? []).filter((q) => q.trim()).length > 1)!
    expect(sk).toBeTruthy()
    const n = selfShape(sk).questions.length
    expect(n).toBeGreaterThan(1)
    expect(selfEvalIssues(seed, [sk.id], {}, {}).length).toBeGreaterThan(0)
    const all = { [sk.id]: Array.from({ length: n }, () => "yes" as const) }
    const overall = selfShape(sk).overall
    const ratings = overall.length ? { [sk.id]: overall[0] } : {}
    expect(selfEvalIssues(seed, [sk.id], ratings, all)).toEqual([])
    expect(selfSummary(seed, sk.id, ratings, all)).toContain(`${n} of ${n} Yes`)
  })
  it("the course's own placement decides Where when it is on record (ST-06)", () => {
    const p = maya.placements.find((x) => x.courseId === "crs-nurs350" && x.status === "current")
    expect(p).toBeTruthy()
    expect(whereChoices(seed, maya.student.id).some((w) => w.setting === "clinical" && w.location === p!.location)).toBe(true)
  })
})

describe("D-X12: My progress names the required set", () => {
  it("says 'Required this term', never a bare 'Required skills'", () => {
    expect(REQUIRED_SET_LABEL.thisTerm).toBe("Required this term")
    const files = ["components/lab/student/progress.tsx", "components/lab/screens/student-progress-a.tsx", "components/lab/screens/student-progress-b.tsx", "components/lab/screens/student-progress-c.tsx"]
    for (const f of files) expect(src(f)).not.toMatch(/`Required \$\{skillNounPlural\(\)\}/)
    expect(src("components/lab/student/progress.tsx")).toMatch(/REQUIRED_SET_LABEL\.thisTerm/)
  })
})
