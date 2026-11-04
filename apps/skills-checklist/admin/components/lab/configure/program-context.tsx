"use client"

/**
 * Evaluation settings with context and no prose (Proposed 2026-11-03; docs/build/2026-11-03-evaluation-settings-concepts.md).
 * Shared by variants D, E and F; variants A, B and C keep `ProgramSettingsFrame` and `ApplyDialog` unchanged.
 *
 * - Scope line under the title: counts only, each a link to the Library (all, not configured, configured).
 * - Locked sections show their greyed shape and the name of the section that unlocks them, instead of a sentence.
 * - Drawn samples of the evaluator form and the student request (decorative pictures built from a real library skill of that
 *   model, and from the program's own labels once chosen). Romit 2026-11-03: drawn mini forms are acceptable as visuals.
 * - The first-save confirm asks the scope (not configured only, or all) with nothing preselected [REQ SC-02 spirit, IM-13], and
 *   shows the change / match / keep own / need questions counts from `planProgramApply` (behaviour unchanged).
 */
import * as React from "react"
import Link from "next/link"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import { Checkbox } from "@exxatdesignux/ui/components/ui/checkbox"
import { Label } from "@exxatdesignux/ui/components/ui/label"
import { Skeleton } from "@exxatdesignux/ui/components/ui/skeleton"
import { RadioGroup, RadioGroupItem } from "@exxatdesignux/ui/components/ui/radio-group"
import { FieldError } from "@exxatdesignux/ui/components/ui/field"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@exxatdesignux/ui/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@exxatdesignux/ui/components/ui/alert-dialog"
import { cn } from "@exxatdesignux/ui/lib/utils"
import { PageFrame } from "@/components/skills/page-header"
import { TYPE } from "@/components/lab/type-scale"
import { NUM_LINK } from "@/components/lab/link-styles"
import { useLabHref } from "@/components/lab/lab-bar/page-context"
import { useV2State } from "@/lib/v2/react"
import { buildLibrary } from "@/lib/lab/library"
import { skillRuleOf } from "@/lib/lab/program-settings"
import { countingLevels, emptyRule, hasNeed, LAB_MODEL_LABEL, LAB_MODELS, withModel, type LabRule, type RuleIssue } from "@/lib/lab/configure"
import type { EvalModel } from "@/lib/v2/types"
import { countSkills, skillNoun, skillNounPlural } from "@/lib/lab/terms"
import { focusField } from "./use-configure"
import { useEmbeddedStep } from "@/components/lab/layout/embedded"
import { EVALUATION_SETTINGS_TITLE } from "./program-layout"
import { exceptionCount, ProgramBanners, TimesNeededTable, timesInvalid, useProgramSettings, type ProgramModel, type ProgramSaved, type TimesEdits } from "@/components/lab/configure/program-parts"

export const MODEL_ICON: Record<EvalModel, string> = { binary: "fa-circle-half-stroke", question: "fa-list-check", scored: "fa-star-half-stroke", demonstration: "fa-stairs" }

// ---------------------------------------------------------------------------------------------------------------------
// Facts from the seed (the same library rows the Library tabs count)

export interface ScopeFacts {
  /** Active skills in the shared store. */
  total: number
  notConfigured: number
  /** Configured active skills per model. */
  byModel: Record<EvalModel, number>
  modelsInUse: number
  /** A real configured skill per model: its name and saved rule, for the drawn samples. */
  sample: Record<EvalModel, { name: string; rule: LabRule } | null>
}

export function useScopeFacts(m: ProgramModel): ScopeFacts {
  const state = useV2State()
  return React.useMemo(() => {
    const library = buildLibrary(state)
    const active = new Set(m.ids)
    const byModel: Record<EvalModel, number> = { binary: 0, question: 0, demonstration: 0, scored: 0 }
    const sample: ScopeFacts["sample"] = { binary: null, question: null, demonstration: null, scored: null }
    const skills = new Map(state.skills.map((k) => [k.id, k]))
    for (const row of library) {
      if (!active.has(row.id) || row.status !== "configured" || !row.model) continue
      byModel[row.model] += 1
      if (!sample[row.model]) {
        const k = skills.get(row.id)
        const rule = k ? skillRuleOf(k) : null
        if (rule) sample[row.model] = { name: row.name, rule }
      }
    }
    return { total: m.ids.length, notConfigured: m.notConfigured.length, byModel, modelsInUse: LAB_MODELS.filter((x) => byModel[x] > 0).length, sample }
  }, [state, m.ids, m.notConfigured.length])
}

/** "176 skills · 31 not configured": counts only, each opening the Library on that tab. The page sets one program rule, so the
 * count of models already in use is not shown (D-L43); "not configured" shows only while there are some. */
export function ScopeLine({ facts }: { facts: ScopeFacts }) {
  const to = useLabHref()
  const sep = <span aria-hidden="true" className="text-muted-foreground">·</span>
  return (
    <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm" data-scope-line>
      <Link href={to("admin/skills-library")} className={NUM_LINK}>{countSkills(facts.total)}</Link>
      {facts.notConfigured ? (
        <>
          {sep}
          <Link href={to("admin/skills-library", { status: "not-configured" })} className={NUM_LINK}>{`${facts.notConfigured} not configured`}</Link>
        </>
      ) : null}
    </p>
  )
}

// ---------------------------------------------------------------------------------------------------------------------
// Locked shape: the section's controls drawn grey, a lock and the section that unlocks it

export type ShapePart = "field" | "chips" | "number" | "toggle" | "list"

function ShapeBar({ className }: { className?: string }) {
  return <span className={cn("block h-2.5 rounded-full bg-border", className)} />
}

/** `quiet`: the same cause is named just above (two locked sections in a row), so the words go to screen readers only. */
export function LockedShape({ after, parts, className, quiet }: { after: string; parts: ShapePart[]; className?: string; quiet?: boolean }) {
  return (
    <div className={cn("flex flex-col gap-3", className)} data-locked>
      <p className={cn("flex items-center gap-2", TYPE.meta)}>
        <i className="fa-light fa-lock" aria-hidden="true" />
        <span className={quiet ? "sr-only" : undefined}>{`After ${after.toLowerCase()}`}</span>
      </p>
      <div className="flex flex-col gap-3" aria-hidden="true">
        {parts.map((p, i) => (
          <div key={i} className={cn("flex gap-3", p === "list" ? "items-start" : "items-center")}>
            <ShapeBar className={cn("w-28", p === "list" && "mt-3")} />
            {p === "field" ? <span className="block h-8 w-64 rounded-[var(--radius)] border border-dashed border-border bg-muted" /> : null}
            {p === "number" ? <span className="block h-8 w-16 rounded-[var(--radius)] border border-dashed border-border bg-muted" /> : null}
            {p === "toggle" ? <span className="block h-5 w-9 rounded-full border border-dashed border-border bg-muted" /> : null}
            {p === "chips" ? (
              <span className="flex gap-2">
                {[20, 28, 24].map((w) => <span key={w} className="block h-7 rounded-[var(--radius)] border border-dashed border-border bg-muted" style={{ width: `${w * 4}px` }} />)}
              </span>
            ) : null}
            {p === "list" ? (
              <span className="flex flex-col gap-2">
                {[0, 1, 2].map((k) => <span key={k} className="block h-7 w-72 rounded-[var(--radius)] border border-dashed border-border bg-muted" />)}
              </span>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------------------------------------------------
// Drawn samples (decorative pictures, never controls)

/** The rule a sample draws: the real skill's rule for that model, with the program's own labels on top once chosen. */
export function sketchRule(model: EvalModel, draft: LabRule, sample: { rule: LabRule } | null): LabRule {
  const base: LabRule = sample ? { ...sample.rule } : withModel(emptyRule(), model)
  if (draft.model !== model) return base
  const levels = draft.levels.some((l) => l.trim()) ? draft.levels : base.levels
  return {
    ...base,
    outcomeLabels: draft.outcomeLabels,
    qualifyingLabel: draft.qualifyingLabel,
    levels,
    carried: { ...base.carried, minLevelIndex: draft.levels.some((l) => l.trim()) ? draft.carried.minLevelIndex : base.carried.minLevelIndex },
    scaleMax: draft.scaleMax,
    feedbackRequired: draft.feedbackRequired,
    studentFields: draft.studentFields,
    selfEvaluation: draft.selfEvaluation,
    need: hasNeed(draft) ? draft.need : base.need,
  }
}

const PILL = "inline-flex h-6 items-center rounded-full border border-border bg-background px-2 text-xs text-foreground"
const PILL_ON = "border-foreground font-medium"

export function Pills({ labels, on = [], nowrap }: { labels: string[]; on?: number[]; nowrap?: boolean }) {
  return (
    <span className={cn("flex gap-1", nowrap ? "shrink-0 flex-nowrap" : "flex-wrap")}>
      {labels.map((l, i) => <span key={i} className={cn(PILL, on.includes(i) && PILL_ON)}>{l}</span>)}
    </span>
  )
}

/**
 * What the evaluator taps for one skill under `rule`, drawn small. `rule.model` null draws the empty skeleton of a form.
 * `size="sm"` is the tile thumbnail (three rows at most); `md` is the preview column.
 */
export function EvaluatorSketch({ rule, skillName, size = "md", className }: { rule: LabRule; skillName: string; size?: "sm" | "md"; className?: string }) {
  const model = rule.model
  const rows = size === "sm" ? 2 : 4
  const outcomes = rule.outcomeLabels.map((x, i) => x.trim() || (i === 0 ? "Met" : "Unmet"))
  const qualifying = rule.qualifyingLabel === null ? [] : [rule.qualifyingLabel]
  const label = model ? `Sample evaluator form, ${LAB_MODEL_LABEL[model].toLowerCase()}` : "Sample evaluator form, nothing chosen yet"
  return (
    <div role="img" aria-label={label} className={cn("flex select-none flex-col gap-2 rounded-[var(--radius)] border border-border bg-muted p-3", className)} data-sketch="evaluator">
      <span className={cn("truncate font-medium text-foreground", size === "sm" ? "text-xs" : "text-sm")}>{skillName}</span>
      {!model ? (
        <span className="flex flex-col gap-2" aria-hidden="true">
          {Array.from({ length: rows }).map((_, i) => <span key={i} className="flex items-center gap-2"><ShapeBar className="w-24" /><ShapeBar className="w-12" /></span>)}
        </span>
      ) : null}
      {model === "binary" ? <Pills labels={outcomes} on={qualifying} /> : null}
      {model === "demonstration" ? (
        <span className="flex flex-col gap-1">
          {(() => {
            const counting = new Set(countingLevels(rule))
            const levels = rule.levels.map((l, i) => l.trim() || `Level ${i + 1}`)
            return [...levels].reverse().slice(0, size === "sm" ? 3 : 6).map((l) => (
              <span key={l} className="flex items-center gap-2 text-xs text-foreground">
                <i className={cn("fa-light", counting.has(l) ? "fa-circle-check" : "fa-circle")} aria-hidden="true" />
                <span className={cn(counting.has(l) && "font-medium")}>{l}</span>
              </span>
            ))
          })()}
        </span>
      ) : null}
      {model === "question" || model === "scored" ? (
        <span className="flex flex-col gap-1.5">
          {(rule.questions.filter((q) => q.trim()).length ? rule.questions.filter((q) => q.trim()) : ["Question 1", "Question 2"]).slice(0, rows).map((q, i) => (
            <span key={i} className="flex items-center justify-between gap-2">
              <span className="min-w-0 truncate text-xs text-foreground">{`${i + 1} ${q}`}</span>
              {model === "question" ? (
                <Pills labels={["Yes", "No"]} nowrap />
              ) : (
                <span className="flex shrink-0 gap-0.5">
                  {Array.from({ length: Math.min(rule.scaleMax || 5, 5) }).map((_, k) => (
                    <span key={k} className="inline-flex size-5 items-center justify-center rounded-[var(--radius)] border border-border bg-background text-xs tabular-nums text-foreground">{k + 1}</span>
                  ))}
                </span>
              )}
            </span>
          ))}
          {model === "question" ? (
            <span className="flex items-center justify-between gap-2 border-t border-border pt-1.5">
              <span className="text-xs font-medium text-foreground">Result</span>
              <Pills labels={outcomes} on={qualifying} nowrap />
            </span>
          ) : null}
        </span>
      ) : null}
      {size === "md" && model ? (
        <span className="flex flex-col gap-1 border-t border-border pt-2">
          <span className="text-xs text-muted-foreground">{`Feedback${rule.feedbackRequired ? " (required)" : ""}`}</span>
          <span className="block h-10 rounded-[var(--radius)] border border-border bg-background" />
          <span className="ms-auto inline-flex h-7 items-center rounded-[var(--radius)] bg-foreground px-3 text-xs font-medium text-background">Sign and submit</span>
        </span>
      ) : null}
    </div>
  )
}

/** What the student fills to ask for sign-off, drawn: the program's student fields and self-rating. */
export function StudentSketch({ rule, skillName, className, size = "md" }: { rule: LabRule; skillName: string; className?: string; size?: "sm" | "md" }) {
  const fields = rule.studentFields.filter((f) => f.label.trim()).slice(0, size === "sm" ? 1 : undefined)
  return (
    <div role="img" aria-label="Sample student request" className={cn("flex select-none flex-col gap-2 rounded-[var(--radius)] border border-border bg-muted p-3", className)} data-sketch="student">
      <span className={cn("truncate font-medium text-foreground", size === "sm" ? "text-xs" : "text-sm")}>{skillName}</span>
      {rule.model && hasNeed(rule) ? <span className="text-xs tabular-nums text-muted-foreground">{`0 of ${rule.need}`}</span> : <ShapeBar className="w-16" />}
      {fields.map((f, i) => (
        <span key={i} className="flex flex-col gap-1">
          <span className="text-xs text-foreground">{f.label.trim()}</span>
          <span className="block h-7 rounded-[var(--radius)] border border-border bg-background" />
        </span>
      ))}
      {rule.selfEvaluation && size === "md" ? (
        <span className="flex flex-col gap-1">
          <span className="text-xs text-foreground">Own rating</span>
          {rule.model === "demonstration" && rule.levels.some((l) => l.trim()) ? <Pills labels={rule.levels.map((l, i) => l.trim() || `Level ${i + 1}`)} /> : <span className="block h-7 rounded-[var(--radius)] border border-border bg-background" />}
        </span>
      ) : null}
      <span className="ms-auto inline-flex h-7 items-center rounded-[var(--radius)] bg-foreground px-3 text-xs font-medium text-background">Ask for sign-off</span>
    </div>
  )
}

// ---------------------------------------------------------------------------------------------------------------------
// Model choice (shared radio behaviour: nothing preselected, a switch that loses typed labels asks first)

export function useModelChoice(m: ProgramModel, onChosen?: (x: EvalModel) => void) {
  const [pending, setPending] = React.useState<EvalModel | null>(null)
  const choose = React.useCallback((x: EvalModel) => {
    m.setRule((r) => withModel(r, x))
    onChosen?.(x)
  }, [m, onChosen])
  const typed = m.rule.levels.some((l) => l.trim()) || m.rule.questions.some((q) => q.trim())
  const onValue = (v: string) => {
    const x = v as EvalModel
    if (m.rule.model && m.rule.model !== x && typed) setPending(x)
    else if (m.rule.model !== x) choose(x)
    else onChosen?.(x)
  }
  const confirm = (
    <AlertDialog open={pending !== null} onOpenChange={(o) => !o && setPending(null)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{pending ? `Switch to ${LAB_MODEL_LABEL[pending].toLowerCase()}?` : "Switch?"}</AlertDialogTitle>
          <AlertDialogDescription>The labels you typed for the current choice are removed.</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel variant="outline" size="default" autoFocus>Keep</AlertDialogCancel>
          <AlertDialogAction variant="default" size="default" onClick={() => { if (pending) choose(pending); setPending(null) }}>Switch</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
  return { onValue, confirm }
}

// ---------------------------------------------------------------------------------------------------------------------
// First-save confirm: which skills, then the counts

type Scope = "new" | "all"

export function ScopeApplyDialog({ m, open, onOpenChange, onSaved }: { m: ProgramModel; open: boolean; onOpenChange: (o: boolean) => void; onSaved?: (r: ProgramSaved | null) => void }) {
  const [scope, setScope] = React.useState<Scope | null>(null)
  const [includeOwn, setIncludeOwn] = React.useState(false)
  const [tried, setTried] = React.useState(false)
  React.useEffect(() => {
    if (open) {
      setScope(null)
      setIncludeOwn(false)
      setTried(false)
    }
  }, [open])
  const only = scope === "new" ? m.notConfigured : m.ids
  const plan = React.useMemo(() => (open && scope ? m.plan(includeOwn, only) : null), [open, scope, m, includeOwn, only])
  const ownChoice = React.useMemo(() => (open && scope ? m.plan(false, only).own.length : 0), [open, scope, m, only])
  const outside = scope === "new" ? m.ids.length - m.notConfigured.length : 0
  const rows: Array<{ label: string; n: number | null }> = [
    { label: "Change", n: plan ? plan.change.length : null },
    { label: "Already match", n: plan ? plan.unchanged.length : null },
    { label: "Keep their own", n: plan ? plan.own.length + outside : null },
    { label: "Need their own questions", n: plan ? plan.blocked.length : null },
  ]
  const n = plan?.change.length ?? 0
  const err = tried && !scope ? `Choose which ${skillNounPlural()}.` : undefined
  const option = (value: Scope, label: string, count: number) => (
    <Label
      htmlFor={`scope-${value}`}
      className="flex cursor-pointer items-center gap-3 rounded-[var(--radius)] border border-border bg-background p-3 font-normal has-[[data-state=checked]]:border-[var(--brand-color)] has-[[data-state=checked]]:bg-[var(--brand-tint)]"
    >
      <RadioGroupItem id={`scope-${value}`} value={value} />
      <span className="flex-1 text-sm text-foreground">{label}</span>
      <span className="text-sm font-semibold tabular-nums text-foreground">{count}</span>
    </Label>
  )
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg" data-scope-dialog>
        <DialogHeader>
          <DialogTitle>{`Apply to which ${skillNounPlural()}?`}</DialogTitle>
          <DialogDescription className="sr-only">{`Choose which ${skillNounPlural()} take these evaluation settings, then review the counts.`}</DialogDescription>
        </DialogHeader>
        <RadioGroup id="scope-choice" value={scope ?? ""} onValueChange={(v) => setScope(v === "all" ? "all" : "new")} aria-label={`Which ${skillNounPlural()}`} aria-invalid={err ? true : undefined} aria-describedby={err ? "scope-choice-error" : undefined} className="grid gap-2">
          {option("new", "Not configured only", m.notConfigured.length)}
          {option("all", `All ${skillNounPlural()}`, m.ids.length)}
        </RadioGroup>
        {err ? <FieldError id="scope-choice-error">{err}</FieldError> : null}
        <dl className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-6 gap-y-2 border-t border-border pt-3" data-apply-counts>
          {rows.map((r) => (
            <React.Fragment key={r.label}>
              <dt className={cn(TYPE.body, r.n === null && "text-muted-foreground")}>{r.label}</dt>
              <dd className={cn("text-end text-sm font-semibold tabular-nums", r.n === null ? "text-muted-foreground" : "text-foreground")}>{r.n === null ? "–" : r.n}</dd>
            </React.Fragment>
          ))}
        </dl>
        {ownChoice ? (
          <div className="flex items-start gap-2">
            <Checkbox id="scope-include-own" checked={includeOwn} onCheckedChange={(c) => setIncludeOwn(c === true)} />
            <Label htmlFor="scope-include-own" className="font-normal">{`Also apply to ${countSkills(ownChoice)} with their own settings`}</Label>
          </div>
        ) : null}
        <DialogFooter>
          <Button type="button" variant="outline" size="default" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            type="button"
            variant="default"
            size="default"
            onClick={() => {
              if (!scope) {
                setTried(true)
                return
              }
              const r = m.save(includeOwn, only)
              onSaved?.(r)
              onOpenChange(false)
            }}
          >
            {scope && n ? `Apply to ${countSkills(n)}` : "Apply"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ---------------------------------------------------------------------------------------------------------------------
// Frame for D, E, F: title, scope line, banners, the layout, the one Save, the scope confirm

export interface ContextPage {
  m: ProgramModel
  facts: ScopeFacts
  edits: TimesEdits
  setEdits: React.Dispatch<React.SetStateAction<TimesEdits>>
}

export function ContextSettingsFrame({ children, onIssue, aside }: { children: (p: ContextPage) => React.ReactNode; onIssue?: (i: RuleIssue) => void; aside?: (p: ContextPage) => React.ReactNode }) {
  const m = useProgramSettings()
  const facts = useScopeFacts(m)
  const [edits, setEdits] = React.useState<TimesEdits>({})
  const [open, setOpen] = React.useState(false)
  const programChanged = !m.saved || m.dirty
  const timesChanged = Object.keys(edits).length > 0
  const writeTimes = () => {
    if (Object.keys(edits).length) m.saveTimes(edits)
    setEdits({})
  }
  const save = () => {
    if (programChanged) {
      if (m.issues.length) {
        m.setShowErrors(true)
        // The first thing to fix in page order, so a section locked behind it is never the target.
        const order = ["model", "outcomes", "rule", "signoff"]
        const first = [...m.issues].sort((a, b) => order.indexOf(a.section) - order.indexOf(b.section))[0]!
        onIssue?.(first)
        requestAnimationFrame(() => requestAnimationFrame(() => focusField(first.field)))
        return
      }
      setOpen(true)
      return
    }
    if (timesChanged && !timesInvalid(edits)) writeTimes()
  }
  // Inside the Set up skills workflow (D-L44) the wizard's Next runs this save: same validation, same confirm dialog.
  const embedded = useEmbeddedStep()
  const saveRef = React.useRef(save)
  saveRef.current = save
  // Unsaved program changes: the save will validate and confirm before anything is written.
  const pendingRef = React.useRef(programChanged)
  pendingRef.current = programChanged
  const register = embedded?.registerPrimary
  React.useEffect(() => {
    if (!register) return
    register(() => { const pending = pendingRef.current; saveRef.current(); return pending })
    return () => register(null)
  }, [register])
  if (m.loading) {
    return (
      <PageFrame title={EVALUATION_SETTINGS_TITLE}>
        <Skeleton className="h-96 w-full" aria-label="Loading" />
      </PageFrame>
    )
  }
  const page: ContextPage = { m, facts, edits, setEdits }
  return (
    <div className="flex min-h-[calc(100dvh-5.5rem)] w-full flex-col" data-page-type="form">
      <PageFrame
        title={EVALUATION_SETTINGS_TITLE}
        className="flex-1"
        // Navigation model A (D-L42): the page's one filled action sits in the header; no flow footer.
        actions={<Button type="button" variant="default" size="sm" onClick={save} disabled={!(programChanged || timesChanged) || timesInvalid(edits)}>{m.saved ? "Save changes" : "Save settings"}</Button>}
      >
        {/* Inside Set up skills (D-L44) the scope line is a fact line the step does not need (D-L34): hub only. */}
        {embedded ? null : <ScopeLine facts={facts} />}
        <ProgramBanners m={m} onApplyNew={() => setOpen(true)} />
        {children(page)}
      </PageFrame>
      {aside?.(page)}
      <ScopeApplyDialog m={m} open={open} onOpenChange={setOpen} onSaved={() => writeTimes()} />
    </div>
  )
}

// ---------------------------------------------------------------------------------------------------------------------
// Shared by the 2026-11-03 rework of D, E and F (one sentence, the journey, edit on the form)

/** Amber, never red: a value the save could not accept. */
export const WARN_TEXT = "text-[var(--status-badge-warning-fg)]"

/** True when a failed save named a field whose id starts with one of `prefixes`. */
export function failsOn(m: ProgramModel, prefixes: string[]): boolean {
  return m.showErrors && m.issues.some((i) => prefixes.some((p) => i.field.startsWith(p)))
}

/** The fields each part of the rule owns (validateRule ids), so a page can open the editor that holds the failing field. */
export const CRITERIA_FIELDS = ["cfg-label", "cfg-qualifying", "cfg-level", "cfg-add-level", "cfg-counts-from", "cfg-question", "cfg-add-question", "cfg-scale", "cfg-qrule", "cfg-srule"]
export const SIGNER_FIELDS = ["cfg-role"]
export const STUDENT_FIELDS = ["cfg-field"]
export const NEED_FIELDS = ["cfg-need"]

/** "Not set" in a control or a drawn region: neutral until a save fails on it, then amber with a glyph. */
export function NotSet({ warn, className }: { warn?: boolean; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5", warn ? WARN_TEXT : "text-muted-foreground", className)}>
      {warn ? <i className="fa-solid fa-triangle-exclamation" aria-hidden="true" /> : null}
      Not set
    </span>
  )
}

/** The value that says what counts, short enough for a picker: the qualifying outcome, the levels that count, or the questions. */
export function criterionValue(rule: LabRule): string | null {
  const m = rule.model
  if (!m) return null
  if (m === "binary") return rule.qualifyingLabel === null ? null : rule.outcomeLabels[rule.qualifyingLabel].trim() || null
  if (m === "demonstration") {
    const from = rule.carried.minLevelIndex
    return from !== null && from < rule.levels.length && rule.levels[from]?.trim() ? countsFromOptionText(rule.levels, from) : null
  }
  const n = rule.questions.filter((q) => q.trim()).length
  return n ? `${n} ${n === 1 ? "question" : "questions"}` : null
}

function countsFromOptionText(levels: readonly string[], i: number): string {
  const name = levels[i]?.trim() || `Level ${i + 1}`
  if (i === 0) return "Any level"
  if (i === levels.length - 1) return `${name} only`
  return `${name} or above`
}

/** "a preceptor", "a preceptor or clinical faculty": the signers inside a sentence (lowercase mid-sentence), or null. */
export function signerPhrase(roles: LabRule["evaluatorRoles"]): string | null {
  if (!roles.length) return null
  const words = roles.map((r) => ROLE_WORD[r])
  const list = words.length === 1 ? words[0]! : `${words.slice(0, -1).join(", ")} or ${words[words.length - 1]}`
  return roles[0] === "faculty" ? list : `a ${list}`
}
const ROLE_WORD: Record<LabRule["evaluatorRoles"][number], string> = { preceptor: "preceptor", faculty: "clinical faculty", "lab-instructor": "lab instructor" }

/** Times needed per skill [CALL 11-02]: a button naming how many differ, opening the editable table in a dialog. */
export function TimesNeededButton({ p, className, variant = "link", label, footer }: { p: ContextPage; className?: string; variant?: "link" | "outline"; label?: string; /** Extra control at the start of the dialog footer (D: "Change one skill"). */ footer?: React.ReactNode }) {
  const [open, setOpen] = React.useState(false)
  const n = exceptionCount(p.m, p.edits)
  return (
    <>
      <Button type="button" variant={variant} size="sm" className={cn(variant === "link" && "h-auto px-0", className)} onClick={() => setOpen(true)} data-times-button>
        {label ?? (n ? `${countSkills(n)} with a different number` : `Number per ${skillNoun()}`)}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>{`Number per ${skillNoun()}`}</DialogTitle>
            <DialogDescription className="sr-only">{`Evaluations needed for each ${skillNoun()}.`}</DialogDescription>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-auto">
            <TimesNeededTable m={p.m} edits={p.edits} setEdits={p.setEdits} programNeed={Number.isFinite(p.m.rule.need) ? p.m.rule.need : null} />
          </div>
          <DialogFooter className={footer ? "sm:justify-between" : undefined}>
            {footer}
            <Button type="button" variant="outline" size="default" onClick={() => setOpen(false)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

/** A real library skill name for the drawn samples: the chosen model's, or the first model's before one is chosen. */
export function sampleName(p: ContextPage): string {
  const model = p.m.rule.model
  return (model ? p.facts.sample[model]?.name : null) ?? LAB_MODELS.map((x) => p.facts.sample[x]?.name).find(Boolean) ?? ""
}

/** The rule the drawn samples use: the chosen model's real skill with the program's own labels and student settings on top. */
export function previewRule(p: ContextPage): LabRule {
  const model = p.m.rule.model
  const base = model ? sketchRule(model, p.m.rule, p.facts.sample[model]) : p.m.rule
  return { ...base, need: p.m.rule.need, studentFields: p.m.rule.studentFields, selfEvaluation: p.m.rule.selfEvaluation, feedbackRequired: p.m.rule.feedbackRequired }
}
