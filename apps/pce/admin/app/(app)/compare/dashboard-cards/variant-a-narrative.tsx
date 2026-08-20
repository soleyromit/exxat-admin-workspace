'use client'

// ============================================================================
// Term-card triptych — VARIANT A: NARRATIVE.
//
// One anchor SENTENCE per card carries the primary visual weight. The card
// opens by saying what's true about the term in plain language; the numbers
// live inside that sentence as emphasized evidence rather than as a separate
// large digit competing with it. Reference feel: Linear's "You have 3 issues
// due today", a well-written status update from a human — not a dashboard
// reciting metrics.
//
// What this variant deliberately changes vs. production (dashboard-home.tsx +
// term-breakdown.tsx):
//   1. No standalone KPI block. Production leads Current with a 18px "47%"
//      over a full-width response bar, then repeats the same facts as row
//      stats below it. Here the response rate opens the anchor sentence
//      ("Responses are at 47%, 23 points short of the 70% target") — still
//      the first and most prominent thing on the hero card, per Vishal
//      (transcript 7a175890: response rate is the product's #1 goal metric),
//      just carried by the sentence instead of by a digit + bar. The bar also
//      goes: coverage/response-to-target is a checklist state, not a live
//      in-flight process (docs/governance/design-anti-patterns.md, "Progress
//      & Viz" + feedback_progress_bars_last_resort).
//   2. The anchor absorbs the card's headline bucket, so the beat list below
//      never restates it — Current's anchor owns Live + rate (beats = setup /
//      scheduled / closed), Last's owns closure (beats = the stragglers),
//      Upcoming's owns readiness + countdown (beats = data gaps / scheduled).
//      Production's card could say the same ratio three ways in three places;
//      here each fact appears exactly once, in the voice that fits it.
//   3. "Needs attention" StatusBadge retired on Last. The badge was a label
//      for a condition the sentence can just state outright — "The term ended
//      with 2 courses that never collected anything" is the flag.
//   4. Course codes read INLINE, as part of the sentence ("— DPT-530 and
//      DPT-540"), not as pills. Same identifiability win Romit asked for in
//      the tenth pass ("2 courses need setup, which courses?") delivered in
//      prose, which is what this direction is for. Long lists collapse to
//      "and 4 others" behind a `Tip` so a 12-course bucket stays one line.
//
// What it deliberately KEEPS from the 11 rounds of feedback baked into
// term-breakdown.tsx — these were hard-won and are not up for re-litigation:
//   - Actions are the real DS `RowAction` (ghost `Button`, icon + label),
//     imported from term-breakdown.tsx. The eleventh pass proved plain text
//     links read as too subtle to operate; that verdict stands here.
//   - The urgent wash is `LIST_HUB_STATUS_TINT_WARNING` as a flat background
//     + left accent, no border/shadow/radius card-in-card chrome, and only
//     for a story that is BOTH time-bound and has something genuinely wrong
//     (live at-risk while closing; term starting soon with low coverage).
//   - No red anywhere (aarti_no_red) — amber-family warning tint only.
//   - Every derived fact comes from lib/pce-term-metrics.ts. Nothing here
//     re-computes a rate, a coverage %, a countdown or a bucket by hand.
// ============================================================================

import { useMemo, useState } from 'react'
import Link from 'next/link'
import {
  Button,
  Card, CardContent, CardFooter, CardHeader, CardTitle,
  StatusBadge, Tip,
} from '@exxatdesignux/ui'
import type { StatusBadgeTone } from '@exxatdesignux/ui'
import { usePce } from '@/components/pce/pce-state'
import { AddTermDatesDrawer } from '@/components/pce/add-term-drawer'
import { RowAction, GroupLabel } from '@/components/pce/term-breakdown'
import {
  LIST_HUB_STATUS_TINT_SUCCESS,
  LIST_HUB_STATUS_TINT_WARNING,
  LIST_HUB_STATUS_TINT_PLANNED,
  LIST_HUB_STATUS_TINT_NEUTRAL,
  type StatusTint,
} from '@/lib/list-status-badges'
import { auditTerm } from '@/lib/pce-term-readiness'
import { prismCoursesHref } from '@/lib/pce-course-readiness'
import {
  RESPONSE_TARGET,
  classifyTermWindow, snapshot, breakdownFor, breakdownSummary,
  evalWindow, parseDate, weightedRate,
  coveragePercent, isFullyCovered, coverageCodes, coverageDetail,
  scheduledLead, scheduledDetail,
  liveCountdown, liveAtRiskCodes,
  type TermSnapshot, type TermWindowPosition, type CourseBreakdown,
} from '@/lib/pce-term-metrics'
import type { ProgramTerm } from '@/lib/pce-mock-data'

/* ── sentence primitives ─────────────────────────────────────────────────── */

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`

/** A number inside a sentence. This is the ONLY emphasis the anchor uses —
 *  weight + tabular figures, never a size jump — so the sentence stays a
 *  sentence and the digits still catch the eye on a scan. */
function Num({ children }: { children: React.ReactNode }) {
  return <span className="font-semibold tabular-nums text-foreground">{children}</span>
}

/** Course codes as part of the prose, not as pills: "DPT-530 and DPT-540",
 *  "DPT-511, DPT-520, DPT-530 and 4 others". Anything past `max` collapses
 *  behind a `Tip` so the row height never depends on bucket size — the same
 *  bounded-growth rule the production chips use, expressed in a sentence. */
function CodeList({ codes, max = 3 }: { codes: string[]; max?: number }) {
  if (codes.length === 0) return null
  const shown = codes.slice(0, max)
  const hidden = codes.slice(max)
  const code = (c: string) => (
    <span key={c} className="font-medium text-foreground">{c}</span>
  )
  const tail = hidden.length > 0 ? (
    <Tip label={hidden.join(', ')} side="top">
      <span
        tabIndex={0}
        className="rounded-sm font-medium text-foreground underline decoration-dotted underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {plural(hidden.length, 'other')}
      </span>
    </Tip>
  ) : null

  const items: React.ReactNode[] = shown.map(code)
  if (tail) items.push(tail)

  return (
    <>
      {items.map((node, i) => (
        <span key={i}>
          {i === 0 ? '' : i === items.length - 1 ? ' and ' : ', '}
          {node}
        </span>
      ))}
    </>
  )
}

/* ── card anatomy ────────────────────────────────────────────────────────── */

const POSITION_BADGE: Record<Exclude<TermWindowPosition, 'future'>, { label: string; tone: StatusBadgeTone }> = {
  current:  { label: 'Current',   tone: 'success' },
  last:     { label: 'Last term', tone: 'neutral' },
  upcoming: { label: 'Upcoming',  tone: 'info' },
}

const fmtDate = (d: string) =>
  parseDate(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

/** Term name (links to the workspace) + window badge, then one quiet meta
 *  line. Same anatomy as production — the header isn't what this variant is
 *  exploring, and changing it would make the three variants incomparable. */
function CardTop({
  term, position, showWindow = true,
}: {
  term: ProgramTerm
  position: Exclude<TermWindowPosition, 'future'>
  showWindow?: boolean
}) {
  const win = evalWindow(term)
  const dated = !!term.startDate && !!term.endDate
  return (
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
        {showWindow && (dated
          ? ` · Eval window ${win.open.replace(/, \d{4}$/, '')} – ${win.close}`
          : ' · Eval window not set')}
      </p>
    </CardHeader>
  )
}

/** The headline. `lead` is the claim, `support` is the sentence that backs it
 *  up. Nothing on the card is typographically louder than `lead`.
 *
 *  `urgent` reuses the reserved warning wash + left accent from
 *  term-breakdown.tsx — flat colour only, never a bordered sub-card — and is
 *  gated on the same compound shape (time-bound AND something actually
 *  wrong), never on card type. */
function Anchor({
  icon, tint, lead, support, action, urgent = false,
}: {
  icon: string
  tint: StatusTint
  lead: React.ReactNode
  support?: React.ReactNode
  action?: React.ReactNode
  urgent?: boolean
}) {
  return (
    <div
      className={'flex items-start gap-2.5' + (urgent ? ' -mx-3 rounded-md border-l-2 px-3 py-2.5' : '')}
      style={urgent ? { background: LIST_HUB_STATUS_TINT_WARNING.bg, borderLeftColor: LIST_HUB_STATUS_TINT_WARNING.border } : undefined}
    >
      <i
        className={`fa-light ${icon} mt-1 shrink-0`}
        style={{ color: tint.fg, fontSize: 13 }}
        aria-hidden="true"
      />
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <p className="text-[15px] leading-snug text-foreground">{lead}</p>
        {support && <p className="text-xs leading-relaxed text-muted-foreground">{support}</p>}
        {action && <div className="-mx-2 mt-0.5 flex items-center gap-1">{action}</div>}
      </div>
    </div>
  )
}

/** One remaining thread of the story — a full sentence, not a stat with a
 *  caption. Actions stay on the sentence's own line (they're short verbs; the
 *  sentence wraps around them), and are real DS ghost Buttons via `RowAction`. */
function Beat({
  icon, tint, sentence, action,
}: {
  icon: string
  tint: StatusTint
  sentence: React.ReactNode
  action?: React.ReactNode
}) {
  return (
    <li className="flex items-start gap-2.5 border-t border-border/60 py-2 first:border-t-0">
      <i
        className={`fa-light ${icon} mt-0.5 shrink-0`}
        style={{ color: tint.fg, fontSize: 12 }}
        aria-hidden="true"
      />
      <p className="min-w-0 flex-1 text-xs leading-relaxed text-muted-foreground">{sentence}</p>
      {action && <div className="-my-1 -me-2 shrink-0">{action}</div>}
    </li>
  )
}

function Beats({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1 border-t border-border/60 pt-3">
      <GroupLabel>{label}</GroupLabel>
      <ul className="flex flex-col">{children}</ul>
    </div>
  )
}

/** Footer click-through — label + destination both vary by the card's real
 *  next step (Romit's catch: "View details" was identical on all three
 *  cards, which reads as one generic action regardless of term type, not
 *  three distinct next steps). A finished term's real next step is the
 *  results, not the operational workspace — so Last routes to Analytics,
 *  not the term workspace. */
function CardBottom({
  breakdown, term, label = 'View Details', href,
}: {
  breakdown: CourseBreakdown | null
  term: ProgramTerm
  label?: string
  href?: string
}) {
  return (
    <CardFooter className="mt-auto gap-2">
      {breakdown && (
        <p className="min-w-0 flex-1 truncate text-xs text-muted-foreground">{breakdownSummary(breakdown)}</p>
      )}
      <Link
        href={href ?? `/course-evaluation/term/${term.id}`}
        aria-label={`${label} — ${term.name}`}
        className="ms-auto flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-sm text-sm font-medium text-foreground hover:underline underline-offset-2 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        {label}
        <i className="fa-light fa-arrow-right text-xs" aria-hidden="true" />
      </Link>
    </CardFooter>
  )
}

/* ── shared beats (same sentence, whichever card is telling the story) ─────── */

function SetupBeat({ b, term }: { b: CourseBreakdown; term: ProgramTerm }) {
  const total = b.notConfiguredCount + b.draft.length
  if (total === 0) return null
  const codes = coverageCodes(b.notConfiguredCodes, b.draft)
  return (
    <Beat
      icon="fa-list-check"
      tint={LIST_HUB_STATUS_TINT_NEUTRAL}
      sentence={
        <>
          {coverageDetail(b.notConfiguredCount, b.draft.length)?.replace(/\.$/, '')}
          {codes.length > 0 && <> — <CodeList codes={codes} /></>}.
        </>
      }
      action={
        <RowAction href={`/surveys/push?term=${term.id}`} primary icon="fa-plus">
          {total === 1 ? 'Set up' : 'Set up all'}
        </RowAction>
      }
    />
  )
}

function ScheduledBeat({ b, term }: { b: CourseBreakdown; term: ProgramTerm }) {
  if (b.scheduled.length === 0) return null
  const codes = b.scheduled.map((s) => s.courseCode)
  const detail = scheduledDetail(b.scheduled)
  return (
    <Beat
      icon="fa-calendar"
      tint={LIST_HUB_STATUS_TINT_PLANNED}
      sentence={
        <>
          {scheduledLead(b.scheduled)} to go out — <CodeList codes={codes} />
          {detail ? `. ${detail}` : '.'}
        </>
      }
      action={
        <RowAction href={`/course-evaluation/term/${term.id}?tab=active`} icon="fa-pen-ruler">
          Manage
        </RowAction>
      }
    />
  )
}

function ClosedBeat({ b, term }: { b: CourseBreakdown; term: ProgramTerm }) {
  if (b.closed.length === 0) return null
  const rate = weightedRate(b.closed)
  const codes = b.closed.map((s) => s.courseCode)
  return (
    <Beat
      icon="fa-flag-checkered"
      tint={LIST_HUB_STATUS_TINT_SUCCESS}
      sentence={
        <>
          <Num>{b.closed.length}</Num> of <Num>{b.totalCourses}</Num> have already finished
          {rate != null ? <>, averaging <Num>{rate}%</Num></> : null} — <CodeList codes={codes} />.
        </>
      }
      action={
        <RowAction href={`/course-evaluation/term/${term.id}?tab=finished`} primary icon="fa-share-from-square">
          Review
        </RowAction>
      }
    />
  )
}

function LiveBeat({ b, term }: { b: CourseBreakdown; term: ProgramTerm }) {
  if (b.live.length === 0) return null
  const codes = b.live.map((s) => s.courseCode)
  const countdown = liveCountdown(b.live)
  return (
    <Beat
      icon="fa-circle-dot"
      tint={LIST_HUB_STATUS_TINT_SUCCESS}
      sentence={
        <>
          <Num>{b.live.length}</Num> {b.live.length === 1 ? 'course is' : 'courses are'} still
          collecting — <CodeList codes={codes} />{countdown ? `. ${countdown}` : ''}.
        </>
      }
      action={
        <RowAction href={`/surveys/remind?from=term:${term.id}`} primary icon="fa-bell">
          Remind
        </RowAction>
      }
    />
  )
}

/* ── an empty-state anchor is still an anchor ─────────────────────────────── */

/** Deliberately NOT the banned centered-icon-and-button empty state
 *  (design-anti-patterns.md, "Empty & Success States"). Same sentence-first
 *  anatomy as every other card body — the story just happens to be "nothing
 *  has started yet". */
function EmptyAnchor({
  icon, lead, support, action,
}: {
  icon: string
  lead: React.ReactNode
  support?: React.ReactNode
  action: React.ReactNode
}) {
  return <Anchor icon={icon} tint={LIST_HUB_STATUS_TINT_NEUTRAL} lead={lead} support={support} action={action} />
}

const AddCoursesAction = (
  <Button variant="ghost" size="sm" asChild className="text-primary hover:text-primary">
    <a href={prismCoursesHref()} target="_blank" rel="noopener noreferrer">
      <i className="fa-light fa-arrow-up-right-from-square" aria-hidden="true" />
      Add courses
    </a>
  </Button>
)

/* ── Current term — the hero. Story: how collection is going RIGHT NOW. ───── */

function CurrentCard({
  snap, breakdown, noTemplates, className,
}: {
  snap: TermSnapshot
  breakdown: CourseBreakdown | null
  noTemplates: boolean
  className?: string
}) {
  const { term } = snap
  const b = breakdown
  const noCourses = (snap.coverage?.total ?? 0) === 0
  const noEvaluations = !noCourses && snap.total === 0

  let body: React.ReactNode

  if (noTemplates) {
    body = (
      <EmptyAnchor
        icon="fa-file-lines"
        lead={<>There&apos;s no evaluation template yet, so nothing can go out.</>}
        support="A template defines what evaluations ask. It's the first step before sending them."
        action={<RowAction href="/templates/new" primary icon="fa-plus">Create template</RowAction>}
      />
    )
  } else if (noCourses) {
    body = (
      <EmptyAnchor
        icon="fa-layer-group"
        lead={<>No course offerings have come through for this term.</>}
        support="Courses are managed in Prism. Once they land here, evaluations can be scheduled against them."
        action={AddCoursesAction}
      />
    )
  } else if (noEvaluations || !b) {
    body = (
      <EmptyAnchor
        icon="fa-square-poll-vertical"
        lead={<><Num>{snap.coverage?.total ?? 0}</Num> courses are ready for evaluation, but none have been scheduled.</>}
        support="The term is already running, so nothing is being collected right now."
        action={<RowAction href={`/surveys/push?term=${term.id}`} primary icon="fa-plus">Schedule evaluations</RowAction>}
      />
    )
  } else {
    const rate = snap.rate
    const atRisk = liveAtRiskCodes(b.live)
    const countdown = liveCountdown(b.live)
    const closingSoon = snap.daysLeft != null && snap.daysLeft <= 7
    const urgent = b.live.length > 0 && atRisk.size > 0 && (closingSoon || snap.closingThisWeek > 0)

    let anchor: React.ReactNode
    if (b.live.length > 0) {
      /* Response rate opens the sentence — Vishal's #1 goal metric stays the
         first thing read on the hero card, just carried by prose. */
      const lead = rate == null ? (
        <><Num>{b.live.length}</Num> {b.live.length === 1 ? 'course is' : 'courses are'} collecting responses right now.</>
      ) : rate >= RESPONSE_TARGET ? (
        <>Responses are at <Num>{rate}%</Num>, already past the {RESPONSE_TARGET}% target.</>
      ) : (
        <>Responses are at <Num>{rate}%</Num>, <Num>{RESPONSE_TARGET - rate}</Num> points short of the {RESPONSE_TARGET}% target.</>
      )
      const behind = [...atRisk]
      const support = atRisk.size > 0 ? (
        <>
          <Num>{atRisk.size}</Num> of <Num>{b.live.length}</Num> live courses {atRisk.size === 1 ? 'is' : 'are'} behind
          {' '}— <CodeList codes={behind} />{countdown ? `. ${countdown}` : ''}. A reminder still has time to move it.
        </>
      ) : (
        <>
          All <Num>{b.live.length}</Num> live {b.live.length === 1 ? 'course is' : 'courses are'} on pace
          {countdown ? `. ${countdown}` : ''}.
        </>
      )
      anchor = (
        <Anchor
          icon="fa-circle-dot"
          tint={atRisk.size > 0 ? LIST_HUB_STATUS_TINT_WARNING : LIST_HUB_STATUS_TINT_SUCCESS}
          lead={lead}
          support={support}
          urgent={urgent}
          action={
            <RowAction href={`/surveys/remind?from=term:${term.id}`} primary icon="fa-bell">
              {atRisk.size > 0 ? 'Remind the courses that are behind' : 'Send a reminder'}
            </RowAction>
          }
        />
      )
    } else if (b.closed.length > 0) {
      const closedRate = weightedRate(b.closed)
      anchor = (
        <Anchor
          icon="fa-flag-checkered"
          tint={closedRate != null && closedRate >= RESPONSE_TARGET ? LIST_HUB_STATUS_TINT_SUCCESS : LIST_HUB_STATUS_TINT_WARNING}
          lead={
            closedRate != null
              ? <>Collection has already wrapped at <Num>{closedRate}%</Num> — nothing is open right now.</>
              : <>Collection has already wrapped — nothing is open right now.</>
          }
          support={<>The term still has <Num>{snap.daysLeft ?? 0}</Num> days on its window if anything needs to reopen.</>}
          action={
            <RowAction href={`/course-evaluation/term/${term.id}?tab=finished`} primary icon="fa-share-from-square">
              Review feedback
            </RowAction>
          }
        />
      )
    } else {
      anchor = (
        <Anchor
          icon="fa-list-check"
          tint={LIST_HUB_STATUS_TINT_WARNING}
          lead={<>Nothing is collecting yet — the term is running with <Num>{coveragePercent(b)}%</Num> of courses covered.</>}
          support={coverageDetail(b.notConfiguredCount, b.draft.length) ?? undefined}
          urgent
          action={<RowAction href={`/surveys/push?term=${term.id}`} primary icon="fa-plus">Set up evaluations</RowAction>}
        />
      )
    }

    /* The anchor owns Live + the response rate, so the beat list never says
       either again — it carries only the threads the headline left open.
       `hasBeats` is computed from the DATA, not from whether the beat
       elements exist: a `<SetupBeat>` that renders null is still a truthy
       JSX object, and testing those directly printed the group label above
       an empty list (caught live on the Fall 2025 card). */
    const showClosedBeat = b.live.length > 0 && b.closed.length > 0
    const hasBeats =
      b.notConfiguredCount + b.draft.length > 0 || b.scheduled.length > 0 || showClosedBeat

    body = (
      <>
        {anchor}
        {hasBeats && (
          <Beats label="Also in this term">
            <SetupBeat b={b} term={term} />
            <ScheduledBeat b={b} term={term} />
            {showClosedBeat && <ClosedBeat b={b} term={term} />}
          </Beats>
        )}
      </>
    )
  }

  return (
    <Card className={className}>
      <CardTop term={term} position="current" />
      <CardContent className="flex flex-col gap-3">{body}</CardContent>
      <CardBottom breakdown={b} term={term} />
    </Card>
  )
}

/* ── Last term — retrospective. Story: how it landed, what's still hanging. ─ */

function LastCard({ snap, breakdown }: { snap: TermSnapshot; breakdown: CourseBreakdown | null }) {
  const { term } = snap
  const b = breakdown
  const noCourses = (snap.coverage?.total ?? 0) === 0
  const noEvaluations = !noCourses && snap.total === 0

  let body: React.ReactNode

  if (noCourses) {
    body = (
      <EmptyAnchor
        icon="fa-layer-group"
        lead={<>This term finished without any course offerings on record.</>}
        support="Nothing was evaluated, and there's no history to review."
        action={AddCoursesAction}
      />
    )
  } else if (noEvaluations || !b) {
    body = (
      <EmptyAnchor
        icon="fa-square-poll-vertical"
        lead={<>The term ended without a single evaluation going out.</>}
        support={<><Num>{snap.coverage?.total ?? 0}</Num> courses ran and none were evaluated, so there&apos;s no feedback to review.</>}
        action={<RowAction href={`/course-evaluation/term/${term.id}`} primary icon="fa-pen-ruler">Open the term</RowAction>}
      />
    )
  } else {
    const stragglers = b.notConfiguredCount + b.draft.length + b.scheduled.length
    const closedRate = weightedRate(b.closed)
    const onTarget = closedRate != null && closedRate >= RESPONSE_TARGET

    /* Retrospective, so: no urgent wash, no countdown. The flag — when there
       is one — is the sentence itself, which is why the production
       "Needs attention" StatusBadge is gone from this variant. */
    const anchor = stragglers > 0 ? (
      <Anchor
        icon="fa-triangle-exclamation"
        tint={LIST_HUB_STATUS_TINT_WARNING}
        lead={<>The term ended with <Num>{stragglers}</Num> {stragglers === 1 ? 'course that never collected' : 'courses that never collected'} anything.</>}
        support={
          b.closed.length > 0 && closedRate != null ? (
            <>The <Num>{b.closed.length}</Num> that did finish averaged <Num>{closedRate}%</Num>, {onTarget ? 'above' : 'below'} the {RESPONSE_TARGET}% target.</>
          ) : (
            <>Nothing was collected for this term at all.</>
          )
        }
      />
    ) : (
      <Anchor
        icon="fa-flag-checkered"
        tint={onTarget ? LIST_HUB_STATUS_TINT_SUCCESS : LIST_HUB_STATUS_TINT_WARNING}
        lead={
          /* "The 1 course finished collecting at 88%" was the first live
             render — a single-course term is common enough in the demo
             accounts that the singular needs its own phrasing, not a
             number-plus-noun swap. */
          b.totalCourses === 1 ? (
            closedRate != null
              ? <>Its one course finished collecting at <Num>{closedRate}%</Num>.</>
              : <>Its one course finished collecting.</>
          ) : closedRate != null ? (
            <>All <Num>{b.totalCourses}</Num> courses finished collecting at <Num>{closedRate}%</Num>.</>
          ) : (
            <>All <Num>{b.totalCourses}</Num> courses finished collecting.</>
          )
        }
        support={
          closedRate != null ? (
            <>
              That&apos;s <Num>{Math.abs(closedRate - RESPONSE_TARGET)}</Num> points {onTarget ? 'above' : 'below'} the {RESPONSE_TARGET}% target.
              {' '}Feedback is ready whenever you want to read it.
            </>
          ) : undefined
        }
        action={
          <RowAction href={`/course-evaluation/term/${term.id}?tab=finished`} primary icon="fa-share-from-square">
            Review feedback
          </RowAction>
        }
      />
    )

    /* Data-derived, not JSX-derived — see the same note on the Current card. */
    const showClosedBeat = stragglers > 0 && b.closed.length > 0
    const hasBeats = stragglers > 0 || b.live.length > 0 || showClosedBeat

    body = (
      <>
        {anchor}
        {hasBeats && (
          <Beats label="Still open from this term">
            <SetupBeat b={b} term={term} />
            <ScheduledBeat b={b} term={term} />
            <LiveBeat b={b} term={term} />
            {showClosedBeat && <ClosedBeat b={b} term={term} />}
          </Beats>
        )}
      </>
    )
  }

  return (
    <Card>
      <CardTop term={term} position="last" />
      <CardContent className="flex flex-col gap-3">{body}</CardContent>
      <CardBottom
        breakdown={b}
        term={term}
        label="View analytics"
        href={`/analytics?tab=term&term=${encodeURIComponent(term.name)}`}
      />
    </Card>
  )
}

/* ── Upcoming term — prep. Story: is it ready, what's the next step. ──────── */

function UpcomingCard({ snap, breakdown }: { snap: TermSnapshot; breakdown: CourseBreakdown | null }) {
  const { term } = snap
  const b = breakdown
  const [datesOpen, setDatesOpen] = useState(false)

  const dated = !!term.startDate && !!term.endDate
  const startsIn = dated
    ? Math.max(0, Math.ceil((parseDate(term.startDate).getTime() - Date.now()) / 86_400_000))
    : null
  const noCourses = dated && (snap.coverage?.total ?? 0) === 0
  const noEvaluations = dated && !noCourses && snap.total === 0
  const readiness = auditTerm(term.id)

  let body: React.ReactNode

  if (!dated) {
    body = (
      <EmptyAnchor
        icon="fa-calendar-plus"
        lead={<>This term has no dates yet, so its evaluation window can&apos;t be set.</>}
        support="Start and end dates are what everything else here is scheduled against."
        action={
          <Button variant="ghost" size="sm" className="text-primary hover:text-primary" onClick={() => setDatesOpen(true)}>
            <i className="fa-light fa-calendar-plus" aria-hidden="true" />
            Add term dates
          </Button>
        }
      />
    )
  } else if (noCourses) {
    body = (
      <EmptyAnchor
        icon="fa-layer-group"
        lead={<>No course offerings have come through for this term yet.</>}
        support={startsIn != null ? <>It starts in <Num>{startsIn}</Num> days, and there&apos;s nothing to evaluate until courses land.</> : undefined}
        action={AddCoursesAction}
      />
    )
  } else if (noEvaluations || !b) {
    body = (
      <EmptyAnchor
        icon="fa-square-poll-vertical"
        lead={<><Num>{snap.coverage?.total ?? 0}</Num> courses are lined up, and none have an evaluation yet.</>}
        support={startsIn != null ? <>The term starts in <Num>{startsIn}</Num> days — setting them up now means they open on their own.</> : undefined}
        action={<RowAction href={`/surveys/push?term=${term.id}`} primary icon="fa-plus">Set up evaluations</RowAction>}
      />
    )
  } else {
    const covered = isFullyCovered(b)
    const pct = coveragePercent(b)
    /* Same compound urgency shape term-breakdown.tsx uses for its Setup row —
       imminent start AND low coverage, never "upcoming term with work left",
       which is every upcoming term by definition. */
    const urgent = startsIn != null && startsIn <= 14 && pct < 50

    const anchor = covered ? (
      <Anchor
        icon="fa-circle-check"
        tint={LIST_HUB_STATUS_TINT_SUCCESS}
        lead={
          startsIn != null
            ? <>Every course is ready, and the term starts in <Num>{startsIn}</Num> days.</>
            : <>Every course already has an evaluation ready.</>
        }
        support={
          <>
            {scheduledDetail(b.scheduled) ?? 'Nothing further is needed to open them.'}
            {readiness.needsData > 0 && (
              <> Faculty or student rosters are still missing on <Num>{readiness.needsData}</Num> of them.</>
            )}
          </>
        }
      />
    ) : (
      <Anchor
        icon="fa-list-check"
        tint={urgent ? LIST_HUB_STATUS_TINT_WARNING : LIST_HUB_STATUS_TINT_PLANNED}
        lead={
          startsIn != null
            ? <>The term starts in <Num>{startsIn}</Num> days with <Num>{pct}%</Num> of its courses ready.</>
            : <><Num>{pct}%</Num> of this term&apos;s courses are ready to be evaluated.</>
        }
        support={
          /* One sentence, not two fragments — the first live render read
             "11 courses haven't started. DPT-501, DPT-502, DPT-503 and 8
              others still need work.", which said the same thing twice with
             a full stop between the claim and its own evidence. */
          <>
            {coverageDetail(b.notConfiguredCount, b.draft.length)?.replace(/\.$/, '')}
            {' — '}
            <CodeList codes={coverageCodes(b.notConfiguredCodes, b.draft)} />.
          </>
        }
        urgent={urgent}
        action={
          <RowAction href={`/surveys/push?term=${term.id}`} primary icon="fa-plus">
            {snap.draftCount > 0 ? 'Resume setup' : 'Set up evaluations'}
          </RowAction>
        }
      />
    )

    /* Live/Closed are logically impossible before a term starts — this card
       only ever tells prep beats, regardless of what the mock data says. */
    const showDataGap = readiness.needsData > 0 && !covered
    const hasBeats = b.scheduled.length > 0 || showDataGap
    const dataGap = showDataGap ? (
      <Beat
        icon="fa-triangle-exclamation"
        tint={LIST_HUB_STATUS_TINT_WARNING}
        sentence={
          <>
            <Num>{readiness.needsData}</Num> of <Num>{readiness.total}</Num> {readiness.total === 1 ? 'offering is' : 'offerings are'} missing
            faculty or student rosters, so their evaluations have no one to send to.
          </>
        }
        action={
          <RowAction href="/course-evaluation/term-setup?phase=readiness" icon="fa-circle-plus">
            Add info
          </RowAction>
        }
      />
    ) : null

    body = (
      <>
        {anchor}
        {hasBeats && (
          <Beats label="Before it starts">
            {dataGap}
            <ScheduledBeat b={b} term={term} />
          </Beats>
        )}
      </>
    )
  }

  return (
    <Card>
      <CardTop term={term} position="upcoming" showWindow={false} />
      <CardContent className="flex flex-col gap-3">
        {dated && (
          <p className="text-xs text-muted-foreground">
            {fmtDate(term.startDate)} – {fmtDate(term.endDate)}
          </p>
        )}
        {body}
      </CardContent>
      <CardBottom breakdown={b} term={term} label="View workspace" />
      <AddTermDatesDrawer term={term} open={datesOpen} onOpenChange={setDatesOpen} />
    </Card>
  )
}

/* ── the triptych ────────────────────────────────────────────────────────── */

export default function VariantNarrative() {
  const { surveys, programTerms, templates } = usePce()

  /* Slot selection is production's, verbatim (dashboard-home.tsx) — this
     variant redesigns the CARD, not which term lands in which column, so the
     three variants stay comparable against the same real data. */
  const ordered = useMemo(
    () => [...programTerms].sort((a, b) => a.startDate.localeCompare(b.startDate)),
    [programTerms],
  )
  const today = useMemo(() => new Date().toISOString().slice(0, 10), [])
  const ce = useMemo(
    () => surveys.filter((s) => !s.surveyType || s.surveyType === 'course_evaluation'),
    [surveys],
  )

  const currentTerms = useMemo(
    () => ordered.filter((t) => classifyTermWindow(t, today) === 'current'),
    [ordered, today],
  )
  /* Last is capped to ONE card (Vishal, transcript 7a175890: "last should be
     the first card" — singular). */
  const lastTerms = useMemo(() => {
    const candidates = ordered.filter((t) => classifyTermWindow(t, today) === 'last')
    const mostRecent = [...candidates].sort((a, b) => b.endDate.localeCompare(a.endDate))[0]
    return mostRecent ? [mostRecent] : []
  }, [ordered, today])
  const upcomingTerms = useMemo(
    () => ordered.filter((t) => classifyTermWindow(t, today) === 'upcoming'),
    [ordered, today],
  )

  const currentSnaps = useMemo(() => currentTerms.map((t) => snapshot(t, ce)), [currentTerms, ce])
  const lastSnaps = useMemo(() => lastTerms.map((t) => snapshot(t, ce)), [lastTerms, ce])
  const upcomingSnaps = useMemo(() => upcomingTerms.map((t) => snapshot(t, ce)), [upcomingTerms, ce])

  const breakdownForSnap = (snap: TermSnapshot) => breakdownFor(snap.term, ce)

  if (currentSnaps.length === 0 && lastSnaps.length === 0 && upcomingSnaps.length === 0) {
    return (
      <p className="rounded-lg border border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
        This account has no term in the last, current, or upcoming window right now.
      </p>
    )
  }

  return (
    /* Explicit grid-column per slot — auto-placement drops a lone Current
       card into the narrow track 1 (found live on Brightwater OT). */
    <div className="grid grid-cols-1 items-stretch gap-4 lg:grid-cols-[1fr_1.35fr_1fr]">
      {lastSnaps.length > 0 && (
        <div className="flex flex-col gap-4 lg:[grid-column:1]">
          {lastSnaps.map((s) => (
            <LastCard key={s.term.id} snap={s} breakdown={breakdownForSnap(s)} />
          ))}
        </div>
      )}
      {currentSnaps.length > 0 && (
        <div className="flex flex-col gap-4 lg:[grid-column:2]">
          {currentSnaps.map((s) => (
            <CurrentCard
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
            <UpcomingCard key={s.term.id} snap={s} breakdown={breakdownForSnap(s)} />
          ))}
        </div>
      )}
    </div>
  )
}
