"use client"

/**
 * Configure a skill, option set 1 "Guided" (template T2 wizard, full width per D-X30). Five one-word steps (How it's judged,
 * Evaluation criteria, How many times, Who signs, Check). From 1280 px the live Preview panel sits beside each step.
 *
 * Save model (decision D-X31, REQ SC-01: a skill is Not configured or Configured; there is no publish stage):
 * - Every step's footer has "Save draft" (outline): the edits are kept in the shared store and the skill keeps its status.
 * - Close in the title asks before leaving with unsaved edits: save a draft and leave, discard, or keep editing.
 * - Check (decision D-X32, layout "sheet"): the issue summary on top, then "What you set up" (six groups, each with Edit that
 *   opens the step and comes back to Check) beside "Who it affects", then the student and evaluator views side by side. One
 *   primary, "Save configuration" ("Save changes" on a configured skill), disabled with its reason until nothing is missing.
 * - After saving the page becomes the receipt: no stepper, no Close, no Back; Done, Map to courses, Configure next.
 *
 * URL: ?skill= (default Oral medication administration) · ?step=model|outcomes|rule|signoff|check · ?change=sample ·
 * ?state=loading. Listens for the lab `lab:reset` event (use-configure).
 */
import * as React from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@exxatdesignux/ui/components/ui/dropdown-menu"
import { LocalBanner } from "@exxatdesignux/ui/components/ui/banner"
import { WizardPanel, type WizardStep } from "@exxatdesignux/ui/components/ui/wizard"
import { cn } from "@exxatdesignux/ui/lib/utils"
import { StickyFooter, ValidationSummary, WizardPage } from "@/components/lab/layout"
import { CONFIGURE_STEPS, configureStepHead, configureStepValue, isConfigureStep, outcomesLabel, type ConfigureStepId, type PublishMode, type RuleIssue } from "@/lib/lab/configure"
import { skillNoun } from "@/lib/lab/terms"
import { SECTION_BODY, type SectionProps } from "@/components/lab/configure/fields"
import { RuleFooterSummary, RulePreviewAside } from "@/components/lab/configure/live-panel"
import { EVIDENCE_CHOICE_MISSING, needsEvidenceChoice, useLiveImpact } from "@/components/lab/configure/impact"
import { CheckCard, CheckSection, ConfigureReceiptPage, EvidenceDecision, FixList, openDecisions, PreviewCard, Readiness, saveBlockedReason, SetupSummary, WhoItAffects } from "@/components/lab/configure/check"
import { BulkApplySheet, bulkAppliedNote, CopyFromDialog } from "@/components/lab/configure/bulk-apply"
import { skillNounPlural } from "@/lib/lab/terms"
import { ConfigureLoading, ConfigureNotFound, LeaveButton, SkillTitle } from "@/components/lab/configure/shell"
import { focusField, useConfigure } from "@/components/lab/configure/use-configure"

const CHECK = CONFIGURE_STEPS.length - 1

function focusStepHeading(id: ConfigureStepId) {
  requestAnimationFrame(() => {
    const h = document.getElementById(`wizard-step-heading-${id}`)
    if (!h) return
    h.setAttribute("tabindex", "-1")
    h.focus()
  })
}

export function AdminConfigureSkillA() {
  const m = useConfigure()
  const params = useSearchParams()
  const askedStep = params?.get("step")
  const [step, setStep] = React.useState(0)
  const [visited, setVisited] = React.useState<Set<ConfigureStepId>>(() => new Set())
  const [tried, setTried] = React.useState<Set<ConfigureStepId>>(() => new Set())
  const [mode, setMode] = React.useState<PublishMode | null>(null)
  const [modeTried, setModeTried] = React.useState(false)
  const [copyOpen, setCopyOpen] = React.useState(false)
  const [bulkOpen, setBulkOpen] = React.useState(false)
  const [note, setNote] = React.useState<string | null>(null)
  const [pendingFocus, setPendingFocus] = React.useState<string | null>(null)
  // Set by an Edit link on Check: the step's primary then reads "Back to Check" (no Back x4).
  const [returnToCheck, setReturnToCheck] = React.useState(false)
  const impact = useLiveImpact(m.state, m.skill, m.current, m.rule)

  // A new skill (or a deep link to a step) starts the wizard over; a saved draft resumes at its step.
  const hasModel = !!m.rule.model
  const draftStep = m.draft?.step ?? null
  const seeded = React.useRef<string | null>(null)
  React.useEffect(() => {
    if (!m.skill) return
    const key = `${m.skill.id}|${askedStep ?? ""}|${hasModel}`
    if (seeded.current === key) return
    seeded.current = key
    const want = isConfigureStep(askedStep) ? askedStep : isConfigureStep(draftStep) ? draftStep : null
    const i = want && hasModel ? CONFIGURE_STEPS.findIndex((s) => s.id === want) : 0
    setStep(i)
    setVisited(new Set(CONFIGURE_STEPS.slice(0, i).map((s) => s.id)))
    setTried(new Set())
    setMode(null)
    setModeTried(false)
    setReturnToCheck(false)
  }, [m.skill, askedStep, hasModel, draftStep])

  React.useEffect(() => {
    if (!pendingFocus) return
    const id = pendingFocus
    setPendingFocus(null)
    requestAnimationFrame(() => focusField(id))
  }, [pendingFocus, step])

  if (!m.ready) return <ConfigureLoading />
  if (!m.skill) return <ConfigureNotFound skillId={m.skillId} />
  const skill = m.skill
  if (m.saved) return <ConfigureReceiptPage state={m.state} skill={skill} result={m.saved} layout="sheet" nextSkill={m.nextSkill} />

  const stepId = CONFIGURE_STEPS[step].id
  const onCheck = stepId === "check"
  const issuesIn = (id: ConfigureStepId) => (id === "check" ? m.issues : m.issues.filter((i) => i.section === id))
  // A step's problems show once the admin has been there, tried to move on, or reached Check.
  const flagged = (id: ConfigureStepId) => id !== "check" && (visited.has(id) || tried.has(id) || onCheck) && issuesIn(id).length > 0
  // The DS rail shows each step's description under its label: the value chosen so far, or "To fix". The DS Wizard ticks every
  // earlier step and cannot mark one as unresolved, so the words carry that state (WizardPage header note).
  const steps: WizardStep[] = CONFIGURE_STEPS.map((s) => {
    const description = s.id === "check" ? undefined : flagged(s.id) && s.id !== stepId ? "To fix" : configureStepValue(s.id, m.rule)
    return {
      id: s.id,
      label: s.id === "outcomes" ? outcomesLabel(m.rule.model) : s.label,
      ...(description ? { description } : {}),
      error: flagged(s.id),
    }
  })
  const choice = needsEvidenceChoice(m.current, impact)
  const open = openDecisions(m.issues, choice, mode)
  const blocked = saveBlockedReason(m.issues, choice, mode)

  const goTo = (i: number, focus?: string) => {
    if (!hasModel && i > 0) return
    setVisited((prev) => new Set(prev).add(stepId))
    setStep(i)
    if (CONFIGURE_STEPS[i].id === "check") setReturnToCheck(false)
    if (focus) setPendingFocus(focus)
    else focusStepHeading(CONFIGURE_STEPS[i].id)
  }
  const goToIssue = (i: RuleIssue) => {
    setReturnToCheck(true)
    goTo(CONFIGURE_STEPS.findIndex((s) => s.id === i.section), i.field)
  }

  const next = () => {
    if (issuesIn(stepId).length > 0 && !returnToCheck) {
      setTried((prev) => new Set(prev).add(stepId))
      return
    }
    goTo(returnToCheck ? CHECK : Math.min(CHECK, step + 1))
  }
  const save = () => {
    if (m.issues.length > 0) return
    if (choice && !mode) {
      setModeTried(true)
      requestAnimationFrame(() => focusField("cfg-mode"))
      return
    }
    m.save(choice ? mode : null)
  }

  const showErrors = visited.has(stepId) || tried.has(stepId) || returnToCheck
  // The step heading asks the question, so the model legend stays for screen readers only (say it once).
  const props: SectionProps = { rule: m.rule, setRule: m.setRule, issues: m.issues, showErrors, settings: m.settings, legendHidden: true }
  const head = configureStepHead(stepId, m.rule.model, m.issues.length === 0)

  // One banner at most under the step heading: on Check the issue summary (question 2), on a step the error summary after a failed
  // continue, or a copied-from note.
  const stepIssues = issuesIn(stepId)
  const summaryShown = !onCheck && tried.has(stepId) && stepIssues.length > 0
  const banner =
    onCheck && m.issues.length > 0 ? (
      <FixList issues={m.issues} onFix={goToIssue} />
    ) : summaryShown ? (
      <ValidationSummary issues={stepIssues.map((i) => ({ fieldId: i.field, message: i.message }))} />
    ) : note ? (
      <LocalBanner variant="info" dismissible onDismiss={() => setNote(null)}>
        {note}
      </LocalBanner>
    ) : null

  const saveLabel = m.current ? "Save changes" : "Save configuration"
  const draftContext = m.draft && !m.dirty ? "Draft saved." : undefined
  const footer = onCheck ? (
    // Check: no rule line (the summary above says it once). Save is disabled, with its reason, until nothing is missing.
    <StickyFooter
      back={{ onClick: () => goTo(step - 1) }}
      context={draftContext}
      secondary={{ label: "Save draft", onClick: () => m.saveDraft(stepId) }}
      primary={{ label: saveLabel, onClick: save, disabled: !!blocked, disabledReason: blocked }}
    />
  ) : (
    <StickyFooter
      summary={<RuleFooterSummary skillName={skill.name} rule={m.rule} impact={impact} showPreview showChange onSeeChange={hasModel ? () => goTo(CHECK) : undefined} asideWide />}
      back={step > 0 && !returnToCheck ? { onClick: () => goTo(step - 1) } : undefined}
      context={draftContext}
      secondary={{ label: "Save draft", onClick: () => m.saveDraft(stepId) }}
      primary={{ label: returnToCheck ? "Back to Check" : "Next", onClick: next }}
    />
  )

  return (
    <>
      <WizardPage
        title={<SkillTitle state={m.state} skill={skill} />}
        actions={
          <div className="flex items-center gap-2">
            <LeaveButton dirty={m.dirty} skillId={skill.id} onSaveDraft={() => m.saveDraft(stepId)} />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button type="button" variant="ghost" size="icon-sm" aria-label="More actions">
                  <i className="fa-light fa-ellipsis" aria-hidden="true" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onSelect={() => setCopyOpen(true)}>{`Copy from another ${skillNoun()}`}</DropdownMenuItem>
                <DropdownMenuItem disabled={!m.rule.model} onSelect={() => setBulkOpen(true)}>{`Apply to other ${skillNounPlural()}`}</DropdownMenuItem>
                {m.draft ? <DropdownMenuItem onSelect={() => m.discardDraft()}>Discard draft</DropdownMenuItem> : null}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        }
        width="form"
        // Layout "rail" (Romit 2026-10-27, "the steps cleaner and easier to navigate"): DS vertical Wizard in a left rail with
        // the chosen value under each step, one visible step question beside it.
        layout="rail"
        stepTitle={head.title}
        stepLead={head.lead}
        // D-X30: the live preview beside every step from 1280 px; Check shows the views itself, so it takes the full width.
        aside={onCheck ? null : <RulePreviewAside skillName={skill.name} rule={m.rule} current={m.current} impact={impact} onSeeChange={hasModel ? () => goTo(CHECK) : undefined} />}
        steps={steps}
        current={step}
        linear={!hasModel}
        onStepClick={(i) => goTo(i)}
        banner={banner}
        footer={footer}
      >
        {CONFIGURE_STEPS.map((s, i) => (
          // While the summary lists the problems, field errors stay for screen readers only (say it once, rule L11).
          <WizardPanel key={s.id} step={i} className={cn("flex flex-col gap-6 pb-8", summaryShown && "[&_[data-slot=field-error]]:sr-only")}>
            {s.id === "check" ? (
              // Layout "sheet" (redesign 2026-10-27): what to fix sits in the banner above; here the open decision first, then
              // the choices per step, beside a sticky aside with who it affects and the preview (secondary).
              <div className="@container" data-check-layout="sheet">
                <div className="grid grid-cols-1 gap-6 @min-[64rem]:grid-cols-[minmax(0,1fr)_minmax(20rem,36%)]">
                  <div className="flex min-w-0 flex-col gap-6">
                    {choice ? <EvidenceDecision mode={mode} onMode={setMode} error={modeTried && !mode ? EVIDENCE_CHOICE_MISSING : undefined} /> : null}
                    {/* The banner above already counts what is left; the badge only says when nothing is. */}
                    <CheckSection title="Your choices" badge={open === 0 ? <Readiness open={0} /> : undefined}>
                      <SetupSummary
                        rule={m.rule}
                        current={m.current}
                        issues={m.issues}
                        layout="sheet"
                        onEdit={(stepIdOf) => {
                          setReturnToCheck(true)
                          goTo(CONFIGURE_STEPS.findIndex((x) => x.id === stepIdOf))
                        }}
                      />
                    </CheckSection>
                  </div>
                  {/* Not sticky: with the students listed it can be taller than the viewport, and a sticky column would hide its end. */}
                  <div className="flex min-w-0 flex-col gap-6" data-check-aside>
                    <CheckCard title="Who it affects">
                      <WhoItAffects state={m.state} skill={skill} current={m.current} rule={m.rule} impact={impact} mode={mode} lead="people" />
                    </CheckCard>
                    {m.rule.model ? <PreviewCard skillName={skill.name} rule={m.rule} /> : null}
                  </div>
                </div>
              </div>
            ) : (
              // The "Not configured" chip in the subtitle carries the consequence (cannot be sent or mapped) in its tooltip, so
              // no banner repeats it [REQ IM-09].
              SECTION_BODY[s.id](props)
            )}
          </WizardPanel>
        ))}
      </WizardPage>
      <CopyFromDialog
        open={copyOpen}
        onOpenChange={setCopyOpen}
        state={m.state}
        skillId={m.skillId}
        onCopy={(rule, name) => {
          m.setRule(rule)
          setNote(`Copied from ${name}. Check each step before saving.`)
        }}
      />
      <BulkApplySheet
        open={bulkOpen}
        onOpenChange={setBulkOpen}
        state={m.state}
        skillId={m.skillId}
        rule={m.rule}
        blocked={m.issues.length > 0}
        onApplied={(x) => setNote(bulkAppliedNote(x))}
      />
    </>
  )
}
