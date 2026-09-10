'use client'

// ============================================================================
// COMPARE ROUTE (throwaway — same lifecycle as /compare/dashboard-cards).
//
// Row-list anatomy only — VARIANT A: STATUS RAIL. The one real change: each
// row's flat fa-light icon becomes a state mark in the same slot — a solid
// glyph on its own tinted disc, one glyph per lifecycle state, sized up on
// the row that leads its group — and every group label carries its row count
// ("Setup · 2"). Five glyphs at one muted weight and one muted colour gave
// the eye nothing to sort by; shape plus tint plus size turns the left edge
// into a rail you can scan for state before reading a word (Linear, ClickUp
// and Vanta all land on the same icon-in-tinted-circle mark). Chips, actions,
// narrative and the urgent wash are unchanged from term-breakdown.tsx and are
// not re-litigated here — and no row gains a chart, sparkline or bar: these
// are checklist states, not in-flight metrics.
// Also adds the card-footer status distribution (Vanta status-page style:
// plain dot-separated text, never a segmented bar), which these rows had no
// summary line for at all.
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
import { RowAction, GroupLabel } from '@/components/pce/term-breakdown'
import {
  LIST_HUB_STATUS_TINT_SUCCESS,
  LIST_HUB_STATUS_TINT_WARNING,
  LIST_HUB_STATUS_TINT_PLANNED,
  type StatusTint,
} from '@/lib/list-status-badges'
import {
  classifyTermWindow, breakdownFor, breakdownSummary,
  coveragePercent, isFullyCovered, coverageLead, coverageDetail, coverageCodes, coverageUrgentConsequence,
  scheduledLead, scheduledDetail, scheduledCountdown,
  liveLead, liveNarrative, liveCountdown, liveAtRiskCodes, liveUrgentConsequence,
  closedNarrative, courseRates, evalWindow, parseDate,
  type CourseBreakdown, type TermWindowPosition,
} from '@/lib/pce-term-metrics'
import type { ProgramTerm } from '@/lib/pce-mock-data'

/* ── the one new primitive ───────────────────────────────────────────────── */

/** Replaces `BreakdownRow`'s bare fa-light icon, in the same slot and at the
 *  same optical position. The originals were five different glyphs rendered
 *  at one weight and (mostly) one muted colour — they read as decoration and
 *  told you which row you were on only after you'd already read the title.
 *  Three channels do the work here instead of one:
 *
 *    SHAPE  — a distinct solid glyph per lifecycle state, and specifically a
 *             different glyph when a row is urgent (warning triangle) than
 *             when it is merely closed (chequered flag). Those two shared the
 *             same amber before, which meant "finished" and "act on this"
 *             looked identical on a scan.
 *    TINT   — the disc behind the glyph uses the row's existing `StatusTint`
 *             pair (`bg` for the disc, `fg` for the glyph), so this borrows
 *             the app's colour language rather than inventing one: muted for
 *             non-urgent setup, planned for scheduled, success for live,
 *             warning for closed and for anything urgent. Amber family only —
 *             no red anywhere (feedback_aarti_no_red).
 *    SIZE   — the row that leads its group gets the larger disc, so each
 *             group has one clear entry point instead of a uniform column.
 *
 *  Still decorative: every row title states its status in words ("3 courses
 *  live"), so nothing here is carried by colour or glyph alone. */
function StatusMark({
  icon, tint, lead = false,
}: {
  icon: string
  tint: StatusTint | null
  lead?: boolean
}) {
  const size = lead ? 20 : 17
  return (
    <span
      aria-hidden="true"
      className="inline-flex shrink-0 items-center justify-center rounded-full"
      style={{
        width: size,
        height: size,
        marginTop: (16 - size) / 2,
        background: tint?.bg ?? 'var(--muted)',
        color: tint?.fg ?? 'var(--muted-foreground)',
      }}
    >
      <i className={`fa-solid ${icon}`} style={{ fontSize: lead ? 10 : 9 }} />
    </span>
  )
}

/** One glyph per lifecycle state — the shape channel of `StatusMark`. Kept as
 *  a single map so a state can never pick up two different icons on two
 *  different rows, which is what let "closed" and "urgent" look alike before. */
const STATE_ICON = {
  covered:   'fa-circle-check',
  setup:     'fa-list-check',
  scheduled: 'fa-calendar',
  live:      'fa-circle-dot',
  closed:    'fa-flag-checkered',
  urgent:    'fa-triangle-exclamation',
} as const

/* ── unchanged row parts, re-declared because term-breakdown.tsx keeps them
      module-private (RowAction / GroupLabel are the two it exports, and both
      are imported above rather than copied). ─────────────────────────────── */

/** Overflow trigger for a row's secondary action — one visible primary
 *  `RowAction` plus this, never two same-weight visible links. */
function RowActionMenu({ items }: { items: { href: string; label: string; icon: string }[] }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label="More actions" className="size-5 shrink-0 text-muted-foreground">
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

/** Names the courses a row's count refers to — Badge pills, with anything
 *  past `max` behind a HoverCard "+N more" so an 11-course bucket stays as
 *  tall as a 1-course one. Never a bare count with no course names. */
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
    <div className="flex flex-wrap items-center gap-1">
      {shown.map((code) => (
        <Badge
          key={code}
          variant="outline"
          className="rounded-full px-2 py-0 text-[11px] font-medium tabular-nums"
          style={
            atRisk?.has(code)
              ? { color: LIST_HUB_STATUS_TINT_WARNING.fg, background: LIST_HUB_STATUS_TINT_WARNING.bg, borderColor: LIST_HUB_STATUS_TINT_WARNING.border }
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
              className="cursor-default rounded-full border-dashed px-2 py-0 text-[11px] font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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

/** Date fact as its own small chip rather than folded into prose. */
function RowCountdown({ label, urgent = false }: { label: string; urgent?: boolean }) {
  return (
    <span
      className="inline-flex shrink-0 items-center gap-1 text-[11px] font-medium tabular-nums"
      style={{ color: urgent ? LIST_HUB_STATUS_TINT_WARNING.fg : 'var(--muted-foreground)' }}
    >
      <i className="fa-light fa-clock" aria-hidden="true" style={{ fontSize: 10 }} />
      {label}
    </span>
  )
}

/** Same row anatomy as `BreakdownRow` — flat, never a bordered sub-card;
 *  `urgent` is a background wash plus a left accent and its own action line,
 *  and only for a row that is BOTH time-bound and has something wrong. The
 *  single difference is `StatusMark` where the flat icon used to sit — an
 *  urgent row also swaps its glyph, so the wash is not the only thing saying
 *  "this one is different". */
function RailRow({
  icon, tint, title, subtitle, meta, srSummary, narrative, actions, urgent = false, lead = false,
}: {
  icon: string
  tint: StatusTint | null
  title: string
  subtitle?: string
  meta?: React.ReactNode
  srSummary?: string
  narrative?: string
  actions?: React.ReactNode
  urgent?: boolean
  /** First row under a group label — takes the larger mark. */
  lead?: boolean
}) {
  return (
    <div
      className={
        'flex items-start gap-2 border-t border-border/60 py-2 first:border-t-0' +
        (urgent ? ' -mx-2.5 mt-0.5 rounded-md border-t-0 border-l-2 px-2.5' : '')
      }
      style={urgent ? { background: LIST_HUB_STATUS_TINT_WARNING.bg, borderLeftColor: LIST_HUB_STATUS_TINT_WARNING.border } : undefined}
    >
      <StatusMark
        icon={urgent ? STATE_ICON.urgent : icon}
        tint={urgent ? LIST_HUB_STATUS_TINT_WARNING : tint}
        lead={lead || urgent}
      />
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <div className="flex min-w-0 items-start justify-between gap-3">
          <p className="text-xs font-medium text-foreground">{title}</p>
          {actions && !urgent && <div className="ms-auto flex shrink-0 items-center gap-1">{actions}</div>}
        </div>
        {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
        {meta && (
          <>
            {meta}
            {srSummary && <span className="sr-only">{srSummary}</span>}
          </>
        )}
        {narrative && <p className="text-xs text-muted-foreground">{narrative}</p>}
        {actions && urgent && <div className="mt-0.5 flex items-center gap-3">{actions}</div>}
      </div>
    </div>
  )
}

/* ── the row list ────────────────────────────────────────────────────────── */

function TermBreakdownRail({
  term, breakdown, hideLiveAndClosed = false, setupUrgent = null,
}: {
  term: ProgramTerm
  breakdown: CourseBreakdown
  hideLiveAndClosed?: boolean
  setupUrgent?: { startsInDays: number } | null
}) {
  const b = breakdown
  const fullyCovered = isFullyCovered(b)
  const coveragePct = coveragePercent(b)
  const setupTotal = b.notConfiguredCount + b.draft.length
  const setupCodes = coverageCodes(b.notConfiguredCodes, b.draft)
  const covLead = coverageLead(b.notConfiguredCount, b.draft.length)
  const covDetail = coverageDetail(b.notConfiguredCount, b.draft.length)
  const schedLead = scheduledLead(b.scheduled)
  const schedDetail = scheduledDetail(b.scheduled)
  const schedCountdown = scheduledCountdown(b.scheduled)
  const scheduledCodes = b.scheduled.map((s) => s.courseCode)
  const liveLeadText = liveLead(b.live)
  const liveStory = liveNarrative(b.live)
  const liveCountdownText = liveCountdown(b.live)
  const liveCodes = b.live.map((s) => s.courseCode)
  const liveAtRisk = liveAtRiskCodes(b.live)
  const isLiveUrgent = liveAtRisk.size > 0
  const closedStory = closedNarrative(b.closed)
  const closedCodes = b.closed.map((s) => s.courseCode)
  const workspaceHref = (tab: 'active' | 'finished') => `/course-evaluation/term/${term.id}?tab=${tab}`

  const isSetupUrgent = !!setupUrgent && !fullyCovered && setupTotal > 0

  const showCoverageRow = !fullyCovered && !!covLead
  const showScheduledRow = b.scheduled.length > 0 && !!schedLead
  const showLiveRow = !hideLiveAndClosed && b.live.length > 0 && !!liveLeadText
  const showClosedRow = !hideLiveAndClosed && b.closed.length > 0

  /* Group counts are ROW counts — how many status lines sit under this label,
     the same thing Linear's and ClickUp's group headers count. Derived from
     the same booleans that render the rows, so the number can never drift
     from what's actually below it. */
  const setupRowCount = Number(showCoverageRow) + Number(showScheduledRow)
  const collectionRowCount = Number(showLiveRow) + Number(showClosedRow)

  return (
    <div className="flex flex-col gap-3">
      {fullyCovered && (
        <RailRow icon={STATE_ICON.covered} tint={LIST_HUB_STATUS_TINT_SUCCESS} title="Evaluation coverage complete" lead />
      )}

      {setupRowCount > 0 && (
        <div className="flex flex-col gap-1.5">
          <GroupLabel>Setup · {setupRowCount}</GroupLabel>
          <div className="flex flex-col">
            {showCoverageRow && (
              <div className="flex items-baseline justify-between gap-2 py-2">
                <span className="text-xs text-muted-foreground">Evaluation coverage</span>
                <span className="text-sm font-semibold tabular-nums leading-none text-foreground">{coveragePct}%</span>
              </div>
            )}
            {showCoverageRow && (
              <RailRow
                icon={STATE_ICON.setup}
                tint={null}
                lead
                title={covLead!}
                meta={<CourseChips codes={setupCodes} />}
                srSummary={covDetail ?? undefined}
                narrative={isSetupUrgent ? coverageUrgentConsequence(setupUrgent!.startsInDays, coveragePct) : undefined}
                urgent={isSetupUrgent}
                actions={
                  <RowAction href={`/surveys/push?term=${term.id}`} primary icon="fa-plus">
                    {setupTotal === 1 ? 'Set up evaluation' : 'Set up evaluations'}
                  </RowAction>
                }
              />
            )}
            {showScheduledRow && (
              <RailRow
                icon={STATE_ICON.scheduled}
                tint={LIST_HUB_STATUS_TINT_PLANNED}
                lead={!showCoverageRow}
                title={schedLead!}
                meta={
                  <div className="flex flex-wrap items-center gap-2">
                    <CourseChips codes={scheduledCodes} />
                    {schedCountdown && <RowCountdown label={schedCountdown} />}
                  </div>
                }
                srSummary={schedDetail ?? undefined}
                actions={<RowAction href={workspaceHref('active')} primary icon="fa-pen-ruler">Manage</RowAction>}
              />
            )}
          </div>
        </div>
      )}

      {collectionRowCount > 0 && (
        <div className="flex flex-col gap-1.5 border-t border-border/60 pt-3">
          <GroupLabel>Collecting responses · {collectionRowCount}</GroupLabel>
          <div className="flex flex-col">
            {showLiveRow && (
              <RailRow
                icon={STATE_ICON.live}
                tint={LIST_HUB_STATUS_TINT_SUCCESS}
                lead
                title={liveLeadText!}
                meta={
                  <div className="flex flex-wrap items-center gap-2">
                    <CourseChips codes={liveCodes} rates={courseRates(b.live)} atRisk={liveAtRisk} />
                    {liveCountdownText && <RowCountdown label={liveCountdownText} urgent={isLiveUrgent} />}
                  </div>
                }
                srSummary={liveStory ?? undefined}
                narrative={isLiveUrgent ? liveUrgentConsequence(b.live) ?? undefined : undefined}
                urgent={isLiveUrgent}
                actions={
                  <>
                    <RowAction href={`/surveys/remind?from=term:${term.id}`} primary icon="fa-bell">Remind</RowAction>
                    <RowActionMenu items={[{ href: workspaceHref('active'), label: 'Extend', icon: 'fa-calendar-pen' }]} />
                  </>
                }
              />
            )}
            {showClosedRow && (
              <RailRow
                icon={STATE_ICON.closed}
                tint={LIST_HUB_STATUS_TINT_WARNING}
                lead={!showLiveRow}
                title={`${b.closed.length} of ${b.totalCourses} closed`}
                meta={<CourseChips codes={closedCodes} rates={courseRates(b.closed)} />}
                srSummary={closedStory ?? undefined}
                actions={<RowAction href={workspaceHref('finished')} primary icon="fa-share-from-square">Review feedback</RowAction>}
              />
            )}
          </div>
        </div>
      )}
    </div>
  )
}

/* ── card shell (unchanged in spirit — this variant is about the body) ───── */

const POSITION_BADGE: Record<Exclude<TermWindowPosition, 'future'>, { label: string; tone: StatusBadgeTone }> = {
  current:  { label: 'Current',   tone: 'success' },
  last:     { label: 'Last term', tone: 'neutral' },
  upcoming: { label: 'Upcoming',  tone: 'info' },
}

/** Footer status distribution, Vanta status-page style: plain muted text,
 *  dot-separated, no bar and no segment graphic (these are checklist states,
 *  not an in-flight metric). `breakdownSummary` already composes exactly this
 *  line from the real bucket counts — computing it here by hand would give the
 *  card a second, drifting content model for the same numbers. */
function DistributionFooter({ breakdown }: { breakdown: CourseBreakdown }) {
  return (
    <CardFooter className="mt-auto">
      <p className="min-w-0 flex-1 truncate text-xs text-muted-foreground">{breakdownSummary(breakdown)}</p>
    </CardFooter>
  )
}

function RailCard({
  term, position, breakdown, hideLiveAndClosed, setupUrgent,
}: {
  term: ProgramTerm
  position: Exclude<TermWindowPosition, 'future'>
  breakdown: CourseBreakdown
  hideLiveAndClosed?: boolean
  setupUrgent?: { startsInDays: number } | null
}) {
  const win = evalWindow(term)
  const dated = !!term.startDate && !!term.endDate
  return (
    <Card className="flex flex-col">
      <CardHeader>
        <div className="flex min-w-0 items-center justify-between gap-2">
          <CardTitle className="min-w-0 truncate text-base font-semibold">
            <Link
              href={`/course-evaluation/term/${term.id}`}
              aria-label={`Open ${term.name} workspace`}
              className="rounded-sm text-foreground hover:underline underline-offset-2 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              {term.name}
            </Link>
          </CardTitle>
          <StatusBadge label={POSITION_BADGE[position].label} tone={POSITION_BADGE[position].tone} />
        </div>
        <p className="mt-0.5 text-xs text-muted-foreground">
          AY {term.academicYear.replace(/–20(\d\d)$/, '–$1')}
          {dated
            ? ` · Eval window ${win.open.replace(/, \d{4}$/, '')} – ${win.close}`
            : ' · Eval window not set'}
        </p>
      </CardHeader>
      <CardContent>
        <TermBreakdownRail
          term={term}
          breakdown={breakdown}
          hideLiveAndClosed={hideLiveAndClosed}
          setupUrgent={setupUrgent}
        />
      </CardContent>
      <DistributionFooter breakdown={breakdown} />
    </Card>
  )
}

/* ── the three real cases ────────────────────────────────────────────────── */

/** Named from the DATA rather than from the slot, so the label above a card
 *  can never claim a case the fixture no longer demonstrates. */
function caseLabel(b: CourseBreakdown, hideLiveAndClosed: boolean): string {
  const setup = b.notConfiguredCount + b.draft.length + b.scheduled.length
  const live = hideLiveAndClosed ? 0 : b.live.length
  const closed = hideLiveAndClosed ? 0 : b.closed.length
  if (closed >= live && closed >= setup) return 'Case: mostly closed'
  if (live >= setup) {
    return liveAtRiskCodes(b.live).size > 0
      ? 'Case: live, with courses closing behind target'
      : 'Case: live and collecting'
  }
  return 'Case: mostly setup'
}

function CaseBlock({
  label, children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      {children}
    </div>
  )
}

export default function VariantStatusRail() {
  const { surveys, programTerms } = usePce()

  /* Slot selection mirrors dashboard-home.tsx / variant-a-narrative.tsx
     exactly — this variant redesigns rows, not which term lands where, so the
     data underneath stays comparable. */
  const ordered = useMemo(
    () => [...programTerms].sort((a, b) => a.startDate.localeCompare(b.startDate)),
    [programTerms],
  )
  const today = useMemo(() => new Date().toISOString().slice(0, 10), [])
  const ce = useMemo(
    () => surveys.filter((s) => !s.surveyType || s.surveyType === 'course_evaluation'),
    [surveys],
  )

  const upcomingTerm = useMemo(
    () => ordered.find((t) => classifyTermWindow(t, today) === 'upcoming') ?? null,
    [ordered, today],
  )
  const currentTerm = useMemo(
    () => ordered.find((t) => classifyTermWindow(t, today) === 'current') ?? null,
    [ordered, today],
  )
  /* Last is capped to one, most recently ended — same rule as production. */
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
  const upcomingUrgent =
    upcomingB && startsIn != null && startsIn <= 14 && coveragePercent(upcomingB) < 50
      ? { startsInDays: startsIn }
      : null

  if (!upcomingB && !currentB && !lastB) {
    return (
      <p className="rounded-lg border border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
        This account has no term with course offerings in the last, current, or upcoming window right now.
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-5 p-6 max-w-[1400px] mx-auto">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold font-heading">Breakdown rows — variant A, status rail</h1>
        <p className="text-sm text-muted-foreground">
          Same real fixture terms and the same derived numbers as the dashboard. The row list swaps its
          flat icons for state marks — a solid glyph on a tinted disc, one per lifecycle state, larger on
          the row that leads each group — counts the rows in each group label, and closes the card with a
          plain status distribution instead of leaving the footer empty.
        </p>
      </div>

      <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-3">
        {upcomingTerm && upcomingB && (
          <CaseBlock label={caseLabel(upcomingB, true)}>
            <RailCard
              term={upcomingTerm}
              position="upcoming"
              breakdown={upcomingB}
              hideLiveAndClosed
              setupUrgent={upcomingUrgent}
            />
          </CaseBlock>
        )}
        {currentTerm && currentB && (
          <CaseBlock label={caseLabel(currentB, false)}>
            <RailCard term={currentTerm} position="current" breakdown={currentB} />
          </CaseBlock>
        )}
        {lastTerm && lastB && (
          <CaseBlock label={caseLabel(lastB, false)}>
            <RailCard term={lastTerm} position="last" breakdown={lastB} />
          </CaseBlock>
        )}
      </div>
    </div>
  )
}
