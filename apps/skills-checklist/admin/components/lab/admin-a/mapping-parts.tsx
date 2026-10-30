"use client"

/**
 * Course mapping building blocks: the offerings list, one offering's skills with a level per skill, the required-skills coverage
 * matrix, and the skill-centric list and panel. DS DataTable throughout; the level is a DS Select; the state is glyph + word.
 * Unconfigured skills show "Not configured" in the level cell, a link to configure them [REQ IM-09] (the line above the table that repeated it was cut, 2026-10-27).
 */
import * as React from "react"
import { LabLink as Link } from "@/components/lab/lab-bar/lab-link"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import { Card, CardContent } from "@exxatdesignux/ui/components/ui/card"
import { Tip } from "@exxatdesignux/ui/components/ui/tip"
import { LocalBanner } from "@exxatdesignux/ui/components/ui/banner"
import { DataTable } from "@exxatdesignux/ui/components/data-table"
import type { ColumnDef } from "@exxatdesignux/ui/components/data-table/types"
import { configureHref, notConfiguredBlock } from "@/lib/lab/library"
import {
  LEVEL_LABEL,
  LEVEL_SOURCE_LABEL,
  type LevelSource,
  mappingLink,
  offeringById,
  filterSkillOfferings,
  offeringsForSkill,
  setLevel,
  setLevels,
  skillRowsFor,
  type Coverage,
  type CoverageRow,
  type MapLevel,
  type MappingOverlay,
  type OfferingRow,
  type SkillMapRow,
  type SkillOfferingRow,
  type SkillReachRow,
} from "@/lib/lab/mapping"
import { listsForCohort, listsHref, type SkillList } from "@/lib/lab/lists"
import { capitalize, skillNoun, skillNounPlural } from "@/lib/lab/terms"
import type { V2State } from "@/lib/v2/types"
import { EmptyBlock } from "@/components/lab/empty-block"
import { ScrollLabel } from "@/components/lab/layout/scroll-label"
import { AmberMark, FilterSelect, LINK, LevelGlyph, LevelLegend, LevelSelect, LiveNote, PaneHeading, SearchField, fmt, plural, type FilterField } from "./parts"

// ---------------------------------------------------------------------------------------------------------------------
// Offerings list (left pane of variant A)

export function OfferingsTable({ rows, selectedId, hrefFor, onSelect, note }: { rows: OfferingRow[]; selectedId: string; hrefFor: (id: string) => string; onSelect: (id: string) => void; note?: React.ReactNode }) {
  const columns = React.useMemo<ColumnDef<OfferingRow>[]>(
    () => [
      {
        key: "code",
        label: "Offering",
        width: 236,
        sortable: true,
        cell: (r) => (
          <span className="flex min-w-0 flex-col py-0.5">
            <span className="flex min-w-0 items-baseline gap-1.5">
              <Link className={`${LINK} shrink-0`} href={hrefFor(r.id)} scroll={false} onClick={(e) => e.stopPropagation()} aria-current={r.id === selectedId ? "true" : undefined}>
                {r.code}
              </Link>
              <span className="truncate text-xs text-muted-foreground" title={`${r.cohort} · Year ${r.professionalYear}`}>{`${r.cohort} · Year ${r.professionalYear}`}</span>
            </span>
            <span className="truncate text-xs text-muted-foreground" title={r.name}>{r.name}</span>
          </span>
        ),
      },
      { key: "mapped", label: "Mapped", width: 84, sortable: true, cell: (r) => <span className="tabular-nums">{fmt(r.mapped)}</span> },
      { key: "mandatory", label: "Mandatory", width: 100, sortable: true, cell: (r) => <span className="tabular-nums">{fmt(r.mandatory)}</span> },
    ],
    [hrefFor, selectedId],
  )
  return (
    <div data-region="offerings" className="flex min-w-0 flex-col gap-2">
      {note}
      <ScrollLabel label="Offerings">
      <DataTable<OfferingRow>
        data={rows}
        columns={columns}
        getRowId={(r) => r.id}
        openRowId={selectedId || null}
        onRowClick={(r) => onSelect(r.id)}
        searchable={false}
        showQueryControls={false}
        edgeInset={false}
        emptyState={<EmptyBlock compact title="No offerings match these filters" body="Clear a filter to see more." />}
      />
      </ScrollLabel>
    </div>
  )
}

// ---------------------------------------------------------------------------------------------------------------------
// One offering's skills (right pane of variant A)

type Show = "" | "mapped" | "mandatory" | "recommended" | "optional" | "required"
const SHOW_OPTS = [
  { value: "mapped", label: "Mapped" },
  { value: "mandatory", label: LEVEL_LABEL.mandatory },
  { value: "recommended", label: LEVEL_LABEL.recommended },
  { value: "optional", label: LEVEL_LABEL.optional },
  { value: "required", label: "Required to graduate" },
]

/** A quiet "Set by list" beside a level inherited from a list assigned to the cohort (lib/lab/mapping.ts resolvedLevels), with why. */
export const SET_BY_LIST_TIP = "This level comes from the list assigned to the cohort. Change it here for this course only."
export function FromListTag({ source }: { source: LevelSource | null }) {
  if (source !== "list") return null
  return (
    <Tip label={SET_BY_LIST_TIP}>
      <span tabIndex={0} className="cursor-default whitespace-nowrap rounded-sm text-xs text-muted-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring" data-level-source="list">
        {LEVEL_SOURCE_LABEL.list}
      </span>
    </Tip>
  )
}

/**
 * Assignment comes first, course settings second [CALL 10-26]: the lists attached to a cohort already apply to its offerings, and
 * the per-course level is an override. One line, at the top of the pane it governs.
 */
export function CohortAppliesLine({ lists, cohort }: { lists: SkillList[]; cohort?: string }) {
  const applied = cohort ? listsForCohort(lists, cohort) : []
  if (cohort && applied.length === 0)
    return (
      <p className="text-sm text-muted-foreground" data-cohort-applies>
        {`No ${skillNounPlural()} are assigned to ${cohort} yet. `}
        <Link className={LINK} href={listsHref({ view: "assign" })}>Assign them</Link>
      </p>
    )
  return (
    <p className="text-sm text-muted-foreground" data-cohort-applies>
      {cohort ? (
        <>
          {`${cohort} gets these ${skillNounPlural()} from `}
          {applied.map((l, i) => (
            <React.Fragment key={l.id}>
              {i ? " and " : ""}
              <Link className={LINK} href={listsHref({ list: l.id })}>{l.name}</Link>
            </React.Fragment>
          ))}
          {". Levels set here apply to this course only."}
        </>
      ) : (
        <>
          {`Each cohort gets the ${skillNounPlural()} assigned to it in `}
          <Link className={LINK} href={listsHref({ view: "assign" })}>{`Assign ${skillNounPlural()} to student groups`}</Link>
          {". Levels set here apply to that course only."}
        </>
      )}
    </p>
  )
}

/**
 * Clinical, or clinical and didactic, as one filter in the toolbar (Romit 2026-10-28: "too many text"): the course-kind open
 * decision stays a control, not a sentence. The table's own count says how many offerings show.
 */
/** Course kind as a Filters field: clinical courses by default (CALL 10-26), didactic one choice away. */
export function courseKindField(didactic: boolean, onChange: (on: boolean) => void): FilterField {
  return { id: "courses", label: "Courses", value: didactic ? "didactic" : "", allLabel: "Clinical", options: [{ value: "didactic", label: "Clinical and didactic" }], onChange: (v) => onChange(v === "didactic") }
}

export function CourseKindSelect({ didactic, onChange }: { didactic: boolean; onChange: (on: boolean) => void }) {
  return (
    <span data-course-kind={didactic ? "all" : "clinical"}>
      <FilterSelect value={didactic ? "didactic" : ""} onChange={(v) => onChange(v === "didactic")} label="Course kind" allLabel="Clinical" options={[{ value: "didactic", label: "Clinical and didactic" }]} className="w-48" />
    </span>
  )
}

export function OfferingPanel({ state, overlay, setOverlay, offering, lists, focusQuery = "" }: { state: V2State; overlay: MappingOverlay; setOverlay: (o: MappingOverlay) => void; offering: OfferingRow; lists: SkillList[]; focusQuery?: string }) {
  const off = offeringById(state, offering.id)!
  const rows = React.useMemo(() => skillRowsFor(state, overlay, off, lists), [state, overlay, off, lists])
  const [q, setQ] = React.useState(focusQuery)
  React.useEffect(() => setQ(focusQuery), [focusQuery, offering.id])
  const [show, setShow] = React.useState<Show>("")
  const [note, setNote] = React.useState("")
  const [bulkNote, setBulkNote] = React.useState<{ changed: number; skipped: number; level: MapLevel } | null>(null)

  const visible = React.useMemo(() => {
    const t = q.trim().toLowerCase()
    return rows.filter((r) => (!t || r.haystack.includes(t)) && (show === "" || (show === "mapped" ? r.level !== "none" : show === "required" ? r.required : r.level === show)))
  }, [rows, q, show])

  const change = React.useCallback(
    (r: SkillMapRow, level: MapLevel) => {
      const res = setLevel(state, overlay, offering.id, r.id, level)
      if (!res.ok) return setNote(res.reason)
      setOverlay(res.overlay)
      setNote(`${r.name}: ${LEVEL_LABEL[level].toLowerCase()} in ${offering.code}, ${offering.term}.`)
    },
    [state, overlay, offering, setOverlay],
  )

  const columns = React.useMemo<ColumnDef<SkillMapRow>[]>(
    () => [
      { key: "select", label: "Select", width: 44, resizable: false },
      {
        key: "name",
        label: capitalize(skillNoun()),
        width: 220,
        sortable: true,
        cell: (r) => (
          <span className="flex min-w-0 flex-col py-0.5">
            <Link className={`${LINK} whitespace-normal`} href={mappingLink({ term: offering.termId, skill: r.id })} title={r.name}>{r.name}</Link>
            <span className="truncate text-xs text-muted-foreground" title={r.section}>{r.section}</span>
          </span>
        ),
      },
      // Two meanings of "required", named apart (D-X12; 2026-10-30 review): the program's "Required to graduate" is a quiet,
      // read-only fact with a cap glyph under its own header; the course's level (Mandatory, Recommended, Optional) is the
      // control in the next column, headed with the course code. No pill, so it never reads as a second level.
      {
        key: "required",
        label: "To graduate",
        width: 128,
        cell: (r) =>
          r.required ? (
            <span className="flex items-center gap-1.5 text-sm text-muted-foreground" title="Required to graduate">
              <i className="fa-light fa-graduation-cap" aria-hidden="true" />
              Required
            </span>
          ) : null,
      },
      {
        key: "level",
        label: `Level in ${offering.code}`,
        width: 200,
        cell: (r) =>
          r.configured ? (
            <span className="flex items-center gap-2">
              <LevelSelect value={r.level} onChange={(l) => change(r, l)} label={`${r.name} in ${offering.code}`} />
              <FromListTag source={r.source} />
            </span>
          ) : (
            <Link className={`${LINK} text-sm text-muted-foreground`} href={configureHref(r.id)}>Not configured</Link>
          ),
      },
    ],
    [offering, change],
  )

  const bulk = (selected: Set<string | number>) => {
    const ids = [...selected].map(String)
    const apply = (level: MapLevel) => {
      const r = setLevels(state, overlay, offering.id, ids, level)
      setOverlay(r.overlay)
      setBulkNote({ changed: r.changed, skipped: r.skipped, level })
    }
    return (
      <span className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-muted-foreground">Set to</span>
        <Button type="button" variant="outline" size="sm" onClick={() => apply("mandatory")}>{LEVEL_LABEL.mandatory}</Button>
        <Button type="button" variant="outline" size="sm" onClick={() => apply("recommended")}>{LEVEL_LABEL.recommended}</Button>
        <Button type="button" variant="outline" size="sm" onClick={() => apply("optional")}>{LEVEL_LABEL.optional}</Button>
        <Button type="button" variant="ghost" size="sm" onClick={() => apply("none")}>{LEVEL_LABEL.none}</Button>
      </span>
    )
  }

  return (
    <section aria-labelledby="offering-heading" className="flex min-w-0 flex-col gap-3" data-region="offering" data-cohort={offering.cohort}>
      {/* Romit 2026-10-28 ("too many text, too crowded"): term, year and cohort already show in the filters and the selected row,
          so the header is the name; the counts and the level key are one row; the "gets these from" line is gone (each row says
          "Set by list") unless the cohort has no list, which is an action. Group check-off belongs to course faculty (Romit
          2026-10-28), not to the admin's mapping. */}
      <PaneHeading title={<span id="offering-heading">{`${offering.code} ${offering.name}`}</span>} />
      <LevelLegend counts={{ mapped: offering.mapped, mandatory: offering.mandatory, recommended: offering.recommended, optional: offering.optional }} />
      {listsForCohort(lists, offering.cohort).length === 0 ? <CohortAppliesLine lists={lists} cohort={offering.cohort} /> : null}
      <div className="flex flex-wrap items-center gap-2">
        <SearchField value={q} onChange={setQ} label={`Search ${skillNounPlural()} in ${offering.code}`} placeholder={`Search ${skillNounPlural()}`} className="w-56" />
        <FilterSelect value={show} onChange={(v) => setShow(v as Show)} label="Show" allLabel={`All ${skillNounPlural()}`} options={SHOW_OPTS} className="w-52" />
      </div>
      {bulkNote ? (
        <LocalBanner variant={bulkNote.skipped ? "warning" : "promo"} title={`${plural(bulkNote.changed, skillNoun(), skillNounPlural())} set to ${LEVEL_LABEL[bulkNote.level].toLowerCase()}`} dismissible onDismiss={() => setBulkNote(null)}>
          {bulkNote.skipped ? `${plural(bulkNote.skipped, "was", "were")} skipped because ${bulkNote.skipped === 1 ? "it is" : "they are"} not configured.` : `Applies to ${offering.code}, ${offering.term} only.`}
        </LocalBanner>
      ) : null}
      <LiveNote text={note} />
      <ScrollLabel label={capitalize(skillNounPlural())}>
      <DataTable<SkillMapRow>
        key={offering.id}
        data={visible}
        columns={columns}
        getRowId={(r) => r.id}
        getRowSelectionLabel={(r) => `Select ${r.name}`}
        selectable
        searchable={false}
        showQueryControls={false}
        edgeInset={false}
        bulkActionsSlot={(sel) => bulk(sel)}
        lazyLoading={{ enabled: visible.length > 60, threshold: 60, chunkSize: 40, loadingLabel: "Loading more" }}
        emptyState={<EmptyBlock compact title={`No ${skillNounPlural()} match these filters`} body="Clear the search or the filter." />}
      />
      </ScrollLabel>
    </section>
  )
}

// ---------------------------------------------------------------------------------------------------------------------
// Coverage matrix: required skills by the term's offerings

export function CoverageMatrix({ coverage, termName, termId }: { coverage: Coverage; termName: string; termId: string }) {
  const columns = React.useMemo<ColumnDef<CoverageRow>[]>(() => {
    const base: ColumnDef<CoverageRow>[] = [
      {
        key: "name",
        label: `Required ${skillNoun()}`,
        width: 220,
        defaultPin: "left",
        lockPin: true,
        sortable: true,
        cell: (r) => (
          <span className="flex min-w-0 flex-col py-0.5">
            <Link className={`${LINK} whitespace-normal`} href={mappingLink({ term: termId, skill: r.id })} title={r.name}>{r.name}</Link>
            <span className="truncate text-xs text-muted-foreground" title={r.section}>{r.section}</span>
          </span>
        ),
      },
      {
        key: "carriers",
        label: "Courses",
        width: 128,
        defaultPin: "left",
        sortable: true,
        cell: (r) => (r.carriers === 0 ? <AmberMark label="In no course" /> : <span className="text-sm tabular-nums">{`${r.carriers}${r.mandatoryCarriers ? `, ${r.mandatoryCarriers} mandatory` : ""}`}</span>),
      },
    ]
    for (const c of coverage.columns) {
      base.push({
        key: `c:${c.offeringId}`,
        label: c.code,
        width: 84,
        resizable: false,
        header: () => (
          <span className="flex flex-col whitespace-nowrap leading-tight">
            <span className="text-xs font-medium">{c.code}</span>
            <span className="text-xs font-normal text-muted-foreground">{c.cohort}</span>
          </span>
        ),
        cell: (r) => {
          const lv = r.cells[c.offeringId] ?? "none"
          return (
            <Link
              href={mappingLink({ term: termId, offering: c.offeringId, q: r.name })}
              className="flex h-8 w-10 items-center justify-center rounded-sm hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label={`${r.name} in ${c.code}, ${c.cohort}: ${LEVEL_LABEL[lv]}. Open the offering`}
            >
              <LevelGlyph level={lv} />
            </Link>
          )
        },
      })
    }
    return base
  }, [coverage, termId])
  const covered = coverage.rows.length - coverage.gaps.length
  return (
    <section aria-labelledby="coverage-heading" className="flex min-w-0 flex-col gap-3" data-region="coverage">
      <PaneHeading
        title={<span id="coverage-heading">{`Required ${skillNounPlural()} by ${termName} course`}</span>}
        meta={`${fmt(coverage.required)} required to graduate · ${fmt(covered)} in at least one course`}
        end={<LevelLegend />}
      />
      <ScrollLabel label="Coverage">
      <DataTable<CoverageRow>
        data={coverage.rows}
        columns={columns}
        getRowId={(r) => r.id}
        searchable={false}
        showQueryControls={false}
        edgeInset={false}
        emptyState={<EmptyBlock compact title={`No required ${skillNounPlural()} to graduate yet`} />}
      />
      </ScrollLabel>
    </section>
  )
}

// ---------------------------------------------------------------------------------------------------------------------
// Skill-centric (variant B)

export function SkillReachTable({ rows, selectedId, termName, hrefFor, onSelect, note }: { rows: SkillReachRow[]; selectedId: string; termName: string; hrefFor: (id: string) => string; onSelect: (id: string) => void; note?: React.ReactNode }) {
  const columns = React.useMemo<ColumnDef<SkillReachRow>[]>(
    () => [
      {
        key: "name",
        label: capitalize(skillNoun()),
        width: 250,
        sortable: true,
        cell: (r) => (
          <span className="flex min-w-0 flex-col py-0.5">
            <Link className={`${LINK} whitespace-normal`} href={hrefFor(r.id)} scroll={false} onClick={(e) => e.stopPropagation()} aria-current={r.id === selectedId ? "true" : undefined}>{r.name}</Link>
            <span className="truncate text-xs text-muted-foreground" title={r.required ? `${r.section} · Required` : r.section}>{r.required ? `${r.section} · Required` : r.section}</span>
          </span>
        ),
      },
      {
        key: "carriers",
        label: `${termName} courses`,
        width: 168,
        sortable: true,
        cell: (r) =>
          !r.configured ? (
            <span className="text-sm text-muted-foreground">Not configured</span>
          ) : r.carriers === 0 ? (
            r.required ? <AmberMark label="In no course" /> : <span className="text-sm text-muted-foreground">None</span>
          ) : (
            <span className="text-sm tabular-nums">{`${r.carriers}${r.mandatoryCarriers ? `, ${r.mandatoryCarriers} mandatory` : ""}`}</span>
          ),
      },
    ],
    [hrefFor, selectedId, termName],
  )
  return (
    <div data-region="skills" className="flex min-w-0 flex-col gap-2">
      {note}
      <ScrollLabel label={capitalize(skillNounPlural())}>
      <DataTable<SkillReachRow>
        data={rows}
        columns={columns}
        getRowId={(r) => r.id}
        openRowId={selectedId || null}
        onRowClick={(r) => onSelect(r.id)}
        searchable={false}
        showQueryControls={false}
        edgeInset={false}
        lazyLoading={{ enabled: rows.length > 60, threshold: 60, chunkSize: 40, loadingLabel: "Loading more" }}
        emptyState={<EmptyBlock compact title={`No ${skillNounPlural()} match these filters`} body="Clear a filter to see more." />}
      />
      </ScrollLabel>
    </div>
  )
}

/** Offering filters in variant B's pane [REQ CM-02]: search (course, term, academic year, cohort, year), cohort, professional year. */
export interface OfferingFilterProps {
  value: { q: string; cohort: string; year: string }
  onChange: (next: Partial<{ q: string; cohort: string; year: string }>) => void
  cohortOpts: { value: string; label: string }[]
  yearOpts: { value: string; label: string }[]
}

/** The offering's identity line in B's pane: academic year, cohort, professional year (term is the toolbar's) [REQ CM-01]. */
function offeringMeta(r: SkillOfferingRow): string {
  return `${r.academicYear} · ${r.cohort} · Year ${r.professionalYear}${r.kind === "didactic" ? " · Didactic" : ""}`
}

export function SkillPanel({ state, overlay, setOverlay, skill, termId, termName, lists = [], didactic = false, filter }: { state: V2State; overlay: MappingOverlay; setOverlay: (o: MappingOverlay) => void; skill: SkillReachRow; termId: string; termName: string; lists?: SkillList[]; didactic?: boolean; filter?: OfferingFilterProps }) {
  const all = React.useMemo(() => offeringsForSkill(state, overlay, skill.id, termId, didactic, lists.length ? lists : undefined), [state, overlay, skill.id, termId, didactic, lists])
  const f = filter?.value
  const rows = React.useMemo(() => (f ? filterSkillOfferings(all, f) : all), [all, f])
  const narrowed = !!(f && (f.q || f.cohort || f.year))
  const [note, setNote] = React.useState("")
  // The heading counts stay on the term's offerings (the skill's reach); the filters only narrow the table below.
  const carriers = all.filter((r) => r.level !== "none")
  const mandatory = all.filter((r) => r.level === "mandatory").length
  // When every shown offering takes its level from a list, "Set by list" is said once in the column header, not on each row
  // (anatomy A12, 2026-10-30: nine rows each read "Set by list").
  const allFromList = rows.length > 1 && rows.every((r) => r.source === "list")

  const columns = React.useMemo<ColumnDef<SkillOfferingRow>[]>(
    () => [
      {
        key: "code",
        label: "Offering",
        width: 230,
        sortable: true,
        cell: (r) => (
          <span className="flex min-w-0 flex-col py-0.5">
            <Link className={`${LINK} whitespace-normal`} href={mappingLink({ term: termId, offering: r.id, q: skill.name })} title={`${r.code} ${r.name}`}>{`${r.code} ${r.name}`}</Link>
            <span className="truncate text-xs text-muted-foreground" title={offeringMeta(r)}>{offeringMeta(r)}</span>
          </span>
        ),
      },
      {
        key: "level",
        label: "Level",
        ...(allFromList ? { header: () => <span className="inline-flex items-center gap-2">Level <FromListTag source="list" /></span> } : {}),
        // Wide enough for the select and "Set by list" beside it (anatomy A10, 2026-10-30).
        width: 230,
        cell: (r) => (
          <span className="flex items-center gap-2">
            <LevelSelect
              value={r.level}
              label={`${skill.name} in ${r.code}`}
              onChange={(l) => {
                const res = setLevel(state, overlay, r.id, skill.id, l)
                if (!res.ok) return setNote(res.reason)
                setOverlay(res.overlay)
                setNote(`${skill.name}: ${LEVEL_LABEL[l].toLowerCase()} in ${r.code}.`)
              }}
            />
            {allFromList ? null : <FromListTag source={r.source} />}
          </span>
        ),
      },
      // The offering's own totals (all skills), so each offering's mapped and mandatory counts read here too [REQ CM-04].
      { key: "mapped", label: "Mapped", width: 84, sortable: true, cell: (r) => <span className="tabular-nums">{fmt(r.mapped)}</span> },
      { key: "mandatory", label: "Mandatory", width: 100, sortable: true, cell: (r) => <span className="tabular-nums">{fmt(r.mandatory)}</span> },
    ],
    [state, overlay, setOverlay, skill, termId, allFromList],
  )

  return (
    <section aria-labelledby="skill-heading" className="flex min-w-0 flex-col gap-3" data-region="skill">
      <PaneHeading
        title={<span id="skill-heading">{skill.name}</span>}
        end={
          skill.configured ? (
            <span className="text-sm" aria-label={`${carriers.length} of ${all.length} ${termName} courses, ${mandatory} mandatory`}>
              <span className="font-semibold tabular-nums">{fmt(carriers.length)}</span> <span className="text-muted-foreground">{`of ${fmt(all.length)} courses`}</span>
              <span className="ms-4 font-semibold tabular-nums">{fmt(mandatory)}</span> <span className="text-muted-foreground">mandatory</span>
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
          {filter ? (
            <div role="search" aria-label="Find an offering" className="flex flex-wrap items-center gap-2" data-offering-filters>
              <SearchField value={filter.value.q} onChange={(v) => filter.onChange({ q: v })} label="Search offerings by course, term, cohort or year" placeholder="Search offerings" className="w-56" />
              <FilterSelect value={filter.value.cohort} onChange={(v) => filter.onChange({ cohort: v })} label="Cohort" allLabel="All cohorts" options={filter.cohortOpts} className="w-36" />
              <FilterSelect value={filter.value.year} onChange={(v) => filter.onChange({ year: v })} label="Professional year" allLabel="All years" options={filter.yearOpts} className="w-32" />
            </div>
          ) : null}
          <LiveNote text={note} />
          <ScrollLabel label="Offerings">
          <DataTable<SkillOfferingRow>
            key={skill.id}
            data={rows}
            columns={columns}
            getRowId={(r) => r.id}
            searchable={false}
            showQueryControls={false}
            edgeInset={false}
            emptyState={narrowed ? <EmptyBlock compact title="No offerings match these filters" body="Clear a filter to see more." /> : <EmptyBlock compact title={`No courses in ${termName} yet`} />}
          />
          </ScrollLabel>
        </>
      )}
    </section>
  )
}
