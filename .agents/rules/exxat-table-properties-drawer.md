---
description: TablePropertiesDrawer must receive currentView and onViewChange when used with ListPageTemplate view tabs. Auto-attaches when editing apps/web React files; ask explicitly when wiring view-type-aware drawers.
activation: glob
globs: {components,lib,src}/**/*.{tsx,ts}
---

<!-- Synced from .agents/rules/exxat-table-properties-drawer.mdc - run npx exxat-ui sync-extras after Cursor rule edits -->

# Exxat DS — Table properties + active view

**Authoritative detail:** **`./AGENTS.md` §4.2**.

## Why this exists

`TablePropertiesDrawer` uses **`currentView`** (`DataListViewType`) for the first summary row (“Board display” vs “Table display”, matching icons/descriptions) and to show **table-only** vs **board-only** sub-panels. If **`currentView`** is omitted, the drawer assumes **table** — wrong when the tab is **Board**, **List**, or **Dashboard**.

## MUST

When **`ListPageTemplate`** drives **`tab.viewType`** and the page renders **`TablePropertiesDrawer`** (directly or via a toolbar slot):

1. Pass **`currentView={view}`** (same value as **`tab.viewType`** passed into your table component).
2. Pass **`onViewChange`** from **`renderContent={(tab, updateTab) => ...}`** so the drawer’s view-type tiles stay in sync with the tab:

   ```tsx
   import { dataListViewIcon, type DataListViewType } from "@/lib/data-list-view"

   onViewChange={(v: DataListViewType) =>
     updateTab({ viewType: v, icon: dataListViewIcon(v) })
   }
   ```

3. Thread **`view`** and **`onViewChange`** through: **client → table component → drawer toolbar → `TablePropertiesDrawer`**.

**Reference implementations:** `components/library-hub-client.tsx` + `library-table.tsx` (canonical seven-view hub), `components/columns-showcase.tsx` (`LibraryTable` + custom `columnDefs`), `components/tokens-themes-client.tsx` (`FULL_HUB_SUPPORTED_VIEWS` + `tokens-hub-auxiliary-views.tsx`). **Add view allowlist:** **`.agents/rules/exxat-hub-supported-views.md`**.

## Deep-linking into a specific panel

`TablePropertiesDrawer` accepts an optional **`initialPanel`** prop so callsites can open the drawer focused on a named panel — `"main"` (default), `"table-display"`, `"filter"`, `"sort"`, `"group"`, `"columns"`, or `"conditional-rules"`. The current built-in use is the **Add Conditional Rule** item in every column header menu, which deep-links to the **Conditional rules** panel.

### MUST

1. **One state pair owns it.** `useTableState` exposes **`sheetInitialPanel`** + **`setSheetInitialPanel`** alongside `sheetOpen` / `setSheetOpen`. Read both in the drawer button; pass **`initialPanel={sheetInitialPanel}`** to `TablePropertiesDrawer`. Reference: `packages/ui/src/components/table-properties/drawer-button.tsx`.
2. **The toolbar Properties button MUST clear the deep-link.** Otherwise the next plain "Properties" click re-opens onto whatever panel the previous deep-link set:

   ```tsx
   onClick={() => {
     setSheetInitialPanel?.(null)
     setSheetOpen(true)
   }}
   ```

3. **Deep-link callsites MUST set panel + open in the same batched setState call.** Two setters in one callback land in one render, so the drawer mounts with `initialPanel` already populated — no panel-flash:

   ```tsx
   setSheetInitialPanel("conditional-rules")
   setSheetOpen(true)
   ```

4. **From inside a Radix DropdownMenu, queue the action into `onCloseAutoFocus`.** Opening the non-modal Sheet synchronously from `DropdownMenuItem.onSelect` races with the menu close cycle. Use the `columnMenuPendingActionRef` pattern in `packages/ui/src/components/data-table/index.tsx` (or copy it) so the drawer opens after focus has returned to the trigger.

### MUST NOT

- Don't introduce a second source of truth for "which panel" — `sheetInitialPanel` is the only deep-link channel. The drawer's internal `sheetPanel` state stays internal.
- Don't call `setSheetInitialPanel` from a non-deep-link callsite (e.g. a generic "open Properties" toolbar button). Leave it `null` for index opens.

## Conditional rule highlight colour

A rule paints one CSS value (**`ConditionalRule.bgColor`**), and **`ConditionalRuleColorPicker`** is the only surface that sets it. Three sources, because "green" and "the colour Overdue already is" are different intents:

| Source | Value written to `bgColor` | Use it for |
|---|---|---|
| `palette` | a **`RULE_COLORS`** tint | a neutral highlight with no semantic claim |
| `status` | **`var(--status-badge-<tone>-fill)`** | a highlight that must read as one colour with the row's status chip |
| `custom` | **`customRuleBackground(color)`** — a `color-mix` tint of the user's colour | a workspace bringing its own colour |

### MUST

1. **Status rules store the token, not its resolved value.** The status fills are redefined per theme and per high-contrast mode, so a frozen computed colour is how a rule ends up light ink on a light fill after a theme switch.
2. **Custom colours are stored as a tint** via **`customRuleBackground`** (`CUSTOM_RULE_TINT_PERCENT`), with the raw colour kept in **`customColor`** so the picker reopens on it. Cell text is a single ink across every rule; a saturated fill under it fails contrast in at least one theme, and the alternative — an ink per rule — is a contrast matrix nobody maintains (**P8**).
3. **Place rules that predate colour sources with `resolveRuleColorSource`.** `colorSource` is absent on anything persisted by an earlier version, so the background is what places them; without it a status rule reopens on the palette and the next click silently repaints it.
4. **Switch sources through `ruleColorSourcePatch`**, which keeps a sensible colour on the way across (a custom colour survives a trip through Palette).

### MUST NOT

- Write a hex, `rgb()`, or resolved `oklch()` straight into `bgColor` from a hub or a page. Helpers live in **`packages/ui/src/lib/conditional-rule-colors.ts`**.
- Add a fourth swatch set, or a per-rule text colour. The tint strength is the contrast contract.

## View-type tile grid is uniformly square

The drawer's "View type" tile grid (and the Export drawer's "File format" grid) renders through `SelectionTileGrid` with `interaction="button"` + `labelPlacement="inside"`. The shared `selectionTileClassNames` utility now applies **`aspect-square`** so every tile is the same shape regardless of how many tiles populate the last row of a `grid-cols-N` track. Two-word labels (e.g. "List & details") wrap inside the square because `leading-tight` keeps line height compact.

When you compose your own tile-style picker, **prefer the shared `SelectionTileGrid`** (or `selectionTileClassNames` directly) instead of inventing flex/grid wrappers — that's the only way to keep the squares uniform across the system.

## MUST NOT (overall)

- Mount **`TablePropertiesDrawer`** on a multi-view list page **without** **`currentView`** when the active view is known from the tab.
- Omit **`onViewChange`** if the product shows the **view type** control inside Properties (otherwise tiles cannot update the tab).

## See also

- **`./AGENTS.md` §4.2**, **§13** checklist
- **`.agents/rules/exxat-list-page-connected-views.md`**
