"use client"

import * as React from "react"
import { Badge } from "@exxatdesignux/ui/components/ui/badge"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import { DataTable } from "@exxatdesignux/ui/components/data-table"
import { ProgressCell } from "@exxatdesignux/ui/components/data-views/table-cells"
import type { Db, SkillStatusDisplay } from "@/lib/domain/types"
import { buttons, r4 } from "@/lib/copy"
import type { SkillReportRow, StudentReportRow, TagReportRow } from "@/lib/store"
import { reportingCopy as rc } from "@/lib/copy"

const PAGE = 25

/** Shared "Show 25 more" footer (P state): the table is never silently truncated. */
function useLimited<T>(rows: T[]): { shown: T[]; more: () => void; remaining: number } {
  const [limit, setLimit] = React.useState(PAGE)
  // A new result set (filter, search, sort) starts again at the first page.
  const first = rows[0]
  React.useEffect(() => setLimit(PAGE), [rows.length, first])
  const shown = rows.slice(0, limit)
  return { shown, more: () => setLimit((l) => l + PAGE), remaining: rows.length - shown.length }
}

type D<T> = { id: string; row: T }
export type Col<T> = { key: string; label: string; width: number; cell: (d: D<T>) => React.ReactNode }

/** One column definition: the DS DataTable hands the cell its data item, which here is `{ id, row }`. */
export const col = <T,>(key: string, label: string, width: number, render: (r: T) => React.ReactNode): Col<T> => ({ key, label, width, cell: (d) => render(d.row) })

export function Grid<T>({ caption, rows, id, columns, openRowId, onOpen, empty }: { caption: string; rows: T[]; id: (r: T) => string; columns: Col<T>[]; openRowId: string | null; onOpen: (r: T) => void; empty: React.ReactNode }) {
  const data = rows.map((row) => ({ id: id(row), row }))
  return (
    <div role="region" aria-label={caption}>
      <DataTable<D<T>>
        data={data as never}
        columns={columns as never}
        getRowId={(r) => String(r.id)}
        showQueryControls={false}
        searchable={false}
        edgeInset={false}
        openRowId={openRowId}
        onRowClick={(d) => onOpen(d.row)}
        emptyState={empty}
      />
    </div>
  )
}

const num = (n: number) => <span className="tabular-nums">{n}</span>

/** Percentage with the prototype's bar and a trailing chevron that signals the row opens. The bar is supplementary: the % is text. */
const pctCell = (pct: number) => (
  <span className="flex items-center justify-end gap-3 tabular-nums">
    <span>{pct}%</span>
    <span className="w-20" aria-hidden="true">
      <ProgressCell value={pct} max={100} tone="warning" label={false} className="w-full min-w-0 max-w-none" />
    </span>
    <i className="fa-light fa-chevron-right text-muted-foreground" aria-hidden="true" />
  </span>
)

const linkButton = (attrs: Record<string, string>, label: string, onClick: () => void, aria?: string) => (
  <Button type="button" variant="link" size="sm" className="h-auto p-0 text-left font-medium" aria-label={aria} {...attrs} onClick={onClick}>
    {label}
  </Button>
)

type Counts = { counts: { achieved: number; partial: number; evidenceDoesNotQualify: number; noEvidence: number } }
const stateCols = <T extends Counts>(display: SkillStatusDisplay, heads: string[]): Col<T>[] =>
  display === "four"
    ? [col<T>("achieved", heads[0], 100, (r) => num(r.counts.achieved)), col<T>("partial", heads[1], 110, (r) => num(r.counts.partial)), col<T>("dnq", heads[2], 170, (r) => num(r.counts.evidenceDoesNotQualify)), col<T>("none", heads[3], 140, (r) => num(r.counts.noEvidence))]
    : [col<T>("achieved", heads[0], 100, (r) => num(r.counts.achieved)), col<T>("partial", heads[1], 110, (r) => num(r.counts.partial)), col<T>("notmet", heads[2], 100, (r) => num(r.counts.evidenceDoesNotQualify + r.counts.noEvidence))]

/** By student (RP-02, prototype P-01). The engine's four states always add up; the OD-03 flag only changes how states 1 and 2 are shown. */
export function StudentTable({ rows, display, openStudentId, onOpen, empty }: { rows: StudentReportRow[]; display: SkillStatusDisplay; openStudentId: string | null; onOpen: (studentId: string) => void; empty: React.ReactNode }) {
  const { shown, more, remaining } = useLimited(rows)
  const heads = r4.headers.student(display)
  const columns: Col<StudentReportRow>[] = [
    col<StudentReportRow>("student", heads[0], 220, (r) => linkButton({ "data-student-id": r.student.id }, r.student.name, () => onOpen(r.student.id), `${r.student.name}, ${r.cohortName}, ${r.groupName}`)),
    col<StudentReportRow>("cohort", heads[1], 190, (r) => <span className="text-xs">{r.cohortName} {"·"} {r.groupName}</span>),
    ...stateCols<StudentReportRow>(display, heads.slice(2, heads.length - 1)),
    col<StudentReportRow>("attainment", heads[heads.length - 1], 260, (r) => pctCell(r.attainment)),
  ]
  return (
    <div>
      <Grid caption={rc.tableCaption.student} rows={shown} id={(r) => r.student.id} columns={columns} openRowId={openStudentId} onOpen={(r) => onOpen(r.student.id)} empty={empty} />
      {rows.length ? (
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border px-4 py-2 text-xs text-muted-foreground" data-testid="table-footer">
          <p>{r4.footer.students(shown.length, rows.length, display)}</p>
          {remaining > 0 ? (
            <Button type="button" variant="outline" size="sm" onClick={more}>
              {buttons.showMore(Math.min(PAGE, remaining))}
            </Button>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}

/** By skill (RP-03). The mandatory column exists only when the report is scoped to a course. */
export function SkillTable({ rows, db, display, courseScoped, openSkillId, onOpen, empty }: { rows: SkillReportRow[]; db: Db; display: SkillStatusDisplay; courseScoped: boolean; openSkillId: string | null; onOpen: (skillId: string) => void; empty: React.ReactNode }) {
  const heads = r4.headers.skill(display)
  const nState = display === "four" ? 4 : 3
  const stateHeads = heads.slice(4, 4 + nState)
  const columns: Col<SkillReportRow>[] = [
    col<SkillReportRow>("skill", heads[0], 240, (r) => (
      <span className="flex flex-col gap-1">
        {linkButton({ "data-skill-id": r.skill.id }, r.skill.name, () => onOpen(r.skill.id))}
        {r.skill.tagIds.length ? (
          <span className="flex flex-wrap gap-1">
            {r.skill.tagIds.map((t) => (
              <Badge key={t} variant="outline">
                {db.tags.find((x) => x.id === t)?.name ?? t}
              </Badge>
            ))}
          </span>
        ) : null}
      </span>
    )),
    col<SkillReportRow>("category", heads[1], 130, (r) => <span className="text-xs">{r.category?.name ?? rc.dash}</span>),
    col<SkillReportRow>("model", heads[2], 190, (r) => <Badge variant="secondary">{rc.models[r.skill.model.kind]}</Badge>),
    ...(courseScoped ? [col<SkillReportRow>("req", r4.headers.skillRequirement, 130, (r) => <span>{r.requirement === "mandatory" ? rc.mandatory : r.requirement === "nonMandatory" ? rc.nonMandatory : rc.dash}</span>)] : []),
    col<SkillReportRow>("students", heads[3], 120, (r) => num(r.studentsInView)),
    ...stateCols<SkillReportRow>(display, stateHeads),
    col<SkillReportRow>("pct", heads[4 + nState], 260, (r) => pctCell(r.percentAchieved)),
    col<SkillReportRow>("courses", heads[5 + nState], 90, (r) => num(r.courseCount)),
  ]
  return (
    <div>
      <Grid caption={rc.tableCaption.skill} rows={rows} id={(r) => r.skill.id} columns={columns} openRowId={openSkillId} onOpen={(r) => onOpen(r.skill.id)} empty={empty} />
      <p className="border-t border-border px-4 py-2 text-xs text-muted-foreground">{r4.skillNote}</p>
    </div>
  )
}

/** By tag (RP-04). Rows overlap and count student-skill records, and the page says so. */
export function TagTable({ rows, display, openTagId, onOpen, empty }: { rows: TagReportRow[]; display: SkillStatusDisplay; openTagId: string | null; onOpen: (tagId: string) => void; empty: React.ReactNode }) {
  const heads = r4.headers.tag(display)
  const nState = display === "four" ? 4 : 3
  const columns: Col<TagReportRow>[] = [
    col<TagReportRow>("tag", heads[0], 160, (r) => linkButton({ "data-tag-id": r.tag.id }, r.tag.name, () => onOpen(r.tag.id))),
    col<TagReportRow>("skills", heads[1], 90, (r) => num(r.skillCount)),
    col<TagReportRow>("cats", heads[2], 150, (r) => num(r.categoriesSpanned)),
    ...stateCols<TagReportRow>(display, heads.slice(3, 3 + nState)),
    col<TagReportRow>("pct", heads[3 + nState], 260, (r) => pctCell(r.percentAchieved)),
    col<TagReportRow>("all", heads[4 + nState], 150, (r) => num(r.studentsAchievingAll)),
  ]
  return (
    <div>
      <Grid caption={rc.tableCaption.tag} rows={rows} id={(r) => r.tag.id} columns={columns} openRowId={openTagId} onOpen={(r) => onOpen(r.tag.id)} empty={empty} />
      <p className="border-t border-border px-4 py-2 text-xs text-muted-foreground">{r4.tagNote}</p>
    </div>
  )
}

export type { Db }
