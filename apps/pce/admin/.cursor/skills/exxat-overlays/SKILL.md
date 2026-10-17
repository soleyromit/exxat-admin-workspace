---
name: exxat-overlays
description: >-
  Overlays — Sheet vs Dialog vs route, no Vaul. Load when adding export,
  properties, invite, confirm, or choosing drawer vs new page.
user-invocable: true
---

# Exxat DS — overlays (consolidated)

Replaces separate loads of `exxat-drawer-vs-dialog`, `exxat-page-vs-drawer`, and `no-vaul` guidance.

## Read first

| Topic | Path |
|-------|------|
| Pattern | `apps/web/docs/drawer-vs-dialog-pattern.md` |
| Page vs drawer | `apps/web/AGENTS.md` §6.4 |
| Index | `apps/web/docs/INDEX.yaml` |

## Rules (scoped)

- `.cursor/rules/exxat-drawer-vs-dialog.mdc`
- `.cursor/rules/exxat-page-vs-drawer.mdc`
- `.cursor/rules/exxat-no-vaul.mdc`

---

## Decision tree

```
Need hub visible behind?
├── YES → same route
│   ├── short + blocking? → Dialog (AlertDialog)
│   └── auxiliary / wide table / read-more detail → FloatingSheetPanel
└── NO → new route (wizard, settings, detail)
```

---

## MUST

| Surface | Implementation |
|---------|----------------|
| Table properties, export, invite, any side panel or detail readout | **`FloatingSheetPanel`** — `TablePropertiesDrawer`, `ExportDrawer`, `InviteCollaboratorsDrawer` all compose it; never the raw `Sheet` / `SheetContent` primitive underneath |
| Delete confirm, legal ack | **`Dialog`** / `AlertDialog` |
| Long multi-step primary work | **Route** with own URL |
| Side panels | **`FloatingSheetPanel` only** — no raw `Sheet`, no Vaul `Drawer` |

---

## MUST NOT

- Import `vaul` or `@/components/ui/drawer`.
- Import the raw `Sheet` / `SheetContent` / `SheetTrigger` / `SheetClose` / `SheetHeader` / `SheetFooter` / `SheetTitle` / `SheetDescription` primitive directly — compose `FloatingSheetPanel` instead. Enforced by `exxat-ds/no-raw-sheet` (lint error, not a style note).
- Centered dialog for wide export column pickers — use `FloatingSheetPanel`.
- Irreversible delete via toast only — dialog with confirm.

---

## Workflow keyboard (inside sheet/dialog)

- Primary: **Enter** + `<Kbd variant="bare">⏎</Kbd>` + `<Shortcut keys="Enter" />`
- Cancel: **Esc** + inline `<Kbd>Esc</Kbd>`

Reference: `export-drawer.tsx`, `new-library-item-form.tsx`.
