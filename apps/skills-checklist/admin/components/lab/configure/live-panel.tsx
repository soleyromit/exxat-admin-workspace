"use client"

/**
 * The live rule, in the footer instead of a third column (02 section 4, J5): one line with the rule sentence [REQ SC-17], then
 * today's count and, when the draft changes achievement, a small amber jump to Check. What the student and evaluator will see
 * [REQ SC-19, EV-03, EV-07] opens from a small popover, so it never competes with the form.
 */
import * as React from "react"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import { Label } from "@exxatdesignux/ui/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@exxatdesignux/ui/components/ui/popover"
import { RadioGroup, RadioGroupItem } from "@exxatdesignux/ui/components/ui/radio-group"
import { StatusBadge } from "@exxatdesignux/ui/components/ui/status-badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@exxatdesignux/ui/components/ui/tabs"
import { Textarea } from "@exxatdesignux/ui/components/ui/textarea"
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
    <div className="flex flex-col gap-3 rounded-md border border-border p-3" data-preview="student">
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

/** The evaluator sees what the program configured and nothing about how achievement is judged [REQ EV-03]. */
export function EvaluatorPreview({ skillName, rule }: { skillName: string; rule: LabRule }) {
  const uid = React.useId()
  const name = (base: string) => `prev-${uid}-${base}`
  return (
    <div className="flex flex-col gap-3 rounded-md border border-border p-3" data-preview="evaluator" aria-label="Evaluator form preview, read only">
      <p className="text-sm font-semibold text-foreground">{skillName}</p>
      {rule.model === "binary" ? (
        <RadioGroup disabled aria-label="Outcome" className="flex flex-wrap gap-4">
          {[0, 1].map((i) => (
            <div key={i} className="flex items-center gap-2">
              <RadioGroupItem id={name(`o${i}`)} value={String(i)} />
              <Label htmlFor={name(`o${i}`)}>{rule.outcomeLabels[i] || "Outcome"}</Label>
            </div>
          ))}
        </RadioGroup>
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
        <RadioGroup disabled aria-label="Level" className="flex flex-col gap-1.5">
          {rule.levels.map((l, i) => (
            <div key={i} className="flex items-center gap-2">
              <RadioGroupItem id={name(`l${i}`)} value={String(i)} />
              <Label htmlFor={name(`l${i}`)}>{l.trim() || `Level ${i + 1}`}</Label>
            </div>
          ))}
        </RadioGroup>
      ) : null}
      {!rule.model ? <p className="text-sm text-muted-foreground">The form appears once you choose how it's judged.</p> : null}
      <div className="flex flex-col gap-1">
        <Label htmlFor={name("fb")}>{`Feedback${rule.feedbackRequired ? " (required)" : " (optional)"}`}</Label>
        <Textarea id={name("fb")} disabled rows={2} />
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
export function RuleFooterSummary({ skillName, rule, impact, onSeeChange, showPreview = true, showChange = true }: { skillName: string; rule: LabRule; impact: Impact | null; onSeeChange?: () => void; showPreview?: boolean; showChange?: boolean }) {
  const sentence = rule.model ? ruleSentence(rule) : "Choose how it's judged first."
  const changed = impact?.ruleChanged ? impact.changed.length : 0
  const loses = (impact?.lostAchieved ?? 0) > 0
  return (
    <div className="flex min-w-0 flex-col gap-0.5" data-rule-sentence>
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
