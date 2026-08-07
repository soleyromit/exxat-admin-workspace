import * as React from "react"

import { LeoLandingClient } from "@/components/leo-landing-client"
import { PrimaryPageTemplate } from "@/components/templates/primary-page-template"
import { useProductDashboardHref } from "@/contexts/product-route-sync"
import { useProduct } from "@/contexts/product-context"
import { productSlug } from "@/stores/app-store"

/**
 * `/<product>/leo` — Leo's dedicated canvas.
 *
 * Sticky `SiteHeader` back trail (same as other product routes). The hero /
 * thread `<h1>` stays in the canvas body. Recents live in the sidebar
 * drill-in; the canvas carries the chat.
 */
export default function LeoPage() {
  const { product } = useProduct()
  const slug = productSlug(product)
  const dashboardHref = useProductDashboardHref()

  return (
    <PrimaryPageTemplate
      siteHeader={{
        back: {
          href: dashboardHref,
          label: "Dashboard",
        },
      }}
      sidebarInsetClassName="flex min-h-0 flex-1 flex-col overflow-hidden"
      bodyClassName="relative min-h-0 flex-1 overflow-hidden"
      contentClassName="flex min-h-0 flex-1 flex-col px-0"
    >
      <LeoLandingClient productSlug={slug} />
    </PrimaryPageTemplate>
  )
}
