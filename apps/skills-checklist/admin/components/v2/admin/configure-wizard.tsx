"use client"

import * as React from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@exxatdesignux/ui/components/ui/card"
import { LocalBanner } from "@exxatdesignux/ui/components/ui/banner"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@exxatdesignux/ui/components/ui/dialog"
import { Wizard, WizardContent, WizardNav, WizardPanel, WizardStepHeading } from "@exxatdesignux/ui/components/ui/wizard"
import { PageFrame } from "@/components/skills/page-header"
import { LoadingBlocks } from "@/components/v2/shared-loading"
import { StatusPill } from "@/components/v2/status-pill"
import { skillPillValue } from "@/lib/v2/status-pill"
import { ADMIN_ID, LiveStatus, useAdminRun } from "@/components/v2/admin/use-admin"
import { StepAchievement, StepEvaluators, StepFailure, StepModel, StepPrerequisites, StepSimulation, type WizardCtx } from "@/components/v2/admin/wizard-steps"
import { chooseModel, copyConfigFrom, draftFor, publishSkill, saveStep, setDraft } from "@/lib/v2/admin-actions"
import { useV2Hydrated, useV2State, useV2Store } from "@/lib/v2/react"
import { reviewSections } from "@/lib/v2/review"
import { validateDraft, WIZARD_STEPS, type RuleIssue } from "@/lib/v2/rules"
import { IDS } from "@/lib/v2/seed"
import type { SkillConfig } from "@/lib/v2/types"

const LAST = WIZARD_STEPS.length

/**
 * Walkthrough step 2 and 3. The wizard edits a draft that lives in the shared store, so it survives navigation and reload.
 * `startStep` opens the same wizard on the review step (route validate-publish).
 */
export function ConfigureWizardPage({ startStep }: { startStep?: number }) {
  const params = useSearchParams()
  const skillId = params?.get("skill") ?? IDS.ivCath
  const state = useV2State()
  const hydrated = useV2Hydrated()
  const store = useV2Store()
  const run = useAdminRun()
  const skill = state.skills.find((k) => k.id === skillId)
  const draft = React.useMemo(() => draftFor(state, skillId), [state, skillId])
  // Without a model nothing after step 1 can be shown or reached (SC-02: the admin chooses explicitly).
  const step = draft.model ? Math.min(Math.max(draft.step, 1), LAST) : 1

  const [seen, setSeen] = React.useState<Set<number>>(() => new Set())
  const [banner, setBanner] = React.useState<{ variant: "success" | "error" | "info"; text: string; published?: boolean } | null>(null)
  const [status, setStatus] = React.useState("")
  const [confirm, setConfirm] = React.useState(false)
  const [focusReq, setFocusReq] = React.useState<{ field: string | null; n: number } | null>(null)
  const askedStart = React.useRef(false)

  // Open on the review step when the route asks for it (once), or on ?step=.
  React.useEffect(() => {
    if (askedStart.current || !skill) return
    askedStart.current = true
    const want = startStep ?? Number(params?.get("step") ?? 0)
    if (want >= 1 && want <= LAST && want !== draft.step) store.update((s) => setDraft(s, skillId, { ...draftFor(s, skillId), step: want }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [skill])

  const issues = React.useMemo(() => (skill ? validateDraft(draft, state, skillId) : []), [draft, state, skillId, skill])
  const visible = (i: RuleIssue) => step === LAST || seen.has(i.step)

  // Focus: the step heading after a step change, or the field an issue link points to. Never on first paint.
  React.useEffect(() => {
    if (!focusReq) return
    const target = focusReq?.field ? document.getElementById(focusReq.field) : null
    const el = target ?? document.getElementById(`wizard-step-heading-${WIZARD_STEPS[step - 1].id}`)
    if (el) {
      if (!target) el.setAttribute("tabindex", "-1")
      el.focus()
      el.scrollIntoView?.({ block: "nearest" })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusReq])

  if (!skill && !hydrated) return <PageFrame title="Configure skill"><LoadingBlocks label="Opening the skill" rows={4} /></PageFrame>

  if (!skill) {
    return (
      <PageFrame title="Skill not found" subtitle="The skill you opened is no longer in the library.">
        <LocalBanner variant="error" title="Nothing to configure">
          This skill was removed or the link is out of date. Open the library and choose a skill to configure.
        </LocalBanner>
        <div>
          <Button asChild variant="outline" size="default">
            <Link href="/v2/admin/starter-library">Go to the skill library</Link>
          </Button>
        </div>
      </PageFrame>
    )
  }

  const blockedByModel = (n: number) => {
    if (draft.model || n <= 1) return false
    setSeen((p) => new Set(p).add(1))
    setFocusReq((p) => ({ field: "wiz-model", n: (p?.n ?? 0) + 1 }))
    setStatus("Choose an evaluation model before moving on.")
    return true
  }
  const goTo = (n: number, field: string | null = null) => {
    if (blockedByModel(n)) return
    setSeen((p) => new Set(p).add(step))
    store.update((s) => setDraft(s, skillId, { ...draftFor(s, skillId), step: n }))
    setFocusReq((p) => ({ field, n: (p?.n ?? 0) + 1 }))
    setStatus(`Step ${n} of ${LAST}: ${WIZARD_STEPS[n - 1].label}`)
  }
  const next = () => {
    if (blockedByModel(step + 1)) return
    setSeen((p) => new Set(p).add(step))
    store.update((s) => saveStep(s, skillId, step + 1, ADMIN_ID, new Date().toISOString()))
    setFocusReq((p) => ({ field: null, n: (p?.n ?? 0) + 1 }))
    setStatus(`Step ${step + 1} of ${LAST}: ${WIZARD_STEPS[step].label}`)
  }

  const ctx: WizardCtx = {
    skill,
    state,
    draft,
    patch: (fn: (c: SkillConfig) => SkillConfig) => store.update((s) => setDraft(s, skillId, { ...draftFor(s, skillId), config: fn(draftFor(s, skillId).config) })),
    setModel: (m) => store.update((s) => setDraft(s, skillId, chooseModel(draftFor(s, skillId), m))),
    err: (field) => issues.filter((i) => i.field === field && visible(i)).map((i) => i.message),
    copyFrom: (sourceId) => {
      const r = run((s, at) => copyConfigFrom(s, skillId, sourceId, ADMIN_ID, at))
      if (r.ok) {
        const name = state.skills.find((k) => k.id === sourceId)?.name ?? "the skill"
        setBanner({ variant: "success", text: `Copied the settings of ${name}. Review each step and change what differs.` })
      } else setBanner({ variant: "error", text: r.error })
    },
  }

  const publish = () => {
    const r = run((s, at) => publishSkill(s, skillId, ADMIN_ID, at))
    setConfirm(false)
    if (!r.ok) {
      setBanner({ variant: "error", text: r.error })
      return
    }
    // Stay on the review step so the admin sees the result.
    store.update((s) => setDraft(s, skillId, { ...draftFor(s, skillId), step: LAST }))
    setBanner({ variant: "success", text: `${skill.name} is now in use. Students and evaluators see these rules. Map it to NURS 350 next.`, published: true })
  }

  const steps = WIZARD_STEPS.map((s) => ({ id: s.id, label: s.label, error: s.n < LAST && issues.some((i) => i.step === s.n && (seen.has(i.step) || step === LAST)) }))
  const stepBodies: Record<number, React.ReactNode> = {
    1: <StepModel ctx={ctx} />,
    2: <StepAchievement ctx={ctx} />,
    3: <StepSimulation ctx={ctx} />,
    4: <StepPrerequisites ctx={ctx} />,
    5: <StepEvaluators ctx={ctx} />,
    6: <StepFailure ctx={ctx} />,
  }
  const sections = reviewSections(draft.model, draft.config, state)
  const nextLabel = step === LAST - 1 ? "Review and publish" : `Next: ${WIZARD_STEPS[step]?.label ?? ""}`

  return (
    <PageFrame title={`Configure ${skill.name}`}>
      <div>
        <StatusPill kind="skill" value={skillPillValue(skill)} />
      </div>
      <LiveStatus message={status} />
      {banner ? (
        <LocalBanner
          variant={banner.variant}
          title={banner.variant === "success" ? (banner.published ? "Published" : "Done") : "That did not work"}
          dismissible
          onDismiss={() => setBanner(null)}
          action={banner.published ? { label: "Map to NURS 350", href: "/v2/admin/map-courses" } : undefined}
        >
          {banner.text}
        </LocalBanner>
      ) : null}

      <Wizard steps={steps} current={step - 1} orientation="horizontal" variant="compact" linear={false} onStepClick={(i) => goTo(i + 1)}>
        <WizardNav />
        <WizardContent>
          {WIZARD_STEPS.map((s) => (
            <WizardPanel key={s.id} step={s.n - 1} className="flex flex-col gap-5">
              <WizardStepHeading id={s.id} className="mb-0 rounded-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
                {`${s.n}. ${s.label}`}
              </WizardStepHeading>
              {s.n < LAST ? (
                stepBodies[s.n]
              ) : (
                <ReviewStep
                  skillName={skill.name}
                  published={skill.published}
                  issues={issues}
                  sections={sections}
                  onGo={goTo}
                  onPublish={() => setConfirm(true)}
                />
              )}
            </WizardPanel>
          ))}
        </WizardContent>
      </Wizard>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4" data-slot="wizard-footer">
        <p className="text-sm text-muted-foreground">{`Step ${step} of ${LAST}: ${WIZARD_STEPS[step - 1].label}`}</p>
        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" variant="outline" size="default" disabled={step === 1} onClick={() => goTo(step - 1)}>
            Back
          </Button>
          {step < LAST ? (
            <>
              {step < LAST - 1 ? (
                <Button type="button" variant="outline" size="default" onClick={() => goTo(LAST)}>
                  Review and publish
                </Button>
              ) : null}
              <Button type="button" variant="default" size="default" onClick={next}>
                {nextLabel}
              </Button>
            </>
          ) : null}
        </div>
      </div>

      <Dialog open={confirm} onOpenChange={setConfirm}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{`Publish ${skill.name}?`}</DialogTitle>
            <DialogDescription>Students and evaluators will see these rules. Evaluations already completed are not changed.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" size="default" onClick={() => setConfirm(false)}>
              Keep editing
            </Button>
            <Button type="button" variant="default" size="default" onClick={publish}>
              {skill.published ? `Publish changes to ${skill.name}` : `Publish ${skill.name}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageFrame>
  )
}

function ReviewStep({
  skillName,
  published,
  issues,
  sections,
  onGo,
  onPublish,
}: {
  skillName: string
  published: boolean
  issues: RuleIssue[]
  sections: ReturnType<typeof reviewSections>
  onGo: (step: number, field: string) => void
  onPublish: () => void
}) {
  const blocked = issues.length > 0
  return (
    <div className="flex flex-col gap-4">
      {blocked ? (
        <LocalBanner variant="error" title={`${issues.length} ${issues.length === 1 ? "problem" : "problems"} to fix before you can publish`} role="alert">
          <ul className="mt-1 flex flex-col gap-1" aria-label="Problems to fix">
            {issues.map((i) => (
              <li key={i.id}>
                <Button type="button" variant="link" size="sm" className="h-auto whitespace-normal p-0 text-start" onClick={() => onGo(i.step, i.field)}>
                  {`${WIZARD_STEPS[i.step - 1].label}: ${i.message}`}
                </Button>
              </li>
            ))}
          </ul>
        </LocalBanner>
      ) : (
        <LocalBanner variant="success" title="No problems found">
          {`${skillName} can be published. Read through what it will ask of students and evaluators first.`}
        </LocalBanner>
      )}
      <div className="grid gap-4 md:grid-cols-2">
        {sections.map((s) => (
          <Card key={s.step}>
            <CardHeader>
              <CardTitle className="text-base">{s.title}</CardTitle>
              <CardDescription>{`Step ${s.step}`}</CardDescription>
              <CardAction>
                <Button type="button" variant="outline" size="sm" aria-label={`Edit ${s.title.toLowerCase()}`} onClick={() => onGo(s.step, "")}>
                  Edit
                </Button>
              </CardAction>
            </CardHeader>
            <CardContent>
              <ul className="flex flex-col gap-1.5 text-sm">
                {s.lines.map((l, i) => (
                  <li key={i}>{l}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="flex flex-col items-end gap-1">
        <Button type="button" variant="default" size="default" disabled={blocked} aria-describedby={blocked ? "publish-reason" : undefined} onClick={onPublish}>
          {published ? `Publish changes to ${skillName}` : `Publish ${skillName}`}
        </Button>
        {blocked ? (
          <p id="publish-reason" className="text-sm text-muted-foreground">
            {`Fix the ${issues.length} ${issues.length === 1 ? "problem" : "problems"} above to publish.`}
          </p>
        ) : null}
      </div>
    </div>
  )
}
