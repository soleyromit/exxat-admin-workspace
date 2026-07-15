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
| Panel vs drill-in | `.agents/rules/exxat-secondary-panel-vs-drill-in.md` |
| Secondary panel | `.agents/skills/exxat-primary-nav-secondary-panel/SKILL.md` |
| Library IA | `docs/exxat-ds/library-nav-ia-pattern.md` |
| Shell elevation | `docs/exxat-ds/shell-surface-elevation-pattern.md` |

## Rules (scoped)

- `.agents/rules/exxat-secondary-panel-vs-drill-in.md`
- `.agents/rules/exxat-primary-nav-secondary-panel.md`
- `.agents/rules/exxat-sidebar-shell.md`
- `.agents/rules/exxat-sidebar-nav-labels.md`
- `.agents/rules/exxat-nav-single-active.md`
- `.agents/rules/exxat-library-hub-header.md` (folder-scoped hubs)

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

**Resize handles** (secondary panel, drill-in panel, table columns): **`verticalResizeSeparatorAria()`** — see **`.agents/skills/exxat-accessibility/SKILL.md`** § Vertical resize handles.
