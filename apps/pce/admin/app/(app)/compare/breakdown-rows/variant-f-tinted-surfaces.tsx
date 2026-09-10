'use client'

// ============================================================================
// Breakdown row-list — VARIANT F: TINTED SURFACES (compare route, throwaway).
//
// Round 3, same day. Romit rejected A–E as "flat, no craft, timid color" and
// asked to see real visual references (Vapi, Basecamp, Trello) applied. Those
// were drafted first as a hi-fi Claude Design canvas mockup (exact colors,
// spacing, gradients authored as real CSS) and approved as one of three
// directions to carry into the app. This file is a literal, pixel-faithful
// translation of that canvas's "Direction A" artboard into DS components +
// real data — not a new design pass. Where the canvas used a raw color value,
// this file uses the DS token that produced it (LIST_HUB_STATUS_TINT_*,
// --brand-color/--brand-tint) so nothing here is invented.
//
// What changed from A–E, all sourced from the approved mockup:
//   - The hero metric sits on an actual tinted gradient surface with a soft
//     color glow, not a bare number on white (Vapi's stat-tile language).
//   - The Setup group gets a full warm-tinted section background, not a
//     hairline-and-icon treatment.
//   - Row icons are solid-filled 34px discs (state fg as the fill), not
//     17-24px outline afterthoughts.
//   - The overflow ("...") trigger is invisible until the row is hovered
//     (Trello's pattern) instead of sitting visible at rest.
//   - The footer leads with a verdict ("Needs attention" / "Term complete")
//     before the raw tally, and the 100%-closed case states the OUTCOME
//     ("All evaluations closed") instead of repeating "13 of 13" as a
//     fraction that has already resolved.
// Unchanged (still governs): ghost-Button RowAction + overflow menu (never a
// filled button on a row — that rule was never about hero-surface color),
// CourseChips naming courses, sentence case, amber-only for warnings, no
// per-row chart or bar — the hero bar is the one exception, and only for
// response rate, a genuine in-flight metric.
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

/* ── hero: a real tinted surface, not a bare number ─────────────────────── */

function HeroSurface({
  label, value, caption, bar, tone,
}: {
  label: string
  value: string
  caption: string
  bar?: number | null
  /** 'brand' while anything is still in flight, 'done' once the term has
   *  nothing left to act on — two surfaces, not five, so the color itself
   *  tells you which situation this card is in before you read a word. */
  tone: 'brand' | 'done'
}) {
  const isDone = tone === 'done'
  return (
    <div
      className="relative mx-5 mb-1 mt-4 overflow-hidden rounded-xl px-4 py-4"
      style={{
        background: isDone
          ? `linear-gradient(135deg, ${LIST_HUB_STATUS_TINT_COMPLETED.bg}, var(--card))`
          : 'linear-gradient(135deg, var(--brand-tint), var(--card))',
      }}
    >
      <div
        aria-hidden="true"
        className="absolute -right-10 -top-16 h-40 w-40 rounded-full opacity-35 blur-[2px]"
        style={{ background: `radial-gradient(circle, ${isDone ? LIST_HUB_STATUS_TINT_COMPLETED.fg : 'var(--brand-color)'}, transparent 70%)` }}
      />
      <p className="relative text-[12.5px] font-semibold text-foreground/70">{label}</p>
      <p className="relative text-[34px] font-bold leading-none tracking-tight text-foreground tabular-nums">{value}</p>
      {bar != null && (
        <div className="relative mt-2 h-1.5 overflow-hidden rounded-full bg-background/55">
          <div className="h-full rounded-full" style={{ width: `${bar}%`, background: 'var(--brand-color)' }} />
        </div>
      )}
      <p className="relative mt-2 text-[12.5px] text-foreground/65">{caption}</p>
    </div>
  )
}

/* ── row: solid-filled state disc + hover-reveal overflow ───────────────── */

function StateMark({ icon, tint }: { icon: string; tint: StatusTint }) {
  return (
    <span
      aria-hidden="true"
      className="mt-0.5 flex size-[34px] shrink-0 items-center justify-center rounded-full"
      style={{ background: tint.fg, color: 'var(--primary-foreground)' }}
    >
      <i className={`fa-solid ${icon}`} style={{ fontSize: 15 }} />
    </span>
  )
}

function RowActionMenu({ items }: { items: { href: string; label: string; icon: string }[] }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="More actions"
          className="size-6 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover/row:opacity-100 focus-visible:opacity-100"
        >
          <i className="fa-light fa-ellipsis text-xs" aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {items.map((item) => (
          <DropdownMenuItem key={item.href} asChild>
            <Link href={item.href}>
              <i className={`fa-light ${item.icon}`} aria-hidden="true" />
              {item.label}
            </Link>
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
        <Badge
          key={code}
          variant="outline"
          className="rounded-full px-2.5 py-0 text-[11px] font-medium tabular-nums"
          style={
            atRisk?.has(code)
              ? { color: LIST_HUB_STATUS_TINT_WARNING.fg, background: LIST_HUB_STATUS_TINT_WARNING.bg, borderColor: LIST_HUB_STATUS_TINT_WARNING.border, fontWeight: 700 }
              : undefined
          }
        >
          {label(code)}
        </Badge>
      ))}
      {hidden.length > 0 && (
        <HoverCard openDelay={100}>
          <HoverCardTrigger asChild>
            <Badge
              variant="outline"
              tabIndex={0}
              className="cursor-default rounded-full border-dashed px-2.5 py-0 text-[11px] font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              style={{ color: 'var(--primary)' }}
            >
              +{hidden.length} more
            </Badge>
          </HoverCardTrigger>
          <HoverCardContent align="start" className="w-auto max-w-64 p-2">
            <div className="flex flex-wrap gap-1">
              {hidden.map((code) => (
                <Badge key={code} variant="outline" className="rounded-full px-2 py-0 text-[11px] font-medium">
                  {label(code)}
                </Badge>
              ))}
            </div>
          </HoverCardContent>
        </HoverCard>
      )}
    </div>
  )
}

function RowCountdown({ label, urgent = false }: { label: string; urgent?: boolean }) {
  return (
    <span
      className="inline-flex shrink-0 items-center gap-1 text-[11px] font-semibold tabular-nums"
      style={{ color: urgent ? LIST_HUB_STATUS_TINT_WARNING.fg : 'var(--muted-foreground)' }}
    >
      <i className="fa-light fa-clock" aria-hidden="true" style={{ fontSize: 10 }} />
      {label}
    </span>
  )
}

function Row({
  icon, tint, title, sub, meta, srSummary, story, actions, menu, urgent = false,
}: {
  icon: string
  tint: StatusTint
  title: string
  sub?: string
  meta?: React.ReactNode
  srSummary?: string
  story?: string
  actions?: React.ReactNode
  menu?: { href: string; label: string; icon: string }[]
  urgent?: boolean
}) {
  return (
    <div
      className={
        'group/row flex items-start gap-3' +
        (urgent ? ' -mx-1.5 rounded-lg px-1.5 py-2.5' : ' py-2.5')
      }
      style={urgent ? { background: LIST_HUB_STATUS_TINT_WARNING.bg } : undefined}
    >
      <StateMark icon={icon} tint={tint} />
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <div className="flex min-w-0 items-baseline justify-between gap-3">
          <p className="text-sm font-semibold text-foreground">{title}</p>
          <div className="ms-auto flex shrink-0 items-center gap-1">
            {actions}
            {menu && <RowActionMenu items={menu} />}
          </div>
        </div>
        {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
        {meta}
        {srSummary && <span className="sr-only">{srSummary}</span>}
        {story && <p className="text-xs text-foreground/80">{story}</p>}
      </div>
    </div>
  )
}

/* ── groups: full tinted section for Setup, plain for Collecting ────────── */

function GroupHeading({ label, count }: { label: string; count: number }) {
  return (
    <div className="flex items-center gap-2">
      <p className="text-[13px] font-semibold text-foreground">{label}</p>
      <span className="rounded-full border border-border bg-card/70 px-2 py-px text-[11px] font-semibold text-muted-foreground">{count}</span>
    </div>
  )
}

/* ── footer: a verdict, not a bare tally ─────────────────────────────────── */

function Footer({ status, tally }: { status: { label: string; tone: 'warn' | 'done' }; tally: string }) {
  const tint = status.tone === 'warn' ? LIST_HUB_STATUS_TINT_WARNING : LIST_HUB_STATUS_TINT_COMPLETED
  return (
    <CardFooter className="mt-auto flex items-center justify-between gap-3 border-t border-border pt-3.5">
      <span className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold" style={{ color: tint.fg }}>
        <span className="size-[7px] rounded-full" style={{ background: tint.fg }} />
        {status.label}
      </span>
      <span className="text-xs tabular-nums text-muted-foreground">{tally}</span>
    </CardFooter>
  )
}

/* ── card ─────────────────────────────────────────────────────────────── */

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
  const setupGroupCount = Number(showSetup) + Number(showScheduled)
  const collectionGroupCount = Number(showLive) + Number(showClosed)

  const liveRate = showLive ? weightedRate(b.live) : null
  const isTermDone = fullyCovered && !showLive && showClosed && !isLiveUrgent

  const hero = liveRate != null
    ? {
        tone: 'brand' as const,
        label: 'Response rate',
        value: `${liveRate}%`,
        bar: liveRate,
        caption: `Across ${b.live.length} course${b.live.length === 1 ? '' : 's'} still collecting · target ${RESPONSE_TARGET}%`,
      }
    : isTermDone
      ? {
          tone: 'done' as const,
          label: 'Final response rate',
          value: `${weightedRate(b.closed) ?? coveragePct}%`,
          bar: null,
          caption: 'Every course collected before the window closed',
        }
      : {
          tone: 'brand' as const,
          label: 'Evaluation coverage',
          value: `${coveragePct}%`,
          bar: null,
          caption: `${b.scheduled.length + b.live.length + b.closed.length} of ${b.totalCourses} courses have an evaluation set up`,
        }

  const footerStatus = isLiveUrgent || isSetupUrgent
    ? { label: 'Needs attention', tone: 'warn' as const }
    : isTermDone
      ? { label: 'Term complete', tone: 'done' as const }
      : { label: 'On track', tone: 'done' as const }

  const tallyParts: string[] = []
  if (setupTotal > 0) tallyParts.push(`${setupTotal} need setup`)
  if (b.scheduled.length > 0) tallyParts.push(`${b.scheduled.length} scheduled`)
  if (b.live.length > 0) tallyParts.push(`${b.live.length} live`)
  if (b.closed.length > 0) tallyParts.push(`${b.closed.length} closed`)
  tallyParts.push(`${b.totalCourses} total`)

  return (
    <Card className="flex flex-col overflow-visible">
      <CardHeader>
        <div className="flex min-w-0 items-center justify-between gap-2">
          <CardTitle className="min-w-0 truncate text-base font-semibold">
            <Link href={`/course-evaluation/term/${term.id}`} className="rounded-sm text-foreground hover:underline underline-offset-2 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
              {term.name}
            </Link>
          </CardTitle>
          <StatusBadge label={POSITION_BADGE[position].label} tone={POSITION_BADGE[position].tone} />
        </div>
        <p className="mt-0.5 text-xs text-muted-foreground">
          AY {term.academicYear.replace(/–20(\d\d)$/, '–$1')}
          {dated ? ` · Eval window ${win.open.replace(/, \d{4}$/, '')} – ${win.close}` : ' · Eval window not set'}
        </p>
      </CardHeader>

      <HeroSurface label={hero.label} value={hero.value} caption={hero.caption} bar={hero.bar} tone={hero.tone} />

      <CardContent className="flex flex-col gap-1">
        {setupGroupCount > 0 && (
          <div className="rounded-lg" style={{ background: `linear-gradient(180deg, ${LIST_HUB_STATUS_TINT_WARNING.bg}, transparent 70%)` }}>
            <div className="flex flex-col gap-2 px-3 py-3">
              <GroupHeading label="Setup" count={setupGroupCount} />
              <div className="flex flex-col">
                {showSetup && (
                  <Row
                    icon="fa-clipboard-list"
                    tint={LIST_HUB_STATUS_TINT_WARNING}
                    title={setupTotal === 1 ? '1 course still needs an evaluation' : `${setupTotal} courses still need an evaluation`}
                    meta={<CourseChips codes={setupCodes} />}
                    story={isSetupUrgent ? coverageUrgentConsequence(setupUrgent!.startsInDays, coveragePct) : undefined}
                    urgent={isSetupUrgent}
                    actions={
                      <RowAction href={`/surveys/push?term=${term.id}`} primary icon="fa-plus">
                        {setupTotal === 1 ? 'Set up evaluation' : 'Set up evaluations'}
                      </RowAction>
                    }
                  />
                )}
                {showScheduled && (
                  <Row
                    icon="fa-calendar"
                    tint={LIST_HUB_STATUS_TINT_PLANNED}
                    title={schedLead!}
                    meta={
                      <div className="flex flex-wrap items-center gap-2">
                        <CourseChips codes={scheduledCodes} />
                        {schedCountdown && <RowCountdown label={schedCountdown} />}
                      </div>
                    }
                    actions={<RowAction href={workspaceHref('active')} primary icon="fa-pen-ruler">Manage</RowAction>}
                  />
                )}
              </div>
            </div>
          </div>
        )}

        {collectionGroupCount > 0 && (
          <div className="flex flex-col gap-2 px-3 py-3">
            <GroupHeading label="Collecting responses" count={collectionGroupCount} />
            <div className="flex flex-col">
              {showLive && (
                <Row
                  icon="fa-tower-broadcast"
                  tint={LIST_HUB_STATUS_TINT_SUCCESS}
                  title={liveLeadText!}
                  meta={
                    <div className="flex flex-wrap items-center gap-2">
                      <CourseChips codes={liveCodes} rates={courseRates(b.live)} atRisk={liveAtRisk} />
                      {liveCountdownText && <RowCountdown label={liveCountdownText} urgent={isLiveUrgent} />}
                    </div>
                  }
                  story={isLiveUrgent ? liveUrgentConsequence(b.live) ?? undefined : undefined}
                  urgent={isLiveUrgent}
                  actions={<RowAction href={`/surveys/remind?from=term:${term.id}`} primary icon="fa-bell">Remind</RowAction>}
                  menu={[{ href: workspaceHref('active'), label: 'Extend', icon: 'fa-calendar-pen' }]}
                />
              )}
              {showClosed && (
                <Row
                  icon="fa-circle-check"
                  tint={LIST_HUB_STATUS_TINT_COMPLETED}
                  title={b.closed.length === b.totalCourses ? 'All evaluations closed' : `${b.closed.length} of ${b.totalCourses} closed`}
                  sub={b.closed.length === b.totalCourses
                    ? `${b.totalCourses} of ${b.totalCourses} courses finished collecting — average response ${weightedRate(b.closed) ?? '—'}%.`
                    : undefined}
                  meta={<CourseChips codes={closedCodes} rates={courseRates(b.closed)} />}
                  actions={<RowAction href={workspaceHref('finished')} primary icon="fa-share-from-square">Review feedback</RowAction>}
                />
              )}
            </div>
          </div>
        )}
      </CardContent>

      <Footer status={footerStatus} tally={tallyParts.join(' · ')} />
    </Card>
  )
}

/* ── the three real cases ────────────────────────────────────────────────── */

function caseLabel(b: CourseBreakdown, hideLiveAndClosed: boolean): string {
  const setup = b.notConfiguredCount + b.draft.length + b.scheduled.length
  const live = hideLiveAndClosed ? 0 : b.live.length
  const closed = hideLiveAndClosed ? 0 : b.closed.length
  if (closed >= live && closed >= setup) return 'Case: mostly closed'
  if (live >= setup) {
    return liveAtRiskCodes(b.live).size > 0 ? 'Case: live, with courses closing behind target' : 'Case: live and collecting'
  }
  return 'Case: mostly setup'
}

export default function VariantTintedSurfaces() {
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
