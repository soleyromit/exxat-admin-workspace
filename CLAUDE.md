# CLAUDE.md — Exxat DS Workspace

> Loaded every message. Keep tight. DS reference (tokens, component APIs, ~8K tokens) is lazy-loaded from `docs/CLAUDE-DS-REFERENCE.md` — read it before generating any UI code.

## Identity

Romit Soley (Product Designer II, Exxat) owns this build branch. Main branch belongs to Himanshu Suthar (Engineering). This branch is never merged to main without Himanshu review.

---

## 1. Repo Map

```
/Users/romitsoley/Work/                 ← monorepo root (THIS FILE lives here)
├── pnpm-workspace.yaml                 ← workspace globs
├── tsconfig.base.json                  ← path aliases: @exxat/ds/*, @exxat/student/*
├── turbo.json                          ← build/dev/lint/type-check pipelines
├── exxat-ds/                           ← Admin DS submodule — READ ONLY
│   └── packages/ui/                    ← @exxat-ds/ui
├── studentUX/                          ← Student DS submodule — READ ONLY
│   └── src/                            ← @exxat/student
├── apps/<product>/{admin,student}/     ← product apps (see docs/PRODUCTS.md)
└── docs/                               ← spec, registries, governance, patterns
```

---

## 2. Products

See `docs/PRODUCTS.md` for the workspace product registry — ids, status, packages, ports, ownership, lifecycle.

Active builds: `exam-management`, `pce`. Planned: `faas`. Scoped: `patient-log`, `skills-checklist`, `learning-contracts`. Alias: `course-eval` → `pce`.

---

## 3. Design System Sources

### Admin DS (`@exxat-ds/ui`)
- **Source:** `exxat-ds/packages/ui/src/` (git submodule — READ ONLY, NEVER EDIT)
- **Remote:** https://github.com/ExxatDesign/Exxat-DS-Workspace.git
- **Update:** `git submodule update --remote --merge` (from monorepo root)
- **Import alias:** `@exxat/ds` → resolves to `exxat-ds/` via `next.config.ts` webpack alias
- **Component import:** `import { Button, Sidebar, ... } from '@exxat/ds/packages/ui/src'`
- **CSS import (in `app/globals.css`):** `@import '../../../../exxat-ds/packages/ui/src/theme.css'`

### Student DS (`@exxat/student`)
- **Source:** `studentUX/src/` (git submodule — READ ONLY, NEVER EDIT)
- **Remote:** ExxatDesign/studentUX (Vite/React project, not npm-publishable)
- **Update:** `git submodule update --remote --merge`
- **Import alias:** `@exxat/student` → resolves to `studentUX/src/`
- **UI import:** `import { Button } from '@exxat/student/components/ui/button'`
- **Shared import:** `import { DataTable, FilterBar } from '@exxat/student/components/shared'`
- **CSS import (in `app/globals.css`):** `@import '../../../../studentUX/src/styles/globals.css'`

> Token tables, component lists, theme system, and full component APIs: see **`docs/CLAUDE-DS-REFERENCE.md`**.

---

## 4. Running the Dev Server

The monorepo root has **no `package.json`** — `pnpm dev --filter` does NOT work from there.

```bash
cd /Users/romitsoley/Work/apps/<product>/<admin|student> && pnpm dev
# Ports: see docs/PRODUCTS.md
```

Persistent background:
```bash
kill $(lsof -ti :PORT) 2>/dev/null
nohup bash -c 'cd <app-dir> && pnpm dev' > /tmp/<product>-<role>-dev.log 2>&1 &
```

If port already in use: `kill $(lsof -ti :PORT)` before restarting.

---

## 5. Workspace Config (confirmed from actual files)

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

### `turbo.json`
```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": { "dependsOn": ["^build"], "outputs": [".next/**", "!.next/cache/**"] },
    "dev": { "cache": false, "persistent": true },
    "lint": {},
    "type-check": { "outputs": [] }
  }
}
```

### `tsconfig.base.json` path aliases
```json
"paths": {
  "@exxat/ds/*":      ["./exxat-ds/*"],
  "@exxat/student/*": ["./studentUX/src/*"]
}
```

### `next.config.ts` (admin apps)
```ts
webpack(config) {
  config.resolve.alias = {
    ...config.resolve.alias,
    '@exxat/ds':      path.resolve(__dirname, '../../../exxat-ds'),
    '@exxat/student': path.resolve(__dirname, '../../../studentUX/src'),
  }
  return config
}
```

### `next.config.ts` (student apps)
```ts
webpack: (config) => {
  config.resolve.alias = {
    ...config.resolve.alias,
    '@exxat/student': path.resolve(__dirname, '../../../studentUX/src'),
  }
  return config
}
```

---

## 6. Quick Token Reference (most-used; full table in `CLAUDE-DS-REFERENCE.md`)

These ~15 tokens cover ~80% of UI work. **Use `var(--token-name)`, never hex.**

| Token | Use for |
|---|---|
| `--background` / `--foreground` | Page surfaces / text on them |
| `--card` / `--card-foreground` | Card surfaces / text on cards |
| `--muted` / `--muted-foreground` | De-emphasized backgrounds / secondary text |
| `--border` | Decorative borders (no AA required) |
| `--border-control-3` / `--border-control-35` | Form-field borders (3:1 / 3.5:1 contrast) |
| `--brand-color` / `--brand-color-dark` | Interactive accent / hover |
| `--brand-tint` | Sidebar / brand-tinted surface |
| `--primary` / `--primary-foreground` | CTA buttons |
| `--destructive` | Error / delete |
| `--ring` | Focus ring (3:1+ contrast) |
| `--radius`, `--radius-sm`, `--radius-md`, `--radius-lg` | Border radii |
| `--control-height`, `--control-height-sm`, `--control-height-touch` | 40px / 32px / 44px (WCAG min) |

**For anything else** (chart colors, conditional formatting, sidebar internals, datatable tokens, student DS): read `docs/CLAUDE-DS-REFERENCE.md`.

---

## 7. Font Loading (admin apps)

Required in every admin `app/layout.tsx`:
```tsx
<head>
  <link rel="stylesheet" href="https://use.typekit.net/wuk5wqn.css" />
  <script src="https://kit.fontawesome.com/d9bd5774e0.js" crossOrigin="anonymous" async />
</head>
```

Font Awesome icon classes (always with `aria-hidden="true"`):
- `fa-light fa-[icon]` — default / inactive
- `fa-regular fa-[icon]` — secondary interactive
- `fa-solid fa-[icon]` — active / selected
- `fa-duotone fa-solid fa-star-christmas` — Leo AI ONLY (with `style={{ color: 'var(--brand-color)' }}`)

Student apps already load Typekit + Inter + FA-Pro via `studentUX/src/styles/globals.css` — do NOT double-import.

Full icon-name map and font-size conventions: `docs/CLAUDE-DS-REFERENCE.md` §14.

---

## 8. Absolute Rules — Apply to ALL Products

- NEVER edit files in `exxat-ds/` or `studentUX/` — read-only submodules
- NEVER commit to main — all work stays on feature branches
- NEVER hardcode hex/rgb colors — use CSS custom properties (`var(--token)`)
- NEVER recreate Button, Badge, Input, Avatar, Dialog, Sheet, Sidebar, Dropdown, Tooltip, DataTable — import from DS
- NEVER use a raw `<button>` — every button must be DS `Button` with explicit `variant` and `size`
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

Badge shape override: `className="rounded"` for rectangular (4px) vs DS pill default; custom colors in `style` prop.

---

## 9. Current Active Build

**Exam Management — Admin (Question Bank)**
- App: `apps/exam-management/admin/`
- Design reference: https://www.magicpatterns.com/c/kq8sem88owbpxfzmopj8in/preview
- QB components ready to migrate: QBView, QBViewTop, QBViewBottom, QBViewMain, QBFolderRows, QBQuestionRow, QBFilterSheet, QBModals, QBFacultyModals, QBAssignModal, QBData, QBStyles, QBInlineHelpers, Portal, QuestionBankFull

**PCE — Admin (master-list entities)**
- App: `apps/pce/admin/`
- 11 entity routes shipped under `app/(app)/admin/`

---

## 10. Workspace Doc Map (where things live)

| Doc | Purpose |
|---|---|
| `/DESIGN.md` | Canonical scholastic spec (43 rules, 7 categories). Read first for any UI work. |
| `docs/CLAUDE-DS-REFERENCE.md` | DS tokens, component APIs, theme system. Lazy-load. |
| `docs/PRODUCTS.md` | Workspace product registry |
| `docs/ANALOGIES.md` | Pattern catalog (Mobbin / competitor refs with sources) |
| `docs/RESEARCH-SIGNALS.md` | Cross-product signals (3+ product threshold) |
| `docs/COMPETITOR-INTEL.md` | Per-product anchored competitor analysis |
| `docs/SUBAGENTS.md` | When to spawn a subagent vs inline |
| `docs/triggers.md` | UserPromptSubmit hook trigger map |
| `docs/governance/context-architecture.md` | 3-ring context model + roadmap |
| `docs/governance/exceptions.md` | Override ledger |
| `docs/patterns/<category>/*.md` | Pattern library |
| `docs/foundations/ds-profiles/{admin,student}.md` | Per-DS profile |
| `apps/<product>/CLAUDE.md` | Per-product extension |
| `apps/<product>/docs/storytelling/*.md` | Per-product perspectives |
| `apps/<product>/docs/decisions/*.md` | Per-product ADRs |

---

## 11. How to Start a New Product

1. Add a row to `docs/PRODUCTS.md` (use the schema)
2. Read `apps/<product>/CLAUDE.md` template — create it for the new product
3. Create admin `next.config.ts` with both `@exxat/ds` and `@exxat/student` webpack aliases
4. Create student `next.config.ts` with `@exxat/student` webpack alias
5. Import `theme.css` in admin `app/globals.css`; import `studentUX/src/styles/globals.css` in student
6. Add Typekit + Font Awesome to admin `app/layout.tsx` (see §7)
7. Add `<html class="theme-one">` to admin layout (default brand = Exxat One Lavender)
8. Add `#<id>` section to `docs/COMPETITOR-INTEL.md` (stub OK)
9. Update `pnpm-workspace.yaml`
10. Import DS components — never recreate them (see `docs/CLAUDE-DS-REFERENCE.md`)
