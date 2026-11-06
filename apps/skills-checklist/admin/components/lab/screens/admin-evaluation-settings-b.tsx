"use client"

/**
 * Evaluation settings (map D3, rebuilt 2026-11-05; D-L125): say once how this program judges its skills. A summary leads with what the settings add up to, live as they change. Four sections, each its
 * title with an icon on the left and its rows on the right. "What they will see" waits behind Preview: from 1100 px it opens beside the settings, so a change shows as it is made; below that, a dialog.
 * A skill's own number is edited in the Library, reached by the link in Times needed.
 *
 * URL: ?state=loading.
 */
import * as React from "react"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import { SectionTitle, SetupPrompt } from "@/components/lab/first-run"
import Link from "next/link"
import { FieldError } from "@exxatdesignux/ui/components/ui/field"
import { Input } from "@exxatdesignux/ui/components/ui/input"
import { cn } from "@exxatdesignux/ui/lib/utils"
import { TYPE } from "@/components/lab/type-scale"
import { useLabHref } from "@/components/lab/lab-bar/page-context"
import { IssueSummary } from "@/components/lab/configure/issue-summary"
import { BinaryLabelsField, ListEditor, ModelSection, PasteQuestions, QualifyingField, QuestionRuleField, ScaleField, ScoredRuleField, SignersField, checkOffGrantSelect, withCheckOffPatch, type SectionProps } from "@/components/lab/configure/fields"
import { LevelList, Row, SwitchRow, tileExamples, useWide } from "@/components/lab/configure/settings-rows"
import { ProgramPreviewDialog, ProgramPreviewPanel, StudentAddsRow } from "@/components/lab/configure/settings-dialogs"
import { ProgramSettingsFrame, type ProgramPage } from "@/components/lab/configure/program-layout"
import { focusField } from "@/components/lab/configure/use-configure"
import { MODEL_LABEL, ROLE_LABEL, appendQuestions, hasNeed, removeQuestion, ruleAllowsCheckOff, ruleSaysWhatCounts, studentNeedsSentence, withCheckOffDecided, type RuleIssue } from "@/lib/lab/configure"
import { TIMES_MAX } from "@/lib/lab/program-settings"
import { countSkills, skillNoun, skillNounPlural } from "@/lib/lab/terms"

/** A named section: the heading says what it is for, thin dividers between its rows. */
function Section({ id, title, icon, children, rows = true }: { id: string; title: string; icon: string; children: React.ReactNode; rows?: boolean }) {
  return (
    <section className="grid min-w-0 items-start gap-x-8 gap-y-3 border-t border-border pt-6 first:border-t-0 first:pt-0 @3xl:grid-cols-[16rem_minmax(0,1fr)]" aria-labelledby={id} data-settings-section>
      <SectionTitle as="h2" icon={icon} id={id} className={TYPE.card}>{title}</SectionTitle>
      <div className={cn("flex min-w-0 max-w-3xl flex-col", rows && "divide-y divide-border [&>*:first-child]:pt-0")}>{children}</div>
    </section>
  )
}

/** What the settings add up to, read at the top of the page and live as they change. Nothing chosen yet: where to start, and nothing preselected [REQ SC-02]. */
function SettingsAtAGlance({ rule }: { rule: ProgramPage["m"]["rule"] }) {
  if (!rule.model) return <SetupPrompt data-settings-glance scene="settings" text={`Nothing is set yet. Start by choosing how ${skillNounPlural()} are judged.`} />
  const said = hasNeed(rule) && rule.need <= TIMES_MAX && ruleSaysWhatCounts(rule)
  const signers = rule.evaluatorRoles.map((r) => ROLE_LABEL[r])
  const facts: Array<[string, string]> = [
    ["Evaluation model", MODEL_LABEL[rule.model]],
    ["Who signs off", signers.length ? signers.join(", ") : "Not chosen"],
    ["Admin approval", rule.approvalRequired ? "Required" : "Not required"],
    ["Self-evaluation", rule.selfEvaluation ? "On" : "Off"],
  ]
  return (
    <SetupPrompt
      data-settings-glance
      scene="settings"
      text={
        <div className="flex flex-col gap-3 text-foreground">
          {said ? <p className={TYPE.section} data-rule-sentence>{studentNeedsSentence(rule)}</p> : <p className="text-muted-foreground">Set what counts and the times needed to finish this rule.</p>}
          <dl className="grid grid-cols-2 gap-x-6 gap-y-3 @3xl:grid-cols-4">
            {facts.map(([k, v]) => (
              <div key={k} className="flex min-w-0 flex-col gap-0.5">
                <dt className={TYPE.meta}>{k}</dt>
                <dd className={TYPE.label}>{v}</dd>
              </div>
            ))}
          </dl>
        </div>
      }
    />
  )
}

const judgedTitle = () => `How ${skillNounPlural()} are judged`
const COUNTS_TITLE = "What counts as achieved"
const STUDENT_TITLE = "What the student does"
const EVALUATES_TITLE = "Who evaluates"
const STUDENT_FIELDS_LABEL = "What the student fills in"

/** A problem names the section it sits in on this page [REQ SC-18]. */
function sectionOf(i: RuleIssue): string {
  if (i.section === "model") return judgedTitle()
  if (i.field.startsWith("cfg-field-")) return STUDENT_TITLE
  return i.section === "signoff" ? EVALUATES_TITLE : COUNTS_TITLE
}

/** The list dialog holds its own fields: a problem inside it focuses the button that opens it. */
const focusOf = (i: RuleIssue): string => (i.field.startsWith("cfg-field-") ? "cfg-edit-fields" : i.field)

/** The rows that depend on the model [REQ SC-03, SC-04, SC-05, SC-07, SC-08], in the same label column. */
function ModelRows({ p }: { p: SectionProps & { err: (f: string) => string | undefined } }) {
  const { rule, setRule, err } = p
  if (rule.model === "binary") {
    return (
      <>
        <Row label="Labels" stacked><div className="max-w-2xl"><BinaryLabelsField rule={rule} setRule={setRule} err={err} first="First label" second="Second label" /></div></Row>
        <Row label="Which one qualifies" stacked><QualifyingField rule={rule} setRule={setRule} err={err} legend="Which one qualifies" legendHidden first="First label" second="Second label" /></Row>
      </>
    )
  }
  if (rule.model === "demonstration") return <Row label="Levels" hint="Name the levels, then tick the ones that count toward achieved." stacked><LevelList rule={rule} setRule={setRule} err={err} /></Row>
  const questions = (
    <Row label="Questions" stacked>
      {/* A long set scrolls inside its row, so the rows below stay in reach [REQ SC-06]. */}
      <div className="max-h-[28rem] max-w-2xl overflow-y-auto p-0.5">
        <ListEditor idBase="cfg-question" noun="Question" addId="cfg-add-question" values={rule.questions} err={err} onChange={(qs) => setRule((r) => ({ ...r, questions: qs }))} onRemove={(i) => setRule((r) => removeQuestion(r, i))} extra={<PasteQuestions existing={rule.questions} onAdd={(lines) => setRule((r) => appendQuestions(r, lines))} />} />
      </div>
    </Row>
  )
  if (rule.model === "question") {
    return (
      <>
        {questions}
        <Row label="Counts when" stacked><QuestionRuleField rule={rule} setRule={setRule} err={err} legendHidden /></Row>
      </>
    )
  }
  return (
    <>
      {questions}
      <Row label="Scale" stacked><ScaleField rule={rule} setRule={setRule} issues={p.issues} showErrors={p.showErrors} /></Row>
      <Row label="Counts when" stacked><ScoredRuleField rule={rule} setRule={setRule} err={err} radios legendHidden /></Row>
    </>
  )
}

function SettingsList({ page }: { page: ProgramPage }) {
  const { m } = page
  const to = useLabHref()
  const { rule, setRule, issues, showErrors } = m
  const undecided = !m.saved && !!rule.model && rule.checkOff?.enabled == null
  // No saved settings: group check-off starts off once there is a model, never the model's default [REQ SC-02].
  React.useEffect(() => { if (undecided) setRule(withCheckOffDecided) }, [undecided, setRule])
  const props: SectionProps = { rule, setRule, issues, showErrors, settings: [], legendHidden: true }
  const err = (f: string) => (showErrors ? issues.find((i) => i.field === f)?.message : undefined)
  const needErr = err("cfg-need")
  const different = m.differentNumber
  const grant = rule.model ? checkOffGrantSelect(rule, setRule) : null
  return (
    <div className="@container flex min-w-0 flex-col gap-8" data-layout="rows">
      {/* Stays in view when the first problem is far down the page; the focused field keeps its place below it. A long list scrolls inside. Solid and ruled off, above every row, so what scrolls under it (a tile, a focus ring) ends at the rule rather than showing through the banner's tint. */}
      {showErrors && issues.length ? (
        <div className="sticky top-0 z-30 -mx-1 max-h-[40dvh] overflow-y-auto border-b border-border bg-background px-1 pb-3" data-problems-sticky>
          <IssueSummary id="cfg-settings-issues" issues={issues} autoFocus={false} labelOf={sectionOf} onGo={(i) => focusField(focusOf(i))} />
        </div>
      ) : null}
      <SettingsAtAGlance rule={rule} />
      <div className="flex min-w-0 flex-col gap-6">
      <Section id="cfg-sec-judged" title={judgedTitle()} icon="fa-scale-balanced" rows={false}>
        <ModelSection {...props} examples={tileExamples(rule)} legend={judgedTitle()} />
      </Section>
      {rule.model ? (
        <>
          <Section id="cfg-sec-counts" title={COUNTS_TITLE} icon="fa-award">
            <ModelRows p={{ ...props, err }} />
            <Row
              label="Times needed"
              htmlFor="cfg-need"
              hint={
                <span className="flex flex-col gap-0.5">
                  {`How many evaluations a student needs for each ${skillNoun()}.`}
                  {different ? <Link href={to("admin/skills-library", { different: "1" })} className="w-fit underline underline-offset-2 hover:text-[var(--brand-color)]">{`${countSkills(different)} ${different === 1 ? "uses" : "use"} a different number`}</Link> : null}
                </span>
              }
            >
              <div className="flex flex-col items-end gap-1">
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
                  aria-invalid={!!needErr || undefined}
                  aria-describedby={needErr ? "cfg-need-error" : undefined}
                />
                {needErr ? <FieldError id="cfg-need-error">{needErr}</FieldError> : null}
              </div>
            </Row>
          </Section>
          <Section id="cfg-sec-student" title={STUDENT_TITLE} icon="fa-user-graduate">
            <div className="py-3" data-settings-row><StudentAddsRow {...props} heading={STUDENT_FIELDS_LABEL} title={STUDENT_FIELDS_LABEL} error={showErrors ? issues.find((i) => i.field.startsWith("cfg-field-"))?.message : undefined} /></div>
            <SwitchRow id="cfg-self" label="Student rates themselves first" hint="Before asking for an evaluation, the student rates their own performance." checked={rule.selfEvaluation} onChange={(v) => setRule((r) => ({ ...r, selfEvaluation: v }))} />
          </Section>
          <Section id="cfg-sec-evaluates" title={EVALUATES_TITLE} icon="fa-user-check">
            <Row label="Who can sign off" hint="An evaluator in any role ticked here can sign off." stacked><SignersField {...props} compact /></Row>
            <SwitchRow id="cfg-feedback" label="Feedback is required" hint="The evaluator must write feedback to submit." checked={rule.feedbackRequired} onChange={(v) => setRule((r) => ({ ...r, feedbackRequired: v }))} />
            <div data-section="checkoff">
              <SwitchRow id="cfg-checkoff" label="Faculty can check off a group" hint="Faculty can mark several students at once." checked={ruleAllowsCheckOff(rule)} onChange={(v) => setRule((r) => withCheckOffPatch(r, { enabled: v }))} />
              {grant ? <Row label={rule.model === "scored" ? "Score students get" : "Level students get"} htmlFor={grant.id} className="ms-1 mb-3 border-s-2 border-border py-1 ps-4">{grant.control}</Row> : null}
            </div>
            <SwitchRow id="cfg-approval" label="Approval before it counts" hint="An admin approves each evaluation before it counts." checked={rule.approvalRequired} onChange={(v) => setRule((r) => ({ ...r, approvalRequired: v }))} />
          </Section>
        </>
      ) : null}
      </div>
    </div>
  )
}

export function AdminEvaluationSettingsB() {
  const wide = useWide()
  const [previewing, setPreviewing] = React.useState(false)
  const beside = wide && previewing
  return (
    <ProgramSettingsFrame
      focusOf={focusOf}
      headerAction={(m) => wide
        ? <Button type="button" variant="outline" size="sm" disabled={!m.rule.model} aria-expanded={previewing} onClick={() => setPreviewing((o) => !o)} data-preview-toggle>{previewing ? "Hide preview" : "Preview"}</Button>
        : <ProgramPreviewDialog draft={m.rule} />}
    >
      {(page) => (
        <div className={cn("grid min-w-0 gap-8", beside && "grid-cols-[minmax(0,3fr)_minmax(0,2fr)] items-start")} data-settings-columns>
          <SettingsList page={page} />
          {beside ? <ProgramPreviewPanel draft={page.m.rule} onClose={() => setPreviewing(false)} /> : null}
        </div>
      )}
    </ProgramSettingsFrame>
  )
}
