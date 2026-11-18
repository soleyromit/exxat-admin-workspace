"use client"

/**
 * Add skills to a list (ADMIN-D6 round add-skills, Proposed D-ADD1116). One job with one result, in place of four entry points that each opened a different container:
 * - From the library: the active skills not on the list yet, grouped by category, with Select all over the result, a box per category and Copy from a list. Ticking only
 *   adds, so nothing here can take a skill off the list.
 * - New skills: the Add several form (`useAddSeveralForm`: names, review of each line, category and tags, the duplicate rule), with Upload a file filling the names box.
 * One primary adds everything chosen in both. A list students are on asks who the change applies to first (D-LS1116-c). The result is one banner with Undo.
 * Two containers over the same parts: `AddSkillsPanel` (variant D, a side panel with two tabs) and `AddSkillsStep` (variant E, the page itself, two panes and a footer).
 */
import * as React from "react"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import { Checkbox } from "@exxatdesignux/ui/components/ui/checkbox"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@exxatdesignux/ui/components/ui/command"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@exxatdesignux/ui/components/ui/dropdown-menu"
import { FloatingSheetPanelBody, FloatingSheetPanelContent, FloatingSheetPanelHeader, FloatingSheetPanelWorkflowFooter, railTriggerProps } from "@exxatdesignux/ui/components/ui/floating-sheet-panel"
import { Input } from "@exxatdesignux/ui/components/ui/input"
import { Label } from "@exxatdesignux/ui/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@exxatdesignux/ui/components/ui/popover"
import { Tabs, TabsContent, TabsCountBadge, TabsList, TabsTrigger } from "@exxatdesignux/ui/components/ui/tabs"
import { FloatingSheetPanel } from "@/components/lab/shared/sheet"
import { DiscardChangesDialog, useLeaveGuard } from "@/components/lab/shared/unsaved-guard"
import { focusSheetOpener } from "@/components/lab/shared/focus"
import { StickyFooter } from "@/components/lab/layout/sticky-footer"
import { LabLink as Link } from "@/components/lab/lab-bar/lab-link"
import { useLabLinkContext } from "@/components/lab/lab-bar/page-context"
import { LINK_IN_TABLE as LINK } from "@/components/lab/link-styles"
import { ABOVE_PANEL_MENU } from "@/components/lab/overlay-layer"
import { TYPE } from "@/components/lab/type-scale"
import { SaveScopeDialog } from "@/components/lab/admin-a/lists-save-scope"
import { customGroupsStore } from "@/components/lab/admin-a/use-admin-data"
import { useRovingChecks } from "@/components/lab/admin-a/lists-focus"
import { ACCEPT } from "@/components/lab/import/import-parts"
import { listSkillsHref } from "@/lib/lab/admin-ia"
import { importHref, type LibraryRow, type SeveralItem } from "@/lib/lab/library"
import { pickAll, pickState, skillLists, studentCount, studentGroups, type SkillList } from "@/lib/lab/lists"
import { withFrom } from "@/lib/lab/return-to"
import { countSkills, skillNoun, skillNounPlural } from "@/lib/lab/terms"
import { useV2State } from "@/lib/v2/react"
import { useAddSeveralForm } from "./add-several-sheet"
import type { LibraryApi } from "./use-library"

const fmt = (n: number) => n.toLocaleString("en-US")
/** Long lists stay quick: rows out of view skip their layout and paint, at the height they will take. */
const ROW = "flex min-h-11 items-center gap-3 border-b border-border px-3 py-2 last:border-b-0 [contain-intrinsic-size:auto_2.75rem] [content-visibility:auto]"
const NAMES_TAB = "new"
const LIBRARY_TAB = "library"

type Offered = Pick<LibraryRow, "id" | "name" | "section">

/** Category, as a type-to-search list: a program has 40 and more (the DS has no combobox, so Popover + Command). */
function CategoryFilter({ categories, value, onChange, layer }: { categories: Array<{ name: string; count: number }>; value: string; onChange: (v: string) => void; layer?: string }) {
  const [open, setOpen] = React.useState(false)
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button type="button" variant="outline" size="default" className="w-full justify-between font-normal sm:w-56" aria-label={value ? `Category: ${value}` : "Category: all"} data-add-category {...railTriggerProps()}>
          <span className="truncate">{value || "All categories"}</span>
          <i className="fa-light fa-chevron-down text-xs" aria-hidden="true" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className={`${layer ?? ""} w-72 p-0`} {...railTriggerProps()}>
        <Command>
          <CommandInput placeholder="Find a category" aria-label="Find a category" />
          <CommandList>
            <CommandEmpty>No category matches.</CommandEmpty>
            <CommandGroup>
              <CommandItem value="__all" onSelect={() => { onChange(""); setOpen(false) }}>All categories</CommandItem>
              {categories.map((c) => (
                <CommandItem key={c.name} value={c.name} onSelect={() => { onChange(c.name); setOpen(false) }}>
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

/**
 * The library, as something to tick. Search and category narrow it; Select all acts on the whole result, not the rows drawn; a category's own box ticks its skills; Copy from a list
 * ticks that list's skills and leaves the rest as they are (D-X17: a copy is always asked for, never assumed).
 */
export function LibraryPick({ rows, picked, onChange, others, idPrefix, layer, scroll }: {
  rows: readonly Offered[]
  picked: ReadonlySet<string>
  onChange: (next: Set<string>) => void
  /** Other lists, to copy from. */
  others: readonly SkillList[]
  idPrefix: string
  /** Stacking for the menus when the picker sits in a panel. */
  layer?: string
  /** The rows scroll inside their own box (the page step), so the other pane stays beside them. */
  scroll?: boolean
}) {
  const [query, setQuery] = React.useState("")
  const [category, setCategory] = React.useState("")
  const [copied, setCopied] = React.useState<string | null>(null)
  const q = React.useDeferredValue(query).trim().toLowerCase()
  const categories = React.useMemo(() => {
    const counts = new Map<string, number>()
    for (const r of rows) counts.set(r.section, (counts.get(r.section) ?? 0) + 1)
    return [...counts].map(([name, count]) => ({ name, count })).sort((a, b) => a.name.localeCompare(b.name))
  }, [rows])
  const shown = React.useMemo(() => rows.filter((r) => (!category || r.section === category) && (!q || r.name.toLowerCase().includes(q) || r.section.toLowerCase().includes(q))), [rows, category, q])
  const groups = React.useMemo(() => {
    const by = new Map<string, Offered[]>()
    for (const r of shown) by.set(r.section, [...(by.get(r.section) ?? []), r])
    return [...by].sort((a, b) => a[0].localeCompare(b[0]))
  }, [shown])
  const filtering = !!query.trim() || !!category
  const state = pickState(shown.map((r) => r.id), picked)
  const offered = React.useMemo(() => new Set(rows.map((r) => r.id)), [rows])
  const roving = useRovingChecks()
  const set = (ids: string[], on: boolean) => onChange(pickAll(ids, picked, on))
  const copy = (l: SkillList) => {
    const ids = l.skillIds.filter((id) => offered.has(id))
    const added = ids.filter((id) => !picked.has(id)).length
    if (ids.length) onChange(pickAll(ids, picked, true))
    setCopied(ids.length === 0 ? `Every ${skillNoun()} on ${l.name} is on this list already.` : `${countSkills(added)} selected from ${l.name}.`)
  }
  if (!rows.length) return <p className={TYPE.helper} data-add-library-empty>{`The library has no other ${skillNounPlural()}. Type names or upload a file.`}</p>
  return (
    <div className="flex min-h-0 min-w-0 flex-col gap-3" data-add-library>
      {/* In a panel the search, Select all and the count stay in view while the rows scroll under them; on the page step the rows scroll in their own box. */}
      <div className={scroll ? "flex flex-col gap-3" : "sticky top-0 z-10 flex flex-col gap-3 bg-background pt-3 pb-1"}>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input id={`${idPrefix}-search`} type="search" value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") e.preventDefault() }} className="w-full sm:flex-1" aria-label={`Search ${skillNounPlural()}`} placeholder={`Search ${skillNounPlural()}`} data-add-search />
        <CategoryFilter categories={categories} value={category} onChange={setCategory} layer={layer} />
      </div>
      <div className="flex min-h-8 flex-wrap items-center justify-between gap-x-3 gap-y-1">
        <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
          <Checkbox id={`${idPrefix}-all`} checked={state.all ? true : state.some ? "indeterminate" : false} disabled={state.of === 0} onCheckedChange={() => set(shown.map((r) => r.id), !state.all)} data-add-all />
          <Label htmlFor={`${idPrefix}-all`} className="font-normal">{filtering ? `Select all ${fmt(state.of)} matching` : "Select all"}</Label>
          <span className="text-sm tabular-nums text-muted-foreground" role="status" aria-live="polite" data-add-picked={picked.size}>
            {`${fmt(picked.size)} of ${fmt(rows.length)} selected`}
          </span>
        </div>
        {others.length ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button type="button" variant="outline" size="sm" data-add-copy {...railTriggerProps()}>Copy from a list</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className={`${layer ?? ""} w-72`} {...railTriggerProps()}>
              {others.map((l) => (
                <DropdownMenuItem key={l.id} onSelect={() => copy(l)} data-add-copy-list={l.id}>
                  <span className="min-w-0 flex-1 truncate">{l.name}</span>
                  <span className="text-xs tabular-nums text-muted-foreground">{fmt(l.skillIds.length)}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null}
      </div>
      {copied ? <p className={TYPE.helper} role="status" data-add-copied>{copied}</p> : null}
      </div>
      <ul className={`flex flex-col rounded-[var(--radius)] border border-border ${scroll ? "max-h-[55dvh] min-h-40 overflow-y-auto lg:max-h-[calc(100dvh-24rem)]" : ""}`} aria-label={`${skillNounPlural()} in the library`} data-add-rows={shown.length} {...roving}>
        {groups.map(([name, list]) => {
          const g = pickState(list.map((r) => r.id), picked)
          const gid = `${idPrefix}-group-${name.replace(/[^a-z0-9]+/gi, "-")}`
          return (
            <React.Fragment key={name}>
              <li className="flex min-h-10 items-center gap-3 border-b border-border bg-dt-group-bg px-3 py-1.5" data-add-group={name}>
                <Checkbox id={gid} checked={g.all ? true : g.some ? "indeterminate" : false} onCheckedChange={() => set(list.map((r) => r.id), !g.all)} aria-label={`All ${list.length} in ${name}`} />
                <Label htmlFor={gid} className={`${TYPE.label} min-w-0 flex-1 truncate`}>{name}</Label>
                <span className="text-xs tabular-nums text-muted-foreground">{fmt(list.length)}</span>
              </li>
              {list.map((r) => {
                const id = `${idPrefix}-${r.id}`
                return (
                  <li key={r.id} className={ROW}>
                    <Checkbox id={id} checked={picked.has(r.id)} onCheckedChange={(v) => set([r.id], v === true)} />
                    <Label htmlFor={id} className="min-w-0 flex-1 font-normal">{r.name}</Label>
                  </li>
                )
              })}
            </React.Fragment>
          )
        })}
        {!shown.length ? (
          <li className="flex flex-wrap items-center gap-2 px-3 py-3 text-sm text-muted-foreground">
            {`No ${skillNounPlural()} match.`}
            <Button type="button" variant="ghost" size="sm" onClick={() => { setQuery(""); setCategory("") }}>Clear</Button>
          </li>
        ) : null}
      </ul>
    </div>
  )
}

/** A file's text as names, one per line: the first cell of a sheet with columns, its header row left out; headings are counted, not added. */
export function namesFromFile(text: string, columns?: boolean, skipHeader?: boolean): { names: string; lines: number; headings: number } {
  let lines = text.split(/\r?\n/).filter((l) => l.trim())
  if (columns) {
    if (skipHeader) lines = lines.slice(1)
    lines = lines.map((l) => (l.split(",")[0] ?? "").replace(/^"|"$/g, "").trim()).filter(Boolean)
  }
  const kept = lines.filter((l) => !/^#+\s/.test(l.trim()))
  return { names: kept.join("\n"), lines: kept.length, headings: lines.length - kept.length }
}

/** Lists first filled here, from empty, since the page loaded: still being built, so further adds do not ask who they apply to. */
export const building = new Set<string>()

type FileRead ={ name: string; lines: number; headings: number } | { name: string; failed: true }
type Pending = { existingIds: string[]; items: SeveralItem[]; defaults: { category: string; tags: string[] } }

/**
 * Everything Add skills holds, whichever container shows it: what is ticked in the library, the names form, the file that filled it, the save question and the discard question.
 * `active` resets it when the surface opens; `onDone` closes the surface after an add that left nothing behind.
 */
export function useAddSkills({ api, active, onDone, layer, scroll, onNeedNames }: {
  api: LibraryApi
  active: boolean
  onDone: () => void
  layer?: string
  scroll?: boolean
  /** The names form has something to fix: the container shows it (the panel moves to its tab). */
  onNeedNames?: () => void
}) {
  const list = api.list
  const link = useLabLinkContext()
  const state = useV2State()
  const custom = customGroupsStore.use()
  const onList = React.useMemo(() => new Set(list?.skillIds ?? []), [list?.skillIds])
  const offered = React.useMemo<Offered[]>(
    () => api.allRows.filter((r) => r.status === "active" && !onList.has(r.id)).map((r) => ({ id: r.id, name: r.name, section: r.categoryName ?? r.section })).sort((a, b) => a.section.localeCompare(b.section) || a.name.localeCompare(b.name)),
    [api.allRows, onList],
  )
  const others = React.useMemo(() => skillLists(api.lists).filter((l) => l.id !== list?.id && l.skillIds.length > 0), [api.lists, list?.id])
  const students = React.useMemo(() => (list ? studentCount(list, studentGroups(state, custom)) : 0), [list, state, custom])
  const [picked, setPicked] = React.useState<Set<string>>(new Set())
  const [file, setFile] = React.useState<FileRead | null>(null)
  const [reading, setReading] = React.useState(false)
  const [nothing, setNothing] = React.useState(false)
  const [pending, setPending] = React.useState<Pending | null>(null)
  const [guard, setGuard] = React.useState(false)
  const lastAdd = React.useRef(0)
  const input = React.useRef<HTMLInputElement>(null)
  React.useEffect(() => { if (active) { setPicked(new Set()); setFile(null); setNothing(false); setPending(null) } }, [active])
  // A skill ticked here and then put on the list elsewhere (Undo, another tab) is no longer offered: it leaves the selection too.
  const chosen = React.useMemo(() => [...picked].filter((id) => !onList.has(id)), [picked, onList])

  const bulkHref = list ? `${withFrom(importHref, "skills")}&list=${encodeURIComponent(list.id)}&to=${encodeURIComponent(list.id)}` : withFrom(importHref, "skills")
  const note = reading ? <p className={TYPE.helper} role="status">Reading the file</p> : file ? (
    "failed" in file ? (
      <p className={TYPE.helper} role="alert" data-add-file="failed">{`${file.name} could not be read. Try a spreadsheet, a document or a text file.`}</p>
    ) : (
      <p className={TYPE.helper} role="status" data-add-file={file.lines}>
        {`${fmt(file.lines)} ${file.lines === 1 ? "line" : "lines"} read from ${file.name}.`}
        {file.headings ? <>{` ${fmt(file.headings)} ${file.headings === 1 ? "heading was" : "headings were"} left out. `}<Link className={LINK} href={bulkHref}>Read headings as categories in Bulk upload</Link></> : null}
      </p>
    )
  ) : undefined
  const upload = (
    <>
      <input ref={input} type="file" accept={ACCEPT} className="sr-only" tabIndex={-1} aria-hidden="true" data-add-file-input onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; if (f) void readFile(f) }} />
      <Button type="button" variant="outline" size="sm" disabled={reading} onClick={() => input.current?.click()} data-add-upload {...railTriggerProps()}>Upload a file</Button>
    </>
  )
  const form = useAddSeveralForm({ open: active, rows: api.allRows, onListIds: onList, labelAction: upload, note, autoFocus: false })
  /** The file's lines land in the names box, after whatever is there: the same review and the same rules as typed names [REQ IM-05, IM-06, IM-08]. */
  async function readFile(f: File) {
    setReading(true)
    setFile(null)
    let read: { names: string; lines: number; headings: number } | null = null
    try {
      const body = new FormData()
      body.append("file", f)
      const res = await fetch("/api/import/extract", { method: "POST", body })
      if (res.ok) {
        const out = (await res.json()) as { text?: string; columns?: boolean; skipHeader?: boolean }
        if (typeof out.text === "string") read = namesFromFile(out.text, out.columns, out.skipHeader)
      }
    } catch { /* read below when it is plain text */ }
    if (!read && /\.(csv|txt)$/i.test(f.name)) {
      try { read = namesFromFile(await f.text(), /\.csv$/i.test(f.name), false) } catch { read = null }
    }
    setReading(false)
    if (!read || !read.lines) { setFile({ name: f.name, failed: true }); return }
    const names = read.names
    form.setText((t) => (t.trim() ? `${t.replace(/\s+$/, "")}\n${names}` : names))
    setFile({ name: f.name, lines: read.lines, headings: read.headings })
    setNothing(false)
    onNeedNames?.()
  }

  const byName = form.existing.filter((id) => !picked.has(id)).length
  const total = chosen.length + form.n + byName
  const dirty = chosen.length > 0 || form.dirty
  const primaryLabel = total ? `Add ${countSkills(total)}` : form.replacing ? `Replace ${countSkills(form.replacing)}` : `Add ${skillNounPlural()}`
  const parts = [chosen.length ? `${fmt(chosen.length)} from the library` : "", form.n ? `${fmt(form.n)} new` : "", byName ? `${fmt(byName)} by name` : "", form.replacing ? `${fmt(form.replacing)} replaced` : ""].filter(Boolean)
  const summary = nothing ? `Choose ${skillNounPlural()} or type a name.` : parts.join(", ")

  const finish = (p: Pending, asNewList: boolean) => {
    lastAdd.current = Date.now()
    setPending(null)
    api.addToList({ ...p, asNewList, hrefFor: (id) => listSkillsHref(id, link) })
    setPicked(new Set())
    setFile(null)
    if (form.settle()) onNeedNames?.()
    else onDone()
  }
  const submit = () => {
    if (!active || !list || Date.now() - lastAdd.current < 700) return
    let taken: ReturnType<typeof form.take> = null
    if (!form.empty) {
      taken = form.take()
      // Lines that cannot be read, or names all on the list already: the form says which, and nothing is added until they are fixed or cleared.
      if (!taken) { onNeedNames?.(); return }
    }
    if (!taken && chosen.length === 0) { setNothing(true); return }
    setNothing(false)
    const p: Pending = { existingIds: [...chosen, ...(taken?.existing ?? [])], items: taken?.items ?? [], defaults: taken?.defaults ?? { category: "", tags: [] } }
    // A list students are on: who the change applies to is asked first (D-LS1116-c). A list with no skills yet measures no one and is filled in place, and so are
    // the adds that follow while it is still being built on this page [INFER, Proposed: until a reload; whether a new list should ask at all is Romit's call].
    if (list.skillIds.length === 0) building.add(list.id)
    if (students > 0 && list.skillIds.length > 0 && !building.has(list.id)) { setPending(p); return }
    finish(p, false)
  }

  const leave = useLeaveGuard(active && dirty)
  const requestClose = () => (dirty ? setGuard(true) : onDone())
  const discard = () => {
    setGuard(false)
    if (leave.asking) leave.go(() => onDone())
    else onDone()
  }
  const dialogs = (
    <>
      <SaveScopeDialog open={!!pending} listName={list?.name ?? ""} students={students} onCancel={() => setPending(null)} onUpdate={() => pending && finish(pending, false)} onSaveNew={() => pending && finish(pending, true)} />
      <DiscardChangesDialog open={guard || leave.asking} onKeep={() => { setGuard(false); leave.setAsking(false) }} onDiscard={discard} body={`No ${skillNounPlural()} have been added.`} />
    </>
  )
  const library = <LibraryPick rows={offered} picked={picked} onChange={(next) => { setPicked(next); setNothing(false) }} others={others} idPrefix="add-pick" layer={layer} scroll={scroll} />
  return { list, offered, chosen, form, library, names: form.fields, total, summary, nothing, mixed: parts.length > 1, primaryLabel, submit, requestClose, dialogs, dirty, newCount: form.n + byName + form.replacing }
}

/**
 * Variant D: one panel over the list, the same family as New skill list. Two tabs that keep what they hold; the count on a tab is what it will add. The one primary adds both.
 */
export function AddSkillsPanel({ api, open, onOpenChange }: { api: LibraryApi; open: boolean; onOpenChange: (o: boolean) => void }) {
  const [tab, setTab] = React.useState(LIBRARY_TAB)
  const add = useAddSkills({ api, active: open, onDone: () => onOpenChange(false), layer: ABOVE_PANEL_MENU, onNeedNames: () => setTab(NAMES_TAB) })
  const none = add.offered.length === 0
  React.useEffect(() => { if (open) setTab(none ? NAMES_TAB : LIBRARY_TAB) }, [open]) // eslint-disable-line react-hooks/exhaustive-deps
  const focusFirst = () => (document.querySelector<HTMLElement>("[data-slot=lab-add-skills] [data-add-search]") ?? document.getElementById("several-names"))?.focus()
  return (
    <>
      <FloatingSheetPanel open={open} onOpenChange={(o) => (o ? onOpenChange(true) : add.requestClose())} modal>
        <FloatingSheetPanelContent
          contentSlot="lab-add-skills"
          side="right"
          size="lg"
          aria-modal="true"
          onOpenAutoFocus={(e) => { e.preventDefault(); focusFirst() }}
          onCloseAutoFocus={(e) => { e.preventDefault(); focusSheetOpener() }}
        >
          <FloatingSheetPanelHeader title={`Add ${skillNounPlural()} to ${add.list?.name ?? "this list"}`} onClose={add.requestClose} />
          <form id="lab-add-skills-form" noValidate className="flex min-h-0 flex-1 flex-col" onSubmit={(e) => { e.preventDefault(); add.submit() }}>
            <Tabs value={tab} onValueChange={setTab} className="flex min-h-0 flex-1 flex-col">
              <div className="px-4">
                <TabsList variant="line" ariaLabel={`Ways to add ${skillNounPlural()}`}>
                  <TabsTrigger value={LIBRARY_TAB} data-add-tab="library">
                    From library
                    {add.chosen.length ? <TabsCountBadge count={add.chosen.length} /> : null}
                  </TabsTrigger>
                  <TabsTrigger value={NAMES_TAB} data-add-tab="new">
                    {`New ${skillNounPlural()}`}
                    {add.newCount ? <TabsCountBadge count={add.newCount} /> : null}
                  </TabsTrigger>
                </TabsList>
              </div>
              <FloatingSheetPanelBody className="flex flex-col px-4 pt-0 pb-4">
                <TabsContent value={LIBRARY_TAB} className="mt-0">{add.library}</TabsContent>
                {/* Kept mounted: what is typed stays while the library tab is in view. */}
                <TabsContent value={NAMES_TAB} forceMount className="mt-0 flex flex-col gap-5 pt-3 data-[state=inactive]:hidden">{add.names}</TabsContent>
              </FloatingSheetPanelBody>
            </Tabs>
            {add.nothing ? <p className="px-4 pb-2 text-sm text-destructive" role="alert" data-add-nothing>{add.summary}</p> : null}
            {/* Both tabs hold something: what the one primary adds, in words, since only one tab is in view. */}
            {!add.nothing && add.mixed ? <p className="px-4 pb-2 text-sm text-muted-foreground" role="status" data-add-summary>{add.summary}</p> : null}
            <FloatingSheetPanelWorkflowFooter onCancel={add.requestClose} primaryForm="lab-add-skills-form" primaryIconClassName="" primaryLabel={add.primaryLabel} />
          </form>
        </FloatingSheetPanelContent>
      </FloatingSheetPanel>
      {add.dialogs}
    </>
  )
}

/**
 * Variant E: the add step is the page. The library on the left, new names on the right, one footer with what will be added in words and the one primary. An empty list opens
 * on it; a list with skills opens it from Add skills (`?add=1`), and Cancel returns to the table.
 */
export function AddSkillsStep({ api, onDone, cancel, closeRef }: { api: LibraryApi; onDone: () => void; /** Shown when there is a table to return to. */ cancel?: boolean; /** The page's back icon leaves through the same question as Cancel. */ closeRef?: React.MutableRefObject<(() => void) | null> }) {
  const add = useAddSkills({ api, active: true, onDone, scroll: true, onNeedNames: () => document.getElementById("add-step-new")?.scrollIntoView({ block: "nearest" }) })
  if (closeRef) closeRef.current = add.requestClose
  // Arriving on the step: focus goes to its first control, the search, or the names box when the library has nothing to offer.
  React.useEffect(() => {
    (document.querySelector<HTMLElement>("[data-add-step] [data-add-search]") ?? document.getElementById("several-names"))?.focus({ preventScroll: true })
  }, [])
  return (
    <form noValidate className="flex min-h-0 flex-1 flex-col" onSubmit={(e) => { e.preventDefault(); add.submit() }} data-add-step>
      <div className="grid flex-1 grid-cols-1 gap-8 pb-6 lg:grid-cols-2 lg:gap-0">
        <section aria-labelledby="add-step-library" className="flex min-w-0 flex-col gap-3 lg:pe-6">
          <h2 id="add-step-library" className={TYPE.card}>From the library</h2>
          {add.library}
        </section>
        <section aria-labelledby="add-step-new" className="flex min-w-0 flex-col gap-5 lg:border-s lg:border-border lg:ps-6">
          <h2 id="add-step-new" className={TYPE.card}>{`New ${skillNounPlural()}`}</h2>
          {add.names}
        </section>
      </div>
      <StickyFooter
        back={cancel ? { label: "Cancel", onClick: add.requestClose } : undefined}
        context={add.summary ? <span className={add.nothing ? "text-destructive" : undefined} data-add-summary>{add.summary}</span> : undefined}
        primary={{ label: add.primaryLabel, type: "submit" }}
      />
      {add.dialogs}
    </form>
  )
}
