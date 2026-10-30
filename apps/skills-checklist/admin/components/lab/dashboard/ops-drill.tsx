"use client"

/**
 * Concept E drill: evaluators holding requests (all, or unverified only) and one evaluator's open requests, in the same scope
 * (strategy/06 R1, R5). On the dashboard URL (?list=holders&cond=unverified, ?list=holder&q=<id>) so it has an address and
 * keeps the scope bar; the page h1 repeats the figure, the condition is a removable chip, a back link leads back.
 */
import { capitalize, skillNounPlural } from "@/lib/lab/terms"
import * as React from "react"
import { LabLink as Link } from "@/components/lab/lab-bar/lab-link"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import { DrillToolbar } from "@/components/lab/dashboard/drill-toolbar"
import { DataTable } from "@exxatdesignux/ui/components/data-table"
import { UnverifiedBadge } from "@/components/lab/dashboard/ops-sites"
import { opsDrill, opsHref, studentHref, type OpsHolder, type OpsModel, type OpsRequest } from "@/lib/lab/dashboard"
import type { LabScope } from "@/lib/lab/scope"
import type { V2State } from "@/lib/v2/types"
import { LINK_IN_TABLE } from "@/components/lab/link-styles"
import { PersonIdentityCell } from "@exxatdesignux/ui/components/data-views/person-identity-cell"
import { initialsOf } from "@/lib/v2/format"

const days = (n: number) => `${n} ${n === 1 ? "day" : "days"}`

export function OpsDrill({ data, model, scope, list, cond, evaluator, onChange, filters }: { data: V2State; model: OpsModel; scope: LabScope; list: "holders" | "holder"; cond: string | null; evaluator: string | null; onChange: (p: Record<string, string | null>) => void; /** The page scope Filters group, placed in this list's toolbar (D-L8b). */ filters?: React.ReactNode }) {
  const d = React.useMemo(() => opsDrill(data, model, { list, cond, evaluator }), [data, model, list, cond, evaluator])
  const [query, setQuery] = React.useState("")
  const q = query.trim().toLowerCase()
  const holders = d.holders && q ? d.holders.filter((h) => `${h.name} ${h.site}`.toLowerCase().includes(q)) : d.holders
  const holderColumns = [
    { key: "name", label: "Evaluator", width: 260, cell: (h: OpsHolder) => <span className="flex items-center gap-2"><PersonIdentityCell name={h.name} initials={initialsOf(h.name)} renderName={(n) => <Link className={LINK_IN_TABLE} href={opsHref(scope, { list: "holder", evaluator: h.id })}>{n}</Link>} />{h.verified ? null : <UnverifiedBadge />}</span> },
    { key: "site", label: "Site", width: 260, cell: (h: OpsHolder) => h.site },
    { key: "open", label: "Open requests", width: 130, cell: (h: OpsHolder) => <span className="block text-right tabular-nums">{h.open}</span> },
    { key: "oldest", label: "Oldest", width: 100, cell: (h: OpsHolder) => <span className="block text-right tabular-nums">{days(h.oldest)}</span> },
  ]
  const requestColumns = [
    { key: "student", label: "Student", width: 220, cell: (r: OpsRequest) => <PersonIdentityCell name={r.student} initials={initialsOf(r.student)} renderName={(n) => <Link className={LINK_IN_TABLE} href={studentHref(scope, r.studentId)}>{n}</Link>} /> },
    { key: "skills", label: capitalize(skillNounPlural()), width: 300, cell: (r: OpsRequest) => r.skills },
    { key: "site", label: "Site", width: 240, cell: (r: OpsRequest) => r.site },
    { key: "days", label: "Waiting", width: 110, cell: (r: OpsRequest) => <span className="block text-right tabular-nums">{days(r.days)}</span> },
  ]
  return (
    // The page h1 names the list (OpsPage drillTitle) and a back link sits above it; no body breadcrumb (anatomy A3).
    <div className="flex flex-col gap-4" data-region="drill" data-drill={list} data-count={d.count}>
      {/* One toolbar: scope Filters with its chips, the condition, then search (holders only); the table's own filter stays off. */}
      <DrillToolbar id="holders-search" filters={filters} query={query} onQuery={d.holders ? setQuery : undefined}>
        {list === "holders" && cond === "unverified" ? (
          <Button type="button" variant="secondary" size="sm" aria-label="Remove Unverified only" onClick={() => onChange({ cond: null })}>
            Unverified only
            <i className="fa-light fa-xmark" aria-hidden="true" />
          </Button>
        ) : null}
      </DrillToolbar>
      {holders ? (
        <DataTable data={holders as never} columns={holderColumns as never} getRowId={(r) => String((r as unknown as OpsHolder).id)} selectable={false} searchable={false} showQueryControls={false} edgeInset={false} emptyState={<p className="p-4 text-sm text-muted-foreground">No evaluator in this list holds a request in this scope.</p>} />
      ) : (
        <DataTable data={(d.requests ?? []) as never} columns={requestColumns as never} getRowId={(r) => String((r as unknown as OpsRequest).id)} selectable={false} searchable={false} showQueryControls={false} edgeInset={false} emptyState={<p className="p-4 text-sm text-muted-foreground">This evaluator holds no open request in this scope.</p>} />
      )}
    </div>
  )
}
