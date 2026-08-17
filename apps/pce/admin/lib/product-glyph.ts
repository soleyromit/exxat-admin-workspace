/**
 * One Font Awesome glyph per product.
 *
 * Every surface that lists products used to draw the Exxat mark for each of
 * them. It is the correct logo and it differentiates nothing: nine identical
 * `E`s in the switcher mean the user has to read every label to tell the rows
 * apart, and on the home the cover art was the same picture nine times.
 *
 * So the glyph names the *job* the product does. The Exxat mark still owns the
 * places where there is one product and it is the brand talking: the sidebar
 * lock-up, the utility-bar trigger, the login screen.
 *
 * These are the running-text weight of the same ideas the drawn marks carry
 * (`components/product-app-mark.tsx`), which is what fills the tile. Keep the two
 * in step: a product whose mark is a shield should not have a document here. This
 * map is still what every tenant product and every non-tile spot falls back to.
 *
 * Identity, not marketing copy — which is why this is here rather than in
 * `lib/mock/product-catalog.ts`. The switcher needs it and knows nothing about
 * taglines or screenshots.
 */

import type * as React from "react"

import type { Product } from "@/contexts/product-context"

const PRODUCT_GLYPH: Record<Product, string> = {
  // Solid, and the only product glyph that is: Clinical Education has no drawn
  // mark, so this glyph sits in a brand tile between marks that are solid fills,
  // and `fa-light` next to them reads as a row that failed to load. The rest of
  // this table is light because it paints neutral tiles and menu rows, where the
  // weight matches the text beside it.
  "exxat-prism": "fa-solid fa-stethoscope",
  // The school looking out at partners, and the partner looking back.
  "exxat-one-schools": "fa-light fa-handshake",
  "exxat-one-sites": "fa-light fa-hospital",
  "exxat-curriculum-mapping": "fa-light fa-book-open",
  "exxat-compliance": "fa-light fa-shield-check",
  // Bars, matching the drawn mark. They used to be a bubble to stay clear of
  // Student & Program Success, which is a trend line now and no longer collides.
  "exxat-surveys": "fa-light fa-chart-simple",
  "exxat-exam-management": "fa-light fa-clipboard-check",
  "exxat-accreditation": "fa-light fa-award",
  "exxat-student-success": "fa-light fa-chart-line-up",
  "exxat-design-os": "fa-light fa-swatchbook",
  // A gear, not a shield: Compliance is the shield, and the console that
  // configures a workspace is not the product that clears a student.
  "exxat-admin": "fa-light fa-gear",
  "exxat-people": "fa-light fa-users",
  "exxat-courses": "fa-light fa-books",
  "exxat-personnel": "fa-light fa-user-nurse",
  // Custom tenant products inherit Prism's IA wholesale, so they inherit its
  // glyph too, solid weight included: both land in a brand tile, and the same
  // icon at two weights across two rows reads as a mistake. Their own brand
  // colour is what tells them apart.
  "exxat-custom": "fa-solid fa-stethoscope",
}

export function productGlyph(product: Product): string {
  return PRODUCT_GLYPH[product] ?? "fa-light fa-grid-2"
}

/**
 * The tinted square a product glyph sits in.
 *
 * A bare glyph on a menu row is the same weight as the text beside it, so a
 * list of them reads as one grey column and the eye has nothing to land on.
 * Filling a square behind it gives each row an anchor at a glance, before any
 * of the labels are read.
 *
 * ## Why this only hands over a custom property
 *
 * The tile is the brand at full chroma with a white glyph on it, and only its
 * lightness is decided here rather than by the palette. Two earlier versions
 * are worth knowing about. The first was the brand at 8–20% alpha with the
 * glyph in the raw brand colour on top, a colour against a wash of itself,
 * which measures 2.3:1 to 3.0:1 — under WCAG 1.4.11's 3:1 floor for a
 * meaningful graphic, in both themes. axe never caught it, because a Font
 * Awesome glyph is drawn from a pseudo-element and `color-contrast` skips
 * those; `scripts/icon-contrast-probe.mjs` is what measures it. The second
 * fixed the ratio by pinning tile and glyph to opposite ends of the lightness
 * scale, pale tile and dark glyph, which passes and still spends the brand on a
 * tint so faint that nine rows read as one grey column.
 *
 * Pinning the tile mid-scale instead keeps both: the hue and chroma are the
 * brand's, undiluted, and white on them clears the floor by a margin for every
 * brand in the registry and for anything Settings → Appearance will accept.
 * Rules live in `globals.css` because the tile needs a `.dark` variant and an
 * inline style cannot have one; this function only says which brand.
 *
 * Opaque, not translucent. A wash composites with whatever is behind it, so the
 * same tile measured differently on a card, a menu, and a hover row — three
 * answers to a question that should have one.
 *
 * Shared by the switcher rows and the home page tiles so the same product wears
 * the same mark in both, and lives here rather than beside either of them
 * because the home page is not part of the shell the starter ships.
 */
export function productTileStyle(brandColor: string): React.CSSProperties {
  return { "--product-brand": brandColor } as React.CSSProperties
}

const TILE_LAYOUT = "inline-flex shrink-0 items-center justify-center"

export type ProductTileSize = "md" | "lg"

/**
 * The tile's footprint and the art that goes in it, one entry per size.
 *
 * Kept as a pair because the two cannot be chosen apart. A caller that enlarged
 * the tile alone would hand back the problem this table exists to record: at 16 in
 * a 28 tile the mark covered under half of it and read as a coloured chip with
 * something in the middle rather than an app icon, and the outlined marks suffered
 * worst, since a stroke authored at 2.7 on the 24 grid landed at 1.8px. Both sizes
 * hold the art at roughly 70% of the tile, which leaves the ~5 of clear space the
 * corners need: the tile is round and the art is not, so a mark that reaches the
 * edge at the midpoints collides with the curve at the diagonals.
 *
 * `mark` and `glyph` differ because the two kinds of art are measured differently,
 * an svg by its box and a font glyph by its font-size, and the glyph runs a little
 * smaller because a font carries its own padding inside the em box.
 *
 * Both sizes are round, which is the Exxat mark's own shape: the `E` badge in the
 * trigger above these rows is a circle, and every tile under it now reads as the
 * same family of object with a different mark inside. That does put a product tile
 * in the same silhouette as `AvatarInitials` and the school crest, which is the cost
 * — colour and position carry the difference instead, since a person is grey and
 * appears beside a name while a product is brand-coloured and leads a row.
 *
 * - **md** — the shell's tile: switcher rows, Your App, spotlight rows.
 * - **lg** — the More from Exxat card, where the mark heads a two-line copy block
 *   in its own column and 32 read as an afterthought against it.
 */
export const PRODUCT_TILE_SIZES: Record<
  ProductTileSize,
  { footprint: string; mark: string; glyph: string }
> = {
  md: { footprint: "size-8 rounded-full", mark: "size-[1.375rem]", glyph: "text-[1.0625rem]" },
  lg: { footprint: "size-10 rounded-full", mark: "size-7", glyph: "text-[1.3125rem]" },
}

const TILE_FOOTPRINT = PRODUCT_TILE_SIZES.md.footprint

/**
 * Layout + surface half of {@link productTileStyle}.
 *
 * No ring. It was here to give the tile an edge when the brand washed out
 * against a white card, and a tile pinned mid-lightness has its own.
 */
export const PRODUCT_TILE_CLASS = `product-tile ${TILE_LAYOUT} ${TILE_FOOTPRINT}` as const

/** The glyph inside the tile. Reads `--product-brand` from the tile above it. */
export const PRODUCT_TILE_GLYPH_CLASS = "product-tile-glyph" as const

/** The art inside a `md` tile. See {@link PRODUCT_TILE_SIZES} for why they pair. */
export const TILE_MARK_SIZE_CLASS = PRODUCT_TILE_SIZES.md.mark
export const TILE_GLYPH_SIZE_CLASS = PRODUCT_TILE_SIZES.md.glyph

/**
 * Same circle, no brand.
 *
 * For rows that are not a product — record hubs, admin — where a brand tint
 * would claim an identity the row does not have. Kept here so the two kinds of
 * tile share one footprint: these sit in the same menu column as the branded ones,
 * so a size or radius changed on one kind and not the other is visible in a single
 * glance down the list.
 */
export const NEUTRAL_TILE_CLASS =
  `${TILE_LAYOUT} ${TILE_FOOTPRINT} bg-muted text-muted-foreground` as const
