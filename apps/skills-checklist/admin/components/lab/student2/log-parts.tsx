"use client"

/**
 * Pieces shared by Log a skill and Send for evaluation: the skill picker (search over the whole library, grouped by section,
 * "Likely here" first, never restricted), where it happened (from the placement), the program's submission details, the
 * optional self-evaluation, who signs off (site evaluators or anyone by name and email) and the four ways to reach them.
 * Compact DS controls (32 px) on desktop; touch height below the sm breakpoint.
 */
import * as React from "react"
import { AvatarInitials } from "@exxatdesignux/ui/components/ui/avatar"
import { Badge } from "@exxatdesignux/ui/components/ui/badge"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@exxatdesignux/ui/components/ui/command"
import { DatePickerField } from "@exxatdesignux/ui/components/ui/date-picker-field"
import { Field, FieldDescription, FieldError, FieldLabel, FieldLegend, FieldSet } from "@exxatdesignux/ui/components/ui/field"
import { Input } from "@exxatdesignux/ui/components/ui/input"
import { Label } from "@exxatdesignux/ui/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@exxatdesignux/ui/components/ui/popover"
import { RadioGroup, RadioGroupItem } from "@exxatdesignux/ui/components/ui/radio-group"
import { SelectionTileGrid } from "@exxatdesignux/ui/components/ui/selection-tile-grid"
import { StatusBadge } from "@exxatdesignux/ui/components/ui/status-badge"
import { ToggleGroup, ToggleGroupItem } from "@exxatdesignux/ui/components/ui/toggle-group"
import { cn } from "@exxatdesignux/ui/lib/utils"
import { StateGlyph, stateWord } from "@/components/lab/student/parts"
import { initialsOf } from "@/lib/v2/format"
import { skillNoun, skillNounPlural } from "@/lib/lab/terms"
import { ratingOptions } from "@/lib/v2/student"
import { skillById } from "@/lib/v2/evidence-index"
import type { SignoffMethod, V2State } from "@/lib/v2/types"
import {
  METHODS,
  PRACTICE_LINE,
  PROGRAM_DETAILS,
  pickerGroups,
  type DetailValues,
  type EvaluatorOption,
  type NewEvaluator,
  type PickRow,
  type WhereChoice,
} from "@/lib/lab/student2"

import { TOUCH_ROW } from "./touch"
export { TOUCH_ROW }

// ---------------------------------------------------------------------------------------------------------------------
// Skill picker

/**
 * Search over every configured skill (150+), grouped by section, "Likely here" first (the group heading says it; a star marks a likely skill only outside that group). Multi-select: several skills
 * from one sitting become one request [REQ ST-04, EV-05]. Skills not on a course stay reachable [REQ ST-02, CM-05].
 */
export function SkillPicker({ rows, selected, onToggle, listClassName, autoFocus = false, mode = "select" }: { rows: PickRow[]; selected: string[]; onToggle: (id: string) => void; listClassName?: string; autoFocus?: boolean; /** "add": each choice adds one entry (plus icon), "select": multi-select (checkbox). */ mode?: "select" | "add" }) {
  const [q, setQ] = React.useState("")
  const groups = React.useMemo(() => pickerGroups(rows, q), [rows, q])
  const shown = groups.reduce((n, g) => n + g.rows.length, 0)
  return (
    <Command shouldFilter={false} className="rounded-lg border border-border" label={`Search ${skillNounPlural()}`}>
      <CommandInput value={q} onValueChange={setQ} placeholder={`Search ${rows.length} ${skillNounPlural()} or a section`} autoFocus={autoFocus} />
      <CommandList className={cn("max-h-60", listClassName)} aria-label={`${shown} ${skillNounPlural()}`}>
        <CommandEmpty>{`No ${skillNoun()} matches. Try a shorter word.`}</CommandEmpty>
        {groups.map((g) => (
          <CommandGroup key={g.key} heading={g.key === "likely" ? `${g.title} (${g.rows.length})` : g.title}>
            {g.rows.map((r) => {
              const on = selected.includes(r.id)
              return (
                <CommandItem key={`${g.key}-${r.id}`} value={`${g.key}-${r.id}`} onSelect={() => onToggle(r.id)} data-checked={mode === "select" ? on : undefined} className={cn("gap-2", TOUCH_ROW)}>
                  <i className={cn(mode === "add" ? "fa-light fa-plus" : on ? "fa-solid fa-square-check" : "fa-light fa-square", "text-sm")} style={{ color: on ? "var(--foreground)" : "var(--muted-foreground)" }} aria-hidden="true" />
                  <span className="min-w-0 flex-1 truncate">{r.name}</span>
                  {r.likely && g.key !== "likely" ? <i className="fa-solid fa-star text-xs text-muted-foreground" role="img" aria-label="Likely here" /> : null}
                  {r.state ? (
                    <span className="hidden items-center gap-1 text-xs text-muted-foreground sm:inline-flex">
                      <StateGlyph state={r.state} className="text-xs" />
                      {r.state === "progress" ? r.stateLabel ?? stateWord(r.state) : stateWord(r.state)}
                    </span>
                  ) : null}
                  {mode === "select" ? <span className="sr-only">{on ? "Selected" : "Not selected"}</span> : null}
                </CommandItem>
              )
            })}
          </CommandGroup>
        ))}
      </CommandList>
    </Command>
  )
}

/** Selected skills as removable chips. */
export function SelectedSkills({ s, ids, onRemove }: { s: V2State; ids: string[]; onRemove: (id: string) => void }) {
  if (ids.length === 0) return null
  return (
    <ul className="flex flex-wrap gap-1.5" aria-label={`Selected ${skillNounPlural()}`}>
      {ids.map((id) => {
        const name = skillById(s, id)?.name ?? skillNoun()
        return (
          <li key={id}>
            <Badge variant="outline" className="h-7 gap-1 pe-0.5 ps-2.5 text-sm font-normal">
              {name}
              <Button type="button" variant="ghost" size="icon-xs" aria-label={`Remove ${name}`} onClick={() => onRemove(id)}>
                <i className="fa-light fa-xmark" aria-hidden="true" />
              </Button>
            </Badge>
          </li>
        )
      })}
    </ul>
  )
}

// ---------------------------------------------------------------------------------------------------------------------
// Where

/** From the placement [REQ ST-06]; one placement is preselected. Lab and simulation are practice and say so once. */
export function WhereField({ choices, value, onChange, id = "where" }: { choices: WhereChoice[]; value: string; onChange: (v: string) => void; id?: string }) {
  const practice = choices.find((c) => c.value === value)?.setting !== "clinical" && !!value
  return (
    <FieldSet>
      <FieldLegend variant="label">Where</FieldLegend>
      <RadioGroup value={value} onValueChange={onChange} className="grid gap-2 sm:grid-cols-2" aria-label="Where you did it">
        {choices.map((c) => {
          const itemId = `${id}-${c.value.replace(/[^a-z0-9]/gi, "-")}`
          return (
            <Label key={c.value} htmlFor={itemId} className={cn("flex cursor-pointer items-center gap-3 rounded-md border border-border px-3 py-2 font-normal has-[[data-state=checked]]:border-foreground", TOUCH_ROW)}>
              <RadioGroupItem value={c.value} id={itemId} />
              <span className="flex min-w-0 flex-col">
                <span className="truncate text-sm text-foreground">{c.label}</span>
                <span className="truncate text-xs text-muted-foreground">{c.setting === "clinical" ? `${c.clinicalSetting}` : "Practice"}</span>
              </span>
            </Label>
          )
        })}
      </RadioGroup>
      {practice ? <FieldDescription>{PRACTICE_LINE}</FieldDescription> : null}
    </FieldSet>
  )
}

// ---------------------------------------------------------------------------------------------------------------------
// Program-defined details [REQ SC-13, ST-10]

const toDate = (v: string) => (v ? new Date(`${v}T12:00:00`) : undefined)
const fromDate = (d: Date | undefined) => (d ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}` : "")

export function DetailsFields({ values, onChange, errors, showErrors, idPrefix = "detail", columns = true }: { values: DetailValues; onChange: (id: string, v: string) => void; errors: Record<string, string>; showErrors: boolean; idPrefix?: string; columns?: boolean }) {
  return (
    <div className={cn("grid gap-3", columns ? "sm:grid-cols-3" : "")}>
      {PROGRAM_DETAILS.map((f) => {
        const id = `${idPrefix}-${f.id}`
        const err = showErrors ? errors[f.id] : undefined
        return (
          <Field key={f.id} data-invalid={!!err}>
            <FieldLabel htmlFor={id}>
              {f.label}
              {f.required ? null : <span className="font-normal text-muted-foreground"> (optional)</span>}
            </FieldLabel>
            {f.type === "date" ? (
              <DatePickerField id={id} value={toDate(values[f.id] ?? "")} onChange={(d) => onChange(f.id, fromDate(d))} triggerClassName={cn("h-8 text-sm", TOUCH_ROW)} toYear={2026} />
            ) : (
              <Input id={id} value={values[f.id] ?? ""} onChange={(e) => onChange(f.id, e.target.value)} aria-invalid={!!err || undefined} aria-describedby={f.helper ? `${id}-help` : undefined} className={TOUCH_ROW} inputMode={f.type === "number" ? "numeric" : undefined} />
            )}
            {f.helper && !err ? <FieldDescription id={`${id}-help`}>{f.helper}</FieldDescription> : null}
            {err ? <FieldError>{err}</FieldError> : null}
          </Field>
        )
      })}
    </div>
  )
}

// ---------------------------------------------------------------------------------------------------------------------
// Self-evaluation, only where the program switched it on [REQ SC-15, ST-11]

export function SelfEvalFields({ s, ids, values, onChange }: { s: V2State; ids: string[]; values: Record<string, string>; onChange: (id: string, v: string) => void }) {
  if (ids.length === 0) return null
  return (
    <FieldSet>
      <FieldLegend variant="label">Rate yourself</FieldLegend>
      <FieldDescription>Your evaluator sees this beside their own answer.</FieldDescription>
      <ul className="flex flex-col gap-3">
        {ids.map((id) => {
          const skill = skillById(s, id)
          if (!skill) return null
          const labelId = `self-${id}`
          return (
            <li key={id} className="flex flex-col gap-1.5">
              <span id={labelId} className="text-sm text-foreground">{skill.name}</span>
              <ToggleGroup type="single" variant="outline" spacing={2} value={values[id] ?? ""} onValueChange={(v) => { if (v) onChange(id, v) }} aria-labelledby={labelId} className="flex w-full flex-wrap justify-start">
                {ratingOptions(skill).map((o) => (
                  <ToggleGroupItem key={o} value={o} size="sm" className={cn("px-2.5", TOUCH_ROW)}>{o}</ToggleGroupItem>
                ))}
              </ToggleGroup>
            </li>
          )
        })}
      </ul>
    </FieldSet>
  )
}

// ---------------------------------------------------------------------------------------------------------------------
// Who signs off [REQ ST-08, ST-09]

export type WhoValue = { kind: "person"; id: string } | { kind: "new" } | null

/** Above this many evaluators the list gets a search (strategy/07: a choice of more than 7 gets type-to-search). */
export const SEARCH_AFTER = 7

function EvaluatorSearch({ options, onPick }: { options: EvaluatorOption[]; onPick: (id: string) => void }) {
  const [open, setOpen] = React.useState(false)
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button type="button" variant="outline" size="sm" className={cn("self-start", TOUCH_ROW)} aria-expanded={open} data-evaluator-search>
          Find an evaluator
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-80 p-0">
        <Command label="Find an evaluator">
          <CommandInput placeholder="Type a name" aria-label="Type a name" />
          <CommandList>
            <CommandEmpty>Nobody matches. Choose Someone not listed below.</CommandEmpty>
            <CommandGroup>
              {options.map((o) => (
                <CommandItem key={o.id} value={`${o.name} ${o.role ?? ""}`} onSelect={() => { onPick(o.id); setOpen(false) }}>
                  <span className="flex min-w-0 flex-col">
                    <span className="truncate text-sm">{o.name}</span>
                    <span className="truncate text-xs text-muted-foreground">{o.role}</span>
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

export function EvaluatorPicker({ options, value, onChange, fresh, onFresh, errors, showErrors, compact = false }: { options: EvaluatorOption[]; value: WhoValue; onChange: (v: WhoValue) => void; fresh: NewEvaluator; onFresh: (n: NewEvaluator) => void; errors: { name?: string; email?: string }; showErrors: boolean; compact?: boolean }) {
  const [showAll, setShowAll] = React.useState(false)
  const here = options.filter((o) => o.here)
  const faculty = options.filter((o) => !o.here && o.eligible)
  const list = showAll || compact === false ? [...here, ...faculty] : here
  const radio = value?.kind === "person" ? value.id : value?.kind === "new" ? "__new" : ""
  const anyEligible = options.some((o) => o.eligible)
  return (
    <FieldSet>
      <FieldLegend variant="label">Who signs off</FieldLegend>
      {!anyEligible ? <FieldDescription>Nobody on record can sign off every skill you picked. Name someone below, or send fewer skills.</FieldDescription> : null}
      {/* Hick's law (strategy/07): more than 7 choices get type-to-search (Popover + Command; the DS has no Combobox). */}
      {list.length > SEARCH_AFTER ? <EvaluatorSearch options={[...here, ...faculty].filter((o) => o.eligible)} onPick={(id) => onChange({ kind: "person", id })} /> : null}
      <RadioGroup value={radio} onValueChange={(v) => onChange(v === "__new" ? { kind: "new" } : { kind: "person", id: v })} className="flex flex-col gap-1.5" aria-label="Who signs off">
        {list.map((o) => {
          const id = `who-${o.id}`
          return (
            <Label key={o.id} htmlFor={id} className={cn("flex items-center gap-3 rounded-md border border-border px-3 py-2 font-normal has-[[data-state=checked]]:border-foreground", o.eligible ? "cursor-pointer" : "cursor-not-allowed opacity-70", TOUCH_ROW)}>
              <RadioGroupItem value={o.id} id={id} disabled={!o.eligible} aria-describedby={o.reason ? `${id}-why` : undefined} />
              <AvatarInitials initials={initialsOf(o.name)} size="sm" aria-hidden="true" />
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-sm text-foreground">{o.name}</span>
                <span id={o.reason ? `${id}-why` : undefined} className="truncate text-xs text-muted-foreground">{o.reason ?? o.role}</span>
              </span>
            </Label>
          )
        })}
        <Label htmlFor="who-new" className={cn("flex cursor-pointer items-center gap-3 rounded-md border border-dashed border-border px-3 py-2 font-normal has-[[data-state=checked]]:border-foreground", TOUCH_ROW)}>
          <RadioGroupItem value="__new" id="who-new" />
          <span className="text-sm text-foreground">Someone not listed</span>
        </Label>
      </RadioGroup>
      {compact && !showAll && faculty.length > 0 ? (
        <Button type="button" variant="ghost" size="sm" className="self-start" onClick={() => setShowAll(true)}>
          {`Show program faculty (${faculty.length})`}
        </Button>
      ) : null}
      {value?.kind === "new" ? (
        <div className="grid gap-3 rounded-md bg-muted/50 p-3 sm:grid-cols-2">
          <Field data-invalid={showErrors && !!errors.name}>
            <FieldLabel htmlFor="new-name">Full name</FieldLabel>
            <Input id="new-name" value={fresh.name} onChange={(e) => onFresh({ ...fresh, name: e.target.value })} autoComplete="name" aria-invalid={(showErrors && !!errors.name) || undefined} className={TOUCH_ROW} />
            {showErrors && errors.name ? <FieldError>{errors.name}</FieldError> : null}
          </Field>
          <Field data-invalid={showErrors && !!errors.email}>
            <FieldLabel htmlFor="new-email">Email</FieldLabel>
            <Input id="new-email" type="email" inputMode="email" value={fresh.email} onChange={(e) => onFresh({ ...fresh, email: e.target.value })} autoComplete="email" aria-invalid={(showErrors && !!errors.email) || undefined} className={TOUCH_ROW} />
            {showErrors && errors.email ? <FieldError>{errors.email}</FieldError> : null}
          </Field>
          <p className="flex items-center gap-2 text-xs text-muted-foreground sm:col-span-2">
            <StatusBadge label="Not yet recorded" tone="neutral" icon="fa-user-plus" size="sm" />
            Your program adds them before it counts.
          </p>
        </div>
      ) : null}
    </FieldSet>
  )
}

// ---------------------------------------------------------------------------------------------------------------------
// How it reaches them

export function MethodTiles({ value, onChange, offline, methods = METHODS }: { value: SignoffMethod; onChange: (m: SignoffMethod) => void; offline: boolean; methods?: typeof METHODS }) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-medium text-foreground" id="method-label">How they sign</span>
      <SelectionTileGrid
        interaction="radio"
        idPrefix="method"
        columns={methods.length === 4 ? 4 : 2}
        className={methods.length === 4 ? "max-w-xl" : "max-w-60"}
        density="compact"
        labelPlacement="below"
        value={value}
        onValueChange={(v) => onChange(v as SignoffMethod)}
        options={methods.map((m) => ({ value: m.id, label: offline && !m.offline ? `${m.label}, later` : m.label, icon: m.icon }))}
      />
    </div>
  )
}

/** Real, scannable QR from lib/v2/qr (no dependency). Foreground on background tokens. */
export { QrSvg } from "./qr"
