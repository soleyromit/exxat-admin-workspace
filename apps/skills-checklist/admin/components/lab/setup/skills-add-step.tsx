"use client"

/**
 * Set up skills, step 1 (D-L44, Romit 2026-11-04: "Why are we showing the wizard beside the skills table directly?"): this step
 * adds skills, it does not manage them. Three ways in, then the skills added so far.
 *
 * - Paste a list: the library's Add several sheet (duplicates, review each line, category and tags for all) [REQ IM-05, IM-06].
 * - Upload a file: import is Phase 2 [CALL 10-26], labelled Later as in the library. Here it opens a one-line note with Paste a
 *   list instead: the import route writes to the seeded program, not to this new one.
 * - Add one: the library's add sheet (name, description, category, tags, required) [REQ SL-02 to SL-05].
 * - Added: name, category and tags only. Status, how it's judged, times needed, courses and row management stay on the hub
 *   Library; they are later steps' jobs or nothing to manage yet.
 * Both sheets write through useLibrary, the same writer the hub Library uses, so nothing about adding is forked.
 */
import * as React from "react"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@exxatdesignux/ui/components/ui/popover"
import { DataTable } from "@exxatdesignux/ui/components/data-table"
import type { ColumnDef } from "@exxatdesignux/ui/components/data-table/types"
import { useLibrary } from "@/components/lab/library/use-library"
import { SkillSheet } from "@/components/lab/library/skill-sheet"
import { AddSeveralSheet } from "@/components/lab/library/add-several-sheet"
import { LaterBadge } from "@/components/lab/import/sample-badge"
import { EmptyBlock } from "@/components/lab/empty-block"
import { TYPE } from "@/components/lab/type-scale"
import type { LibraryRow } from "@/lib/lab/library"
import { aNoun, capitalize, skillNounPlural } from "@/lib/lab/terms"

type Row = LibraryRow & Record<string, unknown>

export function SkillsAddStep() {
  const api = useLibrary()
  const [adding, setAdding] = React.useState(false)
  const [pasting, setPasting] = React.useState(false)
  const [uploadOpen, setUploadOpen] = React.useState(false)
  const rows = React.useMemo(() => api.rows.filter((r) => r.status !== "inactive") as Row[], [api.rows])
  const nounPl = skillNounPlural()
  const columns: ColumnDef<Row>[] = [
    { key: "name", label: "Name", sortable: true, cell: (r) => <span className="font-medium">{r.name}</span> },
    { key: "category", label: "Category", width: 240, sortable: true, cell: (r) => (r.category ? r.category : <span className="text-muted-foreground">None</span>) },
    { key: "tags", label: "Tags", width: 280, cell: (r) => (r.tags.length ? <span className="whitespace-normal">{r.tags.join(", ")}</span> : <span className="text-muted-foreground">None</span>) },
  ]
  return (
    <div className="flex flex-col gap-8" data-setup-add>
      <div className="flex flex-wrap items-center gap-3" role="group" aria-label={`Ways to add ${nounPl}`} data-region="add-ways">
        <Button type="button" variant="outline" size="default" onClick={() => { setAdding(false); setPasting(true) }}>Paste a list</Button>
        {/* Phase 2 [CALL 10-26]: never a disabled control above the fold, so it opens a one-line note and offers paste. */}
        <Popover open={uploadOpen} onOpenChange={setUploadOpen}>
          <PopoverTrigger asChild>
            <Button type="button" variant="outline" size="default" className="gap-2">
              Upload a file
              <LaterBadge />
            </Button>
          </PopoverTrigger>
          <PopoverContent align="start" className="flex w-72 flex-col items-start gap-3 p-4">
            <p className="text-sm text-foreground">Upload comes in a later release.</p>
            <Button type="button" variant="outline" size="sm" onClick={() => { setUploadOpen(false); setAdding(false); setPasting(true) }}>Paste a list instead</Button>
          </PopoverContent>
        </Popover>
        <Button type="button" variant="outline" size="default" onClick={() => { setPasting(false); setAdding(true) }}>{`Add ${aNoun()}`}</Button>
      </div>
      <section aria-labelledby="setup-added-heading" className="flex flex-col gap-3" data-region="added">
        <h3 id="setup-added-heading" className={TYPE.card}>{`Added (${rows.length.toLocaleString("en-US")})`}</h3>
        <DataTable<Row>
          data={rows}
          columns={columns}
          getRowId={(r) => r.id}
          selectable={false}
          searchable={false}
          showQueryControls={false}
          edgeInset={false}
          emptyState={<EmptyBlock compact title={`No ${nounPl} added yet`} />}
        />
      </section>
      <AddSeveralSheet open={pasting} onOpenChange={setPasting} rows={api.rows} onAdd={(items, d) => api.addMany(items, d)} />
      <SkillSheet open={adding} onOpenChange={setAdding} rows={api.rows} onSave={(d) => { api.add(d) }} />
      <span className="sr-only" aria-live="polite">{rows.length ? `${capitalize(nounPl)} added: ${rows.length}` : ""}</span>
    </div>
  )
}
