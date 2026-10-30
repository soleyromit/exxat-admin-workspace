"use client"

/**
 * Exceptions first (dashboard concept B, docs/knowledge/design/dashboard-concepts/README.md section 4B): five exception
 * counts as DS Tabs with TabsCountBadge; the chosen tab holds one ranked DataTable of the records behind its count (so the
 * count equals the rows by construction), each row with the cause in numbers; a row click opens a non-modal side peek
 * (FloatingSheetPanel). Bulk selection only where rows are alike (awaiting approval). No hero, no charts of the population.
 */
import { TYPE } from "@/components/lab/type-scale"
import * as React from "react"
import { LabLink as Link } from "@/components/lab/lab-bar/lab-link"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import { StatusBadge } from "@exxatdesignux/ui/components/ui/status-badge"
import { Tabs, TabsContent, TabsCountBadge, TabsList, TabsTrigger } from "@exxatdesignux/ui/components/ui/tabs"
import { FloatingSheetPanel, FloatingSheetPanelBody, FloatingSheetPanelContent, FloatingSheetPanelHeader } from "@exxatdesignux/ui/components/ui/floating-sheet-panel"
import { DataTablePaginated } from "@exxatdesignux/ui/components/data-table/pagination"
import type { ColumnDef } from "@exxatdesignux/ui/components/data-table/types"
import { VIZ } from "@/components/lab/viz"
import { LINK, LINK_IN_TABLE } from "@/components/lab/link-styles"
import { PersonIdentityCell } from "@exxatdesignux/ui/components/data-views/person-identity-cell"
import { ageLabel, fmt, initialsOf, shortDate } from "@/lib/v2/format"
import { EvaluatorNameBadge } from "@/components/lab/status-pill"
import { EmptyBlock } from "@/components/lab/empty-block"
import { drillHref, plural, studentHref, type DashboardModel, type ExceptionEvaluator, type ExceptionKind, type ExceptionRequest, type ExceptionStudent, type Exceptions } from "@/lib/lab/dashboard"
import { withScope, type LabScope } from "@/lib/lab/scope"
import { NEW_EVALUATORS_HREF } from "@/lib/lab/admin-ia"
import { capitalize, skillNounPlural } from "@/lib/lab/terms"
import type { V2State } from "@/lib/v2/types"

const OLD_DAYS = 15
/** The DS paginated DataTable, loosened to our row interfaces (they carry no index signature). */
const Grid = DataTablePaginated as unknown as React.ComponentType<Record<string, unknown>>

export const EXCEPTION_LABEL: Record<ExceptionKind, string> = {
  behind: "Students behind",
  old: "Waiting 15+ days",
  approval: "Awaiting approval",
  returned: "Returned",
  unverified: "Unverified evaluators",
}

/** What the tab's list is ranked by, in a few words (the only prose above the table). */
const RANKED: Record<ExceptionKind, string> = {
  behind: "Furthest behind first.",
  old: "Oldest first.",
  approval: "Longest waiting first.",
  returned: "Longest since return first.",
  unverified: "Oldest held request first.",
}

function DaysBadge({ days, warnAt = OLD_DAYS }: { days: number; warnAt?: number }) {
  return <StatusBadge label={`${days} d`} tone={days >= warnAt ? "warning" : "neutral"} size="sm" />
}

function StudentLink({ scope, id, name }: { scope: LabScope; id: string; name: string }) {
  return (
    <Link className={`${LINK_IN_TABLE} text-sm`} href={studentHref(scope, id)} onClick={(e) => e.stopPropagation()}>
      {name}
    </Link>
  )
}

/** In-cell gap glyph: a track from the furthest gap to zero, a diamond where the student sits, the number beside it. */
function GapCell({ gap, min }: { gap: number; min: number }) {
  const span = Math.max(1, Math.abs(min))
  const pct = Math.max(0, Math.min(100, 100 - (Math.abs(Math.min(gap, 0)) / span) * 100))
  return (
    <span className="flex items-center gap-2">
      <svg className="h-3 w-24 shrink-0 overflow-visible" aria-hidden="true">
        <line x1="0" x2="100%" y1="6" y2="6" stroke={VIZ.track} strokeWidth="2" />
        <line x1={`${pct}%`} x2="100%" y1="6" y2="6" stroke={VIZ.behind} strokeWidth="2" />
        <line x1="100%" x2="100%" y1="1" y2="11" stroke={VIZ.zero} strokeWidth="1" />
        <svg x={`${pct}%`} y="6" width="1" height="1" overflow="visible">
          <rect x={-4} y={-4} width={8} height={8} rx={1} fill={VIZ.behind} transform="rotate(45)" />
        </svg>
      </svg>
      <span className="text-sm font-medium tabular-nums text-foreground">{gap > 0 ? `+${gap}` : gap}</span>
    </span>
  )
}

// ---------------------------------------------------------------------------------------------------------------------
// Columns per tab

function studentColumns(scope: LabScope, model: DashboardModel, rows: ExceptionStudent[]): ColumnDef<ExceptionStudent>[] {
  const basis = model.basis
  const min = Math.min(0, ...rows.map((r) => r.row.gap))
  return [
    { key: "student", label: "Student", width: 220, cell: (r) => <PersonIdentityCell name={r.row.name} initials={initialsOf(r.row.name)} email={r.row.group ? `${r.row.cohort}, ${r.row.group}` : r.row.cohort} renderName={() => <StudentLink scope={scope} id={r.id} name={r.row.name} />} /> },
    basis === "all"
      ? { key: "gap", label: "Achieved", width: 170, cell: (r) => <span className="text-sm tabular-nums">{`${r.row.achieved} of ${r.row.required}`}</span> }
      : { key: "gap", label: basis === "expected" ? "Points from expected" : "Points from median", width: 190, cell: (r) => <GapCell gap={r.row.gap} min={min} /> },
    { key: "required", label: `Required ${skillNounPlural()}`, width: 140, cell: (r) => <span className="text-sm tabular-nums">{`${r.row.achieved} of ${r.row.required}`}</span> },
    { key: "short", label: "Most short in", width: 220, cell: (r) => (r.shortIn ? <span className="text-sm">{`${r.shortIn.section}, ${r.shortIn.achieved} of ${r.shortIn.total}`}</span> : <span className="text-sm text-muted-foreground">Nothing short</span>) },
    { key: "request", label: "Open request", width: 260, cell: (r) => (r.request ? <span className="flex items-center gap-2 text-sm"><span className="min-w-0 whitespace-normal">{r.request.evaluator}</span><DaysBadge days={r.request.days} /></span> : <span className="text-sm text-muted-foreground">None sent</span>) },
  ]
}

function requestColumns(scope: LabScope, kind: "old" | "approval" | "returned"): ColumnDef<ExceptionRequest>[] {
  const evaluator: ColumnDef<ExceptionRequest> = { key: "evaluator", label: "Evaluator", width: 200, cell: (r) => <span className="flex items-center gap-2 text-sm"><span className="min-w-0 whitespace-normal">{r.evaluator}</span>{r.evaluatorUnverified ? <EvaluatorNameBadge verified={false} /> : null}</span> }
  return [
    { key: "student", label: "Student", width: 200, cell: (r) => <PersonIdentityCell name={r.student} initials={initialsOf(r.student)} renderName={() => <StudentLink scope={scope} id={r.studentId} name={r.student} />} /> },
    { key: "skills", label: capitalize(skillNounPlural()), width: 240, cell: (r) => <span className="block truncate text-sm" title={r.skills}>{r.skills}</span> },
    ...(kind === "returned" ? [] : [evaluator]),
    { key: "why", label: kind === "approval" ? "Held because" : kind === "returned" ? "Why it came back" : "Site", width: kind === "returned" ? 380 : 230, cell: (r) => <span className="block truncate text-sm" title={kind === "old" ? r.site : r.why}>{kind === "old" ? r.site : kind === "returned" ? r.why.replace(/^Sent back by [^:]+: /, "") : r.why}</span> },
    { key: "days", label: kind === "returned" ? "Since return" : "Waiting", width: 110, cell: (r) => <DaysBadge days={r.days} warnAt={kind === "approval" ? 11 : OLD_DAYS} /> },
  ]
}

function evaluatorColumns(): ColumnDef<ExceptionEvaluator>[] {
  return [
    { key: "name", label: "Evaluator", width: 220, cell: (r) => <span className="flex items-center gap-2"><PersonIdentityCell name={r.name} initials={initialsOf(r.name)} /><EvaluatorNameBadge verified={false} /></span> },
    { key: "site", label: "Site", width: 280, cell: (r) => <span className="block truncate text-sm">{r.site}</span> },
    { key: "requests", label: "Requests held", width: 140, cell: (r) => <span className="text-sm tabular-nums">{r.requests}</span> },
    { key: "students", label: "Students", width: 120, cell: (r) => <span className="text-sm tabular-nums">{r.students}</span> },
    { key: "oldest", label: "Oldest", width: 110, cell: (r) => <DaysBadge days={r.oldest} /> },
  ]
}

// ---------------------------------------------------------------------------------------------------------------------
// Peek

function Fact({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[7.5rem_minmax(0,1fr)] gap-2 text-sm">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="min-w-0 text-foreground">{children}</dd>
    </div>
  )
}

/** Achieved of required in one section as squares: filled = achieved, outlined = not yet (amber outline on the worst section). */
function Squares({ achieved, total, worst }: { achieved: number; total: number; worst: boolean }) {
  const n = Math.min(total, 12)
  return (
    <span className="flex gap-0.5" aria-hidden="true">
      {Array.from({ length: n }, (_, i) => (
        <span key={i} className="inline-block h-2.5 w-3.5 rounded-sm" style={i < achieved ? { background: VIZ.age[3] } : { background: "var(--background)", boxShadow: `inset 0 0 0 1.5px ${worst ? VIZ.behind : VIZ.age[1]}` }} />
      ))}
    </span>
  )
}

function StudentPeek({ data, scope, model, r }: { data: V2State; scope: LabScope; model: DashboardModel; r: ExceptionStudent }) {
  const row = r.row
  const sections = Object.entries(row.bySection).sort((a, b) => b[1].needed - b[1].collected - (a[1].needed - a[1].collected) || a[0].localeCompare(b[0]))
  const subs = data.submissions.filter((x) => x.studentId === row.id && (x.status === "with-evaluator" || x.status === "stalled" || x.status === "returned")).sort((a, b) => b.daysWaiting - a.daysWaiting)
  const name = (id: string) => data.people.find((p) => p.id === id)?.name ?? "Not named yet"
  const skill = (id: string) => data.skills.find((k) => k.id === id)?.name ?? id
  const gapWord = model.basis === "expected" ? `Behind by ${Math.abs(row.gap)} points` : model.basis === "median" ? `${Math.abs(row.gap)} points under the median` : `${row.required - row.achieved} not achieved`
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge label={gapWord} tone="warning" icon="fa-diamond" size="sm" />
      </div>
      <p className="text-sm text-foreground">{`${row.achieved} of ${row.required} required ${skillNounPlural()} achieved. ${row.collected} of ${row.needed} evaluations counted, ${row.expected} expected now.`}</p>
      <section className="flex flex-col gap-2" aria-label="Required achieved by section">
        <h3 className={TYPE.group}>Required achieved by section</h3>
        <ul className="flex flex-col gap-1.5">
          {sections.slice(0, 6).map(([sec, t], i) => (
            <li key={sec} className="grid grid-cols-[minmax(0,1fr)_auto_3.5rem] items-center gap-3 text-sm">
              <span className="truncate">{sec}</span>
              <Squares achieved={t.achieved} total={t.total} worst={i === 0 && t.achieved < t.total} />
              <span className="text-right tabular-nums text-muted-foreground">{`${t.achieved} of ${t.total}`}</span>
            </li>
          ))}
        </ul>
        {sections.length > 6 ? <p className="text-xs text-muted-foreground">{`${plural(sections.length - 6, "other section", "other sections")} on the student record.`}</p> : null}
      </section>
      <section className="flex flex-col gap-2" aria-label="Waiting and returned">
        <h3 className={`flex items-baseline gap-2 ${TYPE.group}`}>Waiting and returned<span className="text-sm font-normal tabular-nums text-muted-foreground">{fmt(subs.length)}</span></h3>
        {subs.length === 0 ? (
          <p className="text-sm text-muted-foreground">No request sent for these yet.</p>
        ) : (
          <ul className="flex flex-col gap-1.5">
            {subs.slice(0, 5).map((x) => (
              <li key={x.id} className="flex items-start justify-between gap-3 text-sm">
                <span className="min-w-0">{`${x.skillIds.map(skill).join(", ")}, ${x.status === "returned" ? `returned by ${name(x.returns?.at(-1)?.byId ?? "")}` : `with ${name(x.candidateIds?.[0] ?? x.assignedToId)}`}`}</span>
                <DaysBadge days={x.daysWaiting} />
              </li>
            ))}
          </ul>
        )}
      </section>
      <Button asChild variant="outline" size="sm" className="self-start">
        <Link href={studentHref(scope, row.id)}>Open student record</Link>
      </Button>
    </div>
  )
}

function RequestPeek({ data, scope, kind, r }: { data: V2State; scope: LabScope; kind: "old" | "approval" | "returned"; r: ExceptionRequest }) {
  const sub = data.submissions.find((x) => x.id === r.id)
  const name = (id: string) => data.people.find((p) => p.id === id)?.name ?? "Not named yet"
  const history = [
    ...(sub?.reassignments ?? []).map((h) => ({ at: h.at, text: `Handed from ${name(h.fromId)} to ${name(h.toId)}` })),
    ...(sub?.returns ?? []).map((h) => ({ at: h.at, text: `Sent back by ${name(h.byId)}: ${h.reason}` })),
  ].sort((a, b) => (a.at < b.at ? 1 : -1))
  return (
    <div className="flex flex-col gap-4">
      <dl className="flex flex-col gap-2">
        <Fact label="Student"><StudentLink scope={scope} id={r.studentId} name={r.student} /></Fact>
        <Fact label={capitalize(skillNounPlural())}>{r.skills}</Fact>
        <Fact label="Evaluator"><span className="flex flex-wrap items-center gap-2">{r.evaluator}{r.evaluatorUnverified ? <EvaluatorNameBadge verified={false} /> : null}</span></Fact>
        <Fact label="Site">{r.site}</Fact>
        <Fact label={kind === "returned" ? "Since return" : "Waiting"}>{ageLabel(r.days)}</Fact>
        <Fact label="Why listed">{r.why}</Fact>
      </dl>
      {history.length > 0 ? (
        <section className="flex flex-col gap-2" aria-label="History">
          <h3 className={TYPE.group}>History</h3>
          <ul className="flex flex-col gap-1.5 text-sm">
            {history.slice(0, 4).map((h, i) => <li key={i}>{`${shortDate(h.at)}: ${h.text}`}</li>)}
          </ul>
        </section>
      ) : null}
      <Button asChild variant="outline" size="sm" className="self-start">
        {kind === "approval" ? <Link href={withScope("/lab/reviewer/review-item", scope, { item: r.id })}>Open in Approvals</Link> : <Link href={studentHref(scope, r.studentId)}>Open student record</Link>}
      </Button>
    </div>
  )
}

function EvaluatorPeek({ data, scope, model, r }: { data: V2State; scope: LabScope; model: DashboardModel; r: ExceptionEvaluator }) {
  const held = data.submissions.filter((x) => (x.status === "with-evaluator" || x.status === "stalled") && model.pop.ids.has(x.studentId) && (x.assignedToId === r.id || (x.candidateIds ?? []).includes(r.id))).sort((a, b) => b.daysWaiting - a.daysWaiting)
  const name = (id: string) => data.people.find((p) => p.id === id)?.name ?? "Unknown student"
  const skill = (id: string) => data.skills.find((k) => k.id === id)?.name ?? id
  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-foreground">{`A student gave this name and the program has not adopted it yet, so evidence signed under it waits for a reviewer.`}</p>
      <section className="flex flex-col gap-2" aria-label="Requests held">
        <h3 className={`flex items-baseline gap-2 ${TYPE.group}`}>Requests held<span className="text-sm font-normal tabular-nums text-muted-foreground">{fmt(held.length)}</span></h3>
        <ul className="flex flex-col gap-1.5">
          {held.map((x) => (
            <li key={x.id} className="flex items-start justify-between gap-3 text-sm">
              <span className="min-w-0"><StudentLink scope={scope} id={x.studentId} name={name(x.studentId)} />{`, ${x.skillIds.map(skill).join(", ")}`}</span>
              <DaysBadge days={x.daysWaiting} />
            </li>
          ))}
        </ul>
      </section>
      <Button asChild variant="outline" size="sm" className="self-start">
        <Link href={NEW_EVALUATORS_HREF}>Adopt or merge the name</Link>
      </Button>
    </div>
  )
}

// ---------------------------------------------------------------------------------------------------------------------
// The page body

export interface ExceptionsViewProps {
  data: V2State
  model: DashboardModel
  scope: LabScope
  lists: Exceptions
  tab: ExceptionKind
  onTab: (t: ExceptionKind) => void
  peek: string | null
  onPeek: (id: string | null) => void
  /** The page's Filters group: it scopes every list, so it shares the tab row (D-L8b), not a row of its own. */
  filters?: React.ReactNode
}

export function ExceptionsView({ data, model, scope, lists, tab, onTab, peek, onPeek, filters }: ExceptionsViewProps) {
  const counts: Record<ExceptionKind, number> = { behind: lists.behind.length, old: lists.old.length, approval: lists.approval.length, returned: lists.returned.length, unverified: lists.unverified.length }
  const drill: Partial<Record<ExceptionKind, string>> = {
    behind: model.heroHref,
    old: drillHref(scope, { list: "requests", cond: "old", from: "exceptions" }),
    approval: drillHref(scope, { list: "requests", cond: "approval", from: "exceptions" }),
  }
  const peekStudent = tab === "behind" ? lists.behind.find((r) => r.id === peek) : undefined
  const peekRequest = tab === "old" || tab === "approval" || tab === "returned" ? lists[tab].find((r) => r.id === peek) : undefined
  const peekEvaluator = tab === "unverified" ? lists.unverified.find((r) => r.id === peek) : undefined
  const open = !!(peekStudent || peekRequest || peekEvaluator)
  const empty = (what: string) => <EmptyBlock compact title={what} />
  const common = { getRowId: (r: { id: string }) => r.id, searchable: false, showQueryControls: false, edgeInset: false, onRowClick: (r: { id: string }) => onPeek(r.id), openRowId: open ? peek : null, pagination: { pageSize: 10, pageSizeOptions: [10, 25, 50] } }

  return (
    <Tabs value={tab} onValueChange={(v) => onTab(v as ExceptionKind)} className="flex w-full flex-col gap-4">
      <div data-region="exception-tabs" className="flex flex-col-reverse gap-2 lg:flex-row lg:items-center lg:justify-between">
        <TabsList variant="line" ariaLabel="Exceptions">
          {(Object.keys(EXCEPTION_LABEL) as ExceptionKind[]).map((k) => (
            <TabsTrigger key={k} value={k} data-exception={k}>
              {EXCEPTION_LABEL[k]}
              <span data-figure="tab-count" className="inline-flex"><TabsCountBadge count={counts[k]} /></span>
            </TabsTrigger>
          ))}
        </TabsList>
        {filters ? <div className="flex shrink-0 lg:justify-end">{filters}</div> : null}
      </div>
      {(Object.keys(EXCEPTION_LABEL) as ExceptionKind[]).map((k) => (
        <TabsContent key={k} value={k} className="m-0 flex flex-col gap-3" data-region="exception-list">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <p className="text-sm text-muted-foreground" data-ranked>{counts[k] === 0 ? "" : RANKED[k]}</p>
            {drill[k] && counts[k] > 0 ? <Link className={`${LINK} text-sm`} href={drill[k]!}>{`Open all ${fmt(counts[k])} as a list`}</Link> : null}
          </div>
          {k === "behind" ? (
            <Grid data={lists.behind as never} columns={studentColumns(scope, model, lists.behind) as never} {...common} selectable={false} getRowSelectionLabel={(r: ExceptionStudent) => r.row.name} emptyState={empty(model.kind === "clear" ? "Nobody is behind in this scope" : "No students in this list yet")} />
          ) : k === "unverified" ? (
            <Grid data={lists.unverified as never} columns={evaluatorColumns() as never} {...common} selectable={false} emptyState={empty("No unverified evaluator holds a request in this scope")} />
          ) : (
            <Grid
              data={lists[k] as never}
              columns={requestColumns(scope, k) as never}
              {...common}
              // Bulk only where rows are alike: every awaiting-approval row takes the same decision in Approvals.
              selectable={k === "approval"}
              getRowSelectionLabel={(r: ExceptionRequest) => `${r.student}, ${r.skills}`}
              {...(k === "approval" ? { bulkActionsSlot: (selected: Set<string | number>) => (
                <Button asChild variant="default" size="sm">
                  <Link href={withScope("/lab/reviewer/approvals", scope, { keys: [...selected].map(String).join(",") })}>{`Review ${selected.size} in Approvals`}</Link>
                </Button>
              ) } : {})}
              emptyState={empty(k === "old" ? "No request has waited 15 days or more" : k === "approval" ? "No submissions await approval in this scope" : "No submissions returned in this scope")}
            />
          )}
        </TabsContent>
      ))}
      <FloatingSheetPanel open={open} onOpenChange={(o) => { if (!o) onPeek(null) }}>
        <FloatingSheetPanelContent size="sm">
          {peekStudent ? (
            <>
              <FloatingSheetPanelHeader title={peekStudent.row.name} subtitle={peekStudent.row.group ? `${peekStudent.row.cohort}, ${peekStudent.row.group}` : peekStudent.row.cohort} onClose={() => onPeek(null)} />
              <FloatingSheetPanelBody className="px-4 pb-4"><StudentPeek data={data} scope={scope} model={model} r={peekStudent} /></FloatingSheetPanelBody>
            </>
          ) : peekRequest && (tab === "old" || tab === "approval" || tab === "returned") ? (
            <>
              <FloatingSheetPanelHeader title={peekRequest.student} subtitle={EXCEPTION_LABEL[tab]} onClose={() => onPeek(null)} />
              <FloatingSheetPanelBody className="px-4 pb-4"><RequestPeek data={data} scope={scope} kind={tab} r={peekRequest} /></FloatingSheetPanelBody>
            </>
          ) : peekEvaluator ? (
            <>
              <FloatingSheetPanelHeader title={peekEvaluator.name} subtitle={peekEvaluator.site} onClose={() => onPeek(null)} />
              <FloatingSheetPanelBody className="px-4 pb-4"><EvaluatorPeek data={data} scope={scope} model={model} r={peekEvaluator} /></FloatingSheetPanelBody>
            </>
          ) : null}
        </FloatingSheetPanelContent>
      </FloatingSheetPanel>
    </Tabs>
  )
}
