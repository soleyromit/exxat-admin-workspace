---
description: Exxat DS — no Vaul Drawer primitive; side panels use Sheet only
activation: model_decision
---

<!-- Synced from .agents/rules/exxat-no-vaul.mdc - run npx exxat-ui sync-extras after Cursor rule edits -->

# Exxat DS — no Vaul

## MUST

- Side panels (export, properties, invite, folder create) use **`Sheet`** from `@exxatdesignux/ui/components/sheet` with the floating inset pattern (`showOverlay={false}`, `getFloatingSheetInsetProps`).
- Product code names may end in `*Drawer` (`ExportDrawer`, `TablePropertiesDrawer`) — implementation is **`Sheet`**, not Vaul.

## MUST NOT

- Add **`vaul`** to `package.json` or import `@/components/ui/drawer` / Vaul `Drawer`.
- Scaffold or extend the removed shadcn Vaul wrapper — it was deleted from `@exxatdesignux/ui@0.5.3+`.

## Consumer apps

After upgrading to **`@exxatdesignux/ui@0.5.3`**, remove **`vaul`** from the app `package.json`, delete any local `components/ui/drawer.tsx` re-export, and re-run **`exxat-ui sync-extras`**.

## See also

- **`.agents/rules/exxat-drawer-vs-dialog.md`**
- **`docs/exxat-ds/drawer-vs-dialog-pattern.md`**
