import { PrimaryPageTemplate } from "@/components/templates/primary-page-template"
import { RotationsPanelActivator } from "@/components/rotations-panel-activator"
import { RotationsEmptyState } from "@/components/rotations-empty-state"

export default function RotationsPage() {
  return (
    <PrimaryPageTemplate
      beforeSiteHeader={<RotationsPanelActivator />}
      siteHeader={{ title: "Rotations" }}
      contentClassName="px-4 lg:px-6 py-6"
    >
      <RotationsEmptyState />
    </PrimaryPageTemplate>
  )
}
