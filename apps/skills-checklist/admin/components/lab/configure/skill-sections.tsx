"use client"

/**
 * The sections and rows of one skill's evaluation setup (map D1c, D-L115), shared by the Configure one skill page and the bulk page (D4). One section open at a time; a closed one states its values on one line.
 * Lists open a Dialog whose result stays in the draft until the page's Save. Every control keeps the id a validation issue names, so a problem can open its section and focus it. Nothing here writes.
 */
import * as React from "react"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@exxatdesignux/ui/components/ui/accordion"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import { Checkbox } from "@exxatdesignux/ui/components/ui/checkbox"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@exxatdesignux/ui/components/ui/dialog"
import { FieldError, FieldLegend, FieldSet } from "@exxatdesignux/ui/components/ui/field"
import { Input } from "@exxatdesignux/ui/components/ui/input"
import { StatusBadge } from "@exxatdesignux/ui/components/ui/status-badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@exxatdesignux/ui/components/ui/table"
import { cn } from "@exxatdesignux/ui/lib/utils"
import { TYPE } from "@/components/lab/type-scale"
import { useDialogDiscard } from "@/components/lab/shared/unsaved-guard"
import { appendQuestions, countsFromIndex, countsFromOption, hasNeed, LAB_MODEL_LABEL, levelTicked, removeLevel, removeQuestion, ROLE_LABEL, ruleAllowsCheckOff, ruleCheckOffScore, withLevelTicked, type LabRule, type RuleIssue } from "@/lib/lab/configure"
import { checkOffLevelIndex } from "@/lib/lab/checkoff-rules"
import { CONFIGURATION_META } from "@/lib/lab/library"
import { panelIssues, rebuildForModel, TIMES_MAX } from "@/lib/lab/program-settings"
import { inSentence, skillNoun } from "@/lib/lab/terms"
import { plural } from "@/lib/v2/format"
import { BinaryLabelsField, checkOffGrantSelect, ListEditor, ModelSection, PasteQuestions, QualifyingField, QuestionRuleField, QuestionSubsetPicker, ScaleField, ScoredRuleField, SignersField, withCheckOffPatch, type SectionProps } from "./fields"
import { useFieldLayer, useFocusBack } from "./field-layer"
import { MinimumsField } from "./rule-conditions"
import { StudentAddsRow } from "./settings-dialogs"
import { LevelList, Row, SwitchRow, tileExamples } from "./settings-rows"

export type SkillSection = "judged" | "counts" | "student" | "who"

export const SECTION_TITLE: Record<SkillSection, () => string> = {
  judged: () => `How this ${skillNoun()} is judged`,
  counts: () => "What counts as achieved",
  student: () => "What the student does",
  who: () => "Who evaluates",
}
export const STUDENT_FIELDS_LABEL = "What the student fills in"

/** One problem per field, whichever rules or skills raise it, so a list's count and a section's "N to fix" agree. */
export const uniqueByField = <T extends Pick<RuleIssue, "field">>(issues: readonly T[]): T[] => [...new Map([...issues].reverse().map((i) => [i.field, i] as const)).values()].reverse()

/** The section holding a problem. */
export function sectionOfIssue(i: RuleIssue): SkillSection {
  if (i.section === "model") return "judged"
  if (i.field.startsWith("cfg-field-")) return "student"
  return i.section === "signoff" ? "who" : "counts"
}

/** The control a problem focuses. A problem inside a dialog focuses the button that opens it. */
export function fieldOfIssue(i: RuleIssue): string {
  if (/^cfg-(add-question|question-)/.test(i.field)) return "cfg-edit-questions"
  if (/^cfg-(add-level|level-)/.test(i.field)) return "cfg-edit-levels"
  if (i.field.startsWith("cfg-field-")) return "cfg-edit-fields"
  if (i.field === "cfg-qrule-subset") return "cfg-choose-subset"
  if (i.field.startsWith("cfg-lmin-level-")) return i.field.replace("cfg-lmin-level-", "cfg-lmin-")
  return i.field
}

/** The level, label or question rule that makes an evaluation count, in plain words. */
export function countsWord(r: LabRule): string {
  if (r.model === "binary") return r.qualifyingLabel === null ? "Not chosen" : r.outcomeLabels[r.qualifyingLabel]?.trim() || "Not named"
  if (r.model === "demonstration") {
    const from = countsFromIndex(r)
    return from === null || !r.levels[from]?.trim() ? "Levels not chosen" : countsFromOption(r.levels, from)
  }
  if (r.model === "question") {
    const q = r.questionRule
    const n = r.questions.filter((x) => x.trim()).length
    if (!q) return "Not chosen"
    if (q.kind === "all") return "All Yes"
    return q.kind === "atLeast" ? `At least ${q.n} of ${n} Yes` : "Named questions"
  }
  if (r.model === "scored") {
    const s = r.scoredRule
    if (!s) return "Not chosen"
    const word = s.kind === "average" ? "Average" : s.kind === "total" ? "Total" : "Every question"
    return `${word} at least ${Number.isFinite(s.value) ? s.value : ""}`.trim()
  }
  return "Not chosen"
}

const rolesWord = (r: LabRule): string => r.evaluatorRoles.map((x) => ROLE_LABEL[x]).join(", ") || "Nobody chosen"

/** A closed section's one line: plain values, not sentences (D-L34). */
export function sectionSummary(section: SkillSection, r: LabRule): string {
  if (section === "judged") return r.model ? LAB_MODEL_LABEL[r.model] : "Not chosen"
  if (section === "who") return [rolesWord(r), r.feedbackRequired ? "feedback required" : null, r.approvalRequired ? "approval required" : null].filter(Boolean).join(", ")
  if (section === "student") {
    const n = r.studentFields.length
    return [n ? plural(n, "field", "fields") : "No fields", r.selfEvaluation ? "rates first" : "does not rate first"].join(", ")
  }
  if (!r.model) return "Choose how it is judged first"
  const minimums = r.levelMinimums.length + r.settingMinimums.length
  return [countsWord(r), hasNeed(r) ? plural(r.need, "time", "times") : null, minimums ? plural(minimums, "minimum", "minimums") : "no minimums"].filter(Boolean).join(", ")
}

function checkOffWord(r: LabRule): string {
  if (!ruleAllowsCheckOff(r)) return "Off"
  if (r.model === "demonstration") {
    const level = r.levels[checkOffLevelIndex(r.levels, r.checkOff?.levelIndex)]?.trim()
    return level ? `On, each student at ${inSentence(level)}` : "On"
  }
  return r.model === "scored" ? `On, each student at ${ruleCheckOffScore(r)}` : "On"
}

/** The program's package under Default, read aloud: only the rows that apply to the model (map D1c). */
export function packageReadOut(r: LabRule): Array<{ label: string; value: string }> {
  const named = (xs: readonly string[]) => xs.map((x) => x.trim()).filter(Boolean).join(", ") || "Not named"
  const byModel: Array<{ label: string; value: string }> =
    r.model === "demonstration"
      ? [{ label: "Levels", value: named(r.levels) }, { label: "Counts", value: countsWord(r) }]
      : r.model === "binary"
        ? [{ label: "Labels", value: named(r.outcomeLabels) }, { label: "Which one qualifies", value: countsWord(r) }]
        : r.model === "scored"
          ? [{ label: "Scale", value: Number.isInteger(r.scaleMax) && r.scaleMax >= 2 ? `1 to ${r.scaleMax}` : "Not chosen" }, { label: "Counts", value: countsWord(r) }]
          : r.model === "question"
            ? [{ label: "Counts", value: countsWord(r) }]
            : []
  return [
    { label: "Judged by", value: r.model ? LAB_MODEL_LABEL[r.model] : "Not chosen" },
    ...byModel,
    { label: "Student fills in", value: r.studentFields.map((f) => `${f.label.trim()}, ${f.mandatory ? "required" : "optional"}`).join("; ") || "Nothing" },
    { label: "Student rates first", value: r.selfEvaluation ? "Yes" : "No" },
    { label: "Who signs off", value: rolesWord(r) },
    { label: "Feedback", value: r.feedbackRequired ? "Required" : "Optional" },
    { label: "Group check-off", value: checkOffWord(r) },
    { label: "Approval", value: r.approvalRequired ? "Required before it counts" : "Not required" },
  ]
}

/** Times needed, the one input of a skill's own part. */
export function TimesNeededField({ rule, setRule, error }: Pick<SectionProps, "rule" | "setRule"> & { error?: string }) {
  return (
    <div className="flex flex-col gap-1">
      <Input
        id="cfg-need"
        type="number"
        inputMode="numeric"
        min={1}
        max={TIMES_MAX}
        step={1}
        className="w-24 tabular-nums"
        placeholder="Not set"
        value={Number.isFinite(rule.need) ? String(rule.need) : ""}
        onChange={(e) => { const raw = e.target.value; setRule((r) => ({ ...r, need: raw.trim() === "" ? Number.NaN : Number(raw) })) }}
        aria-invalid={!!error || undefined}
        aria-describedby={error ? "cfg-need-error" : undefined}
      />
      {error ? <FieldError id="cfg-need-error">{error}</FieldError> : null}
    </div>
  )
}

const VALUE_ROW = "flex flex-wrap items-center justify-between gap-2"

/** Questions: the count with Edit questions, or an amber "No questions yet" with Add questions; the list opens in a Dialog [REQ SC-04]. */
export function QuestionsRow({ rule, setRule, error }: { rule: LabRule; setRule: SectionProps["setRule"]; error?: string }) {
  const layer = useFieldLayer()
  const [draft, setDraft] = React.useState<LabRule | null>(null)
  const n = rule.questions.filter((q) => q.trim()).length
  const show = () => setDraft({ ...rule, questions: rule.questions.length ? [...rule.questions] : [""] })
  const done = () => {
    if (!draft) return
    let next = draft
    for (let i = next.questions.length - 1; i >= 0; i--) if (!next.questions[i]!.trim()) next = removeQuestion(next, i)
    setRule((r) => ({ ...r, questions: next.questions, questionRule: next.questionRule }))
    setDraft(null)
  }
  const written = (qs: readonly string[]) => JSON.stringify(qs.map((q) => q.trim()).filter(Boolean))
  const guard = useDialogDiscard(!!draft && written(draft.questions) !== written(rule.questions), () => setDraft(null))
  const focus = useFocusBack("cfg-edit-questions")
  const answer = rule.model === "scored" ? (Number.isInteger(rule.scaleMax) && rule.scaleMax >= 2 ? `A score from 1 to ${rule.scaleMax} for each question` : "A score for each question") : "Yes or No for each question"
  const none = CONFIGURATION_META["not-configured"]
  return (
    <div className="flex flex-col gap-1">
      <div className={VALUE_ROW}>
        {n ? <span className={TYPE.body} data-questions-count>{plural(n, "question", "questions")}</span> : <span data-questions-count><StatusBadge label="No questions yet" tone={none.tone} icon={none.icon} size="sm" /></span>}
        <Button id="cfg-edit-questions" type="button" variant="outline" size="sm" aria-invalid={error ? true : undefined} aria-describedby={error ? "cfg-edit-questions-error" : undefined} onClick={show}>{n ? "Edit questions" : "Add questions"}</Button>
      </div>
      {error ? <FieldError id="cfg-edit-questions-error">{error}</FieldError> : null}
      {guard.question}
      <Dialog open={!!draft} onOpenChange={(o) => { if (!o) guard.close() }}>
        <DialogContent className={cn("flex max-h-[85dvh] flex-col sm:max-w-xl", layer.content)} overlayClassName={layer.content} data-questions-dialog {...focus}>
          <DialogHeader>
            <DialogTitle>Questions</DialogTitle>
            <DialogDescription className="sr-only">{`${answer}, on this ${skillNoun()} only.`}</DialogDescription>
          </DialogHeader>
          <div className="min-h-0 flex-1 overflow-y-auto">
            {draft ? (
              <ListEditor
                idBase="cfg-question"
                noun="Question"
                addId="cfg-add-question"
                values={draft.questions}
                err={() => undefined}
                onChange={(questions) => setDraft((d) => (d ? { ...d, questions } : d))}
                onRemove={(i) => setDraft((d) => (d ? removeQuestion(d, i) : d))}
                extra={<PasteQuestions existing={draft.questions} onAdd={(lines) => setDraft((d) => (d ? appendQuestions(d, lines) : d))} />}
              />
            ) : null}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" size="sm" onClick={guard.close}>Cancel</Button>
            <Button type="button" variant="default" size="sm" onClick={done}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

/** Questions that must be Yes for a named rule [REQ SC-05, SC-06]: the count with Choose; the list opens in a Dialog. */
export function SubsetRow({ rule, setRule, error }: { rule: LabRule; setRule: SectionProps["setRule"]; error?: string }) {
  const layer = useFieldLayer()
  const [draft, setDraft] = React.useState<LabRule | null>(null)
  const focus = useFocusBack("cfg-choose-subset")
  const guard = useDialogDiscard(!!draft && JSON.stringify(draft.questionRule) !== JSON.stringify(rule.questionRule), () => setDraft(null))
  const picked = rule.questionRule?.kind === "subset" ? rule.questionRule.indices.length : 0
  const n = rule.questions.filter((q) => q.trim()).length
  return (
    <div className="flex flex-col gap-1">
      <div className={VALUE_ROW}>
        <span className={cn(TYPE.body, "tabular-nums")} data-subset-count>{`${picked} of ${n}`}</span>
        <Button id="cfg-choose-subset" type="button" variant="outline" size="sm" aria-label="Choose the questions that must be Yes" aria-describedby={error ? "cfg-choose-subset-error" : undefined} onClick={() => setDraft(rule)}>Choose</Button>
      </div>
      {error ? <FieldError id="cfg-choose-subset-error">{error}</FieldError> : null}
      {guard.question}
      <Dialog open={!!draft} onOpenChange={(o) => { if (!o) guard.close() }}>
        <DialogContent className={cn("flex max-h-[85dvh] flex-col sm:max-w-xl", layer.content)} overlayClassName={layer.content} data-subset-dialog {...focus}>
          <DialogHeader>
            <DialogTitle>Questions that must be Yes</DialogTitle>
            <DialogDescription className="sr-only">{`Tick the questions that must be answered Yes on this ${skillNoun()}.`}</DialogDescription>
          </DialogHeader>
          <div className="min-h-0 flex-1 overflow-y-auto">
            {draft ? <QuestionSubsetPicker rule={draft} setRule={(fn) => setDraft((d) => (d ? fn(d) : d))} /> : null}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" size="sm" onClick={guard.close}>Cancel</Button>
            <Button type="button" variant="default" size="sm" onClick={() => { if (draft) setRule((r) => ({ ...r, questionRule: draft.questionRule })); setDraft(null) }}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

/** Levels: a Level and Counts table beside Edit levels [REQ SC-08]; names, order and starting sets open in a Dialog, the same pattern as questions and student fields. Every level has a box (D-L95). */
export function LevelsRow({ rule, setRule, issues, showErrors }: Pick<SectionProps, "rule" | "setRule" | "issues" | "showErrors">) {
  const layer = useFieldLayer()
  const [draft, setDraft] = React.useState<LabRule | null>(null)
  const focus = useFocusBack("cfg-edit-levels")
  const changed = !!draft && JSON.stringify(draft.levels) !== JSON.stringify(rule.levels)
  const guard = useDialogDiscard(changed, () => setDraft(null))
  const err = (f: string) => (showErrors ? issues.find((i) => i.field === f)?.message : undefined)
  const levelsErr = showErrors ? issues.find((i) => /^cfg-(add-level|level-)/.test(i.field))?.message : undefined
  const countsErr = err("cfg-counts-from")
  const draftErr = (f: string) => (showErrors && draft ? panelIssues(draft).find((i) => i.field === f)?.message : undefined)
  const named = rule.levels.some((l) => l.trim())
  const done = () => {
    if (!draft) return
    let next = draft
    for (let i = next.levels.length - 1; i >= 0; i--) if (!next.levels[i]!.trim()) next = removeLevel(next, i)
    setRule(() => next)
    setDraft(null)
  }
  return (
    <FieldSet id="cfg-counts-from" tabIndex={-1} className="flex flex-col gap-1 outline-none" data-counts-from aria-invalid={!!countsErr || undefined} aria-describedby={countsErr ? "cfg-counts-from-error" : undefined}>
      <FieldLegend variant="label" className="sr-only">Levels that count</FieldLegend>
      <div className="flex flex-wrap items-start justify-between gap-2">
        {named ? (
          <div className="min-w-0 max-w-sm flex-1" data-level-table>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Level</TableHead>
                  <TableHead className="w-20 text-center">Counts</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rule.levels.map((name, i) => {
                  const shown = name.trim() || `Level ${i + 1}`
                  return (
                    <TableRow key={i}>
                      <TableCell className="whitespace-normal break-words">{shown}</TableCell>
                      <TableCell className="text-center">
                        <Checkbox id={`cfg-counts-from-${i}`} aria-label={`${shown} counts`} checked={levelTicked(rule, i)} onCheckedChange={(c) => setRule((r) => withLevelTicked(r, i, c === true))} />
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        ) : <span className={TYPE.helper}>No levels yet</span>}
        <Button id="cfg-edit-levels" type="button" variant="outline" size="sm" aria-describedby={levelsErr ? "cfg-edit-levels-error" : undefined} onClick={() => setDraft(rule)}>Edit levels</Button>
      </div>
      {levelsErr ? <FieldError id="cfg-edit-levels-error">{levelsErr}</FieldError> : null}
      {countsErr ? <FieldError id="cfg-counts-from-error">{countsErr}</FieldError> : null}
      {guard.question}
      <Dialog open={!!draft} onOpenChange={(o) => { if (!o) guard.close() }}>
        <DialogContent className={cn("flex max-h-[85dvh] flex-col sm:max-w-xl", layer.content)} overlayClassName={layer.content} data-levels-dialog {...focus}>
          <DialogHeader>
            <DialogTitle>Levels</DialogTitle>
            <DialogDescription className="sr-only">Name the levels, lowest first.</DialogDescription>
          </DialogHeader>
          <div className="@container min-h-0 flex-1 overflow-y-auto p-0.5">
            {draft ? <LevelList namesOnly rule={draft} setRule={(fn) => setDraft((d) => (d ? fn(d) : d))} err={draftErr} /> : null}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" size="sm" onClick={guard.close}>Cancel</Button>
            <Button type="button" variant="default" size="sm" onClick={done}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </FieldSet>
  )
}

/** Where the bulk page swaps a row for its Mixed form. Each receives the row's control. */
export type SectionSlot = "model" | "criteria" | "need" | "minimums" | "studentFields" | "self" | "signers" | "feedback" | "checkOff" | "approval"

export interface ConfigureSectionsProps {
  rule: LabRule
  setRule: SectionProps["setRule"]
  issues: RuleIssue[]
  showErrors: boolean
  settings: string[]
  open: SkillSection | ""
  onOpen: (s: SkillSection | "") => void
  /** Only the model's section, until there is a model (Not configured, map D1c). */
  onlyJudged?: boolean
  /** The panel's own model change [REQ SC-09]: no question first; the save dialog lists what is cleared. Absent, the field asks. */
  rebuildFrom?: { program: LabRule | null; saved: LabRule | null }
  onModelChosen?: () => void
  /** Closes What counts as achieved when the page has no preview beside it [REQ SC-17]. */
  sentence?: React.ReactNode
  /** The bulk page's Mixed rows, and its words for a closed section. */
  slot?: (name: SectionSlot, control: React.ReactNode) => React.ReactNode
  summaryOf?: (s: SkillSection, normal: string) => string
  /** The several-skills page words this section in the plural. */
  judgedTitle?: string
}

/** The four sections (map D1c). A choice of model never opens or closes one: arrow keys walk the tiles with the section staying where it is. */
export function ConfigureSections({ rule, setRule, issues, showErrors, settings, open, onOpen, onlyJudged, rebuildFrom, onModelChosen, sentence, slot, summaryOf, judgedTitle }: ConfigureSectionsProps) {
  const props: SectionProps = { rule, setRule, issues, showErrors, settings, legendHidden: true }
  const put = (name: SectionSlot, control: React.ReactNode) => (slot ? slot(name, control) : control)
  const err = (f: string) => (showErrors ? issues.find((i) => i.field === f)?.message : undefined)
  const firstErr = (re: RegExp) => (showErrors ? issues.find((i) => re.test(i.field))?.message : undefined)
  const usesQ = rule.model === "question" || rule.model === "scored"
  const grant = rule.model ? checkOffGrantSelect(rule, setRule) : null
  // Before the first Save too: a closed section is the only place a problem inside it can show.
  const problems = (s: SkillSection) => uniqueByField(issues).filter((i) => sectionOfIssue(i) === s).length
  const item = (s: SkillSection, children: React.ReactNode) => {
    const n = problems(s)
    const normal = sectionSummary(s, rule)
    return (
      <AccordionItem value={s} data-section-item={s}>
        <AccordionTrigger className="py-3 hover:no-underline [&>i.accordion-chevron]:transition-none">
          <span className="flex min-w-0 flex-1 flex-col items-start gap-0.5 text-start @min-[32rem]:flex-row @min-[32rem]:items-baseline @min-[32rem]:justify-between @min-[32rem]:gap-4">
            <span className={cn(TYPE.group, "shrink-0")}>{s === "judged" && judgedTitle ? judgedTitle : SECTION_TITLE[s]()}</span>
            {open === s && (!n || !showErrors) ? null : n ? (
              <span className="flex items-center gap-1.5 text-sm font-normal text-destructive" data-section-problems>
                <i className="fa-solid fa-circle-exclamation text-xs" aria-hidden="true" />
                {`${n} to fix`}
              </span>
            ) : <span className="min-w-0 max-w-full truncate text-sm font-normal text-muted-foreground" data-section-summary>{summaryOf ? summaryOf(s, normal) : normal}</span>}
          </span>
        </AccordionTrigger>
        <AccordionContent className="flex flex-col divide-y divide-border text-foreground">{children}</AccordionContent>
      </AccordionItem>
    )
  }
  return (
    <Accordion type="single" collapsible value={open} onValueChange={(v) => onOpen(v as SkillSection | "")} className="@container border-t border-border" data-configure-sections>
      {item("judged", put("model", (
        <div className="py-2">
          <ModelSection
            {...props}
            examples={tileExamples(rule)}
            legend={judgedTitle ?? SECTION_TITLE.judged()}
            rebuild={rebuildFrom ? (r, m) => rebuildForModel(r, m, rebuildFrom.program, rebuildFrom.saved) : undefined}
            onChosen={onModelChosen}
          />
        </div>
      )))}
      {onlyJudged ? null : (
        <>
          {item("counts", (
            <>
              {put("criteria", (
                <>
                  {rule.model === "demonstration" ? <Row label="Levels" stacked><LevelsRow rule={rule} setRule={setRule} issues={issues} showErrors={showErrors} /></Row> : null}
                  {rule.model === "binary" ? (
                    <>
                      <Row label="Labels" stacked><div className="max-w-2xl"><BinaryLabelsField rule={rule} setRule={setRule} err={err} first="First label" second="Second label" /></div></Row>
                      <Row label="Which one qualifies" stacked><QualifyingField rule={rule} setRule={setRule} err={err} legend="Which one qualifies" legendHidden first="First label" second="Second label" /></Row>
                    </>
                  ) : null}
                  {rule.model === "scored" ? <Row label="Scale" stacked><ScaleField short rule={rule} setRule={setRule} issues={issues} showErrors={showErrors} /></Row> : null}
                  {rule.model === "scored" ? <Row label="Counts when" stacked><ScoredRuleField rule={rule} setRule={setRule} err={err} compact /></Row> : null}
                  {rule.model === "question" ? <Row label="Counts when" stacked><QuestionRuleField compact rule={rule} setRule={setRule} err={err} subsetSlot={<SubsetRow rule={rule} setRule={setRule} error={err("cfg-qrule-subset")} />} /></Row> : null}
                  {usesQ ? <Row label="Questions" stacked><QuestionsRow rule={rule} setRule={setRule} error={firstErr(/^cfg-(add-question|question-)/)} /></Row> : null}
                </>
              ))}
              <Row label="Times needed" htmlFor="cfg-need">{put("need", <TimesNeededField rule={rule} setRule={setRule} error={err("cfg-need")} />)}</Row>
              <Row label="Minimums" stacked>{put("minimums", <MinimumsField rule={rule} setRule={setRule} issues={issues} showErrors={showErrors} settings={settings} />)}</Row>
              {sentence ? <div className="py-3">{sentence}</div> : null}
            </>
          ))}
          {item("student", (
            <>
              {put("studentFields", <div className="py-3" data-settings-row><StudentAddsRow {...props} heading={STUDENT_FIELDS_LABEL} title={STUDENT_FIELDS_LABEL} error={firstErr(/^cfg-field-/)} /></div>)}
              {put("self", <SwitchRow id="cfg-self" label="Student rates themselves first" checked={rule.selfEvaluation} onChange={(v) => setRule((r) => ({ ...r, selfEvaluation: v }))} />)}
            </>
          ))}
          {item("who", (
            <>
              {put("signers", <Row label="Who can sign off" stacked><SignersField {...props} compact /></Row>)}
              {put("feedback", <SwitchRow id="cfg-feedback" label="Feedback is required" checked={rule.feedbackRequired} onChange={(v) => setRule((r) => ({ ...r, feedbackRequired: v }))} />)}
              {put("checkOff", (
                <div data-section="checkoff">
                  <SwitchRow id="cfg-checkoff" label="Faculty can check off a group" checked={ruleAllowsCheckOff(rule)} onChange={(v) => setRule((r) => withCheckOffPatch(r, { enabled: v }))} />
                  {grant ? <Row label={rule.model === "scored" ? "Score for each student checked off" : "Level for each student checked off"} htmlFor={grant.id} className="ms-1 mb-3 border-s-2 border-border py-1 ps-4">{grant.control}</Row> : null}
                </div>
              ))}
              {put("approval", <SwitchRow id="cfg-approval" label="Approval before it counts" checked={rule.approvalRequired} onChange={(v) => setRule((r) => ({ ...r, approvalRequired: v }))} />)}
            </>
          ))}
        </>
      )}
    </Accordion>
  )
}
