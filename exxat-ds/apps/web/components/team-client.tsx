"use client"

/**
 * Team page — primary list template: ListPageTemplate + KeyMetrics + TeamTable (same composition as DataListClient).
 * Imports from `@/components/data-views` for shared list-page + view types.
 */

import * as React from "react"
import {
  ListPageTemplate,
  type ViewTab,
  dataListViewIcon,
  type DataListViewType,
} from "@/components/data-views"
import { TeamPageHeader } from "@/components/team-page-header"
import { TeamTable, type TeamTableHandle } from "@/components/team-table"
import { KeyMetrics } from "@/components/key-metrics"
import { useAskLeoPageContext } from "@/components/ask-leo-sidebar"
import { TEAM_MEMBERS } from "@/lib/mock/team"
import { teamKpiInsight, teamKpiMetrics } from "@/lib/mock/team-kpi"

const DEFAULT_TEAM_TABS: ViewTab[] = [
  {
    id: "members",
    label: "Members",
    viewType: "table",
    icon: "fa-table",
    filterId: "all",
  },
]

export function TeamClient() {
  const [exportOpen, setExportOpen] = React.useState(false)
  const [showMetrics, setShowMetrics] = React.useState(true)
  const tableRef = React.useRef<TeamTableHandle>(null)
  const memberCount = TEAM_MEMBERS.length

  const metrics = React.useMemo(() => teamKpiMetrics(TEAM_MEMBERS), [])
  const insight = React.useMemo(() => teamKpiInsight(TEAM_MEMBERS), [])

  useAskLeoPageContext(
    React.useMemo(
      () => ({
        title: "Team",
        description: `${memberCount} members in this directory.`,
        suggestions: [
          "Who owns the most active placements?",
          "Summarize workload by program",
        ],
      }),
      [memberCount],
    ),
  )

  return (
    <ListPageTemplate
      defaultTabs={DEFAULT_TEAM_TABS}
      getTabCount={() => memberCount}
      tablePropertiesRef={tableRef}
      header={
        <TeamPageHeader
          memberCount={memberCount}
          onInvite={() => {}}
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
      exportTotalRows={memberCount}
      renderContent={(tab, updateTab) => (
        <TeamTable
          key={tab.id}
          ref={tableRef}
          members={TEAM_MEMBERS}
          view={tab.viewType}
          onViewChange={(v: DataListViewType) => updateTab({ viewType: v, icon: dataListViewIcon(v) })}
        />
      )}
    />
  )
}
