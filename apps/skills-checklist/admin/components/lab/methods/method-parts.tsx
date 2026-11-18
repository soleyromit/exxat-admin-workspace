"use client"

/**
 * Shared parts of the method editors beside G: Evaluation settings H, I and J (Proposed, D-EM1116-f; contract ADMIN-D3 "round 5 variants")
 * and K, L, M and N (Proposed, D-EM1116-g; "round 6 variants"). G keeps its own copy, so nothing here can change G.
 *
 *   - `useMethodNav`: the list, or one method at `?method=<id|new>`; hrefs are absolute and keep the variant, so the leave guard hears them.
 *   - `MethodDraft`: one draft of a method (the program's through the program save, any other locally), its problems, its save and confirm
 *     dialogs [REQ SC-18, AE-02]. The same rules as G's editor.
 *   - The fields, one group each: name, type tiles, what the evaluator picks, who can evaluate, what each evaluation needs, group check-off.
 *   - `SettingsHome`: the page with the Methods and Details tabs (D-EM1116-c). `MethodsTable`: the list H and J open a method from.
 */
import * as React from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import { Checkbox } from "@exxatdesignux/ui/components/ui/checkbox"
import { Input } from "@exxatdesignux/ui/components/ui/input"
import { Textarea } from "@exxatdesignux/ui/components/ui/textarea"
import { ViewSegmentedControl } from "@exxatdesignux/ui/components/ui/view-segmented-control"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@exxatdesignux/ui/components/ui/select"
import { Label } from "@exxatdesignux/ui/components/ui/label"
import { Skeleton } from "@exxatdesignux/ui/components/ui/skeleton"
import { StatusBadge } from "@exxatdesignux/ui"
import { Tabs, TabsContent, TabsCountBadge, TabsList, TabsTrigger } from "@exxatdesignux/ui/components/ui/tabs"
import { Field, FieldError, FieldLabel, FieldLegend, FieldSet } from "@exxatdesignux/ui/components/ui/field"
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
import { DiscardChangesDialog } from "@/components/lab/shared/unsaved-guard"
import { EmptyBlock } from "@/components/lab/empty-block"
import { CHECKOFF_GRANT_LABEL, CHECKOFF_SWITCH_LABEL, CheckOffGrantNote, checkOffBelowCut, ModelSection, ScaleField, checkOffGrantSelect, withCheckOffPatch, type SectionProps } from "@/components/lab/configure/fields"
import { DetailsTable } from "@/components/lab/configure/details-table"
import { EvaluatorScreen, ExamplePicker, StudentScreen, evaluatorScreenText, studentScreenText, type Example } from "@/components/lab/configure/program-preview"
import { holdSecondPress } from "@/components/lab/shared/focus"
import { EVALUATION_SETTINGS_TITLE } from "@/components/lab/configure/program-layout"
import { ChangedMark, FieldBlock, LevelsField, OutcomesField, QUESTIONS_SHOWN, QuestionCountsWhen, QuestionsField, ReorderHelp, ScoredCountsWhen } from "@/components/lab/configure/settings-sheet"
import { useProgramSave, useProgramSettings } from "@/components/lab/configure/program-parts"
import { focusField } from "@/components/lab/configure/use-configure"
import { LAB_MODEL_LABEL, ROLE_LABEL, ROLES, emptyRule, hasNeed, ruleAllowsCheckOff, withCheckOffDecided, withModel, type LabRule, type RuleIssue } from "@/lib/lab/configure"
import type { EvalModel } from "@/lib/v2/types"
import { buildLibrary } from "@/lib/lab/library"
import { resolveRule, skillRuleOf } from "@/lib/lab/program-settings"
import { detailsOf } from "@/lib/lab/details"
import { programIssues } from "@/lib/lab/program-settings"
import { passChip } from "@/lib/lab/rule-path"
import { PROGRAM_METHOD_ID, createMethod, deleteBlocked, deleteMethod, duplicateMethod, methodById, methodImpact, methodsOf, nameIssue, saveMethod, updateMethodMeta, type EvaluationMethod } from "@/lib/lab/methods"
import { useV2Hydrated, useV2State, useV2Store } from "@/lib/v2/react"
import { aNoun, capitalize, inSentence, skillNoun, skillNounPlural, countSkills } from "@/lib/lab/terms"

export const NEW = "new" as const
export const SETTINGS_TITLE = EVALUATION_SETTINGS_TITLE
const now = () => new Date().toISOString()
const ADMIN_ID = "admin"

/** One line per type, so the choice can be made from the tile. Our four REQ models under their glossary names [REQ 4.1]. */
export const TYPE_LINE: Record<EvalModel, string> = {
  demonstration: "The evaluator picks one level from an ordered list.",
  binary: "The evaluator picks one of two outcomes you name.",
  question: "Yes or No on each question. You choose how many must be Yes.",
  scored: "Each question is scored on one scale. You set the score needed.",
}

/** What an evaluation needs besides the evaluator's answer [REQ SC-14, SC-15]: one source for checkboxes, list cells and summaries. */
export const NEEDS = [
  { id: "cfg-self", key: "selfEvaluation", label: "Student self-evaluation first", short: "Self-evaluation first" },
  { id: "cfg-feedback", key: "feedbackRequired", label: "Feedback from the evaluator", short: "Evaluator feedback" },
  { id: "cfg-approval", key: "approvalRequired", label: "Admin approval before it counts", short: "Admin approval" },
] as const
export const NEEDS_LABEL = "Each evaluation needs"
export const ROLES_LABEL = "Who can evaluate"
export const PICKS_LABEL = "What the evaluator picks"
export const CHECKOFF_HEADING = "Group check-off"

/**
 * Q's section icons (Romit 2026-11-17, D-EM1117-q, revised: "too many icons, no UI and UX hierarchy"): one Font Awesome light icon per section
 * heading, muted, decorative; no icons on field labels or options. The type icons identify a type inside the Type select only; they are the
 * ones the type tiles already use (configure/fields MODEL_ICON), so a type reads the same everywhere.
 */
export const TYPE_ICON: Record<EvalModel, string> = { binary: "fa-circle-half-stroke", question: "fa-list-check", scored: "fa-star-half-stroke", demonstration: "fa-stairs" }
export const SECTION_ICON = { picks: "fa-hand-pointer", roles: "fa-user-check", needs: "fa-clipboard-list", checkOff: "fa-users" } as const

/**
 * A section heading of Q's panel: one step above a field label (16 semibold against 14 medium), with its one plain icon. A plain muted glyph,
 * not a tinted chip: four chips stacked down a narrow panel read as four more objects, a glyph reads as part of the heading.
 */
export function SectionHeading({ icon, id, children }: { icon: string; id?: string; children: React.ReactNode }) {
  return (
    <h3 id={id} className={cn(TYPE.card, "flex items-center gap-2")}>
      <i className={`fa-light ${icon} w-4 shrink-0 text-center text-sm text-muted-foreground`} aria-hidden="true" data-section-icon={icon} />
      {children}
    </h3>
  )
}

const lowerFirst = (s: string) => `${s.charAt(0).toLowerCase()}${s.slice(1)}`

/** "Self-evaluation first, admin approval". Empty when the evaluator's answer is all it takes. */
export function needsLine(rule: LabRule): string {
  return NEEDS.filter((n) => rule[n.key]).map((n, k) => (k ? lowerFirst(n.short) : n.short)).join(", ")
}

/** A problem in a question the list hides (past the first 8): the list opens before focus moves to it. */
const hiddenQuestion = (i: RuleIssue) => {
  const m = /^cfg-question-(\d+)$/.exec(i.field)
  return !!m && Number(m[1]) >= QUESTIONS_SHOWN
}

/** Times needed lives per skill on the list [CALL 11-16]: a method not saved yet carries 1 only when unset [INFER, open]. */
export const withCarried = (r: LabRule): LabRule => ({ ...r, need: hasNeed(r) ? r.need : 1 })

// ---------------------------------------------------------------------------------------------------------------------
// URL

export function useMethodNav() {
  const params = useSearchParams()
  const to = useLabHref()
  const router = useRouter()
  const pathname = usePathname() ?? ""
  const id = params?.get("method") ?? null
  /** An absolute href on this page: the variant and return context stay, so a click stays in the design being walked. */
  const href = React.useCallback((methodId: string | null, tab?: "methods" | "details") => {
    const q = new URLSearchParams()
    for (const k of ["variant", "from", "list", "tab"]) {
      const v = params?.get(k)
      if (v && !(k === "tab" && (methodId || tab))) q.set(k, v)
    }
    if (tab === "details") q.set("tab", "details")
    if (methodId) q.set("method", methodId)
    const out = to(`?${q.toString()}`)
    return `${pathname}${out === "?" ? "" : out}`
  }, [params, to, pathname])
  const open = React.useCallback((methodId: string) => router.push(href(methodId), { scroll: false }), [router, href])
  const close = React.useCallback(() => router.replace(href(null), { scroll: false }), [router, href])
  const tab: "methods" | "details" = params?.get("tab") === "details" ? "details" : "methods"
  return { id, href, open, close, tab, go: (url: string) => router.replace(url, { scroll: false }) }
}

// ---------------------------------------------------------------------------------------------------------------------
// The draft

export type SaveOutcome = "ok" | "type" | "name" | "rule"

export interface MethodModel {
  /** Null for a new method. */
  method: EvaluationMethod | null
  rule: LabRule
  setRule: SectionProps["setRule"]
  issues: RuleIssue[]
  /** The rule as saved, or null when nothing is saved yet. */
  saved: LabRule | null
  meta: { name: string; description: string }
  setMeta: React.Dispatch<React.SetStateAction<{ name: string; description: string }>>
  nameError: string | null
  clearNameError: () => void
  showErrors: boolean
  expanded: boolean
  setExpanded: (v: boolean) => void
  props: SectionProps
  err: (f: string) => string | undefined
  /** A method with a saved type: the type is a fact, and the four tiles wait behind "Change type" [REQ SC-09]. */
  settled: boolean
  typeChanged: boolean
  dirty: boolean
  /** Problems a failed save showed: the name's and the rule's. */
  problems: number
  /** The first rule problem on show, for a layout that has to open the place it lives in. */
  firstIssue: RuleIssue | null
  save: () => SaveOutcome
  /** Back to what is saved. */
  reset: () => void
  toFirstProblem: () => void
}

type Saved = (b: ResultBannerValue, id: string | null) => void
type DraftProps = { method: EvaluationMethod | null; onSaved: Saved; onDirty?: (d: boolean) => void; children: (m: MethodModel) => React.ReactNode; /** Q (D-EM1117-q): the save confirm in the handoff spec's words ("Update n skills?", "Keep editing"). Other variants keep theirs. */ confirmWords?: "update" }

function useModel(a: {
  method: EvaluationMethod | null
  rule: LabRule
  setRule: SectionProps["setRule"]
  issues: RuleIssue[]
  ruleChanged: boolean
  saved: LabRule | null
  showErrors: boolean
  setShowErrors: (v: boolean) => void
  /** null when saved or handed on; a string is a name problem ("" when the rule's own problems were shown). */
  onSave: (meta: { name: string; description: string }) => string | null
  resetRule: () => void
  go: (i: RuleIssue) => void
  expanded: boolean
  setExpanded: (v: boolean) => void
  onDirty?: (d: boolean) => void
}): MethodModel {
  const { method, rule, setRule, issues, ruleChanged, saved, showErrors } = a
  const orig = React.useMemo(() => ({ name: method?.name ?? "", description: method?.description ?? "" }), [method])
  const [meta, setMeta] = React.useState(orig)
  const [nameError, setNameError] = React.useState<string | null>(null)
  const metaChanged = !method || meta.name !== method.name || meta.description !== (method.description ?? "")
  const dirty = method ? (method.saved ? ruleChanged : !!rule.model) || metaChanged : !!meta.name.trim() || !!rule.model
  const { onDirty } = a
  React.useEffect(() => { onDirty?.(dirty) }, [dirty, onDirty])
  React.useEffect(() => () => onDirty?.(false), [onDirty])
  const settled = !!method && !!saved?.model
  const shown = showErrors ? issues : []
  const focusTiles = () => requestAnimationFrame(() => document.querySelector<HTMLElement>("[data-type-tiles] [role=radio]")?.focus())
  const focusName = () => requestAnimationFrame(() => requestAnimationFrame(() => document.getElementById("method-name")?.focus()))
  return {
    method, rule, setRule, issues, saved, meta, setMeta, nameError, showErrors,
    clearNameError: () => setNameError(null),
    expanded: a.expanded,
    setExpanded: a.setExpanded,
    props: { rule, setRule, issues, showErrors, settings: [] },
    err: (f) => (showErrors ? issues.find((i) => i.field === f)?.message : undefined),
    settled,
    typeChanged: settled && rule.model !== saved?.model,
    dirty,
    problems: (nameError ? 1 : 0) + shown.length,
    firstIssue: shown[0] ?? null,
    save: () => {
      // No type yet: the one thing to fix [REQ SC-02].
      if (!rule.model) { a.setShowErrors(true); focusTiles(); return "type" }
      const r = a.onSave(meta)
      if (r) {
        setNameError(r)
        if (ruleChanged && issues.length) a.setShowErrors(true)
        focusName()
        return "name"
      }
      setNameError(null)
      return r === "" ? "rule" : "ok"
    },
    reset: () => { a.resetRule(); setMeta(orig); setNameError(null); a.setShowErrors(false) },
    toFirstProblem: () => {
      if (nameError) focusName()
      else if (!rule.model) focusTiles()
      else if (shown[0]) a.go(shown[0])
    },
  }
}

const goTo = (setExpanded: (v: boolean) => void) => (i: RuleIssue) => {
  if (hiddenQuestion(i)) setExpanded(true)
  requestAnimationFrame(() => requestAnimationFrame(() => focusField(i.field)))
}

/** The program's method: its save is the program's save, whose Apply dialog names who changes [REQ AE-02]. */
function ProgramDraft({ method, onSaved, onDirty, children }: DraftProps) {
  const m = useProgramSettings()
  const store = useV2Store()
  const state = useV2State()
  const [expanded, setExpanded] = React.useState(false)
  const go = goTo(setExpanded)
  const s = useProgramSave(m, go)
  const { rule, setRule } = m
  // A program not saved yet: group check-off starts off once there is a model, never the model's default [REQ SC-02].
  const undecided = !m.saved && !!rule.model && rule.checkOff?.enabled == null
  React.useEffect(() => { if (undecided) setRule(withCheckOffDecided) }, [undecided, setRule])
  const uncarried = !m.saved && !!rule.model && !hasNeed(rule)
  React.useEffect(() => { if (uncarried) setRule(withCarried) }, [uncarried, setRule])
  const result = m.result
  React.useEffect(() => {
    if (!result) return
    onSaved({ variant: "success", title: result.written ? `Saved for ${countSkills(result.written)}.` : "Saved." }, PROGRAM_METHOD_ID)
  }, [result]) // eslint-disable-line react-hooks/exhaustive-deps
  const ruleChanged = !m.saved || m.dirty
  const model = useModel({
    method, rule, setRule, issues: m.issues, ruleChanged, saved: m.saved, showErrors: m.showErrors, setShowErrors: m.setShowErrors, expanded, setExpanded, go, onDirty,
    resetRule: m.discard,
    onSave: (meta) => {
      // Name first: a new method needs it before anything is written.
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
      if (ruleChanged) {
        if (m.issues.length) { m.setShowErrors(true); go(m.issues[0]!); return "" }
        store.update(() => u.state)
        s.save()
        return null
      }
      store.update(() => u.state)
      onSaved({ variant: "success", title: `Saved ${meta.name.trim()}.` }, PROGRAM_METHOD_ID)
      return null
    },
  })
  return <>{children(model)}{s.dialog}</>
}

/** Any other method: a local draft, written to its skills after naming the students whose progress changes [REQ AE-02]. */
function LocalDraft({ method, onSaved, onDirty, children, confirmWords }: DraftProps) {
  const store = useV2Store()
  const state = useV2State()
  // A seed rule with group check-off undecided reads as decided (off) at once, so opening it is not a change.
  const base = React.useMemo(() => { const r = method?.rule ?? emptyRule(); return r.model && r.checkOff?.enabled == null ? withCheckOffDecided(r) : r }, [method])
  const [rule, setRuleState] = React.useState<LabRule>(base)
  const setRule = React.useCallback<SectionProps["setRule"]>((fn) => setRuleState((r) => (typeof fn === "function" ? fn(r) : fn)), [])
  const [showErrors, setShowErrors] = React.useState(false)
  const [expanded, setExpanded] = React.useState(false)
  const [confirm, setConfirm] = React.useState<{ name: string; description: string } | null>(null)
  const undecided = !!rule.model && rule.checkOff?.enabled == null
  React.useEffect(() => { if (undecided) setRule(withCheckOffDecided) }, [undecided, setRule])
  const issues = React.useMemo<RuleIssue[]>(() => (rule.model ? programIssues(withCarried(rule)) : [{ id: "cfg-model:missing", section: "model" as const, field: "cfg-model", message: `Choose how ${skillNounPlural()} are judged.` }]), [rule])
  const ruleChanged = !method || JSON.stringify(rule) !== JSON.stringify(base)
  const go = goTo(setExpanded)
  const impact = React.useMemo(() => (confirm && method ? methodImpact(state, method.id, withCarried(rule)) : []), [confirm, state, method, rule])
  const write = (meta: { name: string; description: string }) => {
    setConfirm(null)
    let s0 = state
    let id = method?.id
    if (!id) {
      const c = createMethod(state, meta.name)
      if (!c.ok) { onSaved({ variant: "warning", title: c.error }, null); return }
      s0 = c.state
      id = c.id
    }
    const u = updateMethodMeta(s0, id, meta)
    if (!u.ok) { onSaved({ variant: "warning", title: u.error }, null); return }
    let s1 = u.state
    let reach = ""
    let missed = ""
    if (ruleChanged) {
      const r = saveMethod(s1, id, withCarried(rule), { at: now(), byId: ADMIN_ID })
      if (!r.ok) { onSaved({ variant: "warning", title: r.error }, null); return }
      s1 = r.state
      reach = r.written ? ` ${countSkills(r.written)} updated.` : ""
      missed = r.failed.length ? ` Not saved for ${r.failed.join(", ")}.` : ""
    }
    store.update(() => s1)
    onSaved({ variant: missed ? "warning" : "success", title: `${method ? "Saved" : "Created"} ${meta.name.trim()}.${reach}${missed}` }, id)
  }
  const model = useModel({
    method, rule, setRule, issues, ruleChanged, saved: method ? base : null, showErrors, setShowErrors, expanded, setExpanded, go, onDirty,
    resetRule: () => setRuleState(base),
    onSave: (meta) => {
      const err = nameIssue(state, meta.name, method?.id)
      if (err) return err
      if (ruleChanged && issues.length) { setShowErrors(true); go(issues[0]!); return "" }
      if (method && ruleChanged && method.skillIds.length) { setConfirm(meta); return null }
      write(meta)
      return null
    },
  })
  const n = method?.skillIds.length ?? 0
  return (
    <>
      {children(model)}
      <AlertDialog open={!!confirm} onOpenChange={(o) => { if (!o) setConfirm(null) }}>
        <AlertDialogContent data-save-confirm>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmWords === "update" ? `Update ${countSkills(n)}?` : `Save ${confirm?.name.trim() || "this method"} for ${countSkills(n)}?`}</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmWords === "update"
                ? `${impact.length ? `${impact.length} ${impact.length === 1 ? "student's" : "students'"} progress changes.` : "No student's progress changes."} Evaluations already recorded keep their results.`
                : impact.length
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
            <AlertDialogCancel>{confirmWords === "update" ? "Keep editing" : "Cancel"}</AlertDialogCancel>
            <AlertDialogAction onClick={() => { if (confirm) write(confirm) }}>{confirmWords === "update" ? `Update ${countSkills(n)}` : `Save for ${countSkills(n)}`}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

/** One draft of a method. Which store it lives in: the program's own (its method, or the first method of a program) or a local draft. */
export function MethodDraft(p: DraftProps) {
  const state = useV2State()
  const hasProgram = methodsOf(state).some((m) => m.program)
  const programBacked = p.method ? p.method.program : !hasProgram
  return programBacked ? <ProgramDraft {...p} /> : <LocalDraft {...p} />
}

/** The method the URL names, once the store is read: a method, NEW, or null; `missing` when the id leads nowhere. */
export function useOpenMethod(id: string | null) {
  const state = useV2State()
  const hydrated = useV2Hydrated()
  const open = id && hydrated ? (id === NEW ? NEW : methodById(state, id)) : null
  return { open, missing: !!id && hydrated && id !== NEW && !open, hydrated }
}

// ---------------------------------------------------------------------------------------------------------------------
// Fields, one group each

/** An on or off choice that waits for Save: a checkbox and its name (a switch would say it applies at once). */
export function Check({ id, label, checked, onChange, invalid, describedBy }: { id: string; label: string; checked: boolean; onChange: (v: boolean) => void; invalid?: boolean; describedBy?: string }) {
  return (
    <div className="flex min-h-6 items-center gap-2.5">
      <Checkbox id={id} checked={checked} onCheckedChange={(c) => onChange(c === true)} aria-invalid={invalid || undefined} aria-describedby={describedBy} />
      <Label htmlFor={id} className="font-normal">{label}</Label>
    </div>
  )
}

/** "Used by 166 skills". The program's count opens the Library on Default, as a link only while nothing is unsaved. */
export function UsedBy({ method, linked }: { method: EvaluationMethod; linked: boolean }) {
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

const QUIET_LINK = "h-auto p-0 font-normal"

/** The facts under a method's title: its type, who uses it, and the quiet way to change the type. `end` holds what a layout adds (Preview, a menu). */
export function TypeLine({ m, changing, onToggle, end, labelled }: { m: MethodModel; changing: boolean; onToggle: () => void; end?: React.ReactNode; /** Among the fields (H): it reads as the field "Type", under that label. */ labelled?: boolean }) {
  const { method, rule } = m
  if (!m.settled || !method || !rule.model) return end ? <div className="flex justify-end">{end}</div> : null
  if (labelled) {
    return (
      <div className="flex min-w-0 flex-col gap-2" role="group" aria-labelledby="method-type-label">
        <p id="method-type-label" className={TYPE.label}>Type</p>
        <TypeLine m={m} changing={changing} onToggle={onToggle} end={end} />
      </div>
    )
  }
  return (
    <div className={cn(TYPE.helper, "flex flex-wrap items-center gap-x-2 gap-y-1 max-sm:gap-x-4")} data-type-line>
      <span className="text-foreground" data-type-name>{LAB_MODEL_LABEL[rule.model]}</span>
      {m.typeChanged ? <ChangedMark /> : null}
      <span className="max-sm:hidden" aria-hidden="true">·</span>
      <UsedBy method={method} linked={!m.dirty} />
      <span className="max-sm:hidden" aria-hidden="true">·</span>
      <Button type="button" variant="link" size="sm" className={QUIET_LINK} aria-expanded={changing} aria-controls="cfg-type-tiles" onClick={onToggle} data-change-type>
        {changing ? "Hide types" : "Change type"}
      </Button>
      {end ? <span className="ms-auto flex items-center gap-1">{end}</span> : null}
    </div>
  )
}

/** The four types, one line each, nothing preselected [REQ 4.1, SC-02]. A switch that would remove levels or questions asks first [REQ SC-09]. */
export function TypeTiles({ m, className }: { m: MethodModel; className?: string }) {
  return (
    <div id="cfg-type-tiles" className={cn("@container min-w-0", className)} data-type-tiles>
      <ModelSection {...m.props} examples={TYPE_LINE} legend="Type" legendHidden={m.settled} row />
    </div>
  )
}

/** What switching to `next` would throw away, in the admin's words (empty when nothing would be lost) [REQ SC-09]. The same list as the tiles' question. */
function lostFor(rule: LabRule, next: EvalModel): string[] {
  const lost: string[] = []
  const q = rule.questions.filter((x) => x.trim()).length
  const l = rule.levels.filter((x) => x.trim()).length
  if (q > 0 && next !== "question" && next !== "scored") lost.push(`${q} ${q === 1 ? "question" : "questions"}`)
  if (l > 0 && next !== "demonstration") lost.push(`${l} ${l === 1 ? "level" : "levels"}`)
  if (rule.levelMinimums.length > 0) lost.push(`${rule.levelMinimums.length} level ${rule.levelMinimums.length === 1 ? "minimum" : "minimums"}`)
  if (rule.questionRule || rule.scoredRule) lost.push("the rule for when it counts")
  return lost
}

/**
 * Q (Romit 2026-11-17): the type as a DS Select, each option with its icon. Its value is only ever the template the admin picked or the saved
 * type; with neither it waits on "Choose a type" [REQ SC-02]. A change that would remove levels or questions asks first [REQ SC-09].
 */
export function TypeSelect({ m, prefill }: { m: MethodModel; /** Q (Romit 2026-11-17): a method not saved yet takes the chosen type's starting values (the old template's), keeping who can evaluate, what each evaluation needs and group check-off. Off by default. */ prefill?: (t: EvalModel) => LabRule | null }) {
  const { rule, setRule } = m
  const [pending, setPending] = React.useState<EvalModel | null>(null)
  const err = m.err("cfg-model")
  const apply = (next: EvalModel) => setRule((r) => {
    const start = !m.settled && prefill ? prefill(next) : null
    if (!start) return withModel(r, next)
    return { ...start, evaluatorRoles: r.evaluatorRoles, selfEvaluation: r.selfEvaluation, feedbackRequired: r.feedbackRequired, approvalRequired: r.approvalRequired, checkOff: r.checkOff, studentFields: r.studentFields }
  })
  const onValue = (v: string) => {
    const next = v as EvalModel
    if (rule.model && rule.model !== next && lostFor(rule, next).length) setPending(next)
    else apply(next)
  }
  const lost = pending ? lostFor(rule, pending) : []
  const lostText = lost.length > 1 ? `${lost.slice(0, -1).join(", ")} and ${lost[lost.length - 1]}` : (lost[0] ?? "")
  return (
    <Field data-invalid={err ? true : undefined} data-type-select>
      <FieldLabel htmlFor="cfg-model" className="flex items-center gap-2">
        Type
        {m.typeChanged ? <ChangedMark /> : null}
      </FieldLabel>
      <Select value={rule.model ?? ""} onValueChange={onValue}>
        <SelectTrigger id="cfg-model" className="w-full" aria-invalid={err ? true : undefined} aria-describedby={err ? "cfg-model-error" : undefined}>
          <SelectValue placeholder="Choose a type" />
        </SelectTrigger>
        <SelectContent position="popper" align="start">
          {PLAIN_TYPE_ORDER.map((t) => (
            <SelectItem key={t} value={t} data-type-option={t}>
              <i className={cn("fa-light w-4 shrink-0 text-center", TYPE_ICON[t], rule.model === t ? "text-[var(--brand-color)]" : "text-muted-foreground")} aria-hidden="true" />
              {LAB_MODEL_LABEL[t]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {err ? <FieldError id="cfg-model-error">{err}</FieldError> : null}
      <AlertDialog open={pending !== null} onOpenChange={(o) => { if (!o) setPending(null) }}>
        <AlertDialogContent onCloseAutoFocus={(e) => { e.preventDefault(); document.getElementById("cfg-model")?.focus({ preventScroll: true }) }} data-type-confirm>
          <AlertDialogHeader>
            <AlertDialogTitle>{pending ? `Switch to ${LAB_MODEL_LABEL[pending].toLowerCase()}?` : "Switch type?"}</AlertDialogTitle>
            <AlertDialogDescription>{`Your ${lostText} will be removed, because ${pending ? LAB_MODEL_LABEL[pending].toLowerCase() : "the new type"} is judged differently. Evidence is kept and read under the new rule.`}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel variant="outline" size="default" autoFocus onClick={holdSecondPress}>{`Keep ${rule.model ? LAB_MODEL_LABEL[rule.model].toLowerCase() : "the type"}`}</AlertDialogCancel>
            <AlertDialogAction variant="default" size="default" onClick={(e) => { holdSecondPress(e); if (pending) apply(pending); setPending(null) }}>Switch</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Field>
  )
}
const PLAIN_TYPE_ORDER: EvalModel[] = ["binary", "demonstration", "question", "scored"]

/**
 * Q's Preview tab (Romit 2026-11-17: "it's unclear to see the difference between evaluator and student"): one person's screen at a time,
 * switched by a segmented control, each in one frame whose slim header names who sees it [REQ SC-19]. Student first, because the student
 * always acts first (asks for sign-off, rating themselves first when self-evaluation is on); Evaluator is open by default, since it is the
 * form the method shapes. The forms are the Preview dialog's (inert pictures, with their text for a screen reader). The evaluator form's
 * "Told after submit" line is a note about the screen, not part of it, so it is hidden here.
 */
type PreviewWho = "student" | "evaluator"
const ROLE_ICON: Record<(typeof ROLES)[number], string> = { preceptor: "fa-user-doctor", faculty: "fa-chalkboard-user", "lab-instructor": "fa-flask" }

function PreviewFrame({ icon, who, children }: { icon: string; who: string; children: React.ReactNode }) {
  return (
    <section className="min-w-0 overflow-hidden rounded-[var(--radius)] border border-border bg-background [&_[data-artifact-preview]]:rounded-none [&_[data-artifact-preview]]:border-0 [&_[data-preview-approval]]:hidden" aria-label={`${who} view`} data-preview-frame={who}>
      <p className={cn(TYPE.label, "flex items-center gap-2 border-b border-border bg-muted px-4 py-2")}>
        <i className={`fa-light ${icon} w-4 text-center text-muted-foreground`} aria-hidden="true" />
        {who}
      </p>
      {children}
    </section>
  )
}

export function MethodPreview({ draft }: { draft: LabRule }) {
  const state = useV2State()
  const [pick, setPick] = React.useState<string | null>(null)
  const [who, setWho] = React.useState<PreviewWho>("evaluator")
  const examples = React.useMemo<Example[]>(() => {
    const skills = new Map(state.skills.map((k) => [k.id, k]))
    return buildLibrary(state).filter((r) => r.status !== "inactive" && skills.has(r.id) && !skills.get(r.id)!.edited).map((r) => ({ id: r.id, name: r.name, rule: skillRuleOf(skills.get(r.id)!) }))
  }, [state])
  const example = examples.find((x) => x.id === pick) ?? examples[0] ?? null
  const shown = React.useMemo<Example>(() => example ?? { id: "sample", name: capitalize(aNoun()), rule: null }, [example])
  const rule = React.useMemo(() => (draft.model ? resolveRule(draft, shown.rule) : draft), [draft, shown])
  if (!draft.model) return <p className={TYPE.helper} data-preview-empty>{"Choose a type to see the evaluator's form."}</p>
  const role = ROLES.find((r) => rule.evaluatorRoles.includes(r))
  const evaluator = role ? ROLE_LABEL[role] : "Evaluator"
  return (
    <div className="flex min-w-0 flex-col gap-4" data-method-preview>
      <div className="flex min-w-0 flex-wrap items-center justify-between gap-3">
        <ViewSegmentedControl<PreviewWho>
          value={who}
          onValueChange={setWho}
          aria-label="Whose screen"
          options={[{ value: "student", label: "Student" }, { value: "evaluator", label: "Evaluator" }]}
        />
        {example ? <ExamplePicker options={examples} value={example} onChange={setPick} /> : null}
      </div>
      {who === "evaluator" ? (
        <PreviewFrame icon={role ? ROLE_ICON[role] : "fa-user-check"} who={evaluator}>
          <p className="sr-only">{evaluatorScreenText(rule, rule.evaluatorRoles, shown.name)}</p>
          <EvaluatorScreen rule={rule} example={shown} program={`${state.program.school} ${state.program.name}`} />
        </PreviewFrame>
      ) : (
        <PreviewFrame icon="fa-user-graduate" who="Student">
          <p className="sr-only">{studentScreenText(rule, shown.name)}</p>
          <StudentScreen rule={rule} example={shown} />
        </PreviewFrame>
      )}
    </div>
  )
}

export function NameFields({ m, descriptionArea }: { m: MethodModel; /** Q: the description is an always-visible textarea, not behind "Add a description". Off by default. */ descriptionArea?: boolean }) {
  const { meta, setMeta, nameError } = m
  const [describing, setDescribing] = React.useState(!!meta.description || !!descriptionArea)
  return (
    <div className="flex min-w-0 flex-col gap-4" data-name-fields>
      <Field data-invalid={nameError ? true : undefined}>
        <FieldLabel htmlFor="method-name">Name</FieldLabel>
        <Input id="method-name" value={meta.name} maxLength={80} autoComplete="off" placeholder="For example, Supervised levels" aria-invalid={nameError ? true : undefined} aria-describedby={nameError ? "method-name-error" : undefined} onChange={(e) => { setMeta((x) => ({ ...x, name: e.target.value })); if (nameError) m.clearNameError() }} />
        {nameError ? <FieldError id="method-name-error">{nameError}</FieldError> : null}
        {describing ? null : (
          <div className="flex justify-start">
            <Button type="button" variant="link" size="sm" className={QUIET_LINK} onClick={() => { setDescribing(true); requestAnimationFrame(() => document.getElementById("method-description")?.focus()) }} data-add-description>
              Add a description
            </Button>
          </div>
        )}
      </Field>
      {describing ? (
        <Field>
          <FieldLabel htmlFor="method-description">Description</FieldLabel>
          {descriptionArea
            ? <Textarea id="method-description" value={meta.description} maxLength={160} rows={3} onChange={(e) => setMeta((x) => ({ ...x, description: e.target.value }))} data-description-area />
            : <Input id="method-description" value={meta.description} maxLength={160} autoComplete="off" onChange={(e) => setMeta((x) => ({ ...x, description: e.target.value }))} />}
        </Field>
      ) : null}
    </div>
  )
}

/** What the evaluator picks, in the order one part depends on the next [REQ SC-03 to SC-08, SC-17]. */
export function TypeBody({ m }: { m: MethodModel }) {
  const { rule, setRule, err, saved, issues, showErrors, expanded, setExpanded } = m
  if (!rule.model) return null
  return (
    <div className="flex min-w-0 flex-col gap-6" data-type-body>
      <ReorderHelp />
      {rule.model === "demonstration" ? (
        <LevelsField rule={rule} setRule={setRule} err={err} plain presets={!saved?.model} />
      ) : rule.model === "binary" ? (
        <OutcomesField rule={rule} setRule={setRule} err={err} plain presets={!saved?.model} />
      ) : (
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
  )
}

/** Which roles may evaluate [REQ SC-16]. */
export function RolesField({ m, legendHidden, section }: { m: MethodModel; legendHidden?: boolean; /** Q: the legend is a section heading (one step above a field label) with its one icon. Off by default. */ section?: boolean }) {
  const { rule, setRule } = m
  const roleErr = m.err("cfg-role-preceptor")
  return (
    <FieldSet className="gap-0" data-roles>
      <FieldLegend variant="label" className={legendHidden ? "sr-only" : section ? "mb-3" : "mb-2"}>{section ? <SectionHeading icon={SECTION_ICON.roles}>{ROLES_LABEL}</SectionHeading> : ROLES_LABEL}</FieldLegend>
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
      {roleErr ? <FieldError id="cfg-roles-error" className="mt-2">Choose who can evaluate.</FieldError> : null}
    </FieldSet>
  )
}

/** Self-evaluation, feedback, approval [REQ SC-14, SC-15]. */
export function NeedsField({ m, legendHidden, section }: { m: MethodModel; legendHidden?: boolean; /** Q: the legend is a section heading with its one icon. Off by default. */ section?: boolean }) {
  const { rule, setRule } = m
  return (
    <FieldSet className="gap-0" data-needs>
      <FieldLegend variant="label" className={legendHidden ? "sr-only" : section ? "mb-3" : "mb-2"}>{section ? <SectionHeading icon={SECTION_ICON.needs}>{NEEDS_LABEL}</SectionHeading> : NEEDS_LABEL}</FieldLegend>
      <div className="flex flex-col gap-1.5">
        {NEEDS.map((n) => <Check key={n.id} id={n.id} label={n.label} checked={rule[n.key]} onChange={(v) => setRule((r) => ({ ...r, [n.key]: v }))} />)}
      </div>
    </FieldSet>
  )
}

/** What a group check-off counts as when the type has no level or score to choose: said, not asked. */
export function checkOffCountsAs(rule: LabRule): string {
  if (rule.model === "binary") return rule.qualifyingLabel !== null && rule.outcomeLabels[rule.qualifyingLabel].trim() ? inSentence(rule.outcomeLabels[rule.qualifyingLabel].trim()) : "the outcome that moves a student forward"
  if (rule.model === "question") return "every question answered Yes"
  return "the level that moves a student forward"
}

export function CheckOffField({ m, section }: { m: MethodModel; /** Q: a "Group check-off" section heading with its one icon. Off by default. */ section?: boolean }) {
  const { rule, setRule } = m
  const on = !!rule.model && ruleAllowsCheckOff(rule)
  const grant = rule.model ? checkOffGrantSelect(rule, setRule) : null
  return (
    <div className={cn("flex min-w-0 flex-col", section ? "gap-3" : "gap-2")} data-section="checkoff" role={section ? "group" : undefined} aria-labelledby={section ? "cfg-checkoff-heading" : undefined}>
      {section ? <SectionHeading icon={SECTION_ICON.checkOff} id="cfg-checkoff-heading">{CHECKOFF_HEADING}</SectionHeading> : null}
      <Check id="cfg-checkoff" label={CHECKOFF_SWITCH_LABEL} checked={on} onChange={(v) => setRule((r) => withCheckOffPatch(r, { enabled: v }))} />
      {on && section ? (
        // Q (Romit 2026-11-17, "remove the extra text below dropdown"): the dependent control on one row, nested to the checkbox's label text,
        // its label quieter than the checkbox's; no helper line. The amber note stays: it is a consequence the admin must see, not a hint.
        grant ? (
          <div className="flex min-w-0 flex-col gap-2 ps-6.5" data-checkoff-grant>
            <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-2">
              <Label htmlFor={grant.id} className="shrink-0 font-normal text-muted-foreground">{CHECKOFF_GRANT_LABEL}</Label>
              <div className="flex min-w-0 max-w-full">{grant.control}</div>
            </div>
            {checkOffBelowCut(rule) ? (
              <p id={`${grant.id}-below`} className={cn(TYPE.helper, "flex items-center gap-1.5 text-[var(--status-badge-warning-fg)]")} data-checkoff-below>
                <i className="fa-light fa-triangle-exclamation text-xs" aria-hidden="true" />
                {`An evaluation at this level does not move a student toward achieving the ${skillNoun()}, so a group check-off will not add to the times needed.`}
              </p>
            ) : null}
          </div>
        ) : null
      ) : on ? (
        <div className="flex min-w-0 flex-col gap-2 ps-6.5" data-checkoff-grant>
          {grant ? (
            <>
              <Label htmlFor={grant.id} className="font-normal">{CHECKOFF_GRANT_LABEL}</Label>
              <div className="flex min-w-0 max-w-full">{grant.control}</div>
              <CheckOffGrantNote rule={rule} id={grant.id} />
            </>
          ) : (
            <p className={TYPE.helper}>{`${CHECKOFF_GRANT_LABEL} ${checkOffCountsAs(rule)}.`}</p>
          )}
        </div>
      ) : null}
    </div>
  )
}

/**
 * Every field of a method in two columns split by one hairline, no card: left the name and what the evaluator picks, right who can evaluate
 * and what each evaluation needs. One column in a narrow container. Needs a container above it.
 */
export function EditorColumns({ m }: { m: MethodModel }) {
  return (
    <div className="grid min-w-0 gap-y-6 @[46rem]:grid-cols-[minmax(0,1fr)_19rem]" data-editor-columns>
      <div className="flex min-w-0 flex-col gap-6 @[46rem]:pe-8" data-region="method">
        <NameFields m={m} />
        <TypeBody m={m} />
      </div>
      <div className="flex min-w-0 flex-col gap-6 border-border @[46rem]:border-s @[46rem]:ps-8 @max-[46rem]:border-t @max-[46rem]:pt-6" data-region="evaluation">
        <RolesField m={m} />
        <NeedsField m={m} />
        <CheckOffField m={m} />
      </div>
    </div>
  )
}

/** "2 to fix", beside the button that was pressed: it leads to the first problem. */
export function ProblemsLink({ m }: { m: MethodModel }) {
  if (!m.problems) return null
  return (
    <Button type="button" variant="link" size="sm" className="h-auto p-0 text-destructive" onClick={m.toFirstProblem} data-save-bar-problems>
      {`${m.problems} to fix`}
    </Button>
  )
}

/** Cancel from a page or a block: asks first while there is unsaved work, then runs `then`. */
export function useAskDiscard() {
  const [pending, setPending] = React.useState<null | (() => void)>(null)
  return {
    ask: (dirty: boolean, then: () => void) => { if (dirty) setPending(() => then); else then() },
    question: <DiscardChangesDialog open={pending !== null} onKeep={() => setPending(null)} onDiscard={() => { const run = pending; setPending(null); run?.() }} />,
  }
}

// ---------------------------------------------------------------------------------------------------------------------
// Row actions shared by the table (H, J) and the detail (I)

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

export function useMethodActions(setBanner: (b: ResultBannerValue | null) => void, opts: { onDeleted?: (id: string) => void; edit?: boolean; /** Opens a method in place of the plain push (K: asks first while the panel holds unsaved work). */ open?: (id: string) => void; /** Entries a layout adds before Duplicate (M: Change type). */ extra?: (m: EvaluationMethod) => RowMenuEntry[] } = {}) {
  const state = useV2State()
  const store = useV2Store()
  const nav = useMethodNav()
  const [deleting, setDeleting] = React.useState<EvaluationMethod | null>(null)
  const duplicate = (m: EvaluationMethod) => {
    const r = duplicateMethod(state, m.id)
    if (!r.ok) { setBanner({ variant: "warning", title: r.error }); return }
    store.update(() => r.state)
    const copy = methodById(r.state, r.id)
    setBanner({ variant: "success", title: `Created ${copy?.name ?? "a copy"}. No ${skillNoun()} uses it yet.`, action: { label: "Open it", href: nav.href(r.id) } })
  }
  const entries = (m: EvaluationMethod): RowMenuEntry[] => [
    ...(opts.edit === false ? [] : [{ slot: "edit" as const, label: "Edit", icon: "fa-pen", onSelect: () => (opts.open ?? nav.open)(m.id) }]),
    ...(opts.extra?.(m) ?? []),
    ...(m.saved && m.rule.model ? [{ slot: "lifecycle" as const, label: "Duplicate", icon: "fa-copy", onSelect: () => duplicate(m) }] : []),
    { slot: "delete", label: "Delete", icon: "fa-trash", onSelect: () => setDeleting(m), blockedBecause: deleteBlocked(m) ?? undefined },
  ]
  const dialog = (
    <DeleteDialog
      method={deleting}
      onCancel={() => setDeleting(null)}
      onConfirm={() => {
        if (!deleting) return
        const { name, id } = deleting
        const r = deleteMethod(state, id)
        setDeleting(null)
        if (!r.ok) { setBanner({ variant: "warning", title: r.error }); return }
        store.update(() => r.state)
        setBanner({ variant: "success", title: `Deleted ${name}.` })
        opts.onDeleted?.(id)
      }}
    />
  )
  return { entries, dialog }
}

// ---------------------------------------------------------------------------------------------------------------------
// The list H and J open a method from: the columns answer "how does it work" without opening anything.

interface Row extends Record<string, unknown> {
  id: string
  m: EvaluationMethod
  name: string
  type: string
  forward: string
  needs: string
  used: number
}

export function MethodsTable({ setBanner, onOpen, activeId, newId, narrowWhenActive = true }: { setBanner: (b: ResultBannerValue | null) => void; /** Opens a method in place of the plain push (K). */ onOpen?: (id: string) => void; /** The method open beside the table (K): its name is marked. */ activeId?: string | null; /** Q: the method just created leads the table with a "New" badge until the page is left. */ newId?: string | null; /** K narrows the table beside its panel; Q opens its panel over the table and keeps every column. */ narrowWhenActive?: boolean }) {
  const state = useV2State()
  const nav = useMethodNav()
  const isMobile = useIsMobile()
  const to = useLabHref()
  const actions = useMethodActions(setBanner, { open: onOpen })
  const openRow = onOpen ?? nav.open
  const methods = React.useMemo(() => methodsOf(state), [state])
  const ordered = newId ? [...methods.filter((m) => m.id === newId), ...methods.filter((m) => m.id !== newId)] : methods
  const rows: Row[] = ordered.map((m) => ({ id: m.id, m, name: m.name, type: m.rule.model ? LAB_MODEL_LABEL[m.rule.model] : "", forward: passChip(m.rule)?.text ?? "", needs: m.rule.model ? needsLine(m.rule) : "", used: m.skillIds.length }))
  const columns = React.useMemo<ColumnDef<Row>[]>(() => {
    const name: ColumnDef<Row> = {
      key: "name",
      label: "Method",
      width: isMobile ? 220 : 280,
      defaultPin: "left",
      sortable: true,
      cell: (r) => {
        const line = r.m.description?.trim()
        return (
          <span className="flex min-w-0 flex-col gap-0.5 py-1.5">
            <span className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
              <Button asChild variant="link" size="sm" className="h-auto min-w-0 max-w-full justify-start whitespace-normal p-0 text-left text-sm font-normal text-foreground no-underline underline-offset-2 hover:underline">
                <Link href={nav.href(r.id)} scroll={false} onClick={(e) => { e.stopPropagation(); if (onOpen && !(e.metaKey || e.ctrlKey || e.shiftKey)) { e.preventDefault(); onOpen(r.id) } }} aria-current={activeId === r.id ? "true" : undefined} className="aria-[current=true]:underline" data-method-link={r.id}><span className="whitespace-normal break-words">{r.name}</span></Link>
              </Button>
              {r.m.program && r.m.saved ? <StatusBadge label={`New ${skillNounPlural()}`} tone="neutral" size="sm" surface="table" data-new-skills-badge /> : null}
              {newId && r.id === newId ? <StatusBadge label="New" tone="success" size="sm" surface="table" data-new-method-badge /> : null}
            </span>
            {line ? <span className="whitespace-normal text-xs text-muted-foreground" data-method-line>{line}</span> : null}
          </span>
        )
      },
    }
    const type: ColumnDef<Row> = { key: "type", label: "Type", width: 190, sortable: true, cell: (r) => (r.m.rule.model ? <span className="whitespace-normal text-sm">{r.type}</span> : <StatusBadge label="Not set up" tone="warning" icon="fa-circle-exclamation" size="sm" surface="table" />) }
    const forward: ColumnDef<Row> = { key: "forward", label: "Moves forward when", width: 230, cell: (r) => (r.forward ? <span className="whitespace-normal text-sm">{r.forward}</span> : <span className="text-sm text-muted-foreground">Not set</span>) }
    const needs: ColumnDef<Row> = { key: "needs", label: NEEDS_LABEL, width: 220, cell: (r) => (r.needs ? <span className="whitespace-normal text-sm">{r.needs}</span> : <span className="text-sm text-muted-foreground">{r.m.rule.model ? "Nothing more" : "Not set"}</span>) }
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
          <RowMenu label={`Actions for ${r.name}`} entries={actions.entries(r.m)} />
        </div>
      ),
    }
    // Beside an open panel (K) the table keeps the columns that fit whole: the rest is in the panel.
    return isMobile ? [name, used, menu] : narrowWhenActive && activeId !== undefined && activeId !== null ? [name, type, used, menu] : [name, type, forward, needs, used, menu]
  }, [isMobile, nav, to, activeId, onOpen, newId, narrowWhenActive]) // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <div data-region="methods">
      <DataTable<Row>
        key={isMobile ? "phone" : "wide"}
        data={rows}
        columns={columns}
        getRowId={(r) => r.id}
        onRowClick={(r) => openRow(r.id)}
        selectable={false}
        edgeInset={false}
        emptyState={<EmptyBlock compact title="No methods match" body="Clear the search or filter to see every method." />}
      />
      {actions.dialog}
    </div>
  )
}

// ---------------------------------------------------------------------------------------------------------------------
// The page with the Methods and Details tabs

export function LoadingBlock() {
  return <div aria-busy="true"><Skeleton className="h-64 w-full" aria-label="Loading" /></div>
}

/** Zero state: only the way in [CALL 11-16]. */
export function NoMethods({ href }: { href: string }) {
  return (
    <section className="flex flex-col items-start gap-3 rounded-lg border border-dashed border-border p-6" data-methods-empty>
      <p className={TYPE.helper}>No evaluation methods yet.</p>
      <Button asChild variant="default" size="sm"><Link href={href} scroll={false}>New method</Link></Button>
    </section>
  )
}

export function SettingsHome({ banner, setBanner, missing, pageType = "list", guard, footer, quietNew, children }: {
  banner: ResultBannerValue | null
  setBanner: (b: ResultBannerValue | null) => void
  missing?: boolean
  pageType?: "list" | "split"
  /** A layout that holds a draft on this page (I): a tab change asks first. */
  guard?: (then: () => void) => void
  /** A save bar that belongs to the page (I). */
  footer?: React.ReactNode
  /** An editor on this page holds the one filled button (K's panel, L's open row): New method steps down to outline. */
  quietNew?: boolean
  /** The Methods tab. */
  children: React.ReactNode
}) {
  const state = useV2State()
  const hydrated = useV2Hydrated()
  const nav = useMethodNav()
  const [addingDetail, setAddingDetail] = React.useState(false)
  const count = React.useMemo(() => methodsOf(state).length, [state])
  const detailCount = React.useMemo(() => detailsOf(state).length, [state])
  const setTab = (v: string) => {
    const move = () => { setBanner(null); nav.go(nav.href(null, v === "details" ? "details" : "methods")) }
    if (guard) guard(move)
    else move()
  }
  // One filled action per view: Add detail on Details, New method on Methods (a link, so a draft on the page is asked about first).
  const action = nav.tab === "details"
    ? <Button type="button" variant="default" size="sm" onClick={() => setAddingDetail(true)} data-add-detail>Add detail</Button>
    : count && nav.id !== NEW ? <Button asChild variant={quietNew ? "outline" : "default"} size="sm"><Link href={nav.href(NEW)} scroll={false} data-new-method>New method</Link></Button> : undefined
  return (
    <div className="flex min-h-[calc(100dvh-5.5rem)] w-full flex-col" data-page-type={pageType} data-methods-list>
      <PageFrame title={<ReturnTitle plainToLists>{SETTINGS_TITLE}</ReturnTitle>} className="flex-1" actions={action}>
        {missing ? <ResultBanner banner={{ variant: "warning", title: "This method was deleted or the link is out of date." }} onDismiss={nav.close} /> : null}
        {banner ? <ResultBanner banner={banner} onDismiss={() => setBanner(null)} /> : null}
        <Tabs value={nav.tab} onValueChange={setTab} className="flex min-w-0 flex-1 flex-col gap-4">
          <TabsList variant="line" ariaLabel={SETTINGS_TITLE}>
            <TabsTrigger value="methods">Methods{hydrated ? <TabsCountBadge count={count} /> : null}</TabsTrigger>
            <TabsTrigger value="details" data-details-tab>Details{hydrated ? <TabsCountBadge count={detailCount} /> : null}</TabsTrigger>
          </TabsList>
          <TabsContent value="methods" className="mt-0 flex min-w-0 flex-1 flex-col">{hydrated ? children : <LoadingBlock />}</TabsContent>
          <TabsContent value="details" className="mt-0">
            {hydrated ? <DetailsTable adding={addingDetail} setAdding={setAddingDetail} onBanner={setBanner} /> : <LoadingBlock />}
          </TabsContent>
        </Tabs>
        {footer}
      </PageFrame>
    </div>
  )
}
