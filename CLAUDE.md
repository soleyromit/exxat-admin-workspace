# Exxat Product Monorepo — Claude Reference

Read this before writing any code in this repo. Every token name and component export listed here comes from the actual submodule files.

---

## 1. Repo Map

```
/Users/romitsoley/Work/                 ← monorepo root
├── pnpm-workspace.yaml                 ← declares exxat-ds/packages/* + apps/*/*
├── tsconfig.base.json                  ← path aliases: @exxat/ds/*, @exxat/student/*
├── turbo.json                          ← build/dev/lint/type-check pipelines
├── exxat-ds/                           ← Admin DS submodule (ExxatDesign/Exxat-DS-Workspace)
│   └── packages/ui/                    ← @exxat-ds/ui — component library + tokens
│       └── src/
│           ├── theme.css               ← CSS custom properties only — IMPORT THIS in product apps
│           ├── globals.css             ← full DS CSS (includes Tailwind) — DO NOT import in product apps
│           └── index.ts                ← all component + hook + util exports
├── studentUX/                          ← Student DS submodule (ExxatDesign/studentUX)
│   └── src/
│       ├── styles/globals.css          ← Student DS tokens + font imports
│       └── components/
│           ├── shared/                 ← composite components (DataTable, FilterBar, page templates…)
│           └── ui/                     ← shadcn-based primitives
├── apps/                               ← product apps (to be created)
│   ├── exam-management/
│   │   ├── admin/                      ← Next.js admin app (port 3001)
│   │   └── student/                    ← Next.js student app (port 3002)
│   ├── patient-log/
│   │   ├── admin/                      ← port 3003
│   │   └── student/                    ← port 3004
│   ├── pce/
│   │   ├── admin/                      ← port 3005
│   │   └── student/                    ← port 3006
│   ├── skills-checklist/
│   │   ├── admin/                      ← port 3007
│   │   └── student/                    ← port 3008
│   └── learning-contracts/
│       ├── admin/                      ← port 3009
│       └── student/                    ← port 3010
└── docs/                               ← internal documentation
```

---

## 2. Design System Submodules

### Admin DS

- Submodule path: `exxat-ds/`
- Remote: ExxatDesign/Exxat-DS-Workspace (main)
- Package: `@exxat-ds/ui` (in `exxat-ds/packages/ui/`)
- Update command: `git submodule update --remote --merge`
- NEVER edit files inside `exxat-ds/`

### Student DS

- Submodule path: `studentUX/`
- Remote: ExxatDesign/studentUX (main)
- Components: imported via path alias `@exxat/student/*`
- Update command: `git submodule update --remote --merge`
- NEVER edit files inside `studentUX/`

---

## 3. Import Patterns

### Admin apps (`apps/*/admin/`)

CSS tokens (in `app/globals.css`):
```css
@import '@exxat/ds/packages/ui/src/theme.css';
```

Components (in any `.tsx` file):
```ts
import { Button, Card, Badge, Sheet, Tabs } from '@exxat/ds/packages/ui/src'
```

`package.json` dependency:
```json
"@exxat-ds/ui": "workspace:*"
```

### Student apps (`apps/*/student/`)

CSS tokens (in `app/globals.css`):
```css
@import '../../../studentUX/src/styles/globals.css';
```

Components:
```ts
import { PrimaryPageTemplate, DataTable, FilterBar } from '@exxat/student/components/shared'
import { Button } from '@exxat/student/components/ui/button'
```

---

## 4. Admin DS Tokens

All CSS custom properties from `exxat-ds/packages/ui/src/theme.css`. These are defined on `:root` (light mode) and overridden in `.dark`. Use via `var(--token-name)`.

### Typography

| Token | Value |
|---|---|
| `--font-heading` | `"ivypresto-text"` |
| `--font-sans` | `"Inter", ui-sans-serif, system-ui, sans-serif` |
| `--text-xs` | `0.6875rem` (11px at 16px root) |

### Radius

| Token | Value |
|---|---|
| `--radius` | `0.5rem` (8px base) |
| `--radius-sm` | `4px` |
| `--radius-md` | `8px` |
| `--radius-lg` | `12px` |
| `--radius-xl` | `16px` |
| `--radius-2xl` | `20px` |
| `--radius-3xl` | `24px` |

### Brand Colors

| Token | Value (light) |
|---|---|
| `--brand-tint` | `oklch(0.9676 0.016 286.1)` |
| `--brand-tint-light` | `oklch(0.993 0.007 286.1)` |
| `--brand-tint-subtle` | `oklch(0.935 0.024 286.1)` |
| `--brand-color` | `oklch(0.50 0.14 286.1)` |
| `--brand-color-light` | `oklch(0.78 0.09 286.1)` |
| `--brand-color-dark` | `oklch(0.38 0.11 286.1)` |
| `--brand-color-deep` | `oklch(0.28 0.085 286.1)` |
| `--brand-foreground` | `oklch(0.985 0 0)` |
| `--brand-preview-prism` | `oklch(0.57 0.24 342)` |

### Semantic Colors (light mode)

| Token | Value |
|---|---|
| `--background` | `oklch(1 0 0)` |
| `--foreground` | `oklch(0.145 0 0)` |
| `--card` | `oklch(1 0 0)` |
| `--card-foreground` | `oklch(0.145 0 0)` |
| `--popover` | `oklch(1 0 0)` |
| `--popover-foreground` | `oklch(0.145 0 0)` |
| `--primary` | `oklch(0.3457 0.0052 286.13)` |
| `--primary-foreground` | `oklch(0.985 0 0)` |
| `--secondary` | `oklch(0.95 0.0058 264.53)` |
| `--secondary-foreground` | `oklch(0.082 0 0)` |
| `--muted` | `oklch(0.945 0.002 270)` |
| `--muted-foreground` | `oklch(0.50 0.012 270)` |
| `--accent` | `oklch(0.925 0.005 260)` |
| `--accent-foreground` | `oklch(0.082 0 0)` |
| `--destructive` | `oklch(0.55 0.22 25)` |
| `--destructive-foreground` | `oklch(1 0 0)` |

### Border + Input

| Token | Purpose |
|---|---|
| `--border` | `oklch(0.92 0.002 270)` — decorative borders, cards, separators |
| `--border-control` | `oklch(0.82 0.004 270)` — subtle (layout use only) |
| `--border-control-3` | `oklch(0.6196 0.0092 270)` — approx 3:1 on white (minimum for form fields) |
| `--border-control-35` | `oklch(0.25 0.01 270)` — approx 3.5:1+ (recommended for inputs) |
| `--input` | `oklch(0.6694 0.0063 264.52)` |
| `--input-background` | `oklch(0.97 0.002 270)` |
| `--ring` | `oklch(0.25 0 0)` |

### Sidebar

| Token | Value (light) |
|---|---|
| `--sidebar-foreground` | `oklch(0.145 0 0)` |
| `--sidebar-primary` | `oklch(0.082 0 0)` |
| `--sidebar-primary-foreground` | `oklch(0.985 0 0)` |
| `--sidebar-accent` | `oklch(0.945 0.025 286.1)` |
| `--sidebar-accent-foreground` | `oklch(0.3457 0.0052 286.13)` |
| `--sidebar-border` | `oklch(0.92 0.025 286.1)` |
| `--sidebar-ring` | `oklch(0.25 0 0)` |
| `--secondary-panel-bg` | `oklch(0.99 0.008 286.1)` |
| `--theme-color-chrome` | `#f3f2f8` |

### Chart Colors

| Token | Value |
|---|---|
| `--chart-1` | `oklch(0.55 0.22 264.116)` — indigo |
| `--chart-2` | `oklch(0.48 0.15 184.704)` — teal |
| `--chart-3` | `oklch(0.32 0.08 227.392)` — slate |
| `--chart-4` | `oklch(0.65 0.18 84.429)` — amber |
| `--chart-5` | `oklch(0.58 0.18 70.08)` — orange |

### Chip Colors

| Token | Value |
|---|---|
| `--chip-1` | `oklch(0.38 0.18 264)` — indigo |
| `--chip-2` | `oklch(0.35 0.14 184)` — teal |
| `--chip-3` | `oklch(0.32 0.08 227)` — slate |
| `--chip-4` | `oklch(0.42 0.12 84)` — amber |
| `--chip-5` | `oklch(0.42 0.14 70)` — orange |
| `--chip-destructive` | `oklch(0.40 0.18 25)` — red |

### Interactive / Hover / Banner

| Token | Value |
|---|---|
| `--banner-prism-bg` | `oklch(0.97 0.02 343)` — always rose hue regardless of theme |

### Scaling / Transitions / Shadows

| Token | Value |
|---|---|
| `--scaling` | `1` |
| `--control-height-touch` | `44px` (WCAG 2.5.5) |
| `--transition-fast` | `0.15s ease` |
| `--transition-normal` | `0.25s ease-in-out` |
| `--transition-colors` | `color 0.15s ease, background-color 0.15s ease, border-color 0.15s ease` |
| `--shadow-sm` | `oklch(0 0 0 / 0.08) 0px 1px 2px 0px` |
| `--shadow-md` | `oklch(0 0 0 / 0.08) 0px 2px 4px -1px, oklch(0 0 0 / 0.06) 0px 1px 2px` |
| `--shadow-lg` | `oklch(0 0 0 / 0.10) 0px 4px 8px -2px, oklch(0 0 0 / 0.06) 0px 2px 4px` |

---

## 5. Admin DS Component Exports

All exports from `exxat-ds/packages/ui/src/index.ts`. Import path: `@exxat/ds/packages/ui/src`.

### UI Components

```
avatar         badge            banner          breadcrumb
button         calendar         card            chart
checkbox       coach-mark       collapsible     command
date-picker-field  dialog       drag-handle-grip  drawer
dropdown-menu  field            form            input-group
input          kbd              label           popover
radio-group    select           selection-tile-grid  separator
sheet          sidebar          skeleton        sonner
table          tabs             textarea        tip
toggle-group   toggle-switch    toggle          tooltip
view-segmented-control
```

### Hooks

```
use-app-theme
use-coach-mark
use-mobile
use-mod-key-label
```

### Utilities

```
utils        (from lib/utils)
date-filter  (from lib/date-filter)
```

---

## 6. Student DS Tokens

All CSS custom properties from `studentUX/src/styles/globals.css`. Defined on `:root`.

### Typography

| Token | Value |
|---|---|
| `--font-size` | `1rem` |
| `--font-size-20` | `1.25rem` (20px — detail/sticky titles) |
| `--font-weight-light` | `300` |
| `--font-weight-normal` | `400` |
| `--font-weight-medium` | `500` |
| `--font-weight-semibold` | `600` |
| `--font-weight-bold` | `700` |
| `--font-weight-extrabold` | `800` |
| `--font-size-xs` | `0.75rem` |
| `--font-display-email-stack` | `"ivypresto-display", "ivypresto-headline", Georgia, serif` |

Root font-size is set to `87.5%` (14px when browser default is 16px) for accessibility.

### Spacing

| Token | Value |
|---|---|
| `--spacing-xs` | `0.25rem` |
| `--spacing-sm` | `0.5rem` |
| `--spacing-md` | `0.75rem` |
| `--spacing-lg` | `1rem` |
| `--spacing-xl` | `1.5rem` |
| `--spacing-2xl` | `2rem` |
| `--spacing-3xl` | `3rem` |
| `--spacing-4xl` | `4rem` |

### Radius

| Token | Value |
|---|---|
| `--radius-base` | `4px` |
| `--radius` | `8px` |
| `--radius-sm` | `4px` |
| `--radius-md` | `8px` |
| `--radius-lg` | `12px` |
| `--radius-xl` | `16px` |
| `--radius-2xl` | `20px` |
| `--radius-3xl` | `24px` |

### Brand Colors

| Token | Value |
|---|---|
| `--brand-color-surface` | `oklch(0.9676 0.016 286.1)` |
| `--brand-color-light` | `oklch(0.985 0.009 286.1)` |
| `--brand-color-soft` | `oklch(0.915 0.048 286.1)` |
| `--brand-color` | `oklch(0.535 0.132 286.1)` |
| `--brand-color-dark` | `oklch(0.395 0.105 286.1)` |
| `--brand-color-deep` | `oklch(0.28 0.078 286.1)` |
| `--brand-color-lavender` | `oklch(0.535 0.132 286.1)` |
| `--exxat-one-lavender-bg` | `oklch(0.9676 0.016 286.1)` |

### Semantic Colors

| Token | Value (light) |
|---|---|
| `--background` | `oklch(1 0 0)` |
| `--foreground` | `oklch(0.145 0 0)` |
| `--card` / `--card-foreground` | `oklch(1 0 0)` / `oklch(0.145 0 0)` |
| `--popover` / `--popover-foreground` | `oklch(1 0 0)` / `oklch(0.145 0 0)` |
| `--primary` | `oklch(0.26 0.008 286.1)` |
| `--primary-foreground` | `oklch(1 0 0)` |
| `--secondary` | `oklch(0.95 0.0058 286.1)` |
| `--secondary-foreground` | `oklch(0.082 0 0)` |
| `--muted` | `oklch(0.945 0.004 286.1)` |
| `--muted-foreground` | `oklch(0.55 0.012 286.1)` |
| `--accent` | `oklch(0.925 0.012 286.1)` |
| `--accent-foreground` | `oklch(0.082 0 0)` |
| `--destructive` | `oklch(0.55 0.22 25)` |
| `--destructive-foreground` | `oklch(1 0 0)` |

### Border + Input

| Token | Purpose |
|---|---|
| `--border` | `oklch(0.92 0.004 286.1)` — decorative |
| `--border-control` | `oklch(0.82 0.006 286.1)` — subtle field border |
| `--control-border` | alias → `var(--border-control-3)` |
| `--border-control-35` | `oklch(0.25 0.01 286.1)` — WCAG enhanced |
| `--border-control-3` | `oklch(0.6196 0.011 286.1)` — 3:1 minimum |
| `--ring` | `oklch(0.25 0 0)` |
| `--input` | `oklch(0.82 0.006 286.1)` |
| `--input-background` | `oklch(0.97 0.006 286.1)` |

### Sidebar

| Token | Value |
|---|---|
| `--sidebar` | `var(--brand-color-surface)` |
| `--sidebar-foreground` | `oklch(0.145 0 0)` |
| `--sidebar-primary` | `oklch(0.082 0 0)` |
| `--sidebar-primary-foreground` | `oklch(0.985 0 0)` |
| `--sidebar-accent` | `oklch(0.93 0.042 286.1)` |
| `--sidebar-accent-foreground` | `oklch(0.205 0 0)` |
| `--sidebar-border` | `oklch(0.90 0.032 286.1)` |

### Chart + Chip Colors

Same token names as Admin DS (`--chart-1` through `--chart-5`, `--chip-1` through `--chip-5`, `--chip-destructive`).

### Density + Scaling

| Token | Value |
|---|---|
| `--scaling` | `1` |
| `--density` | `comfortable` |
| `--control-height` | `calc(40px * var(--scaling))` |
| `--control-height-sm` | `calc(32px * var(--scaling))` |
| `--control-height-touch` | `44px` (WCAG 2.5.5) |
| `--control-padding-y` | `calc(8px * var(--scaling))` |
| `--control-padding-x` | `calc(12px * var(--scaling))` |
| `--table-row-height` | `calc(48px * var(--scaling))` |
| `--table-header-height` | `calc(48px * var(--scaling))` |
| `--content-max-width-desktop` | `1040px` |
| `--content-max-width-tablet` | `768px` |
| `--content-gutter` | `calc(24px * var(--scaling))` |

### Transitions + Shadows

| Token | Value |
|---|---|
| `--transition-fast` | `0.2s ease` |
| `--transition-normal` | `0.3s ease-in-out` |
| `--transition-colors` | `color 0.2s ease, background-color 0.2s ease, border-color 0.2s ease` |
| `--shadow-sm` | `oklch(0 0 0 / 0.1) 0px 1px 2px 0px` |
| `--shadow-md` | `oklch(0 0 0 / 0.1) 0px 1px 3px 0px, oklch(0 0 0 / 0.1) 0px 1px 2px -1px` |
| `--shadow-lg` | `oklch(0 0 0 / 0.1) 0px 4px 6px -1px, oklch(0 0 0 / 0.1) 0px 2px 4px -2px` |

---

## 7. Student DS Component Exports

### Shared components (from `@exxat/student/components/shared`)

**Cards:**
- `ActionCard`, `createActionCardData` (+ types: `ActionCardData`, `ActionCardProps`)
- `SectionCard` (+ `SectionCardProps`)
- `InsightCard`, `createInsightCardData` (+ types: `InsightCardData`, `InsightCardProps`, `InsightCardVariant`)
- `MetricCard`, `createMetricCardData` (+ types: `MetricCardData`, `MetricCardProps`)
- `InternshipCard` (+ types: `InternshipCardProps`, `InternshipOption`)
- `PartnerSitePerformanceCard` (+ `PartnerSitePerformanceCardProps`)
- `PendingApprovalChartCard` (+ types: `PendingApprovalChartCardProps`, `ChartDataItem`, `ChartType`)
- `KeyMetricsShowcase` (+ `KeyMetricsShowcaseProps`)
- `SectionWithHeader` (+ types: `SectionWithHeaderProps`, `SectionWithHeaderVariant`)
- `AlertsSection` (+ types: `AlertsSectionProps`, `AlertItem`)
- `MapSection` (+ types: `MapSectionProps`, `MapLocation`, `MapAlert`, `SearchFieldConfig`)
- `AddressMap` (+ `AddressMapProps`)
- `ScheduleBanners` (+ `ScheduleBannerType`)
- `SimpleMetric`, `createSimpleMetricData` (+ types: `SimpleMetricData`, `SimpleMetricProps`, `SimpleMetricVariant`)

**Table infrastructure:**
- `DataTable`, `autoSuggestColumnPinning` (+ types: `ColumnConfig`, `DataTableProps`, `FreezeDirection`, `SortDirection`, `SortConfig`, `GroupConfig`)
- `Pagination` (+ `PaginationInfo`)
- `TableProperties` (+ `TableDisplayConfig`)
- `FilterClauseEditor`, `FilterClause`, `FilterClauseConnector`, `ScrollableContainer`, `ScrollableOptionList`, `FILTER_LAYOUT` (+ types)
- `ViewManager` (+ `ViewSettings`)
- `FilterBar` (default export) (+ types: `FilterConfig`, `ActiveFilter`, `FILTER_SEARCH_THRESHOLD`)
- `FloatingActionBar`, `BulkActionBar`, `defaultBulkActions`, `slotsBulkActions`, `getPipelineActionsForStage` (+ `BulkAction`)

**Page templates:**
- `PrimaryPageTemplate` (+ types: `ViewConfig`, `PrimaryPageMetricsConfig`, `PrimaryPageFilterConfig`, `PrimaryPageTablePropertiesConfig`, `PrimaryPageBulkAction`, `PrimaryPageTemplateProps`)
- `ReportPageTemplate` (+ types: `ReportPageViewConfig`, `ReportPageTemplateProps`)
- `WelcomePageTemplate` (+ types: `WelcomePageTemplateProps`, `WelcomePageBackgroundVariant`, `WelcomePageHeaderVariant`)
- `BuildProfilePageTemplate` (+ `BuildProfilePageTemplateProps`)
- `ProfileEditDialog` (+ `ProfileEditDialogProps`)
- `JobSearchBar` (+ `JobSearchBarProps`)

**Visualizations:**
- `ChartAreaInteractive`
- `CalendarView`
- `PipelineStepper`

**Leo AI:**
- `AskLeoButton`

### UI primitives (from `@exxat/student/components/ui/<name>`)

Each file is imported individually, e.g. `import { Button } from '@exxat/student/components/ui/button'`

```
accordion          alert-dialog       alert              aspect-ratio
avatar             badge              breadcrumb         button-group
button             calendar           card               carousel
chart              checkbox           collapsible        command
context-menu       dialog             drawer             dropdown-menu
empty              error-boundary     field              form
hover-card         input-group        input-otp          input
kbd                label              menubar            navigation-menu
outline-search-input  pagination      popover            progress
radio-group        resizable          scroll-area        searchable-select
select             separator          sheet              sidebar
skeleton           slider             sonner             switch
table              tabs               textarea           toggle-group
toggle             tooltip
```

Also available (not components):
- `use-mobile.ts` — mobile detection hook
- `utils.ts` — utility functions

---

## 8. Product + Port Map

| Product | Admin package | Admin port | Student package | Student port |
|---|---|---|---|---|
| exam-management | `@exxat/exam-management-admin` | 3001 | `@exxat/exam-management-student` | 3002 |
| patient-log | `@exxat/patient-log-admin` | 3003 | `@exxat/patient-log-student` | 3004 |
| pce | `@exxat/pce-admin` | 3005 | `@exxat/pce-student` | 3006 |
| skills-checklist | `@exxat/skills-checklist-admin` | 3007 | `@exxat/skills-checklist-student` | 3008 |
| learning-contracts | `@exxat/learning-contracts-admin` | 3009 | `@exxat/learning-contracts-student` | 3010 |

---

## 9. Fonts

### Admin apps

- Typekit (Ivy Presto): `https://use.typekit.net/wuk5wqn.css`
- Font Awesome Pro kit: `https://kit.fontawesome.com/d9bd5774e0.js`

```html
<link rel="stylesheet" href="https://use.typekit.net/wuk5wqn.css" />
<script src="https://kit.fontawesome.com/d9bd5774e0.js" crossOrigin="anonymous" />
```

### Student apps

- Google Fonts (Inter): `https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800`
- Typekit: `https://use.typekit.net/kmo8bbz.css`
- Font Awesome Pro: `https://kit.fontawesome.com/bff072b36d.css`

Already imported in `studentUX/src/styles/globals.css` — do not double-import.

---

## 10. Admin App Patterns (from `exxat-ds/apps/web/AGENTS.md`)

### Page shell

- Primary data-list pages MUST use `ListPageTemplate` + `DataTable` (not bare `PageHeader` + table).
- `ListPageTemplate` provides: view tabs (table / list / board / dashboard), search, `TablePropertiesDrawer`, export wiring, optional `KeyMetrics` strip.
- Reference implementations: `components/data-list-client.tsx` (Placements), `components/team-client.tsx`.

### Sidebar nav

- All list hubs linked from `lib/mock/navigation.tsx` must land users on a full hub stack (not a placeholder page).
- Nav destinations must have `DataTable` with typed mock data (12+ rows), search, filters, all view tabs wired.

### Data views

- All view types (table / list / board / dashboard) on a tab MUST share the same `useTableState` instance and read `tableState.rows` — non-table surfaces are not disconnected.
- Board (kanban) cards: compose `ListPageBoardCard` from `components/data-views/list-page-board-card.tsx`. MUST NOT hand-roll alternate card chrome.
- Dashboard view: use `KeyMetrics` variant `"card"`, `ChartFigure` + `ChartDataTable` for accessibility. Dashboard tab on list hubs uses `*DashboardChartsSection` components, not the `/dashboard` route gallery components.

### TablePropertiesDrawer

- Must pass `currentView` (active `DataListViewType`) and `onViewChange` when used with `ListPageTemplate`. Without `currentView`, the drawer defaults to table labels even on Board view.

### Feedback / messaging

- MUST NOT use toast (Sonner `toast()`) or snackbars for product feedback.
- Use `LocalBanner` / `SystemBanner`, inline status, or dialog/drawer instead.

### Drawer vs page

| Use drawer/sheet | Use new page/route |
|---|---|
| User needs page context behind them; quick view, quick action, short step | Flow is primary, long-form, multi-step, needs its own URL/history |

### Component reuse

- Prefer composing existing components over new one-off UI.
- Match naming, imports, and patterns of the nearest reference implementation (usually Placements).
- `DataTable` MUST NOT be replaced with raw `<table>`, `@/components/ui/table`, or third-party grids for primary list pages.
- Status badges for list hubs: define labels + tint classes in `lib/list-status-badges.ts`, render with `ListHubStatusBadge`. MUST NOT duplicate maps in feature files.

### Keyboard shortcuts

- Show `Kbd` / `KbdGroup` where users discover actions (primary CTAs, search, Ask Leo, sidebar).
- Implement every shortcut shown in a tooltip.
- Use `useModKeyLabel` / `useAltKeyLabel` for OS-correct labels.
- Table search stays `⌘K` / `Ctrl+K`.
- Global command palette (`⌘K`) is global search + primary AI entry — not a second nav tree.

### Accessibility non-negotiables

- Every chart uses `ChartFigure` (keyboard + live region) + `ChartDataTable` (`sr-only` table fallback).
- All Font Awesome icons: `aria-hidden="true"`.
- Touch targets: minimum 44px (WCAG 2.5.5) — use `--control-height-touch`.
- Border contrast: use `--border-control-35` for form field borders (≥ 3.5:1).
- Focus ring: `--ring` token only — never remove focus outlines.

---

## 11. Hard Rules

- NEVER edit files in `exxat-ds/` or `studentUX/`
- NEVER commit to main without a feature branch
- NEVER hardcode hex/rgb colors — use CSS custom properties only (e.g. `var(--brand-color)`)
- NEVER create Button, Badge, Input, Dialog from scratch — use `@exxat-ds/ui` or `@exxat/student` components
- NEVER use toast (`toast()` / Sonner) for product feedback — use banners or inline status
- NEVER build primary list pages with raw `<table>` or third-party grids — use `DataTable`
- ALWAYS add `'use client'` to interactive React components
- ALWAYS use Font Awesome icons with `aria-hidden="true"`
- ALWAYS use the correct product theme (Admin DS for admin apps, Student DS for student apps)
- ALWAYS import `theme.css` (not `globals.css`) from Admin DS in product apps
- ALWAYS define status badge labels/tints in `lib/list-status-badges.ts` — never duplicate in feature files

---

## 12. Current Work

Exam Management QB is the active build. Screen list is a living section — expands as Magic Patterns design is migrated.

**Admin screens:** Question Bank hub, Add Question, Share Access, Private Space (course/folder views, admin/faculty toggle)

**Student screens:** Assessment list, Take Exam, Results
