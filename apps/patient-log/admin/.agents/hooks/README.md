# Antigravity hook parity

Cursor and Claude Code run programmatic hooks from `.cursor/hooks/` and `.claude/hooks/`.
Antigravity does not use the same hook runtime — use **workflows** instead:

| Cursor / Claude hook | Antigravity equivalent |
| --- | --- |
| `exxat-session-status.mjs` (sessionStart) | Load always-on rules; optional `/surface-router` |
| `exxat-image-ia-gate.mjs` (beforeSubmitPrompt) | `/design-brief` — IA only from uploads |
| `exxat-brief-gate.mjs` (preToolUse) | `/design-brief` before IA/layout edits |
| `react-doctor.sh` (postToolUse) | `/react-doctor` after React edits |
| `exxat-ds-check.mjs` (postToolUse) | No workflow equivalent yet — manually re-check `exxat-table-column-cells.mdc` / `exxat-tabs-chrome.mdc` / `exxat-reuse-before-custom.mdc` / `exxat-page-header-actions.mdc` (hub ⋯ + ExportDrawer) against the diff before finishing |

Scripts in this folder are **reference copies** synced from `.cursor/hooks/` for audit parity.
Run `npx exxat-ui sync-extras` after hook edits.
