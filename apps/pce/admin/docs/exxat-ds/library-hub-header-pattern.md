# Library hub header — folder scope + Customize folder

**Audience:** Engineers extending the library library hub (`LibraryClient`, `LibraryPageHeader`, URL scope).

## Problem

The library uses **`ListPageTemplate`** with multiple **view tabs** (table, panel, tree, …). **`LibraryNewFolderSheet`** (customize mode) is also used inside **`LibraryTable`** for some views (e.g. panel columns). If **Customize folder** exists only there, users on **table** or other tabs **cannot** open the sheet from a consistent chrome entry point when the URL is scoped to a folder (`?scope=folder&folderId=…`).

## Pattern

1. **`LibraryPageHeader`** exposes optional **`onCustomizeFolder?: () => void`**. When **`navState.scope === "folder"`** and **`navState.folderId`** is set, the hub client passes a callback that opens customize mode for the matching **`LibraryFolder`**.
2. **`LibraryClient`** (or equivalent hub client) mounts **`LibraryNewFolderSheet`** **once** beside **`SecondaryPanelHubTemplate` / `ListPageTemplate`**, with local state for **`open`** and **`customizingFolder`**. Saving updates **`folders`** the same way as table-embedded customize flows.
3. The header **⋯ More** menu order stays aligned with **§4.7**: **Invite people** (when collaboration variant) → **Customize folder** (when folder-scoped) → **Export** → **Show / hide metric section** (when applicable).

## References

| Piece | Location |
|-------|-----------|
| Header prop + menu item | `components/library-page-header.tsx` |
| Client wiring + sheet | `components/library-client.tsx` |
| URL scope | `lib/library-nav.ts` (`parseLibraryNav`, `LibraryNavState`) |
| Sheet UI | `components/library-new-folder-sheet.tsx` |

**Cursor rule:** `.cursor/rules/exxat-library-hub-header.mdc`  
**Handbook:** `AGENTS.md` §4.6 (folder-scoped hub chrome).
