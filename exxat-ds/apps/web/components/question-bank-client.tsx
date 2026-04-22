"use client"

/**
 * Question bank hub — ListPageTemplate + KeyMetrics + QuestionBankTable (Team / Compliance pattern).
 */

import * as React from "react"
import {
  ListPageTemplate,
  type ViewTab,
  dataListViewIcon,
  type DataListViewType,
} from "@/components/data-views"
import { QuestionBankPageHeader } from "@/components/question-bank-page-header"
import { QuestionBankTable, type QuestionBankTableHandle } from "@/components/question-bank-table"
import { KeyMetrics } from "@/components/key-metrics"
import { QUESTION_BANK_ITEMS } from "@/lib/mock/question-bank"
import { questionBankKpiInsight, questionBankKpiMetrics } from "@/lib/mock/question-bank-kpi"

const DEFAULT_TABS: ViewTab[] = [
  {
    id: "questions",
    label: "Questions",
    viewType: "table",
    icon: "fa-table",
    filterId: "all",
  },
]

export function QuestionBankClient() {
  const [exportOpen, setExportOpen] = React.useState(false)
  const [showMetrics, setShowMetrics] = React.useState(true)
  const tableRef = React.useRef<QuestionBankTableHandle>(null)
  const count = QUESTION_BANK_ITEMS.length

  const metrics = React.useMemo(() => questionBankKpiMetrics(QUESTION_BANK_ITEMS), [])
  const insight = React.useMemo(() => questionBankKpiInsight(QUESTION_BANK_ITEMS), [])

  return (
    <ListPageTemplate
      defaultTabs={DEFAULT_TABS}
      getTabCount={() => count}
      tablePropertiesRef={tableRef}
      header={(
        <QuestionBankPageHeader
          questionCount={count}
          onNewQuestion={() => {}}
          onExport={() => setExportOpen(true)}
          showMetrics={showMetrics}
          onToggleMetrics={() => setShowMetrics(v => !v)}
        />
      )}
      metrics={(
        <KeyMetrics
          variant="flat"
          metrics={metrics}
          insight={insight}
          showHeader={false}
          metricsSingleRow
        />
      )}
      showMetrics={showMetrics}
      exportOpen={exportOpen}
      onExportOpenChange={setExportOpen}
      exportTotalRows={count}
      renderContent={(tab, updateTab) => (
        <QuestionBankTable
          key={tab.id}
          ref={tableRef}
          items={QUESTION_BANK_ITEMS}
          view={tab.viewType}
          onViewChange={(v: DataListViewType) => updateTab({ viewType: v, icon: dataListViewIcon(v) })}
        />
      )}
    />
  )
}
