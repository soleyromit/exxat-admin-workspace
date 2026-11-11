"use client"

/**
 * Evaluation settings B, "every field on the page" (concept D, D-L141, Romit 2026-11-10). The parts only this layout uses: a sheet of sections (name
 * left, fields right, labels above fields), the sticky "Your rule" panel, the Levels and Outcomes lists (a status per row, one select under the list for what counts),
 * the question list (first 8, then Show all), the two Counts when controls, the plain list of steps and the student's fields edited in place.
 * Configure one skill does not use these, so nothing here changes it.
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
import { DragHandleGripIcon } from "@exxatdesignux/ui/components/ui/drag-handle-grip"
import { FieldError } from "@exxatdesignux/ui/components/ui/field"
import { Input } from "@exxatdesignux/ui/components/ui/input"
import { Label } from "@exxatdesignux/ui/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@exxatdesignux/ui/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@exxatdesignux/ui/components/ui/select"
import { StatusBadge } from "@exxatdesignux/ui/components/ui/status-badge"
import { ToggleSwitch } from "@exxatdesignux/ui/components/ui/toggle-switch"
import { cn } from "@exxatdesignux/ui/lib/utils"
import { TYPE } from "@/components/lab/type-scale"
import { TagsPicker } from "@/components/lab/library/category-tag-pickers"
import { holdSecondPress } from "@/components/lab/shared/focus"
import {
  FIELD_TYPE_LABEL,
  LABEL_PRESETS,
  ROLES,
  applyPreset,
  appendQuestions,
  hasNeed,
  levelMoveChange,
  levelTicked,
  levelPlace,
  presetReplaces,
  removeLevel,
  removeQuestion,
  ruleAllowsCheckOff,
  ruleClauses,
  ruleSaysWhatCounts,
  swapItems,
  withLevelTicked,
  type FieldType,
  type LabelPresetId,
  type LabRule,
  type RuleIssue,
} from "@/lib/lab/configure"
import { TIMES_MAX } from "@/lib/lab/program-settings"
import { aNoun, skillNounPlural } from "@/lib/lab/terms"
import { NUMBER_WIDTH, NumberWithUnit, PasteQuestions, QuestionSubsetPicker, RemoveButton, placeholderFor, type SectionProps } from "./fields"

type SetRule = SectionProps["setRule"]
type Err = (f: string) => string | undefined

// ---------------------------------------------------------------------------------------------------------------------
// The rule, read aloud

const ROLE_IN_SENTENCE: Record<(typeof ROLES)[number], string> = { preceptor: "a preceptor", faculty: "clinical faculty", "lab-instructor": "a lab instructor" }
const joinOr = (xs: string[]): string => (xs.length <= 1 ? (xs[0] ?? "") : `${xs.slice(0, -1).join(", ")} or ${xs[xs.length - 1]}`)

/** The whole rule as one sentence, or null while it says nothing yet (no model, no number, nothing that counts) [REQ SC-17]. */
export function ruleStatement(rule: LabRule): string | null {
  if (!rule.model || !hasNeed(rule) || rule.need > TIMES_MAX || !ruleSaysWhatCounts(rule)) return null
  const c = ruleClauses(rule)
  const parts = [c.qualifier ? `${c.total} ${c.qualifier}` : c.total, ...c.levels]
  if (c.distinct) parts.push(c.distinct)
  if (c.settings.length) parts.push(`with ${c.settings.join(" and ")}`)
  const roles = ROLES.filter((r) => rule.evaluatorRoles.includes(r)).map((r) => ROLE_IN_SENTENCE[r])
  return `A student achieves ${aNoun()} with ${parts.join(", ")}${roles.length ? `, signed off by ${joinOr(roles)}` : ""}.`
}

// ---------------------------------------------------------------------------------------------------------------------
// What changed since the last save, by setting: the panel's count and each field's "Changed" mark.

export type SettingKey = "model" | "levels" | "outcomes" | "questions" | "scale" | "countsWhen" | "need" | "signers" | "self" | "approval" | "fields" | "feedback" | "checkOff"

const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b)

export function changedSettings(rule: LabRule, saved: LabRule | null): Set<SettingKey> {
  const out = new Set<SettingKey>()
  if (!saved) return out
  if (rule.model !== saved.model) { out.add("model"); return out }
  if (rule.model === "demonstration" && (!same(rule.levels, saved.levels) || rule.carried.minLevelIndex !== saved.carried.minLevelIndex)) out.add("levels")
  if (rule.model === "binary" && (!same(rule.outcomeLabels, saved.outcomeLabels) || rule.qualifyingLabel !== saved.qualifyingLabel)) out.add("outcomes")
  if ((rule.model === "question" || rule.model === "scored") && !same(rule.questions, saved.questions)) out.add("questions")
  if (rule.model === "scored" && rule.scaleMax !== saved.scaleMax) out.add("scale")
  if (rule.model === "question" && !same(rule.questionRule, saved.questionRule)) out.add("countsWhen")
  if (rule.model === "scored" && !same(rule.scoredRule, saved.scoredRule)) out.add("countsWhen")
  if (!(rule.need === saved.need || (Number.isNaN(rule.need) && Number.isNaN(saved.need)))) out.add("need")
  if (!same([...rule.evaluatorRoles].sort(), [...saved.evaluatorRoles].sort())) out.add("signers")
  if (rule.selfEvaluation !== saved.selfEvaluation) out.add("self")
  if (rule.approvalRequired !== saved.approvalRequired) out.add("approval")
  if (!same(rule.studentFields, saved.studentFields)) out.add("fields")
  if (rule.feedbackRequired !== saved.feedbackRequired) out.add("feedback")
  const co = (r: LabRule) => ({ on: ruleAllowsCheckOff(r), level: r.checkOff?.levelIndex ?? null, score: r.checkOff?.score ?? null })
  if (!same(co(rule), co(saved))) out.add("checkOff")
  return out
}

/** "Changed" beside a field's label, while it differs from what is saved. Amber, word and glyph [strategy 04]. */
export function ChangedMark() {
  return <StatusBadge label="Changed" tone="warning" icon="fa-pen" size="sm" data-changed-mark />
}

// ---------------------------------------------------------------------------------------------------------------------
// The sheet: sections and fields

/**
 * One section of the sheet: its name (with a count when it lists something) in the left column, its fields in the right column. No purpose line (D-L34).
 * A hairline above every section but the first; one column in a narrow sheet.
 */
export function SheetSection({ id, title, count, children }: { id: string; title: string; count?: number; children: React.ReactNode }) {
  return (
    <section aria-labelledby={id} className="grid min-w-0 gap-x-10 gap-y-4 border-t border-border py-7 first:border-t-0 first:pt-1 @[44rem]:grid-cols-[13rem_minmax(0,34rem)]" data-settings-section data-sheet-section={id}>
      <div className="flex min-w-0 flex-col gap-1">
        <h2 id={id} className={TYPE.card}>
          {title}
          {count !== undefined ? <span className="ms-1.5 font-normal text-muted-foreground tabular-nums">{count}</span> : null}
        </h2>
      </div>
      <div className="flex min-w-0 flex-col gap-6">{children}</div>
    </section>
  )
}

/** A field: its label above the control, an optional quiet word after it, "Changed", and on the right of the label line an action of the field's own. */
export function FieldBlock({ label, labelId, htmlFor, hint, end, changed, children, srLabel }: { label: string; labelId?: string; htmlFor?: string; hint?: string; end?: React.ReactNode; changed?: boolean; children: React.ReactNode; /** The section's name already says it: the label is for a screen reader only. */ srLabel?: boolean }) {
  const name = htmlFor ? <Label htmlFor={htmlFor} id={labelId} className={cn(TYPE.group, srLabel && "sr-only")}>{label}</Label> : <p id={labelId} className={cn(TYPE.group, srLabel && "sr-only")}>{label}</p>
  const line = !srLabel || changed || end
  return (
    <div className="flex min-w-0 flex-col gap-2" data-field-block>
      {line ? (
        <div className="flex min-h-6 flex-wrap items-center gap-x-2 gap-y-1">
          {name}
          {hint && !srLabel ? <span className={TYPE.helper}>{hint}</span> : null}
          {changed ? <ChangedMark /> : null}
          {end ? <div className="ms-auto flex min-w-0 items-center gap-2">{end}</div> : null}
        </div>
      ) : name}
      {children}
    </div>
  )
}

// ---------------------------------------------------------------------------------------------------------------------
// Rows that reorder: a grip that drags and, focused, moves with the arrow keys

function useReorder(count: number, move: (from: number, to: number) => void) {
  const from = React.useRef<number | null>(null)
  return (i: number, idOf: (i: number) => string, label: string, step: 1 | -1 = -1) => ({
    grip: (
      <Button
        id={idOf(i)}
        type="button"
        variant="ghost"
        size="icon-sm"
        className="cursor-grab text-muted-foreground"
        aria-label={label}
        aria-describedby="cfg-reorder-help"
        draggable
        onDragStart={(e) => { from.current = i; e.dataTransfer.effectAllowed = "move" }}
        onKeyDown={(e) => {
          // `step`: which way "up" goes in the data. Levels show highest first, so up on screen is one higher in the data.
          const d = e.key === "ArrowUp" ? step : e.key === "ArrowDown" ? -step : 0
          if (!d) return
          e.preventDefault()
          const j = i + d
          if (j < 0 || j >= count) return
          move(i, j)
          requestAnimationFrame(() => document.getElementById(idOf(j))?.focus())
        }}
      >
        <DragHandleGripIcon />
      </Button>
    ),
    row: {
      onDragOver: (e: React.DragEvent) => { if (from.current !== null) e.preventDefault() },
      onDrop: (e: React.DragEvent) => { e.preventDefault(); const f = from.current; from.current = null; if (f !== null && f !== i) move(f, i) },
      onDragEnd: () => { from.current = null },
    },
  })
}

/** Move an item from one place to another by adjacent swaps, so every reference in the rule follows its item [REQ AE-07]. */
function moveItem(rule: LabRule, kind: "levels" | "questions", from: number, to: number): LabRule {
  let r = rule
  const d = to > from ? 1 : -1
  for (let k = from; k !== to; k += d) r = swapItems(r, kind, k, k + d)
  return r
}

export function ReorderHelp() {
  return <p id="cfg-reorder-help" className="sr-only">Press the up or down arrow key to move it.</p>
}

// ---------------------------------------------------------------------------------------------------------------------
// Start from: the starting sets for the model, as a select that shows the set in use

const PRESETS_FOR: Partial<Record<NonNullable<LabRule["model"]>, LabelPresetId[]>> = { binary: ["approval", "metnotmet"], demonstration: ["independence", "performance", "aacn"] }
const norm = (s: string) => s.trim().toLowerCase()

function StartFrom({ rule, setRule }: { rule: LabRule; setRule: SetRule }) {
  const ids = rule.model ? PRESETS_FOR[rule.model] ?? [] : []
  const [pending, setPending] = React.useState<LabelPresetId | null>(null)
  const names = rule.model === "binary" ? rule.outcomeLabels : rule.levels
  const current = ids.find((id) => {
    const p = LABEL_PRESETS[id]
    const set = p.levels ?? p.outcomes ?? []
    return set.length === names.length && set.every((x, k) => norm(x) === norm(names[k] ?? ""))
  }) ?? ""
  if (!ids.length) return null
  const ask = pending ? presetReplaces(rule, pending) : null
  return (
    <>
      <Label htmlFor="cfg-preset" className={cn(TYPE.helper, "font-normal")}>Start from</Label>
      <Select value={current} onValueChange={(v) => { const id = v as LabelPresetId; if (presetReplaces(rule, id)) setPending(id); else setRule((r) => applyPreset(r, id)) }}>
        <SelectTrigger id="cfg-preset" size="sm" className={rule.model === "binary" ? "w-52" : "w-40"} data-presets>
          <SelectValue placeholder="Choose a set" />
        </SelectTrigger>
        <SelectContent>
          {ids.map((id) => <SelectItem key={id} value={id}>{LABEL_PRESETS[id].label}</SelectItem>)}
        </SelectContent>
      </Select>
      {/* What the admin named is never overwritten without asking; the question names it and what takes its place. */}
      <AlertDialog open={!!ask} onOpenChange={(o) => !o && setPending(null)}>
        <AlertDialogContent data-preset-confirm onCloseAutoFocus={(e) => { e.preventDefault(); document.getElementById("cfg-preset")?.focus({ preventScroll: true }) }}>
          <AlertDialogHeader>
            <AlertDialogTitle>{ask ? `Replace ${ask.was.length} ${ask.noun}${ask.was.length === 1 ? "" : "s"}?` : "Replace them?"}</AlertDialogTitle>
            <AlertDialogDescription>{ask ? `${listWords(ask.was)} ${ask.was.length === 1 ? "becomes" : "become"} ${listWords(ask.next)}.${ask.clearsCounts ? " The accepted levels are cleared." : ""}` : ""}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel variant="outline" size="default" autoFocus onClick={holdSecondPress}>{`Keep my ${ask?.noun ?? "level"}s`}</AlertDialogCancel>
            <AlertDialogAction variant="default" size="default" onClick={(e) => { holdSecondPress(e); if (pending) setRule((r) => applyPreset(r, pending)); setPending(null) }}>
              {ask ? `Replace ${ask.was.length} ${ask.noun}${ask.was.length === 1 ? "" : "s"}` : "Replace"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

const listWords = (xs: readonly string[]) => (xs.length <= 1 ? xs.join("") : `${xs.slice(0, -1).join(", ")} and ${xs[xs.length - 1]}`)

// ---------------------------------------------------------------------------------------------------------------------
// Levels and outcomes: one list, a control per row under one "Accepted" heading (2026-11-11; Romit's D-L74 and D-L95 checkboxes restored on B)

/** The column word above the row controls, the only head the list has. */
export const ACCEPTED_HEAD = "Accepted"
/** The validation word for "no level chosen" on this page (the shared message is worded for every variant; this page says it in its own word). */
export const LEVELS_NOT_CHOSEN = "Choose the levels you accept."

const ROW = "grid min-w-0 items-center gap-x-2 gap-y-1 border-t border-border px-2 py-1.5"
const LEVEL_COLS = "grid-cols-[2rem_minmax(0,1fr)_5.5rem_2rem]"
const OUTCOME_COLS = "grid-cols-[minmax(0,1fr)_5.5rem]"

/** The list's frame with its one head: "Accepted", over the control column. */
function AcceptedList({ id, cols, children, invalid, describedBy }: { id: string; cols: string; children: React.ReactNode; invalid?: boolean; describedBy?: string }) {
  return (
    <div id={id} tabIndex={-1} className="min-w-0 overflow-hidden rounded-[var(--radius)] border border-border outline-none" aria-invalid={invalid || undefined} aria-describedby={describedBy} data-counts-from>
      <div className={cn("grid items-center gap-x-2 px-2 py-1.5", cols)} aria-hidden="true">
        <span className={cn(TYPE.meta, "col-start-3 row-start-1 text-center")}>{ACCEPTED_HEAD}</span>
      </div>
      {children}
    </div>
  )
}

/**
 * Levels (D-L74, D-L95, restored 2026-11-11): highest first. Each row: a grip, the name in place, a checkbox "Accept {name}" under the Accepted head,
 * Remove. The boxes are linked through `withLevelTicked`, the same logic as Configure one skill: checking a level checks every level above it, unchecking
 * one clears every level below it; the engine keeps one threshold, and every box checked is "at any level". A linked change to other rows is said aloud.
 * Reorder by dragging the grip or, focused, the arrow keys; a move that changes what is accepted is said aloud too.
 */
export function LevelsField({ rule, setRule, err, changed }: { rule: LabRule; setRule: SetRule; err: Err; changed?: boolean }) {
  const n = rule.levels.length
  const [said, setSaid] = React.useState("")
  const countsErr = err("cfg-counts-from") ? LEVELS_NOT_CHOSEN_OR(err("cfg-counts-from")!) : undefined
  const addErr = err("cfg-add-level")
  const nameOf = (levels: readonly string[], i: number) => levels[i]?.trim() || lowerPlace(i, levels.length)
  const move = (i: number, j: number) => {
    const next = moveItem(rule, "levels", i, j)
    const change = Math.abs(i - j) === 1 ? levelMoveChange(rule, next, i, j) : null
    const name = rule.levels[i]?.trim() || levelPlace(i, n)
    const changeName = change ? nameOf(next.levels, change.index) : ""
    setSaid(`${name} moved ${j > i ? "up" : "down"}.${change ? ` ${changeName} is ${change.counts ? "now accepted" : "no longer accepted"}.` : ""}`)
    setRule(() => next)
  }
  const tick = (i: number, on: boolean) => {
    const next = withLevelTicked(rule, i, on)
    const others = rule.levels.map((_, k) => k).filter((k) => k !== i && levelTicked(rule, k) !== levelTicked(next, k))
    const names = others.sort((x, y) => y - x).map((k) => nameOf(rule.levels, k))
    const list = names.length <= 1 ? (names[0] ?? "") : `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`
    setSaid(names.length ? `${list} ${names.length === 1 ? "is" : "are"} ${on ? "also accepted" : "no longer accepted"}.` : "")
    setRule(() => next)
  }
  const reorder = useReorder(n, move)
  const order = Array.from({ length: n }, (_, k) => n - 1 - k)
  return (
    <FieldBlock label="Level names" labelId="cfg-levels-label" hint="highest first" changed={changed} end={<StartFrom rule={rule} setRule={setRule} />}>
      {n ? (
        <AcceptedList id="cfg-counts-from" cols={LEVEL_COLS} invalid={!!countsErr} describedBy={countsErr ? "cfg-counts-from-error" : undefined}>
          <ol className="flex flex-col" aria-labelledby="cfg-levels-label">
            {order.map((i) => {
              const id = `cfg-level-${i}`
              const message = err(id)
              const shown = nameOf(rule.levels, i)
              const on = levelTicked(rule, i)
              const r = reorder(i, (k) => `cfg-level-grip-${k}`, `Move ${shown}`, 1)
              return (
                <li key={i} className={cn(ROW, LEVEL_COLS)} data-level-row {...r.row}>
                  {r.grip}
                  <Input id={id} className="h-8 min-w-0" aria-label={`Level ${i + 1}`} placeholder={placeholderFor("Level", i, n)} value={rule.levels[i]} onChange={(e) => setRule((x) => ({ ...x, levels: x.levels.map((l, k) => (k === i ? e.target.value : l)) }))} aria-invalid={!!message || undefined} aria-describedby={message ? `${id}-error` : undefined} />
                  <span className="flex justify-center" data-level-segment={i} data-counts={on || undefined}>
                    <Checkbox id={`cfg-counts-from-${i}`} aria-label={`Accept ${shown}`} checked={on} onCheckedChange={(c) => tick(i, c === true)} />
                  </span>
                  <RemoveButton label={`Remove ${shown}`} onClick={() => { setRule((x) => removeLevel(x, i)); requestAnimationFrame(() => document.getElementById(n > 1 ? `cfg-level-${Math.min(i, n - 2)}` : "cfg-add-level")?.focus()) }} />
                  {message ? <FieldError id={`${id}-error`} className="col-start-2 col-end-[-1]">{message}</FieldError> : null}
                </li>
              )
            })}
          </ol>
        </AcceptedList>
      ) : null}
      {countsErr ? <FieldError id="cfg-counts-from-error">{countsErr}</FieldError> : null}
      <div className="flex flex-col gap-1">
        <Button id="cfg-add-level" type="button" variant="ghost" size="sm" className="w-fit" aria-describedby={addErr ? "cfg-add-level-error" : undefined} onClick={() => { setRule((r) => ({ ...r, levels: [...r.levels, ""] })); requestAnimationFrame(() => document.getElementById(`cfg-level-${n}`)?.focus()) }}>Add a level</Button>
        {addErr ? <FieldError id="cfg-add-level-error">{addErr}</FieldError> : null}
      </div>
      <p role="status" className="sr-only" data-level-count-change>{said}</p>
    </FieldBlock>
  )
}

/** On this page the "nothing chosen" problem uses the page's word; any other levels problem keeps its own text. */
function LEVELS_NOT_CHOSEN_OR(message: string): string {
  return /^Choose which levels count/.test(message) ? LEVELS_NOT_CHOSEN : message
}
export const levelsProblemText = LEVELS_NOT_CHOSEN_OR

const lowerPlace = (i: number, n: number) => { const p = levelPlace(i, n); return p.charAt(0).toLowerCase() + p.slice(1) }

/** Outcomes of the approved model [REQ SC-03]: the two names in place, and one radio per row under the same Accepted head; exactly one is accepted. */
export function OutcomesField({ rule, setRule, err, changed }: { rule: LabRule; setRule: SetRule; err: Err; changed?: boolean }) {
  const q = rule.qualifyingLabel
  const qErr = err("cfg-qualifying")
  const shownOf = (i: number) => rule.outcomeLabels[i].trim() || (i === 0 ? "the first outcome" : "the second outcome")
  return (
    <FieldBlock label="Outcome names" labelId="cfg-outcomes-label" changed={changed} end={<StartFrom rule={rule} setRule={setRule} />}>
      <div className="min-w-0 overflow-hidden rounded-[var(--radius)] border border-border">
        <div className={cn("grid items-center gap-x-2 px-2 py-1.5 ps-3", OUTCOME_COLS)} aria-hidden="true">
          <span />
          <span className={cn(TYPE.meta, "text-center")}>{ACCEPTED_HEAD}</span>
        </div>
        <RadioGroup
          id="cfg-qualifying"
          tabIndex={-1}
          value={q === null ? "" : String(q)}
          onValueChange={(v) => setRule((r) => ({ ...r, qualifyingLabel: v === "1" ? 1 : 0 }))}
          aria-label="Accepted outcome"
          aria-invalid={!!qErr || undefined}
          aria-describedby={qErr ? "cfg-qualifying-error" : undefined}
          className="flex flex-col gap-0 outline-none"
        >
          <ul className="flex flex-col" aria-labelledby="cfg-outcomes-label">
            {[0, 1].map((i) => {
              const id = `cfg-label-${i}`
              const message = err(id)
              return (
                <li key={i} className={cn(ROW, "ps-3", OUTCOME_COLS)} data-outcome-row>
                  <Input id={id} className="h-8 min-w-0" aria-label={i === 0 ? "First label" : "Second label"} value={rule.outcomeLabels[i]} onChange={(e) => setRule((r) => ({ ...r, outcomeLabels: (i === 0 ? [e.target.value, r.outcomeLabels[1]] : [r.outcomeLabels[0], e.target.value]) as [string, string] }))} aria-invalid={!!message || undefined} aria-describedby={message ? `${id}-error` : undefined} />
                  <span className="flex justify-center"><RadioGroupItem id={`cfg-qualifying-${i}`} value={String(i)} aria-label={`Accept ${shownOf(i)}`} /></span>
                  {message ? <FieldError id={`${id}-error`} className="col-span-full">{message}</FieldError> : null}
                </li>
              )
            })}
          </ul>
        </RadioGroup>
      </div>
      {qErr ? <FieldError id="cfg-qualifying-error">{qErr}</FieldError> : null}
    </FieldBlock>
  )
}

// ---------------------------------------------------------------------------------------------------------------------
// Questions

/** Past this many, the list shows the first ones and "Show all n". */
export const QUESTIONS_SHOWN = 8

/**
 * The question list in place [REQ SC-04, SC-07]: a grip, the number, the question, Remove; Add a question and Paste a list under it. Longer than 8, the
 * first 8 and "Show all n"; a new question, or a problem in a hidden one, opens the list (`expanded` is the page's, so a problem link can open it).
 */
export function QuestionsField({ rule, setRule, err, changed, expanded, setExpanded }: { rule: LabRule; setRule: SetRule; err: Err; changed?: boolean; expanded: boolean; setExpanded: (v: boolean) => void }) {
  const m = rule.questions.length
  const move = (i: number, j: number) => setRule((r) => moveItem(r, "questions", i, j))
  const reorder = useReorder(m, move)
  const hidden = !expanded && m > QUESTIONS_SHOWN ? m - QUESTIONS_SHOWN : 0
  const shown = hidden ? rule.questions.slice(0, QUESTIONS_SHOWN) : rule.questions
  const addErr = err("cfg-add-question")
  return (
    <FieldBlock label="Questions" labelId="cfg-questions-label" srLabel changed={changed}>
      {m ? (
        <ol className="flex flex-col gap-2" aria-labelledby="cfg-questions-label" id="cfg-question-list">
          {shown.map((q, i) => {
            const id = `cfg-question-${i}`
            const message = err(id)
            const r = reorder(i, (k) => `cfg-question-grip-${k}`, `Move question ${i + 1}`)
            return (
              <li key={i} className="grid grid-cols-[2rem_1.25rem_minmax(0,1fr)_2rem] items-center gap-x-1.5 gap-y-1" data-question-row {...r.row}>
                {r.grip}
                <span className={cn(TYPE.helper, "text-end tabular-nums")} aria-hidden="true">{i + 1}</span>
                <Input id={id} className="min-w-0" aria-label={`Question ${i + 1}`} placeholder={placeholderFor("Question", i, m)} value={q} onChange={(e) => setRule((x) => ({ ...x, questions: x.questions.map((v, k) => (k === i ? e.target.value : v)) }))} aria-invalid={!!message || undefined} aria-describedby={message ? `${id}-error` : undefined} />
                <RemoveButton label={`Remove question ${i + 1}`} onClick={() => { setRule((x) => removeQuestion(x, i)); requestAnimationFrame(() => document.getElementById(m > 1 ? `cfg-question-${Math.min(i, m - 2)}` : "cfg-add-question")?.focus()) }} />
                {message ? <FieldError id={`${id}-error`} className="col-start-3 col-end-[-1]">{message}</FieldError> : null}
              </li>
            )
          })}
        </ol>
      ) : null}
      <div className="flex flex-col gap-1 ps-[calc(2rem+1.25rem+0.75rem)]">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          {hidden ? (
            <Button type="button" variant="outline" size="sm" aria-expanded={false} aria-controls="cfg-question-list" onClick={() => { setExpanded(true); requestAnimationFrame(() => document.getElementById(`cfg-question-${QUESTIONS_SHOWN}`)?.focus()) }} data-show-all-questions>
              {`Show all ${m}`}
            </Button>
          ) : null}
          <Button id="cfg-add-question" type="button" variant="ghost" size="sm" className="w-fit" aria-describedby={addErr ? "cfg-add-question-error" : undefined} onClick={() => { setExpanded(true); setRule((r) => ({ ...r, questions: [...r.questions, ""] })); requestAnimationFrame(() => document.getElementById(`cfg-question-${m}`)?.focus()) }}>Add a question</Button>
          <PasteQuestions existing={rule.questions} onAdd={(lines) => { setExpanded(true); setRule((r) => appendQuestions(r, lines)) }} />
        </div>
        {addErr ? <FieldError id="cfg-add-question-error">{addErr}</FieldError> : null}
      </div>
    </FieldBlock>
  )
}

/** Counts when for the questions model [REQ SC-05]: every question Yes, at least [n] of N, or only the questions chosen. */
export function QuestionCountsWhen({ rule, setRule, err, changed }: { rule: LabRule; setRule: SetRule; err: Err; changed?: boolean }) {
  const r = rule.questionRule
  const m = rule.questions.length
  const nErr = err("cfg-qrule-n")
  const kindErr = err("cfg-qrule")
  const choose = (v: string) => setRule((x) => ({ ...x, questionRule: v === "all" ? { kind: "all" } : v === "atLeast" ? { kind: "atLeast", n: x.questionRule?.kind === "atLeast" ? x.questionRule.n : Math.max(1, m - 1) } : { kind: "subset", indices: x.questionRule?.kind === "subset" ? x.questionRule.indices : [] } }))
  return (
    <FieldBlock label="Counts when" labelId="cfg-qrule-label" changed={changed}>
      <RadioGroup id="cfg-qrule" tabIndex={-1} value={r?.kind ?? ""} onValueChange={choose} aria-labelledby="cfg-qrule-label" className="flex flex-col gap-2 outline-none" aria-invalid={!!kindErr || undefined} aria-describedby={kindErr ? "cfg-qrule-error" : undefined}>
        <div className="flex min-h-9 items-center gap-2.5">
          <RadioGroupItem id="cfg-qrule-all" value="all" />
          <Label htmlFor="cfg-qrule-all" className="font-normal">Every question answered Yes</Label>
        </div>
        <div className="flex min-h-9 flex-wrap items-center gap-2.5">
          <RadioGroupItem id="cfg-qrule-atleast" value="atLeast" aria-label="At least a number of questions answered Yes" />
          <Label htmlFor="cfg-qrule-atleast" className="font-normal">At least</Label>
          <NumberWithUnit unit={m > 0 ? `of ${m} answered Yes` : "answered Yes"}>
          <Input
            id="cfg-qrule-n"
            type="number"
            inputMode="numeric"
            min={1}
            className={NUMBER_WIDTH}
            aria-label="Questions that must be answered Yes"
            value={r?.kind === "atLeast" && Number.isFinite(r.n) ? String(r.n) : ""}
            onFocus={() => { if (r?.kind !== "atLeast") choose("atLeast") }}
            onChange={(e) => { const raw = e.target.value; setRule((x) => ({ ...x, questionRule: { kind: "atLeast", n: raw.trim() === "" ? Number.NaN : Number(raw) } })) }}
            aria-invalid={!!nErr || undefined}
            aria-describedby={nErr ? "cfg-qrule-n-error" : undefined}
          />
          </NumberWithUnit>
        </div>
        {nErr ? <FieldError id="cfg-qrule-n-error" className="ps-6.5">{nErr}</FieldError> : null}
        <div className="flex min-h-9 items-center gap-2.5">
          <RadioGroupItem id="cfg-qrule-subsetopt" value="subset" />
          <Label htmlFor="cfg-qrule-subsetopt" className="font-normal">Only the questions you choose answered Yes</Label>
        </div>
      </RadioGroup>
      {kindErr ? <FieldError id="cfg-qrule-error">{kindErr}</FieldError> : null}
      {r?.kind === "subset" ? <QuestionSubsetPicker rule={rule} setRule={setRule} error={err("cfg-qrule-subset")} className="ms-6.5" /> : null}
    </FieldBlock>
  )
}

const SCORED_ROWS: Array<{ kind: "average" | "minEach" | "total"; label: string }> = [
  { kind: "average", label: "Average score at least" },
  { kind: "minEach", label: "Every question at least" },
  { kind: "total", label: "Total score at least" },
]

/**
 * Counts when for the score model [REQ SC-07]: three options, each with its number in one shared column ("Average score at least [4] out of 5"). Typing in
 * another option's number chooses that option and carries the number.
 */
export function ScoredCountsWhen({ rule, setRule, err, changed }: { rule: LabRule; setRule: SetRule; err: Err; changed?: boolean }) {
  const r = rule.scoredRule
  const top = Number.isInteger(rule.scaleMax) && rule.scaleMax >= 2 ? rule.scaleMax : null
  const outOf = (k: (typeof SCORED_ROWS)[number]["kind"]) => (top ? (k === "total" ? top * Math.max(1, rule.questions.length) : top) : null)
  const vErr = err("cfg-srule-value")
  const kErr = err("cfg-srule")
  const pick = (kind: (typeof SCORED_ROWS)[number]["kind"], value?: number) => setRule((x) => ({ ...x, scoredRule: { kind, value: value ?? x.scoredRule?.value ?? Number.NaN } }))
  return (
    <FieldBlock label="Counts when" labelId="cfg-srule-label" changed={changed}>
      <RadioGroup id="cfg-srule" tabIndex={-1} value={r?.kind ?? ""} onValueChange={(v) => pick(v as (typeof SCORED_ROWS)[number]["kind"])} aria-labelledby="cfg-srule-label" className="grid grid-cols-[1rem_max-content_auto] items-center gap-x-2.5 gap-y-2 outline-none" aria-invalid={!!kErr || undefined} aria-describedby={kErr ? "cfg-srule-error" : undefined}>
        {SCORED_ROWS.map((row) => {
          const on = r?.kind === row.kind
          const o = outOf(row.kind)
          return (
            <React.Fragment key={row.kind}>
              <RadioGroupItem id={`cfg-srule-${row.kind}`} value={row.kind} />
              <Label htmlFor={`cfg-srule-${row.kind}`} className="font-normal">{row.label}</Label>
              <NumberWithUnit unit={o ? `out of ${o}` : undefined}>
              <Input
                id={on ? "cfg-srule-value" : `cfg-srule-value-${row.kind}`}
                type="number"
                inputMode="numeric"
                min={1}
                className={NUMBER_WIDTH}
                aria-label={`${row.label}, score`}
                value={on && r && Number.isFinite(r.value) ? String(r.value) : ""}
                onFocus={() => { if (!on) pick(row.kind) }}
                onChange={(e) => { const raw = e.target.value; pick(row.kind, raw.trim() === "" ? Number.NaN : Number(raw)) }}
                aria-invalid={(on && !!vErr) || undefined}
                aria-describedby={on && vErr ? "cfg-srule-error" : undefined}
              />
              </NumberWithUnit>
            </React.Fragment>
          )
        })}
      </RadioGroup>
      {kErr || vErr ? <FieldError id="cfg-srule-error">{kErr ?? vErr}</FieldError> : null}
    </FieldBlock>
  )
}

// ---------------------------------------------------------------------------------------------------------------------
// Steps and forms

export type Step = { id: string; label: string; help?: string } & ({ fixed: true } | { fixed?: false; checked: boolean; onChange: (v: boolean) => void })

/** The order an evaluation goes through [REQ SC-15]: a plain numbered list; a fixed step says Always, an optional one carries its switch. */
export function StepList({ steps, changed }: { steps: Step[]; changed?: (id: string) => boolean }) {
  return (
    <ol className="flex flex-col gap-4" aria-label="Steps before it counts" data-path-strip>
      {steps.map((s, i) => {
        const last = i === steps.length - 1
        const off = !s.fixed && !s.checked
        return (
          <li key={s.id} className="grid grid-cols-[1.25rem_minmax(0,1fr)_auto] items-start gap-x-3" data-path-step={s.id}>
            <span className={cn(TYPE.helper, "leading-6 tabular-nums")} aria-hidden="true">{`${i + 1}.`}</span>
            <span className="flex min-w-0 flex-col">
              <span className="flex flex-wrap items-center gap-2">
                <span id={`${s.id}-label`} className={cn(TYPE.body, "leading-6", off && "text-muted-foreground")}>{s.label}</span>
                {changed?.(s.id) ? <ChangedMark /> : null}
              </span>
              {s.help ? <span id={`${s.id}-help`} className={TYPE.helper}>{s.help}</span> : null}
            </span>
            <span className="flex h-6 items-center">
              {s.fixed ? (last ? null : <span className={TYPE.helper}>Always</span>) : <ToggleSwitch id={s.id} checked={s.checked} onChange={s.onChange} aria-labelledby={`${s.id}-label`} />}
            </span>
          </li>
        )
      })}
    </ol>
  )
}

/** On or off: name and one line of what it does on the left, the switch at the right edge; `below` is what the switch reveals. */
export function SwitchField({ id, label, help, checked, onChange, changed, below }: { id: string; label: string; help?: string; checked: boolean; onChange: (v: boolean) => void; changed?: boolean; below?: React.ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-3" data-switch-row>
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-x-6">
        <span className="flex min-w-0 flex-col">
          <span className="flex flex-wrap items-center gap-2">
            <span id={`${id}-label`} className={TYPE.group}>{label}</span>
            {changed ? <ChangedMark /> : null}
          </span>
          {help ? <span id={`${id}-help`} className={TYPE.helper}>{help}</span> : null}
        </span>
        <span className="flex h-6 items-center"><ToggleSwitch id={id} checked={checked} onChange={onChange} aria-labelledby={`${id}-label`} /></span>
      </div>
      {below}
    </div>
  )
}

/** What the student fills in [REQ SC-13], edited in place: name, type, Required and Remove per field; a choice list holds its choices as chips. */
export function StudentFieldsTable({ rule, setRule, err, labelId }: { rule: LabRule; setRule: SetRule; err: Err; labelId: string }) {
  const fields = rule.studentFields
  const patch = (i: number, p: Partial<LabRule["studentFields"][number]>) => setRule((r) => ({ ...r, studentFields: r.studentFields.map((f, k) => (k === i ? { ...f, ...p } : f)) }))
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <div className="@container min-w-0 overflow-hidden rounded-[var(--radius)] border border-border">
        <div className="hidden grid-cols-[minmax(0,1fr)_9rem_6.5rem_2rem] items-center gap-2 border-b border-border bg-muted px-3 py-1.5 @[26rem]:grid" aria-hidden="true">
          <span className={TYPE.meta}>Field name</span>
          <span className={TYPE.meta}>Type</span>
          <span className={TYPE.meta}>Required</span>
        </div>
        <ul className="flex flex-col" aria-labelledby={labelId}>
          {fields.map((f, i) => {
            const id = `cfg-field-${i}`
            const message = err(id)
            const name = f.label.trim() || `field ${i + 1}`
            return (
              <li key={i} className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-2 border-t border-border px-3 py-2 first:border-t-0 @[26rem]:grid-cols-[minmax(0,1fr)_9rem_6.5rem_2rem]" data-student-field>
                <Input id={id} className="h-8 min-w-0" aria-label={`Field ${i + 1} name`} placeholder="Name the field" value={f.label} onChange={(e) => patch(i, { label: e.target.value })} aria-invalid={!!message || undefined} aria-describedby={message ? `${id}-error` : undefined} />
                <span className="col-start-2 row-start-1 justify-self-end @[26rem]:col-start-4"><RemoveButton label={`Remove ${name}`} onClick={() => setRule((r) => ({ ...r, studentFields: r.studentFields.filter((_, k) => k !== i) }))} /></span>
                <Select value={f.type} onValueChange={(v) => patch(i, v === "choice" ? { type: v as FieldType, choices: f.choices ?? [] } : { type: v as FieldType, choices: undefined })}>
                  <SelectTrigger id={`${id}-type`} size="sm" className="col-start-1 row-start-2 w-full @[26rem]:col-start-2 @[26rem]:row-start-1" aria-label={`Type of ${name}`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(FIELD_TYPE_LABEL) as FieldType[]).map((t) => <SelectItem key={t} value={t}>{FIELD_TYPE_LABEL[t]}</SelectItem>)}
                  </SelectContent>
                </Select>
                <span className="col-start-2 row-start-2 flex items-center gap-2 @[26rem]:col-start-3 @[26rem]:row-start-1">
                  <Checkbox id={`${id}-req`} checked={f.mandatory} onCheckedChange={(c) => patch(i, { mandatory: c === true })} aria-label={`${name} is required`} />
                  <Label htmlFor={`${id}-req`} className="font-normal" aria-hidden="true">Required</Label>
                </span>
                {f.type === "choice" ? (
                  <div className="col-span-full min-w-0 @[26rem]:col-span-3" data-field-choices>
                    <span id={`${id}-choices-label`} className="sr-only">{`Choices for ${name}`}</span>
                    <TagsPicker id={`${id}-choices`} labelId={`${id}-choices-label`} size="sm" value={f.choices ?? []} options={[]} onChange={(choices) => patch(i, { choices })} />
                  </div>
                ) : null}
                {message ? <FieldError id={`${id}-error`} className="col-span-full">{message}</FieldError> : null}
              </li>
            )
          })}
          {fields.length === 0 ? <li className={cn("px-3 py-2", TYPE.helper)}>Nothing beyond the evaluation itself.</li> : null}
        </ul>
      </div>
      <Button id="cfg-add-field" type="button" variant="ghost" size="sm" className="w-fit" onClick={() => { setRule((r) => ({ ...r, studentFields: [...r.studentFields, { label: "", type: "short", mandatory: false }] })); requestAnimationFrame(() => document.getElementById(`cfg-field-${fields.length}`)?.focus()) }}>
        Add a field
      </Button>
    </div>
  )
}

// ---------------------------------------------------------------------------------------------------------------------
// The rule panel

/** Where a problem sits, in the page's words: "Questions: question 4 has no text." */
export function fieldName(i: RuleIssue): string {
  const f = i.field
  if (f === "cfg-model") return "How skills are judged"
  if (f.startsWith("cfg-level-") || f === "cfg-add-level" || f.startsWith("cfg-counts-from")) return "Levels"
  if (f.startsWith("cfg-label-") || f === "cfg-qualifying") return "Outcomes"
  if (f.startsWith("cfg-question-") || f === "cfg-add-question") return "Questions"
  if (f.startsWith("cfg-qrule") || f.startsWith("cfg-srule")) return "Counts when"
  if (f.startsWith("cfg-scale")) return "Scale"
  if (f.startsWith("cfg-role-")) return "Who can sign off"
  if (f.startsWith("cfg-field-")) return "What the student fills in"
  if (f === "cfg-need") return "Times needed"
  return "Settings"
}

const lowerFirst = (s: string) => (s.length > 1 && /[a-z]/.test(s[1]) ? s[0].toLowerCase() + s.slice(1) : s)
export const problemText = (i: RuleIssue) => `${fieldName(i)}: ${lowerFirst(i.field === "cfg-counts-from" ? LEVELS_NOT_CHOSEN_OR(i.message) : i.message)}`

/**
 * "Your rule" (D-L141): the live sentence and who it applies to (the unsaved count moved to the save bar, 2026-11-11); while the rule is unfinished it lists
 * what is missing, and after a failed Save the same list in the error tone, each a link that focuses its field [REQ SC-17, SC-18].
 */
export function RulePanel({ rule, issues, showErrors, applies, onGo }: { rule: LabRule; issues: RuleIssue[]; showErrors: boolean; applies: React.ReactNode; onGo: (i: RuleIssue) => void }) {
  const said = ruleStatement(rule)
  const failing = showErrors && issues.length > 0
  const gaps = rule.model ? issues : []
  return (
    <aside aria-labelledby="cfg-rule-lead" className="flex min-w-0 flex-col gap-4 rounded-xl border border-[var(--brand-tint)] bg-[var(--brand-tint-light)] p-5" data-rule-panel data-settings-glance>
      <div className="flex flex-col gap-2" role={failing ? "alert" : undefined}>
        <p id="cfg-rule-lead" className={TYPE.meta}>Your rule</p>
        {failing ? (
          <p className={TYPE.body} aria-live="polite">{`Fix ${issues.length} ${issues.length === 1 ? "problem" : "problems"} to see the rule.`}</p>
        ) : said ? (
          <p className={cn(TYPE.card, "text-pretty")} data-rule-sentence aria-live="polite">{said}</p>
        ) : (
          <p className={TYPE.body} aria-live="polite">{rule.model ? "Finish these to see the rule:" : `Choose how ${skillNounPlural()} are judged to start.`}</p>
        )}
        {(failing || (!said && gaps.length)) ? (
          <ul className="flex flex-col gap-1.5" aria-label={failing ? "Problems to fix" : "Still to set"} data-region="validation-summary">
            {(failing ? issues : gaps).map((i) => (
              <li key={i.id}>
                <Button type="button" variant="link" size="sm" className={cn("h-auto items-start gap-1.5 whitespace-normal p-0 text-start font-normal", failing ? "text-destructive" : "text-foreground")} onClick={() => onGo(i)}>
                  {failing ? <i className="fa-light fa-circle-exclamation mt-1 text-xs" aria-hidden="true" /> : null}
                  <span>{problemText(i)}</span>
                </Button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
      {rule.model ? (
        <>
          <div className="h-px bg-[var(--brand-tint)]" aria-hidden="true" />
          <div className="flex flex-col gap-1" data-applies-to>
            <p className={TYPE.meta}>Applies to</p>
            {applies}
          </div>
        </>
      ) : null}
    </aside>
  )
}
