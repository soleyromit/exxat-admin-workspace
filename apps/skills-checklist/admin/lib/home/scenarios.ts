// Sample-data scenarios for reaching every Home state (dev/demo and tests). All sample, deterministic, built from the seed.
import type { Db } from "@/lib/domain/types"
import { buildSeed } from "@/lib/seed"

export type HomeScenario = "sample" | "firstRun" | "ready" | "readyQuiet"

export const HOME_SCENARIOS: Array<{ id: HomeScenario; label: string; description: string }> = [
  { id: "sample", label: "Partly set up (the sample program)", description: "Two imported skills are not configured; approvals, lab instructors and unmapped skills are waiting." },
  { id: "firstRun", label: "First run: empty library", description: "No skills, no mappings, no evidence." },
  { id: "ready", label: "All skills configured", description: "The setup card collapses to one line; the queue still has work." },
  { id: "readyQuiet", label: "All configured and nothing waiting", description: "Collapsed setup card and an empty attention list." },
]

const BINARY = { kind: "binary", labels: { a: { id: "a", label: "Met" }, b: { id: "b", label: "Unmet" } }, qualifyingLabelId: "a" } as const

export function scenarioDb(kind: HomeScenario): Db {
  const db = buildSeed()
  if (kind === "sample") return db
  if (kind === "firstRun") {
    return { ...db, skills: [], offeringSkillMaps: [], submissions: [], evaluations: [], reviews: [], links: [], importBatches: [], namedLabInstructors: [], categories: [], tags: [], placements: [] }
  }
  // Configure the skills the import left unconfigured, by explicit choice of a model in the fixture only.
  const skills = db.skills.map((s) => (s.model ? s : { ...s, model: JSON.parse(JSON.stringify(BINARY)) }))
  const ready: Db = { ...db, skills }
  if (kind === "ready") return ready
  return { ...ready, submissions: [], evaluations: [], reviews: [], links: [], namedLabInstructors: [], offeringSkillMaps: ready.offeringSkillMaps.concat(skills.filter((s) => s.active && !ready.offeringSkillMaps.some((m) => m.skillId === s.id)).map((s) => ({ offeringId: ready.offerings[0].id, skillId: s.id, requirement: "nonMandatory" as const }))), importBatches: [] }
}
