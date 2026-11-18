"use client"

/**
 * A list's skills, variant G "Add on the page" (ADMIN-D6 round add-skills-simple, Proposed D-ADD1116-s). Template T1 list throughout: no panel, no step.
 * Question: is adding on the list's own page (search, Add on a row, Add all, each landing at once with Undo) simpler than choosing in a panel and confirming?
 * "Add skills" opens a region above the table (`?add=1`); an empty list opens on it. The row reads "Added" once it is on the list and the table under it shows it.
 * A paste, a file or a copy from another list is offered as one line with its counts and goes on only when its own Add is pressed.
 * Not on the page: an overlay, a selection, a footer, a confirm step for one skill, category and tags, an evaluation settings summary.
 */
import { SkillsLibraryTablePage } from "./admin-skills-library-a"

export function AdminSkillsLibraryG() {
  return <SkillsLibraryTablePage addMode="inline" />
}
