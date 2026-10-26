"use client"

/**
 * Admin import, variant A (option set 1, Guided, recommended). Template T2 wizard (960 px): Upload > Review > Fix > Confirm.
 * Spec: docs/knowledge/design/skill-setup-journey/02 section 3.0 to 3.4; layout rules 01 (L1 to L12).
 * - Upload: the dropzone is the hero and nothing blocks it; the destination list is one "Change" line under it (J1).
 * - Review: one sentence with the engine's figures and the file's own categories, collapsed, with counts (J2, J3).
 * - Fix: only the lines that need a decision, one choice per line, grouped by kind.
 * - Confirm: one plan sentence; every skill arrives not configured; no evaluation model is proposed [REQ SC-02, IM-09].
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
  ConfirmPanel,
  DoneBanner,
  Dropzone,
  FailedState,
  FileStatus,
  FixErrorSummary,
  FixIntro,
  FixList,
  LIBRARY_HREF,
  ReadingState,
  ReviewSummary,
  TargetLine,
  useCancel,
} from "@/components/lab/import/import-parts"
import { useImportSession } from "@/components/lab/import/use-import-session"
import type { ExceptionKind } from "@/lib/lab/import"
import { LaterTitle } from "@/components/lab/import/sample-badge"
import { countSkills, skillNounPlural } from "@/lib/lab/terms"

const STEPS: WizardStep[] = [
  { id: "upload", label: "Upload" },
  { id: "review", label: "Review" },
  { id: "fix", label: "Fix" },
  { id: "confirm", label: "Confirm" },
]
const NOTHING_YET = "Nothing is created until you confirm."
const lines = (n: number) => `${n.toLocaleString("en-US")} ${n === 1 ? "line" : "lines"}`

export function AdminImportA() {
  const session = useImportSession()
  const router = useLabRouter()
  const params = useSearchParams()
  const [step, setStep] = React.useState(0)
  const [tried, setTried] = React.useState(false)
  const [openKinds, setOpenKinds] = React.useState<ExceptionKind[]>([])
  const { onCancel, dialog } = useCancel(session, (href) => router.push(href))
  const title = <LaterTitle>{`Import ${skillNounPlural()}`}</LaterTitle>
  const cancel = <Button type="button" variant="outline" size="sm" onClick={onCancel}>Cancel</Button>

  // Demo states and the paste hand-off open on the step they show; a file read live stays on Upload until Review is pressed.
  const autoStepped = React.useRef<string | null>(null)
  React.useEffect(() => {
    if (session.phase === "empty" || session.phase === "reading" || session.phase === "failed") {
      setStep(0)
      setTried(false)
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
      <WizardPage title={title} actions={cancel} steps={STEPS} current={0} footer={<StickyFooter context={NOTHING_YET} />}>
        <WizardPanel step={0}>
          <div role="status" aria-busy="true" aria-label="Loading" className="flex flex-col gap-3">
            <Skeleton aria-hidden="true" className="h-[17.5rem] w-full" />
            <Skeleton aria-hidden="true" className="h-5 w-64" />
          </div>
        </WizardPanel>
      </WizardPage>
    )
  }

  const s = session.summary
  const read = s ? s.read : 0
  const left = session.left
  const total = session.plan.create + session.plan.replace
  const done = session.phase === "done"
  const go = (i: number) => setStep(Math.max(0, Math.min(3, i)))

  let footer: StickyFooterProps
  if (done) {
    footer = { secondary: { label: "Import another file", onClick: () => { session.reset(); go(0) } }, primary: { label: "Open the library", href: LIBRARY_HREF } }
  } else if (step === 0) {
    footer = {
      context: session.phase === "reading" ? "Reading the file" : NOTHING_YET,
      ...(session.phase === "review" ? { primary: { label: `Review ${countSkills(read)}`, onClick: () => go(1) } } : {}),
    }
  } else if (step === 1) {
    footer = {
      back: { onClick: () => go(0) },
      context: s ? `${s.ready.toLocaleString("en-US")} ready.` : undefined,
      primary: left > 0 ? { label: `Fix ${lines(left)}`, onClick: () => go(2) } : { label: "Continue", onClick: () => go(3) },
    }
  } else if (step === 2) {
    footer = {
      back: { onClick: () => go(1) },
      context: left > 0 ? `${lines(left)} left.` : "All decided.",
      primary: {
        label: "Continue",
        disabled: tried && left > 0,
        disabledReason: `${lines(left)} left.`,
        onClick: () => {
          if (left > 0) {
            setTried(true)
            setOpenKinds(session.groups.filter((g) => g.open > 0).map((g) => g.kind))
            return
          }
          go(3)
        },
      },
    }
  } else {
    const reason = left > 0 ? "Decide the lines left in Fix first." : session.isNewList && !session.newLibraryName.trim() ? "Name the new list first." : total === 0 ? `No ${skillNounPlural()} to create.` : undefined
    footer = {
      back: { onClick: () => go(left > 0 ? 2 : 1) },
      primary: { label: `Create ${countSkills(total)}`, onClick: session.confirm, disabled: !!reason, disabledReason: reason },
    }
  }

  const steps = STEPS.map((st, i) => (i === 2 && tried && left > 0 ? { ...st, error: true } : st))
  const banner = step === 2 && tried && left > 0 ? <FixErrorSummary session={session} onOpen={(k) => setOpenKinds([k])} /> : undefined

  return (
    <>
      <WizardPage
        title={title}
        actions={done ? undefined : cancel}
        steps={steps}
        current={step}
        onStepClick={(i) => { if (!done && i < step) go(i) }}
        banner={banner}
        footer={<StickyFooter {...footer} />}
      >
        <div data-import-lab="A" className="contents">
          <WizardPanel step={0} className="flex flex-col gap-4">
            {session.phase === "reading" ? (
              <ReadingState session={session} />
            ) : session.phase === "failed" ? (
              <FailedState session={session} />
            ) : session.phase === "review" ? (
              <FileStatus session={session} />
            ) : (
              <Dropzone onFiles={(f) => session.readFiles(f)} />
            )}
            <TargetLine session={session} />
          </WizardPanel>
          <WizardPanel step={1} className="flex flex-col gap-6">
            {session.phase === "review" ? (
              <>
                <ReviewSummary session={session} />
                <CategoryList session={session} />
              </>
            ) : null}
          </WizardPanel>
          <WizardPanel step={2} className="flex flex-col gap-6">
            {session.phase === "review" ? (
              <>
                <FixIntro session={session} />
                <FixList session={session} openKinds={openKinds} />
              </>
            ) : null}
          </WizardPanel>
          <WizardPanel step={3} className="flex flex-col gap-6">
            {done ? <DoneBanner session={session} /> : session.phase === "review" ? <ConfirmPanel session={session} /> : null}
          </WizardPanel>
        </div>
      </WizardPage>
      {dialog}
    </>
  )
}
