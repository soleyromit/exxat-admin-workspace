"use client"

/**
 * Director Reports, variant A: one table, three views. The shared scope bar sets the filters [REQ RP-01]; a view switch shows the
 * same population by student, by skill or by section [REQ RP-02, RP-03]; one Export menu names what the signed PDF and the
 * evaluation-level CSV carry and what neither holds [REQ RP-10], and opens the DS ExportDrawer. Course sits in Filters (list budget).
 */
import * as React from "react"
import { LocalBanner } from "@exxatdesignux/ui/components/ui/banner"
import { DirectorPage } from "@/components/lab/director/frame"
import { ExportControls, ReportTable, ViewSwitch } from "@/components/lab/director/reports"
import { isReportView, reportModel, type ReportView } from "@/lib/lab/director"

export function DirectorReportsA() {
  return (
    <DirectorPage title="Reports" variant="A" pageType="list" courseInFilters announce={(m) => `Report of ${m.rows.length} students`}>
      {({ model: m, scope, param, setParams, demo }) => {
        const raw = param("view")
        const view: ReportView = isReportView(raw) ? raw : "student"
        return <Body m={m} scope={scope} view={view} onView={(v) => setParams({ view: v })} error={demo === "error"} retry={() => setParams({ state: null })} />
      }}
    </DirectorPage>
  )
}

function Body({ m, scope, view, onView, error, retry }: { m: Parameters<typeof reportModel>[0]; scope: Parameters<typeof ReportTable>[0]["scope"]; view: ReportView; onView: (v: ReportView) => void; error: boolean; retry: () => void }) {
  const r = React.useMemo(() => reportModel(m), [m])
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2" data-region="toolbar">
        <ViewSwitch view={view} onChange={onView} />
        <ExportControls view={view} r={r} />
      </div>
      {error ? (
        <LocalBanner variant="warning" title="The report could not load" retry={{ label: "Try again", onClick: retry }}>
          The filters are kept.
        </LocalBanner>
      ) : (
        <div data-region="table">
          <ReportTable view={view} r={r} scope={scope} variant="A" />
        </div>
      )}
    </div>
  )
}
