"use client"

/**
 * Student My requests, variant B: by status.
 * Tests: do three tabs (waiting, returned, done) with counts, each a table grouped by evaluator, let a student clear open work
 * faster than evaluator cards?
 * Regions (list budget 4): header · no-login note · tabs · table.
 */
import * as React from "react"
import { LabLink as Link } from "@/components/lab/lab-bar/lab-link"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import { Card, CardContent } from "@exxatdesignux/ui/components/ui/card"
import { EmptyBlock } from "@/components/lab/empty-block"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@exxatdesignux/ui/components/ui/table"
import { Tabs, TabsContent, TabsCountBadge, TabsList, TabsTrigger } from "@exxatdesignux/ui/components/ui/tabs"
import { StudentFrame } from "@/components/lab/student/frame"
import { EvaluatorHeading, NoLoginNote, SkillNames, StatusOf, linkLine } from "@/components/lab/student/requests"
import { requestGroups, studentHref, type EvaluatorGroup, type RequestStatus } from "@/lib/lab/student"
import { capitalize, skillNounPlural } from "@/lib/lab/terms"

export function StudentRequestsB() {
  return (
    <StudentFrame title="My requests" primary={(c) => ({ label: "Send for evaluation", href: studentHref("request-signoff", {}, c.studentId) })}>
      {({ state, studentId, param, setParams }) => <Body groups={requestGroups(state, studentId)} studentId={studentId} tab={(param("show") as RequestStatus) || null} onTab={(t) => setParams({ show: t })} />}
    </StudentFrame>
  )
}

const TABS: Array<{ id: RequestStatus; label: string }> = [
  { id: "waiting", label: "Waiting" },
  { id: "returned", label: "Returned" },
  { id: "done", label: "Done" },
]

function Body({ groups, studentId, tab, onTab }: { groups: EvaluatorGroup[]; studentId: string; tab: RequestStatus | null; onTab: (t: RequestStatus) => void }) {
  const count = (k: RequestStatus) => groups.reduce((n, g) => n + g[k].length, 0)
  const current: RequestStatus = tab && TABS.some((t) => t.id === tab) ? tab : count("returned") > 0 ? "returned" : "waiting"
  return (
    <div className="flex flex-col gap-4" data-student-lab="requests-B">
      <NoLoginNote />
      <Tabs value={current} onValueChange={(v) => onTab(v as RequestStatus)} data-region="tabs">
        <TabsList ariaLabel="Requests by status">
          {TABS.map((t) => (
            <TabsTrigger key={t.id} value={t.id}>
              {t.label}
              <TabsCountBadge count={count(t.id)} />
            </TabsTrigger>
          ))}
        </TabsList>
        {TABS.map((t) => (
          <TabsContent key={t.id} value={t.id} className="pt-3" data-region="table">
            <Card className="gap-0 overflow-hidden py-0">
              <CardContent className="p-0">
                <StatusTable groups={groups.filter((g) => g[t.id].length > 0)} status={t.id} studentId={studentId} />
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
          <TableHead className="w-32"><span className="sr-only">Action</span></TableHead>
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
                {r.status === "returned" ? <Button asChild variant="outline" size="sm"><Link href={r.href}>{r.action}</Link></Button> : null}
              </TableCell>
            </TableRow>
          )),
        )}
      </TableBody>
    </Table>
  )
}
