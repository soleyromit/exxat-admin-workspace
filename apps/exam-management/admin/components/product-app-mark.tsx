/**
 * One drawn mark per app, for the tile the switcher rows and the launcher cards
 * share.
 *
 * Colour says nothing here any more: every app is Exxat's pink and only Exxat One
 * differs (`product-brand.ts`), so the drawing is the whole of what identifies a
 * row. That raises the bar on this file — the hue used to carry a share of the
 * recognition and now it carries none — and it is why the rules below are about
 * silhouette rather than detail.
 *
 * A Font Awesome glyph could not carry that: the set is drawn at one optical
 * weight for running text beside a label, so a hairline glyph in a saturated
 * square reads as a smudge. These are drawn for the square instead, on a 24 grid,
 * at a weight that survives 15px.
 *
 * ## Two hands, one grid
 *
 * Five marks are the supplied artwork, brought over at the coordinates they were
 * authored at and fitted to the grid by {@link fitted} rather than retraced.
 * Retracing a supplied mark by eye is how a set drifts: the curve of the trend
 * and the taper of the ribbon carry the drawing, and both are the first casualty
 * of a redraw. The rest are drawn here, because no artwork was supplied for them.
 *
 * The supplied five are solid shapes with their detail cut out; the remaining
 * four are outlines at 2.5–3.2. That is a visible difference in weight, and it is
 * the honest state of the set rather than a decision — the four are next in line
 * to be redrawn solid, and until they are, the tile they share does the work of
 * making them look related.
 *
 * ## Rules the set follows
 *
 * 1. **One silhouette class each.** Only one mark is a ring cluster, only one is a
 *    shield, only one is a diagonal, only one is a curve. No two are "a rounded
 *    blob with detail inside", because at tile size detail is the first thing to go
 *    and silhouette is the last. The tile is round now, which spends part of this
 *    budget: the medal's disc sits inside a circle and only its ribbons keep the
 *    two outlines apart.
 * 2. **Detail is cut out, never laid on.** The mark is one colour, so a check
 *    drawn in the same white as the shield under it is invisible. A second
 *    subpath wound against the first turns it into a hole and the tile colour
 *    reads through it.
 * 3. **`currentColor` only.** The tile sets the glyph white
 *    (`.product-tile-glyph`), and a mark that named its own colour would break
 *    the moment a tenant recoloured the tile under it. Supplied artwork arrives
 *    with its fills named, and they are stripped on the way in.
 * 4. **No text, no gradients, no strokes under 2.4.** All three vanish at 15px.
 *
 * Products without a mark fall back to their Font Awesome glyph. Two do:
 * `exxat-custom`, because a tenant's product is authored at runtime and nobody
 * can draw it a mark in advance, and Clinical Education, which is a decision
 * rather than a gap — see the note where its entry used to be.
 *
 * The Exxat circular logo is a different job and lives in `ProductMark`
 * (`components/product-wordmark.tsx`): that one is the company signing the app,
 * this one says which app.
 */

import type * as React from "react"

import type { Product } from "@/contexts/product-context"
import {
  PRODUCT_TILE_GLYPH_CLASS,
  PRODUCT_TILE_SIZES,
  productGlyph,
  type ProductTileSize,
} from "@/lib/product-glyph"
import { cn } from "@/lib/utils"

/** Six square teeth, one per 60°, around the Administrator gear. */
const GEAR_TEETH = [0, 60, 120, 180, 240, 300] as const

/** The box a piece of supplied artwork was authored in. */
type ArtBox = { x?: number; y?: number; width: number; height: number }

/**
 * How much of the 24 grid a mark's longest side may use.
 *
 * The marks drawn here run 18 to 22 across, because a glyph needs air inside the
 * tile to read as a shape rather than as a filled square. Artwork fitted to the
 * full 24 is the largest thing in the menu by a visible margin, so the set looks
 * like two different sizes; 21 puts the supplied five where the clipboard and the
 * shield already were.
 */
const ART_EXTENT = 21

const trim = (value: number) => Number(value.toFixed(4))

/**
 * Place artwork authored at its own size on the shared 24 grid.
 *
 * Uniform scale about the box's centre, so the drawing keeps its proportions and
 * lands where every other mark lands. `width`/`height` are the part of the
 * artwork that should fill the grid, not necessarily the file's `viewBox`: the
 * bar chart arrived inside a rounded square that was the tile it was mocked on,
 * and fitting that square would have shrunk the bars to two thirds and left them
 * off-centre.
 *
 * Scaling rather than rewriting the numbers means the marks stay diffable against
 * the files they came from. Nothing here is stroked, so there is no stroke width
 * to scale with it.
 */
function fitted(box: ArtBox, art: React.ReactNode) {
  const { x = 0, y = 0, width, height } = box
  const scale = Math.min(ART_EXTENT / width, ART_EXTENT / height)
  const dx = (24 - width * scale) / 2 - x * scale
  const dy = (24 - height * scale) / 2 - y * scale

  return <g transform={`translate(${trim(dx)} ${trim(dy)}) scale(${trim(scale)})`}>{art}</g>
}

/**
 * Accreditation's disc with the star cut out of it. The circle is written as two
 * arcs rather than a `<circle>` so the star can share the path and become a hole
 * under `evenodd`.
 */
const MEDAL_DISC =
  "M0 44a44 44 0 1 0 88 0 44 44 0 1 0-88 0Z" +
  "M41.23 21.6598C42.2548 19.1959 45.7452 19.1959 46.77 21.6598L51.7604 33.6583C52.1924 " +
  "34.697 53.1693 35.4067 54.2906 35.4966L67.244 36.5351C69.904 36.7483 70.9826 40.0678 " +
  "68.9559 41.8038L59.0868 50.2578C58.2325 50.9896 57.8594 52.138 58.1204 53.2322L61.1355 " +
  "65.8725C61.7547 68.4682 58.931 70.5198 56.6537 69.1288L45.5638 62.3551C44.6037 61.7687 " +
  "43.3963 61.7687 42.4362 62.3551L31.3463 69.1288C29.069 70.5198 26.2453 68.4682 26.8644 " +
  "65.8725L29.8796 53.2322C30.1406 52.138 29.7675 50.9896 28.9132 50.2578L19.0441 " +
  "41.8038C17.0175 40.0678 18.096 36.7483 20.756 36.5351L33.7094 35.4966C34.8307 35.4067 " +
  "35.8076 34.697 36.2396 33.6583L41.23 21.6598Z"

/** The two tails under it, hung from the same centre. */
const MEDAL_RIBBONS =
  "M25.2311 93.5807L17.375 97.1813C13.6096 98.9072 11.9559 103.359 13.6817 107.125C15.4075 " +
  "110.89 19.8596 112.544 23.625 110.818L44.5391 101.232L64.9405 110.347C68.7223 112.037 " +
  "73.158 110.341 74.8477 106.559C76.5374 102.777 74.8414 98.3418 71.0596 96.652L63.5275 " +
  "93.2866C57.4845 95.6829 50.896 96.9999 44 96.9999C37.3914 96.9999 31.0654 95.7904 " +
  "25.2311 93.5807Z"

/** Student & Program Success — the curve the dot and the arrow sit on. */
const SUCCESS_TREND =
  "M92.5191 41.8331C93.992 40.1868 96.5211 40.0459 98.1675 41.5186C99.8137 42.9915 99.9547 " +
  "45.5207 98.482 47.167C94.3229 51.8154 88.6779 58.4116 82.8989 63.8301C79.998 66.5502 " +
  "76.945 69.089 73.8989 70.9952C70.9092 72.8661 67.572 74.3542 64.1675 74.4961C56.8468 " +
  "74.8012 52.7898 72.0382 49.1841 69.8624C45.9072 67.8849 42.5063 66 35.5005 66C23.3801 " +
  "66 12.3893 73.3874 6.15383 77.3711C4.29223 78.5603 1.81872 78.0149 0.629414 " +
  "76.1534C-0.559706 74.2918 -0.0143433 71.8183 1.84719 70.629C7.6119 66.9459 20.6212 58 " +
  "35.5005 58C44.4946 58 49.3439 60.6152 53.3169 63.0127C56.9611 65.2118 59.1547 66.6988 " +
  "63.8335 66.504C65.2288 66.4458 67.1667 65.7709 69.6548 64.2139C72.0869 62.692 74.7157 " +
  "60.5366 77.4273 57.9942C82.873 52.888 88.1783 46.6845 92.5191 41.8331Z"

/** Curriculum Mapping — one leaf, then its mirror. Solid pages, one spine gap. */
const BOOK_LEFT_LEAF =
  "M37 80L37.5065 14.9068C37.5065 14.9068 33 7.5 23 4C13 0.5 0.493506 0 0.493506 0L0 " +
  "70.0621C0 70.0621 17.2159 68.78 23.5 71C29.7841 73.22 37 80 37 80Z"
const BOOK_RIGHT_LEAF =
  "M50.0066 80L49.5001 14.9068C49.5001 14.9068 54.0066 7.5 64.0066 4C74.0066 0.5 86.5131 0 " +
  "86.5131 0L87.0066 70.0621C87.0066 70.0621 69.7907 68.78 63.5066 71C57.2225 73.22 " +
  "50.0066 80 50.0066 80Z"

/**
 * Compliance — a shield with the check cut out. The two subpaths wind against
 * each other, so the hole is the default fill rule's work and needs no
 * `evenodd`.
 */
const COMPLIANCE_SHIELD =
  "M81 16.5V51C81 51 76.0058 68.5472 67.583 77.5C59.1771 86.4347 39.8328 94.9656 39.7549 " +
  "95C39.7549 95 18.2858 83.9264 11.4297 75C4.57363 66.0736 0 48.5 0 48.5V19L41.2451 " +
  "0L81 16.5ZM61.1279 37.25C59.433 35.4326 56.5851 35.3335 54.7676 37.0283L36.1172 " +
  "54.4189L30.0879 47.9541C28.393 46.1365 25.5452 46.0366 23.7275 47.7314C21.91 49.4264 " +
  "21.8109 52.2742 23.5059 54.0918L32.3721 63.5996C32.4137 63.6442 32.457 63.6869 32.5 " +
  "63.7295C32.5346 63.7692 32.5693 63.8098 32.6055 63.8486C34.3004 65.6658 37.1474 65.765 " +
  "38.9648 64.0703L60.9062 43.6104C62.7235 41.9154 62.8227 39.0675 61.1279 37.25Z"

const MARKS: Partial<Record<Product, React.ReactNode>> = {
  // Clinical Education is deliberately absent: it wears Font Awesome's solid
  // stethoscope, which `ProductArt` falls back to. The drawn one was a stroked
  // outline, and an outline is the wrong weight next to the solid marks below it
  // — at 22px its 2.7 stroke landed thinner than the fills either side of it in
  // the switcher column and the row read as unfinished rather than as a different
  // app. Solid also fixes the shape: the drawn bell was a plain circle, near
  // enough to Exxat One's rings on a round tile to be mistaken for them.

  // Exxat One, school side — three rings, overlapping. The product is a
  // partnership, so the mark is the parties in it: a school, a site, and the
  // student between them. It was two rings while the mark had to say "both
  // sides"; a third makes it a network rather than a pair, which is what a
  // workspace with many partner sites actually has. All outlined so the overlaps
  // stay visible — filling one turned the crossings into crescents that read as a
  // single blob. The triangle, not a row: on a round tile a row of three reaches
  // the curve at the midpoints and gets clipped, and a cluster does not.
  "exxat-one-schools": (
    <g fill="none" stroke="currentColor" strokeWidth="2.3">
      <circle cx="12" cy="8.5" r="4.5" />
      <circle cx="8.1" cy="15.4" r="4.5" />
      <circle cx="15.9" cy="15.4" r="4.5" />
    </g>
  ),

  // Exxat One, site side — the same cluster with the top ring filled, which is
  // the site's own node. Only one of the two sides is ever in a workspace, so
  // this only has to differ from the school's, not pair with it.
  "exxat-one-sites": (
    <>
      <g fill="none" stroke="currentColor" strokeWidth="2.3">
        <circle cx="8.1" cy="15.4" r="4.5" />
        <circle cx="15.9" cy="15.4" r="4.5" />
      </g>
      <circle cx="12" cy="8.5" r="4.2" />
    </>
  ),

  // Exam Management — a clipboard, scored. The clip is the whole silhouette
  // argument: without it the board is a rounded rectangle, which is the least
  // distinctive shape available. The check is white on the tile colour showing
  // through the outlined board, so unlike Compliance's it does not need cutting
  // out of anything.
  "exxat-exam-management": (
    <>
      <path
        d="M9 3.4H6.4a2.6 2.6 0 0 0-2.6 2.6v13.2a2.6 2.6 0 0 0 2.6 2.6h11.2a2.6 2.6 0 0 0
           2.6-2.6V6a2.6 2.6 0 0 0-2.6-2.6H15"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <rect x="8.4" y="1.5" width="7.2" height="4" rx="1.6" />
      <rect x="7.8" y="9" width="8.4" height="2.3" rx="1.15" />
      <path
        d="M7.8 16.1l2.5 2.5 5.9-5.9"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </>
  ),

  // Student & Program Success — a cohort, and where it is heading. The dot is one
  // of them; the curve is the whole group's direction, dipping before it climbs,
  // which a straight line would have flattered. The only diagonal and the only
  // curve in the set, so movement is what the silhouette says first.
  "exxat-student-success": fitted(
    { width: 100, height: 78 },
    <>
      {/* Coordinates carry 2 decimals, the precision this 100-unit box can show
          once it is scaled to 21. The export's 4 were bytes, not pixels. */}
      <rect x="62.5" y="28.58" width="39" height="9" rx="4" transform="rotate(-45 62.5 28.58)" />
      <rect x="72.5" y="0" width="24" height="9" rx="4" />
      <rect x="88.5" y="24" width="24" height="9" rx="4" transform="rotate(-90 88.5 24)" />
      <circle cx="35.5" cy="30" r="16" />
      <path d={SUCCESS_TREND} />
    </>,
  ),

  // Curriculum Mapping — an open book. Two leaves off one spine, which is a
  // silhouette nothing else here has, and solid pages rather than outlined ones:
  // at tile size an outlined leaf is two hairlines with a sliver of tile between
  // them, and the sliver is what closes up first.
  "exxat-curriculum-mapping": fitted(
    { width: 87, height: 80 },
    <>
      <path d={BOOK_LEFT_LEAF} />
      <path d={BOOK_RIGHT_LEAF} />
    </>,
  ),

  // Compliance — a shield, cleared. The only pointed base.
  "exxat-compliance": fitted({ width: 81, height: 95 }, <path d={COMPLIANCE_SHIELD} />),

  // Accreditation — a medal: a star cut out of the disc, on two tails. The disc
  // is what separates it from a bare star, and cutting the star rather than
  // laying it on is what keeps it visible on a one-colour mark.
  "exxat-accreditation": fitted(
    { width: 88, height: 112 },
    <>
      <path d={MEDAL_DISC} fillRule="evenodd" clipRule="evenodd" />
      <path d={MEDAL_RIBBONS} fillRule="evenodd" clipRule="evenodd" />
    </>,
  ),

  // Surveys & Course Evaluations — answers counted. Bars used to be Student &
  // Program Success's idea, which is why these were wrapped in a speech bubble to
  // stay out of its way; that product is a curve now, so the bars are free.
  //
  // The artwork arrived inside a rounded square, which was the tile it was mocked
  // on and not part of the mark. Kept, it would have drawn a second tile inside
  // the real one.
  "exxat-surveys": fitted(
    { x: 19, y: 22, width: 43, height: 41 },
    <>
      <rect x="19" y="43" width="9" height="20" rx="4.5" />
      <rect x="36" y="34" width="9" height="29" rx="4.5" />
      <rect x="53" y="22" width="9" height="41" rx="4.5" />
    </>,
  ),

  // Administrator — a gear. Radial, and the only mark with rotational symmetry,
  // which is what separates it from the shield it used to share a glyph with.
  "exxat-admin": (
    <>
      <circle cx="12" cy="12" r="6.2" fill="none" stroke="currentColor" strokeWidth="3.2" />
      {GEAR_TEETH.map(angle => (
        <rect
          key={angle}
          x="10.4"
          y="0.9"
          width="3.2"
          height="4.2"
          rx="1"
          transform={`rotate(${angle} 12 12)`}
        />
      ))}
    </>
  ),

  // Design System — swatches, stacked. Squares, which nothing else in the set is.
  "exxat-design-os": (
    <>
      <rect x="2.6" y="2.6" width="9.2" height="9.2" rx="2.4" />
      <rect x="12.2" y="12.2" width="9.2" height="9.2" rx="2.4" />
      <rect
        x="12.2"
        y="2.6"
        width="9.2"
        height="9.2"
        rx="2.4"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
      />
    </>
  ),
}

/** Whether this product has a drawn mark, or should fall back to its glyph. */
export function hasProductAppMark(product: Product): boolean {
  return MARKS[product] !== undefined
}

/**
 * The mark, sized by the caller. Decorative: every tile that renders one sits
 * beside the product's name, so the name is the accessible one.
 */
export function ProductAppMark({
  product,
  className,
}: {
  product: Product
  className?: string
}) {
  const art = MARKS[product]
  if (!art) return null

  return (
    <svg
      // Read by `scripts/icon-contrast-probe.mjs`, which measures glyph-on-tile
      // contrast that axe cannot see. Without a hook the marks would be the one
      // thing in a tile the probe walks straight past.
      //
      // Deliberately not `data-product-mark`: that names the Exxat logotype, and
      // both probes exempt logotypes from 1.4.11. These marks are meaningful
      // graphics and have to clear the floor, so they must not inherit that pass.
      data-product-app-mark={product}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      {art}
    </svg>
  )
}

/**
 * A product's identity art, whichever kind it has: the drawn mark, or the Font
 * Awesome glyph for products that have none.
 *
 * Two class props rather than one because the two are sized differently — an svg
 * by its box, a font glyph by its font-size — and a caller that passed `size-4`
 * to both would get a glyph with no size at all.
 */
export function ProductArt({
  product,
  markClassName,
  glyphClassName,
}: {
  product: Product
  markClassName?: string
  glyphClassName?: string
}) {
  if (hasProductAppMark(product)) {
    return <ProductAppMark product={product} className={markClassName} />
  }
  return <i aria-hidden="true" className={cn(productGlyph(product), glyphClassName)} />
}

/**
 * The art inside a brand-filled tile — switcher rows and launcher cards, both of
 * which use the shared tile footprint. The size classes live in `product-glyph.ts`
 * next to that footprint, so the same product is the same weight everywhere and
 * growing the tile cannot leave the art behind.
 *
 * It was 16 in a 28 tile, and covered under half of it: the eye read a coloured
 * chip with something in the middle rather than an icon, and the outlined marks
 * suffered worst, since a stroke authored at 2.7 on the 24 grid landed at 1.8px.
 * At 22 in a 32 tile the same stroke lands at 2.5 and the shape, not the colour,
 * is what identifies the row.
 */
export function ProductTileArt({
  product,
  size = "md",
}: {
  product: Product
  size?: ProductTileSize
}) {
  const art = PRODUCT_TILE_SIZES[size]
  return (
    <ProductArt
      product={product}
      markClassName={cn(art.mark, PRODUCT_TILE_GLYPH_CLASS)}
      glyphClassName={cn(art.glyph, PRODUCT_TILE_GLYPH_CLASS)}
    />
  )
}
