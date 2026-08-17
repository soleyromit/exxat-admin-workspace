/**
 * Inventory for the products home (`/home`) and the per-product marketing
 * pages under it.
 *
 * Deliberately not built on `expandSwitcherProducts`: the switcher only lists
 * products this workspace already uses, and the home's whole job is to also
 * show the ones it does not. The two lists overlap but answer different
 * questions, so they stay separate rather than one bending to fit the other.
 */

import type { Product } from "@/contexts/product-context"
import {
  PRODUCT_CATALOG,
  catalogStageRank,
  isProductEntitled,
  type ProductCatalogEntry,
  type ProductStage,
  type ProductWhatsNewItem,
} from "@/lib/mock/product-catalog"
import {
  customProductBrandConfig,
  getProductBrand,
  productBrandLabel,
} from "@/lib/product-brand"
import { productGlyph } from "@/lib/product-glyph"
import { isProductRefHidden, type ProductRef } from "@/lib/product-ref"
import { customSuffixCollidesWithBuiltInProduct } from "@/lib/product-routing"
import { isListedCustomProduct, type CustomProductBrand } from "@/stores/app-store"
import { isWorkspaceAdmin, workspaceRole } from "@/lib/workspace-role"

export interface ProductHomeCard {
  product: Product
  /** Present only for custom tenant products. */
  customIndex?: number
  label: string
  tagline: string
  scopeLabel: string
  /** Font Awesome class for the product's glyph. See `ProductCatalogEntry.icon`. */
  icon: string
  /** Whether to offer a school/program picker before entering. */
  scoped: boolean
  entitled: boolean
  /** Release qualifier — `new` or `beta`. Absent for a plain GA product. */
  stage?: ProductStage
  /**
   * Recent changes to this product worth flagging, already narrowed to what this
   * session's role should see (`visibleWhatsNew`). See
   * `ProductCatalogEntry.whatsNew` for the authored list.
   */
  whatsNew?: ProductWhatsNewItem[]
  /**
   * This product's own brand colour as a CSS colour string, independent of the
   * active theme — the home shows four products at once, so each card has to
   * carry its own identity rather than inherit whichever theme is loaded.
   */
  brandColor: string
  /** Absent for custom products, which have no marketing content. */
  entry?: ProductCatalogEntry
  /** Stable URL segment for the marketing page. */
  slug: string
  /**
   * Set when the app has no marketing page and the card is only ever a door
   * (Administrator). Cards that carry it open this path directly instead of
   * routing the card surface to `/home/:slug` and the Open action into the
   * product — there is nothing to read about a console you already administer.
   */
  href?: string
}

/**
 * `/home` and its marketing pages.
 *
 * These are shell routes with no product selected, so the shell strips the
 * primary sidebar and most of the utility bar there — every control it hides
 * either acts on a product (search, settings, Ask Leo, scope) or on the
 * sidebar that is not rendered.
 */
export function isProductsHomePath(pathname: string): boolean {
  return pathname === "/home" || pathname.startsWith("/home/")
}

/** URL segment for a product's marketing page under `/home`. */
export function productHomeSlug(product: Product, customIndex?: number): string {
  if (product === "exxat-custom") return `custom-${customIndex ?? 0}`
  return product.replace(/^exxat-/, "")
}

/**
 * `config.label` is only set for brands whose name cannot be composed — Exxat
 * One's two entries. Prism and Design OS leave it empty and expect
 * `productBrandLabel` to join prefix and suffix, so reading `.label` directly
 * renders the raw product id.
 */
export function productLabel(product: Product): string {
  const brand = getProductBrand(product)
  return brand ? productBrandLabel(brand) : product
}

function productBrandColor(product: Product): string {
  return getProductBrand(product)?.brandColor ?? "var(--brand-color)"
}

function customCards(
  customProducts: CustomProductBrand[],
  hiddenProducts: ProductRef[],
): ProductHomeCard[] {
  return customProducts.flatMap((brand, customIndex) => {
    if (!isListedCustomProduct(brand)) return []
    if (customSuffixCollidesWithBuiltInProduct(brand.suffix)) return []
    const ref: ProductRef = { product: "exxat-custom", customIndex }
    if (isProductRefHidden(ref, hiddenProducts)) return []

    return [
      {
        product: "exxat-custom" as Product,
        customIndex,
        label: productBrandLabel(customProductBrandConfig(brand)),
        brandColor: customProductBrandConfig(brand).brandColor,
        tagline: "Your workspace's own product, built on Prism",
        scopeLabel: "School > Program",
        icon: productGlyph("exxat-custom"),
        scoped: true,
        entitled: true,
        slug: productHomeSlug("exxat-custom", customIndex),
      },
    ]
  })
}

/**
 * Products the home does not list, whatever their entitlement.
 *
 * Design OS is the design system itself — a tool for the people building Exxat,
 * not a product a school is licensed to work in. On the home it sat beside
 * Clinical Education as if a coordinator might pick it to do their job. It
 * lives in the profile menu instead, next to the other account-level surfaces.
 *
 * People / Courses / Personnel are Directory destinations — shared records
 * rather than products — and keep their own row on the home.
 *
 * Administrator used to sit here on the argument that it configures the products
 * rather than being one. It is now listed, by role, via `adminCard` below: every
 * comparable suite (Okta, Salesforce, Microsoft 365) ships the admin console as
 * a tile in the launcher, and an admin looking for it was the one person the
 * launcher failed. The "for one person in the workspace" half of that argument
 * is answered by the role gate rather than by hiding it from everyone.
 */
const PRODUCTS_OFF_HOME: readonly Product[] = [
  "exxat-design-os",
  "exxat-admin",
  "exxat-people",
  "exxat-courses",
  "exxat-personnel",
  // Exxat One, site side. Off the switcher and off the home, so the one Exxat One
  // a workspace sees is the school's. Its catalogue entry stays for lookups from
  // its own routes, which still resolve.
  "exxat-one-sites",
]

/** Where the Administrator console opens. Its overview, not a product dashboard. */
const ADMIN_HREF = "/admin"

/**
 * Administrator as an app card — built by hand rather than read from
 * `PRODUCT_CATALOG`, which it has never been part of: there is no plan that
 * includes or excludes it and no marketing page to send anyone to.
 *
 * One gate, `isWorkspaceAdmin`, which folds in what the sign-in said about this
 * session. The switcher row and the `/admin` route ask the same question, so a
 * tile can never offer a console the route would turn away.
 */
function adminCard(): ProductHomeCard[] {
  if (!isWorkspaceAdmin()) return []

  return [
    {
      product: "exxat-admin" as Product,
      label: "Administrator",
      // Neutral rather than the active theme's brand: the tile mapping keeps the
      // input's hue and chroma, so a brand colour here would draw the console as
      // a Prism sibling in the same pink. Grey is the same argument
      // `NEUTRAL_TILE_CLASS` makes for admin rows in the switcher.
      brandColor: "var(--muted-foreground)",
      tagline: "Workspace configuration, imports, and feeds",
      scopeLabel: "Workspace",
      icon: productGlyph("exxat-admin"),
      scoped: false,
      entitled: true,
      slug: "admin",
      href: ADMIN_HREF,
    },
  ]
}

function builtInCards(hiddenProducts: ProductRef[]): ProductHomeCard[] {
  return PRODUCT_CATALOG.flatMap(entry => {
    if (PRODUCTS_OFF_HOME.includes(entry.product)) return []

    const ref: ProductRef = { product: entry.product }
    // A hidden product is hidden everywhere. The builder took it off the
    // switcher on purpose, so the home must not quietly market it back.
    if (isProductRefHidden(ref, hiddenProducts)) return []

    return [
      {
        product: entry.product,
        label: productLabel(entry.product),
        brandColor: productBrandColor(entry.product),
        tagline: entry.tagline,
        scopeLabel: entry.scopeLabel,
        icon: productGlyph(entry.product),
        scoped: entry.scoped,
        entitled: isProductEntitled(entry.product),
        stage: entry.stage,
        whatsNew: visibleWhatsNew(entry.whatsNew),
        entry,
        slug: productHomeSlug(entry.product),
      },
    ]
  })
}

/**
 * The release notes this session should be shown, out of a product's list.
 *
 * One filter for every surface that shows a note. The tile badge, the `/home`
 * digest, and both modes of the utility bar button read the same product list, so
 * a note filtered in one place and not another would put a count on a button that
 * opens a panel without it.
 *
 * Untagged notes reach everyone (see `WhatsNewAudience`), which keeps a
 * cross-product change like Ask Leo on one line instead of duplicated per role.
 */
export function visibleWhatsNew(
  items: readonly ProductWhatsNewItem[] | undefined,
): ProductWhatsNewItem[] {
  if (!items) return []
  const student = workspaceRole() === "student"
  return items.filter(item => {
    if (!item.audience) return true
    return item.audience === (student ? "student" : "staff")
  })
}

/**
 * Seen-list id for one update.
 *
 * Four surfaces show the same release note (the tile badge, the `/home` digest,
 * and the utility bar button in both its product and workspace modes) and all
 * four read one dismissal list, so they have to spell the id identically or a
 * note dismissed in one place stays unread in another. It used to be written out
 * at each call site, which is three chances to disagree.
 *
 * Keyed on the title, not just the product, so a later release re-surfaces
 * instead of inheriting the dismissal of the change it replaced.
 */
export function whatsNewUpdateId(slug: string, title: string): string {
  return `${slug}:${title}`
}

/** One release note, paired with the product it belongs to. */
export interface WhatsNewUpdate {
  id: string
  card: ProductHomeCard
  item: ProductWhatsNewItem
}

/**
 * Every update across the given cards, flattened in catalog order.
 *
 * Catalog order rather than by date, because `ProductWhatsNewItem` carries no
 * date: each product lists its own notes newest first, and that is the only
 * ordering the data actually supports. Callers filter by seen and cap the length
 * themselves, since the digest wants all the unread ones and the popover wants a
 * short recent list.
 */
export function collectWhatsNewUpdates(
  cards: ReadonlyArray<ProductHomeCard>,
): WhatsNewUpdate[] {
  return cards.flatMap(card =>
    (card.whatsNew ?? []).map(item => ({
      id: whatsNewUpdateId(card.slug, item.title),
      card,
      item,
    })),
  )
}

export interface ProductHomeInventory {
  /** Products this workspace can open right now, custom slots last. */
  owned: ProductHomeCard[]
  /** Everything else Exxat offers, betas first — the marketing half of the home. */
  available: ProductHomeCard[]
}

export function buildProductHomeInventory(
  customProducts: CustomProductBrand[],
  hiddenProducts: ProductRef[],
): ProductHomeInventory {
  const builtIn = builtInCards(hiddenProducts)
  return {
    // Administrator last: the products you work in come before the console you
    // configure them from, however often you open it.
    owned: [
      ...builtIn.filter(card => card.entitled),
      ...customCards(customProducts, hiddenProducts),
      ...adminCard(),
    ],
    // Betas lead, the rest keep catalog order (`catalogStageRank`). The featured
    // banner is unaffected: it names its product and only falls back to the first
    // card if that one is owned or hidden.
    available: builtIn
      .filter(card => !card.entitled)
      .sort((a, b) => catalogStageRank(a.stage) - catalogStageRank(b.stage)),
  }
}

export function findProductHomeCard(
  slug: string,
  customProducts: CustomProductBrand[],
  hiddenProducts: ProductRef[],
): ProductHomeCard | undefined {
  const { owned, available } = buildProductHomeInventory(customProducts, hiddenProducts)
  // `href` cards have no marketing page, so `/home/admin` must stay a miss
  // rather than rendering a pitch with no catalog entry behind it.
  return [...owned, ...available].find(card => !card.href && card.slug === slug)
}

/**
 * Marketing-page peers for "Works well with" — curated `pairsWith` on the
 * catalog entry, resolved to home cards (owned or available), max three.
 */
export function pairedProductHomeCards(
  card: ProductHomeCard,
  customProducts: CustomProductBrand[],
  hiddenProducts: ProductRef[],
): ProductHomeCard[] {
  const peers = card.entry?.pairsWith
  if (!peers?.length) return []

  const { owned, available } = buildProductHomeInventory(customProducts, hiddenProducts)
  const byProduct = new Map(
    [...owned, ...available]
      .filter(item => !item.href && item.product !== card.product)
      .map(item => [item.product, item] as const),
  )

  return peers
    .map(product => byProduct.get(product))
    .filter((item): item is ProductHomeCard => Boolean(item))
    .slice(0, 3)
}
