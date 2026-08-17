/**
 * Design OS primary nav — the internal DS workspace: catalog, library reference
 * hub, tokens, column catalog.
 *
 * Self-contained on purpose. `lib/mock/navigation.tsx` is app-owned in consumer
 * apps, so `exxat-ui upgrade` may never overwrite it; this module is
 * package-owned and auto-ported instead, and the consumer registers it with one
 * line. See `packages/ui/bin/upgrade-design-os-wiring.mjs`. That also means it
 * must not import runtime values from `navigation.tsx` (types only).
 */
import { DESIGN_SYSTEM_PRIMARY_NAV_LABEL } from "@/lib/design-system/hub-label"
import {
  LIBRARY_ALL_PATH,
  LIBRARY_ENTRY_PATH,
  LIBRARY_HUB_FIND_PATH,
} from "@/lib/library-nav"
import type { NavLinkItem, NavPrimaryLayout } from "@/lib/mock/navigation"

function dashboardItem(slug: string): NavLinkItem {
  return {
    key: "dashboard",
    title: "Dashboard",
    url: `/${slug}/dashboard`,
    icon:       <i className="fa-light fa-grid-2" aria-hidden="true" />,
    iconActive: <i className="fa-solid fa-grid-2" aria-hidden="true" />,
  }
}

function designSystemItem(slug: string): NavLinkItem {
  const designSystemRoot = `/${slug}/design-system`
  return {
    key: "design-system",
    title: DESIGN_SYSTEM_PRIMARY_NAV_LABEL,
    url: designSystemRoot,
    icon:       <i className="fa-light fa-book" aria-hidden="true" />,
    iconActive: <i className="fa-solid fa-book" aria-hidden="true" />,
    drillIn: {
      sectionTitle: DESIGN_SYSTEM_PRIMARY_NAV_LABEL,
      sectionRouteRoot: designSystemRoot,
      items: [],
    },
  }
}

function libraryItem(slug: string): NavLinkItem {
  return {
    key: "library",
    title: "Question bank",
    url: `/${slug}${LIBRARY_ENTRY_PATH}`,
    icon:       <i className="fa-light fa-books" aria-hidden="true" />,
    iconActive: <i className="fa-solid fa-books" aria-hidden="true" />,
    secondaryPanel: "library",
    /** List hub (`/library/all`) — not discovery home (`/library`). */
    primaryHubChildKey: "library-all",
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
        title: "Library",
        url: `/${slug}${LIBRARY_ALL_PATH}`,
        icon:       <i className="fa-light fa-table-list" aria-hidden="true" />,
        iconActive: <i className="fa-solid fa-table-list" aria-hidden="true" />,
      },
    ],
  }
}

function columnsItem(slug: string): NavLinkItem {
  return {
    key: "columns",
    title: "Column types",
    url: `/${slug}/columns`,
    icon:       <i className="fa-light fa-table-columns" aria-hidden="true" />,
    iconActive: <i className="fa-solid fa-table-columns" aria-hidden="true" />,
  }
}

/** Token category drill-in rows — scoped under `/${productSlug}/tokens-themes`. */
export function buildTokensDrillInItems(basePath: string): NavLinkItem[] {
  const root = basePath.replace(/\/$/, "")
  const tokensBase = root ? `${root}/tokens-themes` : "/tokens-themes"
  return [
    {
      key: "tokens-all",
      title: "All tokens",
      url: tokensBase,
      icon:       <i className="fa-light fa-grid-2" aria-hidden="true" />,
      iconActive: <i className="fa-solid fa-grid-2" aria-hidden="true" />,
    },
    {
      key: "tokens-color",
      title: "Colors",
      url: `${tokensBase}?category=color`,
      icon:       <i className="fa-light fa-palette" aria-hidden="true" />,
      iconActive: <i className="fa-solid fa-palette" aria-hidden="true" />,
    },
    {
      key: "tokens-gradient",
      title: "Gradients",
      url: `${tokensBase}?category=gradient`,
      icon:       <i className="fa-light fa-circle-half-stroke" aria-hidden="true" />,
      iconActive: <i className="fa-solid fa-circle-half-stroke" aria-hidden="true" />,
    },
    {
      key: "tokens-radius",
      title: "Radius",
      url: `${tokensBase}?category=radius`,
      icon:       <i className="fa-light fa-rectangle-vertical" aria-hidden="true" />,
      iconActive: <i className="fa-solid fa-rectangle-vertical" aria-hidden="true" />,
    },
    {
      key: "tokens-size",
      title: "Size",
      url: `${tokensBase}?category=size`,
      icon:       <i className="fa-light fa-ruler-horizontal" aria-hidden="true" />,
      iconActive: <i className="fa-solid fa-ruler-horizontal" aria-hidden="true" />,
    },
    {
      key: "tokens-shadow",
      title: "Shadow",
      url: `${tokensBase}?category=shadow`,
      icon:       <i className="fa-light fa-clone" aria-hidden="true" />,
      iconActive: <i className="fa-solid fa-clone" aria-hidden="true" />,
    },
    {
      key: "tokens-typography",
      title: "Typography",
      url: `${tokensBase}?category=typography`,
      icon:       <i className="fa-light fa-text-size" aria-hidden="true" />,
      iconActive: <i className="fa-solid fa-text-size" aria-hidden="true" />,
    },
    {
      key: "tokens-transition",
      title: "Motion",
      url: `${tokensBase}?category=transition`,
      icon:       <i className="fa-light fa-wave-sine" aria-hidden="true" />,
      iconActive: <i className="fa-solid fa-wave-sine" aria-hidden="true" />,
    },
    {
      key: "tokens-alias",
      title: "Aliases",
      url: `${tokensBase}?category=alias`,
      icon:       <i className="fa-light fa-link" aria-hidden="true" />,
      iconActive: <i className="fa-solid fa-link" aria-hidden="true" />,
    },
    {
      key: "tokens-other",
      title: "Other",
      url: `${tokensBase}?category=other`,
      icon:       <i className="fa-light fa-hashtag" aria-hidden="true" />,
      iconActive: <i className="fa-solid fa-hashtag" aria-hidden="true" />,
    },
  ]
}

export function buildDesignOsNavLayout(slug: string): NavPrimaryLayout {
  const tokensRoot = `/${slug}/tokens-themes`
  return {
    preamble: [
      dashboardItem(slug),
      designSystemItem(slug),
      libraryItem(slug),
      {
        key: "tokens",
        title: "Tokens & themes",
        url: tokensRoot,
        icon:       <i className="fa-light fa-palette" aria-hidden="true" />,
        iconActive: <i className="fa-solid fa-palette" aria-hidden="true" />,
        drillIn: {
          sectionTitle: "Tokens & themes",
          sectionRouteRoot: tokensRoot,
          items: buildTokensDrillInItems(`/${slug}`),
        },
      },
      columnsItem(slug),
    ],
    sections: [],
  }
}
