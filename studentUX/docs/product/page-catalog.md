# Page Catalog

Which templates and composites each page uses. Reference this when building new pages to follow established patterns.

---

## Page Hierarchy

| Level | Pages | Header Pattern |
|-------|-------|----------------|
| **Primary** | Home, Slots, Wishlist, Student Schedule, Leo AI, Inbox | SiteHeader with page title |
| **Secondary** | Schedule Detail, Site Partner Detail | SiteHeader with breadcrumbs, metadata header |
| **Tertiary** | School Profile, Student Profile | SiteHeader with multi-level breadcrumbs |

---

## Dashboard / Home

**Template:** Custom composition (no `PrimaryPageTemplate`)

**Sections (top to bottom):**

| Section | Composite Used |
|---------|---------------|
| Map + search | `MapSection` → `HomeMapSection` |
| Key metrics | `KeyMetricsShowcase` → `MetricShowcase` |
| Partner performance | `PartnerSitePerformanceCard` (horizontal row in a `Card`) |
| Requests pending | `PendingApprovalChartCard` (bar chart) |
| Schedules pending | `PendingApprovalChartCard` (bar chart) |
| Schedule pipeline | `PendingApprovalChartCard` (donut chart) |
| Student onboarding | `PendingApprovalChartCard` (donut chart) |
| Alerts | `AlertsSection` |

**Layout:** `px-4 lg:px-6` per section, `gap-12` between sections.

---

## List / Pipeline Pages

**Template:** `PrimaryPageTemplate`

**Pages:** Slots Pipeline, Wishlist Pipeline, Student Schedule Pipeline, Reports, My Students, Site Partners

**Structure:**
1. Header (title, description, action buttons)
2. Metrics bar (`SimpleMetric` grid, optional `ActionCard` banner)
3. Tabs (stages/views) + Toolbar (search, filter toggle, table properties)
4. `DataTable` content
5. `FloatingActionBar` (when rows selected)

**Filters:** `FilterBar` with page-specific `FilterConfig[]`.

**Tabs:** In-page tabs for pipeline stages (Requested, Pending, Confirmed, etc.).

---

## Overview Pages

**Template:** Custom composition

**Pages:** Slots Overview, Wishlist Overview, Student Schedule Overview

**Structure:**
1. `SectionWithHeader` per section
2. `KeyMetricsShowcase` or `MetricCard` grid
3. `PendingApprovalChartCard` for charts
4. `AlertsSection` for alerts

---

## Detail Pages (Secondary)

**Pages:** Schedule Detail, Site Partner Detail

**Structure:**
1. SiteHeader with breadcrumbs (`Home > Parent > Detail`)
2. Header block: title, status badge, metadata, action dropdown
3. Tabbed content (details, timeline, documents)

**Spacing:** `px-4 lg:px-6 pt-4 lg:pt-6 space-y-6`

---

## Profile Pages (Tertiary)

**Pages:** School Profile, Student Profile

**Structure:**
1. SiteHeader with multi-level breadcrumbs
2. Profile header (avatar, name, metadata)
3. Section tabs (overview, history, documents)

---

## AI Chat Page (Leo AI)

**Template:** Custom full-height composition

**Structure:**
1. Scrollable chat history (flex-1, overflow-y-auto)
2. Fixed bottom input area (flex-none)

**Pattern:**

```
┌───────────────────────────────────────┐
│ Chat messages (scrollable)            │
│   Assistant message (left, bg-muted)  │
│   User message (right, bg-primary)    │
│   ...                                 │
├───────────────────────────────────────┤
│ Input area (fixed bottom)             │
│   Textarea + suggestion chips + send  │
└───────────────────────────────────────┘
```

**Key conventions:**
- `px-4 lg:px-6` for content padding.
- `max-w-4xl mx-auto` for centered content.
- Use `cn()` for user/assistant conditional styles.
- Textarea with `aria-label` (no visible label).
- Icon-only buttons use `aria-label`.

---

## Reports Page

**Template:** `ReportPageTemplate`

**Structure:**
1. Header (title, description, action buttons: Export Data, Generate Report)
2. Tabs (Overview, Analytics, Charts, Images, Reports) + optional search in toolbar
3. Tab content: dashboard-style sections (PartnerSitePerformanceCard, SectionWithHeader, PendingApprovalChartCard, Card)

**No top key metrics** — ReportPageTemplate does not include Total Active Students, Partner Institutions, etc. Use for report-style pages with section/card content only.

**Scroll:** Entire page scrolls as one unit.

---

## Adding a New Page

1. Determine level: Primary, Secondary, or Tertiary.
2. Choose template: `PrimaryPageTemplate` for list pages; custom composition for dashboards/overviews.
3. Use shared composites — don't rebuild Card, Section, or Table patterns.
4. Add navigation entry (see [Navigation](./navigation.md)).
5. Add to this catalog.
