"use client"

/**
 * Evaluation settings (map D3), "every field on the page" (concept D, D-L141, Romit 2026-11-10: "Concept D, make the level counts selection process
 * better"). One sheet of five sections divided by hairlines: How skills are judged, the model's own section (Levels, Outcomes, or Questions and what
 * counts), Achieved when, Steps before it counts, Forms. Each section's name sits left, its fields right, labels above fields. Nothing is behind
 * an Edit, a tab or a side panel. A sticky "Your rule" panel reads the rule aloud, counts unsaved changes and lists what is missing or wrong, each a link
 * to its field. At phone width the panel goes first and Save is a bar at the bottom. Preview is a dialog.
 *
 * URL: ?state=loading.
 */
import * as React from "react"
import Link from "next/link"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import { FieldError } from "@exxatdesignux/ui/components/ui/field"
import { Input } from "@exxatdesignux/ui/components/ui/input"
import { Label } from "@exxatdesignux/ui/components/ui/label"
import { cn } from "@exxatdesignux/ui/lib/utils"
import { TYPE } from "@/components/lab/type-scale"
import { useLabHref } from "@/components/lab/lab-bar/page-context"
import { ModelSection, NUMBER_WIDTH, ScaleField, SignersField, checkOffGrantSelect, withCheckOffPatch, type SectionProps } from "@/components/lab/configure/fields"
import { NumberWithUnit, tileExamples } from "@/components/lab/configure/settings-rows"
import { ProgramPreviewDialog, ProgramPreviewPanel } from "@/components/lab/configure/settings-dialogs"
import { ProgramSettingsFrame, type ProgramPage } from "@/components/lab/configure/program-layout"
import {
  FieldBlock,
  LevelsField,
  OutcomesField,
  QUESTIONS_SHOWN,
  QuestionCountsWhen,
  QuestionsField,
  ReorderHelp,
  RulePanel,
  ScoredCountsWhen,
  SheetSection,
  StepList,
  StudentFieldsTable,
  SwitchField,
  changedSettings,
  type Step,
} from "@/components/lab/configure/settings-sheet"
import { focusField } from "@/components/lab/configure/use-configure"
import { ruleAllowsCheckOff, withCheckOffDecided, type LabRule, type RuleIssue } from "@/lib/lab/configure"
import { TIMES_MAX } from "@/lib/lab/program-settings"
import { buildLibrary } from "@/lib/lab/library"
import { useV2State } from "@/lib/v2/react"
import { countSkills, inSentence, skillNoun, skillNounPlural } from "@/lib/lab/terms"

const judgedName = () => `How ${skillNounPlural()} are judged`
const STUDENT_FIELDS_LABEL = "What the student fills in"

/** The cards' example lines, with a level name lowercased where it falls mid-sentence ("Needs coaching to works alone"). */
function examples(rule: LabRule) {
  const e = tileExamples(rule)
  const named = rule.levels.map((l) => l.trim()).filter(Boolean)
  return named.length >= 2 ? { ...e, demonstration: `${named[0]} to ${inSentence(named[named.length - 1])}` } : e
}

/** A problem in a question the list hides (past the first 8): the list opens before focus moves to it. */
const hiddenQuestion = (i: RuleIssue) => {
  const m = /^cfg-question-(\d+)$/.exec(i.field)
  return !!m && Number(m[1]) >= QUESTIONS_SHOWN
}

/** The model's own section: its name and count. No purpose lines: they restated the fields (D-L34, anatomy A8). */
function modelSection(rule: LabRule): { title: string; count?: number } | null {
  switch (rule.model) {
    case "demonstration": return { title: "Levels", count: rule.levels.length }
    case "binary": return { title: "Outcomes" }
    case "question":
    case "scored": return { title: "Questions and what counts", count: rule.questions.length }
    default: return null
  }
}

function SettingsBody({ page, expanded, setExpanded }: { page: ProgramPage; expanded: boolean; setExpanded: (v: boolean) => void }) {
  const { m } = page
  const to = useLabHref()
  const state = useV2State()
  const { rule, setRule, issues, showErrors } = m
  const undecided = !m.saved && !!rule.model && rule.checkOff?.enabled == null
  // No saved settings: group check-off starts off once there is a model, never the model's default [REQ SC-02].
  React.useEffect(() => { if (undecided) setRule(withCheckOffDecided) }, [undecided, setRule])
  const props: SectionProps = { rule, setRule, issues, showErrors, settings: [], legendHidden: true }
  const err = (f: string) => (showErrors ? issues.find((i) => i.field === f)?.message : undefined)
  const needErr = err("cfg-need")
  const different = m.differentNumber
  const grant = rule.model ? checkOffGrantSelect(rule, setRule) : null
  const library = React.useMemo(() => buildLibrary(state), [state])
  const custom = library.filter((r) => r.configuration === "edited").length
  const changed = React.useMemo(() => changedSettings(rule, m.saved), [rule, m.saved])
  const own = modelSection(rule)
  const total = m.ids.length
  const [previewClosed, setPreviewClosed] = React.useState(false)

  const go = (i: RuleIssue) => {
    if (hiddenQuestion(i)) setExpanded(true)
    requestAnimationFrame(() => requestAnimationFrame(() => focusField(i.field)))
  }

  const steps: Step[] = [
    { id: "cfg-step-log", label: `Student logs the ${skillNoun()}`, fixed: true },
    { id: "cfg-self", label: "Student rates themselves first", help: "Before the evaluator sees the request", checked: rule.selfEvaluation, onChange: (v) => setRule((r) => ({ ...r, selfEvaluation: v })) },
    { id: "cfg-step-sign", label: "Evaluator signs off", fixed: true },
    { id: "cfg-approval", label: "Approval before it counts", help: "An admin approves each evaluation", checked: rule.approvalRequired, onChange: (v) => setRule((r) => ({ ...r, approvalRequired: v })) },
    { id: "cfg-step-counts", label: "Counts toward achieved", fixed: true },
  ]

  const applies = (
    <>
      <p className={TYPE.body}>{custom ? `${(total - custom).toLocaleString("en-US")} of ${countSkills(total)}` : `All ${countSkills(total)}`}</p>
      {custom ? <p className={TYPE.meta}>{`${countSkills(custom)} on Custom keep their own settings`}</p> : null}
    </>
  )

  return (
    <div className="@container min-w-0" data-layout="sheet">
      <ReorderHelp />
      {/* From a 94rem page (1920 px) the forms the settings produce fill the width beside the rule (Proposed, leadership direction D-L5, D-X30). */}
      <div className="grid min-w-0 items-start gap-x-10 gap-y-5 @[60rem]:grid-cols-[minmax(0,49.5rem)_17rem] @[94rem]:grid-cols-[minmax(0,49.5rem)_17rem_minmax(20rem,1fr)]">
        {rule.model && !previewClosed ? (
          <div className="hidden min-w-0 @[94rem]:sticky @[94rem]:top-4 @[94rem]:col-start-3 @[94rem]:row-start-1 @[94rem]:block" data-wide-preview>
            <ProgramPreviewPanel draft={rule} onClose={() => setPreviewClosed(true)} />
          </div>
        ) : null}
        <div className="order-first min-w-0 @[60rem]:order-none @[60rem]:sticky @[60rem]:top-4 @[60rem]:col-start-2 @[60rem]:row-start-1">
          <RulePanel rule={rule} issues={issues} showErrors={showErrors} unsaved={m.saved && m.dirty ? Math.max(1, changed.size) : 0} applies={applies} onGo={go} />
        </div>
        <div className="@container min-w-0 @[60rem]:col-start-1 @[60rem]:row-start-1" data-sheet>
          <SheetSection id="cfg-sec-model" title={judgedName()}>
            {/* Before a model is chosen this section is alone, with nothing chosen [REQ SC-02]. Its own container, so the four cards sit 2 x 2 here. */}
            <div className="@container min-w-0">
              <ModelSection {...props} examples={examples(rule)} legend={judgedName()} row />
            </div>
          </SheetSection>
          {own ? (
            <SheetSection id="cfg-sec-own" title={own.title} count={own.count}>
              {rule.model === "demonstration" ? <LevelsField rule={rule} setRule={setRule} err={err} changed={changed.has("levels")} /> : null}
              {rule.model === "binary" ? <OutcomesField rule={rule} setRule={setRule} err={err} changed={changed.has("outcomes")} /> : null}
              {rule.model === "question" || rule.model === "scored" ? <QuestionsField rule={rule} setRule={setRule} err={err} changed={changed.has("questions")} expanded={expanded} setExpanded={setExpanded} /> : null}
              {rule.model === "scored" ? (
                <FieldBlock label="Scale" changed={changed.has("scale")}>
                  <ScaleField rule={rule} setRule={setRule} issues={issues} showErrors={showErrors} />
                </FieldBlock>
              ) : null}
              {rule.model === "question" ? <QuestionCountsWhen rule={rule} setRule={setRule} err={err} changed={changed.has("countsWhen")} /> : null}
              {rule.model === "scored" ? <ScoredCountsWhen rule={rule} setRule={setRule} err={err} changed={changed.has("countsWhen")} /> : null}
            </SheetSection>
          ) : null}
          {rule.model ? (
            <>
              <SheetSection id="cfg-sec-counts" title="Achieved when">
                <FieldBlock
                  label="Times needed"
                  htmlFor="cfg-need"
                  changed={changed.has("need")}
                  end={m.saved && different ? (
                    <Link href={to("admin/skills-library", { different: "1" })} className={cn(TYPE.label, "underline underline-offset-4 hover:text-[var(--brand-color)]")} data-different-link>
                      {`${countSkills(different)} ${different === 1 ? "uses its" : "use their"} own number`}
                    </Link>
                  ) : undefined}
                >
                  <NumberWithUnit unit={`${rule.need === 1 ? "evaluation" : "evaluations"} for each ${skillNoun()}`} unitId="cfg-need-unit">
                    <Input
                      id="cfg-need"
                      type="number"
                      inputMode="numeric"
                      min={1}
                      max={TIMES_MAX}
                      step={1}
                      className={NUMBER_WIDTH}
                      value={Number.isFinite(rule.need) ? String(rule.need) : ""}
                      onChange={(e) => { const raw = e.target.value; setRule((r) => ({ ...r, need: raw.trim() === "" ? Number.NaN : Number(raw) })) }}
                      aria-invalid={!!needErr || undefined}
                      aria-describedby={[needErr ? "cfg-need-error" : "", "cfg-need-unit"].filter(Boolean).join(" ")}
                    />
                  </NumberWithUnit>
                  {needErr ? <FieldError id="cfg-need-error">{needErr}</FieldError> : null}
                </FieldBlock>
                <FieldBlock label="Who can sign off" changed={changed.has("signers")}>
                  <SignersField {...props} />
                </FieldBlock>
              </SheetSection>
              <SheetSection id="cfg-sec-steps" title="Steps before it counts">
                <StepList steps={steps} changed={(id) => (id === "cfg-self" && changed.has("self")) || (id === "cfg-approval" && changed.has("approval"))} />
              </SheetSection>
              <SheetSection id="cfg-sec-forms" title="Forms">
                <FieldBlock label={STUDENT_FIELDS_LABEL} labelId="cfg-fields-label" changed={changed.has("fields")}>
                  <StudentFieldsTable rule={rule} setRule={setRule} err={err} labelId="cfg-fields-label" />
                </FieldBlock>
                <SwitchField id="cfg-feedback" label="Feedback is required" help="The evaluator writes feedback before submitting" checked={rule.feedbackRequired} onChange={(v) => setRule((r) => ({ ...r, feedbackRequired: v }))} changed={changed.has("feedback")} />
                <div data-section="checkoff">
                  <SwitchField
                    id="cfg-checkoff"
                    label="Faculty can check off a group"
                    help="One faculty member ticks several students at once"
                    checked={ruleAllowsCheckOff(rule)}
                    onChange={(v) => setRule((r) => withCheckOffPatch(r, { enabled: v }))}
                    changed={changed.has("checkOff")}
                    below={ruleAllowsCheckOff(rule) ? (
                      <div className="flex flex-col gap-2 border-s-2 border-border ps-4" data-checkoff-grant>
                        {grant ? (
                          <>
                            <Label htmlFor={grant.id} className={TYPE.group}>{rule.model === "scored" ? "Score given to each student checked off" : "Level given to each student checked off"}</Label>
                            <div className="w-44">{grant.control}</div>
                          </>
                        ) : (
                          <p className={TYPE.body}>{rule.model === "binary" ? `A tick records ${rule.qualifyingLabel !== null && rule.outcomeLabels[rule.qualifyingLabel].trim() ? inSentence(rule.outcomeLabels[rule.qualifyingLabel].trim()) : "the outcome that counts"}.` : rule.model === "question" ? "A tick records every question answered Yes." : "A tick records the level that counts."}</p>
                        )}
                      </div>
                    ) : undefined}
                  />
                </div>
              </SheetSection>
            </>
          ) : null}
        </div>
      </div>
    </div>
  )
}

export function AdminEvaluationSettingsB() {
  const [expanded, setExpanded] = React.useState(false)
  return (
    <ProgramSettingsFrame
      phoneSaveBar
      // Save with a problem in a question the list hides: the list opens, then the frame focuses the field.
      onIssue={(i) => { if (hiddenQuestion(i)) setExpanded(true) }}
      headerAction={(m) => (
        <>
          <ProgramPreviewDialog draft={m.rule} />
          {m.dirty ? <Button type="button" variant="ghost" size="sm" onClick={() => m.discard()} data-discard>Discard</Button> : null}
        </>
      )}
    >
      {(page) => <SettingsBody page={page} expanded={expanded} setExpanded={setExpanded} />}
    </ProgramSettingsFrame>
  )
}
