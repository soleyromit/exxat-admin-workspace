"use client"

import * as React from "react"
import { StatusBadge } from "@exxatdesignux/ui"
import type { SkillStatusDisplay } from "@/lib/domain/types"
import type { SkillState } from "@/lib/engine"
import { statusPillLabel } from "@/lib/copy"
import { usePrefs } from "@/lib/store/react"

/**
 * The ONE place skill-record status is rendered (cross-cutting §5). It reads the engine's four-state enum and the single
 * `skillStatusDisplay` flag (OD-03 is OPEN): "four" shows four distinct labels, "merged" shows states 1 and 2 as "Not met".
 * Status is ALWAYS text; colour is supporting only (WCAG 1.4.1) and never red (Aarti: no red in score or rating viz).
 */
type Tone = "success" | "warning" | "info" | "danger" | "neutral"

const TONE: Record<SkillState, Tone> = {
  noEvidence: "neutral",
  evidenceDoesNotQualify: "warning",
  partial: "info",
  achieved: "success",
}
const ICON: Record<SkillState, string> = {
  noEvidence: "fa-circle-minus",
  evidenceDoesNotQualify: "fa-circle-exclamation",
  partial: "fa-circle-half-stroke",
  achieved: "fa-circle-check",
}

export function skillStatusTone(state: SkillState, display: SkillStatusDisplay): Tone {
  // Merged "Not met" covers two states; one tone so the same words never carry two colours.
  if (display === "merged" && (state === "noEvidence" || state === "evidenceDoesNotQualify")) return "warning"
  return TONE[state]
}

export interface SkillStatusBadgeViewProps {
  state: SkillState
  display: SkillStatusDisplay
  size?: "sm" | "md"
  className?: string
}

/** Pure view: explicit display flag. Use this in tests and anywhere the flag is already in hand. */
export function SkillStatusBadgeView({ state, display, size = "sm", className }: SkillStatusBadgeViewProps) {
  return <StatusBadge label={statusPillLabel(state, display)} tone={skillStatusTone(state, display)} icon={ICON[state]} size={size} className={className} />
}

/** Reads the display flag from the per-browser preferences. */
export function SkillStatusBadge({ state, size, className }: { state: SkillState; size?: "sm" | "md"; className?: string }) {
  const { skillStatusDisplay } = usePrefs()
  return <SkillStatusBadgeView state={state} display={skillStatusDisplay} size={size} className={className} />
}
