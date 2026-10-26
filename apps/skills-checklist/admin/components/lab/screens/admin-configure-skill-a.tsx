"use client"

/**
 * Configure a skill, option set 1 "Guided" (template T2 wizard at form width; docs/knowledge/design/skill-setup-journey/02
 * section 4). Five one-word steps (Model, Outcomes, Rule, Who signs, Check) in ONE 720 px working column. The live rule
 * sentence sits in the sticky footer, not in a third column; the student and evaluator preview opens from a small popover.
 * Check and publish is the last step: what changes, who flips (grouped by move, ties said once), the open evidence choice
 * with nothing preselected, and one primary, Publish.
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
import { CONFIGURE_STEPS, isConfigureStep, outcomesLabel, type ConfigureStepId, type PublishMode, type RuleIssue } from "@/lib/lab/configure"
import { skillNoun } from "@/lib/lab/terms"
import { SECTION_BODY, type SectionProps } from "@/components/lab/configure/fields"
import { IssueSummary } from "@/components/lab/configure/issue-summary"
import { RuleFooterSummary } from "@/components/lab/configure/live-panel"
import { CheckPanel, EVIDENCE_CHOICE_MISSING, needsEvidenceChoice, PublishedNotice, useLiveImpact } from "@/components/lab/configure/impact"
import { CopyFromDialog } from "@/components/lab/configure/bulk-apply"
import { CancelButton, ConfigureLoading, ConfigureNotFound, SkillSubtitle } from "@/components/lab/configure/shell"
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
  const [note, setNote] = React.useState<string | null>(null)
  const [pendingFocus, setPendingFocus] = React.useState<string | null>(null)
  const impact = useLiveImpact(m.state, m.skill, m.current, m.rule)

  // A new skill (or a deep link to a step) starts the wizard over.
  const hasModel = !!m.rule.model
  const seeded = React.useRef<string | null>(null)
  React.useEffect(() => {
    if (!m.skill) return
    const key = `${m.skill.id}|${askedStep ?? ""}|${hasModel}`
    if (seeded.current === key) return
    seeded.current = key
    const i = isConfigureStep(askedStep) && hasModel ? CONFIGURE_STEPS.findIndex((s) => s.id === askedStep) : 0
    setStep(i)
    setVisited(new Set(CONFIGURE_STEPS.slice(0, i).map((s) => s.id)))
    setTried(new Set())
    setMode(null)
    setModeTried(false)
  }, [m.skill, askedStep, hasModel])

  React.useEffect(() => {
    if (!pendingFocus) return
    const id = pendingFocus
    setPendingFocus(null)
    requestAnimationFrame(() => focusField(id))
  }, [pendingFocus, step])

  if (!m.ready) return <ConfigureLoading />
  if (!m.skill) return <ConfigureNotFound skillId={m.skillId} />
  const skill = m.skill

  const stepId = CONFIGURE_STEPS[step].id
  const onCheck = stepId === "check"
  const issuesIn = (id: ConfigureStepId) => (id === "check" ? m.issues : m.issues.filter((i) => i.section === id))
  const steps: WizardStep[] = CONFIGURE_STEPS.map((s) => ({
    id: s.id,
    label: s.id === "outcomes" ? outcomesLabel(m.rule.model) : s.label,
    error: s.id !== "check" && (visited.has(s.id) || tried.has(s.id) || tried.has("check")) && issuesIn(s.id).length > 0,
  }))
  const choice = needsEvidenceChoice(m.current, impact)

  const goTo = (i: number, focus?: string) => {
    if (!hasModel && i > 0) return
    setVisited((prev) => new Set(prev).add(stepId))
    setStep(i)
    if (focus) setPendingFocus(focus)
    else focusStepHeading(CONFIGURE_STEPS[i].id)
  }
  const goToIssue = (i: RuleIssue) => goTo(CONFIGURE_STEPS.findIndex((s) => s.id === i.section), i.field)

  const next = () => {
    if (issuesIn(stepId).length > 0) {
      setTried((prev) => new Set(prev).add(stepId))
      return
    }
    goTo(Math.min(CHECK, step + 1))
  }
  const publish = () => {
    if (m.issues.length > 0) {
      setTried((prev) => new Set(prev).add("check"))
      return
    }
    if (choice && !mode) {
      setModeTried(true)
      requestAnimationFrame(() => focusField("cfg-mode"))
      return
    }
    m.publish(choice ? mode : null)
  }

  const showErrors = visited.has(stepId) || tried.has(stepId) || tried.has("check")
  const props: SectionProps = { rule: m.rule, setRule: m.setRule, issues: m.issues, showErrors, settings: m.settings }

  // One banner at most under the stepper: the published notice, a copied-from note, or the error summary after a failed continue.
  const stepIssues = issuesIn(stepId)
  const summaryShown = !m.published && tried.has(stepId) && stepIssues.length > 0
  const banner = m.published ? (
    <PublishedNotice skill={skill} result={m.published} onDismiss={m.dismissPublished} />
  ) : onCheck && tried.has("check") && m.issues.length > 0 ? (
    <IssueSummary issues={m.issues} onGo={goToIssue} />
  ) : !onCheck && tried.has(stepId) && stepIssues.length > 0 ? (
    <ValidationSummary issues={stepIssues.map((i) => ({ fieldId: i.field, message: i.message }))} />
  ) : note ? (
    <LocalBanner variant="info" dismissible onDismiss={() => setNote(null)}>
      {note}
    </LocalBanner>
  ) : null

  const footer = (
    <StickyFooter
      summary={<RuleFooterSummary skillName={skill.name} rule={m.rule} impact={impact} showPreview={!onCheck} showChange={!onCheck} onSeeChange={hasModel ? () => goTo(CHECK) : undefined} />}
      back={step > 0 ? { onClick: () => goTo(step - 1) } : undefined}
      context={onCheck && m.published ? "No unpublished changes." : undefined}
      primary={onCheck ? (m.published ? undefined : { label: "Publish", onClick: publish }) : { label: "Next", onClick: next }}
    />
  )

  return (
    <>
      <WizardPage
        title={skill.name}
        subtitle={<SkillSubtitle state={m.state} skill={skill} />}
        actions={
          <div className="flex items-center gap-2">
            <CancelButton dirty={m.dirty} />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button type="button" variant="ghost" size="icon-sm" aria-label="More actions">
                  <i className="fa-light fa-ellipsis" aria-hidden="true" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onSelect={() => setCopyOpen(true)}>{`Copy from another ${skillNoun()}`}</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        }
        width="form"
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
              m.published ? null : (
                <CheckPanel skill={skill} current={m.current} rule={m.rule} impact={impact} mode={mode} onMode={setMode} modeError={modeTried && !mode ? EVIDENCE_CHOICE_MISSING : undefined} />
              )
            ) : (
              <>
                {SECTION_BODY[s.id](props)}
                {s.id === "model" && !m.current ? (
                  <LocalBanner variant="info">{`Students cannot send this ${skillNoun()} and it cannot be mapped until it is published.`}</LocalBanner>
                ) : null}
              </>
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
          setNote(`Copied from ${name}. Check each step before publishing.`)
        }}
      />
    </>
  )
}
