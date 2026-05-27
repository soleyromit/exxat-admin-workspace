---
name: exxat-drawer-vs-dialog
description: Exxat DS — drawer vs dialog. Use when choosing Radix Dialog / AlertDialog vs floating Sheet panels vs route for a flow.
---

# Exxat DS — drawer vs dialog

Use when choosing **Radix `Dialog` / `AlertDialog`** vs **floating `Sheet` panels** vs **route** for a flow.

## Read first

- **`docs/drawer-vs-dialog-pattern.md`**
- **`AGENTS.md` §6.4** + **`docs/data-views-pattern.md`** (page vs drawer)
- **`.cursor/rules/exxat-drawer-vs-dialog.mdc`**, **`exxat-page-vs-drawer.mdc`**

## Checklist

1. **Must the user see the hub while acting?** Yes → **`Sheet`** panel (properties, export, invite). No and short → **dialog**. Long / own URL → **route**.
2. **Destructive confirm?** Prefer **dialog** (`AlertDialog`) unless the product explicitly keeps context in a sheet with the same safeguards.
3. **Title + focus** — Dialog and sheet both need an accessible **title**; restore focus to trigger on close.

## Repo references

- `TablePropertiesDrawer`, `ExportDrawer`, `InviteCollaboratorsDrawer` — floating **`Sheet`** (names end in “Drawer” but implementation is `Sheet` only).
- Delete / irreversible — dialog pattern, not toast (**`exxat-no-toast.mdc`**).
