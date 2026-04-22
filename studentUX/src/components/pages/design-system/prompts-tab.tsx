import * as React from "react";
import { Button } from "../../ui/button";
import { Badge } from "../../ui/badge";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import { Separator } from "../../ui/separator";
import { FontAwesomeIcon } from "../../brand/font-awesome-icon";

// ─── Types ────────────────────────────────────────────────────────────────

interface PromptTemplate {
  id: string;
  title: string;
  description: string;
  tags: string[];
  variables: { name: string; placeholder: string; example: string }[];
  template: string;
  output: string;
}

// ─── Prompt Templates ────────────────────────────────────────────────────

const promptTemplates: PromptTemplate[] = [
  {
    id: "list-page",
    title: "Create a List Page",
    description: "Generates a full PrimaryPageTemplate page with DataTable, metrics, tabs, and filters.",
    tags: ["page", "list", "table"],
    variables: [
      { name: "entity", placeholder: "Entity name (plural)", example: "Site Partners" },
      { name: "tabs", placeholder: "Tab labels (comma separated)", example: "Active, Pending, Archived" },
      { name: "columns", placeholder: "Column names (comma separated)", example: "Name, Location, Capacity, Status, Last Updated" },
      { name: "metrics", placeholder: "Metric names (comma separated)", example: "Total Sites, Active Sites, Avg Capacity, Compliance Rate" },
    ],
    template: `Create a new list page for {entity} in the Exxat One design system.

Use PrimaryPageTemplate from @/components/shared/primary-page-template.

TABS: {tabs}

METRICS ROW (use KeyMetricsShowcase pattern inside metrics config):
{metrics}

DATATABLE COLUMNS:
{columns}
- First column (name/id): pin left
- Last column (actions): pin right with DropdownMenu (View details, Edit, Delete)
- Status column: use Badge (default=active, secondary=pending, destructive=overdue, outline=draft)
- Date columns: format as MM/DD/YYYY using formatDate from @/utils/date-utils

FILTERS: Create filter configs for the main categorical columns (Status, and any program/type columns).

BULK ACTIONS: Add "Export" and "Send Reminder" bulk actions.

MOCK DATA: Use 15-25 rows from patterns in @/data/mock-data.ts (generateStudentScheduleData style).

SEARCH: Search by name/title column.

RULES:
- Use FontAwesomeIcon (primary) for all icons, Lucide only as fallback
- Use cn() for all conditional class names — never template literals
- Never hardcode colors — always use design tokens (text-chart-1, bg-muted, etc.)
- Specialization columns: plain text, never Badge
- All link-style text: text-chart-1
- Component file: src/components/pages/{entity-kebab}-page.tsx
- Export as named export: export function {EntityPascal}Page()`,
    output: "A complete .tsx file implementing the page with all required components wired together.",
  },

  {
    id: "detail-page",
    title: "Create a Detail Page",
    description: "Generates a secondary detail view for a record, with tabs for different data sections.",
    tags: ["page", "detail", "secondary"],
    variables: [
      { name: "entity", placeholder: "Entity name (singular)", example: "Site Partner" },
      { name: "parent-page", placeholder: "Parent list page name", example: "Site Partners" },
      { name: "tabs", placeholder: "Detail section tabs", example: "Overview, Students, Compliance, Documents" },
      { name: "hero-fields", placeholder: "Hero section fields", example: "Name, Location, Type, Status, Contact" },
    ],
    template: `Create a detail page for {entity} in the Exxat One design system.

This is a SECONDARY page (no PrimaryPageTemplate or ReportPageTemplate).

BREADCRUMB: Home → {parent-page} → {entity} Name

HERO SECTION (sticky at top):
- Back button: navigates back to {parent-page} list
- {entity} name as h1
- Subtitle with key identifying fields: {hero-fields}
- Status Badge (right-aligned)
- Primary action button (e.g. "Edit {entity}")

TABS: {tabs}
- Use Tabs component with flex-nowrap
- Each tab content uses SectionWithHeader to group content

TAB CONTENT PATTERN:
- Overview: key details in a 2-column grid of Cards, plus an InsightCard at bottom with AskLeoButton
- Documents/Compliance: use a DataTable with relevant columns
- Other tabs: SectionWithHeader + appropriate content

LAYOUT:
- Sticky detail header (border-b, bg-background, px-4 lg:px-6, py-4)
- Scrollable body below header
- Page padding: px-4 lg:px-6 py-6

RULES:
- Parent sidebar item ({parent-page}) must stay active in navigation
- Use useAppStore navigateBackFromScheduleDetail pattern for back navigation
- Component: src/components/pages/{entity-kebab}-detail.tsx
- Export: export function {EntityPascal}Detail({ id, onBack })`,
    output: "A complete .tsx file for the detail view with tabs, hero section, and mock data.",
  },

  {
    id: "report-page",
    title: "Create a Report / Analytics Page",
    description: "Generates a ReportPageTemplate page with charts, metrics, and data sections.",
    tags: ["page", "report", "analytics", "charts"],
    variables: [
      { name: "title", placeholder: "Report title", example: "Compliance Analytics" },
      { name: "tabs", placeholder: "Report section tabs", example: "Overview, Trends, By Student, By Site" },
      { name: "primary-chart", placeholder: "Main chart type and data", example: "Area chart: compliance rate over 90 days (pending, complete, overdue)" },
      { name: "metrics", placeholder: "Top KPIs", example: "Overall Rate, Complete, Pending, Overdue" },
    ],
    template: `Create a report page titled "{title}" in the Exxat One design system.

Use ReportPageTemplate from @/components/shared/report-page-template.

TABS: {tabs}

HEADER ACTIONS: "Export PDF" button (outline variant, sm size, Download icon)

TAB CONTENT STRUCTURE (full-page scroll, px-4 lg:px-6 py-6):
1. SectionWithHeader → KeyMetricsShowcase with {metrics}
2. SectionWithHeader → {primary-chart} using ChartAreaInteractive or Recharts directly
3. SectionWithHeader → Supporting data (DataTable or Cards grid)
4. InsightCard at end with AskLeoButton query about the report data

CHART RULES:
- Use chart-1 through chart-5 tokens for data series colors (NEVER hardcode hex)
- Always include a legend and tooltip
- Use date-fns for date formatting

MOCK DATA:
- Generate realistic looking data arrays in the component file
- 90 days of trend data, 10-15 rows for tables

RULES:
- Full-page scroll (no fixed header for content)
- SectionWithHeader wraps each content group
- Component: src/components/pages/{title-kebab}-page.tsx
- Export: export function {TitlePascal}Page()`,
    output: "A complete .tsx file with ReportPageTemplate, charts, metrics, and mock data.",
  },

  {
    id: "add-metric",
    title: "Add a Metric Card",
    description: "Adds a new metric to an existing page's metrics row.",
    tags: ["metric", "kpi", "component"],
    variables: [
      { name: "page", placeholder: "Page component file path", example: "src/components/pages/slots-page.tsx" },
      { name: "metric-name", placeholder: "Metric display name", example: "Confirmation Rate" },
      { name: "metric-value", placeholder: "How value is computed", example: "approved slots / total requested, as %" },
      { name: "trend", placeholder: "Trend direction", example: "up (higher is better)" },
    ],
    template: `Add a new metric card to {page}.

METRIC: "{metric-name}"
VALUE: Compute as: {metric-value}
TREND: {trend}

Steps:
1. Find the metrics array in the component (look for PrimaryPageTemplate metrics.items or KeyMetricsShowcase metrics props)
2. Add a new MetricCardData entry:
   {
     title: "{metric-name}",
     value: computedValue,  // calculate from mock data
     change: "+X%",         // vs previous period (use hardcoded mock delta)
     trend: "{trend}",
     description: "vs last semester",
   }
3. Ensure the grid still fits — if there are now 5+ metrics, consider using columns={5} or removing a less important metric

RULES:
- trend: "up" | "down" | "neutral"
- Values shown as string (e.g. "94%", "247", "$1.2K")
- change shown as "+X%" or "-X" with sign`,
    output: "Modified page file with the new metric added to the metrics configuration.",
  },

  {
    id: "add-filter",
    title: "Add a Filter to a Page",
    description: "Adds a new filter option to an existing page's FilterBar.",
    tags: ["filter", "table", "refinement"],
    variables: [
      { name: "page", placeholder: "Page component file path", example: "src/components/pages/student-schedule-page.tsx" },
      { name: "field", placeholder: "Field to filter by", example: "Specialization" },
      { name: "options", placeholder: "Filter options (comma separated)", example: "Cardiology, Pediatrics, Emergency, Internal Medicine, Surgery" },
      { name: "type", placeholder: "Filter type", example: "multi-select with search (10+ options) OR simple dropdown" },
    ],
    template: `Add a "{field}" filter to {page}.

FILTER OPTIONS: {options}
TYPE: {type}

Steps:
1. Find the filters configuration in the component
2. Add a new filter config entry:
   { id: "{field-id}", label: "{field}", options: [{options as array}] }
3. Ensure the filtering logic in renderTabContent applies this filter:
   data.filter(row => activeFilters.{field-id} ? row.{field} === activeFilters.{field-id} : true)
4. Add the filter to the FilterBar configs array

RULES:
- Filter ID: camelCase of the field name (e.g. "specialization", "siteType")
- For 10+ options: FilterBar auto-shows a searchable dropdown
- Filtering is additive (AND logic between multiple active filters)
- Never filter discipline (it's implicit from program selection)`,
    output: "Modified page file with the new filter wired into the FilterBar and data filtering logic.",
  },

  {
    id: "add-column",
    title: "Add a Column to DataTable",
    description: "Adds a new column to an existing DataTable configuration.",
    tags: ["table", "column", "data"],
    variables: [
      { name: "page", placeholder: "Page component file path", example: "src/components/pages/slots-page.tsx" },
      { name: "column-name", placeholder: "Column display label", example: "Preceptor" },
      { name: "data-key", placeholder: "Data object key", example: "preceptorName" },
      { name: "type", placeholder: "Column content type", example: "text | badge | date | link | number" },
    ],
    template: `Add a "{column-name}" column to the DataTable in {page}.

DATA KEY: {data-key}
TYPE: {type}

Steps:
1. Find the columns array (ColumnConfig[]) in the component
2. Add a new ColumnConfig entry:
   {
     key: "{data-key}",
     label: "{column-name}",
     icon: "user",          // appropriate FontAwesome icon name
     isPinned: false,
     isVisible: true,
     width: 160,            // estimate based on content (120-240)
     sortable: true,
   }
3. Update mock data to include {data-key} values
4. Handle rendering in the cell render function if type is NOT plain text:
   - badge: <Badge variant={...}>{value}</Badge>
   - date: formatDate(value) from @/utils/date-utils
   - link: <span className="text-chart-1 cursor-pointer hover:underline">{value}</span>
   - number: toLocaleString() for large numbers

RULES:
- Specialization columns: NEVER Badge — plain text only
- Position: add after the last content column, before any pinned-right action columns
- If table now has 8+ columns, consider adding isPinned: true for the first identifier column`,
    output: "Modified page file with the new column in the columns config and mock data updated.",
  },

  {
    id: "add-section",
    title: "Add a Section to a Page",
    description: "Adds a new content section to an existing page using SectionWithHeader.",
    tags: ["section", "layout", "content"],
    variables: [
      { name: "page", placeholder: "Page component file path", example: "src/components/pages/reports-page.tsx" },
      { name: "tab", placeholder: "Which tab to add it to", example: "Overview tab" },
      { name: "title", placeholder: "Section title", example: "Top Performing Sites" },
      { name: "content", placeholder: "What the section shows", example: "A horizontal bar chart ranking sites by placement count, top 10" },
    ],
    template: `Add a "{title}" section to the {tab} of {page}.

CONTENT: {content}

Steps:
1. Find the render function for {tab} in the page component
2. Add a new SectionWithHeader block after the last existing SectionWithHeader:
   <SectionWithHeader
     title="{title}"
     description="Brief description of what this shows"
     filter={<Select ... />}  // optional: date range or groupBy picker
   >
     {/* Content: chart, table, cards grid, or list */}
   </SectionWithHeader>

CONTENT CHOICE:
- Bar/area chart: use Recharts BarChart or ChartAreaInteractive
- Cards grid: grid grid-cols-3 gap-4 with Card components
- Table: DataTable or a simple <table> for read-only data
- End the section with: <AskLeoButton chartTitle="{title}" chartDescription="Brief description of what this section shows" />

RULES:
- Section padding: the outer page already has px-4 lg:px-6, don't double-pad
- Section gap from previous: gap-12 between sections
- Chart colors: chart-1 through chart-5 tokens only
- Insight callout at end (optional): InsightCard with AI-generated text mock`,
    output: "Modified page file with the new section inserted into the correct tab content.",
  },
];

// ─── Prompt Card ──────────────────────────────────────────────────────────

function PromptCard({ template }: { template: PromptTemplate }) {
  const [vars, setVars] = React.useState<Record<string, string>>(
    Object.fromEntries(template.variables.map((v) => [v.name, ""]))
  );
  const [copied, setCopied] = React.useState(false);

  const resolvedPrompt = React.useMemo(() => {
    let result = template.template;
    template.variables.forEach(({ name }) => {
      const value = vars[name] || `{${name}}`;
      result = result.replaceAll(`{${name}}`, value);
    });
    return result;
  }, [vars, template]);

  const copyPrompt = () => {
    navigator.clipboard.writeText(resolvedPrompt).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const fillExamples = () => {
    setVars(Object.fromEntries(template.variables.map((v) => [v.name, v.example])));
  };

  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      <div className="px-5 py-4 border-b">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-semibold">{template.title}</h3>
            <p className="text-sm text-muted-foreground mt-0.5">{template.description}</p>
          </div>
          <div className="flex gap-1.5 flex-shrink-0">
            {template.tags.map((t) => (
              <Badge key={t} variant="secondary" className="text-xs">{t}</Badge>
            ))}
          </div>
        </div>
      </div>

      {template.variables.length > 0 && (
        <div className="px-5 py-4 border-b bg-muted/20">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Fill in variables</p>
            <button
              onClick={fillExamples}
              className="text-xs text-chart-1 hover:underline"
            >
              Load examples
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {template.variables.map((v) => (
              <div key={v.name} className="flex flex-col gap-1">
                <Label className="text-xs">{v.name.replace(/-/g, " ")}</Label>
                <Input
                  className="h-8 text-xs"
                  placeholder={v.placeholder}
                  value={vars[v.name]}
                  onChange={(e) => setVars((prev) => ({ ...prev, [v.name]: e.target.value }))}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="relative">
        <div className="flex items-center justify-between px-5 pt-4 pb-2">
          <p className="text-xs font-medium text-muted-foreground">Prompt</p>
          <div className="flex gap-2">
            <button
              onClick={() => setVars(Object.fromEntries(template.variables.map((v) => [v.name, ""])))}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Reset
            </button>
            <Button size="sm" className="h-7 text-xs" onClick={copyPrompt}>
              <FontAwesomeIcon name="copy" className="h-3.5 w-3.5" aria-hidden="true" />
              {copied ? "Copied!" : "Copy Prompt"}
            </Button>
          </div>
        </div>
        <pre className="px-5 pb-5 text-xs text-muted-foreground leading-5 whitespace-pre-wrap overflow-x-auto max-h-48 overflow-y-auto border rounded-lg mx-5 mb-5 p-4 bg-muted/30">
          <code>{resolvedPrompt}</code>
        </pre>
      </div>

      <div className="px-5 pb-4">
        <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/30 rounded-lg px-3 py-2">
          <FontAwesomeIcon name="circleInfo" className="h-3.5 w-3.5 flex-shrink-0" aria-hidden="true" />
          <span><strong className="text-foreground">Expected output:</strong> {template.output}</span>
        </div>
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────

export function PromptsTab() {
  const [search, setSearch] = React.useState("");
  const [activeTag, setActiveTag] = React.useState<string | null>(null);

  const allTags = [...new Set(promptTemplates.flatMap((p) => p.tags))];

  const filtered = promptTemplates.filter((p) => {
    const matchSearch =
      !search ||
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.description.toLowerCase().includes(search.toLowerCase()) ||
      p.tags.some((t) => t.includes(search.toLowerCase()));
    const matchTag = !activeTag || p.tags.includes(activeTag);
    return matchSearch && matchTag;
  });

  return (
    <div className="flex flex-col gap-12 px-4 lg:px-6 py-8 max-w-7xl mx-auto w-full">

      {/* Hero */}
      <div className="rounded-xl border bg-gradient-to-br from-primary/5 to-primary/10 p-6">
        <h2 className="text-lg font-semibold mb-1">AI Prompt Library</h2>
        <p className="text-sm text-muted-foreground mb-4 max-w-2xl">
          Ready-to-use prompts for PMs and designers. Fill in the variables, copy the prompt, and paste it into
          Claude Code, Cursor, or any AI coding assistant to generate design-system-correct UI instantly.
        </p>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <FontAwesomeIcon name="circleCheck" className="h-3.5 w-3.5 text-chart-1" />
          <span>All prompts enforce design tokens, component library, and product conventions automatically.</span>
        </div>
      </div>

      {/* Filter & search */}
      <div className="flex flex-col gap-3">
        <div className="relative">
          <FontAwesomeIcon name="magnifyingGlass" className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
          <Input
            className="pl-9 h-9"
            placeholder="Search prompts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setActiveTag(null)}
            className={`px-3 py-1 text-xs rounded-full border transition-colors ${!activeTag ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:text-foreground"}`}
          >
            All
          </button>
          {allTags.map((tag) => (
            <button
              key={tag}
              onClick={() => setActiveTag(activeTag === tag ? null : tag)}
              className={`px-3 py-1 text-xs rounded-full border transition-colors ${activeTag === tag ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:text-foreground"}`}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      <Separator />

      {/* Prompts grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground text-sm">No prompts match your search.</p>
          <button onClick={() => { setSearch(""); setActiveTag(null); }} className="text-xs text-chart-1 mt-2 hover:underline">
            Clear filters
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {filtered.map((template) => (
            <PromptCard key={template.id} template={template} />
          ))}
        </div>
      )}

      <Separator />

      {/* Tips */}
      <section>
        <h3 className="text-base font-semibold mb-4">Tips for Getting the Best Results</h3>
        <div className="grid grid-cols-2 gap-4">
          {[
            {
              icon: "lightbulb" as const,
              title: "Be specific about entity names",
              body: "Use the actual entity name from the app (e.g. 'Site Partner', not 'company'). This helps the AI use correct file naming and state management."
            },
            {
              icon: "list" as const,
              title: "List all columns upfront",
              body: "Provide all the columns you want in a table — the AI will auto-pin the right columns and choose appropriate rendering (Badge, date, text, link)."
            },
            {
              icon: "circleCheck" as const,
              title: "Reference the CLAUDE.md",
              body: "If using Cursor or Claude Code, the CLAUDE.md file at the project root is automatically loaded. You can just say 'follow the design system' and it will know what to do."
            },
            {
              icon: "arrowRight" as const,
              title: "Iterate with follow-up prompts",
              body: "Start with a full page prompt, then refine with 'add a filter for X', 'add a column Y', or 'add an insight section'. Each prompt in this library is designed to compose."
            },
          ].map(({ icon, title, body }) => (
            <div key={title} className="rounded-xl border p-4 flex gap-3">
              <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0 mt-0.5">
                <FontAwesomeIcon name={icon} className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              </div>
              <div>
                <p className="text-sm font-medium">{title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
}
