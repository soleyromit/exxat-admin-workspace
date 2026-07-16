"use client"

import * as React from "react"

import type { ComponentDocSpec } from "@/lib/design-system/component-doc-types"
import {
  MarketingBannerFloatingMediaPreview,
  MarketingBannerFloatingPreview,
  MarketingBannerHeroPreview,
} from "@/components/design-system/banner-previews"

function ex(
  section: Omit<ComponentDocSpec["sections"][number], "children" | "description">,
  children: React.ReactNode,
  description?: string,
) {
  return { ...section, description, children }
}

export const marketingBannerComponentDoc: ComponentDocSpec = {
  slug: "marketing-banner",
  summary: "Hero inline promo and floating card/full-bleed media — child of Banner family.",
  sections: [
    ex({ id: "hero", title: "Hero inline" }, <MarketingBannerHeroPreview />),
    ex({ id: "floating", title: "Floating card" }, <MarketingBannerFloatingPreview />),
    ex({ id: "floating-media", title: "Floating media" }, <MarketingBannerFloatingMediaPreview />),
  ],
  guidelines: {
    do: ["Use FloatingMarketingBannerSlot for shell promos.", "Dismiss persists via usePersistedState when required."],
    dont: ["Do not use marketing banner for errors or compliance — use SystemBanner / LocalBanner."],
  },
  relatedSlugs: ["banner"],
}
