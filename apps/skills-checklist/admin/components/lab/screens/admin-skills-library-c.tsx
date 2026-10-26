"use client"

/**
 * Admin Skills library, option set 3 "Many at once": a setup board by configuration status (Not configured, Configured,
 * Published, Inactive) on DS Card columns, with a Board or List switch (List is the set 1 table with its status tabs).
 * Question: does seeing the setup pipeline as columns beat a flat list for working through a part-configured library?
 * Same frame as sets 1 and 2 (title zone, one banner). On the board the column headers carry the counts, so there are no
 * tabs and no KPI strip; the toolbar is one row (Board or List, search, category). "Configure {n} together" sits on the
 * Not configured column only. A card opens the skill's detail panel. Cards do not drag: a status changes through Configure
 * or Deactivate, never by dropping a card. Add a skill C renders this page with the "Add several" sheet open (`startAdding`).
 * Demo states: ?state=loading | empty | error.
 */
import * as React from "react"
import { useConfigureMany } from "@/components/lab/library/configure-many"
import { useLabRouter } from "@/components/lab/lab-bar/lab-link"
import { LabLink as Link } from "@/components/lab/lab-bar/lab-link"
import { Badge } from "@exxatdesignux/ui/components/ui/badge"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@exxatdesignux/ui/components/ui/card"
import { Input } from "@exxatdesignux/ui/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@exxatdesignux/ui/components/ui/select"
import { ViewSegmentedControl } from "@exxatdesignux/ui/components/ui/view-segmented-control"
import { railTriggerProps } from "@exxatdesignux/ui/components/ui/floating-sheet-panel"
import { STATUS_META, STATUS_ORDER, byStatus, configureHref, rowsForTab, type LibraryRow, type LibraryStatus, type SkillDraft } from "@/lib/lab/library"
import { capitalize, countSkills, skillNoun, skillNounPlural } from "@/lib/lab/terms"
import { plural } from "@/lib/v2/format"
import { EmptyBlock } from "@/components/lab/empty-block"
import { LINK, LibraryFrame, LibraryStatusBadge, LibraryTabs, useOpenSkill, useStatusTab, useUrlParam } from "@/components/lab/library/library-chrome"
import { LibraryTable } from "@/components/lab/library/library-table"
import { AddSeveralSheet } from "@/components/lab/library/add-several-sheet"
import { useLifecycle, useStableHandlers } from "@/components/lab/library/row-actions"
import { SkillPanel } from "@/components/lab/library/skill-panel"
import { SkillSheet } from "@/components/lab/library/skill-sheet"
import { useLibrary } from "@/components/lab/library/use-library"

const PAGE = 30
const ALL = "__all"

/** A board card: name (opens the detail panel), category, one or two facts. */
function SkillCard({ r, onOpen, selected }: { r: LibraryRow; onOpen: (id: string) => void; selected: boolean }) {
  return (
    <li className={`flex flex-col gap-1 rounded-md border bg-background p-3 ${selected ? "border-ring" : "border-border"}`}>
      <span className="flex min-w-0 items-start justify-between gap-2">
        <Link
          className={`${LINK} line-clamp-2`}
          href={`?skill=${encodeURIComponent(r.id)}`}
          scroll={false}
          {...railTriggerProps()}
          onClick={(e) => { e.preventDefault(); onOpen(r.id) }}
        >
          {r.name}
        </Link>
        {r.isNew ? <Badge variant="outline">New</Badge> : null}
      </span>
      <span className="truncate text-xs text-muted-foreground">
        {[r.section, r.status === "published" && r.courses ? plural(r.courses, "course", "courses") : "", r.evidence ? plural(r.evidence, "evaluation", "evaluations") : ""].filter(Boolean).join(", ")}
      </span>
    </li>
  )
}

function Column({ status, rows, filtered, openId, onOpen }: { status: LibraryStatus; rows: LibraryRow[]; filtered: boolean; openId: string | null; onOpen: (id: string) => void }) {
  const [shown, setShown] = React.useState(PAGE)
  React.useEffect(() => setShown(PAGE), [rows.length])
  const m = STATUS_META[status]
  const visible = rows.slice(0, shown)
  const configureMany = useConfigureMany()
  const together = status === "not-configured" && rows.length > 1
  const many = configureMany(rows.map((r) => r.id))
  return (
    <Card size="sm" data-board-column={status} className="min-w-0">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <LibraryStatusBadge status={status} />
          <span className="tabular-nums text-sm font-semibold text-foreground">{rows.length}</span>
          <span className="sr-only">{m.label}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {together ? (
          <Button asChild variant="outline" size="sm" className="w-full">
            <Link href={many.href}>{many.label}</Link>
          </Button>
        ) : null}
        {rows.length === 0 ? (
          <EmptyBlock compact title={filtered ? `No ${skillNounPlural()} match this search` : `No ${skillNounPlural()} here`} />
        ) : (
          <div className="max-h-[34rem] overflow-y-auto rounded-sm pe-1 outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring" tabIndex={0} role="region" aria-label={`${m.label}, ${countSkills(rows.length)}`}>
            <ul className="flex flex-col gap-2">{visible.map((r) => <SkillCard key={r.id} r={r} onOpen={onOpen} selected={r.id === openId} />)}</ul>
            {rows.length > shown ? (
              <Button type="button" variant="ghost" size="sm" className="mt-2 w-full" onClick={() => setShown((n) => n + PAGE * 2)}>{`Show ${Math.min(PAGE * 2, rows.length - shown)} more of ${rows.length - shown}`}</Button>
            ) : null}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export function SkillsLibraryBoardPage({ startAdding = false }: { startAdding?: boolean }) {
  const api = useLibrary()
  const router = useLabRouter()
  const life = useLifecycle(api)
  const [viewParam, setView] = useUrlParam("view")
  const view: "board" | "list" = viewParam === "list" ? "list" : "board"
  const [tab, setTab] = useStatusTab()
  const [openId, setOpenId] = useOpenSkill()
  const [q, setQ] = React.useState("")
  const [section, setSection] = React.useState(ALL)
  const [adding, setAdding] = React.useState(false)
  const [addingSeveral, setAddingSeveral] = React.useState(false)
  const [editing, setEditing] = React.useState<LibraryRow | null>(null)
  const [inView, setInView] = React.useState<LibraryRow[]>([])
  const handlers = useStableHandlers(api, life, setEditing)
  const started = React.useRef(false)
  React.useEffect(() => {
    if (startAdding && api.hydrated && !started.current) { started.current = true; setAddingSeveral(true) }
  }, [startAdding, api.hydrated])

  const sections = React.useMemo(() => [...new Set(api.rows.map((r) => r.section))].sort((a, b) => a.localeCompare(b)), [api.rows])
  const query = q.trim().toLowerCase()
  const filtered = React.useMemo(() => api.rows.filter((r) => (section === ALL || r.section === section) && (!query || r.name.toLowerCase().includes(query))), [api.rows, section, query])
  const columns = React.useMemo(() => byStatus(filtered), [filtered])
  const boardOrder = React.useMemo(() => STATUS_ORDER.flatMap((s) => columns[s]), [columns])
  const visible = React.useMemo(() => rowsForTab(api.rows, tab), [api.rows, tab])
  const openRow = openId ? api.byId.get(openId) ?? null : null
  const open = React.useCallback((id: string) => { setAdding(false); setAddingSeveral(false); setOpenId(id) }, [setOpenId])

  const save = (d: SkillDraft, next: "close" | "configure") => {
    const id = api.add(d)
    if (next === "configure") router.push(configureHref(id))
  }
  const overlays = (
    <>
      <AddSeveralSheet open={addingSeveral} onOpenChange={setAddingSeveral} rows={api.rows} onAdd={(names, cat) => api.addMany(names, cat)} />
      <SkillSheet open={adding} onOpenChange={setAdding} rows={api.rows} onSave={save} onOpenExisting={open} />
      <SkillSheet open={!!editing} onOpenChange={(o) => !o && setEditing(null)} rows={api.rows} mode="edit" editing={editing} onSave={(d) => editing && api.edit(editing.id, d)} />
      <SkillPanel row={adding || addingSeveral ? null : openRow} rows={view === "board" ? boardOrder : inView.length ? inView : visible} handlers={handlers} onOpen={open} onClose={() => setOpenId(null)} />
      {life.dialogs}
    </>
  )

  const viewSwitch = (
    <ViewSegmentedControl
      value={view}
      onValueChange={(v) => setView(v === "list" ? "list" : null)}
      aria-label="Show as"
      options={[{ value: "board", label: "Board", icon: "fa-square-kanban" }, { value: "list", label: "List", icon: "fa-list" }]}
    />
  )

  return (
    <LibraryFrame
      api={api}
      tab={view === "list" ? tab : undefined}
      onAdd={() => { setOpenId(null); setAddingSeveral(false); setAdding(true) }}
      onAddSeveral={() => { setOpenId(null); setAdding(false); setAddingSeveral(true) }}
      primaryElsewhere={adding || addingSeveral || !!openRow}
      overlays={overlays}
      pageType={adding || addingSeveral || openRow ? "split" : "list"}
    >
      <div className="flex flex-col gap-3" data-library-lab="C">
        {view === "board" ? (
          <>
            <div className="flex flex-wrap items-center gap-2" data-library-toolbar>
              {viewSwitch}
              <Input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={`Search ${skillNounPlural()}`} aria-label={`Search ${skillNoun()} names`} className="h-8 w-60" />
              <Select value={section} onValueChange={setSection}>
                <SelectTrigger size="sm" className="w-56" aria-label="Category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-72">
                  <SelectItem value={ALL}>All categories</SelectItem>
                  {sections.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {/* One board answers one question (where each skill is in setup), so it is one region, like a table. */}
            <div data-region="board" role="group" aria-label={`${capitalize(skillNounPlural())} by configuration status`} className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
              {STATUS_ORDER.map((s) => <Column key={s} status={s} rows={columns[s]} filtered={section !== ALL || !!query} openId={openRow?.id ?? null} onOpen={open} />)}
            </div>
          </>
        ) : (
          <LibraryTable
            rows={api.rows}
            visible={visible}
            tab={tab}
            handlers={handlers}
            openId={openRow ? openRow.id : null}
            onOpen={open}
            onCopySettings={(rows) => life.copy(rows)}
            onClearTab={() => setTab("all")}
            onRowsInView={setInView}
            renderFrame={(toolbar, table) => (
              <LibraryTabs counts={api.counts} value={tab} onChange={setTab} toolbar={<>{viewSwitch}{toolbar}</>}>
                {table}
              </LibraryTabs>
            )}
          />
        )}
      </div>
    </LibraryFrame>
  )
}

export function AdminSkillsLibraryC() {
  return <SkillsLibraryBoardPage />
}
