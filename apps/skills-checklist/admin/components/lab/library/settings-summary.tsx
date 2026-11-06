"use client"

/**
 * What the Evaluation settings actually say, in one short card, wherever a skill meets them: adding a skill, a skill's panel,
 * and step 2 of a new list. It states the rule and three facts rather than naming where they live. The full page edits them.
 */
import * as React from "react"
import { LAB_MODEL_LABEL, ruleSaysWhatCounts, studentNeedsSentence, type LabRule } from "@/lib/lab/configure"
import { ruleNeedsQuestions, type Configuration } from "@/lib/lab/program-settings"
import { plural } from "@/lib/v2/format"
import { SectionTitle } from "@/components/lab/first-run"
import { TYPE } from "@/components/lab/type-scale"
import { ConfigurationBadge } from "./library-chrome"

export function SettingsSummary({ rule, word, action, emptyText, id = "settings-summary" }: { rule: LabRule | null; /** Left out where the skill does not exist yet. */ word?: Configuration; /** The way to the full page. */ action?: React.ReactNode; /** Said when the program has no settings. */ emptyText: string; id?: string }) {
  const known = rule?.model ? rule : null
  const needOk = !!known && Number.isInteger(known.need) && known.need >= 1
  const sentence = !known || !needOk ? null : ruleNeedsQuestions(known) ? `Student needs ${plural(known.need, "evaluation", "evaluations")}.` : ruleSaysWhatCounts(known) ? studentNeedsSentence(known) : null
  return (
    <section className="flex flex-col gap-3 rounded-[var(--radius)] border border-border p-3" aria-labelledby={id} data-settings-summary>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="flex min-w-0 flex-wrap items-center gap-2 text-sm">
          <SectionTitle icon="fa-sliders" id={id} className={TYPE.group}>Evaluation settings</SectionTitle>
          {word ? <ConfigurationBadge value={word} /> : null}
        </span>
        {action}
      </div>
      {known ? (
        <>
          {sentence ? <p className={TYPE.label} data-rule-sentence>{sentence}</p> : null}
          <dl className="grid grid-cols-[8.5rem_minmax(0,1fr)] gap-x-3 gap-y-1 text-sm">
            <dt className="text-muted-foreground">Evaluation model</dt>
            <dd>{LAB_MODEL_LABEL[known.model!]}</dd>
            <dt className="text-muted-foreground">Admin approval</dt>
            <dd>{known.approvalRequired ? "Required" : "Not required"}</dd>
            <dt className="text-muted-foreground">Self-evaluation</dt>
            <dd>{known.selfEvaluation ? "On" : "Off"}</dd>
          </dl>
        </>
      ) : <p className="text-sm text-muted-foreground">{emptyText}</p>}
    </section>
  )
}
