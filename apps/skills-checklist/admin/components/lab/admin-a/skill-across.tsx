"use client"

/**
 * One skill across the program (course mapping B, CALL 11-02: Sarah, skill first and longitudinal). Courses are rows, terms are
 * columns in date order, each cell is one offering with its own level [REQ CM-03, CM-06] and its own mapped and mandatory counts
 * [REQ CM-04]. A level is set per offering; nothing copies a level into another term (carry forward is OD-01, open) [REQ CM-08].
 * Several offerings take one level at once: tick cells, a course (all its terms) or a term (all its courses), then Set level.
 * The course column is pinned; many terms scroll inside the table region.
 */
import * as React from "react"
import { createPortal } from "react-dom"
import { LabLink as Link } from "@/components/lab/lab-bar/lab-link"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import { Card, CardContent } from "@exxatdesignux/ui/components/ui/card"
import { Checkbox } from "@exxatdesignux/ui/components/ui/checkbox"
import { DataTable } from "@exxatdesignux/ui/components/data-table"
import type { ColumnDef } from "@exxatdesignux/ui/components/data-table/types"
import { configureHref, notConfiguredBlock } from "@/lib/lab/library"
import {
  LEVEL_LABEL,
  LEVEL_SOURCE_LABEL,
  mappingLink,
  setLevel,
  setLevelAcross,
  skillAcrossTerms,
  type CourseAcrossRow,
  type MapLevel,
  type MappingOverlay,
  type SkillOfferingRow,
  type SkillReachRow,
} from "@/lib/lab/mapping"
import type { SkillList } from "@/lib/lab/lists"
import type { V2State } from "@/lib/v2/types"
import { EmptyBlock } from "@/components/lab/empty-block"
import { ScrollLabel } from "@/components/lab/layout/scroll-label"
import { FromListTag, type OfferingFilterProps } from "./mapping-parts"
import { FilterSelect, LINK, LevelSelect, LiveNote, PaneHeading, SearchField, fmt, plural } from "./parts"

type Tick = boolean | "indeterminate"

function tickOf(ids: readonly string[], picked: ReadonlySet<string>): Tick {
  if (!ids.length) return false
  const n = ids.filter((id) => picked.has(id)).length
  return n === 0 ? false : n === ids.length ? true : "indeterminate"
}

/** The offering's identity [REQ CM-01] and its own totals, all skills [REQ CM-04], on the cell's tooltip and the select's name. */
function offeringTitle(r: SkillOfferingRow): string {
  return `${r.code}, ${r.term}, ${r.academicYear}, ${r.cohort}, Year ${r.professionalYear}: ${fmt(r.mapped)} mapped, ${fmt(r.mandatory)} mandatory`
}

export function SkillAcrossPanel({
  state,
  overlay,
  setOverlay,
  skill,
  lists = [],
  didactic = false,
  filter,
}: {
  state: V2State
  overlay: MappingOverlay
  setOverlay: (o: MappingOverlay) => void
  skill: SkillReachRow
  lists?: SkillList[]
  didactic?: boolean
  filter: OfferingFilterProps
}) {
  const f = filter.value
  const listArg = lists.length ? lists : undefined
  const reach = React.useMemo(() => skillAcrossTerms(state, overlay, skill.id, didactic, listArg), [state, overlay, skill.id, didactic, listArg])
  const view = React.useMemo(() => skillAcrossTerms(state, overlay, skill.id, didactic, listArg, f), [state, overlay, skill.id, didactic, listArg, f])
  const narrowed = !!(f.q || f.cohort || f.year)
  const [note, setNote] = React.useState("")
  const [picked, setPicked] = React.useState<Set<string>>(() => new Set())
  const [bulkLevel, setBulkLevel] = React.useState<MapLevel>("mandatory")
  React.useEffect(() => setPicked(new Set()), [skill.id])

  // Scroll cue (anatomy A10): a right-edge fade while later terms are out of view; the course column stays pinned. The DS
  // DataTable has no fade of its own, so the fade is portalled beside its scroll region (its parent is relative, overflow hidden).
  const wrap = React.useRef<HTMLDivElement>(null)
  const [moreRight, setMoreRight] = React.useState(false)
  const [fadeHost, setFadeHost] = React.useState<HTMLElement | null>(null)
  React.useEffect(() => {
    const box = wrap.current?.querySelector<HTMLElement>("[data-slot=scroll-region]")
    setFadeHost(box?.parentElement ?? null)
    if (!box) return
    const update = () => setMoreRight(box.scrollLeft + box.clientWidth < box.scrollWidth - 2)
    update()
    box.addEventListener("scroll", update, { passive: true })
    const ro = new ResizeObserver(update)
    ro.observe(box)
    return () => {
      box.removeEventListener("scroll", update)
      ro.disconnect()
    }
  }, [view, skill.configured])

  const cells = React.useMemo(() => view.rows.flatMap((r) => view.terms.map((t) => r.cells[t.id]).filter((c): c is SkillOfferingRow => !!c)), [view])
  const allIds = React.useMemo(() => cells.map((c) => c.id), [cells])
  // A selection never reaches an offering the filters hide.
  const shownPicked = React.useMemo(() => allIds.filter((id) => picked.has(id)), [allIds, picked])
  // Where levels come from is said once for most offerings (beside the counts) and only the exceptions are marked in their cell.
  const mapped = cells.filter((c) => c.level !== "none")
  const mostFromList = mapped.length > 1 && mapped.filter((c) => c.source === "list").length * 2 > mapped.length

  const toggle = React.useCallback((ids: readonly string[], on: boolean) => {
    setPicked((prev) => {
      const next = new Set(prev)
      for (const id of ids) on ? next.add(id) : next.delete(id)
      return next
    })
  }, [])

  const applyBulk = () => {
    const res = setLevelAcross(state, overlay, shownPicked, skill.id, bulkLevel)
    if (res.changed) setOverlay(res.overlay)
    setNote(
      res.skipped
        ? `${LEVEL_LABEL[bulkLevel]} in ${plural(res.changed, "offering", "offerings")}. ${fmt(res.skipped)} not changed: ${res.reason ?? ""}`
        : `${skill.name}: ${LEVEL_LABEL[bulkLevel].toLowerCase()} in ${plural(res.changed, "offering", "offerings")}.`,
    )
    setPicked(new Set())
  }

  const columns = React.useMemo<ColumnDef<CourseAcrossRow>[]>(() => {
    const base: ColumnDef<CourseAcrossRow>[] = [
      {
        key: "code",
        label: "Course",
        width: 220,
        defaultPin: "left",
        lockPin: true,
        sortable: true,
        header: () => (
          <span className="flex items-center gap-2">
            <Checkbox size="sm" checked={tickOf(allIds, picked)} onCheckedChange={(v) => toggle(allIds, v === true)} aria-label="Select every offering shown" />
            Course
          </span>
        ),
        cell: (r) => {
          const ids = view.terms.map((t) => r.cells[t.id]?.id).filter((x): x is string => !!x)
          const first = view.terms.map((t) => r.cells[t.id]).find(Boolean)
          return (
            <span className="flex min-w-0 items-start gap-2 py-0.5">
              <Checkbox size="sm" className="mt-0.5" checked={tickOf(ids, picked)} onCheckedChange={(v) => toggle(ids, v === true)} aria-label={`Select ${r.code} in every term`} />
              <span className="flex min-w-0 flex-col">
                <Link className={`${LINK} whitespace-normal`} href={mappingLink({ term: first?.termId, offering: first?.id, q: skill.name })} title={`${r.code} ${r.name}`}>{`${r.code} ${r.name}`}</Link>
                {first ? <span className="truncate text-xs text-muted-foreground">{`${first.cohort}${r.kind === "didactic" ? " · Didactic" : ""}`}</span> : null}
              </span>
            </span>
          )
        },
      },
    ]
    for (const t of view.terms) {
      const ids = view.rows.map((r) => r.cells[t.id]?.id).filter((x): x is string => !!x)
      base.push({
        key: `t:${t.id}`,
        label: t.name,
        width: 200,
        resizable: false,
        header: () => (
          <span className="flex items-center gap-2 whitespace-nowrap">
            <Checkbox size="sm" checked={tickOf(ids, picked)} onCheckedChange={(v) => toggle(ids, v === true)} aria-label={`Select every course in ${t.name}`} />
            <span className="flex flex-col leading-tight">
              <span className="text-xs font-medium">{t.name}</span>
              <span className="text-xs font-normal text-muted-foreground">{t.current ? `${t.academicYear} · Current` : t.academicYear}</span>
            </span>
          </span>
        ),
        cell: (r) => {
          const c = r.cells[t.id]
          if (!c) return <span className="text-sm text-muted-foreground" aria-label={`${r.code} has no offering in ${t.name}`}>None</span>
          return (
            <span className="flex flex-col gap-0.5 py-1" title={offeringTitle(c)} data-offering-cell={c.id}>
              <span className="flex items-center gap-2">
                <Checkbox size="sm" checked={picked.has(c.id)} onCheckedChange={(v) => toggle([c.id], v === true)} aria-label={`Select ${c.code}, ${t.name}`} />
                <LevelSelect
                  value={c.level}
                  className="w-36"
                  label={`${skill.name} in ${offeringTitle(c)}`}
                  onChange={(l) => {
                    const res = setLevel(state, overlay, c.id, skill.id, l)
                    if (!res.ok) return setNote(res.reason)
                    setOverlay(res.overlay)
                    setNote(`${skill.name}: ${LEVEL_LABEL[l].toLowerCase()} in ${c.code}, ${t.name}.`)
                  }}
                />
              </span>
              {c.level === "none" || !c.source ? null : mostFromList ? (
                c.source === "list" ? null : <span className="ps-6 text-xs text-muted-foreground" data-level-source={c.source}>{LEVEL_SOURCE_LABEL[c.source]}</span>
              ) : c.source === "list" ? (
                <span className="ps-6"><FromListTag source="list" /></span>
              ) : null}
            </span>
          )
        },
      })
    }
    return base
  }, [view, picked, allIds, toggle, skill, state, overlay, setOverlay, mostFromList])

  return (
    <section aria-labelledby="skill-heading" className="flex min-w-0 flex-col gap-3" data-region="skill" data-skill-across>
      <PaneHeading
        title={<span id="skill-heading">{skill.name}</span>}
        end={
          skill.configured ? (
            <span className="flex items-center gap-4">
            {mostFromList ? <FromListTag source="list" /> : null}
            <span className="text-sm" aria-label={`${reach.carriers} of ${reach.offerings} offerings, ${reach.mandatory} mandatory`}>
              <span className="font-semibold tabular-nums">{fmt(reach.carriers)}</span> <span className="text-muted-foreground">{`of ${fmt(reach.offerings)} offerings`}</span>
              <span className="ms-4 font-semibold tabular-nums">{fmt(reach.mandatory)}</span> <span className="text-muted-foreground">mandatory</span>
            </span>
            </span>
          ) : null
        }
      />
      {!skill.configured ? (
        <Card size="sm" className="self-start">
          <CardContent className="flex flex-col items-start gap-2 py-1">
            <p className="text-sm">{notConfiguredBlock(true)}</p>
            <Button asChild variant="outline" size="sm">
              <Link href={configureHref(skill.id)}>{`Configure ${skill.name}`}</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="flex min-h-8 flex-wrap items-center justify-between gap-2">
            <div role="search" aria-label="Find an offering" className="flex flex-wrap items-center gap-2" data-offering-filters>
              <SearchField value={f.q} onChange={(v) => filter.onChange({ q: v })} label="Search offerings by course, term, cohort or year" placeholder="Search offerings" className="w-56" />
              <FilterSelect value={f.cohort} onChange={(v) => filter.onChange({ cohort: v })} label="Cohort" allLabel="All cohorts" options={filter.cohortOpts} className="w-36" />
              <FilterSelect value={f.year} onChange={(v) => filter.onChange({ year: v })} label="Professional year" allLabel="All years" options={filter.yearOpts} className="w-32" />
            </div>
          {shownPicked.length ? (
            <div role="group" aria-label="Set a level for the selected offerings" className="flex flex-wrap items-center gap-2" data-bulk-bar>
              <span className="text-sm font-medium tabular-nums">{`${plural(shownPicked.length, "offering", "offerings")} selected`}</span>
              <LevelSelect value={bulkLevel} onChange={setBulkLevel} label="Level for the selected offerings" className="w-40" />
              <Button variant="default" size="sm" onClick={applyBulk}>Set level</Button>
              <Button variant="ghost" size="sm" onClick={() => setPicked(new Set())}>Clear selection</Button>
            </div>
          ) : null}
          </div>
          <LiveNote text={note} />
          <div ref={wrap} className="relative min-w-0">
          <ScrollLabel label="Offerings by term">
            <DataTable<CourseAcrossRow>
              key={skill.id}
              data={view.rows}
              columns={columns}
              getRowId={(r) => r.id}
              searchable={false}
              showQueryControls={false}
              edgeInset={false}
              emptyState={narrowed ? <EmptyBlock compact title="No offerings match these filters" body="Clear a filter to see more." /> : <EmptyBlock compact title="No course offerings yet" />}
            />
          </ScrollLabel>
          {moreRight && fadeHost ? createPortal(<span role="presentation" data-edge-fade className="pointer-events-none absolute inset-y-0 right-0 z-10 w-12 bg-gradient-to-l from-[var(--background)] to-transparent" />, fadeHost) : null}
          </div>
        </>
      )}
    </section>
  )
}
