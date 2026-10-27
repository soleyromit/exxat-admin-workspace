"use client"

/**
 * Chrome shared by both lists variants, in two modes (Sankalp 2026-10-27: "didn't understand the screen at all").
 *  - assign: the "Assign the list to student groups" step of the set-up flow (or `?view=assign`). ONE job: which students use this list.
 *    T3 form page, title equal to the step, a sticky footer whose one primary goes on to course mapping (the next job, where
 *    per-course levels override what the list gives). No list management, no reporting figures.
 *  - manage: the standalone Lists screen (manage flow). Title "Lists", one primary "New list".
 * No "Sample data" chip in either: lab labels belong to the lab bar, the page carries product chrome only (Romit 2026-10-27).
 */
import * as React from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import { PageFrame } from "@/components/skills/page-header"
import { FormPage } from "@/components/lab/layout/form-page"
import { StickyFooter } from "@/components/lab/layout/sticky-footer"
import { useLabHref, useLabLinkContext } from "@/components/lab/lab-bar/page-context"
import { ErrorState, LoadingState } from "./parts"
import { EmptyBlock } from "@/components/lab/empty-block"
import { useAdminData, type AdminData } from "./use-admin-data"
import { useListActions, useListsModel, type ListsModel } from "./lists-parts"
import { skillNounPlural } from "@/lib/lab/terms"
import { findFlow, flowHref, stepOf } from "@/lib/lab/flows"

export type ListsMode = "assign" | "manage"

/** The page title in assign mode: the flow step's own words, so the step and the page never disagree. */
export const ASSIGN_TITLE = "Assign skills to student groups"
/** The set-up flow's optional step before assigning (Sankalp's A4). */
export const GROUPS_STEP = "lists"

export interface ListsContext extends AdminData {
  model: ListsModel
  actions: ReturnType<typeof useListActions>
  mode: ListsMode
}

type Render = (c: ListsContext) => React.ReactNode

/** Assign mode on the flow's "assign" step, or on any lists URL with `view=assign`. */
export function useListsMode(): ListsMode {
  const ctx = useLabLinkContext()
  const params = useSearchParams()
  return ctx.stepId === "assign" || params?.get("view") === "assign" ? "assign" : "manage"
}

/** `footerContext`: the assign mode's footer line (what the assignment reaches), 10 words or fewer. */
export function ListsFrame({ variant, footerContext, children }: { variant: string; footerContext?: Render; children: Render }) {
  const data = useAdminData()
  const mode = useListsMode()
  return data.state ? (
    <Ready data={data} variant={variant} mode={mode} footer={footerContext}>{children}</Ready>
  ) : (
    <Shell variant={variant} mode={mode} onNew={() => undefined} footerContext={null}>
      <LoadingState label={`Loading groups of ${skillNounPlural()}`} />
    </Shell>
  )
}

function Ready({ data, variant, mode, footer, children }: { data: AdminData; variant: string; mode: ListsMode; footer?: Render; children: Render }) {
  const model = useListsModel(data.state!)
  const actions = useListActions(model)
  const c: ListsContext = { ...data, model, actions, mode }
  const ok = data.ready && !data.demo
  // A "New group of skills" deep link (?new=1, e.g. from Skills with ?from=skills) lands here: open the new group dialog once, over the groups it joins.
  const params = useSearchParams()
  const openedNew = React.useRef(false)
  const { openNew } = actions
  React.useEffect(() => {
    if (openedNew.current || !ok || mode !== "manage" || params?.get("new") !== "1") return
    openedNew.current = true
    openNew(null)
  }, [ok, mode, params, openNew])
  let body: React.ReactNode
  if (!data.ready) body = <LoadingState label={`Loading groups of ${skillNounPlural()}`} />
  else if (data.demo === "error") body = <ErrorState what={`Groups of ${skillNounPlural()}`} onRetry={data.retry} />
  else if (data.demo === "empty")
    body = (
      <EmptyBlock
        title={`No groups of ${skillNounPlural()} yet`}
        body={`Group ${skillNounPlural()} you assign together. Optional: you can assign ${skillNounPlural()} one at a time.`}
        action={{ label: `New group of ${skillNounPlural()}` }}
        onAction={() => actions.openNew(null)}
      />
    )
  else body = children(c)
  return (
    <Shell variant={variant} mode={mode} onNew={() => actions.openNew(null)} banner={actions.banner} footerContext={ok && footer ? footer(c) : null}>
      {body}
      {actions.dialogs}
    </Shell>
  )
}

/** The flow step's own label when the page is a flow step, so the step, the breadcrumb and the page title say one thing. */
function useAssignTitle(): string {
  const ctx = useLabLinkContext()
  const flow = findFlow(ctx.flowId)
  return (flow && ctx.stepId ? stepOf(flow, ctx.stepId)?.label : undefined) ?? ASSIGN_TITLE
}

function Shell({ variant, mode, onNew, banner, footerContext, children }: { variant: string; mode: ListsMode; onNew: () => void; banner?: React.ReactNode; footerContext: React.ReactNode; children: React.ReactNode }) {
  const to = useLabHref()
  const assignTitle = useAssignTitle()
  const ctx = useLabLinkContext()
  const params = useSearchParams()
  // Only a flow whose next job is the assign step (set-up): keep-library-right also has a "lists" step, and there the page is
  // plain list management with no assign step to move on to (a link to it would name a step that flow does not have).
  const flow = findFlow(ctx.flowId)
  const onFlowStep = ctx.onFlowRoute && ctx.stepId === GROUPS_STEP && !!flow && !!stepOf(flow, "assign")
  if (mode === "assign") {
    return (
      <div className="contents" data-admin-lab={`lists-${variant}`} data-lists-mode="assign">
        <FormPage
          title={assignTitle}
          banner={banner ?? undefined}
          footer={<StickyFooter context={footerContext} primary={{ label: "Map to courses", href: to("admin/course-mapping") }} />}
        >
          {children}
        </FormPage>
      </div>
    )
  }
  // On the set-up flow's optional step (Sankalp's A4 "Create groups of skills, non mandatory"), the footer moves on to assigning:
  // Skip goes to individual skills (no group needed), the one primary assigns the groups. New group of skills turns outline so
  // the page keeps one filled primary.
  const optionalStep = onFlowStep
  // Straight to the flow's assign step: a same-screen link from a flow step would stay on this step (lib/lab/links.ts stepFor).
  const assignHref = (extra: Record<string, string | null | undefined> = {}) => {
    if (!ctx.flowId) return to("admin/lists-cohorts", { view: "assign", ...extra })
    const q = Object.entries(extra).filter(([, v]) => !!v).map(([k, v]) => `&${k}=${encodeURIComponent(v!)}`).join("")
    return `${flowHref(ctx.flowId, "assign", ctx.set ?? "1", ctx.carry)}${q}`
  }
  return (
    // On the flow step the page takes the full height so its footer sits at the bottom like every other setup step, instead of
    // floating under a three-row table above an empty page (Romit 2026-10-27). Nothing is added to fill the space.
    <div className={optionalStep ? "flex min-h-[calc(100dvh-5.5rem)] w-full flex-col" : undefined}>
      <PageFrame title={`Groups of ${skillNounPlural()}`} actions={<Button type="button" variant={optionalStep ? "outline" : "default"} size="sm" onClick={onNew}>{`New group of ${skillNounPlural()}`}</Button>} className={optionalStep ? "flex-1" : undefined}>
        <div className={optionalStep ? "flex flex-1 flex-col gap-4" : "flex flex-col gap-4"} data-page-type="list" data-admin-lab={`lists-${variant}`} data-lists-mode="manage" data-optional-step={optionalStep ? "" : undefined}>
          {banner}
          {children}
          {optionalStep ? (
            <StickyFooter
              className="mt-auto"
              secondary={{ label: "Skip", href: assignHref({ by: "skills" }) }}
              primary={{ label: "Assign to student groups", href: assignHref({ list: params?.get("list") }) }}
            />
          ) : null}
        </div>
      </PageFrame>
    </div>
  )
}
