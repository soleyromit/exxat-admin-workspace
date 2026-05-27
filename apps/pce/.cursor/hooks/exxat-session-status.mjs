#!/usr/bin/env node
/**
 * Exxat DS session-status — Cursor sessionStart hook.
 *
 * Prints a one-line status banner so the user can SEE that the brief-gate
 * is installed and active. If the user's Cursor instance was running BEFORE
 * `exxat-ui sync-extras` placed the hooks, this banner won't appear — that's
 * the cue to restart Cursor.
 *
 * It also injects a system reminder for the agent so it can't claim
 * ignorance of the brief protocol mid-session.
 */

"use strict"

import { existsSync, readFileSync } from "node:fs"
import { resolve } from "node:path"

function emit(payload) {
  process.stdout.write(JSON.stringify(payload))
  process.exit(0)
}

const cwd = process.cwd()
let pkgVersion = "unknown"
try {
  const uiPkgPath = resolve(cwd, "node_modules", "@exxatdesignux", "ui", "package.json")
  if (existsSync(uiPkgPath)) {
    pkgVersion = JSON.parse(readFileSync(uiPkgPath, "utf8")).version || "unknown"
  }
} catch {
  // best-effort; sessionStart should never fail closed
}

emit({
  // Cursor renders `additional_context` into the agent's system context at
  // session start. Use it to remind the agent of the protocol up front so it
  // can't pretend not to have seen the rules.
  additional_context:
    `[Exxat DS brief-gate active — @exxatdesignux/ui v${pkgVersion}]\n` +
    `Before editing any page / route / sidebar / template / hub client / ` +
    `wizard / settings card / store / nav config / mock data: load the ` +
    `exxat-senior-ux skill and post a design brief, then END THE TURN with ` +
    `"Ready to build — confirm or edit." and wait for the user.\n` +
    `Editing framework SHIM files (one-line re-exports from ` +
    `@exxatdesignux/ui/...) is almost always wrong — register new products ` +
    `with defineProduct() instead. See docs/exxat-ds/registering-a-product.md.`,
})
