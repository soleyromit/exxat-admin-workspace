"use client"

/**
 * Configure one skill in the Evaluation settings cards (contract ADMIN-D1c, layout amendment 2026-11-10, D-L135): the same three DS Cards, names and order as
 * Evaluation settings B (What counts as achieved, Steps before it counts, Forms), so program and skill settings read as one system. No accordion: every
 * setting is on the page. Each card's header says where its values come from (Default, muted; Custom, a badge). Under Default the card reads the program's
 * values in place, one label column and one value column, and the rows a skill always keeps for itself (Times needed, Minimums, its questions) stay live
 * controls marked "This skill only" [map D0 rule 5]. Under Custom every row is the control Evaluation settings uses. Nothing here writes; the page saves.
 */
import * as React from "react"
import { StatusBadge } from "@exxatdesignux/ui/components/ui/status-badge"
import { Label } from "@exxatdesignux/ui/components/ui/label"
import { cn } from "@exxatdesignux/ui/lib/utils"
import { TYPE } from "@/components/lab/type-scale"
import { ruleAllowsCheckOff, withCheckOffDecided, type LabRule, type RuleIssue } from "@/lib/lab/configure"
import { CONFIGURATION_META } from "@/lib/lab/library"
import { rebuildForModel } from "@/lib/lab/program-settings"
import { movesWhen, skillNoun } from "@/lib/lab/terms"
import type { Configuration } from "@/lib/lab/library"
import { BinaryLabelsField, CHECKOFF_GRANT_LABEL, CHECKOFF_SWITCH_LABEL, CheckOffGrantNote, checkOffGrantSelect, ModelSection, QualifyingField, QuestionRuleField, ScaleField, ScoredRuleField, SignersField, withCheckOffPatch, type SectionProps } from "./fields"
import { MinimumsField } from "./rule-conditions"
import { SkillRuleSentence, StudentAddsRow } from "./settings-dialogs"
import { FieldRow, LevelList, PathSteps, SettingRow, SettingsCard, SwitchSetting, tileExamples, ValueRow, type PathStep } from "./settings-rows"
import { fieldOfIssue, packageReadOut, QuestionsRow, STUDENT_FIELDS_LABEL, SubsetRow, TimesNeededField, uniqueByField } from "./skill-sections"

export const CARD_TITLE = { counts: "What counts as achieved", steps: "Steps before it counts", forms: "Forms" } as const
const judgedTitle = () => `How this ${skillNoun()} is judged`
const OWN = "Set on this skill only"

/** The card holding a problem, in the page's words [REQ SC-18]. */
export function cardOfIssue(i: RuleIssue): string {
  if (i.field.startsWith("cfg-field-") || i.field.startsWith("cfg-checkoff")) return CARD_TITLE.forms
  if (i.section === "signoff" && !i.field.startsWith("cfg-role-")) return CARD_TITLE.forms
  return CARD_TITLE.counts
}

/** The control a problem focuses: levels are inline on this page; questions, fields and named questions still open from their button. */
export function cardFieldOf(i: RuleIssue): string {
  if (/^cfg-(add-level|level-)/.test(i.field)) return i.field
  return fieldOfIssue(i)
}

export { uniqueByField }

/** Where a card's values come from, on its header's right edge: Default plain and muted (D-L97: plain Default), Custom a badge. */
function Source({ word }: { word: Configuration }) {
  if (word === "not-configured") return null
  if (word === "default") return <span className={TYPE.meta} data-card-word="default">{CONFIGURATION_META.default.label}</span>
  const m = CONFIGURATION_META.edited
  return <span data-card-word="custom"><StatusBadge label={m.label} tone={m.tone} icon={m.icon} size="sm" /></span>
}

/** The rule this skill's settings add up to, live, in the same quiet surface as Evaluation settings [REQ SC-17]. */
function RuleLead({ rule }: { rule: LabRule }) {
  const said = SkillRuleSentence({ rule, className: TYPE.card })
  return (
    <section aria-label={`Rule for this ${skillNoun()}`} className="flex flex-col gap-1 rounded-[var(--radius)] bg-muted px-4 py-3" data-settings-glance>
      <p className={TYPE.meta}>{`Rule for this ${skillNoun()}`}</p>
      {said ?? <p className={TYPE.body}>Finish the settings below to see the rule here</p>}
    </section>
  )
}

export interface SkillCardsProps {
  rule: LabRule
  setRule: SectionProps["setRule"]
  issues: RuleIssue[]
  showErrors: boolean
  settings: string[]
  /** Default reads the program's values in place; Custom makes every row a control. */
  custom: boolean
  /** Default, Custom or Not configured: what each card's header says. */
  word: Configuration
  /** The panel's own model change [REQ SC-09]: no question first; the save dialog lists what is cleared. */
  rebuildFrom: { program: LabRule | null; saved: LabRule | null }
  /** No saved rule: the first model chosen. */
  firstModel: boolean
}

/** Times needed with its unit: the one number every skill keeps for itself [REQ SC-10]. */
function TimesNeeded({ rule, setRule, err }: { rule: LabRule; setRule: SectionProps["setRule"]; err: (f: string) => string | undefined }) {
  return <TimesNeededField rule={rule} setRule={setRule} error={err("cfg-need")} unit={rule.need === 1 ? "evaluation" : "evaluations"} />
}

/** The rows the model decides, as Evaluation settings B has them; questions keep their count and Edit questions on a skill [REQ SC-03 to SC-08]. */
function ModelRows({ rule, setRule, issues, showErrors, err }: Pick<SkillCardsProps, "rule" | "setRule" | "issues" | "showErrors"> & { err: (f: string) => string | undefined }) {
  const qErr = showErrors ? issues.find((i) => /^cfg-(add-question|question-)/.test(i.field))?.message : undefined
  if (rule.model === "binary") {
    return (
      <>
        <SettingRow label="Labels" below={<BinaryLabelsField fill rule={rule} setRule={setRule} err={err} first="First label" second="Second label" />} />
        <SettingRow label="Which one qualifies" below={<QualifyingField rule={rule} setRule={setRule} err={err} legend="Which one qualifies" legendHidden first="First label" second="Second label" />} />
      </>
    )
  }
  if (rule.model === "demonstration") return <SettingRow label="Levels" below={<LevelList rule={rule} setRule={setRule} err={err} />} />
  const questions = <SettingRow label="Questions" below={<QuestionsRow rule={rule} setRule={setRule} error={qErr} />} />
  if (rule.model === "question") {
    return (
      <>
        {questions}
        <SettingRow label={movesWhen()} below={<QuestionRuleField rule={rule} setRule={setRule} err={err} legendHidden subsetSlot={<SubsetRow rule={rule} setRule={setRule} error={err("cfg-qrule-subset")} />} />} />
      </>
    )
  }
  if (rule.model === "scored") {
    return (
      <>
        {questions}
        <SettingRow label="Scale" below={<ScaleField short rule={rule} setRule={setRule} issues={issues} showErrors={showErrors} />} />
        <SettingRow label={movesWhen()} below={<ScoredRuleField rule={rule} setRule={setRule} err={err} radios legendHidden />} />
      </>
    )
  }
  return null
}

export function SkillCards(p: SkillCardsProps) {
  const { rule, setRule, issues, showErrors, settings, custom, word } = p
  const err = (f: string) => (showErrors ? issues.find((i) => i.field === f)?.message : undefined)
  const props: SectionProps = { rule, setRule, issues, showErrors, settings, legendHidden: true }
  const read = new Map(packageReadOut(rule).map((r) => [r.label, r.value]))
  const qErr = showErrors ? issues.find((i) => /^cfg-(add-question|question-)/.test(i.field))?.message : undefined
  const usesQ = rule.model === "question" || rule.model === "scored"
  const grant = custom && rule.model ? checkOffGrantSelect(rule, setRule) : null
  const source = <Source word={word} />
  const steps: PathStep[] = [
    { id: "path-log", label: `Student logs the ${skillNoun()}`, fixed: true },
    custom
      ? { id: "cfg-self", label: "Student rates themselves first", help: "Before the evaluator sees it", checked: rule.selfEvaluation, onChange: (v) => setRule((r) => ({ ...r, selfEvaluation: v })) }
      : { id: "cfg-self", label: "Student rates themselves first", help: "Before the evaluator sees it", checked: rule.selfEvaluation, readOnly: true },
    { id: "path-sign", label: "Evaluator signs off", fixed: true },
    custom
      ? { id: "cfg-approval", label: "Approval before it counts", help: "An admin approves each evaluation", checked: rule.approvalRequired, onChange: (v) => setRule((r) => ({ ...r, approvalRequired: v })) }
      : { id: "cfg-approval", label: "Approval before it counts", help: "An admin approves each evaluation", checked: rule.approvalRequired, readOnly: true },
    { id: "path-counts", label: "Counted", fixed: true },
  ]

  // Default: the program's values in place, the skill's own rows live, on one label column.
  if (!custom) {
    const modelValues = packageReadOut(rule).filter((r) => !["Judged by", "Student fills in", "Student rates first", "Who signs off", "Feedback", "Group check-off", "Approval"].includes(r.label))
    return (
      <div className="@container flex min-w-0 flex-col gap-6" data-skill-cards data-layout="cards">
        <SettingsCard id="cfg-sec-counts" title={CARD_TITLE.counts} action={source} lead={<RuleLead rule={rule} />}>
          <div className="flex flex-col divide-y divide-border" data-package-readout>
            <ValueRow label="Judged by" value={read.get("Judged by")} />
            {modelValues.map((r) => <ValueRow key={r.label} label={r.label} value={r.value} />)}
            <ValueRow label="Who can sign off" value={read.get("Who signs off")} />
          </div>
          {/* What a skill always keeps for itself, said once over the rows it covers, so the card's Default never hides that these differ from skill to skill [map D0 rule 5]. */}
          <div className="flex flex-col" role="group" aria-labelledby="cfg-own-title" data-own-rows>
            <p id="cfg-own-title" className={cn(TYPE.group, "pt-4")}>{OWN}</p>
            <div className="flex flex-col divide-y divide-border">
            {usesQ ? <FieldRow label="Questions"><QuestionsRow rule={rule} setRule={setRule} error={qErr} /></FieldRow> : null}
            {rule.model === "question" && rule.questionRule?.kind === "subset" ? <FieldRow label="Questions that must be Yes"><SubsetRow rule={rule} setRule={setRule} error={err("cfg-qrule-subset")} /></FieldRow> : null}
            <FieldRow label="Times needed" htmlFor="cfg-need"><TimesNeeded rule={rule} setRule={setRule} err={err} /></FieldRow>
            <FieldRow label="Minimums"><MinimumsField rule={rule} setRule={setRule} issues={issues} showErrors={showErrors} settings={settings} /></FieldRow>
            </div>
          </div>
        </SettingsCard>
        <SettingsCard id="cfg-sec-steps" title={CARD_TITLE.steps} action={source}>
          <PathSteps label="From a log to counted" steps={steps} />
        </SettingsCard>
        <SettingsCard id="cfg-sec-forms" title={CARD_TITLE.forms} action={source}>
          <div className="flex flex-col divide-y divide-border" data-package-readout>
            <ValueRow label={STUDENT_FIELDS_LABEL} value={read.get("Student fills in")} />
            <ValueRow label="Feedback" value={read.get("Feedback")} />
            <ValueRow label="Group check-off" value={read.get("Group check-off")} />
          </div>
        </SettingsCard>
      </div>
    )
  }

  // Custom, or a skill with no program settings: every row is the control Evaluation settings uses.
  return (
    <div className="@container flex min-w-0 flex-col gap-6" data-skill-cards data-layout="cards">
      {/* Before a model is chosen the card holds only the choice, and says so in its title [REQ SC-02]. */}
      <SettingsCard id="cfg-sec-counts" title={rule.model ? CARD_TITLE.counts : judgedTitle()} action={rule.model ? source : null} lead={rule.model ? <RuleLead rule={rule} /> : undefined}>
        {/* One tree with or without a model, so a tile choice never remounts the tiles and the keyboard keeps its place. */}
        <SettingRow
          label={rule.model ? judgedTitle() : ""}
          below={
            <ModelSection
              {...props}
              row
              examples={tileExamples(rule)}
              legend={judgedTitle()}
              rebuild={(r, m) => rebuildForModel(r, m, p.rebuildFrom.program, p.rebuildFrom.saved)}
              // No saved rule: group check-off starts off as soon as there is a model, never the model's default [REQ SC-02].
              onChosen={() => { if (p.firstModel) setRule(withCheckOffDecided) }}
            />
          }
        />
        {rule.model ? (
          <>
            <ModelRows rule={rule} setRule={setRule} issues={issues} showErrors={showErrors} err={err} />
            <SettingRow label="Times needed" htmlFor="cfg-need" below={<TimesNeeded rule={rule} setRule={setRule} err={err} />} />
            <SettingRow label="Minimums" below={<MinimumsField rule={rule} setRule={setRule} issues={issues} showErrors={showErrors} settings={settings} />} />
            <SettingRow label="Who can sign off" below={<SignersField {...props} compact />} />
          </>
        ) : null}
      </SettingsCard>
      {rule.model ? (
        <>
          <SettingsCard id="cfg-sec-steps" title={CARD_TITLE.steps} action={source}>
            <PathSteps label="From a log to counted" steps={steps} />
          </SettingsCard>
          <SettingsCard id="cfg-sec-forms" title={CARD_TITLE.forms} action={source}>
            <div className="py-4" data-settings-row><StudentAddsRow {...props} heading={STUDENT_FIELDS_LABEL} title={STUDENT_FIELDS_LABEL} error={showErrors ? issues.find((i) => i.field.startsWith("cfg-field-"))?.message : undefined} /></div>
            <SwitchSetting id="cfg-feedback" label="Feedback is required" checked={rule.feedbackRequired} onChange={(v) => setRule((r) => ({ ...r, feedbackRequired: v }))} />
            <div data-section="checkoff">
              <SwitchSetting
                id="cfg-checkoff"
                label={CHECKOFF_SWITCH_LABEL}
                checked={ruleAllowsCheckOff(rule)}
                onChange={(v) => setRule((r) => withCheckOffPatch(r, { enabled: v }))}
                below={grant ? (
                  <div className="flex flex-col gap-2 rounded-[var(--radius)] bg-muted px-4 py-3">
                    <div className="flex flex-col gap-2 @xl:flex-row @xl:items-center @xl:justify-between">
                      <Label htmlFor={grant.id} className={cn(TYPE.body, "font-normal")}>{CHECKOFF_GRANT_LABEL}</Label>
                      {grant.control}
                    </div>
                    <CheckOffGrantNote rule={rule} id={grant.id} />
                  </div>
                ) : undefined}
              />
            </div>
          </SettingsCard>
        </>
      ) : null}
    </div>
  )
}
