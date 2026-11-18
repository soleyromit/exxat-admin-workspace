"use client"

/**
 * Evaluation settings L, "Start from an example, edit in the row" (Proposed, D-EM1116-g; contract ADMIN-D3 "round 6 variants").
 * Romit 2026-11-16, after choosing G: "is that all the options you have considered?"
 *
 * Adding and editing are different jobs, so they get different patterns.
 *   - Add (`?method=new`): a page of starting points, six filled-in examples across the four types and "Start blank". Radios, none checked;
 *     Continue is refused until one is [REQ SC-02]. Each tile shows what the evaluator would pick and what moves a student forward, so the
 *     choice is made by recognition. Then the same page shows the editor filled from the example. An example never fills who can evaluate or
 *     a question's text, so Create cannot be pressed straight through [REQ SC-16, SC-04].
 *   - Edit (`?method=<id>`): the method's row opens in place (DS Accordion). The closed row carries the facts a table would; the open row is
 *     the editor with its own Save. No navigation and no overlay; one row open at a time, and another row asks first over unsaved work.
 */
import * as React from "react"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import { Label } from "@exxatdesignux/ui/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@exxatdesignux/ui/components/ui/radio-group"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@exxatdesignux/ui/components/ui/accordion"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@exxatdesignux/ui/components/ui/alert-dialog"
import { StatusBadge } from "@exxatdesignux/ui"
import { cn } from "@exxatdesignux/ui/lib/utils"
import { PageFrame } from "@/components/skills/page-header"
import { TYPE } from "@/components/lab/type-scale"
import { StickyFooter } from "@/components/lab/layout/sticky-footer"
import { BackTitle } from "@/components/lab/shared/return-link"
import { ResultBanner, type ResultBannerValue } from "@/components/lab/shared/result-banner"
import { RowMenu } from "@/components/lab/shared/row-menu"
import { UnsavedChangesGuard } from "@/components/lab/shared/unsaved-guard"
import { ChangedMark } from "@/components/lab/configure/settings-sheet"
import { ProgramPreviewDialog } from "@/components/lab/configure/settings-dialogs"
import { EditorColumns, LoadingBlock, MethodDraft, NEEDS_LABEL, NEW, NoMethods, ProblemsLink, SETTINGS_TITLE, SettingsHome, TypeTiles, UsedBy, needsLine, useAskDiscard, useMethodActions, useMethodNav, useOpenMethod, withCarried, type MethodModel } from "@/components/lab/methods/method-parts"
import { LAB_MODEL_LABEL, LAB_MODELS } from "@/lib/lab/configure"
import { METHOD_EXAMPLES, exampleById, type MethodExample } from "@/lib/lab/method-examples"
import { passChip } from "@/lib/lab/rule-path"
import { methodsOf, type EvaluationMethod } from "@/lib/lab/methods"
import { useV2State } from "@/lib/v2/react"
import { countSkills, skillNounPlural } from "@/lib/lab/terms"

const BLANK = "blank"
const TILE = "flex cursor-pointer flex-col items-start gap-2 rounded-[var(--radius)] border border-border bg-background p-3 font-normal hover:border-[var(--border-control-35)] has-[[data-state=checked]]:border-[var(--brand-color)] has-[[data-state=checked]]:ring-1 has-[[data-state=checked]]:ring-[var(--brand-color)]"
/** The order the four type tiles use everywhere. */
const TYPE_ORDER = (["demonstration", "binary", "question", "scored"] as const).filter((m) => LAB_MODELS.includes(m))

// ---------------------------------------------------------------------------------------------------------------------
// Add: choose a starting point, then edit it

/** One starting point: its name, what the evaluator would pick with what moves a student forward, and what else it fills. */
function ExampleTile({ x }: { x: MethodExample }) {
  const id = `start-${x.id}`
  return (
    <Label htmlFor={id} className={TILE} data-example={x.id}>
      <span className="flex items-center gap-2">
        <RadioGroupItem id={id} value={x.id} aria-labelledby={`${id}-name`} aria-describedby={`${id}-what`} />
        <span id={`${id}-name`} className={TYPE.body}>{x.name}</span>
      </span>
      <span id={`${id}-what`} className="flex w-full min-w-0 flex-col gap-1 ps-6">
        {x.picks ? (
          <span className="flex flex-col">
            {x.picks.map((p) => (
              <span key={p.label} className={cn("flex min-h-6 items-center justify-between gap-3", TYPE.meta)}>
                <span className="min-w-0 break-words">{p.label}</span>
                {p.forward ? <span className="flex shrink-0 items-center gap-1 text-foreground"><i className="fa-light fa-check" aria-hidden="true" />Moves forward</span> : null}
              </span>
            ))}
          </span>
        ) : null}
        {x.facts.map((f) => <span key={f} className={cn(TYPE.meta, "break-words")}>{f}</span>)}
      </span>
    </Label>
  )
}

function Create({ m, backHref, onLeave }: { m: MethodModel; backHref: string; onLeave: () => void }) {
  const [view, setView] = React.useState<"choose" | "edit">("choose")
  const [pick, setPick] = React.useState("")
  const [tried, setTried] = React.useState(false)
  /** What the form was last filled from, and the draft as it was then: a different start over hand edits asks first. */
  const filled = React.useRef<{ pick: string; draft: string } | null>(null)
  const [replacing, setReplacing] = React.useState(false)
  const discard = useAskDiscard()
  // Without the parts the draft settles on its own after a fill (group check-off decided, the carried number).
  const draftKey = JSON.stringify([{ ...m.rule, need: 0, checkOff: null }, m.meta])
  const fill = () => {
    const x = exampleById(pick)
    m.reset()
    if (x) {
      m.setRule(() => x.build())
      m.setMeta({ name: x.name, description: "" })
    }
    filled.current = { pick, draft: "" }
    setReplacing(false)
    setView("edit")
    requestAnimationFrame(() => requestAnimationFrame(() => (document.getElementById("method-name") ?? document.querySelector<HTMLElement>("[data-type-tiles] [role=radio]"))?.focus()))
  }
  // The draft as the fill left it, read once the fill has landed.
  React.useEffect(() => { if (view === "edit" && filled.current && !filled.current.draft) filled.current.draft = draftKey }, [view, draftKey])
  const next = () => {
    if (!pick) { setTried(true); requestAnimationFrame(() => document.querySelector<HTMLElement>("[data-starting-points] [role=radio]")?.focus()); return }
    const was = filled.current
    if (was && was.pick === pick) { setView("edit"); return }
    if (was && was.draft && was.draft !== draftKey) { setReplacing(true); return }
    fill()
  }
  const chosen = exampleById(filled.current?.pick)
  return (
    <div className="flex min-h-[calc(100dvh-5.5rem)] w-full flex-col" data-page-type="form" data-method-page>
      <PageFrame title={<BackTitle href={backHref} label={`Back to ${SETTINGS_TITLE}`}>New method</BackTitle>} className="flex-1">
        {view === "choose" ? (
          <RadioGroup value={pick} onValueChange={(v) => { setPick(v); setTried(false) }} aria-label="Starting point" aria-invalid={tried && !pick ? true : undefined} aria-describedby={tried && !pick ? "start-error" : undefined} className="@container flex min-w-0 flex-1 flex-col gap-6 outline-none" data-region="method-new" data-starting-points>
            <div className="grid min-w-0 items-start gap-x-4 gap-y-6 @[40rem]:grid-cols-2 @[60rem]:grid-cols-4">
              {TYPE_ORDER.map((type) => (
                <div key={type} className="flex min-w-0 flex-col gap-2" role="group" aria-label={LAB_MODEL_LABEL[type]}>
                  <p className={TYPE.helper} aria-hidden="true">{LAB_MODEL_LABEL[type]}</p>
                  {METHOD_EXAMPLES.filter((x) => x.model === type).map((x) => <ExampleTile key={x.id} x={x} />)}
                </div>
              ))}
            </div>
            <Label htmlFor="start-blank" className={cn(TILE, "@[40rem]:max-w-[calc(50%-0.5rem)] @[60rem]:max-w-[calc(25%-0.75rem)]")} data-example={BLANK}>
              <span className="flex items-center gap-2">
                <RadioGroupItem id="start-blank" value={BLANK} aria-labelledby="start-blank-name" aria-describedby="start-blank-what" />
                <span id="start-blank-name" className={TYPE.body}>Start blank</span>
              </span>
              <span id="start-blank-what" className={cn(TYPE.meta, "ps-6")}>Choose a type and fill in everything yourself</span>
            </Label>
          </RadioGroup>
        ) : (
          <div className="@container flex min-w-0 flex-1 flex-col gap-6" data-region="method-new">
            {chosen ? null : <TypeTiles m={m} />}
            {m.rule.model ? <EditorColumns m={m} /> : null}
          </div>
        )}
        <StickyFooter
          back={view === "edit" ? { label: "Starting points", onClick: () => setView("choose") } : undefined}
          context={view === "choose" ? (tried && !pick ? <span id="start-error" className="text-destructive">Choose a starting point.</span> : null) : <ProblemsLink m={m} />}
          secondary={{ label: "Cancel", onClick: () => discard.ask(m.dirty, () => { m.reset(); onLeave() }) }}
          primary={view === "choose" ? { label: "Continue", onClick: next } : { label: "Create method", onClick: () => { m.save() } }}
        />
      </PageFrame>
      <AlertDialog open={replacing} onOpenChange={setReplacing}>
        <AlertDialogContent data-replace-start>
          <AlertDialogHeader>
            <AlertDialogTitle>Start again from another starting point?</AlertDialogTitle>
            <AlertDialogDescription>What you changed in the form is replaced.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep what I have</AlertDialogCancel>
            <AlertDialogAction onClick={fill}>Start again</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <UnsavedChangesGuard dirty={m.dirty} onDiscard={m.reset} />
      {discard.question}
    </div>
  )
}

// ---------------------------------------------------------------------------------------------------------------------
// Edit: the row opens in place

const COLS = "md:grid md:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,1.3fr)_minmax(0,1.3fr)_4.5rem] md:items-start md:gap-4"

/** The closed row: what a table would say. The name is the row's one emphasis; the rest is plain. */
function RowFacts({ x }: { x: EvaluationMethod }) {
  const forward = passChip(x.rule)?.text
  const needs = x.rule.model ? needsLine(x.rule) : ""
  const n = x.skillIds.length
  return (
    <span className={cn("flex min-w-0 flex-1 flex-col gap-1 text-start", COLS)}>
      <span className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
        <span className="min-w-0 break-words text-foreground">{x.name}</span>
        {x.program && x.saved ? <StatusBadge label={`New ${skillNounPlural()}`} tone="neutral" size="sm" data-new-skills-badge /> : null}
      </span>
      <span className="min-w-0 break-words max-md:text-xs max-md:text-muted-foreground"><span className="sr-only">Type: </span>{x.rule.model ? LAB_MODEL_LABEL[x.rule.model] : "Not set up"}</span>
      <span className="min-w-0 break-words max-md:hidden"><span className="sr-only">Moves forward when: </span>{forward ?? <span className="text-muted-foreground">Not set</span>}</span>
      <span className="min-w-0 break-words max-md:hidden"><span className="sr-only">{`${NEEDS_LABEL}: `}</span>{needs || <span className="text-muted-foreground">{x.rule.model ? "Nothing more" : "Not set"}</span>}</span>
      <span className="tabular-nums max-md:hidden md:text-end"><span aria-hidden="true">{n}</span><span className="sr-only">{countSkills(n)}</span></span>
    </span>
  )
}

/** The open row: the editor in place, with its own Save beside what was edited. */
function RowEditor({ m, onClose }: { m: MethodModel; onClose: () => void }) {
  const [changing, setChanging] = React.useState(false)
  const discard = useAskDiscard()
  const { rule, method } = m
  if (!method) return null
  return (
    <div className="@container flex min-w-0 flex-col gap-5 pt-1 text-foreground" data-row-editor>
      {m.settled ? (
        // The type is said by the row above; here only who uses the method and the quiet way to change its type [REQ SC-09].
        <div className={cn(TYPE.helper, "flex flex-wrap items-center gap-x-2 gap-y-1")} data-type-line>
          <UsedBy method={method} linked={!m.dirty} />
          <span aria-hidden="true">·</span>
          <Button type="button" variant="link" size="sm" className="h-auto p-0 font-normal" aria-expanded={changing} aria-controls="cfg-type-tiles" onClick={() => setChanging((v) => !v)} data-change-type>{changing ? "Hide types" : "Change type"}</Button>
          {m.typeChanged ? <ChangedMark /> : null}
        </div>
      ) : null}
      {!m.settled || changing ? <TypeTiles m={m} /> : null}
      {rule.model ? <EditorColumns m={m} /> : null}
      <div className="flex flex-wrap items-center gap-2 border-t border-border pt-3" data-save-bar>
        {rule.model ? <ProgramPreviewDialog draft={withCarried(rule)} variant="ghost" /> : null}
        <span className="flex min-w-0 flex-1 items-center justify-end" aria-live="assertive" aria-atomic="true"><ProblemsLink m={m} /></span>
        {m.dirty ? (
          <>
            <Button type="button" variant="outline" size="sm" onClick={() => discard.ask(true, () => { m.reset(); onClose() })}>Cancel</Button>
            <Button type="button" variant="default" size="sm" onClick={() => { m.save() }} data-save-method>Save method</Button>
          </>
        ) : null}
      </div>
      <UnsavedChangesGuard dirty={m.dirty} onDiscard={m.reset} />
      {discard.question}
    </div>
  )
}

function MethodRows({ openId, dirty, setDirty, setBanner }: { openId: string | null; dirty: boolean; setDirty: (d: boolean) => void; setBanner: (b: ResultBannerValue | null) => void }) {
  const state = useV2State()
  const nav = useMethodNav()
  const discard = useAskDiscard()
  const methods = React.useMemo(() => methodsOf(state), [state])
  const open = (id: string) => discard.ask(dirty, () => nav.open(id))
  const close = () => discard.ask(dirty, nav.close)
  const actions = useMethodActions(setBanner, { edit: false, onDeleted: (id) => { if (id === openId) nav.close() } })
  // A link straight to a method: its row is brought into view once.
  React.useEffect(() => {
    // The row's own heading, not the whole open row: a row taller than the screen would be aligned by its far end.
    if (openId) requestAnimationFrame(() => document.querySelector(`[data-method-link="${openId}"]`)?.scrollIntoView({ block: "nearest" }))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <div className="flex min-w-0 flex-col" data-region="methods">
      <div className={cn("hidden border-b border-border pb-2 pe-14", TYPE.meta, COLS)} aria-hidden="true" data-row-heads>
        <span>Method</span><span>Type</span><span>Moves forward when</span><span>{NEEDS_LABEL}</span><span className="text-end">{skillNounPlural().replace(/^./, (c) => c.toUpperCase())}</span>
      </div>
      <Accordion type="single" collapsible value={openId ?? ""} onValueChange={(v) => { if (v) open(v); else close() }}>
        {methods.map((x) => (
          <AccordionItem key={x.id} value={x.id} data-method-row={x.id}>
            <div className="flex min-w-0 items-start gap-1">
              <div className="min-w-0 flex-1">
                <AccordionTrigger className="min-h-11 items-center py-3 font-normal hover:no-underline" data-method-link={x.id}><RowFacts x={x} /></AccordionTrigger>
              </div>
              <div className="flex min-h-11 shrink-0 items-center pt-1"><RowMenu label={`Actions for ${x.name}`} entries={actions.entries(x)} /></div>
            </div>
            <AccordionContent className="pb-5">
              {openId === x.id ? (
                <MethodDraft key={x.id} method={x} onDirty={setDirty} onSaved={(b, id) => { setBanner(b); if (id) nav.close() }}>
                  {(m) => <RowEditor m={m} onClose={nav.close} />}
                </MethodDraft>
              ) : null}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
      {actions.dialog}
      {discard.question}
    </div>
  )
}

export function AdminEvaluationSettingsL() {
  const state = useV2State()
  const nav = useMethodNav()
  const { open, missing, hydrated } = useOpenMethod(nav.id)
  const [banner, setBanner] = React.useState<ResultBannerValue | null>(null)
  const [dirty, setDirty] = React.useState(false)
  const discard = useAskDiscard()
  const count = React.useMemo(() => methodsOf(state).length, [state])
  if (nav.id && !hydrated) return <div className="p-6"><LoadingBlock /></div>
  if (open === NEW) {
    return (
      <>
        {banner ? <ResultBanner banner={banner} onDismiss={() => setBanner(null)} /> : null}
        <MethodDraft key={NEW} method={null} onSaved={(b, id) => { setBanner(b); if (id) nav.close() }}>
          {(m) => <Create m={m} backHref={nav.href(null)} onLeave={nav.close} />}
        </MethodDraft>
      </>
    )
  }
  return (
    <>
      <SettingsHome banner={banner} setBanner={setBanner} missing={missing} guard={(then) => discard.ask(dirty, then)} quietNew={dirty}>
        {count ? <MethodRows openId={open ? open.id : null} dirty={dirty} setDirty={setDirty} setBanner={setBanner} /> : <NoMethods href={nav.href(NEW)} />}
      </SettingsHome>
      {discard.question}
    </>
  )
}
