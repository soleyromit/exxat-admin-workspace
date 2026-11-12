"use client"

/**
 * Program evaluation settings (Proposed 2026-11-02, contract V2-06; lib/lab/program-settings.ts). The settings page reuses the
 * Configure sections unchanged: How it's judged, the criteria with "Which levels count toward achievement?" (D-L27), "When does it
 * count?" with the sentence that names the counting level (D-L28), and "Who signs, and what does the student add?" grouped by
 * subject (D-L26). The conditions (setting and level minimums) stay with each skill.
 *
 * Saving asks first, with the counts: how many skills take the settings, how many become usable, how many already match, how many
 * are Edited (kept) and how many cannot take them yet and why [REQ IM-13, SC-18].
 */
import * as React from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import { Card, CardContent } from "@exxatdesignux/ui/components/ui/card"
import { Separator } from "@exxatdesignux/ui/components/ui/separator"
import { Label } from "@exxatdesignux/ui/components/ui/label"
import { Input } from "@exxatdesignux/ui/components/ui/input"
import { ResultBanner } from "@/components/lab/shared/result-banner"
import { StatusBadge } from "@exxatdesignux/ui"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@exxatdesignux/ui/components/ui/dialog"
import { DataTable } from "@exxatdesignux/ui/components/data-table"
import { useTableState } from "@exxatdesignux/ui/components/data-table/use-table-state"
import type { ColumnDef } from "@exxatdesignux/ui/components/data-table/types"
import { Tabs, TabsContent, TabsCountBadge, TabsList, TabsTrigger } from "@exxatdesignux/ui/components/ui/tabs"
import { cn } from "@exxatdesignux/ui/lib/utils"
import { useV2Hydrated, useV2State, useV2Store } from "@/lib/v2/react"
import { DEMO_TODAY, IDS } from "@/lib/v2/seed-core"
import { buildLibrary, CONFIGURATION_META, CONFIGURATION_ORDER } from "@/lib/lab/library"
import { useDsTableToolbar } from "@/components/lab/shared/ds-table-toolbar"
import { CHECKOFF_LABEL, CRITERIA_LABEL, HOW_MANY_LABEL, WHO_DOES_WHAT_LABEL, MODEL_STEP_LABEL, configureStepHead, configureStepValue, LAB_MODEL_LABEL, ROLE_LABEL, ruleAllowsCheckOff, type LabRule, type RuleIssue, type SectionId } from "@/lib/lab/configure"
import {
  notConfiguredIds,
  planProgramApply,
  programIssues,
  programSaveEffects,
  programSettingsOf,
  programImpact,
  programStartRule,
  saveProgramSettings,
  setTimesNeeded,
  timesRows,
  type ProgramApplyPlan,
  type ProgramImpact,
  type StudentImpact,
  type TimesRow,
} from "@/lib/lab/program-settings"
import { applySummary, type ChangeFigure, type ChangeValue, type ConfigWord, type HeroPart, type StudentsBlock, type SummaryLine } from "@/lib/lab/apply-summary"
import { STATE_SPEC } from "@/lib/lab/configure"
import { capitalize, inSentence, countSkills, skillNoun, skillNounPlural } from "@/lib/lab/terms"
import { TYPE } from "@/components/lab/type-scale"
import { LINK_IN_TABLE } from "@/components/lab/link-styles"
import { EmptyBlock } from "@/components/lab/empty-block"
import { useLabHref } from "@/components/lab/lab-bar/page-context"
import { NUMBER_WIDTH } from "./number-field"
import { ApprovalToggle, FeedbackToggle, GroupCheckOffSection, ModelSection, OutcomesSection, RuleSection, SelfRatingToggle, SignersField, SignOffSection, StudentFieldsField, type SectionProps } from "./fields"
import { ConfigSection } from "./section"
import { useFocusBack } from "./settings-dialogs"
import { holdSecondPress } from "@/components/lab/shared/focus"

const now = () => `${DEMO_TODAY}T${new Date().toISOString().slice(11, 19)}Z`

export interface ProgramSaved {
  written: number
  newlyConfigured: number
  kept: number
  blocked: number
}

export interface ProgramModel {
  ready: boolean
  loading: boolean
  /** The settings as saved, or null before the first save. */
  saved: LabRule | null
  savedAt: string | null
  rule: LabRule
  setRule: SectionProps["setRule"]
  issues: RuleIssue[]
  showErrors: boolean
  setShowErrors: (v: boolean) => void
  dirty: boolean
  /** Library skills in the shared store, Active and Inactive: both count like any other (map D3) [INFER]. */
  ids: string[]
  notConfigured: string[]
  plan: (only?: readonly string[]) => ProgramApplyPlan
  /** Who the save reaches, before it applies [REQ AE-02]. */
  impactOf: (plan: ProgramApplyPlan) => ProgramImpact
  save: (only?: readonly string[]) => ProgramSaved | null
  result: ProgramSaved | null
  clearResult: () => void
  /** Back to what is saved: Discard on "Discard your changes?". */
  discard: () => void
  /** Skills whose number differs from the program's: the same set as the Library's Different number filter. */
  differentNumber: number
  times: TimesRow[]
  saveTimes: (edits: Record<string, number>) => { written: number; failed: Array<{ id: string; error: string }> }
}

/** What dirty compares: group check-off as it reads, since a saved rule with no choice and a choice of the same thing are the same settings. */
const dirtyKey = (r: LabRule): string => JSON.stringify(r.model ? { ...r, checkOff: { ...r.checkOff, enabled: ruleAllowsCheckOff(r) } } : r)

export function useProgramSettings(): ProgramModel {
  const state = useV2State()
  const store = useV2Store()
  const hydrated = useV2Hydrated()
  const params = useSearchParams()
  const library = React.useMemo(() => buildLibrary(state), [state])
  const ids = React.useMemo(() => library.filter((r) => state.skills.some((k) => k.id === r.id)).map((r) => r.id), [library, state])
  const savedRec = hydrated ? programSettingsOf(state) : null
  const savedKey = JSON.stringify(savedRec?.rule ?? null)
  const [rule, setRuleState] = React.useState<LabRule>(() => programStartRule(state))
  const seeded = React.useRef<string | null>(null)
  React.useEffect(() => {
    if (!hydrated || seeded.current === savedKey) return
    seeded.current = savedKey
    setRuleState(programStartRule(state))
  }, [hydrated, savedKey, state])
  const [result, setResult] = React.useState<ProgramSaved | null>(null)
  // One banner at a time (map E10): the next edit ends what the last save said.
  const setRule = React.useCallback<SectionProps["setRule"]>((next) => { setResult(null); setRuleState((r) => (typeof next === "function" ? next(r) : next)) }, [])
  React.useEffect(() => {
    const onReset = () => setRuleState(programStartRule(state))
    window.addEventListener("lab:reset", onReset)
    return () => window.removeEventListener("lab:reset", onReset)
  }, [state])
  const [showErrors, setShowErrorsState] = React.useState(false)
  const setShowErrors = React.useCallback((v: boolean) => { if (v) setResult(null); setShowErrorsState(v) }, [])
  const issues = React.useMemo(() => programIssues(rule), [rule])
  const dirty = dirtyKey(rule) !== dirtyKey(programStartRule(state))
  const notConfigured = React.useMemo(() => notConfiguredIds(state, ids), [state, ids])
  const plan = React.useCallback((only?: readonly string[]) => planProgramApply(state, rule, { only: only ?? ids }), [state, rule, ids])
  const impactOf = React.useCallback((p: ProgramApplyPlan) => programImpact(state, rule, p), [state, rule])
  const save = React.useCallback(
    (only?: readonly string[]) => {
      let out: ProgramSaved | null = null
      store.update((s) => {
        const r = saveProgramSettings(s, rule, { at: now(), byId: IDS.ross, only: only ?? ids })
        if (!r.ok) return s
        out = { written: r.result.written.length, newlyConfigured: r.result.plan.newlyConfigured, kept: r.result.plan.edited.length, blocked: r.result.plan.blocked.length }
        return r.result.state
      })
      setResult(out)
      if (out) setShowErrorsState(false)
      return out
    },
    [store, rule, ids],
  )
  const times = React.useMemo(() => timesRows(state, library), [state, library])
  const saveTimes = React.useCallback(
    (edits: Record<string, number>) => {
      let written = 0
      const failed: Array<{ id: string; error: string }> = []
      store.update((s) => {
        let next = s
        for (const [id, need] of Object.entries(edits)) {
          const r = setTimesNeeded(next, id, need, { at: now(), byId: IDS.ross })
          if (r.ok) {
            next = r.state
            written += 1
          } else failed.push({ id, error: r.error })
        }
        return next
      })
      return { written, failed }
    },
    [store],
  )
  return {
    ready: hydrated,
    loading: !hydrated || params?.get("state") === "loading",
    saved: savedRec?.rule ?? null,
    savedAt: savedRec?.at ?? null,
    rule,
    setRule,
    issues,
    showErrors,
    setShowErrors,
    dirty,
    ids,
    notConfigured,
    plan,
    save,
    result,
    impactOf,
    clearResult: () => setResult(null),
    discard: () => { setRuleState(programStartRule(state)); setShowErrorsState(false) },
    differentNumber: library.filter((r) => r.timesDiffer).length,
    times,
    saveTimes,
  }
}

/** Section headings for the program, in the order Romit asked for (2026-11-02): judged, levels, how many, who signs. */
export function programHead(id: SectionId, model: LabRule["model"]): string {
  if (id === "model") return `How are ${skillNounPlural()} judged?`
  if (id === "rule") return "How many evaluations?"
  if (id === "signoff") return `${WHO_DOES_WHAT_LABEL}?`
  return configureStepHead(id, model).title
}

export const PROGRAM_SECTIONS: SectionId[] = ["model", "outcomes", "rule", "signoff"]

/** The sections shown: the criteria and the count appear once a way of judging is chosen (they have nothing to ask before). */
export const programSections = (rule: LabRule): SectionId[] => (rule.model ? PROGRAM_SECTIONS : ["model", "signoff"])

/** One program section's fields: the Configure section itself (plain copy), the count without the per-skill conditions. */
export function ProgramSectionBody({ id, props }: { id: SectionId; props: SectionProps }) {
  // Until a model is chosen the criteria and the count have nothing to ask.
  if (!props.rule.model && (id === "outcomes" || id === "rule")) return null
  if (id === "model") return <ModelSection {...props} />
  if (id === "outcomes") return <OutcomesSection {...props} />
  if (id === "rule") return <RuleSection {...props} conditions={false} />
  return <SignOffSection {...props} />
}

/** The four sections on one page, numbered, labels and controls only. */
export function ProgramSections({ m, idPrefix = "prog-sec" }: { m: ProgramModel; idPrefix?: string }) {
  const props: SectionProps = { rule: m.rule, setRule: m.setRule, issues: m.issues, showErrors: m.showErrors, settings: [], legendHidden: true }
  return (
    <>
      {programSections(m.rule).map((id, i) => (
        <ConfigSection key={id} n={i + 1} first={i === 0} id={`${idPrefix}-${id}`} title={programHead(id, m.rule.model)}>
          <ProgramSectionBody id={id} props={props} />
        </ConfigSection>
      ))}
    </>
  )
}

/**
 * The confirmation before settings reach any skill [REQ IM-13, AE-02, SC-18; map D3; D-L146; H1 "figure card", D-L149, replacing C2's (D-L148)
 * hero card; principles check in the ADMIN-D3 amendment 2026-11-12 (H1)]. Every state has a visible action title. Students move: a neutral card
 * with their number at hero size (amber only when students leave a state), one line per direction with record state badges, and "See who",
 * which opens the names A to Z inside the card. Nobody moves and one brief change: the same card with "On -> Off" and "No student's progress
 * changes"; otherwise that line under the title and a Setting / Now / After table. Not changed is one quiet footnote, which also says "No
 * evaluation is deleted." when students move. Each skill sits in one group only (lib/lab/apply-summary.ts, unit tested).
 */
export function ApplyDialog({ m, open, onOpenChange, only, onSaved }: { m: ProgramModel; open: boolean; onOpenChange: (o: boolean) => void; only?: readonly string[]; onSaved?: (r: ProgramSaved | null) => void }) {
  const plan = React.useMemo(() => (open ? m.plan(only) : null), [open, m, only])
  const impact = React.useMemo(() => (plan ? m.impactOf(plan) : null), [plan, m])
  const summary = React.useMemo(
    () => (plan && impact ? applySummary({ saved: m.saved, rule: m.rule, plan, impact, effects: programSaveEffects(m.saved, m.rule) }) : null),
    [plan, impact, m.saved, m.rule],
  )
  const focus = useFocusBack()
  const [names, setNames] = React.useState(false)
  const cancelRef = React.useRef<HTMLButtonElement>(null)
  React.useEffect(() => { if (!open) setNames(false) }, [open])
  if (!plan || !impact || !summary) return null
  const block = summary.students
  const moves = block.kind === "moves" ? block : null
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="flex max-h-[calc(100dvh-1rem)] flex-col sm:max-h-[calc(100dvh-2rem)] sm:max-w-[36rem]"
        data-apply-dialog
        data-apply-view={names ? "names" : "summary"}
        data-apply-change={summary.partition.change}
        data-apply-total={summary.partition.total}
        {...focus}
        onOpenAutoFocus={(e) => {
          // Remember where focus was (for Escape), then start on Cancel: the safe choice in a confirm (D-L147 r1).
          focus.onOpenAutoFocus()
          e.preventDefault()
          cancelRef.current?.focus()
        }}
      >
        {/* One title rule for every state, visible (H1, D-L149): the action. The card's words are the description, so the hidden sentence and
            the card say the same thing; a table case with nobody moving shows the description itself under the title. */}
        <DialogHeader className="pe-8">
          <DialogTitle>{summary.title}</DialogTitle>
          {moves || summary.figure ? (
            <DialogDescription className="sr-only">{summary.description}</DialogDescription>
          ) : (
            <DialogDescription className="flex items-center gap-2" data-apply-students={block.kind === "zero" ? "zero" : undefined}>
              {block.kind === "zero" ? <i className="fa-light fa-circle-check" aria-hidden="true" /> : null}
              {summary.description}
            </DialogDescription>
          )}
        </DialogHeader>
        {summary.empty ? null : (
          <div className="-mx-4 flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-4 pt-1 pb-1 *:shrink-0" data-apply-body>
            {moves ? <ApplyHero block={moves} students={impact.students} names={names} onToggle={() => setNames((v) => !v)} /> : null}
            {summary.figure ? <ApplyFigure figure={summary.figure} line={summary.changes[0]!} zero={block.kind === "zero" ? block.text : null} /> : names ? null : <ApplyTable lines={summary.changes} />}
            <ApplyStays lines={summary.stays} extra={moves ? moves.reason : null} />
          </div>
        )}
        {/* Side by side at every width, so a phone keeps its height for the content (D-L147 r1). */}
        <DialogFooter className="flex-row justify-end max-sm:*:flex-1">
          <Button ref={cancelRef} type="button" variant="outline" size="default" onClick={(e) => { holdSecondPress(e); onOpenChange(false) }}>Cancel</Button>
          <Button
            type="button"
            variant="default"
            size="default"
            onClick={(e) => {
              // The banner pushes the page down under the pointer: the second press of a double click must not land on what moved there.
              holdSecondPress(e)
              const r = m.save(only)
              onSaved?.(r)
              onOpenChange(false)
            }}
          >
            {summary.button}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/** Amber text for a figure whose students lose a state: the DS warning badge foreground, which keeps its contrast on the card in light and dark. */
const LOSS_FG = "text-[var(--status-badge-warning-fg)]"

/** A configuration word as the Library's badge (CONFIGURATION_META), so the dialog and the table read alike. */
function ConfigBadge({ word }: { word: ConfigWord }) {
  const meta = CONFIGURATION_META[word]
  return <StatusBadge label={meta.label} tone={meta.tone} icon={meta.icon} size="sm" />
}

const Arrow = () => <i className="fa-light fa-arrow-right text-xs text-muted-foreground" aria-hidden="true" />

/**
 * One way students move, on one line that wraps only between whole units: the count (two or more directions), each phrase, and the badge pair
 * ("Achieved -> In progress" never breaks at the arrow; "on some skills" drops as one piece at 375).
 */
function HeroPartLine({ part, count }: { part: HeroPart; count: boolean }) {
  const out: React.ReactNode[] = []
  let run: React.ReactNode[] = []
  const flush = () => { if (run.length) out.push(<span key={`r${out.length}`} className="inline-flex shrink-0 items-center gap-2">{run}</span>); run = [] }
  part.segs.forEach((sg, i) => {
    if ("state" in sg) run.push(<StatusBadge key={i} label={STATE_SPEC[sg.state].label} tone={STATE_SPEC[sg.state].tone} icon={STATE_SPEC[sg.state].icon} size="sm" />)
    else if ("arrow" in sg) run.push(<Arrow key={i} />)
    // A short phrase ("on some skills", "move back on some skills") wraps as one unit; a long one wraps normally so it never overflows at 320.
    else { flush(); out.push(<span key={i} className={cn(TYPE.body, sg.text.length <= 24 && "whitespace-nowrap")}>{sg.text}</span>) }
  })
  flush()
  return (
    <span className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
      {count ? <span className={cn(TYPE.label, "whitespace-nowrap tabular-nums")}>{`${part.count.toLocaleString("en-US")} ${part.count === 1 ? "student" : "students"}`}</span> : null}
      {out}
    </span>
  )
}

/**
 * H1 "figure card" (D-L149, replacing C2's amber card): a neutral DS Card. The figure at hero size, amber only when students leave a state; one
 * line per direction (a down arrow, amber, only on a loss: glyph, word and colour); then See who, a link button that opens the names inside the
 * card. No people icon, no reason sentence: "No evaluation is deleted." is the footnote's.
 */
function ApplyHero({ block, students, names, onToggle }: { block: Extract<StudentsBlock, { kind: "moves" }>; students: StudentImpact[]; names: boolean; onToggle: () => void }) {
  const many = block.parts.length > 1
  const glyphs = block.parts.some((p) => p.loss)
  return (
    <Card className="gap-0 py-0" data-apply-students="moves" data-apply-loss={block.loss || undefined}>
      <CardContent className="flex flex-col gap-3 pt-5 pb-4" aria-hidden="true">
        <span className={cn(TYPE.hero, block.loss && LOSS_FG)}>{`${block.total.toLocaleString("en-US")} ${block.total === 1 ? "student" : "students"}`}</span>
        <ul className="flex flex-col gap-2">
          {block.parts.map((p, k) => (
            <li key={k} className="flex items-start gap-2" data-apply-direction={p.loss ? "loss" : "other"}>
              {glyphs ? (
                <span className="flex h-6 w-4 shrink-0 items-center justify-center">
                  {p.loss ? <i className={cn("fa-solid fa-arrow-down text-sm", LOSS_FG)} aria-hidden="true" /> : null}
                </span>
              ) : null}
              <HeroPartLine part={p} count={many} />
            </li>
          ))}
        </ul>
      </CardContent>
      <Separator />
      <CardContent className="flex py-1">
        <Button
          type="button"
          variant="link"
          size="sm"
          className="min-h-6 px-0 text-sm font-medium text-foreground underline underline-offset-4 max-sm:min-h-11"
          aria-expanded={names}
          aria-controls="apply-names"
          data-apply-see-who
          onClick={onToggle}
        >
          {names ? block.back : block.show}
        </Button>
      </CardContent>
      {names ? <CardContent className="pt-1 pb-4"><ApplyNames students={students} /></CardContent> : null}
    </Card>
  )
}

/** Nobody moves and one brief change: the same card, the change at hero size ("On -> Off"), the setting's name, then the students' line. */
function ApplyFigure({ figure, line, zero }: { figure: ChangeFigure; line: SummaryLine; zero: string | null }) {
  return (
    <Card className="gap-0 py-0" data-apply-figure>
      <CardContent className="flex flex-col gap-2 pt-5 pb-4" data-apply-line={line.key} data-apply-part={line.part}>
        <span className="flex flex-wrap items-center gap-3" aria-hidden="true">
          <span className={cn(TYPE.hero, "text-muted-foreground")}>{figure.before}</span>
          <i className="fa-light fa-arrow-right text-xl text-muted-foreground" aria-hidden="true" />
          <span className={TYPE.hero}>{figure.after}</span>
        </span>
        <span className={TYPE.helper} aria-hidden="true">{line.row?.name ?? ""}</span>
        {figure.note ? <span className={TYPE.meta} aria-hidden="true">{figure.note}</span> : null}
        <span className="sr-only">{`${line.text}.`}</span>
      </CardContent>
      {zero ? (
        <>
          <Separator />
          <CardContent className="flex items-center gap-2 py-3" data-apply-students="zero">
            <i className="fa-light fa-circle-check text-muted-foreground" aria-hidden="true" />
            <span className={TYPE.body}>{zero}</span>
          </CardContent>
        </>
      ) : null}
    </Card>
  )
}

const TABLE_COLS = "sm:grid-cols-[minmax(0,1.3fr)_minmax(0,0.7fr)_minmax(0,1.2fr)] sm:gap-x-4"

/** A value in the table: the Library's badge for a configuration word, else plain words (the after value stronger). */
function TableValue({ value, after }: { value?: ChangeValue; after?: boolean }) {
  if (!value) return <span className={TYPE.helper}>{"–"}</span>
  if (value.config) return <ConfigBadge word={value.config} />
  return <span className={after ? TYPE.label : TYPE.helper}>{value.text}</span>
}

/** What changes: Setting, Now, After, one row per setting. Under 640px each row stacks: the name, then "before -> after". Rows that take a skill
 * out of use come first on a phone (Romit, 2026-11-11). Each row's sentence is its accessible text. */
function ApplyTable({ lines }: { lines: SummaryLine[] }) {
  if (!lines.length) return null
  return (
    <section aria-label="What changes" data-apply-group="apply-changes" className="flex flex-col">
      <div className={cn("hidden border-b border-border pb-2 sm:grid", TABLE_COLS)} aria-hidden="true">
        <span className={TYPE.meta}>Setting</span>
        <span className={TYPE.meta}>Now</span>
        <span className={TYPE.meta}>After</span>
      </div>
      <ul className="flex flex-col">
        {lines.map((l) => {
          const r = l.row
          return (
            <li
              key={l.key}
              className={cn("grid grid-cols-[auto_minmax(0,1fr)] items-baseline gap-x-2 gap-y-1 py-2", TABLE_COLS, l.attention && "max-sm:order-first")}
              data-apply-line={l.key}
              data-apply-part={l.part}
              data-attention={l.attention || undefined}
            >
              {r ? (
                <>
                  <span className="col-span-2 flex min-w-0 flex-col sm:col-span-1" aria-hidden="true">
                    <span className={TYPE.body}>{r.name}</span>
                    {r.note ? <span className={TYPE.meta}>{r.note}</span> : null}
                  </span>
                  <span className="inline-flex items-center gap-2" aria-hidden="true"><TableValue value={r.before} /><span className="sm:hidden"><Arrow /></span></span>
                  <span className="min-w-0" aria-hidden="true"><TableValue value={r.after} after /></span>
                  <span className="sr-only">{`${l.text}.`}</span>
                </>
              ) : (
                <span className={cn(TYPE.body, "col-span-full")}>{l.text}</span>
              )}
            </li>
          )
        })}
      </ul>
    </section>
  )
}

/** Not changed: one quiet footnote, a sentence per group; when students move, it ends with "No evaluation is deleted." (said once, D-L149). */
function ApplyStays({ lines, extra }: { lines: SummaryLine[]; extra: string | null }) {
  if (!lines.length && !extra) return null
  return (
    <p className={TYPE.meta} data-apply-group="apply-stays">
      {lines.map((l, i) => (
        <span key={l.key} data-apply-line={l.key} data-apply-part={l.part}>{`${i ? " " : ""}${l.text}.`}</span>
      ))}
      {extra ? <span data-apply-kept>{`${lines.length ? " " : ""}${extra}`}</span> : null}
    </p>
  )
}

/** Above this many names the list gets a search field. */
const SEARCH_FROM = 20

/** The names: A to Z, each with the number of skills that change for them; a search field above 20 names. */
function ApplyNames({ students }: { students: StudentImpact[] }) {
  const [q, setQ] = React.useState("")
  const term = q.trim().toLowerCase()
  const shown = term ? students.filter((x) => x.name.toLowerCase().includes(term)) : students
  return (
    <div id="apply-names" className="flex flex-col gap-2" data-apply-names>
      {students.length > SEARCH_FROM ? (
        <Input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={`Search ${students.length.toLocaleString("en-US")} students`} aria-label="Search students" className="bg-background" />
      ) : null}
      {shown.length ? (
        <ul tabIndex={0} aria-label="Students whose progress changes, A to Z" className="max-h-[min(14rem,calc(100dvh-24rem))] overflow-y-auto text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset">
          {shown.map((x) => (
            <li key={x.id} className="flex items-baseline justify-between gap-3 border-b border-border py-2 last:border-b-0">
              <span className={cn(TYPE.body, "min-w-0 truncate")}>{x.name}</span>
              <span className="shrink-0 text-sm tabular-nums text-muted-foreground">{countSkills(x.skills)}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className={TYPE.body} role="status">{`No students match "${q.trim()}".`}</p>
      )}
    </div>
  )
}

/** What the save did, once, with the next job (map D3). New skills inherit at once (D0 rule 3), so there is nothing to apply to them. */
export function ProgramBanners({ m }: { m: ProgramModel; onApplyNew?: () => void }) {
  const libraryHref = useLabHref()("admin/skills-library")
  if (m.result) {
    const said = m.result.written ? `Saved for ${countSkills(m.result.written)}.` : m.result.blocked ? "Saved." : "Settings saved."
    const gone = m.result.blocked ? ` ${countSkills(m.result.blocked)} now not configured.` : ""
    return <ResultBanner banner={{ variant: "success", title: `${said}${gone}`, action: { label: "Open the library", href: libraryHref } }} onDismiss={m.clearResult} />
  }
  return null
}

// ---------------------------------------------------------------------------------------------------------------------
// The page in five groups, in the order an admin decides (Romit 2026-11-02: "Evaluation settings design is confusing"):
// Judging, Completion, People, Review, Group check-off. Each group is labels and controls only (D-L34).

export type ProgramGroupId = "judged" | "achieved" | "howmany" | "signs"

/** The four sections, the same names and order as the per-skill page (one hierarchy, one vocabulary; 2026-11-02 audit fix). */
export const PROGRAM_GROUPS: Array<{ id: ProgramGroupId; label: string }> = [
  { id: "judged", label: MODEL_STEP_LABEL },
  { id: "achieved", label: CRITERIA_LABEL },
  { id: "howmany", label: HOW_MANY_LABEL },
  { id: "signs", label: WHO_DOES_WHAT_LABEL },
]

/** The section a validation issue belongs to, so a page can open or scroll to it. */
export function groupOfIssue(i: RuleIssue): ProgramGroupId {
  if (i.section === "model") return "judged"
  if (i.section === "outcomes") return "achieved"
  if (i.section === "rule") return "howmany"
  return "signs"
}

/**
 * One section's fields. What counts as achieved: the levels (or outcomes, questions) and which count. How many evaluations: the
 * program's number, the skills whose number differs. Who does what: student fields, self-rating, signers, feedback, group
 * check-off, approval.
 */
export function ProgramGroupBody({ id, m, edits, setEdits }: { id: ProgramGroupId; m: ProgramModel; edits: TimesEdits; setEdits: React.Dispatch<React.SetStateAction<TimesEdits>> }) {
  const props: SectionProps = { rule: m.rule, setRule: m.setRule, issues: m.issues, showErrors: m.showErrors, settings: [], legendHidden: true }
  const chooseFirst = <p className={TYPE.helper}>{`Choose how ${skillNounPlural()} are judged first.`}</p>
  if (id === "judged") return <ModelSection {...props} />
  if (id === "achieved") return m.rule.model ? <OutcomesSection {...props} /> : chooseFirst
  if (id === "howmany") {
    // Said once, in the section above (density: no repeated line).
    if (!m.rule.model) return null
    return (
      <div className="flex flex-col gap-6">
        <RuleSection {...props} conditions={false} />
        <TimesNeededTable m={m} edits={edits} setEdits={setEdits} programNeed={Number.isFinite(m.rule.need) ? m.rule.need : null} />
      </div>
    )
  }
  return (
    <div className="flex flex-col gap-6">
      <StudentFieldsField {...props} />
      <SelfRatingToggle rule={m.rule} setRule={m.setRule} />
      <SignersField {...props} />
      <FeedbackToggle rule={m.rule} setRule={m.setRule} />
      {m.rule.model ? <GroupCheckOffSection rule={m.rule} setRule={m.setRule} /> : null}
      <ApprovalToggle rule={m.rule} setRule={m.setRule} />
    </div>
  )
}

/** Skills whose times needed is not the program's number (counting this session's edits). */
export function exceptionCount(m: ProgramModel, edits: TimesEdits): number {
  const need = Number.isFinite(m.rule.need) ? m.rule.need : null
  // A skill with no number of its own follows the program (the library column reads it the same way; `timesCellOf`).
  return m.times.filter((r) => {
    const v = edits[r.id] !== undefined ? edits[r.id] : r.need
    return need !== null && v !== null && (v !== need || (r.own && edits[r.id] === undefined))
  }).length
}

/** The resulting settings as label and value pairs (values only, no sentences): the live summary of variant B. */
export function programSummaryRows(m: ProgramModel, edits: TimesEdits): Array<{ group: ProgramGroupId; label: string; value: string }> {
  const r = m.rule
  const none = "Not set"
  const on = (b: boolean) => (b ? "On" : "Off")
  const allowed = r.model ? ruleAllowsCheckOff(r) : false
  const level = r.model === "demonstration" && r.levels.length ? r.levels[r.checkOff?.levelIndex ?? r.levels.length - 1] ?? r.levels[r.levels.length - 1] : null
  const ex = exceptionCount(m, edits)
  return [
    { group: "judged", label: "Judged by", value: r.model ? LAB_MODEL_LABEL[r.model] : none },
    { group: "achieved", label: "Counts", value: configureStepValue("outcomes", r) ?? none },
    { group: "howmany", label: "Evaluations needed", value: Number.isFinite(r.need) && r.need >= 1 ? String(r.need) : none },
    { group: "howmany", label: "Different number", value: ex ? countSkills(ex) : "None" },
    { group: "signs", label: "Student adds", value: r.studentFields.map((f) => f.label.trim()).filter(Boolean).join(", ") || "Nothing" },
    { group: "signs", label: "Self-rating", value: on(r.selfEvaluation) },
    { group: "signs", label: "Signs", value: r.evaluatorRoles.map((x) => ROLE_LABEL[x]).join(", ") || none },
    { group: "signs", label: "Feedback", value: r.feedbackRequired ? "Required" : "Optional" },
    { group: "signs", label: CHECKOFF_LABEL, value: !r.model ? none : allowed ? (level ? `On, marks ${inSentence(level)}` : "On") : "Off" },
    { group: "signs", label: "Approval", value: on(r.approvalRequired) },
  ]
}

// ---------------------------------------------------------------------------------------------------------------------
// Times needed per skill: the one number a skill keeps [CALL 11-02], as an optional table on the settings page

export type TimesEdits = Record<string, number>

type TimesTableRow = TimesRow & { group: string } & Record<string, unknown>

export const timesInvalid = (edits: TimesEdits): boolean => Object.values(edits).some((v) => !Number.isInteger(v) || v < 1)

/**
 * Every active skill with its times needed, grouped by category, editable in place. Controlled: the page's own Save writes the
 * edits. "Custom" opens that skill's full page (map D1c).
 */
export function TimesNeededTable({ m, edits, setEdits, programNeed }: { m: ProgramModel; edits: TimesEdits; setEdits: React.Dispatch<React.SetStateAction<TimesEdits>>; programNeed?: number | null }) {
  const to = useLabHref()
  const [q, setQ] = React.useState("")
  // With the program's number known, the skills whose number differs come first as their own list (not a buried toggle).
  const filterable = programNeed !== undefined && programNeed !== null
  const differs = (r: TimesRow) => {
    const v = edits[r.id] !== undefined ? edits[r.id] : r.need
    return v !== null && (v !== programNeed || (r.own && edits[r.id] === undefined))
  }
  const diffCount = filterable ? m.times.filter(differs).length : 0
  const [show, setShow] = React.useState<"different" | "all">("different")
  const view = filterable && show === "different" ? "different" : "all"
  const pool = view === "different" ? m.times.filter(differs) : m.times
  const shown = q.trim() ? pool.filter((r) => `${r.name} ${r.category}`.toLowerCase().includes(q.trim().toLowerCase())) : pool
  const data = React.useMemo<TimesTableRow[]>(() => shown.map((r) => ({ ...r, group: r.category || "No category" })), [shown])
  const valueOf = (r: TimesRow): string => {
    const e = edits[r.id]
    if (e !== undefined) return Number.isFinite(e) ? String(e) : ""
    return r.need === null ? "" : String(r.need)
  }
  const columns: ColumnDef<TimesTableRow>[] = [
    { key: "name", label: capitalize(skillNoun()), width: 420, cell: (r) => <Label htmlFor={`times-${r.id}`} className="whitespace-normal font-normal" data-times-row={r.id}>{r.name}</Label> },
    {
      key: "need",
      label: "Times needed",
      width: 160,
      filter: { type: "range", icon: "fa-hashtag", dataBounds: true, rangeStep: 1 },
      cell: (r) => {
        const v = edits[r.id]
        const bad = v !== undefined && (!Number.isInteger(v) || v < 1)
        return (
          <Input
            id={`times-${r.id}`}
            type="number"
            inputMode="numeric"
            min={1}
            className={NUMBER_WIDTH}
            placeholder="Not set"
            aria-invalid={bad || undefined}
            value={valueOf(r)}
            onChange={(e) => {
              const raw = e.target.value
              const n = raw === "" ? Number.NaN : Number(raw)
              setEdits((x) => {
                const next = { ...x }
                if (r.need !== null && n === r.need) delete next[r.id]
                else next[r.id] = n
                return next
              })
            }}
          />
        )
      },
    },
    {
      key: "configuration",
      label: "Configuration",
      width: 192,
      filter: { type: "select", icon: "fa-sliders", operators: ["is", "is_not"], options: CONFIGURATION_ORDER.map((c) => ({ value: c, label: CONFIGURATION_META[c].label })) },
      cell: (r) =>
        !r.configured ? (
          <StatusBadge label="Not configured" tone="warning" icon="fa-triangle-exclamation" size="sm" surface="table" />
        ) : r.edited ? (
          <Link href={to("admin/configure-skill", { skill: r.id })} className={cn(LINK_IN_TABLE, TYPE.body)}>{CONFIGURATION_META.edited.label}</Link>
        ) : null,
    },
  ]
  // The configuration word on each row, for the DS filter.
  const rows = React.useMemo(() => data.map((r) => ({ ...r, configuration: !r.configured ? "not-configured" : r.edited ? "edited" : "default" })), [data])
  const ts = useTableState<TimesTableRow>(rows, columns)
  const setGroupBy = ts.setGroupBy
  React.useEffect(() => { setGroupBy("group") }, [setGroupBy])
  // The DS table's search is this view's search, so the count tabs and the empty message read it.
  const tableSearch = ts.search
  React.useEffect(() => { setQ(tableSearch) }, [tableSearch, setQ])
  const { toolbarSlot, conditionalRules } = useDsTableToolbar<TimesTableRow>(columns, "Times needed")
  return (
    <div className="flex flex-col gap-3" data-times-needed>
      {filterable ? (
        <Tabs value={view} onValueChange={(v) => setShow(v === "all" ? "all" : "different")}>
          <TabsList variant="line" ariaLabel={`Times needed per ${skillNoun()}`}>
            <TabsTrigger value="different">{`Different from ${programNeed}`}<TabsCountBadge count={diffCount} /></TabsTrigger>
            <TabsTrigger value="all">{`All ${skillNounPlural()}`}<TabsCountBadge count={m.times.length} /></TabsTrigger>
          </TabsList>
          <TabsContent value={view} className="hidden" />
        </Tabs>
      ) : null}
      <div role="region" aria-label="Times needed" data-times-table>
        <DataTable<TimesTableRow>
          data={rows}
          columns={columns}
          state={ts}
          getRowId={(r) => r.id}
          selectable={false}
          searchable
          showQueryControls
          toolbarSlot={toolbarSlot}
          conditionalRules={conditionalRules}
          edgeInset={false}
          lazyLoading={{ enabled: true, threshold: 80, chunkSize: 40, loadingLabel: "Loading more" }}
          emptyState={<EmptyBlock compact title={q.trim() ? `No ${skillNounPlural()} match "${q}"` : "None"} />}
        />
      </div>
    </div>
  )
}

/** The save every layout shares: the program part first (it asks, with the count), then the per-skill numbers. */
export function useProgramSave(m: ProgramModel, onIssue?: (i: RuleIssue) => void) {
  const [edits, setEdits] = React.useState<TimesEdits>({})
  const [confirm, setConfirm] = React.useState<null | "all" | "new">(null)
  const programChanged = !m.saved || m.dirty
  const timesChanged = Object.keys(edits).length > 0
  const writeTimes = React.useCallback(() => {
    if (Object.keys(edits).length) m.saveTimes(edits)
    setEdits({})
  }, [edits, m])
  const save = () => {
    if (programChanged) {
      if (m.issues.length) {
        m.setShowErrors(true)
        onIssue?.(m.issues[0]!)
        return
      }
      setConfirm("all")
      return
    }
    if (timesChanged && !timesInvalid(edits)) writeTimes()
  }
  const dialog = (
    <ApplyDialog m={m} open={confirm !== null} onOpenChange={(o) => !o && setConfirm(null)} only={confirm === "new" ? m.notConfigured : undefined} onSaved={() => writeTimes()} />
  )
  return { edits, setEdits, save, dialog, applyNew: () => setConfirm("new"), changed: programChanged || timesChanged, invalid: timesInvalid(edits) }
}
