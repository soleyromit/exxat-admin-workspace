"use client"

/**
 * Times needed in the library [CALL 11-02]: the program's number prefilled on every skill, edited in place where a skill needs
 * a different one, or set for the selected rows at once. One source with the Evaluation settings list ("Different from n"):
 * `timesCellOf` and `setTimesNeededMany` in lib/lab/program-settings.ts. With no program settings a skill that has no number of its
 * own reads "Not set" (Prism never supplies the number) [REQ SC-02].
 *
 * A change saves straight away through the skill's rule (its own rule version and audit line); no rule impact preview here.
 */
import * as React from "react"
import { Badge } from "@exxatdesignux/ui/components/ui/badge"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import { Input } from "@exxatdesignux/ui/components/ui/input"
import { Label } from "@exxatdesignux/ui/components/ui/label"
import { FieldError } from "@exxatdesignux/ui/components/ui/field"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@exxatdesignux/ui/components/ui/dialog"
import { cn } from "@exxatdesignux/ui/lib/utils"
import { useV2State, useV2Store } from "@/lib/v2/react"
import { DEMO_TODAY, IDS } from "@/lib/v2/seed-core"
import { TIMES_MAX, setTimesNeededMany, timesCellOf, type TimesManyResult } from "@/lib/lab/program-settings"
import { countSkills } from "@/lib/lab/terms"
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

/** One row's cell: the number, editable in place; bold with "Different" when it is not the program's number. */
export function TimesNeededCell({ id, name }: { id: string; name: string }) {
  const state = useV2State()
  const cell = React.useMemo(() => timesCellOf(state, id), [state, id])
  const setTimes = useSetTimes()
  const saved = cell.value === null ? "" : String(cell.value)
  const [draft, setDraft] = React.useState(saved)
  const [error, setError] = React.useState<string | null>(null)
  const focused = React.useRef(false)
  React.useEffect(() => { if (!focused.current) { setDraft(saved); setError(null) } }, [saved])

  // Keep clicks and keys in the cell from opening the row's detail panel.
  const stop = (e: React.SyntheticEvent) => e.stopPropagation()

  if (!cell.editable) {
    return cell.value === null
      ? <span className="text-muted-foreground" data-times-cell={id}>Not set</span>
      : <span className="tabular-nums" data-times-cell={id}>{cell.value}</span>
  }

  const commit = () => {
    if (draft.trim() === saved) { setError(null); return }
    const n = parseTimes(draft)
    if (n === null) { setError(RANGE_ERROR); return }
    const r = setTimes([id], n)
    if (r?.failed.length) setError(r.failed[0]!.error)
    else setError(null)
  }

  const inputId = `times-cell-${id}`
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
          className={cn("h-8 w-14 shrink-0 tabular-nums", cell.differs && "font-semibold")}
          aria-label={`Times needed for ${name}`}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          placeholder="Not set"
          value={draft}
          onFocus={() => { focused.current = true }}
          onChange={(e) => { setDraft(e.target.value); if (error) setError(null) }}
          onBlur={() => { focused.current = false; commit() }}
          onKeyDown={(e) => {
            e.stopPropagation()
            if (e.key === "Enter") { e.preventDefault(); commit() }
            if (e.key === "Escape") { setDraft(saved); setError(null) }
          }}
        />
        {cell.differs ? <Badge id={badgeId} variant="outline">Different</Badge> : null}
      </span>
      {error ? <FieldError id={errorId} className="text-xs">{error}</FieldError> : null}
    </span>
  )
}

/**
 * Bulk "Set times needed" for the selected rows. The rows that cannot take a number (no program settings and none of their own,
 * or a model that needs their own questions) are counted on the dialog and left as they are.
 */
export function SetTimesDialog({ ids, open, onOpenChange, onDone }: { ids: readonly string[]; open: boolean; onOpenChange: (o: boolean) => void; onDone?: (r: TimesManyResult, need: number) => void }) {
  const state = useV2State()
  const setTimes = useSetTimes()
  const cells = React.useMemo(() => ids.map((id) => timesCellOf(state, id)), [state, ids])
  const editable = cells.filter((c) => c.editable).length
  const blocked = ids.length - editable
  const programNeed = cells.find((c) => c.programNeed !== null)?.programNeed ?? null
  const [value, setValue] = React.useState("")
  const [tried, setTried] = React.useState(false)
  React.useEffect(() => {
    if (open) { setValue(programNeed === null ? "" : String(programNeed)); setTried(false) }
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps
  const n = parseTimes(value)
  const error = tried && n === null ? RANGE_ERROR : null
  const apply = () => {
    setTried(true)
    if (n === null || editable === 0) return
    const r = setTimes(ids, n)
    if (r) onDone?.(r, n)
    onOpenChange(false)
  }
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{`Set times needed for ${countSkills(editable)}`}</DialogTitle>
          <DialogDescription className="sr-only">{`Times needed for the selected ${countSkills(ids.length)}.`}</DialogDescription>
        </DialogHeader>
        <form className="flex flex-col gap-2" onSubmit={(e) => { e.preventDefault(); apply() }} data-set-times>
          <Label htmlFor="set-times-value">Times needed</Label>
          <Input
            id="set-times-value"
            type="number"
            inputMode="numeric"
            min={1}
            max={TIMES_MAX}
            step={1}
            autoFocus
            className="w-24 tabular-nums"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? "set-times-error" : undefined}
          />
          {error ? <FieldError id="set-times-error">{error}</FieldError> : null}
          {blocked ? <p className={TYPE.helper} data-set-times-blocked>{`${countSkills(blocked)} can't take a number yet and stay as they are.`}</p> : null}
        </form>
        <DialogFooter>
          <Button type="button" variant="outline" size="default" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button type="button" variant="default" size="default" disabled={editable === 0} onClick={apply}>{`Set for ${countSkills(editable)}`}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
