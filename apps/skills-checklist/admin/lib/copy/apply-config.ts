// IM-14 copy (docs/ux/08 P-05, docs/ux/09 "bulk.*"): copy a configuration into S-09, apply it to selected skills from S-04.
// Professional, sentence case, no em-dashes. The wording is a proposal [INFER] and is listed in docs/ux/09 "Strings added during build".
import type { ApplyStatus, ConfigPart } from "@/lib/store"
import { buttons } from "./shared"

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`

export const configParts: Record<ConfigPart, string> = {
  model: "Evaluation model, rule and criteria",
  submissionFields: "Student submission details",
  evaluatorComment: "Evaluator comment setting",
  workflow: "Self-evaluation and administrator approval",
  allowedRoles: "Allowed evaluator roles",
  settingMinimums: "Minimums by clinical setting",
}

export const applyConfig = {
  // ---- S-09 (copy into this form)
  copyButton: "Copy configuration from another skill",
  copyNoSource: "No configured skill exists to copy from yet.",
  copyTitle: "Copy configuration from another skill", // same words as the button, on purpose: the dialog is named by its trigger
  copyBody: "The copy is added to this form. Nothing is saved until you choose Save skill.",
  copyOverwrite: "This skill already has a configuration. Copying replaces the parts you select.",
  copyConfirm: "Copy configuration",
  copyDone: (source: string, questions: number, levels: number) =>
    `Copied from ${source}${questions > 0 ? `, ${plural(questions, "question", "questions")} copied` : levels > 0 ? `, ${plural(levels, "level", "levels")} copied` : ""}. Review the sections, then choose Save skill.`,
  copyDropped: "Minimums by clinical setting were not copied because this skill has no model yet.",

  // ---- S-09 and S-04 (apply to other skills)
  applyButton: "Apply configuration",
  applyFromHere: "Apply to selected skills",
  applySaveFirst: "Save your changes first. Applying uses this skill as it is saved.",
  applyNoSource: "No configured skill exists to apply.",
  applyTitle: "Apply configuration",
  applyBody: "The selected parts are copied to each target as an independent copy. Later edits to one skill never change another.",
  sourceLabel: "Apply from",
  sourcePlaceholder: "Choose a configured skill",
  targetsLabel: "Apply to",
  targetsNone: "Select at least one skill to apply to.",
  partsLegend: "What to copy",
  planSummary: (n: number, overwritten: number) =>
    overwritten > 0 ? `Apply to ${plural(n, "skill", "skills")}. ${overwritten} already ${overwritten === 1 ? "has" : "have"} a configuration and will be overwritten.` : `Apply to ${plural(n, "skill", "skills")}.`,
  needsModel: (n: number) => `Also rebuild the model for ${plural(n, "skill", "skills")} that use a different evaluation model`,
  needsEvidence: (n: number) => `Also overwrite ${plural(n, "skill", "skills")} that already hold evaluations. Their evaluations are kept and recalculated`,
  willSkip: (n: number) => `${plural(n, "skill", "skills")} will be skipped unless you confirm.`,
  willBeInvalid: (n: number) => `${plural(n, "skill", "skills")} would not be valid with this configuration and will be left as they are.`,
  confirm: "Apply configuration",
  cancel: buttons.cancel,
  result: (applied: number, overwritten: number) => `Configured ${plural(applied, "skill", "skills")}${overwritten > 0 ? `. ${overwritten} ${overwritten === 1 ? "was" : "were"} overwritten` : ""}.`,
  resultNone: "No skills were changed.",
  resultLeft: (n: number) => (n === 1 ? "1 skill was left as it was." : `${n} skills were left as they were.`),
  status: {
    applied: "Applied",
    unchanged: "Already identical",
    needsModelConfirmation: "Uses a different model. Not confirmed",
    needsEvidenceConfirmation: "Holds evaluations. Not confirmed",
    invalid: "Not valid with this configuration",
    notFound: "Not found",
    sameSkill: "This is the source skill",
  } satisfies Record<ApplyStatus, string>,
}
