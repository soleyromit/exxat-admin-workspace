"use client"

/**
 * The rows Evaluation settings and the Configure one skill page share (map D3, D1c): one label column, a switch at the end of its row, tile examples, and the list of levels. One component each, so the two pages say the same thing.
 */
import * as React from "react"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import { Checkbox } from "@exxatdesignux/ui/components/ui/checkbox"
import { FieldError, FieldLabel, FieldLegend, FieldSet } from "@exxatdesignux/ui/components/ui/field"
import { Input } from "@exxatdesignux/ui/components/ui/input"
import { ToggleSwitch } from "@exxatdesignux/ui/components/ui/toggle-switch"
import { cn } from "@exxatdesignux/ui/lib/utils"
import { TYPE } from "@/components/lab/type-scale"
import { levelMoveChange, levelTicked, removeLevel, swapItems, withLevelTicked, type LabRule } from "@/lib/lab/configure"
import type { EvalModel } from "@/lib/v2/types"
import { PresetChips, RemoveButton, placeholderFor, type SectionProps } from "./fields"

/** The panel needs room beside the settings; below this the page stacks and Preview is a dialog (map D3). */
export const WIDE = "(min-width: 1100px)"

export function useWide(): boolean {
  return React.useSyncExternalStore(
    (on) => {
      const q = window.matchMedia(WIDE)
      q.addEventListener("change", on)
      return () => q.removeEventListener("change", on)
    },
    () => window.matchMedia(WIDE).matches,
    () => false,
  )
}

/** Ends a column inside the page's scroll area: its height follows the space left on arrival, whatever bars the shell shows, so the page does not grow (map D1c, D4). `below`: the page's own bottom padding. */
export function useFitToScroller<T extends HTMLElement>(below = 20) {
  const ref = React.useRef<T>(null)
  React.useLayoutEffect(() => {
    const el = ref.current
    const port = el?.closest<HTMLElement>("[data-page-scroll]")
    if (!el || !port) return
    const fit = () => {
      const top = el.getBoundingClientRect().top - port.getBoundingClientRect().top + port.scrollTop
      el.style.maxHeight = `${Math.max(200, port.clientHeight - top - below)}px`
    }
    fit()
    const seen = new ResizeObserver(fit)
    seen.observe(port)
    return () => seen.disconnect()
  }, [below])
  return ref
}

/**
 * One setting, one shape: its name, then a line on what it does, and the control at the end of the row. `stacked` puts a wide control (a list, a set of choices) under the words, at full width.
 * A label for one control points at it; a group's legend stays for screen readers.
 */
export function Row({ label, hint, htmlFor, children, stacked, className }: { label: string; hint?: React.ReactNode; htmlFor?: string; children: React.ReactNode; stacked?: boolean; className?: string }) {
  return (
    <div className={cn("flex min-w-0 gap-x-6 gap-y-2 py-3", stacked ? "flex-col" : "flex-wrap items-start justify-between", className)} data-settings-row>
      <div className="flex min-w-0 max-w-prose flex-col gap-0.5">
        {htmlFor ? <FieldLabel htmlFor={htmlFor}>{label}</FieldLabel> : <p className={TYPE.label}>{label}</p>}
        {hint ? <div className={TYPE.helper}>{hint}</div> : null}
      </div>
      <div className={cn("min-w-0", !stacked && "shrink-0")}>{children}</div>
    </div>
  )
}

/** On or off: its name and what it does, the switch at the end of its row, at every width. */
export function SwitchRow({ id, label, hint, checked, onChange }: { id: string; label: string; hint?: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-start justify-between gap-6 py-3" data-settings-row data-switch-row>
      <div className="flex min-w-0 max-w-prose flex-col gap-0.5">
        <p id={`${id}-label`} className={TYPE.label}>{label}</p>
        {hint ? <p id={`${id}-hint`} className={TYPE.helper}>{hint}</p> : null}
      </div>
      <ToggleSwitch id={id} checked={checked} onChange={onChange} aria-labelledby={`${id}-label`} aria-describedby={hint ? `${id}-hint` : undefined} />
    </div>
  )
}

/** One short example per choice [INFER words]: tiles sit 2 by 2, so name and example stay within three lines. The first two show the program's own words once it has them; the rest are examples only, nothing is preselected [REQ SC-02]. */
export function tileExamples(rule: LabRule): Record<EvalModel, string> {
  const named = rule.levels.map((l) => l.trim()).filter(Boolean)
  const labels = rule.outcomeLabels.map((l) => l.trim())
  return {
    demonstration: named.length >= 2 ? `${named[0]} to ${named[named.length - 1]}` : "Levels you name, such as Observed to Independent",
    binary: rule.model === "binary" && labels[0] && labels[1] ? `One result: ${labels[0]} or ${labels[1]}` : "One result, with two labels you name",
    question: "Yes or No on each question",
    scored: "A score on each question",
  }
}

/** Number, name, Counts, then the row's actions: on their own line when the column is phone narrow, so the name keeps its width. */
const LEVEL_GRID = "grid grid-cols-[1.25rem_minmax(0,1fr)_3.5rem] gap-x-2 @min-[26rem]:grid-cols-[1.25rem_minmax(0,22rem)_3.5rem_6.75rem]"
const NAMES_GRID = "grid grid-cols-[1.25rem_minmax(0,1fr)] gap-x-2 @min-[26rem]:grid-cols-[1.25rem_minmax(0,1fr)_6.75rem]"

/**
 * Levels and which of them count, as one list (D-L74, D-L95): the links between the boxes and the threshold stay in `withLevelTicked` and `removeLevel`. Focus stays with the row being
 * moved or removed, so the keyboard does not lose its place when a button disables or a row goes.
 */
export function LevelList({ rule, setRule, err, namesOnly }: { rule: LabRule; setRule: SectionProps["setRule"]; err: (f: string) => string | undefined; /** The Levels dialog: the page beside it holds the Counts boxes. */ namesOnly?: boolean }) {
  const countsErr = err("cfg-counts-from")
  const addErr = err("cfg-add-level")
  const n = rule.levels.length
  const grid = namesOnly ? NAMES_GRID : LEVEL_GRID
  const focusAfter = (first: string, second: string) => requestAnimationFrame(() => {
    const a = document.getElementById(first) as HTMLButtonElement | null
    const el = a && !a.disabled ? a : document.getElementById(second)
    el?.focus()
  })
  // Said at the row, and gone with the next edit: the rule object it belongs to is no longer the rule.
  const [moved, setMoved] = React.useState<{ rule: LabRule; index: number; counts: boolean } | null>(null)
  const move = (i: number, d: -1 | 1) => {
    const j = i + d
    const next = swapItems(rule, "levels", i, j)
    const change = levelMoveChange(rule, next, i, j)
    setMoved(change ? { rule: next, ...change } : null)
    setRule(() => next)
    const dir = d < 0 ? "up" : "down"
    focusAfter(`cfg-level-${dir}-${j}`, `cfg-level-${d < 0 ? "down" : "up"}-${j}`)
  }
  const remove = (i: number) => {
    setRule((r) => removeLevel(r, i))
    focusAfter(`cfg-level-${Math.min(i, n - 2)}`, "cfg-add-level")
  }
  return (
    <FieldSet id="cfg-counts-from" tabIndex={-1} className="flex flex-col gap-2 outline-none" data-counts-from aria-invalid={!!countsErr || undefined} aria-describedby={countsErr ? "cfg-counts-from-error" : undefined}>
      <FieldLegend variant="label" className="sr-only">Levels that count</FieldLegend>
      {n && !namesOnly ? (
        <div className={cn(LEVEL_GRID, "items-center")} aria-hidden="true" data-level-head>
          <span />
          <span className={TYPE.meta}>Level</span>
          <span className={cn(TYPE.meta, "text-center")}>Counts</span>
        </div>
      ) : null}
      <ol className="flex flex-col gap-2" aria-label="Levels">
        {rule.levels.map((name, i) => {
          const id = `cfg-level-${i}`
          const message = err(id)
          const shown = name.trim() || `Level ${i + 1}`
          return (
            <li key={i} className="flex flex-col gap-1">
              <div className={cn(grid, "items-center")} data-level-row>
                <span className={cn(TYPE.helper, "text-end tabular-nums")} aria-hidden="true">{i + 1}</span>
                <Input id={id} aria-label={`Level ${i + 1}`} placeholder={placeholderFor("Level", i, n)} value={name} onChange={(e) => setRule((r) => ({ ...r, levels: r.levels.map((x, k) => (k === i ? e.target.value : x)) }))} aria-invalid={!!message || undefined} aria-describedby={message ? `${id}-error` : undefined} />
                {namesOnly ? null : (
                  <span className="flex justify-center">
                    <Checkbox id={`cfg-counts-from-${i}`} aria-label={`${shown} counts`} checked={levelTicked(rule, i)} onCheckedChange={(c) => setRule((r) => withLevelTicked(r, i, c === true))} />
                  </span>
                )}
                <span className="col-span-full flex items-center justify-end gap-0.5 @min-[26rem]:col-span-1">
                  <Button id={`cfg-level-up-${i}`} type="button" variant="ghost" size="icon-sm" aria-label={`Move ${shown} up`} disabled={i === 0} onClick={() => move(i, -1)}>
                    <i className="fa-light fa-arrow-up" aria-hidden="true" />
                  </Button>
                  <Button id={`cfg-level-down-${i}`} type="button" variant="ghost" size="icon-sm" aria-label={`Move ${shown} down`} disabled={i === n - 1} onClick={() => move(i, 1)}>
                    <i className="fa-light fa-arrow-down" aria-hidden="true" />
                  </Button>
                  <RemoveButton label={`Remove ${shown}`} onClick={() => remove(i)} />
                </span>
              </div>
              {message ? <FieldError id={`${id}-error`} className="ms-7">{message}</FieldError> : null}
              {moved?.rule === rule && moved.index === i ? <p role="status" className={cn(TYPE.helper, "ms-7")} data-level-count-change>{moved.counts ? "Now counts: it sits above a level that counts." : "No longer counts: it sits below a level that does not."}</p> : null}
            </li>
          )
        })}
      </ol>
      {countsErr ? <FieldError id="cfg-counts-from-error">{countsErr}</FieldError> : null}
      <div className="ms-7 flex flex-wrap items-center gap-x-4 gap-y-2">
        <Button id="cfg-add-level" type="button" variant="outline" size="sm" aria-describedby={addErr ? "cfg-add-level-error" : undefined} onClick={() => { setRule((r) => ({ ...r, levels: [...r.levels, ""] })); focusAfter(`cfg-level-${n}`, "cfg-add-level") }}>Add a level</Button>
        <PresetChips rule={rule} setRule={setRule} quiet />
      </div>
      {addErr ? <FieldError id="cfg-add-level-error">{addErr}</FieldError> : null}
    </FieldSet>
  )
}
