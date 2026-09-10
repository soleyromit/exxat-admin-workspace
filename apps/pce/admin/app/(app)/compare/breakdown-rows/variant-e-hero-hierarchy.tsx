'use client'

// ============================================================================
// Breakdown row-list — VARIANT E: HERO HIERARCHY (compare route, throwaway).
//
// Round 1 (variants A–D) was structurally differentiated but typographically
// flat: near-everything sat at text-xs and every state icon was a 17–24px
// afterthought, so nothing led the eye. This variant keeps A's state-glyph
// rail and B's "promote the number" instinct and rebuilds them on a real
// four-tier scale — HERO number, semibold group headings, text-sm row titles
// with 32/40px state medallions (the "illustration", DS FA glyphs only — the
// DS ships no EmptyState/illustration component), and a deliberately quiet
// META tier for chips and countdowns.
// Hero scale checked against the DS's own `MetricItem metricVariant="hero"`:
// localhost:4000 was unreachable, so read the compiled source at
// node_modules/@exxatdesignux/ui/dist/components/ui/key-metrics.js —
// `keyMetricsSizeClasses('md','strip').valueHero` = "text-2xl sm:text-3xl",
// applied with "font-bold tabular-nums leading-none text-foreground" (l.2539)
// and a "text-sm ... font-medium" muted label (l.2503). Those exact classes
// are used below rather than an invented scale. The single hero bar reuses
// `MetricMiniBar`'s anatomy (l.1756: h-1.5 w-full rounded-full bg-muted).
// Everything the ten prior passes settled is untouched: flat warning wash on
// genuinely urgent rows only (no border/shadow/radius sub-cards), ghost-Button
// RowAction + overflow menu, CourseChips naming courses, sentence case, amber
// family only, and NO per-row bars or charts.
// ============================================================================

import { useMemo } from 'react'
import Link from 'next/link'
import {
  Badge, Button, StatusBadge,
  Card, CardContent, CardFooter, CardHeader, CardTitle,
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
  LIST_HUB_STATUS_TINT_NEUTRAL,
  LIST_HUB_STATUS_TINT_COMPLETED,
  type StatusTint,
} from '@/lib/list-status-badges'
import {
  classifyTermWindow, breakdownFor, breakdownSummary, evalWindow, parseDate,
  completionColor, weightedRate, RESPONSE_TARGET,
  coveragePercent, isFullyCovered, coverageLead, coverageDetail, coverageCodes,
  coverageUrgentConsequence,
  scheduledLead, scheduledDetail, scheduledCountdown,
  liveLead, liveNarrative, liveCountdown, liveAtRiskCodes, liveUrgentConsequence,
  closedNarrative, courseRates,
  type CourseBreakdown, type TermWindowPosition,
} from '@/lib/pce-term-metrics'
import type { ProgramTerm, PceSurvey } from '@/lib/pce-mock-data'

/* ── TIER 1 · HERO ───────────────────────────────────────────────────────────
   One number per card, at the DS's own hero-metric scale. Which number is
   never a style choice: if the term has live evaluations, the thing that can
   still change today is the response rate; if it doesn't, the only number
   worth leading with is how much of the term is covered at all. */

/** The card's single most important figure. Type classes are lifted verbatim
 *  from the DS's `MetricCell` hero branch (see file header) so this reads at
 *  the same weight as a real `KeyMetrics` hero tile without importing the
 *  multi-tile strip, which is the wrong shape for one number inside a card
 *  body. `caption` sits below the bar as META, not beside the number, so the
 *  number keeps the whole optical line to itself at a 370px card width. */
function HeroMetric({
  label, value, caption, bar,
}: {
  label: string
  value: string
  caption: string
  bar?: React.ReactNode
}) {
  return (
    <div className="flex min-w-0 flex-col gap-2 border-b border-border/60 pb-4">
      <p className="min-w-0 text-sm font-medium leading-snug text-muted-foreground">{label}</p>
      <span className="text-2xl font-bold leading-none tabular-nums text-foreground sm:text-3xl">
        {value}
      </span>
      {bar}
      <p className="min-w-0 text-xs text-muted-foreground">{caption}</p>
    </div>
  )
}

/** The ONE bar this card is allowed, and only for the response rate — a
 *  genuinely in-flight 0→100% metric that moves while the window is open.
 *  Coverage deliberately does NOT get one: it is a checklist state, which is
 *  exactly what the standing no-progress-bar rule protects against. Anatomy
 *  copied from the DS's `MetricMiniBar`; the fill uses `completionColor`
 *  (chart-2 / brand / chip-4 amber) rather than the DS's `tone="auto"`, whose
 *  low band is `bg-destructive` — red is banned in this product's score viz. */
function HeroBar({ percent, label }: { percent: number; label: string }) {
  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={percent}
      aria-label={`${label} ${percent} percent`}
      className="h-1.5 w-full overflow-hidden rounded-full bg-muted"
    >
      <div
        className="h-full rounded-full"
        style={{ width: `${percent}%`, background: completionColor(percent) }}
      />
    </div>
  )
}

/* ── TIER 2 · GROUP ──────────────────────────────────────────────────────────
   Group labels were text-xs muted — the same size as the rows they governed,
   so they read as another row rather than as the thing organising them. Now
   text-sm semibold foreground plus a count chip. Still sentence case, still no
   uppercase/tracking-wide. A `<p>` rather than a heading tag: these sit under
   a `CardTitle` inside a compare grid, and inventing an h4 here would break
   heading order for no navigational gain. */
function GroupHeading({ label, count }: { label: string; count: number }) {
  return (
    <div className="flex min-w-0 flex-wrap items-center gap-2">
      <p className="text-sm font-semibold leading-snug text-foreground">{label}</p>
      <Badge variant="secondary" className="rounded-full px-1.5 py-0 text-[11px] font-medium tabular-nums">
        {count}
      </Badge>
    </div>
  )
}

/** Spacing rhythm borrowed from variant C rather than reinvented: groups are
 *  separated by more air than the rows inside them, and the second group adds
 *  one hairline so the split survives at the tighter card width. */
function GroupSection({ first, children }: { first: boolean; children: React.ReactNode }) {
  return (
    <div className={'flex flex-col gap-2' + (first ? '' : ' border-t border-border/60 pt-5')}>
      {children}
    </div>
  )
}

/* ── TIER 3 · ROW ────────────────────────────────────────────────────────────
   Row titles move text-xs → text-sm, and the flat 12px icon becomes a real
   medallion. This is the "illustration" the brief asks for, kept inside the
   DS's own vocabulary: an FA solid glyph on a token-tinted disc, one glyph per
   lifecycle state, never custom art. */

/** 32px normally, 40px for the row that leads its group, is urgent, or is the
 *  fully-covered banner — so each group has one obvious entry point instead of
 *  a uniform column of same-size marks. Purely decorative: every row title
 *  states its own status in words, so nothing is carried by glyph or tint
 *  alone. Flat filled disc, no ring or border — a bordered disc would start
 *  the card-in-card creep this card's doctrine rules out. */
function StateMedallion({ icon, tint, big = false }: { icon: string; tint: StatusTint; big?: boolean }) {
  const px = big ? 40 : 32
  return (
    <span
      aria-hidden="true"
      className="inline-flex shrink-0 items-center justify-center rounded-full"
      style={{ width: px, height: px, background: tint.bg, color: tint.fg }}
    >
      <i className={`fa-solid ${icon}`} style={{ fontSize: big ? 16 : 13 }} />
    </span>
  )
}

/** Per-state glyph + tint. Every glyph here is already rendered somewhere in
 *  this app (term-breakdown.tsx, dashboard-cards variants), so none of them can
 *  come back as a blank box from a kit that doesn't carry the name. Closed
 *  takes the completed tint, not production's amber — finishing collection is
 *  not a warning, and amber stays reserved for genuine urgency. */
const STATE = {
  covered:   { icon: 'fa-circle-check',        tint: LIST_HUB_STATUS_TINT_SUCCESS },
  setup:     { icon: 'fa-list-check',          tint: LIST_HUB_STATUS_TINT_NEUTRAL },
  scheduled: { icon: 'fa-calendar',            tint: LIST_HUB_STATUS_TINT_PLANNED },
  live:      { icon: 'fa-circle-dot',          tint: LIST_HUB_STATUS_TINT_SUCCESS },
  closed:    { icon: 'fa-flag-checkered',      tint: LIST_HUB_STATUS_TINT_COMPLETED },
  urgent:    { icon: 'fa-triangle-exclamation', tint: LIST_HUB_STATUS_TINT_WARNING },
} as const

/** Row anatomy. Same content model and same settled constraints as
 *  `BreakdownRow`; three differences, all hierarchy:
 *    1. `StateMedallion` in the icon slot (32/40px, not 12px).
 *    2. Title at text-sm, in a `min-h-8`/`min-h-10` centred line box so a
 *       single-line title sits optically centred against its medallion and a
 *       wrapped one still starts at the right place.
 *    3. Actions ALWAYS get their own line under the content, not just on
 *       urgent rows. At the real card width this variant renders at (~370–460px)
 *       a text-sm title plus an inline ghost button squeezes the title into
 *       three wrapped lines; giving the action its own line is what lets the
 *       title tier actually breathe. `-ms-3` cancels the DS `size="sm"` button's
 *       `px-3` so the label optically aligns with the text above it.
 *  Chips and countdowns live on their own wrapping line under the title — this
 *  variant is not single-line-constrained, so nothing needs to be clipped; the
 *  meta row wraps instead (the failure mode variant D shipped last round). */
function HeroRow({
  state, title, subtitle, meta, srSummary, narrative, actions, urgent = false, lead = false,
}: {
  state: { icon: string; tint: StatusTint }
  title: string
  subtitle?: string
  meta?: React.ReactNode
  /** Full-sentence equivalent of `meta`, screen-reader only. */
  srSummary?: string
  /** Short consequence line — only present on `urgent` rows. */
  narrative?: string
  actions?: React.ReactNode
  urgent?: boolean
  /** First rendered row under a group heading — takes the larger medallion. */
  lead?: boolean
}) {
  const big = lead || urgent
  const mark = urgent ? STATE.urgent : state
  return (
    <div
      className={'flex items-start gap-3 py-2.5' + (urgent ? ' -mx-3 rounded-md border-l-2 px-3' : '')}
      style={urgent ? { background: LIST_HUB_STATUS_TINT_WARNING.bg, borderLeftColor: LIST_HUB_STATUS_TINT_WARNING.border } : undefined}
    >
      <StateMedallion icon={mark.icon} tint={mark.tint} big={big} />
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <div className={'flex min-w-0 items-center ' + (big ? 'min-h-10' : 'min-h-8')}>
          <p className="min-w-0 text-sm font-medium leading-snug text-foreground">{title}</p>
        </div>
        {subtitle && <p className="min-w-0 text-xs text-muted-foreground">{subtitle}</p>}
        {meta && (
          <>
            {meta}
            {srSummary && <span className="sr-only">{srSummary}</span>}
          </>
        )}
        {narrative && <p className="min-w-0 text-xs text-muted-foreground">{narrative}</p>}
        {actions && <div className="-ms-3 mt-0.5 flex flex-wrap items-center gap-1">{actions}</div>}
      </div>
    </div>
  )
}

/* ── TIER 4 · META — carried over unchanged, and that is the point ────────────
   Chips, countdowns and the footer distribution stay at text-[11px]/text-xs.
   With three louder tiers above them they finally read as supporting detail
   instead of as peers of the row title. */

/** Overflow trigger for a row's secondary action — pairs with exactly one
 *  visible `RowAction primary`, so there is never a "which of these two is the
 *  real action" question. */
function RowActionMenu({ items }: { items: { href: string; label: string; icon: string }[] }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label="More actions" className="shrink-0 text-muted-foreground">
          <i className="fa-light fa-ellipsis text-xs" aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
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

/** Names the specific courses a row's count refers to. Wraps rather than
 *  clips: the container is `flex-wrap` and the row's content column is
 *  `min-w-0`, so at a 370px card the pills drop to a second line instead of
 *  being cut off. Overflow past `max` collapses into a HoverCard-disclosed
 *  "+N more" so an 11-course bucket stays as tall as a 1-course one. */
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
    <div className="flex min-w-0 flex-wrap items-center gap-1">
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

/** Footer status distribution, Vanta status-page style: plain muted text,
 *  dot-separated, no bar and no segment graphic. `breakdownSummary` already
 *  composes exactly this line from the real bucket counts, so the footer can
 *  never disagree with the rows above it. Not truncated — the line wraps, since
 *  a clipped "35 tot…" is worse than a second line. */
function DistributionFooter({ b }: { b: CourseBreakdown }) {
  return (
    <CardFooter className="mt-auto">
      <p className="min-w-0 flex-1 text-xs tabular-nums text-muted-foreground">{breakdownSummary(b)}</p>
    </CardFooter>
  )
}

/* ── the row list ────────────────────────────────────────────────────────── */

function HeroHierarchyBreakdown({
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
  const scheduledCodes = b.scheduled.map((s: PceSurvey) => s.courseCode)
  const liveLeadText = liveLead(b.live)
  const liveStory = liveNarrative(b.live)
  const liveCountdownText = liveCountdown(b.live)
  const liveCodes = b.live.map((s: PceSurvey) => s.courseCode)
  const liveAtRisk = liveAtRiskCodes(b.live)
  const isLiveUrgent = liveAtRisk.size > 0
  const closedStory = closedNarrative(b.closed)
  const closedCodes = b.closed.map((s: PceSurvey) => s.courseCode)
  const workspaceHref = (tab: 'active' | 'finished') => `/course-evaluation/term/${term.id}?tab=${tab}`

  const isSetupUrgent = !!setupUrgent && !fullyCovered && setupTotal > 0

  const showCoverageRow = !fullyCovered && !!covLead
  const showScheduledRow = b.scheduled.length > 0 && !!schedLead
  const showLiveRow = !hideLiveAndClosed && b.live.length > 0 && !!liveLeadText
  const showClosedRow = !hideLiveAndClosed && b.closed.length > 0

  const setupRowCount = Number(fullyCovered) + Number(showCoverageRow) + Number(showScheduledRow)
  const collectionRowCount = Number(showLiveRow) + Number(showClosedRow)

  /* HERO SELECTION — response rate when there is anything still collecting,
     coverage otherwise. `weightedRate` is the same enrolment-weighted helper
     the dashboard KPI uses; nothing is averaged by hand here. */
  const liveRate = showLiveRow ? weightedRate(b.live) : null
  const heroIsRate = liveRate != null
  const coveredCount = b.scheduled.length + b.live.length + b.closed.length

  const hero = heroIsRate
    ? {
        label: 'Response rate',
        value: `${liveRate}%`,
        caption: `Across ${b.live.length} course${b.live.length === 1 ? '' : 's'} still collecting. Target is ${RESPONSE_TARGET}%.`,
        bar: <HeroBar percent={liveRate!} label="Response rate" />,
      }
    : {
        label: 'Evaluation coverage',
        value: `${coveragePct}%`,
        caption: `${coveredCount} of ${b.totalCourses} course${b.totalCourses === 1 ? '' : 's'} have an evaluation set up.`,
        bar: undefined,
      }

  return (
    <div className="flex min-w-0 flex-col gap-5">
      <HeroMetric label={hero.label} value={hero.value} caption={hero.caption} bar={hero.bar} />

      {setupRowCount > 0 && (
        <GroupSection first>
          <GroupHeading label="Setup" count={setupRowCount} />
          <div className="flex flex-col">
            {fullyCovered && (
              <HeroRow
                state={STATE.covered}
                lead
                title="Evaluation coverage complete"
                subtitle="Every course in this term has an evaluation set up."
              />
            )}
            {showCoverageRow && (
              <HeroRow
                state={STATE.setup}
                lead={!fullyCovered}
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
              <HeroRow
                state={STATE.scheduled}
                lead={!fullyCovered && !showCoverageRow}
                title={schedLead!}
                meta={
                  <div className="flex min-w-0 flex-wrap items-center gap-2">
                    <CourseChips codes={scheduledCodes} />
                    {schedCountdown && <RowCountdown label={schedCountdown} />}
                  </div>
                }
                srSummary={schedDetail ?? undefined}
                actions={<RowAction href={workspaceHref('active')} primary icon="fa-pen-ruler">Manage</RowAction>}
              />
            )}
          </div>
        </GroupSection>
      )}

      {collectionRowCount > 0 && (
        <GroupSection first={setupRowCount === 0}>
          <GroupHeading label="Collecting responses" count={collectionRowCount} />
          <div className="flex flex-col">
            {showLiveRow && (
              <HeroRow
                state={STATE.live}
                lead
                title={liveLeadText!}
                meta={
                  <div className="flex min-w-0 flex-wrap items-center gap-2">
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
              <HeroRow
                state={STATE.closed}
                lead={!showLiveRow}
                title={`${b.closed.length} of ${b.totalCourses} closed`}
                meta={<CourseChips codes={closedCodes} rates={courseRates(b.closed)} />}
                srSummary={closedStory ?? undefined}
                actions={<RowAction href={workspaceHref('finished')} primary icon="fa-share-from-square">Review feedback</RowAction>}
              />
            )}
          </div>
        </GroupSection>
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

function HeroCard({
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
              className="rounded-sm text-foreground underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
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
        <HeroHierarchyBreakdown
          term={term}
          breakdown={breakdown}
          hideLiveAndClosed={hideLiveAndClosed}
          setupUrgent={setupUrgent}
        />
      </CardContent>
      <DistributionFooter b={breakdown} />
    </Card>
  )
}

/* ── the three real cases ────────────────────────────────────────────────── */

/** Named from the DATA rather than from the slot, so the label above a card
 *  can never claim a case the fixture no longer demonstrates. Same function as
 *  variant A's — the comparison stays fair only if the case labelling does. */
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

function CaseBlock({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-2">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      {children}
    </div>
  )
}

export default function VariantHeroHierarchy() {
  const { surveys, programTerms } = usePce()

  /* Slot selection is copied from variant A verbatim — same ordering, same
     three windows, same one-card cap on Last. This variant redesigns the type
     scale, not which term lands where; diverging into a private scoring
     heuristic is what made variant D's data disagree with the rest last round. */
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
    <div className="grid grid-cols-1 items-start gap-5 xl:grid-cols-3">
      {upcomingTerm && upcomingB && (
        <CaseBlock label={caseLabel(upcomingB, true)}>
          <HeroCard
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
          <HeroCard term={currentTerm} position="current" breakdown={currentB} />
        </CaseBlock>
      )}
      {lastTerm && lastB && (
        <CaseBlock label={caseLabel(lastB, false)}>
          <HeroCard term={lastTerm} position="last" breakdown={lastB} />
        </CaseBlock>
      )}
    </div>
  )
}
