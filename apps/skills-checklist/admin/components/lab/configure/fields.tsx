"use client"

/**
 * The four editing sections of a skill configuration, shared by sets 1, 2 and 3 (docs/knowledge/design/skill-setup-journey/02
 * section 4): Model, Outcomes, Rule (with setting minimums), Who signs (roles, student fields, feedback, self-evaluation,
 * approval). DS controls only. Every control a validation issue can name has a stable focusable id (cfg-...), so an error
 * summary can move focus straight to it. One helper line per group at most (say it once).
 */
import * as React from "react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@exxatdesignux/ui/components/ui/alert-dialog"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import { Checkbox } from "@exxatdesignux/ui/components/ui/checkbox"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@exxatdesignux/ui/components/ui/dialog"
import { Field, FieldDescription, FieldError, FieldLabel, FieldLegend, FieldSet } from "@exxatdesignux/ui/components/ui/field"
import { Input } from "@exxatdesignux/ui/components/ui/input"
import { Textarea } from "@exxatdesignux/ui/components/ui/textarea"
import { Label } from "@exxatdesignux/ui/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@exxatdesignux/ui/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@exxatdesignux/ui/components/ui/select"
import { Tip } from "@exxatdesignux/ui/components/ui/tip"
import { ToggleSwitch } from "@exxatdesignux/ui/components/ui/toggle-switch"
import { cn } from "@exxatdesignux/ui/lib/utils"
import { InputGroup, InputGroupAddon, InputGroupInput, InputGroupText } from "@exxatdesignux/ui/components/ui/input-group"
import { TYPE } from "@/components/lab/type-scale"
import { ConfigSubsection } from "./section"
import { criteriaMeaning, ruleMeaning, type Meaning, MODEL_STEP_LABEL, removeLevel, removeQuestion, swapItems, applyPreset, FIELD_TYPE_LABEL, hasNeed, LAB_MODELS as MODELS, LABEL_PRESETS, MODEL_HELP, MODEL_LABEL, ROLE_LABEL, ROLES, withModel, type FieldType, type LabelPresetId, type LabRule, type RuleIssue, type SectionId } from "@/lib/lab/configure"
import type { EvalModel } from "@/lib/v2/types"
import { COURSE_FACULTY, aNoun, skillNoun } from "@/lib/lab/terms"
import { RuleConditions, RuleNumber } from "./rule-conditions"
import { CHECKOFF_LABEL, ruleAllowsCheckOff, ruleCheckOffOff, ruleCheckOffScore, ruleTickRecords } from "@/lib/lab/configure"
import { AmberNote } from "@/components/lab/admin-a/parts"

export interface SectionProps {
  rule: LabRule
  setRule: (fn: (r: LabRule) => LabRule) => void
  issues: RuleIssue[]
  /** Show field errors (after the admin tried to move on or publish). */
  showErrors: boolean
  settings: string[]
  /** The page's step or section heading already asks the question: keep the model legend for screen readers only. */
  legendHidden?: boolean
  /** The rule sentence holds "which outcome counts" (Configure C), so the outcomes section does not ask it twice. */
  qualifyingInRule?: boolean
}

const MODEL_ICON: Record<EvalModel, string> = { binary: "fa-circle-half-stroke", question: "fa-list-check", scored: "fa-star-half-stroke", demonstration: "fa-stairs" }

const toInt = (v: string): number => (v.trim() === "" ? Number.NaN : Number(v))
const numValue = (n: number): string => (Number.isFinite(n) ? String(n) : "")

function useErr(issues: RuleIssue[], show: boolean) {
  return (field: string): string | undefined => (show ? issues.find((i) => i.field === field)?.message : undefined)
}

function Err({ id, message }: { id: string; message?: string }) {
  if (!message) return null
  return <FieldError id={`${id}-error`}>{message}</FieldError>
}

const errProps = (id: string, message?: string) => (message ? { "aria-invalid": true as const, "aria-describedby": `${id}-error` } : {})

function NumberInput({ id, label, value, onChange, error, width = "w-20", hideLabel }: { id: string; label: string; value: number; onChange: (n: number) => void; error?: string; width?: string; hideLabel?: boolean }) {
  return <Input id={id} type="number" inputMode="numeric" min={0} aria-label={hideLabel ? label : undefined} className={width} value={numValue(value)} onChange={(e) => onChange(toInt(e.target.value))} {...errProps(id, error)} />
}

/**
 * One Remove style on every configure list (Romit 2026-10-27, "why is this layout like this?": a grey text Remove outweighed the
 * question): an icon-only ghost button at the end of its row, named for its row, so the row's content carries the weight.
 */
export function RemoveButton({ id, label, onClick }: { id?: string; label: string; onClick: () => void }) {
  return (
    <Button id={id} type="button" variant="ghost" size="icon-sm" aria-label={label} onClick={onClick}>
      <i className="fa-light fa-xmark" aria-hidden="true" />
    </Button>
  )
}

/**
 * "What this means" (Romit 2026-10-27, "lot of whitespace"): the current choices in one or two plain sentences and one tiny worked
 * example, beside the fields once the step is wider than 48rem, under them below that. It fills the width with something the admin
 * reads, not with stretched fields. The sentences are data about the rule (an artifact preview), not instructions.
 */
export function MeaningPanel({ meaning }: { meaning: Meaning }) {
  // Named as a preview of the rule (its sentences are data, not instructions), nested inside the step's region so it adds none.
  return (
    <div role="group" aria-label="What this means: a preview of the rule" className="flex flex-col gap-2 rounded-[var(--radius)] border border-border p-4" data-region="meaning-preview" data-meaning-panel>
      <h3 className={TYPE.group}>What this means</h3>
      <div className="flex flex-col gap-2" data-artifact-preview>
        {meaning.lines.map((l, i) => (
          <p key={i} className={TYPE.body}>{l}</p>
        ))}
        {meaning.example ? <p className={cn(TYPE.helper, "tabular-nums")} data-meaning-example data-counts={meaning.counts === undefined ? undefined : String(meaning.counts)}>{meaning.example}</p> : null}
      </div>
    </div>
  )
}

/** The fields and their "What this means" panel: side by side from a 48rem step, stacked below that. */
export function WithMeaning({ meaning, className, children, ...rest }: { meaning: Meaning; className?: string; children: React.ReactNode } & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("grid grid-cols-1 gap-6 @min-[48rem]:grid-cols-[minmax(0,1fr)_minmax(15rem,19rem)] @min-[48rem]:items-start @min-[48rem]:gap-10", className)} {...rest}>
      <div className="flex min-w-0 flex-col gap-6">{children}</div>
      <MeaningPanel meaning={meaning} />
    </div>
  )
}

// ---------------------------------------------------------------------------------------------------------------------
// Model [REQ SC-01, SC-02, SC-09]: nothing preselected; each option says its consequence in one line.

export function ModelSection({ rule, setRule, issues, showErrors, columns = 2, legend, legendHidden, onChosen }: SectionProps & { columns?: 1 | 2 | 4; legend?: string; onChosen?: (m: EvalModel) => void }) {
  const err = useErr(issues, showErrors)("cfg-model")
  const [pending, setPending] = React.useState<EvalModel | null>(null)
  const choose = (m: EvalModel) => {
    setRule((r) => withModel(r, m))
    onChosen?.(m)
  }
  // What switching to `m` would throw away, said in the admin's terms (empty when nothing would be lost).
  const lostFor = (m: EvalModel): string[] => {
    const lost: string[] = []
    const q = rule.questions.filter((x) => x.trim()).length
    const l = rule.levels.filter((x) => x.trim()).length
    if (q > 0 && m !== "question" && m !== "scored") lost.push(`${q} ${q === 1 ? "question" : "questions"}`)
    if (l > 0 && m !== "demonstration") lost.push(`${l} ${l === 1 ? "level" : "levels"}`)
    if (rule.levelMinimums.length > 0) lost.push(`${rule.levelMinimums.length} level ${rule.levelMinimums.length === 1 ? "minimum" : "minimums"}`)
    if (rule.questionRule || rule.scoredRule) lost.push("the rule for when it counts")
    return lost
  }
  const onValue = (v: string) => {
    const m = v as EvalModel
    if (rule.model && rule.model !== m && lostFor(m).length > 0) setPending(m)
    else choose(m)
  }
  const lost = pending ? lostFor(pending) : []
  const lostText = lost.length > 1 ? `${lost.slice(0, -1).join(", ")} and ${lost[lost.length - 1]}` : (lost[0] ?? "")
  return (
    <FieldSet className="flex flex-col gap-3" data-section="model">
      <FieldLegend variant="label" className={legendHidden ? "sr-only" : undefined}>{legend ?? MODEL_STEP_LABEL}</FieldLegend>
      <RadioGroup
        id="cfg-model"
        tabIndex={-1}
        value={rule.model ?? ""}
        onValueChange={onValue}
        aria-label="Evaluation model"
        className={cn(columns === 4 ? "flex flex-wrap gap-x-6 gap-y-3 outline-none" : "grid gap-3 outline-none", columns === 2 && "max-w-4xl sm:grid-cols-2")}
        {...errProps("cfg-model", err)}
      >
        {MODELS.map((m) => {
          const id = `cfg-model-${m}`
          // Inline: one row of plain radios (set 3); the consequence line is in the option's tooltip, not in the page.
          if (columns === 4) {
            return (
              <div key={m} className="flex items-center gap-2">
                <RadioGroupItem id={id} value={m} />
                <Tip label={MODEL_HELP[m]}>
                  <Label htmlFor={id}>{MODEL_LABEL[m]}</Label>
                </Tip>
              </div>
            )
          }
          return (
            <Label
              key={m}
              htmlFor={id}
              className={cn(
                "flex cursor-pointer items-start gap-3 rounded-[var(--radius)] border border-border bg-background p-3 font-normal",
                "has-[[data-state=checked]]:border-[var(--brand-color)] has-[[data-state=checked]]:bg-[var(--brand-tint)]",
              )}
            >
              <RadioGroupItem id={id} value={m} className="mt-0.5" />
              <span className="flex min-w-0 flex-col gap-0.5">
                <span className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <i className={`fa-light ${MODEL_ICON[m]} text-muted-foreground`} aria-hidden="true" />
                  {MODEL_LABEL[m]}
                  </span>
                <span className="text-sm text-muted-foreground">{MODEL_HELP[m]}</span>
              </span>
            </Label>
          )
        })}
      </RadioGroup>
      <Err id="cfg-model" message={err} />
      <AlertDialog open={pending !== null} onOpenChange={(o) => !o && setPending(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{pending ? `Switch to ${MODEL_LABEL[pending].toLowerCase()}?` : "Switch how it's judged?"}</AlertDialogTitle>
            <AlertDialogDescription>{`Your ${lostText} will be removed, because ${pending ? MODEL_LABEL[pending].toLowerCase() : "the new choice"} is judged differently. Evidence already recorded is not affected.`}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel variant="outline" size="default" autoFocus>
              {`Keep ${rule.model ? MODEL_LABEL[rule.model].toLowerCase() : "the model"}`}
            </AlertDialogCancel>
            <AlertDialogAction
              variant="default"
              size="default"
              onClick={() => {
                if (pending) choose(pending)
                setPending(null)
              }}
            >
              {pending ? `Switch to ${MODEL_LABEL[pending].toLowerCase()}` : "Switch"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </FieldSet>
  )
}

// ---------------------------------------------------------------------------------------------------------------------
// Outcomes, questions or levels [REQ SC-03, SC-04, SC-07, SC-08]

/**
 * An editable list of questions or levels. `onRemove` and `onMove` let the caller carry rule references with the item they name
 * (removeQuestion, removeLevel, swapItems) so nothing in a rule points at the wrong item afterwards [REQ AE-07].
 */
const PLACEHOLDER: Record<string, string> = { Question: "For example, maintains aseptic technique", Level: "For example, Independent" }

function ListEditor({ idBase, noun, values, onChange, onRemove, onMove, addId, ordered, err }: { idBase: string; noun: string; values: string[]; onChange: (v: string[]) => void; onRemove?: (i: number) => void; onMove?: (i: number, j: number) => void; addId: string; ordered?: boolean; err: (f: string) => string | undefined }) {
  const move = (i: number, d: -1 | 1) => {
    const j = i + d
    if (j < 0 || j >= values.length) return
    if (onMove) return onMove(i, j)
    const next = [...values]
    ;[next[i], next[j]] = [next[j], next[i]]
    onChange(next)
  }
  // One aligned list of DS input groups (Romit 2026-10-27, "why is this layout like this?"): the number is a muted prefix inside
  // the row, the text fills it, reorder (levels only, keyboard-operable arrows: the lists are short, so no drag) and an icon-only
  // Remove sit at its end, so the question carries the weight. "Add" is a ghost button aligned with the rows' text.
  return (
    <div className="flex max-w-3xl flex-col gap-2">
      <ol className="flex flex-col gap-2" aria-label={`${noun}s`}>
        {values.map((v, i) => {
          const id = `${idBase}-${i}`
          const e = err(id)
          const n = noun.toLowerCase()
          return (
            <li key={i} className="flex flex-col gap-1">
              {/* The row actions sit beside the input group, not in it: the DS InputGroup greys the whole group when it holds a
                  disabled control (the first row's Move up), which made rows read as disabled. */}
              <div className="flex items-center gap-1">
                <InputGroup className="min-w-0 flex-1">
                  <InputGroupAddon align="inline-start">
                    <InputGroupText className="w-5 justify-end tabular-nums" aria-hidden="true">{i + 1}</InputGroupText>
                  </InputGroupAddon>
                  <InputGroupInput id={id} aria-label={`${noun} ${i + 1}`} placeholder={PLACEHOLDER[noun]} value={v} onChange={(ev) => onChange(values.map((x, k) => (k === i ? ev.target.value : x)))} {...errProps(id, e)} />
                </InputGroup>
                {ordered ? (
                  <>
                    <Button type="button" variant="ghost" size="icon-sm" aria-label={`Move ${n} ${i + 1} up`} disabled={i === 0} onClick={() => move(i, -1)}>
                      <i className="fa-light fa-arrow-up" aria-hidden="true" />
                    </Button>
                    <Button type="button" variant="ghost" size="icon-sm" aria-label={`Move ${n} ${i + 1} down`} disabled={i === values.length - 1} onClick={() => move(i, 1)}>
                      <i className="fa-light fa-arrow-down" aria-hidden="true" />
                    </Button>
                  </>
                ) : null}
                <RemoveButton label={`Remove ${n} ${i + 1}`} onClick={() => (onRemove ? onRemove(i) : onChange(values.filter((_, k) => k !== i)))} />
              </div>
              <Err id={id} message={e} />
            </li>
          )
        })}
      </ol>
      <div className="flex flex-col gap-1">
        <Button id={addId} type="button" variant="ghost" size="sm" className="w-fit" onClick={() => onChange([...values, ""])}>
          {`Add ${aNoun(noun.toLowerCase())}`}
        </Button>
        <Err id={addId} message={err(addId)} />
      </div>
    </div>
  )
}

/**
 * Preset labels in the client's words [CALL 10-26 B.3]. Each fills the labels the model uses and stays editable; it never picks
 * which outcome qualifies or how many times. Only the preset that fits the chosen model is offered.
 */
export function PresetChips({ rule, setRule }: Pick<SectionProps, "rule" | "setRule">) {
  const ids: LabelPresetId[] = rule.model === "binary" ? ["approval"] : rule.model === "demonstration" ? ["independence"] : []
  if (ids.length === 0) return null
  const current = (id: LabelPresetId) => {
    const p = LABEL_PRESETS[id]
    return p.outcomes ? p.outcomes.join("|") === rule.outcomeLabels.join("|") : (p.levels ?? []).join("|") === rule.levels.join("|")
  }
  return (
    <div className="flex flex-wrap items-center gap-2" role="group" aria-labelledby="cfg-preset-label" data-presets>
      <span id="cfg-preset-label" className="text-sm text-muted-foreground">
        Start from
      </span>
      {ids.map((id) => (
        <Button key={id} id={`cfg-preset-${id}`} type="button" variant="outline" size="sm" aria-pressed={current(id)} onClick={() => setRule((r) => applyPreset(r, id))}>
          {LABEL_PRESETS[id].label}
        </Button>
      ))}
    </div>
  )
}

export function OutcomesSection({ rule, setRule, issues, showErrors, qualifyingInRule, legendHidden }: SectionProps) {
  const err = useErr(issues, showErrors)
  if (!rule.model) return <p className="text-sm text-muted-foreground">Choose how it&apos;s judged first. The criteria depend on it.</p>
  const meaning = criteriaMeaning(rule)
  if (rule.model === "binary") {
    return (
      // Stacked at every width (Romit 2026-10-27): "Start from" sits above the two outcomes it fills, never in a column of its own.
      <WithMeaning meaning={meaning} data-section="outcomes">
        <PresetChips rule={rule} setRule={setRule} />
        <div className="grid max-w-3xl gap-4 sm:grid-cols-2">
          {[0, 1].map((i) => {
            const id = `cfg-label-${i}`
            return (
              <Field key={i}>
                <FieldLabel htmlFor={id}>{i === 0 ? "First outcome" : "Second outcome"}</FieldLabel>
                <Input
                  id={id}
                  value={rule.outcomeLabels[i]}
                  onChange={(e) => setRule((r) => ({ ...r, outcomeLabels: (i === 0 ? [e.target.value, r.outcomeLabels[1]] : [r.outcomeLabels[0], e.target.value]) as [string, string] }))}
                  {...errProps(id, err(id))}
                />
                <Err id={id} message={err(id)} />
              </Field>
            )
          })}
        </div>
        {qualifyingInRule ? null : (
        <FieldSet>
          <FieldLegend variant="label">Which outcome qualifies?</FieldLegend>
          <RadioGroup
            id="cfg-qualifying"
            tabIndex={-1}
            value={rule.qualifyingLabel === null ? "" : String(rule.qualifyingLabel)}
            onValueChange={(v) => setRule((r) => ({ ...r, qualifyingLabel: v === "1" ? 1 : 0 }))}
            className="flex flex-wrap gap-6 outline-none"
            {...errProps("cfg-qualifying", err("cfg-qualifying"))}
          >
            {[0, 1].map((i) => (
              <div key={i} className="flex items-center gap-2">
                <RadioGroupItem id={`cfg-qualifying-${i}`} value={String(i)} />
                <Label htmlFor={`cfg-qualifying-${i}`}>{rule.outcomeLabels[i].trim() || (i === 0 ? "First outcome" : "Second outcome")}</Label>
              </div>
            ))}
          </RadioGroup>
          <Err id="cfg-qualifying" message={err("cfg-qualifying")} />
        </FieldSet>
        )}
      </WithMeaning>
    )
  }
  if (rule.model === "demonstration") {
    // The answer format first (the levels the evaluator picks from, lowest first), then the list itself.
    return (
      <WithMeaning meaning={meaning} data-section="outcomes">
        <FieldSet className="flex flex-col gap-3">
          <FieldLegend variant="label">Levels, lowest first</FieldLegend>
          <PresetChips rule={rule} setRule={setRule} />
          <ListEditor
            idBase="cfg-level"
            noun="Level"
            addId="cfg-add-level"
            ordered
            values={rule.levels}
            err={err}
            onChange={(levels) => setRule((r) => ({ ...r, levels }))}
            onRemove={(i) => setRule((r) => removeLevel(r, i))}
            onMove={(i, j) => setRule((r) => swapItems(r, "levels", i, j))}
          />
        </FieldSet>
      </WithMeaning>
    )
  }
  // Questions and scored: the answer format as one sentence line first, then the questions it applies to.
  const scaleErr = err("cfg-scale")
  const scaleTop = Number.isInteger(rule.scaleMax) && rule.scaleMax >= 2 && rule.scaleMax <= 10 ? String(rule.scaleMax) : ""
  return (
    <WithMeaning meaning={meaning} data-section="outcomes">
      {rule.model === "scored" ? (
        <div className="flex flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2" role="group" aria-labelledby="cfg-scale-lead">
            <span id="cfg-scale-lead" className={TYPE.body}>Each question is scored from 1 to</span>
            <Select value={scaleTop} onValueChange={(v) => setRule((r) => ({ ...r, scaleMax: Number(v) }))}>
              <SelectTrigger id="cfg-scale" className="w-20" aria-label="Top of the score scale" {...errProps("cfg-scale", scaleErr)}>
                <SelectValue placeholder="Top" />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 9 }, (_, k) => k + 2).map((n) => (
                  <SelectItem key={n} value={String(n)}>
                    {n}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Err id="cfg-scale" message={scaleErr} />
        </div>
      ) : (
        <p className={TYPE.label} data-answer-format>Yes or No for each question</p>
      )}
      <FieldSet>
        <FieldLegend variant="label" className={legendHidden ? "sr-only" : undefined}>Questions the evaluator answers</FieldLegend>
        <ListEditor
          idBase="cfg-question"
          noun="Question"
          addId="cfg-add-question"
          values={rule.questions}
          err={err}
          onChange={(questions) => setRule((r) => ({ ...r, questions }))}
          onRemove={(i) => setRule((r) => removeQuestion(r, i))}
        />
      </FieldSet>
    </WithMeaning>
  )
}

// ---------------------------------------------------------------------------------------------------------------------
// Rule [REQ SC-05, SC-07, SC-10, SC-11, SC-12]: what qualifies one evaluation, how many, and the setting minimums.

export function RuleSection({ rule, setRule, issues, showErrors, settings }: SectionProps & { withMore?: boolean }) {
  const err = useErr(issues, showErrors)
  if (!rule.model) return <p className="text-sm text-muted-foreground">Choose how it&apos;s judged first. The rule depends on it.</p>
  const needErr = err("cfg-need")
  // Compact rule sentences, one line each where they fit (Romit 2026-10-27, "lot of whitespace"): what makes one evaluation count
  // (questions and scored only), how many the student needs, then the optional conditions as rows under one "Add a condition".
  // Beside them, "What this means" turns the choices into plain words and a worked example.
  return (
    <WithMeaning meaning={ruleMeaning(rule)} data-section="rule">
      {rule.model === "question" ? <QuestionRuleField rule={rule} setRule={setRule} err={err} /> : null}
      {rule.model === "scored" ? <ScoredRuleField rule={rule} setRule={setRule} err={err} /> : null}
      <div className="flex flex-col gap-1">
        <div className="flex flex-wrap items-center gap-2" role="group" aria-labelledby="cfg-need-lead">
          <span id="cfg-need-lead" className={TYPE.body}>The student needs</span>
          <RuleNumber id="cfg-need" label="Evaluations that count, needed" value={rule.need} error={!!needErr} onChange={(n) => setRule((r) => ({ ...r, need: n }))} />
          <span className={TYPE.body}>{rule.need === 1 ? "evaluation that counts" : "evaluations that count"}</span>
        </div>
        {/* School-defined, so the count starts empty and asks; there is no platform default and no preset [CALL 10-26 B.5]. */}
        {!hasNeed(rule) && !needErr ? <FieldDescription data-empty-need>Your program sets this number.</FieldDescription> : null}
        <Err id="cfg-need" message={needErr} />
      </div>
      <FieldSet className="flex flex-col gap-2">
        <FieldLegend variant="label">Conditions (optional)</FieldLegend>
        <RuleConditions rule={rule} setRule={setRule} issues={issues} showErrors={showErrors} settings={settings} />
      </FieldSet>
    </WithMeaning>
  )
}

function QuestionRuleField({ rule, setRule, err }: { rule: LabRule; setRule: SectionProps["setRule"]; err: (f: string) => string | undefined }) {
  const r = rule.questionRule
  const m = rule.questions.length
  return (
    <FieldSet>
      <FieldLegend variant="label">Counts when</FieldLegend>
      <RadioGroup
        id="cfg-qrule"
        tabIndex={-1}
        value={r?.kind ?? ""}
        onValueChange={(v) => setRule((x) => ({ ...x, questionRule: v === "all" ? { kind: "all" } : v === "atLeast" ? { kind: "atLeast", n: Math.max(1, m - 1) } : { kind: "subset", indices: [] } }))}
        className="flex flex-col gap-3 outline-none"
        {...errProps("cfg-qrule", err("cfg-qrule"))}
      >
        <div className="flex items-center gap-2">
          <RadioGroupItem id="cfg-qrule-all" value="all" />
          <Label htmlFor="cfg-qrule-all">Every question is answered Yes</Label>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <RadioGroupItem id="cfg-qrule-atleast" value="atLeast" />
          <Label htmlFor="cfg-qrule-atleast">At least</Label>
          <NumberInput id="cfg-qrule-n" label="Questions that must be answered Yes" hideLabel width="w-16" value={r?.kind === "atLeast" ? r.n : Number.NaN} error={err("cfg-qrule-n")} onChange={(n) => setRule((x) => ({ ...x, questionRule: { kind: "atLeast", n } }))} />
          <span className={TYPE.body}>{`of ${m} ${m === 1 ? "question is" : "questions are"} answered Yes`}</span>
        </div>
        <div className="flex items-center gap-2">
          <RadioGroupItem id="cfg-qrule-subsetopt" value="subset" />
          <Label htmlFor="cfg-qrule-subsetopt">These questions are answered Yes</Label>
        </div>
      </RadioGroup>
      <Err id="cfg-qrule" message={err("cfg-qrule") ?? err("cfg-qrule-n")} />
      {r?.kind === "subset" ? <QuestionSubsetPicker rule={rule} setRule={setRule} error={err("cfg-qrule-subset")} className="ms-6" /> : null}
    </FieldSet>
  )
}

/**
 * The questions that must be answered Yes for a "named questions" rule [REQ SC-05, SC-06]: one checkbox per question, scrolling
 * inside its box for a long question set. Shared by set 1 and 2 (rule step) and set 3 (under the sentence).
 */
export function QuestionSubsetPicker({ rule, setRule, error, className }: { rule: LabRule; setRule: SectionProps["setRule"]; error?: string; className?: string }) {
  const r = rule.questionRule
  if (r?.kind !== "subset") return null
  return (
    <div id="cfg-qrule-subset" tabIndex={-1} className={cn("flex max-h-56 flex-col gap-2 overflow-y-auto rounded-md border border-border p-3", className)} role="group" aria-label="Questions that must be Yes">
      {rule.questions.length === 0 ? <p className="text-sm text-muted-foreground">Write the questions first, then tick the ones that must be Yes.</p> : null}
      {rule.questions.map((q, i) => (
        <div key={i} className="flex items-center gap-2">
          <Checkbox id={`cfg-qsub-${i}`} checked={r.indices.includes(i)} onCheckedChange={(c) => setRule((x) => ({ ...x, questionRule: { kind: "subset", indices: c ? [...r.indices, i] : r.indices.filter((k) => k !== i) } }))} />
          <Label htmlFor={`cfg-qsub-${i}`}>{q.trim() || `Question ${i + 1}`}</Label>
        </div>
      ))}
      <Err id="cfg-qrule-subset" message={error} />
    </div>
  )
}

function ScoredRuleField({ rule, setRule, err }: { rule: LabRule; setRule: SectionProps["setRule"]; err: (f: string) => string | undefined }) {
  const r = rule.scoredRule
  // The pass mark can be typed before the "which score" choice: it waits here and goes into the rule with the choice (else the
  // earlier starting value, 60% of the scale, as before).
  const [pendingValue, setPendingValue] = React.useState<number>(Number.NaN)
  const max = r?.kind === "total" ? rule.scaleMax * Math.max(1, rule.questions.length) : rule.scaleMax
  // One sentence line (Romit 2026-10-27): "Counts when [every question scores] at least [4] out of 5".
  return (
    <div className="flex flex-col gap-1">
      <div className="flex flex-wrap items-center gap-2" role="group" aria-labelledby="cfg-srule-lead">
        <span id="cfg-srule-lead" className={TYPE.body}>Counts when</span>
        <Select value={r?.kind ?? ""} onValueChange={(v) => setRule((x) => ({ ...x, scoredRule: { kind: v as "average" | "minEach" | "total", value: r?.value ?? (Number.isFinite(pendingValue) ? pendingValue : Math.ceil(x.scaleMax * 0.6)) } }))}>
          <SelectTrigger id="cfg-srule" className="w-48" aria-label="Which score counts" {...errProps("cfg-srule", err("cfg-srule"))}>
            <SelectValue placeholder="Choose which score" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="minEach">every question scores</SelectItem>
            <SelectItem value="average">the average score is</SelectItem>
            <SelectItem value="total">the total score is</SelectItem>
          </SelectContent>
        </Select>
        <span className={TYPE.body}>at least</span>
        <NumberInput
          id="cfg-srule-value"
          label="Pass mark"
          hideLabel
          width="w-16"
          value={r ? r.value : pendingValue}
          error={err("cfg-srule-value")}
          onChange={(n) => (r ? setRule((x) => ({ ...x, scoredRule: { kind: r.kind, value: n } })) : setPendingValue(n))}
        />
        {Number.isFinite(max) && max >= 2 ? <span className={TYPE.helper}>{`out of ${max}`}</span> : null}
      </div>
      <Err id="cfg-srule" message={err("cfg-srule") ?? err("cfg-srule-value")} />
    </div>
  )
}

// ---------------------------------------------------------------------------------------------------------------------
// Who signs [REQ SC-13, SC-14, SC-15, SC-16]

/** A toggle with its title; `detail` only when the title alone would hide a consequence (say it once). */
function ToggleRow({ id, title, detail, checked, onChange }: { id: string; title: string; detail?: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex max-w-2xl items-start justify-between gap-4 py-1">
      <div className="flex min-w-0 flex-col gap-0.5">
        <p id={`${id}-label`} className="text-sm font-medium text-foreground">
          {title}
        </p>
        {detail ? (
          <p id={`${id}-detail`} className="text-sm text-muted-foreground">
            {detail}
          </p>
        ) : null}
      </div>
      <ToggleSwitch id={id} checked={checked} onChange={onChange} aria-labelledby={detail ? `${id}-label ${id}-detail` : `${id}-label`} />
    </div>
  )
}

type FieldDraft = { label: string; type: FieldType; mandatory: boolean; choices?: string[] }

/**
 * Add or edit what the student supplies [REQ SC-13]: a label, a data type, whether it is required and, for a choice list, its
 * choices (one per line, at least two). Editing keeps the field's place in the list.
 */
function FieldDialog({ open, onOpenChange, onSave, taken, initial }: { open: boolean; onOpenChange: (o: boolean) => void; onSave: (f: FieldDraft) => void; taken: string[]; initial?: FieldDraft | null }) {
  const [label, setLabel] = React.useState("")
  const [type, setType] = React.useState<FieldType>("short")
  const [mandatory, setMandatory] = React.useState(false)
  const [choices, setChoices] = React.useState("")
  const [tried, setTried] = React.useState(false)
  React.useEffect(() => {
    if (open) {
      setLabel(initial?.label ?? "")
      setType(initial?.type ?? "short")
      setMandatory(initial?.mandatory ?? false)
      setChoices((initial?.choices ?? []).join("\n"))
      setTried(false)
    }
  }, [open, initial])
  const list = choices.split("\n").map((c) => c.trim()).filter(Boolean)
  const own = (initial?.label ?? "").trim().toLowerCase()
  const dup = taken.some((t) => t.trim().toLowerCase() === label.trim().toLowerCase() && t.trim().toLowerCase() !== own)
  const error = !label.trim() ? "Give the field a label." : dup ? "Another field already has this label." : undefined
  const choiceError = type === "choice" && list.length < 2 ? "Enter at least two choices, one per line." : undefined
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{initial ? "Edit field" : "Add a field"}</DialogTitle>
          <DialogDescription>{`The student fills it in when sending this ${skillNoun()}.`}</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <Field>
            <FieldLabel htmlFor="cfg-newfield-label">Label</FieldLabel>
            <Input id="cfg-newfield-label" value={label} onChange={(e) => setLabel(e.target.value)} {...errProps("cfg-newfield-label", tried ? error : undefined)} />
            <Err id="cfg-newfield-label" message={tried ? error : undefined} />
          </Field>
          <Field>
            <FieldLabel htmlFor="cfg-newfield-type">Type</FieldLabel>
            <Select value={type} onValueChange={(v) => setType(v as FieldType)}>
              <SelectTrigger id="cfg-newfield-type" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(FIELD_TYPE_LABEL) as FieldType[]).map((t) => (
                  <SelectItem key={t} value={t}>
                    {FIELD_TYPE_LABEL[t]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          {type === "choice" ? (
            <Field>
              <FieldLabel htmlFor="cfg-newfield-choices">Choices, one per line</FieldLabel>
              <Textarea id="cfg-newfield-choices" rows={4} value={choices} onChange={(e) => setChoices(e.target.value)} {...errProps("cfg-newfield-choices", tried ? choiceError : undefined)} />
              <Err id="cfg-newfield-choices" message={tried ? choiceError : undefined} />
            </Field>
          ) : null}
          <div className="flex items-center gap-2">
            <Checkbox id="cfg-newfield-req" checked={mandatory} onCheckedChange={(c) => setMandatory(!!c)} />
            <Label htmlFor="cfg-newfield-req">Required</Label>
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" size="default" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="default"
            size="default"
            onClick={() => {
              setTried(true)
              if (error || choiceError) {
                document.getElementById(error ? "cfg-newfield-label" : "cfg-newfield-choices")?.focus()
                return
              }
              onSave({ label: label.trim(), type, mandatory, ...(type === "choice" ? { choices: list } : {}) })
              onOpenChange(false)
            }}
          >
            {initial ? "Save field" : "Add field"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/**
 * Who signs, and what does the student add (Romit relaying Sankalp 2026-10-28: "What student adds position looks wrong"): one
 * column grouped by subject, each with its own switch, in the order the work happens: 1 Student (fields, self-evaluation),
 * 2 Evaluator (roles, feedback), 3 Approval. The full-width rule (D-L5) is met by the preview aside, not by splitting fields.
 */
export function SignOffSection({ rule, setRule, issues, showErrors }: SectionProps) {
  const err = useErr(issues, showErrors)
  const roleErr = err("cfg-role-preceptor")
  const [adding, setAdding] = React.useState(false)
  const [editing, setEditing] = React.useState<number | null>(null)
  return (
    <div className="flex flex-col gap-6" data-section="signoff">
      <ConfigSubsection n={1} first title="Student" id="cfg-signoff-student">
        <FieldSet>
          <FieldLegend variant="label">What the student adds</FieldLegend>
          <ul className="flex flex-col divide-y divide-border rounded-[var(--radius)] border border-border">
            {rule.studentFields.map((f, i) => {
              const id = `cfg-field-${i}`
              const name = f.label.trim() || `field ${i + 1}`
              return (
                <li key={i} className="flex flex-col gap-1 px-3 py-1.5">
                  <div className="flex items-center gap-3">
                    <span className={cn("min-w-0 flex-1 truncate", TYPE.body)}>{f.label.trim() || "Untitled field"}</span>
                    <span className={cn("w-28 shrink-0", TYPE.helper)}>{`${FIELD_TYPE_LABEL[f.type]}${f.type === "choice" && f.choices?.length ? ` (${f.choices.length})` : ""}`}</span>
                    <span className={cn("w-20 shrink-0", TYPE.helper)}>{f.mandatory ? "Required" : "Optional"}</span>
                    <Button type="button" variant="ghost" size="sm" aria-label={`Edit ${name}`} onClick={() => setEditing(i)}>
                      Edit
                    </Button>
                    <RemoveButton id={id} label={`Remove ${name}`} onClick={() => setRule((r) => ({ ...r, studentFields: r.studentFields.filter((_, k) => k !== i) }))} />
                  </div>
                  <Err id={id} message={err(id)} />
                </li>
              )
            })}
            {rule.studentFields.length === 0 ? <li className={cn("px-3 py-2", TYPE.helper)}>Nothing beyond the evaluation itself.</li> : null}
          </ul>
          <div>
            <Button type="button" variant="ghost" size="sm" onClick={() => setAdding(true)}>
              Add a field
            </Button>
          </div>
          <FieldDialog open={adding} onOpenChange={setAdding} taken={rule.studentFields.map((f) => f.label)} onSave={(f) => setRule((r) => ({ ...r, studentFields: [...r.studentFields, f] }))} />
          <FieldDialog
            open={editing !== null}
            onOpenChange={(o) => !o && setEditing(null)}
            taken={rule.studentFields.map((f) => f.label)}
            initial={editing !== null ? rule.studentFields[editing] ?? null : null}
            onSave={(f) => setRule((r) => ({ ...r, studentFields: r.studentFields.map((x, k) => (k === editing ? f : x)) }))}
          />
        </FieldSet>
        <ToggleRow id="cfg-self" title="Student rates themselves first" detail="The evaluator sees it after their own answers." checked={rule.selfEvaluation} onChange={(v) => setRule((r) => ({ ...r, selfEvaluation: v }))} />
      </ConfigSubsection>

      <ConfigSubsection n={2} title="Evaluator" id="cfg-signoff-evaluator">
        <FieldSet>
          <FieldLegend variant="label">Who can sign off</FieldLegend>
          <div className="flex flex-wrap gap-6">
            {ROLES.map((role) => (
              <div key={role} className="flex items-center gap-2">
                <Checkbox
                  id={`cfg-role-${role}`}
                  checked={rule.evaluatorRoles.includes(role)}
                  onCheckedChange={(c) => setRule((r) => ({ ...r, evaluatorRoles: c ? [...r.evaluatorRoles, role] : r.evaluatorRoles.filter((x) => x !== role) }))}
                  {...errProps("cfg-role-preceptor", roleErr)}
                />
                <Label htmlFor={`cfg-role-${role}`}>{ROLE_LABEL[role]}</Label>
              </div>
            ))}
          </div>
          <Err id="cfg-role-preceptor" message={roleErr} />
        </FieldSet>
        <ToggleRow id="cfg-feedback" title="Feedback is required" checked={rule.feedbackRequired} onChange={(v) => setRule((r) => ({ ...r, feedbackRequired: v }))} />
      </ConfigSubsection>

      <ConfigSubsection n={3} title="Approval" id="cfg-signoff-approval">
        <ToggleRow id="cfg-approval" title="Approval before it counts" detail="A reviewer approves each evaluation before it counts." checked={rule.approvalRequired} onChange={(v) => setRule((r) => ({ ...r, approvalRequired: v }))} />
      </ConfigSubsection>

      {rule.model ? <GroupCheckOffSection rule={rule} setRule={setRule} /> : null}
    </div>
  )
}

/**
 * Group check-off (PROTO 2026-10-28, Configure "Group check-off"; CALL 10-28): whether faculty can tick this skill off for a whole
 * group on the course offering page without a student submission, and what one tick records. On by default for Met or Unmet and
 * for levels; off for questions and scores, which the program can switch on and nominate the score. Shared by Configure A, B and C.
 */
export function GroupCheckOffSection({ rule, setRule }: Pick<SectionProps, "rule" | "setRule">) {
  const allowed = ruleAllowsCheckOff(rule)
  const co = rule.checkOff ?? { enabled: null, levelIndex: null, score: null }
  const set = (patch: Partial<NonNullable<LabRule["checkOff"]>>) => setRule((r) => ({ ...r, checkOff: { ...(r.checkOff ?? { enabled: null, levelIndex: null, score: null }), ...patch } }))
  const levels = rule.levels.map((l, i) => ({ i, label: l.trim() || `Level ${i + 1}` }))
  const levelIndex = levels.length ? (co.levelIndex !== null && co.levelIndex < levels.length ? co.levelIndex : levels.length - 1) : null
  const score = ruleCheckOffScore(rule)
  return (
    <ConfigSubsection n={4} title={CHECKOFF_LABEL} id="cfg-signoff-checkoff">
      <ToggleRow
        id="cfg-checkoff"
        title="Allow group check-off"
        detail={`${COURSE_FACULTY} can tick this off for a whole group on the course offering page, without a student submission.`}
        checked={allowed}
        onChange={(v) => set({ enabled: v })}
      />
      {allowed && rule.model === "demonstration" && levels.length ? (
        <Field className="max-w-64">
          <FieldLabel htmlFor="cfg-checkoff-level">A tick records</FieldLabel>
          <Select value={String(levelIndex)} onValueChange={(v) => set({ levelIndex: Number(v) })}>
            <SelectTrigger id="cfg-checkoff-level">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {levels.map((l) => (
                <SelectItem key={l.i} value={String(l.i)}>
                  {l.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FieldDescription>One tick cannot choose a level, so the program names one.</FieldDescription>
        </Field>
      ) : null}
      {allowed && rule.model === "scored" ? (
        <Field className="max-w-64">
          <FieldLabel htmlFor="cfg-checkoff-score">A tick records</FieldLabel>
          <Select value={String(score)} onValueChange={(v) => set({ score: Number(v) })}>
            <SelectTrigger id="cfg-checkoff-score" className="w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: Math.max(1, rule.scaleMax || 5) }, (_, k) => k + 1).map((n) => (
                <SelectItem key={n} value={String(n)}>
                  {n}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FieldDescription>The same score on every item.</FieldDescription>
        </Field>
      ) : null}
      <p className={TYPE.helper} data-checkoff-line>
        {allowed ? `${ruleTickRecords(rule)}. A check-off writes an ordinary evaluation and is counted by the same achievement rules.` : ruleCheckOffOff(rule)}
      </p>
      {allowed && rule.selfEvaluation ? <AmberNote region="">{`This ${skillNoun()} asks the student to rate themselves first. A check-off skips that step, so the two routes produce different records.`}</AmberNote> : null}
      {allowed && (rule.model === "question" || rule.model === "scored") ? <AmberNote region="">A tick is a strong claim here: it records the same answer on every item. Confirm the program means that before allowing it.</AmberNote> : null}
    </ConfigSubsection>
  )
}

export const SECTION_BODY: Record<SectionId, (p: SectionProps) => React.ReactElement> = {
  model: (p) => <ModelSection {...p} />,
  outcomes: (p) => <OutcomesSection {...p} />,
  rule: (p) => <RuleSection {...p} />,
  signoff: (p) => <SignOffSection {...p} />,
}
