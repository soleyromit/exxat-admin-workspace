"use client"

/**
 * Admin Skills library, option set 1 "Guided" (recommended). Template T1 list, with T4 split when a row is open.
 * Question: table with status tabs: can a coordinator find and bulk-configure 178 skills from one grouped table?
 * Regions: title zone (More menu, one filled "Add a skill") > one banner (result, or the not configured warning said once) >
 * status tabs that carry the counts, with search, filter, columns and view on the same row > DataTable grouped by category.
 * The bulk bar shows only on selection; a row opens its detail in a FloatingSheetPanel whose one primary is the next step.
 * Also renders Add a skill A (`startAdding`): the short add sheet open over this page.
 * Demo states: ?state=loading | empty | error. Record in the URL: ?skill=, tab in the URL: ?status=.
 */
import * as React from "react"
import { useLabRouter } from "@/components/lab/lab-bar/lab-link"
import { configureHref, countLibrary, filterLibrary, rowsForTab, type LibraryRow, type SkillDraft } from "@/lib/lab/library"
import { LibraryFrame, LibraryTabs, useOpenSkill, useStatusTab } from "@/components/lab/library/library-chrome"
import { LibraryTable } from "@/components/lab/library/library-table"
import { SkillPanel } from "@/components/lab/library/skill-panel"
import { SkillSheet } from "@/components/lab/library/skill-sheet"
import { AddSeveralSheet } from "@/components/lab/library/add-several-sheet"
import { useLifecycle, useStableHandlers } from "@/components/lab/library/row-actions"
import { useLibrary } from "@/components/lab/library/use-library"
import { useLibraryFilter } from "@/components/lab/library/library-filter"

export function SkillsLibraryTablePage({ startAdding = false }: { startAdding?: boolean }) {
  const api = useLibrary()
  const router = useLabRouter()
  const life = useLifecycle(api)
  const [tab, setTab] = useStatusTab()
  const [openId, setOpenId] = useOpenSkill()
  const [adding, setAdding] = React.useState(false)
  const [addingSeveral, setAddingSeveral] = React.useState(false)
  const [editing, setEditing] = React.useState<LibraryRow | null>(null)
  const [inView, setInView] = React.useState<LibraryRow[]>([])
  const opened = React.useRef(false)
  React.useEffect(() => {
    if (startAdding && api.hydrated && !opened.current) { opened.current = true; setAdding(true) }
  }, [startAdding, api.hydrated])

  const handlers = useStableHandlers(api, life, setEditing)
  const visible = React.useMemo(() => rowsForTab(api.rows, tab), [api.rows, tab])
  // The tabs count what the category and tag filter leaves, so a tab's number equals the rows under it.
  const [filter] = useLibraryFilter()
  const tabCounts = React.useMemo(() => countLibrary(filterLibrary(api.rows, filter)), [api.rows, filter])
  const openRow = openId ? api.byId.get(openId) ?? null : null
  const open = React.useCallback((id: string) => { setAdding(false); setAddingSeveral(false); setOpenId(id) }, [setOpenId])

  const save = (d: SkillDraft, next: "close" | "configure") => {
    const id = api.add(d)
    if (next === "configure") router.push(configureHref(id))
  }

  const overlays = (
    <>
      {/* The phase 1 bulk add opens in place, so "Add several by name" never routes into the phase 2 import. */}
      <AddSeveralSheet open={addingSeveral} onOpenChange={setAddingSeveral} rows={api.rows} onAdd={(items, d) => api.addMany(items, d)} />
      <SkillSheet open={adding} onOpenChange={setAdding} rows={api.rows} onSave={save} onOpenExisting={open} />
      <SkillSheet open={!!editing} onOpenChange={(o) => !o && setEditing(null)} rows={api.rows} mode="edit" editing={editing} onSave={(d) => editing && api.edit(editing.id, d)} />
      <SkillPanel row={adding || addingSeveral ? null : openRow} rows={inView.length ? inView : visible} handlers={handlers} onOpen={open} onClose={() => setOpenId(null)} />
      {life.dialogs}
    </>
  )

  return (
    <LibraryFrame
      api={api}
      tab={tab}
      onAdd={() => { setOpenId(null); setAddingSeveral(false); setAdding(true) }}
      onAddSeveral={() => { setOpenId(null); setAdding(false); setAddingSeveral(true) }}
      primaryElsewhere={adding || addingSeveral || !!openRow}
      overlays={overlays}
      pageType={adding || addingSeveral || openRow ? "split" : "list"}
    >
      <div data-library-lab="A">
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
            <LibraryTabs counts={tabCounts} value={tab} onChange={setTab} toolbar={toolbar}>
              {table}
            </LibraryTabs>
          )}
        />
      </div>
    </LibraryFrame>
  )
}

export function AdminSkillsLibraryA() {
  return <SkillsLibraryTablePage />
}
