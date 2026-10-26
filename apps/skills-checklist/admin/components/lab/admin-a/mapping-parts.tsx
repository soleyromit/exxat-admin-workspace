"use client"

/**
 * Course mapping building blocks: the offerings list, one offering's skills with a level per skill, the required-skills coverage
 * matrix, and the skill-centric list and panel. DS DataTable throughout; the level is a DS Select; the state is glyph + word.
 * Unconfigured skills say why once (a line above the table) and show "Not configured" in the level cell [REQ IM-09].
 */
import * as React from "react"
import { LabLink as Link } from "@/components/lab/lab-bar/lab-link"
import { Badge } from "@exxatdesignux/ui/components/ui/badge"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import { Card, CardContent } from "@exxatdesignux/ui/components/ui/card"
import { LocalBanner } from "@exxatdesignux/ui/components/ui/banner"
import { DataTable } from "@exxatdesignux/ui/components/data-table"
import type { ColumnDef } from "@exxatdesignux/ui/components/data-table/types"
import { configureHref } from "@/lib/lab/library"
import {
  LEVEL_LABEL,
  LEVEL_SOURCE_LABEL,
  type LevelSource,
  mappingLink,
  offeringById,
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
import { capitalize, countSkills, skillNoun, skillNounPlural } from "@/lib/lab/terms"
import { CLINICAL_ONLY_LABEL, INCLUDE_DIDACTIC_LABEL } from "@/lib/v2/labels"
import type { V2State } from "@/lib/v2/types"
import { EmptyBlock } from "@/components/lab/empty-block"
import { AmberMark, FilterSelect, LINK, LevelGlyph, LevelLegend, LevelSelect, LiveNote, PaneHeading, SearchField, fmt, plural } from "./parts"

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
              <span className="truncate text-xs text-muted-foreground">{`${r.cohort} · Year ${r.professionalYear}`}</span>
            </span>
            <span className="truncate text-xs text-muted-foreground">{r.name}</span>
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
  { value: "required", label: "Required on the default list" },
]

/** A quiet "From list" beside a level inherited from a list assigned to the cohort (lib/lab/mapping.ts resolvedLevels). */
export function FromListTag({ source }: { source: LevelSource | null }) {
  if (source !== "list") return null
  return (
    <span className="whitespace-nowrap text-xs text-muted-foreground" data-level-source="list">
      {LEVEL_SOURCE_LABEL.list}
    </span>
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
        {`No list is assigned to ${cohort} yet. `}
        <Link className={LINK} href={listsHref()}>Assign one</Link>
      </p>
    )
  return (
    <p className="text-sm text-muted-foreground" data-cohort-applies>
      {cohort ? (
        <>
          {`${capitalize(skillNounPlural())} for ${cohort} already apply through `}
          {applied.map((l, i) => (
            <React.Fragment key={l.id}>
              {i ? " and " : ""}
              <Link className={LINK} href={listsHref({ list: l.id })}>{l.name}</Link>
            </React.Fragment>
          ))}
          {". Levels here are overrides."}
        </>
      ) : (
        <>
          {`${capitalize(skillNounPlural())} assigned to a cohort in `}
          <Link className={LINK} href={listsHref()}>Lists</Link>
          {" already apply to its offerings. Levels here are overrides."}
        </>
      )}
    </p>
  )
}

/** Clinical courses first [CALL 10-26, a default pending the client]: a visible "Clinical only" state and one switch to include didactic. */
export function CourseKindLine({ didactic, onChange, clinical, total }: { didactic: boolean; onChange: (on: boolean) => void; clinical: number; total: number }) {
  return (
    <p className="flex flex-wrap items-center gap-x-2 text-sm text-muted-foreground" data-course-kind={didactic ? "all" : "clinical"}>
      {didactic ? <span>{`Clinical and didactic, ${fmt(total)} offerings.`}</span> : <Badge variant="outline">{CLINICAL_ONLY_LABEL}</Badge>}
      {didactic ? null : <span>{`${fmt(clinical)} of ${fmt(total)} offerings.`}</span>}
      <Button type="button" variant="link" size="sm" className="h-auto p-0" onClick={() => onChange(!didactic)}>
        {didactic ? CLINICAL_ONLY_LABEL : INCLUDE_DIDACTIC_LABEL}
      </Button>
    </p>
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
  const unconfigured = rows.filter((r) => !r.configured).length

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
            <Link className={`${LINK} truncate`} href={mappingLink({ term: offering.termId, skill: r.id })}>{r.name}</Link>
            <span className="truncate text-xs text-muted-foreground">{r.section}</span>
          </span>
        ),
      },
      { key: "required", label: "Required", width: 104, cell: (r) => (r.required ? <Badge variant="outline">Required</Badge> : null) },
      {
        key: "level",
        label: `In ${offering.code}`,
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
    <section aria-labelledby="offering-heading" className="flex min-w-0 flex-col gap-3" data-region="offering">
      <PaneHeading
        title={<span id="offering-heading">{`${offering.code} ${offering.name}`}</span>}
        meta={`${offering.term} · ${offering.academicYear} · Year ${offering.professionalYear} · ${offering.cohort}`}
        end={
          <span className="flex items-baseline gap-4 text-sm" data-level-totals aria-label={`${offering.mapped} mapped: ${offering.mandatory} mandatory, ${offering.recommended} recommended, ${offering.optional} optional`}>
            <span><span className="font-semibold tabular-nums">{fmt(offering.mandatory)}</span> <span className="text-muted-foreground">mandatory</span></span>
            <span><span className="font-semibold tabular-nums">{fmt(offering.recommended)}</span> <span className="text-muted-foreground">recommended</span></span>
            <span><span className="font-semibold tabular-nums">{fmt(offering.optional)}</span> <span className="text-muted-foreground">optional</span></span>
          </span>
        }
      />
      <CohortAppliesLine lists={lists} cohort={offering.cohort} />
      <div className="flex flex-wrap items-center gap-2">
        <SearchField value={q} onChange={setQ} label={`Search ${skillNounPlural()} in ${offering.code}`} placeholder={`Search ${skillNounPlural()}`} className="w-56" />
        <FilterSelect value={show} onChange={(v) => setShow(v as Show)} label="Show" allLabel={`All ${skillNounPlural()}`} options={SHOW_OPTS} className="w-52" />
        <span className="ms-auto"><LevelLegend /></span>
      </div>
      {unconfigured ? <p className="text-xs text-muted-foreground">{`${countSkills(unconfigured)} not configured yet sit at the end. Configure them to map them.`}</p> : null}
      {bulkNote ? (
        <LocalBanner variant={bulkNote.skipped ? "warning" : "promo"} title={`${plural(bulkNote.changed, skillNoun(), skillNounPlural())} set to ${LEVEL_LABEL[bulkNote.level].toLowerCase()}`} dismissible onDismiss={() => setBulkNote(null)}>
          {bulkNote.skipped ? `${plural(bulkNote.skipped, "was", "were")} skipped because ${bulkNote.skipped === 1 ? "it is" : "they are"} not configured.` : `Applies to ${offering.code}, ${offering.term} only.`}
        </LocalBanner>
      ) : null}
      <LiveNote text={note} />
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
            <Link className={`${LINK} truncate`} href={mappingLink({ term: termId, skill: r.id })}>{r.name}</Link>
            <span className="truncate text-xs text-muted-foreground">{r.section}</span>
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
        meta={`${fmt(coverage.required)} required on the default list · ${fmt(covered)} in at least one course`}
        end={<LevelLegend />}
      />
      <DataTable<CoverageRow>
        data={coverage.rows}
        columns={columns}
        getRowId={(r) => r.id}
        searchable={false}
        showQueryControls={false}
        edgeInset={false}
        emptyState={<EmptyBlock compact title={`No required ${skillNounPlural()} on the default list yet`} />}
      />
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
            <Link className={`${LINK} truncate`} href={hrefFor(r.id)} scroll={false} onClick={(e) => e.stopPropagation()} aria-current={r.id === selectedId ? "true" : undefined}>{r.name}</Link>
            <span className="truncate text-xs text-muted-foreground">{r.required ? `${r.section} · Required` : r.section}</span>
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
    </div>
  )
}

export function SkillPanel({ state, overlay, setOverlay, skill, termId, termName, lists = [], didactic = false }: { state: V2State; overlay: MappingOverlay; setOverlay: (o: MappingOverlay) => void; skill: SkillReachRow; termId: string; termName: string; lists?: SkillList[]; didactic?: boolean }) {
  const rows = React.useMemo(() => offeringsForSkill(state, overlay, skill.id, termId, didactic, lists.length ? lists : undefined), [state, overlay, skill.id, termId, didactic, lists])
  const [note, setNote] = React.useState("")
  const carriers = rows.filter((r) => r.level !== "none")
  const mandatory = rows.filter((r) => r.level === "mandatory").length

  const columns = React.useMemo<ColumnDef<SkillOfferingRow>[]>(
    () => [
      {
        key: "code",
        label: "Offering",
        width: 260,
        sortable: true,
        cell: (r) => (
          <span className="flex min-w-0 flex-col py-0.5">
            <Link className={`${LINK} truncate`} href={mappingLink({ term: termId, offering: r.id, q: skill.name })}>{`${r.code} ${r.name}`}</Link>
            <span className="truncate text-xs text-muted-foreground">{`${r.cohort} · Year ${r.professionalYear}${r.kind === "didactic" ? " · Didactic" : ""}`}</span>
          </span>
        ),
      },
      {
        key: "level",
        label: "Level",
        width: 200,
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
            <FromListTag source={r.source} />
          </span>
        ),
      },
    ],
    [state, overlay, setOverlay, skill, termId],
  )

  return (
    <section aria-labelledby="skill-heading" className="flex min-w-0 flex-col gap-3" data-region="skill">
      <PaneHeading
        title={<span id="skill-heading">{skill.name}</span>}
        meta={`${skill.section}${skill.required ? " · Required on the default list" : ""}`}
        end={
          skill.configured ? (
            <span className="text-sm" aria-label={`${carriers.length} of ${rows.length} ${termName} courses, ${mandatory} mandatory`}>
              <span className="font-semibold tabular-nums">{fmt(carriers.length)}</span> <span className="text-muted-foreground">{`of ${fmt(rows.length)} courses`}</span>
              <span className="ms-4 font-semibold tabular-nums">{fmt(mandatory)}</span> <span className="text-muted-foreground">mandatory</span>
            </span>
          ) : null
        }
      />
      {!skill.configured ? (
        <Card size="sm" className="self-start">
          <CardContent className="flex flex-col items-start gap-2 py-1">
            <p className="text-sm">{`This ${skillNoun()} has no evaluation model yet, so it cannot be mapped or submitted.`}</p>
            <Button asChild variant="outline" size="sm">
              <Link href={configureHref(skill.id)}>{`Configure ${skill.name}`}</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <CohortAppliesLine lists={lists} />
          <LiveNote text={note} />
          <DataTable<SkillOfferingRow>
            key={skill.id}
            data={rows}
            columns={columns}
            getRowId={(r) => r.id}
            searchable={false}
            showQueryControls={false}
            edgeInset={false}
            emptyState={<EmptyBlock compact title={`No courses in ${termName} yet`} />}
          />
        </>
      )}
    </section>
  )
}
