# DS Product Compatibility

> **Read this at Gate 1 before writing any JSX that uses a DS component.**
> It tells you whether the current product's build environment correctly compiles DS Tailwind classes,
> which components are affected if gaps exist, and what fix is in place.

---

## What this solves

The DS uses Tailwind variants (`data-horizontal:`, `data-open:`, `data-active:`, etc.) that are aliases
for Radix's verbose `data-orientation` / `data-state` attributes. These aliases are defined in the DS's
own Tailwind config (`shadcn@4.2.0/dist/tailwind.css`). When a product compiles DS components through its
**own** Tailwind, those aliases are missing — CSS is generated but selectors never match DOM attributes.

**Consequence:** TypeScript passes. Browser console is silent. DS component renders visually wrong.

**Fix:** Every product's CSS entry point must define the canonical `@custom-variant` block.

---

## Canonical `@custom-variant` block

Source: `shadcn@4.2.0/dist/tailwind.css`. Reference copy: `apps/portal/app/globals.css`.

```css
@custom-variant data-open     { &:where([data-state="open"])                              { @slot; } }
@custom-variant data-closed   { &:where([data-state="closed"])                            { @slot; } }
@custom-variant data-checked  { &:where([data-state="checked"])                           { @slot; } }
@custom-variant data-unchecked{ &:where([data-state="unchecked"])                         { @slot; } }
@custom-variant data-selected { &:where([data-state="selected"]),
                                 &:where([data-selected]:not([data-selected="false"]))     { @slot; } }
@custom-variant data-disabled { &:where([data-disabled]:not([data-disabled="false"]))     { @slot; } }
@custom-variant data-active   { &:where([data-state="active"]),
                                 &:where([data-active]:not([data-active="false"]))         { @slot; } }
@custom-variant data-horizontal { &:where([data-orientation="horizontal"])                { @slot; } }
@custom-variant data-vertical   { &:where([data-orientation="vertical"])                  { @slot; } }
```

---

## Product status matrix

| Product | CSS entry | DS import | `@custom-variant` | Button default hover | `--radius-4xl` |
|---|---|---|---|---|---|
| **Portal** | `apps/portal/app/globals.css` | compiled | ✓ Full (9 variants) | N/A (compiled) | N/A |
| **Exam-mgmt admin** | `apps/exam-management/admin/app/globals.css` | source (`@exxatdesignux/ui`) | ✓ Fixed 2026-06-03 | check | check |
| **Assessment-taker** | `apps/exam-management/assessment-taker/src/index.css` | compiled (`@exxatdesignux/ui`) | ✓ 2026-06-03 | N/A (compiled) | N/A (compiled) |
| **PCE admin** | `apps/pce/admin/app/globals.css` | compiled | ✓ Fixed 2026-06-03 | N/A (compiled) | N/A |
| **PCE student** | `apps/pce/student/app/globals.css` | studentUX | ✓ Fixed 2026-06-03 | N/A | N/A |

**"Button default hover"** — source-import products only. DS Button `default` variant has no hover for `<button>` elements; compiled package provides it via `@layer base`. Source products must add `[data-slot="button"][data-variant="default"]:hover:not(:disabled) { background-color: color-mix(in oklch, var(--primary) 85%, var(--foreground)); }`.

**"`--radius-4xl`"** — source-import products only. DS Badge uses `rounded-4xl` for pill shape; DS theme only defines up to `--radius-3xl`. Source products must add `@theme inline { --radius-4xl: 9999px; }`.

---

## What breaks without the `@custom-variant` block

| Component | Missing variant | Symptom |
|---|---|---|
| Tabs (`variant="line"`) | `data-horizontal` | Active underline never appears. Tab list may render horizontally. |
| Tabs (any) | `data-active` | Active tab has wrong background / no active state styling. |
| Dialog | `data-open`, `data-closed` | No fade-in/fade-out animation. Opens/closes as hard cut. |
| Sheet | `data-open`, `data-closed` | No slide animation. |
| Dropdown Menu | `data-open`, `data-closed` | No open/close animation. |
| Select | `data-open`, `data-closed` | No dropdown animation. |
| Tooltip | `data-open`, `data-closed` | No fade animation. |
| Checkbox | `data-checked`, `data-unchecked` | Check/uncheck visual state may not update. |
| Select Item | `data-selected` | Selected item not visually differentiated. |
| Disabled elements | `data-disabled` | `data-disabled:opacity-50` never fires → disabled elements look active. |
| Sidebar menu button | `data-active` | Inactive items get active-state styles if `data-active="false"` is set. |

---

## Pre-flight procedure (Gate 1 — before writing any component JSX)

Run this whenever you start working on a screen, panel, sheet, or any UI in any product.

### Step 1 — Identify the product

```bash
# Which product am I in?
pwd | grep -oE "apps/[^/]+/[^/]+"
```

### Step 2 — Check DS compatibility status

Look up the product in the **Product status matrix** above.
- If all columns are ✓ → proceed.
- If any column shows a gap → apply the fix from the "Canonical `@custom-variant` block" section above before writing any component code.

### Step 3 — Read the component source for any NEW DS component you plan to use

```bash
find /Users/romitsoley/Work/@exxatdesignux/ui — source: components/ui -name "<Component>.tsx"
```

For each component, note:
- Which `data-*` variants it uses (check the className strings)
- Which interactive states it has (hover, focus, active, disabled, open, checked)
- Whether those states depend on the variants in the canonical block

### Step 4 — Declare gaps before writing code

In your pre-task declaration, write:
```
DS environment: [product name] — @custom-variant: ✓/✗ — Button hover: ✓/✗/N/A — radius-4xl: ✓/✗/N/A
Components planned: [list]
Known gaps for these components: [list or "none"]
```

---

## Post-flight procedure (Gate 2 — after implementing any DS component)

These checks are additive to the existing Gate 2 checklist.

### Step 5 — Verify each DS component's interactive states visually

For every DS component you added or modified, explicitly verify in the browser:

| Component | States to check |
|---|---|
| Button (any variant) | hover, focus-visible ring, disabled (opacity-50) |
| Button `default` (source-import only) | hover color darkens — if flat, button hover rule is missing |
| Tabs `variant="line"` | active tab underline is visible |
| Tabs (any) | active tab has correct background |
| Select / Dropdown | opens with animation (not snap) |
| Dialog / Sheet | overlay fades in, panel animates |
| Checkbox | checked state shows checkmark |
| Disabled elements | appear visually muted (opacity-50 or similar) |
| Sidebar items | active = accent bg; inactive = flat transparent |

### Step 6 — Flag any state that doesn't match DS spec

If a state is wrong:
1. Check the product's CSS entry point for the `@custom-variant` block — run `grep "@custom-variant" <globals.css>`
2. If missing, apply the canonical block from this doc
3. Update the product status matrix above
4. Run ds-conformance-reviewer agent to confirm the fix

---

## Adding a new product

When a new product is scaffolded:
1. Add `@import '../../../../shared/ds-tailwind-variants.css';` to the product's CSS entry point (adjust relative path)
2. Add the product row to the product status matrix above
3. If the product uses DS source import (not compiled package), also add button hover and `--radius-4xl`
4. Add the product's CSS entry point path to `scripts/check-ds-variants.sh`
5. Mark the row ✓ before any component work begins

---

## Automation — hooks and scripts that enforce this

| Hook / Script | What it does |
|---|---|
| `pre-tool-use.py` CSS gate (DS-CSS-001) | Warns when editing globals.css that will be missing @custom-variant block |
| `post-css-edit.py` (DS-CSS-002) | After any CSS edit, reads the file on disk and warns if sentinel is gone |
| `pre-tool-use.py` DS-CMP-001 | When DS components are imported in TSX, emits their `source_import_gaps` + `verify_in_browser` from enriched snapshot |
| `user-prompt-submit.py` DS environment block | On design intent + product detected, auto-injects the product's DS status (import type, @custom-variant, button hover, radius-4xl, CSS entry path) |
| `scripts/check-ds-variants.sh` | Pre-commit: scans all 5 product CSS entry points for sentinel; exits non-zero if any are missing |

The enriched component truth lives in `node tools/ds/source.mjs --list` (per-component `data_variants_required`, `source_import_gaps`, `verify_in_browser`) and `node tools/ds/source.mjs --list` (`component_truth` top-level key, used by the hook).

---

## Keeping in sync

`shared/ds-tailwind-variants.css` is the **single canonical block** — all products import from it.
If the DS updates `shadcn@4.2.0` or its Tailwind config, update `shared/ds-tailwind-variants.css` only.
All products automatically pick up the change on next build.

Fallback grep if any product has a local copy:
```bash
grep -rn "@custom-variant data-open" /Users/romitsoley/Work/apps --include="*.css"
```
