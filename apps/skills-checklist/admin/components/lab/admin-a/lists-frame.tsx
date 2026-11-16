"use client"

/**
 * Skill lists: one page, one table, one panel (designer 2026-11-05, D-L106). Title, New skill list top right, the table. Assign is no longer a page: who a list is assigned to is in its panel.
 * An old link with `?view=assign` (or `?focus=`) lands here on that list's panel. The Set up skills wizard mounts the same page in its assign step.
 * No "Sample data" chip: lab labels belong to the lab bar, the page carries product chrome only (Romit 2026-10-27).
 */
import * as React from "react"
import { FirstRun } from "@/components/lab/first-run"
import { useSearchParams } from "next/navigation"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import { PageFrame } from "@/components/skills/page-header"
import { LocalBanner } from "@exxatdesignux/ui/components/ui/banner"
import { LoadingState } from "./parts"
import { useAdminData, type AdminData } from "./use-admin-data"
import { useListActions, useListsModel, type ListsModel } from "@/components/lab/admin-a/lists-parts"
import { useOnePressAtATime } from "./lists-focus"
import { capitalize, countSkills, skillListNoun, skillListsNoun } from "@/lib/lab/terms"
import { useV2Store } from "@/lib/v2/react"
import { UPLOAD_RESULT_KEY } from "@/lib/lab/upload-result"
import { groupLabel, listForOldLink, setupDone, skillLists, type SkillList } from "@/lib/lab/lists"
import { SETUP_CONFIGURE, SETUP_PARAM } from "@/lib/lab/return-to"

export interface ListsContext extends AdminData {
  model: ListsModel
  actions: ReturnType<typeof useListActions>
}

type Render = (c: ListsContext) => React.ReactNode

export function ListsFrame({ variant, children }: { variant: string; children: Render }) {
  const data = useAdminData()
  return data.state ? (
    <Ready data={data} variant={variant}>{children}</Ready>
  ) : (
    <Shell variant={variant} onNew={() => undefined}>
      <LoadingState label={`Loading ${skillListsNoun()}`} />
    </Shell>
  )
}

/** `?state=empty` shows a program with no lists: the seeded ones are not offered, and a reload starts it empty again. */
function useEmptyDemoModel(base: ListsModel): ListsModel {
  const [lists, setLists] = React.useState<SkillList[]>([])
  return React.useMemo(() => ({ ...base, lists, setLists, applyNow: (change) => setLists(change) }), [base, lists])
}

function Ready({ data, variant, children }: { data: AdminData; variant: string; children: Render }) {
  const real = useListsModel(data.state!)
  const emptyDemo = useEmptyDemoModel(real)
  const model = data.demo === "empty" ? emptyDemo : real
  const actions = useListActions(model)
  useOnePressAtATime()
  const c: ListsContext = { ...data, model, actions }
  const noLists = skillLists(model.lists).length === 0
  const params = useSearchParams()
  // A "New skill list" deep link (?new=1, e.g. from Skills with ?from=skills) lands here: open the new list dialog once, over the lists it joins.
  const openedNew = React.useRef(false)
  const { openNew, askToAdd } = actions
  React.useEffect(() => {
    if (openedNew.current || !data.ready || data.demo === "error" || params?.get("new") !== "1") return
    openedNew.current = true
    openNew()
  }, [data.ready, data.demo, params, openNew])
  // An old Assign link, or Coverage's "Not assigned" naming a group: the list's panel, and when the group is not on it, Add students searching for that group.
  const view = params?.get("view")
  const focus = params?.get("focus")
  const followed = React.useRef(false)
  React.useEffect(() => {
    if (followed.current || !data.ready || (view !== "assign" && !focus)) return
    followed.current = true
    const list = listForOldLink(model.lists, params?.get("list"), focus)
    data.query.set({ view: null, who: null, focus: null, list: list?.id ?? null })
    const ask = focus && list && list.skillIds.length > 0 && !list.groupIds.includes(focus) && model.groups.some((g) => g.id === focus) ? groupLabel(model.groups, focus) : null
    if (list && ask) askToAdd(list.id, ask)
  }, [data.ready, view, focus]) // eslint-disable-line react-hooks/exhaustive-deps
  // Back from a bulk upload started on a list's panel (?uploaded=1): the result once, on that list's panel, with Undo for the list (the skills stay in the library).
  const store = useV2Store()
  const uploaded = params?.get("uploaded") === "1"
  const shownUpload = React.useRef(false)
  const { setFeedback } = actions
  React.useEffect(() => {
    if (shownUpload.current || !data.ready || !uploaded) return
    shownUpload.current = true
    data.query.set({ uploaded: null })
    let result: { listId: string; listName: string; added: number; before: unknown; after?: unknown } | null = null
    try { result = JSON.parse(window.sessionStorage.getItem(UPLOAD_RESULT_KEY) ?? "null"); window.sessionStorage.removeItem(UPLOAD_RESULT_KEY) } catch { result = null }
    if (!result) return
    const before = result.before
    setFeedback({
      title: `${countSkills(result.added)} added to ${result.listName}.`,
      body: "",
      listId: result.listId,
      // Undo restores the lists as they were before the upload, so it only runs while nothing else has changed them since: a later edit
      // (another upload, a rename, an assignment) would be lost. The skills the upload made stay in the library either way.
      action: { label: "Undo", onClick: () => {
        const now = JSON.stringify(store.getSnapshot().listEdits ?? null)
        if (result!.after !== undefined && now !== JSON.stringify(result!.after ?? null)) {
          setFeedback({ title: `${capitalize(skillListsNoun())} changed after the upload. Nothing was undone.`, body: "", listId: result!.listId, tone: "warning" })
          return
        }
        store.update((s) => ({ ...s, listEdits: (before ?? undefined) as typeof s.listEdits }))
        setFeedback({ title: "Change undone.", body: "", listId: result!.listId })
      } },
    })
  }, [data.ready, uploaded]) // eslint-disable-line react-hooks/exhaustive-deps
  // Back from Evaluation settings or one skill, left on step 3 of New skill list (`?setup=configure&list=<id>`, lib/lab/return-to): that step again.
  const resume = params?.get(SETUP_PARAM) === SETUP_CONFIGURE
  const resumed = React.useRef(false)
  const { resumeSetup } = actions
  React.useEffect(() => {
    if (resumed.current || !data.ready || !resume) return
    resumed.current = true
    const id = params?.get("list")
    // The param stays while the step is open (lists-parts keeps it and takes it off when the wizard ends), so Back from a page reached from step 3
    // returns to step 3 again. A list whose setup was finished opens as the list: an entry from before the finish must not reopen its setup.
    if (id && skillLists(model.lists).some((l) => l.id === id) && !setupDone(id)) resumeSetup(id)
    else data.query.set({ [SETUP_PARAM]: null })
  }, [data.ready, resume]) // eslint-disable-line react-hooks/exhaustive-deps
  // A link to a list that is not there (deleted, or from another session) opens nothing.
  const openId = params?.get("list") ?? null
  const { closePanel } = actions
  React.useEffect(() => {
    if (data.ready && openId && !skillLists(model.lists).some((l) => l.id === openId)) closePanel()
  }, [data.ready, openId, model.lists]) // eslint-disable-line react-hooks/exhaustive-deps
  let body: React.ReactNode
  if (!data.ready) body = <LoadingState label={`Loading ${skillListsNoun()}`} />
  else if (data.demo === "error") body = (
    // `action`, not the banner's `retry`, which draws an icon on a text button (map E rule 5).
    <LocalBanner variant="error" title={`${capitalize(skillListsNoun())} did not load`} action={{ label: "Try again", onClick: data.retry }}>
      Nothing was changed. Check your connection and try again.
    </LocalBanner>
  )
  else if (noLists) body = (
    // New skill list is the page's one filled button (map D6, E rule 5).
    <FirstRun scene="lists" title={`Start your first ${skillListNoun()}`} actions={<Button type="button" variant="default" size="sm" onClick={() => actions.openNew()} data-new-list="">{`New ${skillListNoun()}`}</Button>} />
  )
  else body = children(c)
  return (
    <Shell variant={variant} onNew={() => actions.openNew()} newInBody={data.ready && noLists} banner={actions.banner}>
      {body}
      {actions.dialogs}
    </Shell>
  )
}

function Shell({ variant, onNew, newInBody = false, banner, children }: { variant: string; onNew: () => void; /** The empty state offers New skill list itself: it shows once. */ newInBody?: boolean; banner?: React.ReactNode; children: React.ReactNode }) {
  return (
    <PageFrame
      title={capitalize(skillListsNoun())}
      actions={newInBody ? null : <Button type="button" variant="default" size="sm" onClick={onNew} data-new-list>{`New ${skillListNoun()}`}</Button>}
    >
      <div className="flex flex-col gap-4" data-page-type="list" data-admin-lab={`lists-${variant}`}>
        {banner}
        {children}
      </div>
    </PageFrame>
  )
}
