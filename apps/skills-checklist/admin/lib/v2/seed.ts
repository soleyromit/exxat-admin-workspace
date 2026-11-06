import { ASSISTED_LEVEL, defaultConfig, SAMPLE_LEVELS, SAMPLE_QUESTIONS } from "./config"
import { feedbackText, generate } from "./generate"
import { daysBefore, DEMO_TODAY, HERO_APPROVAL, IDS, prng } from "./seed-core"
import type {
  AuditEntry,
  Course,
  Evaluation,
  EvaluationStatus,
  LabCheckoff,
  LogEntry,
  MappingRow,
  Outcome,
  Person,
  Placement,
  ProgramLocation,
  Setting,
  Skill,
  SkillConfig,
  Specialty,
  Submission,
  V2State,
} from "./types"

/** Bump when the generator changes on purpose: saved deltas made against another seed are then discarded. */
export const SEED_VERSION = "2026-11-05.3-list-baseline"

export { DEMO_TODAY, IDS }

/** Cohort and group of stu-02 to stu-12, in order (sample data for the report filters). */
const STUDENT_GROUP: Array<{ cohort: string; group: string }> = [
  { cohort: "BSN 2027", group: "Group A" },
  { cohort: "BSN 2027", group: "Group A" },
  { cohort: "BSN 2027", group: "Group B" },
  { cohort: "BSN 2027", group: "Group B" },
  { cohort: "BSN 2027", group: "Group B" },
  { cohort: "BSN 2027", group: "Group C" },
  { cohort: "BSN 2027", group: "Group C" },
  { cohort: "ABSN 2027", group: "Group A" },
  { cohort: "ABSN 2027", group: "Group A" },
  { cohort: "ABSN 2027", group: "Group B" },
  { cohort: "ABSN 2027", group: "Group B" },
]

const PEOPLE: Person[] = [
  { id: IDS.ross, name: "A. Ross", title: "Program administrator", kind: "admin", email: "a.ross@harbor.example" },
  { id: IDS.reviewer, name: "L. Haddad", title: "Clinical coordinator", kind: "reviewer", email: "l.haddad@harbor.example" },
  { id: IDS.director, name: "Dr. K. Brennan", title: "Program director", kind: "director", email: "k.brennan@harbor.example" },
  { id: IDS.delgado, name: "J. Delgado, RN", title: "Preceptor, Harbor General", kind: "preceptor", email: "j.delgado@harborgeneral.example", credentials: ["RN"], yearsPractice: 9, training: ["IV therapy"] },
  { id: IDS.whitmore, name: "R. Whitmore", title: "Lab instructor", kind: "lab-instructor", email: "r.whitmore@harbor.example", credentials: ["RN"], yearsPractice: 12, training: ["IV therapy", "Simulation facilitation"] },
  { id: "pre-okonkwo", name: "S. Okonkwo, RN", title: "Preceptor, Harbor General", kind: "preceptor", email: "s.okonkwo@harborgeneral.example", credentials: ["RN"], yearsPractice: 1, training: [] },
  { id: "pre-castillo", name: "M. Castillo, RN", title: "Preceptor, Harbor Outpatient", kind: "preceptor", email: "m.castillo@harboroutpatient.example", credentials: ["RN"], yearsPractice: 4, training: ["IV therapy"] },
  { id: "pre-aldridge", name: "T. Aldridge, LPN", title: "Preceptor, Harbor General", kind: "preceptor", email: "t.aldridge@harborgeneral.example", credentials: ["LPN"], yearsPractice: 6, training: ["IV therapy"] },
  { id: IDS.maya, name: "Maya Ferreira", title: "BSN 2027", kind: "student", email: "m.ferreira@students.harbor.example", cohort: "BSN 2027", group: "Group A" },
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
    title: i < 7 ? "BSN 2027" : "ABSN 2027",
    kind: "student",
    email: `${name.toLowerCase().replace(/[^a-z]+/g, ".")}@students.harbor.example`,
    ...STUDENT_GROUP[i],
  })),
]

function configFor(model: Skill["model"]): SkillConfig {
  const c = defaultConfig(model)
  if (model === "question" || model === "scored") c.questions = [...SAMPLE_QUESTIONS]
  // Every configured question or scored skill says what makes one evaluation count (SEED_VERSION 2026-11-04.1-qualifying-rules, so
  // bulk configure need not tolerate a rule that fails validation). Figures are unchanged: seeded evaluations with every answer Yes
  // are exactly the Met ones, and seeded scored evaluations carry no scores, so they fall back to their outcome.
  if (model === "question") c.questionRule = { kind: "all" }
  if (model === "scored") c.scoredRule = { kind: "average", value: 3 }
  return c
}

const IV_CONFIG: SkillConfig = {
  ...defaultConfig("demonstration"),
  achievement: { kind: "last-n", need: 4, window: 5, minLevelIndex: 2, distinctEvaluators: 2, settingMinimums: [{ setting: "Inpatient", min: 2 }] },
  simulation: { allowed: true, mode: "cap", maxSharePercent: 25, allowList: [] },
  prerequisites: { skillIds: ["sk-vitals"], labCheckoff: true, practiceTrials: 3 },
  qualification: { credentials: ["RN"], minYears: 2, training: ["IV therapy"] },
  failure: { attemptLimit: 3, minDaysBetween: 7, retakeScoreCap: null },
  // Stage 3: the program made narrative feedback mandatory for this skill (SC-14), so the evaluator form shows the rule (EV-06).
  feedbackRequired: true,
}

/**
 * Urinary catheter insertion asks for 2 of its 3 evaluations in Inpatient [REQ SC-11] (SEED_VERSION 2026-10-30.1-setting-minimum),
 * so the demo student's record shows progress against a named setting [REQ SH-05]: one of her two counted evaluations is from the
 * skills lab, which counts toward the evaluations but never toward Inpatient [REQ SC-12].
 */
const URINARY_CONFIG: SkillConfig = {
  ...defaultConfig("demonstration"),
  achievement: { ...defaultConfig("demonstration").achievement, settingMinimums: [{ setting: "Inpatient", min: 2 }] },
}

type SkillSeed = [id: string, name: string, category: string, model: Skill["model"], published: boolean, configured?: boolean]

const LIBRARIES: Record<Specialty, SkillSeed[]> = {
  "adn-hgtc": [],
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

/** Sample program-defined tags (SL-07). Nothing ships: these exist only so the report's tag filter has something to cut across categories. A skill may carry several. */
const TAGS: Record<string, string[]> = {
  [IDS.ivCath]: ["Infection prevention", "Invasive procedures"],
  [IDS.urinaryCath]: ["Infection prevention", "Invasive procedures"],
  "sk-sterile-dressing": ["Infection prevention"],
  "sk-central-line": ["Infection prevention", "Invasive procedures"],
  "sk-ng-tube": ["Invasive procedures"],
  "sk-med-admin": ["Patient safety"],
  "sk-vitals": ["Patient safety"],
  "sk-blood-glucose": ["Patient safety"],
  "sk-handoff": ["Patient safety"],
}

/** Sample places where evidence is gathered, and what each offers (RP-01, RP-09). The names match the placements already in the seed. */
const LOCATIONS: ProgramLocation[] = [
  { name: "Harbor General, 4 West", setting: "clinical", clinicalSetting: "Inpatient" },
  { name: "Harbor General, 5 East", setting: "clinical", clinicalSetting: "Inpatient" },
  { name: "Harbor Outpatient Clinic", setting: "clinical", clinicalSetting: "Outpatient" },
  { name: "Skills lab 2", setting: "lab" },
  { name: "Simulation lab", setting: "simulation" },
]

/** Sample cohorts and groups (RP-01). Maya and the next seven students are BSN 2027; the last four are ABSN 2027. */
const GROUPS: Record<string, string[]> = { "BSN 2027": ["Group A", "Group B", "Group C"], "ABSN 2027": ["Group A", "Group B"] }
const SECOND_COURSE: Course = { id: "crs-nurs352", code: "NURS 352", name: "Skills and Simulation Lab", term: "Fall 2026", cohort: "BSN 2027", clinicalSettings: [] }

/**
 * Skills that ask the student to rate themselves first [REQ SC-15] (SEED_VERSION 2026-10-27.9-self-evaluation). Sterile dressing
 * change is mandatory on NURS 350 and still open for the demo student, so Sankalp's fulfillment path (course, mandatory skills,
 * questions, self-evaluation, send) shows the self-evaluation step. Presentation only: the engine never reads the flag, so no
 * figure in facts.ts moves.
 */
// Nasogastric tube care: the sample skill of the student and evaluator walkthrough, where the self-evaluation is seen (D-L67).
const SELF_EVALUATION = new Set(["sk-sterile-dressing", "sk-ng-tube"])

/**
 * The demo program's saved Evaluation settings (D-L72, D0): Prism ships no default, this is the sample program's own save, so the
 * Evaluation settings stop no longer starts empty while the Library shows configured skills. The values are what most of the seeded
 * library already uses. A LabRule by shape; tests/lab/seed-program-settings.test.ts holds it
 * to lib/lab/program-settings.ts.
 */
export const SEED_PROGRAM_RULE = {
  model: "demonstration",
  outcomeLabels: ["Met", "Unmet"],
  qualifyingLabel: 0,
  questions: [],
  questionRule: null,
  scaleMax: 5,
  scoredRule: null,
  levels: [...SAMPLE_LEVELS],
  need: 1,
  levelMinimums: [],
  distinctEvaluators: 1,
  settingMinimums: [],
  studentFields: [{ label: "Date performed", type: "date", mandatory: true }],
  feedbackRequired: false,
  selfEvaluation: true,
  approvalRequired: false,
  evaluatorRoles: ["preceptor", "faculty"],
  checkOff: { enabled: null, levelIndex: null, score: null },
  carried: { window: null, minLevelIndex: 0, simulationCapPercent: null, simulationExcluded: false },
} as const

/**
 * The sample skills that start Edited (D-L94: about 12, so the exception looks like an exception). Each is here for a reason the rest of the
 * prototype reads:
 * - Approval before it counts: the eight skills behind the Approvals queue's "Approval required" reason [REQ SC-15, AR-01].
 * - Nasogastric tube care: the student and evaluator walkthrough's skill, questions with self-evaluation (D-L67, D-L68).
 * - Sterile dressing change: the question skill of the demo student's answered evaluations.
 * - Hangs Large Vol. and Changes Primary IV Tubing: "levels that count" starts one level up, as the generator wrote them.
 *
 * Straight cath, one of the eight, is also task E15's fixture (`SEED_RESET_FIXTURE`): an Edited skill whose reset changes who has achieved it.
 */
export const SEED_EDITED: ReadonlySet<string> = new Set([
  "sk-med-admin",
  "sk-blood-glucose",
  "hgtc-safety-16",
  "hgtc-nutrition-08",
  "hgtc-elimination-07",
  "hgtc-elimination-10",
  "hgtc-elimination-12",
  "hgtc-elimination-15",
  "sk-ng-tube",
  "sk-sterile-dressing",
  "hgtc-nutrition-11",
  "hgtc-nutrition-12",
])

/**
 * An Edited skill whose edit changes who has achieved it (map F, E15): "levels that count" starts one level up, and one student's evaluations on it are
 * at the lowest level, so that student has not achieved it until the skill goes back to the default. One record moves against the generated data.
 */
export const SEED_RESET_FIXTURE = "hgtc-elimination-07"

function withResetFixture(s: V2State): V2State {
  const first = s.evaluations.find((e) => e.skillId === SEED_RESET_FIXTURE && e.status === "counted" && e.outcome === "met")
  if (!first) return s
  return {
    ...s,
    skills: s.skills.map((k) => (k.id === SEED_RESET_FIXTURE && k.config ? { ...k, config: { ...k.config, achievement: { ...k.config.achievement, minLevelIndex: 1 } } } : k)),
    evaluations: s.evaluations.map((e) => (e.skillId === SEED_RESET_FIXTURE && e.studentId === first.studentId ? { ...e, levelIndex: 0 } : e)),
  }
}

/**
 * One seeded skill on the program's settings (map D0 rules 3, 4, 5). The package comes from the program; what stays per skill stays: times
 * needed, setting and level minimums, different evaluators, and the limits carried from the earlier rule. Written by hand because this file
 * cannot import lib/lab/configure (it imports the store, which imports this file); tests/lab/seed-program-settings.test.ts holds the result to
 * `differsFromProgram`. Evidence is untouched: the engine reads an evaluation with no level or answers on its recorded outcome.
 */
function onProgramPackage(k: Skill): Skill {
  const c = k.config ?? defaultConfig("demonstration")
  const a = c.achievement
  const { selfEvaluation: _s, questionRule: _q, scoredRule: _r, qualifyingLabel: _l, checkOff: _o, scaleMax: _m, studentFields: _f, ...rest } = c
  return {
    ...k,
    model: "demonstration",
    configured: true,
    published: true,
    config: {
      ...rest,
      outcomeLabels: ["Met", "Not met"],
      questions: [],
      levels: [...SAMPLE_LEVELS],
      // No number of its own yet: the program's (D0 rule 6).
      achievement: { ...a, need: k.config ? a.need : SEED_PROGRAM_RULE.need, minLevelIndex: null },
      evaluatorRoles: [...SEED_PROGRAM_RULE.evaluatorRoles],
      feedbackRequired: false,
      approvalRequired: false,
    },
  }
}

/**
 * Configuration for the seed (D-L89, D-L90, D-L94, map D0). Runs after generation, so the evidence is what it was. A dozen skills are Edited;
 * every other skill is on the default configuration, with no standing exception [D-L90]. Moving them can change report figures: the before and
 * after are pinned in tests/lab/seed-program-settings.test.ts.
 */
function withProgramSettings(s: V2State): V2State {
  const skills = s.skills.map((k): Skill => (SEED_EDITED.has(k.id) ? { ...k, published: true, edited: true } : onProgramPackage(k)))
  return withResetFixture({ ...s, skills, programSettings: { rule: structuredClone(SEED_PROGRAM_RULE), at: `${DEMO_TODAY}T08:00:00Z` } })
}

const NURS350 = "crs-nurs350"
const NUR120 = "crs-nur120"
const VASCULAR_FEEDBACK = ["Good landmarking and a clean first pass.", "Secured the site well. Keep narrating the steps to the patient.", "Safe technique, explained each step.", "Confident and independent throughout."]

/**
 * Evidence for the two vascular skills the generator leaves out (`SKIP` in generate.ts), which came into use with D-L90. IV catheter insertion is mandatory on NURS 350, so with no evidence it lowered
 * every student on that course by one required skill. Each NURS 350 student now holds evaluations in step with how far along they already are on that course's other mandatory skills: about 4 of every
 * 13 evaluations they hold, all 4 from 10 up. Two or more come from Inpatient with two evaluators, so the rule (4 of the last 5, 2 evaluators, 2 in Inpatient) can be met. Central line dressing change,
 * recommended on NUR 120, gets a spread among that course's students. Before and after: tests/v2/seed-spread.test.ts, tests/lab/seed-program-settings.test.ts.
 */
function withVascularEvidence(s: V2State): V2State {
  const clinical = ["pre-delgado", "pre-okonkwo", "pre-castillo"].filter((id) => s.people.some((p) => p.id === id))
  const added: Evaluation[] = []
  const write = (studentId: string, skillId: string, courseId: string, n: number, salt: number) => {
    const place = s.placements.find((x) => x.studentId === studentId && x.courseId === courseId && x.termId === "trm-fa26")
    const location = place?.setting === "Inpatient" ? place.location : "Harbor General, 4 West"
    for (let k = 0; k < n; k++) {
      const evaluatorId = clinical[(salt + k) % clinical.length]!
      const at = daysBefore(9 + ((salt * 3 + k * 11) % 40))
      // The earliest attempt was with some help; the rest alone.
      const levelIndex = k === 0 ? 1 : 2
      added.push({
        ...mkEval(`ev-${skillId.slice(3)}-${studentId.slice(4)}-${k + 1}`, studentId, [skillId, "met", "clinical", 0, evaluatorId]),
        date: at,
        location,
        courseId,
        levelIndex,
        versions: [{ version: 1, outcome: "met", at, by: evaluatorId, reason: null, detail: { feedback: VASCULAR_FEEDBACK[(salt + k) % VASCULAR_FEEDBACK.length]!, levelIndex } }],
      })
    }
  }
  const needOf = new Map(s.skills.map((k) => [k.id, k.config?.achievement.need ?? 0]))
  const mandatory = s.mappings.filter((m) => m.courseId === NURS350 && m.level === "mandatory" && m.skillId !== IDS.ivCath).map((m) => m.skillId)
  const inCohort = (cohort: string) => s.people.filter((p) => p.kind === "student" && p.cohortId === cohort)
  inCohort("coh-2027").forEach((p, i) => {
    const held = mandatory.reduce((sum, id) => sum + Math.min(needOf.get(id) ?? 0, s.evaluations.filter((e) => e.studentId === p.id && e.skillId === id && e.status === "counted" && e.outcome === "met").length), 0)
    write(p.id, IDS.ivCath, NURS350, held >= 10 ? 4 : Math.round((held * 4) / 13), i)
  })
  const CENTRAL_SPREAD = [3, 2, 1, 3, 0, 1, 2, 3, 0, 2]
  inCohort("coh-2028").slice(0, 30).forEach((p, i) => write(p.id, "sk-central-line", NUR120, CENTRAL_SPREAD[i % CENTRAL_SPREAD.length]!, i))
  return { ...s, evaluations: [...s.evaluations, ...added] }
}

/** The share of the skill list each generated cohort holds by now, before each student's own standing: the same clock lib/v2/population.ts programShare reads. Written here to keep this file free of it. */
const LIST_CLOCK: Record<string, number> = { "coh-2027": 0.62, "coh-2028": 0.28 }
/** How far a student's standing moves them against that share: the weakest and the strongest in the cohort. About a quarter fall behind. */
const LIST_STANDING: Record<string, [low: number, high: number]> = { "coh-2027": [0.72, 1.3], "coh-2028": [0.4, 1.5] }
/** Skills left rare on purpose, the least evidenced of the checklist: a real program has procedures few students ever get to perform. */
const LIST_RARE = 26
/** Skills that also carry one attempt that did not count, per student, so all four record states show on a list of 150. */
const LIST_UNMET = 3

/**
 * Evidence for the skills a cohort has done in earlier terms (SEED_VERSION 2026-11-05.3, D-L102). My progress now reads the skill list, 152 skills over three calendar
 * years, so a student in their second or third year must hold more than this term's. Runs last, so nothing before it moves; touches BSN 2027 and BSN 2028 only (the
 * graduating cohort keeps its story) and never a skill mandatory for the cohort this term, a Custom skill or an inactive one, so every "Mandatory this term" figure and every
 * pinned approval stay as they were. Each student keeps their rank in the cohort. Maya sits on the clock. Evidence is dated inside the student's earlier rotations.
 */
function withListBaseline(s: V2State): V2State {
  const rand = prng(2611)
  const pool = new Map<string, number>()
  for (const e of s.evaluations) pool.set(e.evaluatorId, (pool.get(e.evaluatorId) ?? 0) + 1)
  // Evaluators already in regular use: the long tail of rarely used evaluators stays a long tail, and names not adopted yet stay out.
  const sites = s.sites ?? []
  const siteOf = new Map(sites.map((x) => [x.id, x]))
  const siteAt = new Map(sites.map((x) => [x.location, x]))
  const regular = s.people.filter((p) => (pool.get(p.id) ?? 0) >= 12 && p.verified !== false && p.homeSiteId)
  const preceptors = regular.filter((p) => p.kind === "preceptor" && siteOf.get(p.homeSiteId!)?.clinicalSetting)
  const atSite = new Map<string, Person[]>()
  for (const p of preceptors) atSite.set(p.homeSiteId!, [...(atSite.get(p.homeSiteId!) ?? []), p])
  const inpatient = preceptors.filter((p) => siteOf.get(p.homeSiteId!)?.clinicalSetting === "Inpatient")
  const labs = regular.filter((p) => p.kind === "lab-instructor")
  const checklist = s.skills.filter((k) => k.hgtc && k.active !== false && k.configured && k.published)
  // Offered to a student only if none of the stories below read it: approvals (Custom skills) and the nine students behind in IV therapy.
  const offered = checklist.filter((k) => !SEED_EDITED.has(k.id) && k.hgtc?.group !== "IV Therapy")
  const evidence = new Map<string, number>()
  for (const e of s.evaluations) evidence.set(e.skillId, (evidence.get(e.skillId) ?? 0) + 1)
  const rare = new Set([...offered].sort((a, b) => (evidence.get(a.id) ?? 0) - (evidence.get(b.id) ?? 0) || a.id.localeCompare(b.id)).slice(0, LIST_RARE).map((k) => k.id))
  // This file cannot import the engine (it imports this file): met counted evaluations against the need is near enough to place a student on the clock.
  const met = new Map<string, number>()
  for (const e of s.evaluations) if (e.status === "counted" && e.outcome === "met") met.set(`${e.studentId}|${e.skillId}`, (met.get(`${e.studentId}|${e.skillId}`) ?? 0) + 1)
  const holds = (p: Person, k: Skill) => (met.get(`${p.id}|${k.id}`) ?? 0) >= k.config!.achievement.need
  const added: Evaluation[] = []
  const addedPlacements: Placement[] = []
  let comments = 0
  const pick = <T,>(xs: readonly T[]): T => xs[Math.floor(rand() * xs.length)]!
  const courseKind = new Map((s.courses ?? []).map((c) => [c.id, c.kind]))
  const earlierTerms = (s.terms ?? []).filter((x) => x.end < "2026-08-24")
  const dayIn = (a: string, b: string) => {
    const from = Date.parse(`${a}T12:00:00Z`)
    return `${new Date(from + Math.floor(rand() * Math.max(1, (Date.parse(`${b}T12:00:00Z`) - from) / 86_400_000)) * 86_400_000).toISOString().slice(0, 10)}T09:00:00.000Z`
  }
  const add = (p: Person, k: Skill, n: number, outcome: Outcome, spots: readonly Placement[]) => {
    const a = k.config!.achievement
    const used = new Set<string>()
    const clinicalOnly = a.settingMinimums.length > 0 || !k.config!.simulation.allowed
    for (let i = 0; i < n; i++) {
      const spot = pick(spots)
      const lab = !clinicalOnly && labs.length > 0 && rand() < 0.25
      const needsInpatient = a.settingMinimums.some((m) => m.setting === "Inpatient")
      const here = atSite.get(siteAt.get(spot.location)?.id ?? "") ?? []
      const fits = !needsInpatient || siteAt.get(spot.location)?.clinicalSetting === "Inpatient"
      const from = lab ? labs : fits && here.length ? here : needsInpatient ? inpatient : preceptors
      let who = pick(from)
      for (let t = 0; t < 20 && used.has(who.id) && a.distinctEvaluators > 1; t++) who = pick(a.distinctEvaluators > 1 && !lab ? preceptors : from)
      used.add(who.id)
      const site = siteOf.get(who.homeSiteId!)!
      const at = dayIn(spot.startDate, spot.endDate)
      const levelIndex = k.config!.levels.length > 2 ? 2 : undefined
      const feedback = rand() < 0.3 ? feedbackText(comments++, outcome) : undefined
      added.push({
        ...mkEval(`ev-l-${p.id.replace(/^stu-/, "")}-${added.length + 1}`, p.id, [k.id, outcome, lab ? "lab" : "clinical", 0, who.id]),
        date: at,
        location: site.location,
        siteId: site.id,
        courseId: spot.courseId,
        ...(lab ? {} : { clinicalSetting: site.clinicalSetting ?? "Inpatient" }),
        ...(levelIndex !== undefined ? { levelIndex } : {}),
        versions: [{ version: 1, outcome, at, by: who.id, reason: null, ...(feedback ? { detail: { feedback, ...(levelIndex !== undefined ? { levelIndex } : {}) } } : {}) }],
      })
    }
  }
  for (const [cohortId, clock] of Object.entries(LIST_CLOCK)) {
    const [low, high] = LIST_STANDING[cohortId]!
    const offerings = (s.offerings ?? []).filter((o) => o.cohortId === cohortId && (courseKind.get(o.courseId) ?? "clinical") === "clinical")
    const thisTerm = new Set((s.offerings ?? []).filter((o) => o.cohortId === cohortId && o.termId === "trm-fa26").map((o) => o.courseId))
    const mandatory = new Set(s.mappings.filter((m) => thisTerm.has(m.courseId) && m.level === "mandatory").map((m) => m.skillId))
    const open = offered.filter((k) => !rare.has(k.id) && !mandatory.has(k.id))
    const onList = (p: Person) => checklist.reduce((n, k) => n + (holds(p, k) ? 1 : 0), 0)
    const students = s.people.filter((p) => p.kind === "student" && p.cohortId === cohortId).map((p) => ({ p, have: onList(p) })).sort((a, b) => a.have - b.have || a.p.id.localeCompare(b.p.id))
    students.forEach(({ p, have }, rank) => {
      const standing = p.id === IDS.maya ? 1 : low + ((high - low) * rank) / Math.max(1, students.length - 1)
      const want = Math.round(checklist.length * clock * standing)
      // The commonest procedures come first, with each student's own order among them.
      const order = open.filter((k) => !holds(p, k)).map((k) => ({ k, at: rand() - (evidence.get(k.id) ?? 0) / 200 })).sort((a, b) => a.at - b.at).map((x) => x.k)
      const take = order.slice(0, Math.max(0, want - have))
      // Earlier rotations: the ones on record, or, for a hand-written student, one per earlier term at a site their cohort uses.
      let spots = s.placements.filter((x) => x.studentId === p.id && earlierTerms.some((y) => y.id === x.termId))
      if (!spots.length) {
        spots = earlierTerms.flatMap((term) => {
          const o = offerings.find((y) => y.termId === term.id && y.courseId !== s.course.id)
          const site = pick(inpatient).homeSiteId ? siteOf.get(pick(inpatient).homeSiteId!) : undefined
          return o && site ? [{ id: `pl-l-${p.id.replace(/^stu-/, "")}-${term.id}`, studentId: p.id, courseId: o.courseId, offeringId: o.id, location: site.location, siteId: site.id, setting: site.clinicalSetting ?? "Inpatient", termId: term.id, startDate: term.start, endDate: term.end } as Placement] : []
        })
        addedPlacements.push(...spots)
      }
      if (!spots.length) return
      for (const k of take) add(p, k, k.config!.achievement.need, "met", spots)
      for (const k of order.slice(take.length, take.length + LIST_UNMET)) add(p, k, 1, "not-yet", spots)
    })
  }
  return { ...s, evaluations: [...s.evaluations, ...added], placements: [...s.placements, ...addedPlacements] }
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
        ...(TAGS[id] ? { tags: [...TAGS[id]] } : {}),
        config: isConfigured
          ? id === IDS.ivCath
            ? structuredClone(IV_CONFIG)
            : id === IDS.urinaryCath
              ? structuredClone(URINARY_CONFIG)
              : SELF_EVALUATION.has(id)
              ? { ...configFor(model), selfEvaluation: true }
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

/** Why the reviewer returned Maya's bedside handoff evaluation (hero story, sub-maya-2). */
export const MAYA_RETURN_REASON = "The signed form is missing the date. Add it and send the request again."

const MAND = [IDS.urinaryCath, "sk-med-admin", "sk-sterile-dressing", "sk-vitals"]
const OPT = ["sk-ng-tube", "sk-blood-glucose", "sk-handoff"]
/** Clinical evaluators other than the demo preceptor, and the weights that keep any one person under a third of the history. */
const RATERS: Array<[id: string, weight: number]> = [
  [IDS.delgado, 22],
  ["pre-okonkwo", 22],
  ["pre-castillo", 20],
  ["pre-aldridge", 18],
  [IDS.reviewer, 6],
]

/**
 * What each sample student has done so far. `met` is the number of Met evaluations in [urinary catheter, oral medication,
 * sterile dressing, vital signs] (the four mandatory skills in use, three Met each to achieve), `miss` the Not yet or Not met
 * attempts, `opt` the evaluations on optional skills. The spread (2 to 10 of 12 needed; Grace Tanaka and Ethan Cole have nothing pending, so their records can be verified) gives pace and attainment charts something
 * to show; the term is about half gone, so 6 are expected and 5 or fewer is behind.
 */
const PLAN: Record<string, { met: [number, number, number, number]; miss: number; opt: number }> = {
  "stu-02": { met: [3, 3, 2, 0], miss: 2, opt: 2 },
  "stu-03": { met: [3, 1, 0, 0], miss: 3, opt: 1 },
  "stu-04": { met: [1, 1, 0, 1], miss: 2, opt: 1 },
  "stu-05": { met: [3, 3, 0, 1], miss: 2, opt: 3 },
  "stu-06": { met: [3, 3, 3, 1], miss: 1, opt: 3 },
  "stu-07": { met: [2, 0, 0, 0], miss: 3, opt: 0 },
  "stu-08": { met: [3, 0, 3, 0], miss: 2, opt: 2 },
  "stu-09": { met: [3, 0, 1, 0], miss: 2, opt: 1 },
  "stu-10": { met: [0, 0, 0, 2], miss: 3, opt: 1 },
  "stu-11": { met: [3, 1, 0, 2], miss: 2, opt: 2 },
  "stu-12": { met: [3, 3, 3, 0], miss: 1, opt: 3 },
}

function buildEvaluations(): { list: Evaluation[]; reopenedId: string } {
  const out: Evaluation[] = []
  // Maya: mostly met, one not-yet, IV catheter and central line still ahead.
  const maya: Hist[] = [
    [IDS.urinaryCath, "met", "clinical", 21, IDS.delgado],
    // Skills lab, before her placement: it counts toward the 3 evaluations, never toward the 2 the rule asks for in Inpatient.
    [IDS.urinaryCath, "met", "lab", 24, IDS.whitmore],
    ["sk-med-admin", "met", "clinical", 28, IDS.delgado],
    ["sk-vitals", "met", "lab", 40, IDS.whitmore],
    ["sk-vitals", "met", "clinical", 12, IDS.delgado],
    ["sk-sterile-dressing", "not-yet", "clinical", 9, IDS.delgado],
    ["sk-blood-glucose", "met", "clinical", 6, IDS.delgado, "awaiting-approval"],
    // A third met vital signs evaluation, so the IV catheter prerequisite "have met vital signs" holds for Maya.
    ["sk-vitals", "met", "clinical", 5, IDS.delgado],
    // Hero story (added 2026-10-26, dataset spec section 12): a did-not-qualify attempt with a failed rule. The latest sterile
    // dressing attempt is Unmet, so the skill reads "Evidence does not qualify" and the rule states what is missing.
    ["sk-sterile-dressing", "not-met", "clinical", 3, "pre-okonkwo"],
    // And a returned submission: the reviewer returned her bedside handoff evaluation for a missing date (sub-maya-2).
    ["sk-handoff", "met", "clinical", 6, "pre-okonkwo", "returned"],
  ]
  maya.forEach((h, i) => out.push(mkEval(`ev-maya-${i + 1}`, IDS.maya, h)))
  const mayaReturned = out.find((e) => e.id === "ev-maya-10")
  if (mayaReturned) {
    mayaReturned.submissionId = "sub-maya-2"
    mayaReturned.review = { decision: "returned", byId: IDS.reviewer, at: daysBefore(4), note: MAYA_RETURN_REASON }
  }
  // Per-question answers on Maya's two sterile dressing attempts (SEED_VERSION 2026-10-26.8-question-answers, dataset spec section
  // 14), in the order of the skill's questions (hand hygiene, clean field, explained each step). The seed publishes no question
  // rule, so both still qualify on their recorded outcome and no figure changes; once a program publishes "at least 2 of 3 answered
  // Yes", the first becomes one valid attempt and the second does not (the "2 of 3 questions" demo, end to end).
  const mayaQ1 = out.find((e) => e.id === "ev-maya-6")
  if (mayaQ1) mayaQ1.versions[0].detail = { answers: ["yes", "yes", "no"], feedback: "Good hand hygiene and a clean field. Talk the patient through each step next time." }
  const mayaQ2 = out.find((e) => e.id === "ev-maya-9")
  if (mayaQ2) mayaQ2.versions[0].detail = { answers: ["yes", "no", "no"], feedback: "The field was contaminated when the dressing pack touched the bed rail. Start again with a new pack." }

  const rand = prng(350)
  const totalWeight = RATERS.reduce((n, r) => n + r[1], 0)
  const pickRater = () => {
    let x = rand() * totalWeight
    for (const [id, w] of RATERS) if ((x -= w) < 0) return id
    return RATERS[0][0]
  }
  const students = PEOPLE.filter((p) => p.kind === "student" && p.id !== IDS.maya)
  students.forEach((s, si) => {
    const plan = PLAN[s.id]
    const items: Array<{ skillId: string; outcome: Outcome; t: number }> = []
    plan.met.forEach((n, k) => {
      for (let i = 0; i < n; i++) items.push({ skillId: MAND[k], outcome: "met", t: rand() })
    })
    for (let i = 0; i < plan.miss; i++) {
      const pool = [...MAND, ...OPT]
      items.push({ skillId: pool[Math.floor(rand() * pool.length)], outcome: rand() < 0.62 ? "not-yet" : "not-met", t: rand() * 0.8 })
    }
    for (let i = 0; i < plan.opt; i++) items.push({ skillId: OPT[(i + si) % OPT.length], outcome: rand() < 0.82 ? "met" : "not-yet", t: rand() })
    items.sort((a, b) => a.t - b.t)
    // Spread over the weeks of the term so far (55 down to 3 days ago); a student's own pace shows in how many fall in each week.
    items.forEach((it, i) => {
      const daysAgo = Math.round(54 - ((i + rand() * 0.9) / items.length) * 51)
      // Nasogastric tube care rests on one evaluator (the outpatient preceptor), so the single-rater flag has something real to show.
      // Bedside handoff is part simulation. The core skills draw on several evaluators.
      const setting: Setting = it.skillId === "sk-handoff" ? (rand() < 0.4 ? "simulation" : "clinical") : rand() < 0.11 ? "lab" : "clinical"
      const drawn = it.skillId === "sk-ng-tube" ? "pre-castillo" : setting === "clinical" ? pickRater() : IDS.whitmore
      // Urinary catheter insertion asks for Inpatient evidence (URINARY_CONFIG), so its clinical evaluations come from an inpatient
      // preceptor, never the outpatient one. No extra draw, so every later value in the stream is unchanged.
      const evaluatorId = it.skillId === IDS.urinaryCath && drawn === "pre-castillo" ? "pre-aldridge" : drawn
      const e = mkEval(`ev-${si + 2}-${i + 1}`, s.id, [it.skillId, it.outcome, setting, daysAgo, evaluatorId])
      if (setting === "clinical" && evaluatorId === "pre-castillo") e.clinicalSetting = "Outpatient"
      out.push(e)
    })
  })

  // The failed attempt that opened the remediation plan.
  out.push(mkEval("ev-rem-1", "stu-04", ["sk-sterile-dressing", "not-met", "clinical", 20, IDS.delgado]))
  // One reopened evaluation with real version history (edit after sign-off keeps versions).
  const reopened = mkEval("ev-reopen-1", "stu-03", ["sk-med-admin", "met", "clinical", 16, "pre-okonkwo"])
  reopened.status = "reopened"
  reopened.currentVersion = 2
  reopened.outcome = "not-yet"
  reopened.versions.push({ version: 2, outcome: "not-yet", at: daysBefore(2), by: IDS.reviewer, reason: "Evaluator corrected the outcome after a documentation review." })
  out.push(reopened)
  // Stage 4: Maya's blood glucose evaluation, waiting for approval, keeps the evaluator's words so the compare view has something to show.
  const mayaWaiting = out.find((e) => e.id === "ev-maya-7")
  if (mayaWaiting) mayaWaiting.versions[0].detail = { feedback: "Used the meter correctly and cleaned the site first. Wait for the full reading before you document it." }
  // Stage 4: a request completed through a link and held for approval (sub-02), so the queue holds an item with a self-rating to compare.
  const held = mkEval("ev-rq-1", "stu-02", ["sk-med-admin", "met", "clinical", 3, IDS.delgado, "awaiting-approval"])
  held.submissionId = "sub-02"
  held.clinicalSetting = "Inpatient"
  held.versions[0].detail = { feedback: "Checked the five rights aloud and confirmed the allergy band before giving the dose." }
  out.push(held)
  // More requests waiting in the queue, completed by different evaluators on different days (ages 1 to 12 days).
  for (const q of QUEUED) {
    q.skills.forEach(([skillId, outcome], i) => {
      const e = mkEval(`ev-${q.sub}-${i + 1}`, q.studentId, [skillId, outcome, "clinical", q.age, q.evaluatorId, "awaiting-approval"])
      e.submissionId = q.sub
      if (q.evaluatorId === "pre-castillo") e.clinicalSetting = "Outpatient"
      e.versions[0].detail = { feedback: q.feedback }
      out.push(e)
    })
  }
  // A counted evaluation on a skill that asks for approval (HERO_APPROVAL, SC-15) was approved by the reviewer: it carries the approval.
  for (const e of out) if (e.status === "counted" && !e.review && HERO_APPROVAL.has(e.skillId)) e.review = { decision: "approved", byId: IDS.reviewer, at: e.date, note: "" }
  // Where and in which course each piece of evidence was gathered (RP-08), consistent with its setting and named clinical setting.
  for (const e of out) {
    if (e.location) continue
    if (e.setting === "lab") e.location = "Skills lab 2"
    else if (e.setting === "simulation") e.location = "Simulation lab"
    else e.location = e.clinicalSetting === "Outpatient" ? "Harbor Outpatient Clinic" : e.evaluatorId === IDS.delgado ? "Harbor General, 4 West" : "Harbor General, 5 East"
    if (e.setting !== "clinical") e.courseId = SECOND_COURSE.id
  }
  return { list: out, reopenedId: reopened.id }
}

/** Requests completed by an evaluator and held for approval, beyond sub-02. `age` is days since the evaluator finished. */
const QUEUED: Array<{ sub: string; studentId: string; skills: Array<[string, Outcome]>; method: Submission["method"]; evaluatorId: string; age: number; feedback: string; rating: string[]; note: string }> = [
  { sub: "sub-07", studentId: "stu-05", skills: [["sk-blood-glucose", "met"]], method: "qr", evaluatorId: "pre-okonkwo", age: 1, feedback: "Checked the meter calibration first and repeated the low reading before reporting it.", rating: ["Met"], note: "" },
  { sub: "sub-08", studentId: "stu-06", skills: [["sk-blood-glucose", "met"]], method: "handover", evaluatorId: "pre-castillo", age: 5, feedback: "Good site choice and a clean technique. Record the time of the reading right away.", rating: ["Met"], note: "Used the clinic meter for the first time." },
  { sub: "sub-09", studentId: "stu-09", skills: [["sk-med-admin", "met"]], method: "link", evaluatorId: "pre-aldridge", age: 8, feedback: "Verified the patient with two identifiers before the dose.", rating: ["Not met"], note: "I skipped the second identifier at first." },
  { sub: "sub-10", studentId: "stu-10", skills: [["sk-blood-glucose", "met"], ["sk-med-admin", "not-yet"]], method: "qr", evaluatorId: "pre-okonkwo", age: 10, feedback: "The glucose reading was accurate. For the medication, re-check the order against the chart before you pour.", rating: ["Met", "Met"], note: "" },
  { sub: "sub-11", studentId: "stu-07", skills: [["sk-blood-glucose", "met"]], method: "link", evaluatorId: IDS.delgado, age: 12, feedback: "Independent and organised. No prompts needed.", rating: ["Met"], note: "" },
]

function buildSubmissions(): Submission[] {
  const fromQueued = QUEUED.map((q): Submission => ({
    id: q.sub,
    studentId: q.studentId,
    skillIds: q.skills.map(([k]) => k),
    method: q.method,
    status: "awaiting-review",
    assignedToId: IDS.reviewer,
    createdAt: daysBefore(q.age + 1),
    daysWaiting: q.age,
    entryIds: q.skills.map((_, i) => `log-${q.sub}-${i + 1}`),
    candidateIds: [q.evaluatorId],
    completedById: q.evaluatorId,
    completedAt: daysBefore(q.age),
  }))
  return [
    { id: "sub-maya-1", studentId: IDS.maya, skillIds: [IDS.urinaryCath, "sk-med-admin"], method: "qr", status: "with-evaluator", assignedToId: IDS.delgado, createdAt: daysBefore(0), daysWaiting: 0, entryIds: ["log-maya-uc-1"], candidateIds: [IDS.delgado] },
    // Hero story (2026-10-26): Maya's returned submission, with who returned it and why, so "Fix a returned submission" demos for her.
    { id: "sub-maya-2", studentId: IDS.maya, skillIds: ["sk-handoff"], method: "link", status: "returned", assignedToId: "pre-okonkwo", createdAt: daysBefore(7), daysWaiting: 4, candidateIds: ["pre-okonkwo"], completedById: "pre-okonkwo", completedAt: daysBefore(6), revisions: 0, returns: [{ at: daysBefore(4), byId: IDS.reviewer, reason: MAYA_RETURN_REASON, revision: 1 }] },
    { id: "sub-02", studentId: "stu-02", skillIds: ["sk-med-admin"], method: "link", status: "awaiting-review", assignedToId: IDS.reviewer, createdAt: daysBefore(3), daysWaiting: 3, entryIds: ["log-stu02-1"], candidateIds: [IDS.delgado], completedById: IDS.delgado, completedAt: daysBefore(3) },
    { id: "sub-04", studentId: "stu-04", skillIds: ["sk-vitals", "sk-blood-glucose"], method: "photo", status: "awaiting-review", assignedToId: IDS.reviewer, createdAt: daysBefore(2), daysWaiting: 2, photo: { name: "signed-form-vitals-glucose.jpg", sizeKb: 842 } },
    // A signed paper form from a clinic site that still needs its outcome entered.
    { id: "sub-12", studentId: "stu-08", skillIds: ["sk-vitals"], method: "photo", status: "awaiting-review", assignedToId: IDS.reviewer, createdAt: daysBefore(7), daysWaiting: 7, photo: { name: "signed-form-vitals.jpg", sizeKb: 611 } },
    { id: "sub-03", studentId: "stu-03", skillIds: ["sk-sterile-dressing"], method: "link", status: "stalled", assignedToId: IDS.delgado, createdAt: daysBefore(9), daysWaiting: 9, candidateIds: [IDS.delgado] },
    ...fromQueued,
    { id: "sub-06", studentId: "stu-06", skillIds: ["sk-handoff"], method: "handover", status: "done", assignedToId: IDS.delgado, createdAt: daysBefore(15), daysWaiting: 0 },
    { id: "sub-13", studentId: "stu-02", skillIds: ["sk-vitals"], method: "qr", status: "done", assignedToId: "pre-okonkwo", createdAt: daysBefore(22), daysWaiting: 0 },
    { id: "sub-14", studentId: "stu-12", skillIds: ["sk-ng-tube"], method: "link", status: "done", assignedToId: "pre-castillo", createdAt: daysBefore(30), daysWaiting: 0 },
    { id: "sub-15", studentId: "stu-09", skillIds: ["sk-sterile-dressing"], method: "handover", status: "done", assignedToId: "pre-aldridge", createdAt: daysBefore(36), daysWaiting: 0 },
  ]
}

/**
 * Maya's two Fall 2026 rotations for the focus course (dataset spec section 12): the first finished before the demo day, the
 * second is current and ends within PLACEMENT_ENDING_DAYS of it, so the "placement ending" cue has a real date to read.
 */
const PLACEMENTS: Placement[] = [
  { id: "pl-maya-1", studentId: IDS.maya, courseId: IDS.course, location: "Harbor General, 4 West", setting: "Inpatient", termId: "trm-fa26", startDate: "2026-08-31", endDate: "2026-10-09" },
  { id: "pl-maya-2", studentId: IDS.maya, courseId: IDS.course, location: "Harbor Outpatient Clinic", setting: "Outpatient", termId: "trm-fa26", startDate: "2026-10-12", endDate: "2026-11-13" },
]

/**
 * Maya's earlier log. Three IV catheter practice trials in the lab (so the Stage 1 prerequisite "3 practice trials" holds), the
 * last one still queued on her phone, and a note on a urinary catheter entry that two devices edited (a conflict).
 */
function buildLogEntries(): LogEntry[] {
  const base = { studentId: IDS.maya, answers: null, clinicalSetting: null, setting: "lab" as const }
  return [
    { ...base, id: "log-maya-prac-1", skillId: IDS.ivCath, batchId: "lb-seed-1", location: "Skills lab 2", rating: "Needs coaching", note: "", at: daysBefore(21), requestId: null },
    { ...base, id: "log-maya-prac-2", skillId: IDS.ivCath, batchId: "lb-seed-2", location: "Skills lab 2", rating: ASSISTED_LEVEL, note: "", at: daysBefore(18), requestId: null },
    { ...base, id: "log-maya-prac-3", skillId: IDS.ivCath, batchId: "lb-seed-3", location: "Skills lab 2", rating: ASSISTED_LEVEL, note: "", at: daysBefore(0), requestId: null },
    {
      ...base,
      id: "log-maya-uc-1",
      skillId: IDS.urinaryCath,
      batchId: "lb-seed-4",
      setting: "clinical" as const,
      clinicalSetting: "Inpatient",
      location: "Harbor General, 4 West",
      rating: ASSISTED_LEVEL,
      note: "Asked the preceptor to check my sterile technique before I inserted the catheter.",
      at: daysBefore(14),
      requestId: "sub-maya-1",
    },
    // Stage 4: Jordan Okafor rated herself Not met on oral medication administration; the evaluator said Met (a difference to compare).
    ...QUEUED.flatMap((q) =>
      q.skills.map(([skillId], i): LogEntry => ({
        ...base,
        id: `log-${q.sub}-${i + 1}`,
        studentId: q.studentId,
        skillId,
        batchId: `lb-${q.sub}`,
        setting: "clinical" as const,
        clinicalSetting: q.evaluatorId === "pre-castillo" ? "Outpatient" : "Inpatient",
        location: q.evaluatorId === "pre-castillo" ? "Harbor Outpatient Clinic" : "Harbor General, 5 East",
        rating: q.rating[i],
        note: i === 0 ? q.note : "",
        at: daysBefore(q.age + 1),
        requestId: q.sub,
      })),
    ),
    { ...base, id: "log-stu02-1", studentId: "stu-02", skillId: "sk-med-admin", batchId: "lb-seed-5", setting: "clinical" as const, clinicalSetting: "Inpatient", location: "Harbor General, 5 East", rating: "Not met", note: "I was nervous and checked the order twice.", at: daysBefore(4), requestId: "sub-02" },
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

/** The hand-written hero layer: the named people, the 14 scenario steps' starting conditions and their history. Byte-stable. */
export function buildHero(): V2State {
  const evals = buildEvaluations()
  return {
    schema: 1,
    program: { id: "prg-bsn", school: "Harbor University", name: "BSN", cohorts: ["BSN 2027", "ABSN 2027"], clinicalSettings: ["Inpatient", "Emergency", "Outpatient"], simulationSettings: ["Simulation lab", "Standardized patient suite"], locations: LOCATIONS.map((l) => ({ ...l })), groups: structuredClone(GROUPS) },
    course: { id: IDS.course, code: "NURS 350", name: "Clinical Practicum", term: "Fall 2026", cohort: "BSN 2027", clinicalSettings: ["Inpatient", "Outpatient"] },
    otherCourses: [{ ...SECOND_COURSE }],
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
        evaluationId: "ev-rem-1",
        openedAt: daysBefore(20),
        openedById: IDS.delgado,
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
    verifications: [],
    labBatches: [],
  }
}

/** A fresh deep copy of the demo data: the hero layer plus the deterministic generated cohort. Every call returns a new object graph. */
export function createSeed(): V2State {
  return withListBaseline(withProgramSettings(withVascularEvidence(generate(buildHero()))))
}

/**
 * The data as generated, before the sample program's save: skills with no model, unpublished skills, no Evaluation settings. Never read by a page. Test
 * fixtures of the engine use it for a skill in those states, which the seeded program no longer has (D-L90).
 */
export function createGeneratedSeed(): V2State {
  return generate(buildHero())
}
