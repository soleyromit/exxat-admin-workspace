"use client"

/**
 * Admin starting points (v2 "starter libraries"), variant A: a table. Template T1 list (01 section 2): title with one fact as the
 * subtitle, one outline header action, the table, detail in a non-modal FloatingSheetPanel. One filled primary at a time: the
 * preview panel's "Use as a starting point" (the page itself has none, the row action is ghost).
 *
 * PENDING-ROMIT: REQ SL-01 says Prism ships no skills library. LEDGER D-X5 keeps these only as editable starting points the
 * program owns: a copy, sharing no evidence or versions, arriving not configured. That note is a lab note (screens.json
 * labNotes, the lab bar tooltip), never page copy. Demo state: ?state=empty (no starting points offered).
 */
import * as React from "react"
import { LabLink as Link } from "@/components/lab/lab-bar/lab-link"
import { useSearchParams } from "next/navigation"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import { LabLocalBanner as LocalBanner } from "@/components/lab/lab-bar/lab-banner"
import { DataTable } from "@exxatdesignux/ui/components/data-table"
import { FloatingSheetPanel, FloatingSheetPanelBody, FloatingSheetPanelContent, FloatingSheetPanelFooter, FloatingSheetPanelHeader } from "@exxatdesignux/ui/components/ui/floating-sheet-panel"
import { PageFrame } from "@/components/skills/page-header"
import { EmptyBlock } from "@/components/lab/empty-block"
import { CopyDialog, StartingPointPreview, type CopyResult } from "@/components/lab/import/starter-copy"
import { useV2State } from "@/lib/v2/react"
import { IMPORT_GROUPING, sectionsOf, startingPoints, type StartingPoint } from "@/lib/lab/import"
import { LaterTitle } from "@/components/lab/import/sample-badge"
import { capitalize, countSkills, skillNounPlural } from "@/lib/lab/terms"

type Row = { id: string; label: string; discipline: string; count: number; sections: number; summary: string; ref: StartingPoint }

export function AdminStarterLibraryA() {
  const params = useSearchParams()
  const empty = params?.get("state") === "empty"
  const state = useV2State()
  const points = React.useMemo(() => (empty ? [] : startingPoints()), [empty])
  const [openId, setOpenId] = React.useState<string | null>(null)
  const [confirming, setConfirming] = React.useState<StartingPoint | null>(null)
  const [done, setDone] = React.useState<CopyResult | null>(null)
  const open = points.find((p) => p.id === openId) ?? null

  const data: Row[] = points.map((p) => ({ id: p.id, label: p.label, discipline: p.discipline, count: p.skills.length, sections: sectionsOf(p).length, summary: p.summary, ref: p }))
  const columns = [
    {
      key: "label", label: "Starting point", width: 340, sortable: true,
      cell: (d: Row) => (
        <span className="flex flex-col gap-0.5">
          <span className="text-sm font-medium text-foreground">{d.label}</span>
          <span className="text-xs text-muted-foreground">{d.summary}</span>
        </span>
      ),
    },
    { key: "discipline", label: "Discipline", width: 160, sortable: true, filter: { type: "select" as const, options: [...new Set(data.map((d) => d.discipline))].map((x) => ({ value: x, label: x })) } },
    { key: "count", label: capitalize(skillNounPlural()), width: 110, sortable: true, cell: (d: Row) => <span className="tabular-nums">{d.count}</span> },
    { key: "sections", label: capitalize(IMPORT_GROUPING.categories), width: 120, sortable: true, cell: (d: Row) => <span className="tabular-nums">{d.sections}</span> },
    {
      key: "actions", label: "", width: 120, resizable: false,
      cell: (d: Row) => (
        <Button type="button" variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setConfirming(d.ref) }} aria-label={`Copy ${d.label}`}>Copy</Button>
      ),
    },
  ]

  return (
    <PageFrame
      title={<LaterTitle>Starting points</LaterTitle>}
      subtitle="Example lists to copy and edit. Your program owns the copy."
      actions={<Button asChild variant="outline" size="sm"><Link href="/lab/admin/import-ai-review">{`Import ${skillNounPlural()}`}</Link></Button>}
    >
      <div className="flex flex-col gap-4" data-starter-lab="A" data-page-type="list">
        {done ? (
          <LocalBanner variant="success" title={`${countSkills(done.copied)} copied to ${done.target}`} dismissible onDismiss={() => setDone(null)} action={{ label: "Open the library", href: "/lab/admin/skills-library" }}>
            Each is not configured yet.
          </LocalBanner>
        ) : null}
        <div role="region" aria-label="Starting points">
          <DataTable<Row>
            data={data as never}
            columns={columns as never}
            getRowId={(r) => String(r.id)}
            selectable={false}
            searchable
            showQueryControls
            edgeInset={false}
            onRowClick={(r) => setOpenId(r.id)}
            openRowId={openId}
            emptyState={<EmptyBlock compact title="No starting points are offered" body="Bring in the list you already have instead." action={{ label: `Import ${skillNounPlural()}`, href: "/lab/admin/import-ai-review" }} />}
          />
        </div>
      </div>

      <FloatingSheetPanel open={!!open} onOpenChange={(o) => { if (!o) setOpenId(null) }}>
        <FloatingSheetPanelContent size="md">
          {open ? (
            <>
              <FloatingSheetPanelHeader title={open.label} subtitle={`${countSkills(open.skills.length)} in ${sectionsOf(open).length} ${IMPORT_GROUPING.categories}`} onClose={() => setOpenId(null)} />
              <FloatingSheetPanelBody className="px-4 pb-4"><StartingPointPreview point={open} /></FloatingSheetPanelBody>
              <FloatingSheetPanelFooter className="flex justify-end gap-2">
                <Button type="button" variant="default" size="default" onClick={() => { setConfirming(open); setOpenId(null) }}>Use as a starting point</Button>
              </FloatingSheetPanelFooter>
            </>
          ) : null}
        </FloatingSheetPanelContent>
      </FloatingSheetPanel>
      <CopyDialog point={confirming} skills={state.skills} onClose={() => setConfirming(null)} onCopied={setDone} />
    </PageFrame>
  )
}
