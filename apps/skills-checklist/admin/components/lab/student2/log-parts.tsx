"use client"

/**
 * Pieces shared by Log a skill and Send for evaluation: the skill picker (search over the whole library, grouped by section,
 * "Likely here" first, never restricted), where it happened (from the placement), the program's submission details, the
 * optional self-evaluation, who signs off (site evaluators or anyone by name and email) and the four ways to reach them.
 * Compact DS controls (32 px) on desktop; touch height below the sm breakpoint.
 */
import { TYPE } from "@/components/lab/type-scale"
import * as React from "react"
import { AvatarInitials } from "@exxatdesignux/ui/components/ui/avatar"
import { Badge } from "@exxatdesignux/ui/components/ui/badge"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@exxatdesignux/ui/components/ui/collapsible"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@exxatdesignux/ui/components/ui/command"
import { InputGroup, InputGroupAddon, InputGroupInput } from "@exxatdesignux/ui/components/ui/input-group"
import { DatePickerField } from "@exxatdesignux/ui/components/ui/date-picker-field"
import { Field, FieldDescription, FieldError, FieldLabel, FieldLegend, FieldSet } from "@exxatdesignux/ui/components/ui/field"
import { Input } from "@exxatdesignux/ui/components/ui/input"
import { Label } from "@exxatdesignux/ui/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@exxatdesignux/ui/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@exxatdesignux/ui/components/ui/select"
import { SelectionTileGrid } from "@exxatdesignux/ui/components/ui/selection-tile-grid"
import { StatusBadge } from "@exxatdesignux/ui/components/ui/status-badge"
import { Textarea } from "@exxatdesignux/ui/components/ui/textarea"
import { ToggleGroup, ToggleGroupItem } from "@exxatdesignux/ui/components/ui/toggle-group"
import { cn } from "@exxatdesignux/ui/lib/utils"
import { StateGlyph, stateWord } from "@/components/lab/student/parts"
import { initialsOf } from "@/lib/v2/format"
import { skillNoun, skillNounPlural } from "@/lib/lab/terms"
import { ratingKind, ratingOptions } from "@/lib/v2/student"
import { skillById } from "@/lib/v2/evidence-index"
import type { SignoffMethod, Skill, V2State } from "@/lib/v2/types"
import {
  evaluationPreview,
  METHODS,
  NOTE_HELPER,
  NOTE_LABEL,
  PRACTICE_LINE,
  PROGRAM_DETAILS,
  STUDENT_NOTE_MAX,
  pickerGroups,
  type DetailField,
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
  // Sent before [REQ ST-03]: one switch isolates the skills already submitted, so an earlier one is found in a library of 150+.
  const [sentOnly, setSentOnly] = React.useState(false)
  const sentCount = React.useMemo(() => rows.filter((r) => r.submitted).length, [rows])
  const groups = React.useMemo(() => pickerGroups(rows, q, sentOnly), [rows, q, sentOnly])
  const shown = groups.reduce((n, g) => n + g.rows.length, 0)
  return (
    <div className="flex flex-col gap-2">
    {sentCount > 0 ? (
      <ToggleGroup type="single" variant="outline" size="sm" value={sentOnly ? "sent" : "all"} onValueChange={(v) => { if (v) setSentOnly(v === "sent") }} aria-label={`Which ${skillNounPlural()} to list`} className="justify-start" data-picker-scope>
        <ToggleGroupItem value="all" className={cn("px-2.5", TOUCH_ROW)}>{`All (${rows.length})`}</ToggleGroupItem>
        <ToggleGroupItem value="sent" className={cn("px-2.5", TOUCH_ROW)}>{`Sent before (${sentCount})`}</ToggleGroupItem>
      </ToggleGroup>
    ) : null}
    <Command shouldFilter={false} className="rounded-lg border border-border" label={`Search ${skillNounPlural()}`}>
      <CommandInput value={q} onValueChange={setQ} placeholder={`Search ${sentOnly ? sentCount : rows.length} ${skillNounPlural()} or a section`} autoFocus={autoFocus} />
      <CommandList className={cn("max-h-60", listClassName)} aria-label={`${shown} ${skillNounPlural()}`}>
        <CommandEmpty>{`No ${skillNoun()} matches. Try a shorter word.`}</CommandEmpty>
        {groups.map((g) => (
          <CommandGroup key={g.key} heading={g.key === "likely" ? `${g.title} (${g.rows.length})` : g.title}>
            {g.rows.map((r) => {
              const on = selected.includes(r.id)
              return (
                <CommandItem key={`${g.key}-${r.id}`} value={`${g.key}-${r.id}`} onSelect={() => onToggle(r.id)} data-checked={mode === "select" ? on : undefined} className={cn("gap-2", TOUCH_ROW)}>
                  <i className={cn(mode === "add" ? "fa-light fa-plus" : on ? "fa-solid fa-square-check" : "fa-light fa-square", "text-sm")} style={{ color: on ? "var(--foreground)" : "var(--muted-foreground)" }} aria-hidden="true" />
                  <span className="min-w-0 flex-1">{r.name}</span>
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
    </div>
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

/**
 * Where it was performed [REQ ST-05, ST-06, ST-07]: the student's placements (one is preselected), else the program's settings,
 * plus lab and simulation (signed off by a lab instructor or faculty). The location field shows only when no placement supplies
 * it, and is mandatory then; the lab rule is said once when lab or simulation is chosen.
 */
export function WhereField({ choices, value, onChange, id = "where", location = "", onLocation, locationError, showErrors = false }: { choices: WhereChoice[]; value: string; onChange: (v: string) => void; id?: string; location?: string; onLocation?: (v: string) => void; locationError?: string | null; showErrors?: boolean }) {
  const chosen = choices.find((c) => c.value === value)
  const practice = chosen?.setting !== "clinical" && !!value
  return (
    // min-w-0 on the fieldset (its default min-inline-size is min-content) and minmax(0,1fr) columns keep the tiles inside the
    // card at 375; site names wrap at spaces, never truncate (anatomy A12, 2026-10-30).
    <FieldSet className="min-w-0">
      <FieldLegend variant="label">Where</FieldLegend>
      <RadioGroup value={value} onValueChange={onChange} className="grid grid-cols-[minmax(0,1fr)] gap-2 sm:grid-cols-2 xl:grid-cols-3" aria-label="Where you did it">
        {choices.map((c) => {
          const itemId = `${id}-${c.value.replace(/[^a-z0-9]/gi, "-")}`
          return (
            <Label key={c.value} htmlFor={itemId} className={cn("flex min-w-0 cursor-pointer items-center gap-3 rounded-md border border-border px-3 py-2 font-normal has-[[data-state=checked]]:border-foreground", TOUCH_ROW)}>
              <RadioGroupItem value={c.value} id={itemId} />
              <span className="flex min-w-0 flex-col">
                <span className="text-sm text-foreground">{c.label}</span>
                <span className="text-xs text-muted-foreground">{c.setting === "clinical" ? `${c.clinicalSetting}` : "Lab instructor or faculty"}</span>
              </span>
            </Label>
          )
        })}
      </RadioGroup>
      {chosen?.askLocation && onLocation ? <LocationField id={`${id}-location`} value={location} onChange={onLocation} error={showErrors ? locationError ?? null : null} /> : null}
      {practice ? <FieldDescription>{PRACTICE_LINE}</FieldDescription> : null}
    </FieldSet>
  )
}

/** The same choice as one select, for compact forms (Send, Fix, the shift log) [REQ ST-05, ST-06]. */
export function WhereSelect({ choices, value, onChange, id = "where-select", label = "Where", className }: { choices: WhereChoice[]; value: string; onChange: (v: string) => void; id?: string; label?: string; className?: string }) {
  return (
    <Field className={className}>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger id={id} size="sm" className={cn("w-full", TOUCH_ROW)}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {choices.map((w) => <SelectItem key={w.value} value={w.value}>{w.setting === "clinical" ? `${w.label}, ${w.clinicalSetting}` : w.label}</SelectItem>)}
        </SelectContent>
      </Select>
    </Field>
  )
}

/** Location, typed when no placement supplies it [REQ ST-07]. */
export function LocationField({ id, value, onChange, error }: { id: string; value: string; onChange: (v: string) => void; error: string | null }) {
  return (
    <Field data-invalid={!!error} className="sm:max-w-sm">
      <FieldLabel htmlFor={id}>Location</FieldLabel>
      <Input id={id} value={value} onChange={(e) => onChange(e.target.value)} aria-invalid={!!error || undefined} autoComplete="off" className={TOUCH_ROW} />
      {error ? <FieldError>{error}</FieldError> : <FieldDescription>Unit or clinic name.</FieldDescription>}
    </Field>
  )
}

/** One narrative note per request, kept apart from the evaluator's comment [REQ ST-12]. */
export function NoteField({ id = "student-note", value, onChange, error, label = NOTE_LABEL, rows = 2, helper = NOTE_HELPER }: { id?: string; value: string; onChange: (v: string) => void; error?: string | null; label?: string; rows?: number; /** null where the page already says it (Fix: "What you changed"). */ helper?: string | null }) {
  return (
    <Field data-invalid={!!error}>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Textarea id={id} rows={rows} maxLength={STUDENT_NOTE_MAX} value={value} onChange={(e) => onChange(e.target.value)} aria-invalid={!!error || undefined} aria-describedby={helper && !error ? `${id}-help` : undefined} />
      {error ? <FieldError>{error}</FieldError> : helper ? <FieldDescription id={`${id}-help`}>{helper}</FieldDescription> : null}
    </Field>
  )
}

// ---------------------------------------------------------------------------------------------------------------------
// Program-defined details [REQ SC-13, ST-10]

const toDate = (v: string) => (v ? new Date(`${v}T12:00:00`) : undefined)
const fromDate = (d: Date | undefined) => (d ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}` : "")

/**
 * The details the program asks for, as configured on the chosen skills (lib/lab/student2.ts detailFieldsFor) [REQ SC-13, ST-10]. A
 * long text field and a choice list each take a full row; the error sits on the field.
 */
export function DetailsFields({ values, onChange, errors, showErrors, idPrefix = "detail", columns = true, pairs = false, fields = PROGRAM_DETAILS }: { values: DetailValues; onChange: (id: string, v: string) => void; errors: Record<string, string>; showErrors: boolean; idPrefix?: string; columns?: boolean; /** Required fields two to a row, each optional one on its own full row (Fix: Date and Unit, then Case reference). */ pairs?: boolean; /** The configured fields; pass detailFieldsFor(state, skillIds). */ fields?: DetailField[] }) {
  if (fields.length === 0) return null
  // A fixed grid, so one configured field (Date performed) keeps a field's width instead of stretching across the form.
  const cols = pairs ? "sm:grid-cols-2" : columns ? "sm:grid-cols-3" : ""
  return (
    <div className={cn("grid gap-3", cols)} data-detail-fields={fields.map((f) => f.id).join(" ")}>
      {fields.map((f) => {
        const id = `${idPrefix}-${f.id}`
        const err = showErrors ? errors[f.id] : undefined
        const wide = f.type === "long" || (pairs && !f.required)
        return (
          <Field key={f.id} data-invalid={!!err} className={wide ? (pairs ? "sm:col-span-2" : columns ? "sm:col-span-3" : undefined) : undefined}>
            <FieldLabel htmlFor={id}>
              {f.label}
              {f.required ? null : <span className="font-normal text-muted-foreground"> (optional)</span>}
            </FieldLabel>
            {f.type === "date" ? (
              <DatePickerField id={id} value={toDate(values[f.id] ?? "")} onChange={(d) => onChange(f.id, fromDate(d))} triggerClassName={cn("h-8 text-sm", TOUCH_ROW)} toYear={2026} />
            ) : f.type === "long" ? (
              <Textarea id={id} rows={2} value={values[f.id] ?? ""} onChange={(e) => onChange(f.id, e.target.value)} aria-invalid={!!err || undefined} aria-describedby={f.helper ? `${id}-help` : undefined} />
            ) : f.type === "choice" ? (
              <Select value={values[f.id] ?? ""} onValueChange={(v) => onChange(f.id, v)}>
                <SelectTrigger id={id} aria-invalid={!!err || undefined} className={cn("w-full", TOUCH_ROW)}>
                  <SelectValue placeholder="Choose one" />
                </SelectTrigger>
                <SelectContent>
                  {(f.options ?? []).map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                </SelectContent>
              </Select>
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

/**
 * What the student picks when rating themselves: the evaluator's own scale (levels, or the outcome labels of an approved-or-not
 * skill). A questions skill has no single scale, so the student rates its final result in the program's outcome words; without
 * this a questions skill that asks for a self-evaluation showed no choice and blocked Continue (fulfillment walkthrough,
 * 2026-10-27).
 */
export function selfEvalOptions(skill: Skill): string[] {
  const own = ratingOptions(skill)
  if (own.length) return own
  return (skill.config?.outcomeLabels ?? []).filter((l) => l.trim())
}

export function SelfEvalFields({ s, ids, values, onChange, quiet = false }: { s: V2State; ids: string[]; values: Record<string, string>; onChange: (id: string, v: string) => void; /** The page already says it (Send C "Evaluate yourself" and its summary): legend for screen readers only, no helper. */ quiet?: boolean }) {
  if (ids.length === 0) return null
  return (
    <FieldSet>
      <FieldLegend variant="label" className={quiet ? "sr-only" : undefined}>Self-evaluation</FieldLegend>
      {quiet ? null : <FieldDescription>Your evaluator sees this beside their own answer.</FieldDescription>}
      <ul className="flex flex-col gap-3">
        {ids.map((id) => {
          const skill = skillById(s, id)
          if (!skill) return null
          const labelId = `self-${id}`
          return (
            <li key={id} className="flex flex-col gap-1.5">
              <span id={labelId} className="text-sm text-foreground">{skill.name}</span>
              <ToggleGroup type="single" variant="outline" spacing={2} value={values[id] ?? ""} onValueChange={(v) => { if (v) onChange(id, v) }} aria-labelledby={labelId} className="flex w-full flex-wrap justify-start">
                {selfEvalOptions(skill).map((o) => (
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

/** Matches shown before "Show all n" (Romit 2026-10-27: a search box, then a short list of matches). */
export const PICKER_VISIBLE = 5

/**
 * Who signs off [REQ ST-08, ST-09, SC-16] (Romit 2026-10-27: "who signs off should have had a search textbox?"). A search box right
 * under the label filters as you type (name, role or site); the matches follow as one-line rows (radio, avatar, name, role and
 * site), the placement's evaluators first, at most 5 before "Show all n". `pinnedId` puts one person first with "Signed before" (a
 * further attempt's previous evaluator). "Someone not listed" is always last: name and email, no account needed. Arrow Down from
 * the search moves into the list (the radio group moves with the arrow keys); Enter in the search picks the first match.
 */
export function EvaluatorPicker({ options, value, onChange, fresh, onFresh, errors, showErrors, pinnedId, legend = "Who signs off", legendHidden = false }: { options: EvaluatorOption[]; value: WhoValue; onChange: (v: WhoValue) => void; fresh: NewEvaluator; onFresh: (n: NewEvaluator) => void; errors: { name?: string; email?: string }; showErrors: boolean; /** Kept for older callers; the list is always compact now. */ compact?: boolean; pinnedId?: string | null; legend?: string; /** The page already titles the section (Fix "2 Who signs"): legend for screen readers only. */ legendHidden?: boolean }) {
  const [q, setQ] = React.useState("")
  const [showAll, setShowAll] = React.useState(false)
  const listRef = React.useRef<HTMLDivElement>(null)
  const ordered = React.useMemo(() => {
    const rank = (o: EvaluatorOption) => (o.id === pinnedId ? 0 : o.here ? 1 : o.eligible ? 2 : 3)
    return [...options].sort((a, b) => rank(a) - rank(b) || a.name.localeCompare(b.name))
  }, [options, pinnedId])
  const needle = q.trim().toLowerCase()
  const matches = needle ? ordered.filter((o) => `${o.name} ${o.role}`.toLowerCase().includes(needle)) : ordered
  // The chosen person stays visible even when the list is cut, so the choice is never hidden.
  const cut = showAll || needle ? matches : matches.slice(0, PICKER_VISIBLE)
  const chosen = value?.kind === "person" ? matches.find((o) => o.id === value.id) : undefined
  const visible = chosen && !cut.includes(chosen) ? [...cut, chosen] : cut
  const radio = value?.kind === "person" ? value.id : value?.kind === "new" ? "__new" : ""
  const anyEligible = options.some((o) => o.eligible)
  const firstEligible = matches.find((o) => o.eligible)
  return (
    <FieldSet data-evaluator-picker>
      <FieldLegend variant="label" className={legendHidden ? "sr-only" : undefined}>{legend}</FieldLegend>
      {!anyEligible ? <FieldDescription>{`Nobody on record can sign off every ${skillNoun()} you picked. Name someone below, or send fewer ${skillNounPlural()}.`}</FieldDescription> : null}
      <InputGroup className="max-w-md">
        <InputGroupAddon align="inline-start">
          <i className="fa-light fa-magnifying-glass" aria-hidden="true" />
        </InputGroupAddon>
        <InputGroupInput
          type="search"
          value={q}
          onChange={(e) => { setQ(e.target.value); setShowAll(false) }}
          placeholder="Search by name"
          aria-label="Search evaluators by name"
          aria-controls="who-list"
          data-evaluator-search
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault()
              listRef.current?.querySelector<HTMLButtonElement>("button[role=radio]:not([disabled])")?.focus()
            } else if (e.key === "Enter") {
              e.preventDefault()
              if (firstEligible) onChange({ kind: "person", id: firstEligible.id })
            }
          }}
        />
      </InputGroup>
      <div ref={listRef}>
      <RadioGroup id="who-list" value={radio} onValueChange={(v) => onChange(v === "__new" ? { kind: "new" } : { kind: "person", id: v })} className="flex flex-col gap-0 divide-y divide-border rounded-md border border-border" aria-label={legend}>
        {visible.map((o) => {
          const id = `who-${o.id}`
          return (
            <Label key={o.id} htmlFor={id} className={cn("flex min-h-10 items-center gap-3 px-3 py-1.5 font-normal has-[[data-state=checked]]:bg-muted", o.eligible ? "cursor-pointer" : "cursor-not-allowed", TOUCH_ROW)} data-who-row={o.id}>
              <RadioGroupItem value={o.id} id={id} disabled={!o.eligible} aria-describedby={o.reason ? `${id}-why` : undefined} />
              <AvatarInitials initials={initialsOf(o.name)} size="sm" aria-hidden="true" />
              <span className="flex min-w-0 flex-1 flex-wrap items-baseline gap-x-2">
                <span className={cn("text-sm", o.eligible ? "text-foreground" : "text-muted-foreground")}>{o.name}</span>
                <span id={o.reason ? `${id}-why` : undefined} className="truncate text-xs text-muted-foreground">{o.reason ?? o.role}</span>
              </span>
              {o.id === pinnedId ? <Badge variant="outline">Signed before</Badge> : null}
            </Label>
          )
        })}
        {needle && matches.length === 0 ? <p className="px-3 py-2 text-sm text-muted-foreground" role="status" data-who-empty>No match. Add someone not listed.</p> : null}
        <Label htmlFor="who-new" className={cn("flex min-h-10 cursor-pointer items-center gap-3 px-3 py-1.5 font-normal has-[[data-state=checked]]:bg-muted", TOUCH_ROW)}>
          <RadioGroupItem value="__new" id="who-new" />
          <span className="text-sm text-foreground">Someone not listed</span>
          <span className="text-xs text-muted-foreground">No account needed</span>
        </Label>
      </RadioGroup>
      </div>
      {!showAll && !needle && matches.length > PICKER_VISIBLE ? (
        <Button type="button" variant="ghost" size="sm" className="self-start" onClick={() => setShowAll(true)}>{`Show all ${matches.length}`}</Button>
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
// Self-evaluation against the evaluator's own criteria [REQ ST-11: "the student records a self-evaluation against the same
// criteria the evaluator will use"; SC-15] (Romit 2026-10-27: "this layout isn't good at all")

export type SelfAnswers = Record<string, Array<"yes" | "no" | null>>

interface SelfShape {
  skill: Skill
  questions: string[]
  /** The single choice: the overall result of a questions skill (when it has one), the level, or the outcome. */
  overall: string[]
  overallLabel: string
  rule: string
}

export function selfShape(skill: Skill): SelfShape {
  const kind = ratingKind(skill)
  const c = skill.config
  const questions = kind === "questions" && c ? c.questions.filter((x) => x.trim()) : []
  const overall = kind === "questions" ? (c?.outcomeLabels ?? []).filter((l) => l.trim()) : selfEvalOptions(skill)
  return { skill, questions, overall, overallLabel: kind === "levels" ? "Your level" : kind === "questions" ? "Overall result" : "Your result", rule: c ? evaluationPreview(skill).rule : "" }
}

/** What is still unanswered, in form order, each entry focusing its control. */
export function selfEvalIssues(s: V2State, ids: string[], ratings: Record<string, string>, answers: SelfAnswers): Array<{ fieldId: string; message: string }> {
  const out: Array<{ fieldId: string; message: string }> = []
  for (const id of ids) {
    const skill = skillById(s, id)
    if (!skill) continue
    const sh = selfShape(skill)
    const a = answers[id] ?? []
    const missing = sh.questions.findIndex((_, i) => !a[i])
    if (missing >= 0) out.push({ fieldId: `self-${id}-q${missing}`, message: `Answer every question for ${skill.name}.` })
    if (sh.overall.length && !ratings[id]) out.push({ fieldId: `self-${id}-overall`, message: `Choose ${sh.overallLabel.toLowerCase()} for ${skill.name}.` })
  }
  return out
}

/** One line per skill for the confirmation: "2 of 3 Yes, Met". */
export function selfSummary(s: V2State, id: string, ratings: Record<string, string>, answers: SelfAnswers): string {
  const skill = skillById(s, id)
  if (!skill) return ""
  const sh = selfShape(skill)
  const a = answers[id] ?? []
  const parts = [sh.questions.length ? `${a.filter((x) => x === "yes").length} of ${sh.questions.length} Yes` : "", ratings[id] ?? ""].filter(Boolean)
  return parts.join(", ")
}

/**
 * One card per skill that asks for a self-evaluation: the skill name once, the evaluator's own questions each with Yes and No in
 * one row, then the overall result, level or outcome on the evaluator's scale, and the rule in one muted line. Single column at 375.
 */
export function SelfEvalCards({ s, ids, ratings, answers, onRating, onAnswer, showErrors = false }: { s: V2State; ids: string[]; ratings: Record<string, string>; answers: SelfAnswers; onRating: (id: string, v: string) => void; onAnswer: (id: string, index: number, v: "yes" | "no") => void; showErrors?: boolean }) {
  return (
    <div className="flex flex-col gap-4" data-self-eval>
      {ids.map((id) => {
        const skill = skillById(s, id)
        if (!skill) return null
        const sh = selfShape(skill)
        const a = answers[id] ?? []
        const head = `self-${id}-h`
        const incomplete = showErrors && (sh.questions.some((_, i) => !a[i]) || (sh.overall.length > 0 && !ratings[id]))
        return (
          <section key={id} className="flex flex-col gap-3 rounded-[var(--radius)] border border-border p-4" aria-labelledby={head} data-self-card={id}>
            <div className="flex flex-col gap-0.5">
              <h2 id={head} className={TYPE.section}>{skill.name}</h2>
              <p className="text-sm text-muted-foreground">What the evaluator checks; answer for yourself.</p>
            </div>
            {sh.questions.length ? (
              <ol className="flex flex-col divide-y divide-border">
                {sh.questions.map((q, i) => {
                  const qid = `self-${id}-q${i}-label`
                  return (
                    <li key={q} className="grid grid-cols-[1.5rem_minmax(0,1fr)] items-center gap-x-3 gap-y-2 py-2.5 sm:grid-cols-[1.5rem_minmax(0,1fr)_auto]">
                      <span className="text-xs tabular-nums text-muted-foreground" aria-hidden="true">{i + 1}</span>
                      <span id={qid} className="text-sm text-foreground" data-user-content>{q}</span>
                      <ToggleGroup id={`self-${id}-q${i}`} type="single" variant="outline" spacing={2} value={a[i] ?? ""} onValueChange={(v) => { if (v === "yes" || v === "no") onAnswer(id, i, v) }} aria-labelledby={qid} className="col-start-2 justify-start sm:col-start-3">
                        <ToggleGroupItem value="yes" className={cn("min-w-16", TOUCH_ROW)}>Yes</ToggleGroupItem>
                        <ToggleGroupItem value="no" className={cn("min-w-16", TOUCH_ROW)}>No</ToggleGroupItem>
                      </ToggleGroup>
                    </li>
                  )
                })}
              </ol>
            ) : null}
            {sh.overall.length ? (
              <div className={cn("grid grid-cols-1 items-center gap-2 sm:grid-cols-[minmax(0,1fr)_auto]", sh.questions.length ? "border-t border-border pt-3" : "")}>
                <span id={`self-${id}-overall-label`} className="text-sm font-medium text-foreground">{sh.overallLabel}</span>
                <ToggleGroup id={`self-${id}-overall`} type="single" variant="outline" spacing={2} value={ratings[id] ?? ""} onValueChange={(v) => { if (v) onRating(id, v) }} aria-labelledby={`self-${id}-overall-label`} className="flex-wrap justify-start">
                  {sh.overall.map((o) => <ToggleGroupItem key={o} value={o} className={cn("min-w-16", TOUCH_ROW)}>{o}</ToggleGroupItem>)}
                </ToggleGroup>
              </div>
            ) : null}
            {incomplete ? <FieldError>{sh.questions.length ? "Answer every question." : `Choose ${sh.overallLabel.toLowerCase()}.`}</FieldError> : null}
            {sh.rule ? <p className="text-sm text-muted-foreground" data-user-content>{sh.rule}</p> : null}
          </section>
        )
      })}
    </div>
  )
}

/**
 * "What the evaluator checks", one quiet line per chosen skill that does not ask for a self-evaluation; it opens to the questions or
 * scale and the rule sentence (Thursday S2 "reviewing the set of questions", folded into the step that picks the skills).
 */
export function EvaluatorChecks({ s, id }: { s: V2State; id: string }) {
  const [open, setOpen] = React.useState(false)
  const skill = skillById(s, id)
  if (!skill) return null
  const p = evaluationPreview(skill)
  return (
    <Collapsible open={open} onOpenChange={setOpen} data-evaluator-checks={id}>
      <CollapsibleTrigger asChild>
        {/* The disclosure names its skill, so two of them never read the same (review 2026-10-30 CP-5). */}
        <Button type="button" variant="ghost" size="sm" className="-ms-2 h-auto min-h-7 max-w-full justify-start text-start whitespace-normal text-muted-foreground" aria-expanded={open}>
          <i className={cn("fa-light text-xs", open ? "fa-chevron-down" : "fa-chevron-right")} aria-hidden="true" />
          {`What the evaluator checks for ${skill.name}`}
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="flex flex-col gap-1.5 ps-5 pb-1">
        <p className="text-sm text-muted-foreground">{`They answer: ${p.answer}`}</p>
        {p.items.length ? (
          <ol className="flex list-decimal flex-col gap-0.5 ps-5 text-sm text-foreground" data-user-content>
            {p.items.map((x) => <li key={x}>{x}</li>)}
          </ol>
        ) : null}
        {p.rule || p.notes.length ? <p className="text-sm text-muted-foreground" data-user-content>{[p.rule, ...p.notes].filter(Boolean).join(" ")}</p> : null}
      </CollapsibleContent>
    </Collapsible>
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
