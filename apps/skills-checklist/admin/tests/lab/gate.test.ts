import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { describe, expect, it } from "vitest"
import { checkShared, checkVariant, openingTags, parseDsImports, scanSetFor, scanViolations } from "../../scripts/lab-ds-gate-lib.mjs"

describe("lab ds gate", () => {
  it("parses named DS imports and ignores hooks and types", () => {
    const src = `import { Button, type ButtonProps, cn } from "@exxatdesignux/ui/components/ui/button"\nimport { useIsMobile } from "@exxatdesignux/ui/hooks/use-mobile"\nimport { Foo } from "./x"`
    expect(parseDsImports(src)).toEqual([{ name: "Button", from: "@exxatdesignux/ui/components/ui/button" }])
  })

  it("flags raw button, table, colours, tracking and Button props", () => {
    const src = [
      "export const A = () => (<div>",
      "<button>x</button>",
      "<table></table>",
      '<p style={{ color: "#fff" }}>a</p>',
      '<p style={{ color: "rgb(1,2,3)" }}>a</p>',
      '<p className="uppercase tracking-wide">a</p>',
      "<Button>a</Button>",
      '<Button variant="outline" onClick={() => go()}>b</Button>',
      '<Button variant="outline" size="sm" onClick={() => go()}>ok</Button>',
      "</div>)",
    ].join("\n")
    const rules = scanViolations(src).map((v: { rule: string }) => v.rule).sort()
    expect(rules).toEqual(["button-props", "button-props", "hex-colour", "raw-button", "raw-table", "rgb-colour", "uppercase-tracking"].sort())
    expect(openingTags(src, "Button")).toHaveLength(3)
  })

  it("does not mistake Tailwind items-center or href anchors for violations", () => {
    expect(scanViolations('<div className="flex items-center" ><a href="#main">Skip</a></div>')).toEqual([])
  })

  it("flags the word items in copy", () => {
    expect(scanViolations('<p>Showing 12 items</p>').map((v: { rule: string }) => v.rule)).toEqual(["copy-items"])
  })

  it("reports required components that are missing", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "labgate-"))
    const file = path.join(dir, "v.tsx")
    fs.writeFileSync(file, 'import { Card } from "@exxatdesignux/ui/components/ui/card"\nexport const V = () => <Card />\n')
    const r = checkVariant(file, dir, ["Card", "KeyMetrics"])
    expect(r.missing).toEqual(["KeyMetrics"])
    expect(r.violations).toEqual([])
  })

  /** Fixture tree: a lab variant -> a lab part -> a v2 component (raw <button>) -> a v2 viz file (raw <table>). */
  function fixture(): string {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "labgate-shared-"))
    const put = (rel: string, src: string) => { fs.mkdirSync(path.dirname(path.join(dir, rel)), { recursive: true }); fs.writeFileSync(path.join(dir, rel), src) }
    put("components/lab/screens/v.tsx", 'import { Part } from "@/components/lab/part"\nexport const V = () => <Part />\n')
    put("components/lab/part.tsx", 'import { Legacy } from "@/components/v2/legacy"\nexport const Part = () => <Legacy />\n')
    put("components/v2/legacy.tsx", 'import { Chart } from "@/components/v2/viz/chart"\nexport const Legacy = () => <div><button>Go</button><Chart /></div>\n')
    put("components/v2/viz/chart.tsx", "export const Chart = () => <table></table>\n")
    put("components/v2/viz/unused.tsx", 'export const U = () => <p style={{ color: "#fff" }}>a</p>\n')
    return dir
  }

  it("negative control: flags a raw <button> in a v2 component a lab variant imports (through a lab part)", () => {
    const dir = fixture()
    const r = checkVariant(path.join(dir, "components/lab/screens/v.tsx"), dir, [])
    const hits = r.violations.map((v: { rule: string; file: string }) => `${v.rule} ${v.file}`).sort()
    expect(hits).toContain("raw-button components/v2/legacy.tsx")
    // One level further: the v2 file's own v2 import is scanned too.
    expect(hits).toContain("raw-table components/v2/viz/chart.tsx")
    expect(scanSetFor(path.join(dir, "components/lab/screens/v.tsx"), dir).map((f: string) => path.relative(dir, f)).sort()).toEqual(
      ["components/lab/part.tsx", "components/lab/screens/v.tsx", "components/v2/legacy.tsx", "components/v2/viz/chart.tsx"],
    )
  })

  it("checkShared scans every components/v2/viz file, imported or not", () => {
    const dir = fixture()
    const rules = checkShared(dir).violations.map((v: { rule: string; file: string }) => `${v.rule} ${v.file}`).sort()
    expect(rules).toEqual(["hex-colour components/v2/viz/unused.tsx", "raw-table components/v2/viz/chart.tsx"])
  })

  it("control: the same tree without the raw button passes", () => {
    const dir = fixture()
    fs.writeFileSync(path.join(dir, "components/v2/legacy.tsx"), 'export const Legacy = () => <div>ok</div>\n')
    expect(checkVariant(path.join(dir, "components/lab/screens/v.tsx"), dir, []).violations).toEqual([])
  })
})
