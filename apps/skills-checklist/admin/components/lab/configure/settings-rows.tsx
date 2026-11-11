"use client"

/**
 * The rows Evaluation settings and the Configure one skill page share (map D3, D1c): one label column, a switch at the end of its row, tile examples, and the list of levels. One component each, so the two pages say the same thing.
 */
import * as React from "react"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@exxatdesignux/ui/components/ui/card"
import { Checkbox } from "@exxatdesignux/ui/components/ui/checkbox"
import { Label } from "@exxatdesignux/ui/components/ui/label"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@exxatdesignux/ui/components/ui/dropdown-menu"
import { FieldError, FieldLabel, FieldLegend, FieldSet } from "@exxatdesignux/ui/components/ui/field"
import { Input } from "@exxatdesignux/ui/components/ui/input"
import { ToggleSwitch } from "@exxatdesignux/ui/components/ui/toggle-switch"
import { cn } from "@exxatdesignux/ui/lib/utils"
import { TYPE } from "@/components/lab/type-scale"
import { levelMoveChange, levelTicked, removeLevel, swapItems, withLevelTicked, type LabRule } from "@/lib/lab/configure"
import type { EvalModel } from "@/lib/v2/types"
import { PresetChips, placeholderFor, type SectionProps } from "./fields"

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

/** A level's actions in one menu. Focus goes where the caller says after a choice (the moved row, the next row), not back to a trigger that now holds another level. */
function LevelMenu({ index, n, shown, onMove, onRemove, onRename }: { index: number; n: number; shown: string; onMove: (d: -1 | 1) => string; onRemove: () => string; onRename: () => string }) {
  const next = React.useRef<string | null>(null)
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button id={`cfg-level-menu-${index}`} type="button" variant="ghost" size="icon-sm" aria-label={`Actions for ${shown}`}>
          <i className="fa-light fa-ellipsis" aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        onCloseAutoFocus={(e) => {
          const id = next.current
          if (!id) return
          e.preventDefault()
          next.current = null
          requestAnimationFrame(() => document.getElementById(id)?.focus())
        }}
      >
        <DropdownMenuItem onSelect={() => { next.current = onRename() }}>Rename</DropdownMenuItem>
        <DropdownMenuItem disabled={index === 0} onSelect={() => { next.current = onMove(-1) }}>Move up</DropdownMenuItem>
        <DropdownMenuItem disabled={index === n - 1} onSelect={() => { next.current = onMove(1) }}>Move down</DropdownMenuItem>
        <DropdownMenuItem onSelect={() => { next.current = onRemove() }}>Remove</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/**
 * A settings group (Evaluation settings, 2026-11-10 redesign): a DS Card with a title and a one-line description, then its rows on one grid,
 * divided by hairlines. Two placements only: what is typed or picked sits under its name at the card's left edge (a list or a text field spans the
 * content width, a short number keeps NUMBER_WIDTH beside its words); an on or off switch ends its row at the card's right edge.
 * `action`: the header's right edge (Configure one skill: where the card's values come from, Default or Custom).
 */
export function SettingsCard({ id, title, description, children, lead, action }: { id: string; title: string; description?: string; children: React.ReactNode; /** Above the rows, under the header: the rule's live summary. */ lead?: React.ReactNode; action?: React.ReactNode }) {
  return (
    <Card className="@container min-w-0 gap-0" aria-labelledby={id} role="region" data-settings-section data-tier={id}>
      <CardHeader className="pb-4">
        <CardTitle asChild><h2 id={id} className={TYPE.section}>{title}</h2></CardTitle>
        {description ? <CardDescription>{description}</CardDescription> : null}
        {action ? <CardAction className="self-center" data-card-source>{action}</CardAction> : null}
      </CardHeader>
      {lead ? <CardContent className="pb-2">{lead}</CardContent> : null}
      <CardContent className="flex flex-col divide-y divide-border">{children}</CardContent>
    </Card>
  )
}

/**
 * One setting: its name and an optional line of help on the left, its control on the right, top aligned. Below a 36rem card the control drops under the words.
 * `below`: what belongs to the setting, under its name at the card's left edge (a list, a field, a number with its unit, a dependent setting).
 * `tag`: a quiet word beside the name (Configure one skill under Default: "This skill only" on the rows the skill keeps for itself).
 */
export function SettingRow({ label, help, htmlFor, labelId, control, below, className, inline, tag }: { label: string; help?: React.ReactNode; htmlFor?: string; labelId?: string; control?: React.ReactNode; below?: React.ReactNode; className?: string; /** A small control (a switch) stays beside its words at every width. */ inline?: boolean; tag?: React.ReactNode }) {
  const name = !label ? null : htmlFor ? <FieldLabel htmlFor={htmlFor} id={labelId}>{label}</FieldLabel> : <p id={labelId} className={TYPE.label}>{label}</p>
  return (
    <div className={cn("flex min-w-0 flex-col gap-3 py-4", className)} data-settings-row>
      <div className={cn("flex min-w-0 gap-3", !label && !help && !control && "hidden", inline ? "flex-row items-start justify-between gap-6" : "flex-col @xl:flex-row @xl:items-start @xl:justify-between @xl:gap-8")}>
        <div className="flex min-w-0 flex-col gap-1">
          {tag && name ? <div className="flex flex-wrap items-baseline gap-x-2">{name}<span className={TYPE.meta} data-row-tag>{tag}</span></div> : name}
          {help ? <div id={labelId ? `${labelId}-help` : undefined} className={TYPE.helper}>{help}</div> : null}
        </div>
        {control ? <div className={cn("flex min-h-6 shrink-0 items-center", inline ? "justify-end" : "@xl:justify-end")}>{control}</div> : null}
      </div>
      {below}
    </div>
  )
}

/**
 * A value read out, not edited (Configure one skill under Default): its name in the same label column as every other row, the value beside it from a
 * 36rem card, under it below that. One grid with ValueRow and the rows the skill keeps for itself, so values and controls start at one left edge.
 */
export function ValueRow({ label, value, tag }: { label: string; value: React.ReactNode; tag?: React.ReactNode }) {
  return (
    <dl className="grid min-w-0 gap-1 py-4 @xl:grid-cols-[14rem_minmax(0,1fr)] @xl:gap-6" data-settings-row data-value-row>
      <dt className="flex flex-wrap items-baseline gap-x-2">
        <span className={TYPE.label}>{label}</span>
        {tag ? <span className={TYPE.meta} data-row-tag>{tag}</span> : null}
      </dt>
      <dd className={cn(TYPE.body, "min-w-0 [overflow-wrap:anywhere]")} data-readout={label}>{value}</dd>
    </dl>
  )
}

/** A control on the ValueRow grid (Configure one skill under Default: the rows the skill keeps for itself), so values and controls share one left edge. */
export function FieldRow({ label, htmlFor, tag, children }: { label: string; htmlFor?: string; tag?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="grid min-w-0 items-start gap-2 py-4 @xl:grid-cols-[14rem_minmax(0,1fr)] @xl:gap-6" data-settings-row data-field-row>
      <div className="flex min-h-8 flex-wrap items-center gap-x-2">
        {htmlFor ? <FieldLabel htmlFor={htmlFor}>{label}</FieldLabel> : <p className={TYPE.label}>{label}</p>}
        {tag ? <span className={TYPE.meta} data-row-tag>{tag}</span> : null}
      </div>
      <div className="min-w-0">{children}</div>
    </div>
  )
}

/** A short number and the words that follow it, so the unit reads with the number: "[2] evaluations". */
export { NumberWithUnit } from "./number-field"

/** On or off as a setting row: the switch takes its name from the visible label. */
export function SwitchSetting({ id, label, help, checked, onChange, below }: { id: string; label: string; help?: string; checked: boolean; onChange: (v: boolean) => void; below?: React.ReactNode }) {
  return <SettingRow inline labelId={`${id}-label`} label={label} help={help} control={<ToggleSwitch id={id} checked={checked} onChange={onChange} aria-labelledby={`${id}-label`} />} below={below} />
}

/** One step of the path. A fixed step always happens; an optional one carries its switch, or under a read-out (Default) its value. */
export type PathStep = { id: string; label: string; help?: string } & ({ fixed: true } | { fixed?: false; checked: boolean; onChange: (v: boolean) => void } | { fixed?: false; checked: boolean; readOnly: true })

/**
 * The path from a log to Counted [REQ SC-15], as a vertical stepper at every width: a numbered rail on the left, the step in words, and on the right
 * either its switch, "Always", or under a read-out "On" or "Off". An optional step that is off reads muted on the rail, so the path shows the steps that will happen.
 * The marker, the step's name and its control share one 24 px line, so their centres align.
 */
export function PathSteps({ steps, label }: { steps: PathStep[]; label: string }) {
  return (
    <ol className="flex flex-col" aria-label={label} data-path-strip>
      {steps.map((s, i) => {
        const on = s.fixed || s.checked
        const last = i === steps.length - 1
        return (
          <li key={s.id} className="relative flex min-w-0 gap-4" data-path-step={s.id}>
            {/* The rail: one unbroken line from under this marker to the top of the next one. */}
            {last ? null : <span className="absolute start-3 top-10 -bottom-4 w-px bg-border" aria-hidden="true" />}
            <span className="flex w-6 shrink-0 justify-center pt-4" aria-hidden="true">
              <span className={cn("flex size-6 items-center justify-center rounded-full border bg-card text-xs tabular-nums", on ? "border-foreground text-foreground" : "border-border text-muted-foreground")}>{i + 1}</span>
            </span>
            <div className={cn("flex min-w-0 flex-1 items-start justify-between gap-6 py-4", !last && "border-b border-border")}>
              <div className="flex min-w-0 flex-col gap-1">
                <p id={`${s.id}-label`} className={cn(TYPE.label, "leading-6", !on && "text-muted-foreground")}>{s.label}</p>
                {s.help ? <p className={TYPE.helper}>{s.help}</p> : null}
              </div>
              <span className="flex h-6 shrink-0 items-center">
                {s.fixed ? (last ? null : <span className={TYPE.helper}>Always</span>) : "readOnly" in s ? <span className={s.checked ? TYPE.body : TYPE.helper} data-step-value>{s.checked ? "On" : "Off"}</span> : <ToggleSwitch id={s.id} checked={s.checked} onChange={s.onChange} aria-labelledby={`${s.id}-label`} />}
              </span>
            </div>
          </li>
        )
      })}
    </ol>
  )
}

/**
 * Levels and which of them count, as one bordered list (D-L74, D-L95): the links between the boxes and the threshold stay in `withLevelTicked` and `removeLevel`.
 * Each row: its number, its name, an "Accepted" box with its word beside it (2026-11-11, was "Counts"), and one menu at the right edge. Focus stays with the row being moved or removed.
 */
export function LevelList({ rule, setRule, err, namesOnly }: { rule: LabRule; setRule: SectionProps["setRule"]; err: (f: string) => string | undefined; /** The Levels dialog: the page beside it holds the Counts boxes. */ namesOnly?: boolean }) {
  const countsErr = err("cfg-counts-from")
  const addErr = err("cfg-add-level")
  const n = rule.levels.length
  const focusAfter = (first: string, second: string) => requestAnimationFrame(() => {
    const a = document.getElementById(first) as HTMLButtonElement | null
    const el = a && !a.disabled ? a : document.getElementById(second)
    el?.focus()
  })
  // Said at the row, and gone with the next edit: the rule object it belongs to is no longer the rule.
  const [moved, setMoved] = React.useState<{ rule: LabRule; index: number; counts: boolean } | null>(null)
  // Each returns the control that takes focus once the menu closes.
  const move = (i: number, d: -1 | 1): string => {
    const j = i + d
    const next = swapItems(rule, "levels", i, j)
    const change = levelMoveChange(rule, next, i, j)
    setMoved(change ? { rule: next, ...change } : null)
    setRule(() => next)
    return `cfg-level-menu-${j}`
  }
  const remove = (i: number): string => {
    setRule((r) => removeLevel(r, i))
    return n > 1 ? `cfg-level-menu-${Math.min(i, n - 2)}` : "cfg-add-level"
  }
  return (
    <FieldSet id="cfg-counts-from" tabIndex={-1} className="flex flex-col gap-3 outline-none" data-counts-from aria-invalid={!!countsErr || undefined} aria-describedby={countsErr ? "cfg-counts-from-error" : undefined}>
      <FieldLegend variant="label" className="sr-only">Accepted levels</FieldLegend>
      {n ? (
        <ol className="flex flex-col divide-y divide-border rounded-[var(--radius)] border border-border" aria-label="Levels">
          {rule.levels.map((name, i) => {
            const id = `cfg-level-${i}`
            const message = err(id)
            const shown = name.trim() || `Level ${i + 1}`
            const ticked = levelTicked(rule, i)
            return (
              <li key={i} className="flex flex-col gap-1 px-3 py-2">
                {/* Number, name, Counts beside the name, the menu on the right edge. In a phone-wide card Counts moves under the name, so the name keeps its width. */}
                {/* Number, name across the row, Counts beside the menu at the right edge, like a table's last two columns. A named level reads as text and shows
                    its field on hover and focus (Rename in the menu focuses it); an empty or invalid one keeps the field's border, so it reads as still to fill. In a
                    phone-wide card Counts moves under the name, so the name keeps its width. */}
                <div className={cn("grid min-w-0 items-center gap-x-3 gap-y-1", namesOnly ? "grid-cols-[1rem_minmax(0,1fr)_auto]" : "grid-cols-[1rem_minmax(0,1fr)_auto] @lg:grid-cols-[1rem_minmax(0,1fr)_auto_auto]")} data-level-row>
                  <span className={cn(TYPE.meta, "text-end tabular-nums")} aria-hidden="true">{i + 1}</span>
                  <Input id={id} className={cn("min-w-0", name.trim() && !message && "border-transparent shadow-none hover:border-input")} aria-label={`Level ${i + 1}`} placeholder={placeholderFor("Level", i, n)} value={name} onChange={(e) => setRule((r) => ({ ...r, levels: r.levels.map((x, k) => (k === i ? e.target.value : x)) }))} aria-invalid={!!message || undefined} aria-describedby={message ? `${id}-error` : undefined} data-level-name />
                  {namesOnly ? null : (
                    <Label htmlFor={`cfg-counts-from-${i}`} className={cn("col-start-2 row-start-2 flex w-fit cursor-pointer items-center gap-2 ps-2.5 font-normal @lg:col-start-3 @lg:row-start-1 @lg:pe-2 @lg:ps-0", TYPE.body, !ticked && "text-muted-foreground")}>
                      <Checkbox id={`cfg-counts-from-${i}`} aria-label={`Accept ${shown}`} checked={ticked} onCheckedChange={(c) => setRule((r) => withLevelTicked(r, i, c === true))} />
                      <span aria-hidden="true">Accepted</span>
                    </Label>
                  )}
                  <span className={cn("col-start-3 row-start-1 flex justify-end", !namesOnly && "@lg:col-start-4")}>
                    <LevelMenu index={i} n={n} shown={shown} onMove={(d) => move(i, d)} onRemove={() => remove(i)} onRename={() => id} />
                  </span>
                </div>
                {message ? <FieldError id={`${id}-error`} className="ms-7">{message}</FieldError> : null}
                {moved?.rule === rule && moved.index === i ? <p role="status" className={cn(TYPE.helper, "ms-7")} data-level-count-change>{moved.counts ? "Now accepted: it sits above an accepted level." : "No longer accepted: it sits below a level that is not accepted."}</p> : null}
              </li>
            )
          })}
        </ol>
      ) : null}
      {countsErr ? <FieldError id="cfg-counts-from-error">{countsErr}</FieldError> : null}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <Button id="cfg-add-level" type="button" variant="outline" size="sm" aria-describedby={addErr ? "cfg-add-level-error" : undefined} onClick={() => { setRule((r) => ({ ...r, levels: [...r.levels, ""] })); focusAfter(`cfg-level-${n}`, "cfg-add-level") }}>Add a level</Button>
        <PresetChips rule={rule} setRule={setRule} quiet />
      </div>
      {addErr ? <FieldError id="cfg-add-level-error">{addErr}</FieldError> : null}
    </FieldSet>
  )
}
