// S-10 copy (course mapping).
// Copy added during the build (2026-10-08). Source of truth for these strings is docs/ux/09 "Strings added during build" (every string is an [INFER] proposal
// until the copy owner adopts it). Professional tone, sentence case, no em-dashes, no exclamation marks.
import { common } from "./common"
import { s10 } from "./surfaces"

export const mappingCopy = {
  skillMode: (skill: string, n: number) => `Offerings where ${skill} is mapped (${n})`,
  noMatch: "No course offerings match these filters.",
  chooseOffering: "Choose a course offering",
  chooseOfferingBody: "Select an offering to see and change the skills it expects.",
  offeringNotFound: "This offering was not found",
  searchSkills: common.searchSkills,
  chooseRequirement: "Choose mandatory or non-mandatory",
  notYetSaved: "Not yet saved",
  saved: "Saved",
  notSaved: "This change was not saved. Try again.",
  evidenceKept: "Evidence already recorded for this skill is kept.",
  requirementFor: (skill: string) => `Requirement for ${skill}`,
  mapSkill: (skill: string) => `Map ${skill}`,
  configureInLibrary: "Configure skills in the library",
  allOptions: ["All cohorts", "All academic years", "All terms", "All professional years"],
  panelRegion: "Skills mapped to the selected offering",
  listRegion: "Clinical course offerings",
  matchCount: (n: number, total: number) => `${n} of ${total} offerings match`,
  mandatoryOf: (m: number, n: number) => `${m} mandatory of ${n}`,
  noCohortShort: "No cohort enrolled",
  alsoMapped: (list: string) => s10.alsoMapped(list),
} as const
