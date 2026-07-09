'use client'

// ============================================================================
// Course Evaluation — Dashboard home, v3 (Jul 8 2026, multi-hat review fixes).
//
// IA: VISIBLE MASTER → SCOPED DETAIL. Terms band cards use the Deel
// Learning-Insights anatomy (hero number + labeled breakdown rows, EVERY count
// a deep-link — no dead text) with stage badges sharing the survey vocabulary.
// Selecting a card scopes the detail zone via ?term=.
//
// Detail zone: stream rate cards → daily-pace chart + AI themes → evaluations
// table. Interventions (Remind / Extend) sit inline on at-risk rows — there is
// no separate Needs-attention queue (removed 2026-07-09, Romit).
//
// THE CHART IS TERM-SCOPED AND DAILY (Romit 2026-07-08): responses per day +
// cumulative response rate vs the 70% target, with markers on reminder-send
// days — "are we accumulating fast enough, and did the nudge work?"
// Cross-term comparison lives in Analytics, not here. The synthesized
// "Momentum" sparkline column was removed (fabricated data — honesty rule).
//
// ONE status vocabulary: Draft · Scheduled · Live · In review · Released
// (terms add Upcoming/Complete for aggregate-only states). This page says
// "evaluations", never "surveys" (Programmatic Surveys is a different module).
// No red (aarti_no_red): teal --chart-2 good · amber --chart-4/--chip-4 risk.
// ============================================================================

import { Suspense, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  Button,
  PageHeader,
  StatusBadge,
  PersonIdentityCell,
  DataTable,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  chartTooltipKeyboardSyncProps,
  LocalBanner,
} from '@exxatdesignux/ui'
import type { ChartConfig, ColumnDef, StatusBadgeTone } from '@exxatdesignux/ui'
import { ComposedChart, BarChart, Bar, Cell, Line, XAxis, YAxis, CartesianGrid, ReferenceLine } from 'recharts'
import { ChartCard, ChartFigure, ChartDataTable } from '@/components/charts-overview'
import { SiteHeader } from '@/components/site-header'
import { usePce } from '@/components/pce/pce-state'
import { SetupTermSheet } from '@/components/pce/setup-term-sheet'
import { EditEndDateDialog, SendReminderDialog } from '@/components/pce/pce-modals'
import { TermThemesInsight } from '@/components/pce/term-themes-insight'
import { SurveyStatusBadgeOS } from '@/components/pce/pce-badges'
import { rateColor, MINIMUM_THRESHOLD } from '@/lib/pce-results'
import { termCollectionSeries, paceToTarget, bestReminderLift } from '@/lib/pce-collection'
import { CHART_AXIS_TICK, CHART_TICK_FONT_SIZE } from '@/lib/chart-typography'
import { AT_RISK_THRESHOLD } from '@/lib/pce-at-risk'
import {
  MOCK_PROGRAM_TERMS,
  MOCK_COURSE_OFFERINGS,
  MOCK_MASTER_COURSES,
  type PceSurvey,
  type ProgramTerm,
} from '@/lib/pce-mock-data'

const RESPONSE_TARGET = 70

type SurveyRow = PceSurvey & Record<string, unknown>

/* ── term helpers ─────────────────────────────────────────────────────────── */

const termsOrdered: ProgramTerm[] = [...MOCK_PROGRAM_TERMS].sort(
  (a, b) => a.startDate.localeCompare(b.startDate),
)

/** Latest term whose start date has passed = the current cycle. */
function currentTermId(): string {
  const today = new Date().toISOString().slice(0, 10)
  const started = termsOrdered.filter((t) => t.startDate <= today)
  return (started.at(-1) ?? termsOrdered[0]).id
}

function evalWindow(term: ProgramTerm): { open: string; close: string } {
  const closeDate = new Date(term.endDate)
  closeDate.setDate(closeDate.getDate() + 7)
  const fmt = (d: Date) =>
    d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  return { open: fmt(new Date(term.startDate)), close: fmt(closeDate) }
}

function daysUntilClose(term: ProgramTerm): number | null {
  const close = new Date(term.endDate)
  close.setDate(close.getDate() + 7)
  const diff = Math.ceil((close.getTime() - Date.now()) / 86_400_000)
  return diff > 0 ? diff : null
}

function daysUntil(dateStr: string): number | null {
  const t = new Date(dateStr).getTime()
  return Number.isFinite(t) ? Math.ceil((t - Date.now()) / 86_400_000) : null
}

function weightedRate(surveys: PceSurvey[]): number | null {
  const enrolled = surveys.reduce((s, x) => s + x.enrollmentCount, 0)
  if (enrolled === 0) return null
  return Math.round(surveys.reduce((s, x) => s + x.responseRate * x.enrollmentCount, 0) / enrolled)
}

/** Lifecycle sort for the table: needs-attention first. */
const STATUS_ORDER: Record<string, number> = {
  active: 0, collecting: 0, pending_review: 1, closed: 1, released: 2, scheduled: 3, draft: 4,
}

const LIVE = (s: PceSurvey) => s.status === 'active' || s.status === 'collecting'
const IN_REVIEW = (s: PceSurvey) => s.status === 'pending_review' || s.status === 'closed'
const FINISHED = (s: PceSurvey) => IN_REVIEW(s) || s.status === 'released'

/* ── term stage model (shares the survey vocabulary) ──────────────────────── */

type TermStage = 'upcoming' | 'live' | 'review' | 'complete'

const STAGE_BADGE: Record<TermStage, { label: string; tone: StatusBadgeTone }> = {
  upcoming: { label: 'Upcoming',  tone: 'info' },
  live:     { label: 'Live',      tone: 'success' },
  review:   { label: 'In review', tone: 'warning' },
  complete: { label: 'Complete',  tone: 'neutral' },
}

interface TermSnapshot {
  term: ProgramTerm
  stage: TermStage
  rate: number | null
  total: number
  live: number
  atRisk: number
  pending: number
  released: number
  daysLeft: number | null
  coverage: { surveyed: number; total: number } | null
}

function coverageFor(termId: string, termSurveys: PceSurvey[]) {
  const offerings = MOCK_COURSE_OFFERINGS.filter((o) => o.termId === termId)
  if (offerings.length === 0) return null
  const surveyedCodes = new Set(
    termSurveys.filter((s) => s.status !== 'draft').map((s) => s.courseCode),
  )
  const surveyed = offerings.filter((o) => {
    const code = MOCK_MASTER_COURSES.find((c) => c.id === o.masterCourseId)?.code
    return code ? surveyedCodes.has(code) : false
  }).length
  return { surveyed, total: offerings.length }
}

function snapshot(term: ProgramTerm, ce: PceSurvey[]): TermSnapshot {
  const list = ce.filter((s) => s.term === term.name)
  const today = new Date().toISOString().slice(0, 10)
  const live = list.filter(LIVE)
  const pending = list.filter(IN_REVIEW).length
  const released = list.filter((s) => s.status === 'released').length
  const stage: TermStage =
    term.startDate > today ? 'upcoming'
    : live.length > 0 ? 'live'
    : pending > 0 ? 'review'
    : 'complete'
  return {
    term,
    stage,
    rate: weightedRate(list),
    total: list.length,
    live: live.length,
    atRisk: live.filter((s) => s.responseRate < AT_RISK_THRESHOLD).length,
    pending,
    released,
    daysLeft: stage === 'live' ? daysUntilClose(term) : null,
    coverage: coverageFor(term.id, list),
  }
}

/* ── term card (Deel Learning-Insights anatomy: hero + linked breakdown) ──── */

function CardStatRow({
  label,
  value,
  href,
  emphasis,
}: {
  label: string
  value: string
  href?: string
  emphasis?: boolean
}) {
  const inner = (
    <>
      <span className="text-xs text-muted-foreground">{label}</span>
      <span
        className="ms-auto text-xs font-medium tabular-nums"
        style={{ color: emphasis ? 'var(--chip-4)' : 'var(--foreground)' }}
      >
        {value}
      </span>
      {href && (
        <i className="fa-light fa-chevron-right text-muted-foreground" style={{ fontSize: 10 }} aria-hidden="true" />
      )}
    </>
  )
  if (!href) {
    return <div className="flex items-center gap-1.5 py-1 border-t border-border/60">{inner}</div>
  }
  return (
    <Link
      href={href}
      className="flex items-center gap-1.5 py-1 border-t border-border/60 hover:bg-muted/40 -mx-1 px-1 rounded-sm focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      {inner}
    </Link>
  )
}

function TermCard({
  snap,
  isSelected,
  isCurrentTerm,
}: {
  snap: TermSnapshot
  isSelected: boolean
  isCurrentTerm: boolean
}) {
  const badge = STAGE_BADGE[snap.stage]
  const rows: { label: string; value: string; href?: string; emphasis?: boolean }[] = []
  if (snap.stage === 'upcoming') {
    rows.push({
      label: 'Evaluations created',
      value: snap.coverage ? `${snap.coverage.surveyed} of ${snap.coverage.total}` : `${snap.total}`,
      href: `/surveys/push?term=${snap.term.id}`,
    })
    rows.push({
      label: 'Opens',
      value: new Date(snap.term.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    })
  }
  if (snap.stage === 'live') {
    rows.push({ label: 'Live', value: `${snap.live}`, href: '/surveys?status=active,collecting' })
    if (snap.atRisk > 0) {
      rows.push({ label: 'At risk', value: `${snap.atRisk}`, href: '/surveys?status=active,collecting', emphasis: true })
    }
    if (snap.coverage && snap.coverage.surveyed < snap.coverage.total) {
      rows.push({
        label: 'Courses covered',
        value: `${snap.coverage.surveyed} of ${snap.coverage.total}`,
        href: `/surveys/push?term=${snap.term.id}`,
      })
    }
    if (snap.daysLeft != null) rows.push({ label: 'Window closes', value: `in ${snap.daysLeft}d` })
  }
  if (snap.stage === 'review') {
    rows.push({ label: 'In review', value: `${snap.pending}`, href: '/surveys?status=pending_review,closed', emphasis: true })
    rows.push({ label: 'Released', value: `${snap.released} of ${snap.total}`, href: '/results' })
  }
  if (snap.stage === 'complete') {
    rows.push({ label: 'Released', value: `${snap.released} of ${snap.total}`, href: '/results' })
  }

  return (
    <div
      className={`relative rounded-lg border bg-card px-4 pb-2 pt-3 ${
        isSelected ? 'border-ring' : 'border-border'
      }`}
    >
      {/* selection accent — a structural cue no hover state uses */}
      {isSelected && (
        <span
          aria-hidden="true"
          className="absolute inset-x-0 top-0 h-0.5 rounded-t-lg"
          style={{ background: 'var(--brand-color)' }}
        />
      )}
      <Link
        href={`/course-evaluation/dashboard?term=${snap.term.id}`}
        aria-current={isSelected ? 'true' : undefined}
        aria-label={`View ${snap.term.name} on this dashboard`}
        className="group block focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 rounded-sm"
      >
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-medium text-foreground group-hover:underline underline-offset-2">
            {snap.term.name}
            {isCurrentTerm && (
              <span className="text-xs text-muted-foreground font-normal"> · current</span>
            )}
          </span>
          <StatusBadge label={badge.label} tone={badge.tone} />
        </div>
        <div className="mt-1.5 mb-2 flex items-end gap-2">
          <span className="text-xl font-semibold tabular-nums leading-none text-foreground">
            {snap.rate != null ? `${snap.rate}%` : '—'}
          </span>
          <span className="text-xs text-muted-foreground pb-px">
            response rate · target {RESPONSE_TARGET}%
          </span>
        </div>
      </Link>
      <div className="flex flex-col">
        {rows.map((r) => (
          <CardStatRow key={r.label} {...r} />
        ))}
      </div>
    </div>
  )
}

/* ── Term health lanes — THE hero viz ─────────────────────────────────────────
   The push evaluates three subject streams (courses · faculty · end-of-term).
   One shared 0–100% response axis, one lane per stream, one dot per entity —
   spread, laggards, and stream size in a single glance, replacing the text
   strip + end-of-term row list (Romit 2026-07-08: visuals, not words). Same
   track anatomy as the results-page ThemeStripPlot / analytics ScoreLandscape. */

interface LaneDot {
  key: string
  /** Short axis label (course code, faculty surname, truncated survey name). */
  label: string
  /** Full name for tooltips + the accessible data table. */
  full?: string
  rate: number
  /** Below the response minimum — results would be suppressed. */
  critical?: boolean
}

interface Lane {
  key: string
  label: string
  href: string
  dots: LaneDot[]
}

/* ── Stream cards — the catalog's ranked horizontal-bar recipe, verbatim from
   analytics-panels "Course rankings" (:4000 vocabulary): ChartCard →
   ChartFigure → ChartContainer(rows*24+8) → vertical BarChart, muted track
   background, tier Cells, keyboard-synced tooltip → ChartDataTable.
   In-window response rate is the sanctioned 0→100% in-flight bar case.
   One card per subject stream so each keeps its own semantics. ── */

const streamConfig: ChartConfig = { rate: { label: 'Response rate', color: 'var(--chart-2)' } }

/* Completion tier — same fn as analytics-panels completionColor. */
const completionTier = (pct: number) =>
  pct >= 70 ? 'var(--chart-2)' : pct >= 60 ? 'var(--brand-color)' : 'var(--chart-4)'

function StreamRateCard({
  title,
  description,
  dots,
  href,
  hrefLabel,
  yWidth = 68,
}: {
  title: string
  description: string
  dots: LaneDot[]
  href: string
  hrefLabel: string
  yWidth?: number
}) {
  if (dots.length === 0) return null
  const data = [...dots].sort((a, b) => a.rate - b.rate) // needs-attention first
  const below = dots.filter((d) => d.rate < RESPONSE_TARGET).length
  return (
    <ChartCard variant="normal" title={title} description={description}>
      <ChartFigure
        label={title}
        summary={`Horizontal bar chart of response rate per ${title.toLowerCase().replace(/s$/, '')} against a ${RESPONSE_TARGET} percent target. ${below} of ${dots.length} below target.`}
        dataLength={data.length}
      >
        {(activeIndex) => (
          <>
            <ChartContainer
              config={streamConfig}
              style={{ height: `${data.length * 24 + 8}px` }}
              className="w-full"
            >
              <BarChart accessibilityLayer layout="vertical" data={data} margin={{ top: 0, right: 36, bottom: 0, left: 0 }}>
                <XAxis type="number" domain={[0, 100]} hide />
                <YAxis type="category" dataKey="label" width={yWidth} tick={CHART_AXIS_TICK} tickLine={false} axisLine={false} />
                <ReferenceLine x={RESPONSE_TARGET} stroke="var(--muted-foreground)" strokeDasharray="4 3" />
                <Bar dataKey="rate" radius={[0, 3, 3, 0]} maxBarSize={14} background={{ fill: 'var(--muted)' }} isAnimationActive={false} activeBar={{ stroke: 'var(--ring)', strokeWidth: 2 }} {...(activeIndex != null ? { activeIndex } : {})}>
                  {data.map((d) => <Cell key={d.key} fill={completionTier(d.rate)} />)}
                </Bar>
                <ChartTooltip
                  key={chartTooltipKeyboardSyncProps(activeIndex).key}
                  {...chartTooltipKeyboardSyncProps(activeIndex).props}
                  cursor={false}
                  content={
                    <ChartTooltipContent
                      formatter={(v: unknown, _n, item) => [
                        `${(item?.payload as LaneDot | undefined)?.full ?? ''} — ${v as number}%${(item?.payload as LaneDot | undefined)?.critical ? ' · below response minimum' : ''}`,
                        '',
                      ]}
                    />
                  }
                />
              </BarChart>
            </ChartContainer>
            <ChartDataTable
              caption={title}
              headers={[title, 'Response rate']}
              rows={data.map((d) => [d.full ?? d.label, `${d.rate}%`])}
            />
          </>
        )}
      </ChartFigure>
      <div className="mt-2 border-t border-border pt-2 flex items-center justify-between gap-2 text-xs tabular-nums">
        <span style={{ color: below > 0 ? 'var(--chip-4)' : 'var(--muted-foreground)' }}>
          {below > 0 ? `${below} below ${RESPONSE_TARGET}%` : 'All on target'}
        </span>
        <Link
          href={href}
          className="text-muted-foreground hover:text-foreground hover:underline underline-offset-2 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 rounded-sm"
        >
          {hrefLabel}
        </Link>
      </div>
    </ChartCard>
  )
}

/* ── collection progress chart config ─────────────────────────────────────── */

const collectionConfig: ChartConfig = {
  responses: { label: 'Responses that day', color: 'var(--chart-1)' },
  cumulativePct: { label: 'Cumulative rate', color: 'var(--brand-color)' },
}

/* ── page ─────────────────────────────────────────────────────────────────── */

function DashboardHomeInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { surveys, sendSurveyReminder } = usePce()
  const [setupOpen, setSetupOpen] = useState(false)
  const [remindTargets, setRemindTargets] = useState<PceSurvey[]>([])
  const [extendTargets, setExtendTargets] = useState<PceSurvey[]>([])
  const [remindedIds, setRemindedIds] = useState<Set<string>>(new Set())
  const [reminderSentTo, setReminderSentTo] = useState<string | null>(null)

  const curId = currentTermId()
  const requested = searchParams?.get('term')
  const selectedTerm =
    termsOrdered.find((t) => t.id === requested) ??
    termsOrdered.find((t) => t.id === curId) ??
    termsOrdered[0]
  const curIdx = termsOrdered.findIndex((t) => t.id === curId)

  // A confirmation belongs to the term it happened in — never carry it across.
  useEffect(() => {
    setReminderSentTo(null)
  }, [selectedTerm.id])

  const ce = useMemo(
    () => surveys.filter((s) => !s.surveyType || s.surveyType === 'course_evaluation'),
    [surveys],
  )
  const termSurveys = useMemo(
    () => ce.filter((s) => s.term === selectedTerm.name),
    [ce, selectedTerm.name],
  )

  /* Terms band — last / current / upcoming trio (+ the selected past term) */
  const bandTerms = useMemo(() => {
    const trio = [termsOrdered[curIdx - 1], termsOrdered[curIdx], termsOrdered[curIdx + 1]]
      .filter((t): t is ProgramTerm => !!t)
    if (!trio.some((t) => t.id === selectedTerm.id)) trio.unshift(selectedTerm)
    return trio.map((t) => snapshot(t, ce))
  }, [ce, curIdx, selectedTerm])
  const olderTerms = useMemo(
    () => termsOrdered.slice(0, Math.max(0, curIdx - 1)).reverse(),
    [curIdx],
  )

  /* Past-term opener — academic year and term are SEPARATE dropdowns (they are
     independent axes on ProgramTerm; a merged "Spring 2025 · AY 2024–2025" list
     conflates them). Year narrows, term navigates. */
  const [pastYear, setPastYear] = useState<string | null>(null)
  const pastYears = useMemo(() => {
    const ys: string[] = []
    for (const t of olderTerms) if (!ys.includes(t.academicYear)) ys.push(t.academicYear)
    return ys
  }, [olderTerms])
  const selectedPast = olderTerms.find((t) => t.id === selectedTerm.id)
  const pastYearValue = pastYear ?? selectedPast?.academicYear ?? ''
  const pastYearTerms = olderTerms.filter((t) => t.academicYear === pastYearValue)
  const pastTermValue =
    selectedPast && selectedPast.academicYear === pastYearValue ? selectedPast.id : ''

  const liveSurveys = termSurveys.filter(LIVE)
  const responsesCollected = termSurveys.reduce((s, x) => s + x.responseCount, 0)
  const enrolledTotal = termSurveys.reduce((s, x) => s + x.enrollmentCount, 0)
  const closingThisWeek = liveSurveys.filter((s) => {
    const d = s.deadline ? daysUntil(s.deadline) : null
    return d != null && d >= 0 && d <= 7
  }).length

  /* Subject model — one push evaluates courses, faculty, and the term itself */
  const endOfTerm = useMemo(
    () =>
      surveys.filter(
        (s) => s.surveyType === 'programmatic' && s.term === selectedTerm.name && s.status !== 'draft',
      ),
    [surveys, selectedTerm.name],
  )

  /* Term-health lanes — the three subject streams, one dot per entity */
  const healthLanes: Lane[] = useMemo(() => {
    const courseDots: LaneDot[] = termSurveys
      .filter((s) => s.responseCount > 0 || LIVE(s))
      .map((s) => ({
        key: s.id,
        label: s.courseCode,
        full: `${s.courseCode} — ${s.courseName}`,
        rate: s.responseRate,
        critical: LIVE(s) && s.responseCount < (s.minimumThreshold ?? MINIMUM_THRESHOLD),
      }))
    const byFaculty = new Map<string, { name: string; enrolled: number; weighted: number }>()
    for (const s of termSurveys) {
      if (s.responseCount === 0 && !LIVE(s)) continue
      for (const i of s.instructors) {
        const cur = byFaculty.get(i.id) ?? { name: i.name, enrolled: 0, weighted: 0 }
        cur.enrolled += s.enrollmentCount
        cur.weighted += s.responseRate * s.enrollmentCount
        byFaculty.set(i.id, cur)
      }
    }
    const facultyDots: LaneDot[] = [...byFaculty.entries()].map(([id, f]) => ({
      key: id,
      label: f.name.split(' ').pop() ?? f.name, // surname on the axis
      full: f.name,
      rate: f.enrolled ? Math.round(f.weighted / f.enrolled) : 0,
    }))
    const eotDots: LaneDot[] = endOfTerm
      .filter((s) => s.responseCount > 0 || LIVE(s))
      .map((s) => {
        const short = s.courseCode.split('—')[0].trim()
        return {
          key: s.id,
          label: short.length > 18 ? `${short.slice(0, 17)}…` : short,
          full: s.courseCode,
          rate: s.responseRate,
        }
      })
    return [
      { key: 'courses', label: 'Courses', href: '/surveys', dots: courseDots },
      { key: 'faculty', label: 'Faculty', href: '/analytics?tab=faculty', dots: facultyDots },
      { key: 'eot', label: 'End-of-term', href: '/surveys/programmatic', dots: eotDots },
    ]
  }, [termSurveys, endOfTerm])

  /* Collection-progress series (term-scoped, daily) */
  const collection = useMemo(
    () => termCollectionSeries(termSurveys, selectedTerm),
    [termSurveys, selectedTerm],
  )
  const pace = useMemo(
    () => paceToTarget(collection.points, collection.enrolled, collection.collected, RESPONSE_TARGET),
    [collection],
  )
  const reminderDays = collection.points.filter((p) => p.reminder)
  const todayPoint = collection.points.find((p) => p.isToday)
  const cumulativeNow =
    [...collection.points].reverse().find((p) => p.cumulativePct != null)?.cumulativePct ?? null

  // One-line pace read under the chart — insight without extra chrome.
  const lift = useMemo(() => bestReminderLift(collection.points), [collection.points])
  const paceCaption =
    cumulativeNow == null
      ? null
      : pace
        ? `${cumulativeNow}% collected — about ${pace.perDay} responses/day needed to hit ${RESPONSE_TARGET}% by close.${lift ? ` The ${lift.day} reminder lifted daily responses ×${lift.lift.toFixed(1)}.` : ''}`
        : cumulativeNow >= RESPONSE_TARGET
          ? `Target reached — ${cumulativeNow}% of students responded.`
          : `Collection ended at ${cumulativeNow}%, below the ${RESPONSE_TARGET}% target.`

  /* Weekly rollup for the accessible data table (daily rows would be 30+). */
  const weeklyRows = useMemo(() => {
    const weeks = new Map<string, { responses: number; last: string; lastPct: number | null }>()
    for (const p of collection.points) {
      if (p.responses == null) continue
      const wk = `Week of ${collection.points[Math.floor(collection.points.indexOf(p) / 7) * 7]?.day ?? p.day}`
      const cur = weeks.get(wk) ?? { responses: 0, last: p.day, lastPct: null }
      cur.responses += p.responses
      cur.last = p.day
      cur.lastPct = p.cumulativePct
      weeks.set(wk, cur)
    }
    return [...weeks.entries()].map(([wk, v]) => [wk, v.responses, v.lastPct != null ? `${v.lastPct}%` : '—'])
  }, [collection.points])

  const tableRows: SurveyRow[] = useMemo(
    () =>
      [...termSurveys]
        .sort(
          (a, b) =>
            (STATUS_ORDER[a.status] ?? 9) - (STATUS_ORDER[b.status] ?? 9) ||
            a.responseRate - b.responseRate,
        )
        .map((s) => s as SurveyRow),
    [termSurveys],
  )

  const columns: ColumnDef<SurveyRow>[] = useMemo(
    () => [
      {
        key: 'courseCode',
        label: 'Course',
        sortable: true,
        cell: (row) => (
          <Link
            href={`/surveys/${row.id}`}
            onClick={(e) => e.stopPropagation()}
            className="block min-w-0 hover:underline underline-offset-2 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 rounded-sm"
          >
            <p className="text-sm font-medium">{row.courseCode}</p>
            <p className="text-xs text-muted-foreground truncate max-w-[220px]">{row.courseName}</p>
          </Link>
        ),
      },
      {
        key: 'faculty',
        label: 'Faculty',
        width: 190,
        cell: (row) => {
          const primary = row.instructors.find((i) => i.role === 'primary') ?? row.instructors[0]
          if (!primary) return <span className="text-sm text-muted-foreground">—</span>
          const extra = row.instructors.length - 1
          return (
            <div className="flex items-center gap-1.5 min-w-0">
              <PersonIdentityCell name={primary.name} initials={primary.initials} />
              {extra > 0 && (
                <span className="text-xs text-muted-foreground shrink-0" title={row.instructors.slice(1).map((i) => i.name).join(', ')}>
                  +{extra}
                </span>
              )}
            </div>
          )
        },
      },
      {
        key: 'status',
        label: 'Status',
        sortable: true,
        width: 140,
        cell: (row) => <SurveyStatusBadgeOS status={row.status} />,
      },
      {
        key: 'responseRate',
        label: 'Response rate',
        sortable: true,
        width: 120,
        header: () => <span className="block text-right">Response rate</span>,
        cell: (row) => (
          <div className="text-right">
            <p className="text-sm tabular-nums font-medium text-foreground flex items-center justify-end gap-1.5">
              {row.responseCount > 0 && (
                <span
                  role="img"
                  aria-label={row.responseRate >= RESPONSE_TARGET ? 'on target' : 'below target'}
                  style={{ display: 'inline-block', width: 7, height: 7, borderRadius: '50%', backgroundColor: rateColor(row.responseRate), flexShrink: 0 }}
                />
              )}
              {row.responseCount > 0 ? `${row.responseRate}%` : '—'}
            </p>
            <p className="text-xs text-muted-foreground tabular-nums">
              {row.responseCount}/{row.enrollmentCount}
            </p>
          </div>
        ),
      },
      {
        key: 'deadline',
        label: 'Closes',
        sortable: true,
        width: 130,
        cell: (row) => {
          const d = row.deadline ? daysUntil(row.deadline) : null
          if (LIVE(row) && d != null) {
            return (
              <div>
                <p className="text-sm tabular-nums">{row.deadline}</p>
                <p
                  className="text-xs tabular-nums"
                  style={{ color: d <= 3 ? 'var(--chip-4)' : 'var(--muted-foreground)' }}
                >
                  {d <= 0 ? 'closes today' : `${d}d left`}
                </p>
              </div>
            )
          }
          return <span className="text-xs text-muted-foreground">{row.deadline || '—'}</span>
        },
      },
      {
        key: 'actions',
        label: '',
        width: 220,
        cell: (row) => {
          const isAtRisk = LIVE(row) && row.responseRate < AT_RISK_THRESHOLD
          const sentThisSession = remindedIds.has(row.id)
          return (
            <div className="flex items-center justify-end gap-1">
              {isAtRisk && sentThisSession && (
                <span className="text-xs text-muted-foreground pe-1">Sent today</span>
              )}
              {isAtRisk && !sentThisSession && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    setRemindTargets([row])
                  }}
                  aria-label={`Send ad-hoc reminder for ${row.courseCode}`}
                >
                  Remind
                </Button>
              )}
              {/* Low response rate → offer more collection time inline */}
              {isAtRisk && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    setExtendTargets([row])
                  }}
                  aria-label={`Extend the evaluation window for ${row.courseCode}`}
                >
                  Extend
                </Button>
              )}
              {FINISHED(row) && (
                <Button
                  variant="ghost"
                  size="sm"
                  asChild
                  className="px-1 text-muted-foreground hover:text-foreground"
                >
                  <Link href={`/results/${row.id}`} onClick={(e) => e.stopPropagation()}>
                    Results
                    <i className="fa-light fa-arrow-right" aria-hidden="true" />
                  </Link>
                </Button>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`More actions for ${row.courseCode}`}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <i className="fa-light fa-ellipsis" aria-hidden="true" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                  <DropdownMenuItem onSelect={() => router.push(`/surveys/${row.id}`)}>
                    View evaluation
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => router.push(`/surveys/${row.id}/preview`)}>
                    Preview form
                  </DropdownMenuItem>
                  {LIVE(row) && !isAtRisk && (
                    <DropdownMenuItem onSelect={() => setRemindTargets([row])}>
                      Send reminder
                    </DropdownMenuItem>
                  )}
                  {LIVE(row) && !isAtRisk && (
                    <DropdownMenuItem onSelect={() => setExtendTargets([row])}>
                      Edit end date
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )
        },
      },
    ],
    [router, remindedIds],
  )

  const firstRun = ce.length === 0
  const window = evalWindow(selectedTerm)

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <SiteHeader title="Dashboard" />
      <PageHeader
        title="Dashboard"
        subtitle="Course evaluations by term — health, access, and interventions"
        actions={
          <div className="flex items-center gap-2" role="group" aria-label="Dashboard actions">
            <Button variant="outline" size="default" onClick={() => setSetupOpen(true)}>
              Configure Term Calendar
            </Button>
            <Button variant="default" size="default" asChild>
              <Link href="/surveys/push">Send Evaluations</Link>
            </Button>
          </div>
        }
      />

      <div className="flex-1 overflow-auto px-7 py-4">
        {firstRun ? (
          <FirstRun onConfigure={() => setSetupOpen(true)} />
        ) : (
          <div className="flex flex-col gap-6 max-w-6xl">
            {/* ── Terms band — the program overview (visible master) ── */}
            <nav aria-label="Terms" className="flex flex-col gap-2">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-baseline gap-2">
                  <h2 className="text-sm font-semibold text-foreground">Terms</h2>
                  <span className="text-xs text-muted-foreground">
                    Select a term to scope the page
                  </span>
                </div>
                {olderTerms.length > 0 && (
                  /* Academic year and term are separate axes (ProgramTerm.season
                     is independent of academicYear) — never merged in one list. */
                  <div className="flex items-center gap-2" role="group" aria-label="Open a past term">
                    <span className="text-xs text-muted-foreground">Open a past term</span>
                    <Select value={pastYearValue} onValueChange={setPastYear}>
                      <SelectTrigger className="h-8 w-36 text-sm" aria-label="Academic year">
                        <SelectValue placeholder="Academic year" />
                      </SelectTrigger>
                      <SelectContent>
                        {pastYears.map((y) => (
                          <SelectItem key={y} value={y}>
                            AY {y}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select
                      value={pastTermValue}
                      onValueChange={(v) => router.push(`/course-evaluation/dashboard?term=${v}`)}
                      disabled={!pastYearValue}
                    >
                      <SelectTrigger className="h-8 w-32 text-sm" aria-label="Term">
                        <SelectValue placeholder="Term" />
                      </SelectTrigger>
                      <SelectContent>
                        {pastYearTerms.map((t) => (
                          <SelectItem key={t.id} value={t.id}>
                            {t.season}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
              <div className={`grid grid-cols-1 gap-3 ${bandTerms.length > 3 ? 'md:grid-cols-4' : 'md:grid-cols-3'}`}>
                {bandTerms.map((snap) => (
                  <TermCard
                    key={snap.term.id}
                    snap={snap}
                    isSelected={snap.term.id === selectedTerm.id}
                    isCurrentTerm={snap.term.id === curId}
                  />
                ))}
              </div>
            </nav>

            {/* ── Detail zone — scoped to the selected term ── */}
            <div className="flex flex-col gap-1">
              <h2 className="font-heading text-2xl font-semibold text-foreground">
                {selectedTerm.name}
              </h2>
              <p className="text-xs text-muted-foreground tabular-nums">
                {enrolledTotal > 0 ? (
                  <>
                    <span className="font-medium text-foreground">
                      {responsesCollected.toLocaleString()} of {enrolledTotal.toLocaleString()} students responded
                    </span>
                    {closingThisWeek > 0 ? (
                      <> · <span className="font-medium text-foreground">{closingThisWeek} closing this week</span></>
                    ) : null}
                    {' · '}
                  </>
                ) : null}
                {window.open} – {window.close} · AY {selectedTerm.academicYear}
              </p>
            </div>

            {/* ── HERO — the three evaluation streams, each its own catalog
                   ranked-bar chart: courses · faculty · end-of-term. Daily
                   pace + AI themes follow. ── */}
            {healthLanes.some((l) => l.dots.length > 0) && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
                <StreamRateCard
                  title="Courses"
                  description={`Response rate per evaluation · ${RESPONSE_TARGET}% target`}
                  dots={healthLanes[0].dots}
                  href="/surveys"
                  hrefLabel="All evaluations"
                />
                <StreamRateCard
                  title="Faculty"
                  description="Avg response across each faculty member's evaluations"
                  dots={healthLanes[1].dots}
                  href="/analytics?tab=faculty"
                  hrefLabel="By faculty"
                  yWidth={76}
                />
                <StreamRateCard
                  title="End-of-term"
                  description="Response rate per programmatic survey"
                  dots={healthLanes[2].dots}
                  href="/surveys/programmatic"
                  hrefLabel="Programmatic"
                  yWidth={110}
                />
              </div>
            )}

            {/* Daily pace + AI themes */}
            <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-4 items-stretch">
              <ChartCard
                variant="normal"
                title="Daily pace"
                description={`Responses per day and cumulative rate · ${RESPONSE_TARGET}% target · amber markers = reminders`}
              >
                {collection.points.length > 0 ? (
                  <ChartFigure
                    label="Daily collection pace"
                    summary={`Daily responses and cumulative response rate across the ${selectedTerm.name} collection window against a ${RESPONSE_TARGET} percent target. ${cumulativeNow != null ? `Currently ${cumulativeNow} percent.` : ''} Reminder days are marked.`}
                    dataLength={collection.points.length}
                  >
                    {(activeIndex) => (
                      <>
                        <ChartContainer config={collectionConfig} className="h-52 w-full">
                          <ComposedChart
                            accessibilityLayer
                            data={collection.points}
                            margin={{ left: 0, right: 8, top: 4, bottom: 0 }}
                          >
                            <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="var(--border)" />
                            <XAxis
                              dataKey="day"
                              tickLine={false}
                              axisLine={false}
                              tick={CHART_AXIS_TICK}
                              interval="preserveStartEnd"
                              minTickGap={28}
                            />
                            <YAxis
                              yAxisId="pct"
                              domain={[0, 100]}
                              ticks={[0, 25, 50, 75, 100]}
                              tickFormatter={(v: number) => `${v}%`}
                              width={40}
                              tickLine={false}
                              axisLine={false}
                              tick={CHART_AXIS_TICK}
                            />
                            <YAxis yAxisId="count" hide />
                            <ReferenceLine
                              yAxisId="pct"
                              y={RESPONSE_TARGET}
                              stroke="var(--muted-foreground)"
                              strokeDasharray="4 3"
                              label={{ value: `${RESPONSE_TARGET}% target`, position: 'insideTopLeft', fontSize: CHART_TICK_FONT_SIZE, fill: 'var(--muted-foreground)' }}
                            />
                            {todayPoint && collection.points.some((p) => p.future) && (
                              <ReferenceLine
                                yAxisId="pct"
                                x={todayPoint.day}
                                stroke="var(--border-control-35)"
                                label={{ value: 'Today', position: 'insideTop', fontSize: CHART_TICK_FONT_SIZE, fill: 'var(--muted-foreground)' }}
                              />
                            )}
                            {reminderDays.map((p) => (
                              <ReferenceLine
                                key={p.iso}
                                yAxisId="pct"
                                x={p.day}
                                stroke="var(--chart-4)"
                                strokeDasharray="2 2"
                              />
                            ))}
                            <ChartTooltip
                              key={chartTooltipKeyboardSyncProps(activeIndex).key}
                              {...chartTooltipKeyboardSyncProps(activeIndex).props}
                              cursor={{ stroke: 'var(--border)' }}
                              content={
                                <ChartTooltipContent
                                  formatter={(v: unknown, name: unknown) => [
                                    name === 'cumulativePct' ? `${v as number}% cumulative` : `${v as number} responses`,
                                    '',
                                  ]}
                                />
                              }
                            />
                            <Bar
                              yAxisId="count"
                              dataKey="responses"
                              fill="var(--chart-1)"
                              fillOpacity={0.5}
                              maxBarSize={10}
                              radius={[2, 2, 0, 0]}
                              isAnimationActive={false}
                            />
                            <Line
                              yAxisId="pct"
                              type="monotone"
                              dataKey="cumulativePct"
                              stroke="var(--brand-color)"
                              strokeWidth={2}
                              dot={false}
                              connectNulls={false}
                              isAnimationActive={false}
                            />
                          </ComposedChart>
                        </ChartContainer>
                        {paceCaption && (
                          <p className="text-xs text-muted-foreground mt-2 tabular-nums">{paceCaption}</p>
                        )}
                        <ChartDataTable
                          caption="Collection progress by week"
                          headers={['Week', 'Responses', 'Cumulative rate']}
                          rows={weeklyRows}
                        />
                      </>
                    )}
                  </ChartFigure>
                ) : (
                  <p className="text-xs text-muted-foreground py-6">
                    Collection hasn’t started for this term yet.
                  </p>
                )}
              </ChartCard>

              <TermThemesInsight
                surveys={termSurveys}
                scopeLabel={selectedTerm.name}
                className="h-full"
              />
            </div>

            {reminderSentTo && (
              <LocalBanner
                variant="success"
                title="Reminder sent"
                dismissible
                onDismiss={() => setReminderSentTo(null)}
              >
                An ad-hoc reminder went out to non-responders in {reminderSentTo}.
              </LocalBanner>
            )}

            {/* Evaluations — the worklist comes before the analysis. At-risk
                rows carry Remind + Extend inline (the Needs-attention card was
                removed; interventions live on the rows themselves). */}
            <section className="flex flex-col gap-2">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-sm font-semibold text-foreground">
                  Evaluations ({tableRows.length})
                </h2>
                <Button
                  variant="ghost"
                  size="sm"
                  asChild
                  className="px-0 text-muted-foreground hover:text-foreground"
                >
                  <Link href="/surveys">
                    Open Evaluations hub
                    <i className="fa-light fa-arrow-right" aria-hidden="true" />
                  </Link>
                </Button>
              </div>
              <DataTable<SurveyRow>
                data={tableRows}
                columns={columns}
                getRowId={(row) => row.id}
                searchable={false}
                showQueryControls={false}
                edgeInset={false}
                onRowClick={(row) => router.push(`/surveys/${row.id}`)}
                emptyState={
                  <div className="flex flex-col items-center gap-2 py-8">
                    <i className="fa-light fa-calendar-plus text-muted-foreground" aria-hidden="true" style={{ fontSize: 24 }} />
                    <p className="text-sm font-medium">No evaluations in {selectedTerm.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Send evaluations to populate this term.
                    </p>
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/surveys/push?term=${selectedTerm.id}`}>
                        Set up {selectedTerm.name} evaluations
                      </Link>
                    </Button>
                  </div>
                }
              />
            </section>

          </div>
        )}
      </div>

      <SetupTermSheet open={setupOpen} onOpenChange={setSetupOpen} />

      {/* Extend close date — same dialog the hub uses (PRD: single or bulk) */}
      <EditEndDateDialog
        open={extendTargets.length > 0}
        onOpenChange={(v) => !v && setExtendTargets([])}
        surveys={extendTargets}
      />

      <SendReminderDialog
        open={remindTargets.length > 0}
        onOpenChange={(v) => !v && setRemindTargets([])}
        surveys={remindTargets}
        onSent={(codes) => {
          setReminderSentTo(codes)
          setRemindedIds((prev) => {
            const next = new Set(prev)
            remindTargets.forEach((t) => next.add(t.id))
            return next
          })
        }}
      />
    </div>
  )
}

export function DashboardHome() {
  return (
    <Suspense>
      <DashboardHomeInner />
    </Suspense>
  )
}

function FirstRun({ onConfigure }: { onConfigure: () => void }) {
  return (
    <div className="flex min-h-[min(420px,60vh)] flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border bg-muted/25 px-6">
      <i
        className="fa-light fa-calendar-plus text-muted-foreground"
        aria-hidden="true"
        style={{ fontSize: 32 }}
      />
      <div className="flex flex-col items-center gap-1">
        <h2 className="text-sm font-medium text-foreground">No term set up yet</h2>
        <p className="text-sm text-muted-foreground" style={{ maxWidth: 340, textAlign: 'center' }}>
          Configure a term calendar to discover its course offerings and start
          driving evaluation response rates.
        </p>
      </div>
      <Button variant="default" size="sm" onClick={onConfigure}>
        Configure Term Calendar
      </Button>
    </div>
  )
}
