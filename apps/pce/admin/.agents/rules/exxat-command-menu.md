---
description: Exxat DS — global command palette (⌘K) as search + quick AI vs Ask Leo for long answers.
activation: model_decision
---

<!-- Synced from .agents/rules/exxat-command-menu.mdc - run npx exxat-ui sync-extras after Cursor rule edits -->

# Exxat DS — global command palette (`CommandMenu`)

## Intent

- **`CommandMenu`** (**⌘K** / **Ctrl+K**) is **global search** (routes, library, patterns, AI starters, optional row data such as student names / question stems) — see **`./AGENTS.md` §7.1** and **`docs/exxat-ds/command-menu-pattern.md`**.
- **Quick / lookup / short AI:** Prefer **results inside the palette** when the product can return compact answers or lightweight “research” without leaving the flow.
- **Long or complex answers:** **Ask Leo** side panel (**⌘⌥K** / **Ctrl+Alt+K**)—not forced into the palette.

## Implementation pointers

- Shell: `components/command-menu.tsx`; config **`buildCommandMenuConfig()`** in **`lib/command-menu-config.ts`**; optional **`dataGroups`** from **`lib/command-menu-search-data.ts`** (e.g. **`getCommandMenuSearchDataGroups()`**), wired in **`apps/web/src/App.tsx`**. Keep domain mapping out of the shell.
- Large indexes: set **`searchOnly: true`** on **`CommandMenuGroup`** so **`command-menu.tsx`** skips the group until the user types (avoids listing every row on open; cmdk shows all items when the search string is empty).

## See also

- **`./AGENTS.md` §7.1**
- **`exxat-kbd-shortcuts.md`** (⌘K vs ⌘⌥K)
