// Copy for the optional AI reading in the import dialog (docs/build/typesafe-import-design.md §5). Voice rules apply (docs/ux/09 §1):
// "AI" appears ONLY to disclose that the list text is sent to an AI service. Never "smart", "automatically", accuracy figures or
// "powered by" (IM-13: the reading is a draft the admin confirms).
export const importAiCopy = {
  switchLabel: "Use AI to help read this list",
  switchHelp:
    "The text of this list is sent to TypeSafe, an AI service, to help tell skills from headings and notes. Nothing else from Prism is sent. Nothing is added until you confirm.",
  reading: "Reading the list",
  fallbackBanner: "AI reading was not available, so the list was read with the standard reader. Review it as usual.",
  info: 'AI helped read this list. Rows marked "Check this row" were less clear; look at those first.',
  infoNoCue: "AI helped read this list. No rows were marked to check; review it as usual.",
  cueLabel: "Check this row",
  cueReasons: {
    lowSkillConfidence: "This line may not be a skill.",
    maybeDetail: "This line may belong to the skill above it.",
    categoryUncertain: "The category for this skill is less clear.",
    rulesAndModelDisagree: "The heading and the content below it did not agree.",
  },
  onlyCheck: "Show only rows to check",
  fileTypeUnsupported: "This file type cannot be read. Save it as .xlsx, .docx or .pdf, or paste the list.",
  fileTooLarge: "This file is too large to read. Try a smaller file or paste the list.",
  fileNoText: "No text could be read from this file. A scanned page has no text to read. Try another file or paste the list.",
  fileReaderUnavailable: "This file could not be read here. Try a .csv or .txt file, or paste the list.",
} as const
