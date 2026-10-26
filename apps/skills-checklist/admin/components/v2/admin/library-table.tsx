"use client"

import { LoadingBlocks } from "@/components/v2/shared-loading"
import * as React from "react"
import Link from "next/link"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import type { ActiveFilter } from "@exxatdesignux/ui/lib/table-properties-types"
import { BulletMeter } from "@/components/v2/viz"
import { V2Grid, v2col } from "@/components/v2/v2-grid"
import { filterValue, V2FilterBar, v2SelectField } from "@/components/v2/v2-filter-bar"
import { StatusPill } from "@/components/v2/status-pill"
import { skillPillValue } from "@/lib/v2/status-pill"
import { ADMIN_ID, useAdminRun } from "@/components/v2/admin/use-admin"
import { EditSkillDialog } from "@/components/v2/admin/edit-skill-dialog"
import { updateSkillMeta } from "@/lib/v2/admin-actions"
import { useV2Hydrated, useV2State } from "@/lib/v2/react"
import { SPECIALTY_LABEL } from "@/lib/v2/starter-libraries"
import type { Skill } from "@/lib/v2/types"

/** The program library: every skill, which import or copy brought it in, whether it still needs configuring (IM-10, IM-11), and Edit. */
export function LibraryTable({ announce }: { announce: (m: string) => void }) {
  const state = useV2State()
  const hydrated = useV2Hydrated()
  const run = useAdminRun()
  const [filters, setFilters] = React.useState<ActiveFilter[]>([])
  const [editing, setEditing] = React.useState<Skill | null>(null)
  const batchLabel = (k: Skill) => state.batches.find((b) => b.id === k.batchId)?.label ?? "Original library"
  const fields = React.useMemo(() => {
    const categories = [...new Set(state.skills.map((k) => k.category))].sort()
    const sources = [...new Set(state.skills.map(batchLabel))].sort()
    return [
      v2SelectField("status", "Status", [
        { value: "not-configured", label: "Not configured" },
        { value: "configured", label: "Configured, not in use" },
        { value: "in-use", label: "In use" },
      ], "fa-circle-half-stroke"),
      v2SelectField("library", "Library", (Object.keys(SPECIALTY_LABEL) as Array<keyof typeof SPECIALTY_LABEL>).map((sp) => ({ value: sp, label: SPECIALTY_LABEL[sp] })), "fa-book"),
      v2SelectField("category", "Category", categories.map((c) => ({ value: c, label: c })), "fa-tag"),
      v2SelectField("source", "Came from", sources.map((c) => ({ value: c, label: c })), "fa-file-import"),
    ]
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.skills, state.batches])
  const rows = state.skills.filter((k) => {
    const st = filterValue(filters, "status")
    const lib = filterValue(filters, "library")
    const cat = filterValue(filters, "category")
    const src = filterValue(filters, "source")
    return (!st || skillPillValue(k) === st) && (!lib || k.specialty === lib) && (!cat || k.category === cat) && (!src || batchLabel(k) === src)
  })
  const toConfigure = state.skills.filter((k) => !k.configured).length
  const published = state.skills.filter((k) => k.published).length

  if (!hydrated) return <LoadingBlocks label="Loading skill library" rows={5} />

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <BulletMeter
          className="w-full max-w-sm"
          label="Configured"
          value={state.skills.length - toConfigure}
          required={state.skills.length}
          valueText={`${state.skills.length - toConfigure} of ${state.skills.length}, ${published} in use`}
        />
      </div>
      <V2FilterBar fields={fields} filters={filters} onChange={setFilters} resultCount={rows.length} resultNoun="skills" emptyMessage="No skills match these filters." />
      <V2Grid<Skill>
        selectable={false}
        caption="Program skill library"
        rows={rows}
        emptyText="No skills yet. Add a starter library or import a PDF."
        id={(k) => k.id}
        columns={[
          v2col<Skill>("name", "Skill", 260, (k) => (
            <span className="flex flex-col">
              <span className="font-medium text-foreground">{k.name}</span>
              {k.description ? <span className="text-xs text-muted-foreground">{k.description}</span> : null}
            </span>
          )),
          v2col<Skill>("library", "Library", 150, (k) => SPECIALTY_LABEL[k.specialty]),
          v2col<Skill>("category", "Category", 130, (k) => k.category),
          v2col<Skill>("status", "Status", 210, (k) => <StatusPill kind="skill" value={skillPillValue(k)} />),
          v2col<Skill>("source", "Came from", 170, (k) => batchLabel(k)),
          v2col<Skill>("actions", "Actions", 190, (k) => (
            <span className="flex items-center gap-2">
              <Button asChild variant="outline" size="sm">
                <Link href={`/v2/admin/configure-skill?skill=${k.id}`} aria-label={`Configure ${k.name}`}>
                  Configure
                </Link>
              </Button>
              <Button type="button" variant="outline" size="sm" aria-label={`Edit ${k.name}`} onClick={() => setEditing(k)}>
                Edit
              </Button>
            </span>
          )),
        ]}
      />
      <EditSkillDialog
        open={editing !== null}
        onOpenChange={(o) => !o && setEditing(null)}
        title="Edit skill"
        description="Evaluation settings are on Configure skill."
        initial={{ name: editing?.name ?? "", category: editing && editing.category !== "No category" ? editing.category : "", description: editing?.description ?? "" }}
        onSave={(v) => {
          if (!editing) return null
          const r = run((s, at) => updateSkillMeta(s, editing.id, v, ADMIN_ID, at))
          if (!r.ok) return r.error
          announce(`Saved ${v.name.trim()}.`)
          return null
        }}
      />
    </div>
  )
}
