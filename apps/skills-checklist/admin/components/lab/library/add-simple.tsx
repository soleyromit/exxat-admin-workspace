"use client"

/**
 * Add skills to a list, the simple way (ADMIN-D6 round add-skills-simple, Proposed D-ADD1116-s). One box does three jobs: it searches the library, it creates a skill the
 * library does not have (a last row, Create "{name}", or Enter), and it takes a pasted list. Category, tags and evaluation settings are not asked here: a new skill takes
 * its name and is edited on its row afterwards [REQ SC-01]. Upload a file and Copy from a list sit in one quiet menu.
 * Two containers over the same core:
 * - `QuickAddPanel` (variant F): tick, then one "Add n skills". A basket.
 * - `InlineAdd` (variant G): on the list's own page; Add on a row puts that skill on the list at once. No overlay, no selection.
 * A name the library already has is never created again: the library's skill is used [REQ IM-06, D-ADD1116 "Use existing"]. Lines that could not be read are listed with
 * their text [REQ IM-08]. A list students are on asks who the change applies to first (D-LS1116-c).
 */
import * as React from "react"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import { Checkbox } from "@exxatdesignux/ui/components/ui/checkbox"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@exxatdesignux/ui/components/ui/dropdown-menu"
import { FloatingSheetPanelBody, FloatingSheetPanelContent, FloatingSheetPanelHeader, FloatingSheetPanelWorkflowFooter, railTriggerProps } from "@exxatdesignux/ui/components/ui/floating-sheet-panel"
import { Input } from "@exxatdesignux/ui/components/ui/input"
import { Label } from "@exxatdesignux/ui/components/ui/label"
import { FloatingSheetPanel } from "@/components/lab/shared/sheet"
import { DiscardChangesDialog, useLeaveGuard } from "@/components/lab/shared/unsaved-guard"
import { focusSheetOpener } from "@/components/lab/shared/focus"
import { useLabLinkContext } from "@/components/lab/lab-bar/page-context"
import { ABOVE_PANEL_MENU } from "@/components/lab/overlay-layer"
import { TYPE } from "@/components/lab/type-scale"
import { SaveScopeDialog } from "@/components/lab/admin-a/lists-save-scope"
import { customGroupsStore } from "@/components/lab/admin-a/use-admin-data"
import { useRovingChecks } from "@/components/lab/admin-a/lists-focus"
import { ACCEPT } from "@/components/lab/import/import-parts"
import { listSkillsHref } from "@/lib/lab/admin-ia"
import { libraryTwins, normName, notReadReason, parseSeveral, type LibraryRow, type PastedLine } from "@/lib/lab/library"
import { pickAll, pickState, skillLists, studentCount, studentGroups, type SkillList } from "@/lib/lab/lists"
import { aNoun, countSkills, skillNoun, skillNounPlural } from "@/lib/lab/terms"
import { useV2State } from "@/lib/v2/react"
import { building, namesFromFile } from "./add-to-list"
import type { LibraryApi } from "./use-library"

const fmt = (n: number) => n.toLocaleString("en-US")
const ROW = "flex min-h-11 items-center gap-3 border-b border-border px-3 py-2 last:border-b-0 [contain-intrinsic-size:auto_2.75rem] [content-visibility:auto]"
const GROUP = "border-b border-border px-3 pt-3 pb-1.5 text-xs text-muted-foreground"

type Offered = Pick<LibraryRow, "id" | "name" | "section">
/** What typed, pasted or uploaded text turns into, before anything is added. */
interface Staged {
  /** Library skills, by id, that can go on the list. */
  existing: string[]
  /** Names the library does not have. */
  fresh: string[]
  onList: number
  inactive: number
  unread: PastedLine[]
}
interface Notice { text: string; unread: PastedLine[] }
interface Adding { existingIds: string[]; names: string[] }

const stagedParts = (s: Staged) => [
  s.fresh.length ? `${fmt(s.fresh.length)} new` : "",
  s.existing.length ? `${fmt(s.existing.length)} from the library` : "",
  s.onList ? `${fmt(s.onList)} on this list already` : "",
  s.inactive ? `${fmt(s.inactive)} inactive in the library` : "",
].filter(Boolean).join(", ")

/** One sentence for a paste or a file: where it came from, then what each line became. */
function stagedNotice(source: string, s: Staged): Notice {
  const parts = stagedParts(s)
  const unread = s.unread.length ? ` ${fmt(s.unread.length)} ${s.unread.length === 1 ? "line was" : "lines were"} not read.` : ""
  return { text: `${source}${parts ? `: ${parts}.` : "."}${unread}`, unread: s.unread }
}

/** One typed name that added nothing: why, naming the skill. */
function typedNotice(name: string, s: Staged): Notice | null {
  if (s.fresh.length || s.existing.length) return null
  if (s.onList) return { text: `${name} is on this list already.`, unread: [] }
  if (s.inactive) return { text: `${name} is inactive in the library.`, unread: [] }
  const line = s.unread[0]
  return { text: `"${name}" cannot be the name of ${aNoun()}: ${line ? notReadReason(line) : "could not be read"}.`, unread: [] }
}

async function readNames(f: File): Promise<{ names: string; lines: number; headings: number } | null> {
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
  return read && read.lines ? read : null
}

/** What both containers share: what the library can still offer this list, how text is read, and the one way anything reaches the list. */
function useAddCore(api: LibraryApi, { askOnce = false }: { /** The who-it-applies-to question is asked on the first add of a visit, not on every press. */ askOnce?: boolean } = {}) {
  const list = api.list
  const link = useLabLinkContext()
  const state = useV2State()
  const custom = customGroupsStore.use()
  const onList = React.useMemo(() => new Set(list?.skillIds ?? []), [list?.skillIds])
  const active = React.useMemo<Offered[]>(
    () => api.allRows.filter((r) => r.status === "active").map((r) => ({ id: r.id, name: r.name, section: r.categoryName ?? r.section })).sort((a, b) => a.section.localeCompare(b.section) || a.name.localeCompare(b.name)),
    [api.allRows],
  )
  const offered = React.useMemo(() => active.filter((r) => !onList.has(r.id)), [active, onList])
  const offeredIds = React.useMemo(() => new Set(offered.map((r) => r.id)), [offered])
  const others = React.useMemo(() => skillLists(api.lists).filter((l) => l.id !== list?.id && l.skillIds.length > 0), [api.lists, list?.id])
  const students = React.useMemo(() => (list ? studentCount(list, studentGroups(state, custom)) : 0), [list, state, custom])
  const names = React.useMemo(() => api.allRows.map((r) => r.name), [api.allRows])
  const twins = React.useMemo(() => libraryTwins(api.allRows), [api.allRows])
  const [asking, setAsking] = React.useState<Adding | null>(null)
  const after = React.useRef<((asNewList: boolean) => void) | null>(null)

  /** Reads names, one per line. `have` are new names already staged, so a name is never staged twice. */
  const stage = (text: string, have: readonly string[] = []): Staged => {
    const parsed = parseSeveral(text, names)
    const out: Staged = { existing: [], fresh: [], onList: 0, inactive: 0, unread: [] }
    const seen = new Set(have.map(normName))
    for (const l of parsed.lines) {
      if (l.kind === "ready") { if (!seen.has(normName(l.name))) { seen.add(normName(l.name)); out.fresh.push(l.name) } }
      else if (l.kind === "in-library") {
        const id = twins.get(normName(l.name))?.id
        if (id && offeredIds.has(id)) { if (!out.existing.includes(id)) out.existing.push(id) }
        else if (id && onList.has(id)) out.onList += 1
        else out.inactive += 1
      } else if (l.kind !== "in-paste") out.unread.push(l)
    }
    return out
  }
  const known = (name: string) => twins.has(normName(name))

  const write = (a: Adding, asNewList: boolean) => api.addToList({ existingIds: a.existingIds, items: a.names.map((name) => ({ name })), defaults: { category: "", tags: [] }, asNewList, hrefFor: (id) => listSkillsHref(id, link) })
  /** Adds, or asks first when students are on the list. `done` runs once the add has happened. */
  const commit = (a: Adding, done?: (asNewList: boolean) => void) => {
    if (!list || (!a.existingIds.length && !a.names.length)) return
    // A list with no skills yet measures no one: it is filled in place, and so are the adds that follow while it is being built on this page (as variants D and E).
    if (list.skillIds.length === 0) building.add(list.id)
    if (students > 0 && list.skillIds.length > 0 && !building.has(list.id)) { after.current = done ?? null; setAsking(a); return }
    write(a, false)
    done?.(false)
  }
  const answer = (asNewList: boolean) => {
    const a = asking
    setAsking(null)
    if (!a || !list) return
    if (askOnce && !asNewList) building.add(list.id)
    write(a, asNewList)
    after.current?.(asNewList)
    after.current = null
  }
  const scopeDialog = <SaveScopeDialog open={!!asking} listName={list?.name ?? ""} students={students} onCancel={() => setAsking(null)} onUpdate={() => answer(false)} onSaveNew={() => answer(true)} />
  return { list, onList, active, offered, offeredIds, others, stage, known, commit, scopeDialog, asking: !!asking }
}

/** The lines that were not read, with their text and why [REQ IM-08], behind one Show. */
function NoticeLine({ notice, children }: { notice: Notice; children?: React.ReactNode }) {
  const [open, setOpen] = React.useState(false)
  React.useEffect(() => setOpen(false), [notice])
  return (
    <div className="flex flex-col gap-1" data-add-notice>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <p className={TYPE.helper} role="status">{notice.text}</p>
        {notice.unread.length ? <Button type="button" variant="link" size="sm" className="h-auto p-0" aria-expanded={open} onClick={() => setOpen((o) => !o)} aria-label={open ? "Hide lines not read" : "Show lines not read"} data-add-unread-toggle>{open ? "Hide" : "Show"}</Button> : null}
        {children}
      </div>
      {open ? (
        <ul className="flex flex-col gap-0.5 text-sm text-muted-foreground" aria-label="Lines not read" data-add-unread>
          {notice.unread.map((l) => <li key={l.line} className="break-words">{`Line ${l.line}: "${l.raw.trim()}" (${notReadReason(l)})`}</li>)}
        </ul>
      ) : null}
    </div>
  )
}

/** The two rare ways in, in one quiet menu: a file, and another list's skills (D-X17: a copy is always asked for). */
function MoreWays({ others, onFile, onCopy, busy, layer }: { others: readonly SkillList[]; onFile: (f: File) => void; onCopy: (l: SkillList) => void; busy: boolean; layer?: string }) {
  const input = React.useRef<HTMLInputElement>(null)
  return (
    <>
      <input ref={input} type="file" accept={ACCEPT} className="sr-only" tabIndex={-1} aria-hidden="true" data-add-file-input onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; if (f) onFile(f) }} />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button type="button" variant="outline" size="icon" className="shrink-0" aria-label={`More ways to add ${skillNounPlural()}`} disabled={busy} data-add-more {...railTriggerProps()}>
            <i className="fa-light fa-ellipsis" aria-hidden="true" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className={`${layer ?? ""} max-h-80 w-72 overflow-y-auto`} {...railTriggerProps()}>
          <DropdownMenuItem onSelect={() => input.current?.click()} data-add-upload>Upload a file</DropdownMenuItem>
          {others.length ? (
            <>
              <DropdownMenuSeparator />
              {/* One level: a submenu inside a modal panel closes under the pointer, and a tap target two levels deep is slow on a phone. */}
              <DropdownMenuLabel data-add-copy>Copy from a list</DropdownMenuLabel>
              {others.map((l) => (
                <DropdownMenuItem key={l.id} onSelect={() => onCopy(l)} data-add-copy-list={l.id}>
                  <span className="min-w-0 flex-1 truncate">{l.name}</span>
                  <span className="text-xs tabular-nums text-muted-foreground">{fmt(l.skillIds.length)}</span>
                </DropdownMenuItem>
              ))}
            </>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  )
}

const matches = (r: Offered, q: string) => !q || r.name.toLowerCase().includes(q) || r.section.toLowerCase().includes(q)
const grouped = (rows: readonly Offered[]) => {
  const by = new Map<string, Offered[]>()
  for (const r of rows) by.set(r.section, [...(by.get(r.section) ?? []), r])
  return [...by]
}
const several = (text: string) => /\r?\n/.test(text.trim())
const PLACEHOLDER = () => `Search or type a new ${skillNoun()}`

/**
 * Variant F: a search-first picker in a panel. Tick, then one primary. Nothing reaches the list, and no skill is created, before "Add n skills" [REQ IM-05].
 */
export function QuickAddPanel({ api, open, onOpenChange }: { api: LibraryApi; open: boolean; onOpenChange: (o: boolean) => void }) {
  const core = useAddCore(api)
  const [query, setQuery] = React.useState("")
  const [picked, setPicked] = React.useState<Set<string>>(new Set())
  const [fresh, setFresh] = React.useState<string[]>([])
  const [notice, setNotice] = React.useState<Notice | null>(null)
  const [nothing, setNothing] = React.useState(false)
  const [busy, setBusy] = React.useState(false)
  const [guard, setGuard] = React.useState(false)
  const lastAdd = React.useRef(0)
  const search = React.useRef<HTMLInputElement>(null)
  React.useEffect(() => { if (open) { setQuery(""); setPicked(new Set()); setFresh([]); setNotice(null); setNothing(false) } }, [open])
  const q = React.useDeferredValue(query).trim().toLowerCase()
  const shown = React.useMemo(() => core.offered.filter((r) => matches(r, q)), [core.offered, q])
  const groups = React.useMemo(() => grouped(shown), [shown])
  const freshShown = fresh.filter((n) => !q || n.toLowerCase().includes(q))
  const chosen = React.useMemo(() => [...picked].filter((id) => core.offeredIds.has(id)), [picked, core.offeredIds])
  const total = chosen.length + fresh.length
  const state = pickState(shown.map((r) => r.id), picked)
  const typed = query.trim()
  const canCreate = !!typed && !core.known(typed) && !fresh.some((n) => normName(n) === normName(typed))
  const roving = useRovingChecks()
  const dirty = total > 0

  const take = (text: string, source: string | null) => {
    const s = core.stage(text, fresh)
    if (s.existing.length) setPicked((p) => pickAll(s.existing, p, true))
    if (s.fresh.length) setFresh((f) => [...f, ...s.fresh])
    setNotice(source ? stagedNotice(source, s) : typedNotice(text.trim(), s))
    setNothing(false)
    return s
  }
  const enter = () => {
    if (!typed) return
    take(typed, null)
    setQuery("")
  }
  const onFile = async (f: File) => {
    setBusy(true)
    const read = await readNames(f)
    setBusy(false)
    if (!read) { setNotice({ text: `${f.name} could not be read. Try a spreadsheet, a document or a text file.`, unread: [] }); return }
    const headings = read.headings ? ` ${fmt(read.headings)} ${read.headings === 1 ? "heading was" : "headings were"} left out.` : ""
    const s = core.stage(read.names, fresh)
    if (s.existing.length) setPicked((p) => pickAll(s.existing, p, true))
    if (s.fresh.length) setFresh((x) => [...x, ...s.fresh])
    const n = stagedNotice(`${fmt(read.lines)} ${read.lines === 1 ? "line" : "lines"} read from ${f.name}`, s)
    setNotice({ ...n, text: `${n.text}${headings}` })
    setNothing(false)
  }
  const onCopy = (l: SkillList) => {
    const ids = l.skillIds.filter((id) => core.offeredIds.has(id))
    const added = ids.filter((id) => !picked.has(id)).length
    if (ids.length) setPicked((p) => pickAll(ids, p, true))
    setNotice({ text: ids.length === 0 ? `Every ${skillNoun()} on ${l.name} is on this list already.` : `${countSkills(added)} selected from ${l.name}.`, unread: [] })
    setNothing(false)
  }
  const submit = () => {
    if (!open || Date.now() - lastAdd.current < 700) return
    if (total === 0) { setNothing(true); return }
    core.commit({ existingIds: chosen, names: fresh }, () => { lastAdd.current = Date.now(); onOpenChange(false) })
  }
  const leave = useLeaveGuard(open && dirty)
  const requestClose = () => (dirty ? setGuard(true) : onOpenChange(false))
  const discard = () => {
    setGuard(false)
    if (leave.asking) leave.go(() => onOpenChange(false))
    else onOpenChange(false)
  }

  return (
    <>
      <FloatingSheetPanel open={open} onOpenChange={(o) => (o ? onOpenChange(true) : requestClose())} modal>
        <FloatingSheetPanelContent
          contentSlot="lab-add-skills"
          side="right"
          size="md"
          aria-modal="true"
          onOpenAutoFocus={(e) => { e.preventDefault(); search.current?.focus() }}
          onCloseAutoFocus={(e) => { e.preventDefault(); focusSheetOpener() }}
        >
          <FloatingSheetPanelHeader title={`Add ${skillNounPlural()} to ${core.list?.name ?? "this list"}`} onClose={requestClose} />
          <form id="lab-quick-add-form" noValidate className="flex min-h-0 flex-1 flex-col" onSubmit={(e) => { e.preventDefault(); submit() }} data-quick-add>
            <FloatingSheetPanelBody className="flex flex-col px-4 pt-0 pb-4">
              <div className="sticky top-0 z-10 flex flex-col gap-3 bg-background pt-3 pb-3">
                <div className="flex items-center gap-2">
                  <Input
                    ref={search}
                    type="search"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); enter() } }}
                    onPaste={(e) => { const t = e.clipboardData.getData("text"); if (several(t)) { e.preventDefault(); take(t, `${fmt(t.split(/\r?\n/).filter((l) => l.trim()).length)} lines pasted`) } }}
                    className="min-w-0 flex-1"
                    aria-label={`${PLACEHOLDER()}, or paste a list`}
                    placeholder={PLACEHOLDER()}
                    data-add-search
                  />
                  <MoreWays others={core.others} onFile={onFile} onCopy={onCopy} busy={busy} layer={ABOVE_PANEL_MENU} />
                </div>
                <div className="flex min-h-6 items-center justify-between gap-3 px-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <Checkbox id="quick-add-all" checked={state.all ? true : state.some ? "indeterminate" : false} disabled={state.of === 0} onCheckedChange={() => setPicked((p) => pickAll(shown.map((r) => r.id), p, !state.all))} data-add-all />
                    <Label htmlFor="quick-add-all" className="font-normal">{q ? `Select all ${fmt(state.of)} matching` : "Select all"}</Label>
                  </div>
                  <span className="text-sm tabular-nums text-muted-foreground" role="status" aria-live="polite" data-add-picked={total}>{`${fmt(total)} selected`}</span>
                </div>
                {busy ? <p className={TYPE.helper} role="status">Reading the file</p> : notice ? <NoticeLine notice={notice} /> : null}
              </div>
              <ul className="flex flex-col rounded-[var(--radius)] border border-border" aria-label={`${skillNounPlural()} to add`} data-add-rows={shown.length} {...roving}>
                {freshShown.length ? <li className={GROUP} data-add-group="new">New</li> : null}
                {freshShown.map((name) => {
                  const id = `quick-add-new-${normName(name).replace(/[^a-z0-9]+/g, "-")}`
                  return (
                    <li key={`new-${name}`} className={ROW} data-add-new-row>
                      <Checkbox id={id} checked onCheckedChange={() => setFresh((f) => f.filter((n) => n !== name))} />
                      <Label htmlFor={id} className="min-w-0 flex-1 font-normal">{name}</Label>
                    </li>
                  )
                })}
                {groups.map(([name, list]) => (
                  <React.Fragment key={name}>
                    <li id={`quick-add-group-${name.replace(/[^a-z0-9]+/gi, "-")}`} className={GROUP} data-add-group={name}>{name}</li>
                    {list.map((r) => {
                      const id = `quick-add-${r.id}`
                      // The category label above the row is its description for a screen reader, since the list is flat.
                      const group = `quick-add-group-${name.replace(/[^a-z0-9]+/gi, "-")}`
                      return (
                        <li key={r.id} className={ROW}>
                          <Checkbox id={id} aria-describedby={group} checked={picked.has(r.id)} onCheckedChange={(v) => { setPicked((p) => pickAll([r.id], p, v === true)); setNothing(false) }} />
                          <Label htmlFor={id} className="min-w-0 flex-1 font-normal">{r.name}</Label>
                        </li>
                      )
                    })}
                  </React.Fragment>
                ))}
                {canCreate ? (
                  <li className="border-b border-border last:border-b-0">
                    <Button type="button" variant="ghost" size="default" className="h-auto min-h-11 w-full justify-start whitespace-normal px-3 text-start font-normal" onClick={() => { enter(); search.current?.focus() }} data-add-create>
                      {`Create "${typed}"`}
                    </Button>
                  </li>
                ) : null}
                {!shown.length && !freshShown.length && !canCreate ? (
                  <li className="px-3 py-3 text-sm text-muted-foreground" data-add-none>
                    {typed ? `No ${skillNounPlural()} match.` : `Every ${skillNoun()} in the library is on this list. Type a name to create one.`}
                  </li>
                ) : null}
              </ul>
            </FloatingSheetPanelBody>
            {nothing ? <p className="px-4 pb-2 text-sm text-destructive" role="alert" data-add-nothing>{`Choose ${skillNounPlural()} or type a new name.`}</p> : null}
            <FloatingSheetPanelWorkflowFooter onCancel={requestClose} primaryForm="lab-quick-add-form" primaryIconClassName="" primaryLabel={total ? `Add ${countSkills(total)}` : `Add ${skillNounPlural()}`} />
          </form>
        </FloatingSheetPanelContent>
      </FloatingSheetPanel>
      {core.scopeDialog}
      <DiscardChangesDialog open={guard || leave.asking} onKeep={() => { setGuard(false); leave.setAsking(false) }} onDiscard={discard} body={`No ${skillNounPlural()} have been added.`} />
    </>
  )
}

interface Batch extends Adding { notice: Notice }

/**
 * Variant G: adding happens on the list's own page. A search over what is not on the list yet, Add on each row, Add all for the result. Each press lands at once and the
 * page banner offers Undo. A paste, a file or a copy is offered as one line with its counts and goes on only when its own Add is pressed [REQ IM-05].
 */
export function InlineAdd({ api, onDone, canClose, tall }: { api: LibraryApi; onDone: () => void; /** There is a table to go back to. */ canClose: boolean; /** Nothing else is on the page, so the rows may take its height. */ tall?: boolean }) {
  const core = useAddCore(api, { askOnce: true })
  const [query, setQuery] = React.useState("")
  const [note, setNote] = React.useState<Notice | null>(null)
  const [batch, setBatch] = React.useState<Batch | null>(null)
  const [busy, setBusy] = React.useState(false)
  const search = React.useRef<HTMLInputElement>(null)
  // What was on the list when the region opened: a skill added here stays in its row, reading "Added", so the rows never move under the pointer.
  const [baseline] = React.useState(() => new Set(core.onList))
  const rows = React.useMemo(() => core.active.filter((r) => !baseline.has(r.id)), [core.active, baseline])
  const q = React.useDeferredValue(query).trim().toLowerCase()
  const shown = React.useMemo(() => rows.filter((r) => matches(r, q)), [rows, q])
  const left = shown.filter((r) => !core.onList.has(r.id))
  const typed = query.trim()
  const canCreate = !!typed && !core.known(typed)
  React.useEffect(() => { search.current?.focus({ preventScroll: true }) }, [])

  const add = (a: Adding, then?: () => void) => core.commit(a, (asNewList) => { then?.(); if (asNewList) onDone() })
  const enter = () => {
    if (!typed) return
    const s = core.stage(typed)
    setNote(typedNotice(typed, s))
    setBatch(null)
    if (s.fresh.length || s.existing.length) add({ existingIds: s.existing, names: s.fresh }, () => setQuery(""))
  }
  const offer = (source: string, s: Staged, tail = "") => {
    const n = stagedNotice(source, s)
    setNote(null)
    setBatch({ existingIds: s.existing, names: s.fresh, notice: { ...n, text: `${n.text}${tail}` } })
  }
  const onFile = async (f: File) => {
    setBusy(true)
    const read = await readNames(f)
    setBusy(false)
    if (!read) { setBatch(null); setNote({ text: `${f.name} could not be read. Try a spreadsheet, a document or a text file.`, unread: [] }); return }
    offer(`${fmt(read.lines)} ${read.lines === 1 ? "line" : "lines"} read from ${f.name}`, core.stage(read.names), read.headings ? ` ${fmt(read.headings)} ${read.headings === 1 ? "heading was" : "headings were"} left out.` : "")
  }
  const onCopy = (l: SkillList) => {
    const ids = l.skillIds.filter((id) => core.offeredIds.has(id))
    setNote(null)
    setBatch({ existingIds: ids, names: [], notice: { text: ids.length ? `${countSkills(ids.length)} on ${l.name} ${ids.length === 1 ? "is" : "are"} not on this list.` : `Every ${skillNoun()} on ${l.name} is on this list already.`, unread: [] } })
  }
  /** After a row's Add, its button is gone: focus moves to the next row's, or back to the box. */
  const focusNext = (from: HTMLElement) => {
    const all = [...document.querySelectorAll<HTMLElement>("[data-inline-add] [data-add-one]")]
    const next = all[all.indexOf(from) + 1] ?? all[all.indexOf(from) - 1]
    requestAnimationFrame(() => (next && next.isConnected ? next : search.current)?.focus())
  }
  const batchSize = batch ? batch.existingIds.length + batch.names.length : 0

  return (
    <section className="mb-4 flex flex-col gap-3" aria-label={`Add ${skillNounPlural()}`} data-inline-add>
      <div className="flex items-center gap-2">
        <Input
          ref={search}
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); enter() } }}
          onPaste={(e) => { const t = e.clipboardData.getData("text"); if (several(t)) { e.preventDefault(); offer(`${fmt(t.split(/\r?\n/).filter((l) => l.trim()).length)} lines pasted`, core.stage(t)) } }}
          className="min-w-0 flex-1"
          aria-label={`${PLACEHOLDER()}, or paste a list`}
          placeholder={PLACEHOLDER()}
          data-add-search
        />
        <MoreWays others={core.others} onFile={onFile} onCopy={onCopy} busy={busy} />
        {canClose ? <Button type="button" variant="outline" size="default" onClick={onDone} data-add-done>Done</Button> : null}
      </div>
      {busy ? <p className={TYPE.helper} role="status">Reading the file</p> : null}
      {!busy && batch ? (
        <NoticeLine notice={batch.notice}>
          {batchSize ? <Button type="button" variant="outline" size="sm" onClick={() => add(batch, () => setBatch(null))} data-add-batch>{`Add ${fmt(batchSize)}`}</Button> : null}
          <Button type="button" variant="ghost" size="sm" onClick={() => setBatch(null)} data-add-batch-dismiss>Dismiss</Button>
        </NoticeLine>
      ) : null}
      {!busy && !batch && note ? <NoticeLine notice={note} /> : null}
      <div className="flex min-h-8 items-center justify-between gap-3">
        {/* The number is on the button beside it, once. With one or none left to add there is no button, so the line carries it. */}
        <span className="text-sm tabular-nums text-muted-foreground" role="status" aria-live="polite" data-add-left={left.length}>
          {left.length > 1 ? (q ? "Matching, not on this list" : "Not on this list") : q ? `${fmt(left.length)} matching, not on this list` : `${fmt(left.length)} not on this list`}
        </span>
        {left.length > 1 ? <Button type="button" variant="outline" size="sm" onClick={() => add({ existingIds: left.map((r) => r.id), names: [] })} data-add-all>{`Add all ${fmt(left.length)}`}</Button> : null}
      </div>
      <ul className={`flex flex-col overflow-y-auto rounded-[var(--radius)] border border-border ${tall ? "max-h-[calc(100dvh-20rem)] min-h-40" : "max-h-72"}`} aria-label={`${skillNounPlural()} not on this list`} data-add-rows={shown.length}>
        {shown.map((r) => {
          const added = core.onList.has(r.id)
          return (
            <li key={r.id} className={ROW} data-add-row={r.id}>
              <span className="min-w-0 flex-1 text-sm">{r.name}</span>
              <span className="hidden w-56 shrink-0 truncate text-xs text-muted-foreground md:block">{r.section}</span>
              {added
                ? <span className="w-16 shrink-0 text-center text-sm text-muted-foreground" data-add-added>Added</span>
                : <Button type="button" variant="outline" size="sm" className="w-16 shrink-0" aria-label={`Add ${r.name}`} onClick={(e) => { const el = e.currentTarget; add({ existingIds: [r.id], names: [] }, () => focusNext(el)) }} data-add-one>Add</Button>}
            </li>
          )
        })}
        {canCreate ? (
          <li className={ROW} data-add-create-row>
            <span className="min-w-0 flex-1 break-words text-sm">{`Create "${typed}"`}</span>
            <Button type="button" variant="outline" size="sm" className="w-16 shrink-0" aria-label={`Create ${typed} and add it`} onClick={enter} data-add-create>Add</Button>
          </li>
        ) : null}
        {!shown.length && !canCreate ? (
          <li className="px-3 py-3 text-sm text-muted-foreground" data-add-none>
            {typed ? `No ${skillNounPlural()} match.` : `Every ${skillNoun()} in the library is on this list. Type a name to create one.`}
          </li>
        ) : null}
      </ul>
      {core.scopeDialog}
    </section>
  )
}
