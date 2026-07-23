# Library hub — three-tier navigation IA

> **Agents:** `.cursor/rules/exxat-primary-nav-secondary-panel.mdc`, `.cursor/skills/exxat-primary-nav-secondary-panel/SKILL.md`, `.cursor/rules/exxat-secondary-panel-vs-drill-in.mdc`.

Reference implementation: **Design OS** / any product using `libraryItem()` in `lib/mock/navigation.tsx`.

## Three tiers (do not collapse)

| Tier | Where | Example labels | URL |
|------|--------|----------------|-----|
| **Primary parent** | Collapsible row in main sidebar | **Question bank** | Parent URL = `/…/library` (discovery entry) |
| **Primary child** | Sub-menu under Question bank | Library home, Search, **Library** | **Library** → `/…/library/all` |
| **Secondary scope** | `SecondaryPanel` only (not primary children) | **All questions**, My questions, Favorites, Folders | `?scope=all` \| `my` \| `folder` + `folderId` on `/library/all` |

**MUST NOT** put **All questions** in the primary sub-menu. Scope rows live only in `library-secondary-nav.tsx`.

## Active state rules

- **Primary “Library”** (`library-all`) — active on `/library/all` for **any** `?scope=` (list hub). Use `isLibraryPrimaryListNavActive()` in `app-sidebar.tsx`.
- **Secondary “All questions”** — active only when `scope=all`. Use `isLibraryAllQuestionsScopeActive()`.
- **Question bank** parent stays visually neutral when a child is active; expand the collapsible when the library panel is open or user taps **Main menu** from the scope flyout (`secondaryFlyoutHidden` + `activePanel === "library"`).

## Wiring (`navigation.tsx`)

```ts
libraryItem(slug) // title: "Question bank", secondaryPanel: "library"
  primaryHubChildKey: "library-all"
  children:
    - library-hub   → /library
    - library-search → /library/find
    - library-all   → /library/all  // title: "Library"
```

## Secondary panel lifecycle (mobile / ≥200% zoom)

| Action | API | Effect |
|--------|-----|--------|
| Close scope sheet (X, Esc, ⌘B while sheet open) | `closeSecondaryFlyout()` | Hides flyout; **`activePanel` stays `"library"`** |
| Reopen scope sheet (⌘B on `/library/all`) | Flyout toggle handler | Shows scope sheet again (not primary Question bank) |
| **Main menu** (←) in scope header | `hideSecondaryFlyout()` | Primary flyout opens; scope sheet hidden; expand Question bank |
| Leave `/library/all` hub | `closePanel()` | Clears `activePanel` |

**MUST NOT** use full dismiss (clearing `activePanel`) for X/Esc on the scope sheet — that sends users to the primary flyout on the next toggle.

## High zoom / flyout

- **Icon-only compact rail** (`secondaryPanelCompact`) is **desktop pinned rail only**. Flyout sheets **always** show labels (`navFlyout` → not compact).
- Range text (`1–10 of 12`) is **visually hidden** at reflow zoom (`useSidebarReflowZoom`); keep `sr-only` for AT.
- First/last page buttons hidden at reflow zoom in `PaginationBar` to keep one-row footer.

## Hub secondary-nav parity (all hubs with `SecondaryPanel`)

Every `*-secondary-nav.tsx` **MUST** share compact-rail behaviour with Question bank Library. Copy-pasting only the expanded list causes crushed labels when the primary sidebar opens.

### Checklist (ship gate)

| # | Requirement | How to verify |
|---|-------------|---------------|
| 1 | Import **`useSecondaryHubNavChrome`** — do not reimplement `secondaryPanelCompact && !navFlyout` | Grep nav file for `useIsMobile` / `useSidebarReflowZoom` — should live only in primitives |
| 2 | **`if (showCompactRail)`** branch before expanded markup | Open primary sidebar on desktop — secondary collapses to ~48px icon rail |
| 3 | Use **`SecondaryHubNavCompactShell`** + **`SecondaryHubIconNavRow`** | Expand chevron restores labels; icons are `size-9` with tooltips |
| 4 | Expanded rows use **`SecondaryHubNavRow`**; section eyebrows use **`SecondaryHubNavSectionHeader`** | No local `NavRow` / `IconNavRow` duplicates |
| 5 | Folder/tree scope in compact mode → **dropdown** (`fa-folder-tree` trigger), not truncated labels | LA groups + Library folders both use flyout menu |
| 6 | Footer add action mirrored in compact shell (`footer` prop) | Add folder / Add group icon at rail bottom |
| 7 | Panel registered in **`PANELS`** with same id as **`openPanel("<id>")`** | `library`, `learning-activities`, … |

### Shared primitives

`components/sidebar/secondary-hub-nav-primitives.tsx` — canonical implementation. **MUST NOT** fork row hit targets or compact shell markup in individual hub navs.

Reference hubs: **`library-secondary-nav.tsx`**, **`learning-activities-secondary-nav.tsx`**.

## Files

| File | Role |
|------|------|
| `lib/mock/navigation.tsx` | `libraryItem()` IA |
| `lib/library-nav.ts` | Scope helpers, `LIBRARY_PRIMARY_LIST_NAV_KEY` |
| `components/sidebar/secondary-panel.tsx` | Provider, flyout stack, `PANELS.library` |
| `components/sidebar/secondary-hub-nav-primitives.tsx` | Shared compact rail + nav rows (parity checklist) |
| `components/sidebar/app-sidebar.tsx` | Collapsible + `openPanel` on `library-all` |
| `components/library-secondary-nav.tsx` | Scope rows |
| `components/learning-activities-secondary-nav.tsx` | Second reference hub nav |
| `src/views/library/_layout.tsx` | Auto `openPanel("library")` on list hub paths |

## See also

- `docs/exxat-ds/shell-surface-elevation-pattern.md`
- `docs/exxat-ds/hub-supported-views-pattern.md` (Library reference hub)
