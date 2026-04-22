import { PrimaryPageTemplate } from "@/components/templates/primary-page-template"
import { TeamClient } from "@/components/team-client"

export default function TeamPage() {
  return (
    <PrimaryPageTemplate siteHeader={{ title: "Team" }}>
      <TeamClient />
    </PrimaryPageTemplate>
  )
}
