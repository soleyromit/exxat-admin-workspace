'use client'

// ============================================================================
// Breakdown row-list — VARIANT H: ILLUSTRATED MOMENTS (compare route,
// throwaway). Round 3, same day — literal translation of the approved Claude
// Design canvas's "Direction D" artboard into DS components + real data.
//
// Keeps F's stacked-row family (this is not a layout change) but pushes two
// things the canvas mockup used to make the row list feel less clinical:
//   - Row icons become 48-52px two-tone rounded-square tiles (a light tint
//     of the state color behind a solid-tint icon) instead of 34px filled
//     discs — big enough to read as a small illustration, not a bullet.
//   - The hero number sits over a faint dot-field texture (radial-gradient
//     dots, DS brand/status hue at low opacity) instead of a flat tint, for
//     atmosphere without a decorative image asset — the DS ships no
//     illustration component (checked: `EmptyState` is not exported), so
//     this is built from CSS + the DS's own hue tokens, nothing invented.
//   - The fully-closed state gets one small "spark" accent pair beside its
//     icon tile — two tiny dots in the same completed-tint color — the one
//     deliberately celebratory touch, reserved for a term that has nothing
//     left to act on.
// Everything else is unchanged from F: ghost-Button RowAction + overflow
// menu, CourseChips, sentence case, amber-only warnings, no per-row chart,
// outcome-first copy at 100% ("All evaluations closed", not "13 of 13").
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
  LIST_HUB_STATUS_TINT_SUCCESS,
  LIST_HUB_STATUS_TINT_WARNING,
  LIST_HUB_STATUS_TINT_PLANNED,
  LIST_HUB_STATUS_TINT_COMPLETED,
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

/* ── hero: dotted atmosphere instead of a flat tint ──────────────────────── */

function HeroSurface({
  label, value, caption, tone,
}: {
  label: string
  value: string
  caption: string
  tone: 'brand' | 'done'
}) {
  const dotColor = tone === 'done' ? LIST_HUB_STATUS_TINT_COMPLETED.fg : 'var(--brand-color)'
  return (
    <div
      className="relative mx-5 mb-1 mt-4 overflow-hidden rounded-xl px-4 py-4"
      style={{ background: tone === 'done' ? LIST_HUB_STATUS_TINT_COMPLETED.bg : 'var(--brand-tint)' }}
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-50"
        style={{ backgroundImage: `radial-gradient(${dotColor} 1.4px, transparent 1.4px)`, backgroundSize: '14px 14px' }}
      />
      <p className="relative text-[12.5px] font-semibold text-foreground/70">{label}</p>
      <p className="relative text-[32px] font-bold leading-none tracking-tight text-foreground tabular-nums">{value}</p>
      <p className="relative mt-1.5 text-[12.5px] text-foreground/65">{caption}</p>
    </div>
  )
}

/* ── row: big two-tone illustrated icon tile ─────────────────────────────── */

function IconTile({ icon, tint, size = 48, sparkle = false }: { icon: string; tint: StatusTint; size?: number; sparkle?: boolean }) {
  return (
    <span className="relative shrink-0" style={{ width: size, height: size }}>
      <span
        className="flex items-center justify-center rounded-2xl"
        style={{ width: size, height: size, background: tint.bg, color: tint.fg }}
      >
        <i className={`fa-solid ${icon}`} style={{ fontSize: size * 0.5 }} aria-hidden="true" />
      </span>
      {sparkle && (
        <>
          <span aria-hidden="true" className="absolute -right-0.5 -top-0.5 size-[5px] rounded-full" style={{ background: tint.fg }} />
          <span aria-hidden="true" className="absolute -bottom-0.5 left-0 size-[3px] rounded-full" style={{ background: tint.fg }} />
        </>
      )}
    </span>
  )
}

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
        <Badge key={code} variant="outline" className="rounded-full px-2.5 py-0 text-[11px] font-medium tabular-nums"
          style={atRisk?.has(code) ? { color: LIST_HUB_STATUS_TINT_WARNING.fg, background: LIST_HUB_STATUS_TINT_WARNING.bg, borderColor: LIST_HUB_STATUS_TINT_WARNING.border, fontWeight: 700 } : undefined}>
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

function RowCountdown({ label, urgent = false }: { label: string; urgent?: boolean }) {
  return (
    <span className="inline-flex shrink-0 items-center gap-1 text-[11px] font-semibold tabular-nums" style={{ color: urgent ? LIST_HUB_STATUS_TINT_WARNING.fg : 'var(--muted-foreground)' }}>
      <i className="fa-light fa-clock" aria-hidden="true" style={{ fontSize: 10 }} />{label}
    </span>
  )
}

function Row({
  icon, tint, title, sub, meta, story, actions, menu, urgent = false, size = 48, sparkle = false,
}: {
  icon: string
  tint: StatusTint
  title: string
  sub?: string
  meta?: React.ReactNode
  story?: string
  actions?: React.ReactNode
  menu?: { href: string; label: string; icon: string }[]
  urgent?: boolean
  size?: number
  sparkle?: boolean
}) {
  return (
    <div
      className={'group/row flex items-start gap-3.5' + (urgent ? ' -mx-1.5 rounded-lg px-1.5 py-3' : ' py-3')}
      style={urgent ? { background: LIST_HUB_STATUS_TINT_WARNING.bg } : undefined}
    >
      <IconTile icon={icon} tint={tint} size={size} sparkle={sparkle} />
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <div className="flex min-w-0 items-baseline justify-between gap-3">
          <p className="text-sm font-semibold text-foreground">{title}</p>
          <div className="ms-auto flex shrink-0 items-center gap-1">{actions}{menu && <RowActionMenu items={menu} />}</div>
        </div>
        {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
        {meta}
        {story && <p className="text-xs text-foreground/80">{story}</p>}
      </div>
    </div>
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
    ? { tone: 'brand' as const, label: 'Response rate', value: `${liveRate}%`, caption: `Across ${b.live.length} course${b.live.length === 1 ? '' : 's'} still collecting · target ${RESPONSE_TARGET}%` }
    : allClosed
      ? { tone: 'done' as const, label: 'Final response rate', value: `${weightedRate(b.closed) ?? coveragePct}%`, caption: 'Every course collected before the window closed' }
      : { tone: 'brand' as const, label: 'Evaluation coverage', value: `${coveragePct}%`, caption: `${b.scheduled.length + b.live.length + b.closed.length} of ${b.totalCourses} courses have an evaluation set up` }

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

      <HeroSurface label={hero.label} value={hero.value} caption={hero.caption} tone={hero.tone} />

      <CardContent className="flex flex-col pt-1">
        {showSetup && (
          <Row
            icon="fa-clipboard-list"
            tint={LIST_HUB_STATUS_TINT_WARNING}
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
            tint={LIST_HUB_STATUS_TINT_PLANNED}
            title={schedLead!}
            meta={<div className="flex flex-wrap items-center gap-2"><CourseChips codes={scheduledCodes} />{schedCountdown && <RowCountdown label={schedCountdown} />}</div>}
            actions={<RowAction href={workspaceHref('active')} primary icon="fa-pen-ruler">Manage</RowAction>}
          />
        )}
        {showLive && (
          <Row
            icon="fa-tower-broadcast"
            tint={LIST_HUB_STATUS_TINT_SUCCESS}
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
            icon="fa-award"
            tint={LIST_HUB_STATUS_TINT_COMPLETED}
            size={allClosed ? 52 : 48}
            sparkle={allClosed}
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

export default function VariantIllustrated() {
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
