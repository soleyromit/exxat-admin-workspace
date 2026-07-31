'use client'

import { StatusBadge, Tooltip, TooltipContent, TooltipTrigger } from '@exxatdesignux/ui'
import type { StatusBadgeTone } from '@exxatdesignux/ui'
import { ListHubStatusBadge } from '@/components/list-hub-status-badge'
import type { SurveyStatus } from '@/lib/pce-mock-data'
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
export const SURVEY_STATUS_BADGE: Record<SurveyStatus, { tint: StatusTint; icon: string; label: string }> = {
  draft:          { tint: LIST_HUB_STATUS_TINT_NEUTRAL,   icon: 'fa-pen-ruler',      label: 'Draft'     },
  scheduled:      { tint: LIST_HUB_STATUS_TINT_PLANNED,   icon: 'fa-calendar',       label: 'Scheduled' },
  active:         { tint: LIST_HUB_STATUS_TINT_SUCCESS,   icon: 'fa-circle-dot',     label: 'Live'      },
  collecting:     { tint: LIST_HUB_STATUS_TINT_SUCCESS,   icon: 'fa-circle-dot',     label: 'Live'      },
  pending_review: { tint: LIST_HUB_STATUS_TINT_WARNING,   icon: 'fa-hourglass-half', label: 'In review' },
  closed:         { tint: LIST_HUB_STATUS_TINT_WARNING,   icon: 'fa-hourglass-half', label: 'In review' },
  released:       { tint: LIST_HUB_STATUS_TINT_COMPLETED, icon: 'fa-circle-check',   label: 'Released'  },
}

export function SurveyStatusBadge({ status }: { status: SurveyStatus }) {
  const s = SURVEY_STATUS_BADGE[status]
  return <ListHubStatusBadge label={s.label} tint={s.tint} icon={s.icon} />
}

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
}

export function SurveyStatusBadgeOS({
  status,
  size = 'sm',
}: {
  status: SurveyStatus
  size?: 'sm' | 'md'
}) {
  const s = SURVEY_STATUS_BADGE[status]
  return <StatusBadge label={s.label} tone={SURVEY_STATUS_TONE[status]} icon={s.icon} size={size} />
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
