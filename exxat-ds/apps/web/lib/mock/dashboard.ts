// ─────────────────────────────────────────────────────────────────────────────
// Mock data — Dashboard
// ─────────────────────────────────────────────────────────────────────────────

import type { MetricItem, MetricInsight } from "@/components/key-metrics"

export const DASHBOARD_METRICS: MetricItem[] = [
  { id: "pending-requests",     label: "Pending requests",     value: "23",  delta: "+5",  trend: "up",   href: "/data-list#pending"     },
  { id: "confirmed-placements", label: "Confirmed placements", value: "89",  delta: "+12", trend: "up",   href: "/data-list#confirmed"   },
  { id: "pending-reviews",      label: "Pending Reviews",      value: "8",   delta: "-3",  trend: "down", href: "/data-list#reviews"     },
  { id: "available-slots",      label: "Available Slots",      value: "156", delta: "+24", trend: "up",   href: "/data-list#slots"       },
  { id: "new-applications",     label: "New Applications",     value: "34",  delta: "+7",  trend: "up",   href: "/data-list#applications"},
  { id: "compliance-rate",      label: "Compliance Rate",      value: "98%", delta: "+2",  trend: "up",   href: "/data-list#compliance"  },
]

export const DASHBOARD_INSIGHT: MetricInsight = {
  title:       "Review Bottleneck",
  description: "8 reviews pending with 23 new requests waiting. Clear reviews to maintain placement velocity.",
  href:        "/reviews",
  severity:    "warning",
  actionLabel: "Ask Leo",
}

/** Integer scores as whole numbers; decimals to one place. */
export function formatBandScore(n: number) {
  return Number.isInteger(n) ? String(n) : n.toFixed(1)
}

/** Clamp a score to the published min–max scale. */
export function clampScoreToBand(score: number, scaleMin: number, scaleMax: number) {
  return Math.min(scaleMax, Math.max(scaleMin, score))
}

/**
 * Map a score to 0–100 along the band for bar/radial geometry (Recharts domain).
 * When score is outside the band it is clamped for display.
 */
export function scoreToTrackPercent(score: number, scaleMin: number, scaleMax: number): number {
  if (scaleMax <= scaleMin) return 0
  const s = clampScoreToBand(score, scaleMin, scaleMax)
  return Math.min(100, Math.max(0, ((s - scaleMin) / (scaleMax - scaleMin)) * 100))
}

/** One assessment row: student score vs class average on a fixed min–max scale. */
export interface StudentScoreMetric {
  id: string
  label: string
  scaleMin: number
  scaleMax: number
  classAverage: number
  studentScore: number
  /** ChartCard description; defaults to suite `description` */
  description?: string
  /** Pill on the dashed marker (default "Class avg") */
  averageMarkerLabel?: string
}

export interface StudentScoreRadial {
  title: string
  /** Shown under the large center score */
  caption: string
  scaleMin: number
  scaleMax: number
  classAverage: number
  studentScore: number
}

export interface DashboardStudentScoresData {
  title: string
  description?: string
  metrics: StudentScoreMetric[]
  radial: StudentScoreRadial
}

/** Example: student 75 on scale 50–80, class average 60 (same band). */
export const DASHBOARD_STUDENT_SCORES: DashboardStudentScoresData = {
  title: "Student scores",
  description: "Your score vs class average on the published scale (reference).",
  metrics: [
    {
      id: "midterm",
      label: "Midterm exam",
      scaleMin: 50,
      scaleMax: 80,
      classAverage: 60,
      studentScore: 75,
    },
    {
      id: "practical",
      label: "Clinical practical",
      scaleMin: 50,
      scaleMax: 80,
      classAverage: 62,
      studentScore: 71,
    },
  ],
  radial: {
    title: "Term snapshot",
    caption: "Midterm focus",
    scaleMin: 50,
    scaleMax: 80,
    classAverage: 60,
    studentScore: 75,
  },
}
