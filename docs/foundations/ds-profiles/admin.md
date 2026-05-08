# DS Profile — Admin (Exxat-DS)

> Loaded by SessionStart hook when cwd matches `apps/*/admin/`.
> Loaded by UserPromptSubmit hook on triggers: "switch to admin", "Exxat-DS", "@exxat/ds", "theme-(one|prism)".
> Source of truth for the DS surface: `exxat-ds/packages/ui/src/`.
> Full token reference: workspace `CLAUDE.md` §5–7, §11–14.

**Version:** 0.1.0 (2026-05-08)
**DS Package:** `@exxat-ds/ui` (from submodule `exxat-ds/packages/ui/`)
**Apps using this profile:** `@exxat/exam-management-admin` (3001), `@exxat/patient-log-admin` (3003), `@exxat/pce-admin` (3005), `@exxat/skills-checklist-admin` (3007), `@exxat/learning-contracts-admin` (3009)

---

## 1. Imports

```ts
// Components — barreled, single import path
import { Button, Sidebar, DropdownMenu /* etc */ } from '@exxat/ds/packages/ui/src'

// Hooks
import { useAppTheme, useCoachMark, useMobile, useModKeyLabel } from '@exxat/ds/packages/ui/src'
```

NEVER deep-import individual files (different from student profile).

## 2. CSS imports (app/globals.css)

```css
@import '../../../../exxat-ds/packages/ui/src/theme.css';   /* tokens only — NOT globals.css */
@import "tailwindcss";
@source '../../../../exxat-ds/packages/ui/src/**/*.{ts,tsx}';

:root {
  --dt-header-bg:       var(--background);
  --dt-row-bg:          var(--background);
  --dt-row-hover:       oklch(0.972 0.001 270);
  --dt-row-selected:    oklch(0.962 0.003 260);
  --dt-row-selected-fg: var(--foreground);
  --dt-group-bg:        oklch(0.972 0.001 270);
  --sticky-edge-fade:   oklch(0 0 0 / 0.08);
}
```

Critical: import `theme.css` (tokens), NOT `globals.css` (full DS CSS — only used inside the DS workspace itself).

## 3. Webpack alias (next.config.ts)

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

Both `@exxat/ds` AND `@exxat/student` resolved (admin apps may need student components in rare cases — but this profile is admin-first).

## 4. Fonts — inject in app/layout.tsx

```tsx
<head>
  <link rel="stylesheet" href="https://use.typekit.net/wuk5wqn.css" />
  <script
    src="https://kit.fontawesome.com/d9bd5774e0.js"
    crossOrigin="anonymous"
    async
  />
</head>
```

| Asset | Admin | NOT admin (student) |
|---|---|---|
| Typekit kit | `wuk5wqn` | `kmo8bbz` |
| FA Pro kit | `d9bd5774e0` | `bff072b36d` |

## 5. Theme application

```tsx
<html lang="en" className="theme-one">  {/* default Lavender brand */}
{/* className="theme-one dark"   for dark mode */}
{/* className="theme-prism"      for Rose brand */}
```

Runtime brand switching:

```ts
import { useAppTheme } from '@exxat/ds/packages/ui/src'
const { setBrand, setContrast } = useAppTheme()
setBrand("one")    // Lavender (hue 286.1)
setBrand("prism")  // Rose (hue 342)
```

## 6. Tokens — key values

Root font-size: **16px** (default). Spacing math is desktop-tuned.

Critical color tokens:

| Token | Value | Use |
|---|---|---|
| `--brand-color` | oklch(0.50 0.14 286.1) | interactive accent |
| `--brand-tint` | oklch(0.9676 0.016 286.1) | sidebar bg |
| `--primary` | oklch(0.3457 0.0052 286.13) | primary CTA |
| `--foreground` | oklch(0.145 0 0) | text (17:1 contrast) |
| `--muted-foreground` | oklch(0.50 0.012 270) | secondary text (5.5:1) |
| `--border` | oklch(0.92 0.002 270) | decorative |
| `--border-control-35` | oklch(0.25 0.01 270) | form fields (≥3.5:1) |
| `--destructive` | oklch(0.55 0.22 25) | error red — NEVER for score viz |

Density:
- `--control-height`: 40px
- `--control-height-sm`: 32px
- `--control-height-touch`: 44px (mobile only)
- `--table-row-height`: 48px

Full reference: workspace CLAUDE.md §5.

## 7. Components — admin DS surface

**Available** (from `exxat-ds/packages/ui/src/index.ts`):

```
avatar, badge, banner, breadcrumb, button, calendar, card, chart,
checkbox, coach-mark, collapsible, command, date-picker-field, dialog,
drag-handle-grip, drawer, dropdown-menu, field, form, input-group, input,
kbd, label, popover, radio-group, select, selection-tile-grid, separator,
sheet, sidebar (+ sub-exports), skeleton, sonner, table, tabs,
textarea, tip, toggle-group, toggle-switch, toggle, tooltip,
view-segmented-control
```

Hooks: `useAppTheme`, `useCoachMark`, `useMobile`, `useModKeyLabel`.

**Components admin DS has but student does NOT** (admin-exclusive):
`coach-mark`, `selection-tile-grid`, `view-segmented-control`, `drag-handle-grip`, `tip`, `kbd`, `input-group` (admin variant), `date-picker-field`

**Components student has but admin does NOT** (do not try to import):
`carousel`, `pagination`, `input-otp`, `hover-card`, `menubar`, `navigation-menu`, `resizable`, `slider`, `empty`, `error-boundary`, `context-menu`, `accordion`, `switch`, `searchable-select`, `aspect-ratio`, `alert-dialog`, `alert`, `outline-search-input`, `progress`, `scroll-area`

## 8. Page composition

Admin DS does NOT export composite page templates. Compose manually:

```tsx
<SidebarProvider className="h-svh">              {/* h-svh REQUIRED — A11Y-007 */}
  <Sidebar variant="inset" collapsible="icon">   {/* variant="inset" REQUIRED */}
    <SidebarHeader>…</SidebarHeader>
    <SidebarContent>…</SidebarContent>
    <SidebarFooter>…</SidebarFooter>
  </Sidebar>
  <SidebarInset className="flex flex-col overflow-hidden">
    {children}
  </SidebarInset>
</SidebarProvider>
```

Page archetypes:
- **List page:** Sidebar + Inset + Tabs + Table
- **Dashboard:** Sidebar + Inset + KeyMetrics strip + grid of cards
- **Detail:** Sidebar + Inset + Breadcrumb + Tabs + content

`ListPageTemplate` will arrive from the DS — until then, hand-compose.

## 9. Tone & content

- **Audience:** faculty, program directors, clinical coordinators (NOT students)
- **Voice:** clinical-formal, precise, dense
- **Whitespace:** tight — admin users want scannable density
- **Status language:** professional ("Pending review", "Below threshold", "Outlier flagged")
- **Empty states (CONTENT-002):** propose action — "Add the first assessment to begin"

## 10. A11y emphasis (priority order)

1. **Keyboard navigation primary** — admin users are power-keyboard
2. **SR narrative for data tables** — column headers, row context, sort state announced
3. **Focus management on Sheet/Dialog** — return focus to trigger on close
4. **Touch targets secondary** — desktop primary, but ≥36px (icon-sm) acceptable
5. **Color contrast** — `--foreground` and `--muted-foreground` meet WCAG AA against `--background`

## 11. Banned in admin (rule citations from DESIGN.md §4)

- **DS-005** — `toast()` / Sonner imports → use `LocalBanner` / `SystemBanner`
- **DS-001** — raw `<button>` element → DS `Button` with `variant` + `size`
- **DS-002** — hex / rgb / hsl color literals → tokens only
- **DS-003** — inline `boxShadow:` → `shadow-{sm,md,lg}` utilities
- **DS-004** — raw `<table>` → DS `Table`
- **VIZ-004** — red (`--destructive`) in score/rating/performance viz → amber/orange (`--chart-4`, `--chart-5`)

## 12. Required reading on profile load

When SessionStart hook reports "Active DS profile: admin":

1. `exxat-ds/packages/ui/src/index.ts` — confirm available exports
2. `/DESIGN.md` — workspace rules
3. `apps/<product>/CLAUDE.md` — product-specific patterns
4. Workspace `CLAUDE.md` §5–7, §11–14 — tokens, components, rules, API reference
5. `docs/patterns/viz/RUBRIC.md` — viz selection (VIZ-005)
