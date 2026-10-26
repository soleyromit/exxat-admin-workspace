"use client"

/**
 * Deactivate, retire or new list, variant B (named alternative, "in the list"): the decision opens as a side panel from the
 * skill's row, so the admin never leaves the library. Same intent, impact and delete rules as A, in one column. The table
 * shows the evidence count per skill, so which skills can still be deleted is visible before opening any of them.
 */
import * as React from "react"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import { LocalBanner } from "@exxatdesignux/ui/components/ui/banner"
import { Skeleton } from "@exxatdesignux/ui/components/ui/skeleton"
import { StatusBadge } from "@exxatdesignux/ui/components/ui/status-badge"
import { DataTable } from "@exxatdesignux/ui/components/data-table"
import type { ColumnDef } from "@exxatdesignux/ui/components/data-table/types"
import { FloatingSheetPanel, FloatingSheetPanelBody, FloatingSheetPanelContent, FloatingSheetPanelHeader, FloatingSheetPanelToolbar } from "@exxatdesignux/ui/components/ui/floating-sheet-panel"
import { PageFrame } from "@/components/skills/page-header"
import { SampleDataBadge } from "@/components/lab/import/sample-badge"
import { RetireFlow } from "@/components/lab/admin-b/retire-flow"
import { useRetire } from "@/components/lab/admin-b/use-retire"
import { capitalize, skillNoun, skillNounPlural } from "@/lib/lab/terms"
import { fmt } from "@/lib/v2/format"

interface Row extends Record<string, unknown> {
  id: string
  name: string
  section: string
  evidence: number
  inactive: boolean
}

export function AdminDeactivateB() {
  const r = useRetire()
  const rows: Row[] = React.useMemo(() => {
    if (!r.hydrated) return []
    const ev = new Map<string, number>()
    for (const e of r.data.evaluations) ev.set(e.skillId, (ev.get(e.skillId) ?? 0) + 1)
    return r.data.skills
      .filter((k) => !r.deleted.includes(k.id))
      .map((k) => ({ id: k.id, name: k.name, section: k.category, evidence: ev.get(k.id) ?? 0, inactive: r.isInactive(k.id) }))
      .sort((a, b) => a.section.localeCompare(b.section) || a.name.localeCompare(b.name))
  }, [r.hydrated, r.data, r.deleted, r.isInactive]) // eslint-disable-line react-hooks/exhaustive-deps
  const open = r.demo === "empty" ? null : r.skillParam
  const impact = open ? r.impactOf(open) : null

  if (!r.hydrated || r.demo === "loading") {
    return (
      <PageFrame title={capitalize(skillNounPlural())} actions={<SampleDataBadge />}>
        <div role="status" aria-busy="true" aria-label="Loading" className="flex flex-col gap-2">
          {Array.from({ length: 10 }, (_, i) => <Skeleton key={i} aria-hidden="true" className="h-12 w-full" />)}
        </div>
      </PageFrame>
    )
  }

  const columns: ColumnDef<Row>[] = [
    { key: "name", label: capitalize(skillNoun()), width: 320, sortable: true, cell: (x) => <span className={x.inactive ? "text-muted-foreground" : "font-medium text-foreground"}>{x.name}</span> },
    { key: "section", label: "Section", width: 200, sortable: true },
    { key: "evidence", label: "Evaluations", width: 130, sortable: true, cell: (x) => <span className="tabular-nums">{fmt(x.evidence)}</span> },
    { key: "inactive", label: "Status", width: 130, cell: (x) => (x.inactive ? <StatusBadge label="Inactive" tone="neutral" icon="fa-circle-minus" size="sm" /> : <span className="text-sm text-muted-foreground">Active</span>) },
    {
      key: "change",
      label: "Actions",
      width: 200,
      cell: (x) => (
        <Button type="button" variant="outline" size="sm" onClick={() => r.setSkill(x.id)} aria-label={`Deactivate or replace ${x.name}`}>Deactivate or replace</Button>
      ),
    },
  ]

  return (
    <PageFrame title={capitalize(skillNounPlural())} actions={<SampleDataBadge />}>
      <div className="flex flex-col gap-4" data-retire-lab="B" data-page-type="list">
        {r.demo === "error" ? (
          <LocalBanner variant="error" title={`${capitalize(skillNounPlural())} could not be loaded`} retry={{ label: "Try again", onClick: () => r.setSkill(null) }}>Nothing was changed.</LocalBanner>
        ) : (
          <DataTable<Row> data={rows} columns={columns} getRowId={(x) => x.id} openRowId={open ?? null} selectable={false} searchable showQueryControls edgeInset={false} lazyLoading={{ enabled: true, threshold: 80, chunkSize: 40, loadingLabel: "Loading more" }} emptyState={<p className="p-4 text-sm text-muted-foreground">{`No ${skillNounPlural()} match.`}</p>} />
        )}
      </div>
      <FloatingSheetPanel open={!!impact} onOpenChange={(o) => (!o ? r.setSkill(null) : undefined)}>
        <FloatingSheetPanelContent contentSlot="lab-retire" size="md">
          <FloatingSheetPanelToolbar />
          <FloatingSheetPanelHeader title={impact?.name ?? capitalize(skillNoun())} subtitle={impact?.section} />
          <FloatingSheetPanelBody className="px-4 pb-4">
            {impact ? (
              <RetireFlow
                impact={impact}
                cohorts={r.cohorts}
                existingLists={r.lists.map((l) => l.name)}
                layout="panel"
                partial={r.demo === "partial"}
                inactive={r.isInactive(impact.skillId)}
                onDeactivate={() => r.deactivate(impact.skillId)}
                onReactivate={() => r.reactivate(impact.skillId)}
                onNewList={r.addList}
                onDelete={() => { r.remove(impact.skillId); r.setSkill(null) }}
              />
            ) : null}
          </FloatingSheetPanelBody>
        </FloatingSheetPanelContent>
      </FloatingSheetPanel>
    </PageFrame>
  )
}
