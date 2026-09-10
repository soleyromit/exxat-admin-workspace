'use client'

// ============================================================================
// Breakdown rows — VARIANT D: SINGLE-LINE COMPACT (compare route, throwaway).
//
// One real change: every status row is locked to the same fixed height, one
// line — icon, title, course chips, action far right — and the consequence
// sentence that made urgent rows two lines tall moves into a `Tip` on the row
// icon (kept in the DOM as sr-only text). Rows of equal height scan as a list;
// rows of varying height scan as a stack of paragraphs, which is what makes
// the current card hard to read down. The icon carries the row's whole visual
// identity instead — a distinct glyph per lifecycle state inside a 24px tinted
// disc — since a lean row has nowhere else to put one. Card footer also gains
// the real status distribution ("3 live · 2 closed · 7 total"), missing today.
// ============================================================================

import { useMemo } from 'react'
import Link from 'next/link'
import {
  Badge,
  Button,
  Card, CardContent, CardFooter, CardHeader, CardTitle,
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem,
  HoverCard, HoverCardTrigger, HoverCardContent,
  StatusBadge, Tip,
} from '@exxatdesignux/ui'
import type { StatusBadgeTone } from '@exxatdesignux/ui'
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
  coveragePercent, isFullyCovered, coverageCodes, coverageLead, coverageDetail,
  coverageUrgentConsequence,
  scheduledLead, scheduledDetail, scheduledCountdown,
  liveLead, liveNarrative, liveCountdown, liveAtRiskCodes, liveUrgentConsequence,
  closedNarrative, courseRates,
  type CourseBreakdown, type TermWindowPosition,
} from '@/lib/pce-term-metrics'
import type { ProgramTerm } from '@/lib/pce-mock-data'

/* ── row parts ───────────────────────────────────────────────────────────── */

/** Chips, inline and non-wrapping. Same bounded-growth contract as the
 *  production `CourseChips` (cap + `HoverCard` disclosure for the rest), just
 *  capped at 2 instead of 3 and `flex-nowrap` instead of `flex-wrap` — on a
 *  fixed-height row a third chip is exactly what would push the list into a
 *  second line, which is the one thing this variant is not allowed to do. */
function InlineChips({
  codes, rates, atRisk, max = 2,
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
    <>
      {shown.map((code) => (
        <Badge
          key={code}
          variant="outline"
          className="shrink-0 whitespace-nowrap rounded-full px-2 py-0 text-[11px] font-medium tabular-nums"
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
              className="shrink-0 cursor-default whitespace-nowrap rounded-full border-dashed px-2 py-0 text-[11px] font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              style={{ color: 'var(--primary)' }}
            >
              +{hidden.length}
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
    </>
  )
}

/** Date fact as a small chip, same anatomy as the production `RowCountdown`
 *  (icon + tabular text), shrink-0 so it never wraps under the title. */
function RowCountdown({ label, urgent = false }: { label: string; urgent?: boolean }) {
  return (
    <span
      className="hidden shrink-0 items-center gap-1 whitespace-nowrap text-[11px] font-medium tabular-nums sm:inline-flex"
      style={{ color: urgent ? LIST_HUB_STATUS_TINT_WARNING.fg : 'var(--muted-foreground)' }}
    >
      <i className="fa-light fa-clock" aria-hidden="true" style={{ fontSize: 10 }} />
      {label}
    </span>
  )
}

/** Overflow trigger for a row's secondary action — one visible primary
 *  `RowAction` plus this, never two same-weight links (settled constraint). */
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

/** The row's one piece of visual identity: a distinct glyph per lifecycle
 *  state, sitting in a 24px disc filled with that state's own tint. Rows this
 *  lean have nowhere else to carry identity, and the production set leaned on
 *  two circular glyphs (`fa-circle-dot`, `fa-circle-check`) that read as the
 *  same shape at 12px — see `STATE_ICON` below for the replacements.
 *
 *  Flat fill only — no ring, no shadow, no radius chrome beyond the disc
 *  itself, and every colour comes from a `StatusTint` token pair. On an urgent
 *  row the disc would otherwise vanish into the row's own warning wash (same
 *  `bg` token), so it steps up to the tint's `border` value — still the same
 *  token family, just the deeper stop. 24px is the workspace's disc floor.
 *
 *  Deliberately NOT a per-row chart, sparkline or progress/segmented bar:
 *  coverage/setup/closed are checklist states, and the tenth-pass Mobbin study
 *  in term-breakdown.tsx found real SaaS rows stay text + small chips. */
function RowIcon({ icon, tint, urgent }: { icon: string; tint: StatusTint; urgent: boolean }) {
  return (
    <span
      className="inline-flex size-6 shrink-0 items-center justify-center rounded-full"
      style={{ background: urgent ? tint.border : tint.bg, color: tint.fg }}
    >
      <i className={`fa-light ${icon}`} style={{ fontSize: 11 }} aria-hidden="true" />
    </span>
  )
}

/** Distinct silhouette per lifecycle state, every glyph already in use in this
 *  app (no new kit subset risk): a tool for work not started, a dated calendar
 *  for something waiting on a date, an inbox for responses arriving, a
 *  checkered flag for finished, a bare check for nothing left to do. */
const STATE_ICON = {
  setup:     'fa-wrench',
  scheduled: 'fa-calendar-day',
  live:      'fa-inbox',
  closed:    'fa-flag-checkered',
  complete:  'fa-check',
} as const

/** The whole variant, in one component: a row is exactly `h-10`, always, and
 *  its narrative lives on the icon.
 *
 *  The icon disc is the tooltip trigger AND carries the sentence as its own
 *  `sr-only` accessible name — one focusable element, named by the same text
 *  the tooltip shows, so nothing is lost by demoting the sentence out of the
 *  visible row. `cursor-help` is the only hover cue an icon can carry.
 *
 *  `urgent` keeps the reserved flat wash + left accent from term-breakdown.tsx
 *  (background and border-left only, no border/shadow/radius sub-card) but no
 *  longer changes the row's height or moves its action to a second line —
 *  urgency is colour here, not size. */
function CompactRow({
  icon, tint, title, sentence, chips, countdown, actions, urgent = false,
}: {
  icon: string
  tint: StatusTint
  title: string
  /** Full sentence — tooltip on the icon plus the icon's sr-only name. */
  sentence?: string | null
  chips?: React.ReactNode
  countdown?: React.ReactNode
  actions?: React.ReactNode
  urgent?: boolean
}) {
  const glyph = <RowIcon icon={icon} tint={tint} urgent={urgent} />
  return (
    <li
      className={
        'flex h-10 items-center gap-2 border-t border-border/60 first:border-t-0' +
        (urgent ? ' -mx-2.5 rounded-md border-t-0 border-l-2 px-2.5' : '')
      }
      style={urgent ? { background: LIST_HUB_STATUS_TINT_WARNING.bg, borderLeftColor: LIST_HUB_STATUS_TINT_WARNING.border } : undefined}
    >
      {sentence ? (
        <Tip label={sentence} side="top">
          <span
            tabIndex={0}
            className="inline-flex shrink-0 cursor-help items-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {glyph}
            <span className="sr-only">{sentence}</span>
          </span>
        </Tip>
      ) : (
        <span className="inline-flex shrink-0 items-center">{glyph}</span>
      )}

      <span className="shrink-0 whitespace-nowrap text-xs font-medium text-foreground">{title}</span>

      <span className="flex min-w-0 flex-1 items-center gap-1 overflow-hidden">{chips}</span>

      <span className="ms-auto -me-2 flex shrink-0 items-center gap-1 ps-1">
        {countdown}
        {actions}
      </span>
    </li>
  )
}

/* ── card ────────────────────────────────────────────────────────────────── */

const POSITION_BADGE: Record<TermWindowPosition, { label: string; tone: StatusBadgeTone }> = {
  current:  { label: 'Current',   tone: 'success' },
  last:     { label: 'Last term', tone: 'neutral' },
  upcoming: { label: 'Upcoming',  tone: 'info' },
  future:   { label: 'Future',    tone: 'info' },
}

function TermCard({
  term, breakdown, position,
}: {
  term: ProgramTerm
  breakdown: CourseBreakdown
  position: TermWindowPosition
}) {
  const b = breakdown
  const win = evalWindow(term)
  const dated = !!term.startDate && !!term.endDate

  const fullyCovered = isFullyCovered(b)
  const coveragePct = coveragePercent(b)
  const setupTotal = b.notConfiguredCount + b.draft.length
  const setupCodes = coverageCodes(b.notConfiguredCodes, b.draft)
  const covLead = coverageLead(b.notConfiguredCount, b.draft.length)
  const covDetail = coverageDetail(b.notConfiguredCount, b.draft.length)

  const schedLead = scheduledLead(b.scheduled)
  const schedDetail = scheduledDetail(b.scheduled)
  const schedCountdown = scheduledCountdown(b.scheduled)

  const liveLeadText = liveLead(b.live)
  const liveStory = liveNarrative(b.live)
  const liveCountdownText = liveCountdown(b.live)
  const liveAtRisk = liveAtRiskCodes(b.live)
  const isLiveUrgent = liveAtRisk.size > 0
  const closedStory = closedNarrative(b.closed)

  const workspaceHref = (tab: 'active' | 'finished') => `/course-evaluation/term/${term.id}?tab=${tab}`

  /* Live and Closed can't exist before a term starts — production hides them
     on the Upcoming column rather than trusting fixture data not to carry
     that combination, and this variant follows the same rule. */
  const hideCollection = position === 'upcoming' || position === 'future'
  const startsInDays = dated
    ? Math.max(0, Math.ceil((parseDate(term.startDate).getTime() - Date.now()) / 86_400_000))
    : null
  /* Same compound gate as production: time-bound AND something actually
     wrong, never "upcoming term with work left" (that is every term). */
  const isSetupUrgent =
    position === 'upcoming' && startsInDays != null && startsInDays <= 14 &&
    !fullyCovered && setupTotal > 0 && coveragePct < 50

  const showSetupGroup = !fullyCovered || b.scheduled.length > 0
  const showCollectionGroup = !hideCollection && (b.live.length > 0 || b.closed.length > 0)

  return (
    <Card className="h-full">
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
          {dated ? ` · Eval window ${win.open.replace(/, \d{4}$/, '')} – ${win.close}` : ' · Eval window not set'}
        </p>
      </CardHeader>

      <CardContent className="flex flex-col gap-3">
        {fullyCovered && (
          <ul className="flex flex-col">
            <CompactRow
              icon={STATE_ICON.complete}
              tint={LIST_HUB_STATUS_TINT_SUCCESS}
              title="Evaluation coverage complete"
              sentence="Every course in this term already has an evaluation."
            />
          </ul>
        )}

        {showSetupGroup && (
          <div className="flex flex-col gap-1.5">
            {/* Coverage % rides the group label instead of taking its own row —
                a stat line and a status row have different anatomy, and mixing
                them is what breaks the even rhythm this variant is testing. */}
            <div className="flex items-baseline justify-between gap-2">
              <GroupLabel>Setup</GroupLabel>
              {!fullyCovered && (
                <span className="text-xs font-medium tabular-nums text-muted-foreground">
                  {coveragePct}% covered
                </span>
              )}
            </div>
            <ul className="flex flex-col">
              {!fullyCovered && covLead && (
                <CompactRow
                  icon={STATE_ICON.setup}
                  /* Warning tint only when the row genuinely qualifies as
                     urgent; otherwise setup is neutral work, not a problem. */
                  tint={isSetupUrgent ? LIST_HUB_STATUS_TINT_WARNING : LIST_HUB_STATUS_TINT_NEUTRAL}
                  title={covLead}
                  sentence={
                    isSetupUrgent && startsInDays != null
                      ? `${covDetail ?? ''} ${coverageUrgentConsequence(startsInDays, coveragePct)}`.trim()
                      : covDetail
                  }
                  chips={<InlineChips codes={setupCodes} />}
                  urgent={isSetupUrgent}
                  actions={
                    <RowAction href={`/surveys/push?term=${term.id}`} primary icon="fa-plus">
                      Set up
                    </RowAction>
                  }
                />
              )}
              {b.scheduled.length > 0 && schedLead && (
                <CompactRow
                  icon={STATE_ICON.scheduled}
                  tint={LIST_HUB_STATUS_TINT_PLANNED}
                  title={schedLead}
                  sentence={schedDetail}
                  chips={<InlineChips codes={b.scheduled.map((s) => s.courseCode)} />}
                  countdown={schedCountdown ? <RowCountdown label={schedCountdown} /> : undefined}
                  actions={
                    <RowAction href={workspaceHref('active')} primary icon="fa-pen-ruler">
                      Manage
                    </RowAction>
                  }
                />
              )}
            </ul>
          </div>
        )}

        {showCollectionGroup && (
          <div className="flex flex-col gap-1.5 border-t border-border/60 pt-3">
            <GroupLabel>Collecting responses</GroupLabel>
            <ul className="flex flex-col">
              {b.live.length > 0 && liveLeadText && (
                <CompactRow
                  icon={STATE_ICON.live}
                  tint={isLiveUrgent ? LIST_HUB_STATUS_TINT_WARNING : LIST_HUB_STATUS_TINT_SUCCESS}
                  title={liveLeadText}
                  /* The consequence line urgent rows used to render visibly is
                     appended here instead — same words, no extra row height. */
                  sentence={
                    isLiveUrgent
                      ? [liveStory, liveUrgentConsequence(b.live)].filter(Boolean).join(' ')
                      : liveStory
                  }
                  chips={
                    <InlineChips
                      codes={b.live.map((s) => s.courseCode)}
                      rates={courseRates(b.live)}
                      atRisk={liveAtRisk}
                    />
                  }
                  countdown={liveCountdownText ? <RowCountdown label={liveCountdownText} urgent={isLiveUrgent} /> : undefined}
                  urgent={isLiveUrgent}
                  actions={
                    <>
                      <RowAction href={`/surveys/remind?from=term:${term.id}`} primary icon="fa-bell">
                        Remind
                      </RowAction>
                      <RowActionMenu items={[{ href: workspaceHref('active'), label: 'Extend', icon: 'fa-calendar-pen' }]} />
                    </>
                  }
                />
              )}
              {b.closed.length > 0 && (
                <CompactRow
                  icon={STATE_ICON.closed}
                  tint={LIST_HUB_STATUS_TINT_COMPLETED}
                  title={`${b.closed.length} of ${b.totalCourses} closed`}
                  sentence={closedStory}
                  chips={<InlineChips codes={b.closed.map((s) => s.courseCode)} rates={courseRates(b.closed)} />}
                  actions={
                    <RowAction href={workspaceHref('finished')} primary icon="fa-share-from-square">
                      Review
                    </RowAction>
                  }
                />
              )}
            </ul>
          </div>
        )}
      </CardContent>

      {/* Status distribution, Vanta-style: plain muted text, dot-separated, no
          bar or segmented graphic (these are checklist states, not an
          in-flight metric). `breakdownSummary` is the existing helper for
          exactly this string — real bucket counts, zero-count states dropped —
          so the footer can't drift from the rows above it. */}
      <CardFooter className="mt-auto gap-2">
        <p className="min-w-0 flex-1 truncate text-xs tabular-nums text-muted-foreground">
          {breakdownSummary(b)}
        </p>
        <Link
          href={`/course-evaluation/term/${term.id}`}
          aria-label={`View details — ${term.name}`}
          className="ms-auto flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-sm text-sm font-medium text-foreground underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          View details
          <i className="fa-light fa-arrow-right text-xs" aria-hidden="true" />
        </Link>
      </CardFooter>
    </Card>
  )
}

/* ── case selection (real fixture terms only) ────────────────────────────── */

interface Entry {
  term: ProgramTerm
  b: CourseBreakdown
  position: TermWindowPosition
}

export default function VariantSingleLine() {
  const { surveys, programTerms } = usePce()

  const today = useMemo(() => new Date().toISOString().slice(0, 10), [])
  const ce = useMemo(
    () => surveys.filter((s) => !s.surveyType || s.surveyType === 'course_evaluation'),
    [surveys],
  )

  const entries = useMemo<Entry[]>(() => {
    return [...programTerms]
      .sort((a, b) => a.startDate.localeCompare(b.startDate))
      .map((term) => {
        const b = breakdownFor(term, ce)
        return b && b.totalCourses > 0
          ? { term, b, position: classifyTermWindow(term, today) }
          : null
      })
      .filter((e): e is Entry => e !== null)
  }, [programTerms, ce, today])

  /* Same idea as variant A's slot selection — the terms come from the real
     fixture, nothing is invented — except the slot here is the ROW SHAPE each
     card demonstrates rather than its window position, since that's what this
     variant is being compared on. Strongest exemplar first, each term used
     once. */
  const cases = useMemo(() => {
    const used = new Set<string>()
    const pick = (score: (e: Entry) => number) => {
      const best = entries
        .filter((e) => !used.has(e.term.id))
        .map((e) => ({ e, s: score(e) }))
        .filter((x) => x.s > 0)
        .sort((a, b) => b.s - a.s)[0]
      if (!best) return null
      used.add(best.e.term.id)
      return best.e
    }

    const upcoming = (e: Entry) => e.position === 'upcoming' || e.position === 'future'
    const live = pick((e) => (upcoming(e) ? 0 : e.b.live.length + liveAtRiskCodes(e.b.live).size * 10))
    const closed = pick((e) => (upcoming(e) ? 0 : (e.b.closed.length / e.b.totalCourses) * 100))
    const setup = pick((e) => ((e.b.notConfiguredCount + e.b.draft.length) / e.b.totalCourses) * 100)

    return [
      { key: 'setup', label: 'Case: mostly setup', entry: setup },
      { key: 'live', label: 'Case: live, with courses at risk', entry: live },
      { key: 'closed', label: 'Case: mostly closed', entry: closed },
    ].filter((c): c is { key: string; label: string; entry: Entry } => c.entry !== null)
  }, [entries])

  if (cases.length === 0) {
    return (
      <p className="rounded-lg border border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
        This account has no term with course offerings to break down right now.
      </p>
    )
  }

  return (
    <div className="grid grid-cols-1 items-stretch gap-4 lg:grid-cols-3">
      {cases.map((c) => (
        <div key={c.key} className="flex flex-col gap-2">
          <p className="text-xs font-medium text-muted-foreground">
            {c.label} · {c.entry.term.name}
          </p>
          <TermCard term={c.entry.term} breakdown={c.entry.b} position={c.entry.position} />
        </div>
      ))}
    </div>
  )
}
