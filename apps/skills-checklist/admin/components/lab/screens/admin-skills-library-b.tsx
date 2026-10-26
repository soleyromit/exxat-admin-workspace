"use client"

/**
 * Admin Skills library, option set 2 "One page": the program's own categories as a tree (Category > Group > Skill) with
 * roll-ups ("21 of 25 configured", amber "4 not configured"), in one DS Table. Template T1, with T4 split when a skill is open.
 * Question: category tree with a peek panel: do the program's own categories with roll-ups make setup progress easier to
 * work through?
 * Same frame as set 1: title zone, one banner, status tabs with counts and the toolbar on the tab row (search, and one
 * menu for sort and expand or collapse all).
 * One menu per category ("Configure the n not configured", "Add a skill here"); no per-category buttons.
 * Add a skill in this set is the inline row at the end of a category (Add a skill B renders it open: `startAdding`).
 * Demo states: ?state=loading | empty | error.
 */
import * as React from "react"
import { useConfigureMany } from "@/components/lab/library/configure-many"
import { LabLink as Link } from "@/components/lab/lab-bar/lab-link"
import { Badge } from "@exxatdesignux/ui/components/ui/badge"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import { Input } from "@exxatdesignux/ui/components/ui/input"
import { StatusBadge } from "@exxatdesignux/ui/components/ui/status-badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@exxatdesignux/ui/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@exxatdesignux/ui/components/ui/dropdown-menu"
import { railTriggerProps } from "@exxatdesignux/ui/components/ui/floating-sheet-panel"
import { buildTree, rollupLabel, rowsForTab, type LibraryCounts, type LibraryRow, type SkillDraft } from "@/lib/lab/library"
import { aNoun, capitalize, countSkills, skillNoun, skillNounPlural } from "@/lib/lab/terms"
import { plural } from "@/lib/v2/format"
import { EmptyBlock } from "@/components/lab/empty-block"
import { LINK, LibraryFrame, LibraryStatusBadge, LibraryTabs, useOpenSkill, useStatusTab } from "@/components/lab/library/library-chrome"
import { InlineAddRow, InlineAddTrigger } from "@/components/lab/library/inline-add-row"
import { RowActions, useLifecycle, useStableHandlers, type RowActionHandlers } from "@/components/lab/library/row-actions"
import { SkillPanel } from "@/components/lab/library/skill-panel"
import { SkillSheet } from "@/components/lab/library/skill-sheet"
import { AddSeveralSheet } from "@/components/lab/library/add-several-sheet"
import { useLibrary } from "@/components/lab/library/use-library"

const COLS = 6

function Rollup({ c }: { c: LibraryCounts }) {
  return (
    <span className="flex flex-wrap items-center gap-2 text-sm font-normal text-muted-foreground">
      <span className="tabular-nums">{rollupLabel(c)}</span>
      {c.notConfigured ? <StatusBadge label={`${c.notConfigured} not configured`} tone="warning" icon="fa-triangle-exclamation" size="sm" /> : null}
    </span>
  )
}

function Chevron({ open }: { open: boolean }) {
  return <i className={`fa-light ${open ? "fa-chevron-down" : "fa-chevron-right"} w-3 text-xs`} aria-hidden="true" />
}

function SkillRow({ r, handlers, indent, onOpen, selected }: { r: LibraryRow; handlers: RowActionHandlers; indent: boolean; onOpen: (id: string) => void; selected: boolean }) {
  return (
    <TableRow data-state={selected ? "selected" : undefined}>
      <TableCell className={indent ? "ps-14" : "ps-9"}>
        <span className="flex min-w-0 items-center gap-2">
          <Link
            className={`${LINK} truncate`}
            href={`?skill=${encodeURIComponent(r.id)}`}
            scroll={false}
            {...railTriggerProps()}
            onClick={(e) => { e.preventDefault(); onOpen(r.id) }}
          >
            {r.name}
          </Link>
          {r.isNew ? <Badge variant="outline">New</Badge> : null}
        </span>
      </TableCell>
      <TableCell><LibraryStatusBadge status={r.status} /></TableCell>
      <TableCell className="hidden xl:table-cell">{r.modelLabel || <span className="text-muted-foreground">Not chosen</span>}</TableCell>
      <TableCell className="tabular-nums">{r.status === "not-configured" || r.status === "inactive" ? <span className="text-muted-foreground">None</span> : r.courses ? plural(r.courses, "course", "courses") : <span className="text-muted-foreground">Not mapped</span>}</TableCell>
      <TableCell className="hidden tabular-nums xl:table-cell">{r.evidence ? r.evidence.toLocaleString("en-US") : <span className="text-muted-foreground">None</span>}</TableCell>
      <TableCell className="text-end"><RowActions row={r} handlers={handlers} /></TableCell>
    </TableRow>
  )
}

type Sort = "library" | "setup"

export function SkillsLibraryTreePage({ startAdding = false }: { startAdding?: boolean }) {
  const configureMany = useConfigureMany()
  const api = useLibrary()
  const life = useLifecycle(api)
  const [tab, setTab] = useStatusTab()
  const [openId, setOpenId] = useOpenSkill()
  const [q, setQ] = React.useState("")
  const [sort, setSort] = React.useState<Sort>("library")
  const [addingIn, setAddingIn] = React.useState<string | null>(null)
  const [addingSeveral, setAddingSeveral] = React.useState(false)
  const [editing, setEditing] = React.useState<LibraryRow | null>(null)
  const handlers = useStableHandlers(api, life, setEditing)

  const query = q.trim().toLowerCase()
  const filtered = React.useMemo(() => rowsForTab(api.rows, tab).filter((r) => !query || r.name.toLowerCase().includes(query)), [api.rows, tab, query])
  const tree = React.useMemo(() => {
    const t = buildTree(filtered)
    return sort === "setup" ? [...t].sort((a, b) => b.counts.notConfigured - a.counts.notConfigured) : t
  }, [filtered, sort])
  const [open, setOpen] = React.useState<string[]>([])
  const [groupOpen, setGroupOpen] = React.useState<Record<string, boolean>>({})
  const seeded = React.useRef(false)
  React.useEffect(() => {
    // First load opens the categories that still need setup; a search or a tab opens every match.
    if (!seeded.current && tree.length) { seeded.current = true; setOpen(tree.filter((s) => s.counts.notConfigured > 0).map((s) => s.key)) }
  }, [tree])
  React.useEffect(() => { if (query || tab !== "all") { setOpen(tree.map((s) => s.key)); setGroupOpen({}) } }, [query, tab, tree])
  // Add a skill B: the inline row opens in the first category that still needs setup.
  const started = React.useRef(false)
  React.useEffect(() => {
    if (!startAdding || started.current || !tree.length) return
    started.current = true
    const first = tree.find((s) => s.counts.notConfigured > 0) ?? tree[0]!
    setOpen((o) => (o.includes(first.key) ? o : [...o, first.key]))
    setAddingIn(first.name)
  }, [startAdding, tree])

  const allOpen = tree.length > 0 && tree.every((s) => open.includes(s.key))
  const toggle = (key: string) => setOpen((o) => (o.includes(key) ? o.filter((k) => k !== key) : [...o, key]))
  const addIn = (s: { key: string; name: string }) => { setOpenId(null); setOpen((o) => (o.includes(s.key) ? o : [...o, s.key])); setAddingIn(s.name) }
  const flat = React.useMemo(() => tree.flatMap((s) => (open.includes(s.key) ? [...s.rows, ...s.groups.flatMap((g) => g.rows)] : [])), [tree, open])
  const openRow = openId ? api.byId.get(openId) ?? null : null
  const openSkill = React.useCallback((id: string) => { setAddingIn(null); setOpenId(id) }, [setOpenId])

  const overlays = (
    <>
      {/* The phase 1 bulk add opens in place, so "Add several by name" never routes into the phase 2 import. */}
      <AddSeveralSheet open={addingSeveral} onOpenChange={setAddingSeveral} rows={api.rows} onAdd={(names, cat) => api.addMany(names, cat)} />
      <SkillSheet open={!!editing} onOpenChange={(o) => !o && setEditing(null)} rows={api.rows} mode="edit" editing={editing} onSave={(d) => editing && api.edit(editing.id, d)} />
      <SkillPanel row={addingSeveral ? null : openRow} rows={flat} handlers={handlers} onOpen={openSkill} onClose={() => setOpenId(null)} />
      {life.dialogs}
    </>
  )

  const toolbar = (
    <>
      <Input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={`Search ${skillNounPlural()}`} aria-label={`Search ${skillNoun()} names`} className="h-8 w-56" />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button type="button" variant="ghost" size="sm" aria-label={`Sort: ${sort === "setup" ? "Most to set up first" : "Library order"}`}>
            {sort === "setup" ? "Most to set up first" : "Library order"}
            <i className="fa-light fa-chevron-down text-xs" aria-hidden="true" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">Sort categories</DropdownMenuLabel>
          <DropdownMenuRadioGroup value={sort} onValueChange={(v) => setSort(v as Sort)}>
            <DropdownMenuRadioItem value="library">Library order</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="setup">Most to set up first</DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => setOpen(allOpen ? [] : tree.map((s) => s.key))}>{allOpen ? "Collapse all categories" : "Expand all categories"}</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  )

  return (
    <LibraryFrame
      api={api}
      tab={tab}
      onAdd={() => { const first = tree.find((s) => open.includes(s.key)) ?? tree[0]; if (first) addIn(first) }}
      onAddSeveral={() => { setOpenId(null); setAddingIn(null); setAddingSeveral(true) }}
      primaryElsewhere={!!addingIn || addingSeveral || !!openRow}
      overlays={overlays}
      pageType={addingSeveral || openRow ? "split" : "list"}
    >
      <div data-library-lab="B">
        <LibraryTabs counts={api.counts} value={tab} onChange={setTab} toolbar={toolbar}>
          {tree.length === 0 ? (
            <EmptyBlock title={`No ${skillNounPlural()} match this search`} action={{ label: "Clear search" }} onAction={() => { setQ(""); setTab("all") }} />
          ) : (
            <div className="overflow-hidden rounded-lg border border-border">
              <Table aria-label={`${capitalize(skillNoun())} library by category, ${countSkills(filtered.length)}`}>
                <TableHeader>
                  <TableRow>
                    <TableHead>{capitalize(skillNoun())}</TableHead>
                    <TableHead className="w-40">Status</TableHead>
                    <TableHead className="hidden w-48 xl:table-cell">{"How it's judged"}</TableHead>
                    <TableHead className="w-32">Courses</TableHead>
                    <TableHead className="hidden w-32 xl:table-cell">Evaluations</TableHead>
                    <TableHead className="w-12"><span className="sr-only">Actions</span></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tree.map((s) => {
                    const isOpen = open.includes(s.key)
                    const toConfigure = [...s.rows, ...s.groups.flatMap((g) => g.rows)].filter((r) => r.status === "not-configured")
                    return (
                      <React.Fragment key={s.key}>
                        <TableRow className="bg-muted/40 hover:bg-muted/40">
                          <TableCell colSpan={COLS - 1}>
                            <span className="flex flex-wrap items-center gap-x-4 gap-y-1">
                              <Button type="button" variant="ghost" size="sm" aria-expanded={isOpen} onClick={() => toggle(s.key)} className="h-auto gap-2 px-1 py-1 text-sm font-semibold text-foreground">
                                <Chevron open={isOpen} />
                                {s.name}
                              </Button>
                              <Rollup c={s.counts} />
                            </span>
                          </TableCell>
                          <TableCell className="text-end">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button type="button" variant="ghost" size="icon-sm" aria-label={`Actions for ${s.name}`}>
                                  <i className="fa-light fa-ellipsis" aria-hidden="true" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-64">
                                {toConfigure.length ? (
                                  <DropdownMenuItem asChild>
                                    <Link href={configureMany(toConfigure.map((r) => r.id)).href}>{configureMany(toConfigure.map((r) => r.id)).many ? `Configure the ${toConfigure.length} not configured` : configureMany(toConfigure.map((r) => r.id)).label}</Link>
                                  </DropdownMenuItem>
                                ) : null}
                                <DropdownMenuItem onSelect={() => addIn(s)}>{`Add ${aNoun()} here`}</DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                        {/* The open add row sits right under its category header, where the reader asked for it. */}
                        {isOpen && addingIn === s.name ? (
                          <InlineAddRow category={s.name} colSpan={COLS} names={api.names} onAdd={(d: SkillDraft) => api.add(d)} onClose={() => setAddingIn(null)} />
                        ) : null}
                        {isOpen ? s.rows.map((r) => <SkillRow key={r.id} r={r} handlers={handlers} indent={false} onOpen={openSkill} selected={r.id === openRow?.id} />) : null}
                        {isOpen ? s.groups.map((g) => {
                          const gKey = `${s.key}/${g.key}`
                          const gOpen = groupOpen[gKey] ?? (!!query || tab !== "all" || g.counts.notConfigured > 0)
                          return (
                            <React.Fragment key={gKey}>
                              <TableRow>
                                <TableCell colSpan={COLS} className="ps-7">
                                  <span className="flex flex-wrap items-center gap-x-4 gap-y-1">
                                    <Button type="button" variant="ghost" size="sm" aria-expanded={gOpen} onClick={() => setGroupOpen((m) => ({ ...m, [gKey]: !gOpen }))} className="h-auto gap-2 px-1 py-1 font-medium text-foreground">
                                      <Chevron open={gOpen} />
                                      {g.name}
                                    </Button>
                                    <Rollup c={g.counts} />
                                  </span>
                                </TableCell>
                              </TableRow>
                              {gOpen ? g.rows.map((r) => <SkillRow key={r.id} r={r} handlers={handlers} indent onOpen={openSkill} selected={r.id === openRow?.id} />) : null}
                            </React.Fragment>
                          )
                        }) : null}
                        {isOpen && addingIn !== s.name ? <InlineAddTrigger category={s.name} colSpan={COLS} onOpen={() => addIn(s)} /> : null}
                      </React.Fragment>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </LibraryTabs>
      </div>
    </LibraryFrame>
  )
}

export function AdminSkillsLibraryB() {
  return <SkillsLibraryTreePage />
}
