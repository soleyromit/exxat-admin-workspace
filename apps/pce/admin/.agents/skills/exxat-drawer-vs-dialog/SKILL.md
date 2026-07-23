---
name: exxat-drawer-vs-dialog
description: Choose Dialog vs Sheet vs route for overlays. Prefer exxat-overlays skill for new work; load for drawer/dialog decisions.
---

# Exxat DS — drawer vs dialog

> **Consolidated skill:** prefer [`.agents/skills/exxat-overlays/SKILL.md`](../exxat-overlays/SKILL.md) for new work.

Use when choosing **Radix `Dialog` / `AlertDialog`** vs **floating `Sheet` panels** vs **route** for a flow.

## Read first

- **`docs/drawer-vs-dialog-pattern.md`**
- **`AGENTS.md` §6.4** + **`docs/data-views-pattern.md`** (page vs drawer)
- **`.agents/rules/exxat-drawer-vs-dialog.md`**, **`exxat-page-vs-drawer.md`**

## Checklist

1. **Must the user see the hub while acting?** Yes → **`Sheet`** panel (properties, export, invite). No and short → **dialog**. Long / own URL → **route**.
2. **Destructive confirm?** Prefer **dialog** (`AlertDialog`) unless the product explicitly keeps context in a sheet with the same safeguards.
3. **Title + focus** — Dialog and sheet both need an accessible **title**; restore focus to trigger on close.

## Repo references

- `TablePropertiesDrawer`, `ExportDrawer`, `InviteCollaboratorsDrawer` — floating **`Sheet`** (names end in “Drawer” but implementation is `Sheet` only).
- Delete / irreversible — dialog pattern, not toast (**`exxat-no-toast.md`**).
