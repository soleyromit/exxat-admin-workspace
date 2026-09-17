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
//     relabeled. Question Breakdown groups by this same classifySection,
//     not raw section titles either. (The accordion this round gave those
//     section rows, and the Heat map toggle beside it, are both gone — see
//     the 2026-09-16 entry below.)
//   - Middle 50% / Range / Responses-count are removed from every scale-plot
//     popover (section rows AND question rows) — Median + rating
//     distribution only.
//   - Faculty filter reverts to single-select (was made multi-select
//     2026-08-25 at Romit's own request) — multi-select's aggregated-export
//     use case belongs to longitudinal analytics, not this page. The Role
//     filter is removed entirely for the same reason (2026-08-26 re-read).
// The separate deriveThemes()/aiThemes AI comment-topic-clustering feature
// (lib/pce-themes.ts) is untouched — it legitimately keeps "Theme."
//
// 2026-09-16 (Monil/Vishal) — Section-wise distribution only:
//   - Rows are NOT expandable: "Section-wise distribution may— it need not be
//     expandable. Just, just a line, that's all." The Accordion, its chevron
//     and its expanded KeyMetrics + RatingBreakdownRows panel are gone; the
//     hover tooltip now carries Average / Median / Range / Term average, and
//     the always-present ChartDataTable carries all four as text for export
//     and for screen readers, so nothing moved behind a hover-only affordance.
//   - The min→max whisker hairline + end caps are gone: "that black line needs
//     to be removed."
//   - The highlighted band is the range of PER-QUESTION AVERAGES in the
//     section, not an interquartile span: "the question which got the lowest
//     average will be this point, the question which got highest average will
//     be this point… range cannot be an average… it's question average."
//   - The benchmark tick is the TERM average, not the all-time program pool:
//     "not program average but term average."
//   - Average dot and median line are unchanged. No heatmap.
//
// 2026-09-16 (Monil/Vishal) — Question breakdown:
//   - No track plot on question rows: "range does not make a lot of sense for
//     a question... we don't need this graph. We can just show the
//     distribution." ScaleTrackPlot is now Section-wise distribution's alone,
//     and the shared 1–5 axis strip went with it.
//   - Each row = RatingBreakdownRows (left) + three numbers (right): Average
//     with its signed gap to the term average, Term average, then Median LAST
//     — "question average compared to term average and median. Median should
//     be the last number." Range is dropped here; it is a section-level read.
//   - Every rated question starts EXPANDED ("everything should be expanded by
//     default"). The Accordion stays so a reader can fold one away — the
//     opposite call from Section-wise distribution, deliberately.
//   - Free-text questions each carry their own AI summary card: question,
//     response count, Summary + AI-generated badge, a 2–3 sentence synthesis
//     of THAT question's responses, a Positive / Constructive / Mixed donut,
//     and "View all responses" opening the existing FloatingSheetPanel — "we
//     show an AI summary which is specific to the responses of that
//     question... If I want to see the raw responses, I can see this way."
//     This replaces the theme-pill cluster AND the removed standalone
//     "Qualitative feedback" card ("remove entire qualitative feedback
//     component... we will mix them into the above stories") — the summary is
//     distributed per question and is never re-aggregated into one card.
//
// 2026-09-16 (Monil/Vishal) — Overview trend + Faculty tab:
//   - Response collection trend carries a labelled "Reminder sent" marker:
//     "give the reminder markers that tells the admin that the last reminder
//     was sent on this day... that reminder also signifies that there was a
//     rise in the responses because of reminder." SCOPE CAVEAT: the data model
//     holds ONE date (`PceSurvey.lastReminderSentAt`), not a send log, so this
//     is one marker, not a reminder history — and it annotates the date only,
//     never a measured lift, since the curve under it is still modeled.
//   - Selecting a faculty chip now shows that person's OWN average inline
//     beneath the chip row: "when you select a faculty... you need to show the
//     average of that faculty again" / "add Anita's score in whatever form you
//     feel right" — a light identity + number row, not a second KPI card. The
//     page-level KPI strip stays whole-course and does NOT follow the chip.
//   - NOT built: faculty-persona vs admin-persona card removal. Left open in
//     the meeting ("we'll figure it out"); do not infer an RBAC layout switch
//     from the score block above.
//
// 2026-09-16 (Monil/Vishal) — Scope-level AI summary:
//   - "Add AI summary in both course content and faculty feedback... it would
//     be like a paragraph, 3-4 line paragraph... the first component." One
//     `ScopeAiSummaryCard` at the head of `overviewContent`, which BOTH the
//     Course and the Faculty TabsContent render, so a single card serves both
//     tabs and re-reads whatever `facultyScope` resolved to.
//   - Header "Summary" + the shared `AiGeneratedBadge` (extracted from the
//     per-question free-text card so there is one AI affordance, not two).
//     No donut here: the sentiment donut is the PER-QUESTION card's.
//   - COPY IS A PLACEHOLDER pending Monil's real text ("I'll give you the
//     content"). Composed from this record's real numbers and real comment
//     clusters, one template literal per scope — see `aiSummaryText`.
// ============================================================================

import { Fragment, Suspense, useEffect, useMemo, useRef, useState } from 'react'
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
  Badge,
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
  FloatingSheetPanel,
  FloatingSheetPanelBody,
  FloatingSheetPanelContent,
  FloatingSheetPanelHeader,
  ToggleSwitch,
  viewSegmentedToolbarClass,
  viewSegmentedButtonClass,
} from '@exxatdesignux/ui'
import { Cell, Pie, PieChart } from 'recharts'
import * as Plot from '@observablehq/plot'
import { PlotFigure, axisDefaults, gridMark, type PlotTheme } from '@/components/pce/plot-figure'
import { CHART_TICK_FONT_SIZE } from '@/lib/chart-typography'
import { ChartCard, ChartDataTable, type ChartLeoInsight } from '@/components/charts-core'
import { LEO_TOKENS } from '@/components/leo-insight-indicator'
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
  MOCK_QUESTION_AI_SUMMARY,
  MOCK_SCOPE_AI_SUMMARY,
  medianFromDistribution,
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
  type PceOpenTextResponse,
} from '@/lib/pce-mock-data'
import { evaluationsFor } from '@/lib/pce-evaluations'
import { termSeason } from '@/lib/pce-analytics'

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
  /* Tried real `Tabs` first (Romit 2026-09-17: "ensure the user understands
   * that there is a tab that can be switched"), then tried `variant="line"`
   * with a smaller type scale to distinguish it from the primary
   * Overview/Course/Faculty row above (Romit follow-up: "the secondary tabs
   * isn't distinguishing from the primary tabs"). BOTH attempts left a
   * dangling `aria-controls` — a Radix `TabsTrigger` always sets it, but
   * this control never owned a matching `TabsContent` (the panel it
   * switches, `renderOverviewContent`, is rendered elsewhere by the page's
   * own outer Tabs) — axe flagged it CRITICAL (aria-valid-attr-value)
   * 2026-09-17 while verifying an unrelated layout fix on this same row.
   * `Tabs` semantics assume ownership of the content they switch; this
   * control never did, so no amount of styling would have made it valid.
   *
   * Rebuilt on `role="radiogroup"`/`role="radio"` instead — no tabpanel
   * reference to dangle, and it is the semantically correct role for
   * "exactly one exclusive choice, panel lives elsewhere" (this is exactly
   * what the DS's own `tabs-pattern.md` calls out: "Theme or 2-5 mode
   * chips → ButtonSegmentedControl", not `Tabs`). The packaged
   * `ButtonSegmentedControl` only takes a plain string `label` — no room for
   * avatar + 2-line role text — so this hand-composes the same
   * `role="radiogroup"` + roving-tabindex + arrow/Home/End keyboard contract
   * `ButtonSegmentedControl` itself uses (button-segmented-control.tsx),
   * reusing the DS's OWN exported pill-track classes
   * (`viewSegmentedToolbarClass`/`viewSegmentedButtonClass` — the same
   * `bg-muted/60` track + `bg-background` active pill `ListPageTemplate`'s
   * view switcher uses) rather than inventing new chrome. That pill also
   * settles the earlier "distinguish from primary" ask for free: it isn't
   * `Tabs` at all, so it isn't subject to Compact Shell's line-only
   * downgrade the way `variant="default"` was. */
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([])
  const focusInstructor = (index: number) => {
    const len = instructors.length
    if (len === 0) return
    const i = ((index % len) + len) % len
    toggleFacultyId(instructors[i]!.facultyId)
    requestAnimationFrame(() => itemRefs.current[i]?.focus())
  }
  const onRadioKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); focusInstructor(index + 1) }
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); focusInstructor(index - 1) }
    else if (e.key === 'Home') { e.preventDefault(); focusInstructor(0) }
    else if (e.key === 'End') { e.preventDefault(); focusInstructor(instructors.length - 1) }
  }
  return (
    <div role="radiogroup" aria-label="Faculty" className={`${viewSegmentedToolbarClass()} h-auto flex-wrap`}>
      {instructors.map((f, index) => {
        const isActive = f.facultyId === scope
        return (
          <Button
            key={f.facultyId}
            ref={(el) => { itemRefs.current[index] = el }}
            type="button"
            variant="ghost"
            size="default"
            role="radio"
            aria-checked={isActive}
            tabIndex={isActive ? 0 : -1}
            onClick={() => toggleFacultyId(f.facultyId)}
            onKeyDown={(e) => onRadioKeyDown(e, index)}
            className={`${viewSegmentedButtonClass(isActive)} h-auto gap-1.5 px-2.5 py-1.5`}
          >
            <AvatarInitials initials={f.facultyInitials} size="sm" className="shrink-0" fallbackClassName="text-[9px]" />
            <span className="flex min-w-0 flex-col items-start leading-tight">
              <span className="max-w-[12rem] truncate">{f.facultyName}</span>
              {roleFor(f.facultyId) && (
                <span className="max-w-[12rem] truncate text-xs font-normal opacity-70">{roleFor(f.facultyId)}</span>
              )}
            </span>
          </Button>
        )
      })}
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
        title={`${survey.courseCode} · ${survey.courseName}`}
        subtitle={`${survey.academicYear ? termSeason(survey.term) : survey.term}${survey.academicYear ? ` · AY ${survey.academicYear}` : ''}${program ? ` · ${program}` : ''}`}
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
   One row per REAL template section (not a classified taxonomy) — a PLAIN,
   non-collapsible row: title + the scale track, nothing to click open
   (Monil/Vishal, 2026-09-16: "Section-wise distribution may— it need not be
   expandable. Just, just a line, that's all."). Supersedes the Aug 26 2026
   accordion whose expanded panel carried KeyMetrics + RatingBreakdownRows —
   the hover tooltip now states Average / Median / Range / Term average, so
   the expand had nothing left to reveal that the row itself didn't say. */

interface SectionRowDatum {
  id: string
  title: string
  avg: number
  questions: number
  /** Benchmark drawn above the track. TERM-scoped as of 2026-09-16 (was an
   *  all-time program pool) — Monil/Vishal: "not program average but term
   *  average", "the program average will become term average". */
  termAvg: number | null
  /** Lowest ↔ highest QUESTION AVERAGE inside this section — the extent of the
   *  highlighted band on the row's track (2026-09-16). NOT an IQR and NOT the
   *  rating buckets that got a response: "the question which got the lowest
   *  average will be this point, the question which got highest average will
   *  be this point… range cannot be an average… it's question average." */
  questionAvgLo: number
  questionAvgHi: number
  /** Response counts by rating level, index 0 = rated 1 … index 4 = rated 5,
   *  aggregated across the section's questions — feeds the distribution. */
  dist: [number, number, number, number, number]
  /** Per-instructor average within this section (scope-aware) — photo markers. */
  instructors: { id: string; initials: string; name: string; avatarUrl?: string; roleLabel?: string; avg: number }[]
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

/* Section rows share the question rows' scale-track plot: ONE vocabulary for
   every score-vs-benchmark read on this page. ChartFigure is intentionally
   skipped here (unlike other ChartCard bodies) — its capture-phase arrow-key
   handler would stop-propagate before the in-plot Tooltip triggers ever saw
   the key; ChartCard's plain-children branch still supplies the
   ChartLeoInsightOverlay pill on its own. */
function SectionBoxplotChart({
  sections,
  partial,
  scopeLabel,
}: {
  sections: SectionRowDatum[]
  partial?: boolean
  /** What the tab is scoped to — "Course content", or "Course Coordinator
   *  evaluation · Dr. Anita Patel" — said in the description, same as every
   *  other section on the page (Romit 2026-08-17; role added 2026-09-17). */
  scopeLabel?: string | null
}) {
  if (sections.length === 0) return null
  const weakest = [...sections].sort((a, b) => a.avg - b.avg)[0]
  const sectionLeo: ChartLeoInsight = {
    headline: `${weakest.title} is the lowest section at ${weakest.avg.toFixed(1)}/5`,
    explanation:
      weakest.termAvg != null
        ? `Term average for this section is ${weakest.termAvg.toFixed(1)}. Its questions range from ${weakest.questionAvgLo.toFixed(1)} to ${weakest.questionAvgHi.toFixed(1)}.`
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
        'Range',
        'Term average',
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
          `${s.questionAvgLo.toFixed(1)}–${s.questionAvgHi.toFixed(1)}`,
          s.termAvg != null ? `${s.termAvg.toFixed(1)}/5` : '—',
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
      variant="normal"
      title="Section-wise distribution"
      description={`Score spread per section vs term${partial ? ' · partial data' : ''}${scopeLabel ? ` · ${scopeLabel}` : ''}`}
      leoInsight={sectionLeo}
      hideAskLeo
    >
            <p className="sr-only">
              {`One row per section on a 1 to 5 scale. Each row highlights the range between that section's lowest and highest question average, with the median, the course average, the term average${instructors.length > 0 ? ' and per-instructor averages' : ''}. ${weakest.title} is lowest at ${weakest.avg.toFixed(1)}. Every value is also listed in the data table below.`}
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
            {/* Plain, non-collapsible rows (2026-09-16): no AccordionItem, no
                chevron, no expanded panel. The grid IS the row — title column
                then the track; every number the old expanded KeyMetrics carried
                (Average / Median / Range / Term average) now lives in the
                track's hover tooltip and, verbatim, in the data table below, so
                nothing readable-only-on-click was lost. */}
            <div className="flex flex-col">
              {sections.map((s) => {
                const total = s.dist.reduce((a, n) => a + n, 0)
                return (
                  <div
                    key={s.id}
                    className="grid grid-cols-[220px_minmax(0,1fr)] items-center gap-6 border-b border-border last:border-0"
                  >
                    <div className="min-w-0 flex flex-col gap-0.5 py-2.5">
                      <p className="text-sm">{s.title}</p>
                      {/* Count of questions kept, number of ratings dropped —
                          transcript: "count of questions makes sense. Number
                          of ratings is not required." */}
                      <p className="text-xs text-muted-foreground tabular-nums">
                        {s.questions} question{s.questions !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <div className="min-w-0">
                      <ScaleTrackPlot
                        counts={s.dist}
                        total={total}
                        avg={s.avg}
                        termAvg={s.termAvg}
                        rangeLo={s.questionAvgLo}
                        rangeHi={s.questionAvgHi}
                        people={s.instructors.map((fi) => ({
                          facultyId: fi.id,
                          name: fi.name,
                          initials: fi.initials,
                          avatarUrl: fi.avatarUrl,
                          roleLabel: fi.roleLabel,
                          avg: fi.avg,
                        }))}
                        detailTitle={s.title}
                        detailMeta={`${s.questions} question${s.questions !== 1 ? 's' : ''}`}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
            {dataTable}
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
  /** Real template section title (e.g. "Course Content", "Faculty
   *  Performance") — the same name Section-wise distribution uses,
   *  repeated here as a sub-header so a multi-section template's questions
   *  don't all collapse into one flat "Course"/"Faculty" band. */
  sectionTitle: string
  kind: 'rated' | 'freeText'
  avg?: number
  median?: number
  /** Term-scoped average (2026-09-15 requirement) — `lib/pce-mock-data.ts`'s
   *  `termAvgForQuestion`. The page used to also carry an all-time
   *  `programAvg` (`programAvgForQuestion`) alongside this; removed
   *  2026-09-17 (full requirements re-check vs the raw transcript) — Vishal
   *  was explicit this page should never show "program average" again
   *  ("not program average but term average... the program average will
   *  become term average"), but the field had survived in the Excel export's
   *  "Program avg" column and the print view's sr-only data table, both
   *  genuinely user-facing surfaces most of this session's checks never
   *  opened. `programAvgForQuestion` itself is untouched — still legitimately
   *  used by `components/pce/question-chart-block.tsx` on a different
   *  surface. */
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
  /** Course-association role label ("Course Coordinator" / "Instructor") —
   *  the SAME `EVAL_FACULTY_ROLES` vocabulary the Faculty tab's switcher and
   *  the Question breakdown band use (2026-09-17 review: "no other faculty
   *  roles" — the old 'Primary faculty' / 'Guest faculty' pairing labels were
   *  a third vocabulary on one page). Romit, 2026-08-25: "their role isn't
   *  defined here" — the per-person popover showed name + average with no
   *  role at all. */
  roleLabel?: string
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
      <tr><th>Section</th><th>Avg</th><th>Range</th><th>Term avg</th><th>Questions</th></tr>
      ${sectionRows
        .map(
          (s) =>
            `<tr><td>${esc(s.title)}</td><td>${s.avg.toFixed(1)}</td><td>${s.questionAvgLo.toFixed(1)}-${s.questionAvgHi.toFixed(1)}</td><td>${s.termAvg != null ? s.termAvg.toFixed(1) : ''}</td><td>${s.questions}</td></tr>`,
        )
        .join('')}
    </table>`
  const questionTable = `
    <table border="1">
      <caption>Question breakdown</caption>
      <tr><th>Question</th><th>Group</th><th>Avg</th><th>Median</th><th>Range</th><th>Term avg</th></tr>
      ${breakdownRows
        .filter((r) => r.kind === 'rated')
        .map(
          (r) =>
            `<tr><td>${esc(r.label)}</td><td>${esc(r.group)}</td><td>${r.avg != null ? r.avg.toFixed(1) : ''}</td><td>${r.median != null ? r.median.toFixed(1) : ''}</td><td>${r.range ? `${r.range.lo}-${r.range.hi}` : ''}</td><td>${r.termAvg != null ? r.termAvg.toFixed(1) : ''}</td></tr>`,
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

/** Small downward triangle — the term-average benchmark mark. */
function BenchmarkTriangle() {
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
  termAvg,
  rangeLo,
  rangeHi,
  people,
  detailTitle,
  detailMeta,
}: {
  counts: number[]
  total: number
  avg?: number
  /** Benchmark tick above the track — the average for this survey's TERM
   *  (2026-09-16: "the program average will become term average"). */
  termAvg?: number | null
  /** Explicit extent of the highlighted band. Section rows pass the section's
   *  lowest ↔ highest QUESTION AVERAGE (2026-09-16 decision). When absent the
   *  band falls back to the p25–p75 interquartile span, which is what the
   *  question rows still render until their own rework lands. */
  rangeLo?: number
  rangeHi?: number
  people?: PlotPerson[]
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
  /* Band extent: the caller's explicit range when it has a real one (section
   * rows: lowest ↔ highest question average), else the interquartile span.
   * The separate min→max whisker hairline + end caps that used to sit under
   * this band is GONE (2026-09-16: "that black line needs to be removed") —
   * it drew the rating BUCKETS that got at least one response, a different
   * and misleading semantic now that the band itself carries the range. */
  const bandLo = rangeLo ?? p25
  const bandHi = rangeHi ?? p75
  const rangeText =
    rangeLo != null && rangeHi != null
      ? `${rangeLo.toFixed(1)}–${rangeHi.toFixed(1)}`
      : `${lowest.toFixed(1)}–${highest.toFixed(1)}`
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
  /* FOUR explicit, labeled numbers — Average, Median, Range, Term average
   * (2026-09-16). Section rows are no longer expandable, so this hover is the
   * only place those four live on the row itself; they were previously split
   * between an expanded KeyMetrics card and a three-row tooltip. "· matches"
   * replaces silence when the term-average delta is negligible, instead of
   * just omitting the parenthetical and leaving two identical unexplained
   * numbers (Romit, 2026-08-27: "can you add a better tooltip message"). */
  const tooltipStat = (v: number) => (
    <div className="flex flex-col gap-1">
      <div className="flex items-baseline justify-between gap-4">
        <span className="text-background/70">Average</span>
        <span className="font-medium tabular-nums">{v.toFixed(1)}</span>
      </div>
      <div className="flex items-baseline justify-between gap-4">
        <span className="text-background/70">Median</span>
        <span className="tabular-nums">{median.toFixed(1)}</span>
      </div>
      <div className="flex items-baseline justify-between gap-4">
        <span className="text-background/70">Range</span>
        <span className="tabular-nums">{rangeText}</span>
      </div>
      {termAvg != null && (
        <div className="flex items-baseline justify-between gap-4">
          <span className="text-background/70">Term avg</span>
          <span className="tabular-nums">
            {termAvg.toFixed(1)}
            {/* No semantic chart-2/chip-4 color here — those tokens are
               calibrated for a light surface and fail contrast against
               TooltipContent's inverted dark background (axe: 2.32:1, needs
               4.5:1). Plain text (inherits text-background) stays legible. */}
            {Math.abs(v - termAvg) > 0.05 ? (
              <span className="ml-1 font-medium">
                ({v > termAvg ? '+' : '−'}{Math.abs(v - termAvg).toFixed(1)})
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
            below: termAvg != null && p.avg < termAvg - 0.05,
            person: p as PlotPerson | undefined,
          }))
      : [
          {
            key: 'course-avg',
            x: scaleX(avg),
            value: avg,
            below: termAvg != null && avg < termAvg - 0.05,
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
      {/* term benchmark — above the track so it never collides with scores */}
      {termAvg != null && (
        <Tooltip>
          <TooltipTrigger
            aria-label={`Term average ${termAvg.toFixed(1)}`}
            className={`absolute top-0 flex -translate-x-1/2 flex-col items-center ${PLOT_TRIGGER_RING}`}
            style={{ left: `${scaleX(termAvg)}%` }}
          >
            {/* Suppress the value when the benchmark ≈ score — a duplicated
                number stacked over the marker reads as a rendering bug. ALWAYS
                rendered (never omitted): omitting this span removed it from
                the flex-col layout entirely, collapsing the triangle (now
                first child) upward — `invisible` keeps the layout slot while
                hiding the text. */}
            <span
              className={`text-xs tabular-nums leading-none text-muted-foreground ${Math.abs(termAvg - avg) > 0.05 ? '' : 'invisible'}`}
              aria-hidden="true"
            >
              {termAvg.toFixed(1)}
            </span>
            <BenchmarkTriangle />
          </TooltipTrigger>
          <TooltipContent side="top" sideOffset={6}>
            <div className="flex flex-col gap-1">
              <p className="font-medium">Term average {termAvg.toFixed(1)}</p>
              <p className="text-background/70">Response-weighted across every offering in this term.</p>
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
      {/* highlighted band — section rows: lowest ↔ highest QUESTION AVERAGE
          in the section; question rows: the interquartile span, until their
          own rework replaces this plot. Hover states all four numbers. */}
      <Tooltip>
        <TooltipTrigger
          aria-label={`${detailMeta ?? detailTitle}, average ${avg.toFixed(1)}, median ${median.toFixed(1)}, range ${rangeText}${termAvg != null ? `, term average ${termAvg.toFixed(1)}` : ''}`}
          className={`absolute top-7 h-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full ${PLOT_TRIGGER_RING}`}
          style={{
            /* Center-anchored (like the avatar/dot markers below), not
               left-anchored: a plain percentage width collapses to ~11px
               when a section's question averages sit almost on top of each
               other (e.g. a 2-question section), and the 24px avatar marker
               drawn at that same x then fully hides it — the range reads as
               "not shown" even though it was there. `max()` keeps a 2.5rem
               floor that grows symmetrically around the range's midpoint,
               so it peeks out on both sides of the marker instead of
               skewing off to one side the way a left-anchored floor would.
               Wide ranges (e.g. Course Content) are unaffected — the
               percentage term already exceeds the floor there. */
            left: `${(scaleX(bandLo) + scaleX(bandHi)) / 2}%`,
            width: `max(${Math.max(2, scaleX(bandHi) - scaleX(bandLo))}%, 2.5rem)`,
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
              aria-label={`${label}, median ${median.toFixed(1)}, range ${rangeText}${termAvg != null ? `, term average ${termAvg.toFixed(1)}` : ''}`}
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
                        — the course-association role, same label as the
                        Faculty tab's switcher. */}
                    {m.person.roleLabel && (
                      <span className="text-background/70"> · {m.person.roleLabel}</span>
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

/* ── per-question sentiment donut ─────────────────────────────────────────────
   Three slices only — Positive / Constructive / Mixed — reusing the page's
   EXISTING three-value ResponseComment sentiment taxonomy ('concern' has
   always rendered as "Constructive" here; the word "Negative" and the colour
   red are both banned on this page). Colours are the rating palette's own
   semantics so a reader who has learned the bars already knows the donut:
   teal = good, orange = needs work, grey = neither. Minimal Recharts
   composition, same Pie/Cell/PieChart idiom as components/charts-overview.tsx
   DonutChartContent — no new charting library. Fixed 92px so it never forces a
   horizontal scroll at phone width. */
const SENTIMENT_SLICES = [
  { key: 'positive', label: 'Positive', color: 'var(--chart-2)' },
  { key: 'concern', label: 'Constructive', color: 'var(--chart-5)' },
  { key: 'neutral', label: 'Mixed', color: 'var(--muted-foreground)' },
] as const

function SentimentDonut({
  counts,
  questionLabel,
}: {
  counts: Record<'positive' | 'concern' | 'neutral', number>
  questionLabel: string
}) {
  const data = SENTIMENT_SLICES.map((s) => ({ ...s, value: counts[s.key] }))
  const total = data.reduce((a, d) => a + d.value, 0)
  /* aria-hidden-focus (axe, SERIOUS): Recharts stamps tabindex="0" onto its
     series layer AFTER mount and re-stamps it on its own schedule, so neither
     the tabIndex prop, accessibilityLayer={false}, nor a one-shot effect holds
     — verified in the browser, all three still left a focusable node inside
     the aria-hidden wrapper. An observer is the only thing that survives it.
     Nothing is lost by taking the SVG out of the tab order: the legend beside
     it is the readable copy of every number in the donut. */
  const donutRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const host = donutRef.current
    if (!host) return
    const strip = () =>
      host
        .querySelectorAll('[tabindex]:not([tabindex="-1"])')
        .forEach((el) => el.setAttribute('tabindex', '-1'))
    strip()
    const observer = new MutationObserver(strip)
    observer.observe(host, { subtree: true, childList: true, attributes: true, attributeFilter: ['tabindex'] })
    return () => observer.disconnect()
  }, [])
  if (total === 0) return null
  return (
    <div className="flex items-center gap-3">
      {/* The SVG is decorative — every number it encodes is printed in the
          legend beside it and restated in the sr-only sentence below. */}
      {/* tabIndex -1 on BOTH the chart and the Pie layer: Recharts 3 puts its
          accessibility layer's tabindex="0" on the series <g>, and a focusable
          node inside an aria-hidden subtree is an axe "aria-hidden-focus"
          violation. The legend beside it carries the same values as real text,
          so nothing is lost by taking the SVG out of the tab order. */}
      <div className="shrink-0" aria-hidden="true" ref={donutRef}>
        <PieChart width={92} height={92} tabIndex={-1} accessibilityLayer={false}>
          <Pie
            tabIndex={-1}
            data={data}
            dataKey="value"
            nameKey="label"
            innerRadius={26}
            outerRadius={44}
            paddingAngle={2}
            stroke="var(--card)"
            strokeWidth={2}
            isAnimationActive={false}
          >
            {data.map((d) => (
              <Cell key={d.key} fill={d.color} />
            ))}
          </Pie>
        </PieChart>
      </div>
      <ul className="flex flex-col gap-1 text-xs">
        {data.map((d) => (
          <li key={d.key} className="flex items-center gap-2">
            <span
              className="size-2.5 shrink-0 rounded-[2px]"
              style={{ background: d.color }}
              aria-hidden="true"
            />
            <span className="text-muted-foreground">{d.label}</span>
            <span className="ms-auto tabular-nums font-medium">{d.value}</span>
          </li>
        ))}
      </ul>
      <p className="sr-only">
        {`Sentiment of responses to “${questionLabel}”: ${data.map((d) => `${d.value} ${d.label.toLowerCase()}`).join(', ')}.`}
      </p>
    </div>
  )
}

/** Free-text row — per-question AI summary card (2026-09-16 Monil/Vishal):
 *  question text, response count, a Summary block carrying an AI-generated
 *  badge, a 2–3 sentence synthesis of THIS question's own responses, the
 *  sentiment donut, and "View all responses" opening the same anonymized
 *  FloatingSheetPanel list this row has always had. Supersedes the theme-pill
 *  cluster (top highlight / concern / neutral chips) that used to sit here:
 *  "we show an AI summary which is specific to the responses of that
 *  question... 8 people responded, and this is the quick summary of those
 *  responses. If I want to see the raw responses, I can see this way."
 *  This distributed card is ALSO the replacement for the removed standalone
 *  "Qualitative feedback" component ("remove entire qualitative feedback
 *  component... we will mix them into the above stories") — it must never be
 *  re-aggregated into one card again.
 *
 *  Response pool: MOCK_OPEN_TEXT_RESPONSES (per-question, exact questionText
 *  match) when that fixture has rows for this question, otherwise the survey's
 *  MOCK_RESPONSES comments narrowed to this question's evaluation section —
 *  newer demo records carry their free text there, and a section-scoped
 *  fallback is the finest grain those records have (comments are tagged by
 *  section, not by question id). */
function WrittenResponsesRow({
  row,
  surveyId,
  context,
  canModerate,
  commentPool,
}: {
  row: BreakdownRow
  surveyId: string
  context?: string
  /** Survey-level comments (`MOCK_RESPONSES.comments`, viewer-scoped) used only
   *  when this question has no MOCK_OPEN_TEXT_RESPONSES rows of its own. */
  commentPool?: ResponseComment[]
  /** PD/coordinator can hide a response from the faculty-facing view — same
   *  "Visible to faculty" ToggleSwitch contract as CommentList, just local
   *  state here since there's no global toggleHideComment-style action for
   *  per-question open-text responses (2026-08-26 transcript: "we are
   *  showing responses at a section question breakdown... ideally we should
   *  be showing visible to faculty or not here... you click view all and you
   *  can hide or remove a few from here"). */
  canModerate: boolean
}) {
  const ownResponses = MOCK_OPEN_TEXT_RESPONSES.filter(
    (x) => x.surveyId === surveyId && x.questionText === row.label,
  )
  /* Fallback pool — only consulted when the per-question fixture is empty, so
     the six surveys already backed by MOCK_OPEN_TEXT_RESPONSES are untouched. */
  const fallbackResponses: PceOpenTextResponse[] =
    ownResponses.length > 0 || !commentPool
      ? []
      : commentPool
          .filter((c) =>
            row.group === 'Faculty'
              ? c.section === 'faculty_performance'
              : c.section !== 'faculty_performance',
          )
          .map((c, i) => ({
            id: `comment-${row.id}-${i}`,
            surveyId,
            questionText: row.label,
            text: c.text,
            sectionSubject: (row.group === 'Faculty' ? 'faculty' : 'course_content') as PceOpenTextResponse['sectionSubject'],
            sentiment: c.sentiment,
          }))
  const allResponses = ownResponses.length > 0 ? ownResponses : fallbackResponses
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
  /* Summary text. Hand-authored per question where the fixture has one
     (MOCK_QUESTION_AI_SUMMARY, keyed surveyId:questionId); otherwise DERIVED
     from this question's own responses — counts, the THEME_PATTERNS clusters
     that actually matched, and a representative quote. Never generic filler,
     and never sourced from another question's pool: "we show an AI summary
     which is specific to the responses of that question". */
  const rowThemes = deriveThemes(visibleToRole)
  const themeLabels = [...rowThemes]
    .sort((a, b) => b.occurrences - a.occurrences)
    .slice(0, 3)
    .map((t) => t.label.toLowerCase())
  const authored = MOCK_QUESTION_AI_SUMMARY[`${surveyId}:${row.id}`]
  const longest = [...responses].sort((a, b) => b.text.length - a.text.length)[0]
  const derivedSummary = (() => {
    if (count === 0) return ''
    const mix = `${count} student${count !== 1 ? 's' : ''} answered this question: ${positives} positive, ${concerns} constructive and ${neutrals} mixed.`
    const themes = themeLabels.length > 0 ? ` Responses cluster around ${themeLabels.join(', ')}.` : ''
    const quote = longest ? ` One response puts it this way: “${longest.text}”` : ''
    return `${mix}${themes}${quote}`
  })()
  const summary = authored ?? derivedSummary
  return (
    <div
      id={`question-${row.id}`}
      className="scroll-mt-16 py-3 border-b border-border last:border-0"
    >
      <Card className="shadow-none">
        <CardContent className="p-4 flex flex-col gap-3">
          <div className="flex items-start justify-between gap-6">
            <div className="min-w-0 flex flex-col gap-1">
              <p className="text-sm">{row.label}</p>
              <p className="text-xs text-muted-foreground tabular-nums">
                {count === 0 ? (
                  'Written responses · none yet'
                ) : (
                  <>
                    {count} response{count !== 1 ? 's' : ''}
                    {flaggedCount > 0 && <> · {flaggedCount} flagged for review</>}
                    {canModerate && hiddenCount > 0 && <> · {hiddenCount} hidden from faculty</>}
                  </>
                )}
              </p>
            </div>
            {count > 0 && (
              <Button variant="outline" size="sm" className="shrink-0" onClick={() => setOpen(true)}>
                View all responses
              </Button>
            )}
          </div>
          {count > 0 && (
            <div className="grid gap-4 items-start md:grid-cols-[minmax(0,1fr)_auto]">
              <div className="min-w-0 flex flex-col gap-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-foreground">Summary</span>
                  <AiGeneratedBadge />
                </div>
                <p className="text-sm leading-relaxed text-muted-foreground">{summary}</p>
              </div>
              <SentimentDonut
                counts={{ positive: positives, concern: concerns, neutral: neutrals }}
                questionLabel={row.label}
              />
            </div>
          )}
        </CardContent>
      </Card>
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

/** Signed gap between a question's own average and its term average, formatted
 *  for the KeyMetrics delta chip. Returns null when either side is missing or
 *  the two round to the same tenth — an honest "no difference" reads better as
 *  no chip than as "+0.0" (KeyMetrics hides the chip on an empty delta). */
function questionTermDelta(
  avg?: number,
  termAvg?: number | null,
): { text: string; trend: 'up' | 'down' } | null {
  if (avg == null || termAvg == null) return null
  const diff = Number((avg - termAvg).toFixed(1))
  if (diff === 0) return null
  return { text: `${diff > 0 ? '+' : '−'}${Math.abs(diff).toFixed(1)}`, trend: diff > 0 ? 'up' : 'down' }
}

/* Question rows = the rating DISTRIBUTION plus three numbers, never a track
   plot (2026-09-16 Monil/Vishal): "range does not make a lot of sense for a
   question... we don't need this graph. We can just show the distribution"
   and "instead of that horizontal line, we can just have a question average as
   a number, just one data point... question average compared to term average
   and median. Median should be the last number." Range is a SECTION-level
   read only, so it is gone from this panel. Rows are plain and always show
   their full content (2026-09-17: "the chevron doesn't make sense" once
   every question is always visible — no Accordion here any more, same as
   Section-wise distribution's own rows). */
function QuestionBreakdownTable({
  rows,
  surveyId,
  groupMeta,
  canModerate,
  commentPool,
}: {
  rows: BreakdownRow[]
  surveyId: string
  groupMeta: Record<string, GroupMeta>
  /** Threaded to WrittenResponsesRow's "Visible to faculty" toggle. */
  canModerate: boolean
  /** Viewer-scoped survey comments — WrittenResponsesRow's fallback pool for
   *  demo records whose free text lives in MOCK_RESPONSES rather than in
   *  MOCK_OPEN_TEXT_RESPONSES. */
  commentPool?: ResponseComment[]
}) {
  if (rows.length === 0) return null
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
      {/* The 1–5 axis strip that used to head this table went with the track
          plot it labelled (2026-09-16) — RatingBreakdownRows prints its own
          rating number on every bar, so a shared axis has nothing left to
          align to. Fixed 26rem, not minmax(160px,30rem) — each question row
          below is its own independent grid (Accordion item), so a
          content-sized column would compute a different width per row
          depending on that row's own question-text length, same class of bug
          fixed in Section-wise distribution's column. */}
      <div className="pb-2 border-b border-border">
        <span className="text-xs text-muted-foreground">Question</span>
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
              {/* Plain, non-collapsible rows (2026-09-17: "the chevron doesn't
                  make sense" once every question is always shown — the same
                  discipline Section-wise distribution's rows already follow).
                  No Accordion, no openQuestions state — see that removal's
                  own comment at the openSections precedent. */}
              <div className="flex flex-col">
                {orderedFor(group, sectionTitle).map((r) => {
                  const termDelta = questionTermDelta(r.avg, r.termAvg)
                  return r.kind === 'rated' ? (
                    <div
                      key={r.id}
                      id={`question-${r.id}`}
                      className="scroll-mt-16 border-b border-border py-2 last:border-0"
                    >
                      <p className="text-sm min-w-0 text-start">
                        {r.label}
                        {/* Screen-reader glance summary — the panel below
                            carries the same numbers visually, the data
                            table carries everything. */}
                        <span className="sr-only">
                          {`: average ${r.avg != null ? r.avg.toFixed(1) : 'unknown'} of 5${r.termAvg != null ? `, term average ${r.termAvg.toFixed(1)}` : ''}${r.median != null ? `, median ${r.median.toFixed(1)}` : ''}, from ${r.total ?? 0} rating${(r.total ?? 0) !== 1 ? 's' : ''}${
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
                      {/* Distribution (left, under the question it belongs
                          to) + three numbers (right). Hand-built, not
                          `KeyMetrics` — every DS shape tried here fought this
                          narrow, chrome-free need: `variant="compact"` wraps
                          a bordered/padded Card that read heavier than the
                          plain bars beside it (Romit 2026-09-17: "the card to
                          show the metrics is bulky"); `variant="flat"` still
                          renders its own section with default "Key Metrics /
                          Overview of performance indicators" header text no
                          prop here suppressed; `KeyMetricsContent` (no
                          card/header at all) stacks each metric on its own
                          full-width line instead of a horizontal row — no
                          `metricsSingleRow`-equivalent prop exists on it. This
                          reuses the exact label/value/delta vocabulary the
                          faculty score block above (`scopedFacultyScoreBlock`)
                          already established — `text-xs text-muted-foreground`
                          labels, `tabular-nums` values, `Badge
                          variant="secondary"` for the delta, never red
                          (aarti_no_red). Average carries the comparison
                          against this question's term average; Median is
                          LAST, per the transcript. No Range here — that read
                          is section-level only. */}
                      <div className="grid gap-8 pt-1 md:grid-cols-[minmax(0,1fr)_20rem] items-start">
                        <RatingBreakdownRows counts={r.counts ?? [0, 0, 0, 0, 0]} total={r.total ?? 0} />
                        <div className="grid grid-cols-3 divide-x divide-border">
                          <div className="flex flex-col gap-1.5 pr-4">
                            <span className="text-xs text-muted-foreground whitespace-nowrap">Average</span>
                            <span className="text-lg font-semibold tabular-nums leading-none text-foreground">
                              {r.avg != null ? r.avg.toFixed(1) : '—'}
                            </span>
                            {termDelta && (
                              <Badge variant="secondary" className="w-fit tabular-nums">
                                {termDelta.text} vs term
                              </Badge>
                            )}
                          </div>
                          <div className="flex flex-col gap-1.5 px-4">
                            <span className="text-xs text-muted-foreground whitespace-nowrap">Term average</span>
                            <span className="text-lg font-semibold tabular-nums leading-none text-foreground">
                              {r.termAvg != null ? r.termAvg.toFixed(1) : '—'}
                            </span>
                          </div>
                          <div className="flex flex-col gap-1.5 pl-4">
                            <span className="text-xs text-muted-foreground whitespace-nowrap">Median</span>
                            <span className="text-lg font-semibold tabular-nums leading-none text-foreground">
                              {r.median != null ? r.median.toFixed(1) : '—'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <WrittenResponsesRow
                      key={r.id}
                      row={r}
                      surveyId={surveyId}
                      context={meta?.contextLine}
                      canModerate={canModerate}
                      commentPool={commentPool}
                    />
                  )
                })}
              </div>
            </Fragment>
          ))}
        </Fragment>
        )
      })}
      <ChartDataTable
        caption="Question breakdown"
        headers={['Question', 'Group', 'Average', 'Median', 'Rated 1', 'Rated 2', 'Rated 3', 'Rated 4', 'Rated 5']}
        rows={rows
          .filter((r) => r.kind === 'rated')
          .flatMap((r) => [
            [
              r.label,
              r.group,
              r.avg != null ? r.avg.toFixed(1) : '—',
              r.median != null ? r.median.toFixed(1) : '—',
              ...(r.counts ?? [0, 0, 0, 0, 0]),
            ],
            ...(r.perFaculty ?? []).map((f) => [
              `${r.label} · ${f.name}`,
              r.group,
              f.avg.toFixed(1),
              '—',
              ...(f.counts ?? [0, 0, 0, 0, 0]),
            ]),
          ])}
      />
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
  /* Last-reminder marker (2026-09-16, Monil/Vishal: "give the reminder
     markers that tells the admin that the last reminder was sent on this
     day... that reminder also signifies that there was a rise in the
     responses because of reminder").
     SCOPE — deliberately ONE marker: `PceSurvey.lastReminderSentAt`
     (lib/pce-mock-data.ts) is a single most-recent send date, NOT a send
     log, so drawing several "reminder events" would be inventing history.
     If a real reminder history ever lands, map it here instead of adding
     synthetic ones. The marker asserts WHEN the reminder went out and
     nothing more — it does NOT claim a measured lift, because the curve it
     sits on is still MODELED (see this component's header comment); the
     rule lets the admin read the shape around that date themselves.
     Guarded three ways — field absent, unparseable date, or a date outside
     [openDate, deadline] all render nothing extra rather than drawing a
     rule off the axis. */
  const reminderAt = survey.lastReminderSentAt ? new Date(survey.lastReminderSentAt).getTime() : NaN
  const reminderInWindow = Number.isFinite(reminderAt) && reminderAt >= open && reminderAt <= close
  /** 0–1 position of the reminder inside the window — drives label side. */
  const reminderT = reminderInWindow ? (reminderAt - open) / (close - open) : 0
  const reminderPoint = reminderInWindow
    ? {
        date: new Date(reminderAt),
        /* Sit ON the drawn curve: same smoothstep the `actual` series uses,
           clamped to the last plotted point for a reminder dated after the
           elapsed portion (can't happen for a past send, but a bad fixture
           shouldn't float the dot above the line). */
        value: rate * smooth(elapsed === 0 ? 0 : Math.min(reminderT, elapsed) / elapsed),
      }
    : null
  /* UTC — `lastReminderSentAt` is authored as a bare ISO date, which parses
     to UTC midnight; formatting it in the local zone shifts it a day west. */
  const reminderLabel = reminderInWindow
    ? new Date(reminderAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })
    : null
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
      /* Reminder rule goes UNDER the response curve — it's an annotation on
         the window, not a second series. */
      ...(reminderPoint
        ? [Plot.ruleX([reminderPoint.date], { stroke: theme.rule, strokeDasharray: '3,3', strokeOpacity: 0.9 })]
        : []),
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
      /* Hollow dot (card fill + content stroke) so it reads as an annotation
         anchor and not as the solid "latest reading" dot above it. Label sits
         at the top of the plot area and flips side past the midpoint so a
         late reminder — the common case — doesn't run off the right edge. */
      ...(reminderPoint
        ? [
            Plot.dot([reminderPoint], {
              x: 'date',
              y: 'value',
              fill: theme.card,
              stroke: theme.content,
              strokeWidth: 1.5,
              r: 3.5,
            }),
            Plot.text([reminderPoint], {
              x: 'date',
              y: () => 100,
              text: () => 'Reminder sent',
              dy: -8,
              dx: reminderT > 0.55 ? -4 : 4,
              textAnchor: reminderT > 0.55 ? 'end' : 'start',
              fill: theme.mutedForeground,
              fontSize: CHART_TICK_FONT_SIZE,
            }),
          ]
        : []),
    ],
  })
  return (
    <ChartCard
      title="Response collection"
      description={`Cumulative responses across the evaluation window${!closed ? ' · dashed = projected' : ''}${reminderLabel ? ` · last reminder ${reminderLabel}` : ''}`}
      leoInsight={leo}
      hideAskLeo
    >
      {/* PlotFigure's SVG is aria-hidden (components/pce/plot-figure.tsx) —
          every chart on this page pairs it with a sr-only prose description
          of the same data (see SectionBoxplotChart above). */}
      <p className="sr-only">
        {`Cumulative response rate over the evaluation window from ${new Date(open).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} to ${new Date(close).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}. Current rate: ${rate}%.${!closed ? ` Projected by close: ~${projectedFinal}%.` : ''} Target: ${TARGET}%.${reminderLabel ? ` A marker on ${reminderLabel} shows when the most recent reminder was sent; only that one reminder is recorded.` : ''}`}
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
/** The page's ONE "this text came from the summariser" pill — DS Badge plus
 *  the existing fa-sparkles / var(--brand-color) pair (the ai-insight-card
 *  convention already on this surface), never a new colour. Extracted
 *  2026-09-16 so the per-question free-text summary (`WrittenResponsesRow`)
 *  and the scope-level Summary card at the top of the Course/Faculty tabs
 *  share one affordance instead of two copies that drift apart. Label stays
 *  sentence-cased ("AI generated"), same as every other chip on the page. */
function AiGeneratedBadge() {
  /* The DS Leo insight popover's own "kind chip" (leo-insight-indicator.tsx:
   * rounded-full, `bg-brand/10` fill, `border-brand/50` hairline, brand star,
   * foreground label) — the ONE brand-coloured element on an AI surface, so
   * brand ink means "AI" and nothing else on this page. Replaced the grey
   * `BadgeAi` pill, which fought the lavender Leo wash (Romit, 2026-09-17:
   * "focus on color choices and placement of icons better"). Label stays
   * sentence-cased ("AI generated"), same as every other chip on the page. */
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium text-foreground ${LEO_TOKENS.softBgClass} ${LEO_TOKENS.borderClass}`}
    >
      <i className={`fa-duotone fa-solid fa-star-christmas text-xs ${LEO_TOKENS.iconClass}`} aria-hidden="true" />
      AI generated
    </span>
  )
}

/* ── AI surface shell ────────────────────────────────────────────────────────
   The three AI-lane cards (Summary · Highlights · Scope for improvement) are
   the things a reader should notice FIRST on landing; everything below them
   stays plain (2026-09-17 review, Monil: "when a user lands on this page
   these 3 things should be very attractive and asking for attention. Rest of
   them can be dim, rest of them can be vanilla... we'll keep it design
   compliant"). Every treatment here is the DS's OWN AI vocabulary, read from
   the package source rather than invented:
   · Leo surface wash — `--leo-surface-gradient` (globals.css: "Ask Leo panel
     tints… Use for blobs, cards, etc."), the 4%→8% brand mix every Ask Leo
     surface sits on. It is what makes the three cards read as one AI lane
     against the plain white cards beneath.
   · Ambient brand glow — card.tsx GLOW TREATMENT: "Only two approved uses…
     1. AI surfaces (Insights card, Ask Leo responses) → opacity 0.12–0.16.
     Always pair with overflow-hidden on the Card." Same radial the DS's Leo
     insight popover paints (leo-insight-indicator.tsx), at the top of that
     approved band so it still reads over the wash.
   · ONE brand-coloured element per card: the Leo kind chip (`AiGeneratedBadge`,
     the insight popover's own `bg-brand/10 border-brand/50` chip with the
     brand star) in the header's `CardAction` slot, right-aligned like the
     popover's `ms-auto` chip. The title itself stays plain foreground and
     the row category glyphs stay muted, so brand ink on this page means
     "AI" and nothing else (2026-09-17: a lavender Leo disc left of the
     title read as a bullet, and a grey `BadgeAi` pill fought the wash).
   · Body copy in `text-foreground`, not muted — the insight popover's own
     body weight; muted prose was half of what read as "dim".
   Nothing else: DS Card shape, border, radius and shadow are untouched
   ([[feedback_never_override_ds_card_button_shape]]). */
function AiSurfaceCard({
  title,
  description,
  children,
  className,
}: {
  title: string
  description?: string | null
  children: React.ReactNode
  className?: string
}) {
  return (
    <Card
      className={`relative ${className ?? ''}`}
      style={{ backgroundImage: 'var(--leo-surface-gradient)' }}
    >
      {/* The glow is clipped by ITS OWN wrapper (rounded to the card), not by
          `overflow-hidden` on the Card — that would also clip the DS Button
          focus ring on the theme rows inside (state-review, 2026-09-17;
          [[feedback_inline_style_kills_focus_ring]]). */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit] forced-colors:hidden">
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 120% 80% at 50% 100%, oklch(from var(--brand-color) l c h / 0.16) 0%, transparent 68%)',
          }}
        />
      </div>
      <CardHeader className="relative pb-2">
        <CardTitle className="text-sm" aria-level={2}>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
        <CardAction>
          <AiGeneratedBadge />
        </CardAction>
      </CardHeader>
      <CardContent className="relative">{children}</CardContent>
    </Card>
  )
}

/** Scope-level AI summary — the FIRST card on both the Course tab and the
 *  Faculty tab (2026-09-16, Monil/Vishal: "add AI summary in both course
 *  content and faculty feedback... it would be like a paragraph, 3-4 line
 *  paragraph... the first component").
 *  Text only, deliberately: the sentiment donut belongs to the PER-QUESTION
 *  summary cards in the Question breakdown, and repeating it here would make
 *  two different-scope donuts compete at the top of the page. The prose
 *  itself is composed by the page (see `aiSummaryText`). `scopeLabel` names
 *  WHAT is summarised — "Course content" or "Course Coordinator evaluation ·
 *  Dr. Anita Patel" (2026-09-17 review: the role must be said on the tab). */
function ScopeAiSummaryCard({ text, scopeLabel }: { text: string; scopeLabel?: string | null }) {
  return (
    <AiSurfaceCard title="Summary" description={scopeLabel}>
      <p className="text-sm leading-relaxed text-foreground">{text}</p>
    </AiSurfaceCard>
  )
}

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
    <AiSurfaceCard title={copy.title}>
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
                  {/* Per-row category glyph (thumbs-up / trend) keeps the two
                      cards tellable apart at a glance now that the header
                      slot carries the shared Leo mark instead
                      ([[feedback_pure_typography_loses_storytelling]]). */}
                  <span className="flex items-center gap-2 min-w-0">
                    <i className={`fa-light ${copy.icon} text-xs text-muted-foreground shrink-0`} aria-hidden="true" />
                    <span className="text-sm text-foreground truncate">{t.label}</span>
                  </span>
                  <span className="flex items-center gap-2 shrink-0 text-xs text-muted-foreground">
                    {t.occurrences} comment{t.occurrences !== 1 ? 's' : ''}
                    <i className="fa-light fa-chevron-right" aria-hidden="true" />
                  </span>
                </Button>
              </li>
            ))}
          </ul>
        )}
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
    </AiSurfaceCard>
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
    templates={templates} />
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

  /* Page tab — Overview / Course / Faculty (2026-09-15:
   * Overview reinstated as its own tab — spec explicitly asks for a
   * dedicated Overview with the response-collection trend; it carries no
   * `facultyScope` of its own). Switching TO Course always sets scope to
   * 'course'; switching TO Faculty resets to the first instructor (PD) or
   * back to the viewer's own id (non-PD) ONLY when coming from Course. */
  const [pageTab, setPageTabRaw] = useState<'overview' | 'course' | 'faculty'>('overview')
  const setPageTab = (v: string) => {
    if (v !== 'overview' && v !== 'course' && v !== 'faculty') return
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
    if (inst?.evalRole) return inst.evalRole
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
  /** "Course Coordinator" / "Instructor" for whoever the Faculty tab shows —
   *  the role has to be SAID on the tab body itself, not only on the
   *  switcher chip (2026-09-17 review: "when you select Course Coordinator...
   *  somewhere here you have to mention that it is coordinator evaluation.
   *  Instructor name is there, the role name should be shown"). On a
   *  solo-instructor offering the switcher doesn't render at all, so this
   *  is the ONLY place the role appears. */
  const scopedFacultyRoleLabel = (() => {
    const who = scopedInstructor ?? soleInstructor
    return who ? EVAL_FACULTY_ROLES.find((r) => r.id === evalRoleFor(who.id))?.label ?? null : null
  })()
  /** "Dr. Anita Patel · Course Coordinator" — one string every faculty-scoped
   *  band/caption on the page shares, so name and role never drift apart. */
  const scopedFacultyLabel = scopedFacultyName
    ? `${scopedFacultyName}${scopedFacultyRoleLabel ? ` · ${scopedFacultyRoleLabel}` : ''}`
    : null
  const facultyChipLabel =
    scopedFacultyName ??
    (hasAnyFacultyFilter
      ? `${matchedInstructors.length} instructors`
      : survey.instructors.length > 1
        ? `${survey.instructors.length} instructors`
        : null)
  /** What the active tab's body is about — the Summary card's caption and the
   *  Section-wise distribution description both say it, so a reader landing
   *  on the Faculty tab sees "Course Coordinator evaluation · Dr. Anita
   *  Patel" before any number (2026-09-17 review). */
  const tabScopeLabel =
    facultyScope === 'course'
      ? 'Course content'
      : scopedFacultyName
        ? `${scopedFacultyRoleLabel ? `${scopedFacultyRoleLabel} evaluation` : 'Faculty evaluation'} · ${scopedFacultyName}`
        : facultyChipLabel
          ? `Faculty evaluation · ${facultyChipLabel}`
          : 'Faculty evaluation'

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
  /* Real per-question section title, straight off THIS template's own
   * templateSections — not a guess. `classifySectionFromText`'s keyword
   * regex predates the templateSections model and started misclassifying
   * once a course-content question ("...clearly stated") and a faculty
   * question ("...clear and approachable") shared a keyword (verification,
   * 2026-09-16): q1 rendered under "Teaching Effectiveness" instead of
   * "Course Content". `sectionTitleById` is authoritative for any question
   * that belongs to THIS survey's own template; `classifySectionFromText`
   * remains the fallback ONLY for cross-template aggregation (`program`
   * below scans every survey's data, including templates whose question
   * ids aren't in this map) and templates with no templateSections at all. */
  const sectionTitleById = new Map<string, string>()
  for (const sec of sections) for (const q of sec.questions) sectionTitleById.set(q.id, sec.title)

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
  /* Term average (2026-09-15 KPI requirement) — pooled over surveys sharing
   * this offering's term. The KPI tiles' headline delta is term-over-term
   * (`priorInstanceTrend`, vs `prior`), not a term-avg comparison — this
   * feeds only the "Term avg" caption text.
   *
   * Pool = per-QUESTION averages from `MOCK_SURVEY_QUESTION_DATA` (course =
   * every `sectionScores` question, faculty = every `instructorBlocks`
   * question), NOT `MOCK_RESPONSES.sectionScores`. The Section-wise
   * distribution rows below compute THEIR "Term average" from exactly this
   * question pool, and the two used to read different numbers for the same
   * section (e.g. Course Content: KPI 3.89 vs row 3.8) because they drew from
   * two fixtures that happen to disagree — flagged 2026-09-16, unified here
   * so one page never shows two "term averages" for one section. */
  const termQuestionPool = useMemo(() => {
    const surveyIdsInTerm = new Set(MOCK_SURVEYS.filter((s) => s.term === survey.term).map((s) => s.id))
    const course: number[] = []
    const faculty: number[] = []
    for (const d of MOCK_SURVEY_QUESTION_DATA) {
      if (!surveyIdsInTerm.has(d.surveyId)) continue
      for (const scores of Object.values(d.sectionScores)) for (const q of scores) course.push(q.avg)
      for (const b of d.instructorBlocks ?? []) for (const q of b.scores) faculty.push(q.avg)
    }
    const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null)
    return { course: mean(course), faculty: mean(faculty) }
  }, [survey.term])
  const termCourseAvg = termQuestionPool.course
  const termFacultyAvg = termQuestionPool.faculty
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
     carrying the TERM average for the same section (benchmark on the viz).
     classifySection is the SAME taxonomy the old ThemeBoxplotChart used
     (SECTION_ORDER, module-level) — this is a rename, not a re-architecture. */
  const sectionRows = useMemo((): SectionRowDatum[] => {
    if (!qData) return []
    const textById = new Map<string, string>()
    for (const sec of sections) for (const q of sec.questions) textById.set(q.id, q.text)
    const classifySection = (questionId: string, fromFaculty: boolean): string =>
      sectionTitleById.get(questionId) ?? classifySectionFromText(textById.get(questionId) ?? '', fromFaculty)
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
    /* Scope follows the tab: Course Content shows ONLY course questions,
       Faculty shows ONLY the picked instructor's questions (2026-09-17
       review: "since we are having 2 tabs, in Faculty you can skip the
       course content questions... otherwise what is the purpose of having
       2 tabs?") — and the survey's evalScope on a split offering (a Course
       survey never shows instructor questions, and vice versa). */
    const mine = collect(
      qData,
      (id) => survey.instructors.some((i) => i.id === id) && inFacultyScope(id),
      {
        course: result.evalScope !== 'instructor' && facultyScope === 'course',
        faculty: result.evalScope !== 'course' && facultyScope !== 'course',
      },
    )
    /* Benchmark pool — TERM-scoped as of 2026-09-16 (Monil/Vishal: "not
       program average but term average"). Was every survey ever run on any
       template; now only the surveys sharing THIS offering's term, the same
       `MOCK_SURVEYS`-by-term narrowing `termCourseAvg` / `termFacultyAvg`
       already use for the KPI strip, so the two benchmarks agree. */
    const surveyIdsInTerm = new Set(MOCK_SURVEYS.filter((x) => x.term === survey.term).map((x) => x.id))
    const termPool = MOCK_SURVEY_QUESTION_DATA.filter((d) => surveyIdsInTerm.has(d.surveyId)).flatMap((d) =>
      collect(d, () => true),
    )
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
      const inTerm = termPool.filter((x) => x.section === title)
      const instructors = perInstructorSectioned
        .map(({ inst, qs: iqs }) => {
          const mineSection = iqs.filter((x) => x.section === title)
          if (mineSection.length === 0) return null
          return {
            id: inst.id,
            initials: inst.initials,
            name: inst.name,
            avatarUrl: inst.avatarUrl,
            roleLabel: EVAL_FACULTY_ROLES.find((r) => r.id === evalRoleFor(inst.id))?.label,
            avg: mineSection.reduce((a, x) => a + x.avg, 0) / mineSection.length,
          }
        })
        .filter((x): x is NonNullable<typeof x> => x != null)
      /* Distinct contributing questions (faculty questions repeat per
         instructor block) — just the count, for "N questions" in the row. */
      const questionCount = new Set(qs.map((x) => x.id)).size
      /* Band extent = the section's lowest ↔ highest QUESTION average, not a
         quantile of the pooled rating buckets (2026-09-16: "range cannot be
         an average… it's question average"). A faculty question scored by two
         instructors contributes each instructor's own average, so a section
         where one instructor lags is visibly wider. */
      const questionAvgs = qs.map((x) => x.avg)
      rows.push({
        id: title,
        title,
        avg: qs.reduce((a, x) => a + x.avg, 0) / qs.length,
        questions: questionCount,
        termAvg: inTerm.length ? inTerm.reduce((a, x) => a + x.avg, 0) / inTerm.length : null,
        questionAvgLo: Math.min(...questionAvgs),
        questionAvgHi: Math.max(...questionAvgs),
        dist,
        instructors,
      })
    }
    return rows
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qData, sections, inCollection, facultyScope, survey.instructors, survey.term, result.facultyId])

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
          .filter(([key]) => (facultyScope === 'course' ? !facultySubjectKeys.has(key) : facultySubjectKeys.has(key)))
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
  /* Course-content sections render on the Course Content tab only — the
     Faculty tab starts straight at the instructor sections (2026-09-17
     review), the mirror of the gate below. */
  const courseSections =
    result.evalScope === 'instructor' || facultyScope !== 'course'
      ? []
      : sections.filter((s) => sectionGroupOf(s) === 'Course')
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
  /* Subject attribution — explicit facultyId, else the sole instructor. The
     subject is who the comment is ABOUT; authorship stays anonymous. */
  const commentSubjectId = (c: IndexedComment) => c.facultyId ?? soleInstructor?.id ?? null
  /* The card's own rule: counts, chips, themes and lists draw from ONE pool so
     no two numbers disagree. With comment groups scope-filtered above, the pool
     must scope the same way — course/general comments and unattributed faculty
     comments (no role to match) always stay in, UNLESS the view itself is
     scoped to Course, which excludes every faculty_performance comment
     outright (an unattributed one has no role to match against 'course'). */
  const inCommentScope = (c: IndexedComment) => {
    /* Course/general comments belong to the Course Content tab only — the
       Faculty tab's Highlights / Scope for improvement / Summary describe the
       picked instructor, not the course (2026-09-17 review: Faculty tab skips
       course content entirely). */
    if (c.section !== 'faculty_performance') return facultyScope === 'course'
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
  /* Anchor navigation — section + per-question anchors (Romit 2026-07-09).
     The two collapsed shells are CONTROLLED so an anchor inside them can
     expand first, then scroll on the next frames. */
  /* Default OPEN (2026-09-16 verification catch): the card wrapper itself was
   * still collapsed-by-default from an older spec even after every question
   * inside it was switched to default-open — a cold page load showed a
   * closed "Question breakdown" card with nothing visible until a click,
   * contradicting "everything should be expanded by default." */
  const [qbOpen, setQbOpen] = useState(true)
  /** Combined-report print in flight (`printFullReport`) — reveals the
   *  force-mounted Overview chart alongside whichever tab is active, so the
   *  KPI strip + Overview + Course/Faculty content all land in one PDF. */
  const [isPrintingFull, setIsPrintingFull] = useState(false)
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
    const ids = ['scores', 'sections', 'questions', 'feedback-loop']
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
  /* Release feedback — the header comment's promised LocalBanner state flip
     (toast banned); success must be announced, not inferred from a button
     disappearing. */
  const [releaseSuccess, setReleaseSuccess] = useState(false)
  function goTo(id: string, expand?: 'questions') {
    const wasClosed = expand === 'questions' && !qbOpen
    if (expand === 'questions') setQbOpen(true)
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
    const prevQb = qbOpen
    setQbOpen(true)
    const restore = () => {
      setQbOpen(prevQb)
      window.removeEventListener('afterprint', restore)
    }
    window.addEventListener('afterprint', restore)
    window.setTimeout(() => window.print(), 350)
  }
  /* Combined "KPIs + all tabs" export (2026-09-15 page-level Actions
   * requirement, distinct from `printCurrentView`'s tab-scoped export used
   * by the Course/Faculty-local Export PDF buttons) — the header ⋯ menu's
   * "Export as PDF" means the COMPLETE picture, not whichever tab happens
   * to be open.
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
    const prevQb = qbOpen
    const prevTab = pageTab
    const prevScope = facultyScope
    setIsPrintingFull(true)
    /* A course-only split survey has no Faculty tab (2026-09-17) — printing
     * it lands on Course Content instead of activating a tab with no
     * trigger (state-review catch). */
    if (result.evalScope === 'course') {
      setPageTab('course')
    } else {
      if (facultyScope === 'course') {
        setFacultyScope(isPD ? survey.instructors[0]?.id ?? 'all' : result.facultyId)
      }
      setPageTab('faculty')
    }
    setQbOpen(true)
    const restore = () => {
      setIsPrintingFull(false)
      setQbOpen(prevQb)
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
          /* `section` IS the real templateSections entry this question lives
           * in — its own `.title` is authoritative, no need to re-derive by
           * keyword guessing (see sectionTitleById's comment above for why
           * the guess was wrong for q1/q16). */
          const sectionTitle = section.title
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
      label: 'Course content evaluation',
      anchorId: 'group-course',
      contextLine: 'Course content evaluation',
    },
    Faculty: {
      icon: EVALUATION_TYPE_ICON.faculty_roles,
      label: 'Faculty evaluation',
      sub:
        scopedFacultyLabel ??
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
      contextLine: `Faculty evaluation${scopedFacultyLabel ? ` · ${scopedFacultyLabel}` : ''}`,
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

  /* Selected faculty's OWN score — Faculty tab, beneath the chip row
     (2026-09-16, Monil/Vishal: "when you select a faculty... you need to show
     the average of that faculty again"; Romit's accepted proposal: "the tab
     where the name of the faculty is shared, we can also share the faculty's
     score... instead of just one whole KPI card"; Monil: "add Anita's score in
     whatever form you feel right").
     WHY IT'S NEEDED: the page-level KPI strip above the tabs is deliberately
     whole-course — its Faculty Performance tile reads `kpiFacultyAvg`, which
     is computed with no reference to `facultyScope` (see its own comment), so
     picking a chip moves the tab body but never that number. This block is
     therefore the only surface that answers "what did THIS person score", and
     the KPI strip stays untouched.
     FORM: a light inline identity + number row, NOT a second KPI card grid
     ("in whatever form you feel right" / "instead of just one whole KPI
     card") — the full tile anatomy is already spent above.
     DERIVATION: same instructor-block mean as `kpiFacultyAvg`, narrowed to
     one instructor, so the two numbers are read on the same basis. Benchmarked
     against `termFacultyAvg`, the same term average the KPI tile captions use.
     NOT DONE HERE: no persona-based layout switching (admin-vs-faculty card
     removal was explicitly left open — "we'll figure it out"). The block
     simply follows whatever `facultyScope` already resolves to, which for a
     faculty viewer is locked to themselves. */
  const scopedFacultyOwnAvg = useMemo(() => {
    if (!scopedInstructor || !qData) return null
    const avgs = (qData.instructorBlocks ?? [])
      .filter((b) => b.instructorId === scopedInstructor.id)
      .flatMap((b) => b.scores.map((q) => q.avg))
    if (avgs.length === 0) return null
    return avgs.reduce((a, b) => a + b, 0) / avgs.length
  }, [scopedInstructor, qData])

  /* Only when the scope resolves to exactly ONE instructor and there are 2+
     to pick between — on a solo-instructor offering the Faculty Performance
     KPI tile above IS this number, and repeating it is pure duplication. */
  const scopedFacultyOwnDelta = questionTermDelta(scopedFacultyOwnAvg ?? undefined, termFacultyAvg)
  /* A `ChartCard variant="kpi-chart"` tile, not a hand-rolled flex row
   * (Romit 2026-09-17, screenshot: "don't like this crowded layout" — the
   * old `flex items-baseline` row wrapped its "of 5 · term avg" caption
   * across 4 lines and squeezed a full `Badge` pill onto the same baseline
   * once the card narrowed to fit beside the "On this page" rail). Reuses
   * the EXACT tile the page's own top KPI band already uses for Course
   * Content / Faculty Performance ([[feedback_use_vendored_chartcard_pce]]:
   * "ALL charts use vendored ChartCard") — number + a compact inline trend
   * arrow on one line, caption on its OWN line below as a block-level `<p>`
   * rather than a squeezed inline span, which is exactly the layout a
   * narrow column needs. Its amber/emerald trend tone also comes for free
   * (never red on a rating surface — Aarti), so the hand-rolled `Badge` is
   * gone entirely, not just re-styled. Dropped the repeated avatar/name/role
   * too (Romit 2026-09-17, earlier screenshot): the chip immediately above
   * already shows all three for whichever instructor is selected. */
  const scopedFacultyScoreCard =
    scopedInstructor && survey.instructors.length > 1 ? (
      <ChartCard
        variant="kpi-chart"
        title="Score"
        hideAskLeo
        miniMetrics={[
          {
            value: scopedFacultyOwnAvg != null ? scopedFacultyOwnAvg.toFixed(2) : '—',
            // A co-instructor can be ON the offering with no faculty questions
            // scored against them yet (e.g. before this round, mon1 carried an
            // instructor block for only one of its two instructors) — say so
            // plainly in the caption rather than printing "— of 5".
            label:
              scopedFacultyOwnAvg != null
                ? `of 5${termFacultyAvg != null ? ` · Term avg ${termFacultyAvg.toFixed(2)}` : ''}`
                : `No faculty questions scored yet for ${scopedInstructor.name}.`,
            trend: scopedFacultyOwnDelta?.trend ?? 'neutral',
            trendPolarity: 'higher_is_better',
            trendDelta: scopedFacultyOwnDelta?.text,
          },
        ]}
      >
        {null}
      </ChartCard>
    ) : null

  /* ── Summary (AI) ─────────────────────────────────────────────────────────
     2026-09-16, Monil/Vishal: "add AI summary in both course content and
     faculty feedback... it would be like a paragraph, 3-4 line paragraph...
     the first component."
     ONE CARD INSTANCE, TWO PLACEMENTS: the text (`aiSummaryText`) simply
     re-reads whatever `facultyScope` has already resolved to — the whole
     offering on the Course tab (`facultyScope === 'course'`), one named
     instructor on the Faculty tab (which since 2026-09-15 always resolves to
     exactly one chip). A role filter that matches 2+ people leaves
     `scopedInstructor` null and the course-scoped paragraph stands in, which
     is still true of what that view shows. Since 2026-09-17 the CARD itself
     renders differently per tab, both as the `summaryHeader` argument
     `renderOverviewContent` places inside its own grid: bare on Course
     (stacked, unchanged shape), paired side-by-side with
     `scopedFacultyScoreCard` on Faculty — see the Faculty `TabsContent` for
     why.

     THE COPY IS A PLACEHOLDER. There is no summariser service behind this
     surface, and Monil's real copy has not landed yet ("I'll give you the
     content"). What IS real is every number and theme interpolated below:
     the response counts off the survey record, the section average and term
     benchmark the KPI tiles read, the actual lowest/highest scored question
     from `breakdownRows`, and the top comment clusters `deriveThemes` already
     produced for Highlights / Scope for improvement. So it reads as a genuine
     summary of THIS record rather than filler, and the numbers can never
     contradict the cards underneath it.
     SWAPPING IN REAL COPY: each scope is a single template literal
     (`courseSummaryText` / `facultySummaryText`) — one string edit per scope,
     no logic to unpick. */
  /** Question label as prose — the template authors end questions with a full
   *  stop, which reads as a stray period inside a quoted phrase. */
  const stripPeriod = (s: string) => s.replace(/\.\s*$/, '')
  const summaryRated = breakdownRows.filter(
    (r): r is BreakdownRow & { avg: number } => r.kind === 'rated' && typeof r.avg === 'number',
  )
  const summaryExtremes = (rows: (BreakdownRow & { avg: number })[]) => {
    if (rows.length === 0) return null
    const sorted = [...rows].sort((a, b) => a.avg - b.avg)
    return { low: sorted[0], high: sorted[sorted.length - 1] }
  }
  /** Prose, not a signed chip: "0.10 above the term average" / "level with the
   *  term average". Below-term never gets loaded or red-coded language on a
   *  rating surface (Aarti). */
  const summaryVsTerm = (avg: number | null, term: number | null) => {
    if (avg == null || term == null) return null
    const d = avg - term
    if (Math.abs(d) < 0.005) return 'level with the term average'
    return `${Math.abs(d).toFixed(2)} ${d > 0 ? 'above' : 'below'} the term average`
  }
  const summaryStrengthTheme = highlightThemes[0]?.label ?? null
  const summaryAskTheme = concernThemes[0]?.label ?? null
  const summaryThemeSentence = summaryStrengthTheme && summaryAskTheme
    ? ` Written comments point the same way: ${summaryStrengthTheme.toLowerCase()} draws the most praise, and ${summaryAskTheme.toLowerCase()} is the most repeated request.`
    : summaryStrengthTheme
      ? ` Written comments cluster on ${summaryStrengthTheme.toLowerCase()} as the clearest strength.`
      : summaryAskTheme
        ? ` Written comments cluster on ${summaryAskTheme.toLowerCase()} as the most repeated request.`
        : ''
  const summaryCohort = `${survey.responseCount} of ${survey.enrollmentCount} students responded (${result.responseRate}%)`
  const summaryRange = (rows: (BreakdownRow & { avg: number })[]) => {
    const ex = summaryExtremes(rows)
    if (!ex || ex.low.id === ex.high.id) return ''
    return ` Question scores run from ${ex.low.avg.toFixed(1)} on “${stripPeriod(ex.low.label)}” to ${ex.high.avg.toFixed(1)} on “${stripPeriod(ex.high.label)}”.`
  }
  const courseSummaryText =
    `${survey.courseCode} ${survey.courseName} ran in ${survey.term}, and ${summaryCohort}.` +
    (courseAvg != null
      ? ` Course content averages ${courseAvg.toFixed(2)} of 5${
          termCourseAvg != null ? `, ${summaryVsTerm(courseAvg, termCourseAvg)} of ${termCourseAvg.toFixed(2)}` : ''
        }.`
      : '') +
    summaryRange(summaryRated.filter((r) => r.group === 'Course')) +
    summaryThemeSentence
  const facultySummaryText = scopedInstructor
    ? `${scopedInstructor.name} is one of ${survey.instructors.length} instructor${
        survey.instructors.length !== 1 ? 's' : ''
      } evaluated on ${survey.courseCode} ${survey.courseName} in ${survey.term}, where ${summaryCohort}.` +
      (scopedFacultyOwnAvg != null
        ? ` The faculty questions scored against this instructor average ${scopedFacultyOwnAvg.toFixed(2)} of 5${
            termFacultyAvg != null
              ? `, ${summaryVsTerm(scopedFacultyOwnAvg, termFacultyAvg)} of ${termFacultyAvg.toFixed(2)}`
              : ''
          }.`
        : ' No faculty questions have been scored for this instructor yet.') +
      summaryRange(summaryRated.filter((r) => r.group === 'Faculty')) +
      summaryThemeSentence
    : null
  /* Hand-authored 2-sentence insight per evaluatee wins when one exists
   * (`MOCK_SCOPE_AI_SUMMARY`, Monil's University of Nursing brief, 2026-09-16);
   * the number-templated prose above is the fallback for every other record. */
  /* The Faculty tab never falls through to the COURSE paragraph (its caption
   * says "Faculty evaluation" — the body must agree): a blended 2+ instructor
   * scope gets a faculty-scoped sentence instead (state-review, 2026-09-17). */
  const aiSummaryText =
    MOCK_SCOPE_AI_SUMMARY[scopedInstructor ? `${survey.id}:${scopedInstructor.id}` : survey.id] ??
    facultySummaryText ??
    (facultyScope === 'course'
      ? courseSummaryText
      : `${matchedInstructors.length} instructors were evaluated on ${survey.courseCode} ${survey.courseName} in ${survey.term}, where ${summaryCohort}. Pick one instructor above to read their own summary.`)

  /* `overviewContent` is now a function of what renders as the FIRST item in
   * the left column, ahead of `#scores` (`summaryHeader`). Course tab passes
   * a bare `<ScopeAiSummaryCard>` (original stacked shape, unchanged).
   * Faculty tab passes the side-by-side Score+Summary row (2026-09-17: "the
   * rating and ai summary is side by side, not one after the other").
   * EITHER WAY the header now renders INSIDE this grid, not above it
   * (2026-09-17 follow-up: "make the score, summary with a compact width so
   * that on this page can be updated") — previously Faculty's header sat
   * full-width ABOVE this fragment, so the rail column had nothing beside it
   * until `#scores` below, leaving a blank gap next to the header. Putting
   * the header inside the grid's left column means the rail starts flush
   * with it, and the header itself is naturally narrower (page width minus
   * the 260px rail column) rather than full bleed. */
  const renderOverviewContent = (summaryHeader: React.ReactNode) => (
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

              {/* Summary header — the first component in the tab body, above
                  Highlights / Scope for improvement (2026-09-16). Carries no
                  anchor id on purpose: it sits at the very top of the body, so
                  adding it to the jump menu and the `activeAnchor` rail would
                  buy a scroll target the reader already starts on. */}
              {summaryHeader}

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
                {sectionRows.length > 0 ? (
                  <SectionBoxplotChart
                    sections={sectionRows}
                    partial={inCollection}
                    scopeLabel={tabScopeLabel}
                  />
                ) : (
                  <p className="text-sm text-muted-foreground">No scored sections for this scope yet.</p>
                )}
              </div>

              {/* Question breakdown — open by default (2026-09-16); the
                  card itself is still a real Collapsible so the anchor rail
                  can force it open before scrolling and a reader can still
                  fold the whole card away, but every question inside it is
                  now a plain always-visible row (2026-09-17), not its own
                  Accordion. */}
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
                        {breakdownRows.length === 0 && (
                          <p className="text-sm text-muted-foreground">No scored questions for this scope yet.</p>
                        )}
                        <QuestionBreakdownTable
                          rows={breakdownRows}
                          surveyId={survey.id}
                          groupMeta={groupMeta}
                          canModerate={isPD}
                          commentPool={viewerComments}
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
                              g.key === 'Faculty' && scopedFacultyLabel
                                ? `Faculty evaluation · ${scopedFacultyLabel}`
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
          `${result.academicYear ? termSeason(result.term) : result.term}${result.academicYear ? ` · AY ${result.academicYear}` : ''} · ${result.program}${survey.cohort ? ` · ${survey.cohort}` : ''}${survey.courseType ? ` · ${survey.courseType[0].toUpperCase()}${survey.courseType.slice(1)}` : ''}${survey.openDate ? ` · Eval window ${survey.openDate} – ${survey.deadline}` : ''}`
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
                not sharing a row with the main Overview/Course/Faculty
                TabsList (Romit: "the tabs were supposed to be inside the
                faculty tab, not beside the main tabs") — it's a Faculty-tab
                concept (WHICH instructor), not a page-level nav control. */}
            <div className="flex items-center justify-between gap-3 border-b border-border">
              <TabsList variant="line">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                {/* "Course Content" / "Faculty" — the two evaluation types by
                    name (2026-09-17 review: "This tab will be called Course
                    Content. This tab will be called Faculty"). Each tab now
                    shows ONLY its own type's sections, so a course-only split
                    survey has nothing to put on a Faculty tab and drops it. */}
                {templateHasCourse && result.evalScope !== 'instructor' && (
                  <TabsTrigger value="course">Course Content</TabsTrigger>
                )}
                {result.evalScope !== 'course' && <TabsTrigger value="faculty">Faculty</TabsTrigger>}
              </TabsList>
              {/* One Export split-button, beside the tab row, not inside the
                  tab content (Romit, 2026-09-15), visible only where there's
                  something to export (Course/Faculty; Overview has none).
                  Combined from two separate buttons into one (Romit,
                  2026-09-16: "choose between pdf or excel in a chevron icon
                  interaction") — same DropdownMenuTrigger-asChild-Button
                  pattern the header ⋯ menu already uses on this page, not a
                  new component. PDF reuses `printCurrentView`'s tab-scoped
                  print flow; Excel is a real client-side download (see
                  `downloadResultsExcel`). */}
              {(pageTab === 'course' || pageTab === 'faculty') && (
                <div className="flex shrink-0 items-center pb-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">
                        <i className="fa-light fa-file-arrow-down" aria-hidden="true" />
                        Export
                        <i className="fa-light fa-chevron-down text-xs" aria-hidden="true" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onSelect={printCurrentView}>
                        <i className="fa-light fa-file-arrow-down" aria-hidden="true" />
                        Export PDF
                      </DropdownMenuItem>
                      <DropdownMenuItem onSelect={() => downloadResultsExcel(result.courseCode, sectionRows, breakdownRows)}>
                        <i className="fa-light fa-file-export" aria-hidden="true" />
                        Export Excel
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
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
                `renderOverviewContent`); the content itself already
                conditionally shows/hides Course-Content vs Faculty-Performance
                regions based on `facultyScope`, which `pageTab` keeps in sync
                with. Keeps its own Summary card, stacked as the first item
                (unchanged shape). ── */}
            <TabsContent value="course" className="m-0 flex flex-col gap-4">
              {renderOverviewContent(<ScopeAiSummaryCard text={aiSummaryText} scopeLabel={tabScopeLabel} />)}
            </TabsContent>

            {/* ── Faculty ── segmented Tabs (not the primary row's own
                underline chrome — 2026-09-17 follow-up: "the secondary tabs
                isn't distinguishing from the primary tabs"; see
                FacultyScopeSelector's own comment), one trigger per
                instructor, no "All faculty" (2026-09-15 spec: "each chip:
                same as course"). The selected instructor's own score and the
                Summary card render SIDE BY SIDE ("the rating and ai summary
                is side by side, not one after the other") as the header
                `renderOverviewContent` places inside its own grid — NOT above
                it — so the row is compact (page width minus the rail column,
                not full bleed) and "On this page" starts flush beside it
                instead of lower down next to blank space (2026-09-17: "make
                the score, summary with a compact width so that on this page
                can be updated"). The Score half is `scopedFacultyScoreCard` —
                the SAME `ChartCard variant="kpi-chart"` tile the top KPI band
                uses (2026-09-17: "don't like this crowded layout" ruled out
                a hand-rolled flex row in this narrow a column) — null on a
                solo-instructor offering or an ambiguous role-filter scope,
                where the Summary card alone still carries the row. */}
            <TabsContent value="faculty" className="m-0 flex flex-col gap-4">
              <div className="shrink-0 pt-1">{facultyScopeSelector}</div>
              {renderOverviewContent(
                scopedFacultyScoreCard ? (
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-[minmax(0,220px)_minmax(0,1fr)]">
                    {scopedFacultyScoreCard}
                    <ScopeAiSummaryCard text={aiSummaryText} scopeLabel={tabScopeLabel} />
                  </div>
                ) : (
                  <ScopeAiSummaryCard text={aiSummaryText} scopeLabel={tabScopeLabel} />
                ),
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Ops dialogs — same flows as the evaluations table row actions */}
      <SendReminderDialog open={remindOpen} onOpenChange={setRemindOpen} surveys={[survey]} />
      <EditEndDateDialog open={extendOpen} onOpenChange={setExtendOpen} surveys={[survey]} />
    </>
  )
}
