---
name: ds-sweep
description: Use to sweep an ENTIRE product app directory (e.g. `/ds-sweep apps/pce/admin`) for DS-adoption and WCAG debt and produce a saved, severity-ranked remediation backlog. Runs the ds-adoption / ds-globals / architecture audit scripts plus WCAG and state-coverage greps; read-only, fixes nothing. For a single file, directory, or the staged set use ds-check instead; for a UX/design review of one surface use exxat-ux-audit.
---

# DS Sweep — Systematic Product Audit

Use when Romit asks to audit an existing product for DS gaps, WCAG issues, or DS adoption debt.
Invoke with `/ds-sweep <product>` or `/ds-sweep apps/<product>/admin`.

## What this sweeps

1. **DS violations** — raw `<button>`, raw `<table>`, hardcoded hex/rgb, banned imports
2. **Missed DS components** — hand-rolled code where DS exports a direct equivalent
3. **WCAG 2.1 AA** — missing `aria-hidden`, `aria-label`, contrast, state coverage
4. **CSS violations** — `color-mix(in oklch`, `uppercase tracking-wide`, hardcoded colors
5. **State coverage gaps** — list pages missing loading/empty/error states

## Protocol

### Step 1 — Run the existing audit scripts

```bash
# DS adoption — blocking violations for the product
python3 scripts/ds-adoption-audit.py --strict 2>&1 | grep -A2 "apps/<product>"

# DS globals (CSS overrides present?)
python3 scripts/ds-globals-audit.py --strict 2>&1

# Architecture audit (skills/agents wired?)
python3 scripts/architecture-audit.py --strict 2>&1
```

### Step 2 — WCAG static grep

Run these greps on `apps/<product>/admin/` (or the target dir):

```bash
TARGET=apps/<product>/admin

# Missing aria-hidden on FA icons
grep -rn "fa-" $TARGET --include="*.tsx" | grep -v "aria-hidden"

# Icon-only buttons missing aria-label
grep -rn "variant=\"icon\"\|size=\"icon\"" $TARGET --include="*.tsx" | grep -v "aria-label"

# Hardcoded hex colors
grep -rn "#[0-9a-fA-F]\{3,6\}" $TARGET --include="*.tsx" --include="*.css" | grep -v "//\|\/\*"

# Raw HTML button
grep -rn "<button " $TARGET --include="*.tsx" | grep -v "//\|asChild"

# Raw HTML table
grep -rn "<table\b\|<tr\b\|<td\b\|<th\b" $TARGET --include="*.tsx" | grep -v "//\|aria-"

# Banned CSS patterns
grep -rn "uppercase tracking-wide\|color-mix(in oklch\|py-20 text-center" $TARGET --include="*.tsx"

# opacity-60 wrapping text (contrast risk)
grep -rn "opacity-60\|opacity-50\|opacity-40" $TARGET --include="*.tsx"
```

### Step 3 — State coverage grep

```bash
TARGET=apps/<product>/admin

# DataTable missing emptyState
grep -rn "<DataTable" $TARGET --include="*.tsx" | grep -v "emptyState"

# DataTable missing toolbarSlot
grep -rn "<DataTable" $TARGET --include="*.tsx" | grep -v "toolbarSlot"

# Async pages without loading state
grep -rln "async\|await\|fetch\|useQuery\|useSWR" $TARGET/app --include="*.tsx" | xargs grep -rL "skeleton\|Skeleton\|loading\|isLoading" 2>/dev/null

# toast() usage (banned — use LocalBanner)
grep -rn "toast(" $TARGET --include="*.tsx" | grep -v "//\|import"
```

### Step 4 — DS component coverage check

Cross-reference against `node tools/ds/source.mjs --list`. For each hand-rolled pattern found:

| Hand-rolled pattern | DS equivalent to check |
|---|---|
| Custom status/badge div | `StatusBadge` |
| Local `data-table/` directory | `DataTable` from `@exxatdesignux/ui` |
| Local `key-metrics/` directory | `KeyMetrics` from `@exxatdesignux/ui` |
| Custom drawer with export | `ExportDrawer` |
| Custom sheet with list picker | `ListPickerSheet` |
| Custom command search | `CommandPalette` |
| Custom `<select>` | `Select` from DS |
| `<input type="text">` bare | `Input` from DS |

### Step 5 — Output the backlog

Format the output as a prioritized table:

```
## DS Sweep — apps/<product>/admin
Scanned: <N> page files, <N> component files
Date: YYYY-MM-DD

### CRITICAL — blocks done claim
| File | Line | Violation | DS fix |
|---|---|---|---|
| surveys/page.tsx | 12 | raw DataTable copy | import DataTable from @exxatdesignux/ui |
| templates/[id]/page.tsx | 44 | hardcoded #3b82f6 | var(--brand-color) |

### HIGH — WCAG AA violations
| File | Line | Issue | Fix |
|---|---|---|---|
| admin/page.tsx | 31 | FA icon missing aria-hidden | aria-hidden="true" |
| surveys/push/page.tsx | 89 | icon-only Button missing aria-label | aria-label="..." |

### MEDIUM — DS coverage gaps (DS component available)
| File | Line | Hand-rolled | Use instead |
|---|---|---|---|
| step-distribution.tsx | 201 | custom export sheet | ExportDrawer |
| pce-modals.tsx | 44 | custom StatusPill | StatusBadge |

### LOW — State coverage
| File | Missing state |
|---|---|
| surveys/page.tsx | loading skeleton |
| templates/page.tsx | error state |
```

## After the sweep

1. Save the backlog to `apps/<product>/docs/ds-sweep-<YYYY-MM-DD>.md`
2. Ask Romit: "Which CRITICAL items should we fix first?"
3. For each fix: run pre-task state declaration → fix → Gate 2 in full

## Non-goals

- This does NOT visually verify — run `node tools/visual-check/run.mjs` separately
- This does NOT check semantic correctness of data — that requires human review
- This does NOT fix anything automatically — it produces the backlog
