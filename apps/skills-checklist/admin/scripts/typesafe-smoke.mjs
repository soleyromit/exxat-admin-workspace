#!/usr/bin/env node
// Live smoke for the TypeSafe import assist. Skips (exit 0) when TYPESAFE_API_KEY is not set. Never prints the key.
// Usage: pnpm smoke:typesafe   (reads TYPESAFE_API_KEY from the environment or from .env.local)
import { spawnSync } from "node:child_process"
import { existsSync, readFileSync } from "node:fs"
import { resolve } from "node:path"

const root = resolve(import.meta.dirname, "..")
const env = { ...process.env }
const file = resolve(root, ".env.local")
if (!(env.TYPESAFE_API_KEY ?? "").trim() && existsSync(file)) {
  for (const line of readFileSync(file, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*TYPESAFE_API_KEY\s*=\s*(.*)\s*$/)
    if (m) env.TYPESAFE_API_KEY = m[1].replace(/^["']|["']$/g, "")
  }
}
if (!(env.TYPESAFE_API_KEY ?? "").trim()) {
  console.log("no TYPESAFE_API_KEY, skipped")
  process.exit(0)
}
env.SMOKE = "1"
const r = spawnSync("pnpm", ["exec", "vitest", "run", "scripts/typesafe-smoke.live.test.ts", "--reporter=basic"], { cwd: root, env, stdio: "inherit" })
process.exit(r.status ?? 1)
