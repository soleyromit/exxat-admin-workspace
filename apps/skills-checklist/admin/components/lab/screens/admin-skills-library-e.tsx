"use client"

/**
 * A list's skills, variant E "The add step is the page" (ADMIN-D6 round add-skills, Proposed D-ADD1116). Template T1 list; T3 form while the add step shows.
 * Question: for a new list, is it clearer to land on the library with boxes to tick (and a names box beside it) than on an empty state that asks how to add?
 * An empty list opens on the add step: the library on the left, new names on the right, one footer with the count in words and the one primary. A list with skills shows
 * variant A's table with one "Add skills" button, which opens the same step in place of the table (`?add=1`); the back icon and Cancel return to the table.
 * Not on the page: an illustration, a choice of method, a side panel, Starting points (Later).
 */
import { SkillsLibraryTablePage } from "./admin-skills-library-a"

export function AdminSkillsLibraryE() {
  return <SkillsLibraryTablePage addMode="page" />
}
