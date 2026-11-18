"use client"

/**
 * New skill list as one short right-side panel (D-LS1116-e, Decided, Romit 2026-11-16 "can you do the new skill list in a panel?"; it was a centred dialog). Content: D-LS1116-d, Decided, Romit 2026-11-16; [CALL 11-16] Sankalp, Granola f3cecc8a ch 2-3, 17-18): a name, then who uses it,
 * then Create, which closes the panel and stays on the Skill lists page with a banner (D-LS1116-f, Romit 2026-11-16). Romit 2026-11-16 on the first version: "looks long and complicated for a user". So: the name is the one field
 * in view; a description only on request; Who uses it is two choices, All students or Specific cohorts, and the cohort picker shows only for the second. The
 * picks are said once, in the trigger. A cohort another list has moves to this one (one list per cohort, prototype 11-16 [22]); that is said in one line.
 * Duplicate opens the same dialog with "{name} (copy)", the source's skills and no cohort picked (D-LS1116-a).
 */
import * as React from "react"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import { FloatingSheetPanelBody, FloatingSheetPanelContent, FloatingSheetPanelHeader, FloatingSheetPanelToolbar, FloatingSheetPanelWorkflowFooter } from "@exxatdesignux/ui/components/ui/floating-sheet-panel"
import { FloatingSheetPanel } from "@/components/lab/shared/sheet"
import { Field, FieldError, FieldLabel } from "@exxatdesignux/ui/components/ui/field"
import { Input } from "@exxatdesignux/ui/components/ui/input"
import { ViewSegmentedControl } from "@exxatdesignux/ui/components/ui/view-segmented-control"
import { Popover, PopoverContent, PopoverTrigger } from "@exxatdesignux/ui/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@exxatdesignux/ui/components/ui/command"
import { Checkbox } from "@exxatdesignux/ui/components/ui/checkbox"
import { ABOVE_PANEL_MENU } from "@/components/lab/overlay-layer"
import { DiscardChangesDialog } from "@/components/lab/shared/unsaved-guard"
import { useLabLinkContext } from "@/components/lab/lab-bar/page-context"
import { listSkillsHref } from "@/lib/lab/admin-ia"
import { ALL_STUDENTS_GROUP, LIST_NAME_MAX, copyName, createList, detachGroup, groupLabel, namesOf, skillLists, validateNewList, type SkillList, type StudentGroup } from "@/lib/lab/lists"
import { skillListNoun, skillNoun, skillNounPlural } from "@/lib/lab/terms"
import type { ListsModel } from "./lists-parts"

type Who = "all" | "specific"

const WHO_OPTIONS = [{ value: "all", label: "All students" }, { value: "specific", label: "Specific cohorts" }] as const satisfies readonly { value: Who; label: string }[]

const KIND_HEADING: Record<string, string> = { cohort: "Cohorts", track: "Tracks", custom: "Groups" }

/** The lists (other than `exceptId`) that a cohort or group is on now. */
const listsOnGroup = (lists: readonly SkillList[], groupId: string, exceptId?: string): SkillList[] => skillLists(lists).filter((l) => l.id !== exceptId && l.groupIds.includes(groupId))

/** The picks as one line: up to two names, then "+n". */
function picksText(groups: readonly StudentGroup[], ids: readonly string[]): string {
  const names = ids.map((id) => groupLabel(groups, id))
  return names.length <= 2 ? names.join(", ") : `${names.slice(0, 2).join(", ")} +${names.length - 2}`
}

export function NewListDialog({ model, copyOf, onClose, onCreated, onRestoreFocus }: {
  model: ListsModel
  /** Duplicate: the list whose skills the new one starts with. */
  copyOf?: SkillList | null
  onClose: () => void
  /** The list is on the program; the caller closes the panel, stays on the page and says so, with `skillsHref` as the next step. */
  onCreated: (list: SkillList, skillsHref: string) => void
  /** Where focus goes when the panel closes (the control that opened it). */
  onRestoreFocus?: () => void
}) {
  const link = useLabLinkContext()
  const groups = model.groups
  const [name, setName] = React.useState(() => (copyOf ? copyName(model.lists, copyOf.name) : ""))
  const [describing, setDescribing] = React.useState(false)
  const [description, setDescription] = React.useState("")
  // All students by default (Romit 2026-11-16); a duplicate starts on no one, so it asks for its cohorts (prototype 11-16 F4).
  const [who, setWho] = React.useState<Who>(copyOf ? "specific" : "all")
  const [picks, setPicks] = React.useState<string[]>([])
  const [open, setOpen] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [whoError, setWhoError] = React.useState<string | null>(null)
  const [asking, setAsking] = React.useState(false)
  const typed = (copyOf ? false : name.trim() !== "") || description.trim() !== "" || picks.length > 0
  const groupIds = who === "all" ? [ALL_STUDENTS_GROUP] : picks
  // A picked cohort leaves the list it was on; no line says so (Romit 2026-11-16, D-LS1116-g).
  const close = () => (typed ? setAsking(true) : onClose())
  const toggle = (id: string) => { setWhoError(null); setPicks((now) => (now.includes(id) ? now.filter((x) => x !== id) : [...now, id])) }
  const create = () => {
    const noun = skillNoun()
    const input = { name, noun, nounPlural: skillNounPlural(), standard: describing ? description : "", fromListId: copyOf?.id ?? null }
    const err = validateNewList(model.lists, input)
    // A new list names who uses it; a duplicate may start on no one.
    const noWho = who === "specific" && picks.length === 0 && !copyOf ? "Choose at least one cohort." : null
    setError(err)
    setWhoError(noWho)
    if (err) { document.getElementById("new-list-name")?.focus(); return }
    if (noWho) { document.getElementById("new-list-cohorts")?.focus(); return }
    const base = createList(model.lists, input, `list-${Date.now().toString(36)}`)
    // The program's first list is its default (new student groups get it), even before it holds skills.
    const list: SkillList = { ...base, groupIds: [...groupIds], isDefault: skillLists(model.lists).length === 0 }
    // One list per cohort: a picked cohort leaves the list it was on (D-LS1116-d).
    const moved = who === "specific" ? (ls: SkillList[]) => picks.reduce((acc, id) => detachGroup(acc, id), ls) : (ls: SkillList[]) => ls
    model.applyNow((ls) => [...moved(ls), list])
    // Stay on the Skill lists page (Romit 2026-11-16, D-LS1116-f): the caller closes the panel and says so in a banner whose action opens this list's skills page.
    onCreated(list, listSkillsHref(list.id, link))
  }
  const kinds = (["cohort", "track", "custom"] as const).filter((k) => groups.some((g) => g.kind === k))
  return (
    <>
      <FloatingSheetPanel open onOpenChange={(o) => { if (!o) close() }}>
        <FloatingSheetPanelContent
          side="right"
          size="md"
          contentSlot="lab-admin-list-new"
          data-new-list-dialog
          onOpenAutoFocus={(e) => { e.preventDefault(); document.getElementById("new-list-name")?.focus() }}
          onCloseAutoFocus={(e) => { e.preventDefault(); onRestoreFocus?.() }}
          onInteractOutside={(e) => {
            // The cohort menu and the discard question sit outside the panel's DOM but belong to it.
            const t = (e.detail.originalEvent.target as Element | null) ?? null
            if (t && (!t.isConnected || t.closest("[data-slot=popover-content], [data-radix-popper-content-wrapper], [data-slot=alert-dialog-overlay], [role=alertdialog]"))) e.preventDefault()
          }}
        >
          <FloatingSheetPanelToolbar closeLabel="Close" showSize={false} />
          <FloatingSheetPanelHeader title={copyOf ? `Duplicate ${copyOf.name}` : `New ${skillListNoun()}`} />
          <FloatingSheetPanelBody className="flex min-w-0 flex-col gap-4 px-4 pb-4 pt-1">
          <form id="new-list-form" className="flex flex-col gap-4" onSubmit={(e) => { e.preventDefault(); create() }} noValidate>
            <Field data-invalid={error ? true : undefined}>
              <FieldLabel htmlFor="new-list-name">Name</FieldLabel>
              <Input id="new-list-name" value={name} maxLength={LIST_NAME_MAX + 20} onChange={(e) => { setName(e.target.value); setError(null) }} aria-invalid={!!error} aria-describedby={error ? "new-list-name-error" : undefined} autoComplete="off" />
              {error ? <FieldError id="new-list-name-error">{error}</FieldError> : null}
              {describing ? null : (
                <div className="flex justify-start">
                <Button type="button" variant="link" size="sm" className="h-auto p-0 font-normal" onClick={() => { setDescribing(true); requestAnimationFrame(() => document.getElementById("new-list-description")?.focus()) }} data-add-description>
                  Add a description
                </Button>
                </div>
              )}
            </Field>
            {describing ? (
              <Field>
                <FieldLabel htmlFor="new-list-description">Description</FieldLabel>
                <Input id="new-list-description" value={description} onChange={(e) => setDescription(e.target.value)} autoComplete="off" />
              </Field>
            ) : null}
            <Field data-invalid={whoError ? true : undefined}>
              <FieldLabel id="new-list-who-label">Who uses it</FieldLabel>
              <div data-who>
              <ViewSegmentedControl
                value={who}
                onValueChange={(v) => { setWho(v); setWhoError(null) }}
                aria-label="Who uses it"
                options={WHO_OPTIONS}
                className="flex w-full [&>*]:min-h-10 [&>*]:flex-1 [&>*]:justify-center [&>*]:text-sm"
              />
              </div>
              {who === "specific" ? (
                <Popover open={open} onOpenChange={setOpen}>
                  <PopoverTrigger asChild>
                    <Button id="new-list-cohorts" type="button" variant="outline" size="default" className="w-full justify-between font-normal" aria-label={picks.length ? `Cohorts: ${picks.map((id) => groupLabel(groups, id)).join(", ")}` : "Choose cohorts"} aria-invalid={!!whoError} aria-describedby={whoError ? "new-list-who-error" : undefined} data-who-trigger>
                      <span className={picks.length ? "truncate" : "truncate text-muted-foreground"}>{picks.length ? picksText(groups, picks) : "Choose cohorts"}</span>
                      <i className="fa-light fa-chevron-down text-xs" aria-hidden="true" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent align="start" className={`${ABOVE_PANEL_MENU} w-[var(--radix-popover-trigger-width)] p-0`}>
                    <Command>
                      <CommandInput placeholder="Find a cohort or group" aria-label="Find a cohort or group" />
                      <CommandList>
                        <CommandEmpty>No cohort or group matches.</CommandEmpty>
                        {kinds.map((k) => (
                          <CommandGroup key={k} heading={KIND_HEADING[k]}>
                            {groups.filter((g) => g.kind === k).map((g) => {
                              const uses = listsOnGroup(model.lists, g.id)
                              return (
                                <CommandItem key={g.id} value={g.label} onSelect={() => toggle(g.id)} data-who-option={g.id}>
                                  <Checkbox checked={picks.includes(g.id)} aria-hidden="true" tabIndex={-1} className="pointer-events-none" />
                                  <span className="flex min-w-0 flex-col">
                                    <span>{g.label}</span>
                                    {uses.length ? <span className="truncate text-xs text-muted-foreground">{`Uses ${namesOf(uses.map((l) => l.name))}`}</span> : null}
                                  </span>
                                </CommandItem>
                              )
                            })}
                          </CommandGroup>
                        ))}
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              ) : null}
              {whoError ? <FieldError id="new-list-who-error">{whoError}</FieldError> : null}
            </Field>
          </form>
          </FloatingSheetPanelBody>
          <FloatingSheetPanelWorkflowFooter onCancel={close} primaryForm="new-list-form" primaryIconClassName="" primaryLabel={copyOf ? "Duplicate" : createListLabel()} />
        </FloatingSheetPanelContent>
      </FloatingSheetPanel>
      <DiscardChangesDialog open={asking} onKeep={() => setAsking(false)} onDiscard={() => { setAsking(false); onClose() }} body={`This ${skillListNoun()} has not been created.`} />
    </>
  )
}

/** The empty state's one action. */
export const createListLabel = (): string => `Create ${skillListNoun()}`
