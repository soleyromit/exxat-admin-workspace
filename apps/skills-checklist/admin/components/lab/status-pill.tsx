"use client"

/**
 * The one status pill for lab screens (consistency audit item 1). Every pill is DS StatusBadge size="sm"; the word, icon and
 * tone come from lib/v2/labels.ts and nowhere else. Amber ("warning") only for shortfall (does not qualify, returned);
 * every other state is neutral, so a page keeps one state hue.
 */
import * as React from "react"
import { StatusBadge } from "@exxatdesignux/ui/components/ui/status-badge"
import { EVALUATOR_NAME_LABEL, OUTCOME_LABEL, OVERLAY_LABEL, RECORD_STATE_META, type RecordStateKey } from "@/lib/v2/labels"

export function StateBadge({ state, detail }: { state: RecordStateKey; detail?: string }) {
  const m = RECORD_STATE_META[state]
  return <StatusBadge label={detail ? `${m.label} ${detail}` : m.label} tone={m.tone} icon={m.icon} size="sm" />
}

const OVERLAY_META: Record<keyof typeof OVERLAY_LABEL, { icon: string; tone: "neutral" | "warning" }> = {
  awaitingApproval: { icon: "fa-hourglass-half", tone: "neutral" },
  waiting: { icon: "fa-clock", tone: "neutral" },
  returned: { icon: "fa-arrow-rotate-left", tone: "warning" },
}

export function OverlayBadge({ overlay, detail }: { overlay: keyof typeof OVERLAY_LABEL; detail?: string }) {
  const m = OVERLAY_META[overlay]
  return <StatusBadge label={detail ? `${OVERLAY_LABEL[overlay]} ${detail}` : OVERLAY_LABEL[overlay]} tone={m.tone} icon={m.icon} size="sm" />
}

const OUTCOME_ICON: Record<keyof typeof OUTCOME_LABEL, string> = { met: "fa-circle-check", "not-met": "fa-circle-xmark", "not-yet": "fa-circle-half-stroke" }

export function OutcomeBadge({ outcome }: { outcome: keyof typeof OUTCOME_LABEL }) {
  return <StatusBadge label={OUTCOME_LABEL[outcome]} tone="neutral" icon={OUTCOME_ICON[outcome]} size="sm" />
}

export function EvaluatorNameBadge({ verified }: { verified: boolean }) {
  return verified ? <StatusBadge label={EVALUATOR_NAME_LABEL.verified} tone="neutral" icon="fa-user-check" size="sm" /> : <StatusBadge label={EVALUATOR_NAME_LABEL.unverified} tone="warning" icon="fa-user-clock" size="sm" />
}
