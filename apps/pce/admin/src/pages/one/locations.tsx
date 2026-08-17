import * as React from "react"

import { OneHubClient } from "@/components/one/one-hub-client"
import { buildOneLocationColumns } from "@/components/one/one-hub-columns"
import { ONE_LOCATIONS, oneLocationsKpi } from "@/lib/mock/one-hubs"

export default function OneSitesLocationsPage() {
  const rows = ONE_LOCATIONS
  const columns = React.useMemo(() => buildOneLocationColumns(rows), [rows])
  const metrics = React.useMemo(() => oneLocationsKpi(rows), [rows])

  return (
    <OneHubClient
      title="Locations"
      hubKey="locations"
      rows={rows}
      columns={columns}
      metrics={metrics}
      tabLabel="All locations"
      searchAriaLabel="Search locations"
      emptyState="No locations in this brand yet."
      getRowId={row => row.id}
      getRowSelectionLabel={row => row.name}
      defaultSort={{ key: "name", dir: "asc" }}
    />
  )
}
