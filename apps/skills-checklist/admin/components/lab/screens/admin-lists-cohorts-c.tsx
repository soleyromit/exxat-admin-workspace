"use client"

/**
 * Groups of skills C, "Row actions" (2026-11-03, Romit on A's optional step: "why assign to student groups at the bottom? what's
 * the relevance of the skip button? what are the other actions for group of skills? I don't see a report around it").
 * Every action sits on the row it acts on: "Assigned to" opens the assign step for that group of skills (an unassigned one shows
 * Assign), a row menu holds Assign to student groups, Make default, Duplicate, Completion rule and Delete (drafts only), and
 * Students counts who it reaches, opening Reports. No sticky footer: the lab bar moves the walkthrough on. "Assign individual
 * skills" replaces Skip, the same words as the assign step's choice, beside New group of
 * skills. The assign step itself is A's.
 * Question it tests: with actions on the row and no footer, does the page read as a place to manage groups of skills?
 */
import { ListsFrame, useAssignHref, useListsMode, type StepOptions } from "@/components/lab/admin-a/lists-frame"
import { GroupsActionTable } from "@/components/lab/admin-a/lists-groups-table"
import { AdminListsCohortsA } from "@/components/lab/screens/admin-lists-cohorts-a"

/**
 * Shared by C and D. No header flow button: "Assign individual skills" was removed (Romit 2026-11-03, "yes" to "remove it from
 * Groups of skills since the Assign step now has the choice"; D-L38 amended). On the walkthrough the footer moves on
 * ("Next: Assign skills to student groups"); elsewhere there is no step footer.
 */
export const ROW_ACTION_OPTIONS: StepOptions = { stepFooter: false }

/** `frameTag`: the data-admin-lab tag of the frame (which design this is), never a link parameter. */
export function GroupsWithRowActions({ frameTag, outcome }: { frameTag: string; outcome: boolean }) {
  const assignHref = useAssignHref()
  return <ListsFrame variant={frameTag} options={ROW_ACTION_OPTIONS}>{(c) => <GroupsActionTable c={c} outcome={outcome} assignHref={assignHref} />}</ListsFrame>
}

export function AdminListsCohortsC() {
  // The assign step is one job and stays A's design; C and D change only the groups of skills page.
  return useListsMode() === "assign" ? <AdminListsCohortsA /> : <GroupsWithRowActions frameTag="C" outcome={false} />
}
