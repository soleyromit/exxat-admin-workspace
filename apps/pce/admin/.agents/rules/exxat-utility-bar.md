---
description: Exxat DS — shell utility bar variants, spacing, and single source of truth for global actions.
activation: model_decision
---

<!-- Synced from .agents/rules/exxat-utility-bar.mdc - run npx exxat-ui sync-extras after Cursor rule edits -->

# Exxat DS — utility bar

## Intent

`UtilityBarSlot` is the **only** shell mount for Search, Ask Leo, Notifications, Help, Settings, and Profile when `showsUtilityBar(variant)` is true. Layout variant comes from **`ShellLayoutContext`** (Settings → Appearance).

## MUST

1. **Three variants** — `sidebar-classic` (no bar), `utility-sidebar` (bar in workspace column), `utility-bar` (full-width row above shell row). See **`shell-utility-bar-pattern.md`**.
2. **Full-width spacing** — when `[data-shell-utility-bar-full]`, rely on **`globals.css`** (`top: 3rem` on fixed sidebar, `padding-top: 0` on workspace). Do not add redundant `pt-12` on `AppSidebar`.
3. **Canonical triggers** — `requestOpenCommandMenu`, `AskLeoToggle`, `getSecondaryNavForProduct`, `utilityBarActionButtonClass`.
4. **Suppress** on exam-lock and `/builder/onboarding` (unless onboarding sidebar preview).

## MUST NOT

- Duplicate global utility triggers in sidebar or page header when the bar is active for that variant.
- Hardcode settings routes per product.

## See also

- `exxat-command-menu.md`, `exxat-kbd-shortcuts.md`
- `docs/exxat-ds/ask-leo-pattern.md`
