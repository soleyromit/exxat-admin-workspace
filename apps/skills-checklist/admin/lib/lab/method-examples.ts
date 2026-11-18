/**
 * Starting points for a new evaluation method (Evaluation settings L; Proposed, D-EM1116-g; contract ADMIN-D3 "round 6 variants").
 *
 * An example is a filled-in sample the program picks on purpose and then edits: nothing is chosen for it [REQ SC-02]. Each one fills names
 * (the label sets of `LABEL_PRESETS` [CALL 10-26 B.3]) and the choices its tile states in words, so what is filled is what was read. It never
 * fills who can evaluate [REQ SC-16] or the text of a question [REQ SC-04]: those are the program's own, and leaving them empty means Create
 * cannot be pressed straight through [INFER]. Open for Romit and Sankalp: whether an example may state which outcome qualifies [REQ SC-03
 * "must be recorded explicitly"]; here the tile says it and Save records it.
 */
import type { EvalModel } from "@/lib/v2/types"
import { LABEL_PRESETS, emptyRule, withModel, type LabRule } from "./configure"

export interface MethodExample {
  id: string
  model: EvalModel
  /** The method's starting name; the program renames it. */
  name: string
  /** What the evaluator picks, in the order they see it; `forward` marks what moves a student forward. Null when the program writes its own questions. */
  picks: Array<{ label: string; forward: boolean }> | null
  /** One or two short facts the tile states and the example fills. */
  facts: string[]
  build: () => LabRule
}

const levels = (names: string[], from: number, more: Partial<LabRule> = {}): LabRule => {
  const r = withModel(emptyRule(), "demonstration")
  return { ...r, levels: [...names], carried: { ...r.carried, minLevelIndex: from }, ...more }
}
const outcomes = (labels: [string, string], more: Partial<LabRule> = {}): LabRule => ({ ...withModel(emptyRule(), "binary"), outcomeLabels: [...labels] as [string, string], qualifyingLabel: 0, ...more })

/** Highest first, as the evaluator sees them; levels are stored lowest first. */
const levelPicks = (names: string[], from: number) => names.map((label, i) => ({ label, forward: i >= from })).reverse()

const INDEPENDENCE = LABEL_PRESETS.independence.levels!
const AACN = LABEL_PRESETS.aacn.levels!
const MET = LABEL_PRESETS.metnotmet.outcomes!
const APPROVED = LABEL_PRESETS.approval.outcomes!

export const METHOD_EXAMPLES: MethodExample[] = [
  {
    id: "ex-levels",
    model: "demonstration",
    name: "Supervision levels",
    picks: levelPicks(INDEPENDENCE, 2),
    facts: [],
    build: () => levels(INDEPENDENCE, 2),
  },
  {
    id: "ex-levels-self",
    model: "demonstration",
    name: "Developmental levels, self-rated",
    picks: levelPicks(AACN, 1),
    facts: ["The student rates themselves first"],
    build: () => levels(AACN, 1, { selfEvaluation: true }),
  },
  {
    id: "ex-met",
    model: "binary",
    name: "Met or unmet",
    picks: [{ label: MET[0], forward: true }, { label: MET[1], forward: false }],
    facts: [],
    build: () => outcomes(MET),
  },
  {
    id: "ex-approved",
    model: "binary",
    name: "Approved, with review",
    picks: [{ label: APPROVED[0], forward: true }, { label: APPROVED[1], forward: false }],
    facts: ["An admin approves before it counts"],
    build: () => outcomes(APPROVED, { approvalRequired: true }),
  },
  {
    id: "ex-checklist",
    model: "question",
    name: "Checklist",
    picks: null,
    facts: ["You write the questions", "Every question must be Yes"],
    build: () => ({ ...withModel(emptyRule(), "question"), questionRule: { kind: "all" } }),
  },
  {
    id: "ex-rated",
    model: "scored",
    name: "Rated 1 to 5",
    picks: null,
    facts: ["You write the questions", "An average of 4 or more moves a student forward"],
    build: () => ({ ...withModel(emptyRule(), "scored"), scaleMax: 5, scoredRule: { kind: "average", value: 4 } }),
  },
]

export const exampleById = (id: string | null | undefined): MethodExample | null => METHOD_EXAMPLES.find((x) => x.id === id) ?? null

/**
 * Evaluation settings Q's four templates (Proposed, D-EM1117-q; contract ADMIN-D3 "round 8"), from Romit's handoff spec, mapped onto our four types
 * [REQ 4.1]. Like the examples above, a template never fills who can evaluate [REQ SC-16] or the text of a question [REQ SC-04]: the checklist
 * and the scored template give four empty rows to write. Nothing is chosen until a card is picked [REQ SC-02].
 */
export interface MethodTemplate {
  id: string
  model: EvalModel
  /** The card's name, and the method's starting name. */
  name: string
  /** One line under the name. */
  line: string
  build: () => LabRule
}

/** "Works alone, With assistance, Needs coaching" highest first in the spec; stored lowest first. */
const LIVE_LEVELS = ["Needs coaching", "With assistance", "Works alone"]
const EMPTY_FOUR = ["", "", "", ""]

export const METHOD_TEMPLATES: MethodTemplate[] = [
  { id: "tpl-signoff", model: "binary", name: "Approved or not approved", line: "One decision by the evaluator.", build: () => outcomes(APPROVED) },
  { id: "tpl-levels", model: "demonstration", name: "Independence levels", line: "One level per evaluation; you choose which move a student forward.", build: () => levels(LIVE_LEVELS, 1) },
  { id: "tpl-checklist", model: "question", name: "Step checklist", line: "Moves forward when every step is done.", build: () => ({ ...withModel(emptyRule(), "question"), questions: [...EMPTY_FOUR], questionRule: { kind: "all" } }) },
  { id: "tpl-scored", model: "scored", name: "Scored criteria", line: "Moves forward when the total reaches your score.", build: () => ({ ...withModel(emptyRule(), "scored"), questions: [...EMPTY_FOUR], scaleMax: 4, scoredRule: { kind: "total", value: 12 } }) },
]

export const templateById = (id: string | null | undefined): MethodTemplate | null => METHOD_TEMPLATES.find((t) => t.id === id) ?? null
