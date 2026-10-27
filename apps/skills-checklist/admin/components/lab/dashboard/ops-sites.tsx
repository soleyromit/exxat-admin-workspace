"use client"

/**
 * Concept E, sites and evaluators operations ("where is evidence stuck?"), dashboard-concepts README section 4 E.
 * Three regions under the scope bar: the figure strip (KeyMetrics), sites ranked by the oldest open request (DataTable with
 * an in-cell age bar and an 8-week signed trend), and the evaluators holding the oldest requests (DataRowList).
 * Every count opens a list of the same length in the same scope: a site's Open opens the existing drill list for that site;
 * an evaluator opens their requests on this URL (?list=holder&q=<id>).
 *
 * Encoding: graded neutrals for age (oldest band also outlined in amber, the page's one state hue), neutral sparkline,
 * "Unverified" as glyph + word, never colour alone. Site names, settings and day counts are data, marked data-viz-label so the
 * density audit (strategy/07 K4) does not count them as prose. Reminders are out of scope [REQ section 14], so rows only open records.
 */
import * as React from "react"
import { LabLink as Link } from "@/components/lab/lab-bar/lab-link"
import { Card, CardContent } from "@exxatdesignux/ui/components/ui/card"
import { LabKeyMetrics as KeyMetrics, type MetricItem } from "@/components/lab/lab-bar/lab-key-metrics"
import { MetricMiniChart } from "@exxatdesignux/ui/components/ui/key-metrics-mini-chart"
import { DataTable } from "@exxatdesignux/ui/components/data-table"
import { DataRowList } from "@exxatdesignux/ui/components/data-views/data-row-list"
import { VIZ } from "@/components/lab/viz"
import { LINK } from "@/components/lab/dashboard/cards"
import { AGE_BUCKETS, ageSplit, drillHref, opsHref, plural, type OpsHolder, type OpsModel, type OpsSite } from "@/lib/lab/dashboard"
import type { LabScope } from "@/lib/lab/scope"
import { LINK_IN_TABLE, NUM_LINK } from "@/components/lab/link-styles"
import { EvaluatorNameBadge } from "@/components/lab/status-pill"
import { fmt } from "@/lib/v2/format"

const days = (n: number) => `${n} ${n === 1 ? "day" : "days"}`

// ---------------------------------------------------------------------------------------------------------------------
// Figures

export function OpsFigures({ model, scope }: { model: OpsModel; scope: LabScope }) {
  const oldest = model.sites[0]?.oldest ?? 0
  const metrics: MetricItem[] = [
    {
      id: "waiting",
      label: "Waiting with evaluators",
      value: fmt(model.waiting),
      delta: "",
      trend: "neutral",
      trendPolarity: "lower_is_better",
      description: `At ${plural(model.sites.length, "site", "sites")}, ${plural(model.holders.length, "evaluator", "evaluators")}`,
      href: drillHref(scope, { list: "requests", cond: "waiting", from: "ops" }),
      // How the figure splits by age, youngest first (request history is not dated, so no line is drawn).
      ...(model.waiting > 0 ? { chart: { kind: "bars" as const, series: ageSplit(model.open.map((x) => x.daysWaiting), AGE_BUCKETS.map((b) => ({ label: b.label, min: b.min, max: b.max }))), tone: "info" as const } } : {}),
    },
    { id: "median", label: "Median wait", value: days(model.medianDays), delta: "", trend: "neutral", trendPolarity: "lower_is_better", description: `Oldest ${days(oldest)}`, href: drillHref(scope, { list: "requests", cond: "waiting", from: "ops" }) },
    { id: "old", label: "Waited 15 days or more", value: fmt(model.old), delta: "", trend: "neutral", trendPolarity: "lower_is_better", description: `At ${plural(model.oldSites, "site", "sites")}`, href: drillHref(scope, { list: "requests", cond: "old", from: "ops" }) },
    { id: "unverified", label: "Unverified evaluators", value: fmt(model.unverified.length), delta: "", trend: "neutral", trendPolarity: "lower_is_better", description: model.unverified.length ? `${model.unverifiedOld} hold requests over 8 days` : "None hold requests", href: opsHref(scope, { list: "holders", cond: "unverified" }) },
  ]
  return (
    <section aria-label="Key figures" id="ops-figures" data-figure="kpis" data-region="figures">
      <KeyMetrics variant="flat" size="sm" showHeader={false} metrics={metrics} metricsSingleRow className="px-0 lg:px-0" />
    </section>
  )
}

// ---------------------------------------------------------------------------------------------------------------------
// Age bar

function AgeSwatch({ i }: { i: number }) {
  return <span className="inline-block size-3 rounded-sm" style={{ background: VIZ.age[i], boxShadow: i === 3 ? `inset 0 0 0 1.5px ${VIZ.ageEdge}` : undefined }} aria-hidden="true" />
}

export function OpsAgeBar({ buckets, total, max, label }: { buckets: number[]; total: number; max: number; label: string }) {
  return (
    <div className="flex h-3 gap-0.5" style={{ width: `${Math.max(4, (total / max) * 100)}%` }} role="img" aria-label={`${label}: ${AGE_BUCKETS.map((b, i) => `${buckets[i]} ${b.label}`).join(", ")}`}>
      {buckets.map((v, i) => (v === 0 ? null : <span key={i} className="h-full rounded-sm" style={{ flexGrow: v, flexBasis: 0, minWidth: 3, background: VIZ.age[i], boxShadow: i === 3 ? `inset 0 0 0 1.5px ${VIZ.ageEdge}` : undefined }} />))}
    </div>
  )
}

// ---------------------------------------------------------------------------------------------------------------------
// Sites table

type SiteRow = OpsSite & { kind: "site" | "other"; [k: string]: unknown }

export function SitesTableCard({ model, scope, className }: { model: OpsModel; scope: LabScope; className?: string }) {
  const max = Math.max(1, ...model.top.map((s) => s.open))
  const rows: SiteRow[] = [
    ...model.top.map((s) => ({ ...s, kind: "site" as const })),
    ...(model.other.sites > 0 ? [{ kind: "other" as const, siteId: "other", name: `Other ${model.other.sites} sites`, setting: `${plural(model.other.old, "request", "requests")} at 15 days or more`, open: model.other.open, buckets: model.other.buckets, oldest: model.other.oldest, old: model.other.old, students: model.other.students, signed: [] }] : []),
  ]
  const columns = [
    {
      key: "name",
      label: "Site",
      width: 200,
      cell: (r: SiteRow) => (
        <span className="flex min-w-0 flex-col">
          {r.kind === "site" ? <Link className={`${LINK_IN_TABLE} truncate`} title={r.name} href={drillHref(scope, { list: "requests", cond: "waiting", siteId: r.siteId, from: "ops-sites" })}>{r.name}</Link> : <span className="truncate font-medium text-foreground">{r.name}</span>}
          <span className="truncate text-xs text-muted-foreground" data-viz-label>{r.setting}</span>
        </span>
      ),
    },
    {
      key: "open",
      label: "Open",
      width: 64,
      cell: (r: SiteRow) => (
        <span className="block text-right tabular-nums">
          {r.kind === "site" ? <Link className={NUM_LINK} href={drillHref(scope, { list: "requests", cond: "waiting", siteId: r.siteId, from: "ops-sites" })} aria-label={`${r.name}: ${r.open} open requests. Open the list`}>{fmt(r.open)}</Link> : fmt(r.open)}
        </span>
      ),
    },
    {
      key: "age",
      label: "Age of open requests",
      width: 150,
      cell: (r: SiteRow) => (r.kind === "site" ? <OpsAgeBar buckets={r.buckets} total={r.open} max={max} label={`${r.name}, requests by age`} /> : <span className="text-sm tabular-nums text-muted-foreground">{`${r.buckets.join(", ")} by age`}</span>),
    },
    { key: "oldest", label: "Oldest, days", width: 92, cell: (r: SiteRow) => <span className={`block text-right tabular-nums ${r.oldest >= 30 ? "font-semibold text-foreground" : ""}`} aria-label={days(r.oldest)}>{r.oldest}</span> },
    {
      key: "signed",
      label: "Signed, 8 weeks",
      width: 104,
      cell: (r: SiteRow) =>
        r.kind === "site" ? (
          <span className="block w-20" role="img" aria-label={`${r.name}, evaluations signed per week, oldest first: ${r.signed.map((x) => x.value).join(", ")}`}>
            <MetricMiniChart chart={{ kind: "sparkline", series: r.signed, tone: "info" }} height={24} metricLabel="Signed" />
          </span>
        ) : null,
    },
    { key: "students", label: "Students", width: 76, cell: (r: SiteRow) => <span className="block text-right tabular-nums">{fmt(r.students)}</span> },
  ]
  const first = model.top[0]
  return (
    <Card className={`py-0 ${className ?? ""}`} data-region="sites" role="region" aria-label="Requests waiting, by site">
      <CardContent className="flex flex-col gap-3 py-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-sm font-semibold text-foreground">
            Requests waiting, by site <span className="font-normal text-muted-foreground">Sites, oldest request first</span>
          </h2>
          <Link className={`${LINK} text-sm`} href={drillHref(scope, { list: "sites", from: "ops-sites" })}>{`All ${model.sites.length} sites`}</Link>
        </div>
        {first ? <p className="sr-only">{`${first.name} holds the oldest request, ${days(first.oldest)}, with ${first.open} open.`}</p> : null}
        <DataTable data={rows as never} columns={columns as never} getRowId={(r) => String((r as unknown as SiteRow).siteId)} selectable={false} searchable={false} showQueryControls={false} edgeInset={false} emptyState={<p className="p-4 text-sm text-muted-foreground">No requests are waiting with evaluators in this scope.</p>} />
        <ul className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground" aria-label="Legend">
          {AGE_BUCKETS.map((b, i) => (
            <li key={b.id} className="flex items-center gap-1.5"><AgeSwatch i={i} />{b.label}</li>
          ))}
          <li>{`Full bar: ${plural(max, "request", "requests")}`}</li>
          {model.noSite > 0 ? <li data-partial="no-site">{`${plural(model.noSite, "request has", "requests have")} no site recorded`}</li> : null}
        </ul>
      </CardContent>
    </Card>
  )
}

// ---------------------------------------------------------------------------------------------------------------------
// Evaluators holding the oldest

/** The canonical evaluator-name pill (status-pill.tsx): "Unverified", same word, icon and tone on every screen. */
export function UnverifiedBadge() {
  return <EvaluatorNameBadge verified={false} />
}

export function HoldersCard({ model, scope, top = 6, className }: { model: OpsModel; scope: LabScope; top?: number; className?: string }) {
  const rows = model.holders.slice(0, top)
  return (
    <Card className={`py-0 ${className ?? ""}`} data-region="holders" role="region" aria-label="Evaluators holding the oldest requests">
      <CardContent className="flex flex-col gap-3 py-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-sm font-semibold text-foreground">
            Evaluators holding the oldest requests <span className="font-normal text-muted-foreground">Evaluators</span>
          </h2>
          <Link className={`${LINK} text-sm`} href={opsHref(scope, { list: "holders" })}>{`All ${model.holders.length}`}</Link>
        </div>
        <DataRowList
          rows={rows}
          getRowId={(r: OpsHolder) => r.id}
          virtualizeThreshold={0}
          ariaLabel="Evaluators holding the oldest requests, oldest first"
          className="flex flex-col divide-y divide-border p-0"
          rowClassName="py-2.5 first:pt-0 last:pb-0"
          emptyState={<p className="text-sm text-muted-foreground">No evaluator holds a request in this scope.</p>}
          renderRow={(h: OpsHolder) => (
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 flex-col gap-0.5">
                <span className="flex flex-wrap items-center gap-2">
                  <Link className={`${LINK_IN_TABLE} text-sm`} href={opsHref(scope, { list: "holder", evaluator: h.id })} aria-label={`${h.name}${h.verified ? "" : ", unverified"}: ${h.open} open requests, oldest ${days(h.oldest)}. Open the list`}>{h.name}</Link>
                  {h.verified ? null : <UnverifiedBadge />}
                </span>
                <span className="truncate text-xs text-muted-foreground" title={h.site} data-viz-label>{h.site}</span>
              </div>
              <span className="flex shrink-0 flex-col items-end gap-0.5" data-viz-label>
                <span className={`text-sm tabular-nums ${h.oldest >= 30 ? "font-semibold" : ""} text-foreground`}>{days(h.oldest)}</span>
                <span className="text-xs tabular-nums text-muted-foreground">{`${h.open} open`}</span>
              </span>
            </div>
          )}
        />
      </CardContent>
    </Card>
  )
}
