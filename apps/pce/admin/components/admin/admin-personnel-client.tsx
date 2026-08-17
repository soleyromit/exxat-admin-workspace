"use client"

/**
 * Personnel — the site side of the workspace: coordinators, preceptors and
 * schedulers who belong to a clinical partner rather than to the school.
 *
 * Deliberately not a fourth tab on People. Personnel hangs off
 * brand > site > location, a different scope hierarchy and a different tenant
 * boundary, so merging the two lists would put a partner's roster in front of
 * a school administrator who has no claim on it.
 */

import * as React from "react"
import { useNavigate } from "react-router"

import { buildAdminPersonnelColumns } from "@/components/admin/admin-columns"
import { AdminHubClient, type AdminHubView } from "@/components/admin/admin-hub-client"
import {
  ADMIN_PERSONNEL,
  adminPersonnelKpi,
  type AdminPersonnel,
} from "@/lib/mock/admin-directory"

export function AdminPersonnelClient() {
  const navigate = useNavigate()

  const views = React.useMemo<AdminHubView<AdminPersonnel>[]>(
    () => [
      {
        id: "personnel",
        label: "Personnel",
        icon: "fa-user-nurse",
        rows: ADMIN_PERSONNEL,
        columns: buildAdminPersonnelColumns(ADMIN_PERSONNEL),
        emptyState: "No partner personnel yet. Import a roster from the site.",
      },
    ],
    [],
  )

  const metrics = React.useMemo(() => adminPersonnelKpi(ADMIN_PERSONNEL), [])

  return (
    <AdminHubClient<AdminPersonnel>
      title="Personnel"
      hubKey="admin-personnel"
      views={views}
      metrics={metrics}
      searchAriaLabel="Search personnel"
      objectLabel="personnel"
      getRowId={row => row.id}
      getRowSelectionLabel={row => row.name}
      getRowHref={row => `/personnel/${row.id}`}
      onRowNavigate={href => navigate(href)}
      defaultSort={{ key: "name", dir: "asc" }}
    />
  )
}
