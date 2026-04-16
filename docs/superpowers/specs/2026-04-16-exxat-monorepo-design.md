# Exxat Product Monorepo — Architecture & Exam Management Sample Design

**Date:** 2026-04-16  
**Author:** Romit Soley (Product Designer II, Exxat)  
**Status:** Approved — ready for implementation

---

## 1. Goal

Set up a pnpm + Turborepo monorepo at `/Users/romitsoley/Work/` that:

1. Consumes both Exxat design systems via **git submodules** (no changes to DS repos)
2. Provides a clean developer workspace for 5 products, each with an admin and student app
3. Demonstrates the DS integration via a working **Exam Management sample** — full admin QB flow + student assessment flow

---

## 2. Repository Structure

```
Work/                               ← new git repo (main branch)
  exxat-ds/                         ← git submodule → github.com/ExxatDesign/Exxat-DS (main)
  studentUX/                        ← git submodule → github.com/ExxatDesign/studentUX (main)
  apps/
    exam-management/
      admin/                        ← Next.js 16 App Router — Admin DS
      student/                      ← Next.js 16 App Router — Student DS
    patient-log/
      admin/
      student/
    pce/
      admin/
      student/
    skills-checklist/
      admin/
      student/
    learning-contracts/
      admin/
      student/
  tsconfig.base.json                ← shared TS config with path aliases
  pnpm-workspace.yaml
  turbo.json
  .gitmodules
  CLAUDE.md
  docs/
    superpowers/
      specs/                        ← design specs (this file)
```

### Submodule rules

- `exxat-ds/` and `studentUX/` are **read-only** — never edit files inside them
- To pull DS updates: `git submodule update --remote --merge`
- Monorepo branches are completely independent from DS repo branches

---

## 3. Design System Integration

### Approach: TypeScript path aliases (Approach B)

A shared `tsconfig.base.json` at the root maps clean aliases to both submodules:

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@exxat/ds/*": ["./exxat-ds/*"],
      "@exxat/student/*": ["./studentUX/src/*"]
    }
  }
}
```

Every app's `tsconfig.json` extends this file. Every app's `next.config.ts` mirrors aliases via webpack config so the build resolves them.

### Import conventions

```ts
// Admin DS — tokens, theme, components
import "@exxat/ds/src/index.css"
import { applyTheme, THEMES } from "@exxat/ds/src/themes"

// Student DS — UI primitives and composites
import { PrimaryPageTemplate, DataTable, FilterBar } from "@exxat/student/components/shared"
import { Button } from "@exxat/student/components/ui/button"
```

### What lives where

| Source | Path alias | Contains |
|---|---|---|
| `ExxatDesign/Exxat-DS` | `@exxat/ds/*` | CSS tokens, themes, Next.js component patterns, WCAG rules |
| `ExxatDesign/studentUX` | `@exxat/student/*` | UI primitives (shadcn-based), shared composites, layout, features, brand |

---

## 4. Workspace Config

### `pnpm-workspace.yaml`
```yaml
packages:
  - 'apps/*'
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
    "build": { "dependsOn": ["^build"], "outputs": [".next/**"] },
    "dev": { "cache": false, "persistent": true },
    "lint": {}
  }
}
```

---

## 5. Exam Management — Admin App

**Path:** `apps/exam-management/admin/`  
**Package name:** `@exxat/exam-management-admin`  
**Framework:** Next.js 16 App Router  
**Design system:** Admin DS (`@exxat/ds/*`)  
**Dev port:** 3001

### DS wiring in `app/layout.tsx`
- Import `@exxat/ds/src/index.css`
- Call `applyTheme()` with the exam theme key — read actual available keys from `exxat-ds/src/themes.ts` at implementation time; do not guess
- Load Typekit font: `https://use.typekit.net/wuk5wqn.css`
- Load Font Awesome Pro kit: `https://kit.fontawesome.com/d9bd5774e0.js`

### Page shell pattern (every page)
```tsx
<SidebarInset>
  <SiteHeader title="..." />
  <main id="main-content" tabIndex={-1} className="flex flex-1 flex-col outline-none">
    <div className="@container/main flex flex-1 flex-col w-full max-w-[1440px] mx-auto">
      <PageClient />
    </div>
  </main>
</SidebarInset>
```

### Routes (starting set — expandable as Magic Patterns screens are migrated)

| Route | Screen | Key Admin DS Components |
|---|---|---|
| `/` | Question Bank hub | `ListPageTemplate`, `DataTable`, `useTableState`, `TablePropertiesDrawer`, `KeyMetrics`, `PageHeader` |
| `/questions/new` | Add Question wizard | `SidebarAutoCollapse`, multi-step form, `Button`, `Field` |
| `/questions/[id]` | Question detail/edit | `SiteHeader` with breadcrumbs, `Sheet` for properties drawer |
| `/access` | Share Access management | `DataTable` of users/roles, invite form |
| `/private` | Private Space | Filtered QB view, personal questions only |

### Views within QB hub
Toggled via `role="toolbar"` switcher (not tabs — mixed controls):
- **All** — flat question list
- **By Course** — grouped `DataTable` rows by course
- **By Folder** — grouped/tree view by folder

### Role toggle (Admin vs Faculty)
A switcher in `PageHeader` area. Admin sees all questions + full management actions. Faculty sees shared + own questions with limited actions. Implemented as a state toggle that filters `DataTable` data and conditionally renders action columns.

### Admin DS rules that apply
- No raw `<table>` — always `DataTable` from the DS
- No hardcoded hex/rgb — CSS custom properties only (`var(--brand)`, `var(--muted)`, etc.)
- No `toast()` — use `LocalBanner` or inline feedback
- All icons `aria-hidden="true"`, Ask Leo icon: `fa-duotone fa-solid fa-star-christmas text-brand`
- Icon-only buttons: `aria-label` + `<Tip>` tooltip, minimum 24×24px target
- Dates: `MM/DD/YYYY` / `MM/DD/YYYY hh:mm AM/PM EST` everywhere

---

## 6. Exam Management — Student App

**Path:** `apps/exam-management/student/`  
**Package name:** `@exxat/exam-management-student`  
**Framework:** Next.js 16 App Router  
**Design system:** Student DS (`@exxat/student/*`)  
**Dev port:** 3002

### DS wiring in `app/layout.tsx`
- Import `@exxat/student/styles/globals.css`
- Load Typekit font: `https://use.typekit.net/wuk5wqn.css`
- Load Font Awesome Pro kit: `https://kit.fontawesome.com/d9bd5774e0.js`
- All interactive components get `'use client'` directive

### Routes (starting set — expandable)

| Route | Screen | Key Student DS Components |
|---|---|---|
| `/` | Assessment list | `PrimaryPageTemplate`, `DataTable`, `FilterBar`, `Pagination` |
| `/exam/[id]` | Take exam | `PipelineStepper` (progress), question cards, `Button` |
| `/exam/[id]/results` | Results & review | `KeyMetricsShowcase`, question review list, `SectionCard` |

### Student DS component conventions
- Use `PrimaryPageTemplate` as the outer shell for list pages
- Use `DataTable` + `FilterBar` from `@exxat/student/components/shared` — not raw `<table>`
- Use `PipelineStepper` for multi-step exam progress
- Use `AskLeoButton` where AI assistance is contextually relevant
- All Student DS components are used as `'use client'` — add directive to any wrapper that uses them

---

## 7. Remaining Products (Scaffold Only)

The following products get empty Next.js scaffolds (no screens) in this implementation:

| Product | Admin port | Student port |
|---|---|---|
| `patient-log` | 3003 | 3004 |
| `pce` | 3005 | 3006 |
| `skills-checklist` | 3007 | 3008 |
| `learning-contracts` | 3009 | 3010 |

Each scaffold includes: `package.json`, `tsconfig.json` (extends base), `next.config.ts` (with aliases), `app/layout.tsx` (DS wired), `app/page.tsx` (placeholder).

---

## 8. CLAUDE.md

A `CLAUDE.md` at the repo root that every future Claude session reads first. Sections:

1. Repo map with annotations
2. Submodule reference + update command
3. Path aliases table
4. Admin DS patterns (page shell, DataTable stack, component reuse rules, accessibility checklist)
5. Student DS component catalog (exact exports from `shared/index.ts` and `ui/`)
6. Per-product theme table (expandable)
7. Font loading URLs
8. Hard rules (never edit submodules, never hardcode hex, never recreate DS components, `'use client'` on interactive components)
9. Current work — Exam Management QB active build, screen list is a living section

---

## 9. Out of Scope (This Phase)

- Authentication / real API data — all data is mocked
- Publishing DS packages to npm
- CI/CD pipeline
- Deployment
- Full screen coverage for Exam Management — screen list expands as Magic Patterns design is migrated

---

## 10. Success Criteria

- [ ] `git submodule status` shows both DS repos pinned at a commit
- [ ] `pnpm install` from root installs all app dependencies
- [ ] `turbo dev` starts all apps without error
- [ ] `apps/exam-management/admin/` renders QB hub using Admin DS tokens (correct brand color, Typekit font, Font Awesome icons)
- [ ] `apps/exam-management/student/` renders Assessment list using Student DS components
- [ ] All other product apps render their placeholder page
- [ ] `CLAUDE.md` accurately documents all tokens, components, and rules
- [ ] No hex colors hardcoded anywhere in `apps/`
- [ ] No files inside `exxat-ds/` or `studentUX/` are modified
