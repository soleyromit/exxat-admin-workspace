import { IDS } from "./seed"
import type { RoleId, V2State } from "./types"

/**
 * The 14 story steps of the Harbor University BSN scenario. `reqIds` only lists IDs that exist in
 * docs/source/requirements.extracted.txt (a test enforces it). `proposed` names ideas that go beyond the
 * requirements; those live as [PROPOSED] in docs/v2 and are never shown as such in the UI.
 */
export interface ScenarioStep {
  n: number
  id: string
  role: RoleId
  title: string
  summary: string
  route: string
  /** Requirement IDs the step is traced to. */
  reqIds: string[]
  /** Short names of proposed (non-requirement) capabilities the step needs, for the traceability doc. */
  proposed: string[]
  /** Which build stage replaces the foundation page with the real screen. */
  stage: number
  /** Counter ids from lib/v2/selectors.ts shown on the foundation page. */
  counters: string[]
  precondition: { text: string; check: (s: V2State) => boolean }
}

const has = (s: V2State, id: string) => s.skills.some((k) => k.id === id)

export const STEPS: ScenarioStep[] = [
  {
    n: 1,
    id: "starter-library",
    role: "admin",
    title: "Copy a specialty starter library",
    summary: "A. Ross brings in skills for the BSN medical-surgical track. The other three specialties sit beside it.",
    route: "/v2/admin/starter-library",
    reqIds: ["SL-01", "IM-01", "IM-09", "IM-10", "IM-11", "IM-14"],
    proposed: ["Specialty starter libraries"],
    stage: 1,
    counters: ["skills", "libraries", "unconfigured"],
    precondition: { text: "Four specialty libraries hold at least 28 skills.", check: (s) => s.skills.length >= 28 && new Set(s.skills.map((k) => k.specialty)).size === 4 },
  },
  {
    n: 2,
    id: "configure-skill",
    role: "admin",
    title: "Configure IV catheter insertion",
    summary: "Choose the evaluation model, name the levels, set the achievement rule, simulation share, prerequisites and who may sign off.",
    route: "/v2/admin/configure-skill",
    reqIds: ["SC-01", "SC-02", "SC-08", "SC-10", "SC-11", "SC-12", "SC-15", "SC-16", "SC-17"],
    proposed: ["Last-N achievement rule", "Simulation share cap", "Prerequisites", "Evaluator qualification", "Failure path", "Event-based revalidation"],
    stage: 1,
    counters: ["skills", "unconfigured", "published"],
    precondition: { text: "IV catheter insertion exists with a model and program-named levels.", check: (s) => !!s.skills.find((k) => k.id === IDS.ivCath)?.config?.levels.length },
  },
  {
    n: 3,
    id: "validate-publish",
    role: "admin",
    title: "Fix validation errors, then publish",
    summary: "Review everything the skill will ask of students and evaluators. A skill that cannot be satisfied does not publish.",
    route: "/v2/admin/validate-publish",
    reqIds: ["SC-18", "SC-19", "IM-09"],
    proposed: [],
    stage: 1,
    counters: ["unconfigured", "published"],
    precondition: { text: "IV catheter insertion is configured and not yet in use.", check: (s) => { const k = s.skills.find((x) => x.id === IDS.ivCath); return !!k && k.configured && !k.published } },
  },
  {
    n: 4,
    id: "map-courses",
    role: "admin",
    title: "Map skills to NURS 350",
    summary: "Mark each skill mandatory, optional or not expected for the course, and see coverage warnings.",
    route: "/v2/admin/map-courses",
    reqIds: ["CM-01", "CM-03", "CM-04", "CM-05", "CM-06"],
    proposed: ["Coverage warnings"],
    stage: 1,
    counters: ["mapped", "mandatory"],
    precondition: { text: "NURS 350 has mapped skills.", check: (s) => s.mappings.some((m) => m.courseId === s.course.id) },
  },
  {
    n: 5,
    id: "pick-and-rate",
    role: "student",
    title: "See what is left, pick two skills and self-rate",
    summary: "Maya sees her remaining skills on her phone, picks IV catheter insertion and one more, confirms the setting and rates herself.",
    route: "/v2/student/pick-and-rate",
    reqIds: ["ST-01", "ST-04", "ST-05", "ST-06", "ST-11", "ST-12", "ST-13"],
    proposed: ["Mobile bottom navigation"],
    stage: 2,
    counters: ["mandatory", "evalsCounted", "withEvaluator"],
    precondition: { text: "Maya Ferreira is in the cohort with mandatory skills outstanding.", check: (s) => s.people.some((p) => p.id === IDS.maya) && s.mappings.some((m) => m.level === "mandatory") },
  },
  {
    n: 6,
    id: "request-signoff",
    role: "student",
    title: "Ask for sign-off",
    summary: "Maya chooses how the request reaches the evaluator: QR code, handing over her phone, a link, or a photo of a signed paper form that goes to review.",
    route: "/v2/student/request-signoff",
    reqIds: ["ST-08", "ST-09", "ST-10", "EV-01"],
    proposed: ["QR sign-off", "Photo of signed paper form"],
    stage: 2,
    counters: ["withEvaluator", "queueWaiting"],
    precondition: { text: "Maya has a request open with J. Delgado covering two skills.", check: (s) => s.submissions.some((x) => x.studentId === IDS.maya && x.skillIds.length === 2) },
  },
  {
    n: 7,
    id: "offline-sync",
    role: "student",
    title: "Work offline and resolve a conflict",
    summary: "Changes made without a signal wait in a queue. When two versions of a note disagree, Maya picks which one to keep.",
    route: "/v2/student/offline-sync",
    reqIds: [],
    proposed: ["Offline queue", "Sync conflict resolution"],
    stage: 2,
    counters: ["syncQueued", "syncSynced", "syncConflict"],
    precondition: { text: "The sync queue holds queued, synced and conflict items.", check: (s) => ["queued", "synced", "conflict"].every((st) => s.syncQueue.some((i) => i.state === st)) },
  },
  {
    n: 8,
    id: "preceptor-evaluation",
    role: "preceptor",
    title: "Evaluate both skills in one pass",
    summary: "J. Delgado opens the link with no account, records an outcome for each skill, may choose not yet with feedback, can flag a confidential concern and attests to credentials.",
    route: "/v2/preceptor/preceptor-evaluation",
    reqIds: ["EV-01", "EV-03", "EV-04", "EV-05", "EV-06", "EV-07"],
    proposed: ["Not yet, feedback only", "Confidential concern flag", "Credential attestation"],
    stage: 3,
    counters: ["withEvaluator", "concerns"],
    precondition: { text: "A request with two skills is waiting for J. Delgado.", check: (s) => s.submissions.some((x) => x.status === "with-evaluator" && x.assignedToId === IDS.delgado && x.skillIds.length >= 2) },
  },
  {
    n: 9,
    id: "outcome-remediation",
    role: "reviewer",
    title: "See the outcome, remediation and version history",
    summary: "A pass updates progress and reports. A fail opens a remediation plan. Editing a signed-off evaluation reopens it and keeps every version.",
    route: "/v2/reviewer/outcome-remediation",
    reqIds: ["RV-03", "SH-02", "SH-03", "AE-01", "AE-03", "AE-04"],
    proposed: ["Remediation plan", "Reopen with version history"],
    stage: 3,
    counters: ["remediations", "evalsReopened", "versions"],
    precondition: { text: "One remediation plan is in progress and one evaluation has two versions.", check: (s) => s.remediations.some((r) => r.status === "in-progress") && s.evaluations.some((e) => e.versions.length > 1) },
  },
  {
    n: 10,
    id: "review-queue",
    role: "reviewer",
    title: "Clear the review queue",
    summary: "Approve in bulk, compare the student and evaluator side by side, return with a reason, or reassign a stalled request.",
    route: "/v2/reviewer/review-queue",
    reqIds: ["AR-01", "AR-02", "AR-03", "AR-04", "AR-05", "AR-06", "RV-02", "RV-04"],
    proposed: ["Bulk approve", "Reassign stalled request"],
    stage: 4,
    counters: ["queueWaiting", "stalled", "evalsWaiting", "returned"],
    precondition: { text: "The queue holds requests awaiting review and one stalled request.", check: (s) => s.submissions.some((x) => x.status === "awaiting-review") && s.submissions.some((x) => x.status === "stalled") },
  },
  {
    n: 11,
    id: "director-verification",
    role: "director",
    title: "Verify the program record",
    summary: "Dr. Brennan checks a student's record and verifies it so it can be shared outside the program.",
    route: "/v2/director/director-verification",
    reqIds: ["AE-03", "RP-07"],
    proposed: ["Program director verification"],
    stage: 4,
    counters: ["verified", "evalsCounted", "students"],
    precondition: { text: "Counted evidence exists for Maya.", check: (s) => s.evaluations.some((e) => e.studentId === IDS.maya && e.status === "counted") },
  },
  {
    n: 12,
    id: "reports",
    role: "admin",
    title: "Read cohort reports",
    summary: "Heatmap, students behind expected pace, observations and distinct raters per skill, rater comparison, simulation share and a signed PDF.",
    route: "/v2/admin/reports",
    reqIds: ["RP-01", "RP-02", "RP-03", "RP-05", "RP-06", "RP-07", "RP-08", "RP-09", "RP-10"],
    proposed: ["Cohort heatmap", "Pace behind expected", "Single-rater flag", "Rater comparison", "Simulation share", "Tamper-evident signed PDF"],
    stage: 5,
    counters: ["students", "evalsCounted", "evalsWaiting"],
    precondition: { text: "Twelve students hold evaluation history.", check: (s) => s.people.filter((p) => p.kind === "student").length >= 12 && s.evaluations.length > 30 },
  },
  {
    n: 13,
    id: "verified-record",
    role: "student",
    title: "Share the verified record",
    summary: "Maya shares her verified record as a PDF or as a CLR 2.0 credential.",
    route: "/v2/student/verified-record",
    reqIds: ["SH-01", "SH-06", "SH-07", "RP-10"],
    proposed: ["CLR 2.0 export"],
    stage: 5,
    counters: ["evalsCounted", "reviewed"],
    precondition: { text: "Maya has evaluations that count.", check: (s) => s.evaluations.some((e) => e.studentId === IDS.maya && e.status === "counted") },
  },
  {
    n: 14,
    id: "lab-batch-grid",
    role: "preceptor",
    title: "Record a lab session for a group",
    summary: "R. Whitmore taps cells to cycle Met, Not met and Not yet for the group. Absent students are handled. Lab never counts toward a clinical setting minimum.",
    route: "/v2/preceptor/lab-batch-grid",
    reqIds: ["EV-02", "EV-05", "SC-12", "ST-05"],
    proposed: ["Lab batch grid", "Absent student handling"],
    stage: 5,
    counters: ["students", "evalsCounted"],
    precondition: { text: "R. Whitmore is on record as a lab instructor.", check: (s) => s.people.some((p) => p.id === IDS.whitmore && p.kind === "lab-instructor") },
  },
]

export const STEP_BY_ID: Record<string, ScenarioStep> = Object.fromEntries(STEPS.map((x) => [x.id, x]))

export function stepsForRole(role: RoleId): ScenarioStep[] {
  return STEPS.filter((x) => x.role === role)
}

export function stepForRoute(role: string, slug: string): ScenarioStep | undefined {
  return STEPS.find((x) => x.role === role && x.id === slug)
}
