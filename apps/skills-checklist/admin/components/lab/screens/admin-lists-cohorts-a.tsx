"use client"

/**
 * Lists and cohort assignment A (recommended): one group of skills ("list" in code) at a time.
 *
 * Assign mode (set-up flow step, Guided set; Sankalp 2026-10-27 review and his Thursday flow A4/A5): ONE job, assigning skills to
 * student groups. One question, "Which students use this group of skills?" (D-L6; 2026-10-30 review: the "group or individual"
 * radio at the top was a second decision before the work). Individual skills stay one quiet link away (A5 is kept, not dropped):
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@exxatdesignux/ui/components/ui/select"
import { FieldLegend, FieldSet } from "@exxatdesignux/ui/components/ui/field"
import { Label } from "@exxatdesignux/ui/components/ui/label"
import { listById, listsHref, skillGroups, type SkillList } from "@/lib/lab/lists"
import { skillNounPlural } from "@/lib/lab/terms"
import { GROUPS_STEP, ListsFrame, type ListsContext } from "@/components/lab/admin-a/lists-frame"
import { useLabLinkContext } from "@/components/lab/lab-bar/page-context"
import { AssignChecklist, AssignConsequence, ListStatus, ListsTable, RuleDialog, assignFooterLine, listSize } from "@/components/lab/admin-a/lists-parts"
import { IndividualAssign, individualFooterLine } from "@/components/lab/admin-a/lists-individual"
import { PaneHeading } from "@/components/lab/admin-a/parts"

export function AdminListsCohortsA() {
  return (
    <ListsFrame variant="A" footerContext={footerLine}>
      {(c) => (c.mode === "assign" ? <AssignOne c={c} /> : <ListFirst c={c} />)}
    </ListsFrame>
  )
}

const byIndividual = (c: ListsContext) => c.mode === "assign" && c.query.get("by") === "skills"

function footerLine(c: ListsContext): string | null {
  if (byIndividual(c)) return individualFooterLine(c.model)
  const l = selectedList(c)
  return l ? assignFooterLine(c.model, l) : null
}

const selectedList = (c: ListsContext): SkillList | undefined => {
  const groups = skillGroups(c.model.lists)
  return listById(groups, c.query.get("list")) ?? groups.find((l) => l.isDefault) ?? groups[0]
}

/** Checklist beside what it does: two columns once the page is wide enough (decision D-X30, no white space at 1920). */
function AssignColumns({ c, list }: { c: ListsContext; list: SkillList }) {
  const { model, actions } = c
  return (
    // The panel sits right beside the rows it explains (2026-10-30 review: it floated a column away): the checklist keeps a
    // readable width and the panel takes the rest of the row, so nothing is left empty at 1920 (D-X30).
    <div className="grid min-w-0 gap-6 @min-[60rem]:grid-cols-[minmax(0,40rem)_minmax(20rem,1fr)]">
      <FieldSet className="min-w-0">
        <FieldLegend className={TYPE.section}>{`Which students use this group of ${skillNounPlural()}?`}</FieldLegend>
        <AssignChecklist model={model} list={list} onToggle={(g, on) => actions.toggle(list.id, g, on)} onCreateGroup={actions.openGroup} idPrefix={`assign-${list.id}`} />
      </FieldSet>
      <div className="min-w-0 @min-[60rem]:pt-8">
        <AssignConsequence model={model} list={list} />
      </div>
    </div>
  )
}

function AssignOne({ c }: { c: ListsContext }) {
  const list = selectedList(c)
  const individual = byIndividual(c) || !list
  const nounPl = skillNounPlural()
  return (
    <div className="flex flex-col gap-8" data-lists-assign data-assign-by={individual ? "skills" : "group"}>
      {individual ? (
        <>
          {list ? (
            <Button type="button" variant="link" size="sm" className="h-auto self-start p-0" onClick={() => c.query.set({ by: undefined })}>{`Assign a group of ${nounPl} instead`}</Button>
          ) : null}
          <IndividualAssign model={c.model} onCreateGroup={c.actions.openGroup} />
        </>
      ) : list ? (
        <>
          <section aria-label={`Group of ${nounPl}`} className="flex flex-col gap-2">
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
              <span className="text-sm text-muted-foreground tabular-nums" data-list-size>{listSize(list)}</span>
              {list.isDefault ? <Badge variant="secondary">Default</Badge> : null}
              <Button type="button" variant="link" size="sm" className="ms-auto h-auto p-0" onClick={() => c.query.set({ by: "skills" })}>{`Assign individual ${nounPl} instead`}</Button>
            </div>
          </section>
          <AssignColumns c={c} list={list} />
        </>
      ) : null}
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
