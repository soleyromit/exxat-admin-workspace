"use client"

/** Retired by the one-page design (designer 2026-11-05, D-L106). The registry keeps its slot, and it opens the one page. */
import { ListsFrame } from "@/components/lab/admin-a/lists-frame"
import { GroupsActionTable } from "@/components/lab/admin-a/lists-groups-table"

export function AdminListsCohortsB() {
  return <ListsFrame variant="B">{(c) => <GroupsActionTable c={c} />}</ListsFrame>
}
