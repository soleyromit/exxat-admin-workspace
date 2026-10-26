"use client"

/**
 * Concept C drill: the required skill records behind a stage, a section or one segment, in the same scope (strategy/06 R1,
 * R5). Lives on the dashboard URL (?list=records&cond=<state>&q=<section>) so it has its own address and keeps the scope bar
 * above it; the title repeats the figure, each condition is a removable chip, and the breadcrumb leads back.
 */
import * as React from "react"
import { LabLink as Link } from "@/components/lab/lab-bar/lab-link"
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@exxatdesignux/ui/components/ui/breadcrumb"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import { FilterBar } from "@exxatdesignux/ui/components/ui/filter-bar"
import { DataTable } from "@exxatdesignux/ui/components/data-table"
import { RECORD_STATE_LABEL, dashboardHref, pipelineDrill, studentHref, type PipelineModel, type PipelineRecord, type RecordState } from "@/lib/lab/dashboard"
import type { LabScope } from "@/lib/lab/scope"
import { capitalize, skillNoun } from "@/lib/lab/terms"
import { LINK_IN_TABLE } from "@/components/lab/link-styles"
import { StateBadge } from "@/components/lab/status-pill"
import { PersonIdentityCell } from "@exxatdesignux/ui/components/data-views/person-identity-cell"
import { initialsOf } from "@/lib/v2/format"


export function PipelineDrill({ model, scope, state, section, onChange }: { model: PipelineModel; scope: LabScope; state: RecordState | null; section: string | null; onChange: (p: Record<string, string | null>) => void }) {
  const d = React.useMemo(() => pipelineDrill(model, { state, section }), [model, state, section])
  const back = dashboardHref(scope)
  const columns = [
    { key: "student", label: "Student", width: 220, cell: (r: PipelineRecord) => <PersonIdentityCell name={r.student} initials={initialsOf(r.student)} renderName={(n) => <Link className={LINK_IN_TABLE} href={studentHref(scope, r.studentId)}>{n}</Link>} /> },
    { key: "skill", label: capitalize(skillNoun()), width: 230, cell: (r: PipelineRecord) => r.skill },
    { key: "section", label: "Section", width: 170, cell: (r: PipelineRecord) => r.section },
    { key: "state", label: "State", width: 200, cell: (r: PipelineRecord) => <StateBadge state={r.state} /> },
    { key: "counted", label: "Counted", width: 110, cell: (r: PipelineRecord) => <span className="tabular-nums">{`${r.counted} of ${r.need}`}</span> },
    { key: "waiting", label: "Waiting", width: 260, cell: (r: PipelineRecord) => (r.waitingWith ? <span className="flex items-center gap-1.5"><i className="fa-light fa-clock text-muted-foreground" aria-hidden="true" />{`With ${r.waitingWith}, ${r.waitingDays} ${r.waitingDays === 1 ? "day" : "days"}`}</span> : <span className="text-muted-foreground">No request open</span>) },
  ]
  const chips: Array<{ key: string; label: string; remove: Record<string, string | null> }> = [
    ...(state ? [{ key: "cond", label: `State: ${RECORD_STATE_LABEL[state]}`, remove: { cond: null } }] : []),
    ...(section ? [{ key: "q", label: `Section: ${section}`, remove: { q: null } }] : []),
  ]
  return (
    <div className="flex flex-col gap-4" data-region="drill" data-drill="records">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href={back}>Dashboard</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{d.crumb}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <h2 className="text-base font-semibold text-foreground" data-drill-title data-count={d.rows.length}>{d.title}</h2>
      {chips.length > 0 ? (
        <FilterBar aria-label="Conditions">
          {chips.map((c) => (
            <Button key={c.key} type="button" variant="secondary" size="sm" aria-label={`Remove ${c.label}`} onClick={() => onChange(c.remove)}>
              {c.label}
              <i className="fa-light fa-xmark" aria-hidden="true" />
            </Button>
          ))}
        </FilterBar>
      ) : null}
      <DataTable
        data={d.rows as never}
        columns={columns as never}
        getRowId={(r) => String((r as unknown as PipelineRecord).key)}
        selectable={false}
        searchable
        edgeInset={false}
        lazyLoading={{ enabled: true, threshold: 200, chunkSize: 200 }}
        emptyState={<p className="p-4 text-sm text-muted-foreground">No records in this state for this scope.</p>}
      />
    </div>
  )
}
