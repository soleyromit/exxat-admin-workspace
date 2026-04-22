# Exxat One Design System — AI Guide

> **For PMs and designers:** See the in-app Design System page (sidebar → Design System) for a live component catalog and the Prompt Library to generate UI from natural language.
>
> **For AI coding assistants:** This file is your complete reference. Read it fully before generating any code.

---

## Quick Start for PMs & Designers

To create new UI, describe what you want and paste it to Claude Code, Cursor, or any AI assistant.

```
"Create a [list page | detail page | report page] for [entity]
with [columns], [tabs], and [metrics]."
```

See `docs/prompt-templates/` for ready-to-copy prompts and the in-app **Prompt Library** tab for an interactive prompt builder.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 18 + TypeScript |
| Build | Vite 6 + SWC |
| Styling | Tailwind CSS v4 + CSS custom properties |
| UI primitives | Shadcn/UI + Radix UI (fully accessible) |
| State | Zustand (`useAppStore`) |
| Forms | React Hook Form 7 + Zod |
| Charts | Recharts 2 |
| Icons | Font Awesome Pro (primary), Lucide React (secondary) |
| Dates | date-fns · format: MM/DD/YYYY always |

---

## Component Registry

Full machine-readable registry: `src/design-system/registry.ts`

```typescript
import { registry, findComponents, getComponent } from "@/design-system/registry"

// Find all table-related components
findComponents({ tags: ["table"] })

// Get a specific component with its props and examples
getComponent("primary-page-template")
```

### Primitives (use from `@/components/ui/`)

| Component | Import | When to use |
|-----------|--------|-------------|
| `Button` | `@/components/ui/button` | All interactive actions |
| `Badge` | `@/components/ui/badge` | Status, count, state indicators |
| `Input` | `@/components/ui/input` | Text entry (always with Label) |
| `Card` | `@/components/ui/card` | Content containers |
| `Tabs` | `@/components/ui/tabs` | In-page navigation / filter switching |
| `Dialog` | `@/components/ui/dialog` | Forms, confirmations |
| `DropdownMenu` | `@/components/ui/dropdown-menu` | Row actions, overflow menus |
| `Tooltip` | `@/components/ui/tooltip` | Icon-only button hints |
| `Avatar` | `@/components/ui/avatar` | User profile images |
| `Skeleton` | `@/components/ui/skeleton` | Loading states |
| `Alert` | `@/components/ui/alert` | Inline contextual messages |
| `Progress` | `@/components/ui/progress` | Completion percentages |
| `Switch` | `@/components/ui/switch` | Boolean settings toggles |
| `Checkbox` | `@/components/ui/checkbox` | Multi-select, table row selection |
| `Select` | `@/components/ui/select` | Dropdown choice |
| `Separator` | `@/components/ui/separator` | Section dividers |

### Composites (use from `@/components/shared/`)

| Component | Import | When to use |
|-----------|--------|-------------|
| `PrimaryPageTemplate` | `@/components/shared/primary-page-template` | **All list/table pages** |
| `ReportPageTemplate` | `@/components/shared/report-page-template` | **All analytics/report pages** |
| `DataTable` | `@/components/shared/data-table` | Primary data display |
| `FilterBar` | `@/components/shared/filter-bar` | Active filter chips |
| `MetricCard` | `@/components/shared/metric-card` | Single KPI display |
| `KeyMetricsShowcase` | `@/components/shared/key-metrics-showcase` | Full metrics row with gradient |
| `SectionWithHeader` | `@/components/shared/section-with-header` | Content section wrapper |
| `InsightCard` | `@/components/shared/insight-card` | AI insight callouts |
| `ActionCard` | `@/components/shared/action-card` | Empty states, CTAs |
| `AskLeoButton` | `@/components/shared/ask-leo-button` | Open Leo AI with context |
| `CalendarView` | `@/components/shared/calendar-view` | Placement calendar |
| `ChartAreaInteractive` | `@/components/shared/chart-area-interactive` | Area chart with Leo integration |

---

## Page Patterns

### 1. List Page → `PrimaryPageTemplate`

```tsx
// File: src/components/pages/{entity-kebab}-page.tsx
// Export: export function {EntityPascal}Page()

<PrimaryPageTemplate
  title="Entity Name"
  description="Brief description"
  metrics={{ items: [...] }}
  views={[{ id: "tab1", label: "Tab 1", count: 45 }, ...]}
  activeTab={activeTab}
  onTabChange={setActiveTab}
  searchQuery={searchQuery}
  onSearchChange={setSearchQuery}
  filters={{ configs: [...], active: activeFilters, onChange: setActiveFilters }}
  renderTabContent={(tab) => <DataTable columns={cols} data={data} />}
  selectedItems={selectedIds}
  bulkActions={[{ label: "Export", icon: "download", onClick: handleExport }]}
/>
```

### 2. Report/Analytics Page → `ReportPageTemplate`

```tsx
// File: src/components/pages/{name}-page.tsx

<ReportPageTemplate
  title="Report Title"
  tabs={[{ id: "overview", label: "Overview" }, ...]}
  activeTab={activeTab}
  onTabChange={setActiveTab}
  headerActions={<Button variant="outline" size="sm">Export</Button>}
  renderTabContent={(tab) => (
    <div className="flex flex-col gap-12 px-4 lg:px-6 py-6">
      <SectionWithHeader title="..."><ChartAreaInteractive /></SectionWithHeader>
    </div>
  )}
/>
```

### 3. Detail Page (custom layout)

```tsx
// Secondary page — no template, custom sticky header + scrollable body
// Sidebar parent item stays active

<div className="flex flex-col h-full min-h-0">
  <div className="border-b bg-background px-4 lg:px-6 py-4">
    {/* Back button + entity name + status badge + primary action */}
  </div>
  <div className="flex-1 overflow-y-auto">
    <Tabs>
      <TabsList className="px-4 lg:px-6 pt-4 flex-nowrap">...</TabsList>
      <div className="px-4 lg:px-6 py-6">
        <TabsContent value="...">
          <SectionWithHeader title="...">...</SectionWithHeader>
        </TabsContent>
      </div>
    </Tabs>
  </div>
</div>
```

---

## Design Token Reference

### Colors (never hardcode hex — always use tokens)

```
Semantic:  bg-background  bg-foreground  bg-primary  bg-secondary
           bg-muted  bg-accent  bg-destructive  bg-card  bg-border
Text:      text-foreground  text-primary  text-muted-foreground
           text-primary-foreground  text-destructive
Charts:    bg-chart-1  bg-chart-2  bg-chart-3  bg-chart-4  bg-chart-5
Sidebar:   bg-sidebar  bg-sidebar-accent  bg-sidebar-primary
```

### Spacing

```
Page padding:     px-4 lg:px-6
Section gaps:     gap-12
Card padding:     p-6  (or px-6 pt-6 pb-6)
Item gaps:        gap-4
Small gaps:       gap-2 gap-3
```

### Typography

```
xs  = 12px   sm  = 14px (base)   base = 16px   lg = 18px
xl  = 20px   2xl = 24px          3xl  = 30px
Weights: font-normal (400)  font-medium (500)  font-semibold (600)  font-bold (700)
```

### Border radius

```
rounded-xl     → cards, containers
rounded-md     → buttons, inputs
rounded-full   → badges, avatars
rounded-lg     → tags, smaller containers
```

---

## Navigation & Routing

```
Navigation state:  src/stores/app-store.ts  (Zustand)
Navigate to page:  useAppStore.getState().navigateToPage("PageName")
Navigate back:     useAppStore.getState().navigateBackFromScheduleDetail()
Open Leo AI:       useAppStore.getState().openLeoPanelWithQuery("query")

Pages (currentPage values):
  "Home" | "Leo AI" | "Slots" | "Requested" | "Approved"
  "Student Schedule" | "Wishlist" | "Reports"
  "Explore" | "My Students" | "Site Partner" | "Design System"
```

**Sidebar structure:**
- Primary: Home, Leo AI, Inbox
- Pipeline: Explore, Wishlist, Slots, Student Schedule
- Supporting: Reports, My Students, Site Partner
- Support: Resources & Help, Settings, Design System

**To add a new page:**
1. Create component in `src/components/pages/`
2. Add `React.lazy()` import in `App.tsx`
3. Add `case "PageName":` in `renderContent()` in `App.tsx`
4. Add nav item to `data.navMain` or `data.support` in `app-sidebar.tsx`

---

## Mock Data

All mock data lives in `src/data/`:
- `mock-data.ts` — student names, school names, programs, preceptors, schedule generator
- `dashboard-data.ts` — map locations, alerts, metrics
- `reports-data.ts` — charts and report visualizations

```typescript
import { generateStudentScheduleData, mockStudentNames, mockProgramTypes } from "@/data/mock-data"

const students = generateStudentScheduleData(50)  // 50 rows
```

---

## Mobile-Friendly Touch Targets (Mobile-Only)

**WCAG 2.5.5 recommends 44×44px minimum for touch targets.** Touch targets apply **only on mobile** (below `md` breakpoint); desktop keeps compact sizes.

- **Button**: `size="touch"` or `size="icon-touch"` for explicit 44px; `sm` and `icon` sizes are responsive (min-h-11 on mobile, compact on desktop)
- **Utility**: `touchTargetMobileClasses` from `@/components/ui/utils` — add `md:h-X md:w-X` for desktop size
- **Pattern**: `min-h-11 min-w-11 md:min-h-0 md:min-w-0 md:h-6 md:w-6` — 44px on mobile, compact on desktop
- **CSS token**: `--control-height-touch: 44px` in globals.css

---

## Accessibility — WCAG 2.1 Level AA (Required)

**All UI must meet WCAG 2.1 Level AA.** Full guide: [docs/design-system/accessibility.md](docs/design-system/accessibility.md). Checklist: [wcag-aa-checklist.md](docs/design-system/wcag-aa-checklist.md).

- **Icon-only buttons**: `aria-label` + `Tooltip` (hover/focus); decorative icons: `aria-hidden="true"`
- **Regions**: Floating UI (bulk bar, panels): `role="region"` + `aria-label`
- **Tabs**: Custom tabs need Arrow key handlers (`onKeyDown`), `tabIndex`, `aria-selected`
- **Keyboard**: All functionality operable via keyboard; visible focus indicators (`focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2`)
- **Forms**: Visible `<label>` with `htmlFor`/`id`, or `aria-label` on search
- **Contrast**: 4.5:1 text, 3:1 UI controls. Touch targets ≥ 44×44px

---

## Rules: Do ✅ / Don't ❌

### Styling

| ✅ Do | ❌ Don't |
|-------|---------|
| `cn("p-4", isActive && "bg-primary")` | `` `p-4 ${isActive ? "bg-primary" : ""}` `` |
| `bg-muted`, `text-chart-1` | `#E31C79`, `text-blue-500` |
| Full static classes: `"bg-destructive/10"` | Dynamic fragments: `` `bg-${color}/10` `` |
| `rounded-xl border` for cards | Custom border-radius values |

### Icons

| ✅ Do | ❌ Don't |
|-------|---------|
| `<FontAwesomeIcon name="home" />` | Any other icon library as primary |
| `<Download />` from lucide-react (secondary) | Mixing icon styles on the same page |
| `aria-hidden="true"` on decorative icons | Icons without accessible labels |
| `h-4 w-4` (small), `h-5 w-5` (medium) | Inconsistent icon sizes |
| `size="icon-touch"` or `touchTargetClasses` for icon buttons on mobile | `h-6 w-6` or `h-7 w-7` for icon-only buttons (too small for touch) |

### Data & Forms

| ✅ Do | ❌ Don't |
|-------|---------|
| `formatDate(date)` from `@/utils/date-utils` | `new Date().toLocaleDateString()` |
| Specialization as plain text | Specialization as Badge |
| `text-chart-1` for clickable row links | Non-theme colors for links |
| `useAppStore` for navigation | `useState` for current page |
| Error Boundary wrapping page content | Unprotected async component trees |

### Components

| ✅ Do | ❌ Don't |
|-------|---------|
| `PrimaryPageTemplate` for list pages | Custom list page layout |
| `SectionWithHeader` to wrap content groups | Bare `<div>` with ad-hoc titles |
| `DataTable` with `ColumnConfig[]` | Raw `<table>` for editable data |
| `AskLeoButton` at end of data sections | Custom "Ask AI" implementations |
| `InsightCard` for AI-generated callouts | Yellow alert boxes for insights |

---

## File Naming Conventions

```
Pages:       src/components/pages/{entity-kebab}-page.tsx
Details:     src/components/pages/{entity-kebab}-detail.tsx
Detail v2:   src/components/pages/{entity-kebab}-detail-v2.tsx
Shared:      src/components/shared/{component-name}.tsx
UI:          src/components/ui/{component-name}.tsx
Features:    src/components/features/{feature-name}.tsx
Data:        src/data/{domain}-data.ts

Exports:     Named exports only (no default exports from pages)
             export function {PascalCase}Page() {}
             export function {PascalCase}Detail() {}
```

---

## Quick Prompt Templates

For the full interactive prompt library, see `docs/prompt-templates/` or open the Design System page in the app (sidebar → Design System → Prompt Library tab).

```
Create a list page for [Entity]:
"Create a PrimaryPageTemplate list page for [Entity] with tabs [Tab1, Tab2, Tab3],
columns [Col1, Col2, Col3, Status, Actions], metrics [M1, M2, M3, M4],
and filters for Status and [Field]. Follow the Exxat One design system conventions."

Add a column to [Page]:
"Add a [ColumnName] column to the DataTable in [page-file].tsx.
Type: [text|badge|date|link]. Pin rules: follow existing 8+ column convention."

Create a report page:
"Create a ReportPageTemplate analytics page titled [Title] with tabs [T1, T2, T3].
Tab 1 shows KeyMetricsShowcase + ChartAreaInteractive + SectionWithHeader sections."
```

---

## Error Handling

- `ErrorBoundary` wraps the main `SidebarInset` content in `App.tsx`
- Import `withErrorBoundary` HOC to protect individual components:
  ```typescript
  import { withErrorBoundary } from "@/components/ui/error-boundary"
  const SafeChart = withErrorBoundary(ChartComponent)
  ```
- Always add Suspense fallback for lazy-loaded components

---

*Last updated: March 2026 · Exxat One School 2.1*
