---
name: exxat-fontawesome-icons
description: Font Awesome Pro only — no Lucide; Kit script, fa-light/fa-solid, subset audit (fa:subset-audit), aria-hidden on decorative icons. Use when adding or changing icons, nav glyphs, table toolbar icons, or debugging missing kit glyphs.
user-invocable: true
---

# Exxat DS — Font Awesome icons (no Lucide)

**Cursor rule:** `.agents/rules/exxat-fontawesome-icons.md`  
**Handbook:** `./AGENTS.md` §1 (item 8), §8 accessibility for icon-only / informational cases.

## Stack

- **Kit:** `src/layout.tsx` loads the Font Awesome Pro kit (subset via `fontawesome-subset.manifest.json`).
- **Audit:** `pnpm --filter web fa:subset-audit` — refresh kit icon selection when adding new glyph names.

## MUST

1. **`<i className="fa-light fa-…" aria-hidden="true" />`** when a parent provides the accessible name (`Button` + `aria-label`, `Tip`, adjacent visible text).
2. **`fa-light`** for default; **`fa-solid`** for active/selected where the app already does (sidebar rows, tabs).
3. **Static** `className` strings where possible so the audit script can find class names.

## MUST NOT

- **Import `lucide-react`** or add Lucide/Heroicons/Phosphor for product chrome.
- Put the **only** accessible name on `<i>` without parent labelling — see **exxat-accessibility** Case B/C.

## shadcn blocks

Registry items ship Lucide by default. After `npx shadcn add`, **replace every Lucide import** with Font Awesome `<i>` markup before merging.

## See also

- `.agents/rules/exxat-accessibility.md`
- `.agents/skills/exxat-accessibility/SKILL.md`
