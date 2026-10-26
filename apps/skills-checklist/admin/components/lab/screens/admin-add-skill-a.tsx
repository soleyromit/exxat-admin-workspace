"use client"

/**
 * Add a skill, option set 1 "Guided" (recommended): the short add sheet (components/lab/library/skill-sheet.tsx) open over
 * the library A table. Name, category, tags and required to graduate; no evaluation model (configure owns it).
 * Question: short side sheet: do name, category, tags and required to graduate, with configure as the next step, get a
 * skill in without losing the library?
 * The one filled primary is "Save and configure"; while the sheet is open the page's "Add a skill" steps down to outline.
 */
import { SkillsLibraryTablePage } from "@/components/lab/screens/admin-skills-library-a"

export function AdminAddSkillA() {
  return <SkillsLibraryTablePage startAdding />
}
