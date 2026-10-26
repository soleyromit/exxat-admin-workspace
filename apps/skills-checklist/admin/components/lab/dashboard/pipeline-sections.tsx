"use client"

/**
 * Concept C, journey pipeline: the four engine states as one stage strip (KeyMetrics, each with its 8-week movement line)
 * and one row per section with a compact state bar (dashboard-concepts README section 4 C).
 *
 * Open question for Romit (README section 6 question 4): are 100% stacked state bars per section the progress bars the brief
 * bans? Default here: they are drawn as a state pipeline, never as a share of one goal, with every count printed beside the
 * bar and every count a link, so the table carries the data with or without the bar. Remove the bar column and the
 * page still answers its question.
 *
 * Encoding: graded neutrals by state (achieved darkest), waiting as a hatched overlay inside the segment (never a state),
 * the basis as a 2 px tick, amber only on a section 8 or more points under the tick (diamond + word in the label).
 */
import * as React from "react"
import { LabLink as Link } from "@/components/lab/lab-bar/lab-link"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import { Card, CardContent } from "@exxatdesignux/ui/components/ui/card"
import { LabKeyMetrics as KeyMetrics, type MetricItem } from "@/components/lab/lab-bar/lab-key-metrics"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@exxatdesignux/ui/components/ui/table"
import { Tip } from "@exxatdesignux/ui/components/ui/tip"
import { DiamondGlyph, VIZ } from "@/components/lab/viz"
import { LINK } from "@/components/lab/dashboard/cards"
import { RECORD_STATES, RECORD_STATE_LABEL, pipelineHref, plural, type PipelineModel, type PipelineSection, type RecordState } from "@/lib/lab/dashboard"
import type { LabScope } from "@/lib/lab/scope"
import { skillNoun, skillNounPlural } from "@/lib/lab/terms"
import { LINK_IN_TABLE } from "@/components/lab/link-styles"
import { fmt } from "@/lib/v2/format"

/** Graded neutrals, darkest for achieved. DS tokens only. */
export const STATE_FILL: Record<RecordState, string> = {
  achieved: "var(--muted-foreground)",
  progress: "var(--border-control-3)",
  unqualified: "var(--border-control)",
  none: "var(--border)",
}

/** Hatching for the waiting overlay: foreground stripes, faded by opacity on the overlay element (no color-mix). */
const HATCH = "repeating-linear-gradient(135deg, var(--foreground) 0 1.5px, transparent 1.5px 5px)"

const recordWord = (n: number) => (n === 1 ? "record" : "records")

export function StateSwatch({ state }: { state: RecordState }) {
  return <span className="inline-block size-3 shrink-0 rounded-sm" style={{ background: STATE_FILL[state] }} aria-hidden="true" />
}

export function WaitingSwatch() {
  return (
    <span className="relative inline-block size-3 shrink-0 overflow-hidden rounded-sm" style={{ background: STATE_FILL.progress }} aria-hidden="true">
      <span className="absolute inset-0 opacity-50" style={{ backgroundImage: HATCH }} />
    </span>
  )
}

// ---------------------------------------------------------------------------------------------------------------------
// Stage strip

export function StageStrip({ model, scope }: { model: PipelineModel; scope: LabScope }) {
  const metrics: MetricItem[] = model.stages.map((s) => ({
    id: s.state,
    label: s.label,
    value: fmt(s.count),
    delta: s.delta === 0 ? "" : `${s.delta > 0 ? "+" : ""}${fmt(s.delta)}`,
    trend: s.delta > 0 ? "up" : s.delta < 0 ? "down" : "neutral",
    // A move between states is neither good nor bad on its own (achieved rising is good, but so is no evidence falling).
    trendPolarity: "informational",
    // The chip is the change since the previous weekly cut-off; the card footnote names that date once.
    description: `${s.pct}% of all${s.waiting ? `, ${fmt(s.waiting)} waiting` : ""}`,
    href: pipelineHref(scope, { state: s.state }),
    chart: { kind: "sparkline", series: s.series, tone: "info" },
  }))
  return (
    <section aria-label={`Required ${skillNoun()} records by state, change since ${model.since}`} id="stages" data-figure="kpis" data-region="stages">
      <KeyMetrics variant="flat" size="sm" showHeader={false} metrics={metrics} metricsSingleRow className="px-0 lg:px-0" />
    </section>
  )
}

// ---------------------------------------------------------------------------------------------------------------------
// State bar

function StateBar({ row, scope, tick, section }: { row: PipelineSection; scope: LabScope; tick: PipelineModel["tick"]; section?: string }) {
  const name = section ?? "All sections"
  return (
    <div className="relative flex h-3.5 w-full gap-px" data-state-bar>
      {RECORD_STATES.map((st) => {
        const n = row.counts[st]
        if (n === 0) return null
        const w = row.waiting[st]
        return (
          <Link
            key={st}
            href={pipelineHref(scope, { state: st, section })}
            className="relative h-full overflow-hidden first:rounded-s-sm last:rounded-e-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            style={{ flexGrow: n, flexBasis: 0, minWidth: 3, background: STATE_FILL[st] }}
            aria-label={`${name}, ${RECORD_STATE_LABEL[st]}: ${fmt(n)} ${recordWord(n)}${w ? `, ${fmt(w)} waiting with an evaluator` : ""}. Open the list`}
          >
            {w ? <span className="absolute inset-y-0 start-0 opacity-50" style={{ width: `${(w / n) * 100}%`, backgroundImage: HATCH }} aria-hidden="true" /> : null}
          </Link>
        )
      })}
      {tick ? <span className="pointer-events-none absolute -top-1 -bottom-1 w-0.5 -translate-x-1/2" style={{ left: `${tick.pct}%`, background: VIZ.zero }} aria-hidden="true" /> : null}
    </div>
  )
}

// ---------------------------------------------------------------------------------------------------------------------
// Sections card

const SHOWN = 8
const FLAGGED = 3

function CountLink({ n, href, label }: { n: number; href: string; label: string }) {
  return n === 0 ? (
    <span className="text-muted-foreground">0</span>
  ) : (
    <Link className={LINK} href={href} aria-label={label}>
      {fmt(n)}
    </Link>
  )
}

function SectionRow({ row, scope, tick, all, flagged }: { row: PipelineSection; scope: LabScope; tick: PipelineModel["tick"]; all?: boolean; flagged?: boolean }) {
  const section = all ? undefined : row.section
  // Amber only on the largest gaps (strategy/07 Von Restorff: one highlight per region, or about 20% of the marks).
  const short = !!flagged
  return (
    <TableRow data-section-row={row.section} data-short={short || undefined}>
      <TableCell className="py-2">
        <span className="flex min-w-0 items-center gap-2">
          {short ? <DiamondGlyph /> : <span className="inline-block w-2.5" aria-hidden="true" />}
          {all ? (
            <span className="truncate font-semibold text-foreground">{row.section}</span>
          ) : (
            <Link className={`${LINK_IN_TABLE} truncate`} href={pipelineHref(scope, { section })} title={row.section}>
              {row.section}
            </Link>
          )}
          <span className="shrink-0 tabular-nums text-muted-foreground">{fmt(row.total)}</span>
          {short ? <span className="sr-only">{`, ${row.short} points under ${tick?.label.toLowerCase()}`}</span> : null}
        </span>
      </TableCell>
      <TableCell className="w-[38%] py-2">
        <StateBar row={row} scope={scope} tick={tick} section={section} />
      </TableCell>
      {RECORD_STATES.map((st) => (
        <TableCell key={st} className="py-2 text-right tabular-nums">
          <CountLink n={row.counts[st]} href={pipelineHref(scope, { state: st, section })} label={`${row.section}, ${RECORD_STATE_LABEL[st]}: ${fmt(row.counts[st])} ${recordWord(row.counts[st])}. Open the list`} />
          {st === "achieved" ? <span className={`ms-1.5 ${short ? "font-medium" : "text-muted-foreground"}`} style={short ? { color: VIZ.behindInk } : undefined}>{`${row.achievedPct}%`}</span> : null}
        </TableCell>
      ))}
    </TableRow>
  )
}

export function SectionsCard({ model, scope }: { model: PipelineModel; scope: LabScope }) {
  const [all, setAll] = React.useState(false)
  // Furthest under the basis first ("where does progress stall"), then the lowest share achieved.
  const ordered = React.useMemo(() => [...model.sections].sort((a, b) => b.short - a.short || a.achievedPct - b.achievedPct || a.section.localeCompare(b.section)), [model.sections])
  const rows = all ? ordered : ordered.slice(0, SHOWN)
  const shortCount = model.sections.filter((s) => s.short > 0).length
  const flagged = new Set(ordered.filter((s) => s.short > 0).slice(0, FLAGGED).map((s) => s.section))
  const tick = model.tick
  const summary = `${plural(model.total, `required ${skillNoun()} record`, `required ${skillNoun()} records`)} for ${plural(model.students, "student", "students")} in ${plural(model.sections.length, "section", "sections")}.${tick ? ` ${shortCount} ${shortCount === 1 ? "section sits" : "sections sit"} 8 or more points under ${tick.label.toLowerCase()}.` : ""}`
  return (
    <Card className="py-0" data-region="sections" data-chart aria-label="Where does each section sit?" role="region">
      <CardContent className="flex flex-col gap-3 py-4">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <h2 className="text-sm font-semibold text-foreground">Where does each section sit?</h2>
          <ul className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground" aria-label="Legend">
            {RECORD_STATES.map((st) => (
              <li key={st} className="flex items-center gap-1.5"><StateSwatch state={st} />{RECORD_STATE_LABEL[st]}</li>
            ))}
            <li className="flex items-center gap-1.5"><WaitingSwatch />Waiting with an evaluator</li>
            {tick ? (
              <li className="flex items-center gap-1.5">
                <span className="inline-block h-3 w-0.5" style={{ background: VIZ.zero }} aria-hidden="true" />
                {`${tick.label} ${tick.pct}%`}
              </li>
            ) : null}
            {flagged.size > 0 ? <li className="flex items-center gap-1.5"><DiamondGlyph />{flagged.size === 1 ? "Largest gap" : `${flagged.size} largest gaps`}</li> : null}
          </ul>
        </div>
        <p className="sr-only">{summary}</p>
        <Table scrollLabel={`Required ${skillNoun()} records by section and state`}>
          <TableHeader>
            <TableRow>
              <TableHead>Section</TableHead>
              <TableHead><span className="sr-only">State bar</span></TableHead>
              {RECORD_STATES.map((st) => (
                <TableHead key={st} className="text-right">{st === "unqualified" ? <Tip label="Evidence exists, but none qualifies under the rule"><span tabIndex={0} className="cursor-help underline decoration-dotted underline-offset-4 outline-none focus-visible:ring-2 focus-visible:ring-ring">{RECORD_STATE_LABEL[st]}</span></Tip> : RECORD_STATE_LABEL[st]}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            <SectionRow row={model.all} scope={scope} tick={tick} all />
            {rows.map((r) => (
              <SectionRow key={r.section} row={r} scope={scope} tick={tick} flagged={flagged.has(r.section)} />
            ))}
          </TableBody>
        </Table>
        {model.sections.length > SHOWN ? (
          <Button type="button" variant="ghost" size="sm" className="self-start" aria-expanded={all} onClick={() => setAll((v) => !v)}>
            <i className={`fa-light ${all ? "fa-chevron-up" : "fa-chevron-down"}`} aria-hidden="true" />
            {all ? `Show the ${SHOWN} furthest behind` : `Show all ${model.sections.length} sections`}
          </Button>
        ) : null}
        <p className="text-xs text-muted-foreground" data-viz-label>{`Arrows show the change since ${model.since}. A record is one student and one ${skillNoun()} required in their course. Waiting never counts. ${capitalSkills()} with no record in scope are not shown.`}</p>
      </CardContent>
    </Card>
  )
}

const capitalSkills = () => skillNounPlural().replace(/^./, (c) => c.toUpperCase())
