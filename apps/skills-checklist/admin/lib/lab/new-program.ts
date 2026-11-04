/**
 * A new program (D-L44): the seeded program's people, cohorts, tracks, courses, terms, offerings and placements, with no skills
 * data at all, so Set up skills reads as a first-time setup. No skills, categories or tags, groups of skills, course mapping,
 * evaluation settings or evidence. Only Set up skills reads it (its own store key); every hub page keeps the seeded program.
 */
import { createSeed } from "@/lib/v2/seed"
import type { V2State } from "@/lib/v2/types"

export const NEW_PROGRAM_STORE_KEY = "skills-checklist:v2:new-program"
export const NEW_PROGRAM_SPACE = "new-program"

export function newProgramSeed(): V2State {
  const s = createSeed()
  return {
    ...s,
    skills: [],
    mappings: [],
    evaluations: [],
    submissions: [],
    syncQueue: [],
    concerns: [],
    remediations: [],
    audit: [],
    batches: [],
    drafts: {},
    configDrafts: {},
    programSettings: null,
    stepsReviewed: {},
    logEntries: [],
    labCheckoffs: [],
    logDraft: null,
    verifications: [],
    ruleChanges: [],
    labBatches: [],
    vocabulary: { categories: [], tags: [] },
  }
}
