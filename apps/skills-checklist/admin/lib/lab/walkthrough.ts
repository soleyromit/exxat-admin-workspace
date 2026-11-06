import { CARRY_KEYS, WALKTHROUGH_FLOWS, findFlow, mainSteps, type FlowDef, type FlowStep } from "./flows"
import { PRESENT_PARAM } from "./present"

/**
 * The two walkthroughs (Romit 2026-10-27, for Sankalp's Thursday meeting: "show setup and configuration design based on the
 * recommended design variants ... the happy path properly navigated ... unnecessary cluttered information aren't shown").
 * One entry URL each, the recommended variant of each step (flows.json `setup-walkthrough` and `fulfillment-walkthrough`, one set),
 * always in present mode, in Sankalp's order (docs/knowledge/design/thursday-flows-sankalp.md). Inside a walkthrough the
 * product's own buttons move on: every lab link resolves inside the page's flow first (lib/lab/links.ts), so "Save and
 * configure", "Map to courses", "Send for evaluation" and the rest land on this walkthrough's steps. The presenter control (step
 * n of N, previous, next, exit) is the fallback when a product button does not lead on, and it never shows a variant, set or lab
 * label.
 *
 * No variant is removed or hidden: the walkthroughs are separate flow entries, and the lab index still lists every variant.
 */
export const WALKTHROUGH_ID = "setup-walkthrough"
/**
 * The student and evaluator path (Sankalp's fulfillment happy path, 2026-10-27, extended 2026-11-04, D-L67): one student and one
 * skill, from My progress through Send for evaluation C, the evaluator's form, and back to the skill's count.
 */
export const FULFILLMENT_WALKTHROUGH_ID = "fulfillment-walkthrough"
/** Entry URLs, linked from the lab index. */
export const WALKTHROUGH_ENTRY = "/lab/walkthrough/admin"
export const FULFILLMENT_ENTRY = "/lab/walkthrough/student"
/** Short ids the entry route accepts, to the flow they open. */
// Romit 2026-10-28: "instead of setup, use admin; for fulfillment, use student". The old ids still resolve so shared links keep working.
export const WALKTHROUGH_ROUTES: Record<string, string> = { admin: WALKTHROUGH_ID, student: FULFILLMENT_WALKTHROUGH_ID, setup: WALKTHROUGH_ID, fulfillment: FULFILLMENT_WALKTHROUGH_ID }

export const isWalkthrough = (flowId: string | null | undefined): boolean => !!findFlow(flowId)?.walkthrough

export function walkthroughFlow(id: string = WALKTHROUGH_ID): FlowDef | undefined {
  const f = findFlow(id)
  return f?.walkthrough ? f : undefined
}

type ParamSource = { get(name: string): string | null } | null | undefined

/** Params a walkthrough hop carries: the journey keys plus the skills chosen on the send steps (Send C reads `?skills=`). */
export const WALKTHROUGH_CARRY = [...CARRY_KEYS, "skills", "sg", "request", "to"] as const

const paramCount = (step: FlowStep, set: string) => Object.keys(step.params?.[set] ?? {}).length

const matchesParams = (step: FlowStep, set: string, get: (k: string) => string | null): boolean => {
  const need = step.params?.[set]
  if (need && step.matchOn) return step.matchOn.every((k) => !!get(k))
  return !!need && Object.entries(need).every(([k, v]) => get(k) === v)
}

/**
 * The step a walkthrough page is really on. A screen that moves on by its own params stays on its route (Send C's Continue
 * writes `?step=self`; My progress opens one course with `?course=`; Evaluation settings and others by their own params), so the
 * step is read from the params: among the main steps on the same screen, the one whose params all match, the most specific
 * first; none matching keeps the route's step. Outside a walkthrough the route's step always wins.
 */
export function effectiveStep(flow: FlowDef, routeStep: FlowStep, set: string, carry: ParamSource): FlowStep {
  if (!flow.walkthrough || routeStep.side) return routeStep
  const get = (k: string) => carry?.get(k) ?? null
  const hits = mainSteps(flow)
    .filter((s) => s.screen === routeStep.screen && matchesParams(s, set, get))
    .sort((a, b) => paramCount(b, set) - paramCount(a, set))
  if (!hits.length) return routeStep
  // The route's own step wins a tie (two steps equally specific).
  const top = paramCount(hits[0]!, set)
  return hits.find((s) => s.id === routeStep.id && paramCount(s, set) === top) ?? hits[0]!
}

/**
 * The href of a walkthrough step: the flow route in its one set, present mode, carrying the record and scope in hand. A carried
 * key that names a sibling step on the same screen (`?course=` on My progress is the course step) is dropped when the target
 * step does not ask for it, so Previous from the course view lands on My progress, not on the course again.
 */
export function walkthroughStepHref(flow: FlowDef, stepId: string, carry?: ParamSource): string {
  const set = flow.recommendedSet
  const target = flow.steps.find((s) => s.id === stepId)
  const own = target?.params?.[set] ?? {}
  const siblingKeys = new Set(flow.steps.filter((s) => target && s.id !== target.id && s.screen === target.screen).flatMap((s) => Object.keys(s.params?.[set] ?? {})))
  const q = new URLSearchParams()
  q.set("set", set)
  for (const k of WALKTHROUGH_CARRY) {
    if (k === PRESENT_PARAM) continue
    if (siblingKeys.has(k) && !(k in own)) continue
    const v = carry?.get(k)
    if (v) q.set(k, v)
  }
  // The step's own params win over the carry, so a presenter hop always opens the step as defined: Check and save opens on a
  // configured skill with a sample change (the check needs a rule to compare), whatever skill the previous step held.
  for (const [k, v] of Object.entries(own)) q.set(k, v)
  q.set(PRESENT_PARAM, "1")
  return `/lab/flow/${flow.id}/${stepId}?${q.toString()}`
}

/** The first step's href: where the entry URL lands. */
export function walkthroughStart(id: string = WALKTHROUGH_ID): string | undefined {
  const flow = walkthroughFlow(id)
  const first = flow ? mainSteps(flow)[0] : undefined
  return flow && first ? walkthroughStepHref(flow, first.id) : undefined
}

export interface WalkthroughPosition {
  flow: FlowDef
  step: FlowStep
  /** 1-based. A page off the path (Add several, opened from Library) reports the stop it hangs off. */
  index: number
  total: number
  prev?: { step: FlowStep; href: string }
  next?: { step: FlowStep; href: string }
}

/**
 * Where a page sits in a walkthrough, with previous and next hrefs; undefined when the page is not a walkthrough step. A side step
 * (an action opened from a stop) keeps the path bar: Back returns to its stop, Next goes on to the stop after it.
 */
export function walkthroughPosition(flowId: string | null | undefined, stepId: string | null | undefined, carry?: ParamSource): WalkthroughPosition | undefined {
  const flow = walkthroughFlow(flowId ?? undefined)
  if (!flow || !stepId) return undefined
  const steps = mainSteps(flow)
  const routeStep = flow.steps.find((s) => s.id === stepId)
  if (!routeStep) return undefined
  const anchor = routeStep.side ? steps.find((s) => s.id === routeStep.after) : undefined
  if (routeStep.side && !anchor) return undefined
  const current = anchor ?? effectiveStep(flow, routeStep, flow.recommendedSet, carry)
  const i = steps.indexOf(current)
  // The skill in hand is not carried back before the step that introduced it: on the library and add steps `?skill=` would
  // open that skill's panel instead of the page the step is about.
  // With no stop introducing one (the admin path since D-L77), no stop carries it.
  const firstWithSkill = steps.findIndex((s) => Object.values(s.params ?? {}).some((p) => "skill" in p))
  const link = (s: FlowStep | undefined) => {
    if (!s) return undefined
    const before = firstWithSkill < 0 || steps.indexOf(s) < firstWithSkill
    const src: ParamSource = before ? { get: (k: string) => (k === "skill" ? null : carry?.get(k) ?? null) } : carry
    return { step: s, href: walkthroughStepHref(flow, s.id, src) }
  }
  if (anchor) return { flow, step: routeStep, index: i + 1, total: steps.length, prev: link(anchor), next: link(steps[i + 1]) ?? continuation(flow) }
  return { flow, step: current, index: i + 1, total: steps.length, prev: link(steps[i - 1]) ?? lastOfPrevious(flow), next: link(steps[i + 1]) ?? continuation(flow) }
}

/** Next on a path's last stop: the first stop of the path that continues it (D-L67). */
function continuation(flow: FlowDef): { step: FlowStep; href: string } | undefined {
  const then = flow.then ? walkthroughFlow(flow.then) : undefined
  const first = then ? mainSteps(then)[0] : undefined
  return then && first ? { step: first, href: walkthroughStepHref(then, first.id) } : undefined
}

/** Back on a path's first stop: the last stop of the path it continues. */
function lastOfPrevious(flow: FlowDef): { step: FlowStep; href: string } | undefined {
  const before = WALKTHROUGH_FLOWS.find((f) => f.then === flow.id)
  const last = before ? mainSteps(before).at(-1) : undefined
  return before && last ? { step: last, href: walkthroughStepHref(before, last.id) } : undefined
}

/** Every path, for the Exit menu: its name and first stop. */
export function walkthroughPaths(): Array<{ id: string; title: string; href: string }> {
  return WALKTHROUGH_FLOWS.flatMap((f) => {
    const href = walkthroughStart(f.id)
    return href ? [{ id: f.id, title: f.title, href }] : []
  })
}

/** "All variants" in the path bar's Exit menu: the lab index, where every screen, variant and other flow lives (D-L64). */
export const WALKTHROUGH_EXIT = "/lab"
