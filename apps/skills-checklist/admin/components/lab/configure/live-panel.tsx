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
import * as React from "react"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@exxatdesignux/ui/components/ui/popover"
import { StatusBadge } from "@exxatdesignux/ui/components/ui/status-badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@exxatdesignux/ui/components/ui/tabs"
import { Tip } from "@exxatdesignux/ui/components/ui/tip"
import { afterSubmitLine, carriedNotes, HOW_MANY_LABEL, ruleSentence, settingNote, type Impact, type LabRule, type RecordState } from "@/lib/lab/configure"
import { StateBadge as RecordStateBadge } from "@/components/lab/status-pill"
import type { RecordStateKey } from "@/lib/v2/labels"
import { fmt } from "@/lib/v2/format"

const STATE_KEY: Record<RecordState, RecordStateKey> = { achieved: "achieved", "in-progress": "progress", "not-qualifying": "unqualified", "no-evidence": "none" }

/** The engine state as the one lab status pill (word, icon and tone from lib/v2/labels.ts). */
export function StateBadge({ state }: { state: RecordState }) {
  return <RecordStateBadge state={STATE_KEY[state]} />
}

/** The full rule plus the facts the sentence alone would hide (setting note, carried parts). */
export function fullRuleText(rule: LabRule): string {
  return [ruleSentence(rule), settingNote(rule), ...carriedNotes(rule)].filter(Boolean).join(" ")
}

export function StudentPreview({ skillName, rule }: { skillName: string; rule: LabRule }) {
  const fields = rule.studentFields.filter((f) => f.label.trim())
  return (
    <div className="flex flex-col gap-3 rounded-md border border-border p-3" data-preview="student" data-artifact-preview>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-semibold text-foreground">{skillName}</p>
        <StateBadge state="no-evidence" />
      </div>
      <p className="text-sm text-foreground">{rule.model ? ruleSentence(rule, "student") : "Not open yet."}</p>
      {settingNote(rule) ? <p className="text-sm text-muted-foreground">{settingNote(rule)}</p> : null}
      {fields.length || rule.selfEvaluation ? (
        <div className="flex flex-col gap-1">
          <p className="text-sm font-medium text-foreground">When you send it</p>
          <ul className="flex flex-col gap-0.5 text-sm text-muted-foreground">
            {fields.map((f, i) => (
              <li key={i}>{`${f.label.trim()}${f.mandatory ? " (required)" : ""}`}</li>
            ))}
            {rule.selfEvaluation ? <li>Your own rating first</li> : null}
          </ul>
        </div>
      ) : null}
    </div>
  )
}

/**
 * The evaluator sees what the program configured and nothing about how achievement is judged [REQ EV-03].
 * A picture of the form, not a disabled copy of it (D-X30): option glyphs and an empty feedback box, so the preview never
 * reads as dead controls and nothing in it can take focus.
 */
export function EvaluatorPreview({ skillName, rule }: { skillName: string; rule: LabRule }) {
  const option = (label: string, key: string) => (
    <li key={key} className="flex items-center gap-2 text-sm text-foreground">
      <i className="fa-light fa-circle text-xs text-muted-foreground" aria-hidden="true" />
      {label}
    </li>
  )
  return (
    <div className="flex flex-col gap-3 rounded-md border border-border p-3" data-preview="evaluator" data-artifact-preview role="group" aria-label="Evaluator form preview, read only">
      <p className="text-sm font-semibold text-foreground">{skillName}</p>
      {rule.model === "binary" ? (
        <ul className="flex flex-wrap gap-4" aria-label="Outcome">{[0, 1].map((i) => option(rule.outcomeLabels[i] || "Outcome", `o${i}`))}</ul>
      ) : null}
      {rule.model === "question" || rule.model === "scored" ? (
        <ol className="flex flex-col gap-1 text-sm text-foreground">
          {rule.questions.slice(0, 4).map((q, i) => (
            <li key={i} className="flex justify-between gap-3">
              <span className="min-w-0 truncate">{q.trim() || `Question ${i + 1}`}</span>
              <span className="shrink-0 text-muted-foreground">{rule.model === "question" ? "Yes or No" : `1 to ${rule.scaleMax}`}</span>
            </li>
          ))}
          {rule.questions.length > 4 ? <li className="text-muted-foreground">{`and ${rule.questions.length - 4} more questions`}</li> : null}
        </ol>
      ) : null}
      {rule.model === "demonstration" ? (
        <ul className="flex flex-col gap-1.5" aria-label="Level">{rule.levels.map((l, i) => option(l.trim() || `Level ${i + 1}`, `l${i}`))}</ul>
      ) : null}
      {!rule.model ? <p className="text-sm text-muted-foreground">The form appears once you choose how it&apos;s judged.</p> : null}
      <div className="flex flex-col gap-1">
        <p className="text-sm font-medium text-foreground">{`Feedback${rule.feedbackRequired ? " (required)" : " (optional)"}`}</p>
        <div className="h-14 rounded-md border border-border" aria-hidden="true" />
      </div>
      <p className="text-sm text-muted-foreground">{afterSubmitLine(rule)}</p>
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
export function RulePreviewAside({ skillName, rule, impact, onSeeChange, showRule = true, showPreviews = true }: {
  skillName: string
  rule: LabRule
  impact: Impact | null
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
      <h2 id={`${id}-h`} className="text-sm font-semibold text-foreground">Preview</h2>
      <div className="flex flex-col gap-1">
        {showRule ? (
          <>
            <p className="text-sm text-foreground">
              {rule.model ? <span className="text-muted-foreground">{`${HOW_MANY_LABEL}: `}</span> : null}
              {sentence}
            </p>
            {extra ? <p className="text-sm text-muted-foreground">{extra}</p> : null}
          </>
        ) : null}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
          {impact && impact.withEvidence > 0 ? <span className="tabular-nums">{`Today ${fmt(impact.before.achieved)} of ${fmt(impact.students)} achieved`}</span> : null}
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
      {/* Both views at once (D-X30): the panel has the room, so no tabs to switch between. */}
      {rule.model && showPreviews ? (
        <div className="flex flex-col gap-3">
          <section aria-labelledby={`${id}-s`} className="flex flex-col gap-2">
            <h3 id={`${id}-s`} className="text-sm font-medium text-foreground">Student sees</h3>
            <StudentPreview skillName={skillName} rule={rule} />
          </section>
          <section aria-labelledby={`${id}-e`} className="flex flex-col gap-2">
            <h3 id={`${id}-e`} className="text-sm font-medium text-foreground">Evaluator sees</h3>
            <EvaluatorPreview skillName={skillName} rule={rule} />
          </section>
        </div>
      ) : null}
      {!rule.model ? <p className="text-sm text-muted-foreground">What students and evaluators see appears once you choose how it&apos;s judged.</p> : null}
    </aside>
  )
}
