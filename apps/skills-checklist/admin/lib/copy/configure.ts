// S-09 validation copy (skill configure).
// Copy added during the build (2026-10-08). Source of truth for these strings is docs/ux/09 "Strings added during build" (every string is an [INFER] proposal
// until the copy owner adopts it). Professional tone, sentence case, no em-dashes, no exclamation marks.

export const configureExtra = {
  nameRequired: "Enter a skill name.",
  binaryQualifyingMissing: "Choose which outcome qualifies.",
  labelRequired: (which: string) => `${which} is required.`,
  questionsEmpty: "Add the first question.",
  levelsEmpty: "Add the first level.",
  atLeastRange: (m: number) => (m > 0 ? `Enter a whole number from 1 to ${m}.` : "Add questions first."),
  subsetUnknown: "A selected question no longer exists. Review the selection.",
  scaleInvalid: "Set a scale where the lowest value is below the highest and the step is above zero.",
  thresholdOutOfScale: (lo: number, hi: number) => `Enter a threshold from ${lo} to ${hi}.`,
  requiredCount: "Enter a whole number of 1 or more.",
  levelMinInvalid: "Enter a whole number of 0 or more.",
  levelMinUnknown: "A minimum refers to a level that no longer exists.",
  settingMinInvalid: "Enter a whole number of 1 or more.",
  settingMinTooHigh: (setting: string, n: number, total: number) => `The minimum for ${setting} is ${n}, which is more than the ${total} required in total.`,
  settingsSumWarning: (sum: number, total: number) => `The setting minimums add up to ${sum}, more than the ${total} required. Evidence can count in more than one place only if you collect more than ${total}.`,
  fieldLabelRequired: "Enter a label for this field.",
  fieldLabelDuplicate: "Another field already has this label. Each field must be different.",
  fieldOptionsEmpty: "Add at least one option, one per line.",
  fieldOptionDuplicate: "Two options are the same. Each option must be different.",
} as const
