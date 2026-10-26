"use client"

/**
 * Director Reports, variant B: preview what leaves the program. The same views as A on the left; on the right a preview of the
 * file before it is exported: the signed PDF's first lines (title, filters, signer, the figures) or the CSV's header and first
 * rows, with the row count. Export, under the preview, opens the DS ExportDrawer. Course sits in Filters (list budget). Tests whether seeing the file first builds trust in what is shared.
 */
import * as React from "react"
import { Card, CardContent } from "@exxatdesignux/ui/components/ui/card"
import { LocalBanner } from "@exxatdesignux/ui/components/ui/banner"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@exxatdesignux/ui/components/ui/table"
import { ViewSegmentedControl } from "@exxatdesignux/ui/components/ui/view-segmented-control"
import { DEMO_TODAY } from "@/lib/v2/seed-core"
import { DirectorPage } from "@/components/lab/director/frame"
import { ExcludedLine, ExportControls, ReportTable, ViewSwitch, VIEW_OPTIONS, viewRows } from "@/components/lab/director/reports"
import { csvColumns, DIRECTOR_NAME, isReportView, plural, reportModel, shortDate, type Readiness, type ReportModel, type ReportView } from "@/lib/lab/director"
import { SCOPE_LABEL, type LabScope, type ScopeKey } from "@/lib/lab/scope"

function filtersLine(m: Readiness, chip: (k: ScopeKey, v: string) => string): string {
  const keys: ScopeKey[] = ["cohort", "group", "course", "cat", "tag", "loc", "setting"]
  const applied = keys.filter((k) => !!m.scope[k]).map((k) => `${SCOPE_LABEL[k]} ${chip(k, m.scope[k] ?? "")}`)
  return [`Term ${m.population.term.name}`, ...applied].join(", ")
}

const FILE_OPTIONS = [
  { value: "pdf" as const, label: "PDF, signed" },
  { value: "csv" as const, label: "CSV" },
]

function Preview({ m, r, view, chip }: { m: Readiness; r: ReportModel; view: ReportView; chip: (k: ScopeKey, v: string) => string }) {
  const viewLabel = VIEW_OPTIONS.find((o) => o.value === view)!.label.toLowerCase()
  const [file, setFile] = React.useState<"pdf" | "csv">("pdf")
  return (
    <Card className="py-0 xl:sticky xl:top-4 xl:col-span-4" data-region="preview">
      <CardContent className="flex flex-col gap-3 py-4">
        {/* Which file to preview is one choice (a segmented control, not two tabs); Export comes after the preview, so the
            reader sees the file first and acts last (serial position). */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-base font-semibold text-foreground">What leaves the program</h2>
          <ViewSegmentedControl value={file} onValueChange={setFile} options={FILE_OPTIONS} aria-label="File to preview" />
        </div>
        {file === "pdf" ? (
          <div>
            <div className="flex flex-col gap-2 rounded-md border border-border p-3 text-sm">
              <span className="font-semibold text-foreground">{`Graduation readiness, ${viewLabel}`}</span>
              <span className="text-xs text-muted-foreground">{filtersLine(m, chip)}</span>
              <span className="tabular-nums text-foreground">{`${m.stage.complete} of ${m.rows.length} complete. ${viewRows(view, r)} rows, as on screen.`}</span>
              <span className="border-t border-border pt-2 text-xs text-muted-foreground">{`Signed ${DIRECTOR_NAME}, ${shortDate(DEMO_TODAY)}`}</span>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <span className="text-xs text-muted-foreground">{`${plural(r.csvRows, "row", "rows")}, one per evaluation`}</span>
            <div className="overflow-x-auto rounded-md border border-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    {csvColumns().map((c) => <TableHead key={c} className="whitespace-nowrap">{c}</TableHead>)}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {r.csvSample.map((x, i) => (
                    <TableRow key={i}>
                      {[x.student, x.skill, x.date, x.outcome, x.evaluator, x.setting, x.location, x.feedback || "None recorded"].map((v, j) => (
                        <TableCell key={j} className="whitespace-nowrap text-muted-foreground">{v}</TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3">
          <ExcludedLine />
          <ExportControls view={view} r={r} />
        </div>
      </CardContent>
    </Card>
  )
}

export function DirectorReportsB() {
  return (
    <DirectorPage title="Reports" variant="B" pageType="list" courseInFilters announce={(m) => `Report of ${m.rows.length} students`}>
      {({ model: m, scope, param, setParams, demo, chip }) => {
        const raw = param("view")
        const view: ReportView = isReportView(raw) ? raw : "student"
        return <Body m={m} scope={scope} view={view} chip={chip} onView={(v) => setParams({ view: v })} error={demo === "error"} retry={() => setParams({ state: null })} />
      }}
    </DirectorPage>
  )
}

function Body({ m, scope, view, chip, onView, error, retry }: { m: Readiness; scope: LabScope; view: ReportView; chip: (k: ScopeKey, v: string) => string; onView: (v: ReportView) => void; error: boolean; retry: () => void }) {
  const r = React.useMemo(() => reportModel(m), [m])
  return (
    <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-12">
      {/* Two panes: the report (its view switch belongs to the table it switches) and the file preview. */}
      <div className="flex min-w-0 flex-col gap-3 xl:col-span-8" data-region="report">
        <div>
          <ViewSwitch view={view} onChange={onView} />
        </div>
        {error ? (
          <LocalBanner variant="warning" title="The report could not load" retry={{ label: "Try again", onClick: retry }}>
            The filters are kept.
          </LocalBanner>
        ) : (
          <div>
            <ReportTable view={view} r={r} scope={scope} variant="B" />
          </div>
        )}
      </div>
      <Preview m={m} r={r} view={view} chip={chip} />
    </div>
  )
}
