'use client'

// ============================================================================
// Variant B — WIDGET-DENSE term-card triptych (compare route only).
//
// Direction: compliance-dashboard anatomy (Vanta control cards, HubSpot goal
// cards, Okta status widgets). Every block inside a card is a self-contained
// MODULE with the same three-part grammar:
//
//     icon + label header      ← what this module is about
//     BOLD LEADING NUMBER      ← the one figure that answers it
//     muted footer counts      ← "7 of 10 evaluated · target 70%", never prose
//
// Modules are real DS `CardSection subdued` bands (top hairline, card-aligned
// inset, collapsed gap) rather than hand-rolled bordered boxes — the DS
// already ships the "band inside a card" primitive this direction needs.
//
// What this variant deliberately does NOT copy from Vanta: a thin progress
// bar under every number. Per `progress-bars-last-resort`, a bar belongs only
// on a genuine 0→100% in-flight metric. Exactly one qualifies here — the
// current term's response rate racing toward the 70% target (the product's #1
// goal metric per Vishal, transcript 7a175890) — so exactly one bar renders,
// on the current card, and nowhere else. Coverage %, readiness %, and every
// bucket count are checklist-shaped facts and stay bar-free.
//
// Reused, not reinvented:
//   - Term selection: identical `classifyTermWindow` logic to dashboard-home
//     (Last capped to one, Current the 1.35fr hero track, explicit grid-column
//     lines so a single-card account can't get auto-placed into track 1).
//   - All math: `snapshot`, `breakdownFor`, `coveragePercent`, `completionColor`,
//     `liveAtRiskCodes`, `courseRates`, `liveCountdown`, `scheduledCountdown`,
//     `coverageUrgentConsequence`, `liveUrgentConsequence`, `breakdownSummary`.
//   - Row actions: `RowAction` from term-breakdown.tsx — the DS ghost Button
//     treatment settled after eleven rounds of feedback (plain links read as
//     content; outline/default Buttons "ask for too much attention").
//
// Color: no red anywhere (aarti_no_red). Below-target / at-risk / imminent use
// `LIST_HUB_STATUS_TINT_WARNING` + `completionColor`'s `--chip-4` amber.
// ============================================================================

import { useMemo, useState } from 'react'
import Link from 'next/link'
import {
  Badge,
  Button,
  Card, CardAction, CardContent, CardFooter, CardHeader, CardSection, CardTitle,
  HoverCard, HoverCardContent, HoverCardTrigger,
  StatusBadge, Tip,
} from '@exxatdesignux/ui'
import type { StatusBadgeTone } from '@exxatdesignux/ui'

import { usePce } from '@/components/pce/pce-state'
import { AddTermDatesDrawer } from '@/components/pce/add-term-drawer'
import { RowAction } from '@/components/pce/term-breakdown'
import { ResponseProgressCell } from '@/components/pce/response-gauge'
import { LIST_HUB_STATUS_TINT_WARNING } from '@/lib/list-status-badges'
import { auditTerm } from '@/lib/pce-term-readiness'
import { prismCoursesHref } from '@/lib/pce-course-readiness'
import {
  RESPONSE_TARGET,
  classifyTermWindow, snapshot, breakdownFor, evalWindow, parseDate,
  coveragePercent, isFullyCovered, coverageCodes, coverageUrgentConsequence,
  liveAtRiskCodes, liveUrgentConsequence, liveCountdown, courseRates,
  scheduledCountdown, breakdownSummary, completionColor,
  type TermSnapshot, type CourseBreakdown,
} from '@/lib/pce-term-metrics'
import type { ProgramTerm } from '@/lib/pce-mock-data'

/* ── formatting ───────────────────────────────────────────────────────────── */

const fmtDate = (d: string) =>
  parseDate(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

const fmtRange = (a: string, b: string) => {
  const sameYear = parseDate(a).getFullYear() === parseDate(b).getFullYear()
  const start = sameYear ? fmtDate(a).replace(/, \d{4}$/, '') : fmtDate(a)
  return `${start} – ${fmtDate(b)}`
}

const noYear = (d: string) => d.replace(/, \d{4}$/, '')

/** Courses with an evaluation of any post-draft kind — coveragePercent's own
 *  numerator (scheduled + live + closed), surfaced as a count for the footer
 *  lines so the % and the ratio can never disagree. */
const evaluatedCount = (b: CourseBreakdown) => b.scheduled.length + b.live.length + b.closed.length

/* ── widget primitives ────────────────────────────────────────────────────── */

/** Module header — small icon + label, optional trailing status chip. Sentence
 *  case, NOT uppercase/tracking-wide (banned "Claude tell"); the icon is what
 *  makes it read as a widget header instead of another body line. */
function ModuleHead({
  icon, label, trailing,
}: {
  icon: string
  label: string
  trailing?: React.ReactNode
}) {
  return (
    <div className="flex min-w-0 items-center gap-1.5">
      <i className={`fa-light ${icon} shrink-0 text-muted-foreground`} aria-hidden="true" style={{ fontSize: 12 }} />
      <span className="min-w-0 truncate text-xs font-medium text-muted-foreground">{label}</span>
      {trailing && <span className="ms-auto shrink-0">{trailing}</span>}
    </div>
  )
}

/** The module's visual anchor. Size is the hierarchy signal: `hero` on the
 *  wide current card's response rate, `lg` on a side card's headline metric,
 *  `sm` inside an n-up stat strip. */
function BigNumber({
  value, unit, color, size = 'lg',
}: {
  value: string | number
  unit?: string
  color?: string
  size?: 'hero' | 'lg' | 'sm'
}) {
  const scale = size === 'hero' ? 'text-4xl' : size === 'lg' ? 'text-3xl' : 'text-xl'
  return (
    <p
      className={`flex items-baseline gap-0.5 font-semibold leading-none tracking-tight tabular-nums ${scale}`}
      style={{ color: color ?? 'var(--foreground)' }}
    >
      {value}
      {unit && <span className="text-base font-medium">{unit}</span>}
    </p>
  )
}

/** Muted footer counts — terse middot-joined fragments ("7 of 10 evaluated ·
 *  target 70%"), never a full sentence. */
function FootCounts({ children }: { children: React.ReactNode }) {
  return <p className="text-xs tabular-nums text-muted-foreground">{children}</p>
}

/** One cell of an n-up stat strip. Hairline cell borders (no grid surface,
 *  no boxes) — the flat-band KPI treatment, scaled down to card width. */
function StatCell({
  label, value, unit, caption, color, first, hint,
}: {
  label: string
  value: string | number
  unit?: string
  caption?: string
  color?: string
  first?: boolean
  /** Optional Tip on the label — used where the number's math isn't obvious. */
  hint?: string
}) {
  const labelNode = (
    <span className="text-xs text-muted-foreground">{label}</span>
  )
  return (
    <div className={`flex min-w-0 flex-col gap-1.5 ${first ? 'pe-3' : 'border-s border-border/60 ps-3'}`}>
      {hint ? (
        <Tip label={hint} side="top">
          <span
            tabIndex={0}
            className="w-fit rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {labelNode}
          </span>
        </Tip>
      ) : (
        labelNode
      )}
      <BigNumber value={value} unit={unit} color={color} size="sm" />
      {caption && <span className="truncate text-xs tabular-nums text-muted-foreground">{caption}</span>}
    </div>
  )
}

/** Named courses behind a count — up to `max` inline, the rest behind a
 *  HoverCard so an 11-course bucket stays exactly as tall as a 1-course one.
 *  At-risk codes carry the reserved warning tint (never red). */
function CodeChips({
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
          className="rounded-full px-2 py-0 text-xs font-medium tabular-nums"
          style={
            atRisk?.has(code)
              ? {
                  color: LIST_HUB_STATUS_TINT_WARNING.fg,
                  background: LIST_HUB_STATUS_TINT_WARNING.bg,
                  borderColor: LIST_HUB_STATUS_TINT_WARNING.border,
                }
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
              className="cursor-default rounded-full border-dashed px-2 py-0 text-xs font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              style={{ color: 'var(--primary)' }}
            >
              +{hidden.length} more
            </Badge>
          </HoverCardTrigger>
          <HoverCardContent align="start" className="w-auto max-w-64 p-2">
            <div className="flex flex-wrap gap-1">
              {hidden.map((code) => (
                <Badge key={code} variant="outline" className="rounded-full px-2 py-0 text-xs font-medium tabular-nums">
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

/** Date fact as its own chip — icon + tabular text, matching the countdown
 *  anatomy already established across this product. */
function Countdown({ label, urgent = false }: { label: string; urgent?: boolean }) {
  return (
    <span
      className="inline-flex shrink-0 items-center gap-1 text-xs font-medium tabular-nums"
      style={{ color: urgent ? LIST_HUB_STATUS_TINT_WARNING.fg : 'var(--muted-foreground)' }}
    >
      <i className="fa-light fa-clock" aria-hidden="true" style={{ fontSize: 11 }} />
      {label}
    </span>
  )
}

/** Ledger row — the widget-dense answer to a status-bucket list. The COUNT is
 *  the leading element in its own fixed-width gutter, so a column of rows
 *  scans as a column of numbers first and labels second; the label, named
 *  courses, and single action trail it. `urgent` gets the reserved warning
 *  wash + left accent + a consequence line — a flat wash, never a
 *  border/shadow/radius card-in-card. */
function LedgerRow({
  count, label, chips, countdown, note, action, urgent = false, accent,
}: {
  count: number
  label: string
  chips?: React.ReactNode
  countdown?: string | null
  note?: string | null
  action?: React.ReactNode
  urgent?: boolean
  /** Number color — defaults to foreground; warning fg on urgent rows. */
  accent?: string
}) {
  return (
    <div
      className={
        'flex items-start gap-3 border-t border-border/60 py-2 first:border-t-0' +
        (urgent ? ' -mx-2 mt-0.5 rounded-md border-t-0 border-l-2 px-2' : '')
      }
      style={
        urgent
          ? { background: LIST_HUB_STATUS_TINT_WARNING.bg, borderLeftColor: LIST_HUB_STATUS_TINT_WARNING.border }
          : undefined
      }
    >
      <span
        className="w-7 shrink-0 text-lg font-semibold leading-6 tabular-nums"
        style={{ color: accent ?? (urgent ? LIST_HUB_STATUS_TINT_WARNING.fg : 'var(--foreground)') }}
      >
        {count}
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex min-w-0 items-center gap-2">
          <p className="min-w-0 text-xs font-medium text-foreground">{label}</p>
          {countdown && <Countdown label={countdown} urgent={urgent} />}
          {action && <span className="ms-auto -my-1 shrink-0">{action}</span>}
        </div>
        {chips}
        {note && <p className="text-xs text-muted-foreground">{note}</p>}
      </div>
    </div>
  )
}

/** Checklist row — icon + label left, value right, with a state glyph. Used
 *  for the upcoming card's setup checklist, where the facts are settings
 *  rather than counts and a big number would be dishonest. */
function CheckRow({
  label, value, state,
}: {
  label: string
  value: string
  state: 'ok' | 'todo' | 'warn'
}) {
  const glyph =
    state === 'ok' ? 'fa-circle-check' : state === 'warn' ? 'fa-triangle-exclamation' : 'fa-circle-dashed'
  const color =
    state === 'ok'
      ? 'var(--chart-2)'
      : state === 'warn'
        ? LIST_HUB_STATUS_TINT_WARNING.fg
        : 'var(--muted-foreground)'
  return (
    <div className="flex items-center gap-2 border-t border-border/60 py-1.5 first:border-t-0">
      <i className={`fa-light ${glyph} shrink-0`} aria-hidden="true" style={{ color, fontSize: 12 }} />
      <span className="min-w-0 truncate text-xs text-muted-foreground">{label}</span>
      <span className="ms-auto shrink-0 text-xs font-medium tabular-nums text-foreground">{value}</span>
    </div>
  )
}

/** Empty state, widget register — left-aligned icon + two lines + one control,
 *  matched to the density of the modules it replaces (never the banned
 *  centered `py-20` column). */
function EmptyModule({
  icon, title, body, action,
}: {
  icon: string
  title: string
  body: string
  action: React.ReactNode
}) {
  return (
    <CardContent className="flex flex-col gap-2.5">
      <div className="flex items-start gap-2.5">
        <i className={`fa-light ${icon} mt-0.5 shrink-0 text-muted-foreground`} aria-hidden="true" style={{ fontSize: 14 }} />
        <div className="flex min-w-0 flex-col gap-0.5">
          <p className="text-sm font-medium text-foreground">{title}</p>
          <p className="text-xs text-muted-foreground">{body}</p>
        </div>
      </div>
      <div className="ps-6">{action}</div>
    </CardContent>
  )
}

/* ── card chrome shared by all three ──────────────────────────────────────── */

const POSITION_BADGE: Record<'last' | 'current' | 'upcoming', { label: string; tone: StatusBadgeTone }> = {
  last:     { label: 'Last term', tone: 'neutral' },
  current:  { label: 'Current',   tone: 'success' },
  upcoming: { label: 'Upcoming',  tone: 'info' },
}

function WidgetCardHeader({
  term, position, meta, countdown,
}: {
  term: ProgramTerm
  position: 'last' | 'current' | 'upcoming'
  meta: string
  countdown?: React.ReactNode
}) {
  const badge = POSITION_BADGE[position]
  return (
    <CardHeader>
      <CardTitle className="min-w-0 truncate text-base font-semibold">
        <Link
          href={`/course-evaluation/term/${term.id}`}
          aria-label={`Open ${term.name} workspace`}
          className="rounded-sm text-foreground hover:underline underline-offset-2 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          {term.name}
        </Link>
      </CardTitle>
      <p className="text-xs text-muted-foreground">{meta}</p>
      <CardAction className="flex flex-col items-end gap-1.5">
        <StatusBadge label={badge.label} tone={badge.tone} />
        {countdown}
      </CardAction>
    </CardHeader>
  )
}

/** Footer — bucket summary (clipped, never wraps) + one destination link. */
function WidgetCardFooter({
  summary, href, label, ariaLabel,
}: {
  summary: string | null
  href: string
  label: string
  ariaLabel: string
}) {
  return (
    <CardFooter className="mt-auto gap-2">
      {summary && <p className="min-w-0 flex-1 truncate text-xs tabular-nums text-muted-foreground">{summary}</p>}
      <Link
        href={href}
        aria-label={ariaLabel}
        className="ms-auto flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-sm text-sm font-medium text-foreground hover:underline underline-offset-2 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        {label}
        <i className="fa-light fa-arrow-right text-xs" aria-hidden="true" />
      </Link>
    </CardFooter>
  )
}

/* Shared empty branches — identical decision tree to production
 * (dashboard-home.tsx Cases 2/3), re-skinned into the widget register. */
function NoCoursesModule() {
  return (
    <EmptyModule
      icon="fa-layer-group"
      title="No courses found"
      body="Add courses to start scheduling evaluations."
      action={
        <Button variant="outline" size="sm" asChild>
          <a href={prismCoursesHref()} target="_blank" rel="noopener noreferrer">Add courses</a>
        </Button>
      }
    />
  )
}

function NoEvaluationsModule({ term, total }: { term: ProgramTerm; total: number }) {
  return (
    <EmptyModule
      icon="fa-square-poll-vertical"
      title={`${total} course${total === 1 ? '' : 's'} ready for evaluation`}
      body="Schedule evaluations to start collecting responses."
      action={
        <Button variant="outline" size="sm" asChild>
          <Link href={`/surveys/push?term=${term.id}`}>Schedule evaluations</Link>
        </Button>
      }
    />
  )
}

/* ── LAST TERM — retrospective widget stack ───────────────────────────────── */

function LastWidgetCard({ snap, breakdown }: { snap: TermSnapshot; breakdown: CourseBreakdown | null }) {
  const { term } = snap
  const win = evalWindow(term)
  const meta = `AY ${term.academicYear.replace(/–20(\d\d)$/, '–$1')} · Closed ${win.close}`
  const noCourses = (snap.coverage?.total ?? 0) === 0
  const noEvaluations = !noCourses && snap.total === 0

  const b = breakdown
  const setupCount = b ? b.notConfiguredCount + b.draft.length : 0
  const outstanding = b ? setupCount + b.scheduled.length : 0
  const rateColor = snap.rate != null ? completionColor(snap.rate) : undefined

  return (
    <Card>
      <WidgetCardHeader term={term} position="last" meta={meta} />

      {noCourses ? (
        <NoCoursesModule />
      ) : noEvaluations ? (
        <NoEvaluationsModule term={term} total={snap.coverage?.total ?? 0} />
      ) : b ? (
        <>
          {/* Module 1 — how the finished cycle landed. Bar-free on purpose:
              a closed term's rate is a settled outcome, not an in-flight
              metric racing to a target. */}
          <CardContent className="flex flex-col gap-2">
            <ModuleHead
              icon="fa-chart-simple"
              label="Final response rate"
              trailing={
                snap.rate != null ? (
                  <StatusBadge
                    label={snap.rate >= RESPONSE_TARGET ? 'Met target' : 'Under target'}
                    tone={snap.rate >= RESPONSE_TARGET ? 'success' : 'warning'}
                  />
                ) : undefined
              }
            />
            {snap.rate != null ? (
              <>
                <BigNumber value={snap.rate} unit="%" color={rateColor} size="lg" />
                <FootCounts>
                  {b.closed.length} of {b.totalCourses} closed · target {RESPONSE_TARGET}%
                  {snap.rate < RESPONSE_TARGET && ` · ${RESPONSE_TARGET - snap.rate} pts short`}
                </FootCounts>
              </>
            ) : (
              <>
                <BigNumber value="—" size="lg" color="var(--muted-foreground)" />
                <FootCounts>No responses recorded for this term</FootCounts>
              </>
            )}
          </CardContent>

          {/* Module 2 — two-cell close-out strip. Distinct facts from module 1
              (share of courses evaluated at all vs. how they responded), so
              this isn't the same ratio restated in a second place. */}
          <CardSection subdued className="flex flex-col gap-2">
            <ModuleHead icon="fa-list-check" label="Cycle close-out" />
            <div className="grid grid-cols-2">
              <StatCell
                first
                label="Coverage"
                value={coveragePercent(b)}
                unit="%"
                caption={`${evaluatedCount(b)} of ${b.totalCourses} evaluated`}
                hint="Scheduled + live + closed courses, over the term's total courses."
              />
              <StatCell
                label="Outstanding"
                value={outstanding}
                caption={outstanding === 0 ? 'Nothing left open' : 'Courses still open'}
                color={outstanding > 0 ? LIST_HUB_STATUS_TINT_WARNING.fg : 'var(--chart-2)'}
              />
            </div>
          </CardSection>

          {/* Module 3 — only when the finished term genuinely left something
              behind (Cases 4–6). Once only Live/Closed remain there's nothing
              to chase, and the module doesn't render at all. */}
          {outstanding > 0 && (
            <CardSection subdued className="flex flex-col gap-2">
              <ModuleHead
                icon="fa-triangle-exclamation"
                label="Still open after close"
                trailing={<StatusBadge label="Needs attention" tone="warning" />}
              />
              <div className="flex flex-col">
                {setupCount > 0 && (
                  <LedgerRow
                    count={setupCount}
                    label="Never sent"
                    accent={LIST_HUB_STATUS_TINT_WARNING.fg}
                    chips={<CodeChips codes={coverageCodes(b.notConfiguredCodes, b.draft)} />}
                    action={
                      <RowAction href={`/surveys/push?term=${term.id}`} primary icon="fa-plus">
                        {setupCount === 1 ? 'Set up evaluation' : 'Set up evaluations'}
                      </RowAction>
                    }
                  />
                )}
                {b.scheduled.length > 0 && (
                  <LedgerRow
                    count={b.scheduled.length}
                    label="Scheduled but never opened"
                    accent={LIST_HUB_STATUS_TINT_WARNING.fg}
                    chips={<CodeChips codes={b.scheduled.map((s) => s.courseCode)} />}
                    action={
                      <RowAction href={`/course-evaluation/term/${term.id}?tab=active`} primary icon="fa-pen-ruler">
                        Manage
                      </RowAction>
                    }
                  />
                )}
              </div>
            </CardSection>
          )}

          {/* Module 4 — the retrospective's actual destination. */}
          {b.closed.length > 0 && (
            <CardSection subdued className="flex flex-col gap-2">
              <ModuleHead icon="fa-flag-checkered" label="Results" />
              <LedgerRow
                count={b.closed.length}
                label="Finished collecting"
                chips={<CodeChips codes={b.closed.map((s) => s.courseCode)} rates={courseRates(b.closed)} />}
                action={
                  <RowAction href={`/course-evaluation/term/${term.id}?tab=finished`} primary icon="fa-share-from-square">
                    Review feedback
                  </RowAction>
                }
              />
            </CardSection>
          )}
        </>
      ) : null}

      {/* Last term's real next step is the results, not the operational
          workspace — routes to Analytics, distinct from Current's "View
          details" (Romit's catch: identical footer label/destination on
          every card read as one generic action rather than three distinct
          next steps). */}
      <WidgetCardFooter
        summary={b ? breakdownSummary(b) : null}
        href={`/analytics?tab=term&term=${encodeURIComponent(term.name)}`}
        label="View analytics"
        ariaLabel={`View analytics — ${term.name}`}
      />
    </Card>
  )
}

/* ── CURRENT TERM — the hero widget stack ─────────────────────────────────── */

function CurrentWidgetCard({
  snap, breakdown, noTemplates = false,
}: {
  snap: TermSnapshot
  breakdown: CourseBreakdown | null
  noTemplates?: boolean
}) {
  const { term } = snap
  const win = evalWindow(term)
  const meta = `AY ${term.academicYear.replace(/–20(\d\d)$/, '–$1')} · Eval window ${noYear(win.open)} – ${win.close}`
  const noCourses = (snap.coverage?.total ?? 0) === 0
  const noEvaluations = !noCourses && snap.total === 0
  const urgent = snap.daysLeft != null && snap.daysLeft <= 7

  const b = breakdown
  const setupCount = b ? b.notConfiguredCount + b.draft.length : 0
  const atRisk = b ? liveAtRiskCodes(b.live) : new Set<string>()
  const liveUrgent = atRisk.size > 0
  const rateColor = snap.rate != null ? completionColor(snap.rate) : undefined

  type StatCellSpec = {
    label: string
    value: string | number
    unit?: string
    caption?: string
    color?: string
    hint?: string
  }
  const cells: StatCellSpec[] = b
    ? [
        {
          label: 'Coverage',
          value: coveragePercent(b),
          unit: '%',
          caption: `${evaluatedCount(b)} of ${b.totalCourses} set up`,
          hint: 'Scheduled + live + closed courses, over the term’s total courses.',
        },
        ...(snap.daysLeft != null
          ? [{
              label: 'Days left',
              value: snap.daysLeft,
              caption: `Closes ${noYear(win.close)}`,
              color: urgent ? LIST_HUB_STATUS_TINT_WARNING.fg : undefined,
            }]
          : []),
        { label: 'Courses', value: b.totalCourses, caption: 'In this term' },
      ]
    : []

  return (
    <Card>
      <WidgetCardHeader
        term={term}
        position="current"
        meta={meta}
        countdown={
          snap.daysLeft != null ? (
            <Countdown label={`${snap.daysLeft} ${snap.daysLeft === 1 ? 'day' : 'days'} left`} urgent={urgent} />
          ) : undefined
        }
      />

      {noTemplates ? (
        <EmptyModule
          icon="fa-file-lines"
          title="No survey templates yet"
          body="A template defines what evaluations ask. It's the first step before anything can be sent."
          action={
            <Button variant="outline" size="sm" asChild>
              <Link href="/templates/new">Create template</Link>
            </Button>
          }
        />
      ) : noCourses ? (
        <NoCoursesModule />
      ) : noEvaluations ? (
        <NoEvaluationsModule term={term} total={snap.coverage?.total ?? 0} />
      ) : (
        <>
          {/* Module 1 — the goal widget. The one legitimate 0→100% in-flight
              metric on this whole triptych, so the one place a bar earns its
              place. Number is the anchor at hero scale; the bar is evidence
              beneath it, not the headline. */}
          {snap.rate != null && (
            <CardContent className="flex flex-col gap-2">
              <ModuleHead
                icon="fa-bullseye"
                label={`Response rate · target ${RESPONSE_TARGET}%`}
                trailing={
                  <StatusBadge
                    label={snap.rate >= RESPONSE_TARGET ? 'On target' : 'Below target'}
                    tone={snap.rate >= RESPONSE_TARGET ? 'success' : 'warning'}
                  />
                }
              />
              <BigNumber value={snap.rate} unit="%" color={rateColor} size="hero" />
              <ResponseProgressCell
                rate={snap.rate}
                responseCount={0}
                enrollmentCount={0}
                target={RESPONSE_TARGET}
                detail="none"
                className="w-full max-w-none"
              />
              <FootCounts>
                {b ? `${b.live.length} of ${b.totalCourses} collecting` : `${snap.live} collecting`}
                {snap.rate < RESPONSE_TARGET
                  ? ` · ${RESPONSE_TARGET - snap.rate} pts to target`
                  : ' · target met'}
              </FootCounts>
            </CardContent>
          )}

          {b && (
            <>
              {/* Module 2 — term-level stat strip. Deliberately excludes the
                  per-bucket counts, which the ledger below owns; these three
                  appear nowhere else on the card. */}
              <CardSection subdued className="flex flex-col gap-2">
                <ModuleHead icon="fa-gauge-high" label="Cycle status" />
                <div className={`grid ${cells.length === 3 ? 'grid-cols-3' : 'grid-cols-2'}`}>
                  {cells.map((c, i) => (
                    <StatCell
                      key={c.label}
                      first={i === 0}
                      label={c.label}
                      value={c.value}
                      unit={c.unit}
                      caption={c.caption}
                      color={c.color}
                      hint={c.hint}
                    />
                  ))}
                </div>
              </CardSection>

              {/* Module 3 — the work ledger. Count-first rows, one action
                  each, named courses inline. Only the live-with-at-risk row
                  can escalate to the reserved wash; everything else stays
                  flat, so density tracks priority rather than row type. */}
              <CardSection subdued className="flex flex-col gap-2">
                <ModuleHead
                  icon="fa-list-ul"
                  label="Course ledger"
                  trailing={
                    liveUrgent ? (
                      <StatusBadge label={`${atRisk.size} behind`} tone="warning" />
                    ) : undefined
                  }
                />
                <div className="flex flex-col">
                  {setupCount > 0 && (
                    <LedgerRow
                      count={setupCount}
                      label="Need setup"
                      chips={<CodeChips codes={coverageCodes(b.notConfiguredCodes, b.draft)} />}
                      action={
                        <RowAction href={`/surveys/push?term=${term.id}`} primary icon="fa-plus">
                          {setupCount === 1 ? 'Set up evaluation' : 'Set up evaluations'}
                        </RowAction>
                      }
                    />
                  )}
                  {b.scheduled.length > 0 && (
                    <LedgerRow
                      count={b.scheduled.length}
                      label="Scheduled"
                      countdown={scheduledCountdown(b.scheduled)}
                      chips={<CodeChips codes={b.scheduled.map((s) => s.courseCode)} />}
                      action={
                        <RowAction href={`/course-evaluation/term/${term.id}?tab=active`} primary icon="fa-pen-ruler">
                          Manage
                        </RowAction>
                      }
                    />
                  )}
                  {b.live.length > 0 && (
                    <LedgerRow
                      count={b.live.length}
                      label="Collecting"
                      countdown={liveCountdown(b.live)}
                      urgent={liveUrgent}
                      note={liveUrgent ? liveUrgentConsequence(b.live) : null}
                      chips={
                        <CodeChips
                          codes={b.live.map((s) => s.courseCode)}
                          rates={courseRates(b.live)}
                          atRisk={atRisk}
                        />
                      }
                      action={
                        <RowAction href={`/surveys/remind?from=term:${term.id}`} primary icon="fa-bell">
                          Remind
                        </RowAction>
                      }
                    />
                  )}
                  {b.closed.length > 0 && (
                    <LedgerRow
                      count={b.closed.length}
                      label="Closed"
                      chips={<CodeChips codes={b.closed.map((s) => s.courseCode)} rates={courseRates(b.closed)} />}
                      action={
                        <RowAction href={`/course-evaluation/term/${term.id}?tab=finished`} primary icon="fa-share-from-square">
                          Review feedback
                        </RowAction>
                      }
                    />
                  )}
                </div>
              </CardSection>
            </>
          )}
        </>
      )}

      <WidgetCardFooter
        summary={b ? breakdownSummary(b) : null}
        href={`/course-evaluation/term/${term.id}`}
        label="View details"
        ariaLabel={`Open ${term.name} workspace`}
      />
    </Card>
  )
}

/* ── UPCOMING TERM — readiness widget stack ───────────────────────────────── */

function UpcomingWidgetCard({ snap, breakdown }: { snap: TermSnapshot; breakdown: CourseBreakdown | null }) {
  const { term } = snap
  const [datesOpen, setDatesOpen] = useState(false)

  const dated = !!term.startDate && !!term.endDate
  const noCourses = dated && (snap.coverage?.total ?? 0) === 0
  const noEvaluations = dated && !noCourses && snap.total === 0
  const readiness = auditTerm(term.id)
  const win = evalWindow(term)
  const meta = `AY ${term.academicYear.replace(/–20(\d\d)$/, '–$1')}`
  const startsIn = dated
    ? Math.max(0, Math.ceil((parseDate(term.startDate).getTime() - Date.now()) / 86_400_000))
    : null

  const b = breakdown
  const coveragePct = b ? coveragePercent(b) : 0
  const setupCount = b ? b.notConfiguredCount + b.draft.length : 0
  const fullyCovered = b ? isFullyCovered(b) : false
  const remaining = snap.coverage ? snap.coverage.total - snap.coverage.surveyed : 0
  const noSetup = (snap.coverage?.surveyed ?? snap.total) === 0
  /* Same compound trigger as production: imminent start AND low coverage —
     not "any upcoming term with work left", which is every upcoming term. */
  const setupUrgent = startsIn != null && startsIn <= 14 && !!b && coveragePct < 50

  return (
    <Card>
      <WidgetCardHeader
        term={term}
        position="upcoming"
        meta={meta}
        countdown={
          startsIn != null ? (
            <Countdown
              label={`Starts in ${startsIn} ${startsIn === 1 ? 'day' : 'days'}`}
              urgent={startsIn <= 14}
            />
          ) : undefined
        }
      />

      {!dated ? (
        <EmptyModule
          icon="fa-calendar-plus"
          title="Add term dates"
          body="Set start and end dates to derive the evaluation window."
          action={
            <Button variant="outline" size="sm" onClick={() => setDatesOpen(true)}>
              Add term dates
            </Button>
          }
        />
      ) : noCourses ? (
        <NoCoursesModule />
      ) : noEvaluations ? (
        <NoEvaluationsModule term={term} total={snap.coverage?.total ?? 0} />
      ) : b ? (
        <>
          {/* Module 1 — readiness is this card's headline number. Checklist
              math, so no bar (that distinction is the whole point of the
              progress-bar rule). */}
          <CardContent className="flex flex-col gap-2">
            <ModuleHead
              icon="fa-clipboard-check"
              label="Readiness"
              trailing={
                <StatusBadge
                  label={fullyCovered ? 'Ready to send' : 'In setup'}
                  tone={fullyCovered ? 'success' : setupUrgent ? 'warning' : 'info'}
                />
              }
            />
            <BigNumber
              value={coveragePct}
              unit="%"
              size="lg"
              color={setupUrgent ? LIST_HUB_STATUS_TINT_WARNING.fg : undefined}
            />
            <FootCounts>
              {evaluatedCount(b)} of {b.totalCourses} courses have an evaluation
            </FootCounts>
          </CardContent>

          {/* Module 2 — settings checklist. These are configuration facts,
              not counts, so they get a glyph + value treatment instead of a
              fake leading number. */}
          <CardSection subdued className="flex flex-col gap-2">
            <ModuleHead icon="fa-sliders" label="Term setup" />
            <div className="flex flex-col">
              <CheckRow
                label="Term dates"
                value={fmtRange(term.startDate, term.endDate)}
                state="ok"
              />
              <CheckRow
                label="Survey window"
                value={noSetup ? 'Not set yet' : `${noYear(win.open)} – ${win.close}`}
                state={noSetup ? 'todo' : 'ok'}
              />
              <CheckRow
                label="Course data"
                value={
                  readiness.needsData > 0
                    ? `${readiness.needsData} need${readiness.needsData === 1 ? 's' : ''} info`
                    : 'Complete'
                }
                state={readiness.needsData > 0 ? 'warn' : 'ok'}
              />
            </div>
          </CardSection>

          {/* Module 3 — the prep queue. Live/Closed are logically impossible
              before the term starts and stay hidden regardless of data. */}
          {(setupCount > 0 || b.scheduled.length > 0 || readiness.needsData > 0) && (
            <CardSection subdued className="flex flex-col gap-2">
              <ModuleHead icon="fa-list-ul" label="Prep queue" />
              <div className="flex flex-col">
                {readiness.needsData > 0 && (
                  <LedgerRow
                    count={readiness.needsData}
                    label="Missing faculty or student rosters"
                    accent={LIST_HUB_STATUS_TINT_WARNING.fg}
                    action={
                      <RowAction href="/course-evaluation/term-setup?phase=readiness" primary icon="fa-circle-plus">
                        Add missing info
                      </RowAction>
                    }
                  />
                )}
                {setupCount > 0 && (
                  <LedgerRow
                    count={setupCount}
                    label="Need setup"
                    urgent={setupUrgent}
                    note={setupUrgent ? coverageUrgentConsequence(startsIn!, coveragePct) : null}
                    chips={<CodeChips codes={coverageCodes(b.notConfiguredCodes, b.draft)} />}
                    action={
                      <RowAction href={`/surveys/push?term=${term.id}`} primary icon="fa-plus">
                        {setupCount === 1 ? 'Set up evaluation' : 'Set up evaluations'}
                      </RowAction>
                    }
                  />
                )}
                {b.scheduled.length > 0 && (
                  <LedgerRow
                    count={b.scheduled.length}
                    label="Scheduled ahead"
                    countdown={scheduledCountdown(b.scheduled)}
                    chips={<CodeChips codes={b.scheduled.map((s) => s.courseCode)} />}
                    action={
                      <RowAction href={`/course-evaluation/term/${term.id}?tab=active`} primary icon="fa-pen-ruler">
                        Manage
                      </RowAction>
                    }
                  />
                )}
              </div>
            </CardSection>
          )}
        </>
      ) : null}

      <WidgetCardFooter
        summary={b ? breakdownSummary(b) : null}
        href={remaining > 0 ? `/surveys/push?term=${term.id}` : `/course-evaluation/term/${term.id}`}
        label={remaining > 0 ? (snap.draftCount > 0 ? 'Resume setup' : 'Set up evaluations') : 'View term'}
        ariaLabel={
          remaining > 0
            ? snap.draftCount > 0
              ? `Resume evaluation setup for ${term.name}`
              : `Set up evaluations for ${term.name}`
            : `Open ${term.name} workspace`
        }
      />

      <AddTermDatesDrawer term={term} open={datesOpen} onOpenChange={setDatesOpen} />
    </Card>
  )
}

/* ── the triptych ─────────────────────────────────────────────────────────── */

export default function VariantWidgetDense() {
  const { surveys, programTerms, templates } = usePce()

  const ordered = useMemo(
    () => [...programTerms].sort((a, b) => a.startDate.localeCompare(b.startDate)),
    [programTerms],
  )
  const today = useMemo(() => new Date().toISOString().slice(0, 10), [])
  const ce = useMemo(
    () => surveys.filter((s) => !s.surveyType || s.surveyType === 'course_evaluation'),
    [surveys],
  )

  /* Identical slotting to dashboard-home.tsx — Last capped to the single most
     recently ended term (Vishal: "last should be the first card"), Current and
     Upcoming can each hold several, 'future' terms get no card at all. */
  const currentTerms = useMemo(
    () => ordered.filter((t) => classifyTermWindow(t, today) === 'current'),
    [ordered, today],
  )
  const lastCandidates = useMemo(
    () => ordered.filter((t) => classifyTermWindow(t, today) === 'last'),
    [ordered, today],
  )
  const lastTerms = useMemo(() => {
    const mostRecent = [...lastCandidates].sort((a, b) => b.endDate.localeCompare(a.endDate))[0]
    return mostRecent ? [mostRecent] : []
  }, [lastCandidates])
  const upcomingTerms = useMemo(
    () => ordered.filter((t) => classifyTermWindow(t, today) === 'upcoming'),
    [ordered, today],
  )

  const currentSnaps = useMemo(() => currentTerms.map((t) => snapshot(t, ce)), [currentTerms, ce])
  const lastSnaps = useMemo(() => lastTerms.map((t) => snapshot(t, ce)), [lastTerms, ce])
  const upcomingSnaps = useMemo(() => upcomingTerms.map((t) => snapshot(t, ce)), [upcomingTerms, ce])

  const breakdownForSnap = (snap: TermSnapshot) => breakdownFor(snap.term, ce)

  if (programTerms.length === 0) {
    return (
      <div className="flex flex-col gap-2 rounded-xl bg-card p-4 ring-1 ring-foreground/10">
        <p className="text-sm font-medium text-foreground">No term set up yet</p>
        <p className="text-xs text-muted-foreground">
          Configure a term calendar to discover its course offerings and start driving response rates.
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 items-stretch gap-4 lg:grid-cols-[1fr_1.35fr_1fr]">
      {lastSnaps.length > 0 && (
        <div className="flex flex-col gap-4 lg:[grid-column:1]">
          {lastSnaps.map((s) => (
            <LastWidgetCard key={s.term.id} snap={s} breakdown={breakdownForSnap(s)} />
          ))}
        </div>
      )}
      {currentSnaps.length > 0 && (
        <div className="flex flex-col gap-4 lg:[grid-column:2]">
          {currentSnaps.map((s) => (
            <CurrentWidgetCard
              key={s.term.id}
              snap={s}
              breakdown={breakdownForSnap(s)}
              noTemplates={templates.length === 0}
            />
          ))}
        </div>
      )}
      {upcomingSnaps.length > 0 && (
        <div className="flex flex-col gap-4 lg:[grid-column:3]">
          {upcomingSnaps.map((s) => (
            <UpcomingWidgetCard key={s.term.id} snap={s} breakdown={breakdownForSnap(s)} />
          ))}
        </div>
      )}
    </div>
  )
}
