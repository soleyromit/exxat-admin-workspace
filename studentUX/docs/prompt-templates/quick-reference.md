# Exxat One — AI Prompt Quick Reference

> One-page cheat sheet for PMs and designers. Copy a prompt, fill in `[variables]`, paste into Claude Code or Cursor.

---

## Page Creation

### List Page (table of records)
```
Create a PrimaryPageTemplate list page for [Entity Name (plural)] in the Exxat One design system.

TABS: [Tab1], [Tab2], [Tab3]
COLUMNS: [Col1], [Col2], [Col3], [Status], Actions
METRICS: [Metric1], [Metric2], [Metric3], [Metric4]
FILTERS: Status, [Field2], [Field3]
BULK ACTIONS: Export, [Action2]
MOCK DATA: 20 rows

Follow all conventions in CLAUDE.md.
```

### Report / Analytics Page
```
Create a ReportPageTemplate analytics page titled "[Page Title]" in Exxat One.

TABS: [Tab1], [Tab2], [Tab3]
PRIMARY CHART: [chart type] showing [data description]
METRICS: [M1], [M2], [M3], [M4]
EXPORT BUTTON: yes

Follow all conventions in CLAUDE.md.
```

### Detail Page
```
Create a detail page for [Entity (singular)] in the Exxat One design system.

PARENT PAGE: [Parent List Page Name]
TABS: [Tab1], [Tab2], [Tab3]
HERO FIELDS: [Name], [Field2], [Field3], [Status]
PRIMARY ACTION BUTTON: "[Button Label]"

Follow all conventions in CLAUDE.md.
```

---

## Adding to Existing Pages

### Add a Column
```
Add a "[Column Label]" column to the DataTable in [file-path].tsx.
DATA KEY: [dataKey]
TYPE: [text | badge | date | link | number]
POSITION: after [existing column name]
```

### Add a Filter
```
Add a "[Field Name]" filter to [file-path].tsx.
OPTIONS: [Option1], [Option2], [Option3]
TYPE: [simple dropdown | multi-select with search]
```

### Add a Metric Card
```
Add a "[Metric Name]" metric to the metrics row in [file-path].tsx.
VALUE: [how it's computed from mock data]
TREND: [up | down | neutral]
```

### Add a Section
```
Add a "[Section Title]" section to the [Tab Name] tab of [file-path].tsx.
CONTENT: [chart | cards grid | table | list]
DESCRIPTION: [brief description of what it shows]
Include AskLeoButton at the end of the section.
```

### Add a Bulk Action
```
Add a "[Action Label]" bulk action to [file-path].tsx.
ICON: [font-awesome icon name]
BEHAVIOR: [what it does — mock implementation only]
```

---

## Component Snippets

### MetricCard
```
Add a MetricCard for [metric name] with value [value], trend [up/down], and change [+X%].
Place it in the metrics grid in [file-path].tsx.
```

### Empty State
```
Add an empty state to the [tab name] tab in [file-path].tsx.
MESSAGE: "[No X found]"
DESCRIPTION: "[brief helpful description]"
CTA: "[Button Label]" → navigate to [page name]
```

### InsightCard + AskLeoButton
```
Add an InsightCard at the bottom of the [section name] section in [file-path].tsx.
INSIGHT: "[AI-generated insight text — keep it realistic for [entity] data]"
VARIANT: [default | warning]
Include AskLeoButton with a relevant query after it.
```

---

## Key Rules (always applies)

- **Colors**: `bg-muted`, `text-chart-1`, `bg-destructive/10` — never hex codes
- **Classes**: `cn()` always — never template literals
- **Icons**: `FontAwesomeIcon` primary, Lucide secondary
- **Dates**: `formatDate(value)` from `@/utils/date-utils` — always MM/DD/YYYY
- **Specialization**: plain text, never `<Badge>`
- **Links**: `text-chart-1`, never non-theme colors
- **Exports**: named exports only (`export function PageName()`)
- **Navigation**: `useAppStore.getState().navigateToPage("PageName")`

---

*For full interactive prompts with variable filling, open the app → Design System → Prompt Library tab.*
