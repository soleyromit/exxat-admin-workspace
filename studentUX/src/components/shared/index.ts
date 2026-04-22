/**
 * Shared — Reusable UI building blocks used across multiple pages.
 */

// Cards
export { ActionCard, createActionCardData, type ActionCardData, type ActionCardProps } from "./action-card"
export { SectionCard, type SectionCardProps } from "./section-card"
export { InsightCard, createInsightCardData, type InsightCardData, type InsightCardProps, type InsightCardVariant } from "./insight-card"
export { MetricCard, createMetricCardData, type MetricCardData, type MetricCardProps } from "./metric-card"
export { InternshipCard, type InternshipCardProps, type InternshipOption } from "./internship-card"
export { PartnerSitePerformanceCard, type PartnerSitePerformanceCardProps } from "./partner-site-performance-card"
export { PendingApprovalChartCard, type PendingApprovalChartCardProps, type ChartDataItem, type ChartType } from "./pending-approval-chart-card"
export { KeyMetricsShowcase, type KeyMetricsShowcaseProps } from "./key-metrics-showcase"
export { SectionWithHeader, type SectionWithHeaderProps, type SectionWithHeaderVariant } from "./section-with-header"
export { AlertsSection, type AlertsSectionProps, type AlertItem } from "./alerts-section"
export { MapSection, type MapSectionProps, type MapLocation, type MapAlert, type SearchFieldConfig } from "./map-section"
export { AddressMap, type AddressMapProps } from "./address-map"
export { ScheduleBanners, type ScheduleBannerType } from "./schedule-banners"
export { SimpleMetric, createSimpleMetricData, type SimpleMetricData, type SimpleMetricProps, type SimpleMetricVariant } from "./simple-metric"

// Table infrastructure
export { DataTable, autoSuggestColumnPinning, type ColumnConfig, type DataTableProps, type FreezeDirection, type SortDirection, type SortConfig, type GroupConfig } from "./data-table"
export { Pagination, type PaginationInfo } from "./pagination"
export { TableProperties, type TableDisplayConfig } from "./table-properties"
export {
  FilterClauseEditor,
  FilterClause,
  FilterClauseConnector,
  ScrollableContainer,
  ScrollableOptionList,
  FILTER_LAYOUT,
  type FilterClauseEditorProps,
  type FilterClauseProps,
  type FilterClauseConnectorProps,
} from "./filter-clause"
export { ViewManager, type ViewSettings } from "./view-manager"
export {
  default as FilterBar,
  type FilterConfig,
  type ActiveFilter,
  FILTER_SEARCH_THRESHOLD,
} from "./filter-bar"
export { FloatingActionBar, BulkActionBar, defaultBulkActions, slotsBulkActions, getPipelineActionsForStage, type BulkAction } from "./floating-action-bar"

// Page template
export { PrimaryPageTemplate, type ViewConfig, type PrimaryPageMetricsConfig, type PrimaryPageFilterConfig, type PrimaryPageTablePropertiesConfig, type PrimaryPageBulkAction, type PrimaryPageTemplateProps } from "./primary-page-template"
export { ReportPageTemplate, type ReportPageViewConfig, type ReportPageTemplateProps } from "./report-page-template"
export {
  WelcomePageTemplate,
  type WelcomePageTemplateProps,
  type WelcomePageBackgroundVariant,
  type WelcomePageHeaderVariant,
} from "./welcome-page-template"
export {
  BuildProfilePageTemplate,
  type BuildProfilePageTemplateProps,
} from "./build-profile-page-template"
export { ProfileEditDialog, type ProfileEditDialogProps } from "./profile-edit-dialog"
export { JobSearchBar, type JobSearchBarProps } from "./job-search-bar"

// Visualizations
export { ChartAreaInteractive } from "./chart-area-interactive"
export { CalendarView } from "./calendar-view"
export { PipelineStepper } from "./pipeline-stepper"

// Leo AI
export { AskLeoButton } from "./ask-leo-button"