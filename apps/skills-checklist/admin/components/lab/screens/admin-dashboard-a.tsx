"use client"

/**
 * Admin Dashboard, variant A: status board ("is anything off?"), concept A in docs/knowledge/design/dashboard-concepts.
 * Four figures with mini charts, then every view in three groups ordered by urgency (Romit 2026-10-27: no hidden views,
 * plain titles, cover what the dashboard should answer):
 *   1. Students at risk: behind by cohort (Compare with sits on this tile, the figure it changes), skills holding students
 *      back, sections furthest behind, placements ending soon, required this term and to graduate, evaluations per week.
 *   2. Work queues: oldest requests by site, days awaiting approval, returned and long-waiting requests, evaluators not yet
 *      verified.
 *   3. Set-up and coverage: skills set-up (REQ IM-10), counted evidence by setting (SC-12), attainment by tag (RP-04).
 * The first viewport (density budget) holds the figure strip and the first row of three tiles; everything else scrolls.
 * Every figure comes from the single sources (lib/lab/dashboard.ts, lib/v2/placements.ts, lib/v2/facts.ts,
 * lib/lab/attainment.ts). Demo states: ?state=loading|empty|clear|error|partial|stale.
 */
import * as React from "react"
import { NEW_EVALUATORS_HREF } from "@/lib/lab/admin-ia"
import { DashboardPage, type DashboardContext } from "@/components/lab/dashboard/frame"
import { CardError, NeedsYou, SetupHero, setupOnly } from "@/components/lab/dashboard/cards"
import {
  ApprovalAgeTile,
  BlockingTile,
  FlowTile,
  PlacementsEndingTile,
  RequiredSetsTile,
  SectionsTile,
  SettingTile,
  SetupTile,
  SitesTile,
  StatusFigures,
  StuckRequestsTile,
  TagsTile,
  UnverifiedEvaluatorsTile,
  WhereBehindTile,
} from "@/components/lab/dashboard/status-tiles"
import { BASIS_LABEL, LAB_BASE, behindSeries, buildExceptions, countedBySetting, countedPerWeek, sectionGaps, studentHref } from "@/lib/lab/dashboard"
import { attainmentHref, buildAttainment } from "@/lib/lab/attainment"
import { BASES, withBasis, type Basis } from "@/lib/lab/scope"
import { facts } from "@/lib/v2/facts"
import { PLACEMENT_ENDING_DAYS, daysLeftIn, placementsEnding } from "@/lib/v2/placements"
import { queueItems } from "@/lib/v2/queue"
import { DEMO_TODAY } from "@/lib/v2/seed-core"
import { TYPE } from "@/components/lab/type-scale"

const daysSince = (iso: string) => Math.round((Date.parse(`${DEMO_TODAY}T00:00:00Z`) - Date.parse(`${iso.slice(0, 10)}T00:00:00Z`)) / 86_400_000)

/** One group of tiles under a plain section heading (gap-8 between groups, gap-4 inside). */
function Group({ id, title, cols = 3, region, children }: { id: string; title: string; cols?: 3 | 4; region?: string; children: React.ReactNode }) {
  return (
    <section aria-labelledby={id} className="flex flex-col gap-3" data-region={region}>
      <h2 id={id} className={TYPE.section}>{title}</h2>
      <div className={`grid grid-cols-1 gap-4 md:grid-cols-2 ${cols === 4 ? "xl:grid-cols-4" : "xl:grid-cols-3"}`}>{children}</div>
    </section>
  )
}

function Board({ ctx }: { ctx: DashboardContext }) {
  const { data, model, scope, demo, clearDemo, setScope } = ctx
  const series = React.useMemo(() => (model.kind === "clear" && demo === "clear" ? null : { behind: behindSeries(data, scope) }), [data, scope, model.kind, demo])
  const gaps = React.useMemo(() => sectionGaps(model.pop), [model.pop])
  const weeks = React.useMemo(() => countedPerWeek(model.pop), [model.pop])
  const settings = React.useMemo(() => countedBySetting(model.pop), [model.pop])
  const approvalDays = React.useMemo(() => queueItems(data).filter((q) => model.pop.ids.has(q.studentId)).flatMap((q) => q.evaluations.map(() => daysSince(q.since))), [data, model.pop.ids])
  const exceptions = React.useMemo(() => buildExceptions(data, model), [data, model])
  const f = React.useMemo(() => facts(data, scope), [data, scope])
  const ending = React.useMemo(() => {
    const behind = new Set(model.behind.map((r) => r.id))
    return placementsEnding(data, model.pop.ids).map((p) => ({ id: p.id, studentId: p.studentId, student: data.people.find((x) => x.id === p.studentId)?.name ?? p.studentId, location: p.location, daysLeft: daysLeftIn(p), behind: behind.has(p.studentId) }))
  }, [data, model.pop.ids, model.behind])
  const thisTerm = React.useMemo(() => buildAttainment(data, scope), [data, scope])
  const toGraduate = React.useMemo(() => buildAttainment(data, scope, DEMO_TODAY, { basis: "toGraduate" }), [data, scope])
  const termSet = { achieved: model.pop.rows.reduce((t, r) => t + r.achieved, 0), total: model.pop.rows.reduce((t, r) => t + r.required, 0) }
  const stud = (id: string) => studentHref(scope, id)
  // Compare with sits on the tile whose figure it changes (Romit 2026-10-27); the basis itself stays an open seam (D-X10).
  const compare = { label: "Compare with", value: model.basis, options: BASES.map((b) => ({ value: b, label: BASIS_LABEL[b] })), onChange: (v: string) => setScope(withBasis(scope, v as Basis)) }

  return (
    <div className="flex flex-col gap-8">
      <StatusFigures model={model} series={series} />
      <Group id="group-risk" title="Students at risk" region="tiles">
        {demo === "error" ? <CardError title="Students behind, by cohort" onRetry={clearDemo} /> : <WhereBehindTile model={model} scope={scope} partial={demo === "partial"} selector={compare} />}
        <BlockingTile model={model} scope={scope} />
        <SectionsTile model={model} scope={scope} gaps={gaps} />
        <PlacementsEndingTile rows={ending} days={PLACEMENT_ENDING_DAYS} scope={scope} studentHref={stud} />
        <RequiredSetsTile term={termSet} graduate={{ achieved: toGraduate.totals.achieved, total: toGraduate.total }} termHref={attainmentHref(scope, { required: "term" })} graduateHref={attainmentHref(scope, { required: "graduate" })} />
        <FlowTile scope={scope} weeks={weeks} />
      </Group>
      <Group id="group-queues" title="Work queues" cols={4}>
        <SitesTile model={model} scope={scope} />
        <ApprovalAgeTile model={model} scope={scope} days={approvalDays} />
        <StuckRequestsTile returned={exceptions.returned} old={exceptions.old} scope={scope} studentHref={stud} />
        <UnverifiedEvaluatorsTile rows={exceptions.unverified} total={f.unverifiedEvaluators} href={NEW_EVALUATORS_HREF} />
      </Group>
      <Group id="group-setup" title="Set-up and coverage">
        <SetupTile configured={f.skillsConfigured} total={f.skillsTotal} inactive={f.skillsInactive} href={`${LAB_BASE}/skills-library?filter=needs-configuration`} />
        <SettingTile rows={settings} href={attainmentHref({ ...scope, setting: "clinical" })} />
        <TagsTile rows={thisTerm.tagRows} multiTagged={thisTerm.multiTagged} href={attainmentHref(scope, { tab: "tags" })} />
      </Group>
    </div>
  )
}

export function AdminDashboardA() {
  return (
    <DashboardPage variant="A" basisInChart>
      {(ctx) =>
        ctx.demo === "empty" ? (
          <div className="flex flex-col gap-4">
            <SetupHero termName={ctx.model.term.name} />
            <NeedsYou model={setupOnly(ctx.model)} />
          </div>
        ) : (
          <Board ctx={ctx} />
        )
      }
    </DashboardPage>
  )
}
