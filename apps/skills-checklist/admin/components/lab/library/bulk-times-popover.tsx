"use client"

/**
 * Times needed for several skills at once (D-ADD1117-p, Romit 2026-11-17: the old popover was cramped, unpadded, had a native spinner
 * and an Apply that looked disabled). The DS PopoverContent has no padding of its own, so it is padded here.
 *
 *   Times needed for 2 skills          title
 *   Now: 1 and 3 (mixed)               what the selection needs today
 *   [1][2][3][4][5]   Other [  ]       quick picks (one click selects), Other is a numeric text field, no spinner
 *                    Cancel  [Apply]   Apply (or Enter) applies; Cancel or Esc closes without change
 */
import * as React from "react"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import { Input } from "@exxatdesignux/ui/components/ui/input"
import { Label } from "@exxatdesignux/ui/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@exxatdesignux/ui/components/ui/popover"
import { ToggleGroup, ToggleGroupItem } from "@exxatdesignux/ui/components/ui/toggle-group"
import { ABOVE_PANEL_MENU } from "@/components/lab/overlay-layer"
import { TYPE } from "@/components/lab/type-scale"
import { TIMES_MAX } from "@/lib/lab/program-settings"
import { countSkills } from "@/lib/lab/terms"

const fmt = (n: number) => n.toLocaleString("en-US")
const PICKS = [1, 2, 3, 4, 5]

/** "Now: 3", "Now: 1 and 3 (mixed)", "Now: not set". */
export function timesNowLine(current: readonly (number | null)[]): string {
  const distinct = [...new Set(current)]
  if (distinct.length <= 1) return `Now: ${distinct[0] == null ? "not set" : fmt(distinct[0])}`
  const nums = distinct.filter((t): t is number => t !== null).sort((a, b) => a - b).map(fmt)
  if (distinct.includes(null)) nums.push("not set")
  const list = nums.length > 1 ? `${nums.slice(0, -1).join(", ")} and ${nums[nums.length - 1]}` : nums[0]
  return `Now: ${list} (mixed)`
}

export function BulkTimesPopover({ current, onApply, compact = false, open: openProp, onOpenChange, idPrefix = "h-bar" }: {
  /** Each selected skill's times needed now (null when not set). */
  current: readonly (number | null)[]
  onApply: (t: number) => void
  /** Icon-only trigger (a phone). */
  compact?: boolean
  open?: boolean
  onOpenChange?: (o: boolean) => void
  idPrefix?: string
}) {
  const [ownOpen, setOwnOpen] = React.useState(false)
  const open = openProp ?? ownOpen
  const [pick, setPick] = React.useState<number | null>(null)
  const [other, setOther] = React.useState("")
  const setOpen = (o: boolean) => { if (o) { setPick(null); setOther("") } setOwnOpen(o); onOpenChange?.(o) }
  const n = current.length
  const distinct = [...new Set(current)]
  const shared = distinct.length === 1 ? distinct[0] ?? null : null
  const otherN = other === "" ? null : Number(other)
  const otherError = otherN !== null && !(Number.isInteger(otherN) && otherN >= 1 && otherN <= TIMES_MAX) ? `Enter 1 to ${fmt(TIMES_MAX)}.` : null
  const choice = otherN !== null ? (otherError ? null : otherN) : pick
  const canApply = choice !== null && !(distinct.length === 1 && shared === choice)
  const apply = () => { if (canApply && choice !== null) { onApply(choice); setOpen(false) } }
  const id = `${idPrefix}-times`
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button type="button" variant="outline" size={compact ? "icon-sm" : "sm"} aria-label={`Times needed for ${countSkills(n)}`} data-h-bar-times>
          <i className="fa-light fa-repeat" aria-hidden="true" />{compact ? null : "Times"}
        </Button>
      </PopoverTrigger>
      <PopoverContent side="top" align="start" sideOffset={8} collisionPadding={16} className={`${ABOVE_PANEL_MENU} w-72 p-4`} aria-labelledby={`${id}-title`} data-h-bar-times-popover>
        <form className="flex flex-col gap-3" onSubmit={(e) => { e.preventDefault(); apply() }} data-h-bar-times-form>
          <div className="flex flex-col gap-0.5">
            <p id={`${id}-title`} className={TYPE.group}>{`Times needed for ${countSkills(n)}`}</p>
            <p className={TYPE.meta} data-h-bar-times-now>{timesNowLine(current)}</p>
          </div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <ToggleGroup type="single" variant="outline" spacing={1} value={otherN === null && pick !== null ? String(pick) : ""} onValueChange={(v) => { if (v) { setPick(Number(v)); setOther("") } }} aria-label="Times needed" data-h-bar-times-picks>
              {PICKS.map((t) => <ToggleGroupItem key={t} value={String(t)} aria-label={t === 1 ? "1 time" : `${t} times`} className="tabular-nums" data-h-bar-times-pick={t}>{t}</ToggleGroupItem>)}
            </ToggleGroup>
            <div className="flex items-center gap-2">
              <Label htmlFor={id} className={TYPE.helper}>Other</Label>
              <Input id={id} type="text" inputMode="numeric" autoComplete="off" value={other} onChange={(e) => { setOther(e.target.value.replace(/[^0-9]/g, "")); setPick(null) }} aria-invalid={otherError ? true : undefined} aria-describedby={otherError ? `${id}-error` : undefined} className="h-8 w-14 text-right tabular-nums" data-h-bar-times-input />
            </div>
          </div>
          {otherError ? <p id={`${id}-error`} className="text-sm text-destructive" role="alert" data-h-bar-times-error>{otherError}</p> : null}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)} data-h-bar-times-cancel>Cancel</Button>
            <Button type="submit" variant="default" size="sm" disabled={!canApply} data-h-bar-times-apply>Apply</Button>
          </div>
        </form>
      </PopoverContent>
    </Popover>
  )
}
