// ============================================================================
// At-risk course evaluation — single source of truth for the threshold.
// Consumed by DashboardMonitor + LiveCollectionCard on the Dashboard home.
// (atRiskFromLive/REMINDER_THRESHOLD retired Jul 2026 with the card-only
// dashboard — the worklist now lives in LiveCollectionCard.)
// ============================================================================

/** At-risk tier — flags any live course below this in the monitor + worklist. */
export const AT_RISK_THRESHOLD = 60
