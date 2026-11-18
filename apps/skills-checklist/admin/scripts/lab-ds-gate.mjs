#!/usr/bin/env node
// DS component gate for the design lab. Usage: node scripts/lab-ds-gate.mjs [--write]
// For every built screen variant (lib/lab/screens.json, variants with a "file") it reports required vs used DS components
// and flags raw <button>/<table>, hex/rgb colours, "uppercase tracking-wide", Button without variant+size, and "items" in copy.
// --write refreshes lib/lab/ds-used.generated.json (what <DsUsedPanel/> shows). Exit 1 on any failure, including a stale file.
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { checkShared, checkVariant } from "./lab-ds-gate-lib.mjs"

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const registry = JSON.parse(fs.readFileSync(path.join(root, "lib/lab/screens.json"), "utf8"))
const outFile = path.join(root, "lib/lab/ds-used.generated.json")
const countsFile = path.join(root, "lib/lab/ds-used-counts.generated.json")
const write = process.argv.includes("--write")

let failed = false
let built = 0
const generated = {}
for (const s of registry.screens) {
  for (const v of s.variants.filter((x) => x.file)) {
    built++
    const key = `${s.persona}/${s.slug}/${v.id}`
    const file = path.join(root, v.file)
    if (!fs.existsSync(file)) { console.log(`FAIL ${key}: file ${v.file} does not exist`); failed = true; continue }
    // A variant whose design has no table or tabs (Evaluation settings B, map D3 "Not on the page") names its own list.
    const required = v.requiredDsComponents ?? s.requiredDsComponents
    const r = checkVariant(file, root, required)
    const ok = r.missing.length === 0 && r.violations.length === 0
    if (!ok) failed = true
    console.log(`${ok ? "PASS" : "FAIL"} ${key}  (${v.file})`)
    console.log(`  required: ${required.join(", ")}`)
    console.log(`  used (${r.used.length}): ${r.used.join(", ")}`)
    if (r.missing.length) console.log(`  MISSING: ${r.missing.join(", ")}`)
    for (const x of r.violations) console.log(`  VIOLATION ${x.rule} ${x.file}:${x.line} ${x.message}`)
    const uniq = (list) => [...new Map(list.map((d) => [`${d.name}|${d.via ?? ""}`, d])).values()].sort((a, b) => a.name.localeCompare(b.name))
    generated[key] = { direct: uniq(r.direct), via: uniq(r.via) }
  }
}
// Shared files every variant sits in or may render: components/v2/viz/** and the lab chrome with its shared imports.
const shared = checkShared(root)
console.log(`${shared.violations.length ? "FAIL" : "PASS"} shared (${shared.scanned.length} files: components/v2/viz/**, lab chrome and the v2/skills files it imports)`)
for (const x of shared.violations) console.log(`  VIOLATION ${x.rule} ${x.file}:${x.line} ${x.message}`)
if (shared.violations.length) failed = true

// Tiny per-variant count of distinct component names: the lab bar imports this, the full list loads only when its drawer opens.
const counts = Object.fromEntries(Object.entries(generated).map(([k, e]) => [k, new Set([...e.direct, ...e.via].map((d) => d.name)).size]))
const outputs = [[outFile, JSON.stringify(generated, null, 1) + "\n"], [countsFile, JSON.stringify(counts, null, 1) + "\n"]]
for (const [file, next] of outputs) {
  const rel = path.relative(root, file)
  if (write) {
    fs.writeFileSync(file, next)
    console.log(`wrote ${rel}`)
  } else {
    const cur = fs.existsSync(file) ? fs.readFileSync(file, "utf8") : ""
    if (cur !== next) { console.log(`FAIL ${rel} is stale: run node scripts/lab-ds-gate.mjs --write`); failed = true }
  }
}
console.log(`\n${built} built variant(s) checked. ${failed ? "GATE FAILED" : "GATE PASSED"}`)
process.exit(failed ? 1 : 0)
