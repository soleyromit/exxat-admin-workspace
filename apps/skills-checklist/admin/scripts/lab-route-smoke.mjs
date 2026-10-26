#!/usr/bin/env node
// Route smoke for the design lab: every screen URL (every variant) and every flow step in every set returns 200 and
// server-renders the lab bar region. Usage: node scripts/lab-route-smoke.mjs [--flows-only]. BASE defaults to
// http://localhost:3017 (webpack dev server). Exit 1 on any failure.
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const base = process.env.BASE ?? "http://localhost:3017"
const screens = JSON.parse(fs.readFileSync(path.join(root, "lib/lab/screens.json"), "utf8")).screens
const flows = JSON.parse(fs.readFileSync(path.join(root, "lib/lab/flows.json"), "utf8")).flows
const flowsOnly = process.argv.includes("--flows-only")
const term = "term=Fall%202026"

const urls = []
if (!flowsOnly) for (const s of screens) for (const v of s.variants) urls.push(`/lab/${s.persona}/${s.slug}?variant=${v.id}&${term}`)
for (const f of flows) for (const st of f.steps) for (const set of f.sets) urls.push(`/lab/flow/${f.id}/${st.id}?set=${set.id}&${term}`)
urls.push(`/lab/admin/import?${term}`)
urls.push("/lab")

let failed = 0
for (const u of urls) {
  let status = 0
  let ok = false
  try {
    const res = await fetch(base + u, { redirect: "follow" })
    status = res.status
    const html = await res.text()
    ok = status === 200 && (u === "/lab" || html.includes("data-lab-bar") || html.includes("Design lab controls"))
  } catch (e) {
    status = String(e)
  }
  if (!ok) failed++
  console.log(`${ok ? "PASS" : "FAIL"} ${status} ${u}`)
}
console.log(`\n${urls.length} URL(s), ${failed} failed. ${failed ? "SMOKE FAILED" : "SMOKE PASSED"}`)
process.exit(failed ? 1 : 0)
