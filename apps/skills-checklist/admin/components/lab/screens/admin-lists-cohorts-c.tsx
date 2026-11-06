"use client"

/**
 * Skill lists, the page (designer 2026-11-05, D-L106): one table, one panel. A list is like a shared document or a time-off policy: you make it, choose who it applies to, and one is what
 * new student groups get. Question it tests: does a whole list, with who has it in one place, read as simple?
 */
import { ListsFrame } from "@/components/lab/admin-a/lists-frame"
import { GroupsActionTable } from "@/components/lab/admin-a/lists-groups-table"

export function AdminListsCohortsC() {
  return <ListsFrame variant="C">{(c) => <GroupsActionTable c={c} />}</ListsFrame>
}
