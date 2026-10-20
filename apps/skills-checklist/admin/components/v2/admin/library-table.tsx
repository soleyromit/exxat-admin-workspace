"use client"

import * as React from "react"
import Link from "next/link"
import { Badge } from "@exxatdesignux/ui/components/ui/badge"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import { Label } from "@exxatdesignux/ui/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@exxatdesignux/ui/components/ui/select"
import { V2Grid, v2col } from "@/components/v2/v2-grid"
import { ADMIN_ID, useAdminRun } from "@/components/v2/admin/use-admin"
import { EditSkillDialog } from "@/components/v2/admin/edit-skill-dialog"
import { updateSkillMeta } from "@/lib/v2/admin-actions"
import { useV2State } from "@/lib/v2/react"
import { SPECIALTY_LABEL } from "@/lib/v2/starter-libraries"
import type { Skill } from "@/lib/v2/types"

type Filter = "all" | "to-configure" | "added"

const statusOf = (k: Skill) => (k.published ? "In use" : k.configured ? "Configured, not in use" : "Not configured")

/** The program library: every skill, which import or copy brought it in, whether it still needs configuring (IM-10, IM-11), and Edit. */
export function LibraryTable({ announce }: { announce: (m: string) => void }) {
  const state = useV2State()
  const run = useAdminRun()
  const [filter, setFilter] = React.useState<Filter>("all")
  const [editing, setEditing] = React.useState<Skill | null>(null)
  const batchLabel = (k: Skill) => state.batches.find((b) => b.id === k.batchId)?.label ?? "Original library"
  const rows = state.skills.filter((k) => (filter === "to-configure" ? !k.configured : filter === "added" ? !!k.batchId : true))
  const toConfigure = state.skills.filter((k) => !k.configured).length

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          <span className="tabular-nums text-foreground">{state.skills.length}</span> skills in the library, <span className="tabular-nums text-foreground">{toConfigure}</span> still to configure.
        </p>
        <div className="flex flex-col gap-1">
          <Label htmlFor="library-filter" className="text-sm">
            Show
          </Label>
          <Select value={filter} onValueChange={(v) => setFilter(v as Filter)}>
            <SelectTrigger id="library-filter" className="w-56">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All skills</SelectItem>
              <SelectItem value="to-configure">Still to configure</SelectItem>
              <SelectItem value="added">Added by import or copy</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <V2Grid<Skill>
        caption="Program skill library"
        rows={rows}
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
          v2col<Skill>("status", "Status", 170, (k) => <Badge variant={k.configured ? "secondary" : "outline"}>{statusOf(k)}</Badge>),
          v2col<Skill>("source", "Came from", 170, (k) => batchLabel(k)),
          v2col<Skill>("actions", "Actions", 190, (k) => (
            <span className="flex items-center gap-2">
              <Button type="button" variant="outline" size="sm" aria-label={`Edit ${k.name}`} onClick={() => setEditing(k)}>
                Edit
              </Button>
              <Button asChild variant="outline" size="sm">
                <Link href={`/v2/admin/configure-skill?skill=${k.id}`} aria-label={`Configure ${k.name}`}>
                  Configure
                </Link>
              </Button>
            </span>
          )),
        ]}
      />
      <EditSkillDialog
        open={editing !== null}
        onOpenChange={(o) => !o && setEditing(null)}
        title="Edit skill"
        description="Change the name, category or description. Evaluation settings are changed on the configure screen."
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
