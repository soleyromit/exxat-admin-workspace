'use client'

// ============================================================================
// Breakdown row-list — VARIANT B: METRIC-LEAD (compare route, throwaway).
//
// One real change to `BreakdownRow`'s anatomy: the count that already opens
// every lead string from pce-term-metrics.ts ("5 courses need setup") is
// pulled out of the title into a fixed-width left gutter and set large,
// semibold, tabular — paired with the row's state icon in a small tinted
// circle. Scanning a card becomes reading one column of numbers instead of
// re-parsing five sentences. Reference: Vanta's monitoring modules, where a
// single big figure anchors each row. Card footer gains the status
// distribution ("30 live · 5 closed · 35 total") the production footer
// ("10 courses in this term") never carried.
// ============================================================================

import { useMemo } from 'react'
import Link from 'next/link'
import {
  Badge, Button, StatusBadge, Tip,
  Card, CardContent, CardFooter, CardHeader, CardTitle,
  HoverCard, HoverCardTrigger, HoverCardContent,
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem,
} from '@exxatdesignux/ui'
import { usePce } from '@/components/pce/pce-state'
import { RowAction, GroupLabel } from '@/components/pce/term-breakdown'
import {
  LIST_HUB_STATUS_TINT_SUCCESS,
  LIST_HUB_STATUS_TINT_WARNING,
  LIST_HUB_STATUS_TINT_PLANNED,
  LIST_HUB_STATUS_TINT_NEUTRAL,
  LIST_HUB_STATUS_TINT_COMPLETED,
  type StatusTint,
} from '@/lib/list-status-badges'
import {
  classifyTermWindow, breakdownFor, breakdownSummary, evalWindow, parseDate,
  coveragePercent, isFullyCovered, coverageLead, coverageDetail, coverageCodes,
  coverageUrgentConsequence,
  scheduledLead, scheduledDetail, scheduledCountdown,
  liveLead, liveNarrative, liveCountdown, liveAtRiskCodes, liveUrgentConsequence,
  closedNarrative, courseRates,
  type CourseBreakdown,
} from '@/lib/pce-term-metrics'
import type { ProgramTerm, PceSurvey } from '@/lib/pce-mock-data'

/* ── the one new primitive ───────────────────────────────────────────────── */

/** Splits the leading count off a lead string composed in pce-term-metrics.ts
 *  — "5 courses need setup" → `{ count: '5', rest: 'courses need setup' }`.
 *  No new copy is written for this variant: the gutter number and the row
 *  title are the two halves of the sentence the helper already returns, so a
 *  wording change in pce-term-metrics.ts still flows through here. A lead
 *  with no leading digit (none today, but the fully-covered banner has no
 *  lead at all) falls back to an icon-only gutter. */
function splitLead(lead: string): { count: string | null; rest: string } {
  const m = /^(\d+)\s+(\S.*)$/.exec(lead)
  return m ? { count: m[1], rest: m[2] } : { count: null, rest: lead }
}

/** State icon in a small tinted disc. Per-state glyph AND per-state colour —
 *  production's rows all carried the same thin muted icon at the same size,
 *  so the icon column told you nothing on a scan. Solid glyph inside a filled
 *  circle is the Vanta/Linear/ClickUp module marker; it is a badge, not a
 *  chart — no per-row viz, per the tenth-pass finding in term-breakdown.tsx
 *  and the standing no-progress-bar rule. */
function StateBadge({ icon, tint }: { icon: string; tint: StatusTint }) {
  return (
    <span
      className="flex size-5 shrink-0 items-center justify-center rounded-full"
      style={{ background: tint.bg, color: tint.fg }}
      aria-hidden="true"
    >
      <i className={`fa-solid ${icon}`} style={{ fontSize: 10 }} />
    </span>
  )
}

/** Row anatomy. Identical to `BreakdownRow` (term-breakdown.tsx) except for
 *  the gutter: state badge + the row's own count, large and tabular, with the
 *  count removed from `title` so the fact is stated once. Everything the ten
 *  prior passes settled stays — flat warning wash + left accent on genuinely
 *  urgent rows only (no border/shadow/radius), one visible ghost-Button
 *  action plus an overflow menu, chips naming the courses, sentence case. */
function MetricRow({
  icon, tint, count, title, meta, srSummary, narrative, actions, urgent = false,
}: {
  icon: string
  tint: StatusTint
  /** null on a row with nothing to count (the fully-covered banner) — the
   *  badge then stands alone rather than a zero being invented for it. */
  count?: string | null
  title: string
  meta?: React.ReactNode
  /** Full-sentence equivalent of `meta`, screen-reader only. */
  srSummary?: string
  /** Short consequence line — only present on `urgent` rows. */
  narrative?: string
  actions?: React.ReactNode
  urgent?: boolean
}) {
  return (
    <div
      className={
        'flex items-start gap-2.5 border-t border-border/60 py-2 first:border-t-0' +
        (urgent ? ' -mx-2.5 mt-0.5 rounded-md border-t-0 border-l-2 px-2.5' : '')
      }
      style={urgent ? { background: LIST_HUB_STATUS_TINT_WARNING.bg, borderLeftColor: LIST_HUB_STATUS_TINT_WARNING.border } : undefined}
    >
      <span className="mt-1 flex h-5 w-[3.25rem] shrink-0 items-center justify-end gap-2">
        <StateBadge icon={icon} tint={tint} />
        {count && (
          <span
            className="text-lg font-semibold leading-none tabular-nums"
            style={{ color: urgent ? LIST_HUB_STATUS_TINT_WARNING.fg : tint.fg }}
          >
            {count}
          </span>
        )}
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <div className="flex min-h-7 min-w-0 items-center justify-between gap-3">
          <p className="text-xs font-medium leading-5 text-foreground">{title}</p>
          {actions && !urgent && <div className="ms-auto flex shrink-0 items-center gap-1">{actions}</div>}
        </div>
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

/* ── carried over verbatim from term-breakdown.tsx (not exported there) ───── */

/** Overflow trigger for a row's secondary action — pairs with exactly one
 *  visible `RowAction primary`, so there is never a "which of these two is
 *  the real action" question. */
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

/** Names the specific courses a row's count refers to — the gutter number
 *  says how many, the chips say which. Overflow past `max` collapses into a
 *  HoverCard-disclosed "+N more" so an 11-course bucket stays exactly as tall
 *  as a 1-course one. */
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

/* ── the row list ────────────────────────────────────────────────────────── */

/** Per-state glyphs. Production reused one thin neutral icon shape across
 *  rows; these are four clearly different silhouettes so the badge column is
 *  readable before the words are. `fa-calendar-clock` (waiting to open) and
 *  `fa-broadcast-tower` (out and collecting) both already ship in this app's
 *  icon subset — checked, not assumed. */
const STATE = {
  setup:     { icon: 'fa-list-check',      tint: LIST_HUB_STATUS_TINT_NEUTRAL },
  scheduled: { icon: 'fa-calendar-clock',  tint: LIST_HUB_STATUS_TINT_PLANNED },
  live:      { icon: 'fa-broadcast-tower', tint: LIST_HUB_STATUS_TINT_SUCCESS },
  /* Closed is finished, not at risk — it carries the completed tint here
     rather than production's amber, which read as a warning about a bucket
     where nothing is wrong. Amber stays reserved for genuine urgency. */
  closed:    { icon: 'fa-flag-checkered',  tint: LIST_HUB_STATUS_TINT_COMPLETED },
  covered:   { icon: 'fa-circle-check',    tint: LIST_HUB_STATUS_TINT_SUCCESS },
} as const

function TermBreakdownMetricLead({
  term, breakdown, needsAttention = false, hideLiveAndClosed = false, setupUrgent = null,
}: {
  term: ProgramTerm
  breakdown: CourseBreakdown
  needsAttention?: boolean
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
  const scheduledCodes = b.scheduled.map((s: PceSurvey) => s.courseCode)
  const liveLeadText = liveLead(b.live)
  const liveStory = liveNarrative(b.live)
  const liveCountdownText = liveCountdown(b.live)
  const liveCodes = b.live.map((s: PceSurvey) => s.courseCode)
  const liveAtRisk = liveAtRiskCodes(b.live)
  const isLiveUrgent = liveAtRisk.size > 0
  const liveConsequence = liveUrgentConsequence(b.live)
  const closedStory = closedNarrative(b.closed)
  const closedCodes = b.closed.map((s: PceSurvey) => s.courseCode)
  const workspaceHref = (tab: 'active' | 'finished') => `/course-evaluation/term/${term.id}?tab=${tab}`

  const isSetupUrgent = !!setupUrgent && !fullyCovered && setupTotal > 0
  const showSetupGroup = !fullyCovered || b.scheduled.length > 0
  const showCollectionGroup = !hideLiveAndClosed && (b.live.length > 0 || b.closed.length > 0)

  const cov = covLead ? splitLead(covLead) : null
  const sched = schedLead ? splitLead(schedLead) : null
  const live = liveLeadText ? splitLead(liveLeadText) : null
  /* "8 of 10 closed" splits the same way every other lead does — gutter takes
     the 8, the title keeps the ratio it belongs to. */
  const closed = splitLead(`${b.closed.length} of ${b.totalCourses} closed`)

  return (
    <div className="flex flex-col gap-3">
      {needsAttention && (
        <Tip label="Term ended with evaluations still outstanding" side="top">
          <span tabIndex={0} className="inline-flex w-fit rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <StatusBadge label="Needs attention" tone="warning" icon="fa-triangle-exclamation" size="sm" />
          </span>
        </Tip>
      )}

      {fullyCovered && (
        <MetricRow icon={STATE.covered.icon} tint={STATE.covered.tint} title="Evaluation coverage complete" />
      )}

      {showSetupGroup && (
        <div className="flex flex-col gap-1.5">
          <GroupLabel>Setup</GroupLabel>
          <div className="flex flex-col">
            {!fullyCovered && (
              <div className="flex items-baseline justify-between gap-2 py-2">
                <span className="text-xs text-muted-foreground">Evaluation coverage</span>
                <span className="text-sm font-semibold leading-none tabular-nums text-foreground">{coveragePct}%</span>
              </div>
            )}
            {!fullyCovered && cov && (
              <MetricRow
                icon={STATE.setup.icon}
                tint={STATE.setup.tint}
                count={cov.count}
                title={cov.rest}
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
            {b.scheduled.length > 0 && sched && (
              <MetricRow
                icon={STATE.scheduled.icon}
                tint={STATE.scheduled.tint}
                count={sched.count}
                title={sched.rest}
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

      {showCollectionGroup && (
        <div className="flex flex-col gap-1.5 border-t border-border/60 pt-3">
          <GroupLabel>Collecting responses</GroupLabel>
          <div className="flex flex-col">
            {b.live.length > 0 && live && (
              <MetricRow
                icon={STATE.live.icon}
                tint={STATE.live.tint}
                count={live.count}
                title={live.rest}
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
            {b.closed.length > 0 && (
              <MetricRow
                icon={STATE.closed.icon}
                tint={STATE.closed.tint}
                count={closed.count}
                title={closed.rest}
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

/* ── card shell (header/footer only — the triptych itself is out of scope) ── */

/** The added footer line. Plain muted dot-separated text, no bar and no
 *  segmented graphic: these are checklist buckets, not one in-flight 0–100%
 *  metric, and the workspace reserves bars for the latter. `breakdownSummary`
 *  is the existing helper for exactly this string, so the footer can never
 *  disagree with the rows above it — it drops zero buckets and always ends on
 *  the total ("30 live · 5 closed · 35 total"). Production's footer said only
 *  "10 courses in this term", which the reader already knew. */
function DistributionFooter({ b }: { b: CourseBreakdown }) {
  return (
    <CardFooter className="mt-auto">
      <p className="min-w-0 flex-1 text-xs tabular-nums text-muted-foreground">{breakdownSummary(b)}</p>
    </CardFooter>
  )
}

function CaseCard({
  label, term, breakdown, badge, ...rowProps
}: {
  label: string
  term: ProgramTerm
  breakdown: CourseBreakdown
  badge: { label: string; tone: 'success' | 'neutral' | 'info' }
  needsAttention?: boolean
  hideLiveAndClosed?: boolean
  setupUrgent?: { startsInDays: number } | null
}) {
  const win = evalWindow(term)
  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <Card className="flex flex-col">
        <CardHeader>
          <div className="flex min-w-0 items-center justify-between gap-2">
            <CardTitle className="min-w-0 truncate text-base font-semibold">{term.name}</CardTitle>
            <StatusBadge label={badge.label} tone={badge.tone} />
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">
            AY {term.academicYear.replace(/–20(\d\d)$/, '–$1')}
            {' · '}
            Eval window {win.open.replace(/, \d{4}$/, '')} – {win.close}
          </p>
        </CardHeader>
        <CardContent>
          <TermBreakdownMetricLead term={term} breakdown={breakdown} {...rowProps} />
        </CardContent>
        <DistributionFooter b={breakdown} />
      </Card>
    </div>
  )
}

/* ── three real fixture terms, three row shapes ──────────────────────────── */

export default function VariantMetricLead() {
  const { surveys, programTerms } = usePce()

  /* Same slot selection as the production dashboard and
     /compare/dashboard-cards — the terms that land here are real fixture
     terms (Fall 2025 / Spring 2026 / Fall 2026), not hand-picked ids, and
     every number below comes from breakdownFor(). */
  const today = useMemo(() => new Date().toISOString().slice(0, 10), [])
  const ce = useMemo(
    () => surveys.filter((s) => !s.surveyType || s.surveyType === 'course_evaluation'),
    [surveys],
  )
  const ordered = useMemo(
    () => [...programTerms].sort((a, b) => a.startDate.localeCompare(b.startDate)),
    [programTerms],
  )

  const upcoming = useMemo(
    () => ordered.find((t) => classifyTermWindow(t, today) === 'upcoming') ?? null,
    [ordered, today],
  )
  const current = useMemo(
    () => ordered.find((t) => classifyTermWindow(t, today) === 'current') ?? null,
    [ordered, today],
  )
  const last = useMemo(() => {
    const candidates = ordered.filter((t) => classifyTermWindow(t, today) === 'last')
    return [...candidates].sort((a, b) => b.endDate.localeCompare(a.endDate))[0] ?? null
  }, [ordered, today])

  const setupB = upcoming ? breakdownFor(upcoming, ce) : null
  const liveB = current ? breakdownFor(current, ce) : null
  const closedB = last ? breakdownFor(last, ce) : null

  const startsIn = upcoming?.startDate
    ? Math.max(0, Math.ceil((parseDate(upcoming.startDate).getTime() - Date.now()) / 86_400_000))
    : null
  const setupUrgent =
    setupB && startsIn != null && startsIn <= 14 && coveragePercent(setupB) < 50
      ? { startsInDays: startsIn }
      : null

  if (!setupB && !liveB && !closedB) {
    return (
      <p className="rounded-lg border border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
        This account has no term with course offerings in the last, current, or upcoming window right now.
      </p>
    )
  }

  return (
    <div className="grid grid-cols-1 items-start gap-5 xl:grid-cols-3">
      {upcoming && setupB && (
        <CaseCard
          label="Case: mostly setup"
          term={upcoming}
          breakdown={setupB}
          badge={{ label: 'Upcoming', tone: 'info' }}
          hideLiveAndClosed
          setupUrgent={setupUrgent}
        />
      )}
      {current && liveB && (
        <CaseCard
          label="Case: live, with courses at risk before close"
          term={current}
          breakdown={liveB}
          badge={{ label: 'Current', tone: 'success' }}
        />
      )}
      {last && closedB && (
        <CaseCard
          label="Case: mostly closed"
          term={last}
          breakdown={closedB}
          badge={{ label: 'Last term', tone: 'neutral' }}
          needsAttention={closedB.notConfiguredCount + closedB.draft.length + closedB.scheduled.length > 0}
        />
      )}
    </div>
  )
}
