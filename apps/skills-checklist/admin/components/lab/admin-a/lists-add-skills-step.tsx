"use client"

/**
 * New skill list, step 2 "Add skills" v3 (Romit 2026-11-15 rejected v1 and v2 as not intuitive; ledger D-L156, contract ADMIN-D6a amendment 2026-11-15e).
 * The library is the step: every active skill is listed on arrival with a box, and ticking is the one verb (Aarti and Sankalp, 11-06: "add 50 skills,
 * select all 50, name it, save"). Select all is the header box over the rows shown. Copy a list ticks another list's skills, with Undo. All and Selected
 * are two tabs, so the selection is counted once and reviewed in place. The search finds; with no exact name match it offers to add a new skill, which
 * comes in ticked with its category to set. Pasting several lines adds each. No drill-in, no method to choose first.
 */
import * as React from "react"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import { Checkbox } from "@exxatdesignux/ui/components/ui/checkbox"
import { Label } from "@exxatdesignux/ui/components/ui/label"
import { FieldError } from "@exxatdesignux/ui/components/ui/field"
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from "@exxatdesignux/ui/components/ui/input-group"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@exxatdesignux/ui/components/ui/dropdown-menu"
import { Tabs, TabsContent, TabsCountBadge, TabsList, TabsTrigger } from "@exxatdesignux/ui/components/ui/tabs"
import { railTriggerProps } from "@exxatdesignux/ui/components/ui/floating-sheet-panel"
import { cn } from "@exxatdesignux/ui/lib/utils"
import { CategoryPicker, useVocabOptions } from "@/components/lab/library/category-tag-pickers"
import { NO_CATEGORY, categoryEditable, categoryText, normName } from "@/lib/lab/library"
import { pickAll, pickState, type SkillList } from "@/lib/lab/lists"
import { aNoun, capitalize, countSkills, skillNoun, skillNounPlural } from "@/lib/lab/terms"
import type { Skill } from "@/lib/v2/types"
import { AppliedFilterChips, FiltersControl, fmt, type FilterField } from "./parts"
import { useSetSkillCategory } from "./lists-panel"
import { useRovingChecks } from "./lists-focus"

/** The search field's id: the step's first stop, and where a typed name's problem is said. */
export const ADD_SKILLS_SEARCH = "new-skill-name"
/** The header box's id: Save with nothing ticked sends focus here. */
export const ADD_SKILLS_ALL = "new-list-all"

/** Rows out of view skip layout from 640px; on a phone the category folds under the name, so the row height varies and is not held. */
const ROW = "flex min-h-11 shrink-0 flex-wrap items-center gap-x-3 gap-y-1 border-b border-border py-1.5 last:border-b-0 sm:[contain-intrinsic-size:auto_2.75rem] sm:[content-visibility:auto]"
/** The category column: beside the name from 640px, folded under it (past the box) on a phone. */
const CATEGORY_COL = "flex min-w-0 basis-full ps-7 sm:w-48 sm:basis-auto sm:shrink-0 sm:ps-0"

export interface AddSkillsStepProps {
  /** Every active skill in the library, A to Z. */
  skills: readonly Skill[]
  /** What is ticked, oldest first (the order things were added). */
  picked: ReadonlySet<string>
  onPickedChange: (next: Set<string>) => void
  /** Other lists to copy from, each with its size. */
  others: readonly SkillList[]
  /** The search text (the parent counts it as unsaved). */
  typed: string
  onTypedChange: (v: string) => void
  /** A typed name's problem (already on this list), said under the search. */
  typedError: string | null
  onTypedErrorChange: (v: string | null) => void
  /** Adds one typed name, or a pasted list, as the parent's find-or-add rules say (new skills join the library ticked). */
  onAddNames: (raw: string) => void
  /** Skills added here: their category can still be set here. */
  addedHere: ReadonlySet<string>
  /** "Select at least one skill." after Save with nothing ticked. */
  skillError: string | null
  onClearSkillError: () => void
  announce: string
  onAnnounce: (v: string) => void
}

export function AddSkillsStep({ skills, picked, onPickedChange, others, typed, onTypedChange, typedError, onTypedErrorChange, onAddNames, addedHere, skillError, onClearSkillError, announce, onAnnounce }: AddSkillsStepProps) {
  const vocab = useVocabOptions()
  const setCategoryOf = useSetSkillCategory()
  const roving = useRovingChecks()
  const [tab, setTab] = React.useState<"all" | "selected">("all")
  const [category, setCategory] = React.useState("")
  // Rows shown on the Selected tab when it opened: one unticked there stays in view, unticked, until the tab is left, so a slip can be ticked again.
  const [held, setHeld] = React.useState<string[]>([])
  // The last copy, for its one line and Undo; gone at the next change.
  const [copied, setCopied] = React.useState<{ text: string; before: ReadonlySet<string> } | null>(null)
  const byId = React.useMemo(() => new Map(skills.map((k) => [k.id, k])), [skills])
  const noun = skillNoun()
  const plural = skillNounPlural()
  const newestFirst = React.useMemo(() => [...picked].reverse().filter((id) => byId.has(id)), [picked, byId])
  const selectedCount = newestFirst.length

  const q = typed.trim().toLowerCase()
  const multiline = /\r?\n/.test(typed)
  const categories = React.useMemo(() => {
    const counts = new Map<string, number>()
    for (const k of skills) counts.set(categoryText(k), (counts.get(categoryText(k)) ?? 0) + 1)
    return [...counts].sort(([a], [b]) => a.localeCompare(b))
  }, [skills])
  const fields: FilterField[] = [{ id: "add-skills-category", label: "Category", value: category, allLabel: "All categories", options: categories.map(([c]) => ({ value: c, label: c })), onChange: setCategory }]
  const matches = (k: Skill) => (!category || categoryText(k) === category) && (!q || k.name.toLowerCase().includes(q) || categoryText(k).toLowerCase().includes(q))
  const base: Skill[] = tab === "all"
    ? [...skills]
    : [...newestFirst.filter((id) => !held.includes(id)), ...held].flatMap((id) => { const k = byId.get(id); return k ? [k] : [] })
  const shown = q && multiline ? base : base.filter(matches)
  const shownIds = shown.map((k) => k.id)
  const state = pickState(shownIds, picked)
  const filtering = !!q || !!category
  // The exact name, anywhere in the library: ticking it is the action, so no add row. None: the add row, under any partial matches.
  const exact = q && !multiline ? skills.find((k) => normName(k.name) === normName(typed)) : undefined
  const offerNew = !!q && !multiline && !exact

  const change = (next: Set<string>) => { setCopied(null); onClearSkillError(); onTypedErrorChange(null); onPickedChange(next) }
  const toggle = (id: string, on: boolean) => {
    const next = new Set(picked)
    if (on) next.add(id)
    else next.delete(id)
    change(next)
  }
  const toggleAll = () => {
    const on = !state.all
    const moved = on ? state.of - state.on : state.on
    // New ticks go on in A to Z order, the last one newest, so they read A to Z at the top of Selected.
    const ordered = on ? shownIds.filter((id) => !picked.has(id)).sort((a, b) => (byId.get(b)?.name ?? "").localeCompare(byId.get(a)?.name ?? "")) : shownIds
    change(pickAll(ordered, picked, on))
    onAnnounce(`${on ? "Selected" : "Cleared"} ${countSkills(moved)}.`)
  }
  const copyFrom = (l: SkillList) => {
    const ids = l.skillIds.filter((id) => byId.has(id))
    const fresh = ids.filter((id) => !picked.has(id))
    const before = picked
    onClearSkillError()
    onTypedErrorChange(null)
    onPickedChange(new Set([...picked, ...fresh]))
    const already = ids.length - fresh.length
    const text = `Copied ${fmt(fresh.length)} from ${l.name}.${already ? ` ${fmt(already)} ${already === 1 ? "was" : "were"} already selected.` : ""}`
    setCopied({ text, before })
    onAnnounce(text)
  }
  const undoCopy = () => {
    if (!copied) return
    onPickedChange(new Set(copied.before))
    onAnnounce("Copy undone.")
    setCopied(null)
    requestAnimationFrame(() => document.querySelector<HTMLElement>("[data-copy-from]")?.focus())
  }
  const switchTab = (v: string) => {
    const next = v === "selected" ? "selected" : "all"
    setHeld(next === "selected" ? newestFirst : [])
    setTab(next)
  }
  const onSearchKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape" && typed) { e.preventDefault(); e.stopPropagation(); onTypedChange(""); onTypedErrorChange(null); return }
    if (e.key !== "Enter" || e.nativeEvent.isComposing) return
    // Enter never reaches the panel's primary: it ticks the skill of that exact name, or adds a new one by that name.
    e.preventDefault()
    e.stopPropagation()
    if (!q) return
    if (exact && !picked.has(exact.id)) { toggle(exact.id, true); onAnnounce(`Selected ${exact.name}.`); return }
    onAddNames(typed)
  }
  const clearSearch = () => { onTypedChange(""); onTypedErrorChange(null); requestAnimationFrame(() => document.getElementById(ADD_SKILLS_SEARCH)?.focus()) }

  const copyMenu = others.length ? (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button type="button" variant="outline" size="sm" className="shrink-0" data-copy-from {...railTriggerProps()}>
          Copy a list
          <i className="fa-light fa-chevron-down text-xs" aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="z-[90] w-72" {...railTriggerProps()}>
        {others.map((l) => (
          <DropdownMenuItem key={l.id} onSelect={() => copyFrom(l)} data-copy-list={l.id}>
            <span className="min-w-0 flex-1 truncate">{l.name}</span>
            <span className="text-xs tabular-nums text-muted-foreground">{fmt(l.skillIds.length)}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  ) : null

  const allName = filtering ? `Select all ${fmt(state.of)} matching` : `Select all ${countSkills(state.of)}`
  const table = (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col" data-add-skills-table>
      <div className="flex min-h-10 shrink-0 items-center gap-3 border-b border-border px-3" data-add-skills-head>
        <Checkbox id={ADD_SKILLS_ALL} aria-label={allName} checked={state.all ? true : state.some ? "indeterminate" : false} disabled={state.of === 0} onCheckedChange={toggleAll} aria-invalid={!!skillError} aria-describedby={skillError ? "new-list-skills-error" : undefined} data-pick-all />
        <span className={cn("min-w-0 flex-1 text-xs font-medium text-muted-foreground")} aria-hidden="true">{capitalize(noun)}</span>
        <span className="hidden w-48 shrink-0 text-xs font-medium text-muted-foreground sm:block" aria-hidden="true">Category</span>
      </div>
      <ul className="flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto overscroll-y-contain px-3" aria-label={tab === "all" ? `${capitalize(plural)} in the library` : `Selected ${plural}`} data-skill-rows={shown.length} {...roving}>
        {shown.map((k) => {
          const id = `add-skill-${k.id}`
          const settable = addedHere.has(k.id) || categoryEditable(k)
          return (
            <li key={k.id} className={ROW} data-add-skill-row={k.id}>
              <Checkbox id={id} checked={picked.has(k.id)} onCheckedChange={(v) => toggle(k.id, v === true)} />
              <Label htmlFor={id} className="min-h-8 min-w-0 flex-1 font-normal text-foreground" title={k.name}>
                <span className="truncate">{k.name}</span>
              </Label>
              {settable ? (
                <span className={CATEGORY_COL} data-row-category>
                  <span id={`category-label-${k.id}`} className="sr-only">{`Category for ${k.name}`}</span>
                  <CategoryPicker id={`category-${k.id}`} labelId={`category-label-${k.id}`} value={k.category === NO_CATEGORY ? "" : k.category ?? ""} options={vocab.categories} inactive={vocab.inactiveCategories} onChange={(c) => setCategoryOf(k.id, c)} size="sm" appearance="field" className="w-full sm:max-w-48" placeholder="Select category" emptyLabel="No category" />
                </span>
              ) : (
                <span className={cn(CATEGORY_COL, "truncate text-sm text-muted-foreground")} title={categoryText(k)}>{categoryText(k)}</span>
              )}
            </li>
          )
        })}
        {offerNew ? (
          <li className="flex min-h-11 shrink-0 flex-wrap items-center gap-x-3 gap-y-2 py-2" data-add-new>
            {shown.length ? null : <span className="text-sm text-muted-foreground" data-no-match>{`No ${noun} named “${typed.trim()}”.`}</span>}
            <Button type="button" variant="outline" size="sm" className="h-auto min-h-8 max-w-full whitespace-normal text-start" onClick={() => onAddNames(typed)} data-add-typed>
              {`Add “${typed.trim()}” as a new ${noun}`}
            </Button>
          </li>
        ) : null}
        {!shown.length && !offerNew ? (
          <li className="flex min-h-11 shrink-0 flex-wrap items-center gap-2 py-2 text-sm text-muted-foreground" data-no-match>
            {skills.length === 0 && !filtering
              ? `No ${plural} yet. Type a name to add one.`
              : tab === "selected" && !filtering ? `No ${plural} selected yet.` : `No ${plural} match.`}
            {filtering ? <Button type="button" variant="ghost" size="sm" onClick={() => { clearSearch(); setCategory("") }}>Clear</Button> : null}
          </li>
        ) : null}
      </ul>
    </div>
  )

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-2" data-add-skills-step>
      {/* Toolbar, tabs and the column heads stay in view: only the rows scroll, in their own box. */}
      <div className="flex min-w-0 shrink-0 flex-col gap-2 pt-1" data-add-skills-toolbar>
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <InputGroup className="min-w-0 basis-full sm:basis-auto sm:flex-1">
            <InputGroupAddon><i className="fa-light fa-magnifying-glass text-xs" aria-hidden="true" /></InputGroupAddon>
            <InputGroupInput
              id={ADD_SKILLS_SEARCH}
              type="text"
              value={typed}
              onChange={(e) => { onTypedChange(e.target.value); onTypedErrorChange(null); setCopied(null) }}
              onKeyDown={onSearchKey}
              onPaste={(e) => { const text = e.clipboardData.getData("text"); if (/\r?\n/.test(text.trim())) { e.preventDefault(); onAddNames(text) } }}
              placeholder={`Search or add ${aNoun()}`}
              aria-label={`Search or add ${aNoun()}`}
              aria-invalid={!!typedError}
              aria-describedby={typedError ? "new-skill-error" : undefined}
              autoComplete="off"
              enterKeyHint="enter"
              data-new-skill-field
              data-esc-clears
            />
            {typed ? (
              <InputGroupAddon align="inline-end">
                <InputGroupButton variant="ghost" size="icon-xs" aria-label="Clear search" onClick={clearSearch} data-clear-search><i className="fa-light fa-xmark" aria-hidden="true" /></InputGroupButton>
              </InputGroupAddon>
            ) : null}
          </InputGroup>
          <FiltersControl fields={fields} align="end" layer="z-[92]" />
          {copyMenu}
        </div>
        {typedError ? <FieldError id="new-skill-error" data-typed-error>{typedError}</FieldError> : null}
        <AppliedFilterChips fields={fields} />
        {copied ? (
          <p className="flex min-h-8 flex-wrap items-center gap-x-2 text-sm text-foreground" data-copied>
            <span>{copied.text}</span>
            <Button type="button" variant="ghost" size="sm" onClick={undoCopy} data-copy-undo>Undo</Button>
          </p>
        ) : null}
      </div>
      <p role="status" className="sr-only">{announce}</p>
      <Tabs value={tab} onValueChange={switchTab} className="flex min-h-0 min-w-0 flex-1 flex-col gap-2">
        <TabsList aria-label={capitalize(plural)} className="self-start">
          <TabsTrigger value="all" data-tab-all>All<TabsCountBadge count={skills.length} /></TabsTrigger>
          <TabsTrigger value="selected" data-tab-selected data-picked-count={selectedCount}>Selected<TabsCountBadge count={selectedCount} /></TabsTrigger>
        </TabsList>
        {skillError ? <FieldError id="new-list-skills-error" data-skill-error>{skillError}</FieldError> : null}
        <TabsContent value="all" className="min-h-0 min-w-0 flex-1 flex-col rounded-[var(--radius)] border border-border data-[state=active]:flex">{tab === "all" ? table : null}</TabsContent>
        <TabsContent value="selected" className="min-h-0 min-w-0 flex-1 flex-col rounded-[var(--radius)] border border-border data-[state=active]:flex">{tab === "selected" ? table : null}</TabsContent>
      </Tabs>
    </div>
  )
}
