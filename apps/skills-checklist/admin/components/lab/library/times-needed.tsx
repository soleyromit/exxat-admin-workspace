"use client"

/**
 * Times needed in the library [CALL 11-02]: the program's number prefilled on every skill, edited in place where a skill needs
 * a different one; Edit N skills sets it for the selected rows (bulk-edit-sheet.tsx). One source with the Evaluation settings list ("Different from n"):
 * `timesCellOf` and `setTimesNeededMany` in lib/lab/program-settings.ts. With no program settings a skill that has no number of its
 * own reads "Not set" (Prism never supplies the number) [REQ SC-02]. Every row is editable, Not configured and Inactive included (D-L92, D-L93).
 *
 * A change that moves nobody's progress saves straight away through the skill's rule. One that does names the students first, in the same dialog
 * as the edit panel, and Cancel restores the number (map D0 rule 9) [REQ AE-02].
 */
import * as React from "react"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import { Input } from "@exxatdesignux/ui/components/ui/input"
import { FieldError } from "@exxatdesignux/ui/components/ui/field"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@exxatdesignux/ui/components/ui/alert-dialog"
import { railTriggerProps } from "@exxatdesignux/ui/components/ui/floating-sheet-panel"
import { cn } from "@exxatdesignux/ui/lib/utils"
import { useV2State, useV2Store } from "@/lib/v2/react"
import { DEMO_TODAY, IDS } from "@/lib/v2/seed-core"
import { TIMES_MAX, setTimesNeededMany, timesCellOf, timesNeededImpact, type TimesManyResult } from "@/lib/lab/program-settings"
import { ABOVE_PANEL } from "@/components/lab/overlay-layer"
import { plural } from "@/lib/v2/format"
import { skillNoun } from "@/lib/lab/terms"
import { holdSecondPress, returnFocus } from "@/components/lab/shared/focus"
import { TYPE } from "@/components/lab/type-scale"

const stamp = () => ({ at: `${DEMO_TODAY}T${new Date().toISOString().slice(11, 19)}Z`, byId: IDS.ross })

/** Parse a typed number: a whole number from 1 to TIMES_MAX, else null. */
export function parseTimes(raw: string): number | null {
  if (!/^\d+$/.test(raw.trim())) return null
  const n = Number(raw.trim())
  return n >= 1 && n <= TIMES_MAX ? n : null
}

const RANGE_ERROR = `Enter 1 to ${TIMES_MAX}.`

/** Write through the shared store and hand back what happened. */
function useSetTimes() {
  const store = useV2Store()
  return React.useCallback(
    (ids: readonly string[], need: number): TimesManyResult | null => {
      let out: TimesManyResult | null = null
      store.update((s) => {
        out = setTimesNeededMany(s, ids, need, stamp())
        return out.state
      })
      return out
    },
    [store],
  )
}

/** Who a save reaches, by name, the same sentence wherever it is asked (map D0 rule 9). */
export function progressChanges(students: ReadonlyArray<{ name: string }>): string {
  if (!students.length) return "No student's progress changes."
  const named = students.slice(0, 8).map((s) => s.name).join(", ")
  return `Progress changes for ${plural(students.length, "student", "students")}: ${named}${students.length > 8 ? ` and ${students.length - 8} more` : ""}.`
}

/** The one dialog before a save that changes achievement [REQ AE-02, SC-09]: the cell, the panel and Reactivate all ask with this. */
export function ImpactDialog({ open, title, students, cleared = [], confirm = "Save changes", skillId, focusAfter, listed, onCancel, onConfirm }: {
  open: boolean
  title: string
  students: ReadonlyArray<{ name: string }>
  /** What a model change clears, in the admin's words. */
  cleared?: readonly string[]
  confirm?: string
  skillId?: string
  /** Where focus goes when it closes, if not back to what had it. Read at that moment: null returns it. */
  focusAfter?: React.RefObject<(() => HTMLElement | null) | null>
  /** The words of the Evaluation settings save dialog: a count and Show names, for a skill that may reach many students (map D1c). */
  listed?: boolean
  onCancel: () => void
  onConfirm: () => void
}) {
  const had = React.useRef<Element | null>(null)
  const [names, setNames] = React.useState(false)
  React.useEffect(() => { if (!open) setNames(false) }, [open])
  return (
    <AlertDialog open={open} onOpenChange={(o) => { if (!o) onCancel() }}>
      <AlertDialogContent className={ABOVE_PANEL} overlayClassName={ABOVE_PANEL} {...railTriggerProps()} data-impact-dialog onOpenAutoFocus={() => { had.current = document.activeElement }} onCloseAutoFocus={(e) => {
        e.preventDefault()
        const next = focusAfter?.current?.()
        if (focusAfter) focusAfter.current = null
        if (next) next.focus()
        else returnFocus(had.current, skillId)
      }}>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription className={listed ? "sr-only" : undefined}>{progressChanges(students)}</AlertDialogDescription>
        </AlertDialogHeader>
        {listed && students.length ? (
          <dl className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-6 gap-y-2">
            <dt className={TYPE.body}>Students whose progress changes</dt>
            <dd className="text-end text-sm font-medium tabular-nums text-foreground">
              {students.length}
              <Button type="button" variant="link" size="sm" className="ms-2 h-auto p-0" aria-expanded={names} onClick={() => setNames((x) => !x)}>{names ? "Hide names" : "Show names"}</Button>
            </dd>
          </dl>
        ) : null}
        {listed && names ? <ul className="max-h-40 overflow-y-auto rounded-[var(--radius)] border border-border p-2 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring" tabIndex={0} aria-label="Students whose progress changes" data-impact-names>{students.map((x) => <li key={x.name}>{x.name}</li>)}</ul> : null}
        {cleared.length ? <p className={TYPE.body} data-impact-cleared>{`Cleared: ${cleared.join(", ")}.`}</p> : null}
        <AlertDialogFooter>
          <AlertDialogCancel variant="outline" size="sm">Cancel</AlertDialogCancel>
          <AlertDialogAction variant="default" size="sm" onClick={(e) => { holdSecondPress(e); onConfirm() }}>{confirm}</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

/** Enter moves to the next row's cell, so a run of numbers can be typed down the column (map D1). */
function nextCell(inputId: string): HTMLInputElement | null {
  const cells = [...document.querySelectorAll<HTMLInputElement>("input[id^='times-cell-']")]
  return cells[cells.findIndex((c) => c.id === inputId) + 1] ?? null
}
const focusNextCell = (inputId: string) => { nextCell(inputId)?.focus() }

/** One row's cell: the number, editable in place; bold when it is the skill's own number, and said to a screen reader. */
export function TimesNeededCell({ id, name }: { id: string; name: string }) {
  const state = useV2State()
  const cell = React.useMemo(() => timesCellOf(state, id), [state, id])
  const setTimes = useSetTimes()
  const saved = cell.value === null ? "" : String(cell.value)
  const [draft, setDraft] = React.useState(saved)
  const [error, setError] = React.useState<string | null>(null)
  const focused = React.useRef(false)
  const [justSaved, setJustSaved] = React.useState(false)
  React.useEffect(() => {
    if (!justSaved) return
    const timer = window.setTimeout(() => setJustSaved(false), 2500)
    return () => window.clearTimeout(timer)
  }, [justSaved])
  React.useEffect(() => { if (!focused.current) { setDraft(saved); setError(null) } }, [saved])

  // Keep clicks and keys in the cell from opening the row's detail panel.
  const stop = (e: React.SyntheticEvent) => e.stopPropagation()

  // A number that changes someone's progress waits here until the admin has seen who.
  const [ask, setAsk] = React.useState<{ need: number; students: Array<{ id: string; name: string }>; next: boolean } | null>(null)
  const inputId = `times-cell-${id}`
  // After the dialog's confirm, the same as Enter with no dialog: on to the next row's cell (map D1). Set only on that path, so Cancel returns to this cell.
  // Tab out of the cell opens the dialog in the middle of the blur, with nothing focused yet: both answers go where Tab was going, else back to this cell.
  const afterDialog = React.useRef<(() => HTMLElement | null) | null>(null)
  const write = (n: number, next: boolean, viaDialog = false) => {
    const r = setTimes([id], n)
    if (r?.failed.length) setError(r.failed[0]!.error)
    else {
      setError(null)
      setJustSaved(true)
      if (!next) return
      if (viaDialog) afterDialog.current = () => nextCell(inputId)
      else focusNextCell(inputId)
    }
  }
  const commit = (next = false) => {
    if (ask) return
    if (draft.trim() === saved) { setError(null); if (next) focusNextCell(inputId); return }
    const n = parseTimes(draft)
    if (n === null) { setError(RANGE_ERROR); return }
    const students = timesNeededImpact(state, id, n)
    if (students.length) { setAsk({ need: n, students, next }); return }
    write(n, next)
  }

  const badgeId = `${inputId}-differs`
  const errorId = `${inputId}-error`
  const describedBy = [cell.differs ? badgeId : null, error ? errorId : null].filter(Boolean).join(" ") || undefined
  return (
    <span className="flex flex-col gap-1 py-1" onClick={stop} onKeyDown={stop} data-times-cell={id} data-times-differs={cell.differs || undefined}>
      <span className="flex items-center gap-2">
        <Input
          id={inputId}
          type="number"
          inputMode="numeric"
          min={1}
          max={TIMES_MAX}
          step={1}
          className={cn("h-8 shrink-0 tabular-nums", draft === "" ? "w-24" : "w-14", cell.differs && "font-semibold")}
          aria-label={`Times needed for ${name}`}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          placeholder="Not set"
          value={draft}
          onFocus={() => { focused.current = true; afterDialog.current = null }}
          onChange={(e) => { setDraft(e.target.value); if (error) setError(null) }}
          onBlur={(e) => {
            focused.current = false
            const went = e.relatedTarget instanceof HTMLElement ? e.relatedTarget : null
            afterDialog.current = () => (went?.isConnected ? went : document.getElementById(inputId))
            commit()
          }}
          onKeyDown={(e) => {
            e.stopPropagation()
            if (e.key === "Enter") { e.preventDefault(); commit(true) }
            if (e.key === "Escape") { setDraft(saved); setError(null) }
          }}
        />
        {justSaved ? <span className="text-xs text-muted-foreground" role="status">Saved</span> : cell.differs ? <span id={badgeId} className="sr-only">{`This ${skillNoun()}'s own number`}</span> : null}
      </span>
      {error ? <FieldError id={errorId} className="text-xs">{error}</FieldError> : null}
      <ImpactDialog
        open={!!ask}
        title={`Change times needed for ${name}?`}
        students={ask?.students ?? []}
        skillId={id}
        focusAfter={afterDialog}
        onCancel={() => { setAsk(null); setDraft(saved); setError(null) }}
        onConfirm={() => { if (ask) write(ask.need, ask.next, true); setAsk(null) }}
      />
    </span>
  )
}
