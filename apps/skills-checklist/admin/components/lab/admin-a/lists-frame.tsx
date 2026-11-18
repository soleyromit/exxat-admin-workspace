"use client"

/**
 * Skill lists: one page, one table, one panel (designer 2026-11-05, D-L106). Title, New skill list top right, the table. Assign is no longer a page: who a list is assigned to is in its panel.
 * An old link with `?view=assign` (or `?focus=`) lands here on that list's panel. The Set up skills wizard mounts the same page in its assign step.
 * No "Sample data" chip: lab labels belong to the lab bar, the page carries product chrome only (Romit 2026-10-27).
 */
import * as React from "react"
import { createListLabel } from "./lists-new-dialog"
import { useRouter, useSearchParams } from "next/navigation"
import { Tabs, TabsContent, TabsCountBadge, TabsList, TabsTrigger } from "@exxatdesignux/ui/components/ui/tabs"
import { HostActionsSlot, SettingsPage } from "@/components/lab/admin-b/settings-page"
import { useLabHref } from "@/components/lab/lab-bar/page-context"
import { categoryRows, isVocabularySection, tagRows } from "@/lib/lab/settings"
import { useV2State } from "@/lib/v2/react"
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
import { groupLabel, listForOldLink, programLists, setupDone, skillLists, type SkillList } from "@/lib/lab/lists"
import { SETUP_CONFIGURE, SETUP_PARAM } from "@/lib/lab/return-to"

export interface ListsContext extends AdminData {
  model: ListsModel
  actions: ReturnType<typeof useListActions>
}

type Render = (c: ListsContext) => React.ReactNode

/**
 * The page's three tabs (Romit 2026-11-16: "Categories and Tags are going to be a tab in the skill list page", then "make category and tags as separate
 * tabs instead of combined"): Skill lists, Categories (`?tab=categories`), Tags (`?tab=tags`).
 */
type ListsTab = "lists" | "categories" | "tags"

export function ListsFrame({ variant, children }: { variant: string; children: Render }) {
  const data = useAdminData()
  const params = useSearchParams()
  // Not inside the Set up skills wizard, which mounts this page as one of its steps.
  const vocab = params?.get("tab")
  if (variant !== "setup" && isVocabularySection(vocab)) {
    return (
      <Shell variant={variant} onNew={() => undefined} newInBody tab={vocab}>
        <SettingsPage scope="vocabulary" embedded />
      </Shell>
    )
  }
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
  // From a list's page, Choose from library (`?pick=1&list=<id>`): that list's skills picker, once.
  const pick = params?.get("pick") === "1"
  const picked = React.useRef(false)
  const { openSkills } = actions
  React.useEffect(() => {
    if (picked.current || !data.ready || !pick) return
    picked.current = true
    const id = params?.get("list")
    data.query.set({ pick: null })
    if (id) openSkills(id)
  }, [data.ready, pick]) // eslint-disable-line react-hooks/exhaustive-deps
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
    // Only the action (Sankalp 2026-11-16 [CALL 11-16], D-LS1116-d): one short line and Create skill list, no drawing or helper text.
    <section className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border px-4 py-12 text-center" data-lists-empty>
      <p className="text-sm text-muted-foreground">{`No ${skillListsNoun()} yet.`}</p>
      <Button type="button" variant="default" size="sm" onClick={() => actions.openNew()} data-new-list="">{createListLabel()}</Button>
    </section>
  )
  else body = children(c)
  return (
    <Shell variant={variant} onNew={() => actions.openNew()} newInBody={data.ready && noLists} banner={actions.banner}>
      {body}
      {actions.dialogs}
    </Shell>
  )
}

/** Skill lists, Categories and Tags, as DS line tabs. In the URL, a new history entry each, so reload and Back keep the tab. */
function ListsTabs({ value, children }: { value: ListsTab; children: React.ReactNode }) {
  const router = useRouter()
  const to = useLabHref()
  const state = useV2State()
  const counts: Record<ListsTab, number> = { lists: skillLists(programLists(state)).length, categories: categoryRows(state).length, tags: tagRows(state).length }
  const labels: Record<ListsTab, string> = { lists: capitalize(skillListsNoun()), categories: "Categories", tags: "Tags" }
  return (
    <Tabs value={value} onValueChange={(v) => router.push(to(v === "lists" ? "?" : `?tab=${v}`), { scroll: false })} className="flex flex-col gap-4">
      <TabsList variant="line" ariaLabel={`${capitalize(skillListsNoun())} sections`}>
        {(["lists", "categories", "tags"] as const).map((t) => (
          <TabsTrigger key={t} value={t} data-lists-tab={t}>
            {labels[t]}
            <TabsCountBadge count={counts[t]} />
          </TabsTrigger>
        ))}
      </TabsList>
      <TabsContent value={value} className="mt-0">{children}</TabsContent>
    </Tabs>
  )
}

function Shell({ variant, onNew, newInBody = false, banner, tab = "lists", children }: { variant: string; onNew: () => void; /** The empty state offers New skill list itself: it shows once. */ newInBody?: boolean; banner?: React.ReactNode; tab?: ListsTab; children: React.ReactNode }) {
  const body = (
    <div className="flex flex-col gap-4" data-page-type="list" data-admin-lab={`lists-${variant}`}>
      {banner}
      {children}
    </div>
  )
  // One header action slot, top right, for every tab (Romit 2026-11-16: "shift add a category, add a tag to the top right position besides skills list just like add a skill
  // button"): New skill list on Skill lists; on Categories or Tags the hosted page puts its Add a category or Add a tag here (HostActionsSlot).
  const [slot, setSlot] = React.useState<HTMLElement | null>(null)
  const actions = tab === "lists"
    ? (newInBody ? null : <Button type="button" variant="default" size="sm" onClick={onNew} data-new-list>{`New ${skillListNoun()}`}</Button>)
    : <div ref={setSlot} className="flex items-center gap-2" data-lists-header-actions />
  return (
    <PageFrame title={capitalize(skillListsNoun())} actions={actions}>
      <HostActionsSlot.Provider value={tab === "lists" ? null : slot}>
        {variant === "setup" ? body : <ListsTabs value={tab}>{body}</ListsTabs>}
      </HostActionsSlot.Provider>
    </PageFrame>
  )
}
