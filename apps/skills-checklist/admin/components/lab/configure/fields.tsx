"use client"

/**
 * The four editing sections of a skill configuration, shared by sets 1, 2 and 3 (docs/knowledge/design/skill-setup-journey/02
 * section 4): Model, Outcomes, Rule (with setting minimums), Who does what (roles, student fields, feedback, self-evaluation,
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
import { Card, CardContent } from "@exxatdesignux/ui/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@exxatdesignux/ui/components/ui/dialog"
import { Field, FieldError, FieldLabel, FieldLegend, FieldSet } from "@exxatdesignux/ui/components/ui/field"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@exxatdesignux/ui/components/ui/dropdown-menu"
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
import { RoleRow } from "./section"
import { countingLevelsPhrase, levelTicked, withLevelTicked } from "@/lib/lab/configure"
import { criteriaMeaning, ruleMeaning, type Meaning, MODEL_STEP_LABEL, removeLevel, removeQuestion, swapItems, appendQuestions, newQuestionLines, parseQuestionLines, setSubsetRange, applyPreset, presetReplaces, FIELD_TYPE_LABEL, LAB_MODELS as MODELS, LABEL_PRESETS, MODEL_HELP, MODEL_LABEL, ROLE_LABEL, ROLES, withModel, type FieldType, type LabelPresetId, type LabRule, type RuleIssue, type SectionId } from "@/lib/lab/configure"
import type { EvalModel } from "@/lib/v2/types"
import { aNoun, skillNoun } from "@/lib/lab/terms"
import { RuleConditions, RuleNumber } from "./rule-conditions"
import { useFieldLayer, useFocusBack } from "./field-layer"
import { useDialogDiscard } from "@/components/lab/shared/unsaved-guard"
import { holdSecondPress } from "@/components/lab/shared/focus"
import { ruleAllowsCheckOff, ruleCheckOffScore } from "@/lib/lab/configure"

export interface SectionProps {
  rule: LabRule
  setRule: (fn: (r: LabRule) => LabRule) => void
  issues: RuleIssue[]
  /** Show field errors (after the admin tried to move on or publish). */
  showErrors: boolean
  settings: string[]
  /** The page's step or section heading already asks the question: keep the model legend for screen readers only. */
  legendHidden?: boolean
  /** The rule sentence holds "which outcome counts" (Configure C, Evaluation settings D), so the outcomes section does not ask it twice. */
  qualifyingInRule?: boolean
  /** The rule sentence holds "which levels count" (Evaluation settings D), so the levels section does not ask it twice. */
  countsFromInRule?: boolean
}

/** The Library edit panel's order (map D1a row 3). */
const PLAIN_ORDER: EvalModel[] = ["demonstration", "binary", "question", "scored"]

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
/**
 * Labels, controls and errors only, on every Configure and Evaluation settings page (Romit 2026-11-02, D-L34: "I thought I was
 * clear that I don't want so much dense text"). No "What this means" panels, option descriptions, toggle details or helper lines.
 */


/** The fields and their "What this means" panel: side by side from a 48rem step, stacked below that. */
export function WithMeaning({ meaning, className, children, ...rest }: { meaning: Meaning; className?: string; children: React.ReactNode } & React.HTMLAttributes<HTMLDivElement>) {
  void meaning
  return <div className={cn("flex min-w-0 flex-col gap-6", className)} {...rest}>{children}</div>
}

// ---------------------------------------------------------------------------------------------------------------------
// Model [REQ SC-01, SC-02, SC-09]: nothing preselected; each option says its consequence in one line.

/** What the evaluator picks from under each model: a picture of the form, not a control (decorative, aria-hidden). */
const MODEL_SAMPLE: Record<EvalModel, string[]> = {
  binary: ["Approved", "Not approved"],
  question: ["Yes or No each", "One result"],
  demonstration: ["Independent", "With assistance", "Observed"],
  scored: ["1", "2", "3", "4", "5"],
}

export function ModelSection({ rule, setRule, issues, showErrors, columns = 2, legend, legendHidden, onChosen, plain, across, rebuild, examples }: SectionProps & { columns?: 1 | 2 | 4; legend?: string; onChosen?: (m: EvalModel) => void; /** A stacked list of plain radios (the Library edit panel), not tiles. */ plain?: boolean; /** Plain radios side by side across a wide row. */ across?: boolean; /** The panel's own model change [REQ SC-09]: no question first; the form rebuilds and its Save lists what is cleared. */ rebuild?: (r: LabRule, m: EvalModel) => LabRule; /** Tiles of a name and one example line, across the row (Evaluation settings, map D3). The name alone names the radio. Needs a container above it. */ examples?: Record<EvalModel, string> }) {
  const err = useErr(issues, showErrors)("cfg-model")
  const [pending, setPending] = React.useState<EvalModel | null>(null)
  const modelNow = React.useRef(rule.model)
  modelNow.current = rule.model
  const choose = (m: EvalModel) => {
    setRule((r) => (rebuild ? rebuild(r, m) : withModel(r, m)))
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
    if (!rebuild && rule.model && rule.model !== m && lostFor(m).length > 0) setPending(m)
    else choose(m)
  }
  const lost = pending ? lostFor(pending) : []
  const lostText = lost.length > 1 ? `${lost.slice(0, -1).join(", ")} and ${lost[lost.length - 1]}` : (lost[0] ?? "")
  return (
    <FieldSet className="flex flex-col gap-3" data-section="model">
      <FieldLegend variant="label" className={legendHidden ? "sr-only" : undefined}>{legend ?? MODEL_STEP_LABEL}</FieldLegend>
      <RadioGroup
        id="cfg-model"
        value={rule.model ?? ""}
        onValueChange={onValue}
        aria-label="Evaluation model"
        className={cn(columns === 4 ? "flex flex-wrap gap-x-6 gap-y-3 outline-none" : "grid gap-3 outline-none", columns === 2 && !plain && !examples && "@min-[64rem]:grid-cols-2", across && "sm:grid-cols-2 @min-[56rem]:grid-cols-4", examples && "@min-[26rem]:grid-cols-2")}
        {...errProps("cfg-model", err)}
      >
        {(plain || examples ? PLAIN_ORDER : MODELS).map((m) => {
          const id = `cfg-model-${m}`
          if (examples) {
            return (
              <Label key={m} htmlFor={id} className="flex cursor-pointer items-start gap-2.5 rounded-[var(--radius)] border border-border bg-background p-3 font-normal has-[[data-state=checked]]:border-[var(--brand-color)] has-[[data-state=checked]]:bg-[var(--brand-tint)]" data-model-tile={m}>
                <RadioGroupItem id={id} value={m} className="mt-0.5" aria-labelledby={`${id}-name`} aria-describedby={`${id}-example`} />
                <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-brand-tint text-brand"><i className={`fa-light ${MODEL_ICON[m]} text-xs`} aria-hidden="true" /></span>
                <span className="flex min-w-0 flex-col gap-0.5">
                  <span id={`${id}-name`} className={TYPE.label}>{MODEL_LABEL[m]}</span>
                  {/* Two lines at most under the name, so a long level name cannot stretch the row; the full text stays on hover and for a screen reader. */}
                  <span id={`${id}-example`} title={examples[m]} className={cn(TYPE.meta, "line-clamp-2 break-words")}>{examples[m]}</span>
                </span>
              </Label>
            )
          }
          if (plain) {
            return (
              <div key={m} className="flex items-center gap-2">
                <RadioGroupItem id={id} value={m} />
                <Label htmlFor={id} className="font-normal">{MODEL_LABEL[m]}</Label>
              </div>
            )
          }
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
              {/* Each choice shows what the evaluator will pick from (2026-10-30 review: step 1 was 65% empty), so the
                  options read across the width and the admin compares them by the form they produce. */}
              <span className="flex min-w-0 flex-1 flex-col gap-2 @min-[30rem]:flex-row @min-[30rem]:items-start @min-[30rem]:justify-between @min-[30rem]:gap-4">
                <span className="flex min-w-0 flex-col gap-0.5">
                  <span className="flex items-center gap-2 text-sm font-medium text-foreground">
                    <i className={`fa-light ${MODEL_ICON[m]} text-muted-foreground`} aria-hidden="true" />
                    {MODEL_LABEL[m]}
                  </span>
                </span>
                <span className="hidden" aria-hidden="true" data-model-sample>
                  {MODEL_SAMPLE[m].map((s) => (
                    <span key={s} className="rounded-[var(--radius)] border border-border bg-background px-1.5 py-0.5 text-xs text-muted-foreground">{s}</span>
                  ))}
                </span>
              </span>
            </Label>
          )
        })}
      </RadioGroup>
      <Err id="cfg-model" message={err} />
      <AlertDialog open={pending !== null} onOpenChange={(o) => !o && setPending(null)}>
        {/* By any way out, focus goes to the choice that holds: the model kept, or the one switched to. */}
        <AlertDialogContent onCloseAutoFocus={(e) => { e.preventDefault(); if (modelNow.current) document.getElementById(`cfg-model-${modelNow.current}`)?.focus({ preventScroll: true }) }}>
          <AlertDialogHeader>
            <AlertDialogTitle>{pending ? `Switch to ${MODEL_LABEL[pending].toLowerCase()}?` : "Switch how it's judged?"}</AlertDialogTitle>
            <AlertDialogDescription>{`Your ${lostText} will be removed, because ${pending ? MODEL_LABEL[pending].toLowerCase() : "the new choice"} is judged differently. Evidence is kept and read under the new rule.`}</AlertDialogDescription>
          </AlertDialogHeader>
          {/* Wraps: the longest pair ("Switch to approved or not approved") is wider than the card. */}
          <AlertDialogFooter className="flex-wrap">
            <AlertDialogCancel variant="outline" size="default" autoFocus onClick={holdSecondPress}>
              {`Keep ${rule.model ? MODEL_LABEL[rule.model].toLowerCase() : "the model"}`}
            </AlertDialogCancel>
            <AlertDialogAction
              variant="default"
              size="default"
              onClick={(e) => {
                // The page below rebuilds under the pointer: the second press of a double click must not land on it.
                holdSecondPress(e)
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
const PLACEHOLDER: Record<string, string> = { Question: "For example, maintains aseptic technique" }
/** Level examples, lowest first (D-L43 follow-up): each row its own, the last row always the highest. */
const LEVEL_EXAMPLES = ["Observed", "Assisted", "Independent"] as const
export function placeholderFor(noun: string, i: number, count: number): string | undefined {
  if (noun !== "Level") return PLACEHOLDER[noun]
  const top = LEVEL_EXAMPLES.length - 1
  const k = i === count - 1 ? top : Math.min(i, top - 1)
  return `For example, ${LEVEL_EXAMPLES[k]}`
}

export function ListEditor({ idBase, noun, values, onChange, onRemove, onMove, addId, ordered, err, extra }: { idBase: string; noun: string; values: string[]; onChange: (v: string[]) => void; onRemove?: (i: number) => void; onMove?: (i: number, j: number) => void; addId: string; ordered?: boolean; err: (f: string) => string | undefined; /** A second add action beside "Add a …" (Paste a list, for questions). */ extra?: React.ReactNode }) {
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
                  <InputGroupInput id={id} aria-label={`${noun} ${i + 1}`} placeholder={placeholderFor(noun, i, values.length)} value={v} onChange={(ev) => onChange(values.map((x, k) => (k === i ? ev.target.value : x)))} {...errProps(id, e)} />
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
        <div className="flex flex-wrap items-center gap-2">
          <Button id={addId} type="button" variant="ghost" size="sm" className="w-fit" onClick={() => onChange([...values, ""])}>
            {`Add ${aNoun(noun.toLowerCase())}`}
          </Button>
          {extra}
        </div>
        <Err id={addId} message={err(addId)} />
      </div>
    </div>
  )
}

/**
 * Preset labels in the client's words [CALL 10-26 B.3]. Each fills the labels the model uses and stays editable; it never picks
 * which outcome qualifies or how many times. Only the preset that fits the chosen model is offered.
 */
export function PresetChips({ rule, setRule, quiet }: Pick<SectionProps, "rule" | "setRule"> & { /** A plain text action beside "Add a level", not a button shape. */ quiet?: boolean }) {
  const [pending, setPending] = React.useState<LabelPresetId | null>(null)
  // A menu of named starting sets (audit fix 2026-11-02): it reads as an action, never as the current value. Labels only.
  const ids: LabelPresetId[] = rule.model === "binary" ? ["metnotmet", "approval"] : rule.model === "demonstration" ? ["independence", "performance", "aacn"] : []
  if (ids.length === 0) return null
  const ask = pending ? presetReplaces(rule, pending) : null
  return (
    <div data-presets>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button id="cfg-preset" type="button" variant={quiet ? "link" : "outline"} size="sm" className={quiet ? "h-auto min-h-6 px-0 text-foreground" : undefined}>
            Use a starting set
            <i className="fa-light fa-chevron-down ms-1" aria-hidden="true" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          {ids.map((id) => (
            <DropdownMenuItem key={id} id={`cfg-preset-${id}`} onSelect={() => (presetReplaces(rule, id) ? setPending(id) : setRule((r) => applyPreset(r, id)))}>
              {`${LABEL_PRESETS[id].label}: ${(LABEL_PRESETS[id].levels ?? LABEL_PRESETS[id].outcomes ?? []).join(", ")}`}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
      {/* Levels the admin has are never overwritten without asking; the question names them and what takes their place. */}
      <AlertDialog open={!!ask} onOpenChange={(o) => !o && setPending(null)}>
        <AlertDialogContent data-preset-confirm onCloseAutoFocus={(e) => { e.preventDefault(); document.getElementById("cfg-preset")?.focus({ preventScroll: true }) }}>
          <AlertDialogHeader>
            <AlertDialogTitle>{ask ? `Replace ${ask.was.length} ${ask.noun}${ask.was.length === 1 ? "" : "s"}?` : "Replace them?"}</AlertDialogTitle>
            <AlertDialogDescription>{ask ? `${listWords(ask.was)} ${ask.was.length === 1 ? "becomes" : "become"} ${listWords(ask.next)}.${ask.clearsCounts ? " The Counts boxes clear." : ""}` : ""}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel variant="outline" size="default" autoFocus onClick={holdSecondPress}>{`Keep my ${ask?.noun ?? "level"}s`}</AlertDialogCancel>
            <AlertDialogAction
              variant="default"
              size="default"
              onClick={(e) => {
                holdSecondPress(e)
                if (pending) setRule((r) => applyPreset(r, pending))
                setPending(null)
              }}
            >
              {ask ? `Replace ${ask.was.length} ${ask.noun}${ask.was.length === 1 ? "" : "s"}` : "Replace"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

const listWords = (xs: readonly string[]) => (xs.length <= 1 ? xs.join("") : `${xs.slice(0, -1).join(", ")} and ${xs[xs.length - 1]}`)

/** The panel's words for rows the pages word as questions (map D3, D1a); no starting sets there. */
export interface OutcomeWords {
  labels: string
  qualifies: string
  levels: string
  counts: string
  first: string
  second: string
}

type FieldErr = (f: string) => string | undefined

/** The two labels of the binary model [REQ SC-03]. */
export function BinaryLabelsField({ rule, setRule, err, first = "First outcome", second = "Second outcome" }: { rule: LabRule; setRule: SectionProps["setRule"]; err: FieldErr; first?: string; second?: string }) {
  return (
    <div className="grid max-w-3xl gap-4 sm:grid-cols-2">
      {[0, 1].map((i) => {
        const id = `cfg-label-${i}`
        return (
          <Field key={i}>
            <FieldLabel htmlFor={id}>{i === 0 ? first : second}</FieldLabel>
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
  )
}

/** Which of the two labels qualifies, recorded explicitly [REQ SC-03]. */
export function QualifyingField({ rule, setRule, err, legend = "Which outcome qualifies?", legendHidden, first = "First outcome", second = "Second outcome" }: { rule: LabRule; setRule: SectionProps["setRule"]; err: FieldErr; legend?: string; legendHidden?: boolean; first?: string; second?: string }) {
  return (
    <FieldSet>
      <FieldLegend variant="label" className={legendHidden ? "sr-only" : undefined}>{legend}</FieldLegend>
      <RadioGroup
        id="cfg-qualifying"
        value={rule.qualifyingLabel === null ? "" : String(rule.qualifyingLabel)}
        onValueChange={(v) => setRule((r) => ({ ...r, qualifyingLabel: v === "1" ? 1 : 0 }))}
        className="flex flex-wrap gap-6 outline-none"
        {...errProps("cfg-qualifying", err("cfg-qualifying"))}
      >
        {[0, 1].map((i) => (
          <div key={i} className="flex items-center gap-2">
            <RadioGroupItem id={`cfg-qualifying-${i}`} value={String(i)} />
            <Label htmlFor={`cfg-qualifying-${i}`}>{rule.outcomeLabels[i].trim() || (i === 0 ? first : second)}</Label>
          </div>
        ))}
      </RadioGroup>
      <Err id="cfg-qualifying" message={err("cfg-qualifying")} />
    </FieldSet>
  )
}

export function OutcomesSection({ rule, setRule, issues, showErrors, qualifyingInRule, countsFromInRule, legendHidden, words }: SectionProps & { words?: OutcomeWords }) {
  const err = useErr(issues, showErrors)
  if (!rule.model) return <p className="text-sm text-muted-foreground">Choose how it&apos;s judged first. The criteria depend on it.</p>
  const meaning = criteriaMeaning(rule)
  if (rule.model === "binary") {
    return (
      // Stacked at every width (Romit 2026-10-27): "Start from" sits above the two outcomes it fills, never in a column of its own.
      <WithMeaning meaning={meaning} data-section="outcomes">
        {words ? <p className={TYPE.label}>{words.labels}</p> : <PresetChips rule={rule} setRule={setRule} />}
        <BinaryLabelsField rule={rule} setRule={setRule} err={err} first={words?.first} second={words?.second} />
        {qualifyingInRule ? null : <QualifyingField rule={rule} setRule={setRule} err={err} legend={words?.qualifies} first={words?.first} second={words?.second} />}
      </WithMeaning>
    )
  }
  if (rule.model === "demonstration") {
    // The answer format first (the levels the evaluator picks from, lowest first), then the list itself.
    return (
      <WithMeaning meaning={meaning} data-section="outcomes">
        <FieldSet className="flex flex-col gap-3">
          <FieldLegend variant="label">{words?.levels ?? "Levels, lowest first"}</FieldLegend>
          {words ? null : <PresetChips rule={rule} setRule={setRule} />}
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
        {countsFromInRule ? null : <CountsFromField rule={rule} setRule={setRule} err={err} legend={words?.counts} />}
      </WithMeaning>
    )
  }
  // Questions and scored: the answer format as one sentence line first, then the questions it applies to.
  return (
    <WithMeaning meaning={meaning} data-section="outcomes">
      {rule.model === "scored" ? (
        <ScaleField rule={rule} setRule={setRule} issues={issues} showErrors={showErrors} />
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
          extra={<PasteQuestions existing={rule.questions} onAdd={(lines) => setRule((r) => appendQuestions(r, lines))} />}
        />
      </FieldSet>
      {/* What makes one evaluation count sits with the questions, like "Which levels count" (D-L27, D-L52). */}
      {qualifyingInRule ? null : rule.model === "question" ? <QuestionRuleField rule={rule} setRule={setRule} err={err} /> : <ScoredRuleField rule={rule} setRule={setRule} err={err} />}
    </WithMeaning>
  )
}

/** The scale of the scored model [REQ SC-07]: one sentence line, nothing preselected where the rule has none. */
export function ScaleField({ rule, setRule, issues, showErrors, short }: Pick<SectionProps, "rule" | "setRule" | "issues" | "showErrors"> & { /** The row is labelled Scale: only "1 to [top]" (Configure one skill). */ short?: boolean }) {
  const layer = useFieldLayer()
  const scaleErr = useErr(issues, showErrors)("cfg-scale")
  const scaleTop = Number.isInteger(rule.scaleMax) && rule.scaleMax >= 2 && rule.scaleMax <= 10 ? String(rule.scaleMax) : ""
  return (
    <div className="flex flex-col gap-1">
      <div className="flex flex-wrap items-center gap-2" role="group" aria-labelledby="cfg-scale-lead">
        <span id="cfg-scale-lead" className={TYPE.body}>{short ? "1 to" : "Each question is scored from 1 to"}</span>
        <Select value={scaleTop} onValueChange={(v) => setRule((r) => ({ ...r, scaleMax: Number(v) }))}>
          <SelectTrigger id="cfg-scale" className="w-20" aria-label="Top of the score scale" {...errProps("cfg-scale", scaleErr)}>
            <SelectValue placeholder={short ? "" : "Top"} />
          </SelectTrigger>
          <SelectContent className={layer.menu}>
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
  )
}

/**
 * Which levels count toward achievement (Romit 2026-11-02; checkboxes 2026-11-04, D-L51, D-L74): one checkbox per level, the lowest included (D-L95),
 * lowest first, always expressing a threshold (the engine's minLevelIndex): ticking a level ticks every level above it, unticking a
 * level unticks every level below it. Every box ticked is "at any level". Nothing is preselected; a preset fills the labels only.
 */
export function CountsFromField({ rule, setRule, err, legend, legendHidden }: { rule: LabRule; setRule: SectionProps["setRule"]; err: (f: string) => string | undefined; legend?: string; legendHidden?: boolean }) {
  const id = "cfg-counts-from"
  const message = err(id)
  return (
    <FieldSet id={id} tabIndex={-1} className="outline-none" data-counts-from {...errProps(id, message)}>
      <FieldLegend variant="label" className={legendHidden ? "sr-only" : undefined}>{legend ?? "Which levels count toward achievement?"}</FieldLegend>
      <div className="flex flex-col gap-3">
        {rule.levels.map((name, i) => (
          <div key={i} className="flex items-center gap-2">
            <Checkbox id={`${id}-${i}`} checked={levelTicked(rule, i)} onCheckedChange={(c) => setRule((r) => withLevelTicked(r, i, c === true))} />
            <Label htmlFor={`${id}-${i}`}>{name.trim() || `Level ${i + 1}`}</Label>
          </div>
        ))}
      </div>
      <Err id={id} message={message} />
    </FieldSet>
  )
}

// ---------------------------------------------------------------------------------------------------------------------
// Rule [REQ SC-05, SC-07, SC-10, SC-11, SC-12]: what qualifies one evaluation, how many, and the setting minimums.

export function RuleSection({ rule, setRule, issues, showErrors, settings, conditions = true }: SectionProps & { withMore?: boolean; conditions?: boolean }) {
  const err = useErr(issues, showErrors)
  if (!rule.model) return <p className="text-sm text-muted-foreground">Choose how it&apos;s judged first. The rule depends on it.</p>
  const needErr = err("cfg-need")
  // Compact rule sentences, one line each where they fit (Romit 2026-10-27, "lot of whitespace"): how many the student needs, then
  // the optional conditions as rows under one "Add a condition".
  // Beside them, "What this means" turns the choices into plain words and a worked example.
  return (
    <WithMeaning meaning={ruleMeaning(rule)} data-section="rule">
      <div className="flex flex-col gap-1">
        <div className="flex flex-wrap items-center gap-2" role="group" aria-labelledby="cfg-need-lead">
          <span id="cfg-need-lead" className={TYPE.body}>The student needs</span>
          <RuleNumber id="cfg-need" label="Evaluations that count, needed" value={rule.need} error={!!needErr} onChange={(n) => setRule((r) => ({ ...r, need: n }))} />
          <span className={TYPE.body}>{needTail(rule)}</span>
        </div>
        {/* Levels: the count names the levels chosen on the Levels step; until they are chosen, say where. */}
        {/* School-defined, so the count starts empty and asks; there is no platform default and no preset [CALL 10-26 B.5]. */}
        <Err id="cfg-need" message={needErr} />
      </div>
      {/* Program settings (lib/lab/program-settings.ts) leave the conditions to each skill: setting and level minimums are per skill. */}
      {conditions ? (
        <FieldSet className="flex flex-col gap-2">
          <FieldLegend variant="label">Conditions (optional)</FieldLegend>
          <RuleConditions rule={rule} setRule={setRule} issues={issues} showErrors={showErrors} settings={settings} />
        </FieldSet>
      ) : null}
    </WithMeaning>
  )
}

/** The words after the count: "evaluations that count", or for levels "evaluations rated independent" (one source: the Levels step). */
export function needTail(rule: LabRule): string {
  const noun = rule.need === 1 ? "evaluation" : "evaluations"
  const phrase = rule.model === "demonstration" ? countingLevelsPhrase(rule) : ""
  if (phrase) return `${noun} ${phrase}`
  return rule.need === 1 ? "evaluation that counts" : "evaluations that count"
}

export function QuestionRuleField({ rule, setRule, err, legendHidden, subsetSlot, compact }: { rule: LabRule; setRule: SectionProps["setRule"]; err: (f: string) => string | undefined; legendHidden?: boolean; /** Named questions as a row with its own dialog (Configure one skill), not the list in place. */ subsetSlot?: React.ReactNode; /** The row is labelled Counts when: a Select, not three lines (Configure one skill, map D1c). */ compact?: boolean }) {
  const r = rule.questionRule
  const m = rule.questions.length
  const layer = useFieldLayer()
  const choose = (v: string) => setRule((x) => ({ ...x, questionRule: v === "all" ? { kind: "all" } : v === "atLeast" ? { kind: "atLeast", n: Math.max(1, m - 1) } : { kind: "subset", indices: [] } }))
  if (compact) {
    return (
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Counts when">
          <Select value={r?.kind ?? ""} onValueChange={choose}>
            <SelectTrigger id="cfg-qrule" className="w-44" aria-label="Which answers count" {...errProps("cfg-qrule", err("cfg-qrule"))}>
              <SelectValue placeholder="Choose" />
            </SelectTrigger>
            <SelectContent className={layer.menu}>
              <SelectItem value="all">All Yes</SelectItem>
              <SelectItem value="atLeast">At least</SelectItem>
              <SelectItem value="subset">Named questions</SelectItem>
            </SelectContent>
          </Select>
          {r?.kind === "atLeast" ? (
            <>
              <NumberInput id="cfg-qrule-n" label="Questions that must be answered Yes" hideLabel width="w-16" value={r.n} error={err("cfg-qrule-n")} onChange={(n) => setRule((x) => ({ ...x, questionRule: { kind: "atLeast", n } }))} />
              <span className={TYPE.body}>{m > 0 ? `of ${m} Yes` : "Yes"}</span>
            </>
          ) : null}
        </div>
        <Err id="cfg-qrule" message={err("cfg-qrule") ?? err("cfg-qrule-n")} />
        {r?.kind === "subset" ? subsetSlot : null}
      </div>
    )
  }
  return (
    <FieldSet>
      <FieldLegend variant="label" className={legendHidden ? "sr-only" : undefined}>Counts when</FieldLegend>
      <RadioGroup
        id="cfg-qrule"
        value={r?.kind ?? ""}
        onValueChange={choose}
        className="flex flex-col gap-3 outline-none"
        {...errProps("cfg-qrule", err("cfg-qrule"))}
      >
        <div className="flex items-center gap-2">
          <RadioGroupItem id="cfg-qrule-all" value="all" />
          <Label htmlFor="cfg-qrule-all">All Yes</Label>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <RadioGroupItem id="cfg-qrule-atleast" value="atLeast" />
          <Label htmlFor="cfg-qrule-atleast">At least</Label>
          <NumberInput id="cfg-qrule-n" label="Questions that must be answered Yes" hideLabel width="w-16" value={r?.kind === "atLeast" ? r.n : Number.NaN} error={err("cfg-qrule-n")} onChange={(n) => setRule((x) => ({ ...x, questionRule: { kind: "atLeast", n } }))} />
          {/* No questions yet (a skill waiting for them, or the program's rule): there is no "of 0". */}
          <span className={TYPE.body}>{m > 0 ? `of ${m} Yes` : "Yes"}</span>
        </div>
        <div className="flex items-center gap-2">
          <RadioGroupItem id="cfg-qrule-subsetopt" value="subset" />
          <Label htmlFor="cfg-qrule-subsetopt">Named questions</Label>
        </div>
      </RadioGroup>
      <Err id="cfg-qrule" message={err("cfg-qrule") ?? err("cfg-qrule-n")} />
      {r?.kind === "subset" ? subsetSlot ?? <QuestionSubsetPicker rule={rule} setRule={setRule} error={err("cfg-qrule-subset")} className="ms-6" /> : null}
    </FieldSet>
  )
}

/**
 * The questions that must be answered Yes for a "named questions" rule [REQ SC-05, SC-06]: one checkbox per question, scrolling
 * inside its box for a long question set. Select all and Clear for any set; from more than 10 questions, a numbered range
 * ("Questions 12 to 40") ticks many at once, so a 50 to 100 question set stays usable [REQ SC-06]. Shared by set 1 and 2 (rule
 * step) and set 3 (under the sentence).
 */
export function QuestionSubsetPicker({ rule, setRule, error, className }: { rule: LabRule; setRule: SectionProps["setRule"]; error?: string; className?: string }) {
  const r = rule.questionRule
  const m = rule.questions.length
  const [from, setFrom] = React.useState("")
  const [to, setTo] = React.useState("")
  if (r?.kind !== "subset") return null
  const ticked = r.indices.length
  const range = (on: boolean) => setRule((x) => setSubsetRange(x, Number(from), Number(to), on))
  const rangeOk = Number(from) >= 1 && Number(to) >= Number(from) && Number(from) <= m
  return (
    <div id="cfg-qrule-subset" tabIndex={-1} className={cn("flex flex-col gap-2", className)} role="group" aria-label="Questions that must be Yes">
      {m > 0 ? (
        <div className="flex flex-wrap items-center gap-2" data-subset-tools>
          <span className="text-sm text-muted-foreground tabular-nums" aria-live="polite">{`${ticked} of ${m} selected`}</span>
          <Button type="button" variant="ghost" size="sm" disabled={ticked === m} onClick={() => setRule((x) => setSubsetRange(x, 1, m, true))}>
            Select all
          </Button>
          <Button type="button" variant="ghost" size="sm" disabled={ticked === 0} onClick={() => setRule((x) => setSubsetRange(x, 1, m, false))}>
            Clear
          </Button>
          {m > 10 ? (
            <span className="flex flex-wrap items-center gap-2" role="group" aria-label="Select a range of questions">
              <Label htmlFor="cfg-qsub-from" className="text-sm font-normal">Questions</Label>
              <Input id="cfg-qsub-from" inputMode="numeric" className="w-16" value={from} onChange={(e) => setFrom(e.target.value.replace(/\D/g, ""))} aria-label="First question in the range" />
              <Label htmlFor="cfg-qsub-to" className="text-sm font-normal">to</Label>
              <Input id="cfg-qsub-to" inputMode="numeric" className="w-16" value={to} onChange={(e) => setTo(e.target.value.replace(/\D/g, ""))} aria-label="Last question in the range" />
              <Button type="button" variant="outline" size="sm" disabled={!rangeOk} onClick={() => range(true)}>
                Select range
              </Button>
            </span>
          ) : null}
        </div>
      ) : null}
      <Card size="sm" className="py-0">
      <CardContent className="flex max-h-56 flex-col gap-2 overflow-y-auto py-3">
        {m === 0 ? <p className="text-sm text-muted-foreground">Write the questions first, then select the ones that must be Yes.</p> : null}
        {rule.questions.map((q, i) => (
          <div key={i} className="flex items-center gap-2">
            <Checkbox id={`cfg-qsub-${i}`} checked={r.indices.includes(i)} onCheckedChange={(c) => setRule((x) => ({ ...x, questionRule: { kind: "subset", indices: c ? [...r.indices, i] : r.indices.filter((k) => k !== i) } }))} />
            <Label htmlFor={`cfg-qsub-${i}`}>
              <span className="tabular-nums text-muted-foreground">{`${i + 1}.`}</span> {q.trim() || `Question ${i + 1}`}
            </Label>
          </div>
        ))}
      </CardContent>
      </Card>
      <Err id="cfg-qrule-subset" message={error} />
    </div>
  )
}

/**
 * Paste a list of questions, one per line, beside "Add a question": for a 50 to 100 question set the program writes elsewhere
 * [REQ SC-04, SC-06]. Numbering and bullets are dropped; the dialog says how many it will add before anything changes.
 */
const PASTE_EMPTY = "No questions found. Paste one question per line."

const PASTE_ALL_REPEATS = "These questions are already on the list."

export function PasteQuestions({ onAdd, existing = [] }: { onAdd: (lines: string[]) => void; /** Questions already written: a pasted repeat of one is left out. */ existing?: readonly string[] }) {
  const layer = useFieldLayer()
  const focus = useFocusBack()
  const [open, setOpen] = React.useState(false)
  const [text, setText] = React.useState("")
  const [tried, setTried] = React.useState(false)
  const pasted = parseQuestionLines(text)
  const lines = newQuestionLines(pasted, existing)
  const repeats = pasted.length - lines.length
  const allRepeats = pasted.length > 0 && !lines.length
  const guard = useDialogDiscard(text.trim() !== "", () => { setOpen(false); setText("") })
  return (
    <>
      <Button type="button" variant="ghost" size="sm" className="w-fit" onClick={() => setOpen(true)}>
        Paste a list
      </Button>
      {guard.question}
      <Dialog open={open} onOpenChange={(o) => { if (o) setOpen(true); else guard.close() }}>
        <DialogContent className={cn("sm:max-w-lg", layer.content)} overlayClassName={layer.content} {...focus}>
          <DialogHeader>
            <DialogTitle>Paste questions</DialogTitle>
            {/* Said in the one line the dialog already has: repeats drop out the way Add several skips them [REQ IM-06]. */}
            <DialogDescription aria-live="polite">{repeats && !allRepeats ? `One question per line. ${repeats} ${repeats === 1 ? "repeat is" : "repeats are"} left out.` : "One question per line. Numbering and bullets are removed."}</DialogDescription>
          </DialogHeader>
          <Field>
            <FieldLabel htmlFor="cfg-paste-questions">Questions</FieldLabel>
            <Textarea id="cfg-paste-questions" rows={10} value={text} onChange={(e) => { setText(e.target.value); setTried(false) }} {...errProps("cfg-paste-questions", allRepeats ? PASTE_ALL_REPEATS : tried && !lines.length ? PASTE_EMPTY : undefined)} />
            {allRepeats || (tried && !lines.length) ? <Err id="cfg-paste-questions" message={allRepeats ? PASTE_ALL_REPEATS : PASTE_EMPTY} /> : null}
          </Field>
          <DialogFooter>
            <Button type="button" variant="outline" size="default" onClick={guard.close}>
              Cancel
            </Button>
            <Button type="button" variant="default" size="default" disabled={allRepeats} onClick={() => { if (!lines.length) return setTried(true); onAdd(lines); setOpen(false); setText("") }}>
              {lines.length ? `Add ${lines.length} ${lines.length === 1 ? "question" : "questions"}` : "Add questions"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

const SCORED_KINDS: Array<{ value: "average" | "minEach" | "total"; label: string }> = [
  { value: "average", label: "Average" },
  { value: "minEach", label: "Minimum on every question" },
  { value: "total", label: "Total" },
]

export function ScoredRuleField({ rule, setRule, err, radios, legendHidden, compact }: { rule: LabRule; setRule: SectionProps["setRule"]; err: (f: string) => string | undefined; /** The Evaluation settings control (map D3), where a sentence would not fit. */ radios?: boolean; legendHidden?: boolean; /** The row is labelled Counts when: which score, and at least what (Configure one skill, map D1c). */ compact?: boolean }) {
  const r = rule.scoredRule
  const layer = useFieldLayer()
  // The pass mark can be typed before the "which score" choice: it waits here and goes into the rule with the choice (else the
  // earlier starting value, 60% of the scale, as before).
  const [pendingValue, setPendingValue] = React.useState<number>(Number.NaN)
  const max = r?.kind === "total" ? rule.scaleMax * Math.max(1, rule.questions.length) : rule.scaleMax
  if (radios) {
    const start = () => (Number.isFinite(pendingValue) ? pendingValue : Number.NaN)
    return (
      <FieldSet>
        <FieldLegend variant="label" className={legendHidden ? "sr-only" : undefined}>Counts when</FieldLegend>
        <RadioGroup id="cfg-srule" value={r?.kind ?? ""} onValueChange={(v) => setRule((x) => ({ ...x, scoredRule: { kind: v as "average" | "minEach" | "total", value: r?.value ?? start() } }))} className="flex flex-col gap-3 outline-none" {...errProps("cfg-srule", err("cfg-srule"))}>
          {SCORED_KINDS.map((k) => (
            <div key={k.value} className="flex items-center gap-2">
              <RadioGroupItem id={`cfg-srule-${k.value}`} value={k.value} />
              <Label htmlFor={`cfg-srule-${k.value}`} className="font-normal">{k.label}</Label>
            </div>
          ))}
        </RadioGroup>
        <div className="flex items-center gap-2">
          <Label htmlFor="cfg-srule-value">Value</Label>
          <NumberInput id="cfg-srule-value" label="Value" width="w-16" value={r ? r.value : pendingValue} error={err("cfg-srule-value")} onChange={(n) => (r ? setRule((x) => ({ ...x, scoredRule: { kind: r.kind, value: n } })) : setPendingValue(n))} />
        </div>
        <Err id="cfg-srule" message={err("cfg-srule") ?? err("cfg-srule-value")} />
      </FieldSet>
    )
  }
  if (compact) {
    return (
      <div className="flex flex-col gap-1">
        <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Counts when">
          <Select value={r?.kind ?? ""} onValueChange={(v) => setRule((x) => ({ ...x, scoredRule: { kind: v as "average" | "minEach" | "total", value: r?.value ?? (Number.isFinite(pendingValue) ? pendingValue : Number.NaN) } }))}>
            <SelectTrigger id="cfg-srule" className="w-44" aria-label="Which score counts" {...errProps("cfg-srule", err("cfg-srule"))}>
              <SelectValue placeholder="Choose" />
            </SelectTrigger>
            <SelectContent className={layer.menu}>
              <SelectItem value="average">Average</SelectItem>
              <SelectItem value="minEach">Every question</SelectItem>
              <SelectItem value="total">Total</SelectItem>
            </SelectContent>
          </Select>
          <span className={TYPE.body}>at least</span>
          <NumberInput id="cfg-srule-value" label="Score that counts" hideLabel width="w-16" value={r ? r.value : pendingValue} error={err("cfg-srule-value")} onChange={(n) => (r ? setRule((x) => ({ ...x, scoredRule: { kind: r.kind, value: n } })) : setPendingValue(n))} />
        </div>
        <Err id="cfg-srule" message={err("cfg-srule") ?? err("cfg-srule-value")} />
      </div>
    )
  }
  // One sentence line (Romit 2026-10-27): "Counts when [every question scores] at least [4] out of 5".
  return (
    <div className="flex flex-col gap-1">
      <div className="flex flex-wrap items-center gap-2" role="group" aria-labelledby="cfg-srule-lead">
        <span id="cfg-srule-lead" className={TYPE.body}>Counts when</span>
        <Select value={r?.kind ?? ""} onValueChange={(v) => setRule((x) => ({ ...x, scoredRule: { kind: v as "average" | "minEach" | "total", value: r?.value ?? (Number.isFinite(pendingValue) ? pendingValue : Math.ceil(x.scaleMax * 0.6)) } }))}>
          <SelectTrigger id="cfg-srule" className="w-48" aria-label="Which score counts" {...errProps("cfg-srule", err("cfg-srule"))}>
            <SelectValue placeholder="Choose which score" />
          </SelectTrigger>
          <SelectContent className={layer.menu}>
            <SelectItem value="minEach">every question scores</SelectItem>
            <SelectItem value="average">the average score is</SelectItem>
            <SelectItem value="total">the total score is</SelectItem>
          </SelectContent>
        </Select>
        <span className={TYPE.body}>at least</span>
        <NumberInput
          id="cfg-srule-value"
          label="Value"
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
// Who does what [REQ SC-13, SC-14, SC-15, SC-16]

/** A toggle with its title; `detail` only when the title alone would hide a consequence (say it once). */
function ToggleRow({ id, title, detail: given, checked, onChange }: { id: string; title: string; detail?: string; checked: boolean; onChange: (v: boolean) => void }) {
  void given
  const detail: string | undefined = undefined
  // The switch sits right before its label (Romit 2026-11-02: toggles floated far from their text at wide widths).
  return (
    <div className="flex items-start gap-3 py-1">
      <ToggleSwitch id={id} checked={checked} onChange={onChange} aria-labelledby={detail ? `${id}-label ${id}-detail` : `${id}-label`} />
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
    </div>
  )
}

type FieldDraft = { label: string; type: FieldType; mandatory: boolean; choices?: string[] }

/**
 * Add or edit what the student supplies [REQ SC-13]: a label, a data type, whether it is required and, for a choice list, its
 * choices (one per line, at least two). Editing keeps the field's place in the list.
 */
function FieldDialog({ open, onOpenChange, onSave, taken, initial }: { open: boolean; onOpenChange: (o: boolean) => void; onSave: (f: FieldDraft) => void; taken: string[]; initial?: FieldDraft | null }) {
  const layer = useFieldLayer()
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
  const changed = label !== (initial?.label ?? "") || type !== (initial?.type ?? "short") || mandatory !== (initial?.mandatory ?? false) || choices !== (initial?.choices ?? []).join("\n")
  const guard = useDialogDiscard(changed, () => onOpenChange(false))
  const focus = useFocusBack()
  return (
    <>
    {guard.question}
    <Dialog open={open} onOpenChange={(o) => { if (o) onOpenChange(true); else guard.close() }}>
      <DialogContent className={cn("sm:max-w-md", layer.content)} overlayClassName={layer.content} {...focus}>
        <DialogHeader>
          <DialogTitle>{initial ? "Edit field" : "Add a field"}</DialogTitle>
          <DialogDescription className="sr-only">{`The student fills it in when sending this ${skillNoun()}.`}</DialogDescription>
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
              <SelectContent className={layer.menu}>
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
          <Button type="button" variant="outline" size="default" onClick={guard.close}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="default"
            size="default"
            disabled={!!initial && !changed}
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
    </>
  )
}

/**
 * Who does what (Romit relaying Sankalp 2026-10-28: "What student adds position looks wrong"): one
 * column grouped by subject, each with its own switch, in the order the work happens: 1 Student (fields, self-evaluation),
 * 2 Evaluator (roles, feedback), 3 Approval. The full-width rule (D-L5) is met by the preview aside, not by splitting fields.
 */
/** What the student adds when submitting [REQ SC-13]: the field list with Edit, Remove and Add a field. */
export function StudentFieldsField({ rule, setRule, issues, showErrors, inTitledDialog, legend = "What the student adds" }: SectionProps & { /** The dialog's title says it: the legend stays for a screen reader only. */ inTitledDialog?: boolean; legend?: string }) {
  const err = useErr(issues, showErrors)
  const [adding, setAdding] = React.useState(false)
  const [editing, setEditing] = React.useState<number | null>(null)
  return (
    <FieldSet>
      <FieldLegend variant="label" className={inTitledDialog ? "sr-only" : undefined}>{legend}</FieldLegend>
      <ul className="@container flex flex-col divide-y divide-border rounded-[var(--radius)] border border-border">
        {rule.studentFields.map((f, i) => {
          const id = `cfg-field-${i}`
          const name = f.label.trim() || `field ${i + 1}`
          return (
            <li key={i} className="flex flex-col gap-1 px-3 py-1.5">
              {/* When the list is narrower than 32rem (a card in a two-column page at 1280 px, or a phone) the name takes its own
                  line and wraps, so it is never cut by the type and Required columns; wider, it shares the row. Container query,
                  not a viewport breakpoint: the card's width, not the window's, decides. */}
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <span className={cn("min-w-0 basis-full break-words @min-[32rem]:basis-0 @min-[32rem]:flex-1 @min-[32rem]:truncate", TYPE.body)}>{f.label.trim() || "Untitled field"}</span>
                <span className={cn("w-28 shrink-0", TYPE.helper)}>{`${FIELD_TYPE_LABEL[f.type]}${f.type === "choice" && f.choices?.length ? ` (${f.choices.length})` : ""}`}</span>
                <span className={cn("w-20 shrink-0", TYPE.helper)}>{f.mandatory ? "Required" : "Optional"}</span>
                <span className="ms-auto flex items-center gap-1">
                  <Button type="button" variant="ghost" size="sm" aria-label={`Edit ${name}`} onClick={() => setEditing(i)}>
                    Edit
                  </Button>
                  <RemoveButton id={id} label={`Remove ${name}`} onClick={() => setRule((r) => ({ ...r, studentFields: r.studentFields.filter((_, k) => k !== i) }))} />
                </span>
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
  )
}

/** Student rates themselves first [REQ SC-15]. */
export function SelfRatingToggle({ rule, setRule, title = "Student rates themselves first" }: Pick<SectionProps, "rule" | "setRule"> & { title?: string }) {
  return <ToggleRow id="cfg-self" title={title} checked={rule.selfEvaluation} onChange={(v) => setRule((r) => ({ ...r, selfEvaluation: v }))} />
}

/** Which evaluator roles can sign off [REQ SC-16]. */
export function SignersField({ rule, setRule, issues, showErrors, legendHidden, compact }: SectionProps & { /** Closer together, so the three stay on one line in a narrow column. */ compact?: boolean }) {
  const roleErr = useErr(issues, showErrors)("cfg-role-preceptor")
  return (
    <FieldSet>
      <FieldLegend variant="label" className={legendHidden ? "sr-only" : undefined}>Who can sign off</FieldLegend>
      <div className={cn("flex flex-wrap gap-y-3", compact ? "gap-x-4" : "gap-x-6")}>
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
  )
}

/** Feedback is required [REQ SC-14]. */
export function FeedbackToggle({ rule, setRule, title = "Feedback is required" }: Pick<SectionProps, "rule" | "setRule"> & { title?: string }) {
  return <ToggleRow id="cfg-feedback" title={title} checked={rule.feedbackRequired} onChange={(v) => setRule((r) => ({ ...r, feedbackRequired: v }))} />
}

/** Approval before it counts [REQ SC-15]. */
export function ApprovalToggle({ rule, setRule }: Pick<SectionProps, "rule" | "setRule">) {
  return <ToggleRow id="cfg-approval" title="Approval before it counts" checked={rule.approvalRequired} onChange={(v) => setRule((r) => ({ ...r, approvalRequired: v }))} />
}

export function SignOffSection(props: SectionProps) {
  const { rule, setRule } = props
  return (
    <div className="flex flex-col gap-6" data-section="signoff">
      <RoleRow role="student">
        <StudentFieldsField {...props} />
        <SelfRatingToggle rule={rule} setRule={setRule} />
      </RoleRow>
      <RoleRow role="evaluator">
        <SignersField {...props} />
        <FeedbackToggle rule={rule} setRule={setRule} />
        {rule.model ? <GroupCheckOffSection rule={rule} setRule={setRule} /> : null}
      </RoleRow>
      <RoleRow role="approval">
        <ApprovalToggle rule={rule} setRule={setRule} />
      </RoleRow>
    </div>
  )
}

/**
 * Group check-off (PROTO 2026-10-28, Configure "Group check-off"; CALL 10-28): whether faculty can check this skill off for a whole
 * group on the course offering page without a student submission, and what one check-off records. A rule with no saved choice starts
 * off (`withCheckOffDecided`); seeded skills read the engine's model default. Under Evaluator on every Configure page (D-L52).
 */
export function GroupCheckOffSection({ rule, setRule, title = "Allow group check-off", switchOnly }: Pick<SectionProps, "rule" | "setRule"> & { title?: string; /** The row carries the label beside the switch. */ switchOnly?: string }) {
  const allowed = ruleAllowsCheckOff(rule)
  const onChange = (v: boolean) => setRule((r) => withCheckOffPatch(r, { enabled: v }))
  const select = checkOffGrantSelect(rule, setRule)
  return (
    <div className="flex flex-col gap-3" data-section="checkoff">
      {switchOnly ? <ToggleSwitch id="cfg-checkoff" aria-labelledby={switchOnly} checked={allowed} onChange={onChange} /> : <ToggleRow id="cfg-checkoff" title={title} checked={allowed} onChange={onChange} />}
      {select ? (
        <Field className="max-w-64">
          <FieldLabel htmlFor={select.id}>{rule.model === "scored" ? "Score for each student checked off" : "Level for each student checked off"}</FieldLabel>
          {select.control}
        </Field>
      ) : null}
    </div>
  )
}

export const withCheckOffPatch = (r: LabRule, patch: Partial<NonNullable<LabRule["checkOff"]>>): LabRule => ({ ...r, checkOff: { ...(r.checkOff ?? { enabled: null, levelIndex: null, score: null }), ...patch } })

/** What one group check-off records: the select, for the row that labels it. Levels by name once one has a name; scores on the scale; nothing for the other models or while it is off. */
function CheckOffSelect({ value, onChange, options, id, className }: { value: string; onChange: (v: string) => void; options: Array<{ value: string; label: string }>; id: string; className?: string }) {
  const layer = useFieldLayer()
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger id={id} className={className}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent className={layer.menu}>
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

export function checkOffGrantSelect(rule: LabRule, setRule: SectionProps["setRule"]): { id: string; control: React.ReactNode } | null {
  if (!ruleAllowsCheckOff(rule)) return null
  const co = rule.checkOff
  if (rule.model === "demonstration") {
    const levels = rule.levels.map((l, i) => ({ i, label: l.trim() })).filter((l) => l.label)
    if (!levels.length) return null
    const index = levels.some((l) => l.i === co?.levelIndex) ? co!.levelIndex! : levels[levels.length - 1]!.i
    return { id: "cfg-checkoff-level", control: <CheckOffSelect id="cfg-checkoff-level" value={String(index)} onChange={(v) => setRule((r) => withCheckOffPatch(r, { levelIndex: Number(v) }))} options={levels.map((l) => ({ value: String(l.i), label: l.label }))} /> }
  }
  if (rule.model === "scored") {
    const options = Array.from({ length: Math.max(1, rule.scaleMax || 5) }, (_, k) => ({ value: String(k + 1), label: String(k + 1) }))
    return { id: "cfg-checkoff-score", control: <CheckOffSelect id="cfg-checkoff-score" className="w-24" value={String(ruleCheckOffScore(rule))} onChange={(v) => setRule((r) => withCheckOffPatch(r, { score: Number(v) }))} options={options} /> }
  }
  return null
}

export const SECTION_BODY: Record<SectionId, (p: SectionProps) => React.ReactElement> = {
  model: (p) => <ModelSection {...p} />,
  outcomes: (p) => <OutcomesSection {...p} />,
  rule: (p) => <RuleSection {...p} />,
  signoff: (p) => <SignOffSection {...p} />,
}
