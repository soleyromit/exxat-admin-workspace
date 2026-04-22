/**
 * Shared status chip style constants for schedule components.
 * Used by schedule-card, schedule-list-view, and schedule-calendar-view.
 */

export const SCHEDULE_STATUS_STYLES = {
  payment: "bg-chart-4/10 text-chip-4 border-chip-4/40",
  /** Icon uses chart-4 (high-luminance) for contrast vs red tint — protan/deutan friendly cue */
  destructive:
    "schedule-status-destructive-warn-icon border-chip-destructive/40 bg-destructive/10 text-chip-destructive",
  /** Green compliant chip — fill is `.schedule-status-compliant` in globals.css (solid OKLCH; not Tailwind bg-*) */
  compliant: "schedule-status-compliant border font-medium",
  muted: "border-border bg-muted/50 text-muted-foreground",
} as const;
