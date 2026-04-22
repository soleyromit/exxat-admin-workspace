# Creating Components — AI Prompt Templates

> For adding columns, filters, metrics, sections, and composites to existing pages.
>
> **Before shipping:** All new components and pages must pass the [WCAG 2.1 AA Checklist](../design-system/wcag-aa-checklist.md).

---

## Add a Column to DataTable

```
Add a "[Column Label]" column to the DataTable in [file-path].tsx.

DATA KEY: [dataKey]  (the object property name, camelCase)
COLUMN TYPE: [text | badge | date | link | number | custom]
POSITION: after the "[Existing Column Name]" column
WIDTH: [120-240]px (estimate based on content length)
SORTABLE: [yes | no]

RENDERING (based on type):
- text: plain span
- badge: <Badge variant={statusMap[value]}>  (define statusMap above DataTable)
- date: formatDate(value) from @/utils/date-utils
- link: <span className="text-chart-1 cursor-pointer hover:underline">{value}</span>
- number: value.toLocaleString() for large numbers, or "{value}%" for rates

MOCK DATA: Add realistic values for this field to the existing mock data array

RULES:
- Specialization: ALWAYS plain text — never Badge
- If table now has 8+ columns: pin first identifier column left, last action column right
- Icon: choose an appropriate FontAwesome icon name for the column header

Follow all conventions in CLAUDE.md.
```

---

## Add a Filter

```
Add a "[Field Name]" filter to [file-path].tsx.

FILTER ID: [field-id]  (camelCase, e.g. "specialization", "siteType")
FILTER LABEL: "[Field Name]"
OPTIONS: [Option1], [Option2], [Option3], [Option4]
TYPE: [simple dropdown (< 8 options) | searchable dropdown (8+ options)]
POSITION: after the "[Existing Filter Name]" filter in the FilterBar config

LOGIC: Filter logic should be: row[key] === activeFilter OR activeFilter is empty/all
MULTIPLE: [AND logic — all active filters must match]

RULES:
- Never add a "Discipline" or "Program" filter — it's implicit from program selection
- FilterBar handles rendering automatically from the configs array
- Active filter chips appear automatically when a filter is selected

Follow all conventions in CLAUDE.md.
```

---

## Add a Metric Card

```
Add a "[Metric Name]" metric card to [file-path].tsx.

DISPLAY LABEL: "[Metric Name]"
VALUE: computed as: [description of what it shows]
ICON: [font-awesome icon name, e.g. "calendar", "users", "chart-bar"]
TREND: [up | down | neutral]  (up = green, down = red, neutral = gray)
CHANGE: "[+X% | -X | +X]" (hardcoded mock delta for now)
DESCRIPTION: "[context, e.g. 'vs last semester']"

POSITION: [after / before] "[Existing Metric Name]" in the metrics array
GRID: adjust columns prop if needed (1-6 columns)

Follow all conventions in CLAUDE.md.
```

---

## Add a Section to a Page Tab

```
Add a "[Section Title]" section to the [Tab Name] tab of [file-path].tsx.

POSITION: after the "[Existing Section Title]" SectionWithHeader

DESCRIPTION (shown in SectionWithHeader): "[brief description of what it shows]"

FILTER (right side of section header, optional):
- [date range picker | segment selector | "none"]

CONTENT TYPE: [chart | cards-grid | table | list | stat-row]

CONTENT DETAILS:
[If chart]: Recharts [BarChart | AreaChart | PieChart] showing [data description]
  - Use chart-1 through chart-5 tokens for series colors
  - Include ResponsiveContainer, Tooltip, Legend
  - Mock data: array of { date/label, value1, value2 } objects

[If cards-grid]: grid-cols-[2|3|4] gap-4, each Card shows [field1, field2, field3]

[If table]: DataTable or simple read-only <table> with columns [C1, C2, C3]

END OF SECTION:
- InsightCard: "[realistic insight text about this section's data]"
- AskLeoButton: query="[relevant AI query about the section]"

Follow all conventions in CLAUDE.md.
```

---

## Add a Bulk Action

```
Add a "[Action Label]" bulk action to [file-path].tsx.

ICON: [font-awesome icon name, e.g. "bell", "download", "check", "envelope"]
VARIANT: [default | outline | destructive]
BEHAVIOR: [mock — log to console | show toast | open dialog]

DIALOG (if action requires confirmation):
- Title: "Confirm [Action Label]"
- Description: "This will [action description] for {count} selected records."
- Footer: Cancel (outline) + Confirm ([action]) button

POSITION: add to bulkActions array in PrimaryPageTemplate props

Follow all conventions in CLAUDE.md.
```

---

## Add an Empty State

```
Add an empty state to the [Tab Name] tab of [file-path].tsx.

CONDITION: show when the filtered data array is empty

ICON: [font-awesome icon name appropriate for the entity]
TITLE: "[No X found]" or "[No X yet]"
DESCRIPTION: "[one sentence explaining why it's empty and what to do]"
CTA (optional): label="[Button Label]" → navigateToPage("[Target Page]")

IMPLEMENTATION:
Replace the DataTable render with a ternary:
{data.length === 0 ? (
  <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
    ...
  </div>
) : (
  <DataTable ... />
)}

Follow all conventions in CLAUDE.md.
```

---

## Add a Chart Section

```
Add a "[Chart Title]" chart to [file-path].tsx.

LIBRARY: Recharts
CHART TYPE: [AreaChart | BarChart | LineChart | PieChart | RadialBarChart]
DATA: [describe what it shows — e.g. "placement count by week over 90 days"]

DATA SERIES:
- [Series 1 Name]: use chart-1 token (#var: --chart-1)
- [Series 2 Name]: use chart-2 token
- [Series 3 Name]: use chart-3 token

AXES:
- X-axis: [dates | categories | labels]
- Y-axis: [count | percentage | value]

FEATURES:
- ResponsiveContainer height={[300|400]}
- Tooltip with custom content
- Legend
- [Optional: reference line, brush, zoom]

MOCK DATA: 30-90 data points, inline in component file

WRAPPER: SectionWithHeader title="[Chart Title]" + AskLeoButton at end

Follow all conventions in CLAUDE.md.
```

---

## Create a New Shared Composite Component

```
Create a new shared composite component called "[ComponentName]" in
src/components/shared/[component-name].tsx.

PURPOSE: [what it does and when to use it]

PROPS INTERFACE:
interface [ComponentName]Props {
  [prop1]: [type]  // [description]
  [prop2]?: [type]  // [description, optional]
}

VISUAL STRUCTURE:
[Describe layout: e.g., "Card with header showing title+badge, body showing a list, footer with CTA button"]

VARIANTS (if any):
- [variant1]: [description]
- [variant2]: [description]

USAGE EXAMPLE:
<[ComponentName]
  [prop1]={...}
  [prop2]={...}
/>

RULES:
- Export as named export: export function [ComponentName]
- Add to src/design-system/registry.ts after creating
- Follow all token, icon, and accessibility conventions in CLAUDE.md
- Complete the [WCAG 2.1 AA Checklist](../design-system/wcag-aa-checklist.md) before merging
```
