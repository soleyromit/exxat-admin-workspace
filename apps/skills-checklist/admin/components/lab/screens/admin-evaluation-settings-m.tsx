"use client"

/**
 * Evaluation settings M, "Guided steps to add, edit a value in the table" (Proposed, D-EM1116-g; contract ADMIN-D3 "round 6 variants").
 * Romit 2026-11-16, after choosing G: "is that all the options you have considered?"
 *
 * Adding and editing are different jobs, so they get different patterns.
 *   - Add (`?method=new`): four short steps, one decision each (DS Wizard through the lab WizardPage): the type, what the evaluator picks,
 *     how an evaluation runs, then a review in plain sentences with the name. Each step is checked on Continue; nothing is preselected
 *     [REQ SC-02]. Beside steps 2 and 3 the method so far is read back in words; beside the review, the forms it produces [REQ SC-19].
 *   - Edit (`?method=<id>`): each value in the table is a button that opens a small DS Popover holding only that group, with Save and Cancel.
 *     Chosen over a side panel because the commonest edit touches one group: one press to the field, one to save, and the table never leaves.
 *     `&part=name|picks|who|needs` picks the group (picks by default). A type change rebuilds the method [REQ SC-09], so it reuses the steps
 *     (`&step=type`, from the row menu).
 */
import * as React from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import { Popover, PopoverAnchor, PopoverContent } from "@exxatdesignux/ui/components/ui/popover"
import { StatusBadge } from "@exxatdesignux/ui"
import { DataTable } from "@exxatdesignux/ui/components/data-table"
import type { ColumnDef } from "@exxatdesignux/ui/components/data-table/types"
import { WizardPanel } from "@exxatdesignux/ui/components/ui/wizard"
import { useIsMobile } from "@exxatdesignux/ui/hooks/use-mobile"
import { cn } from "@exxatdesignux/ui/lib/utils"
import { NUM_LINK } from "@/components/lab/link-styles"
import { useLabHref } from "@/components/lab/lab-bar/page-context"
import { StickyFooter } from "@/components/lab/layout/sticky-footer"
import { WizardPage, type WizardStep } from "@/components/lab/layout/wizard-page"
import { BackTitle } from "@/components/lab/shared/return-link"
import { ResultBanner, type ResultBannerValue } from "@/components/lab/shared/result-banner"
import { RowMenu, type RowMenuEntry } from "@/components/lab/shared/row-menu"
import { UnsavedChangesGuard } from "@/components/lab/shared/unsaved-guard"
import { EmptyBlock } from "@/components/lab/empty-block"
import { ProgramPreview } from "@/components/lab/configure/program-preview"
import { ProgramPreviewDialog } from "@/components/lab/configure/settings-dialogs"
import { focusField } from "@/components/lab/configure/use-configure"
import { CheckOffField, LoadingBlock, MethodDraft, NEEDS_LABEL, NEW, NameFields, NeedsField, NoMethods, ProblemsLink, ROLES_LABEL, RolesField, SETTINGS_TITLE, SettingsHome, TypeBody, TypeTiles, needsLine, useAskDiscard, useMethodActions, useMethodNav, useOpenMethod, withCarried, type MethodModel } from "@/components/lab/methods/method-parts"
import { LAB_MODEL_LABEL, ROLE_LABEL, ROLES, ruleAllowsCheckOff, type LabRule, type RuleIssue } from "@/lib/lab/configure"
import { methodSentences, type SentenceStep } from "@/lib/lab/method-words"
import { passChip } from "@/lib/lab/rule-path"
import { methodsOf, type EvaluationMethod } from "@/lib/lab/methods"
import { useV2State } from "@/lib/v2/react"
import { countSkills, inSentence, skillNounPlural } from "@/lib/lab/terms"

type Part = "name" | "picks" | "who" | "needs"
const PARTS: readonly Part[] = ["name", "picks", "who", "needs"]
const isPart = (v: string | null | undefined): v is Part => !!v && (PARTS as readonly string[]).includes(v)
const PICKS_LABEL: Record<NonNullable<LabRule["model"]>, string> = { demonstration: "Levels", binary: "Outcomes", question: "Questions", scored: "Questions" }

/** Where a problem lives: the wizard step, and the table group. */
function partOf(field: string): Exclude<Part, "name"> | "type" {
  if (field.startsWith("cfg-role")) return "who"
  // Group check-off is how an evaluation runs, not who may evaluate [REQ SC-16]: it sits with what each evaluation needs.
  if (field === "cfg-self" || field === "cfg-feedback" || field === "cfg-approval" || field.startsWith("cfg-checkoff")) return "needs"
  if (field === "cfg-model") return "type"
  return "picks"
}
const stepOf = (field: string): SentenceStep => { const p = partOf(field); return p === "who" || p === "needs" ? "how" : p }

/** A model whose problems show only for the group in view, once that group was tried. */
function scoped(m: MethodModel, show: boolean): MethodModel {
  return { ...m, showErrors: show, props: { ...m.props, showErrors: show }, err: (f) => (show ? m.issues.find((i) => i.field === f)?.message : undefined) }
}
const toField = (m: MethodModel, i: RuleIssue) => { if (i.field.startsWith("cfg-question")) m.setExpanded(true); requestAnimationFrame(() => requestAnimationFrame(() => focusField(i.field))) }

// ---------------------------------------------------------------------------------------------------------------------
// Add (and a type change): the steps

const STEP_IDS = ["type", "picks", "how", "review"] as const
type StepId = (typeof STEP_IDS)[number]

function SoFar({ rule, onChange }: { rule: LabRule; onChange?: (s: SentenceStep) => void }) {
  return (
    <ul className="flex min-w-0 flex-col gap-2" data-so-far>
      {methodSentences(rule).map((s) => (
        <li key={s.id} className="flex min-w-0 flex-wrap items-baseline gap-x-3 text-sm">
          <span className={cn("min-w-0 break-words", s.open && "text-muted-foreground")}>{s.text}</span>
          {onChange ? <Button type="button" variant="link" size="sm" className="h-auto min-h-6 shrink-0 p-0 font-normal" onClick={() => onChange(s.step)} aria-label={`Change: ${s.text}`}>Change</Button> : null}
        </li>
      ))}
    </ul>
  )
}

function Steps({ m, backHref, onLeave, startAt }: { m: MethodModel; backHref: string; onLeave: () => void; startAt: StepId }) {
  const [step, setStep] = React.useState<StepId>(startAt)
  const [tried, setTried] = React.useState<Partial<Record<StepId, boolean>>>({})
  const discard = useAskDiscard()
  const { rule, method } = m
  const index = STEP_IDS.indexOf(step)
  const steps: WizardStep[] = [
    { id: "type", label: "Type" },
    { id: "picks", label: rule.model ? PICKS_LABEL[rule.model] : "Answers" },
    { id: "how", label: "Evaluation" },
    { id: "review", label: "Review" },
  ]
  const issuesOf = (s: StepId): RuleIssue[] => (s === "review" ? [] : !rule.model ? (s === "type" ? m.issues.filter((i) => i.field === "cfg-model") : []) : m.issues.filter((i) => stepOf(i.field) === s))
  const here = issuesOf(step)
  const shown = tried[step] ? here : []
  const sm = scoped(m, !!tried[step])
  const go = (s: StepId) => { setStep(s); requestAnimationFrame(() => document.getElementById(`wizard-step-heading-${s}`)?.focus()) }
  const next = () => {
    if (step === "review") {
      const r = m.save()
      // A problem a step let through (a type change leaves the check-off level behind): back to where it lives.
      if (r === "rule" && m.issues[0]) { const s = stepOf(m.issues[0].field); setTried((t) => ({ ...t, [s]: true })); setStep(s); toField(m, m.issues[0]) }
      return
    }
    if (step === "type" && !rule.model) { setTried((t) => ({ ...t, type: true })); requestAnimationFrame(() => document.querySelector<HTMLElement>("[data-type-tiles] [role=radio]")?.focus()); return }
    if (here.length) { setTried((t) => ({ ...t, [step]: true })); toField(m, here[0]!); return }
    go(STEP_IDS[index + 1]!)
  }
  const problems = step === "review" ? <ProblemsLink m={m} /> : shown.length ? (
    <Button type="button" variant="link" size="sm" className="h-auto p-0 text-destructive" onClick={() => toField(m, shown[0]!)} data-save-bar-problems>{`${shown.length} to fix`}</Button>
  ) : step === "type" && tried.type && !rule.model ? <span className="text-destructive">Choose a type.</span> : null
  return (
    <>
      <WizardPage
        title={<BackTitle href={backHref} label={`Back to ${SETTINGS_TITLE}`}>{method ? method.name : "New method"}</BackTitle>}
        steps={steps}
        current={index}
        onStepClick={(i) => go(STEP_IDS[i]!)}
        // Beside the fields: the method so far, in words. Beside the review: the forms it produces. The first step uses the whole width.
        aside={step === "type" ? null : step === "review" ? (rule.model ? <ProgramPreview draft={withCarried(rule)} /> : null) : <SoFar rule={rule} />}
        footer={
          <StickyFooter
            back={index > 0 ? { onClick: () => go(STEP_IDS[index - 1]!) } : undefined}
            context={<span aria-live="assertive" aria-atomic="true">{problems}</span>}
            secondary={{ label: "Cancel", onClick: () => discard.ask(m.dirty, () => { m.reset(); onLeave() }) }}
            primary={{ label: step === "review" ? (method ? "Save method" : "Create method") : "Continue", onClick: next }}
          />
        }
      >
        <WizardPanel step="type"><TypeTiles m={sm} /></WizardPanel>
        <WizardPanel step="picks"><div className="max-w-[46rem]"><TypeBody m={sm} /></div></WizardPanel>
        <WizardPanel step="how">
          <div className="flex max-w-[46rem] flex-col gap-6" data-region="evaluation">
            <div className="grid min-w-0 gap-6 sm:grid-cols-2">
              <RolesField m={sm} />
              <NeedsField m={sm} />
            </div>
            <CheckOffField m={sm} />
          </div>
        </WizardPanel>
        <WizardPanel step="review">
          <div className="flex max-w-[46rem] flex-col gap-6" data-review>
            <SoFar rule={rule} onChange={(s) => go(s)} />
            <NameFields m={m} />
            {/* Below 1280 px the forms are not beside the review: they open from here [REQ SC-19]. */}
            {rule.model ? <div className="flex justify-start min-[1280px]:hidden"><ProgramPreviewDialog draft={withCarried(rule)} variant="ghost" /></div> : null}
          </div>
        </WizardPanel>
      </WizardPage>
      <UnsavedChangesGuard dirty={m.dirty} onDiscard={m.reset} />
      {discard.question}
    </>
  )
}

// ---------------------------------------------------------------------------------------------------------------------
// Edit: one value of a row, in a popover beside it

const PART_LABEL = (part: Part, rule: LabRule): string => (part === "name" ? "Name" : part === "picks" ? (rule.model ? PICKS_LABEL[rule.model] : "Type") : part === "who" ? ROLES_LABEL : NEEDS_LABEL)

function CellEditor({ m, part, onPart, onClose }: { m: MethodModel; part: Part; onPart: (p: Part) => void; onClose: () => void }) {
  const [anchor, setAnchor] = React.useState<HTMLElement | null>(null)
  const [tried, setTried] = React.useState(false)
  const discard = useAskDiscard()
  const { method, rule } = m
  const id = method?.id ?? ""
  // The cell that opened it; on a narrow screen its column is gone, so the row's name stands in.
  React.useLayoutEffect(() => {
    let frame = 0
    const find = () => {
      const el = document.querySelector<HTMLElement>(`[data-cell="${id}:${part}"]`) ?? document.querySelector<HTMLElement>(`[data-cell="${id}:name"]`)
      if (el) { el.scrollIntoView({ block: "nearest" }); setAnchor(el) } else frame = requestAnimationFrame(find)
    }
    find()
    return () => cancelAnimationFrame(frame)
  }, [id, part])
  const virtual = React.useMemo(() => ({ current: anchor }), [anchor])
  if (!method || !anchor) return null
  const close = () => discard.ask(m.dirty, () => { m.reset(); onClose() })
  const mine = m.issues.filter((i) => partOf(i.field) === part)
  const sm = scoped(m, tried)
  const save = () => {
    if (mine.length) { setTried(true); toField(m, mine[0]!); return }
    const r = m.save()
    if (r === "name" && part !== "name") onPart("name")
    // A problem in another group: open where it lives; the draft stays.
    if (r === "rule" && m.issues[0]) { const p = partOf(m.issues[0].field); if (p !== "type" && p !== part) { onPart(p); setTried(true) } }
  }
  const problems = tried && mine.length ? (
    <Button type="button" variant="link" size="sm" className="h-auto p-0 text-destructive" onClick={() => toField(m, mine[0]!)} data-save-bar-problems>{`${mine.length} to fix`}</Button>
  ) : part === "name" ? <ProblemsLink m={m} /> : null
  return (
    <>
      <Popover open onOpenChange={(o) => { if (!o) close() }}>
        <PopoverAnchor virtualRef={virtual as React.RefObject<HTMLElement>} />
        <PopoverContent
          align="start"
          className="flex max-h-[min(34rem,var(--radix-popover-content-available-height))] w-[min(32rem,calc(100vw-2rem))] flex-col p-0"
          aria-label={`${PART_LABEL(part, rule)} of ${method.name}`}
          data-cell-editor={part}
          onOpenAutoFocus={(e) => { if (part !== "name") { e.preventDefault(); (e.currentTarget as HTMLElement | null)?.focus({ preventScroll: true }) } }}
          onCloseAutoFocus={(e) => { e.preventDefault(); anchor.focus({ preventScroll: true }) }}
          onEscapeKeyDown={(e) => { e.preventDefault(); close() }}
          onInteractOutside={(e) => {
            // The popover's own dialogs and menus are not the page, and another value's button opens itself.
            e.preventDefault()
            const target = e.detail.originalEvent.target as Element | null
            if (!(e.detail.originalEvent instanceof PointerEvent) || !target || !target.isConnected || target.closest("[role=dialog], [role=alertdialog], [role=menu], [role=listbox], [data-slot=dialog-overlay], [data-slot=alert-dialog-overlay], [data-cell], a[href]")) return
            close()
          }}
        >
          <div className="@container flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto p-4">
            {part === "name" ? <NameFields m={m} /> : null}
            {part === "picks" ? <TypeBody m={sm} /> : null}
            {part === "who" ? <RolesField m={sm} /> : null}
            {part === "needs" ? <><NeedsField m={sm} /><CheckOffField m={sm} /></> : null}
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-2 border-t border-border px-4 py-3" data-save-bar>
            {part === "picks" && rule.model ? <ProgramPreviewDialog draft={withCarried(rule)} variant="ghost" /> : null}
            <span className="flex min-w-0 flex-1 items-center justify-end" aria-live="assertive" aria-atomic="true">{problems}</span>
            <Button type="button" variant="outline" size="sm" onClick={close}>{m.dirty ? "Cancel" : "Close"}</Button>
            {m.dirty ? <Button type="button" variant="default" size="sm" onClick={save} data-save-method>Save</Button> : null}
          </div>
        </PopoverContent>
      </Popover>
      <UnsavedChangesGuard dirty={m.dirty} onDiscard={m.reset} />
      {discard.question}
    </>
  )
}

interface Row extends Record<string, unknown> {
  id: string
  m: EvaluationMethod
  name: string
  type: string
  used: number
}

/** A value that opens its own editor: reads as the value, with the mark of something that opens. */
function ValueButton({ id, part, label, open, onOpen, plain, children }: { id: string; part: Part; label: string; open: boolean; onOpen: () => void; /** The name: the row's one emphasis, so it carries no mark. */ plain?: boolean; children: React.ReactNode }) {
  return (
    <Button type="button" variant="ghost" size="sm" className="-ms-2 h-auto min-h-8 max-w-full justify-start gap-2 whitespace-normal px-2 py-1 text-start font-normal" aria-haspopup="dialog" aria-expanded={open} aria-label={label} onClick={(e) => { e.stopPropagation(); onOpen() }} data-cell={`${id}:${part}`}>
      <span className="min-w-0 break-words">{children}</span>
      {plain ? null : <i className="fa-light fa-chevron-down shrink-0 text-xs text-muted-foreground" aria-hidden="true" />}
    </Button>
  )
}

function ValuesTable({ editing, onOpen, onType, setBanner }: { editing: { id: string; part: Part } | null; onOpen: (id: string, part: Part) => void; onType: (id: string) => void; setBanner: (b: ResultBannerValue | null) => void }) {
  const state = useV2State()
  const isMobile = useIsMobile()
  const to = useLabHref()
  const nav = useMethodNav()
  const methods = React.useMemo(() => methodsOf(state), [state])
  // A method with no type yet has nothing to open a value of: its row leads to the steps.
  const start = (x: EvaluationMethod, part: Part) => (x.saved && x.rule.model ? onOpen(x.id, part) : onType(x.id))
  const actions = useMethodActions(setBanner, {
    edit: false,
    extra: (x): RowMenuEntry[] => [
      // On a narrow screen the value columns are gone: the same four editors, from the menu.
      ...(isMobile && x.saved && x.rule.model ? PARTS.map((p) => ({ slot: "edit" as const, label: PART_LABEL(p, x.rule), icon: "fa-pen", onSelect: () => onOpen(x.id, p) })) : []),
      { slot: "edit", label: "Change type", icon: "fa-shapes", onSelect: () => onType(x.id) },
    ],
  })
  const rows: Row[] = methods.map((x) => ({ id: x.id, m: x, name: x.name, type: x.rule.model ? LAB_MODEL_LABEL[x.rule.model] : "", used: x.skillIds.length }))
  const columns = React.useMemo<ColumnDef<Row>[]>(() => {
    const isOpen = (r: Row, part: Part) => editing?.id === r.id && editing.part === part
    const cell = (r: Row, part: Part, text: string, empty: string) => (
      r.m.saved && r.m.rule.model
        ? <ValueButton id={r.id} part={part} open={isOpen(r, part)} onOpen={() => start(r.m, part)} label={`${PART_LABEL(part, r.m.rule)} of ${r.name}: ${text || empty}`}>{text || <span className="text-muted-foreground">{empty}</span>}</ValueButton>
        : <span className="text-sm text-muted-foreground">Not set</span>
    )
    const name: ColumnDef<Row> = {
      key: "name", label: "Method", width: isMobile ? 220 : 250, defaultPin: "left", sortable: true,
      cell: (r) => (
        <span className="flex min-w-0 flex-col gap-0.5 py-1">
          <span className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
            {r.m.saved && r.m.rule.model
              ? <ValueButton id={r.id} part="name" plain open={isOpen(r, "name")} onOpen={() => start(r.m, "name")} label={`Name and description of ${r.name}`}>{r.name}</ValueButton>
              : <Button asChild variant="link" size="sm" className="h-auto p-0 font-normal text-foreground"><Link href={`${nav.href(r.id)}&step=type`} scroll={false} onClick={(e) => e.stopPropagation()} data-cell={`${r.id}:name`}>{r.name}</Link></Button>}
            {r.m.program && r.m.saved ? <StatusBadge label={`New ${skillNounPlural()}`} tone="neutral" size="sm" surface="table" data-new-skills-badge /> : null}
          </span>
          {r.m.description?.trim() ? <span className="whitespace-normal text-xs text-muted-foreground" data-method-line>{r.m.description.trim()}</span> : null}
        </span>
      ),
    }
    const type: ColumnDef<Row> = { key: "type", label: "Type", width: 150, sortable: true, cell: (r) => (r.m.rule.model ? <span className="whitespace-normal text-sm">{r.type}</span> : <StatusBadge label="Not set up" tone="warning" icon="fa-circle-exclamation" size="sm" surface="table" />) }
    const forward: ColumnDef<Row> = { key: "forward", label: "Moves forward when", width: 200, cell: (r) => cell(r, "picks", passChip(r.m.rule)?.text ?? "", "Not set") }
    const who: ColumnDef<Row> = { key: "who", label: ROLES_LABEL, width: 200, cell: (r) => cell(r, "who", ROLES.filter((x) => r.m.rule.evaluatorRoles.includes(x)).map((x, i) => (i ? inSentence(ROLE_LABEL[x]) : ROLE_LABEL[x])).join(", "), "Nobody yet") }
    const needs: ColumnDef<Row> = { key: "needs", label: NEEDS_LABEL, width: 190, cell: (r) => cell(r, "needs", [needsLine(r.m.rule), ruleAllowsCheckOff(r.m.rule) ? (needsLine(r.m.rule) ? "group check-off allowed" : "Group check-off allowed") : ""].filter(Boolean).join(", "), "Nothing more") }
    const used: ColumnDef<Row> = {
      key: "used", label: skillNounPlural().replace(/^./, (c) => c.toUpperCase()), width: 80, sortable: true,
      cell: (r) => (r.used && r.m.program
        ? <Link href={to("admin/skills-library", { config: "default" })} onClick={(e) => e.stopPropagation()} className={cn(NUM_LINK, "text-sm tabular-nums")} aria-label={`${r.name}: ${countSkills(r.used)}`}>{r.used}</Link>
        : <span className={cn("text-sm tabular-nums", !r.used && "text-muted-foreground")}>{r.used}</span>),
    }
    const menu: ColumnDef<Row> = {
      key: "actions", label: "", width: 48, minWidth: 48, defaultPin: "right", lockPin: true,
      cell: (r) => <div className="flex items-center justify-center" onClick={(e) => e.stopPropagation()}><RowMenu label={`Actions for ${r.name}`} entries={actions.entries(r.m)} /></div>,
    }
    return isMobile ? [name, used, menu] : [name, type, forward, who, needs, used, menu]
  }, [isMobile, editing, to, nav]) // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <div data-region="methods">
      <DataTable<Row>
        key={isMobile ? "phone" : "wide"}
        data={rows}
        columns={columns}
        getRowId={(r) => r.id}
        selectable={false}
        edgeInset={false}
        emptyState={<EmptyBlock compact title="No methods match" body="Clear the search or filter to see every method." />}
      />
      {actions.dialog}
    </div>
  )
}

export function AdminEvaluationSettingsM() {
  const state = useV2State()
  const nav = useMethodNav()
  const router = useRouter()
  const { open, missing, hydrated } = useOpenMethod(nav.id)
  const [banner, setBanner] = React.useState<ResultBannerValue | null>(null)
  const [dirty, setDirty] = React.useState(false)
  const discard = useAskDiscard()
  const count = React.useMemo(() => methodsOf(state).length, [state])
  // The page's own keys beside ?method: which group is open, or the steps.
  const params = useSearchParams()
  const partParam = params?.get("part")
  const part: Part = isPart(partParam) ? partParam : "picks"
  if (nav.id && !hydrated) return <div className="p-6"><LoadingBlock /></div>
  const method: EvaluationMethod | null = open && open !== NEW ? open : null
  // The steps: a new method, a type change, or a method that has no type yet.
  const inSteps = open === NEW || (!!method && (params?.get("step") === "type" || !method.saved || !method.rule.model))
  if (open && inSteps) {
    return (
      <>
        {banner ? <ResultBanner banner={banner} onDismiss={() => setBanner(null)} /> : null}
        <MethodDraft key={method?.id ?? NEW} method={method} onSaved={(b, id) => { setBanner(b); if (id) nav.close() }}>
          {(m) => <Steps m={m} backHref={nav.href(null)} onLeave={nav.close} startAt="type" />}
        </MethodDraft>
      </>
    )
  }
  const hrefOf = (id: string, p: Part) => `${nav.href(id)}${p === "picks" ? "" : `&part=${p}`}`
  const openValue = (id: string, p: Part) => { if (id !== method?.id || p !== part) discard.ask(dirty, () => { if (method) router.replace(hrefOf(id, p), { scroll: false }); else router.push(hrefOf(id, p), { scroll: false }) }) }
  return (
    <>
      <SettingsHome banner={banner} setBanner={setBanner} missing={missing} guard={(then) => discard.ask(dirty, then)} quietNew={dirty}>
        {count ? <ValuesTable editing={method ? { id: method.id, part } : null} onOpen={openValue} onType={(id) => discard.ask(dirty, () => router.push(`${nav.href(id)}&step=type`, { scroll: false }))} setBanner={setBanner} /> : <NoMethods href={nav.href(NEW)} />}
      </SettingsHome>
      {method ? (
        <MethodDraft key={method.id} method={method} onDirty={setDirty} onSaved={(b, id) => { setBanner(b); if (id) nav.close() }}>
          {(m) => <CellEditor m={m} part={part} onPart={(p) => router.replace(hrefOf(method.id, p), { scroll: false })} onClose={nav.close} />}
        </MethodDraft>
      ) : null}
      {discard.question}
    </>
  )
}
