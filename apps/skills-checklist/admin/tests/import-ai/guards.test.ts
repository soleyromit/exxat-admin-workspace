// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest"
import { dailyCap, isSameOrigin, parseInterpretBody, SlidingWindowLimiter } from "@/lib/import-ai/guards"

afterEach(() => {
  vi.unstubAllEnvs()
  dailyCap.reset()
})

const ok = { text: "Suction", sourceName: "pasted list", sourceKind: "paste" }

describe("IM-13: the interpret request is validated and never echoed back", () => {
  it("accepts a plain body and the two optional flags", () => {
    expect(parseInterpretBody(ok)).toMatchObject({ ok: true })
    expect(parseInterpretBody({ ...ok, columns: true, skipHeader: true })).toMatchObject({ ok: true })
  })
  const bad: Array<[string, unknown, string]> = [
    ["not an object", "x", "invalid_body"],
    ["an array", [], "invalid_body"],
    ["an unknown field is rejected", { ...ok, extra: 1 }, "unknown_field"],
    ["text must be a string", { ...ok, text: 4 }, "invalid_body"],
    ["sourceKind must be paste or file", { ...ok, sourceKind: "web" }, "invalid_body"],
    ["columns must be a boolean", { ...ok, columns: "yes" }, "invalid_body"],
    ["a source name over 120 characters", { ...ok, sourceName: "x".repeat(121) }, "invalid_body"],
    ["an empty list", { ...ok, text: "  \n " }, "empty"],
    ["more than 200,000 characters", { ...ok, text: "a".repeat(200_001) }, "too_large"],
    ["more than 1,500 non-blank lines", { ...ok, text: Array.from({ length: 1501 }, () => "a").join("\n") }, "too_large"],
  ]
  for (const [name, input, code] of bad) it(`rejects ${name}`, () => expect(parseInterpretBody(input)).toEqual({ ok: false, code }))
})

describe("same-origin guard (a cross-site page must not spend the demo's key)", () => {
  const h = (o: Record<string, string>) => new Headers(o)
  it("allows same-origin and requests with no origin", () => {
    expect(isSameOrigin(h({ host: "localhost:3007" }))).toBe(true)
    expect(isSameOrigin(h({ host: "localhost:3007", origin: "http://localhost:3007", "sec-fetch-site": "same-origin" }))).toBe(true)
  })
  it("refuses a different origin or a cross-site fetch", () => {
    expect(isSameOrigin(h({ host: "localhost:3007", origin: "https://evil.example" }))).toBe(false)
    expect(isSameOrigin(h({ host: "localhost:3007", "sec-fetch-site": "cross-site" }))).toBe(false)
    expect(isSameOrigin(h({ origin: "http://localhost:3007" }))).toBe(false)
    expect(isSameOrigin(h({ host: "a", origin: "not a url" }))).toBe(false)
  })
})

describe("demo guards", () => {
  it("sliding window: 10 per minute per client, then the window slides", () => {
    let t = 1_000
    const l = new SlidingWindowLimiter(10, 60_000, () => t)
    for (let i = 0; i < 10; i++) expect(l.allow("ip")).toBe(true)
    expect(l.allow("ip")).toBe(false)
    expect(l.allow("other")).toBe(true)
    t += 60_001
    expect(l.allow("ip")).toBe(true)
  })
  it("daily cap: SKILLS_IMPORT_DAILY_CAP calls per day, default 200", () => {
    vi.stubEnv("SKILLS_IMPORT_DAILY_CAP", "2")
    expect([dailyCap.take(), dailyCap.take(), dailyCap.take()]).toEqual([true, true, false])
    expect(dailyCap.reached()).toBe(true)
    dailyCap.reset()
    vi.stubEnv("SKILLS_IMPORT_DAILY_CAP", "")
    expect(dailyCap.reached()).toBe(false)
  })
})
