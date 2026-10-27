"use client"

/**
 * Export, variant B: a dedicated page with a preview of the file and a list of exports made this session.
 *
 * Variant A exports from a side panel over Attainment, so the scope is fixed to what is on screen. B is the page an admin
 * opens on purpose (for example the end of term): scope is set here with the same scope bar, the file is previewed before it
 * is made (its header lines and its first rows), and each export made is listed so it can be made again with the same
 * filters. Contents follow REQ RP-10 (LEDGER D-X13): the row-per-evaluation detail carries feedback, settings, locations,
 * self-evaluations and review notes and records the filters that produced it; the signed PDF is the aggregate summary.
 * CSV versus Excel is OD-10, open: both are offered and flagged. A repeating export is a seam only (Proposed, not built).
 *
 * Regions (list budget 4): header · scope bar · export card with file preview · exports this session.
 */
import * as React from "react"
import { Badge } from "@exxatdesignux/ui/components/ui/badge"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@exxatdesignux/ui/components/ui/card"
import { LocalBanner } from "@exxatdesignux/ui/components/ui/banner"
import { SelectionTileGrid } from "@exxatdesignux/ui/components/ui/selection-tile-grid"
import { Skeleton } from "@exxatdesignux/ui/components/ui/skeleton"
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@exxatdesignux/ui/components/ui/table"
import { Tip } from "@exxatdesignux/ui/components/ui/tip"
import { ViewSegmentedControl } from "@exxatdesignux/ui/components/ui/view-segmented-control"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@exxatdesignux/ui/components/ui/collapsible"
import { EmptyBlock } from "@/components/lab/empty-block"
import { SampleDataBadge } from "@/components/lab/import/sample-badge"
import { fmt } from "@/lib/v2/format"
import { PageFrame } from "@/components/skills/page-header"
import { ScopeBar, ScopeContext } from "@/components/lab/dashboard/scope-bar"
import { ImpossibleScopeBanner } from "@/components/lab/dashboard/impossible-scope"
import { asOfLabel, useDashboardUrl, useSnapshot } from "@/components/lab/dashboard/use-dashboard"
import { BASIS_LABEL, chipValue, explainScope, parseDemoState, resolveTerm, scopeOptions } from "@/lib/lab/dashboard"
import { buildAttainment, detailColumns, detailRows, exportFormats, FORMAT_DECISION_PENDING, isAttView, scopeLines, summaryRows, toCsv, type AttView, type DetailRow, type ExportFormat } from "@/lib/lab/attainment"
import { basisOf, type ScopeKey } from "@/lib/lab/scope"
import { capitalize, skillNoun, skillNounPlural } from "@/lib/lab/terms"

const PREVIEW_ROWS = 5
// A getter for the program's noun, so it follows Settings > Naming.
const VIEW_WORD: Record<AttView, string> = { students: "Students", get skills() { return capitalize(skillNounPlural()) }, sections: "Sections", tags: "Tags" }

interface Made { id: number; file: string; format: string; rows: number; lines: string[]; at: string }

const cellsOf = (r: DetailRow): string[] => [r.student, r.cohort, r.group, r.skill, r.section, r.date, r.evaluator, r.setting, r.location, r.outcome, r.status, r.feedback, r.selfRating, r.selfNote, r.review, r.reviewNote]

export function AdminExportB() {
  const url = useDashboardUrl()
  const snap = useSnapshot()
  const demo = parseDemoState(url.param("state"))
  const viewRaw = url.param("tab")
  const view: AttView = isAttView(viewRaw) ? viewRaw : "students"
  const [format, setFormat] = React.useState<ExportFormat>("csv")
  const [made, setMade] = React.useState<Made[]>([])
  const [outOpen, setOutOpen] = React.useState(false)
  const formats = React.useMemo(() => exportFormats(), [])
  const model = React.useMemo(() => (snap.state ? buildAttainment(snap.state, url.scope) : null), [snap.state, url.scope])
  const rows = React.useMemo(() => (model && snap.state ? detailRows(model, snap.state) : []), [model, snap.state])

  if (!model || !snap.state || demo === "loading") {
    return (
      <PageFrame title="Export">
        <div role="status" aria-busy="true" aria-label="Loading export" className="flex flex-col gap-4">
          <span className="sr-only">Loading export</span>
          <Skeleton aria-hidden="true" className="h-8 w-[36rem]" />
          <Skeleton aria-hidden="true" className="h-96 w-full" />
        </div>
      </PageFrame>
    )
  }
  const state = snap.state
  const term = resolveTerm(state, url.scope)
  const label = (k: ScopeKey, v: string) => chipValue(state, k, v)
  const lines = scopeLines(url.scope, term.name, BASIS_LABEL[basisOf(url.scope)], asOfLabel(snap.at), label)
  const def = formats.find((f) => f.id === format)!
  const isPdf = format === "pdf"
  const count = isPdf ? summaryRows(model, view) : rows.length
  const unit = isPdf ? `${count === 1 ? "row" : "rows"} in the ${VIEW_WORD[view]} summary` : `${count === 1 ? "row" : "rows"}, one per evaluation`
  const stem = `attainment-${term.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${isPdf ? view : "evaluations"}`
  const file = `${stem}.${format}`
  const header = isPdf ? [`${VIEW_WORD[view]} summary`, ...lines] : [...lines, `Rows (one per evaluation): ${fmt(rows.length)}`]
  const empty = demo === "empty" || count === 0
  // RP-09: a scope that cannot produce evidence is explained, not offered as a "0 rows" file.
  const impossible = explainScope(state, url.scope)

  const run = () => {
    if (format === "csv") {
      try {
        const blob = new Blob([toCsv(rows, lines)], { type: "text/csv;charset=utf-8" })
        const a = document.createElement("a")
        a.href = URL.createObjectURL(blob)
        a.download = file
        a.click()
        URL.revokeObjectURL(a.href)
      } catch {
        /* download blocked: the list below still names the file */
      }
    }
    setMade((m) => [{ id: Date.now(), file, format: def.label, rows: count, lines, at: asOfLabel(new Date()) }, ...m])
  }
  const repeat = (x: Made) => setMade((m) => [{ ...x, id: Date.now(), at: asOfLabel(new Date()) }, ...m])

  return (
    <PageFrame title="Export" subtitle={<ScopeContext termName={term.name} scope={url.scope} at={snap.at} />} actions={<SampleDataBadge />}>
      <div className="flex flex-col gap-4" data-export-lab="B" data-page-type="list" data-export-format={format} data-export-rows={count}>
        <ScopeBar scope={url.scope} options={scopeOptions(state, url.scope)} termName={term.name} onChange={url.setScope} chipValue={label} />
        {demo === "error" ? (
          <LocalBanner variant="error" title="The export could not be prepared" retry={{ label: "Try again", onClick: () => url.setParams({ state: null }) }}>The scope is kept. Nothing was exported.</LocalBanner>
        ) : impossible ? (
          <ImpossibleScopeBanner state={state} scope={url.scope} onChange={url.setScope} />
        ) : (
          <div className="grid items-start gap-4 xl:grid-cols-[26rem_minmax(0,1fr)]" data-region="export">
            <Card size="sm">
              <CardHeader><CardTitle className="text-base">What to export</CardTitle></CardHeader>
              <CardContent className="flex flex-col gap-5">
                <SelectionTileGrid sectionLabel="Format" options={formats.map((f) => ({ value: f.id, label: f.label, icon: f.icon }))} columns={3} value={format} onValueChange={setFormat} interaction="radio" idPrefix="export-b" itemVariant="outline" />
                {!isPdf ? (
                  <p className="-mt-3 flex items-center gap-2 text-xs text-muted-foreground" data-od10-seam>
                    <Tip label={FORMAT_DECISION_PENDING}><Badge variant="outline" tabIndex={0}>Decision pending</Badge></Tip>
                    CSV or Excel
                  </p>
                ) : (
                  <div className="flex flex-col gap-1.5">
                    <span className="text-sm font-medium text-foreground">Summary of</span>
                    <ViewSegmentedControl<AttView> aria-label="Summary view" value={view} onValueChange={(v) => url.setParams({ tab: v === "students" ? null : v })} options={(["students", "skills", "sections", "tags"] as AttView[]).map((v) => ({ value: v, label: v === "skills" ? capitalize(skillNounPlural()) : VIEW_WORD[v] }))} />
                  </div>
                )}
                {/* What the file contains is on the surface; what it leaves out is one click away (strategy/07 K5, prose budget). */}
                <section aria-labelledby="exp-b-has" className="flex flex-col gap-2">
                  <h3 id="exp-b-has" className="text-sm font-semibold text-foreground">Contains</h3>
                  <ul className="flex flex-col gap-1.5 text-sm text-foreground">{def.contains.map((c) => <li key={c} className="flex items-start gap-2"><i className="fa-light fa-check mt-1 text-xs text-muted-foreground" aria-hidden="true" />{c}</li>)}</ul>
                </section>
                {def.excludes.length > 0 ? (
                  <Collapsible open={outOpen} onOpenChange={setOutOpen} className="-mt-2 flex flex-col gap-2">
                    <CollapsibleTrigger asChild>
                      <Button type="button" variant="ghost" size="sm" className="self-start" aria-expanded={outOpen}>
                        <i className={`fa-light ${outOpen ? "fa-chevron-down" : "fa-chevron-right"}`} aria-hidden="true" />
                        {`What it leaves out (${def.excludes.length})`}
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <ul className="flex flex-col gap-1.5 text-sm text-foreground" aria-label="Leaves out">{def.excludes.map((c) => <li key={c} className="flex items-start gap-2"><i className="fa-light fa-minus mt-1 text-xs text-muted-foreground" aria-hidden="true" />{c}</li>)}</ul>
                    </CollapsibleContent>
                  </Collapsible>
                ) : null}
                <div className="flex flex-wrap items-center gap-3 border-t border-border pt-4">
                  <Button type="button" variant="default" size="default" disabled={empty} aria-describedby="exp-b-count" onClick={run}>{`Export ${def.label}`}</Button>
                  <span id="exp-b-count" className="text-sm tabular-nums text-muted-foreground">{`${fmt(count)} ${unit}`}</span>
                </div>
              </CardContent>
            </Card>
            <Card size="sm" className="min-w-0">
              <CardHeader><CardTitle className="text-base">{`Preview of ${file}`}</CardTitle></CardHeader>
              <CardContent className="flex min-w-0 flex-col gap-3">
                {/* The literal first lines of the file (data, like the preview rows below), so they are data labels, not page prose. */}
                <ul className="flex flex-col gap-0.5 rounded-md bg-muted/50 px-3 py-2 font-mono text-xs text-foreground" aria-label="File header: the filters that produced it" data-export-header data-viz-label>
                  {header.map((l) => <li key={l}>{l}</li>)}
                </ul>
                {empty ? (
                  <EmptyBlock compact title="Nothing to export in this scope" body="Widen the scope to include students." />
                ) : isPdf ? (
                  <SummaryPreview model={model} view={view} />
                ) : (
                  <Table containerClassName="rounded-md border border-border" scrollLabel="First rows of the file">
                    <TableCaption className="sr-only">{`First ${PREVIEW_ROWS} of ${fmt(rows.length)} rows`}</TableCaption>
                    <TableHeader><TableRow>{detailColumns().map((c) => <TableHead key={c} scope="col" className="whitespace-nowrap">{c}</TableHead>)}</TableRow></TableHeader>
                    <TableBody>
                      {rows.slice(0, PREVIEW_ROWS).map((r, i) => (
                        <TableRow key={`${r.student}-${r.skill}-${r.date}-${i}`}>{cellsOf(r).map((c, j) => <TableCell key={j} className="max-w-56 truncate whitespace-nowrap text-sm" title={c}>{c || <span className="text-muted-foreground">Blank</span>}</TableCell>)}</TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>
        )}
        <section aria-labelledby="exp-b-made" className="flex flex-col gap-2" data-region="history">
          <div className="flex flex-wrap items-center gap-2">
            <h2 id="exp-b-made" className="text-base font-semibold text-foreground">Exports this session</h2>
            <Tip label="A repeating export (for example every Monday) is a proposal, not built. Each export here can be made again with the same filters.">
              <Badge variant="outline" tabIndex={0}>Repeating exports: proposed</Badge>
            </Tip>
          </div>
          {made.length === 0 ? (
            <p className="text-sm text-muted-foreground">No exports yet.</p>
          ) : (
            <Table containerClassName="rounded-md border border-border" scrollLabel="Exports this session">
              <TableHeader>
                <TableRow>
                  <TableHead scope="col">File</TableHead>
                  <TableHead scope="col">Format</TableHead>
                  <TableHead scope="col" className="text-end">Rows</TableHead>
                  <TableHead scope="col">Filters</TableHead>
                  <TableHead scope="col">Made</TableHead>
                  <TableHead scope="col"><span className="sr-only">Actions</span></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {made.map((x) => (
                  <TableRow key={x.id}>
                    <TableCell className="font-mono text-xs">{x.file}</TableCell>
                    <TableCell>{x.format}</TableCell>
                    <TableCell className="text-end tabular-nums">{fmt(x.rows)}</TableCell>
                    <TableCell className="max-w-96 whitespace-normal text-xs text-muted-foreground">{x.lines.join(". ")}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{x.at}</TableCell>
                    <TableCell><Button type="button" variant="ghost" size="sm" onClick={() => repeat(x)} aria-label={`Make ${x.file} again`}>Make again</Button></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </section>
      </div>
    </PageFrame>
  )
}

function SummaryPreview({ model, view }: { model: ReturnType<typeof buildAttainment>; view: AttView }) {
  const head = view === "students" ? "Student" : view === "skills" ? capitalize(skillNoun()) : view === "sections" ? "Section" : "Tag"
  const rows: Array<{ k: string; name: string; achieved: number; total: number }> =
    view === "students" ? model.students.map((s) => ({ k: s.id, name: s.name, achieved: s.counts.achieved, total: s.total }))
      : view === "skills" ? model.skills.map((s) => ({ k: s.skillId, name: s.name, achieved: s.counts.achieved, total: s.total }))
        : (view === "sections" ? model.sectionRows : model.tagRows).map((g) => ({ k: g.key, name: g.label, achieved: g.counts.achieved, total: g.total }))
  return (
    <Table containerClassName="rounded-md border border-border" scrollLabel="First rows of the summary">
      <TableCaption className="sr-only">{`First ${PREVIEW_ROWS} of ${rows.length} rows`}</TableCaption>
      <TableHeader><TableRow><TableHead scope="col">{head}</TableHead><TableHead scope="col" className="text-end">Achieved</TableHead><TableHead scope="col" className="text-end">Required records</TableHead></TableRow></TableHeader>
      <TableBody>{rows.slice(0, PREVIEW_ROWS).map((r) => <TableRow key={r.k}><TableCell>{r.name}</TableCell><TableCell className="text-end tabular-nums">{fmt(r.achieved)}</TableCell><TableCell className="text-end tabular-nums">{fmt(r.total)}</TableCell></TableRow>)}</TableBody>
    </Table>
  )
}
