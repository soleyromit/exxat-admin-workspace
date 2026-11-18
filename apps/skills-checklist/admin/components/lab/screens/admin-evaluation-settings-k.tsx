"use client"

/**
 * Evaluation settings K, "Side panel" (Proposed, D-EM1116-g; contract ADMIN-D3 "round 6 variants"). Romit 2026-11-16, after choosing G:
 * "is that all the options you have considered?"
 *
 * One pattern for adding and editing: a method opens in a panel beside the methods table, not over it. The panel is the DS
 * FloatingSheetPanel (non-modal), so the table stays readable and clickable; the page narrows beside it from 1100 px. Another row swaps the
 * panel, asking first while it holds unsaved work. One column in reading order: name, type, what the evaluator picks, who can evaluate, what
 * each evaluation needs. One Save, at the panel's foot, shown once there is something to save. New: the four types first, nothing chosen
 * [REQ SC-02]. `?method=<id|new>` opens the panel; Back closes it.
 */
import * as React from "react"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import { FloatingSheetPanelBody, FloatingSheetPanelContent, FloatingSheetPanelFooter, FloatingSheetPanelHeader, FloatingSheetPanelToolbar } from "@exxatdesignux/ui/components/ui/floating-sheet-panel"
import { FloatingSheetPanel } from "@/components/lab/shared/sheet"
import { useBesidePanel } from "@/components/lab/library/beside-panel"
import { type ResultBannerValue } from "@/components/lab/shared/result-banner"
import { UnsavedChangesGuard } from "@/components/lab/shared/unsaved-guard"
import { ProgramPreviewDialog } from "@/components/lab/configure/settings-dialogs"
import { CheckOffField, MethodDraft, MethodsTable, NEW, NameFields, NeedsField, NoMethods, ProblemsLink, RolesField, SettingsHome, TypeBody, TypeLine, TypeTiles, useAskDiscard, useMethodNav, useOpenMethod, withCarried, type MethodModel } from "@/components/lab/methods/method-parts"
import { methodsOf, type EvaluationMethod } from "@/lib/lab/methods"
import { useV2State } from "@/lib/v2/react"

/** What sits above the panel or feeds it: a press there is not a press on the page. */
const NOT_THE_PAGE = "[role=dialog], [role=alertdialog], [role=menu], [role=listbox], [data-slot=dialog-overlay], [data-slot=alert-dialog-overlay], [data-region=methods], a[href]"

function PanelEditor({ m, onCancel }: { m: MethodModel; onCancel: () => void }) {
  const [changing, setChanging] = React.useState(false)
  const { rule, method } = m
  const canSave = !method || m.dirty
  return (
    <>
      <FloatingSheetPanelToolbar closeLabel="Close" showSize={false} />
      <FloatingSheetPanelHeader title={method ? "Edit method" : "New method"} className="[&>div]:pb-2" />
      <FloatingSheetPanelBody className="@container flex flex-col gap-6 px-4 pb-4" data-method-body>
        {m.settled ? null : <TypeTiles m={m} />}
        {rule.model ? (
          <>
            <NameFields m={m} />
            {/* The type is a fact among the fields; the four types wait behind Change type [REQ SC-09]. */}
            {m.settled ? (
              <div className="flex min-w-0 flex-col gap-3">
                <TypeLine m={m} changing={changing} onToggle={() => setChanging((v) => !v)} labelled />
                {changing ? <TypeTiles m={m} /> : null}
              </div>
            ) : null}
            <TypeBody m={m} />
            <RolesField m={m} />
            <NeedsField m={m} />
            <CheckOffField m={m} />
          </>
        ) : null}
      </FloatingSheetPanelBody>
      <FloatingSheetPanelFooter className="flex flex-wrap items-center gap-2" data-save-bar>
        {rule.model ? <ProgramPreviewDialog draft={withCarried(rule)} variant="ghost" /> : null}
        <span className="flex min-w-0 flex-1 items-center justify-end" aria-live="assertive" aria-atomic="true"><ProblemsLink m={m} /></span>
        {canSave ? (
          <>
            <Button type="button" variant="outline" size="sm" onClick={onCancel}>Cancel</Button>
            <Button type="button" variant="default" size="sm" onClick={() => { m.save() }} data-save-method>{method ? "Save method" : "Create method"}</Button>
          </>
        ) : null}
      </FloatingSheetPanelFooter>
      <UnsavedChangesGuard dirty={m.dirty} onDiscard={m.reset} />
    </>
  )
}

export function AdminEvaluationSettingsK() {
  const state = useV2State()
  const nav = useMethodNav()
  const { open, missing } = useOpenMethod(nav.id)
  const [banner, setBanner] = React.useState<ResultBannerValue | null>(null)
  const [dirty, setDirty] = React.useState(false)
  const discard = useAskDiscard()
  const count = React.useMemo(() => methodsOf(state).length, [state])
  const isOpen = !!open
  const method: EvaluationMethod | null = open && open !== NEW ? open : null
  useBesidePanel(isOpen)
  // The row the panel was opened from takes focus back when it closes.
  const lastId = React.useRef<string | null>(null)
  if (method) lastId.current = method.id
  const openMethod = (id: string) => { if (id !== nav.id) discard.ask(dirty, () => nav.open(id)) }
  const close = () => discard.ask(dirty, nav.close)
  return (
    <>
      <SettingsHome banner={banner} setBanner={setBanner} missing={missing} guard={(then) => discard.ask(dirty, then)} quietNew={dirty}>
        {count ? <MethodsTable setBanner={setBanner} onOpen={openMethod} activeId={method?.id ?? null} /> : <NoMethods href={nav.href(NEW)} />}
      </SettingsHome>
      <FloatingSheetPanel open={isOpen} onOpenChange={(o) => { if (!o) close() }}>
        <FloatingSheetPanelContent
          side="right"
          size="md"
          // The page reflows beside a panel of this slot (beside-panel.ts). Below the DS dialog layer, so the panel's own questions, menus and Preview open above it.
          contentSlot="lab-skill-detail"
          className="z-[45]"
          // Under the shell's top bar, which sits above this layer: the panel's own Close stays in view.
          style={{ top: "2.75rem", height: "calc(100dvh - 3.25rem)" }}
          data-method-panel
          aria-describedby={undefined}
          onOpenAutoFocus={(e) => {
            // New: the first type. Edit: the panel itself, so nothing is changed by opening it.
            const first = (e.currentTarget as HTMLElement | null)?.querySelector<HTMLElement>("[data-type-tiles] [role=radio]")
            if (first) { e.preventDefault(); first.focus({ preventScroll: true }) }
          }}
          onCloseAutoFocus={(e) => {
            const row = lastId.current ? document.querySelector<HTMLElement>(`[data-method-link="${lastId.current}"]`) : null
            if (row) { e.preventDefault(); row.focus({ preventScroll: true }) }
          }}
          onInteractOutside={(e) => {
            // A row swaps the panel, a link leaves through the guard, and a dialog or menu of the panel is not the page. Anything else closes it, asking first.
            e.preventDefault()
            const target = e.detail.originalEvent.target as Element | null
            if (!(e.detail.originalEvent instanceof PointerEvent) || !target || !target.isConnected || target.closest(NOT_THE_PAGE)) return
            close()
          }}
        >
          {open ? (
            <MethodDraft key={method?.id ?? NEW} method={method} onSaved={(b, id) => { setBanner(b); if (id) nav.close() }} onDirty={setDirty}>
              {(m) => <PanelEditor m={m} onCancel={close} />}
            </MethodDraft>
          ) : null}
        </FloatingSheetPanelContent>
      </FloatingSheetPanel>
      {discard.question}
    </>
  )
}
