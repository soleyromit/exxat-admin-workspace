"use client"

/**
 * A list's skills, variant D "One Add skills panel" (ADMIN-D6 round add-skills, Proposed D-ADD1116). Template T1 list, T4 split while the panel is open.
 * Question: does one "Add skills" button, opening one panel with two tabs (From library, New skills), fit better than four entry points in four containers?
 * The table, tabs, banner and edit panel are variant A's. What changes is the way in: the header holds one filled "Add skills" (no split button, no menu) and the empty
 * state one line and the same button. The panel stays on this page, names the list in its title, and its one primary adds what both tabs hold.
 * Not on the page: Starting points (Later), a separate Add a skill sheet, a separate Add several sheet, a trip to Skill lists to pick from the library.
 */
import { SkillsLibraryTablePage } from "./admin-skills-library-a"

export function AdminSkillsLibraryD() {
  return <SkillsLibraryTablePage addMode="panel" />
}
