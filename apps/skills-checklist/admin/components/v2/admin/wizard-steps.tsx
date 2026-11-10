"use client"

import * as React from "react"
import { Badge } from "@exxatdesignux/ui/components/ui/badge"
import { StatusPill } from "@/components/v2/status-pill"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@exxatdesignux/ui/components/ui/card"
import { Field, FieldDescription, FieldLabel } from "@exxatdesignux/ui/components/ui/field"
import { Label } from "@exxatdesignux/ui/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@exxatdesignux/ui/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@exxatdesignux/ui/components/ui/select"
import { ToggleSwitch } from "@exxatdesignux/ui/components/ui/toggle-switch"
import { CheckGroup, FieldErrors, ListEditor, NumberField, TextField } from "@/components/v2/admin/wizard-fields"
import { MODEL_BLURB, MODEL_LABEL, MODELS, needsLevels, needsQuestions } from "@/lib/v2/config"
import { credentialOptions, qualifiedEvaluators, simulationShare, strengthHint, trainingOptions, evaluatorPool } from "@/lib/v2/rules"
import type { EvalModel, EvaluatorRole, Skill, SkillConfig, SkillDraft, V2State } from "@/lib/v2/types"

export interface WizardCtx {
  skill: Skill
  state: V2State
  draft: SkillDraft
  /** Edit the configuration. The change is written to the store at once. */
  patch: (fn: (c: SkillConfig) => SkillConfig) => void
  setModel: (m: EvalModel) => void
  /** Messages for a field id, only once the admin has reached that step's review. */
  err: (field: string) => string[]
  copyFrom: (sourceId: string) => void
}

const NONE = "__none"

function Hint({ title, badge, children, live }: { title: string; badge?: string; children: React.ReactNode; live?: boolean }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          {title}
          {badge ? <Badge variant="secondary">{badge}</Badge> : null}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2 text-sm" {...(live ? { "aria-live": "polite" as const, "aria-atomic": true } : {})}>
        {children}
      </CardContent>
    </Card>
  )
}

function Row({ label, hint, checked, onChange, id }: { label: string; hint?: string; checked: boolean; onChange: (v: boolean) => void; id: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex flex-col gap-0.5">
        <Label id={`${id}-label`} htmlFor={id} className="text-sm font-medium">
          {label}
        </Label>
        {hint ? <p className="text-sm text-muted-foreground">{hint}</p> : null}
      </div>
      <div className="shrink-0">
        <ToggleSwitch id={id} checked={checked} onChange={onChange} aria-labelledby={`${id}-label`} />
      </div>
    </div>
  )
}

/* ---------------------------------------------------------------- step 1 */

export function StepModel({ ctx }: { ctx: WizardCtx }) {
  const { draft, state, skill, patch, setModel, err, copyFrom } = ctx
  const { model, config: c } = draft
  const [copySource, setCopySource] = React.useState("")
  const sources = state.skills.filter((k) => k.id !== skill.id && k.configured && k.config)
  const modelErrors = err("wiz-model")
  const levelMinFix = (from: string[], to: string[]) => {
    const idx = c.achievement.minLevelIndex
    if (idx === null || to.length >= from.length) return idx
    const at = to.indexOf(from[idx])
    return at >= 0 ? at : null
  }
  return (
    <div className="flex flex-col gap-6">
      <section aria-labelledby="copy-heading" className="flex flex-col gap-2">
        <h3 id="copy-heading" className="text-sm font-medium text-foreground">
          Start from another skill
        </h3>
        <p className="text-sm text-muted-foreground">Copy the settings of a skill you already configured, then change what differs. This replaces the settings below.</p>
        <div className="flex flex-wrap items-end gap-2">
          <Select value={copySource || undefined} onValueChange={setCopySource}>
            <SelectTrigger id="wiz-copy-from" aria-label="Skill to copy settings from" className="w-72">
              <SelectValue placeholder="Choose a skill" />
            </SelectTrigger>
            <SelectContent>
              {sources.map((k) => (
                <SelectItem key={k.id} value={k.id}>
                  {k.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button type="button" variant="outline" size="default" disabled={!copySource} onClick={() => copyFrom(copySource)}>
            Copy configuration
          </Button>
        </div>
      </section>

      <fieldset className="flex flex-col gap-2">
        <legend className="text-sm font-medium text-foreground">How is this skill evaluated?</legend>
        <RadioGroup id="wiz-model" tabIndex={-1} aria-label="Evaluation model" value={model ?? ""} onValueChange={(v) => v && setModel(v as EvalModel)} className="grid gap-3 sm:grid-cols-2">
          {MODELS.map((m) => (
            <label
              key={m}
              htmlFor={`wiz-model-${m}`}
              data-state={model === m ? "checked" : "unchecked"}
              className="relative flex cursor-pointer items-start gap-3 rounded-lg border border-border p-3 hover:bg-muted/50 has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-ring/50 data-[state=checked]:border-ring data-[state=checked]:bg-muted/40 data-[state=checked]:ring-2 data-[state=checked]:ring-ring"
            >
              <RadioGroupItem id={`wiz-model-${m}`} value={m} className="mt-0.5" />
              <span className="flex min-w-0 flex-col gap-1">
                <span className="text-sm font-medium text-foreground">{MODEL_LABEL[m]}</span>
                <span className="text-xs text-muted-foreground">{MODEL_BLURB[m]}</span>
              </span>
            </label>
          ))}
        </RadioGroup>
        <FieldErrors id="wiz-model" errors={modelErrors} />
      </fieldset>

      {model === "binary" ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField id="wiz-label-a" label="Outcome that qualifies" hint="For example Met or Pass." value={c.outcomeLabels[0]} errors={err("wiz-label-a")} onChange={(v) => patch((x) => ({ ...x, outcomeLabels: [v, x.outcomeLabels[1]] }))} />
          <TextField id="wiz-label-b" label="Other outcome" hint="For example Not met or Fail." value={c.outcomeLabels[1]} errors={err("wiz-label-b")} onChange={(v) => patch((x) => ({ ...x, outcomeLabels: [x.outcomeLabels[0], v] }))} />
        </div>
      ) : null}

      {needsQuestions(model) ? (
        <ListEditor
          idPrefix="wiz-question"
          addId="wiz-add-question"
          legend="Questions"
          noun="Question"
          hint={model === "scored" ? "The evaluator scores each question." : "The evaluator answers Yes or No to each question."}
          items={c.questions}
          errorsFor={err}
          addLabel="Add question"
          onChange={(items) => patch((x) => ({ ...x, questions: items }))}
        />
      ) : null}

      {model && model !== "demonstration" ? (
        <Row id="wiz-overall" label="Add one overall supervision rating beside the checklist" hint="The evaluator also records one level of supervision for the whole attempt, using levels you name." checked={c.overallRating} onChange={(v) => patch((x) => ({ ...x, overallRating: v, achievement: { ...x.achievement, minLevelIndex: v ? x.achievement.minLevelIndex : null } }))} />
      ) : null}

      {needsLevels(model, c) ? (
        <ListEditor
          idPrefix="wiz-level"
          addId="wiz-add-level"
          legend="Levels of supervision, lowest to highest"
          noun="Level"
          hint="Name the levels your program uses and put them in order. A level can be renamed, moved or removed at any time."
          items={c.levels}
          reorder
          errorsFor={err}
          addLabel="Add level"
          onChange={(items) => patch((x) => ({ ...x, levels: items, achievement: { ...x.achievement, minLevelIndex: levelMinFix(x.levels, items) } }))}
        />
      ) : null}
    </div>
  )
}

/* ---------------------------------------------------------------- step 2 */

export function StepAchievement({ ctx }: { ctx: WizardCtx }) {
  const { draft, state, patch, err } = ctx
  const { model, config: c } = draft
  const a = c.achievement
  const hint = strengthHint(model, c)
  const levels = needsLevels(model, c)
  const used = new Set(a.settingMinimums.map((m) => m.setting))
  const free = state.program.clinicalSettings.filter((s) => !used.has(s))
  const setA = (p: Partial<SkillConfig["achievement"]>) => patch((x) => ({ ...x, achievement: { ...x.achievement, ...p } }))
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <div className="flex flex-col gap-5">
        <fieldset className="flex flex-col gap-2">
          <legend className="text-sm font-medium text-foreground">What counts as achieved?</legend>
          <RadioGroup aria-label="Achievement rule" value={a.kind} onValueChange={(v) => setA({ kind: v as "count" | "last-n", window: v === "last-n" ? (a.window ?? Math.max(a.need + 1, 2)) : undefined })} className="grid gap-2 sm:grid-cols-2">
            {[
              { v: "count", t: "A set number of successful evaluations", b: "Any successful evaluation counts, however long ago." },
              { v: "last-n", t: "Enough of the most recent evaluations", b: "For example 4 of the last 5. Keeps the evidence current." },
            ].map((o) => (
              <label key={o.v} htmlFor={`wiz-kind-${o.v}`} data-state={a.kind === o.v ? "checked" : "unchecked"} className="flex cursor-pointer items-start gap-3 rounded-lg border border-border p-3 hover:bg-muted/50 has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-ring/50 data-[state=checked]:border-ring data-[state=checked]:ring-2 data-[state=checked]:ring-ring">
                <RadioGroupItem id={`wiz-kind-${o.v}`} value={o.v} className="mt-0.5" />
                <span className="flex flex-col gap-0.5">
                  <span className="text-sm font-medium text-foreground">{o.t}</span>
                  <span className="text-xs text-muted-foreground">{o.b}</span>
                </span>
              </label>
            ))}
          </RadioGroup>
        </fieldset>
        <div className="flex flex-wrap gap-4">
          <NumberField id="wiz-need" label="Successful evaluations needed" min={1} value={a.need} errors={err("wiz-need")} onChange={(v) => setA({ need: v as number })} />
          {a.kind === "last-n" ? <NumberField id="wiz-window" label="Out of the most recent" hint="Evaluations looked at." min={1} value={a.window ?? null} errors={err("wiz-window")} onChange={(v) => setA({ window: v as number })} /> : null}
          <NumberField id="wiz-distinct" label="Different evaluators needed" hint="At least this many people must sign off." min={1} value={a.distinctEvaluators} errors={err("wiz-distinct")} onChange={(v) => setA({ distinctEvaluators: v as number })} />
        </div>
        {levels ? (
          <Field>
            <FieldLabel htmlFor="wiz-minlevel">Lowest level that counts</FieldLabel>
            <Select value={a.minLevelIndex === null ? NONE : String(a.minLevelIndex)} onValueChange={(v) => setA({ minLevelIndex: v === NONE ? null : Number(v) })}>
              <SelectTrigger id="wiz-minlevel" className="w-72" aria-invalid={err("wiz-minlevel").length ? true : undefined}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>Any level counts</SelectItem>
                {c.levels.map((l, i) => (
                  <SelectItem key={i} value={String(i)}>
                    {l.trim() || `Level ${i + 1} (no name yet)`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FieldDescription>An evaluation below this level does not count.</FieldDescription>
            <FieldErrors id="wiz-minlevel" errors={err("wiz-minlevel")} />
          </Field>
        ) : (
          <p className="text-sm text-muted-foreground">A minimum level is available when the skill uses levels of supervision.</p>
        )}
        <fieldset id="wiz-settings" tabIndex={-1} className="flex flex-col gap-2 rounded-md outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
          <legend className="text-sm font-medium text-foreground">Evidence needed in named clinical settings</legend>
          <p className="text-sm text-muted-foreground">Each setting is counted on its own. Lab and simulation evidence never counts toward a clinical setting.</p>
          {a.settingMinimums.map((m, i) => (
            <div key={i} className="flex flex-col gap-1">
              <div className="flex flex-wrap items-end gap-2">
                <Field className="w-52">
                  <FieldLabel htmlFor={`wiz-setting-name-${i}`}>Setting</FieldLabel>
                  <Select value={m.setting || undefined} onValueChange={(v) => setA({ settingMinimums: a.settingMinimums.map((x, j) => (j === i ? { ...x, setting: v } : x)) })}>
                    <SelectTrigger id={`wiz-setting-name-${i}`} aria-label={`Setting for row ${i + 1}`}>
                      <SelectValue placeholder="Choose a setting" />
                    </SelectTrigger>
                    <SelectContent>
                      {state.program.clinicalSettings.filter((s) => s === m.setting || !used.has(s)).map((s) => (
                        <SelectItem key={s} value={s}>
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <NumberField id={`wiz-setting-min-${i}`} label="Minimum" min={1} value={m.min} onChange={(v) => setA({ settingMinimums: a.settingMinimums.map((x, j) => (j === i ? { ...x, min: v as number } : x)) })} />
                <Button type="button" variant="ghost" size="icon-sm" aria-label={`Remove setting row ${i + 1}`} onClick={() => setA({ settingMinimums: a.settingMinimums.filter((_, j) => j !== i) })}>
                  <i className="fa-light fa-trash-can" aria-hidden="true" />
                </Button>
              </div>
              <FieldErrors id={`wiz-setting-name-${i}`} errors={err(`wiz-setting-name-${i}`)} />
              <FieldErrors id={`wiz-setting-min-${i}`} errors={err(`wiz-setting-min-${i}`)} />
            </div>
          ))}
          <FieldErrors id="wiz-settings" errors={err("wiz-settings")} />
          <div>
            <Button type="button" variant="outline" size="sm" disabled={free.length === 0} aria-describedby={free.length === 0 ? "wiz-settings-full" : undefined} onClick={() => setA({ settingMinimums: [...a.settingMinimums, { setting: free[0], min: 1 }] })}>
              Add setting minimum
            </Button>
            {free.length === 0 ? (
              <span id="wiz-settings-full" className="ms-2 text-xs text-muted-foreground">
                Every program setting already has a row.
              </span>
            ) : null}
          </div>
        </fieldset>
      </div>
      <aside aria-label="Rule strength" className="lg:sticky lg:top-4 lg:self-start">
        <Hint title="What this rule asks" badge={`Strength: ${hint.strength}`} live>
          <p id="wiz-hint-sentence">{hint.sentence}</p>
          <p className="text-muted-foreground">{hint.note}</p>
        </Hint>
      </aside>
    </div>
  )
}

/* ---------------------------------------------------------------- step 3 */

export function StepSimulation({ ctx }: { ctx: WizardCtx }) {
  const { draft, state, patch, err } = ctx
  const c = draft.config
  const s = c.simulation
  const share = simulationShare(c)
  const setS = (p: Partial<SkillConfig["simulation"]>) => patch((x) => ({ ...x, simulation: { ...x.simulation, ...p } }))
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <div className="flex flex-col gap-5">
        <Row id="wiz-sim-allowed" label="Simulation can count toward this skill" hint="Turn off if every evaluation must be on a real patient or in the lab." checked={s.allowed} onChange={(v) => setS({ allowed: v })} />
        {s.allowed ? (
          <>
            <fieldset className="flex flex-col gap-2">
              <legend className="text-sm font-medium text-foreground">How is simulation limited?</legend>
              <RadioGroup aria-label="Simulation limit" value={s.mode} onValueChange={(v) => setS({ mode: v as "cap" | "allow-list" })} className="grid gap-2 sm:grid-cols-2">
                {[
                  { v: "cap", t: "A share cap", b: "Simulation can supply up to a share of the evaluations needed." },
                  { v: "allow-list", t: "An allow list", b: "Only the simulation settings you tick count." },
                ].map((o) => (
                  <label key={o.v} htmlFor={`wiz-sim-mode-${o.v}`} data-state={s.mode === o.v ? "checked" : "unchecked"} className="flex cursor-pointer items-start gap-3 rounded-lg border border-border p-3 hover:bg-muted/50 has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-ring/50 data-[state=checked]:border-ring data-[state=checked]:ring-2 data-[state=checked]:ring-ring">
                    <RadioGroupItem id={`wiz-sim-mode-${o.v}`} value={o.v} className="mt-0.5" />
                    <span className="flex flex-col gap-0.5">
                      <span className="text-sm font-medium text-foreground">{o.t}</span>
                      <span className="text-xs text-muted-foreground">{o.b}</span>
                    </span>
                  </label>
                ))}
              </RadioGroup>
            </fieldset>
            {s.mode === "cap" ? (
              <NumberField id="wiz-sim-cap" label="Largest simulation share, percent" min={0} max={100} value={s.maxSharePercent} errors={err("wiz-sim-cap")} onChange={(v) => setS({ maxSharePercent: v as number })} />
            ) : (
              <CheckGroup id="wiz-sim-list" legend="Simulation settings that count" options={state.program.simulationSettings.map((v) => ({ value: v, label: v }))} value={s.allowList} errors={err("wiz-sim-list")} onChange={(v) => setS({ allowList: v })} />
            )}
          </>
        ) : null}
      </div>
      <aside aria-label="Simulation share" className="lg:sticky lg:top-4 lg:self-start">
        <Hint title="Simulation share" live>
          <p>{share.text}</p>
          <p className="text-muted-foreground">Simulation never counts toward a named clinical setting.</p>
        </Hint>
      </aside>
    </div>
  )
}

/* ---------------------------------------------------------------- step 4 */

export function StepPrerequisites({ ctx }: { ctx: WizardCtx }) {
  const { draft, state, skill, patch, err } = ctx
  const p = draft.config.prerequisites
  const setP = (x: Partial<SkillConfig["prerequisites"]>) => patch((c) => ({ ...c, prerequisites: { ...c.prerequisites, ...x } }))
  const options = state.skills.filter((k) => k.id !== skill.id && (k.published || p.skillIds.includes(k.id))).map((k) => ({ value: k.id, label: k.name, hint: k.published ? undefined : "Not in use yet" }))
  return (
    <div className="flex max-w-2xl flex-col gap-5">
      <p className="text-sm text-muted-foreground">These must be done before a clinical attempt opens for the student.</p>
      <Row id="wiz-labcheck" label="Pass a lab check-off first" hint="A lab instructor signs the student off in the lab before any clinical attempt." checked={p.labCheckoff} onChange={(v) => setP({ labCheckoff: v })} />
      <NumberField id="wiz-trials" label="Practice trials before a clinical attempt" hint="Whole number from 0 to 20. Zero means none." min={0} max={20} value={p.practiceTrials} errors={err("wiz-trials")} onChange={(v) => setP({ practiceTrials: v as number })} />
      <CheckGroup id="wiz-prereq-skills" legend="Skills the student must have met first" hint="Only skills that are in use can be required." options={options} value={p.skillIds} errors={err("wiz-prereq-skills")} onChange={(v) => setP({ skillIds: v })} />
    </div>
  )
}

/* ---------------------------------------------------------------- step 5 */

const ROLE_OPTIONS: Array<{ value: EvaluatorRole; label: string; hint: string }> = [
  { value: "preceptor", label: "Preceptors", hint: "Clinical staff who supervise students. They do not need an account." },
  { value: "faculty", label: "Faculty", hint: "Program staff such as coordinators and directors." },
  { value: "lab-instructor", label: "Lab instructors", hint: "Evaluate in the lab only. They do not need an account." },
]

export function StepEvaluators({ ctx }: { ctx: WizardCtx }) {
  const { draft, state, patch, err } = ctx
  const c = draft.config
  const q = c.qualification
  const setQ = (x: Partial<SkillConfig["qualification"]>) => patch((cfg) => ({ ...cfg, qualification: { ...cfg.qualification, ...x } }))
  const pool = evaluatorPool(state).filter((p) => p.kind === "preceptor" || p.kind === "lab-instructor")
  const ok = qualifiedEvaluators(state, c)
  const okIds = new Set(ok.map((p) => p.id))
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <div className="flex flex-col gap-5">
        <CheckGroup id="wiz-roles" legend="Who may sign this skill off" options={ROLE_OPTIONS} value={c.evaluatorRoles} errors={err("wiz-roles")} onChange={(v) => patch((cfg) => ({ ...cfg, evaluatorRoles: v as EvaluatorRole[] }))} />
        <CheckGroup id="wiz-credentials" legend="Credential held" hint="An evaluator needs at least one of the ticked credentials. Tick none to accept any credential." options={credentialOptions(state).map((v) => ({ value: v, label: v }))} value={q.credentials} onChange={(v) => setQ({ credentials: v })} />
        <NumberField id="wiz-minyears" label="Years of practice, at least" hint="Whole number from 0 to 50." min={0} max={50} value={q.minYears} errors={err("wiz-minyears")} onChange={(v) => setQ({ minYears: v as number })} />
        <CheckGroup id="wiz-training" legend="Training on record" hint="An evaluator needs every ticked training." options={trainingOptions(state).map((v) => ({ value: v, label: v }))} value={q.training} onChange={(v) => setQ({ training: v })} />
        <fieldset className="flex flex-col gap-2">
          <legend className="text-sm font-medium text-foreground">At sign-off</legend>
          <Row id="wiz-feedback-required" label="Require written feedback" hint="The evaluator cannot submit without a narrative comment. Turn off to make feedback optional." checked={c.feedbackRequired ?? false} onChange={(v) => patch((cfg) => ({ ...cfg, feedbackRequired: v }))} />
          <Row id="wiz-approval-required" label="Require administrator approval" hint="A completed evaluation waits for an administrator to approve it before it counts toward the student's progress." checked={c.approvalRequired ?? false} onChange={(v) => patch((cfg) => ({ ...cfg, approvalRequired: v }))} />
        </fieldset>
      </div>
      <aside aria-label="Qualified evaluators" className="lg:sticky lg:top-4 lg:self-start">
        <Hint title="Who qualifies now" badge={`${ok.length} of ${pool.length}`} live>
          <p id="wiz-qualified" tabIndex={-1} className="outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
            Students can only pick from the evaluators who qualify when they ask for sign-off.
          </p>
          <FieldErrors id="wiz-qualified" errors={err("wiz-qualified")} />
          <ul className="flex flex-col gap-1">
            {pool.map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-2">
                <span>{p.name}</span>
                <StatusPill kind="eligibility" value={okIds.has(p.id) ? "qualifies" : "does-not-qualify"} />
              </li>
            ))}
          </ul>
        </Hint>
      </aside>
    </div>
  )
}

/* ---------------------------------------------------------------- step 6 */

export function StepFailure({ ctx }: { ctx: WizardCtx }) {
  const { draft, patch, err } = ctx
  const f = draft.config.failure
  const setF = (x: Partial<SkillConfig["failure"]>) => patch((c) => ({ ...c, failure: { ...c.failure, ...x } }))
  return (
    <div className="flex max-w-2xl flex-col gap-5">
      <p className="text-sm text-muted-foreground">What happens when an evaluation does not meet the standard.</p>
      <NumberField id="wiz-attempts" label="Attempt limit" hint="Most attempts a student gets. Leave empty for no limit." min={1} max={20} value={f.attemptLimit} errors={err("wiz-attempts")} onChange={(v) => setF({ attemptLimit: v })} />
      <NumberField id="wiz-days" label="Days between attempts, at least" hint="Whole number from 0 to 365. Zero means attempts can follow straight away." min={0} max={365} value={f.minDaysBetween} errors={err("wiz-days")} onChange={(v) => setF({ minDaysBetween: v as number })} />
      {draft.model === "scored" ? (
        <NumberField id="wiz-cap" label="Retake score cap, percent" hint="Highest score a retake can earn. Leave empty for no cap." min={1} max={100} value={f.retakeScoreCap} errors={err("wiz-cap")} onChange={(v) => setF({ retakeScoreCap: v })} />
      ) : (
        <p className="text-sm text-muted-foreground">A retake score cap applies to scored skills only, so it is not shown for this model.</p>
      )}
    </div>
  )
}
