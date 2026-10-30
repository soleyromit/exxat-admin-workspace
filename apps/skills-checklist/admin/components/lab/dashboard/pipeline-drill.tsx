"use client"

/**
 * Concept C drill: the required skill records behind a stage, a section or one segment, in the same scope (strategy/06 R1,
 * R5). Lives on the dashboard URL (?list=records&cond=<state>&q=<section>) so it has its own address and keeps the scope bar
 * above it; the page h1 names the list with its count, each condition is a removable chip, and a back link leads back.
 */
import * as React from "react"
import { LabLink as Link } from "@/components/lab/lab-bar/lab-link"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import { DrillToolbar } from "@/components/lab/dashboard/drill-toolbar"
import { DataTable } from "@exxatdesignux/ui/components/data-table"
import { RECORD_STATE_LABEL, pipelineDrill, studentHref, type PipelineModel, type PipelineRecord, type RecordState } from "@/lib/lab/dashboard"
import type { LabScope } from "@/lib/lab/scope"
import { capitalize, skillNoun } from "@/lib/lab/terms"
import { LINK_IN_TABLE } from "@/components/lab/link-styles"
import { StateBadge } from "@/components/lab/status-pill"
import { PersonIdentityCell } from "@exxatdesignux/ui/components/data-views/person-identity-cell"
import { initialsOf } from "@/lib/v2/format"


export function PipelineDrill({ model, scope, state, section, onChange, filters }: { model: PipelineModel; scope: LabScope; state: RecordState | null; section: string | null; onChange: (p: Record<string, string | null>) => void; /** The page scope Filters group, placed in this list's toolbar (D-L8b). */ filters?: React.ReactNode }) {
  const d = React.useMemo(() => pipelineDrill(model, { state, section }), [model, state, section])
  const [query, setQuery] = React.useState("")
  const q = query.trim().toLowerCase()
  const rows = q ? d.rows.filter((r) => `${r.student} ${r.skill} ${r.section} ${r.waitingWith ?? ""}`.toLowerCase().includes(q)) : d.rows
  // Columns sum to 1,130 px so the list fits the 1440 content width with nothing cut at the edge (anatomy A10, 2026-10-30).
  const columns = [
    { key: "student", label: "Student", width: 205, cell: (r: PipelineRecord) => <PersonIdentityCell name={r.student} initials={initialsOf(r.student)} renderName={(n) => <Link className={LINK_IN_TABLE} href={studentHref(scope, r.studentId)}>{n}</Link>} /> },
    { key: "skill", label: capitalize(skillNoun()), width: 200, cell: (r: PipelineRecord) => <span className="whitespace-normal">{r.skill}</span> },
    { key: "section", label: "Section", width: 165, cell: (r: PipelineRecord) => <span className="whitespace-normal">{r.section}</span> },
    { key: "state", label: "State", width: 190, cell: (r: PipelineRecord) => <StateBadge state={r.state} /> },
    { key: "counted", label: "Counted", width: 110, cell: (r: PipelineRecord) => <span className="tabular-nums">{`${r.counted} of ${r.need}`}</span> },
    { key: "waiting", label: "Waiting", width: 260, cell: (r: PipelineRecord) => (r.waitingWith ? <span className="flex items-center gap-1.5"><i className="fa-light fa-clock text-muted-foreground" aria-hidden="true" />{`With ${r.waitingWith}, ${r.waitingDays} ${r.waitingDays === 1 ? "day" : "days"}`}</span> : <span className="text-muted-foreground">No request open</span>) },
  ]
  const chips: Array<{ key: string; label: string; remove: Record<string, string | null> }> = [
    ...(state ? [{ key: "cond", label: `State: ${RECORD_STATE_LABEL[state]}`, remove: { cond: null } }] : []),
    ...(section ? [{ key: "q", label: `Section: ${section}`, remove: { q: null } }] : []),
  ]
  return (
    // The page h1 names the list and carries the count; the back link sits above it (DashboardPage drillTitle).
    <div className="flex flex-col gap-4" data-region="drill" data-drill="records" data-count={d.rows.length}>
      {/* One toolbar: scope Filters with its chips, the drill's conditions, then search; the table's own filter stays off (A9). */}
      <DrillToolbar id="records-search" filters={filters} query={query} onQuery={setQuery}>
        {chips.map((c) => (
          <Button key={c.key} type="button" variant="secondary" size="sm" aria-label={`Remove ${c.label}`} onClick={() => onChange(c.remove)}>
            {c.label}
            <i className="fa-light fa-xmark" aria-hidden="true" />
          </Button>
        ))}
      </DrillToolbar>
      <DataTable
        data={rows as never}
        columns={columns as never}
        getRowId={(r) => String((r as unknown as PipelineRecord).key)}
        selectable={false}
        searchable={false}
        showQueryControls={false}
        edgeInset={false}
        lazyLoading={{ enabled: true, threshold: 200, chunkSize: 200 }}
        emptyState={<p className="p-4 text-sm text-muted-foreground">Nothing in this state for this scope.</p>}
      />
    </div>
  )
}
