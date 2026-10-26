"use client"

import * as React from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { findScreen, resolveVariant, screenHref, type PersonaId, type ScreenDef, type VariantDef } from "@/lib/lab/screens"
import { flowHref, flowsForScreen, findFlow, mainSteps, neighbours, resolveSet, resolveStep, splitScreen, type FlowDef, type FlowStep, type Neighbours } from "@/lib/lab/flows"
import { flowFor, lettersOutsideSets, stepFor } from "@/lib/lab/links"
import { LAB_EVENTS, labNotesFor, scenariosFor, type Scenario } from "./scenarios"
import { readStoredSet, writeStoredSet } from "./page-context"

/** What the page tells the lab bar. The flow route passes flow, step and set; the screen route passes the screen and variant. */
export interface LabBarProps {
  persona: PersonaId
  /** "persona/slug" of the rendered screen. */
  screen?: string
  /** Variant letter actually rendered. */
  variant?: string
  flow?: string
  step?: string
  set?: string
}

export interface SetOption {
  value: string
  /** Full label: "1 Guided" or "Variant A". */
  label: string
  /** Name without the number, for the compact menu. */
  name: string
  planned: boolean
}

export interface LabBarModel {
  persona: PersonaId
  screen?: ScreenDef
  variant?: VariantDef
  /** "persona/slug/variant", the DS gate key. */
  key?: string
  /** Present when the page's screen belongs to a flow (on the flow route, or a screen URL). */
  flow?: FlowDef
  step?: FlowStep
  set?: string
  nav?: Neighbours
  onFlowRoute: boolean
  options: SetOption[]
  /** The highlighted option; empty when the page shows a variant outside the sets. */
  current: string
  /** The page's variant letter when no set maps this step to it (dashboard C, D, E): shown instead of a wrong set. */
  outside: string | null
  /** Variants of this screen that no set reaches, for the "More variants" menu. */
  extraVariants: VariantDef[]
  extraHref: (letter: string) => string
  isRecommended: boolean
  question?: string
  setSummary?: string
  notes: string[]
  scenarios: Scenario[]
  stepHref: (stepId: string) => string
  chooseOption: (value: string) => void
  chooseFlow: (flowId: string) => void
  runScenario: (s: Scenario) => void
}

export function useLabBar(props: LabBarProps): LabBarModel {
  const router = useRouter()
  const pathname = usePathname() ?? ""
  const params = useSearchParams()
  const onFlowRoute = !!(props.flow && props.step)
  const urlSet = params?.get("set") ?? null
  const [stored, setStored] = React.useState<string | null>(null)
  React.useEffect(() => { setStored(readStoredSet()) }, [])

  // Resolve the flow context.
  let flow: FlowDef | undefined
  let step: FlowStep | undefined
  let set: string | undefined
  let screen: ScreenDef | undefined
  let variant: VariantDef | undefined
  if (onFlowRoute) {
    const r = resolveStep(props.flow!, props.step!, props.set)
    if (r) {
      flow = r.flow; step = r.step; set = r.set; screen = r.screen
      variant = props.variant ? (r.screen.variants.find((v) => v.id === props.variant) ?? r.variant) : r.variant
    }
  } else if (props.screen) {
    const { persona, slug } = splitScreen(props.screen)
    screen = findScreen(persona, slug)
    if (screen) {
      variant = resolveVariant(screen, props.variant)
      const m = flowsForScreen(persona, slug, variant.id, params)[0]
      if (m) {
        flow = m.flow; step = m.step; set = m.set
        // Several sets can map this step to the same letter (course mapping A is set 1 and set 3): the URL or session set wins.
        for (const s of [urlSet, stored]) if (s && m.step.variants[s] === variant.id) { set = s; break }
      } else {
        // The screen is in a flow but this letter is in no set (dashboard D): keep the flow, mark the variant outside.
        const f = flowFor(props.screen)
        if (f) {
          flow = f
          set = resolveSet(f, urlSet ?? stored)
          step = stepFor(f, props.screen, set, Object.fromEntries(params?.entries() ?? []))
        }
      }
    }
  }

  const outside = flow && step && variant && step.variants[set ?? flow.recommendedSet] !== variant.id ? variant.id : null
  const options: SetOption[] = flow && step
    ? flow.sets.map((s) => {
        const planned = resolveStep(flow!.id, step!.id, s.id)?.planned ?? true
        return { value: s.id, label: `${s.id} ${s.label}`, name: s.label, planned }
      })
    : (screen?.variants ?? []).map((v) => ({ value: v.id, label: `Variant ${v.id}`, name: `Variant ${v.id}`, planned: !v.file }))
  const current = outside ? "" : flow ? (set ?? flow.recommendedSet) : (variant?.id ?? "")
  const isRecommended = !outside && (flow ? current === flow.recommendedSet : !!screen && variant?.id === screen.recommended)

  const extraVariants = React.useMemo(() => {
    if (!screen || !flow) return []
    const letters = lettersOutsideSets(`${screen.persona}/${screen.slug}`, screen.variants.map((v) => v.id))
    return screen.variants.filter((v) => letters.includes(v.id))
  }, [screen, flow])
  const extraHref = React.useCallback((letter: string) => {
    if (!screen) return "#"
    const q = new URLSearchParams()
    for (const k of ["term", "cohort", "group", "course", "basis"]) { const v = params?.get(k); if (v) q.set(k, v) }
    if (set) q.set("set", set)
    const base = screenHref(screen.persona, screen.slug, letter)
    return q.toString() ? `${base}&${q.toString()}` : base
  }, [screen, set, params])

  const stepHref = React.useCallback((stepId: string) => (flow && set ? flowHref(flow.id, stepId, set, params) : "#"), [flow, set, params])

  const chooseOption = React.useCallback((value: string) => {
    if (flow && step) {
      writeStoredSet(value)
      router.replace(flowHref(flow.id, step.id, value, params))
      return
    }
    const q = new URLSearchParams(params?.toString() ?? "")
    q.set("variant", value)
    router.replace(`${pathname}?${q.toString()}`)
  }, [flow, step, params, pathname, router])

  const chooseFlow = React.useCallback((flowId: string) => {
    const f = findFlow(flowId)
    const first = f ? mainSteps(f)[0] : undefined
    if (!f || !first) return
    const keep = set && f.sets.some((s) => s.id === set) ? set : null
    router.push(flowHref(f.id, first.id, resolveSet(f, keep ?? readStoredSet()), params))
  }, [set, params, router])

  const runScenario = React.useCallback((s: Scenario) => {
    if (s.params) {
      const q = new URLSearchParams(params?.toString() ?? "")
      // A scenario replaces the others in its group, never the record or scope params of another group.
      const group = scenariosFor(screen).filter((x) => x.group === s.group)
      for (const x of group) for (const k of Object.keys(x.params ?? {})) q.delete(k)
      for (const [k, v] of Object.entries(s.params)) q.set(k, v)
      router.replace(`${pathname}?${q.toString()}`)
    }
    if (s.event) window.dispatchEvent(new CustomEvent(s.event))
    window.dispatchEvent(new CustomEvent(LAB_EVENTS.scenario, { detail: s }))
  }, [params, pathname, router, screen])

  // Persist the set in the session; restore it on a flow URL that does not name one.
  React.useEffect(() => {
    if (!flow || !step) return
    if (urlSet) { writeStoredSet(urlSet); return }
    if (!onFlowRoute) { if (set) writeStoredSet(set); return }
    const s = readStoredSet()
    if (s && s !== set && flow.sets.some((x) => x.id === s)) router.replace(flowHref(flow.id, step.id, s, params))
  }, [onFlowRoute, flow, step, set, urlSet, params, router])

  const persona = flow?.persona ?? props.persona
  return {
    persona,
    screen,
    variant,
    key: screen && variant ? `${screen.persona}/${screen.slug}/${variant.id}` : undefined,
    flow,
    step,
    set,
    nav: flow && step ? neighbours(flow, step.id) : undefined,
    onFlowRoute,
    options,
    current,
    outside,
    extraVariants,
    extraHref,
    isRecommended,
    question: variant?.question,
    setSummary: flow && !outside ? flow.sets.find((s) => s.id === current)?.summary : undefined,
    notes: labNotesFor(screen),
    scenarios: scenariosFor(screen),
    stepHref,
    chooseOption,
    chooseFlow,
    runScenario,
  }
}
