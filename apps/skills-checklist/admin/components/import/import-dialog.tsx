"use client"

import * as React from "react"
import { Dialog, DialogContent } from "@exxatdesignux/ui/components/ui/dialog"
import type { Id } from "@/lib/domain/types"
import { proposeImport, proposeImportInterpreted } from "@/lib/store"
import { interpretOnServer } from "@/lib/import-ai/client-api"
import { useActions } from "@/lib/store/react"
import { surface } from "@/lib/copy"
import { ImportInputStep, type ImportSource } from "./import-input"
import { ImportReviewStep, type ImportedInfo } from "./import-review"

export interface ImportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Resume a draft that is already in review (deep link `?dialog=import&batch=<id>`); otherwise the dialog starts at step 1. */
  batchId?: Id | null
  /** Fired after Create. The host closes the dialog and lets the library page show its banners (`?imported=<batchId>`). */
  onImported?: (info: ImportedInfo) => void
}

/**
 * P-06: the Import skills dialog (1024px): step 1 reads a file or pasted list, step 2 reviews the proposal, Create adds the
 * skills unconfigured (IM-09). Reading creates NOTHING (IM-05, IM-13): it opens a draft batch the admin reviews and confirms.
 * Closing with edits asks first; closing without edits discards the untouched draft silently.
 */
export function ImportDialog(props: ImportDialogProps) {
  if (!props.open) return null
  return <ImportShell {...props} />
}

function ImportShell({ open, onOpenChange, batchId: initialBatch, onImported }: ImportDialogProps) {
  const { run } = useActions()
  const [batchId, setBatchId] = React.useState<Id | null>(initialBatch ?? null)
  const [error, setError] = React.useState<string | null>(null)
  const guard = React.useRef<(() => boolean) | null>(null)
  const registerGuard = React.useCallback((g: (() => boolean) | null) => {
    guard.current = g
  }, [])

  const [reading, setReading] = React.useState(false)
  const abort = React.useRef<AbortController | null>(null)
  React.useEffect(() => () => abort.current?.abort(), [])

  const onRead = async (source: ImportSource) => {
    const { useAi, ...input } = source
    if (!useAi) {
      const r = run((db, ctx) => proposeImport(db, input, ctx))
      if (!r.ok) {
        setError(surface.s08.errorUnreadable)
        return
      }
      setError(null)
      setBatchId(r.value.batchId)
      return
    }
    // The optional AI reading: it only fills the same draft proposal (nothing is created, IM-05, IM-13). Any failure falls back to
    // the standard reader and the review says so.
    const ctl = new AbortController()
    abort.current = ctl
    setReading(true)
    setError(null)
    try {
      const out = await interpretOnServer({ text: input.text, sourceName: input.sourceName, sourceKind: input.sourceKind, columns: input.columns, skipHeader: input.skipHeader }, ctl.signal)
      if (ctl.signal.aborted) return
      const r =
        out.result !== null
          ? run((db, ctx) => proposeImportInterpreted(db, { ...input, interpreted: out.result }, ctx))
          : run((db, ctx) => proposeImport(db, { ...input, interpretation: { mode: "ai-fallback", fallbackReason: out.fallback } }, ctx))
      if (!r.ok) {
        setError(surface.s08.errorUnreadable)
        return
      }
      setBatchId(r.value.batchId)
    } catch {
      // Aborted by Cancel or by closing the dialog: nothing was created.
    } finally {
      if (abort.current === ctl) abort.current = null
      setReading(false)
    }
  }

  const requestClose = () => {
    abort.current?.abort()
    // A review with edits shows its own discard prompt; otherwise an untouched draft is cancelled inside the guard.
    if (guard.current && guard.current()) return
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && requestClose()}>
      <DialogContent className="flex h-[min(760px,calc(100dvh-4rem))] flex-col gap-0 overflow-hidden p-0 sm:max-w-5xl" data-testid="import-dialog" aria-describedby={undefined}
        onEscapeKeyDown={(e) => {
          // Escape inside a review cell cancels that cell's edit only; it must not discard the whole draft. Radix default-prevents
          // Escape itself, and the DS InlineInputCell ignores a prevented Escape, so the cell's own Cancel button is pressed here.
          const t = e.target
          if (t instanceof HTMLElement && t.tagName === "INPUT" && t.closest("table, [role=grid], [data-slot=table-container]")) {
            e.preventDefault()
            const edit = t.closest("[data-slot=inline-edit]")
            edit?.querySelector<HTMLButtonElement>('button[aria-label^="Cancel editing"]')?.click()
          }
        }}
      >
        {batchId ? (
          <ImportReviewStep
            key={batchId}
            batchId={batchId}
            registerCloseGuard={registerGuard}
            onBack={() => {
              setBatchId(null)
            }}
            onClose={() => onOpenChange(false)}
            onConfirmed={(info) => {
              onOpenChange(false)
              onImported?.(info)
            }}
          />
        ) : (
          <ImportInputStep onRead={onRead} onCancel={() => { abort.current?.abort(); onOpenChange(false) }} error={error} reading={reading} />
        )}
      </DialogContent>
    </Dialog>
  )
}

export type { ImportedInfo }
