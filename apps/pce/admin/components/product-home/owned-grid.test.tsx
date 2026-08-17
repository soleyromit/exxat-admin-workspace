/**
 * How many columns "Your App" breaks to.
 *
 * The point of the shared rule is that the launcher and the shelf under it agree
 * at every width, so what is worth pinning is the pair of judgements a future
 * edit is most likely to drop: three columns arrive at `xl`, where a tile has
 * room for its scope line, and four cards stay two-by-two rather than leaving a
 * single card alone on a second row. One or two cards stay capped so they do not
 * stretch across the reading column.
 */

import { describe, expect, it } from "vitest"

import { ownedGridClassName } from "./product-home-parts"

describe("ownedGridClassName", () => {
  it("caps one card instead of stretching it full width", () => {
    expect(ownedGridClassName(1)).toContain("max-w-md")
    expect(ownedGridClassName(1)).not.toMatch(/grid-cols/)
  })

  it("goes two-up from sm, capped, and no further", () => {
    expect(ownedGridClassName(2)).toContain("sm:grid-cols-2")
    expect(ownedGridClassName(2)).toContain("max-w-3xl")
    expect(ownedGridClassName(2)).not.toContain("xl:grid-cols-3")
  })

  it("goes three-up at xl once there are three, without a width cap", () => {
    expect(ownedGridClassName(3)).toContain("xl:grid-cols-3")
    expect(ownedGridClassName(3)).not.toContain("max-w-")
    expect(ownedGridClassName(5)).toContain("xl:grid-cols-3")
  })

  it("holds four at two-by-two rather than three then one", () => {
    expect(ownedGridClassName(4)).toContain("sm:grid-cols-2")
    expect(ownedGridClassName(4)).not.toContain("xl:grid-cols-3")
  })
})
