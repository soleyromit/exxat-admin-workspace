"use client"

/**
 * Setup summary, variant C, "Set up skills" (D-L44, Proposed; the registry marks it frame "focus"): the admin setup as a DS focus workflow (exxat-focus-workflow.mdc,
 * exxat-wizard.mdc). Romit 2026-11-03: "I am not understanding the flows... when there is a step based flow, a user knows what
 * to expect next, here it's unclear."
 *
 * - Variant D (admin-setup-skills-d.tsx, D-L46) is this workflow with the list as step 1 and the vertical rail on the left.
 * - Own route, no sidebar, no breadcrumbs (components/lab/focus-frame.tsx). One h1 (DS PageHeader) with Save and exit; a
 *   horizontal DS WizardNav across the top (Romit 2026-11-04: "Why are we showing the wizard beside the skills table directly?"),
 *   so every step body has the full width. Done, current, not yet; only done steps are clickable. The DS horizontal rail draws no
 *   step description, so "optional" and "skipped" ride in the step label. One footer: Back, Skip (optional steps only), Next.
 * - A new program (lib/lab/new-program.ts): its own store and session space, so the setup starts empty and the hub pages keep the
 *   seeded program. The lab bar's Start over clears it.
 * - Step 1 adds, it does not manage: Paste a list (Add several), Upload a file (Later), Add one (the add sheet), then a slim
 *   "Added" list (name, category, tags). Steps 2 to 5 are the hub bodies without their page header (EmbeddedStepProvider), with the
 *   hub-only extras hidden inside the workflow (scope line, filters, counts, links out). Review is the recap by wizard step.
 * - Gates come from the data (lib/lab/setup-wizard.ts): a skill in the library, settings saved, a student group with skills.
 *   Progress (step, skipped) is kept in localStorage on every move, so Library can offer "Continue setup".
 * - No helper text (D-L34): rail names, step heading, controls. A failed Next names what is missing, amber with a glyph.
 * URL: ?step=skills|categories|settings|assign|mapping|review, plus each body's own params.
 */
import * as React from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { PageHeader } from "@exxatdesignux/ui/components/ui/page-header"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import { StatusBadge } from "@exxatdesignux/ui"
import { DataTable } from "@exxatdesignux/ui/components/data-table"
import type { ColumnDef } from "@exxatdesignux/ui/components/data-table/types"
import { EmptyBlock } from "@/components/lab/empty-block"
import { Wizard, WizardContent, WizardNav, WizardStepHeading, type WizardStep } from "@exxatdesignux/ui/components/ui/wizard"
import { cn } from "@exxatdesignux/ui/lib/utils"
import { useV2State } from "@/lib/v2/react"
import { buildLibrary } from "@/lib/lab/library"
import { programSettingsOf } from "@/lib/lab/program-settings"
import { capitalize, skillNounPlural } from "@/lib/lab/terms"
import type { RecapFigure, RecapStep } from "@/lib/lab/setup-result"
import {
  SETUP_STEPS,
  SETUP_STORAGE_KEY,
  back as backStep,
  canOpen,
  firstBlocked,
  gateMet,
  next as nextStep,
  parseProgress,
  serializeProgress,
  skip as skipStep,
  stepIndex,
  type SetupFacts,
  type SetupProgress,
  type SetupStepId,
} from "@/lib/lab/setup-wizard"
import { useLabHref } from "@/components/lab/lab-bar/page-context"
import { EmbeddedStepProvider, type EmbeddedStep } from "@/components/lab/layout/embedded"
import { TYPE } from "@/components/lab/type-scale"
import { useSetupResult } from "@/components/lab/admin-a/result-parts"
import { ListsFrame } from "@/components/lab/admin-a/lists-frame"
import { GroupsActionTable } from "@/components/lab/admin-a/lists-groups-table"
import { useV2Store } from "@/lib/v2/react"
import { useLabEvent } from "@/components/lab/lab-bar/use-lab-event"
import { SkillsAddStep } from "@/components/lab/setup/skills-add-step"
import { SkillsListStep, type GateCue } from "@/components/lab/setup/skills-list-step"
import { NEW_PROGRAM, NewProgramScope, PROGRAM_PARAM, resetNewProgram } from "@/components/lab/setup/new-program-scope"
import { AdminCategoriesTagsA } from "@/components/lab/screens/admin-categories-tags-a"
import { AdminEvaluationSettingsB } from "@/components/lab/screens/admin-evaluation-settings-b"
import { AdminCourseMappingB } from "@/components/lab/screens/admin-course-mapping-b"

const WARN_TEXT = "text-[var(--status-badge-warning-fg)]"

/** What a failed Next says, per gated step: "{What failed}. {What to do}." */
function gateMessage(id: SetupStepId): string {
  const nounPl = skillNounPlural()
  if (id === "skills") return `No ${nounPl} yet. Add at least one.`
  if (id === "settings") return "Evaluation settings are not saved. Complete them and save."
  return `No student group has ${nounPl}. Assign at least one.`
}

const stepLabel = (id: SetupStepId, label: string) => (id === "skills" ? capitalize(skillNounPlural()) : label)

/** The wizard step each Setup summary row reopens. */
const RECAP_TO_STEP: Record<RecapStep, SetupStepId> = { library: "skills", categories: "categories", settings: "settings", lists: "assign", assign: "assign", map: "mapping" }

function readStored(): SetupProgress | null {
  try {
    const raw = window.localStorage.getItem(SETUP_STORAGE_KEY)
    return raw ? parseProgress(raw) : null
  } catch {
    return null
  }
}
function writeStored(p: SetupProgress) {
  try { window.localStorage.setItem(SETUP_STORAGE_KEY, serializeProgress(p)) } catch { /* blocked storage: the URL still holds the step */ }
}

function useSetupFacts(): { facts: SetupFacts & { settingsAt: string | null }; ready: boolean } {
  const state = useV2State()
  const { ready, result } = useSetupResult()
  return React.useMemo(() => ({
    ready,
    facts: {
      skills: buildLibrary(state).filter((r) => r.status !== "inactive").length,
      settingsSaved: !!programSettingsOf(state)?.at,
      settingsAt: programSettingsOf(state)?.at ?? null,
      groupsWithSkills: result.groups.filter((g) => g.skills.length > 0).length,
    },
  }), [state, ready, result])
}

/**
 * Step 1 comes in two designs on one wizard: "add" (variant C, D-L44: ways to add, then the skills added) and "list" (variant D,
 * D-L46, Proposed: the list is the page, add row on top, edit and remove in place). Everything else is shared, so the two compare
 * on step 1 alone. Both run on the new program (components/lab/setup/new-program-scope.tsx).
 */
export type SkillsStepDesign = "add" | "list"

export function AdminSetupSkillsA({ skillsStep = "add" }: { skillsStep?: SkillsStepDesign }) {
  return (
    <NewProgramScope>
      <SetupWorkflow skillsStep={skillsStep} />
    </NewProgramScope>
  )
}

function SetupWorkflow({ skillsStep }: { skillsStep: SkillsStepDesign }) {
  const store = useV2Store()
  // Lab bar "Start over": the new program goes back to empty and the workflow to step 1.
  useLabEvent("lab:reset", () => {
    resetNewProgram(store)
    window.location.assign(`${window.location.pathname}?${new URLSearchParams({ ...Object.fromEntries(new URLSearchParams(window.location.search)), step: "skills" }).toString()}`)
  })
  const variantId = skillsStep === "list" ? "D" : "C"
  const params = useSearchParams()
  const pathname = usePathname() ?? ""
  const router = useRouter()
  const to = useLabHref()
  const { facts, ready } = useSetupFacts()
  const [skipped, setSkipped] = React.useState<SetupStepId[]>([])
  const [fromReview, setFromReview] = React.useState(false)
  const [failed, setFailed] = React.useState<SetupStepId | null>(null)
  // Evaluation settings: the saved-at stamp when Save and continue started a save, so the move waits for that save to land.
  const [pendingFrom, setPendingFrom] = React.useState<string | null>(null)
  const primaryRef = React.useRef<(() => boolean) | null>(null)

  // The step lives in the URL (shareable, screenshot-able); a URL without one resumes the saved step.
  const urlIndex = stepIndex(params?.get("step"))
  const [restored, setRestored] = React.useState<number | null>(null)
  React.useEffect(() => {
    const stored = readStored()
    if (stored) setSkipped(stored.skipped)
    if (urlIndex < 0) setRestored(stored?.finished ? 0 : stored?.current ?? 0)
    // Only on first load.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  const wanted = urlIndex >= 0 ? urlIndex : restored ?? 0
  // Never past an unmet gate: a deep link or a stale save opens the step that blocks it.
  const blocked = ready ? firstBlocked(facts, wanted) : null
  const current = blocked ?? wanted
  const step = SETUP_STEPS[current]!

  const go = React.useCallback((index: number, extra: Record<string, string> = {}) => {
    const q = new URLSearchParams()
    for (const k of ["variant", "set"]) { const v = params?.get(k); if (v) q.set(k, v) }
    q.set("step", SETUP_STEPS[index]!.id)
    for (const [k, v] of Object.entries(extra)) q.set(k, v)
    setFailed(null)
    router.replace(`${pathname}?${q.toString()}`, { scroll: false })
  }, [params, pathname, router])

  const progress: SetupProgress = { current, skipped }
  // Every move is saved, so leaving by any route resumes here, in the same design.
  React.useEffect(() => { if (ready) writeStored({ current, skipped, variant: variantId }) }, [ready, current, skipped, variantId])

  const advance = React.useCallback(() => {
    const n = nextStep({ current, skipped }, facts)
    if (n.current === current) return false
    setSkipped(n.skipped)
    go(n.current)
    return true
  }, [current, skipped, facts, go])

  // A gate message goes once the gate is met (a skill added, a group assigned).
  React.useEffect(() => { if (failed && gateMet(failed, facts)) setFailed(null) }, [failed, facts])
  // The list design (D) says a failed Next under its add row and moves focus there; the nonce re-fires it on every press.
  const [gateCue, setGateCue] = React.useState<GateCue>(null)
  const moveOn = () => {
    if (skillsStep === "list" && step.id === "skills" && !gateMet("skills", facts)) { setGateCue({ at: Date.now() }); return }
    if (fromReview && step.id !== "review" && gateMet(step.id, facts) && canOpen(stepIndex("review"), facts)) { setFromReview(false); go(stepIndex("review")); return }
    if (gateMet(step.id, facts)) { advance(); return }
    setFailed(step.id)
  }
  // Save and continue: once the save it started has landed (after the page's confirm dialog), move on.
  React.useEffect(() => {
    if (pendingFrom === null || step.id !== "settings") return
    if (facts.settingsAt && facts.settingsAt !== pendingFrom) {
      setPendingFrom(null)
      moveOn()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingFrom, step.id, facts.settingsAt])

  const onNext = () => {
    // Evaluation settings always saves first, so changed settings are never left behind by moving on.
    if (step.id === "settings" && primaryRef.current) {
      const pending = primaryRef.current()
      if (pending) { setPendingFrom(facts.settingsAt ?? ""); return }
    }
    moveOn()
  }
  const onSkip = () => {
    const n = skipStep(progress)
    setSkipped(n.skipped)
    go(n.current)
  }
  const onBack = () => go(backStep(progress).current)
  // Exit lands on the Library opened on the new program (?program=new), so the admin sees their own skills and the resume cue,
  // not the seeded program's (bug fix 2026-11-04).
  const library = () => to("admin/skills-library", { [PROGRAM_PARAM]: NEW_PROGRAM })
  const saveAndExit = () => { writeStored({ current, skipped, variant: variantId }); router.push(library()) }
  const finish = () => { writeStored({ current, skipped, finished: true, variant: variantId }); router.push(library()) }
  const openFromReview = (id: SetupStepId, extra?: Record<string, string>) => {
    const i = stepIndex(id)
    if (!canOpen(i, facts)) return
    setFromReview(true)
    go(i, extra)
  }

  // Variant D (Romit 2026-11-04): the vertical rail, which draws a step description, so the state word goes there. Variant C keeps
  // the horizontal rail, which draws the label only, so the state word rides in the label.
  const vertical = skillsStep === "list"
  const steps: WizardStep[] = SETUP_STEPS.map((s) => {
    const state = skipped.includes(s.id) ? "skipped" : s.optional ? "optional" : null
    const label = stepLabel(s.id, s.label)
    if (vertical) return { id: s.id, label, ...(state ? { description: capitalize(state) } : {}) }
    return { id: s.id, label: state ? `${label} (${state})` : label }
  })

  // Kept header actions (the library's Add a skill) sit on the step heading row; links that would leave the workflow (Map to
  // courses, Setup summary) and Evaluation settings' Save (run by Next) are dropped.
  const [actionsTarget, setActionsTarget] = React.useState<HTMLElement | null>(null)
  const embedded: EmbeddedStep = React.useMemo(() => ({
    actions: step.id === "categories" ? "keep" : "drop",
    registerPrimary: (run) => { primaryRef.current = run },
    actionsTarget,
  }), [step.id, actionsTarget])

  const isLast = current === SETUP_STEPS.length - 1
  const primaryLabel = isLast ? "Finish" : step.id === "settings" ? (fromReview ? "Save and review" : "Save and continue") : fromReview ? "Return to review" : "Next"
  // The list design counts on the heading ("Skills (150)"): the one figure on the step.
  const heading = skillsStep === "list" && step.id === "skills" ? `${stepLabel(step.id, step.label)} (${facts.skills.toLocaleString("en-US")})` : stepLabel(step.id, step.label)

  return (
    <div className="flex min-h-0 flex-1 flex-col" data-page-type="wizard" data-admin-lab={skillsStep === "list" ? "setup-skills-D" : "setup-skills-A"} data-setup-step={step.id}>
      <PageHeader
        title={`Set up ${skillNounPlural()}`}
        actions={<Button type="button" variant="outline" size="sm" onClick={saveAndExit}>Save and exit</Button>}
        className="px-4 pt-5 pb-0 md:px-6"
      />
      {/* The footer stays under both columns, so the DS row layout for a vertical rail moves to the inner row. */}
      <Wizard steps={steps} current={current} orientation={vertical ? "vertical" : "horizontal"} variant="numbered" linear onStepClick={(i) => go(i)} className="min-h-0 flex-1 gap-0 lg:flex-col lg:items-stretch lg:gap-0">
        <div className={cn("flex min-h-0 flex-1 flex-col gap-6 px-4 pt-4 pb-6 md:px-6", vertical && "lg:flex-row lg:items-start lg:gap-8")}>
          <div className={cn("min-w-0 border-b border-border pb-4", vertical && "lg:sticky lg:top-14 lg:w-60 lg:shrink-0 lg:border-b-0 lg:pb-0")} data-region="rail">
            {/* The DS caps a rail of more than 5 steps at 24rem and scrolls it, which cut Review off; six steps fit as they are. */}
            <WizardNav className={vertical ? "max-h-none overflow-visible" : undefined} />
          </div>
          <WizardContent className="min-w-0">
            <section aria-labelledby={`wizard-step-heading-${step.id}`} className="flex min-w-0 flex-col gap-4 [&_[class*=dvh-5]]:min-h-0" data-region="step">
              <div className="flex min-h-8 flex-wrap items-center justify-between gap-3">
                <WizardStepHeading id={step.id} className={cn(TYPE.section, "mb-0")}>{heading}</WizardStepHeading>
                <div ref={setActionsTarget} className="flex flex-wrap items-center gap-2 empty:hidden" data-step-actions />
              </div>
              <EmbeddedStepProvider value={embedded}>
                <StepBody id={step.id} skipped={skipped} onOpen={openFromReview} skillsStep={skillsStep} gateCue={gateCue} />
              </EmbeddedStepProvider>
            </section>
          </WizardContent>
        </div>
        <footer className="sticky bottom-0 z-40 flex flex-wrap items-center justify-between gap-3 rounded-b-xl border-t border-border bg-background px-4 py-3 md:px-6" data-region="footer" data-wizard-footer>
          <div>{current > 0 ? <Button type="button" variant="outline" size="default" onClick={onBack}>Back</Button> : null}</div>
          <div className="flex flex-wrap items-center justify-end gap-3">
            {failed === step.id ? (
              <p role="alert" className={cn("flex items-center gap-2 text-sm", WARN_TEXT)} data-gate-error>
                <i className="fa-solid fa-triangle-exclamation" aria-hidden="true" />
                {gateMessage(step.id)}
              </p>
            ) : null}
            {step.optional ? <Button type="button" variant="ghost" size="default" onClick={onSkip}>Skip</Button> : null}
            <Button type="button" variant="default" size="default" onClick={isLast ? finish : onNext} data-wizard-primary>{primaryLabel}</Button>
          </div>
        </footer>
      </Wizard>
    </div>
  )
}

function StepBody({ id, skipped, onOpen, skillsStep, gateCue }: { id: SetupStepId; skipped: SetupStepId[]; onOpen: (id: SetupStepId, extra?: Record<string, string>) => void; skillsStep: SkillsStepDesign; gateCue: GateCue }) {
  if (id === "skills") return skillsStep === "list" ? <SkillsListStep gateCue={gateCue} /> : <SkillsAddStep />
  if (id === "categories") return <AdminCategoriesTagsA />
  if (id === "settings") return <AdminEvaluationSettingsB />
  if (id === "assign") return <AssignStep />
  if (id === "mapping") return <AdminCourseMappingB />
  return <ReviewStep skipped={skipped} onOpen={onOpen} />
}

/** Skill lists: the same page, table and panel as the hub, so Add students is the same dialog here (designer 2026-11-05, D-L106). The wizard's Next has nothing to save: everything acts at once. */
function AssignStep() {
  return <ListsFrame variant="setup">{(c) => <GroupsActionTable c={c} />}</ListsFrame>
}

type ReviewState = "done" | "attention" | "skipped" | "optional"
const STATE_BADGE: Record<ReviewState, { label: string; tone: "neutral" | "warning"; icon: string }> = {
  done: { label: "Done", tone: "neutral", icon: "fa-circle-check" },
  attention: { label: "Needs attention", tone: "warning", icon: "fa-triangle-exclamation" },
  skipped: { label: "Skipped", tone: "neutral", icon: "fa-circle-minus" },
  optional: { label: "Optional", tone: "neutral", icon: "fa-circle-dashed" },
}

/**
 * Review: one row per wizard step, in the rail's words (the Setup summary recap's figures regrouped by step: Skill lists and
 * Assign are one step here). Only a required step can need attention; an optional step reads Skipped, Optional (with what is
 * left as a plain count) or Done. Every name and figure reopens its step inside this workflow, whose primary then returns here.
 */
function ReviewStep({ skipped, onOpen }: { skipped: SetupStepId[]; onOpen: (id: SetupStepId, extra?: Record<string, string>) => void }) {
  const { recap } = useSetupResult()
  const rows = SETUP_STEPS.filter((d) => d.id !== "review").map((def) => {
    const parts = recap.filter((r) => RECAP_TO_STEP[r.step] === def.id)
    const fixes = parts.flatMap((r) => r.fixes)
    const inPlace = parts.flatMap((r) => r.inPlace)
    const attention = parts.some((r) => r.state === "attention")
    const state: ReviewState = def.optional ? (skipped.includes(def.id) ? "skipped" : fixes.length ? "optional" : "done") : attention ? "attention" : "done"
    return { def, fixes, inPlace, state, params: parts[0]?.params }
  })
  const figures = (id: SetupStepId, list: RecapFigure[]) =>
    list.length ? (
      <span className="flex flex-wrap gap-x-3 gap-y-1">
        {list.map((f) => (
          <Button key={f.text} type="button" variant="link" size="sm" className="h-auto p-0 font-normal tabular-nums" onClick={() => onOpen(id, f.params)} data-recap-figure={f.fix ? "fix" : "in-place"}>
            {f.text}
          </Button>
        ))}
      </span>
    ) : (
      <span className={TYPE.helper}>None</span>
    )
  type ReviewRow = (typeof rows)[number] & Record<string, unknown>
  const columns: ColumnDef<ReviewRow>[] = [
    {
      key: "step",
      label: "Step",
      width: 170,
      cell: (r) => (
        <Button type="button" variant="link" size="sm" className="h-auto p-0 font-medium" onClick={() => onOpen(r.def.id, r.params)} data-review-row={r.def.id}>
          {stepLabel(r.def.id, r.def.label)}
        </Button>
      ),
    },
    {
      key: "state",
      label: "State",
      width: 140,
      cell: (r) => {
        const b = STATE_BADGE[r.state]
        return <StatusBadge label={b.label} tone={b.tone} icon={b.icon} size="sm" surface="table" />
      },
    },
    { key: "fixes", label: "To do", width: 280, cell: (r) => figures(r.def.id, r.fixes) },
    { key: "inPlace", label: "In place", width: 340, cell: (r) => figures(r.def.id, r.inPlace) },
  ]
  return (
    <div data-region="recap">
      <DataTable<ReviewRow>
        data={rows as ReviewRow[]}
        columns={columns}
        getRowId={(r) => r.def.id}
        selectable={false}
        searchable={false}
        showQueryControls={false}
        edgeInset={false}
        emptyState={<EmptyBlock compact title={`No ${skillNounPlural()} set up yet`} />}
      />
    </div>
  )
}
