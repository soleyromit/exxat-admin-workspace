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
    const r = checkVariant(file, root, s.requiredDsComponents)
    const ok = r.missing.length === 0 && r.violations.length === 0
    if (!ok) failed = true
    console.log(`${ok ? "PASS" : "FAIL"} ${key}  (${v.file})`)
    console.log(`  required: ${s.requiredDsComponents.join(", ")}`)
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

const next = JSON.stringify(generated, null, 1) + "\n"
if (write) {
  fs.writeFileSync(outFile, next)
  console.log(`wrote ${path.relative(root, outFile)}`)
} else {
  const cur = fs.existsSync(outFile) ? fs.readFileSync(outFile, "utf8") : ""
  if (cur !== next) { console.log("FAIL lib/lab/ds-used.generated.json is stale: run node scripts/lab-ds-gate.mjs --write"); failed = true }
}
console.log(`\n${built} built variant(s) checked. ${failed ? "GATE FAILED" : "GATE PASSED"}`)
process.exit(failed ? 1 : 0)
