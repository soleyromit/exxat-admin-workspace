# DS Profile — Student (StudentUX)

> Loaded by SessionStart hook when cwd matches `apps/*/student/`.
> Loaded by UserPromptSubmit hook on triggers: "switch to student", "studentUX", "@exxat/student".
> Source of truth for the DS surface: `studentUX/src/`.
> Full token reference: workspace `CLAUDE.md` §8–10.

**Version:** 0.1.0 (2026-05-08)
**DS Source:** `studentUX/src/` (Vite/React project, not an npm-publishable package)
**Apps using this profile:** `@exxat/exam-management-student` (3002), `@exxat/patient-log-student` (3004), `@exxat/pce-student` (3006), `@exxat/skills-checklist-student` (3008), `@exxat/learning-contracts-student` (3010)

---

## 1. Imports

UI primitives — import per-file, NOT barreled:

```ts
import { Button } from '@exxat/student/components/ui/button'
import { Card, CardHeader, CardContent } from '@exxat/student/components/ui/card'
import { Input } from '@exxat/student/components/ui/input'
```

Composite components — barreled from shared:

```ts
import { DataTable, FilterBar, PrimaryPageTemplate, AskLeoButton } from '@exxat/student/components/shared'
```

Two import models, not one. UI primitives = individual files. Shared composites = barrel.

## 2. CSS imports (app/globals.css)

```css
@import "tailwindcss";
@import '../../../../studentUX/src/styles/globals.css';   /* full DS CSS, includes fonts */
@source '../../../../studentUX/src/components/**/*.{ts,tsx}';
```

Student bundles tokens + Tailwind base + font imports in `globals.css`. Different from admin which uses `theme.css`.

## 3. Webpack alias (next.config.ts)

```ts
webpack: (config) => {
  config.resolve.alias = {
    ...config.resolve.alias,
    '@exxat/student': path.resolve(__dirname, '../../../studentUX/src'),
  }
  return config
}
```

Only `@exxat/student` aliased. NO `@exxat/ds` — student apps must not import admin DS.

## 4. Fonts — DO NOT inject in app/layout.tsx

Already imported in `studentUX/src/styles/globals.css`:

| Asset | Source |
|---|---|
| Inter | `@import url("https://fonts.googleapis.com/css2?family=Inter:...")` |
| Typekit | `@import url("https://use.typekit.net/kmo8bbz.css")` |
| FA Pro | `@import url('https://kit.fontawesome.com/bff072b36d.css')` |

Do NOT double-import in `layout.tsx`. They load automatically when `globals.css` is imported.

| Asset | Student | NOT student (admin) |
|---|---|---|
| Typekit kit | `kmo8bbz` | `wuk5wqn` |
| FA Pro kit | `bff072b36d` | `d9bd5774e0` |

## 5. Theme application

Student apps are brand-locked to **Lavender**. No theme switcher, no `useAppTheme`.

```tsx
<html lang="en">
  <body className="antialiased">{children}</body>
</html>
```

## 6. Tokens — key values

Root font-size: **14px** (`87.5%` on `<html>`). Spacing math is mobile-friendly. ⚠ All admin spacing intuitions are wrong here — recompute.

Critical color tokens (slightly different oklch values from admin):

| Token | Value | Use |
|---|---|---|
| `--brand-color` | oklch(0.535 0.132 286.1) | interactive accent (lighter than admin's 0.50) |
| `--brand-color-surface` | oklch(0.9676 0.016 286.1) | sidebar bg |
| `--primary` | oklch(0.26 0.008 286.1) | primary CTA (darker than admin's 0.3457) |
| `--foreground` | oklch(0.145 0 0) | text |
| `--muted-foreground` | oklch(0.55 0.012 286.1) | secondary text |
| `--border` | oklch(0.92 0.004 286.1) | decorative |
| `--border-control-35` | oklch(0.25 0.01 286.1) | form fields |

Spacing scale (named tokens — admin doesn't have these):
- `--spacing-xs`: 0.25rem
- `--spacing-sm`: 0.5rem
- `--spacing-md`: 0.75rem
- `--spacing-lg`: 1rem
- `--spacing-xl`: 1.5rem
- `--spacing-2xl`: 2rem
- `--spacing-3xl`: 3rem
- `--spacing-4xl`: 4rem

Density / responsive:

| Token | Value |
|---|---|
| `--density` | comfortable |
| `--control-height` | 40px |
| `--control-height-touch` | **44px (mobile primary)** |
| `--content-max-width-desktop` | 1040px |
| `--content-max-width-tablet` | 768px |
| `--content-gutter` | 24px |

Full reference: workspace CLAUDE.md §8.

## 7. Components — student DS surface

**UI primitives** (per-file imports from `@exxat/student/components/ui/<name>`):

```
accordion, alert-dialog, alert, aspect-ratio, avatar, badge, breadcrumb,
button-group, button, calendar, card, carousel, chart, checkbox,
collapsible, command, context-menu, dialog, drawer, dropdown-menu,
empty, error-boundary, field, form, hover-card, input-group, input-otp,
input, kbd, label, menubar, navigation-menu, outline-search-input,
pagination, popover, progress, radio-group, resizable, scroll-area,
searchable-select, select, separator, sheet, sidebar, skeleton, slider,
sonner, switch, table, tabs, textarea, toggle-group, toggle, tooltip
```

Plus: `use-mobile.ts`, `utils.ts`.

**Shared composites** (`@exxat/student/components/shared`):

| Category | Components |
|---|---|
| Cards | `ActionCard`, `SectionCard`, `InsightCard`, `MetricCard`, `InternshipCard`, `PartnerSitePerformanceCard`, `PendingApprovalChartCard`, `KeyMetricsShowcase`, `SectionWithHeader`, `AlertsSection`, `MapSection`, `AddressMap`, `ScheduleBanners`, `SimpleMetric` |
| Table infra | `DataTable`, `Pagination`, `TableProperties`, `FilterClauseEditor`, `ViewManager`, `FilterBar`, `FloatingActionBar`, `BulkActionBar` |
| Page templates | `PrimaryPageTemplate`, `ReportPageTemplate`, `WelcomePageTemplate`, `BuildProfilePageTemplate`, `ProfileEditDialog`, `JobSearchBar` |
| Visualizations | `ChartAreaInteractive`, `CalendarView`, `PipelineStepper` |
| AI | `AskLeoButton` |

**Components admin DS has but student does NOT** (do not try to import):
`coach-mark`, `selection-tile-grid`, `view-segmented-control`, `drag-handle-grip`, `tip`, `date-picker-field`

## 8. Page composition

USE the page templates from `@exxat/student/components/shared`:

```tsx
import { PrimaryPageTemplate } from '@exxat/student/components/shared'

export default function AssessmentsPage() {
  return <PrimaryPageTemplate {/* views, metrics, filters, table */} />
}
```

Available templates:

| Template | Use for |
|---|---|
| `PrimaryPageTemplate` | List pages with views, metrics, filters, table |
| `ReportPageTemplate` | Report screens with views and primary content |
| `WelcomePageTemplate` | Landing/dashboard with header variants |
| `BuildProfilePageTemplate` | Profile-builder flow |

Don't manually compose Sidebar + Inset + Table — use the template.

## 9. Tone & content

- **Audience:** students (clinical, OT, PT, etc.)
- **Voice:** supportive-empowering — encouraging, clear, action-oriented
- **Whitespace:** generous — student users are mobile-first, not power-keyboard
- **Status language:** student-friendly ("Great work!", "Almost there", "Need help?")
- **Empty states (CONTENT-002):** motivating — "Build your first practice log to get started"

## 10. A11y emphasis (priority order)

1. **Touch targets ≥44px (WCAG 2.5.5)** — mobile primary, use `--control-height-touch`
2. **Mobile rendering** — viewport meta, responsive layouts default
3. **Color contrast** — `--foreground` / `--muted-foreground` meet WCAG AA
4. **Forms** — `Field` composition for label/description/error association
5. **Keyboard navigation** — secondary (mobile primary)

## 11. Allowed in student (different from admin)

- **`Sonner` toast IS allowed** — student apps may use lightweight toast feedback. Admin DS-005 banning does NOT apply here.
- **Sidebar may be hidden on mobile** — bottom nav or hamburger pattern acceptable
- **Coach marks unavailable** — substitute with `Empty` component for first-run

## 12. Required reading on profile load

When SessionStart hook reports "Active DS profile: student":

1. `studentUX/src/components/ui/` — list available primitives (per-file imports)
2. `studentUX/src/components/shared/index.ts` — confirm available composites
3. `studentUX/src/styles/globals.css` — fonts already loaded
4. `/DESIGN.md` — workspace rules
5. `apps/<product>/CLAUDE.md` — product-specific patterns
6. Workspace `CLAUDE.md` §8–10 — tokens, components, font loading
7. `docs/patterns/viz/RUBRIC.md` — viz selection (VIZ-005)
