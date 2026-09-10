'use client'

// ============================================================================
// Breakdown row-list — VARIANT I: PIPELINE NODES (compare route, throwaway).
//
// Round 3b, same day — Romit approved F/G/H's colors once they were rebuilt
// on real DS tokens (a first pass had invented oklch stops and used
// `color-mix(in oklch`; grepped clean and fixed) and asked for MORE visual
// directions. This is a genuinely different structural idea, not another
// palette pass on the row list: the term's four lifecycle buckets (Setup →
// Scheduled → Live → Closed) render as a connected chain of fixed-size
// nodes — a pipeline, not a list — so the card answers "where is this term
// right now" before it answers "what does each bucket contain."
//
// Deliberately NOT a proportional/segmented bar: node size is fixed
// regardless of count, only color and a small badge number vary. A width-
// proportional version would be the exact "thin segmented bar" pattern this
// workspace has banned for composition viz (feedback_no_basic_progress_bar_
// viz) — discrete counters avoid implying a part-of-whole reading the
// underlying data doesn't support (a term can have courses in every bucket
// at once; it is not "40% through" anything). The node that needs a
// decision gets emphasized (larger, a ring) and the ONLY prose on the card
// is the one detail panel under the pipeline for that node.
//
// Every color is a real DS StatusTint value (LIST_HUB_STATUS_TINT_*) or a
// var(--token) — grepped for oklch literals, hex and color-mix before this
// was called done, same discipline as the fixed F/G/H pass.
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
  LIST_HUB_STATUS_TINT_NEUTRAL,
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

/* ── the pipeline: fixed-size nodes, never proportional to count ────────── */

type NodeKind = 'setup' | 'scheduled' | 'live' | 'closed'

const NODE: Record<NodeKind, { icon: string; label: string }> = {
  setup:     { icon: 'fa-clipboard-list',  label: 'Setup' },
  scheduled: { icon: 'fa-calendar',        label: 'Scheduled' },
  live:      { icon: 'fa-tower-broadcast', label: 'Live' },
  closed:    { icon: 'fa-circle-check',    label: 'Closed' },
}

function Node({
  kind, count, tint, active, empty,
}: {
  kind: NodeKind
  count: number
  tint: StatusTint
  active: boolean
  empty: boolean
}) {
  const n = NODE[kind]
  const size = active ? 46 : 38
  return (
    <div className="flex flex-1 flex-col items-center gap-1.5">
      <span
        className="relative flex shrink-0 items-center justify-center rounded-full transition-all"
        style={{
          width: size,
          height: size,
          background: empty ? LIST_HUB_STATUS_TINT_NEUTRAL.bg : tint.bg,
          color: empty ? 'var(--muted-foreground)' : tint.fg,
          boxShadow: active ? `0 0 0 3px ${tint.bg}, 0 0 0 4.5px ${tint.border}` : undefined,
        }}
      >
        <i className={`fa-solid ${n.icon}`} style={{ fontSize: active ? 17 : 14 }} aria-hidden="true" />
        {count > 0 && (
          <span
            className="absolute -right-1 -top-1 flex h-[17px] min-w-[17px] items-center justify-center rounded-full px-1 text-[10px] font-bold tabular-nums"
            style={{ background: tint.fg, color: 'var(--primary-foreground)' }}
          >
            {count}
          </span>
        )}
      </span>
      <span className="text-[10.5px] font-medium" style={{ color: empty ? 'var(--muted-foreground)' : 'var(--foreground)' }}>
        {n.label}
      </span>
    </div>
  )
}

function Connector({ tint }: { tint: StatusTint | null }) {
  return (
    <div className="flex h-[38px] flex-1 items-center px-1">
      <div className="h-px w-full" style={{ background: tint ? tint.border : 'var(--border)' }} />
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
          className="rounded-full px-2.5 py-0 text-[11px] font-medium tabular-nums"
          style={atRisk?.has(code) ? { color: LIST_HUB_STATUS_TINT_WARNING.fg, background: LIST_HUB_STATUS_TINT_WARNING.bg, borderColor: LIST_HUB_STATUS_TINT_WARNING.border, fontWeight: 700 } : undefined}
        >
          {label(code)}
        </Badge>
      ))}
      {hidden.length > 0 && (
        <HoverCard openDelay={100}>
          <HoverCardTrigger asChild>
            <Badge variant="outline" tabIndex={0} className="cursor-default rounded-full border-dashed px-2.5 py-0 text-[11px] font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" style={{ color: 'var(--primary)' }}>
              +{hidden.length} more
            </Badge>
          </HoverCardTrigger>
          <HoverCardContent align="start" className="w-auto max-w-64 p-2">
            <div className="flex flex-wrap gap-1">
              {hidden.map((code) => <Badge key={code} variant="outline" className="rounded-full px-2 py-0 text-[11px] font-medium">{label(code)}</Badge>)}
            </div>
          </HoverCardContent>
        </HoverCard>
      )}
    </div>
  )
}

function DetailPanel({
  title, chips, story, action, tint,
}: {
  title: string
  chips: React.ReactNode
  story: string
  action: React.ReactNode
  tint: StatusTint
}) {
  return (
    <Card
      className="mx-5 mb-2 gap-2 rounded-lg border p-3 ring-0"
      style={{ background: tint.bg, borderColor: tint.border }}
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
  const tint = status.tone === 'warn' ? LIST_HUB_STATUS_TINT_WARNING : LIST_HUB_STATUS_TINT_COMPLETED
  return (
    <CardFooter className="mt-auto flex items-center justify-between gap-3 border-t border-border pt-3.5">
      <span className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold" style={{ color: tint.fg }}>
        <span className="size-[7px] rounded-full" style={{ background: tint.fg }} />{status.label}
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

  const showLive = !hideLiveAndClosed && b.live.length > 0
  const showClosed = !hideLiveAndClosed && b.closed.length > 0
  const allClosed = showClosed && b.closed.length === b.totalCourses

  const counts: Record<NodeKind, number> = {
    setup: setupTotal,
    scheduled: b.scheduled.length,
    live: showLive ? b.live.length : 0,
    closed: showClosed ? b.closed.length : 0,
  }
  const tints: Record<NodeKind, StatusTint> = {
    setup: LIST_HUB_STATUS_TINT_WARNING,
    scheduled: LIST_HUB_STATUS_TINT_PLANNED,
    live: LIST_HUB_STATUS_TINT_SUCCESS,
    closed: LIST_HUB_STATUS_TINT_COMPLETED,
  }
  const activeKind: NodeKind = isLiveUrgent ? 'live' : isSetupUrgent ? 'setup' : allClosed ? 'closed' : counts.live > 0 ? 'live' : counts.setup > 0 ? 'setup' : counts.scheduled > 0 ? 'scheduled' : 'closed'

  const detail = isLiveUrgent
    ? {
        title: `${liveAtRisk.size} of ${b.live.length} live courses are behind target`,
        chips: <CourseChips codes={liveCodes} rates={courseRates(b.live)} atRisk={liveAtRisk} />,
        story: liveUrgentConsequence(b.live) ?? 'Worth a reminder before it closes.',
        action: <RowAction href={`/surveys/remind?from=term:${term.id}`} primary icon="fa-bell">Remind</RowAction>,
        tint: LIST_HUB_STATUS_TINT_WARNING,
      }
    : isSetupUrgent
      ? {
          title: `${setupTotal} course${setupTotal === 1 ? '' : 's'} still need${setupTotal === 1 ? 's' : ''} setup`,
          chips: <CourseChips codes={setupCodes} />,
          story: coverageUrgentConsequence(setupUrgent!.startsInDays, coveragePct),
          action: <RowAction href={`/surveys/push?term=${term.id}`} primary icon="fa-plus">Set up evaluations</RowAction>,
          tint: LIST_HUB_STATUS_TINT_WARNING,
        }
      : allClosed
        ? {
            title: 'All evaluations closed',
            chips: <CourseChips codes={closedCodes} rates={courseRates(b.closed)} />,
            story: `Average response ${weightedRate(b.closed) ?? '—'}% across all ${b.totalCourses} courses.`,
            action: <RowAction href={workspaceHref('finished')} primary icon="fa-share-from-square">Review feedback</RowAction>,
            tint: LIST_HUB_STATUS_TINT_COMPLETED,
          }
        : setupTotal > 0
          ? {
              title: `${setupTotal} course${setupTotal === 1 ? '' : 's'} still need${setupTotal === 1 ? 's' : ''} setup`,
              chips: <CourseChips codes={setupCodes} />,
              story: 'Nothing collects until these evaluations are scheduled.',
              action: <RowAction href={`/surveys/push?term=${term.id}`} primary icon="fa-plus">Set up evaluations</RowAction>,
              tint: LIST_HUB_STATUS_TINT_WARNING,
            }
          : b.scheduled.length > 0
            ? {
                title: `${b.scheduled.length} course${b.scheduled.length === 1 ? '' : 's'} scheduled`,
                chips: <CourseChips codes={scheduledCodes} />,
                story: 'These will open automatically on their evaluation date.',
                action: <RowAction href={workspaceHref('active')} primary icon="fa-pen-ruler">Manage</RowAction>,
                tint: LIST_HUB_STATUS_TINT_PLANNED,
              }
            : showLive
              ? {
                  title: `${b.live.length} course${b.live.length === 1 ? '' : 's'} live`,
                  chips: <CourseChips codes={liveCodes} rates={courseRates(b.live)} />,
                  story: `Averaging ${weightedRate(b.live) ?? '—'}% so far.`,
                  action: <RowAction href={`/surveys/remind?from=term:${term.id}`} primary icon="fa-bell">Remind</RowAction>,
                  tint: LIST_HUB_STATUS_TINT_SUCCESS,
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

  const order: NodeKind[] = ['setup', 'scheduled', 'live', 'closed']

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

      <CardContent className="flex flex-col gap-4">
        <p className="text-[11.5px] font-semibold text-muted-foreground">Evaluation pipeline</p>
        <div className="flex items-start px-1">
          {order.map((kind, i) => (
            <div key={kind} className="flex flex-1 items-start">
              <Node kind={kind} count={counts[kind]} tint={tints[kind]} active={kind === activeKind} empty={counts[kind] === 0} />
              {i < order.length - 1 && <Connector tint={counts[kind] > 0 ? tints[kind] : null} />}
            </div>
          ))}
        </div>
      </CardContent>

      {detail && <DetailPanel title={detail.title} chips={detail.chips} story={detail.story} action={detail.action} tint={detail.tint} />}

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

export default function VariantPipeline() {
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
