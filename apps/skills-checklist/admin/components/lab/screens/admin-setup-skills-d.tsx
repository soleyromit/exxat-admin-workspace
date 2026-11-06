"use client"

/**
 * Setup summary, variant D, "Set up skills" with the list as step 1 (D-L46, Proposed). The same focus workflow as variant C
 * (admin-setup-skills-a.tsx, D-L44); only step 1 differs: the list is the page, add row on top, edit and remove in place
 * (components/lab/setup/skills-list-step.tsx). C stays unchanged so the two compare on step 1 alone.
 */
import { AdminSetupSkillsA } from "@/components/lab/screens/admin-setup-skills-a"

export function AdminSetupSkillsD() {
  return <AdminSetupSkillsA skillsStep="list" />
}
