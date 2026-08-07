#!/usr/bin/env node
/**
 * Exxat DS content check — Cursor/Claude postToolUse hook.
 *
 * Why this exists
 *   `exxat-brief-gate.mjs` (preToolUse) only checks the file PATH — it gates
 *   "was a brief posted", never the actual diff content. `react-doctor.sh`
 *   (postToolUse) reads content but is a generic third-party React scanner
 *   with zero Exxat-DS domain knowledge. Every other rule (reuse-before-custom,
 *   correct cell primitive, no tabs-in-tabs, table edge inset) lives ONLY as
 *   prose in `.mdc` rules / `SKILL.md` files that an agent must voluntarily
 *   recall on every single edit — which is exactly how the same class of
 *   mistake (raw `Badge` instead of `StatusBadge`/`PillCell`, a second
 *   hand-rolled favorite-star component, tabs nested inside tabs, a padded
 *   wrapper double-guttering a `HubTable`) recurred across many turns of one
 *   session. See the audit in that session's transcript for the full writeup.
 *
 *   This hook is the automated, always-on floor for that specific, narrow
 *   set of previously-observed mistakes. It reads the file just written and
 *   flags only patterns that have actually caused a real bug in this repo —
 *   it is NOT a general linter and MUST NOT grow into one; add a check here
 *   only when a real recurring mistake justifies it.
 *
 * Behavior
 *   - No findings                 → silent (no output)
 *   - One or more findings        → `additional_context` with a short,
 *     citation-bearing list the agent should verify against before finishing
 *   - Any internal error          → silent (never blocks, never throws)
 *
 * This hook never blocks a write (it runs postToolUse, after the file is
 * already saved) — it only nudges self-correction before the turn ends,
 * closing the "no post-flight check" gap that the pre-flight-only
 * `exxat-token-economy` skill left open.
 */

"use strict"

import { readFileSync, existsSync } from "node:fs"

function emit(payload) {
  process.stdout.write(JSON.stringify(payload))
  process.exit(0)
}

function silent() {
  emit({})
}

/** Isolate the exam-lock action row — avoid matching inner `) : null}` from retry/primary ternaries. */
function extractExamLockActionsBlock(content) {
  const slotMarker = 'data-slot="exam-lock-action-row"'
  const slotIdx = content.indexOf(slotMarker)
  if (slotIdx !== -1) {
    const divStart = content.lastIndexOf("<div", slotIdx)
    const tail = content.slice(slotIdx)
    const close = tail.match(/<\/div>\s*\n\s*\) : null\}/)
    if (divStart !== -1 && close) {
      return content.slice(divStart, slotIdx + close.index + close[0].length)
    }
  }
  const legacy = content.match(/\{showActions \? \(\s*<div[\s\S]*<\/div>\s*\) : null\}/)
  return legacy?.[0] ?? ""
}

let stdin = ""
process.stdin.setEncoding("utf8")
process.stdin.on("data", chunk => {
  stdin += chunk
})
process.stdin.on("end", () => {
  try {
    run()
  } catch {
    silent()
  }
})

function run() {
  const input = JSON.parse(stdin || "{}")
  const toolInput = input.tool_input ?? input.toolInput ?? {}
  // Same key fan-out as exxat-brief-gate.mjs — Cursor/Claude send the target
  // path under different keys depending on the tool that fired.
  const filePath =
    toolInput.path ??
    toolInput.file_path ??
    toolInput.target_file ??
    toolInput.target_notebook ??
    toolInput.relative_workspace_path ??
    toolInput.filePath ??
    ""

  if (typeof filePath !== "string" || filePath.length === 0) return silent()

  const normalized = filePath.replace(/\\/g, "/")
  if (!/\.(?:tsx|jsx)$/.test(normalized)) return silent()
  if (!existsSync(normalized)) return silent()
  if (normalized.includes("/node_modules/") || normalized.includes("/.next/")) return silent()

  let content
  try {
    content = readFileSync(normalized, "utf8")
  } catch {
    return silent()
  }

  const findings = []

  // ── Table/hub composition files: cell primitive selection ────────────────
  // (`.cursor/rules/exxat-table-column-cells.mdc`)
  const isTableSurface =
    /(?:-table|-client|-hub)\.(?:tsx|jsx)$/.test(normalized) &&
    !/\/(?:table-cells|columns-showcase|hub-table)\.(?:tsx|jsx)$/.test(normalized)

  if (isTableSurface) {
    if (/<Badge[\s>]/.test(content) && !content.includes("StatusBadge")) {
      findings.push(
        "Raw `<Badge>` in a table/hub file with no `StatusBadge` import. " +
          "Status → `StatusBadge` (tone + icon + size); type/kind classifier → `PillCell`. " +
          "Raw `Badge` is rarely the right call in a table cell " +
          "(`.cursor/rules/exxat-table-column-cells.mdc`).",
      )
    }

    if (
      /function\s+\w*Favorite\w*\s*\(/.test(content) &&
      !/from ["']@\/components\/(?:ui\/favorite-toggle-button|data-views)["']/.test(content)
    ) {
      findings.push(
        "A local `Favorite*` function is defined here without importing " +
          "`FavoriteToggleButton`/`FavoriteNameCell` from `@/components/ui/favorite-toggle-button` " +
          "or `@/components/data-views`. Confirm no shared primitive already covers this before " +
          "keeping a bespoke one (`.cursor/rules/exxat-reuse-before-custom.mdc`).",
      )
    }
  }

  // ── Tabs-in-tabs IA nesting ────────────────────────────────────────────
  // (`.cursor/rules/exxat-tabs-chrome.mdc`)
  const tabsContentBlocks = content.match(/<TabsContent\b[\s\S]*?<\/TabsContent>/g) ?? []
  if (tabsContentBlocks.some(block => /<Tabs\b/.test(block))) {
    findings.push(
      "A `<TabsContent>` block contains a nested `<Tabs>`. Tabs-inside-tabs reads as two " +
        "primary nav levels — use `ViewSegmentedControl`/`ButtonSegmentedControl` for an inner " +
        "mode switch, or promote the nested view to its own route/panel " +
        "(`.cursor/rules/exxat-tabs-chrome.mdc`).",
    )
  }

  // ── Double horizontal padding around HubTable/DataTable ───────────────
  // This exact regression (a `px-4`/`px-6` wrapper double-guttering a table
  // that already owns its own edge inset) recurred repeatedly in this repo.
  const tableTagMatch = content.match(/<(?:HubTable|DataTable)\b/)
  if (tableTagMatch) {
    const windowBefore = content.slice(Math.max(0, tableTagMatch.index - 300), tableTagMatch.index)
    if (/\bpx-(?:4|6)\b/.test(windowBefore)) {
      findings.push(
        "A `px-4`/`px-6` class appears in the ~300 characters right before `<HubTable>`/`<DataTable>`. " +
          "Both already own their own horizontal edge inset — a padded ancestor is the most common " +
          "double-gutter regression in this repo. Verify there isn't a duplicate inset before finishing.",
      )
    }
  }

  // ── Exam-lock inline action row: secondary left, primary right ───────
  // ── List hub chrome: PageHeader ⋯ + ExportDrawer ─────────────────────
  // (`.cursor/rules/exxat-page-header-actions.mdc`, `apps/web/docs/jobs/list-hub.md`)
  // (`.cursor/rules/exxat-focus-workflow.mdc` §7, `dialog-pattern.md`)
  const isExamLockInlineActions =
    /\/exam-lock-interruption-panel\.(?:tsx|jsx)$/.test(normalized) ||
    (normalized.includes("/exam-lock/") &&
      content.includes("primaryAction") &&
      (content.includes("raiseHand") || content.includes("{retry") || content.includes("supportActions")))

  if (isExamLockInlineActions) {
    const actionsBlock = extractExamLockActionsBlock(content)

    if (actionsBlock) {
      const primaryIdx = actionsBlock.indexOf("{primaryAction")
      const retryIdx = actionsBlock.indexOf("{retry")

      if (primaryIdx !== -1 && retryIdx !== -1 && primaryIdx < retryIdx) {
        findings.push(
          "Exam-lock inline action row renders `primaryAction` before retry in DOM — retry " +
            "must be left and filled primary right (`.cursor/rules/exxat-focus-workflow.mdc` §7, " +
            "`apps/web/docs/dialog-pattern.md`).",
        )
      }

      if (
        /flex-col-reverse/.test(actionsBlock) &&
        !/sm:order-2/.test(actionsBlock) &&
        !/sm:col-start-2/.test(actionsBlock)
      ) {
        findings.push(
          "Exam-lock action row uses `flex-col-reverse` without explicit desktop placement — use " +
            "`sm:order-1` on retry and `sm:order-2` on primary (or grid col-start) " +
            "(`.cursor/rules/exxat-focus-workflow.mdc` §7).",
        )
      }

      if (actionsBlock.includes("sm:order-2") && primaryIdx !== -1 && retryIdx !== -1) {
        const primaryOrder = actionsBlock.indexOf("sm:order-2", primaryIdx)
        const retryOrder = actionsBlock.indexOf("sm:order-1", retryIdx)
        if (primaryOrder === -1 || retryOrder === -1) {
          findings.push(
            "Exam-lock action row must pin retry to `sm:order-1` and primary to `sm:order-2` " +
              "(`.cursor/rules/exxat-focus-workflow.mdc` §7).",
          )
        }
      } else if (actionsBlock.includes("sm:col-start-2") && primaryIdx !== -1 && retryIdx !== -1) {
        const primaryColStart = actionsBlock.indexOf("sm:col-start-2", primaryIdx)
        const retryColStart = actionsBlock.indexOf("sm:col-start-1", retryIdx)
        if (primaryColStart === -1 || retryColStart === -1) {
          findings.push(
            "Exam-lock action row must pin retry to column 1 and primary to column 2 on `sm+` " +
              "(`.cursor/rules/exxat-focus-workflow.mdc` §7).",
          )
        }
      } else if (primaryIdx !== -1 && retryIdx !== -1 && primaryIdx < retryIdx) {
        findings.push(
          "Exam-lock filled primary appears before retry in DOM — primary belongs on the right " +
            "(P3 + `exxat-focus-workflow.mdc` §7).",
        )
      }

      if (
        retryIdx !== -1 &&
        primaryIdx !== -1 &&
        retryIdx < primaryIdx &&
        /variant=\{?"default"?\}?|variant=\{[^}]*:\s*"default"/.test(
          actionsBlock.slice(retryIdx, primaryIdx),
        )
      ) {
        findings.push(
          "Exam-lock retry action uses `variant=\"default\"` while primary is on the right — only " +
            "one filled button; it must be the primary (`.cursor/rules/exxat-focus-workflow.mdc` §7).",
        )
      }
    }
  }

  // ── List hub / detail page chrome: PageHeader ⋯ + ExportDrawer ─────────
  // (`.cursor/rules/exxat-page-header-actions.mdc`, `apps/web/docs/jobs/list-hub.md`)
  const isHubCompositionClient =
    /(?:^|\/)[^/]+-client\.(?:tsx|jsx)$/.test(normalized) &&
    !/(?:columns|tokens-themes|column-types|catalog|focus-workflow|exam-lock)/.test(normalized)

  if (isHubCompositionClient && content.includes("ListPageTemplate")) {
    const hasDomainHeader =
      content.includes("LibraryPageHeader") ||
      content.includes("PageHeader") ||
      /\b[A-Z][A-Za-z0-9]+PageHeader\b/.test(content)

    if (!hasDomainHeader) {
      findings.push(
        "Hub client uses `ListPageTemplate` without `PageHeader` or a domain `*PageHeader`. " +
          "Route identity + ⋯ overflow belong in the header slot " +
          "(`.cursor/rules/exxat-page-header-actions.mdc`, `apps/web/docs/jobs/list-hub.md`).",
      )
    }

    const hasExportWiring =
      content.includes("ExportDrawer") ||
      content.includes("exportOpen") ||
      content.includes("onExport")

    if (!hasExportWiring) {
      findings.push(
        "List hub client is missing export wiring (`ExportDrawer`, `exportOpen`, or header `onExport`). " +
          "⋯ More must include Export → `ExportDrawer` on the page client " +
          "(reference: `components/library-client.tsx` — `.cursor/rules/exxat-page-header-actions.mdc`).",
      )
    }

    if (
      content.includes("<PageHeader") &&
      !content.includes("LibraryPageHeader") &&
      !/\b[A-Z][A-Za-z0-9]+PageHeader\b/.test(content) &&
      !content.includes("actions=")
    ) {
      findings.push(
        "`PageHeader` in a hub client has no `actions` prop — add ⋯ overflow (`DropdownMenu`) with Export " +
          "and mount `ExportDrawer` (`.cursor/rules/exxat-page-header-actions.mdc`).",
      )
    }
  }

  const isDetailClient =
    /\/components\/[^/]+-detail-client\.(?:tsx|jsx)$/.test(normalized) &&
    content.includes("PrimaryPageTemplate") &&
    content.includes("PageHeader")

  if (isDetailClient && !content.includes("actions=") && !content.includes("LibraryPageHeader")) {
    findings.push(
      "Record detail client uses `PrimaryPageTemplate` + `PageHeader` without an `actions` slot. " +
        "Detail routes need ⋯ overflow (Export + domain actions) — see `learning-activities-course-detail-client.tsx` " +
        "(`.cursor/rules/exxat-page-header-actions.mdc`, `apps/web/docs/jobs/record-detail.md`).",
    )
  }

  if (findings.length === 0) return silent()

  const message =
    `[exxat-ds-check] Automated content check found ${findings.length} potential DS rule ` +
    `gap(s) in the file just written (${normalized}). These are heuristics, not certainties — ` +
    `verify against the cited rule, then fix or consciously dismiss before ending the turn:\n\n` +
    findings.map((finding, i) => `${i + 1}. ${finding}`).join("\n\n")

  if (input.hook_event_name === "PostToolBatch") {
    emit({ hookSpecificOutput: { hookEventName: "PostToolBatch", additionalContext: message } })
  } else {
    emit({ additional_context: message })
  }
}
