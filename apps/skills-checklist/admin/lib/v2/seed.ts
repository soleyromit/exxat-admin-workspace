import { defaultConfig, SAMPLE_QUESTIONS } from "./config"
import type {
  AuditEntry,
  Evaluation,
  EvaluationStatus,
  LabCheckoff,
  LogEntry,
  MappingRow,
  Outcome,
  Person,
  Placement,
  Setting,
  Skill,
  SkillConfig,
  Specialty,
  Submission,
  V2State,
} from "./types"

/** Fixed demo clock so the seed is identical on every load and in tests. */
export const DEMO_TODAY = "2026-10-19"

function daysBefore(n: number): string {
  const d = new Date(`${DEMO_TODAY}T09:00:00Z`)
  d.setUTCDate(d.getUTCDate() - n)
  return d.toISOString()
}

/** Small deterministic PRNG (mulberry32) so history is stable. */
function prng(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export const IDS = {
  maya: "stu-maya",
  delgado: "pre-delgado",
  whitmore: "lab-whitmore",
  ross: "adm-ross",
  reviewer: "rev-haddad",
  director: "dir-brennan",
  course: "crs-nurs350",
  ivCath: "sk-iv-cath",
  urinaryCath: "sk-urinary-cath",
} as const

const PEOPLE: Person[] = [
  { id: IDS.ross, name: "A. Ross", title: "Program administrator", kind: "admin", email: "a.ross@harbor.example" },
  { id: IDS.reviewer, name: "L. Haddad", title: "Clinical coordinator", kind: "reviewer", email: "l.haddad@harbor.example" },
  { id: IDS.director, name: "Dr. K. Brennan", title: "Program director", kind: "director", email: "k.brennan@harbor.example" },
  { id: IDS.delgado, name: "J. Delgado, RN", title: "Preceptor, Harbor General", kind: "preceptor", email: "j.delgado@harborgeneral.example", credentials: ["RN"], yearsPractice: 9, training: ["IV therapy"] },
  { id: IDS.whitmore, name: "R. Whitmore", title: "Lab instructor", kind: "lab-instructor", email: "r.whitmore@harbor.example", credentials: ["RN"], yearsPractice: 12, training: ["IV therapy", "Simulation facilitation"] },
  { id: "pre-okonkwo", name: "S. Okonkwo, RN", title: "Preceptor, Harbor General", kind: "preceptor", email: "s.okonkwo@harborgeneral.example", credentials: ["RN"], yearsPractice: 1, training: [] },
  { id: "pre-castillo", name: "M. Castillo, RN", title: "Preceptor, Harbor Outpatient", kind: "preceptor", email: "m.castillo@harboroutpatient.example", credentials: ["RN"], yearsPractice: 4, training: ["IV therapy"] },
  { id: "pre-aldridge", name: "T. Aldridge, LPN", title: "Preceptor, Harbor General", kind: "preceptor", email: "t.aldridge@harborgeneral.example", credentials: ["LPN"], yearsPractice: 6, training: ["IV therapy"] },
  { id: IDS.maya, name: "Maya Ferreira", title: "BSN 2027", kind: "student", email: "m.ferreira@students.harbor.example" },
  ...[
    "Jordan Okafor",
    "Priya Raman",
    "Tomas Alvarez",
    "Hannah Brooks",
    "Devon Lee",
    "Amara Nwosu",
    "Liam Kowalski",
    "Sofia Marchetti",
    "Noah Whitfield",
    "Grace Tanaka",
    "Ethan Cole",
  ].map((name, i): Person => ({
    id: `stu-${String(i + 2).padStart(2, "0")}`,
    name,
    title: "BSN 2027",
    kind: "student",
    email: `${name.toLowerCase().replace(/[^a-z]+/g, ".")}@students.harbor.example`,
  })),
]

function configFor(model: Skill["model"]): SkillConfig {
  const c = defaultConfig(model)
  if (model === "question" || model === "scored") c.questions = [...SAMPLE_QUESTIONS]
  return c
}

const IV_CONFIG: SkillConfig = {
  ...defaultConfig("demonstration"),
  achievement: { kind: "last-n", need: 4, window: 5, minLevelIndex: 2, distinctEvaluators: 2, settingMinimums: [{ setting: "Inpatient", min: 2 }] },
  simulation: { allowed: true, mode: "cap", maxSharePercent: 25, allowList: [] },
  prerequisites: { skillIds: ["sk-vitals"], labCheckoff: true, practiceTrials: 3 },
  qualification: { credentials: ["RN"], minYears: 2, training: ["IV therapy"] },
  failure: { attemptLimit: 3, minDaysBetween: 7, retakeScoreCap: null, autoRemediation: true },
  revalidation: { onEvents: ["After a leave of absence", "After a policy or equipment change"], calendarExpiry: { enabled: false, months: 24 } },
}

type SkillSeed = [id: string, name: string, category: string, model: Skill["model"], published: boolean, configured?: boolean]

const LIBRARIES: Record<Specialty, SkillSeed[]> = {
  "bsn-med-surg": [
    [IDS.ivCath, "IV catheter insertion", "Vascular access", "demonstration", false],
    [IDS.urinaryCath, "Indwelling urinary catheter insertion", "Elimination", "demonstration", true],
    ["sk-med-admin", "Oral medication administration", "Medication", "binary", true],
    ["sk-sterile-dressing", "Sterile dressing change", "Wound care", "question", true],
    ["sk-vitals", "Vital signs and early warning score", "Assessment", "binary", true],
    ["sk-ng-tube", "Nasogastric tube care", "Nutrition", "question", true],
    ["sk-blood-glucose", "Point-of-care blood glucose", "Assessment", "binary", true],
    ["sk-handoff", "Bedside handoff report", "Communication", "scored", true],
    ["sk-central-line", "Central line dressing change", "Vascular access", "demonstration", false],
    ["sk-pressure-injury", "Pressure injury risk assessment", "Wound care", null, false, false],
  ],
  radiography: [
    ["sk-rad-chest", "Chest radiograph positioning", "General radiography", "question", true],
    ["sk-rad-extremity", "Upper extremity positioning", "General radiography", "question", true],
    ["sk-rad-shielding", "Patient shielding and dose records", "Radiation safety", "binary", true],
    ["sk-rad-portable", "Portable bedside exam", "Mobile imaging", "demonstration", false],
    ["sk-rad-fluoro", "Fluoroscopy room setup", "Fluoroscopy", null, false, false],
    ["sk-rad-pediatric", "Pediatric immobilization", "Special populations", "scored", false],
    ["sk-rad-contrast", "Contrast media screening", "Patient safety", "binary", false],
  ],
  "surgical-tech": [
    ["sk-st-scrub", "Surgical scrub and gowning", "Sterile technique", "binary", true],
    ["sk-st-count", "Instrument and sponge count", "Sterile technique", "question", true],
    ["sk-st-draping", "Sterile field draping", "Sterile technique", "demonstration", false],
    ["sk-st-passing", "Passing instruments", "Scrub role", "scored", false],
    ["sk-st-specimen", "Specimen handling", "Perioperative care", "binary", false],
    ["sk-st-positioning", "Patient positioning assist", "Perioperative care", null, false, false],
    ["sk-st-turnover", "Room turnover", "Perioperative care", "question", false],
  ],
  paramedic: [
    ["sk-pm-airway", "Basic airway management", "Airway", "demonstration", false],
    ["sk-pm-iv-io", "IV and IO access", "Vascular access", "demonstration", false],
    ["sk-pm-ecg", "12-lead ECG acquisition", "Cardiac", "question", false],
    ["sk-pm-splint", "Traction splinting", "Trauma", "binary", false],
    ["sk-pm-meds", "Medication calculation and delivery", "Pharmacology", "scored", false],
    ["sk-pm-handoff", "Patient handoff to emergency department", "Communication", "scored", false],
    ["sk-pm-scene", "Scene size-up", "Operations", null, false, false],
  ],
}

function buildSkills(): Skill[] {
  const out: Skill[] = []
  for (const specialty of Object.keys(LIBRARIES) as Specialty[]) {
    for (const [id, name, category, model, published, configured] of LIBRARIES[specialty]) {
      const isConfigured = configured ?? model !== null
      out.push({
        id,
        specialty,
        name,
        category,
        model,
        configured: isConfigured,
        published,
        config: isConfigured
          ? id === IDS.ivCath
            ? structuredClone(IV_CONFIG)
            : configFor(model)
          : null,
      })
    }
  }
  return out
}

const MAPPED: Array<[skillId: string, level: MappingRow["level"]]> = [
  [IDS.ivCath, "mandatory"],
  [IDS.urinaryCath, "mandatory"],
  ["sk-med-admin", "mandatory"],
  ["sk-sterile-dressing", "mandatory"],
  ["sk-vitals", "mandatory"],
  ["sk-ng-tube", "optional"],
  ["sk-blood-glucose", "optional"],
  ["sk-handoff", "optional"],
  ["sk-central-line", "not-expected"],
]

type Hist = [skillId: string, outcome: Outcome, setting: Setting, daysAgo: number, evaluator: string, status?: EvaluationStatus]

function mkEval(id: string, studentId: string, h: Hist): Evaluation {
  const [skillId, outcome, setting, daysAgo, evaluatorId, status] = h
  return {
    id,
    studentId,
    skillId,
    evaluatorId,
    setting,
    date: daysBefore(daysAgo),
    status: status ?? "counted",
    outcome,
    currentVersion: 1,
    versions: [{ version: 1, outcome, at: daysBefore(daysAgo), by: evaluatorId, reason: null }],
    // Clinical evidence names its clinical setting (SC-11). Lab and simulation evidence has none, so it can never satisfy one.
    ...(setting === "clinical" ? { clinicalSetting: "Inpatient" } : {}),
  }
}

function buildEvaluations(): { list: Evaluation[]; reopenedId: string } {
  const out: Evaluation[] = []
  // Maya: mostly met, one not-yet, IV catheter and central line still ahead.
  const maya: Hist[] = [
    [IDS.urinaryCath, "met", "clinical", 21, IDS.delgado],
    [IDS.urinaryCath, "met", "clinical", 14, IDS.delgado],
    ["sk-med-admin", "met", "clinical", 28, IDS.delgado],
    ["sk-vitals", "met", "lab", 40, IDS.whitmore],
    ["sk-vitals", "met", "clinical", 12, IDS.delgado],
    ["sk-sterile-dressing", "not-yet", "clinical", 9, IDS.delgado],
    ["sk-blood-glucose", "met", "clinical", 6, IDS.delgado, "awaiting-approval"],
    // A third met vital signs evaluation, so the IV catheter prerequisite "have met vital signs" holds for Maya.
    ["sk-vitals", "met", "clinical", 5, IDS.delgado],
  ]
  maya.forEach((h, i) => out.push(mkEval(`ev-maya-${i + 1}`, IDS.maya, h)))

  const rand = prng(350)
  const pool = ["sk-med-admin", "sk-vitals", "sk-sterile-dressing", "sk-blood-glucose", IDS.urinaryCath, "sk-ng-tube", "sk-handoff"]
  const students = PEOPLE.filter((p) => p.kind === "student" && p.id !== IDS.maya)
  students.forEach((s, si) => {
    const n = 4 + Math.floor(rand() * 5)
    for (let i = 0; i < n; i++) {
      const skillId = pool[Math.floor(rand() * pool.length)]
      const r = rand()
      const outcome: Outcome = r < 0.68 ? "met" : r < 0.86 ? "not-yet" : "not-met"
      const setting: Setting = rand() < 0.2 ? "lab" : rand() < 0.1 ? "simulation" : "clinical"
      out.push(mkEval(`ev-${si + 2}-${i + 1}`, s.id, [skillId, outcome, setting, 3 + Math.floor(rand() * 60), setting === "lab" ? IDS.whitmore : IDS.delgado]))
    }
  })

  // One reopened evaluation with real version history (edit after sign-off keeps versions).
  // The failed attempt that opened the remediation plan.
  out.push(mkEval("ev-rem-1", "stu-04", ["sk-sterile-dressing", "not-met", "clinical", 20, IDS.delgado]))
  const reopened = out.find((e) => e.studentId === "stu-03" && e.outcome === "met")
  if (reopened) {
    reopened.status = "reopened"
    reopened.currentVersion = 2
    reopened.outcome = "not-yet"
    reopened.versions.push({ version: 2, outcome: "not-yet", at: daysBefore(2), by: IDS.reviewer, reason: "Evaluator corrected the outcome after a documentation review." })
  }
  // Two more waiting for approval so the queue has depth.
  for (const sid of ["stu-02", "stu-05"]) {
    const e = out.find((x) => x.studentId === sid && x.status === "counted" && x.outcome === "met")
    if (e) e.status = "awaiting-approval"
  }
  return { list: out, reopenedId: reopened ? reopened.id : "" }
}

function buildSubmissions(): Submission[] {
  return [
    { id: "sub-maya-1", studentId: IDS.maya, skillIds: [IDS.urinaryCath, "sk-med-admin"], method: "qr", status: "with-evaluator", assignedToId: IDS.delgado, createdAt: daysBefore(0), daysWaiting: 0, entryIds: ["log-maya-uc-1"], candidateIds: [IDS.delgado] },
    { id: "sub-02", studentId: "stu-02", skillIds: ["sk-med-admin"], method: "link", status: "awaiting-review", assignedToId: IDS.reviewer, createdAt: daysBefore(3), daysWaiting: 3 },
    { id: "sub-04", studentId: "stu-04", skillIds: ["sk-vitals", "sk-blood-glucose"], method: "photo", status: "awaiting-review", assignedToId: IDS.reviewer, createdAt: daysBefore(2), daysWaiting: 2 },
    { id: "sub-03", studentId: "stu-03", skillIds: ["sk-sterile-dressing"], method: "link", status: "stalled", assignedToId: IDS.delgado, createdAt: daysBefore(9), daysWaiting: 9 },
    { id: "sub-06", studentId: "stu-06", skillIds: ["sk-handoff"], method: "handover", status: "done", assignedToId: IDS.delgado, createdAt: daysBefore(15), daysWaiting: 0 },
  ]
}

const PLACEMENTS: Placement[] = [
  { id: "pl-maya-1", studentId: IDS.maya, courseId: IDS.course, location: "Harbor General, 4 West", setting: "Inpatient" },
  { id: "pl-maya-2", studentId: IDS.maya, courseId: IDS.course, location: "Harbor Outpatient Clinic", setting: "Outpatient" },
]

/**
 * Maya's earlier log. Three IV catheter practice trials in the lab (so the Stage 1 prerequisite "3 practice trials" holds), the
 * last one still queued on her phone, and a note on a urinary catheter entry that two devices edited (a conflict).
 */
function buildLogEntries(): LogEntry[] {
  const base = { studentId: IDS.maya, answers: null, clinicalSetting: null, setting: "lab" as const }
  return [
    { ...base, id: "log-maya-prac-1", skillId: IDS.ivCath, batchId: "lb-seed-1", location: "Skills lab 2", rating: "Needs coaching", note: "", at: daysBefore(21), requestId: null },
    { ...base, id: "log-maya-prac-2", skillId: IDS.ivCath, batchId: "lb-seed-2", location: "Skills lab 2", rating: "Works with prompts", note: "", at: daysBefore(18), requestId: null },
    { ...base, id: "log-maya-prac-3", skillId: IDS.ivCath, batchId: "lb-seed-3", location: "Skills lab 2", rating: "Works with prompts", note: "", at: daysBefore(0), requestId: null },
    {
      ...base,
      id: "log-maya-uc-1",
      skillId: IDS.urinaryCath,
      batchId: "lb-seed-4",
      setting: "clinical" as const,
      clinicalSetting: "Inpatient",
      location: "Harbor General, 4 West",
      rating: "Works with prompts",
      note: "Asked the preceptor to check my sterile technique before I inserted the catheter.",
      at: daysBefore(14),
      requestId: "sub-maya-1",
    },
  ]
}

const LAB_CHECKOFFS: LabCheckoff[] = [{ id: "lc-maya-1", studentId: IDS.maya, skillId: IDS.ivCath, byId: IDS.whitmore, at: daysBefore(30) }]

function buildAudit(reopenedId: string): AuditEntry[] {
  return [
    { id: "au-1", at: daysBefore(30), actorId: IDS.ross, action: "Copied starter library", target: "BSN medical-surgical" },
    { id: "au-2", at: daysBefore(29), actorId: IDS.ross, action: "Mapped skills", target: "NURS 350 Clinical Practicum" },
    { id: "au-3", at: daysBefore(2), actorId: IDS.reviewer, action: "Reopened evaluation", target: reopenedId },
  ]
}

/** A fresh deep copy of the demo data. Every call returns a new object graph. */
export function createSeed(): V2State {
  const evals = buildEvaluations()
  return {
    schema: 1,
    program: { id: "prg-bsn", school: "Harbor University", name: "BSN", cohorts: ["BSN 2027"], clinicalSettings: ["Inpatient", "Emergency", "Outpatient"], simulationSettings: ["Simulation lab", "Standardized patient suite"] },
    course: { id: IDS.course, code: "NURS 350", name: "Clinical Practicum", term: "Fall 2026", cohort: "BSN 2027", clinicalSettings: ["Inpatient", "Outpatient"] },
    people: PEOPLE.map((p) => ({ ...p })),
    skills: buildSkills(),
    mappings: MAPPED.map(([skillId, level]) => ({ courseId: IDS.course, skillId, level })),
    evaluations: evals.list,
    submissions: buildSubmissions(),
    syncQueue: [
      { id: "sy-1", studentId: IDS.maya, label: "Practice trial: IV catheter insertion, lab", state: "queued", at: daysBefore(0), entryId: "log-maya-prac-3" },
      { id: "sy-2", studentId: IDS.maya, label: "Setting confirmed: Harbor General, 4 West", state: "synced", at: daysBefore(0) },
      {
        id: "sy-3",
        studentId: IDS.maya,
        label: "Note on Indwelling urinary catheter insertion",
        state: "conflict",
        at: daysBefore(1),
        entryId: "log-maya-uc-1",
        conflict: {
          field: "note",
          mine: "Asked the preceptor to check my sterile technique before I inserted the catheter.",
          theirs: "Used a 14 Fr catheter. The preceptor stayed for the whole procedure.",
          theirsAt: daysBefore(1),
          theirsBy: "Your other device",
        },
      },
    ],
    concerns: [
      { id: "cn-1", evaluationId: "ev-5-2", studentId: "stu-05", raisedById: IDS.delgado, visibleTo: "faculty-only", note: "Sample concern for the faculty-only flow.", at: daysBefore(4) },
    ],
    remediations: [
      {
        id: "rem-1",
        studentId: "stu-04",
        skillId: "sk-sterile-dressing",
        status: "in-progress",
        steps: [
          { label: "Review the sterile technique module", done: true },
          { label: "Practice session in the skills lab", done: true },
          { label: "Supervised attempt with a preceptor", done: false },
        ],
      },
    ],
    audit: buildAudit(evals.reopenedId),
    batches: [],
    drafts: {},
    stepsReviewed: {},
    placements: PLACEMENTS.map((p) => ({ ...p })),
    logEntries: buildLogEntries(),
    labCheckoffs: LAB_CHECKOFFS.map((c) => ({ ...c })),
    device: { offline: false, signedOut: false, updatePending: false, failNextSync: false },
    logDraft: null,
  }
}
