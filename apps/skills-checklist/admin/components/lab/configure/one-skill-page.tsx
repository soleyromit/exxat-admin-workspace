"use client"

/**
 * Configure one skill (map D1c, D-L115; route /lab/admin/configure-skill?skill=): how one skill is evaluated, beside what the student and evaluator will see. Density is the acceptance test (task CFG1).
 * Default reads the program's package aloud with the skill's own part live; Custom is one section open at a time. Save and Cancel appear only after a change. A save lands in the Library, same filters and scroll,
 * with the panel open on the skill. Writes through saveSkillSettings, the one writer of a skill's settings. Nothing is ever preselected [REQ SC-02].
 * URL: ?skill=, ?state=loading. Listens for `lab:reset`.
 */
import * as React from "react"
import NextLink from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import { LocalBanner } from "@exxatdesignux/ui/components/ui/banner"
import { PAGE_TITLE_TYPE_CLASS } from "@exxatdesignux/ui/components/ui/page-header"
import { Skeleton } from "@exxatdesignux/ui/components/ui/skeleton"
import { StatusBadge } from "@exxatdesignux/ui/components/ui/status-badge"
import { ViewSegmentedControl } from "@exxatdesignux/ui/components/ui/view-segmented-control"
import { cn } from "@exxatdesignux/ui/lib/utils"
import { PageFrame } from "@/components/skills/page-header"
import { LabLink as Link } from "@/components/lab/lab-bar/lab-link"
import { UnsavedChangesGuard } from "@/components/lab/shared/unsaved-guard"
import { ImpactDialog } from "@/components/lab/library/times-needed"
import { TYPE } from "@/components/lab/type-scale"
import { withCheckOffDecided, type LabRule, type RuleIssue } from "@/lib/lab/configure"
import { markReturn, publishShownSkill } from "@/lib/lab/configure-origin"
import { CONFIGURATION_META, LAB_ADMIN, STATUS_META } from "@/lib/lab/library"
import { configurationOf, defaultDraftOf, draftConfiguration, draftEdited, modelChangeClears, panelIssues, panelRuleOf, programSettingsOf, ruleNeedsQuestions, saveSkillSettings, settingsImpact, statusOf } from "@/lib/lab/program-settings"
import { skillNoun, skillNounPlural } from "@/lib/lab/terms"
import { skillById } from "@/lib/v2/evidence-index"
import { useV2Hydrated, useV2State, useV2Store } from "@/lib/v2/react"
import { DEMO_TODAY, IDS } from "@/lib/v2/seed-core"
import type { Skill, V2State } from "@/lib/v2/types"
import { IssueSummary } from "./issue-summary"
import { MinimumsField } from "./rule-conditions"
import { PreviewDialog, SkillPreviewPanel, SkillRuleSentence } from "./settings-dialogs"
import { Row, useWide } from "./settings-rows"
import { ConfigureSections, fieldOfIssue, uniqueByField, packageReadOut, QuestionsRow, SECTION_TITLE, sectionOfIssue, SubsetRow, TimesNeededField, type SkillSection } from "./skill-sections"
import { ConfigureNotFound, useWayBack } from "./shell"
import { focusField } from "./use-configure"

type Choice = "default" | "custom"

/** The same rule whatever order its keys were built in, so going back to where the form started is not a change. */
const ruleKey = (r: LabRule): string => JSON.stringify(Object.keys(r).sort().map((k) => [k, r[k as keyof LabRule]]))

/** Always per skill (D0 rule 5): what a switch between Default and Custom carries across. */
function withOwnPart(target: LabRule, from: LabRule): LabRule {
  const sameModel = target.model === from.model
  return {
    ...target,
    need: from.need,
    settingMinimums: from.settingMinimums,
    distinctEvaluators: from.distinctEvaluators,
    ...(sameModel ? { levelMinimums: from.levelMinimums, questions: from.questions, ...(from.questionRule?.kind === "subset" && target.questionRule?.kind === "subset" ? { questionRule: from.questionRule } : {}) } : {}),
  }
}

/** The read-out's two columns, one label column with the form above it. A documented hand-roll: the DS has no label and value list. */
function ReadOut({ rule }: { rule: LabRule }) {
  return (
    <dl className="grid grid-cols-1 gap-x-3 gap-y-1.5 py-3 text-sm @min-[32rem]:grid-cols-[10.5rem_minmax(0,1fr)]" data-package-readout>
      {packageReadOut(rule).map((r) => (
        <React.Fragment key={r.label}>
          <dt className="text-muted-foreground">{r.label}</dt>
          <dd className="min-w-0 text-foreground max-[32rem]:mb-1" data-readout={r.label}>{r.value}</dd>
        </React.Fragment>
      ))}
    </dl>
  )
}

function Group({ title, id, children }: { title: React.ReactNode; id: string; children: React.ReactNode }) {
  return (
    <section className="flex min-w-0 flex-col" aria-labelledby={id} data-settings-section>
      <h2 id={id} className={cn(TYPE.group, "border-b border-border pb-2")}>{title}</h2>
      {children}
    </section>
  )
}

function SkillTitle({ state, skill }: { state: V2State; skill: Skill }) {
  const configuration = configurationOf(state, skill)
  const inactive = statusOf(skill) === "inactive"
  return (
    <span className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1" data-skill-title>
      <h1 className={cn(PAGE_TITLE_TYPE_CLASS, "min-w-0 [overflow-wrap:anywhere]")}>{skill.name}</h1>
      {configuration === "not-configured" ? <StatusBadge label={CONFIGURATION_META["not-configured"].label} tone={CONFIGURATION_META["not-configured"].tone} icon={CONFIGURATION_META["not-configured"].icon} size="sm" /> : null}
      {inactive ? <StatusBadge label={STATUS_META.inactive.label} tone={STATUS_META.inactive.tone} icon={STATUS_META.inactive.icon} size="sm" /> : null}
    </span>
  )
}

function OneSkillForm({ state, skill, settingsHref }: { state: V2State; skill: Skill; settingsHref: string }) {
  const store = useV2Store()
  // The way back is the address the admin left, as it was written, so a lab option set cannot move it into a flow.
  const router = useRouter()
  const wide = useWide()
  const back = useWayBack(skill.id)
  const program = programSettingsOf(state)?.rule ?? null
  // The baseline is what the page opened on: a save leaves the page.
  const [baseRule] = React.useState<LabRule>(() => panelRuleOf(skill))
  const baseKey = React.useMemo(() => ruleKey(baseRule), [baseRule])
  const baseEdited = !!skill.edited
  const [rule, setRuleState] = React.useState<LabRule>(baseRule)
  const setRule = React.useCallback((fn: (r: LabRule) => LabRule) => setRuleState(fn), [])
  // With no program settings there is nothing to default to: what the page holds is the skill's own.
  const [custom, setCustom] = React.useState(baseEdited || !program)
  const [keptCustom, setKeptCustom] = React.useState<LabRule | null>(null)
  const [open, setOpen] = React.useState<SkillSection | "">(baseRule.model ? "counts" : "judged")
  const [showErrors, setShowErrors] = React.useState(false)
  const [ask, setAsk] = React.useState<{ students: Array<{ id: string; name: string }>; cleared: string[] } | null>(null)
  const [failed, setFailed] = React.useState(false)

  const reset = !custom && baseEdited
  const word = draftConfiguration({ rule, baseEdited, baseRule, program, reset, custom })
  const dirty = ruleKey(rule) !== baseKey || (custom !== (baseEdited || !program) && (!custom || !!rule.model))
  // Custom edits held aside while Default is chosen: not what Save would write, but still work a door must not drop without asking.
  const heldDraft = !custom && !!keptCustom && ruleKey(withOwnPart(keptCustom, baseRule)) !== baseKey
  const issues = React.useMemo(() => (dirty ? panelIssues(rule) : []), [dirty, rule])
  const needsQ = ruleNeedsQuestions(rule)
  const noProgram = !program

  React.useEffect(() => {
    publishShownSkill({ id: skill.id, name: skill.name })
    return () => publishShownSkill(null)
  }, [skill.id, skill.name])

  const discard = React.useCallback(() => {
    setRuleState(baseRule)
    setCustom(baseEdited || !program)
    setKeptCustom(null)
    setShowErrors(false)
    setFailed(false)
    setOpen(baseRule.model ? "counts" : "judged")
  }, [baseRule, baseEdited, program])
  React.useEffect(() => {
    window.addEventListener("lab:reset", discard)
    return () => window.removeEventListener("lab:reset", discard)
  }, [discard])

  const choose = (c: Choice) => {
    if ((c === "custom") === custom) return
    setShowErrors(false)
    if (c === "default") {
      setKeptCustom(rule)
      setCustom(false)
      setRuleState((r) => (baseEdited && program ? defaultDraftOf(r, program) : withOwnPart(baseRule, r)))
      return
    }
    setCustom(true)
    setRuleState((r) => (keptCustom ? withOwnPart(keptCustom, r) : baseEdited ? withOwnPart(baseRule, r) : r))
    setOpen("counts")
  }

  const go = (i: RuleIssue) => {
    if (custom) setOpen(sectionOfIssue(i))
    // Open the section first: its fields are not in the page while it is closed. A package value is not on the page under Default: its fix is the skill's own minimums.
    window.setTimeout(() => {
      const id = fieldOfIssue(i)
      focusField(document.getElementById(id) || document.querySelector(`[id^="${id}-"]`) ? id : "cfg-add-minimum")
    }, 60)
  }

  const land = () => {
    // The Library always (map D1c), at the filters, search and scroll the admin left. An address written from the page's flow already holds the flow: no second rewrite.
    markReturn({ scrollTop: back.fromLibrary ? back.origin!.scrollTop : 0, focusConfigure: skill.id, search: back.fromLibrary ? back.origin!.search : "" })
    router.push(back.landHref({ skill: skill.id, saved: "1" }))
  }

  const apply = () => {
    const at = `${DEMO_TODAY}T${new Date().toISOString().slice(11, 19)}Z`
    let ok = false
    try {
      store.update((s) => {
        const r = saveSkillSettings(s, skill.id, rule, { at, byId: IDS.ross, edited: draftEdited({ rule, baseEdited, baseRule, program, reset, custom }) })
        ok = r.ok
        return r.ok ? r.state : s
      })
    } catch {
      ok = false
    }
    setFailed(!ok)
    if (ok) land()
  }

  const save = () => {
    setFailed(false)
    if (issues.length) {
      setShowErrors(true)
      go(issues[0]!)
      return
    }
    setShowErrors(false)
    const students = settingsImpact(state, skill, rule)
    const cleared = modelChangeClears(baseRule.model, rule.model)
    if (students.length || cleared.length) { setAsk({ students, cleared }); return }
    apply()
  }

  const cancelHref = back.cancelHref(back.origin ? {} : { skill: skill.id })
  const err = (f: string) => (showErrors ? issues.find((i) => i.field === f)?.message : undefined)
  const usesQ = rule.model === "question" || rule.model === "scored"
  const sentenceBelow = wide ? null : <SkillRuleSentence rule={rule} />
  const showPreviewButton = !wide && !!rule.model && !needsQ

  const actions = (
    <span className="flex flex-wrap items-center justify-end gap-2 max-sm:max-w-36">
      {showPreviewButton ? <PreviewDialog name={skill.name} id={skill.id} rule={rule} /> : null}
      {dirty ? (
        <>
          <Button asChild variant="outline" size="sm"><NextLink href={cancelHref} data-configure-cancel={skill.id}>Cancel</NextLink></Button>
          <Button type="button" variant="default" size="sm" onClick={save}>Save changes</Button>
        </>
      ) : null}
    </span>
  )

  const notConfiguredA = noProgram && !baseEdited
  return (
    <div className="flex w-full flex-col" data-page-type="form" data-configure-page data-configure-word={word}>
      <PageFrame title={<SkillTitle state={state} skill={skill} />} className="flex-1" actions={actions}>
        {failed ? <div data-save-failed><LocalBanner variant="error" retry={{ label: "Try again", onClick: apply }}>{`${skill.name} was not saved.`}</LocalBanner></div> : null}
        <div className={cn("grid min-w-0 gap-8", wide && "grid-cols-[minmax(0,3fr)_minmax(0,2fr)] items-start min-[1600px]:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]")} data-settings-columns>
          <div className="@container flex min-w-0 flex-col gap-4" data-configure-form>
            {showErrors && issues.length ? (
              <div className="sticky top-0 z-30 -mx-1 max-h-[40dvh] overflow-y-auto border-b border-border bg-background px-1 pb-3 outline-none focus-visible:ring-2 focus-visible:ring-ring" data-problems-sticky tabIndex={0} aria-label="Problems to fix">
                <IssueSummary id="cfg-page-issues" issues={uniqueByField(issues)} autoFocus={false} labelOf={(i) => (custom ? SECTION_TITLE[sectionOfIssue(i)]() : `For this ${skillNoun()}`)} onGo={go} />
              </div>
            ) : null}
            {noProgram ? null : (
              <div className="flex flex-wrap items-center justify-between gap-2" data-evaluation-switch>
                <span className={TYPE.label} id="cfg-evaluation-settings-label">Evaluation settings</span>
                <ViewSegmentedControl<Choice>
                  aria-label="Evaluation settings"
                  value={custom ? "custom" : "default"}
                  onValueChange={choose}
                  options={[{ value: "default", label: CONFIGURATION_META.default.label }, { value: "custom", label: CONFIGURATION_META.edited.label }]}
                />
              </div>
            )}
            {notConfiguredA ? (
              <div className="flex flex-wrap items-center justify-between gap-3" data-no-program>
                <p className={TYPE.body}>{`Your program has not set how ${skillNounPlural()} are judged.`}</p>
                <Button asChild variant={rule.model ? "outline" : "default"} size="sm"><Link href={settingsHref}>{`Set how ${skillNounPlural()} are judged`}</Link></Button>
              </div>
            ) : null}
            {custom ? (
              <ConfigureSections
                rule={rule}
                setRule={setRule}
                issues={issues}
                showErrors={showErrors}
                settings={state.program.clinicalSettings}
                open={open}
                onOpen={setOpen}
                onlyJudged={!rule.model}
                rebuildFrom={{ program, saved: skill.model ? baseRule : null }}
                // No saved rule: group check-off starts off as soon as there is a model, never the model's default [REQ SC-02].
                onModelChosen={() => { if (!baseRule.model) setRuleState(withCheckOffDecided) }}
                sentence={sentenceBelow}
              />
            ) : (
              <>
                <Group title={`For this ${skillNoun()}`} id="cfg-for-this-skill">
                  <div className="flex flex-col divide-y divide-border">
                    <Row label="Times needed" htmlFor="cfg-need" stacked className="py-2"><TimesNeededField rule={rule} setRule={setRule} error={err("cfg-need")} /></Row>
                    {usesQ ? <Row label="Questions" stacked className="py-2"><QuestionsRow rule={rule} setRule={setRule} error={showErrors ? issues.find((i) => /^cfg-(add-question|question-)/.test(i.field))?.message : undefined} /></Row> : null}
                    {rule.model === "question" && rule.questionRule?.kind === "subset" ? <Row label="Questions that must be Yes" stacked className="py-2"><SubsetRow rule={rule} setRule={setRule} error={err("cfg-qrule-subset")} /></Row> : null}
                    <Row label="Minimums" stacked className="py-2"><MinimumsField rule={rule} setRule={setRule} issues={issues} showErrors={showErrors} settings={state.program.clinicalSettings} /></Row>
                    {sentenceBelow ? <div className="py-3">{sentenceBelow}</div> : null}
                  </div>
                </Group>
                <Group title={<Link href={settingsHref} className="underline underline-offset-2 hover:text-[var(--brand-color)]" data-from-settings>From Evaluation settings</Link>} id="cfg-from-settings">
                  <ReadOut rule={rule} />
                </Group>
              </>
            )}
          </div>
          {wide ? <SkillPreviewPanel id={skill.id} name={skill.name} rule={rule} /> : null}
        </div>
      </PageFrame>
      <UnsavedChangesGuard dirty={dirty || heldDraft} onDiscard={discard} keepRecord />
      <ImpactDialog
        open={!!ask}
        listed
        title={`Save changes to ${skill.name}?`}
        students={ask?.students ?? []}
        cleared={ask?.cleared ?? []}
        onCancel={() => setAsk(null)}
        onConfirm={() => { setAsk(null); apply() }}
      />
    </div>
  )
}

export function ConfigureOneSkillPage({ skillId }: { skillId: string }) {
  const state = useV2State()
  const hydrated = useV2Hydrated()
  const params = useSearchParams()
  const scope = params?.get("program")
  const settingsHref = `${LAB_ADMIN}/evaluation-settings${scope ? `?program=${scope}` : ""}`
  if (!hydrated || params?.get("state") === "loading") {
    return (
      <div aria-busy="true" data-page-type="form">
        <PageFrame title={<Skeleton className="h-7 w-64" aria-label="Loading" />}>
          <Skeleton className="h-96 w-full" />
        </PageFrame>
      </div>
    )
  }
  const skill = skillById(state, skillId)
  if (!skill) return <ConfigureNotFound skillId={skillId} />
  // Keyed: moving to another skill starts the form again.
  return <OneSkillForm key={skill.id} state={state} skill={skill} settingsHref={settingsHref} />
}
