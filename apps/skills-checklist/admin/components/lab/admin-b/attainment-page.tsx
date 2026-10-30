"use client"

/**
 * Attainment: a destination, not the landing (OD-29 open; the Dashboard stays the admin landing [LEDGER D-L4]).
 *
 * Regions (strategy/07 list budget, 4): page header (title, one Export action) · one toolbar row (Romit 2026-10-27, "can we
 * improve the UI here?"): the set control "Required this term | Required to graduate | All skills" (D-X12, D-X16; "All skills"
 * on the Skills view only) then the shared scope bar's Filters button and applied chips, wrapping at 375 · view tabs with their counts (Students, Skills, Sections and tags; RP-02 to
 * RP-04; sections and tags share a tab with a "Group by" switch inside it) · the view. No headline figures: the tab counts are
 * the counts. Cohort is a filter in the scope bar, never lanes. The comparison basis is the dashboard's (it travels in the
 * URL and is named in the legend); a report page does not offer a second place to change it (density sweep 2026-10-26).
 * Table views carry one page search; the tables' own query controls stay off. No sentence explains the order: every table
 * opens sorted on Achieved, lowest first, and its header shows that sort (attainment-tables.tsx DEFAULT_SORT); the tab badge
 * is the count.
 *
 * Variant A (recommended) opens on Students as the students x sections heat matrix (concept D). Variant B opens on Skills as a
 * ranked table with distribution strips, and shows Students as a table. Both share every view, the peek and the export.
 * Every count opens a peek with that many records; the scope, view and peek live in the URL. Demo states: ?state=loading,
 * empty, error, partial.
 */
import * as React from "react"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import { LocalBanner } from "@exxatdesignux/ui/components/ui/banner"
import { Skeleton } from "@exxatdesignux/ui/components/ui/skeleton"
import { Tabs, TabsContent, TabsCountBadge, TabsList, TabsTrigger } from "@exxatdesignux/ui/components/ui/tabs"
import { Input } from "@exxatdesignux/ui/components/ui/input"
import { Label } from "@exxatdesignux/ui/components/ui/label"
import { SampleDataBadge } from "@/components/lab/import/sample-badge"
import { fmt } from "@/lib/v2/format"
import { ViewSegmentedControl } from "@exxatdesignux/ui/components/ui/view-segmented-control"
import { PageFrame } from "@/components/skills/page-header"
import { ScopeAppliedLine, ScopeFiltersButton, type ScopeBarProps } from "@/components/lab/dashboard/scope-bar"
import { ImpossibleScopeBanner, useImpossibleScope } from "@/components/lab/dashboard/impossible-scope"
import { asOfLabel, useSnapshot } from "@/components/lab/dashboard/use-dashboard"
import { BASIS_LABEL, chipValue, conditionLabel, recountText, resolveTerm, scopeOptions } from "@/lib/lab/dashboard"
import { buildAttainment, isSkillsScope, peekRecords, scopeLines, unrequiredSkills, type AttView, type SkillsScope } from "@/lib/lab/attainment"
import { SCOPE_LABEL, basisOf, clearFilters, removeScope, scopeIsEmpty, type ScopeKey } from "@/lib/lab/scope"
import { capitalize, skillNoun, skillNounPlural } from "@/lib/lab/terms"
import { useAttainmentUrl } from "@/components/lab/admin-b/use-att-url"
import { StudentMatrix } from "@/components/lab/admin-b/student-matrix"
import { GroupTable, SkillsTable, StudentsTable } from "@/components/lab/admin-b/attainment-tables"
import { EvidencePeek } from "@/components/lab/admin-b/evidence-peek"
import { ExportPanel } from "@/components/lab/admin-b/export-panel"
import { StateLegend } from "@/components/lab/admin-b/state-viz"
import { RequiredSetControl, useRequiredSet } from "@/components/lab/admin-b/required-set-switch"
import { GRADUATION_STAGE_LABEL } from "@/lib/v2/labels"
import { TYPE } from "@/components/lab/type-scale"


const SEARCH_FROM = 40

export function AttainmentPage({ variant, defaultView, studentsAs, exportOpenByDefault = false }: { variant: string; defaultView: AttView; studentsAs: "matrix" | "table"; exportOpenByDefault?: boolean }) {
  const url = useAttainmentUrl(defaultView)
  const snap = useSnapshot()
  const [exportOpen, setExportOpen] = React.useState(exportOpenByDefault)
  const demo = url.demo
  // Required set (D-X12): "Required this term" or "Required to graduate", from the URL (`set`) or the scope's default.
  const reqSet = useRequiredSet(snap.state, url.scope, url.param, url.hrefWith)
  const model = React.useMemo(() => (snap.state ? buildAttainment(snap.state, url.scope, undefined, { basis: reqSet.basis }) : null), [snap.state, url.scope, reqSet.basis])
  const peek = React.useMemo(() => (model && snap.state && url.peek ? peekRecords(model, snap.state, url.peek) : null), [model, snap.state, url.peek])
  // Skills tab scope (LEDGER D-X16): required this term by default; "all" adds the published skills nobody needs this term.
  const skillsRaw = url.param("skills")
  const skillsScope: SkillsScope = isSkillsScope(skillsRaw) ? skillsRaw : "required"
  const extraSkills = React.useMemo(() => (model && snap.state && skillsScope === "all" ? unrequiredSkills(snap.state, model) : []), [model, snap.state, skillsScope])
  const actionItems = [{ id: "export", label: "Export", icon: "fa-arrow-down-to-line", variant: "outline" as const, onSelect: () => setExportOpen(true) }]
  const sample = <SampleDataBadge />
  const [query, setQuery] = React.useState("")
  // RP-09: a scope that cannot produce evidence is explained in place of the views, never shown as "0 of 5 · Behind".
  const impossible = useImpossibleScope(snap.state, url.scope)

  if (!model || !snap.state || demo === "loading") {
    return (
      <PageFrame title="Reports" actionItems={actionItems} actions={sample}>
        <AttainmentLoading />
      </PageFrame>
    )
  }
  const state = snap.state
  const term = resolveTerm(state, url.scope)
  const basis = basisOf(url.scope)
  const label = (k: ScopeKey, v: string) => chipValue(state, k, v)
  const lines = [...scopeLines(url.scope, term.name, BASIS_LABEL[basis], asOfLabel(snap.at), label), `Required set: ${model.basisLabel}`]
  // Under "Required to graduate" the flag is the director's far behind (D-X11), never the term pace.
  const toGraduate = model.basis === "toGraduate"
  const behindLabel = toGraduate ? GRADUATION_STAGE_LABEL.far : "Behind"
  const notRequiredLabel = toGraduate ? "Not required to graduate" : "Not required this term"
  const empty = demo === "empty" || model.students.length === 0
  const applied = (["cohort", "group", "course", "cat", "tag", "loc", "setting"] as ScopeKey[]).filter((k) => !!url.scope[k])
  const recount = recountText(url.scope)
  const tabs: Array<{ id: "students" | "skills" | "groups"; label: string; n: number }> = [
    { id: "students", label: "Students", n: model.students.length },
    { id: "skills", label: capitalize(skillNounPlural()), n: model.skills.length + extraSkills.length },
    { id: "groups", label: "Sections and tags", n: model.sectionRows.length + model.tagRows.length },
  ]
  const tabValue = url.view === "sections" || url.view === "tags" ? "groups" : url.view
  const tableView = !(url.view === "students" && studentsAs === "matrix")
  // Search appears only where the list is too long to scan (more than SEARCH_FROM rows): Hick's law, progressive disclosure.
  const viewRows = url.view === "students" ? model.students.length : url.view === "skills" ? model.skills.length + extraSkills.length : url.view === "sections" ? model.sectionRows.length : model.tagRows.length
  const showSearch = tableView && viewRows > SEARCH_FROM
  const search = tableView ? (showSearch ? query : "") : undefined
  const fileStem = `attainment-${term.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${url.view}`

  const scopeProps: ScopeBarProps = { scope: url.scope, options: scopeOptions(state, url.scope), termName: term.name, onChange: url.setScope, chipValue: label, showBasis: false, stale: demo === "stale" }

  return (
    // The dashboard treatment (Romit 2026-10-30): the page-wide Filters sits in the header beside Export, with no scope summary
    // row. The required-set control is a view switch, so it leads the body's one toolbar row, and the applied chips follow it on
    // the same row only when something is applied (RP-01). It wraps at 375 instead of crowding the header.
    <PageFrame
      title="Reports"
      actionItems={actionItems}
      actions={
        <>
          <ScopeFiltersButton {...scopeProps} />
          {sample}
        </>
      }
    >
      <div className="flex flex-col gap-4" data-attainment-lab={`admin-${variant}`} data-page-type="list" data-view={url.view}>
        {/* One toolbar row above the data (2026-10-30 review: three control rows sat before the matrix). Filters stays in the
            header (Romit 2026-10-30, the dashboard treatment); the required set leads this one row, applied chips beside it
            only when something is applied (RP-01). The matrix legend moved under the table, so the tabs follow directly. */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2" data-region="toolbar">
          <RequiredSetControl basis={model.basis} allSkills={url.view === "skills" ? skillsScope === "all" : undefined} paramsFor={reqSet.paramsFor} onChange={url.setParams} />
          <ScopeAppliedLine {...scopeProps} />
        </div>
        {recount && !impossible ? <p className={TYPE.helper} data-recount>{recount}</p> : null}
        {demo === "partial" ? (
          <LocalBanner variant="info" title="Recalculating after a rule change">Some figures may move. They update when it finishes.</LocalBanner>
        ) : null}
        {demo === "error" ? (
          <LocalBanner variant="error" title="Reports could not be loaded" retry={{ label: "Try again", onClick: () => url.setParams({ state: null }) }}>
            The scope and filters are kept.
          </LocalBanner>
        ) : impossible ? (
          <ImpossibleScopeBanner state={state} scope={url.scope} onChange={url.setScope} />
        ) : empty ? (
          <LocalBanner variant="info" title="No students in this scope">
            <span className="flex flex-col gap-2">
              <span>{applied.length ? `Nobody in this scope has a required ${skillNoun()} this term. Remove a filter to widen it.` : `Nobody takes a course with required ${skillNounPlural()} in ${term.name}.`}</span>
              {applied.length ? (
                <span className="flex flex-wrap gap-2">
                  {applied.map((k) => (
                    <Button key={k} type="button" variant="outline" size="sm" onClick={() => url.setScope(removeScope(url.scope, k))}>{`Remove ${SCOPE_LABEL[k].toLowerCase()}`}</Button>
                  ))}
                  {scopeIsEmpty(url.scope) ? null : <Button type="button" variant="ghost" size="sm" onClick={() => url.setScope(clearFilters(url.scope))}>Clear filters</Button>}
                </span>
              ) : null}
            </span>
          </LocalBanner>
        ) : (
          <Tabs value={tabValue} onValueChange={(v) => { setQuery(""); url.setView((v === "groups" ? "sections" : v) as AttView) }} className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <TabsList variant="line" ariaLabel="Report views">
                {tabs.map((t) => (
                  <TabsTrigger key={t.id} value={t.id} data-tab={t.id}>
                    {t.label}
                    <TabsCountBadge count={t.n} />
                  </TabsTrigger>
                ))}
              </TabsList>
              {url.view === "students" && studentsAs === "matrix" ? null : (
                <div className="flex flex-wrap items-center gap-4">
                  {url.view === "sections" || url.view === "tags" ? (
                    <ViewSegmentedControl<"sections" | "tags">
                      aria-label="Group by"
                      value={url.view}
                      onValueChange={(v) => { setQuery(""); url.setView(v) }}
                      options={[
                        { value: "sections", label: `Section ${model.sectionRows.length}` },
                        { value: "tags", label: `Tag ${model.tagRows.length}` },
                      ]}
                    />
                  ) : null}
                  <StateLegend />
                  {showSearch ? <span className="flex items-center">
                    <Label htmlFor="att-search" className="sr-only">{`Search ${tabs.find((t) => t.id === tabValue)?.label.toLowerCase() ?? ""}`}</Label>
                    <Input id="att-search" type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search" className="h-8 w-48" />
                  </span> : null}
                </div>
              )}
            </div>
            {/* The active tab's panel (the selected trigger's aria-controls must name a panel that exists, WCAG 4.1.2). */}
            <TabsContent value={tabValue} className="mt-0">
            {url.view === "students" ? (
              studentsAs === "matrix" ? (
                <StudentMatrix model={model} peekHref={url.peekHref} behindLabel={behindLabel} activePeek={url.peek} legend={toGraduate ? behindLabel : conditionLabel(basis)} />
              ) : (
                <StudentsTable rows={model.students} peekHref={url.peekHref} behindLabel={behindLabel} search={search} />
              )
            ) : url.view === "skills" ? (
              <div data-skills-scope={skillsScope}>
                {/* Required set or all (LEDGER D-X16) is the toolbar's set control; the order is the table's sort state. */}
                <SkillsTable rows={model.skills} peekHref={url.peekHref} extra={skillsScope === "all" ? extraSkills : undefined} search={search} notRequiredLabel={notRequiredLabel} />
              </div>
            ) : url.view === "sections" ? (
              <GroupTable rows={model.sectionRows} kind="section" firstLabel="Section" peekHref={url.peekHref} unitWord="records" search={search} />
            ) : (
              <div className="flex flex-col gap-3">
                <p className={TYPE.helper} data-tag-overlap>{`Tags overlap: ${fmt(model.multiTagged)} records count under more than one tag, so rows do not add up. ${fmt(model.untagged)} records have no tag.`}</p>
                <GroupTable rows={model.tagRows} kind="tag" firstLabel="Tag" peekHref={url.peekHref} unitWord="records" search={search} />
              </div>
            )}
            </TabsContent>
          </Tabs>
        )}
      </div>
      <EvidencePeek peek={peek} data={state} evidence={model.pop.evidenceState} scope={url.scope} onClose={url.closePeek} />
      <ExportPanel open={exportOpen} onOpenChange={setExportOpen} model={model} data={state} view={url.view} scopeLines={lines} fileStem={fileStem} />
    </PageFrame>
  )
}

function AttainmentLoading() {
  return (
    <div role="status" aria-busy="true" aria-label="Loading attainment" className="flex flex-col gap-4" data-loading>
      <span className="sr-only">Loading attainment</span>
      <div className="flex gap-2">
        {Array.from({ length: 5 }, (_, i) => <Skeleton key={i} aria-hidden="true" className="h-8 w-28" />)}
      </div>
      <Skeleton aria-hidden="true" className="h-9 w-96" />
      {Array.from({ length: 10 }, (_, i) => <Skeleton key={i} aria-hidden="true" className="h-10 w-full" />)}
    </div>
  )
}
