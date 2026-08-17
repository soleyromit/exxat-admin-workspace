import { describe, expect, it } from "vitest"

import {
  homeVariantFromPathname,
  homeVariantPath,
  isHomeVariant,
} from "@/hooks/use-home-variant"

describe("homeVariantPath", () => {
  it("builds an explicit layout URL for each approach", () => {
    expect(homeVariantPath("storefront")).toBe("/home/storefront")
    expect(homeVariantPath("focus")).toBe("/home/focus")
    expect(homeVariantPath("spotlight")).toBe("/home/spotlight")
    expect(homeVariantPath("launcher")).toBe("/home/launcher")
  })
})

describe("isHomeVariant", () => {
  it("accepts the four layout ids", () => {
    expect(isHomeVariant("storefront")).toBe(true)
    expect(isHomeVariant("focus")).toBe(true)
    expect(isHomeVariant("spotlight")).toBe(true)
    expect(isHomeVariant("launcher")).toBe(true)
  })

  it("rejects product marketing slugs", () => {
    expect(isHomeVariant("prism")).toBe(false)
    expect(isHomeVariant("one-schools")).toBe(false)
    expect(isHomeVariant("")).toBe(false)
  })
})

describe("homeVariantFromPathname", () => {
  it("reads the layout from an explicit home URL", () => {
    expect(homeVariantFromPathname("/home/focus")).toBe("focus")
    expect(homeVariantFromPathname("/home/spotlight/")).toBe("spotlight")
  })

  it("returns null for bare home, nested paths, and marketing slugs", () => {
    expect(homeVariantFromPathname("/home")).toBeNull()
    expect(homeVariantFromPathname("/home/prism")).toBeNull()
    expect(homeVariantFromPathname("/home/focus/extra")).toBeNull()
    expect(homeVariantFromPathname("/prism/dashboard")).toBeNull()
  })
})
