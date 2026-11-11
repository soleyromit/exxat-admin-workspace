"use client"

/**
 * Chrome shared by both course mapping variants: page header with Save changes, the demo states, and the shared model (offerings, term options).
 * The body is components/lab/admin-a/mapping-views.tsx.
 */
import * as React from "react"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import { PageFrame } from "@/components/skills/page-header"
import { LAB_ADMIN } from "@/lib/lab/library"
import { ALL_TERMS, changeKey, offeringRows, overlayChanges, pendingLevelsLine, savedLevelsLine, termOptions, tidyOverlay, unconfiguredCount, type MappingOverlay, type OfferingRow } from "@/lib/lab/mapping"
import type { SkillList } from "@/lib/lab/lists"
import { skillNounPlural } from "@/lib/lab/terms"
import type { V2State } from "@/lib/v2/types"
import { ErrorState, LoadingState, type Opt } from "./parts"
import { EmptyBlock } from "@/components/lab/empty-block"
import { useEmbeddedStep } from "@/components/lab/layout/embedded"
import { returnFocus } from "@/components/lab/shared/focus"
import { DiscardChangesDialog, useLeaveGuard } from "@/components/lab/shared/unsaved-guard"
import { ResultBanner, type ResultBannerValue } from "@/components/lab/shared/result-banner"
import { useAdminData, useLists, useMappingOverlay, type AdminData } from "./use-admin-data"

export interface MappingModel extends AdminData {
  state: V2State
  overlay: MappingOverlay
  setOverlay: (o: MappingOverlay) => void
  lists: SkillList[]
  offerings: OfferingRow[]
  /** The offerings as saved: the left list's figures, which move at Save like every figure outside the right pane. */
  savedOfferings: OfferingRow[]
  /** The levels as saved. Coverage and the left lists read these, so a draft moves nothing but the right pane. */
  saved: MappingOverlay
  /** The levels a list filters by. Saved levels, except inside a step, which writes at once: there, the levels when the filters were last changed. */
  held: MappingOverlay
  termOpts: Opt[]
  cohortOpts: Opt[]
  yearOpts: Opt[]
  /** Academic years of the program's terms [REQ CM-02]. */
  academicYearOpts: Opt[]
  /** Levels changed and not saved, by `changeKey`: the row's mark, with the line beside Save. */
  pending: ReadonlySet<string>
  /** Why there is nothing to map yet, in place of the tables; the view toggle stays. */
  nothingToMap: React.ReactNode | null
  /** Didactic courses included (URL ?incl=didactic). Default false: clinical courses only (CALL 10-26, pending the client). */
  didactic: boolean
  setDidactic: (on: boolean) => void
}

/** Set only while there is something to save. */
const SaveBarContext = React.createContext<{ pending: string; save: () => void } | null>(null)

/**
 * The header's Save, in view while the header is not (map D8): the DS table's foot stack, under the bulk bar, so it covers neither that nor the stuck head. Only while there is something to save
 * and the header's Save is not wholly on screen, so one filled button shows at a time. The DS table takes it as `stickyFooter`; it is always mounted there, so the bulk bar does not remount when a
 * draft begins. A focused control is never left under it (WCAG 2.4.11): on a focus, the page moves it clear of the foot stack.
 */
export function MappingSaveBar() {
  const value = React.useContext(SaveBarContext)
  const [away, setAway] = React.useState(false)
  const bar = React.useRef<HTMLDivElement>(null)
  const dirty = !!value
  React.useEffect(() => {
    const port = document.querySelector<HTMLElement>("[data-page-scroll]")
    const header = document.querySelector<HTMLElement>("[data-mapping-save]")
    if (!dirty || !port || !header) return setAway(false)
    const seen = new IntersectionObserver(([e]) => setAway(!!e && e.intersectionRatio < 1), { root: port, threshold: 1 })
    seen.observe(header)
    return () => seen.disconnect()
  }, [dirty])
  const showing = dirty && away
  React.useEffect(() => {
    const port = document.querySelector<HTMLElement>("[data-page-scroll]")
    const stack = bar.current?.parentElement
    if (!showing || !port || !stack) return
    // Scrolled by hand, not with scroll-padding: that also reads the bar's own Save as out of view, and focusing it would move the page.
    const clear = () => {
      const el = document.activeElement
      if (!el || !port.contains(el) || stack.contains(el)) return
      const over = el.getBoundingClientRect().bottom + 8 - stack.getBoundingClientRect().top
      if (over > 0) port.scrollTop += over
    }
    // The bar can arrive under the select that just made the draft, which takes focus back as its list closes.
    const after = requestAnimationFrame(() => requestAnimationFrame(clear))
    port.addEventListener("focusin", clear)
    return () => {
      cancelAnimationFrame(after)
      port.removeEventListener("focusin", clear)
    }
  }, [showing])
  return (
    <div ref={bar} className={showing ? "flex flex-wrap items-center justify-end gap-x-3 gap-y-1 border-t border-border bg-background px-3 py-2" : "hidden"} data-mapping-save-bar={showing ? "" : undefined}>
      {showing && value ? (
        <>
          <span className="text-sm text-muted-foreground">{value.pending}</span>
          <Button type="button" variant="default" size="sm" onClick={value.save}>Save changes</Button>
        </>
      ) : null}
    </div>
  )
}

export function MappingFrame({ variant, children }: { variant: string; children: (m: MappingModel) => React.ReactNode }) {
  // The URL alone holds this page's filters: a link opens what it says (D8).
  const data = useAdminData({ pageFilters: true })
  const [saved, writeSaved] = useMappingOverlay()
  const { lists } = useLists(data.state)
  const state = data.state
  const didactic = data.query.get("incl") === "didactic"
  // Levels are a draft like Assign (map D8): the page's Save writes them. Inside Set up skills a step has no page Save, so they write at once.
  const embedded = useEmbeddedStep() !== null
  const [draft, setDraft] = React.useState<MappingOverlay | null>(null)
  const overlay = !embedded && draft ? draft : saved
  // A step has no Save to re-filter at, so its filtered list stands until the admin changes a filter or the view.
  const heldKey = ["by", "show", "lv", "cat", "sg", "list", "q", "incl"].map((k) => data.query.get(k)).join("|")
  const heldRef = React.useRef({ key: heldKey, levels: saved })
  if (!embedded || heldRef.current.key !== heldKey) heldRef.current = { key: heldKey, levels: saved }
  const held = heldRef.current.levels
  const [banner, setBanner] = React.useState<ResultBannerValue | null>(null)
  const lastLevel = React.useRef<HTMLElement | null>(null)
  const setOverlay = React.useCallback((next: MappingOverlay) => {
    if (embedded) {
      // No page Save inside a step, so the write itself is the result, said where it can be seen.
      const done = state ? overlayChanges(state, saved, next) : []
      writeSaved(next)
      setBanner(state && done.length ? { variant: "success", title: savedLevelsLine(state, done) } : null)
    } else {
      setBanner(null)
      setDraft(next)
    }
  }, [embedded, writeSaved, state, saved])
  const changes = React.useMemo(() => (state && draft && !embedded ? overlayChanges(state, saved, draft) : []), [state, draft, embedded, saved])
  const pendingKeys = React.useMemo(() => new Set(changes.map((c) => changeKey(c.offeringId, c.skillId))), [changes])
  const dirty = changes.length > 0
  // The draft belongs to the page: the view toggle and Back between views both keep it. Leaving the page asks.
  const leave = useLeaveGuard(dirty, { backWithinPage: !embedded })
  const model = React.useMemo(() => {
    if (!state) return null
    const offerings = offeringRows(state, overlay)
    const opts = termOptions(state)
    return {
      offerings,
      savedOfferings: overlay === saved ? offerings : offeringRows(state, saved),
      termOpts: [{ value: ALL_TERMS, label: "All terms" }, ...opts.map((t) => ({ value: t.id, label: t.name, group: t.academicYear }))],
      cohortOpts: (state.cohorts ?? []).map((c) => ({ value: c.id, label: c.name })),
      yearOpts: [1, 2, 3, 4].map((y) => ({ value: String(y), label: `Year ${y}` })),
      academicYearOpts: [...new Set(opts.map((t) => t.academicYear))].map((y) => ({ value: y, label: y })),
      didactic,
    }
  }, [state, overlay, saved, didactic])
  const setDidactic = React.useCallback((on: boolean) => data.query.set({ incl: on ? "didactic" : null }), [data.query])
  const save = () => {
    if (!state || !draft) return
    const before = saved
    writeSaved(tidyOverlay(state, draft))
    setDraft(null)
    setBanner({ variant: "success", title: savedLevelsLine(state, changes), action: { label: "Undo", onClick: () => { writeSaved(before); setBanner(null) } } })
    focusPaneAfterSave(lastLevel.current)
  }
  const pending = state && model && dirty ? pendingLevelsLine(state, changes, model.offerings) : ""
  const saveBar = pending && !embedded ? { pending, save } : null

  // Why the page is empty, in a program that has nothing to map yet [REQ IM-09]; filters have their own empty line.
  const usable = state ? state.skills.filter((k) => k.active !== false).length - unconfiguredCount({ ...state, skills: state.skills.filter((k) => k.active !== false) }) : 0
  let body: React.ReactNode
  if (!data.ready || !state || !model) body = <LoadingState label="Loading course mapping" />
  else if (data.demo === "error") body = <ErrorState what="Course mapping" onRetry={data.retry} />
  else if (data.demo === "empty" && variant === "B") body = <NothingConfigured />
  else if (data.demo === "empty" || (state.offerings ?? []).length === 0) body = <EmptyBlock title="No course offerings yet" body="Offerings appear when courses are set up." />
  else body = children({ ...data, state, overlay, saved, held, setOverlay, lists, ...model, pending: pendingKeys, setDidactic, nothingToMap: usable > 0 ? null : <NothingConfigured /> })

  return (
    // Navigation model A (D-L42): no flow footer.
    <div
      className="flex min-h-[calc(100dvh-5.5rem)] w-full flex-col"
      onFocusCapture={(e) => {
        const level = (e.target as HTMLElement).closest<HTMLElement>("[data-level]")
        if (level) lastLevel.current = level
      }}
    >
      <PageFrame
        title="Course mapping"
        className="flex-1"
        actions={
          embedded ? undefined : (
            <span className="flex flex-wrap items-center justify-end gap-3">
              {pending ? <span className="hidden text-sm text-muted-foreground sm:inline" role="status" data-levels-pending>{pending}</span> : null}
              <Button type="button" variant="default" size="sm" disabled={!dirty} onClick={save} data-mapping-save>Save changes</Button>
            </span>
          )
        }
      >
        <div className="flex flex-col gap-4" data-page-type="list" data-admin-lab={`course-mapping-${variant}`}>
          {/* A phone's header has no room beside Save, so the same line sits at the top of the page. */}
          {pending && !embedded ? <p className="text-sm text-muted-foreground sm:hidden" role="status" data-levels-pending-phone>{pending}</p> : null}
          <SaveBarContext.Provider value={saveBar}>{body}</SaveBarContext.Provider>
        </div>
      </PageFrame>
      <ResultBanner banner={banner} onDismiss={() => setBanner(null)} />
      <DiscardChangesDialog open={leave.asking} onKeep={() => leave.setAsking(false)} onDiscard={() => leave.go(() => setDraft(null))} body="Your levels have not been saved." />
    </div>
  )
}

/**
 * Save has just disabled itself: focus moves to the heading of the record the admin is on, else the page title, never the body. Saved from the bar, far down a long table, the heading has scrolled
 * away and focus would be out of sight: it stays where the admin is, on the level last changed, else the first level on screen.
 */
function focusPaneAfterSave(lastLevel: HTMLElement | null) {
  requestAnimationFrame(() => {
    const port = document.querySelector<HTMLElement>("[data-page-scroll]")?.getBoundingClientRect()
    const onScreen = (el: HTMLElement | null): el is HTMLElement => {
      const r = el?.isConnected ? el.getBoundingClientRect() : null
      return !!r && !!port && r.height > 0 && r.top >= port.top && r.bottom <= port.bottom
    }
    const heading = [...document.querySelectorAll<HTMLElement>('main [data-region="skill"] h2, main [data-region="offering"] h2')].find((h) => h.getClientRects().length > 0)
    if (!heading) return returnFocus(null)
    if (!onScreen(heading)) {
      const level = [lastLevel, ...document.querySelectorAll<HTMLElement>("main [data-region] [data-level]")].find(onScreen)
      if (level) return level.focus({ preventScroll: true })
    }
    heading.setAttribute("tabindex", "-1")
    heading.focus({ preventScroll: true })
  })
}

/** Unconfigured skills cannot be mapped [REQ IM-09]: the page says so, and where to go (map D8). */
function NothingConfigured() {
  return <EmptyBlock title={`Set how ${skillNounPlural()} are judged first.`} action={{ label: "Open Evaluation settings", href: `${LAB_ADMIN}/evaluation-settings` }} />
}
