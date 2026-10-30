"use client"

/**
 * Ranked tables for the Skills, Sections and Tags views (REQ RP-03, RP-04) and the table form of the Students view (RP-02).
 * One DS DataTable each, lazy rows past 80. With `search` the page owns the one search box (the table filters by name and its
 * own query controls stay off); without it the table keeps its own search and filters (the director's Reports). Every state
 * count is a link that opens the peek with exactly that many records; the distribution strip is decoration beside those
 * printed counts.
 * Order (Romit 2026-10-27, "is this placed correctly here?"): the default order is the table's own sort state, not a sentence
 * above it. Every table opens sorted on the Achieved column ascending, lowest share achieved first; the header carries the DS
 * sort mark and aria-sort. The column prints the count and sorts by the share, so rows of different sizes rank fairly.
 */
import * as React from "react"
import { LabLink as Link } from "@/components/lab/lab-bar/lab-link"
import { DataTable } from "@exxatdesignux/ui/components/data-table"
import type { ColumnDef } from "@exxatdesignux/ui/components/data-table/types"
import { RECORD_STATES, RECORD_STATE_LABEL, type RecordState } from "@/lib/lab/dashboard"
import type { AttGroupRow, AttSkill, AttStudent, PeekKind, PeekRef, StateCounts, UnrequiredSkill } from "@/lib/lab/attainment"
import { capitalize, skillNoun, skillNounPlural } from "@/lib/lab/terms"
import { BehindMark, CountLink, StateStrip } from "@/components/lab/admin-b/state-viz"
import { EmptyBlock } from "@/components/lab/empty-block"
import { LINK_IN_TABLE } from "@/components/lab/link-styles"
import { fmt, initialsOf } from "@/lib/v2/format"
import { PersonIdentityCell } from "@exxatdesignux/ui/components/data-views/person-identity-cell"
import { RECORD_STATE_META } from "@/lib/v2/labels"

/** Column headers use the canonical state words (lib/v2/labels.ts): "Evidence does not qualify", never "Does not qualify". */
const SHORT: Record<RecordState, string> = { achieved: RECORD_STATE_META.achieved.label, progress: RECORD_STATE_META.progress.label, unqualified: RECORD_STATE_META.unqualified.label, none: RECORD_STATE_META.none.label }
/** Name filter for the page-owned search; undefined leaves the table its own query controls. */
const bySearch = <T,>(rows: T[], search: string | undefined, text: (r: T) => string): T[] => { const q = (search ?? "").trim().toLowerCase(); return q ? rows.filter((r) => text(r).toLowerCase().includes(q)) : rows }
const query = (search: string | undefined) => (search === undefined ? { searchable: true, showQueryControls: true } : { searchable: false, showQueryControls: false })
const LAZY = { enabled: true, threshold: 80, chunkSize: 40, loadingLabel: "Loading more" }
/** The Achieved column sorts by share achieved. Its key equals its sortKey, which is what makes the DS header report aria-sort. */
const ACHIEVED_KEY = "pct_achieved"
/** Every report table opens lowest share achieved first. */
export const DEFAULT_SORT = { key: ACHIEVED_KEY, dir: "asc" as const }
const colKey = (s: RecordState) => (s === "achieved" ? ACHIEVED_KEY : `n_${s}`)
/** Every sortable column carries sortKey equal to its key, so every sortable header reports aria-sort. */
const sorted = <C extends { key: string; sortable?: boolean }>(c: C): C => (c.sortable ? { ...c, sortKey: c.key } : c)

function stateColumns<T extends { counts: StateCounts; total: number }>(kind: PeekKind, idOf: (r: T) => string, nameOf: (r: T) => string, peekHref: (r: PeekRef) => string, unit: string): ColumnDef<T & Record<string, unknown>>[] {
  return [
    {
      key: "distribution",
      label: "Distribution",
      width: 110,
      cell: (r) => <StateStrip counts={r.counts} total={r.total} label={`${nameOf(r)}: ${RECORD_STATES.map((s) => `${r.counts[s]} ${RECORD_STATE_LABEL[s].toLowerCase()}`).join(", ")}`} />,
    },
    ...RECORD_STATES.map((s) => ({
      key: colKey(s),
      label: SHORT[s],
      // Fits the Skills tab inside the 1440 content width with no column cut at the edge (anatomy A10, 2026-10-30).
      width: s === "unqualified" ? 170 : s === "none" ? 136 : 110,
      sortable: true,
      cell: (r: T) => <CountLink n={r.counts[s]} href={peekHref({ kind, id: idOf(r), state: s })} label={`${nameOf(r)}, ${RECORD_STATE_LABEL[s]}: ${fmt(r.counts[s])} ${unit}. Open the list`} />,
    })),
  ] as ColumnDef<T & Record<string, unknown>>[]
}

/**
 * Flatten counts into sortable keys (pct_achieved, n_progress, ...). A row nobody needs (an "All skills" extra) has no share
 * (null), so it sorts after every required row.
 */
const withKeys = <T extends { counts: StateCounts; total: number; required?: boolean }>(rows: T[]) =>
  rows.map((r) => ({ ...r, [ACHIEVED_KEY]: r.required === false || !r.total ? null : r.counts.achieved / r.total, n_achieved: r.counts.achieved, n_progress: r.counts.progress, n_unqualified: r.counts.unqualified, n_none: r.counts.none }))

type SkillRow = AttSkill & { required: boolean; evaluations?: number }

/**
 * Ranked required skills; with `extra` ("All skills", LEDGER D-X16) the published skills nobody in scope needs follow as rows
 * without state counts, marked with `notRequiredLabel` (glyph + words), so no figure changes.
 */
export function SkillsTable({ rows, peekHref, extra, search, notRequiredLabel = "Not required this term" }: { rows: AttSkill[]; peekHref: (r: PeekRef) => string; extra?: UnrequiredSkill[]; search?: string; notRequiredLabel?: string }) {
  const notReq: SkillRow[] = (extra ?? []).map((k) => ({ skillId: k.skillId, name: k.name, section: k.section, tags: [], total: 0, counts: { achieved: 0, progress: 0, unqualified: 0, none: 0 }, achievedPct: 0, required: false, evaluations: k.evaluations }))
  const data: SkillRow[] = bySearch([...rows.map((r) => ({ ...r, required: true })), ...notReq], search, (r) => `${r.name} ${r.section}`)
  const states = stateColumns<SkillRow>("skill", (r) => r.skillId, (r) => r.name, peekHref, "students").map((c) =>
    c.key === "distribution"
      ? { ...c, cell: (r: SkillRow & Record<string, unknown>, ctx: Parameters<NonNullable<typeof c.cell>>[1]) => (r.required ? c.cell!(r, ctx) : <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground"><i className="fa-light fa-circle-minus" aria-hidden="true" />{notRequiredLabel}</span>) }
      : { ...c, cell: (r: SkillRow & Record<string, unknown>, ctx: Parameters<NonNullable<typeof c.cell>>[1]) => (r.required ? c.cell!(r, ctx) : <span className="sr-only">Not required</span>) },
  )
  const columns = ([
    { key: "name", label: capitalize(skillNoun()), width: 212, sortable: true, cell: (r) => (r.required ? <Link href={peekHref({ kind: "skill", id: r.skillId })} scroll={false} className={`whitespace-normal ${LINK_IN_TABLE}`}>{r.name}</Link> : <span className="whitespace-normal text-muted-foreground">{r.name}</span>) },
    // Names and sections wrap at spaces instead of cutting off (rework 2026-10-30).
    { key: "section", label: "Section", width: 176, sortable: true, cell: (r) => <span className="whitespace-normal">{r.section}</span> },
    { key: "total", label: "Required for", width: 100, sortable: true, cell: (r) => (r.required ? <CountLink n={r.total} href={peekHref({ kind: "skill", id: r.skillId })} label={`${r.name}: required for ${fmt(r.total)} students. Open the list`} /> : <span className="tabular-nums text-muted-foreground">0</span>) },
    ...states,
  ] as ColumnDef<SkillRow & Record<string, unknown>>[]).map(sorted)
  return <DataTable<SkillRow & Record<string, unknown>> data={withKeys(data) as never} columns={columns} defaultSort={DEFAULT_SORT} getRowId={(r) => String(r.skillId)} selectable={false} {...query(search)} edgeInset={false} lazyLoading={LAZY} emptyState={<EmptyBlock compact title={`No ${skillNounPlural()} match these filters`} />} />
}

export function GroupTable({ rows, kind, firstLabel, peekHref, unitWord, search }: { rows: AttGroupRow[]; kind: "section" | "tag"; firstLabel: string; peekHref: (r: PeekRef) => string; unitWord: string; search?: string }) {
  const columns = ([
    { key: "label", label: firstLabel, width: 220, sortable: true, cell: (r) => <Link href={peekHref({ kind, id: r.key })} scroll={false} className={LINK_IN_TABLE}>{r.label}</Link> },
    { key: "skills", label: `Required ${skillNounPlural()}`, width: 120, sortable: true, cell: (r) => <span className="tabular-nums">{fmt(r.skills)}</span> },
    // Each required skill counted once per student who needs it; "records" is a banned word (glossary).
    { key: "total", label: "Required in total", width: 140, sortable: true, cell: (r) => <CountLink n={r.total} href={peekHref({ kind, id: r.key })} label={`${r.label}: ${fmt(r.total)} required in total. Open the list`} /> },
    ...stateColumns<AttGroupRow>(kind, (r) => r.key, (r) => r.label, peekHref, unitWord),
  ] as ColumnDef<AttGroupRow & Record<string, unknown>>[]).map(sorted)
  return <DataTable<AttGroupRow & Record<string, unknown>> data={withKeys(bySearch(rows, search, (r) => r.label)) as never} columns={columns} defaultSort={DEFAULT_SORT} getRowId={(r) => String(r.key)} selectable={false} {...query(search)} edgeInset={false} emptyState={<EmptyBlock compact title={`No ${kind === "tag" ? "tags" : "sections"} match these filters`} />} />
}

export function StudentsTable({ rows, peekHref, behindLabel, search }: { rows: AttStudent[]; peekHref: (r: PeekRef) => string; behindLabel: string; search?: string }) {
  const columns = ([
    {
      key: "name",
      label: "Student",
      width: 260,
      sortable: true,
      cell: (r) => (
        <span className="flex min-w-0 items-center justify-between gap-3">
          <span className="flex min-w-0 flex-col">
            <PersonIdentityCell name={r.name} initials={initialsOf(r.name)} email={r.group ? `${r.cohort}, ${r.group}` : r.cohort} renderName={(n) => <Link href={peekHref({ kind: "student", id: r.id })} scroll={false} className={`truncate ${LINK_IN_TABLE}`}>{n}</Link>} />
          </span>
          {r.behind ? <BehindMark label={behindLabel} /> : null}
        </span>
      ),
    },
    ...stateColumns<AttStudent>("student", (r) => r.id, (r) => r.name, peekHref, `required ${skillNounPlural()}`),
  ] as ColumnDef<AttStudent & Record<string, unknown>>[]).map(sorted)
  return <DataTable<AttStudent & Record<string, unknown>> data={withKeys(bySearch(rows, search, (r) => `${r.name} ${r.cohort} ${r.group ?? ""}`)) as never} columns={columns} defaultSort={DEFAULT_SORT} getRowId={(r) => String(r.id)} selectable={false} {...query(search)} edgeInset={false} lazyLoading={LAZY} emptyState={<EmptyBlock compact title="No students match these filters" />} />
}
