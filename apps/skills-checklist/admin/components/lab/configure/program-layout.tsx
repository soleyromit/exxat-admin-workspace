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
export function ProgramSettingsFrame({ children, onIssue, focusOf, headerAction, saveBar }: { children: (p: ProgramPage) => React.ReactNode; onIssue?: (i: RuleIssue) => void; /** The control a problem focuses, when it sits inside a dialog on this layout. */ focusOf?: (i: RuleIssue) => string; /** Beside the one Save: Preview on the plain page (map D3). With `saveBar`, the header holds only this. */ headerAction?: (m: ProgramModel) => React.ReactNode; /** Save and Discard leave the header for one bar pinned to the bottom of the content column at every width, shown while there is something to save (variant B, 2026-11-11). `unsaved` counts the changes for its words. Off by default: other layouts keep Save in the header. */ saveBar?: { unsaved: (m: ProgramModel) => number } }) {
  const m = useProgramSettings()
  const go = (i: RuleIssue) => {
    onIssue?.(i)
    requestAnimationFrame(() => requestAnimationFrame(() => focusField(focusOf ? focusOf(i) : i.field)))
  }
  const s = useProgramSave(m, go)
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
  const bar = !!saveBar && !embedded
  const saveLabel = m.saved ? "Save changes" : "Save settings"
  const saveOff = !s.changed || s.invalid || !m.rule.model
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
        actions={<>{headerAction?.(m)}{bar ? null : <Button type="button" variant="default" size="sm" onClick={s.save} disabled={saveOff}>{saveLabel}</Button>}</>}
      >
        <ProgramBanners m={m} onApplyNew={s.applyNew} />
        {children({ m, edits: s.edits, setEdits: s.setEdits })}
      </PageFrame>
      {/* One Save on the page, pinned to the bottom of the content column while there is something to save: always on a first setup, else only with
          unsaved changes. It sits last in the flow, so nothing is hidden under it at the end of the page and focus reaches it after the last field. */}
      {bar && (!m.saved || s.changed) ? (
        <SaveBar
          m={m}
          unsaved={saveBar!.unsaved(m) + Object.keys(s.edits).length}
          label={saveLabel}
          off={saveOff}
          onSave={s.save}
          onGo={go}
        />
      ) : null}
      {s.dialog}
      {embedded ? null : <UnsavedChangesGuard dirty={m.dirty} onDiscard={m.discard} />}
    </div>
  )
}

/**
 * The page's one Save (2026-11-11, Romit: "I can't see save changes, or other buttons when I am scrolling to the bottom"): sticky at the bottom of the
 * content column, never over the sidebar, inside the shell's one scrollport. Left, what is waiting in neutral words (unsaved is not a problem); after a
 * failed Save, how many problems, as a link to the first. Right, Discard (saved setups only) and Save. Full width under 640 px.
 */
function SaveBar({ m, unsaved, label, off, onSave, onGo }: { m: ProgramModel; unsaved: number; label: string; off: boolean; onSave: () => void; onGo: (i: RuleIssue) => void }) {
  const failing = m.showErrors && m.issues.length > 0
  const n = Math.max(1, unsaved)
  return (
    <section aria-label="Save settings" className="sticky bottom-0 z-20 mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-border bg-background px-4 py-3 sm:px-6" data-save-bar>
      <div className="flex min-w-0 flex-1 items-center gap-2 text-sm text-foreground" aria-live="polite" data-save-bar-status>
        {failing ? (
          <Button type="button" variant="link" size="sm" className="h-auto p-0 text-destructive" onClick={() => onGo(m.issues[0]!)} data-save-bar-problems>
            {`${m.issues.length} to fix before saving`}
          </Button>
        ) : m.saved ? (
          <>
            <i className="fa-light fa-pen text-xs text-muted-foreground" aria-hidden="true" />
            <span data-unsaved-count>{`${n} unsaved ${n === 1 ? "change" : "changes"}`}</span>
          </>
        ) : (
          <span className="text-muted-foreground">Not saved yet</span>
        )}
      </div>
      <div className="flex items-center gap-2 max-sm:w-full">
        {m.saved && m.dirty ? <Button type="button" variant="ghost" size="sm" className="max-sm:flex-1" onClick={() => m.discard()} data-discard>Discard</Button> : null}
        <Button type="button" variant="default" size="sm" className="max-sm:flex-1" onClick={onSave} disabled={off}>{label}</Button>
      </div>
    </section>
  )
}
