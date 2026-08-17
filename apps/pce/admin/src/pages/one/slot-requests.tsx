import * as React from "react"

import { OneHubClient } from "@/components/one/one-hub-client"
import { buildOneSlotRequestColumns } from "@/components/one/one-hub-columns"
import { ONE_SLOT_REQUESTS, oneSlotRequestsKpi } from "@/lib/mock/one-hubs"

export default function OneSitesSlotRequestsPage() {
  const rows = ONE_SLOT_REQUESTS
  const columns = React.useMemo(() => buildOneSlotRequestColumns(rows), [rows])
  const metrics = React.useMemo(() => oneSlotRequestsKpi(rows), [rows])

  return (
    <OneHubClient
      title="Slot requests"
      hubKey="slot-requests"
      rows={rows}
      columns={columns}
      metrics={metrics}
      tabLabel="All requests"
      searchAriaLabel="Search slot requests"
      emptyState="No slot requests right now."
      getRowId={row => row.id}
      getRowSelectionLabel={row => row.requestCode}
      defaultSort={{ key: "startsOn", dir: "asc" }}
    />
  )
}
