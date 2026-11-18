"use client"

/**
 * Evaluation settings O, "Two questions and a summary, the evaluator's form always beside" (Proposed, D-EM1116-h; contract ADMIN-D3
 * "round 7 variants"). Romit 2026-11-16 on M: try the wizard for adding and editing, "but can you do it better".
 *
 * One wizard for both jobs (DS Wizard through the lab WizardPage):
 *   1. Rating: "How does the evaluator rate a skill?" The four types, nothing preselected [REQ SC-02]; what the evaluator picks and what moves
 *      a student forward appear under the tiles once a type is chosen, so the dependency is on one screen [REQ SC-17].
 *   2. Evaluators: who can evaluate, what each evaluation needs, group check-off [REQ SC-14, SC-15, SC-16].
 *   3. Summary: the name first, then the method in plain sentences in two groups, each with Change.
 * The evaluator's and student's forms are drawn beside every step from the first choice [REQ SC-19], so a later step never hides an earlier one.
 *   - Add (`?method=new`): steps 1 to 3, each checked on Continue, focus to the first problem.
 *   - Edit (`?method=<id>`): the same wizard, opened on its summary. Change opens that step; Done checks it and returns to the summary.
 *     `&step=rating|who|summary` opens a step directly (`type` is read as rating, with the four types shown).
 * Back and the stepper never lose input: the whole wizard is one draft.
 */
import * as React from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import { WizardPanel } from "@exxatdesignux/ui/components/ui/wizard"
import { cn } from "@exxatdesignux/ui/lib/utils"
import { PageFrame } from "@/components/skills/page-header"
import { TYPE } from "@/components/lab/type-scale"
import { StickyFooter } from "@/components/lab/layout/sticky-footer"
import { PreviewColumns, WizardPage, type WizardStep } from "@/components/lab/layout/wizard-page"
import { BackTitle } from "@/components/lab/shared/return-link"
import { ResultBanner, type ResultBannerValue } from "@/components/lab/shared/result-banner"
import { UnsavedChangesGuard } from "@/components/lab/shared/unsaved-guard"
import { ProgramPreview } from "@/components/lab/configure/program-preview"
import { ProgramPreviewDialog } from "@/components/lab/configure/settings-dialogs"
import { CheckOffField, LoadingBlock, MethodDraft, NEW, NameFields, NeedsField, ProblemsLink, RolesField, SETTINGS_TITLE, TypeLine, UsedBy, useAskDiscard, useMethodNav, useOpenMethod, withCarried, type MethodModel } from "@/components/lab/methods/method-parts"
import { MethodsHome, RatingFields, RatingTiles, StepProblems, WHO_AND_NEEDS_QUESTION, issuesIn, methodWords, partOf, ratingQuestion, scoped, toField, type Part } from "@/components/lab/methods/method-wizard"
import type { MethodSentence } from "@/lib/lab/method-words"
import type { EvaluationMethod } from "@/lib/lab/methods"

const STEPS = ["rating", "who", "summary"] as const
type StepId = (typeof STEPS)[number]
type Ask = Exclude<StepId, "summary">
const PARTS: Record<Ask, readonly Part[]> = { rating: ["type", "picks"], who: ["who", "needs"] }
const stepOfPart = (p: Part): Ask => (p === "type" || p === "picks" ? "rating" : "who")
const STEP_LIST: WizardStep[] = [{ id: "rating", label: "Rating" }, { id: "who", label: "Evaluators" }, { id: "summary", label: "Summary" }]

/** One group of the summary: its name, the way to change it, and what was chosen in plain sentences. */
function SummaryGroup({ id, title, lead, sentences, onChange }: { id: Ask; title: string; lead?: React.ReactNode; sentences: MethodSentence[]; onChange: () => void }) {
  return (
    <section className="flex min-w-0 flex-col gap-2 border-t border-border pt-4" aria-labelledby={`summary-${id}`} data-summary-group={id}>
      <div className="flex min-w-0 items-center justify-between gap-4">
        <h3 id={`summary-${id}`} className={TYPE.label}>{title}</h3>
        <Button type="button" variant="link" size="sm" className="h-auto min-h-6 shrink-0 p-0 font-normal" onClick={onChange} aria-label={`Change ${title.toLowerCase()}`} data-change={id}>Change</Button>
      </div>
      <ul className="flex min-w-0 flex-col gap-1">
        {lead ? <li className={cn(TYPE.body, "flex flex-wrap gap-x-2 break-words")}>{lead}</li> : null}
        {sentences.map((s) => <li key={s.id} className={cn(s.open ? TYPE.helper : TYPE.body, "break-words")}>{s.text}</li>)}
      </ul>
    </section>
  )
}

function Summary({ m, onChange }: { m: MethodModel; onChange: (s: Ask) => void }) {
  const w = methodWords(m.rule)
  return (
    <div className="flex max-w-[46rem] flex-col gap-6" data-summary>
      <div className="max-w-[30rem]"><NameFields m={m} /></div>
      <div className="flex min-w-0 flex-col gap-4">
        <SummaryGroup
          id="rating"
          title="Rating"
          lead={w.type ? <><span>{w.type}</span>{m.settled && m.method ? <span className="text-muted-foreground"><UsedBy method={m.method} linked={!m.dirty} /></span> : null}</> : null}
          sentences={w.picks}
          onChange={() => onChange("rating")}
        />
        <SummaryGroup id="who" title="Evaluators" sentences={[...w.who, ...w.needs]} onChange={() => onChange("who")} />
      </div>
    </div>
  )
}

function Steps({ m, backHref, onLeave, startAt, editing, showTypes }: { m: MethodModel; backHref: string; onLeave: () => void; startAt: StepId; /** A saved method with a type: it opens on the summary and every step returns there. */ editing: boolean; showTypes: boolean }) {
  const [step, setStep] = React.useState<StepId>(startAt)
  const [tried, setTried] = React.useState<Partial<Record<StepId, boolean>>>({})
  const [summarised, setSummarised] = React.useState(editing || startAt === "summary")
  const [changing, setChanging] = React.useState(showTypes)
  const discard = useAskDiscard()
  const { rule, method } = m
  const index = STEPS.indexOf(step)
  const here = step === "summary" ? [] : issuesIn(m, PARTS[step])
  const shown = tried[step] ? here : []
  const sm = scoped(m, !!tried[step])
  const words = methodWords(rule)
  const go = (s: StepId) => {
    setStep(s)
    if (s === "summary") setSummarised(true)
    // A new step starts at its top: the title and the stepper are in view, and the heading takes the focus.
    requestAnimationFrame(() => {
      document.querySelector("[data-back-title]")?.scrollIntoView({ block: "center" })
      document.getElementById(`wizard-step-heading-${s}`)?.focus({ preventScroll: true })
    })
  }
  /** A problem opens the step it lives in, shows there, and takes the focus. */
  const openProblem = (s: Ask) => {
    const issues = issuesIn(m, PARTS[s])
    setTried((t) => ({ ...t, [s]: true }))
    setStep(s)
    if (issues[0]) toField(m, issues[0])
  }
  const next = () => {
    if (step === "summary") {
      const r = m.save()
      if (r === "type") openProblem("rating")
      else if (r === "rule" && m.issues[0]) openProblem(stepOfPart(partOf(m.issues[0].field)))
      return
    }
    if (here.length) { setTried((t) => ({ ...t, [step]: true })); toField(m, here[0]!); return }
    go(summarised ? "summary" : STEPS[index + 1]!)
  }
  const atSummary = step === "summary"
  const quiet = editing && atSummary && !m.dirty
  const forward = words.picks.find((s) => s.id === "forward" && !s.open)
  const title = <BackTitle href={backHref} label={`Back to ${SETTINGS_TITLE}`}>{method ? method.name : "New method"}</BackTitle>
  const stepTitle = step === "rating" ? ratingQuestion() : step === "who" ? WHO_AND_NEEDS_QUESTION : undefined
  // What was chosen on the step before, in one line: the form beside it shows the rest.
  const stepLead = step === "who" && words.type ? `${words.type}.${forward ? ` ${forward.text}` : ""}` : undefined
  // No empty frame before a type is chosen: the forms take their column once there is something to draw.
  const aside = rule.model ? <ProgramPreview draft={withCarried(rule)} /> : null
  const footer = (
    <StickyFooter
      back={index > 0 && !summarised ? { onClick: () => go(STEPS[index - 1]!) } : !editing && atSummary ? { onClick: () => go("who") } : undefined}
      context={<span aria-live="assertive" aria-atomic="true">{atSummary ? <ProblemsLink m={m} /> : <StepProblems m={m} issues={shown} />}</span>}
      secondary={{ label: quiet ? "Close" : "Cancel", onClick: () => discard.ask(m.dirty, () => { m.reset(); onLeave() }) }}
      primary={quiet ? undefined : { label: atSummary ? (method ? "Save method" : "Create method") : summarised ? "Done" : "Continue", onClick: next }}
    />
  )
  // Below 1280 px the forms are not beside the step: they open from here [REQ SC-19].
  const below = rule.model ? <div className="flex justify-start min-[1280px]:hidden"><ProgramPreviewDialog draft={withCarried(rule)} variant="ghost" /></div> : null
  const body: Record<StepId, React.ReactNode> = {
    rating: (
      // The tiles use the step's width (four across on a wide screen); the fields under them keep a readable width.
      <div className="flex min-w-0 flex-col gap-6" data-step="rating">
        {/* A saved type is a fact; the four types wait behind Change type, the rarest edit [REQ SC-09]. */}
        {m.settled ? <TypeLine m={sm} changing={changing} onToggle={() => setChanging((v) => !v)} /> : null}
        {!m.settled || changing ? <RatingTiles m={sm} /> : null}
        <div className="max-w-[46rem]"><RatingFields m={sm} /></div>
        {below}
      </div>
    ),
    who: (
      <div className="flex min-w-0 flex-col gap-6" data-step="who">
        <div className="grid max-w-[46rem] min-w-0 gap-6 sm:grid-cols-2" data-region="evaluation">
          <RolesField m={sm} />
          <div className="flex min-w-0 flex-col gap-4">
            <NeedsField m={sm} />
            <CheckOffField m={sm} />
          </div>
        </div>
        {below}
      </div>
    ),
    summary: <div className="flex min-w-0 flex-col gap-6"><Summary m={m} onChange={(s) => go(s)} />{below}</div>,
  }
  return (
    <>
      {editing ? (
        // Edit has no sequence to walk: the summary is home and a step is one page away, so no stepper says "1 of 3".
        <div className="flex min-h-[calc(100dvh-5.5rem)] w-full flex-col" data-page-type="wizard" data-method-page>
          <PageFrame title={title} className="flex-1">
            <PreviewColumns
              aside={aside}
              head={stepTitle ? (
                <div className="flex flex-col gap-1" data-step-head>
                  <h2 id={`wizard-step-heading-${step}`} tabIndex={-1} className={cn(TYPE.section, "outline-none")}>{stepTitle}</h2>
                  {stepLead ? <p className={TYPE.helper}>{stepLead}</p> : null}
                </div>
              ) : <h2 id={`wizard-step-heading-${step}`} tabIndex={-1} className="sr-only">Summary</h2>}
            >
              {body[step]}
            </PreviewColumns>
            {footer}
          </PageFrame>
        </div>
      ) : (
        <WizardPage title={title} steps={STEP_LIST} current={index} onStepClick={(i) => go(STEPS[i]!)} stepTitle={stepTitle} stepLead={stepLead} aside={aside} footer={footer}>
          <WizardPanel step="rating">{body.rating}</WizardPanel>
          <WizardPanel step="who">{body.who}</WizardPanel>
          <WizardPanel step="summary">{body.summary}</WizardPanel>
        </WizardPage>
      )}
      <UnsavedChangesGuard dirty={m.dirty} onDiscard={m.reset} />
      {discard.question}
    </>
  )
}

export function AdminEvaluationSettingsO() {
  const nav = useMethodNav()
  const params = useSearchParams()
  const { open, missing, hydrated } = useOpenMethod(nav.id)
  const [banner, setBanner] = React.useState<ResultBannerValue | null>(null)
  if (nav.id && !hydrated) return <div className="p-6"><LoadingBlock /></div>
  if (open) {
    const method: EvaluationMethod | null = open === NEW ? null : open
    // A method with a saved type opens on its summary; a new one, or one with no type yet, starts at the first question.
    const editing = !!method && method.saved && !!method.rule.model
    const asked = params?.get("step")
    const startAt: StepId = !editing ? "rating" : asked === "type" ? "rating" : (STEPS as readonly string[]).includes(asked ?? "") ? (asked as StepId) : "summary"
    return (
      <>
        {banner ? <ResultBanner banner={banner} onDismiss={() => setBanner(null)} /> : null}
        <MethodDraft key={method?.id ?? NEW} method={method} onSaved={(b, id) => { setBanner(b); if (id) nav.close() }}>
          {(m) => <Steps m={m} backHref={nav.href(null)} onLeave={nav.close} startAt={startAt} editing={editing} showTypes={asked === "type"} />}
        </MethodDraft>
      </>
    )
  }
  return <MethodsHome banner={banner} setBanner={setBanner} missing={missing} />
}
