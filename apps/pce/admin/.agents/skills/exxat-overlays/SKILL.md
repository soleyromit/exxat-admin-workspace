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
| Pattern | `docs/exxat-ds/drawer-vs-dialog-pattern.md` |
| Page vs drawer | `./AGENTS.md` §6.4 |
| Index | `docs/exxat-ds/INDEX.yaml` |

## Rules (scoped)

- `.agents/rules/exxat-drawer-vs-dialog.md`
- `.agents/rules/exxat-page-vs-drawer.md`
- `.agents/rules/exxat-no-vaul.md`

---

## Decision tree

```
Need hub visible behind?
├── YES → same route
│   ├── short + blocking? → Dialog (AlertDialog)
│   └── auxiliary / wide table → Sheet (showOverlay={false}, floating inset)
└── NO → new route (wizard, settings, detail)
```

---

## MUST

| Surface | Implementation |
|---------|----------------|
| Table properties, export, invite | **`Sheet`** — `TablePropertiesDrawer`, `ExportDrawer`, `InviteCollaboratorsDrawer` |
| Delete confirm, legal ack | **`Dialog`** / `AlertDialog` |
| Long multi-step primary work | **Route** with own URL |
| Side panels | **`Sheet` only** — no Vaul `Drawer` |

---

## MUST NOT

- Import `vaul` or `@/components/ui/drawer`.
- Centered dialog for wide export column pickers — use sheet.
- Irreversible delete via toast only — dialog with confirm.

---

## Workflow keyboard (inside sheet/dialog)

- Primary: **Enter** + `<Kbd variant="bare">⏎</Kbd>` + `<Shortcut keys="Enter" />`
- Cancel: **Esc** + inline `<Kbd>Esc</Kbd>`

Reference: `export-drawer.tsx`, `new-library-item-form.tsx`.
