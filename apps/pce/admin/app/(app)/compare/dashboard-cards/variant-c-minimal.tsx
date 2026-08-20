'use client'

// ============================================================================
// Term-card triptych — VARIANT C: MINIMAL.
//
// Direction: radical reduction. The dashboard card's job is TRIAGE, not
// reporting. The term workspace (/course-evaluation/term/[id]) already carries
// the KPI strip, the full evaluation table, and per-row actions — so anything
// a scanning admin doesn't need in order to decide "do I click this?" is
// deliberately deferred to that page.
//
// This variant leans directly into the loudest recurring note in
// term-breakdown.tsx's own header (third pass, Romit): "buttons are making it
// really difficult and asking for too much attention... is there a better
// way." The prior answer was quieter controls. This variant's answer is FEWER
// things: one number, at most two sentences, one button.
//
// Anatomy, identical on all three cards so the row scans as one system:
//   1. Term name (links to workspace) + position badge.
//   2. ONE quiet temporal line — the only date fact on the card.
//   3. ONE dominant number + a caption that says what it is.
//   4. AT MOST TWO attention sentences, rendered only when something is
//      genuinely wrong. This is the reduction's safety valve: minimal is not
//      allowed to be silent about a decision-changing fact, so at-risk
//      courses / imminent-start-with-low-coverage / unfinished setup still
//      surface — as prose, with the single amber accent on the card, instead
//      of competing with five sibling rows for attention.
//   5. ONE primary Button, whose label changes with the card's actual top job.
//   6. A quiet per-bucket list (`BucketList`) — one row per status bucket that
//      actually exists on the term, each with its own real action.
//
// Second pass (design review, Romit): 1–5 above read as INCOMPLETE, not
// minimal. Reducing each card to a single blanket button means an admin who
// needs to act on a bucket OTHER than the card's headline case (extend a
// scheduled course, manage a draft, review a closed bucket's feedback) has no
// affordance at all — which is the exact complaint that started this review
// ("card rows aren't clear for the user to operate and take actions"). The fix
// for unclear rows can't be "delete the rows."
//
// So the bucket rows come back, but the reduction is spent on CHROME rather
// than on FUNCTION. Against production's `TermBreakdown`, each row here drops:
// the leading status icon, the `Setup` / `Collecting responses` group labels,
// the per-row hairline separators, the `CourseChips` Badge pills (course codes
// are inline prose via `namedCourses`, which is one visual object instead of
// N), the `RowCountdown` chips, the coverage-percent sub-row, and the
// per-row narrative sentence (the `Attention` block above already carries the
// one that matters). What it keeps is the part that was never the problem: a
// real DS action per row, reusing production's own exported `RowAction`
// (`Button variant="ghost" size="sm"`) rather than a hand-rolled link.
//
// The urgent wash is kept at production's own doctrine — compound conditions
// only (Live with at-risk courses; Upcoming Setup with an imminent start AND
// low coverage), never by row type — but WITHOUT the duplicated consequence
// sentence, since the `Attention` block already states it in prose. The wash's
// job here is purely to tie that sentence to the row it's about.
//
// The dominant number is different per card because the decision is:
//   Last     — anything still outstanding? (count) else how it landed (rate).
//   Current  — response rate. The product's #1 goal metric (Vishal,
//              transcript 7a175890: "the response rate is high") — it is the
//              single largest thing on the hero card, never buried.
//   Upcoming — evaluation coverage %. "Is this term ready to go." The
//              countdown moves up to the temporal line (2) rather than
//              competing as a second big number.
//
// DELIBERATELY DEFERRED to the term workspace (not lost — one click away):
//   per-course hover-cards, row overflow menus, the footer bucket summary
//   ("2 need setup · 3 live · 13 total"), the academic year, the evaluation
//   window range, survey dates, course-offering counts, and the response-rate
//   progress bar (a bar next to a 48pt number is the same fact drawn twice).
//
// Colour discipline: exactly one accent per card, and only when earned — the
// warning tint from lib/list-status-badges.ts (amber family, never red, per
// aarti_no_red). A calm card has no colour on it at all.
// ============================================================================

import { useMemo, useState } from 'react'
import Link from 'next/link'
import {
  Button,
  StatusBadge,
  Card, CardContent, CardHeader,
} from '@exxatdesignux/ui'
import type { StatusBadgeTone } from '@exxatdesignux/ui'
import { usePce } from '@/components/pce/pce-state'
import { AddTermDatesDrawer } from '@/components/pce/add-term-drawer'
/* Production's own row action — a real DS `Button variant="ghost" size="sm"`,
   settled in term-breakdown.tsx's eleventh pass. Reused rather than
   re-invented so this variant's rows can't drift into a hand-rolled link. */
import { RowAction } from '@/components/pce/term-breakdown'
import { LIST_HUB_STATUS_TINT_WARNING } from '@/lib/list-status-badges'
import { auditTerm } from '@/lib/pce-term-readiness'
import { prismCoursesHref } from '@/lib/pce-course-readiness'
import { AT_RISK_THRESHOLD } from '@/lib/pce-at-risk'
import {
  RESPONSE_TARGET,
  classifyTermWindow, snapshot, breakdownFor, coveragePercent,
  coverageCodes, coverageUrgentConsequence, liveAtRiskCodes,
  coverageLead, coverageDetail,
  scheduledLead, scheduledDetail,
  liveLead, liveNarrative, closedNarrative,
  type TermSnapshot, type TermWindowPosition, type CourseBreakdown,
} from '@/lib/pce-term-metrics'
import type { ProgramTerm } from '@/lib/pce-mock-data'

/* ── shared model ─────────────────────────────────────────────────────────── */

type TermPosition = Exclude<TermWindowPosition, 'future'>

const POSITION_BADGE: Record<TermPosition, { label: string; tone: StatusBadgeTone }> = {
  current:  { label: 'Current',   tone: 'success' },
  last:     { label: 'Last term', tone: 'neutral' },
  upcoming: { label: 'Upcoming',  tone: 'info' },
}

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`

/** Up to three course codes as prose, then "and N more" — the identifiability
 *  fact (which courses?) without the chip row that carries it in production.
 *  Chips are a list; this is a clause inside a sentence, which is what keeps
 *  the attention line to a single visual object. */
function namedCourses(codes: string[], max = 3): string {
  if (codes.length === 0) return ''
  const shown = codes.slice(0, max)
  const rest = codes.length - shown.length
  const list = shown.join(', ')
  return rest > 0 ? `${list} and ${rest} more` : list
}

/** The single card action. Either an internal route, an external href (Prism
 *  course setup opens in a new tab), or a local handler (the dates drawer). */
type CardAction =
  | { label: string; href: string; external?: boolean; ariaLabel?: string }
  | { label: string; onClick: () => void; ariaLabel?: string }

/** Everything one card renders. Building this first, then rendering it, is
 *  what keeps the three cards structurally identical while letting each one
 *  choose a different dominant fact. */
interface CardModel {
  /** The one temporal line under the title. */
  meta: string
  /** The dominant number. `null` when the term has nothing to measure yet —
   *  `fallback` speaks instead, so an empty card is a sentence and a button,
   *  never a centred icon-and-heading placeholder. */
  metric: { value: string; caption: string } | null
  fallback: string | null
  /** Max two. Empty on a healthy card — that's the point. */
  attention: string[]
  action: CardAction
  /** The operable layer under the summary — one entry per status bucket that
   *  actually exists on this term. Omitted (not empty-stated) on the cards
   *  whose fallback already explains why there's nothing to break down: no
   *  courses, no templates, no term dates. */
  buckets?: Bucket[]
}

/** One status bucket that exists on the term, with its own real action.
 *  Deliberately flatter than production's `BreakdownRow` props — no icon, no
 *  tint, no countdown chip, no narrative: the summary layer above already
 *  carries urgency as prose, so a row only needs to say WHAT the bucket is,
 *  WHICH courses are in it, and offer the one thing you'd do about it. */
interface Bucket {
  key: string
  /** Short lead with the count — production's own `coverageLead`/
   *  `scheduledLead`/`liveLead` strings, so both surfaces word the same
   *  bucket identically. */
  label: string
  codes: string[]
  /** Full-sentence equivalent of the row for screen readers — collapsing the
   *  detail into a count and a code list shouldn't cost the sentence. */
  srSummary?: string
  action: { label: string; href: string; icon: string }
  /** Compound-urgent only, per production's doctrine (time-bound AND
   *  something genuinely wrong) — never by bucket type. */
  urgent?: boolean
}

/* ── card primitives ──────────────────────────────────────────────────────── */

function TitleRow({ term, position }: { term: ProgramTerm; position: TermPosition }) {
  const badge = POSITION_BADGE[position]
  return (
    <div className="flex min-w-0 items-start justify-between gap-3">
      <h2 className="min-w-0 truncate text-base font-medium leading-snug">
        <Link
          href={`/course-evaluation/term/${term.id}`}
          aria-label={`Open ${term.name} workspace`}
          className="rounded-sm text-foreground hover:underline underline-offset-2 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          {term.name}
        </Link>
      </h2>
      <StatusBadge label={badge.label} tone={badge.tone} />
    </div>
  )
}

/** One dominant number. `hero` is the current-term card's larger size — the
 *  only place the triptych's visual hierarchy is expressed as scale rather
 *  than position. */
function Metric({
  value, caption, hero = false,
}: {
  value: string
  caption: string
  hero?: boolean
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <span
        className={
          'font-semibold tabular-nums leading-none tracking-tight text-foreground ' +
          (hero ? 'text-5xl' : 'text-4xl')
        }
      >
        {value}
      </span>
      <span className="text-sm text-muted-foreground">{caption}</span>
    </div>
  )
}

/** The only place colour appears on a card, and only when a fact would change
 *  the reader's decision. Amber family (never red, per aarti_no_red): the icon
 *  carries the tint, the sentence stays `--foreground` so it reads as prose
 *  rather than as a coloured alert box. */
function Attention({ lines }: { lines: string[] }) {
  if (lines.length === 0) return null
  return (
    <div className="flex flex-col gap-1.5">
      {lines.map((line) => (
        <p key={line} className="flex items-start gap-2 text-sm text-foreground">
          <i
            className="fa-light fa-triangle-exclamation mt-0.5 shrink-0"
            style={{ color: LIST_HUB_STATUS_TINT_WARNING.fg, fontSize: 12 }}
            aria-hidden="true"
          />
          {line}
        </p>
      ))}
    </div>
  )
}

/** One bucket row. Everything about it is set at "quieter than production":
 *  11–12px type, `py-1` instead of `py-2`, no leading icon, no per-row
 *  hairline, course codes as one inline clause rather than a row of Badge
 *  pills. The one thing NOT reduced is the action — `RowAction` is
 *  production's real DS ghost Button, imported, not restyled, because a row
 *  you can't operate is what made the previous pass read as unfinished.
 *
 *  `urgent` reuses the same reserved warning tint as production (amber
 *  family, never red per aarti_no_red) as a flat wash + left accent — no
 *  border, no shadow, no card-in-card chrome. Unlike production it carries no
 *  consequence sentence: the `Attention` block above already says it, and
 *  saying it twice on a card whose whole thesis is reduction is the worst of
 *  both designs. */
function BucketRow({ bucket }: { bucket: Bucket }) {
  const { label, codes, srSummary, action, urgent } = bucket
  return (
    <div
      className={
        'flex items-center justify-between gap-3 py-1' +
        (urgent ? ' -mx-2.5 rounded-md border-l-2 px-2.5 py-1.5' : '')
      }
      style={
        urgent
          ? { background: LIST_HUB_STATUS_TINT_WARNING.bg, borderLeftColor: LIST_HUB_STATUS_TINT_WARNING.border }
          : undefined
      }
    >
      <div className="flex min-w-0 flex-col gap-0.5">
        <p className="truncate text-xs font-medium text-foreground">{label}</p>
        {codes.length > 0 && (
          <p className="truncate text-[11px] text-muted-foreground">{namedCourses(codes)}</p>
        )}
        {srSummary && <span className="sr-only">{srSummary}</span>}
      </div>
      <div className="-my-1 shrink-0">
        <RowAction href={action.href} primary icon={action.icon}>
          {action.label}
        </RowAction>
      </div>
    </div>
  )
}

/** The bucket list sits BELOW the summary layer (number → attention →
 *  primary button), separated by a single hairline — one separator for the
 *  whole list instead of production's one per row. The summary answers "do I
 *  click this card?"; this answers "and if the thing I care about isn't the
 *  headline, what do I do about it?". */
function BucketList({ buckets }: { buckets: Bucket[] }) {
  if (buckets.length === 0) return null
  return (
    <div className="flex flex-col gap-0.5 border-t border-border/60 pt-3">
      {buckets.map((b) => (
        <BucketRow key={b.key} bucket={b} />
      ))}
    </div>
  )
}

/** One button per card. Text-only per feedback_no_icons_action_buttons —
 *  `variant="outline"` so it reads as the card's single affordance without
 *  pulling brand weight away from the page-level primary CTA. */
function CardActionButton({ action }: { action: CardAction }) {
  if ('onClick' in action) {
    return (
      <Button variant="outline" size="sm" className="self-start" onClick={action.onClick} aria-label={action.ariaLabel}>
        {action.label}
      </Button>
    )
  }
  return (
    <Button variant="outline" size="sm" asChild className="self-start">
      {action.external ? (
        <a href={action.href} target="_blank" rel="noopener noreferrer" aria-label={action.ariaLabel}>
          {action.label}
        </a>
      ) : (
        <Link href={action.href} aria-label={action.ariaLabel}>
          {action.label}
        </Link>
      )}
    </Button>
  )
}

/** The shell every card shares — the whole point of the variant is that Last,
 *  Current and Upcoming differ only in the CONTENT of these five slots, never
 *  in their anatomy. */
function MinimalTermCard({
  term, position, model, hero = false, children,
}: {
  term: ProgramTerm
  position: TermPosition
  model: CardModel
  hero?: boolean
  /** Drawer portals etc. — never visible layout. */
  children?: React.ReactNode
}) {
  return (
    <Card>
      <CardHeader>
        <TitleRow term={term} position={position} />
        <p className="text-xs text-muted-foreground">{model.meta}</p>
      </CardHeader>
      {/* py-6/py-8 is the variant's deliberate whitespace: the number gets a
          band of empty space that nothing else on the card competes for. */}
      <CardContent className="flex flex-col gap-6">
        <div className={hero ? 'py-8' : 'py-6'}>
          {model.metric ? (
            <Metric value={model.metric.value} caption={model.metric.caption} hero={hero} />
          ) : (
            <p className="text-sm text-muted-foreground">{model.fallback}</p>
          )}
        </div>
        <Attention lines={model.attention} />
        <CardActionButton action={model.action} />
        <BucketList buckets={model.buckets ?? []} />
      </CardContent>
      {children}
    </Card>
  )
}

/* ── per-card models ──────────────────────────────────────────────────────── */

const workspaceHref = (termId: string, tab: 'active' | 'finished') =>
  `/course-evaluation/term/${termId}?tab=${tab}`

/** Turns a `CourseBreakdown` into the card's operable rows — the same four
 *  buckets production's `TermBreakdown` renders (Setup = not-configured +
 *  draft, Scheduled, Live, Closed), only the ones that actually exist, worded
 *  with production's own lead strings so the two surfaces never describe the
 *  same bucket differently.
 *
 *  Actions map 1:1 to production's: Setup → the push wizard, Scheduled →
 *  the workspace's active tab, Live → the reminder flow, Closed → the
 *  workspace's finished tab. Labels are one word shorter than production's
 *  ("Set up", not "Set up evaluations") because the row's own label already
 *  named the subject — but the destinations are identical, so nothing here is
 *  a decorative affordance.
 *
 *  `hideCollection` mirrors production's `hideLiveAndClosed`: a term that
 *  hasn't started can't have live or closed evaluations, regardless of what
 *  the mock data says. */
function buildBuckets(
  term: ProgramTerm,
  breakdown: CourseBreakdown | null,
  opts: { hideCollection?: boolean; setupUrgent?: boolean } = {},
): Bucket[] {
  if (!breakdown) return []
  const b = breakdown
  const out: Bucket[] = []

  const setupTotal = b.notConfiguredCount + b.draft.length
  const setupLabel = coverageLead(b.notConfiguredCount, b.draft.length)
  if (setupTotal > 0 && setupLabel) {
    out.push({
      key: 'setup',
      label: setupLabel,
      codes: coverageCodes(b.notConfiguredCodes, b.draft),
      srSummary: coverageDetail(b.notConfiguredCount, b.draft.length) ?? undefined,
      action: { label: 'Set up', href: `/surveys/push?term=${term.id}`, icon: 'fa-plus' },
      urgent: !!opts.setupUrgent,
    })
  }

  const scheduledLabel = scheduledLead(b.scheduled)
  if (b.scheduled.length > 0 && scheduledLabel) {
    out.push({
      key: 'scheduled',
      label: scheduledLabel,
      codes: b.scheduled.map((s) => s.courseCode),
      srSummary: scheduledDetail(b.scheduled) ?? undefined,
      action: { label: 'Manage', href: workspaceHref(term.id, 'active'), icon: 'fa-pen-ruler' },
    })
  }

  if (!opts.hideCollection) {
    const liveLabel = liveLead(b.live)
    if (b.live.length > 0 && liveLabel) {
      out.push({
        key: 'live',
        label: liveLabel,
        codes: b.live.map((s) => s.courseCode),
        srSummary: liveNarrative(b.live) ?? undefined,
        action: { label: 'Remind', href: `/surveys/remind?from=term:${term.id}`, icon: 'fa-bell' },
        /* Production's Live-urgent trigger, unchanged: at-risk courses on a
           bucket that is by definition time-bound (it's closing). */
        urgent: liveAtRiskCodes(b.live).size > 0,
      })
    }
    if (b.closed.length > 0) {
      out.push({
        key: 'closed',
        label: `${b.closed.length} of ${plural(b.totalCourses, 'course')} closed`,
        codes: b.closed.map((s) => s.courseCode),
        srSummary: closedNarrative(b.closed) ?? undefined,
        action: { label: 'Review', href: workspaceHref(term.id, 'finished'), icon: 'fa-share-from-square' },
      })
    }
  }

  return out
}

/** Course setup lives in Prism, not here — same external deep link the
 *  production cards use for their "No courses found" state. */
const noCoursesAction = (): CardAction => ({
  label: 'Add courses',
  href: prismCoursesHref(),
  external: true,
})

/** LAST — retrospective. The decision is "is anything still hanging?", so the
 *  dominant number is the count of courses that ended mid-setup when there is
 *  one, and the term's final response rate when there isn't. */
function lastModel(snap: TermSnapshot, breakdown: CourseBreakdown | null): CardModel {
  const { term } = snap
  const noCourses = (snap.coverage?.total ?? 0) === 0
  const ended = term.endDate
    ? `Ended ${new Date(`${term.endDate}T00:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
    : 'Term dates not set'

  if (noCourses) {
    return {
      meta: ended,
      metric: null,
      fallback: 'No courses were offered in this term, so nothing was evaluated.',
      attention: [],
      action: noCoursesAction(),
    }
  }
  if (!breakdown || snap.total === 0) {
    return {
      meta: ended,
      metric: { value: '0', caption: `of ${plural(snap.coverage?.total ?? 0, 'course')} evaluated` },
      fallback: null,
      attention: ['This term closed without any evaluations being sent.'],
      action: { label: 'Open term', href: workspaceHref(term.id, 'active'), ariaLabel: `Open ${term.name} workspace` },
      buckets: buildBuckets(term, breakdown),
    }
  }

  const outstanding = breakdown.notConfiguredCount + breakdown.draft.length + breakdown.scheduled.length
  if (outstanding > 0) {
    const codes = namedCourses([
      ...coverageCodes(breakdown.notConfiguredCodes, breakdown.draft),
      ...breakdown.scheduled.map((s) => s.courseCode),
    ])
    return {
      meta: ended,
      metric: {
        value: String(outstanding),
        caption: outstanding === 1 ? 'course left unfinished' : 'courses left unfinished',
      },
      fallback: null,
      attention: [`The term is over but ${codes} never finished collecting.`],
      action: { label: 'Open term', href: workspaceHref(term.id, 'active'), ariaLabel: `Open ${term.name} workspace` },
      buckets: buildBuckets(term, breakdown),
    }
  }

  return {
    meta: ended,
    metric:
      snap.rate != null
        ? { value: `${snap.rate}%`, caption: 'final response rate' }
        : { value: `${breakdown.closed.length}`, caption: `of ${plural(breakdown.totalCourses, 'course')} evaluated` },
    fallback: null,
    attention: [],
    action: { label: 'Review results', href: workspaceHref(term.id, 'finished'), ariaLabel: `Review ${term.name} results` },
    buckets: buildBuckets(term, breakdown),
  }
}

/** CURRENT — the hero. The dominant number is always the response rate once
 *  anything is collecting, because that is the product's goal metric. */
function currentModel(
  snap: TermSnapshot,
  breakdown: CourseBreakdown | null,
  noTemplates: boolean,
): CardModel {
  const { term } = snap
  const meta =
    snap.daysLeft != null
      ? `Evaluation window closes in ${plural(snap.daysLeft, 'day')}`
      : 'Evaluation window open'
  const noCourses = (snap.coverage?.total ?? 0) === 0

  if (noTemplates) {
    return {
      meta,
      metric: null,
      fallback: 'No survey templates exist yet. Evaluations cannot go out until one does.',
      attention: [],
      action: { label: 'Create template', href: '/templates/new' },
    }
  }
  if (noCourses) {
    return {
      meta,
      metric: null,
      fallback: 'No courses found for this term.',
      attention: [],
      action: noCoursesAction(),
    }
  }
  if (!breakdown || snap.total === 0) {
    return {
      meta,
      metric: { value: `${snap.coverage?.total ?? 0}`, caption: 'courses waiting on an evaluation' },
      fallback: null,
      attention: ['Nothing is collecting yet. The window is already open.'],
      action: {
        label: 'Schedule evaluations',
        href: `/surveys/push?term=${term.id}`,
        ariaLabel: `Schedule evaluations for ${term.name}`,
      },
      buckets: buildBuckets(term, breakdown),
    }
  }

  const atRiskCodes = liveAtRiskCodes(breakdown.live)
  const needSetup = breakdown.notConfiguredCount + breakdown.draft.length

  const attention: string[] = []
  if (atRiskCodes.size > 0) {
    attention.push(
      `${atRiskCodes.size} of ${plural(breakdown.live.length, 'live course')} sit below ${AT_RISK_THRESHOLD}% — ${namedCourses([...atRiskCodes].sort())}.`,
    )
  } else if (snap.rate != null && snap.rate < RESPONSE_TARGET && snap.daysLeft != null && snap.daysLeft <= 7) {
    attention.push(`Only ${plural(snap.daysLeft, 'day')} left to close the gap to the ${RESPONSE_TARGET}% target.`)
  }
  if (needSetup > 0 && attention.length < 2) {
    attention.push(
      `${plural(needSetup, 'course')} in this term still ${needSetup === 1 ? 'has' : 'have'} no evaluation set up.`,
    )
  }

  const action: CardAction =
    atRiskCodes.size > 0
      ? {
          label: 'Send reminders',
          href: `/surveys/remind?from=term:${term.id}`,
          ariaLabel: `Send reminders for ${term.name}`,
        }
      : needSetup > 0
        ? {
            label: 'Set up evaluations',
            href: `/surveys/push?term=${term.id}`,
            ariaLabel: `Set up evaluations for ${term.name}`,
          }
        : { label: 'Open term', href: workspaceHref(term.id, 'active'), ariaLabel: `Open ${term.name} workspace` }

  return {
    meta,
    metric:
      snap.rate != null
        ? { value: `${snap.rate}%`, caption: `average response rate · ${RESPONSE_TARGET}% target` }
        : { value: `${coveragePercent(breakdown)}%`, caption: 'of courses covered · nothing collecting yet' },
    fallback: null,
    attention,
    action,
    buckets: buildBuckets(term, breakdown),
  }
}

/** UPCOMING — readiness. Coverage % is the dominant number; the countdown is
 *  demoted to the temporal line so the card doesn't carry two big numerals
 *  that mean different things (the exact confusion the ninth-pass UX audit
 *  called out in production: "Starts in 5 days" next to "opens in 107 days"). */
function upcomingModel(
  snap: TermSnapshot,
  breakdown: CourseBreakdown | null,
  onAddDates: () => void,
): CardModel {
  const { term } = snap
  const dated = !!term.startDate && !!term.endDate
  const startsIn = dated
    ? Math.max(0, Math.ceil((new Date(`${term.startDate}T00:00:00`).getTime() - Date.now()) / 86_400_000))
    : null
  const meta = startsIn != null ? `Starts in ${plural(startsIn, 'day')}` : 'Term dates not set yet'

  if (!dated) {
    return {
      meta,
      metric: null,
      fallback: 'Nothing can be scheduled until this term has a start and end date.',
      attention: [],
      action: { label: 'Add term dates', onClick: onAddDates, ariaLabel: `Add dates for ${term.name}` },
    }
  }
  if ((snap.coverage?.total ?? 0) === 0) {
    return {
      meta,
      metric: null,
      fallback: 'No course offerings have been found for this term yet.',
      attention: [],
      action: noCoursesAction(),
    }
  }

  const coverage = breakdown ? coveragePercent(breakdown) : 0
  const readiness = auditTerm(term.id)
  const remaining = snap.coverage ? snap.coverage.total - snap.coverage.surveyed : 0

  const attention: string[] = []
  /* Same compound trigger production uses for the Setup row's urgent wash —
     imminent start AND low coverage, not "any upcoming term with work left"
     (every upcoming term has that by definition). */
  if (startsIn != null && startsIn <= 14 && coverage < 50) {
    attention.push(coverageUrgentConsequence(startsIn, coverage))
  }
  if (readiness.needsData > 0 && attention.length < 2) {
    attention.push(
      `${plural(readiness.needsData, 'course')} ${readiness.needsData === 1 ? 'is' : 'are'} missing faculty or student rosters.`,
    )
  }

  const action: CardAction =
    remaining > 0
      ? {
          label: snap.draftCount > 0 ? 'Resume setup' : 'Set up evaluations',
          href: `/surveys/push?term=${term.id}`,
          ariaLabel:
            snap.draftCount > 0
              ? `Resume evaluation setup for ${term.name}`
              : `Set up evaluations for ${term.name}`,
        }
      : { label: 'Open term', href: workspaceHref(term.id, 'active'), ariaLabel: `Open ${term.name} workspace` }

  return {
    meta,
    metric: { value: `${coverage}%`, caption: 'of courses ready to evaluate' },
    fallback: null,
    attention,
    action,
    /* Live/Closed are logically impossible before the term starts — same
       guard production applies via `hideLiveAndClosed`, rather than trusting
       mock data not to contain that combination. The Setup row inherits the
       exact compound urgency the `Attention` line above was built from, so
       the wash points at the row the sentence is about. */
    buckets: buildBuckets(term, breakdown, {
      hideCollection: true,
      setupUrgent: startsIn != null && startsIn <= 14 && coverage < 50,
    }),
  }
}

/* ── cards ────────────────────────────────────────────────────────────────── */

function LastCard({ snap, breakdown }: { snap: TermSnapshot; breakdown: CourseBreakdown | null }) {
  return <MinimalTermCard term={snap.term} position="last" model={lastModel(snap, breakdown)} />
}

function CurrentCard({
  snap, breakdown, noTemplates,
}: {
  snap: TermSnapshot
  breakdown: CourseBreakdown | null
  noTemplates: boolean
}) {
  return (
    <MinimalTermCard
      term={snap.term}
      position="current"
      hero
      model={currentModel(snap, breakdown, noTemplates)}
    />
  )
}

function UpcomingCard({ snap, breakdown }: { snap: TermSnapshot; breakdown: CourseBreakdown | null }) {
  const [datesOpen, setDatesOpen] = useState(false)
  return (
    <MinimalTermCard
      term={snap.term}
      position="upcoming"
      model={upcomingModel(snap, breakdown, () => setDatesOpen(true))}
    >
      <AddTermDatesDrawer term={snap.term} open={datesOpen} onOpenChange={setDatesOpen} />
    </MinimalTermCard>
  )
}

/* ── triptych ─────────────────────────────────────────────────────────────── */

export default function VariantMinimal() {
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

  /* Slot selection is production's, unchanged — this variant redesigns the
     card, not which term lands in which column. */
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

  return (
    <section className="flex flex-col gap-4" aria-label="Terms">
      {/* Explicit grid-column lines, not source order — a single-term account
          otherwise lands its one card in track 1 via auto-placement (found
          live on Brightwater OT in production). `items-start` lets each card
          stay its natural height: this variant's cards are short, and
          stretching them would manufacture the dead space the direction is
          trying to earn honestly. */}
      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[1fr_1.35fr_1fr]">
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
    </section>
  )
}
