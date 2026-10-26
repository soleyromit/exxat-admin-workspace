"use client"

import * as React from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { LoadingBlocks } from "@/components/v2/shared-loading"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import { Checkbox } from "@exxatdesignux/ui/components/ui/checkbox"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@exxatdesignux/ui/components/ui/dialog"
import { DatePickerField } from "@exxatdesignux/ui/components/ui/date-picker-field"
import { Input } from "@exxatdesignux/ui/components/ui/input"
import { Label } from "@exxatdesignux/ui/components/ui/label"
import { LocalBanner } from "@exxatdesignux/ui/components/ui/banner"
import { RadioGroup, RadioGroupItem } from "@exxatdesignux/ui/components/ui/radio-group"
import { StatusBadge } from "@exxatdesignux/ui/components/ui/status-badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@exxatdesignux/ui/components/ui/table"
import { contextLine } from "@/lib/v2/page-context"
import { PageFrame, PageSection } from "@/components/skills/page-header"
import { hatch, STATE_META, TONE_COLOR } from "@/components/v2/viz/tokens"
import { BTN } from "@/components/v2/preceptor/evaluation-form"
import { cellKey, cellWord, labBatchesOf, labBlockReason, labCounts, labSkills, labStudents, nextCell, NAME_MAX, saveLabBatch, type LabInput } from "@/lib/v2/lab"
import { useV2Hydrated, useV2State, useV2Store } from "@/lib/v2/react"
import { DEMO_TODAY, IDS } from "@/lib/v2/seed"
import type { Outcome } from "@/lib/v2/types"

const plural = (n: number, one: string, many: string) => (n === 1 ? one : many)

const CELL_ICON: Record<string, string> = { met: "fa-solid fa-circle-check", "not-met": "fa-light fa-circle-minus", "not-yet": "fa-light fa-comment", none: "fa-light fa-circle" }
const CELL_CLASS: Record<string, string> = {
  met: "bg-brand text-brand-foreground",
  "not-met": "bg-muted text-foreground",
  "not-yet": "bg-brand-tint text-foreground",
  none: "bg-background text-foreground",
}

type Tally = { met: number; notMet: number; notYet: number; absent: number; blank: number }
type TallySquare = "met" | "notMet" | "notYet" | "absent" | "blank"

/** One square per student and skill: what has been recorded so far, live. An absent student's squares are hatched. */
function squaresOf(students: Array<{ id: string }>, skillIds: string[], absent: string[], cells: Record<string, Outcome | null>): TallySquare[] {
  const out: TallySquare[] = []
  for (const p of students) {
    for (const id of skillIds) {
      if (absent.includes(p.id)) out.push("absent")
      else {
        const v = cells[cellKey(p.id, id)] ?? null
        out.push(v === "met" ? "met" : v === "not-met" ? "notMet" : v === "not-yet" ? "notYet" : "blank")
      }
    }
  }
  return out
}

const SQUARE_STYLE: Record<TallySquare, React.CSSProperties> = {
  met: { background: TONE_COLOR.met, border: `1px solid ${TONE_COLOR.met}` },
  notMet: { background: TONE_COLOR.notMet, border: `1px solid ${TONE_COLOR.notMet}` },
  notYet: { background: TONE_COLOR.notYet, border: `1px solid ${TONE_COLOR.notYet}` },
  absent: { background: "var(--background)", border: `1px solid ${TONE_COLOR.neutral}`, ...hatch(TONE_COLOR.neutral) },
  blank: { background: "var(--background)", border: "1px solid var(--border-control-35)" },
}

const TALLY_WORD: Record<keyof Tally, string> = { met: "met", notMet: "not met", notYet: "not yet", absent: "absent", blank: "not recorded" }

/** Live tally in the Save bar. Counts are printed beside the squares so colour is never the only signal. */
function LabTally({ squares }: { squares: TallySquare[] }) {
  const n: Tally = { met: 0, notMet: 0, notYet: 0, absent: 0, blank: 0 }
  for (const q of squares) n[q] += 1
  const spoken = (Object.keys(TALLY_WORD) as Array<keyof Tally>).map((k) => `${n[k]} ${TALLY_WORD[k]}`).join(", ")
  return (
    <div className="flex min-w-0 flex-1 flex-col gap-2" data-lab-tally>
      <div role="img" aria-label={`Session so far: ${spoken}`} className="flex max-h-14 flex-wrap gap-1 overflow-hidden">
        {squares.map((q, i) => (
          <span key={i} className="size-3 rounded-xs" style={SQUARE_STYLE[q]} data-square={q} />
        ))}
      </div>
      <p className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground" data-lab-counts>
        <span className="text-foreground tabular-nums"><i className={`${STATE_META.met.icon} me-1`} style={{ color: TONE_COLOR.met }} aria-hidden="true" />{`${n.met} met`}</span>
        <span className="text-foreground tabular-nums"><i className={`${STATE_META.notMet.icon} me-1`} style={{ color: TONE_COLOR.notMet }} aria-hidden="true" />{`${n.notMet} not met`}</span>
        <span className="text-foreground tabular-nums"><i className={`${STATE_META.notYet.icon} me-1`} style={{ color: TONE_COLOR.notYet }} aria-hidden="true" />{`${n.notYet} not yet`}</span>
        <span className="tabular-nums"><i className="fa-light fa-user-slash me-1" aria-hidden="true" />{`${n.absent} absent`}</span>
        <span className="tabular-nums">{`${n.blank} not recorded`}</span>
      </p>
    </div>
  )
}

/** A day string and a local Date, both ways, without a time zone shift. */
const toDate = (day: string) => new Date(`${day}T12:00:00`)
const fromDate = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`

const DEFAULT_SKILLS = ["sk-vitals", "sk-sterile-dressing"]

/** Walkthrough step 14: R. Whitmore records a lab session for the group. Students down, skills across, press a cell to cycle its state. */
export function LabGridPage() {
  const params = useSearchParams()
  const s = useV2State()
  const store = useV2Store()
  const hydrated = useV2Hydrated()
  const actorId = params.get("as") ?? IDS.whitmore
  const actor = s.people.find((p) => p.id === actorId)
  const blockReason = labBlockReason(actor)
  const students = labStudents(s)

  const [name, setName] = React.useState("Skills lab, group A")
  const [date, setDate] = React.useState(DEMO_TODAY)
  const [setting, setSetting] = React.useState<"lab" | "simulation">("lab")
  const [skillIds, setSkillIds] = React.useState<string[]>(DEFAULT_SKILLS)
  const [absent, setAbsent] = React.useState<string[]>([])
  const [cells, setCells] = React.useState<Record<string, Outcome | null>>({})
  const [confirm, setConfirm] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [saveFailed, setSaveFailed] = React.useState(false)
  const [saved, setSaved] = React.useState<string | null>(null)
  const [announce, setAnnounce] = React.useState("")
  const savedRef = React.useRef<HTMLDivElement>(null)
  React.useEffect(() => {
    if (saved) savedRef.current?.focus()
  }, [saved])

  const offered = labSkills(s, setting, actor)
  const usable = offered.filter((x) => !x.blocked)
  const chosen = skillIds.filter((id) => usable.some((x) => x.skill.id === id))
  const skills = chosen.map((id) => s.skills.find((k) => k.id === id)!).filter(Boolean)
  const input: LabInput = { name, date, setting, skillIds: chosen, absentIds: absent, cells }
  const counts = labCounts(s, input)
  const batches = labBatchesOf(s).slice().reverse()
  const nameOf = (id: string) => s.people.find((p) => p.id === id)?.name ?? "Unknown person"
  const heldForApproval = skills.filter((k) => k.config?.approvalRequired).map((k) => k.name)

  if (!hydrated && students.length === 0) return <PageFrame title="Lab sessions"><LoadingBlocks label="Opening the session" rows={4} /></PageFrame>

  const press = (studentId: string, skillId: string) => {
    const k = cellKey(studentId, skillId)
    const next = nextCell(cells[k] ?? null)
    setCells({ ...cells, [k]: next })
    setSaved(null)
    setError(null)
    setAnnounce(`${nameOf(studentId)}, ${s.skills.find((x) => x.id === skillId)?.name}: ${cellWord(next)}`)
  }

  const setColumn = (skillId: string) => {
    const next = { ...cells }
    for (const p of students) if (!absent.includes(p.id)) next[cellKey(p.id, skillId)] = "met"
    setCells(next)
    setSaved(null)
    setAnnounce(`Every present student set to Met for ${s.skills.find((x) => x.id === skillId)?.name}`)
  }

  const clearColumn = (skillId: string) => {
    const next = { ...cells }
    for (const p of students) delete next[cellKey(p.id, skillId)]
    setCells(next)
    setAnnounce(`Every cell cleared for ${s.skills.find((x) => x.id === skillId)?.name}`)
  }

  const toggleAbsent = (studentId: string, on: boolean) => {
    setAbsent(on ? [...absent, studentId] : absent.filter((x) => x !== studentId))
    setSaved(null)
    setAnnounce(`${nameOf(studentId)} ${on ? "marked absent" : "marked present"}`)
  }

  const toggleSkill = (id: string, on: boolean) => {
    setSkillIds(on ? [...skillIds, id] : skillIds.filter((x) => x !== id))
    setSaved(null)
  }

  const openConfirm = () => {
    setError(null)
    setSaveFailed(false)
    if (counts.results === 0) {
      setError("Record at least one result before you save.")
      return
    }
    setConfirm(true)
  }

  const save = () => {
    setError(null)
    setSaveFailed(false)
    const r = saveLabBatch(store.getSnapshot(), input, actorId, new Date().toISOString())
    setConfirm(false)
    if (!r.ok) {
      setError(r.error)
      setSaveFailed(true)
      return
    }
    store.update(() => r.state)
    setSaved(`Saved. ${r.counts.results} ${plural(r.counts.results, "result is", "results are")} on the ${plural(r.counts.studentsWithResults, "student's record", "students' records")}.${r.counts.absent ? ` ${r.counts.absent} ${plural(r.counts.absent, "student was", "students were")} absent and ${plural(r.counts.absent, "has", "have")} no result.` : ""}`)
    setCells({})
    setAbsent([])
    setName("Skills lab, group A")
  }

  return (
    <PageFrame title="Lab sessions" subtitle={contextLine(s)}>
      <div className="flex flex-col gap-6" data-lab-grid>
        <div role="status" aria-live="polite" className="sr-only">{announce}</div>
        <div role="status" aria-live="polite" ref={savedRef} tabIndex={-1} className="flex flex-col gap-2 outline-none">
          {saved ? <LocalBanner variant="success" title="Session saved" data-lab-saved>{saved}</LocalBanner> : null}
        </div>
        {blockReason ? (
          <LocalBanner variant="warning" title="You cannot record a lab session here" data-lab-blocked>
            <p>{blockReason}</p>
          </LocalBanner>
        ) : (
          <p className="text-sm text-muted-foreground">{`Recording as ${actor?.name}, ${actor?.title.toLowerCase()}`}</p>
        )}

        <PageSection title="Session" id="session">
          <div className="grid max-w-3xl gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1">
              <Label htmlFor="lab-name">Session name</Label>
              <Input id="lab-name" value={name} maxLength={NAME_MAX + 20} disabled={!!blockReason} aria-describedby="lab-name-hint" onChange={(e) => { setName(e.target.value); setSaved(null) }} />
              <p id="lab-name-hint" className="text-xs text-muted-foreground">{`${name.trim().length} of ${NAME_MAX} characters`}</p>
            </div>
            <div className="flex flex-col gap-1">
              <Label htmlFor="lab-date">Date</Label>
              <DatePickerField id="lab-date" value={toDate(date)} fromYear={2025} toYear={2027} disabled={!!blockReason} onChange={(d) => { if (d) { setDate(fromDate(d)); setSaved(null) } }} />
            </div>
          </div>
          <fieldset className="flex flex-col gap-2" disabled={!!blockReason}>
            <legend className="text-sm font-medium text-foreground">Where it took place</legend>
            <RadioGroup aria-label="Where it took place" disabled={!!blockReason} value={setting} onValueChange={(v) => { setSetting(v as "lab" | "simulation"); setSaved(null) }} className="flex flex-wrap gap-4">
              {(["lab", "simulation"] as const).map((x) => (
                <div key={x} className="flex min-h-(--control-height-touch) items-center gap-2">
                  <RadioGroupItem id={`lab-setting-${x}`} value={x} />
                  <Label htmlFor={`lab-setting-${x}`} className="font-normal">{x === "lab" ? "Skills lab" : "Simulation"}</Label>
                </div>
              ))}
            </RadioGroup>
            <p className="text-xs text-muted-foreground">{setting === "lab" ? "Never counts toward a clinical setting." : "Never counts toward a clinical setting. Counts only up to each skill's simulation limit."}</p>
          </fieldset>
          <fieldset className="flex flex-col gap-1" disabled={!!blockReason}>
            <legend className="text-sm font-medium text-foreground">Skills in this session</legend>
            {offered.length === 0 ? <p className="text-sm text-muted-foreground">No skill is open for lab sign-off yet.</p> : null}
            <ul className="grid gap-x-6 sm:grid-cols-2" aria-label="Skills in this session">
              {offered.map(({ skill, blocked }) => (
                <li key={skill.id} className="flex min-h-(--control-height-touch) items-start gap-3 py-1.5">
                  <Checkbox id={`lab-skill-${skill.id}`} className="mt-0.5" checked={chosen.includes(skill.id)} disabled={!!blocked || !!blockReason} onCheckedChange={(v) => toggleSkill(skill.id, v === true)} />
                  <Label htmlFor={`lab-skill-${skill.id}`} className="flex flex-col items-start gap-0 font-normal">
                    <span className="text-foreground">{skill.name}</span>
                    {blocked ? <span className="text-xs text-muted-foreground">{blocked}</span> : null}
                  </Label>
                </li>
              ))}
            </ul>
          </fieldset>
        </PageSection>

        <PageSection title="Results" id="results">
          <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground" aria-label="Cell key" data-lab-key>
            <li><i className="fa-solid fa-circle-check me-1" aria-hidden="true" />Met</li>
            <li><i className="fa-light fa-circle-minus me-1" aria-hidden="true" />Not met</li>
            <li><i className="fa-light fa-comment me-1" aria-hidden="true" />Not yet</li>
            <li><i className="fa-light fa-circle me-1" aria-hidden="true" />Not recorded</li>
          </ul>
          {skills.length === 0 ? (
            <p className="text-sm text-muted-foreground" data-lab-no-skills>Choose at least one skill above to show the grid.</p>
          ) : (
            <Table scrollLabel="Lab results, students by skills" data-lab-table>
              <TableHeader>
                <TableRow>
                  <TableHead scope="col" className="min-w-40">Student</TableHead>
                  <TableHead scope="col" className="w-24">Absent</TableHead>
                  {skills.map((k) => (
                    <TableHead key={k.id} scope="col" className="min-w-40 whitespace-normal align-bottom">
                      <span className="block text-foreground">{k.name}</span>
                      <Button type="button" variant="link" size="sm" className="h-auto p-0" disabled={!!blockReason} aria-label={`Set every present student to Met for ${k.name}`} data-set-column={k.id} onClick={() => setColumn(k.id)}>Set column to Met</Button>
                      <Button type="button" variant="link" size="sm" className="ms-3 h-auto p-0" disabled={!!blockReason} aria-label={`Clear every cell for ${k.name}`} data-clear-column={k.id} onClick={() => clearColumn(k.id)}>Clear column</Button>
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.map((p) => {
                  const isAbsent = absent.includes(p.id)
                  return (
                    <TableRow key={p.id} data-lab-row={p.id} data-absent={isAbsent ? "true" : undefined}>
                      <TableHead scope="row" className="font-medium">{p.name}</TableHead>
                      <TableCell>
                        <div className="flex min-h-(--control-height-touch) items-center">
                          <Checkbox id={`absent-${p.id}`} aria-label={`${p.name} was absent`} checked={isAbsent} disabled={!!blockReason} onCheckedChange={(v) => toggleAbsent(p.id, v === true)} />
                        </div>
                      </TableCell>
                      {skills.map((k) => {
                        const v = cells[cellKey(p.id, k.id)] ?? null
                        if (isAbsent) return <TableCell key={k.id} className="text-muted-foreground" data-lab-cell="absent">Absent</TableCell>
                        const next = nextCell(v)
                        return (
                          <TableCell key={k.id} className="p-1">
                            <Button
                              type="button"
                              variant="ghost"
                              size="lg"
                              disabled={!!blockReason}
                              className={`min-h-(--control-height-touch) w-full justify-start gap-2 border border-border ${CELL_CLASS[v ?? "none"]}`}
                              aria-label={`${p.name}, ${k.name}: ${cellWord(v)}. Press to change to ${cellWord(next)}.`}
                              data-lab-cell={v ?? "none"}
                              onClick={() => press(p.id, k.id)}
                            >
                              <i className={CELL_ICON[v ?? "none"]} aria-hidden="true" />
                              <span>{cellWord(v)}</span>
                            </Button>
                          </TableCell>
                        )
                      })}
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}

          {error ? <LocalBanner variant="error" title="The session was not saved" retry={saveFailed ? { label: "Save the session again", onClick: save } : undefined} data-lab-error>{error}</LocalBanner> : null}
          <div className="sticky bottom-0 z-10 -mx-6 flex flex-col gap-3 border-t border-border bg-background px-6 py-3 sm:flex-row sm:items-center" data-lab-savebar>
            <LabTally squares={squaresOf(students, chosen, absent, cells)} />
            <div className="flex flex-col gap-1 sm:items-end">
              <Button type="button" variant="default" size="lg" className={BTN} disabled={!!blockReason || counts.results === 0} data-lab-save onClick={openConfirm}>
                {`Save ${setting === "lab" ? "lab" : "simulation"} session for ${students.length - counts.absent} ${plural(students.length - counts.absent, "student", "students")}`}
              </Button>
              <p className="text-xs text-muted-foreground">{heldForApproval.length ? `${heldForApproval.join(" and ")} wait${heldForApproval.length === 1 ? "s" : ""} for approval. ` : ""}Blank cells are not saved.</p>
            </div>
          </div>
        </PageSection>

        <PageSection title={`Saved sessions (${batches.length})`} id="saved">
          {batches.length === 0 ? (
            <p className="text-sm text-muted-foreground" data-lab-saved-empty>No session has been saved yet.</p>
          ) : (
            <ol className="flex flex-col gap-2" aria-label="Saved sessions, newest first" data-lab-batches>
              {batches.map((b) => (
                <li key={b.id} className="rounded-lg border border-border bg-card p-3 text-sm" data-lab-batch={b.id}>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium text-foreground">{b.name}</span>
                    <StatusBadge label={b.setting === "lab" ? "Skills lab" : "Simulation"} tone="neutral" icon="fa-flask" size="sm" />
                  </div>
                  <p className="text-muted-foreground">{`${b.date}, recorded by ${nameOf(b.instructorId)}. ${b.evaluationIds.length} ${plural(b.evaluationIds.length, "result", "results")} for ${b.skillIds.map((id) => s.skills.find((k) => k.id === id)?.name ?? "A skill").join(", ")}.`}</p>
                  <p className="text-muted-foreground">{b.absentIds.length ? `Absent, not assessed: ${b.absentIds.map(nameOf).join(", ")}.` : "No one was absent."}{b.blank ? ` ${b.blank} ${plural(b.blank, "cell was", "cells were")} left blank.` : ""}</p>
                </li>
              ))}
            </ol>
          )}
          <div>
            <Button asChild variant="outline" size="lg" className={BTN}>
              <Link href="/v2/admin/reports">Open the cohort reports</Link>
            </Button>
          </div>
        </PageSection>
      </div>

      <Dialog open={confirm} onOpenChange={setConfirm}>
        <DialogContent className="sm:max-w-lg" data-lab-dialog>
          <DialogHeader>
            <DialogTitle>{`Save ${counts.results} ${plural(counts.results, "result", "results")} for ${counts.studentsWithResults} ${plural(counts.studentsWithResults, "student", "students")}?`}</DialogTitle>
            <DialogDescription>
              {`${counts.blank} ${plural(counts.blank, "cell is", "cells are")} blank and ${plural(counts.blank, "is", "are")} not saved.${counts.absent ? ` ${counts.absent} ${plural(counts.absent, "student is absent and gets", "students are absent and get")} no result.` : ""} A saved session cannot be edited.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" size="lg" onClick={() => setConfirm(false)}>Keep editing</Button>
            <Button type="button" variant="default" size="lg" data-lab-confirm onClick={save}>{`Save ${counts.results} ${plural(counts.results, "result", "results")}`}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageFrame>
  )
}
