// ─────────────────────────────────────────────────────────────────────────────
// Mock data — Navigation
// Uses .tsx because icons are JSX (<i> elements).
// ─────────────────────────────────────────────────────────────────────────────

import type * as React from "react"

import { logoDevUrl } from "@/lib/logo-dev"
import { stockPortraitUrl } from "@/lib/stock-portrait"
import {
  LIBRARY_ENTRY_PATH,
  LIBRARY_HUB_FIND_PATH,
  LIBRARY_ALL_PATH,
} from "@/lib/library-nav"
import { productSlug, type Product } from "@/stores/app-store"
import { customProductSlugFromSuffix } from "@/lib/product-routing"
import { primaryNavLinksForSlug } from "@exxatdesignux/product-framework"

// ── Types ─────────────────────────────────────────────────────────────────────

/** Flat sidebar link — primary + Documents + utilities groups (DS shell; not legacy screenshot styling) */
export interface NavLinkItem {
  key: string
  title: string
  url: string
  icon: React.ReactNode
  iconActive?: React.ReactNode
  /** Optional child links — renders as a collapsible sub-menu */
  children?: NavLinkItem[]
  /** Optional inline badge — count (number) or label text (string).
   *  Special string values get distinct colors:
   *  "New" → green,  "Beta" → amber,  other strings → brand/primary  */
  badge?: number | string
  /**
   * When this collapsible section uses `SecondaryPanel`, set the panel id so
   * child links can reopen the panel on click while already on the same route
   * (Next.js Link does not navigate on same href).
   */
  secondaryPanel?: string
  /**
   * When several children share the same `url` (hub route), only this child’s
   * key receives `data-active` for that pathname — otherwise every sub-row
   * looks selected (same issue as duplicate `href` in any nav).
   */
  primaryHubChildKey?: string
}

// ── Team / scope switcher mock data ──────────────────────────────────────────
//
// The sidebar header picker (TeamSwitcher) is **product-aware** per the
// product-context rule (`.cursor/rules/exxat-product-context.mdc`):
//
//   • Prism / One — Schools / Custom → school > program
//   • One — Sites                    → site  > location
//
// Two parallel mock-data shapes live here — one for each scope hierarchy —
// so the switcher can render either flavor without forking the chrome.

// School + Program (school-side scope) ────────────────────────────────────────

export interface NavProgram { id: string; name: string }
export interface NavSchool {
  id: string
  name: string
  /** URL of school logo — used as the avatar image */
  logo: string
  /** Two-letter abbreviation shown as AvatarFallback */
  initials: string
  programs: NavProgram[]
}

export const NAV_SCHOOLS: NavSchool[] = [
  {
    id: "jhu",
    name: "Johns Hopkins University",
    logo: logoDevUrl("jhu.edu"),
    initials: "JH",
    programs: [
      { id: "som", name: "School of Medicine" },
      { id: "son", name: "School of Nursing" },
      { id: "sph", name: "Bloomberg School of Public Health" },
    ],
  },
  {
    id: "mayo",
    name: "Mayo Clinic Alix School of Medicine",
    logo: logoDevUrl("mayoclinic.org"),
    initials: "MC",
    programs: [
      { id: "md", name: "Doctor of Medicine" },
      { id: "bms", name: "Biomedical Sciences" },
    ],
  },
]

export const NAV_SCHOOL_DEFAULT = NAV_SCHOOLS[0]
export const NAV_PROGRAM_DEFAULT = NAV_SCHOOLS[0].programs[0]

// Site + Location (partner-side scope, Exxat One — Sites) ─────────────────────

export interface NavLocation { id: string; name: string }
export interface NavSite {
  id: string
  name: string
  /** URL of site logo — used as the avatar image */
  logo: string
  /** Two-letter abbreviation shown as AvatarFallback */
  initials: string
  locations: NavLocation[]
}

export const NAV_SITES: NavSite[] = [
  {
    id: "mgb",
    name: "Mass General Brigham",
    logo: logoDevUrl("massgeneralbrigham.org"),
    initials: "MG",
    locations: [
      { id: "mgh-main",   name: "Mass General — Boston" },
      { id: "bwh",        name: "Brigham and Women's — Boston" },
      { id: "mgh-salem",  name: "Salem Hospital" },
    ],
  },
  {
    id: "ccf",
    name: "Cleveland Clinic",
    logo: logoDevUrl("clevelandclinic.org"),
    initials: "CC",
    locations: [
      { id: "ccf-main",   name: "Main Campus — Cleveland" },
      { id: "ccf-fairview", name: "Fairview Hospital" },
    ],
  },
]

export const NAV_SITE_DEFAULT = NAV_SITES[0]
export const NAV_LOCATION_DEFAULT = NAV_SITES[0].locations[0]

// ── Primary navigation ────────────────────────────────────────────────────────
//
// The primary nav is **product-keyed** (`NAV_BY_PRODUCT[productId]`) per Rule
// 5 of the multi-product routing pattern
// (`apps/web/docs/multi-product-routing-pattern.md`). `AppSidebar` reads
// `useProduct().product` and renders the matching tree. Switching products
// in the sidebar swaps the entire primary nav.
//
// Product-owned hubs live under the active product root. Shell-global routes
// like Help remain at the workspace root.

const dashboardItem = (slug: string): NavLinkItem => ({
  key: "dashboard",
  title: "Dashboard",
  url: `/${slug}/dashboard`,
  icon:       <i className="fa-light fa-grid-2" aria-hidden="true" />,
  iconActive: <i className="fa-solid fa-grid-2" aria-hidden="true" />,
})

const libraryItem = (slug: string): NavLinkItem => ({
  key: "library",
  title: "Library",
  url: `/${slug}${LIBRARY_ENTRY_PATH}`,
  icon:       <i className="fa-light fa-books" aria-hidden="true" />,
  iconActive: <i className="fa-solid fa-books" aria-hidden="true" />,
  secondaryPanel: "library",
  primaryHubChildKey: "library-hub",
  children: [
    {
      key: "library-hub",
      title: "Library home",
      url: `/${slug}${LIBRARY_ENTRY_PATH}`,
      icon:       <i className="fa-light fa-sparkles" aria-hidden="true" />,
      iconActive: <i className="fa-solid fa-sparkles" aria-hidden="true" />,
    },
    {
      key: "library-search",
      title: "Search",
      url: `/${slug}${LIBRARY_HUB_FIND_PATH}`,
      icon:       <i className="fa-light fa-magnifying-glass" aria-hidden="true" />,
      iconActive: <i className="fa-solid fa-magnifying-glass" aria-hidden="true" />,
    },
    {
      key: "library-all",
      title: "All items",
      url: `/${slug}${LIBRARY_ALL_PATH}`,
      icon:       <i className="fa-light fa-table-list" aria-hidden="true" />,
      iconActive: <i className="fa-solid fa-table-list" aria-hidden="true" />,
    },
  ],
})

/**
 * Prism + Custom (which inherits Prism's IA structurally per
 * `exxat-product-routing.mdc` Rule 5) get the full school-side primary nav:
 * Dashboard + Library. Other products are placeholders today and only show
 * Dashboard until their own IA ships.
 */
function buildSchoolFamilyPrimary(slug: string): NavLinkItem[] {
  return [dashboardItem(slug), libraryItem(slug)]
}

function buildPlaceholderPrimary(slug: string): NavLinkItem[] {
  return [dashboardItem(slug)]
}

export const NAV_BY_PRODUCT: Record<Product, NavLinkItem[]> = {
  "exxat-prism":       buildSchoolFamilyPrimary(productSlug("exxat-prism")),
  // One — Schools is school-side too (same scope hierarchy as Prism), but
  // its IA is a separate design effort. Until then it's Dashboard-only so
  // we don't promise hubs that aren't there yet.
  "exxat-one-schools": buildPlaceholderPrimary(productSlug("exxat-one-schools")),
  // One — Sites lives in a different scope hierarchy (Brand > Site >
  // Location). Its IA + `SiteSwitcher` ship together in a future PR.
  "exxat-one-sites":   buildPlaceholderPrimary(productSlug("exxat-one-sites")),
  // Custom is "Prism with rebranding": same hubs, different brand chrome.
  // It owns its own URL root (`/custom`) so the sidebar links don't flicker
  // across products mid-flight — calls the same factory as Prism with its
  // own slug instead of sharing the array reference.
  "exxat-custom":      buildSchoolFamilyPrimary("custom"),
}

/**
 * Primary nav for the active product — custom slots use their suffix slug
 * (`/assessment/dashboard`, not `/custom/dashboard`).
 */
export function getPrimaryNavForProduct(
  product: Product,
  customProducts: { suffix: string }[],
  activeCustomIndex: number,
): NavLinkItem[] {
  if (product === "exxat-custom") {
    const brand = customProducts[activeCustomIndex] ?? customProducts[0]
    const slug = brand?.suffix?.trim()
      ? customProductSlugFromSuffix(brand.suffix)
      : "custom"
    const registeredNav = primaryNavLinksForSlug(slug)
    if (registeredNav?.length) {
      return registeredNav as NavLinkItem[]
    }
    return buildSchoolFamilyPrimary(slug)
  }
  return NAV_BY_PRODUCT[product]
}

/**
 * @deprecated Prefer `NAV_BY_PRODUCT[product]` with the active product from
 * `useProduct()`. This export remains for any callsite that hasn't migrated
 * yet — it points at Prism's primary nav (the only product whose IA is
 * fully built today). Will be removed once all callers move to the
 * product-keyed registry.
 */
export const NAV_PRIMARY: NavLinkItem[] = NAV_BY_PRODUCT["exxat-prism"]

// ── Documents section ───────────────────────────────────────────────────────

export const NAV_DOCUMENTS_LABEL = "Resources"

export const NAV_DOCUMENTS: NavLinkItem[] = [
  {
    key: "tokens",
    title: "Tokens & themes",
    /** Dedicated route (was previously /settings#appearance — split out so the nav target
     *  is bookmarkable and there's no active-state collision with Settings). */
    url: "/tokens-themes",
    icon:       <i className="fa-light fa-palette" aria-hidden="true" />,
    iconActive: <i className="fa-solid fa-palette" aria-hidden="true" />,
    /** Opens the `tokens` secondary panel — categories live in the rail, not in view tabs.
     *  `useAutoPanel("tokens")` inside the hub also collapses the main sidebar
     *  (`secondary-panel.tsx#openPanel`) per the Library library pattern. */
    secondaryPanel: "tokens",
  },
  {
    key: "columns",
    title: "Column types",
    /** DataTable column-pattern showcase — every cell renderer the DS supports. */
    url: "/columns",
    icon:       <i className="fa-light fa-table-columns" aria-hidden="true" />,
    iconActive: <i className="fa-solid fa-table-columns" aria-hidden="true" />,
  },
  {
    key: "more",
    title: "More",
    /** Same page as Get Help — disambiguate via `#more`. */
    url: "/help#more",
    icon:       <i className="fa-light fa-ellipsis" aria-hidden="true" />,
    iconActive: <i className="fa-solid fa-ellipsis" aria-hidden="true" />,
  },
]

// ── Quick actions (above primary nav) + bottom utilities ───────────────────────

/** `opensCommandMenu` wires ⌘K instead of `url`. */
export interface NavSecondaryItem {
  key: string
  title: string
  url: string
  icon: React.ReactNode
  /** Solid / filled variant when the route is active — matches primary `NavLinkItem` rows. */
  iconActive?: React.ReactNode
  /** Item opens the global ⌘K command menu instead of navigating. */
  opensCommandMenu?: boolean
  /** Item toggles the Ask Leo sidebar (⌘⌥K) instead of navigating. */
  opensAskLeo?: boolean
}

/** Search + Notifications — rendered above Dashboard in the sidebar. */
export const NAV_QUICK_ACTIONS: NavSecondaryItem[] = [
  {
    key: "ask-leo",
    title: "Ask Leo",
    url: "#",
    icon: <i className="fa-duotone fa-solid fa-star-christmas text-brand" aria-hidden="true" />,
    opensAskLeo: true,
  },
  {
    key: "command-menu",
    title: "Search",
    url: "#",
    icon: <i className="fa-light fa-magnifying-glass" aria-hidden="true" />,
    opensCommandMenu: true,
  },
  {
    key: "notifications",
    title: "Notifications",
    url: "#",
    icon: <i className="fa-light fa-bell" aria-hidden="true" />,
  },
]

export const NAV_SECONDARY: NavSecondaryItem[] = [
    {
    key: "settings",
    title: "Settings",
    url: "/settings/organization",
    icon:       <i className="fa-light fa-gear" aria-hidden="true" />,
    iconActive: <i className="fa-solid fa-gear" aria-hidden="true" />,
  },
  {
    key: "help",
    title: "Get Help",
    url: "/help",
    icon:       <i className="fa-light fa-circle-question" aria-hidden="true" />,
    iconActive: <i className="fa-solid fa-circle-question" aria-hidden="true" />,
  },
]

// ── User ──────────────────────────────────────────────────────────────────────

export const NAV_USER = {
  name:  "Alex Morgan",
  email: "alex.morgan@example.com",
  /** Stock portrait (randomuser.me); stable for this seed */
  avatar: stockPortraitUrl("exxat-nav-user-alex-morgan"),
}
