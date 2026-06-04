---
name: exxat-fontawesome-icons
description: Font Awesome Pro in Exxat DS — Kit script, fa-light/fa-solid, subset audit (fa:subset-audit), aria-hidden on decorative icons, no parallel icon libraries for product chrome. Use when adding or changing icons, nav glyphs, table toolbar icons, or debugging missing kit glyphs.
user-invocable: true
---

# Exxat DS — Font Awesome icons

**Cursor rule:** `.cursor/rules/exxat-fontawesome-icons.mdc`  
**Handbook:** `apps/web/AGENTS.md` §1 (item 8), §8 accessibility for icon-only / informational cases.

## Stack

- **Kit:** `apps/web/app/layout.tsx` loads the Font Awesome Pro kit (subset via `fontawesome-subset.manifest.json`).
- **Audit:** `pnpm --filter web fa:subset-audit` — refresh kit icon selection when adding new glyph names.

## MUST

1. **`<i className="fa-light fa-…" aria-hidden="true" />`** when a parent provides the accessible name (`Button` + `aria-label`, `Tip`, adjacent visible text).
2. **`fa-light`** for default; **`fa-solid`** for active/selected where the app already does (sidebar rows, tabs).
3. **Static** `className` strings where possible so the audit script can find class names.

## MUST NOT

- Introduce a **second** icon library for the same surfaces (duplicate Lucide/Heroicons for nav, hubs, toolbars).
- Put the **only** accessible name on `<i>` without parent labelling — see **exxat-accessibility** Case B/C.

## See also

- `.cursor/rules/exxat-accessibility.mdc`
- `.cursor/skills/exxat-accessibility/SKILL.md`
