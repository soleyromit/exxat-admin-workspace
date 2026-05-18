# CLAUDE.md — Exam Management

## When to load pattern docs (lazy — do NOT load at session start)

- **Before writing any UI component:** read `apps/exam-management/docs/patterns/ui-patterns.md` — UI patterns, DS map, canonical component map, WCAG, FERPA rules.
- **If a P1 flag or PRD change is mentioned:** read `docs/watch/digest-latest.md`
- **After any UI-touching change:** run `compliance-reviewer` alongside `verification-reviewer`

---

## Product identity

| App | Package | Port | Path |
|---|---|---|---|
| Admin | @exxat/exam-management-admin | 3001 | apps/exam-management/admin/ |
| Assessment Taker | @exxat/exam-management-student (Vite) | 5174 | apps/exam-management/assessment-taker/ |
| Student (Next) | @exxat/exam-management-student | 3002 | apps/exam-management/student/ |

**Active build:** Question Bank + Assessment Taker UI pass.
**Design reference:** https://www.magicpatterns.com/c/kq8sem88owbpxfzmopj8in/preview

---

## Assessment-taker DS exception

`assessment-taker/` is student-facing but uses **Admin DS** (`@exxat/ds`), not studentUX. Reason: studentUX has version-pinned Radix imports, a TS conflict on Badge's `style` prop, and Tailwind v4-only CSS that silently drops utilities in v3 apps.

**Switch-back:** when studentUX resolves those issues, swap `@exxat/ds/packages/ui/src` → `@exxat/student/components/ui/*`. Config aliases are already in place for a search-and-replace.

Config anchors: `vite.config.ts`, `tsconfig.json`, `src/index.css` (theme.css → studentUX globals), `index.html` (theme-prism → theme-rose).

---

## Admin app imports

**globals.css:**
```css
@import '../../../../exxat-ds/packages/ui/src/theme.css';
@import "tailwindcss";
@source '../../../../exxat-ds/packages/ui/src/**/*.{ts,tsx}';
```

**next.config.ts webpack aliases:**
```ts
'@exxat/ds'      → path.resolve(__dirname, '../../../exxat-ds')
'@exxat/student' → path.resolve(__dirname, '../../../studentUX/src')
```

**layout.tsx:** `<html lang="en" className="theme-one">` + Typekit + FA Kit (see `docs/CLAUDE-RULES.md` §Font loading)

---

## Already built components

```
components/app-sidebar.tsx        — main nav sidebar
components/data-table/            — vendored canonical DataTable (5 files)
components/data-table/row-actions.tsx — generic RowActions pattern
components/key-metrics/           — vendored KeyMetrics
components/empty-state.tsx        — zero-data panel
components/page-header.tsx        — page header + actions
components/site-header.tsx        — top application header
components/qb/badges.tsx          — QB status/type/diff/blooms badges
lib/qb-types.ts                   — QB TypeScript types
lib/qb-mock-data.ts               — QB mock data
lib/student-mock-data.ts          — student entity mock data
app/(app)/students/               — student list + detail (4 tabs)
```

---

## 10. Workspace Doc Map (lazy-load — read only when relevant)

| Doc | Read when |
|---|---|
| `apps/exam-management/docs/patterns/ui-patterns.md` | Before writing any UI component — contains full canonical component map |
| `docs/CLAUDE-DS-REFERENCE.md` | Need DS component list, tokens, theme system |
| `docs/BASE-ENTITIES.md` | Building Student / Faculty / Course / Term pages |
| `docs/CLAUDE-RULES.md` | Need full always/never rules, font loading, workspace config |
| `docs/watch/digest-latest.md` | P1 flag or PRD change mentioned |
