"use client"

/**
 * Course mapping B: skill first, across the program (CALL 11-02, Sarah: one skill across every term is the useful view).
 * Pick one of the active skills, see its level in every course offering of every term (courses as rows, terms as columns, one
 * level per offering, REQ CM-03, CM-06), and set one level in several offerings at once. A level is set per offering only;
 * nothing carries a level into another term (OD-01 open, REQ CM-08). Clinical courses only by default [CALL 10-26].
 * Required skills in no offering are the "Required, in no course" filter (N-13). The library's "Not mapped" link lands here
 * with ?skill=. Offerings are searchable and filter by cohort and professional year, each cell with its offering's mapped and
 * mandatory counts (REQ CM-02, CM-04). Deactivated skills are not listed (REQ SL-11).
 * URL: ?skill= &q= &show= &oq= &cohort= &year= &incl=. Demo states: ?state=loading | empty | error.
 */
import * as React from "react"
import { mappingLink, skillReach } from "@/lib/lab/mapping"
import { useEmbeddedStep } from "@/components/lab/layout/embedded"
import { aNoun, skillNounPlural } from "@/lib/lab/terms"
import { MappingFrame, type MappingModel } from "@/components/lab/admin-a/mapping-frame"
import { SkillReachTable, courseKindField } from "@/components/lab/admin-a/mapping-parts"
import { SkillAcrossPanel } from "@/components/lab/admin-a/skill-across"
import { useSetupResult } from "@/components/lab/admin-a/result-parts"
import { courseGapIds } from "@/lib/lab/setup-result"
import { AppliedFilterChips, FiltersControl, SearchField, Toolbar, type FilterField } from "@/components/lab/admin-a/parts"

type Show = "" | "required" | "gaps" | "unconfigured" | "nocourse"

export function AdminCourseMappingB() {
  return <MappingFrame variant="B">{(m) => <SkillFirst m={m} />}</MappingFrame>
}

function SkillFirst({ m }: { m: MappingModel }) {
  const { query } = m
  const inWorkflow = useEmbeddedStep() !== null
  const q = query.get("q")
  const show = (query.get("show") || "") as Show
  // Every term's offerings: the skill's reach across the program, not one term [CALL 11-02].
  const all = React.useMemo(() => skillReach(m.state, m.overlay, "", m.lists, m.didactic), [m.state, m.overlay, m.lists, m.didactic])
  const gaps = React.useMemo(() => all.filter((r) => r.required && r.carriers === 0).length, [all])
  // "No course yet": assigned to a student group that has courses, and none of that group's courses expects it. The Setup
  // summary's course mapping figure is this same set (lib/lab/setup-result.ts courseGapIds), so the drill matches the figure.
  const { result } = useSetupResult()
  const noCourse = React.useMemo(() => courseGapIds(result), [result])
  const rows = React.useMemo(() => {
    const t = q.trim().toLowerCase()
    const pass = (r: (typeof all)[number]) => (show === "required" ? r.required : show === "gaps" ? r.required && r.carriers === 0 : show === "nocourse" ? noCourse.has(r.id) : show === "unconfigured" ? !r.configured : true)
    return all.filter((r) => (!t || r.haystack.includes(t)) && pass(r))
  }, [all, q, show, noCourse])
  // The skill's offerings are found by search (course, term, academic year, cohort), cohort and professional year in its pane [REQ CM-02].
  const oq = query.get("oq")
  const cohort = query.get("cohort")
  const year = query.get("year")
  const offFilter = React.useMemo(() => ({ q: oq, cohort, year }), [oq, cohort, year])
  const requested = query.get("skill")
  const selected = all.find((r) => r.id === requested) ?? rows[0]
  const hrefFor = React.useCallback((id: string) => mappingLink({ q: q || undefined, show: show || undefined, incl: m.didactic ? "didactic" : undefined, oq: oq || undefined, cohort: cohort || undefined, year: year || undefined, skill: id }), [q, show, m.didactic, oq, cohort, year])

  // One filter idiom (2026-10-30 review P2, D-L8b): show and course kind are one Filters control with removable chips. Terms are
  // the pane's columns, so there is no term filter here.
  const fields: FilterField[] = [
    {
      id: "show",
      label: "Show",
      value: show,
      allLabel: `All ${skillNounPlural()}`,
      options: [
        { value: "required", label: "Required to graduate" },
        // N-13 as a count on its own filter, not a sentence above the list (Romit 2026-10-28: "too many text").
        { value: "gaps", label: gaps ? `Required, in no course (${gaps})` : "Required, in no course" },
        { value: "unconfigured", label: "Not configured" },
        { value: "nocourse", label: noCourse.size ? `No course yet (${noCourse.size.toLocaleString("en-US")})` : "No course yet" },
      ],
      onChange: (v) => query.set({ show: v || null, skill: null }),
    },
    courseKindField(m.didactic, m.setDidactic),
  ]
  return (
    <>
      <Toolbar label={`Find ${aNoun()}`}>
        <SearchField value={q} onChange={(v) => query.set({ q: v || null })} label={`Search ${skillNounPlural()} by name or section`} placeholder={`Search ${skillNounPlural()}`} />
        {/* Inside Set up skills (D-L44) the step only sets a level per course: the hub's Show and course-kind filters stay on the hub. */}
        {inWorkflow ? null : <FiltersControl fields={fields} courseKind={m.didactic ? "all" : "clinical"} />}
      </Toolbar>
      {inWorkflow ? null : <AppliedFilterChips fields={fields} />}
      {/* Side by side from 1280 px, the list narrow (15rem) so at 1440 the pinned course column and three terms fit without
          scrolling, "Recommended" whole in each select; later terms scroll. Below 1280 the skill list is a short scroll box above. */}
      <div className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,15rem)_minmax(0,1fr)] xl:gap-4">
        <div className="max-h-80 min-w-0 overflow-y-auto xl:max-h-none xl:overflow-visible" data-skill-list>
        <SkillReachTable
          rows={rows}
          selectedId={selected?.id ?? ""}
          termName=""
          hrefFor={hrefFor}
          onSelect={(id) => query.set({ skill: id })}
        />
        </div>
        {selected ? (
          <SkillAcrossPanel
            state={m.state}
            overlay={m.overlay}
            setOverlay={m.setOverlay}
            skill={selected}
            lists={m.lists}
            didactic={m.didactic}
            filter={{ value: offFilter, onChange: (n) => query.set({ ...(n.q !== undefined ? { oq: n.q || null } : {}), ...(n.cohort !== undefined ? { cohort: n.cohort || null } : {}), ...(n.year !== undefined ? { year: n.year || null } : {}) }), cohortOpts: m.cohortOpts, yearOpts: m.yearOpts }}
          />
        ) : null}
      </div>
    </>
  )
}
