"use client"

/**
 * Reports are read one skill list at a time (stakeholder review 2026-11-04: two active lists are two reports, never merged). The select
 * shows only when the scope reaches more than one list; with one list the figures are unchanged. With nothing chosen it opens on the
 * default list. URL: ?skillList=.
 */
import * as React from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@exxatdesignux/ui/components/ui/select"
import { useLists, customGroupsStore } from "@/components/lab/admin-a/use-admin-data"
import { listsReaching, studentGroups, studentsOnList, type SkillList } from "@/lib/lab/lists"
import { populationRows } from "@/lib/v2/population"
import { capitalize, skillListNoun } from "@/lib/lab/terms"
import type { LabScope } from "@/lib/lab/scope"
import type { Person, V2State } from "@/lib/v2/types"

export function useReportList(state: V2State | null, scope: LabScope, requested: string | null) {
  const { lists } = useLists(state)
  const custom = customGroupsStore.use()
  return React.useMemo(() => {
    if (!state) return { reaching: [] as SkillList[], selected: null, only: undefined, unassigned: [] as Person[] }
    const groups = studentGroups(state, custom)
    const { list: _chosen, ...whoever } = scope
    const whole = populationRows(state, whoever)
    const reaching = listsReaching(lists, groups, whole.ids)
    const unassigned = whole.unassigned
    if (reaching.length < 2) return { reaching, selected: null, only: undefined, unassigned }
    const selected = reaching.find((l) => l.id === requested) ?? reaching.find((l) => l.isDefault) ?? reaching[0]!
    return { reaching, selected, only: { studentIds: studentsOnList(selected, groups), skillIds: new Set(selected.skillIds), listId: selected.id }, unassigned }
  }, [state, lists, custom, scope, requested])
}

export function ReportListSelect({ reaching, selected, onChange }: { reaching: SkillList[]; selected: SkillList | null; onChange: (id: string) => void }) {
  if (!selected) return null
  return (
    <Select value={selected.id} onValueChange={onChange}>
      <SelectTrigger className="w-72" aria-label={capitalize(skillListNoun())} data-report-list>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {reaching.map((l) => (
          <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
