"use client"

/**
 * The edit panel (map D1a): one non-modal FloatingSheetPanel, opened by a row, for quick edits to one skill: name, description, category, tags and Times needed, with the rule sentence
 * read only and Configure to the full page for its evaluation setup (D1c, D-L115). The list stays in view and clickable. The record is in the URL (?skill=). Save changes writes to the
 * shared store; the panel stays on the record. Inactive skills are edited the same way (D-L93).
 * History (rework item 5): opening, stepping and closing replace the URL rather than adding entries, so Back always leaves the Library and
 * reload or a shared link reopens the same skill. The panel reads the record from the location, so it always shows what the address says, and no entry below this one holds an older skill (useLeaveGuard).
 * Status acts at once through the switch in the header and its own dialog, and unsaved form edits stay in the form.
 * Shape (designer 2026-11-05, D-L97, D-L115): a header that never scrolls (arrows, "...", X, name, Active), two tabs with one purpose each (Details, Used in), and a footer that exists
 * only while there is something to save.
 */
import * as React from "react"
import { LabLink as Link } from "@/components/lab/lab-bar/lab-link"
import { usePresent } from "@/components/lab/lab-bar/present"
import { FloatingSheetPanelBody, FloatingSheetPanelContent, FloatingSheetPanelFooter, FloatingSheetPanelHeader, FloatingSheetPanelToolbar } from "@exxatdesignux/ui/components/ui/floating-sheet-panel"
import { FloatingSheetPanel } from "@/components/lab/shared/sheet"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@exxatdesignux/ui/components/ui/tabs"
import { ToggleSwitch } from "@exxatdesignux/ui/components/ui/toggle-switch"
import { Input } from "@exxatdesignux/ui/components/ui/input"
import { Textarea } from "@exxatdesignux/ui/components/ui/textarea"
import { FieldError, FieldLabel } from "@exxatdesignux/ui/components/ui/field"
import { LAB_ADMIN, EMPTY_DRAFT, NO_CATEGORY, findDuplicate, mappingHref, normName, validateDraft, type LibraryRow } from "@/lib/lab/library"
import { draftConfiguration, draftEdited, panelIssues, panelRuleOf, programSettingsOf, ruleNeedsQuestions, settingsImpact, TIMES_MAX } from "@/lib/lab/program-settings"
import { emptyRule, hasNeed, ruleSaysWhatCounts, studentNeedsSentence, type LabRule } from "@/lib/lab/configure"
import { configureSkillHref } from "@/components/lab/configure/shell"
import { skillLists } from "@/lib/lab/lists"
import { skillReach } from "@/lib/lab/mapping"
import { skillById } from "@/lib/v2/evidence-index"
import { plural } from "@/lib/v2/format"
import { capitalize, skillListsNoun, skillNoun, skillNounPlural } from "@/lib/lab/terms"
import { NUM_LINK } from "@/components/lab/link-styles"
import { TYPE } from "@/components/lab/type-scale"
import { SettingsSummary } from "./settings-summary"
import { DiscardChangesDialog, useLeaveGuard } from "@/components/lab/shared/unsaved-guard"
import { keepFocus, returnFocus, rowLink } from "@/components/lab/shared/focus"
import { useLists, useMappingOverlay } from "@/components/lab/admin-a/use-admin-data"
import { useV2State } from "@/lib/v2/react"
import { useLiveUrlParam, writeUrlParam } from "./library-chrome"
import { RowActions, type RowActionHandlers } from "./row-actions"
import { CategoryPicker, InactiveMark, TagsPicker, useVocabOptions } from "./category-tag-pickers"
import { ImpactDialog } from "./times-needed"
import type { LibraryApi } from "./use-library"
import { afterPaint, useBesidePanel } from "./beside-panel"
import { PanelResultSlot } from "@/components/lab/shared/result-banner"

/**
 * The guard for the panel, one dialog for every way out (map section E rule 6): `attempt` runs an action now, or asks first while dirty; a
 * link anywhere on the page waits the same way, and reload gets the browser's prompt.
 */
export function usePanelGuard(dirty: boolean, onDiscarded: () => void) {
  // `attempt` keeps one identity for the life of the page, so table columns built from it are not rebuilt on every render.
  const leave = useLeaveGuard(dirty)
  const [pending, setPending] = React.useState<(() => void) | null>(null)
  // Counts discards, so the form drops its edits even when the panel stays open on the same skill.
  const [discards, setDiscards] = React.useState(0)
  const dirtyRef = React.useRef(dirty)
  dirtyRef.current = dirty
  const attempt = React.useCallback((action: () => void) => {
    if (dirtyRef.current) setPending(() => action)
    else action()
  }, [])
  const dialog = (
    <DiscardChangesDialog
      open={leave.asking || pending !== null}
      onKeep={() => { leave.setAsking(false); setPending(null) }}
      onDiscard={() => {
        const next = pending
        setPending(null)
        onDiscarded()
        setDiscards((n) => n + 1)
        // Nothing is left to protect: what runs next must not ask again.
        dirtyRef.current = false
        if (leave.asking) leave.go(() => undefined)
        else next?.()
      }}
    />
  )
  return { attempt, dialog, discards }
}

/** A click on a row's own surface: it swaps the record, without dismissing the panel. Its controls are not this. */
const onRowBody = (t: Element | null) => !!t?.closest?.("[data-library-table] tbody tr") && !t?.closest?.("a, button, input, [role=checkbox], [role=menuitem]")

/** The parts of the screen a press on the page must leave alone while the panel is dirty: the panel, what opens from it, and what asks for itself. */
const OWN_SURFACES = '[role=dialog], [role=alertdialog], [role=listbox], [data-radix-popper-content-wrapper], [data-radix-select-viewport], [data-slot=dialog-overlay], [data-slot=alert-dialog-overlay]'
const ASKS_FOR_ITSELF = "a[href], [data-rail-trigger]"
/** The Skills menu's own fold buttons lose nothing and change nothing in the panel: they work with the panel open, dirty or not (designer 2026-11-05). */
const NAV_TOGGLE = '[aria-label="Collapse to icons"], [aria-label="Show labels"]'
/** The press the question held back, done now that the panel has closed. Radix reacts at different points of a press (a tab on mouse down, a menu on pointer down), so it is the whole press. */
function replayPress(target: Element) {
  window.setTimeout(() => {
    if (!target.isConnected) return
    const init = { bubbles: true, cancelable: true, button: 0 }
    for (const type of ["pointerdown", "mousedown", "pointerup", "mouseup", "click"]) {
      target.dispatchEvent(type.startsWith("pointer") ? new PointerEvent(type, { ...init, pointerType: "mouse" }) : new MouseEvent(type, init))
    }
    target.closest<HTMLElement>("input, textarea, select, button, [tabindex]")?.focus({ preventScroll: true })
  }, 0)
}

/**
 * While the panel has unsaved changes, a press anywhere else on the page asks first and does nothing else (map section E rule 6): it never reaches
 * the control, so a tab, a sort, a checkbox or a menu cannot change the screen under the question. Keep editing leaves everything as it was; Discard
 * closes the panel and then does what was pressed. It holds the press in the capture phase, before Radix or React sees it, and keeps focus where it
 * was so Keep editing can return it. On touch a press may be a scroll, so it asks on the tap instead.
 */
function useHoldPagePresses(dirty: boolean, ask: (target: Element) => void) {
  const askRef = React.useRef(ask)
  askRef.current = ask
  React.useEffect(() => {
    if (!dirty) return
    let held = false
    let asked = false
    const offPanel = (t: Element) => !t.closest(OWN_SURFACES)
    const onPointerDown = (e: PointerEvent) => {
      const t = e.target
      held = false
      asked = false
      // Another question is up, or a modal menu takes the press: those have their own way out.
      if (!(t instanceof Element) || document.querySelector("[role=alertdialog][data-state=open], [role=menu][data-state=open]")) return
      // A row's number is a rail trigger too, but it edits: it asks like any other control.
      if (!offPanel(t) || (t.closest(ASKS_FOR_ITSELF) && !t.closest("input")) || onRowBody(t) || t.closest(NAV_TOGGLE)) return
      held = true
      e.stopPropagation()
      if (e.pointerType !== "touch") { asked = true; askRef.current(t) }
    }
    const onMouseDown = (e: MouseEvent) => {
      if (held) { e.stopPropagation(); e.preventDefault(); return }
      // A row or a link goes ahead and asks through its own click; focus stays in the form meanwhile.
      if (e.target instanceof Element && offPanel(e.target) && !e.target.closest(NAV_TOGGLE)) e.preventDefault()
    }
    const onHeld = (e: Event) => { if (held) e.stopPropagation() }
    const onClick = (e: MouseEvent) => {
      if (!held) return
      e.stopPropagation()
      e.preventDefault()
      held = false
      if (!asked && e.target instanceof Element) askRef.current(e.target)
    }
    window.addEventListener("pointerdown", onPointerDown, true)
    window.addEventListener("mousedown", onMouseDown, true)
    window.addEventListener("pointerup", onHeld, true)
    window.addEventListener("mouseup", onHeld, true)
    window.addEventListener("click", onClick, true)
    return () => {
      window.removeEventListener("pointerdown", onPointerDown, true)
      window.removeEventListener("mousedown", onMouseDown, true)
      window.removeEventListener("pointerup", onHeld, true)
      window.removeEventListener("mouseup", onHeld, true)
      window.removeEventListener("click", onClick, true)
    }
  }, [dirty])
}

export type PanelTab = "details" | "used"

const PANEL_ELEMENT = '[data-slot="lab-skill-detail"]'
/** The slide that starts on the press to close. Also how a test tells the panel has answered. */
const PANEL_LEAVING = "panel-leaving"

interface PanelDraft {
  name: string
  description: string
  category: string
  tags: string[]
}

/** The same rule whatever order its keys were built in, so going back to where the form started is not a change. */
const ruleKey = (r: LabRule): string => JSON.stringify(Object.keys(r).sort().map((k) => [k, r[k as keyof LabRule]]))

function Row({ label, htmlFor, labelId, children }: { label: string; htmlFor?: string; labelId?: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[8.5rem_minmax(0,1fr)] items-start gap-3">
      {htmlFor ? (
        <FieldLabel id={labelId} htmlFor={htmlFor} className="pt-2">{label}</FieldLabel>
      ) : (
        <span id={labelId} className="py-1 text-sm text-muted-foreground">{label}</span>
      )}
      <div className="flex min-w-0 flex-col gap-1">{children}</div>
    </div>
  )
}

/** The small mark on a tab that holds a problem [REQ SC-18]: a glyph, and said to a screen reader. */
function TabProblem() {
  return (
    <>
      <i className="fa-solid fa-circle-exclamation ms-1.5 text-xs text-destructive" aria-hidden="true" data-tab-problem />
      <span className="sr-only">, has a problem</span>
    </>
  )
}

/** Hidden, not unmounted: a half-typed tag or the place in a long form is still there on the way back. */
const TAB_PANE = "flex flex-col gap-4 data-[state=inactive]:hidden"

/** The form for one skill. Keyed by skill, so moving to another row starts clean. */
const EditForm = React.memo(function EditForm({ row, allRows, saveEdit, onEdited, onOpen, onCancel, onDirty, tab, onTab, focusConfigure }: {
  row: LibraryRow
  allRows: readonly LibraryRow[]
  saveEdit: LibraryApi["saveEdit"]
  /** The form has changed since its last save, so "saved" is no longer the news (rule E10). */
  onEdited: () => void
  onOpen: (id: string) => void
  onCancel: () => void
  onDirty: (d: boolean) => void
  tab: PanelTab
  onTab: (t: PanelTab) => void
  focusConfigure: boolean
}) {
  const state = useV2State()
  const [overlay] = useMappingOverlay()
  const { lists } = useLists(state)
  const opts = useVocabOptions()
  const skill = skillById(state, row.id)
  const program = programSettingsOf(state)?.rule ?? null

  // ---- Details
  const baseline = React.useMemo<PanelDraft>(() => ({
    name: row.name,
    description: row.description,
    category: row.section === NO_CATEGORY ? "" : row.section,
    tags: row.tags,
  }), [row])
  const baselineKey = JSON.stringify(baseline)
  const [d, setD] = React.useState<PanelDraft>(baseline)
  const [nameError, setNameError] = React.useState<string | null>(null)

  // ---- Times needed: the only part of the rule edited here; the rest is on the full page (D-L115).
  const baseRule = React.useMemo<LabRule>(() => (skill ? panelRuleOf(skill) : emptyRule()), [skill])
  const baseRuleKey = ruleKey(baseRule)
  const [rule, setRuleState] = React.useState<LabRule>(baseRule)
  const baseEdited = !!skill?.edited
  const [showErrors, setShowErrors] = React.useState(false)
  const word = draftConfiguration({ rule, baseEdited, baseRule, program, reset: false, custom: baseEdited })
  // A save that changes someone's progress waits here until the admin has seen it (map D0 rule 9).
  const [ask, setAsk] = React.useState<{ students: Array<{ id: string; name: string }> } | null>(null)

  // A save, or a number changed in the table, moves the baseline: the form follows it, and a field the admin has changed keeps that change.
  const lastBaseline = React.useRef(baseline)
  const lastRule = React.useRef(baseRule)
  const justSaved = React.useRef(false)
  // After a save the form reads what was saved. Every render, not on a change of the saved rule: going back to Default from a Custom skill whose values match the program saves
  // the same rule, which left the draft and its footer behind ("Unsaved changes" after a successful save, and X asking to discard nothing).
  React.useLayoutEffect(() => {
    if (!justSaved.current) return
    justSaved.current = false
    lastRule.current = baseRule
    setRuleState(baseRule)
  })
  React.useEffect(() => {
    const was = lastBaseline.current
    const now = JSON.parse(baselineKey) as PanelDraft
    lastBaseline.current = now
    setD((p) => {
      const kept = (k: keyof PanelDraft) => JSON.stringify(p[k]) !== JSON.stringify(was[k])
      return { name: kept("name") ? p.name : now.name, description: kept("description") ? p.description : now.description, category: kept("category") ? p.category : now.category, tags: kept("tags") ? p.tags : now.tags }
    })
    setNameError(null)
  }, [baselineKey])
  // Layout effects, this and the report of `dirty` below: the guard asks on the next press, so it must never hold a word older than the form (rework 2, item 2).
  React.useLayoutEffect(() => {
    const was = lastRule.current
    lastRule.current = baseRule
    setRuleState((p) => {
      const out = { ...baseRule } as Record<string, unknown>
      for (const k of Object.keys(p) as Array<keyof LabRule>) if (JSON.stringify(p[k]) !== JSON.stringify(was[k])) out[k] = p[k]
      return out as unknown as LabRule
    })
  }, [baseRuleKey]) // eslint-disable-line react-hooks/exhaustive-deps

  const ruleDirty = ruleKey(rule) !== baseRuleKey
  const [tagTyped, setTagTyped] = React.useState(false)
  const dirty = JSON.stringify(d) !== baselineKey || ruleDirty || tagTyped
  React.useLayoutEffect(() => { onDirty(dirty) }, [dirty, onDirty])
  React.useEffect(() => { if (dirty) onEdited() }, [dirty, onEdited])
  React.useEffect(() => () => onDirty(false), [onDirty])

  const inactive = row.status === "inactive"
  const categoryOff = !!d.category && opts.inactiveCategories.some((c) => normName(c) === normName(d.category))
  const others = React.useMemo(() => allRows.filter((r) => r.id !== row.id), [allRows, row])
  const nameProblem = (name: string) => validateDraft({ ...EMPTY_DRAFT, name }, others.map((r) => r.name)).name ?? null
  const duplicate = nameError ? findDuplicate(d.name, others) : null
  const issues = React.useMemo(() => panelIssues(rule), [rule])

  const needError = showErrors ? issues[0]?.message : undefined
  const save = () => {
    const nameIssue = nameProblem(d.name)
    setNameError(nameIssue)
    if (nameIssue) {
      onTab("details")
      window.setTimeout(() => document.getElementById("edit-skill-name")?.focus(), 30)
      return
    }
    if (ruleDirty && issues.length) {
      setShowErrors(true)
      onTab("details")
      window.setTimeout(() => document.getElementById("cfg-need")?.focus(), 30)
      return
    }
    setShowErrors(false)
    const students = ruleDirty && skill ? settingsImpact(state, skill, rule) : []
    if (students.length) { setAsk({ students }); return }
    apply()
  }
  const apply = () => {
    const settings = ruleDirty ? { rule, edited: draftEdited({ rule, baseEdited, baseRule, program, reset: false, custom: baseEdited }) } : null
    justSaved.current = !!settings
    const failed = saveEdit(row.id, { name: d.name, description: d.description, category: d.category, tags: d.tags }, settings)
    if (failed) { justSaved.current = false; setShowErrors(true); setNameError(null); return }
    // What was saved is trimmed (setSkillDetailsInStore): the form holds the same, so a stray space leaves nothing unsaved.
    setD((p) => ({ ...p, name: p.name.trim().replace(/\s+/g, " "), description: p.description.trim() }))
    // The footer goes with the changes: focus must not go with the button that had it.
    keepFocus(row.id)
  }
  // Back from the full page after a save: focus on Configure, where the admin left (map D1c).
  const configureRef = React.useRef<HTMLAnchorElement>(null)
  React.useEffect(() => {
    if (focusConfigure) requestAnimationFrame(() => requestAnimationFrame(() => configureRef.current?.focus({ preventScroll: true })))
  }, [focusConfigure])
  const needOk = hasNeed(rule) && rule.need <= TIMES_MAX

  const reach = React.useMemo(() => skillReach(state, overlay, "", lists).find((r) => r.id === row.id), [state, overlay, lists, row.id])
  const onLists = skillLists(lists).filter((l) => l.skillIds.includes(row.id)).length
  const detailsProblem = !!nameError || (showErrors && issues.length > 0)

  // The DS table pins its floating head under any `tabs-sticky-subheader` it finds in the document, and that finds this strip too, floating over the page beside the panel. A banner lowers the
  // scrollport's top into this strip's height, and the head then pinned about 19 px below the top, with a row showing clipped above it. This strip is the panel's own, and it is not one of the page's.
  const tabStrip = React.useCallback((el: HTMLDivElement | null) => {
    el?.querySelector('[data-slot="tabs-sticky-subheader"]')?.setAttribute("data-slot", "panel-tabs-strip")
  }, [])

  return (
    <Tabs value={tab} onValueChange={(v) => onTab(v as PanelTab)} className="flex min-h-0 flex-1 flex-col gap-0">
      <div ref={tabStrip} className="shrink-0 px-4">
        <TabsList variant="line" ariaLabel={`${capitalize(skillNoun())} sections`}>
          <TabsTrigger value="details">Details{detailsProblem ? <TabProblem /> : null}</TabsTrigger>
          <TabsTrigger value="used">Used in</TabsTrigger>
        </TabsList>
      </div>
      <PanelResultSlot />
      <FloatingSheetPanelBody className="px-4 py-4" data-panel-body>
        <TabsContent value="details" forceMount className={TAB_PANE}>
          <form id="edit-skill-form" noValidate className="flex flex-col gap-4" onSubmit={(e) => { e.preventDefault(); if (dirty) save() }}>
            <Row label="Name" htmlFor="edit-skill-name">
              <Input
                id="edit-skill-name"
                value={d.name}
                maxLength={160}
                onChange={(e) => { setD((p) => ({ ...p, name: e.target.value })); if (nameError) setNameError(null) }}
                onBlur={() => setNameError(nameProblem(d.name))}
                aria-invalid={!!nameError || undefined}
                aria-describedby={nameError ? "edit-skill-name-error" : undefined}
              />
              {nameError ? (
                <FieldError id="edit-skill-name-error">
                  <span className="flex flex-wrap items-center gap-x-2">
                    {nameError}
                    {duplicate ? <Button type="button" variant="link" size="xs" className="h-auto p-0" onClick={() => onOpen(duplicate.id)}>Open it</Button> : null}
                  </span>
                </FieldError>
              ) : null}
            </Row>
            <Row label="Description" htmlFor="edit-skill-description">
              <Textarea id="edit-skill-description" rows={3} maxLength={600} value={d.description} onChange={(e) => setD((p) => ({ ...p, description: e.target.value }))} />
            </Row>
            <Row label="Category" htmlFor={categoryOff ? undefined : "edit-skill-category"} labelId="edit-skill-category-label">
              {categoryOff ? (
                // A category deactivated since it was assigned stays on the skill, marked, until removed [REQ SL-06].
                <span className="flex flex-wrap items-center gap-2 py-1 text-sm text-foreground" data-category-inactive>
                  <span>{d.category}</span>
                  <InactiveMark />
                  <Button type="button" variant="ghost" size="icon-sm" aria-label={`Remove category ${d.category}`} onClick={() => setD((p) => ({ ...p, category: "" }))}>
                    <i className="fa-light fa-xmark" aria-hidden="true" />
                  </Button>
                </span>
              ) : (
                <CategoryPicker id="edit-skill-category" labelId="edit-skill-category-label" value={d.category} options={opts.categories} inactive={opts.inactiveCategories} onChange={(v) => setD((p) => ({ ...p, category: v }))} className="w-full" />
              )}
            </Row>
            <Row label="Tags" htmlFor="edit-skill-tags" labelId="edit-skill-tags-label">
              <TagsPicker id="edit-skill-tags" labelId="edit-skill-tags-label" value={d.tags} options={opts.tags} inactive={opts.inactiveTags} onChange={(tags) => setD((p) => ({ ...p, tags }))} onTyping={setTagTyped} />
            </Row>
            <Row label="Times needed" htmlFor="cfg-need">
              <Input
                id="cfg-need"
                type="number"
                inputMode="numeric"
                min={1}
                max={TIMES_MAX}
                step={1}
                className="w-24 tabular-nums"
                placeholder="Not set"
                value={Number.isFinite(rule.need) ? String(rule.need) : ""}
                onChange={(e) => { const raw = e.target.value; setRuleState((r) => ({ ...r, need: raw.trim() === "" ? Number.NaN : Number(raw) })); setShowErrors(false) }}
                aria-invalid={!!needError || undefined}
                aria-describedby={needError ? "cfg-need-error" : undefined}
              />
              {needError ? <FieldError id="cfg-need-error">{needError}</FieldError> : null}
            </Row>
            {/* The live rule and what else applies; a number that cannot be saved stays out of the sentence. */}
            <div data-panel-configuration={word}>
              <SettingsSummary
                id="panel-settings-title"
                rule={rule.model ? { ...rule, need: needOk ? rule.need : Number.NaN } : null}
                word={word}
                emptyText={`Your program has not set how ${skillNounPlural()} are judged.`}
                action={
                  <Button asChild variant="outline" size="sm">
                    <Link ref={configureRef} href={configureSkillHref(row.id)} data-panel-configure>
                      Configure
                      <i className="fa-light fa-arrow-right text-xs" aria-hidden="true" />
                    </Link>
                  </Button>
                }
              />
            </div>
          </form>
        </TabsContent>

        <TabsContent value="used" forceMount className={TAB_PANE}>
          <Row label={capitalize(skillListsNoun())}>
            {inactive
              ? <span className="py-1 text-sm text-muted-foreground">Withdrawn</span>
              : <Link className={`${NUM_LINK} py-1`} href={`${LAB_ADMIN}/lists-cohorts`}>{plural(onLists, "list", "lists")}</Link>}
          </Row>
          <Row label="Courses">
            {inactive ? (
              <span className="py-1 text-sm text-muted-foreground">Withdrawn</span>
            ) : row.configuration === "not-configured" ? (
              <span className="py-1 text-sm text-muted-foreground">Mapped after it is configured</span>
            ) : (
              <Link className={`${NUM_LINK} py-1`} href={mappingHref(row.id)}>
                {reach?.courses ? `${plural(reach.courses, "course", "courses")}${reach.mandatoryCourses ? `, ${reach.mandatoryCourses} mandatory` : ""}` : "Not mapped yet"}
              </Link>
            )}
          </Row>
          <Row label="Came from"><span className="py-1 text-sm text-foreground">{row.source}</span></Row>
        </TabsContent>
      </FloatingSheetPanelBody>
      {/* Only with something to save (Shopify's save bar, D-L97). With nothing to save, X is the way out. A flex child under a body that keeps its scrollTop, so nothing moves when it appears. The DS FloatingSheetPanelWorkflowFooter hard-codes flex-1 buttons and key hints, with no prop to turn them off. */}
      <span className="sr-only" aria-live="polite">{dirty ? "Unsaved changes" : ""}</span>
      {dirty ? (
        <FloatingSheetPanelFooter className="flex items-center justify-between gap-2" data-unsaved-footer>
          <span className="text-sm text-muted-foreground" aria-hidden="true">Unsaved changes</span>
          <span className="flex items-center gap-2">
            <Button type="button" variant="outline" size="sm" onClick={onCancel}>Cancel</Button>
            <Button type="submit" form="edit-skill-form" variant="default" size="sm">Save changes</Button>
          </span>
        </FloatingSheetPanelFooter>
      ) : null}
      <ImpactDialog
        open={!!ask}
        title={`Save changes to ${row.name}?`}
        students={ask?.students ?? []}
        skillId={row.id}
        onCancel={() => setAsk(null)}
        onConfirm={() => { setAsk(null); apply() }}
      />
    </Tabs>
  )
})

/** Header: always in view, never scrolling. Status acts at once through its own dialog and is not part of Save (D-L97). Cancel leaves the switch where it was, since it reads the skill. */
function ActiveRow({ row, handlers }: { row: LibraryRow; handlers: RowActionHandlers }) {
  return (
    <div className="flex shrink-0 items-center gap-3 px-4 pb-3" data-panel-active>
      <span className="text-sm text-foreground" aria-hidden="true">{row.status === "active" ? "Active" : "Inactive"}</span>
      <ToggleSwitch aria-label={`${capitalize(skillNoun())} is active`} checked={row.status === "active"} onChange={() => handlers.onStatusFromPanel?.(row)} />
    </div>
  )
}

export function SkillPanel({ row, rows, allRows, handlers, api, onOpen, onClose, dirty, onDirty, attempt, discards, focusConfigure = null }: {
  row: LibraryRow | null
  /** The rows in view, in order, for Previous and Next. */
  rows: readonly LibraryRow[]
  allRows: readonly LibraryRow[]
  handlers: RowActionHandlers
  api: LibraryApi
  onOpen: (id: string) => void
  onClose: () => void
  dirty: boolean
  onDirty: (d: boolean) => void
  attempt: (action: () => void) => void
  discards: number
  /** The skill just saved on the full page: Configure takes focus when its form mounts (map D1c). */
  focusConfigure?: string | null
}) {
  // On the walkthrough the path bar sits at the top right of the utility bar: the panel starts below it, so Next and Back stay in reach.
  const { present } = usePresent()
  // X, Esc and a click on the page answer in the frame of the press. The record comes from the location itself (`useLiveUrlParam`) and the table behind does not render for it (useOpenRow in
  // library-table.tsx); it used to wait behind a render of all 178 rows, the panel on screen and X looking dead (the designer's "I cannot close the panel", 2026-11-05). Even so, the DS's own close reads
  // layout several times, and on a page this size each read restyles every element (see the map, D1a). So the slide starts here, on the compositor, where none of that can hold it, and the state follows
  // once that frame has painted. Only a clean panel closes straight off: a dirty one asks first, through `attempt`.
  const open = !!row
  const leaving = React.useRef<Animation | null>(null)
  const rowId = row?.id ?? null
  const closeNow = React.useCallback(() => {
    attempt(() => {
      const el = document.querySelector<HTMLElement>(PANEL_ELEMENT)
      const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches
      if (el) {
        leaving.current?.cancel()
        leaving.current = el.animate(still ? [{ opacity: 1 }, { opacity: 0 }] : [{ transform: "none" }, { transform: "translateX(calc(100% + 1rem))" }], { id: PANEL_LEAVING, duration: still ? 0 : 180, easing: "ease-in", fill: "forwards" })
      }
      // Pressed another row in the meantime: that one stays open.
      afterPaint(() => { if (new URLSearchParams(window.location.search).get("skill") === rowId) onClose() })
    })
  }, [attempt, onClose, rowId])
  React.useLayoutEffect(() => { if (open) { leaving.current?.cancel(); leaving.current = null } }, [open, rowId])
  const lastRow = React.useRef(row)
  if (row) lastRow.current = row
  const shownRow = row ?? lastRow.current
  useBesidePanel(open)
  // The panel's frame paints first, its form on the next task. Mounting the form reads layout several times, and on this page each read restyles every element on it (the DS rule
  // `body:has([data-slot=secondary-panel]...[data-state=open]) [data-slot=tooltip-content]` makes any data-state change a whole-page restyle), which held the panel's first frame back.
  const [formMounted, setFormMounted] = React.useState(open)
  React.useEffect(() => {
    if (open === formMounted) return
    if (open) return afterPaint(() => setFormMounted(true))
    // Kept while the panel slides away.
    const timer = window.setTimeout(() => setFormMounted(false), 500)
    return () => window.clearTimeout(timer)
  }, [open, formMounted])
  const i = row ? rows.findIndex((r) => r.id === row.id) : -1
  const prev = i > 0 ? rows[i - 1] : undefined
  const next = i >= 0 && i < rows.length - 1 ? rows[i + 1] : undefined
  // Closing returns focus to the row; stepping past the last row must not drop it on the page.
  const shown = React.useRef<string | null>(null)
  if (row) shown.current = row.id
  React.useEffect(() => { if (row) keepFocus(row.id) }, [row?.id]) // eslint-disable-line react-hooks/exhaustive-deps
  // Discard here closes the panel and does what was pressed, which then has focus: closing must not pull it back to the row.
  const leavesFocus = React.useRef(false)
  useHoldPagePresses(dirty, (target) => attempt(() => { leavesFocus.current = true; onClose(); replayPress(target) }))
  // Details on every opening; arrows keep the tab, for working down a list [INFER].
  const [tab, setTab] = React.useState<PanelTab>("details")
  const isOpen = !!row
  const wasOpenForTab = React.useRef(false)
  React.useLayoutEffect(() => {
    if (isOpen && !wasOpenForTab.current) setTab("details")
    wasOpenForTab.current = isOpen
  }, [isOpen, row?.id])
  // A double click on a row: the first press opens the panel and the page reflows beside it, so the second lands on whatever moved under the pointer and would close the panel again.
  // It does nothing. Only that second press: any press elsewhere, however soon, is a new press and closes (rework 2, item 2 has the same rule for dialogs).
  const opening = React.useRef<{ x: number; y: number; at: number } | null>(null)
  const lastPress = React.useRef<{ x: number; y: number; at: number } | null>(null)
  React.useEffect(() => {
    const onDown = (e: PointerEvent) => { lastPress.current = { x: e.clientX, y: e.clientY, at: Date.now() } }
    window.addEventListener("pointerdown", onDown, true)
    return () => window.removeEventListener("pointerdown", onDown, true)
  }, [])
  // The DS dismisses on the click that ends a press outside (Radix's deferred pointer down). A press whose target is unmounted before release gets no click, so the panel heard nothing and stayed
  // open: the table's floating head goes in the frame after the page scrolls back to its top, under a press made in that moment (task E31). The press is still a click on the page, so it closes here.
  const dirtyNow = React.useRef(dirty)
  dirtyNow.current = dirty
  React.useEffect(() => {
    if (!open) return
    let pressed: Element | null = null
    const onDown = (e: PointerEvent) => { pressed = e.button === 0 && e.target instanceof Element ? e.target : null }
    const onUp = () => {
      const t = pressed
      pressed = null
      // A dirty panel has already asked, on the press (useHoldPagePresses).
      if (!t || t.isConnected || dirtyNow.current) return
      if (t.closest(OWN_SURFACES) || t.closest(ASKS_FOR_ITSELF) || t.closest(NAV_TOGGLE) || onRowBody(t)) return
      closeNow()
    }
    window.addEventListener("pointerdown", onDown, true)
    window.addEventListener("pointerup", onUp, true)
    return () => {
      window.removeEventListener("pointerdown", onDown, true)
      window.removeEventListener("pointerup", onUp, true)
    }
  }, [open, closeNow])
  const wasOpen = React.useRef(false)
  React.useLayoutEffect(() => {
    if (open && !wasOpen.current) opening.current = lastPress.current
    wasOpen.current = open
  }, [open])
  const secondPress = (e: { clientX: number; clientY: number }) => {
    const o = opening.current
    return !!o && Date.now() - o.at < 600 && Math.abs(e.clientX - o.x) < 8 && Math.abs(e.clientY - o.y) < 8
  }
  const secondPressRef = React.useRef(secondPress)
  secondPressRef.current = secondPress
  React.useEffect(() => {
    if (!open) return
    const hold = (e: MouseEvent) => { if (e.detail >= 2 && secondPressRef.current(e)) { e.stopPropagation(); e.preventDefault() } }
    const types = ["mousedown", "mouseup", "click", "dblclick"] as const
    for (const t of types) window.addEventListener(t, hold, true)
    return () => { for (const t of types) window.removeEventListener(t, hold, true) }
  }, [open])
  return (
    <>
      <FloatingSheetPanel open={open} onOpenChange={(o) => !o && closeNow()}>
        <FloatingSheetPanelContent
          side="right"
          size="md"
          contentSlot="lab-skill-detail"
          style={present ? { top: "2.75rem", height: "calc(100dvh - 3.25rem)" } : undefined}
          onInteractOutside={(e) => {
            // One rule for a click on the page (rework item 11). A row swaps the record, without dismissing. Anything else closes the panel and
            // still does its job. With unsaved changes nothing closes by itself: a link waits for the leave guard, a row asks through its own
            // click, and any other press has already asked (useHoldPagePresses) and does not get here.
            const target = e.detail.originalEvent.target as Element | null
            if (e.detail.originalEvent instanceof PointerEvent && secondPress(e.detail.originalEvent)) { e.preventDefault(); return }
            // The press already did its job and took its control away (a banner's action): that is not a click on the page.
            if (target && !target.isConnected) { e.preventDefault(); return }
            // A dialog's overlay belongs to the dialog, also while it fades after closing: that is not a click on the page either.
            if (target?.closest?.("[data-slot=dialog-overlay], [data-slot=alert-dialog-overlay]")) { e.preventDefault(); return }
            if (onRowBody(target)) { e.preventDefault(); return }
            // A link leaves for its own page: closing here would write the URL under it and hold it back (the path bar's Next, with a panel open).
            if (target?.closest?.("a[href]")) { e.preventDefault(); return }
            if (target?.closest?.(NAV_TOGGLE)) { e.preventDefault(); return }
            if (dirty) e.preventDefault()
          }}
          onCloseAutoFocus={(e) => {
            e.preventDefault()
            if (leavesFocus.current) { leavesFocus.current = false; return }
            const link = rowLink(shown.current)
            if (link) link.focus({ preventScroll: true })
            else returnFocus(null)
          }}
        >
          {shownRow ? (
            <>
              <FloatingSheetPanelToolbar
                onPrevious={prev ? () => onOpen(prev.id) : undefined}
                onNext={next ? () => onOpen(next.id) : undefined}
                previousLabel={`Previous ${skillNoun()}`}
                nextLabel={`Next ${skillNoun()}`}
                closeLabel="Close"
                actions={<RowActions row={shownRow} handlers={handlers} inPanel />}
              />
              <FloatingSheetPanelHeader title={shownRow.name} titleClassName="[overflow-wrap:anywhere]" className="data-scrolled:border-transparent [&>div]:pb-2" />
              <ActiveRow row={shownRow} handlers={handlers} />
              {formMounted ? <EditForm key={`${shownRow.id}:${discards}`} row={shownRow} allRows={allRows} saveEdit={api.saveEdit} onEdited={api.clearSaved} onOpen={onOpen} onCancel={closeNow} onDirty={onDirty} tab={tab} onTab={setTab} focusConfigure={focusConfigure === shownRow.id} /> : null}
            </>
          ) : null}
        </FloatingSheetPanelContent>
      </FloatingSheetPanel>
    </>
  )
}
