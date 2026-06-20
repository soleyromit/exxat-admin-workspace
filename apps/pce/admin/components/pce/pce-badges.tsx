'use client'

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
// Canonical survey lifecycle (per spec): Draft → Scheduled → Live →
// Closed, Pending Review → Closed, Results Available → Archived.
// Underlying statuses map onto those display labels.
export const SURVEY_STATUS_BADGE: Record<SurveyStatus, { tint: StatusTint; icon: string; label: string }> = {
  draft:          { tint: LIST_HUB_STATUS_TINT_NEUTRAL,   icon: 'fa-pen-ruler',      label: 'Draft'                     },
  scheduled:      { tint: LIST_HUB_STATUS_TINT_PLANNED,   icon: 'fa-calendar',       label: 'Scheduled'                 },
  active:         { tint: LIST_HUB_STATUS_TINT_SUCCESS,   icon: 'fa-circle-dot',     label: 'Live'                      },
  collecting:     { tint: LIST_HUB_STATUS_TINT_SUCCESS,   icon: 'fa-circle-dot',     label: 'Live'                      },
  pending_review: { tint: LIST_HUB_STATUS_TINT_WARNING,   icon: 'fa-hourglass-half', label: 'Closed, Pending Review'    },
  closed:         { tint: LIST_HUB_STATUS_TINT_WARNING,   icon: 'fa-hourglass-half', label: 'Closed, Pending Review'    },
  released:       { tint: LIST_HUB_STATUS_TINT_COMPLETED, icon: 'fa-circle-check',   label: 'Closed, Results Available' },
}

export function SurveyStatusBadge({ status }: { status: SurveyStatus }) {
  const s = SURVEY_STATUS_BADGE[status]
  return <ListHubStatusBadge label={s.label} tint={s.tint} icon={s.icon} />
}
