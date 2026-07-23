# CLAUDE-RULES.md — Full Workspace Rules

> Lazy-loaded from CLAUDE.md. Read this when you need the full always/never list, DS source reading rules, workspace config, verification patterns, font loading, or new product setup.

---

## Always / Never list

- NEVER edit files in `exxat-ds/` or `studentUX/` — read-only submodules
- NEVER commit to main — all work stays on feature branches
- NEVER hardcode hex/rgb colors — use CSS custom properties (`var(--token)`)
- NEVER recreate Button, Badge, Input, Avatar, Dialog, Sheet, Sidebar, Dropdown, Tooltip, DataTable — import from DS or VENDOR per registry
- NEVER use a raw `<button>` — every button must be DS `Button` with explicit `variant` and `size`
- NEVER build a "data-table.tsx", "key-metrics.tsx", "section-cards.tsx", "export-drawer.tsx", "coach-mark.tsx", "command-menu.tsx" file in a product `components/` dir without consulting the registry first
- NEVER use `<Card>` as a bare container with raw `<div>` children — use Card slots (CardHeader, CardTitle, CardDescription, CardContent, CardAction, CardFooter)
- NEVER use `white` in `color-mix()` — always use `var(--background)`
- NEVER use toast (`toast()` / Sonner) for product feedback — use banners or inline status
- NEVER build list pages with raw `<table>` or third-party grids — use DS `DataTable` (admin) or shared `DataTable` (student)
- ALWAYS add `'use client'` to interactive React components
- ALWAYS use Font Awesome icons with `aria-hidden="true"`
- ALWAYS use the correct DS for the app type (Admin DS for admin, Student DS for student)
- ALWAYS import `theme.css` (not `globals.css`) from Admin DS in product admin apps
- ALWAYS read `exxat-ds/packages/ui/src/index.ts` before importing admin components
- ALWAYS read `studentUX/src/components/shared/index.ts` and `ui/` before importing student components
- Touch targets: minimum 44px on mobile (WCAG 2.5.5) — use `--control-height-touch`
- Border contrast: use `--border-control-35` for form-field borders (≥3.5:1)
- Focus ring: `--ring` token only — never remove focus outlines
- Badge shape override: `className="rounded"` for rectangular (4px) vs DS pill default; custom colors in `style` prop

---

## Read DS source before using layout-affecting components

**Before using `Table`, `TableRow`, `TableHead`, `TableCell`, `Sidebar`, `Tabs`, `TabsList`, `TabsTrigger`, `Sheet`, `DataTable`, `Card` slots — read its source file first:**

```bash
find exxat-ds/packages/ui/src/components -name "<component>.tsx"
```

| Component | Wrong assumption | Reality | Consequence |
|---|---|---|---|
| `Table` | Needs `overflow-x-auto` wrapper | Already wraps internally | Double scroll container |
| `TableRow` | Neutral by default | Bakes in `hover:bg-interactive-hover-subtle transition-colors` | Competing hover classes |
| `TableHead` | Needs `scope="col"` | Already defaults `scope="col"` | Redundant attribute |
| `Card` | Plain container | Has named slots (CardHeader, CardContent, etc.) | Structural slot violation |

---

## DS adoption — before creating any new component file

1. Read `docs/governance/ds-adoption.md` — canonical registry of DS organisms
2. Spawn `ds-adoption-reviewer` subagent — returns IMPORT / VENDOR / HAND-ROLL verdict
3. Follow the verdict. Pre-commit hook `scripts/ds-adoption-audit.py --strict` blocks hand-rolls that mirror DS organisms.

**Before building any Student, Faculty, Course Offering, Term, or Master Course page:** read `docs/BASE-ENTITIES.md`.

**Before designing any admin entity detail page, list page with view-mode toggle, or list page with row actions:** read `docs/patterns/admin/row-actions.md`, `list-page-view-toggle.md`, or `entity-detail-shell.md`.

---

## Verification discipline — before declaring done

- **Pattern A** — "Clean" ≠ "fine". List what wasn't checked. Never say "clean" without scope.
- **Pattern B** — Sibling coverage. Fix the bug *class*, not just the reported instance.
- **Pattern C** — Scope enumeration. Enumerate the FULL set before starting. State the count.
- **Pattern D** — Canonical comparison. Compare against the canonical's slot composition and variants.
- **Pattern E** — Adversarial self-review. Spawn `verification-reviewer` subagent after non-trivial changes.
- **State coverage** — for pages that fetch async data, accept form input, or render a list/grid:
  - Loading: `Skeleton` matching post-load shape
  - Empty: icon + heading + 1-line explanation + optional CTA
  - Error: `LocalBanner variant="error"` with retry
  - Validation: `aria-invalid` + `<FieldError>` per field + multi-error `<LocalBanner>`
  - Submission: `LocalBanner variant="success"` after save (NEVER toast)
  - Disabled: component's own `disabled` prop (NEVER `opacity-60` on parent with `text-muted-foreground`)
  - Focus: DS `<Button>` OR `focus-visible:ring` + `tabIndex={0}` + `onKeyDown`
  Spawn `state-review` subagent after touching such pages.

**For UI-touching changes:** spawn `visual-review` subagent — runs Playwright + axe-core, catches visual rendering issues and runtime a11y violations. Dev server must be running.

---

## Architecture self-improvement

At session-end (or when discipline log gains ≥2 entries), spawn `architect` subagent. It reads `python3 scripts/architect-input.py` and writes a proposal to `docs/governance/architect-runs/YYYY-MM-DD-<slug>.md`. Never commits — Romit reviews + applies.

---

## Font loading (admin apps)

```tsx
// app/layout.tsx
<head>
  <link rel="stylesheet" href="https://use.typekit.net/wuk5wqn.css" />
  <script src="https://kit.fontawesome.com/d9bd5774e0.js" crossOrigin="anonymous" async />
</head>
```

FA icon weight convention:
- `fa-light fa-[icon]` — default / inactive
- `fa-regular fa-[icon]` — secondary interactive
- `fa-solid fa-[icon]` — active / selected
- `fa-duotone fa-solid fa-star-christmas` — Leo AI ONLY (`style={{ color: 'var(--brand-color)' }}`)

Student apps load Typekit + Inter + FA-Pro via `studentUX/src/styles/globals.css` — do NOT double-import.

---

## Workspace config

### `pnpm-workspace.yaml`
```yaml
packages:
  - 'exxat-ds/packages/*'
  - 'apps/exam-management/*'
  - 'apps/patient-log/*'
  - 'apps/pce/*'
  - 'apps/skills-checklist/*'
  - 'apps/learning-contracts/*'
```

### `tsconfig.base.json` path aliases
```json
"paths": {
  "@exxat/ds/*":      ["./exxat-ds/*"],
  "@exxat/student/*": ["./studentUX/src/*"]
}
```

### `next.config.ts` webpack aliases (admin apps)
```ts
'@exxat/ds':      path.resolve(__dirname, '../../../exxat-ds'),
'@exxat/student': path.resolve(__dirname, '../../../studentUX/src'),
```

### `next.config.ts` webpack alias (student apps)
```ts
'@exxat/student': path.resolve(__dirname, '../../../studentUX/src'),
```

---

## How to start a new product

1. Add a row to `docs/PRODUCTS.md`
2. Create `apps/<product>/CLAUDE.md`
3. Create admin `next.config.ts` with `@exxat/ds` + `@exxat/student` aliases
4. Create student `next.config.ts` with `@exxat/student` alias
5. Import `theme.css` in admin `app/globals.css`; `studentUX/src/styles/globals.css` in student
6. Add Typekit + Font Awesome to admin `app/layout.tsx`
7. Add `<html class="theme-one">` to admin layout
8. Add `#<id>` section to `docs/COMPETITOR-INTEL.md`
9. Update `pnpm-workspace.yaml`

---

## Full doc map

| Doc | Purpose |
|---|---|
| `/DESIGN.md` | Canonical scholastic spec (43 rules, 7 categories) — read first for any UI work |
| `docs/BASE-ENTITIES.md` | Cross-product entity spec — Student, Faculty, Course Offering, Term, Master Course |
| `node tools/ds/source.mjs` (+ globals.css) | DS tokens, component APIs, theme system |
| `docs/PRODUCTS.md` | Workspace product registry |
| `docs/ANALOGIES.md` | Pattern catalog (Mobbin / competitor refs) |
| `docs/RESEARCH-SIGNALS.md` | Cross-product signals (3+ product threshold) |
| `docs/COMPETITOR-INTEL.md` | Per-product competitor analysis |
| `docs/SUBAGENTS.md` | When to spawn a subagent vs inline |
| `docs/triggers.md` | UserPromptSubmit hook trigger map |
| `docs/governance/context-architecture.md` | 3-ring context model + roadmap |
| `docs/governance/exceptions.md` | Override ledger |
| `docs/digest/latest.md` | Auto-generated workspace snapshot |
| `docs/patterns/<category>/*.md` | Pattern library |
| `docs/watch/` | PRD watcher, compliance sweep, DS snapshot, decision cache |
| `apps/<product>/CLAUDE.md` | Per-product extension |
| `apps/pce/prototype/pce-evaluation.html` | Canonical 8-persona PCE prototype |
| `apps/pce/docs/research/prototype-cards-catalog.md` | Prototype card audit vs Aarti approvals |
