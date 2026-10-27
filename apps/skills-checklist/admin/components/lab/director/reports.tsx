"use client"

/**
 * Reports pieces for the director (REQ RP-01 to RP-10): one DataTable per view (by student, by skill, by section) on the shared
 * scope, the export controls (DS ExportDrawer, plus a popover that says what each file holds), and the line that says what is
 * excluded. Every count links to the rows behind it with the same scope [REQ RP-05, RP-06].
 */
import { capitalize, skillNoun, skillNounPlural } from "@/lib/lab/terms"
import * as React from "react"
import { LabLink as Link } from "@/components/lab/lab-bar/lab-link"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import { DataTable } from "@exxatdesignux/ui/components/data-table"
import type { ColumnDef } from "@exxatdesignux/ui/components/data-table/types"
import { ExportDrawer } from "@exxatdesignux/ui/components/ui/export-drawer"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@exxatdesignux/ui/components/ui/dropdown-menu"
import { PersonIdentityCell } from "@exxatdesignux/ui/components/data-views/person-identity-cell"
import { ViewSegmentedControl } from "@exxatdesignux/ui/components/ui/view-segmented-control"
import { CountLink } from "@/components/lab/director/parts"
import { LINK_IN_TABLE as LINK } from "@/components/lab/link-styles"
import { EmptyBlock } from "@/components/lab/empty-block"
import { fmt, initialsOf } from "@/lib/v2/format"
import { csvColumns, DIRECTOR_NAME, detailHref, directorHref, listHref, plural, type ReportModel, type ReportView, type SectionReportRow, type SkillReportRow, type StudentReportRow } from "@/lib/lab/director"
import type { LabScope } from "@/lib/lab/scope"
import { RECORD_STATE_META } from "@/lib/v2/labels"

export const VIEW_OPTIONS = [
  { value: "student" as const, label: "By student" },
  // A getter, so the label follows the program's noun when it changes (Settings > Naming).
  { value: "skill" as const, get label() { return `By ${skillNoun()}` } },
  { value: "section" as const, label: "By section" },
]

export function ViewSwitch({ view, onChange }: { view: ReportView; onChange: (v: ReportView) => void }) {
  return <ViewSegmentedControl value={view} onValueChange={onChange} options={VIEW_OPTIONS} aria-label="Report view" />
}

const num = "text-sm tabular-nums"
// Engine state words from the one label map (lib/v2/labels.ts): "Evidence does not qualify", "No evidence yet".
const UNQ = RECORD_STATE_META.unqualified.label
const NONE = RECORD_STATE_META.none.label

function studentCols(scope: LabScope): ColumnDef<StudentReportRow>[] {
  return [
    { key: "name", label: "Student", width: 220, sortable: true, cell: (r) => <PersonIdentityCell name={r.name} initials={initialsOf(r.name)} renderName={(n) => <Link className={LINK} href={detailHref(scope, r.id)}>{n}</Link>} /> },
    { key: "achieved", label: "Achieved", width: 120, sortable: true, cell: (r) => <CountLink n={r.achieved} href={detailHref(scope, r.id)} label={`${r.name}: ${r.achieved} achieved. Open the record`} className={num} /> },
    { key: "progress", label: "In progress", width: 120, sortable: true, cell: (r) => <CountLink n={r.progress} href={detailHref(scope, r.id)} label={`${r.name}: ${r.progress} in progress. Open the record`} className={num} /> },
    // The two engine states stay apart [REQ AE-04]: never one "Unmet" column (that merge is OD-03, open).
    { key: "unqualified", label: UNQ, width: 200, sortable: true, cell: (r) => <CountLink n={r.unqualified} href={detailHref(scope, r.id)} label={`${r.name}: ${r.unqualified} ${UNQ.toLowerCase()}. Open the record`} className={num} /> },
    { key: "noEvidence", label: NONE, width: 130, sortable: true, cell: (r) => <CountLink n={r.noEvidence} href={detailHref(scope, r.id)} label={`${r.name}: ${r.noEvidence} ${NONE.toLowerCase()}. Open the record`} className={num} /> },
    { key: "pct", label: "Attainment", width: 120, sortable: true, cell: (r) => <span className={`${num} text-muted-foreground`}>{`${r.pct}%`}</span> },
  ]
}

function skillCols(scope: LabScope): ColumnDef<SkillReportRow>[] {
  return [
    { key: "name", label: capitalize(skillNoun()), width: 240, sortable: true, cell: (r) => <span className="truncate text-sm text-foreground" title={r.name}>{r.name}</span> },
    { key: "section", label: "Section", width: 180, sortable: true, cell: (r) => <span className="truncate text-sm text-muted-foreground">{r.section}</span> },
    { key: "achieved", label: "Achieved", width: 110, sortable: true, cell: (r) => <CountLink n={r.achieved} href={listHref(scope, { list: "has", skill: r.id })} label={`${r.achieved} students achieved ${r.name}. Open the list`} className={num} /> },
    { key: "progress", label: "In progress", width: 110, sortable: true, cell: (r) => <CountLink n={r.progress} href={listHref(scope, { list: "progress", skill: r.id })} label={`${r.progress} in progress on ${r.name}. Open the list`} className={num} /> },
    { key: "unqualified", label: UNQ, width: 200, sortable: true, cell: (r) => <CountLink n={r.unqualified} href={listHref(scope, { list: "unqualified", skill: r.id })} label={`${r.unqualified} with ${UNQ.toLowerCase()} on ${r.name}. Open the list`} className={num} /> },
    { key: "noEvidence", label: NONE, width: 130, sortable: true, cell: (r) => <CountLink n={r.noEvidence} href={listHref(scope, { list: "noevidence", skill: r.id })} label={`${r.noEvidence} with ${NONE.toLowerCase()} on ${r.name}. Open the list`} className={num} /> },
  ]
}

function sectionCols(scope: LabScope, variant: string): ColumnDef<SectionReportRow>[] {
  const bySkill = (section: string) => directorHref("reports", { ...scope, cat: section }, { variant, view: "skill" })
  return [
    { key: "section", label: "Section", width: 220, sortable: true, cell: (r) => <Link className={`${LINK} text-sm`} href={bySkill(r.section)}>{r.section}</Link> },
    { key: "skills", label: capitalize(skillNounPlural()), width: 90, sortable: true, cell: (r) => <Link className={`${LINK} ${num}`} href={bySkill(r.section)} aria-label={`${r.skills} ${skillNounPlural()} in ${r.section}. Open them`}>{fmt(r.skills)}</Link> },
    { key: "achieved", label: "Achieved", width: 110, sortable: true, cell: (r) => <span className={num}>{fmt(r.achieved)}</span> },
    { key: "progress", label: "In progress", width: 110, sortable: true, cell: (r) => <span className={num}>{fmt(r.progress)}</span> },
    { key: "unqualified", label: UNQ, width: 200, sortable: true, cell: (r) => <span className={num}>{fmt(r.unqualified)}</span> },
    { key: "noEvidence", label: NONE, width: 130, sortable: true, cell: (r) => <span className={num}>{fmt(r.noEvidence)}</span> },
    { key: "pct", label: "Attainment", width: 110, sortable: true, cell: (r) => <span className={`${num} text-muted-foreground`}>{`${r.pct}%`}</span> },
  ]
}

export function ReportTable({ view, r, scope, variant }: { view: ReportView; r: ReportModel; scope: LabScope; variant: string }) {
  const s = React.useMemo(() => studentCols(scope), [scope])
  const k = React.useMemo(() => skillCols(scope), [scope])
  const c = React.useMemo(() => sectionCols(scope, variant), [scope, variant])
  const common = { searchable: false, showQueryControls: false, edgeInset: false } as const
  if (view === "student") return <DataTable<StudentReportRow> key="student" data={r.students} columns={s} getRowId={(x) => x.id} {...common} emptyState={<EmptyBlock compact title="No students match these filters" />} />
  if (view === "skill") return <DataTable<SkillReportRow> key="skill" data={r.skills} columns={k} getRowId={(x) => x.id} {...common} emptyState={<EmptyBlock compact title={`No required ${skillNounPlural()} match these filters`} />} />
  return <DataTable<SectionReportRow> key="section" data={r.sections} columns={c} getRowId={(x) => x.id} {...common} emptyState={<EmptyBlock compact title="No sections match these filters" />} />
}

export const viewRows = (view: ReportView, r: ReportModel) => (view === "student" ? r.students.length : view === "skill" ? r.skills.length : r.sections.length)
const viewNoun = (view: ReportView, n: number) => (view === "student" ? plural(n, "student", "students") : view === "skill" ? plural(n, skillNoun(), skillNounPlural()) : plural(n, "section", "sections"))

const EXCLUDED = "Not in either file: self-ratings and private notes."

export function ExcludedLine() {
  return <p className="text-xs text-muted-foreground" data-excluded>{EXCLUDED}</p>
}

/**
 * One Export control (strategy/07 list budget: 1 action). The menu names each file and what it holds, so "what each file holds"
 * is one click away inside Export instead of a second button; either choice opens the DS ExportDrawer.
 */
export function ExportControls({ view, r }: { view: ReportView; r: ReportModel }) {
  const [open, setOpen] = React.useState(false)
  const n = viewRows(view, r)
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button type="button" variant="outline" size="sm">
            Export
            <i className="fa-light fa-chevron-down" aria-hidden="true" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-80">
          <DropdownMenuItem className="flex-col items-start gap-0.5" onSelect={() => setOpen(true)}>
            <span className="font-medium text-foreground">PDF, signed</span>
            <span className="text-xs text-muted-foreground">{`This view as shown, ${viewNoun(view, n)}, with the filters, ${DIRECTOR_NAME} and the date.`}</span>
          </DropdownMenuItem>
          <DropdownMenuItem className="flex-col items-start gap-0.5" onSelect={() => setOpen(true)}>
            <span className="font-medium text-foreground">CSV</span>
            <span className="text-xs text-muted-foreground">{`${plural(r.csvRows, "row", "rows")}, one per evaluation: ${csvColumns().join(", ").toLowerCase()}.`}</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">{EXCLUDED}</DropdownMenuLabel>
        </DropdownMenuContent>
      </DropdownMenu>
      <ExportDrawer open={open} onOpenChange={setOpen} totalRows={r.csvRows} visibleColumns={csvColumns().length} />
    </>
  )
}
