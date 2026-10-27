"use client"

import * as React from "react"
import { useSearchParams } from "next/navigation"
import { useV2Hydrated, useV2State } from "@/lib/v2/react"
import { isLabelPreset } from "@/lib/lab/configure"
import { choicesFor, labCellKey, labFeedbackMessage, labFeedbackMissing, labSavedResults, labSessionSkills, labTally, roster, rosterGroups, shortDate, LAB_INSTRUCTOR_ID, type LabMark, type LabSavedResult, type LabSkillRow, type RosterRow } from "@/lib/lab/evaluator"
import { DEMO_TODAY } from "@/lib/v2/seed"

/**
 * Lab batch grid state (lab instructor, no login). Pure selectors live in lib/lab/evaluator.ts; this holds the session in
 * memory only. Saving does not write to the v2 store in the lab, so the demo is repeatable. Results are lab evidence: they
 * never satisfy a clinical-setting minimum (REQ SC-12), which the screen says once. Feedback is kept per result (EV-06) and a
 * skill that requires it blocks Save until each of its results has some.
 */
export function useLabGrid() {
  const s = useV2State()
  const hydrated = useV2Hydrated()
  const params = useSearchParams()
  // The lab's "Program requires feedback" option (?fb=1), shared with the evaluator form.
  const requireFeedback = params?.get("fb") === "1"
  const skills = React.useMemo(() => labSessionSkills(s, requireFeedback), [s, requireFeedback])
  const groups = React.useMemo(() => rosterGroups(s), [s])
  const [query, setQuery] = React.useState("")
  const [group, setGroup] = React.useState("")
  const [chosen, setChosen] = React.useState<string[] | null>(null)
  const [cells, setCells] = React.useState<Record<string, LabMark>>({})
  const [feedback, setFeedbackMap] = React.useState<Record<string, string>>({})
  const [saved, setSaved] = React.useState<{ results: number; students: number; withFeedback: number; entries: LabSavedResult[] } | null>(null)
  const [tried, setTried] = React.useState(false)
  const skillIds = chosen ?? skills.filter((k) => !k.blocked).slice(0, 3).map((k) => k.id)
  const chosenSkills = skillIds.map((id) => skills.find((k) => k.id === id)).filter((k): k is LabSkillRow => !!k)
  const cohortRows = React.useMemo(() => roster(s, { query: "", group }), [s, group])
  const rows = React.useMemo(() => roster(s, { query, group }), [s, query, group])
  const tally = labTally(cohortRows, skillIds, cells)
  const instructor = s.people.find((p) => p.id === LAB_INSTRUCTOR_ID)
  // The program's own labels, or a Configure preset previewed with ?labels= (same as the evaluator form).
  const rawPreset = params?.get("labels")
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
  const feedbackFor = (studentId: string, skillId: string) => feedback[labCellKey(studentId, skillId)] ?? ""
  const setFeedback = (studentId: string, skillId: string, text: string) => { setSaved(null); setFeedbackMap((p) => ({ ...p, [labCellKey(studentId, skillId)]: text })) }
  // Checked against the whole cohort in scope, not only the rows a search shows, so a hidden row cannot slip through.
  const missing = labFeedbackMissing(cohortRows, chosenSkills, cells, feedback)
  const missingKeys = new Set(missing.map((m) => labCellKey(m.studentId, m.skillId)))
  const isMissing = (studentId: string, skillId: string) => tried && missingKeys.has(labCellKey(studentId, skillId))
  /** False when nothing is recorded or a required feedback is missing; the save bar then says which. */
  const save = () => {
    setTried(true)
    if (tally.results === 0 || missing.length) return false
    const entries = labSavedResults(cohortRows, chosenSkills, cells, feedback)
    setSaved({ results: tally.results, students: tally.done, withFeedback: entries.filter((e) => e.feedback).length, entries })
    setTried(false)
    return true
  }
  const blocker = !tried ? null : tally.results === 0 ? "Record at least one result to save." : missing.length ? labFeedbackMessage(missing) : null
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
    feedbackFor,
    setFeedback,
    isMissing,
    missing,
    blocker,
  }
}

export type LabGridModel = ReturnType<typeof useLabGrid>
