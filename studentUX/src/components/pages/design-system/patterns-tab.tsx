import * as React from "react";
import { Separator } from "../../ui/separator";
import { Badge } from "../../ui/badge";

// ─── Copy Button ─────────────────────────────────────────────────────────────

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = React.useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(text).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        });
      }}
      className="px-2 py-1 text-xs rounded border border-border bg-background text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
    >
      {copied ? "Copied!" : "Copy"}
    </button>
  );
}

function CodeBlock({ code, title }: { code: string; title?: string }) {
  return (
    <div className="rounded-xl border bg-muted/30">
      {title && (
        <div className="flex items-center justify-between px-4 py-2 border-b">
          <span className="text-xs text-muted-foreground">{title}</span>
          <CopyButton text={code} />
        </div>
      )}
      {!title && (
        <div className="flex justify-end px-4 pt-2">
          <CopyButton text={code} />
        </div>
      )}
      <pre className="text-xs p-4 overflow-x-auto text-muted-foreground leading-5 whitespace-pre-wrap">
        <code>{code}</code>
      </pre>
    </div>
  );
}

function PatternLabel({ label, variant = "outline" }: { label: string; variant?: "outline" | "default" }) {
  return <Badge variant={variant} className="text-xs">{label}</Badge>;
}

// ─── Pattern: Primary Page (list) ─────────────────────────────────────────

const primaryPageCode = `import { PrimaryPageTemplate } from "@/components/shared/primary-page-template"
import { DataTable } from "@/components/shared/data-table"

// Anatomy: Header → Metrics (collapsible) → Search + Filters + Table Props → Tabs → DataTable → FloatingBulkBar

export function StudentsPage() {
  const [activeTab, setActiveTab] = React.useState("upcoming")
  const [searchQuery, setSearchQuery] = React.useState("")
  const [activeFilters, setActiveFilters] = React.useState([])
  const [selectedIds, setSelectedIds] = React.useState<string[]>([])

  return (
    <PrimaryPageTemplate
      title="Student Schedules"
      description="Manage and track all student placement schedules"
      metrics={{
        items: [
          { title: "Total", value: "247", trend: "up", change: "+8%" },
          { title: "This Week", value: "12", trend: "neutral" },
          { title: "Alerts", value: "3", trend: "down", change: "-2" },
        ]
      }}
      views={[
        { id: "upcoming", label: "Upcoming", count: 45 },
        { id: "ongoing", label: "Ongoing", count: 89 },
        { id: "completed", label: "Completed", count: 113 },
      ]}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
      searchPlaceholder="Search by student, site, or preceptor..."
      filters={{
        configs: [
          { id: "status", label: "Status", options: ["Active", "Pending", "Completed"] },
          { id: "program", label: "Program", options: ["PT", "Nursing", "OT"] },
        ],
        active: activeFilters,
        onChange: setActiveFilters,
      }}
      renderTabContent={(tab) => (
        <DataTable
          columns={columns}
          data={getDataForTab(tab)}
          selectedRows={selectedIds}
          onSelectionChange={setSelectedIds}
          onRowClick={(row) => navigateToDetail(row.id)}
        />
      )}
      selectedItems={selectedIds}
      bulkActions={[
        { label: "Send Reminder", icon: "bell", onClick: handleReminder },
        { label: "Export", icon: "download", onClick: handleExport },
      ]}
    />
  )
}`;

// ─── Pattern: Report Page (content) ───────────────────────────────────────

const reportPageCode = `import { ReportPageTemplate } from "@/components/shared/report-page-template"
import { SectionWithHeader } from "@/components/shared/section-with-header"
import { ChartAreaInteractive } from "@/components/shared/chart-area-interactive"

// Anatomy: Header (title + description + headerActions) → Underline Tabs → Full-page-scroll content

export function PlacementReportsPage() {
  const [activeTab, setActiveTab] = React.useState("overview")

  return (
    <ReportPageTemplate
      title="Placement Analytics"
      description="Detailed analysis of placement performance across all programs"
      tabs={[
        { id: "overview", label: "Overview" },
        { id: "trends", label: "Trends" },
        { id: "compliance", label: "Compliance" },
        { id: "sites", label: "Site Performance" },
      ]}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      headerActions={
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4" />
          Export PDF
        </Button>
      }
      renderTabContent={(tab) => {
        if (tab === "overview") return <OverviewContent />
        if (tab === "trends") return <TrendsContent />
        if (tab === "compliance") return <ComplianceContent />
        return <SitePerformanceContent />
      }}
    />
  )
}

// Tab content — use SectionWithHeader to group sections
function OverviewContent() {
  return (
    <div className="flex flex-col gap-12 px-4 lg:px-6 py-6">
      <SectionWithHeader title="Placement Overview" description="Last 90 days">
        <ChartAreaInteractive />
      </SectionWithHeader>
      <SectionWithHeader title="Top Sites">
        {/* content */}
      </SectionWithHeader>
    </div>
  )
}`;

// ─── Pattern: Detail page ─────────────────────────────────────────────────

const detailPageCode = `// Detail pages don't use PrimaryPageTemplate or ReportPageTemplate.
// They use a custom layout with a sticky header + scrollable body.

// Anatomy:
//   SiteHeader (with back breadcrumb → parent list page)
//   ├── Hero section: student name, site, preceptor, status badge
//   ├── Tabs: Overview | Documents | Compliance | Timeline
//   └── Tab content: SectionWithHeader groups + Cards

export function StudentScheduleDetailPage({ scheduleId, onBack }) {
  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Sticky detail header with back navigation */}
      <div className="border-b bg-background px-4 lg:px-6 py-4">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ChevronLeft className="h-4 w-4" />
          Back to Student Schedules
        </Button>
        <div className="mt-3 flex items-start justify-between">
          <div>
            <h1 className="text-xl font-semibold">{studentName}</h1>
            <p className="text-sm text-muted-foreground">{siteName} · {specialization}</p>
          </div>
          <Badge>{status}</Badge>
        </div>
      </div>

      {/* Scrollable detail content */}
      <div className="flex-1 overflow-y-auto">
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="px-4 lg:px-6 pt-4 flex-nowrap">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
            <TabsTrigger value="compliance">Compliance</TabsTrigger>
          </TabsList>
          <div className="px-4 lg:px-6 py-6">
            <TabsContent value="overview">
              <SectionWithHeader title="Schedule Details">
                {/* content */}
              </SectionWithHeader>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  )
}`;

// ─── Pattern: Form section ─────────────────────────────────────────────────

const formPatternCode = `// Use React Hook Form + Zod + shadcn/ui Form components
// Always: visible Label, controlled Input, FormMessage for errors

import { useForm } from "react-hook-form"
import { z } from "zod/v3"
import { zodResolver } from "@hookform/resolvers/zod"
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form"

const schema = z.object({
  studentName: z.string().min(2, "Name must be at least 2 characters"),
  site: z.string().min(1, "Please select a site"),
  startDate: z.string().regex(/^\\d{2}\\/\\d{2}\\/\\d{4}$/, "Use MM/DD/YYYY format"),
})

export function RequestForm() {
  const form = useForm({ resolver: zodResolver(schema) })

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <FormField
          control={form.control}
          name="studentName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Student Name</FormLabel>
              <FormControl>
                <Input placeholder="Emma Wilson" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {/* More fields... */}
        <Button type="submit">Submit Request</Button>
      </form>
    </Form>
  )
}`;

// ─── Pattern: Empty state ─────────────────────────────────────────────────

const emptyStateCode = `// Empty state: centered icon + message + optional CTA
// Use when a tab/section has no data to display

function EmptyState({ title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
      <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
        <FontAwesomeIcon name="inbox" className="h-6 w-6 text-muted-foreground" />
      </div>
      <h3 className="font-medium text-foreground">{title}</h3>
      <p className="text-sm text-muted-foreground mt-1 max-w-sm">{description}</p>
      {action && (
        <Button className="mt-4" onClick={action.onClick}>{action.label}</Button>
      )}
    </div>
  )
}

// Usage inside a tab:
<TabsContent value="upcoming">
  {upcoming.length === 0 ? (
    <EmptyState
      title="No upcoming placements"
      description="Students will appear here once slot requests are approved."
      action={{ label: "View Slot Requests", onClick: () => navigateTo("Slots") }}
    />
  ) : (
    <DataTable columns={columns} data={upcoming} />
  )}
</TabsContent>`;

// ─── Main ─────────────────────────────────────────────────────────────────

export function PatternsTab() {
  return (
    <div className="flex flex-col gap-12 px-4 lg:px-6 py-8 max-w-7xl mx-auto w-full">

      <div>
        <h2 className="text-lg font-semibold mb-1">Page Patterns</h2>
        <p className="text-sm text-muted-foreground">
          Standardized page layouts and interaction patterns. Use the correct template for each page type to ensure
          consistency across the product.
        </p>
      </div>

      {/* ── Page Hierarchy ── */}
      <section>
        <h3 className="text-base font-semibold mb-4">Page Hierarchy</h3>
        <div className="grid grid-cols-3 gap-4">
          {[
            {
              level: "Primary", badge: "default" as const,
              examples: ["Home", "Slots", "Student Schedule", "Reports"],
              desc: "Top-level destination pages. Listed in sidebar primary/pipeline/supporting groups.",
            },
            {
              level: "Secondary", badge: "secondary" as const,
              examples: ["Schedule Detail", "Site Detail", "Student Profile"],
              desc: "Detail views of a primary page record. Navigate via row click. Sidebar parent stays active.",
            },
            {
              level: "Tertiary", badge: "outline" as const,
              examples: ["Edit Schedule", "Review Form", "Document Upload"],
              desc: "Forms and task flows inside secondary pages. Use Dialog or Drawer, not a new page.",
            },
          ].map(({ level, badge, examples, desc }) => (
            <div key={level} className="rounded-xl border p-4 flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <PatternLabel label={level} variant={badge} />
              </div>
              <p className="text-xs text-muted-foreground">{desc}</p>
              <div className="flex flex-wrap gap-1.5">
                {examples.map((e) => (
                  <span key={e} className="text-xs bg-muted px-2 py-0.5 rounded font-mono">{e}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <Separator />

      {/* ── PrimaryPageTemplate ── */}
      <section>
        <div className="flex items-center gap-2 mb-2">
          <h3 className="text-base font-semibold">PrimaryPageTemplate</h3>
          <PatternLabel label="list page" />
          <PatternLabel label="fixed header + scrolling content" />
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Use for all list/table pages (Slots, Student Schedule, My Students). Fixed header with sticky metrics + toolbar. Content area scrolls independently.
        </p>

        {/* Anatomy diagram */}
        <div className="rounded-xl border bg-muted/20 overflow-hidden mb-4">
          <div className="text-xs font-mono text-muted-foreground p-4 leading-6">
            <div className="border border-dashed border-muted-foreground/30 rounded p-3 mb-2">
              <div className="text-foreground font-medium mb-1">SiteHeader</div>
              <div className="text-muted-foreground/60">← breadcrumbs · search · Ask Leo button</div>
            </div>
            <div className="border border-dashed border-primary/30 rounded p-3 mb-2">
              <div className="text-primary font-medium mb-1">KeyMetricsShowcase (collapsible)</div>
              <div className="flex gap-2">
                {["Metric 1", "Metric 2", "Metric 3", "Metric 4"].map((m) => (
                  <div key={m} className="flex-1 border border-dashed border-primary/20 rounded px-2 py-1 text-center text-xs">{m}</div>
                ))}
              </div>
            </div>
            <div className="border border-dashed border-muted-foreground/30 rounded p-2 mb-2">
              <div className="text-muted-foreground/60">Search · FilterBar · TableProperties · HeaderActions</div>
            </div>
            <div className="border border-dashed border-muted-foreground/30 rounded p-2 mb-2">
              <div className="text-muted-foreground/60">Tabs: [Upcoming 45] [Ongoing 89] [Completed 113]</div>
            </div>
            <div className="border border-dashed border-muted-foreground/30 rounded p-3 bg-muted/30">
              <div className="text-muted-foreground/60 mb-2">↕ scrollable</div>
              <div className="text-muted-foreground/60">DataTable (columns, rows, pagination)</div>
            </div>
            <div className="mt-2 text-muted-foreground/60">↑ FloatingBulkBar (appears when rows selected)</div>
          </div>
        </div>

        <CodeBlock code={primaryPageCode} title="PrimaryPageTemplate usage" />
      </section>

      <Separator />

      {/* ── ReportPageTemplate ── */}
      <section>
        <div className="flex items-center gap-2 mb-2">
          <h3 className="text-base font-semibold">ReportPageTemplate</h3>
          <PatternLabel label="content/analytics page" />
          <PatternLabel label="full-page scroll" />
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Use for content-heavy pages (Reports, dashboards with charts). No top metrics row. Tabs use underline variant. Entire page scrolls.
        </p>

        {/* Anatomy diagram */}
        <div className="rounded-xl border bg-muted/20 overflow-hidden mb-4">
          <div className="text-xs font-mono text-muted-foreground p-4 leading-6">
            <div className="border border-dashed border-muted-foreground/30 rounded p-3 mb-2">
              <div className="text-foreground font-medium mb-1">SiteHeader</div>
              <div className="text-muted-foreground/60">← breadcrumbs · search · Ask Leo · headerActions (e.g. Export button)</div>
            </div>
            <div className="border border-dashed border-muted-foreground/30 rounded p-2 mb-2">
              <div className="text-muted-foreground/60">Tabs (underline variant): [Overview] [Trends] [Compliance] [Site Performance]</div>
            </div>
            <div className="border border-dashed border-muted-foreground/30 rounded p-3 bg-muted/30">
              <div className="text-muted-foreground/60 mb-2">↕ full-page scroll</div>
              <div className="text-muted-foreground/60">SectionWithHeader → ChartAreaInteractive</div>
              <div className="text-muted-foreground/60 mt-1">SectionWithHeader → DataTable or Cards grid</div>
              <div className="text-muted-foreground/60 mt-1">SectionWithHeader → InsightCard + AskLeoButton</div>
            </div>
          </div>
        </div>

        <CodeBlock code={reportPageCode} title="ReportPageTemplate usage" />
      </section>

      <Separator />

      {/* ── Detail Page ── */}
      <section>
        <div className="flex items-center gap-2 mb-2">
          <h3 className="text-base font-semibold">Detail Page</h3>
          <PatternLabel label="secondary page" />
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Custom layout for record detail views. Uses breadcrumb back navigation, hero section, and tabbed content. The parent nav item stays active in the sidebar.
        </p>
        <CodeBlock code={detailPageCode} title="Detail page structure" />
      </section>

      <Separator />

      {/* ── Supporting patterns ── */}
      <section>
        <h3 className="text-base font-semibold mb-6">Supporting Patterns</h3>
        <div className="flex flex-col gap-12">

          <div>
            <div className="flex items-center gap-2 mb-2">
              <h4 className="text-sm font-semibold">Form Pattern</h4>
              <PatternLabel label="React Hook Form + Zod" />
            </div>
            <p className="text-sm text-muted-foreground mb-3">
              Use for all data entry. Always use visible labels, controlled inputs, and FormMessage for errors. Date format: MM/DD/YYYY.
            </p>
            <CodeBlock code={formPatternCode} title="Form with validation" />
          </div>

          <div>
            <div className="flex items-center gap-2 mb-2">
              <h4 className="text-sm font-semibold">Empty State Pattern</h4>
            </div>
            <p className="text-sm text-muted-foreground mb-3">
              Show when a tab or section has no data. Centered icon + message + optional CTA. Never show an empty DataTable.
            </p>
            <CodeBlock code={emptyStateCode} title="Empty state" />
          </div>

        </div>
      </section>

      <Separator />

      {/* ── Rules ── */}
      <section>
        <h3 className="text-base font-semibold mb-4">Key Rules</h3>
        <div className="grid grid-cols-2 gap-4">
          {[
            {
              title: "Scroll behavior",
              items: [
                "List pages (Student Schedule, Slots): fixed header, scrolling DataTable",
                "Report/content pages: full-page scroll, no fixed header",
                "Detail pages: fixed detail header, scrolling body",
              ]
            },
            {
              title: "Navigation",
              items: [
                "Sidebar groups: Primary / Pipeline / Supporting",
                "Tabs = status filters (Requested, Approved, Completed)",
                "Detail views: parent sidebar item stays active",
              ]
            },
            {
              title: "Data display",
              items: [
                "Specialization: plain text — never a Badge",
                "Links: text-chart-1 — never non-theme colors",
                "Tables with 8+ columns: pin identifier left, actions right",
              ]
            },
            {
              title: "Dates & data",
              items: [
                "All dates: MM/DD/YYYY format",
                "Program context is implicit (never show discipline column)",
                "State: Zustand useAppStore for navigation, local state for UI",
              ]
            },
          ].map(({ title, items }) => (
            <div key={title} className="rounded-xl border p-4">
              <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">{title}</h4>
              <ul className="flex flex-col gap-2">
                {items.map((item, i) => (
                  <li key={i} className="text-xs text-foreground flex items-start gap-2">
                    <span className="text-primary mt-0.5 flex-shrink-0">·</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
}
