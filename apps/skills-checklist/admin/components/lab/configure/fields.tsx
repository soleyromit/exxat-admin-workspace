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
import { Badge } from "@exxatdesignux/ui/components/ui/badge"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import { Checkbox } from "@exxatdesignux/ui/components/ui/checkbox"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@exxatdesignux/ui/components/ui/collapsible"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@exxatdesignux/ui/components/ui/dialog"
import { Field, FieldDescription, FieldError, FieldLabel, FieldLegend, FieldSet } from "@exxatdesignux/ui/components/ui/field"
import { Input } from "@exxatdesignux/ui/components/ui/input"
import { Label } from "@exxatdesignux/ui/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@exxatdesignux/ui/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@exxatdesignux/ui/components/ui/select"
import { Tip } from "@exxatdesignux/ui/components/ui/tip"
import { ToggleSwitch } from "@exxatdesignux/ui/components/ui/toggle-switch"
import { cn } from "@exxatdesignux/ui/lib/utils"
import { applyPreset, carriedNotes, FIELD_TYPE_LABEL, hasNeed, LAB_MODELS as MODELS, LABEL_PRESETS, MODEL_HELP, MODEL_LABEL, PROPOSED_MODELS, ROLE_LABEL, ROLES, withModel, type FieldType, type LabelPresetId, type LabRule, type RuleIssue, type SectionId } from "@/lib/lab/configure"
import type { EvalModel } from "@/lib/v2/types"
import { aNoun, skillNoun } from "@/lib/lab/terms"

export interface SectionProps {
  rule: LabRule
  setRule: (fn: (r: LabRule) => LabRule) => void
  issues: RuleIssue[]
  /** Show field errors (after the admin tried to move on or publish). */
  showErrors: boolean
  settings: string[]
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

function RemoveButton({ id, label, onClick }: { id?: string; label: string; onClick: () => void }) {
  return (
    <Button id={id} type="button" variant="ghost" size="icon-sm" aria-label={label} onClick={onClick}>
      <i className="fa-light fa-xmark" aria-hidden="true" />
    </Button>
  )
}

/** Small "Proposed" marker for a rule the requirements do not ask for (LEDGER D-X6). */
export function ProposedBadge({ note }: { note: string }) {
  return (
    <Tip label={note}>
      <Badge variant="outline" tabIndex={0}>
        Proposed
      </Badge>
    </Tip>
  )
}

// ---------------------------------------------------------------------------------------------------------------------
// Model [REQ SC-01, SC-02, SC-09]: nothing preselected; each option says its consequence in one line.

export function ModelSection({ rule, setRule, issues, showErrors, columns = 2, legend, onChosen }: SectionProps & { columns?: 1 | 2 | 4; legend?: string; onChosen?: (m: EvalModel) => void }) {
  const err = useErr(issues, showErrors)("cfg-model")
  const [pending, setPending] = React.useState<EvalModel | null>(null)
  const choose = (m: EvalModel) => {
    setRule((r) => withModel(r, m))
    onChosen?.(m)
  }
  const onValue = (v: string) => {
    const m = v as EvalModel
    if (rule.model && rule.model !== m) setPending(m)
    else choose(m)
  }
  return (
    <FieldSet className="flex flex-col gap-3" data-section="model">
      <FieldLegend className="text-base font-medium">{legend ?? `How is this ${skillNoun()} evaluated?`}</FieldLegend>
      <RadioGroup
        id="cfg-model"
        tabIndex={-1}
        value={rule.model ?? ""}
        onValueChange={onValue}
        aria-label="Evaluation model"
        className={cn(columns === 4 ? "flex flex-wrap gap-x-6 gap-y-3 outline-none" : "grid gap-3 outline-none", columns === 2 && "sm:grid-cols-2 @min-[56rem]:grid-cols-4")}
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
                {PROPOSED_MODELS.has(m) ? <ProposedBadge note="Not part of the agreed criteria types yet." /> : null}
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
                  {PROPOSED_MODELS.has(m) ? <ProposedBadge note="Not part of the agreed criteria types yet." /> : null}
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
            <AlertDialogTitle>Change the model?</AlertDialogTitle>
            <AlertDialogDescription>The rule is rebuilt for the new model. Questions, levels and level minimums you set are cleared.</AlertDialogDescription>
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
              Change model
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </FieldSet>
  )
}

// ---------------------------------------------------------------------------------------------------------------------
// Outcomes, questions or levels [REQ SC-03, SC-04, SC-07, SC-08]

function ListEditor({ idBase, noun, values, onChange, addId, ordered, err }: { idBase: string; noun: string; values: string[]; onChange: (v: string[]) => void; addId: string; ordered?: boolean; err: (f: string) => string | undefined }) {
  const move = (i: number, d: -1 | 1) => {
    const next = [...values]
    const j = i + d
    if (j < 0 || j >= next.length) return
    ;[next[i], next[j]] = [next[j], next[i]]
    onChange(next)
  }
  return (
    <div className="flex flex-col gap-2">
      <ol className="flex flex-col gap-2">
        {values.map((v, i) => {
          const id = `${idBase}-${i}`
          const e = err(id)
          return (
            <li key={i} className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <span className="w-6 shrink-0 text-end text-sm tabular-nums text-muted-foreground" aria-hidden="true">
                  {i + 1}
                </span>
                <Input id={id} aria-label={`${noun} ${i + 1}`} value={v} onChange={(ev) => onChange(values.map((x, k) => (k === i ? ev.target.value : x)))} {...errProps(id, e)} />
                {ordered ? (
                  <>
                    <Button type="button" variant="ghost" size="icon-sm" aria-label={`Move ${noun.toLowerCase()} ${i + 1} up`} disabled={i === 0} onClick={() => move(i, -1)}>
                      <i className="fa-light fa-arrow-up" aria-hidden="true" />
                    </Button>
                    <Button type="button" variant="ghost" size="icon-sm" aria-label={`Move ${noun.toLowerCase()} ${i + 1} down`} disabled={i === values.length - 1} onClick={() => move(i, 1)}>
                      <i className="fa-light fa-arrow-down" aria-hidden="true" />
                    </Button>
                  </>
                ) : null}
                <RemoveButton label={`Remove ${noun.toLowerCase()} ${i + 1}`} onClick={() => onChange(values.filter((_, k) => k !== i))} />
              </div>
              <div className="ps-8">
                <Err id={id} message={e} />
              </div>
            </li>
          )
        })}
      </ol>
      <div>
        <Button id={addId} type="button" variant="outline" size="sm" onClick={() => onChange([...values, ""])}>
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
      <span className="text-sm text-muted-foreground">You can edit them after.</span>
    </div>
  )
}

export function OutcomesSection({ rule, setRule, issues, showErrors }: SectionProps) {
  const err = useErr(issues, showErrors)
  if (!rule.model) return <p className="text-sm text-muted-foreground">Choose how it&apos;s judged first. The criteria depend on it.</p>
  if (rule.model === "binary") {
    return (
      <div className="flex flex-col gap-6 @min-[56rem]:grid @min-[56rem]:grid-cols-2 @min-[56rem]:items-start @min-[56rem]:gap-x-10" data-section="outcomes">
        <PresetChips rule={rule} setRule={setRule} />
        <div className="grid gap-4 sm:grid-cols-2">
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
      </div>
    )
  }
  if (rule.model === "demonstration") {
    return (
      <FieldSet data-section="outcomes" className="flex flex-col gap-3">
        <FieldLegend variant="label">Levels, lowest first</FieldLegend>
        <PresetChips rule={rule} setRule={setRule} />
        <ListEditor idBase="cfg-level" noun="Level" addId="cfg-add-level" ordered values={rule.levels} err={err} onChange={(levels) => setRule((r) => ({ ...r, levels, levelMinimums: r.levelMinimums.filter((m) => m.levelIndex < levels.length) }))} />
      </FieldSet>
    )
  }
  return (
    <div className="flex flex-col gap-6 @min-[56rem]:grid @min-[56rem]:grid-cols-2 @min-[56rem]:items-start @min-[56rem]:gap-x-10" data-section="outcomes">
      <FieldSet>
        <FieldLegend variant="label">Questions the evaluator answers</FieldLegend>
        <ListEditor
          idBase="cfg-question"
          noun="Question"
          addId="cfg-add-question"
          values={rule.questions}
          err={err}
          onChange={(questions) => setRule((r) => ({ ...r, questions, questionRule: r.questionRule?.kind === "subset" ? { kind: "subset", indices: r.questionRule.indices.filter((i) => i < questions.length) } : r.questionRule }))}
        />
      </FieldSet>
      {rule.model === "scored" ? (
        <Field orientation="horizontal" className="items-center gap-2">
          <FieldLabel htmlFor="cfg-scale">Scale from 1 to</FieldLabel>
          <NumberInput id="cfg-scale" label="Scale top" value={rule.scaleMax} error={err("cfg-scale")} onChange={(n) => setRule((r) => ({ ...r, scaleMax: n }))} />
          <Err id="cfg-scale" message={err("cfg-scale")} />
        </Field>
      ) : null}
    </div>
  )
}

// ---------------------------------------------------------------------------------------------------------------------
// Rule [REQ SC-05, SC-07, SC-10, SC-11, SC-12]: what qualifies one evaluation, how many, and the setting minimums.

/** A label on the left and a number on the right, one row. */
function NumberRow({ id, label, value, onChange, error, after }: { id: string; label: string; value: number; onChange: (n: number) => void; error?: string; after?: React.ReactNode }) {
  return (
    <Field className="gap-1">
      <div className="flex flex-wrap items-center gap-3">
        <FieldLabel htmlFor={id} className="w-60">
          {label}
        </FieldLabel>
        <NumberInput id={id} label={label} value={value} error={error} onChange={onChange} />
        {after}
      </div>
      <Err id={id} message={error} />
    </Field>
  )
}

export function RuleSection({ rule, setRule, issues, showErrors, settings, withMore = true }: SectionProps & { withMore?: boolean }) {
  const err = useErr(issues, showErrors)
  if (!rule.model) return <p className="text-sm text-muted-foreground">Choose how it&apos;s judged first. The rule depends on it.</p>
  return (
    <div className="flex flex-col gap-8 @min-[56rem]:grid @min-[56rem]:grid-cols-2 @min-[56rem]:items-start @min-[56rem]:gap-x-10" data-section="rule">
      {rule.model === "question" ? <QuestionRuleField rule={rule} setRule={setRule} err={err} /> : null}
      {rule.model === "scored" ? <ScoredRuleField rule={rule} setRule={setRule} err={err} /> : null}
      <FieldSet className="flex flex-col gap-4">
        <FieldLegend variant="label">What achievement requires</FieldLegend>
        {/* School-defined, so the count starts empty and asks; there is no platform default and no preset [CALL 10-26 B.5]. */}
        {!hasNeed(rule) && !err("cfg-need") ? <FieldDescription data-empty-need>Your program sets this number. Nothing is filled in for you.</FieldDescription> : null}
        <NumberRow id="cfg-need" label="Valid attempts needed" value={rule.need} error={err("cfg-need")} onChange={(n) => setRule((r) => ({ ...r, need: n }))} />
        {rule.model === "demonstration" ? <LevelMinimums rule={rule} setRule={setRule} err={err} /> : null}
        <SettingMinimums rule={rule} setRule={setRule} err={err} settings={settings} />
      </FieldSet>
      {withMore ? <MoreRuleOptions rule={rule} setRule={setRule} issues={issues} showErrors={showErrors} settings={settings} /> : null}
    </div>
  )
}

/** Different evaluators (Proposed, D-X6) and any parts carried from the earlier rule, one disclosure level down. */
export function MoreRuleOptions({ rule, setRule, issues, showErrors }: SectionProps) {
  const err = useErr(issues, showErrors)
  const notes = carriedNotes(rule)
  const hasError = !!err("cfg-distinct")
  const [open, setOpen] = React.useState(() => rule.distinctEvaluators >= 2 || notes.length > 0)
  React.useEffect(() => {
    if (hasError) setOpen(true)
  }, [hasError])
  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger asChild>
        <Button type="button" variant="ghost" size="sm" className="-ms-2" aria-expanded={open}>
          More rule options
          <i className={`fa-light ${open ? "fa-chevron-up" : "fa-chevron-down"} text-xs`} aria-hidden="true" />
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="flex flex-col gap-4 pt-3">
        <NumberRow
          id="cfg-distinct"
          label="Different evaluators"
          value={rule.distinctEvaluators}
          error={err("cfg-distinct")}
          onChange={(n) => setRule((r) => ({ ...r, distinctEvaluators: n }))}
          after={<ProposedBadge note="Not agreed for the first release. 1 means any evaluator." />}
        />
        {notes.length ? (
          <div className="flex flex-col gap-2" data-carried>
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-medium text-foreground">Kept from the current rule</p>
              <ProposedBadge note="From an earlier prototype; still changes counts today. Removing them shows in Check." />
            </div>
            <ul className="flex flex-col gap-1 text-sm text-muted-foreground">
              {notes.map((n) => (
                <li key={n}>{n}</li>
              ))}
            </ul>
            <div>
              <Button type="button" variant="outline" size="sm" onClick={() => setRule((r) => ({ ...r, carried: { window: null, minLevelIndex: null, simulationCapPercent: null, simulationExcluded: false } }))}>
                Remove these
              </Button>
            </div>
          </div>
        ) : null}
      </CollapsibleContent>
    </Collapsible>
  )
}

function QuestionRuleField({ rule, setRule, err }: { rule: LabRule; setRule: SectionProps["setRule"]; err: (f: string) => string | undefined }) {
  const r = rule.questionRule
  const m = rule.questions.length
  return (
    <FieldSet>
      <FieldLegend variant="label">A valid attempt needs</FieldLegend>
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
          <Label htmlFor="cfg-qrule-all">Every question answered Yes</Label>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <RadioGroupItem id="cfg-qrule-atleast" value="atLeast" />
          <Label htmlFor="cfg-qrule-atleast">At least</Label>
          <NumberInput id="cfg-qrule-n" label="Questions that must be answered Yes" hideLabel value={r?.kind === "atLeast" ? r.n : Number.NaN} error={err("cfg-qrule-n")} onChange={(n) => setRule((x) => ({ ...x, questionRule: { kind: "atLeast", n } }))} />
          <span className="text-sm text-foreground">{`of ${m} ${m === 1 ? "question" : "questions"} answered Yes`}</span>
        </div>
        <div className="flex items-center gap-2">
          <RadioGroupItem id="cfg-qrule-subsetopt" value="subset" />
          <Label htmlFor="cfg-qrule-subsetopt">These questions answered Yes</Label>
        </div>
      </RadioGroup>
      <Err id="cfg-qrule" message={err("cfg-qrule") ?? err("cfg-qrule-n")} />
      {r?.kind === "subset" ? (
        <div id="cfg-qrule-subset" tabIndex={-1} className="ms-6 flex max-h-56 flex-col gap-2 overflow-y-auto rounded-md border border-border p-3" role="group" aria-label="Questions that must be Yes">
          {rule.questions.map((q, i) => (
            <div key={i} className="flex items-center gap-2">
              <Checkbox id={`cfg-qsub-${i}`} checked={r.indices.includes(i)} onCheckedChange={(c) => setRule((x) => ({ ...x, questionRule: { kind: "subset", indices: c ? [...r.indices, i] : r.indices.filter((k) => k !== i) } }))} />
              <Label htmlFor={`cfg-qsub-${i}`}>{q.trim() || `Question ${i + 1}`}</Label>
            </div>
          ))}
          <Err id="cfg-qrule-subset" message={err("cfg-qrule-subset")} />
        </div>
      ) : null}
    </FieldSet>
  )
}

function ScoredRuleField({ rule, setRule, err }: { rule: LabRule; setRule: SectionProps["setRule"]; err: (f: string) => string | undefined }) {
  const r = rule.scoredRule
  return (
    <FieldSet>
      <FieldLegend variant="label">An evaluation qualifies when</FieldLegend>
      <div className="flex flex-wrap items-center gap-2">
        <Select value={r?.kind ?? ""} onValueChange={(v) => setRule((x) => ({ ...x, scoredRule: { kind: v as "average" | "minEach" | "total", value: r?.value ?? Math.ceil(x.scaleMax * 0.6) } }))}>
          <SelectTrigger id="cfg-srule" className="w-64" aria-label="How a score qualifies" {...errProps("cfg-srule", err("cfg-srule"))}>
            <SelectValue placeholder="Choose a method" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="average">The average is at least</SelectItem>
            <SelectItem value="minEach">Every question scores at least</SelectItem>
            <SelectItem value="total">The total is at least</SelectItem>
          </SelectContent>
        </Select>
        {r ? <NumberInput id="cfg-srule-value" label="Pass mark" hideLabel value={r.value} error={err("cfg-srule-value")} onChange={(n) => setRule((x) => ({ ...x, scoredRule: { kind: r.kind, value: n } }))} /> : null}
      </div>
      <Err id="cfg-srule" message={err("cfg-srule") ?? err("cfg-srule-value")} />
    </FieldSet>
  )
}

function LevelMinimums({ rule, setRule, err }: { rule: LabRule; setRule: SectionProps["setRule"]; err: (f: string) => string | undefined }) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm font-medium text-foreground">Level minimums</p>
      {rule.levelMinimums.map((lm, i) => (
        <div key={i} className="flex flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-foreground">At least</span>
            <NumberInput id={`cfg-lmin-${i}`} label={`Level minimum ${i + 1}`} hideLabel value={lm.min} error={err(`cfg-lmin-${i}`)} onChange={(n) => setRule((r) => ({ ...r, levelMinimums: r.levelMinimums.map((x, k) => (k === i ? { ...x, min: n } : x)) }))} />
            <span className="text-sm text-foreground">at</span>
            <Select value={String(lm.levelIndex)} onValueChange={(v) => setRule((r) => ({ ...r, levelMinimums: r.levelMinimums.map((x, k) => (k === i ? { ...x, levelIndex: Number(v) } : x)) }))}>
              <SelectTrigger id={`cfg-lmin-level-${i}`} className="w-48" aria-label={`Level for minimum ${i + 1}`}>
                <SelectValue placeholder="Choose a level" />
              </SelectTrigger>
              <SelectContent>
                {rule.levels.map((l, k) => (
                  <SelectItem key={k} value={String(k)} disabled={!l.trim()}>
                    {l.trim() || `Level ${k + 1}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="text-sm text-foreground">or above</span>
            <RemoveButton label={`Remove level minimum ${i + 1}`} onClick={() => setRule((r) => ({ ...r, levelMinimums: r.levelMinimums.filter((_, k) => k !== i) }))} />
          </div>
          <Err id={`cfg-lmin-${i}`} message={err(`cfg-lmin-${i}`) ?? err(`cfg-lmin-level-${i}`)} />
        </div>
      ))}
      <div>
        <Button type="button" variant="outline" size="sm" disabled={rule.levels.length === 0} onClick={() => setRule((r) => ({ ...r, levelMinimums: [...r.levelMinimums, { levelIndex: Math.max(0, r.levels.length - 1), min: 1 }] }))}>
          Add a level minimum
        </Button>
      </div>
    </div>
  )
}

/** Clinical setting minimums [REQ SC-11]. Lab and simulation never count toward one [REQ SC-12], said once, here. */
function SettingMinimums({ rule, setRule, err, settings }: { rule: LabRule; setRule: SectionProps["setRule"]; err: (f: string) => string | undefined; settings: string[] }) {
  const used = new Set(rule.settingMinimums.map((m) => m.setting))
  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm font-medium text-foreground">Setting minimums</p>
      {rule.settingMinimums.map((m, i) => (
        <div key={i} className="flex flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2">
            <NumberInput id={`cfg-setting-min-${i}`} label={`Minimum for row ${i + 1}`} hideLabel value={m.min} error={err(`cfg-setting-min-${i}`)} onChange={(n) => setRule((r) => ({ ...r, settingMinimums: r.settingMinimums.map((x, k) => (k === i ? { ...x, min: n } : x)) }))} />
            <span className="text-sm text-foreground">in</span>
            <Select value={m.setting} onValueChange={(v) => setRule((r) => ({ ...r, settingMinimums: r.settingMinimums.map((x, k) => (k === i ? { ...x, setting: v } : x)) }))}>
              <SelectTrigger id={`cfg-setting-${i}`} className="w-48" aria-label={`Clinical setting for row ${i + 1}`} {...errProps(`cfg-setting-${i}`, err(`cfg-setting-${i}`))}>
                <SelectValue placeholder="Choose a setting" />
              </SelectTrigger>
              <SelectContent>
                {settings.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <RemoveButton label={`Remove ${m.setting || "setting"} minimum`} onClick={() => setRule((r) => ({ ...r, settingMinimums: r.settingMinimums.filter((_, k) => k !== i) }))} />
          </div>
          <Err id={`cfg-setting-${i}`} message={err(`cfg-setting-${i}`) ?? err(`cfg-setting-min-${i}`)} />
        </div>
      ))}
      <div>
        <Button type="button" variant="outline" size="sm" disabled={used.size >= settings.length} onClick={() => setRule((r) => ({ ...r, settingMinimums: [...r.settingMinimums, { setting: settings.find((s) => !used.has(s)) ?? "", min: 1 }] }))}>
          Add a setting minimum
        </Button>
      </div>
      <FieldDescription>Lab and simulation never count toward a setting minimum.</FieldDescription>
    </div>
  )
}

// ---------------------------------------------------------------------------------------------------------------------
// Who signs [REQ SC-13, SC-14, SC-15, SC-16]

function ToggleRow({ id, title, detail, checked, onChange }: { id: string; title: string; detail: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-start justify-between gap-4 py-3">
      <div className="flex min-w-0 flex-col gap-0.5">
        <p id={`${id}-label`} className="text-sm font-medium text-foreground">
          {title}
        </p>
        <p id={`${id}-detail`} className="text-sm text-muted-foreground">
          {detail}
        </p>
      </div>
      <ToggleSwitch id={id} checked={checked} onChange={onChange} aria-labelledby={`${id}-label ${id}-detail`} />
    </div>
  )
}

function AddFieldDialog({ open, onOpenChange, onAdd, taken }: { open: boolean; onOpenChange: (o: boolean) => void; onAdd: (f: { label: string; type: FieldType; mandatory: boolean }) => void; taken: string[] }) {
  const [label, setLabel] = React.useState("")
  const [type, setType] = React.useState<FieldType>("short")
  const [mandatory, setMandatory] = React.useState(false)
  const [tried, setTried] = React.useState(false)
  React.useEffect(() => {
    if (open) {
      setLabel("")
      setType("short")
      setMandatory(false)
      setTried(false)
    }
  }, [open])
  const dup = taken.some((t) => t.trim().toLowerCase() === label.trim().toLowerCase())
  const error = !label.trim() ? "Give the field a label." : dup ? "Another field already has this label." : undefined
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add a field</DialogTitle>
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
              if (error) {
                document.getElementById("cfg-newfield-label")?.focus()
                return
              }
              onAdd({ label: label.trim(), type, mandatory })
              onOpenChange(false)
            }}
          >
            Add field
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function SignOffSection({ rule, setRule, issues, showErrors }: SectionProps) {
  const err = useErr(issues, showErrors)
  const roleErr = err("cfg-role-preceptor")
  const [adding, setAdding] = React.useState(false)
  return (
    <div className="flex flex-col gap-8 @min-[56rem]:grid @min-[56rem]:grid-cols-2 @min-[56rem]:items-start @min-[56rem]:gap-x-10" data-section="signoff">
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

      <FieldSet>
        <FieldLegend variant="label">What the student adds</FieldLegend>
        <ul className="flex flex-col divide-y divide-border rounded-[var(--radius)] border border-border">
          {rule.studentFields.map((f, i) => {
            const id = `cfg-field-${i}`
            return (
              <li key={i} className="flex flex-col gap-1 px-3 py-2">
                <div className="flex items-center gap-3">
                  <span className="min-w-0 flex-1 truncate text-sm text-foreground">{f.label.trim() || "Untitled field"}</span>
                  <span className="text-sm text-muted-foreground">{`${FIELD_TYPE_LABEL[f.type]}${f.mandatory ? ", required" : ""}`}</span>
                  <RemoveButton id={id} label={`Remove ${f.label.trim() || `field ${i + 1}`}`} onClick={() => setRule((r) => ({ ...r, studentFields: r.studentFields.filter((_, k) => k !== i) }))} />
                </div>
                <Err id={id} message={err(id)} />
              </li>
            )
          })}
          {rule.studentFields.length === 0 ? <li className="px-3 py-2 text-sm text-muted-foreground">Nothing beyond the evaluation itself.</li> : null}
        </ul>
        <div>
          <Button type="button" variant="outline" size="sm" onClick={() => setAdding(true)}>
            Add a field
          </Button>
        </div>
        <AddFieldDialog open={adding} onOpenChange={setAdding} taken={rule.studentFields.map((f) => f.label)} onAdd={(f) => setRule((r) => ({ ...r, studentFields: [...r.studentFields, f] }))} />
      </FieldSet>

      <div className="flex flex-col divide-y divide-border" role="group" aria-label="What an evaluation needs">
        <ToggleRow id="cfg-feedback" title="Feedback is required" detail="Evaluators must write feedback on every evaluation." checked={rule.feedbackRequired} onChange={(v) => setRule((r) => ({ ...r, feedbackRequired: v }))} />
        <ToggleRow id="cfg-self" title="Student rates themselves first" detail="The evaluator sees it after their own answers." checked={rule.selfEvaluation} onChange={(v) => setRule((r) => ({ ...r, selfEvaluation: v }))} />
        <ToggleRow id="cfg-approval" title="Approval before it counts" detail="A reviewer approves each evaluation before it counts." checked={rule.approvalRequired} onChange={(v) => setRule((r) => ({ ...r, approvalRequired: v }))} />
      </div>
    </div>
  )
}

export const SECTION_BODY: Record<SectionId, (p: SectionProps) => React.ReactElement> = {
  model: (p) => <ModelSection {...p} />,
  outcomes: (p) => <OutcomesSection {...p} />,
  rule: (p) => <RuleSection {...p} />,
  signoff: (p) => <SignOffSection {...p} />,
}
