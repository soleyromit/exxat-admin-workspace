"use client"

/**
 * Attainment, variant A (recommended): opens on Students as the students x sections heat matrix (dashboard-concepts D,
 * "matrix explorer"). Filters stay in the compact scope bar; a cell opens the evidence peek. Skills, Sections and Tags are
 * one tab away. Design doc: docs/knowledge/design/admin-attainment-export-settings.md.
 */
import { AttainmentPage } from "@/components/lab/admin-b/attainment-page"

export function AdminAttainmentA() {
  return <AttainmentPage variant="A" defaultView="students" studentsAs="matrix" />
}
