"use client"

/**
 * Admin Skills library, option set 1 "Guided" (recommended). Template T1 list, with T4 split when a row is open.
 * Question: table with status tabs: can a coordinator find and bulk-configure 178 skills from one grouped table?
 * Regions: title zone (More menu, one filled "Add a skill") > one banner (result, or the not configured warning said once) >
 * status tabs that carry the counts, with search, filter, columns and view on the same row > DataTable grouped by category.
 * The bulk bar shows only on selection; a row opens the one edit panel, a FloatingSheetPanel (map D1a).
 * Also renders Add a skill A (`startAdding`) and Add several (`startAdding="several"`): the sheet open over this page, so the table behind is the
 * same at every stop (Sankalp 2026-11-04).
 * Demo states: ?state=loading | empty | error. Record in the URL: ?skill=, tab in the URL: ?status=.
 */
import * as React from "react"
import { doneRestoringScroll, rememberOrigin, takeReturn } from "@/lib/lab/configure-origin"
import { useSearchParams } from "next/navigation"
import { useLabRouter } from "@/components/lab/lab-bar/lab-link"
import { ConfigureLoading, configureSkillHref } from "@/components/lab/configure/shell"
import { pageTitle } from "@/components/lab/shared/focus"
import { rowsForTab, type LibraryRow } from "@/lib/lab/library"
import { LibraryFrame, LibraryTabs, useOpenSkill, useStatusTab } from "@/components/lab/library/library-chrome"
import { LibraryTable } from "@/components/lab/library/library-table"
import { SkillPanel, usePanelGuard } from "@/components/lab/library/skill-panel"
import { SkillSheet } from "@/components/lab/library/skill-sheet"
import { AddSeveralSheet } from "@/components/lab/library/add-several-sheet"
import { useLifecycle, useStableHandlers } from "@/components/lab/library/row-actions"
import { useLibrary } from "@/components/lab/library/use-library"
import { useEmbeddedStep } from "@/components/lab/layout/embedded"
import type { LibraryCounts } from "@/lib/lab/library"

/** Hold the Library's scrollport at `top` until it has stayed there, then let go. A wheel, a touch or a key is the admin taking over. */
function restoreLibraryScroll(top: number) {
  if (top <= 0) { doneRestoringScroll(); return }
  let frame = 0
  let steady = 0
  const started = performance.now()
  const stop = () => {
    cancelAnimationFrame(frame)
    doneRestoringScroll()
    for (const t of ["wheel", "touchstart", "keydown"]) window.removeEventListener(t, stop, true)
  }
  for (const t of ["wheel", "touchstart", "keydown"]) window.addEventListener(t, stop, true)
  const tick = () => {
    const port = document.querySelector<HTMLElement>("[data-page-scroll]")
    if (port) {
      if (Math.abs(port.scrollTop - top) <= 1) steady += 1
      else { steady = 0; port.scrollTop = top }
    }
    if (steady >= 20 || performance.now() - started > 3000) stop()
    else frame = requestAnimationFrame(tick)
  }
  frame = requestAnimationFrame(tick)
}

/** An older link that asked for the panel's Evaluation tab: straight to the skill's page (D-L115), with nothing of the Library drawn first. */
function OldSectionLink({ skillId }: { skillId: string }) {
  const router = useLabRouter()
  React.useEffect(() => {
    rememberOrigin(skillId)
    router.replace(configureSkillHref(skillId))
  }, [skillId]) // eslint-disable-line react-hooks/exhaustive-deps
  return <ConfigureLoading />
}

export function SkillsLibraryTablePage(props: { startAdding?: boolean | "several" }) {
  const params = useSearchParams()
  const skillId = params?.get("skill")
  if (params?.get("section") === "evaluation" && skillId) return <OldSectionLink skillId={skillId} />
  return <LibraryTablePage {...props} />
}

function LibraryTablePage({ startAdding = false }: { startAdding?: boolean | "several" }) {
  const api = useLibrary()
  const embedded = useEmbeddedStep() !== null
  const life = useLifecycle(api)
  const [tab, setTab] = useStatusTab()
  const [openId, setOpenId] = useOpenSkill()
  const [adding, setAdding] = React.useState(false)
  const [addingSeveral, setAddingSeveral] = React.useState(false)
  const [inView, setInView] = React.useState<LibraryRow[]>([])
  const opened = React.useRef(false)
  React.useEffect(() => {
    if (startAdding && api.hydrated && !opened.current) { opened.current = true; if (startAdding === "several") setAddingSeveral(true); else setAdding(true) }
  }, [startAdding, api.hydrated])

  // Back from the full page (map D1c): the scroll the admin left, and focus on Configure after a save. Read once the rows exist; the table lays out over a few frames, so it holds until the height allows it, and a scroll by the admin ends it.
  const [focusConfigure, setFocusConfigure] = React.useState<string | null>(null)
  const returnRead = React.useRef(false)
  React.useEffect(() => {
    if (!api.hydrated || returnRead.current) return
    returnRead.current = true
    const r = takeReturn()
    if (!r) return
    setFocusConfigure(r.focusConfigure)
    // Back by Cancel: nothing to return to on this page, so the title takes focus (never the body).
    if (!r.focusConfigure) requestAnimationFrame(() => pageTitle()?.focus({ preventScroll: true }))
    // Not this effect's cleanup: Strict Mode's second run would end it. It ends itself within seconds.
    restoreLibraryScroll(r.scrollTop)
  }, [api.hydrated])

  const visible = React.useMemo(() => rowsForTab(api.rows, tab), [api.rows, tab])
  const openRow = openId ? api.byId.get(openId) ?? null : null
  // A skill that is gone (deleted, or a bad link) leaves nothing in the URL and nothing half open.
  React.useEffect(() => { if (api.hydrated && !api.demo && openId && !openRow) setOpenId(null) }, [api.hydrated, api.demo, openId, openRow, setOpenId])
  // One guard for the panel: another row, previous and next, close and every link ask first while it has unsaved changes.
  const [panelDirty, setPanelDirty] = React.useState(false)
  const guard = usePanelGuard(panelDirty, () => setPanelDirty(false))
  const { attempt } = guard
  const open = React.useCallback((id: string) => attempt(() => { setAdding(false); setAddingSeveral(false); setOpenId(id) }), [attempt, setOpenId])
  const handlers = useStableHandlers(api, life, (r) => open(r.id), attempt)
  // One identity for the life of the page, as the table's other props, so opening the panel or typing in it does not render the rows (library-table.tsx).
  const panelDirtyRef = React.useRef(panelDirty)
  panelDirtyRef.current = panelDirty
  const clearTab = React.useCallback(() => setTab("all"), [setTab])
  const closePanel = React.useCallback(() => attempt(() => setOpenId(null)), [attempt, setOpenId])
  const renderFrame = React.useCallback((toolbar: React.ReactNode, table: React.ReactNode, counts: LibraryCounts) => (
    // A pointer on a tab is held by the panel's guard; this holds the arrow keys too. Nothing moves until Discard, which closes the panel.
    <LibraryTabs counts={counts} value={tab} onChange={(t) => attempt(() => { if (panelDirtyRef.current) setOpenId(null); setTab(t) })} toolbar={toolbar}>
      {table}
    </LibraryTabs>
  ), [tab, attempt, setOpenId, setTab])

  const overlays = (
    <>
      {/* The phase 1 bulk add opens in place, so "Add several by name" never routes into the phase 2 import. */}
      <AddSeveralSheet open={addingSeveral} onOpenChange={setAddingSeveral} rows={api.rows} onAdd={(items, d) => api.addSeveral(items, d)} />
      <SkillSheet open={adding} onOpenChange={setAdding} rows={api.rows} onSave={api.addDraft} onOpenExisting={open} />
      <SkillPanel focusConfigure={focusConfigure} row={adding || addingSeveral ? null : openRow} rows={inView.length ? inView : visible} allRows={api.rows} handlers={handlers} api={api} onOpen={open} onClose={closePanel} dirty={panelDirty} onDirty={setPanelDirty} attempt={attempt} discards={guard.discards} />
      {guard.dialog}
      {life.dialogs}
    </>
  )

  return (
    <LibraryFrame
      api={api}
      tab={tab}
      onAdd={() => guard.attempt(() => { setOpenId(null); setAddingSeveral(false); setAdding(true) })}
      onAddSeveral={() => guard.attempt(() => { setOpenId(null); setAdding(false); setAddingSeveral(true) })}
      // Inside Set up skills (D-L44) the wizard's Next is the one filled button. On an empty library, as on a full one, Add a skill is the page's job.
      // A clean panel has no filled button, since it has no footer: Add a skill stays the one (rule E5); a dirty panel's Save changes takes over.
      primaryElsewhere={embedded || adding || addingSeveral || (!!openRow && panelDirty)}
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
          onBulkEdit={api.bulkEdit}
          onClearTab={clearTab}
          onRowsInView={setInView}
          justAdded={api.justAdded}
          justReplaced={api.justReplaced}
          renderFrame={renderFrame}
        />
      </div>
    </LibraryFrame>
  )
}

/** The Library. With `?program=new` it is the same page on the new program's list. */
export function AdminSkillsLibraryA() {
  return <SkillsLibraryTablePage />
}
