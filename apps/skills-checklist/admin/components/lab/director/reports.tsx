"use client"

/**
 * Reports pieces for the director (REQ RP-01 to RP-10): one DataTable per view (by student, by skill, by section) on the shared
 * scope, the export controls (DS ExportDrawer, plus a popover that says what each file holds), and the line that says what is
 * excluded. Every count links to the rows behind it with the same scope [REQ RP-05, RP-06].
 */
import { capitalize, inSentence, skillNoun, skillNounPlural } from "@/lib/lab/terms"
import { TYPE } from "@/components/lab/type-scale"
import type { PeekRef } from "@/lib/lab/attainment"
import type { RecordState } from "@/lib/lab/dashboard"
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
import { csvColumns, DIRECTOR_NAME, detailHref, plural, reportsHref, type ReportModel, type ReportView, type SectionReportRow, type SkillReportRow, type StudentReportRow, type TagReportRow } from "@/lib/lab/director"
import type { LabScope } from "@/lib/lab/scope"
import { MAPPING_LEVEL_LABEL, RECORD_STATE_META } from "@/lib/v2/labels"

export const VIEW_OPTIONS = [
  { value: "student" as const, label: "By student" },
  // A getter, so the label follows the program's noun when it changes (Settings > Naming).
  { value: "skill" as const, get label() { return `By ${skillNoun()}` } },
  { value: "section" as const, label: "By section" },
  // RP-04: tags cut across sections; the view says the rows overlap.
  { value: "tag" as const, label: "By tag" },
]

export function ViewSwitch({ view, onChange }: { view: ReportView; onChange: (v: ReportView) => void }) {
  return <ViewSegmentedControl value={view} onValueChange={onChange} options={VIEW_OPTIONS} aria-label="Report view" />
}

const num = "text-sm tabular-nums"
// Engine state words from the one label map (lib/v2/labels.ts): "Evidence does not qualify", "No evidence yet".
const UNQ = RECORD_STATE_META.unqualified.label
const NONE = RECORD_STATE_META.none.label
const PROG = RECORD_STATE_META.progress.label

/** A count opens the evidence behind it in place (RP-06: the peek, never a new page). */
export type PeekHrefFn = (ref: PeekRef) => string

/** Numbers right-aligned (design review 2026-10-30, CP-6): the header and the cell share one edge. */
const endHeader = (label: string) => () => <span className="block w-full text-end">{label}</span>
const end = (node: React.ReactNode) => <span className="block w-full text-end">{node}</span>

/**
 * The verdict number of a row: Attainment, right after the name, emphasised (semibold ink), right-aligned. The four engine-state
 * counts follow it, quieter (design review 2026-10-30, others #4).
 */
const pctCol = <T extends { pct: number }>(): ColumnDef<T> => ({
  key: "pct",
  label: "Attainment",
  width: 112,
  sortable: true,
  header: endHeader("Attainment"),
  cell: (r) => end(<span className={`${num} font-semibold text-foreground`}>{`${r.pct}%`}</span>),
})

type StateKey = "achieved" | "progress" | "unqualified" | "noEvidence"
const PEEK_STATE: Record<StateKey, RecordState> = { achieved: "achieved", progress: "progress", unqualified: "unqualified", noEvidence: "none" }
const STATE_WORD: Record<StateKey, string> = { achieved: "Achieved", progress: PROG, unqualified: UNQ, noEvidence: NONE }
const STATE_WIDTH: Record<StateKey, number> = { achieved: 100, progress: 110, unqualified: 200, noEvidence: 140 }

/**
 * The engine-state columns [REQ RP-02, AE-04], with a column dropped when it is zero on every row in scope (design review
 * 2026-10-30, CP-3: In progress and Does not qualify were zero for everyone). The dropped states stay reachable: the line above the
 * table names them with their zero (ZeroStatesLine), and they come back as soon as one row is non-zero. The two "not achieved"
 * states never merge into one column (that merge is OD-03, open).
 */
function stateCols<T extends Record<StateKey, number>>(rows: T[], ref: (r: T, k: StateKey) => PeekRef, labelOf: (r: T, k: StateKey) => string, peek: PeekHrefFn): ColumnDef<T>[] {
  return (Object.keys(PEEK_STATE) as StateKey[])
    .filter((k) => k === "achieved" || rows.some((r) => r[k] > 0))
    .map((k) => ({
      key: k,
      label: STATE_WORD[k],
      width: STATE_WIDTH[k],
      sortable: true,
      header: endHeader(STATE_WORD[k]),
      cell: (r: T) => end(<CountLink n={r[k]} href={peek(ref(r, k))} label={labelOf(r, k)} className={`${num} text-muted-foreground`} />),
    }))
}

/** The states hidden because they are zero on every row, said once so the four states stay readable (RP-02). */
export function ZeroStatesLine({ rows }: { rows: Array<Record<StateKey, number>> }) {
  const zero = (["progress", "unqualified", "noEvidence"] as StateKey[]).filter((k) => !rows.some((r) => r[k] > 0))
  if (!rows.length || !zero.length) return null
  return (
    <p className={TYPE.meta} data-zero-states>
      {`${zero.map((k, i) => (i ? inSentence(STATE_WORD[k]) : STATE_WORD[k])).join(" and ")} ${zero.length === 1 ? "is" : "are"} 0 on every row in this scope, so ${zero.length === 1 ? "its column is" : "their columns are"} hidden.`}
    </p>
  )
}

function studentCols(rows: StudentReportRow[], scope: LabScope, peek: PeekHrefFn): ColumnDef<StudentReportRow>[] {
  return [
    { key: "name", label: "Student", width: 220, sortable: true, cell: (r) => <PersonIdentityCell name={r.name} initials={initialsOf(r.name)} renderName={(n) => <Link className={LINK} href={detailHref(scope, r.id)}>{n}</Link>} /> },
    pctCol<StudentReportRow>(),
    ...stateCols(rows, (r, k) => ({ kind: "student", id: r.id, state: PEEK_STATE[k] }), (r, k) => `${r.name}: ${r[k]} ${inSentence(STATE_WORD[k])}. Show the evidence`, peek),
  ]
}

function skillCols(rows: SkillReportRow[], course: string, peek: PeekHrefFn): ColumnDef<SkillReportRow>[] {
  // RP-03: scoped to a course, each skill names its level there (Mandatory, Recommended, Optional), from the mapping.
  const level: ColumnDef<SkillReportRow>[] = course
    ? [{ key: "level", label: "In this course", width: 140, sortable: true, cell: (r) => <span className={`text-sm ${r.level === "mandatory" ? "font-medium text-foreground" : "text-muted-foreground"}`} data-course-level={r.level ?? "none"}>{r.level ? MAPPING_LEVEL_LABEL[r.level] : MAPPING_LEVEL_LABEL["not-expected"]}</span> }]
    : []
  return [
    { key: "name", label: capitalize(skillNoun()), width: 240, sortable: true, cell: (r) => <span className="text-sm text-foreground">{r.name}</span> },
    ...level,
    { key: "section", label: "Section", width: 180, sortable: true, cell: (r) => <span className="text-sm text-muted-foreground">{r.section}</span> },
    ...stateCols(rows, (r, k) => ({ kind: "skill", id: r.id, state: PEEK_STATE[k] }), (r, k) => `${r[k]} ${inSentence(STATE_WORD[k])} on ${r.name}. Show the evidence`, peek),
  ]
}

function sectionCols(rows: SectionReportRow[], scope: LabScope, variant: string, peek: PeekHrefFn): ColumnDef<SectionReportRow>[] {
  const bySkill = (section: string) => reportsHref({ ...scope, cat: section }, "readiness", { variant, view: "skill" })
  return [
    { key: "section", label: "Section", width: 220, sortable: true, cell: (r) => <Link className={`${LINK} text-sm`} href={bySkill(r.section)}>{r.section}</Link> },
    pctCol<SectionReportRow>(),
    { key: "skills", label: capitalize(skillNounPlural()), width: 90, sortable: true, header: endHeader(capitalize(skillNounPlural())), cell: (r) => end(<Link className={`${LINK} ${num}`} href={bySkill(r.section)} aria-label={`${r.skills} ${skillNounPlural()} in ${r.section}. Open them`}>{fmt(r.skills)}</Link>) },
    ...stateCols(rows, (r, k) => ({ kind: "section", id: r.section, state: PEEK_STATE[k] }), (r, k) => `${r[k]} ${inSentence(STATE_WORD[k])} in ${r.section}. Show the evidence`, peek),
  ]
}

function tagCols(rows: TagReportRow[], scope: LabScope, variant: string, peek: PeekHrefFn): ColumnDef<TagReportRow>[] {
  const bySkill = (tag: string) => reportsHref({ ...scope, tag }, "readiness", { variant, view: "skill" })
  return [
    { key: "tag", label: "Tag", width: 220, sortable: true, cell: (r) => <Link className={`${LINK} text-sm`} href={bySkill(r.tag)}>{r.tag}</Link> },
    pctCol<TagReportRow>(),
    { key: "skills", label: capitalize(skillNounPlural()), width: 90, sortable: true, header: endHeader(capitalize(skillNounPlural())), cell: (r) => end(<Link className={`${LINK} ${num}`} href={bySkill(r.tag)} aria-label={`${r.skills} ${skillNounPlural()} tagged ${r.tag}. Open them`}>{fmt(r.skills)}</Link>) },
    ...stateCols(rows, (r, k) => ({ kind: "tag", id: r.tag, state: PEEK_STATE[k] }), (r, k) => `${r[k]} ${inSentence(STATE_WORD[k])} under ${r.tag}. Show the evidence`, peek),
  ]
}

/** RP-04: a skill may carry several tags, so the tag rows overlap; say so, never imply a partition. */
export function TagOverlapLine({ r }: { r: ReportModel }) {
  const untagged = r.untagged ? ` ${plural(r.untagged, `${skillNoun()} has`, `${skillNounPlural()} have`)} no tag.` : ""
  const overlap = r.multiTagged
    ? `Tags overlap: ${plural(r.multiTagged, `${skillNoun()} counts`, `${skillNounPlural()} count`)} under more than one tag, so rows do not add up.`
    : `Tags can overlap, so rows need not add up. Here no ${skillNoun()} carries more than one tag.`
  return (
    <p className="text-xs text-muted-foreground" data-tag-overlap>
      {`${overlap}${untagged}`}
    </p>
  )
}

export function ReportTable({ view, r, scope, variant, peek }: { view: ReportView; r: ReportModel; scope: LabScope; variant: string; peek: PeekHrefFn }) {
  const s = React.useMemo(() => studentCols(r.students, scope, peek), [r.students, scope, peek])
  // The course is named once, on its chip; the column says "In this course" so no long course name is cut in the header.
  const k = React.useMemo(() => skillCols(r.skills, r.course, peek), [r.skills, r.course, peek])
  const c = React.useMemo(() => sectionCols(r.sections, scope, variant, peek), [r.sections, scope, variant, peek])
  const t = React.useMemo(() => tagCols(r.tags, scope, variant, peek), [r.tags, scope, variant, peek])
  const common = { searchable: false, showQueryControls: false, edgeInset: false } as const
  const rows = view === "student" ? r.students : view === "skill" ? r.skills : view === "tag" ? r.tags : r.sections
  return (
    <div className="flex flex-col gap-2">
      {view === "tag" ? <TagOverlapLine r={r} /> : null}
      <ZeroStatesLine rows={rows} />
      {view === "tag" ? (
        <DataTable<TagReportRow> key="tag" data={r.tags} columns={t} getRowId={(x) => x.id} {...common} emptyState={<EmptyBlock compact title={`No required ${skillNounPlural()} carry a tag`} />} />
      ) : view === "student" ? (
        <DataTable<StudentReportRow> key="student" data={r.students} columns={s} getRowId={(x) => x.id} {...common} emptyState={<EmptyBlock compact title="No students match these filters" />} />
      ) : view === "skill" ? (
        <DataTable<SkillReportRow> key="skill" data={r.skills} columns={k} getRowId={(x) => x.id} {...common} emptyState={<EmptyBlock compact title={`No required ${skillNounPlural()} match these filters`} />} />
      ) : (
        <DataTable<SectionReportRow> key="section" data={r.sections} columns={c} getRowId={(x) => x.id} {...common} emptyState={<EmptyBlock compact title="No sections match these filters" />} />
      )}
    </div>
  )
}

export const viewRows = (view: ReportView, r: ReportModel) => (view === "student" ? r.students.length : view === "skill" ? r.skills.length : view === "tag" ? r.tags.length : r.sections.length)
const viewNoun = (view: ReportView, n: number) => (view === "student" ? plural(n, "student", "students") : view === "skill" ? plural(n, skillNoun(), skillNounPlural()) : view === "tag" ? plural(n, "tag", "tags") : plural(n, "section", "sections"))

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
