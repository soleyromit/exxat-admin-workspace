"use client"

import * as React from "react"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import { LocalBanner } from "@exxatdesignux/ui/components/ui/banner"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@exxatdesignux/ui/components/ui/dialog"
import { Skeleton } from "@exxatdesignux/ui/components/ui/skeleton"
import { Wizard, WizardNav, WizardPanel, WizardStepHeading } from "@exxatdesignux/ui/components/ui/wizard"
import * as C from "@/lib/copy"
import { r2c, stepOfSection, type WizardStep } from "@/lib/copy/r2-configure"
import type { Id, Skill } from "@/lib/domain/types"
import { isConfigured, type Dropped, type ModelKind } from "@/lib/engine"
import { changeModelKind, patchUnconfiguredSkillSettings, previewDraftImpact, saveSkillConfig, setSkillActive, skillHasEvidence, updateSkillDefinition, validateDraft } from "@/lib/store"
import { useActions, useDb, usePrefs } from "@/lib/store/react"
import { ApplyConfigDialog, applyResultText } from "./apply-config-dialog"
import { CopyConfigDialog, type CopyResult } from "./copy-config-dialog"
import { ConfigureProvider, type ConfigureCtx } from "./context"
import { CriteriaSection } from "./criteria-section"
import { DefinitionSection } from "./definition-section"
import { droppedText, ImpactDialog, UnsavedDialog } from "./dialogs"
import { draftFromSkill, draftSkill, isDirty, ruleChanged, withStarterDefaults, type FormDraft } from "./draft"
import { CommentSection, RolesSection, WorkflowSection } from "./evaluator-section"
import { FormPreview } from "./form-preview"
import { describeIssues, type FormIssue, type SectionKey } from "./issues"
import { LineagePanel } from "./lineage-panel"
import { ModelSection } from "./model-section"
import { StudentSection } from "./student-section"
import { ValidationSummary } from "./validation-summary"

const w = r2c.wizard
const STEP_IDS = ["definition", "evaluation", "criteria"] as const

/** First control of a model's editor: where focus goes after a model is picked or changed. */
const FIRST_FIELD: Record<ModelKind, string> = { binary: "cfg-label-a", question: "cfg-add-question", scored: "cfg-add-question", demonstration: "cfg-add-level" }

/** What the host needs after a save: the banner text and the next unconfigured skill (the S-04 "Configure next" action). */
export interface WizardSaved {
  skillId: Id
  name: string
  configured: boolean
  nextUnconfiguredId: Id | null
}

export interface ConfigureWizardDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** The skill being configured. Always an existing skill: "Add skill" creates it first (Add skill dialog), as the prototype does. */
  skillId: Id | null
  initialStep?: WizardStep
  onSaved?: (saved: WizardSaved) => void
}

/** The prototype's configure experience (P-08): a 1024px dialog with three steps. Unmounts when closed, so every open starts clean. */
export function ConfigureWizardDialog(props: ConfigureWizardDialogProps) {
  if (!props.open) return null
  return <WizardLoader {...props} />
}

function WizardLoader(props: ConfigureWizardDialogProps) {
  const db = useDb()
  const [ready, setReady] = React.useState(false)
  React.useEffect(() => setReady(true), [])
  const skill = props.skillId ? db.skills.find((x) => x.id === props.skillId) ?? null : null
  if (!ready) {
    return (
      <Dialog open onOpenChange={props.onOpenChange}>
        <DialogContent className="sm:max-w-5xl" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>Edit skill</DialogTitle>
            <DialogDescription>Loading the skill</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4" aria-busy="true" aria-label="Loading the skill">
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-40 w-full" />
          </div>
        </DialogContent>
      </Dialog>
    )
  }
  if (!skill) {
    return (
      <Dialog open onOpenChange={props.onOpenChange}>
        <DialogContent className="sm:max-w-2xl" showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Skill not found</DialogTitle>
            <DialogDescription>{w.notFound}</DialogDescription>
          </DialogHeader>
          <LocalBanner variant="error">The skill you opened could not be found.</LocalBanner>
          <div className="flex justify-end">
            <Button type="button" variant="outline" size="default" onClick={() => props.onOpenChange(false)}>
              {w.close}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    )
  }
  return <WizardEditor key={skill.id} {...props} skill={skill} />
}

interface Banner {
  kind: "success" | "info" | "error"
  text: string
}

function WizardEditor({ skill, open, onOpenChange, initialStep, onSaved }: ConfigureWizardDialogProps & { skill: Skill }) {
  const db = useDb()
  const { skillStatusDisplay: display } = usePrefs()
  const { run } = useActions()
  const skillId = skill.id

  const [step, setStep] = React.useState<WizardStep>(initialStep ?? 1)
  const [draft, setDraft] = React.useState<FormDraft>(() => withStarterDefaults(draftFromSkill(skill), db.roles.map((r) => r.id)))
  const [initial] = React.useState<FormDraft>(draft)
  const [submitted, setSubmitted] = React.useState(0)
  const [touched, setTouched] = React.useState<Set<SectionKey>>(new Set())
  const [banner, setBanner] = React.useState<Banner | null>(null)
  const [extra, setExtra] = React.useState<FormIssue[]>([])
  const [announceText, setAnnounce] = React.useState("")
  const [removal, setRemoval] = React.useState<ConfigureCtx["removal"]>(null)
  const [impact, setImpact] = React.useState(false)
  const [leave, setLeave] = React.useState(false)
  const [focusReq, setFocusReq] = React.useState<{ id: string; n: number } | null>(null)
  const [copyOpen, setCopyOpen] = React.useState(false)
  const [applyOpen, setApplyOpen] = React.useState(false)

  const evidenceCount = db.submissions.filter((x) => x.skillId === skillId && db.evaluations.some((e) => e.submissionId === x.id)).length
  const hasEvidence = skillHasEvidence(db, skillId)
  const dirty = isDirty(draft, initial)

  // ---- unsaved-changes guard for closing the tab (the dialog's own close paths use the dialog below)
  React.useEffect(() => {
    if (!dirty) return undefined
    const h = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = ""
    }
    window.addEventListener("beforeunload", h)
    return () => window.removeEventListener("beforeunload", h)
  }, [dirty])

  // ---- focus requests (first error, first field of a new model, the step heading after Continue)
  React.useEffect(() => {
    if (!focusReq) return
    const el = document.getElementById(focusReq.id) ?? document.getElementById("cfg-summary")
    el?.focus()
    if (el) el.scrollIntoView?.({ block: "nearest" })
  }, [focusReq])
  const requestFocus = (id: string) => setFocusReq((p) => ({ id, n: (p?.n ?? 0) + 1 }))

  // ---- validation (pure; the engine and the store own the rules)
  const validation = React.useMemo(() => validateDraft(db, skillId, draft.cfg), [db, skillId, draft.cfg])
  const all = React.useMemo(
    () => [...describeIssues(validation, { cfg: draft.cfg, roles: db.roles, settings: db.clinicalSettings, name: draft.def.name, roleEvidenceMap: db.roleEvidenceMap }), ...extra],
    [validation, draft.cfg, draft.def.name, db.roles, db.clinicalSettings, db.roleEvidenceMap, extra],
  )
  const hasModel = draft.cfg.model !== null
  // A missing model alone is not a save error (SC-01), but it does stop the wizard from leaving step 2.
  const blocking = all.filter((i) => i.severity === "error" && i.code !== "noModel")
  const showAll = submitted > 0
  const stepIssues = (n: WizardStep) => blocking.filter((i) => stepOfSection(i.section) === n)
  const canContinue = (n: WizardStep): boolean => (n === 1 ? draft.def.name.trim().length > 0 && stepIssues(1).length === 0 : n === 2 ? hasModel && stepIssues(2).length === 0 : true)

  const visible: ConfigureCtx["visible"] = (match) => {
    const test = typeof match === "string" ? (p: string) => p === match : match
    return all.filter((i) => i.severity === "error" && i.code !== "noModel" && test(i.path) && (showAll || touched.has(i.section)))
  }
  const warnings: ConfigureCtx["warnings"] = (prefix) => all.filter((i) => i.severity === "warning" && i.path.startsWith(prefix))

  const ctx: ConfigureCtx = {
    db,
    skillId,
    def: draft.def,
    cfg: draft.cfg,
    setDef: (fn) => setDraft((d) => ({ ...d, def: fn(d.def) })),
    setCfg: (fn) => setDraft((d) => ({ ...d, cfg: fn(d.cfg) })),
    hasModel,
    visible,
    warnings,
    touch: (sec) => setTouched((t) => (t.has(sec) ? t : new Set(t).add(sec))),
    announce: setAnnounce,
    removal,
    setRemoval,
    evidenceCount,
  }

  // ---- model change: the prototype swaps immediately (no confirm); the rebuild is reported inline in the step (conflict C-15, SC-09)
  const applyModel = (kind: ModelKind, moveFocus = true) => {
    const r = changeModelKind(db, skillId, draft.cfg, kind)
    setDraft((d) => ({ ...d, cfg: r.draft }))
    setRemoval(null)
    if (r.dropped.length > 0) {
      setBanner({ kind: "info", text: `The evaluation model changed. Reset: ${r.dropped.map((x: Dropped) => droppedText(x)).join(", ")}.${hasEvidence ? " Existing evaluations are kept. How they count is recalculated when you save." : ""}` })
    } else setBanner(null)
    // Choosing with the arrow keys keeps focus on the radio group so the next arrow press moves to the next model (WAI-ARIA radio
    // pattern); a pointer choice moves focus to the first field of the new model.
    if (moveFocus) requestFocus(FIRST_FIELD[kind])
  }
  const pickModel = (kind: ModelKind, moveFocus = true) => {
    if (draft.cfg.model?.kind === kind) return
    applyModel(kind, moveFocus)
  }

  // ---- IM-14: copy into this form, apply this skill to others
  const hasCopySource = db.skills.some((x) => x.id !== skillId && isConfigured(x))
  const onCopy = (r: CopyResult) => {
    setDraft((d) => ({ ...d, cfg: r.draft }))
    setRemoval(null)
    setTouched(new Set())
    setBanner({ kind: "info", text: `${C.applyConfig.copyDone(r.sourceName, r.copied.questions, r.copied.levels)}${r.dropped.includes("settingMinimums") ? ` ${C.applyConfig.copyDropped}` : ""}` })
    setAnnounce(`Configuration copied from ${r.sourceName}.`)
  }

  // ---- navigation
  const goTo = (n: WizardStep) => {
    setStep(n)
    setBanner((b) => (b?.kind === "info" ? b : null))
  }
  const next = () => {
    if (!canContinue(step)) return
    setTouched((t) => new Set([...t, ...(step === 1 ? (["skill"] as SectionKey[]) : (["model", "rule", "student", "evaluator", "workflow"] as SectionKey[]))]))
    goTo((step + 1) as WizardStep)
  }
  const back = () => goTo((step - 1) as WizardStep)
  const jump = (target: string) => {
    const issue = all.find((i) => i.target === target)
    if (issue) setStep(stepOfSection(issue.section))
    requestFocus(target)
  }

  // ---- closing
  const requestClose = () => (dirty ? setLeave(true) : onOpenChange(false))

  // ---- save
  const nextUnconfigured = db.skills.find((x) => x.id !== skillId && !isConfigured(x))

  const failDefinition = (duplicate: boolean) => {
    setStep(1)
    if (duplicate) {
      setExtra([{ key: "dup-name", path: "name", section: "skill", message: "A skill with this name already exists. Choose a different name.", severity: "error", target: "cfg-name", code: "duplicate" }])
      requestFocus("cfg-name")
    } else setBanner({ kind: "error", text: "This skill was not saved. Try again." })
  }

  const commit = () => {
    setImpact(false)
    setExtra([])
    const { def, cfg } = draft
    const r = run((d) => updateSkillDefinition(d, skillId, { name: def.name, description: def.description, categoryId: def.categoryId, tagIds: def.tagIds }))
    if (!r.ok) return failDefinition(r.error.code === "duplicate")
    if (cfg.model) {
      const s = run((d) => saveSkillConfig(d, skillId, cfg))
      if (!s.ok) {
        setBanner({ kind: "error", text: "This skill was not saved. Try again." })
        return
      }
    } else {
      const s = run((d) => patchUnconfiguredSkillSettings(d, skillId, cfg))
      if (!s.ok) {
        setBanner({ kind: "error", text: "This skill was not saved. Try again." })
        return
      }
    }
    if (def.active !== skill.active) {
      const s = run((d) => setSkillActive(d, skillId, def.active))
      if (!s.ok) {
        setBanner({ kind: "error", text: s.error.message })
        return
      }
    }
    onSaved?.({ skillId, name: def.name.trim(), configured: !!cfg.model, nextUnconfiguredId: cfg.model && nextUnconfigured ? nextUnconfigured.id : null })
    onOpenChange(false)
  }

  const save = () => {
    setSubmitted((n) => n + 1)
    setBanner(null)
    if (blocking.length > 0) {
      const first = blocking[0]
      setStep(stepOfSection(first.section))
      requestFocus(first.target)
      return
    }
    // P-03 [INFER]: a rule change on a skill that already has evaluations is reviewed before it is saved.
    if (isConfigured(skill) && hasEvidence && ruleChanged(initial.cfg, draft.cfg)) {
      setImpact(true)
      return
    }
    commit()
  }

  const preview = impact ? previewDraftImpact(db, skillId, draft.cfg) : null
  const previewSkill = draftSkill(db, skillId, draft)
  const summaryIssues = showAll ? blocking : []
  const stepLabel = w.steps[step - 1]
  const blockedReason = step < 3 && !canContinue(step) ? w.continueBlocked[step] : null

  const wizardSteps = w.steps.map((label, i) => ({ id: STEP_IDS[i], label, error: showAll && stepIssues((i + 1) as WizardStep).length > 0 }))

  return (
    <ConfigureProvider value={ctx}>
      <Dialog open={open} onOpenChange={(o) => !o && requestClose()}>
        <DialogContent className="flex h-[min(760px,calc(100dvh-4rem))] flex-col gap-0 overflow-hidden p-0 sm:max-w-5xl" data-testid="configure-wizard" aria-describedby="wizard-subtitle">
          <DialogHeader className="shrink-0 border-b border-border p-4 pe-12">
            <DialogTitle className="text-base font-semibold">{w.title(skill.name)}</DialogTitle>
            <DialogDescription id="wizard-subtitle">{w.subtitle}</DialogDescription>
          </DialogHeader>

          <Wizard steps={wizardSteps} current={step - 1} linear onStepClick={(i) => goTo((i + 1) as WizardStep)} className="min-h-0 flex-1 gap-0">
            <div className="shrink-0 px-4 pb-1 pt-3">
              <WizardNav />
            </div>

            <div className={step === 1 ? "min-h-0 flex-1 overflow-y-auto p-4" : "grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[minmax(0,1fr)_20rem]"}>
              <div className={step === 1 ? "flex flex-col gap-4" : "flex min-h-0 flex-col gap-4 overflow-y-auto p-4"} data-testid="wizard-body">
                {banner ? (
                  <LocalBanner variant={banner.kind} dismissible onDismiss={() => setBanner(null)} retry={banner.kind === "error" ? { label: C.buttons.retry, onClick: save } : undefined}>
                    {banner.text}
                  </LocalBanner>
                ) : null}
                <ValidationSummary key={submitted} issues={summaryIssues} onJump={jump} />

                <WizardPanel step={0} className="flex flex-col gap-4">
                  <WizardStepHeading id="definition" className="sr-only">
                    {w.steps[0]}
                  </WizardStepHeading>
                  <DefinitionSection />
                </WizardPanel>

                <WizardPanel step={1} className="flex flex-col gap-4">
                  <WizardStepHeading id="evaluation" className="sr-only">
                    {w.steps[1]}
                  </WizardStepHeading>
                  <div className="flex flex-wrap items-center justify-end gap-2">
                    <Button type="button" variant="outline" size="sm" disabled={!hasCopySource} aria-describedby={!hasCopySource ? "copy-none" : undefined} onClick={() => setCopyOpen(true)}>
                      {C.applyConfig.copyButton}
                    </Button>
                  </div>
                  {!hasCopySource ? (
                    <p id="copy-none" className="text-xs text-muted-foreground">
                      {C.applyConfig.copyNoSource}
                    </p>
                  ) : null}
                  <ModelSection onPickModel={pickModel} />
                  {hasModel ? (
                    <>
                      <StudentSection />
                      <CommentSection />
                      <WorkflowSection />
                      <RolesSection />
                      <FormPreview cfg={draft.cfg} />
                    </>
                  ) : null}
                </WizardPanel>

                <WizardPanel step={2} className="flex flex-col gap-4">
                  <WizardStepHeading id="criteria" className="sr-only">
                    {w.steps[2]}
                  </WizardStepHeading>
                  <CriteriaSection />
                  {isConfigured(skill) ? (
                    <div className="flex flex-wrap items-center gap-2">
                      <Button type="button" variant="outline" size="sm" disabled={dirty} aria-describedby={dirty ? "apply-dirty" : undefined} onClick={() => setApplyOpen(true)}>
                        {C.applyConfig.applyFromHere}
                      </Button>
                      {dirty ? (
                        <span id="apply-dirty" className="text-xs text-muted-foreground">
                          {C.applyConfig.applySaveFirst}
                        </span>
                      ) : null}
                    </div>
                  ) : null}
                </WizardPanel>
              </div>

              {step > 1 ? (
                <aside aria-label="Configuration lineage" className="hidden min-h-0 overflow-y-auto border-s border-border p-4 lg:block">
                  <LineagePanel db={db} skill={previewSkill} display={display} onChanged={(labels) => setAnnounce(`Updated: ${labels.join(", ")}.`)} />
                </aside>
              ) : null}
            </div>
          </Wizard>

          <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-border p-4" data-slot="wizard-footer">
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground">{w.stepOf(step, stepLabel)}</span>
              {blockedReason ? (
                <span id="wizard-continue-reason" className="text-xs text-muted-foreground" data-testid="continue-reason">
                  {blockedReason}
                </span>
              ) : null}
              <span className="sr-only" data-testid="dirty-marker">
                {dirty ? "Unsaved changes" : "All changes saved"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button type="button" variant="outline" size="default" onClick={requestClose}>
                {w.cancel}
              </Button>
              {step > 1 ? (
                <Button type="button" variant="outline" size="default" onClick={back}>
                  <i className="fa-light fa-chevron-left" aria-hidden="true" />
                  {w.back}
                </Button>
              ) : null}
              {step < 3 ? (
                <Button type="button" variant="default" size="default" disabled={!canContinue(step)} aria-describedby={blockedReason ? "wizard-continue-reason" : undefined} onClick={next}>
                  {w.next}
                </Button>
              ) : (
                <Button type="button" variant="default" size="default" onClick={save}>
                  <i className="fa-light fa-check" aria-hidden="true" />
                  {w.save}
                </Button>
              )}
            </div>
          </div>

          <div role="status" aria-live="polite" className="sr-only" data-testid="live-region">
            {announceText}
          </div>
        </DialogContent>
      </Dialog>

      <ImpactDialog open={impact} preview={preview} evaluations={evidenceCount} display={display} onBack={() => setImpact(false)} onConfirm={commit} />
      <CopyConfigDialog open={copyOpen} onOpenChange={setCopyOpen} targetId={skillId} cfg={draft.cfg} targetConfigured={isConfigured(skill)} onCopy={onCopy} />
      <ApplyConfigDialog open={applyOpen} mode={{ kind: "fromSkill", sourceId: skillId }} onOpenChange={setApplyOpen} onDone={(report) => setBanner({ kind: report.applied > 0 ? "success" : "info", text: applyResultText(report) })} />
      <UnsavedDialog open={leave} onKeep={() => setLeave(false)} onDiscard={() => onOpenChange(false)} />
    </ConfigureProvider>
  )
}
