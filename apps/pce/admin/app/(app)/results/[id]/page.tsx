'use client'

// ============================================================================
// /results/[id] — View Survey Results, Result Detail (Flow 4 · ST-15).
//
// Gating chain, evaluated in spec order for every viewer:
//   not-found → access-restricted (faculty, other's result) → locked
//   (!gradesSubmitted) → suppressed (< minimumThreshold) → pending coordinator
//   review (faculty only, !releasedToFaculty) → available (full detail).
//
// Decisions applied (Romit-approved brief, Jul 8 2026):
//   E1 — list default-sorts term desc + paginates (in /results).
//   E2 — option B: Program Directors get owner-equivalent access to AI
//        summary / top themes / recommendations while in Review mode.
//   E3 — option B: the Overview comments section receives the viewer's REAL
//        moderator status — PD hide/unhide works here (no dead tab).
//   Spec's toast on release → LocalBanner state flip (toast banned).
//   Spec's violet banner → LocalBanner info variant (no off-palette violet).
//   Spec's red coding → amber (aarti_no_red).
//
// DS OS: PageHeader · LocalBanner · Tabs · Card · Collapsible · StatusBadge ·
// PersonIdentityCell · ExportDrawer. AI insight card removed (Romit
// 2026-07-17). Theme viz: per-theme stacked rating bars (shared rating-viz).
// Mobbin: Zoom survey results (tabs + per-question) · Dovetail (themes) ·
// Gorgias (comments + download).
// ============================================================================

import { Fragment, Suspense, useMemo, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useResultsOrigin, withFrom } from '@/lib/pce-nav-origin'
import {
  PageHeader,
  Button,
  Badge,
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  LocalBanner,
  StatusBadge,
  AvatarInitials,
  PersonIdentityCell,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  ToggleGroup,
  ToggleGroupItem,
  ExportDrawer,
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  chartTooltipKeyboardSyncProps,
} from '@exxatdesignux/ui'
import type { ChartConfig } from '@exxatdesignux/ui'
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, ReferenceLine } from 'recharts'
import { ChartCard, ChartFigure, ChartDataTable, type ChartLeoInsight } from '@/components/charts-overview'
import { MiniRatingColumns, RatingLegend, RatingStackedBar } from '@/components/pce/rating-viz'
import { termCollectionSeries, paceToTarget } from '@/lib/pce-collection'
import { CHART_AXIS_TICK, CHART_TICK_FONT_SIZE } from '@/lib/chart-typography'
import { SiteHeader } from '@/components/site-header'
import { usePce } from '@/components/pce/pce-state'
import { EditEndDateDialog, SendReminderDialog } from '@/components/pce/pce-modals'
import { deriveResults, deriveResultsForSurvey, rateColor, scoreColor, facultyFacingState, EVAL_SCOPE_LABEL, RESULT_STATUS_BADGE, type EvalResult } from '@/lib/pce-results'
import { SurveyStatusBadgeOS } from '@/components/pce/pce-badges'
import { deriveThemes } from '@/lib/pce-themes'
import {
  MOCK_RESPONSES,
  MOCK_SURVEY_QUESTION_DATA,
  MOCK_OPEN_TEXT_RESPONSES,
  MOCK_PROGRAM_TERMS,
  medianFromDistribution,
  programAvgForQuestion,
  type PceSurvey,
  type PriorOffering,
  type ResponseComment,
  type PceTemplateSection,
} from '@/lib/pce-mock-data'

/* ── shared bits ──────────────────────────────────────────────────────────── */

/** Status gate — solid card with a tinted icon chip (pce-three anatomy: a
 *  STATUS, not an error). `tone` colors the chip icon; amber = in-flight. */
function GateScreen({
  icon,
  title,
  lines,
  tone = 'pending',
  children,
}: {
  icon: string
  title: string
  lines: string[]
  tone?: 'pending' | 'neutral'
  children?: React.ReactNode
}) {
  return (
    <div className="flex min-h-[min(360px,50vh)] max-w-4xl flex-col items-center justify-center gap-4 rounded-lg border border-border bg-card px-6 py-10">
      <span className="flex size-12 items-center justify-center rounded-full bg-muted" aria-hidden="true">
        <i
          className={`fa-light ${icon}`}
          style={{ fontSize: 20, color: tone === 'pending' ? 'var(--chip-4)' : 'var(--muted-foreground)' }}
        />
      </span>
      <div className="flex flex-col items-center gap-1.5">
        <h2 className="text-sm font-medium text-foreground">{title}</h2>
        {lines.map((l) => (
          <p key={l} className="text-sm text-muted-foreground" style={{ maxWidth: 420, textAlign: 'center' }}>
            {l}
          </p>
        ))}
      </div>
      {children ?? <GateBackButton />}
    </div>
  )
}

/** Default gate CTA — returns to the list the user actually came from. */
function GateBackButton() {
  const origin = useResultsOrigin()
  return (
    <Button variant="outline" size="sm" asChild>
      <Link href={origin.href}>Back to {origin.label}</Link>
    </Button>
  )
}

/* ── collection status — the in-flight "View results" surface ─────────────────
   An evaluation still collecting (or awaiting grade submission) is not an
   error: show where collection stands and offer the interventions inline.
   Reference: pce-three result-002 (amber status card) · Sprig in-progress
   study (responses vs goal) · Hotjar live survey (stats + actions kept). */

/** One stat in the status card's trio — value + caption, centered. */
function StatBlock({ value, caption, color }: { value: React.ReactNode; caption: string; color?: string }) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <span className="text-2xl font-semibold tabular-nums leading-none" style={color ? { color } : undefined}>
        {value}
      </span>
      <span className="text-xs text-muted-foreground">{caption}</span>
    </div>
  )
}

/** Co-taught cross-links — quiet inline element in the identity strip: the
 *  current faculty stays the hero; colleagues are secondary jump links. */
function FacultySwitcher({ siblings }: { siblings: EvalResult[] }) {
  const origin = useResultsOrigin()
  if (siblings.length === 0) return null
  return (
    <span className="inline-flex items-center gap-1.5 flex-wrap text-xs text-muted-foreground" role="group" aria-label="Co-taught faculty">
      <span aria-hidden="true">·</span>
      Co-taught with
      {siblings.map((s, i) => (
        <Fragment key={s.id}>
          {i > 0 && <span aria-hidden="true">,</span>}
          <Link
            href={withFrom(`/results/${encodeURIComponent(s.id)}`, origin.from)}
            className="text-foreground underline-offset-2 hover:underline rounded-sm focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            {s.facultyName}
          </Link>
        </Fragment>
      ))}
    </span>
  )
}

/** Split-survey offering cross-links — pills for the sibling surveys of the
 *  SAME course offering (e.g. Course vs Instructor evaluation), each keeping
 *  its own status; a gated sibling carries its state inline so the divergence
 *  is visible from either page (Romit 2026-07-17). */
function OfferingSurveySwitcher({ current, siblings }: { current: EvalResult; siblings: EvalResult[] }) {
  const origin = useResultsOrigin()
  if (siblings.length === 0) return null
  return (
    <div className="flex items-center gap-2 flex-wrap" role="group" aria-label="Surveys for this course offering">
      <span className="inline-flex items-center rounded-full border border-border bg-muted/60 px-3 py-1 text-xs font-medium text-foreground">
        {current.evalScope ? EVAL_SCOPE_LABEL[current.evalScope] : 'Evaluation'}
      </span>
      {siblings.map((s) => {
        const state = facultyFacingState(s)
        return (
          <Link
            key={s.id}
            href={withFrom(`/results/${encodeURIComponent(s.id)}`, origin.from)}
            className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            {s.evalScope ? EVAL_SCOPE_LABEL[s.evalScope] : 'Evaluation'}
            {state !== 'score' && (
              <span style={{ color: state === 'review-pending' ? 'var(--chip-4)' : 'var(--muted-foreground)' }}>
                · {state === 'review-pending' ? 'Review Pending' : 'Draft'}
              </span>
            )}
          </Link>
        )
      })}
    </div>
  )
}

/** Faculty scope selector — for a co-taught course, a segmented control that
 *  scopes Overview / Reports to the whole course ("All faculty") or one
 *  instructor. The selected option IS the current view (clear active state);
 *  an amber dot flags instructors still in review. A single-instructor course
 *  shows just the identity + its status. */
function FacultyScopeSelector({
  instructors,
  scope,
  setScope,
  isPD,
}: {
  instructors: EvalResult[]
  scope: 'all' | string
  setScope: (v: string) => void
  isPD: boolean
}) {
  // Scope pills are PD-only (spec ST-15: the faculty switcher is a coordinator
  // affordance) — a faculty viewer keeps their own identity row and can never
  // scope the Faculty Performance signal onto a colleague's instructor block.
  if (!isPD || instructors.length <= 1) {
    const f = instructors[0]
    if (!f) return null
    return (
      <div className="flex items-center gap-2">
        <AvatarInitials initials={f.facultyInitials} className="size-7 text-xs" decorative />
        <span className="text-sm font-semibold text-foreground">{f.facultyName}</span>
        {isPD && (
          <StatusBadge
            label={f.releasedToFaculty ? 'Released' : 'Pending release'}
            tone={f.releasedToFaculty ? 'neutral' : 'warning'}
          />
        )}
      </div>
    )
  }
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
      <ToggleGroup
        type="single"
        variant="outline"
        size="sm"
        value={scope}
        onValueChange={(v) => v && setScope(v)}
        aria-label="Scope the results by instructor"
      >
        <ToggleGroupItem value="all" className="gap-1.5">
          <i className="fa-light fa-users text-xs" aria-hidden="true" />
          All faculty
        </ToggleGroupItem>
        {instructors.map((f) => (
          <ToggleGroupItem key={f.facultyId} value={f.facultyId} className="gap-1.5">
            <span
              aria-hidden="true"
              className="flex size-5 shrink-0 items-center justify-center rounded-full text-[10px] font-medium"
              style={{ background: 'var(--avatar-initials-bg)', color: 'var(--avatar-initials-fg)' }}
            >
              {f.facultyInitials}
            </span>
            {f.facultyName}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </div>
  )
}

type GateMode = 'collecting' | 'suppressed' | 'pendingReview'

/** The single result-page shell for every non-available state — same header
 *  anatomy as the full detail (back link · title · status chip · identity ·
 *  switcher), with a state-specific status card as the body. */
function StatusResultScreen({
  survey,
  isPD,
  mode,
  program,
  siblings = [],
  facultyName,
  facultyInitials,
  currentResult,
  offeringSiblings = [],
}: {
  survey: PceSurvey
  isPD: boolean
  mode: GateMode
  program?: string
  siblings?: EvalResult[]
  facultyName?: string
  facultyInitials?: string
  currentResult?: EvalResult
  offeringSiblings?: EvalResult[]
}) {
  const origin = useResultsOrigin()
  const [remindOpen, setRemindOpen] = useState(false)
  const [extendOpen, setExtendOpen] = useState(false)
  const [reminderSent, setReminderSent] = useState(false)
  const primary = survey.instructors.find((i) => i.role === 'primary') ?? survey.instructors[0]
  const name = facultyName ?? primary?.name
  const initials = facultyInitials ?? primary?.initials
  const minimum = survey.minimumThreshold ?? 5
  const daysLeft = survey.deadline
    ? Math.ceil((new Date(survey.deadline).getTime() - Date.now()) / 86_400_000)
    : null

  const badge = RESULT_STATUS_BADGE[mode === 'suppressed' ? 'suppressed' : 'locked']
  const gateCopy: Record<GateMode, { icon: string; title: string; lines: string[] }> = {
    collecting: {
      icon: 'fa-hourglass-half',
      title: 'Review Pending',
      lines: ['Results will be available once the evaluation period closes and admin review is complete.'],
    },
    suppressed: {
      icon: 'fa-chart-simple',
      title: 'Draft',
      lines: [
        `Insufficient responses received. (${survey.responseCount} of ${minimum} required responses received.)`,
        `Results are only shared when at least ${minimum} students have responded.`,
      ],
    },
    pendingReview: {
      icon: 'fa-hourglass-half',
      title: 'Review Pending',
      lines: ['Your program admin is reviewing the evaluation results before making them available. Check back soon.'],
    },
  }
  const copy = gateCopy[mode]

  return (
    <>
      <SiteHeader
        breadcrumbs={origin.trail}
        title={survey.courseCode}
      />
      <PageHeader
        title={`${survey.courseCode} — ${survey.courseName}`}
        subtitle={`${survey.term}${survey.academicYear ? ` · AY ${survey.academicYear}` : ''}${program ? ` · ${program}` : ''}`}
        actions={
          isPD ? (
            <Button variant="outline" size="sm" asChild>
              <Link href={`/surveys/${survey.id}/preview`}>Preview form</Link>
            </Button>
          ) : undefined
        }
      />
      <div className="flex-1 px-7 py-4">
        <div className="flex flex-col gap-4 max-w-4xl">
          {/* Identity strip — same anatomy as the available detail */}
          <div className="flex items-center gap-4 flex-wrap">
            <StatusBadge label={badge.label} tone={badge.tone} icon={badge.icon} />
            {name && <PersonIdentityCell name={name} initials={initials} />}
            {!facultyName && survey.instructors.length > 1 && (
              <span className="text-xs text-muted-foreground">
                +{survey.instructors.length - 1} more
              </span>
            )}
            {isPD && <FacultySwitcher siblings={siblings} />}
          </div>

          {/* Split-survey offering — the sibling survey may already be
              available while this one is gated; make the jump visible. */}
          {currentResult && offeringSiblings.length > 0 && (
            <OfferingSurveySwitcher current={currentResult} siblings={offeringSiblings} />
          )}

          <GateScreen
            icon={copy.icon}
            title={copy.title}
            lines={copy.lines}
            tone={mode === 'suppressed' ? 'neutral' : 'pending'}
          >
            {/* Where collection stands — the numbers the viewer acts on */}
            <div className="flex items-start justify-center gap-10 flex-wrap py-1" role="group" aria-label="Collection status">
              <StatBlock
                value={
                  <>
                    {survey.responseCount}
                    <span className="text-sm text-muted-foreground font-normal">
                      {' '}of {mode === 'suppressed' ? `${minimum} required` : survey.enrollmentCount}
                    </span>
                  </>
                }
                caption="responses"
              />
              <StatBlock
                value={`${survey.responseRate}%`}
                caption="response rate · target 70%"
                color={rateColor(survey.responseRate)}
              />
              {survey.deadline && (
                <StatBlock
                  value={daysLeft != null && daysLeft > 0 ? `${daysLeft}d` : '—'}
                  caption={`${daysLeft != null && daysLeft > 0 ? 'left · closes' : 'closed'} ${survey.deadline}`}
                />
              )}
            </div>

            <div className="flex items-center justify-center gap-2 flex-wrap">
              {isPD && mode === 'collecting' && (
                <>
                  {reminderSent ? (
                    <span className="text-xs text-muted-foreground pe-1">Reminder sent</span>
                  ) : (
                    <Button variant="outline" size="sm" onClick={() => setRemindOpen(true)}>
                      Send reminder
                    </Button>
                  )}
                </>
              )}
              {isPD && (mode === 'collecting' || mode === 'suppressed') && (
                <Button variant="outline" size="sm" onClick={() => setExtendOpen(true)}>
                  Extend close date
                </Button>
              )}
            </div>
          </GateScreen>
        </div>
      </div>

      <SendReminderDialog
        open={remindOpen}
        onOpenChange={setRemindOpen}
        surveys={[survey]}
        onSent={() => setReminderSent(true)}
      />
      <EditEndDateDialog open={extendOpen} onOpenChange={setExtendOpen} surveys={[survey]} />
    </>
  )
}

/** "On this page" rail link — plain anchor semantics, smooth in-page scroll. */
function AnchorLink({
  label,
  onGo,
  small,
}: {
  label: string
  onGo: () => void
  small?: boolean
}) {
  return (
    <a
      href="#"
      onClick={(e) => {
        e.preventDefault()
        onGo()
      }}
      title={label}
      /* block + min-w-0 so `truncate` shrinks to the 260px rail (ellipsis, not
         a mid-word clip); shrink-0 so the flex column's max-height doesn't
         compress each row below its line-height and clip the text vertically. */
      className={`block min-w-0 shrink-0 truncate rounded-sm text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 ${small ? 'text-xs py-1' : 'text-sm py-0.5'}`}
    >
      {label}
    </a>
  )
}

const SENTIMENT_FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'positive', label: 'Positive' },
  { key: 'concern', label: 'Constructive' },
  { key: 'neutral', label: 'Neutral' },
] as const
type SentimentFilter = (typeof SENTIMENT_FILTERS)[number]['key']

/** Indexed comment — index refers to the position in responses.comments,
 *  which is what hiddenComments[surveyId] stores. */
interface IndexedComment extends ResponseComment {
  index: number
  surveyIdForToggle: string
}

function CommentList({
  title,
  comments,
  hiddenIdx,
  canModerate,
}: {
  title: string
  comments: IndexedComment[]
  hiddenIdx: number[]
  canModerate: boolean
}) {
  const { toggleHideComment } = usePce()
  const [filter, setFilter] = useState<SentimentFilter>('all')

  const visibleToRole = canModerate
    ? comments
    : comments.filter((c) => !hiddenIdx.includes(c.index))
  const filtered =
    filter === 'all'
      ? visibleToRole
      : visibleToRole.filter((c) => (c.sentiment ?? 'neutral') === filter)
  const hiddenCount = comments.filter((c) => hiddenIdx.includes(c.index)).length

  if (comments.length === 0) return null

  const countFor = (f: SentimentFilter) =>
    f === 'all'
      ? visibleToRole.length
      : visibleToRole.filter((c) => (c.sentiment ?? 'neutral') === f).length

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <h4 className="text-sm font-medium flex items-center gap-2">
          {title}
          {canModerate && hiddenCount > 0 && (
            <StatusBadge label={`${hiddenCount} hidden from faculty`} tone="neutral" />
          )}
        </h4>
        <ToggleGroup
          type="single"
          value={filter}
          onValueChange={(v) => v && setFilter(v as SentimentFilter)}
          variant="outline"
          size="sm"
          aria-label={`Filter ${title.toLowerCase()} by sentiment`}
        >
          {SENTIMENT_FILTERS.map((f) => (
            <ToggleGroupItem key={f.key} value={f.key} aria-label={`${f.label} comments`}>
              {f.label} ({countFor(f.key)})
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>
      {filtered.length === 0 ? (
        <p className="text-xs text-muted-foreground py-2">No {title.toLowerCase()} match this filter.</p>
      ) : (
        <div className="flex flex-col max-h-96 overflow-y-auto">
          {filtered.map((c) => {
            const isHidden = hiddenIdx.includes(c.index)
            const s = c.sentiment ?? 'neutral'
            const chip =
              s === 'positive'
                ? { label: 'Positive', tone: 'success' as const }
                : s === 'concern'
                  ? { label: 'Constructive', tone: 'warning' as const }
                  : { label: 'Neutral', tone: 'neutral' as const }
            return (
              <div
                key={c.index}
                className="flex items-start gap-3 py-2.5 border-b border-border last:border-0"
              >
                {/* De-emphasis via the AA-calibrated token, never opacity (contrast) */}
                <p className={`text-sm flex-1 min-w-0 italic border-s-2 border-border ps-3 ${isHidden ? 'text-muted-foreground line-through decoration-border' : ''}`}>
                  &ldquo;{c.text}&rdquo;
                </p>
                <StatusBadge label={chip.label} tone={chip.tone} />
                {canModerate && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="shrink-0 text-muted-foreground hover:text-foreground"
                    onClick={() => toggleHideComment(c.surveyIdForToggle, c.index)}
                  >
                    {isHidden ? 'Unhide' : 'Hide'}
                  </Button>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

/* ── score card ───────────────────────────────────────────────────────────── */

const PRIORITY_RANK: Record<string, number> = { high: 0, medium: 1, low: 2 }

function ScoreCard({
  title,
  value,
  programAvg,
  priors,
}: {
  title: string
  value: number | null
  programAvg: number | null
  priors: { term: string; avg: number; actionItems?: PriorOffering['actionItems'] }[]
}) {
  const delta = value != null && programAvg != null ? value - programAvg : null
  const prior = priors.length > 0 ? priors[priors.length - 1] : null
  const actionItems = [...(prior?.actionItems ?? [])].sort(
    (a, b) => (PRIORITY_RANK[a.priority] ?? 9) - (PRIORITY_RANK[b.priority] ?? 9),
  )
  /* Slope geometry — two time points on a shared 3–5 window (a full line chart
     is overkill for two points; the direction IS the message). */
  const yFor = (v: number) => 52 - ((Math.min(5, Math.max(3, v)) - 3) / 2) * 34
  /* One narrative line, trend only — the badge already owns the program gap. */
  const trendPhrase = (() => {
    if (value == null || !prior) return null
    const best = Math.max(...priors.map((p) => p.avg))
    if (value >= best) {
      return `Best of your last ${priors.length + 1} offering${priors.length + 1 !== 1 ? 's' : ''}.`
    }
    const d = value - prior.avg
    if (Math.abs(d) <= 0.05) return `Holding steady since ${prior.term}.`
    return `${d > 0 ? 'Up' : 'Down'} ${Math.abs(d).toFixed(2)} from ${prior.term}.`
  })()
  return (
    <Card>
      <CardContent className="pt-6 flex flex-col gap-2">
        <p className="text-xs text-muted-foreground">{title}</p>
        <div className="flex items-end gap-2 flex-wrap">
          <span
            className="font-heading text-3xl font-semibold tabular-nums leading-none"
            style={{ color: value != null ? scoreColor(value) : 'var(--muted-foreground)' }}
          >
            {value != null ? value.toFixed(2) : '—'}
          </span>
          <span className="text-xs text-muted-foreground pb-0.5">/ 5</span>
          {delta != null && Math.abs(delta) > 0.05 && (
            <Badge
              variant="secondary"
              className="font-normal tabular-nums"
              style={{ color: delta > 0 ? 'var(--chart-2)' : 'var(--chip-4)' }}
            >
              <i
                className={`fa-light ${delta > 0 ? 'fa-arrow-up' : 'fa-arrow-down'}`}
                aria-hidden="true"
              />
              {Math.abs(delta).toFixed(2)} vs program
            </Badge>
          )}
        </div>
        {prior && value != null ? (
          <div
            role="img"
            aria-label={`${title} moved from ${prior.avg.toFixed(2)} in ${prior.term} to ${value.toFixed(2)} this term${programAvg != null ? `; program average ${programAvg.toFixed(2)}` : ''}`}
          >
            <svg viewBox="0 0 208 58" className="w-52 h-[58px]" aria-hidden="true">
              {programAvg != null && (
                <line
                  x1="12"
                  x2="196"
                  y1={yFor(programAvg)}
                  y2={yFor(programAvg)}
                  stroke="var(--border)"
                  strokeWidth="1.5"
                  strokeDasharray="3 4"
                />
              )}
              <line
                x1="12"
                x2="196"
                y1={yFor(prior.avg)}
                y2={yFor(value)}
                stroke="var(--foreground)"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
              <circle cx="12" cy={yFor(prior.avg)} r="3" fill="var(--muted-foreground)" />
              <circle cx="196" cy={yFor(value)} r="3.5" fill={scoreColor(value)} />
              {/* Prior value printed AT the mark (RUBRIC v2 Gate 5.3); the hero
                  number directly above labels the current endpoint. */}
              <text
                x="12"
                y={yFor(prior.avg) - 8}
                fontSize="12"
                fill="var(--muted-foreground)"
                className="tabular-nums"
              >
                {prior.avg.toFixed(2)}
              </text>
            </svg>
            <div className="flex w-52 items-baseline justify-between text-xs text-muted-foreground tabular-nums">
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="underline decoration-dotted underline-offset-2 cursor-help">
                    {prior.term}
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  {actionItems.length > 0 ? (
                    <div className="flex flex-col gap-1 max-w-64">
                      <p className="font-medium">Action items logged for {prior.term}</p>
                      {actionItems.map((a) => (
                        <p key={a.text}>
                          <span className="capitalize">{a.priority}</span> · {a.text}
                        </p>
                      ))}
                    </div>
                  ) : (
                    <>No action items logged for {prior.term}.</>
                  )}
                </TooltipContent>
              </Tooltip>
              {programAvg != null && <span>Program {programAvg.toFixed(2)} ┄</span>}
            </div>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground tabular-nums">
            Program average {programAvg != null ? programAvg.toFixed(2) : '—'}
          </p>
        )}
        {trendPhrase && <p className="text-xs text-muted-foreground">{trendPhrase}</p>}
      </CardContent>
    </Card>
  )
}

/** Response rate as a peer KPI card beside the two score cards (Romit
 *  2026-07-17) — hero %, delta chip vs the 70% target, count caption. */
function ResponseRateCard({
  rate,
  responses,
  enrolled,
}: {
  rate: number
  responses: number
  enrolled: number
}) {
  const delta = rate - 70
  return (
    <Card>
      <CardContent className="pt-6 flex flex-col gap-2">
        <p className="text-xs text-muted-foreground">Response Rate</p>
        <div className="flex items-end gap-2 flex-wrap">
          <span
            className="font-heading text-3xl font-semibold tabular-nums leading-none"
            style={{ color: rateColor(rate) }}
          >
            {rate}%
          </span>
          {Math.abs(delta) >= 1 && (
            <Badge
              variant="secondary"
              className="font-normal tabular-nums"
              style={{ color: delta > 0 ? 'var(--chart-2)' : 'var(--chip-4)' }}
            >
              <i
                className={`fa-light ${delta > 0 ? 'fa-arrow-up' : 'fa-arrow-down'}`}
                aria-hidden="true"
              />
              {Math.abs(delta)} pts vs 70% target
            </Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground tabular-nums">
          {responses} of {enrolled} students responded
        </p>
      </CardContent>
    </Card>
  )
}

/* ── theme distribution ───────────────────────────────────────────────────────
   One row per theme: the SAME five vertical rating columns as the question
   breakdown, aggregated across the theme's questions (Romit 2026-07-16 —
   one visual language page-wide; the distribution shape per theme is the
   story), plus "Avg X · Program Y" printed at the right. */

interface ThemeRowDatum {
  theme: string
  avg: number
  questions: number
  programAvg: number | null
  /** Response counts by rating level, index 0 = rated 1 … index 4 = rated 5,
   *  aggregated across the theme's questions — feeds the per-theme histogram. */
  dist: [number, number, number, number, number]
}

function ThemeStripPlot({ themes, partial }: { themes: ThemeRowDatum[]; partial?: boolean }) {
  if (themes.length === 0) return null
  /* Sort by gap vs program, worst first — the deficit IS the story (Culture
     Amp delta framing); themes without a benchmark sink to the end. */
  const gapKey = (t: ThemeRowDatum) =>
    t.programAvg != null ? t.avg - t.programAvg : Number.POSITIVE_INFINITY
  const sorted = [...themes].sort((a, b) => gapKey(a) - gapKey(b) || a.avg - b.avg)
  const weakest = [...themes].sort((a, b) => a.avg - b.avg)[0]
  const themeLeo: ChartLeoInsight = {
    headline: `${weakest.theme} is the lowest theme at ${weakest.avg.toFixed(1)}/5`,
    explanation:
      weakest.programAvg != null
        ? `Program average for this theme is ${weakest.programAvg.toFixed(1)} — see how the distribution leans.`
        : `Averaged from ${weakest.questions} question${weakest.questions !== 1 ? 's' : ''}.`,
    kind: 'dip',
  }
  return (
    <ChartCard
      variant="normal"
      title="Theme-wise distribution"
      description={`Response distribution per theme, rated 1–5 · sorted by gap vs program${partial ? ' · partial data' : ''}`}
      leoInsight={themeLeo}
    >
      <ChartFigure
        label="Theme-wise distribution"
        summary={`Response distribution per question theme across rating levels 1 to 5, with the theme average and program average printed per row, sorted by gap. ${weakest.theme} is lowest at ${weakest.avg.toFixed(1)}.`}
        dataLength={themes.length}
      >
        {() => (
          <>
            <div className="flex flex-col">
              <div className="grid grid-cols-[minmax(160px,220px)_1fr_auto] items-end gap-6 pb-2 border-b border-border">
                <span className="text-xs text-muted-foreground">Theme</span>
                <RatingLegend />
                <span className="text-xs text-muted-foreground text-right">Avg vs program</span>
              </div>
              {sorted.map((t) => {
                const below = t.programAvg != null && t.avg < t.programAvg - 0.049
                const total = t.dist.reduce((a, n) => a + n, 0)
                return (
                  <div
                    key={t.theme}
                    role="img"
                    aria-label={`${t.theme}: average ${t.avg.toFixed(1)} of 5${t.programAvg != null ? `, program average ${t.programAvg.toFixed(1)}` : ''}, from ${t.questions} question${t.questions !== 1 ? 's' : ''} and ${total} rating${total !== 1 ? 's' : ''}`}
                    className="grid grid-cols-[minmax(160px,220px)_1fr_auto] items-center gap-6 py-3 border-b border-border last:border-0"
                  >
                    <div className="min-w-0">
                      <p className="text-sm truncate">{t.theme}</p>
                      <p className="text-xs text-muted-foreground">
                        {t.questions} question{t.questions !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <RatingStackedBar counts={[...t.dist]} total={total} />
                    <p className="text-xs text-muted-foreground tabular-nums text-right whitespace-nowrap">
                      Avg{' '}
                      <span
                        className="text-sm font-semibold"
                        style={{ color: below ? 'var(--chip-4)' : 'var(--foreground)' }}
                      >
                        {t.avg.toFixed(1)}
                      </span>
                      {t.programAvg != null && <> · Program {t.programAvg.toFixed(1)}</>}
                    </p>
                  </div>
                )
              })}
            </div>
            <ChartDataTable
              caption="Theme-wise distribution"
              headers={['Theme', 'Rated 1', 'Rated 2', 'Rated 3', 'Rated 4', 'Rated 5', 'This course', 'Program average', 'Questions']}
              rows={sorted.map((t) => [
                t.theme,
                ...t.dist,
                `${t.avg.toFixed(1)}/5`,
                t.programAvg != null ? `${t.programAvg.toFixed(1)}/5` : '—',
                t.questions,
              ])}
            />
          </>
        )}
      </ChartFigure>
    </ChartCard>
  )
}

/* ── question breakdown table — pce-three anatomy, densified ──────────────────
   One compact row per question: text · five mini rating columns (count above,
   % below — Likert diverging colors) · labeled Your/Median/Prog mini-bars.
   Scale header printed ONCE; COURSE / FACULTY group bands. ~6 rows per screen
   (reference: pce-three result-010 · Hotjar per-question results). */

interface BreakdownRow {
  id: string
  label: string
  group: string
  kind: 'rated' | 'freeText'
  avg?: number
  median?: number
  programAvg?: number | null
  counts?: number[]
  total?: number
  freeTextCount?: number
}

/** % of responses rated 4 or 5 — the favorable share that orders and labels
 *  each question row. */
function favorableShare(counts: number[] | undefined, total: number | undefined): number {
  if (!counts || !total) return 0
  return ((counts[3] ?? 0) + (counts[4] ?? 0)) / total
}


/* You vs program as PRINTED numbers + one signed-gap figure (RUBRIC v2 Gate 0:
   in a ~10rem cell the deltas the reader must act on render smaller than any
   mark could be — numbers state it better). Median stays in the data table. */
function CompareText({
  avg,
  programAvg,
}: {
  avg: number | null | undefined
  programAvg: number | null | undefined
}) {
  if (avg == null) return <span className="text-xs text-muted-foreground text-right block">—</span>
  const gap = programAvg != null ? avg - programAvg : null
  return (
    <p className="text-xs tabular-nums text-right whitespace-nowrap">
      <span className="text-muted-foreground">
        You <span className="font-semibold text-foreground">{avg.toFixed(1)}</span>
        {programAvg != null && <> · Program {programAvg.toFixed(1)}</>}
      </span>
      {gap != null && Math.abs(gap) > 0.05 && (
        <span
          className="font-medium"
          style={{ color: gap > 0 ? 'var(--chart-2)' : 'var(--chip-4)' }}
        >
          {' '}({gap > 0 ? '+' : '−'}{Math.abs(gap).toFixed(1)})
        </span>
      )}
    </p>
  )
}

/** Free-text row — the written responses open immediately in a sheet
 *  (scrollable list, no page scroll needed to read the feedback). */
function WrittenResponsesRow({ row, surveyId }: { row: BreakdownRow; surveyId: string }) {
  const responses = MOCK_OPEN_TEXT_RESPONSES.filter(
    (x) => x.surveyId === surveyId && x.questionText === row.label,
  )
  const count = row.freeTextCount ?? responses.length
  return (
    <div
      id={`question-${row.id}`}
      className="scroll-mt-16 grid grid-cols-[minmax(200px,1fr)_auto] items-center gap-6 py-3 border-b border-border last:border-0"
    >
      <p className="text-sm min-w-0 text-muted-foreground">{row.label}</p>
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="ghost" size="sm" className="justify-self-end text-muted-foreground hover:text-foreground">
            {count} written response{count !== 1 ? 's' : ''}
            <i className="fa-light fa-arrow-right" aria-hidden="true" />
          </Button>
        </SheetTrigger>
        <SheetContent
          side="right"
          showOverlay={false}
          showCloseButton={false}
          className="w-[480px] sm:max-w-[480px] flex flex-col gap-0 p-0"
        >
          <SheetHeader className="px-6 py-5 border-b border-border">
            <SheetTitle className="text-sm font-semibold leading-snug">{row.label}</SheetTitle>
            <p className="text-sm text-muted-foreground">
              {count} written response{count !== 1 ? 's' : ''} · anonymized
            </p>
          </SheetHeader>
          <div className="flex-1 min-h-0 overflow-y-auto px-6">
            {responses.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 gap-2 text-center">
                <i className="fa-light fa-comment-lines text-muted-foreground" aria-hidden="true" style={{ fontSize: 24 }} />
                <p className="text-sm text-muted-foreground">No responses yet.</p>
              </div>
            ) : (
              responses.map((x) => (
                <p key={x.id} className="py-3 text-sm border-b border-border last:border-0">
                  {x.text}
                </p>
              ))
            )}
          </div>
          <div className="px-6 py-4 border-t border-border flex justify-end shrink-0">
            <SheetClose asChild>
              <Button variant="outline" size="sm">Close</Button>
            </SheetClose>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}

function QuestionBreakdownTable({
  rows,
  surveyId,
}: {
  rows: BreakdownRow[]
  surveyId: string
}) {
  if (rows.length === 0) return null
  const groups = [...new Set(rows.map((r) => r.group))]
  /* Within each group: lowest favorable share first (the fix-first order);
     free-text rows keep the tail. */
  const orderedFor = (group: string) =>
    rows
      .filter((r) => r.group === group)
      .sort((a, b) => {
        if (a.kind !== b.kind) return a.kind === 'freeText' ? 1 : -1
        if (a.kind === 'freeText') return 0
        return favorableShare(a.counts, a.total) - favorableShare(b.counts, b.total)
      })
  return (
    <div className="flex flex-col">
      <div className="grid grid-cols-[minmax(200px,1fr)_auto_12rem] items-end gap-6 pb-2 border-b border-border">
        <span className="text-xs text-muted-foreground">Question</span>
        <div className="flex gap-3" aria-hidden="true">
          {[1, 2, 3, 4, 5].map((n) => (
            <span key={n} className="w-8 text-center text-xs text-muted-foreground tabular-nums">{n}</span>
          ))}
        </div>
        <span className="text-xs text-muted-foreground text-right">You vs program</span>
      </div>
      {groups.map((group) => (
        <Fragment key={group}>
          <div className="bg-muted/50 -mx-6 px-6 py-1.5 border-b border-border">
            <span className="text-xs font-medium text-muted-foreground">{group}</span>
          </div>
          {orderedFor(group).map((r) =>
            r.kind === 'rated' ? (
              <div
                key={r.id}
                id={`question-${r.id}`}
                className="scroll-mt-16 grid grid-cols-[minmax(200px,1fr)_auto_12rem] items-center gap-6 py-3 border-b border-border last:border-0"
              >
                <p className="text-sm min-w-0">{r.label}</p>
                <MiniRatingColumns counts={r.counts ?? []} total={r.total ?? 0} />
                <CompareText avg={r.avg} programAvg={r.programAvg} />
              </div>
            ) : (
              <WrittenResponsesRow key={r.id} row={r} surveyId={surveyId} />
            ),
          )}
        </Fragment>
      ))}
      <ChartDataTable
        caption="Question breakdown"
        headers={['Question', 'Group', 'Average', 'Median', 'Program average', 'Rated 1', 'Rated 2', 'Rated 3', 'Rated 4', 'Rated 5']}
        rows={rows
          .filter((r) => r.kind === 'rated')
          .map((r) => [
            r.label,
            r.group,
            r.avg != null ? r.avg.toFixed(1) : '—',
            r.median != null ? r.median.toFixed(1) : '—',
            r.programAvg != null ? r.programAvg.toFixed(1) : '—',
            ...(r.counts ?? [0, 0, 0, 0, 0]),
          ])}
      />
    </div>
  )
}

/* ── collection pace chart (live evaluations) ─────────────────────────────────
   The in-flight page is a COLLECTION COCKPIT: the admin's question is "are we
   accumulating fast enough, and do I need to nudge?" — daily responses + the
   cumulative rate against the 70% target answer it (Sprig in-progress pattern). */

const paceConfig: ChartConfig = {
  responses: { label: 'Responses that day', color: 'var(--chart-1)' },
  cumulativePct: { label: 'Cumulative rate', color: 'var(--brand-color)' },
}

function CollectionPaceCard({ survey }: { survey: PceSurvey }) {
  const series = useMemo(() => {
    const term = MOCK_PROGRAM_TERMS.find((t) => t.name === survey.term) ?? MOCK_PROGRAM_TERMS[0]
    return termCollectionSeries([survey], term)
  }, [survey])
  const pace = useMemo(
    () => paceToTarget(series.points, series.enrolled, series.collected, 70),
    [series],
  )
  const todayPoint = series.points.find((p) => p.isToday)
  const daysLeft = survey.deadline
    ? Math.ceil((new Date(survey.deadline).getTime() - Date.now()) / 86_400_000)
    : null
  if (series.points.length === 0) return null

  const behind = survey.responseRate < 70
  const paceLeo: ChartLeoInsight = {
    headline: behind
      ? `${survey.responseRate}% collected — behind the 70% target`
      : `${survey.responseRate}% collected — on target`,
    explanation: pace
      ? `About ${pace.perDay} response${pace.perDay !== 1 ? 's' : ''}/day needed by close${daysLeft != null && daysLeft > 0 ? ` (${daysLeft}d left)` : ''}. A reminder typically lifts the daily count.`
      : 'The collection window has ended.',
    kind: behind ? 'dip' : 'trend',
  }

  return (
    <ChartCard
      variant="normal"
      title="Collection pace"
      description={`${survey.responseCount} of ${survey.enrollmentCount} responded · target 70%${survey.deadline ? ` · closes ${survey.deadline}` : ''}`}
      leoInsight={paceLeo}
    >
      <ChartFigure
        label="Collection pace"
        summary={`Daily responses and cumulative response rate for this evaluation against a 70 percent target. Currently ${survey.responseRate} percent from ${survey.responseCount} of ${survey.enrollmentCount} students.`}
        dataLength={series.points.length}
      >
        {(activeIndex) => (
          <>
            <ChartContainer config={paceConfig} className="h-48 w-full">
              <ComposedChart
                accessibilityLayer
                data={series.points}
                margin={{ left: 0, right: 8, top: 4, bottom: 0 }}
              >
                <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="day" tickLine={false} axisLine={false} tick={CHART_AXIS_TICK} interval="preserveStartEnd" minTickGap={28} />
                <YAxis
                  yAxisId="pct"
                  domain={[0, 100]}
                  ticks={[0, 25, 50, 75, 100]}
                  tickFormatter={(v: number) => `${v}%`}
                  width={40}
                  tickLine={false}
                  axisLine={false}
                  tick={CHART_AXIS_TICK}
                />
                <YAxis yAxisId="count" hide />
                <ReferenceLine
                  yAxisId="pct"
                  y={70}
                  stroke="var(--muted-foreground)"
                  strokeDasharray="4 3"
                  label={{ value: '70% target', position: 'insideTopLeft', fontSize: CHART_TICK_FONT_SIZE, fill: 'var(--muted-foreground)' }}
                />
                {todayPoint && series.points.some((p) => p.future) && (
                  <ReferenceLine
                    yAxisId="pct"
                    x={todayPoint.day}
                    stroke="var(--border-control-35)"
                    label={{ value: 'Today', position: 'insideTop', fontSize: CHART_TICK_FONT_SIZE, fill: 'var(--muted-foreground)' }}
                  />
                )}
                <ChartTooltip
                  key={chartTooltipKeyboardSyncProps(activeIndex).key}
                  {...chartTooltipKeyboardSyncProps(activeIndex).props}
                  cursor={{ stroke: 'var(--border)' }}
                  content={
                    <ChartTooltipContent
                      formatter={(v: unknown, name: unknown) => [
                        name === 'cumulativePct' ? `${v as number}% cumulative` : `${v as number} responses`,
                        '',
                      ]}
                    />
                  }
                />
                <Bar yAxisId="count" dataKey="responses" fill="var(--chart-1)" fillOpacity={0.5} maxBarSize={10} radius={[2, 2, 0, 0]} isAnimationActive={false} />
                <Line yAxisId="pct" type="monotone" dataKey="cumulativePct" stroke="var(--brand-color)" strokeWidth={2} dot={false} connectNulls={false} isAnimationActive={false} />
              </ComposedChart>
            </ChartContainer>
            <ChartDataTable
              caption="Collection pace by day"
              headers={['Day', 'Responses', 'Cumulative rate']}
              rows={series.points
                .filter((p) => p.responses != null && p.responses > 0)
                .map((p) => [p.day, p.responses ?? 0, p.cumulativePct != null ? `${p.cumulativePct}%` : '—'])}
            />
          </>
        )}
      </ChartFigure>
    </ChartCard>
  )
}

/* ── page ─────────────────────────────────────────────────────────────────── */

export default function ResultDetailPage() {
  return (
    <Suspense>
      <ResultDetailPageInner />
    </Suspense>
  )
}

function ResultDetailPageInner() {
  const origin = useResultsOrigin()
  const params = useParams<{ id: string }>()
  const rawId = decodeURIComponent(params?.id ?? '')
  const { user, surveys, templates, hiddenComments, releaseSurvey } = usePce()
  const [exportOpen, setExportOpen] = useState(false)
  const [exportKind, setExportKind] = useState<'pdf' | 'csv'>('pdf')

  const results = useMemo(() => deriveResults(surveys), [surveys])

  // Resolve exact result id, else a survey id — preferring the viewer's own
  // result so faculty deep-links land on their offering.
  const result: EvalResult | undefined = useMemo(() => {
    const exact = results.find((r) => r.id === rawId)
    if (exact) return exact
    const forSurvey = results.filter((r) => r.surveyId === rawId)
    if (forSurvey.length === 0) return undefined
    return forSurvey.find((r) => r.facultyId === user.facultyId) ?? forSurvey[0]
  }, [results, rawId, user.facultyId])

  const survey: PceSurvey | undefined = useMemo(
    () => (result ? surveys.find((s) => s.id === result.surveyId) : undefined),
    [surveys, result],
  )

  const isPD = user.role === 'admin'
  const isOwner = !!result && user.facultyId === result.facultyId

  /* Gate 0 — unknown result. A survey that hasn't finished collecting yet has
     no derived result — "View results" on a live row lands on the locked
     message instead of a dead not-found. */
  if (!result || !survey) {
    const liveSurvey = surveys.find((s) => s.id === rawId)
    if (liveSurvey) {
      // PDs get the REAL layout with partial data (no placeholder — Romit
      // 2026-07-09); faculty keep the read-only collection gate (not released).
      if (user.role === 'admin') {
        const liveRows = deriveResultsForSurvey(liveSurvey)
        const liveResult = liveRows.find((r) => r.facultyId === user.facultyId) ?? liveRows[0]
        if (liveResult) {
          return (
            <ResultDetail
              result={liveResult}
              survey={liveSurvey}
              isPD
              isOwner={user.facultyId === liveResult.facultyId}
              inCollection
              hiddenIdx={hiddenComments[liveSurvey.id] ?? []}
              onRelease={() => {}}
              templates={templates}
              exportOpen={exportOpen}
              setExportOpen={setExportOpen}
              exportKind={exportKind}
              setExportKind={setExportKind}
            />
          )
        }
      }
      return <StatusResultScreen survey={liveSurvey} isPD={user.role === 'admin'} mode="collecting" />
    }
    return (
      <>
        <SiteHeader breadcrumbs={origin.trail} title="Result" />
        <PageHeader title="Results" />
        <div className="flex-1 px-7 py-4">
          <GateScreen
            icon="fa-circle-question"
            title="Result not found."
            lines={['The result you are looking for does not exist or you may not have access.']}
          />
        </div>
      </>
    )
  }

  /* Gate 1 — faculty can only open their own results (PDs bypass) */
  if (!isPD && !isOwner) {
    return (
      <>
        <SiteHeader breadcrumbs={origin.trail} title="Access Restricted" />
        <PageHeader title="Access Restricted" />
        <div className="flex-1 px-7 py-4">
          <GateScreen
            icon="fa-lock"
            title="Access Restricted"
            lines={['You can only view evaluation results for your own courses.']}
          />
        </div>
      </>
    )
  }

  /* Co-taught siblings — OTHER faculty on the same course + term. Same-faculty
     rows are split-survey siblings, not co-teachers (offering model). */
  const siblings = results.filter(
    (r) =>
      r.courseCode === result.courseCode &&
      r.term === result.term &&
      r.id !== result.id &&
      r.facultyId !== result.facultyId,
  )
  /* Split-survey siblings — same offering, same faculty, different survey. */
  const offeringSiblings = result.offeringId
    ? results.filter(
        (r) =>
          r.offeringId === result.offeringId &&
          r.facultyId === result.facultyId &&
          r.id !== result.id,
      )
    : []
  const gateProps = {
    survey,
    isPD,
    program: result.program,
    siblings,
    facultyName: result.facultyName,
    facultyInitials: result.facultyInitials,
    currentResult: result,
    offeringSiblings,
  }

  /* Gate 2 — locked: grades not submitted (every role). Same collection-status
     surface as a live survey — the admin's job here is still "drive responses". */
  if (result.status === 'locked') {
    return <StatusResultScreen {...gateProps} mode="collecting" />
  }

  /* Gate 3 — suppressed: below minimum threshold (every role). PDs can extend
     the window to reopen collection — the remedy for suppression. */
  if (result.status === 'suppressed') {
    return <StatusResultScreen {...gateProps} mode="suppressed" />
  }

  /* Gate 4 — pending coordinator review: faculty only; PDs go to Review mode */
  if (!isPD && !result.releasedToFaculty) {
    return <StatusResultScreen {...gateProps} mode="pendingReview" />
  }

  return <ResultDetail result={result} survey={survey} isPD={isPD} isOwner={isOwner}
    offeringSiblings={offeringSiblings}
    hiddenIdx={hiddenComments[survey.id] ?? []} onRelease={() => releaseSurvey(survey.id)}
    templates={templates} exportOpen={exportOpen} setExportOpen={setExportOpen}
    exportKind={exportKind} setExportKind={setExportKind} />
}

/* ── available — the full detail view ────────────────────────────────────── */

function ResultDetail({
  result,
  survey,
  isPD,
  isOwner,
  inCollection = false,
  offeringSiblings = [],
  hiddenIdx,
  onRelease,
  templates,
  exportOpen,
  setExportOpen,
  exportKind,
  setExportKind,
}: {
  result: EvalResult
  survey: PceSurvey
  isPD: boolean
  isOwner: boolean
  offeringSiblings?: EvalResult[]
  /** Live evaluation — partial data, ops actions primary, no release flow yet. */
  inCollection?: boolean
  hiddenIdx: number[]
  onRelease: () => void
  templates: ReturnType<typeof usePce>['templates']
  exportOpen: boolean
  setExportOpen: (o: boolean) => void
  exportKind: 'pdf' | 'csv'
  setExportKind: (k: 'pdf' | 'csv') => void
}) {
  const origin = useResultsOrigin()
  const { surveys } = usePce()
  const results = useMemo(() => deriveResults(surveys), [surveys])
  /* Live: one identity per instructor (name + email from the directory). */
  const liveFacultyRows = useMemo(
    () => (inCollection ? deriveResultsForSurvey(survey) : []),
    [inCollection, survey],
  )

  /* Report scope — live overviews/reports can be per-faculty (Romit): 'all'
   * or a single instructorId; the chips in the identity strip drive it. */
  const [facultyScope, setFacultyScope] = useState<'all' | string>('all')

  /* Ops actions — the full set from the evaluations table (Romit 2026-07-09) */
  const [remindOpen, setRemindOpen] = useState(false)
  const [extendOpen, setExtendOpen] = useState(false)
  const [linkCopied, setLinkCopied] = useState(false)
  function copySurveyLink() {
    void navigator.clipboard.writeText(`${window.location.origin}/s/${survey.id}`)
    setLinkCopied(true)
    window.setTimeout(() => setLinkCopied(false), 2000)
  }
  const daysLeft = survey.deadline
    ? Math.ceil((new Date(survey.deadline).getTime() - Date.now()) / 86_400_000)
    : null

  const responses = MOCK_RESPONSES.find((r) => r.surveyId === survey.id)
  const qData = MOCK_SURVEY_QUESTION_DATA.find((d) => d.surveyId === survey.id)
  const template = templates.find((t) => t.id === survey.templateId)
  const sections: PceTemplateSection[] = template?.templateSections ?? []

  // E2 option B — owner, or PD while in Review mode, sees the AI lane.
  const ownerInsights = isOwner || (isPD && !result.releasedToFaculty)

  const siblings = results.filter(
    (r) => r.courseCode === result.courseCode && r.term === result.term && r.id !== result.id,
  )
  /* The faculty whose access the header can enable follows the scope selector:
   * a picked instructor, or the page owner while viewing the whole course. */
  const scopedFaculty =
    facultyScope === 'all'
      ? result
      : [result, ...siblings].find((f) => f.facultyId === facultyScope) ?? result

  /* Score cards — this course vs program, plus prior term */
  const courseAvg = responses?.sectionScores.find((s) => s.section === 'course_content')?.avg ?? null
  const sectionFacultyAvg = responses?.sectionScores.find((s) => s.section === 'faculty_performance')?.avg ?? null
  /* The Faculty Performance signal follows the faculty scope selector —
   * averaged from the scoped instructor block(s) ('all' = whole course);
   * section avg is the fallback. */
  const facultyAvg = useMemo(() => {
    if (!qData) return sectionFacultyAvg
    const blocks = (qData.instructorBlocks ?? []).filter(
      (b) =>
        survey.instructors.some((i) => i.id === b.instructorId) &&
        (facultyScope === 'all' || b.instructorId === facultyScope),
    )
    const avgs = blocks.flatMap((b) => b.scores.map((q) => q.avg))
    if (avgs.length === 0) return sectionFacultyAvg
    return avgs.reduce((a, b) => a + b, 0) / avgs.length
  }, [inCollection, qData, survey.instructors, facultyScope, sectionFacultyAvg])
  const programCourseAvg = useMemo(() => {
    const all = MOCK_RESPONSES.flatMap((r) =>
      r.sectionScores.filter((s) => s.section === 'course_content').map((s) => s.avg),
    )
    return all.length ? all.reduce((a, b) => a + b, 0) / all.length : null
  }, [])
  const programFacultyAvg = useMemo(() => {
    const all = MOCK_RESPONSES.flatMap((r) =>
      r.sectionScores.filter((s) => s.section === 'faculty_performance').map((s) => s.avg),
    )
    return all.length ? all.reduce((a, b) => a + b, 0) / all.length : null
  }, [])
  const prior = survey.priorOfferings?.at(-1) ?? null

  /* Theme strip rows — one per template section with question data, each
     carrying the PROGRAM average for the same theme (benchmark on the viz) */
  const themes = useMemo((): ThemeRowDatum[] => {
    if (!qData) return []
    /* Pedagogical theme taxonomy (Romit's reference): questions group into
     * Teaching Effectiveness / Communication / Assessment Practices / Course
     * Content — classified from the template question TEXT, with provenance
     * as the fallback (faculty-block questions teach/communicate; course-
     * section questions are content/assessment). */
    const THEME_ORDER = ['Teaching Effectiveness', 'Communication', 'Assessment Practices', 'Course Content']
    const textById = new Map<string, string>()
    for (const sec of sections) for (const q of sec.questions) textById.set(q.id, q.text)
    const classify = (questionId: string, fromFaculty: boolean): string => {
      const t = (textById.get(questionId) ?? '').toLowerCase()
      if (/assess|exam|grad|rubric|fair/.test(t)) return 'Assessment Practices'
      if (/communicat|respond|accessib|approach|feedback|available/.test(t)) return 'Communication'
      if (/teach|instruct|explain|clarit|clear|engag|effectiv|present/.test(t)) return 'Teaching Effectiveness'
      if (t) return 'Course Content'
      return fromFaculty ? 'Teaching Effectiveness' : 'Course Content'
    }
    type ThemedQ = { theme: string; avg: number; distribution?: number[] }
    const collect = (
      data: (typeof MOCK_SURVEY_QUESTION_DATA)[number],
      allowInstructor: (id: string) => boolean,
      parts: { course: boolean; faculty: boolean } = { course: true, faculty: true },
    ): ThemedQ[] => {
      const qs: ThemedQ[] = []
      if (parts.course)
        for (const scores of Object.values(data.sectionScores))
          for (const q of scores) qs.push({ theme: classify(q.questionId, false), avg: q.avg, distribution: q.distribution })
      if (parts.faculty)
        for (const b of data.instructorBlocks ?? []) {
          if (!allowInstructor(b.instructorId)) continue
          for (const q of b.scores) qs.push({ theme: classify(q.questionId, true), avg: q.avg, distribution: q.distribution })
        }
      return qs
    }
    /* Scope follows the faculty selector: 'all' = whole course, else one
       instructor — and the survey's evalScope on a split offering (a Course
       survey never shows instructor questions, and vice versa). */
    const mine = collect(
      qData,
      (id) => survey.instructors.some((i) => i.id === id) && (facultyScope === 'all' || id === facultyScope),
      { course: result.evalScope !== 'instructor', faculty: result.evalScope !== 'course' },
    )
    const program = MOCK_SURVEY_QUESTION_DATA.flatMap((d) => collect(d, () => true))
    const rows: ThemeRowDatum[] = []
    for (const theme of THEME_ORDER) {
      const qs = mine.filter((x) => x.theme === theme)
      if (qs.length === 0) continue
      const dist: [number, number, number, number, number] = [0, 0, 0, 0, 0]
      qs.forEach((x) => (x.distribution ?? []).forEach((n, i) => { if (i < 5) dist[i] += n }))
      const prog = program.filter((x) => x.theme === theme)
      rows.push({
        theme,
        avg: qs.reduce((a, x) => a + x.avg, 0) / qs.length,
        questions: qs.length,
        programAvg: prog.length ? prog.reduce((a, x) => a + x.avg, 0) / prog.length : null,
        dist,
      })
    }
    return rows
  }, [qData, sections, inCollection, facultyScope, survey.instructors, result.facultyId])

  /* Collapsed-section previews — the closed shells still say something */
  const allQuestionScores = qData
    ? [
        ...Object.values(qData.sectionScores).flat(),
        ...(qData.instructorBlocks ?? [])
          .filter(
            (b) =>
              survey.instructors.some((i) => i.id === b.instructorId) &&
              (facultyScope === 'all' || b.instructorId === facultyScope),
          )
          .flatMap((b) => b.scores),
      ]
    : []
  const lowestScore = allQuestionScores.length
    ? allQuestionScores.reduce((m, q) => (q.avg < m.avg ? q : m))
    : null

  /* Question breakdown groups — Course vs Faculty (spec grouping); a split
     offering's survey only shows its own half. */
  const courseSections = result.evalScope === 'instructor' ? [] : sections.filter((s) => !s.roleSetId)
  const facultySections = result.evalScope === 'course' ? [] : sections.filter((s) => !!s.roleSetId)
  const scoreFor = (subjectKey: string, questionId: string, faculty: boolean) => {
    if (!qData) return undefined
    if (faculty) {
      /* Scope-aware: a picked faculty shows their block; 'all' averages every
       * instructor's answer to this question. */
      const allowed = (id: string) =>
        survey.instructors.some((i) => i.id === id) && (facultyScope === 'all' || id === facultyScope)
      const hits = (qData.instructorBlocks ?? [])
        .filter((b) => allowed(b.instructorId))
        .map((b) => b.scores.find((q) => q.questionId === questionId))
        .filter((q): q is NonNullable<typeof q> => !!q)
      if (hits.length === 0) return undefined
      if (hits.length === 1) return hits[0]
      const dist: [number, number, number, number, number] = [0, 0, 0, 0, 0]
      hits.forEach((h) => (h.distribution ?? []).forEach((n, i) => { if (i < 5) dist[i] += n }))
      return {
        questionId,
        avg: hits.reduce((a, h) => a + h.avg, 0) / hits.length,
        count: hits.reduce((a, h) => a + (h.count ?? 0), 0),
        distribution: dist,
      }
    }
    return qData.sectionScores[subjectKey]?.find((q) => q.questionId === questionId)
  }

  /* Comments — course vs faculty split, original indexes preserved */
  const allComments: IndexedComment[] = (responses?.comments ?? []).map((c, index) => ({
    ...c,
    index,
    surveyIdForToggle: survey.id,
  })) as IndexedComment[]
  const courseComments = allComments.filter((c) => c.section === 'course_content')
  const facultyComments = allComments.filter((c) => c.section !== 'course_content')
  const visibleComments = allComments.filter((c) => !hiddenIdx.includes(c.index))
  const aiThemes = deriveThemes(visibleComments)
  const topThemes = [...aiThemes].sort((a, b) => b.occurrences - a.occurrences).slice(0, 3)
  const concernThemes = aiThemes.filter((t) => t.sentiment === 'concern')
  /* Collapsed-state preview — the card says something before it's expanded
     (Hotjar's sentiment-quote row): counts + one representative quote, a
     constructive one first since that's the actionable read. */
  const sentimentCounts = {
    positive: visibleComments.filter((c) => c.sentiment === 'positive').length,
    concern: visibleComments.filter((c) => c.sentiment === 'concern').length,
    neutral: visibleComments.filter((c) => c.sentiment === 'neutral').length,
  }
  const previewQuote =
    visibleComments.find((c) => c.sentiment === 'concern') ?? visibleComments[0] ?? null

  const RECOMMENDATION: Record<string, string> = {
    Pacing: 'Revisit the weekly cadence — students flagged pacing; consider spreading the heaviest units.',
    'Faculty engagement': 'Keep the engagement practices students praised; share them at the next faculty meeting.',
    'Course materials': 'Refresh the flagged materials and confirm every resource link works before next term.',
    'Assessment quality': 'Review the flagged assessments — align difficulty and add worked examples.',
    'Office hours': 'Consider adding or re-announcing office-hour slots; availability came up in comments.',
  }
  const recommendations = (concernThemes.length > 0 ? concernThemes : topThemes)
    .slice(0, 3)
    .map((t) => RECOMMENDATION[t.label])
    .filter(Boolean)

  const hiddenCount = hiddenIdx.length

  /* Anchor navigation — section + per-question anchors (Romit 2026-07-09).
     The two collapsed shells are CONTROLLED so an anchor inside them can
     expand first, then scroll on the next frames. */
  const [qbOpen, setQbOpen] = useState(false)
  const [qualOpen, setQualOpen] = useState(false)
  /* Release feedback — the header comment's promised LocalBanner state flip
     (toast banned); success must be announced, not inferred from a button
     disappearing. */
  const [releaseSuccess, setReleaseSuccess] = useState(false)
  function goTo(id: string, expand?: 'questions' | 'comments') {
    const wasClosed =
      (expand === 'questions' && !qbOpen) || (expand === 'comments' && !qualOpen)
    if (expand === 'questions') setQbOpen(true)
    if (expand === 'comments') setQualOpen(true)
    // Radix collapsibles animate open — wait for layout to settle before
    // measuring. Instant scroll: smooth window scrolling is inert under the
    // app shell (verified 2026-07-09), so 'auto' is the reliable behavior.
    window.setTimeout(
      () => document.getElementById(id)?.scrollIntoView({ behavior: 'auto', block: 'start' }),
      wasClosed ? 320 : 30,
    )
  }
  const questionIndex = useMemo(
    () =>
      [...courseSections, ...facultySections].flatMap((section) =>
        section.questions
          .filter((q) => q.answerType !== 'title')
          .map((q) => ({ id: q.id, label: q.text })),
      ),
    [courseSections, facultySections],
  )

  /* Question breakdown rows — rated + free-text, in template order. */
  const breakdownRows = useMemo((): BreakdownRow[] => {
    if (!qData) return []
    const out: BreakdownRow[] = []
    for (const group of [
      { label: 'Course', list: courseSections, faculty: false },
      { label: 'Faculty', list: facultySections, faculty: true },
    ]) {
      for (const section of group.list) {
        for (const q of section.questions) {
          if (q.answerType === 'title') continue
          if (q.answerType === 'free_text') {
            out.push({
              id: q.id,
              label: q.text,
              group: group.label,
              kind: 'freeText',
              freeTextCount: qData.freeTextCounts[q.id] ?? 0,
            })
            continue
          }
          const score = scoreFor(section.subjectKey, q.id, group.faculty)
          if (!score) continue
          const counts = score.distribution ?? [0, 0, 0, 0, 0]
          out.push({
            id: q.id,
            label: q.text,
            group: group.label,
            kind: 'rated',
            avg: score.avg,
            median: medianFromDistribution(counts),
            programAvg: programAvgForQuestion(q.id),
            counts,
            total: counts.reduce((a, b) => a + b, 0),
          })
        }
      }
    }
    return out
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qData, courseSections, facultySections, result.facultyId, inCollection, facultyScope, survey.instructors])

  /* Closed Loop Timeline — last term's logged concerns vs this term's themes.
     Spec gate: owner AND not a Faculty role; with E2 option B that resolves to
     the PD's owner-equivalent lane (Review mode). Status per concern is
     derived: theme gone → resolved · present without concern → improved ·
     still a concern → persistent. */
  const loopRows = useMemo(() => {
    const concerns = prior?.concerns ?? []
    return concerns.map((label) => {
      const now = aiThemes.find((t) => t.label === label)
      const status: 'resolved' | 'improved' | 'persistent' =
        !now ? 'resolved' : now.sentiment === 'concern' ? 'persistent' : 'improved'
      return { label, status, occurrences: now?.occurrences ?? 0 }
    })
  }, [prior, aiThemes])
  const showFeedbackLoop = ownerInsights && isPD && loopRows.length > 0

  const LOOP_BADGE: Record<'resolved' | 'improved' | 'persistent', { label: string; tone: 'success' | 'info' | 'warning' }> = {
    resolved:   { label: 'Resolved',   tone: 'success' },
    improved:   { label: 'Improved',   tone: 'info' },
    persistent: { label: 'Persistent', tone: 'warning' },
  }

  return (
    <>
      <SiteHeader
        breadcrumbs={origin.trail}
        title={result.courseCode}
      />
      <PageHeader
        title={
          /* Custom title node = PageHeader does NOT wrap it in its <h1> — so
             this node must supply the h1 itself, with the DS's exact title
             classes, or the page loses its heading and serif treatment. */
          <span className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
            <h1 className="line-clamp-2 min-w-0 overflow-hidden break-words font-heading text-xl font-semibold leading-tight tracking-tight text-foreground sm:text-2xl">
              {`${result.courseCode} — ${result.courseName}`}
            </h1>
            {inCollection ? (
              <SurveyStatusBadgeOS status={survey.status} />
            ) : (
              <StatusBadge
                label={RESULT_STATUS_BADGE.available.label}
                tone={RESULT_STATUS_BADGE.available.tone}
                icon={RESULT_STATUS_BADGE.available.icon}
              />
            )}
          </span>
        }
        subtitle={`${result.term}${result.academicYear ? ` · AY ${result.academicYear}` : ''} · ${result.program}`}
        actions={
          /* Hierarchy: ONE primary per state. Live → Send reminder is the
             highest-leverage act (below-target collection); Extend is the
             fallback; link/preview live in the Share card with context.
             Finished → reading actions visible, ops demoted to a ⋯ menu. */
          <div className="flex items-center gap-2 flex-wrap" role="group" aria-label="Result actions">
            {inCollection && isPD && (
              <>
                <Button variant="default" size="sm" onClick={() => setRemindOpen(true)}>
                  Send reminder
                </Button>
                <Button variant="outline" size="sm" onClick={() => setExtendOpen(true)}>
                  Extend close date
                </Button>
                {/* Secondary ops tucked into ⋯ (Romit) — copy link + preview
                    moved here from the removed Share card. */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon-sm" aria-label="More actions">
                      <i className="fa-light fa-ellipsis" aria-hidden="true" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onSelect={copySurveyLink}>
                      {linkCopied ? 'Link copied' : 'Copy survey link'}
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href={`/surveys/${survey.id}/preview`}>Preview form</Link>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            )}
            {!inCollection && (
              <>
                {isPD && !scopedFaculty.releasedToFaculty && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      onRelease()
                      setReleaseSuccess(true)
                    }}
                  >
                    {facultyScope === 'all'
                      ? 'Enable faculty access'
                      : `Enable access for ${scopedFaculty.facultyName}`}
                  </Button>
                )}
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/surveys/${survey.id}/preview`}>Preview form</Link>
                </Button>
                {/* PD-only: /analytics is an ungated admin surface with
                    program-wide data — faculty must not land there (scope
                    flag 2026-07-16; faculty longitudinal view is a separate
                    surface pending integration). */}
                {isPD && (
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/analytics?tab=course&courseCode=${encodeURIComponent(result.courseCode)}`}>
                    View Longitudinal Insights
                  </Link>
                </Button>
                )}
                {isPD && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="icon-sm" aria-label="More actions">
                        <i className="fa-light fa-ellipsis" aria-hidden="true" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onSelect={copySurveyLink}>
                        {linkCopied ? 'Link copied' : 'Copy survey link'}
                      </DropdownMenuItem>
                      <DropdownMenuItem onSelect={() => setRemindOpen(true)}>
                        Send reminder
                      </DropdownMenuItem>
                      <DropdownMenuItem onSelect={() => setExtendOpen(true)}>
                        Extend close date
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </>
            )}
          </div>
        }
      />

      <div className="flex-1 px-7 py-4">
        <div className="flex flex-col gap-4">
          {/* Identity strip — the faculty SCOPE control (live) or the result
              owner (finished). Status chip lives beside the title now. */}
          <div className="flex items-center gap-3 flex-wrap">
            <FacultyScopeSelector
              instructors={inCollection ? liveFacultyRows : [result, ...siblings]}
              scope={facultyScope}
              setScope={setFacultyScope}
              isPD={isPD}
            />
          </div>

          {/* Split-survey offering — sibling surveys keep their own statuses */}
          {offeringSiblings.length > 0 && (
            <OfferingSurveySwitcher current={result} siblings={offeringSiblings} />
          )}


          <Tabs defaultValue="overview" className="flex flex-col gap-4">
            <div className="border-b border-border">
              <TabsList variant="line">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="reports">Reports</TabsTrigger>
                {isOwner && <TabsTrigger value="mylogs">My Logs</TabsTrigger>}
              </TabsList>
            </div>

            {/* ── Overview — content column + side column (share card, rail) ── */}
            <TabsContent value="overview" className="m-0">
              <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_260px] gap-6 items-start">
              <div className="flex flex-col gap-4 min-w-0">
              {/* Live: collection health leads — this page is the cockpit
                  while responses accumulate; scores are early signal below. */}
              {inCollection && (
                <div id="pace" className="scroll-mt-16">
                  <CollectionPaceCard survey={survey} />
                </div>
              )}

              <div id="scores" className="scroll-mt-16 flex flex-col gap-2">
                {inCollection ? (
                  <div className="flex items-baseline gap-2">
                    <h3 className="text-sm font-semibold text-foreground">Early signal</h3>
                    <span className="text-xs text-muted-foreground">
                      Averages from the {result.responses} response{result.responses !== 1 ? 's' : ''} so far — expect movement until close
                    </span>
                  </div>
                ) : (
                  <h3 className="text-sm font-semibold text-foreground">Scores</h3>
                )}
                {releaseSuccess && (
                  <LocalBanner
                    variant="success"
                    title="Faculty access enabled"
                    dismissible
                    onDismiss={() => setReleaseSuccess(false)}
                  >
                    Results for {result.courseCode} are now visible to faculty.
                  </LocalBanner>
                )}
                {/* AI insight card removed (Romit 2026-07-17) — themes remain
                    reachable via the Qualitative feedback section. */}
                <div className={`grid grid-cols-1 gap-4 ${result.evalScope ? 'md:grid-cols-2' : 'md:grid-cols-3'}`}>
                  {result.evalScope !== 'instructor' && (
                  <ScoreCard
                    title="Course Content"
                    value={courseAvg}
                    programAvg={programCourseAvg}
                    priors={(survey.priorOfferings ?? []).map((p) => ({
                      term: p.term,
                      avg: p.courseAvg,
                      actionItems: p.actionItems,
                    }))}
                  />
                  )}
                  {result.evalScope !== 'course' && (
                  <ScoreCard
                    title="Faculty Performance"
                    value={facultyAvg}
                    programAvg={programFacultyAvg}
                    priors={(survey.priorOfferings ?? [])
                      .filter((p) => p.facultyAvg != null)
                      .map((p) => ({
                        term: p.term,
                        avg: p.facultyAvg as number,
                        actionItems: p.actionItems,
                      }))}
                  />
                  )}
                  {/* Response rate as a peer KPI card (Romit 2026-07-17) */}
                  <ResponseRateCard
                    rate={result.responseRate}
                    responses={result.responses}
                    enrolled={result.enrolled}
                  />
                </div>
              </div>

              <div id="themes" className="scroll-mt-16">
                <ThemeStripPlot themes={themes} partial={inCollection} />
              </div>

              {/* Question breakdown — collapsed by default (spec); controlled
                  so the anchor rail can expand it before scrolling. */}
              {qData && sections.length > 0 && (
                <div id="questions" className="scroll-mt-16">
                <Collapsible open={qbOpen} onOpenChange={setQbOpen}>
                  <Card>
                    {/* Radix trigger renders its own <button> — no raw button in product code */}
                    <CollapsibleTrigger className="w-full text-left focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 rounded-t-lg group">
                      <CardHeader>
                        <CardTitle className="text-sm" aria-level={2}>Question breakdown</CardTitle>
                        <CardDescription>
                          {allQuestionScores.length} rated question{allQuestionScores.length !== 1 ? 's' : ''}
                          {lowestScore ? ` · lowest ${lowestScore.avg.toFixed(1)}/5` : ''} · sorted lowest first · rating mix + you vs program
                        </CardDescription>
                        <CardAction>
                          <i
                            className="fa-light fa-chevron-down text-muted-foreground transition-transform group-data-[state=open]:rotate-180"
                            aria-hidden="true"
                          />
                        </CardAction>
                      </CardHeader>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <CardContent className="pt-0">
                        <QuestionBreakdownTable rows={breakdownRows} surveyId={survey.id} />
                      </CardContent>
                    </CollapsibleContent>
                  </Card>
                </Collapsible>
                </div>
              )}

              {/* Qualitative feedback — collapsed; only when open-text exists (spec);
                  controlled so the anchor rail can expand it before scrolling. */}
              {allComments.length > 0 && (
                <div id="comments" className="scroll-mt-16">
                <Collapsible open={qualOpen} onOpenChange={setQualOpen}>
                  <Card>
                    {/* Radix trigger renders its own <button> — no raw button in product code */}
                    <CollapsibleTrigger className="w-full text-left focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 rounded-t-lg group">
                      <CardHeader>
                        <CardTitle className="text-sm" aria-level={2}>Qualitative feedback</CardTitle>
                        <CardDescription>
                          {visibleComments.length} student comment{visibleComments.length !== 1 ? 's' : ''}
                          {sentimentCounts.positive > 0 ? ` · ${sentimentCounts.positive} positive` : ''}
                          {sentimentCounts.concern > 0 ? ` · ${sentimentCounts.concern} constructive` : ''}
                          {sentimentCounts.neutral > 0 ? ` · ${sentimentCounts.neutral} neutral` : ''}
                          {previewQuote ? (
                            <span className="block italic truncate">&ldquo;{previewQuote.text}&rdquo;</span>
                          ) : null}
                        </CardDescription>
                        <CardAction>
                          <i
                            className="fa-light fa-chevron-down text-muted-foreground transition-transform group-data-[state=open]:rotate-180"
                            aria-hidden="true"
                          />
                        </CardAction>
                      </CardHeader>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <CardContent className="pt-0 flex flex-col gap-5">
                        <p className="text-xs text-muted-foreground">
                          Anonymized responses — individual authorship cannot be identified.
                        </p>
                        <CommentList
                          title="Course related comments"
                          comments={courseComments}
                          hiddenIdx={hiddenIdx}
                          canModerate={isPD}
                        />
                        <CommentList
                          title="Faculty related comments"
                          comments={facultyComments}
                          hiddenIdx={hiddenIdx}
                          canModerate={isPD}
                        />

                        {ownerInsights && recommendations.length > 0 && (
                          <div>
                            <h4 className="text-sm font-medium mb-1.5">Top {recommendations.length} recommendation{recommendations.length !== 1 ? 's' : ''}</h4>
                            <ol className="flex flex-col gap-1.5 list-decimal ml-4">
                              {recommendations.map((r) => (
                                <li key={r} className="text-sm text-muted-foreground">
                                  {r}
                                </li>
                              ))}
                            </ol>
                          </div>
                        )}
                      </CardContent>
                    </CollapsibleContent>
                  </Card>
                </Collapsible>
                </div>
              )}

              {/* ── Feedback loop — closed-loop timeline (spec ST-15) ── */}
              {showFeedbackLoop && (
                <Card id="feedback-loop" className="scroll-mt-16">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm" aria-level={2}>Feedback loop</CardTitle>
                    <CardDescription>
                      {prior?.term} logged concerns vs this term&rsquo;s themes
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-col">
                    {loopRows.map((row) => {
                      const badge = LOOP_BADGE[row.status]
                      return (
                        <div
                          key={row.label}
                          className="flex items-center gap-3 py-2.5 border-b border-border last:border-0"
                        >
                          <p className="text-sm flex-1 min-w-0">{row.label}</p>
                          {row.occurrences > 0 && (
                            <span className="text-xs text-muted-foreground tabular-nums">
                              {row.occurrences} mention{row.occurrences !== 1 ? 's' : ''} this term
                            </span>
                          )}
                          <StatusBadge label={badge.label} tone={badge.tone} />
                        </div>
                      )
                    })}
                  </CardContent>
                </Card>
              )}
              </div>

              {/* ── Side column — "On this page" anchors (the live Share card's
                    copy-link/preview actions moved to the header ⋯ menu). ── */}
              <div className="hidden xl:flex flex-col gap-4 sticky top-16 self-start w-full">
              <nav aria-label="On this page" className="flex flex-col gap-0.5 w-full">
                <p className="text-xs font-medium text-muted-foreground mb-1.5">On this page</p>
                {inCollection && <AnchorLink label="Collection pace" onGo={() => goTo('pace')} />}
                <AnchorLink label={inCollection ? 'Early signal' : 'Scores'} onGo={() => goTo('scores')} />
                {themes.length > 0 && (
                  <AnchorLink label="Theme distribution" onGo={() => goTo('themes')} />
                )}
                {qData && sections.length > 0 && (
                  <>
                    <AnchorLink label="Question breakdown" onGo={() => goTo('questions', 'questions')} />
                    <div className="flex flex-col gap-0.5 max-h-64 overflow-y-auto border-s border-border ms-2 ps-2 my-0.5">
                      {questionIndex.map((q, i) => (
                        <AnchorLink
                          key={q.id}
                          label={`${i + 1}. ${q.label}`}
                          small
                          onGo={() => goTo(`question-${q.id}`, 'questions')}
                        />
                      ))}
                    </div>
                  </>
                )}
                {allComments.length > 0 && (
                  <AnchorLink label="Student comments" onGo={() => goTo('comments', 'comments')} />
                )}
                {showFeedbackLoop && (
                  <AnchorLink label="Feedback loop" onGo={() => goTo('feedback-loop')} />
                )}
              </nav>
              </div>
              </div>
            </TabsContent>

            {/* ── Reports ── */}
            <TabsContent value="reports" className="m-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm" aria-level={2}>Full Survey Report</CardTitle>
                    <CardDescription>
                      {result.evalScope ? `${EVAL_SCOPE_LABEL[result.evalScope]} only — ` : ''}
                      Complete results including scores, question breakdown, and student comments.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setExportKind('pdf')
                        setExportOpen(true)
                      }}
                    >
                      Download PDF
                    </Button>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm" aria-level={2}>Raw Responses</CardTitle>
                    <CardDescription>
                      {result.evalScope ? `${EVAL_SCOPE_LABEL[result.evalScope]} only — ` : ''}
                      Export all anonymized responses as a spreadsheet for further analysis.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setExportKind('csv')
                        setExportOpen(true)
                      }}
                    >
                      Download CSV
                    </Button>
                  </CardContent>
                </Card>
              </div>
              <ExportDrawer
                open={exportOpen}
                onOpenChange={setExportOpen}
                totalRows={result.responses}
                visibleColumns={exportKind === 'pdf' ? 6 : 12}
              />
            </TabsContent>

            {/* ── My Logs — owner only (spec E2: strict email/identity match) ── */}
            {isOwner && (
              <TabsContent value="mylogs" className="m-0">
                <div className="flex flex-col items-center gap-2 py-12 rounded-lg border border-dashed border-border bg-muted/25">
                  <i className="fa-light fa-notebook text-muted-foreground" aria-hidden="true" style={{ fontSize: 24 }} />
                  <p className="text-sm font-medium">My Logs</p>
                  <p className="text-xs text-muted-foreground">Coming soon.</p>
                </div>
              </TabsContent>
            )}
          </Tabs>
        </div>
      </div>

      {/* Ops dialogs — same flows as the evaluations table row actions */}
      <SendReminderDialog open={remindOpen} onOpenChange={setRemindOpen} surveys={[survey]} />
      <EditEndDateDialog open={extendOpen} onOpenChange={setExtendOpen} surveys={[survey]} />
    </>
  )
}
