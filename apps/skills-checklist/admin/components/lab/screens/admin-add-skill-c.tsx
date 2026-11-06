"use client"

/**
 * Add a skill, option set 3 "Many at once": add several by name (components/lab/library/add-several-sheet.tsx), open over
 * the library C board. Paste or type a list of names; each becomes a skill with the category and tags chosen for all (decision D-X28);
 * only the first cell of a pasted line is read (REQ IM-03); a repeated name offers the one duplicate rule (REQ IM-06);
 * "Review each line" renames, describes or leaves out a line (REQ IM-05). Not the walkthrough's stop, which keeps the table (variant A).
 * Question: when a coordinator has 5 to 30 names in an email, is pasting them all at once faster than adding one at a time?
 * CALL 10-26: this is the phase 1 bulk path; import (file upload) is phase 2.
 */
import { SkillsLibraryBoardPage } from "@/components/lab/screens/admin-skills-library-c"

export function AdminAddSkillC() {
  return <SkillsLibraryBoardPage startAdding />
}
