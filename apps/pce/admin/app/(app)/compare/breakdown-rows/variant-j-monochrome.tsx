'use client'

// ============================================================================
// Breakdown row-list — VARIANT J: MONOCHROME + SINGLE ACCENT (compare route,
// throwaway). Round 3b, same day — deliberately the opposite bet from
// G/I's saturated color: near-everything renders in ink/gray, and color is
// spent on exactly one thing per card — the row that actually needs a
// decision. Every other row states its status in plain type, no tint, no
// disc. This is the "quiet confidence" alternative (Linear/Height-style
// density) to sit next to the colorful directions — not a fifth shade of
// the same aesthetic, the opposite end of the color-usage axis.
//
// Not a return to the rejected "editorial" direction: rows stay short,
// scannable data lines (title + chips + action on one visual unit), never
// a composed prose sentence — the restraint is in the PALETTE, not the
// copy register.
//
// Colors: `var(--foreground)` / `var(--muted-foreground)` / `var(--border)`
// for everything neutral, and exactly one DS StatusTint (whichever row is
// urgent) for the one accent. No invented literal, no color-mix — grepped
// clean before this was called done.
// ============================================================================

import { useMemo } from 'react'
import Link from 'next/link'
import {
  Badge, Button,
  Card, CardContent, CardFooter, CardHeader, CardTitle,
  StatusBadge,
  HoverCard, HoverCardTrigger, HoverCardContent,
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem,
} from '@exxatdesignux/ui'
import type { StatusBadgeTone } from '@exxatdesignux/ui'
import { usePce } from '@/components/pce/pce-state'
import { RowAction } from '@/components/pce/term-breakdown'
import {
  LIST_HUB_STATUS_TINT_WARNING,
  type StatusTint,
} from '@/lib/list-status-badges'
import {
  classifyTermWindow, breakdownFor, evalWindow, parseDate,
  weightedRate, RESPONSE_TARGET,
  coveragePercent, isFullyCovered, coverageLead, coverageCodes, coverageUrgentConsequence,
  scheduledLead, scheduledCountdown,
  liveLead, liveCountdown, liveAtRiskCodes, liveUrgentConsequence,
  courseRates,
  type CourseBreakdown, type TermWindowPosition,
} from '@/lib/pce-term-metrics'
import type { ProgramTerm, PceSurvey } from '@/lib/pce-mock-data'

/* ── hero: type only, no surface, no fill ────────────────────────────────── */

function HeroFigure({ label, value, caption, bar }: { label: string; value: string; caption: string; bar?: number | null }) {
  return (
    <div className="mx-5 mb-1 mt-4 flex flex-col gap-1.5 border-b border-border pb-4">
      <p className="text-[12px] font-medium text-muted-foreground">{label}</p>
      <p className="text-[32px] font-bold leading-none tracking-tight text-foreground tabular-nums">{value}</p>
      {bar != null && (
        <div className="mt-1 h-1 overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-foreground" style={{ width: `${bar}%` }} />
        </div>
      )}
      <p className="mt-1 text-xs text-muted-foreground">{caption}</p>
    </div>
  )
}

/* ── row: plain icon, color only when urgent ─────────────────────────────── */

function RowActionMenu({ items }: { items: { href: string; label: string; icon: string }[] }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label="More actions" className="size-6 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover/row:opacity-100 focus-visible:opacity-100">
          <i className="fa-light fa-ellipsis text-xs" aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {items.map((item) => (
          <DropdownMenuItem key={item.href} asChild>
            <Link href={item.href}><i className={`fa-light ${item.icon}`} aria-hidden="true" />{item.label}</Link>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
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
        <span
          key={code}
          className="rounded border border-border px-1.5 py-0 text-[11px] font-medium tabular-nums text-muted-foreground"
          style={atRisk?.has(code) ? { color: LIST_HUB_STATUS_TINT_WARNING.fg, borderColor: LIST_HUB_STATUS_TINT_WARNING.border, fontWeight: 700 } : undefined}
        >
          {label(code)}
        </span>
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

function RowCountdown({ label, urgent = false }: { label: string; urgent?: boolean }) {
  return (
    <span className="inline-flex shrink-0 items-center gap-1 text-[11px] font-semibold tabular-nums" style={{ color: urgent ? LIST_HUB_STATUS_TINT_WARNING.fg : 'var(--muted-foreground)' }}>
      <i className="fa-light fa-clock" aria-hidden="true" style={{ fontSize: 10 }} />{label}
    </span>
  )
}

function Row({
  icon, title, sub, meta, story, actions, menu, urgent = false,
}: {
  icon: string
  title: string
  sub?: string
  meta?: React.ReactNode
  story?: string
  actions?: React.ReactNode
  menu?: { href: string; label: string; icon: string }[]
  urgent?: boolean
}) {
  return (
    <div
      className={'group/row flex items-start gap-3 border-t border-border py-3 first:border-t-0' + (urgent ? ' -mx-2 rounded-md border-t-0 border-l-2 px-2' : '')}
      style={urgent ? { borderLeftColor: LIST_HUB_STATUS_TINT_WARNING.fg, background: LIST_HUB_STATUS_TINT_WARNING.bg } : undefined}
    >
      <i
        className={`fa-light ${icon} mt-1 shrink-0`}
        style={{ fontSize: 14, color: urgent ? LIST_HUB_STATUS_TINT_WARNING.fg : 'var(--muted-foreground)' }}
        aria-hidden="true"
      />
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <div className="flex min-w-0 items-baseline justify-between gap-3">
          <p className="text-sm font-semibold text-foreground">{title}</p>
          <div className="ms-auto flex shrink-0 items-center gap-1">{actions}{menu && <RowActionMenu items={menu} />}</div>
        </div>
        {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
        {meta}
        {story && (
          <p className="text-xs font-medium" style={{ color: urgent ? LIST_HUB_STATUS_TINT_WARNING.fg : 'var(--muted-foreground)' }}>{story}</p>
        )}
      </div>
    </div>
  )
}

function Footer({ status, tally }: { status: { label: string; tone: 'warn' | 'done' }; tally: string }) {
  const color = status.tone === 'warn' ? LIST_HUB_STATUS_TINT_WARNING.fg : 'var(--foreground)'
  return (
    <CardFooter className="mt-auto flex items-center justify-between gap-3 border-t border-border pt-3.5">
      <span className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold" style={{ color }}>
        <span className="size-[7px] rounded-full" style={{ background: color }} />{status.label}
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
  const covLead = coverageLead(b.notConfiguredCount, b.draft.length)
  const schedLead = scheduledLead(b.scheduled)
  const schedCountdown = scheduledCountdown(b.scheduled)
  const scheduledCodes = b.scheduled.map((s: PceSurvey) => s.courseCode)
  const liveLeadText = liveLead(b.live)
  const liveCountdownText = liveCountdown(b.live)
  const liveCodes = b.live.map((s: PceSurvey) => s.courseCode)
  const liveAtRisk = liveAtRiskCodes(b.live)
  const isLiveUrgent = liveAtRisk.size > 0
  const closedCodes = b.closed.map((s: PceSurvey) => s.courseCode)
  const isSetupUrgent = !!setupUrgent && !fullyCovered && setupTotal > 0

  const showSetup = !fullyCovered && !!covLead
  const showScheduled = b.scheduled.length > 0 && !!schedLead
  const showLive = !hideLiveAndClosed && b.live.length > 0 && !!liveLeadText
  const showClosed = !hideLiveAndClosed && b.closed.length > 0
  const allClosed = showClosed && b.closed.length === b.totalCourses

  const liveRate = showLive ? weightedRate(b.live) : null
  const hero = liveRate != null
    ? { label: 'Response rate', value: `${liveRate}%`, bar: liveRate, caption: `Across ${b.live.length} course${b.live.length === 1 ? '' : 's'} still collecting · target ${RESPONSE_TARGET}%` }
    : allClosed
      ? { label: 'Final response rate', value: `${weightedRate(b.closed) ?? coveragePct}%`, bar: null, caption: 'Every course collected before the window closed' }
      : { label: 'Evaluation coverage', value: `${coveragePct}%`, bar: null, caption: `${b.scheduled.length + b.live.length + b.closed.length} of ${b.totalCourses} courses have an evaluation set up` }

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
          <CardTitle className="min-w-0 truncate text-base font-semibold">
            <Link href={`/course-evaluation/term/${term.id}`} className="rounded-sm text-foreground hover:underline underline-offset-2 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50">{term.name}</Link>
          </CardTitle>
          <StatusBadge label={POSITION_BADGE[position].label} tone={POSITION_BADGE[position].tone} />
        </div>
        <p className="mt-0.5 text-xs text-muted-foreground">
          AY {term.academicYear.replace(/–20(\d\d)$/, '–$1')}
          {dated ? ` · Eval window ${win.open.replace(/, \d{4}$/, '')} – ${win.close}` : ' · Eval window not set'}
        </p>
      </CardHeader>

      <HeroFigure label={hero.label} value={hero.value} caption={hero.caption} bar={hero.bar} />

      <CardContent className="flex flex-col pt-1">
        {showSetup && (
          <Row
            icon="fa-clipboard-list"
            title={covLead!}
            meta={<CourseChips codes={setupCodes} />}
            story={isSetupUrgent ? coverageUrgentConsequence(setupUrgent!.startsInDays, coveragePct) : undefined}
            urgent={isSetupUrgent}
            actions={<RowAction href={`/surveys/push?term=${term.id}`} primary icon="fa-plus">{setupTotal === 1 ? 'Set up evaluation' : 'Set up evaluations'}</RowAction>}
          />
        )}
        {showScheduled && (
          <Row
            icon="fa-calendar"
            title={schedLead!}
            meta={<div className="flex flex-wrap items-center gap-2"><CourseChips codes={scheduledCodes} />{schedCountdown && <RowCountdown label={schedCountdown} />}</div>}
            actions={<RowAction href={workspaceHref('active')} primary icon="fa-pen-ruler">Manage</RowAction>}
          />
        )}
        {showLive && (
          <Row
            icon="fa-tower-broadcast"
            title={liveLeadText!}
            meta={<div className="flex flex-wrap items-center gap-2"><CourseChips codes={liveCodes} rates={courseRates(b.live)} atRisk={liveAtRisk} />{liveCountdownText && <RowCountdown label={liveCountdownText} urgent={isLiveUrgent} />}</div>}
            story={isLiveUrgent ? liveUrgentConsequence(b.live) ?? undefined : undefined}
            urgent={isLiveUrgent}
            actions={<RowAction href={`/surveys/remind?from=term:${term.id}`} primary icon="fa-bell">Remind</RowAction>}
            menu={[{ href: workspaceHref('active'), label: 'Extend', icon: 'fa-calendar-pen' }]}
          />
        )}
        {showClosed && (
          <Row
            icon="fa-circle-check"
            title={allClosed ? 'All evaluations closed' : `${b.closed.length} of ${b.totalCourses} closed`}
            sub={allClosed ? `${b.totalCourses} of ${b.totalCourses} courses finished collecting — average response ${weightedRate(b.closed) ?? '—'}%.` : undefined}
            meta={<CourseChips codes={closedCodes} rates={courseRates(b.closed)} />}
            actions={<RowAction href={workspaceHref('finished')} primary icon="fa-share-from-square">Review feedback</RowAction>}
          />
        )}
      </CardContent>

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

export default function VariantMonochrome() {
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
