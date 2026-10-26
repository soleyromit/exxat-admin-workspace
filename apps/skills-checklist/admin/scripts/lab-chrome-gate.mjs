#!/usr/bin/env node
// Applies the lab DS gate's violation rules (raw button/table, hex/rgb, uppercase tracking-wide, Button without variant+size,
// "items" in copy) to the lab chrome files, which the variant gate does not scan because no variant imports them.
// Usage: node scripts/lab-chrome-gate.mjs. Exit 1 on any violation.
import path from "node:path"
import { fileURLToPath } from "node:url"
import { checkVariant } from "./lab-ds-gate-lib.mjs"

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const FILES = [
  "components/lab/lab-bar/lab-bar.tsx",
  "components/lab/lab-bar/persona-switcher.tsx",
  "components/lab/lab-bar/lab-link.tsx",
  "components/lab/lab-bar/lab-banner.tsx",
  "components/lab/lab-bar/lab-key-metrics.tsx",
  "components/lab/lab-bar/page-context.tsx",
  "components/lab/library/configure-many.ts",
  "components/lab/screens/shared-drills.tsx",
  "app/(lab)/lab/flow/[flow]/page.tsx",
  "components/lab/lab-frame.tsx",
  "components/lab/lab-index.tsx",
  "components/lab/ds-used-panel.tsx",
  "app/(lab)/lab/flow/[flow]/[step]/page.tsx",
  "app/(lab)/lab/[persona]/[screen]/page.tsx",
]
let failed = false
for (const f of FILES) {
  const r = checkVariant(path.join(root, f), root, [])
  if (r.violations.length) failed = true
  console.log(`${r.violations.length ? "FAIL" : "PASS"} ${f}`)
  for (const x of r.violations) console.log(`  VIOLATION ${x.rule} ${x.file}:${x.line} ${x.message}`)
}
console.log(failed ? "CHROME GATE FAILED" : "CHROME GATE PASSED")
process.exit(failed ? 1 : 0)
