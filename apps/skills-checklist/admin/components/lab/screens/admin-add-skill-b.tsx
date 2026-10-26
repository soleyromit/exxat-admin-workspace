"use client"

/**
 * Add a skill, option set 2 "One page": the inline row at the end of a category in the library tree (library B), open in
 * the first category that still needs setup. Category is implied; Enter adds and opens the next empty row; Escape closes.
 * Question: when a coordinator adds several skills by hand, is type, Enter, repeat inside the category worth deferring
 * tags and required to graduate to the skill's panel?
 */
import { SkillsLibraryTreePage } from "@/components/lab/screens/admin-skills-library-b"

export function AdminAddSkillB() {
  return <SkillsLibraryTreePage startAdding />
}
