"use client"

/**
 * Individual skills (Sankalp's Thursday flow A5: "assign skills to student groups either one skill at a time or assign a group of
 * skills"). No group of skills is needed (A4 is optional). Only configured, active skills can be assigned (REQ IM-09, SL-11,
 * D-X14). Each student group's picks are stored as that group's individual list (lib/lab/lists.ts setIndividualSkills), so course
 * mapping inherits them like a group of skills (D-X27): a cohort's clinical offerings offer each picked skill, "Set by list" at
 * Optional until course mapping sets a level.
 *
 *  - IndividualAssign (variant A, assign step): pick skills first, then tick the student groups that get them.
 *  - IndividualSkills (variant B's side panel): one student group fixed, tick its skills.
 */
import * as React from "react"
import { TYPE } from "@/components/lab/type-scale"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import { Checkbox as CheckboxDs } from "@exxatdesignux/ui/components/ui/checkbox"
import { FieldLegend, FieldSet } from "@exxatdesignux/ui/components/ui/field"
import { Input } from "@exxatdesignux/ui/components/ui/input"
import { Label } from "@exxatdesignux/ui/components/ui/label"
import { clinicalOfferingsFor, individualSkillsFor, inheritableSkillIds, setIndividualSkills, type StudentGroup } from "@/lib/lab/lists"
import { aNoun, skillNoun, skillNounPlural } from "@/lib/lab/terms"
import type { Skill } from "@/lib/v2/types"
import { fmt, plural } from "./parts"
import { GROUP_KIND_LABEL, type ListsModel } from "./lists-parts"

/** Rows the picker shows at once; the search narrows the rest (150+ configured skills would be one long scroll). */
const PICKER_ROWS = 40
const NOUN = () => ({ noun: skillNoun(), nounPlural: skillNounPlural() })

/** Configured, active skills: the only ones a course can offer (same test as course mapping's inheritance). */
function useAssignable(model: ListsModel): Skill[] {
  return React.useMemo(() => {
    const ids = new Set(inheritableSkillIds(model.state, { skillIds: model.state.skills.map((k) => k.id) }))
    return model.state.skills.filter((k) => ids.has(k.id))
  }, [model.state])
}

function SkillPicker({ skills, selected, onToggle, label, idPrefix }: { skills: Skill[]; selected: ReadonlySet<string>; onToggle: (id: string, on: boolean) => void; label: string; idPrefix: string }) {
  const [query, setQuery] = React.useState("")
  const q = query.trim().toLowerCase()
  const matches = skills.filter((k) => !q || k.name.toLowerCase().includes(q) || k.category.toLowerCase().includes(q))
  const shown = [...matches.filter((k) => selected.has(k.id)), ...matches.filter((k) => !selected.has(k.id))].slice(0, PICKER_ROWS)
  return (
    <div className="flex min-w-0 flex-col gap-3" data-skill-picker>
      <div className="flex flex-col gap-2">
        <Label htmlFor={`${idPrefix}-find`}>{`Find ${aNoun()}`}</Label>
        <Input id={`${idPrefix}-find`} type="search" value={query} onChange={(e) => setQuery(e.target.value)} className="w-full" placeholder="Name or category" />
        <p className="text-xs text-muted-foreground tabular-nums" role="status" aria-live="polite">{`${fmt(selected.size)} selected · ${fmt(matches.length)} configured ${matches.length === 1 ? skillNoun() : skillNounPlural()}`}</p>
      </div>
      <ul className="flex max-h-[26rem] flex-col overflow-y-auto rounded-[var(--radius)] border border-border px-3" aria-label={label}>
        {shown.map((k) => {
          const id = `${idPrefix}-${k.id}`
          return (
            <li key={k.id} className="flex min-h-11 items-center gap-3 border-b border-border py-2 last:border-b-0">
              <CheckboxDs id={id} checked={selected.has(k.id)} onCheckedChange={(v) => onToggle(k.id, v === true)} />
              <Label htmlFor={id} className="flex min-w-0 flex-1 flex-wrap items-baseline gap-x-3 font-normal">
                <span className="font-medium text-foreground">{k.name}</span>
                <span className="text-sm text-muted-foreground">{k.category}</span>
              </Label>
            </li>
          )
        })}
        {!shown.length ? <li className="py-3 text-sm text-muted-foreground">{`No configured ${skillNounPlural()} match. Clear the search.`}</li> : null}
        {matches.length > shown.length ? <li className="py-2 text-xs text-muted-foreground">{`Showing ${fmt(shown.length)} of ${fmt(matches.length)}. Search to find the rest.`}</li> : null}
      </ul>
    </div>
  )
}

/** One student group fixed (variant B's side panel): tick the skills it gets. */
export function IndividualSkills({ model, group }: { model: ListsModel; group: StudentGroup }) {
  const skills = useAssignable(model)
  const chosen = individualSkillsFor(model.lists, group.id)
  const toggle = (id: string, on: boolean) => {
    const next = on ? [...chosen, id] : chosen.filter((x) => x !== id)
    model.setLists(setIndividualSkills(model.lists, group, next, NOUN()))
  }
  return <SkillPicker skills={skills} selected={new Set(chosen)} onToggle={toggle} label={`${skillNounPlural()} for ${group.label}`} idPrefix={`individual-${group.id.replace(/[^a-z0-9]+/gi, "-")}`} />
}

function groupMeta(model: ListsModel, g: StudentGroup): string {
  const students = plural(g.studentIds.length, "student", "students")
  const courses = clinicalOfferingsFor(model.state, g)
  const own = individualSkillsFor(model.lists, g.id).length
  const base = courses === null ? `${GROUP_KIND_LABEL[g.kind]} · ${students}` : `${students} · ${plural(courses, "clinical course", "clinical courses")}`
  return own ? `${base} · ${plural(own, `${skillNoun()} assigned`, `${skillNounPlural()} assigned`)}` : base
}

/**
 * Skills first, then the student groups that get them (variant A, assign step). A group is ticked when it has every picked skill;
 * ticking adds the picked skills to that group, unticking removes them. Cohorts first, then tracks and custom groups with Create a
 * group beside that heading (same order as the group-of-skills path).
 */
export function IndividualAssign({ model, onCreateGroup }: { model: ListsModel; onCreateGroup: () => void }) {
  const skills = useAssignable(model)
  const [picked, setPicked] = React.useState<string[]>([])
  const pickedSet = new Set(picked)
  const togglePick = (id: string, on: boolean) => setPicked((p) => (on ? [...p, id] : p.filter((x) => x !== id)))
  const hasAll = (g: StudentGroup) => picked.length > 0 && picked.every((id) => individualSkillsFor(model.lists, g.id).includes(id))
  const hasSome = (g: StudentGroup) => picked.some((id) => individualSkillsFor(model.lists, g.id).includes(id))
  const toggleGroup = (g: StudentGroup, on: boolean) => {
    const cur = individualSkillsFor(model.lists, g.id)
    const next = on ? [...cur, ...picked.filter((id) => !cur.includes(id))] : cur.filter((id) => !pickedSet.has(id))
    model.setLists(setIndividualSkills(model.lists, g, next, NOUN()))
  }
  const cohorts = model.groups.filter((g) => g.kind === "cohort")
  const others = model.groups.filter((g) => g.kind !== "cohort")
  const rows = (gs: StudentGroup[]) => (
    <ul className="flex flex-col">
      {gs.map((g) => {
        const id = `individual-group-${g.id.replace(/[^a-z0-9]+/gi, "-")}`
        const all = hasAll(g)
        return (
          <li key={g.id} className="flex min-h-11 items-center gap-3 border-b border-border py-2 last:border-b-0">
            <CheckboxDs id={id} disabled={!picked.length} checked={all ? true : hasSome(g) ? "indeterminate" : false} onCheckedChange={(v) => toggleGroup(g, v === true)} />
            <Label htmlFor={id} className="flex min-w-0 flex-1 flex-wrap items-baseline gap-x-3 gap-y-0.5 font-normal">
              <span className="font-medium text-foreground">{g.label}</span>
              <span className="text-sm text-muted-foreground tabular-nums">{groupMeta(model, g)}</span>
            </Label>
          </li>
        )
      })}
    </ul>
  )
  return (
    <div className="grid min-w-0 gap-6 @min-[60rem]:grid-cols-2" data-individual-assign>
      <FieldSet className="min-w-0">
        <FieldLegend className={TYPE.section}>{`1. ${skillNounPlural().charAt(0).toUpperCase()}${skillNounPlural().slice(1)}`}</FieldLegend>
        <SkillPicker skills={skills} selected={pickedSet} onToggle={togglePick} label={`${skillNounPlural()} to assign`} idPrefix="individual-pick" />
      </FieldSet>
      <FieldSet className="min-w-0">
        <FieldLegend className={TYPE.section}>2. Student groups</FieldLegend>
        {!picked.length ? (
          <p className="text-sm text-muted-foreground" data-pick-first>{`Pick at least one ${skillNoun()}, then the groups that get it.`}</p>
        ) : (
          <p className="text-sm text-foreground" data-assign-consequence>{`A cohort's clinical courses offer the ${picked.length === 1 ? `picked ${skillNoun()}` : `${fmt(picked.length)} picked ${skillNounPlural()}`}.`}</p>
        )}
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-1">
            <p className="text-xs font-medium text-muted-foreground" id="individual-cohorts">Cohorts</p>
            <div role="group" aria-labelledby="individual-cohorts">{rows(cohorts)}</div>
          </div>
          <div className="flex flex-col gap-1">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs font-medium text-muted-foreground" id="individual-others">Tracks and custom groups</p>
              <Button type="button" variant="outline" size="sm" onClick={onCreateGroup}>Create a group</Button>
            </div>
            <div role="group" aria-labelledby="individual-others">
              {others.length ? rows(others) : <p className="py-2 text-sm text-muted-foreground">No tracks or custom groups yet.</p>}
            </div>
          </div>
        </div>
      </FieldSet>
    </div>
  )
}

/** The footer line for the individual path: how many groups have skills assigned one at a time, 10 words or fewer. */
export function individualFooterLine(model: ListsModel): string {
  const withSkills = model.groups.filter((g) => individualSkillsFor(model.lists, g.id).length > 0)
  if (!withSkills.length) return `No ${skillNounPlural()} assigned one at a time yet`
  const n = new Set(withSkills.flatMap((g) => individualSkillsFor(model.lists, g.id))).size
  return `${plural(n, skillNoun(), skillNounPlural())} assigned to ${plural(withSkills.length, "group", "groups")}`
}
