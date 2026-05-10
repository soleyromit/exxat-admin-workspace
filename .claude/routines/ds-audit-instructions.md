# DS Weekly Audit — Agent Instructions

**Owner:** Romit Soley (Product Designer II, Exxat)
**Triggered by:** `ds-weekly-audit` scheduled routine (weekly Tuesday 9am ET)
**Scope:** All 5 products × admin + student apps = 10 app directories

---

## What you are doing

A full weekly audit of every `.tsx` file in every product app, checking for violations of the Exxat DS rules (DS-001 through DS-017) and A11Y rules. Safe violations are auto-fixed. Unsafe ones are reported.

Two sources of truth:
- **Admin DS:** `exxat-ds/packages/ui/src/index.ts` — exports every valid component
- **Student DS:** `studentUX/src/components/shared/index.ts` + `studentUX/src/components/ui/`

---

## Step 1 — Snapshot the DS exports

Read these files to know what actually exists:

```bash
grep "^export" exxat-ds/packages/ui/src/index.ts | head -300
```

```bash
ls studentUX/src/components/ui/
grep "^export" studentUX/src/components/shared/index.ts | head -200
```

Store the list of valid admin exports and valid student exports. Any component imported from `@exxat/ds` or `@exxat/student` that is NOT in these lists is a hallucinated/invalid import.

---

## Step 2 — Find all TSX files across all products

```bash
find apps -name "*.tsx" -not -path "*/node_modules/*" -not -path "*/.next/*"
```

Process each file. For admin apps (`apps/*/admin/`), apply admin DS rules. For student apps (`apps/*/student/` and `apps/*/assessment-taker/`), apply student DS rules.

---

## Step 3 — Check each file for violations

### DS-001 — Raw `<button>` element
```bash
grep -n "<button" <file>
```
Flag any `<button` that is NOT inside a DS component definition.
**Auto-fix:** Cannot auto-fix — requires design judgment on variant + size. Add to report.

### DS-002 — Hardcoded colors (hex, rgb, hsl, oklch literals)
```bash
grep -n "oklch(\|#[0-9a-fA-F]\{3,6\}\|rgb(\|rgba(\|hsl(" <file>
```
Exception: inside `apps/*/globals.css` files — those are intentional token definitions.
Exception: inside `color-mix(in oklch, var(--` — that's fine.
**Auto-fix:** Cannot safely auto-fix without knowing the intended token. Add to report with the value and suggest the closest token.

### DS-003 — Inline boxShadow
```bash
grep -n "boxShadow\|box-shadow" <file>
```
**Auto-fix:** Cannot auto-fix without knowing intent. Report.

### DS-004 — Raw `<table>` element
```bash
grep -n "<table" <file>
```
**Auto-fix:** Cannot auto-fix. Report.

### DS-005 — toast() / Sonner in admin apps
```bash
grep -n "toast(\|from 'sonner'" <file>
```
Only flag in admin apps (`apps/*/admin/`).
**Auto-fix:** Cannot auto-fix without knowing the replacement. Report.

### DS-006 — Edits to submodules
Check that no file inside `exxat-ds/` or `studentUX/` has been modified:
```bash
git status exxat-ds/ studentUX/
```
If any modified files: report immediately as a critical violation.

### DS-008 — Tailwind color utilities not on the allowlist
```bash
grep -n "bg-\|text-\|border-" <file> | grep -v "bg-background\|bg-card\|bg-muted\|bg-popover\|bg-primary\|bg-secondary\|bg-destructive\|bg-accent\|text-foreground\|text-muted-foreground\|text-primary\|text-secondary\|text-destructive\|text-primary-foreground\|border-border\|border-input\|border-primary\|border-destructive"
```
Any `bg-{color}-{shade}` or `text-{color}-{shade}` pattern (like `bg-blue-500`, `text-red-400`) is a violation.
**Auto-fix:** Cannot auto-fix without knowing intent. Report.

### DS-013 — Raw oklch() in inline style props
```bash
grep -n "style=.*oklch(" <file>
```
**Auto-fix:** YES. Define a CSS variable in the app's `globals.css` and replace with `var(--new-token)`. For each violation, choose the nearest existing token or create a new one with a `--qb-` prefix if it's QB-specific.

### DS-014 — `white` inside color-mix()
```bash
grep -n "color-mix.*white" <file>
```
**Auto-fix:** YES. Replace `white` with `var(--background)` inside every `color-mix()` that uses `white`.

### DS-010 — Hallucinated DS imports
```bash
grep -n "from '@exxat/ds" <file>
```
For each imported name, check it exists in the DS exports snapshot from Step 1.
**Auto-fix:** Cannot auto-fix. Report with the invalid import name and suggest the correct one if identifiable.

### A11Y-001 — Icon-only buttons missing aria-label
```bash
grep -n 'size="icon' <file>
```
For each icon-sized button, check if `aria-label` is present.
**Auto-fix:** Cannot auto-fix without knowing the correct label. Report each missing one with the button's context.

### A11Y-004 — FA icons missing aria-hidden
```bash
grep -n 'className="fa-' <file>
```
For each FA icon, check if `aria-hidden="true"` is present.
**Auto-fix:** YES. Add `aria-hidden="true"` to any `<i className="fa-...">` that is missing it, provided the element is purely decorative (inside a button that already has aria-label, or inside a span with no semantic role).

### DS-015 — Button missing explicit variant
```bash
grep -n "<Button" <file>
```
For each `<Button` that does NOT have `variant=`, flag it.
**Auto-fix:** Cannot auto-fix without design judgment. Report.

### DS-016 — Table inside rounded wrapper without overflow-hidden
```bash
grep -n "rounded.*<Table\|<Table.*rounded" <file>
```
Heuristic: look for `<div className="...rounded...">` immediately wrapping `<Table`.
If `overflow-hidden` is absent from the wrapper: flag it.
**Auto-fix:** YES. Add `overflow-hidden` to the wrapper div's className.

---

## Step 4 — Apply auto-fixes

For files with auto-fixable violations (DS-013, DS-014, A11Y-004, DS-016):

1. Read the full file
2. Apply each fix surgically
3. For DS-013 (raw oklch in style): add the CSS variable to the app's `globals.css` AND replace the inline style reference
4. For DS-014 (white in color-mix): replace `white` with `var(--background)` — search the full file, replace all occurrences
5. For A11Y-004 (missing aria-hidden): add `aria-hidden="true"` to the `<i>` element
6. For DS-016 (missing overflow-hidden): add to the wrapper div

---

## Step 5 — Check DS submodule for updates

```bash
git log --oneline exxat-ds/packages/ui/src/index.ts | head -5
git log --oneline studentUX/src/components/shared/index.ts | head -5
```

If either submodule has new commits since last audit, report:
- New components added (new exports)
- Components removed or renamed (potential breaking changes)
- Any changes to existing component APIs

---

## Step 6 — Output report

```
## DS Weekly Audit — <date>

### Submodule status
- exxat-ds: <last commit> — <N new exports / no changes>
- studentUX: <last commit> — <N new exports / no changes>

### Auto-fixes applied
| File | Rule | What was fixed |
|---|---|---|
| apps/exam-management/admin/... | DS-014 | Replaced `white` with `var(--background)` in 3 color-mix() calls |

### Violations requiring manual fix
| File | Rule | Violation | Suggested fix |
|---|---|---|---|
| apps/exam-management/admin/... | DS-001 | Raw <button> at line 47 | Replace with DS Button variant="ghost" size="icon-sm" |

### Stats
- Files scanned: N
- Auto-fixes applied: N
- Manual violations: N
- Critical (DS-006 submodule edits): N
```

---

## Absolute rules
- Never edit files in `exxat-ds/` or `studentUX/`
- Never commit — only edit files
- Only touch files inside `apps/` directory
- When in doubt, report rather than auto-fix
