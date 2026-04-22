"use client"

/**
 * Compliance list page — `ListPageTemplate` + `ComplianceTable`; view types from `@/components/data-views`.
 */

import * as React from "react"
import {
  ListPageTemplate,
  type ViewTab,
  dataListViewIcon,
  type DataListViewType,
} from "@/components/data-views"
import { CompliancePageHeader } from "@/components/compliance-page-header"
import { ComplianceTable, type ComplianceTableHandle } from "@/components/compliance-table"
import { KeyMetrics } from "@/components/key-metrics"
import { useAskLeoPageContext } from "@/components/ask-leo-sidebar"
import { COMPLIANCE_ITEMS } from "@/lib/mock/compliance"
import { complianceKpiInsight, complianceKpiMetrics } from "@/lib/mock/compliance-kpi"

const DEFAULT_TABS: ViewTab[] = [
  {
    id: "obligations",
    label: "Obligations",
    viewType: "table",
    icon: "fa-table",
    filterId: "all",
  },
]

export function ComplianceClient() {
  const [exportOpen, setExportOpen] = React.useState(false)
  const [showMetrics, setShowMetrics] = React.useState(true)
  const tableRef = React.useRef<ComplianceTableHandle>(null)
  const count = COMPLIANCE_ITEMS.length

  const metrics = React.useMemo(() => complianceKpiMetrics(COMPLIANCE_ITEMS), [])
  const insight = React.useMemo(() => complianceKpiInsight(COMPLIANCE_ITEMS), [])

  useAskLeoPageContext(
    React.useMemo(
      () => ({
        title: "Compliance",
        description: `${count} obligations tracked on this hub.`,
        suggestions: [
          "What’s due this week?",
          "Summarize open items by student",
        ],
      }),
      [count],
    ),
  )

  return (
    <ListPageTemplate
      defaultTabs={DEFAULT_TABS}
      getTabCount={() => count}
      tablePropertiesRef={tableRef}
      header={
        <CompliancePageHeader
          itemCount={count}
          onAddReview={() => {}}
          onExport={() => setExportOpen(true)}
          showMetrics={showMetrics}
          onToggleMetrics={() => setShowMetrics(v => !v)}
        />
      }
      metrics={
        <KeyMetrics
          variant="flat"
          metrics={metrics}
          insight={insight}
          showHeader={false}
          metricsSingleRow
        />
      }
      showMetrics={showMetrics}
      exportOpen={exportOpen}
      onExportOpenChange={setExportOpen}
      exportTotalRows={count}
      renderContent={(tab, updateTab) => (
        <ComplianceTable
          key={tab.id}
          ref={tableRef}
          items={COMPLIANCE_ITEMS}
          view={tab.viewType}
          onViewChange={(v: DataListViewType) => updateTab({ viewType: v, icon: dataListViewIcon(v) })}
        />
      )}
    />
  )
}
