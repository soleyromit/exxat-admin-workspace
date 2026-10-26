"use client"

import * as React from "react"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@exxatdesignux/ui/components/ui/collapsible"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import { StatusPill } from "@/components/v2/status-pill"
import { PILL_KINDS } from "@/lib/v2/status-pill"
import { OUTCOME_WORD } from "@/lib/v2/outcomes"
import type { Evaluation, EvaluationVersion, Outcome, Skill, V2State } from "@/lib/v2/types"

/** Tone and icon per outcome, from the one pill table (kept as an export for importers). */
export const OUTCOME_TONE: Record<Outcome, { tone: "success" | "info" | "warning" | "neutral"; icon: string }> = PILL_KINDS.outcome

export const fmtDay = (iso: string) => new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" })

/** What one version recorded, in words. A short line when only the outcome was stored (the seeded history). */
function Recorded({ skill, v }: { skill: Skill | undefined; v: EvaluationVersion }) {
  const d = v.detail
  if (!d) return <p className="text-sm text-muted-foreground">Only the outcome was recorded for this version.</p>
  const c = skill?.config
  return (
    <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm" data-version-detail>
      {d.answers && c ? (
        <>
          <dt className="text-muted-foreground">Answers</dt>
          <dd>
            <ul>
              {c.questions.map((q, i) => (
                <li key={i}>{`${q}: ${d.answers?.[i] === "yes" ? "Yes" : d.answers?.[i] === "no" ? "No" : "Not answered"}`}</li>
              ))}
            </ul>
          </dd>
        </>
      ) : null}
      {d.scores && c ? (
        <>
          <dt className="text-muted-foreground">Scores</dt>
          <dd>
            <ul>
              {c.questions.map((q, i) => (
                <li key={i}>{`${q}: ${d.scores?.[i] ?? "Not scored"}`}</li>
              ))}
            </ul>
          </dd>
        </>
      ) : null}
      {d.levelIndex !== undefined && d.levelIndex !== null && c ? (
        <>
          <dt className="text-muted-foreground">Level</dt>
          <dd>{c.levels[d.levelIndex] ?? "Level removed from the skill"}</dd>
        </>
      ) : null}
      <dt className="text-muted-foreground">Feedback</dt>
      <dd>{d.feedback || "No feedback written"}</dd>
      {d.attested ? (
        <>
          <dt className="text-muted-foreground">Attestation</dt>
          <dd>{`${d.attested.text} (${fmtDay(d.attested.at)})`}</dd>
        </>
      ) : null}
    </dl>
  )
}

/**
 * Version-history timeline (new-components-needed.md item 8): newest first, who, when, why, and what each version recorded.
 * Every version is read-only. Composed from Collapsible, StatusBadge and a semantic ordered list.
 */
export function VersionTimeline({ s, e }: { s: V2State; e: Evaluation }) {
  const skill = s.skills.find((k) => k.id === e.skillId)
  const name = (id: string) => s.people.find((p) => p.id === id)?.name ?? "Unknown person"
  const versions = e.versions.slice().reverse()
  const [openV, setOpenV] = React.useState<number | null>(e.currentVersion)
  return (
    <ol className="flex flex-col gap-3" aria-label="Versions, newest first" data-timeline>
      {versions.map((v) => {
        const current = v.version === e.currentVersion
        const open = openV === v.version
        return (
          <li key={v.version} className="flex flex-col gap-2 rounded-lg border border-border bg-card p-3" data-version={v.version}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-sm font-semibold text-foreground">{`Version ${v.version}${current ? ", current" : ""}`}</h3>
              <StatusPill kind="outcome" value={v.outcome} label={v.outcome === "not-met" ? "Did not meet the criteria" : OUTCOME_WORD[v.outcome]} />
            </div>
            <p className="text-sm text-foreground">{`${fmtDay(v.at)}, by ${name(v.by)}.`}</p>
            <p className="text-sm text-muted-foreground">{v.reason ? `Why: ${v.reason}` : "First version, as the evaluator submitted it."}</p>
            {!current ? <p className="text-xs text-muted-foreground">Earlier version, kept exactly as it was.</p> : null}
            <Collapsible open={open} onOpenChange={(o) => setOpenV(o ? v.version : null)}>
              <CollapsibleTrigger asChild>
                <Button type="button" variant="outline" size="sm" className="min-h-(--control-height-touch) h-auto" aria-expanded={open}>
                  {open ? `Hide what version ${v.version} recorded` : `See what version ${v.version} recorded`}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="pt-3">
                <Recorded skill={skill} v={v} />
              </CollapsibleContent>
            </Collapsible>
          </li>
        )
      })}
    </ol>
  )
}
