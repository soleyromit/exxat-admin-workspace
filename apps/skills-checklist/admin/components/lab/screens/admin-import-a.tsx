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
  ConfirmSummary,
  ImportAnswers,
  ReadingState,
  ReviewSummary,
  TargetField,
  useCancel,
} from "@/components/lab/import/import-parts"
import { useImportSession } from "@/components/lab/import/use-import-session"
import { pushPageUrl } from "@/components/lab/shared/unsaved-guard"
import { importListIds, plainLinesOf } from "@/lib/lab/import"
import { createList, diffLists, programLists, seedLists, uploadToList } from "@/lib/lab/lists"
import { useLabHref } from "@/components/lab/lab-bar/page-context"
import { FROM_PARAM } from "@/lib/lab/return-to"
import { UPLOAD_RESULT_KEY } from "@/lib/lab/upload-result"
import { addSkillsToStore, draftToSkill, EMPTY_DRAFT, normName, setSkillDetailsInStore } from "@/lib/lab/library"
import { useV2Store } from "@/lib/v2/react"
import { IDS } from "@/lib/v2/seed-core"
import { ensureVocab } from "@/lib/v2/vocabulary"
import { LaterTitle } from "@/components/lab/import/sample-badge"
import { TYPE } from "@/components/lab/type-scale"
import { cn } from "@exxatdesignux/ui/lib/utils"
import { capitalize, countSkills, skillListNoun, skillListsNoun, skillNoun, skillNounPlural } from "@/lib/lab/terms"

const STEP_IDS = ["upload", "review", "fix", "confirm"] as const
type StepId = (typeof STEP_IDS)[number]
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
  "Upload a file",
  "Review what was read",
  "Fix the lines",
  `Ready to create your ${skillNounPlural()}?`,
]
/** Confirm's heading: the button's action in full, with the whole list name (the button may shorten it). */
export function confirmHeading(session: ReturnType<typeof useImportSession>, total: number): string {
  if (session.listPlan) return session.listPlan.added ? `Add ${countSkills(session.listPlan.added)} to ${session.listPlan.listName}` : `Nothing new for ${session.listPlan.listName}`
  if (session.isNewList) return `Add ${countSkills(session.newListCount)} to ${session.newLibraryName.trim()}`
  return total ? `Create ${countSkills(total)} in the library` : "Nothing new to create"
}
/** "Add 104 skills to Core clinical skills v2", or "... to the list" when the name would make it long; "Create 5 skills" for the library. */
export function primaryLabel(session: ReturnType<typeof useImportSession>, total: number): string {
  const fits = (name: string) => name.trim().split(/\s+/).length <= 3
  if (session.listPlan) return `Add ${countSkills(session.listPlan.added)} to ${fits(session.listPlan.listName) ? session.listPlan.listName.trim() : "the list"}`
  if (session.isNewList) return `Add ${countSkills(session.newListCount)} to ${fits(session.newLibraryName) ? session.newLibraryName.trim() : "the new list"}`
  return total === 0 ? `Create ${skillNounPlural()}` : `Create ${countSkills(total)}`
}
/** Where Confirm's Back goes (walk 3, D6): Fix when the file had lines to fix, decided or still open; Review when it had none. */
export function confirmBackStep(open: number, fixGroups: number): 1 | 2 {
  return open > 0 || fixGroups > 0 ? 2 : 1
}
const lines = (n: number) => `${n.toLocaleString("en-US")} ${n === 1 ? "line" : "lines"}`
/** One left axis for step 1: the select and the drop target share the left edge and this maximum width. */
const UPLOAD_COLUMN = "w-full max-w-[40rem]"

export function AdminImportA() {
  const session = useImportSession()
  const store = useV2Store()
  const router = useLabRouter()
  const params = useSearchParams()
  const [createdCount, setCreatedCount] = React.useState<number | undefined>(undefined)
  // The list an upload from the Library made or added to: Done offers to open it.
  const [landedList, setLandedList] = React.useState<{ listId: string; listName: string } | null>(null)
  // Only what the admin confirmed reaches the library, and it arrives not configured [REQ IM-05, IM-09], with the import's name so it can be told apart [REQ IM-11].
  const to = useLabHref()
  const cameFromList = params?.get(FROM_PARAM) === "lists"
  const createSkills = () => {
    // What Undo puts back on Skill lists: the lists as they were, not the skills (they stay in the library).
    const beforeEdits = store.getSnapshot().listEdits ?? null
    const ready = session.resolved.filter((r) => r.status === "ready")
    const at = new Date().toISOString()
    const stamp = Date.now().toString(36)
    const fresh = ready.filter((r) => !r.replaces)
    const added = fresh.map((r, i) => draftToSkill({ ...EMPTY_DRAFT, name: r.name, category: r.section ?? "", section: r.section ?? "" }, `sk-import-${stamp}-${i}`))
    const ids = new Set(added.map((a) => a.id))
    const categories = [...new Set(ready.map((r) => r.section).filter((x): x is string => !!x))]
    // A list chosen as the destination also gets the skills, alongside its own; a new list is made with them [INFER, approved by Romit 2026-11-15].
    const createdByRow = new Map(fresh.map((r, i) => [r.row.id, added[i]!.id]))
    const listIds = session.review ? importListIds(session.review, session.resolved, (rowId) => createdByRow.get(rowId) ?? rowId) : []
    let landed: { listId: string; listName: string; added: number } | null = null
    store.update((st) => {
      let next = addSkillsToStore(ensureVocab(st, "categories", categories, IDS.ross, at), added, IDS.ross, at, { id: `batch-${stamp}`, kind: "file-import", label: session.batchName })
      for (const r of ready) {
        if (!r.replaces) continue
        const twin = next.skills.find((k) => normName(k.name) === normName(r.replaces!))
        if (twin && r.section) next = setSkillDetailsInStore(next, [twin.id], { category: r.section }, IDS.ross, at)
      }
      next = { ...next, skills: next.skills.map((k) => (ids.has(k.id) ? { ...k, model: null, configured: false, published: false, config: null } : k)) }
      if (session.targetList || session.isNewList) {
        const base = next.ownListsOnly ? [] : seedLists(next)
        const baseIds = new Set(base.map((b) => b.id))
        const current = programLists(next)
        let lists = current
        if (session.isNewList) {
          const made = createList(current, { name: session.newLibraryName, noun: skillNoun(), nounPlural: skillNounPlural(), standard: "", fromListId: null, fromSkillIds: listIds }, `list-${stamp}`)
          lists = [...current, made]
          landed = { listId: made.id, listName: made.name, added: made.skillIds.length }
        } else {
          const r = uploadToList(current, session.targetList!.id, listIds, `list-${stamp}`)
          if (r) { lists = r.lists; landed = { listId: r.listId, listName: r.listName, added: r.added } }
        }
        next = { ...next, listEdits: diffLists(base, lists, lists.filter((l) => !baseIds.has(l.id))) }
      }
      return next
    })
    // From a list's panel, the upload ends where it began: Skill lists, that list's panel open, the result in a banner with Undo.
    if (cameFromList && landed) {
      const { listId, listName, added: n } = landed as { listId: string; listName: string; added: number }
      try { window.sessionStorage.setItem(UPLOAD_RESULT_KEY, JSON.stringify({ listId, listName, added: n, before: beforeEdits, after: store.getSnapshot().listEdits ?? null })) } catch { /* the banner is a convenience */ }
      router.push(to("admin/lists-cohorts", { list: listId, uploaded: "1" }))
      return
    }
    if (landed) setLandedList(landed)
    // Done says what reached the destination: for a list, what went on it (de-duplicated), as Confirm said.
    setCreatedCount(landed && session.targetList ? (landed as { added: number }).added : ready.length)
    session.confirm()
  }
  // A list we can read here is read for real. PDF, Word and Excel still show the sample until reading them is built.
  const onFiles = async (files: File[]) => {
    // A new file starts on Upload, whatever step an earlier one left in the URL.
    if (asked > 0 || (moved ?? 0) > 0) { setMoved(0); window.history.replaceState(null, "", stepUrl(0)) }
    const file = files[0]
    if (file && /\.(csv|txt)$/i.test(file.name)) {
      session.readText(plainLinesOf(await file.text(), file.name))
      session.setBatchName(file.name)
    } else session.readFiles(files)
  }
  const { onCancel, dialog } = useCancel(session, (href) => router.push(href), { stepsInUrl: true })
  const title = <LaterTitle>Bulk upload</LaterTitle>
  const cancel = <Button type="button" variant="outline" size="sm" onClick={onCancel}>Cancel</Button>

  // The step is in the URL (?step=review|fix|confirm; walk 3, D1), each a history entry of this page, so browser Back and Forward move between
  // steps, and Back past Upload asks before the file is lost (useCancel). A step past Upload needs a file read: without one it shows Upload.
  const asked = STEP_IDS.indexOf((params?.get("step") ?? "") as StepId)
  // The step just asked for, until the URL says it: the router reads a written address a moment later, and the page must not wait for it.
  const [moved, setMoved] = React.useState<number | null>(null)
  const query = params?.toString() ?? ""
  React.useEffect(() => setMoved(null), [query])
  const step = session.phase === "done" ? 3 : session.phase === "review" ? moved ?? Math.max(0, asked) : 0
  const stepUrl = (i: number) => {
    const u = new URL(window.location.href)
    if (i > 0) u.searchParams.set("step", STEP_IDS[i]!)
    else u.searchParams.delete("step")
    return `${u.pathname}${u.search}`
  }

  // Demo states and the paste hand-off open on the step they show (replacing the entry, so Back does not stop on Upload first); a file read live
  // stays on Upload until Next is pressed.
  const autoStepped = React.useRef<string | null>(null)
  React.useEffect(() => {
    if (session.phase !== "review") { if (session.phase !== "done") autoStepped.current = null; return }
    const key = `${session.demo ?? ""}|${session.fromPaste}`
    if (autoStepped.current === key || (!session.demo && !session.fromPaste)) return
    autoStepped.current = key
    if (asked >= 0) return
    const to = session.demo === "clear" ? 3 : 1
    setMoved(to)
    window.history.replaceState(null, "", stepUrl(to))
  }, [session.phase, session.demo, session.fromPaste, asked])

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
  const go = (i: number) => {
    const to = Math.max(0, Math.min(3, i))
    if (to === step) return
    setMoved(to)
    pushPageUrl(stepUrl(to))
  }

  let footer: StickyFooterProps
  if (done) {
    footer = { secondary: { label: "Import another file", onClick: () => { session.reset(); go(0) } }, primary: landedList ? { label: `Open ${landedList.listName}`, href: to("admin/skills-library", { list: landedList.listId }) } : { label: `Open ${skillListsNoun()}`, href: to("admin/lists-cohorts") } }
  } else if (step === 0) {
    const reason = session.phase === "reading" ? "Reading the file" : session.phase === "failed" ? "Choose a file that can be read." : session.phase === "review" ? undefined : "Choose a file first."
    footer = { primary: { label: "Next", onClick: () => { if (session.isNewList && session.nameError) { session.setNameTried(true); requestAnimationFrame(() => document.getElementById("import-new-list-name")?.focus()); return } go(1) }, disabled: !!reason, disabledReason: reason } }
  } else if (step === 1) {
    footer = {
      back: { onClick: () => go(0) },
      primary: left > 0 ? { label: `Fix ${lines(left)}`, onClick: () => go(2) } : { label: "Next", onClick: () => go(3) },
    }
  } else if (step === 2) {
    footer = {
      back: { onClick: () => go(1) },
      // The open count is in the step's toolbar; the reason says what to do, not the number again.
      primary: { label: "Next", onClick: () => go(3), disabled: left > 0, disabledReason: "Decide every line first." },
    }
  } else {
    footer = {
      // Back to Fix when this file had lines to fix, decided or not (walk 3, D6): Confirm is reached from Fix, so Back returns there.
      back: { onClick: () => go(confirmBackStep(left, session.groups.length)) },
      // Nothing new to make but skills to put on a list: the button says that, not "Create 0 skills".
      // One label for the outcome (2026-11-15): to a list it is what goes on the list (the new ones are made on the way); to the library, what is made.
      primary: { label: primaryLabel(session, total), onClick: createSkills, disabled: total === 0 && (session.listPlan ? session.listPlan.added === 0 : !session.isNewList), disabledReason: session.listPlan ? `These ${skillNounPlural()} are on the list already.` : "Nothing new to create." },
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
        stepTitle={done ? `Your ${skillNounPlural()} are in the library` : step === 3 && session.phase === "review" ? confirmHeading(session, total) : STEP_TITLE[step]}
        onStepClick={(i) => { if (!done && i < step) go(i) }}
        footer={<StickyFooter {...footer} />}
      >
        <div data-import-lab="A" className="contents">
          <WizardPanel step={0} className="flex flex-col gap-6">
            {/* Steps v4 (concept 1A): the same two answers Confirm shows, asked here once: where they go, then the file. The destination comes
                first and in plain view (Romit 2026-10-27). No promise tiles and no large drawing: the rail already says the file is reviewed
                and fixed before anything is added (D-L34). */}
            <div className={cn("grid grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-[7rem_minmax(0,1fr)]", UPLOAD_COLUMN)} data-import-answers-form>
              <h3 id="import-where" className={cn(TYPE.label, "sm:pt-2")}>{capitalize(skillListNoun())}</h3>
              <section aria-labelledby="import-where" data-import-section>
                <TargetField session={session} labelledBy="import-where" />
              </section>
              <h3 id="import-file" className={cn(TYPE.label, "sm:pt-2")}>File</h3>
              <section aria-labelledby="import-file" className="flex min-w-0 flex-col gap-4" data-import-file>
                {session.phase === "reading" ? (
                  <ReadingState session={session} />
                ) : session.phase === "failed" ? (
                  <FailedState session={session} />
                ) : session.phase === "review" ? (
                  <FileStatus session={session} />
                ) : (
                  <Dropzone compact hint="Accepts PDF, Word or Excel files in any layout." onFiles={onFiles} />
                )}
              </section>
            </div>
          </WizardPanel>
          <WizardPanel step={1} className="flex flex-col gap-6">
            {session.phase === "review" ? (
              <>
                <ImportAnswers session={session} onChange={() => go(0)} />
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
                {/* The heading says what the button does; the summary, any new-version notice and the lines by outcome follow (ConfirmSummary). */}
                <ConfirmSummary session={session} onChange={() => go(0)} />
              </div>
            ) : null}
          </WizardPanel>
        </div>
      </WizardPage>
      {dialog}
    </>
  )
}
