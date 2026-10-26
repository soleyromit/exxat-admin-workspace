"use client"

/**
 * Export what is on screen (REQ RP-10; strategy/06 section 3.7; AUDIT T1: v2 exported a signed PDF only, no row per evaluation).
 *
 * The DS ExportDrawer is the pattern, but its props are only open, onOpenChange, totalRows and visibleColumns, and its body is
 * fixed (CSV / Excel / PDF tiles, a date range, all or visible columns, apply filters). It cannot say what each format holds
 * or leaves out, and a date range would let the export drift from the scope on screen. So this panel is composed from the
 * same DS parts ExportDrawer is built from: FloatingSheetPanel, SelectionTileGrid, FloatingSheetPanelWorkflowFooter.
 *
 * - Scope is not editable here: the export is exactly the page's scope, basis, view and as-of, listed at the top (RP-10
 *   "record the filters that produced it").
 * - Formats: signed PDF (summary of the view) and CSV or Excel (one row per evaluation). OD-10 (CSV versus Excel) is open, so
 *   both are offered.
 * - Each format states what it contains and leaves out. The row-per-evaluation detail carries feedback, settings, locations,
 *   self-evaluations and review notes, as REQ RP-10 says (LEDGER D-X13; the v2 D36 proposal to leave self-ratings out is
 *   overruled). The signed PDF stays the aggregate summary. CSV versus Excel (OD-10) is flagged as a pending decision.
 * - The prototype writes a real CSV file; PDF and Excel confirm in place.
 */
import { capitalize, skillNounPlural } from "@/lib/lab/terms"
import * as React from "react"
import { Badge } from "@exxatdesignux/ui/components/ui/badge"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@exxatdesignux/ui/components/ui/collapsible"
import { LocalBanner } from "@exxatdesignux/ui/components/ui/banner"
import { Tip } from "@exxatdesignux/ui/components/ui/tip"
import { SelectionTileGrid } from "@exxatdesignux/ui/components/ui/selection-tile-grid"
import { FloatingSheetPanel, FloatingSheetPanelBody, FloatingSheetPanelContent, FloatingSheetPanelHeader, FloatingSheetPanelToolbar, FloatingSheetPanelWorkflowFooter } from "@exxatdesignux/ui/components/ui/floating-sheet-panel"
import { detailRows, exportFormats, FORMAT_DECISION_PENDING, summaryRows, toCsv, type AttainmentModel, type AttView, type ExportFormat } from "@/lib/lab/attainment"
import type { V2State } from "@/lib/v2/types"
import { fmt } from "@/lib/v2/format"

// A getter for the program's noun, so it follows Settings > Naming.
const VIEW_WORD: Record<AttView, string> = { students: "Students", get skills() { return capitalize(skillNounPlural()) }, sections: "Sections", tags: "Tags" }

export function ExportPanel({ open, onOpenChange, model, data, view, scopeLines, fileStem }: { open: boolean; onOpenChange: (o: boolean) => void; model: AttainmentModel; data: V2State; view: AttView; scopeLines: string[]; fileStem: string }) {
  const formats = React.useMemo(() => exportFormats(), [])
  const [format, setFormat] = React.useState<ExportFormat>("csv")
  const [done, setDone] = React.useState<string | null>(null)
  const rows = React.useMemo(() => (open ? detailRows(model, data) : []), [open, model, data])
  const def = formats.find((f) => f.id === format)!
  const count = format === "pdf" ? summaryRows(model, view) : rows.length
  const unit = format === "pdf" ? `${count === 1 ? "row" : "rows"}, the ${VIEW_WORD[view]} view` : `${count === 1 ? "row" : "rows"}, one per evaluation`
  const ext = format === "xlsx" ? "xlsx" : format
  const fileName = `${fileStem}.${ext}`

  React.useEffect(() => setDone(null), [format, open])

  const run = () => {
    if (format === "csv") {
      try {
        const blob = new Blob([toCsv(rows, scopeLines)], { type: "text/csv;charset=utf-8" })
        const a = document.createElement("a")
        a.href = URL.createObjectURL(blob)
        a.download = fileName
        a.click()
        URL.revokeObjectURL(a.href)
      } catch {
        /* download blocked: the confirmation still names the file */
      }
    }
    setDone(`${fileName}, ${fmt(count)} ${unit}.`)
  }

  return (
    // Modal: exporting is a task in front of the page, not an inspector beside it. The page stays visible as the context of
    // what is exported but is inert while the panel is open (strategy/07 split view or panel budget).
    <FloatingSheetPanel open={open} onOpenChange={onOpenChange} modal>
      <FloatingSheetPanelContent contentSlot="lab-attainment-export" size="md" aria-modal="true">
        <FloatingSheetPanelToolbar showSize={false} />
        <FloatingSheetPanelHeader title="Export" subtitle={`${fmt(count)} ${unit}`} />
        <FloatingSheetPanelBody className="flex flex-col gap-5 px-4 pb-4" data-export-format={format} data-export-rows={count}>
          {done ? <LocalBanner variant="success" title="Export ready">{done}</LocalBanner> : null}
          <section aria-labelledby="export-scope" className="flex flex-col gap-1.5">
            <h3 id="export-scope" className="text-sm font-semibold text-foreground">What is on screen</h3>
            {/* The applied filters, as the file records them: data, not prose. */}
            <ul className="flex flex-wrap gap-x-3 gap-y-1 text-sm text-muted-foreground" data-export-scope data-viz-label>
              {[`${VIEW_WORD[view]} view`, ...scopeLines].map((l) => <li key={l}>{l}</li>)}
            </ul>
          </section>
          <SelectionTileGrid sectionLabel="Format" options={formats.map((f) => ({ value: f.id, label: f.label, icon: f.icon }))} columns={3} value={format} onValueChange={setFormat} interaction="radio" idPrefix="att-export" itemVariant="outline" />
          {format !== "pdf" ? (
            <p className="-mt-3 flex items-center gap-2 text-xs text-muted-foreground" data-od10-seam>
              <Tip label={FORMAT_DECISION_PENDING}>
                <Badge variant="outline" tabIndex={0}>Decision pending</Badge>
              </Tip>
              CSV or Excel
            </p>
          ) : null}
          <section aria-labelledby="export-has" className="flex flex-col gap-2">
            <h3 id="export-has" className="text-sm font-semibold text-foreground">Contains</h3>
            <ul className="flex flex-col gap-1.5 text-sm text-foreground">
              {def.contains.map((c) => (
                <li key={c} className="flex items-start gap-2"><i className="fa-light fa-check mt-1 text-xs text-muted-foreground" aria-hidden="true" />{c}</li>
              ))}
            </ul>
          </section>
          {/* What the file leaves out is one click away, the same Collapsible as the dedicated Export page (density sweep). */}
          <Collapsible className="flex flex-col gap-2">
            <CollapsibleTrigger asChild>
              <Button type="button" variant="ghost" size="sm" className="-ms-2 self-start">
                What it leaves out ({def.excludes.length})
                <i className="fa-light fa-chevron-down" aria-hidden="true" />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <ul className="flex flex-col gap-1.5 text-sm text-foreground" aria-label="Leaves out">
                {def.excludes.map((c) => (
                  <li key={c} className="flex items-start gap-2"><i className="fa-light fa-minus mt-1 text-xs text-muted-foreground" aria-hidden="true" />{c}</li>
                ))}
              </ul>
            </CollapsibleContent>
          </Collapsible>
        </FloatingSheetPanelBody>
        <FloatingSheetPanelWorkflowFooter onCancel={() => onOpenChange(false)} cancelLabel="Close" primaryLabel={`Export ${def.label}`} onPrimary={run} primaryDisabled={count === 0} primaryIconClassName="" />
      </FloatingSheetPanelContent>
    </FloatingSheetPanel>
  )
}
