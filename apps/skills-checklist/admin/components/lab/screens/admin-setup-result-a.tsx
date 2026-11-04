"use client"

/**
 * Setup summary, variant A: the closing recap of the admin walkthrough (rebuilt 2026-11-03, Romit: "setup summary doesn't seem
 * connected"; "Even the see the result button as well").
 *
 *  1. Recap: one row per setup step in walkthrough order (Library, Categories and tags, Evaluation settings, Groups of skills,
 *     Assign, Course mapping). Each row: the step (links back to it), its state (glyph + word; amber only for Needs attention),
 *     what is left to do and what is in place, every figure a link to where it is acted on [brief rule 3]. The in-place figures
 *     reconcile: 178 in the library = 176 active + 2 inactive; 176 active = 156 assigned + 20 not assigned.
 *  2. By student group: the detail (students, groups of skills with their size, skills to complete, expected in a course, no
 *     course yet). A group of skills that holds inactive skills shows them beside its size, so 154 there reads 152 to complete.
 *     A group with no skills or no courses says so in the row instead of an unexplained 0.
 *
 * One primary: the next fix in walkthrough order. `?from=` (set by course mapping's "Setup summary" link) marks the step the
 * admin came from ("Last opened"); it never renders a back control (navigation model A, D-L42: the way back is the breadcrumb and
 * the Skills panel, where Setup summary has its own row). `?sg=` opens one group's detail. `?state=loading`.
 */
import * as React from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { StatusBadge } from "@exxatdesignux/ui"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import { Skeleton } from "@exxatdesignux/ui/components/ui/skeleton"
import { DataTable } from "@exxatdesignux/ui/components/data-table"
import type { ColumnDef } from "@exxatdesignux/ui/components/data-table/types"
import { PageFrame } from "@/components/skills/page-header"
import { RECAP_STEP_LABEL, nextFix, recapFrom, type GroupResult, type RecapFigure, type RecapRow } from "@/lib/lab/setup-result"
import { capitalize, skillNoun, skillNounPlural, withNoun } from "@/lib/lab/terms"
import { useLabHref } from "@/components/lab/lab-bar/page-context"
import { TYPE } from "@/components/lab/type-scale"
import { LINK_IN_TABLE, NUM_LINK } from "@/components/lab/link-styles"
import { GroupDetail, NoCourseBadge, RESULT_LABEL, RESULT_SCREEN, useSetupResult } from "@/components/lab/admin-a/result-parts"
import { useAssignHref } from "@/components/lab/admin-a/lists-frame"
import { EmptyBlock } from "@/components/lab/empty-block"
import type { StudentGroup } from "@/lib/lab/lists"

export const RESULT_TITLE = RESULT_LABEL

type Recap = RecapRow & Record<string, unknown>
type GroupRow = { id: string; group: StudentGroup; r?: GroupResult } & Record<string, unknown>

const fmt = (n: number) => n.toLocaleString("en-US")
const STATE_BADGE: Record<RecapRow["state"], { label: string; tone: "neutral" | "warning"; icon: string }> = {
  done: { label: "Done", tone: "neutral", icon: "fa-circle-check" },
  attention: { label: "Needs attention", tone: "warning", icon: "fa-triangle-exclamation" },
  skipped: { label: "Skipped", tone: "neutral", icon: "fa-circle-minus" },
}

function useFigureHref() {
  const to = useLabHref()
  const assignHref = useAssignHref()
  return React.useCallback(
    // Every figure opens the page where it is acted on; the way back is the breadcrumb and the Skills panel (D-L42).
    (f: Pick<RecapFigure, "screen" | "params" | "assign">) => (f.assign ? assignHref({ ...(f.params ?? {}) }) : to(f.screen, { ...(f.params ?? {}) })),
    [to, assignHref],
  )
}

function Figures({ items, kind }: { items: RecapFigure[]; kind: "fix" | "in-place" }) {
  const href = useFigureHref()
  if (!items.length) return <span className={TYPE.helper}>None</span>
  return (
    <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
      {items.map((f) => (
        <Link key={f.text} href={href(f)} className={NUM_LINK} data-recap-figure={kind}>{f.text}</Link>
      ))}
    </span>
  )
}

export function AdminSetupResultA() {
  const { ready, result, recap } = useSetupResult()
  const params = useSearchParams()
  const to = useLabHref()
  const href = useFigureHref()
  const assignHref = useAssignHref()
  const loading = !ready || params?.get("state") === "loading"
  const groupId = params?.get("sg")
  const chosen = groupId ? result.groups.find((g) => g.group.id === groupId) : undefined
  const from = recapFrom(params?.get("from"))
  const next = nextFix(recap)

  const recapColumns: ColumnDef<Recap>[] = [
    {
      key: "step",
      label: "Step",
      width: 260,
      cell: (r) => (
        <span className="flex flex-wrap items-center gap-2" data-recap-step={r.step}>
          <Link href={r.step === "assign" ? assignHref() : to(r.screen, { ...(r.params ?? {}) })} className={LINK_IN_TABLE}>{withNoun(RECAP_STEP_LABEL[r.step])}</Link>
          {r.step === from ? <StatusBadge label="Last opened" tone="neutral" icon="fa-arrow-rotate-left" size="sm" surface="table" /> : null}
        </span>
      ),
    },
    {
      key: "state",
      label: "State",
      width: 170,
      cell: (r) => {
        const b = STATE_BADGE[r.state]
        return <StatusBadge label={b.label} tone={b.tone} icon={b.icon} size="sm" surface="table" />
      },
    },
    { key: "fixes", label: "To do", width: 300, cell: (r) => <Figures items={r.fixes} kind="fix" /> },
    { key: "inPlace", label: "In place", cell: (r) => <Figures items={r.inPlace} kind="in-place" /> },
  ]

  const groupRows: GroupRow[] = [
    ...result.groups.map((g) => ({ id: g.group.id, group: g.group, r: g })),
    ...result.emptyGroups.map((g) => ({ id: g.id, group: g })),
  ]
  const groupColumns: ColumnDef<GroupRow>[] = [
    {
      key: "group",
      label: "Student group",
      width: 170,
      cell: (row) => (
        <span className="flex min-w-0 flex-col" data-result-group={row.id}>
          {row.r ? <Link href={to(RESULT_SCREEN, { sg: row.id })} className={LINK_IN_TABLE}>{row.group.label}</Link> : <span className="font-medium">{row.group.label}</span>}
          <span className={TYPE.meta}>{`${fmt(row.group.studentIds.length)} students`}</span>
        </span>
      ),
    },
    {
      key: "lists",
      label: withNoun("Groups of skills"),
      cell: (row) =>
        row.r ? (
          <ul className="flex flex-col gap-0.5 whitespace-normal">
            {row.r.listCounts.map((l) => (
              <li key={l.id}>
                {`${l.name} · ${fmt(l.total)}`}
                {l.inactive ? <span className={TYPE.meta}>{` (${fmt(l.inactive)} inactive)`}</span> : null}
              </li>
            ))}
          </ul>
        ) : (
          <span className={TYPE.helper}>None</span>
        ),
    },
    {
      key: "skills",
      label: `${capitalize(skillNounPlural())} to complete`,
      width: 150,
      cell: (row) =>
        row.r ? (
          <span className="tabular-nums">{fmt(row.r.skills.length)}</span>
        ) : (
          <Link href={assignHref({ focus: row.id })} aria-label={`None assigned: assign ${skillNounPlural()} to ${row.group.label}`}>
            <StatusBadge label="None assigned" tone="warning" icon="fa-triangle-exclamation" size="sm" surface="table" />
          </Link>
        ),
    },
    {
      key: "placed",
      label: "Expected in a course",
      width: 160,
      cell: (row) => (row.r ? <span className="tabular-nums">{fmt(row.r.placed)}</span> : <span className={TYPE.helper}>None</span>),
    },
    {
      key: "unplaced",
      label: "No course yet",
      width: 200,
      cell: (row) => {
        const g = row.r
        if (!g) return <span className={TYPE.helper}>None</span>
        // A group whose cohorts have no course offerings cannot be fixed in course mapping: say why, instead of a bare count.
        if (!g.offerings) return <StatusBadge label="No courses" tone="neutral" icon="fa-circle-minus" size="sm" surface="table" />
        if (!g.unplaced) return <span className={TYPE.helper}>None</span>
        return (
          <Link href={to(RESULT_SCREEN, { sg: g.group.id })} aria-label={`${fmt(g.unplaced)} no course yet for ${g.group.label}`}>
            <NoCourseBadge n={g.unplaced} />
          </Link>
        )
      },
    },
  ]

  const primaryLabel = next
    ? next.row.step === "library"
      ? `Configure ${fmt(next.fix.count ?? 0)} ${(next.fix.count ?? 0) === 1 ? skillNoun() : skillNounPlural()}`
      : next.row.step === "settings"
        ? "Set evaluation settings"
        : next.row.step === "assign"
          ? `Assign ${skillNounPlural()}`
          : "Map to courses"
    : null

  return (
    <div className="flex min-h-[calc(100dvh-5.5rem)] w-full flex-col">
    <PageFrame
      title={RESULT_TITLE}
      className="flex-1"
      actions={
        next && primaryLabel && !chosen ? (
          <Button asChild variant="default" size="sm">
            <Link href={href(next.fix)}>{primaryLabel}</Link>
          </Button>
        ) : undefined
      }
    >
      {loading ? (
        <Skeleton className="h-80 w-full" aria-label="Loading" />
      ) : chosen ? (
        <GroupDetail g={chosen} />
      ) : (
        <div className="flex flex-col gap-8" data-setup-result data-page-type="list">
          <section aria-labelledby="recap-h" className="flex flex-col gap-3" data-setup-recap>
            <h2 id="recap-h" className={TYPE.section}>Steps</h2>
            <DataTable<Recap>
              data={recap as Recap[]}
              columns={recapColumns}
              getRowId={(r) => r.step}
              selectable={false}
              searchable={false}
              showQueryControls={false}
              edgeInset={false}
              emptyState={<EmptyBlock compact title={`No ${skillNounPlural()} set up yet`} />}
            />
          </section>
          <section aria-labelledby="groups-h" className="flex flex-col gap-3">
            <h2 id="groups-h" className={TYPE.section}>By student group</h2>
            <DataTable<GroupRow>
              data={groupRows}
              columns={groupColumns}
              getRowId={(g) => g.id}
              selectable={false}
              searchable={false}
              showQueryControls={false}
              edgeInset={false}
              emptyState={<EmptyBlock compact title="No student groups yet" />}
            />
          </section>
        </div>
      )}
    </PageFrame>
    </div>
  )
}
