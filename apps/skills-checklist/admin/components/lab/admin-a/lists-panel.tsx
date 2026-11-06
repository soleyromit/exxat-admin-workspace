"use client"

/**
 * The one panel of Skill lists (designer 2026-11-05, D-L106): the same FloatingSheetPanel and close behaviour as the Library's. No tabs. It shows a list's size, who it is assigned to and
 * whether new student groups get it; everything on it acts at once. "Edit skills" (nobody on the list) or "View skills" (somebody on it) widens the same panel to the skills.
 * A list on anyone is not edited in place: read only, with one line and one action, New version [Aarti, 205da2dd ch 9]. No state words.
 * Picker: the choices stay in the panel until Save list; every way out with changes asks first (map E rule 6). A list that was never saved leaves nothing behind.
 * The skills are a level inside the panel: Cancel, X and Esc all step back one level to the list (E rule 6). The footer shows only with something to save (E rules 3 and 4).
 * Every active skill can sit on a list; "Not configured" is marked, and it joins courses once configured (REQ IM-09, D-L85). An inactive skill already on the list stays in view and is marked, and it
 * is not offered for adding (REQ SL-11).
 */
import * as React from "react"
import { usePresent } from "@/components/lab/lab-bar/present"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import { Checkbox as CheckboxDs } from "@exxatdesignux/ui/components/ui/checkbox"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@exxatdesignux/ui/components/ui/collapsible"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@exxatdesignux/ui/components/ui/command"
import { DropdownMenu, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@exxatdesignux/ui/components/ui/dropdown-menu"
import { FloatingSheetPanelBody, FloatingSheetPanelContent, FloatingSheetPanelFooter, FloatingSheetPanelHeader, FloatingSheetPanelToolbar, railTriggerProps } from "@exxatdesignux/ui/components/ui/floating-sheet-panel"
import { FloatingSheetPanel } from "@/components/lab/shared/sheet"
import { Input } from "@exxatdesignux/ui/components/ui/input"
import { Label } from "@exxatdesignux/ui/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@exxatdesignux/ui/components/ui/popover"
import { Separator } from "@exxatdesignux/ui/components/ui/separator"
import { StatusBadge } from "@exxatdesignux/ui/components/ui/status-badge"
import { Tip } from "@exxatdesignux/ui/components/ui/tip"
import { ToggleSwitch } from "@exxatdesignux/ui/components/ui/toggle-switch"
import { TYPE } from "@/components/lab/type-scale"
import { SectionTitle, SetupPrompt } from "@/components/lab/first-run"
import { PanelResultSlot } from "@/components/lab/shared/result-banner"
import { DiscardChangesDialog, useLeaveGuard } from "@/components/lab/shared/unsaved-guard"
import { ALL_STUDENTS_GROUP, listCanEdit, setListSkills, skillLists, type SkillList } from "@/lib/lab/lists"
import { CONFIGURATION_META } from "@/lib/lab/library"
import { isConfigured } from "@/lib/v2/population"
import { countSkills, capitalize, skillNounPlural } from "@/lib/lab/terms"
import type { Skill } from "@/lib/v2/types"
import { AppliedFilterChips, FiltersControl, LINK, fmt, plural, useTextCut, type FilterField } from "./parts"
import { LaterBadge } from "@/components/lab/import/sample-badge"
import { LabLink as Link } from "@/components/lab/lab-bar/lab-link"
import { useLabHref } from "@/components/lab/lab-bar/page-context"
import { listSizeText, type ListsModel } from "./lists-parts"
import { ListRowMenu } from "./lists-groups-table"
import { focusAfterQuestion, focusPanel, LIST_PANEL, listLink, stepOffPanelClose, useRovingChecks, type FocusBack } from "./lists-focus"

export type PanelView = "list" | "skills"

const isOff = (k: Skill) => k.active === false
const NOT_CONFIGURED = CONFIGURATION_META["not-configured"]
const categoryOf = (k: Skill) => k.category || "No category"
/** Long lists stay quick: rows out of view skip their layout and paint, at the height they will take. */
const ROW = "flex min-h-11 border-b border-border py-2 last:border-b-0 [contain-intrinsic-size:auto_2.75rem] [content-visibility:auto]"

function SkillMeta({ skill }: { skill: Skill }) {
  return (
    <>
      <span className="text-sm text-muted-foreground">{categoryOf(skill)}</span>
      {isConfigured(skill) ? null : <StatusBadge label={NOT_CONFIGURED.label} tone={NOT_CONFIGURED.tone} icon={NOT_CONFIGURED.icon} size="sm" />}
      {isOff(skill) ? <StatusBadge label="Inactive" tone="neutral" icon="fa-circle-minus" size="sm" /> : null}
    </>
  )
}

/** Above seven options: Popover plus Command (map E rule 16). */
function CategoryFilter({ categories, value, onChange }: { categories: ReadonlyArray<{ name: string; count: number }>; value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = React.useState(false)
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button type="button" variant="outline" size="default" role="combobox" aria-expanded={open} aria-label={`Category: ${value || "All categories"}`} className="w-full justify-between font-normal" data-category-filter>
          <span className="truncate">{value || "All categories"}</span>
          <i className="fa-light fa-chevron-down text-xs" aria-hidden="true" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="z-[90] w-72 p-0" {...railTriggerProps()}>
        <Command>
          <CommandInput placeholder="Find a category" aria-label="Find a category" />
          <CommandList className="max-h-72">
            <CommandEmpty>No category matches.</CommandEmpty>
            <CommandGroup>
              <CommandItem value="__all" onSelect={() => { onChange(""); setOpen(false) }} aria-selected={!value}>All categories</CommandItem>
              {categories.map((c) => (
                <CommandItem key={c.name} value={c.name} onSelect={() => { onChange(c.name); setOpen(false) }} aria-selected={value === c.name}>
                  <span className="min-w-0 flex-1 truncate">{c.name}</span>
                  <span className="text-xs tabular-nums text-muted-foreground">{fmt(c.count)}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

/** Search and category, kept in view while the rows scroll under them. */
function useSkillFilter(skills: readonly Skill[], library?: boolean) {
  const [query, setQuery] = React.useState("")
  const [category, setCategory] = React.useState("")
  const deferred = React.useDeferredValue(query)
  const q = deferred.trim().toLowerCase()
  const categories = React.useMemo(() => {
    const counts = new Map<string, number>()
    for (const k of skills) counts.set(categoryOf(k), (counts.get(categoryOf(k)) ?? 0) + 1)
    return [...counts].map(([name, count]) => ({ name, count })).sort((a, b) => a.name.localeCompare(b.name))
  }, [skills])
  const matches = skills.filter((k) => (!category || categoryOf(k) === category) && (!q || k.name.toLowerCase().includes(q) || categoryOf(k).toLowerCase().includes(q)))
  const fields: FilterField[] = [{ id: "pick-category", label: "Category", value: category, allLabel: "All categories", options: categories.map((c) => ({ value: c.name, label: c.name })), onChange: setCategory }]
  const controls = (
    <div className={library ? "flex items-center gap-2" : "grid gap-2 sm:grid-cols-[minmax(0,1fr)_14rem]"}>
      <Input type="search" value={query} onChange={(e) => setQuery(e.target.value)} className="w-full" aria-label={library ? "Search the library" : `Search ${skillNounPlural()}`} placeholder={library ? "Search the library" : `Search ${skillNounPlural()}`} />
      {library ? <FiltersControl fields={fields} align="end" layer="z-[92]" /> : <CategoryFilter categories={categories} value={category} onChange={setCategory} />}
    </div>
  )
  const noMatch = (
    <li className="flex flex-wrap items-center gap-2 py-3 text-sm text-muted-foreground">
      {`No ${skillNounPlural()} match.`}
      <Button type="button" variant="ghost" size="sm" onClick={() => { setQuery(""); setCategory("") }}>Clear</Button>
    </li>
  )
  return { matches, controls, noMatch, fields, filtering: !!query.trim() || !!category }
}

/** What a program with an empty library sees in the picker: nothing to filter, and where skills come from. */
function NoSkillsYet() {
  const to = useLabHref()
  return (
    <p className="text-sm text-muted-foreground" data-no-skills>
      {`There are no ${skillNounPlural()} yet. Add them in the `}
      <Link className={LINK} href={to("admin/skills-library")}>Library</Link>
      .
    </p>
  )
}

/** One quiet menu that fills the selection from another list. */
function CopyFromList({ others, onCopy }: { others: readonly SkillList[]; onCopy: (list: SkillList) => void }) {
  if (!others.length) return null
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button type="button" variant="ghost" size="sm" data-copy-from {...railTriggerProps()}>Copy from another list</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="z-[90] w-72" {...railTriggerProps()}>
        {others.map((l) => (
          <DropdownMenuItem key={l.id} onSelect={() => onCopy(l)}>
            <span className="min-w-0 flex-1 truncate">{l.name}</span>
            <span className="text-xs tabular-nums text-muted-foreground">{fmt(l.skillIds.length)}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function SkillPicker({ skills, savedIds, selected, others, onChange, idPrefix, library, bulkHref }: { /** Add from library, in New skill list: search and Filters, then the other ways to add under one menu. */ library?: boolean; bulkHref?: string; skills: Skill[]; savedIds: ReadonlySet<string>; selected: ReadonlySet<string>; /** Other lists to copy from: one quiet menu that fills the selection. */ others: readonly SkillList[]; onChange: (next: Set<string>) => void; idPrefix: string }) {
  const { matches, controls, noMatch, fields, filtering } = useSkillFilter(skills, library)
  // Order from what is saved, not what is selected, so a row does not jump from under the pointer. Inactive ones first: they want a decision.
  const shown = [...matches.filter((k) => isOff(k)), ...matches.filter((k) => !isOff(k) && savedIds.has(k.id)), ...matches.filter((k) => !isOff(k) && !savedIds.has(k.id))]
  const allOn = shown.length > 0 && shown.every((k) => selected.has(k.id))
  const inactive = skills.filter((k) => isOff(k) && selected.has(k.id)).length
  const setMany = (ids: string[], on: boolean) => {
    const next = new Set(selected)
    for (const id of ids) { if (on) next.add(id); else next.delete(id) }
    onChange(next)
  }
  const offered = new Set(skills.map((k) => k.id))
  const roving = useRovingChecks()
  return (
    <div className="flex min-w-0 flex-col" data-skill-picker>
      {/* The filters and the count stay at the top of the panel while the rows scroll under them. */}
      <div className="sticky top-0 z-10 flex flex-col gap-2 bg-background pb-3 pt-1">
        {controls}
        {library ? <AppliedFilterChips fields={fields} /> : null}
        {library ? (
          <div className="flex min-h-8 flex-wrap items-center justify-between gap-2">
            <span className="flex flex-wrap items-center gap-2">
              <span className="text-sm tabular-nums text-muted-foreground" role="status" aria-live="polite" data-picked-count={selected.size}>{`${fmt(selected.size)} selected`}</span>
              {filtering && shown.length ? <Button type="button" variant="ghost" size="sm" onClick={() => setMany(shown.map((k) => k.id), !allOn)} data-pick-all>{allOn ? "Clear all shown" : `Select all ${fmt(shown.length)} shown`}</Button> : null}
            </span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button type="button" variant="outline" size="sm" data-add-skills {...railTriggerProps()}>
                  More ways to add
                  <i className="fa-light fa-chevron-down text-xs" aria-hidden="true" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="z-[90] w-64" {...railTriggerProps()}>
                {others.length ? (
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger>Copy from another list</DropdownMenuSubTrigger>
                    <DropdownMenuSubContent className="z-[91] w-72" {...railTriggerProps()}>
                      {others.map((l) => (
                        <DropdownMenuItem key={l.id} onSelect={() => onChange(new Set(l.skillIds.filter((id) => offered.has(id))))}>
                          <span className="min-w-0 flex-1 truncate">{l.name}</span>
                          <span className="text-xs tabular-nums text-muted-foreground">{fmt(l.skillIds.length)}</span>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuSubContent>
                  </DropdownMenuSub>
                ) : null}
                {bulkHref ? (
                  <DropdownMenuItem asChild>
                    <Link href={bulkHref} className="flex items-center justify-between gap-2">Bulk upload<LaterBadge /></Link>
                  </DropdownMenuItem>
                ) : null}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-muted-foreground tabular-nums" role="status" aria-live="polite" data-picked-count={selected.size}>{`${fmt(selected.size)} selected${inactive ? `, ${inactive} inactive` : ""}`}</p>
            <span className="flex flex-wrap items-center gap-1">
              <CopyFromList others={others} onCopy={(l) => onChange(new Set(l.skillIds.filter((id) => offered.has(id))))} />
              {shown.length ? (
                <Button type="button" variant="ghost" size="sm" onClick={() => setMany(shown.map((k) => k.id), !allOn)} data-pick-all>{allOn ? "Clear all shown" : "Select all shown"}</Button>
              ) : null}
            </span>
          </div>
        )}
      </div>
      <ul className="flex flex-col rounded-[var(--radius)] border border-border px-3" aria-label={`${skillNounPlural()} on this list`} data-skill-rows={shown.length} {...roving}>
        {shown.map((k) => {
          const id = `${idPrefix}-${k.id}`
          return (
            <li key={k.id} className={`${ROW} items-center gap-3`}>
              <CheckboxDs id={id} checked={selected.has(k.id)} onCheckedChange={(v) => setMany([k.id], v === true)} />
              <Label htmlFor={id} className="flex min-w-0 flex-1 flex-wrap items-baseline gap-x-3 font-normal">
                <span className="font-medium text-foreground">{k.name}</span>
                <SkillMeta skill={k} />
              </Label>
            </li>
          )
        })}
        {!shown.length ? noMatch : null}
      </ul>
    </div>
  )
}

/** An assigned list's skills, read only, with the same search and category filter. */
function SkillRows({ skills }: { skills: Skill[] }) {
  const { matches, controls, noMatch } = useSkillFilter(skills)
  const ordered = [...matches.filter(isOff), ...matches.filter((k) => !isOff(k))]
  return (
    <div className="flex min-w-0 flex-col">
      <div className="sticky top-0 z-10 bg-background pb-3 pt-1">{controls}</div>
      <ul className="flex flex-col rounded-[var(--radius)] border border-border px-3" aria-label={`${skillNounPlural()} on this list`} data-skill-rows={ordered.length}>
        {ordered.map((k) => (
          <li key={k.id} className={`${ROW} flex-wrap items-baseline gap-x-3`}>
            <span className="font-medium text-foreground">{k.name}</span>
            <SkillMeta skill={k} />
          </li>
        ))}
        {!ordered.length ? noMatch : null}
      </ul>
    </div>
  )
}

export type RemoveWho = { kind: "group"; id: string; label: string } | { kind: "student"; id: string; label: string }

interface AssignedRow extends Record<string, unknown> { key: string; who: RemoveWho; meta: string }

const assignedRows = (model: ListsModel, list: SkillList): AssignedRow[] => [
  ...list.groupIds.flatMap((id) => {
    const g = model.groups.find((x) => x.id === id)
    return g ? [{ key: `g:${id}`, who: { kind: "group" as const, id, label: g.label }, meta: plural(g.studentIds.length, "student", "students") }] : []
  }),
  ...(list.studentIds ?? []).flatMap((id) => {
    const p = model.state.people.find((x) => x.id === id)
    return p ? [{ key: `s:${id}`, who: { kind: "student" as const, id, label: p.name }, meta: p.cohort ?? "" }] : []
  }),
]

/** More named students than this collapse to one row (designer 2026-11-05): groups stay listed, and a filter's 42 names do not push them away. */
const NAMED_ROWS_MOST = 5

function AssignedRowLine({ row, listName, onRemove }: { row: AssignedRow; listName: string; onRemove: () => void }) {
  const { ref, cut } = useTextCut<HTMLSpanElement>(row.who.label)
  return (
    <li className="flex min-h-11 items-center gap-3 border-b border-border last:border-b-0" data-assigned-row={row.who.kind}>
      <i className={`fa-light ${row.who.kind === "student" ? "fa-user" : "fa-users"} w-4 shrink-0 text-center text-sm text-muted-foreground`} aria-hidden="true" />
      <Tip label={row.who.label} disabled={!cut} triggerClassName="min-w-0 flex-1" contentZIndex={80}>
        <span ref={ref} tabIndex={cut ? 0 : undefined} className="block min-w-0 truncate rounded-sm text-sm font-medium outline-none focus-visible:ring-2 focus-visible:ring-ring">{row.who.label}</span>
      </Tip>
      <span className="shrink-0 text-sm tabular-nums text-muted-foreground">{row.meta}</span>
      <Button type="button" variant="ghost" size="icon-sm" aria-label={`Remove ${row.who.label} from ${listName}`} onClick={onRemove} data-assigned-remove>
        <i className="fa-light fa-xmark" aria-hidden="true" />
      </Button>
    </li>
  )
}

/** "42 students": one row that opens to the names, each with its x. */
function NamedStudents({ rows, listName, renderRow }: { rows: AssignedRow[]; listName: string; renderRow: (r: AssignedRow) => React.ReactNode }) {
  const [open, setOpen] = React.useState(false)
  return (
    <li className="border-b border-border last:border-b-0" data-assigned-named={rows.length}>
      <Collapsible open={open} onOpenChange={setOpen}>
        <CollapsibleTrigger asChild>
          <Button type="button" variant="ghost" size="sm" className="min-h-11 w-full justify-between px-0 text-sm font-medium hover:bg-transparent" aria-label={`${plural(rows.length, "student", "students")} added by name to ${listName}`} data-assigned-named-toggle>
            {plural(rows.length, "student", "students")}
            <i className={`fa-light ${open ? "fa-chevron-up" : "fa-chevron-down"} me-2 text-xs`} aria-hidden="true" />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <ul className="flex flex-col border-t border-border ps-3" aria-label={`Students added by name to ${listName}`}>
            {rows.map(renderRow)}
          </ul>
        </CollapsibleContent>
      </Collapsible>
    </li>
  )
}

/** The list itself: its size, who it is assigned to, and whether new groups get it. */
function ListBody({ model, list, onSkills, onChangeSkills, onAddStudents, onRemove, onDefault }: { onChangeSkills: () => void;  model: ListsModel; list: SkillList; onSkills: () => void; onAddStudents: () => void; onRemove: (who: RemoveWho) => void; onDefault: (id: string) => void }) {
  const to = useLabHref()
  const rows = assignedRows(model, list)
  const empty = list.skillIds.length === 0
  const other = skillLists(model.lists).find((l) => l.isDefault && l.id !== list.id)
  const listRef = React.useRef<HTMLUListElement>(null)
  // A row's x has gone with the row: focus takes the row now in its place, else Add students.
  const remove = (i: number, who: RemoveWho) => {
    onRemove(who)
    requestAnimationFrame(() => {
      if (document.querySelector("[role=alertdialog]")) return
      const buttons = listRef.current?.querySelectorAll<HTMLElement>("[data-assigned-remove], [data-assigned-named-toggle]")
      ;(buttons?.[Math.min(i, buttons.length - 1)] ?? document.querySelector<HTMLElement>("[data-add-students]"))?.focus({ preventScroll: true })
    })
  }
  const forAll = list.groupIds.includes(ALL_STUDENTS_GROUP)
  const onList = new Set(list.skillIds)
  const preview = model.state.skills.filter((k) => onList.has(k.id)).sort((x, y) => x.name.localeCompare(y.name)).slice(0, 3)
  const groupRows = rows.filter((r) => r.who.kind === "group")
  const namedRows = rows.filter((r) => r.who.kind === "student")
  const collapse = namedRows.length > NAMED_ROWS_MOST
  const line = (r: AssignedRow) => <AssignedRowLine key={r.key} row={r} listName={list.name} onRemove={() => remove(rows.indexOf(r), r.who)} />
  const noteId = `default-note-${list.id}`
  const note = empty ? `Add ${skillNounPlural()} first.` : list.isDefault ? "To change it, turn this on for another list." : other ? `New groups get ${other.name} now.` : ""
  return (
    <FloatingSheetPanelBody className="flex flex-col gap-5 px-4 pb-4" data-list-panel>
      <section aria-labelledby={`assigned-${list.id}`} className="flex flex-col gap-2" data-assigned-to>
        <div className="flex min-h-8 flex-wrap items-center justify-between gap-2">
          <SectionTitle icon="fa-user-group" id={`assigned-${list.id}`} className={TYPE.group}>Assigned to</SectionTitle>
          {rows.length && !forAll ? <Button type="button" variant="outline" size="sm" onClick={onAddStudents} data-add-students>Assign to students</Button> : null}
        </div>
        {rows.length ? (
          <ul ref={listRef} className="flex max-h-[22rem] flex-col overflow-y-auto rounded-[var(--radius)] border border-border ps-3 pe-1" aria-label={`Assigned to ${list.name}`} data-assigned-rows={rows.length}>
            {collapse ? (
              <>
                {groupRows.map(line)}
                <NamedStudents key={list.id} rows={namedRows} listName={list.name} renderRow={line} />
              </>
            ) : rows.map(line)}
          </ul>
        ) : (
          <SetupPrompt
            scene="lists"
            text={
              <>
                <p data-not-assigned>Not assigned yet.</p>
                {empty ? <p id={`no-skills-${list.id}`}>{`Add ${skillNounPlural()} first.`}</p> : null}
              </>
            }
            action={empty ? (
              <Button type="button" variant="outline" size="sm" disabled aria-describedby={`no-skills-${list.id}`} data-add-students>Assign to students</Button>
            ) : (
              <Button type="button" variant="default" size="sm" onClick={onAddStudents} data-add-students><i className="fa-light fa-user-plus text-xs" aria-hidden="true" />Assign to students</Button>
            )}
          />
        )}
      </section>
      <Separator />
      {/* Same anatomy as Assigned to: a title, its one action, a bordered list. */}
      <section aria-labelledby={`skills-${list.id}`} className="flex flex-col gap-2" data-list-skills-section>
        <div className="flex min-h-8 flex-wrap items-center justify-between gap-2">
          <SectionTitle icon="fa-list-check" id={`skills-${list.id}`} className={TYPE.group}>{capitalize(skillNounPlural())}</SectionTitle>
          {listCanEdit(list) ? (
            <Button type="button" variant={empty ? "default" : "outline"} size="sm" onClick={onSkills} data-list-skills="edit">{`Edit ${skillNounPlural()}`}</Button>
          ) : (
            <Button type="button" variant="outline" size="sm" onClick={onChangeSkills} data-change-skills>{`Change ${skillNounPlural()}`}</Button>
          )}
        </div>
        {preview.length ? (
          <ul className="flex flex-col rounded-[var(--radius)] border border-border px-3" aria-label={`First ${skillNounPlural()} on ${list.name}`}>
            {preview.map((k) => (
              <li key={k.id} className="flex min-h-11 items-center justify-between gap-3 border-b border-border py-1.5 text-sm last:border-b-0">
                <span className="flex min-w-0 items-center gap-3">
                  <i className="fa-light fa-circle-check w-4 shrink-0 text-center text-muted-foreground" aria-hidden="true" />
                  <span className="min-w-0 truncate" title={k.name}>{k.name}</span>
                </span>
                <span className="shrink-0 text-muted-foreground">{k.category?.trim() || ""}</span>
              </li>
            ))}
            {list.skillIds.length > preview.length ? (
              <li className="flex min-h-11 items-center">
                <Button type="button" variant="link" size="sm" className="h-auto p-0 text-sm" onClick={onSkills} data-list-skills={listCanEdit(list) ? undefined : "view"}>{`View all ${countSkills(list.skillIds.length)}`}</Button>
              </li>
            ) : null}
          </ul>
        ) : <SetupPrompt scene="newList" text={`No ${skillNounPlural()} yet.`} />}
      </section>
      {rows.length ? (
        <>
          <Separator />
          <section aria-labelledby={`courses-${list.id}`} className="flex flex-col gap-2" data-list-courses>
            <div className="flex min-h-8 items-center"><SectionTitle icon="fa-sitemap" id={`courses-${list.id}`} className={TYPE.group}>Courses</SectionTitle></div>
            <SetupPrompt scene="courses" text={`Show which courses expect these ${skillNounPlural()}.`} action={<Button asChild variant="outline" size="sm"><Link href={to("admin/course-mapping", { by: "skill" })}>Map to courses</Link></Button>} />
          </section>
        </>
      ) : null}
      {forAll ? null : (
        <>
      <Separator />
      <div className="flex flex-col gap-1" data-default-row>
        <div className="flex items-center justify-between gap-3">
          <span id={`default-label-${list.id}`} className="text-sm">New student groups get this list</span>
          {/* Off on the default is not offered: another list takes it, so there is always one [INFER]. A list with no skills has nothing to give a new group. */}
          <ToggleSwitch checked={list.isDefault} disabled={empty || list.isDefault} onChange={(on) => { if (on) onDefault(list.id) }} aria-labelledby={`default-label-${list.id}${note ? ` ${noteId}` : ""}`} />
        </div>
        {note ? <p id={noteId} className="text-sm text-muted-foreground" data-default-note>{note}</p> : null}
      </div>
        </>
      )}
    </FloatingSheetPanelBody>
  )
}

const sameSet = (a: ReadonlySet<string>, b: ReadonlySet<string>) => a.size === b.size && [...a].every((x) => b.has(x))

const NAV_TOGGLE = '[aria-label="Collapse to icons"], [aria-label="Show labels"]'
const onRowBody = (t: Element | null) => !!t?.closest?.("[data-region=lists] tbody tr") && !t?.closest?.("a, button, input, [role=checkbox], [role=menuitem]")

export function ListPanel({ level, levelLeave, model, list, isFresh, view, onView, dirtyRef, back, onClose, onSaved, onAddStudents, onRemove, onDefault, onNewVersion, onRename, onDelete }: {
  model: ListsModel
  list: SkillList | null
  /** Asked for in the New skill list dialog and not yet on the program. */
  isFresh: boolean
  view: PanelView
  onView: (v: PanelView) => void
  /** Lets a row click know to ask. */
  dirtyRef: React.MutableRefObject<boolean>
  back: FocusBack
  onClose: () => void
  onSaved: (list: SkillList, size: number) => void
  onAddStudents: () => void
  onRemove: (who: RemoveWho) => void
  onDefault: (id: string) => void
  onNewVersion: (id: string) => void
  onRename: (id: string) => void
  onDelete: (list: SkillList) => void
  /** A deeper level in this same panel: it replaces the content and owns how to leave. */
  level?: React.ReactNode
  levelLeave?: React.MutableRefObject<(() => void) | null>
}) {
  const { present } = usePresent()
  const editable = !!list && listCanEdit(list)
  const picking = !!list && view === "skills" && editable
  const reading = !!list && view === "skills" && !editable
  const saved = React.useMemo(() => new Set(list?.skillIds ?? []), [list?.skillIds])
  // What the picker can hold: every active skill, and the inactive ones the list already has.
  const rows = React.useMemo(() => model.state.skills.filter((k) => !isOff(k) || saved.has(k.id)).sort((a, b) => a.name.localeCompare(b.name)), [model.state, saved])
  const [edits, setEdits] = React.useState<{ listId: string; ids: Set<string> } | null>(null)
  const [asking, setAsking] = React.useState<null | "close" | "back">(null)
  const listId = list?.id ?? null
  // Moving to another list drops what the last one held: coming back must not bring discarded choices with it.
  React.useEffect(() => setEdits(null), [listId, view])
  const picked = edits && edits.listId === listId ? edits.ids : saved
  const dirty = picking && !sameSet(picked, saved)
  dirtyRef.current = dirty
  const leave = useLeaveGuard(dirty)
  const closeNow = () => {
    setAsking(null)
    setEdits(null)
    onClose()
  }
  const backNow = () => {
    setAsking(null)
    setEdits(null)
    onView("list")
    // The button that opened this level, once any question on top has gone.
    focusAfterQuestion(() => document.querySelector<HTMLElement>(`${LIST_PANEL} button[data-list-skills]`))
  }
  const requestClose = () => (dirty ? setAsking("close") : closeNow())
  /** Cancel, X, Esc and the toolbar's back from the skills: to the list, or out when the list was never saved. */
  const requestBack = () => {
    if (dirty) return setAsking(isFresh ? "close" : "back")
    if (isFresh) closeNow()
    else backNow()
  }
  const changing = isFresh && !!list?.versionOf
  const origin = changing ? model.lists.find((l) => l.id === list?.versionOf) : undefined
  const unsaved = changing ? `${origin?.name ?? "The list"} stays as it is.` : `The ${skillNounPlural()} you selected have not been saved.`
  const save = () => {
    if (!list) return
    const ids = rows.filter((k) => picked.has(k.id)).map((k) => k.id)
    model.applyNow((ls) => setListSkills(isFresh ? [...ls, list] : ls, list.id, ids))
    setEdits(null)
    onSaved(list, ids.length)
    // Save has gone with the picker: focus stays in the panel.
    requestAnimationFrame(focusPanel)
  }
  const open = !!list
  /** X and Esc: one level at a time. */
  const requestStep = () => (view === "skills" ? requestBack() : requestClose())
  // A press outside the panel leaves it, at either level. Radix says so just before it asks to close.
  const pressedOutside = React.useRef(false)
  // The press that opened the panel, still landing from a double click.
  const openedAt = React.useRef(0)
  React.useLayoutEffect(() => { if (open) openedAt.current = performance.now() }, [open])
  const others = skillLists(model.lists).filter((l) => l.id !== listId && l.skillIds.length > 0)
  const lastList = React.useRef<string | null>(null)
  if (listId) lastList.current = listId
  return (
    <>
      <FloatingSheetPanel open={open} onOpenChange={(o) => { if (o) return; if (levelLeave?.current) { pressedOutside.current = false; return levelLeave.current() } const outside = pressedOutside.current; pressedOutside.current = false; if (outside) requestClose(); else requestStep() }}>
        <FloatingSheetPanelContent
          side="right"
          size={view === "skills" ? "lg" : "md"}
          contentSlot={view === "skills" ? "lab-admin-list-picker" : "lab-admin-list-panel"}
          style={present ? { top: "2.75rem", height: "calc(100dvh - 3.25rem)" } : undefined}
          onOpenAutoFocus={(e) => { e.preventDefault(); focusPanel() }}
          onCloseAutoFocus={(e) => {
            // The list's row, as the Library's panel; else what opened the panel (New skill list, for a list that was never saved).
            e.preventDefault()
            const row = lastList.current ? listLink(lastList.current) : null
            if (row) row.focus({ preventScroll: true })
            else back.restore()
          }}
          onInteractOutside={(e) => {
            const original = e.detail.originalEvent
            const target = original.target as Element | null
            if (original instanceof PointerEvent && performance.now() - openedAt.current < 500) { e.preventDefault(); return }
            // The same rules as the Library's panel: a row swaps the record, a link leaves for its own page and asks through the leave guard, and what sits above the panel is not a click on the page.
            if (target && !target.isConnected) { e.preventDefault(); return }
            if (target?.closest?.("[data-slot=dialog-overlay], [data-slot=alert-dialog-overlay], [role=dialog], [role=alertdialog]")) { e.preventDefault(); return }
            if (onRowBody(target)) { e.preventDefault(); return }
            if (target?.closest?.("a[href]")) { e.preventDefault(); return }
            if (target?.closest?.(NAV_TOGGLE)) { e.preventDefault(); return }
            // Radix closes in the same turn as this call; focus moving out reaches here too and closes nothing, so the mark does not outlive the turn.
            if (original instanceof PointerEvent) {
              pressedOutside.current = true
              queueMicrotask(() => { pressedOutside.current = false })
            }
          }}
        >
          {level ? level : list ? (
            <>
              <FloatingSheetPanelToolbar
                onBack={view === "skills" && (!isFresh || changing) ? requestBack : undefined}
                backLabel={`Back to ${changing ? origin?.name ?? list.name : list.name}`}
                closeLabel="Close"
                actions={isFresh ? undefined : <ListRowMenu list={list} onRename={onRename} onNewVersion={onNewVersion} onDelete={onDelete} />}
              />
              <FloatingSheetPanelHeader title={changing ? `Change ${skillNounPlural()}` : list.name} subtitle={changing ? `Saves as ${list.name}. Students on ${origin?.name ?? "the current list"} keep it.` : view === "list" ? <span data-list-size>{listSizeText(model.state, list)}</span> : undefined} className="data-scrolled:border-transparent [&>div]:pb-2" />
              <PanelResultSlot />
              {view === "list" ? (
                <ListBody model={model} list={list} onSkills={() => onView("skills")} onChangeSkills={() => onNewVersion(list.id)} onAddStudents={onAddStudents} onRemove={onRemove} onDefault={onDefault} />
              ) : (
                <FloatingSheetPanelBody className="flex flex-col gap-3 px-4 pb-4" data-list-skills={picking ? "editable" : "read-only"}>
                  {reading ? (
                    <>
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-sm text-muted-foreground" data-read-only-line>{`Students keep these ${skillNounPlural()}. Changes save as a new list.`}</p>
                        <Button type="button" variant="outline" size="sm" onClick={() => onNewVersion(list.id)}>{`Change ${skillNounPlural()}`}</Button>
                      </div>
                      <SkillRows key={list.id} skills={rows.filter((k) => saved.has(k.id))} />
                    </>
                  ) : rows.length ? (
                    <SkillPicker key={list.id} skills={rows} savedIds={saved} selected={picked} others={others} onChange={(ids) => setEdits({ listId: list.id, ids })} idPrefix={`list-skills-${list.id}`} />
                  ) : (
                    <NoSkillsYet />
                  )}
                </FloatingSheetPanelBody>
              )}
              {/* Only with something to save, as the Library's panel (D-L97). With nothing to save, X is the way out. A flex child under a body that keeps its scrollTop, so nothing moves when it appears. */}
              <span className="sr-only" aria-live="polite">{dirty ? "Unsaved changes" : ""}</span>
              {dirty ? (
                <FloatingSheetPanelFooter className="flex items-center justify-between gap-2" data-unsaved-footer>
                  <span className="text-sm text-muted-foreground" aria-hidden="true">Unsaved changes</span>
                  <span className="flex items-center gap-2">
                    <Button type="button" variant="outline" size="sm" onClick={requestBack}>Cancel</Button>
                    <Button type="button" variant="default" size="sm" onClick={save}>{changing ? "Save as new list" : "Save list"}</Button>
                  </span>
                </FloatingSheetPanelFooter>
              ) : null}
            </>
          ) : null}
        </FloatingSheetPanelContent>
      </FloatingSheetPanel>
      <DiscardChangesDialog open={asking !== null} onKeep={() => { setAsking(null); stepOffPanelClose() }} onDiscard={() => (asking === "back" ? backNow() : closeNow())} body={unsaved} />
      <DiscardChangesDialog open={leave.asking} onKeep={() => leave.setAsking(false)} onDiscard={() => leave.go(closeNow)} body={unsaved} />
    </>
  )
}
