#!/usr/bin/env node
/**
 * Exxat DS brief-gate — Cursor preToolUse hook.
 *
 * Fires before Write / StrReplace / Edit / EditNotebook tool calls. Inspects
 * the target file path AND content; if the file is a design-critical surface
 * (page, route, sidebar, template, wizard, settings card, store, nav config,
 * route map, mock data, etc.), the hook converts the tool call into an `ask`
 * checkpoint and reminds the agent to load `exxat-senior-ux` + post a design
 * brief BEFORE writing code.
 *
 * If the target is a FRAMEWORK SHIM (single-line `export * from
 * "@exxatdesignux/ui/…"`), the hook returns `ask` with a stronger message
 * telling the agent the file is intentionally inert and that any product
 * registration belongs in a `defineProduct()` call inside the consumer's own
 * code (NOT a hack to the framework's internal constants).
 *
 * Why this exists
 *   The `exxat-ux-discovery-protocol.mdc` rule is `alwaysApply: true`, but
 *   agents have been observed skipping the brief checkpoint when the prompt
 *   "feels like" a refactor or a one-class restyle. This hook is the
 *   programmatic floor: even when the agent forgets, the USER sees the
 *   proposed edit and approves (or rejects) it before any file changes.
 *
 * Behavior
 *   - Shim file (re-exports from @exxatdesignux/ui) → `permission: "ask"` + shim message
 *   - Design-critical path                          → `permission: "ask"` + brief message
 *   - Everything else                               → silent `permission: "allow"`
 *
 * Non-blocking by default: failures fall through to `allow` so a missing
 * Node binary or malformed input never breaks the agent.
 */

"use strict"

import { readFileSync, existsSync } from "node:fs"

function emit(payload) {
  process.stdout.write(JSON.stringify(payload))
  process.exit(0)
}

function allow() {
  emit({ permission: "allow" })
}

// NEW design-critical files still require the brief checkpoint, but we surface
// them with `ask` instead of a hard deny.
//
// Why not deny: the hard block prevented legitimate post-brief work in
// consumer apps because the hook has no persisted "brief already approved"
// state. Agents got trapped and started stuffing whole surfaces into unrelated
// existing files just to avoid `create_file` failures.
//
// Why still ask: creating a NEW design-critical file is a real design
// decision, so the user should still see and approve it before the write runs.
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

// ── Path classifiers ──────────────────────────────────────────────────────

// All patterns anchor with `(^|\/)` so they fire for both relative
// (`stores/app-store.ts`) and absolute (`/Users/.../stores/app-store.ts`)
// paths. Cursor sometimes passes one, sometimes the other, depending on the
// tool. Failing to anchor was a 0.6.0/0.6.1 bug — see RELEASES 0.6.2.
const DESIGN_CRITICAL_PATTERNS = [
  // Pages / routes
  { test: /(^|\/)src\/views\//, label: "page view" },
  { test: /(^|\/)src\/pages\//, label: "page" },
  { test: /(^|\/)(?:src\/)?routes\.(?:tsx?|jsx?)$/, label: "route map" },
  { test: /(^|\/)(?:src\/)?App\.(?:tsx?|jsx?)$/, label: "root App component" },
  { test: /(^|\/)index\.html$/, label: "root index.html" },

  // Workspace chrome
  { test: /(^|\/)components\/sidebar\//, label: "sidebar component" },
  { test: /(^|\/)components\/(?:app-sidebar|product-switcher|team-switcher|site-header|nav-main|nav-user|secondary-panel|breadcrumbs-from-router)\.(?:tsx?|jsx?)$/, label: "workspace chrome" },

  // Page-scale composition — React-component suffixes MUST be .tsx/.jsx only.
  //
  // The original 0.6.0–0.6.5 patterns used `.(?:tsx?|jsx?)$` (matching .ts too),
  // which was a false-positive magnet: `api-client.ts`, `http-client.ts`,
  // `auth-client.ts`, and any helper ending in `-client.ts` would deny.
  // Hub clients (`placements-client.tsx`, etc.) and page headers /
  // wizards / forms / settings cards in the DS are React components,
  // so .tsx/.jsx is the correct extension match — never plain .ts.
  { test: /(^|\/)components\/templates\//, label: "page template" },
  { test: /(^|\/)components\/data-views\//, label: "data view" },
  { test: /-page-header\.(?:tsx|jsx)$/, label: "page header" },
  { test: /(^|\/)components\/[^/]+-(?:table|hub|client|page)\.(?:tsx|jsx)$/, label: "hub composition" },
  { test: /(^|\/)components\/[^/]+-(?:form|drawer|sheet|dialog|wizard)\.(?:tsx|jsx)$/, label: "workflow surface" },

  // Settings cards (Settings → Appearance, Settings → Add product, etc.)
  { test: /settings-.*-card\.(?:tsx|jsx)$/, label: "settings card" },

  // Wizards & flows
  { test: /-wizard\.(?:tsx|jsx)$/, label: "wizard" },
  { test: /-flow\.(?:tsx|jsx)$/, label: "user flow" },
  { test: /new-.*-form\.(?:tsx|jsx)$/, label: "creation form" },

  // Store + framework state
  { test: /(^|\/)stores\/.*\.(?:tsx?|jsx?)$/, label: "store / state file" },

  // Nav + mock data + product registration
  { test: /(^|\/)lib\/(?:mock\/)?navigation\.(?:tsx?|jsx?)$/, label: "navigation config" },
  { test: /(^|\/)lib\/mock\//, label: "mock data" },
  { test: /(^|\/)lib\/product-(?:brand|routing|ref|registry)\.(?:tsx?|jsx?)$/, label: "product framework config" },
  { test: /(^|\/)lib\/brand-(?:accent-color|color-match)\.(?:tsx?|jsx?)$/, label: "brand colour config" },
  { test: /(^|\/)lib\/exxat-palette\.(?:tsx?|jsx?)$/, label: "Exxat palette" },

  // Contexts that wire the shell
  { test: /(^|\/)contexts\/(?:product-context|product-route-sync|product-root-gate|default-product-redirect)\.(?:tsx?|jsx?)$/, label: "product shell context" },
]

// ── Stdin → decision ──────────────────────────────────────────────────────

let stdin = ""
process.stdin.setEncoding("utf8")
process.stdin.on("data", (chunk) => { stdin += chunk })
process.stdin.on("end", () => {
  let input
  try {
    input = JSON.parse(stdin || "{}")
  } catch {
    allow()
    return
  }

  const toolInput = input.tool_input ?? input.toolInput ?? {}
  // Cursor passes the target path under DIFFERENT keys depending on which
  // tool the agent called. Missing one of these = silent allow = brief-gate
  // is a no-op (this is how 0.6.0–0.6.3 leaked the courses-page bug in
  // test-6/my-app — the hook fired but `filePath` was empty because Cursor's
  // `edit_file` tool sends `target_file`, not `path`).
  //
  //   Claude-native tools (Write, StrReplace, EditNotebook)   → `path` / `target_notebook`
  //   Cursor edit_file / write_file / search_replace          → `target_file`
  //   Older Cursor (pre-1.x)                                  → `relative_workspace_path`
  //   Some agents serialise camelCase                         → `filePath`
  //
  // The regression test in `exxat-ui doctor` exercises every shape — DO NOT
  // drop a key without adding a doctor smoke test for the new shape.
  const filePath =
    toolInput.path ??
    toolInput.file_path ??
    toolInput.target_file ??
    toolInput.target_notebook ??
    toolInput.relative_workspace_path ??
    toolInput.filePath ??
    ""

  if (typeof filePath !== "string" || filePath.length === 0) {
    allow()
    return
  }

  const normalized = filePath.replace(/\\/g, "/")
  const lower = normalized.toLowerCase()

  // Always allow obvious non-source paths.
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
    allow()
    return
  }

  // Gate only source files. We additionally gate `.html` for index.html
  // and `.ts(x)/.js(x)` for everything else.
  const isSource = /\.(?:tsx?|jsx?)$/.test(lower) || lower.endsWith("/index.html") || lower.endsWith("index.html")
  if (!isSource) {
    allow()
    return
  }

  // ── Step 1: shim-file detection (highest priority) ──────────────────────
  //
  // If the file exists AND its content is a one-line `export * from
  // "@exxatdesignux/ui/<entry>"`, treat ANY edit as a shim violation. Shim
  // files are intentionally inert; editing them is almost always wrong.
  try {
    if (existsSync(normalized)) {
      const content = readFileSync(normalized, "utf8")
      // Strip JSDoc / line comments / blank lines, keep only real statements
      const stripped = content
        .replace(/\/\*[\s\S]*?\*\//g, "")
        .replace(/^\s*\/\/.*$/gm, "")
        .replace(/^\s*[\r\n]/gm, "")
        .trim()
      // Match either `export * from "..."` or `export { ... } from "..."`
      const shimMatch = stripped.match(/^export\s+(?:\*|\{[\s\S]*?\})\s+from\s+["']@exxatdesignux\/ui\/([^"']+)["']\s*;?\s*$/)
      if (shimMatch) {
        askShim(normalized, shimMatch[1])
        return
      }
    }
  } catch {
    // If we can't read the file (new file, permission issue, etc.) fall through.
  }

  // ── Step 2: design-critical path patterns ───────────────────────────────
  //
  // Decision matrix:
  //
  //   File exists | Pattern match | Decision
  //   ------------|---------------|--------------------------------------
  //   yes         | yes           | ask  (edit to existing design-critical
  //               |               |       surface — could be legit bug fix
  //               |               |       or copy tweak; surface to user)
  //   no          | yes           | ask  (creating a NEW design-critical
  //               |               |       surface = pure design decision,
  //               |               |       must go through brief checkpoint)
  //   yes / no    | no            | allow
  //
  // New-file and existing-file edits both surface to the user. The hook does
  // not attempt to persist brief-approval state across turns.
  for (const { test, label } of DESIGN_CRITICAL_PATTERNS) {
    if (test.test(normalized)) {
      const isNewFile = !existsSync(normalized)
      if (isNewFile) {
        askNewBrief(label, normalized)
      } else {
        askBrief(label, normalized)
      }
      return
    }
  }

  // ── Step 3: banned-pattern content checks (TSX/JSX only) ────────────────
  //
  // These fire on ANY .tsx/.jsx write — not just design-critical paths.
  // They catch the four most common DS violations before the file is written.
  // Permission is `ask` not `deny` so legitimate post-contract writes are
  // not blocked (the user approves the write they already confirmed in chat).
  if (lower.endsWith(".tsx") || lower.endsWith(".jsx")) {
    // Extract written content from whatever tool is being used.
    const writtenContent =
      toolInput.content ??                                       // Write
      toolInput.new_string ??                                    // Edit / StrReplace
      (Array.isArray(toolInput.edits)
        ? toolInput.edits.map(e => e.new_string ?? "").join("\n") // MultiEdit
        : "") ??
      ""

    if (typeof writtenContent === "string" && writtenContent.length > 0) {
      // P1 — raw <button (lowercase b, not a DS Button component)
      // Match `<button` but not `<Button` (capital = DS component).
      if (/<button[\s>]/.test(writtenContent)) {
        emit({
          permission: "ask",
          user_message:
            `[P1 — raw <button>] About to write a raw HTML <button> element.\n` +
            `Path: ${normalized}\n\n` +
            `Use DS <Button variant="…" size="…"> instead. ` +
            `Approve only if this is an intentional exception with a written reason.`,
          agent_message:
            `[exxat-brief-gate P1] HOLD. You are writing a raw <button> element ` +
            `(${normalized}).\n\n` +
            `RULE: Never use raw <button> — use DS <Button variant=… size=…>.\n` +
            `Available variants: default · outline · ghost · secondary · destructive · link\n` +
            `Available sizes: default · sm · lg · icon · icon-sm\n\n` +
            `If this is a selectable list item / radio tile:\n` +
            `  → Use <RadioGroup> + <RadioGroupItem className="sr-only"> + <label> wrapping.\n` +
            `  → Pattern: assessment-builder-client.tsx:4085\n\n` +
            `If you have a written exception reason, state it in your next message.`,
        })
        return
      }

      // P2 — inline fontSize in style prop
      // Catches: style={{ fontSize: 12 }}, style={{ fontSize: "13px" }}, etc.
      if (/style=\{[^}]*fontSize\s*:/.test(writtenContent)) {
        emit({
          permission: "ask",
          user_message:
            `[P2 — inline fontSize] About to write inline fontSize in a style prop.\n` +
            `Path: ${normalized}\n\n` +
            `Use Tailwind text-xs (12px) / text-sm (14px) / text-base (16px) classes instead.\n` +
            `For FA icons specifically: add the class directly to the <i> element.\n` +
            `Approve only if this is an intentional exception.`,
          agent_message:
            `[exxat-brief-gate P2] HOLD. You are writing inline fontSize in a style prop ` +
            `(${normalized}).\n\n` +
            `RULE: Never write fontSize: N inside a style prop.\n` +
            `USE INSTEAD:\n` +
            `  FA icon small:    className="... text-xs"  (= 12px)\n` +
            `  FA icon medium:   className="... text-sm"  (= 14px)\n` +
            `  FA icon large:    className="... text-base" (= 16px)\n` +
            `  Conditional color: className={\`... \${active ? "text-[var(--brand-color)]" : "text-muted-foreground"}\`}\n` +
            `  Color + size together: className="text-sm text-muted-foreground"\n\n` +
            `If you have a written exception reason, state it.`,
        })
        return
      }

      // P3 — banned card row pattern
      // Catches the "Claude vanilla" px-3 py-2.5 + rounded-lg + border combo.
      if (/px-3\s+py-2\.5/.test(writtenContent) && /rounded-lg/.test(writtenContent) && /border/.test(writtenContent)) {
        emit({
          permission: "ask",
          user_message:
            `[P3 — banned card row] About to write the banned px-3 py-2.5 rounded-lg border pattern.\n` +
            `Path: ${normalized}\n\n` +
            `This is the "Claude vanilla design" card-row anti-pattern. ` +
            `Use flat border-b rows instead: className="flex items-center gap-3 border-b border-border px-4 py-3"\n` +
            `Approve only if this is an intentional exception.`,
          agent_message:
            `[exxat-brief-gate P3] HOLD. You are writing the banned card-row pattern ` +
            `(px-3 py-2.5 rounded-lg border) in ${normalized}.\n\n` +
            `RULE: This is "Claude vanilla design" — banned.\n` +
            `USE INSTEAD for list rows:\n` +
            `  className="flex items-center gap-3 border-b border-border px-4 py-3"\n` +
            `USE INSTEAD for selectable tiles:\n` +
            `  className="rounded-lg border border-border p-[10px_14px] cursor-pointer has-[[data-state=checked]]:border-[var(--brand-color)] has-[[data-state=checked]]:bg-[var(--brand-tint)]"\n\n` +
            `If you have a written exception reason, state it.`,
        })
        return
      }

      // P4 — raw HTML form/table elements (not DS components)
      // Catches: <input , <select , <table  (with space or > after, to avoid false positives)
      // Does NOT catch: Input, Select, DataTable (capital = DS component)
      const rawHtmlMatch = writtenContent.match(/<(input|select|table)[\s>]/)
      if (rawHtmlMatch) {
        const el = rawHtmlMatch[1]
        const dsMap = { input: "DS <Input>", select: "DS <Select>", table: "DS DataTable (import from '@/components/data-table')" }
        emit({
          permission: "ask",
          user_message:
            `[P4 — raw HTML <${el}>] About to write a raw HTML <${el}> element.\n` +
            `Path: ${normalized}\n\n` +
            `Use ${dsMap[el]} instead.\n` +
            `Approve only if this is an intentional exception with a written reason.`,
          agent_message:
            `[exxat-brief-gate P4] HOLD. You are writing a raw HTML <${el}> element ` +
            `(${normalized}).\n\n` +
            `RULE: Never write raw <${el}> — use ${dsMap[el]}.\n` +
            `Import from '@exxatdesignux/ui'.\n\n` +
            `Exception valid for: date inputs (DS has DatePickerField), ` +
            `canvas, SVG internals, or vendor code you do not own.\n` +
            `State your exception reason if applicable.`,
        })
        return
      }
    }
  }

  allow()
})
