"use client"

/**
 * Evaluation settings, variant C: one group at a time (Proposed 2026-11-02). Line tabs for the five groups (Judging, Completion,
 * People, Review, Group check-off); one group's controls show at a time, and the footer Save writes all of them. A failed save
 * opens the tab that holds the first thing to fix. Tests whether a short page per decision beats one long page. Labels and
 * controls only (D-L34).
 *
 * Regions: header, tabs, the group, footer. URL: ?group=<id> · ?state=loading.
 */
import * as React from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@exxatdesignux/ui/components/ui/tabs"
import { useUrlParams } from "@/components/lab/admin-a/parts"
import { PROGRAM_GROUPS, ProgramGroupBody, groupOfIssue, type ProgramGroupId } from "@/components/lab/configure/program-parts"
import { ProgramSettingsFrame } from "@/components/lab/configure/program-layout"

const isGroup = (v: string): v is ProgramGroupId => PROGRAM_GROUPS.some((g) => g.id === v)

export function AdminEvaluationSettingsC() {
  const q = useUrlParams()
  const raw = q.get("group")
  const group: ProgramGroupId = isGroup(raw) ? raw : "judged"
  const open = (g: ProgramGroupId) => q.set({ group: g === "judged" ? null : g })
  return (
    <ProgramSettingsFrame onIssue={(i) => open(groupOfIssue(i))}>
      {(p) => (
        <Tabs value={group} onValueChange={(v) => isGroup(v) && open(v)} className="flex flex-col gap-6" data-layout="tabs">
          <TabsList variant="line" ariaLabel="Evaluation settings">
            {PROGRAM_GROUPS.map((g) => (
              <TabsTrigger key={g.id} value={g.id}>{g.label}</TabsTrigger>
            ))}
          </TabsList>
          {PROGRAM_GROUPS.map((g) => (
            <TabsContent key={g.id} value={g.id} className="mt-0 flex flex-col gap-4" data-group={g.id}>
              <ProgramGroupBody id={g.id} m={p.m} edits={p.edits} setEdits={p.setEdits} />
            </TabsContent>
          ))}
        </Tabs>
      )}
    </ProgramSettingsFrame>
  )
}
