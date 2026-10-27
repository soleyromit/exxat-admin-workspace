"use client"

/**
 * Dashboard regions shared by variants A, B, C (strategy/06 section 4.1): hero verdict, KPI strip, "Who is behind" gap strip,
 * blocking skill ranks, stuck requests by site, Needs you, the loading shape and per-card error. Every number is a link to a
 * drill list carrying the same scope and basis. Every chart has a text summary (its accessible name and card description)
 * and a "Show as table" fallback.
 */
import * as React from "react"
import { LabLink as Link } from "@/components/lab/lab-bar/lab-link"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import { Card, CardContent } from "@exxatdesignux/ui/components/ui/card"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@exxatdesignux/ui/components/ui/collapsible"
import { LabKeyMetrics as KeyMetrics, type MetricItem } from "@/components/lab/lab-bar/lab-key-metrics"
import { LocalBanner } from "@exxatdesignux/ui/components/ui/banner"
import { Skeleton } from "@exxatdesignux/ui/components/ui/skeleton"
import { StatusBadge } from "@exxatdesignux/ui/components/ui/status-badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@exxatdesignux/ui/components/ui/table"
import { Tip } from "@exxatdesignux/ui/components/ui/tip"
import { ViewSegmentedControl } from "@exxatdesignux/ui/components/ui/view-segmented-control"
import { DataRowList } from "@exxatdesignux/ui/components/data-views/data-row-list"
import { ChartCard } from "@/components/chart-card"
import { VIZ, DiamondGlyph } from "@/components/lab/viz"
import { AGE_BUCKETS, basisPhrase, conditionLabel, drillHref, lanes as laneOf, plural, studentHref, type BlockerRow, type DashboardModel, type Split, type StudentRow } from "@/lib/lab/dashboard"
import type { LabScope } from "@/lib/lab/scope"
import { capitalize, skillNoun, skillNounPlural } from "@/lib/lab/terms"
import { GapStrip, StripLegend, niceDomain, type StripLane } from "@/components/lab/dashboard/gap-strip"
import { LINK, LINK_IN_TABLE } from "@/components/lab/link-styles"
import { fmt } from "@/lib/v2/format"
import { TYPE } from "@/components/lab/type-scale"

// One link treatment for every lab screen (consistency audit item 7): LINK standalone (always underlined), LINK_IN_TABLE in rows.
export { LINK, LINK_IN_TABLE } from "@/components/lab/link-styles"

// ---------------------------------------------------------------------------------------------------------------------

export function ShowAsTable({ label, openLabel = "Show as table", children }: { label: string; openLabel?: string; children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false)
  return (
    <Collapsible open={open} onOpenChange={setOpen} className="flex flex-col gap-2">
      <CollapsibleTrigger asChild>
        <Button type="button" variant="ghost" size="sm" className="self-start" aria-expanded={open}>
          <i className={`fa-light ${open ? "fa-chevron-down" : "fa-chevron-right"}`} aria-hidden="true" />
          {open ? "Hide table" : openLabel}
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="max-h-80 overflow-y-auto rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring" role="region" aria-label={label} tabIndex={0}>
          {children}
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}

export function BehindBadge({ label }: { label: string }) {
  return <StatusBadge label={label} tone="warning" icon="fa-triangle-exclamation" size="sm" />
}

// ---------------------------------------------------------------------------------------------------------------------
// Hero

/** Amber icon tile: the only tinted surface in the hero (DS warning wash, warning ink). Neutral when nobody is behind. */
export function HeroTile({ icon, tone }: { icon: string; tone: "behind" | "clear" }) {
  return (
    <span
      className="flex size-10 shrink-0 items-center justify-center rounded-lg"
      style={tone === "behind" ? { background: VIZ.behindWash, color: VIZ.behindInk } : { background: "var(--muted)", color: "var(--foreground)" }}
      aria-hidden="true"
    >
      <i className={`fa-light ${icon} text-lg`} />
    </span>
  )
}

/**
 * Hero metric: the number at display size in the DS heading face, the denominator and claim in muted ink beside it
 * (typographic contrast, not colour). The basis explanation lives in a Tip on the number (one place, no extra button).
 */
export function HeroMetric({ value, rest, tip }: { value: string; rest: string; tip?: string }) {
  const number = <span className={TYPE.figure} data-hero-number>{value}</span>
  return (
    <h2 className="flex flex-wrap items-baseline gap-x-2 gap-y-1 text-foreground" data-figure="hero">
      {tip ? (
        <Tip label={tip}>
          <span tabIndex={0} className="cursor-help rounded-sm underline decoration-dotted decoration-1 underline-offset-[6px] outline-none focus-visible:ring-2 focus-visible:ring-ring" aria-label={`${value}. ${tip}`}>{number}</span>
        </Tip>
      ) : number}
      <span className="text-sm font-normal text-muted-foreground">{rest}</span>
    </h2>
  )
}

/**
 * The verdict band (strategy/07 A1): hero number, its cause and its action on the left; the three supporting figures with
 * their mini charts on the right, in one compact region. "Skills configured" is not a figure here: set-up lives in Needs
 * you (strategy/06 D3).
 */
export function Hero({ model, actionLabel, href, figures = true }: { model: DashboardModel; actionLabel?: string; href?: string; figures?: boolean }) {
  const behind = model.kind === "behind"
  return (
    <Card data-dashboard-hero={model.kind} id="hero" data-region="verdict" className="py-0">
      <CardContent className={`grid gap-x-6 gap-y-4 py-4 ${figures ? "lg:grid-cols-12 lg:items-center" : ""}`}>
        <div className="flex min-w-0 items-start gap-4 lg:col-span-5">
          <HeroTile icon={behind ? "fa-user-clock" : "fa-circle-check"} tone={behind ? "behind" : "clear"} />
          <div className="flex min-w-0 flex-col gap-2">
            {behind ? (
              <HeroMetric value={fmt(model.heroValue)} rest={`of ${fmt(model.inScope)} students ${model.heroValue === 1 ? "is" : "are"} ${basisPhrase(model.basis)}`} tip={model.basisCaption} />
            ) : (
              <Tip label={model.basisCaption}>
                <h2 tabIndex={0} className="text-base font-semibold text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring">{model.heroSentence}</h2>
              </Tip>
            )}
            <p className="text-sm text-foreground">{model.heroDetail}</p>
            {behind ? (
              <Button asChild variant="outline" size="sm" className="self-start">
                <Link href={href ?? model.heroHref}>{actionLabel ?? `View the ${model.heroValue}`}</Link>
              </Button>
            ) : null}
          </div>
        </div>
        {figures ? (
          <div className="min-w-0 border-t border-border pt-3 lg:col-span-7 lg:border-s lg:border-t-0 lg:ps-4 lg:pt-0">
            <Kpis model={model} />
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}

// ---------------------------------------------------------------------------------------------------------------------
// KPI strip

/** Supporting figures (max 3 beside the hero, so the page holds 4). Set-up is left to Needs you. */
export function Kpis({ model }: { model: DashboardModel }) {
  const metrics: MetricItem[] = model.kpis.filter((k) => k.id !== "setup").map((k) => ({
    id: k.id,
    label: k.label,
    value: typeof k.value === "number" ? fmt(k.value) : k.value,
    delta: "",
    trend: "neutral",
    description: k.description,
    href: k.href,
    trendPolarity: k.polarity,
    // Neutral ink for every mini chart ("info" maps to --primary): the amber accent stays reserved for behind.
    ...(k.chart ? { chart: { kind: k.chart.kind, series: k.chart.series, tone: "info" as const } } : {}),
  }))
  return (
    <section aria-label="Key figures" id="kpis" data-figure="kpis">
      <KeyMetrics variant="flat" size="sm" showHeader={false} metrics={metrics} metricsSingleRow className="px-0 lg:px-0" />
    </section>
  )
}

// ---------------------------------------------------------------------------------------------------------------------
// Who is behind

const SPLIT_OPTIONS = [
  { value: "none", label: "None" },
  { value: "cohort", label: "Cohort" },
  { value: "group", label: "Group" },
] as const

const gapText = (r: StudentRow, basis: DashboardModel["basis"]) =>
  basis === "all" ? `${r.achieved} of ${r.required} achieved` : r.gap === 0 ? "on the line" : `${Math.abs(r.gap)} points ${r.gap < 0 ? (basis === "expected" ? "behind" : "under the median") : basis === "expected" ? "ahead" : "over the median"}`

export function WhoIsBehindCard({ model, scope, split, onSplit, className, partial }: { model: DashboardModel; scope: LabScope; split: Split; onSplit: (s: Split) => void; className?: string; partial?: boolean }) {
  const basis = model.basis
  const suppressed = partial || model.pop.medianSuppressed
  const { lanes, hidden } = laneOf(model.pop.rows, split)
  const flagWord = conditionLabel(basis)
  const stripLanes: StripLane[] = lanes.map((l) => ({
    id: l.id,
    label: l.label,
    marks: l.rows.map((r) => ({ id: r.id, label: r.name, value: basis === "all" ? r.pct : r.gap, flagged: !suppressed && r.behind, text: `${r.name}, ${r.cohort}: ${r.collected} of ${r.needed} required evaluations counted, ${gapText(r, basis)}${!suppressed && r.behind ? `. ${flagWord}` : ""}`, href: studentHref(scope, r.id) })),
  }))
  const domain = niceDomain(model.pop.rows.map((r) => (basis === "all" ? r.pct : r.gap)), basis === "all")
  const n = model.pop.rows.length
  const summary = suppressed
    ? "Each dot is a student. Peer comparison is switched off for this scope."
    : `${model.behind.length === 0 ? `All ${n} students are on track.` : `${model.behind.length} of ${n} students are ${basisPhrase(basis)}.`} ${basis === "all" ? "Each dot is a student, placed by the share of required evaluations counted." : `Each dot is a student; left of the line is ${basis === "expected" ? "behind the term clock" : "under the scope median"}.`}`
  const visibleSummary = suppressed
    ? "Each dot is a student. Peer comparison is switched off for this scope."
    : basis === "all"
      ? "Each dot is a student, placed by the share of required evaluations counted."
      : `Each dot is a student; left of the line is ${basis === "expected" ? "behind" : "under the median"}.`
  const zero = basis === "expected" ? { value: 0, label: "On pace" } : basis === "median" && !suppressed ? { value: 0, label: "Median" } : undefined
  return (
    <div className={className} data-region="who-behind" data-chart>
    <ChartCard title="Students behind, by gap" description={visibleSummary}>
      <div className="flex flex-col gap-2" id="who-behind">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <StripLegend behindLabel={flagWord} zeroLabel={zero ? (basis === "expected" ? "Expected now" : "Scope median") : undefined} />
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground" aria-hidden="true">Split by</span>
            <ViewSegmentedControl aria-label="Split by" value={split} onValueChange={(v) => onSplit(v as Split)} options={SPLIT_OPTIONS} />
          </div>
        </div>
        {suppressed ? <LocalBanner variant="info">{`Too few students in this scope to compare (${partial ? 4 : n}). Widen the scope or compare with Expected now.`}</LocalBanner> : null}
        <GapStrip summary={summary} lanes={stripLanes} domain={domain} zero={zero} tickFormat={(v) => (basis === "all" ? `${v}%` : v > 0 ? `+${v}` : `${v}`)} showLaneLabels={split !== "none"} flaggedWord={basis === "expected" ? "behind" : basis === "median" ? "under the median" : "not complete"} />
        <p className="text-xs text-muted-foreground" data-viz-label>{basis === "all" ? "Share counted" : basis === "expected" ? "Points against expected now" : "Points against the median"}</p>
        {hidden.length > 0 ? <p className="text-xs text-muted-foreground" data-hidden-subgroups>{`${plural(hidden.length, "group", "groups")} under 5 students hidden: ${hidden.map((h) => `${h.label} (${h.n})`).join(", ")}.`}</p> : null}
        <ShowAsTable label="Students in scope, as a table">
          <Table scrollLabel="Students in scope">
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Cohort</TableHead>
                <TableHead className="text-right">Counted</TableHead>
                <TableHead className="text-right">{basis === "all" ? "Achieved" : "Gap"}</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {model.pop.rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell><Link className={LINK_IN_TABLE} href={studentHref(scope, r.id)}>{r.name}</Link></TableCell>
                  <TableCell>{r.cohort}</TableCell>
                  <TableCell className="text-right tabular-nums">{`${r.collected} of ${r.needed}`}</TableCell>
                  <TableCell className="text-right tabular-nums">{basis === "all" ? `${r.achieved} of ${r.required}` : r.gap > 0 ? `+${r.gap}` : r.gap}</TableCell>
                  <TableCell>{!suppressed && r.behind ? <BehindBadge label={flagWord} /> : <span className="text-sm text-muted-foreground">On track</span>}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ShowAsTable>
      </div>
    </ChartCard>
    </div>
  )
}

// ---------------------------------------------------------------------------------------------------------------------
// Blocking skill

/** A mark at a share of the track (percent units, so the row stretches without distorting the glyph). */
function RankMark({ pct, flagged }: { pct: number; flagged: boolean }) {
  return (
    <svg x={`${pct}%`} y="9" width="1" height="1" overflow="visible" aria-hidden="true">
      {flagged ? (
        <rect x={-5} y={-5} width={10} height={10} rx={1.2} fill={VIZ.behind} stroke="var(--card)" strokeWidth={1.5} transform="rotate(45)" />
      ) : (
        <circle r={5} fill={VIZ.on} stroke="var(--card)" strokeWidth={1.5} />
      )}
    </svg>
  )
}

const niceTicks = (max: number): number[] => {
  const step = max <= 10 ? 2 : max <= 30 ? 5 : max <= 60 ? 10 : 20
  const out: number[] = []
  for (let v = 0; v <= max - step * 0.75; v += step) out.push(v)
  return [...out, max]
}

const RANK_GRID = "grid grid-cols-[minmax(0,11rem)_minmax(0,1fr)_2.5rem] gap-3"

export function BlockerCard({ model, scope, top = 5, className }: { model: DashboardModel; scope: LabScope; top?: number; className?: string }) {
  const list = model.blockers
  const shown = list.slice(0, top)
  const flagged = model.behind.length
  const scaleMax = Math.max(1, flagged, ...shown.map((b) => b.students))
  const best = shown[0]?.students ?? 0
  const tied = list.filter((b) => b.students === best).length
  const summary =
    list.length === 0
      ? `No required ${skillNoun()} is holding anyone back in this scope.`
      : tied > 1
        ? `${tied} ${skillNounPlural()} tie at ${best} of the ${flagged} students flagged.`
        : `${shown[0].name} is short for ${best} of the ${flagged} students flagged.`
  const ticks = niceTicks(scaleMax)
  // Ties are stated, not ranked (strategy/07 A9, Von Restorff): one row per distinct value, the top value alone highlighted.
  const groups: Array<{ value: number; rows: BlockerRow[] }> = []
  for (const b of list) {
    const last = groups[groups.length - 1]
    if (last && last.value === b.students) last.rows.push(b)
    else if (groups.length < top) groups.push({ value: b.students, rows: [b] })
    else break
  }
  return (
    <div className={className} data-region="blockers" data-chart>
    <ChartCard title={`Required ${skillNounPlural()} holding students back`} description={summary}>
      <div className="flex flex-col gap-4" id="blockers">
        {shown.length === 0 ? null : (
          <div className="flex flex-col gap-1">
            <ol className="flex flex-col" aria-label={`Required ${skillNounPlural()} by students short, top ${groups.length} values of ${list.length} ${skillNounPlural()}`}>
              {groups.map((g, gi) => {
                const pct = (g.value / scaleMax) * 100
                const one = g.rows.length === 1 ? g.rows[0] : null
                return (
                  <li key={g.value} className={`${RANK_GRID} items-center py-1.5`} data-tie={one ? undefined : g.rows.length}>
                    <div className="min-w-0">
                      {one ? (
                        <>
                          <Link className={`${LINK_IN_TABLE} block truncate text-sm`} title={`${one.name}, ${one.category}`} href={drillHref(scope, { list: "students", cond: "behind", skill: one.skillId, from: "blockers" })} aria-label={`${one.name}, ${one.category}: short for ${one.students} of the ${flagged} students flagged. Open the list`}>
                            {one.name}
                          </Link>
                        </>
                      ) : (
                        <>
                          <span className="block text-sm font-medium text-foreground">{`${g.rows.length} ${skillNounPlural()} tie`}</span>
                          <span className="block truncate text-xs text-muted-foreground" title={g.rows.map((r) => r.name).join(", ")} data-viz-label>{`${g.rows.slice(0, 2).map((r) => r.name).join(", ")}, +${g.rows.length - 2}`}</span>
                        </>
                      )}
                    </div>
                    <svg className="h-[18px] w-full overflow-visible" aria-hidden="true">
                      <line x1="0" x2="100%" y1="9" y2="9" stroke={VIZ.track} strokeWidth="1" />
                      <line x1="0" x2={`${pct}%`} y1="9" y2="9" stroke={VIZ.on} strokeWidth="2" />
                      <RankMark pct={pct} flagged={gi === 0} />
                    </svg>
                    <span className="text-right text-sm font-medium tabular-nums text-foreground">{g.value}</span>
                  </li>
                )
              })}
            </ol>
            <div className={RANK_GRID} aria-hidden="true">
              <span />
              <svg className="h-4 w-full overflow-visible">
                {ticks.map((t) => (
                  <text key={t} x={`${(t / scaleMax) * 100}%`} y="12" fontSize="12" textAnchor={t === 0 ? "start" : t === scaleMax ? "end" : "middle"} fill={VIZ.tick}>{t}</text>
                ))}
              </svg>
              <span />
            </div>
            <p className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground" data-viz-label>
              <span>{`Students short, of ${flagged} flagged`}</span>
              <span className="flex items-center gap-1.5"><DiamondGlyph />Blocks the most</span>
            </p>
          </div>
        )}
        {list.length === 0 ? null : <ShowAsTable label={`Blocking ${skillNounPlural()}, as a table`} openLabel={`See all ${list.length}`}>
          <Table scrollLabel={`Blocking ${skillNounPlural()}`}>
            <TableHeader>
              <TableRow>
                <TableHead>{capitalize(skillNoun())}</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Students flagged and short</TableHead>
                <TableHead className="text-right">Required for</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.map((b) => (
                <TableRow key={b.skillId}>
                  <TableCell><Link className={LINK_IN_TABLE} href={drillHref(scope, { list: "students", cond: "behind", skill: b.skillId, from: "blockers" })}>{b.name}</Link></TableCell>
                  <TableCell>{b.category}</TableCell>
                  <TableCell className="text-right tabular-nums">{b.students}</TableCell>
                  <TableCell className="text-right tabular-nums">{b.of}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ShowAsTable>}
      </div>
    </ChartCard>
    </div>
  )
}

// ---------------------------------------------------------------------------------------------------------------------
// Stuck requests by site

/** Graded neutrals for age; the oldest band is the darkest neutral and wears an amber outline. */
function AgeSwatch({ i }: { i: number }) {
  return <span className="inline-block size-3 rounded-sm" style={{ background: VIZ.age[i], boxShadow: i === 3 ? `inset 0 0 0 1.5px ${VIZ.ageEdge}` : undefined }} aria-hidden="true" />
}

function AgeBar({ buckets, total, max, label }: { buckets: number[]; total: number; max: number; label: string }) {
  return (
    <div className="flex h-3.5 gap-0.5" style={{ width: `${Math.max(6, (total / max) * 100)}%` }} role="img" aria-label={`${label}: ${AGE_BUCKETS.map((b, i) => `${buckets[i]} ${b.label}`).join(", ")}`}>
      {buckets.map((v, i) =>
        v === 0 ? null : (
          <span key={i} className="h-full rounded-sm" style={{ flexGrow: v, flexBasis: 0, minWidth: 4, background: VIZ.age[i], boxShadow: i === 3 ? `inset 0 0 0 1.5px ${VIZ.ageEdge}` : undefined }} />
        ),
      )}
    </div>
  )
}

export function SitesCard({ model, scope, className }: { model: DashboardModel; scope: LabScope; className?: string }) {
  const s = model.sites
  const maxTotal = Math.max(1, ...s.top.map((r) => r.total))
  const first = s.top[0]
  const summary = s.requests === 0 || !first ? "No requests are waiting with evaluators in this scope." : `The oldest wait at ${first.name}: ${first.total} requests, the oldest ${first.oldest} days.`
  return (
    <div className={className} data-region="sites" data-chart>
    <ChartCard title="Requests waiting, by site" description={summary}>
      <div className="flex flex-col gap-4" id="sites">
        <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground" aria-label="Legend">
          {AGE_BUCKETS.map((b, i) => (
            <li key={b.id} className="flex items-center gap-1.5">
              <AgeSwatch i={i} />
              {b.label}
            </li>
          ))}
        </ul>
        <ul className="flex flex-col gap-3" aria-label="Sites with the oldest requests">
          {s.top.map((row) => (
            <li key={row.siteId} className="grid grid-cols-[minmax(0,14rem)_minmax(0,1fr)] items-center gap-4">
              <div className="min-w-0">
                <Link className={`${LINK_IN_TABLE} block truncate text-sm`} href={drillHref(scope, { list: "requests", cond: "waiting", siteId: row.siteId, from: "sites" })}>{row.name}</Link>
                <span className="block text-xs tabular-nums text-muted-foreground">{`${row.total} waiting, oldest ${row.oldest} days`}</span>
              </div>
              <AgeBar buckets={row.buckets} total={row.total} max={maxTotal} label={`${row.name}, requests by age`} />
            </li>
          ))}
        </ul>
        {s.other.sites > 0 ? (
          <p className="text-sm text-foreground">
            <Link className={LINK} href={drillHref(scope, { list: "sites", from: "sites" })}>{`All ${s.sites} sites`}</Link>
            {`: the other ${s.other.sites} hold ${s.other.requests} requests, ${s.other.old} at 15 days or more.`}
          </p>
        ) : null}
        {s.noSite > 0 ? <p className="text-xs text-muted-foreground" data-partial="no-site">{`${plural(s.noSite, "request has", "requests have")} no site recorded and ${s.noSite === 1 ? "is" : "are"} not drawn.`}</p> : null}
        <ShowAsTable label="Requests by site and age, as a table">
          <Table scrollLabel="Requests by site and age">
            <TableHeader>
              <TableRow>
                <TableHead>Site</TableHead>
                {AGE_BUCKETS.map((b) => <TableHead key={b.id} className="text-right">{b.label}</TableHead>)}
                <TableHead className="text-right">All</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {s.top.map((row) => (
                <TableRow key={row.siteId}>
                  <TableCell>{row.name}</TableCell>
                  {row.buckets.map((v, i) => <TableCell key={i} className="text-right tabular-nums">{v}</TableCell>)}
                  <TableCell className="text-right tabular-nums">{row.total}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ShowAsTable>
      </div>
    </ChartCard>
    </div>
  )
}

// ---------------------------------------------------------------------------------------------------------------------
// Needs you

/** First run: only set-up rows apply (06 section 4.3, "worklist shows the set-up rows"). */
export const setupOnly = (m: DashboardModel): DashboardModel => ({ ...m, needsYou: m.needsYou.filter((r) => r.key === "unconfigured") })

export function NeedsYou({ model, className }: { model: DashboardModel; className?: string }) {
  return (
    <Card className={className} id="needs-you" data-region="needs-you">
      <CardContent className="flex flex-col gap-3">
        <h2 className="flex items-baseline gap-2 text-base font-semibold text-foreground">Needs you<span className="text-sm font-normal tabular-nums text-muted-foreground">{fmt(model.needsYou.length)}</span></h2>
        <DataRowList
          rows={model.needsYou}
          getRowId={(r) => r.key}
          virtualizeThreshold={0}
          ariaLabel="Needs you, oldest first"
          className="flex flex-col divide-y divide-border p-0"
          rowClassName="py-2 first:pt-0 last:pb-0"
          emptyState={<p className="text-sm text-muted-foreground">Nothing needs you right now.</p>}
          renderRow={(r) => (
            <div className="flex items-start gap-3">
              <i className={`fa-light ${r.tone === "attention" ? "fa-triangle-exclamation" : "fa-circle-info"} mt-0.5 text-muted-foreground`} aria-hidden="true" />
              <Link href={r.href} className={`${LINK} text-sm`}>{r.text}</Link>
            </div>
          )}
        />
      </CardContent>
    </Card>
  )
}

// ---------------------------------------------------------------------------------------------------------------------
// States

export function LoadingShape() {
  return (
    <div role="status" aria-busy="true" aria-label="Loading dashboard" className="flex flex-col gap-4" data-loading>
      <span className="sr-only">Loading dashboard</span>
      <Skeleton aria-hidden="true" className="h-28 w-full" />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => <Skeleton key={i} aria-hidden="true" className="h-16" />)}
      </div>
      <div className="grid gap-4 lg:grid-cols-12">
        <Skeleton aria-hidden="true" className="h-64 lg:col-span-7" />
        <Skeleton aria-hidden="true" className="h-64 lg:col-span-5" />
      </div>
      <div className="grid gap-4 lg:grid-cols-12">
        <Skeleton aria-hidden="true" className="h-48 lg:col-span-8" />
        <div className="flex flex-col gap-2 lg:col-span-4">
          {Array.from({ length: 5 }, (_, i) => <Skeleton key={i} aria-hidden="true" className="h-8 w-full" />)}
        </div>
      </div>
    </div>
  )
}

/** Per-card error (06 section 4.3): what failed, what is kept, Try again. Other cards still render. */
export function CardError({ title, onRetry, className }: { title: string; onRetry: () => void; className?: string }) {
  return (
    <Card className={className} role="group" aria-label={title} data-region="card-error">
      <CardContent className="flex flex-col gap-3">
        <h2 className="text-base font-semibold text-foreground">{title}</h2>
        <LocalBanner variant="error" title="Pace could not be calculated" retry={{ label: "Try again", onClick: onRetry }}>
          The other figures are current.
        </LocalBanner>
      </CardContent>
    </Card>
  )
}

/** First run: no students yet. The hero becomes the next set-up step (06 section 4.3). */
export function SetupHero({ termName }: { termName: string }) {
  return (
    <Card data-dashboard-hero="no-data" id="hero" data-region="verdict">
      <CardContent className="flex flex-wrap items-center gap-x-5 gap-y-3">
        <span className="flex size-14 shrink-0 items-center justify-center rounded-lg bg-muted text-foreground" aria-hidden="true">
          <i className="fa-light fa-user-plus text-xl" />
        </span>
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <h2 className="text-base font-semibold text-foreground">{`No students in ${termName} yet`}</h2>
          <p className="text-sm text-foreground">Import your cohort to see who is behind.</p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href="/lab/admin/lists-cohorts">Import students</Link>
        </Button>
      </CardContent>
    </Card>
  )
}


/** Error state for a drill list (?state=error, or the bounded loading fallback). States that nothing changed and offers a retry. */
export function ListLoadError({ onRetry }: { onRetry: () => void }) {
  return (
    <LocalBanner variant="error" title="This list did not load" retry={{ label: "Try again", onClick: onRetry }} data-list-error>
      Nothing was changed.
    </LocalBanner>
  )
}
