"use client"

/**
 * Shared frame for the three Evaluation settings layouts (Proposed 2026-11-02): loading, the banner, the one Save in the footer and
 * the apply confirmation. Each layout only arranges the five groups (components/lab/configure/program-parts.tsx).
 */
import * as React from "react"
import { Skeleton } from "@exxatdesignux/ui/components/ui/skeleton"
import { StickyFooter } from "@/components/lab/layout"
import { PageFrame } from "@/components/skills/page-header"
import { focusField } from "./use-configure"
import { ProgramBanners, useProgramSave, useProgramSettings, type ProgramModel, type TimesEdits } from "./program-parts"
import type { RuleIssue } from "@/lib/lab/configure"

export const EVALUATION_SETTINGS_TITLE = "Evaluation settings"

export interface ProgramPage {
  m: ProgramModel
  edits: TimesEdits
  setEdits: React.Dispatch<React.SetStateAction<TimesEdits>>
}

/** Page frame: title, banner, the layout, a sticky footer with the one Save, the confirmation. `onIssue` lets a layout reveal a group. */
export function ProgramSettingsFrame({ children, onIssue }: { children: (p: ProgramPage) => React.ReactNode; onIssue?: (i: RuleIssue) => void }) {
  const m = useProgramSettings()
  const s = useProgramSave(m, (i) => {
    onIssue?.(i)
    requestAnimationFrame(() => requestAnimationFrame(() => focusField(i.field)))
  })
  if (m.loading) {
    return (
      <PageFrame title={EVALUATION_SETTINGS_TITLE}>
        <Skeleton className="h-96 w-full" aria-label="Loading" />
      </PageFrame>
    )
  }
  return (
    <div className="flex min-h-[calc(100dvh-5.5rem)] w-full flex-col" data-page-type="form">
      <PageFrame title={EVALUATION_SETTINGS_TITLE} className="flex-1">
        <ProgramBanners m={m} onApplyNew={s.applyNew} />
        {children({ m, edits: s.edits, setEdits: s.setEdits })}
        <StickyFooter className="mt-auto" primary={{ label: m.saved ? "Save changes" : "Save settings", onClick: s.save, disabled: !s.changed || s.invalid }} />
      </PageFrame>
      {s.dialog}
    </div>
  )
}
