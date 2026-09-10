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

const graphifyActive = existsSync(resolve(cwd, "graphify-out", "graph.json"))
const graphifyBlock = graphifyActive
  ? `[Exxat DS Graphify active]\n` +
    `graphify-out/ is local and gitignored. Glob will not see GRAPH_REPORT.md.\n` +
    `For architecture, dependency, impact, ownership, or broad where/how questions: ` +
    `MUST run via Shell first: graphify query "<question>" --budget 1200\n` +
    `Then Read only the returned source files. Do not launch explore agents or broad Grep first.\n` +
    `Do not read GRAPH_REPORT.md in full. After code edits: graphify update .`
  : `[Exxat DS Graphify missing]\n` +
    `graphify-out/graph.json not found. Skip Graphify until ` +
    `\`graphify extract . --code-only\` or \`graphify update .\` has been run.`

emit({
  // Cursor renders `additional_context` into the agent's system context at
  // session start. Use it to remind the agent of the protocol up front so it
  // can't pretend not to have seen the rules.
  additional_context:
    `[Exxat DS v${pkgVersion}] New page/hub/wizard: post a brief, then ` +
    `"Ready to build — confirm or edit." screenshot/mockup = IA only. ` +
    `Run the surface router before DS docs. Do not load senior-ux or ` +
    `token-economy unless IA is undecided. Shims: use defineProduct(), ` +
    `do not edit package re-exports.\n\n` +
    graphifyBlock,
})
