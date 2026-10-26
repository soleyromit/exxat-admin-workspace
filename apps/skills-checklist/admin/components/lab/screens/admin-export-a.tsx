"use client"

/**
 * Export (single recommended layout): the export panel opened over Attainment, so the reader sees exactly what is exported.
 * Signed PDF summary of the view, or CSV and Excel with one row per evaluation (REQ RP-10; OD-10 open). Each format lists
 * what it contains and leaves out. Composed from the DS parts ExportDrawer is built from (see export-panel.tsx for why).
 */
import { AttainmentPage } from "@/components/lab/admin-b/attainment-page"

export function AdminExportA() {
  return <AttainmentPage variant="export" defaultView="students" studentsAs="matrix" exportOpenByDefault />
}
