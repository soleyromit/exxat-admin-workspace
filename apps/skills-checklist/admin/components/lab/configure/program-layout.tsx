"use client"

/**
 * Shared frame for the three Evaluation settings layouts (Proposed 2026-11-02): loading, the banner, the one Save in the header and
 * the apply confirmation. Each layout only arranges the five groups (components/lab/configure/program-parts.tsx).
 */
import { UnsavedChangesGuard } from "@/components/lab/shared/unsaved-guard"
import * as React from "react"
import { Skeleton } from "@exxatdesignux/ui/components/ui/skeleton"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import { PageFrame } from "@/components/skills/page-header"
import { useEmbeddedStep } from "@/components/lab/layout/embedded"
import { focusField } from "./use-configure"
import { ProgramBanners, useProgramSave, useProgramSettings, type ProgramModel, type TimesEdits } from "./program-parts"
import type { RuleIssue } from "@/lib/lab/configure"

export const EVALUATION_SETTINGS_TITLE = "Evaluation settings"

export interface ProgramPage {
  m: ProgramModel
  edits: TimesEdits
  setEdits: React.Dispatch<React.SetStateAction<TimesEdits>>
}

/** Page frame: title with the one Save, banner, the layout, the confirmation. `onIssue` lets a layout reveal a group. */
export function ProgramSettingsFrame({ children, onIssue, focusOf, headerAction, phoneSaveBar }: { children: (p: ProgramPage) => React.ReactNode; onIssue?: (i: RuleIssue) => void; /** The control a problem focuses, when it sits inside a dialog on this layout. */ focusOf?: (i: RuleIssue) => string; /** Beside the one Save: Preview on the plain page (map D3). */ headerAction?: (m: ProgramModel) => React.ReactNode; /** Below 640 px Save leaves the header for a full-width bar at the bottom of the screen (variant B, D-L141). Off by default. */ phoneSaveBar?: boolean }) {
  const m = useProgramSettings()
  const s = useProgramSave(m, (i) => {
    onIssue?.(i)
    requestAnimationFrame(() => requestAnimationFrame(() => focusField(focusOf ? focusOf(i) : i.field)))
  })
  // Inside the Set up skills workflow (D-L44, D-L55) the wizard's "Save and continue" runs this save: same validation, same apply dialog.
  const embedded = useEmbeddedStep()
  const saveRef = React.useRef(s.save)
  saveRef.current = s.save
  const pendingRef = React.useRef(false)
  pendingRef.current = !m.saved || m.dirty
  const register = embedded?.registerPrimary
  React.useEffect(() => {
    if (!register) return
    register(() => { const pending = pendingRef.current; saveRef.current(); return pending })
    return () => register(null)
  }, [register])
  const bar = !!phoneSaveBar && !embedded
  const saveLabel = m.saved ? "Save changes" : "Save settings"
  if (m.loading) {
    return (
      <PageFrame title={EVALUATION_SETTINGS_TITLE}>
        <div aria-busy="true">
          <Skeleton className="h-96 w-full" aria-label="Loading" />
        </div>
      </PageFrame>
    )
  }
  return (
    <div className="flex min-h-[calc(100dvh-5.5rem)] w-full flex-col" data-page-type="form">
      <PageFrame
        title={EVALUATION_SETTINGS_TITLE}
        className="flex-1"
        // Navigation model A (D-L42): the page's one filled action sits in the header; no flow footer.
        // Nothing chosen on a new program: nothing to save yet (map D3, S1).
        actions={<>{headerAction?.(m)}<Button type="button" variant="default" size="sm" className={bar ? "max-sm:hidden" : undefined} onClick={s.save} disabled={!s.changed || s.invalid || !m.rule.model}>{saveLabel}</Button></>}
      >
        <ProgramBanners m={m} onApplyNew={s.applyNew} />
        {children({ m, edits: s.edits, setEdits: s.setEdits })}
        {bar ? <div className="h-20 sm:hidden" aria-hidden="true" /> : null}
      </PageFrame>
      {bar ? (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background px-4 py-3 sm:hidden" data-phone-save-bar>
          <Button type="button" variant="default" size="lg" className="w-full" onClick={s.save} disabled={!s.changed || s.invalid || !m.rule.model}>{saveLabel}</Button>
        </div>
      ) : null}
      {s.dialog}
      {embedded ? null : <UnsavedChangesGuard dirty={m.dirty} onDiscard={m.discard} />}
    </div>
  )
}
