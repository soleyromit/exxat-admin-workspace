"use client"

/**
 * Groups of skills D, "Row actions + outcome" (2026-11-03): C, plus how the students each group of skills reaches stand this term,
 * as two counts (on track, behind with an amber glyph and word; never red, no progress bars), each opening Reports filtered to
 * those students. Aggregate first, drill down second: a group that spans several student groups opens one Reports link per student
 * group. Behind is the Reports flag under "Required this term" (D-X12).
 * Question it tests: does a report beside each group of skills answer "is this group of skills working?" without leaving setup?
 */
import { AdminListsCohortsA } from "@/components/lab/screens/admin-lists-cohorts-a"
import { GroupsWithRowActions } from "@/components/lab/screens/admin-lists-cohorts-c"
import { useListsMode } from "@/components/lab/admin-a/lists-frame"

export function AdminListsCohortsD() {
  return useListsMode() === "assign" ? <AdminListsCohortsA /> : <GroupsWithRowActions frameTag="D" outcome />
}
