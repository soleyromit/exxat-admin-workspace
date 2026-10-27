"use client"

/**
 * The rule as one editable sentence (variant C, Approved or not): "Get [3] evaluations rated [Met]". Questions, scored and levels
 * use the shared RuleSection instead: their "what counts" choice does not read as a clause. Each bracket is a DS control with its own
 * label for screen readers. Body size, DS control heights, narrow number boxes (Romit 2026-10-27: the sentence must not be larger
 * than the labels around it). Optional conditions (setting, level, different evaluators) are not clauses here: they are rows in
 * RuleConditions, each with one Remove, added from one "Add a condition" menu.
 */
import * as React from "react"
import { FieldError } from "@exxatdesignux/ui/components/ui/field"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@exxatdesignux/ui/components/ui/select"
import type { LabRule, RuleIssue } from "@/lib/lab/configure"
import { RuleConditions, RuleNumber as Num } from "./rule-conditions"

export function SentenceBuilder({ rule, setRule, issues, showErrors, settings }: { rule: LabRule; setRule: (fn: (r: LabRule) => LabRule) => void; issues: RuleIssue[]; showErrors: boolean; settings: string[] }) {
  const bad = (field: string) => showErrors && issues.some((i) => i.field === field)
  const ruleIssues = showErrors ? issues.filter((i) => ["cfg-need", "cfg-qualifying"].includes(i.field)) : []
  const T = ({ children }: { children: React.ReactNode }) => <span className="text-foreground">{children}</span>

  return (
    <div className="flex flex-col gap-4">
      <div role="group" aria-label="Achievement rule" className="flex flex-wrap items-center gap-2 text-sm" data-sentence-builder>
        <T>Get</T>
        <Num id="cfg-need" label="How many times: evaluations that count, needed" value={rule.need} error={bad("cfg-need")} onChange={(n) => setRule((r) => ({ ...r, need: n }))} />
        <T>{rule.need === 1 ? "evaluation" : "evaluations"}</T>

        {rule.model === "binary" ? (
          <>
            <T>rated</T>
            <Select value={rule.qualifyingLabel === null ? "" : String(rule.qualifyingLabel)} onValueChange={(v) => setRule((r) => ({ ...r, qualifyingLabel: v === "1" ? 1 : 0 }))}>
              <SelectTrigger id="cfg-qualifying" className="w-40" aria-label="Outcome that qualifies" aria-invalid={bad("cfg-qualifying") || undefined}><SelectValue placeholder="Choose an outcome" /></SelectTrigger>
              <SelectContent>
                {[0, 1].map((i) => <SelectItem key={i} value={String(i)} disabled={!rule.outcomeLabels[i].trim()}>{rule.outcomeLabels[i].trim() || `Outcome ${i + 1}`}</SelectItem>)}
              </SelectContent>
            </Select>
          </>
        ) : null}

      </div>

      <RuleConditions rule={rule} setRule={setRule} issues={issues} showErrors={showErrors} settings={settings} />

      {ruleIssues.length ? (
        <ul className="flex flex-col gap-1" aria-label="Problems in the rule">
          {ruleIssues.map((i) => <li key={i.id}><FieldError>{i.message}</FieldError></li>)}
        </ul>
      ) : null}
    </div>
  )
}
