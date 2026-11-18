"use client"

/**
 * Evaluation settings G, "Evaluation methods" (Proposed, D-EM1116; the editor is D-EM1116-e, contract ADMIN-D3 "round 4").
 * Romit 2026-11-16: "see editing an evaluation method, you just copy pasted instead of using any ui, ux principle or best practices." So the
 * editor is designed from the job [CALL 11-16]: a method is opened mostly to check it and edited rarely, and a type change is the rarest edit.
 *
 *   - The list (tab Methods): name, type, what moves a student forward, what each evaluation needs, how many skills use it, a row menu.
 *     The columns answer "how does it work" without opening anything. Tab Details: the program-wide details (D-EM1116-c).
 *   - ONE editor for New method and Edit, a dialog. Edit: the type is a fact under the title, "Change type" opens the four tiles (frequency
 *     sets prominence, Hick, error prevention). Two columns split by one hairline, no card: left the name and what the evaluator picks, right
 *     who can evaluate and what each evaluation needs, all checkboxes (the dialog saves on a button). New is staged: the four types first,
 *     nothing preselected [REQ SC-02]; the columns appear once a type is chosen. Footer: Preview at the start, Cancel and Save at the end.
 *   - Deep link: `?method=<id>` (or `?method=new`) opens the list with that dialog; it is pushed on open, so Back closes it.
 *
 * The program's method saves through the existing program save (Apply dialog names who changes); another method saves to its skills as their own
 * settings after naming the students whose progress changes [REQ AE-02]. Times needed stays per skill on the list [CALL 11-16].
 */
import * as React from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import { Checkbox } from "@exxatdesignux/ui/components/ui/checkbox"
import { Input } from "@exxatdesignux/ui/components/ui/input"
import { Label } from "@exxatdesignux/ui/components/ui/label"
import { Skeleton } from "@exxatdesignux/ui/components/ui/skeleton"
import { StatusBadge } from "@exxatdesignux/ui"
import { Tabs, TabsContent, TabsCountBadge, TabsList, TabsTrigger } from "@exxatdesignux/ui/components/ui/tabs"
import { Field, FieldError, FieldLabel, FieldLegend, FieldSet } from "@exxatdesignux/ui/components/ui/field"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@exxatdesignux/ui/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@exxatdesignux/ui/components/ui/alert-dialog"
import { DataTable } from "@exxatdesignux/ui/components/data-table"
import type { ColumnDef } from "@exxatdesignux/ui/components/data-table/types"
import { useIsMobile } from "@exxatdesignux/ui/hooks/use-mobile"
import { cn } from "@exxatdesignux/ui/lib/utils"
import { PageFrame } from "@/components/skills/page-header"
import { TYPE } from "@/components/lab/type-scale"
import { NUM_LINK } from "@/components/lab/link-styles"
import { useLabHref } from "@/components/lab/lab-bar/page-context"
import { ReturnTitle } from "@/components/lab/shared/return-link"
import { ResultBanner, type ResultBannerValue } from "@/components/lab/shared/result-banner"
import { RowMenu, type RowMenuEntry } from "@/components/lab/shared/row-menu"
import { useDialogDiscard } from "@/components/lab/shared/unsaved-guard"
import { EmptyBlock } from "@/components/lab/empty-block"
import { CHECKOFF_GRANT_LABEL, CHECKOFF_SWITCH_LABEL, CheckOffGrantNote, ModelSection, ScaleField, checkOffGrantSelect, withCheckOffPatch, type SectionProps } from "@/components/lab/configure/fields"
import { DetailsTable } from "@/components/lab/configure/details-table"
import { ProgramPreviewDialog } from "@/components/lab/configure/settings-dialogs"
import { EVALUATION_SETTINGS_TITLE } from "@/components/lab/configure/program-layout"
import { ChangedMark, FieldBlock, LevelsField, OutcomesField, QUESTIONS_SHOWN, QuestionCountsWhen, QuestionsField, ReorderHelp, ScoredCountsWhen } from "@/components/lab/configure/settings-sheet"
import { useProgramSave, useProgramSettings } from "@/components/lab/configure/program-parts"
import { focusField } from "@/components/lab/configure/use-configure"
import { LAB_MODEL_LABEL, ROLE_LABEL, ROLES, emptyRule, hasNeed, ruleAllowsCheckOff, withCheckOffDecided, type LabRule, type RuleIssue } from "@/lib/lab/configure"
import type { EvalModel } from "@/lib/v2/types"
import { detailsOf } from "@/lib/lab/details"
import { programIssues } from "@/lib/lab/program-settings"
import { passChip } from "@/lib/lab/rule-path"
import { PROGRAM_METHOD_ID, createMethod, deleteBlocked, deleteMethod, duplicateMethod, methodById, methodImpact, methodsOf, nameIssue, saveMethod, updateMethodMeta, type EvaluationMethod } from "@/lib/lab/methods"
import { useV2Hydrated, useV2State, useV2Store } from "@/lib/v2/react"
import { inSentence, skillNoun, skillNounPlural, countSkills } from "@/lib/lab/terms"

const LIST_TITLE = EVALUATION_SETTINGS_TITLE
const now = () => new Date().toISOString()
const ADMIN_ID = "admin"
const NEW = "new"

/** One line per type, so the choice can be made from the tile (prototype 33). Our four REQ models under their glossary names. */
const TYPE_LINE: Record<EvalModel, string> = {
  demonstration: "The evaluator picks one level from an ordered list.",
  binary: "The evaluator picks one of two outcomes you name.",
  question: "Yes or No on each question. You choose how many must be Yes.",
  scored: "Each question is scored on one scale. You set the score needed.",
}

/**
 * What an evaluation needs besides the evaluator's answer [REQ SC-14, SC-15]. One source for the editor's checkboxes and the list's column, so
 * both say the same words.
 */
const NEEDS = [
  { id: "cfg-self", key: "selfEvaluation", label: "Student self-evaluation first", short: "Self-evaluation first" },
  { id: "cfg-feedback", key: "feedbackRequired", label: "Feedback from the evaluator", short: "Evaluator feedback" },
  { id: "cfg-approval", key: "approvalRequired", label: "Admin approval before it counts", short: "Admin approval" },
] as const
const NEEDS_LABEL = "Each evaluation needs"

/** "Self-evaluation first, admin approval": the list's cell. Empty when the evaluator's answer is all it takes. */
function needsLine(rule: LabRule): string {
  return NEEDS.filter((n) => rule[n.key]).map((n, k) => (k ? `${n.short.charAt(0).toLowerCase()}${n.short.slice(1)}` : n.short)).join(", ")
}

/** A problem in a question the list hides (past the first 8): the list opens before focus moves to it. */
const hiddenQuestion = (i: RuleIssue) => {
  const m = /^cfg-question-(\d+)$/.exec(i.field)
  return !!m && Number(m[1]) >= QUESTIONS_SHOWN
}

/** Times needed lives per skill on the list [CALL 11-16]: a method not saved yet carries 1 only when unset [INFER, open]. */
const withCarried = (r: LabRule): LabRule => ({ ...r, need: hasNeed(r) ? r.need : 1 })

// ---------------------------------------------------------------------------------------------------------------------
// URL: the list, with the editor open for ?method=<id|new>

function useMethodNav() {
  const params = useSearchParams()
  const to = useLabHref()
  const router = useRouter()
  const pathname = usePathname()
  const id = params?.get("method") ?? null
  const href = React.useCallback((methodId: string | null) => {
    const q = new URLSearchParams()
    for (const k of ["from", "list", "tab"]) {
      const v = params?.get(k)
      if (v && !(k === "tab" && methodId)) q.set(k, v)
    }
    if (methodId) q.set("method", methodId)
    const out = to(`?${q.toString()}`)
    return out === "?" ? pathname ?? "?" : out
  }, [params, to, pathname])
  /** Open: a new history entry, so Back closes the editor. Close: replace, so the list is not stacked twice. */
  const open = React.useCallback((methodId: string) => router.push(href(methodId), { scroll: false }), [router, href])
  const close = React.useCallback(() => router.replace(href(null), { scroll: false }), [router, href])
  return { id, href, open, close }
}

// ---------------------------------------------------------------------------------------------------------------------
// Row actions: Edit, Duplicate, Delete. Results are inline banners, never toasts.

function DeleteDialog({ method, onCancel, onConfirm }: { method: EvaluationMethod | null; onCancel: () => void; onConfirm: () => void }) {
  return (
    <AlertDialog open={!!method} onOpenChange={(o) => { if (!o) onCancel() }}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{`Delete ${method?.name ?? "this method"}?`}</AlertDialogTitle>
          <AlertDialogDescription>{`No ${skillNoun()} uses it. This cannot be undone.`}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction variant="destructive" onClick={onConfirm}>Delete method</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

// ---------------------------------------------------------------------------------------------------------------------
// The list

interface Row extends Record<string, unknown> {
  id: string
  m: EvaluationMethod
  name: string
  type: string
  forward: string
  needs: string
  used: number
}

function MethodsList() {
  const state = useV2State()
  const store = useV2Store()
  const hydrated = useV2Hydrated()
  const nav = useMethodNav()
  const isMobile = useIsMobile()
  const to = useLabHref()
  const params = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const [banner, setBanner] = React.useState<ResultBannerValue | null>(null)
  const [deleting, setDeleting] = React.useState<EvaluationMethod | null>(null)
  const methods = React.useMemo(() => methodsOf(state), [state])
  const rows: Row[] = methods.map((m) => ({ id: m.id, m, name: m.name, type: m.rule.model ? LAB_MODEL_LABEL[m.rule.model] : "", forward: passChip(m.rule)?.text ?? "", needs: m.rule.model ? needsLine(m.rule) : "", used: m.skillIds.length }))

  const duplicate = (m: EvaluationMethod) => {
    const r = duplicateMethod(state, m.id)
    if (!r.ok) { setBanner({ variant: "warning", title: r.error }); return }
    store.update(() => r.state)
    const copy = methodById(r.state, r.id)
    setBanner({ variant: "success", title: `Created ${copy?.name ?? "a copy"}. No ${skillNoun()} uses it yet.`, action: { label: "Edit it", href: nav.href(r.id) } })
  }
  const entries = (m: EvaluationMethod): RowMenuEntry[] => [
    { slot: "edit", label: "Edit", icon: "fa-pen", onSelect: () => nav.open(m.id) },
    ...(m.saved && m.rule.model ? [{ slot: "lifecycle" as const, label: "Duplicate", icon: "fa-copy", onSelect: () => duplicate(m) }] : []),
    { slot: "delete", label: "Delete", icon: "fa-trash", onSelect: () => setDeleting(m), blockedBecause: deleteBlocked(m) ?? undefined },
  ]

  const columns = React.useMemo<ColumnDef<Row>[]>(() => {
    const name: ColumnDef<Row> = {
      key: "name",
      label: "Method",
      width: isMobile ? 220 : 280,
      defaultPin: "left",
      sortable: true,
      cell: (r) => {
        // Under the name only what the admin wrote; what the method does has its own columns (say it once).
        const line = r.m.description?.trim()
        return (
          <span className="flex min-w-0 flex-col gap-0.5 py-1.5">
            <span className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
              <Button asChild variant="link" size="sm" className="h-auto min-w-0 max-w-full justify-start whitespace-normal p-0 text-left text-sm font-normal text-foreground no-underline underline-offset-2 hover:underline">
                <Link href={nav.href(r.id)} scroll={false} onClick={(e) => e.stopPropagation()} data-method-link={r.id}><span className="whitespace-normal break-words">{r.name}</span></Link>
              </Button>
              {r.m.program && r.m.saved ? <StatusBadge label={`New ${skillNounPlural()}`} tone="neutral" size="sm" surface="table" data-new-skills-badge /> : null}
            </span>
            {line ? <span className="whitespace-normal text-xs text-muted-foreground" data-method-line>{line}</span> : null}
          </span>
        )
      },
    }
    // Plain words, not a badge: a type is not a state, and the row's one emphasis is the name.
    const type: ColumnDef<Row> = {
      key: "type",
      label: "Type",
      width: 190,
      sortable: true,
      cell: (r) => (r.m.rule.model ? <span className="whitespace-normal text-sm">{r.type}</span> : <StatusBadge label="Not set up" tone="warning" icon="fa-circle-exclamation" size="sm" surface="table" />),
    }
    const forward: ColumnDef<Row> = {
      key: "forward",
      label: "Moves forward when",
      width: 230,
      cell: (r) => (r.forward ? <span className="whitespace-normal text-sm">{r.forward}</span> : <span className="text-sm text-muted-foreground">Not set</span>),
    }
    const needs: ColumnDef<Row> = {
      key: "needs",
      label: NEEDS_LABEL,
      width: 220,
      cell: (r) => (r.needs ? <span className="whitespace-normal text-sm">{r.needs}</span> : <span className="text-sm text-muted-foreground">{r.m.rule.model ? "Nothing more" : "Not set"}</span>),
    }
    const used: ColumnDef<Row> = {
      key: "used",
      label: `${skillNounPlural().replace(/^./, (c) => c.toUpperCase())}`,
      width: 96,
      sortable: true,
      cell: (r) => {
        if (!r.used) return <span className="text-sm text-muted-foreground tabular-nums">0</span>
        const href = r.m.program ? to("admin/skills-library", { config: "default" }) : nav.href(r.id)
        return <Link href={href} onClick={(e) => e.stopPropagation()} className={cn(NUM_LINK, "text-sm tabular-nums")} aria-label={`${r.name}: ${countSkills(r.used)}`}>{r.used}</Link>
      },
    }
    const menu: ColumnDef<Row> = {
      key: "actions",
      label: "",
      width: 48,
      minWidth: 48,
      defaultPin: "right",
      lockPin: true,
      cell: (r) => (
        <div className="flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
          <RowMenu label={`Actions for ${r.name}`} entries={entries(r.m)} />
        </div>
      ),
    }
    return isMobile ? [name, used, menu] : [name, type, forward, needs, used, menu]
  }, [isMobile, nav, to]) // eslint-disable-line react-hooks/exhaustive-deps

  // Two tabs, Methods and Details (D-EM1116-c): one table and one filled action per view.
  const tab = params?.get("tab") === "details" ? "details" : "methods"
  const setTab = (v: string) => {
    const q = new URLSearchParams(params?.toString() ?? "")
    if (v === "details") q.set("tab", "details")
    else q.delete("tab")
    setBanner(null)
    const qs = q.toString()
    router.replace(qs ? `${pathname}?${qs}` : pathname ?? "?", { scroll: false })
  }
  const [addingDetail, setAddingDetail] = React.useState(false)
  const detailCount = React.useMemo(() => detailsOf(state).length, [state])
  const newMethod = () => nav.open(NEW)

  const editing = nav.id && hydrated ? (nav.id === NEW ? NEW : methodById(state, nav.id)) : null
  const missing = !!nav.id && hydrated && nav.id !== NEW && !editing

  const methodsBody = !hydrated ? (
    <div aria-busy="true"><Skeleton className="h-64 w-full" aria-label="Loading" /></div>
  ) : methods.length === 0 ? (
    // Zero state: only the way in [CALL 11-16].
    <section className="flex flex-col items-start gap-3 rounded-lg border border-dashed border-border p-6" data-methods-empty>
      <p className={TYPE.helper}>No evaluation methods yet.</p>
      <Button type="button" variant="default" size="sm" onClick={newMethod}>New method</Button>
    </section>
  ) : (
    <div data-region="methods">
      <DataTable<Row>
        key={isMobile ? "phone" : "wide"}
        data={rows}
        columns={columns}
        getRowId={(r) => r.id}
        onRowClick={(r) => nav.open(r.id)}
        selectable={false}
        edgeInset={false}
        emptyState={<EmptyBlock compact title="No methods match" body="Clear the search or filter to see every method." />}
      />
    </div>
  )
  const action = tab === "details"
    ? <Button type="button" variant="default" size="sm" onClick={() => setAddingDetail(true)} data-add-detail>Add detail</Button>
    : methods.length ? <Button type="button" variant="default" size="sm" onClick={newMethod} data-new-method>New method</Button> : undefined
  return (
    <div className="flex min-h-[calc(100dvh-5.5rem)] w-full flex-col" data-page-type="list" data-methods-list>
      <PageFrame title={<ReturnTitle plainToLists>{LIST_TITLE}</ReturnTitle>} className="flex-1" actions={action}>
        {missing ? <ResultBanner banner={{ variant: "warning", title: "This method was deleted or the link is out of date." }} onDismiss={nav.close} /> : null}
        {banner ? <ResultBanner banner={banner} onDismiss={() => setBanner(null)} /> : null}
        <Tabs value={tab} onValueChange={setTab} className="flex min-w-0 flex-col gap-4">
          <TabsList variant="line" ariaLabel={LIST_TITLE}>
            <TabsTrigger value="methods">Methods{hydrated ? <TabsCountBadge count={methods.length} /> : null}</TabsTrigger>
            <TabsTrigger value="details" data-details-tab>Details{hydrated ? <TabsCountBadge count={detailCount} /> : null}</TabsTrigger>
          </TabsList>
          <TabsContent value="methods" className="mt-0">{methodsBody}</TabsContent>
          <TabsContent value="details" className="mt-0">
            {hydrated ? <DetailsTable adding={addingDetail} setAdding={setAddingDetail} onBanner={setBanner} /> : <div aria-busy="true"><Skeleton className="h-64 w-full" aria-label="Loading" /></div>}
          </TabsContent>
        </Tabs>
      </PageFrame>
      {editing ? <MethodEditor key={editing === NEW ? NEW : editing.id} method={editing === NEW ? null : editing} onClose={nav.close} onSaved={(b) => { setBanner(b); nav.close() }} /> : null}
      <DeleteDialog
        method={deleting}
        onCancel={() => setDeleting(null)}
        onConfirm={() => {
          if (!deleting) return
          const name = deleting.name
          const r = deleteMethod(state, deleting.id)
          setDeleting(null)
          if (!r.ok) { setBanner({ variant: "warning", title: r.error }); return }
          store.update(() => r.state)
          setBanner({ variant: "success", title: `Deleted ${name}.` })
        }}
      />
    </div>
  )
}

// ---------------------------------------------------------------------------------------------------------------------
// The editor: one dialog for New method and Edit (prototype 31, 33, 34, 36, 37)

interface Draft {
  rule: LabRule
  setRule: SectionProps["setRule"]
  issues: RuleIssue[]
  /** The rule differs from what is saved (or nothing is saved yet). */
  ruleChanged: boolean
  saved: LabRule | null
}

/** Which store the draft lives in: the program's own (its method, or the first method of a program) or a local draft (any other method). */
function MethodEditor({ method, onClose, onSaved }: { method: EvaluationMethod | null; onClose: () => void; onSaved: (b: ResultBannerValue) => void }) {
  const state = useV2State()
  const hasProgram = methodsOf(state).some((m) => m.program)
  const programBacked = method ? method.program : !hasProgram
  return programBacked ? <ProgramEditor method={method} onClose={onClose} onSaved={onSaved} /> : <LocalEditor method={method} onClose={onClose} onSaved={onSaved} />
}

function ProgramEditor({ method, onClose, onSaved }: { method: EvaluationMethod | null; onClose: () => void; onSaved: (b: ResultBannerValue) => void }) {
  const m = useProgramSettings()
  const store = useV2Store()
  const state = useV2State()
  const [meta, setMeta] = React.useState({ name: method?.name ?? "", description: method?.description ?? "" })
  const [expanded, setExpanded] = React.useState(false)
  const go = (i: RuleIssue) => { if (hiddenQuestion(i)) setExpanded(true); requestAnimationFrame(() => requestAnimationFrame(() => focusField(i.field))) }
  const s = useProgramSave(m, go)
  const { rule, setRule } = m
  // A program not saved yet: group check-off starts off once there is a model, never the model's default [REQ SC-02].
  const undecided = !m.saved && !!rule.model && rule.checkOff?.enabled == null
  React.useEffect(() => { if (undecided) setRule(withCheckOffDecided) }, [undecided, setRule])
  const uncarried = !m.saved && !!rule.model && !hasNeed(rule)
  React.useEffect(() => { if (uncarried) setRule(withCarried) }, [uncarried, setRule])
  // The program's save shows its own result; the editor closes on it.
  const result = m.result
  React.useEffect(() => {
    if (!result) return
    const said = result.written ? `Saved for ${countSkills(result.written)}.` : "Saved."
    onSaved({ variant: "success", title: said })
  }, [result]) // eslint-disable-line react-hooks/exhaustive-deps
  const draft: Draft = { rule, setRule, issues: m.issues, ruleChanged: !m.saved || m.dirty, saved: m.saved }
  const save = (): string | null => {
    // Name first: it is the first field, and a new method needs it before anything is written.
    const err = nameIssue(state, meta.name, method?.id ?? PROGRAM_METHOD_ID)
    if (err) return err
    let next = state
    if (!method) {
      const c = createMethod(state, meta.name)
      if (!c.ok) return c.error
      next = c.state
    }
    const u = updateMethodMeta(next, PROGRAM_METHOD_ID, meta)
    if (!u.ok) return u.error
    if (draft.ruleChanged) {
      if (m.issues.length) { m.setShowErrors(true); go(m.issues[0]!); return "" }
      store.update(() => u.state)
      s.save()
      return null
    }
    store.update(() => u.state)
    onSaved({ variant: "success", title: `Saved ${meta.name.trim()}.` })
    return null
  }
  return (
    <>
      <EditorDialog method={method} draft={draft} meta={meta} setMeta={setMeta} showErrors={m.showErrors} setShowErrors={m.setShowErrors} expanded={expanded} setExpanded={setExpanded} onClose={() => { m.discard(); onClose() }} onSave={save} onGo={go} />
      {s.dialog}
    </>
  )
}

function LocalEditor({ method, onClose, onSaved }: { method: EvaluationMethod | null; onClose: () => void; onSaved: (b: ResultBannerValue) => void }) {
  const store = useV2Store()
  const state = useV2State()
  // A seed rule with group check-off undecided reads as decided (off) at once, so opening it is not a change.
  const base = React.useMemo(() => { const r = method?.rule ?? emptyRule(); return r.model && r.checkOff?.enabled == null ? withCheckOffDecided(r) : r }, [method])
  const [rule, setRuleState] = React.useState<LabRule>(base)
  const setRule = React.useCallback<SectionProps["setRule"]>((fn) => setRuleState((r) => (typeof fn === "function" ? fn(r) : fn)), [])
  const [meta, setMeta] = React.useState({ name: method?.name ?? "", description: method?.description ?? "" })
  const [showErrors, setShowErrors] = React.useState(false)
  const [expanded, setExpanded] = React.useState(false)
  const [confirm, setConfirm] = React.useState(false)
  // A new rule: group check-off starts off once there is a model [REQ SC-02].
  const undecided = !!rule.model && rule.checkOff?.enabled == null
  React.useEffect(() => { if (undecided) setRule(withCheckOffDecided) }, [undecided, setRule])
  const issues = React.useMemo<RuleIssue[]>(() => (rule.model ? programIssues(withCarried(rule)) : [{ id: "cfg-model:missing", section: "model" as const, field: "cfg-model", message: `Choose how ${skillNounPlural()} are judged.` }]), [rule])
  const ruleChanged = !method || JSON.stringify(rule) !== JSON.stringify(base)
  const go = (i: RuleIssue) => { if (hiddenQuestion(i)) setExpanded(true); requestAnimationFrame(() => requestAnimationFrame(() => focusField(i.field))) }
  const impact = React.useMemo(() => (confirm && method ? methodImpact(state, method.id, withCarried(rule)) : []), [confirm, state, method, rule])
  const write = () => {
    setConfirm(false)
    let s0 = state
    let id = method?.id
    if (!id) {
      const c = createMethod(state, meta.name)
      if (!c.ok) { onSaved({ variant: "warning", title: c.error }); return }
      s0 = c.state
      id = c.id
    }
    const u = updateMethodMeta(s0, id, meta)
    if (!u.ok) { onSaved({ variant: "warning", title: u.error }); return }
    let s1 = u.state
    let reach = ""
    let missed = ""
    if (ruleChanged) {
      const r = saveMethod(s1, id, withCarried(rule), { at: now(), byId: ADMIN_ID })
      if (!r.ok) { onSaved({ variant: "warning", title: r.error }); return }
      s1 = r.state
      reach = r.written ? ` ${countSkills(r.written)} updated.` : ""
      missed = r.failed.length ? ` Not saved for ${r.failed.join(", ")}.` : ""
    }
    store.update(() => s1)
    onSaved({ variant: missed ? "warning" : "success", title: `${method ? "Saved" : "Created"} ${meta.name.trim()}.${reach}${missed}` })
  }
  const save = (): string | null => {
    const err = nameIssue(state, meta.name, method?.id)
    if (err) return err
    if (ruleChanged && issues.length) { setShowErrors(true); go(issues[0]!); return "" }
    if (method && ruleChanged && method.skillIds.length) { setConfirm(true); return null }
    write()
    return null
  }
  const n = method?.skillIds.length ?? 0
  return (
    <>
      <EditorDialog method={method} draft={{ rule, setRule, issues, ruleChanged, saved: method ? base : null }} meta={meta} setMeta={setMeta} showErrors={showErrors} setShowErrors={setShowErrors} expanded={expanded} setExpanded={setExpanded} onClose={onClose} onSave={save} onGo={go} />
      <AlertDialog open={confirm} onOpenChange={setConfirm}>
        <AlertDialogContent className="z-[98]">
          <AlertDialogHeader>
            <AlertDialogTitle>{`Save ${meta.name.trim() || "this method"} for ${countSkills(n)}?`}</AlertDialogTitle>
            <AlertDialogDescription>
              {impact.length
                ? `${impact.length} ${impact.length === 1 ? "student's" : "students'"} progress changes. Each ${skillNoun()} keeps its own Times needed. No evaluation is deleted.`
                : `No student's progress changes. Each ${skillNoun()} keeps its own Times needed.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {impact.length ? (
            <ul className="max-h-40 overflow-y-auto rounded-md border border-border p-3 text-sm" aria-label="Students whose progress changes" data-impact-names>
              {impact.slice(0, 50).map((p) => <li key={p.id}>{p.name}</li>)}
              {impact.length > 50 ? <li className="text-muted-foreground">{`and ${impact.length - 50} more`}</li> : null}
            </ul>
          ) : null}
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={write}>{`Save for ${countSkills(n)}`}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

/** "Used by 166 skills" in the type line. The program's count opens the Library on Default, as a link only while nothing is unsaved (a link out of unsaved work would not ask first). */
function UsedBy({ method, linked }: { method: EvaluationMethod; linked: boolean }) {
  const to = useLabHref()
  const n = method.skillIds.length
  if (!n) return <span data-used-by>{`No ${skillNoun()} uses it yet`}</span>
  return (
    <span data-used-by>
      {"Used by "}
      {method.program && linked ? <Link href={to("admin/skills-library", { config: "default" })} className={NUM_LINK}>{countSkills(n)}</Link> : countSkills(n)}
    </span>
  )
}

/** An on or off choice the dialog saves with its button: a checkbox and its name (a switch would say it applies at once). */
function Check({ id, label, checked, onChange, invalid, describedBy }: { id: string; label: string; checked: boolean; onChange: (v: boolean) => void; invalid?: boolean; describedBy?: string }) {
  return (
    <div className="flex min-h-6 items-center gap-2.5">
      <Checkbox id={id} checked={checked} onCheckedChange={(c) => onChange(c === true)} aria-invalid={invalid || undefined} aria-describedby={describedBy} />
      <Label htmlFor={id} className="font-normal">{label}</Label>
    </div>
  )
}

function EditorDialog({ method, draft, meta, setMeta, showErrors, setShowErrors, expanded, setExpanded, onClose, onSave, onGo }: {
  method: EvaluationMethod | null
  draft: Draft
  meta: { name: string; description: string }
  setMeta: React.Dispatch<React.SetStateAction<{ name: string; description: string }>>
  showErrors: boolean
  setShowErrors: (v: boolean) => void
  expanded: boolean
  setExpanded: (v: boolean) => void
  onClose: () => void
  /** null when saved or handed on; a string is a name problem ("" when the rule's own problems were shown). */
  onSave: () => string | null
  onGo: (i: RuleIssue) => void
}) {
  const { rule, setRule, issues, ruleChanged, saved } = draft
  const [nameError, setNameError] = React.useState<string | null>(null)
  const [describing, setDescribing] = React.useState(!!meta.description)
  const [changing, setChanging] = React.useState(false)
  const metaChanged = !method || meta.name !== method.name || meta.description !== (method.description ?? "")
  const dirty = ruleChanged || (!!method && metaChanged) || (!method && (!!meta.name.trim() || !!rule.model))
  const canSave = !method || ruleChanged || metaChanged
  const discard = useDialogDiscard(dirty, onClose)
  const props: SectionProps = { rule, setRule, issues, showErrors, settings: [] }
  const err = (f: string) => (showErrors ? issues.find((i) => i.field === f)?.message : undefined)
  // A method with a saved type: the type is a fact under the title, and the four tiles wait behind "Change type" (the rarest edit, REQ SC-09).
  const settled = !!method && !!saved?.model
  const typeChanged = settled && rule.model !== saved?.model
  const tilesOpen = !settled || changing
  const grant = rule.model ? checkOffGrantSelect(rule, setRule) : null
  const roleErr = err("cfg-role-preceptor")
  const shownIssues = showErrors ? issues : []
  const problems = (nameError ? 1 : 0) + shownIssues.length
  const save = () => {
    // No type yet: the one thing to fix, and the name field is not on screen until there is one.
    if (!rule.model) {
      setShowErrors(true)
      requestAnimationFrame(() => document.querySelector<HTMLElement>("[data-type-tiles] [role=radio]")?.focus())
      return
    }
    const r = onSave()
    if (r) {
      setNameError(r)
      if (ruleChanged && issues.length) setShowErrors(true)
      requestAnimationFrame(() => document.getElementById("method-name")?.focus())
    } else if (r === "") setNameError(null)
  }
  const toFirstProblem = () => {
    if (nameError) document.getElementById("method-name")?.focus()
    else if (!rule.model) document.querySelector<HTMLElement>("[data-type-tiles] [role=radio]")?.focus()
    else if (shownIssues[0]) onGo(shownIssues[0])
  }
  const checkOffOn = !!rule.model && ruleAllowsCheckOff(rule)
  return (
    <Dialog open onOpenChange={(o) => { if (!o) discard.close() }}>
      <DialogContent
        className="flex max-h-[90dvh] w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-5xl max-sm:h-dvh max-sm:max-h-dvh max-sm:max-w-none max-sm:rounded-none"
        data-method-editor
        // Editing: focus the dialog, so nothing is selected or changed by opening it. New: the first type.
        onOpenAutoFocus={(e) => { if (method) { e.preventDefault(); (e.currentTarget as HTMLElement | null)?.focus() } }}
        onEscapeKeyDown={(e) => { if (dirty) { e.preventDefault(); discard.close() } }}
        // A press outside only. Focus also leaves when a dialog of the editor's own opens (the save confirm, Preview, the type switch question):
        // that is not leaving, and asking to discard under it would hide the confirm from a screen reader.
        onPointerDownOutside={(e) => { if (dirty) { e.preventDefault(); discard.close() } }}
      >
        <DialogHeader className="gap-1 border-b border-border px-6 py-4 text-start">
          <DialogTitle>{method ? "Edit method" : "New method"}</DialogTitle>
          <DialogDescription className="sr-only">{`How ${skillNounPlural()} that use this method are evaluated.`}</DialogDescription>
          {settled && method && rule.model ? (
            <div className={cn(TYPE.helper, "flex flex-wrap items-center gap-x-2 gap-y-1 pe-8 max-sm:gap-x-4")} data-type-line>
              <span className="text-foreground" data-type-name>{LAB_MODEL_LABEL[rule.model]}</span>
              {typeChanged ? <ChangedMark /> : null}
              <span className="max-sm:hidden" aria-hidden="true">·</span>
              <UsedBy method={method} linked={!dirty} />
              <span className="max-sm:hidden" aria-hidden="true">·</span>
              <Button type="button" variant="link" size="sm" className="h-auto p-0 font-normal" aria-expanded={changing} aria-controls="cfg-type-tiles" onClick={() => setChanging((v) => !v)} data-change-type>
                {changing ? "Hide types" : "Change type"}
              </Button>
            </div>
          ) : null}
        </DialogHeader>
        <div className="@container min-h-0 flex-1 overflow-y-auto" data-method-body>
          <ReorderHelp />
          {tilesOpen ? (
            // The four types, one line each: all of New until one is chosen; in Edit only after "Change type". A switch that would remove levels or
            // questions asks first (ModelSection's dialog, REQ SC-09).
            <div id="cfg-type-tiles" className={cn("@container px-6 py-5", rule.model && "border-b border-border")} data-type-tiles>
              <ModelSection {...props} examples={TYPE_LINE} legend="Type" legendHidden={settled} row />
            </div>
          ) : null}
          {rule.model ? (
            <div className="grid min-w-0 @[48rem]:grid-cols-[minmax(0,1fr)_20rem]">
              {/* Left: what the method is called and what the evaluator picks. */}
              <div className="flex min-w-0 flex-col gap-6 px-6 py-5" data-region="method">
                <div className="flex min-w-0 flex-col gap-4">
                  <Field data-invalid={nameError ? true : undefined}>
                    <FieldLabel htmlFor="method-name">Name</FieldLabel>
                    <Input id="method-name" value={meta.name} maxLength={80} autoComplete="off" placeholder="For example, Supervised levels" aria-invalid={nameError ? true : undefined} aria-describedby={nameError ? "method-name-error" : undefined} onChange={(e) => { setMeta((x) => ({ ...x, name: e.target.value })); if (nameError) setNameError(null) }} />
                    {nameError ? <FieldError id="method-name-error">{nameError}</FieldError> : null}
                    {describing ? null : (
                      <div className="flex justify-start">
                        <Button type="button" variant="link" size="sm" className="h-auto p-0 font-normal" onClick={() => { setDescribing(true); requestAnimationFrame(() => document.getElementById("method-description")?.focus()) }} data-add-description>
                          Add a description
                        </Button>
                      </div>
                    )}
                  </Field>
                  {describing ? (
                    <Field>
                      <FieldLabel htmlFor="method-description">Description</FieldLabel>
                      <Input id="method-description" value={meta.description} maxLength={160} autoComplete="off" onChange={(e) => setMeta((x) => ({ ...x, description: e.target.value }))} />
                    </Field>
                  ) : null}
                </div>
                <div className="flex min-w-0 flex-col gap-6" data-type-body>
                  {rule.model === "demonstration" ? (
                    <LevelsField rule={rule} setRule={setRule} err={err} plain presets={!saved?.model} />
                  ) : rule.model === "binary" ? (
                    <OutcomesField rule={rule} setRule={setRule} err={err} plain presets={!saved?.model} />
                  ) : (
                    // In the order one depends on the next [REQ SC-17]: the questions, the scale they are scored on, what moves a student forward.
                    <>
                      <QuestionsField rule={rule} setRule={setRule} err={err} expanded={expanded} setExpanded={setExpanded} plain />
                      {rule.model === "scored" ? (
                        <FieldBlock label="Scale" plain>
                          <ScaleField rule={rule} setRule={setRule} issues={issues} showErrors={showErrors} short />
                        </FieldBlock>
                      ) : null}
                      {rule.model === "question"
                        ? <QuestionCountsWhen rule={rule} setRule={setRule} err={err} label="Moves forward when" plain />
                        : <ScoredCountsWhen rule={rule} setRule={setRule} err={err} label="Moves forward when" plain />}
                    </>
                  )}
                </div>
              </div>
              {/* Right: how an evaluation runs, the same for every skill on the method [CALL 11-16]. One hairline, no card. */}
              <div className="flex min-w-0 flex-col gap-6 border-t border-border px-6 py-5 @[48rem]:border-s @[48rem]:border-t-0" data-region="evaluation">
                <FieldSet className="gap-0" data-roles>
                  <FieldLegend variant="label" className="mb-2">Who can evaluate</FieldLegend>
                  <div className="flex flex-col gap-1.5">
                  {ROLES.map((role) => (
                    <Check
                      key={role}
                      id={`cfg-role-${role}`}
                      label={ROLE_LABEL[role]}
                      checked={rule.evaluatorRoles.includes(role)}
                      onChange={(v) => setRule((r) => ({ ...r, evaluatorRoles: ROLES.filter((x) => (x === role ? v : r.evaluatorRoles.includes(x))) }))}
                      invalid={!!roleErr}
                      describedBy={roleErr ? "cfg-roles-error" : undefined}
                    />
                  ))}
                  </div>
                  {/* In this dialog's words ("evaluate"); the rule's own message says "sign off". */}
                  {roleErr ? <FieldError id="cfg-roles-error" className="mt-2">Choose who can evaluate.</FieldError> : null}
                </FieldSet>
                <FieldSet className="gap-0" data-needs>
                  <FieldLegend variant="label" className="mb-2">{NEEDS_LABEL}</FieldLegend>
                  <div className="flex flex-col gap-1.5">
                    {NEEDS.map((n) => <Check key={n.id} id={n.id} label={n.label} checked={rule[n.key]} onChange={(v) => setRule((r) => ({ ...r, [n.key]: v }))} />)}
                  </div>
                </FieldSet>
                <div className="flex min-w-0 flex-col gap-2" data-section="checkoff">
                  <Check id="cfg-checkoff" label={CHECKOFF_SWITCH_LABEL} checked={checkOffOn} onChange={(v) => setRule((r) => withCheckOffPatch(r, { enabled: v }))} />
                  {checkOffOn ? (
                    <div className="flex min-w-0 flex-col gap-2 ps-6.5" data-checkoff-grant>
                      {grant ? (
                        <>
                          <Label htmlFor={grant.id} className="font-normal">{CHECKOFF_GRANT_LABEL}</Label>
                          {/* As wide as its longest level, never wider than the column ("Independent", "Performed with assistance"). */}
                          <div className="flex min-w-0 max-w-full">{grant.control}</div>
                          <CheckOffGrantNote rule={rule} id={grant.id} />
                        </>
                      ) : (
                        <p className={TYPE.helper}>{`${CHECKOFF_GRANT_LABEL} ${rule.model === "binary" ? (rule.qualifyingLabel !== null && rule.outcomeLabels[rule.qualifyingLabel].trim() ? inSentence(rule.outcomeLabels[rule.qualifyingLabel].trim()) : "the outcome that moves a student forward") : rule.model === "question" ? "every question answered Yes" : "the level that moves a student forward"}.`}</p>
                      )}
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          ) : null}
        </div>
        {/* A plain bar, not DialogFooter: the DS footer's own negative margins assume the dialog's padding, which this body removes. Preview stands
            alone at the start; what is left to fix sits beside the button that was pressed. */}
        <div className="flex shrink-0 flex-wrap items-center gap-2 border-t border-border bg-background px-6 py-3" data-save-bar>
          {rule.model ? <ProgramPreviewDialog draft={withCarried(rule)} variant="ghost" /> : null}
          <div className="flex min-w-0 flex-1 items-center justify-end max-sm:order-first max-sm:basis-full max-sm:justify-start" aria-live="assertive" aria-atomic="true">
            {problems ? (
              <Button type="button" variant="link" size="sm" className="h-auto p-0 text-destructive" onClick={toFirstProblem} data-save-bar-problems>
                {`${problems} to fix`}
              </Button>
            ) : null}
          </div>
          <div className="flex items-center gap-2 max-sm:ms-auto">
            <Button type="button" variant="outline" size="sm" onClick={discard.close}>Cancel</Button>
            <Button type="button" variant="default" size="sm" onClick={save} disabled={!canSave} data-save-method>{method ? "Save method" : "Create method"}</Button>
          </div>
        </div>
        {discard.question}
      </DialogContent>
    </Dialog>
  )
}

export function AdminEvaluationSettingsG() {
  return <MethodsList />
}
