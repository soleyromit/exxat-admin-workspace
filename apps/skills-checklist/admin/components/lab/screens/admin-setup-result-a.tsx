"use client"

/**
 * Setup summary, variant A (Proposed 2026-11-02): the end state of setup. Aggregate first: one sentence, then one row per student
 * group (students, its groups of skills, the skills it must complete, how many a course expects, how many have no course yet, amber).
 * A group opens its detail (`?group=`): every skill, the courses and terms where it is Mandatory or Recommended, and what is left.
 * Reached from the checklist, from Assign and Course mapping ("See the result"), and as the last step of the admin walkthrough.
 *
 * Regions: header, summary, groups table (or one group's detail). URL: ?group= · ?state=loading.
 */
import * as React from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { StatusBadge } from "@exxatdesignux/ui"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import { Skeleton } from "@exxatdesignux/ui/components/ui/skeleton"
import { DataTable } from "@exxatdesignux/ui/components/data-table"
import type { ColumnDef } from "@exxatdesignux/ui/components/data-table/types"
import { cn } from "@exxatdesignux/ui/lib/utils"
import { PageFrame } from "@/components/skills/page-header"
import { unplacedSkillIds } from "@/lib/lab/setup-result"
import { capitalize, skillNoun, skillNounPlural } from "@/lib/lab/terms"
import { useLabHref } from "@/components/lab/lab-bar/page-context"
import { TYPE } from "@/components/lab/type-scale"
import { LINK, LINK_IN_TABLE } from "@/components/lab/link-styles"
import { GroupDetail, NoCourseBadge, RESULT_SCREEN, useSetupResult } from "@/components/lab/admin-a/result-parts"
import { EmptyBlock } from "@/components/lab/empty-block"
import type { GroupResult } from "@/lib/lab/setup-result"

type GroupRow = GroupResult & Record<string, unknown>

export const RESULT_TITLE = "Setup summary"

export function AdminSetupResultA() {
  const { ready, result } = useSetupResult()
  const params = useSearchParams()
  const to = useLabHref()
  const loading = !ready || params?.get("state") === "loading"
  const groupId = params?.get("sg")
  const chosen = groupId ? result.groups.find((g) => g.group.id === groupId) : undefined
  const unplaced = unplacedSkillIds(result).size
  const columns: ColumnDef<GroupRow>[] = [
    {
      key: "group",
      label: "Student group",
      cell: (g) => (
        <span className="flex min-w-0 flex-col" data-result-group={g.group.id}>
          <Link href={to(RESULT_SCREEN, { sg: g.group.id })} className={LINK_IN_TABLE}>{g.group.label}</Link>
          <span className={TYPE.meta}>{`${g.group.studentIds.length} students`}</span>
        </span>
      ),
    },
    { key: "lists", label: `Groups of ${skillNounPlural()}`, cell: (g) => <span className="whitespace-normal">{g.lists.join(", ")}</span> },
    { key: "skills", label: `${capitalize(skillNounPlural())} to complete`, width: 180, cell: (g) => <span className="tabular-nums">{g.skills.length.toLocaleString("en-US")}</span> },
    { key: "placed", label: "Expected in a course", width: 180, cell: (g) => <span className="tabular-nums">{g.placed.toLocaleString("en-US")}</span> },
    { key: "unplaced", label: "No course yet", width: 192, cell: (g) => (g.unplaced ? <NoCourseBadge n={g.unplaced} /> : <span className={TYPE.helper}>None</span>) },
  ]
  return (
    <PageFrame
      title={RESULT_TITLE}
      actions={
        unplaced && !chosen ? (
          <Button asChild variant="default" size="sm">
            <Link href={to("admin/course-mapping", { by: "skill" })}>Map the rest to courses</Link>
          </Button>
        ) : undefined
      }
    >
      {loading ? (
        <Skeleton className="h-80 w-full" aria-label="Loading" />
      ) : chosen ? (
        <GroupDetail g={chosen} backHref={to(RESULT_SCREEN, { sg: null })} />
      ) : (
        <div className="flex flex-col gap-4" data-setup-result>
          <h2 className={TYPE.section}>By student group</h2>
          <div role="region" aria-label="Student groups">
            <DataTable<GroupRow>
              data={result.groups as GroupRow[]}
              columns={columns}
              getRowId={(g) => g.group.id}
              selectable={false}
              searchable={false}
              showQueryControls={false}
              edgeInset={false}
              emptyState={<EmptyBlock compact title="No student groups yet" />}
            />
          </div>
          {result.unassigned.length ? (
            <ul className="flex flex-col gap-1">
              {result.unassigned.length ? (
                <li className={cn("flex flex-wrap items-center gap-2", TYPE.body)}>
                  <StatusBadge label="Not assigned" tone="warning" icon="fa-triangle-exclamation" size="sm" surface="table" />
                  <span>{`${result.unassigned.length.toLocaleString("en-US")} ${result.unassigned.length === 1 ? `${skillNoun()} is` : `${skillNounPlural()} are`} not assigned to any student group.`}</span>
                  <Link href={to("admin/lists-cohorts", { view: "assign" })} className={LINK}>Assign them</Link>
                </li>
              ) : null}
            </ul>
          ) : null}
        </div>
      )}
    </PageFrame>
  )
}
