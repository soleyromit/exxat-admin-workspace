"use client"

/**
 * Admin import, variant C (new): many at once. One page (960 px), no stepper. Paste the list, or drop several files on it, and
 * it is read as you type; the lines that need a decision appear below as the same fix list as variant A, and the sticky footer
 * carries the destination and the one primary, Create.
 * Question it tests: when the list arrives as an email, a spreadsheet column or several course files, is paste-and-fix on one
 * page faster than a stepper?
 * The draft is kept in sessionStorage "lab:import:paste" ({ text, category }), the key add a skill (paste several) writes, so a
 * hand-off or a reload lands on the same list. Demo states as variant A (?state=...): review and large fill the box with the
 * sample checklist; several dropped files read the larger sample (four course levels).
 */
import * as React from "react"
import { useLabRouter } from "@/components/lab/lab-bar/lab-link"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import { Field, FieldDescription, FieldLabel } from "@exxatdesignux/ui/components/ui/field"
import { Skeleton } from "@exxatdesignux/ui/components/ui/skeleton"
import { Textarea } from "@exxatdesignux/ui/components/ui/textarea"
import { cn } from "@exxatdesignux/ui/lib/utils"
import { PageFrame } from "@/components/skills/page-header"
import { LaterTitle } from "@/components/lab/import/sample-badge"
import { StickyFooter, type StickyFooterProps } from "@/components/lab/layout/sticky-footer"
import {
  ACCEPT,
  DoneBanner,
  FailedState,
  FileStatus,
  CategoryList,
  FixList,
  ImportNameField,
  LIBRARY_HREF,
  NotCreatedList,
  ReadingState,
  ReviewSummary,
  TargetField,
  useCancel,
} from "@/components/lab/import/import-parts"
import { useImportSession } from "@/components/lab/import/use-import-session"
import { PASTE_KEY, buildSampleText, parsePastePayload } from "@/lib/lab/import"
import { countSkills, skillNoun, skillNounPlural } from "@/lib/lab/terms"

const PARSE_MS = 250

function saveDraft(text: string) {
  try {
    if (text.trim()) window.sessionStorage.setItem(PASTE_KEY, JSON.stringify({ text }))
    else window.sessionStorage.removeItem(PASTE_KEY)
  } catch {
    /* storage blocked: the draft lives in the page only */
  }
}

export function AdminImportC() {
  const session = useImportSession()
  const router = useLabRouter()
  const { onCancel, dialog } = useCancel(session, (href) => router.push(href))
  const [draft, setDraft] = React.useState("")
  const [over, setOver] = React.useState(false)
  const files = React.useRef<HTMLInputElement>(null)
  const timer = React.useRef<ReturnType<typeof setTimeout> | null>(null)
  const title = <LaterTitle>Bulk upload</LaterTitle>
  const done = session.phase === "done"

  // A saved draft (or a hand-off from add a skill) is read once on arrival, unless a demo state asks for something else.
  const restored = React.useRef(false)
  React.useEffect(() => {
    if (!session.hydrated || restored.current || session.demo) return
    restored.current = true
    let payload = null
    try {
      payload = parsePastePayload(window.sessionStorage.getItem(PASTE_KEY))
    } catch {
      payload = null
    }
    if (payload) {
      setDraft(payload.text)
      session.readText(payload.category ? `${payload.category}:\n${payload.text}` : payload.text)
    }
  }, [session.hydrated, session.demo]) // eslint-disable-line react-hooks/exhaustive-deps

  // A sample read from files or a demo state shows its text in the box, so what is fixed below is what is above.
  React.useEffect(() => {
    if (session.phase === "review" && session.sourceText === null) setDraft(buildSampleText(session.scale))
  }, [session.phase, session.sourceText, session.scale])

  React.useEffect(() => () => { if (timer.current) clearTimeout(timer.current) }, [])

  const onType = (value: string) => {
    setDraft(value)
    saveDraft(value)
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => session.readText(value), PARSE_MS)
  }
  const onFiles = (list: File[]) => {
    if (!list.length) return
    setDraft("")
    saveDraft("")
    session.readFiles(list)
  }

  if (!session.hydrated) {
    return (
      <div data-page-type="wizard" className="flex w-full flex-col">
        <PageFrame title={title} width="wizard">
          <div role="status" aria-busy="true" aria-label="Loading" className="flex flex-col gap-3"><Skeleton aria-hidden="true" className="h-5 w-40" /><Skeleton aria-hidden="true" className="h-48 w-full" /></div>
        </PageFrame>
      </div>
    )
  }

  const total = session.plan.create + session.plan.replace
  const left = session.left
  const reviewing = session.phase === "review"
  let footer: StickyFooterProps
  if (done) footer = { secondary: { label: "Import another list", onClick: () => { setDraft(""); saveDraft(""); session.reset() } }, primary: { label: "Open the library", href: LIBRARY_HREF } }
  else if (reviewing) {
    const reason = left > 0 ? `${left.toLocaleString("en-US")} ${left === 1 ? "line" : "lines"} left to decide.` : session.isNewList && !session.newLibraryName.trim() ? `Name the new group of ${skillNounPlural()} first.` : total === 0 ? `No ${skillNounPlural()} to create.` : undefined
    footer = { context: reason ? undefined : "All decided.", primary: { label: `Create ${countSkills(total)}`, onClick: session.confirm, disabled: !!reason, disabledReason: reason } }
  } else footer = { context: session.phase === "reading" ? "Reading the files" : undefined }

  return (
    <div data-page-type="wizard" className="flex w-full flex-col" data-import-lab="C">
      <PageFrame title={title} width="wizard" actions={done ? undefined : <Button type="button" variant="outline" size="sm" onClick={onCancel}>Cancel</Button>}>
        {done ? (
          <div className="flex flex-col gap-6"><DoneBanner session={session} /><NotCreatedList session={session} /></div>
        ) : (
          <div className="flex flex-col gap-6" data-region="panel">
            <TargetField session={session} />
            <Field>
              <FieldLabel htmlFor="import-paste">Paste the list</FieldLabel>
              <div
                className="relative"
                onDragOver={(e) => { if (e.dataTransfer.types.includes("Files")) { e.preventDefault(); setOver(true) } }}
                onDragLeave={() => setOver(false)}
                onDrop={(e) => {
                  if (!e.dataTransfer.files.length) return
                  e.preventDefault()
                  setOver(false)
                  onFiles([...e.dataTransfer.files])
                }}
              >
                <Textarea
                  id="import-paste"
                  value={draft}
                  onChange={(e) => onType(e.target.value)}
                  aria-describedby="import-paste-help"
                  spellCheck={false}
                  placeholder={`One ${skillNoun()} per line`}
                  className={cn("min-h-48 font-mono text-sm", reviewing ? "max-h-64" : "min-h-72", over && "border-[var(--brand-color)] bg-[var(--brand-tint)]")}
                />
              </div>
              <FieldDescription id="import-paste-help">A line ending in a colon starts a category. You can also drop several files here.</FieldDescription>
            </Field>
            <input
              ref={files}
              type="file"
              accept={ACCEPT}
              multiple
              className="sr-only"
              tabIndex={-1}
              aria-hidden="true"
              onChange={(e) => { onFiles([...(e.target.files ?? [])]); e.target.value = "" }}
            />
            {session.phase === "empty" ? (
              <Button type="button" variant="outline" size="sm" className="-mt-3 w-fit" onClick={() => files.current?.click()}>Choose files</Button>
            ) : null}
            {session.phase === "reading" ? <ReadingState session={session} /> : null}
            {session.phase === "failed" ? <FailedState session={session} /> : null}
            {reviewing ? (
              <>
                {/* Files dropped here show as one line; a demo state reads the sample as if it had been pasted. */}
                {session.fileName && !session.demo ? <FileStatus session={session} /> : null}
                <ReviewSummary session={session} />
                {session.groups.length ? <FixList session={session} /> : null}
                {/* Every skill read, by category, with its own Category and Tags (REQ SL-03, SL-04; decision D-X28). */}
                <CategoryList session={session} />
                {/* Named like A and B, so the library can tell which skills came from this paste [REQ IM-11]. */}
                <ImportNameField session={session} />
              </>
            ) : null}
          </div>
        )}
        <StickyFooter {...footer} />
      </PageFrame>
      {dialog}
    </div>
  )
}
