---
description: Exxat DS — Ask Leo thread primitives, sidebar, and escalation from command palette.
activation: model_decision
---

<!-- Synced from .agents/rules/exxat-ask-leo.mdc - run npx exxat-ui sync-extras after Cursor rule edits -->

# Exxat DS — Ask Leo

## Intent

Ask Leo is the **long-form AI** surface (`AskLeoSidebar`, `⌘⌥K`). Short search stays in **`CommandMenu`** (`⌘K`).

## MUST

1. Compose transcripts with **`Message`**, **`Bubble`**, **`Marker`**, **`MessageScroller`** — product wrapper **`LeoThreadMessages`**.
2. User / assistant / thinking variants per **`ask-leo-pattern.md`**.
3. No toast for streaming status — `Marker` + inline chrome only (`exxat-no-toast.md`).

## MUST NOT

- Fork per-surface transcript markup or manual scroll-stick logic.
- Use Lucide icons on Leo thread UI (`exxat-fontawesome-icons.md`).

## See also

- `exxat-command-menu.md`, `exxat-utility-bar.md`
- `exxat-chart-leo-spotting` skill (plot insights only)
