import * as React from "react";
import { Separator } from "../../ui/separator";
import { MetricCard } from "../../shared/metric-card";
import { SectionWithHeader } from "../../shared/section-with-header";
import { AskLeoButton } from "../../shared/ask-leo-button";
import { registry } from "../../../design-system/registry";
import { Badge } from "../../ui/badge";
import { Button } from "../../ui/button";
import { FontAwesomeIcon } from "../../brand/font-awesome-icon";
import { ChartAreaInteractive } from "../../shared/chart-area-interactive";
import { Pagination, type PaginationInfo } from "../../shared/pagination";
import { SimpleMetric } from "../../shared/simple-metric";
import { PipelineStepper } from "../../shared/pipeline-stepper";
import { BulkActionBar, defaultBulkActions } from "../../shared/floating-action-bar";
import { InsightCard } from "../../shared/insight-card";
import { KeyMetricsShowcase } from "../../shared/key-metrics-showcase";
import { SectionCard } from "../../shared/section-card";
import { ActionCard } from "../../shared/action-card";
import FilterBar, { type FilterConfig, type ActiveFilter } from "../../shared/filter-bar";
import { CalendarDays, Users as LucideUsers } from "lucide-react";

// ─── Helpers ──────────────────────────────────────────────────────────────

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

function CompositeSection({
  id,
  title,
  description,
  children,
}: {
  id: string;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  const entry = registry.find((c) => c.id === id);
  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <h3 className="text-base font-semibold">{title}</h3>
            <Badge variant="outline" className="text-xs">composite</Badge>
          </div>
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </div>
        {entry && (
          <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded font-mono flex-shrink-0">
            {entry.importPath}
          </span>
        )}
      </div>

      <div className="rounded-xl border bg-card p-6">
        {children}
      </div>

      {entry?.examples[0] && (
        <div className="rounded-xl border bg-muted/30">
          <div className="flex items-center justify-between px-4 py-2 border-b">
            <span className="text-xs text-muted-foreground">{entry.examples[0].title}</span>
            <CopyButton text={entry.examples[0].code} />
          </div>
          <pre className="text-xs p-4 overflow-x-auto text-muted-foreground leading-5 whitespace-pre-wrap">
            <code>{entry.examples[0].code}</code>
          </pre>
        </div>
      )}

      {entry && entry.props.length > 0 && (
        <div className="rounded-xl border overflow-hidden">
          <div className="px-4 py-2 border-b bg-muted/30">
            <span className="text-xs font-medium text-muted-foreground">Props</span>
          </div>
          <div className="divide-y">
            {entry.props.slice(0, 6).map((p) => (
              <div key={p.name} className="flex gap-4 px-4 py-2.5 text-xs">
                <span className="font-mono font-medium text-foreground w-40 flex-shrink-0">{p.name}{p.required ? "" : "?"}</span>
                <span className="font-mono text-muted-foreground w-48 flex-shrink-0">{p.type}</span>
                <span className="text-muted-foreground">{p.description}</span>
              </div>
            ))}
            {entry.props.length > 6 && (
              <div className="px-4 py-2 text-xs text-muted-foreground">
                +{entry.props.length - 6} more props — see {entry.filePath}
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

// ─── PipelineStepper icon wrappers ───────────────────────────────────────────
const PipelineClockIcon = ({ className }: { className?: string }) => <FontAwesomeIcon name="clock" className={className} />;
const PipelineEyeIcon = ({ className }: { className?: string }) => <FontAwesomeIcon name="eye" className={className} />;
const PipelineCheckIcon = ({ className }: { className?: string }) => <FontAwesomeIcon name="check" className={className} />;
const PipelineUserCheckIcon = ({ className }: { className?: string }) => <FontAwesomeIcon name="userCheck" className={className} />;
const PipelineXIcon = ({ className }: { className?: string }) => <FontAwesomeIcon name="circleXmark" className={className} />;

const pipelineSteps = [
  { stage: "Requested", count: 12, status: "completed" as const, icon: PipelineClockIcon, color: "text-chart-2", bgColor: "bg-chart-2/10", description: "Initial submission" },
  { stage: "Under Review", count: 8, status: "active" as const, icon: PipelineEyeIcon, color: "text-chart-1", bgColor: "bg-chart-1/10", description: "Coordinator review" },
  { stage: "Approved", count: 45, status: "active" as const, icon: PipelineCheckIcon, color: "text-muted-foreground", bgColor: "bg-muted", description: "Pending confirmation" },
  { stage: "Confirmed", count: 38, status: "active" as const, icon: PipelineUserCheckIcon, color: "text-muted-foreground", bgColor: "bg-muted", description: "Students assigned" },
  { stage: "Rejected", count: 3, status: "rejected" as const, icon: PipelineXIcon, color: "text-destructive", bgColor: "bg-destructive/10", description: "Not approved" },
];

// ─── Sample metric data ────────────────────────────────────────────────────

const sampleMetrics = [
  { title: "Active Placements", value: "247", change: "+12%", trend: "up" as const, description: "vs last semester" },
  { title: "Starting This Week", value: "12", change: "+3", trend: "up" as const },
  { title: "Compliance Rate", value: "94%", change: "+2%", trend: "up" as const },
  { title: "Pending Reviews", value: "23", change: "-5", trend: "down" as const },
];

// ─── Sample filter config (for FilterBar demo) ───────────────────────────────
const demoFilterConfigs: FilterConfig[] = [
  { key: "status", label: "Status", icon: "circleCheck", options: ["Active", "Pending", "Approved", "Rejected", "Completed"] },
  { key: "program", label: "Program", icon: "bookOpen", options: ["Program A", "Program B", "Program C"] },
  { key: "site", label: "Site", icon: "building", options: ["Site Alpha", "Site Beta", "Site Gamma", "Site Delta"] },
];

// ─── Main ─────────────────────────────────────────────────────────────────

export function CompositesTab() {
  const [currentPage, setCurrentPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(10);
  const [activeStage, setActiveStage] = React.useState("Under Review");
  const [bulkSelected, setBulkSelected] = React.useState<string[]>([]);
  const [filterActiveFilters, setFilterActiveFilters] = React.useState<ActiveFilter[]>([]);
  const [filterMetricPeriod, setFilterMetricPeriod] = React.useState("this-semester");

  const handleAddFilter = (filterKey: string) => {
    const config = demoFilterConfigs.find(c => c.key === filterKey);
    if (!config) return;
    setFilterActiveFilters(prev => [...prev, { id: `${filterKey}-${Date.now()}`, key: filterKey, label: config.label, values: [], removable: true }]);
  };
  const handleToggleFilterValue = (filterId: string, value: string) => {
    setFilterActiveFilters(prev => prev.map(f => f.id !== filterId ? f : { ...f, values: f.values.includes(value) ? f.values.filter(v => v !== value) : [...f.values, value] }));
  };
  const handleRemoveFilter = (filterId: string) => {
    setFilterActiveFilters(prev => prev.filter(f => f.id !== filterId));
  };

  const paginationInfo: PaginationInfo = React.useMemo(() => ({
    currentPage,
    totalPages: 25,
    pageSize,
    totalItems: 247,
    startItem: (currentPage - 1) * pageSize + 1,
    endItem: Math.min(currentPage * pageSize, 247),
  }), [currentPage, pageSize]);

  return (
    <div className="flex flex-col gap-12 px-4 lg:px-6 py-8 max-w-7xl mx-auto w-full">

      <div>
        <h2 className="text-lg font-semibold mb-1">Composite Components</h2>
        <p className="text-sm text-muted-foreground">
          Pre-built business components assembled from UI primitives. Always prefer these over
          building custom equivalents. Each one embeds consistent accessibility, spacing, and interaction patterns.
        </p>
      </div>

      {/* ── Metrics ── */}
      <section>
        <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground mb-6">Metrics</h2>
        <div className="flex flex-col gap-12">

          <CompositeSection
            id="metric-card"
            title="MetricCard"
            description="Single KPI card with value, trend direction, and optional icon. Used inside KeyMetricsShowcase or standalone in compact page headers."
          >
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {sampleMetrics.map((m, i) => (
                <MetricCard key={i} data={m} />
              ))}
            </div>
          </CompositeSection>

          <CompositeSection
            id="key-metrics-showcase"
            title="KeyMetricsShowcase"
            description="Full-width metric grid with gradient background. The standard header for all list and dashboard pages."
          >
            <KeyMetricsShowcase
              title="Placement Overview"
              description="Summary of placement activity across all programs this semester"
              metrics={[
                { label: "Total Placements", value: "247", trend: "up", trendValue: "+12%", showArrow: true },
                { label: "Pending Review", value: "23", trend: "down", trendValue: "-5", showArrow: true },
                { label: "Compliance Rate", value: "94%", trend: "up", trendValue: "+2%", showArrow: true },
                { label: "Starting This Week", value: "12", trend: "up", trendValue: "+3", showArrow: true },
              ]}
              insightCard={{
                title: "Placement Rate Up 12%",
                description: "Earlier site outreach in week 2 drove a 12% increase in confirmed placements vs last semester.",
                icon: "trendingUp",
                metric: "+12%",
              }}
              filter={{
                value: filterMetricPeriod,
                onValueChange: setFilterMetricPeriod,
                options: [
                  { value: "this-semester", label: "This Semester" },
                  { value: "last-semester", label: "Last Semester" },
                  { value: "this-year", label: "This Year" },
                ],
                placeholder: "Select period",
              }}
            />
          </CompositeSection>

        </div>
      </section>

      <Separator />

      {/* ── Layout composites ── */}
      <section>
        <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground mb-6">Layout</h2>
        <div className="flex flex-col gap-12">

          <CompositeSection
            id="section-with-header"
            title="SectionWithHeader"
            description="Section wrapper with title, description, and optional right-side filter slot. The standard way to wrap distinct content areas within a page."
          >
            <SectionWithHeader
              title="Placement Pipeline"
              description="Track placement status across all active students"
              filter={
                <Button variant="outline" size="sm">
                  <FontAwesomeIcon name="filter" className="h-3.5 w-3.5" aria-hidden="true" />
                  Last 90 days
                </Button>
              }
            >
              <div className="h-24 rounded-lg border-2 border-dashed border-muted-foreground/20 flex items-center justify-center">
                <span className="text-sm text-muted-foreground">Content goes here (chart, table, etc.)</span>
              </div>
            </SectionWithHeader>
          </CompositeSection>

          <CompositeSection
            id="ask-leo-button"
            title="AskLeoButton"
            description="Opens the Leo AI panel with a pre-filled context query. Place at the end of data sections to let users ask questions about visible data."
          >
            <div className="flex flex-col gap-3">
              <AskLeoButton
                chartTitle="Placement Trends"
                chartDescription="Active placements and trend analysis over the semester"
              />
              <AskLeoButton
                chartTitle="Compliance Status"
                chartDescription="Students requiring immediate attention based on current compliance scores"
              />
              <AskLeoButton />
            </div>
          </CompositeSection>

        </div>
      </section>

      <Separator />

      {/* ── Data components ── */}
      <section>
        <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground mb-6">Data Display</h2>
        <div className="flex flex-col gap-12">

          <CompositeSection
            id="data-table"
            title="DataTable"
            description="The primary data display pattern. Includes drag-and-drop column reordering, pinning, resizing, sorting, multi-select with bulk actions, and pagination. Use inside PrimaryPageTemplate."
          >
            <div className="rounded-lg border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/40 border-b">
                  <tr>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground w-8">
                      <div className="h-3.5 w-3.5 rounded border-2 border-muted-foreground/40" />
                    </th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Student Name</th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Program</th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Site</th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Start Date</th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {[
                    { name: "Emma Wilson", program: "Physical Therapy", site: "Mayo Clinic", date: "03/15/2024", status: "Active" },
                    { name: "John Smith", program: "Nursing", site: "Johns Hopkins", date: "04/01/2024", status: "Pending" },
                    { name: "Sarah Kim", program: "OT", site: "Boston Children's", date: "05/10/2024", status: "Active" },
                  ].map((row, i) => (
                    <tr key={i} className="hover:bg-muted/30 cursor-pointer">
                      <td className="px-4 py-2.5">
                        <div className="h-3.5 w-3.5 rounded border-2 border-muted-foreground/40" />
                      </td>
                      <td className="px-4 py-2.5 font-medium text-chart-1">{row.name}</td>
                      <td className="px-4 py-2.5 text-muted-foreground">{row.program}</td>
                      <td className="px-4 py-2.5 text-muted-foreground">{row.site}</td>
                      <td className="px-4 py-2.5 text-muted-foreground">{row.date}</td>
                      <td className="px-4 py-2.5">
                        <Badge variant={row.status === "Active" ? "default" : "secondary"} className="text-xs">
                          {row.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="flex items-center justify-between px-4 py-2.5 border-t bg-muted/20 text-xs text-muted-foreground">
                <span>Showing 3 of 247 results</span>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" disabled>Previous</Button>
                  <span>Page 1 of 10</span>
                  <Button variant="outline" size="sm">Next</Button>
                </div>
              </div>
            </div>
          </CompositeSection>

          <CompositeSection
            id="filter-bar"
            title="FilterBar"
            description="Dynamic filter chip UI. Applied filters appear as removable chips. 'Add Filter' dropdown shows available filters. Use above DataTable."
          >
            <FilterBar
              filterConfigs={demoFilterConfigs}
              activeFilters={filterActiveFilters}
              onAddFilter={handleAddFilter}
              onToggleFilterValue={handleToggleFilterValue}
              onRemoveFilter={handleRemoveFilter}
              onClearAll={() => setFilterActiveFilters([])}
            />
          </CompositeSection>

          <CompositeSection
            id="insight-card"
            title="InsightCard"
            description="AI-generated insight card with animated glow entry, icon, title, metric, and Ask Leo action. Place below KeyMetricsShowcase or at section ends."
          >
            <div className="flex flex-col gap-4">
              <InsightCard
                data={{
                  title: "Placement Rate Up 12%",
                  description: "Placement confirmations are 12% higher than last semester. Primary driver: earlier site outreach in week 2.",
                  icon: "trendingUp",
                  metric: "+12%",
                }}
              />
              <InsightCard
                data={{
                  title: "3 Expiring Credentials",
                  description: "Students have credentials expiring in the next 7 days. Send a reminder to prevent placement holds.",
                  icon: "alertTriangle",
                }}
                variant="compact"
              />
            </div>
          </CompositeSection>

          <CompositeSection
            id="action-card"
            title="ActionCard"
            description="Bordered card for quick actions. Uses a Lucide icon, title, description, and arrow. Accepts backgroundColor, textColor, and iconColor."
          >
            <div className="grid grid-cols-2 gap-4">
              <ActionCard
                data={{
                  title: "No placements scheduled",
                  description: "Request a slot to start placing students this rotation.",
                  icon: CalendarDays,
                  backgroundColor: "bg-muted",
                }}
                onClick={() => {}}
              />
              <ActionCard
                data={{
                  title: "No students assigned",
                  description: "Add students to this rotation to begin tracking their progress.",
                  icon: LucideUsers,
                  backgroundColor: "bg-chart-2/10",
                  iconColor: "text-chart-2",
                }}
                onClick={() => {}}
              />
            </div>
          </CompositeSection>

          <CompositeSection
            id="section-card"
            title="SectionCard"
            description="Card with a rounded icon box, title, and content. Used for content sections in detail pages (notes, attachments, credentials)."
          >
            <div className="grid grid-cols-2 gap-4">
              <SectionCard
                title="Notes & Comments"
                icon={<FontAwesomeIcon name="messageSquare" className="h-5 w-5" />}
                iconBg="bg-chart-1/10"
                iconColor="text-chart-1"
              >
                <p className="text-sm text-muted-foreground">No notes added yet. Add a comment to document important context.</p>
              </SectionCard>
              <SectionCard
                title="Documents"
                icon={<FontAwesomeIcon name="fileText" className="h-5 w-5" />}
                iconBg="bg-muted"
                iconColor="text-muted-foreground"
              >
                <p className="text-sm text-muted-foreground">No documents attached. Upload required paperwork here.</p>
              </SectionCard>
            </div>
          </CompositeSection>

        </div>
      </section>

      <Separator />

      {/* ── Charts ── */}
      <section>
        <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground mb-6">Charts</h2>
        <div className="flex flex-col gap-12">

          <CompositeSection
            id="chart-area-interactive"
            title="ChartAreaInteractive"
            description="Recharts area chart with Leo AI integration. Self-contained with built-in mock data — drop in directly. Use for time-series trend analysis on list and report pages."
          >
            <ChartAreaInteractive />
          </CompositeSection>

        </div>
      </section>

      <Separator />

      {/* ── Status & Pipeline ── */}
      <section>
        <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground mb-6">Status & Pipeline</h2>
        <div className="flex flex-col gap-12">

          <CompositeSection
            id="simple-metric"
            title="SimpleMetric"
            description="Borderless KPI with optional trend arrow. Use in compact headers, detail page hero sections, and sidebar summaries."
          >
            <div className="grid grid-cols-4 gap-6 px-2 py-2">
              <SimpleMetric data={{ label: "Total Records", value: "247", trend: "up", trendValue: "+12%", showArrow: true }} />
              <SimpleMetric data={{ label: "Pending Review", value: "23", trend: "down", trendValue: "-5", showArrow: true }} />
              <SimpleMetric data={{ label: "Completion Rate", value: "94%", trend: "up", trendValue: "+2%", showArrow: true }} />
              <SimpleMetric data={{ label: "Overdue", value: "7", trend: "neutral", showArrow: false }} />
            </div>
          </CompositeSection>

          <CompositeSection
            id="pipeline-stepper"
            title="PipelineStepper"
            description="Multi-stage workflow tracker with item counts and click-to-filter. Use at the top of pipeline list pages."
          >
            <PipelineStepper
              steps={pipelineSteps}
              activeStage={activeStage}
              onStageClick={setActiveStage}
            />
          </CompositeSection>

        </div>
      </section>

      <Separator />

      {/* ── Pagination & Bulk Actions ── */}
      <section>
        <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground mb-6">Pagination & Bulk Actions</h2>
        <div className="flex flex-col gap-12">

          <CompositeSection
            id="pagination"
            title="Pagination"
            description="Table footer with page navigation and page size selector. Place directly below DataTable."
          >
            <Pagination
              paginationInfo={paginationInfo}
              onPageChange={setCurrentPage}
              onPageSizeChange={(size) => { setPageSize(size); setCurrentPage(1); }}
              showPageSize
            />
          </CompositeSection>

          <CompositeSection
            id="bulk-action-bar"
            title="BulkActionBar"
            description="Fixed floating bar that appears when rows are selected in a DataTable. Renders at the bottom of the viewport."
          >
            <div className="flex flex-col gap-3">
              <p className="text-xs text-muted-foreground">Appears fixed at the bottom of the viewport when items are selected:</p>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setBulkSelected(["item-1", "item-2", "item-3"])}
                  disabled={bulkSelected.length > 0}
                >
                  Simulate 3 selections
                </Button>
                {bulkSelected.length > 0 && (
                  <Button size="sm" variant="ghost" onClick={() => setBulkSelected([])}>
                    Clear
                  </Button>
                )}
              </div>
              <BulkActionBar
                selectedCount={bulkSelected.length}
                selectedItems={bulkSelected}
                actions={defaultBulkActions}
                onClearSelection={() => setBulkSelected([])}
                onBulkAction={() => setBulkSelected([])}
              />
            </div>
          </CompositeSection>

        </div>
      </section>

    </div>
  );
}
