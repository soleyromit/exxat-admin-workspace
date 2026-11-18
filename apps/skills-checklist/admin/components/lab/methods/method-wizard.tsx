"use client"

/**
 * Shared pieces of the two wizards for an evaluation method, Evaluation settings O and P (Proposed, D-EM1116-h; contract ADMIN-D3
 * "round 7 variants"). Romit 2026-11-16 on M: try the wizard for adding and editing, "but can you do it better".
 *
 *   - The questions the admin answers: a step is headed by its question, never by a noun ("Type", "Answers").
 *   - `RatingTiles`: the four types [REQ 4.1], nothing preselected [REQ SC-02], each with a concrete example in its one line.
 *   - `StartingSets`: common wording for levels or outcomes as visible buttons. A set fills names only; which level or outcome moves a student
 *     forward is never ticked by a set, so the admin records it [REQ SC-03].
 *   - `RatingFields`: what the evaluator picks and what moves a student forward, for the chosen type [REQ SC-03 to SC-08, SC-17].
 *   - `partOf`, `scoped`, `toField`: a problem belongs to one question, shows once that question was tried, and takes the focus.
 *   - `MethodsHome`: the list both variants open a method from. A row opens it; no control sits in a cell.
 *
 * G, K, L and M are not touched: this file only reads the shared parts they also read.
 */
import * as React from "react"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@exxatdesignux/ui/components/ui/alert-dialog"
import { ToggleGroup, ToggleGroupItem } from "@exxatdesignux/ui/components/ui/toggle-group"
import { TYPE } from "@/components/lab/type-scale"
import type { ResultBannerValue } from "@/components/lab/shared/result-banner"
import { ModelSection, ScaleField } from "@/components/lab/configure/fields"
import { FieldBlock, LevelsField, OutcomesField, QuestionCountsWhen, QuestionsField, ReorderHelp, ScoredCountsWhen } from "@/components/lab/configure/settings-sheet"
import { focusField } from "@/components/lab/configure/use-configure"
import { MethodsTable, NEW, NoMethods, SettingsHome, useMethodNav, type MethodModel } from "@/components/lab/methods/method-parts"
import { LABEL_PRESETS, LAB_MODEL_LABEL, applyPreset, presetReplaces, type LabRule, type LabelPresetId, type RuleIssue } from "@/lib/lab/configure"
import { methodSentences, type MethodSentence } from "@/lib/lab/method-words"
import { methodsOf } from "@/lib/lab/methods"
import { useV2State } from "@/lib/v2/react"
import type { EvalModel } from "@/lib/v2/types"
import { aNoun } from "@/lib/lab/terms"

// ---------------------------------------------------------------------------------------------------------------------
// The questions

export const ratingQuestion = () => `How does the evaluator rate ${aNoun()}?`
export const WHO_QUESTION = "Who can evaluate?"
export const NEEDS_QUESTION = "What else does each evaluation need?"
export const WHO_AND_NEEDS_QUESTION = "Who can evaluate, and what does each evaluation need?"
export const NAME_QUESTION = "What is this method called?"

/** The second question, worded for the chosen type. */
export function answersQuestion(model: EvalModel | null): string {
  if (model === "demonstration") return "What are the levels, and which move a student forward?"
  if (model === "binary") return "What are the two outcomes, and which one moves a student forward?"
  if (model === "question") return "Which questions does the evaluator answer, and how many must be Yes?"
  if (model === "scored") return "Which questions are scored, and what score moves a student forward?"
  return "What does the evaluator pick?"
}

/** One line per type with a concrete example, so the choice is made by recognition. */
export const RATING_LINE: Record<EvalModel, string> = {
  demonstration: "One level from your list, such as Independent or Observed.",
  binary: "One of two outcomes you name, such as Met or Unmet.",
  question: "Yes or No on each question you write, like a checklist.",
  scored: "A score on each question you write, such as 1 to 5.",
}

// ---------------------------------------------------------------------------------------------------------------------
// Where a problem lives

export type Part = "type" | "picks" | "who" | "needs"

export function partOf(field: string): Part {
  if (field === "cfg-model") return "type"
  if (field.startsWith("cfg-role")) return "who"
  // Group check-off is how an evaluation runs, not who may evaluate [REQ SC-16]: it sits with what each evaluation needs.
  if (field === "cfg-self" || field === "cfg-feedback" || field === "cfg-approval" || field.startsWith("cfg-checkoff")) return "needs"
  return "picks"
}

/** The problems of these parts. With no type yet, the only problem is the type's [REQ SC-02]. */
export function issuesIn(m: MethodModel, parts: readonly Part[]): RuleIssue[] {
  if (!m.rule.model) return parts.includes("type") ? m.issues.filter((i) => i.field === "cfg-model") : []
  return m.issues.filter((i) => parts.includes(partOf(i.field)))
}

/** A model whose problems show only once the question in view was tried. */
export function scoped(m: MethodModel, show: boolean): MethodModel {
  return { ...m, showErrors: show, props: { ...m.props, showErrors: show }, err: (f) => (show ? m.issues.find((i) => i.field === f)?.message : undefined) }
}

/** Focus to the field a problem names (a question past the first eight opens the list first). */
export function toField(m: MethodModel, i: RuleIssue) {
  if (i.field === "cfg-model") { requestAnimationFrame(() => document.querySelector<HTMLElement>("[data-type-tiles] [role=radio]")?.focus()); return }
  if (i.field.startsWith("cfg-question")) m.setExpanded(true)
  requestAnimationFrame(() => requestAnimationFrame(() => focusField(i.field)))
}

/** "2 to fix", beside the button that was pressed: it leads to the first problem of the question in view. */
export function StepProblems({ m, issues }: { m: MethodModel; issues: RuleIssue[] }) {
  if (!issues.length) return null
  return (
    <Button type="button" variant="link" size="sm" className="h-auto p-0 text-destructive" onClick={() => toField(m, issues[0]!)} data-save-bar-problems>
      {`${issues.length} to fix`}
    </Button>
  )
}

// ---------------------------------------------------------------------------------------------------------------------
// The fields

/** The four types, nothing preselected [REQ 4.1, SC-02]. A switch that would remove levels or questions asks first [REQ SC-09]. */
export function RatingTiles({ m }: { m: MethodModel }) {
  return (
    <div id="cfg-type-tiles" className="@container min-w-0" data-type-tiles>
      <ModelSection {...m.props} examples={RATING_LINE} legend={ratingQuestion()} legendHidden row />
    </div>
  )
}

const SETS: Partial<Record<EvalModel, LabelPresetId[]>> = { demonstration: ["independence", "performance", "aacn"], binary: ["metnotmet", "approval"] }
const norm = (s: string) => s.trim().toLowerCase()
const listWords = (xs: readonly string[]) => (xs.length <= 1 ? xs.join("") : `${xs.slice(0, -1).join(", ")} and ${xs[xs.length - 1]}`)
/** A set as the evaluator would see it: levels highest first, the two outcomes side by side. */
const setWords = (id: LabelPresetId) => {
  const p = LABEL_PRESETS[id]
  return p.levels ? [...p.levels].reverse().join(", ") : (p.outcomes ?? []).join(" or ")
}

/**
 * Common wording to start from, for a method with no saved type. Names only: a set never ticks which level or outcome moves a student
 * forward [REQ SC-02, SC-03]. A set over names the admin typed asks first.
 */
export function StartingSets({ m }: { m: MethodModel }) {
  const { rule, setRule } = m
  const [pending, setPending] = React.useState<LabelPresetId | null>(null)
  const ids = rule.model && !m.settled ? SETS[rule.model] ?? [] : []
  if (!ids.length) return null
  const names = rule.model === "binary" ? rule.outcomeLabels : rule.levels
  const inUse = (id: LabelPresetId) => {
    const set = LABEL_PRESETS[id].levels ?? LABEL_PRESETS[id].outcomes ?? []
    return set.length === names.length && set.every((x, k) => norm(x) === norm(names[k] ?? ""))
  }
  const ask = pending ? presetReplaces(rule, pending) : null
  const choose = (id: LabelPresetId) => { if (inUse(id)) return; if (presetReplaces(rule, id)) setPending(id); else setRule((r) => applyPreset(r, id)) }
  return (
    <div className="flex min-w-0 flex-col gap-2" data-starting-sets>
      <p id="cfg-sets-label" className={TYPE.helper}>Start from common wording, or write your own</p>
      {/* DS ToggleGroup, one at most: the set in use reads as pressed. Pressing it again changes nothing (names are edited in the list). */}
      <ToggleGroup type="single" variant="outline" size="sm" spacing={2} value={ids.find(inUse) ?? ""} onValueChange={(v) => { if (v) choose(v as LabelPresetId) }} aria-labelledby="cfg-sets-label" className="w-full min-w-0 flex-wrap">
        {ids.map((id) => (
          <ToggleGroupItem key={id} value={id} className="h-auto min-h-8 max-w-full shrink whitespace-normal py-1 text-start font-normal" data-starting-set={id}>
            {setWords(id)}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
      <AlertDialog open={!!ask} onOpenChange={(o) => { if (!o) setPending(null) }}>
        <AlertDialogContent data-preset-confirm>
          <AlertDialogHeader>
            <AlertDialogTitle>{ask ? `Replace ${ask.was.length} ${ask.noun}${ask.was.length === 1 ? "" : "s"}?` : "Replace them?"}</AlertDialogTitle>
            <AlertDialogDescription>{ask ? `${listWords(ask.was)} ${ask.was.length === 1 ? "becomes" : "become"} ${listWords(ask.next)}.${ask.clearsCounts ? " Your level choices are cleared." : ""}` : ""}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{`Keep my ${ask?.noun ?? "level"}s`}</AlertDialogCancel>
            <AlertDialogAction onClick={() => { if (pending) setRule((r) => applyPreset(r, pending)); setPending(null) }}>{ask ? `Replace ${ask.was.length} ${ask.noun}${ask.was.length === 1 ? "" : "s"}` : "Replace"}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

/** What the evaluator picks and what moves a student forward, in the order one depends on the next [REQ SC-03 to SC-08, SC-17]. */
export function RatingFields({ m }: { m: MethodModel }) {
  const { rule, setRule, err, issues, showErrors, expanded, setExpanded } = m
  if (!rule.model) return null
  return (
    <div className="flex min-w-0 flex-col gap-6" data-type-body>
      <ReorderHelp />
      <StartingSets m={m} />
      {rule.model === "demonstration" ? (
        <LevelsField rule={rule} setRule={setRule} err={err} plain />
      ) : rule.model === "binary" ? (
        <OutcomesField rule={rule} setRule={setRule} err={err} plain />
      ) : (
        <>
          <QuestionsField rule={rule} setRule={setRule} err={err} expanded={expanded} setExpanded={setExpanded} plain />
          {rule.model === "scored" ? (
            <FieldBlock label="Scale" plain>
              <ScaleField rule={rule} setRule={setRule} issues={issues} showErrors={showErrors} short />
            </FieldBlock>
          ) : null}
          {rule.model === "question"
            ? <QuestionCountsWhen rule={rule} setRule={setRule} err={err} label="Moves forward when" plain />
            : <ScoredCountsWhen rule={rule} setRule={setRule} err={err} label="Moves forward when" plain />}
        </>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------------------------------------------------
// The method in plain words, by question

export interface MethodWords {
  /** The type's name, or null before one is chosen. */
  type: string | null
  /** What the evaluator picks, then what moves a student forward. */
  picks: MethodSentence[]
  who: MethodSentence[]
  /** Self-evaluation, feedback, approval, group check-off; one sentence when the evaluator's answer is all it takes. */
  needs: MethodSentence[]
}

export function methodWords(rule: LabRule): MethodWords {
  const all = methodSentences(rule)
  return {
    type: rule.model ? LAB_MODEL_LABEL[rule.model] : null,
    picks: all.filter((s) => s.step === "picks"),
    who: all.filter((s) => s.id === "who"),
    needs: all.filter((s) => s.step === "how" && s.id !== "who"),
  }
}

// ---------------------------------------------------------------------------------------------------------------------
// The list

/** The page with the Methods and Details tabs and the calm table: a row opens its method. */
export function MethodsHome({ banner, setBanner, missing }: { banner: ResultBannerValue | null; setBanner: (b: ResultBannerValue | null) => void; missing: boolean }) {
  const state = useV2State()
  const nav = useMethodNav()
  const count = React.useMemo(() => methodsOf(state).length, [state])
  return (
    <SettingsHome banner={banner} setBanner={setBanner} missing={missing}>
      {count ? <MethodsTable setBanner={setBanner} /> : <NoMethods href={nav.href(NEW)} />}
    </SettingsHome>
  )
}
