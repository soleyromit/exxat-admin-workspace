import { DataListClient } from "@/components/data-list-client"
import { PrimaryPageTemplate } from "@/components/templates/primary-page-template"

export default function DataListPage() {
  return (
    <PrimaryPageTemplate siteHeader={{ title: "Placements" }}>
      <DataListClient />
    </PrimaryPageTemplate>
  )
}
