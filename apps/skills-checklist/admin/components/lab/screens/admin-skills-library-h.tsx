"use client"

/**
 * A list's skills, variant H "One side panel, then save" (D-ADD1117, Decided; Romit's handoff spec "Variant A, side panel"). Template T1 list, T4 split while the panel is open.
 * Question: does one Add skills button, one side panel (Library and Import, a source picker in the search, one-click new skill, a review inside the panel) and an unsaved
 * draft on the list that asks who gets the change on Save fit the job better than adding at once?
 * The table, tabs, banner and edit panel are variant A's. Not on the page: Starting points (removed, decision 2), a split button, a separate configure step (decision 7).
 */
import { SkillsLibraryTablePage } from "./admin-skills-library-a"

export function AdminSkillsLibraryH() {
  return <SkillsLibraryTablePage addMode="side" />
}
