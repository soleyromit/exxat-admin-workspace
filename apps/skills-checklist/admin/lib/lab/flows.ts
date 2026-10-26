import registry from "./flows.json"
import { findScreen, type PersonaId, type ScreenDef, type VariantDef } from "./screens"

/**
 * Flows and option sets (docs/knowledge/design/skill-setup-journey/03-lab-architecture.md sections 2, 3 and 5).
 * A flow is the ordered steps one persona walks to finish one job; each step points at a registered lab screen. An option
 * set is one design direction across every step: the step maps the set id to one variant letter of its screen.
 * Side steps (`side: true`) are reachable from the flow but sit outside the numbered journey; their neighbours are the step
 * they hang off (`after`) and that step's next step.
 */

export interface OptionSet {
  id: string
  label: string
  summary: string
}

export interface FlowStep {
  id: string
  label: string
  /** "persona/slug" of a registered screen. */
  screen: string
  /** Option set id to variant letter. */
  variants: Record<string, string>
  /** Extra URL params the step needs per set (for example the configure check step). */
  params?: Record<string, Record<string, string>>
  side?: boolean
  /** For a side step: the main step it hangs off. */
  after?: string
  /** Short tag shown instead of the step count, for example "Later" for a Phase 2 side step (import, granola 2026-10-26). */
  tag?: string
}

export interface FlowDef {
  id: string
  title: string
  /** One word for the narrow lab bar (375 px), so the flow is never truncated. */
  short: string
  persona: PersonaId
  recommendedSet: string
  sets: OptionSet[]
  steps: FlowStep[]
}

export const FLOWS = registry.flows as FlowDef[]

export const findFlow = (id: string | null | undefined): FlowDef | undefined => FLOWS.find((f) => f.id === id)
export const flowsForPersona = (persona: string): FlowDef[] => FLOWS.filter((f) => f.persona === persona)
export const stepOf = (flow: FlowDef, stepId: string | null | undefined): FlowStep | undefined => flow.steps.find((s) => s.id === stepId)
export const mainSteps = (flow: FlowDef): FlowStep[] => flow.steps.filter((s) => !s.side)
export const sideSteps = (flow: FlowDef): FlowStep[] => flow.steps.filter((s) => s.side)

export function splitScreen(ref: string): { persona: string; slug: string } {
  const [persona = "", slug = ""] = ref.split("/")
  return { persona, slug }
}

export const stepScreen = (step: FlowStep): ScreenDef | undefined => {
  const { persona, slug } = splitScreen(step.screen)
  return findScreen(persona, slug)
}

/** The set to use: the requested one when the flow has it, else the flow's recommended set, else its first. */
export function resolveSet(flow: FlowDef, requested?: string | null): string {
  if (requested && flow.sets.some((s) => s.id === requested)) return requested
  if (flow.sets.some((s) => s.id === flow.recommendedSet)) return flow.recommendedSet
  return flow.sets[0]?.id ?? "1"
}

/**
 * Variant letter for (flow, step, set), with fallbacks: the step's mapping for the set, then for the flow's recommended set,
 * then the screen's recommended variant, then "A".
 */
export function variantLetter(flow: FlowDef, step: FlowStep, set?: string | null): string {
  const s = resolveSet(flow, set)
  return step.variants[s] ?? step.variants[flow.recommendedSet] ?? stepScreen(step)?.recommended ?? "A"
}

export interface ResolvedStep {
  flow: FlowDef
  step: FlowStep
  set: string
  screen: ScreenDef
  /** The registered variant, or a synthesised planned one when the letter is not in screens.json yet. */
  variant: VariantDef
  /** True when the variant has no built component (no `file`, or not registered yet). */
  planned: boolean
  /** The step's extra URL params for this set. */
  params: Record<string, string>
}

/** Everything the flow route needs, or undefined when the flow, the step or the step's screen does not exist. */
export function resolveStep(flowId: string, stepId: string, set?: string | null): ResolvedStep | undefined {
  const flow = findFlow(flowId)
  if (!flow) return undefined
  const step = stepOf(flow, stepId)
  if (!step) return undefined
  const screen = stepScreen(step)
  if (!screen) return undefined
  const s = resolveSet(flow, set)
  const letter = variantLetter(flow, step, s)
  const registered = screen.variants.find((v) => v.id === letter)
  const variant: VariantDef = registered ?? { id: letter, question: `${flow.sets.find((x) => x.id === s)?.label ?? "This set"} for ${step.label.toLowerCase()} is planned.` }
  return { flow, step, set: s, screen, variant, planned: !registered?.file, params: step.params?.[s] ?? {} }
}

export interface Neighbours {
  prev?: FlowStep
  next?: FlowStep
  /** 1-based position among the main steps (a side step reports its anchor's position). */
  index: number
  total: number
}

export function neighbours(flow: FlowDef, stepId: string): Neighbours {
  const main = mainSteps(flow)
  const step = stepOf(flow, stepId)
  const anchorId = step?.side ? step.after : stepId
  const i = main.findIndex((s) => s.id === anchorId)
  if (i < 0) return { index: 0, total: main.length }
  if (step?.side) return { prev: main[i], next: main[i + 1], index: i + 1, total: main.length }
  return { prev: main[i - 1], next: main[i + 1], index: i + 1, total: main.length }
}

/** Params a journey link carries from one step to the next: the record in hand and the scope. Never step-local params. */
export const CARRY_KEYS = ["skill", "stu", "course", "term", "cohort", "group", "basis", "present"] as const

type ParamSource = { get(name: string): string | null } | Record<string, string | undefined> | null | undefined

function read(src: ParamSource, key: string): string | undefined {
  if (!src) return undefined
  if (typeof (src as { get?: unknown }).get === "function") return (src as { get(name: string): string | null }).get(key) ?? undefined
  return (src as Record<string, string | undefined>)[key]
}

/** `/lab/flow/{flow}/{step}?set=n` plus the carried params found in `carry`. */
export function flowHref(flowId: string, stepId: string, set: string, carry?: ParamSource): string {
  const q = new URLSearchParams()
  q.set("set", set)
  for (const k of CARRY_KEYS) {
    const v = read(carry, k)
    if (v) q.set(k, v)
  }
  return `/lab/flow/${flowId}/${stepId}?${q.toString()}`
}

export interface FlowMatch {
  flow: FlowDef
  step: FlowStep
  set: string
}

/**
 * Flow steps a screen URL belongs to: steps on that screen whose mapping sends some set to this variant. For each step the
 * lowest matching set wins (the recommended set first). Steps that need extra params (the publish step) only match when
 * `params` carries them, so a plain configure URL reads as the configure step, not the publish step.
 */
export function flowsForScreen(persona: string, slug: string, variant: string, params?: ParamSource): FlowMatch[] {
  const ref = `${persona}/${slug}`
  const out: FlowMatch[] = []
  for (const flow of FLOWS) {
    for (const step of flow.steps) {
      if (step.screen !== ref) continue
      const order = [flow.recommendedSet, ...flow.sets.map((s) => s.id).filter((id) => id !== flow.recommendedSet)]
      const set = order.find((id) => {
        if (step.variants[id] !== variant) return false
        const need = step.params?.[id]
        return !need || Object.entries(need).every(([k, v]) => read(params, k) === v)
      })
      if (set) out.push({ flow, step, set })
    }
  }
  // A match with required params is more specific than one without (publish beats configure when both match).
  return out.sort((a, b) => Number(!!b.step.params) - Number(!!a.step.params))
}

/** The persona whose chrome a step renders in: the persona of the step's screen (the lab instructor flow ends on an evaluator page). */
export const stepPersona = (step: FlowStep): string => splitScreen(step.screen).persona
