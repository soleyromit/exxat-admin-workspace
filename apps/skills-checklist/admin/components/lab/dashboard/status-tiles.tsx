"use client"

/**
 * Status board tiles (dashboard concept A, docs/knowledge/design/dashboard-concepts/README.md section 4A): six equal small
 * multiples, one question each. Every tile is the vendored ChartCard with one small chart drawn on the lab viz palette (grey
 * marks, one amber mark for the shortfall), a screen-reader table with the same numbers, and one link to the list behind it
 * with the same scope. Every mark that names a record is a link too. Numbers come from lib/lab/dashboard.ts only.
 */
import * as React from "react"
import { LabLink as Link } from "@/components/lab/lab-bar/lab-link"
import { LabKeyMetrics as KeyMetrics, type MetricItem } from "@/components/lab/lab-bar/lab-key-metrics"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@exxatdesignux/ui/components/ui/table"
import { ChartCard } from "@/components/chart-card"
import { VIZ, DiamondGlyph } from "@/components/lab/viz"
import { LINK } from "@/components/lab/dashboard/cards"
import { AGE_BUCKETS, APPROVAL_BANDS, ageSplit, drillHref, lanes as laneOf, plural, type DashboardModel, type SectionGap } from "@/lib/lab/dashboard"
import type { LabScope } from "@/lib/lab/scope"
import { aNoun, capitalize, skillNoun, skillNounPlural } from "@/lib/lab/terms"
import { LINK_IN_TABLE } from "@/components/lab/link-styles"
import { fmt } from "@/lib/v2/format"
import { TYPE } from "@/components/lab/type-scale"


// ---------------------------------------------------------------------------------------------------------------------
// Figure strip

export interface StatusSeries {
  behind: Array<{ value: number; label: string }>
}

/** Four figures with their mini charts (KeyMetrics flat, small): behind, required achieved, waiting, awaiting approval. */
export function StatusFigures({ model, series }: { model: DashboardModel; series: StatusSeries | null }) {
  const kpi = (id: string) => model.kpis.find((k) => k.id === id)
  const prev = series && series.behind.length > 1 ? series.behind[series.behind.length - 2].value : null
  const diff = prev === null ? null : model.heroValue - prev
  const since = diff === null ? "" : diff === 0 ? ", same as last week" : `, ${Math.abs(diff)} ${diff > 0 ? "more" : "fewer"} than last week`
  const achieved = kpi("achieved")
  const waiting = kpi("waiting")
  const approval = kpi("approval")
  const expectedNow = model.basis === "expected" ? `, expected now ${Math.round(model.term.share * 100)}%` : ""
  const metrics: MetricItem[] = [
    {
      id: "behind",
      label: model.basis === "expected" ? "Behind the term clock" : model.basis === "median" ? "Below the scope median" : "Short of all required",
      value: fmt(model.heroValue),
      delta: "",
      trend: "neutral",
      description: `of ${plural(model.inScope, "student", "students")}${since}`,
      href: model.heroHref,
      trendPolarity: "lower_is_better",
      ...(series && series.behind.length > 1 ? { chart: { kind: "sparkline" as const, series: series.behind, tone: "info" as const } } : {}),
    },
    ...[achieved, waiting, approval].filter((k): k is NonNullable<typeof k> => !!k).map((k) => ({
      id: k.id,
      label: k.label,
      value: typeof k.value === "number" ? fmt(k.value) : k.value,
      delta: "",
      trend: "neutral" as const,
      description: k.id === "achieved" ? `${k.description}${expectedNow}` : k.id === "waiting" ? `${k.description}` : k.description,
      href: k.href,
      trendPolarity: k.polarity,
      // Neutral ink ("info") for every mini chart: amber stays reserved for the shortfall marks in the tiles.
      ...(k.chart ? { chart: { kind: k.chart.kind, series: k.chart.series, tone: "info" as const } } : {}),
    })),
  ]
  return (
    <section aria-label="Key figures" id="kpis" data-figure="kpis" data-region="figures">
      <KeyMetrics variant="flat" size="sm" showHeader={false} metrics={metrics} metricsSingleRow className="overflow-visible px-0 lg:px-0" />
    </section>
  )
}

// ---------------------------------------------------------------------------------------------------------------------
// Tile frame

/** An inline control on the tile header (Compare with on the behind tile): the DS Select inside the vendored ChartCard. */
export interface TileSelector {
  label: string
  value: string
  options: Array<{ value: string; label: string }>
  onChange: (v: string) => void
}

export function Tile({ id, title, meta, link, summary, children, table, selector }: { id: string; title: string; meta: string; link?: { href: string; label: string; aria?: string }; summary: string; children: React.ReactNode; table: React.ReactNode; selector?: TileSelector }) {
  return (
    <div id={id} data-chart data-tile={id} className="min-w-0">
      <ChartCard title={title} description={meta} className="h-full" headingLevel="h3" {...(selector ? { variant: "selector" as const, filterOptions: selector.options, defaultFilter: selector.value, onFilterChange: selector.onChange, filterLabel: selector.label } : {})}>
        <div className="flex h-full flex-col gap-2">
          <p className="sr-only">{summary}</p>
          <div className="min-h-0 flex-1">{children}</div>
          {link ? (
            <div className="flex justify-end">
              <Link className={`${LINK} text-sm`} href={link.href} aria-label={link.aria}>{link.label}</Link>
            </div>
          ) : null}
          {/* Table fallback for assistive technology: the same numbers as the marks. */}
          <div className="sr-only">{table}</div>
        </div>
      </ChartCard>
    </div>
  )
}

function SrTable({ caption, head, rows }: { caption: string; head: string[]; rows: Array<Array<string | number>> }) {
  return (
    <Table scrollLabel={caption}>
      <TableHeader>
        <TableRow>{head.map((h) => <TableHead key={h}>{h}</TableHead>)}</TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((r, i) => (
          <TableRow key={i}>{r.map((c, j) => <TableCell key={j}>{c}</TableCell>)}</TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

/** A glyph centred at a share of its row (percent units, so the row stretches without distorting it). */
function Mark({ pct, y, flagged, size = 7 }: { pct: number; y: number; flagged: boolean; size?: number }) {
  const h = size / 2
  return (
    <svg x={`${pct}%`} y={y} width="1" height="1" overflow="visible" aria-hidden="true">
      {flagged ? <rect x={-h} y={-h} width={size} height={size} rx={1} fill={VIZ.behind} transform="rotate(45)" /> : <circle r={h * 0.72} fill={VIZ.on} />}
    </svg>
  )
}

// ---------------------------------------------------------------------------------------------------------------------
// 1. Students behind, by cohort

export function WhereBehindTile({ model, scope, partial, selector }: { model: DashboardModel; scope: LabScope; partial?: boolean; selector?: TileSelector }) {
  const all = laneOf(model.pop.rows, "cohort")
  // Partial demo (06 section 4.3): two cohorts fall under 5 students, so they are suppressed and named, not drawn.
  const lanes = partial ? all.lanes.slice(0, Math.max(1, all.lanes.length - 2)) : all.lanes
  const hidden = partial ? [...all.hidden, ...all.lanes.slice(lanes.length).map((l) => ({ label: l.label, n: 4 }))] : all.hidden
  const shown = lanes.slice(0, 4)
  const n = model.behind.length
  const word = model.basis === "expected" ? "behind the term clock" : model.basis === "median" ? "below the scope median" : "short of all required"
  const summary = n === 0 ? `Nobody is ${word}. ${shown.map((l) => `${l.label}: ${l.rows.length} students`).join(", ")}.` : `${n} of ${model.inScope} students ${word}: ${shown.map((l) => `${l.label} ${l.rows.filter((r) => r.behind).length} of ${l.rows.length}`).join(", ")}.`
  return (
    <Tile
      id="tile-behind"
      title="Students behind, by cohort"
      meta={`${n} of ${plural(model.inScope, "student", "students")}`}
      selector={selector}
      summary={summary}
      link={n > 0 ? { href: model.heroHref, label: `View the ${n}`, aria: `View the ${n} students ${word}` } : undefined}
      table={<SrTable caption="Students behind by cohort" head={["Cohort", "Behind", "Students"]} rows={shown.map((l) => [l.label, l.rows.filter((r) => r.behind).length, l.rows.length])} />}
    >
      <ul className="flex flex-col gap-3">
        {shown.map((l) => {
          const behind = l.rows.filter((r) => r.behind)
          const marks = [...behind.map(() => true), ...l.rows.filter((r) => !r.behind).map(() => false)]
          return (
            <li key={l.id} className="flex flex-col gap-1">
              <div className="flex items-baseline justify-between gap-2 text-sm">
                <Link className={NAME_LINK} href={drillHref({ ...scope, cohort: l.label, group: "" }, { list: "students", cond: "behind", from: "tile-behind" })} aria-label={`${l.label}: ${behind.length} of ${l.rows.length} students ${word}. Open the list`}>{l.label}</Link>
                <span className="shrink-0 tabular-nums text-muted-foreground">{`${behind.length} of ${l.rows.length}`}</span>
              </div>
              <svg className="h-3 w-full overflow-visible" aria-hidden="true">
                {marks.map((f, i) => <Mark key={i} pct={((i + 0.5) / Math.max(marks.length, 30)) * 100} y={6} flagged={f} />)}
              </svg>
            </li>
          )
        })}
      </ul>
      <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground" data-viz-label aria-hidden="true">
        <DiamondGlyph />
        {hidden.length > 0 ? `Behind. ${plural(hidden.length, "cohort", "cohorts")} under 5 students hidden.` : "Behind"}
      </p>
    </Tile>
  )
}

// ---------------------------------------------------------------------------------------------------------------------
// Ranked dot rows (blocking skill, sections)

const RANK = "grid grid-cols-[minmax(0,9.5rem)_minmax(0,1fr)_2rem] items-center gap-2"

/** Quiet record link: the name reads as a label, underlines on hover, keeps the focus ring. */
const NAME_LINK = `truncate text-sm ${LINK_IN_TABLE}`

interface RankRow { key: string; name: string; sub?: string; value: number; href: string; aria: string; title?: string }

function RankRows({ rows, max, label }: { rows: RankRow[]; max: number; label: string }) {
  return (
    <ol className="flex flex-col gap-1.5" aria-label={label}>
      {rows.map((r, i) => {
        const pct = Math.max(0, Math.min(100, (r.value / Math.max(1, max)) * 100))
        return (
          <li key={r.key} className={RANK}>
            <span className="flex min-w-0 flex-col">
              <Link className={NAME_LINK} href={r.href} title={r.title ?? r.name} aria-label={r.aria}>{r.name}</Link>
              {r.sub ? <span className="truncate text-xs text-muted-foreground" title={r.title}>{r.sub}</span> : null}
            </span>
            <svg className="h-3.5 w-full overflow-visible" aria-hidden="true">
              <line x1="0" x2="100%" y1="7" y2="7" stroke={VIZ.track} strokeWidth="1" />
              <line x1="0" x2={`${pct}%`} y1="7" y2="7" stroke={VIZ.on} strokeWidth="2" />
              <Mark pct={pct} y={7} flagged={i === 0} size={9} />
            </svg>
            <span className="text-right text-sm tabular-nums text-foreground">{r.value}</span>
          </li>
        )
      })}
    </ol>
  )
}

// ---------------------------------------------------------------------------------------------------------------------
// 2. Skills holding students back

export function BlockingTile({ model, scope }: { model: DashboardModel; scope: LabScope }) {
  const list = model.blockers
  const flagged = model.behind.length
  // Ties are stated, not ranked (strategy/07 A9, Von Restorff): one row per distinct value, the top value alone highlighted.
  const groups: Array<{ value: number; rows: typeof list }> = []
  for (const b of list) {
    const last = groups[groups.length - 1]
    if (last && last.value === b.students) last.rows.push(b)
    else if (groups.length < 6) groups.push({ value: b.students, rows: [b] })
    else break
  }
  const rows: RankRow[] = groups.map((g) => {
    const one = g.rows.length === 1 ? g.rows[0] : null
    return one
      ? { key: one.skillId, name: one.name, value: g.value, title: `${one.name}, ${one.category}`, href: drillHref(scope, { list: "students", cond: "behind", skill: one.skillId, from: "tile-blocking" }), aria: `${one.name}: short for ${g.value} of the ${flagged} students behind. Open the list` }
      : { key: `tie-${g.value}`, name: `${g.rows.length} ${skillNounPlural()} tie`, sub: `${g.rows.slice(0, 2).map((r) => r.name).join(", ")}, +${g.rows.length - 2}`, title: g.rows.map((r) => r.name).join(", "), value: g.value, href: drillHref(scope, { list: "skills", from: "tile-blocking" }), aria: `${g.rows.length} ${skillNounPlural()} tie, each short for ${g.value} of the ${flagged} students behind. Open the ${skillNounPlural()} list` }
  })
  const summary = list.length === 0 ? `No required ${skillNoun()} holds anyone back in this scope.` : groups.map((g) => `${g.rows.length === 1 ? g.rows[0].name : `${g.rows.length} ${skillNounPlural()} tie`}: ${g.value} of ${flagged}`).join(", ")
  return (
    <Tile
      id="tile-blocking"
      title={`${capitalize(skillNounPlural())} holding students back`}
      meta={`Students short, of ${flagged} behind`}
      summary={summary}
      link={list.length > 0 ? { href: drillHref(scope, { list: "skills", from: "tile-blocking" }), label: `All ${list.length}`, aria: `All ${list.length} ${skillNounPlural()} short for students behind` } : undefined}
      table={<SrTable caption={`Blocking ${skillNounPlural()}`} head={[skillNoun(), "Students short"]} rows={list.slice(0, 12).map((b) => [b.name, b.students])} />}
    >
      {list.length === 0 ? <p className="text-sm text-muted-foreground">{`No required ${skillNoun()} holds anyone back.`}</p> : <RankRows label={`${skillNounPlural()} by students short`} max={Math.max(1, flagged)} rows={rows} />}
    </Tile>
  )
}

// ---------------------------------------------------------------------------------------------------------------------
// 3. Sections furthest behind

export function SectionsTile({ model, scope, gaps }: { model: DashboardModel; scope: LabScope; gaps: SectionGap[] }) {
  const median = model.basis === "median"
  // Under the peer median basis the scope is its own median, so sections are ranked by share counted instead.
  const ranked = median ? [...gaps].sort((a, b) => a.pct - b.pct || a.section.localeCompare(b.section)).map((g) => ({ ...g, gap: 100 - g.pct })) : gaps
  const lagging = median ? ranked : ranked.filter((g) => g.gap > 0)
  const top = lagging.slice(0, 7)
  const rest = ranked.length - top.length
  const restMax = ranked.slice(top.length).reduce((m, g) => Math.max(m, g.gap), 0)
  const max = Math.max(1, ...top.map((g) => g.gap))
  const meta = model.basis === "expected" ? "Points under expected now" : model.basis === "all" ? "Points short of all required" : "Lowest share counted"
  const summary = top.length === 0 ? "No section is under the basis." : top.map((g) => `${g.section}: ${median ? `${g.pct}% counted` : `${g.gap} points under`}`).join(", ")
  return (
    <Tile
      id="tile-sections"
      title="Sections furthest behind"
      meta={meta}
      summary={summary}
      link={{ href: drillHref(scope, { list: "skills", from: "tile-sections" }), label: `Required ${skillNounPlural()}`, aria: `Required ${skillNounPlural()} in scope` }}
      table={<SrTable caption="Sections" head={["Section", "Counted", "Expected"]} rows={ranked.map((g) => [g.section, `${g.pct}%`, `${g.expected}%`])} />}
    >
      {top.length === 0 ? (
        <p className="text-sm text-muted-foreground">Every section is at or above the basis.</p>
      ) : (
        <div className="flex flex-col gap-2">
          <RankRows
            label="Sections furthest under the basis"
            max={max}
            rows={top.map((g) => ({ key: g.section, name: g.section, value: median ? g.pct : g.gap, href: drillHref({ ...scope, cat: g.section }, { list: "skills", from: "tile-sections" }), aria: `${g.section}: ${g.pct}% counted, ${g.expected}% expected. Open its ${skillNounPlural()}` }))}
          />
          {rest > 0 && !median ? <p className="text-xs text-muted-foreground">{restMax > 0 ? `${plural(rest, "other section is", "other sections are")} ${restMax} points or less under, or ahead.` : `${plural(rest, "other section is", "other sections are")} at or ahead of the basis.`}</p> : null}
        </div>
      )}
    </Tile>
  )
}

// ---------------------------------------------------------------------------------------------------------------------
// 4. Oldest requests, by site

export function SitesTile({ model, scope }: { model: DashboardModel; scope: LabScope }) {
  const s = model.sites
  const top = s.top.slice(0, 4)
  const max = Math.max(1, ...top.map((r) => r.total))
  const summary = top.length === 0 ? "No requests are waiting with evaluators." : top.map((r) => `${r.name}: ${r.total} waiting, ${r.buckets[3]} at 15 days or more, oldest ${r.oldest} days`).join(". ")
  return (
    <Tile
      id="tile-sites"
      title="Oldest requests, by site"
      meta={`Oldest first, ${top.length} of ${s.sites}`}
      summary={summary}
      link={s.sites > 0 ? { href: drillHref(scope, { list: "sites", from: "tile-sites" }), label: `All ${s.sites} sites` } : undefined}
      table={<SrTable caption="Requests by site and age" head={["Site", ...AGE_BUCKETS.map((b) => b.label), "All"]} rows={top.map((r) => [r.name, ...r.buckets, r.total])} />}
    >
      <ul className="flex flex-col gap-2.5">
        {top.map((r) => (
          <li key={r.siteId} className="flex flex-col gap-1">
            <div className="flex items-baseline justify-between gap-2 text-sm">
              <Link className={NAME_LINK} href={drillHref(scope, { list: "requests", cond: "waiting", siteId: r.siteId, from: "tile-sites" })} aria-label={`${r.name}: ${r.total} requests waiting, oldest ${r.oldest} days. Open them`}>{r.name}</Link>
              <span className="shrink-0 tabular-nums text-muted-foreground">{`${r.total}, oldest ${r.oldest} d`}</span>
            </div>
            <div className="flex h-2 gap-0.5" style={{ width: `${Math.max(8, (r.total / max) * 100)}%` }} aria-hidden="true">
              {r.buckets.map((v, i) => (v === 0 ? null : <span key={i} className="h-full rounded-sm" style={{ flexGrow: v, flexBasis: 0, minWidth: 3, background: i === 3 ? VIZ.behind : VIZ.age[i] }} />))}
            </div>
          </li>
        ))}
      </ul>
      <ul className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground" aria-hidden="true" data-viz-label>
        {AGE_BUCKETS.map((b, i) => (
          <li key={b.id} className="flex items-center gap-1">
            <span className="inline-block size-2.5 rounded-sm" style={{ background: i === 3 ? VIZ.behind : VIZ.age[i] }} />
            {b.label.replace(" days", "").replace(" or more", "+")}
          </li>
        ))}
      </ul>
    </Tile>
  )
}

// ---------------------------------------------------------------------------------------------------------------------
// Column chart (approval age, evidence flow)

function Columns({ values, labels, flag, height = 132, valueLabels = true, ticks }: { values: number[]; labels?: string[]; flag: (i: number) => "amber" | "dark" | "soft"; height?: number; valueLabels?: boolean; ticks?: [string, string] }) {
  const max = Math.max(1, ...values)
  const n = values.length
  const gap = n > 6 ? 1.5 : 6
  const w = (100 - gap * (n - 1)) / n
  const top = valueLabels ? 18 : 4
  const base = height - (labels || ticks ? 20 : 2)
  const fill = (k: "amber" | "dark" | "soft") => (k === "amber" ? VIZ.behind : k === "dark" ? VIZ.age[3] : VIZ.age[2])
  return (
    <svg className="w-full overflow-visible" height={height} aria-hidden="true">
      <line x1="0" x2="100%" y1={base} y2={base} stroke={VIZ.grid} />
      {values.map((v, i) => {
        const h = Math.max(v > 0 ? 2 : 0, ((base - top) * v) / max)
        const x = i * (w + gap)
        return (
          <g key={i}>
            <rect x={`${x}%`} y={base - h} width={`${w}%`} height={h} rx={2} fill={fill(flag(i))} />
            {valueLabels ? <text x={`${x + w / 2}%`} y={base - h - 5} textAnchor="middle" fontSize="12" fill="var(--foreground)">{v}</text> : null}
            {labels ? <text x={`${x + w / 2}%`} y={height - 4} textAnchor="middle" fontSize="12" fill={VIZ.tick}>{labels[i]}</text> : null}
          </g>
        )
      })}
      {ticks ? (
        <>
          <text x="0" y={height - 4} fontSize="12" fill={VIZ.tick}>{ticks[0]}</text>
          <text x="100%" y={height - 4} fontSize="12" textAnchor="end" fill={VIZ.tick}>{ticks[1]}</text>
        </>
      ) : null}
    </svg>
  )
}

// ---------------------------------------------------------------------------------------------------------------------
// 5. Days awaiting approval

export function ApprovalAgeTile({ model, scope, days }: { model: DashboardModel; scope: LabScope; days: number[] }) {
  const split = ageSplit(days, APPROVAL_BANDS)
  const a = model.approvals
  const short = ["0 to 3", "4 to 7", "8 to 10", "Over 10"]
  return (
    <Tile
      id="tile-approval"
      title="Days awaiting approval"
      meta={`${plural(a.evaluations, "evaluation", "evaluations")}, by days waiting`}
      summary={`${split.map((p) => `${p.label}: ${p.value}`).join(", ")}.`}
      link={a.submissions > 0 ? { href: drillHref(scope, { list: "requests", cond: "approval", from: "tile-approval" }), label: `Open the ${a.submissions} submissions`, aria: `Open the ${a.submissions} submissions awaiting approval` } : undefined}
      table={<SrTable caption="Evaluations awaiting approval by days waiting" head={["Days waiting", "Evaluations"]} rows={split.map((p) => [p.label, p.value])} />}
    >
      <Columns values={split.map((p) => p.value)} labels={short} flag={(i) => (i === 3 && split[3].value > 0 ? "amber" : "soft")} />
    </Tile>
  )
}

// ---------------------------------------------------------------------------------------------------------------------
// 6. Evaluations counted per week

export function FlowTile({ scope, weeks }: { scope: LabScope; weeks: Array<{ value: number; label: string; end: string }> }) {
  const last = weeks.at(-1)?.value ?? 0
  const values = weeks.map((w) => w.value)
  const min = Math.min(...values)
  const maxV = Math.max(...values)
  const note = weeks.length === 0 ? "" : last === min ? `${fmt(last)} last week, the lowest of ${weeks.length} weeks.` : last === maxV ? `${fmt(last)} last week, the highest of ${weeks.length} weeks.` : `${fmt(last)} last week.`
  const day = (iso: string) => new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" })
  return (
    <Tile
      id="tile-flow"
      title="Evaluations counted per week"
      meta={`Last ${weeks.length} weeks`}
      summary={`${weeks.map((w) => `${w.label}: ${w.value}`).join(", ")}. ${note}`}
      link={{ href: drillHref(scope, { list: "skills", from: "tile-flow" }), label: `Required ${skillNounPlural()} achieved` }}
      table={<SrTable caption="Evaluations counted per week" head={["Week", "Counted"]} rows={weeks.map((w) => [w.label, w.value])} />}
    >
      <div className="flex flex-col gap-2">
        <Columns values={values} flag={(i) => (i === values.length - 1 ? "dark" : "soft")} valueLabels={false} height={118} ticks={weeks.length ? [day(weeks[0].end), day(weeks[weeks.length - 1].end)] : undefined} />
        <p className="text-xs text-muted-foreground">{note}</p>
      </div>
    </Tile>
  )
}

// ---------------------------------------------------------------------------------------------------------------------
// Sections added 2026-10-27 (Romit: "Are there more dashboard items that you haven't considered here?"). Each is one tile:
// one plain title, a one-line meta, a list or small chart, a table fallback and one link. Numbers come from the single
// sources only (placementsEnding, buildExceptions, buildAttainment, countedBySetting, the dashboard model).

/** A plain list row: record link on the left, its figure on the right, an optional muted second line. */
function ListRows({ rows, label }: { rows: Array<{ key: string; name: string; href: string; aria?: string; sub?: string; value: string; flagged?: boolean }>; label: string }) {
  return (
    <ul className="flex flex-col gap-2" aria-label={label}>
      {rows.map((r) => (
        <li key={r.key} className="flex items-baseline justify-between gap-3">
          <span className="flex min-w-0 flex-col">
            <span className="flex min-w-0 items-center gap-1.5">
              {r.flagged ? <DiamondGlyph /> : null}
              <Link className={NAME_LINK} href={r.href} aria-label={r.aria}>{r.name}</Link>
            </span>
            {r.sub ? <span className="truncate text-xs text-muted-foreground">{r.sub}</span> : null}
          </span>
          <span className="shrink-0 text-sm tabular-nums text-muted-foreground">{r.value}</span>
        </li>
      ))}
    </ul>
  )
}

export interface EndingRow { id: string; studentId: string; student: string; location: string; daysLeft: number; behind: boolean }

/** Placements ending soon: students whose placement ends within the window, those behind marked (time is running out). */
export function PlacementsEndingTile({ rows, days, scope, studentHref }: { rows: EndingRow[]; days: number; scope: LabScope; studentHref: (id: string) => string }) {
  const behind = rows.filter((r) => r.behind).length
  const shown = [...rows].sort((a, b) => Number(b.behind) - Number(a.behind) || a.daysLeft - b.daysLeft).slice(0, 5)
  const summary = rows.length === 0 ? `No placement ends in the next ${days} days.` : `${plural(rows.length, "placement ends", "placements end")} within ${days} days; ${behind} of those students ${behind === 1 ? "is" : "are"} behind.`
  return (
    <Tile
      id="tile-ending"
      title="Placements ending soon"
      meta={`Within ${days} days, ${behind} of ${rows.length} students behind`}
      summary={summary}
      link={behind > 0 ? { href: drillHref(scope, { list: "students", cond: "behind", from: "tile-ending" }), label: "Students behind" } : undefined}
      table={<SrTable caption="Placements ending soon" head={["Student", "Location", "Days left", "Behind"]} rows={rows.map((r) => [r.student, r.location, r.daysLeft, r.behind ? "Yes" : "No"])} />}
    >
      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">{summary}</p>
      ) : (
        <ListRows label="Placements ending soonest, students behind first" rows={shown.map((r) => ({ key: r.id, name: r.student, href: studentHref(r.studentId), sub: r.location, value: `${r.daysLeft} d left`, flagged: r.behind, aria: `${r.student}, ${r.location}: ${r.daysLeft} days left${r.behind ? ", behind" : ""}. Open the record` }))} />
      )}
    </Tile>
  )
}

export interface StuckRequest { id: string; studentId: string; student: string; skills: string; days: number; why: string }

/** Returned requests and requests waiting 15 days or more: the two queues that stall a student without anyone acting. */
export function StuckRequestsTile({ returned, old, scope, studentHref }: { returned: StuckRequest[]; old: StuckRequest[]; scope: LabScope; studentHref: (id: string) => string }) {
  const rows = [...returned.map((r) => ({ ...r, kind: "Returned" })), ...old.map((r) => ({ ...r, kind: "Waiting" }))].sort((a, b) => b.days - a.days).slice(0, 5)
  const summary = `${plural(returned.length, "request", "requests")} returned to students, ${plural(old.length, "request", "requests")} waiting 15 days or more.`
  return (
    <Tile
      id="tile-stuck"
      title="Returned and long-waiting requests"
      meta={`${returned.length} returned, ${old.length} waiting 15 days or more`}
      summary={summary}
      link={old.length > 0 ? { href: drillHref(scope, { list: "requests", cond: "old", from: "tile-stuck" }), label: `All ${old.length} waiting` } : undefined}
      table={<SrTable caption="Returned and long-waiting requests" head={["Student", "Status", "Days", "Why"]} rows={[...returned.map((r) => [r.student, "Returned", r.days, r.why]), ...old.map((r) => [r.student, "Waiting", r.days, r.why])]} />}
    >
      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nothing is returned or waiting 15 days or more.</p>
      ) : (
        <ListRows label="Oldest first" rows={rows.map((r) => ({ key: `${r.kind}-${r.id}`, name: r.student, href: studentHref(r.studentId), sub: `${r.kind}: ${r.skills}`, value: `${r.days} d`, aria: `${r.student}, ${r.kind.toLowerCase()} ${r.days} days: ${r.why}. Open the record` }))} />
      )}
    </Tile>
  )
}

export interface UnverifiedRow { id: string; name: string; site: string; requests: number; oldest: number }

/** Evaluator names not yet adopted: their evidence is held for approval until someone adopts or merges the name. */
export function UnverifiedEvaluatorsTile({ rows, total, href }: { rows: UnverifiedRow[]; total: number; href: string }) {
  const requests = rows.reduce((t, r) => t + r.requests, 0)
  const summary = `${plural(total, "evaluator name is", "evaluator names are")} not verified; ${rows.length} of them hold ${plural(requests, "open request", "open requests")}.`
  return (
    <Tile
      id="tile-unverified"
      title="Evaluators not yet verified"
      meta={`${total} names, ${rows.length} holding requests`}
      summary={summary}
      link={total > 0 ? { href, label: `Review all ${total}` } : undefined}
      table={<SrTable caption="Unverified evaluators holding requests" head={["Evaluator", "Site", "Requests", "Oldest, days"]} rows={rows.map((r) => [r.name, r.site, r.requests, r.oldest])} />}
    >
      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">{total === 0 ? "Every evaluator name is verified." : "No unverified evaluator holds an open request."}</p>
      ) : (
        <ListRows label="Unverified evaluators, oldest request first" rows={rows.slice(0, 5).map((r) => ({ key: r.id, name: r.name, href, sub: r.site, value: `${r.requests}, oldest ${r.oldest} d` }))} />
      )}
    </Tile>
  )
}

/** Skill set-up (REQ IM-10: how many skills still require configuration), with the next step one click away. */
export function SetupTile({ configured, total, inactive, href }: { configured: number; total: number; inactive: number; href: string }) {
  const not = total - configured
  const values = [configured, not, inactive]
  const labels = ["Configured", "Not configured", "Inactive"]
  return (
    <Tile
      id="tile-setup"
      title={`${capitalize(skillNounPlural())} set-up`}
      meta={`${fmt(not)} of ${fmt(total)} not configured`}
      summary={`${labels.map((l, i) => `${l}: ${values[i]}`).join(", ")}. Students cannot use ${aNoun()} until it is configured.`}
      link={not > 0 ? { href, label: `Configure the ${fmt(not)}` } : undefined}
      table={<SrTable caption={`${capitalize(skillNoun())} set-up`} head={["State", capitalize(skillNounPlural())]} rows={labels.map((l, i) => [l, values[i]])} />}
    >
      <Columns values={values} labels={labels} flag={(i) => (i === 1 && not > 0 ? "dark" : "soft")} height={120} />
    </Tile>
  )
}

/** Required this term next to required to graduate (decision D-X12): two sets, named, never added together. */
export function RequiredSetsTile({ term, graduate, termHref, graduateHref }: { term: { achieved: number; total: number }; graduate: { achieved: number; total: number }; termHref: string; graduateHref: string }) {
  const pct = (a: number, t: number) => (t === 0 ? 0 : Math.round((a / t) * 100))
  const rows = [
    { key: "term", name: "Required this term", href: termHref, a: term.achieved, t: term.total },
    { key: "graduate", name: "Required to graduate", href: graduateHref, a: graduate.achieved, t: graduate.total },
  ]
  return (
    <Tile
      id="tile-required"
      title="Required this term and to graduate"
      meta="Student records achieved, two separate sets"
      summary={rows.map((r) => `${r.name}: ${fmt(r.a)} of ${fmt(r.t)} records achieved, ${pct(r.a, r.t)}%`).join(". ")}
      table={<SrTable caption="Required sets" head={["Set", "Achieved", "Records", "Share"]} rows={rows.map((r) => [r.name, r.a, r.t, `${pct(r.a, r.t)}%`])} />}
    >
      <dl className="grid grid-cols-2 gap-4">
        {rows.map((r) => (
          <div key={r.key} className="flex flex-col gap-1">
            <dt className="text-sm text-muted-foreground">{r.name}</dt>
            <dd className="flex flex-col gap-1">
              <span className={TYPE.figure}>{`${pct(r.a, r.t)}%`}</span>
              <Link className={`${LINK} text-sm`} href={r.href} aria-label={`${r.name}: ${fmt(r.a)} of ${fmt(r.t)} records achieved. Open in Reports`}>{`${fmt(r.a)} of ${fmt(r.t)}`}</Link>
            </dd>
          </div>
        ))}
      </dl>
    </Tile>
  )
}

/** Counted evidence by setting: lab and simulation never satisfy a clinical-setting minimum (REQ SC-12). */
export function SettingTile({ rows, href }: { rows: Array<{ setting: string; label: string; value: number }>; href: string }) {
  const total = rows.reduce((t, r) => t + r.value, 0)
  return (
    <Tile
      id="tile-setting"
      title="Counted evidence by setting"
      meta={`${fmt(total)} counted evaluations`}
      summary={`${rows.map((r) => `${r.label}: ${r.value}`).join(", ")}. Lab and simulation evidence never counts toward a clinical-setting minimum.`}
      link={{ href, label: "Filter by setting" }}
      table={<SrTable caption="Counted evaluations by setting" head={["Setting", "Counted"]} rows={rows.map((r) => [r.label, r.value])} />}
    >
      <div className="flex flex-col gap-2">
        <Columns values={rows.map((r) => r.value)} labels={rows.map((r) => r.label)} flag={(i) => (i === 0 ? "dark" : "soft")} height={120} />
        <p className="text-xs text-muted-foreground">Lab and simulation never count toward a clinical-setting minimum.</p>
      </div>
    </Tile>
  )
}

/** Attainment by tag (REQ RP-04): lowest share achieved first; a skill with several tags counts under each, and it says so. */
export function TagsTile({ rows, multiTagged, href }: { rows: Array<{ key: string; label: string; achievedPct: number; total: number }>; multiTagged: number; href: string }) {
  const low = [...rows].sort((a, b) => a.achievedPct - b.achievedPct || a.label.localeCompare(b.label)).slice(0, 5)
  return (
    <Tile
      id="tile-tags"
      title="Attainment by tag"
      meta="Lowest share achieved first"
      summary={`${low.map((r) => `${r.label}: ${r.achievedPct}% of ${r.total} records`).join(", ")}. Tags overlap: ${multiTagged} records carry more than one tag and count under each.`}
      link={{ href, label: `All ${rows.length} tags` }}
      table={<SrTable caption="Attainment by tag" head={["Tag", "Achieved", "Records"]} rows={rows.map((r) => [r.label, `${r.achievedPct}%`, r.total])} />}
    >
      <div className="flex flex-col gap-2">
        <RankRows label="Tags, lowest share achieved first" max={100} rows={low.map((r) => ({ key: r.key, name: r.label, value: r.achievedPct, href, aria: `${r.label}: ${r.achievedPct}% of ${r.total} records achieved. Open in Reports` }))} />
        <p className="text-xs text-muted-foreground">{`Tags overlap: ${fmt(multiTagged)} records count under more than one tag.`}</p>
      </div>
    </Tile>
  )
}
