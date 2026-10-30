"use client"

/**
 * Admin import, variant B: the file beside the list. Template T4 split (full width), one page, no stepper.
 * Spec: docs/knowledge/design/skill-setup-journey/02 section 3.6 (rebuilt on the layout rules of 01).
 * Before the drop: the same dropzone hero as variant A. After it: one summary sentence, then two panes in one card, the file as
 * written on the left (40 percent) and, on the right, only the lines that need a decision (the same fix rows as variant A);
 * "Show all lines" swaps in everything read, by category. The sticky footer carries the destination, the import name and the
 * one primary, Create. Removed from the built B: the 4 KPI cards, the warning banner, the legend paragraph and the tabs.
 * Demo states as variant A (?state=...).
 */
import { TYPE } from "@/components/lab/type-scale"
import * as React from "react"
import { useLabRouter } from "@/components/lab/lab-bar/lab-link"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import { Card } from "@exxatdesignux/ui/components/ui/card"
import { Input } from "@exxatdesignux/ui/components/ui/input"
import { Label } from "@exxatdesignux/ui/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@exxatdesignux/ui/components/ui/popover"
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@exxatdesignux/ui/components/ui/resizable"
import { Skeleton } from "@exxatdesignux/ui/components/ui/skeleton"
import { ToggleSwitch } from "@exxatdesignux/ui/components/ui/toggle-switch"
import { PageFrame } from "@/components/skills/page-header"
import { LaterTitle } from "@/components/lab/import/sample-badge"
import { StickyFooter, type StickyFooterProps } from "@/components/lab/layout/sticky-footer"
import {
  CategoryList,
  DoneBanner,
  Dropzone,
  FailedState,
  FixList,
  LIBRARY_HREF,
  NewListField,
  NotCreatedList,
  ReadingState,
  ReviewSummary,
  TargetField,
  TargetSummary,
  useCancel,
} from "@/components/lab/import/import-parts"
import { useImportSession, type ImportSession } from "@/components/lab/import/use-import-session"
import { CONFIDENCE_WORD, buildSampleText, readableText, type ResolvedRow } from "@/lib/lab/import"
import { countSkills, skillNounPlural } from "@/lib/lab/terms"

const GLYPH: Record<string, { icon: string; word: string }> = {
  ready: { icon: "fa-circle-check", word: "Ready" },
  look: { icon: "fa-triangle-exclamation", word: CONFIDENCE_WORD.look },
  "left-out": { icon: "fa-circle-minus", word: "Left out" },
  furniture: { icon: "fa-minus", word: "Page line" },
  heading: { icon: "fa-heading", word: "Heading" },
}

/**
 * The file as written, line by line, read only. Choosing a line on the right (focus or click) scrolls this pane to it and marks
 * it, so the original is always beside the decision without a second set of controls.
 */
function SourcePane({ session, activeId }: { session: ImportSession; activeId: string | null }) {
  const text = session.sourceText ?? buildSampleText(session.scale)
  const lines = React.useMemo(() => text.split("\n"), [text])
  const byLine = React.useMemo(() => new Map<number, ResolvedRow>(session.resolved.map((r) => [r.row.line, r])), [session.resolved])
  const furniture = React.useMemo(() => new Set((session.review?.furniture ?? []).map((f) => f.line)), [session.review])
  const viewport = React.useRef<HTMLDivElement>(null)
  React.useEffect(() => {
    const el = activeId ? viewport.current?.querySelector<HTMLElement>(`[data-line-row="${activeId}"]`) : null
    const vp = viewport.current
    if (!el || !vp) return
    // Scroll the pane only, never the page.
    const top = el.getBoundingClientRect().top - vp.getBoundingClientRect().top + vp.scrollTop
    if (top < vp.scrollTop || top > vp.scrollTop + vp.clientHeight - el.offsetHeight) vp.scrollTop = Math.max(0, top - vp.clientHeight / 3)
  }, [activeId])
  return (
    <section aria-label="The file as written" className="flex h-full min-h-0 flex-col">
      <div className="flex min-h-11 items-center gap-2 border-b border-border px-3">
        <h2 className={`min-w-0 flex-1 truncate ${TYPE.card}`}>{session.fileName ?? "Pasted list"}</h2>
        {session.fileName ? <Button type="button" variant="ghost" size="sm" onClick={session.reset}>Choose another file</Button> : null}
      </div>
      <div ref={viewport} className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring" role="region" aria-label="Lines of the file" tabIndex={0}>
        <ol className="flex flex-col py-1">
          {lines.map((raw, i) => {
            const n = i + 1
            const row = byLine.get(n)
            const kind = row ? row.status : furniture.has(n) ? "furniture" : raw.trim() ? "heading" : "blank"
            if (kind === "blank") return <li key={n} aria-hidden="true" className="h-2" />
            const glyph = GLYPH[kind]
            const shown = row ? readableText(row.row) : raw.trim()
            const content = (
              <>
                <span className="w-8 shrink-0 text-end font-mono text-xs tabular-nums text-muted-foreground">{n}</span>
                <i className={`fa-light ${glyph.icon} w-4 shrink-0 text-center text-xs text-muted-foreground`} aria-hidden="true" />
                {shown ? (
                  <span className={`min-w-0 flex-1 truncate text-start font-mono text-xs ${row?.status === "left-out" || kind === "furniture" ? "text-muted-foreground" : "text-foreground"}`}>{shown}</span>
                ) : (
                  <span className="min-w-0 flex-1 truncate text-start text-xs italic text-muted-foreground">Text could not be read</span>
                )}
                <span className="sr-only">{glyph.word}</span>
              </>
            )
            const active = !!row && row.row.id === activeId
            return (
              <li key={n} data-line-row={row?.row.id} aria-current={active ? "true" : undefined} className={`flex h-7 items-center gap-2 px-2 ${active ? "bg-muted" : ""}`}>
                {content}
              </li>
            )
          })}
        </ol>
      </div>
    </section>
  )
}

function DecisionPane({ session, activeId, onFocusRow, showAll, setShowAll }: { session: ImportSession; activeId: string | null; onFocusRow: (id: string) => void; showAll: boolean; setShowAll: (v: boolean) => void }) {
  const switchId = React.useId()
  return (
    <section aria-labelledby={`${switchId}-h`} className="flex h-full min-h-0 flex-col">
      <div className="flex min-h-11 items-center gap-3 border-b border-border px-4">
        <h2 id={`${switchId}-h`} className={`min-w-0 flex-1 truncate ${TYPE.card}`}>{showAll ? "Every line read" : "Lines that need a decision"}</h2>
        <Label htmlFor={switchId} className="text-sm font-normal text-muted-foreground">Show all lines</Label>
        <ToggleSwitch id={switchId} checked={showAll} onChange={setShowAll} />
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
        {showAll ? (
          <CategoryList session={session} />
        ) : session.groups.length ? (
          <FixList session={session} activeId={activeId} onFocusRow={onFocusRow} />
        ) : (
          <p className="text-sm text-muted-foreground">Every line was read clearly. Nothing needs a decision.</p>
        )}
      </div>
    </section>
  )
}

/** The import name, one link in the footer, edited in a popover so the footer stays one row. */
function NameThisImport({ session }: { session: ImportSession }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button type="button" variant="link" size="sm" className="h-auto px-1 py-0">Name this import</Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="flex w-80 flex-col gap-1.5">
        <Label htmlFor="import-batch-b">Import name</Label>
        <Input id="import-batch-b" value={session.batchName} onChange={(e) => session.setBatchName(e.target.value)} />
        <p className="text-xs text-muted-foreground">{`Shown in the library next to ${skillNounPlural()} from this file.`}</p>
      </PopoverContent>
    </Popover>
  )
}

export function AdminImportB() {
  const session = useImportSession()
  const router = useLabRouter()
  const [activeId, setActiveId] = React.useState<string | null>(null)
  const [showAll, setShowAll] = React.useState(false)
  const { onCancel, dialog } = useCancel(session, (href) => router.push(href))
  const title = <LaterTitle>Bulk upload</LaterTitle>
  const done = session.phase === "done"
  const actions = done ? undefined : <Button type="button" variant="outline" size="sm" onClick={onCancel}>Cancel</Button>

  if (!session.hydrated) {
    return (
      <div data-page-type="split" className="flex w-full flex-col">
        <PageFrame title={title} actions={actions}>
          <div role="status" aria-busy="true" aria-label="Loading" className="flex flex-col gap-3"><Skeleton aria-hidden="true" className="h-6 w-1/2" /><Skeleton aria-hidden="true" className="h-96 w-full" /></div>
        </PageFrame>
      </div>
    )
  }

  const total = session.plan.create + session.plan.replace
  const left = session.left
  const reviewing = session.phase === "review"
  let footer: StickyFooterProps | null = null
  if (done) footer = { secondary: { label: "Import another file", onClick: session.reset }, primary: { label: "Open the library", href: LIBRARY_HREF } }
  else if (reviewing) {
    const reason = left > 0 ? `${left.toLocaleString("en-US")} ${left === 1 ? "line" : "lines"} left to decide.` : session.isNewList && !session.newLibraryName.trim() ? `Name the new group of ${skillNounPlural()} first.` : total === 0 ? `No ${skillNounPlural()} to create.` : undefined
    footer = {
      summary: <span className="flex flex-wrap items-center gap-x-3 gap-y-1"><TargetSummary session={session} /><NameThisImport session={session} /></span>,
      context: reason ? undefined : "All decided.",
      primary: { label: `Create ${countSkills(total)}`, onClick: session.confirm, disabled: !!reason, disabledReason: reason },
    }
  } else footer = { context: session.phase === "reading" ? "Reading the file" : undefined }

  return (
    <div data-page-type="split" className="flex w-full flex-col" data-import-lab="B">
      <PageFrame title={title} actions={actions}>
        {done ? (
          <div className="flex max-w-[60rem] flex-col gap-6"><DoneBanner session={session} /><NotCreatedList session={session} /></div>
        ) : session.phase === "empty" ? (
          <div className="flex max-w-[60rem] flex-col gap-6" data-region="panel">
            <TargetField session={session} />
            <Dropzone onFiles={(f) => session.readFiles(f)} />
          </div>
        ) : session.phase === "reading" ? (
          <div className="max-w-[60rem]" data-region="panel"><ReadingState session={session} /></div>
        ) : session.phase === "failed" ? (
          <div className="flex max-w-[60rem] flex-col gap-6" data-region="panel"><TargetField session={session} /><FailedState session={session} /></div>
        ) : (
          <>
            <ReviewSummary session={session} />
            <NewListField session={session} />
            <Card data-region="panel" className="hidden h-[max(22rem,calc(100dvh-21rem))] gap-0 overflow-hidden p-0 md:flex">
              {/* The group sets height: 100% inline, so the card carries the height. */}
              <ResizablePanelGroup orientation="horizontal" className="min-h-0">
                <ResizablePanel defaultSize="40" minSize="25">
                  <SourcePane session={session} activeId={activeId} />
                </ResizablePanel>
                <ResizableHandle withHandle />
                <ResizablePanel defaultSize="60" minSize="40">
                  <DecisionPane session={session} activeId={activeId} onFocusRow={setActiveId} showAll={showAll} setShowAll={setShowAll} />
                </ResizablePanel>
              </ResizablePanelGroup>
            </Card>
            {/* Below 768 px there is no room for two panes: only the decisions show. */}
            <div className="md:hidden" data-region="panel">
              <FixList session={session} />
            </div>
          </>
        )}
        {footer ? <StickyFooter {...footer} /> : null}
      </PageFrame>
      {dialog}
    </div>
  )
}
