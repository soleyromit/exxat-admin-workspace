"use client"

/**
 * My progress as a student dashboard (Romit 2026-10-27: "My progress is a dashboard for a student"). The regions answer four
 * questions at a glance: am I on pace this term (burn-up), what is left per course (one square per mandatory skill), what is
 * waiting on someone else (requests with their age), what do I do next (three actions at most).
 * Every chart: a question as its title, a one-line summary as its description, a legend, "Show as table", glyph + word + tone.
 * Viz layer hand-rolled on DS tokens (components/lab/viz.tsx), inside the vendored ChartCard. No progress bars, no red: shortfall
 * is amber. Every figure is a link to where it is acted on and comes from the shared model (lib/lab/student.ts); nothing new is counted.
 */
import * as React from "react"
import { LabLink as Link } from "@/components/lab/lab-bar/lab-link"
import { Card, CardContent } from "@exxatdesignux/ui/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@exxatdesignux/ui/components/ui/table"
import { Tip } from "@exxatdesignux/ui/components/ui/tip"
import { cn } from "@exxatdesignux/ui/lib/utils"
import { ChartCard } from "@/components/chart-card"
import { VIZ } from "@/components/lab/viz"
import { TYPE } from "@/components/lab/type-scale"
import { capitalize, skillNoun, skillNounPlural } from "@/lib/lab/terms"
import { MAPPING_LEVEL_LABEL, RECORD_STATE_META } from "@/lib/v2/labels"
import { REQUIRED_SET_LABEL } from "@/lib/v2/population"
import { ageLabel, courseLevels, shortDate, studentHref, waitingBins, type CourseExpectation, type SkillRecord, type StudentModel, type WaitingRow } from "@/lib/lab/student"
import { FigureLink, LINK_IN_TABLE, NUM_LINK, SectionTitle, ShowAsTable, StateGlyph, stateKey, stateWord, useSvgFont } from "@/components/lab/student/parts"
import { PaceChart } from "@/components/lab/student/progress"

const THIS_TERM = REQUIRED_SET_LABEL.thisTerm

// ---------------------------------------------------------------------------------------------------------------------
// Unit squares: one per skill, state by fill + glyph, waiting or returned by a dashed outline (an overlay, never a state)

function unitStyle(r: SkillRecord): React.CSSProperties {
  const overlay: React.CSSProperties = r.returned ? { outline: `2px dashed ${VIZ.behindEdge}`, outlineOffset: 2 } : r.waiting ? { outline: "2px dashed var(--muted-foreground)", outlineOffset: 2 } : {}
  if (r.state === "achieved") return { ...overlay, background: "var(--foreground)", borderColor: "var(--foreground)" }
  if (r.state === "progress") return { ...overlay, background: `linear-gradient(to top, var(--border-control-3) ${Math.round((r.counted / Math.max(1, r.need)) * 100)}%, var(--background) 0)`, borderColor: "var(--border-control-3)" }
  if (r.state === "dnq") return { ...overlay, background: VIZ.behindWash, borderColor: VIZ.behindEdge }
  return { ...overlay, background: "var(--background)", borderColor: "var(--border-control)", borderStyle: "dashed" }
}

const glyphColor = (r: SkillRecord) => (r.state === "achieved" ? "var(--background)" : r.state === "dnq" ? VIZ.behindInk : "var(--foreground)")

export function unitLabel(r: SkillRecord): string {
  const overlay = r.returned ? ", returned" : r.waiting ? (r.waiting.kind === "approval" ? ", awaiting approval" : `, waiting for ${r.waiting.evaluatorName}`) : ""
  return `${r.name}: ${r.label}${overlay}`
}

export function Unit({ r, studentId, size = 28, decorative = false }: { r: SkillRecord; studentId: string; size?: number; /** Inside a choice label: a plain mark, no link (the label carries the words). */ decorative?: boolean }) {
  const label = unitLabel(r)
  if (decorative) {
    return (
      <span aria-hidden="true" className="relative grid shrink-0 place-items-center rounded-sm border" style={{ width: size, height: size, ...unitStyle(r) }} data-unit={r.state}>
        {r.state === "none" || size < 20 ? null : <i className={cn("fa-solid text-xs", RECORD_STATE_META[stateKey(r.state)].icon)} style={{ color: glyphColor(r) }} aria-hidden="true" />}
      </span>
    )
  }
  return (
    <Tip label={label}>
      <Link
        href={studentHref("skill-detail", { skill: r.id }, studentId)}
        aria-label={label}
        className="relative grid shrink-0 place-items-center rounded-sm border outline-none focus-visible:ring-2 focus-visible:ring-ring"
        style={{ width: size, height: size, ...unitStyle(r) }}
        data-unit={r.state}
      >
        {r.state === "none" ? null : <i className={cn("fa-solid text-xs", RECORD_STATE_META[stateKey(r.state)].icon)} style={{ color: glyphColor(r) }} aria-hidden="true" />}
      </Link>
    </Tip>
  )
}

export function UnitLegend({ className }: { className?: string }) {
  return (
    <ul className={cn("flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground", className)} aria-label="Legend">
      {(["achieved", "progress", "dnq", "none"] as const).map((k) => (
        <li key={k} className="inline-flex items-center gap-1.5"><StateGlyph state={k} className="text-xs" />{stateWord(k)}</li>
      ))}
      <li className="inline-flex items-center gap-1.5">
        <span className="block size-3 rounded-sm" style={{ outline: "2px dashed var(--muted-foreground)", outlineOffset: 1 }} aria-hidden="true" />
        Waiting
      </li>
    </ul>
  )
}

// ---------------------------------------------------------------------------------------------------------------------
// What is left per course: one row per course with mandatory skills, one square per mandatory skill [REQ ST-01; D-X12]

export function courseHref(courseId: string, studentId: string) {
  return studentHref("home", { course: courseId }, studentId)
}

export function CourseStrips({ model, studentId }: { model: StudentModel; studentId: string }) {
  const rows = model.courses.filter((c) => c.mandatory > 0).map((c) => ({ c, units: courseLevels(model, c).mandatory }))
  const others = model.courses.filter((c) => c.mandatory === 0 && c.skills.length > 0)
  const k = model.counts
  // The figure says how many; the description says how to read the squares (said once: "did not count" is Do this next's job).
  const summary = `One square per mandatory ${skillNoun()}.`
  const spoken = `${k.achieved} of ${k.required} ${THIS_TERM.toLowerCase()} achieved across ${rows.length} ${rows.length === 1 ? "course" : "courses"}.${k.doesNotQualify ? ` ${k.doesNotQualify} did not count.` : ""}`
  return (
    <div data-region="courses" className="h-full" data-chart-card>
      <ChartCard title={`Mandatory ${skillNounPlural()} by course`} description={summary} className="h-full">
        <div className="flex flex-col gap-4">
          <p className="flex items-baseline gap-2" data-figure="hero" data-required-achieved={k.achieved} data-required-total={k.required}>
            <Link className={cn(NUM_LINK, TYPE.figure)} href={studentHref("record", {}, studentId)}>{k.achieved}</Link>
            <span className="text-sm text-muted-foreground" data-viz-label>{`of ${k.required} ${THIS_TERM.toLowerCase()}`}</span>
          </p>
          <ul className="flex flex-col divide-y divide-border" role="list" aria-label={spoken} data-chart="course-strips">
            {rows.map(({ c, units }) => (
              <li key={c.id} className="flex flex-col gap-2 py-3 first:pt-0 md:grid md:grid-cols-[minmax(0,15rem)_1fr] md:items-center md:gap-x-6">
                <Link href={courseHref(c.id, studentId)} className={cn(LINK_IN_TABLE, "flex min-w-0 flex-col")}>
                  <span className="font-medium">{c.code}</span>
                  <span className="truncate text-xs text-muted-foreground" data-viz-label>{c.name}</span>
                </Link>
                <span className="flex flex-wrap items-center gap-2.5">
                  {units.map((r) => <Unit key={r.id} r={r} studentId={studentId} size={34} />)}
                  <span className="ms-2 text-sm tabular-nums text-muted-foreground" data-viz-label>{`${c.mandatoryAchieved} of ${c.mandatory}`}</span>
                </span>
              </li>
            ))}
          </ul>
          <UnitLegend />
          {others.length ? (
            <nav aria-label={`Courses with no mandatory ${skillNounPlural()}`} className="flex flex-wrap items-baseline gap-x-3 gap-y-1 border-t border-border pt-3 text-sm" data-course-links>
              <span className="text-muted-foreground">{`No mandatory ${skillNounPlural()}:`}</span>
              {others.map((c) => <Link key={c.id} className={NUM_LINK} href={courseHref(c.id, studentId)}>{c.code}</Link>)}
            </nav>
          ) : null}
          <ShowAsTable label={`Mandatory ${skillNounPlural()} by course, as a table`}>
            <Table>
              <TableHeader><TableRow><TableHead>Course</TableHead><TableHead>{capitalize(skillNoun())}</TableHead><TableHead>State</TableHead></TableRow></TableHeader>
              <TableBody>
                {rows.flatMap(({ c, units }) => units.map((r) => (
                  <TableRow key={`${c.id}-${r.id}`}>
                    <TableCell>{c.code}</TableCell>
                    <TableCell><Link className={LINK_IN_TABLE} href={studentHref("skill-detail", { skill: r.id }, studentId)}>{r.name}</Link></TableCell>
                    <TableCell>{unitLabel(r).slice(r.name.length + 2)}</TableCell>
                  </TableRow>
                )))}
              </TableBody>
            </Table>
          </ShowAsTable>
        </div>
      </ChartCard>
    </div>
  )
}

// ---------------------------------------------------------------------------------------------------------------------
// Am I on pace: counted evaluations against the term clock (burn-up) with the verdict as the summary

export function PaceCard({ model, height = 200, className }: { model: StudentModel; height?: number; className?: string }) {
  const last = [...model.pace].reverse().find((p) => p.counted >= 0)
  return (
    <div data-region="pace" className={cn("h-full", className)} data-chart-card>
      <ChartCard title="Am I on pace?" description={`${model.verdict}, ${model.term.name}.`} className="h-full">
        <div className="flex flex-col gap-3">
          <p className="flex items-baseline gap-2" data-figure="hero">
            <span className={TYPE.figure} style={model.behind ? { color: VIZ.behindInk } : undefined}>{model.row?.collected ?? 0}</span>
            <span className="text-sm text-muted-foreground" data-viz-label>{`of ${model.row?.needed ?? 0} evaluations counted, ${last?.expected ?? 0} expected now`}</span>
          </p>
          <PaceChart model={model} height={height} />
        </div>
      </ChartCard>
    </div>
  )
}

// ---------------------------------------------------------------------------------------------------------------------
// What is waiting on someone else: figures plus the open requests, each with who holds it and for how long [REQ SH-02, SH-04]

export function WaitingCard({ model, rows, studentId, limit = 3 }: { model: StudentModel; rows: WaitingRow[]; studentId: string; limit?: number }) {
  const list = model.counts.waiting === 0 ? [] : rows
  return (
    <Card data-region="waiting" className="h-full gap-0 py-0">
      <CardContent className="flex h-full flex-col gap-3 py-4">
        <SectionTitle>Waiting on others</SectionTitle>
        <div className="flex gap-8">
          <FigureLink href={studentHref("my-requests", {}, studentId)} value={model.counts.waiting} label="Waiting" />
          <FigureLink href={studentHref("my-requests", { show: "returned" }, studentId)} value={model.counts.returned} label="Returned to you" amber />
        </div>
        {list.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nothing is waiting on anyone.</p>
        ) : (
          <ul className="flex flex-col divide-y divide-border border-t border-border">
            {list.slice(0, limit).map((w) => (
              <li key={w.id} className="flex items-start justify-between gap-3 py-2.5">
                <span className="flex min-w-0 flex-col">
                  <span className="truncate text-sm text-foreground">{w.evaluatorName}</span>
                  <span className="truncate text-xs text-muted-foreground" data-viz-label>{w.skillNames.length > 1 ? `${w.skillNames[0]} +${w.skillNames.length - 1}` : w.skillNames[0]}</span>
                </span>
                <span className="inline-flex shrink-0 items-center gap-1.5 text-xs tabular-nums text-muted-foreground" data-viz-label>
                  <i className="fa-light fa-clock" aria-hidden="true" />
                  {w.held ? `Approval, ${ageLabel(w.days)}` : ageLabel(w.days)}
                </span>
              </li>
            ))}
          </ul>
        )}
        {list.length > limit ? <Link className={cn(NUM_LINK, "text-sm")} href={studentHref("my-requests", {}, studentId)}>{`All ${list.length} requests`}</Link> : null}
      </CardContent>
    </Card>
  )
}

// ---------------------------------------------------------------------------------------------------------------------
// How long have requests waited: four age bins, graded neutrals, 15+ outlined amber (strategy/05 aging stacks, one student)

export function AgingCard({ model, rows, studentId }: { model: StudentModel; rows: WaitingRow[]; studentId: string }) {
  const list = model.counts.waiting === 0 ? [] : rows
  const bins = waitingBins(list)
  const W = 320
  const H = 150
  const [svgRef, fs] = useSvgFont(W)
  const pad = { l: 8, r: 8, t: fs + 8, b: fs + 12 }
  const max = Math.max(1, ...bins.map((b) => b.n))
  const bw = (W - pad.l - pad.r) / bins.length
  const y = (v: number) => H - pad.b - (v / max) * (H - pad.t - pad.b)
  const oldest = list[0]
  const summary = list.length === 0 ? "Nothing is waiting." : `${list.length} waiting; oldest ${ageLabel(oldest.days)} with ${oldest.evaluatorName}.`
  return (
    <div data-region="waiting" className="h-full" data-chart-card>
      <ChartCard title="How long have requests waited?" description={summary} className="h-full">
        <div className="flex flex-col gap-3">
          <div className="flex gap-8">
            <FigureLink href={studentHref("my-requests", {}, studentId)} value={model.counts.waiting} label="Waiting" />
            <FigureLink href={studentHref("my-requests", { show: "returned" }, studentId)} value={model.counts.returned} label="Returned to you" amber />
          </div>
          <svg viewBox={`0 0 ${W} ${H}`} ref={svgRef} className="w-full" role="img" aria-label={`Requests by days waiting. ${bins.map((b) => `${b.label}: ${b.n}`).join(", ")}.`} data-chart="aging">
            <line x1={pad.l} x2={W - pad.r} y1={H - pad.b} y2={H - pad.b} stroke={VIZ.zero} strokeWidth={1} />
            {bins.map((b, i) => {
              const x = pad.l + i * bw + bw * 0.2
              const w = bw * 0.6
              const top = y(b.n)
              return (
                <g key={b.id}>
                  {b.n > 0 ? <rect x={x} y={top} width={w} height={H - pad.b - top} rx={2} fill={VIZ.age[i]} stroke={i === 3 ? VIZ.ageEdge : "none"} strokeWidth={i === 3 ? 2 : 0} /> : null}
                  <text x={x + w / 2} y={(b.n > 0 ? top : H - pad.b) - 6} textAnchor="middle" className="fill-foreground" style={{ fontSize: fs }}>{b.n}</text>
                  <text x={x + w / 2} y={H - 6} textAnchor="middle" className="fill-muted-foreground" style={{ fontSize: fs }}>{b.short}</text>
                </g>
              )
            })}
          </svg>
          <p className="text-xs text-muted-foreground" data-viz-label>Days waiting</p>
          <ShowAsTable label="Open requests, as a table">
            <Table>
              <TableHeader><TableRow><TableHead>With</TableHead><TableHead>{capitalize(skillNounPlural())}</TableHead><TableHead className="text-end">Days</TableHead></TableRow></TableHeader>
              <TableBody>
                {list.map((w) => (
                  <TableRow key={w.id}><TableCell>{w.evaluatorName}</TableCell><TableCell className="whitespace-normal">{w.skillNames.join(", ")}</TableCell><TableCell className="text-end tabular-nums">{w.days}</TableCell></TableRow>
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
// Course view (?course=): one course's skills by level, and beside them the same squares and what is waiting [REQ ST-01]

export function CourseSummary({ model, course, studentId }: { model: StudentModel; course: CourseExpectation; studentId: string }) {
  const lv = courseLevels(model, course)
  const others = [...lv.recommended, ...lv.optional]
  const waiting = course.skills.map((x) => model.all.find((r) => r.id === x.id)).filter((r): r is SkillRecord => !!r && !!r.waiting)
  const place = model.placements.find((p) => p.courseId === course.id && p.status === "current") ?? model.placements.find((p) => p.courseId === course.id)
  // The list beside it already says "1 of 4 achieved" per level; the card says how to read the squares (say it once).
  const summary = lv.mandatory.length ? `One square per ${skillNoun()}, by level.` : `No mandatory ${skillNounPlural()} on ${course.code}.`
  return (
    <div data-region="course-summary" data-chart-card>
      <ChartCard title={`${course.code} at a glance`} description={summary}>
        <div className="flex flex-col gap-4" data-chart="course-units">
          {lv.mandatory.length ? (
            <div className="flex flex-col gap-2">
              <p className="text-xs text-muted-foreground" data-viz-label>{MAPPING_LEVEL_LABEL.mandatory}</p>
              <span className="flex flex-wrap gap-2.5">{lv.mandatory.map((r) => <Unit key={r.id} r={r} studentId={studentId} size={32} />)}</span>
            </div>
          ) : null}
          {others.length ? (
            <div className="flex flex-col gap-2">
              <p className="text-xs text-muted-foreground" data-viz-label>{`${MAPPING_LEVEL_LABEL.recommended} or ${MAPPING_LEVEL_LABEL.optional.toLowerCase()}, ${others.filter((r) => r.state === "achieved").length} of ${others.length} achieved`}</p>
              <span className="flex flex-wrap gap-1.5">{others.map((r) => <Unit key={r.id} r={r} studentId={studentId} size={20} />)}</span>
            </div>
          ) : null}
          <UnitLegend />
          <dl className="grid grid-cols-[max-content_1fr] gap-x-4 gap-y-1.5 border-t border-border pt-3 text-sm">
            <dt className="text-muted-foreground">Waiting</dt>
            <dd className="text-foreground">{waiting.length ? `${waiting.length === 1 ? `1 ${skillNoun()}` : `${waiting.length} ${skillNounPlural()}`}, with ${[...new Set(waiting.map((r) => r.waiting!.evaluatorName))].join(", ")}` : "None"}</dd>
            {place ? (
              <>
                <dt className="text-muted-foreground">Placement</dt>
                <dd className="text-foreground" style={place.soon ? { color: VIZ.behindInk } : undefined}>{`${place.location}, ends ${shortDate(place.ends)}`}</dd>
              </>
            ) : null}
          </dl>
        </div>
      </ChartCard>
    </div>
  )
}
