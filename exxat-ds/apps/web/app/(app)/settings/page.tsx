import { PrimaryPageTemplate } from "@/components/templates/primary-page-template"
import { SettingsClient } from "@/components/settings-client"

export default function SettingsPage() {
  return (
    <PrimaryPageTemplate
      maxWidthClassName="max-w-3xl"
      contentClassName="px-8 pt-10 pb-32"
      siteHeader={{
        breadcrumbs: [{ label: "Dashboard", href: "/dashboard" }],
        title: "Settings",
      }}
    >
      <SettingsClient />
    </PrimaryPageTemplate>
  )
}
