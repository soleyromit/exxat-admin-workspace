// Deterministic demo database. Everything here is SAMPLE data (SL-01: Prism ships no skills).
// No Date.now(), no Math.random(): a seeded PRNG and fixed dates, so the seed is identical on every run.
// Seed submissions are plain records; skill status and submission outcomes are DERIVED by the engine
// at read time and never hardcoded here (AE-02).
import { DB_VERSION } from "@/lib/config"
import { idsFrom, deterministicToken, mulberry32 } from "@/lib/domain/ids"
import type {
  Db,
  Evaluation,
  EvaluatorRef,
  ImportBatch,
  Placement,
  Review,
  Skill,
  Submission,
  EvaluatorLink,
} from "@/lib/domain/types"
import type { Responses } from "@/lib/engine"
import {
  CATEGORIES,
  LAB_INSTRUCTORS,
  LOCATIONS,
  NAMED_LAB_INSTRUCTORS,
  SETTINGS,
  SKILLS,
  TAGS,
} from "./library"
import { COHORTS, EVALUATORS, GROUPS, MAPS, OFFERINGS, buildStudents } from "./people"
import { ROLES, ROLE_EVIDENCE_MAP } from "./roles"

/** Scenario students the tests and demos rely on. */
export const SCENARIO = {
  /** Two placements, a returned IV, a revised Medication administration, an awaiting request, DEFECT-07 Wound care. */
  olivia: "stu-01",
  /** Achieved on most skills, evidence spread across three courses. */
  noah: "stu-02",
  /** Evidence exists but none qualifies (Foley). */
  priya: "stu-03",
  /** IV waiting for approval, self-evaluation disagrees. */
  jonah: "stu-04",
  /** IV waiting for approval, self-evaluation agrees; no eligible evidence yet. */
  rina: "stu-05",
  /** Unmapped-skill evidence that counts. */
  marcus: "stu-06",
  /** No placement at all, lab evidence only, a student-named lab instructor. */
  elena: "stu-07",
} as const

const BASE_DAY = Date.UTC(2026, 3, 1, 10, 0, 0) // 2026-04-01T10:00Z
const iso = (day: number) => new Date(BASE_DAY + day * 86_400_000).toISOString()

type Mode = "pass" | "fail"

function responsesFor(skill: Skill, mode: Mode, rng: () => number, level?: string): Responses {
  const m = skill.model!
  switch (m.kind) {
    case "binary": {
      const q = m.qualifyingLabelId ?? "a"
      return { kind: "binary", labelId: mode === "pass" ? q : q === "a" ? "b" : "a" }
    }
    case "question": {
      const ids = m.questions.map((x) => x.id)
      const required =
        m.rule.kind === "all" ? ids : m.rule.kind === "atLeast" ? ids.slice(0, m.rule.n) : m.rule.questionIds
      const answers: Record<string, boolean> = {}
      for (const id of ids) answers[id] = required.includes(id) ? true : rng() > 0.4
      if (mode === "fail") {
        if (m.rule.kind === "atLeast") {
          const noCount = ids.length - m.rule.n + 1
          ids.forEach((id, i) => (answers[id] = i >= noCount))
        } else {
          answers[required[0]] = false
        }
      }
      return { kind: "question", answers }
    }
    case "scored": {
      const scores: Record<string, number> = {}
      for (const q of m.questions) scores[q.id] = mode === "pass" ? (rng() > 0.5 ? 4 : 3) : 2
      if (mode === "fail" && m.rule.kind === "minPerQuestion") {
        m.questions.forEach((q, i) => (scores[q.id] = i === 0 ? 2 : 4))
      }
      if (mode === "pass" && m.rule.kind === "average") for (const q of m.questions) scores[q.id] = 4
      return { kind: "scored", scores }
    }
    case "demonstration": {
      const l = level ?? m.levels[Math.floor(rng() * m.levels.length)].id
      return { kind: "demonstration", levelId: l }
    }
  }
}

interface AddOpts {
  stu: string
  skill: string
  off: string
  in?: "clinical" | "lab"
  set?: string
  loc?: string
  by: string
  mode?: Mode
  level?: string
  day: number
  /** No completed evaluation: waiting for the evaluator, with a link. */
  waiting?: boolean
  comment?: string
  /** approval skills: leave pending (no review). Default is approved for approval skills. */
  pending?: boolean
  review?: { decision: "approved" | "returned"; note: string }
  /** RV-02: earlier revisions that were returned, oldest first. */
  prior?: Array<{ mode?: Mode; level?: string; note: string }>
  selfEval?: Responses
  student_note?: string
  requestId?: string
}

export function buildSeed(): Db {
  const rng = mulberry32(8)
  const skills = SKILLS.map((s) => ({ ...s }))
  const skillById = new Map(skills.map((s) => [s.id, s]))
  const students = buildStudents()
  const db: Db = {
    version: DB_VERSION,
    seq: 0,
    skills,
    categories: CATEGORIES.map((c) => ({ ...c })),
    tags: TAGS.map((t) => ({ ...t })),
    clinicalSettings: SETTINGS.map((s) => ({ ...s })),
    labInstructors: LAB_INSTRUCTORS.map((l) => ({ ...l })),
    namedLabInstructors: NAMED_LAB_INSTRUCTORS.map((n) => ({ ...n })),
    roles: ROLES.map((r) => ({ ...r })),
    roleEvidenceMap: JSON.parse(JSON.stringify(ROLE_EVIDENCE_MAP)),
    evaluators: EVALUATORS.map((e) => ({ ...e })),
    cohorts: COHORTS.map((c) => ({ ...c })),
    groups: GROUPS.map((g) => ({ ...g })),
    students,
    locations: LOCATIONS.map((l) => ({ ...l, settingIds: [...l.settingIds] })),
    placements: [],
    offerings: OFFERINGS.map((o) => ({ ...o, cohortIds: [...o.cohortIds] })),
    offeringSkillMaps: MAPS.map((m) => ({ ...m })),
    submissions: [],
    evaluations: [],
    reviews: [],
    links: [],
    importBatches: [],
  }
  const ids = idsFrom(db)

  // ---- people refs
  const ref = (key: string): EvaluatorRef => {
    const ev = db.evaluators.find((e) => e.id === key)
    if (ev) return { personId: ev.id, source: "recorded", name: ev.name, email: ev.email, roleId: ev.roleId }
    const lab = db.labInstructors.find((l) => l.id === key)
    if (lab) return { personId: lab.id, source: "roster", name: lab.name, email: lab.email, roleId: "lab_instructor" }
    const named = db.namedLabInstructors.find((n) => n.id === key)
    if (named) return { personId: named.id, source: "studentNamed", name: named.name, email: named.email, roleId: "lab_instructor" }
    throw new Error(`seed: unknown evaluator ${key}`)
  }

  const attemptOf = (stu: string, skill: string) =>
    db.submissions.filter((s) => s.studentId === stu && s.skillId === skill).length + 1

  const add = (o: AddOpts) => {
    const skill = skillById.get(o.skill)!
    const performedIn = o.in ?? "clinical"
    const sub: Submission = {
      id: ids.next("sub"),
      requestId: o.requestId ?? ids.next("req"),
      studentId: o.stu,
      skillId: o.skill,
      offeringId: o.off,
      attempt: attemptOf(o.stu, o.skill),
      revision: o.prior?.length ?? 0,
      performedIn,
      clinicalSettingId: performedIn === "clinical" ? (o.set ?? null) : null,
      locationId: performedIn === "clinical" ? (o.loc ?? null) : null,
      evaluator: ref(o.by),
      values: Object.fromEntries(
        skill.submissionFields.map((f) => [f.id, f.type === "date" ? iso(o.day - 1).slice(0, 10) : f.type === "number" ? 1 : "Unit 3"]),
      ),
      studentNote: o.student_note ?? "",
      selfEvaluation: skill.selfEvaluation ? (o.selfEval ?? responsesFor(skill, "pass", rng, o.level)) : null,
      lifecycle: "awaitingEvaluator",
      sentAt: iso(o.day),
    }
    db.submissions.push(sub)

    const evaluate = (revision: number, mode: Mode | undefined, level: string | undefined, day: number): Evaluation => {
      const ev: Evaluation = {
        id: ids.next("evl"),
        submissionId: sub.id,
        revision,
        evaluator: sub.evaluator,
        responses: responsesFor(skill, mode ?? "pass", rng, level),
        comment: o.comment ?? (skill.evaluatorComment === "mandatory" ? "Sound technique throughout." : ""),
        completedAt: iso(day),
        approvalRequiredAtSubmit: skill.requiresApproval,
      }
      db.evaluations.push(ev)
      return ev
    }
    const review = (evaluationId: string, decision: Review["decision"], note: string, day: number) =>
      db.reviews.push({ id: ids.next("rev"), evaluationId, decision, note, at: iso(day) })

    // Earlier revisions: each was completed, then returned by the reviewer (RV-02).
    ;(o.prior ?? []).forEach((p, i) => {
      const ev = evaluate(i, p.mode, p.level, o.day + i)
      review(ev.id, "returned", p.note, o.day + i)
    })

    if (o.waiting) {
      sub.lifecycle = "awaitingEvaluator"
      const link: EvaluatorLink = {
        token: deterministicToken(ids.seq() + 1000),
        submissionIds: [sub.id],
        evaluator: sub.evaluator,
        createdAt: iso(o.day),
        supersededAt: null,
        submittedAt: null,
      }
      db.links.push(link)
      return sub
    }

    const ev = evaluate(sub.revision, o.mode, o.level, o.day + 1)
    sub.lifecycle = "completed"
    if (o.review) {
      review(ev.id, o.review.decision, o.review.note, o.day + 2)
      if (o.review.decision === "returned") sub.lifecycle = "returned"
    } else if (skill.requiresApproval && !o.pending) {
      review(ev.id, "approved", "", o.day + 2)
    }
    return sub
  }

  const placement = (stu: string, off: string, loc: string) => {
    const p: Placement = { id: ids.next("plc"), studentId: stu, offeringId: off, locationId: loc }
    db.placements.push(p)
  }

  // ---- IM-11: one import batch that produced the two unconfigured skills
  const batch: ImportBatch = {
    id: "imp-1",
    sourceKind: "paste",
    sourceName: "Pasted list",
    createdAt: iso(-20),
    status: "confirmed",
    createCategories: false,
    rows: [],
    unread: [{ id: ids.next("unr"), text: "SECTION 2: ADVANCED PROCEDURES", reason: "heading", location: "Line 9" }],
    createdSkillIds: ["sk-ng", "sk-glucose"],
    createdCategoryIds: [],
  }
  db.importBatches.push(batch)

  // ================= scripted scenarios =================
  const S = SCENARIO
  const A = "off-350-f26"
  const OLD = "off-350-f25"
  const COM = "off-410-f26"

  // ---- Olivia: two placements for NURS 350, one for NURS 410 and the historic offering
  placement(S.olivia, OLD, "loc-riverside")
  placement(S.olivia, A, "loc-harbor")
  placement(S.olivia, A, "loc-northgate")
  placement(S.olivia, COM, "loc-lakeside")
  // IV: 4 counted (obs 1, assist 1, indep 2) and attempt 5 returned twice (revision 1)
  add({ stu: S.olivia, skill: "sk-iv", off: OLD, set: "set-inpatient", loc: "loc-riverside", by: "ev-delgado", level: "iv-l3", day: 5 })
  add({ stu: S.olivia, skill: "sk-iv", off: OLD, set: "set-emergency", loc: "loc-riverside", by: "ev-nakamura", level: "iv-l2", day: 9 })
  add({ stu: S.olivia, skill: "sk-iv", off: COM, set: "set-community", loc: "loc-lakeside", by: "ev-castellano", level: "iv-l1", day: 30 })
  add({ stu: S.olivia, skill: "sk-iv", off: COM, set: "set-community", loc: "loc-lakeside", by: "ev-okonkwo", level: "iv-l3", day: 33 })
  add({
    stu: S.olivia,
    skill: "sk-iv",
    off: A,
    set: "set-outpatient",
    loc: "loc-harbor",
    by: "ev-okonkwo",
    level: "iv-l3",
    day: 60,
    prior: [{ level: "iv-l3", note: "The date and unit do not match your placement record for that week. Please correct and resend." }],
    review: { decision: "returned", note: "The unit is still missing. Please add it and resend." },
  })
  // Foley: 2 counted
  add({ stu: S.olivia, skill: "sk-foley", off: OLD, set: "set-inpatient", loc: "loc-riverside", by: "ev-delgado", day: 8 })
  add({ stu: S.olivia, skill: "sk-foley", off: A, set: "set-outpatient", loc: "loc-harbor", by: "ev-nakamura", day: 40 })
  // Wound care: 4 of 4 demonstrations, none in Inpatient or Emergency (DEFECT-07)
  add({ stu: S.olivia, skill: "sk-wound", off: A, set: "set-outpatient", loc: "loc-harbor", by: "ev-delgado", level: "wound-l1", day: 45 })
  add({ stu: S.olivia, skill: "sk-wound", off: A, set: "set-outpatient", loc: "loc-harbor", by: "ev-okonkwo", level: "wound-l2", day: 47 })
  add({ stu: S.olivia, skill: "sk-wound", off: A, set: "set-outpatient", loc: "loc-northgate", by: "ev-nakamura", level: "wound-l2", day: 52 })
  add({ stu: S.olivia, skill: "sk-wound", off: A, set: "set-outpatient", loc: "loc-northgate", by: "ev-delgado", level: "wound-l2", day: 55 })
  // Medication administration: two counted, one corrected and resent (state: revised, waiting)
  add({ stu: S.olivia, skill: "sk-med", off: A, set: "set-outpatient", loc: "loc-harbor", by: "ev-delgado", day: 20 })
  add({ stu: S.olivia, skill: "sk-med", off: A, set: "set-outpatient", loc: "loc-harbor", by: "ev-nakamura", day: 24 })
  // revised: the first evaluation was returned for correction, the student resent (revision 1), no evaluation for revision 1 yet
  {
    const sub = add({
      stu: S.olivia, skill: "sk-med", off: A, set: "set-outpatient", loc: "loc-northgate", by: "ev-whitfield", day: 58,
      prior: [{ note: "The completion date does not match the shift. Please correct and resend." }], waiting: true,
    })
    sub.lifecycle = "awaitingEvaluator"
  }
  // Medication reconciliation: 2 counted + 1 waiting for S. Nakamura
  add({ stu: S.olivia, skill: "sk-recon", off: A, set: "set-outpatient", loc: "loc-harbor", by: "ev-okonkwo", day: 12 })
  add({ stu: S.olivia, skill: "sk-recon", off: A, set: "set-outpatient", loc: "loc-harbor", by: "ev-delgado", day: 15 })
  add({ stu: S.olivia, skill: "sk-recon", off: A, set: "set-outpatient", loc: "loc-northgate", by: "ev-nakamura", day: 62, waiting: true })

  // ---- Noah: achieved nearly everywhere, evidence in three courses (CM-07)
  placement(S.noah, OLD, "loc-riverside")
  placement(S.noah, A, "loc-staubin")
  placement(S.noah, COM, "loc-lakeside")
  const noahCourse = [OLD, A, COM]
  let d = 3
  const noah = (skill: string, n: number, opt: Partial<AddOpts> = {}) => {
    for (let i = 0; i < n; i += 1) {
      const off = noahCourse[i % 3]
      const loc = off === OLD ? "loc-riverside" : off === A ? "loc-staubin" : "loc-lakeside"
      const set = loc === "loc-lakeside" ? "set-outpatient" : i % 2 === 0 ? "set-inpatient" : "set-emergency"
      const by = ["ev-delgado", "ev-nakamura", "ev-okonkwo", "ev-castellano"][i % 4]
      add({ stu: S.noah, skill, off, set, loc, by, day: (d += 3), ...opt })
    }
  }
  const levels = ["iv-l1", "iv-l1", "iv-l2", "iv-l3", "iv-l3", "iv-l3", "iv-l3"]
  levels.forEach((lv, i) => {
    const off = noahCourse[i % 3]
    const loc = off === OLD ? "loc-riverside" : off === A ? "loc-staubin" : "loc-lakeside"
    add({ stu: S.noah, skill: "sk-iv", off, set: loc === "loc-lakeside" ? "set-outpatient" : "set-inpatient", loc, by: "ev-delgado", level: lv, day: (d += 3) })
  })
  ;(["wound-l1", "wound-l1", "wound-l2", "wound-l2", "wound-l2"] as const).forEach((lv, i) => {
    const loc = i < 3 ? "loc-riverside" : "loc-staubin"
    add({ stu: S.noah, skill: "sk-wound", off: i < 3 ? OLD : A, set: i % 2 === 0 ? "set-inpatient" : "set-emergency", loc, by: "ev-delgado", level: lv, day: (d += 3) })
  })
  noah("sk-foley", 5); noah("sk-dressing", 5); noah("sk-h2t", 4); noah("sk-med", 4); noah("sk-trach", 4); noah("sk-recon", 3)

  // ---- Priya: eligible evidence, none qualifies (state: evidence does not qualify)
  placement(S.priya, A, "loc-harbor")
  for (let i = 0; i < 3; i += 1) add({ stu: S.priya, skill: "sk-foley", off: A, set: "set-outpatient", loc: "loc-harbor", by: "ev-okonkwo", mode: "fail", day: 10 + i * 4 })
  add({ stu: S.priya, skill: "sk-dressing", off: A, set: "set-outpatient", loc: "loc-harbor", by: "ev-delgado", day: 30 })
  add({ stu: S.priya, skill: "sk-dressing", off: A, set: "set-outpatient", loc: "loc-harbor", by: "ev-delgado", mode: "fail", day: 34 })
  add({ stu: S.priya, skill: "sk-h2t", off: COM, set: "set-community", loc: "loc-lakeside", by: "ev-bansal", mode: "fail", day: 40 })
  placement(S.priya, COM, "loc-lakeside")

  // ---- Jonah: IV waiting for approval, self-evaluation DISAGREES with the evaluator
  placement(S.jonah, A, "loc-staubin")
  add({ stu: S.jonah, skill: "sk-iv", off: A, set: "set-inpatient", loc: "loc-staubin", by: "ev-delgado", level: "iv-l1", day: 10 })
  add({ stu: S.jonah, skill: "sk-iv", off: A, set: "set-inpatient", loc: "loc-staubin", by: "ev-delgado", level: "iv-l2", day: 14 })
  add({ stu: S.jonah, skill: "sk-iv", off: A, set: "set-emergency", loc: "loc-staubin", by: "ev-nakamura", level: "iv-l3", day: 18 })
  add({
    stu: S.jonah, skill: "sk-iv", off: A, set: "set-emergency", loc: "loc-staubin", by: "ev-nakamura", level: "iv-l3", day: 50, pending: true,
    selfEval: { kind: "demonstration", levelId: "iv-l2" }, student_note: "Still building confidence.",
  })

  // ---- Rina: only a pending IV (AE-01: awaiting approval does not count), self-evaluation AGREES
  placement(S.rina, A, "loc-harbor")
  add({
    stu: S.rina, skill: "sk-iv", off: A, set: "set-outpatient", loc: "loc-harbor", by: "ev-delgado", level: "iv-l3", day: 55, pending: true,
    selfEval: { kind: "demonstration", levelId: "iv-l3" }, student_note: "Felt I needed a prompt on preparation.",
  })

  // ---- Marcus: evidence for a skill NOT mapped to his courses still counts (CM-05)
  placement(S.marcus, A, "loc-staubin")
  add({ stu: S.marcus, skill: "sk-trach", off: A, set: "set-inpatient", loc: "loc-staubin", by: "ev-delgado", day: 20 })
  add({ stu: S.marcus, skill: "sk-trach", off: A, set: "set-emergency", loc: "loc-staubin", by: "ev-nakamura", day: 24 })
  add({ stu: S.marcus, skill: "sk-foley", off: A, set: "set-inpatient", loc: "loc-staubin", by: "ev-nakamura", day: 28 })

  // ---- Elena: NO placement anywhere (ST-07), lab evidence only, one student-named lab instructor (SL-09)
  add({ stu: S.elena, skill: "sk-o2", off: A, in: "lab", by: "lab-ferreira", day: 12 })
  add({ stu: S.elena, skill: "sk-o2", off: A, in: "lab", by: "named-whitmore", day: 16 })
  add({ stu: S.elena, skill: "sk-iv", off: A, in: "lab", by: "lab-larsen", level: "iv-l1", day: 22 })

  // ---- Milo (stu-09): one counted + one waiting; Nina (stu-10): partial scored evidence
  placement("stu-09", COM, "loc-lakeside")
  add({ stu: "stu-09", skill: "sk-vitals", off: COM, set: "set-community", loc: "loc-lakeside", by: "ev-bansal", day: 14 })
  add({ stu: "stu-09", skill: "sk-vitals", off: COM, set: "set-community", loc: "loc-lakeside", by: "ev-bansal", day: 40, waiting: true })
  placement("stu-10", COM, "loc-lakeside")
  add({ stu: "stu-10", skill: "sk-h2t", off: COM, set: "set-outpatient", loc: "loc-lakeside", by: "ev-bansal", mode: "fail", day: 10 })
  add({ stu: "stu-10", skill: "sk-h2t", off: COM, set: "set-outpatient", loc: "loc-lakeside", by: "ev-bansal", day: 20 })
  add({ stu: "stu-10", skill: "sk-trach", off: COM, set: "set-outpatient", loc: "loc-lakeside", by: "ev-bansal", day: 24 })
  add({ stu: "stu-10", skill: "sk-trach", off: COM, set: "set-outpatient", loc: "loc-lakeside", by: "ev-bansal", mode: "fail", day: 30 })

  // ================= generated population =================
  const scripted = new Set<string>(["stu-01", "stu-02", "stu-03", "stu-04", "stu-05", "stu-06", "stu-07", "stu-09", "stu-10"])
  const configured = skills.filter((s) => s.model !== null)
  const clinicalOk = (roleId: string) => db.roleEvidenceMap[roleId]?.clinical === true
  const labOk = (roleId: string) => db.roleEvidenceMap[roleId]?.lab === true
  for (const stu of students) {
    if (scripted.has(stu.id)) continue
    const offs = db.offerings.filter((o) => o.cohortIds.includes(stu.cohortId))
    const myLocs: Record<string, string> = {}
    for (const o of offs) {
      const loc = db.locations[Math.floor(rng() * db.locations.length)].id
      myLocs[o.id] = loc
      placement(stu.id, o.id, loc)
    }
    const pool: Array<{ skill: Skill; off: string }> = []
    for (const o of offs) {
      for (const mp of db.offeringSkillMaps.filter((x) => x.offeringId === o.id)) {
        const sk = skillById.get(mp.skillId)!
        if (sk.model) pool.push({ skill: sk, off: o.id })
      }
    }
    if (rng() < 0.25) pool.push({ skill: configured[Math.floor(rng() * configured.length)], off: offs[0]?.id ?? "off-350-f26" })
    for (const { skill, off } of pool) {
      const n = Math.floor(rng() * 4)
      for (let i = 0; i < n; i += 1) {
        const lab = rng() < 0.15 && skill.allowedRoles.some(labOk)
        const roles = skill.allowedRoles.filter(lab ? labOk : clinicalOk)
        if (roles.length === 0) continue
        const roleId = roles[Math.floor(rng() * roles.length)]
        let by: string
        if (roleId === "lab_instructor") by = db.labInstructors[Math.floor(rng() * db.labInstructors.length)].id
        else {
          const pickFrom = db.evaluators.filter((e) => e.roleId === roleId)
          by = pickFrom[Math.floor(rng() * pickFrom.length)].id
        }
        const loc = myLocs[off] ?? db.locations[0].id
        const set = db.locations.find((l) => l.id === loc)!.settingIds[0]
        add({
          stu: stu.id, skill: skill.id, off, in: lab ? "lab" : "clinical", set, loc, by,
          mode: rng() < 0.8 ? "pass" : "fail", day: Math.floor(rng() * 180) + 2,
          // Only sk-iv draws from the main stream, exactly as before approval was turned on for other skills, so the generated
          // population is byte-for-byte the same. The other approval skills are approved by default in the bulk evidence.
          pending: skill.id === "sk-iv" && rng() < 0.12,
        })
      }
    }
  }

  // ---- Waiting for approval on the OTHER evaluation models (S-11 renders question, scored and binary responses).
  // sk-med (question), sk-trach (scored) and sk-vitals (binary) require approval from the start (lib/seed/library.ts); the
  // bulk evidence above is approved by default, so every derived count is unchanged. Pending items go to three generated
  // (non-scenario) students at their own placement, so scripted scenarios are untouched.
  const pendingFor = (stu: string, skill: string, day: number, mode: Mode, selfEval?: Responses) => {
    const p = db.placements.find((x) => x.studentId === stu)!
    const loc = db.locations.find((l) => l.id === p.locationId)!
    add({ stu, skill, off: p.offeringId, set: loc.settingIds[0], loc: loc.id, by: "ev-delgado", mode, day, pending: true, selfEval })
  }
  pendingFor("stu-11", "sk-med", 66, "pass") // question model, 4 steps, at least 3 Yes
  pendingFor("stu-12", "sk-trach", 68, "fail") // scored model, minimum per question not met (shows as does-not-qualify)
  pendingFor("stu-13", "sk-vitals", 70, "pass") // binary model, mandatory comment

  db.seq = ids.seq()
  return db
}
