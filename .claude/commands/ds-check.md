# DS Compliance Check

Audit the specified file (or all staged files if no argument given) against Exxat-DS and studentUX rules. Report every violation grouped by rule. Fix nothing — report only, so the developer decides.

## Usage
- `/ds-check` — audit all git-staged TSX files
- `/ds-check path/to/file.tsx` — audit one file
- `/ds-check app/(app)/question-bank/` — audit a directory

## Rules to check

### R1 — Raw HTML instead of DS components
- `<button` → must be DS `<Button variant size>`
- `<input` → must be DS `<Input>` (unless `type="hidden"` or `type="file"`)
- `<select` → must be DS `<Select>`
- `<textarea` → must be DS `<Textarea>`

### R2 — Inline typography on non-icon elements
Any `style={{...}}` containing `fontSize` or `fontWeight` on elements that are NOT `<i>` is a violation.
- `fontSize: 13/14` → `text-sm`
- `fontSize: 11/12` → `text-xs`
- `fontSize: 10` → `text-[10px]`
- `fontWeight: 500/600/700` → `font-medium/semibold/bold`

### R3 — Inline color for DS token colors
`style={{ color: 'var(--foreground)' }}` → `className="text-foreground"`
`style={{ color: 'var(--muted-foreground)' }}` → `className="text-muted-foreground"`
`style={{ color: 'var(--destructive)' }}` → `className="text-destructive"`
`style={{ color: 'var(--primary-foreground)' }}` → `className="text-primary-foreground"`

### R4 — Hardcoded persona/avatar colors
`background: persona.color` or `background: p.color` → `var(--avatar-initials-bg)` + `var(--avatar-initials-fg)`

### R5 — Wrong DS token for theme-prism
`var(--brand-tint)` in active/highlight states → `var(--sidebar-accent)` (brand-tint is not overridden for prism)

### R6 — DS component used with wrong variant/size
- `Button` without explicit `variant` and `size` props
- `Badge` used where a plain `<span>` with className would suffice (no padding/border needed)

### R7 — Inline oklch/hex/rgb color values
Any `oklch(`, `#[0-9a-f]{3,6}`, `rgb(`, `rgba(` in a style prop → define a CSS variable in globals.css instead

### R8 — Wrong InputGroup composition
`<Input` as a direct child of `<InputGroup` → must use `<InputGroupInput` (border-stripped variant).
`<input` inside any group → same.
Using `<div>` + `<input>` for a search bar → must use `InputGroup` + `InputGroupAddon` + `InputGroupInput`.

### R9 — Icon-only Button missing aria-label
`<Button size="icon` (icon, icon-sm, icon-xs, icon-lg) without an `aria-label` prop is a violation.
Every icon-only button must have `aria-label="..."`.

### R10 — Non-Font-Awesome icons in admin app
Any import from `lucide-react`, `@heroicons`, `react-icons`, or `phosphor-react` in an admin app file → must use Font Awesome `<i className="fa-...">` instead.

### R11 — white in color-mix
`color-mix(in oklch, ... white)` or `color-mix(in oklch, white ...)` → use `var(--background)` instead of `white`.

### R12 — Missing overflow-hidden on rounded DS Table wrapper
`<div className="... rounded-lg ...">` or `rounded-xl` containing `<Table` without `overflow-hidden` → add `overflow-hidden` to the wrapper div, otherwise rounded corners don't clip the scroll container.

## Output format

For each violation, print:
```
[R2] app/(app)/question-bank/qb-table.tsx:2894
  <div style={{ fontSize: 12.5, fontWeight: 500 ... }}>
  → className="text-sm font-medium"
```

Group by file, then by rule. At the end print a summary:
```
Total violations: N across M files
R1 (raw HTML): X  R2 (inline font): Y  R3 (inline color): Z ...
```

## Process

1. If `$ARGUMENTS` is empty, run: `git diff --name-only --cached | grep '\.tsx$'`
2. If `$ARGUMENTS` is a directory, find all `.tsx` files in it
3. Read each file and scan for violations of R1–R7
4. Report — do NOT make any edits
