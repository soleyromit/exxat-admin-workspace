"use client"

/**
 * The live rule [REQ SC-17], today's count and, when the draft changes achievement, a small amber jump to Check, plus what the
 * student and evaluator will see [REQ SC-19, EV-03, EV-07].
 * - From 1280 px (decisions D-X29, D-X30) all of it sits in RulePreviewAside, a full-height panel beside the form, with the
 *   student and evaluator views both visible, so the preview is read, not hunted for. The footer then carries Back and the
 *   primary only.
 * - Below 1280 px it stays in the footer (02 section 4, J5): one line, and the previews open from a small popover.
 * Each fact shows in one place at a time (the footer copy is hidden exactly where the aside appears).
 */
import { TYPE } from "@/components/lab/type-scale"
import * as React from "react"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@exxatdesignux/ui/components/ui/popover"
import { StatusBadge } from "@exxatdesignux/ui/components/ui/status-badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@exxatdesignux/ui/components/ui/tabs"
import { Tip } from "@exxatdesignux/ui/components/ui/tip"
import { carriedNotes, HOW_MANY_LABEL, ruleSentence, settingNote, type Impact, type LabRule, type RecordState } from "@/lib/lab/configure"
import { StateBadge as RecordStateBadge } from "@/components/lab/status-pill"
import type { RecordStateKey } from "@/lib/v2/labels"
import { fmt } from "@/lib/v2/format"
import { skillNoun } from "@/lib/lab/terms"

const STATE_KEY: Record<RecordState, RecordStateKey> = { achieved: "achieved", "in-progress": "progress", "not-qualifying": "unqualified", "no-evidence": "none" }

/** The engine state as the one lab status pill (word, icon and tone from lib/v2/labels.ts). */
export function StateBadge({ state }: { state: RecordState }) {
  return <RecordStateBadge state={STATE_KEY[state]} />
}

/** The full rule plus the facts the sentence alone would hide (setting note, carried parts). */
export function fullRuleText(rule: LabRule): string {
  return [ruleSentence(rule), settingNote(rule), ...carriedNotes(rule)].filter(Boolean).join(" ")
}

/**
 * Static samples of what each person sees, shown only on Check and save (audit fix 2026-11-02): a muted framed surface with plain
 * text, no option circles and no empty input boxes, so nothing reads as a control. Data only, no explanation lines (D-L34).
 */
const SAMPLE = "flex cursor-default select-none flex-col gap-2 rounded-md bg-muted p-3 text-sm text-foreground"

export function StudentPreview({ skillName, rule }: { skillName: string; rule: LabRule }) {
  const fields = rule.studentFields.filter((f) => f.label.trim())
  return (
    <div className={SAMPLE} data-preview="student" data-artifact-preview>
      <p className="font-semibold">{skillName}</p>
      {rule.model ? <p>{ruleSentence(rule, "student")}</p> : null}
      {fields.length ? <p className="text-muted-foreground">{fields.map((f) => `${f.label.trim()}${f.mandatory ? " (required)" : ""}`).join(", ")}</p> : null}
      {rule.selfEvaluation ? <p className="text-muted-foreground">Own rating first</p> : null}
    </div>
  )
}

/** The evaluator sees what the program configured and nothing about how achievement is judged [REQ EV-03]: a plain list. */
export function EvaluatorPreview({ skillName, rule }: { skillName: string; rule: LabRule }) {
  const options =
    rule.model === "binary" ? rule.outcomeLabels.map((x) => x.trim()).filter(Boolean) : rule.model === "demonstration" ? rule.levels.map((x, i) => x.trim() || `Level ${i + 1}`) : []
  return (
    <div className={SAMPLE} data-preview="evaluator" data-artifact-preview role="group" aria-label="Evaluator form sample, read only">
      <p className="font-semibold">{skillName}</p>
      {options.length ? (
        <ul className="flex flex-col gap-0.5" aria-label={rule.model === "demonstration" ? "Levels" : "Outcomes"}>
          {options.map((o, i) => <li key={i}>{o}</li>)}
        </ul>
      ) : null}
      {rule.model === "question" || rule.model === "scored" ? (
        <ol className="flex flex-col gap-0.5">
          {rule.questions.slice(0, 4).map((q, i) => (
            <li key={i} className="flex justify-between gap-3">
              <span className="min-w-0 truncate">{q.trim() || `Question ${i + 1}`}</span>
              <span className="shrink-0 text-muted-foreground">{rule.model === "question" ? "Yes or No" : `1 to ${rule.scaleMax}`}</span>
            </li>
          ))}
          {rule.questions.length > 4 ? <li className="text-muted-foreground">{`and ${rule.questions.length - 4} more questions`}</li> : null}
        </ol>
      ) : null}
      <p className="text-muted-foreground">{`Feedback ${rule.feedbackRequired ? "required" : "optional"}`}</p>
    </div>
  )
}

/** Student and evaluator previews as two line tabs; used inline on Check and inside the footer popover. */
export function PreviewTabs({ skillName, rule, defaultTab = "student" }: { skillName: string; rule: LabRule; defaultTab?: "student" | "evaluator" }) {
  return (
    <Tabs defaultValue={defaultTab}>
      <TabsList variant="line" ariaLabel="Preview as">
        <TabsTrigger value="student">Student sees</TabsTrigger>
        <TabsTrigger value="evaluator">Evaluator sees</TabsTrigger>
      </TabsList>
      <TabsContent value="student" className="pt-3">
        <StudentPreview skillName={skillName} rule={rule} />
      </TabsContent>
      <TabsContent value="evaluator" className="pt-3">
        <EvaluatorPreview skillName={skillName} rule={rule} />
      </TabsContent>
    </Tabs>
  )
}

/** A small popover, not a panel: the preview is one click away and never takes a column. */
export function PreviewPopover({ skillName, rule }: { skillName: string; rule: LabRule }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button type="button" variant="link" size="sm" className="h-auto p-0">
          Preview
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" side="top" className="w-[min(24rem,calc(100vw-2rem))]">
        <PreviewTabs skillName={skillName} rule={rule} />
      </PopoverContent>
    </Popover>
  )
}

/**
 * Footer summary: the live sentence (one line, full text in a tooltip, announced politely), then today's count, the amber
 * "n students change" jump to Check, and the preview popover. Each fact appears once on the page.
 */
export function RuleFooterSummary({ skillName, rule, impact, onSeeChange, showPreview = true, showChange = true, asideWide = false }: { skillName: string; rule: LabRule; impact: Impact | null; onSeeChange?: () => void; showPreview?: boolean; showChange?: boolean; /** RulePreviewAside shows all of this from 1400 px, so the footer hides it there. */ asideWide?: boolean }) {
  const sentence = rule.model ? ruleSentence(rule) : "Choose how it's judged first."
  const changed = impact?.ruleChanged ? impact.changed.length : 0
  const loses = (impact?.lostAchieved ?? 0) > 0
  return (
    <div className={`flex min-w-0 flex-col gap-0.5 ${asideWide ? "min-[1280px]:hidden" : ""}`} data-rule-sentence>
      <Tip label={fullRuleText(rule) || sentence} side="top">
        <p tabIndex={0} className="truncate font-medium text-foreground outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]">
          {rule.model ? <span className="font-normal text-muted-foreground">{`${HOW_MANY_LABEL}: `}</span> : null}
          {sentence}
        </p>
      </Tip>
      <p className="sr-only" aria-live="polite">
        {sentence}
      </p>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-muted-foreground">
        {impact && impact.withEvidence > 0 ? <span className="tabular-nums">{`Today ${fmt(impact.before.achieved)} of ${fmt(impact.students)} achieved`}</span> : null}
        {showChange && changed > 0 ? (
          onSeeChange ? (
            <Button type="button" variant="ghost" size="xs" className="h-auto p-0" onClick={onSeeChange} aria-label={`${changed} students change status. Open Check.`}>
              <StatusBadge label={`${changed} ${changed === 1 ? "student changes" : "students change"}`} tone={loses ? "warning" : "neutral"} icon={loses ? "fa-triangle-exclamation" : "fa-circle-info"} size="sm" />
            </Button>
          ) : (
            <StatusBadge label={`${changed} ${changed === 1 ? "student changes" : "students change"}`} tone={loses ? "warning" : "neutral"} icon={loses ? "fa-triangle-exclamation" : "fa-circle-info"} size="sm" />
          )
        ) : null}
        {showPreview && rule.model ? <PreviewPopover skillName={skillName} rule={rule} /> : null}
      </div>
    </div>
  )
}

/**
 * The preview column (decision D-X29), shown from 1400 px beside a configure form: the live rule in full (never truncated),
 * today's count with the change jump, and what the student and evaluator will see, read only. Sticky, so it stays beside the
 * field being edited.
 */
export function RulePreviewAside({ skillName, rule, impact, onSeeChange, showRule = true, showPreviews = true, current }: {
  skillName: string
  rule: LabRule
  impact: Impact | null
  /** The rule students see today (null: not configured). Shown as "Today" while the draft differs or nothing is chosen yet. */
  current?: LabRule | null
  onSeeChange?: () => void
  /** False where the rule sentence is already the page (Configure C builds it inline). */
  showRule?: boolean
  /** False while the page's own Check section (with the same previews) is in view. */
  showPreviews?: boolean
}) {
  const sentence = rule.model ? ruleSentence(rule) : "Choose how it's judged first."
  const extra = [settingNote(rule), ...carriedNotes(rule)].filter(Boolean).join(" ")
  const changed = impact?.ruleChanged ? impact.changed.length : 0
  const loses = (impact?.lostAchieved ?? 0) > 0
  const id = React.useId()
  return (
    <aside aria-labelledby={`${id}-h`} className="flex flex-col gap-4" data-rule-preview>
      <h2 id={`${id}-h`} className={TYPE.section}>Preview</h2>
      {(showRule && !showPreviews) || changed > 0 ? (
      <div className="flex flex-col gap-1">
        {/* Say it once (Romit 2026-10-27, "too many text"): when the student card below shows the rule and the setting note,
            the panel does not repeat them above it; limits kept from the earlier rule are listed in Check and save. */}
        {showRule && !showPreviews ? (
          <>
            <p className="text-sm text-foreground">
              {rule.model ? <span className="text-muted-foreground">{`${HOW_MANY_LABEL}: `}</span> : null}
              {sentence}
            </p>
            {extra ? <p className="text-sm text-muted-foreground">{extra}</p> : null}
          </>
        ) : null}
        {/* Romit 2026-10-28: the preview shows only what people see. The "Today n of N achieved" figure and the attempts
            example are gone from here ("What this means" on the count step explains the example); the change badge stays,
            and appears only when a rule change moves students. */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
          {changed > 0 ? (
            onSeeChange ? (
              <Button type="button" variant="ghost" size="xs" className="h-auto p-0" onClick={onSeeChange} aria-label={`${changed} students change status. Open Check.`}>
                <StatusBadge label={`${changed} ${changed === 1 ? "student changes" : "students change"}`} tone={loses ? "warning" : "neutral"} icon={loses ? "fa-triangle-exclamation" : "fa-circle-info"} size="sm" />
              </Button>
            ) : (
              <StatusBadge label={`${changed} ${changed === 1 ? "student changes" : "students change"}`} tone={loses ? "warning" : "neutral"} icon={loses ? "fa-triangle-exclamation" : "fa-circle-info"} size="sm" />
            )
          ) : null}
        </div>
      </div>
      ) : null}
      {/* Today's rule (2026-10-30 review: the column held one sentence on step 1). Shown before a choice is made, and while the
          draft differs from what students see today, so the admin always reads the starting point beside the change. */}
      {current !== undefined && (!rule.model || impact?.ruleChanged) ? (
        <div className="flex flex-col gap-1" data-preview-today>
          <h3 className={TYPE.label}>Today</h3>
          <p className={TYPE.helper}>{current?.model ? fullRuleText(current) : `Not configured. Students cannot ask for sign-off on this ${skillNoun()} yet, and it cannot be mapped to a course.`}</p>
        </div>
      ) : null}
      {/* Both views at once (D-X30): the panel has the room, so no tabs to switch between. Shown before a model is chosen too,
          as the stub each person will see, so the column never sits empty. */}
      {showPreviews ? (
        <div className="flex flex-col gap-3">
          <section aria-labelledby={`${id}-s`} className="flex flex-col gap-2">
            <h3 id={`${id}-s`} className={TYPE.label}>Student sees</h3>
            <StudentPreview skillName={skillName} rule={rule} />
          </section>
          <section aria-labelledby={`${id}-e`} className="flex flex-col gap-2">
            <h3 id={`${id}-e`} className={TYPE.label}>Evaluator sees</h3>
            <EvaluatorPreview skillName={skillName} rule={rule} />
          </section>
        </div>
      ) : null}
      {/* Without a model the rule line above already says "Choose how it's judged first."; nothing else to add. */}
    </aside>
  )
}
