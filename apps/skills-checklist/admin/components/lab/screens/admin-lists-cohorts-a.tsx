"use client"

/**
 * Lists and cohort assignment A (recommended): one group of skills ("list" in code) at a time.
 *
 * Assign mode (set-up flow step, Guided set; Sankalp 2026-10-27 review and his Thursday flow A4/A5): ONE job, assigning skills to
 * student groups. One question, "Which students use this group of skills?" (D-L6; 2026-10-30 review: the "group or individual"
 * radio at the top was a second decision before the work). 2026-11-03 (Romit: the far-right "instead" link read as isolated): the two
 * ways are one "Assign" segmented choice at the top, the chosen way's control directly beneath it (A5 is kept, not dropped):
 *  - "A group of skills": the group of skills is context (name, size, required to graduate, a quiet switch), the checklist of
 *    cohorts and groups is the work, and one panel says what it does now [CALL 10-26 "define the skills once, tag them to a
 *    cohort"; LEDGER D-X27].
 *  - "Individual skills": no group of skills needed (A4 is optional); pick a student group, then the skills, one at a time.
 * The page title is the flow step's own label. No list management, no reporting figures, no completion rule.
 *
 * Manage mode (standalone "Groups of skills" screen): the table, then the selected group of skills' checklist and the same panel.
 * Make default, a new group of skills from this one and the completion rule (a proposal, not REQ) sit in one More menu.
 * URL: ?list=, ?by=skills, ?group=, ?view=assign. Demo states: ?state=loading | empty | error.
 */
import * as React from "react"
import { TYPE } from "@/components/lab/type-scale"
import { Badge } from "@exxatdesignux/ui/components/ui/badge"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@exxatdesignux/ui/components/ui/dropdown-menu"
import { ViewSegmentedControl } from "@exxatdesignux/ui/components/ui/view-segmented-control"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@exxatdesignux/ui/components/ui/select"
import { FieldLegend, FieldSet } from "@exxatdesignux/ui/components/ui/field"
import { Label } from "@exxatdesignux/ui/components/ui/label"
import { listById, listsHref, skillGroups, type SkillList } from "@/lib/lab/lists"
import { skillNounPlural } from "@/lib/lab/terms"
import { GROUPS_STEP, ListsFrame, type ListsContext } from "@/components/lab/admin-a/lists-frame"
import { useLabLinkContext } from "@/components/lab/lab-bar/page-context"
import { AssignChecklist, ListStatus, ListsTable, RuleDialog, listSize } from "@/components/lab/admin-a/lists-parts"
import { IndividualAssign } from "@/components/lab/admin-a/lists-individual"
import { PaneHeading } from "@/components/lab/admin-a/parts"
import { useEmbeddedStep } from "@/components/lab/layout/embedded"

export function AdminListsCohortsA() {
  return (
    <ListsFrame variant="A">
      {(c) => (c.mode === "assign" ? <AssignOne c={c} /> : <ListFirst c={c} />)}
    </ListsFrame>
  )
}

const byIndividual = (c: ListsContext) => c.mode === "assign" && c.query.get("by") === "skills"

const selectedList = (c: ListsContext): SkillList | undefined => {
  const groups = skillGroups(c.model.lists)
  return listById(groups, c.query.get("list")) ?? groups.find((l) => l.isDefault) ?? groups[0]
}

/** Which students use this group of skills: the checklist, full width. Labels and controls only (Romit 2026-11-02, no subtext). */
function AssignColumns({ c, list }: { c: ListsContext; list: SkillList }) {
  const { model, actions } = c
  // Inside Set up skills the step heading is the section title, so the question sits one step below it (D-L44).
  const inWorkflow = useEmbeddedStep() !== null
  return (
    <FieldSet className="min-w-0">
      <FieldLegend className={inWorkflow ? TYPE.card : TYPE.section}>{`Which students use this group of ${skillNounPlural()}?`}</FieldLegend>
      <AssignChecklist model={model} list={list} onToggle={(g, on) => actions.toggle(list.id, g, on)} onCreateGroup={actions.openGroup} idPrefix={`assign-${list.id}`} />
    </FieldSet>
  )
}

type AssignBy = "group" | "skills"

/**
 * The two ways to assign as one visible choice (Romit 2026-11-03: the far-right "instead" link read as isolated). "Assign" names
 * a DS ViewSegmentedControl (radiogroup, arrow keys, Home and End); the control for the chosen way sits directly beneath it, on
 * the same left edge. The choice is the URL's `by` (absent: a group of skills; `skills`: individual skills), both ways.
 */
function AssignByChoice({ c, by }: { c: ListsContext; by: AssignBy }) {
  const nounPl = skillNounPlural()
  const options = [
    { value: "group", label: `A group of ${nounPl}` },
    { value: "skills", label: `Individual ${nounPl}` },
  ] as const
  return (
    <div className="flex flex-col gap-2" data-assign-choice>
      <span className="text-sm font-medium leading-none text-foreground" aria-hidden="true">Assign</span>
      <ViewSegmentedControl<AssignBy> aria-label="Assign" value={by} onValueChange={(v) => c.query.set({ by: v === "skills" ? "skills" : undefined })} options={options} />
    </div>
  )
}

export function AssignOne({ c }: { c: ListsContext }) {
  const list = selectedList(c)
  const individual = byIndividual(c) || !list
  const nounPl = skillNounPlural()
  return (
    <div className="flex flex-col gap-8" data-lists-assign data-assign-by={individual ? "skills" : "group"}>
      <section aria-label="How to assign" className="flex flex-col gap-4">
        {/* With no group of skills yet there is nothing to choose: individual skills is the only way. */}
        {list ? <AssignByChoice c={c} by={individual ? "skills" : "group"} /> : null}
        {!individual && list ? (
          <div className="flex flex-col gap-2">
            <Label htmlFor="assign-list">{`Group of ${nounPl}`}</Label>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              <Select value={list.id} onValueChange={(id) => c.query.set({ list: id })}>
                <SelectTrigger id="assign-list" className="w-full sm:w-96">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {skillGroups(c.model.lists).map((l) => (
                    <SelectItem key={l.id} value={l.id}>{l.status === "draft" ? `${l.name} (draft)` : l.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {list.isDefault ? <Badge variant="secondary">Default</Badge> : null}
            </div>
          </div>
        ) : (
          <IndividualAssign model={c.model} onCreateGroup={c.actions.openGroup} />
        )}
      </section>
      {!individual && list ? <AssignColumns c={c} list={list} /> : null}
    </div>
  )
}

function ListFirst({ c }: { c: ListsContext }) {
  const { model, actions, query } = c
  const selected = selectedList(c)
  const [ruleOpen, setRuleOpen] = React.useState(false)
  const hrefFor = React.useCallback((id: string) => listsHref({ list: id }), [])
  const link = useLabLinkContext()
  if (!selected) return null
  // The set-up flow's optional step (Sankalp's A4) does one job, making groups of skills: the table and New group of skills only.
  // Who uses each group is the next step's job.
  if (link.onFlowRoute && link.stepId === GROUPS_STEP)
    return <ListsTable model={model} selectedId={selected.id} hrefFor={hrefFor} onSelect={(id) => query.set({ list: id })} />
  return (
    <>
      <ListsTable model={model} selectedId={selected.id} hrefFor={hrefFor} onSelect={(id) => query.set({ list: id })} />
      <section aria-labelledby="list-heading" className="@container flex flex-col gap-4" data-region="list-detail">
        <PaneHeading
          title={<span id="list-heading">{selected.name}</span>}
          meta={
            <span className="inline-flex flex-wrap items-center gap-2">
              <span className="tabular-nums">{listSize(selected)}</span>
              {selected.isDefault ? <Badge variant="secondary">Default</Badge> : null}
              <ListStatus list={selected} />
            </span>
          }
          end={
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button type="button" variant="outline" size="sm">More</Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {!selected.isDefault ? <DropdownMenuItem onSelect={() => actions.requestDefault(selected.id)}>Make default</DropdownMenuItem> : null}
                <DropdownMenuItem onSelect={() => actions.openNew(selected.id)}>{`New group of ${skillNounPlural()} from this one`}</DropdownMenuItem>
                <DropdownMenuItem onSelect={() => setRuleOpen(true)}>Completion rule</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          }
        />
        <p className="text-xs text-muted-foreground" data-standards-pointer>Standards are managed in Program details.</p>
        <AssignColumns c={c} list={selected} />
      </section>
      <RuleDialog model={model} list={selected} open={ruleOpen} onClose={() => setRuleOpen(false)} onSaved={actions.setFeedback} />
    </>
  )
}
