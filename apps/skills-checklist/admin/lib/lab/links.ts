import { FLOWS, findFlow, flowsForScreen, mainSteps, resolveSet, splitScreen, type FlowDef, type FlowStep } from "./flows"

/**
 * One set-aware link builder for every link between lab screens.
 *
 * Romit's complaint: "variants and nav inside the variants aren't matching". Links used to hard-code variant letters
 * (configure "?variant=A", library "?variant=C"), so a click inside option set 2 landed in another design. Now a link names
 * only the target screen and its record params; the variant comes from the ACTIVE option set:
 *
 * - Same screen as the page: keep the page's own variant (and flow step, when on a flow route).
 * - Another screen in a flow: the page's flow when it contains the target, else the first flow containing it; the link goes
 *   to that flow's step on the flow route with `set=n`, so the journey bar and the sidebar keep the set.
 * - A screen in no flow: the screen route with its recommended variant, carrying `set` so the next hop can restore it.
 *
 * The active set is: `?set=` in the page URL, else inferred from the page's variant (inverse mapping), else the
 * session value `lab:set`, else the target flow's recommended set (`activeSetFor`, used by the client hook).
 */

export type ParamValue = string | number | null | undefined
export type LinkParams = Record<string, ParamValue>
type ParamSource = { get(name: string): string | null } | null | undefined

/** Scope params every in-page link carries from the page URL. Record params (skill, stu, ...) are passed explicitly. */
export const SCOPE_CARRY = ["term", "cohort", "group", "course", "basis", "present"] as const

export interface LinkContext {
  /** Flow of the page, when the page is a flow step or a screen URL that maps to one. */
  flowId?: string
  /** Flow step of the page, only on the flow route. */
  stepId?: string
  /** Active option set. */
  set?: string
  /** "persona/slug" of the page's screen. */
  screen?: string
  /** Variant letter the page renders. */
  variant?: string
  /** True when the page is on /lab/flow/... */
  onFlowRoute?: boolean
  /** The page's search params, for the scope carry. */
  carry?: ParamSource
}

const isPresent = (v: ParamValue): v is string | number => v !== undefined && v !== null && v !== ""

function query(base: Record<string, string>, params: LinkParams, carry: ParamSource): string {
  const q = new URLSearchParams()
  for (const k of SCOPE_CARRY) {
    const v = carry?.get(k)
    if (v) q.set(k, v)
  }
  for (const [k, v] of Object.entries(base)) q.set(k, v)
  for (const [k, v] of Object.entries(params)) {
    // A link never chooses a variant itself; the set does.
    if (k === "variant") continue
    if (isPresent(v)) q.set(k, String(v))
    else if (v === null) q.delete(k)
  }
  const s = q.toString()
  return s ? `?${s}` : ""
}

const flowsWith = (screen: string): FlowDef[] => FLOWS.filter((f) => f.steps.some((s) => s.screen === screen))

/** The step of `flow` a link to `screen` with `params` lands on: a step whose set params all match, else one without params. */
export function stepFor(flow: FlowDef, screen: string, set: string, params: LinkParams = {}, prefer?: string): FlowStep | undefined {
  const candidates = flow.steps.filter((s) => s.screen === screen)
  if (!candidates.length) return undefined
  const matches = (st: FlowStep) => {
    const need = st.params?.[set]
    return !!need && Object.entries(need).every(([k, v]) => String(params[k] ?? "") === v)
  }
  const preferred = prefer ? candidates.find((s) => s.id === prefer) : undefined
  if (preferred && (!preferred.params || matches(preferred))) return preferred
  return candidates.find(matches) ?? candidates.find((s) => !s.params) ?? candidates[0]
}

/** The flow a link to `screen` uses: the page's flow when it contains the screen, else the first flow that does. */
export function flowFor(screen: string, pageFlowId?: string): FlowDef | undefined {
  const page = findFlow(pageFlowId)
  if (page && page.steps.some((s) => s.screen === screen)) return page
  return flowsWith(screen)[0]
}

/**
 * The href for a link to `screen` ("persona/slug") with record `params`, from a page described by `ctx`.
 */
export function labHref(screen: string, params: LinkParams = {}, ctx: LinkContext = {}): string {
  const { persona, slug } = splitScreen(screen)
  const sameScreen = ctx.screen === screen
  const flow = flowFor(screen, ctx.flowId)

  if (flow) {
    const set = resolveSet(flow, ctx.set)
    if (sameScreen && ctx.variant && !flow.steps.some((s) => s.screen === screen && s.variants[set] === ctx.variant)) {
      // The page shows a variant the active set does not map here (chosen from "More variants" or an old screen URL):
      // a self link stays in that variant on the screen route.
      return `/lab/${persona}/${slug}${query({ variant: ctx.variant, set }, params, ctx.carry)}`
    }
    const step = stepFor(flow, screen, set, params, sameScreen && ctx.onFlowRoute ? ctx.stepId : undefined)
    if (step) return `/lab/flow/${flow.id}/${step.id}${query({ set }, params, ctx.carry)}`
  }

  // No flow holds the screen: keep the page's variant on a self link, else the recommended one.
  const base: Record<string, string> = {}
  if (sameScreen && ctx.variant) base.variant = ctx.variant
  if (ctx.set) base.set = ctx.set
  return `/lab/${persona}/${slug}${query(base, params, ctx.carry)}`
}

const SCREEN_URL = /^\/lab\/([a-z-]+)\/([a-z0-9-]+)(?:\?([^#]*))?(#.*)?$/

/**
 * Rewrites a plain screen URL built elsewhere ("/lab/admin/configure-skill?skill=x") into the set-aware href. Flow URLs,
 * `/lab`, external and non-lab URLs pass through unchanged.
 */
export function rewriteLabUrl(url: string, ctx: LinkContext = {}): string {
  if (!url.startsWith("/lab/") || url.startsWith("/lab/flow/")) return url
  const m = SCREEN_URL.exec(url)
  if (!m) return url
  const [, persona, slug, search = "", hash = ""] = m
  const params: LinkParams = {}
  new URLSearchParams(search).forEach((v, k) => { params[k] = v })
  return labHref(`${persona}/${slug}`, params, ctx) + hash
}

/**
 * The active option set for a page: URL `set` (when the flow has it), else the set whose mapping sends this screen to the
 * page's variant, else the stored session set (when the flow has it), else undefined (callers fall back to the recommended
 * set of the flow they link into).
 */
export function activeSetFor(ctx: { flowId?: string; screen?: string; variant?: string; urlSet?: string | null; stored?: string | null; params?: ParamSource }): string | undefined {
  let flow = findFlow(ctx.flowId)
  if (!flow && ctx.screen && ctx.variant) {
    const { persona, slug } = splitScreen(ctx.screen)
    flow = flowsForScreen(persona, slug, ctx.variant, ctx.params)[0]?.flow ?? flowsWith(ctx.screen)[0]
  }
  if (!flow) return ctx.urlSet ?? ctx.stored ?? undefined
  if (ctx.urlSet && flow.sets.some((s) => s.id === ctx.urlSet)) return ctx.urlSet
  if (ctx.screen && ctx.variant) {
    const inferred = flow.sets.find((s) => flow!.steps.some((st) => st.screen === ctx.screen && st.variants[s.id] === ctx.variant))
    if (inferred) {
      // When several sets map this screen to the same letter, a stored set that is one of them wins over the first.
      if (ctx.stored && flow.steps.some((st) => st.screen === ctx.screen && st.variants[ctx.stored!] === ctx.variant)) return ctx.stored
      return inferred.id
    }
  }
  if (ctx.stored && flow.sets.some((s) => s.id === ctx.stored)) return ctx.stored
  return undefined
}

/** The variant letter a link to `screen` lands on from this page (undefined: the screen's recommended variant). */
export function variantFor(screen: string, ctx: LinkContext = {}): string | undefined {
  const href = labHref(screen, {}, ctx)
  const flowMatch = /^\/lab\/flow\/([^/]+)\/([^/?]+)\?(.*)$/.exec(href)
  if (flowMatch) {
    const flow = findFlow(flowMatch[1])
    const step = flow?.steps.find((s) => s.id === flowMatch[2])
    const set = new URLSearchParams(flowMatch[3]).get("set") ?? flow?.recommendedSet ?? ""
    return step?.variants[set]
  }
  return new URLSearchParams(href.split("?")[1] ?? "").get("variant") ?? undefined
}

/**
 * How the lab bar and the /lab index count one screen's variants, from one source so they always agree (granola
 * 2026-10-26 item 21: the index listed 6 dashboard variants while the bar showed 3 sets). inSets: distinct letters some
 * option set reaches; outside: the "+n" under More variants. inSets + outside = every registered variant of a flow screen.
 */
export function variantCounts(screen: string, letters: string[]): { inSets: number; outside: number; inFlow: boolean } {
  const inFlow = flowsWith(screen).length > 0
  const outside = lettersOutsideSets(screen, letters).length
  return { inSets: inFlow ? letters.length - outside : 0, outside, inFlow }
}

/** Variant letters of a screen that no set of any flow reaches (dashboard C, D, E): listed under "More variants". */
export function lettersOutsideSets(screen: string, letters: string[]): string[] {
  const covered = new Set(flowsWith(screen).flatMap((f) => f.steps.filter((s) => s.screen === screen).flatMap((s) => Object.values(s.variants))))
  return covered.size ? letters.filter((l) => !covered.has(l)) : []
}

/** The flow a nav row opens: the page's flow when its first step is the row's screen, else the first flow starting there. */
export function navHref(screen: string, ctx: LinkContext = {}): string {
  const page = findFlow(ctx.flowId)
  const starts = (f: FlowDef) => mainSteps(f)[0]?.screen === screen
  const flow = page && starts(page) ? page : page && page.steps.some((s) => s.screen === screen) ? undefined : FLOWS.find(starts)
  if (flow) {
    const set = resolveSet(flow, ctx.set)
    return `/lab/flow/${flow.id}${query({ set }, {}, ctx.carry)}`
  }
  return labHref(screen, {}, ctx)
}
