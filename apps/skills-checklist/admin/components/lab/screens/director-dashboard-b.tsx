"use client"

/**
 * Director Dashboard, variant B: blockers first. Which required skill stands between students and graduation?
 * Regions: header, scope bar, four figures (the graduation bands: complete, one skill short, short, far behind), the blocker ranking (skills grouped by the
 * exact students they block, so a tie reads as one line, strategy/07 Von Restorff), and the requests already waiting on a
 * blocking skill. The ranking is a dot plot on a 0 to cohort-size track, never a progress bar; every count links to its list.
 */
import { TYPE } from "@/components/lab/type-scale"
import { capitalize, skillNoun, skillNounPlural } from "@/lib/lab/terms"
import * as React from "react"
import { LabLink as Link } from "@/components/lab/lab-bar/lab-link"
import { Card, CardContent } from "@exxatdesignux/ui/components/ui/card"
import { LabKeyMetrics as KeyMetrics, type MetricItem } from "@/components/lab/lab-bar/lab-key-metrics"
import { LocalBanner } from "@exxatdesignux/ui/components/ui/banner"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@exxatdesignux/ui/components/ui/table"
import { Tip } from "@exxatdesignux/ui/components/ui/tip"
import { DirectorPage } from "@/components/lab/director/frame"
import { CountLink, LINK } from "@/components/lab/director/parts"
import { DiamondGlyph, VIZ } from "@/components/lab/viz"
import { GRADUATION_LIST, GRADUATION_STAGES, GRADUATION_STAGE_LABEL, detailHref, evidenceHref, listHref, plural, type BlockerGroup, type Readiness } from "@/lib/lab/director"
import type { LabScope } from "@/lib/lab/scope"

const AGING = 8
const SHOWN = 6

function Figures({ m, scope }: { m: Readiness; scope: LabScope }) {
  // The four graduation bands (D-X11), each linked to the list with the same predicate, so figure and list are equal.
  const metrics: MetricItem[] = GRADUATION_STAGES.map((st) => ({
    id: st,
    label: GRADUATION_STAGE_LABEL[st],
    value: String(m.graduation[st]),
    delta: "",
    trend: "neutral",
    description: `of ${m.rows.length}`,
    href: listHref(scope, { list: GRADUATION_LIST[st] }),
  }))
  return (
    <section aria-label="Graduating students by readiness" data-figure="kpis" data-region="figures">
      <KeyMetrics variant="flat" size="sm" showHeader={false} metrics={metrics} metricsSingleRow className="px-0 lg:px-0" />
    </section>
  )
}

const ids = (g: BlockerGroup) => g.skills.map((k) => k.id).join(",")

function groupLabel(g: BlockerGroup): React.ReactNode {
  if (g.skills.length === 1) return g.skills[0].name
  return (
    <Tip label={g.skills.map((k) => k.name).join(", ")}>
      <span tabIndex={0} className="cursor-default rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring">{`${g.skills.length} ${skillNounPlural()}, the same ${g.students.length === 1 ? "student" : `${g.students.length} students`}`}</span>
    </Tip>
  )
}

function Blockers({ m, scope }: { m: Readiness; scope: LabScope }) {
  const n = m.rows.length
  const shown = m.blockers.slice(0, SHOWN)
  return (
    <Card className="self-start py-0 xl:col-span-7" data-region="blockers">
      <CardContent className="flex flex-col gap-3 py-4">
        <h2 className={TYPE.card}>What blocks graduation</h2>
        {shown.length === 0 ? (
          <p className="text-sm text-muted-foreground">{`No required ${skillNoun()} blocks anyone in this scope.`}</p>
        ) : (
          <div data-chart aria-label={`Required ${skillNounPlural()} not achieved, grouped by the students they block. Top: ${shown[0].skills.map((k) => k.name).join(", ")}, ${plural(shown[0].students.length, "student", "students")}.`}>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[38%]">{capitalize(skillNoun())}</TableHead>
                  <TableHead>{`Students blocked, of ${n}`}</TableHead>
                  <TableHead className="text-end">Waiting</TableHead>
                  <TableHead className="text-end">
                    <Tip label="Students for whom this is the only gap">
                      <span tabIndex={0} className="rounded-sm underline decoration-dotted underline-offset-2 outline-none focus-visible:ring-2 focus-visible:ring-ring">Only gap</span>
                    </Tip>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {shown.map((g, i) => {
                  const k = g.students.length
                  const at = n ? (k / n) * 100 : 0
                  return (
                    <TableRow key={g.key} data-flagged={i === 0 || undefined}>
                      <TableCell>
                        <span className="flex min-w-0 items-center gap-2">
                          {i === 0 ? <DiamondGlyph /> : <span className="inline-block w-2.5" aria-hidden="true" />}
                          <span className="break-words text-sm text-foreground">{groupLabel(g)}</span>
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="flex items-center gap-3">
                          <span className="relative h-3 min-w-24 flex-1" aria-hidden="true">
                            <span className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2" style={{ background: VIZ.track }} />
                            <span className="absolute top-1/2 size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full" style={{ left: `${at}%`, background: i === 0 ? VIZ.behind : "var(--muted-foreground)" }} />
                          </span>
                          <CountLink n={k} href={listHref(scope, { skill: ids(g) })} label={`${k} students blocked by ${g.skills.length === 1 ? g.skills[0].name : `${g.skills.length} ${skillNounPlural()}`}. Open the list`} className="w-6 text-end" />
                        </span>
                      </TableCell>
                      <TableCell className="text-end">
                        <CountLink n={g.waiting} href={listHref(scope, { list: "waiting", skill: ids(g) })} label={`${g.waiting} with a request waiting. Open the list`} />
                      </TableCell>
                      <TableCell className="text-end">
                        <CountLink n={g.onlyGap} href={listHref(scope, { list: "only", skill: ids(g) })} label={`${g.onlyGap} for whom this is the only gap. Open the list`} />
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function Waiting({ m, scope, failed }: { m: Readiness; scope: LabScope; failed: boolean }) {
  const rows = m.rows.flatMap((r) => r.open.filter((o) => o.skillIds.some((id) => r.gaps.some((g) => g.skillId === id))).map((o) => ({ r, o }))).sort((a, b) => b.o.days - a.o.days)
  return (
    <Card className="self-start py-0 xl:col-span-5" data-region="waiting">
      <CardContent className="flex flex-col gap-3 py-4">
        <h2 className={TYPE.card}>{`Requests waiting on a blocking ${skillNoun()}`}</h2>
        {failed ? (
          <p className="text-sm text-muted-foreground">Open requests could not load. The ranking is current.</p>
        ) : rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">{`No request is open for a blocking ${skillNoun()}.`}</p>
        ) : (
          <ul className="flex flex-col divide-y divide-border">
            {rows.slice(0, SHOWN).map(({ r, o }) => (
              <li key={o.submissionId} className="flex items-start justify-between gap-3 py-2 text-sm">
                {/* Skill and person names wrap, never cut (anatomy A12): the request line may run to two lines. */}
                <span className="flex min-w-0 flex-col">
                  <Link className={`${LINK} break-words`} href={detailHref(scope, r.id)}>{r.name}</Link>
                  <Link className="break-words text-xs text-muted-foreground underline-offset-2 hover:underline" href={evidenceHref(scope, r.id, o.skillIds[0])}>{`${o.skillNames.join(", ")} with ${o.evaluator}`}</Link>
                </span>
                <span className={`inline-flex shrink-0 items-center gap-1.5 tabular-nums ${o.days >= AGING ? "font-medium text-foreground" : "text-muted-foreground"}`} aria-label={`${plural(o.days, "day", "days")}${o.days >= AGING ? ", aging" : ""}`}>
                  {o.days >= AGING ? <i className="fa-solid fa-clock text-xs" style={{ color: "var(--lab-viz-behind-ink)" }} aria-hidden="true" /> : null}
                  {plural(o.days, "day", "days")}
                </span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}

export function DirectorDashboardB() {
  return (
    <DirectorPage title="Dashboard" variant="B" pageType="dashboard" announce={(m) => (m.blockers[0] ? `${m.blockers[0].skills[0].name} blocks ${m.blockers[0].students.length} students` : `No required ${skillNoun()} blocks anyone`)}>
      {({ model: m, scope, demo, setParams }) => (
        <div className="flex flex-col gap-4">
          <Figures m={m} scope={scope} />
          {demo === "clear" ? <p className="text-sm text-foreground">{`No required ${skillNoun()} blocks anyone in scope.`}</p> : null}
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
            {demo === "error" ? (
              <div className="xl:col-span-7">
                <LocalBanner variant="warning" title={`Blocking ${skillNounPlural()} could not be calculated`} retry={{ label: "Try again", onClick: () => setParams({ state: null }) }}>
                  The three figures above are current.
                </LocalBanner>
              </div>
            ) : (
              <Blockers m={m} scope={scope} />
            )}
            <Waiting m={m} scope={scope} failed={demo === "partial"} />
          </div>
        </div>
      )}
    </DirectorPage>
  )
}
