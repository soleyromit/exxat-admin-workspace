"use client"

/**
 * State for the configure-a-skill lab screens. The draft lives in component state; publishing in the lab never writes the shared
 * v2 store, so other lab screens keep the same sample data. Impact is recomputed from the real evidence index on every edit.
 * URL: ?skill=<id> (default Oral medication administration) · ?change=sample (a stricter rule, for review) · ?state=loading.
 */
import * as React from "react"
import { useSearchParams } from "next/navigation"
import { useV2Hydrated, useV2State } from "@/lib/v2/react"
import { skillById } from "@/lib/v2/evidence-index"
import { computeImpact, fromV2, sampleChange, validateRule, type Impact, type LabRule, type PublishMode, type RuleIssue } from "@/lib/lab/configure"
import type { Skill, V2State } from "@/lib/v2/types"

export const DEFAULT_SKILL = "sk-med-admin"
export const UNCONFIGURED_SKILL = "sk-pressure-injury"

export interface PublishedResult {
  mode: PublishMode | null
  impact: Impact
  rule: LabRule
}

export interface ConfigureModel {
  ready: boolean
  state: V2State
  skillId: string
  skill: Skill | undefined
  /** The rule students see today (null when the skill is not configured). */
  current: LabRule | null
  rule: LabRule
  setRule: (next: LabRule | ((r: LabRule) => LabRule)) => void
  reset: () => void
  /** The draft differs from what the page opened with and has not been published. */
  dirty: boolean
  issues: RuleIssue[]
  /** Live impact with evidence re-applied, for the panel. */
  impact: Impact | null
  published: PublishedResult | null
  publish: (mode: PublishMode | null) => void
  dismissPublished: () => void
  settings: string[]
}

export function useConfigure(opts: { defaultSample?: boolean; skillId?: string } = {}): ConfigureModel {
  const params = useSearchParams()
  const state = useV2State()
  const hydrated = useV2Hydrated()
  const skillId = opts.skillId || params?.get("skill") || DEFAULT_SKILL
  const change = params?.get("change")
  const wantSample = change === "sample" || (opts.defaultSample === true && change !== "none")
  const demo = params?.get("state")
  const skill = hydrated ? skillById(state, skillId) : undefined
  const settings = state.program.clinicalSettings

  const [override, setOverride] = React.useState<LabRule | null>(null)
  const current = React.useMemo(() => override ?? (skill?.config && skill.model ? fromV2(skill) : null), [skill, override])
  const initial = React.useCallback((): LabRule => {
    const base = skill ? fromV2(skill) : fromV2({ model: null, config: null })
    return wantSample && skill?.config ? sampleChange(base, settings) : base
  }, [skill, wantSample, settings])

  const [rule, setRuleState] = React.useState<LabRule>(() => fromV2({ model: null, config: null }))
  const [published, setPublished] = React.useState<PublishedResult | null>(null)
  const seededFor = React.useRef<string | null>(null)
  React.useEffect(() => {
    if (!skill) return
    const key = `${skill.id}|${wantSample}`
    if (seededFor.current === key) return
    seededFor.current = key
    setRuleState(initial())
    setPublished(null)
    setOverride(null)
  }, [skill, wantSample, initial])

  const setRule = React.useCallback((next: LabRule | ((r: LabRule) => LabRule)) => setRuleState((r) => (typeof next === "function" ? next(r) : next)), [])
  const reset = React.useCallback(() => {
    setRuleState(initial())
    setPublished(null)
    setOverride(null)
  }, [initial])

  // The lab Scenario menu (and later the lab bar) resets edits through one window event.
  React.useEffect(() => {
    const onReset = () => reset()
    window.addEventListener("lab:reset", onReset)
    return () => window.removeEventListener("lab:reset", onReset)
  }, [reset])

  const dirty = React.useMemo(() => (skill ? JSON.stringify(rule) !== JSON.stringify(initial()) : false), [rule, skill, initial])
  const issues = React.useMemo(() => validateRule(rule), [rule])
  const impact = React.useMemo(() => (skill && rule.model ? computeImpact(state, skill.id, current ?? fromV2({ model: null, config: null }), rule, "reapply") : null), [state, skill, current, rule])

  const publish = React.useCallback(
    (mode: PublishMode | null) => {
      if (!skill) return
      const im = computeImpact(state, skill.id, current ?? fromV2({ model: null, config: null }), rule, mode ?? "reapply")
      setPublished({ mode, impact: im, rule })
      // In the lab the published rule becomes the baseline, so the panel reads "no change" afterwards. With new-only the
      // existing states are kept, so the old rule stays the baseline for display.
      if (mode !== "new-only") setOverride(rule)
    },
    [skill, state, current, rule],
  )

  return {
    ready: hydrated && demo !== "loading",
    state,
    skillId,
    skill,
    current,
    rule,
    setRule,
    reset,
    dirty: dirty && !published,
    issues,
    impact,
    published,
    publish,
    dismissPublished: () => setPublished(null),
    settings,
  }
}

/** Move focus to a control named by a validation issue. Tiles and radio groups are found by id prefix. */
export function focusField(id: string): void {
  if (typeof document === "undefined") return
  const el = (document.getElementById(id) ?? document.querySelector<HTMLElement>(`[id^="${id}-"]`)) as HTMLElement | null
  if (!el) return
  el.scrollIntoView({ block: "center" })
  el.focus({ preventScroll: true })
}
