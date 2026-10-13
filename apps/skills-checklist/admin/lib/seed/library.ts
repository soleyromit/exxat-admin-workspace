// SAMPLE library data for demos and tests only. SL-01: Prism ships no skills, categories or taxonomy;
// none of this is a recommended or standard list. Categories and tags are neutral placeholders.
import type { Category, ClinicalSetting, LabInstructor, Location, NamedLabInstructor, Skill, Tag } from "@/lib/domain/types"
import type { Criteria, ModelConfig } from "@/lib/engine"

export const SEED_CREATED = "2026-03-01T09:00:00.000Z"

export const CATEGORIES: Category[] = [
  { id: "cat-a", name: "Category A", description: "Sample category", active: true },
  { id: "cat-b", name: "Category B", description: "Sample category", active: true },
  { id: "cat-c", name: "Category C", description: "Sample category", active: true },
]

export const TAGS: Tag[] = [
  { id: "tag-a", name: "Tag A", description: "Sample tag", active: true },
  { id: "tag-b", name: "Tag B", description: "Sample tag", active: true },
  { id: "tag-c", name: "Tag C", description: "Sample tag", active: true },
  // SL-06: inactive but still assigned to a skill, so the "remains, flagged inactive" case is exercisable.
  { id: "tag-d", name: "Tag D", description: "Sample tag (inactive)", active: false },
]

export const SETTINGS: ClinicalSetting[] = [
  { id: "set-inpatient", name: "Inpatient", active: true },
  { id: "set-emergency", name: "Emergency", active: true },
  { id: "set-outpatient", name: "Outpatient clinic", active: true },
  { id: "set-periop", name: "Perioperative", active: true },
  { id: "set-community", name: "Community or home", active: true },
]

export const LOCATIONS: Location[] = [
  { id: "loc-riverside", name: "Riverside Medical Center", settingIds: ["set-inpatient", "set-emergency", "set-periop"] },
  { id: "loc-staubin", name: "St. Aubin Hospital", settingIds: ["set-inpatient", "set-emergency"] },
  { id: "loc-northgate", name: "Northgate Surgical Center", settingIds: ["set-periop", "set-outpatient"] },
  { id: "loc-lakeside", name: "Lakeside Community Clinic", settingIds: ["set-outpatient", "set-community"] },
  { id: "loc-harbor", name: "Harbor Family Practice", settingIds: ["set-outpatient"] },
  // RP-09: offers only Community, so (Mercy Home Health + Emergency) can never have evidence.
  { id: "loc-mercy", name: "Mercy Home Health", settingIds: ["set-community"] },
]

export const LAB_INSTRUCTORS: LabInstructor[] = [
  { id: "lab-ferreira", name: "T. Ferreira", email: "t.ferreira@example.edu", active: true },
  { id: "lab-larsen", name: "K. Larsen", email: "k.larsen@example.edu", active: true },
]

export const NAMED_LAB_INSTRUCTORS: NamedLabInstructor[] = [
  { id: "named-whitmore", name: "R. Whitmore", email: "r.whitmore@example.edu", namedByStudentId: "stu-07", adoptedAs: null },
]

const ALL_ROLES = ["preceptor", "clinical_faculty", "lab_instructor"]
const noCriteria = (n: number | null, extra: Partial<Criteria> = {}): Criteria => ({
  requiredCount: n,
  levelMinimums: {},
  settingMinimums: {},
  ...extra,
})

const q = (skill: string, texts: string[]) => texts.map((text, i) => ({ id: `${skill}-q${i + 1}`, text }))

const base = (id: string, name: string, over: Partial<Skill>): Skill => ({
  id,
  name,
  description: "Sample skill definition. Defined by the program.",
  categoryId: null,
  tagIds: [],
  active: true,
  model: null,
  criteria: noCriteria(null),
  requiresApproval: false,
  allowedRoles: ALL_ROLES,
  submissionFields: [{ id: `${id}-f-date`, label: "Completion date", type: "date", required: true }],
  evaluatorComment: "optional",
  selfEvaluation: false,
  importBatchId: null,
  createdAt: SEED_CREATED,
  ...over,
})

const demoModelIv: ModelConfig = {
  kind: "demonstration",
  levels: [
    { id: "iv-l1", label: "Observed" },
    { id: "iv-l2", label: "With assistance" },
    { id: "iv-l3", label: "Independent" },
  ],
}
const demoModelWound: ModelConfig = {
  kind: "demonstration",
  levels: [
    { id: "wound-l1", label: "Performed with supervision" },
    { id: "wound-l2", label: "Performed independently" },
  ],
}

export const SKILLS: Skill[] = [
  base("sk-iv", "IV Insertion", {
    categoryId: "cat-a",
    tagIds: ["tag-a", "tag-b"],
    model: demoModelIv,
    criteria: noCriteria(5, { levelMinimums: { "iv-l1": 1, "iv-l2": 1, "iv-l3": 3 } }),
    requiresApproval: true,
    selfEvaluation: true,
    evaluatorComment: "mandatory",
    submissionFields: [
      { id: "sk-iv-f-date", label: "Completion date", type: "date", required: true },
      { id: "sk-iv-f-unit", label: "Unit", type: "shortText", required: true },
    ],
  }),
  base("sk-foley", "Foley Catheter Insertion", {
    categoryId: "cat-b",
    tagIds: ["tag-a", "tag-c"],
    model: {
      kind: "question",
      questions: q("foley", ["Performs appropriate preparation", "Performs the procedure correctly", "Maintains appropriate technique"]),
      rule: { kind: "subset", questionIds: ["foley-q2", "foley-q3"] },
    },
    criteria: noCriteria(3),
  }),
  base("sk-dressing", "Sterile Dressing Change", {
    categoryId: "cat-c",
    tagIds: ["tag-a"],
    model: { kind: "binary", labels: { a: { id: "a", label: "Met" }, b: { id: "b", label: "Unmet" } }, qualifyingLabelId: "a" },
    criteria: noCriteria(3),
  }),
  base("sk-h2t", "Head-to-Toe Assessment", {
    categoryId: "cat-a",
    tagIds: ["tag-b"],
    model: {
      kind: "scored",
      questions: q("h2t", ["Systematic approach", "Accuracy of findings", "Communication with the patient"]),
      scale: { min: 1, max: 5, step: 1 },
      rule: { kind: "average", min: 3 },
    },
    criteria: noCriteria(2),
  }),
  base("sk-med", "Medication Administration", {
    categoryId: "cat-b",
    tagIds: ["tag-b", "tag-c"],
    model: {
      kind: "question",
      questions: q("med", ["Verifies the order", "Checks the patient identity", "Prepares the dose", "Documents the administration"]),
      rule: { kind: "atLeast", n: 3 },
    },
    requiresApproval: true,
    criteria: noCriteria(3),
    submissionFields: [
      { id: "sk-med-f-date", label: "Completion date", type: "date", required: true },
      { id: "sk-med-f-unit", label: "Unit", type: "shortText", required: false },
    ],
  }),
  base("sk-vitals", "Vital Signs Assessment", {
    categoryId: "cat-c",
    // Includes the inactive tag-d: it stays visible on the skill, flagged inactive (SL-06).
    tagIds: ["tag-b", "tag-d"],
    model: {
      kind: "binary",
      labels: { a: { id: "a", label: "Satisfactory" }, b: { id: "b", label: "Needs improvement" } },
      qualifyingLabelId: "a",
    },
    requiresApproval: true,
    criteria: noCriteria(2),
    evaluatorComment: "mandatory",
  }),
  base("sk-wound", "Wound Care", {
    categoryId: "cat-a",
    tagIds: ["tag-a"],
    model: demoModelWound,
    // DEFECT-07 case: 4 demonstrations, 1 supervised, 2 independent, 1 in Inpatient and 1 in Emergency.
    criteria: noCriteria(4, {
      levelMinimums: { "wound-l1": 1, "wound-l2": 2 },
      settingMinimums: { "set-inpatient": 1, "set-emergency": 1 },
    }),
    allowedRoles: ["preceptor", "clinical_faculty"],
  }),
  base("sk-trach", "Tracheostomy Care", {
    categoryId: "cat-b",
    tagIds: ["tag-c"],
    model: {
      kind: "scored",
      questions: q("trach", ["Maintains sterile technique", "Responds to complications"]),
      scale: { min: 1, max: 5, step: 1 },
      rule: { kind: "minPerQuestion", min: 3 },
    },
    requiresApproval: true,
    criteria: noCriteria(2),
  }),
  base("sk-recon", "Medication Reconciliation", {
    categoryId: "cat-c",
    tagIds: ["tag-c"],
    model: { kind: "binary", labels: { a: { id: "a", label: "Met" }, b: { id: "b", label: "Unmet" } }, qualifyingLabelId: "a" },
    criteria: noCriteria(1),
  }),
  // Lab-only skill: signed off only by a lab instructor, no clinical-setting minimum (so it is satisfiable, BL-1).
  base("sk-o2", "Oxygen Therapy Administration", {
    tagIds: [],
    model: { kind: "binary", labels: { a: { id: "a", label: "Met" }, b: { id: "b", label: "Unmet" } }, qualifyingLabelId: "a" },
    criteria: noCriteria(2),
    allowedRoles: ["lab_instructor"],
  }),
  // IM-09: unconfigured skills, arrived by import. Cannot be mapped or submitted against.
  base("sk-ng", "Nasogastric Tube Insertion", { description: "Placement and confirmation per program policy.", importBatchId: "imp-1" }),
  base("sk-glucose", "Blood Glucose Monitoring", { description: "Capillary sampling and result interpretation.", importBatchId: "imp-1" }),
]
