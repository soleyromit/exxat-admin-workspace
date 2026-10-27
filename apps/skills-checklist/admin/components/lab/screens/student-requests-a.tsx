"use client"

/**
 * Student My requests, variant A: by evaluator.
 * Tests: does grouping requests under the person who holds them make it obvious who to remind and what to fix, better than one
 * table by status?
 * Regions (list budget 4): header (Send for evaluation) · no-login note · tabs · evaluator cards. Tabs (LEDGER D-L10): Drafts
 * (saved for later, never sent) · Waiting · Returned · Done, each with its count; inside Waiting, Returned and Done the requests are
 * grouped under the evaluator who holds them (Done 5 evaluators at a time). `?show=` names the tab.
 * [REQ ST-03, ST-13, SH-02, SH-04]
 */
import { aNoun } from "@/lib/lab/terms"
import * as React from "react"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import { Card, CardContent } from "@exxatdesignux/ui/components/ui/card"
import { Tabs, TabsContent, TabsCountBadge, TabsList, TabsTrigger } from "@exxatdesignux/ui/components/ui/tabs"
import { EmptyBlock } from "@/components/lab/empty-block"
import { StudentFrame } from "@/components/lab/student/frame"
import { EvaluatorHeading, NoLoginNote, RequestLine } from "@/components/lab/student/requests"
import { DraftList, useDrafts } from "@/components/lab/student/logged"
import { NoMatch, RequestsToolbar, clearFilterParams, toolbarOptions } from "@/components/lab/student/requests-toolbar"
import { anyFilter, filterDrafts, filterGroups, readFilter } from "@/lib/lab/requests-filter"
import type { V2State } from "@/lib/v2/types"
import { requestGroups, studentHref, type EvaluatorGroup, type RequestStatus } from "@/lib/lab/student"

const DONE_LIMIT = 5
type Tab = "drafts" | RequestStatus
const TABS: Array<{ id: RequestStatus; label: string; empty: string }> = [
  { id: "waiting", label: "Waiting", empty: "Nothing is waiting. Every request has an answer." },
  { id: "returned", label: "Returned", empty: "Nothing is returned." },
  { id: "done", label: "Done", empty: "No answered requests yet." },
]

export function StudentRequestsA() {
  return (
    <StudentFrame title="My requests" primary={(c) => ({ label: `Log ${aNoun()}`, href: studentHref("request-signoff", {}, c.studentId) })}>
      {({ state, studentId, param, setParams, model }) => <Body state={state} allGroups={requestGroups(state, studentId)} studentId={studentId} tab={param("show")} onTab={(t) => setParams({ show: t })} param={param} setParams={setParams} courses={model.courses} />}
    </StudentFrame>
  )
}

function Body({ state, allGroups, studentId, tab, onTab, param, setParams, courses }: { state: V2State; allGroups: EvaluatorGroup[]; studentId: string; tab: string | null; onTab: (t: Tab) => void; param: (k: string) => string | null; setParams: (p: Record<string, string | null>) => void; courses: Array<{ id: string; code: string }> }) {
  // Search and filters (LEDGER D-L20): every tab and its count follow them; drafts too.
  const filter = readFilter(param)
  const allDrafts = useDrafts(state, studentId)
  const groups = filterGroups(state, allGroups, filter)
  const drafts = filterDrafts(state, allDrafts, filter)
  const filtered = anyFilter(filter)
  const clear = () => setParams(clearFilterParams())
  const options = toolbarOptions(courses, [...allGroups.map((g) => ({ id: g.id, name: g.name })), ...allDrafts.filter((d) => d.who).map((d) => ({ id: d.who!, name: state.people.find((p) => p.id === d.who)?.name ?? "Evaluator" }))])
  const [allDone, setAllDone] = React.useState(false)
  const count = (k: RequestStatus) => groups.reduce((n, g) => n + g[k].length, 0)
  const valid = (t: string | null): t is Tab => t === "drafts" || TABS.some((x) => x.id === t)
  const current: Tab = valid(tab) ? tab : count("returned") > 0 ? "returned" : drafts.length > 0 ? "drafts" : "waiting"
  const byStatus = (k: RequestStatus) => {
    const list = groups.filter((g) => g[k].length > 0)
    return k === "done" ? [...list].sort((a, b) => b.done[0].date.localeCompare(a.done[0].date)) : list
  }
  return (
    <div className="flex flex-col gap-4" data-student-lab="requests-A">
      <NoLoginNote />
      <RequestsToolbar filter={filter} options={options} onChange={setParams} />
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
        <TabsContent value="drafts" className="pt-3" data-region="drafts">
          <Card className="gap-0 py-0">
            <CardContent className="py-1">
              <DraftList rows={drafts} studentId={studentId} state={state} empty={filtered ? <NoMatch onClear={clear} /> : <EmptyBlock compact title="No drafts" body={`Save for later in Log ${aNoun()} keeps it here until you send it.`} />} />
            </CardContent>
          </Card>
        </TabsContent>
        {TABS.map((t) => {
          const list = byStatus(t.id)
          const shown = t.id === "done" && !allDone ? list.slice(0, DONE_LIMIT) : list
          return (
            <TabsContent key={t.id} value={t.id} className="pt-3" data-region="open">
              {list.length === 0 ? (
                filtered ? <NoMatch onClear={clear} /> : <p className="text-sm text-muted-foreground">{t.empty}</p>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {shown.map((g) => (
                    <Card key={g.id} className="gap-0 py-0">
                      <CardContent className="flex flex-col gap-2 py-4">
                        <EvaluatorHeading g={g} />
                        <ul className="flex flex-col divide-y divide-border">
                          {g[t.id].map((r) => <RequestLine key={r.id} row={r} studentId={studentId} />)}
                        </ul>
                      </CardContent>
                    </Card>
                  ))}
                  {t.id === "done" && list.length > DONE_LIMIT ? (
                    <Button type="button" variant="outline" size="sm" className="self-start" onClick={() => setAllDone((v) => !v)}>
                      {allDone ? "Show fewer" : `Show all ${list.length} evaluators`}
                    </Button>
                  ) : null}
                </div>
              )}
            </TabsContent>
          )
        })}
      </Tabs>
    </div>
  )
}
