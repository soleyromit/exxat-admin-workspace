"use client"

/**
 * Program evaluation settings (Proposed 2026-11-02, contract V2-06; lib/lab/program-settings.ts). The settings page reuses the
 * Configure sections unchanged: How it's judged, the criteria with "Which levels count toward achievement?" (D-L27), "When does it
 * count?" with the sentence that names the counting level (D-L28), and "Who signs, and what does the student add?" grouped by
 * subject (D-L26). The conditions (setting and level minimums) stay with each skill.
 *
 * Saving asks first, with the counts: how many skills take the settings, how many become usable, how many already match, how many
 * have settings of their own (kept unless included) and how many cannot take them yet and why [REQ IM-13, SC-18].
 */
import * as React from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import { Checkbox } from "@exxatdesignux/ui/components/ui/checkbox"
import { Label } from "@exxatdesignux/ui/components/ui/label"
import { Input } from "@exxatdesignux/ui/components/ui/input"
import { LocalBanner } from "@exxatdesignux/ui/components/ui/banner"
import { StatusBadge } from "@exxatdesignux/ui"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@exxatdesignux/ui/components/ui/dialog"
import { DataTable } from "@exxatdesignux/ui/components/data-table"
import { useTableState } from "@exxatdesignux/ui/components/data-table/use-table-state"
import type { ColumnDef } from "@exxatdesignux/ui/components/data-table/types"
import { Tabs, TabsContent, TabsCountBadge, TabsList, TabsTrigger } from "@exxatdesignux/ui/components/ui/tabs"
import { cn } from "@exxatdesignux/ui/lib/utils"
import { useV2Hydrated, useV2State, useV2Store } from "@/lib/v2/react"
import { DEMO_TODAY, IDS } from "@/lib/v2/seed-core"
import { buildLibrary } from "@/lib/lab/library"
import { CHECKOFF_LABEL, CRITERIA_LABEL, HOW_MANY_LABEL, MODEL_STEP_LABEL, configureStepHead, configureStepValue, LAB_MODEL_LABEL, ROLE_LABEL, ruleAllowsCheckOff, validateRule, type LabRule, type RuleIssue, type SectionId } from "@/lib/lab/configure"
import {
  notConfiguredIds,
  planProgramApply,
  programSettingsOf,
  programStartRule,
  saveProgramSettings,
  setTimesNeeded,
  timesRows,
  type ProgramApplyPlan,
  type TimesRow,
} from "@/lib/lab/program-settings"
import { capitalize, inSentence, countSkills, skillNoun, skillNounPlural } from "@/lib/lab/terms"
import { TYPE } from "@/components/lab/type-scale"
import { LINK_IN_TABLE } from "@/components/lab/link-styles"
import { EmptyBlock } from "@/components/lab/empty-block"
import { useLabHref } from "@/components/lab/lab-bar/page-context"
import { ApprovalToggle, FeedbackToggle, GroupCheckOffSection, ModelSection, OutcomesSection, RuleSection, SelfRatingToggle, SignersField, SignOffSection, StudentFieldsField, type SectionProps } from "./fields"
import { ConfigSection } from "./section"

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
  /** Active library skills in the shared store. */
  ids: string[]
  notConfigured: string[]
  plan: (includeOwn: boolean, only?: readonly string[]) => ProgramApplyPlan
  save: (includeOwn: boolean, only?: readonly string[]) => ProgramSaved | null
  result: ProgramSaved | null
  clearResult: () => void
  times: TimesRow[]
  saveTimes: (edits: Record<string, number>) => { written: number; failed: Array<{ id: string; error: string }> }
}

export function useProgramSettings(): ProgramModel {
  const state = useV2State()
  const store = useV2Store()
  const hydrated = useV2Hydrated()
  const params = useSearchParams()
  const library = React.useMemo(() => buildLibrary(state), [state])
  const ids = React.useMemo(() => library.filter((r) => r.status !== "inactive" && state.skills.some((k) => k.id === r.id)).map((r) => r.id), [library, state])
  const savedRec = hydrated ? programSettingsOf(state) : null
  const savedKey = JSON.stringify(savedRec?.rule ?? null)
  const [rule, setRuleState] = React.useState<LabRule>(() => programStartRule(state))
  const seeded = React.useRef<string | null>(null)
  React.useEffect(() => {
    if (!hydrated || seeded.current === savedKey) return
    seeded.current = savedKey
    setRuleState(programStartRule(state))
  }, [hydrated, savedKey, state])
  const setRule = React.useCallback<SectionProps["setRule"]>((next) => setRuleState((r) => (typeof next === "function" ? next(r) : next)), [])
  React.useEffect(() => {
    const onReset = () => setRuleState(programStartRule(state))
    window.addEventListener("lab:reset", onReset)
    return () => window.removeEventListener("lab:reset", onReset)
  }, [state])
  const [showErrors, setShowErrors] = React.useState(false)
  const [result, setResult] = React.useState<ProgramSaved | null>(null)
  const issues = React.useMemo(() => validateRule(rule), [rule])
  const dirty = JSON.stringify(rule) !== JSON.stringify(programStartRule(state))
  const notConfigured = React.useMemo(() => notConfiguredIds(state, ids), [state, ids])
  const plan = React.useCallback((includeOwn: boolean, only?: readonly string[]) => planProgramApply(state, rule, { includeOwn, only: only ?? ids }), [state, rule, ids])
  const save = React.useCallback(
    (includeOwn: boolean, only?: readonly string[]) => {
      let out: ProgramSaved | null = null
      store.update((s) => {
        const r = saveProgramSettings(s, rule, { at: now(), byId: IDS.ross, includeOwn, only: only ?? ids })
        if (!r.ok) return s
        out = { written: r.result.written.length, newlyConfigured: r.result.plan.newlyConfigured, kept: r.result.plan.own.length, blocked: r.result.plan.blocked.length }
        return r.result.state
      })
      setResult(out)
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
    clearResult: () => setResult(null),
    times,
    saveTimes,
  }
}

/** Section headings for the program, in the order Romit asked for (2026-11-02): judged, levels, how many, who signs. */
export function programHead(id: SectionId, model: LabRule["model"]): string {
  if (id === "model") return `How are ${skillNounPlural()} judged?`
  if (id === "rule") return "How many evaluations?"
  if (id === "signoff") return "Who signs?"
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
 * The confirmation before settings reach any skill [REQ IM-13]: the title carries the count; the skills that cannot take them
 * and the choice about skills with settings of their own show only when there are any.
 */
export function ApplyDialog({ m, open, onOpenChange, only, onSaved }: { m: ProgramModel; open: boolean; onOpenChange: (o: boolean) => void; only?: readonly string[]; onSaved?: (r: ProgramSaved | null) => void }) {
  const [includeOwn, setIncludeOwn] = React.useState(false)
  React.useEffect(() => { if (open) setIncludeOwn(false) }, [open])
  const plan = React.useMemo(() => (open ? m.plan(includeOwn, only) : null), [open, m, includeOwn, only])
  const ownCount = React.useMemo(() => (open ? m.plan(false, only).own.length : 0), [open, m, only])
  if (!plan) return null
  const n = plan.change.length
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{n ? `Apply to ${countSkills(n)}?` : "Save evaluation settings?"}</DialogTitle>
          <DialogDescription className="sr-only">{`Saving applies these settings to the listed ${skillNounPlural()}.`}</DialogDescription>
        </DialogHeader>
        {plan.blocked.length ? (
          <p className={TYPE.body} data-apply-plan>{`${countSkills(plan.blocked.length)} need their own questions first.`}</p>
        ) : null}
        {ownCount ? (
          <div className="flex items-start gap-2">
            <Checkbox id="prog-include-own" checked={includeOwn} onCheckedChange={(c) => setIncludeOwn(c === true)} />
            <Label htmlFor="prog-include-own" className="font-normal">{`Also apply to ${countSkills(ownCount)} with their own settings`}</Label>
          </div>
        ) : null}
        <DialogFooter>
          <Button type="button" variant="outline" size="default" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            type="button"
            variant="default"
            size="default"
            onClick={() => {
              const r = m.save(includeOwn, only)
              onSaved?.(r)
              onOpenChange(false)
            }}
          >
            {n ? `Apply to ${countSkills(n)}` : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/** What the save did, once (title only); and skills added since, with the way to apply the settings to them. */
export function ProgramBanners({ m, onApplyNew }: { m: ProgramModel; onApplyNew: () => void }) {
  if (m.result) {
    return <LocalBanner variant="success" dismissible onDismiss={m.clearResult}>{`Saved for ${countSkills(m.result.written)}`}</LocalBanner>
  }
  if (m.saved && m.notConfigured.length) {
    return <LocalBanner variant="warning" action={{ label: "Apply the settings", onClick: onApplyNew }}>{`${countSkills(m.notConfigured.length)} not configured`}</LocalBanner>
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
  { id: "signs", label: "Who signs" },
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
 * program's number, the skills whose number differs, group check-off. Who signs: student fields, self-rating, signers, feedback,
 * approval.
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
        <GroupCheckOffSection rule={m.rule} setRule={m.setRule} bare />
      </div>
    )
  }
  return (
    <div className="flex flex-col gap-6">
      <StudentFieldsField {...props} />
      <SelfRatingToggle rule={m.rule} setRule={m.setRule} />
      <SignersField {...props} />
      <FeedbackToggle rule={m.rule} setRule={m.setRule} />
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
    return need !== null && v !== null && v !== need
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
    { group: "signs", label: "Approval", value: on(r.approvalRequired) },
    { group: "howmany", label: CHECKOFF_LABEL, value: !r.model ? none : allowed ? (level ? `On, marks ${inSentence(level)}` : "On") : "Off" },
  ]
}

// ---------------------------------------------------------------------------------------------------------------------
// Times needed per skill: the one number a skill keeps [CALL 11-02], as an optional table on the settings page

export type TimesEdits = Record<string, number>

type TimesTableRow = TimesRow & { group: string } & Record<string, unknown>

export const timesInvalid = (edits: TimesEdits): boolean => Object.values(edits).some((v) => !Number.isInteger(v) || v < 1)

/**
 * Every active skill with its times needed, grouped by category, editable in place. Controlled: the page's own Save writes the
 * edits. "Own settings" opens that skill's Configure page (off the main path).
 */
export function TimesNeededTable({ m, edits, setEdits, programNeed }: { m: ProgramModel; edits: TimesEdits; setEdits: React.Dispatch<React.SetStateAction<TimesEdits>>; programNeed?: number | null }) {
  const to = useLabHref()
  const [q, setQ] = React.useState("")
  // With the program's number known, the skills whose number differs come first as their own list (not a buried toggle).
  const filterable = programNeed !== undefined && programNeed !== null
  const differs = (r: TimesRow) => {
    const v = edits[r.id] !== undefined ? edits[r.id] : r.need
    return v !== null && v !== programNeed
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
      key: "status",
      label: "Status",
      width: 192,
      cell: (r) =>
        !r.configured ? (
          <StatusBadge label="Not configured" tone="warning" icon="fa-triangle-exclamation" size="sm" surface="table" />
        ) : r.ownSettings ? (
          <Link href={to("admin/configure-skill", { skill: r.id })} className={cn(LINK_IN_TABLE, TYPE.body)}>Own settings</Link>
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
