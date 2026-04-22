import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Progress } from "../ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { ChartAreaInteractive } from "../shared/chart-area-interactive";
import { SectionWithHeader } from "../shared/section-with-header";
import { PendingApprovalChartCard } from "../shared/pending-approval-chart-card";
import { PartnerSitePerformanceCard } from "../shared/partner-site-performance-card";
import { createSimpleMetricData } from "../shared/simple-metric";
import { createInsightCardData } from "../shared/insight-card";
import { ImageManager } from "../features/image-manager";
import { Download, FileText } from "lucide-react";
import { FontAwesomeIcon } from "../brand/font-awesome-icon";
import { AskLeoButton } from "../shared/ask-leo-button";
import { recentReports, quickStats } from "../../data/reports-data";
import { ReportPageTemplate, type ReportPageViewConfig } from "../shared/report-page-template";

const placementTrendData = [
  { month: "Jul", placements: 65 },
  { month: "Aug", placements: 82 },
  { month: "Sep", placements: 120 },
  { month: "Oct", placements: 95 },
  { month: "Nov", placements: 110 },
  { month: "Dec", placements: 78 },
];

const specializationData = [
  { name: "Internal Medicine", value: 87, color: "var(--chart-1)" },
  { name: "Emergency Medicine", value: 76, color: "var(--chart-2)" },
  { name: "Pediatrics", value: 65, color: "var(--chart-3)" },
  { name: "Surgery", value: 58, color: "var(--chart-4)" },
  { name: "Psychiatry", value: 43, color: "var(--chart-5)" },
];

const REPORT_TABS: ReportPageViewConfig[] = [
  { name: "Overview", id: "overview", icon: <FontAwesomeIcon name="activity" className="h-4 w-4" aria-hidden="true" />, description: "KPIs, trends, and activity overview" },
  { name: "Analytics", id: "analytics", icon: <FontAwesomeIcon name="chartBar" className="h-4 w-4" aria-hidden="true" />, description: "Placement analytics and data exploration" },
  { name: "Charts", id: "charts", icon: <FontAwesomeIcon name="chartLine" className="h-4 w-4" aria-hidden="true" />, description: "Interactive charts and visualizations" },
  { name: "Images", id: "images", icon: <FontAwesomeIcon name="images" className="h-4 w-4" aria-hidden="true" />, description: "Image management and assets" },
  { name: "Reports", id: "reports", icon: <FontAwesomeIcon name="fileText" className="h-4 w-4" aria-hidden="true" />, description: "Generate and schedule reports" },
];

/** Dashboard-style body: sections + cards like Home, not DataTable */
function OverviewTabContent() {
  const kpiMetrics = React.useMemo(
    () =>
      quickStats.map((stat) =>
        createSimpleMetricData(stat.label, stat.value, {
          trend: stat.change.startsWith("+") ? "up" : "down",
          trendValue: stat.change,
        })
      ),
    []
  );

  const kpiInsightCard = React.useMemo(
    () => ({
      ...createInsightCardData(
        "Placement Efficiency Improving",
        "Avg. placement time down 2 days and response time improved by 0.5 hrs. Student retention at 96.8% and partner satisfaction trending up. Consider expanding capacity to maintain momentum.",
        "trendingUp",
        "96.8% retention"
      ),
      onClick: () => {},
    }),
    []
  );

  return (
    <div className="flex flex-col gap-12 pt-6">
      <section className="px-4 lg:px-6" aria-labelledby="reports-kpi-title">
        <PartnerSitePerformanceCard
          id="reports-kpi"
          title="Key Performance Indicators"
          titleId="reports-kpi-title"
          description="Real-time metrics and trends"
          metrics={kpiMetrics}
          insightCard={kpiInsightCard}
        />
      </section>

      <SectionWithHeader
        title="Placement & Specialization Trends"
        description="Placement activity and most requested specialties"
      >
        <div className="grid md:grid-cols-2 gap-6">
          <PendingApprovalChartCard
            title="Placement Trends"
            description="Monthly placement activity"
            data={placementTrendData}
            chartType="area"
            dataKeyX="month"
            dataKeyY="placements"
            barColor="var(--chart-1)"
            askLeo={{
              chartTitle: "Placement Trends",
              chartDescription: "Monthly placement activity",
              chartData: "Jul: 65, Aug: 82, Sep: 120, Oct: 95, Nov: 110, Dec: 78",
            }}
          />
          <PendingApprovalChartCard
            title="Top Specializations"
            description="Most requested medical specialties"
            data={specializationData}
            chartType="donut"
            dataKeyX="name"
            dataKeyY="value"
            colorKey="color"
            showLegend
            askLeo={{
              chartTitle: "Top Specializations",
              chartDescription: "Most requested medical specialties",
              chartData: "Internal Medicine: 87, Emergency Medicine: 76, Pediatrics: 65, Surgery: 58, Psychiatry: 43",
            }}
          />
        </div>
      </SectionWithHeader>

      <SectionWithHeader
        title="Activity & System Status"
        description="Recent reports and system health"
      >
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Reports</CardTitle>
              <CardDescription>Latest generated reports and analytics</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {recentReports.map((report, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">{report.name}</p>
                    <p className="text-xs text-muted-foreground">{report.date} • {report.type}</p>
                  </div>
                  <Badge
                    variant={report.status === "Ready" ? "default" : report.status === "Processing" ? "secondary" : "outline"}
                  >
                    {report.status}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>System Health</CardTitle>
              <CardDescription>Current system performance metrics</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { label: "Database Performance", value: 98.2, color: "text-chart-2" as const },
                { label: "API Response Time", value: 85, color: "text-chart-2" as const, display: "142ms avg" },
                { label: "Storage Usage", value: 67, color: "text-chart-4" as const },
                { label: "User Satisfaction", value: 94, color: "text-chart-2" as const, display: "4.7/5" },
              ].map((item, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>{item.label}</span>
                    <span className={item.color}>{item.display ?? `${item.value}%`}</span>
                  </div>
                  <Progress value={item.value} className="h-2" />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </SectionWithHeader>
    </div>
  );
}

function AnalyticsTabContent() {
  return (
    <div className="flex flex-col gap-12 pt-6">
      <SectionWithHeader
        title="Placement Analytics"
        description="Placement activity and most requested specialties"
      >
        <div className="grid md:grid-cols-2 gap-6">
          <PendingApprovalChartCard
            title="Placement Trends"
            description="Student placement activity over time"
            data={placementTrendData}
            chartType="bar"
            dataKeyX="month"
            dataKeyY="placements"
            barColor="var(--chart-1)"
            askLeo={{
              chartTitle: "Placement Trends",
              chartDescription: "Student placement activity over time",
              chartData: "Jul: 65, Aug: 82, Sep: 120, Oct: 95, Nov: 110, Dec: 78",
            }}
          />
          <PendingApprovalChartCard
            title="Specialization Demand"
            description="Most requested medical specialties"
            data={specializationData}
            chartType="pie"
            dataKeyX="name"
            dataKeyY="value"
            colorKey="color"
            showLegend
            askLeo={{
              chartTitle: "Specialization Demand",
              chartDescription: "Most requested medical specialties",
              chartData: "Internal Medicine: 87, Emergency Medicine: 76, Pediatrics: 65, Surgery: 58, Psychiatry: 43",
            }}
          />
        </div>
      </SectionWithHeader>
    </div>
  );
}

function ChartsTabContent() {
  return (
    <div className="flex flex-col gap-12 pt-6">
      <SectionWithHeader
        title="Interactive Analytics Dashboard"
        description="Comprehensive data visualization with interactive charts and real-time updates"
      >
        <ChartAreaInteractive />
      </SectionWithHeader>
    </div>
  );
}

function ImagesTabContent() {
  return (
    <div className="flex flex-col gap-12 pt-6">
      <SectionWithHeader
        title="Image Management"
        description="Manage medical education images stored locally"
      >
        <Card>
          <CardContent className="pt-6">
            <ImageManager
              allowedCategories={["hero", "educational", "professional", "modern", "custom"]}
              maxFileSize={10 * 1024 * 1024}
              allowedFileTypes={["image/jpeg", "image/png", "image/webp", "image/gif"]}
            />
          </CardContent>
        </Card>
      </SectionWithHeader>
    </div>
  );
}

function ReportsTabContent() {
  return (
    <div className="flex flex-col gap-12 pt-6">
      <SectionWithHeader
        title="Report Generation & Scheduling"
        description="Create custom reports and manage automated schedules"
      >
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Generate New Report</CardTitle>
              <CardDescription>Create custom reports for different time periods and metrics</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="report-type" className="text-sm font-medium">Report Type</label>
                <Select defaultValue="placement">
                  <SelectTrigger id="report-type" aria-label="Report type">
                    <SelectValue placeholder="Select report type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="placement">Placement Analytics</SelectItem>
                    <SelectItem value="student">Student Performance</SelectItem>
                    <SelectItem value="partner">Partner Metrics</SelectItem>
                    <SelectItem value="financial">Financial Summary</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label htmlFor="report-period" className="text-sm font-medium">Time Period</label>
                <Select defaultValue="30d">
                  <SelectTrigger id="report-period" aria-label="Time period">
                    <SelectValue placeholder="Select time period" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30d">Last 30 Days</SelectItem>
                    <SelectItem value="quarter">Last Quarter</SelectItem>
                    <SelectItem value="6m">Last 6 Months</SelectItem>
                    <SelectItem value="year">Last Year</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button className="w-full">Generate Report</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Scheduled Reports</CardTitle>
              <CardDescription>Automatically generated reports and their schedules</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { name: "Weekly Summary", schedule: "Every Monday", next: "12/23/2024" },
                { name: "Monthly Analytics", schedule: "1st of Month", next: "01/01/2025" },
                { name: "Quarterly Review", schedule: "End of Quarter", next: "03/31/2025" },
              ].map((report, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                  <div>
                    <p className="text-sm font-medium">{report.name}</p>
                    <p className="text-xs text-muted-foreground">{report.schedule}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Next:</p>
                    <p className="text-sm font-medium">{report.next}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </SectionWithHeader>
    </div>
  );
}

export function ReportsPage() {
  const [activeTab, setActiveTab] = React.useState("overview");

  const views = REPORT_TABS;

  const renderTabContent = React.useCallback((tabId: string) => {
    switch (tabId) {
      case "overview":
        return <OverviewTabContent />;
      case "analytics":
        return <AnalyticsTabContent />;
      case "charts":
        return <ChartsTabContent />;
      case "images":
        return <ImagesTabContent />;
      case "reports":
        return <ReportsTabContent />;
      default:
        return null;
    }
  }, []);

  return (
    <ReportPageTemplate
      title="Reports & Analytics"
      description="Monitor performance, track metrics, and manage system resources"
      headerActions={
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" aria-hidden="true" />
            Export Data
          </Button>
          <Button size="sm">
            <FileText className="h-4 w-4 mr-2" aria-hidden="true" />
            Generate Report
          </Button>
        </div>
      }
      views={views}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      renderTabContent={renderTabContent}
      className="reports-page-container"
    />
  );
}
