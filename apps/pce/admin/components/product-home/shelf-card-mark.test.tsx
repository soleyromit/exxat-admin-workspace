/**
 * The mark on a card for a product the workspace does not own yet.
 *
 * A shelf card leads with a UI vignette of the job the product does, which sells
 * it and does not identify it: the thing the buyer will hunt for in the switcher
 * next week is the coloured mark, and until now that appeared on Your App and in
 * the switcher but never here. What has to hold is that every card carries one, in
 * its own brand colour rather than the theme's, and that adding a picture did not
 * add anything for a screen reader to read out.
 */

import { render, screen } from "@testing-library/react"
import { MemoryRouter } from "react-router"
import { describe, expect, it, vi } from "vitest"

import { buildProductHomeInventory, type ProductHomeCard } from "@/lib/product-home"
import { PRODUCT_TILE_SIZES } from "@/lib/product-glyph"

import { ProductShelves } from "./product-shelves"

// The real provider boots a tenant catalogue over `fetch` on mount, and which
// product the shell has open is not what is under test.
vi.mock("@/contexts/product-context", () => ({
  useProduct: () => ({ product: "exxat-prism" }),
}))

function shelfCards(): ProductHomeCard[] {
  const cards = buildProductHomeInventory([], []).available
  if (cards.length === 0) throw new Error("the workspace owns every product")
  return cards
}

function renderShelf(cards = shelfCards()) {
  const view = render(
    <MemoryRouter>
      <ProductShelves cards={cards} />
    </MemoryRouter>,
  )
  return { ...view, cards }
}

describe("a More from Exxat card", () => {
  it("wears a mark for every product on the shelf", () => {
    const { container, cards } = renderShelf()

    expect(container.querySelectorAll(".product-tile")).toHaveLength(cards.length)
  })

  // Seven cards on one page, so the colour cannot come from the theme: each tile
  // hands its own product's brand down to the CSS that paints it.
  it("paints each tile in that card's brand colour", () => {
    const { container, cards } = renderShelf()

    const painted = [...container.querySelectorAll<HTMLElement>(".product-tile")].map(tile =>
      tile.style.getPropertyValue("--product-brand"),
    )

    expect(painted).toEqual(cards.map(card => card.brandColor))
  })

  // The mark is white on the brand colour at a measured 3:1. Menu rows and other
  // highlightable surfaces repaint their descendants' text on hover, which turned
  // the mark near-black over a saturated tile, so the tile opts its subtree out.
  it("keeps its own ink where a surface repaints its descendants", () => {
    const { container } = renderShelf()

    for (const tile of container.querySelectorAll(".product-tile")) {
      expect(tile).toHaveAttribute("data-fixed-ink")
    }
  })

  it("says nothing to a screen reader, since the name is right beside it", () => {
    const { container } = renderShelf()

    for (const tile of container.querySelectorAll(".product-tile")) {
      expect(tile).toHaveAttribute("aria-hidden", "true")
    }
  })

  // The tile sits in its own column beside a nested flex column now. A heading that
  // is no longer a heading, or a card that stopped being one link to one place, is
  // the regression worth catching.
  it("leaves the card one heading and one link", () => {
    const { cards } = renderShelf()
    const [first] = cards

    expect(screen.getAllByRole("heading", { level: 3 })).toHaveLength(cards.length)
    expect(screen.getByRole("link", { name: new RegExp(first.label, "i") })).toHaveAttribute(
      "href",
      `/home/${first.slug}`,
    )
  })

  // The layout's whole purpose: the title and the sentence under it are in one
  // column, so they share a left edge. Put the tagline back outside that column and
  // the block has two left edges again, which is what it looked like before and is
  // invisible in a diff.
  it("keeps the title and the tagline in one column", () => {
    const { cards } = renderShelf()
    const [first] = cards

    const heading = screen.getAllByRole("heading", { level: 3 })[0]
    const column = heading.parentElement!

    expect(column.querySelector("p")?.textContent).toBe(first.tagline)
  })

  it("gives the card the larger of the two tile sizes", () => {
    const { container } = renderShelf()

    for (const tile of container.querySelectorAll(".product-tile")) {
      expect(tile.className).toContain(PRODUCT_TILE_SIZES.lg.footprint)
    }
  })
})
