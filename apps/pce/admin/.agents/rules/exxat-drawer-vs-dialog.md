---
description: Exxat DS — drawer/sheet vs modal dialog vs route for flows and confirmations.
activation: model_decision
---

<!-- Synced from .agents/rules/exxat-drawer-vs-dialog.mdc - run npx exxat-ui sync-extras after Cursor rule edits -->

# Exxat DS — drawer vs dialog

## MUST

1. **Sheet panel** — Hub-**adjacent** work where **parent context** (list, filters, selection) stays relevant: properties, export, invites, long option lists beside the grid. Use **`Sheet`** (`showOverlay={false}`, floating inset) — **MUST NOT** add a Vaul `Drawer` primitive.
2. **Dialog** — **Blocking**, **short** focus: destructive confirm, legal/acknowledgment, single-step choice, alert when the user must not interact with the page behind until resolved.
3. **Route** — **Primary**, **long**, or **bookmarkable** flows — **`AGENTS.md` §6.4**, **`.agents/rules/exxat-page-vs-drawer.md`**.

## MUST NOT

- Put **irreversible delete** only in a dismissible toast — use **dialog** (or sheet with explicit confirm) per **`exxat-no-toast.md`**.
- Use a **centered dialog** for **wide tables of export columns** when a **sheet panel** matches mental model and space.

## See also

- **`docs/drawer-vs-dialog-pattern.md`** · **`.agents/skills/exxat-drawer-vs-dialog/SKILL.md`**
- **`exxat-page-vs-drawer.md`** (drawer vs **route**)
