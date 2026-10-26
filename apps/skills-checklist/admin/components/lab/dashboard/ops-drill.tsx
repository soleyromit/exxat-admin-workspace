"use client"

/**
 * Concept E drill: evaluators holding requests (all, or unverified only) and one evaluator's open requests, in the same scope
 * (strategy/06 R1, R5). On the dashboard URL (?list=holders&cond=unverified, ?list=holder&q=<id>) so it has an address and
 * keeps the scope bar; the title repeats the figure, the condition is a removable chip, the breadcrumb leads back.
 */
import { capitalize, skillNounPlural } from "@/lib/lab/terms"
import * as React from "react"
import { LabLink as Link } from "@/components/lab/lab-bar/lab-link"
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@exxatdesignux/ui/components/ui/breadcrumb"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import { FilterBar } from "@exxatdesignux/ui/components/ui/filter-bar"
import { DataTable } from "@exxatdesignux/ui/components/data-table"
import { UnverifiedBadge } from "@/components/lab/dashboard/ops-sites"
import { dashboardHref, opsDrill, opsHref, studentHref, type OpsHolder, type OpsModel, type OpsRequest } from "@/lib/lab/dashboard"
import type { LabScope } from "@/lib/lab/scope"
import type { V2State } from "@/lib/v2/types"
import { LINK_IN_TABLE } from "@/components/lab/link-styles"
import { PersonIdentityCell } from "@exxatdesignux/ui/components/data-views/person-identity-cell"
import { initialsOf } from "@/lib/v2/format"

const days = (n: number) => `${n} ${n === 1 ? "day" : "days"}`

export function OpsDrill({ data, model, scope, list, cond, evaluator, onChange }: { data: V2State; model: OpsModel; scope: LabScope; list: "holders" | "holder"; cond: string | null; evaluator: string | null; onChange: (p: Record<string, string | null>) => void }) {
  const d = React.useMemo(() => opsDrill(data, model, { list, cond, evaluator }), [data, model, list, cond, evaluator])
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
    <div className="flex flex-col gap-4" data-region="drill" data-drill={list}>
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href={dashboardHref(scope)}>Dashboard</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{d.crumb}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <h2 className="text-base font-semibold text-foreground" data-drill-title data-count={d.count}>{d.title}</h2>
      {list === "holders" && cond === "unverified" ? (
        <FilterBar aria-label="Conditions">
          <Button type="button" variant="secondary" size="sm" aria-label="Remove Unverified only" onClick={() => onChange({ cond: null })}>
            Unverified only
            <i className="fa-light fa-xmark" aria-hidden="true" />
          </Button>
        </FilterBar>
      ) : null}
      {d.holders ? (
        <DataTable data={d.holders as never} columns={holderColumns as never} getRowId={(r) => String((r as unknown as OpsHolder).id)} selectable={false} searchable edgeInset={false} emptyState={<p className="p-4 text-sm text-muted-foreground">No evaluator in this list holds a request in this scope.</p>} />
      ) : (
        <DataTable data={(d.requests ?? []) as never} columns={requestColumns as never} getRowId={(r) => String((r as unknown as OpsRequest).id)} selectable={false} searchable={false} showQueryControls={false} edgeInset={false} emptyState={<p className="p-4 text-sm text-muted-foreground">This evaluator holds no open request in this scope.</p>} />
      )}
    </div>
  )
}
