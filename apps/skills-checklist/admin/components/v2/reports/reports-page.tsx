"use client"

import * as React from "react"
import Link from "next/link"
import { LoadingBlocks } from "@/components/v2/shared-loading"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import { KeyMetrics, type MetricItem } from "@exxatdesignux/ui/components/ui/key-metrics"
import { LocalBanner } from "@exxatdesignux/ui/components/ui/banner"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@exxatdesignux/ui/components/ui/sheet"
import { StatusBadge } from "@exxatdesignux/ui/components/ui/status-badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@exxatdesignux/ui/components/ui/tabs"
import { Tip } from "@exxatdesignux/ui/components/ui/tip"
import { PageFrame } from "@/components/skills/page-header"
import { ChartCard } from "@/components/chart-card"
import { StatusPill } from "@/components/v2/status-pill"
import { V2FilterBar, filterValue, setFilter, v2SelectField, type V2FilterField } from "@/components/v2/v2-filter-bar"
import { contextLine } from "@/lib/v2/page-context"
import type { ActiveFilter } from "@exxatdesignux/ui/lib/table-properties-types"
import { AttainmentKey, TagsTab } from "@/components/v2/reports/tag-attainment"
import { ExportSheet } from "@/components/v2/reports/export-sheet"
import { EvidenceLedgerSheet, type LedgerTarget } from "@/components/v2/reports/evidence-ledger"
import { linkTo } from "@/lib/v2/link-to"
import { fmtDay } from "@/components/v2/outcomes/version-timeline"
import { BTN } from "@/components/v2/preceptor/evaluation-form"
import { statusLabel } from "@/components/v2/director/verification-pages"
import { V2Grid, v2col } from "@/components/v2/v2-grid"
import { DotStrip, HeatGrid, HeatGridKey, StackedBar, type HeatColumn, type HeatRow } from "@/components/v2/viz"
import {
  ALL,
  behindPace,
  categoriesOf,
  cohortsOf,
  conflictFix,
  coursesOf,
  groupsOf,
  locationsOf,
  normalizeFilters,
  population,
  tagsOf,
  explainFilters,
  gridState,
  heatmap,
  NO_FILTERS,
  PACE_MARGIN,
  paceDots,
  paceRows,
  paceMarker,
  raterRows,
  removeFilter,
  reportSummary,
  SETTING_LABEL,
  skillAttainment,
  SMALL_NUMBERS,
  studentSkillRows,
  tagAttainment,
  TERM,
  termDaysGone,
  termShare,
  type PaceRow,
  type RaterRow,
  type ReportFilters,
  type SkillAttainment,
  type StudentSkillRow,
} from "@/lib/v2/reports"
import { useV2Hydrated, useV2State } from "@/lib/v2/react"
import type { RoleId, Setting, V2State } from "@/lib/v2/types"
import { verificationRows, type VerificationRow } from "@/lib/v2/verification"

const plural = (n: number, one: string, many: string) => (n === 1 ? one : many)

/** The report filters in the DS filter data model, so the bar and the table toolbar speak the same shape. */
function toActive(f: ReportFilters): ActiveFilter[] {
  let out: ActiveFilter[] = []
  if (f.cohort !== ALL) out = setFilter(out, "cohort", f.cohort)
  if (f.group !== ALL) out = setFilter(out, "group", f.group)
  if (f.course !== ALL) out = setFilter(out, "course", f.course)
  if (f.tag !== ALL) out = setFilter(out, "tag", f.tag)
  if (f.location !== ALL) out = setFilter(out, "location", f.location)
  if (f.category !== ALL) out = setFilter(out, "category", f.category)
  if (f.setting !== ALL) out = setFilter(out, "setting", f.setting)
  if (f.clinicalSetting !== ALL) out = setFilter(out, "clinicalSetting", f.clinicalSetting)
  if (f.mandatoryOnly) out = setFilter(out, "mandatoryOnly", "yes")
  return out
}

function fromActive(s: V2State, a: ActiveFilter[]): ReportFilters {
  return normalizeFilters(s, {
    cohort: filterValue(a, "cohort") ?? ALL,
    group: filterValue(a, "group") ?? ALL,
    course: filterValue(a, "course") ?? ALL,
    tag: filterValue(a, "tag") ?? ALL,
    location: filterValue(a, "location") ?? ALL,
    category: filterValue(a, "category") ?? ALL,
    setting: (filterValue(a, "setting") ?? ALL) as ReportFilters["setting"],
    clinicalSetting: filterValue(a, "clinicalSetting") ?? ALL,
    mandatoryOnly: filterValue(a, "mandatoryOnly") === "yes",
  })
}

type TabId = "students" | "skills" | "tags" | "evaluators"

const TAB_LABEL: Record<TabId, string> = { students: "Students", skills: "Skills", tags: "Tags", evaluators: "Evaluators" }

const FOCUS = "focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"

export function ReportsPage({ role }: { role: RoleId }) {
  const s = useV2State()
  const hydrated = useV2Hydrated()
  const [f, setF] = React.useState<ReportFilters>(NO_FILTERS)
  const [tab, setTab] = React.useState<TabId>("students")
  const [asTable, setAsTable] = React.useState(false)
  const [focusSkill, setFocusSkill] = React.useState<string | null>(null)
  const [exportOpen, setExportOpen] = React.useState(false)
  const [methodOpen, setMethodOpen] = React.useState(false)
  const [picked, setPicked] = React.useState<LedgerTarget | null>(null)

  const hm = heatmap(s, f)
  const sum = reportSummary(s, f)
  const conflict = explainFilters(f, s)
  const fix = conflictFix(f, s)
  const inView = population(s, f)
  const allPace = paceRows(inView)
  const behind = behindPace(inView)
  const att = skillAttainment(s, f)
  const tags = tagAttainment(s, f)
  const raters = raterRows(s, f)
  const cats = categoriesOf(s)
  const rowsAll = studentSkillRows(s, f)
  const rows = focusSkill ? rowsAll.filter((r) => r.skillId === focusSkill) : rowsAll
  const vrows = new Map(verificationRows(s).map((r) => [r.studentId, r]))
  const clinicalSettings = s.course.clinicalSettings
  const noEvidence = sum.observations === 0

  if (!hydrated && hm.rows.length === 0) return <PageFrame title="Reports"><LoadingBlocks label="Opening the reports" rows={4} /></PageFrame>

  const filterFields: V2FilterField[] = [
    v2SelectField("cohort", "Cohort", cohortsOf(s).map((c) => ({ value: c, label: c })), "fa-users"),
    v2SelectField("group", "Group", groupsOf(s, f.cohort).map((g) => ({ value: g, label: g })), "fa-user-group", f.cohort === ALL ? { disabled: true, hint: "Choose a cohort first" } : {}),
    v2SelectField("course", "Clinical course", coursesOf(s).map((c) => ({ value: c.id, label: c.label })), "fa-book-medical"),
    v2SelectField("category", "Category", cats.map((c) => ({ value: c, label: c })), "fa-folder"),
    v2SelectField("tag", "Tag", tagsOf(s).map((c) => ({ value: c, label: c })), "fa-tags", { hint: "Cuts across categories" }),
    v2SelectField("location", "Location", locationsOf(s).map((c) => ({ value: c, label: c })), "fa-location-dot", { hint: "Filters the evidence" }),
    v2SelectField("setting", "Setting", (["clinical", "lab", "simulation"] as Setting[]).map((x) => ({ value: x, label: SETTING_LABEL[x] })), "fa-hospital", { hint: "Filters the evidence" }),
    v2SelectField("clinicalSetting", "Clinical setting", clinicalSettings.map((x) => ({ value: x, label: x })), "fa-stethoscope"),
    v2SelectField("mandatoryOnly", "Mandatory skills only", [{ value: "yes", label: "Yes" }], "fa-asterisk"),
  ]

  const link = (id: string, label: string) => (
    <Link href={linkTo({ role, kind: "student", id })} aria-label={`Open the record of ${label}`} className="rounded-sm font-medium text-foreground underline underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
      {label}
    </Link>
  )

  const metrics: MetricItem[] = [
    { id: "achieved", label: "Mandatory skills achieved", value: `${sum.mandatoryAchievedPct}%`, delta: "", trend: "neutral", description: `${sum.students} students` },
    { id: "behind", label: "Students behind pace", value: sum.behind, delta: "", trend: "neutral", trendPolarity: "lower_is_better", description: `of ${sum.students}` },
    { id: "single", label: "Skills with one evaluator", value: sum.singleRaterSkills, delta: "", trend: "neutral", description: "All evidence from one person" },
    { id: "sim", label: "Evidence from simulation", value: `${sum.simulationShare}%`, delta: "", trend: "neutral", description: `of ${sum.observations} evaluations` },
  ]

  // Grid: weakest skills first (fewest achieved), lagging students first (HeatGrid sorts rows by fewest met).
  const columns: HeatColumn[] = att.map((a) => ({ id: a.skill.id, label: a.skill.name, sublabel: `${a.achieved}/${a.students} met${a.level === "mandatory" ? "" : ", optional"}` }))
  const gridRows: HeatRow[] = hm.rows.map((r) => {
    return {
      id: r.student.id,
      label: r.student.name,
      sublabel: `${r.achieved} of ${hm.skills.length} met`,
      cells: Object.fromEntries(r.cells.map((c) => [c.skillId, gridState(c.state)])),
      cellText: Object.fromEntries(r.cells.filter((c) => c.need > 0).map((c) => [c.skillId, `${c.counted}/${c.need}`])),
    }
  })

  return (
    <PageFrame
      title="Reports"
      subtitle={contextLine(s)}
      actionItems={[
        { id: "export", label: "Export", icon: "fa-file-export", variant: "outline", onSelect: () => setExportOpen(true) },
        { id: "how", label: "How this is counted", icon: "fa-circle-info", placement: "overflow", onSelect: () => setMethodOpen(true) },
      ]}
    >
      <div className="flex flex-col gap-5" data-reports={role}>
        <section aria-label="Report summary" data-summary>
          <KeyMetrics variant="cards" size="sm" showHeader={false} metrics={metrics} metricsSingleRow className="px-0 lg:px-0" />
        </section>

        <div className="flex flex-col gap-3">
          <V2FilterBar fields={filterFields} filters={toActive(f)} onChange={(next) => setF(fromActive(s, next))} resultCount={hm.rows.length} resultNoun="students" />
          {conflict ? (
            <LocalBanner variant="warning" title="These filters cannot match any evidence" data-filter-conflict>
              <p>{conflict}</p>
              <Button type="button" variant="outline" size="lg" className={`${BTN} mt-2`} onClick={() => setF((cur) => (fix?.keys ?? ["clinicalSetting"]).reduce((acc, k) => removeFilter(acc, k), cur))}>{fix?.label ?? "Clear the clinical setting filter"}</Button>
            </LocalBanner>
          ) : noEvidence ? (
            <LocalBanner variant="info" title="No counted evidence for these filters" data-filter-empty>
              Remove a filter to see more.
            </LocalBanner>
          ) : null}
        </div>

        <Tabs value={tab} onValueChange={(v) => setTab(v as TabId)}>
          <TabsList variant="line" aria-label="Report views" className={`rounded-md ${FOCUS}`}>
            {(Object.keys(TAB_LABEL) as TabId[]).map((id) => <TabsTrigger key={id} value={id}>{TAB_LABEL[id]}</TabsTrigger>)}
          </TabsList>

          <TabsContent value="students" className={`flex flex-col gap-6 rounded-md pt-4 ${FOCUS}`}>
            <ChartCard title="Students by skill" description="Weakest skills and students furthest behind come first." className="h-auto">
            <div className="flex flex-col gap-3" data-heatmap-view>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <HeatGridKey states={["met", "notYet", "notMet", "none"]} />
                <Button type="button" variant="outline" size="sm" aria-pressed={asTable} data-as-table onClick={() => setAsTable((v) => !v)}>
                  {asTable ? "Show as grid" : "Show as table"}
                </Button>
              </div>
              {hm.skills.length === 0 ? (
                <p className="text-sm text-muted-foreground">No published skill matches these filters.</p>
              ) : asTable ? (
                <StudentTable rows={rows} focusSkill={focusSkill} skillName={att.find((x) => x.skill.id === focusSkill)?.skill.name} onClear={() => setFocusSkill(null)} link={link} onOpen={(studentId, skillId, opener) => setPicked({ studentId, skillId, opener })} />
              ) : (
                <div data-heatmap>
                  <HeatGrid
                    caption="Students by skills, weakest first"
                    rowHeader="Student"
                    columns={columns}
                    rows={gridRows}
                    showKey={false}
                    onCellSelect={(rowId, colId) => setPicked({ studentId: rowId, skillId: colId, opener: document.activeElement instanceof HTMLElement && document.activeElement.closest("[data-heat-row]") ? document.activeElement : null })}
                    className="max-md:[&_button]:min-h-11 max-md:[&_button]:min-w-11"
                  />
                </div>
              )}
            </div>
            </ChartCard>

            <ChartCard title="Pace" description="Evaluations collected against the expected pace." className="h-auto">
              <DotStrip label="Evaluations collected toward mandatory skills" dots={paceDots(allPace)} pace={paceMarker()} paceLabel="Expected by now" />
            </ChartCard>

            <section aria-labelledby="pace-heading" className="flex flex-col gap-3" data-pace>
              <div className="flex items-center gap-1">
                <h2 id="pace-heading" className="text-base font-semibold text-foreground">{`Students behind pace (${behind.length})`}</h2>
                <Tip label={`The term is ${Math.round(termShare() * 100)}% through, so about ${Math.round(termShare() * 100)}% of required evaluations are due.`}>
                  <Button type="button" variant="ghost" size="icon-sm" aria-label="How pace is counted">
                    <i className="fa-light fa-circle-info" aria-hidden="true" />
                  </Button>
                </Tip>
              </div>
              <V2Grid<PaceRow>
                caption="Students behind the expected pace"
                rows={behind}
                id={(r) => r.studentId}
                selectable={false}
                emptyText="No student is behind the expected pace."
                columns={[
                  v2col<PaceRow>("student", "Student", 170, (r) => link(r.studentId, r.name)),
                  v2col<PaceRow>("achieved", "Mandatory skills achieved", 190, (r) => `${r.achieved} of ${r.total}`),
                  v2col<PaceRow>("collected", "Evaluations collected", 170, (r) => `${r.collected} of ${r.needed}`),
                  v2col<PaceRow>("short", "Short by", 170, (r) => <StatusPill kind="cell" value="attempted" label={`${r.behindBy} ${plural(r.behindBy, "evaluation", "evaluations")}`} />),
                  v2col<PaceRow>("open", "Open mandatory skills", 320, (r) => r.open.map((o) => `${o.name} (${o.counted} of ${o.need})`).join("; ") || "None"),
                  v2col<PaceRow>("verified", "Program verification", 200, (r) => <VerifyBadge row={vrows.get(r.studentId)} />),
                ]}
              />
            </section>
          </TabsContent>

          <TabsContent value="skills" className={`flex flex-col gap-1 rounded-md pt-4 ${FOCUS}`}>
            <ChartCard title="Attainment by skill" description="Students achieved, in progress or not started, weakest skill first." className="h-auto">
            {att.length === 0 ? <p className="text-sm text-muted-foreground">No published skill matches these filters.</p> : null}
            <AttainmentKey />
            <ul className="flex flex-col" aria-label="Skills, weakest first" data-attainment>
              {att.map((a) => (
                <SkillRow key={a.skill.id} a={a} onShow={() => { setFocusSkill(a.skill.id); setAsTable(true); setTab("students") }} />
              ))}
            </ul>
            </ChartCard>
          </TabsContent>

          <TabsContent value="tags" className={`flex flex-col gap-1 rounded-md pt-4 ${FOCUS}`}>
            <TagsTab report={tags} onShowSkill={(id) => { setFocusSkill(id); setAsTable(true); setTab("students") }} />
          </TabsContent>

          <TabsContent value="evaluators" className={`flex flex-col gap-3 rounded-md pt-4 ${FOCUS}`}>
            <p className="text-sm text-muted-foreground" data-rater-note>Gaps are not judgements: evaluators see different students.</p>
            <V2Grid<RaterRow>
              caption="Rater comparison"
              rows={raters}
              id={(r) => r.id}
              selectable={false}
              emptyText="No counted evidence for these filters."
              columns={[
                v2col<RaterRow>("name", "Evaluator", 190, (r) => <span className="font-medium text-foreground">{r.name}</span>),
                v2col<RaterRow>("role", "Role", 220, (r) => r.role),
                v2col<RaterRow>("n", "Evaluations", 120, (r) => String(r.evaluations)),
                v2col<RaterRow>("met", "Met", 90, (r) => String(r.met)),
                v2col<RaterRow>("notmet", "Not met", 100, (r) => String(r.notMet)),
                v2col<RaterRow>("notyet", "Not yet", 100, (r) => String(r.notYet)),
                v2col<RaterRow>("rate", "Met rate", 100, (r) => `${r.metRate}%`),
                v2col<RaterRow>("vs", "Against all evaluators", 190, (r) => `${r.vsAll > 0 ? "+" : ""}${r.vsAll} points`),
                v2col<RaterRow>("stu", "Students", 100, (r) => String(r.students)),
                v2col<RaterRow>("note", "Note", 200, (r) => (r.small ? <StatusBadge label="Small numbers, read with care" tone="neutral" icon="fa-circle-info" size="sm" /> : "")),
              ]}
            />
          </TabsContent>
        </Tabs>
      </div>

      <ExportSheet s={s} f={f} students={hm.rows.map((r) => ({ id: r.student.id, name: r.student.name }))} open={exportOpen} onOpenChange={setExportOpen} />

      <EvidenceLedgerSheet s={s} f={f} role={role} target={picked} onClose={() => setPicked(null)} />

      <Sheet open={methodOpen} onOpenChange={setMethodOpen}>
        <SheetContent side="right" size="lg" className="flex flex-col gap-0 p-0" data-method-sheet>
          <SheetHeader className="border-b border-border p-4 pe-12">
            <SheetTitle>How this is counted</SheetTitle>
            <SheetDescription>Counted evidence only. Filters narrow the evidence first, then every figure is recalculated.</SheetDescription>
          </SheetHeader>
          <dl className="flex flex-col gap-4 overflow-y-auto p-4 text-sm">
            <Method term="Grid cells">Met means the skill&apos;s own rule is satisfied. Not yet met means some counted evaluations toward it. Did not meet means evaluations were counted but none was Met. Open a cell for the count.</Method>
            <Method term="Pace">{`The term runs ${fmtDay(`${TERM.start}T00:00:00Z`)} to ${fmtDay(`${TERM.end}T00:00:00Z`)}. ${termDaysGone()} days have passed (${Math.round(termShare() * 100)}%), so a student should have collected about that share of the evaluations the mandatory rules ask for. A student is behind when more than ${PACE_MARGIN} ${plural(PACE_MARGIN, "evaluation", "evaluations")} short.`}</Method>
            <Method term="One evaluator">A skill is flagged when it has two or more observations and one evaluator behind all of them. One observation is not flagged.</Method>
            <Method term="Evaluators">{`Met rate is the share of an evaluator's counted evaluations that were Met. The gap is in points against all evaluators together. Evaluators with under ${SMALL_NUMBERS} evaluations are marked.`}</Method>
            <Method term="Observations">Counted evaluations of any outcome.</Method>
          </dl>
        </SheetContent>
      </Sheet>
    </PageFrame>
  )
}

function Method({ term, children }: { term: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <dt className="font-medium text-foreground">{term}</dt>
      <dd className="text-muted-foreground">{children}</dd>
    </div>
  )
}

/** V11: one stacked bar per skill, weakest first, with the single-evaluator flag and simulation share beside it. */
function SkillRow({ a, onShow }: { a: SkillAttainment; onShow: () => void }) {
  const segs = [
    { id: "met", label: "Achieved", value: a.achieved, tone: "met" as const },
    { id: "prog", label: "In progress", value: a.inProgress, tone: "notYet" as const },
    { id: "att", label: "Did not meet", value: a.attempted, tone: "notMet" as const },
    { id: "none", label: "Not started", value: a.notStarted, tone: "neutral" as const, hatched: true },
  ].filter((x) => x.value > 0)
  const only = a.stat.raters[0]?.name
  return (
    <li className="grid gap-2 border-b border-border py-3 last:border-b-0 md:grid-cols-[15rem_minmax(0,1fr)] md:gap-6" data-skill-row={a.skill.id}>
      <div className="flex flex-col gap-1">
        <span className="font-medium text-foreground">{a.skill.name}</span>
        <span className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
          {a.level === "mandatory" ? "Mandatory" : "Optional"}
          {a.stat.simulation > 0 ? <span>{`${a.stat.simulationShare}% simulation`}</span> : null}
          {a.stat.singleRater ? (
            <Tip label={`One evaluator behind every observation: ${only}`}>
              <span tabIndex={0} className="inline-flex rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                <StatusBadge label="One evaluator" tone="warning" icon="fa-user" size="sm" />
              </span>
            </Tip>
          ) : null}
        </span>
      </div>
      <div className="flex flex-col gap-1">
        <StackedBar label={a.skill.name} segments={segs} unit="student" showLegend={false} />
        <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
          <span className="tabular-nums text-muted-foreground">{`${a.achieved} of ${a.students} achieved`}</span>
          <Button type="button" variant="link" size="sm" className="h-auto p-0" aria-label={`Show the students for ${a.skill.name}`} onClick={onShow}>Show students</Button>
        </div>
      </div>
    </li>
  )
}

/** The grid in words: the accessible alternative, one row for each student and skill. */
function StudentTable({ rows, focusSkill, skillName, onClear, link, onOpen }: { rows: StudentSkillRow[]; focusSkill: string | null; skillName: string | undefined; onClear: () => void; link: (id: string, label: string) => React.ReactNode; onOpen: (studentId: string, skillId: string, opener: HTMLElement) => void }) {
  return (
    <div className="flex flex-col gap-3">
      {focusSkill ? (
        <div className="flex flex-wrap items-center gap-2" data-skill-focus>
          <Button type="button" variant="outline" size="sm" aria-label={`Remove filter Skill: ${skillName ?? ""}`} onClick={onClear}>
            {`Skill: ${skillName ?? ""}`}
            <i className="fa-light fa-xmark" aria-hidden="true" />
          </Button>
        </div>
      ) : null}
      <V2Grid<StudentSkillRow>
        caption="Every student and skill, in words"
        rows={rows}
        id={(r) => r.id}
        selectable={false}
        emptyText="No student has evidence for these filters."
        columns={[
          v2col<StudentSkillRow>("student", "Student", 170, (r) => link(r.studentId, r.student)),
          v2col<StudentSkillRow>("skill", "Skill", 240, (r) => r.skill),
          v2col<StudentSkillRow>("level", "In this course", 130, (r) => (r.level === "mandatory" ? "Mandatory" : "Optional")),
          v2col<StudentSkillRow>("status", "Status", 200, (r) => <StatusPill kind="cell" value={r.state} label={r.status} />),
          v2col<StudentSkillRow>("obs", "Observations", 120, (r) => String(r.observations)),
          v2col<StudentSkillRow>("raters", "Evaluators", 110, (r) => String(r.raters)),
          v2col<StudentSkillRow>("sim", "Simulation", 110, (r) => String(r.simulation)),
          v2col<StudentSkillRow>("evidence", "Evidence", 150, (r) => (
            <Button type="button" variant="outline" size="sm" aria-label={`Open evidence, ${r.student}, ${r.skill}`} onClick={(e) => onOpen(r.studentId, r.skillId, e.currentTarget)}>Open evidence</Button>
          )),
        ]}
      />
    </div>
  )
}

function VerifyBadge({ row }: { row: VerificationRow | undefined }) {
  if (!row) return <span>Not on record</span>
  return <StatusPill kind="verify" value={row.status} label={statusLabel(row.status, row.version)} />
}
