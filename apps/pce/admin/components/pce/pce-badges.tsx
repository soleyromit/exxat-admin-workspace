'use client'

import {
  StatusBadge,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  STATUS_BADGE_TONE_CLASS,
  STATUS_BADGE_SEMANTIC_SM_SHELL,
  STATUS_BADGE_SEMANTIC_MD_SHELL,
} from '@exxatdesignux/ui'
import type { StatusBadgeTone } from '@exxatdesignux/ui'
import { cn } from '@/lib/utils'
import { ListHubStatusBadge } from '@/components/list-hub-status-badge'
import type { SurveyStatus } from '@/lib/pce-mock-data'
import type { StoryStatus } from '@/lib/pce-push-validation'
import type { StatusTint } from '@/lib/list-status-badges'
import {
  LIST_HUB_STATUS_TINT_SUCCESS,
  LIST_HUB_STATUS_TINT_WARNING,
  LIST_HUB_STATUS_TINT_NEUTRAL,
  LIST_HUB_STATUS_TINT_INFO,
  LIST_HUB_STATUS_TINT_PLANNED,
  LIST_HUB_STATUS_TINT_COMPLETED,
} from '@/lib/list-status-badges'

// ── CourseOffering status ─────────────────────────────────────────────────────
/** AI sentiment chips — one vocabulary for every comment / written-response
 *  surface ('concern' renders amber "Constructive", never red). */
export const SENTIMENT_CHIP = {
  positive: { label: 'Positive', tone: 'success' },
  concern: { label: 'Constructive', tone: 'warning' },
  neutral: { label: 'Neutral', tone: 'neutral' },
} as const satisfies Record<string, { label: string; tone: StatusBadgeTone }>

export const OFFERING_STATUS_BADGE: Record<string, { tint: StatusTint; icon: string; label: string }> = {
  planned:   { tint: LIST_HUB_STATUS_TINT_PLANNED,   icon: 'fa-calendar-days', label: 'Planned'   },
  active:    { tint: LIST_HUB_STATUS_TINT_SUCCESS,   icon: 'fa-circle-check',  label: 'Active'    },
  completed: { tint: LIST_HUB_STATUS_TINT_COMPLETED, icon: 'fa-flag-checkered',label: 'Completed' },
  archived:  { tint: LIST_HUB_STATUS_TINT_NEUTRAL,   icon: 'fa-box-archive',   label: 'Archived'  },
}
export function OfferingStatusBadge({ status }: { status: string }) {
  const s = OFFERING_STATUS_BADGE[status] ?? OFFERING_STATUS_BADGE.active
  return <ListHubStatusBadge label={s.label} tint={s.tint} icon={s.icon} />
}

// ── Student enrollment status ─────────────────────────────────────────────────
export const ENROLLMENT_STATUS_BADGE: Record<string, { tint: StatusTint; icon: string; label: string }> = {
  enrolled:   { tint: LIST_HUB_STATUS_TINT_SUCCESS,   icon: 'fa-circle-check',  label: 'Enrolled'   },
  graduated:  { tint: LIST_HUB_STATUS_TINT_COMPLETED, icon: 'fa-graduation-cap',label: 'Graduated'  },
  withdrawn:  { tint: LIST_HUB_STATUS_TINT_NEUTRAL,   icon: 'fa-circle-xmark',  label: 'Withdrawn'  },
  'on-leave': { tint: LIST_HUB_STATUS_TINT_WARNING,   icon: 'fa-circle-pause',  label: 'On Leave'   },
}
export function EnrollmentStatusBadge({ status }: { status: string }) {
  const s = ENROLLMENT_STATUS_BADGE[status] ?? ENROLLMENT_STATUS_BADGE.enrolled
  return <ListHubStatusBadge label={s.label} tint={s.tint} icon={s.icon} />
}

// ── Survey status ─────────────────────────────────────────────────────────────
// ONE vocabulary across the app (2026-07-08 unification — the dashboard, hub,
// and results pages previously ran three string sets for the same states):
// Draft → Scheduled → Live → In review → Released.
// 2026-08-13 (Granola 0ef80c33, Vishal, raw transcript: "the message that we
// want to give is that this survey has been closed... I am just saying that
// the headers here should match the statuses there because it's the same
// information") — these labels used to read "In review" / "Released" here
// while term-evaluations-board.tsx's own column headers said "Closed ·
// Pending review" / "Results available" for the exact same states. Adopted
// the board's wording (it states both facts — closed AND awaiting review —
// where "In review" alone didn't say what was closed) everywhere this map is
// read, not just the term page, so the table/board/dashboard/results/remind
// screens that all share SURVEY_STATUS_BADGE stay in sync by construction.
export const SURVEY_STATUS_BADGE: Record<SurveyStatus, { tint: StatusTint; icon: string; label: string }> = {
  draft:          { tint: LIST_HUB_STATUS_TINT_NEUTRAL,   icon: 'fa-pen-ruler',      label: 'Draft'     },
  scheduled:      { tint: LIST_HUB_STATUS_TINT_PLANNED,   icon: 'fa-calendar',       label: 'Scheduled' },
  active:         { tint: LIST_HUB_STATUS_TINT_SUCCESS,   icon: 'fa-circle-dot',     label: 'Live'      },
  collecting:     { tint: LIST_HUB_STATUS_TINT_SUCCESS,   icon: 'fa-circle-dot',     label: 'Live'      },
  pending_review: { tint: LIST_HUB_STATUS_TINT_WARNING,   icon: 'fa-hourglass-half', label: 'Closed · Pending review' },
  closed:         { tint: LIST_HUB_STATUS_TINT_WARNING,   icon: 'fa-hourglass-half', label: 'Closed · Pending review' },
  released:       { tint: LIST_HUB_STATUS_TINT_COMPLETED, icon: 'fa-circle-check',   label: 'Results available' },
  archived:       { tint: LIST_HUB_STATUS_TINT_NEUTRAL,   icon: 'fa-box-archive',    label: 'Archived' },
}

export function SurveyStatusBadge({ status }: { status: SurveyStatus }) {
  const s = SURVEY_STATUS_BADGE[status]
  return <ListHubStatusBadge label={s.label} tint={s.tint} icon={s.icon} />
}

// ── Survey lifecycle stage — canonical grouping bucket ────────────────────────
// The five stages Aarti confirmed (2026-08-12, 1:39 PM, Granola 0ef80c33:
// "I'm aligned with the five stages"). Single source for every surface that
// BUCKETS survey rows by lifecycle stage rather than rendering the raw
// per-status badge above — surveys-hub.tsx's grouped table and
// term-evaluations-board.tsx's board columns each kept their own copy of
// this bucketing and had drifted out of sync (the table grouped `closed`
// with `released` under "Results Available"; the board and the badge map
// above both group it with `pending_review` under "Closed · Pending
// review") — the exact table/board vocabulary mismatch she flagged live.
export type SurveyStage = 'draft' | 'scheduled' | 'live' | 'closed_review' | 'released' | 'archived'

export const SURVEY_STAGE: Record<SurveyStatus, SurveyStage> = {
  draft:          'draft',
  scheduled:      'scheduled',
  active:         'live',
  collecting:     'live',
  pending_review: 'closed_review',
  closed:         'closed_review',
  released:       'released',
  archived:       'archived',
}

export const SURVEY_STAGE_LABEL: Record<SurveyStage, string> = {
  draft:         'Draft',
  scheduled:     'Scheduled',
  live:          'Live',
  closed_review: 'Closed · Pending review',
  released:      'Results available',
  archived:      'Archived',
}

// Urgency order for list groupings — items needing action surface first.
// Archived trails everything: inert, nothing to act on (2026-08-17, Task 2).
export const SURVEY_STAGE_ORDER: SurveyStage[] = ['closed_review', 'released', 'live', 'scheduled', 'draft', 'archived']

// ── DS OS survey status badge ─────────────────────────────────────────────────
// Same canonical labels/icons as SURVEY_STATUS_BADGE, rendered through the DS
// StatusBadge organism (semantic tone) instead of the local ListHubStatusBadge.
// New surfaces (dashboard, /results) use this; existing hubs migrate in a sweep.
const SURVEY_STATUS_TONE: Record<SurveyStatus, StatusBadgeTone> = {
  draft:          'neutral',
  scheduled:      'info',
  active:         'success',
  collecting:     'success',
  pending_review: 'warning',
  closed:         'warning',
  released:       'success',
  archived:       'neutral',
}

export function SurveyStatusBadgeOS({
  status,
  size = 'sm',
  compact = false,
}: {
  status: SurveyStatus
  size?: 'sm' | 'md'
  /** Icon-only pill + Tooltip for the full label — for tight rows where the
   *  identity block and a long status label (e.g. "Results available") can't
   *  both fit on one line (Romit: "results available text needs to be short
   *  or just icon based with tooltip, so that it is in one line"). Same
   *  tone/icon as the full badge, just without the visible text; the label
   *  survives as the tooltip content and the span's `aria-label`. */
  compact?: boolean
}) {
  const s = SURVEY_STATUS_BADGE[status]
  if (compact) {
    const shell = size === 'md' ? STATUS_BADGE_SEMANTIC_MD_SHELL : STATUS_BADGE_SEMANTIC_SM_SHELL
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            role="img"
            aria-label={s.label}
            className={cn('rounded-4xl justify-center', shell, STATUS_BADGE_TONE_CLASS[SURVEY_STATUS_TONE[status]])}
          >
            <i className={`fa-light ${s.icon} text-xs`} aria-hidden="true" />
          </span>
        </TooltipTrigger>
        <TooltipContent>{s.label}</TooltipContent>
      </Tooltip>
    )
  }
  return <StatusBadge label={s.label} tone={SURVEY_STATUS_TONE[status]} icon={s.icon} size={size} />
}

// ── ST-02 story-status badge ──────────────────────────────────────────────────
// The push wizard's ST-02 surfaces (Step 1's "Existing survey" preview / ST-01)
// read survey status through the DERIVED storyStatusOf() mapper
// (pce-push-validation.ts), whose six-state vocabulary — Draft / Scheduled /
// Live / Closed / Results Available / Archived — includes states the raw
// SurveyStatus badges above have no words for. Same visual language as
// SurveyStatusBadgeOS (DS StatusBadge, matching tones/icons where the states
// coincide), different key; the raw-status badges stay untouched app-wide.
const STORY_STATUS_BADGE: Record<StoryStatus, { tone: StatusBadgeTone; icon: string; label: string }> = {
  draft:             { tone: 'neutral', icon: 'fa-pen-ruler',      label: 'Draft' },
  scheduled:         { tone: 'info',    icon: 'fa-calendar',       label: 'Scheduled' },
  live:              { tone: 'success', icon: 'fa-circle-dot',     label: 'Live' },
  closed:            { tone: 'warning', icon: 'fa-hourglass-half', label: 'Closed' },
  results_available: { tone: 'success', icon: 'fa-circle-check',   label: 'Results Available' },
  archived:          { tone: 'neutral', icon: 'fa-box-archive',    label: 'Archived' },
}

export function StoryStatusBadgeOS({
  status,
  size = 'sm',
}: {
  status: StoryStatus
  size?: 'sm' | 'md'
}) {
  const s = STORY_STATUS_BADGE[status]
  return <StatusBadge label={s.label} tone={s.tone} icon={s.icon} size={size} />
}

/** "YYYY-MM-DD" → "Dec 4" / "December 4, 2026" without the UTC-midnight shift. */
function fmtOpenDate(iso: string, style: 'short' | 'long'): string | null {
  const [y, m, d] = iso.split('-').map(Number)
  if (!y || !m || !d) return null
  return new Date(y, m - 1, d).toLocaleDateString(
    'en-US',
    style === 'short'
      ? { month: 'short', day: 'numeric' }
      : { month: 'long', day: 'numeric', year: 'numeric' },
  )
}

/** Scheduled surveys where the DATE is the fact that matters (push wizard,
 *  inline rows): "Opens Dec 4" with the canonical status word in the tooltip.
 *  Two renderings — `inline` tucks the fact into a row's secondary meta line
 *  as muted icon + text (Linear/Todoist model: the right rail stays
 *  action-only), the default is a StatusBadge in the scheduled tone. Every
 *  other status, and a scheduled survey with no date, renders the plain
 *  SurveyStatusBadgeOS so the app-wide vocabulary stays one set. */
export function SurveyStatusDateBadgeOS({
  status,
  openDate,
  size = 'sm',
  inline = false,
}: {
  status: SurveyStatus
  openDate?: string
  size?: 'sm' | 'md'
  inline?: boolean
}) {
  const short = status === 'scheduled' && openDate ? fmtOpenDate(openDate, 'short') : null
  if (!short) return <SurveyStatusBadgeOS status={status} size={size} />
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        {inline ? (
          <span className="inline-flex items-center gap-1 cursor-default whitespace-nowrap text-xs text-muted-foreground">
            <i className="fa-light fa-calendar-day text-xs" aria-hidden="true" />
            <span className="tabular-nums">Opens {short}</span>
            <span className="sr-only">, scheduled</span>
          </span>
        ) : (
          <span className="inline-flex cursor-default">
            <StatusBadge
              label={`Opens ${short}`}
              tone={SURVEY_STATUS_TONE.scheduled}
              icon="fa-calendar-day"
              size={size}
            />
            <span className="sr-only">, scheduled</span>
          </span>
        )}
      </TooltipTrigger>
      <TooltipContent>
        Scheduled to open to students on {fmtOpenDate(openDate!, 'long')}.
      </TooltipContent>
    </Tooltip>
  )
}
