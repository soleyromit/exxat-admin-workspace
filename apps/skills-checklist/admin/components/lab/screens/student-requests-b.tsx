"use client"

/**
 * Student My requests, variant B: by status.
 * Tests: do three tabs (waiting, returned, done) with counts, each a table grouped by evaluator, let a student clear open work
 * faster than evaluator cards?
 * Regions (list budget 4): header · no-login note · tabs · table. Tabs (LEDGER D-L10): Drafts (saved for later, never sent) ·
 * Waiting · Returned · Done, each with its count; Drafts is always there, with its empty state when nothing is saved.
 */
import * as React from "react"
import { Card, CardContent } from "@exxatdesignux/ui/components/ui/card"
import { EmptyBlock } from "@/components/lab/empty-block"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@exxatdesignux/ui/components/ui/table"
import { Tabs, TabsContent, TabsCountBadge, TabsList, TabsTrigger } from "@exxatdesignux/ui/components/ui/tabs"
import { StudentFrame } from "@/components/lab/student/frame"
import { EvaluatorHeading, RowAction, SkillNames, StatusOf, linkLine } from "@/components/lab/student/requests"
import { DraftList, useDrafts } from "@/components/lab/student/logged"
import { NoMatch, RequestsToolbar, clearFilterParams, toolbarOptions } from "@/components/lab/student/requests-toolbar"
import { anyFilter, filterDrafts, filterGroups, readFilter } from "@/lib/lab/requests-filter"
import type { V2State } from "@/lib/v2/types"
import { requestGroups, studentHref, type EvaluatorGroup, type RequestStatus } from "@/lib/lab/student"
import { aNoun, capitalize, skillNounPlural } from "@/lib/lab/terms"

export function StudentRequestsB() {
  return (
    <StudentFrame title="My requests" primary={(c) => ({ label: `Log ${aNoun()}`, href: studentHref("request-signoff", {}, c.studentId) })}>
      {({ state, studentId, param, setParams, model }) => <Body state={state} allGroups={requestGroups(state, studentId)} studentId={studentId} tab={param("show") || null} onTab={(t) => setParams({ show: t })} param={param} setParams={setParams} courses={model.courses} />}
    </StudentFrame>
  )
}

const TABS: Array<{ id: RequestStatus; label: string }> = [
  { id: "waiting", label: "Waiting" },
  { id: "returned", label: "Returned" },
  { id: "done", label: "Done" },
]

type Tab = RequestStatus | "drafts"

function Body({ state, allGroups, studentId, tab, onTab, param, setParams, courses }: { state: V2State; allGroups: EvaluatorGroup[]; studentId: string; tab: string | null; onTab: (t: Tab) => void; param: (k: string) => string | null; setParams: (p: Record<string, string | null>) => void; courses: Array<{ id: string; code: string }> }) {
  // Search and filters (LEDGER D-L20): every tab and its count follow them; drafts too.
  const filter = readFilter(param)
  const allDrafts = useDrafts(state, studentId)
  const groups = filterGroups(state, allGroups, filter)
  const drafts = filterDrafts(state, allDrafts, filter)
  const filtered = anyFilter(filter)
  const clear = () => setParams(clearFilterParams())
  const options = toolbarOptions(courses, [...allGroups.map((g) => ({ id: g.id, name: g.name })), ...allDrafts.filter((d) => d.who).map((d) => ({ id: d.who!, name: state.people.find((p) => p.id === d.who)?.name ?? "Evaluator" }))])
  const count = (k: RequestStatus) => groups.reduce((n, g) => n + g[k].length, 0)
  const valid = (t: string | null): t is Tab => !!t && (TABS.some((x) => x.id === t) || t === "drafts")
  const current: Tab = valid(tab) ? tab : count("returned") > 0 ? "returned" : drafts.length > 0 ? "drafts" : "waiting"
  // Search and Filters sit in the toolbar of the list they act on, inside each tab (anatomy, 2026-10-30); state lives in the URL.
  const toolbar = <RequestsToolbar filter={filter} options={options} onChange={setParams} />
  return (
    <div className="flex flex-col gap-4" data-student-lab="requests-B">
      <Tabs value={current} onValueChange={(v) => onTab(v as Tab)} data-region="tabs">
        <TabsList ariaLabel="Requests by status">
          <TabsTrigger value="drafts">
            Drafts
            <TabsCountBadge count={drafts.length} />
          </TabsTrigger>
          {TABS.map((t) => (
            <TabsTrigger key={t.id} value={t.id}>
              {t.label}
              <TabsCountBadge count={count(t.id)} />
            </TabsTrigger>
          ))}
        </TabsList>
        <TabsContent value="drafts" className="flex flex-col gap-3 pt-3" data-region="drafts">
          {toolbar}
          <Card className="gap-0 py-0">
            <CardContent className="py-1">
              <DraftList rows={drafts} studentId={studentId} state={state} empty={filtered ? <NoMatch onClear={clear} /> : <EmptyBlock compact title="No drafts" body={`Save for later in Log ${aNoun()} keeps it here until you send it.`} />} />
            </CardContent>
          </Card>
        </TabsContent>
        {TABS.map((t) => (
          <TabsContent key={t.id} value={t.id} className="flex flex-col gap-3 pt-3" data-region="table">
            {toolbar}
            <Card className="gap-0 overflow-hidden py-0">
              <CardContent className="p-0">
                {filtered && groups.every((g) => g[t.id].length === 0) ? <NoMatch onClear={clear} /> : <StatusTable groups={groups.filter((g) => g[t.id].length > 0)} status={t.id} studentId={studentId} />}
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}

function StatusTable({ groups, status, studentId }: { groups: EvaluatorGroup[]; status: RequestStatus; studentId: string }) {
  if (groups.length === 0) return <EmptyBlock compact title={status === "returned" ? "No returned requests" : status === "waiting" ? "No requests waiting" : "No answered requests yet"} body={status === "waiting" ? "Every request has an answer." : undefined} />
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="hidden w-64 md:table-cell">Evaluator</TableHead>
          <TableHead>{capitalize(skillNounPlural())}</TableHead>
          <TableHead className="hidden md:table-cell">Status</TableHead>
          <TableHead className="hidden md:table-cell">Link</TableHead>
          <TableHead className="w-40"><span className="sr-only">Action</span></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {groups.flatMap((g) =>
          g[status].map((r, i) => (
            <TableRow key={r.id}>
              <TableCell className="hidden align-top md:table-cell">{i === 0 ? <EvaluatorHeading g={g} /> : <span className="sr-only">{g.name}</span>}</TableCell>
              <TableCell className="whitespace-normal align-top"><p className="mb-1 text-xs text-muted-foreground md:hidden">{g.name}</p>
                <SkillNames row={r} studentId={studentId} />
                <div className="mt-1 md:hidden"><StatusOf row={r} /></div>
                {r.reason ? <p className="mt-1 text-sm text-foreground max-sm:line-clamp-2" data-return-reason><span className="text-muted-foreground">Reason: </span><q data-user-content>{r.reason}</q></p> : null}
              </TableCell>
              <TableCell className="hidden align-top md:table-cell"><StatusOf row={r} /></TableCell>
              <TableCell className="hidden align-top text-xs text-muted-foreground md:table-cell">{linkLine(r)}</TableCell>
              <TableCell className="align-top text-end">
                <RowAction row={r} />
              </TableCell>
            </TableRow>
          )),
        )}
      </TableBody>
    </Table>
  )
}
