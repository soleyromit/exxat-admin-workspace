// Course Mapping (P-09) and Review & Approve (P-10) copy, taken from Sankalp's prototype (docs/build/prototype-parity.md,
// docs/source/parity/100-114). Romit (2026-10-08): build the exact mockup, so these strings are the prototype's, including
// its em-dashes and its wording. They are NOT covered by the voice test in tests/copy (that test guards the earlier,
// contract-derived copy); tests/ui/mapping and tests/ui/review pin these strings to the prototype instead.
// Conflict resolutions [INFER] (parity spec §6): C-2 the button and banner stay neutral on who corrects (OD-16 open);
// C-3 a newly mapped skill defaults to Mandatory.
import type { Db, Id, Skill, CourseOffering } from "@/lib/domain/types"
import type { CriteriaPart } from "@/lib/store/selectors/shared"

// ---- Course mapping (P-09) -------------------------------------------------------------------------------------

export const protoMapping = {
  title: "Course Mapping",
  subtitle: "Set which skills are mandatory for each clinical course offering",
  /** The two bold words are rendered as <strong> by the component; this is the full plain sentence. */
  banner: {
    before: "Mapping a skill to an offering marks it as ",
    mandatory: "mandatory",
    middle: " or ",
    nonMandatory: "non-mandatory",
    after:
      " for that course. Neither setting restricts where a skill can be evaluated — students may still request evaluations for skills outside the mapping, and evidence counts toward one skill record shared across courses.",
  },
  offeringsHeading: "Clinical course offerings",
  offeringsMatch: (n: number, total: number) => `${n} of ${total} offerings match · count shows mandatory / total`,
  clear: "Clear",
  searchOfferings: "Search by course code or name",
  filterLabels: { cohort: "Cohort", year: "Academic year", term: "Term", prof: "Professional year" },
  all: { cohort: "All cohorts", year: "All years", term: "All terms", prof: "All professional years" },
  noCohort: "No cohort enrolled",
  noMatch: "No course offerings match these filters.",
  skillMode: (skill: string, n: number) => `Offerings where ${skill} is mapped (${n})`,
  chooseOffering: "Choose a course offering",
  chooseOfferingBody: "Select an offering to see and change the skills it expects.",
  offeringNotFound: "This offering was not found",
  panelTitle: (code: string) => `Skills mapped — ${code}`,
  panelSubline: (name: string, term: string, year: number, prof: number, mandatory: number, non: number) =>
    `${name} · ${term} ${year} · Year ${prof} — ${mandatory} mandatory, ${non} non-mandatory`,
  searchSkills: "Search skills",
  mapSkill: (skill: string) => `Map ${skill}`,
  segmentLabel: (skill: string) => `Requirement for ${skill}`,
  mandatory: "Mandatory",
  nonMandatory: "Non-mandatory",
  alsoMapped: (list: string, more: number) => `Also mapped in ${list}${more > 0 ? ` and ${more} more` : ""} — one student-level skill record is shared across courses.`,
  saved: "Saved",
  notSaved: "This change was not saved. Try again.",
  evidenceKept: "Evidence already recorded for this skill is kept.",
  noSkillMatch: "No skills match this search.",
  configureInLibrary: "Configure skills in the library",
  emptyNoCohort: "No cohort is enrolled in this offering yet. You can still map skills.",
  emptyNoSkills: "No configured skills are available to map. Configure skills in the library first.",
  models: { binary: "Overall Binary Outcome", question: "Question-Level Qualitative", scored: "Scored / Likert", demonstration: "Demonstration-Level Outcome" } as const,
} as const

/** Prototype's achievement-criteria text: "5 demonstrations · 1 observed · 1 with assistance · 3 independent". */
export function protoCriteria(parts: CriteriaPart[]): string {
  if (parts.length === 0) return "No criteria set"
  return parts
    .map((p) => {
      switch (p.kind) {
        case "required":
          return p.noun === "demonstrations" ? `${p.n} ${p.n === 1 ? "demonstration" : "demonstrations"}` : `${p.n} qualifying ${p.n === 1 ? "evaluation" : "evaluations"}`
        case "level":
          return `${p.min} ${p.label.toLowerCase()}`
        case "setting":
          return `${p.min} in ${p.name}`
      }
    })
    .join(" · ")
}

/** Calendar year of a term inside an academic year: Fall belongs to the first year, Spring and Summer to the second ("2026-2027": Fall 2026, Spring 2027). */
export function termYear(o: Pick<CourseOffering, "term" | "academicYear">): number {
  const [a, b] = o.academicYear.split("-").map(Number)
  return o.term === "Fall" ? a : b ?? a
}

export const offeringTitle = (o: Pick<CourseOffering, "code" | "name">) => `${o.code} — ${o.name}`
export const offeringMeta = (o: CourseOffering, cohortNames: string[]) =>
  `${o.term} ${termYear(o)} · Year ${o.professionalYear} · ${cohortNames.length ? cohortNames.join(", ") : protoMapping.noCohort}`

const TERM_ORDER: Record<string, number> = { Spring: 1, Summer: 2, Fall: 3 }
/** "NURS 350 (Fall 2025)" in chronological order, then by code; the first three are named and the rest counted. */
export function alsoMappedList(db: Db, others: Array<{ offeringId: Id }>): { list: string; more: number } {
  const offs = others
    .map((o) => db.offerings.find((x) => x.id === o.offeringId))
    .filter((o): o is CourseOffering => !!o)
    .sort((a, b) => termYear(a) - termYear(b) || TERM_ORDER[a.term] - TERM_ORDER[b.term] || a.code.localeCompare(b.code))
  const named = offs.slice(0, 3).map((o) => `${o.code} (${o.term} ${termYear(o)})`)
  return { list: named.join(", "), more: Math.max(0, offs.length - 3) }
}

export const modelBadge = (s: Skill): string => (s.model ? protoMapping.models[s.model.kind] : "")

// ---- Review & Approve (P-10) -----------------------------------------------------------------------------------

export const protoReview = {
  title: "Review & Approve",
  subtitle: "Approve submitted evaluations for skills that require it",
  banner: "Evaluations appear here only for skills where the program turned on administrator review. Everything else counts as soon as the preceptor submits it.",
  cardTitle: (student: string, skill: string) => `${student} — ${skill}`,
  metaClinical: (code: string, setting: string, location: string, date: string, by: string, role: string) =>
    `${code} · Clinical (${[setting, location].filter(Boolean).join(", ")}) · submitted ${date} by ${by} (${role})`,
  metaLab: (code: string, date: string, by: string, role: string) => `${code} · Lab / Simulation · submitted ${date} by ${by} (${role})`,
  qualifies: "Qualifies",
  doesNotQualify: "Does not qualify",
  studentNotes: "Student notes",
  studentSelf: "Student self-evaluation",
  agreeSame: (role: string) => `Student and ${role.toLowerCase()} recorded the same outcome.`,
  agreeDiffer: (role: string) => `Student and ${role.toLowerCase()} recorded different outcomes — worth a conversation before approving.`,
  evaluatorOnly: (role: string) => `No student self-evaluation was recorded. Only the ${role.toLowerCase()}'s assessment is shown.`,
  expand: "See the full responses",
  noteLabel: "Review note",
  noteHelper: "Optional. Kept with the evaluation.",
  returnLabel: "Return for correction",
  approve: "Approve",
  dismiss: "Dismiss",
  approved: (skill: string, student: string) => `Approved ${skill} for ${student} — it now counts toward achievement.`,
  /** C-2 [INFER]: the prototype says "to the preceptor ... until resubmitted"; neutral about who corrects while OD-16 is open. */
  returned: (skill: string, student: string) => `Returned ${skill} for ${student} for correction. It does not count until the correction is complete.`,
  emptyTitle: "Nothing awaiting review",
  emptyBody: "Submitted evaluations for skills configured with administrator review will appear here.",
  emptyAction: "Configure review on a skill",
  error: "The review queue could not be loaded.",
  notSaved: "This decision was not saved. Your note is kept. Try again.",
  approving: "Approving",
  returning: "Returning",
  alreadyDecided: (decision: "approved" | "returned") => (decision === "approved" ? "This evaluation has already been approved." : "This evaluation has already been returned for correction."),
  notWaiting: "This evaluation is not waiting for approval.",
  waiting: (n: number) => `${n} ${n === 1 ? "evaluation is" : "evaluations are"} waiting for review.`,
} as const
