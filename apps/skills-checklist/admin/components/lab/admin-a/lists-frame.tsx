"use client"

/**
 * Chrome shared by both lists variants, in two modes (Sankalp 2026-10-27: "didn't understand the screen at all").
 *  - assign: the "Assign the list to student groups" step of the set-up flow (or `?view=assign`). ONE job: which students use this list.
 *    T3 form page, title equal to the step, a header link on to course mapping (the next job, where per-course levels override
 *    what the list gives). No list management, no reporting figures. No footer (navigation model A, D-L42).
 *  - manage: the standalone Lists screen (manage flow). Title "Lists", one primary "New list".
 * No "Sample data" chip in either: lab labels belong to the lab bar, the page carries product chrome only (Romit 2026-10-27).
 */
import * as React from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import { PageFrame } from "@/components/skills/page-header"
import { FormPage } from "@/components/lab/layout/form-page"
import Link from "next/link"
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

/** Options for the manage page on the set-up flow's optional step (variants C and D, 2026-11-03). Absent keeps A and B as they were. */
export interface StepOptions {
  /** False drops the header "Assign to student groups" link on the flow step: the rows carry the actions. */
  stepFooter?: boolean
  /** A second header action beside New group of skills, given the assign step's href builder. */
  secondaryAction?: (assignHref: AssignHref) => React.ReactNode
}

/** `footerContext`: the assign mode's consequence line (what the assignment reaches), 10 words or fewer. */
export function ListsFrame({ variant, footerContext, options, children }: { variant: string; footerContext?: Render; options?: StepOptions; children: Render }) {
  const data = useAdminData()
  const mode = useListsMode()
  return data.state ? (
    <Ready data={data} variant={variant} mode={mode} footer={footerContext} options={options}>{children}</Ready>
  ) : (
    <Shell variant={variant} mode={mode} onNew={() => undefined} footerContext={null} options={options}>
      <LoadingState label={`Loading groups of ${skillNounPlural()}`} />
    </Shell>
  )
}

function Ready({ data, variant, mode, footer, options, children }: { data: AdminData; variant: string; mode: ListsMode; footer?: Render; options?: StepOptions; children: Render }) {
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
        body={`Group ${skillNounPlural()} you assign together. Optional: you can assign individual ${skillNounPlural()}.`}
        action={{ label: `New group of ${skillNounPlural()}` }}
        onAction={() => actions.openNew(null)}
      />
    )
  else body = children(c)
  return (
    <Shell variant={variant} mode={mode} onNew={() => actions.openNew(null)} banner={actions.banner} footerContext={ok && footer ? footer(c) : null} options={options}>
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

export type AssignHref = (extra?: Record<string, string | null | undefined>) => string

/**
 * The assign step's href. Straight to the flow's assign step: a same-screen link from a flow step would stay on this step
 * (lib/lab/links.ts stepFor). Off a flow it is this screen with view=assign.
 */
export function useAssignHref(): AssignHref {
  const to = useLabHref()
  const ctx = useLabLinkContext()
  return React.useCallback(
    (extra: Record<string, string | null | undefined> = {}) => {
      const flow = findFlow(ctx.flowId)
      if (!ctx.flowId || !flow || !stepOf(flow, "assign")) return to("admin/lists-cohorts", { view: "assign", ...extra })
      const q = Object.entries(extra).filter(([, v]) => !!v).map(([k, v]) => `&${k}=${encodeURIComponent(v!)}`).join("")
      return `${flowHref(ctx.flowId, "assign", ctx.set ?? "1", ctx.carry)}${q}`
    },
    [to, ctx],
  )
}

function Shell({ variant, mode, onNew, banner, footerContext, options, children }: { variant: string; mode: ListsMode; onNew: () => void; banner?: React.ReactNode; footerContext: React.ReactNode; options?: StepOptions; children: React.ReactNode }) {
  const to = useLabHref()
  const assignHref = useAssignHref()
  const assignTitle = useAssignTitle()
  const ctx = useLabLinkContext()
  const params = useSearchParams()
  // Navigation model A (D-L42): no flow footer on either mode. Page actions sit in the header (one filled at most); the way back
  // is the breadcrumb and the Skills panel.
  if (mode === "assign") {
    return (
      <div className="contents" data-admin-lab={`lists-${variant}`} data-lists-mode="assign">
        <FormPage
          title={assignTitle}
          banner={banner ?? undefined}
          actions={
            <Button asChild variant="outline" size="sm">
              <Link href={to("admin/course-mapping", { by: "skill" })}>Map to courses</Link>
            </Button>
          }
        >
          {children}
          {/* The consequence line (what the assignment reaches), once, where the footer used to carry it. */}
          {footerContext ? <p aria-live="polite" className="text-sm text-muted-foreground" data-assign-consequence>{footerContext}</p> : null}
        </FormPage>
      </div>
    )
  }
  // On the set-up flow's optional step (Sankalp's A4 "Create groups of skills, non mandatory") variants A and B offer the next job
  // in the header as an outline link; New group of skills stays the one filled action. C and D carry it on each row.
  const flow = findFlow(ctx.flowId)
  const onFlowStep = ctx.onFlowRoute && ctx.stepId === GROUPS_STEP && !!flow && !!stepOf(flow, "assign")
  const assignLink = onFlowStep && options?.stepFooter !== false
  const secondary = options?.secondaryAction?.(assignHref)
  return (
    <PageFrame
      title={`Groups of ${skillNounPlural()}`}
      actions={
        <>
          {secondary}
          {assignLink ? (
            <Button asChild variant="outline" size="sm">
              <Link href={assignHref({ list: params?.get("list") })}>Assign to student groups</Link>
            </Button>
          ) : null}
          <Button type="button" variant="default" size="sm" onClick={onNew}>{`New group of ${skillNounPlural()}`}</Button>
        </>
      }
    >
      <div className="flex flex-col gap-4" data-page-type="list" data-admin-lab={`lists-${variant}`} data-lists-mode="manage" data-optional-step={onFlowStep ? "" : undefined}>
        {banner}
        {children}
      </div>
    </PageFrame>
  )
}
