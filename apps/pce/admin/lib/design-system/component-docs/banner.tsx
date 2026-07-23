"use client"

import * as React from "react"

import type { ComponentDocSpec } from "@/lib/design-system/component-doc-types"
import {
  LocalBannerActionsPreview,
  LocalBannerVariantsPreview,
  MarketingBannerFloatingMediaPreview,
  MarketingBannerFloatingPreview,
  MarketingBannerHeroPreview,
  SystemBannerActionLayoutPreview,
  SystemBannerDismissPreview,
  SystemBannerProminentPreview,
  SystemBannerSubtlePreview,
} from "@/components/design-system/banner-previews"

function ex(
  section: Omit<ComponentDocSpec["sections"][number], "children" | "description">,
  children: React.ReactNode,
) {
  return { ...section, children }
}

export const bannerComponentDoc: ComponentDocSpec = {
  slug: "banner",
  summary:
    "Persistent messaging without toast. LocalBanner for page sections; SystemBanner for shell strip; MarketingBanner for hero and floating promos.",
  sections: [
    ex({ id: "local-variants", title: "LocalBanner variants" }, <LocalBannerVariantsPreview />),
    ex({ id: "local-actions", title: "LocalBanner actions" }, <LocalBannerActionsPreview />),
    ex({ id: "system-prominent", title: "SystemBanner · prominent" }, <SystemBannerProminentPreview />),
    ex({ id: "system-subtle", title: "SystemBanner · subtle" }, <SystemBannerSubtlePreview />),
    ex({ id: "system-actions", title: "SystemBanner actions" }, <SystemBannerActionLayoutPreview />),
    ex({ id: "system-dismiss", title: "Dismissible" }, <SystemBannerDismissPreview />),
    ex({ id: "marketing-hero", title: "MarketingBanner · hero" }, <MarketingBannerHeroPreview />),
    ex({ id: "marketing-floating", title: "MarketingBanner · floating" }, <MarketingBannerFloatingPreview />),
    ex({ id: "marketing-floating-media", title: "MarketingBanner · floating with media" }, <MarketingBannerFloatingMediaPreview />),
  ],
  anatomy: [
    { part: "LocalBanner", description: "Section-scoped alert with optional title, action, retry, and dismiss." },
    { part: "SystemBanner", description: "Shell strip with emphasis (prominent | subtle) and actionPosition (inline | bottom)." },
    { part: "MarketingBanner", description: "layout=hero (copy left, visual right) or layout=floating (card | media header)." },
    { part: "eyebrow", description: "Optional kicker above serif title — Notion/Alan pattern." },
    { part: "tone", description: "surface | tint (hero wash) | gradient (floating default)." },
    { part: "media", description: "Hero right visual or floating top collage/image/video." },
    { part: "SystemBannerSlot", description: "App shell mount that reads SystemBannerContext." },
    { part: "FloatingMarketingBannerSlot", description: "Shell portal — media floating promo; corner chip restores after dismiss." },
  ],
  guidelines: {
    do: [
      "Use banners for persistent feedback users must read or dismiss.",
      "Use SystemBanner for workspace-wide notices; LocalBanner for route-scoped errors and info.",
      "Hero: copy left, media right — eyebrow + serif title + pill CTA (Notion/Alan).",
      "Floating: opaque brand gradient (`brand-color-light` → `brand` → `brand-dark`) with `text-brand-foreground`.",
      "After dismiss, FloatingMarketingBannerSlot shows a corner chip to restore the promo.",
      "Pair error LocalBanner with retry when the user can recover inline.",
    ],
    dont: [
      "Do not use Sonner or snackbars for product messaging.",
      "Do not stack multiple SystemBanners; merge copy into one strip.",
      "Do not use LocalBanner for global maintenance (use SystemBanner).",
      "Do not use MarketingBanner for errors or maintenance (use Local/SystemBanner).",
    ],
  },
  accessibility: [
    "Variants map to role=status or role=alert with matching aria-live politeness.",
    "Dismiss buttons expose an accessible name (Dismiss / Dismiss banner).",
    "Do not rely on color alone; titles and icons reinforce severity.",
  ],
  extraImports: [
    { label: "SystemBannerSlot", path: "@/components/system-banner-slot" },
    { label: "FloatingMarketingBannerSlot", path: "@/components/floating-marketing-banner-slot" },
    { label: "MarketingBanner", path: "@exxatdesignux/ui/components/marketing-banner" },
    { label: "SystemBannerContext", path: "@/contexts/system-banner-context" },
  ],
}
