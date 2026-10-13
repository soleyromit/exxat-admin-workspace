#!/usr/bin/env node
/**
 * Pre-edit checks — merged PreToolUse hook (one Node spawn instead of two).
 *
 * Combines exxat-brief-gate.mjs (the design brief / shim BLOCK gate) and
 * ds-snapshot-inject.mjs (real @exxatdesignux/ui export injection) into one
 * process so an edit pays one Node cold-start, not two.
 *
 * Contract preserved exactly:
 *   - brief-gate is the DECISION authority. Every "ask" path (shim file,
 *     design-critical path, new design-critical file) is emitted unchanged —
 *     the block is never weakened.
 *   - ds-snapshot-inject is purely additive. It only rides along on brief-gate's
 *     "allow" leaves, and only for product .tsx/.jsx files. When brief-gate asks,
 *     no DS list is injected (the point of the ask is "stop and post a brief",
 *     not "here are components") — matching prior effective behaviour.
 *
 * Fail-open: any parse/IO error falls through to a plain allow.
 */
"use strict"

import { readFileSync, existsSync } from "node:fs"
import { join } from "node:path"

function emit(payload) {
  process.stdout.write(JSON.stringify(payload))
  process.exit(0)
}

// ── ds-snapshot-inject: compute the real-DS agent_message (or null) ────────────
const PKG_CANDIDATES = [
  "apps/exam-management/admin/node_modules/@exxatdesignux/ui",
  "apps/pce/admin/node_modules/@exxatdesignux/ui",
  "apps/portal/node_modules/@exxatdesignux/ui",
  "node_modules/@exxatdesignux/ui",
]

function injectMessage(filePath) {
  const lower = filePath.toLowerCase().replace(/\\/g, "/")
  if (!lower.endsWith(".tsx") && !lower.endsWith(".jsx")) return null
  if (
    lower.includes("/node_modules/") ||
    lower.includes("/dist/") ||
    lower.includes("/.next/") ||
    lower.endsWith(".d.ts") ||
    lower.endsWith(".test.tsx") ||
    lower.endsWith(".spec.tsx")
  ) return null

  const projectDir = process.env.CLAUDE_PROJECT_DIR ?? process.cwd()
  let pkgDir = null
  for (const c of PKG_CANDIDATES) {
    const p = join(projectDir, c)
    if (existsSync(join(p, "dist/index.d.ts"))) { pkgDir = p; break }
  }
  if (!pkgDir) return null

  try {
    const version = JSON.parse(readFileSync(join(pkgDir, "package.json"), "utf8")).version
    const indexDts = readFileSync(join(pkgDir, "dist/index.d.ts"), "utf8")
    const names = new Set()
    for (const line of indexDts.split("\n")) {
      const m = line.match(/^export\s*\{([^}]*)\}\s*from\s*'\.[^']+'/)
      if (!m) continue
      for (let n of m[1].split(",")) {
        n = n.trim().replace(/^\w+\s+as\s+/, "")
        if (n && /^[A-Z]/.test(n)) names.add(n)
      }
    }
    if (names.size === 0) return null

    return [
      "╔══════════════════════════════════════════════════════════════════╗",
      `║  DS SOURCE — real @exxatdesignux/ui@${version} exports (installed)`,
      "╚══════════════════════════════════════════════════════════════════╝",
      "",
      "These are the ACTUAL exports from the installed package (not a snapshot).",
      "Cross-check EVERY import against this list. Not here → does not exist → do NOT hand-roll.",
      "For real props/variants/sizes of any component, run:",
      "  node tools/ds/source.mjs <Name>          (+ open http://localhost:4000/library/<id>)",
      "Generate AGAINST those types, never from training-data memory or *-reference.md.",
      "",
      [...names].sort().join("  ·  "),
      "",
      "Reminder — common violations to avoid:",
      "  P1: raw <button>            → <Button variant=… size=…>",
      "  P2: fontSize: N on icons    → text-xs / text-sm class",
      "  P3: px-3 py-2.5 rounded-lg  → flat border-b row pattern",
      "  P4: raw <input>/<select>/<table> → DS Input/Select/DataTable",
    ].join("\n")
  } catch {
    return null
  }
}

// brief-gate's "allow" leaf, augmented with the DS inject.
function allow(filePath) {
  const msg = filePath ? injectMessage(filePath) : null
  if (msg) emit({ permission: "allow", agent_message: msg })
  emit({ permission: "allow" })
}

// ── exxat-brief-gate: ask paths (block) — preserved verbatim ───────────────────
function askNewBrief(reason, path) {
  emit({
    permission: "ask",
    user_message:
      `Exxat DS brief-gate: about to CREATE a new design-critical surface.\n\n` +
      `What:   ${reason} (NEW file)\n` +
      `Where:  ${path}\n\n` +
      `Approve only if a design brief has already been posted AND confirmed ` +
      `in chat for this work. Otherwise reject and ask the agent to post the ` +
      `brief first, then retry the file creation.`,
    agent_message:
      `[exxat-brief-gate] HOLD. You are about to CREATE a new design-critical ` +
      `file (${reason}: ${path}).\n\n` +
      `REQUIRED next step (do not skip):\n` +
      `  1. Load the exxat-senior-ux skill (.cursor/skills/exxat-senior-ux/SKILL.md ` +
      `or .claude/skills/exxat-senior-ux/SKILL.md).\n` +
      `  2. Post the design brief in chat (Problem / User & frequency / Product / ` +
      `Scope / Persona / Job-to-be-done / Pattern / Reference (repo) / ` +
      `Reference (modern) / Principles applied / Deviations / Out of scope / ` +
      `Open questions).\n` +
      `  3. END THE TURN with "Ready to build — confirm or edit." and WAIT ` +
      `for the user's reply.\n` +
      `  4. If a brief was already posted and confirmed earlier in this chat, ` +
      `say that explicitly when requesting approval for this write.\n\n` +
      `Do NOT work around this by stuffing the new surface into an unrelated ` +
      `existing file just to avoid create-file prompts.\n\n` +
      `If a brief was already posted and confirmed earlier in this chat, ` +
      `point the user to it when requesting approval. Otherwise, post the ` +
      `brief now.`,
  })
}

function askBrief(reason, path) {
  emit({
    permission: "ask",
    user_message:
      `Exxat DS brief-gate: about to edit a design-critical surface.\n\n` +
      `What:   ${reason}\n` +
      `Where:  ${path}\n\n` +
      `Approve only if a design brief has been posted AND confirmed in chat ` +
      `for this work. Otherwise reject and ask the agent to post a brief ` +
      `first (Problem / Persona / Job-to-be-done / Pattern / Reference / ` +
      `Open questions).`,
    agent_message:
      `[exxat-brief-gate] HOLD. You are about to edit a design-critical surface ` +
      `(${reason}: ${path}).\n\n` +
      `Before continuing you MUST:\n` +
      `  1. Load the exxat-senior-ux skill (.claude/skills/exxat-senior-ux/SKILL.md ` +
      `or .cursor/skills/exxat-senior-ux/SKILL.md).\n` +
      `  2. Post the design brief in chat (Problem / User & frequency / Product / ` +
      `Scope / Persona / Job-to-be-done / Pattern / Reference (repo) / ` +
      `Reference (modern) / Principles applied / Deviations / Out of scope / ` +
      `Open questions).\n` +
      `  3. END THE TURN with "Ready to build — confirm or edit." and WAIT ` +
      `for the user's reply.\n\n` +
      `If a brief was already posted and confirmed earlier in this chat, ` +
      `mention that explicitly when requesting approval so the user can ` +
      `recognise it.`,
  })
}

function askShim(path, packageEntry) {
  emit({
    permission: "ask",
    user_message:
      `Exxat DS brief-gate: about to edit a FRAMEWORK SHIM.\n\n` +
      `Where:  ${path}\n` +
      `Why it's a shim: this file just re-exports from ` +
      `\`@exxatdesignux/ui/${packageEntry}\`. The real framework code lives ` +
      `inside the published package — editing this file is almost always wrong.\n\n` +
      `If the agent is trying to add a new product, the correct path is ` +
      `\`defineProduct() + registerProducts()\` in your own code (see ` +
      `\`docs/exxat-ds/registering-a-product.md\`). It is NOT a change to ` +
      `the framework's built-in constants.\n\n` +
      `Reject this edit unless you have a very specific reason to fork the shim.`,
    agent_message:
      `[exxat-brief-gate] STOP. You are about to edit a framework SHIM file ` +
      `(${path}). This file is a one-liner that re-exports from ` +
      `\`@exxatdesignux/ui/${packageEntry}\`. Editing it is almost always ` +
      `wrong.\n\n` +
      `Common mistakes this catches:\n` +
      `  - Adding a new product slug to PRODUCT_SLUGS / Product union.\n` +
      `    → Wrong layer. Use defineProduct() + registerProducts() in the ` +
      `consumer app's product-registration code. Customer apps register ` +
      `their own products via the public API, they do NOT mutate the ` +
      `framework's built-in enum.\n` +
      `  - Adding new routes to product-routing.\n` +
      `    → Wrong layer. Add the route under the product's URL root ` +
      `(e.g. /assessment/courses) in routes.tsx; the framework's routing ` +
      `helpers don't need to know about per-product pages.\n` +
      `  - Tweaking the Zustand store / migrations.\n` +
      `    → Wrong layer. Open an issue against @exxatdesignux/ui or extend ` +
      `via composition in your own code; don't fork the shim.\n\n` +
      `Read \`docs/exxat-ds/registering-a-product.md\` and the ` +
      `\`exxat-product-context\` / \`exxat-product-routing\` rules, then ` +
      `propose the correct change.`,
  })
}

const DESIGN_CRITICAL_PATTERNS = [
  { test: /(^|\/)src\/views\//, label: "page view" },
  { test: /(^|\/)src\/pages\//, label: "page" },
  { test: /(^|\/)(?:src\/)?routes\.(?:tsx?|jsx?)$/, label: "route map" },
  { test: /(^|\/)(?:src\/)?App\.(?:tsx?|jsx?)$/, label: "root App component" },
  { test: /(^|\/)index\.html$/, label: "root index.html" },
  { test: /(^|\/)components\/sidebar\//, label: "sidebar component" },
  { test: /(^|\/)components\/(?:app-sidebar|product-switcher|team-switcher|site-header|nav-main|nav-user|secondary-panel|breadcrumbs-from-router)\.(?:tsx?|jsx?)$/, label: "workspace chrome" },
  { test: /(^|\/)components\/templates\//, label: "page template" },
  { test: /(^|\/)components\/data-views\//, label: "data view" },
  { test: /-page-header\.(?:tsx|jsx)$/, label: "page header" },
  { test: /(^|\/)components\/[^/]+-(?:table|hub|client|page)\.(?:tsx|jsx)$/, label: "hub composition" },
  { test: /(^|\/)components\/[^/]+-(?:form|drawer|sheet|dialog|wizard)\.(?:tsx|jsx)$/, label: "workflow surface" },
  { test: /settings-.*-card\.(?:tsx|jsx)$/, label: "settings card" },
  { test: /-wizard\.(?:tsx|jsx)$/, label: "wizard" },
  { test: /-flow\.(?:tsx|jsx)$/, label: "user flow" },
  { test: /new-.*-form\.(?:tsx|jsx)$/, label: "creation form" },
  { test: /(^|\/)stores\/.*\.(?:tsx?|jsx?)$/, label: "store / state file" },
  { test: /(^|\/)lib\/(?:mock\/)?navigation\.(?:tsx?|jsx?)$/, label: "navigation config" },
  { test: /(^|\/)lib\/mock\//, label: "mock data" },
  { test: /(^|\/)lib\/product-(?:brand|routing|ref|registry)\.(?:tsx?|jsx?)$/, label: "product framework config" },
  { test: /(^|\/)lib\/brand-(?:accent-color|color-match)\.(?:tsx?|jsx?)$/, label: "brand colour config" },
  { test: /(^|\/)lib\/exxat-palette\.(?:tsx?|jsx?)$/, label: "Exxat palette" },
  { test: /(^|\/)contexts\/(?:product-context|product-route-sync|product-root-gate|default-product-redirect)\.(?:tsx?|jsx?)$/, label: "product shell context" },
]

// ── Stdin → decision ──────────────────────────────────────────────────────────
let stdin = ""
process.stdin.setEncoding("utf8")
process.stdin.on("data", (chunk) => { stdin += chunk })
process.stdin.on("end", () => {
  let input
  try {
    input = JSON.parse(stdin || "{}")
  } catch {
    emit({ permission: "allow" })
    return
  }

  const toolInput = input.tool_input ?? input.toolInput ?? {}
  const filePath =
    toolInput.path ??
    toolInput.file_path ??
    toolInput.target_file ??
    toolInput.target_notebook ??
    toolInput.relative_workspace_path ??
    toolInput.filePath ??
    ""

  if (typeof filePath !== "string" || filePath.length === 0) {
    emit({ permission: "allow" })
    return
  }

  const normalized = filePath.replace(/\\/g, "/")
  const lower = normalized.toLowerCase()

  // Non-source paths: brief-gate allows. Inject only fires on .tsx/.jsx, so
  // allow(normalized) still does the right thing (returns plain allow here).
  if (
    lower.endsWith(".md") ||
    lower.endsWith(".mdx") ||
    lower.endsWith(".json") ||
    lower.endsWith(".css") ||
    lower.endsWith(".scss") ||
    lower.endsWith(".d.ts") ||
    lower.endsWith(".test.ts") ||
    lower.endsWith(".test.tsx") ||
    lower.includes("/__tests__/") ||
    lower.includes("/test/") ||
    lower.includes("/tests/") ||
    lower.includes("/node_modules/") ||
    lower.includes("/dist/") ||
    lower.includes("/.next/") ||
    lower.includes("/build/")
  ) {
    allow(normalized)
    return
  }

  const isSource = /\.(?:tsx?|jsx?)$/.test(lower) || lower.endsWith("/index.html") || lower.endsWith("index.html")
  if (!isSource) {
    allow(normalized)
    return
  }

  // Step 1: shim-file detection (highest priority) → ask
  try {
    if (existsSync(normalized)) {
      const content = readFileSync(normalized, "utf8")
      const stripped = content
        .replace(/\/\*[\s\S]*?\*\//g, "")
        .replace(/^\s*\/\/.*$/gm, "")
        .replace(/^\s*[\r\n]/gm, "")
        .trim()
      const shimMatch = stripped.match(/^export\s+(?:\*|\{[\s\S]*?\})\s+from\s+["']@exxatdesignux\/ui\/([^"']+)["']\s*;?\s*$/)
      if (shimMatch) {
        askShim(normalized, shimMatch[1])
        return
      }
    }
  } catch {
    // fall through
  }

  // Step 2: design-critical path patterns → ask
  for (const { test, label } of DESIGN_CRITICAL_PATTERNS) {
    if (test.test(normalized)) {
      if (!existsSync(normalized)) askNewBrief(label, normalized)
      else askBrief(label, normalized)
      return
    }
  }

  // Not design-critical → allow + DS inject (for product .tsx/.jsx)
  allow(normalized)
})
