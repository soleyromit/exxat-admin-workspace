---
name: exxat-sidebar-nav
description: >-
  Sidebar navigation — SecondaryPanel vs SidebarDrillIn, primary nav scope,
  library three-tier IA, nav-active helpers. Load when adding nav rows, nested
  panels, or drill-in sections.
user-invocable: true
---

# Exxat DS — sidebar navigation (consolidated)

## Read first

| Topic | Path |
|-------|------|
| Panel vs drill-in | `.cursor/rules/exxat-secondary-panel-vs-drill-in.mdc` |
| Secondary panel | § SecondaryPanel wiring below · `.cursor/rules/exxat-primary-nav-secondary-panel.mdc` |
| Library IA | `apps/web/docs/library-nav-ia-pattern.md` |
| Shell elevation | `apps/web/docs/shell-surface-elevation-pattern.md` |

## Rules (scoped)

- `.cursor/rules/exxat-secondary-panel-vs-drill-in.mdc`
- `.cursor/rules/exxat-primary-nav-secondary-panel.mdc`
- `.cursor/rules/exxat-sidebar-shell.mdc`
- `.cursor/rules/exxat-sidebar-nav-labels.mdc`
- `.cursor/rules/exxat-nav-single-active.mdc`
- `.cursor/rules/exxat-library-hub-header.mdc` (folder-scoped hubs)

---

## Decision: SecondaryPanel vs SidebarDrillIn

| Question | Answer | Use |
|----------|--------|-----|
| Tree / persistent hierarchy? | Yes | **SecondaryPanel** |
| Flat list of distinct routes? | Yes | **SidebarDrillIn** |
| Scoping the current hub? | Yes | **SecondaryPanel** |
| Going into Settings / Tokens section? | Yes | **SidebarDrillIn** |

**MUST NOT** wire both `secondaryPanel` and `drillIn` on the same nav row.

---

## SecondaryPanel checklist

- [ ] Register panel id in `secondary-panel.tsx` `PANELS`
- [ ] Nav row: `secondaryPanel: "<id>"` in `navigation.tsx`
- [ ] Hub calls `useAutoPanel("<id>")`
- [ ] `--secondary-panel-bg` elevation (not forked sidebar colors)
- [ ] Mobile flyout: `dismissNavFlyout()` on leaf navigation

### SecondaryPanel wiring (detailed — one primary row opens a nested panel)

1. **`lib/mock/navigation.tsx`** — set **`secondaryPanel: "<id>"`** on the primary **`NavLinkItem`**; **`url`** = hub route. For Library: parent **Question bank**, child **Library** → `/library/all`, **`primaryHubChildKey: "library-all"`**.
2. **`components/sidebar/secondary-panel.tsx`** — add **`PANELS["<id>"]`** → panel shell (title, optional search) + secondary nav component.
3. **Hub layout** — **`useAutoPanel("<id>")`** or a layout effect on list-hub paths (e.g. `src/views/library/_layout.tsx` → `openPanel("library")` on `/library/all`).
4. **Data** — keep **one** **`useTableState`** / **`tableState.rows`**; drive scope from **URL** + helpers (see `lib/library-nav.ts`).
5. **Folder-scoped hub header (Library)** — when `scope === "folder"` in the URL, `LibraryPageHeader` **⋯ More** includes **Customize folder** — `.cursor/rules/exxat-library-hub-header.mdc`.
6. **Collapse control (desktop rail)** — header `collapseActiveSecondaryPanel()` (angles-left); panel stays mounted until `closePanel` on route leave.
7. **Surface elevation** — `--secondary-panel-bg` on `NestedSecondaryPanelShell` — `docs/exxat-ds/shell-surface-elevation-pattern.md`.

#### Flyout stack (mobile / ≥200% zoom)

| User action | Call | Result |
|-------------|------|--------|
| Close scope sheet (X, Esc, ⌘B) | `closeSecondaryFlyout()` | Sheet hidden; `activePanel` unchanged |
| Main menu (←) | `hideSecondaryFlyout()` | Primary flyout; expand parent collapsible; show active child |
| ⌘B on list hub with sheet closed | `useRegisterNavFlyoutToggle` handler | Reopen **scope** sheet, not primary only |
| Leave hub route | `closePanel()` | Clear panel + restore sidebar |

**MUST NOT** clear `activePanel` when the user only dismisses the scope **sheet**.

#### High-zoom behaviour

- `useSidebarReflowZoom()` — shared with the primary sidebar (WCAG 1.4.10); never invent a parallel zoom hook.
- **Compact icon rail** (`secondaryPanelCompact`) applies to the **pinned desktop rail only**. When `navFlyout` (mobile or reflow zoom), panel content **MUST** render **labels** (ignore compact). Provider clears compact when entering `navFlyout`. Custom panel content reads `secondaryPanelCompact` + `navFlyout` — `LibraryPanel` / `LibrarySecondaryNav` are the reference.

#### Library active-state helpers (`lib/library-nav.ts`)

- `isLibraryPrimaryListNavActive(pathname)` — primary child **Library** on `/library/all` (any scope).
- `isLibraryAllQuestionsScopeActive(...)` — secondary row **All questions** when `scope=all`.
- `LIBRARY_PRIMARY_LIST_NAV_KEY` = `"library-all"`.

#### SecondaryPanel MUST NOT

- Set `secondaryPanel` without `PANELS[id]` + hub `openPanel` — broken empty rail.
- Put **All questions** in primary `children` — secondary scope nav only.
- Use `bg-sidebar` on the nested panel — use `--secondary-panel-bg`.

---

## Drill-in checklist

- [ ] Flat route list with `drillIn` on parent nav row
- [ ] Active match: exact path + search for query-param siblings
- [ ] Esc / Cmd+[ closes drill-in
- [ ] Workspace switcher hides while drilled in

---

## Active state

- Drill-in items: **exact** `pathname + search` match
- Primary + secondary: `isNavHrefActive` / `resolveActiveNavHref` from `lib/nav-active`

---

## Reference

- Library: `library-secondary-nav.tsx` + `secondary-panel.tsx`
- Tokens drill-in: `navigation.tsx` `TOKENS_DRILL_IN_ITEMS`
- `app-sidebar.tsx` — `SidebarDrillInItems`, `NavLinkItems`, `SidebarNavSecondaryItems`

---

## Accessibility (icon rail + resize)

When the primary sidebar is **collapsed** (desktop icon rail):

- Nav labels are CSS-hidden — every **`SidebarMenuButton asChild` → `Link`** MUST expose **`aria-label={title}`** when collapsed.
- **MUST NOT** use `aria-label={iconRailCollapsed ? title : undefined}` — explicit `undefined` on the child **overrides** `SidebarMenuButton`'s tooltip label via Radix **`Slot`** merge (axe: *Links must have discernible text*).

```tsx
{...(iconRailCollapsed ? { "aria-label": item.title } : {})}
```

**Tree expanders** in secondary panel folder rails: **`size-8`** chevron buttons (not `size-6`).

**Resize handles** (secondary panel, drill-in panel, table columns): **`verticalResizeSeparatorAria()`** — see **`.cursor/skills/exxat-accessibility/SKILL.md`** § Vertical resize handles.
