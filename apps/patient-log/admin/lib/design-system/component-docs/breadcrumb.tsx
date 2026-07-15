"use client"

import * as React from "react"

import type { ComponentDocSpec } from "@/lib/design-system/component-doc-types"
import { BreadcrumbPreview } from "@/components/design-system/navigation-previews"

export const breadcrumbComponentDoc: ComponentDocSpec = {
  slug: "breadcrumb",
  summary: "Ancestor trail paired with SiteHeader — one H1 on the page, breadcrumbs are wayfinding only.",
  sections: [
    {
      id: "default",
      title: "Default",
      children: <BreadcrumbPreview />,
      description: "Current page uses BreadcrumbPage; ancestors are links.",
    },
  ],
  guidelines: {
    do: ["Compose via SiteHeader + PageBreadcrumbTrail.", "Keep labels short; truncate middle segments on narrow viewports."],
    dont: ["Do not add a Back button when breadcrumbs exist (P1).", "Do not use breadcrumb as the only page title."],
  },
  relatedSlugs: ["site-header", "page-header"],
}
