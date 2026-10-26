"use client"

/**
 * Attainment, variant B (named alternative, "ranked skills"): opens on Skills as a ranked table, most students not yet
 * achieved first, with a four-state distribution strip and a linked count per state. Students is a table, not a matrix.
 * Tests whether "which skill do I fix first" beats "which student and where".
 */
import { AttainmentPage } from "@/components/lab/admin-b/attainment-page"

export function AdminAttainmentB() {
  return <AttainmentPage variant="B" defaultView="skills" studentsAs="table" />
}
