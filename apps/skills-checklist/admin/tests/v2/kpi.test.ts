import fs from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"

/**
 * V2-CONSISTENCY test 5 (static read of the pages, because the metric lists are built inside the page components).
 * One KPI variant, only on the four list pages, 3 to 4 tiles each, at most one `alert` per strip.
 */
const ROOT = path.resolve(__dirname, "../../components/v2")
const STRIP_FILES = ["admin/admin-home.tsx", "director/verification-pages.tsx", "outcomes/outcomes-page.tsx", "reports/reports-page.tsx", "review/review-queue-page.tsx"]

const read = (rel: string) => fs.readFileSync(path.join(ROOT, rel), "utf8")
const walk = (dir: string): string[] => fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)]))

describe("KPI strips", () => {
  it("appear only on the four list pages and the admin Home", () => {
    const withStrip = walk(ROOT)
      .filter((f) => /\.tsx?$/.test(f) && fs.readFileSync(f, "utf8").includes("<KeyMetrics"))
      .map((f) => path.relative(ROOT, f))
      .sort()
    expect(withStrip).toEqual([...STRIP_FILES].sort())
  })

  it("use one variant and one anatomy", () => {
    for (const rel of STRIP_FILES) {
      const tags = read(rel).match(/<KeyMetrics[^>]*>/g) ?? []
      expect(tags, rel).toHaveLength(1)
      expect(tags[0], rel).toContain('size="sm" showHeader={false}')
      expect(tags[0], rel).toContain("metricsSingleRow")
      expect(tags[0], rel).toContain('variant="cards"')
    }
  })

  it("carry 3 or 4 tiles, an empty delta, and at most one warning alert", () => {
    for (const rel of STRIP_FILES) {
      const src = read(rel)
      const start = src.indexOf("const metrics: MetricItem[] = [")
      expect(start, rel).toBeGreaterThan(-1)
      const block = src.slice(start, src.indexOf("\n  ]", start))
      const tiles = block.match(/\{ id: "/g) ?? []
      expect(tiles.length, rel).toBeGreaterThanOrEqual(3)
      expect(tiles.length, rel).toBeLessThanOrEqual(4)
      expect(block.match(/alert:/g)?.length ?? 0, rel).toBeLessThanOrEqual(1)
      expect(block, rel).not.toMatch(/alert: "danger"/)
      expect(block.match(/delta: ""/g)?.length ?? 0, rel).toBe(tiles.length)
    }
  })
})
