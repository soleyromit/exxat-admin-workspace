"use client"

/**
 * Add a skill, option set 1 "Guided" (recommended): the short add sheet (components/lab/library/skill-sheet.tsx) open over the library A table.
 * Name, description, category and tags; no evaluation model. One filled primary, Add skill; while the sheet is open the page's "Add a skill" steps
 * down to outline. `?how=several` opens Add several over the same table: the walkthrough's Add several stop keeps the page behind unchanged.
 */
import { useSearchParams } from "next/navigation"
import { SkillsLibraryTablePage } from "@/components/lab/screens/admin-skills-library-a"

export function AdminAddSkillA() {
  return <SkillsLibraryTablePage startAdding={useSearchParams()?.get("how") === "several" ? "several" : true} />
}
