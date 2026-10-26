"use client"

/**
 * Course mapping B (alternative): skill first. Pick one of 178 skills, see which of the term's offerings carry it and at what level,
 * and change the level per offering (levels may differ between offerings, REQ CM-06): mandatory, recommended, optional or not mapped,
 * each an override of the lists assigned to the offering's cohort (one line in the pane). Clinical courses only by default [CALL 10-26]. Required skills in no course sort first and are
 * the "Required in no course" filter (N-13). The library's "Not mapped" link lands here with ?skill=.
 * Regions: header, toolbar, N-13 line, skill list and skill panes. URL: ?term= &skill= &q= &show=. Demo states: ?state=loading | empty | error.
 */
import * as React from "react"
import { filterOfferings, mappingLink, skillReach } from "@/lib/lab/mapping"
import { aNoun, skillNounPlural } from "@/lib/lab/terms"
import { MappingFrame, NoCourseNote, type MappingModel } from "@/components/lab/admin-a/mapping-frame"
import { CourseKindLine, SkillPanel, SkillReachTable } from "@/components/lab/admin-a/mapping-parts"
import { FilterSelect, SearchField, Toolbar } from "@/components/lab/admin-a/parts"

type Show = "" | "required" | "gaps" | "unconfigured"

export function AdminCourseMappingB() {
  return <MappingFrame variant="B">{(m) => <SkillFirst m={m} />}</MappingFrame>
}

function SkillFirst({ m }: { m: MappingModel }) {
  const { query } = m
  const q = query.get("q")
  const show = (query.get("show") || "") as Show
  const all = React.useMemo(() => skillReach(m.state, m.overlay, m.termId, m.lists, m.didactic), [m.state, m.overlay, m.termId, m.lists, m.didactic])
  const termTotal = React.useMemo(() => filterOfferings(m.offerings, { q: "", term: m.termId, cohort: "", year: "", didactic: true }).length, [m.offerings, m.termId])
  const termClinical = React.useMemo(() => filterOfferings(m.offerings, { q: "", term: m.termId, cohort: "", year: "" }).length, [m.offerings, m.termId])
  const rows = React.useMemo(() => {
    const t = q.trim().toLowerCase()
    return all.filter((r) => (!t || r.haystack.includes(t)) && (show === "" || (show === "required" ? r.required : show === "gaps" ? r.required && r.carriers === 0 : !r.configured)))
  }, [all, q, show])
  const requested = query.get("skill")
  const selected = all.find((r) => r.id === requested) ?? rows[0]
  const hrefFor = React.useCallback((id: string) => mappingLink({ term: m.termId, q: q || undefined, show: show || undefined, incl: m.didactic ? "didactic" : undefined, skill: id }), [m.termId, q, show, m.didactic])

  return (
    <>
      <Toolbar label={`Find ${aNoun()}`}>
        <SearchField value={q} onChange={(v) => query.set({ q: v || null })} label={`Search ${skillNounPlural()} by name or section`} placeholder={`Search ${skillNounPlural()}`} />
        <FilterSelect value={m.termId} onChange={(v) => query.set({ term: v || null })} label="Term" options={m.termOpts} className="w-36" />
        <FilterSelect
          value={show}
          onChange={(v) => query.set({ show: v || null, skill: null })}
          label="Show"
          allLabel={`All ${skillNounPlural()}`}
          options={[
            { value: "required", label: "Required on the default list" },
            { value: "gaps", label: "Required, in no course" },
            { value: "unconfigured", label: "Not configured" },
          ]}
          className="w-56"
        />
      </Toolbar>
      <div className="grid min-w-0 gap-6 lg:grid-cols-[minmax(0,26rem)_minmax(0,1fr)]">
        <SkillReachTable
          rows={rows}
          selectedId={selected?.id ?? ""}
          termName={m.termName}
          hrefFor={hrefFor}
          onSelect={(id) => query.set({ skill: id })}
          note={
            <>
              <CourseKindLine didactic={m.didactic} onChange={m.setDidactic} clinical={termClinical} total={termTotal} />
              {show !== "gaps" ? <NoCourseNote cover={m.cover} termName={m.didactic ? m.termName : `${m.termName} clinical`} onShow={() => query.set({ show: "gaps", skill: null })} /> : null}
            </>
          }
        />
        {selected ? <SkillPanel state={m.state} overlay={m.overlay} setOverlay={m.setOverlay} skill={selected} termId={m.termId} termName={m.termName} lists={m.lists} didactic={m.didactic} /> : null}
      </div>
    </>
  )
}
