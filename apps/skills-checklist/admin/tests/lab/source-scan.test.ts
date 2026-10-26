/**
 * Source scans over components/lab (Gate 2 findings, 2026-10-26):
 * 1. every lowercase element with tabIndex={0} draws a visible focus ring (DS components such as Badge carry their own);
 * 2. no arbitrary pixel radii (rounded-[3px]): use the DS radius scale (rounded-sm);
 * 3. a file that renders TabsTrigger also renders TabsContent, so the selected trigger's aria-controls resolves (axe critical).
 */
import fs from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"

const ROOT = path.resolve(__dirname, "../../components/lab")

function walk(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name)
    if (e.isDirectory()) return walk(p)
    return /\.tsx?$/.test(e.name) ? [p] : []
  })
}
const FILES = walk(ROOT).map((p) => ({ rel: path.relative(ROOT, p), src: fs.readFileSync(p, "utf8") }))

/** The opening tag that contains `index`: from the last "<tag" before it to the first ">" not part of "=>". */
export function openingTagAt(src: string, index: number): { tag: string; text: string } | null {
  const before = src.slice(0, index)
  const m = [...before.matchAll(/<([A-Za-z][\w.]*)\b/g)].at(-1)
  if (!m || m.index === undefined) return null
  let end = index
  while (end < src.length) {
    if (src[end] === ">" && src[end - 1] !== "=") break
    end++
  }
  return { tag: m[1], text: src.slice(m.index, end + 1) }
}

export function unringedFocusables(src: string): string[] {
  const out: string[] = []
  for (const m of src.matchAll(/tabIndex=\{0\}/g)) {
    const t = openingTagAt(src, m.index!)
    if (!t) continue
    if (/^[A-Z]/.test(t.tag)) continue // DS components (Badge, Button) carry their own focus style
    if (!/focus-visible:ring/.test(t.text)) out.push(t.text.replace(/\s+/g, " ").slice(0, 120))
  }
  return out
}

describe("lab source scans", () => {
  it("negative control: the focus scan flags a bare tabIndex span and passes a ringed one", () => {
    expect(unringedFocusables('<Tip label="x"><span tabIndex={0} className="cursor-default">a</span></Tip>')).toHaveLength(1)
    expect(unringedFocusables('<span tabIndex={0} className="rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring">a</span>')).toHaveLength(0)
    expect(unringedFocusables('<div onKeyDown={(e) => go(e)} tabIndex={0} className="outline-none">a</div>')).toHaveLength(1)
    expect(unringedFocusables('<Badge variant="outline" tabIndex={0}>a</Badge>')).toHaveLength(0)
  })

  it("every tabIndex={0} element in components/lab has a visible focus ring", () => {
    const bad = FILES.flatMap((f) => unringedFocusables(f.src).map((t) => `${f.rel}: ${t}`))
    expect(bad).toEqual([])
  })

  it("no arbitrary pixel radius (rounded-[Npx]) in components/lab", () => {
    const bad = FILES.flatMap((f) => [...f.src.matchAll(/rounded(?:-[a-z]{1,2})?-\[\d+(?:\.\d+)?px\]/g)].map((m) => `${f.rel}: ${m[0]}`))
    expect(bad).toEqual([])
  })

  it("every file that renders TabsTrigger also renders TabsContent", () => {
    const bad = FILES.filter((f) => /<TabsTrigger\b/.test(f.src) && !/<TabsContent\b/.test(f.src)).map((f) => f.rel)
    expect(bad).toEqual([])
  })
})
