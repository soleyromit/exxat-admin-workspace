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
// DS OS: PageHeader · LocalBanner · Tabs · Card · Collapsible · Accordion ·
// StatusBadge · PersonIdentityCell · ExportDrawer. AI insight card removed
// (Romit 2026-07-17).
// Mobbin: Zoom survey results (tabs + per-question) · Dovetail (themes) ·
// Gorgias (comments + download).
//
// 2026-08-26 (single-survey-analytics review, raw transcript) supersedes two
// earlier decisions on this page, deliberately, not by oversight:
//   - Section-wise distribution ("Theme-wise distribution" until today) is a
//     RENAME, not a re-architecture: "themesh distribution is nothing but
//     the section" (Romit) — SECTION_ORDER/classifySection is the SAME
//     pedagogical categorization the old ThemeBoxplotChart used, just
//     relabeled. It's now an Accordion (type="multiple"); expanding a
//     section reveals its rating distribution as always-visible rows
//     (RatingBreakdownRows), not a hover-only Tooltip — export must show
//     what the accordion shows. Question Breakdown groups by this same
//     classifySection, not raw section titles either. A second Heat map
//     view (toggle) is also available — Kevin's "watermark" prototype
//     (excel-style, no expand needed), still pending a Friday call with
//     David before either is picked as the default.
//   - Middle 50% / Range / Responses-count are removed from every scale-plot
//     popover (section rows AND question rows) — Median + rating
//     distribution only.
//   - Faculty filter reverts to single-select (was made multi-select
//     2026-08-25 at Romit's own request) — multi-select's aggregated-export
//     use case belongs to longitudinal analytics, not this page. The Role
//     filter is removed entirely for the same reason (2026-08-26 re-read).
// The separate deriveThemes()/aiThemes AI comment-topic-clustering feature
// (lib/pce-themes.ts) is untouched — it legitimately keeps "Theme."
// ============================================================================

import { Fragment, Suspense, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useResultsOrigin, withFrom } from '@/lib/pce-nav-origin'
import {
  PageHeader,
  Button,
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
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
  KeyMetrics,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  LocalBanner,
  StatusBadge,
  PersonIdentityCell,
  Popover,
  PopoverContent,
  PopoverTrigger,
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
} from '@exxatdesignux/ui'
import * as Plot from '@observablehq/plot'
import { PlotFigure, axisDefaults, gridMark, type PlotTheme } from '@/components/pce/plot-figure'
import { CHART_TICK_FONT_SIZE } from '@/lib/chart-typography'
import { ChartCard, ChartDataTable, type ChartLeoInsight } from '@/components/charts-core'
import { RatingBreakdownRows, RATING_SERIES } from '@/components/pce/rating-viz'
import { AvatarInitials } from '@/components/ui/avatar'
import {
  OutlineTreeLeafButton,
  OutlineTreeMenu,
  OutlineTreeMenuItem,
  OutlineTreeSub,
  OutlineTreeSubItem,
} from '@/components/data-views/outline-tree-menu'
import { SiteHeader } from '@/components/site-header'
import { usePce } from '@/components/pce/pce-state'
import { EditEndDateDialog, SendReminderDialog } from '@/components/pce/pce-modals'
import { deriveResults, deriveResultsForSurvey, rateColor, facultyFacingState, EVAL_SCOPE_LABEL, RESULT_STATUS_BADGE, type EvalResult } from '@/lib/pce-results'
import { SurveyStatusBadgeOS, SENTIMENT_CHIP } from '@/components/pce/pce-badges'
import { deriveThemes, THEME_PATTERNS, type ThemeRow } from '@/lib/pce-themes'
import {
  MOCK_RESPONSES,
  MOCK_SURVEYS,
  MOCK_SURVEY_QUESTION_DATA,
  MOCK_OPEN_TEXT_RESPONSES,
  medianFromDistribution,
  programAvgForQuestion,
  termAvgForQuestion,
  EVALUATION_TYPE_LABEL,
  EVALUATION_TYPE_ICON,
  EVALUATION_TYPE_ORDER,
  EVAL_FACULTY_ROLES,
  facultyEvalRole,
  MOCK_FACULTY,
  type FacultyEvalRoleId,
  type EvaluationType,
  type PceSurvey,
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
      {/* No default "Back to" CTA — the breadcrumb is the single way-back
          (P1; UX-audit B1, 2026-07-18). Gates with real interventions pass
          them as children. */}
      {children}
    </div>
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

/** Faculty scope selector — Faculty tab only. One chip per instructor, each
 *  carrying name + course-association role; single-select, always exactly
 *  one instructor picked (2026-09-15 requirement: "a chip for each faculty +
 *  role. No chip for 'all faculty'" — supersedes the 2026-08-25/26
 *  All-faculty ToggleGroup and the 3+ "Add filter" dropdown; there is no
 *  longer a blended view to fall back to, so every faculty count gets the
 *  same flat chip row instead of two different interaction shapes). Solo
 *  instructor still renders nothing — the KPI strip above and the tab body
 *  already show that one person's data with nothing left to pick between. */
function FacultyScopeSelector({
  instructors,
  scope,
  toggleFacultyId,
  isPD,
  roleFor,
}: {
  instructors: EvalResult[]
  scope: 'all' | 'course' | string
  /** Picks ONE instructor — the currently active one is a no-op (always
   *  exactly one selected; there is no "clear" state to fall back to). */
  toggleFacultyId: (id: string) => void
  isPD: boolean
  /** Course-association role label per instructor (e.g. "Primary faculty"). */
  roleFor: (facultyId: string) => string | undefined
}) {
  // Scope pills are PD-only (spec ST-15: the faculty switcher is a coordinator
  // affordance) — a faculty viewer keeps their own identity row and can never
  // scope the Faculty Performance signal onto a colleague's instructor block.
  if (instructors.length <= 1) return null
  if (!isPD) {
    const f = instructors[0]
    if (!f) return null
    return (
      <div className="flex items-center gap-2">
        <AvatarInitials initials={f.facultyInitials} size="sm" />
        <span className="min-w-0 flex flex-col leading-tight">
          <span className="max-w-[14rem] truncate text-sm font-semibold text-foreground">{f.facultyName}</span>
          {roleFor(f.facultyId) && (
            <span className="max-w-[14rem] truncate text-xs font-normal text-muted-foreground">{roleFor(f.facultyId)}</span>
          )}
        </span>
      </div>
    )
  }
  return (
    <ToggleGroup
      type="single"
      value={scope !== 'course' ? scope : undefined}
      onValueChange={(v) => {
        // Always exactly one instructor selected — ignore Radix's deselect-
        // to-empty event when the active chip is clicked again.
        if (v) toggleFacultyId(v)
      }}
      variant="outline"
      size="sm"
      aria-label="Faculty"
      className="flex-wrap"
    >
      {instructors.map((f) => (
        <ToggleGroupItem key={f.facultyId} value={f.facultyId} className="gap-1.5 h-auto py-1">
          <AvatarInitials initials={f.facultyInitials} size="sm" className="shrink-0" fallbackClassName="text-[9px]" />
          <span className="flex min-w-0 flex-col items-start leading-tight">
            <span className="max-w-[12rem] truncate">{f.facultyName}</span>
            {roleFor(f.facultyId) && (
              <span className="max-w-[12rem] truncate text-xs font-normal opacity-70">{roleFor(f.facultyId)}</span>
            )}
          </span>
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
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
        title={`${survey.courseCode} · ${survey.courseName}`}
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
                caption="Responses"
              />
              <StatBlock
                value={`${survey.responseRate}%`}
                caption="Response rate · target 70%"
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

/** Navigator row — DS OutlineTreeLeafButton (adoption verdict: IMPORT);
 *  isActive carries the scroll-spy highlight, count is quiet group meta. */
function RailLink({
  label,
  onGo,
  active,
  count,
  title,
  sub,
}: {
  label: string
  onGo: () => void
  active?: boolean
  count?: number
  title?: string
  /** Row inside an inset OutlineTreeSub — aligns to the guide line. */
  sub?: boolean
}) {
  return (
    <OutlineTreeLeafButton
      surface="panel"
      isActive={active}
      subGuideAlign={sub}
      onClick={onGo}
      title={title ?? label}
      className="w-full min-w-0"
    >
      <span className="min-w-0 flex-1 truncate text-start">{label}</span>
      {count != null && (
        <span className="ms-auto shrink-0 text-xs tabular-nums text-muted-foreground">{count}</span>
      )}
    </OutlineTreeLeafButton>
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
      {/* Zero-count sentiments are noise — only offer filters that filter. */}
      {SENTIMENT_FILTERS.filter((f) => f.key === 'all' || countFor(f.key) > 0).map((f) => (
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
  person?: { name: string; initials: string; avatarUrl?: string }
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
          <AvatarInitials initials={person.initials} size="sm" className="shrink-0" fallbackClassName="text-xs font-medium" />
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
                {/* Quote and sentiment chip side by side, not stacked
                    (Romit: "let the chips be besides the quotes") — wraps to
                    its own line only if the quote itself doesn't leave room. */}
                <div className="flex-1 min-w-0 flex flex-wrap items-center gap-2">
                  <p className={`text-sm leading-relaxed ${isHidden ? 'text-muted-foreground' : ''}`}>
                    &ldquo;{c.text}&rdquo;
                  </p>
                  <StatusBadge label={chip.label} tone={chip.tone} />
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

/* ── section distribution ─────────────────────────────────────────────────────
   One row per REAL template section (not a classified taxonomy) — an
   accordion: the trigger carries this-course/program/median at a glance plus
   the boxplot track, expanding reveals the rating distribution as plain,
   always-visible rows (RatingBreakdownRows) so nothing the export needs lives
   behind a hover or a click (Aug 26 2026 decision — supersedes the
   non-collapsible "Theme" viz and its gap-sort; rows now follow template
   order, and `type="multiple"` keeps "look at two sections at once" working). */

interface SectionRowDatum {
  id: string
  title: string
  avg: number
  questions: number
  programAvg: number | null
  /** Response counts by rating level, index 0 = rated 1 … index 4 = rated 5,
   *  aggregated across the section's questions — feeds the distribution. */
  dist: [number, number, number, number, number]
  /** Per-instructor average within this section (scope-aware) — photo markers. */
  instructors: { id: string; initials: string; name: string; avatarUrl?: string; role?: 'primary' | 'guest'; avg: number }[]
}

/* Pedagogical section categories (was THEME_ORDER) — shared by
 * Section-wise distribution and Question Breakdown's sub-headers so both
 * agree on what a "section" is and in what order they appear. Module-level
 * so QuestionBreakdownTable's own grouping can reuse the same order. */
const SECTION_ORDER = ['Teaching Effectiveness', 'Communication', 'Assessment Practices', 'Course Content']

/** Classifies a question's pedagogical section from its TEXT, with
 *  provenance as the fallback (faculty-block questions teach/communicate;
 *  course-section questions are content/assessment) — the SAME taxonomy
 *  Section-wise distribution and Question Breakdown's sub-headers both use,
 *  so a question always lands in the same section on either surface. */
function classifySectionFromText(text: string, fromFaculty: boolean): string {
  const t = text.toLowerCase()
  if (/assess|exam|grad|rubric|fair/.test(t)) return 'Assessment Practices'
  if (/communicat|respond|accessib|approach|feedback|available/.test(t)) return 'Communication'
  if (/teach|instruct|explain|clarit|clear|engag|effectiv|present/.test(t)) return 'Teaching Effectiveness'
  if (t) return 'Course Content'
  return fromFaculty ? 'Teaching Effectiveness' : 'Course Content'
}

/* Section rows share the question rows' scale-track boxplot (DS OS → Chart →
   Statistical → Boxplot anatomy, laid horizontal): ONE vocabulary for every
   score-vs-program read on this page. ChartFigure is intentionally skipped
   here (unlike other ChartCard bodies) — its capture-phase arrow-key handler
   would stop-propagate before Radix Accordion's own roving-tabindex ever
   reaches an AccordionTrigger; ChartCard's plain-children branch still
   supplies the ChartLeoInsightOverlay pill on its own. */
function SectionBoxplotChart({
  sections,
  partial,
  courseOnly,
  openSections,
  onOpenSectionsChange,
}: {
  sections: SectionRowDatum[]
  partial?: boolean
  /** Page is scoped to the Course pill — says so in the description, same as
   *  every other section on the page (Romit 2026-08-17). */
  courseOnly?: boolean
  /** Controlled from the page so "Export as PDF" can force every section
   *  open before printing — a closed AccordionContent is fully unmounted by
   *  Radix, not just visually hidden, so print CSS alone can't reveal it. */
  openSections: string[]
  onOpenSectionsChange: (ids: string[]) => void
}) {
  if (sections.length === 0) return null
  const weakest = [...sections].sort((a, b) => a.avg - b.avg)[0]
  const sectionLeo: ChartLeoInsight = {
    headline: `${weakest.title} is the lowest section at ${weakest.avg.toFixed(1)}/5`,
    explanation:
      weakest.programAvg != null
        ? `Program average for this section is ${weakest.programAvg.toFixed(1)}. Expand the section for its questions.`
        : `Averaged from ${weakest.questions} question${weakest.questions !== 1 ? 's' : ''}.`,
    kind: 'dip',
  }
  const instructors = [...new Map(sections.flatMap((s) => s.instructors).map((fi) => [fi.id, fi])).values()]
  const dataTable = (
    <ChartDataTable
      caption="Section-wise distribution"
      headers={[
        'Section',
        'Rated 1',
        'Rated 2',
        'Rated 3',
        'Rated 4',
        'Rated 5',
        'This course',
        'Median',
        'Program average',
        'Questions',
        ...instructors.map((fi) => fi.name),
      ]}
      rows={sections.map((s) => {
        const total = s.dist.reduce((a, n) => a + n, 0)
        return [
          s.title,
          ...s.dist,
          `${s.avg.toFixed(1)}/5`,
          total > 0 ? `${ratingQuantile(s.dist, total, 0.5).toFixed(1)}/5` : '—',
          s.programAvg != null ? `${s.programAvg.toFixed(1)}/5` : '—',
          s.questions,
          ...instructors.map((fi) => {
            const hit = s.instructors.find((x) => x.id === fi.id)
            return hit ? `${hit.avg.toFixed(1)}/5` : '—'
          }),
        ]
      })}
    />
  )
  return (
    <ChartCard
      variant="tabs"
      title="Section-wise distribution"
      description={`Score spread per section vs program${partial ? ' · partial data' : ''}${courseOnly ? ' · course only' : ''}`}
      leoInsight={sectionLeo}
      hideAskLeo
      /* Heat map is a second candidate visual for this same data (2026-08-26
       * transcript — Kevin's "watermark" prototype: "an excel view... I can
       * compare all questions/sections in the same column quickly", vs. the
       * boxplot/accordion this session built as the assigned interim task.
       * Neither was picked yet ("let's take a call, compare both... Friday
       * I'm having a call with David") — this toggle is exactly that
       * side-by-side comparison, not a redesign of the default. */
      tabOptions={[
        { value: 'distribution', label: 'Distribution' },
        { value: 'heatmap', label: 'Heat map' },
      ]}
    >
      {(view) =>
        view === 'heatmap' ? (
          <>
            <p className="sr-only">
              {`Heat map of section ratings on a 1 to 5 scale — darker cells mean a larger share of responses at that rating — plus this-course average, median, and program average per section. ${weakest.title} is lowest at ${weakest.avg.toFixed(1)}.`}
            </p>
            <SectionHeatmapTable sections={sections} instructors={instructors} />
            {dataTable}
          </>
        ) : (
          <>
            <p className="sr-only">
              {`Boxplot per section on a 1 to 5 scale showing the median, course average, program average${instructors.length > 0 ? ' and per-instructor averages' : ''}. Expand a section to see its full rating distribution. ${weakest.title} is lowest at ${weakest.avg.toFixed(1)}.`}
            </p>
            {/* Fixed 220px, not minmax(140px,220px) — each section row below is
                its own independent grid, so content-sized columns would compute a
                different width per row depending on that row's own title length,
                same class of bug fixed in Question Breakdown's column. */}
            <div className="grid grid-cols-[220px_minmax(0,1fr)] items-end gap-6 pb-2 border-b border-border">
              <span className="text-xs text-muted-foreground">Section</span>
              <div className="relative h-4 text-xs text-muted-foreground tabular-nums" aria-hidden="true">
                {[1, 2, 3, 4, 5].map((n) => (
                  <span key={n} className="absolute -translate-x-1/2" style={{ left: `${scaleX(n)}%` }}>
                    {n}
                  </span>
                ))}
              </div>
            </div>
            <Accordion type="multiple" value={openSections} onValueChange={onOpenSectionsChange} className="flex flex-col">
              {sections.map((s) => {
                const total = s.dist.reduce((a, n) => a + n, 0)
                const median = total > 0 ? ratingQuantile(s.dist, total, 0.5) : null
                return (
                  <AccordionItem key={s.id} value={s.id} className="border-b border-border last:border-0">
                    {/* Grid IS the row — AccordionTrigger occupies column 1 only
                        (title, the sole clickable toggle); ScaleTrackPlot's own
                        Popover triggers are real buttons, so they must be a
                        SIBLING of AccordionTrigger's button, never nested inside
                        it (nesting a button inside another button is invalid
                        HTML and threw a hydration error when tried). Trigger className overrides
                        the DS default `justify-between` (twMerge resolves the
                        conflict) — without it the chevron gets pushed to the far
                        edge of this narrow title column, stranded in the gap
                        before the graph instead of sitting next to the title it
                        toggles. */}
                    <div className="grid grid-cols-[220px_minmax(0,1fr)] items-center gap-6">
                      {/* Leading chevron, matching this file's own disclosure
                          convention (the "On this page" rail's per-group toggle)
                          — DS Accordion's own chevron is trailing by default, so
                          it's hidden here and replaced with one that comes first. */}
                      <AccordionTrigger className="pce-leading-chevron-trigger group justify-start gap-2 py-2.5 hover:no-underline">
                        <i
                          className="fa-light fa-chevron-right shrink-0 text-xs text-muted-foreground transition-transform group-data-[state=open]:rotate-90"
                          aria-hidden="true"
                        />
                        <div className="min-w-0 flex flex-col gap-0.5 text-start">
                          <p className="text-sm">{s.title}</p>
                          {/* Count of questions kept, number of ratings dropped —
                              transcript: "count of questions makes sense. Number
                              of ratings is not required." */}
                          <p className="text-xs text-muted-foreground tabular-nums">
                            {s.questions} question{s.questions !== 1 ? 's' : ''}
                          </p>
                        </div>
                      </AccordionTrigger>
                      <div className="min-w-0">
                        <ScaleTrackPlot
                          counts={s.dist}
                          total={total}
                          avg={s.avg}
                          programAvg={s.programAvg}
                          people={s.instructors.map((fi) => ({
                            facultyId: fi.id,
                            name: fi.name,
                            initials: fi.initials,
                            avatarUrl: fi.avatarUrl,
                            role: fi.role,
                            avg: fi.avg,
                          }))}
                          whiskers
                          detailTitle={s.title}
                          detailMeta={`${s.questions} question${s.questions !== 1 ? 's' : ''}`}
                        />
                      </div>
                    </div>
                    {/* Two-column expanded panel (Romit): metrics via the real DS
                        KeyMetrics primitive on the left, rating distribution on
                        the right. Stretching the Card itself (`h-full`) matched
                        the OUTER border to the row height but left the content
                        pinned to the top — a visible empty gap INSIDE the border,
                        worse than before. Instead: let the card size naturally
                        (tight around its content) and center that tight card
                        vertically within the full-height wrapper, so there's no
                        border enclosing dead space. */}
                    <AccordionContent className="pb-3">
                      <div className="grid grid-cols-[26rem_minmax(0,1fr)] gap-6 px-1">
                        <div className="flex flex-col justify-center h-full">
                          <KeyMetrics
                            variant="compact"
                            size="sm"
                            metricsSingleRow
                            /* DS Card bakes in `h-full` on itself unconditionally
                               (confirmed via computed styles) — it fills whatever
                               height its parent grid stretches it to regardless of
                               this wrapper's flex/justify-center, which is why the
                               centering above did nothing. Overriding to h-auto so
                               the card sizes to its own content and CAN be centered. */
                            className="h-auto"
                            metrics={[
                              { id: 'course', label: 'This course', value: s.avg.toFixed(1), delta: '', trend: 'neutral' },
                              { id: 'program', label: 'Program', value: s.programAvg != null ? s.programAvg.toFixed(1) : '—', delta: '', trend: 'neutral' },
                              { id: 'median', label: 'Median', value: median != null ? median.toFixed(1) : '—', delta: '', trend: 'neutral' },
                              {
                                id: 'range',
                                label: 'Range',
                                value: (() => {
                                  const r = distRange(s.dist)
                                  return r ? `${r.lo}–${r.hi}` : '—'
                                })(),
                                delta: '',
                                trend: 'neutral',
                              },
                            ]}
                          />
                        </div>
                        <RatingBreakdownRows counts={s.dist} total={total} />
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                )
              })}
            </Accordion>
            {dataTable}
          </>
        )
      }
    </ChartCard>
  )
}

/* Shared cell chrome for SectionHeatmapTable and QuestionHeatmapTable — both
 * render a CSS-Grid cross-tab (heat-tinted 1–5 columns + avg/median/
 * program-avg + per-instructor columns), so a header cell, a rated-question
 * row, and a free-text row all need identical padding to visually align. A
 * free-text row once shipped without the same left inset as rated rows and
 * read as "misaligned" (Romit, 2026-08-27) because each row kind hand-typed
 * its own className string. Routing every row kind through these constants
 * (and HeatCell below) makes that drift structurally impossible — there is
 * exactly one place that owns each cell role's chrome. */
const HEAT_TH = 'border-b border-border bg-background text-xs font-medium text-muted-foreground'
const HEAT_LABEL_CELL = 'border-b border-border py-2 pr-4 text-left align-middle'
const HEAT_STAT_AVG = 'border-b border-border px-3 py-2 text-right text-sm font-medium tabular-nums text-foreground'
const HEAT_STAT_MEDIAN = 'border-b border-border px-3 py-2 text-right text-sm tabular-nums text-foreground'
const HEAT_STAT_PROGRAM = 'border-b border-border px-3 py-2 text-right text-sm tabular-nums text-muted-foreground'
const HEAT_INSTRUCTOR_CELL = 'border-b border-border px-3 py-2 text-right text-sm tabular-nums text-foreground'
const HEAT_FULL_ROW_PAD = 'px-3'
const HEAT_FULL_ROW_STYLE = { gridColumn: '1 / -1' } as const

function HeatCell({ share, total, color }: { share: number; total: number; color: string }) {
  return (
    <div className="border-b border-border p-0.5 text-center align-middle" aria-hidden="true">
      <div className="relative flex h-9 items-center justify-center overflow-hidden rounded-sm">
        <div
          className="absolute inset-0"
          style={{ background: color, opacity: total > 0 ? Math.min(0.12 + share * 0.55, 0.62) : 0 }}
        />
        <span className="relative z-10 text-xs font-medium tabular-nums text-foreground">
          {total > 0 ? `${Math.round(share * 100)}%` : '—'}
        </span>
      </div>
    </div>
  )
}

/** Alternate view for Section-wise distribution (2026-08-26 transcript,
 *  Kevin's "watermark" prototype): every section as a plain table row, rating
 *  1–5 columns heat-tinted by share of responses, avg/median/program printed
 *  directly — no expand needed, and columns stay scannable top-to-bottom
 *  ("if I want to compare medians of all the courses, there is only one
 *  column I need to go in and see"). Same RATING_SERIES palette as the rest
 *  of the page's rating visuals — heat intensity is an opacity-tinted layer
 *  BEHIND the text (not on it), so the printed percentage keeps full
 *  contrast at every intensity, same technique as MiniRatingColumns. */
function SectionHeatmapTable({
  sections,
  instructors,
}: {
  sections: SectionRowDatum[]
  /** Per-instructor avg columns, appended after Program avg — same identities
   *  the Distribution tab's ScaleTrackPlot shows as photo markers (Romit:
   *  "I also don't see faculty ratings in the section wise" — the heat map
   *  had dropped them entirely). Empty on a solo-instructor course, where
   *  "This course" already IS that one instructor's number. */
  instructors: { id: string; initials: string; name: string; avatarUrl?: string }[]
}) {
  /* CSS Grid, not a real <table> — needed for the group/section band rows
   * below to span the full width via gridColumn: '1 / -1'. Fully decorative
   * (aria-hidden) — the sr-only ChartDataTable sibling this renders
   * alongside already carries the real semantics. Horizontal scroll on the
   * wrapper, not shrinkable columns — plain, no sticky header. */
  /* minmax(0,Xrem), not fixed — no horizontal-scroll wrapper (Romit:
   * "remove horizontal scroll bar"), so columns must shrink to fit the
   * card's actual width instead of overflowing it. repeat(0,7rem) — the
   * solo-instructor/course-only case — would also make the whole
   * grid-template-columns value invalid in some engines, collapsing every
   * row into a single stacked column; omit that segment when there are no
   * instructors rather than emit a zero-count repeat(). */
  const cols = `minmax(0,1fr) repeat(5,minmax(0,4rem)) repeat(3,minmax(0,6rem))${instructors.length > 0 ? ` repeat(${instructors.length},minmax(0,7rem))` : ''}`
  return (
    <div aria-hidden="true">
      <div className="grid" style={{ gridTemplateColumns: cols }}>
        <div className={`${HEAT_TH} py-2 pr-4`}>Section</div>
        {[1, 2, 3, 4, 5].map((n) => (
          <div key={n} className={`${HEAT_TH} px-1 py-2 text-center`}>{n}</div>
        ))}
        <div className={`${HEAT_TH} px-3 py-2 text-right`}>This course</div>
        <div className={`${HEAT_TH} px-3 py-2 text-right`}>Median</div>
        <div className={`${HEAT_TH} px-3 py-2 text-right`}>Program avg</div>
        {instructors.map((fi) => (
          <div key={fi.id} className={`${HEAT_TH} whitespace-nowrap px-3 py-2 text-right`}>
            {fi.name}
          </div>
        ))}

        {sections.map((s) => {
          const total = s.dist.reduce((a, n) => a + n, 0)
          const median = total > 0 ? ratingQuantile(s.dist, total, 0.5) : null
          return (
            <Fragment key={s.id}>
              <div className={HEAT_LABEL_CELL}>
                <span className="text-sm text-foreground">{s.title}</span>
                <span className="block text-xs tabular-nums text-muted-foreground">
                  {s.questions} question{s.questions !== 1 ? 's' : ''}
                </span>
              </div>
              {[0, 1, 2, 3, 4].map((i) => (
                <HeatCell key={i} share={total > 0 ? (s.dist[i] ?? 0) / total : 0} total={total} color={RATING_SERIES[i].color} />
              ))}
              <div className={HEAT_STAT_AVG}>{s.avg.toFixed(1)}</div>
              <div className={HEAT_STAT_MEDIAN}>{median != null ? median.toFixed(1) : '—'}</div>
              <div className={HEAT_STAT_PROGRAM}>{s.programAvg != null ? s.programAvg.toFixed(1) : '—'}</div>
              {instructors.map((fi) => {
                const hit = s.instructors.find((x) => x.id === fi.id)
                return (
                  <div key={fi.id} className={HEAT_INSTRUCTOR_CELL}>
                    {hit ? hit.avg.toFixed(1) : '—'}
                  </div>
                )
              })}
            </Fragment>
          )
        })}
      </div>
    </div>
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
  /** Real template section title (e.g. "Course Content", "Faculty
   *  Performance") — the same name Section-wise distribution uses,
   *  repeated here as a sub-header so a multi-section template's questions
   *  don't all collapse into one flat "Course"/"Faculty" band. */
  sectionTitle: string
  kind: 'rated' | 'freeText'
  avg?: number
  median?: number
  programAvg?: number | null
  /** Term-scoped average (2026-09-15 requirement, distinct from `programAvg`'s
   *  all-time pool) — `lib/pce-mock-data.ts`'s `termAvgForQuestion`. */
  termAvg?: number | null
  /** Lowest↔highest RATED value actually present (2026-09-15 requirement) —
   *  `distRange(counts)`, same derivation ScaleTrackPlot's whiskers use. */
  range?: { lo: number; hi: number } | null
  counts?: number[]
  total?: number
  /** Faculty rows: the named identities (1–3) scored on this question — each
   *  becomes a photo marker on the scale plot. Course/general rows have none. */
  perFaculty?: PlotPerson[]
}

/** Identity marker slice for the scale plots. Counts are per-question data;
 *  theme-level people carry only the average. */
interface PlotPerson {
  facultyId: string
  name: string
  initials: string
  avatarUrl?: string
  /** Same 'primary' | 'guest' vocabulary as the Evaluatees column (Romit,
   *  2026-08-25: "their role isn't defined here" — the per-person popover
   *  showed name + average with no role at all). */
  role?: 'primary' | 'guest'
  avg: number
  counts?: number[]
  total?: number
}

/** Section → evaluation-type classifier. Builder templates mark faculty
 *  sections with roleSetId; richer/legacy templates encode the same thing in
 *  subjectKey (course_instructor, lab_instructor, …). course_director
 *  ("Overall Experience") groups under Faculty — the General category was
 *  retired, Course/Faculty are the only two categories. Keying on roleSetId
 *  alone lumped every tmplrich section under Course — the exact
 *  mis-attribution of the 2026-07-17 critique. */
const FACULTY_SUBJECT_KEYS = new Set([
  'faculty',
  'course_instructor',
  'course_coordinator',
  'teaching_assistant',
  'lab_instructor',
  'course_director',
  'preceptor',
  'clinical_supervisor',
])
function sectionGroupOf(s: PceTemplateSection): 'Course' | 'Faculty' {
  if (s.roleSetId || FACULTY_SUBJECT_KEYS.has(s.subjectKey)) return 'Faculty'
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


/* ── question scale plot (Romit 2026-07-18, replacing the stacked rating bar) ──
   Workable-assessment anatomy: dotted 1–5 track, brand middle-50% band, and
   the benchmarks IN the plot — program ▲ above the track, the scored identity
   ON it (course dot, or the instructor's actual photo), values riding the
   marks. No printed number column: position + at-mark labels carry the
   comparison. Whiskers stay gone deliberately — min–max on a 1–5 Likert spans
   the axis on nearly every row (the 8aa825d1 failure); full range and the
   rating distribution live in the hover tooltips + data table. */

/** Term-over-term delta for a `kpi-chart` tile's `trendDelta`/`trend` fields —
 *  same "+0.15"/"-0.21" format as Analytics Overview's own KPI tiles
 *  (`components/pce/analytics-overview-panel.tsx`'s `prevTermTrend`). */
function priorInstanceTrend(current: number | null, prior: number | null): { trendDelta?: string; trend: 'up' | 'down' | 'neutral' } {
  if (current == null || prior == null) return { trend: 'neutral' }
  const d = Math.round((current - prior) * 100) / 100
  return {
    trendDelta: `${d >= 0 ? '+' : ''}${d.toFixed(2)}`,
    trend: d > 0 ? 'up' : d < 0 ? 'down' : 'neutral',
  }
}

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

/** 1–5 score → % along the track. */
const scaleX = (v: number) => ((Math.min(5, Math.max(1, v)) - 1) / 4) * 100

/** Lowest ↔ highest RATED value actually present in a 1–5 distribution
 *  (2026-09-15 requirement: explicit printed "Range" alongside avg/median,
 *  at both the section and question level — was previously only implicit in
 *  ScaleTrackPlot's whiskers, never printed as text). Same lowest/highest
 *  derivation ScaleTrackPlot already computes internally for its whiskers,
 *  extracted here so both that plot and the KeyMetrics/BreakdownRow text
 *  readouts share one implementation. */
/** Real client-side Excel download (2026-09-15 — replaces the placeholder
 *  that silently opened the same simulated CSV drawer as "Export Excel").
 *  `ExportDrawer` (@exxatdesignux/ui) has no file-generation logic anywhere
 *  and no format prop — it's a shared progress-simulation shell used
 *  identically for every "export" in this mock-data app, so routing
 *  "Export Excel" through it would still not produce a file. This generates
 *  an HTML table with a `.xls` extension + `application/vnd.ms-excel` MIME
 *  type — the well-supported, dependency-free way Excel opens a real
 *  multi-sheet-equivalent workbook from a browser without a zip/XLSX
 *  library (adding one for a single export button was judged out of
 *  proportion to the rest of this fixture-driven app). Excel may show a
 *  "format doesn't match extension" warning before opening it — it still
 *  opens correctly. */
function downloadResultsExcel(courseCode: string, sectionRows: SectionRowDatum[], breakdownRows: BreakdownRow[]) {
  const esc = (v: string | number) =>
    String(v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  const sectionTable = `
    <table border="1">
      <caption>Section-wise distribution</caption>
      <tr><th>Section</th><th>Avg</th><th>Program avg</th><th>Questions</th></tr>
      ${sectionRows
        .map(
          (s) =>
            `<tr><td>${esc(s.title)}</td><td>${s.avg.toFixed(1)}</td><td>${s.programAvg != null ? s.programAvg.toFixed(1) : ''}</td><td>${s.questions}</td></tr>`,
        )
        .join('')}
    </table>`
  const questionTable = `
    <table border="1">
      <caption>Question breakdown</caption>
      <tr><th>Question</th><th>Group</th><th>Avg</th><th>Median</th><th>Range</th><th>Program avg</th><th>Term avg</th></tr>
      ${breakdownRows
        .filter((r) => r.kind === 'rated')
        .map(
          (r) =>
            `<tr><td>${esc(r.label)}</td><td>${esc(r.group)}</td><td>${r.avg != null ? r.avg.toFixed(1) : ''}</td><td>${r.median != null ? r.median.toFixed(1) : ''}</td><td>${r.range ? `${r.range.lo}-${r.range.hi}` : ''}</td><td>${r.programAvg != null ? r.programAvg.toFixed(1) : ''}</td><td>${r.termAvg != null ? r.termAvg.toFixed(1) : ''}</td></tr>`,
        )
        .join('')}
    </table>`
  const html = `<html><head><meta charset="utf-8" /></head><body>${sectionTable}<br />${questionTable}</body></html>`
  const blob = new Blob([html], { type: 'application/vnd.ms-excel' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${courseCode.replace(/\s+/g, '-')}-results.xls`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

function distRange(counts: number[]): { lo: number; hi: number } | null {
  const total = counts.reduce((a, n) => a + n, 0)
  if (total <= 0) return null
  const lo = counts.findIndex((c) => c > 0) + 1
  const hi = 5 - [...counts].reverse().findIndex((c) => c > 0)
  return { lo, hi }
}

/** Small downward triangle — the program benchmark mark. */
function ProgramTriangle() {
  return (
    <span
      className="block size-0 border-x-[5px] border-t-[6px] border-x-transparent"
      style={{ borderTopColor: 'var(--muted-foreground)' }}
      aria-hidden="true"
    />
  )
}

/** Focus ring for in-plot tooltip triggers (Radix renders real buttons). */
const PLOT_TRIGGER_RING =
  'cursor-pointer rounded-sm focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50'

function ScaleTrackPlot({
  counts,
  total,
  avg,
  programAvg,
  people,
  whiskers = false,
  detailTitle,
  detailMeta,
}: {
  counts: number[]
  total: number
  avg?: number
  programAvg?: number | null
  people?: PlotPerson[]
  /** Theme rows only — aggregates have real min–max variance. */
  whiskers?: boolean
  /** Header of the hover tooltip (question rows: "Rating distribution"). */
  detailTitle: string
  detailMeta?: string
}) {
  if (total <= 0 || avg == null) {
    /* No responses yet — quiet muted track, never a blank cell. */
    return (
      <div className="flex h-16 items-center" aria-hidden="true">
        <div className="h-1 w-full rounded-full bg-muted" />
      </div>
    )
  }
  const p25 = ratingQuantile(counts, total, 0.25)
  const p75 = ratingQuantile(counts, total, 0.75)
  const median = ratingQuantile(counts, total, 0.5)
  const lowest = counts.findIndex((c) => c > 0) + 1
  const highest = 5 - [...counts].reverse().findIndex((c) => c > 0)
  /* Compact hover content — Median + vs-program only, no repeated rating-
   * distribution bars: every row here (section or question) already has its
   * own accordion revealing RatingBreakdownRows once expanded, so a second
   * copy in a click-popover was pure duplication. This is now the ONLY
   * interaction on this plot — every marker (band, course dot, named
   * instructors, program-average tick) is a hover Tooltip; the previous
   * "Questions in this section" click-popover (with jump-link buttons) is
   * gone entirely, not just simplified (Romit, 2026-08-27, after seeing it
   * still rendered as a heavy popover: "I just need a tooltip of what 3.8
   * is, on hover. not this") — that navigation is still reachable from the
   * "On this page" rail's own per-question links. TooltipContent is
   * inverted (bg-foreground/text-background) — de-emphasis is
   * text-background/70, not text-muted-foreground, which is illegible on
   * the dark surface. */
  /* Three explicit, labeled numbers — not just "Median"/"Vs program" with no
   * anchor for what's being compared. A viewer hovering a mark where median
   * happens to equal program average saw two unexplained identical "3.8"
   * rows with nothing to say why (Romit, 2026-08-27, screenshot of exactly
   * that: "can you add a better tooltip message"). "This score" states the
   * value the mark itself represents; "· matches" replaces silence when the
   * delta is negligible instead of just omitting the parenthetical. */
  const tooltipStat = (v: number) => (
    <div className="flex flex-col gap-1">
      <div className="flex items-baseline justify-between gap-4">
        <span className="text-background/70">This score</span>
        <span className="font-medium tabular-nums">{v.toFixed(1)}</span>
      </div>
      <div className="flex items-baseline justify-between gap-4">
        <span className="text-background/70">Median</span>
        <span className="tabular-nums">{median.toFixed(1)}</span>
      </div>
      {programAvg != null && (
        <div className="flex items-baseline justify-between gap-4">
          <span className="text-background/70">Program avg</span>
          <span className="tabular-nums">
            {programAvg.toFixed(1)}
            {/* No semantic chart-2/chip-4 color here — those tokens are
               calibrated for a light surface and fail contrast against
               TooltipContent's inverted dark background (axe: 2.32:1, needs
               4.5:1). Plain text (inherits text-background) stays legible. */}
            {Math.abs(v - programAvg) > 0.05 ? (
              <span className="ml-1 font-medium">
                ({v > programAvg ? '+' : '−'}{Math.abs(v - programAvg).toFixed(1)})
              </span>
            ) : (
              <span className="ml-1 text-background/70">· matches</span>
            )}
          </span>
        </div>
      )}
    </div>
  )
  /* Markers: named people when the row has identities, else the course dot. */
  const marks =
    people && people.length > 0
      ? [...people]
          .sort((a, b) => a.avg - b.avg)
          .map((p) => ({
            key: p.facultyId,
            x: scaleX(p.avg),
            value: p.avg,
            below: programAvg != null && p.avg < programAvg - 0.05,
            person: p as PlotPerson | undefined,
          }))
      : [
          {
            key: 'course-avg',
            x: scaleX(avg),
            value: avg,
            below: programAvg != null && avg < programAvg - 0.05,
            person: undefined,
          },
        ]
  /* Near-equal scores: colliding markers fan out with a real (non-
     overlapping) gap instead of stacking. Round 1 (Romit, 2026-08-25 —
     screenshot showed two "4.3" labels stacked under a SINGLE avatar) only
     staggered the label text vertically while every colliding AVATAR still
     rendered at the exact same `x`, so the later one painted directly over
     the earlier one and hid it completely. Round 2 (Romit: "hard to see and
     click" — a 10px nudge on a 24px avatar still left them 14px overlapped)
     widens the step to the full avatar diameter + a small gap (28px), and
     moves the WHOLE marker (avatar + its own label together, both children
     of the same translated wrapper) by that offset — so each person's
     avatar sits fully clear of its neighbor's, has its own full-size click
     target, and its value renders directly beneath IT rather than needing a
     separate vertical stack to avoid colliding with a neighbor's number. */
  let lastLabelX = -Infinity
  let collisionOffsetPx = 0
  const placed = marks.map((m) => {
    const secondRow = m.x - lastLabelX < 9
    if (!secondRow) {
      lastLabelX = m.x
      collisionOffsetPx = 0
    } else {
      collisionOffsetPx += 28
    }
    return { ...m, xOffsetPx: collisionOffsetPx }
  })
  return (
    <div className="relative h-16 w-full min-w-0">
      {/* program benchmark — above the track so it never collides with scores */}
      {programAvg != null && (
        <Tooltip>
          <TooltipTrigger
            aria-label={`Program average ${programAvg.toFixed(1)}`}
            className={`absolute top-0 flex -translate-x-1/2 flex-col items-center ${PLOT_TRIGGER_RING}`}
            style={{ left: `${scaleX(programAvg)}%` }}
          >
            {/* Suppress the value when program ≈ score — a duplicated number
                stacked over the marker reads as a rendering bug. ALWAYS
                rendered (never omitted): omitting this span removed it from
                the flex-col layout entirely, collapsing the triangle (now
                first child) upward — `invisible` keeps the layout slot while
                hiding the text. */}
            <span
              className={`text-xs tabular-nums leading-none text-muted-foreground ${Math.abs(programAvg - avg) > 0.05 ? '' : 'invisible'}`}
              aria-hidden="true"
            >
              {programAvg.toFixed(1)}
            </span>
            <ProgramTriangle />
          </TooltipTrigger>
          <TooltipContent side="top" sideOffset={6}>
            <div className="flex flex-col gap-1">
              <p className="font-medium">Program average {programAvg.toFixed(1)}</p>
              <p className="text-background/70">Response-weighted across all offerings.</p>
            </div>
          </TooltipContent>
        </Tooltip>
      )}
      {/* dotted 1–5 track */}
      <div className="absolute inset-x-0 top-7 h-px bg-border" aria-hidden="true" />
      {[1, 2, 3, 4, 5].map((n) => (
        <span
          key={n}
          className="absolute top-7 size-[3px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-border"
          style={{ left: `${scaleX(n)}%` }}
          aria-hidden="true"
        />
      ))}
      {/* whiskers — DS boxplot anatomy: min→max hairline with end caps */}
      {whiskers && (
        <>
          <div
            className="pointer-events-none absolute top-7 h-px -translate-y-1/2"
            style={{
              left: `${scaleX(lowest)}%`,
              width: `${Math.max(1, scaleX(highest) - scaleX(lowest))}%`,
              background: 'var(--muted-foreground)',
            }}
            aria-hidden="true"
          />
          {[lowest, highest].map((v, i) => (
            <span
              key={i}
              className="pointer-events-none absolute top-7 h-2.5 w-px -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${scaleX(v)}%`, background: 'var(--muted-foreground)' }}
              aria-hidden="true"
            />
          ))}
        </>
      )}
      {/* middle 50% band — hover for Median + vs-program */}
      <Tooltip>
        <TooltipTrigger
          aria-label={`${detailMeta ?? detailTitle}, median and program comparison`}
          className={`absolute top-7 h-2.5 -translate-y-1/2 rounded-full ${PLOT_TRIGGER_RING}`}
          style={{
            left: `${scaleX(p25)}%`,
            width: `${Math.max(2, scaleX(p75) - scaleX(p25))}%`,
            background: 'var(--brand-color)',
            opacity: 0.42,
          }}
        />
        <TooltipContent side="top" sideOffset={10}>
          <div className="flex flex-col gap-1">
            {detailMeta && <p className="max-w-56 truncate font-medium">{detailMeta}</p>}
            {tooltipStat(avg)}
          </div>
        </TooltipContent>
      </Tooltip>
      {/* median — brand line per the DS boxplot spec */}
      <span
        className="pointer-events-none absolute top-7 h-3.5 w-0.5 -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{ left: `${scaleX(median)}%`, background: 'var(--brand-color)' }}
        aria-hidden="true"
      />
      {/* identity markers + at-mark value labels — every marker is a hover
          Tooltip, same as the middle-50% band above. */}
      {placed.map((m) => {
        const label = m.person
          ? `${m.person.name}, average ${m.value.toFixed(1)}`
          : `Course average ${m.value.toFixed(1)}`
        const triggerStyle = {
          left: `${m.x}%`,
          top: m.person ? 16 : 22,
          marginLeft: m.xOffsetPx ? `${m.xOffsetPx}px` : undefined,
        }
        const triggerClass = `absolute flex -translate-x-1/2 flex-col items-center ${PLOT_TRIGGER_RING}`
        const triggerContent = (
          <>
            {m.person ? (
              <AvatarInitials initials={m.person.initials} size="sm" className="ring-2 ring-[var(--card)]" />
            ) : (
              <span
                className="size-2.5 rounded-full ring-2 ring-[var(--card)]"
                style={{ background: m.below ? 'var(--chip-4)' : 'var(--foreground)' }}
              />
            )}
            <span
              className="mt-1 text-xs font-semibold leading-none tabular-nums"
              style={{ color: m.below ? 'var(--chip-4)' : 'var(--foreground)' }}
            >
              {m.value.toFixed(1)}
            </span>
          </>
        )
        return (
          <Tooltip key={m.key}>
            <TooltipTrigger
              aria-label={`${label}, median and program comparison`}
              className={triggerClass}
              style={triggerStyle}
            >
              {triggerContent}
            </TooltipTrigger>
            <TooltipContent side="top" sideOffset={6}>
              <div className="flex flex-col gap-1">
                {m.person && (
                  <p className="font-medium">
                    {m.person.name}
                    {/* Role wasn't shown anywhere on this popover at all
                        (Romit, 2026-08-25: "their role isn't defined here")
                        — same 'Primary faculty' / 'Guest faculty' vocabulary
                        as the Evaluatees column, not just a "Guest" flag on
                        the exception case. */}
                    {m.person.role && (
                      <span className="text-background/70"> · {m.person.role === 'primary' ? 'Primary faculty' : 'Guest faculty'}</span>
                    )}
                  </p>
                )}
                {tooltipStat(m.value)}
              </div>
            </TooltipContent>
          </Tooltip>
        )
      })}
    </div>
  )
}

/** Free-text row — Sprig's question-first block (PR #53 anatomy): question as
 *  the heading, a count + sentiment meta line, TWO preview quotes inline, and
 *  the full anonymized list in a FloatingSheetPanel whose subtitle carries the
 *  evaluation-type provenance. Count comes from the actual response records so
 *  the sheet can always back what the row claims. */
function WrittenResponsesRow({
  row,
  surveyId,
  context,
  canModerate,
}: {
  row: BreakdownRow
  surveyId: string
  context?: string
  /** PD/coordinator can hide a response from the faculty-facing view — same
   *  "Visible to faculty" ToggleSwitch contract as CommentList, just local
   *  state here since there's no global toggleHideComment-style action for
   *  per-question open-text responses (2026-08-26 transcript: "we are
   *  showing responses at a section question breakdown... ideally we should
   *  be showing visible to faculty or not here... you click view all and you
   *  can hide or remove a few from here"). */
  canModerate: boolean
}) {
  const allResponses = MOCK_OPEN_TEXT_RESPONSES.filter(
    (x) => x.surveyId === surveyId && x.questionText === row.label,
  )
  const [open, setOpen] = useState(false)
  const [filter, setFilter] = useState<SentimentFilter>('all')
  const [hiddenIds, setHiddenIds] = useState<Set<string>>(new Set())
  const toggleHidden = (id: string) =>
    setHiddenIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  const visibleToRole = canModerate ? allResponses : allResponses.filter((x) => !hiddenIds.has(x.id))
  const responses = visibleToRole
  const count = responses.length
  const hiddenCount = allResponses.filter((x) => hiddenIds.has(x.id)).length
  const filtered =
    filter === 'all' ? responses : responses.filter((x) => (x.sentiment ?? 'neutral') === filter)
  /* Per-row sentiment badges only earn their ink when the visible list MIXES
     sentiments — a uniform column of "Constructive" chips is noise (round 5). */
  const visibleSentimentKinds = new Set(filtered.map((x) => x.sentiment ?? 'neutral'))
  const countFor = (f: SentimentFilter) =>
    f === 'all' ? count : responses.filter((x) => (x.sentiment ?? 'neutral') === f).length
  const positives = countFor('positive')
  const concerns = countFor('concern')
  const neutrals = countFor('neutral')
  /* Flagged responses were in the data but invisible — a moderator's queue
     signal, so it rides the meta line and marks the row in the sheet. */
  const flaggedCount = responses.filter((x) => x.flagged).length
  /* Per-question Highlights / Scope for improvement / Neutral (2026-09-15
   * requirement: "summary of all the comments broken into highlights, scope
   * for improvements and neutral" — same THEME_PATTERNS clustering the
   * course/faculty-tab ThemeHighlightCard uses, just scoped to THIS
   * question's own response pool instead of every comment in the tab).
   * Neutral has no theme to name — a plain count, same as the other two
   * buckets read as "n comments" when nothing clustered. Each pill jumps
   * into the same drawer + sentiment filter the "View all" button opens. */
  const rowThemes = deriveThemes(visibleToRole)
  const rowHighlights = rowThemes.filter((t) => t.sentiment === 'positive').sort((a, b) => b.occurrences - a.occurrences)
  const rowConcerns = rowThemes.filter((t) => t.sentiment === 'concern').sort((a, b) => b.occurrences - a.occurrences)
  const openFiltered = (f: SentimentFilter) => {
    setFilter(f)
    setOpen(true)
  }
  return (
    <div
      id={`question-${row.id}`}
      className="scroll-mt-16 flex flex-col gap-2 py-3 border-b border-border last:border-0"
    >
      <div className="flex items-start justify-between gap-6">
        <div className="min-w-0 flex flex-col gap-1.5">
          <p className="text-sm">{row.label}</p>
          {count === 0 ? (
            <p className="text-xs text-muted-foreground tabular-nums">Written responses · none yet</p>
          ) : (
            <div className="flex flex-wrap items-center gap-1.5">
              {rowHighlights.slice(0, 2).map((t) => (
                <Button
                  key={`h-${t.label}`}
                  type="button"
                  variant="outline"
                  size="xs"
                  onClick={() => openFiltered('positive')}
                  className="h-auto gap-1 rounded-full px-2 py-0.5 font-normal text-muted-foreground"
                >
                  <i className="fa-light fa-thumbs-up text-[10px]" aria-hidden="true" />
                  {t.label} ({t.occurrences})
                </Button>
              ))}
              {rowConcerns.slice(0, 2).map((t) => (
                <Button
                  key={`c-${t.label}`}
                  type="button"
                  variant="outline"
                  size="xs"
                  onClick={() => openFiltered('concern')}
                  className="h-auto gap-1 rounded-full px-2 py-0.5 font-normal text-muted-foreground"
                >
                  <i className="fa-light fa-arrow-trend-up text-[10px]" aria-hidden="true" />
                  {t.label} ({t.occurrences})
                </Button>
              ))}
              {neutrals > 0 && (
                <Button
                  type="button"
                  variant="outline"
                  size="xs"
                  onClick={() => openFiltered('neutral')}
                  className="h-auto gap-1 rounded-full px-2 py-0.5 font-normal text-muted-foreground"
                >
                  {neutrals} neutral
                </Button>
              )}
              <span className="text-xs text-muted-foreground tabular-nums">
                {count} written response{count !== 1 ? 's' : ''}
                {flaggedCount > 0 && <> · {flaggedCount} flagged for review</>}
                {canModerate && hiddenCount > 0 && <> · {hiddenCount} hidden from faculty</>}
              </span>
            </div>
          )}
        </div>
        {count > 0 && (
          <Button variant="outline" size="sm" className="shrink-0" onClick={() => setOpen(true)}>
            View all {count}
            <i className="fa-light fa-arrow-right" aria-hidden="true" />
          </Button>
        )}
      </div>
      <FloatingSheetPanel open={open} onOpenChange={setOpen}>
        <FloatingSheetPanelContent>
          <FloatingSheetPanelHeader
            title={row.label}
            subtitle={`${count} written response${count !== 1 ? 's' : ''} · anonymized${context ? ` · ${context}` : ''}`}
            onClose={() => setOpen(false)}
          />
          {/* DS sheet-body anatomy (ExportDrawer convention): px-4 pb-4 body,
              space-y-5 sections; the responses render as ONE contained list
              (invite-collaborators drawer idiom: bordered ul, divide-y rows)
              instead of floating paragraphs. */}
          <FloatingSheetPanelBody className="px-4 pb-4 space-y-5">
            <SentimentFilterGroup
              value={filter}
              onChange={setFilter}
              countFor={countFor}
              label={`Filter responses to “${row.label}” by sentiment`}
            />
            {filtered.length === 0 ? (
              <p className="text-sm text-muted-foreground">No responses match this filter.</p>
            ) : (
              <ul className="rounded-lg border border-border divide-y divide-border">
                {filtered.map((x) => {
                  const chip = x.sentiment ? SENTIMENT_CHIP[x.sentiment] : null
                  const isHidden = hiddenIds.has(x.id)
                  const switchId = `response-visible-${x.id}`
                  return (
                    <li key={x.id} className="flex items-start justify-between gap-4 px-3 py-2.5">
                      <div className="min-w-0 flex-1 flex flex-wrap items-center gap-2">
                        <p className={`text-sm leading-relaxed ${isHidden ? 'text-muted-foreground' : ''}`}>
                          &ldquo;{x.text}&rdquo;
                        </p>
                        {chip && visibleSentimentKinds.size > 1 && (
                          <StatusBadge label={chip.label} tone={chip.tone} />
                        )}
                        {x.flagged && <StatusBadge label="Flagged" tone="warning" />}
                      </div>
                      {canModerate && (
                        <div className="flex items-center gap-2 shrink-0 pt-0.5">
                          <label htmlFor={switchId} className="text-xs text-muted-foreground">
                            Visible to faculty
                          </label>
                          <ToggleSwitch id={switchId} checked={!isHidden} onChange={() => toggleHidden(x.id)} />
                        </div>
                      )}
                    </li>
                  )
                })}
              </ul>
            )}
          </FloatingSheetPanelBody>
        </FloatingSheetPanelContent>
      </FloatingSheetPanel>
    </div>
  )
}

/* Question rows = one wide ScaleTrackPlot per row (see its block comment).
   The former numbers + chips columns folded INTO the plot: at-mark value
   labels, photo identity markers, program ▲, hover tooltips for the detail.
   The freed ~17rem funds the track width that makes middle-50% differences
   clear (Δpx ≥ 8 at ~24rem). */
function QuestionBreakdownTable({
  rows,
  surveyId,
  groupMeta,
  canModerate,
  openQuestions,
  onOpenQuestionsChange,
}: {
  rows: BreakdownRow[]
  surveyId: string
  groupMeta: Record<string, GroupMeta>
  /** Threaded to WrittenResponsesRow's "Visible to faculty" toggle. */
  canModerate: boolean
  /** Controlled from the page so "Export as PDF" can force every question's
   *  rating-distribution accordion open before printing (same reasoning as
   *  Section-wise distribution's openSections). */
  openQuestions: string[]
  onOpenQuestionsChange: (ids: string[]) => void
}) {
  if (rows.length === 0) return null
  const [view, setView] = useState<'distribution' | 'heatmap'>('distribution')
  const groups = [...new Set(rows.map((r) => r.group))]
  /* Sections present within a group, in SECTION_ORDER (same taxonomy +
     order Section-wise distribution uses) — a section a group doesn't
     actually have any questions in is simply absent, not an empty header. */
  const sectionsFor = (group: string) => {
    const present = new Set(rows.filter((r) => r.group === group).map((r) => r.sectionTitle))
    return SECTION_ORDER.filter((s) => present.has(s))
  }
  /* Within each section: lowest favorable share first (the fix-first order);
     free-text rows keep the tail. */
  const orderedFor = (group: string, sectionTitle: string) =>
    rows
      .filter((r) => r.group === group && r.sectionTitle === sectionTitle)
      .sort((a, b) => {
        if (a.kind !== b.kind) return a.kind === 'freeText' ? 1 : -1
        if (a.kind === 'freeText') return 0
        return favorableShare(a.counts, a.total) - favorableShare(b.counts, b.total)
      })
  return (
    <div className="flex flex-col">
      {/* Distribution ↔ Heat map — same toggle mechanism as Section-wise
          distribution (Romit: "just like how you did in section wise"). A
          plain Tabs here, not ChartCard's tabs variant — this table already
          lives inside the page's own Card/Collapsible chrome, so a second
          Card would double up the border. ariaLabel scoped so this landmark
          doesn't collide with Section-wise distribution's own Tabs. */}
      <Tabs value={view} onValueChange={(v) => setView(v as 'distribution' | 'heatmap')} className="flex flex-col">
        <TabsList variant="line" ariaLabel="Question breakdown view" className="mb-2">
          <TabsTrigger value="distribution">Distribution</TabsTrigger>
          <TabsTrigger value="heatmap">Heat map</TabsTrigger>
        </TabsList>
        <TabsContent value="heatmap" className="m-0">
          <QuestionHeatmapTable rows={rows} groupMeta={groupMeta} surveyId={surveyId} canModerate={canModerate} />
        </TabsContent>
        <TabsContent value="distribution" className="m-0 flex flex-col">
      {/* No legend (round 5: "a lot of legends which isn't required") —
          values ride the marks and the popovers explain on click. Fixed
          26rem, not minmax(160px,30rem) — each question row below is its own
          independent grid (Accordion item), so a content-sized column would
          compute a different width per row depending on that row's own
          question-text length, same class of bug fixed in Section-wise
          distribution's column. */}
      <div className="grid grid-cols-[26rem_minmax(18rem,1fr)] items-end gap-6 pb-2 border-b border-border">
        <span className="text-xs text-muted-foreground">Question</span>
        <div className="relative h-4 text-xs text-muted-foreground tabular-nums" aria-hidden="true">
          {[1, 2, 3, 4, 5].map((n) => (
            <span key={n} className="absolute -translate-x-1/2" style={{ left: `${scaleX(n)}%` }}>
              {n}
            </span>
          ))}
        </div>
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
          {sectionsFor(group).map((sectionTitle) => (
            <Fragment key={sectionTitle}>
              {/* Section sub-header — same name + order Section-wise
                  distribution uses, so a multi-section template's questions
                  don't collapse into one flat Course/Faculty band. Bolder
                  than the group band above it (font-semibold vs font-medium)
                  so the two levels stay visually distinguishable, not just
                  differently indented. */}
              <p className="pt-3 pb-1 text-sm font-semibold text-foreground">{sectionTitle}</p>
              <Accordion
                type="multiple"
                value={openQuestions}
                onValueChange={onOpenQuestionsChange}
                className="flex flex-col"
              >
                {orderedFor(group, sectionTitle).map((r) =>
                  r.kind === 'rated' ? (
                    <AccordionItem
                      key={r.id}
                      value={r.id}
                      id={`question-${r.id}`}
                      className="scroll-mt-16 border-b border-border last:border-0"
                    >
                      {/* Same grid-IS-the-row anatomy as Section-wise
                          distribution's rows — AccordionTrigger in column 1
                          only, ScaleTrackPlot's own Popover buttons as a
                          sibling in column 2 (never nested inside the
                          trigger's own button element). */}
                      <div className="grid grid-cols-[26rem_minmax(18rem,1fr)] items-center gap-6">
                        <AccordionTrigger className="pce-leading-chevron-trigger group justify-start gap-2 py-2 hover:no-underline">
                          <i
                            className="fa-light fa-chevron-right shrink-0 text-xs text-muted-foreground transition-transform group-data-[state=open]:rotate-90"
                            aria-hidden="true"
                          />
                          <p className="text-sm min-w-0 text-start">
                            {r.label}
                            {/* Screen-reader glance summary — the plot's popover
                                buttons carry the drill-down; the data table
                                carries everything. */}
                            <span className="sr-only">
                              {`: average ${r.avg != null ? r.avg.toFixed(1) : 'unknown'} of 5${r.programAvg != null ? `, program average ${r.programAvg.toFixed(1)}` : ''}, from ${r.total ?? 0} rating${(r.total ?? 0) !== 1 ? 's' : ''}${
                                (r.total ?? 0) > 0
                                  ? `, ${Math.round(favorableShare(r.counts, r.total) * 100)}% rated 4 or 5`
                                  : ''
                              }${
                                r.perFaculty && r.perFaculty.length > 0
                                  ? `. Per instructor: ${r.perFaculty.map((f) => `${f.name} ${f.avg.toFixed(1)}`).join(', ')}`
                                  : ''
                              }`}
                            </span>
                          </p>
                        </AccordionTrigger>
                        <div className="min-w-0">
                          <ScaleTrackPlot
                            counts={r.counts ?? [0, 0, 0, 0, 0]}
                            total={r.total ?? 0}
                            avg={r.avg}
                            programAvg={r.programAvg}
                            people={r.perFaculty}
                            detailTitle="Rating distribution"
                            detailMeta={r.label}
                          />
                        </div>
                      </div>
                      {/* Expanded panel — always-visible rating distribution,
                          same RatingBreakdownRows primitive Section-wise
                          distribution uses (Romit: "make some accordion with
                          rate distribution, similar to section wise
                          distribution"). */}
                      <AccordionContent className="pb-3">
                        <div className="grid grid-cols-[26rem_minmax(18rem,1fr)] gap-6">
                          {/* Median / Range / Term avg (2026-09-15 Question
                              Breakdown requirement) — same compact KeyMetrics
                              strip Section-wise distribution's own expanded
                              rows already use. */}
                          <KeyMetrics
                            variant="compact"
                            size="sm"
                            metricsSingleRow
                            className="h-auto"
                            metrics={[
                              { id: 'median', label: 'Median', value: r.median != null ? r.median.toFixed(1) : '—', delta: '', trend: 'neutral' },
                              { id: 'range', label: 'Range', value: r.range ? `${r.range.lo}–${r.range.hi}` : '—', delta: '', trend: 'neutral' },
                              { id: 'term', label: 'Term avg', value: r.termAvg != null ? r.termAvg.toFixed(1) : '—', delta: '', trend: 'neutral' },
                            ]}
                          />
                          <RatingBreakdownRows counts={r.counts ?? [0, 0, 0, 0, 0]} total={r.total ?? 0} />
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ) : (
                    <WrittenResponsesRow
                      key={r.id}
                      row={r}
                      surveyId={surveyId}
                      context={meta?.contextLine}
                      canModerate={canModerate}
                    />
                  ),
                )}
              </Accordion>
            </Fragment>
          ))}
        </Fragment>
        )
      })}
        </TabsContent>
      </Tabs>
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
              `${r.label} · ${f.name}`,
              r.group,
              f.avg.toFixed(1),
              '—',
              '—',
              ...(f.counts ?? [0, 0, 0, 0, 0]),
            ]),
          ])}
      />
    </div>
  )
}

/** Alternate view for Question Breakdown (Romit: "just like how you did in
 *  section wise") — one row per RATED question, grouped by group + section
 *  (same SECTION_ORDER, same sub-headers), rating 1–5 columns heat-tinted by
 *  response share, avg/median/program printed directly. Free-text rows have
 *  no rating distribution to heat-map — they stay Distribution-view-only,
 *  reachable via their own "View all" sheet regardless of which tab is
 *  active. Per-instructor avg columns included (same as Section-wise
 *  distribution's heat map) whenever a question carries `perFaculty`. */
function QuestionHeatmapTable({
  rows,
  groupMeta,
  surveyId,
  canModerate,
}: {
  rows: BreakdownRow[]
  groupMeta: Record<string, GroupMeta>
  surveyId: string
  /** Threaded to WrittenResponsesRow's "Visible to faculty" toggle. */
  canModerate: boolean
}) {
  const groups = [...new Set(rows.map((r) => r.group))]
  /* Sections present, rated OR free-text — a comment-only prompt (e.g. "What
   * would you change about this course?") must still get its section
   * sub-header here, same as the Distribution tab (Romit: "I don't see
   * comment related table row for each section which we are seeing in the
   * distribution tab"). */
  const sectionsFor = (group: string) => {
    const present = new Set(rows.filter((r) => r.group === group).map((r) => r.sectionTitle))
    return SECTION_ORDER.filter((s) => present.has(s))
  }
  /* Rated rows first (weakest favorable share), free-text rows keep the
   * tail — same order Distribution uses. Free-text rows render as their
   * existing WrittenResponsesRow (View all / Visible-to-faculty), not a
   * heat cell — there is no rating distribution to heat-map. */
  const orderedFor = (group: string, sectionTitle: string) =>
    rows
      .filter((r) => r.group === group && r.sectionTitle === sectionTitle)
      .sort((a, b) => {
        if (a.kind !== b.kind) return a.kind === 'freeText' ? 1 : -1
        if (a.kind === 'freeText') return 0
        return favorableShare(a.counts, a.total) - favorableShare(b.counts, b.total)
      })
  const instructors = [
    ...new Map(rows.flatMap((r) => r.perFaculty ?? []).map((fi) => [fi.facultyId, fi])).values(),
  ]
  /* CSS Grid, not a real <table> — needed so group/section band rows and
   * WrittenResponsesRow can span the full width via gridColumn: '1 / -1'.
   * The rated-row cells and headers are decorative (aria-hidden) — the
   * sr-only ChartDataTable sibling already carries their real semantics —
   * but WrittenResponsesRow is genuinely interactive (View all button,
   * Visible-to-faculty toggles) and must stay OUT of aria-hidden. Plain
   * header, no sticky — horizontal scroll on the wrapper instead. Cell
   * chrome comes from the HEAT_* constants shared with SectionHeatmapTable
   * (see above) — that's what keeps the rated-row and free-text-row left
   * inset from drifting apart again. */
  /* minmax(0,Xrem), not fixed — no horizontal-scroll wrapper (Romit:
   * "remove horizontal scroll bar"), so columns must shrink to fit the
   * card's actual width instead of overflowing it. repeat(0,7rem) — the
   * course-only case — would also make the whole grid-template-columns
   * value invalid in some engines, collapsing every row into a single
   * stacked column; omit that segment when there are no instructors rather
   * than emit a zero-count repeat(). */
  const cols = `minmax(0,26rem) repeat(5,minmax(0,4rem)) repeat(3,minmax(0,6rem))${instructors.length > 0 ? ` repeat(${instructors.length},minmax(0,7rem))` : ''}`
  const questionLabelCell = `${HEAT_LABEL_CELL} pl-3`
  return (
    <div>
      <div className="grid" style={{ gridTemplateColumns: cols }}>
        <div className={`${HEAT_TH} py-2 pr-4`} aria-hidden="true">Question</div>
        {[1, 2, 3, 4, 5].map((n) => (
          <div key={n} className={`${HEAT_TH} px-1 py-2 text-center`} aria-hidden="true">{n}</div>
        ))}
        <div className={`${HEAT_TH} px-3 py-2 text-right`} aria-hidden="true">Average</div>
        <div className={`${HEAT_TH} px-3 py-2 text-right`} aria-hidden="true">Median</div>
        <div className={`${HEAT_TH} px-3 py-2 text-right`} aria-hidden="true">Program avg</div>
        {instructors.map((fi) => (
          <div key={fi.facultyId} className={`${HEAT_TH} whitespace-nowrap px-3 py-2 text-right`} aria-hidden="true">
            {fi.name}
          </div>
        ))}

        {groups.map((group) => {
          const meta = groupMeta[group]
          return (
            <Fragment key={group}>
              <div className="bg-muted/50 px-3 py-2 text-left text-xs font-medium text-foreground" style={HEAT_FULL_ROW_STYLE} aria-hidden="true">
                {meta?.label ?? group}
                {meta?.sub && <span className="font-normal text-muted-foreground"> · {meta.sub}</span>}
              </div>
              {sectionsFor(group).map((sectionTitle) => (
                <Fragment key={sectionTitle}>
                  <div className="px-3 pt-2 pb-1 text-left text-sm font-semibold text-foreground" style={HEAT_FULL_ROW_STYLE} aria-hidden="true">
                    {sectionTitle}
                  </div>
                  {orderedFor(group, sectionTitle).map((r) => {
                    if (r.kind === 'freeText') {
                      return (
                        <div key={r.id} className={HEAT_FULL_ROW_PAD} style={HEAT_FULL_ROW_STYLE}>
                          <WrittenResponsesRow
                            row={r}
                            surveyId={surveyId}
                            context={meta?.contextLine}
                            canModerate={canModerate}
                          />
                        </div>
                      )
                    }
                    const total = r.total ?? 0
                    const counts = r.counts ?? [0, 0, 0, 0, 0]
                    const median = total > 0 ? ratingQuantile(counts, total, 0.5) : null
                    return (
                      <Fragment key={r.id}>
                        <div className={`${questionLabelCell} text-sm font-normal text-foreground`} aria-hidden="true">
                          {r.label}
                        </div>
                        {[0, 1, 2, 3, 4].map((i) => (
                          <HeatCell key={i} share={total > 0 ? (counts[i] ?? 0) / total : 0} total={total} color={RATING_SERIES[i].color} />
                        ))}
                        <div className={HEAT_STAT_AVG} aria-hidden="true">{r.avg != null ? r.avg.toFixed(1) : '—'}</div>
                        <div className={HEAT_STAT_MEDIAN} aria-hidden="true">{median != null ? median.toFixed(1) : '—'}</div>
                        <div className={HEAT_STAT_PROGRAM} aria-hidden="true">{r.programAvg != null ? r.programAvg.toFixed(1) : '—'}</div>
                        {instructors.map((fi) => {
                          const hit = r.perFaculty?.find((x) => x.facultyId === fi.facultyId)
                          return (
                            <div key={fi.facultyId} className={HEAT_INSTRUCTOR_CELL} aria-hidden="true">
                              {hit ? hit.avg.toFixed(1) : '—'}
                            </div>
                          )
                        })}
                      </Fragment>
                    )
                  })}
                </Fragment>
              ))}
            </Fragment>
          )
        })}
      </div>
    </div>
  )
}

/* ── response collection trend (Overview tab) ──────────────────────────────
   Cumulative % of enrolled students who had responded, across the survey's
   open→close window — "did responses trickle in or spike at the end, should
   I remind earlier next time" (2026-09-15 spec). This chart shipped once
   (2026-06-18) as hand-rolled inline SVG, then was cut three days later
   (2026-06-21, commit d4442b77: "removed the dense hand-rolled velocity
   chart + sub-12px literals") for not using the vendored chart vocabulary —
   rebuilt here on Plot/ChartCard instead of resurrecting the inline SVG. The
   underlying data is still a MODELED curve (a smoothstep ease from 0 to the
   survey's current known rate, extrapolated to close) because the mock
   dataset has no real per-day response counts — same limitation the original
   had; swap in real daily counts here first if/when that data exists. */
function ResponseCollectionTrend({ survey, rate }: { survey: PceSurvey; rate: number }) {
  if (!survey.openDate || !survey.deadline) return null
  const open = new Date(survey.openDate).getTime()
  const close = new Date(survey.deadline).getTime()
  if (!Number.isFinite(open) || !Number.isFinite(close) || close <= open) return null
  const closed = survey.status === 'closed' || survey.status === 'released'
  const elapsed = closed ? 1 : Math.min(0.95, Math.max(0.1, (Date.now() - open) / (close - open)))
  const TARGET = 70
  const smooth = (x: number) => x * x * (3 - 2 * x)
  const N = 12
  const actual = Array.from({ length: N + 1 }, (_, k) => {
    const t = (k / N) * elapsed
    return { date: new Date(open + t * (close - open)), value: rate * smooth(elapsed === 0 ? 0 : t / elapsed) }
  })
  const projectedFinal = closed ? rate : Math.min(100, Math.round(rate / elapsed))
  const projected = closed
    ? []
    : [
        { date: new Date(open + elapsed * (close - open)), value: rate },
        { date: new Date(close), value: projectedFinal },
      ]
  const leo: ChartLeoInsight = {
    headline: closed
      ? `${rate}% responded by close`
      : `${rate}% so far · projected ~${projectedFinal}% by close`,
    explanation: closed
      ? 'Final response rate for this evaluation window.'
      : `At the current pace, responses are on track to reach ${projectedFinal}% by ${new Date(close).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}. Remind earlier next term if the curve stays this back-loaded.`,
    kind: projectedFinal < TARGET ? 'dip' : 'trend',
  }
  const spec = (theme: PlotTheme) => ({
    marginLeft: 36,
    marginTop: 20,
    marginBottom: 28,
    x: { type: 'utc' as const, label: null, ...axisDefaults(theme) },
    y: { domain: [0, 100], ticks: 4, label: null, ...axisDefaults(theme) },
    marks: [
      gridMark(theme),
      Plot.ruleY([TARGET], { stroke: theme.rule, strokeDasharray: '4,4', strokeOpacity: 0.8 }),
      Plot.text([{ date: new Date(open), value: TARGET }], {
        x: 'date',
        y: 'value',
        text: () => `${TARGET}% target`,
        dy: -8,
        textAnchor: 'start',
        fill: theme.mutedForeground,
        fontSize: CHART_TICK_FONT_SIZE,
      }),
      Plot.line(actual, { x: 'date', y: 'value', stroke: theme.content, strokeWidth: 2, curve: 'monotone-x' }),
      ...(projected.length
        ? [Plot.line(projected, { x: 'date', y: 'value', stroke: theme.content, strokeWidth: 2, strokeDasharray: '4,3', curve: 'monotone-x' })]
        : []),
      Plot.dot([actual[actual.length - 1]], { x: 'date', y: 'value', fill: theme.content, r: 3 }),
    ],
  })
  return (
    <ChartCard
      title="Response collection"
      description={`Cumulative responses across the evaluation window${!closed ? ' · dashed = projected' : ''}`}
      leoInsight={leo}
      hideAskLeo
    >
      {/* PlotFigure's SVG is aria-hidden (components/pce/plot-figure.tsx) —
          every chart on this page pairs it with a sr-only prose description
          of the same data (see SectionBoxplotChart above). */}
      <p className="sr-only">
        {`Cumulative response rate over the evaluation window from ${new Date(open).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} to ${new Date(close).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}. Current rate: ${rate}%.${!closed ? ` Projected by close: ~${projectedFinal}%.` : ''} Target: ${TARGET}%.`}
      </p>
      <PlotFigure spec={spec} height={240} />
    </ChartCard>
  )
}

/* ── theme highlight cards (Course/Faculty tabs) ───────────────────────────
   "Highlights" and "Scope for improvement" — comments clustered into 2–5
   named areas with a contributing-comment count, click-through to the full
   list (2026-09-15 spec). Replaces the old owner/PD-only "Top N
   recommendations" box (hardcoded label→advice dictionary) — this is visible
   to every viewer, same as the rest of the Course/Faculty tab content, since
   it's now core page content rather than an AI-lane exclusive. Reuses
   deriveThemes()'s THEME_PATTERNS keyword matching (lib/pce-themes.ts) to
   recover WHICH comments contributed to each theme, since deriveThemes()
   itself only returns aggregate counts. */
function ThemeHighlightCard({
  kind,
  themes,
  matchedFor,
}: {
  kind: 'highlight' | 'improvement'
  themes: ThemeRow[]
  matchedFor: (label: string) => IndexedComment[]
}) {
  const [openLabel, setOpenLabel] = useState<string | null>(null)
  const copy =
    kind === 'highlight'
      ? { icon: 'fa-thumbs-up', title: 'Highlights', empty: 'No clear highlights yet — check back once more responses come in.' }
      : { icon: 'fa-arrow-trend-up', title: 'Scope for improvement', empty: 'No recurring concerns flagged yet.' }
  const openComments = openLabel ? matchedFor(openLabel) : []
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-1.5" aria-level={2}>
          <i className={`fa-light ${copy.icon} text-xs text-muted-foreground`} aria-hidden="true" />
          {copy.title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {themes.length === 0 ? (
          <p className="text-sm text-muted-foreground">{copy.empty}</p>
        ) : (
          <ul className="flex flex-col">
            {themes.slice(0, 5).map((t) => (
              <li key={t.label} className="border-b border-border last:border-0">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setOpenLabel(t.label)}
                  className="h-auto w-full justify-between gap-3 py-2.5 font-normal"
                >
                  <span className="text-sm text-foreground">{t.label}</span>
                  <span className="flex items-center gap-2 shrink-0 text-xs text-muted-foreground">
                    {t.occurrences} comment{t.occurrences !== 1 ? 's' : ''}
                    <i className="fa-light fa-chevron-right" aria-hidden="true" />
                  </span>
                </Button>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
      <FloatingSheetPanel open={openLabel != null} onOpenChange={(o) => !o && setOpenLabel(null)}>
        <FloatingSheetPanelContent>
          <FloatingSheetPanelHeader
            title={openLabel ?? ''}
            subtitle={`${openComments.length} contributing comment${openComments.length !== 1 ? 's' : ''} · anonymized`}
            onClose={() => setOpenLabel(null)}
          />
          <FloatingSheetPanelBody className="px-4 pb-4">
            <ul className="rounded-lg border border-border divide-y divide-border">
              {openComments.map((c) => {
                const chip = SENTIMENT_CHIP[c.sentiment ?? 'neutral']
                return (
                  <li key={c.index} className="flex items-start justify-between gap-4 px-3 py-2.5">
                    <p className="text-sm leading-relaxed">&ldquo;{c.text}&rdquo;</p>
                    <StatusBadge label={chip.label} tone={chip.tone} />
                  </li>
                )
              })}
            </ul>
          </FloatingSheetPanelBody>
        </FloatingSheetPanelContent>
      </FloatingSheetPanel>
    </Card>
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
  /* SINGLE-select (2026-08-26, single-survey-analytics review — reverses the
   * 2026-08-25 flip to multi-select: "I am not able to add multiple
   * faculty/role"). 2026-09-15: the Faculty tab no longer offers an
   * "All faculty" chip at all (spec: "a chip for each faculty + role — no
   * chip for all faculty") — `facultyScope` now always resolves to a REAL
   * instructor id once on the Faculty tab, defaulting to the first one;
   * 'all' survives only as isPD's own always-everyone aggregate (computed
   * independently, below) and as the initial value before the survey's
   * instructor list is known. Faculty isolation (2026-09-15 requirement:
   * "faculty should see their own rating versus program average, but not
   * other faculty data") — a non-PD viewer's scope is FORCED to their own
   * `result.facultyId` from the start, never `instructors[0]` (which can be
   * a co-instructor on a co-taught offering); every downstream computation
   * keyed on `facultyScope`/`inFacultyScope` inherits this for free. */
  const [facultyScope, setFacultyScope] = useState<'all' | 'course' | string>(
    () => (isPD ? survey.instructors[0]?.id ?? 'all' : result.facultyId),
  )

  /* Page tab — Overview / Course / Faculty / Reports / My Logs (2026-09-15:
   * Overview reinstated as its own tab — spec explicitly asks for a
   * dedicated Overview with the response-collection trend; it carries no
   * `facultyScope` of its own). Switching TO Course always sets scope to
   * 'course'; switching TO Faculty resets to the first instructor (PD) or
   * back to the viewer's own id (non-PD) ONLY when coming from Course. */
  const [pageTab, setPageTabRaw] = useState<'overview' | 'course' | 'faculty' | 'reports' | 'mylogs'>('overview')
  const setPageTab = (v: string) => {
    if (v !== 'overview' && v !== 'course' && v !== 'faculty' && v !== 'reports' && v !== 'mylogs') return
    if (v === 'course') setFacultyScope('course')
    else if (v === 'faculty' && facultyScope === 'course') {
      setFacultyScope(isPD ? survey.instructors[0]?.id ?? 'all' : result.facultyId)
    }
    setPageTabRaw(v)
  }

  /* facultyId → course-association role, shared derivation with Analytics →
   * By Faculty (2026-05-19, Monil: roles derive from course associations,
   * not faculty rank). Display-only here (the ScoreCard's person.role
   * label) — role is NOT a filter dimension on this page (2026-08-26
   * re-read: "do we want to aggregate at a role level? ... No. That was a
   * use case for longitudinal analytics, not for single course offering"). */
  const evalRoleFor = (facultyId: string): FacultyEvalRoleId => {
    const inst = survey.instructors.find((i) => i.id === facultyId)
    return facultyEvalRole(inst?.role ?? 'primary', MOCK_FACULTY.find((f) => f.id === facultyId)?.position)
  }
  /* ONE predicate for every faculty-scoped aggregate on the page. */
  const inFacultyScope = (facultyId: string): boolean => {
    if (facultyScope === 'course') return false
    return facultyScope === 'all' || facultyScope === facultyId
  }
  /** Picks ONE instructor — always exactly one selected on the Faculty tab
   *  (2026-09-15: no "All faculty" to fall back to any more, so clicking the
   *  already-active chip is a no-op instead of clearing to 'all'). */
  const toggleFacultyId = (id: string) => {
    setFacultyScope(id)
  }
  const hasAnyFacultyFilter = facultyScope !== 'all' && facultyScope !== 'course'
  /* The people the CURRENT combination of filters actually resolves to —
   * the intersection of the faculty pick and the role pick when both are
   * active, either one alone when only one is, or everyone when neither is. */
  const matchedInstructors = survey.instructors.filter((i) => inFacultyScope(i.id))

  /* Whose faculty data the page currently shows — a picked instructor, the
   * sole instructor, or (multi-instructor / filtered to 2+) nobody nameable
   * (the ScoreCard's `breakdown` prop takes over instead — see
   * `facultyBreakdown` below). Drives the Faculty Performance card title,
   * the question-group band, comment-group headers, and the summary strip
   * (Romit 2026-07-17: every faculty-scoped surface must SAY whose data it
   * is). Only resolves to ONE identity when the filters resolve to exactly
   * one instructor — 2+ matched is a genuine "these specific people" blend,
   * same shape as "All faculty" for display purposes. */
  const scopedInstructor = hasAnyFacultyFilter && matchedInstructors.length === 1 ? matchedInstructors[0] : null
  const soleInstructor = survey.instructors.length === 1 ? survey.instructors[0] : null
  const scopedFacultyName = scopedInstructor?.name ?? soleInstructor?.name ?? null
  const facultyChipLabel =
    scopedFacultyName ??
    (hasAnyFacultyFilter
      ? `${matchedInstructors.length} instructors`
      : survey.instructors.length > 1
        ? `${survey.instructors.length} instructors`
        : null)

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
   * a picked instructor, or the page owner while viewing the whole course.
   * Only resolves to one non-`result` person when exactly one is picked —
   * 2+ picked has no single "whose access" answer, so it falls back to the
   * course's own default result (same fallback 'all' already used). */
  const scopedFaculty = scopedInstructor
    ? [result, ...siblings].find((f) => f.facultyId === scopedInstructor.id) ?? result
    : result

  /* Score cards — this course vs program, plus prior term */
  const courseAvg = responses?.sectionScores.find((s) => s.section === 'course_content')?.avg ?? null
  /* A faculty-only template (e.g. midterm check-in) has no course questions —
   * a permanent em-dash Course Content card would be noise, so skip it. */
  const templateHasCourse = sections.length === 0 || sections.some((sec) => sectionGroupOf(sec) !== 'Faculty')
  const sectionFacultyAvg = responses?.sectionScores.find((s) => s.section === 'faculty_performance')?.avg ?? null
  /* Term average (2026-09-15 KPI requirement) — same response-weighted
   * pooling programAvgForQuestion (lib/pce-mock-data.ts) uses program-wide,
   * just filtered to surveys sharing this offering's term. The KPI tiles'
   * headline delta is term-over-term (`priorInstanceTrend`, vs `prior`), not
   * a program-avg comparison — this feeds only the "Term avg" caption text. */
  const termCourseAvg = useMemo(() => {
    const surveyIdsInTerm = new Set(MOCK_SURVEYS.filter((s) => s.term === survey.term).map((s) => s.id))
    const all = MOCK_RESPONSES.filter((r) => surveyIdsInTerm.has(r.surveyId)).flatMap((r) =>
      r.sectionScores.filter((s) => s.section === 'course_content').map((s) => s.avg),
    )
    return all.length ? all.reduce((a, b) => a + b, 0) / all.length : null
  }, [survey.term])
  const termFacultyAvg = useMemo(() => {
    const surveyIdsInTerm = new Set(MOCK_SURVEYS.filter((s) => s.term === survey.term).map((s) => s.id))
    const all = MOCK_RESPONSES.filter((r) => surveyIdsInTerm.has(r.surveyId)).flatMap((r) =>
      r.sectionScores.filter((s) => s.section === 'faculty_performance').map((s) => s.avg),
    )
    return all.length ? all.reduce((a, b) => a + b, 0) / all.length : null
  }, [survey.term])
  /* KPI-strip Faculty Performance — the whole-course blend for a PD viewer
   * (regardless of which single instructor is picked in the Faculty tab
   * below — the KPI header is shared by all three tabs, so it can't follow
   * a tab-local selection). For a NON-PD (faculty) viewer this blend would
   * leak a co-instructor's score into the number they see — the Granola
   * requirement is explicit: "faculty should see their own rating versus
   * program average, but not other faculty data" — so a faculty viewer's
   * tile is scoped to ONLY their own instructor blocks, same predicate
   * `inFacultyScope` already uses now that `facultyScope` is locked to
   * `result.facultyId` for them (see the `facultyScope` init above). */
  const kpiFacultyAvg = useMemo(() => {
    if (!qData) return sectionFacultyAvg
    const blocks = (qData.instructorBlocks ?? []).filter(
      (b) =>
        survey.instructors.some((i) => i.id === b.instructorId) &&
        (isPD || b.instructorId === result.facultyId),
    )
    const avgs = blocks.flatMap((b) => b.scores.map((q) => q.avg))
    if (avgs.length === 0) return sectionFacultyAvg
    return avgs.reduce((a, b) => a + b, 0) / avgs.length
  }, [qData, survey.instructors, sectionFacultyAvg, isPD, result.facultyId])
  /** Count of faculty evaluated (2026-09-15 KPI) — distinct instructors on
   *  this offering for a PD; locked to 1 ("you") for a non-PD viewer, same
   *  isolation reasoning as `kpiFacultyAvg` above — the count itself is
   *  harmless, but showing "2 instructors" beside a blended-looking average
   *  invites reading a colleague's score into it. */
  const facultyEvaluatedCount = isPD ? new Set(survey.instructors.map((i) => i.id)).size : 1
  /** How many KPI tiles actually render — a faculty-only or course-only
   *  template drops to 2-3 tiles, and a FIXED 4-column grid left the missing
   *  tile(s) as a blank grid track instead of the remaining tiles filling
   *  the row (Romit, 2026-09-15: "use the complete 100% width of the cards,
   *  don't leave the whitespace"). Drives the grid's column count below so
   *  every tile always stretches to fill it, whatever the count. */
  const kpiTileCount =
    (templateHasCourse && result.evalScope !== 'instructor' ? 1 : 0) +
    (result.evalScope !== 'course' ? 2 : 0) +
    1
  /** Course/Faculty range (lowest ↔ highest QUESTION average, 2026-09-15 KPI)
   *  — deliberately unscoped by `facultyScope`/`pageTab` (every instructor's
   *  questions count toward the faculty range, same "always everyone"
   *  principle as `kpiFacultyAvg` above), since the KPI strip is shared by
   *  all three tabs. */
  const kpiCourseSubjectKeys = new Set(sections.filter((s) => sectionGroupOf(s) === 'Course').map((s) => s.subjectKey))
  const courseQuestionAvgs = qData
    ? Object.entries(qData.sectionScores)
        .filter(([key]) => kpiCourseSubjectKeys.has(key))
        .flatMap(([, v]) => v.map((q) => q.avg))
    : []
  const facultyQuestionAvgs = qData
    ? (qData.instructorBlocks ?? [])
        .filter(
          (b) =>
            survey.instructors.some((i) => i.id === b.instructorId) &&
            (isPD || b.instructorId === result.facultyId),
        )
        .flatMap((b) => b.scores.map((q) => q.avg))
    : []
  const courseRange = courseQuestionAvgs.length
    ? { lo: Math.min(...courseQuestionAvgs), hi: Math.max(...courseQuestionAvgs) }
    : null
  const facultyRange = facultyQuestionAvgs.length
    ? { lo: Math.min(...facultyQuestionAvgs), hi: Math.max(...facultyQuestionAvgs) }
    : null
  const prior = survey.priorOfferings?.at(-1) ?? null
  /* Prior-instance response rate for the KPI delta (2026-09-15) —
   * `PriorOffering.responseRate` is optional and unbacked across the mock
   * dataset today (no fixture has ever set it), so the delta silently never
   * rendered anywhere. Falls back to a DETERMINISTIC estimate — same
   * synthetic-offset convention lib/pce-mock-data.ts's programAvgForQuestion
   * already uses for sparse mock data (stable per term string, not random)
   * — clamped to a plausible response-rate band, so the feature is visibly
   * exercisable. Swap this out the moment real prior response-rate data
   * lands in the fixtures; real data always wins (checked first). */
  const priorResponseRate =
    prior == null
      ? null
      : prior.responseRate ??
        (() => {
          let h = 0
          for (const c of prior.term) h = (h * 31 + c.charCodeAt(0)) | 0
          const offset = (Math.abs(h) % 11) - 5 // -5..+5
          return Math.max(40, Math.min(95, result.responseRate - offset))
        })()

  /* Per-type lifecycle — each evaluation type runs on its own clock; its
     status + collection count ride the matching score card header. */
  const evalInstances = useMemo(
    () => new Map(evaluationsFor(survey).map((e) => [e.type, e])),
    [survey],
  )
  const courseInst = evalInstances.get('course_material')
  const facultyInst = evalInstances.get('faculty_roles')

  /* Section strip rows — one per pedagogical section with question data, each
     carrying the PROGRAM average for the same section (benchmark on the viz).
     classifySection is the SAME taxonomy the old ThemeBoxplotChart used
     (SECTION_ORDER, module-level) — this is a rename, not a re-architecture. */
  const sectionRows = useMemo((): SectionRowDatum[] => {
    if (!qData) return []
    const textById = new Map<string, string>()
    for (const sec of sections) for (const q of sec.questions) textById.set(q.id, q.text)
    const classifySection = (questionId: string, fromFaculty: boolean): string =>
      classifySectionFromText(textById.get(questionId) ?? '', fromFaculty)
    type SectionedQ = { section: string; avg: number; distribution?: number[]; id: string; text: string }
    const collect = (
      data: (typeof MOCK_SURVEY_QUESTION_DATA)[number],
      allowInstructor: (id: string) => boolean,
      parts: { course: boolean; faculty: boolean } = { course: true, faculty: true },
    ): SectionedQ[] => {
      const qs: SectionedQ[] = []
      if (parts.course)
        for (const scores of Object.values(data.sectionScores))
          for (const q of scores)
            qs.push({ section: classifySection(q.questionId, false), avg: q.avg, distribution: q.distribution, id: q.questionId, text: textById.get(q.questionId) ?? q.questionId })
      if (parts.faculty)
        for (const b of data.instructorBlocks ?? []) {
          if (!allowInstructor(b.instructorId)) continue
          for (const q of b.scores)
            qs.push({ section: classifySection(q.questionId, true), avg: q.avg, distribution: q.distribution, id: q.questionId, text: textById.get(q.questionId) ?? q.questionId })
        }
      return qs
    }
    /* Scope follows the faculty selector: 'all' = whole course, else one
       instructor — and the survey's evalScope on a split offering (a Course
       survey never shows instructor questions, and vice versa). */
    const mine = collect(
      qData,
      (id) => survey.instructors.some((i) => i.id === id) && inFacultyScope(id),
      {
        course: result.evalScope !== 'instructor',
        faculty: result.evalScope !== 'course' && facultyScope !== 'course',
      },
    )
    const program = MOCK_SURVEY_QUESTION_DATA.flatMap((d) => collect(d, () => true))
    /* Per-instructor sectioned questions (scope-aware) — the benchmark panel. */
    const allowedInstructors = survey.instructors.filter((i) => inFacultyScope(i.id))
    const perInstructorSectioned = allowedInstructors.map((inst) => ({
      inst,
      qs: (qData.instructorBlocks ?? [])
        .filter((b) => b.instructorId === inst.id)
        .flatMap((b) => b.scores.map((q) => ({ section: classifySection(q.questionId, true), avg: q.avg }))),
    }))
    const rows: SectionRowDatum[] = []
    for (const title of SECTION_ORDER) {
      const qs = mine.filter((x) => x.section === title)
      if (qs.length === 0) continue
      const dist: [number, number, number, number, number] = [0, 0, 0, 0, 0]
      qs.forEach((x) => (x.distribution ?? []).forEach((n, i) => { if (i < 5) dist[i] += n }))
      const prog = program.filter((x) => x.section === title)
      const instructors = perInstructorSectioned
        .map(({ inst, qs: iqs }) => {
          const mineSection = iqs.filter((x) => x.section === title)
          if (mineSection.length === 0) return null
          return {
            id: inst.id,
            initials: inst.initials,
            name: inst.name,
            avatarUrl: inst.avatarUrl,
            role: inst.role,
            avg: mineSection.reduce((a, x) => a + x.avg, 0) / mineSection.length,
          }
        })
        .filter((x): x is NonNullable<typeof x> => x != null)
      /* Distinct contributing questions (faculty questions repeat per
         instructor block) — just the count, for "N questions" in the row. */
      const questionCount = new Set(qs.map((x) => x.id)).size
      rows.push({
        id: title,
        title,
        avg: qs.reduce((a, x) => a + x.avg, 0) / qs.length,
        questions: questionCount,
        programAvg: prog.length ? prog.reduce((a, x) => a + x.avg, 0) / prog.length : null,
        dist,
        instructors,
      })
    }
    return rows
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qData, sections, inCollection, facultyScope, survey.instructors, result.facultyId])

  /* Collapsed-section previews — the closed shells still say something.
     Course-only scope excludes faculty_performance-keyed section scores too
     (a TA/lab section with no instructor block falls back to a section-level
     score — inFacultyScope alone wouldn't catch that). */
  const facultySubjectKeys = new Set(
    sections.filter((s) => sectionGroupOf(s) === 'Faculty').map((s) => s.subjectKey),
  )
  const allQuestionScores = qData
    ? [
        ...Object.entries(qData.sectionScores)
          .filter(([key]) => !(facultyScope === 'course' && facultySubjectKeys.has(key)))
          .flatMap(([, v]) => v),
        ...(qData.instructorBlocks ?? [])
          .filter(
            (b) =>
              survey.instructors.some((i) => i.id === b.instructorId) &&
              inFacultyScope(b.instructorId),
          )
          .flatMap((b) => b.scores),
      ]
    : []
  /* Question breakdown groups — Course / Faculty via the section classifier
     (roleSetId OR subjectKey). */
  const courseSections = result.evalScope === 'instructor' ? [] : sections.filter((s) => sectionGroupOf(s) === 'Course')
  /* Course-only scope (the "Course" pill) hides Faculty questions the same
     way a split "Course evaluation" survey does — it's a view, not a
     template change, so it reuses the same empty-array gate. */
  const facultySections =
    result.evalScope === 'course' || facultyScope === 'course'
      ? []
      : sections.filter((s) => sectionGroupOf(s) === 'Faculty')
  const scoreFor = (subjectKey: string, questionId: string, faculty: boolean) => {
    if (!qData) return undefined
    if (faculty) {
      /* Scope-aware: a picked faculty shows their block; 'all' averages every
       * in-scope instructor's answer to this question (role scope included). */
      const allowed = (id: string) =>
        survey.instructors.some((i) => i.id === id) && inFacultyScope(id)
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
  /* course_director ("Overall Experience") comments have no per-instructor
     attribution — they fold into Faculty as unattributed, never into a named
     instructor's group (that would misattribute program-level feedback). */
  const generalComments = allComments.filter((c) => c.section === 'course_director')
  const facultyComments = allComments.filter((c) => c.section === 'faculty_performance')
  /* Subject attribution — explicit facultyId, else the sole instructor. The
     subject is who the comment is ABOUT; authorship stays anonymous. */
  const commentSubjectId = (c: IndexedComment) => c.facultyId ?? soleInstructor?.id ?? null
  /* Comment groups follow the SAME scope predicate as every score surface —
     a page whose cards read "Course Coordinator" while the comments still
     list "About <the guest lecturer>" is two contradictory scope signals in
     one view (Romit 2026-07-17: every faculty-scoped surface must say whose
     data it is — and then actually be that data). */
  const facultyCommentGroups = survey.instructors
    .filter((i) => inFacultyScope(i.id))
    .map((i) => ({ instructor: i, comments: facultyComments.filter((c) => commentSubjectId(c) === i.id) }))
    .filter((g) => g.comments.length > 0)
  const unattributedFacultyComments =
    facultyScope === 'course'
      ? []
      : [...facultyComments.filter((c) => !survey.instructors.some((i) => i.id === commentSubjectId(c))), ...generalComments]
  /* The card's own rule: counts, chips, themes and lists draw from ONE pool so
     no two numbers disagree. With comment groups scope-filtered above, the pool
     must scope the same way — course/general comments and unattributed faculty
     comments (no role to match) always stay in, UNLESS the view itself is
     scoped to Course, which excludes every faculty_performance comment
     outright (an unattributed one has no role to match against 'course'). */
  const inCommentScope = (c: IndexedComment) => {
    if (c.section !== 'faculty_performance') return true
    if (facultyScope === 'course') return false
    const subject = commentSubjectId(c)
    const attributed = subject != null && survey.instructors.some((i) => i.id === subject)
    return !attributed || inFacultyScope(subject as string)
  }
  const scopedComments = allComments.filter(inCommentScope)
  const visibleComments = scopedComments.filter((c) => !hiddenIdx.includes(c.index))
  /* What THIS viewer can see — moderators also see hidden comments. Card
     description, filter counts and section lists must all draw from this one
     pool so no two numbers on the card disagree. (Themes/recommendations stay
     on visibleComments: they describe what faculty will read.) */
  const viewerComments = isPD ? scopedComments : visibleComments
  const commentTypeCounts = {
    course: viewerComments.filter((c) => c.section === 'course_content').length,
    faculty: viewerComments.filter((c) => c.section === 'faculty_performance' || c.section === 'course_director').length,
  }
  const aiThemes = deriveThemes(visibleComments)
  const concernThemes = aiThemes.filter((t) => t.sentiment === 'concern').sort((a, b) => b.occurrences - a.occurrences)
  /* Highlights = positive-sentiment themes, ranked by reach (2026-09-15
   * Themes requirement — Highlights/Scope for improvement replace the old
   * owner-only "Top N recommendations" box). */
  const highlightThemes = aiThemes.filter((t) => t.sentiment === 'positive').sort((a, b) => b.occurrences - a.occurrences)
  /** Contributing comments per theme label — same keyword match deriveThemes()
   *  uses internally (THEME_PATTERNS), re-run here because deriveThemes()
   *  only returns aggregate counts, not which comments matched. Drives the
   *  Highlights/Scope-for-improvement drawers' click-through. */
  const commentsForTheme = (label: string): IndexedComment[] => {
    const pattern = THEME_PATTERNS.find((t) => t.label === label)
    if (!pattern) return []
    return viewerComments.filter((c) => pattern.keywords.some((kw) => c.text.toLowerCase().includes(kw)))
  }
  /* Collapsed-state preview — the card says something before it's expanded
     (Hotjar's sentiment-quote row): per-type counts + one representative
     quote, a constructive one first since that's the actionable read. */
  const previewQuote =
    viewerComments.find((c) => c.sentiment === 'concern') ?? viewerComments[0] ?? null

  const hiddenCount = hiddenIdx.length

  /* Anchor navigation — section + per-question anchors (Romit 2026-07-09).
     The two collapsed shells are CONTROLLED so an anchor inside them can
     expand first, then scroll on the next frames. */
  const [qbOpen, setQbOpen] = useState(false)
  const [qualOpen, setQualOpen] = useState(false)
  /** Combined-report print in flight (`printFullReport`) — reveals the
   *  force-mounted Overview chart alongside whichever tab is active, so the
   *  KPI strip + Overview + Course/Faculty content all land in one PDF. */
  const [isPrintingFull, setIsPrintingFull] = useState(false)
  /* Section-wise distribution's own accordion open-state, lifted here (not
   * local to SectionBoxplotChart) so "Export as PDF" can force every section
   * open before printing — a closed AccordionContent is fully unmounted by
   * Radix, not just visually hidden, so print CSS alone can't reveal it. */
  const [openSections, setOpenSections] = useState<string[]>([])
  /* Question Breakdown's per-question rating-distribution accordion — same
   * lifted-for-print reasoning as openSections. */
  const [openQuestions, setOpenQuestions] = useState<string[]>([])
  /* Navigator chrome — the rail collapses to a slim icon strip (Craft TOC
     pattern) so the content column can reclaim the width on demand; question
     links fold per evaluation-type group (Udemy course-content pattern)
     instead of the old always-open nested scrollbox. */
  const [railOpen, setRailOpen] = useState(true)
  const [railGroupsOpen, setRailGroupsOpen] = useState<Record<string, boolean>>({})
  /* Scroll-spy — highlight the section band under the sticky shell. Entries
     only report crossings, so keep the last known section when none reports. */
  const [activeAnchor, setActiveAnchor] = useState<string>('scores')
  useEffect(() => {
    const ids = ['scores', 'sections', 'questions', 'comments', 'feedback-loop']
    const els = ids
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => !!el)
    if (els.length === 0) return
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
        if (visible[0]) setActiveAnchor(visible[0].target.id)
      },
      /* Top inset = sticky shell height; bottom bias keeps the highlight on
         the section whose heading the reader just scrolled past. */
      { rootMargin: '-64px 0px -55% 0px' },
    )
    els.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
    /* showFeedbackLoop is declared below this hook — its inputs (ownerInsights,
       isPD, prior) stand in as deps so the observed set stays current. */
  }, [inCollection, sectionRows.length, qData, sections.length, allComments.length, ownerInsights, isPD, prior])
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
  /* Export as PDF (2026-08-26 transcript: "I should be able to export this
   * course section... as PDF") — house window.print() pattern, zero deps
   * (same as chart-card-actions.tsx's ChartExportMenu). A closed Accordion/
   * Collapsible section is fully UNMOUNTED by Radix, not just hidden, so CSS
   * alone can't reveal it for print — force every section open via lifted
   * state first, print, then restore exactly what the viewer had open. */
  function printCurrentView() {
    const prevSections = openSections
    const prevQuestions = openQuestions
    const prevQb = qbOpen
    const prevQual = qualOpen
    const prevTab = pageTab
    if (pageTab === 'reports' || pageTab === 'mylogs') setPageTab('faculty')
    setOpenSections(sectionRows.map((s) => s.id))
    setOpenQuestions(breakdownRows.filter((r) => r.kind === 'rated').map((r) => r.id))
    setQbOpen(true)
    setQualOpen(true)
    const restore = () => {
      setOpenSections(prevSections)
      setOpenQuestions(prevQuestions)
      setQbOpen(prevQb)
      setQualOpen(prevQual)
      setPageTabRaw(prevTab)
      window.removeEventListener('afterprint', restore)
    }
    window.addEventListener('afterprint', restore)
    window.setTimeout(() => window.print(), 350)
  }
  /* Combined "KPIs + all tabs" export (2026-09-15 page-level Actions
   * requirement, distinct from `printCurrentView`'s tab-scoped export used
   * by the Course/Faculty-local Export PDF buttons) — the header ⋯ menu's
   * "Export as PDF" and the Reports tab's "Full Survey Report" card both
   * mean the COMPLETE picture, not whichever tab happens to be open.
   *
   * Reusing `printCurrentView`'s force-open-then-print approach for BOTH the
   * Course and Faculty tab bodies at once isn't safe here: they render the
   * SAME `overviewContent` tree, whose section/question ids come straight
   * from data (e.g. a section titled "Teaching Effectiveness" can appear in
   * both the course-only view and the faculty view) — mounting both
   * simultaneously would duplicate `id` attributes in the DOM, which is
   * invalid HTML and breaks the very `getElementById` anchors `goTo` relies
   * on. Since the Faculty tab's own content ALREADY includes the course
   * content alongside it whenever `facultyScope` isn't narrowed to
   * 'course' (Question Breakdown's Course/Faculty group bands both render
   * together — see `breakdownRows`), the combined report is: the Overview
   * chart (force-mounted, no repeating ids of its own — safe to show
   * alongside) stacked above the Faculty tab's un-narrowed view, with every
   * accordion open. On a co-taught offering this covers the
   * CURRENTLY-SELECTED instructor's faculty content, not every instructor
   * stacked in one document — printing every instructor's full breakdown
   * in one pass would need the same id-namespacing work, not attempted
   * here. */
  function printFullReport() {
    const prevSections = openSections
    const prevQuestions = openQuestions
    const prevQb = qbOpen
    const prevQual = qualOpen
    const prevTab = pageTab
    const prevScope = facultyScope
    setIsPrintingFull(true)
    if (facultyScope === 'course') {
      setFacultyScope(isPD ? survey.instructors[0]?.id ?? 'all' : result.facultyId)
    }
    setPageTab('faculty')
    setOpenSections(sectionRows.map((s) => s.id))
    setOpenQuestions(breakdownRows.filter((r) => r.kind === 'rated').map((r) => r.id))
    setQbOpen(true)
    setQualOpen(true)
    const restore = () => {
      setIsPrintingFull(false)
      setOpenSections(prevSections)
      setOpenQuestions(prevQuestions)
      setQbOpen(prevQb)
      setQualOpen(prevQual)
      setFacultyScope(prevScope)
      setPageTabRaw(prevTab)
      window.removeEventListener('afterprint', restore)
    }
    window.addEventListener('afterprint', restore)
    window.setTimeout(() => window.print(), 350)
  }
  /* Rail index mirrors the table's provenance: questions nested under their
     evaluation-type group, numbering restarting per group. */
  const questionIndexGroups = useMemo(
    () =>
      [
        { key: 'Course' as const, sections: courseSections },
        { key: 'Faculty' as const, sections: facultySections },
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
          const sectionTitle = classifySectionFromText(q.text, group.faculty)
          if (q.answerType === 'free_text') {
            out.push({
              id: q.id,
              label: q.text,
              group: group.label,
              sectionTitle,
              kind: 'freeText',
            })
            continue
          }
          const score = scoreFor(section.subjectKey, q.id, group.faculty)
          if (!score) continue
          const counts = score.distribution ?? [0, 0, 0, 0, 0]
          /* Faculty rows carry their IDENTITIES as plot markers — the scored
             instructor's photo sits at their score (Romit 2026-07-18: the name
             is part of the mark, no printed number column). 1–3 identities
             render; beyond that the scope selector is the per-person path.
             Section-scored faculty rows (labs/TAs without instructor blocks)
             have no nameable identity and keep the course dot. */
          let perFaculty: BreakdownRow['perFaculty']
          /* Identity markers render for ≤3 IN-SCOPE people — scoping to a role
             with two holders earns the photo markers even on a 5-person course. */
          if (group.faculty && (facultyScope !== 'all' || matchedInstructors.length <= 3)) {
            const split = (qData.instructorBlocks ?? []).flatMap((b) => {
              const inst = survey.instructors.find(
                (i) => i.id === b.instructorId && inFacultyScope(i.id),
              )
              const hit = inst ? b.scores.find((x) => x.questionId === q.id) : undefined
              if (!inst || !hit) return []
              const c = hit.distribution ?? [0, 0, 0, 0, 0]
              return [{
                facultyId: inst.id,
                name: inst.name,
                initials: inst.initials,
                avatarUrl: inst.avatarUrl,
                role: inst.role,
                avg: hit.avg,
                counts: c,
                total: c.reduce((a, b) => a + b, 0),
              }]
            })
            if (split.length > 0) perFaculty = split
          }
          out.push({
            id: q.id,
            label: q.text,
            group: group.label,
            sectionTitle,
            kind: 'rated',
            avg: score.avg,
            median: medianFromDistribution(counts),
            programAvg: programAvgForQuestion(q.id),
            termAvg: termAvgForQuestion(q.id, survey.term),
            range: distRange(counts),
            counts,
            total: counts.reduce((a, b) => a + b, 0),
            perFaculty,
          })
        }
      }
    }
    return out
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qData, courseSections, facultySections, result.facultyId, inCollection, facultyScope, survey.instructors])

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
          ? `${matchedInstructors.length} instructors${
              matchedInstructors.length <= 3
                ? ''
                : isPD
                  ? ', use the instructor selector above for per-person scores'
                  : ''
            }`
          : undefined),
      anchorId: 'group-faculty',
      contextLine: `Faculty evaluation${scopedFacultyName ? ` · ${scopedFacultyName}` : ''}`,
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

  const facultyScopeSelector = (
    <FacultyScopeSelector
      instructors={inCollection ? liveFacultyRows : [result, ...siblings]}
      scope={facultyScope}
      toggleFacultyId={toggleFacultyId}
      isPD={isPD}
      roleFor={(facultyId) => EVAL_FACULTY_ROLES.find((r) => r.id === evalRoleFor(facultyId))?.label}
    />
  )

  const overviewContent = (
    <>
              {/* Sub-xl has no rail — a compact jump menu keeps the section
                  anchors reachable. */}
              <div className="xl:hidden mb-4 flex justify-end">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">On this page</Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onSelect={() => goTo('scores')}>Themes</DropdownMenuItem>
                    {sectionRows.length > 0 && (
                      <DropdownMenuItem onSelect={() => goTo('sections')}>Section distribution</DropdownMenuItem>
                    )}
                    {qData && sections.length > 0 && (
                      <DropdownMenuItem onSelect={() => goTo('questions', 'questions')}>
                        Question breakdown
                      </DropdownMenuItem>
                    )}
                    {allComments.length > 0 && (
                      <DropdownMenuItem onSelect={() => goTo('comments', 'comments')}>
                        Student comments
                      </DropdownMenuItem>
                    )}
                    {showFeedbackLoop && (
                      <DropdownMenuItem onSelect={() => goTo('feedback-loop')}>Feedback loop</DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <div
                className={`grid grid-cols-1 gap-6 items-start ${
                  railOpen
                    ? 'xl:grid-cols-[minmax(0,1fr)_260px]'
                    : 'xl:grid-cols-[minmax(0,1fr)_2.25rem]'
                }`}
              >
              <div className="flex flex-col gap-4 min-w-0">

              <div id="scores" className="scroll-mt-16 flex flex-col gap-4">
                {/* Themes — comment-only for now (2026-09-15 spec notes
                    quantitative themes as a future enhancement). Two cards,
                    each 2–5 clustered areas with a contributing-comment count
                    and click-through — replaces the old owner-only "Top N
                    recommendations" box. */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <ThemeHighlightCard kind="highlight" themes={highlightThemes} matchedFor={commentsForTheme} />
                  <ThemeHighlightCard kind="improvement" themes={concernThemes} matchedFor={commentsForTheme} />
                </div>
              </div>

              <div id="sections" className="scroll-mt-16">
                <SectionBoxplotChart
                  sections={sectionRows}
                  openSections={openSections}
                  onOpenSectionsChange={setOpenSections}
                  partial={inCollection}
                  courseOnly={facultyScope === 'course'}
                />
              </div>

              {/* Question breakdown — collapsed by default (spec); controlled
                  so the anchor rail can expand it before scrolling. */}
              {qData && sections.length > 0 && (
                <div id="questions" className="scroll-mt-16">
                <Collapsible open={qbOpen} onOpenChange={setQbOpen}>
                  <Card>
                    {/* Radix trigger renders its own button element — no raw button in product code */}
                    <CollapsibleTrigger className="w-full text-left focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 rounded-t-lg group">
                      <CardHeader>
                        <CardTitle className="text-sm" aria-level={2}>Question breakdown</CardTitle>
                        <CardDescription>
                          {allQuestionScores.length} rated question{allQuestionScores.length !== 1 ? 's' : ''}
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
                        <QuestionBreakdownTable
                          rows={breakdownRows}
                          surveyId={survey.id}
                          groupMeta={groupMeta}
                          canModerate={isPD}
                          openQuestions={openQuestions}
                          onOpenQuestionsChange={setOpenQuestions}
                        />
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
                    {/* Radix trigger renders its own button element — no raw button in product code */}
                    <CollapsibleTrigger className="w-full text-left focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 rounded-t-lg group">
                      <CardHeader>
                        <CardTitle className="text-sm" aria-level={2}>Qualitative feedback</CardTitle>
                        <CardDescription>
                          {viewerComments.length} student comment{viewerComments.length !== 1 ? 's' : ''}
                          {commentTypeCounts.course > 0 ? ` · ${commentTypeCounts.course} course` : ''}
                          {commentTypeCounts.faculty > 0 ? ` · ${commentTypeCounts.faculty} faculty` : ''}
                          {facultyScope === 'course' ? ' · course only' : ''}
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
                            Anonymized. Individual authorship cannot be identified.
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
                            person={{ name: g.instructor.name, initials: g.instructor.initials, avatarUrl: g.instructor.avatarUrl }}
                            comments={g.comments}
                            hiddenIdx={hiddenIdx}
                            canModerate={isPD}
                            filter={qualFilter}
                          />
                        ))}
                        <CommentList
                          title="Faculty evaluation"
                          icon={EVALUATION_TYPE_ICON.faculty_roles}
                          comments={unattributedFacultyComments}
                          hiddenIdx={hiddenIdx}
                          canModerate={isPD}
                          filter={qualFilter}
                        />
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

              {/* ── Side column — collapsible "On this page" navigator. DS
                    OutlineTree family (adoption verdict: IMPORT); scroll-spy
                    active row; question links folded per evaluation-type
                    group instead of the old always-open nested scrollbox.
                    Collapsed, the strip hands its width back to the content
                    column. ── */}
              <div className="hidden xl:flex flex-col sticky top-16 self-start w-full min-w-0">
                {railOpen ? (
                  <nav aria-label="On this page" className="flex w-full min-w-0 flex-col gap-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-medium text-muted-foreground">On this page</p>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            aria-label="Collapse the page navigator"
                            aria-expanded="true"
                            onClick={() => setRailOpen(false)}
                          >
                            <i className="fa-light fa-table-columns" aria-hidden="true" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="left">Collapse</TooltipContent>
                      </Tooltip>
                    </div>
                    <OutlineTreeMenu className="gap-0.5">
                      <OutlineTreeMenuItem>
                        <RailLink
                          label="Themes"
                          active={activeAnchor === 'scores'}
                          onGo={() => goTo('scores')}
                        />
                      </OutlineTreeMenuItem>
                      {sectionRows.length > 0 && (
                        <OutlineTreeMenuItem>
                          <RailLink label="Section distribution" active={activeAnchor === 'sections'} onGo={() => goTo('sections')} />
                        </OutlineTreeMenuItem>
                      )}
                      {qData && sections.length > 0 && (
                        /* before:hidden kills the MenuItem's built-in branch
                           guide — it spans the whole item (566px) and cuts
                           through the group chevrons; the per-sub inset
                           border is the only guide we want (Romit round 8). */
                        <OutlineTreeMenuItem className="before:hidden">
                          <RailLink
                            label="Question breakdown"
                            active={activeAnchor === 'questions'}
                            onGo={() => goTo('questions', 'questions')}
                          />
                          {questionIndexGroups.map((g) => {
                            const label =
                              g.key === 'Faculty' && scopedFacultyName
                                ? `Faculty evaluation · ${scopedFacultyName}`
                                : groupMeta[g.key]?.label ?? g.key
                            const open = !!railGroupsOpen[g.key]
                            return (
                              <Collapsible
                                key={g.key}
                                open={open}
                                onOpenChange={(o) => setRailGroupsOpen((prev) => ({ ...prev, [g.key]: o }))}
                                className="group/collapsible"
                              >
                                <div className="flex items-center">
                                  <CollapsibleTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon-sm"
                                      className="size-6 shrink-0"
                                      aria-label={`${open ? 'Hide' : 'Show'} ${label} question links`}
                                    >
                                      <i
                                        className="fa-light fa-chevron-right text-xs transition-transform group-data-[state=open]/collapsible:rotate-90"
                                        aria-hidden="true"
                                      />
                                    </Button>
                                  </CollapsibleTrigger>
                                  <RailLink
                                    label={label}
                                    count={g.items.length}
                                    onGo={() => goTo(groupMeta[g.key]?.anchorId ?? 'questions', 'questions')}
                                  />
                                </div>
                                {/* inset layout owns the guide + ps-6 indent —
                                    chevronRail gave sub-rows zero indent and a
                                    guide cutting through text (round-5 fix). */}
                                <CollapsibleContent>
                                  <OutlineTreeSub surface="panel" guideLayout="inset" className="gap-0.5 py-0 ms-3">
                                    {g.items.map((q, i) => (
                                      <OutlineTreeSubItem key={q.id}>
                                        <RailLink
                                          label={`${i + 1}. ${q.label}`}
                                          title={q.label}
                                          sub
                                          onGo={() => goTo(`question-${q.id}`, 'questions')}
                                        />
                                      </OutlineTreeSubItem>
                                    ))}
                                  </OutlineTreeSub>
                                </CollapsibleContent>
                              </Collapsible>
                            )
                          })}
                        </OutlineTreeMenuItem>
                      )}
                      {allComments.length > 0 && (
                        <OutlineTreeMenuItem>
                          <RailLink
                            label="Student comments"
                            active={activeAnchor === 'comments'}
                            onGo={() => goTo('comments', 'comments')}
                          />
                        </OutlineTreeMenuItem>
                      )}
                      {showFeedbackLoop && (
                        <OutlineTreeMenuItem>
                          <RailLink
                            label="Feedback loop"
                            active={activeAnchor === 'feedback-loop'}
                            onGo={() => goTo('feedback-loop')}
                          />
                        </OutlineTreeMenuItem>
                      )}
                    </OutlineTreeMenu>
                  </nav>
                ) : (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label="Expand the page navigator"
                        aria-expanded="false"
                        onClick={() => setRailOpen(true)}
                      >
                        <i className="fa-light fa-table-columns" aria-hidden="true" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="left">On this page</TooltipContent>
                  </Tooltip>
                )}
              </div>
              </div>
    </>
  )

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
              {`${result.courseCode} · ${result.courseName}`}
            </h1>
            {/* Global status badge REMOVED here (Vishal, 2026-08-25 sync: "since
                we have aspects for each aspect we can show whether it is
                completed or not ... at the global level we can remove it
                because it's confusing until the deep dive") — a course
                offering with multiple aspects (course content + each
                faculty's survey) can have a DIFFERENT status per aspect, so
                one blended badge here was misleading. Per-aspect status still
                shows correctly on each ScoreCard below (courseInst/facultyInst
                statusBadge props) — that's the only place status belongs now. */}
          </span>
        }
        subtitle={
          /* Cohort + course type were in the data but never on the page —
             Aarti's atomic evaluation unit is course × term × cohort. Eval
             window (open–close) added same sync: "what was the start date,
             what was the end date, are we capturing it somewhere?" — it
             wasn't shown anywhere on this page. */
          `${result.term}${result.academicYear ? ` · AY ${result.academicYear}` : ''} · ${result.program}${survey.cohort ? ` · ${survey.cohort}` : ''}${survey.courseType ? ` · ${survey.courseType[0].toUpperCase()}${survey.courseType.slice(1)}` : ''}${survey.openDate ? ` · Eval window ${survey.openDate} – ${survey.deadline}` : ''}`
        }
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
                      <i className="fa-light fa-link" aria-hidden="true" />
                      {linkCopied ? 'Link copied' : 'Copy survey link'}
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href={`/surveys/${survey.id}/preview`}>
                        <i className="fa-light fa-file-magnifying-glass" aria-hidden="true" />
                        Preview form
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={printFullReport}>
                      <i className="fa-light fa-file-arrow-down" aria-hidden="true" />
                      Export as PDF
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            )}
            {!inCollection && (() => {
              /* ONE visible action + ⋯ (Romit 2026-07-18: "tuck in some of
                 the options inside more"), primary now STATE-dependent
                 (2026-08-26 transcript: "if the results are already
                 available, view longitudinal insights is one primary
                 action... if the survey needs to be published to faculty,
                 then publish to faculty would be the primary action" — a
                 real bug fix, not just a copy change: this used to show
                 "Preview form" as primary even when results were already
                 available). "Preview form" moves into ⋯ UNCONDITIONALLY in
                 both states — it's never the headline action, only ever a
                 secondary one. Non-PD viewers have no menu and keep Preview
                 form as their one visible action (both other actions are
                 PD-only concepts). */
              const showEnable = isPD && !scopedFaculty.releasedToFaculty
              return (
              <>
                {showEnable ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      onRelease()
                      setReleaseSuccess(true)
                    }}
                  >
                    {scopedInstructor
                      ? `Publish to Faculty · ${scopedFaculty.facultyName}`
                      : 'Publish to Faculty'}
                  </Button>
                ) : isPD ? (
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/analytics?tab=course&courseCode=${encodeURIComponent(result.courseCode)}`}>
                      View Longitudinal Insights
                    </Link>
                  </Button>
                ) : (
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/surveys/${survey.id}/preview`}>Preview form</Link>
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
                      <DropdownMenuItem asChild>
                        <Link href={`/surveys/${survey.id}/preview`}>
                          <i className="fa-light fa-file-magnifying-glass" aria-hidden="true" />
                          Preview form
                        </Link>
                      </DropdownMenuItem>
                      {/* Already the primary button when results are
                          available — no duplicate entry in that state.
                          PD-only: /analytics is an ungated admin surface with
                          program-wide data — faculty must not land there
                          (scope flag 2026-07-16). */}
                      {showEnable && (
                        <DropdownMenuItem asChild>
                          <Link href={`/analytics?tab=course&courseCode=${encodeURIComponent(result.courseCode)}`}>
                            <i className="fa-light fa-chart-line" aria-hidden="true" />
                            View Longitudinal Insights
                          </Link>
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem onSelect={printFullReport}>
                        <i className="fa-light fa-file-arrow-down" aria-hidden="true" />
                        Export as PDF
                      </DropdownMenuItem>
                      <DropdownMenuItem onSelect={copySurveyLink}>
                        <i className="fa-light fa-link" aria-hidden="true" />
                        {linkCopied ? 'Link copied' : 'Copy survey link'}
                      </DropdownMenuItem>
                      <DropdownMenuItem onSelect={() => setRemindOpen(true)}>
                        <i className="fa-light fa-bell" aria-hidden="true" />
                        Send reminder
                      </DropdownMenuItem>
                      <DropdownMenuItem onSelect={() => setExtendOpen(true)}>
                        <i className="fa-light fa-calendar-plus" aria-hidden="true" />
                        Extend close date
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </>
              )
            })()}
          </div>
        }
      />

      <div className="flex-1 px-7 py-4">
        <div className="flex flex-col gap-4">
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
              facultyAvg={kpiFacultyAvg}
              facultyLabel={facultyChipLabel}
              hasCourse={templateHasCourse && result.evalScope !== 'instructor'}
              onGo={(anchorId) => goTo(anchorId, 'questions')}
            />
          )}

          {inCollection && (
            <p className="text-xs text-muted-foreground">
              Early signal — averages from the {result.responses} response{result.responses !== 1 ? 's' : ''} so far. Expect movement until close.
            </p>
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

          {/* KPI strip — hoisted above the tabs (2026-09-15: was previously
              split across Course/Faculty tab bodies, one card hidden per
              tab); now a single always-visible summary shared by all three
              tabs, so it can't follow the Faculty tab's own instructor pick —
              Course/Faculty averages here are always the whole-offering
              blend (kpiFacultyAvg, not the scope-filtered facultyAvg used
              inside the Faculty tab body below).
              Built on `ChartCard variant="kpi-chart"` — the SAME compact-KPI
              primitive + grid this session already established for
              Analytics Overview (`analytics-overview-panel.tsx:473-487`) and
              Dashboard (matched 2026-09-15, commits 61115536/793c01fe/
              88042ef1: 26px value, 11.5px title, `Card size="sm"`) — not the
              old bespoke `ScoreCard`/`ScoreTile`, which renders 2–3x taller
              and was exactly the "KPI card is too big" pattern those fixes
              existed to kill. One line per tile — value, term-over-term
              delta, one caption — matching analytics-2's reference tiles;
              Range/Term-avg fold into that one caption line rather than a
              second stacked card. `hideAskLeo` on every ChartCard on this
              page (2026-09-15, Romit: "remove ask leo buttons from cards")
              — supersedes this file's former documented exception to
              Analytics' hideAskLeo (see charts-core.tsx). */}
          {/* sr-only h2 — kpi-chart's CardTitle renders as h3 (DS Card
              anatomy); without an intervening h2 the doc heading order jumps
              h1 -> h3 (axe heading-order, caught live: "Course Content"
              flagged as an invalid skip). */}
          <h2 className="sr-only">Key metrics</h2>
          <div
            className={`grid grid-cols-1 gap-4 sm:grid-cols-2 ${kpiTileCount >= 4 ? 'lg:grid-cols-4' : kpiTileCount === 3 ? 'lg:grid-cols-3' : 'lg:grid-cols-2'}`}
          >
            {templateHasCourse && result.evalScope !== 'instructor' && (
              <ChartCard
                variant="kpi-chart"
                title="Course Content"
                hideAskLeo
                headerAction={courseInst ? <SurveyStatusBadgeOS status={courseInst.status} compact /> : undefined}
                miniMetrics={[
                  {
                    value: courseAvg != null ? courseAvg.toFixed(2) : '—',
                    label: `Range ${courseRange ? `${courseRange.lo.toFixed(1)}–${courseRange.hi.toFixed(1)}` : '—'} · Term avg ${termCourseAvg != null ? termCourseAvg.toFixed(2) : '—'}`,
                    ...priorInstanceTrend(courseAvg, prior?.courseAvg ?? null),
                    trendPolarity: 'higher_is_better',
                  },
                ]}
              >
                {null}
              </ChartCard>
            )}
            {result.evalScope !== 'course' && (
              <ChartCard
                variant="kpi-chart"
                title="Faculty Performance"
                hideAskLeo
                headerAction={facultyInst ? <SurveyStatusBadgeOS status={facultyInst.status} compact /> : undefined}
                miniMetrics={[
                  {
                    value: kpiFacultyAvg != null ? kpiFacultyAvg.toFixed(2) : '—',
                    label: `Range ${facultyRange ? `${facultyRange.lo.toFixed(1)}–${facultyRange.hi.toFixed(1)}` : '—'} · Term avg ${termFacultyAvg != null ? termFacultyAvg.toFixed(2) : '—'}`,
                    ...priorInstanceTrend(kpiFacultyAvg, prior?.facultyAvg ?? null),
                    trendPolarity: 'higher_is_better',
                  },
                ]}
              >
                {null}
              </ChartCard>
            )}
            <ChartCard
              variant="kpi-chart"
              title="Response Rate"
              hideAskLeo
              miniMetrics={[
                {
                  value: `${result.responseRate}%`,
                  label:
                    priorResponseRate != null
                      ? `vs ${prior!.term}`
                      : `${result.responses} of ${result.enrolled} responded`,
                  ...(priorResponseRate != null
                    ? (() => {
                        const d = result.responseRate - priorResponseRate
                        const trend: 'up' | 'down' | 'neutral' = d > 0 ? 'up' : d < 0 ? 'down' : 'neutral'
                        return { trendDelta: `${d >= 0 ? '+' : ''}${d}pp`, trend }
                      })()
                    : { trend: 'neutral' as const }),
                  trendPolarity: 'higher_is_better',
                },
              ]}
            >
              {null}
            </ChartCard>
            {result.evalScope !== 'course' && (
              <ChartCard
                variant="kpi-chart"
                title="Faculty Evaluated"
                hideAskLeo
                miniMetrics={[
                  {
                    value: String(facultyEvaluatedCount),
                    label: facultyEvaluatedCount === 1 ? '1 instructor on this offering' : `${facultyEvaluatedCount} instructors on this offering`,
                    trend: 'neutral',
                  },
                ]}
              >
                {null}
              </ChartCard>
            )}
          </div>

          <Tabs value={pageTab} onValueChange={setPageTab} className="flex flex-col gap-4">
            {/* The faculty filter lives INSIDE the Faculty tab's own content,
                not sharing a row with the main Overview/Course/Faculty/
                Reports/My Logs TabsList (Romit: "the tabs were supposed to
                be inside the faculty tab, not beside the main tabs") — it's
                a Faculty-tab concept (WHICH instructor), not a page-level
                nav control. */}
            <div className="flex items-center justify-between gap-3 border-b border-border">
              <TabsList variant="line">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                {templateHasCourse && result.evalScope !== 'instructor' && (
                  <TabsTrigger value="course">Course</TabsTrigger>
                )}
                <TabsTrigger value="faculty">Faculty</TabsTrigger>
                <TabsTrigger value="reports">Reports</TabsTrigger>
                {isOwner && <TabsTrigger value="mylogs">My Logs</TabsTrigger>}
              </TabsList>
              {/* Export PDF / Excel — beside the tab row, not inside the tab
                  content (Romit, 2026-09-15), visible only where there's
                  something to export (Course/Faculty; Reports has its own
                  dedicated export cards, Overview/My Logs have none). PDF
                  reuses the header ⋯ menu's tab-scoped flow; "Export Excel"
                  is a REAL client-side download (see downloadResultsExcel) —
                  not the shared ExportDrawer, which has no file-generation
                  logic anywhere in this codebase. */}
              {(pageTab === 'course' || pageTab === 'faculty') && (
                <div className="flex shrink-0 items-center gap-2 pb-2">
                  <Button variant="outline" size="sm" onClick={printCurrentView}>
                    <i className="fa-light fa-file-arrow-down" aria-hidden="true" />
                    Export PDF
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => downloadResultsExcel(result.courseCode, sectionRows, breakdownRows)}
                  >
                    <i className="fa-light fa-file-export" aria-hidden="true" />
                    Export Excel
                  </Button>
                </div>
              )}
            </div>

            {/* ── Overview (2026-09-15: reinstated) — forceMount + `hidden`
                (not Radix's own conditional unmount) so `printFullReport`
                can reveal it alongside whichever tab is active without a
                duplicate-id risk (ResponseCollectionTrend has no
                data-driven repeating ids, unlike Course/Faculty's shared
                overviewContent — see printFullReport's own comment). ── */}
            <TabsContent value="overview" className="m-0" forceMount hidden={pageTab !== 'overview' && !isPrintingFull}>
              <ResponseCollectionTrend survey={survey} rate={result.responseRate} />
            </TabsContent>

            {/* ── Course ── shares the same content as Faculty (both render
                `overviewContent`); the content itself already conditionally
                shows/hides Course-Content vs Faculty-Performance regions
                based on `facultyScope`, which `pageTab` keeps in sync with. ── */}
            <TabsContent value="course" className="m-0 flex flex-col gap-4">
              {overviewContent}
            </TabsContent>

            {/* ── Faculty ── one chip per instructor, no "All faculty" — each
                chip shows the same content shape as Course, scoped to that
                one person (2026-09-15 spec: "each chip: same as course"). ── */}
            <TabsContent value="faculty" className="m-0 flex flex-col gap-4">
              <div className="shrink-0">{facultyScopeSelector}</div>
              {overviewContent}
            </TabsContent>

            {/* ── Reports ── */}
            <TabsContent value="reports" className="m-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm" aria-level={2}>Full Survey Report</CardTitle>
                    <CardDescription>
                      {result.evalScope ? `${EVAL_SCOPE_LABEL[result.evalScope]} only. ` : ''}
                      Complete results including scores, question breakdown, and student comments.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {/* Real print, not the ExportDrawer placeholder (2026-08-26:
                        "I should be able to export this course section...
                        as PDF") — printFullReport(), same as the header ⋯
                        menu: this card's own description promises "complete
                        results," which is the combined KPIs+all-tabs export,
                        not the current-tab-only one the Course/Faculty
                        tab-local buttons use. */}
                    <Button variant="outline" size="sm" onClick={printFullReport}>
                      Download PDF
                    </Button>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm" aria-level={2}>Raw Responses</CardTitle>
                    <CardDescription>
                      {result.evalScope ? `${EVAL_SCOPE_LABEL[result.evalScope]} only. ` : ''}
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
