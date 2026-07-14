---
description: Library library — folder-scoped hub header More menu must expose Customize folder; sheet on hub client
activation: glob
globs: components/library-*.tsx
---

<!-- Synced from .agents/rules/exxat-library-hub-header.mdc - run npx exxat-ui sync-extras after Cursor rule edits -->

# Exxat DS — Library hub header (folder scope)

When the library library URL is **scoped to a folder** (`parseLibraryNav` → **`scope === "folder"`** and **`folderId`** set), users are effectively on a **“folder page”**: the hub title matches that folder, and **global** actions belong in the **`LibraryPageHeader`** **⋯ More** menu — not only on per-row or per-tile overflow menus inside a single view tab.

**Pattern doc:** **`docs/exxat-ds/library-hub-header-pattern.md`**. **Handbook:** **`./AGENTS.md` §4.6** (folder-scoped hub chrome).

## MUST

1. **`LibraryPageHeader`** — When **`navState.scope === "folder"`** and **`navState.folderId`** resolves to a row in **`folders`**, pass **`onCustomizeFolder`** so **⋯ More** includes **Customize folder** ( **`fa-wand-magic-sparkles`** + label **Customize folder** ), placed after **Invite people** (collaboration variant) and before **Export**.
2. **Hub client** — Mount **`LibraryNewFolderSheet`** on the **hub client** (e.g. **`LibraryClient`**) next to **`ListPageTemplate`**, driven by local **`open` / `customizingFolder`** state opened from **`onCustomizeFolder`**. **MUST NOT** rely on **`LibraryTable`** alone to host the sheet when some view branches (**table**, **list**, **board**, **dashboard**) do not render that sheet — users would lose **Customize folder** on those tabs.
3. **`onCreated`** — On save, **`setFolders`** (or equivalent) **maps** the scoped folder **`id`** to updated **`name`**, **`icon`**, **`colorKey`** — same contract as **`LibraryTable`** panel/tree customize handlers.

## MUST NOT

- Omit **Customize folder** from the header **⋯** when the URL is folder-scoped, expecting users to find it only on secondary-nav tree rows or OS-folder tiles.
- Mount **only** one customize sheet inside **`LibraryTable`** without a **client-level** sheet when the hub uses **`ListPageTemplate`** view tabs that omit that table subtree.

## See also

- **`.agents/rules/exxat-primary-nav-secondary-panel.md`** — URL scope + secondary panel.
- **`.agents/rules/exxat-collaboration-access.md`** — **`variant="collaboration"`** header + **⋯** invite pattern.
- **`lib/library-nav.ts`** — **`parseLibraryNav`**, **`LibraryNavState`**.
