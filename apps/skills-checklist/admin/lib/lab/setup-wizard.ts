/**
 * Set up skills, the admin focus workflow (D-L44, Proposed): six steps in Sankalp's order, one job each, gated where a later
 * step depends on an earlier one. Pure logic (steps, gates, skip, navigation, saved progress) so it is unit tested
 * (tests/lab/setup-wizard.test.ts) and the screen only draws it.
 *
 * Done-ness is read from the program's data (skills in the library, settings saved, a student group with skills), never from
 * what was clicked; the saved progress only remembers where the admin was and which optional steps were skipped.
 */

export type SetupStepId = "skills" | "categories" | "settings" | "assign" | "mapping" | "review"

export interface SetupStepDef {
  id: SetupStepId
  /** Rail name and step heading (one string, so the rail and the page say the same thing). */
  label: string
  optional: boolean
}

export const SETUP_STEPS: readonly SetupStepDef[] = [
  { id: "skills", label: "Skills", optional: false },
  { id: "categories", label: "Categories and tags", optional: true },
  { id: "settings", label: "Evaluation settings", optional: false },
  { id: "assign", label: "Groups and assignment", optional: false },
  { id: "mapping", label: "Course mapping", optional: true },
  { id: "review", label: "Review", optional: false },
]

export const SETUP_STEP_COUNT = SETUP_STEPS.length

/** What the program's data says, read by the screen from the shared store. */
export interface SetupFacts {
  /** Active skills in the library. */
  skills: number
  /** Program evaluation settings saved (the sentence is complete). */
  settingsSaved: boolean
  /** Student groups with at least one skill to complete. */
  groupsWithSkills: number
}

/** Saved progress (Save and exit, and every step change). */
export interface SetupProgress {
  /** Index of the step the admin is on. */
  current: number
  /** Optional steps passed with Skip. */
  skipped: SetupStepId[]
  /** True once the admin pressed Finish. */
  finished?: boolean
}

export const EMPTY_PROGRESS: SetupProgress = { current: 0, skipped: [] }

/** True when the step's gate lets the admin move on. Optional steps and Review have no gate. */
export function gateMet(id: SetupStepId, f: SetupFacts): boolean {
  if (id === "skills") return f.skills > 0
  if (id === "settings") return f.settingsSaved
  if (id === "assign") return f.groupsWithSkills > 0
  return true
}

/** The first required step, up to `before`, whose gate is not met: nothing past it can be reached. */
export function firstBlocked(f: SetupFacts, before = SETUP_STEP_COUNT): number | null {
  for (let i = 0; i < Math.min(before, SETUP_STEP_COUNT); i++) if (!gateMet(SETUP_STEPS[i]!.id, f)) return i
  return null
}

/** Can the admin open step `target`? Every gate before it must be met (no jumping past an unmet required step). */
export function canOpen(target: number, f: SetupFacts): boolean {
  if (target < 0 || target >= SETUP_STEP_COUNT) return false
  const blocked = firstBlocked(f, target)
  return blocked === null
}

/** Next from `current`: the next step when the current gate is met, else stay. */
export function next(p: SetupProgress, f: SetupFacts): SetupProgress {
  const step = SETUP_STEPS[p.current]
  if (!step || !gateMet(step.id, f) || p.current >= SETUP_STEP_COUNT - 1) return p
  return { ...p, current: p.current + 1, skipped: p.skipped.filter((s) => s !== step.id) }
}

/** Skip: only on an optional step; marks it skipped and moves on. */
export function skip(p: SetupProgress): SetupProgress {
  const step = SETUP_STEPS[p.current]
  if (!step || !step.optional) return p
  return { ...p, current: p.current + 1, skipped: p.skipped.includes(step.id) ? p.skipped : [...p.skipped, step.id] }
}

export function back(p: SetupProgress): SetupProgress {
  return p.current > 0 ? { ...p, current: p.current - 1 } : p
}

/** Open a step directly (the rail on a done step, a Review row): refused when a gate before it is unmet. */
export function goTo(p: SetupProgress, target: number, f: SetupFacts): SetupProgress {
  return canOpen(target, f) ? { ...p, current: target } : p
}

export const stepIndex = (id: string | null | undefined): number => SETUP_STEPS.findIndex((s) => s.id === id)

/** Progress read back from storage: anything malformed starts over; a saved step past an unmet gate opens that gate's step. */
export function parseProgress(raw: string | null | undefined, f?: SetupFacts): SetupProgress {
  if (!raw) return EMPTY_PROGRESS
  try {
    const v = JSON.parse(raw) as Partial<SetupProgress>
    const ids = new Set(SETUP_STEPS.map((s) => s.id))
    let current = typeof v.current === "number" && Number.isInteger(v.current) ? Math.max(0, Math.min(SETUP_STEP_COUNT - 1, v.current)) : 0
    if (f) {
      const blocked = firstBlocked(f, current)
      if (blocked !== null) current = blocked
    }
    const skipped = Array.isArray(v.skipped) ? (v.skipped.filter((s) => ids.has(s as SetupStepId)) as SetupStepId[]) : []
    return { current, skipped, finished: v.finished === true }
  } catch {
    return EMPTY_PROGRESS
  }
}

export const serializeProgress = (p: SetupProgress): string => JSON.stringify(p)

/** Library's resume cue: shown while a setup was started and not finished ("Step N of 6", N is 1-based). */
export function resumeStep(p: SetupProgress | null): number | null {
  if (!p || p.finished) return null
  return p.current + 1
}

export const SETUP_STORAGE_KEY = "lab:setup-skills"
