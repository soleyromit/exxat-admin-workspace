'use client'

// ============================================================================
// Breakdown row-list — VARIANT G: VIVID TILE GRID (compare route, throwaway).
//
// Round 3, same day — literal translation of the approved Claude Design
// canvas's "Direction C" artboard into DS components + real data. Trades the
// stacked-row list for a widget layer: each present bucket (Setup, Scheduled,
// Live, Closed) becomes a saturated color tile (Vapi's metrics-card
// language) with its own icon, headline value, and a mini progress ring —
// then only the bucket that actually needs a decision expands into a compact
// detail panel below with the course chips, the story, and its action. Two
// depths instead of one flat list: scan the tiles, act on the one panel.
//
// Colors are exclusively the DS's own StatusTint values — the tile gradient
// runs from a tint's `fg` (its darkest defined step) to its `border` (its
// mid step), never an invented oklch literal or a `color-mix(in oklch` blend
// (a first pass used both; grepped clean and fixed after Romit flagged the
// colors didn't match the DS). Unchanged from every prior pass: ghost-Button
// RowAction for the one action a bucket gets,
// CourseChips naming courses, sentence case, amber-only for warnings, no
// per-row chart — the mini ring is a fixed decorative gauge on the tile's own
// single value, not a chart of data.
// ============================================================================

import { useMemo } from 'react'
import {
  Badge,
  Card, CardContent, CardFooter, CardHeader, CardTitle,
  StatusBadge,
  HoverCard, HoverCardTrigger, HoverCardContent,
} from '@exxatdesignux/ui'
import type { StatusBadgeTone } from '@exxatdesignux/ui'
import { usePce } from '@/components/pce/pce-state'
import { RowAction } from '@/components/pce/term-breakdown'
import {
  LIST_HUB_STATUS_TINT_WARNING,
  LIST_HUB_STATUS_TINT_PLANNED,
  LIST_HUB_STATUS_TINT_SUCCESS,
  LIST_HUB_STATUS_TINT_COMPLETED,
  type StatusTint,
} from '@/lib/list-status-badges'
import {
  classifyTermWindow, breakdownFor, evalWindow, parseDate,
  weightedRate, coveragePercent, isFullyCovered, coverageCodes,
  liveAtRiskCodes, liveUrgentConsequence, coverageUrgentConsequence,
  courseRates,
  type CourseBreakdown, type TermWindowPosition,
} from '@/lib/pce-term-metrics'
import type { ProgramTerm, PceSurvey } from '@/lib/pce-mock-data'

/* ── tile palette — every stop is a real DS StatusTint value, nothing
      invented: the gradient runs from the tint's own `fg` (its darkest
      defined step) to its `border` (its mid step), so a "vivid" tile is
      still built entirely out of colors the DS already ships. ───────────── */

const TILE: Record<'setup' | 'scheduled' | 'live' | 'closed', { icon: string; tint: StatusTint }> = {
  setup:     { icon: 'fa-clipboard-list',  tint: LIST_HUB_STATUS_TINT_WARNING },
  scheduled: { icon: 'fa-calendar',        tint: LIST_HUB_STATUS_TINT_PLANNED },
  live:      { icon: 'fa-tower-broadcast', tint: LIST_HUB_STATUS_TINT_SUCCESS },
  closed:    { icon: 'fa-circle-check',    tint: LIST_HUB_STATUS_TINT_COMPLETED },
}

function Ring({ percent }: { percent: number }) {
  const r = 16
  const c = 2 * Math.PI * r
  const offset = c * (1 - percent / 100)
  return (
    <svg viewBox="0 0 40 40" className="absolute bottom-2.5 right-2.5 size-10" aria-hidden="true">
      <circle cx="20" cy="20" r={r} fill="none" stroke="var(--primary-foreground)" strokeOpacity={0.28} strokeWidth="4" />
      <circle
        cx="20" cy="20" r={r} fill="none" stroke="var(--primary-foreground)" strokeOpacity={0.9} strokeWidth="4" strokeLinecap="round"
        strokeDasharray={c} strokeDashoffset={offset} transform="rotate(-90 20 20)"
      />
    </svg>
  )
}

function Tile({
  kind, label, value, sub, percent, wide = false,
}: {
  kind: keyof typeof TILE
  label: string
  value: string
  sub: string
  percent?: number
  wide?: boolean
}) {
  const t = TILE[kind]
  return (
    <div
      className={'relative flex min-h-24 flex-col gap-2 overflow-hidden rounded-xl p-3.5' + (wide ? ' col-span-2' : '')}
      style={{ background: `linear-gradient(155deg, ${t.tint.fg}, ${t.tint.border})`, color: 'var(--primary-foreground)' }}
    >
      <div className="flex items-center justify-between">
        <span className="text-[11.5px] font-semibold opacity-90">{label}</span>
        <span
          className="flex size-7 items-center justify-center rounded-full"
          style={{ background: 'var(--primary-foreground)' }}
        >
          <i className={`fa-solid ${t.icon}`} style={{ fontSize: 13, color: t.tint.fg }} aria-hidden="true" />
        </span>
      </div>
      <span className="text-[26px] font-bold leading-none tracking-tight tabular-nums">{value}</span>
      <span className="text-[11.5px] opacity-90">{sub}</span>
      {percent != null && <Ring percent={percent} />}
    </div>
  )
}

function CourseChips({
  codes, rates, atRisk, max = 3,
}: {
  codes: string[]
  rates?: Record<string, number>
  atRisk?: Set<string>
  max?: number
}) {
  if (codes.length === 0) return null
  const shown = codes.slice(0, max)
  const hidden = codes.slice(max)
  const label = (code: string) => (rates?.[code] != null ? `${code} · ${rates[code]}%` : code)
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {shown.map((code) => (
        <Badge
          key={code}
          variant="outline"
          className="rounded-full bg-card px-2.5 py-0 text-[11px] font-medium tabular-nums"
          style={
            atRisk?.has(code)
              ? { color: LIST_HUB_STATUS_TINT_WARNING.fg, background: 'var(--card)', borderColor: LIST_HUB_STATUS_TINT_WARNING.border, fontWeight: 700 }
              : undefined
          }
        >
          {label(code)}
        </Badge>
      ))}
      {hidden.length > 0 && (
        <HoverCard openDelay={100}>
          <HoverCardTrigger asChild>
            <Badge variant="outline" tabIndex={0} className="cursor-default rounded-full border-dashed bg-card px-2.5 py-0 text-[11px] font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" style={{ color: 'var(--primary)' }}>
              +{hidden.length} more
            </Badge>
          </HoverCardTrigger>
          <HoverCardContent align="start" className="w-auto max-w-64 p-2">
            <div className="flex flex-wrap gap-1">
              {hidden.map((code) => (
                <Badge key={code} variant="outline" className="rounded-full px-2 py-0 text-[11px] font-medium">{label(code)}</Badge>
              ))}
            </div>
          </HoverCardContent>
        </HoverCard>
      )}
    </div>
  )
}

function DetailPanel({
  title, chips, story, action, done = false,
}: {
  title: string
  chips: React.ReactNode
  story: string
  action: React.ReactNode
  done?: boolean
}) {
  return (
    <Card
      className="mx-5 mb-2 gap-2 rounded-lg border p-3 ring-0"
      style={
        done
          ? { background: LIST_HUB_STATUS_TINT_COMPLETED.bg, borderColor: LIST_HUB_STATUS_TINT_COMPLETED.border }
          : { background: LIST_HUB_STATUS_TINT_WARNING.bg, borderColor: LIST_HUB_STATUS_TINT_WARNING.border }
      }
    >
      <p className="text-[13px] font-semibold text-foreground">{title}</p>
      {chips}
      <div className="flex items-center justify-between gap-3">
        <p className="max-w-[70%] text-xs text-foreground/75">{story}</p>
        {action}
      </div>
    </Card>
  )
}

function Footer({ status, tally }: { status: { label: string; tone: 'warn' | 'done' }; tally: string }) {
  const color = status.tone === 'warn' ? LIST_HUB_STATUS_TINT_WARNING.fg : LIST_HUB_STATUS_TINT_COMPLETED.fg
  return (
    <CardFooter className="mt-auto flex items-center justify-between gap-3 border-t border-border pt-3.5">
      <span className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold" style={{ color }}>
        <span className="size-[7px] rounded-full" style={{ background: color }} />
        {status.label}
      </span>
      <span className="text-xs tabular-nums text-muted-foreground">{tally}</span>
    </CardFooter>
  )
}

const POSITION_BADGE: Record<Exclude<TermWindowPosition, 'future'>, { label: string; tone: StatusBadgeTone }> = {
  current:  { label: 'Current',   tone: 'success' },
  last:     { label: 'Last term', tone: 'neutral' },
  upcoming: { label: 'Upcoming',  tone: 'info' },
}

function TermCard({
  term, position, breakdown, hideLiveAndClosed = false, setupUrgent = null,
}: {
  term: ProgramTerm
  position: Exclude<TermWindowPosition, 'future'>
  breakdown: CourseBreakdown
  hideLiveAndClosed?: boolean
  setupUrgent?: { startsInDays: number } | null
}) {
  const b = breakdown
  const win = evalWindow(term)
  const dated = !!term.startDate && !!term.endDate
  const workspaceHref = (tab: 'active' | 'finished') => `/course-evaluation/term/${term.id}?tab=${tab}`

  const fullyCovered = isFullyCovered(b)
  const coveragePct = coveragePercent(b)
  const setupTotal = b.notConfiguredCount + b.draft.length
  const setupCodes = coverageCodes(b.notConfiguredCodes, b.draft)
  const scheduledCodes = b.scheduled.map((s: PceSurvey) => s.courseCode)
  const liveCodes = b.live.map((s: PceSurvey) => s.courseCode)
  const liveAtRisk = liveAtRiskCodes(b.live)
  const isLiveUrgent = liveAtRisk.size > 0
  const closedCodes = b.closed.map((s: PceSurvey) => s.courseCode)
  const isSetupUrgent = !!setupUrgent && !fullyCovered && setupTotal > 0
  const liveRate = b.live.length > 0 ? weightedRate(b.live) : null
  const closedRate = b.closed.length > 0 ? weightedRate(b.closed) : null

  const showLive = !hideLiveAndClosed && b.live.length > 0
  const showClosed = !hideLiveAndClosed && b.closed.length > 0
  const allClosed = showClosed && b.closed.length === b.totalCourses

  const tiles: React.ReactNode[] = []
  if (allClosed) {
    tiles.push(
      <Tile key="closed" kind="closed" wide label="All evaluations closed" value={`${closedRate ?? coveragePct}%`} sub={`average response across all ${b.totalCourses} courses`} />,
    )
  } else {
    if (setupTotal > 0) tiles.push(<Tile key="setup" kind="setup" label="Setup" value={String(setupTotal)} sub="courses need setup" percent={100 - coveragePct} />)
    if (b.scheduled.length > 0) tiles.push(<Tile key="sched" kind="scheduled" label="Scheduled" value={String(b.scheduled.length)} sub="courses scheduled" />)
    if (showLive) tiles.push(<Tile key="live" kind="live" label="Live" value={`${liveRate ?? '—'}%`} sub="avg response · in progress" percent={liveRate ?? 0} />)
    if (showClosed) tiles.push(<Tile key="closedp" kind="closed" label="Closed" value={String(b.closed.length)} sub={`of ${b.totalCourses} courses`} percent={Math.round((b.closed.length / b.totalCourses) * 100)} />)
  }

  const detail = isLiveUrgent
    ? {
        title: `${liveAtRisk.size} of ${b.live.length} live courses are behind target`,
        chips: <CourseChips codes={liveCodes} rates={courseRates(b.live)} atRisk={liveAtRisk} />,
        story: liveUrgentConsequence(b.live) ?? 'Worth a reminder before it closes.',
        action: <RowAction href={`/surveys/remind?from=term:${term.id}`} primary icon="fa-bell">Remind</RowAction>,
        done: false,
      }
    : isSetupUrgent
      ? {
          title: `${setupTotal} course${setupTotal === 1 ? '' : 's'} still need${setupTotal === 1 ? 's' : ''} setup`,
          chips: <CourseChips codes={setupCodes} />,
          story: coverageUrgentConsequence(setupUrgent!.startsInDays, coveragePct),
          action: <RowAction href={`/surveys/push?term=${term.id}`} primary icon="fa-plus">Set up evaluations</RowAction>,
          done: false,
        }
      : allClosed
        ? {
            title: `Highest response: ${[...closedCodes].sort((a, c) => (courseRates(b.closed)[c] ?? 0) - (courseRates(b.closed)[a] ?? 0))[0] ?? closedCodes[0]}`,
            chips: <CourseChips codes={closedCodes} rates={courseRates(b.closed)} />,
            story: 'Every course collected before the window closed.',
            action: <RowAction href={workspaceHref('finished')} primary icon="fa-share-from-square">Review feedback</RowAction>,
            done: true,
          }
        : setupTotal > 0
          ? {
              title: `${setupTotal} course${setupTotal === 1 ? '' : 's'} still need${setupTotal === 1 ? 's' : ''} setup`,
              chips: <CourseChips codes={setupCodes} />,
              story: 'Nothing collects until these evaluations are scheduled.',
              action: <RowAction href={`/surveys/push?term=${term.id}`} primary icon="fa-plus">Set up evaluations</RowAction>,
              done: false,
            }
          : b.scheduled.length > 0
            ? {
                title: `${b.scheduled.length} course${b.scheduled.length === 1 ? '' : 's'} scheduled`,
                chips: <CourseChips codes={scheduledCodes} />,
                story: 'These will open automatically on their evaluation date.',
                action: <RowAction href={workspaceHref('active')} primary icon="fa-pen-ruler">Manage</RowAction>,
                done: false,
              }
            : null

  const footerStatus = isLiveUrgent || isSetupUrgent
    ? { label: 'Needs attention', tone: 'warn' as const }
    : { label: allClosed ? 'Term complete' : 'On track', tone: 'done' as const }

  const tallyParts: string[] = []
  if (setupTotal > 0) tallyParts.push(`${setupTotal} need setup`)
  if (b.scheduled.length > 0) tallyParts.push(`${b.scheduled.length} scheduled`)
  if (b.live.length > 0) tallyParts.push(`${b.live.length} live`)
  if (b.closed.length > 0) tallyParts.push(`${b.closed.length} closed`)
  tallyParts.push(`${b.totalCourses} total`)

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <div className="flex min-w-0 items-center justify-between gap-2">
          <CardTitle className="min-w-0 truncate text-base font-semibold">{term.name}</CardTitle>
          <StatusBadge label={POSITION_BADGE[position].label} tone={POSITION_BADGE[position].tone} />
        </div>
        <p className="mt-0.5 text-xs text-muted-foreground">
          AY {term.academicYear.replace(/–20(\d\d)$/, '–$1')}
          {dated ? ` · Eval window ${win.open.replace(/, \d{4}$/, '')} – ${win.close}` : ' · Eval window not set'}
        </p>
      </CardHeader>

      <CardContent className="flex flex-col gap-3.5">
        <div className="grid grid-cols-2 gap-2.5">{tiles}</div>
      </CardContent>

      {detail && (
        <DetailPanel title={detail.title} chips={detail.chips} story={detail.story} action={detail.action} done={detail.done} />
      )}

      <Footer status={footerStatus} tally={tallyParts.join(' · ')} />
    </Card>
  )
}

function caseLabel(b: CourseBreakdown, hideLiveAndClosed: boolean): string {
  const setup = b.notConfiguredCount + b.draft.length + b.scheduled.length
  const live = hideLiveAndClosed ? 0 : b.live.length
  const closed = hideLiveAndClosed ? 0 : b.closed.length
  if (closed >= live && closed >= setup) return 'Case: mostly closed'
  if (live >= setup) return liveAtRiskCodes(b.live).size > 0 ? 'Case: live, with courses closing behind target' : 'Case: live and collecting'
  return 'Case: mostly setup'
}

export default function VariantVividTiles() {
  const { surveys, programTerms } = usePce()

  const ordered = useMemo(() => [...programTerms].sort((a, b) => a.startDate.localeCompare(b.startDate)), [programTerms])
  const today = useMemo(() => new Date().toISOString().slice(0, 10), [])
  const ce = useMemo(() => surveys.filter((s) => !s.surveyType || s.surveyType === 'course_evaluation'), [surveys])

  const upcomingTerm = useMemo(() => ordered.find((t) => classifyTermWindow(t, today) === 'upcoming') ?? null, [ordered, today])
  const currentTerm = useMemo(() => ordered.find((t) => classifyTermWindow(t, today) === 'current') ?? null, [ordered, today])
  const lastTerm = useMemo(() => {
    const candidates = ordered.filter((t) => classifyTermWindow(t, today) === 'last')
    return [...candidates].sort((a, b) => b.endDate.localeCompare(a.endDate))[0] ?? null
  }, [ordered, today])

  const upcomingB = upcomingTerm ? breakdownFor(upcomingTerm, ce) : null
  const currentB = currentTerm ? breakdownFor(currentTerm, ce) : null
  const lastB = lastTerm ? breakdownFor(lastTerm, ce) : null

  const startsIn = upcomingTerm?.startDate
    ? Math.max(0, Math.ceil((parseDate(upcomingTerm.startDate).getTime() - Date.now()) / 86_400_000))
    : null
  const upcomingUrgent = upcomingB && startsIn != null && startsIn <= 14 && coveragePercent(upcomingB) < 50 ? { startsInDays: startsIn } : null

  if (!upcomingB && !currentB && !lastB) {
    return <p className="rounded-lg border border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">This account has no term with course offerings in the last, current, or upcoming window right now.</p>
  }

  return (
    <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-3">
      {upcomingTerm && upcomingB && (
        <div className="flex flex-col gap-2">
          <p className="text-xs font-medium text-muted-foreground">{caseLabel(upcomingB, true)}</p>
          <TermCard term={upcomingTerm} position="upcoming" breakdown={upcomingB} hideLiveAndClosed setupUrgent={upcomingUrgent} />
        </div>
      )}
      {currentTerm && currentB && (
        <div className="flex flex-col gap-2">
          <p className="text-xs font-medium text-muted-foreground">{caseLabel(currentB, false)}</p>
          <TermCard term={currentTerm} position="current" breakdown={currentB} />
        </div>
      )}
      {lastTerm && lastB && (
        <div className="flex flex-col gap-2">
          <p className="text-xs font-medium text-muted-foreground">{caseLabel(lastB, false)}</p>
          <TermCard term={lastTerm} position="last" breakdown={lastB} />
        </div>
      )}
    </div>
  )
}
