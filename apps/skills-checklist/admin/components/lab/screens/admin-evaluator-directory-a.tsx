"use client"

/**
 * Evaluator directory A (recommended): people first. One paginated DS DataTable of every evaluator (preceptors, clinical faculty,
 * lab instructors), names awaiting approval first, with search (name, email, site), role, site and status on one toolbar row. Each
 * name awaiting approval has Adopt or merge, with suggested matches [REQ SL-08, SL-09]; held evaluations and open requests link to
 * where they are acted on. The rate column compares an evaluator with the program average only with n >= 30 and >= 5 events
 * [BUILD-PROMPT admconsistency]. Regions: header, summary line, toolbar, table. The dashboard links here with ?filter=unverified.
 * URL: ?q= &role= &site= &filter=. Demo states: ?state=loading | empty | error.
 */
import * as React from "react"
import { filterDirectory, statusFromParam, type EvaluatorRoleKey } from "@/lib/lab/evaluators"
import { EvaluatorFrame, type DirectoryContext } from "@/components/lab/admin-a/evaluator-frame"
import { DirectoryTable, RoleSelect, SiteSelect, STATUS_OPTS } from "@/components/lab/admin-a/evaluator-parts"
import { FilterSelect, SearchField, Toolbar } from "@/components/lab/admin-a/parts"

export function AdminEvaluatorDirectoryA() {
  return <EvaluatorFrame variant="A">{(c) => <PeopleFirst c={c} />}</EvaluatorFrame>
}

function PeopleFirst({ c }: { c: DirectoryContext }) {
  const { query } = c
  const q = query.get("q")
  const role = query.get("role") as "" | EvaluatorRoleKey
  const site = query.get("site")
  const status = statusFromParam(query.get("filter"))
  const rows = React.useMemo(() => filterDirectory(c.rows, { q, role, site, status }), [c.rows, q, role, site, status])
  return (
    <>
      <Toolbar label="Find an evaluator">
        <SearchField value={q} onChange={(v) => query.set({ q: v || null })} label="Search evaluators by name, email or site" placeholder="Search name or email" />
        <RoleSelect value={role} onChange={(v) => query.set({ role: v || null })} />
        <SiteSelect value={site} onChange={(v) => query.set({ site: v || null })} sites={c.sites} />
        <FilterSelect value={status === "awaiting" ? "awaiting" : status} onChange={(v) => query.set({ filter: v === "awaiting" ? "unverified" : v || null })} label="Status" allLabel="Any status" options={STATUS_OPTS} className="w-48" />
      </Toolbar>
      <DirectoryTable rows={rows} programRate={c.summary.programRate} onAdopt={c.openAdopt} />
    </>
  )
}
