import type { ScreenDef } from "@/lib/lab/screens"

/**
 * Scenario menu entries (03-lab-architecture.md sections 4.1 and 5.2). A scenario is a named demo state chosen from the lab
 * bar, never from page content. It either sets URL params (`router.replace`) or dispatches a window event that screen hooks
 * subscribe to.
 *
 * Source order: the screen's own `scenarios` in screens.json when present (the registry restructure adds them), else the
 * fallback below, copied from the spec's section 5.2 for the screens whose demo controls it lists.
 */

export interface Scenario {
  group: "States" | "Data"
  label: string
  params?: Record<string, string>
  event?: LabEventName
}

/** Window events the lab bar dispatches. Screens subscribe with `useLabEvent` or `window.addEventListener`. */
export const LAB_EVENTS = {
  /** Clear local edits and return the screen to its sample state. */
  reset: "lab:reset",
  /** A scenario was chosen; `detail` is the Scenario. Fired after the URL params are applied. */
  scenario: "lab:scenario",
} as const
export type LabEventName = (typeof LAB_EVENTS)[keyof typeof LAB_EVENTS]

const RESET: Scenario = { group: "Data", label: "Reset edits", event: LAB_EVENTS.reset }
const listStates: Scenario[] = [
  { group: "States", label: "Loading", params: { state: "loading" } },
  { group: "States", label: "Empty", params: { state: "empty" } },
  { group: "States", label: "Error", params: { state: "error" } },
]

export const SCENARIO_FALLBACK: Record<string, Scenario[]> = {
  "admin/configure-skill": [
    { group: "Data", label: "Load a sample rule change", params: { change: "sample" } },
    { group: "Data", label: "Open an unconfigured skill", params: { skill: "sk-pressure-injury" } },
    { group: "States", label: "Loading", params: { state: "loading" } },
    RESET,
  ],
  "admin/import-ai-review": [
    { group: "Data", label: "Use the sample file", params: { state: "review" } },
    { group: "Data", label: "Use the large sample", params: { state: "large" } },
    { group: "States", label: "Failed read", params: { state: "failed" } },
    { group: "States", label: "All clear", params: { state: "clear" } },
    { group: "States", label: "Done", params: { state: "done" } },
    { group: "States", label: "Empty", params: { state: "empty" } },
    RESET,
  ],
  "admin/skills-library": [...listStates, RESET],
  "admin/add-skill": [...listStates, RESET],
  // lab-README: the admin dashboard reads ?state=loading|empty|clear.
  "admin/dashboard": [
    { group: "States", label: "Loading", params: { state: "loading" } },
    { group: "States", label: "Empty", params: { state: "empty" } },
    { group: "States", label: "All clear", params: { state: "clear" } },
  ],
}

type WithScenarios = ScreenDef & { scenarios?: Scenario[]; labNotes?: string[] }

export function scenariosFor(screen: ScreenDef | undefined): Scenario[] {
  if (!screen) return []
  const own = (screen as WithScenarios).scenarios
  return own && own.length ? own : (SCENARIO_FALLBACK[`${screen.persona}/${screen.slug}`] ?? [])
}

/** Open-decision notes for the question tooltip (screens.json `labNotes`, added by the registry restructure). */
export function labNotesFor(screen: ScreenDef | undefined): string[] {
  return (screen as WithScenarios | undefined)?.labNotes ?? []
}

/** Every URL key any scenario of this screen sets; choosing a scenario clears the others first. */
export function scenarioKeys(list: Scenario[]): string[] {
  return [...new Set(list.flatMap((s) => Object.keys(s.params ?? {})))]
}
