"use client"

/**
 * Add a skill, option set 2 "One page": the inline row at the end of a category in the library tree (library B), open in
 * the first category that still needs setup. Category defaults to the row's and can be changed; tags are picked or created
 * on the same row; both stay set for the next name (decision D-X28). Enter adds and keeps the row open; Escape closes.
 * Question: when a coordinator adds several skills by hand, is type, Enter, repeat inside the category worth deferring
 * required to graduate to the skill's panel?
 */
import { SkillsLibraryTreePage } from "@/components/lab/screens/admin-skills-library-b"

export function AdminAddSkillB() {
  return <SkillsLibraryTreePage startAdding />
}
