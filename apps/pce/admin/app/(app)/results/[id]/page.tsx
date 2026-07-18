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
  FloatingSheetPanel,
  FloatingSheetPanelBody,
  FloatingSheetPanelContent,
  FloatingSheetPanelHeader,
  ToggleSwitch,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  chartTooltipKeyboardSyncProps,
} from '@exxatdesignux/ui'
import type { ChartConfig } from '@exxatdesignux/ui'
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, ReferenceLine } from 'recharts'
import { ChartCard, ChartFigure, ChartDataTable, type ChartLeoInsight } from '@/components/charts-overview'
import { RatingLegend, RatingStackedBar } from '@/components/pce/rating-viz'
import { termCollectionSeries, paceToTarget } from '@/lib/pce-collection'
import { CHART_AXIS_TICK, CHART_TICK_FONT_SIZE } from '@/lib/chart-typography'
import { SiteHeader } from '@/components/site-header'
import { usePce } from '@/components/pce/pce-state'
import { EditEndDateDialog, SendReminderDialog } from '@/components/pce/pce-modals'
import { deriveResults, deriveResultsForSurvey, rateColor, scoreColor, facultyFacingState, EVAL_SCOPE_LABEL, RESULT_STATUS_BADGE, type EvalResult } from '@/lib/pce-results'
import { SurveyStatusBadgeOS, SENTIMENT_CHIP } from '@/components/pce/pce-badges'
import { deriveThemes } from '@/lib/pce-themes'
import {
  MOCK_RESPONSES,
  MOCK_SURVEY_QUESTION_DATA,
  MOCK_OPEN_TEXT_RESPONSES,
  MOCK_PROGRAM_TERMS,
  medianFromDistribution,
  programAvgForQuestion,
  EVALUATION_TYPE_LABEL,
  EVALUATION_TYPE_ICON,
  EVALUATION_TYPE_ORDER,
  type EvaluationType,
  type PceSurvey,
  type PriorOffering,
  type ResponseComment,
  type PceTemplateSection,
} from '@/lib/pce-mock-data'
import { evaluationsFor } from '@/lib/pce-evaluations'

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

/** Per-evaluation-type summary strip (Romit 2026-07-17 critique): the offering
 *  runs SEVERAL evaluation types on their own clocks, so the detail must
 *  answer "which types, how did each do" at a glance — status + avg + count
 *  per type. A type on THIS survey jumps to its question group; a type on a
 *  split-offering sibling survey links there, its score/state carried inline
 *  so the divergence is visible without navigating. */
function EvaluationSummaryStrip({
  survey,
  result,
  siblings,
  courseAvg,
  facultyAvg,
  facultyLabel,
  hasCourse,
  onGo,
}: {
  survey: PceSurvey
  result: EvalResult
  siblings: EvalResult[]
  courseAvg: number | null
  facultyAvg: number | null
  /** Names line on the Faculty chip — one instructor's name or "N instructors". */
  facultyLabel: string | null
  /** False for a faculty-only template — no Course chip to show. */
  hasCourse: boolean
  onGo: (anchorId: string) => void
}) {
  const origin = useResultsOrigin()
  const SCOPE_TO_TYPE: Record<'course' | 'instructor', EvaluationType> = {
    course: 'course_material',
    instructor: 'faculty_roles',
  }
  const siblingByType = new Map(
    siblings.filter((s) => s.evalScope).map((s) => [SCOPE_TO_TYPE[s.evalScope!], s]),
  )
  const instances = new Map(evaluationsFor(survey).map((e) => [e.type, e]))
  const currentType = result.evalScope ? SCOPE_TO_TYPE[result.evalScope] : null

  /* One chip per type the offering actually runs: on this survey (merged, or
     the current half of a split) or on a sibling survey. */
  const chips = EVALUATION_TYPE_ORDER.filter(
    (t) =>
      (currentType === null || currentType === t || siblingByType.has(t)) &&
      (t !== 'course_material' || hasCourse || siblingByType.has(t)),
  )

  const chipInner = (type: EvaluationType) => {
    const sibling = currentType !== null && currentType !== type ? siblingByType.get(type) : undefined
    const isFaculty = type === 'faculty_roles'
    const avg = sibling ? sibling.avgScore : isFaculty ? facultyAvg : courseAvg
    const inst = instances.get(type)
    const responses = sibling ? sibling.responses : inst?.responseCount ?? survey.responseCount
    const enrolled = sibling ? sibling.enrolled : inst?.enrollmentCount ?? survey.enrollmentCount
    const state = sibling ? facultyFacingState(sibling) : 'score'
    const gated = state !== 'score'
    return (
      <>
        <span className="flex items-center gap-1.5 min-w-0">
          <i className={`fa-light ${EVALUATION_TYPE_ICON[type]} text-xs text-muted-foreground`} aria-hidden="true" />
          <span className="text-xs font-medium text-foreground whitespace-nowrap">
            {EVALUATION_TYPE_LABEL[type]} evaluation
          </span>
          {isFaculty && facultyLabel && !sibling && (
            <span className="text-xs text-muted-foreground truncate">· {facultyLabel}</span>
          )}
        </span>
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground tabular-nums whitespace-nowrap">
          {sibling ? (
            <StatusBadge
              label={RESULT_STATUS_BADGE[state === 'review-pending' ? 'locked' : state === 'draft' ? 'suppressed' : 'available'].label}
              tone={RESULT_STATUS_BADGE[state === 'review-pending' ? 'locked' : state === 'draft' ? 'suppressed' : 'available'].tone}
            />
          ) : inst ? (
            <SurveyStatusBadgeOS status={inst.status} />
          ) : null}
          {!gated && avg != null && (
            <span>
              Avg <span className="font-semibold text-foreground">{avg.toFixed(1)}</span>
            </span>
          )}
          {!gated && <span>· {responses} of {enrolled}</span>}
        </span>
      </>
    )
  }

  const chipClass =
    'flex items-center gap-3 rounded-lg border border-border px-3 py-2 hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50'

  if (chips.length < 2 && currentType === null) return null
  return (
    <div className="flex items-center gap-2 flex-wrap" role="group" aria-label="Evaluation types for this course offering">
      {chips.map((type) => {
        const sibling = currentType !== null && currentType !== type ? siblingByType.get(type) : undefined
        if (sibling) {
          return (
            <Link
              key={type}
              href={withFrom(`/results/${encodeURIComponent(sibling.id)}`, origin.from)}
              className={chipClass}
            >
              {chipInner(type)}
            </Link>
          )
        }
        const active = currentType === type
        const anchorId = type === 'course_material' ? 'group-course' : 'group-faculty'
        return (
          /* Real fragment href — an in-page jump IS a link; onClick still owns
             the expand-then-scroll choreography (collapsible must open first). */
          <a
            key={type}
            href={`#${anchorId}`}
            aria-current={active ? 'true' : undefined}
            onClick={(e) => {
              e.preventDefault()
              onGo(anchorId)
            }}
            className={`${chipClass} ${active ? 'bg-muted/40' : ''}`}
          >
            {chipInner(type)}
          </a>
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
            {/* DS floor: initials never render in a disc under size-6 (24px) —
                two 12px caps physically exceed a 20px circle's chord. */}
            <AvatarInitials
              initials={f.facultyInitials}
              size="sm"
              className="shrink-0"
              fallbackClassName="text-xs font-medium"
              decorative
            />
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

/** Shared sentiment filter — ONE instance per surface (card top / sheet top),
 *  never repeated per section: the filter must not outweigh the content it
 *  filters (Hotjar's single filter row over the whole response list). */
function SentimentFilterGroup({
  value,
  onChange,
  countFor,
  label,
}: {
  value: SentimentFilter
  onChange: (f: SentimentFilter) => void
  countFor: (f: SentimentFilter) => number
  label: string
}) {
  return (
    <ToggleGroup
      type="single"
      value={value}
      onValueChange={(v) => v && onChange(v as SentimentFilter)}
      variant="outline"
      size="sm"
      aria-label={label}
    >
      {SENTIMENT_FILTERS.map((f) => (
        <ToggleGroupItem key={f.key} value={f.key} aria-label={`${f.label} comments`}>
          {f.label} ({countFor(f.key)})
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  )
}

/** How many comments each section shows before "Show all" — keeps a
 *  high-volume section scannable without a nested scrollbar. */
const COMMENTS_PREVIEW_COUNT = 6

function CommentList({
  title,
  icon,
  person,
  comments,
  hiddenIdx,
  canModerate,
  filter,
}: {
  title: string
  /** Evaluation-type glyph for the group header (course / faculty / general). */
  icon?: string
  /** Attributed instructor — renders an avatar so "about whom" is unmissable. */
  person?: { name: string; initials: string }
  comments: IndexedComment[]
  hiddenIdx: number[]
  canModerate: boolean
  /** Owned by the surface — ONE filter governs every section (PR #53). */
  filter: SentimentFilter
}) {
  const { toggleHideComment } = usePce()
  const [showAll, setShowAll] = useState(false)
  /* Re-truncate when the surface-level filter changes — an expanded "Show all"
     must not survive into a different filtered set (derive-from-props reset). */
  const [prevFilter, setPrevFilter] = useState(filter)
  if (prevFilter !== filter) {
    setPrevFilter(filter)
    setShowAll(false)
  }

  const visibleToRole = canModerate
    ? comments
    : comments.filter((c) => !hiddenIdx.includes(c.index))
  const filtered =
    filter === 'all'
      ? visibleToRole
      : visibleToRole.filter((c) => (c.sentiment ?? 'neutral') === filter)
  const hiddenCount = comments.filter((c) => hiddenIdx.includes(c.index)).length
  const shown = showAll ? filtered : filtered.slice(0, COMMENTS_PREVIEW_COUNT)

  if (comments.length === 0) return null

  return (
    <section className="flex flex-col" aria-label={title}>
      {/* Section header: provenance identity (type glyph or instructor avatar)
          + counts only. Hidden count is quiet meta for the moderator — status
          chips stay down on the rows they describe. h3: the card title above
          is aria-level 2, heading order must not skip (axe heading-order). */}
      <div className="flex items-center gap-2 pb-1.5 border-b border-border min-w-0">
        {person ? (
          <AvatarInitials initials={person.initials} size="sm" fallbackClassName="text-xs font-medium" decorative />
        ) : icon ? (
          <i className={`fa-light ${icon} text-xs text-muted-foreground`} aria-hidden="true" />
        ) : null}
        <h3 className="text-sm font-medium truncate">{title}</h3>
        <span className="text-xs text-muted-foreground tabular-nums">
          {visibleToRole.length}
          {canModerate && hiddenCount > 0 && <> · {hiddenCount} hidden from faculty</>}
        </span>
      </div>
      {filtered.length === 0 ? (
        /* filter === 'all' + zero visible = comments exist but are withheld
           (moderator hid them) — don't blame the sentiment filter for it. */
        <p className="text-sm text-muted-foreground py-3">
          {filter === 'all' ? 'No comments available.' : 'No comments match this filter.'}
        </p>
      ) : (
        <div className="flex flex-col">
          {shown.map((c) => {
            const isHidden = hiddenIdx.includes(c.index)
            const chip = SENTIMENT_CHIP[c.sentiment ?? 'neutral']
            const switchId = `comment-visible-${c.surveyIdForToggle}-${c.index}`
            return (
              <div
                key={c.index}
                className="flex items-start gap-6 py-3 border-b border-border last:border-0"
              >
                {/* Quote first — the comment is the content; the sentiment chip
                    annotates beneath. De-emphasis via the AA-calibrated token,
                    never opacity. */}
                <div className="flex-1 min-w-0 flex flex-col gap-1.5">
                  <p className={`text-sm leading-relaxed ${isHidden ? 'text-muted-foreground' : ''}`}>
                    &ldquo;{c.text}&rdquo;
                  </p>
                  <div className="flex items-center gap-2">
                    <StatusBadge label={chip.label} tone={chip.tone} />
                  </div>
                </div>
                {/* Moderation is a stateful control, not a chip-shaped button:
                    the switch carries BOTH the current visibility and the
                    action (PR #53 — "Hide doesn't look actionable"). */}
                {canModerate && (
                  <div className="flex items-center gap-2 shrink-0 pt-0.5">
                    <label htmlFor={switchId} className="text-xs text-muted-foreground">
                      Visible to faculty
                    </label>
                    <ToggleSwitch
                      id={switchId}
                      checked={!isHidden}
                      onChange={() => toggleHideComment(c.surveyIdForToggle, c.index)}
                    />
                  </div>
                )}
              </div>
            )
          })}
          {filtered.length > COMMENTS_PREVIEW_COUNT && (
            <div className="pt-2">
              <Button variant="ghost" size="sm" onClick={() => setShowAll((s) => !s)}>
                {showAll ? 'Show fewer' : `Show all ${filtered.length} comments`}
              </Button>
            </div>
          )}
        </div>
      )}
    </section>
  )
}

/* ── score card ───────────────────────────────────────────────────────────── */

const PRIORITY_RANK: Record<string, number> = { high: 0, medium: 1, low: 2 }

function ScoreCard({
  title,
  icon,
  statusBadge,
  responseMeta,
  value,
  programAvg,
  priors,
}: {
  title: string
  /** Evaluation-type glyph — ties the card to its type without a second row. */
  icon?: string
  /** Per-type status (each type runs on its own clock — Romit 2026-07-17). */
  statusBadge?: React.ReactNode
  /** Per-type collection count, e.g. "46 of 50". */
  responseMeta?: string
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
        {/* Type identity + per-type status live ON the summary they describe —
            not in a separate chip row above the tabs (hierarchy: one control
            row, then content; Romit 2026-07-17 crowding critique). */}
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <p className="text-xs text-muted-foreground flex items-center gap-1.5 min-w-0">
            {icon && <i className={`fa-light ${icon}`} aria-hidden="true" />}
            <span className="truncate">{title}</span>
          </p>
          {(statusBadge || responseMeta) && (
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground tabular-nums whitespace-nowrap">
              {statusBadge}
              {responseMeta && <span>{responseMeta}</span>}
            </span>
          )}
        </div>
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
                  <span
                    tabIndex={0}
                    className="underline decoration-dotted underline-offset-2 cursor-help rounded-sm focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                  >
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
  /** Multi-instructor course, "All faculty" scope: the per-instructor split of
   *  this faculty question — the aggregate row above stays the summary. */
  perFaculty?: { facultyId: string; name: string; initials: string; avg: number; counts: number[]; total: number }[]
}

/** Section → evaluation-type classifier. Builder templates mark faculty
 *  sections with roleSetId; richer/legacy templates encode the same thing in
 *  subjectKey (course_instructor, lab_instructor, …). course_director is the
 *  General bucket ("Overall Experience"). Keying on roleSetId alone lumped
 *  every tmplrich section under Course — the exact mis-attribution of the
 *  2026-07-17 critique. */
const FACULTY_SUBJECT_KEYS = new Set([
  'faculty',
  'course_instructor',
  'course_coordinator',
  'teaching_assistant',
  'lab_instructor',
  'preceptor',
  'clinical_supervisor',
])
function sectionGroupOf(s: PceTemplateSection): 'Course' | 'Faculty' | 'General' {
  if (s.roleSetId || FACULTY_SUBJECT_KEYS.has(s.subjectKey)) return 'Faculty'
  if (s.subjectKey === 'course_director') return 'General'
  return 'Course'
}

/** Band + context metadata per question group — the provenance callout
 *  (which evaluation type, about whom) that the bare group key can't carry. */
interface GroupMeta {
  icon: string
  label: string
  /** Faculty band only — instructor name(s) the questions are about. */
  sub?: string
  anchorId: string
  /** One-line provenance for the written-responses sheet. */
  contextLine: string
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

/** Free-text row — Sprig's question-first block (PR #53 anatomy): question as
 *  the heading, a count + sentiment meta line, TWO preview quotes inline, and
 *  the full anonymized list in a FloatingSheetPanel whose subtitle carries the
 *  evaluation-type provenance. Count comes from the actual response records so
 *  the sheet can always back what the row claims. */
function WrittenResponsesRow({ row, surveyId, context }: { row: BreakdownRow; surveyId: string; context?: string }) {
  const responses = MOCK_OPEN_TEXT_RESPONSES.filter(
    (x) => x.surveyId === surveyId && x.questionText === row.label,
  )
  const count = responses.length
  const [open, setOpen] = useState(false)
  const [filter, setFilter] = useState<SentimentFilter>('all')
  const filtered =
    filter === 'all' ? responses : responses.filter((x) => (x.sentiment ?? 'neutral') === filter)
  const countFor = (f: SentimentFilter) =>
    f === 'all' ? count : responses.filter((x) => (x.sentiment ?? 'neutral') === f).length
  const positives = countFor('positive')
  const concerns = countFor('concern')
  const previews = responses.slice(0, 2)
  return (
    <div
      id={`question-${row.id}`}
      className="scroll-mt-16 flex flex-col gap-2 py-3 border-b border-border last:border-0"
    >
      <div className="flex items-start justify-between gap-6">
        <div className="min-w-0 flex flex-col gap-0.5">
          <p className="text-sm">{row.label}</p>
          <p className="text-xs text-muted-foreground tabular-nums">
            {count === 0
              ? 'Written responses — none yet'
              : `${count} written response${count !== 1 ? 's' : ''}`}
            {positives > 0 && <> · {positives} positive</>}
            {concerns > 0 && <> · {concerns} constructive</>}
          </p>
        </div>
        {count > 0 && (
          <Button variant="outline" size="sm" className="shrink-0" onClick={() => setOpen(true)}>
            View all {count}
            <i className="fa-light fa-arrow-right" aria-hidden="true" />
          </Button>
        )}
      </div>
      {previews.map((x) => (
        <p key={x.id} className="text-sm text-muted-foreground truncate">
          &ldquo;{x.text}&rdquo;
        </p>
      ))}
      <FloatingSheetPanel open={open} onOpenChange={setOpen}>
        <FloatingSheetPanelContent>
          <FloatingSheetPanelHeader
            title={row.label}
            subtitle={`${count} written response${count !== 1 ? 's' : ''} · anonymized${context ? ` · ${context}` : ''}`}
            onClose={() => setOpen(false)}
          />
          <FloatingSheetPanelBody className="flex flex-col gap-4">
            <SentimentFilterGroup
              value={filter}
              onChange={setFilter}
              countFor={countFor}
              label={`Filter responses to “${row.label}” by sentiment`}
            />
            <div className="flex flex-col">
              {filtered.length === 0 ? (
                <p className="text-sm text-muted-foreground py-3">
                  No responses match this filter.
                </p>
              ) : (
                /* Same row anatomy as the qualitative-feedback card — quote
                   first, sentiment chip on the meta line beneath. */
                filtered.map((x) => {
                  const chip = x.sentiment ? SENTIMENT_CHIP[x.sentiment] : null
                  return (
                    <div
                      key={x.id}
                      className="flex flex-col gap-1.5 py-3 border-b border-border last:border-0 first:pt-0"
                    >
                      <p className="text-sm leading-relaxed">&ldquo;{x.text}&rdquo;</p>
                      {chip && <StatusBadge label={chip.label} tone={chip.tone} className="self-start" />}
                    </div>
                  )
                })
              )}
            </div>
          </FloatingSheetPanelBody>
        </FloatingSheetPanelContent>
      </FloatingSheetPanel>
    </div>
  )
}

/* ── question dot strip ───────────────────────────────────────────────────────
   Level + comparison mark for dense question rows (Cleveland dot strip — ref
   Midjourney survey results; dataviz form table "before/after per item →
   dumbbell"): p25–p75 band = consensus, dot = course avg (amber when below
   program — no red), tick = program benchmark. Multi-instructor questions
   plot one initialed hollow dot per instructor INSTEAD of the aggregate dot
   (the right-hand numbers keep the aggregate) — replacing the former
   per-instructor sub-rows. Distribution SHAPE stays the theme strip's job;
   exact counts live in the row aria-label + ChartDataTable. */

/** Weighted quantile over the 1–5 distribution, each rating an [r−.5, r+.5] bin. */
function ratingQuantile(counts: number[], total: number, q: number): number {
  if (total <= 0) return 3
  const target = q * total
  let cum = 0
  for (let i = 0; i < 5; i++) {
    const c = counts[i] ?? 0
    if (c > 0 && cum + c >= target) {
      return Math.min(5, Math.max(1, i + 0.5 + (target - cum) / c))
    }
    cum += c
  }
  return 5
}

/* Data-dense strip, domain-zoomed (Romit 2026-07-17 "not working" — the real
   defect was WASTED DOMAIN: all values live in ~3.4–4.6, so a fixed 1–5 axis
   compressed every mark into the same pixels. Position marks may truncate the
   axis when it's labeled (dots encode position, not length): the table
   computes ONE shared domain from its own data and every row plots on it, so
   a 0.1 gap renders ~10–20px and You-dot + program tick + gap bar +
   instructor initials coexist on a single lane with real separation. */
function QuestionDotStrip({
  avg,
  programAvg,
  counts,
  total,
  perFaculty,
  domainLo,
  annotate = false,
}: {
  avg?: number
  programAvg?: number | null
  counts: number[]
  total: number
  perFaculty?: BreakdownRow['perFaculty']
  /** Shared axis start (≤ every plotted value; 5 is always the end). */
  domainLo: number
  /** First rated row only — direct-labels "You" / "Program" under the marks
   *  (teach-once, Midjourney pattern; legends are the weakest identifier). */
  annotate?: boolean
}) {
  const lo = domainLo
  const x = (v: number) => ((Math.min(5, Math.max(lo, v)) - lo) / (5 - lo)) * 100
  const p25 = ratingQuantile(counts, total, 0.25)
  const p75 = ratingQuantile(counts, total, 0.75)
  const ticks: number[] = []
  for (let v = lo; v <= 5.001; v += 0.5) ticks.push(Math.round(v * 2) / 2)
  const marks = (perFaculty ?? [])
    .map((f) => ({ ...f, pos: x(f.avg) }))
    .sort((a, b) => a.pos - b.pos)
  /* Near-coincident initials nudge apart so both stay readable. */
  const markPos: number[] = []
  marks.forEach((m, i) => {
    let p = m.pos
    if (i > 0 && p - markPos[i - 1] < 6) p = markPos[i - 1] + 6
    markPos.push(Math.min(100, p))
  })
  const gap = avg != null && programAvg != null ? avg - programAvg : null
  const below = gap != null && gap < -0.05
  /* Multi-instructor rows raise the line to make room for offset initials
     ABOVE it — labels never sit on the marks (offset-label pattern), so the
     line keeps only band + tick + dot + small instructor position ticks. */
  const hasInitials = marks.length > 0
  const lineY = hasInitials ? 'top-[68%]' : annotate ? 'top-[38%]' : 'top-1/2'
  const gapY = hasInitials ? 'top-[38%]' : annotate ? 'top-0.5' : 'top-1'
  const height = hasInitials ? 'h-8' : annotate ? 'h-10' : 'h-7'
  /* Coincident You/Program on the annotated row → one combined label. */
  const coincident =
    avg != null && programAvg != null && Math.abs(x(avg) - x(programAvg)) < 8
  return (
    <div className={`relative w-full min-w-0 ${height}`} aria-hidden="true">
      <div className={`absolute inset-x-0 ${lineY} h-px -translate-y-1/2 bg-border`} />
      {ticks.map((n) => (
        <span
          key={n}
          className={`absolute ${lineY} w-px -translate-x-1/2 -translate-y-1/2 bg-border ${Number.isInteger(n) ? 'h-2' : 'h-1'}`}
          style={{ left: `${x(n)}%` }}
        />
      ))}
      {/* consensus whisker — middle 50% of ratings; CONTEXT, so it recedes:
          thin hairline that must never read as a bar-with-knob (visual review
          2026-07-17: the h-2 band dominated and its p75 edge read as the
          score). */}
      {total > 0 && p75 > lo && (
        <div
          className={`absolute ${lineY} h-1 -translate-y-1/2 rounded-full`}
          style={{
            left: `${x(p25)}%`,
            width: `${Math.max(1.5, x(p75) - x(p25))}%`,
            background: 'var(--border-control-35)',
          }}
        />
      )}
      {/* signed gap bar — the program→course delta drawn, not only printed */}
      {gap != null && Math.abs(gap) > 0.05 && (
        <div
          className={`absolute ${gapY} h-0.5 rounded-full`}
          style={{
            left: `${Math.min(x(programAvg!), x(avg!))}%`,
            width: `${Math.max(1, Math.abs(x(avg!) - x(programAvg!)))}%`,
            background: below ? 'var(--chip-4)' : 'var(--chart-2)',
          }}
        />
      )}
      {programAvg != null && (
        <span
          className={`absolute ${lineY} h-4 w-0.5 -translate-x-1/2 -translate-y-1/2 rounded-full`}
          style={{ left: `${x(programAvg)}%`, background: 'var(--muted-foreground)' }}
        />
      )}
      {avg != null && (
        <span
          className={`absolute ${lineY} size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full ring-2 ring-[var(--card)]`}
          style={{
            left: `${x(avg)}%`,
            background: below ? 'var(--chip-4)' : 'var(--foreground)',
          }}
        />
      )}
      {/* instructor marks — HOLLOW circles (shape-distinct from the filled
          You dot and the program tick), initials offset above */}
      {marks.map((m) => (
        <span
          key={`c-${m.facultyId}`}
          className={`absolute ${lineY} size-2 -translate-x-1/2 -translate-y-1/2 rounded-full border-[1.5px] bg-card`}
          style={{
            left: `${m.pos}%`,
            borderColor:
              programAvg != null && m.avg < programAvg - 0.05
                ? 'var(--chip-4)'
                : 'var(--muted-foreground)',
          }}
        />
      ))}
      {marks.map((m, i) => (
        <span
          key={m.facultyId}
          className="absolute top-0 -translate-x-1/2 text-xs font-medium leading-none"
          style={{
            left: `${markPos[i]}%`,
            color:
              programAvg != null && m.avg < programAvg - 0.05
                ? 'var(--chip-4)'
                : 'var(--muted-foreground)',
          }}
        >
          {m.initials}
        </span>
      ))}
      {/* teach-once labels on the first rated row */}
      {annotate && avg != null && (
        <span
          className="absolute bottom-0 -translate-x-1/2 text-xs text-muted-foreground leading-none whitespace-nowrap"
          style={{ left: `${x(avg)}%` }}
        >
          {coincident ? 'You · Program' : 'You'}
        </span>
      )}
      {annotate && !coincident && programAvg != null && (
        <span
          className="absolute bottom-0 -translate-x-1/2 text-xs text-muted-foreground leading-none whitespace-nowrap"
          style={{ left: `${x(programAvg)}%` }}
        >
          Program
        </span>
      )}
    </div>
  )
}

function QuestionBreakdownTable({
  rows,
  surveyId,
  groupMeta,
}: {
  rows: BreakdownRow[]
  surveyId: string
  groupMeta: Record<string, GroupMeta>
}) {
  if (rows.length === 0) return null
  const groups = [...new Set(rows.map((r) => r.group))]
  /* ONE shared axis for every row, zoomed to the data (dots encode position,
     so a labeled truncated domain is honest — and it's what makes 0.1-wide
     gaps readable instead of smearing everything into the top fifth). Floor
     of all plotted values, padded and snapped to 0.5; never above 3.5, never
     below 1. */
  const plotted = rows
    .filter((r) => r.kind === 'rated')
    .flatMap((r) => [r.avg, r.programAvg ?? undefined, ...(r.perFaculty ?? []).map((f) => f.avg)])
    .filter((v): v is number => v != null)
  const domainLo = plotted.length
    ? Math.max(1, Math.min(3.5, Math.floor((Math.min(...plotted) - 0.2) * 2) / 2))
    : 1
  const axisTicks: number[] = []
  for (let v = domainLo; v <= 5.001; v += 0.5) axisTicks.push(Math.round(v * 2) / 2)
  /* Teach-once: only the first rendered rated row (lowest favorable share of
     the first group — same order the table renders) labels You/Program. */
  const firstAnnotatedId = groups.length
    ? rows
        .filter((r) => r.group === groups[0] && r.kind === 'rated')
        .sort((a, b) => favorableShare(a.counts, a.total) - favorableShare(b.counts, b.total))[0]?.id
    : undefined
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
      {/* Division of labor by form: the theme strip owns distribution SHAPE
          (stacked bars, 4 rows); question rows own LEVEL vs benchmark — a
          two-lane strip: You-vs-program on top, instructor dumbbell below. */}
      <div className="flex items-center gap-4 pb-2 text-xs text-muted-foreground flex-wrap">
        <span className="inline-flex items-center gap-1.5">
          <span className="size-2 rounded-full" style={{ background: 'var(--foreground)' }} aria-hidden="true" />
          You (course avg)
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-0.5 rounded-full" style={{ background: 'var(--muted-foreground)' }} aria-hidden="true" />
          Program
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-0.5 w-5 rounded-full" style={{ background: 'var(--chart-2)' }} aria-hidden="true" />
          Gap vs program (amber = below)
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-1 w-5 rounded-full" style={{ background: 'var(--border-control-35)' }} aria-hidden="true" />
          Middle 50% of ratings
        </span>
        {rows.some((r) => r.perFaculty?.length) && (
          <span className="inline-flex items-center gap-1.5">
            <span className="size-2 rounded-full border-[1.5px] bg-card" style={{ borderColor: 'var(--muted-foreground)' }} aria-hidden="true" />
            Instructor (initials above)
          </span>
        )}
        <span className="tabular-nums">
          Scale {domainLo}–5 (no values below {domainLo})
        </span>
      </div>
      <div className="grid grid-cols-[minmax(200px,320px)_1fr_5rem_12rem] items-end gap-6 pb-2 border-b border-border">
        <span className="text-xs text-muted-foreground">Question</span>
        <div className="flex items-center justify-between text-xs text-muted-foreground tabular-nums" aria-hidden="true">
          {axisTicks.map((n) => (
            <span key={n}>{Number.isInteger(n) ? n : n.toFixed(1)}</span>
          ))}
        </div>
        <span className="text-xs text-muted-foreground text-right">n · fav %</span>
        <span className="text-xs text-muted-foreground text-right">You vs program</span>
      </div>
      {groups.map((group) => {
        const meta = groupMeta[group]
        return (
        <Fragment key={group}>
          {/* Provenance band — WHICH evaluation these questions belong to, and
              (faculty) about WHOM. Foreground label: this is the callout. */}
          <div
            id={meta?.anchorId}
            className="scroll-mt-16 bg-muted/50 -mx-6 px-6 py-2 border-b border-border flex items-center gap-2 flex-wrap"
          >
            {meta && <i className={`fa-light ${meta.icon} text-xs text-muted-foreground`} aria-hidden="true" />}
            <span className="text-xs font-medium text-foreground">{meta?.label ?? group}</span>
            {meta?.sub && <span className="text-xs text-muted-foreground">· {meta.sub}</span>}
          </div>
          {orderedFor(group).map((r) =>
            r.kind === 'rated' ? (
              <div
                key={r.id}
                id={`question-${r.id}`}
                role="img"
                aria-label={`${r.label}: average ${r.avg != null ? r.avg.toFixed(1) : 'unknown'} of 5${r.programAvg != null ? `, program average ${r.programAvg.toFixed(1)}` : ''}, from ${r.total ?? 0} rating${(r.total ?? 0) !== 1 ? 's' : ''}${
                  (r.total ?? 0) > 0
                    ? `, ${Math.round(favorableShare(r.counts, r.total) * 100)}% rated 4 or 5`
                    : ''
                }${
                  r.perFaculty && r.perFaculty.length > 0
                    ? `. Per instructor: ${r.perFaculty.map((f) => `${f.name} ${f.avg.toFixed(1)}`).join(', ')}`
                    : ''
                }`}
                className="scroll-mt-16 grid grid-cols-[minmax(200px,320px)_1fr_5rem_12rem] items-center gap-6 py-2.5 border-b border-border last:border-0"
              >
                <p className="text-sm min-w-0">{r.label}</p>
                <QuestionDotStrip
                  avg={r.avg}
                  programAvg={r.programAvg}
                  counts={r.counts ?? [0, 0, 0, 0, 0]}
                  total={r.total ?? 0}
                  perFaculty={r.perFaculty}
                  domainLo={domainLo}
                  annotate={r.id === firstAnnotatedId}
                />
                <p className="text-xs tabular-nums text-right whitespace-nowrap text-muted-foreground">
                  {(r.total ?? 0) > 0
                    ? `${r.total} · ${Math.round(favorableShare(r.counts, r.total) * 100)}%`
                    : '—'}
                </p>
                <CompareText avg={r.avg} programAvg={r.programAvg} />
              </div>
            ) : (
              <WrittenResponsesRow key={r.id} row={r} surveyId={surveyId} context={meta?.contextLine} />
            ),
          )}
        </Fragment>
        )
      })}
      <ChartDataTable
        caption="Question breakdown"
        headers={['Question', 'Group', 'Average', 'Median', 'Program average', 'Rated 1', 'Rated 2', 'Rated 3', 'Rated 4', 'Rated 5']}
        rows={rows
          .filter((r) => r.kind === 'rated')
          .flatMap((r) => [
            [
              r.label,
              r.group,
              r.avg != null ? r.avg.toFixed(1) : '—',
              r.median != null ? r.median.toFixed(1) : '—',
              r.programAvg != null ? r.programAvg.toFixed(1) : '—',
              ...(r.counts ?? [0, 0, 0, 0, 0]),
            ],
            ...(r.perFaculty ?? []).map((f) => [
              `${r.label} — ${f.name}`,
              r.group,
              f.avg.toFixed(1),
              '—',
              '—',
              ...f.counts,
            ]),
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

  /* Whose faculty data the page currently shows — a picked instructor, the
   * sole instructor, or (multi-instructor, 'all') nobody nameable. Drives the
   * Faculty Performance card title, the question-group band, comment-group
   * headers, and the summary strip (Romit 2026-07-17: every faculty-scoped
   * surface must SAY whose data it is). */
  const scopedInstructor =
    facultyScope !== 'all' ? survey.instructors.find((i) => i.id === facultyScope) ?? null : null
  const soleInstructor = survey.instructors.length === 1 ? survey.instructors[0] : null
  const scopedFacultyName = scopedInstructor?.name ?? soleInstructor?.name ?? null
  const facultyChipLabel =
    scopedFacultyName ?? (survey.instructors.length > 1 ? `${survey.instructors.length} instructors` : null)

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
  /* A faculty-only template (e.g. midterm check-in) has no course questions —
   * a permanent em-dash Course Content card would be noise, so skip it. */
  const templateHasCourse = sections.length === 0 || sections.some((sec) => sectionGroupOf(sec) !== 'Faculty')
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

  /* Per-type lifecycle — each evaluation type runs on its own clock; its
     status + collection count ride the matching score card header. */
  const evalInstances = useMemo(
    () => new Map(evaluationsFor(survey).map((e) => [e.type, e])),
    [survey],
  )
  const courseInst = evalInstances.get('course_material')
  const facultyInst = evalInstances.get('faculty_roles')

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

  /* Question breakdown groups — Course / Faculty / General via the section
     classifier (roleSetId OR subjectKey); a split offering's survey only shows
     its own half (General rides with the course half). */
  const courseSections = result.evalScope === 'instructor' ? [] : sections.filter((s) => sectionGroupOf(s) === 'Course')
  const facultySections = result.evalScope === 'course' ? [] : sections.filter((s) => sectionGroupOf(s) === 'Faculty')
  const generalSections = result.evalScope === 'instructor' ? [] : sections.filter((s) => sectionGroupOf(s) === 'General')
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
      /* Faculty-group sections without per-instructor blocks (labs, TAs) are
         scored at section level — fall back rather than dropping the row. */
      if (hits.length === 0) return qData.sectionScores[subjectKey]?.find((q) => q.questionId === questionId)
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
  const generalComments = allComments.filter((c) => c.section === 'course_director')
  const facultyComments = allComments.filter((c) => c.section === 'faculty_performance')
  /* Subject attribution — explicit facultyId, else the sole instructor. The
     subject is who the comment is ABOUT; authorship stays anonymous. */
  const commentSubjectId = (c: IndexedComment) => c.facultyId ?? soleInstructor?.id ?? null
  const facultyCommentGroups = survey.instructors
    .map((i) => ({ instructor: i, comments: facultyComments.filter((c) => commentSubjectId(c) === i.id) }))
    .filter((g) => g.comments.length > 0)
  const unattributedFacultyComments = facultyComments.filter(
    (c) => !survey.instructors.some((i) => i.id === commentSubjectId(c)),
  )
  const visibleComments = allComments.filter((c) => !hiddenIdx.includes(c.index))
  /* What THIS viewer can see — moderators also see hidden comments. Card
     description, filter counts and section lists must all draw from this one
     pool so no two numbers on the card disagree. (Themes/recommendations stay
     on visibleComments: they describe what faculty will read.) */
  const viewerComments = isPD ? allComments : visibleComments
  const commentTypeCounts = {
    course: viewerComments.filter((c) => c.section === 'course_content').length,
    faculty: viewerComments.filter((c) => c.section === 'faculty_performance').length,
    general: viewerComments.filter((c) => c.section === 'course_director').length,
  }
  const aiThemes = deriveThemes(visibleComments)
  const topThemes = [...aiThemes].sort((a, b) => b.occurrences - a.occurrences).slice(0, 3)
  const concernThemes = aiThemes.filter((t) => t.sentiment === 'concern')
  /* Collapsed-state preview — the card says something before it's expanded
     (Hotjar's sentiment-quote row): per-type counts + one representative
     quote, a constructive one first since that's the actionable read. */
  const previewQuote =
    viewerComments.find((c) => c.sentiment === 'concern') ?? viewerComments[0] ?? null

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
  /* ONE sentiment filter governs every comment section (PR #53 anatomy). */
  const [qualFilter, setQualFilter] = useState<SentimentFilter>('all')
  const qualCountFor = (f: SentimentFilter) =>
    f === 'all'
      ? viewerComments.length
      : viewerComments.filter((c) => (c.sentiment ?? 'neutral') === f).length
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
  /* Rail index mirrors the table's provenance: questions nested under their
     evaluation-type group, numbering restarting per group. */
  const questionIndexGroups = useMemo(
    () =>
      [
        { key: 'Course' as const, sections: courseSections },
        { key: 'Faculty' as const, sections: facultySections },
        { key: 'General' as const, sections: generalSections },
      ]
        .map((g) => ({
          key: g.key,
          items: g.sections.flatMap((section) =>
            section.questions
              .filter((q) => q.answerType !== 'title')
              .map((q) => ({ id: q.id, label: q.text })),
          ),
        }))
        .filter((g) => g.items.length > 0),
    [courseSections, facultySections, generalSections],
  )

  /* Question breakdown rows — rated + free-text, in template order. */
  const breakdownRows = useMemo((): BreakdownRow[] => {
    if (!qData) return []
    const out: BreakdownRow[] = []
    for (const group of [
      { label: 'Course', list: courseSections, faculty: false },
      { label: 'Faculty', list: facultySections, faculty: true },
      { label: 'General', list: generalSections, faculty: false },
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
            })
            continue
          }
          const score = scoreFor(section.subjectKey, q.id, group.faculty)
          if (!score) continue
          const counts = score.distribution ?? [0, 0, 0, 0, 0]
          /* Multi-instructor + "All faculty": name each instructor's block so
             the aggregate never hides whose teaching a rating describes.
             ≤3 instructors render inline (Romit-approved brief); beyond that
             the scope selector is the per-person path. */
          let perFaculty: BreakdownRow['perFaculty']
          if (group.faculty && facultyScope === 'all' && survey.instructors.length > 1 && survey.instructors.length <= 3) {
            const split = (qData.instructorBlocks ?? []).flatMap((b) => {
              const inst = survey.instructors.find((i) => i.id === b.instructorId)
              const hit = inst ? b.scores.find((x) => x.questionId === q.id) : undefined
              if (!inst || !hit) return []
              const c = hit.distribution ?? [0, 0, 0, 0, 0]
              return [{
                facultyId: inst.id,
                name: inst.name,
                initials: inst.initials,
                avg: hit.avg,
                counts: c,
                total: c.reduce((a, b) => a + b, 0),
              }]
            })
            if (split.length > 1) perFaculty = split
          }
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
            perFaculty,
          })
        }
      }
    }
    return out
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qData, courseSections, facultySections, generalSections, result.facultyId, inCollection, facultyScope, survey.instructors])

  /* Question-group provenance — band label + icon + "about whom" per group,
     shared with the written-responses sheet and the anchor rail. */
  const groupMeta: Record<string, GroupMeta> = {
    Course: {
      icon: EVALUATION_TYPE_ICON.course_material,
      label: 'Course evaluation',
      anchorId: 'group-course',
      contextLine: 'Course evaluation',
    },
    Faculty: {
      icon: EVALUATION_TYPE_ICON.faculty_roles,
      label: 'Faculty evaluation',
      sub:
        scopedFacultyName ??
        (survey.instructors.length > 1
          ? `${survey.instructors.length} instructors${
              survey.instructors.length <= 3
                ? ' — one dot per instructor'
                : isPD
                  ? ' — use the instructor selector above for per-person scores'
                  : ''
            }`
          : undefined),
      anchorId: 'group-faculty',
      contextLine: `Faculty evaluation${scopedFacultyName ? ` — ${scopedFacultyName}` : ''}`,
    },
    General: {
      icon: 'fa-comments',
      label: 'General',
      anchorId: 'group-general',
      contextLine: 'General',
    },
  }

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

          {/* Split offerings ONLY — the strip's real job is cross-survey
              navigation with sibling state inline. On a merged survey the
              per-type summary lives on the score cards instead (a second pill
              row under the scope selector read as one crowded filter cluster —
              Romit 2026-07-17). */}
          {offeringSiblings.length > 0 && (
            <EvaluationSummaryStrip
              survey={survey}
              result={result}
              siblings={offeringSiblings}
              courseAvg={templateHasCourse ? courseAvg : null}
              facultyAvg={facultyAvg}
              facultyLabel={facultyChipLabel}
              hasCourse={templateHasCourse && result.evalScope !== 'instructor'}
              onGo={(anchorId) => goTo(anchorId, 'questions')}
            />
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
                    <h2 className="text-sm font-semibold text-foreground">Early signal</h2>
                    <span className="text-xs text-muted-foreground">
                      Averages from the {result.responses} response{result.responses !== 1 ? 's' : ''} so far — expect movement until close
                    </span>
                  </div>
                ) : (
                  <h2 className="text-sm font-semibold text-foreground">Scores</h2>
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
                <div className={`grid grid-cols-1 gap-4 ${result.evalScope || !templateHasCourse ? 'md:grid-cols-2' : 'md:grid-cols-3'}`}>
                  {result.evalScope !== 'instructor' && templateHasCourse && (
                  <ScoreCard
                    title="Course Content"
                    icon={EVALUATION_TYPE_ICON.course_material}
                    statusBadge={courseInst ? <SurveyStatusBadgeOS status={courseInst.status} /> : undefined}
                    responseMeta={courseInst ? `${courseInst.responseCount} of ${courseInst.enrollmentCount}` : undefined}
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
                    title={scopedFacultyName ? `Faculty Performance — ${scopedFacultyName}` : 'Faculty Performance'}
                    icon={EVALUATION_TYPE_ICON.faculty_roles}
                    statusBadge={facultyInst ? <SurveyStatusBadgeOS status={facultyInst.status} /> : undefined}
                    responseMeta={facultyInst ? `${facultyInst.responseCount} of ${facultyInst.enrollmentCount}` : undefined}
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
                          {lowestScore ? ` · lowest ${lowestScore.avg.toFixed(1)}/5` : ''} · sorted lowest first · score vs program on a 1–5 scale
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
                        <QuestionBreakdownTable rows={breakdownRows} surveyId={survey.id} groupMeta={groupMeta} />
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
                          {viewerComments.length} student comment{viewerComments.length !== 1 ? 's' : ''}
                          {commentTypeCounts.course > 0 ? ` · ${commentTypeCounts.course} course` : ''}
                          {commentTypeCounts.faculty > 0 ? ` · ${commentTypeCounts.faculty} faculty` : ''}
                          {commentTypeCounts.general > 0 ? ` · ${commentTypeCounts.general} general` : ''}
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
                        {/* One filter row governs every section; the trust note
                            rides the same line as quiet meta instead of
                            stacking another full-width row. */}
                        <div className="flex items-center justify-between gap-3 flex-wrap">
                          <SentimentFilterGroup
                            value={qualFilter}
                            onChange={setQualFilter}
                            countFor={qualCountFor}
                            label="Filter student comments by sentiment"
                          />
                          <p className="text-xs text-muted-foreground">
                            Anonymized — individual authorship cannot be identified.
                          </p>
                        </div>
                        {/* One group per evaluation type; faculty comments
                            further split per instructor (avatar header) so
                            "about whom" is never ambiguous. */}
                        <CommentList
                          title="Course evaluation"
                          icon={EVALUATION_TYPE_ICON.course_material}
                          comments={courseComments}
                          hiddenIdx={hiddenIdx}
                          canModerate={isPD}
                          filter={qualFilter}
                        />
                        {facultyCommentGroups.map((g) => (
                          <CommentList
                            key={g.instructor.id}
                            title={`About ${g.instructor.name}`}
                            person={{ name: g.instructor.name, initials: g.instructor.initials }}
                            comments={g.comments}
                            hiddenIdx={hiddenIdx}
                            canModerate={isPD}
                            filter={qualFilter}
                          />
                        ))}
                        <CommentList
                          title="Faculty evaluation — not attributed to one instructor"
                          icon={EVALUATION_TYPE_ICON.faculty_roles}
                          comments={unattributedFacultyComments}
                          hiddenIdx={hiddenIdx}
                          canModerate={isPD}
                          filter={qualFilter}
                        />
                        <CommentList
                          title="General"
                          icon="fa-comments"
                          comments={generalComments}
                          hiddenIdx={hiddenIdx}
                          canModerate={isPD}
                          filter={qualFilter}
                        />

                        {ownerInsights && recommendations.length > 0 && (
                          <div>
                            <h3 className="text-sm font-medium mb-1.5">Top {recommendations.length} recommendation{recommendations.length !== 1 ? 's' : ''}</h3>
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
                      {questionIndexGroups.map((g) => (
                        <Fragment key={g.key}>
                          <AnchorLink
                            label={
                              g.key === 'Faculty' && scopedFacultyName
                                ? `Faculty evaluation — ${scopedFacultyName}`
                                : groupMeta[g.key]?.label ?? g.key
                            }
                            onGo={() => goTo(groupMeta[g.key]?.anchorId ?? 'questions', 'questions')}
                          />
                          {g.items.map((q, i) => (
                            <AnchorLink
                              key={q.id}
                              label={`${i + 1}. ${q.label}`}
                              small
                              onGo={() => goTo(`question-${q.id}`, 'questions')}
                            />
                          ))}
                        </Fragment>
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
