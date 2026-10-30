#!/usr/bin/env node
/**
 * Lists lab headings (h1-h6, CardTitle, FieldLegend, DialogTitle, SheetTitle, WizardStepHeading) that hand-set a text size
 * instead of reading it from TYPE (components/lab/type-scale.ts). "[CARD]" marks a heading that sits inside a Card in the
 * preceding lines (a card title, 16, not a page section, 18). Helper for the 2026-10-30 foundation sweep; the guard is
 * tests/lab/type-rubric.test.ts.
 */
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../components/lab")
const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => {
  const p = path.join(d, e.name)
  return e.isDirectory() ? walk(p) : /\.tsx$/.test(e.name) ? [p] : []
})
const RE = /<(h[1-6]|CardTitle|FieldLegend|DialogTitle|SheetTitle|WizardStepHeading)\b([^>]*?)>/g
const SIZE = /(?<![\w:-])text-(xs|sm|base|lg|xl|\dxl)(?![\w-])/
let n = 0
for (const f of walk(ROOT)) {
  const s = fs.readFileSync(f, "utf8")
  for (const m of s.matchAll(RE)) {
    if (!SIZE.test(m[2])) continue
    const line = s.slice(0, m.index).split("\n").length
    const before = s.slice(0, m.index).split("\n").slice(-8).join(" ")
    const inCard = /<Card(Content|Header)?\b/.test(before)
    const cls = (m[2].match(/className=("[^"]*"|\{[^}]*\})/) || [])[1]
    console.log(`${path.relative(ROOT, f)}:${line} ${m[1]}${inCard ? " [CARD]" : ""} ${cls}`)
    n++
  }
}
console.log(`${n} hand-sized headings`)
