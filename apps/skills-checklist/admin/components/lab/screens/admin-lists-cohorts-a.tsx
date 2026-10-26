"use client"

/**
 * Lists and cohort assignment A (recommended): list first. Each list is an object (name, what it holds, size, required, default,
 * live or draft). Select one to check off the student groups it applies to (cohorts and tracks; cohort is a filter, not the owner)
 * and to set its completion rule, with each group's standing and "what would change" before saving [CALL; BUILD-PROMPT admassign].
 * A new standard is a new list ("Start a new list"); the live list is never edited in place. Standards themselves are managed in
 * Program details (one quiet pointer, no standards fields [CALL 10-26 B.12]). "Create a group" (the same dialog as B) adds a custom
 * group from rules; it joins the groups table below. Regions: header, lists table, list detail.
 * URL: ?list=. Demo states: ?state=loading | empty | error.
 */
import * as React from "react"
import { LabLink as Link } from "@/components/lab/lab-bar/lab-link"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import { Tip } from "@exxatdesignux/ui/components/ui/tip"
import { countNoun, listById, listsHref } from "@/lib/lab/lists"
import { ListsFrame, type ListsContext } from "@/components/lab/admin-a/lists-frame"
import { GroupsForList, ListsTable, RuleCard } from "@/components/lab/admin-a/lists-parts"
import { PaneHeading, fmt } from "@/components/lab/admin-a/parts"
import { LAB_ADMIN } from "@/lib/lab/library"

export function AdminListsCohortsA() {
  return <ListsFrame variant="A">{(c) => <ListFirst c={c} />}</ListsFrame>
}

function ListFirst({ c }: { c: ListsContext }) {
  const { model, actions, query } = c
  const selected = listById(model.lists, query.get("list")) ?? model.lists.find((l) => l.isDefault) ?? model.lists[0]
  const hrefFor = React.useCallback((id: string) => listsHref({ list: id }), [])
  if (!selected) return null
  return (
    <>
      <ListsTable model={model} selectedId={selected.id} hrefFor={hrefFor} onSelect={(id) => query.set({ list: id })} />
      <section aria-labelledby="list-heading" className="flex flex-col gap-4" data-region="list-detail">
        <PaneHeading
          title={<span id="list-heading">{selected.name}</span>}
          meta={
            <>
              {`Holds ${selected.nounPlural} · `}
              <Link className="font-medium text-foreground underline-offset-2 hover:underline" href={`${LAB_ADMIN}/skills-library`}>{countNoun(selected, selected.skillIds.length)}</Link>
              {`, ${fmt(selected.requiredIds.length)} required`}
            </>
          }
          end={
            <>
              {!selected.isDefault ? <Button type="button" variant="outline" size="sm" onClick={() => actions.requestDefault(selected.id)}>Make default</Button> : null}
              <Button type="button" variant="outline" size="sm" onClick={actions.openGroup}>Create a group</Button>
              {selected.status === "live" ? (
                <Tip label={`The ${selected.nounPlural} on a live list stay fixed so evidence keeps its meaning. To change them, start a new draft list.`}>
                  <Button type="button" variant="ghost" size="sm" onClick={() => actions.openNew(selected.id)}>Start a new list</Button>
                </Tip>
              ) : null}
            </>
          }
        />
        <p className="text-xs text-muted-foreground" data-standards-pointer>Standards are managed in Program details.</p>
        <div className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
          <GroupsForList model={model} list={selected} onToggle={(g, on) => actions.toggle(selected.id, g, on)} />
          <RuleCard model={model} list={selected} onSaved={actions.setFeedback} />
        </div>
      </section>
    </>
  )
}
