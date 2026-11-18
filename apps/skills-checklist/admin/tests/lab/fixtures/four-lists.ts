/**
 * The four skill lists the seed held until 2026-11-16 (Romit reduced the seed to one, "Clinical skills checklist"). The list mechanics tests (assign,
 * new version, default, named students, two lists on one cohort, an unassigned list) need more than one list, so they build these on top of the seed:
 * `fourLists(s)` as plain lists, `withFourLists(s)` as the state that reads them through the saved overlay (the way an admin's own lists arrive).
 */
import type { V2State } from "@/lib/v2/types"
import { cohortGroupId, dataMinTotal, diffLists, seedLists, type SkillList } from "@/lib/lab/lists"
import { TRACK_GROUP_PREFIX } from "@/lib/v2/filters"

export function fourLists(s: V2State): SkillList[] {
  const [clinical] = seedLists(s)
  if (!clinical) return []
  const checklist = s.skills.filter((k) => k.hgtc)
  const COMPETENCY_SECTIONS = new Set(["Communication", "Documentation", "Teaching Learning Principles", "Psycho-social assessment", "Emotional/Cognitive"])
  const competencies = s.skills.filter((k) => !k.addedByHand && (COMPETENCY_SECTIONS.has(k.category) || (!k.hgtc && k.specialty === "bsn-med-surg")))
  const graduating = s.program.cohorts.includes("BSN 2026") ? [cohortGroupId("BSN 2026")] : []
  const cohorts = s.program.cohorts.map(cohortGroupId).filter((g) => !graduating.includes(g))
  const bsn2027 = s.program.cohorts.includes("BSN 2027") ? [cohortGroupId("BSN 2027")] : []
  const track = (s.tracks ?? [])[0]
  const lists: SkillList[] = [
    { ...clinical, groupIds: cohorts },
    { id: "list-competencies", name: "Practicum competencies", noun: "competency", nounPlural: "competencies", skillIds: competencies.map((k) => k.id), requiredIds: [], isDefault: false, groupIds: [...bsn2027, ...(track ? [`${TRACK_GROUP_PREFIX}${track.id}`] : [])], minTotal: Math.round(competencies.length * 0.8), standard: "Senior practicum" },
    { id: "list-core", name: "Core clinical skills", noun: "skill", nounPlural: "skills", skillIds: checklist.filter((k) => k.hgtc?.required).map((k) => k.id), requiredIds: [], isDefault: false, groupIds: graduating, minTotal: 0, standard: "" },
    { id: "list-clinical-2027", name: "Revised clinical skills checklist", noun: "skill", nounPlural: "skills", skillIds: checklist.map((k) => k.id), requiredIds: [], isDefault: false, groupIds: [], minTotal: 120, standard: "" },
  ]
  lists[0]!.minTotal = dataMinTotal(s, lists[0]!)
  lists[3]!.minTotal = lists[0]!.minTotal
  lists[2]!.minTotal = dataMinTotal(s, lists[2]!)
  return lists
}

/** The ids the fixture adds to the seed: saved as created lists in the overlay. */
export const ADDED_IDS = new Set(["list-competencies", "list-core", "list-clinical-2027"])

/** `next` (built from `fourLists`) as the overlay a store saves, against the one seeded list. */
export const fourListsOverlay = (s: V2State, next: readonly SkillList[]) => diffLists(seedLists(s), [...next], next.filter((l) => ADDED_IDS.has(l.id)))

/** The state whose program lists are the four. */
export const withFourLists = (s: V2State, next: readonly SkillList[] = fourLists(s)): V2State => ({ ...s, listEdits: fourListsOverlay(s, next) })
