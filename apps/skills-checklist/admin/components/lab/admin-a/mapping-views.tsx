"use client"

/**
 * Course mapping's body (stakeholder review 2026-11-04, D-L61, D-L75, D-L77; rebuilt 2026-11-05): three views behind one toggle under the title.
 *  - By skill: a light list of skills on the left, and the chosen skill's offerings on the right, grouped by course and cohort.
 *  - By course: a light list of offerings on the left, and the chosen offering's skills on the right, grouped by category.
 *  - Coverage: per student group, which assigned skills have a course. A figure lands on By skill with that filter [D-L77].
 * An offering shows course, cohort, term, academic year and professional year [REQ CM-01]. Filters: cohort, term, academic year, professional
 * year and course kind [REQ CM-02]. The page opens on current and upcoming offerings; a term or an academic year reaches past ones, a search does not.
 * A draft moves only the right pane: Coverage and the left lists read saved levels, so a list re-filters at Save and the skill in the pane stays.
 * A view change or a pick is a step browser Back returns through; a filter replaces the entry.
 * Clinical courses only by default [CALL 10-26]. Mapping is expectation, not eligibility [REQ CM-05]. Skills not configured cannot be mapped
 * [REQ IM-09], so they are out of both views and one note says how many.
 * URL: ?by= &list= &skill= &offering= &q= &fq= &oq= &sq= &lv= &show= &cat= &sg= &cohort= &term= &terms=all &ay= &year= &incl=.
 * Each search is its view's own: q and fq on By skill (skills, offerings), oq and sq on By course (offerings, skills); lv is By course's Show.
 */
import * as React from "react"
import { useLabHref } from "@/components/lab/lab-bar/page-context"
import { DataTable } from "@exxatdesignux/ui/components/data-table"
import type { ColumnDef } from "@exxatdesignux/ui/components/data-table/types"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@exxatdesignux/ui/components/ui/collapsible"
import { ViewSegmentedControl } from "@exxatdesignux/ui/components/ui/view-segmented-control"
import { useIsMobile } from "@exxatdesignux/ui/hooks/use-mobile"
import { LabLink as Link } from "@/components/lab/lab-bar/lab-link"
import { EmptyBlock } from "@/components/lab/empty-block"
import { LINK, LINK_IN_TABLE } from "@/components/lab/link-styles"
import { ScrollLabel } from "@/components/lab/layout/scroll-label"
import { TYPE } from "@/components/lab/type-scale"
import { LAB_ADMIN } from "@/lib/lab/library"
import { studentGroups, type StudentGroup } from "@/lib/lab/lists"
import { ALL_TERMS, LEVEL_LABEL, LEVELS, coverageGrid, currentTermId, filterOfferings, listFilter, mappingLink, onSkillList, paramsToReveal, skillReach, type CoverageGridRow } from "@/lib/lab/mapping"
import { setupResult, type GroupResult } from "@/lib/lab/setup-result"
import { capitalize, countSkills, skillListNoun, skillNoun, skillNounPlural } from "@/lib/lab/terms"
import type { MappingModel } from "@/components/lab/admin-a/mapping-frame"
import type { MappingOverlay } from "@/lib/lab/mapping"
import { OfferingPanel, PickList, SkillPanel, TwoPane, courseKindField, inPlace, offeringShortLine, type PickRow, type Show as LevelShow } from "@/components/lab/admin-a/mapping-parts"
import { AppliedFilterChips, FilterSelect, FiltersControl, LevelGlyph, NUM_LINK, SearchField, fmt, type FilterField } from "@/components/lab/admin-a/parts"
import { customGroupsStore } from "@/components/lab/admin-a/use-admin-data"

export type MappingBy = "skill" | "course" | "coverage"
type Show = "" | "incourse" | "nocourse"

/** The Term filter's value: a term id, or all terms. The lab carries `term` by name across pages ("Fall 2026"), which is not a filter here. */
const termOf = (m: MappingModel): string => {
  // All terms has its own param: `term` is remembered as the lab's scope and read by other pages, and "all" means nothing to them.
  if (m.query.get("terms") === ALL_TERMS) return ALL_TERMS
  const raw = m.query.get("term")
  return m.termOpts.some((o) => o.value === raw) ? raw : ""
}
/** The Cohort filter's value: a cohort id. The lab carries `cohort` by name across pages ("BSN 2026"), so a name resolves to its id. */
const cohortOf = (m: MappingModel): string => {
  const raw = m.query.get("cohort")
  return m.cohortOpts.find((o) => o.value === raw || o.label === raw)?.value ?? ""
}
/** The term a filter narrows to: none for All terms. */
const termId = (term: string) => (term === ALL_TERMS ? "" : term)

const termParams = (term: string) => (term === ALL_TERMS ? { terms: ALL_TERMS } : { term: term || undefined })

const parseBy = (v: string | null | undefined, fallback: MappingBy): MappingBy => (v === "skill" || v === "course" || v === "coverage" ? v : fallback)

/** Not configured skills cannot be mapped, so they leave both views [REQ IM-09]; this says how many, and links to where they are fixed (map D8). */
function NotConfiguredNote({ n }: { n: number }) {
  return n ? <p className="text-sm" data-not-configured-note><Link className={LINK} href={`${LAB_ADMIN}/skills-library?config=not-configured`}>{`${countSkills(n)} not configured`}</Link></p> : null
}

/** By skill opens first (map D8, CALL 11-02), whichever screen holds the page; a link that names an offering is about that course. `fallback` no longer decides it. */
export function MappingViews({ m }: { m: MappingModel; fallback?: MappingBy }) {
  const { query } = m
  const by = parseBy(query.get("by"), query.get("offering") ? "course" : "skill")
  const toggle = (
    <div className="flex" data-view-toggle>
      <ViewSegmentedControl<MappingBy>
        aria-label="View"
        value={by}
        onValueChange={(v) => query.push({ by: v })}
        options={[
          { value: "skill", label: `By ${skillNoun()}` },
          { value: "course", label: "By course" },
          { value: "coverage", label: "Coverage" },
        ]}
      />
    </div>
  )
  if (m.nothingToMap) return <>{toggle}{m.nothingToMap}</>
  return (
    <>
      {toggle}
      {by === "skill" ? <BySkill m={m} /> : by === "course" ? <ByCourse m={m} /> : <Coverage m={m} />}
    </>
  )
}

/** Term, Cohort, Academic year, Professional year and course kind: the same words in both views [REQ CM-02]. */
function useOfferingFields(m: MappingModel): FilterField[] {
  const { query } = m
  return [
    { id: "term", label: "Term", value: termOf(m), allLabel: "Current and upcoming", options: m.termOpts, onChange: (v) => query.set(v === ALL_TERMS ? { terms: ALL_TERMS, term: null, offering: null } : { term: v || null, terms: null, offering: null }) },
    { id: "cohort", label: "Cohort", value: cohortOf(m), allLabel: "All cohorts", options: m.cohortOpts, onChange: (v) => query.set({ cohort: v || null, offering: null }) },
    { id: "ay", label: "Academic year", value: query.get("ay") ?? "", allLabel: "All academic years", options: m.academicYearOpts, onChange: (v) => query.set({ ay: v || null, offering: null }) },
    { id: "year", label: "Professional year", value: query.get("year") ?? "", allLabel: "All professional years", options: m.yearOpts, onChange: (v) => query.set({ year: v || null, offering: null }) },
  ]
}

/** The left pane's search and small filter, then what is applied. */
function ListControls({ search, fields, chips = fields, courseKind }: { search: React.ReactNode; fields: FilterField[]; chips?: FilterField[]; courseKind?: "clinical" | "all" }) {
  return (
    <>
      <div className="flex items-center gap-2">
        {search}
        <FiltersControl fields={fields} compact courseKind={courseKind} />
      </div>
      <AppliedFilterChips fields={chips} />
    </>
  )
}

function ByCourse({ m }: { m: MappingModel }) {
  const { query } = m
  const narrow = useIsMobile()
  const fields = [...useOfferingFields(m), courseKindField(m.didactic, m.setDidactic)]
  const cohort = cohortOf(m)
  const term = termOf(m)
  const ay = query.get("ay")
  const year = query.get("year")
  const oq = query.get("oq")
  const sq = query.get("sq")
  const rawLevel = query.get("lv")
  const levelShow: LevelShow = rawLevel === "mapped" || rawLevel === "mandatory" || rawLevel === "recommended" || rawLevel === "none" ? rawLevel : ""
  const rows = React.useMemo(() => filterOfferings(m.offerings, { q: oq, term: termId(term), cohort, year, academicYear: ay, didactic: m.didactic, upcoming: term !== ALL_TERMS }), [m.offerings, oq, term, ay, cohort, year, m.didactic])
  const requested = query.get("offering")
  // An explicit link wins: a filter that would hide the offering it names gives way, so the row and the pane read together. A search does not reach this: it is being typed.
  const linked = requested ? m.offerings.find((r) => r.id === requested) : undefined
  React.useEffect(() => {
    if (!linked) return
    const reveal = paramsToReveal(linked, { q: "", term: termId(term), cohort, year, academicYear: ay, didactic: m.didactic, upcoming: term !== ALL_TERMS })
    if (Object.keys(reveal).length) query.set(reveal)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [linked?.id, term, cohort, year, ay, m.didactic])
  // With nothing asked for, open an offering of the current term: the one a program is most likely working on.
  const selected = rows.find((r) => r.id === requested) ?? m.offerings.find((r) => r.id === requested && (m.didactic || r.kind === "clinical")) ?? rows.find((r) => r.current) ?? rows[0]
  const hrefFor = (id: string) => mappingLink({ by: "course", ...termParams(term), ay: ay || undefined, cohort: cohort || undefined, year: year || undefined, oq: oq || undefined, lv: levelShow || undefined, incl: m.didactic ? "didactic" : undefined, offering: id })
  const unconfigured = React.useMemo(() => skillReach(m.state, m.overlay, "", m.lists, m.didactic).filter((r) => !r.configured).length, [m.state, m.overlay, m.lists, m.didactic])
  const savedFigures = React.useMemo(() => new Map(m.savedOfferings.map((r) => [r.id, r])), [m.savedOfferings])
  const pick: PickRow[] = rows.map((r) => {
    const fig = savedFigures.get(r.id) ?? r
    return { id: r.id, name: `${r.code} ${r.name}`, meta: offeringShortLine(r), count: fig.mapped, countLabel: `${fig.mapped === 1 ? skillNoun() : skillNounPlural()} mapped, ${fmt(fig.mandatory)} mandatory`, noneLabel: `No ${skillNounPlural()} mapped`, href: hrefFor(r.id) }
  })
  return (
    <TwoPane
      showDetail={!!requested}
      left={
        <>
          <ListControls fields={fields} courseKind={m.didactic ? "all" : "clinical"} search={<SearchField value={oq} onChange={(v) => query.set({ oq: v || null })} label="Search offerings by course, term, cohort or year" placeholder="Search courses" className="min-w-0 flex-1" />} />
          <NotConfiguredNote n={unconfigured} />
          <PickList label="Offerings" rows={pick} selectedId={selected?.id ?? ""} onSelect={(id) => query.push({ offering: id, sq: null })} empty={oq ? <EmptyBlock compact title="No offerings match this search" action={{ label: "Clear search" }} onAction={() => query.set({ oq: null })} /> : <EmptyBlock compact title="No offerings match these filters" body="Clear a filter to see more." />} />
        </>
      }
      right={selected ? <OfferingPanel key={`${selected.id}-${narrow}`} narrow={narrow} state={m.state} overlay={m.overlay} held={m.held} setOverlay={m.setOverlay} offering={selected} figures={savedFigures.get(selected.id) ?? selected} lists={m.lists} pending={m.pending} q={sq} onSearch={(v) => query.set({ sq: v || null })} show={levelShow} onShow={(v) => query.set({ lv: v || null })} onOpenSkill={(id) => query.push({ by: "skill", skill: id, offering: null })} onBack={() => query.push({ offering: null })} /> : null}
    />
  )
}

/** The student groups with the program's custom ones, and what each has of the skills that can be mapped. */
function useGroupCoverage(m: MappingModel, usableIds: readonly string[]) {
  const custom = customGroupsStore.use()
  const saved = React.useMemo(() => setupResult(m.state, m.lists, m.saved, studentGroups(m.state, custom), usableIds, m.didactic), [m.state, m.lists, m.saved, custom, usableIds, m.didactic])
  const held = React.useMemo(() => (m.held === m.saved ? saved : setupResult(m.state, m.lists, m.held, studentGroups(m.state, custom), usableIds, m.didactic)), [saved, m.state, m.lists, m.held, m.saved, custom, usableIds, m.didactic])
  return { saved, held }
}

/** Courses, one per course and cohort, that a group's skill is in: the same unit as the count with no group chosen. */
const placedCourses = (g: GroupResult, skillId: string): number => new Set(g.skills.find((k) => k.skillId === skillId)?.courses.map((c) => `${c.code}|${c.cohort}`)).size

function BySkill({ m }: { m: MappingModel }) {
  const { query } = m
  const narrow = useIsMobile()
  const fields = useOfferingFields(m)
  const q = query.get("q")
  const rawShow = query.get("show")
  const show: Show = rawShow === "nocourse" || rawShow === "gaps" ? "nocourse" : rawShow === "incourse" ? "incourse" : ""
  const cat = query.get("cat")
  const sg = query.get("sg")
  // A skill list from the Skill lists page: only its skills, in every count and note below. An unknown id is no filter.
  const listId = query.get("list")
  const onList = React.useMemo(() => listFilter(m.lists, listId), [m.lists, listId])
  // Figures read saved levels and the list's filters read `held`: a draft leaves the list, its count and the skill in the pane where they are.
  const all = React.useMemo(() => onSkillList(skillReach(m.state, m.saved, "", m.lists, m.didactic), onList), [m.state, m.saved, m.lists, m.didactic, onList])
  const heldReach = React.useMemo(() => (m.held === m.saved ? all : onSkillList(skillReach(m.state, m.held, "", m.lists, m.didactic), onList)), [all, m.state, m.held, m.saved, m.lists, m.didactic, onList])
  const usable = React.useMemo(() => all.filter((r) => r.configured), [all])
  const usableIds = React.useMemo(() => usable.map((r) => r.id), [usable])
  const coverage = useGroupCoverage(m, usableIds)
  const group = sg ? coverage.saved.groups.find((g) => g.group.id === sg) : undefined
  const heldGroup = sg ? coverage.held.groups.find((g) => g.group.id === sg) : undefined
  const unconfigured = all.length - usable.length
  // With a student group, every figure reads that group's courses, so the list has the length the Coverage figure said.
  const countOf = React.useCallback((r: (typeof all)[number]) => (group ? placedCourses(group, r.id) : r.courses), [group])
  const inGroup = React.useMemo(() => (group ? new Set(group.skills.map((k) => k.skillId)) : null), [group])
  // One definition of "in a course" (lib/lab/mapping.ts isPlaced): the count and this filter cannot disagree.
  const heldById = React.useMemo(() => new Map(heldReach.map((r) => [r.id, r])), [heldReach])
  const heldCount = React.useCallback((r: (typeof all)[number]) => (heldGroup ? placedCourses(heldGroup, r.id) : heldById.get(r.id)?.courses ?? 0), [heldGroup, heldById])
  const scoped = React.useMemo(() => (inGroup ? usable.filter((r) => inGroup.has(r.id)) : usable), [usable, inGroup])
  // In a course and In no course split the list as its rows read: every skill is in exactly one, and each count is what choosing it would list under the search and category in force.
  const searched = React.useMemo(() => {
    const t = q.trim().toLowerCase()
    return scoped.filter((r) => (!t || r.haystack.includes(t)) && (!cat || r.section === cat))
  }, [scoped, q, cat])
  const inCourse = React.useMemo(() => searched.filter((r) => heldCount(r) > 0), [searched, heldCount])
  const inNoCourse = React.useMemo(() => searched.filter((r) => heldCount(r) === 0), [searched, heldCount])
  const rows = show === "nocourse" ? inNoCourse : show === "incourse" ? inCourse : searched
  const cats = React.useMemo(() => [...new Set(usable.map((r) => r.section))].sort().map((c) => ({ value: c, label: c })), [usable])
  const fq = query.get("fq")
  const cohort = cohortOf(m)
  const term = termOf(m)
  const ay = query.get("ay")
  const year = query.get("year")
  const groupCohorts = React.useMemo(() => {
    if (!group) return null
    const ids = new Set(group.group.studentIds)
    return new Set(m.state.people.filter((p) => ids.has(p.id) && p.cohort).map((p) => p.cohort!))
  }, [group, m.state.people])
  const filter = React.useMemo(() => ({ q: fq, cohort, term: termId(term), academicYear: ay, year, upcoming: term !== ALL_TERMS, cohorts: groupCohorts }), [fq, cohort, term, ay, year, groupCohorts])
  const requested = query.get("skill")
  const selected = usable.find((r) => r.id === requested) ?? rows[0]
  const hrefFor = (id: string) => mappingLink({ by: "skill", q: q || undefined, show: show || undefined, cat: cat || undefined, sg: sg || undefined, list: onList ? onList.id : undefined, incl: m.didactic ? "didactic" : undefined, fq: fq || undefined, cohort: cohort || undefined, ...termParams(term), ay: ay || undefined, year: year || undefined, skill: id })
  const showField: FilterField = {
    id: "show",
    label: "Show",
    value: show,
    allLabel: `All ${skillNounPlural()}`,
    options: [
      { value: "incourse", label: `In a course (${fmt(inCourse.length)})` },
      { value: "nocourse", label: `In no course (${fmt(inNoCourse.length)})` },
    ],
    onChange: (v) => query.set({ show: v || null, skill: null }),
  }
  const catField: FilterField = { id: "cat", label: "Category", value: cat, allLabel: "All categories", options: cats, onChange: (v) => query.set({ cat: v || null, skill: null }) }
  const kindField = courseKindField(m.didactic, m.setDidactic)
  const sgField: FilterField | null = sg ? { id: "sg", label: "Student group", value: sg, options: [{ value: sg, label: group?.group.label ?? sg }], onChange: () => query.set({ sg: null, show: null, skill: null }) } : null
  const listField: FilterField | null = onList ? { id: "list", label: capitalize(skillListNoun()), value: onList.id, options: [{ value: onList.id, label: onList.name }], onChange: () => query.set({ list: null, skill: null }) } : null
  const savedFigures = React.useMemo(() => new Map(m.savedOfferings.map((r) => [r.id, r])), [m.savedOfferings])
  const pick: PickRow[] = rows.map((r) => ({ id: r.id, name: r.name, meta: r.section, count: countOf(r), countLabel: countOf(r) === 1 ? "course" : "courses", noneLabel: "No courses", href: hrefFor(r.id) }))
  // The first edit pins the skill the pane opened on, so Save re-filters the list and the pane stays on the record the banner names.
  const setOverlay = (next: MappingOverlay) => {
    if (!requested && selected) query.set({ skill: selected.id })
    m.setOverlay(next)
  }
  const filtered = !!(q || cat || show || sg || onList)
  return (
    <TwoPane
      showDetail={!!requested}
      left={
        <>
          <ListControls fields={[catField, showField, kindField]} chips={[...(listField ? [listField] : []), ...(sgField ? [sgField] : []), showField, catField, kindField]} courseKind={m.didactic ? "all" : "clinical"} search={<SearchField value={q} onChange={(v) => query.set({ q: v || null })} label={`Search ${skillNounPlural()} by name or category`} placeholder={`Search ${skillNounPlural()}`} className="min-w-0 flex-1" />} />
          <NotConfiguredNote n={unconfigured} />
          {filtered ? <p className={TYPE.meta} role="status" data-pick-count={rows.length}>{countSkills(rows.length)}</p> : null}
          <PickList label={capitalize(skillNounPlural())} rows={pick} selectedId={selected?.id ?? ""} onSelect={(id) => query.push({ skill: id })} empty={q ? <EmptyBlock compact title={`No ${skillNounPlural()} match this search`} action={{ label: "Clear search" }} onAction={() => query.set({ q: null })} /> : <EmptyBlock compact title={`No ${skillNounPlural()} match these filters`} body="Clear a filter to see more." />} />
        </>
      }
      right={selected ? <SkillPanel key={`${selected.id}-${narrow}`} narrow={narrow} state={m.state} overlay={m.overlay} setOverlay={setOverlay} skill={selected} figures={savedFigures} didactic={m.didactic} filter={filter} fields={fields} pending={m.pending} onSearch={(v) => query.set({ fq: v || null })} onShowAllTerms={() => query.set({ terms: ALL_TERMS, term: null })} onOpenOffering={(id) => query.push({ by: "course", offering: id, sq: selected.name, skill: null })} onBack={() => query.push({ skill: null })} /> : null}
    />
  )
}

/** A column locked to the right has no menu, the DS's one prop for that; pins take effect only when the table overflows. Nothing here sorts, groups or pins. */
const NO_MENU = { lockPin: true, defaultPin: "right" as const }

type CoverageRow = { id: string; group: StudentGroup; r?: GroupResult } & Record<string, unknown>

/**
 * The Coverage report (D-L121): every skill against every course of one term, narrowed by student group, with the totals per group a press away.
 * Neutral, since mapping is an expectation only [REQ CM-05]. In the totals, a group with no list keeps its row, with a way to Assign, and a figure lands on By skill with that filter, a list of the same length.
 */
function Coverage({ m }: { m: MappingModel }) {
  const { query } = m
  const to = useLabHref()
  const narrow = useIsMobile()
  // Saved levels, so a figure and the list it opens have the same length while a draft is open.
  const all = React.useMemo(() => skillReach(m.state, m.saved, "", m.lists, m.didactic), [m.state, m.saved, m.lists, m.didactic])
  const usableIds = React.useMemo(() => all.filter((r) => r.configured).map((r) => r.id), [all])
  const result = useGroupCoverage(m, usableIds).saved
  const rows: CoverageRow[] = [...result.groups.map((g) => ({ id: g.group.id, group: g.group, r: g })), ...result.emptyGroups.filter((g) => g.kind !== "all").map((g) => ({ id: g.id, group: g }))]
  const figure = (row: GroupResult, n: number, show: "" | "incourse" | "nocourse", what: string) => {
    if (n === 0) return <span className="tabular-nums text-muted-foreground">0</span>
    // The figure counts this group's courses across every term. Any other filter would land on a list or a pane that contradicts it, so none comes along; course kind does, since the figure read it.
    const params = { by: "skill", list: null, sg: row.group.id, show: show || null, skill: null, offering: null, q: null, fq: null, oq: null, sq: null, lv: null, cat: null, cohort: null, term: null, terms: null, ay: null, year: null }
    return (
      <Link className={NUM_LINK} href={to("admin/course-mapping", { ...params, incl: m.didactic ? "didactic" : null })} data-keeps-draft aria-label={`${fmt(n)} ${what} for ${row.group.label}`} onClick={(e) => inPlace(e, () => query.push(params))}>
        {fmt(n)}
      </Link>
    )
  }
  // The grid: one term's courses, the skills of the groups in view.
  const termId = query.get("term") && query.get("term") !== ALL_TERMS ? query.get("term")! : currentTermId(m.state)
  const gridGroupId = query.get("sg")
  const gridGroup = gridGroupId ? rows.find((r) => r.id === gridGroupId) : undefined
  const grid = React.useMemo(() => {
    const groups = gridGroup ? (gridGroup.r ? [gridGroup.r] : []) : result.groups
    const cohorts = gridGroup ? new Set(m.state.people.filter((p) => gridGroup.group.studentIds.includes(p.id)).map((p) => p.cohort ?? "")) : null
    return coverageGrid(m.state, m.saved, termId, groups.flatMap((g) => g.skills.map((k) => k.skillId)), cohorts, m.didactic)
  }, [m.state, m.saved, termId, gridGroup, result, m.didactic])
  const termLabel = m.termOpts.find((t) => t.value === termId)?.label ?? ""
  const skillHref = (row: CoverageGridRow) => to("admin/course-mapping", { by: "skill", skill: row.id, list: null, sg: gridGroupId, term: null, terms: null, q: null, fq: null, oq: null, sq: null, lv: null, show: null, offering: null, incl: m.didactic ? "didactic" : null })
  const gridColumns: ColumnDef<CoverageGridRow>[] = [
    {
      key: "name",
      label: capitalize(skillNoun()),
      width: narrow ? 150 : 240,
      sortable: true,
      lockPin: true,
      defaultPin: "left",
      cell: (r) => (
        <span className="flex min-w-0 flex-col py-0.5">
          <Link className={`${LINK_IN_TABLE} whitespace-normal`} href={skillHref(r)} data-keeps-draft title={r.name}>{r.name}</Link>
          <span className={`${TYPE.meta} truncate`} title={r.section}>{r.section}</span>
        </span>
      ),
    },
    {
      key: "carriers",
      label: "Courses",
      width: narrow ? 92 : 130,
      sortable: true,
      lockPin: true,
      defaultPin: "left",
      cell: (r) => <span className="whitespace-normal text-sm tabular-nums" data-grid-carriers={r.carriers}>{r.carriers === 0 ? "In no course" : `${fmt(r.carriers)}${r.mandatoryCarriers ? `, ${fmt(r.mandatoryCarriers)} mandatory` : ""}`}</span>,
    },
    ...grid.columns.map((c): ColumnDef<CoverageGridRow> => ({
      key: `c:${c.offeringId}`,
      label: c.code,
      width: 92,
      resizable: false,
      lockPin: true,
      header: () => (
        <span className="flex flex-col whitespace-nowrap leading-tight">
          <span className="text-xs font-medium">{c.code}</span>
          <span className="text-xs font-normal text-muted-foreground">{c.cohort}</span>
        </span>
      ),
      cell: (r) => {
        const lv = r.cells[c.offeringId] ?? "none"
        return (
          <Link href={to("admin/course-mapping", { by: "course", offering: c.offeringId, sq: r.name, skill: null, sg: null, list: null, q: null, fq: null, oq: null, show: null, lv: null, term: null, terms: null, incl: m.didactic ? "didactic" : null })} data-keeps-draft className="flex h-8 w-10 items-center justify-center rounded-sm hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" aria-label={`${r.name} in ${c.code}, ${c.cohort}: ${LEVEL_LABEL[lv]}. Open the course`}>
            <LevelGlyph level={lv} />
          </Link>
        )
      },
    })),
  ]
  const quiet = (word: string) => <span className="whitespace-normal text-sm leading-tight text-muted-foreground">{word}</span>
  // No offerings for this group's cohorts: nothing to place it in, so not a figure. The same words at every width; they wrap on a phone.
  const noCourses = quiet("No courses")
  const wrapHead = (label: string) => (narrow ? () => <span className="whitespace-normal leading-tight">{label}</span> : undefined)
  const columns: ColumnDef<CoverageRow>[] = [
    {
      key: "group",
      label: "Student group",
      width: narrow ? 112 : 220,
      ...NO_MENU,
      cell: (row) => (
        <span className="flex min-w-0 flex-col" data-coverage-group={row.id}>
          <span className={narrow ? "whitespace-normal font-medium" : "truncate font-medium"} title={row.group.label}>{row.group.label}</span>
          <span className={TYPE.meta}>{`${fmt(row.group.studentIds.length)} students`}</span>
        </span>
      ),
    },
    ...(narrow
      ? []
      : [{
          key: "lists",
          label: capitalize(`${skillNoun()} lists`),
          width: 320,
          ...NO_MENU,
          cell: (row: CoverageRow) =>
            row.r ? (
              <ul className="flex flex-col gap-0.5 whitespace-normal">
                {row.r.listCounts.map((l) => (
                  <li key={l.id}>
                    {`${l.name} · ${fmt(l.total)}`}
                    {l.inactive ? <span className={TYPE.meta}>{` (${fmt(l.inactive)} inactive)`}</span> : null}
                  </li>
                ))}
              </ul>
            ) : quiet("Not assigned"),
        } satisfies ColumnDef<CoverageRow>]),
    {
      key: "assigned",
      label: "Assigned",
      header: wrapHead("Assigned"),
      width: narrow ? 80 : 148,
      ...NO_MENU,
      cell: (row) => (row.r ? figure(row.r, row.r.skills.length, "", `${skillNounPlural()} assigned`) : <Link className={`${LINK_IN_TABLE} inline-block whitespace-normal leading-tight`} href={to("admin/lists-cohorts", { focus: row.id })} aria-label={`Not assigned: assign ${skillNounPlural()} to ${row.group.label}`}>Not assigned</Link>),
    },
    {
      key: "placed",
      label: "In a course",
      header: wrapHead("In a course"),
      width: narrow ? 74 : 120,
      ...NO_MENU,
      cell: (row) => (!row.r ? quiet("–") : row.r.offerings ? figure(row.r, row.r.placed, "incourse", `${skillNounPlural()} in a course`) : noCourses),
    },
    {
      key: "unplaced",
      label: "In no course",
      header: wrapHead("In no course"),
      width: narrow ? 74 : 120,
      ...NO_MENU,
      cell: (row) => (!row.r ? quiet("–") : row.r.offerings ? figure(row.r, row.r.unplaced, "nocourse", `${skillNounPlural()} in no course`) : noCourses),
    },
  ]
  return (
    <section className="flex min-w-0 flex-col gap-4" aria-label="Coverage" data-region="coverage">
      <div className="flex flex-wrap items-center gap-2">
        <FilterSelect value={termId} onChange={(v) => query.set({ term: v || null })} label="Term" options={m.termOpts.filter((t) => t.value !== ALL_TERMS)} className="w-44" />
        <FilterSelect value={gridGroupId ?? ""} onChange={(v) => query.set({ sg: v || null })} label="Student group" allLabel="All student groups" options={rows.map((r) => ({ value: r.id, label: r.group.label }))} className="w-56" />
        <FilterSelect value={m.didactic ? "didactic" : ""} onChange={(v) => m.setDidactic(v === "didactic")} label="Course kind" allLabel="Clinical" options={[{ value: "didactic", label: "Clinical and didactic" }]} className="w-48" />
      </div>
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
        <p className="text-sm tabular-nums" role="status" data-grid-summary>{`${countSkills(grid.rows.length)} · ${fmt(grid.rows.length - grid.inNoCourse)} in a ${termLabel} course · ${fmt(grid.inNoCourse)} in no course`}</p>
        <ul className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm" aria-label="Levels">
          {LEVELS.map((l) => <li key={l} className="flex items-center gap-1.5"><LevelGlyph level={l} /><span className="text-muted-foreground">{LEVEL_LABEL[l]}</span></li>)}
        </ul>
      </div>
      <div className="min-w-0" data-coverage-grid>
        <ScrollLabel label={`${capitalize(skillNounPlural())} by course`}>
          <DataTable<CoverageGridRow>
            key={`grid-${termId}-${gridGroupId ?? "all"}-${narrow}`}
            data={grid.rows}
            columns={gridColumns}
            getRowId={(r) => r.id}
            selectable={false}
            searchable={false}
            showQueryControls={false}
            edgeInset={false}
            emptyState={<EmptyBlock compact title={gridGroup && !gridGroup.r ? `${gridGroup.group.label} has no ${skillListNoun()} yet.` : `No ${skillNounPlural()} to show for this term.`} />}
          />
        </ScrollLabel>
      </div>
      <Collapsible data-coverage-totals>
        <CollapsibleTrigger asChild>
          <Button type="button" variant="outline" size="sm" className="group w-fit">
            Totals by student group, all terms
            <i className="fa-light fa-chevron-down text-xs group-data-[state=open]:rotate-180" aria-hidden="true" />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-3">
      <div className="min-w-0">
      <ScrollLabel label="Coverage by student group">
        <DataTable<CoverageRow>
          key={narrow ? "narrow" : "wide"}
          data={rows}
          columns={columns}
          getRowId={(g) => g.id}
          selectable={false}
          searchable={false}
          showQueryControls={false}
          edgeInset={false}
          emptyState={<EmptyBlock compact title="No student groups yet" />}
        />
      </ScrollLabel>
      </div>
        </CollapsibleContent>
      </Collapsible>
    </section>
  )
}

