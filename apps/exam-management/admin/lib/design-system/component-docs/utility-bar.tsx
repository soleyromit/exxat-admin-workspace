"use client"

import * as React from "react"

import type { ComponentDocSpec } from "@/lib/design-system/component-doc-types"
import {
  UtilityBarClassicSidebarPreview,
  UtilityBarFullWidthVariantPreview,
  UtilityBarSidebarVariantPreview,
} from "@/components/design-system/utility-bar-previews"

function ex(
  section: Omit<ComponentDocSpec["sections"][number], "children" | "description">,
  children: React.ReactNode,
) {
  return { ...section, children }
}

export const utilityBarComponentDoc: ComponentDocSpec = {
  slug: "utility-bar",
  summary:
    "Shell chrome for global utility actions. Three layout variants (Settings > Appearance > Shell layout): sidebar-classic keeps product switcher, search, Ask Leo, settings, and profile in the sidebar with no utility bar; utility-sidebar scopes the bar to the workspace column with the product switcher in the sidebar header (recommended utility mode); utility-bar moves the product switcher into a full-width bar above the sidebar.",
  sections: [
    ex({ id: "variant-sidebar-classic", title: "Shell layout: Sidebar (classic)" }, <UtilityBarClassicSidebarPreview />),
    ex({ id: "variant-utility-sidebar", title: "Shell layout: Utility bar — product in sidebar" }, <UtilityBarSidebarVariantPreview />),
    ex({ id: "variant-utility-bar", title: "Shell layout: Utility bar — product on bar" }, <UtilityBarFullWidthVariantPreview />),
  ],
  anatomy: [
    { part: "UtilityBarSlot", description: "Shell mount — reads ShellLayoutContext to decide placement + styling." },
    { part: "UtilityBarProductSwitcher", description: "Utility-bar-only trigger; reuses ProductLogoButton's product data and dropdown rows, side=\"bottom\"." },
    { part: "Search", description: "Icon button — calls requestOpenCommandMenu(), same ⌘K palette as everywhere else." },
    { part: "AskLeoToggle", description: "Icon button — toggles the Ask Leo side panel via useAskLeo(); shared with any other call site." },
    { part: "NotificationBell", description: "Icon button + dropdown panel; mock data in lib/mock/notifications.ts, local read/unread state only." },
    { part: "Get Help / Settings", description: "Icon buttons linking to /help and the product-aware settings route (getSecondaryNavForProduct)." },
    { part: "UtilityUserMenu", description: "Compact avatar trigger; same NAV_USER data and menu items as the old sidebar NavUser." },
  ],
  ux: {
    job: "Give users one persistent, always-visible place to search, open Ask Leo, and check notifications without hunting through the sidebar.",
    whenToUse: [
      "Any signed-in shell route (not exam-lock, not /builder/onboarding).",
      "When a surface needs a canonical trigger for a global action instead of a page-local one.",
    ],
    whenNotToUse: [
      "Shell layout `sidebar-classic` — the utility bar is not mounted; use sidebar quick actions + footer instead.",
      "Page- or hub-scoped actions — those belong in PageHeader, not the utility bar.",
      "One-off promo messaging — use SystemBanner instead (stacks directly above/below depending on variant).",
    ],
    modernReferences: ["Linear command bar + inbox bell", "Notion top bar with search + updates bell"],
    patternDoc: "apps/web/docs/shell-utility-bar-pattern.md",
  },
  guidelines: {
    do: [
      "Reuse existing triggers (requestOpenCommandMenu, AskLeoToggle, getSecondaryNavForProduct, NAV_USER) — one canonical location per action, not a duplicate in the sidebar.",
      "Use `utilityBarActionButtonClass` (`icon-button-chrome` + `sidebar-accent` hover) — not plain `Button` ghost (`interactive-hover` / muted grey).",
      "Keep Search and Ask Leo icon-only here, matching Notifications/Help/Settings/Profile — no mixed icon+label buttons in this row.",
      "In the utility-bar variant, let the bar paint over the sidebar's top strip (it's transparent, no bg/border) rather than trying to reposition the sidebar's fixed panel.",
    ],
    dont: [
      "Do not add a second Search/Ask Leo/Notifications trigger elsewhere in the shell — this bar is the single source of truth.",
      "Do not hardcode Settings' URL — always resolve it via getSecondaryNavForProduct(product) so One — Sites gets Site Configuration instead.",
    ],
  },
  accessibility: [
    "Every icon-only trigger has an aria-label (Search, Ask Leo, Notifications with unread count, Get Help, Settings, profile name).",
    "NotificationBell's unread badge is presentational — the count is also read via the trigger's aria-label.",
    "Search and Ask Leo keep their keyboard shortcuts (⌘K, ⌘⌥K) regardless of layout variant.",
  ],
  extraImports: [
    { label: "UtilityBarSlot", path: "@/components/utility-bar-slot" },
    { label: "ShellLayoutContext", path: "@/contexts/shell-layout-context" },
    { label: "UtilityBarProductSwitcher", path: "@/components/utility-bar-product-switcher" },
    { label: "NotificationBell", path: "@/components/notification-bell" },
    { label: "UtilityUserMenu", path: "@/components/utility-user-menu" },
  ],
  relatedSlugs: ["banner", "site-header", "sidebar"],
}
