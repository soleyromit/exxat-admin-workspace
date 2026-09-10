'use client'

// ============================================================================
// Breakdown row-list — VARIANT C: GROUPED RAIL. (Compare route, throwaway.)
//
// One real change: every lifecycle group's rows hang off a single continuous
// rail, rows inside a group sit tighter (py-1.5, no per-row hairline) and the
// groups themselves get real air between them. Scanning gets easier because
// related rows read as one cluster instead of five evenly-spaced facts — the
// separation now falls between groups, where the meaning actually changes.
// The rail also anchors each row's small tinted icon badge, so lifecycle
// state registers before any word is read.
// ============================================================================

import { useMemo } from 'react'
import Link from 'next/link'
import {
  Badge,
  Button,
  Card, CardContent, CardFooter, CardHeader, CardTitle,
  HoverCard, HoverCardTrigger, HoverCardContent,
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem,
  StatusBadge,
} from '@exxatdesignux/ui'
import type { StatusBadgeTone } from '@exxatdesignux/ui'
import { usePce } from '@/components/pce/pce-state'
import { RowAction, GroupLabel } from '@/components/pce/term-breakdown'
import {
  LIST_HUB_STATUS_TINT_SUCCESS,
  LIST_HUB_STATUS_TINT_WARNING,
  LIST_HUB_STATUS_TINT_PLANNED,
  LIST_HUB_STATUS_TINT_NEUTRAL,
  type StatusTint,
} from '@/lib/list-status-badges'
import {
  classifyTermWindow, breakdownFor, breakdownSummary, parseDate,
  coveragePercent, isFullyCovered, coverageLead, coverageDetail, coverageCodes,
  coverageUrgentConsequence,
  scheduledLead, scheduledDetail, scheduledCountdown,
  liveLead, liveNarrative, liveCountdown, liveAtRiskCodes, liveUrgentConsequence,
  closedNarrative, courseRates,
  type CourseBreakdown, type TermWindowPosition,
} from '@/lib/pce-term-metrics'
import type { ProgramTerm } from '@/lib/pce-mock-data'

/* ── borrowed row parts ───────────────────────────────────────────────────────
 * `RowAction` and `GroupLabel` are imported from term-breakdown.tsx (they're
 * exported). `CourseChips`, `RowCountdown` and `RowActionMenu` are NOT
 * exported there, and this compare route must not touch a production file —
 * so they're copied verbatim below, anatomy unchanged. Nothing about the chip
 * or overflow-menu treatment is what this variant is exploring.
 * ────────────────────────────────────────────────────────────────────────── */

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

/* ── the variant's own parts ─────────────────────────────────────────────── */

/** Lifecycle state → icon. One distinct silhouette per state, chosen so the
 *  badge alone separates the rows: a clipboard (work not configured), a dated
 *  calendar (queued to open), an inbox (responses arriving), a chequered flag
 *  (finished), a tick (nothing left to set up). All five already ship in this
 *  app's Font Awesome subset. Production's `fa-circle-dot` for Live is the one
 *  swap — a dot inside a round badge reads as a circle inside a circle at
 *  10px, which is exactly the legibility the badge exists to buy. */
const STATE_ICON = {
  setup:     'fa-clipboard-list',
  scheduled: 'fa-calendar-day',
  live:      'fa-inbox',
  closed:    'fa-flag-checkered',
  covered:   'fa-check',
} as const

/** The row's state marker: the state icon inside a small circle filled with
 *  that state's own tint (the Vanta / Linear / ClickUp row-badge pattern).
 *  Purely a container swap — same icon glyph, same tint token as production's
 *  bare `<i>`, just given a shape so the eye can land on it. Decorative: the
 *  row title states the same fact in words. */
function RowBadge({ icon, tint }: { icon: string; tint: StatusTint }) {
  return (
    <span
      className="mt-px inline-flex size-5 shrink-0 items-center justify-center rounded-full"
      style={{ background: tint.bg, color: tint.fg }}
      aria-hidden="true"
    >
      <i className={`fa-light ${icon}`} style={{ fontSize: 10 }} />
    </span>
  )
}

/** Same row anatomy as `BreakdownRow` — icon, title, chips, countdown,
 *  optional narrative, one primary action plus overflow — with two container
 *  changes only:
 *    1. `py-1.5` and no `border-t` hairline. Inside a rail the hairlines were
 *       doing the same job twice, and dropping them is what lets rows in a
 *       group actually sit as a cluster.
 *    2. An `urgent` row keeps its warning wash but drops its own left accent
 *       and radius — the group rail is already the accent, and it turns
 *       warning-tinted for exactly this case, so the wash can run flat into
 *       it instead of restating it 2px to the right. */
function RailRow({
  icon, tint, title, subtitle, meta, srSummary, narrative, actions, urgent = false,
}: {
  icon: string
  tint: StatusTint
  title: string
  subtitle?: string
  meta?: React.ReactNode
  srSummary?: string
  narrative?: string
  actions?: React.ReactNode
  urgent?: boolean
}) {
  return (
    <div
      className={'flex items-start gap-2.5 py-1.5' + (urgent ? ' -ml-3 py-2 pl-3 pr-2' : '')}
      style={urgent ? { background: LIST_HUB_STATUS_TINT_WARNING.bg } : undefined}
    >
      <RowBadge icon={icon} tint={tint} />
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

/** A lifecycle cluster: sentence-case label with its own row count, an
 *  optional group-level measure on the right (coverage % belongs to the Setup
 *  phase, not to any single row in it), and the rail the rows hang from.
 *  The rail is `border-border/60` at rest and takes the warning border token
 *  when the group holds an urgent row, so the colour reads at group scale
 *  rather than only inside one row's wash. */
function RailGroup({
  label, count, measure, urgent = false, children,
}: {
  label: string
  count: number
  measure?: React.ReactNode
  urgent?: boolean
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between gap-3">
        <GroupLabel>{`${label} (${count})`}</GroupLabel>
        {measure}
      </div>
      <div
        className={'flex flex-col border-l-2 pl-3' + (urgent ? '' : ' border-border/60')}
        style={urgent ? { borderLeftColor: LIST_HUB_STATUS_TINT_WARNING.border } : undefined}
      >
        {children}
      </div>
    </div>
  )
}

/* ── the row list ────────────────────────────────────────────────────────── */

/** Same content model, buckets, copy and actions as `TermBreakdown` — every
 *  number comes from lib/pce-term-metrics.ts, nothing is recomputed here.
 *  Only the grouping container changed. */
function GroupedRailBreakdown({
  term, breakdown, hideLiveAndClosed = false, startsInDays = null,
}: {
  term: ProgramTerm
  breakdown: CourseBreakdown
  /** A term that hasn't started can't have live or closed evaluations —
   *  production hides them on the Upcoming card regardless of mock data. */
  hideLiveAndClosed?: boolean
  /** Days until the term starts, for the Setup row's urgency test. */
  startsInDays?: number | null
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
  const liveConsequence = liveUrgentConsequence(b.live)
  const closedStory = closedNarrative(b.closed)
  const closedCodes = b.closed.map((s) => s.courseCode)
  const workspaceHref = (tab: 'active' | 'finished') => `/course-evaluation/term/${term.id}?tab=${tab}`

  /* Same compound test production uses (dashboard-home.tsx:941) — imminent
     start AND low coverage, never "an upcoming term with work left", which is
     every upcoming term by definition. */
  const isSetupUrgent =
    startsInDays != null && startsInDays <= 14 && coveragePct < 50 && !fullyCovered && setupTotal > 0

  const showSetupRow = !fullyCovered && !!covLead
  const showScheduledRow = b.scheduled.length > 0 && !!schedLead
  const setupCount = (showSetupRow ? 1 : 0) + (showScheduledRow ? 1 : 0)

  const showLiveRow = !hideLiveAndClosed && b.live.length > 0 && !!liveLeadText
  const showClosedRow = !hideLiveAndClosed && b.closed.length > 0
  const collectionCount = (showLiveRow ? 1 : 0) + (showClosedRow ? 1 : 0)

  return (
    /* gap-5 between groups instead of production's `border-t pt-3`: the rails
       already say where one cluster ends, so the separation can be space. */
    <div className="flex flex-col gap-5">
      {fullyCovered && (
        <div className="flex items-center gap-2.5">
          <RowBadge icon={STATE_ICON.covered} tint={LIST_HUB_STATUS_TINT_SUCCESS} />
          <p className="text-xs font-medium text-foreground">Evaluation coverage complete</p>
        </div>
      )}

      {setupCount > 0 && (
        <RailGroup
          label="Setup"
          count={setupCount}
          urgent={isSetupUrgent}
          measure={
            !fullyCovered ? (
              <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                <span className="font-semibold text-foreground">{coveragePct}%</span> covered
              </span>
            ) : undefined
          }
        >
          {showSetupRow && (
            <RailRow
              icon={STATE_ICON.setup}
              tint={LIST_HUB_STATUS_TINT_NEUTRAL}
              title={covLead!}
              meta={<CourseChips codes={setupCodes} />}
              srSummary={covDetail ?? undefined}
              narrative={isSetupUrgent ? coverageUrgentConsequence(startsInDays!, coveragePct) : undefined}
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
        </RailGroup>
      )}

      {collectionCount > 0 && (
        <RailGroup label="Collecting responses" count={collectionCount} urgent={isLiveUrgent}>
          {showLiveRow && (
            <RailRow
              icon={STATE_ICON.live}
              tint={LIST_HUB_STATUS_TINT_SUCCESS}
              title={liveLeadText!}
              meta={
                <div className="flex flex-wrap items-center gap-2">
                  <CourseChips codes={liveCodes} rates={courseRates(b.live)} atRisk={liveAtRisk} />
                  {liveCountdownText && <RowCountdown label={liveCountdownText} urgent={isLiveUrgent} />}
                </div>
              }
              srSummary={liveStory ?? undefined}
              narrative={isLiveUrgent ? liveConsequence ?? undefined : undefined}
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
              title={`${b.closed.length} of ${b.totalCourses} closed`}
              meta={<CourseChips codes={closedCodes} rates={courseRates(b.closed)} />}
              srSummary={closedStory ?? undefined}
              actions={<RowAction href={workspaceHref('finished')} primary icon="fa-share-from-square">Review feedback</RowAction>}
            />
          )}
        </RailGroup>
      )}
    </div>
  )
}

/* ── card shell ──────────────────────────────────────────────────────────── */

const POSITION_BADGE: Record<Exclude<TermWindowPosition, 'future'>, { label: string; tone: StatusBadgeTone }> = {
  current:  { label: 'Current',   tone: 'success' },
  last:     { label: 'Last term', tone: 'neutral' },
  upcoming: { label: 'Upcoming',  tone: 'info' },
}

/** Footer status distribution — plain muted text, dot separated, no bar and no
 *  segmented graphic (these are checklist states, not an in-flight metric).
 *  The string is `breakdownSummary()`, the same helper the production footer
 *  already owns, so the footer and the rows can never disagree about a bucket:
 *  "5 need setup · 3 live · 2 closed · 10 total". Replaces the bare
 *  "N courses in this term" count, which said nothing the card didn't. */
function CaseCard({
  caption, term, breakdown, position, hideLiveAndClosed = false, startsInDays = null,
}: {
  caption: string
  term: ProgramTerm
  breakdown: CourseBreakdown
  position: Exclude<TermWindowPosition, 'future'>
  hideLiveAndClosed?: boolean
  startsInDays?: number | null
}) {
  return (
    <div className="flex min-w-0 flex-col gap-2">
      <p className="text-xs text-muted-foreground">{caption}</p>
      <Card className="flex h-full flex-col">
        <CardHeader>
          <div className="flex min-w-0 items-center justify-between gap-2">
            <CardTitle className="min-w-0 truncate text-base font-semibold">{term.name}</CardTitle>
            <StatusBadge label={POSITION_BADGE[position].label} tone={POSITION_BADGE[position].tone} />
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">
            AY {term.academicYear.replace(/–20(\d\d)$/, '–$1')}
          </p>
        </CardHeader>
        <CardContent>
          <GroupedRailBreakdown
            term={term}
            breakdown={breakdown}
            hideLiveAndClosed={hideLiveAndClosed}
            startsInDays={startsInDays}
          />
        </CardContent>
        <CardFooter className="mt-auto">
          <p className="min-w-0 flex-1 truncate text-xs text-muted-foreground">{breakdownSummary(breakdown)}</p>
        </CardFooter>
      </Card>
    </div>
  )
}

/* ── the three real cases ────────────────────────────────────────────────── */

export default function VariantGroupedRail() {
  const { surveys, programTerms } = usePce()

  /* Term-slot selection is production's (dashboard-home.tsx), verbatim, the
     same way variant-a-narrative.tsx does it — this file redesigns rows, not
     which term lands where, and the three windows happen to be exactly the
     three row cases worth showing: Upcoming = still in setup, Current = live
     with courses behind, Last = finished. */
  const ce = useMemo(
    () => surveys.filter((s) => !s.surveyType || s.surveyType === 'course_evaluation'),
    [surveys],
  )
  const today = useMemo(() => new Date().toISOString().slice(0, 10), [])
  const ordered = useMemo(
    () => [...programTerms].sort((a, b) => a.startDate.localeCompare(b.startDate)),
    [programTerms],
  )

  const currentTerm = useMemo(
    () => ordered.find((t) => classifyTermWindow(t, today) === 'current') ?? null,
    [ordered, today],
  )
  /* Last is capped to the single most recently ended term, as production does. */
  const lastTerm = useMemo(() => {
    const candidates = ordered.filter((t) => classifyTermWindow(t, today) === 'last')
    return [...candidates].sort((a, b) => b.endDate.localeCompare(a.endDate))[0] ?? null
  }, [ordered, today])
  const upcomingTerm = useMemo(
    () => ordered.find((t) => classifyTermWindow(t, today) === 'upcoming' && !!t.startDate) ?? null,
    [ordered, today],
  )

  const startsIn = (term: ProgramTerm) =>
    term.startDate ? Math.max(0, Math.ceil((parseDate(term.startDate).getTime() - Date.now()) / 86_400_000)) : null

  const cases = useMemo(() => {
    const built: {
      caption: string
      term: ProgramTerm
      breakdown: CourseBreakdown
      position: Exclude<TermWindowPosition, 'future'>
      hideLiveAndClosed?: boolean
      startsInDays?: number | null
    }[] = []
    const add = (
      term: ProgramTerm | null,
      caption: string,
      position: Exclude<TermWindowPosition, 'future'>,
      extra: { hideLiveAndClosed?: boolean; startsInDays?: number | null } = {},
    ) => {
      if (!term) return
      const breakdown = breakdownFor(term, ce)
      if (!breakdown) return
      built.push({ caption, term, breakdown, position, ...extra })
    }
    add(upcomingTerm, 'Case: mostly setup', 'upcoming', {
      hideLiveAndClosed: true,
      startsInDays: upcomingTerm ? startsIn(upcomingTerm) : null,
    })
    add(currentTerm, 'Case: collecting, with courses behind and closing soon', 'current')
    add(lastTerm, 'Case: mostly closed', 'last')
    return built
  }, [ce, currentTerm, lastTerm, upcomingTerm])

  if (cases.length === 0) {
    return (
      <p className="rounded-lg border border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
        This account has no term with course offerings in the last, current, or upcoming window right now.
      </p>
    )
  }

  return (
    <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-3">
      {cases.map((c) => (
        <CaseCard
          key={c.term.id}
          caption={c.caption}
          term={c.term}
          breakdown={c.breakdown}
          position={c.position}
          hideLiveAndClosed={c.hideLiveAndClosed}
          startsInDays={c.startsInDays}
        />
      ))}
    </div>
  )
}
