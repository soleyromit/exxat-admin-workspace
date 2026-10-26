"use client"

import * as React from "react"
import { useSearchParams } from "next/navigation"
import { useV2Hydrated, useV2State } from "@/lib/v2/react"
import { isLabelPreset } from "@/lib/lab/configure"
import { choicesFor, labSessionSkills, labTally, roster, rosterGroups, shortDate, LAB_INSTRUCTOR_ID, type LabMark, type LabSkillRow, type RosterRow } from "@/lib/lab/evaluator"
import { DEMO_TODAY } from "@/lib/v2/seed"

/**
 * Lab batch grid state (lab instructor, no login). Pure selectors live in lib/lab/evaluator.ts; this holds the session in
 * memory only. Saving does not write to the v2 store in the lab, so the demo is repeatable. Results are lab evidence: they
 * never satisfy a clinical-setting minimum (REQ SC-12), which the screen says once.
 */
export function useLabGrid() {
  const s = useV2State()
  const hydrated = useV2Hydrated()
  const skills = React.useMemo(() => labSessionSkills(s), [s])
  const groups = React.useMemo(() => rosterGroups(s), [s])
  const [query, setQuery] = React.useState("")
  const [group, setGroup] = React.useState("")
  const [chosen, setChosen] = React.useState<string[] | null>(null)
  const [cells, setCells] = React.useState<Record<string, LabMark>>({})
  const [saved, setSaved] = React.useState<{ results: number; students: number } | null>(null)
  const skillIds = chosen ?? skills.filter((k) => !k.blocked).slice(0, 3).map((k) => k.id)
  const chosenSkills = skillIds.map((id) => skills.find((k) => k.id === id)).filter((k): k is LabSkillRow => !!k)
  const cohortRows = React.useMemo(() => roster(s, { query: "", group }), [s, group])
  const rows = React.useMemo(() => roster(s, { query, group }), [s, query, group])
  const tally = labTally(cohortRows, skillIds, cells)
  const instructor = s.people.find((p) => p.id === LAB_INSTRUCTOR_ID)
  // The program's own labels, or a Configure preset previewed with ?labels= (same as the evaluator form).
  const rawPreset = useSearchParams()?.get("labels")
  const preset = isLabelPreset(rawPreset) ? rawPreset : null
  const labels = (skillId: string) => {
    const k = s.skills.find((x) => x.id === skillId)
    const c = k ? choicesFor(k, false, preset) : [{ value: "met", label: "Met" }, { value: "not-met", label: "Unmet" }]
    return { met: c[0].label, notMet: c[1].label }
  }
  const mark = (studentId: string, skillId: string) => cells[`${studentId}|${skillId}`] ?? null
  const isAbsent = (studentId: string) => cells[`${studentId}|*`] === "absent"
  const setMark = (studentId: string, skillId: string, v: LabMark) => { setSaved(null); setCells((p) => ({ ...p, [`${studentId}|${skillId}`]: v })) }
  const setAbsent = (studentId: string, absent: boolean) => { setSaved(null); setCells((p) => ({ ...p, [`${studentId}|*`]: absent ? "absent" : null })) }
  /** Sets the first outcome on every visible, present student with no mark yet for this skill. Never overwrites. */
  const fillColumn = (skillId: string, rowsIn: RosterRow[] = rows) => {
    setSaved(null)
    setCells((p) => {
      const n = { ...p }
      for (const r of rowsIn) if (n[`${r.id}|*`] !== "absent" && !n[`${r.id}|${skillId}`]) n[`${r.id}|${skillId}`] = "met"
      return n
    })
  }
  const toggleSkill = (id: string, on: boolean) => setChosen(on ? [...skillIds, id] : skillIds.filter((x) => x !== id))
  const save = () => {
    if (tally.results === 0) return false
    setSaved({ results: tally.results, students: tally.done })
    return true
  }
  return {
    hydrated,
    instructor: instructor?.name ?? "Lab instructor",
    course: s.course.code,
    date: shortDate(DEMO_TODAY),
    programName: `${s.program.school} ${s.program.name}`,
    skills,
    chosenSkills,
    skillIds,
    toggleSkill,
    groups,
    group,
    setGroup,
    query,
    setQuery,
    rows,
    cohortCount: cohortRows.length,
    tally,
    labels,
    mark,
    isAbsent,
    setMark,
    setAbsent,
    fillColumn,
    save,
    saved,
  }
}

export type LabGridModel = ReturnType<typeof useLabGrid>
