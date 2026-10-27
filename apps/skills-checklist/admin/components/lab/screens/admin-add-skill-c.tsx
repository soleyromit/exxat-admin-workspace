"use client"

/**
 * Add a skill, option set 3 "Many at once": add several by name (components/lab/library/add-several-sheet.tsx), open over
 * the library C board. Paste or type a list of names; each becomes a skill that is not configured, with the category and
 * tags chosen for all, or the Category and Tags cells of a line pasted from a sheet (decision D-X28);
 * names already in the library or repeated in the list are skipped and shown. Success offers to configure them together.
 * Question: when a coordinator has 5 to 30 names in an email, is pasting them all at once faster than adding one at a time?
 * CALL 10-26: this is the phase 1 bulk path; import (file upload) is phase 2.
 */
import { SkillsLibraryBoardPage } from "@/components/lab/screens/admin-skills-library-c"

export function AdminAddSkillC() {
  return <SkillsLibraryBoardPage startAdding />
}
