"use client"

/**
 * State for the configure-a-skill lab screens (decision D-X31). Edits live in component state. "Save draft" keeps them in the
 * shared store (lib/lab/configure.ts saveConfigDraft, persisted with the state) without changing the skill's status, so reopening
 * resumes where the admin stopped. "Save configuration" (re-apply) writes the rule to the shared v2 store (saveLabRule): the
 * skill's configuration plus a rule version, which the one engine (lib/v2/rules.ts) reads for student progress, the dashboard, the
 * director and the lists; the skill becomes Configured and can be mapped. "New evidence only" is not decided (PENDING-ROMIT), so
 * it stays a lab-only preview and writes nothing. Impact is recomputed from the real evidence index on every edit.
 * URL: ?skill=<id> (default Oral medication administration) · ?change=sample (a stricter rule, for review) · ?state=loading.
 */
import * as React from "react"
import { useSearchParams } from "next/navigation"
import { useV2Hydrated, useV2State, useV2Store } from "@/lib/v2/react"
import { DEMO_TODAY, IDS } from "@/lib/v2/seed-core"
import { skillById } from "@/lib/v2/evidence-index"
import { computeImpact, configDraftOf, discardConfigDraft, emptyRule, fromV2, sampleChange, saveConfigDraft, saveLabRule, validateRule, type Impact, type LabRule, type PublishMode, type RuleIssue } from "@/lib/lab/configure"
import { buildLibrary, nextToConfigure, type LibraryRow } from "@/lib/lab/library"
import { isConfigured } from "@/lib/v2/population"
import type { Skill, V2State } from "@/lib/v2/types"

export const DEFAULT_SKILL = "sk-med-admin"
export const UNCONFIGURED_SKILL = "sk-pressure-injury"

export interface SavedResult {
  mode: PublishMode | null
  impact: Impact
  rule: LabRule
  /** True when the rule was written to the shared store (rule version `version`); false for new evidence only. */
  written: boolean
  version: number | null
}

export interface ConfigureModel {
  ready: boolean
  state: V2State
  skillId: string
  skill: Skill | undefined
  /** The rule students see today (null when the skill is not configured, including a skill that only has a draft). */
  current: LabRule | null
  rule: LabRule
  setRule: (next: LabRule | ((r: LabRule) => LabRule)) => void
  reset: () => void
  /** The edits differ from what was last saved (configuration or draft). */
  dirty: boolean
  issues: RuleIssue[]
  /** Live impact with evidence re-applied, for the panel. */
  impact: Impact | null
  /** The draft saved in the shared store, if any (where the admin stopped and when). */
  draft: { step: string | null; at: string } | null
  /** Keep the edits as a draft; the skill's status does not change. */
  saveDraft: (step: string | null) => void
  /** Drop the saved draft (and the edits) and go back to the saved configuration. */
  discardDraft: () => void
  /** Set once "Save configuration" has run; the page then shows the receipt. */
  saved: SavedResult | null
  save: (mode: PublishMode | null) => void
  dismissSaved: () => void
  /** The next Not configured skill in library order after this one, for "Configure next". */
  nextSkill: LibraryRow | null
  settings: string[]
}

export function useConfigure(opts: { defaultSample?: boolean; skillId?: string } = {}): ConfigureModel {
  const params = useSearchParams()
  const state = useV2State()
  const store = useV2Store()
  const hydrated = useV2Hydrated()
  const skillId = opts.skillId || params?.get("skill") || DEFAULT_SKILL
  const change = params?.get("change")
  const wantSample = change === "sample" || (opts.defaultSample === true && change !== "none")
  const demo = params?.get("state")
  const skill = hydrated ? skillById(state, skillId) : undefined
  const settings = state.program.clinicalSettings

  const [override, setOverride] = React.useState<LabRule | null>(null)
  const current = React.useMemo(() => override ?? (skill && isConfigured(skill) && skill.config && skill.model ? fromV2(skill) : null), [skill, override])
  const savedDraft = React.useMemo(() => (hydrated ? configDraftOf(state, skillId) : null), [hydrated, state, skillId])
  const initial = React.useCallback((): LabRule => {
    if (savedDraft) return savedDraft.rule
    // A skill that is not configured has no earlier rule, so nothing is carried from one (Romit 2026-10-27: "Limits from the
    // earlier rule" showed on a Not configured skill).
    const v2 = skill ? fromV2(skill) : fromV2({ model: null, config: null })
    const base = skill && isConfigured(skill) ? v2 : { ...v2, carried: emptyRule().carried }
    return wantSample && skill && isConfigured(skill) && skill.config ? sampleChange(base, settings) : base
  }, [skill, wantSample, settings, savedDraft])

  const [rule, setRuleState] = React.useState<LabRule>(() => fromV2({ model: null, config: null }))
  const [published, setPublished] = React.useState<SavedResult | null>(null)
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

  const saveDraft = React.useCallback(
    (step: string | null) => {
      if (!skill) return
      const at = `${DEMO_TODAY}T${new Date().toISOString().slice(11, 19)}Z`
      store.update((s) => saveConfigDraft(s, skill.id, rule, step, at))
    },
    [skill, store, rule],
  )
  const discardDraft = React.useCallback(() => {
    if (!skill) return
    store.update((s) => discardConfigDraft(s, skill.id))
    const base = fromV2(skill)
    setRuleState(base)
  }, [skill, store])

  const publish = React.useCallback(
    (mode: PublishMode | null) => {
      if (!skill) return
      // An invalid rule (an unset frequency among them) is never published; the screens show the same issues first.
      if (validateRule(rule).length > 0) return
      const im = computeImpact(state, skill.id, current ?? fromV2({ model: null, config: null }), rule, mode ?? "reapply")
      const at = `${DEMO_TODAY}T${new Date().toISOString().slice(11, 19)}Z`
      let written = false
      let version: number | null = null
      store.update((s) => {
        const r = saveLabRule(s, skill.id, rule, { at, byId: IDS.ross, mode })
        if (!r.ok || !r.written) return s
        written = true
        version = r.version
        return r.state
      })
      setPublished({ mode, impact: im, rule, written, version })
      // The saved rule becomes the baseline, so the panel reads "no change" afterwards. With new-only the existing states are
      // kept, so the old rule stays the baseline for display.
      if (mode !== "new-only") setOverride(rule)
    },
    [skill, state, store, current, rule],
  )

  const nextSkill = React.useMemo(() => (published && skill ? nextToConfigure(buildLibrary(state), skill.id) : null), [published, skill, state])

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
    draft: savedDraft ? { step: savedDraft.step, at: savedDraft.at } : null,
    saveDraft,
    discardDraft,
    saved: published,
    save: publish,
    dismissSaved: () => setPublished(null),
    nextSkill,
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
