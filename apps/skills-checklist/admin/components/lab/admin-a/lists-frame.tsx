"use client"

/** Chrome shared by both lists variants: header with the one primary action (New list), the demo states and the dialogs. */
import * as React from "react"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import { PageFrame } from "@/components/skills/page-header"
import { ErrorState, LoadingState } from "./parts"
import { EmptyBlock } from "@/components/lab/empty-block"
import { SampleDataBadge } from "@/components/lab/import/sample-badge"
import { useAdminData, type AdminData } from "./use-admin-data"
import { useListActions, useListsModel, type ListsModel } from "./lists-parts"

export interface ListsContext extends AdminData {
  model: ListsModel
  actions: ReturnType<typeof useListActions>
}

export function ListsFrame({ variant, children }: { variant: string; children: (c: ListsContext) => React.ReactNode }) {
  const data = useAdminData()
  return data.state ? <Ready data={data} variant={variant}>{children}</Ready> : <Shell variant={variant} onNew={() => undefined}><LoadingState label="Loading lists" /></Shell>
}

function Ready({ data, variant, children }: { data: AdminData; variant: string; children: (c: ListsContext) => React.ReactNode }) {
  const model = useListsModel(data.state!)
  const actions = useListActions(model)
  let body: React.ReactNode
  if (!data.ready) body = <LoadingState label="Loading lists" />
  else if (data.demo === "error") body = <ErrorState what="Lists" onRetry={data.retry} />
  else if (data.demo === "empty")
    body = (
      <EmptyBlock
        title="No lists yet"
        body="A list holds the skills a group of students works toward. Create one, then attach it to the cohorts it applies to."
        action={{ label: "Create a list" }}
        onAction={() => actions.openNew(null)}
      />
    )
  else body = children({ ...data, model, actions })
  return (
    <Shell variant={variant} onNew={() => actions.openNew(null)}>
      {actions.banner}
      {body}
      {actions.dialogs}
    </Shell>
  )
}

function Shell({ variant, onNew, children }: { variant: string; onNew: () => void; children: React.ReactNode }) {
  return (
    <PageFrame title="Lists" actions={<><SampleDataBadge /><Button type="button" variant="default" size="sm" onClick={onNew}>New list</Button></>}>
      <div className="flex flex-col gap-4" data-page-type="list" data-admin-lab={`lists-${variant}`}>
        {children}
      </div>
    </PageFrame>
  )
}
