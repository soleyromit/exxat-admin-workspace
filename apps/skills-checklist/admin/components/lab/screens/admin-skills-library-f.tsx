"use client"

/**
 * A list's skills, variant F "Search-first picker" (ADMIN-D6 round add-skills-simple, Proposed D-ADD1116-s). Template T1 list, T4 split while the panel is open.
 * Question: is one box (search, create and paste in the same field), one list of boxes and one "Add n skills" enough, with no tabs and no form?
 * The table, tabs, banner and edit panel are variant A's. The header holds one filled "Add skills"; the panel is a resource picker: Select all over the result, a last row
 * Create "{name}" when the library has no such skill, Upload a file and Copy from a list in one menu.
 * Not on the panel: tabs, a category select, a box per category, a names form, category and tags, an evaluation settings summary.
 */
import { SkillsLibraryTablePage } from "./admin-skills-library-a"

export function AdminSkillsLibraryF() {
  return <SkillsLibraryTablePage addMode="quick" />
}
