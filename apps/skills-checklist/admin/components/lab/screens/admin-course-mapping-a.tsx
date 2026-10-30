"use client"

/**
 * Course mapping A (recommended): offering first. Find one of 110 offerings by search, term (grouped by academic year), cohort and
 * professional year; clinical courses only by default, with one switch to include didactic [CALL 10-26]. The lists assigned to the
 * offering's cohort already apply (one line at the top of the pane); each skill's level here is an override: mandatory, recommended,
 * optional or not mapped [CALL 10-26]; see mapped and mandatory counts per offering [REQ CM-01..04, CM-06]. A Coverage view shows the default list's required skills by the term's courses, with "In no course"
 * first (N-13). Mapping is expectation, not eligibility [CM-05]. Regions: header, toolbar, N-13 line, list and offering panes.
 * URL: ?term= &cohort= &year= &q= &offering= &view=coverage. Demo states: ?state=loading | empty | error.
 */
import * as React from "react"
import { ViewSegmentedControl } from "@exxatdesignux/ui/components/ui/view-segmented-control"
import { coverage, filterOfferings, mappingLink } from "@/lib/lab/mapping"
import { MappingFrame, type MappingModel } from "@/components/lab/admin-a/mapping-frame"
import { CoverageMatrix, OfferingPanel, OfferingsTable, courseKindField } from "@/components/lab/admin-a/mapping-parts"
import { AppliedFilterChips, FiltersControl, SearchField, Toolbar, type FilterField } from "@/components/lab/admin-a/parts"

type View = "offerings" | "coverage"

export function AdminCourseMappingA() {
  return <MappingFrame variant="A">{(m) => <OfferingFirst m={m} />}</MappingFrame>
}

function OfferingFirst({ m }: { m: MappingModel }) {
  const { query } = m
  const view: View = query.get("view") === "coverage" ? "coverage" : "offerings"
  const cohort = query.get("cohort")
  const year = query.get("year")
  const q = query.get("q")
  const offQ = query.get("oq")
  const rows = React.useMemo(() => filterOfferings(m.offerings, { q: offQ, term: m.termId, cohort, year, didactic: m.didactic }), [m.offerings, offQ, m.termId, cohort, year, m.didactic])
  const narrowed = !!(cohort || year || offQ)
  const requested = query.get("offering")
  const selected = rows.find((r) => r.id === requested) ?? m.offerings.find((r) => r.id === requested && r.termId === m.termId && (m.didactic || r.kind === "clinical")) ?? rows[0]
  const hrefFor = React.useCallback((id: string) => mappingLink({ term: m.termId, cohort: cohort || undefined, year: year || undefined, oq: offQ || undefined, incl: m.didactic ? "didactic" : undefined, offering: id }), [m.termId, cohort, year, offQ, m.didactic])
  // The library and configure link a skill here (?skill=). This variant stays offering first (the reviewer's option set),
  // so the skill becomes the focus inside the offering panel instead of switching to another design.
  const skillParam = query.get("skill")
  const skillName = skillParam ? m.state.skills.find((s) => s.id === skillParam)?.name ?? null : null

  // One filter idiom (2026-10-30 review P2, D-L8b): the four selects that sat bare in a row are one Filters control in the
  // list's toolbar, with removable chips under it, the same as the dashboard and Reports. Nothing dropped: term, cohort,
  // professional year and course kind are all in the popover.
  const fields: FilterField[] = [
    { id: "term", label: "Term", value: m.termId, defaultValue: m.currentTermId, options: m.termOpts, onChange: (v) => query.set({ term: v && v !== m.currentTermId ? v : null, offering: null }) },
    { id: "cohort", label: "Cohort", value: cohort ?? "", allLabel: "All cohorts", options: m.cohortOpts, onChange: (v) => query.set({ cohort: v || null, offering: null }) },
    { id: "year", label: "Professional year", value: year ?? "", allLabel: "All years", options: m.yearOpts, onChange: (v) => query.set({ year: v || null, offering: null }) },
    courseKindField(m.didactic, m.setDidactic),
  ]
  return (
    <>
      <Toolbar
        label="Find an offering"
        end={
          <ViewSegmentedControl<View>
            aria-label="View"
            value={view}
            onValueChange={(v) => query.set({ view: v === "coverage" ? "coverage" : null })}
            options={[
              { value: "offerings", label: "Offerings" },
              // Required skills in no course of the term (N-13): a count on Coverage, which lists them, instead of a sentence here.
              { value: "coverage", label: m.cover.gaps.length ? `Coverage (${m.cover.gaps.length})` : "Coverage" },
            ]}
          />
        }
      >
        <SearchField value={offQ} onChange={(v) => query.set({ oq: v || null })} label="Search offerings by course, term, cohort or year" placeholder="Search offerings" />
        <FiltersControl fields={fields} courseKind={m.didactic ? "all" : "clinical"} />
      </Toolbar>
      <AppliedFilterChips fields={fields} />
      {view === "coverage" ? (
        <CoverageMatrix coverage={narrowed ? coverage(m.state, m.overlay, m.termId, m.lists, new Set(rows.map((r) => r.id)), m.didactic) : m.cover} termName={m.termName} termId={m.termId} />
      ) : (
        <div className="grid min-w-0 gap-6 lg:grid-cols-[minmax(0,26rem)_minmax(0,1fr)]">
          <OfferingsTable
            rows={rows}
            selectedId={selected?.id ?? ""}
            hrefFor={hrefFor}
            onSelect={(id) => query.set({ offering: id, q: null })}
          />
          {selected ? <OfferingPanel state={m.state} overlay={m.overlay} setOverlay={m.setOverlay} offering={selected} lists={m.lists} focusQuery={q ?? skillName} /> : null}
        </div>
      )}
    </>
  )
}
