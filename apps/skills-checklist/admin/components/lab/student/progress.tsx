"use client"

/**
 * Regions of the My progress variants. Every number is a link to where it is acted on; every chart has a text summary (its
 * accessible name) and a "Show as table" fallback; every "did not count" names the failed rule in numbers and the next step.
 */
import { TYPE } from "@/components/lab/type-scale"
import * as React from "react"
import { useSearchParams } from "next/navigation"
import { LabLink as Link } from "@/components/lab/lab-bar/lab-link"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import { Card, CardContent } from "@exxatdesignux/ui/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@exxatdesignux/ui/components/ui/table"
import { Tip } from "@exxatdesignux/ui/components/ui/tip"
import { cn } from "@exxatdesignux/ui/lib/utils"
import { VIZ } from "@/components/lab/viz"
import { usePresent } from "@/components/lab/lab-bar/present"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@exxatdesignux/ui/components/ui/select"
import { Field, FieldLabel } from "@exxatdesignux/ui/components/ui/field"
import { capitalize, countSkills, skillNoun, skillNounPlural } from "@/lib/lab/terms"
import { MAPPING_LEVEL_LABEL } from "@/lib/v2/labels"
import { REQUIRED_SET_LABEL } from "@/lib/v2/population"
import { NEXT_LIMIT, ageLabel, shortDate, studentHref, type CourseExpectation, type NextAction, type SkillRecord, type StudentModel } from "@/lib/lab/student"

/** D-X12: the student's required set is always named. My progress reads mandatory skills on current courses: "Required this term". */
export const REQUIRED_THIS_TERM = REQUIRED_SET_LABEL.thisTerm
import { FigureLink, LINK_IN_TABLE, NUM_LINK, useSvgFont, Overlay, Parts, RequiredRing, RingLegend, SectionTitle, ShowAsTable, StateLabel, stateWord } from "@/components/lab/student/parts"

// ---------------------------------------------------------------------------------------------------------------------
// Hero: required ring + waiting + returned (the three SH-04 figures) and a one-line pace verdict

export function ProgressHero({ model, studentId, compact = false }: { model: StudentModel; studentId: string; compact?: boolean }) {
  const c = model.counts
  // D-X12: name the required set. This hero reads "Required this term" (mandatory on the student's current courses), never "Required to graduate".
  const summary = `${c.achieved} of ${c.required} ${skillNounPlural()} ${REQUIRED_THIS_TERM.toLowerCase()} achieved. ${c.waiting} waiting, ${c.returned} returned.`
  return (
    <Card data-region="hero" className="h-full py-0">
      <CardContent className={cn("flex h-full items-center gap-5 py-4", compact ? "gap-4" : "gap-6")}>
        <Link href="#required" className="shrink-0 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring" data-figure="hero" aria-label={summary}>
          <RequiredRing records={model.required} size={compact ? 88 : 112} label={summary} />
        </Link>
        <div className="flex min-w-0 flex-col gap-3">
          <div className="flex flex-col gap-0.5">
            <h2 className={TYPE.card}>{`${REQUIRED_THIS_TERM}, achieved`}</h2>
            <p className={cn("inline-flex items-center gap-1.5 text-sm", model.behind ? "font-medium" : "text-muted-foreground")} style={model.behind ? { color: VIZ.behindInk } : undefined}>
              {model.behind ? <i className="fa-solid fa-diamond text-xs" aria-hidden="true" /> : null}
              {model.verdict}
            </p>
          </div>
          <div className="flex gap-8">
            <FigureLink href={studentHref("my-requests", {}, studentId)} value={c.waiting} label="Waiting" />
            <FigureLink href={studentHref("my-requests", { show: "returned" }, studentId)} value={c.returned} label="Returned" amber />
          </div>
          {compact ? null : <PlacementLine model={model} studentId={studentId} />}
        </div>
      </CardContent>
    </Card>
  )
}

/** The nearest placement end and the likely skills not started there, in one line (context for N-03). */
export function PlacementLine({ model }: { model: StudentModel; studentId: string }) {
  if (model.placements.length === 0) return null
  const first = [...model.placements].sort((a, b) => a.daysLeft - b.daysLeft)[0]
  const notStarted = [...new Set(model.placements.flatMap((p) => p.notStartedIds))]
  const where = model.placements.length > 1 ? `${model.placements.length} placements end` : `${first.location} ends`
  return (
    // Phone: hidden, so the returned reason fits the 375 word budget (strategy/07); the placement ending is still in Do this
    // next (N-03) and on the timeline, so nothing is lost (say it once).
    <p className="flex items-baseline gap-1.5 border-t border-border pt-3 text-sm text-muted-foreground max-sm:hidden" data-placement-line>
      <i className="fa-light fa-hospital text-xs" aria-hidden="true" />
      <span>
        {`${where} ${shortDate(first.ends)}, ${ageLabel(first.daysLeft)}. `}
        {/* Stated, not linked: the list of likely skills lives in the timeline design only, and a link would leave this one. */}
        {notStarted.length > 0 ? <span className="font-medium text-foreground">{`${notStarted.length} likely not started`}</span> : `Every likely ${skillNoun()} is started.`}
      </span>
    </p>
  )
}

// ---------------------------------------------------------------------------------------------------------------------
// Do this next (N-05, did not count, N-01, N-03, N-04)

const NEXT_ICON: Record<NextAction["kind"], string> = {
  returned: "fa-rotate-left",
  logged: "fa-paper-plane",
  dnq: "fa-triangle-exclamation",
  conflict: "fa-code-compare",
  "one-away": "fa-flag-checkered",
  placement: "fa-hospital",
  waiting: "fa-clock",
}

/**
 * The first `limit` actions show with their action button; the rest open in place behind one "Show n more" (one click, K5).
 * On a phone the detail line shows for "did not count" (the failed rule, REQ SH-03) and, cut to two lines, for a returned
 * submission (who returned it and why: the student must not have to open it to learn the reason); the other details are one tap
 * away on the page the action opens, so the phone viewport stays calm.
 */
export function NextActions({ model, limit = NEXT_LIMIT, title = "Do this next", exclude = [], className }: { model: StudentModel; limit?: number; title?: string; /** Kinds another region already shows (say it once). */ exclude?: NextAction["kind"][]; className?: string }) {
  const [more, setMore] = React.useState(false)
  const { present } = usePresent()
  const params = useSearchParams()
  // Offline sync is pending scope: the seeded "entry has two versions" is a scenario, so it shows only when a sync demo state is
  // asked for, and never in present mode (same rule as the sync chip; 2026-10-27 sweep).
  const syncDemo = ["offline", "conflict"].includes(params?.get("state") ?? "")
  const all = model.next.filter((a) => !exclude.includes(a.kind) && !(a.kind === "conflict" && (present || !syncDemo)))
  const list = more ? all : all.slice(0, limit)
  const hidden = all.length - limit
  return (
    // Where returned requests are listed, this region holds the returned count (the same model number My requests shows), so the
    // consistency check reads it here once the Waiting card stops repeating it (review 2026-10-30).
    <Card data-region="next" className={cn("gap-0 py-0", className)} {...(exclude.includes("returned") ? {} : { "data-figure-label": "Returned to you", "data-figure-value": model.counts.returned })}>
      <CardContent className="flex flex-col gap-1 py-4">
        <SectionTitle count={all.length}>{title}</SectionTitle>
        {list.length === 0 ? (
          <p className="py-2 text-sm text-muted-foreground">{`Nothing needs you now. Every required ${skillNoun()} is achieved or waiting.`}</p>
        ) : (
          <ul className="flex flex-col divide-y divide-border">
            {list.map((a) => (
              <li key={a.id} className="flex gap-3 py-3">
                <i className={`fa-light ${NEXT_ICON[a.kind]} mt-0.5 w-4 shrink-0 text-center text-sm`} style={{ color: a.amber ? VIZ.behindInk : "var(--muted-foreground)" }} aria-hidden="true" />
                <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
                  <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <h3 className={TYPE.label}>{a.title}</h3>
                    {/* The detail names who and why (returned), the failed rule (did not count) or the numbers; a conflict's title says it all. */}
                    <p className={cn("text-sm text-muted-foreground", a.kind === "conflict" ? "hidden" : a.kind === "dnq" ? "" : a.kind === "returned" ? "max-sm:line-clamp-2" : "max-sm:hidden")} data-next-detail={a.kind}>
                      {a.kind === "returned" && a.who && a.detail.startsWith(`${a.who}: `) ? (
                        <>
                          <span className="max-sm:hidden">{`${a.who}: `}</span>
                          {a.detail.slice(a.who.length + 2)}
                        </>
                      ) : a.kind === "dnq" && a.lead && a.detail.startsWith(a.lead) ? (
                        <>
                          <span className="max-sm:hidden">{a.lead}</span>
                          {a.detail.slice(a.lead.length)}
                        </>
                      ) : a.kind === "one-away" && exclude.includes("waiting") ? (
                        // Who holds it and for how long is the Waiting region's job on this page (say it once): the fraction only.
                        a.detail.split(". ")[0]
                      ) : (
                        a.detail
                      )}
                    </p>
                  </div>
                  <Button asChild variant="link" size="sm" className="h-auto shrink-0 self-start px-0 sm:self-center">
                    <Link href={a.href}>{a.action}</Link>
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
        {hidden > 0 ? (
          <Button type="button" variant="ghost" size="sm" className="self-start" aria-expanded={more} onClick={() => setMore((v) => !v)}>
            <i className={`fa-light ${more ? "fa-chevron-up" : "fa-chevron-down"}`} aria-hidden="true" />
            {more ? "Show fewer" : `Show ${hidden} more`}
          </Button>
        ) : null}
      </CardContent>
    </Card>
  )
}

// ---------------------------------------------------------------------------------------------------------------------
// Required list

/**
 * One row per skill: name (opens the skill page, whose one filled action is the state's next step: fix, further attempt, view
 * request or send), state word and overlay, rule parts. No per-row buttons: Do this next already carries the actions that are due,
 * so the list does not repeat them (say it once).
 */
export function SkillRows({ records, studentId, showParts = true }: { records: SkillRecord[]; studentId: string; showParts?: boolean }) {
  return (
    <ul className="flex flex-col divide-y divide-border">
      {records.map((r) => (
        <li key={r.id} className="grid grid-cols-1 gap-x-4 gap-y-1 py-3 md:grid-cols-12 md:items-center">
          <div className="flex min-w-0 items-center gap-2 md:col-span-5">
            <Link href={studentHref("skill-detail", { skill: r.id }, studentId)} className={cn(LINK_IN_TABLE, "truncate")}>{r.name}</Link>
            {r.likely ? (
              <Tip label="Likely at your placement">
                <span tabIndex={0} role="img" className="shrink-0 rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" aria-label="Likely at your placement">
                  <i className="fa-solid fa-star text-xs text-muted-foreground" aria-hidden="true" />
                </span>
              </Tip>
            ) : null}
          </div>
          <div className="flex flex-wrap items-center gap-2 md:col-span-4">
            <StateLabel record={r} />
            <Overlay record={r} />
          </div>
          <div className="md:col-span-3">
            {showParts && (r.parts.length > 1 || r.state === "dnq") ? <Parts parts={r.parts} /> : null}
          </div>
        </li>
      ))}
    </ul>
  )
}

/**
 * The required list, or one course's expected skills [REQ ST-01]: "Required this term" by default (D-X12), and a course choice that
 * lists every skill that course expects, mandatory first, then recommended and optional, with progress on each.
 */
export function RequiredList({ model, studentId, title, courseId = null }: { model: StudentModel; studentId: string; title?: string; /** ?course= : the course whose expected skills are listed. */ courseId?: string | null }) {
  const course = model.courses.find((c) => c.id === courseId) ?? null
  return (
    <Card data-region="list" className="gap-0 py-0" id="required">
      <CardContent className="flex flex-col gap-1 py-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <SectionTitle count={course ? course.skills.length : model.required.length}>{course ? `${course.code} expects` : title ?? REQUIRED_THIS_TERM}</SectionTitle>
          {course ? null : <RingLegend />}
        </div>
        {course ? <CourseSkillList model={model} course={course} studentId={studentId} /> : <SkillRows records={model.required} studentId={studentId} />}
        {/* What each course expects (ST-01), as course links closing the list: one click away, and the first viewport keeps its
            next actions (student budget 4 controls; links in text are not controls). */}
        <nav aria-label="What each course expects" className="flex flex-wrap items-baseline gap-x-3 gap-y-1 border-t border-border pt-3 text-sm" data-course-links>
          <span className="text-muted-foreground">By course:</span>
          {course ? <Link className={NUM_LINK} href={`${studentHref("home", {}, studentId)}#required`}>{REQUIRED_THIS_TERM}</Link> : null}
          {model.courses.filter((c) => c.skills.length > 0).map((c) => (
            <Link key={c.id} className={cn(NUM_LINK, "tabular-nums", c.id === course?.id ? "font-semibold" : "")} aria-current={c.id === course?.id ? "true" : undefined} href={`${studentHref("home", { course: c.id }, studentId)}#required`}>{c.code}</Link>
          ))}
        </nav>
      </CardContent>
    </Card>
  )
}

/** "Required this term" or one course [REQ ST-01]. Only courses that expect at least one skill are offered. */
export function CourseSelect({ model, value, onChange, allLabel = REQUIRED_THIS_TERM, id = "progress-course" }: { model: StudentModel; value: string; onChange: (v: string) => void; allLabel?: string; id?: string }) {
  const courses = model.courses.filter((c) => c.skills.length > 0)
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger id={id} size="sm" className="w-full sm:w-56" aria-label="Show">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="required">{allLabel}</SelectItem>
        {courses.map((c) => <SelectItem key={c.id} value={c.id}>{`${c.code}, ${countSkills(c.skills.length)}`}</SelectItem>)}
      </SelectContent>
    </Select>
  )
}

/**
 * The course view's own switch: courses only, labelled "Course"; choosing one stays on the course view (Romit 2026-10-27). My
 * progress itself has no course select; its course rows link here.
 */
export function CourseSwitch({ model, value, onChange, id = "course-switch" }: { model: StudentModel; value: string; onChange: (v: string) => void; id?: string }) {
  const courses = model.courses.filter((c) => c.skills.length > 0)
  return (
    <Field className="w-full sm:w-72">
      <FieldLabel htmlFor={id}>Course</FieldLabel>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger id={id} size="sm" className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {courses.map((c) => <SelectItem key={c.id} value={c.id}>{`${c.code}, ${countSkills(c.skills.length)}`}</SelectItem>)}
        </SelectContent>
      </Select>
    </Field>
  )
}

const LEVEL_LIMIT = 5

/**
 * One course's expected skills by level [REQ ST-01]: which are mandatory (the only level "Required this term" reads, D-X12),
 * recommended and optional, each row with its state and rule parts. A level over 8 rows shows the first 5 and "Show all n".
 */
export function CourseSkillList({ model, course, studentId }: { model: StudentModel; course: CourseExpectation; studentId: string }) {
  const [open, setOpen] = React.useState<Record<string, boolean>>({})
  const rec = new Map(model.all.map((r) => [r.id, r]))
  const levels = (["mandatory", "recommended", "optional"] as const)
    .map((level) => ({ level, records: course.skills.filter((x) => x.level === level).map((x) => rec.get(x.id)).filter((r): r is SkillRecord => !!r) }))
    .filter((g) => g.records.length > 0)
  if (levels.length === 0) return <p className="py-2 text-sm text-muted-foreground">{`${course.code} expects no ${skillNounPlural()} yet.`}</p>
  // One Send per page: the header's Send for evaluation opens on this course with its open mandatory skills chosen [Thursday S2].
  return (
    <div className="flex flex-col gap-3" data-course-skills={course.id}>
      {levels.map((g) => {
        const achieved = g.records.filter((r) => r.state === "achieved").length
        const all = open[g.level] || g.records.length <= 8
        return (
          <section key={g.level} className="flex flex-col" aria-label={`${MAPPING_LEVEL_LABEL[g.level]} on ${course.code}`}>
            <h3 className={`flex items-baseline gap-2 border-b border-border pb-1.5 pt-2 ${TYPE.group}`}>
              {MAPPING_LEVEL_LABEL[g.level]}
              <span className="text-xs font-normal tabular-nums text-muted-foreground" data-viz-label>{`${achieved} of ${g.records.length} achieved`}</span>
            </h3>
            <SkillRows records={all ? g.records : g.records.slice(0, LEVEL_LIMIT)} studentId={studentId} />
            {g.records.length > 8 ? (
              <Button type="button" variant="ghost" size="sm" className="self-start" aria-expanded={all} onClick={() => setOpen((o) => ({ ...o, [g.level]: !all }))}>
                {all ? "Show fewer" : `Show all ${g.records.length}`}
              </Button>
            ) : null}
          </section>
        )
      })}
    </div>
  )
}

// ---------------------------------------------------------------------------------------------------------------------
// Mosaic (variant B): sections x skills, one cell per skill, red-to-green checklist read as neutral-to-brand with amber shortfall

const CELL = 18
/** Required cells carry an outer ring (a second outline 2 px out), so required reads without colour. */
const REQUIRED_RING: React.CSSProperties = { boxShadow: "0 0 0 1.5px var(--background), 0 0 0 3px var(--foreground)" }

function cellStyle(r: SkillRecord): React.CSSProperties {
  if (r.state === "achieved") return { background: "var(--muted-foreground)", borderColor: "var(--muted-foreground)" }
  if (r.state === "progress") return { background: `linear-gradient(to top, var(--border-control-3) ${Math.round((r.counted / Math.max(1, r.need)) * 100)}%, var(--background) 0)`, borderColor: "var(--border-control-3)" }
  if (r.state === "dnq") return { background: VIZ.behindWash, borderColor: VIZ.behindEdge }
  return { background: "var(--background)", borderColor: "var(--border-control)" }
}

export function Mosaic({ records, studentId }: { records: SkillRecord[]; studentId: string }) {
  const sections = React.useMemo(() => {
    const m = new Map<string, SkillRecord[]>()
    for (const r of records) m.set(r.section, [...(m.get(r.section) ?? []), r])
    return [...m.entries()].map(([name, rs]) => ({ name, rs: rs.sort((a, b) => Number(b.required) - Number(a.required) || a.name.localeCompare(b.name)), achieved: rs.filter((x) => x.state === "achieved").length, required: rs.some((x) => x.required), short: rs.some((x) => x.state === "dnq") })).sort((a, b) => Number(b.required) - Number(a.required) || Number(b.short) - Number(a.short) || a.name.localeCompare(b.name))
  }, [records])
  const achieved = records.filter((r) => r.state === "achieved").length
  const summary = `${achieved} of ${records.length} ${skillNounPlural()} achieved across ${sections.length} sections. ${records.filter((r) => r.state === "dnq").length} did not count.`
  return (
    <div className="flex flex-col gap-3">
      <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground" aria-label="Legend">
        {(["achieved", "progress", "dnq", "none"] as const).map((k) => (
          <li key={k} className="inline-flex items-center gap-1.5">
            <span className="block rounded-sm border" style={{ width: 12, height: 12, ...cellStyle({ state: k, counted: 1, need: 2 } as SkillRecord) }} aria-hidden="true" />
            {stateWord(k)}
          </li>
        ))}
        <li className="inline-flex items-center gap-1.5"><span className="block rounded-sm border" style={{ width: 12, height: 12, ...REQUIRED_RING, borderColor: "var(--border-control)" }} aria-hidden="true" />Required</li>
      </ul>
      {/* A group, not role="img": each cell is a link to its skill (axe nested-interactive). The summary is the group's name. */}
      <div role="group" aria-label={summary} data-chart="mosaic" className="flex flex-col gap-2">
        {sections.map((s) => (
          <div key={s.name} className="grid grid-cols-[1fr_auto] items-center gap-x-3 gap-y-1 md:grid-cols-[minmax(0,13rem)_3.5rem_1fr]">
            <span className="truncate text-xs text-foreground" title={s.name} data-viz-label>{s.name}</span>
            <span className="text-end text-xs tabular-nums text-muted-foreground">{s.achieved} of {s.rs.length}</span>
            <span className="col-span-2 flex flex-wrap gap-2 py-0.5 md:col-span-1">
              {s.rs.map((r) => (
                <Tip key={r.id} label={`${r.name}: ${r.label}${r.required ? ", required" : ""}`}>
                  <Link
                    href={studentHref("skill-detail", { skill: r.id }, studentId)}
                    aria-label={`${r.name}, ${r.label}${r.required ? ", required" : ""}`}
                    className="relative block shrink-0 rounded-sm border outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    style={{ width: CELL, height: CELL, ...cellStyle(r), ...(r.required ? REQUIRED_RING : {}) }}
                  >
                    {r.state === "dnq" ? <i className="fa-solid fa-exclamation absolute inset-0 flex items-center justify-center text-xs" style={{ color: VIZ.behindInk }} aria-hidden="true" /> : null}
                  </Link>
                </Tip>
              ))}
            </span>
          </div>
        ))}
      </div>
      <ShowAsTable label={`${capitalize(skillNounPlural())} by section`}>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Section</TableHead>
              <TableHead>{capitalize(skillNoun())}</TableHead>
              <TableHead>State</TableHead>
              <TableHead>Required</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sections.flatMap((s) => s.rs.map((r) => (
              <TableRow key={r.id}>
                <TableCell>{s.name}</TableCell>
                <TableCell><Link className={LINK_IN_TABLE} href={studentHref("skill-detail", { skill: r.id }, studentId)}>{r.name}</Link></TableCell>
                <TableCell>{r.label}</TableCell>
                <TableCell>{r.required ? "Yes" : "No"}</TableCell>
              </TableRow>
            )))}
          </TableBody>
        </Table>
      </ShowAsTable>
    </div>
  )
}

// ---------------------------------------------------------------------------------------------------------------------
// Radar vs cohort median (n >= 5 only)

export function SectionRadar({ model }: { model: StudentModel }) {
  const axes = model.sections
  const W = 340
  const [svgRef, fs] = useSvgFont(W)
  const H = 250
  const c = W / 2
  const cy = H / 2
  const R = 82
  if (model.radarSuppressed || axes.length < 3) {
    return <p className="text-sm text-muted-foreground">{model.radarSuppressed ? "Comparison is hidden for groups under 5." : "Comparison needs 3 or more sections."}</p>
  }
  const pt = (i: number, v: number) => {
    const a = (i / axes.length) * 2 * Math.PI - Math.PI / 2
    return [c + R * (v / 100) * Math.cos(a), cy + R * (v / 100) * Math.sin(a)] as const
  }
  const poly = (k: "mine" | "median") => axes.map((x, i) => pt(i, x[k]).join(",")).join(" ")
  const below = axes.filter((x) => x.mine < x.median)
  const summary = `Share of required evaluations counted by section, you against the cohort median of ${model.cohortSize}. ${below.length ? `Below the median in ${below.map((x) => x.section).join(", ")}.` : "At or above the median in every section."}`
  return (
    <div className="flex flex-col gap-2">
      <svg viewBox={`0 0 ${W} ${H}`} ref={svgRef} className="mx-auto w-full max-w-sm" role="img" aria-label={summary} data-chart="radar">
        {[25, 50, 75, 100].map((g) => <polygon key={g} points={axes.map((_, i) => pt(i, g).join(",")).join(" ")} fill="none" stroke={VIZ.grid} strokeWidth={1} />)}
        {axes.map((_, i) => { const [x, y] = pt(i, 100); return <line key={i} x1={c} y1={cy} x2={x} y2={y} stroke={VIZ.grid} strokeWidth={1} /> })}
        <polygon points={poly("median")} fill="none" stroke="var(--muted-foreground)" strokeWidth={1.5} strokeDasharray="4 3" />
        <polygon points={poly("mine")} fill="var(--brand-tint)" fillOpacity={0.7} stroke="var(--foreground)" strokeWidth={2} />
        {axes.map((x, i) => {
          const [px, py] = pt(i, x.mine)
          const short = x.mine < x.median
          return short ? <rect key={i} x={px - 4} y={py - 4} width={8} height={8} fill={VIZ.behind} transform={`rotate(45 ${px} ${py})`} /> : <circle key={i} cx={px} cy={py} r={3} fill="var(--foreground)" />
        })}
        {axes.map((x, i) => {
          const [lx, ly] = pt(i, 122)
          return <text key={x.section} x={lx} y={ly} textAnchor={Math.abs(lx - c) < 8 ? "middle" : lx > c ? "start" : "end"} dominantBaseline="middle" className="fill-muted-foreground" style={{ fontSize: fs }}>{x.section.length > 18 ? `${x.section.slice(0, 17)}…` : x.section}</text>
        })}
      </svg>
      <ul className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs text-muted-foreground" aria-label="Legend">
        <li className="inline-flex items-center gap-1.5"><span className="block h-0.5 w-4" style={{ background: "var(--foreground)" }} aria-hidden="true" />You</li>
        <li className="inline-flex items-center gap-1.5"><span className="block h-0 w-4 border-t border-dashed" style={{ borderColor: "var(--muted-foreground)" }} aria-hidden="true" />{`Cohort median (${model.cohortSize})`}</li>
        <li className="inline-flex items-center gap-1.5"><i className="fa-solid fa-diamond text-xs" style={{ color: VIZ.behind }} aria-hidden="true" />Below median</li>
      </ul>
      <ShowAsTable label="Sections against the cohort median">
        <Table>
          <TableHeader><TableRow><TableHead>Section</TableHead><TableHead className="text-end">You</TableHead><TableHead className="text-end">Median</TableHead></TableRow></TableHeader>
          <TableBody>
            {axes.map((x) => <TableRow key={x.section}><TableCell>{x.section}</TableCell><TableCell className="text-end tabular-nums">{x.mine}%</TableCell><TableCell className="text-end tabular-nums">{x.median}%</TableCell></TableRow>)}
          </TableBody>
        </Table>
      </ShowAsTable>
    </div>
  )
}

// ---------------------------------------------------------------------------------------------------------------------
// Pace (variant C): counted toward required rules by week, against the term clock

export function PaceChart({ model, height = 220 }: { model: StudentModel; height?: number }) {
  const pts = model.pace
  const W = 640
  const [svgRef, fs] = useSvgFont(W)
  const step = fs > 20 ? 4 : 2
  const H = height
  const pad = { l: Math.round(fs * 1.6) + 10, r: 16, t: Math.round(fs) + 4, b: Math.round(fs) + 16 }
  const max = Math.max(1, ...pts.map((p) => Math.max(p.expected, p.counted)), model.row?.needed ?? 0)
  const x = (i: number) => pad.l + (i / Math.max(1, pts.length - 1)) * (W - pad.l - pad.r)
  const y = (v: number) => H - pad.b - (v / max) * (H - pad.t - pad.b)
  const done = pts.filter((p) => p.counted >= 0)
  const todayIdx = done.length - 1
  const line = (k: "counted" | "expected", list: typeof pts) => list.map((p, i) => `${i === 0 ? "M" : "L"} ${x(pts.indexOf(p))} ${y(p[k])}`).join(" ")
  const last = done[done.length - 1]
  const summary = last ? `${last.counted} of ${model.row?.needed ?? 0} required evaluations counted by ${last.label}; the term clock expects ${last.expected}. ${model.verdict}.` : "No pace yet."
  const ticks = [0, Math.round(max / 2), max]
  return (
    <div className="flex flex-col gap-2">
      <svg viewBox={`0 0 ${W} ${H}`} ref={svgRef} className="w-full" role="img" aria-label={summary} data-chart="pace">
        {ticks.map((t) => (
          <g key={t}>
            <line x1={pad.l} x2={W - pad.r} y1={y(t)} y2={y(t)} stroke={VIZ.grid} strokeWidth={1} />
            <text x={pad.l - 6} y={y(t)} textAnchor="end" dominantBaseline="middle" className="fill-muted-foreground" style={{ fontSize: fs }}>{t}</text>
          </g>
        ))}
        {pts.map((p, i) => (i % step === 0 ? <text key={p.date} x={x(i)} y={H - 8} textAnchor="middle" className="fill-muted-foreground" style={{ fontSize: fs }}>{p.label}</text> : null))}
        <path d={line("expected", pts)} fill="none" stroke={VIZ.zero} strokeWidth={1.5} strokeDasharray="5 4" />
        <path d={line("counted", done)} fill="none" stroke="var(--foreground)" strokeWidth={2.5} />
        {todayIdx >= 0 ? (
          <g>
            <line x1={x(todayIdx)} x2={x(todayIdx)} y1={pad.t} y2={H - pad.b} stroke="var(--border-control-3)" strokeWidth={1} />
            {model.behind ? (
              <rect x={x(todayIdx) - 5} y={y(done[todayIdx].counted) - 5} width={10} height={10} fill={VIZ.behind} transform={`rotate(45 ${x(todayIdx)} ${y(done[todayIdx].counted)})`} />
            ) : (
              <circle cx={x(todayIdx)} cy={y(done[todayIdx].counted)} r={4.5} fill="var(--foreground)" />
            )}
            <text x={x(todayIdx) + 6} y={pad.t - 4} className="fill-foreground" style={{ fontSize: fs }}>Today</text>
          </g>
        ) : null}
      </svg>
      <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground" aria-label="Legend">
        <li className="inline-flex items-center gap-1.5"><span className="block h-0.5 w-4" style={{ background: "var(--foreground)" }} aria-hidden="true" />Counted</li>
        <li className="inline-flex items-center gap-1.5"><span className="block h-0 w-4 border-t border-dashed" style={{ borderColor: "var(--foreground)" }} aria-hidden="true" />Expected, term clock</li>
      </ul>
      <ShowAsTable label="Pace by week">
        <Table>
          <TableHeader><TableRow><TableHead>Week of</TableHead><TableHead className="text-end">Counted</TableHead><TableHead className="text-end">Expected</TableHead></TableRow></TableHeader>
          <TableBody>
            {pts.map((p) => <TableRow key={p.date}><TableCell>{p.label}</TableCell><TableCell className="text-end tabular-nums">{p.counted >= 0 ? p.counted : "Not yet"}</TableCell><TableCell className="text-end tabular-nums">{p.expected}</TableCell></TableRow>)}
          </TableBody>
        </Table>
      </ShowAsTable>
    </div>
  )
}

export function PlacementList({ model, studentId }: { model: StudentModel; studentId: string }) {
  if (model.placements.length === 0) return <p className="text-sm text-muted-foreground">No placement this term. Every program setting stays open.</p>
  // One block per course and end date: placements of one course share their likely skills, so they are said once.
  const groups = new Map<string, typeof model.placements>()
  for (const p of model.placements) groups.set(`${p.courseId}|${p.ends}`, [...(groups.get(`${p.courseId}|${p.ends}`) ?? []), p])
  const nameOf = (id: string) => model.all.find((r) => r.id === id)?.name ?? skillNoun()
  return (
    <ul className="flex flex-col divide-y divide-border">
      {[...groups.values()].map((ps) => {
        const p = ps[0]
        return (
          <li key={p.id} className="flex flex-col gap-2 py-3 first:pt-0">
            <div className="flex items-baseline justify-between gap-2">
              <p className="text-sm font-medium text-foreground">{p.courseCode}</p>
              <span className="shrink-0 text-xs tabular-nums" style={p.soon ? { color: VIZ.behindInk } : undefined}>{`Ends ${shortDate(p.ends)}, ${ageLabel(p.daysLeft)}`}</span>
            </div>
            <ul className="flex flex-col gap-0.5 text-sm text-muted-foreground">
              {ps.map((x) => <li key={x.id}>{`${x.location}, ${x.setting}`}</li>)}
            </ul>
            {p.notStartedIds.length > 0 ? (
              <div className="flex flex-col gap-1">
                <p className="text-xs text-muted-foreground">{`Likely here, not started (${p.notStartedIds.length})`}</p>
                <ul className="flex flex-col gap-1 text-sm">
                  {p.notStartedIds.map((id) => (
                    <li key={id} className="flex items-center gap-1.5">
                      <i className="fa-solid fa-star text-xs text-muted-foreground" aria-hidden="true" />
                      <Link className={LINK_IN_TABLE} href={studentHref("skill-detail", { skill: id }, studentId)}>{nameOf(id)}</Link>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">{`Every likely ${skillNoun()} here is started.`}</p>
            )}
          </li>
        )
      })}
    </ul>
  )
}

/**
 * What each course expects now, one row per course; each row opens the course's skills by level with progress on each [REQ ST-01].
 * "Mandatory achieved" is the course's own mandatory set (the only level "Required this term" reads, D-X12).
 */
export function CourseTable({ model, studentId, mandatoryCell, placement = false, compact = false }: { model: StudentModel; studentId: string; /** Draw the mandatory column (variant C: one square per skill). */ mandatoryCell?: (c: CourseExpectation) => React.ReactNode; /** Show when the course's placement ends (variant C merges the placements card here). */ placement?: boolean; /** Narrow column (variant C): course name in the row's tooltip only, no "other achieved" column. */ compact?: boolean }) {
  const [open, setOpen] = React.useState<string | null>(null)
  const placeOf = (id: string) => model.placements.filter((p) => p.courseId === id).sort((a, b) => a.daysLeft - b.daysLeft)[0]
  const cols = (placement ? 5 : 4) - (compact ? 1 : 0)
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Course</TableHead>
          <TableHead className={cn("whitespace-normal", !mandatoryCell && "text-end")}>Mandatory achieved</TableHead>
          <TableHead className="whitespace-normal text-end">Evaluations now</TableHead>
          {compact ? null : <TableHead className="hidden text-end md:table-cell">Recommended or optional achieved</TableHead>}
          {placement ? <TableHead className="hidden lg:table-cell">Placement ends</TableHead> : null}
        </TableRow>
      </TableHeader>
      <TableBody>
        {model.courses.map((c) => (
          <React.Fragment key={c.id}>
          <TableRow>
            {/* whitespace-normal: at 375 the course code may wrap at its space rather than push the last column past the table
                edge (anatomy A10, 2026-10-30). */}
            <TableCell className="whitespace-normal">
              <span className="inline-flex items-center gap-1">
                {c.skills.length ? (
                  <Button type="button" variant="ghost" size="icon-sm" aria-expanded={open === c.id} aria-controls={`course-skills-${c.id}`} aria-label={`${open === c.id ? "Hide" : "Show"} the ${countSkills(c.skills.length)} ${c.code} expects`} onClick={() => setOpen((o) => (o === c.id ? null : c.id))}>
                    <i className={cn("fa-light", open === c.id ? "fa-chevron-down" : "fa-chevron-right")} aria-hidden="true" />
                  </Button>
                ) : null}
                <span className="font-medium text-foreground">{c.code}</span>
              </span>
              {compact ? null : <span className="ms-2 hidden text-muted-foreground lg:inline">{c.name}</span>}
            </TableCell>
            <TableCell className={mandatoryCell ? "whitespace-normal" : "text-end tabular-nums"}>{c.mandatory ? (mandatoryCell ? mandatoryCell(c) : <Link className={NUM_LINK} href={studentHref("record", {}, studentId)}>{`${c.mandatoryAchieved} of ${c.mandatory}`}</Link>) : <span className="text-muted-foreground">None</span>}</TableCell>
            <TableCell className="whitespace-normal text-end tabular-nums">
              {c.needed ? (
                <span className="inline-flex flex-wrap items-center justify-end gap-x-1.5" style={c.behind ? { color: VIZ.behindInk } : undefined}>
                  {c.behind ? <i className="fa-solid fa-diamond text-xs" aria-hidden="true" /> : null}
                  {`${c.collected} of ${c.needed}, ${c.expected} expected`}
                  <span className="sr-only">{c.behind ? ", behind" : ", on pace"}</span>
                </span>
              ) : <span className="text-muted-foreground">None expected</span>}
            </TableCell>
            {compact ? null : <TableCell className="hidden text-end tabular-nums md:table-cell">{c.optional ? `${c.optionalAchieved} of ${c.optional}` : "None"}</TableCell>}
            {placement ? <PlacementCell p={placeOf(c.id)} /> : null}
          </TableRow>
          {open === c.id ? (
            <TableRow className="hover:bg-transparent">
              <TableCell colSpan={cols} id={`course-skills-${c.id}`} className="whitespace-normal bg-muted/30 px-4 py-2">
                <CourseSkillList model={model} course={c} studentId={studentId} />
              </TableCell>
            </TableRow>
          ) : null}
          </React.Fragment>
        ))}
      </TableBody>
    </Table>
  )
}

function PlacementCell({ p }: { p: StudentModel["placements"][number] | undefined }) {
  return (
    <TableCell className="hidden tabular-nums lg:table-cell">
      {p ? <span style={p.soon ? { color: VIZ.behindInk } : undefined}>{`${shortDate(p.ends)}, ${ageLabel(p.daysLeft)}`}</span> : <span className="text-muted-foreground">None</span>}
    </TableCell>
  )
}
