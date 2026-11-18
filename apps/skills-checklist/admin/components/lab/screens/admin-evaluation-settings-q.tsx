"use client"

/**
 * Evaluation methods Q, "Side panel" (Proposed, D-EM1117-q; contract ADMIN-D3 "round 8"). From Romit's handoff spec
 * `evaluation-methods-handoff.md`, Variant 1, built inside the lab's rules; the template gallery was removed on Romit's word (2026-11-17,
 * "when I click on New method, open the same panel instead of starting points").
 *
 *   - List (`?variant=Q`): the shared methods table. New method (`&method=new`) opens the panel over the list.
 *   - Panel (DS FloatingSheetPanel, right): tabs Settings and Preview. Settings: the method's identity (Name, Description textarea, Type as a
 *     DS Select with nothing chosen [REQ SC-02]; no heading, no icons), then four sections, each a heading with one icon, split by
 *     separators: what the evaluator picks (once a type is chosen; the type's starting values fill in), who can evaluate, what each evaluation
 *     needs, group check-off (its select nested on one row under the checkbox). No helper text. Preview: the evaluator's and the student's
 *     form for the draft. Create method / Save method shows on both tabs; a failed save brings Settings back, at the first problem.
 *   - After Create: the panel closes; a LocalBanner (never a toast) says what was created, with "Assign to skills" to the Library; the new row
 *     leads the table with a "New" badge until the page is left. Save on a method used by skills asks first in the spec's words [REQ AE-02].
 */
import * as React from "react"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import { Separator } from "@exxatdesignux/ui/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@exxatdesignux/ui/components/ui/tabs"
import { FloatingSheetPanelBody, FloatingSheetPanelContent, FloatingSheetPanelFooter, FloatingSheetPanelHeader, FloatingSheetPanelToolbar } from "@exxatdesignux/ui/components/ui/floating-sheet-panel"
import { cn } from "@exxatdesignux/ui/lib/utils"
import { TYPE } from "@/components/lab/type-scale"
import { useLabHref } from "@/components/lab/lab-bar/page-context"
import { FloatingSheetPanel } from "@/components/lab/shared/sheet"
import { type ResultBannerValue } from "@/components/lab/shared/result-banner"
import { UnsavedChangesGuard } from "@/components/lab/shared/unsaved-guard"
import { CheckOffField, LoadingBlock, MethodDraft, MethodPreview, MethodsTable, NEW, NameFields, NeedsField, NoMethods, PICKS_LABEL, ProblemsLink, RolesField, SECTION_ICON, SectionHeading, SettingsHome, TypeBody, TypeSelect, useAskDiscard, useMethodNav, useOpenMethod, withCarried, type MethodModel } from "@/components/lab/methods/method-parts"
import { METHOD_TEMPLATES } from "@/lib/lab/method-examples"
import type { EvalModel } from "@/lib/v2/types"
import { methodsOf, type EvaluationMethod } from "@/lib/lab/methods"
import { countSkills, skillNounPlural } from "@/lib/lab/terms"
import { useV2Hydrated, useV2State } from "@/lib/v2/react"

/** What sits above the panel or feeds it: a press there is not a press on the page. */
const NOT_THE_PAGE = "[role=dialog], [role=alertdialog], [role=menu], [role=listbox], [data-slot=dialog-overlay], [data-slot=alert-dialog-overlay], [data-region=methods], a[href]"

type PanelTab = "settings" | "preview"

/** A new method's starting values once its type is chosen: the old template for that type (levels named, the scale set), never who evaluates [REQ SC-16]. */
const startFor = (t: EvalModel) => METHOD_TEMPLATES.find((x) => x.model === t)?.build() ?? null

function PanelEditor({ m, onCancel, onTouched }: { m: MethodModel; onCancel: () => void; onTouched: (v: boolean) => void }) {
  const [tab, setTab] = React.useState<PanelTab>("settings")
  const touched = m.dirty
  React.useEffect(() => { onTouched(touched) }, [touched, onTouched])
  React.useEffect(() => () => onTouched(false), [onTouched])
  const { rule, method } = m
  // The type is on the Settings tab: the caption says only who uses the method (each fact once).
  const caption = method
    ? [method.program && method.saved ? `New ${skillNounPlural()}` : null, method.skillIds.length ? countSkills(method.skillIds.length) : `No ${skillNounPlural()} yet`].filter(Boolean).join(" · ")
    : undefined
  // A problem lives on Settings: a failed save, or the "n to fix" link, brings that tab back before focus moves to it.
  // No type yet: the select is the one thing to fix (the shared model looks for tiles Q does not have).
  const focusType = () => requestAnimationFrame(() => requestAnimationFrame(() => document.getElementById("cfg-model")?.focus()))
  const save = () => { const r = m.save(); if (r !== "ok") setTab("settings"); if (r === "type") focusType() }
  const toProblems: MethodModel = { ...m, toFirstProblem: () => { setTab("settings"); if (!rule.model && !m.nameError) focusType(); else m.toFirstProblem() } }
  return (
    <>
      <FloatingSheetPanelToolbar closeLabel="Close" showSize={false} />
      <FloatingSheetPanelHeader title={method ? method.name : "New method"} subtitle={caption} className="[&>div]:pb-2" titleClassName={cn(TYPE.section, "line-clamp-2 break-words")} />
      <FloatingSheetPanelBody className="@container flex flex-col px-4 pb-4" data-method-body>
        <Tabs value={tab} onValueChange={(v) => setTab(v as PanelTab)} className="flex min-w-0 flex-col gap-4">
          <TabsList variant="line" ariaLabel="Method" className="sticky top-0 z-10 bg-background">
            <TabsTrigger value="settings" data-panel-tab="settings">Settings</TabsTrigger>
            <TabsTrigger value="preview" data-panel-tab="preview">Preview</TabsTrigger>
          </TabsList>
          {/* Settings stays mounted while Preview shows, so a failed save can focus its field and nothing typed is lost. */}
          {/* Two levels: the method's identity (Name, Description, Type; no heading, no icons), then four sections, each a 16 semibold heading
              with one icon, split by a Separator. 24px between sections, 12 to 16px inside one. */}
          <TabsContent value="settings" forceMount className="mt-0 flex min-w-0 flex-col gap-6 data-[state=inactive]:hidden" data-panel-settings>
            <div className="flex min-w-0 flex-col gap-4" data-region="identity">
              <NameFields m={m} descriptionArea />
              <TypeSelect m={m} prefill={startFor} />
            </div>
            {/* What the evaluator picks and group check-off depend on the type, so they wait for it; the rest shows from the start. */}
            {rule.model ? (
              <>
                <Separator />
                <section className="flex min-w-0 flex-col gap-3" aria-labelledby="q-picks-heading" data-section="picks">
                  <SectionHeading icon={SECTION_ICON.picks} id="q-picks-heading">{PICKS_LABEL}</SectionHeading>
                  <TypeBody m={m} />
                </section>
              </>
            ) : null}
            <Separator />
            <RolesField m={m} section />
            <Separator />
            <NeedsField m={m} section />
            {rule.model ? (
              <>
                <Separator />
                <CheckOffField m={m} section />
              </>
            ) : null}
          </TabsContent>
          <TabsContent value="preview" className="mt-0 min-w-0" data-panel-preview-tab>
            {tab === "preview" ? <MethodPreview draft={withCarried(rule)} /> : null}
          </TabsContent>
        </Tabs>
      </FloatingSheetPanelBody>
      <FloatingSheetPanelFooter className="flex flex-col-reverse gap-2 sm:flex-row sm:flex-wrap sm:items-center" data-save-bar>
        <span className="flex min-w-0 flex-1 items-center sm:justify-end" aria-live="polite" aria-atomic="true"><ProblemsLink m={toProblems} /></span>
        {method ? (
          m.dirty ? (
            <>
              <Button type="button" variant="outline" size="sm" onClick={onCancel}>Cancel</Button>
              <Button type="button" variant="default" size="sm" className="max-sm:w-full" onClick={save} data-save-method>Save method</Button>
            </>
          ) : (
            <Button type="button" variant="outline" size="sm" onClick={onCancel}>Close</Button>
          )
        ) : (
          <Button type="button" variant="default" size="sm" className="max-sm:w-full" onClick={save} data-save-method>Create method</Button>
        )}
      </FloatingSheetPanelFooter>
      <UnsavedChangesGuard dirty={m.dirty} onDiscard={m.reset} />
    </>
  )
}

export function AdminEvaluationSettingsQ() {
  const state = useV2State()
  const hydrated = useV2Hydrated()
  const nav = useMethodNav()
  const to = useLabHref()
  const { open, missing } = useOpenMethod(nav.id)
  const [banner, setBanner] = React.useState<ResultBannerValue | null>(null)
  const [newId, setNewId] = React.useState<string | null>(null)
  const [dirty, setDirty] = React.useState(false)
  const discard = useAskDiscard()
  const count = React.useMemo(() => methodsOf(state).length, [state])
  const method: EvaluationMethod | null = open && open !== NEW ? open : null
  const isOpen = !!method || open === NEW
  const createdName = React.useRef("")
  const lastId = React.useRef<string | null>(null)
  if (method) lastId.current = method.id
  const openMethod = (id: string) => { if (id !== nav.id) discard.ask(dirty, () => nav.open(id)) }
  const close = () => discard.ask(dirty, nav.close)
  const onTouched = React.useCallback((v: boolean) => setDirty(v), [])

  if (nav.id && !hydrated) return <div className="p-6"><LoadingBlock /></div>

  return (
    <>
      <SettingsHome banner={banner} setBanner={setBanner} missing={missing} guard={(then) => discard.ask(dirty, then)} quietNew={isOpen}>
        {count ? <MethodsTable setBanner={setBanner} onOpen={openMethod} activeId={method?.id ?? null} newId={newId} narrowWhenActive={false} /> : <NoMethods href={nav.href(NEW)} />}
      </SettingsHome>
      <FloatingSheetPanel open={isOpen} onOpenChange={(o) => { if (!o) close() }}>
        <FloatingSheetPanelContent
          side="right"
          size="md"
          className="z-[45]"
          // Under the shell's top bar, which sits above this layer: the panel's own Close stays in view.
          style={{ top: "2.75rem", height: "calc(100dvh - 3.25rem)" }}
          data-method-panel
          aria-describedby={undefined}
          onOpenAutoFocus={(e) => {
            // Focus moves to Name, the first thing to fill.
            e.preventDefault()
            requestAnimationFrame(() => requestAnimationFrame(() => document.getElementById("method-name")?.focus({ preventScroll: true })))
          }}
          onCloseAutoFocus={(e) => {
            const row = lastId.current ? document.querySelector<HTMLElement>(`[data-method-link="${lastId.current}"]`) : document.querySelector<HTMLElement>("[data-new-method]")
            if (row) { e.preventDefault(); row.focus({ preventScroll: true }) }
          }}
          onInteractOutside={(e) => {
            e.preventDefault()
            const target = e.detail.originalEvent.target as Element | null
            if (typeof PointerEvent === "undefined" || !(e.detail.originalEvent instanceof PointerEvent) || !target || !target.isConnected || target.closest(NOT_THE_PAGE)) return
            close()
          }}
        >
          {isOpen ? (
            <MethodDraft
              key={method?.id ?? NEW}
              method={method}
              confirmWords="update"
              onSaved={(b, id) => {
                if (id && !method && b.variant === "success") {
                  setNewId(id)
                  setBanner({ variant: "success", title: `${createdName.current || "The method"} created.`, action: { label: `Assign to ${skillNounPlural()}`, href: to("admin/skills-library") } })
                } else setBanner(b)
                if (id) { setDirty(false); nav.close() }
              }}
            >
              {(m) => {
                createdName.current = m.meta.name.trim()
                return (
                  <PanelEditor
                    m={m}
                    onCancel={close}
                    onTouched={onTouched}
                  />
                )
              }}
            </MethodDraft>
          ) : null}
        </FloatingSheetPanelContent>
      </FloatingSheetPanel>
      {discard.question}
    </>
  )
}
