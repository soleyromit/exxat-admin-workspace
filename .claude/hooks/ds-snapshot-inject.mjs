#!/usr/bin/env node
/**
 * DS Snapshot Inject — PreToolUse hook.
 *
 * Fires before Write / Edit / MultiEdit on .tsx and .jsx files.
 * Reads docs/foundations/ds-snapshot.json and injects the full admin
 * component exports list as agent_message so Claude always has the current
 * DS API in context before writing any TSX.
 *
 * This prevents Claude from writing DS imports from training-data memory.
 * If a component name isn't in the exports list, it doesn't exist in the DS.
 *
 * Permission is always "allow" — this hook is advisory, never blocking.
 * Failures fall through to allow so a missing snapshot never breaks writes.
 */

"use strict"

import { readFileSync, existsSync } from "node:fs"
import { resolve, join } from "node:path"

function emit(payload) {
  process.stdout.write(JSON.stringify(payload))
  process.exit(0)
}

function allow() {
  emit({ permission: "allow" })
}

function allowWithMessage(msg) {
  emit({ permission: "allow", agent_message: msg })
}

let stdin = ""
process.stdin.setEncoding("utf8")
process.stdin.on("data", chunk => { stdin += chunk })
process.stdin.on("end", () => {
  let input
  try {
    input = JSON.parse(stdin || "{}")
  } catch {
    allow()
    return
  }

  const toolInput = input.tool_input ?? input.toolInput ?? {}
  const filePath =
    toolInput.path ??
    toolInput.file_path ??
    toolInput.target_file ??
    toolInput.relative_workspace_path ??
    toolInput.filePath ??
    ""

  if (typeof filePath !== "string" || filePath.length === 0) {
    allow()
    return
  }

  const lower = filePath.toLowerCase().replace(/\\/g, "/")

  // Only fire for TSX/JSX files — DS components only live there.
  if (!lower.endsWith(".tsx") && !lower.endsWith(".jsx")) {
    allow()
    return
  }

  // Skip non-product files.
  if (
    lower.includes("/node_modules/") ||
    lower.includes("/dist/") ||
    lower.includes("/.next/") ||
    lower.endsWith(".d.ts") ||
    lower.endsWith(".test.tsx") ||
    lower.endsWith(".spec.tsx")
  ) {
    allow()
    return
  }

  // Locate ds-snapshot.json — try project dir first, then cwd.
  const projectDir = process.env.CLAUDE_PROJECT_DIR ?? process.cwd()
  const snapshotPaths = [
    join(projectDir, "docs/foundations/ds-snapshot.json"),
    join(projectDir, "docs/watch/ds-snapshot.json"),
    resolve("docs/foundations/ds-snapshot.json"),
    resolve("docs/watch/ds-snapshot.json"),
  ]

  let snapshot = null
  for (const p of snapshotPaths) {
    try {
      if (existsSync(p)) {
        snapshot = JSON.parse(readFileSync(p, "utf8"))
        break
      }
    } catch {
      // try next
    }
  }

  if (!snapshot) {
    allow()
    return
  }

  try {
    const adminExports = snapshot?.profiles?.admin?.exports ?? []
    if (adminExports.length === 0) {
      allow()
      return
    }

    // Build a compact readable list, sorted.
    const sorted = [...adminExports].sort()

    const msg = [
      "╔══════════════════════════════════════════════════════════════════╗",
      "║  DS SNAPSHOT — valid @exxatdesignux/ui exports (admin profile)  ║",
      "╚══════════════════════════════════════════════════════════════════╝",
      "",
      "Cross-check EVERY import you write against this list.",
      "If a name is not here → it does not exist in the DS.",
      "Do NOT write from training-data memory.",
      "",
      sorted.join("  ·  "),
      "",
      "Reminder — common violations to avoid:",
      "  P1: raw <button>            → <Button variant=… size=…>",
      "  P2: fontSize: N on icons    → text-xs / text-sm class",
      "  P3: px-3 py-2.5 rounded-lg  → flat border-b row pattern",
      "  P4: raw <input>/<select>/<table> → DS Input/Select/DataTable",
    ].join("\n")

    allowWithMessage(msg)
  } catch {
    allow()
  }
})
