---
description: Exxat DS — drawer/sheet vs modal dialog vs route for flows and confirmations.
activation: model_decision
---

<!-- Synced from .agents/rules/exxat-drawer-vs-dialog.mdc - run npx exxat-ui sync-extras after Cursor rule edits -->

# Exxat DS — drawer vs dialog

## MUST

1. **Sheet panel** — any side panel, drawer, or "read more" surface where the page behind should stay visible and reachable: properties, export, invites, long option lists beside the grid, a detail readout launched from a card. Compose **`FloatingSheetPanel`** / `FloatingSheetPanelContent` / `FloatingSheetPanelHeader` / `FloatingSheetPanelBody` / `FloatingSheetPanelFooter` (or `FloatingSheetPanelWorkflowFooter`). **Never** reach around it to the raw `Sheet` / `SheetContent` primitive — `FloatingSheetPanel` is the one place that primitive is composed. **MUST NOT** add a Vaul `Drawer` primitive.
2. **Dialog** — **Blocking**, **short** focus: destructive confirm, legal/acknowledgment, single-step choice, alert when the user must not interact with the page behind until resolved.
3. **Route** — **Primary**, **long**, or **bookmarkable** flows — **`AGENTS.md` §6.4**, **`.agents/rules/exxat-page-vs-drawer.md`**.

One shell for every side panel in the app, not one per feature that happened to need one — that is what makes dismissal (Escape, outside click, close button), sizing (`sm`/`md`/`lg`, draggable), and single-rail exclusivity consistent everywhere instead of something each drawer re-derives (and drifts from) on its own. Enforced by **`exxat-ds/no-raw-sheet`** (`packages/eslint-plugin-exxat-ds`) — importing `Sheet`, `SheetContent`, or any other raw Sheet export outside `FloatingSheetPanel`'s own implementation is a lint error, not a style preference.

## MUST NOT

- Put **irreversible delete** only in a dismissible toast — use **dialog** (or sheet with explicit confirm) per **`exxat-no-toast.md`**.
- Use a **centered dialog** for **wide tables of export columns** when a **sheet panel** matches mental model and space.
- Import the raw `Sheet` / `SheetContent` / `SheetTrigger` / `SheetClose` / `SheetHeader` / `SheetFooter` / `SheetTitle` / `SheetDescription` primitive in product code. If `FloatingSheetPanel` is missing a piece you need (e.g. a footer shape), extend `FloatingSheetPanel` itself — don't drop to the primitive underneath it.

## See also

- **`docs/drawer-vs-dialog-pattern.md`** · **`.agents/skills/exxat-drawer-vs-dialog/SKILL.md`**
- **`exxat-page-vs-drawer.md`** (drawer vs **route**)
