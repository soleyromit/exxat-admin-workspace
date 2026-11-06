"use client"

/**
 * Admin import, variant A (option set 1, Guided, recommended). Template T2 wizard in the DS vertical rail, the same pattern as
 * Configure A (components/lab/layout/wizard-page.tsx): Upload > Review > Fix > Confirm.
 * Spec: docs/knowledge/design/skill-setup-journey/02 section 3.0 to 3.4; layout rules 01 (L1 to L12). Romit 2026-10-27: one left
 * axis, numbered sections in the configure style, no oversized drop box, the standard footer (Back slot left, primary right).
 * - Upload: 1 "Where should they go?" (Select of skill lists, J1), 2 "Your file" (a compact drop target). Next stays
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
import { SceneArt, SectionTitle, SetupPrompt } from "@/components/lab/first-run"
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
  LIBRARY_HREF,
  NewListField,
  NotCreatedList,
  ReadingState,
  ReviewSummary,
  TargetField,
  useCancel,
} from "@/components/lab/import/import-parts"
import { useImportSession } from "@/components/lab/import/use-import-session"
import { confirmSentence, notCreated, plainLinesOf } from "@/lib/lab/import"
import { addSkillsToStore, draftToSkill, EMPTY_DRAFT, normName, setSkillDetailsInStore } from "@/lib/lab/library"
import { useV2Store } from "@/lib/v2/react"
import { IDS } from "@/lib/v2/seed-core"
import { ensureVocab } from "@/lib/v2/vocabulary"
import { cn } from "@exxatdesignux/ui/lib/utils"
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
  const store = useV2Store()
  const [createdCount, setCreatedCount] = React.useState<number | undefined>(undefined)
  // Only what the admin confirmed reaches the library, and it arrives not configured [REQ IM-05, IM-09], with the import's name so it can be told apart [REQ IM-11].
  const createSkills = () => {
    const ready = session.resolved.filter((r) => r.status === "ready")
    const at = new Date().toISOString()
    const stamp = Date.now().toString(36)
    const fresh = ready.filter((r) => !r.replaces)
    const added = fresh.map((r, i) => draftToSkill({ ...EMPTY_DRAFT, name: r.name, category: r.section ?? "", section: r.section ?? "" }, `sk-import-${stamp}-${i}`))
    const ids = new Set(added.map((a) => a.id))
    const categories = [...new Set(ready.map((r) => r.section).filter((x): x is string => !!x))]
    store.update((st) => {
      let next = addSkillsToStore(ensureVocab(st, "categories", categories, IDS.ross, at), added, IDS.ross, at, { id: `batch-${stamp}`, kind: "file-import", label: session.batchName })
      for (const r of ready) {
        if (!r.replaces) continue
        const twin = next.skills.find((k) => normName(k.name) === normName(r.replaces!))
        if (twin && r.section) next = setSkillDetailsInStore(next, [twin.id], { category: r.section }, IDS.ross, at)
      }
      return { ...next, skills: next.skills.map((k) => (ids.has(k.id) ? { ...k, model: null, configured: false, published: false, config: null } : k)) }
    })
    setCreatedCount(ready.length)
    session.confirm()
  }
  // A list we can read here is read for real. PDF, Word and Excel still show the sample until reading them is built.
  const onFiles = async (files: File[]) => {
    const file = files[0]
    if (file && /\.(csv|txt)$/i.test(file.name)) {
      session.readText(plainLinesOf(await file.text(), file.name))
      session.setBatchName(file.name)
    } else session.readFiles(files)
  }
  const leftBehind = notCreated(session.resolved)
  const notAdded = leftBehind.leftOut.length + leftBehind.merged.length + leftBehind.joined.length
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
    footer = {
      back: { onClick: () => go(left > 0 ? 2 : 1) },
      primary: { label: `Create ${countSkills(total)}`, onClick: createSkills },
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
            {/* The file comes first: it is why the admin is here. What happens next is said once, under it, so nothing about a file feels final [REQ IM-03, IM-05, IM-08]. */}
            <section aria-label="Your file" className="flex flex-col gap-4" data-import-file>
              {session.phase === "reading" ? (
                <ReadingState session={session} />
              ) : session.phase === "failed" ? (
                <FailedState session={session} />
              ) : session.phase === "review" ? (
                <FileStatus session={session} />
              ) : (
                <>
                  <Dropzone art={<SceneArt scene="upload" className="block w-52" />} hint="PDF, Word or Excel, any layout." onFiles={onFiles} />
                  <ul className="grid gap-4 md:grid-cols-3" data-import-promises>
                    {[
                      ["fa-file-lines", "No template", `Your list as it is. We look for names, descriptions and headings.`],
                      ["fa-list-check", "You check it first", `Nothing is added until you confirm.`],
                      ["fa-magnifying-glass", "Nothing goes missing", `Any line we cannot read is shown to you.`],
                    ].map(([icon, title, body]) => (
                      <li key={title} className="flex items-start gap-3">
                        <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-brand-tint text-brand"><i className={`fa-light ${icon} text-xs`} aria-hidden="true" /></span>
                        <span className="flex min-w-0 flex-col gap-0.5"><span className={TYPE.label}>{title}</span><span className={TYPE.meta}>{body}</span></span>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </section>
            <section aria-labelledby="import-where" className="flex flex-col gap-2 border-t border-border pt-6" data-import-section>
              <h3 id="import-where" className={TYPE.card}>Where should they go?</h3>
              <TargetField session={session} labelledBy="import-where" className={UPLOAD_COLUMN} />
            </section>
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
              <DoneBanner session={session} count={createdCount} />
            ) : session.phase === "review" ? (
              <div className="flex flex-col gap-6" data-confirm-panel>
                {/* The answer first: what the button will do. Then what it will not, then the one thing left to type. */}
                <SetupPrompt
                  scene="upload"
                  text={
                    <div className="flex flex-col gap-1">
                      <p className={cn(TYPE.card, "text-foreground")} data-plan-sentence>{confirmSentence(session.plan, session.targetLabel, { one: skillNoun(), many: skillNounPlural() })}</p>
                      <p>{`They start not configured. You set how they are judged next.`}</p>
                    </div>
                  }
                />
                {notAdded ? (
                  <section aria-labelledby="confirm-not" className="flex flex-col gap-2">
                    <SectionTitle icon="fa-file-circle-minus" id="confirm-not" className={cn(TYPE.group, "flex items-baseline gap-2")}>
                      Lines not added
                      <span className="text-sm font-normal tabular-nums text-muted-foreground">{notAdded}</span>
                    </SectionTitle>
                    <NotCreatedList session={session} />
                  </section>
                ) : null}
                <section aria-labelledby="confirm-name" className="flex flex-col gap-2">
                  <SectionTitle icon="fa-tag" id="confirm-name" className={TYPE.group}>Name this import</SectionTitle>
                  <p className={TYPE.helper}>{`So you can tell later which ${skillNounPlural()} came from this file.`}</p>
                  <div className="flex flex-col gap-4">
                    <NewListField session={session} />
                    <ImportNameField session={session} />
                  </div>
                </section>
              </div>
            ) : null}
          </WizardPanel>
        </div>
      </WizardPage>
      {dialog}
    </>
  )
}
