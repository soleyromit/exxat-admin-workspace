"use client"

/**
 * Course mapping building blocks (rebuilt 2026-11-05, the designer asked for this page to be better): two panes, a light list on the left and
 * one table on the right. The offerings table groups by course and cohort with the DS table's own group rows, so each offering stays its own
 * row [REQ CM-08] and the course name is not repeated. The level is a DS Select. Skills not configured are out of both views, with one note
 * [REQ IM-09]. Coverage is a table by student group [D-L77].
 */
import * as React from "react"
import { LabLink as Link } from "@/components/lab/lab-bar/lab-link"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import { ScrollRegion } from "@exxatdesignux/ui/components/ui/scroll-region"
import { Tip } from "@exxatdesignux/ui/components/ui/tip"
import { DataTable } from "@exxatdesignux/ui/components/data-table"
import { useTableState } from "@exxatdesignux/ui/components/data-table/use-table-state"
import type { ColumnDef } from "@exxatdesignux/ui/components/data-table/types"
import { cn } from "@exxatdesignux/ui/lib/utils"
import {
  LEVELS,
  LEVEL_LABEL,
  changeKey,
  levelRank,
  mappingLink,
  offeringById,
  filterSkillOfferings,
  offeringsForSkill,
  setLevelAcross,
  setLevels,
  skillRowsFor,
  type MapLevel,
  type MappingOverlay,
  type OfferingRow,
  type SkillMapRow,
  type SkillOfferingRow,
  type SkillReachRow,
} from "@/lib/lab/mapping"
import { listsForCohort, listsHref, type SkillList } from "@/lib/lab/lists"
import { capitalize, skillListsNoun, skillNoun, skillNounPlural } from "@/lib/lab/terms"
import type { V2State } from "@/lib/v2/types"
import { EmptyBlock } from "@/components/lab/empty-block"
import { ScrollLabel } from "@/components/lab/layout/scroll-label"
import { useEmbeddedStep } from "@/components/lab/layout/embedded"
import { MappingSaveBar } from "./mapping-frame"
import { AppliedFilterChips, BulkLevelBar, ChangedDot, FiltersControl, LINK, LevelLegend, LevelSelect, PaneHeading, SearchField, type FilterField } from "./parts"

// ---------------------------------------------------------------------------------------------------------------------
// The two panes

/** A row's link moves within the page: unsaved levels stay, and inside Set up skills the workflow stays. A modified click still opens a new tab. */
export function inPlace(e: React.MouseEvent, select: () => void) {
  e.stopPropagation()
  if (e.metaKey || e.ctrlKey || e.shiftKey) return
  e.preventDefault()
  select()
}

/** About 300 px on the left, the rest on the right. Below lg one pane shows at a time: the list, then the detail it leads to. */
export function TwoPane({ left, right, showDetail }: { left: React.ReactNode; right: React.ReactNode; showDetail: boolean }) {
  // One pane at a time shares one scroller, so a row picked far down the list would open its detail just as far down. The detail opens at the top; the way back returns to the row.
  const listTop = React.useRef(0)
  React.useLayoutEffect(() => {
    if (window.matchMedia("(min-width: 64rem)").matches) return
    const page = document.querySelector<HTMLElement>("[data-page-scroll]")
    if (page) page.scrollTop = showDetail ? 0 : listTop.current
  }, [showDetail])
  return (
    <div
      className="grid min-w-0 gap-6 lg:grid-cols-[18.75rem_minmax(0,1fr)]"
      data-two-pane
      onClickCapture={() => {
        if (showDetail) return
        listTop.current = document.querySelector<HTMLElement>("[data-page-scroll]")?.scrollTop ?? 0
      }}
    >
      {/* The DS's pinned group row is a window with a fixed bottom border, so the group row arriving beneath it passes behind that line, text included. The line moves onto the pinned bar, which leaves with its group. The window is portalled to the body, hence a mark on the page rather than a selector under the table. No DS prop reaches it. */}
      <style>{`body:has([data-two-pane]) [aria-hidden="true"]:has(> [data-dt-group-bar]){border-bottom-width:0}body:has([data-two-pane]) [aria-hidden="true"] > [data-dt-group-bar]{box-shadow:inset 0 -1px 0 var(--border)}`}</style>
      <div className={cn("min-w-0 flex-col gap-2 lg:sticky lg:top-4 lg:flex lg:h-[calc(100dvh-13rem)] lg:min-h-96 lg:self-start lg:border-e lg:border-border lg:pe-2", showDetail ? "hidden" : "flex")} data-pane="list">
        {left}
      </div>
      <div className={cn("min-w-0 lg:block", showDetail ? "block" : "hidden")} data-pane="detail">
        {right}
      </div>
    </div>
  )
}

export interface PickRow {
  id: string
  name: string
  meta: string
  /** The plain figure on the right; none reads as a muted dash. */
  count: number
  /** The word after the figure, in its tooltip and accessible name: courses on By skill, so "2" is not read against 4 offerings. */
  countLabel: string
  /** The same when the figure is none. */
  noneLabel: string
  href: string
}

/** Past about this many characters a name no longer fits the 300 px pane, so the row carries a tooltip with all of it. */
const NAME_FITS = 28

/** A name cut off by its cell, in a DS Tip that opens on hover and on keyboard focus, only while it is cut off. The child must take a ref and be focusable. */
function FullName({ name, children }: { name: string; children: React.ReactElement<{ ref?: React.Ref<HTMLElement> }> }) {
  const [cut, setCut] = React.useState(false)
  const ref = React.useRef<HTMLElement | null>(null)
  React.useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const read = () => setCut(el.scrollWidth > el.clientWidth || el.scrollHeight > el.clientHeight)
    read()
    const seen = new ResizeObserver(read)
    seen.observe(el)
    return () => seen.disconnect()
  }, [])
  return <Tip label={name} disabled={!cut}>{React.cloneElement(children, { ref })}</Tip>
}

/** The level's own place in a row: the unsaved dot's space is always held, so the select does not move or narrow when the dot appears. */
function DotSlot({ on }: { on: boolean }) {
  return <span className="inline-flex size-4 shrink-0" data-dot-slot>{on ? <ChangedDot /> : null}</span>
}

/** The left pane's list: rows of even height, name truncated with a tooltip, category beneath, a plain count on the right. It scrolls on its own. */
export function PickList({ label, rows, selectedId, onSelect, empty }: { label: string; rows: PickRow[]; selectedId: string; onSelect: (id: string) => void; empty: React.ReactNode }) {
  // The list keeps its order; the selected row is brought into view inside the list, and the page does not scroll.
  const listRef = React.useRef<HTMLUListElement>(null)
  const hasRows = rows.length > 0
  React.useLayoutEffect(() => {
    const row = selectedId ? listRef.current?.querySelector<HTMLElement>(`[data-pick-row="${CSS.escape(selectedId)}"]`) : null
    let box = row?.parentElement ?? null
    while (box && box.scrollHeight <= box.clientHeight) box = box.parentElement
    if (!row || !box || !box.closest("[data-pick-list]")) return
    const r = row.getBoundingClientRect()
    const b = box.getBoundingClientRect()
    if (r.top < b.top) box.scrollTop -= b.top - r.top
    else if (r.bottom > b.bottom) box.scrollTop += r.bottom - b.bottom
  }, [selectedId, hasRows])
  // One Tab stop for the whole list, arrows inside it: 150 rows must not stand between the keyboard and the table beside them.
  const tabStop = rows.some((r) => r.id === selectedId) ? selectedId : rows[0]?.id
  const onKeyDown = (e: React.KeyboardEvent<HTMLUListElement>) => {
    if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(e.key)) return
    const links = [...e.currentTarget.querySelectorAll<HTMLElement>("[data-pick-row]")]
    const at = links.indexOf(document.activeElement as HTMLElement)
    const next = e.key === "Home" ? 0 : e.key === "End" ? links.length - 1 : at + (e.key === "ArrowDown" ? 1 : -1)
    const to = links[Math.max(0, Math.min(links.length - 1, next))]
    if (!to) return
    e.preventDefault()
    to.focus()
  }
  return (
    // `relative` makes the scroller the containing block of its rows' absolutely positioned .sr-only words. Without it they hang off the sticky pane above it, outside this clip, and stretch the page's scroller to the length of the whole list.
    <ScrollRegion label={label} className="relative min-h-0 flex-1 lg:overflow-y-auto" data-pick-list>
      {rows.length === 0 ? empty : (
        <ul ref={listRef} className="flex flex-col gap-px" onKeyDown={onKeyDown}>
          {rows.map((r) => {
            const on = r.id === selectedId
            const row = (
              <Link
                href={r.href}
                scroll={false}
                data-keeps-draft
                data-pick-row={r.id}
                tabIndex={r.id === tabStop ? 0 : -1}
                aria-current={on ? "true" : undefined}
                onClick={(e) => inPlace(e, () => onSelect(r.id))}
                className={cn("grid min-h-12 grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 rounded-md px-2 py-1 text-sm lg:h-12 lg:py-0 text-foreground no-underline outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring", on && "bg-muted font-medium")}
              >
                <span className="flex min-w-0 flex-col">
                  <span className="[overflow-wrap:anywhere] lg:truncate">{r.name}</span>
                  <span className="truncate text-xs font-normal text-muted-foreground">{r.meta}</span>
                </span>
                {r.count ? (
                  <span className="text-sm font-normal tabular-nums" title={`${r.count.toLocaleString("en-US")} ${r.countLabel}`}>{r.count.toLocaleString("en-US")}<span className="sr-only">{` ${r.countLabel}`}</span></span>
                ) : (
                  <span className="text-sm font-normal text-muted-foreground" title={r.noneLabel}><span aria-hidden="true">–</span><span className="sr-only">{r.noneLabel}</span></span>
                )}
              </Link>
            )
            return <li key={r.id}>{r.name.length > NAME_FITS ? <Tip label={r.name} side="right" triggerClassName="block">{row}</Tip> : row}</li>
          })}
        </ul>
      )}
    </ScrollRegion>
  )
}

/** Below lg, the way back from the detail to the list. */
export function BackToList({ label, onBack }: { label: string; onBack: () => void }) {
  return <Button type="button" variant="ghost" size="sm" className="self-start lg:hidden" onClick={onBack} data-back-to-list>{label}</Button>
}


/**
 * Search and the filters beside the table they filter [REQ CM-02]: the search, one Filters icon, and what is applied as removable chips,
 * at every width (Romit 2026-11-09: no row of dropdowns over a table; the same control as the list pane beside it).
 */
export function FilterLine({ search, fields, label }: { search: (className: string) => React.ReactNode; fields: FilterField[]; label: string }) {
  return (
    <>
      <div className="flex flex-col gap-2" role="search" aria-label={label} data-offering-filters>
        <div className="flex items-center gap-2">
          {search("min-w-0 max-w-sm flex-1")}
          <FiltersControl fields={fields} compact align="end" />
        </div>
        <AppliedFilterChips fields={fields} />
      </div>
    </>
  )
}

// ---------------------------------------------------------------------------------------------------------------------
// One offering's skills (By course, right pane)

export type Show = "" | "mapped" | "mandatory" | "recommended" | "none"
const SHOW_OPTS = [
  { value: "mapped", label: "Mapped only" },
  { value: "mandatory", label: LEVEL_LABEL.mandatory },
  { value: "recommended", label: LEVEL_LABEL.recommended },
  { value: "none", label: LEVEL_LABEL.none },
]

/** "BSN 2026 · Fall 2026 · Year 4": an offering on the left pane, where the course name is above it; its heading adds the academic year. */
export const offeringShortLine = (r: Pick<OfferingRow, "cohort" | "term" | "professionalYear">): string => `${r.cohort} · ${r.term} · Year ${r.professionalYear}`
/** "BSN 2026 · Fall 2026 · 2026-27 · Year 4": what identifies an offering after its course [REQ CM-01]. */
export const offeringLine = (r: Pick<OfferingRow, "cohort" | "term" | "academicYear" | "professionalYear">): string => `${r.cohort} · ${r.term} · ${r.academicYear} · Year ${r.professionalYear}`

/** A cohort with no list assigned: the one thing this pane needs to say about lists, because it is an action. */
export function CohortAppliesLine({ cohort }: { cohort: string }) {
  return (
    <p className="text-sm text-muted-foreground" data-cohort-applies>
      {`No ${skillNounPlural()} are assigned to ${cohort} yet. `}
      <Link className={LINK} href={listsHref()}>{`Open ${capitalize(skillListsNoun())}`}</Link>
    </p>
  )
}

/** Course kind as a filter field: clinical courses by default (CALL 10-26), didactic one choice away. */
export function courseKindField(didactic: boolean, onChange: (on: boolean) => void): FilterField {
  return { id: "courses", label: "Courses", value: didactic ? "didactic" : "", allLabel: "Clinical", options: [{ value: "didactic", label: "Clinical and didactic" }], onChange: (v) => onChange(v === "didactic") }
}

/** Group the DS table by one synthetic field from the first paint: the DS has the group rows, but no prop for a starting group. */
function useGrouped<T extends Record<string, unknown>>(rows: T[], columns: ColumnDef<T>[], field: string) {
  const ts = useTableState<T>(rows, columns)
  const { setGroupBy } = ts
  React.useLayoutEffect(() => setGroupBy(field), [setGroupBy, field])
  return ts
}

/** The select, the dot's slot and the cell's padding. */
const LEVEL_WIDTH = 240
/** The widest the text column gets, so a level stays near its name on a wide screen [M18]; past it the Level column takes the rest. */
const TEXT_MAX = 576

/**
 * The DS table stretches every column in proportion when it is narrower than its container, which pulled the select column off its group row's checkbox and the level far from its name.
 * The DS has no prop for one fill column, so the widths are written to the table's own state, to fill the container exactly: the body and the stuck header (a copy portalled to the body,
 * which no selector under this table can reach) read one set of widths, so they cannot disagree.
 */
function useFillColumn(setColWidths: React.Dispatch<React.SetStateAction<Record<string, number>>>, textKey: string, narrow: boolean) {
  const ref = React.useRef<HTMLDivElement>(null)
  const select = narrow ? 40 : 44
  const level = narrow ? 190 : LEVEL_WIDTH
  const textMin = narrow ? 110 : 240
  React.useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const read = () => {
      // Hidden while the other pane shows on a phone. Less the table's two side borders.
      if (!el.clientWidth) return
      const inner = Math.floor(el.getBoundingClientRect().width) - 2
      const text = Math.max(textMin, Math.min(TEXT_MAX, inner - select - level))
      const rest = Math.max(level, inner - select - text)
      setColWidths((w) => (w[textKey] === text && w.level === rest ? w : { ...w, [textKey]: text, level: rest }))
    }
    read()
    const seen = new ResizeObserver(read)
    seen.observe(el)
    return () => seen.disconnect()
  }, [setColWidths, textKey, select, level, textMin])
  return ref
}

/** The column's own words for its values, so whatever shows a level as text reads Mandatory, Recommended or Not mapped, never the stored value. */
const LEVEL_FILTER = { type: "select" as const, options: LEVELS.map((l) => ({ value: l, label: LEVEL_LABEL[l] })) }

/**
 * The DS has no prop to turn a column's menu off or to leave items out of it, except this: a column locked to the right has no menu. Pins only take effect when the table overflows, and these columns fill it.
 * Every item in the menu is something this page does not ask for (Search, Pin, Wrap Text, Group by this Column, Add Conditional Rule, and that last one opens nothing here), and locking also stops a column being dragged out of order.
 */
const NO_MENU = { lockPin: true, defaultPin: "right" as const }

type CategoryRow = SkillMapRow & { group: string }

export function OfferingPanel({ state, overlay, held, setOverlay, offering, figures, lists, narrow = false, pending, q, onSearch, show, onShow, onOpenSkill, onBack }: { state: V2State; overlay: MappingOverlay; /** The levels the Show filter reads: a draft must not move a row out from under the cursor. */ held: MappingOverlay; setOverlay: (o: MappingOverlay) => void; offering: OfferingRow; /** The offering as saved: its figures move at Save, with the left list's [REQ CM-04]. */ figures: Pick<OfferingRow, "mapped" | "mandatory" | "recommended">; narrow?: boolean; lists: SkillList[]; pending: ReadonlySet<string>; /** This view's own search, in the URL like its filters. */ q: string; onSearch: (q: string) => void; show: Show; onShow: (show: Show) => void; onOpenSkill: (id: string) => void; onBack: () => void }) {
  const showFields: FilterField[] = [{ id: "show", label: "Show", value: show, allLabel: `All ${skillNounPlural()}`, options: SHOW_OPTS, onChange: (v) => onShow(v as Show) }]
  const embedded = useEmbeddedStep() !== null
  const where = `${offering.code}, ${offering.term}`
  // Configured skills only: a skill not configured cannot be mapped [REQ IM-09], and a checkbox that can only fail is no control.
  const rows = React.useMemo(() => skillRowsFor(state, overlay, offeringById(state, offering.id)!, lists).filter((r) => r.configured), [state, overlay, lists, offering.id])
  // Mapped skills first within a category, and categories that hold one first [INFER], so the first screen shows what is mapped. Fixed when the view opens: a level change must not
  // move the row under the cursor. The DS sorts groups by name, and a leading space sorts first and does not show (the Library's Just added group does the same).
  const [order, setOrder] = React.useState<{ rank: Map<string, number>; first: Set<string> } | null>(null)
  const heldLevels = React.useMemo(() => new Map(skillRowsFor(state, held, offeringById(state, offering.id)!, lists).map((r) => [r.id, r.level])), [state, held, lists, offering.id])
  React.useEffect(() => {
    if (order || !rows.length) return
    // Saved levels: reopening an offering with a draft open must not reorder it either.
    const lv = (r: SkillMapRow) => heldLevels.get(r.id) ?? r.level
    setOrder({ rank: new Map([...rows].sort((a, b) => levelRank(lv(a)) - levelRank(lv(b))).map((r, i) => [r.id, i])), first: new Set(rows.filter((r) => lv(r) !== "none").map((r) => r.section)) })
  }, [order, rows, heldLevels])

  const visible = React.useMemo<CategoryRow[]>(() => {
    const t = q.trim().toLowerCase()
    const hits = rows.filter((r) => {
      const level = heldLevels.get(r.id) ?? r.level
      return (!t || r.haystack.includes(t)) && (show === "" || (show === "mapped" ? level !== "none" : level === show))
    })
    return (order ? [...hits].sort((a, b) => (order.rank.get(a.id) ?? 0) - (order.rank.get(b.id) ?? 0)) : hits).map((r) => ({ ...r, group: order?.first.has(r.section) ? ` ${r.section}` : r.section }))
  }, [rows, q, show, order, heldLevels])

  const change = (r: SkillMapRow, level: MapLevel) => setOverlay(setLevels(state, overlay, offering.id, [r.id], level).overlay)

  // The same group row as By skill: the DS table shows an option's node.
  const categoryOptions = React.useMemo(() => [...new Set(visible.map((r) => r.group))].map((value) => ({ value, label: value, node: <span className={cn("text-sm font-medium text-foreground", narrow ? "whitespace-normal [overflow-wrap:anywhere]" : "truncate")}>{value.trim()}</span> })), [visible, narrow])
  const columns: ColumnDef<CategoryRow>[] = [
    { key: "group", label: "Category", filterOnly: true, filter: { type: "select", options: categoryOptions } },
    { key: "select", label: "Select", width: narrow ? 40 : 44, resizable: false },
    {
      key: "name",
      label: capitalize(skillNoun()),
      width: narrow ? 110 : 340,
      ...NO_MENU,
      sortable: true,
      cell: (r) => (narrow && pending.has(changeKey(offering.id, r.id)) ? <span className="flex min-w-0 items-center"><span className="line-clamp-2 whitespace-normal">{r.name}</span><ChangedDot /></span> : embedded ? <FullName name={r.name}><span tabIndex={narrow ? undefined : 0} className={narrow ? "line-clamp-2 whitespace-normal" : "block truncate rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"}>{r.name}</span></FullName> : <FullName name={r.name}><Link className={cn(LINK, narrow ? "line-clamp-2 whitespace-normal" : "block truncate")} href={mappingLink({ by: "skill", skill: r.id })} data-keeps-draft onClick={(e) => inPlace(e, () => onOpenSkill(r.id))}>{r.name}</Link></FullName>),
    },
    {
      key: "level",
      label: "Level",
      width: narrow ? 190 : LEVEL_WIDTH,
      ...NO_MENU,
      filter: LEVEL_FILTER,
      cell: (r) => (
        <span className="flex items-center gap-1.5">
          <LevelSelect value={r.level} className="w-[10.5rem] shrink-0 sm:w-44" onChange={(l) => change(r, l)} label={`${r.name} in ${where}`} />
          {narrow ? null : <DotSlot on={pending.has(changeKey(offering.id, r.id))} />}
        </span>
      ),
    },
  ]
  const ts = useGrouped(visible, columns, "group")
  const fillRef = useFillColumn(ts.setColWidths, "name", narrow)

  const bulk = (selected: Set<string | number>) => (
    <BulkLevelBar n={selected.size} label={`Level for the selected ${skillNounPlural()}`} onApply={(level) => setOverlay(setLevels(state, overlay, offering.id, [...selected].map(String), level).overlay)} />
  )

  return (
    <section aria-labelledby="offering-heading" className="flex min-w-0 flex-col gap-3" data-region="offering" data-cohort={offering.cohort}>
      <BackToList label="All offerings" onBack={onBack} />
      {/* Group check-off belongs to course faculty (Romit 2026-10-28), not to the admin's mapping. */}
      <PaneHeading title={<span id="offering-heading">{`${offering.code} ${offering.name}`}</span>} meta={offeringLine(offering)} />
      <LevelLegend counts={{ mapped: figures.mapped, mandatory: figures.mandatory, recommended: figures.recommended }} />
      {listsForCohort(lists, offering.cohort).length === 0 ? <CohortAppliesLine cohort={offering.cohort} /> : null}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <SearchField value={q} onChange={onSearch} label={`Search ${skillNounPlural()} in ${offering.code}`} placeholder={`Search ${skillNounPlural()}`} className="min-w-0 max-w-sm flex-1" />
          <FiltersControl fields={showFields} compact align="end" />
        </div>
        <AppliedFilterChips fields={showFields} />
      </div>
      <div ref={fillRef} className="min-w-0">
      <ScrollLabel label={capitalize(skillNounPlural())}>
        <DataTable<CategoryRow>
          key={offering.id}
          state={ts}
          data={visible}
          columns={columns}
          getRowId={(r) => r.id}
          getRowSelectionLabel={(r) => `Select ${r.name}`}
          selectable
          searchable={false}
          showQueryControls={false}
          edgeInset={false}
          bulkActionsSlot={(sel) => bulk(sel)}
          stickyFooter={<MappingSaveBar />}
          lazyLoading={{ enabled: visible.length > 60, threshold: 60, chunkSize: 40, loadingLabel: "Loading more" }}
          emptyState={q.trim() ? <EmptyBlock compact title={`No ${skillNounPlural()} match this search`} action={{ label: "Clear search" }} onAction={() => onSearch("")} /> : <EmptyBlock compact title={`No ${skillNounPlural()} match this filter`} action={{ label: "Clear filter" }} onAction={() => onShow("")} />}
        />
      </ScrollLabel>
      </div>
    </section>
  )
}

// ---------------------------------------------------------------------------------------------------------------------
// One skill's offerings (By skill, right pane)

export interface OfferingFilterValue {
  q: string
  cohort: string
  term: string
  academicYear: string
  year: string
  upcoming: boolean
  /** A student group arriving from Coverage: offerings of its cohorts only. */
  cohorts?: ReadonlySet<string> | null
}

type OfferingGroupRow = SkillOfferingRow & { group: string }

/**
 * One skill's level per offering, no term columns: a group row names the course and cohort once, and under it each offering is one row whose level
 * sets that offering only [REQ CM-01, CM-03, CM-06, CM-08]. Groups stay in course order whatever is mapped, so a row does not move between loads. The offering's own mapped and mandatory
 * counts are on By course and in each row's select name [REQ CM-04].
 */
export function SkillPanel({ state, overlay, setOverlay, skill, figures, narrow = false, didactic = false, filter, fields, pending, onSearch, onShowAllTerms, onOpenOffering, onBack }: { state: V2State; overlay: MappingOverlay; setOverlay: (o: MappingOverlay) => void; skill: SkillReachRow; /** The offerings as saved: what each select's name says it holds, moved at Save [REQ CM-04]. */ figures: ReadonlyMap<string, Pick<OfferingRow, "mapped" | "mandatory">>; /** A phone: columns that keep Level on screen. The parent keys the panel on it, because the DS table reads widths once. */ narrow?: boolean; didactic?: boolean; filter: OfferingFilterValue; fields: FilterField[]; pending: ReadonlySet<string>; onSearch: (q: string) => void; onShowAllTerms: () => void; onOpenOffering: (id: string) => void; onBack: () => void }) {
  const inWorkflow = useEmbeddedStep() !== null
  const all = React.useMemo(() => offeringsForSkill(state, overlay, skill.id, "", didactic), [state, overlay, skill.id, didactic])
  const groupOf = (r: Pick<SkillOfferingRow, "code" | "cohort">) => `${r.code}|${r.cohort}`
  const visible = React.useMemo<OfferingGroupRow[]>(() => filterSkillOfferings(all, filter).map((r) => ({ ...r, group: groupOf(r) })), [all, filter])
  const narrowed = !!(filter.q || filter.cohort || filter.term || filter.year || filter.academicYear)

  const apply = (ids: string[], level: MapLevel) => {
    const res = setLevelAcross(state, overlay, ids, skill.id, level)
    if (res.changed) setOverlay(res.overlay)
  }

  // The DS table sorts group rows by their value and shows the option's label, so the value carries the order and the option carries the words.
  const groupOptions = React.useMemo(() => {
    // A phone has no hover, so a long course name wraps there; on a wide screen it cuts off with the full name on hover.
    const fit = narrow ? "whitespace-normal [overflow-wrap:anywhere]" : "truncate"
    const seen = new Map<string, OfferingGroupRow>()
    for (const r of visible) if (!seen.has(r.group)) seen.set(r.group, r)
    return [...seen.entries()].map(([value, r]) => {
      const label = `${r.code} ${r.name} · ${r.cohort}`
      return {
        value,
        label,
        node: inWorkflow
          ? <FullName name={label}><span tabIndex={0} className={cn("text-sm font-medium text-foreground rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring", fit)}>{label}</span></FullName>
          : <FullName name={label}><Link className={cn(LINK, "text-sm font-medium", fit)} href={mappingLink({ by: "course", offering: r.id })} data-keeps-draft onClick={(e) => inPlace(e, () => onOpenOffering(r.id))}>{label}</Link></FullName>,
      }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, inWorkflow, narrow])

  const columns: ColumnDef<OfferingGroupRow>[] = [
    { key: "group", label: "Course", filterOnly: true, filter: { type: "select", options: groupOptions } },
    { key: "select", label: "Select", width: narrow ? 40 : 44, resizable: false },
    {
      key: "term",
      label: "Offering",
      width: narrow ? 110 : 300,
      ...NO_MENU,
      cell: (r) => <span className="flex min-w-0 flex-col sm:block" data-offering-cell><span className="flex items-center whitespace-nowrap sm:inline">{r.term}{narrow && pending.has(changeKey(r.id, skill.id)) ? <ChangedDot /> : null}</span><span className="whitespace-nowrap text-xs text-muted-foreground sm:text-sm sm:text-foreground"><span className="hidden sm:inline">{" · "}</span>{`${r.academicYear} · ${narrow ? "Yr" : "Year"} ${r.professionalYear}`}</span></span>,
    },
    {
      key: "level",
      label: "Level",
      width: narrow ? 190 : LEVEL_WIDTH,
      ...NO_MENU,
      filter: LEVEL_FILTER,
      cell: (r) => (
        <span className="flex items-center gap-1.5" data-offering-row={r.id}>
          <LevelSelect value={r.level} className="w-[10.5rem] shrink-0 sm:w-44" label={`${skill.name} in ${r.code}, ${r.term}, ${r.cohort}: ${figures.get(r.id)?.mapped ?? r.mapped} mapped, ${figures.get(r.id)?.mandatory ?? r.mandatory} mandatory`} onChange={(l) => apply([r.id], l)} />
          {narrow ? null : <DotSlot on={pending.has(changeKey(r.id, skill.id))} />}
        </span>
      ),
    },
  ]
  const ts = useGrouped(visible, columns, "group")
  const fillRef = useFillColumn(ts.setColWidths, "term", narrow)

  const bulk = (selected: Set<string | number>) => <BulkLevelBar n={selected.size} label="Level for the selected offerings" onApply={(level) => apply([...selected].map(String), level)} />
  // Counted across every term; the table opens on current and upcoming. Said only when it would otherwise look like a wrong count.
  const inView = new Set(visible.map((r) => r.id))
  const pastMatches = visible.length === 0 && !filter.term && !filter.academicYear ? filterSkillOfferings(all, { ...filter, upcoming: false }).length : 0
  const pastOnly = !narrowed && !visible.some((r) => r.level !== "none") ? all.filter((r) => r.level !== "none" && !inView.has(r.id) && (!filter.cohorts || filter.cohorts.has(r.cohort))).length : 0

  return (
    <section aria-labelledby="skill-heading" className="flex min-w-0 flex-col gap-3" data-region="skill">
      <BackToList label={`All ${skillNounPlural()}`} onBack={onBack} />
      <PaneHeading title={<span id="skill-heading">{skill.name}</span>} />
      <FilterLine label="Find an offering" fields={fields} search={(className) => <SearchField value={filter.q} onChange={onSearch} label="Search offerings by course, term, cohort or year" placeholder="Search" className={className} />} />
      {pastOnly ? (
        <p className="text-sm text-muted-foreground" data-past-only>
          {`Mapped only on past offerings (${pastOnly}). `}
          <Button type="button" variant="link" size="sm" className="h-auto p-0" onClick={onShowAllTerms}>Show all terms</Button>
        </p>
      ) : null}
      <div ref={fillRef} className="min-w-0">
      <ScrollLabel label="Offerings">
        <DataTable<OfferingGroupRow>
          state={ts}
          data={visible}
          columns={columns}
          getRowId={(r) => r.id}
          getRowSelectionLabel={(r) => `Select ${r.code}, ${r.term}, ${r.cohort}`}
          selectable
          searchable={false}
          showQueryControls={false}
          edgeInset={false}
          bulkActionsSlot={(sel) => bulk(sel)}
          stickyFooter={<MappingSaveBar />}
          emptyState={pastMatches ? <EmptyBlock compact title={filter.q ? `Only past offerings match this search (${pastMatches})` : `Only past offerings match these filters (${pastMatches})`} action={{ label: "Show all terms" }} onAction={onShowAllTerms} /> : filter.q ? <EmptyBlock compact title="No offerings match this search" action={{ label: "Clear search" }} onAction={() => onSearch("")} /> : narrowed ? <EmptyBlock compact title="No offerings match these filters" body="Clear a filter to see more." /> : <EmptyBlock compact title="No current or upcoming offerings" body="Choose All terms to see past ones." />}
        />
      </ScrollLabel>
      </div>
    </section>
  )
}
