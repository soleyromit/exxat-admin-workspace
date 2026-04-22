# Creating Pages — AI Prompt Templates

> Full interactive versions with variable filling available in the app → Design System → Prompt Library tab.

---

## Template 1: List Page (PrimaryPageTemplate)

**Use when:** Creating a page that shows a searchable, filterable, sortable table of records.

**Examples:** Student Schedules, Slots, Site Partners, My Students, Requests

```
Create a new list page for [Entity Name (plural)] in the Exxat One design system.

Use PrimaryPageTemplate from @/components/shared/primary-page-template.

TABS:
- [Tab Label 1] (e.g. Active, Upcoming, Requested)
- [Tab Label 2] (e.g. Pending, Ongoing, Approved)
- [Tab Label 3] (e.g. Archived, Completed, Historical)

METRICS ROW (KeyMetricsShowcase):
- [Metric 1]: e.g. total count of records
- [Metric 2]: e.g. active/this week count
- [Metric 3]: e.g. a rate or percentage
- [Metric 4]: e.g. an alert or action-required count

DATATABLE COLUMNS:
- [Name/ID column]: pin left, text-chart-1 clickable, width ~180px
- [Column 2]: description of content
- [Column 3]: description of content
- [Status column]: Badge (default=active, secondary=pending, destructive=overdue)
- Actions: DropdownMenu (View, Edit, Delete) — pin right

FILTERS:
- Status: [Option1], [Option2], [Option3]
- [Field 2]: [Option1], [Option2]

SEARCH: search by [field name(s)]

BULK ACTIONS: Export, [Action2 like "Send Reminder" or "Approve"]

MOCK DATA: 20-25 rows with varied status values and realistic names

RULES:
- Use FontAwesomeIcon (primary) for all icons
- Use cn() for all conditional class names
- Never hardcode colors — always use design tokens
- Dates in MM/DD/YYYY via formatDate() from @/utils/date-utils
- Specialization as plain text, never Badge
- Component: src/components/pages/[entity-kebab]-page.tsx
- Export: export function [EntityPascal]Page()

Follow all conventions in CLAUDE.md.
```

---

## Template 2: Report / Analytics Page (ReportPageTemplate)

**Use when:** Creating a content-heavy page with charts, metrics, and analytics. Full-page scroll.

**Examples:** Reports, Placement Analytics, Compliance Dashboard, Partner Performance

```
Create a report/analytics page titled "[Page Title]" in the Exxat One design system.

Use ReportPageTemplate from @/components/shared/report-page-template.

TABS:
- [Tab 1]: e.g. Overview — key metrics + primary chart
- [Tab 2]: e.g. Trends — time-series analysis
- [Tab 3]: e.g. By Entity — breakdown table
- [Tab 4 (optional)]: e.g. Compliance, Sites, etc.

HEADER ACTIONS:
- "Export PDF" button (outline, sm, Download icon from lucide-react)
- [Optional: date range picker or other header control]

TAB 1 — [Tab 1 Name] CONTENT (px-4 lg:px-6 py-6, gap-12 between sections):
1. SectionWithHeader "[Metrics Section Title]"
   → KeyMetricsShowcase: [Metric1], [Metric2], [Metric3], [Metric4]
2. SectionWithHeader "[Primary Chart Title]"
   → ChartAreaInteractive or Recharts [chart type] showing [data description]
   → Use chart-1 through chart-5 tokens for data series
3. SectionWithHeader "[Supporting Data Title]"
   → [DataTable with key columns] OR [Cards grid]
4. InsightCard: "[realistic AI insight about the data]"
   → AskLeoButton with query: "Analyze [data topic] and identify trends"

TAB 2+ CONTENT: [describe what each tab shows]

MOCK DATA: Inline arrays in the component — 90 days for trends, 10-15 rows for tables

RULES:
- Full-page scroll (no fixed header for content area)
- SectionWithHeader wraps each content group
- Chart colors: chart-1 through chart-5 ONLY (never hex)
- Component: src/components/pages/[title-kebab]-page.tsx
- Export: export function [TitlePascal]Page()

Follow all conventions in CLAUDE.md.
```

---

## Template 3: Detail Page (custom layout)

**Use when:** Creating a secondary page that shows detailed information about a specific record.

**Examples:** Student Schedule Detail, Site Partner Detail, Student Profile

```
Create a detail page for [Entity (singular)] in the Exxat One design system.

This is a SECONDARY page — do NOT use PrimaryPageTemplate or ReportPageTemplate.

PARENT PAGE: [Parent List Page Name] (sidebar item that stays active)

BREADCRUMB: Home → [Parent Page Name] → [Entity] Name

HERO SECTION (sticky at top, border-b bg-background px-4 lg:px-6 py-4):
- Back button: calls onBack() with ghost sm variant + ChevronLeft icon
- [Entity] name as h1 (text-xl font-semibold)
- Subtitle with: [Field1] · [Field2] · [Field3]
- Status Badge (right-aligned in flex justify-between)
- Primary action: "[Action Label]" Button

TABS (flex-nowrap, px-4 lg:px-6 pt-4):
- [Tab 1]: Overview — key details in a 2-column Card grid + InsightCard + AskLeoButton
- [Tab 2]: [e.g. Documents] — DataTable with [columns]
- [Tab 3]: [e.g. Compliance] — [content description]
- [Tab 4 optional]: [label]

TAB 1 — OVERVIEW CONTENT (px-4 lg:px-6 py-6):
- SectionWithHeader "[Details Title]"
  → 2-column grid of Cards showing key fields and values
- SectionWithHeader "[Related Data Title]"
  → [chart or table]
- InsightCard + AskLeoButton

SCROLL BEHAVIOR:
- Sticky detail header (fixed at top)
- Scrollable body below (flex-1 overflow-y-auto)

MOCK DATA: Use props (scheduleId: string) to select from a mock array

NAVIGATION:
- Component receives: { id: string; onBack: () => void }
- Parent sidebar item ([Parent Page Name]) stays active
- Use navigateBackFromScheduleDetail pattern from app-store

FILE: src/components/pages/[entity-kebab]-detail.tsx
EXPORT: export function [EntityPascal]Detail({ id, onBack }: Props)

Follow all conventions in CLAUDE.md.
```

---

## Template 4: Dashboard Home Section

**Use when:** Adding a new section to the Home page dashboard.

```
Add a "[Section Title]" section to the Home page dashboard in App.tsx.

POSITION: After the [existing section name] section

CONTENT:
- SectionWithHeader title="[Section Title]" description="[brief desc]"
- [Content: charts, cards, alerts, table, or metric grid]
- InsightCard (optional): "[relevant insight]"
- AskLeoButton (optional): query="[relevant query]"

MOCK DATA: Add to src/data/dashboard-data.ts

LAZY LOADING:
1. Create component: src/components/pages/[name]-section.tsx
2. Add React.lazy() in App.tsx (follow pattern of LazyAlertsSection)
3. Wrap with React.Suspense fallback={<SectionLoader />} in Home case

Follow all conventions in CLAUDE.md.
```

---

## Worked Example

**PM request:** "We need a page to manage preceptors — list them, see their students, track their evaluations."

**Translated prompt:**
```
Create a PrimaryPageTemplate list page for Preceptors in the Exxat One design system.

TABS: Active, On Leave, Alumni
COLUMNS: Name (pin left, link), Specialty, Current Students (count), Site, Status, Actions (pin right)
METRICS: Total Preceptors, Active, Avg Students Each, Evaluations Due
FILTERS: Status (Active/On Leave/Alumni), Specialty, Site
SEARCH: search by preceptor name or site
BULK ACTIONS: Export, Send Evaluation Request
MOCK DATA: 20 rows, use mockPreceptorNames from @/data/mock-data.ts

FILE: src/components/pages/preceptors-page.tsx
EXPORT: export function PreceptorsPage()

Follow all conventions in CLAUDE.md.
```

**Result:** A complete, working page with correct components, tokens, mock data, and navigation wiring.
