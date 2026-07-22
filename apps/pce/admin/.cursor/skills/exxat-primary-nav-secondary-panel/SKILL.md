---
name: exxat-primary-nav-secondary-panel
description: Exxat DS pattern — one primary sidebar row opens a nested SecondaryPanel (Library). NavLinkItem.secondaryPanel id, PANELS registry, useAutoPanel on hub, URL scope + same useTableState rows. Use when adding hub scoped nav (All/My/tree) beside content.
user-invocable: true
---

# Exxat DS — primary nav → secondary panel

**Cursor rule:** `.cursor/rules/exxat-primary-nav-secondary-panel.mdc`  
**Handbook:** `apps/web/AGENTS.md` §4.6  
**Library IA (three tiers):** `docs/exxat-ds/library-nav-ia-pattern.md`

## Wiring checklist

0. **Hub secondary-nav parity** — before custom rows, import **`components/sidebar/secondary-hub-nav-primitives.tsx`** and satisfy **`docs/exxat-ds/library-nav-ia-pattern.md` § Hub secondary-nav parity** (compact rail + shared rows). **`library-secondary-nav.tsx`** is the reference; do not duplicate `NavRow` / `IconNavRow`.
1. **`lib/mock/navigation.tsx`** — set **`secondaryPanel: "<id>"`** on the primary **`NavLinkItem`**; **`url`** = hub route. For Library: parent **Question bank**, child **Library** → `/library/all`, **`primaryHubChildKey: "library-all"`**.
2. **`components/sidebar/secondary-panel.tsx`** — add **`PANELS["<id>"]`** → panel shell (title, optional search) + secondary nav component.
3. **Hub layout** — **`useAutoPanel("<id>")`** or layout effect on list-hub paths (e.g. **`src/views/library/_layout.tsx`** → **`openPanel("library")`** on `/library/all`).
4. **Data** — keep **one** **`useTableState`** / **`tableState.rows`**; drive scope from **URL** + helpers (see **`lib/library-nav.ts`**).
5. **Folder-scoped hub header (Library)** — When **`scope === "folder"`** in the URL, **`LibraryPageHeader`** **⋯ More** includes **Customize folder** — **`.cursor/rules/exxat-library-hub-header.mdc`**.
6. **Collapse control (desktop rail)** — header **`collapseActiveSecondaryPanel()`** (angles-left); panel stays mounted until **`closePanel`** on route leave.
7. **Surface elevation** — **`--secondary-panel-bg`** on **`NestedSecondaryPanelShell`** — **`docs/exxat-ds/shell-surface-elevation-pattern.md`**.

## Flyout stack (mobile / ≥200% zoom)

| User action | Call | Result |
|-------------|------|--------|
| Close scope sheet (X, Esc, ⌘B) | **`closeSecondaryFlyout()`** | Sheet hidden; **`activePanel`** unchanged |
| Main menu (←) | **`hideSecondaryFlyout()`** | Primary flyout; expand parent collapsible; show active child |
| ⌘B on list hub with sheet closed | **`useRegisterNavFlyoutToggle`** handler | Reopen **scope** sheet, not primary only |
| Leave hub route | **`closePanel()`** | Clear panel + restore sidebar |

**MUST NOT** clear **`activePanel`** when the user only dismisses the scope **sheet**.

## High-zoom behaviour

- **`useSidebarReflowZoom()`** — shared with primary sidebar (WCAG 1.4.10).
- **Compact icon rail** (`secondaryPanelCompact`) applies to **pinned desktop rail only**. When **`navFlyout`** (mobile or reflow zoom), panel content **MUST** render **labels** (ignore compact for flyout).
- Provider clears compact when entering **`navFlyout`**.

Custom panel content should read **`secondaryPanelCompact`** and **`navFlyout`** — **`LibraryPanel`** / **`LibrarySecondaryNav`** are the reference.

**New hub navs:** compose **`useSecondaryHubNavChrome`**, **`SecondaryHubNavCompactShell`**, **`SecondaryHubNavRow`**, **`SecondaryHubIconNavRow`**, **`SecondaryHubNavSectionHeader`** from **`secondary-hub-nav-primitives.tsx`**. See parity checklist in **`library-nav-ia-pattern.md`**.

## Library active-state helpers (`lib/library-nav.ts`)

- **`isLibraryPrimaryListNavActive(pathname)`** — primary child **Library** on `/library/all` (any scope).
- **`isLibraryAllQuestionsScopeActive(...)`** — secondary row **All questions** when `scope=all`.
- **`LIBRARY_PRIMARY_LIST_NAV_KEY`** = `"library-all"`.

## MUST NOT

- Set **`secondaryPanel`** without **`PANELS[id]`** + hub **`openPanel`** — broken empty rail.
- Put **All questions** in primary **`children`** — secondary scope nav only.
- Invent a parallel zoom hook — reuse **`useSidebarReflowZoom`**.
- Use **`bg-sidebar`** on the nested panel — use **`--secondary-panel-bg`**.

## Reference

- `components/sidebar/app-sidebar.tsx` — collapsible expand when panel open / Main menu.
- `components/sidebar/secondary-panel.tsx` — **`closeSecondaryFlyout`**, **`hideSecondaryFlyout`**, **`secondaryFlyoutVisible`**.
- `components/library-secondary-nav.tsx` + `lib/library-nav.ts`.
- `components/sidebar/secondary-hub-nav-primitives.tsx` — shared compact rail + nav rows.
- `components/learning-activities-secondary-nav.tsx` — second reference hub.
- `hooks/use-secondary-panel-hub-nav.ts` — scope URL sync.
