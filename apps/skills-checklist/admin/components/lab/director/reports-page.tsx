"use client"

/**
 * Director Reports (D-L8c, Romit 2026-10-30 "yes, merge them"): the Reports nav row opens one page with two tabs.
 * - Attainment (default, no `tab` param): the admin Attainment pieces read-only with the director permission set
 *   (components/lab/rbac/director-attainment.tsx): readiness line, then students by section (A) or skills ranked (B), with Pace.
 * - Readiness (`tab=readiness`): one row per student with the four engine states and Attainment, plus By skill, By section and
 *   By tag views [REQ RP-02, RP-03, RP-04], the signed PDF and the evaluation-level CSV export, and the signer line [REQ RP-10].
 *   Variant A is one table with the Export menu in its toolbar; variant B previews the file beside the table before export.
 * One shared Filters control (the director frame's scope bar) sits under the tabs, so applied chips carry across tabs: the scope
 * lives in the URL and switching a tab only writes `tab`. The former `/lab/director/reports` URL redirects to the Readiness tab.
 */
import { TYPE } from "@/components/lab/type-scale"
import * as React from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent } from "@exxatdesignux/ui/components/ui/card"
import { LocalBanner } from "@exxatdesignux/ui/components/ui/banner"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@exxatdesignux/ui/components/ui/table"
import { ViewSegmentedControl } from "@exxatdesignux/ui/components/ui/view-segmented-control"
import { DEMO_TODAY } from "@/lib/v2/seed-core"
import { DirectorPage } from "@/components/lab/director/frame"
import type { DirectorContext } from "@/components/lab/director/use-director"
import { ExcludedLine, ExportControls, ReportTable, ViewSwitch, VIEW_OPTIONS, viewRows } from "@/components/lab/director/reports"
import { AttainmentBody, AttainmentSetControl, attainmentExportItems, type DirectorView } from "@/components/lab/rbac/director-attainment"
import { csvColumns, DIRECTOR_NAME, isReportView, isReportsTab, plural, reportModel, REPORTS_TAB_LABEL, REPORTS_TABS, shortDate, type Readiness, type ReportModel, type ReportView, type ReportsTab } from "@/lib/lab/director"
import { SCOPE_LABEL, type ScopeKey } from "@/lib/lab/scope"
import { useAttainmentUrl } from "@/components/lab/admin-b/use-att-url"
import { useSnapshot } from "@/components/lab/dashboard/use-dashboard"
import { useRequiredSet } from "@/components/lab/admin-b/required-set-switch"
import { EvidencePeek } from "@/components/lab/admin-b/evidence-peek"
import { buildAttainment, peekRecords } from "@/lib/lab/attainment"
import type { V2State } from "@/lib/v2/types"

type Ctx = DirectorContext & { model: Readiness }

type ReportsVariant = "A" | "B"

export function DirectorReportsPage({ variant }: { variant: ReportsVariant }) {
  const params = useSearchParams()
  const raw = params?.get("tab")
  const tab: ReportsTab = isReportsTab(raw) ? raw : "attainment"
  const [exportOpen, setExportOpen] = React.useState(false)
  // Attainment A reads students by section (the matrix), B ranks skills; both show Pace (the behind marker) on the matrix or table.
  const attView: DirectorView = variant === "A" ? "matrix" : "skills"
  const attainment = tab === "attainment"
  const router = useRouter()
  const pathname = usePathname() ?? ""
  // Only `tab` changes; the scope, the variant and every chip stay in the URL. The Attainment peek closes on the way out.
  const setTab = React.useCallback(
    (v: string) => {
      const q = new URLSearchParams(params?.toString() ?? "")
      if (v === "attainment") q.delete("tab")
      else q.set("tab", v)
      q.delete("peek")
      const s = q.toString()
      router.replace(s ? `${pathname}?${s}` : pathname, { scroll: false })
    },
    [params, pathname, router],
  )
  return (
    <DirectorPage
      title="Reports"
      variant={`reports-${variant}`}
      pageType="list"
      courseInFilters
      actionItems={attainment ? attainmentExportItems(() => setExportOpen(true)) : undefined}
      announce={(m) => (attainment ? `${plural(m.rows.length, "student", "students")} in scope` : `Report of ${plural(m.rows.length, "student", "students")}`)}
      toolbar={attainment ? (ctx) => <AttainmentSetControl ctx={ctx} view={attView} /> : (ctx) => <ReadinessToolbar ctx={ctx} />}
      // Export sits in the header on both tabs (design review 2026-10-30, others #6): the Attainment tab's header action, and on
      // Readiness the Export menu that names what the signed PDF and the CSV carry [REQ RP-10].
      headerAction={attainment ? undefined : (ctx) => <ReadinessExport ctx={ctx} />}
      tabs={{
        value: tab,
        ariaLabel: "Reports",
        items: REPORTS_TABS.map((t) => ({ value: t, label: REPORTS_TAB_LABEL[t] })),
        onChange: setTab,
      }}
    >
      {(ctx) =>
        attainment ? (
          <AttainmentBody ctx={ctx} view={attView} exportOpen={exportOpen} setExportOpen={setExportOpen} />
        ) : variant === "A" ? (
          <ReadinessA ctx={ctx} />
        ) : (
          <ReadinessB ctx={ctx} />
        )
      }
    </DirectorPage>
  )
}

function useReadiness(ctx: Ctx) {
  const raw = ctx.param("view")
  const view: ReportView = isReportView(raw) ? raw : "student"
  const r = React.useMemo(() => reportModel(ctx.model), [ctx.model])
  return { view, r, error: ctx.demo === "error", retry: () => ctx.setParams({ state: null }) }
}

/**
 * RP-06 on the Readiness tab: a count opens the evidence behind it in place, in the same evidence peek the Attainment tab uses
 * (admin-b EvidencePeek on the attainment model of this scope and required set), so the director never leaves the report to find
 * it. The peek lives in the URL (`peek`), so Back closes it and a pasted link reopens it.
 */
function useReadinessPeek(ctx: Ctx) {
  const url = useAttainmentUrl("students")
  const snap = useSnapshot()
  const state = snap.state as V2State | null
  const reqSet = useRequiredSet(state, ctx.scope, url.param, url.hrefWith)
  const model = React.useMemo(() => (state ? buildAttainment(state, ctx.scope, undefined, { basis: reqSet.basis }) : null), [state, ctx.scope, reqSet.basis])
  const peek = React.useMemo(() => (model && state && url.peek ? peekRecords(model, state, url.peek) : null), [model, state, url.peek])
  const node = model && state ? <EvidencePeek peek={peek} data={state} evidence={model.pop.evidenceState} scope={ctx.scope} onClose={url.closePeek} /> : null
  return { peekHref: url.peekHref, node }
}

const LoadError = ({ retry }: { retry: () => void }) => (
  <LocalBanner variant="warning" title="The report could not load" retry={{ label: "Try again", onClick: retry }}>
    The filters are kept.
  </LocalBanner>
)

/** The Readiness tab's toolbar: the view switch, before the shared Filters (the frame puts them on one row). */
function ReadinessToolbar({ ctx }: { ctx: DirectorContext }) {
  const raw = ctx.param("view")
  const view: ReportView = isReportView(raw) ? raw : "student"
  return <ViewSwitch view={view} onChange={(v) => ctx.setParams({ view: v })} />
}

/** The Readiness tab's Export menu, in the page header (both variants). */
function ReadinessExport({ ctx }: { ctx: Ctx }) {
  const raw = ctx.param("view")
  const view: ReportView = isReportView(raw) ? raw : "student"
  const r = React.useMemo(() => reportModel(ctx.model), [ctx.model])
  return <ExportControls view={view} r={r} />
}

/** Readiness A: one table, four views; the Export menu names what the signed PDF and the CSV carry and opens the ExportDrawer. */
function ReadinessA({ ctx }: { ctx: Ctx }) {
  const { view, r, error, retry } = useReadiness(ctx)
  const peek = useReadinessPeek(ctx)
  return (
    <div className="flex flex-col gap-3" data-readiness="A">
      {error ? <LoadError retry={retry} /> : (
        <div data-region="table">
          <ReportTable view={view} r={r} scope={ctx.scope} variant="A" peek={peek.peekHref} />
        </div>
      )}
      {peek.node}
    </div>
  )
}

function filtersLine(m: Readiness, chip: (k: ScopeKey, v: string) => string): string {
  const keys: ScopeKey[] = ["cohort", "group", "course", "cat", "tag", "loc", "setting"]
  const applied = keys.filter((k) => !!m.scope[k]).map((k) => `${SCOPE_LABEL[k]} ${chip(k, m.scope[k] ?? "")}`)
  return [`Term ${m.population.term.name}`, ...applied].join(", ")
}

const FILE_OPTIONS = [
  { value: "pdf" as const, label: "PDF, signed" },
  { value: "csv" as const, label: "CSV" },
]

/** Readiness B's file preview: the signed PDF's first lines or the CSV's header and first rows. Export is the header's menu. */
function Preview({ m, r, view, chip }: { m: Readiness; r: ReportModel; view: ReportView; chip: (k: ScopeKey, v: string) => string }) {
  const viewLabel = VIEW_OPTIONS.find((o) => o.value === view)!.label.toLowerCase()
  const [file, setFile] = React.useState<"pdf" | "csv">("pdf")
  return (
    <Card className="py-0 xl:sticky xl:top-4" data-region="preview">
      <CardContent className="flex flex-col gap-3 py-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className={TYPE.card}>What leaves the program</h2>
          <ViewSegmentedControl value={file} onValueChange={setFile} options={FILE_OPTIONS} aria-label="File to preview" />
        </div>
        {file === "pdf" ? (
          <div className="flex flex-col gap-2 rounded-md border border-border p-3 text-sm">
            <span className="font-semibold text-foreground">{`Graduation readiness, ${viewLabel}`}</span>
            <span className="text-xs text-muted-foreground">{filtersLine(m, chip)}</span>
            <span className="tabular-nums text-foreground">{`${m.stage.complete} of ${m.rows.length} complete. ${viewRows(view, r)} rows, as on screen.`}</span>
            <span className="border-t border-border pt-2 text-xs text-muted-foreground">{`Signed ${DIRECTOR_NAME}, ${shortDate(DEMO_TODAY)}`}</span>
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
        <div className="border-t border-border pt-3">
          <ExcludedLine />
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Readiness B: the report and, beside it, a preview of the file before it is exported. The preview has a fixed width so the
 * report keeps all four engine-state columns and Attainment in view at 1440 (no sideways scroll).
 */
function ReadinessB({ ctx }: { ctx: Ctx }) {
  const { view, r, error, retry } = useReadiness(ctx)
  const peek = useReadinessPeek(ctx)
  // The student view fits beside the preview from 1280. The skill, section and tag views carry more columns (Section, the course
  // level, Skills), so below 1536 the preview sits above the table instead of squeezing it: no column is cut (anatomy A10).
  const wide = view !== "student"
  const grid = wide ? "2xl:grid-cols-[minmax(0,1fr)_24rem]" : "xl:grid-cols-[minmax(0,1fr)_20rem] 2xl:grid-cols-[minmax(0,1fr)_24rem]"
  return (
    <div className={`grid grid-cols-1 items-start gap-4 ${grid}`} data-readiness="B">
      <div className={`flex min-w-0 flex-col gap-3 ${wide ? "order-last 2xl:order-none" : ""}`} data-region="report">
        {error ? <LoadError retry={retry} /> : <ReportTable view={view} r={r} scope={ctx.scope} variant="B" peek={peek.peekHref} />}
      </div>
      <Preview m={ctx.model} r={r} view={view} chip={ctx.chip} />
      {peek.node}
    </div>
  )
}
