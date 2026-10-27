"use client"

/**
 * Admin import, variant A (option set 1, Guided, recommended). Template T2 wizard in the DS vertical rail, the same pattern as
 * Configure A (components/lab/layout/wizard-page.tsx): Upload > Review > Fix > Confirm.
 * Spec: docs/knowledge/design/skill-setup-journey/02 section 3.0 to 3.4; layout rules 01 (L1 to L12). Romit 2026-10-27: one left
 * axis, numbered sections in the configure style, no oversized drop box, the standard footer (Back slot left, primary right).
 * - Upload: 1 "Where should they go?" (Select of groups of skills, J1), 2 "Your file" (a compact drop target). Next stays
 *   disabled, with its reason, until a file is read.
 * - Review: one sentence with the engine's figures and the file's own categories, collapsed, with counts (J2, J3).
 * - Fix: one counts line, "Accept all suggestions" at the top (with Undo), groups as header strips with one Accept each. A
 *   group whose lines share one suggestion starts folded; a mixed one opens. Continue is enabled only when no line is open.
 * - Confirm: numbered sections; one plan sentence; every skill arrives not configured; no evaluation model is proposed
 *   [REQ SC-02, IM-09]. Nothing is created before Create on this step [REQ IM].
 * One filled primary per step, always in the sticky footer. Demo states: ?state=empty|reading|failed|review|clear|large|done
 * (set from the lab bar's Scenario menu, never from the page). ?source=paste&step=fix opens a list pasted in add a skill.
 */
import * as React from "react"
import { useLabRouter } from "@/components/lab/lab-bar/lab-link"
import { useSearchParams } from "next/navigation"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import { Skeleton } from "@exxatdesignux/ui/components/ui/skeleton"
import { WizardPanel, type WizardStep } from "@exxatdesignux/ui/components/ui/wizard"
// Direct module paths (not the layout barrel) so the DS gate follows them to PageHeader and Wizard.
import { StickyFooter, type StickyFooterProps } from "@/components/lab/layout/sticky-footer"
import { WizardPage } from "@/components/lab/layout/wizard-page"
import {
  CategoryList,
  DoneBanner,
  Dropzone,
  FailedState,
  FileStatus,
  FixIntro,
  FixList,
  ImportNameField,
  ImportSection,
  LIBRARY_HREF,
  NewListField,
  NotCreatedList,
  ReadingState,
  ReviewSummary,
  TargetField,
  useCancel,
} from "@/components/lab/import/import-parts"
import { useImportSession } from "@/components/lab/import/use-import-session"
import { confirmSentence } from "@/lib/lab/import"
import { LaterTitle } from "@/components/lab/import/sample-badge"
import { TYPE } from "@/components/lab/type-scale"
import { countSkills, skillNoun, skillNounPlural } from "@/lib/lab/terms"

const STEPS: WizardStep[] = [
  { id: "upload", label: "Upload" },
  { id: "review", label: "Review" },
  { id: "fix", label: "Fix" },
  { id: "confirm", label: "Confirm" },
]
/**
 * One visible step heading per step, in the step's own words (Romit 2026-10-27: the title must match what the step asks).
 * The rail keeps the one-word label; numbered sections inside a step use the configure section style.
 */
const STEP_TITLE = [
  `Upload your ${skillNounPlural()} list`,
  "Is this what your file holds?",
  "What should happen to these lines?",
  `Ready to create your ${skillNounPlural()}?`,
]
const lines = (n: number) => `${n.toLocaleString("en-US")} ${n === 1 ? "line" : "lines"}`
/** One left axis for step 1: the select and the drop target share the left edge and this maximum width. */
const UPLOAD_COLUMN = "w-full max-w-[40rem]"

export function AdminImportA() {
  const session = useImportSession()
  const router = useLabRouter()
  const params = useSearchParams()
  const [step, setStep] = React.useState(0)
  const { onCancel, dialog } = useCancel(session, (href) => router.push(href))
  const title = <LaterTitle>Bulk upload</LaterTitle>
  const cancel = <Button type="button" variant="outline" size="sm" onClick={onCancel}>Cancel</Button>

  // Demo states and the paste hand-off open on the step they show; a file read live stays on Upload until Next is pressed.
  const autoStepped = React.useRef<string | null>(null)
  React.useEffect(() => {
    if (session.phase === "empty" || session.phase === "reading" || session.phase === "failed") {
      setStep(0)
      autoStepped.current = null
      return
    }
    if (session.phase === "done") { setStep(3); return }
    const key = `${session.demo ?? ""}|${session.fromPaste}`
    if (autoStepped.current === key || (!session.demo && !session.fromPaste)) return
    autoStepped.current = key
    setStep(session.demo === "clear" ? 3 : session.fromPaste && params?.get("step") === "fix" ? 2 : 1)
  }, [session.phase, session.demo, session.fromPaste, params])

  if (!session.hydrated) {
    return (
      <WizardPage layout="rail" title={title} actions={cancel} steps={STEPS} current={0} stepTitle={STEP_TITLE[0]} footer={<StickyFooter primary={{ label: "Next", disabled: true, disabledReason: "Loading" }} />}>
        <WizardPanel step={0}>
          <div role="status" aria-busy="true" aria-label="Loading" className={`flex flex-col gap-3 ${UPLOAD_COLUMN}`}>
            <Skeleton aria-hidden="true" className="h-9 w-full max-w-md" />
            <Skeleton aria-hidden="true" className="h-24 w-full" />
          </div>
        </WizardPanel>
      </WizardPage>
    )
  }

  const left = session.left
  const total = session.plan.create + session.plan.replace
  const done = session.phase === "done"
  const go = (i: number) => setStep(Math.max(0, Math.min(3, i)))

  let footer: StickyFooterProps
  if (done) {
    footer = { secondary: { label: "Import another file", onClick: () => { session.reset(); go(0) } }, primary: { label: "Open the library", href: LIBRARY_HREF } }
  } else if (step === 0) {
    const reason = session.phase === "reading" ? "Reading the file" : session.phase === "failed" ? "Choose a file that can be read." : session.phase === "review" ? undefined : "Choose a file first."
    footer = { primary: { label: "Next", onClick: () => go(1), disabled: !!reason, disabledReason: reason } }
  } else if (step === 1) {
    footer = {
      back: { onClick: () => go(0) },
      primary: left > 0 ? { label: `Fix ${lines(left)}`, onClick: () => go(2) } : { label: "Next", onClick: () => go(3) },
    }
  } else if (step === 2) {
    footer = {
      back: { onClick: () => go(1) },
      primary: { label: "Next", onClick: () => go(3), disabled: left > 0, disabledReason: `${lines(left)} left to decide.` },
    }
  } else {
    const reason = left > 0 ? "Decide the lines left in Fix first." : session.isNewList && !session.newLibraryName.trim() ? `Name the new group of ${skillNounPlural()} first.` : total === 0 ? `No ${skillNounPlural()} to create.` : undefined
    footer = {
      back: { onClick: () => go(left > 0 ? 2 : 1) },
      primary: { label: `Create ${countSkills(total)}`, onClick: session.confirm, disabled: !!reason, disabledReason: reason },
    }
  }

  return (
    <>
      <WizardPage
        layout="rail"
        title={title}
        actions={done ? undefined : cancel}
        steps={STEPS}
        current={step}
        stepTitle={done ? `Your ${skillNounPlural()} are in the library` : STEP_TITLE[step]}
        onStepClick={(i) => { if (!done && i < step) go(i) }}
        footer={<StickyFooter {...footer} />}
      >
        <div data-import-lab="A" className="contents">
          <WizardPanel step={0} className="flex flex-col gap-6">
            <ImportSection n={1} id="import-where" title="Where should they go?" first className={UPLOAD_COLUMN}>
              <TargetField session={session} labelledBy="import-where" />
            </ImportSection>
            <ImportSection n={2} id="import-file" title="Your file" className={UPLOAD_COLUMN}>
              {session.phase === "reading" ? (
                <ReadingState session={session} />
              ) : session.phase === "failed" ? (
                <FailedState session={session} />
              ) : session.phase === "review" ? (
                <FileStatus session={session} />
              ) : (
                <Dropzone compact onFiles={(f) => session.readFiles(f)} />
              )}
            </ImportSection>
          </WizardPanel>
          <WizardPanel step={1} className="flex flex-col gap-6">
            {session.phase === "review" ? (
              <>
                <ReviewSummary session={session} />
                <CategoryList session={session} />
              </>
            ) : null}
          </WizardPanel>
          <WizardPanel step={2} className="flex flex-col gap-4">
            {session.phase === "review" ? (
              <>
                <FixIntro session={session} />
                <FixList session={session} />
              </>
            ) : null}
          </WizardPanel>
          <WizardPanel step={3} className="flex flex-col gap-6">
            {done ? (
              <DoneBanner session={session} />
            ) : session.phase === "review" ? (
              <div className="flex flex-col gap-6" data-confirm-panel>
                <ImportSection n={1} id="confirm-what" title="What will be created" first>
                  <div className="flex flex-col gap-3">
                    <div className="flex flex-col gap-1">
                      <p className={TYPE.label} data-plan-sentence>
                        {confirmSentence(session.plan, session.targetLabel, { one: skillNoun(), many: skillNounPlural() })}
                      </p>
                      <p className={TYPE.helper}>Each starts not configured, so students cannot send it until you configure it.</p>
                    </div>
                    <NotCreatedList session={session} />
                  </div>
                </ImportSection>
                <ImportSection n={2} id="confirm-name" title="Name this import">
                  <div className="flex flex-col gap-4">
                    <NewListField session={session} />
                    <ImportNameField session={session} />
                  </div>
                </ImportSection>
              </div>
            ) : null}
          </WizardPanel>
        </div>
      </WizardPage>
      {dialog}
    </>
  )
}
