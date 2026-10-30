"use client"

/**
 * Small reviewer pieces. State is always glyph + word + colour: hold reasons are neutral (the cause, not a judgement), aging 8+ days
 * and shortfall are the one amber accent, nothing is red.
 */
import * as React from "react"
import { LabLink as Link } from "@/components/lab/lab-bar/lab-link"
import { StatusBadge } from "@exxatdesignux/ui"
import { Skeleton } from "@exxatdesignux/ui/components/ui/skeleton"
import { Tip } from "@exxatdesignux/ui/components/ui/tip"
import { AGING_DAYS, CHECKOFF_METHOD, REASON_META, daysLabel, plural, type HoldReason, type QueueSummary, type RecordSkill, type RecordStatus } from "@/lib/lab/reviewer"

import { EVALUATION_STATUS_LABEL, SENT_BACK_LABEL, SENT_FOR_NEW_EVALUATION_WORD, type RecordStateKey } from "@/lib/v2/labels"
import { TYPE } from "@/components/lab/type-scale"
import { fmt } from "@/lib/v2/format"
import { LINK as LINK_STANDALONE, LINK_IN_TABLE } from "@/components/lab/link-styles"
import { OutcomeBadge, OverlayBadge, StateBadge } from "@/components/lab/status-pill"

/** One link treatment for the lab (components/lab/link-styles.ts); the old names stay so importers keep working. */
export const LINK = LINK_IN_TABLE
/** A link that stands alone in text (not inside a table cell): always underlined. */
export const LINK_U = LINK_STANDALONE
export { initialsOf } from "@/lib/v2/format"

/**
 * Why a row is in Approvals: a small glyph and the reason in plain words ("Approval required for Foley catheter insertion",
 * "R. Ortiz is not on your evaluator list"). Not a chip: the words carry the meaning, so they are sentence text, one line,
 * truncated with the full line as a title (Romit 2026-10-27).
 */
export function ReasonBadge({ row, wrap = false }: { row: { reason: HoldReason; why: string }; wrap?: boolean }) {
  const m = REASON_META[row.reason]
  return (
    <span className={`inline-flex min-w-0 max-w-full items-baseline gap-1.5 ${TYPE.body}`} data-reason={row.reason} title={wrap ? undefined : row.why}>
      <i className={`fa-light ${m.icon} shrink-0 text-xs text-muted-foreground`} aria-hidden="true" />
      <span className={wrap ? "min-w-0" : "min-w-0 truncate"}>{row.why}</span>
    </span>
  )
}

/**
 * The cause as a short chip ("Approval required", "Evaluator not assigned"), only where a list mixes causes under one heading (the
 * board's Aging column) and the skill and evaluator lines beside it already say which skill or person.
 */
export function ReasonChip({ reason }: { reason: HoldReason }) {
  const m = REASON_META[reason]
  return <StatusBadge label={m.label} tone="neutral" icon={m.icon} size="sm" />
}

/** A held group check-off, labelled the same in every list, board and review: glyph + word, neutral (a channel, not a judgement). */
export function CheckoffTag() {
  return (
    <span className="self-start" data-checkoff-tag>
      <StatusBadge label={CHECKOFF_METHOD} tone="neutral" icon="fa-users" size="sm" />
    </span>
  )
}

/**
 * Staff word for an evaluator name a student typed that the program has not adopted yet: "Not verified", the same badge Settings,
 * Evaluators shows (glossary, ledger D-L24). One phrase for the state on every staff screen (design review 2026-10-30, others #3);
 * the student's own screens keep "Not yet recorded".
 */
export const NOT_YET_RECORDED = "Not verified"

/**
 * The evaluator as a row shows it. For "Evaluator not assigned" the name is the one the student typed, so it carries a small
 * "Not verified" badge: the name and the cause no longer read as a contradiction.
 */
export function EvaluatorName({ name, role, unrecorded, compact = false }: { name: string; role?: string; unrecorded: boolean; compact?: boolean }) {
  return (
    <span className="flex min-w-0 flex-col items-start gap-0.5 py-0.5" data-evaluator-unrecorded={unrecorded || undefined}>
      <span className={`max-w-full whitespace-normal break-words ${compact ? "text-xs text-muted-foreground" : "text-sm"}`}>{name}</span>
      {unrecorded ? <StatusBadge label={NOT_YET_RECORDED} tone="neutral" icon="fa-user-plus" size="sm" /> : role ? <span className="max-w-full whitespace-normal break-words text-xs text-muted-foreground">{role}</span> : null}
    </span>
  )
}

/** Days waiting. Amber with a clock from 8 days (the aging threshold); plain text below it. */
export function AgeBadge({ days }: { days: number }) {
  if (days >= AGING_DAYS) return <StatusBadge label={daysLabel(days)} tone="warning" icon="fa-clock" size="sm" />
  return <span className="text-sm tabular-nums text-muted-foreground">{daysLabel(days)}</span>
}

/**
 * The waiting-age scale, the same four bands as the dashboard's aging stacks (0 to 3, 4 to 7, 8 to 14, 15+ days). The glyph
 * steps up with the band so a column of ages reads as a scale, not as on or off (design review 2026-10-30, others #3).
 */
export const AGE_BANDS = [
  { min: 15, word: "waiting 15+ days" },
  { min: AGING_DAYS, word: `waiting ${AGING_DAYS} to 14 days` },
  { min: 4, word: "waiting 4 to 7 days" },
  { min: 0, word: "waiting 0 to 3 days" },
] as const
export const ageBand = (days: number) => AGE_BANDS.find((b) => days >= b.min)!

/** The age glyph: none under 4 days, an outline clock from 4, a solid amber clock from 8 (from 15 the number is also set bold). */
export function AgeGlyph({ days }: { days: number }) {
  if (days < 4) return <span className="inline-block w-3" aria-hidden="true" />
  if (days < AGING_DAYS) return <i className="fa-light fa-clock w-3 text-xs text-muted-foreground" aria-hidden="true" />
  if (days < 15) return <i className="fa-solid fa-clock w-3 text-xs" style={{ color: "var(--lab-viz-behind-ink)" }} aria-hidden="true" />
  return <i className="fa-solid fa-clock w-3 text-xs" style={{ color: "var(--lab-viz-behind-ink)" }} aria-hidden="true" />
}

/** Days waiting in a dense list: the stepped glyph, then the number; ink from 8 days, semibold from 15. No filled chip, so a long
 * aging tail does not turn the table amber. The band is in the accessible name. */
export function AgeText({ days }: { days: number }) {
  const tone = days >= 15 ? "font-semibold text-foreground" : days >= AGING_DAYS ? "font-medium text-foreground" : "text-muted-foreground"
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap text-sm tabular-nums ${tone}`} aria-label={`${daysLabel(days)}, ${ageBand(days).word}`} data-age-band={ageBand(days).min}>
      <AgeGlyph days={days} />
      {daysLabel(days)}
    </span>
  )
}

/** One evaluation's status: the canonical outcome or overlay pill (components/lab/status-pill.tsx), never a local map. */
export function RecordStatusBadge({ status }: { status: RecordStatus }) {
  if (status === "Unmet") return <OutcomeBadge outcome="not-met" />
  if (status === "Not yet") return <OutcomeBadge outcome="not-yet" />
  if (status === "Awaiting approval") return <OverlayBadge overlay="awaitingApproval" />
  // Staff read the reviewer's decision in its own words (Romit 2026-10-27); the student keeps "Returned to you".
  if (status === "Returned") return <StatusBadge label={SENT_BACK_LABEL} tone="warning" icon="fa-arrow-rotate-left" size="sm" />
  // Assigned to another evaluator by a reviewer: a neutral handoff, not a return.
  if (status === SENT_FOR_NEW_EVALUATION_WORD) return <StatusBadge label={status} tone="neutral" icon="fa-paper-plane" size="sm" />
  if (status === "Counted") return <StatusBadge label={EVALUATION_STATUS_LABEL.counted} tone="neutral" icon="fa-circle-check" size="sm" />
  return <StatusBadge label={status} tone="neutral" icon="fa-pen-to-square" size="sm" />
}

const SKILL_STATE_KEY: Record<RecordSkill["state"], RecordStateKey> = {
  Achieved: "achieved",
  "In progress": "progress",
  "Evidence does not qualify": "unqualified",
  "No evidence yet": "none",
}

/** A skill record's engine state: the canonical StateBadge (word, icon and tone from lib/v2/labels.ts). */
export function SkillStateBadge({ state }: { state: RecordSkill["state"] }) {
  return <StateBadge state={SKILL_STATE_KEY[state]} />
}

/** Agreement marker for one compared answer: equals or not-equals glyph plus the word. Text carries it, not colour. */
export function AgreementMark({ agreement }: { agreement: "agreed" | "differed" | "not-comparable" }) {
  if (agreement === "not-comparable") return <span className="text-xs text-muted-foreground">Not compared</span>
  const differ = agreement === "differed"
  return (
    <span className={differ ? "inline-flex items-center gap-1 text-sm font-semibold text-foreground" : "inline-flex items-center gap-1 text-sm text-muted-foreground"}>
      <i className={`fa-solid ${differ ? "fa-not-equal" : "fa-equals"}`} aria-hidden="true" />
      {differ ? "Differs" : "Agrees"}
    </span>
  )
}

/**
 * The queue's figures above the table: oldest, median wait, aging 8+ days. Three figures in the one KPI size (TYPE.figure), labels
 * muted, no card or border, so the table under them stays the focal point (design review 2026-10-30, others #3). The queue count
 * itself is said once, by the Approvals nav badge (or the tab count on admin Approvals), not again here.
 */
export function SummaryLine({ summary, oldestHref, agingHref }: { summary: QueueSummary; oldestHref?: string; agingHref?: string }) {
  return (
    <dl className="flex flex-wrap items-end gap-x-10 gap-y-3" data-region="summary">
      <div className="flex flex-col-reverse gap-1" data-figure>
        <dt className={TYPE.meta}>Oldest waiting</dt>
        <dd className={TYPE.figure}>
          {oldestHref ? <Link className={`${LINK} font-semibold`} href={oldestHref}>{daysLabel(summary.oldestDays)}</Link> : daysLabel(summary.oldestDays)}
        </dd>
      </div>
      <div className="flex flex-col-reverse gap-1" data-figure>
        <dt className={`${TYPE.meta} inline-flex items-center gap-1`}>
          Median wait
          <Tip label="Median days the submissions in this scope have waited. No approvals are recorded yet, so turnaround is measured on what is waiting.">
            <i className="fa-light fa-circle-info text-xs" aria-hidden="true" />
          </Tip>
        </dt>
        <dd className={TYPE.figure}>{daysLabel(summary.medianDays)}</dd>
      </div>
      <div className="flex flex-col-reverse gap-1" data-figure>
        <dt className={`${TYPE.meta} inline-flex items-center gap-1`}>
          <AgeGlyph days={AGING_DAYS} />
          {`Waiting ${AGING_DAYS}+ days`}
        </dt>
        <dd className={TYPE.figure}>{agingHref ? <Link className={`${LINK} font-semibold`} href={agingHref}>{fmt(summary.aging)}</Link> : fmt(summary.aging)}</dd>
      </div>
    </dl>
  )
}

export function QueueSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <div role="status" aria-busy="true" aria-label="Loading approvals" className="flex flex-col gap-2" data-loading>
      <span className="sr-only">Loading approvals</span>
      <Skeleton aria-hidden="true" className="h-5 w-80" />
      {Array.from({ length: rows }, (_, i) => (
        <Skeleton key={i} aria-hidden="true" className="h-12 w-full" />
      ))}
    </div>
  )
}

export function FactList({ facts }: { facts: Array<[string, React.ReactNode]> }) {
  return (
    <dl className="grid grid-cols-[minmax(6rem,auto)_1fr] gap-x-4 gap-y-1.5 text-sm">
      {facts.map(([k, v]) => (
        <React.Fragment key={k}>
          <dt className="text-muted-foreground">{k}</dt>
          <dd className="min-w-0 text-foreground">{v}</dd>
        </React.Fragment>
      ))}
    </dl>
  )
}
