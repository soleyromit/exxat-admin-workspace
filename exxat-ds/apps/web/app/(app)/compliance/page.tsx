import { ComplianceClient } from "@/components/compliance-client"
import { PrimaryPageTemplate } from "@/components/templates/primary-page-template"

export default function CompliancePage() {
  return (
    <PrimaryPageTemplate siteHeader={{ title: "Compliance" }}>
      <ComplianceClient />
    </PrimaryPageTemplate>
  )
}
