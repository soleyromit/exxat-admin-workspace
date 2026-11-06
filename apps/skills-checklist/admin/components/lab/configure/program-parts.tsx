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
import { buildLibrary, CONFIGURATION_META } from "@/lib/lab/library"
import { CHECKOFF_LABEL, CRITERIA_LABEL, HOW_MANY_LABEL, WHO_DOES_WHAT_LABEL, MODEL_STEP_LABEL, configureStepHead, configureStepValue, LAB_MODEL_LABEL, ROLE_LABEL, ruleAllowsCheckOff, type LabRule, type RuleIssue, type SectionId } from "@/lib/lab/configure"
import {
  blockedGroups,
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
  type TimesRow,
} from "@/lib/lab/program-settings"
import { capitalize, inSentence, countSkills, skillNoun, skillNounPlural } from "@/lib/lab/terms"
import { TYPE } from "@/components/lab/type-scale"
import { LINK_IN_TABLE } from "@/components/lab/link-styles"
import { EmptyBlock } from "@/components/lab/empty-block"
import { useLabHref } from "@/components/lab/lab-bar/page-context"
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
 * The confirmation before settings reach any skill [REQ IM-13, AE-02; map D3, D0 rules 2, 6, 7, 8, 9]: who changes, who stays Edited, and
 * the students whose progress changes, by name. A rename changes nobody's progress, so it has no students line [REQ AE-06].
 */
export function ApplyDialog({ m, open, onOpenChange, only, onSaved }: { m: ProgramModel; open: boolean; onOpenChange: (o: boolean) => void; only?: readonly string[]; onSaved?: (r: ProgramSaved | null) => void }) {
  const plan = React.useMemo(() => (open ? m.plan(only) : null), [open, m, only])
  const impact = React.useMemo(() => (plan ? m.impactOf(plan) : null), [plan, m])
  const [names, setNames] = React.useState(false)
  React.useEffect(() => { if (open) setNames(false) }, [open])
  const focus = useFocusBack()
  if (!plan || !impact) return null
  const n = plan.change.length
  const gone = plan.blocked.length
  const effects = programSaveEffects(m.saved, m.rule)
  const usesQuestions = m.rule.model === "question" || m.rule.model === "scored"
  // Only fields this page shows, in its words: minimums are per skill (they have their own row above), the rest fold into the row that holds them.
  const pageCleared = effects.cleared.flatMap((w) => (w === "Minimum at each level" || w === "Levels that count" || w === "Named questions" ? [] : w === "Checked-off students get" ? [m.saved?.model === "scored" ? "Score students get" : "Level students get"] : [w]))
  const rows: Array<{ label: string; value: string }> = [
    // A rename is said as a rename [REQ AE-06]: nothing about those skills changes but the words.
    ...(n ? [{ label: CONFIGURATION_META.default.label, value: effects.namesOnly ? `${n} show the new names` : `${n} will change` }] : []),
    ...(usesQuestions && plan.programQuestions ? [{ label: "Questions on this page", value: `${plan.programQuestions} use them` }] : []),
    ...(usesQuestions && plan.ownQuestions ? [{ label: "Own questions", value: `${plan.ownQuestions} keep their own` }] : []),
    // Only those no other row names: a skill unchanged because it keeps its own number or its own questions is said once, there.
    ...(plan.alreadyOnSettings ? [{ label: "Already on these settings", value: `${plan.alreadyOnSettings} already match` }] : []),
    ...(plan.edited.length ? [{ label: CONFIGURATION_META.edited.label, value: `${plan.edited.length} keep their settings and number` }] : []),
    ...(plan.staysNotConfigured.length ? [{ label: "Not configured", value: `${plan.staysNotConfigured.length} stay not configured` }] : []),
    // The page's link counts Custom skills too, so this row says whose number it counts; the Custom row above says those keep theirs.
    ...(plan.ownNumber ? [{ label: `${CONFIGURATION_META.default.label} with their own number`, value: `${plan.ownNumber} keep their number` }] : []),
    ...blockedGroups(plan).map((g) => ({ label: g.words, value: `${g.count} become not configured` })),
    ...(plan.minimumsCleared ? [{ label: "Level minimums", value: `Cleared on ${plan.minimumsCleared}` }] : []),
    ...(effects.checkOff ? [{ label: "Faculty can check off a group", value: effects.checkOff === "off" ? "Turns off" : "Turns on" }] : []),
    ...(pageCleared.length ? [{ label: "Cleared", value: pageCleared.join(", ") }] : []),
  ]
  // A switch every skill follows into Not configured must say so in its title: "Apply to 0" would hide it.
  const title = !n && gone ? `${countSkills(gone)} become not configured. Apply?` : n ? `Apply to ${countSkills(n)}?` : "Apply these settings?"
  const students = impact.ruleChanged && impact.students.length > 0
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg" data-apply-dialog {...focus}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {/* Nothing to count (a program with no skills yet): the one plain line, and no rows. */}
          {rows.length || students ? <DialogDescription className="sr-only">Saving applies these settings to the program.</DialogDescription> : <DialogDescription>{`New ${skillNounPlural()} take these settings when they are added.`}</DialogDescription>}
        </DialogHeader>
        <dl className="grid grid-cols-2 gap-x-6 gap-y-2 empty:hidden" data-apply-plan>
          {rows.map((r) => (
            <React.Fragment key={r.label}>
              <dt className={TYPE.body}>{r.label}</dt>
              <dd className="text-end text-sm font-medium tabular-nums text-foreground">{r.value}</dd>
            </React.Fragment>
          ))}
          {students ? (
            <>
              <dt className={TYPE.body}>Students whose progress changes</dt>
              <dd className="text-end text-sm font-medium tabular-nums text-foreground">
                {impact.students.length}
                <Button type="button" variant="link" size="sm" className="ms-2 h-auto p-0" aria-expanded={names} onClick={() => setNames((x) => !x)}>{names ? "Hide names" : "Show names"}</Button>
              </dd>
            </>
          ) : null}
        </dl>
        {names ? (
          <ul className="max-h-40 overflow-y-auto rounded-[var(--radius)] border border-border p-2 text-sm text-foreground" data-apply-names>
            {impact.students.map((x) => <li key={x.id}>{x.name}</li>)}
          </ul>
        ) : null}
        <DialogFooter>
          <Button type="button" variant="outline" size="default" onClick={(e) => { holdSecondPress(e); onOpenChange(false) }}>Cancel</Button>
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
            {n ? `Apply to ${countSkills(n)}` : "Apply settings"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
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
      cell: (r) => {
        const v = edits[r.id]
        const bad = v !== undefined && (!Number.isInteger(v) || v < 1)
        return (
          <Input
            id={`times-${r.id}`}
            type="number"
            inputMode="numeric"
            min={1}
            className="w-24"
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
      cell: (r) =>
        !r.configured ? (
          <StatusBadge label="Not configured" tone="warning" icon="fa-triangle-exclamation" size="sm" surface="table" />
        ) : r.edited ? (
          <Link href={to("admin/configure-skill", { skill: r.id })} className={cn(LINK_IN_TABLE, TYPE.body)}>{CONFIGURATION_META.edited.label}</Link>
        ) : null,
    },
  ]
  const ts = useTableState<TimesTableRow>(data, columns)
  const setGroupBy = ts.setGroupBy
  React.useEffect(() => { setGroupBy("group") }, [setGroupBy])
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
      <Input type="search" className="w-72 max-w-full" aria-label={`Search ${skillNounPlural()}`} placeholder={`Search ${skillNounPlural()}`} value={q} onChange={(e) => setQ(e.target.value)} />
      <div role="region" aria-label="Times needed" data-times-table>
        <DataTable<TimesTableRow>
          data={data}
          columns={columns}
          state={ts}
          getRowId={(r) => r.id}
          selectable={false}
          searchable={false}
          showQueryControls={false}
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
