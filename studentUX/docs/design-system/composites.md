# Composites (Shared Components)

Located in `src/components/shared/`. These combine UI primitives into reusable building blocks. They may encode layout opinions but carry **no product-specific business logic**.

---

## Quick Reference

| Component | Purpose | Key Props |
|-----------|---------|-----------|
| `SectionWithHeader` | Section with title + description + optional filter | `title`, `description`, `variant`, `filter`, `children` |
| `KeyMetricsShowcase` | Metrics grid + optional insight banner | `title`, `metrics`, `insightCard`, `filter` |
| `PendingApprovalChartCard` | Card with embedded chart | `title`, `data`, `chartType`, `dataKeyX`, `dataKeyY` |
| `PartnerSitePerformanceCard` | Card with partner metrics + optional insight | `title`, `metrics`, `insightCard`, `actionButton` |
| `AlertsSection` | Alert list with optional filter | `title`, `alerts`, `variant`, `filter` |
| `MapSection` | Leaflet map + search overlay + activity alerts | `locations`, `searchFields`, `alerts`, `onSearch` |
| `PrimaryPageTemplate` | Full page: header, metrics, tabs, table | `title`, `metrics`, `views`, `filters`, `tableProperties` |
| `ReportPageTemplate` | Report page: header, tabs, sections (no top metrics) | `title`, `views`, `renderTabContent`, `headerActions`, `toolbarActions` |
| `DataTable` | Table with sort, pagination, column pin, bulk select | `columns`, `data`, `pagination` |
| `FilterBar` | Filter chip controls | `filterConfigs`, `activeFilters`, callbacks |
| `InsightCard` | Branded insight with CTA | `title`, `description`, `variant` |
| `ActionCard` | Clickable card with icon + arrow | `title`, `description`, `icon`, `onClick` |
| `MetricCard` | Metric with trend indicator | `title`, `value`, `trend`, `variant` |
| `SimpleMetric` | Minimal label + value + trend | `label`, `value`, `trend`, `variant` |

---

## SectionWithHeader

Consistent section layout with title, description, and an optional right-aligned filter slot.

**Variants:**

| Variant | Behavior |
|---------|----------|
| `default` | Title + description only |
| `withFilter` | Title + description + filter slot (right side) |

**Layout:**

```
┌──────────────────────────────────────────┐
│ Title                        [Filter]    │
│ Description                              │
├──────────────────────────────────────────┤
│ {children}                               │
└──────────────────────────────────────────┘
```

**Wrapper classes:** `px-4 lg:px-6 space-y-4`

```tsx
<SectionWithHeader title="Overview" description="Summary of key metrics" variant="withFilter" filter={<Select />}>
  {children}
</SectionWithHeader>
```

---

## KeyMetricsShowcase

Grid of metric cards with an optional insight/banner card on the right.

**Layout:** ~70% metrics grid, ~30% insight card when both present.

```
┌──────────┬──────────┬──────────┬─────────────┐
│ Metric 1 │ Metric 2 │ Metric 3 │ InsightCard  │
└──────────┴──────────┴──────────┴─────────────┘
```

**Rules:**
- **Full width, no margins** — Do not add horizontal margins around `KeyMetricsShowcase`. Keep standard padding (`px-4 lg:px-6`) inside the component.
- Pass `metrics` as an array of metric objects.
- `insightCard` is optional — grid fills full width without it.
- Supports `filter` and `onMetricClick`.

---

## PendingApprovalChartCard

Card with an embedded Recharts chart. Supports multiple chart types.

**Chart types:** `bar` | `pie` | `donut` | `line` | `area`

| Prop | Purpose |
|------|---------|
| `data` | Array of data points |
| `chartType` | Which chart to render |
| `dataKeyX` / `dataKeyY` | Axis mapping (bar, line, area) |
| `colorKey` | Color mapping (pie, donut) |
| `showLegend` | Toggle legend visibility |
| `askLeo` | Show "Ask Leo" CTA |

**Rules:**
- Use chart token colors (`--chart-1` through `--chart-5`).
- Wrap all charts in `ResponsiveContainer`.

---

## AlertsSection

A list of alert items with optional urgency/type filter.

**Variants:** `default` | `withFilter`

---

## MapSection

Leaflet map with a centered search bar overlay and a rotating activity-alert ticker at the bottom.

| Prop | Purpose |
|------|---------|
| `locations` | Marker data (lat/lng, count, name) |
| `searchFields` | Array of search field configs |
| `alerts` | Rotating alert messages |
| `greeting` | Optional greeting above the map |
| `onSearch`, `onLocationSelect` | Callbacks |

---

## PrimaryPageTemplate

Full-page template combining header, metrics, tabbed toolbar, content area, and a floating bulk-action bar.

**Zones:**

```
┌──────────────────────────────────────────────┐
│ Header (title, description, actions)         │
├──────────────────────────────────────────────┤
│ Metrics (toggleable)                         │
├──────────────────────────────────────────────┤
│ Tabs │ Search │ Filters │ Table Properties   │
├──────────────────────────────────────────────┤
│ Tab Content (DataTable or dashboard sections) │
├──────────────────────────────────────────────┤
│ Floating Bulk Action Bar (when selected)     │
└──────────────────────────────────────────────┘
```

**Scroll modes:**
- **Default:** Only the tab content area scrolls; header, metrics, toolbar stay fixed. Use for list pages (DataTable).
- **`fullPageScroll`:** The entire page scrolls as one unit. Use for content pages with dashboard-style sections.

---

## ReportPageTemplate

Template for report-style pages: header + tabs + scrollable content. **No top key metrics** (Total Active Students, etc.).

**Use when:** Reports, Analytics, and similar content-heavy pages with dashboard-style sections (PartnerSitePerformanceCard, PendingApprovalChartCard, SectionWithHeader).

**Zones:**
```
┌──────────────────────────────────────────────┐
│ Header (title, description, actions)         │
├──────────────────────────────────────────────┤
│ Tabs │ [optional toolbar: search, etc.]     │
├──────────────────────────────────────────────┤
│ Tab Content (sections, cards, charts)       │
│   — scrolls with entire page                 │
└──────────────────────────────────────────────┘
```

**Props:** `title`, `description`, `headerActions`, `views`, `activeTab`, `onTabChange`, `renderTabContent`, `toolbarActions` (optional).

**Tabs:** Underline variant — `TabsList` transparent, `TabsTrigger` with `border-b-2` active state. Each view: `name`, `id`, `icon`, optional `description` (tooltip), optional `count`.

---

## DataTable

Full-featured table.

**Features:** Sorting, pagination, column pinning (left/right), bulk row selection, drag-to-reorder columns, inline actions.

**Integration:** Use with `FilterBar`, `ViewManager`, `TableProperties`.

**Column pinning rules:**
- Pin identifier columns (ID, Name) to the left.
- Pin action/status columns to the right.
- Max: 2 left + 2 right pinned columns.
- Auto-pin when table has 8+ columns.

---

## InsightCard

Branded card with a glowing border animation and a CTA button.

---

## ActionCard

Clickable card with a colored background, icon, title, description, and a right arrow.

---

## MetricCard / SimpleMetric

Metric display with value, optional trend arrow and percentage.

| Component | When to use |
|-----------|-------------|
| `MetricCard` | Full metric: title, value, trend, icon |
| `SimpleMetric` | Compact metric: label, value, trend |

---

## CalendarView

Calendar-based visualization with day/month navigation and event display.

---

## PipelineStepper

Step-by-step pipeline visualization with active, completed, and pending states.

---

## ChartAreaInteractive

Interactive area chart with time-range controls. Used in analytics/reporting.

---

## AskLeoButton

CTA button that opens the Leo AI assistant with contextual chart/data information.

| Prop | Purpose |
|------|---------|
| `chartTitle` | Title of the chart/section for context |
| `chartDescription` | Description for context |
| `chartData` | Optional data summary string |

---

## Adding a New Composite

1. Place in `src/components/shared/`.
2. Export from `src/components/shared/index.ts`.
3. Compose from UI primitives — no raw HTML for Cards, Buttons, etc.
4. Accept `className` for layout composition.
5. Keep product-specific logic out — accept data via props instead.
6. Document in this file with purpose, props, and layout diagram.
