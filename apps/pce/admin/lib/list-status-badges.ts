/**
 * Status badge style configs — mirrors EM's AssessmentStatusBadge token family.
 * Pass to ListHubStatusBadge as `tint`.
 */

export interface StatusTint {
  bg: string
  fg: string
  border: string
}

export const LIST_HUB_STATUS_TINT_SUCCESS: StatusTint = {
  bg:     'var(--qb-status-saved-bg)',
  fg:     'var(--qb-status-saved-fg)',
  border: 'var(--qb-status-saved-border)',
}

export const LIST_HUB_STATUS_TINT_WARNING: StatusTint = {
  bg:     'var(--qb-status-draft-bg)',
  fg:     'var(--qb-status-draft-fg)',
  border: 'var(--qb-status-draft-border)',
}

export const LIST_HUB_STATUS_TINT_NEUTRAL: StatusTint = {
  bg:     'var(--qb-status-archived-bg)',
  fg:     'var(--qb-status-archived-fg)',
  border: 'var(--qb-status-archived-border)',
}

export const LIST_HUB_STATUS_TINT_INFO: StatusTint = {
  bg:     'var(--qb-status-review-bg)',
  fg:     'var(--qb-status-review-fg)',
  border: 'var(--qb-status-review-border)',
}

export const LIST_HUB_STATUS_TINT_PLANNED: StatusTint = {
  bg:     'var(--qb-status-planned-bg)',
  fg:     'var(--qb-status-planned-fg)',
  border: 'var(--qb-status-planned-border)',
}

export const LIST_HUB_STATUS_TINT_COMPLETED: StatusTint = {
  bg:     'var(--qb-status-completed-bg)',
  fg:     'var(--qb-status-completed-fg)',
  border: 'var(--qb-status-completed-border)',
}
